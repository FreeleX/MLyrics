try {
Components.utils.import("resource://app/jsmodules/sbProperties.jsm");
Components.utils.import("resource://app/jsmodules/sbLibraryUtils.jsm");
Components.utils.import("resource://app/jsmodules/sbColumnSpecParser.jsm");
Components.utils.import("resource://app/jsmodules/SBJobUtils.jsm");
Components.utils.import("resource://app/jsmodules/StringUtils.jsm");
}
catch (error) {alert("MLyrics: Unexpected error - module import error\n\n" + error)}

// We need to have base object
if (typeof(this.mlyrics) !== 'object') {
	this.mlyrics = {};
}

( function () {
	
	var hasLyricsProperty = "http://songbirdnest.com/data/1.0#hasLyrics";
	
	// Observe install\uninstall
	if (typeof(mlyrics.hasLyrObserver) !== 'object') {
		mlyrics.hasLyrObserver = {
			
			_uninstall : false,
			list : null,
			traceGuid: "{6039188e-d135-11df-bcc9-c7e1ded72085}",
			
			observe : function(subject, topic, data) {
				switch(topic) {
					case "em-action-requested":
						// Extension has been flagged to be uninstalled
						subject.QueryInterface(Components.interfaces.nsIUpdateItem);
						if (subject.id == this.traceGuid) {
							if (data == "item-uninstalled") {
								this._uninstall = true;
							} else if (data == "item-cancel-action")
								this._uninstall = false;
						}
						break;
						
					case "quit-application-granted":
						if (this._uninstall)
							this.uninstallCleanup();
						break;
				}
			},
			
			register : function() {
				var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
				observerService.addObserver(this, "em-action-requested", false);
				observerService.addObserver(this, "quit-application-granted", false);
				this.observerService = observerService;
			
			},
			
			unregister : function() {
				this.observerService.removeObserver(this, "em-action-requested");
				this.observerService.removeObserver(this, "quit-application-granted");
			},
			
			uninstallCleanup : function() {
				var mainLib = Components.classes['@songbirdnest.com/Songbird/library/Manager;1'].getService(Components.interfaces.sbILibraryManager).mainLibrary;
				var colSpec = mainLib.getProperty(SBProperties.columnSpec);
				
				var propRe = new RegExp("\\s+"+hasLyricsProperty+" \\d+","g");
				if (colSpec.indexOf(hasLyricsProperty)) {
					colSpec = colSpec.replace(propRe, "");
					mainLib.setProperty(SBProperties.columnSpec, colSpec);
				}
				
				var colSpec = mainLib.getProperty(SBProperties.defaultColumnSpec);
				if (colSpec.indexOf(hasLyricsProperty)) {
					colSpec = colSpec.replace(propRe, "");
					mainLib.setProperty(SBProperties.defaultColumnSpec, colSpec);
				}
			}
		}
	}
	
	// Trace hasLyrics
	if (typeof(mlyrics.watchLib) !== 'object') {
		mlyrics.watchLib = {
			
			watchLibMain: "",
			
			init: function() {
				this.watchLibMain = Cc['@songbirdnest.com/Songbird/library/Manager;1'].getService(Components.interfaces.sbILibraryManager).mainLibrary;
				
				this.watchLibMain.addListener(this, false, this.watchLibMain.LISTENER_FLAGS_ITEMUPDATED | this.watchLibMain.LISTENER_FLAGS_ITEMADDED);
			},
			
			onItemUpdated: function(list, item, index) {
				mlyrics.lib.fixHasLyr(item);
				
			},
			
			onItemAdded: function(list, item, index) {
				var lyrics=item.getProperty("http://songbirdnest.com/data/1.0#lyrics");
				
				if (lyrics != null)
				{
					this.onItemUpdated(list, item, index);
				}
				
			},
			
			shutdown: function() {
				this.watchLibMain.removeListener(this);
			}
			
		}
	}
	
	if (typeof(mlyrics.base) !== 'object') {
		mlyrics.base = {
			onLoad: function() {
				if (Application.prefs.getValue("extensions.mlyrics.firstrun", true))
				{
					dump("running setup of colspec\n");
					try {
						this.setupColspec();
					} catch (e) {
						dump("exception: " + e + "\n");
					}
					
					Application.prefs.setValue("extensions.mlyrics.firstrun", false);
				}
				
				this.setupLyricsProperty();
				this.setupSmartListProperty();
				mlyrics.hasLyrObserver.register();
				mlyrics.watchLib.init();
			},
			
			onUnLoad: function() {
				mlyrics.watchLib.shutdown();
			},
			
			// rebuild the column spec strings
			makeSpecString: function(aArray) {
				var spec = "";
				for (var i=0;i<aArray.length;i++) {
					var col = aArray[i];
					if (spec != "") spec += " ";
					spec += col.property;
					if (col.width) {
						spec += " ";
						spec += col.width;
					}
					if (col.sort) {
						if (col.sort == "ascending") {
							col.sort = "a";
						}
						else if (col.sort == "descending") {
							col.sort = "d";
						}
						spec += " ";
						spec += col.sort;
					}
				}
				return spec;
			},
			
			setupColspec: function() {
				var colSpec = new ColumnSpecParser(LibraryUtils.mainLibrary, null, null, "audio");
				var colSpecStr = this.makeSpecString(colSpec.columnMap);
				if (colSpec != null) {
					dump("colspecstr: " + colSpecStr + "\n");
					if (colSpecStr.indexOf(hasLyricsProperty) == -1) {
						ColumnSpecParser.reduceWidthsProportionally(colSpec.columnMap, 45);
						colSpecStr = this.makeSpecString(colSpec.columnMap) + " " + hasLyricsProperty + " 10";
						dump("colspecstr new: " + colSpecStr + "\n");
						LibraryUtils.mainLibrary.setProperty(SBProperties.columnSpec+"+(audio)", colSpecStr);
					}
				}
			},
			
			setupLyricsProperty: function() {
				var pMgr = Cc["@songbirdnest.com/Songbird/Properties/PropertyManager;1"].getService(Components.interfaces.sbIPropertyManager);
				if (!pMgr.hasProperty(hasLyricsProperty)) {
					var bundle = new SBStringBundle("chrome://mlyrics/locale/overlay.properties");
					var builder = Cc["@songbirdnest.com/Songbird/Properties/Builder/Image;1"].createInstance(Components.interfaces.sbIImagePropertyBuilder);
					builder.propertyID = hasLyricsProperty;
					builder.displayName = bundle.get("colLyrLabel", "Lyrics");
					builder.userEditable = false;
					builder.userViewable = true;
					var pI = builder.get();
					pMgr.addPropertyInfo(pI);
				}
			},
			
			setupSmartListProperty: function () {
				var registrar = Components.classes["@songbirdnest.com/Songbird/SmartPlaylistPropertyRegistrar;1"].getService(Components.interfaces.sbISmartPlaylistPropertyRegistrar);
				var pm = Components.classes["@songbirdnest.com/Songbird/Properties/PropertyManager;1"].getService(Components.interfaces.sbIPropertyManager);
				var props = registrar.getPropertiesForContext("default");
				
				var alreadyAdded = false;
				while (props.hasMoreElements()) {
					var prop = props.getNext();
					if (prop instanceof Components.interfaces.sbISmartPlaylistProperty) {
						prop = prop.propertyID;
						if (pm.getPropertyInfo(prop).id == "http://songbirdnest.com/data/1.0#lyrics") {
							alreadyAdded = true;
							break;
						}
					}
				}
				
				if (!alreadyAdded) {
					registrar.registerPropertyToContext("default", "http://songbirdnest.com/data/1.0#lyrics", 1, "a");
				}
			},
			
			openHelp: function() {
				SBOpenWindow("chrome://mlyrics/content/xul/help.xul",
					     "mlyrics",
					     "all,chrome,centerscreen");
			}
		}
	}
} ) ();

window.addEventListener("load",   function(e) { mlyrics.base.onLoad(); },   false);
window.addEventListener("unload", function(e) { mlyrics.base.onUnLoad(); }, false);
