var gBundle = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
var strings = gBundle.createBundle("chrome://mlyrics/locale/overlay.properties");

var batchtooltip = strings.GetStringFromName("batchtooltip");
var fetchtooltip = strings.GetStringFromName("fetchtooltip");

window.addEventListener("load", onfLoad, false);

function onfLoad () {
	
	var wOldWindth = document.getElementById("trackeditor-tabbox").parentNode.width;
	document.getElementById("trackeditor-tabbox").parentNode.width = parseInt(wOldWindth, 10) + 50;
	
	btn_chk();
	
	source_check();
	
	var sourceSaved = "";
	var sourceHolder = document.getElementById('lyrics-edit-source');
	if (sourceHolder.value) {
		var MLCommentPos = sourceHolder.value.search(/Songbird MLyrics \[.*\]/);
		if (MLCommentPos != -1) {
			var sourceStartPos = sourceHolder.value.indexOf("[", MLCommentPos);
			var sourceEndPos = sourceHolder.value.indexOf("]", sourceStartPos);
			sourceSaved = sourceHolder.value.substring(sourceStartPos+1, sourceEndPos);
		}
	}
	
	(
		function () {
			
			if(!TrackEditor.state | (TrackEditor.state.selectedItems.length < 1)) return;
				
			var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.mlyrics.");
			prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);

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
				sitem.setAttribute("oncommand", "onFetch(" + i + ");");
				sourcesPopup.insertBefore(sitem, contextSourcesSeparator);
				
				if (sitem.label == sourceSaved)
					document.getElementById("refreshMenuItem").selectedItem = sitem;
			}
			
		}
	) ();
	
	resetLyrics(); // Linux lyrics newline fix
}

function btn_chk() {

	if(TrackEditor.state && (TrackEditor.state.selectedItems.length > 1)) {
	  
	  var btn_batch = document.getElementById('batch_btn'); 
	  btn_batch.setAttribute('hidden', 'false');
	  btn_batch.setAttribute('tooltiptext', batchtooltip);
	  
	  var btn_fetch = document.getElementById('refreshMenuItem');
	  btn_fetch.setAttribute('hidden', 'true');
	  btn_fetch.setAttribute('tooltiptext', fetchtooltip);
	  
	  document.getElementById("ML_sourceAddressNextButton").hidden = true;
	}

}

