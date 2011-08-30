try {
Components.utils.import("resource://app/jsmodules/ArrayConverter.jsm");
Components.utils.import("resource://app/jsmodules/sbProperties.jsm");
}
catch (error) {alert("MLyrics: Unexpected error - module import error\n\n" + error)}

var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.mlyrics.");
prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);

var gMM = Components.classes["@songbirdnest.com/Songbird/Mediacore/Manager;1"].getService(Components.interfaces.sbIMediacoreManager);

var xulRuntime = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULRuntime);

var localFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);

var windowMediator = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
var songbirdWindow = windowMediator.getMostRecentWindow("Songbird:Main");
var mediaListView = songbirdWindow.gBrowser.currentMediaListView;

var items = "";
var selectedItems = [];
var selectedIndexes = [];
var itemsAttributes = [];
var currentOffset = 0;

window.addEventListener("load", onfLoad, false);

var playlistPlaybackServiceListener = {
	
	onMediacoreEvent: function(ev) {
		if (typeof(Components) == "undefined") return;
		
		switch (ev.type) {
			case Components.interfaces.sbIMediacoreEvent.TRACK_CHANGE:
			case Components.interfaces.sbIMediacoreEvent.STREAM_STOP:
			case Components.interfaces.sbIMediacoreEvent.STREAM_END:
				this.onPlayStateChange(ev.data);
				break;
				
			default:
				break;
		}
	},
	
	onPlayStateChange: function(aMediaItem, aMediaView, aIndex) {
		// Don't do stuff for video
		if (aMediaItem.getProperty(SBProperties.contentType) == "video") return;
		
		var bbox = document.getElementById("ML-batch-bbox");
		for (var i=1; i<bbox.childNodes.length; i=i+2) {
			if (gMM.sequencer.viewPosition == selectedIndexes[(i-1)/2] ) {
				bbox.childNodes[i].childNodes[1].hidden = true;
				bbox.childNodes[i].childNodes[2].hidden = false;
			}
			else {
				bbox.childNodes[i].childNodes[1].hidden = true;
				bbox.childNodes[i].childNodes[2].hidden = true;
			}
		}
	}
}

gMM.addListener(playlistPlaybackServiceListener);

// ==============================================

function onfLoad() {
	
	window.resizeTo(screen.width-41, screen.height-41);
	
	// Get selected items in playlist
	items = mediaListView.selection.selectedIndexedMediaItems;
	while (items.hasMoreElements()) {
		var item = items.getNext().QueryInterface(Components.interfaces.sbIIndexedMediaItem);
		selectedItems.push(item.mediaItem);
		selectedIndexes.push(item.index);
	}
	
	// Build source menu
	( function () {
		var sources = prefs.getCharPref("fetchSourcesList").split("|");
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
			sitem.setAttribute("label", prefs.getCharPref("laddress_" + sources[i]));
			sitem.setAttribute("oncommand", "refetch(" + i + ")");
			sourcesPopup.insertBefore(sitem, contextSourcesSeparator);
		}
	} ) ();
	
	createNext(0);
}

function onhboxmouseover_ (hbox) {
	
	var bbox = document.getElementById("ML-batch-bbox");
	for (var i=0; i<bbox.childNodes.length; i++) {
		bbox.childNodes[i].setAttribute("style", "background-color:");
	}
	
	hbox.setAttribute("style", "background-color: grey");
	
	document.getElementById("ML-maintextbox-multi").value = hbox.childNodes[5].value;
	
	if (gMM.sequencer.viewPosition == selectedIndexes[(getSelectedBoxIndex() - 1) / 2] ) {
		if (gMM.status.state == Components.interfaces.sbIMediacoreStatus.STATUS_PLAYING || gMM.status.state == Components.interfaces.sbIMediacoreStatus.STATUS_BUFFERING) {
			hbox.childNodes[1].hidden = true;
			hbox.childNodes[2].hidden = false;
		}
		else {
			hbox.childNodes[1].hidden = false;
			hbox.childNodes[2].hidden = true;
		}
	}
	else {
		hbox.childNodes[1].hidden = false;
		hbox.childNodes[2].hidden = true;
	}
	
	var itemsArray = document.getElementById("ML_sourcesPopup").getElementsByTagName("menuitem");
	for (var i=0; i<itemsArray.length; i++) {
		if (itemsArray[i].label == hbox.childNodes[0].childNodes[3].value) {
			document.getElementById("refreshMenuItem").selectedItem = itemsArray[i];
			document.getElementById("ML_sourceAddressNextButton").nextSourceIndex = i;
			document.getElementById("ML_sourceAddressNextButton").disabled = false;
			return;
		}
	}
	
	document.getElementById("refreshMenuItem").selectedItem = document.getElementById("ML_contextSourcesSeparator");
	document.getElementById("ML_sourceAddressNextButton").nextSourceIndex = 0;
	document.getElementById("ML_sourceAddressNextButton").disabled = true;
}

