if (typeof(Cc) == "undefined") var Cc = Components.classes;
if (typeof(Ci) == "undefined") var Ci = Components.interfaces;
if (typeof(Cu) == "undefined") var Cu = Components.utils;

try {
Components.utils.import("resource://app/jsmodules/ArrayConverter.jsm");
Components.utils.import("resource://app/jsmodules/sbProperties.jsm");
}
catch (error) {alert("MLyrics: Unexpected error - module import error\n\n" + error)}

// We need to have base object
if (typeof(this.mlyrics) !== 'object') {
	this.mlyrics = {};
}

mlyrics.pane = {
	
	ourDisplayPane: 	null,
	gMM: 			null,
	xulRuntime:		null,
	mediaCoreManager:	null,
	localFile:		null,
	timeTracksFile:		null,
	metadataService:	null,
	clipboardHelper:	null,
	displayPaneManager:	null,
	displayPane:		null,
	gBrowser: 		null,
	songbirdWindow:		null,
	prefs: 			null,
	defprefs: 		null,
	btnsBoxViewTimeout:	null,
	btnsBoxStartShowTimeout:null,

	savedWidth:		250,
	
	pStrings: {
		bigyes: "",
		asktosave: "",
		asktosaveAll: "",
		lyrnotfound: "",
		websearch: "",
		posNotifs: "",
		clktoSus: "",
		negNotifs: "",
		clktoEnab: "",
		foundLostLyricsNotif: "",
		foundLRCNotif: "",
		lostLRCNotif: "",
		lrcSyncFail: ""
	},
	
	enableNotifications: function (enable) {
		if (enable) {
			this.prefs.setBoolPref("showNotifs", true);
			document.getElementById("notifEnabledBtn").checked = true;
			document.getElementById("notifEnabledMenuItem").setAttribute("checked", "true");
		}
		else {
			this.prefs.setBoolPref("showNotifs", false);
			document.getElementById("notifEnabledBtn").checked = false;
			document.getElementById("notifEnabledMenuItem").setAttribute("checked", "false");
		}
	},
	
	init: function () {
		this.gMM = Components.classes["@songbirdnest.com/Songbird/Mediacore/Manager;1"].getService(Components.interfaces.sbIMediacoreManager);
		
		this.xulRuntime = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULRuntime);

		this.mediaCoreManager = Components.classes["@songbirdnest.com/Songbird/Mediacore/Manager;1"].getService(Components.interfaces.sbIMediacoreManager);
		
		this.localFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
		this.timeTracksFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
		
		this.metadataService = Components.classes["@songbirdnest.com/Songbird/FileMetadataService;1"].getService(Components.interfaces.sbIFileMetadataService);
		
		this.clipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"].getService(Components.interfaces.nsIClipboardHelper);
		
		this.songbirdWindow = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator)
													.getMostRecentWindow("Songbird:Main").
													window;
		this.gBrowser = this.songbirdWindow.gBrowser;
		
		// Get our displayPane
		this.displayPaneManager = Components.classes["@songbirdnest.com/Songbird/DisplayPane/Manager;1"].getService(Components.interfaces.sbIDisplayPaneManager);
		var dpInstantiator = this.displayPaneManager.getInstantiatorForWindow(window);
		this.displayPane = dpInstantiator.displayPane;
													
		this.prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.mlyrics.");
		this.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
		
		this.defprefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getDefaultBranch("extensions.mlyrics.");
		
		var gBundle = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
		var strings = gBundle.createBundle("chrome://mlyrics/locale/overlay.properties");
		
		this.pStrings.bigyes 			= strings.GetStringFromName("bigyes");
		this.pStrings.asktosave 		= strings.GetStringFromName("asktosave");
		this.pStrings.asktosaveAll		= strings.GetStringFromName("asktosaveAll");
		this.pStrings.lyrnotfound 		= strings.GetStringFromName("lyrnotfound");
		this.pStrings.websearch 		= strings.GetStringFromName("websearch");
		this.pStrings.posNotifs 		= strings.GetStringFromName("posNotifs");
		this.pStrings.clktoSus 			= strings.GetStringFromName("clktoSus");
		this.pStrings.negNotifs 		= strings.GetStringFromName("negNotifs");
		this.pStrings.clktoEnab 		= strings.GetStringFromName("clktoEnab");
		this.pStrings.foundLostLyricsNotif 	= strings.GetStringFromName("foundLostLyricsNotif");
		this.pStrings.foundLRCNotif 		= strings.GetStringFromName("foundLRCNotif");
		this.pStrings.lostLRCNotif 		= strings.GetStringFromName("lostLRCNotif");
		this.pStrings.lrcSyncFail		= strings.GetStringFromName("lrcSyncFail");
		
		var displayPaneManager = Components.classes["@songbirdnest.com/Songbird/DisplayPane/Manager;1"].getService(Components.interfaces.sbIDisplayPaneManager);
		var dpInstantiator = displayPaneManager.getInstantiatorForWindow(window);
		if (dpInstantiator) {
			this.ourDisplayPane = dpInstantiator.displayPane;
		}
		
		mlyrics.lib.debugOutput("Pane intitialization finished");
	},

	onBtnsboxSeparatorMouseover: function () {
		if (document.getElementById("mlyrics-btnsbox").hidden) {
			if (!mlyrics.pane.btnsBoxViewTimeout) {
				mlyrics.pane.btnsBoxStartShowTimeout = setTimeout(function () {mlyrics.pane.hideBtnsbox(false);}, 500);
			}
		}
	},

	onBtnsboxSeparatorMouseout: function () {
		clearTimeout(mlyrics.pane.btnsBoxStartShowTimeout);
	},

	onBtnsboxMouseover: function (event) {
		mlyrics.pane.hideBtnsbox(false, true);
	},

	onBtnsboxMouseout: function (event) {
		if (!mlyrics.pane.btnsBoxViewTimeout) mlyrics.pane.btnsBoxViewTimeout = setTimeout(function () {mlyrics.pane.hideBtnsbox(true, -1);}, 500);
	},

	onBtnsboxMouseScroll: function (event) {
		if (!mlyrics.pane.prefs.getBoolPref("scrollEnable")) return;

		document.getElementById("accelerateScale").value += event.detail/3*2;
	},

	hideBtnsbox: function (needHide, force) {
		if (needHide == -1) {
			if (mlyrics.pane.btnsBoxViewTimeout) document.getElementById("mlyrics-btnsbox").hidden = true;
		}
		else if (needHide) {
			if (!document.getElementById("mlyrics-btnsbox").hidden) {
				document.getElementById("mlyrics-btnsbox").hidden = true;
				if (!mlyrics.pane.fullScreenMode.fullScreen)
					mlyrics.pane.displayPane.width = parseInt(mlyrics.pane.displayPane.width, 10) - 35;
			}
		}
		else {
			if (document.getElementById("mlyrics-btnsbox").hidden) {
				document.getElementById("mlyrics-btnsbox").hidden = false;
				if (!mlyrics.pane.fullScreenMode.fullScreen)
					mlyrics.pane.displayPane.width = parseInt(mlyrics.pane.displayPane.width, 10) + 35;
			}
		}
		
		if (force) {
			if (mlyrics.pane.btnsBoxViewTimeout) {
				clearTimeout(mlyrics.pane.btnsBoxViewTimeout);
				mlyrics.pane.btnsBoxViewTimeout = null;
			}
		}
	},

	openAndReuseOneTabPerAttribute: function (attrName, url) {
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
				.getService(Components.interfaces.nsIWindowMediator);
		var tabbrowser = wm.getMostRecentWindow("Songbird:Main").gBrowser;
		
		var nsIURI = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService).newURI("http://www.google.com", null, null);
		
		for (var found = false, index = 0; index < tabbrowser.tabContainer.childNodes.length && !found; index++) {
			
			// Get the next tab
			var currentTab = tabbrowser.tabContainer.childNodes[index];
			
			// Does this tab contain our custom attribute?
			if (currentTab.hasAttribute(attrName)) {
				
				// Yes--select and focus it.
				tabbrowser.selectedTab = currentTab;
				
				// Focus *this* browser window in case another one is currently focused
				tabbrowser.ownerDocument.defaultView.focus();
				found = true;
			}
		}
		
		if (!found) {
			// Our tab isn't open. Open it now.
			
			// Create tab
			var newTab = tabbrowser.addTab(url, nsIURI);
			newTab.setAttribute(attrName, "xyz");
			
			// Focus tab
			tabbrowser.selectedTab = newTab;
			
			// Focus *this* browser window in case another one is currently focused
			tabbrowser.ownerDocument.defaultView.focus();
		}
		else {
			tabbrowser.getBrowserForTab(currentTab).loadURI(url, nsIURI);
		}
	},

	preferencesObserver: {
		register: function () {
			mlyrics.pane.prefs.addObserver("", this, false);
		},
		
		unregister: function () {
			mlyrics.pane.prefs.removeObserver("", this);
		},
		
		observe: function (aSubject, aTopic, aData) {
			
			if(aTopic != "nsPref:changed") return;

			if (!mlyrics.pane.fullScreenMode.fullScreen)
				var fullScreenStr = "";
			else
				var fullScreenStr = "fullScreen_";
			
			switch (aData) {
				case fullScreenStr + "styleSheet":
					this.updateStyle();
					break;
					
				case fullScreenStr + "showStaticPicIf":
				case fullScreenStr + "BGImagePos":
					
				case fullScreenStr + "backgroundType":
				case fullScreenStr + "backgroundImage":
				case fullScreenStr + "backgroundColor":
				
				case fullScreenStr + "lyricsSize":
				case fullScreenStr + "lrcLyricsSize":
				case fullScreenStr + "transLyricsSize":
				case fullScreenStr + "artistSize":
				case fullScreenStr + "albumSize":
				case fullScreenStr + "titleSize":
				
				case fullScreenStr + "lyricsColor":
				case fullScreenStr + "lrcLyricsColor":
				case fullScreenStr + "transLyricsColor":
				case fullScreenStr + "artistColor":
				case fullScreenStr + "albumColor":
				case fullScreenStr + "titleColor":

				case fullScreenStr + "lyricsBGColorEnable":
				case fullScreenStr + "lrcLyricsBGColorEnable":
				case fullScreenStr + "transLyricsBGColorEnable":
				case fullScreenStr + "artistBGColorEnable":
				case fullScreenStr + "albumBGColorEnable":
				case fullScreenStr + "titleBGColorEnable":
					
				case fullScreenStr + "lyricsBGColor":
				case fullScreenStr + "lrcLyricsBGColor":
				case fullScreenStr + "transLyricsBGColor":
				case fullScreenStr + "artistBGColor":
				case fullScreenStr + "albumBGColor":
				case fullScreenStr + "titleBGColor":
					
				case fullScreenStr + "lyricsAlign":
				case fullScreenStr + "lrcLyricsAlign":
				case fullScreenStr + "transLyricsAlign":
				case fullScreenStr + "artistAlign":
				case fullScreenStr + "albumAlign":
				case fullScreenStr + "titleAlign":
					
				case fullScreenStr + "lyricsOpacity":
				case fullScreenStr + "lrcLyricsOpacity":
				case fullScreenStr + "transLyricsOpacity":
				case fullScreenStr + "artistOpacity":
				case fullScreenStr + "albumOpacity":
				case fullScreenStr + "titleOpacity":
					
				case fullScreenStr + "lyricsBold":
				case fullScreenStr + "lrcLyricsBold":
				case fullScreenStr + "transLyricsBold":
				case fullScreenStr + "artistBold":
				case fullScreenStr + "albumBold":
				case fullScreenStr + "titleBold":
					
				case fullScreenStr + "lyricsItalic":
				case fullScreenStr + "lrcLyricsItalic":
				case fullScreenStr + "transLyricsItalic":
				case fullScreenStr + "artistItalic":
				case fullScreenStr + "albumItalic":
				case fullScreenStr + "titleItalic":
					
				case fullScreenStr + "lyricsUnderlined":
				case fullScreenStr + "lrcLyricsUnderlined":
				case fullScreenStr + "transLyricsUnderlined":
				case fullScreenStr + "artistUnderlined":
				case fullScreenStr + "albumUnderlined":
				case fullScreenStr + "titleUnderlined":
					
				case fullScreenStr + "lyricsMarginTop":
				case fullScreenStr + "lrcLyricsMarginTop":
				case fullScreenStr + "transLyricsMarginTop":
				case fullScreenStr + "artistMarginTop":
				case fullScreenStr + "albumMarginTop":
				case fullScreenStr + "titleMarginTop":
					
				case fullScreenStr + "lyricsMarginBottom":
				case fullScreenStr + "lrcLyricsMarginBottom":
				case fullScreenStr + "transLyricsMarginBottom":
				case fullScreenStr + "artistMarginBottom":
				case fullScreenStr + "albumMarginBottom":
				case fullScreenStr + "titleMarginBottom":

				case fullScreenStr + "lyricsMarginLeft":
				case fullScreenStr + "lrcLyricsMarginLeft":
				case fullScreenStr + "transLyricsMarginLeft":
				case fullScreenStr + "artistMarginLeft":
				case fullScreenStr + "albumMarginLeft":
				case fullScreenStr + "titleMarginLeft":

				case fullScreenStr + "lyricsMarginRight":
				case fullScreenStr + "lrcLyricsMarginRight":
				case fullScreenStr + "transLyricsMarginRight":
				case fullScreenStr + "artistMarginRight":
				case fullScreenStr + "albumMarginRight":
				case fullScreenStr + "titleMarginRight":

				case fullScreenStr + "lyricsFont":
				case fullScreenStr + "lrcLyricsFont":
				case fullScreenStr + "transLyricsFont":
				case fullScreenStr + "artistFont":
				case fullScreenStr + "albumFont":
				case fullScreenStr + "titleFont":

				case fullScreenStr + "lyricsStyleEnable":
				case fullScreenStr + "lrcLyricsStyleEnable":
				case fullScreenStr + "transLyricsStyleEnable":
				case fullScreenStr + "artistStyleEnable":
				case fullScreenStr + "albumStyleEnable":
				case fullScreenStr + "titleStyleEnable":

				case fullScreenStr + "lyricsAlignEnable":
				case fullScreenStr + "lrcLyricsAlignEnable":
				case fullScreenStr + "transLyricsAlignEnable":
				case fullScreenStr + "artistAlignEnable":
				case fullScreenStr + "albumAlignEnable":
				case fullScreenStr + "titleAlignEnable":

				case fullScreenStr + "lyricsColorEnable":
				case fullScreenStr + "lrcLyricsColorEnable":
				case fullScreenStr + "transLyricsColorEnable":
				case fullScreenStr + "artistColorEnable":
				case fullScreenStr + "albumColorEnable":
				case fullScreenStr + "titleColorEnable":

				case fullScreenStr + "lyricsBGColorEnable":
				case fullScreenStr + "lrcLyricsBGColorEnable":
				case fullScreenStr + "transLyricsBGColorEnable":
				case fullScreenStr + "artistBGColorEnable":
				case fullScreenStr + "albumBGColorEnable":
				case fullScreenStr + "titleBGColorEnable":

				case fullScreenStr + "lyricsSizeEnable":
				case fullScreenStr + "lrcLyricsSizeEnable":
				case fullScreenStr + "transLyricsSizeEnable":
				case fullScreenStr + "artistSizeEnable":
				case fullScreenStr + "albumSizeEnable":
				case fullScreenStr + "titleSizeEnable":

				case fullScreenStr + "lyricsMarginTopEnable":
				case fullScreenStr + "lrcLyricsMarginTopEnable":
				case fullScreenStr + "transLyricsMarginTopEnable":
				case fullScreenStr + "artistMarginTopEnable":
				case fullScreenStr + "albumMarginTopEnable":
				case fullScreenStr + "titleMarginTopEnable":

				case fullScreenStr + "lyricsMarginBottomEnable":
				case fullScreenStr + "lrcLyricsMarginBottomEnable":
				case fullScreenStr + "transLyricsMarginBottomEnable":
				case fullScreenStr + "artistMarginBottomEnable":
				case fullScreenStr + "albumMarginBottomEnable":
				case fullScreenStr + "titleMarginBottomEnable":

				case fullScreenStr + "lyricsMarginLeftEnable":
				case fullScreenStr + "lrcLyricsMarginLeftEnable":
				case fullScreenStr + "transLyricsMarginLeftEnable":
				case fullScreenStr + "artistMarginLeftEnable":
				case fullScreenStr + "albumMarginLeftEnable":
				case fullScreenStr + "titleMarginLeftEnable":

				case fullScreenStr + "lyricsMarginRightEnable":
				case fullScreenStr + "lrcLyricsMarginRightEnable":
				case fullScreenStr + "transLyricsMarginRightEnable":
				case fullScreenStr + "artistMarginRightEnable":
				case fullScreenStr + "albumMarginRightEnable":
				case fullScreenStr + "titleMarginRightEnable":

				case fullScreenStr + "lyricsFontEnable":
				case fullScreenStr + "lrcLyricsFontEnable":
				case fullScreenStr + "transLyricsFontEnable":
				case fullScreenStr + "artistFontEnable":
				case fullScreenStr + "albumFontEnable":
				case fullScreenStr + "titleFontEnable":
					
					mlyrics.pane.viewMode.change(mlyrics.pane.prefs.getIntPref("lyricsViewMode"));
					break;
				
				case "showNotifs":
					this.updateNotif();
					break;
			}
		},
		
		updateStyle: function () {
			
			//set CSS link
			var iframe = document.getElementById('lm-content');
			var CSS_defined = iframe.contentWindow.document.getElementById('define_CSS');
			
			// Check for stylesheet (defaults to purplerain style)
			
			var feathersMgr = Components.classes['@songbirdnest.com/songbird/feathersmanager;1'].getService(Ci.sbIFeathersManager);
			var currentSkin = feathersMgr.currentSkinName;
			var customStyleFile = "chrome://songbird/skin/mlyrics.css";

			if (!mlyrics.pane.fullScreenMode.fullScreen)
				var fullScreenStr = "";
			else
				var fullScreenStr = "fullScreen_";
			
			var prefStyleFile = mlyrics.pane.prefs.getCharPref(fullScreenStr + "styleSheet");
			
			if ( currentSkin == "purplerain" && (!prefStyleFile || prefStyleFile == customStyleFile) ) {
				CSS_defined.setAttribute("href", "purplerain.css");
			} else {
				CSS_defined.setAttribute("href", prefStyleFile);
			}
		},
		
		updateNotif: function () {
			
			if (mlyrics.pane.prefs.getBoolPref("showNotifs")) {
				mlyrics.pane.ourDisplayPane.contentIcon = "chrome://mlyrics/content/images/notes.png";
			} else {
				mlyrics.pane.ourDisplayPane.contentIcon = "chrome://mlyrics/content/images/nonotes.png";
			}
		}
	},
	
	getStyleProperty: function (prefPartStr) {
		if (!mlyrics.pane.fullScreenMode.fullScreen)
			var fullScreenStr = "";
		else
			var fullScreenStr = "fullScreen_";
			
		var elemSize 			= mlyrics.pane.prefs.getIntPref(fullScreenStr + prefPartStr + "Size");
		var elemColor 			= mlyrics.pane.prefs.getCharPref(fullScreenStr + prefPartStr + "Color");
		var elemBGColor 		= mlyrics.pane.prefs.getCharPref(fullScreenStr + prefPartStr + "BGColor");
		var elemBold 			= mlyrics.pane.prefs.getBoolPref(fullScreenStr + prefPartStr + "Bold");
		var elemItalic 			= mlyrics.pane.prefs.getBoolPref(fullScreenStr + prefPartStr + "Italic");
		var elemUnderlined 		= mlyrics.pane.prefs.getBoolPref(fullScreenStr + prefPartStr + "Underlined");
		var elemAlign 			= mlyrics.pane.prefs.getCharPref(fullScreenStr + prefPartStr + "Align");
		var elemOpacity 		= mlyrics.pane.prefs.getIntPref(fullScreenStr + prefPartStr + "Opacity");
		var elemMarginTop 		= mlyrics.pane.prefs.getIntPref(fullScreenStr + prefPartStr + "MarginTop");
		var elemMarginBottom 		= mlyrics.pane.prefs.getIntPref(fullScreenStr + prefPartStr + "MarginBottom");
		var elemMarginLeft 		= mlyrics.pane.prefs.getIntPref(fullScreenStr + prefPartStr + "MarginLeft");
		var elemMarginRight 		= mlyrics.pane.prefs.getIntPref(fullScreenStr + prefPartStr + "MarginRight");
		var elemFont			= mlyrics.pane.prefs.getCharPref(fullScreenStr + prefPartStr + "Font");

		var elemStyleEnable 		= mlyrics.pane.prefs.getBoolPref(fullScreenStr + prefPartStr + "StyleEnable");
		var elemAlignEnable 		= mlyrics.pane.prefs.getBoolPref(fullScreenStr + prefPartStr + "AlignEnable");
		var elemColorEnable 		= mlyrics.pane.prefs.getBoolPref(fullScreenStr + prefPartStr + "ColorEnable");
		var elemBGColorEnable 		= mlyrics.pane.prefs.getBoolPref(fullScreenStr + prefPartStr + "BGColorEnable");
		var elemSizeEnable 		= mlyrics.pane.prefs.getBoolPref(fullScreenStr + prefPartStr + "SizeEnable");
		var elemMarginTopEnable 	= mlyrics.pane.prefs.getBoolPref(fullScreenStr + prefPartStr + "MarginTopEnable");
		var elemMarginBottomEnable 	= mlyrics.pane.prefs.getBoolPref(fullScreenStr + prefPartStr + "MarginBottomEnable");
		var elemMarginLeftEnable 	= mlyrics.pane.prefs.getBoolPref(fullScreenStr + prefPartStr + "MarginLeftEnable");
		var elemMarginRightEnable 	= mlyrics.pane.prefs.getBoolPref(fullScreenStr + prefPartStr + "MarginRightEnable");
		var elemFontEnable 		= mlyrics.pane.prefs.getBoolPref(fullScreenStr + prefPartStr + "FontEnable");
		
		var styleStr = "";

		if (elemStyleEnable) {
			if (elemBold)
				styleStr += "font-weight: bold;";
			else
				styleStr += "font-weight: normal;";

			if (elemItalic)
				styleStr += "font-style: italic;";
			else
				styleStr += "font-style: normal;";

			if (elemUnderlined)
				styleStr += "text-decoration: underline;";
			else
				styleStr += "text-decoration: none;";
		}
		else if (prefPartStr == "transLyrics") {
			styleStr += "text-decoration: underline;";
		}

		if (elemAlignEnable) {
			if (elemAlign == "C")
				styleStr += "text-align: center;";
			else if (elemAlign == "R")
				styleStr += "text-align: right;";
			else
				styleStr += "text-align: left;";
		}

		if (elemColorEnable) styleStr += "color:" + elemColor + ";";

		if (elemBGColorEnable) {
			styleStr += "background-color:" + elemBGColor + ";";
			styleStr += "opacity:" + (elemOpacity*0.1) + ";";
		}
		
		if (elemSizeEnable) styleStr += "font-size:" + elemSize + ";";
		
		if (elemMarginTopEnable) styleStr += "margin-top: " + elemMarginTop + ";";
		if (elemMarginBottomEnable) styleStr += "margin-bottom: " + elemMarginBottom + ";";
		if (elemMarginLeftEnable) styleStr += "margin-left: " + elemMarginLeft + ";";
		if (elemMarginRightEnable) styleStr += "margin-right: " + elemMarginRight + ";";
		
		if (elemFontEnable) styleStr += "font-family: " + elemFont + ";";
		
		return styleStr;
	},
	
	playlistPlaybackServiceListener: {
		
		curMediaItem: null,
		
		init: function() {
			this.curMediaItem = mlyrics.pane.gMM.sequencer.currentItem;
			mlyrics.pane.gMM.addListener(this);
		},
		
		onMediacoreEvent: function(ev) {
			if (typeof(Components) == "undefined") return;
			
			switch (ev.type) {
				case Components.interfaces.sbIMediacoreEvent.TRACK_CHANGE:
					this.onTrackChange(ev.data);
					break;
					
				case Components.interfaces.sbIMediacoreEvent.STREAM_STOP:
				case Components.interfaces.sbIMediacoreEvent.STREAM_END:
					this.onStop();
					break;
					
				default:
					break;
			}
		},
		
		onTrackChange: function(aMediaItem, aMediaView, aIndex) {
			// Don't do stuff for video
			if (aMediaItem.getProperty(SBProperties.contentType) == "video") return;
			
			this.curMediaItem = aMediaItem;
			
			// Return if we are in now selected mode
			if (mlyrics.pane.prefs.getBoolPref("showNowSelected")) return;

			var wasLRC = aMediaItem.getProperty("http://songbirdnest.com/data/1.0#hasLRCfile");
			var isLRC = "" + mlyrics.lrc.hasLRCFile(aMediaItem);
			
			if (wasLRC != isLRC) aMediaItem.setProperty("http://songbirdnest.com/data/1.0#hasLRCfile", isLRC);
			
			var haslyrType = mlyrics.lib.fixHasLyr(aMediaItem);

			// Lost tag lyrics
			if (haslyrType == 1) {
				mlyrics.pane.addSpecWarning(mlyrics.pane.pStrings.foundLostLyricsNotif, mlyrics.scanlib.scan);
			}
			
			// Lost LRC
			if (wasLRC != isLRC) {
				if (wasLRC == "true") {
					mlyrics.pane.addSpecWarning(mlyrics.pane.pStrings.lostLRCNotif, mlyrics.scanlib.hasLrcScan);
				}
				// Because wasLRC can be undefined and isLRC can be false, false != undefined
				else if (isLRC == "true") {
					mlyrics.pane.addSpecWarning(mlyrics.pane.pStrings.foundLRCNotif, mlyrics.scanlib.hasLrcScan);
				}
			}
			else {
				if (isLRC == "true") {
					var result = mlyrics.lrc.readLRC(aMediaItem);
					mlyrics.pane.positionListener.timeArray = result.timeStruct.timeArray;
				}
				else {
					mlyrics.pane.positionListener.timeArray = [];
				}

				var syncResult = mlyrics.lrc.syncTimeTracks(aMediaItem);

				if (!syncResult) {
					mlyrics.pane.addSpecWarning(mlyrics.pane.pStrings.lrcSyncFail, mlyrics.scanlib.lrcSyncScan);
				}
			}

			mlyrics.pane.showInfo(aMediaItem);


			if (document.getElementById("lm-deck").selectedIndex == 3) {
				setTimeout("mlyrics.pane.editTimeTracks.restart()", 1000);
			}
		},
		
		onStop: function() {
			if (!mlyrics.pane.prefs.getBoolPref("showNowSelected")) {
				mlyrics.pane.controller.lmDeck.selectedIndex = 0;
				mlyrics.lib.debugOutput("Pane collapsed on song stop");
				
				if (!mlyrics.pane.prefs.getBoolPref("showNowSelected")) {
					mlyrics.pane.controller.showPane(false);
				}
			}
		},
		
		onBeforeTrackChange: function() {
		},
		
		onViewChange: function() {
		},
		
		onBeforeViewChange: function() {
		},
		
		onTrackIndexChange: function() {
		}
	},
	
	// For shoutcast radio add-on
	titleDataRemoteObserver: {
		artistName: "",
		trackName: "",
		
		init: function() {
			songbird.addListener("metadata.title", this);
		},
		
		observe: function ( aSubject, aTopic, aData) {
			
			var statusProgress = mlyrics.pane.songbirdWindow.document.getElementById("sb-status-bar-status-progressmeter");
			
			// Ignore if in progress
			if (statusProgress.mode == "undetermined") return;
			
			// Ignore if duration is not 0 - it is not radio
			if (mlyrics.pane.gMM.playbackControl.duration) return;
			
			var delimPos = aTopic.indexOf(" - ");
			
			// Not our format
			if (delimPos == -1) return;
			
			var artistName = aTopic.substr(0, delimPos);
			var trackName = aTopic.substr(delimPos+3);
			
			// Ignore unexpected interrupts
			if (artistName == this.artistName) return;
			if (trackName == this.trackName) return;
			
			// For now we doing nothing
		}
	},
	
	onDrop: function (event) {
		var data = event.dataTransfer.getData("text/plain");
		if (data == "") return;

		// If all text uppercase - normalize it
		var newdata = data;
		if (data.toUpperCase() == data) {
			var dataArray = data.split("\n");
			
			newdata = "";
			for (var i=0; i<dataArray.length; i++) {
				if (dataArray[i].length > 1) {
					newdata += dataArray[i].substr(0, 1) + dataArray[i].substr(1).toLowerCase() + "\n";
				}
				else {
					newdata += dataArray[i] + "\n";
				}
			}
		}
		data = newdata;
		
		if (mlyrics.pane.prefs.getBoolPref("showNowSelected")) {
			this.saveLyrics("", "", this.mediaItemSelectListener.curMediaItem, data);
			this.mediaItemSelectListener.updatePaneInfo(true);
		}
		else {
			if ((this.gMM.status.state == Components.interfaces.sbIMediacoreStatus.STATUS_PLAYING) ||
				(this.gMM.status.state == Components.interfaces.sbIMediacoreStatus.STATUS_PAUSED) ||
				(this.gMM.status.state == Components.interfaces.sbIMediacoreStatus.STATUS_BUFFERING))
			{
				var mediaItem = this.playlistPlaybackServiceListener.curMediaItem;
				this.saveLyrics("", "", mediaItem, data);
				this.showInfo(mediaItem);
			}
		}
	},
	
	saveLyrics: function (notificationElement, notifcationButton, mediaItem, lyrics, source) {

		var translDelimPos1 = lyrics.indexOf("\n\n =================== \n [ ");
		if (translDelimPos1 == -1) {
			translDelimPos1 = lyrics.length;
		}

		var translDelimPos2 = lyrics.indexOf(" ] \n =================== \n", translDelimPos1);
		if (translDelimPos2 != -1) {
			translDelimPos2 = translDelimPos2+27;
		}
		else {
			translDelimPos2 = lyrics.length;
		}

		var onlyLyrics = lyrics.substring(0, translDelimPos1);
		var onlyTranslation = lyrics.substr(translDelimPos2);

		while(onlyLyrics.substr(onlyLyrics.length-1) == "\n")
			onlyLyrics = onlyLyrics.substr(0, onlyLyrics.length-1);

		while(onlyTranslation.substr(onlyTranslation.length-1) == "\n")
			onlyTranslation = onlyTranslation.substr(0, onlyTranslation.length-1);
		
		var metadataComment = mediaItem.getProperty("http://songbirdnest.com/data/1.0#lyricistName");
		if (!metadataComment) metadataComment = "";
		
		if (source && source != "" && lyrics.toLowerCase().substr(0, 14) != "[instrumental]") {
			mediaItem.setProperty("http://songbirdnest.com/data/1.0#lyricistName", "Songbird MLyrics [" + source + "]\n");
		}
		else {
			if (!metadataComment) {
				mediaItem.setProperty("http://songbirdnest.com/data/1.0#lyricistName", null);
			}
		}
		
		mediaItem.setProperty("http://songbirdnest.com/data/1.0#lyrics", onlyLyrics);
		mediaItem.setProperty("http://songbirdnest.com/data/1.0#translatedLyrics", onlyTranslation);
		mlyrics.lib.writeID3Tag(mediaItem);
			
		document.getElementById("ML_sourceAddressNextButton").hidden = true;
	},
	
	addNotification: function (notificationBoxElement, notificationPriority, mediaItem, lyrics, source) {
		
		var notificationValue = notificationPriority;
		var notificationImage = "chrome://mlyrics/content/images/notif.png";
		
		if (lyrics && lyrics != "") {
			// Do not ask to save for shoutcast radio
			var browser = window.top.gBrowser.selectedTab.linkedBrowser;
			var location = browser.contentDocument.location.toString();
			if (location.substr(0, 25) == "chrome://shoutcast-radio/") return;
			
			var notificationButtons = 
			[
				{
					accessKey: null, 
					callback: function (notificationElement, notifcationButton) {
						mlyrics.pane.saveLyrics(notificationElement, notifcationButton, mediaItem, lyrics, source);
					}, 
					label: this.pStrings.bigyes, 
					popup: null
				}
			];
			
			if (lyrics.indexOf("\n [ Google translated ] \n") != -1) {
				var notificationLabel = this.pStrings.asktosaveAll;
			}
			else {
				var notificationLabel = this.pStrings.asktosave;
			}
		}
		else {
			var notificationButtons = 
			[
				{
					accessKey: null, 
					callback: function () {
						mlyrics.pane.contextRefresh(true, -1);
					}, 
					label: this.pStrings.websearch, 
					popup: null
				}
			];
			
			var notificationLabel = this.pStrings.lyrnotfound;
		}
		
		var mTop = document.getElementById(notificationBoxElement);
		
		mTop.removeAllNotifications(true);
		mTop.appendNotification(notificationLabel,
					notificationValue,
					notificationImage,
					notificationPriority,
					notificationButtons);
	},
	
	addSpecWarning: function (warnText, callbackFn) {
		
		if ( !mlyrics.pane.prefs.getBoolPref("showNotifs") ) return;
		
		var notificationImage = "chrome://mlyrics/content/images/notes.png";
		
		var notificationButtons = 
		[
			{
				accessKey: null, 
				callback: callbackFn,
				label: this.pStrings.bigyes, 
				popup: null
			}
		];
			
		var mBottom = document.getElementById("specwarningbar");
		mBottom.removeAllNotifications(true);
		mBottom.appendNotification(warnText,
					4,
					notificationImage,
					4,
					notificationButtons);
	},
	
	updateLyrics: function (artist, album, track, mediaItem, place, forceone) {
		
		// Private Function
		var checkInfo = function (artist, album, track, respLyr, respSource, mediaItem) {
			if (mlyrics.pane.prefs.getBoolPref("showNowSelected")) {
				if (mlyrics.pane.mediaItemSelectListener.curMediaItem != mediaItem) return;
			}
			else {
				if (mlyrics.pane.playlistPlaybackServiceListener.curMediaItem != mediaItem) return;
			}
			
			var noLyrFoundPref = mlyrics.pane.prefs.getBoolPref("noLyrFound");
			var showNotifsPref = mlyrics.pane.prefs.getBoolPref("showNotifs");
			var saveLyricsPref = mlyrics.pane.prefs.getCharPref("saveLyrics");
			var saveTranslPref = mlyrics.pane.prefs.getCharPref("saveTranslation");
			
			if (!mlyrics.pane.prefs.getBoolPref("translateMetadata")) saveTranslPref = "NEVERSAVE";
			
			if (!respLyr || respLyr.length < 10) {
				var respLyr = "";
				
				if (showNotifsPref && noLyrFoundPref) {
					mlyrics.pane.addNotification("infobar", 3,"","");
					
					if (!forceone && mlyrics.pane.prefs.getBoolPref("autoSearchLyr")) {
						mlyrics.pane.autoLuckySearch(artist, track);
						return;
					}
				}
			}
			else {
				if (respLyr.substr(0, 12).toLowerCase() == "instrumental" || respLyr.substr(1, 12).toLowerCase() == "instrumental") {
					respLyr = "[Instrumental]";
				}
			
				switch (saveLyricsPref) {
					case "ALWAYSAVE":
						switch (saveTranslPref) {
							case "ALWAYSAVE":
								mlyrics.pane.saveLyrics("", "", mediaItem, respLyr, respSource);
								break;
								
							case "PROMPT":
								if (showNotifsPref) {
									mlyrics.pane.addNotification("infobar", 3, mediaItem, respLyr, respSource);
								}
								else {
									mlyrics.pane.saveLyrics("", "", mediaItem, respLyr, respSource);
								}
								break;
								
							case "NEVERSAVE":
								var respLyr2 = respLyr;
								if (respLyr.indexOf("\n [ Google translated ] \n") != -1) {
									var translDelimPos1 = respLyr.indexOf("\n\n =================== \n [ ");
									if (translDelimPos1 != -1) {
										respLyr2 = respLyr.substr(0, translDelimPos1);
									}
								}
								mlyrics.pane.saveLyrics("", "", mediaItem, respLyr2, respSource);
								break;
						}
						break;
						
					case "PROMPT":
						if (!showNotifsPref) break;
						
						switch (saveTranslPref) {
							case "ALWAYSAVE":
							case "PROMPT":
								mlyrics.pane.addNotification("infobar", 3, mediaItem, respLyr, respSource);
								break;
							
							case "NEVERSAVE":
								var respLyr2 = respLyr;
								if (respLyr.indexOf("\n [ Google translated ] \n") != -1) {
									var translDelimPos1 = respLyr.indexOf("\n\n =================== \n [ ");
									if (translDelimPos1 != -1) {
										respLyr2 = respLyr.substr(0, translDelimPos1);
									}
								}
								mlyrics.pane.addNotification("infobar", 3, mediaItem, respLyr2, respSource);
								break;
						}
						break;
						
					case "NEVERSAVE":
						/*switch (saveTranslPref) {
							case "ALWAYSAVE":
								break;
							case "PROMPT":
								break;
							case "NEVERSAVE":
								break;
						}*/
						break;
				}
			}
			
			mlyrics.pane.buildPage(artist, album, track, respLyr, respSource);
		}
		
		if (!album) album = "";
		
		// Don't proceed if we don't have valid metadata
		if (!artist || !track) {
			if (!artist) artist = "";
			if (!track) track = "";
			
			checkInfo(artist, album, track, "", null, mediaItem);
			return;
		}
		
		if (mlyrics.pane.nextItemBufferedInfo.item && mlyrics.pane.nextItemBufferedInfo.item == mediaItem) {
			checkInfo(artist, album, track, mlyrics.pane.nextItemBufferedInfo.lyrics, mlyrics.pane.nextItemBufferedInfo.source, mlyrics.pane.nextItemBufferedInfo.item);
			return;
		}

		document.getElementById('lm-content').hidden =  false;
		document.getElementById('web-content').hidden = true;
		document.getElementById('web-dropbtn').hidden = true;
		
		// No need to write same code twice
		var localLyrics = mlyrics.fetch.fetchNext(
			
			artist, 
			album, 
			track,
			
			function (localLyrics, localSource, localIndex) {
				document.getElementById("ML_sourceAddressNextButton").hidden = false;
				document.getElementById("refreshMenuItem").disabled = false;
				
				document.getElementById("editBtn").disabled = true;
				document.getElementById("timeTracksBtn").disabled = true;
				document.getElementById("makeInstrBtn").disabled = true;
				document.getElementById("clearBtn").disabled = true;

				document.getElementById("metadataMenuItem").disabled = true;
				document.getElementById("timeTracksMenuItem").disabled = true;
				document.getElementById("makeInstrMenuItem").disabled = true;
				document.getElementById("clearMenuItem").disabled = true;
				
				if (!localIndex) {
					document.getElementById("refreshMenuItem").selectedItem = document.getElementById("ML_contextSourcesSeparator");
					document.getElementById("ML_sourceAddressNextButton").disabled = true;
					document.getElementById("ML_sourceAddressNextButton").nextSourceIndex = 0;
				}
				else {
					document.getElementById("refreshMenuItem").selectedIndex = localIndex+1;
					document.getElementById("ML_sourceAddressNextButton").disabled = false;
					document.getElementById("ML_sourceAddressNextButton").nextSourceIndex = localIndex;
				}
				
				checkInfo(artist, album, track, localLyrics, localSource, mediaItem);
			},
			
			place,
			forceone,
			
			function (lsource, lprogress, localIndex) {
				if (typeof(localIndex) == "undefined") return;
				
				document.getElementById("refreshMenuItem").selectedIndex = localIndex+2;
				document.getElementById("ML_sourceFetchProgress").hidden = !lprogress;
				document.getElementById("ML_sourceFetchStopButton").hidden = !lprogress;
				document.getElementById("ML_sourceAddressNextButton").hidden = true;
				document.getElementById("refreshMenuItem").disabled = true;
				
				document.getElementById("editBtn").disabled = true;
				document.getElementById("timeTracksBtn").disabled = true;
				document.getElementById("makeInstrBtn").disabled = true;
				document.getElementById("clearBtn").disabled = true;

				document.getElementById("metadataMenuItem").disabled = true;
				document.getElementById("timeTracksMenuItem").disabled = true;
				document.getElementById("makeInstrMenuItem").disabled = true;
				document.getElementById("clearMenuItem").disabled = true;
			},
			0
		);
	},
	
	stopFetch: function () {
		mlyrics.lib.debugOutput("Abort action, emulating track change");
		mlyrics.fetch.fetchMediaItem = 0;
		
		document.getElementById("ML_sourceAddressNextButton").hidden = false;
		document.getElementById("refreshMenuItem").disabled = false;
		document.getElementById("ML_sourceFetchProgress").hidden = true;
		document.getElementById("ML_sourceFetchStopButton").hidden = true;
		
		document.getElementById("editBtn").disabled = false;
		if (mlyrics.pane.viewMode.savedData.lyrics != "" && mlyrics.pane.viewMode.savedData.lyrics.substr(0, 14).toLowerCase() != "[instrumental]") 
			document.getElementById("timeTracksBtn").disabled = false;
		document.getElementById("makeInstrBtn").disabled = false;
		document.getElementById("clearBtn").disabled = false;

		document.getElementById("metadataMenuItem").disabled = false;
		if (mlyrics.pane.viewMode.savedData.lyrics != "" && mlyrics.pane.viewMode.savedData.lyrics.substr(0, 14).toLowerCase() != "[instrumental]")
		document.getElementById("timeTracksMenuItem").disabled = false;
		document.getElementById("makeInstrMenuItem").disabled = false;
		document.getElementById("clearMenuItem").disabled = false;
			
		document.getElementById("refreshMenuItem").selectedItem = document.getElementById("ML_contextSourcesSeparator");
		document.getElementById("ML_sourceAddressNextButton").disabled = true;
		document.getElementById("ML_sourceAddressNextButton").nextSourceIndex = 0;
	},
	
	translateMetadataLyrics: function (lyrics, cbFn, force) {
		
		if (   !lyrics || 
			lyrics == "" || 
			( !this.prefs.getBoolPref("translateMetadata") && !force ) ||
			this.prefs.getCharPref("enableTranslate") != "TRANSLATE" ||
			!this.prefs.getIntPref("lyricsViewMode")
		   ) 
		{
			cbFn("");
			return;
		}
		
		mlyrics.fetch.googleTranslate(lyrics, cbFn, true);
	},

	getFullLyrics: function (mediaItem) {
		var lyrics = mediaItem.getProperty("http://songbirdnest.com/data/1.0#lyrics");
		var translation = mediaItem.getProperty("http://songbirdnest.com/data/1.0#translatedLyrics");

		if (!lyrics) lyrics = "";
		if (!translation) translation = "";

		var translDelimPos1 = lyrics.indexOf("\n\n =================== \n [ ");
		if (translDelimPos1 != -1) {
			mlyrics.pane.saveLyrics("", "", mediaItem, lyrics);
			
			var translDelimPos2 = lyrics.indexOf(" ] \n =================== \n", translDelimPos1);
			if (translDelimPos2 != -1) {
				translDelimPos2 = translDelimPos2+27;
			}
			else {
				translDelimPos2 = lyrics.length;
			}

			translation = lyrics.substr(translDelimPos2);
			lyrics = lyrics.substring(0, translDelimPos1);
		}
		
		var delimiter = "";

		if (lyrics != "") {
			if (translation != "") {
				delimiter = "\n\n =================== \n [ Google translated ] \n =================== \n\n";
			}
		}

		var fullLyrics = lyrics + delimiter + translation;
		
		return fullLyrics;
	},

	autoLuckySearch: function (artist, track) {
		if (!artist || !track) {
			if (mlyrics.pane.prefs.getBoolPref("showNowSelected")) {
				var mediaItem = this.mediaItemSelectListener.curMediaItem;
			}
			else {
				var mediaItem = this.playlistPlaybackServiceListener.curMediaItem;
			}
			
			var artist = mediaItem.getProperty(SBProperties.artistName);
			var track = mediaItem.getProperty(SBProperties.trackName);
		}

		if (!artist || !track) return;

		var doNotLuckySearchSites = mlyrics.pane.prefs.getCharPref("doNotLuckySearchSites").split(",");
		var sitesExceptionStr = "";
		for (var i=0; i<doNotLuckySearchSites.length; i++) {
			sitesExceptionStr += "%20-site:" + doNotLuckySearchSites[i];
		}

		var goUri = "http://www.google.com/search?btnI=i&q=lyrics%20" +
				encodeURIComponent(artist) + "%20" + encodeURIComponent(track) + sitesExceptionStr;

		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
		var nsIURI = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService).newURI("http://www.google.com", null, null);

		document.getElementById('lm-content').hidden =  true;
		document.getElementById('web-content').hidden = false;
		document.getElementById('web-dropbtn').hidden = false;

		document.getElementById("ML_sourceAddressNextButton").hidden = false;
		document.getElementById("refreshMenuItem").disabled = false;
		
		document.getElementById("editBtn").disabled = false;
		document.getElementById("timeTracksBtn").disabled = true;
		document.getElementById("makeInstrBtn").disabled = false;
		document.getElementById("clearBtn").disabled = false;

		document.getElementById("metadataMenuItem").disabled = false;
		document.getElementById("timeTracksMenuItem").disabled = true;
		document.getElementById("makeInstrMenuItem").disabled = false;
		document.getElementById("clearMenuItem").disabled = false;
		
		document.getElementById("ML_sourceAddressNextButton").nextSourceIndex = 0;
		document.getElementById("refreshMenuItem").selectedItem = document.getElementById("contxtLuckySearchMenu");
		document.getElementById("ML_sourceFetchProgress").hidden = true;
		document.getElementById("ML_sourceFetchStopButton").hidden = true;

		// Remove notifications
		var mTop = document.getElementById("infobar");
		mTop.removeAllNotifications(true);

		mlyrics.lib.debugOutput("Lucky search for artist: " + artist + ", track: " + track);

		document.getElementById('web-content').loadURI("about:blank");
		setTimeout(function () {document.getElementById('web-content').loadURI(goUri, nsIURI);}, 100);
	},
	
	buildPage: function (artist, album, track, lyrics, source) {
		
		if (!artist) var artist = "";
		if (!album) var album = "";
		if (!track) var track = "";
		if (!lyrics) var lyrics = "";
		if (!source) var source = "";
		
		mlyrics.pane.viewMode.savedData.artist 	= artist;
		mlyrics.pane.viewMode.savedData.album 	= album;
		mlyrics.pane.viewMode.savedData.track 	= track;
		mlyrics.pane.viewMode.savedData.lyrics 	= lyrics;
		mlyrics.pane.viewMode.savedData.source 	= source;

		mlyrics.pane.savedWidth = mlyrics.pane.displayPane.width;

		document.getElementById("accelerateScale").value = 0;
		document.getElementById("accelerateScaleValueLabel").value = 0;

		if (mlyrics.pane.viewMode.savedData.lyrics == "" || mlyrics.pane.viewMode.savedData.lyrics.substr(0, 14).toLowerCase() == "[instrumental]") {
			document.getElementById("timeTracksBtn").disabled = true;
			document.getElementById("contxtTranslateMetaMenu").disabled = true;
		}
		
		if (mlyrics.pane.viewMode.savedData.lyrics.indexOf("[ Google translated ]") != -1)
			document.getElementById("contxtTranslateMetaMenu").disabled = true;
		
		// get view mode
		lyrics = mlyrics.pane.viewMode.getHTMLView(lyrics);
		
		var browser = window.top.gBrowser.selectedTab.linkedBrowser;  
		var location = browser.contentDocument.location.toString();
		
		if (location.substr(0, 9) == "chrome://") {
			var tabActive = true;
		}
		else {
			var tabActive = false;
		}
		
		lyrics = lyrics.replace(/\n/g,"<br>");
		
		var content_lyric_html = "";
		
		if (lyrics == "") {
			this.controller.haveLyr = false;
		}
		else {
			this.controller.haveLyr = true;
		}
		
		var noLyrFoundPref = this.prefs.getBoolPref("noLyrFound");
		var instrFoundPref = this.prefs.getBoolPref("instrFound");
		
		mlyrics.pane.controller.isInstr = false;
		
		if ( (this.controller.haveLyr || noLyrFoundPref) && tabActive ) {
			if (lyrics.substr(0, 14).toLowerCase() == "[instrumental]") {
				mlyrics.pane.controller.isInstr = true;
				if (!instrFoundPref) {
					this.controller.showPane(false);
				}
				else {
					this.controller.showPane(true);
				}
			}
			else {
				this.controller.showPane(true);
			}
		}
		else {
			mlyrics.lib.debugOutput("Pane collapsed on build page: " + this.controller.haveLyr + ", " + noLyrFoundPref + ", " + tabActive);
			this.controller.showPane(false);
		}
		
		// Disable menu for shoutcast radio
		var browser = window.top.gBrowser.selectedTab.linkedBrowser;
		var location = browser.contentDocument.location.toString();
		if (location.substr(0, 25) == "chrome://shoutcast-radio/") {
			document.getElementById("editBtn").disabled 			= true;
			document.getElementById("timeTracksBtn").disabled 		= true;
			document.getElementById("makeInstrBtn").disabled 		= true;
			document.getElementById("clearBtn").disabled 			= true;
			
			document.getElementById("metadataMenuItem").disabled 		= true;
			document.getElementById("timeTracksMenuItem").disabled 		= true;
			document.getElementById("makeInstrMenuItem").disabled 		= true;
			document.getElementById("clearMenuItem").disabled 		= true;
			
			document.getElementById("contxtRefreshTagMenu").disabled 	= true;
			document.getElementById("contxtTranslateMetaMenu").disabled 	= true;
		}
		else {
			document.getElementById("editBtn").disabled 			= false;
			if (mlyrics.pane.viewMode.savedData.lyrics != "" && mlyrics.pane.viewMode.savedData.lyrics.substr(0, 14).toLowerCase() != "[instrumental]") 
				document.getElementById("timeTracksBtn").disabled 	= false;
			document.getElementById("makeInstrBtn").disabled 		= false;
			document.getElementById("clearBtn").disabled 			= false;

			document.getElementById("metadataMenuItem").disabled 		= false;
			if (mlyrics.pane.viewMode.savedData.lyrics != "" && mlyrics.pane.viewMode.savedData.lyrics.substr(0, 14).toLowerCase() != "[instrumental]")
				document.getElementById("timeTracksMenuItem").disabled 	= false;
			document.getElementById("makeInstrMenuItem").disabled 		= false;
			document.getElementById("clearMenuItem").disabled 		= false;
			
			document.getElementById("contxtRefreshTagMenu").disabled 	= false;
		}
		
		// Build source menu
		( function () {
			var sources = mlyrics.pane.prefs.getCharPref("fetchSourcesList").split("|");
			var sourcesPopup = document.getElementById("ML_sourcesPopup");
			var contextSourcesSeparator = document.getElementById("ML_contextSourcesSeparator");
			
			var oldItems = sourcesPopup.getElementsByTagName("menuitem");
			for (var i=oldItems.length-1; i>=0; i--) {
				if (oldItems[i].id && oldItems[i].id.substr(0, 5) == "menu_") {
					sourcesPopup.removeChild(oldItems[i]);
				}
			}
			
			for (var i=0; i<sources.length; i++) {
				var sitem = document.createElement("menuitem");
				sitem.setAttribute("id", "menu_" + sources[i]);
				sitem.setAttribute("label", mlyrics.pane.prefs.getCharPref("laddress_" + sources[i]));
				sitem.setAttribute("oncommand", "mlyrics.pane.contextRefresh(true, " + i + ", true);");
				sourcesPopup.insertBefore(sitem, contextSourcesSeparator);
			}
		} ) ();
		
		var dispTrackPref = this.prefs.getBoolPref('dispTrack');
		var dispArtistPref = this.prefs.getBoolPref('dispArtist');
		var dispAlbumPref = this.prefs.getBoolPref('dispAlbum');
		
		var titleStyleProps = "";
		var artistStyleProps = "";
		var albumStyleProps = "";

		document.getElementById('lm-content').hidden = false;
		document.getElementById('web-content').hidden = true;
		document.getElementById('web-dropbtn').hidden = true;
		document.getElementById('web-content').loadURI("about:blank");
		
		var iframe = document.getElementById('lm-content');

		if (!mlyrics.pane.fullScreenMode.fullScreen)
			var fullScreenStr = "";
		else
			var fullScreenStr = "fullScreen_";

		titleStyleProps = mlyrics.pane.getStyleProperty("title");
		artistStyleProps = mlyrics.pane.getStyleProperty("artist");
		albumStyleProps = mlyrics.pane.getStyleProperty("album");
			
		if (mlyrics.pane.prefs.getCharPref(fullScreenStr + "backgroundType") == "C") {
			iframe.contentDocument.body.style.background = mlyrics.pane.prefs.getCharPref(fullScreenStr + 'backgroundColor')
		}
		else if (mlyrics.pane.prefs.getCharPref(fullScreenStr + "backgroundType") == "I") {
			var backgroundImageUrl = mlyrics.pane.prefs.getCharPref(fullScreenStr + 'backgroundImage');
			if (backgroundImageUrl.substr(0, 9) == "chrome://") {
				iframe.contentDocument.body.style.background = 'url("' + backgroundImageUrl + '") ' +
					mlyrics.pane.prefs.getCharPref(fullScreenStr + 'BGImagePos') +
					' fixed';
			}
			else {
				iframe.contentDocument.body.style.background = 'url("file:///' +
					decodeURIComponent(mlyrics.pane.prefs.getCharPref(fullScreenStr + 'backgroundImage')).replace(/\\/g, "/") + '") ' +
					mlyrics.pane.prefs.getCharPref(fullScreenStr + 'BGImagePos') +
					' fixed';
			}
		}
		else if (mlyrics.pane.prefs.getCharPref(fullScreenStr + "backgroundType") == "O") {
			var imageURL = mlyrics.pane.gMM.sequencer.currentItem.getProperty("http://songbirdnest.com/data/1.0#primaryImageURL");
			if (!imageURL && mlyrics.pane.prefs.getBoolPref(fullScreenStr + "showStaticPicIf")) {
				iframe.contentDocument.body.style.background = 'url("file:///' +
					decodeURIComponent(mlyrics.pane.prefs.getCharPref(fullScreenStr + 'backgroundImage')).replace(/\\/g, "/") +
					'") ' +
					mlyrics.pane.prefs.getCharPref(fullScreenStr + 'BGImagePos') +
					' fixed';
			}
			else {
				iframe.contentDocument.body.style.background = 'url("' + imageURL + '") center center fixed';
			}
		}
		else {
			iframe.contentDocument.body.style.background = "";
		}
		
		//  The following HTML and its CSS companion files are written by Gege from the MediaMonkey forums,  His addon for MediaMonkey (http://www.mediamonkey.com/forum/viewtopic.php?t=22624) is the inspiration for Lyricmaster.  Thanks Gege!!!
		content_lyric_html = content_lyric_html + "  <table id='ml-table' border=0 width=100% cellspacing=0 cellpadding=0>";
		if (dispTrackPref){
			content_lyric_html = content_lyric_html + "      <tr>";
			content_lyric_html = content_lyric_html + "       <td valign=top>";
			content_lyric_html = content_lyric_html + "        <p class=\"header\"> &nbsp; </p>";
			content_lyric_html = content_lyric_html + "       </td>";
			content_lyric_html = content_lyric_html + "      </tr>";
			
			// TrackNumber = ""
			// If ShowTrackNumber = True Then
			//  TrackNumber = Sng.TrackOrder & ". "
			// End If
			
			content_lyric_html = content_lyric_html + "      <tr>";
			content_lyric_html = content_lyric_html + "        <td valign=top>";
			content_lyric_html = content_lyric_html + "         <h1 id='mlyrics_title' style='" + titleStyleProps + "'>" + track + "</h1>";
			content_lyric_html = content_lyric_html + "        </td>";
			content_lyric_html = content_lyric_html + "      </tr>";
			
			content_lyric_html = content_lyric_html + "      <tr>";
			content_lyric_html = content_lyric_html + "       <td valign=top>";
			content_lyric_html = content_lyric_html + "        <p class=\"separator1\"> &nbsp; </p>";
			content_lyric_html = content_lyric_html + "       </td>";
			content_lyric_html = content_lyric_html + "      </tr>";
		}
		
		if (dispArtistPref){
			content_lyric_html = content_lyric_html + "      <tr>";
			content_lyric_html = content_lyric_html + "       <td valign=top>";
			content_lyric_html = content_lyric_html + "        <h2 id='mlyrics_artist' style='" + artistStyleProps + "'>" + artist + "</h2>";
			content_lyric_html = content_lyric_html + "       </td>";
			content_lyric_html = content_lyric_html + "      </tr>";
		}
		
		if (dispAlbumPref){  
			content_lyric_html = content_lyric_html + "      <tr>";
			content_lyric_html = content_lyric_html + "       <td valign=top>";
			content_lyric_html = content_lyric_html + "        <h3 id='mlyrics_album' style='" + albumStyleProps + "'>" + album + "</h3>";
			content_lyric_html = content_lyric_html + "       </td>";
			content_lyric_html = content_lyric_html + "      </tr>";
		}
		
		//If showYear = True Then
		// songYear = GetYear(Sng.OriginalYear,Sng.Year)
		// If Not songYear = "" Then
		//   content_lyric_html = content_lyric_html + "      <tr>"
		//   content_lyric_html = content_lyric_html + "       <td valign=top>"
		//   content_lyric_html = content_lyric_html + "        <h4>(" & songYear & ")</h4>"
		//   content_lyric_html = content_lyric_html + "       </td>"
		//   content_lyric_html = content_lyric_html + "      </tr>"
		// End If
		//End If
		
		//If showComposer = True Then
		// If Not Sng.Author & Sng.Lyricist="" Then
		//        If Sng.Author="" Then
		//         w=Sng.Lyricist
		//    ElseIf Sng.Lyricist="" Then
		//         w=Sng.Author
		//    Else:w=Sng.Author & ";" & Sng.Lyricist
		//    End If
		//   content_lyric_html = content_lyric_html + "      <tr>"
		//   content_lyric_html = content_lyric_html + "       <td valign=top>"
		//   content_lyric_html = content_lyric_html + "         <h5>(" & FixMultipleValues(w) & ")</h5>"
		//   content_lyric_html = content_lyric_html + "        </td>"
		//   content_lyric_html = content_lyric_html + "      </tr>"
		// End If
		//End If
		
		if ((dispAlbumPref) || (dispArtistPref) || (dispTrackPref)) {
			content_lyric_html = content_lyric_html + "      <tr>";
			content_lyric_html = content_lyric_html + "       <td valign=top>";
			content_lyric_html = content_lyric_html + "        <p id=\"lyrics-separator2\" class=\"separator2\"> &nbsp; </p>";
			content_lyric_html = content_lyric_html + "       </td>";
			content_lyric_html = content_lyric_html + "      </tr>";
		}
		
		content_lyric_html = content_lyric_html + "      <tr>";
		content_lyric_html = content_lyric_html + "       <td>";
		//content_lyric_html = content_lyric_html + "        <p id='mlyrics_lyrics' class='mlyrics_lyrics'>" + lyrics + "</p>";
		content_lyric_html = content_lyric_html + lyrics;
		content_lyric_html = content_lyric_html + "       </td>";
		content_lyric_html = content_lyric_html + "      </tr>";
		
		//If ShowComments = True Then
		//    CommentsTxt=HtmlMarkup(Sng.Comment)
		//   If Not CommentsTxt = "" Then
		//   If showLyrics = True Then
		//     content_lyric_html = content_lyric_html + "      <tr>"
		//     content_lyric_html = content_lyric_html + "       <td valign=top>"
		//     content_lyric_html = content_lyric_html + "        <p class=""separator3""> &nbsp; </p>"
		//     content_lyric_html = content_lyric_html + "       </td>"
		//     content_lyric_html = content_lyric_html + "      </tr>"
		//   End If
		
		//   content_lyric_html = content_lyric_html + "      <tr>"
		//   content_lyric_html = content_lyric_html + "       <td>"
		//   content_lyric_html = content_lyric_html + "        <p>" & CommentsTxt & "</p>"
		//   content_lyric_html = content_lyric_html + "       </td>"
		//   content_lyric_html = content_lyric_html + "      </tr>"
		//   End If
		//End If
		
		content_lyric_html = content_lyric_html + "      <tr>";
		content_lyric_html = content_lyric_html + "       <td valign=top>";
		content_lyric_html = content_lyric_html + "        <p class=\"footer\"> &nbsp; </p>";
		content_lyric_html = content_lyric_html + "       </td>";
		content_lyric_html = content_lyric_html + "      </tr>";

		content_lyric_html = content_lyric_html + "      <tr>";
		content_lyric_html = content_lyric_html + "       <td id='bottomspace' height='0'>";
		content_lyric_html = content_lyric_html + "       </td>";
		content_lyric_html = content_lyric_html + "      </tr>";
		
		content_lyric_html = content_lyric_html + "  </table>";
		
		document.getElementById('lm-content').contentWindow.document.body.innerHTML = content_lyric_html;
		document.getElementById('lm-content').contentWindow.scrollTo(0,0);
		
		//document.getElementById('lm-content').contentWindow.document.getElementById('mlyrics_lyrics').setAttribute("style", "font-size: 200%");
		
		document.getElementById("ML_sourceFetchProgress").hidden = true;
		document.getElementById("ML_sourceFetchStopButton").hidden = true;
		document.getElementById("refreshMenuItem").disabled = false;
		
		if (source && source != "") {
			var itemsArray = document.getElementById("ML_sourcesPopup").getElementsByTagName("menuitem");
			for (var i=0; i<itemsArray.length; i++) {
				if (itemsArray[i].label == source) {
					document.getElementById("refreshMenuItem").selectedItem = itemsArray[i];
					break;
				}
			}
		}
		else {
			// Show lyrics source from tag
			if (typeof(this.playlistPlaybackServiceListener.curMediaItem) !== "undefined" && this.playlistPlaybackServiceListener.curMediaItem) {
				var metadataLyricist = this.playlistPlaybackServiceListener.curMediaItem.getProperty("http://songbirdnest.com/data/1.0#lyricistName");
				if (metadataLyricist) {
					var MLCommentPos = metadataLyricist.search(/Songbird MLyrics \[.*\]\n/);
					if (MLCommentPos != -1) {
						var sourceStartPos = metadataLyricist.indexOf("[", MLCommentPos);
						var sourceEndPos = metadataLyricist.indexOf("]", sourceStartPos);
						var sourceSaved = metadataLyricist.substring(sourceStartPos+1, sourceEndPos);
						
						mlyrics.pane.viewMode.savedData.source 	= sourceSaved;
						
						var itemsArray = document.getElementById("ML_sourcesPopup").getElementsByTagName("menuitem");
						for (var i=0; i<itemsArray.length; i++) {
							if (itemsArray[i].label == sourceSaved) {
								document.getElementById("refreshMenuItem").selectedItem = itemsArray[i];
								break;
							}
						}
					}
				}
			}
		}
		
		this.positionListener.enableScroll(-1);
		setTimeout("mlyrics.pane.positionListener.restart()", 1000); // Needed timeout because song duration maybe got as 0 if too quick
		
		mlyrics.pane.nextItemBufferedInfo.fetchNextLyrics();
	},
	
	showInfo: function (mediaItem, force, place, forceone) {
		
		// Do not show html view if we using edit view
		if (mlyrics.pane.controller.lmDeck.selectedIndex < 1) {
			mlyrics.pane.controller.lmDeck.selectedIndex = 1;
		}
		
		var metadataLyrics = mlyrics.pane.getFullLyrics(mediaItem);
		if (metadataLyrics != "" && 
		    mediaItem.getProperty("http://songbirdnest.com/data/1.0#hasLyrics") &&
		    mediaItem.getProperty("http://songbirdnest.com/data/1.0#hasLyrics").indexOf("-tagblack") != -1 
		   )
		{
			mlyrics.lib.debugOutput("Attempt to re-save lyrics");
			mlyrics.pane.saveLyrics("", "", mediaItem, metadataLyrics);
		}
		
		var notifRem = document.getElementById("infobar");
		notifRem.removeAllNotifications(true);
		
		var metadataArtist = mediaItem.getProperty(SBProperties.artistName);
		var metadataAlbum = mediaItem.getProperty(SBProperties.albumName);
		var metadataTrack = mediaItem.getProperty(SBProperties.trackName);
		
		if (!metadataArtist) metadataArtist = "";
		if (!metadataAlbum) metadataAlbum = "";
		if (!metadataTrack) metadataTrack = "";
		
		if (place == -1) {
			var goUri = "http://www.google.com/search?&q=lyrics " + encodeURIComponent(metadataArtist) + "%20" + encodeURIComponent(metadataTrack);
			mlyrics.pane.openAndReuseOneTabPerAttribute("mlyrics-luckysearch", goUri);
			return;
		}

		document.getElementById('lm-content').hidden =  false;
		document.getElementById('web-content').hidden = true;
		document.getElementById('web-dropbtn').hidden = true;
		
		document.getElementById('lm-content').contentWindow.document.body.innerHTML = "";
		
		this.controller.haveLyr = false;
		
		if (metadataLyrics != null && metadataLyrics != "" & !force) {
			
			var showNotifsPref = mlyrics.pane.prefs.getBoolPref("showNotifs");
			var saveLyricsPref = mlyrics.pane.prefs.getCharPref("saveLyrics");
			var saveTranslationPref = mlyrics.pane.prefs.getCharPref("saveTranslation");
			
			// We have cached translation
			if (mlyrics.pane.nextItemBufferedInfo.item && mlyrics.pane.nextItemBufferedInfo.item == mediaItem) {
				document.getElementById("refreshMenuItem").selectedItem = document.getElementById("contxtTranslateMetaMenu");
				
				if (showNotifsPref && saveTranslationPref == "PROMPT") {
					mlyrics.pane.addNotification("infobar", 3, mediaItem, mlyrics.pane.nextItemBufferedInfo.lyrics, null);
				}
				else if (saveTranslationPref == "ALWAYSAVE") {
					mlyrics.pane.saveLyrics("", "", mediaItem, mlyrics.pane.nextItemBufferedInfo.lyrics, null);
				}
				
				this.buildPage(metadataArtist, metadataAlbum, metadataTrack, mlyrics.pane.nextItemBufferedInfo.lyrics);
				return;
			}
			
			document.getElementById("contxtTranslateMetaMenu").disabled = false;
			
			if (    typeof(force) != "undefined" ||
				this.prefs.getBoolPref("translateMetadata") &&
				( place == -2 || metadataLyrics.indexOf("\n [ Google translated ] ") == -1 )
				)
			{
				this.buildPage(metadataArtist, metadataAlbum, metadataTrack, metadataLyrics);

				document.getElementById("ML_sourceFetchProgress").hidden = false;
				document.getElementById("ML_sourceFetchStopButton").hidden = false;
				document.getElementById("ML_sourceAddressNextButton").hidden = true;
				document.getElementById("refreshMenuItem").disabled = true;
				document.getElementById("ML_sourceAddressNextButton").hidden = true;
				document.getElementById("refreshMenuItem").selectedItem = document.getElementById("contxtTranslateMetaMenu");
				
				this.translateMetadataLyrics(   metadataLyrics,
								function (translated) {
									
									if (translated == "") {
										var fullLyrics = metadataLyrics;
										
										document.getElementById("refreshMenuItem").selectedItem = document.getElementById("contxtRefreshTagMenu");
									}
									else {
										var delimiter = "\n\n =================== \n [ Google translated ] \n =================== \n\n";
										var fullLyrics = metadataLyrics + delimiter + translated;
										
										if (showNotifsPref && saveTranslationPref == "PROMPT") {
											mlyrics.pane.addNotification("infobar", 3, mediaItem, fullLyrics, null);
										}
										else if (saveTranslationPref == "ALWAYSAVE") {
											mlyrics.pane.saveLyrics("", "", mediaItem, fullLyrics, null);
										}
										
										document.getElementById("refreshMenuItem").selectedItem = document.getElementById("contxtTranslateMetaMenu");
									}
									
									document.getElementById("ML_sourceFetchProgress").hidden = true;
									document.getElementById("ML_sourceFetchStopButton").hidden = true;
									document.getElementById("refreshMenuItem").disabled = false;
									
									mlyrics.pane.buildPage(metadataArtist, metadataAlbum, metadataTrack, fullLyrics);
								},
								true
							);
			}
			else {
				document.getElementById("refreshMenuItem").selectedItem = document.getElementById("contxtRefreshTagMenu");
				this.buildPage(metadataArtist, metadataAlbum, metadataTrack, metadataLyrics);
			}
		}
		else {
			document.getElementById("contxtTranslateMetaMenu").disabled = true;
			this.updateLyrics(metadataArtist, metadataAlbum, metadataTrack, mediaItem, place, forceone);
		}
	},
	
	checkContext: function () {
		
		var selected = document.getElementById('lm-content').contentWindow.getSelection();
		selected = String(selected);
		
		if (selected.length > 0) {
			document.getElementById("copyMenuItem").disabled = false;
		}
		
		if (selected.length < 1) {
			document.getElementById("copyMenuItem").disabled = true;
		}
		
		if (this.gMM.status.state != Components.interfaces.sbIMediacoreStatus.STATUS_PLAYING) {
			//document.getElementById("editBtn").disabled = true;
			//document.getElementById("refreshMenuItem").disabled = true;
			//document.getElementById("clearBtn").disabled = true;
		}
		else if (this.gMM.status.state == Components.interfaces.sbIMediacoreStatus.STATUS_PLAYING) {
			//document.getElementById("editBtn").disabled = false;
			//document.getElementById("refreshMenuItem").disabled = false;
			//document.getElementById("clearBtn").disabled = false;
		}
	},
	
	contextRefresh: function (force, place, forceone) {
		
		if (mlyrics.pane.prefs.getBoolPref("showNowSelected")) {
			if (place == -1) {
				var mediaItem = this.mediaItemSelectListener.curMediaItem;
				
				var metadataArtist = mediaItem.getProperty(SBProperties.artistName);
				var metadataTrack = mediaItem.getProperty(SBProperties.trackName);
				
				if (!metadataArtist) metadataArtist = "";
				if (!metadataTrack) metadataTrack = "";
		
				var goUri = "http://www.google.com/search?&q=lyrics " + encodeURIComponent(metadataArtist) + "%20" + encodeURIComponent(metadataTrack);
				mlyrics.pane.openAndReuseOneTabPerAttribute("mlyrics-luckysearch", goUri);
			}
			else {
				if (force) {
					var selectedMediaItems = mlyrics.pane.mediaItemSelectListener.mediaListView.selection.selectedMediaItems;
					while (selectedMediaItems.hasMoreElements()) {
						var mediaItem = selectedMediaItems.getNext();
						this.showInfo(mediaItem, force, place, forceone);
					}
				}
				else {
					if (place == -2) {
						var mediaItem = mlyrics.pane.mediaItemSelectListener.curMediaItem;
						this.showInfo(mediaItem, force, place, forceone);
					}
					else {
						this.mediaItemSelectListener.updatePaneInfo(true);
					}
				}
			}
		}
		else {
			if ((this.gMM.status.state == Components.interfaces.sbIMediacoreStatus.STATUS_PLAYING) ||
				(this.gMM.status.state == Components.interfaces.sbIMediacoreStatus.STATUS_PAUSED) ||
				(this.gMM.status.state == Components.interfaces.sbIMediacoreStatus.STATUS_BUFFERING))
			{
				var mediaItem = this.playlistPlaybackServiceListener.curMediaItem;
				this.showInfo(mediaItem, force, place, forceone);
			}
		}
	},
	
	contextClear: function () {

		if ((this.gMM.status.state == Components.interfaces.sbIMediacoreStatus.STATUS_PLAYING) ||
		    (this.gMM.status.state == Components.interfaces.sbIMediacoreStatus.STATUS_PAUSED) ||
		    (this.gMM.status.state == Components.interfaces.sbIMediacoreStatus.STATUS_BUFFERING))
		{
			function makeClean (mediaItem) {
				mediaItem.setProperty("http://songbirdnest.com/data/1.0#lyrics", null);
				mediaItem.setProperty("http://songbirdnest.com/data/1.0#translatedLyrics", null);

				var artist = mediaItem.getProperty(SBProperties.artistName);
				var album = mediaItem.getProperty(SBProperties.albumName);
				var track = mediaItem.getProperty(SBProperties.trackName);

				mediaItem.setProperty("http://songbirdnest.com/data/1.0#lyricistName", null);
				mediaItem.setProperty("http://songbirdnest.com/data/1.0#mlyricsScrollCorrArray", null);

				mlyrics.lib.writeID3Tag(mediaItem);
				mlyrics.pane.buildPage(artist, album, track, "");

				// Remove notifications
				var mTop = document.getElementById("infobar");
				mTop.removeAllNotifications(true);

				document.getElementById("refreshMenuItem").selectedItem = document.getElementById("ML_contextSourcesSeparator");
			}
			
			if (mlyrics.pane.prefs.getBoolPref("showNowSelected")) {
				var selectedMediaItems = mlyrics.pane.mediaItemSelectListener.mediaListView.selection.selectedMediaItems;
				while (selectedMediaItems.hasMoreElements()) {
					makeClean(selectedMediaItems.getNext());
				}
			}
			else {
				makeClean(this.playlistPlaybackServiceListener.curMediaItem);
			}
		}
	},
	
	contextMakeInstrumental:function () {
		if ((this.gMM.status.state == Components.interfaces.sbIMediacoreStatus.STATUS_PLAYING) ||
		    (this.gMM.status.state == Components.interfaces.sbIMediacoreStatus.STATUS_PAUSED) ||
		    (this.gMM.status.state == Components.interfaces.sbIMediacoreStatus.STATUS_BUFFERING))
		{
			function makeInstrumental (mediaItem) {
				mediaItem.setProperty("http://songbirdnest.com/data/1.0#lyrics", "[Instrumental]");
				mediaItem.setProperty("http://songbirdnest.com/data/1.0#translatedLyrics", null);
				mediaItem.setProperty("http://songbirdnest.com/data/1.0#lyricistName", null);
				mediaItem.setProperty("http://songbirdnest.com/data/1.0#mlyricsScrollCorrArray", null);

				var artist = mediaItem.getProperty(SBProperties.artistName);
				var album = mediaItem.getProperty(SBProperties.albumName);
				var track = mediaItem.getProperty(SBProperties.trackName);

				mlyrics.lib.writeID3Tag(mediaItem);
				mlyrics.pane.buildPage(artist, album, track, "[Instrumental]");

				// Remove notifications
				var mTop = document.getElementById("infobar");
				mTop.removeAllNotifications(true);
			}
			
			if (mlyrics.pane.prefs.getBoolPref("showNowSelected")) {
				var selectedMediaItems = mlyrics.pane.mediaItemSelectListener.mediaListView.selection.selectedMediaItems;
				while (selectedMediaItems.hasMoreElements()) {
					makeInstrumental(selectedMediaItems.getNext());
				}
			}
			else {
				makeInstrumental(this.playlistPlaybackServiceListener.curMediaItem);
			}
		}
	},

	removeSmartScrollInfo: function () {
		if ((this.gMM.status.state == Components.interfaces.sbIMediacoreStatus.STATUS_PLAYING) ||
		    (this.gMM.status.state == Components.interfaces.sbIMediacoreStatus.STATUS_PAUSED) ||
		    (this.gMM.status.state == Components.interfaces.sbIMediacoreStatus.STATUS_BUFFERING))
		{
			function makeSmartScrollInfoClean(mediaItem) {
				mediaItem.setProperty("http://songbirdnest.com/data/1.0#mlyricsScrollCorrArray", null);
				mlyrics.lib.writeID3Tag(mediaItem);
			}
			
			if (mlyrics.pane.prefs.getBoolPref("showNowSelected")) {
				var selectedMediaItems = mlyrics.pane.mediaItemSelectListener.mediaListView.selection.selectedMediaItems;
				while (selectedMediaItems.hasMoreElements()) {
					makeSmartScrollInfoClean(selectedMediaItems.getNext());
				}
			}
			else {
				makeSmartScrollInfoClean(this.playlistPlaybackServiceListener.curMediaItem);
			}
		}
	},

	translClear: function () {
		if ((this.gMM.status.state == Components.interfaces.sbIMediacoreStatus.STATUS_PLAYING) ||
		    (this.gMM.status.state == Components.interfaces.sbIMediacoreStatus.STATUS_PAUSED) ||
		    (this.gMM.status.state == Components.interfaces.sbIMediacoreStatus.STATUS_BUFFERING))
		{
			function makeTranslClean(mediaItem) {
				mediaItem.setProperty("http://songbirdnest.com/data/1.0#translatedLyrics", null);

				var artist = mediaItem.getProperty(SBProperties.artistName);
				var album = mediaItem.getProperty(SBProperties.albumName);
				var track = mediaItem.getProperty(SBProperties.trackName);

				mlyrics.lib.writeID3Tag(mediaItem);
				mlyrics.pane.buildPage(artist, album, track, mediaItem.getProperty(SBProperties.lyrics));
			}
			
			if (mlyrics.pane.prefs.getBoolPref("showNowSelected")) {
				var selectedMediaItems = mlyrics.pane.mediaItemSelectListener.mediaListView.selection.selectedMediaItems;
				while (selectedMediaItems.hasMoreElements()) {
					makeTranslClean(selectedMediaItems.getNext());
				}
			}
			else {
				makeTranslClean(this.playlistPlaybackServiceListener.curMediaItem);
			}
		}
	},

	copyToClipboard: function () {
		var selected = document.getElementById('lm-content').contentWindow.getSelection();
		this.clipboardHelper.copyString(selected); 
	},
	
	doCommand: function (command) {
		
		( function () {
			if (mlyrics.pane.gMM.sequencer.viewPosition >= 0)
			{
				var mediaView = mlyrics.pane.gMM.sequencer.view;
				var trackIndex = mlyrics.pane.gMM.sequencer.viewPosition;
				var mediaTab = mlyrics.pane.gBrowser.getTabForView(mediaView);
				if (mediaTab) {
					if (mediaTab.mediaPage) {
						mediaTab.mediaPage.highlightItem(trackIndex);
					} else if (mediaTab.outerPlaylist) {
						var tree = mediaTab.outerPlaylist.tree;
						tree.treeBoxObject.ensureRowIsVisible(trackIndex);
						tree.view.selection.select(trackIndex);
					}
				}
			}
		} ) ();
		
		var controller = top.document.commandDispatcher.getControllerForCommand(command);
		if (controller && controller.isCommandEnabled(command)) {
			controller.doCommand(command);
		}
		
		if (command == "cmd_metadata") {
			this.contextRefresh()
		}
	},
	
	onSourceClick: function  (goUri) {
		var newTab = gBrowser.addTab(goUri);
		gBrowser.selectedTab = newTab;
	},
	
	viewMode: {
		savedData: {
			artist: "",
			album: "",
			track: "",
			lyrics: "",
			source: null
		},
		
		setupMenu: function (mode) {
			
			if (typeof(mode) == 'undefined') {
				var mode = mlyrics.pane.prefs.getIntPref("lyricsViewMode");
			}

			if (mode == 3) { // Show as is mode needs to be deactivated
				mode = 2;
				mlyrics.pane.prefs.setIntPref("lyricsViewMode", mode);
			}
			
			document.getElementById("viewModeMenuBtnItem0").setAttribute("checked", "false");
			document.getElementById("viewModeMenuBtnItem1").setAttribute("checked", "false");
			document.getElementById("viewModeMenuBtnItem2").setAttribute("checked", "false");
			document.getElementById("viewModeMenuBtnItem3").setAttribute("checked", "false");
			document.getElementById("viewModeMenuBtnItem4").setAttribute("checked", "false");
			document.getElementById("viewModeMenuBtnItem" + mode).setAttribute("checked", true);

			document.getElementById("viewModeMenuItem0").setAttribute("checked", "false");
			document.getElementById("viewModeMenuItem1").setAttribute("checked", "false");
			document.getElementById("viewModeMenuItem2").setAttribute("checked", "false");
			document.getElementById("viewModeMenuItem3").setAttribute("checked", "false");
			document.getElementById("viewModeMenuItem4").setAttribute("checked", "false");
			document.getElementById("viewModeMenuItem" + mode).setAttribute("checked", true);
		},
		
		getHTMLView: function (lyrics, mode) {
			
			this.setupMenu();
			
			lyrics = lyrics.replace(/\r/g, "");
			
			var translDelimPos1 = lyrics.indexOf("\n\n =================== \n [ ");
			if (translDelimPos1 == -1) {
				translDelimPos1 = lyrics.length;
				mode = 0;
			}
			
			var lyricsStyleProps = mlyrics.pane.getStyleProperty("lyrics");
			var transLyricsStyleProps = mlyrics.pane.getStyleProperty("transLyrics");
			
			if (typeof(mode) == 'undefined') {
				var mode = mlyrics.pane.prefs.getIntPref("lyricsViewMode");
			}

			function getOnlyOriginalView () {
				var lyricsOrigArray = lyrics.substring(0, translDelimPos1).split("\n");
				var lyricsStyleProps = "";

				lyricsStyleProps = mlyrics.pane.getStyleProperty("lyrics");

				lyrics = "";
				for (var i=0; i<lyricsOrigArray.length; i++) {
					if (lyricsOrigArray[i] == "") lyrics += "<br>";
					var transLyricsStyleProps = "";
					lyrics += "<p id='mlyrics_lyrics_row" + i + "' class='mlyrics_lyrics' style='" + lyricsStyleProps + "'>" + lyricsOrigArray[i] + "</p>";
				}
			}

			switch (mode) {
				
				case 0:
					getOnlyOriginalView();
					break;
					
				case 1:
					var translDelimPos2 = lyrics.indexOf(" ] \n =================== \n", translDelimPos1);
					if (translDelimPos2 != -1) {
						var lyricsTransArray = lyrics.substr(translDelimPos2+27).split("\n");
						
						var transLyricsStyleProps = mlyrics.pane.getStyleProperty("transLyrics");
						
						lyrics = "";
						for (var i=0; i<lyricsTransArray.length; i++) {
							if (lyricsTransArray[i] == "") lyrics += "<br>";
							lyrics += "<p id='mlyrics_lyrics_row" + i + "' class='mlyrics_lyrics' style='" + transLyricsStyleProps + "'>" + lyricsTransArray[i] + "</p>";
						}
					}
					else {
						mlyrics.lib.debugOutput("No translation found, view mode switched to show only original lyrics");
						getOnlyOriginalView();
					}
					break;
					
				case 2:
					lyrics = this.mashLines(lyrics);
					break;
					
				case 4:
					lyrics = this.intercalateVerses(lyrics);
					break;
					
				case 3:
				default:
					break;
			}
			
			return lyrics;
		},
		
		change: function (mode) {
			
			mlyrics.pane.prefs.setIntPref("lyricsViewMode", mode);
			mlyrics.pane.buildPage(this.savedData.artist, this.savedData.album, this.savedData.track, this.savedData.lyrics, this.savedData.source);
		},
		
		mashLines: function (lyrics) {
			var translDelimPos1 = lyrics.indexOf("\n\n =================== \n [ ");
			if (translDelimPos1 == -1) return lyrics;
			var translDelimPos2 = lyrics.indexOf(" ] \n =================== \n", translDelimPos1);
			var lyricsOrigArray = lyrics.substring(0, translDelimPos1).split("\n");
			var lyricsTransArray = lyrics.substr(translDelimPos2+27).split("\n");
			
			if (lyricsOrigArray[lyricsOrigArray.length-1] == "") lyricsOrigArray.length --;
			if (lyricsTransArray[lyricsTransArray.length-1] == "") lyricsTransArray.length --;
			
			var lyricsStyleProps = mlyrics.pane.getStyleProperty("lyrics");
			var transLyricsStyleProps = mlyrics.pane.getStyleProperty("transLyrics");
			
			if (lyricsOrigArray.length == lyricsTransArray.length) {
				lyrics = "";
				for (var i=0; i<lyricsOrigArray.length; i++) {
					if (lyricsOrigArray[i] == "") lyrics += "<br>";
					lyrics += "<p id='mlyrics_lyrics_row" + i + "' class='mlyrics_lyrics' style='" + lyricsStyleProps + "'>" + lyricsOrigArray[i] + "</p>";
					lyrics += "<p class='mlyrics_lyrics' style='" + transLyricsStyleProps + "'>" + lyricsTransArray[i] + "</p>";
				}
			}
			
			return lyrics;
		},
		
		intercalateVerses: function (lyrics) {
			var translDelimPos1 = lyrics.indexOf("\n\n =================== \n [ ");
			if (translDelimPos1 == -1) return lyrics;
			var translDelimPos2 = lyrics.indexOf(" ] \n =================== \n", translDelimPos1);
			var lyricsOrigArray = lyrics.substring(0, translDelimPos1).split("\n");
			var lyricsTransArray = lyrics.substr(translDelimPos2+27).split("\n");
			
			if (lyricsOrigArray[lyricsOrigArray.length-1] == "") lyricsOrigArray.length --;
			if (lyricsTransArray[lyricsTransArray.length-1] == "") lyricsTransArray.length --;
			
			var lyricsStyleProps = mlyrics.pane.getStyleProperty("lyrics");
			var transLyricsStyleProps = mlyrics.pane.getStyleProperty("transLyrics");
			
			if (lyricsOrigArray.length == lyricsTransArray.length) {
				lyrics = "";
				var originalLyrics = "";
				var translatedLyrics = "";
				var j=0;
				for (var i=0; i<lyricsOrigArray.length; i++) {
						if (lyricsOrigArray[i].replace(/^\s+|\s+$/g, '') == '') { //That's a trim
								lyrics = lyrics +
									"<p class='mlyrics_lyrics' style='" + lyricsStyleProps + "'>" + originalLyrics + "</p>" +
									"<label id='mlyrics_lyrics_row" + (j++) + "' />" + // Empty row must be enumerated too
									"<br>" +
									"<p class='mlyrics_lyrics' style='" + transLyricsStyleProps + "'>" + translatedLyrics + "</p>" +
									"<br><br><br>";
								originalLyrics = "";
								translatedLyrics = "";
						} else {
								originalLyrics += (originalLyrics == "" ? "" : "<br>") + "<label id='mlyrics_lyrics_row" + (j++) + "'>" + lyricsOrigArray[i] + "</label>";
								translatedLyrics += (translatedLyrics == "" ? "" : "<br>") + "<label>" + lyricsTransArray[i] + "</label>";
						}
				}
				if (originalLyrics != "") {
					lyrics = lyrics +
						"<p class='mlyrics_lyrics' style='" + lyricsStyleProps + "'>" + originalLyrics + "</p>" +
						"<br>" +
						"<p class='mlyrics_lyrics' style='" + transLyricsStyleProps + "'>" + translatedLyrics + "</p>" +
						"<br><br>";
				}
			}
			
			return lyrics;
		}
	},
	
	editMode: {
		editMediaItem: 0,
		lyricsSource: "",
		savedWidth: 250,
		delimiter: "\n\n =================== \n [ Translated ] \n =================== \n",
		
		onAccept: function () {
			if (mlyrics.pane.editMode.editMediaItem) {
				var editedLyrics = document.getElementById("edit-content").value;
				var editedTranslation = document.getElementById("edit-translContent").value;

				if (editedLyrics == "") editedTranslation = "";

				while(editedLyrics.substr(editedLyrics.length-1) == "\n")
					editedLyrics = editedLyrics.substr(0, editedLyrics.length-1);

				while(editedTranslation.substr(editedTranslation.length-1) == "\n")
					editedTranslation = editedTranslation.substr(0, editedTranslation.length-1);
				
				mlyrics.pane.saveLyrics("", "", mlyrics.pane.editMode.editMediaItem, editedLyrics + this.delimiter + editedTranslation, mlyrics.pane.editMode.lyricsSource);
			}

			mlyrics.pane.displayPane.width = this.savedWidth;

			document.getElementById("lm-deck").selectedIndex = 1;
			mlyrics.pane.contextRefresh();
		},
		
		onDiscard: function () {
			mlyrics.pane.editMode.editMediaItem = 0;

			mlyrics.pane.displayPane.width = this.savedWidth;
			document.getElementById("lm-deck").selectedIndex = 1;
		},
		
		init: function () {
			this.onViewUpdate();

			var mainwindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor).getInterface(Components.interfaces.nsIWebNavigation)
					.QueryInterface(Components.interfaces.nsIDocShellTreeItem).rootTreeItem
					.QueryInterface(Components.interfaces.nsIInterfaceRequestor).getInterface(Components.interfaces.nsIDOMWindow);

			this.savedWidth = mlyrics.pane.displayPane.width;

			if (mlyrics.pane.prefs.getCharPref("enableTranslate") == "TRANSLATE" ) {
				var servicepaneWidth = mainwindow.document.getElementById("servicepane_box").width;
				if (mainwindow.document.getElementById("mainplayer").getAttribute("sizemode") == "normal") {
					var newPaneWidth = mainwindow.document.getElementById("mainplayer").width - servicepaneWidth;
				}
				else {
					var newPaneWidth = screen.width - servicepaneWidth;
				}
				newPaneWidth -= 200;

				mlyrics.pane.displayPane.width = newPaneWidth;
				
				document.getElementById("editModeSplitter").hidden = false;
				document.getElementById("editModeTranslBox").hidden = false;
			}
			else {
				document.getElementById("editModeSplitter").hidden = true;
				document.getElementById("editModeTranslBox").hidden = true;
			}

			document.getElementById("lm-deck").selectedIndex = 2;
		},

		onViewUpdate: function () {
			if (mlyrics.pane.prefs.getBoolPref("showNowSelected")) {
				var newItem = mlyrics.pane.mediaItemSelectListener.curMediaItem;
				document.getElementById("nextPrevBtnsHboxEdit").hidden = false;
			}
			else {
				var newItem = mlyrics.pane.playlistPlaybackServiceListener.curMediaItem;
				document.getElementById("nextPrevBtnsHboxEdit").hidden = true;
			}

			if (newItem === mlyrics.pane.editMode.editMediaItem) return;

			mlyrics.pane.editMode.editMediaItem = newItem;

			var fullLyrics = mlyrics.pane.getFullLyrics(mlyrics.pane.editMode.editMediaItem);

			mlyrics.pane.editMode.lyricsSource = mlyrics.pane.editMode.editMediaItem.getProperty('http://songbirdnest.com/data/1.0#lyricistName');

			var lyricsOrig = fullLyrics;
			var lyricsTrans = "";
			this.delimiter = "\n\n =================== \n [ Translated ] \n =================== \n";

			var translDelimPos1 = fullLyrics.indexOf("\n\n =================== \n [ ");
			if (translDelimPos1 != -1) {
				var translDelimPos2 = fullLyrics.indexOf(" ] \n =================== \n", translDelimPos1);
				lyricsOrig = fullLyrics.substring(0, translDelimPos1);
				lyricsTrans = fullLyrics.substr(translDelimPos2+27);
				this.delimiter = fullLyrics.substring(translDelimPos1, translDelimPos2+27);
			}

			// Fill edit lyrics boxes
			document.getElementById("edit-content").value = lyricsOrig;
			document.getElementById("edit-translContent").value = lyricsTrans;

			document.getElementById("edit-trackInfo").value =
				mlyrics.pane.editMode.editMediaItem.getProperty('http://songbirdnest.com/data/1.0#trackName')+
				" [" +
				mlyrics.pane.editMode.editMediaItem.getProperty('http://songbirdnest.com/data/1.0#artistName') +
				" - " +
				mlyrics.pane.editMode.editMediaItem.getProperty('http://songbirdnest.com/data/1.0#albumName') +
				"]";
		}
	},

	editTimeTracks: {
		trackMediaItem: 0,
		selectedItemStyle: "background-color: grey;",
		oldItemStyle: "text-decoration:line-through; font-style: italic;",
		currentIndex: 0,
		savedWidth: 250,

		init: function () {
			if (mlyrics.pane.fullScreenMode.fullScreen) {
				document.getElementById("timeTracksMenuItem").disabled = true;
				return;
			}
			
			mlyrics.pane.mediaCoreManager.playbackControl.pause();
			setTimeout(function () {mlyrics.pane.mediaCoreManager.playbackControl.play();}, 2000);

			var mainwindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor).getInterface(Components.interfaces.nsIWebNavigation)
					.QueryInterface(Components.interfaces.nsIDocShellTreeItem).rootTreeItem
					.QueryInterface(Components.interfaces.nsIInterfaceRequestor).getInterface(Components.interfaces.nsIDOMWindow);

			this.savedWidth = mlyrics.pane.displayPane.width;

			var servicepaneWidth = mainwindow.document.getElementById("servicepane_box").width;
			if (mainwindow.document.getElementById("mainplayer").getAttribute("sizemode") == "normal") {
				var newPaneWidth = mainwindow.document.getElementById("mainplayer").width - servicepaneWidth;
			}
			else {
				var newPaneWidth = screen.width - servicepaneWidth;
			}
			newPaneWidth -= 200;

			if (mlyrics.pane.displayPane.width * 1.5 < newPaneWidth) newPaneWidth = mlyrics.pane.displayPane.width * 1.5;
			mlyrics.pane.displayPane.width = newPaneWidth;

			this.restart();

			document.getElementById("lm-deck").selectedIndex = 3;
		},

		restart: function () {
			this.currentIndex = 0;

			if (mlyrics.pane.viewMode.savedData.lyrics == "" || mlyrics.pane.viewMode.savedData.lyrics.substr(0, 14).toLowerCase() == "[instrumental]") {
				this.onDiscard();
				return;
			}

			this.trackMediaItem = mlyrics.pane.playlistPlaybackServiceListener.curMediaItem;
			
			document.getElementById("prev-timetracks-button").disabled = false;
			document.getElementById("refr-timetracks-button").disabled = false;
			document.getElementById("next-timetracks-button").disabled = false;
			document.getElementById("cancel-timetracks-button").disabled = false;

			var editTimeTracksBox = document.getElementById("edit-timetreacks");

			for (var i=editTimeTracksBox.childNodes.length-1; i>0; i--) {
				editTimeTracksBox.removeChild(editTimeTracksBox.childNodes[i]);
			}

			var translDelimPos1 = mlyrics.pane.viewMode.savedData.lyrics.indexOf("\n\n =================== \n [ ");
			if (translDelimPos1 == -1) {
				var tempLyrics = mlyrics.pane.viewMode.savedData.lyrics.replace(/\r/g, "");
			}
			else {
				var tempLyrics = mlyrics.pane.viewMode.savedData.lyrics.substr(0, translDelimPos1).replace(/\r/g, "");
			}

			if (tempLyrics.substr(tempLyrics.length-1, 2) == "\n\n") tempLyrics = tempLyrics.substr(0, tempLyrics.length-1);

			editTimeTracksBox.childNodes[0].removeAttribute("style");
			editTimeTracksBox.childNodes[0].childNodes[0].setAttribute("style", "visibility: hidden");

			var lyricsArray = tempLyrics.split("\n");
			if (lyricsArray[lyricsArray.length-1] == "") lyricsArray.length --;

			for (var i=0; i < lyricsArray.length; i++) {
				var elementBox = editTimeTracksBox.childNodes[0].cloneNode(true);
				elementBox.childNodes[1].setAttribute("value", lyricsArray[i]);

				editTimeTracksBox.appendChild(elementBox);
			}

			editTimeTracksBox.childNodes[0].childNodes[0].removeAttribute("style");
			editTimeTracksBox.childNodes[0].childNodes[0].setAttribute("value", "00:00.00");

			editTimeTracksBox.childNodes[this.currentIndex].setAttribute("style", this.selectedItemStyle);
			editTimeTracksBox.scrollTop = 0;
		},

		nextLine: function (needNext) {
			if (this.trackMediaItem != mlyrics.pane.playlistPlaybackServiceListener.curMediaItem) {
				document.getElementById("prev-timetracks-button").disabled = true;
				document.getElementById("refr-timetracks-button").disabled = true;
				document.getElementById("next-timetracks-button").disabled = true;
				document.getElementById("cancel-timetracks-button").disabled = true;
				
				setTimeout("mlyrics.pane.editTimeTracks.restart()", 2000);
				return;
			}

			var editTimeTracksBox = document.getElementById("edit-timetreacks");
			
			if (needNext == -1) {
				if (this.currentIndex) this.currentIndex--;
				editTimeTracksBox.scrollTop = editTimeTracksBox.scrollHeight*( (this.currentIndex-1) / editTimeTracksBox.childNodes.length);

				var timeTracks = editTimeTracksBox.childNodes[this.currentIndex].childNodes[0].value;
				var absValue = 	parseInt(timeTracks.substr(0, 2), 10)*60*1000 + 
						parseInt(timeTracks.substr(3, 2), 10)*1000 + 
						parseInt(timeTracks.substr(6, 2), 10)*10 -
						3000;
				if (absValue < 0) absValue = 0;
				
				mlyrics.pane.mediaCoreManager.playbackControl.pause();
				mlyrics.pane.gMM.playbackControl.position = absValue;
				mlyrics.pane.mediaCoreManager.playbackControl.play();
			}
			else if (needNext) {
				this.currentIndex++;
				editTimeTracksBox.scrollTop = editTimeTracksBox.scrollHeight*( (this.currentIndex-1) / editTimeTracksBox.childNodes.length);
			}

			var position = mlyrics.pane.gMM.playbackControl.position;
			var minutes = position / (60*1000);
			var absMinutes = parseInt(minutes, 10);
			if (absMinutes < 10) absMinutes = "0" + absMinutes;
			var seconds = (minutes - absMinutes) * 60;
			var absSeconds = parseInt(seconds, 10);
			if (absSeconds < 10) absSeconds = "0" + absSeconds;
			var hmilliSeconds = (seconds - absSeconds) * 100;
			var abshMilliSeconds = parseInt(hmilliSeconds, 10);
			if (abshMilliSeconds < 10) abshMilliSeconds = "0" + abshMilliSeconds;

			if (this.currentIndex) {
				editTimeTracksBox.childNodes[this.currentIndex].childNodes[0].value = absMinutes + ":" + absSeconds + "." + abshMilliSeconds;
				
				if (this.currentIndex)  {
					editTimeTracksBox.childNodes[this.currentIndex-1].setAttribute("style", this.oldItemStyle);
				}
			}

			editTimeTracksBox.childNodes[this.currentIndex].childNodes[0].removeAttribute("style");
			editTimeTracksBox.childNodes[this.currentIndex].setAttribute("style", this.selectedItemStyle);

			if (this.currentIndex <= editTimeTracksBox.childNodes.length-2) {
				editTimeTracksBox.childNodes[this.currentIndex+1].removeAttribute("style");
				
				editTimeTracksBox.childNodes[this.currentIndex+1].childNodes[0].setAttribute("value", "00:00.00");
				editTimeTracksBox.childNodes[this.currentIndex+1].childNodes[0].setAttribute("style", "visibility: hidden");
			}

			if (this.currentIndex > editTimeTracksBox.childNodes.length-2) {
				document.getElementById("prev-timetracks-button").disabled = true;
				document.getElementById("refr-timetracks-button").disabled = true;
				document.getElementById("next-timetracks-button").disabled = true;
				document.getElementById("cancel-timetracks-button").disabled = true;
				  
				mlyrics.pane.mediaCoreManager.playbackControl.pause();

				setTimeout("mlyrics.pane.editTimeTracks.onSave()", 2000);
			}
		},

		onSave: function () {
			var lrcText = "";
			var editTimeTracksBox = document.getElementById("edit-timetreacks");
			for (var i=1; i<editTimeTracksBox.childNodes.length; i++) {
				lrcText += "[" + editTimeTracksBox.childNodes[i].childNodes[0].value + "]" + editTimeTracksBox.childNodes[i].childNodes[1].value + "\n";
			}

			mlyrics.lrc.writeLRC(lrcText, this.trackMediaItem);

			this.trackMediaItem = 0;

			mlyrics.pane.gMM.sequencer.next();
			if (mlyrics.pane.mediaCoreManager.status.state == Components.interfaces.sbIMediacoreStatus.STATUS_PAUSED)
				mlyrics.pane.gMM.sequencer.play();
		},

		onDiscard: function () {
			mlyrics.pane.displayPane.width = this.savedWidth;
			document.getElementById("lm-deck").selectedIndex = 1;
		},

		remove: function () {
			if (mlyrics.pane.prefs.getBoolPref("showNowSelected")) {
				var mediaItem = mlyrics.pane.mediaItemSelectListener.curMediaItem;
			}
			else {
				var mediaItem = mlyrics.pane.playlistPlaybackServiceListener.curMediaItem;
			}

			mlyrics.lrc.removeLRC(mediaItem);

			mediaItem.setProperty("http://songbirdnest.com/data/1.0#hasLRCfile", null);
		}
	},

	multiFetchMode: {
		item: null,
		savedWidth: 250,
		mouseover: false,
		
		initMultiFetch: function () {
			document.getElementById("lm-deck").selectedIndex = 4;

			var mainwindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor).getInterface(Components.interfaces.nsIWebNavigation)
					.QueryInterface(Components.interfaces.nsIDocShellTreeItem).rootTreeItem
					.QueryInterface(Components.interfaces.nsIInterfaceRequestor).getInterface(Components.interfaces.nsIDOMWindow);

			this.savedWidth = mlyrics.pane.displayPane.width;

			var servicepaneWidth = mainwindow.document.getElementById("servicepane_box").width;
			if (mainwindow.document.getElementById("mainplayer").getAttribute("sizemode") == "normal") {
				var newPaneWidth = mainwindow.document.getElementById("mainplayer").width - servicepaneWidth;
			}
			else {
				var newPaneWidth = screen.width - servicepaneWidth;
			}
			newPaneWidth -= 200;
				
			mlyrics.pane.displayPane.width = newPaneWidth;
			
			if (mlyrics.pane.prefs.getBoolPref("showNowSelected")) {
				this.item = mlyrics.pane.mediaItemSelectListener.curMediaItem;
				document.getElementById("nextPrevBtnsHboxEdit").hidden = false;
			}
			else {
				this.item = mlyrics.pane.playlistPlaybackServiceListener.curMediaItem;
				document.getElementById("nextPrevBtnsHboxEdit").hidden = true;
			}

			var parent = document.getElementById("ML-hbox-multi-fetch");
			while (parent.childNodes.length > 1) {
				parent.removeChild(parent.lastChild);
			}

			var hideEmptyCheckbox = document.getElementById("hideEmptyCheckbox");
			hideEmptyCheckbox.checked = mlyrics.pane.prefs.getBoolPref("multiHideEmpty");
			this.onHideEmpty(hideEmptyCheckbox);

			var tagBtn = document.getElementById("ML-vbox-multi-fetch-tag");
			this.refreshFromTag(tagBtn);

			this.createNext(0);
		},

		onClose: function () {
			document.getElementById("refreshMenuItem").selectedItem = document.getElementById("contxtRefreshTagMenu");
			mlyrics.pane.displayPane.width = this.savedWidth;
			document.getElementById("lm-deck").selectedIndex = 1;
		},

		createNext: function (nIndex) {
			currentOffset = nIndex;

			var vboxTab = document.getElementById("ML-vbox-multi-fetch-Tab");
			var hbox = document.getElementById("ML-hbox-multi-fetch");

			var sources = mlyrics.pane.prefs.getCharPref("fetchSourcesList").split("|");

			var laddress = mlyrics.pane.prefs.getCharPref("laddress_" + sources[nIndex]);
			var newVbox = vboxTab.cloneNode(true);

			newVbox.id = "ML-vbox-multi-fetch-source" + nIndex;
			newVbox.childNodes[0].setAttribute("label", laddress);
			newVbox.childNodes[0].setAttribute("oncommand", "mlyrics.pane.multiFetchMode.refetch(" + nIndex + ", this)");

			hbox.appendChild(newVbox);

			if (!this.mouseover) hbox.scrollLeft = hbox.scrollWidth;

			var self = this;

			this.refetch(nIndex,
				newVbox.childNodes[0],
				function () {
					if (currentOffset == nIndex) {
						nIndex++;
						if (nIndex < sources.length) self.createNext(nIndex);
					}
				}
			);
		},

		refetch: function (lindex, callbtn, cbFn) {
			callbtn.parentNode.childNodes[0].disabled = true;
			callbtn.parentNode.childNodes[1].disabled = true;
			document.getElementById("ML-progress-multi").hidden = false;

			setTimeout(function () {callbtn.disabled = false;}, 500);

			mlyrics.fetch.fetchNext(this.item.getProperty("http://songbirdnest.com/data/1.0#artistName"),
						this.item.getProperty("http://songbirdnest.com/data/1.0#albumName"),
						this.item.getProperty("http://songbirdnest.com/data/1.0#trackName"),

						function (lyrics, source, localIndex) {

							if (document.getElementById("lm-deck").selectedIndex != 4) return;

							callbtn.parentNode.childNodes[0].disabled = false;
							callbtn.parentNode.childNodes[1].disabled = false;
							callbtn.parentNode.childNodes[1].value=lyrics;

							if (lyrics == "" && mlyrics.pane.prefs.getBoolPref("multiHideEmpty")) {
								callbtn.parentNode.hidden = true;
							}

							document.getElementById("ML-progress-multi").hidden = true;

							if (cbFn) cbFn();
						},

						lindex,
						true,

						function (lsource, lprogress, localIndex) {
							if (typeof(localIndex) == "undefined") return;
						},
						0
					);
		},

		refreshFromTag: function (callbtn) {
			callbtn.parentNode.childNodes[1].value = this.item.getProperty("http://songbirdnest.com/data/1.0#lyrics");
		},

		accept: function (callbtn) {
			var sources = mlyrics.pane.prefs.getCharPref("fetchSourcesList").split("|");
			var sIndex = parseInt(callbtn.parentNode.id.substr(26), 10);

			var fullLyrics = callbtn.parentNode.childNodes[1].value;
			var source = mlyrics.pane.prefs.getCharPref("laddress_" + sources[sIndex]);

			mlyrics.pane.saveLyrics("", "", this.item, fullLyrics, source);
			mlyrics.pane.contextRefresh();

			this.onClose();

			var itemsArray = document.getElementById("ML_sourcesPopup").getElementsByTagName("menuitem");
			for (var i=0; i<itemsArray.length; i++) {
				if (itemsArray[i].label == source) {
					document.getElementById("refreshMenuItem").selectedItem = itemsArray[i];
					break;
				}
			}
		},

		onHideEmpty: function (checkbox) {
			var hbox = document.getElementById("ML-hbox-multi-fetch");
			for (var i=0; i<hbox.childNodes.length; i++) {
				if (hbox.childNodes[i].childNodes[1].value == "" && hbox.childNodes[i].id != "ML-vbox-multi-fetch-Tab")
					hbox.childNodes[i].hidden = checkbox.checked;
			}
			mlyrics.pane.prefs.setBoolPref("multiHideEmpty", !!checkbox.checked);
		}
	},
	
	// pane.xul controller
	controller: {
		
		usercollapsed: true,
		haveLyr: false,
		isInstr: false,
		lmDeck: null,
		
		onLoad: function() {
			document.addEventListener("unload", function(e) {
				mlyrics.PaneController.onUnLoad(e);
				},
				false);
				
			// Save a pointer to our deck
			this.lmDeck = document.getElementById("lm-deck");
				
			// General initialization need
			mlyrics.lrc.init();
			mlyrics.pane.init();
			mlyrics.pane.playlistPlaybackServiceListener.init();
			mlyrics.pane.titleDataRemoteObserver.init();
			mlyrics.pane.mediaItemSelectListener.start();
			mlyrics.pane.preferencesObserver.register();
			
			mlyrics.pane.preferencesObserver.updateStyle();
			mlyrics.pane.preferencesObserver.updateNotif();
			
			// Check for the new sources since last update and add them to preferences (not default!)
			var sourcesstr = mlyrics.pane.prefs.getCharPref("fetchSourcesList");
			if (sourcesstr) {
				var defsources = mlyrics.pane.defprefs.getCharPref("fetchSourcesList").split("|");
						
				for (var i=0; i<defsources.length; i++) {
					if (sourcesstr.indexOf(defsources[i]) == -1) {
						sourcesstr = sourcesstr + "|" + defsources[i];
					}
				}
				
				mlyrics.pane.prefs.setCharPref("fetchSourcesList", sourcesstr);
			}
			
			// Check show notifications context menu
			if (mlyrics.pane.prefs.getBoolPref("showNotifs")) {
				document.getElementById("notifEnabledBtn").checked = true;
				document.getElementById("notifEnabledMenuItem").setAttribute("checked", "true");
			} else {
				document.getElementById("notifEnabledBtn").checked = false;
				document.getElementById("notifEnabledMenuItem").setAttribute("checked", "false");
			}
			
			// Build source menu
			( function () {
				var sources = mlyrics.pane.prefs.getCharPref("fetchSourcesList").split("|");
				var sourcesPopup = document.getElementById("ML_sourcesPopup");
				var contextSourcesSeparator = document.getElementById("ML_contextSourcesSeparator");
				
				var oldItems = sourcesPopup.getElementsByTagName("menuitem");
				for (var i=oldItems.length-1; i>=0; i--) {
					if (oldItems[i].id && oldItems[i].id.substr(0, 5) == "menu_") {
						sourcesPopup.removeChild(oldItems[i]);
					}
				}
				
				for (var i=0; i<sources.length; i++) {
					var sitem = document.createElement("menuitem");
					sitem.setAttribute("id", "menu_" + sources[i]);
					sitem.setAttribute("label", mlyrics.pane.prefs.getCharPref("laddress_" + sources[i]));
					sitem.setAttribute("oncommand", "mlyrics.pane.contextRefresh(true, " + i + ", true);");
					sourcesPopup.insertBefore(sitem, contextSourcesSeparator);
				}
			} ) ();
			
			// view mode
			//mlyrics.pane.viewMode.setupMenu();
			
			// Check to see if we're already playing something
			if ((mlyrics.pane.gMM.status.state == Components.interfaces.sbIMediacoreStatus.STATUS_PLAYING) ||
			    (mlyrics.pane.gMM.status.state == Components.interfaces.sbIMediacoreStatus.STATUS_PAUSED) ||
			    (mlyrics.pane.gMM.status.state == Components.interfaces.sbIMediacoreStatus.STATUS_BUFFERING))
			{
				var view = mlyrics.pane.gMM.sequencer.view;
				if (view) {
					var i = view.getItemByIndex(mlyrics.pane.gMM.sequencer.viewPosition);
					mlyrics.pane.showInfo(i);
				}
			} else {
				mlyrics.lib.debugOutput("Pane collapsed on load");
				mlyrics.pane.ourDisplayPane.collapsed = true;
			}
			
			window.top.gBrowser.tabContainer.addEventListener("TabSelect", mlyrics.pane.tabSelectListener, false);
		},
		
		showPane: function (needShow) {
			
			mlyrics.lib.debugOutput("Collapse action: " + this.usercollapsed + ", " + mlyrics.pane.ourDisplayPane.collapsed + ", " + needShow);
			
			if (mlyrics.pane.ourDisplayPane.collapsed != this.usercollapsed) return;
			
			mlyrics.pane.ourDisplayPane.collapsed 	= !needShow;
			this.usercollapsed 			= !needShow;
		},
		
		// On pane unload event
		onUnLoad: function() {
			window.top.gBrowser.tabContainer.removeEventListener("TabSelect", mlyrics.pane.tabSelectListener, false);
			mlyrics.pane.gMM.removeListener(mlyrics.pane.playlistPlaybackServiceListener);
			mlyrics.pane.gMM.removeListener(mlyrics.pane.titleDataRemoteObserver);
			mlyrics.pane.mediaItemSelectListener.stop();
			mlyrics.pane.preferencesObserver.unregister();
		}
	},
	
	mediaItemSelectListener: {
		timer: null,
		curMediaItem: null,
		mediaListView: null,
		
		start: function () {
			mlyrics.lib.debugOutput("mediaItemSelectListemer loaded");
			if (!mlyrics.pane.mediaItemSelectListener.timer)
				mlyrics.pane.mediaItemSelectListener.timer = setInterval("mlyrics.pane.mediaItemSelectListener.updatePaneInfo()", 50);
			
			mlyrics.pane.mediaItemSelectListener.enableOnSelect(-1);
		},
		
		stop: function () {
			clearInterval(mlyrics.pane.mediaItemSelectListener.timer);
			mlyrics.pane.mediaItemSelectListener.timer = null;
			mlyrics.pane.mediaItemSelectListener.curMediaItem = null;
		},
		
		updatePaneInfo: function (force) {
			if (!mlyrics.pane.prefs.getBoolPref("showNowSelected")) return;

			var mediaListView = window.top.gBrowser.tabContainer.getItemAtIndex(0).mediaListView;
			if (!mediaListView) return;

			this.mediaListView = mediaListView;

			var mediaSelection = mediaListView.selection;

			if (force || mlyrics.pane.mediaItemSelectListener.curMediaItem != mediaSelection.currentMediaItem) {
				mlyrics.pane.mediaItemSelectListener.curMediaItem = mediaSelection.currentMediaItem;

				mlyrics.lib.debugOutput("Selection changed");

				if (document.getElementById("lm-deck").selectedIndex == 0) {
					document.getElementById("lm-deck").selectedIndex = 1;
				}
				if (document.getElementById("lm-deck").selectedIndex == 2) {
					mlyrics.pane.editMode.onViewUpdate();
				}
				if (document.getElementById("lm-deck").selectedIndex == 1) {

					// Remove notifications
					var mTop = document.getElementById("infobar");
					mTop.removeAllNotifications(true);

					document.getElementById("refreshMenuItem").selectedItem = document.getElementById("contxtRefreshTagMenu");
					document.getElementById("contxtTranslateMetaMenu").disabled = false;

					var metadataArtist = mlyrics.pane.mediaItemSelectListener.curMediaItem.getProperty(SBProperties.artistName);
					var metadataAlbum = mlyrics.pane.mediaItemSelectListener.curMediaItem.getProperty(SBProperties.albumName);
					var metadataTrack = mlyrics.pane.mediaItemSelectListener.curMediaItem.getProperty(SBProperties.trackName);
					var metadataLyrics = mlyrics.pane.getFullLyrics(mlyrics.pane.mediaItemSelectListener.curMediaItem);

					mlyrics.pane.buildPage(metadataArtist, metadataAlbum, metadataTrack, metadataLyrics);

					mlyrics.pane.controller.lmDeck.selectedIndex = 1;
				}
			}
		},
		
		enableOnSelect: function (enable) {
			if (enable == -1) {
				if (mlyrics.pane.prefs.getBoolPref("showNowSelected")) {
					document.getElementById("showSelectedBtn").checked = true;
					document.getElementById("showSelectedMenuItem").setAttribute("checked", true);
					document.getElementById("nextPrevBtnsHbox").hidden = false;
				}
				else {
					document.getElementById("showSelectedBtn").checked = false;
					document.getElementById("showSelectedMenuItem").setAttribute("checked", false);
					document.getElementById("nextPrevBtnsHbox").hidden = true;
				}
			}
			else {
				if (enable) {
					mlyrics.pane.prefs.setBoolPref("showNowSelected", true);
					document.getElementById("showSelectedBtn").checked = true;
					document.getElementById("showSelectedMenuItem").setAttribute("checked", true);
					document.getElementById("nextPrevBtnsHbox").hidden = false;
				}
				else {
					mlyrics.pane.prefs.setBoolPref("showNowSelected", false);
					document.getElementById("showSelectedBtn").checked = false;
					document.getElementById("showSelectedMenuItem").setAttribute("checked", false);
					document.getElementById("nextPrevBtnsHbox").hidden = true;
					
					mlyrics.pane.showInfo(mlyrics.pane.playlistPlaybackServiceListener.curMediaItem);
				}
			}
		},
		
		selectNext: function () {
			var mediaListView = window.top.gBrowser.tabContainer.getItemAtIndex(0).mediaListView;
			if (!mediaListView) return;
			
			var mediaSelection = mediaListView.selection;
			mediaSelection.selectOnly( ++ mediaSelection.currentIndex );
		},
		
		selectPrev: function () {
			var mediaListView = window.top.gBrowser.tabContainer.getItemAtIndex(0).mediaListView;
			if (!mediaListView) return;
			
			var mediaSelection = mediaListView.selection;
			mediaSelection.selectOnly( -- mediaSelection.currentIndex );
		}
	},
	
	tabSelectListener: {
		handleEvent: function ()  {
			
			if (!mlyrics.pane.prefs.getBoolPref("hideOnSwitch")) return;
			
			var browser = window.top.gBrowser.selectedTab.linkedBrowser;
			var location = browser.contentDocument.location.toString();
			
			mlyrics.lib.debugOutput("TAB event: " + location);
			
			if (location.substr(0, 9) == "chrome://") {
				
				if (mlyrics.pane.prefs.getBoolPref("showNowSelected") ||
				// Check to see if we're already playing something
				    (mlyrics.pane.gMM.status.state == Components.interfaces.sbIMediacoreStatus.STATUS_PLAYING) ||
				    (mlyrics.pane.gMM.status.state == Components.interfaces.sbIMediacoreStatus.STATUS_PAUSED) ||
				    (mlyrics.pane.gMM.status.state == Components.interfaces.sbIMediacoreStatus.STATUS_BUFFERING))
				{
					if (mlyrics.pane.controller.haveLyr) {
						if (mlyrics.pane.controller.isInstr && !mlyrics.pane.prefs.getBoolPref("instrFound")) {
							mlyrics.pane.controller.showPane(false);
						}
						else {
							mlyrics.pane.controller.showPane(true);
						}
					}
					else {
						if (mlyrics.pane.prefs.getBoolPref("noLyrFound")) {
							mlyrics.pane.controller.showPane(true);
						}
					}
				}
			} else {
				mlyrics.lib.debugOutput("Pane collapsed on tab switch");
				mlyrics.pane.controller.showPane(false);
			}
		}
	},
	
	positionListener: {
		timer: null,
		duration: 0,
		lyricsScrollHeight: 0,
		lyricsMaxHeight: 0,
		lyricsNormalHeight: 0,
		mouseover: false,
		correctionMode: false,
		scrollsBeforeCorrectionMode: 10,
		scrollsCounterResetTimer: null,
		scrollCorrection: 0,
		timeArray: [],
		corrArrayDimen: 20, 
		playPart: 0,
		iframe: null,
		timeTracksCurrentRowIndex: -1,

		constShowDelayMiliSec: 500,

		postSave: {
			corrArray: [],
			corrArray2: [], // this copy should not be modificated
			mediaItem: null
		},
		
		restart: function () {
			
			if (!mlyrics.pane.gMM.playbackControl)
				this.duration = 0;
			else
				this.duration = mlyrics.pane.gMM.playbackControl.duration;

			var scrollHeight = document.getElementById('lm-content').contentWindow.document.body.scrollHeight;
			var offsetHeight = document.getElementById('lm-content').contentWindow.document.body.offsetHeight;
			var clientHeight = document.getElementById('lm-content').contentWindow.document.body.clientHeight;

			mlyrics.lib.debugOutput("scrollHeight: " + scrollHeight);
			mlyrics.lib.debugOutput("offsetHeight: " + offsetHeight);
			mlyrics.lib.debugOutput("clientHeight: " + clientHeight);
			
			this.lyricsScrollHeight = scrollHeight;
			this.lyricsMaxHeight = scrollHeight - clientHeight;
			this.lyricsNormalHeight = clientHeight;
			this.correctionMode = false;
			this.scrollCorrection = 0;
			this.playPart = 0;
			this.timeTracksCurrentRowIndex = -1;

			this.iframe = document.getElementById('lm-content');

			document.getElementById("lm-content").contentDocument.body.style.cursor = "auto";

			clearInterval(this.timer);
			
			// LRC: we need to start show lines beforehand
			if (this.timeArray.length > 1) 
				for (var i=0; i<this.timeArray.length; i++) {
					this.timeArray[i] -= this.constShowDelayMiliSec;
				}

			if (mlyrics.pane.prefs.getBoolPref("showNowSelected")) return;
			
			// Load autocorrections
			// -----------------
			var lyrics = mlyrics.pane.viewMode.savedData.lyrics;

			if (lyrics && lyrics != "" && lyrics.toLowerCase().substr(0, 14) != "[instrumental]") {
				var translDelimPos1 = lyrics.indexOf("\n\n =================== \n [ ");
				if (translDelimPos1 != -1) lyrics = lyrics.substr(0, translDelimPos1);
				this.corrArrayDimen = parseInt(lyrics.match(/\n/g).length/2);


				this.postSave.corrArray = [];
				this.postSave.mediaItem = mlyrics.pane.playlistPlaybackServiceListener.curMediaItem;
				var corrArrayStr = this.postSave.mediaItem.getProperty("http://songbirdnest.com/data/1.0#mlyricsScrollCorrArray");
				if (corrArrayStr) {
					this.postSave.corrArray = corrArrayStr.split(",");
					for (var i=0; i<this.postSave.corrArray.length; i++) {
						this.postSave.corrArray[i] = parseInt(this.postSave.corrArray[i]);
					}
					mlyrics.lib.debugOutput(this.postSave.corrArray);
				}
			}
			else {
				this.postSave.corrArray.length = 0;
				this.postSave.corrArray.length = this.corrArrayDimen;
			}

			this.postSave.corrArray2 = this.postSave.corrArray;
			// -----------------
			
			var browser = window.top.gBrowser.selectedTab.linkedBrowser;
			var location = browser.contentDocument.location.toString();
			if (location.substr(0, 25) != "chrome://shoutcast-radio/") {
				this.timer = setInterval("mlyrics.pane.positionListener.scrollLyrics()", 0);
			}
		},

		saveCorrections: function () {
			if (!this.postSave.mediaItem) return;
			if (!this.postSave.corrArray || !this.postSave.corrArray.length) return;

			var localArray = [];
			for (var i=0; i<this.postSave.corrArray.length; i++) {
				localArray[i] = this.postSave.corrArray[i];
			}
			localArray.push(this.duration);

			mlyrics.lib.debugOutput("localArray: " + localArray.toString());
			
			this.postSave.mediaItem.setProperty("http://songbirdnest.com/data/1.0#mlyricsScrollCorrArray", localArray.toString());
		},
		
		scrollLyrics: function () {
			if (mlyrics.pane.prefs.getBoolPref("showNowSelected")) return;
			
			var position = mlyrics.pane.gMM.playbackControl.position;
			if (position < 0) position = 0;

			if (this.timeArray.length > 1) {
				var maxHeight = this.lyricsScrollHeight;
			}
			else {
				var maxHeight = this.lyricsMaxHeight;
			}

			var nowScrollTo = NaN;

			// Time tracks scrolling
			if (this.timeArray.length > 1) {
				var normalLineTimeLen = this.duration / this.timeArray.length;			// Normal line scroll duration
				
				for (var i=0; i<this.timeArray.length; i++) {
					if (	position >= this.timeArray[i]  && 
						(position < this.timeArray[i+1] || i == this.timeArray.length-1) ) { // Last line mark fix
						
						var currLineTimeLen = this.timeArray[i+1] - this.timeArray[i];	// Real current line scroll duration
						var currLineTimeElapsed = position - this.timeArray[i];		// How much we scrolled already

						var speedIndex = currLineTimeElapsed/currLineTimeLen;		// How much in percents we need to scroll between lines

						var firstItem = this.iframe.contentDocument.getElementById("mlyrics_lyrics_row" + i);
						var firstOffset  = firstItem.offsetTop;
						
						var secondItem = this.iframe.contentDocument.getElementById("mlyrics_lyrics_row" + (i+1));
						if (!secondItem) {
							var secondOffset = firstOffset;
						}
						else {
							var secondOffset = secondItem.offsetTop;
						}

						nowScrollTo = firstOffset + (secondOffset - firstOffset) * speedIndex;

						if (i != this.timeTracksCurrentRowIndex) {
							this.timeTracksCurrentRowIndex = i;

							var overrideStyle = mlyrics.pane.getStyleProperty("lrcLyrics");
							if (!overrideStyle) {
								var currentClasses = firstItem.getAttribute("class");
								if (!currentClasses || currentClasses.indexOf("mlyrics_lyrics_timetracked") == -1) {
									firstItem.setAttribute("style", "");
									firstItem.setAttribute("class", currentClasses + " mlyrics_lyrics_timetracked");
								}
							}
							else {
								var currentStyles = firstItem.getAttribute("style");
								if (!!currentStyles)
									firstItem.setAttribute("style", currentStyles + ";" + overrideStyle);
								else
									firstItem.setAttribute("style", overrideStyle);
							}
						}

						break;
					}
				}
			}

			// Correction scrolling
			else if (this.postSave.corrArray.length > 1) {
				for (var i=0; i<this.postSave.corrArray.length-1; i++) {
					if (	position >= this.postSave.corrArray[i]  && 
						position < this.postSave.corrArray[i+1] ) {

						var currLineTimeLen = this.postSave.corrArray[i+1] - this.postSave.corrArray[i];
						var currLineTimeElapsed = position - this.postSave.corrArray[i];

						var speedIndex = currLineTimeElapsed/currLineTimeLen;

						var linePairsNumber = i; // Indicates line pairs nimber (not line number)

						var firstItem = this.iframe.contentDocument.getElementById("mlyrics_lyrics_row" + linePairsNumber*2);
						var firstOffset  = firstItem.offsetTop;

						var secondItem = this.iframe.contentDocument.getElementById("mlyrics_lyrics_row" + (linePairsNumber+1)*2);
						if (!secondItem) {
							var secondOffset = firstOffset;
						}
						else {
							var secondOffset = secondItem.offsetTop;
						}

						nowScrollTo = firstOffset + (secondOffset - firstOffset) * speedIndex;

						break;
					}
				}
			}

			// Normal scrolling
			else {
				var playPart = position / this.duration;
				this.playPart = playPart;
				nowScrollTo = this.playPart * maxHeight;
			}

			if (isNaN(nowScrollTo)) return;
			
			var scrollTop = document.getElementById('lm-content').contentWindow.document.body.scrollTop;
			var intPart = parseInt(scrollTop/maxHeight * this.corrArrayDimen);

			if (this.mouseover) {
				this.scrollCorrection = scrollTop - nowScrollTo;
			}
			else {
				if (mlyrics.pane.prefs.getBoolPref("scrollEnable")) {
					var accelerator = document.getElementById("accelerateScale");
					this.scrollCorrection += accelerator.value/100;

					var newScrollPos = nowScrollTo + this.scrollCorrection;

					if (accelerator.value < 0) {
						this.scrollCorrection = scrollTop - nowScrollTo;
						return;
					}
					
					document.getElementById('lm-content').contentWindow.scrollTo(0, newScrollPos);
				}
			}

			if ( this.correctionMode && !this.postSave.corrArray[intPart] ) {
				this.postSave.corrArray[intPart] = position;
			}
		},
		
		enableScroll: function (enable) {
			if (enable == -1) {
				if (mlyrics.pane.prefs.getBoolPref("scrollEnable")) {
					document.getElementById("scrollEnabledBtn").checked = true;
					document.getElementById("scrollEnabledMenuItem").setAttribute("checked", "true");
					document.getElementById("accelerateScale").disabled = false;
				}
				else {
					document.getElementById("scrollEnabledBtn").checked = false;
					document.getElementById("scrollEnabledMenuItem").setAttribute("checked", "false");
					document.getElementById("accelerateScale").disabled = true;
				}
			}
			else {
				if (enable) {
					mlyrics.pane.prefs.setBoolPref("scrollEnable", true);
					document.getElementById("scrollEnabledBtn").checked = true;
					document.getElementById("scrollEnabledMenuItem").setAttribute("checked", "true");
					document.getElementById("accelerateScale").disabled = false;
				}
				else {
					mlyrics.pane.prefs.setBoolPref("scrollEnable", false);
					document.getElementById("scrollEnabledBtn").checked = false;
					document.getElementById("scrollEnabledMenuItem").setAttribute("checked", "false");
					document.getElementById("accelerateScale").disabled = true;
				}
			}
		},

		onMouseScroll: function (event) {
			var slowDownScroll = 1;
			if (this.correctionMode) 
				var slowDownScroll = 1/3;
			document.getElementById('lm-content').contentWindow.document.body.scrollTop += event.detail * slowDownScroll * 10;
			mlyrics.pane.positionListener.onMouseScrollReal(event);
		},

		onMouseScrollReal: function (event, force) {
			if (mlyrics.pane.fullScreenMode.fullScreen) {
				document.getElementById("createSmartScrollMenuItem").disabled = true;
				return;
			}
			
			if (this.timeArray.length > 1) return; // Have lrc array

			if (typeof(force) == 'undefined') force = false;

			var metadataLyrics = mlyrics.pane.getFullLyrics(this.postSave.mediaItem);
			if (!metadataLyrics || metadataLyrics == "") return;	// In case we don't have stored lyrics - do not event try to init

			var scrollTop = document.getElementById('lm-content').contentWindow.document.body.scrollTop;

			var intPart = parseInt(scrollTop/this.lyricsMaxHeight * this.corrArrayDimen); // Indicates line pairs nimber (not line number)
			for (var i=this.corrArrayDimen; i>=0; i--) {
				var firstElement = this.iframe.contentDocument.getElementById("mlyrics_lyrics_row" + i*2);
				if (firstElement && firstElement.offsetTop < scrollTop) {
					intPart = i;
					break;
				}
			}

			var position = mlyrics.pane.gMM.playbackControl.position;
			if (position < 0) position = 0;

			// Activate correction mode and clear corrArray
			if (force || (!scrollTop && event.detail < 0)) {
				if (!force && this.scrollsBeforeCorrectionMode > 0) {		// Delay of entering smart scroll mode after mouse wheel up scroll
					if (!this.scrollsCounterResetTimer) {
						mlyrics.pane.positionListener.scrollsBeforeCorrectionMode = 10;
						this.scrollsCounterResetTimer = setTimeout(function() {
							mlyrics.pane.positionListener.scrollsCounterResetTimer = null;}, 2000);
					}
						
					this.scrollsBeforeCorrectionMode--;
					return;
				}
				else {								// Init smart scroll mode
					this.correctionMode = true;
					mlyrics.pane.removeSmartScrollInfo();
					document.getElementById("lm-content").contentDocument.body.style.cursor = "url(chrome://mlyrics/content/images/sing-ico.png), move";
					this.iframe.contentDocument.getElementById("bottomspace").height = this.lyricsNormalHeight;
					
					this.postSave.corrArray.length = 0;
					this.postSave.corrArray.length = this.corrArrayDimen;

					clearInterval(this.timer);
					document.getElementById('lm-content').contentWindow.scrollTo(0, 0);
				}
			}

			if (!this.correctionMode) return;	// Proceed only if we are int correction (smart scroll teach) mode

			if (!this.postSave.corrArray[intPart]) this.postSave.corrArray[intPart] = position;
			for (var i=intPart+1; i<this.postSave.corrArray.length; i++) {
				this.postSave.corrArray[i] = this.postSave.corrArray2[i] + parseInt(this.scrollCorrection);
			}

			this.scrollCorrection = 0;

			var bottomspaceOffset = this.iframe.contentDocument.getElementById("bottomspace").offsetTop;
			
			if (scrollTop >= bottomspaceOffset) {	// Scroll finish - save and exit correction mode
				this.correctionMode = false;
				this.saveCorrections();
				document.getElementById("lm-content").contentDocument.body.style.cursor = "auto";
			}
		}
	},
	
	nextItemBufferedInfo: {
		item: null,
		lyrics: "",
		source: "",
		
		fetchNextLyrics: function () {
			var mediaItem = mlyrics.pane.gMM.sequencer.nextItem;
			
			if (!mediaItem) {
				mlyrics.pane.nextItemBufferedInfo.item = null;
				return;
			}
			
			// Do not refetch already fetched
			if (this.item == mediaItem) return;
			
			var metadataArtist = mediaItem.getProperty(SBProperties.artistName);
			var metadataAlbum = mediaItem.getProperty(SBProperties.albumName);
			var metadataTrack = mediaItem.getProperty(SBProperties.trackName);
			var metadataLyrics = mlyrics.pane.getFullLyrics(mediaItem);
			
			if (!metadataArtist) metadataArtist = "";
			if (!metadataAlbum) metadataAlbum = "";
			if (!metadataTrack) metadataTrack = "";
			if (!metadataLyrics) metadataLyrics = "";
			
			if (metadataLyrics == "") {
				mlyrics.fetch.fetchNext(
					
					metadataArtist, 
					metadataAlbum, 
					metadataTrack,
					
					function (localLyrics, localSource, localIndex) {
						mlyrics.pane.nextItemBufferedInfo.item   = mediaItem;
						mlyrics.pane.nextItemBufferedInfo.lyrics = localLyrics;
						mlyrics.pane.nextItemBufferedInfo.source = localSource;
					},
					

					0,
					false,
					
					function (lsource, lprogress, localIndex) {
					},
					0
				);
			}
			else {
				if (metadataLyrics.indexOf("\n [ Google translated ] ") == -1) {
					mlyrics.pane.translateMetadataLyrics(metadataLyrics,
										function (translated) {
											
											if (translated == "") {
												mlyrics.pane.nextItemBufferedInfo.item   = null;
											}
											else {
												var delimiter = "\n\n =================== \n [ Google translated ] \n =================== \n\n";
												var fullLyrics = metadataLyrics + delimiter + translated;
												
												mlyrics.pane.nextItemBufferedInfo.item   = mediaItem;
												mlyrics.pane.nextItemBufferedInfo.lyrics = fullLyrics;
												mlyrics.pane.nextItemBufferedInfo.source = "";
											}
										}
									     );
				}
				else {
					this.item = null;
				}
			}
		}
	},

	fullScreenMode: {
		savedWidth: 250,
		fullScreen: false,

		switch: function () {
			if (!this.fullScreen) {
				document.getElementById("fullScreenMenuItem").setAttribute("checked", "true");
				this.enterFullScreen();
			}
			else {
				document.getElementById("fullScreenMenuItem").setAttribute("checked", "false");
				this.leaveFullScreen();
			}
		},

		enterFullScreen: function () {
			this.fullScreen = true;
			
			var mainwindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor).getInterface(Components.interfaces.nsIWebNavigation)
					.QueryInterface(Components.interfaces.nsIDocShellTreeItem).rootTreeItem
					.QueryInterface(Components.interfaces.nsIInterfaceRequestor).getInterface(Components.interfaces.nsIDOMWindow);
			
			this.savedWidth = mlyrics.pane.displayPane.width;
			mlyrics.pane.displayPane.width = screen.width;

			mainwindow.document.getElementById("content_wrapper").hidden 			= true;
			mainwindow.document.getElementById("displaypane_right_sidebar_splitter").hidden = true;
			mainwindow.document.getElementById("servicepane_box").hidden 			= true;
			mainwindow.document.getElementById("servicepane_splitter").hidden 		= true;
			mainwindow.document.getElementById("status-bar-box").hidden 			= true;
			mainwindow.document.getElementById("titlebar_box").hidden 			= true;
			mainwindow.document.getElementById("player_wrapper").hidden 			= true;
			
			//document.getElementById("mlyrics-btnsbox-splitter").hidden 			= true;

			document.getElementById("webSrchMenuItem").disabled 				= true;
			document.getElementById("removeTimeTracksMenuItem").disabled 			= true;
			document.getElementById("timeTracksMenuItem").disabled 				= true;
			document.getElementById("createSmartScrollMenuItem").disabled 			= true;

			window.fullScreen = true;

			mlyrics.pane.viewMode.change(mlyrics.pane.prefs.getIntPref("lyricsViewMode"));
		},

		leaveFullScreen: function () {
			this.fullScreen = false;
			
			var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
			var mainwindow = wm.getMostRecentWindow("Songbird:Main");

			mlyrics.pane.savedWidth = this.savedWidth;
			mlyrics.pane.displayPane.width = this.savedWidth;

			mainwindow.document.getElementById("content_wrapper").hidden 			= false;
			mainwindow.document.getElementById("displaypane_right_sidebar_splitter").hidden = false;
			mainwindow.document.getElementById("servicepane_box").hidden 			= false;
			mainwindow.document.getElementById("servicepane_splitter").hidden 		= false;
			mainwindow.document.getElementById("status-bar-box").hidden 			= false;
			mainwindow.document.getElementById("titlebar_box").hidden 			= false;
			mainwindow.document.getElementById("player_wrapper").hidden 			= false;
			
			//document.getElementById("mlyrics-btnsbox-splitter").hidden 			= false;

			document.getElementById("webSrchMenuItem").disabled 				= false;
			document.getElementById("removeTimeTracksMenuItem").disabled 			= false;
			document.getElementById("timeTracksMenuItem").disabled 				= false;
			document.getElementById("createSmartScrollMenuItem").disabled 			= false;

			window.fullScreen = false;

			mlyrics.pane.viewMode.change(mlyrics.pane.prefs.getIntPref("lyricsViewMode"));
		}
	}
}