function source_check () {
	
  if (!TrackEditor.state) return;
	
  var metadataLyricist = TrackEditor.state.getPropertyValue('http://songbirdnest.com/data/1.0#lyricistName'); 
  
  if (typeof(metadataLyricist) != "undefined" && metadataLyricist) {
      var MLCommentPos = metadataLyricist.search(/Songbird MLyrics \[.*\]\n/);
      if (MLCommentPos != -1) {
	var sourceStartPos = metadataLyricist.indexOf("[", MLCommentPos);
	var sourceEndPos = metadataLyricist.indexOf("]", sourceStartPos);
	var sourceSaved = metadataLyricist.substring(sourceStartPos+1, sourceEndPos);
	
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

function multiFetch () {
	var dataObj = {};
	
	dataObj.artist = TrackEditor.state.getPropertyValue('http://songbirdnest.com/data/1.0#artistName');
	dataObj.album = TrackEditor.state.getPropertyValue('http://songbirdnest.com/data/1.0#albumName');
	dataObj.track = TrackEditor.state.getPropertyValue('http://songbirdnest.com/data/1.0#trackName');
	
	var metadataLyrics = TrackEditor.state.selectedItems[0].getProperty('http://songbirdnest.com/data/1.0#lyrics');
	
	if (metadataLyrics)
		dataObj.lyrics = metadataLyrics;
	else
		dataObj.lyrics = null;
	
	document.getElementById("lyrics-editor").trackData = dataObj;
	
	var multiFetchWindow = openDialog("chrome://mlyrics/content/xul/multi-fetch.xul", "mlyrics", "chrome,centerscreen,resizable,modal=yes");
	
	onMultiUnLoad();
}

function batchFetch () {
	var selectedItems = TrackEditor.state.selectedItems;
	
	var batchFetchWindow = openDialog("chrome://mlyrics/content/xul/batch.xul", "mlyrics batch", "chrome,centerscreen,resizable,modal=yes");
	
	window.close();
}

function onFetch (startAt) {
  var artist=TrackEditor.state.getPropertyValue('http://songbirdnest.com/data/1.0#artistName');
  var album=TrackEditor.state.getPropertyValue('http://songbirdnest.com/data/1.0#albumName');
  var track=TrackEditor.state.getPropertyValue('http://songbirdnest.com/data/1.0#trackName');
  
  var lm_lyrics=mlyrics.fetch.fetchNext( artist, 
					  album, 
					  track, 
					  
					  function (lyrics, source, localIndex) {
					    document.getElementById("ML_sourceAddressNextButton").hidden = false;
					    document.getElementById("refreshMenuItem").disabled = false;
					    document.getElementById("clear_btn").disabled = false;
					    document.getElementById("instr_btn").disabled = false;
					    
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
						
					    var holder = document.getElementById('lyrics-editor'); 
					    holder.value=lyrics; 
					    if (lyrics && lyrics != '') {
					      TrackEditor.state.setPropertyValue('http://songbirdnest.com/data/1.0#lyrics', lyrics); 
					      TrackEditor.state.setPropertyEnabled('http://songbirdnest.com/data/1.0#lyrics', 'true');
					      
					      if (lyrics.toLowerCase().substr(0, 14) != "[instrumental]" || !source) {
						TrackEditor.state.setPropertyValue('http://songbirdnest.com/data/1.0#lyricistName', "Songbird MLyrics [" + source + "]\n");
					      }
					      else {
						TrackEditor.state.setPropertyValue('http://songbirdnest.com/data/1.0#lyricistName', null);
					      }
					      
					      TrackEditor.state.setPropertyEnabled('http://songbirdnest.com/data/1.0#lyricistName', 'true');
					    }
					    
					    document.getElementById("ML_TrE_sourceFetchProgress").hidden = true;
					  },
					  
					  startAt,
					  false,
					  
					  function (lsource, lprogress, localIndex) {
					      if (typeof(localIndex) == "undefined") return;
					      
					      document.getElementById("refreshMenuItem").selectedIndex = localIndex+2;
					      document.getElementById("ML_sourceAddressNextButton").hidden = true;
					      document.getElementById("refreshMenuItem").disabled = true;
					      document.getElementById("clear_btn").disabled = true;
					      document.getElementById("instr_btn").disabled = true;
					      
					      document.getElementById("ML_TrE_sourceFetchProgress").hidden = !lprogress;
					  }
					);
}

function onClear () {
  document.getElementById('lyrics-editor').value=''; 
  document.getElementById("refreshMenuItem").selectedIndex = 0;
  document.getElementById("ML_sourceAddressNextButton").nextSourceIndex = 0;
  
  
  TrackEditor.state.setPropertyValue('http://songbirdnest.com/data/1.0#lyrics', ''); 
  TrackEditor.state.setPropertyEnabled('http://songbirdnest.com/data/1.0#lyrics', 'true');
  
  TrackEditor.state.setPropertyValue('http://songbirdnest.com/data/1.0#lyricistName', '');
  TrackEditor.state.setPropertyEnabled('http://songbirdnest.com/data/1.0#lyricistName', 'true');
}

function onInstrumental () {
  document.getElementById('lyrics-editor').value='[Instrumental]';
  document.getElementById("refreshMenuItem").selectedIndex = 0;
  document.getElementById("ML_sourceAddressNextButton").nextSourceIndex = 0;
  
  TrackEditor.state.setPropertyValue('http://songbirdnest.com/data/1.0#lyrics', '[Instrumental]'); 
  TrackEditor.state.setPropertyEnabled('http://songbirdnest.com/data/1.0#lyrics', 'true');
  
  TrackEditor.state.setPropertyValue('http://songbirdnest.com/data/1.0#lyricistName', ''); 
  TrackEditor.state.setPropertyEnabled('http://songbirdnest.com/data/1.0#lyricistName', 'true');
}

function resetLyrics () {
	var metadataLyrics = TrackEditor.state.selectedItems[0].getProperty("http://songbirdnest.com/data/1.0#lyrics");
	if (metadataLyrics) document.getElementById("lyrics-editor").value = metadataLyrics;	// Linux lyrics newline fix
}

function translateLyrics () {
	
	var metadataLyrics = document.getElementById("lyrics-editor").value;
	
	document.getElementById("ML_TrE_sourceFetchProgress").hidden = false;
	document.getElementById("ML_sourceAddressNextButton").hidden = true;
	document.getElementById("refreshMenuItem").disabled = true;
	
	// Do not translate already translated lyrics
	if (metadataLyrics.indexOf("\n [ Google translated ] \n") != -1) {
		var translDelimPos1 = metadataLyrics.indexOf("\n\n =================== \n [ ");
		if (translDelimPos1 != -1) {
			metadataLyrics = metadataLyrics.substr(0, translDelimPos1);
		}
	}
	
	mlyrics.fetch.googleTranslate(  metadataLyrics,
					function (translated) {
						if (translated != "") {
							var delimiter = "\n\n =================== \n [ Google translated ] \n =================== \n\n";
							var fullLyrics = metadataLyrics + delimiter + translated;
							
							document.getElementById("lyrics-editor").value = fullLyrics;
						}
						
						document.getElementById("ML_TrE_sourceFetchProgress").hidden = true;
						document.getElementById("refreshMenuItem").disabled = false;
						
						var lyricsHolder = document.getElementById('lyrics-editor'); 
						var lyrics = lyricsHolder.value;
						
						TrackEditor.state.setPropertyValue('http://songbirdnest.com/data/1.0#lyrics', lyrics); 
						TrackEditor.state.setPropertyEnabled('http://songbirdnest.com/data/1.0#lyrics', 'true');
					}, 
					true
				     );
}

function onMultiUnLoad () {
	
	var lyricsHolder = document.getElementById('lyrics-editor'); 
	var lyrics = lyricsHolder.value;
	
	if (lyrics && lyrics != '') {
		TrackEditor.state.setPropertyValue('http://songbirdnest.com/data/1.0#lyrics', lyrics); 
		TrackEditor.state.setPropertyEnabled('http://songbirdnest.com/data/1.0#lyrics', 'true');
		
		if (lyrics.toLowerCase().substr(0, 14) != "[instrumental]" || !source) {
			
			var sourceHolder = document.getElementById('lyrics-edit-source'); 
			
			if (sourceHolder.value)
				TrackEditor.state.setPropertyValue('http://songbirdnest.com/data/1.0#lyricistName', "Songbird MLyrics [" + sourceHolder.value + "]\n");
		}
		else {
			TrackEditor.state.setPropertyValue('http://songbirdnest.com/data/1.0#lyricistName', null);
		}
		
		TrackEditor.state.setPropertyEnabled('http://songbirdnest.com/data/1.0#lyricistName', 'true');
	}
}

function onRemoveTranslation () {
	
	var lyricsHolder = document.getElementById('lyrics-editor');
	
	if (lyricsHolder.value.indexOf("\n [ Google translated ] \n") != -1) {
		
		var translDelimPos1 = lyricsHolder.value.indexOf("\n\n =================== \n [ ");
		if (translDelimPos1 != -1) {
			lyricsHolder.value = lyricsHolder.value.substr(0, translDelimPos1);
			
			TrackEditor.state.setPropertyValue('http://songbirdnest.com/data/1.0#lyrics', lyricsHolder.value); 
			TrackEditor.state.setPropertyEnabled('http://songbirdnest.com/data/1.0#lyrics', 'true');
		}
	}
}