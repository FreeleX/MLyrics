if (typeof(Cc) == "undefined") var Cc = Components.classes;
if (typeof(Ci) == "undefined") var Ci = Components.interfaces;
if (typeof(Cu) == "undefined") var Cu = Components.utils;

Components.utils.import("resource://app/jsmodules/ArrayConverter.jsm");
Components.utils.import("resource://app/jsmodules/sbProperties.jsm");

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
	gBrowser: 		null,
	songbirdWindow:		null,
	prefs: 			null,
	defprefs: 		null,
	
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
		lostLRCNotif: ""
	},
	
	enableNotifications: function (enable) {
		
		if (enable) {
			this.prefs.setBoolPref("showNotifs", true);
			document.getElementById("notifEnabledMenuItem").setAttribute("checked", "true");
			document.getElementById("notifDisabledMenuItem").setAttribute("checked", "false");
		}
		else {
			this.prefs.setBoolPref("showNotifs", false);
			document.getElementById("notifEnabledMenuItem").setAttribute("checked", "false");
			document.getElementById("notifDisabledMenuItem").setAttribute("checked", "true");
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
		
		var displayPaneManager = Components.classes["@songbirdnest.com/Songbird/DisplayPane/Manager;1"].getService(Components.interfaces.sbIDisplayPaneManager);
		var dpInstantiator = displayPaneManager.getInstantiatorForWindow(window);
		if (dpInstantiator) {
			this.ourDisplayPane = dpInstantiator.displayPane;
		}
		
		ML_debugOutput("Pane intitialization finished");
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
			
			switch (aData) {
				case "styleSheet":
					this.updateStyle();
					break;
					
				case "applyCustomFont":
				case "showStaticPicIf":
				case "BGImagePos":
					
				case "backgroundType":
				case "backgroundImage":
				case "backgroundColor":
				
				case "lyricsSize":
				case "transLyricsSize":
				case "artistSize":
				case "albumSize":
				case "titleSize":
				
				case "lyricsColor":
				case "transLyricsColor":
				case "artistColor":
				case "albumColor":
				case "titleColor":

				case "lyricsBGColorEnable":
				case "transLyricsBGColorEnable":
				case "artistBGColorEnable":
				case "albumBGColorEnable":
				case "titleBGColorEnable":
					
				case "lyricsBGColor":
				case "transLyricsBGColor":
				case "artistBGColor":
				case "albumBGColor":
				case "titleBGColor":
					
				case "lyricsAlign":
				case "transLyricsAlign":
				case "artistAlign":
				case "albumAlign":
				case "titleAlign":
					
				case "lyricsOpacity":
				case "transLyricsOpacity":
				case "artistOpacity":
				case "albumOpacity":
				case "titleOpacity":
					
				case "lyricsBold":
				case "transLyricsBold":
				case "artistBold":
				case "albumBold":
				case "titleBold":
					
				case "lyricsItalic":
				case "transLyricsItalic":
				case "artistItalic":
				case "albumItalic":
				case "titleItalic":
					
				case "lyricsUnderlined":
				case "transLyricsUnderlined":
				case "artistUnderlined":
				case "albumUnderlined":
				case "titleUnderlined":
					
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
			var prefStyleFile = mlyrics.pane.prefs.getCharPref("styleSheet");
			
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
		var elemSize = mlyrics.pane.prefs.getIntPref(prefPartStr + "Size");
		var elemColor = mlyrics.pane.prefs.getCharPref(prefPartStr + "Color");
		var elemBGColorEnable = mlyrics.pane.prefs.getBoolPref(prefPartStr + "BGColorEnable");
		var elemBGColor = mlyrics.pane.prefs.getCharPref(prefPartStr + "BGColor");
		var elemBold = mlyrics.pane.prefs.getBoolPref(prefPartStr + "Bold");
		var elemItalic = mlyrics.pane.prefs.getBoolPref(prefPartStr + "Italic");
		var elemUnderlined = mlyrics.pane.prefs.getBoolPref(prefPartStr + "Underlined");
		var elemAlign = mlyrics.pane.prefs.getCharPref(prefPartStr + "Align");
		var elemOpacity = mlyrics.pane.prefs.getIntPref(prefPartStr + "Opacity");
		
		var styleStr = "";
		
		styleStr += "font-size:" + elemSize + ";";
		styleStr += "color:" + elemColor + ";";
		
		if (elemBGColorEnable) {
			styleStr += "background-color:" + elemBGColor + ";";
			styleStr += "opacity:" + (elemOpacity*0.1) + ";";
		}
		
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
		
		if (elemAlign == "C")
			styleStr += "text-align: center";
		else if (elemAlign == "R")
			styleStr += "text-align: right";
		else
			styleStr += "text-align: left";
		
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
			
			var haslyrType = ML_fixHasLyr(aMediaItem);

			// Lost tag lyrics
			if (haslyrType == 1) {
				mlyrics.pane.addSpecWarning(mlyrics.pane.pStrings.foundLostLyricsNotif, mlyrics.scanlib.scan);
			}
			
			// Lost LRC
			if (wasLRC != isLRC) {
				if (wasLRC == "true") {
					mlyrics.pane.addSpecWarning(mlyrics.pane.pStrings.lostLRCNotif, mlyrics.scanlib.scan);
				}
				// Because wasLRC can be undefined and isLRC can be false, false != undefined
				else if (isLRC == "true") {
					mlyrics.pane.addSpecWarning(mlyrics.pane.pStrings.foundLRCNotif, mlyrics.scanlib.scan);
				}
			}

			if (isLRC) {
				var result = mlyrics.lrc.readLRC(aMediaItem);
				mlyrics.pane.positionListener.timeArray = result.timeArray;
			}
			else {
				mlyrics.pane.positionListener.timeArray = [];
			}

			mlyrics.pane.showInfo(aMediaItem);

			if (document.getElementById("lm-deck").selectedIndex == 3) {
				setTimeout("mlyrics.pane.editTimeTracks.restart()", 1000);
			}
		},
		
		onStop: function() {
			if (!mlyrics.pane.prefs.getBoolPref("showNowSelected")) {
				mlyrics.pane.controller.lmDeck.selectedIndex = 0;
				ML_debugOutput("Pane collapsed on song stop");
				
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
	
	writeID3Tag: function (mediaItem) {
		
		var mediaItemArray = Components.classes["@songbirdnest.com/moz/xpcom/threadsafe-array;1"].createInstance(Components.interfaces.nsIMutableArray);
		mediaItemArray.appendElement(mediaItem, false);
		
		if (mediaItemArray.length > 0) {
			// Remove read only attribute
			if (mlyrics.pane.xulRuntime.OS == "WINNT") {
				var filePath = decodeURIComponent(mediaItem.contentSrc.path).substr(1).replace(/\//g, "\\");
			}
			else {
				var filePath = decodeURIComponent(mediaItem.contentSrc.path);
			}
			
			mlyrics.pane.localFile.initWithPath(filePath);
			var oldPermissions = mlyrics.pane.localFile.permissions;
			mlyrics.pane.localFile.permissions = 0666;
			
			// This will write out the properties in propArray for each item.
			var propArray = ArrayConverter.stringEnumerator([SBProperties.lyrics]);
			var metadataWriteProgress = this.metadataService.write(mediaItemArray, propArray);
			
			var metadataWriteCheck = setInterval(function (){
				if (metadataWriteProgress.status != 32){
					clearInterval(metadataWriteCheck);
					if (!metadataWriteProgress.status) {
						if (!mlyrics.pane.prefs.getBoolPref("saveInDB")) {
							mediaItem.setProperty("http://songbirdnest.com/data/1.0#lyrics", null);
							mediaItem.setProperty("http://songbirdnest.com/data/1.0#lyricistName", null);
							mlyrics.pane.metadataService.write(mediaItemArray, propArray);
						}
						else {
							mediaItem.setProperty("http://songbirdnest.com/data/1.0#hasLyrics", "chrome://mlyrics/content/images/haslyrics-tagblack.png");
						}
						
						var errorsEnum = metadataWriteProgress.getErrorMessages();
						while (errorsEnum.hasMore())
							throw new Error("SongBird has failed to write lyrics into '" + errorsEnum.getNext() + "'");
					}
					
					// Restore permissions
					mlyrics.pane.localFile.permissions = oldPermissions;
				}
			}, 500);
		}
	},
	
	saveLyrics: function (notificationElement, notifcationButton, mediaItem, lyrics, source) {
		
		var metadataComment = mediaItem.getProperty("http://songbirdnest.com/data/1.0#lyricistName");
		if (!metadataComment) metadataComment = "";
		
		if (source && source != "" && lyrics.toLowerCase().substr(0, 14) != "[instrumental]") {
			mediaItem.setProperty("http://songbirdnest.com/data/1.0#lyricistName", "Songbird MLyrics [" + source + "]\n");
		}
		else {
			mediaItem.setProperty("http://songbirdnest.com/data/1.0#lyricistName", null);
		}
		
		mediaItem.setProperty("http://songbirdnest.com/data/1.0#lyrics", lyrics);
		this.writeID3Tag(mediaItem);
			
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
						var goUri = "http://www.google.com/search?btnI=i&q=lyrics%20" + encodeURIComponent(artist) + "%20" + encodeURIComponent(track);
						mlyrics.pane.openAndReuseOneTabPerAttribute("mlyrics-luckysearch", goUri);
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
		
		// No need to write same code twice
		var localLyrics = mlyrics.fetch.fetchNext(
			
			artist, 
			album, 
			track,
			
			function (localLyrics, localSource, localIndex) {
				document.getElementById("ML_sourceAddressNextButton").hidden = false;
				document.getElementById("refreshMenuItem").disabled = false;
				
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
				
				document.getElementById("metadataMenuItem").disabled = true;
				document.getElementById("timeTracksMenuItem").disabled = true;
				document.getElementById("makeInstrMenuItem").disabled = true;
				document.getElementById("clearMenuItem").disabled = true;
			}
		);
	},
	
	stopFetch: function () {
		ML_debugOutput("Abort action, emulating track change");
		mlyrics.fetch.fetchMediaItem = 0;
		
		document.getElementById("ML_sourceAddressNextButton").hidden = false;
		document.getElementById("refreshMenuItem").disabled = false;
		document.getElementById("ML_sourceFetchProgress").hidden = true;
		document.getElementById("ML_sourceFetchStopButton").hidden = true;
		
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

		if (mlyrics.pane.viewMode.savedData.lyrics == "" || mlyrics.pane.viewMode.savedData.lyrics.substr(0, 14).toLowerCase() == "[instrumental]")
			document.getElementById("timeTracksMenuItem").disabled = true;
		
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
			ML_debugOutput("Pane collapsed on build page: " + this.controller.haveLyr + ", " + noLyrFoundPref + ", " + tabActive);
			this.controller.showPane(false);
		}
		
		// Disable menu for shoutcast radio
		var browser = window.top.gBrowser.selectedTab.linkedBrowser;
		var location = browser.contentDocument.location.toString();
		if (location.substr(0, 25) == "chrome://shoutcast-radio/") {
			document.getElementById("metadataMenuItem").disabled 		= true;
			document.getElementById("timeTracksMenuItem").disabled 		= true;
			document.getElementById("makeInstrMenuItem").disabled 		= true;
			document.getElementById("clearMenuItem").disabled 		= true;
			document.getElementById("contxtRefreshTagMenu").disabled 	= true;
			document.getElementById("contxtTranslateMetaMenu").disabled 	= true;
		}
		else {
			document.getElementById("metadataMenuItem").disabled 		= false;
			if (mlyrics.pane.viewMode.savedData.lyrics != "" && mlyrics.pane.viewMode.savedData.lyrics.substr(0, 14).toLowerCase() != "[instrumental]") 
				document.getElementById("timeTracksMenuItem").disabled = false;
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
		
		var iframe = document.getElementById('lm-content');
		
		if (mlyrics.pane.prefs.getBoolPref("applyCustomFont")) {
			titleStyleProps = mlyrics.pane.getStyleProperty("title");
			artistStyleProps = mlyrics.pane.getStyleProperty("artist");
			albumStyleProps = mlyrics.pane.getStyleProperty("album");
			
			if (mlyrics.pane.prefs.getCharPref("backgroundType") == "C") {
				iframe.contentDocument.body.style.background = mlyrics.pane.prefs.getCharPref('backgroundColor')
			}
			else if (mlyrics.pane.prefs.getCharPref("backgroundType") == "I") {
				iframe.contentDocument.body.style.background = 'url("file:///' + 
					decodeURIComponent(mlyrics.pane.prefs.getCharPref('backgroundImage')).replace(/\\/g, "/") + 
					'") ' + 
					mlyrics.pane.prefs.getCharPref('BGImagePos') + 
					' fixed';
			}
			else {
				var imageURL = mlyrics.pane.gMM.sequencer.currentItem.getProperty("http://songbirdnest.com/data/1.0#primaryImageURL");
				if (!imageURL && mlyrics.pane.prefs.getBoolPref("showStaticPicIf")) {
					iframe.contentDocument.body.style.background = 'url("file:///' + 
						decodeURIComponent(mlyrics.pane.prefs.getCharPref('backgroundImage')).replace(/\\/g, "/") + 
						'") ' + 
						mlyrics.pane.prefs.getCharPref('BGImagePos') + 
						' fixed';
				}
				else {
					iframe.contentDocument.body.style.background = 'url("' + imageURL + '") center center fixed';
				}
			}
		}
		else {
			iframe.contentDocument.body.style.background = "";
		}
		
		//alert(iframe.contentDocument.body.style.background);
		
		//  The following HTML and its CSS companion files are written by Gege from the MediaMonkey forums,  His addon for MediaMonkey (http://www.mediamonkey.com/forum/viewtopic.php?t=22624) is the inspiration for Lyricmaster.  Thanks Gege!!!
		content_lyric_html = content_lyric_html + "  <table id='ml-table' border=0 width=100% cellspacing=0 cellpadding=0>";
		/*if (dispTrackPref){
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
		}*/
		
		/*if (dispArtistPref){
			content_lyric_html = content_lyric_html + "      <tr>";
			content_lyric_html = content_lyric_html + "       <td valign=top>";
			content_lyric_html = content_lyric_html + "        <h2 id='mlyrics_artist' style='" + artistStyleProps + "'>" + artist + "</h2>";
			content_lyric_html = content_lyric_html + "       </td>";
			content_lyric_html = content_lyric_html + "      </tr>";
		}*/
		
		/*if (dispAlbumPref){  
			content_lyric_html = content_lyric_html + "      <tr>";
			content_lyric_html = content_lyric_html + "       <td valign=top>";
			content_lyric_html = content_lyric_html + "        <h3 id='mlyrics_album' style='" + albumStyleProps + "'>" + album + "</h3>";
			content_lyric_html = content_lyric_html + "       </td>";
			content_lyric_html = content_lyric_html + "      </tr>";
		}*/
		
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
			content_lyric_html = content_lyric_html + "        <p class=\"separator2\"> &nbsp; </p>";
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
		
		var metadataLyrics = mediaItem.getProperty("http://songbirdnest.com/data/1.0#lyrics");
		if (metadataLyrics != "" && 
		    mediaItem.getProperty("http://songbirdnest.com/data/1.0#hasLyrics") &&
		    mediaItem.getProperty("http://songbirdnest.com/data/1.0#hasLyrics").indexOf("-black") != -1 
		   )
		{
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
			//document.getElementById("metadataMenuItem").disabled = true;
			//document.getElementById("refreshMenuItem").disabled = true;
			//document.getElementById("clearMenuItem").disabled = true;
		}
		else if (this.gMM.status.state == Components.interfaces.sbIMediacoreStatus.STATUS_PLAYING) {
			//document.getElementById("metadataMenuItem").disabled = false;
			//document.getElementById("refreshMenuItem").disabled = false;
			//document.getElementById("clearMenuItem").disabled = false;
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
				this.mediaItemSelectListener.updatePaneInfo(true);
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
			if (mlyrics.pane.prefs.getBoolPref("showNowSelected")) {
				var mediaItem = this.mediaItemSelectListener.curMediaItem;
			}
			else {
				var mediaItem = this.playlistPlaybackServiceListener.curMediaItem;
			}
			
			mediaItem.setProperty("http://songbirdnest.com/data/1.0#lyrics", null);
			
			var artist = mediaItem.getProperty(SBProperties.artistName);
			var album = mediaItem.getProperty(SBProperties.albumName);
			var track = mediaItem.getProperty(SBProperties.trackName);
			
			mediaItem.setProperty("http://songbirdnest.com/data/1.0#lyricistName", null);
			
			this.writeID3Tag(mediaItem);
			this.buildPage(artist, album, track, "");
			
			// Remove notifications
			var mTop = document.getElementById("infobar");
			mTop.removeAllNotifications(true);
		}
	},
	
	contextMakeInstrumental:function () {
		if ((this.gMM.status.state == Components.interfaces.sbIMediacoreStatus.STATUS_PLAYING) ||
		    (this.gMM.status.state == Components.interfaces.sbIMediacoreStatus.STATUS_PAUSED) ||
		    (this.gMM.status.state == Components.interfaces.sbIMediacoreStatus.STATUS_BUFFERING))
		{
			if (mlyrics.pane.prefs.getBoolPref("showNowSelected")) {
				var mediaItem = this.mediaItemSelectListener.curMediaItem;
			}
			else {
				var mediaItem = this.playlistPlaybackServiceListener.curMediaItem;
			}
			

			mediaItem.setProperty("http://songbirdnest.com/data/1.0#lyrics", "[Instrumental]");
			mediaItem.setProperty("http://songbirdnest.com/data/1.0#lyricistName", null);
			
			var artist = mediaItem.getProperty(SBProperties.artistName);
			var album = mediaItem.getProperty(SBProperties.albumName);
			var track = mediaItem.getProperty(SBProperties.trackName);
			
			this.writeID3Tag(mediaItem);
			this.buildPage(artist, album, track, "[Instrumental]");
			
			// Remove notifications
			var mTop = document.getElementById("infobar");
			mTop.removeAllNotifications(true);
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
			
			var lyricsStyleProps = "";
			var transLyricsStyleProps = "";
			
			if (mlyrics.pane.prefs.getBoolPref("applyCustomFont")) {
				lyricsStyleProps = mlyrics.pane.getStyleProperty("lyrics");
			}
			
			if (mlyrics.pane.prefs.getBoolPref("applyCustomFont")) {
				transLyricsStyleProps = mlyrics.pane.getStyleProperty("transLyrics");
			}
			else {
				transLyricsStyleProps = "text-decoration: underline;";
			}
			
			if (typeof(mode) == 'undefined') {
				var mode = mlyrics.pane.prefs.getIntPref("lyricsViewMode");
			}
			
			switch (mode) {
				
				case 0:
					var lyricsOrigArray = lyrics.substring(0, translDelimPos1).split("\n");
					var lyricsStyleProps = "";
					if (mlyrics.pane.prefs.getBoolPref("applyCustomFont")) {
						lyricsStyleProps = mlyrics.pane.getStyleProperty("lyrics");
					}
					
					lyrics = "";
					for (var i=0; i<lyricsOrigArray.length; i++) {
						if (lyricsOrigArray[i] == "") lyrics += "<br>";
						var transLyricsStyleProps = "";
						lyrics += "<p class='mlyrics_lyrics' style='" + lyricsStyleProps + "'>" + lyricsOrigArray[i] + "</p>";
					}
					break;
					
				case 1:
					var translDelimPos2 = lyrics.indexOf(" ] \n =================== \n", translDelimPos1);
					if (translDelimPos2 != -1) {
						
						var lyricsTransArray = lyrics.substr(translDelimPos2+27).split("\n");
						var transLyricsStyleProps = "";
						if (mlyrics.pane.prefs.getBoolPref("applyCustomFont")) {
							transLyricsStyleProps = mlyrics.pane.getStyleProperty("transLyrics");
						}
						else {
							transLyricsStyleProps = "text-decoration: underline";
						}
						
						lyrics = "";
						for (var i=0; i<lyricsTransArray.length; i++) {
							if (lyricsTransArray[i] == "") lyrics += "<br>";
							lyrics += "<p class='mlyrics_lyrics' style='" + transLyricsStyleProps + "'>" + lyricsTransArray[i] + "</p>";
						}
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
			
			var lyricsStyleProps = "";
			var transLyricsStyleProps = "";
			
			if (mlyrics.pane.prefs.getBoolPref("applyCustomFont")) {
				lyricsStyleProps = mlyrics.pane.getStyleProperty("lyrics");
			}
			
			if (mlyrics.pane.prefs.getBoolPref("applyCustomFont")) {
				transLyricsStyleProps = mlyrics.pane.getStyleProperty("transLyrics");
			}
			else {
				transLyricsStyleProps = "text-decoration: underline";
			}
			
			if (lyricsOrigArray.length == lyricsTransArray.length) {
				lyrics = "";
				for (var i=0; i<lyricsOrigArray.length; i++) {
					if (lyricsOrigArray[i] == "") lyrics += "<br>";
					lyrics += "<p class='mlyrics_lyrics' style='" + lyricsStyleProps + "'>" + lyricsOrigArray[i] + "</p>";
					lyrics += "<p class='mlyrics_lyrics' style='" + transLyricsStyleProps + "'>" + lyricsTransArray[i] + "</p><br>";
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
			
			var lyricsStyleProps = "";
			var transLyricsStyleProps = "";
			
			if (mlyrics.pane.prefs.getBoolPref("applyCustomFont")) {
				lyricsStyleProps = mlyrics.pane.getStyleProperty("lyrics");
			}
			
			if (mlyrics.pane.prefs.getBoolPref("applyCustomFont")) {
				transLyricsStyleProps = mlyrics.pane.getStyleProperty("transLyrics");
			}
			else {
				transLyricsStyleProps = "text-decoration: underline";
			}
			
			if (lyricsOrigArray.length == lyricsTransArray.length) {
				lyrics = "";
				var originalLyrics = "";
				var translatedLyrics = "";
				for (var i=0; i<lyricsOrigArray.length; i++) {
						if (lyricsOrigArray[i].replace(/^\s+|\s+$/g, '') == '') { //That's a trim
								lyrics = lyrics + "<p class='mlyrics_lyrics' style='" + lyricsStyleProps + "'>" + originalLyrics + "</p><br><p class='mlyrics_lyrics' style='" + transLyricsStyleProps + "'>" + translatedLyrics + "</p><br><br><br>";
								originalLyrics = "";
								translatedLyrics = "";
						} else {
								originalLyrics += (originalLyrics == "" ? "" : "<br>") + lyricsOrigArray[i];
								translatedLyrics += (translatedLyrics == "" ? "" : "<br>") + lyricsTransArray[i];
						}
				}
				if (originalLyrics != "") {
					lyrics = lyrics + "<p class='mlyrics_lyrics' style='" + lyricsStyleProps + "'>" + originalLyrics + "</p><br><p class='mlyrics_lyrics' style='" + transLyricsStyleProps + "'>" + translatedLyrics + "</p><br><br>";
				}
			}                       
			return lyrics;                  
		}
	},
	
	editMode: {
		editMediaItem: 0,
		lyricsSource: "",
		
		onAccept: function () {
			if (mlyrics.pane.editMode.editMediaItem) {
				var editedLyrics = document.getElementById("edit-content").value;
				mlyrics.pane.saveLyrics("", "", mlyrics.pane.editMode.editMediaItem, editedLyrics, mlyrics.pane.editMode.lyricsSource);
			}
			
			mlyrics.pane.contextRefresh();
			
			document.getElementById("lm-deck").selectedIndex = 1;
		},
		
		onDiscard: function () {
			mlyrics.pane.editMode.editMediaItem = 0;
			document.getElementById("lm-deck").selectedIndex = 1;
		},
		
		init: function () {
			if (mlyrics.pane.prefs.getBoolPref("showNowSelected")) {
				mlyrics.pane.editMode.editMediaItem = mlyrics.pane.mediaItemSelectListener.curMediaItem;
			}
			else {
				mlyrics.pane.editMode.editMediaItem = mlyrics.pane.playlistPlaybackServiceListener.curMediaItem;
			}
			
			mlyrics.pane.editMode.lyricsSource = mlyrics.pane.viewMode.savedData.source;
			
			// Fill edit lyrics box
			document.getElementById("edit-content").value = mlyrics.pane.viewMode.savedData.lyrics;
			
			document.getElementById("lm-deck").selectedIndex = 2;
		}
	},

	editTimeTracks: {
		trackMediaItem: 0,
		selectedItemStyle: "background-color: grey;",
		oldItemStyle: "text-decoration:line-through; font-style: italic;",
		currentIndex: 0,

		init: function () {
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
				var tempLyrics = mlyrics.pane.viewMode.savedData.lyrics;
			}
			else {
				var tempLyrics = mlyrics.pane.viewMode.savedData.lyrics.substr(0, translDelimPos1);
			}

			editTimeTracksBox.childNodes[0].removeAttribute("style");
			editTimeTracksBox.childNodes[0].childNodes[0].setAttribute("style", "visibility: hidden");

			var lyricsArray = tempLyrics.split("\n");
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
			document.getElementById("lm-deck").selectedIndex = 1;
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
				document.getElementById("notifEnabledMenuItem").setAttribute("checked", "true");
				document.getElementById("notifDisabledMenuItem").setAttribute("checked", "false");
			} else {
				document.getElementById("notifEnabledMenuItem").setAttribute("checked", "false");
				document.getElementById("notifDisabledMenuItem").setAttribute("checked", "true");
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
				ML_debugOutput("Pane collapsed on load");
				mlyrics.pane.ourDisplayPane.collapsed = true;
			}
			
			window.top.gBrowser.tabContainer.addEventListener("TabSelect", mlyrics.pane.tabSelectListener, false);
		},
		
		showPane: function (needShow) {
			
			ML_debugOutput("Collapse action: " + this.usercollapsed + ", " + mlyrics.pane.ourDisplayPane.collapsed + ", " + needShow);
			
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
		
		start: function () {
			if (!mlyrics.pane.mediaItemSelectListener.timer)
				mlyrics.pane.mediaItemSelectListener.timer = setInterval("mlyrics.pane.mediaItemSelectListener.updatePaneInfo()", 2);
			
			mlyrics.pane.mediaItemSelectListener.enableOnSelect(-1);
		},
		
		stop: function () {
			clearInterval(mlyrics.pane.mediaItemSelectListener.timer);
			mlyrics.pane.mediaItemSelectListener.timer = null;
			mlyrics.pane.mediaItemSelectListener.curMediaItem = null;
		},
		
		updatePaneInfo: function (force) {
			if (mlyrics.pane.prefs.getBoolPref("showNowSelected")) {
				var mediaListView = window.top.gBrowser.tabContainer.getItemAtIndex(0).mediaListView;
				if (!mediaListView) return;
				
				var mediaSelection = mediaListView.selection;
				
				if (force || mlyrics.pane.mediaItemSelectListener.curMediaItem != mediaSelection.currentMediaItem) {
					mlyrics.pane.mediaItemSelectListener.curMediaItem = mediaSelection.currentMediaItem;
					
					// Remove notifications
					var mTop = document.getElementById("infobar");
					mTop.removeAllNotifications(true);
			
					document.getElementById("refreshMenuItem").selectedItem = document.getElementById("contxtRefreshTagMenu");
					document.getElementById("contxtTranslateMetaMenu").disabled = true;
					
					var metadataArtist = mlyrics.pane.mediaItemSelectListener.curMediaItem.getProperty(SBProperties.artistName);
					var metadataAlbum = mlyrics.pane.mediaItemSelectListener.curMediaItem.getProperty(SBProperties.albumName);
					var metadataTrack = mlyrics.pane.mediaItemSelectListener.curMediaItem.getProperty(SBProperties.trackName);
					var metadataLyrics = mlyrics.pane.mediaItemSelectListener.curMediaItem.getProperty("http://songbirdnest.com/data/1.0#lyrics");
					
					mlyrics.pane.buildPage(metadataArtist, metadataAlbum, metadataTrack, metadataLyrics);
					
					if (mlyrics.pane.controller.lmDeck.selectedIndex != 2) {
						mlyrics.pane.controller.lmDeck.selectedIndex = 1;
					}
				}
			}
		},
		
		enableOnSelect: function (enable) {
			if (enable == -1) {
				if (mlyrics.pane.prefs.getBoolPref("showNowSelected")) {
					document.getElementById("showSelectedMenuItem").setAttribute("checked", "true");
					document.getElementById("showNowPlayingMenuItem").setAttribute("checked", "false");
					document.getElementById("nextPrevBtnsHbox").hidden = false;
				}
				else {
					document.getElementById("showSelectedMenuItem").setAttribute("checked", "false");
					document.getElementById("showNowPlayingMenuItem").setAttribute("checked", "true");
					document.getElementById("nextPrevBtnsHbox").hidden = true;
				}
			}
			else {
				if (enable) {
					mlyrics.pane.prefs.setBoolPref("showNowSelected", true);
					document.getElementById("showSelectedMenuItem").setAttribute("checked", "true");
					document.getElementById("showNowPlayingMenuItem").setAttribute("checked", "false");
					document.getElementById("nextPrevBtnsHbox").hidden = false;
				}
				else {
					mlyrics.pane.prefs.setBoolPref("showNowSelected", false);
					document.getElementById("showSelectedMenuItem").setAttribute("checked", "false");
					document.getElementById("showNowPlayingMenuItem").setAttribute("checked", "true");
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
			
			ML_debugOutput("TAB event: " + location);
			
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
				ML_debugOutput("Pane collapsed on tab switch");
				mlyrics.pane.controller.showPane(false);
			}
		}
	},
	
	positionListener: {
		timer: null,
		duration: 0,
		lyricsMaxHeight: 0,
		lyricsNormalHeight: 0,
		mouseover: false,
		scrollCorrection: 0,
		timeArray: [],
		playPart: 0,

		constShowDelayMiliSec: 500,
		
		restart: function () {
			
			if (!mlyrics.pane.gMM.playbackControl) {
				this.duration = 0;
			}
			else {
				this.duration = mlyrics.pane.gMM.playbackControl.duration;
			}

			var scrollHeight = document.getElementById('lm-content').contentWindow.document.body.scrollHeight;
			var offsetHeight = document.getElementById('lm-content').contentWindow.document.body.offsetHeight;
			var clientHeight = document.getElementById('lm-content').contentWindow.document.body.clientHeight;
			
			this.lyricsMaxHeight = scrollHeight;
			this.lyricsNormalHeight = clientHeight;

			this.scrollCorrection = 0;
			this.playPart = 0;
			
			// We need to start show lines beforehand
			for (var i=0; i<this.timeArray.length; i++) {
				this.timeArray[i] -= this.constShowDelayMiliSec;
			}
			
			clearInterval(this.timer);
			
			var browser = window.top.gBrowser.selectedTab.linkedBrowser;
			var location = browser.contentDocument.location.toString();
			if (location.substr(0, 25) != "chrome://shoutcast-radio/") {
				this.timer = setInterval("mlyrics.pane.positionListener.scrollLyrics()", 2);
			}
		},
		
		scrollLyrics: function () {
			if (mlyrics.pane.prefs.getBoolPref("showNowSelected")) return;
			
			var position = mlyrics.pane.gMM.playbackControl.position;
			if (position < 0) position = 0;
			
			// Time tracks scrolling
			if (this.timeArray.length > 1) {
				
				var normalLineTimeLen = this.duration / this.timeArray.length;
				var speedIndexSum = 0;
				for (var i=0; i<this.timeArray.length-1; i++) {

					var currLineTimeLen = this.timeArray[i+1] - this.timeArray[i];
					speedIndexSum += currLineTimeLen/normalLineTimeLen;

					if (	position > this.timeArray[i]  && 
						position < this.timeArray[i+1] ) {
						
						var currLineTimeLen = position - this.timeArray[i];
						var lrcLineTimeLen = this.timeArray[i+1] - this.timeArray[i];

						var speedIndex = speedIndexSum / (i+1);

						// Show 2 lines at the top of the current line
						var playPart = (i-2 + currLineTimeLen/lrcLineTimeLen) / this.timeArray.length;
						/*if (playPart > this.playPart)*/ this.playPart = playPart;

						break;
					}
				}
			}

			// Normal scrolling
			else {
				// 30 sec start delay
				var playPart = (position - 30000) / (this.duration - 30000);
				this.playPart = playPart + playPart*this.scrollCorrection/this.lyricsMaxHeight; // Force speed on correction
			}
			
			if (this.mouseover) {
				this.scrollCorrection = document.getElementById('lm-content').contentWindow.document.body.scrollTop - this.lyricsMaxHeight*this.playPart;
			}
			else {
				if (mlyrics.pane.prefs.getBoolPref("scrollEnable")) {
					var newScrollPos = this.lyricsMaxHeight*this.playPart + this.scrollCorrection;

					if (newScrollPos < 0) newScrollPos = 0;
					document.getElementById('lm-content').contentWindow.scrollTo(0, newScrollPos);
				}
			}
		},
		
		enableScroll: function (enable) {
			if (enable == -1) {
				if (mlyrics.pane.prefs.getBoolPref("scrollEnable")) {
					document.getElementById("scrollEnabledMenuItem").setAttribute("checked", "true");
					document.getElementById("scrollDisabledMenuItem").setAttribute("checked", "false");
				}
				else {
					document.getElementById("scrollEnabledMenuItem").setAttribute("checked", "false");
					document.getElementById("scrollDisabledMenuItem").setAttribute("checked", "true");
				}
			}
			else {
				if (enable) {
					mlyrics.pane.prefs.setBoolPref("scrollEnable", true);
					document.getElementById("scrollEnabledMenuItem").setAttribute("checked", "true");
					document.getElementById("scrollDisabledMenuItem").setAttribute("checked", "false");
				}
				else {
					mlyrics.pane.prefs.setBoolPref("scrollEnable", false);
					document.getElementById("scrollEnabledMenuItem").setAttribute("checked", "false");
					document.getElementById("scrollDisabledMenuItem").setAttribute("checked", "true");
				}
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
			var metadataLyrics = mediaItem.getProperty("http://songbirdnest.com/data/1.0#lyrics");
			
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
					}
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
	}
}