function onhboxmouseout_ (sHbox) {
	sHbox.childNodes[1].hidden = true;
}

function onplaycommand () {
	var bbox = document.getElementById("ML-batch-bbox");
	var sIndex = getSelectedBoxIndex();
	sHbox = bbox.childNodes[sIndex];
	
	if (!sHbox.childNodes[2].hidden) {
		sHbox.childNodes[1].hidden = false;
		sHbox.childNodes[2].hidden = true;
		gMM.sequencer.stop();
	}
	else {
		sHbox.childNodes[1].hidden = true;
		sHbox.childNodes[2].hidden = false;
		
		gMM.sequencer.playView(mediaListView, selectedIndexes[ (getSelectedBoxIndex() - 1) / 2 ]);
	}
	
	for (var i=0; i<bbox.childNodes.length; i++) {
		
		if (bbox.childNodes[i].getAttribute("style").indexOf("background-color: grey") == -1 && bbox.childNodes[i].childNodes[1]) {
			bbox.childNodes[i].childNodes[1].hidden = true;
			bbox.childNodes[i].childNodes[2].hidden = true;
		}
	}
}

function createNext (nIndex) {
	currentOffset = nIndex;
	
	var artist = selectedItems[nIndex].getProperty("http://songbirdnest.com/data/1.0#artistName");
	var album = selectedItems[nIndex].getProperty("http://songbirdnest.com/data/1.0#albumName");
	var track = selectedItems[nIndex].getProperty("http://songbirdnest.com/data/1.0#trackName");
	
	var bbox = document.getElementById("ML-batch-bbox");
	var hbox = document.getElementById("ML-batch-hbox-base");
	
	var newSeparator = document.createElement("separator");
	newSeparator.setAttribute("style", "padding-top:5px;padding-bottom:5px");
	
	var newHbox = hbox.cloneNode(true);
	
	newHbox.id = "ML-batch-hbox-" + nIndex;
	newHbox.hidden = false;
	newHbox.childNodes[0].childNodes[0].setAttribute("value", artist);
	newHbox.childNodes[0].childNodes[1].setAttribute("value", album);
	newHbox.childNodes[0].childNodes[2].setAttribute("value", track);
	newHbox.childNodes[0].childNodes[3].setAttribute("value", "--------------");
	
	if (nIndex) bbox.appendChild(newSeparator);
	bbox.appendChild(newHbox);
	
	bbox.scrollTop = bbox.scrollHeight;
	
	refetch(
		0,
		function () {
			
			if (currentOffset == nIndex) {
				onhboxmouseover_(newHbox);
				
				if (nIndex < selectedItems.length-1) {
					
					setTimeout(function () { onhboxmouseout_(newHbox); createNext(++nIndex); }, 1000);
				}
				else {
					onhboxmouseout_(newHbox);
					onhboxmouseover = onhboxmouseover_;
					onhboxmouseout = onhboxmouseout_
					document.getElementById("ML-accept-btn-batch").disabled = false;
					document.getElementById("ML-accept-btn-checkall").disabled = false;
					document.getElementById("ML-accept-btn-uncheckall").disabled = false;
				}
			}
		},
		newHbox
	       );
}

function refetch (findex, cbFn, sHbox) {
	
	if (typeof(sHbox) == "undefined") {
		var bbox = document.getElementById("ML-batch-bbox");
		var sIndex = getSelectedBoxIndex();
		sHbox = bbox.childNodes[sIndex];
	}
	
	var artist = sHbox.childNodes[0].childNodes[0].getAttribute("value");
	var album = sHbox.childNodes[0].childNodes[1].getAttribute("value");
	var track = sHbox.childNodes[0].childNodes[2].getAttribute("value");
	
	var lm_lyrics=mlyrics.fetch.fetchNext(  artist, 
						album, 
						track, 
						
						function (lyrics, source, localIndex) {
							
							document.getElementById("ML-maintextbox-multi").value = lyrics;
							
							document.getElementById("ML_sourceAddressNextButton").hidden = false;
							document.getElementById("ML-maintextbox-multi").disabled = false;
							document.getElementById("refreshMenuItem").disabled = false;
							document.getElementById("ML-progress-multi").hidden = true;
							
							if (!localIndex) {
								document.getElementById("refreshMenuItem").selectedItem = document.getElementById("ML_contextSourcesSeparator");
								document.getElementById("ML_sourceAddressNextButton").disabled = true;
								document.getElementById("ML_sourceAddressNextButton").nextSourceIndex = 0;
								
								onMainTextboxChange(sHbox, -1);
							}
							else {
								document.getElementById("refreshMenuItem").selectedIndex = localIndex+1;
								document.getElementById("ML_sourceAddressNextButton").disabled = false;
								document.getElementById("ML_sourceAddressNextButton").nextSourceIndex = localIndex;
								
								onMainTextboxChange(sHbox, localIndex-1);
							}
							
							if (cbFn) cbFn();
						},
						
						findex,
						false,
						
						function (lsource, lprogress, localIndex) {
							if (typeof(localIndex) == "undefined") return;
							
							document.getElementById("refreshMenuItem").selectedIndex = localIndex+2;
							document.getElementById("refreshMenuItem").disabled = true;
							document.getElementById("ML-maintextbox-multi").disabled = false;
							document.getElementById("ML-progress-multi").hidden = false;
							document.getElementById("ML_sourceAddressNextButton").hidden = true;
						},
						0
					);
}

function onMainTextboxChange (sHbox, sIndex) {
	
	var sources = prefs.getCharPref("fetchSourcesList").split("|");
	var bbox = document.getElementById("ML-batch-bbox");
	var maintextbox = document.getElementById("ML-maintextbox-multi");
	
	if (typeof(sHbox) == "undefined") {
		sIndex = getSelectedBoxIndex();
		sHbox = bbox.childNodes[sIndex]
	}
	else {
		checkItem(sHbox, maintextbox.value != "");
	}
	
	if (sIndex == -1) {
		sHbox.childNodes[5].value = maintextbox.value;
		sHbox.childNodes[0].childNodes[3].value = "--------------";
		
		return;
	}

	var sourceIndex = document.getElementById("refreshMenuItem").selectedIndex - 2;
	
	sHbox.childNodes[5].value = maintextbox.value;
	sHbox.childNodes[0].childNodes[3].value = prefs.getCharPref("laddress_" + sources[sourceIndex]);
}

function getSelectedBoxIndex () {
	var bbox = document.getElementById("ML-batch-bbox");
	for (var i=0; i<bbox.childNodes.length; i++) {
		
		if (bbox.childNodes[i].getAttribute("style").indexOf("background-color: grey") != -1) {
			return i;
		}
	}
}

function onLyricsCheck (callcheck) {
	
	checkItem(callcheck.parentNode.parentNode, !isCheckedItem(callcheck.parentNode.parentNode));
}

function checkItem (sHbox, check) {
	if (check) {
		sHbox.childNodes[4].childNodes[1].src = "chrome://mlyrics/content/images/Check-icon.png";
	}
	else {
		sHbox.childNodes[4].childNodes[1].src = "chrome://mlyrics/content/images/Cancel-icon.png";
	}
}

function isCheckedItem (sHbox) {
	if (sHbox.childNodes[4] && sHbox.childNodes[4].childNodes[1].src == "chrome://mlyrics/content/images/Check-icon.png") {
		return true;
	}
	else {
		return false;
	}
}

function checkAll (check) {
	var bbox = document.getElementById("ML-batch-bbox");
	for (var i=0; i<bbox.childNodes.length; i++) {
		if (bbox.childNodes[i].childNodes[1]) {
			checkItem(bbox.childNodes[i], check);
		}
	}
}

function onAcceptChages (btn) {
	
	btn.disabled = true;
	
	var mediaItemArray = Components.classes["@songbirdnest.com/moz/xpcom/threadsafe-array;1"].createInstance(Components.interfaces.nsIMutableArray);
	
	var bbox = document.getElementById("ML-batch-bbox");
	for (var i=0; i<bbox.childNodes.length; i++) {
		if ( !isCheckedItem(bbox.childNodes[i]) ) continue;
		
		// Remove read only attribute
		var sIndex = (i+1)/2-1;
		
		if (xulRuntime.OS == "WINNT") {
			var filePath = decodeURIComponent(selectedItems[sIndex].contentSrc.path).substr(1).replace(/\//g, "\\");
		}
		else {
			var filePath = decodeURIComponent(selectedItems[sIndex].contentSrc.path);
		}
		
		localFile.initWithPath(filePath);
		itemsAttributes[sIndex] = localFile.permissions;
		localFile.permissions = 0644;
		
		saveItem(mediaItemArray, i, bbox.childNodes[i]);
	}
	
	if (mediaItemArray.length > 0) {
		var metadataService = Components.classes["@songbirdnest.com/Songbird/FileMetadataService;1"].getService(Components.interfaces.sbIFileMetadataService);
		var propArray = ArrayConverter.stringEnumerator([SBProperties.lyrics]);
		var metadataWriteProgress = metadataService.write(mediaItemArray, propArray);
		
		var metadataWriteCheck = setInterval(function () {
			if (metadataWriteProgress.status == 32) return;
			
			clearInterval(metadataWriteCheck);
			
			if (!metadataWriteProgress.status) {
				mediaItemArray.clear();
				
				var errorFilesList = "";
				
				for (var i=0; i<bbox.childNodes.length; i++) {
					if ( !isCheckedItem(bbox.childNodes[i]) ) continue;
					if (bbox.childNodes[i].childNodes[5].value == "") continue;
					
					var fileItemPath = decodeURIComponent(selectedItems[(i+1)/2-1].contentSrc.path);
					
					var appended = false;
					for (var k=0; k<selectedItems.length; k++) {
						var addedItemPath = decodeURIComponent(selectedItems[k].contentSrc.path);
						if (k != (i+1)/2-1 && fileItemPath == addedItemPath) {
							appended = true;
							break;
						}
					}
					
					// Do not append already existing item (sometimes error object returns few copies)
					if (appended) continue;
					
					var errorsEnum = metadataWriteProgress.getErrorMessages();
					while (errorsEnum.hasMore()) {
						var fileErrorPath = errorsEnum.getNext().substr(7);
						
						if (fileItemPath == fileErrorPath) {
							errorFilesList +=  fileErrorPath + "\n";
							
							//if (!prefs.getBoolPref("saveInDB")) {
							//	clearItem(mediaItemArray, i, bbox.childNodes[i]);
							//}
							//else {
								markBadItem(mediaItemArray, i, bbox.childNodes[i]);
							//}
							break;
						}
					}
				}
				
				//if (!prefs.getBoolPref("saveInDB")) metadataService.write(mediaItemArray, propArray);
				
				alert(metadataWriteProgress.statusText + "\n\n" + errorFilesList);
			}

			for (var i=0; i<bbox.childNodes.length; i++) {
				if ( !isCheckedItem(bbox.childNodes[i]) ) continue;
		
				// Restore attributes
				var sIndex = (i+1)/2-1;
				
				if (xulRuntime.OS == "WINNT") {
					var filePath = decodeURIComponent(selectedItems[sIndex].contentSrc.path).substr(1).replace(/\//g, "\\");
				}
				else {
					var filePath = decodeURIComponent(selectedItems[sIndex].contentSrc.path);
				}
				
				localFile.initWithPath(filePath);
				localFile.permissions = itemsAttributes[sIndex];
			}
			
			btn.disabled = false;
			window.close();
		}, 100);
		
		gMM.sequencer.stop(); // Needed because sbiMetadataService may not complete untill next song or stop
	}
}

function saveItem (mediaItemArray, sIndex, sHbox) {
	
	sIndex = (sIndex+1)/2-1;
	
	if (sHbox.childNodes[5].value == "") {
		selectedItems[sIndex].setProperty("http://songbirdnest.com/data/1.0#lyrics", null);
		selectedItems[sIndex].setProperty("http://songbirdnest.com/data/1.0#lyricistName", null);
	}
	else {
		selectedItems[sIndex].setProperty("http://songbirdnest.com/data/1.0#lyrics", sHbox.childNodes[5].value);
		selectedItems[sIndex].setProperty("http://songbirdnest.com/data/1.0#hasLyrics", "chrome://mlyrics/content/images/haslyrics-white.png");
		if (sHbox.childNodes[0].childNodes[3].value != "--------------") {
			selectedItems[sIndex].setProperty("http://songbirdnest.com/data/1.0#lyricistName", "Songbird MLyrics [" + sHbox.childNodes[0].childNodes[3].value + "]\n");
		}
		else {
			selectedItems[sIndex].setProperty("http://songbirdnest.com/data/1.0#lyricistName", null);
		}
	}
	
	mediaItemArray.appendElement(selectedItems[sIndex], false);
}

function clearItem (mediaItemArray, sIndex, sHbox) {
	
	sIndex = (sIndex+1)/2-1;
	
	selectedItems[sIndex].setProperty("http://songbirdnest.com/data/1.0#lyrics", null);
	selectedItems[sIndex].setProperty("http://songbirdnest.com/data/1.0#lyricistName", null);
	
	mediaItemArray.appendElement(selectedItems[sIndex], false);
}

function markBadItem (mediaItemArray, sIndex, sHbox) {
	
	sIndex = (sIndex+1)/2-1;
	
	selectedItems[sIndex].setProperty("http://songbirdnest.com/data/1.0#hasLyrics", "chrome://mlyrics/content/images/haslyrics-black.png");
	
	mediaItemArray.appendElement(selectedItems[sIndex], false);
}
