try {
Components.utils.import("resource://gre/modules/NetUtil.jsm");
}
catch (error) {alert("MLyrics: Unexpected error - module import error\n\n" + error)}

// Configuration variables
var abortTimeout 			= 30000;
var maxDebugOutputTries 	= 1000;
var maxMarkLength 			= 100;
var configVersion			= "1.0";

var regExpCharacters = [".", ",", "?", "!", "\\", "^", "$", "*", "+", "(", ")", ":", "=", "[", "]", "{", "}", "|"]
var customRegExpDelimiter = " ››› ";

var debugOutputTries = 0;
var globalOriginalLyrics = "";
var globalErrorMark = "";
var lastTrackButtonClicked = "title";
var sites = [];
var notificationCounter = 0;

function onLoad () {
//alert("loaded!");
	loadDatabase("/home/alex/MLyrics.Sites.ini");
}

function onUnLoad () {
//alert("unloaded!");
}

function copyToClipboard () {
	var textbox = document.getElementById("fetchResultTextbox");
	if (textbox.selectionEnd - textbox.selectionStart <= 0) return false;
	
	var selected = textbox.value.substring(textbox.selectionStart, textbox.selectionEnd);
	var clipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"].getService(Components.interfaces.nsIClipboardHelper);
	clipboardHelper.copyString(selected); 
}

function onFetchTitleChange (trackName) {
	applyTrackFilters("title");
	//document.getElementById("titleOutputTextbox").value = trackName;
}

function onFetchArtistChange (artistName) {
	applyTrackFilters("artist");
	//document.getElementById("artistOutputTextbox").value = artistName;
}

function onFetchAlbumChange (albumName) {
	applyTrackFilters("album");
	//document.getElementById("albumOutputTextbox").value = albumName;
}

function onFetchTry () {
	var textboxValue = document.getElementById("fetchTextbox").value;
	if (textboxValue == "") return;
	
	document.getElementById("fetchTryButton").disabled = true;
	document.getElementById("fetchProgressmeter").hidden = false;

	var lyricsUrl = replaceCustomRegExps(textboxValue);
	
	var domainNameStart = lyricsUrl.indexOf("://");
	if (domainNameStart == -1) 
		domainNameStart = 0;
	else
		domainNameStart += 3;
	
	var domainNameEnd = lyricsUrl.indexOf("/", domainNameStart);
	if (domainNameEnd == -1) domainNameEnd = lyricsUrl.length;
	
	document.getElementById("sourceNameTextbox").value = lyricsUrl.substring(domainNameStart, domainNameEnd);
	
	//var finished = false;
	
	/*fetchPage(lyricsUrl, function (data) {
			if (finished) {
				document.getElementById("fetchTryButton").disabled = false;
				document.getElementById("fetchProgressmeter").hidden = true;
			}
			else {
				finished = true;
			}
			
			document.getElementById("fetchResultVbox").hidden = false;

			if (!!data && data != "") {
				var fetchResultTextbox = document.getElementById("fetchResultTextbox");
				fetchResultTextbox.hidden = false;
				fetchResultTextbox.value = data.toLowerCase();
			}
		}
	);*/
	
	var trackName = document.getElementById("titleOutputTextbox").value;
	var artistName = document.getElementById("artistOutputTextbox").value;
	var albumName = document.getElementById("albumOutputTextbox").value;
	
	var randTitle = Math.random().toString(36).substring(2);
	var randArtist = Math.random().toString(36).substring(2);
	var randAlbum = Math.random().toString(36).substring(2);
	
	var errorUrl = lyricsUrl.replace(trackName, randTitle)
							.replace(artistName, randArtist)
							.replace(albumName, randAlbum);
	
	/*fetchPage(errorUrl, function (data) {
			if (finished) {
				document.getElementById("fetchTryButton").disabled = false;
				document.getElementById("fetchProgressmeter").hidden = true;
			}
			else {
				finished = true;
			}
			
			document.getElementById("fetchErrorVbox").hidden = false;

			if (!!data && data != "") {
				var fetchErrorTextbox = document.getElementById("fetchErrorTextbox");
				fetchErrorTextbox.hidden = false;
				fetchErrorTextbox.value = data.toLowerCase();
			}
		}
	);*/
	
	document.getElementById("fetchTryButton").disabled = false;
	document.getElementById("fetchProgressmeter").hidden = true;
	document.getElementById("fetchErrorVbox").hidden = false;
	document.getElementById("fetchResultVbox").hidden = false;
	document.getElementById("fetchResultTestMarksButton").disabled = false;
	
	var fetchResultTextbox = document.getElementById("fetchResultTextbox");
	fetchResultTextbox.hidden = false;
	fetchResultTextbox.value = lyricsCodeData.toLowerCase();
				
	var fetchErrorTextbox = document.getElementById("fetchErrorTextbox");
	fetchErrorTextbox.hidden = false;
	fetchErrorTextbox.value = lyricsErrorData.toLowerCase();
}

function fetchPage (url, cbFn, needOKResponse) {
	var req = new XMLHttpRequest();
	if (!req) {
		cbFn("");
		return;
	}

	debugOutput("Fetch: " + url);

	try {
	req.open("GET", url, true);
	}
	catch (e) {
		debugOutput(e);
		cbFn("");
		return;
	}

	var abortTimer = setTimeout(function () {req.abort(); cbFn("");}, abortTimeout);

	req.onreadystatechange = function() {				
		/*if () {
			mlyrics.lib.debugOutput("Fetch1 abort - track changed");
			clearTimeout(abortTimer);
			this.abort();
			return;
		}*/

		if (this.readyState != 4) return;

		if (this.status) 
			debugOutput("Got data with status: " + this.status);
		else
			debugOutput("Error: cannot reach server");

		clearTimeout(abortTimer);

		var data = "";
		if (this.status == 200 || this.status == 404) {
	
			//this.overrideMimeType('text/xml; charset=iso-8859-1');
			data = this.responseText;
		}

		cbFn(data);
	}

	req.onerror = function () {clearTimeout(abortTimer);};

	req.send(null);
}

function discoverFetchResultSelectionMarks () {
	document.getElementById("fetchResultTestMarksButton").disabled = true;
	document.getElementById("fetchResultExtractLyricsButton").disabled = true;
	
	var textbox = document.getElementById("fetchResultTextbox");
	if (!textbox.value || textbox.value == "") {
		document.getElementById("fetchResultStartMarkTextbox").value = "";
		document.getElementById("fetchResultEndMarkTextbox").value = "";
		document.getElementById("fetchResultTestMarksButton").disabled = false;
		return;
	}

	if (textbox.selectionEnd - textbox.selectionStart) {
		debugOutput("Selection start: " + textbox.selectionStart + ", end: " + textbox.selectionEnd);
		getUniqueStartCode(textbox.value, 
				textbox.selectionStart, 
				function (result) {
					if (result != "") {
						document.getElementById("fetchResultStartMarkTextbox").value = result;
							
						getUniqueEndCode(textbox.value,
							textbox.selectionStart,
							textbox.selectionEnd,
							function (result) {
								if (result != "") {
									document.getElementById("fetchResultEndMarkTextbox").value = result;
								}
								document.getElementById("fetchResultTestMarksButton").disabled = false;
							}
						);
					}
					else {
						document.getElementById("fetchResultTestMarksButton").disabled = false;
					}
				}
		);
	}
	else {
		document.getElementById("fetchResultStartMarkTextbox").value = "";
		document.getElementById("fetchResultEndMarkTextbox").value = "";
		document.getElementById("fetchResultTestMarksButton").disabled = false;
	}
}

function backslashSpecialCharacters (strOrig) {
	//alert(strOrig);
	var strNew = "";
	var sym = "";
	for (var i=0; i<strOrig.length; i++) {
		for (var j=0; j<regExpCharacters.length; j++) {
			sym = strOrig.substr(i, 1);
			if (sym == regExpCharacters[j]) {
				sym = "\\" + sym;
				break;
			}
		}
		strNew = "" + strNew + sym;
		//alert(strNew);
	}
	//alert(strOrig + " === " + strNew);
	return strNew;
}

function getUniqueStartCode (pageSourceCode, lyricsStartPos, cbFn) {
	var trackName = document.getElementById("titleOutputTextbox").value.toLowerCase();
	var artistName = document.getElementById("artistOutputTextbox").value.toLowerCase();
	var albumName = document.getElementById("albumOutputTextbox").value.toLowerCase();
	
	// We need this for better performance
	var trackNameLength = trackName.length;
	var artistNameLength = artistName.length;
	var albumNameLength = albumName.length;
	
	document.getElementById("updateMarksProgressmeter").hidden = false;
	var errorPageCode = document.getElementById("fetchErrorTextbox").value;
	
	// Cut from start to lyricsStartPos
	pageSourceCode = pageSourceCode.substring(0, lyricsStartPos);
	
	var i, j;
	
	// Save {title} start positions
	i=0; j=0;
	var trackPositions = new Array();
	while (i<lyricsStartPos) {
		var cpos = pageSourceCode.indexOf(trackName, i);
		if (cpos != -1) {
			trackPositions[j++] = cpos;
			i = cpos;
		}
		i++;
	}
	
	// Save {artist} start positions
	i=0; j=0;
	var artistPositions = new Array();
	while (i<lyricsStartPos) {
		var cpos = pageSourceCode.indexOf(artistName, i);
		if (cpos != -1) {
			artistPositions[j++] = cpos;
			i = cpos;
		}
		i++;
	}
	
	// Save {album} start positions
	i=0; j=0
	var albumPositions = new Array();
	while (i<lyricsStartPos) {
		var cpos = pageSourceCode.indexOf(albumName, i);
		if (cpos != -1) {
			albumPositions[j++] = cpos;
			i = cpos;
		}
		i++;
	}
	
	debugOutput("Replaced source code start: " + pageSourceCode);

	var counter = 1;
	var nextSearch = function () {
		
		// Jump over title if found
		for (var i=0; i<trackPositions.length; i++) {
			if (lyricsStartPos-counter+1 > trackPositions[i] && 
				lyricsStartPos-counter+1 < trackPositions[i] + trackNameLength) {
					counter = lyricsStartPos+1 - trackPositions[i];
					break;
			}
		}
		
		// Jump over artist if found
		for (var i=0; i<artistPositions.length; i++) {
			if (lyricsStartPos-counter+1 > artistPositions[i] && 
				lyricsStartPos-counter+1 < artistPositions[i] + artistNameLength) {
					counter = lyricsStartPos+1 - artistPositions[i];
					break;
			}
		}
		
		// Jump over album if found
		for (var i=0; i<albumPositions.length; i++) {
			if (lyricsStartPos-counter+1 > albumPositions[i] && 
				lyricsStartPos-counter+1 < albumPositions[i] + albumNameLength) {
					counter = lyricsStartPos+1 - albumPositions[i];
					break;
			}
		}
		
		var unStart = pageSourceCode.substring(lyricsStartPos-counter+1, lyricsStartPos+1);
		var remainingCode = pageSourceCode.substring(0, lyricsStartPos-counter+1);
		
		if (counter > maxMarkLength || lyricsStartPos-counter+1 <= 0) {
			var uniqueInLyricsPage = false;
			var uniqueInErrorPage = false;
			
			unStart = "";
			debugOutput("Unique start was not found");
		}
		else {
			var uniqueInLyricsPage = (remainingCode.indexOf(unStart) == -1);
			var uniqueInErrorPage = (errorPageCode.indexOf(unStart) == -1);
			
			// Backspace special characters because regular expression will be returned
			unStart = backslashSpecialCharacters(unStart);
			unStart = unStart.replace(/\t/g, "\\t").replace(/\n/g, "\\n");
			
			// Replace title, artist and album with {title}, {artist} and {album}
			var titleRegExp = new RegExp(trackName, "g");
			var artistRegExp = new RegExp(artistName, "g");
			var albumRegExp = new RegExp(albumName, "g");
			if (trackName != "") unStart = unStart.replace(titleRegExp, "\{title\}");
			if (artistName != "") unStart = unStart.replace(artistRegExp, "\{artist\}");
			if (albumName != "") unStart = unStart.replace(albumRegExp, "\{album\}");
		
			//debugOutput("unStart (" + (lyricsStartPos-counter+1) + ", " + (lyricsStartPos+1) + "): " + unStart, true);
		}
		
		if (counter > maxMarkLength || lyricsStartPos-counter+1 <= 0 || (uniqueInLyricsPage && uniqueInErrorPage)) {
			document.getElementById("updateMarksProgressmeter").hidden = true;
	
			cbFn(unStart);
		}
		else {
			counter++;
			setTimeout(nextSearch, 50);
		}
	}
	
	nextSearch();
}

function getUniqueEndCode (pageSourceCode, lyricsStartPos, lyricsEndPos, cbFn) {
	var trackName = document.getElementById("titleOutputTextbox").value.toLowerCase();
	var artistName = document.getElementById("artistOutputTextbox").value.toLowerCase();
	var albumName = document.getElementById("albumOutputTextbox").value.toLowerCase();
	
	// We need this for better performance
	var trackNameLength = trackName.length;
	var artistNameLength = artistName.length;
	var albumNameLength = albumName.length;
	
	document.getElementById("updateMarksProgressmeter").hidden = false;
	
	// Cut from lyricsStartPos to end
	pageSourceCode = pageSourceCode.substring(lyricsStartPos);
	var newLyricsEndPos = lyricsEndPos - lyricsStartPos;
	
	var i, j;
	var fullLength = pageSourceCode.length;
	
	// Save {title} start positions
	i=lyricsEndPos; j=0;
	var trackPositions = new Array();
	while (i<fullLength) {
		var cpos = pageSourceCode.indexOf(trackName, i);
		if (cpos != -1) {
			trackPositions[j++] = cpos-lyricsStartPos;
			i = cpos;
		}
		i++;
	}
	
	// Save {artist} start positions
	i=lyricsEndPos; j=0;
	var artistPositions = new Array();
	while (i<fullLength) {
		var cpos = pageSourceCode.indexOf(artistName, i);
		if (cpos != -1) {
			artistPositions[j++] = cpos-lyricsStartPos;
			i = cpos;
		}
		i++;
	}
	
	// Save {album} start positions
	i=lyricsEndPos; j=0
	var albumPositions = new Array();
	while (i<fullLength) {
		var cpos = pageSourceCode.indexOf(albumName, i);
		if (cpos != -1) {
			albumPositions[j++] = cpos-lyricsStartPos;
			i = cpos;
		}
		i++;
	}
	
	var lyricsCode = pageSourceCode.substring(0, newLyricsEndPos);
	
	var counter = 1;
	var nextSearch = function () {
		
		// Jump over {title} if found
		for (var i=0; i<trackPositions.length; i++) {
			if (counter > trackPositions[i] && 
				counter < trackPositions[i] + trackNameLength) {
					counter = trackPositions[i] + trackNameLength;
					break;
			}
		}
		
		// Jump over {artist} if found
		for (var i=0; i<artistPositions.length; i++) {
			if (counter > artistPositions[i] && 
				counter < artistPositions[i] + artistNameLength) {
					counter = artistPositions[i] + artistNameLength;
					break;
			}
		}
		
		// Jump over {album} if found
		for (var i=0; i<albumPositions.length; i++) {
			if (counter > albumPositions[i] && 
				counter < albumPositions[i] + albumNameLength) {
					counter = albumPositions[i] + albumNameLength;
					break;
			}
		}
		
		var unEnd = pageSourceCode.substring(newLyricsEndPos, newLyricsEndPos+counter);
		
		if (counter > maxMarkLength || newLyricsEndPos+counter >= fullLength) {
			var uniqueInLyricsCode = false;
			unEnd = "";
			debugOutput("Unique end was not found");
			debugOutput("lyricsEndPos+counter >= fullLength: " + (newLyricsEndPos+counter) + ">=" + fullLength) 
		}
		else {
			var uniqueInLyricsCode = (lyricsCode.indexOf(unEnd) == -1);
			
			// Backspace special characters because regular expression will be returned
			unEnd = backslashSpecialCharacters(unEnd);
			unEnd = unEnd.replace(/\t/g, "\\t").replace(/\n/g, "\\n");
			
			// Replace title, artist and album with {title}, {artist} and {album}
			var titleRegExp = new RegExp(trackName, "g");
			var artistRegExp = new RegExp(artistName, "g");
			var albumRegExp = new RegExp(albumName, "g");
			if (trackName != "") unEnd = unEnd.replace(titleRegExp, "\{title\}");
			if (artistName != "") unEnd = unEnd.replace(artistRegExp, "\{artist\}");
			if (albumName != "") unEnd = unEnd.replace(albumRegExp, "\{album\}");
			
			//debugOutput("unEnd (" + (newLyricsEndPos) + ", " + (newLyricsEndPos+counter) + "): " + unEnd, true);
		}
		
		debugOutput("fullLength: " + fullLength);
		//alert(uniqueInLyricsCode + " ===" + unEnd + "===");

		if (counter > maxMarkLength || newLyricsEndPos+counter >= fullLength || uniqueInLyricsCode) {
			document.getElementById("updateMarksProgressmeter").hidden = true;
	
			cbFn(unEnd);
		}
		else {
			counter++;
			setTimeout(nextSearch, 50);
		}
	}
	
	nextSearch();
}

function testFetchResultSelectionMarks () {
	var trackName = document.getElementById("titleOutputTextbox").value.toLowerCase();
	var artistName = document.getElementById("artistOutputTextbox").value.toLowerCase();
	var albumName = document.getElementById("albumOutputTextbox").value.toLowerCase();
	
	var lyricsPageCode = document.getElementById("fetchResultTextbox").value;
	var errorPageCode = document.getElementById("fetchErrorTextbox").value;
	var startMark = document.getElementById("fetchResultStartMarkTextbox").value
		.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
	var endMark = document.getElementById("fetchResultEndMarkTextbox").value
		.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
		
		startMark = replaceCustomRegExps(startMark);
		endMark = replaceCustomRegExps(endMark);
	
	var startMarkPos = lyricsPageCode.search(startMark);
	//alert(startMarkPos + " == " + lyricsPageCode.indexOf(startMark.replace(/\\\//g, "/")));
	if (startMarkPos != -1) {
		var startMarkLength = lyricsPageCode.match(startMark)[0].length; // get length of regular expression's found string
		if (errorPageCode.search(startMark) == -1) {
			var endMarkPos = lyricsPageCode.substr(startMarkPos+startMark.length).search(endMark); // regexp indexOf
			if (endMarkPos != -1) {
				endMarkPos += startMarkPos+startMark.length;
				var lyrics = lyricsPageCode.substring(startMarkPos+startMarkLength,  endMarkPos);
				if (lyrics.length > 10) {
					debugOutput("Test OK. startMarkPos: " + startMarkPos + " endMarkPos: " + endMarkPos);
					
					document.getElementById("fetchResultTestMarksButton").disabled = true;
					if (testErrorResultMark()) {
						enableExtrackLyrics(true);
						globalOriginalLyrics = lyrics;
					}
					
					return;
				}
				else {
					debugOutput("Test failed: extracted lyrics too small, re-check your marks");
				}
			}
			else {
				debugOutput("Test failed: end mark cannot be found");
			}
		}
		else {
			debugOutput("Test failed: start mark is not unique");
		}
	}
	else {
		debugOutput("Test failed: start mark cannot be found")
	}
}

function testErrorResultMark () {
	var lyricsPageCode = document.getElementById("fetchResultTextbox").value;
	var errorPageCode = document.getElementById("fetchErrorTextbox").value;
	var errorMark = document.getElementById("fetchErrorTestMarkTextbox").value.toLowerCase();
	
	errorMark = replaceCustomRegExps(errorMark);
	
	if (errorMark == "") {
		globalErrorMark = errorMark;
		return true;
	}
	
	if (errorPageCode.search(errorMark) == -1) {
		debugOutput("Test failed: error mark was not found on the error page");
		return false;
	}
	
	if (lyricsPageCode.search(errorMark) != -1) {
		debugOutput("Test failed: error mark is not unique");
		return false;
	}
	
	globalErrorMark = errorMark;
	
	debugOutput("Test OK: Error mark was found");
	
	document.getElementById("fetchErrorTestMarksButton").disabled = true;
	if (document.getElementById("fetchResultTestMarksButton").disabled)
		document.getElementById("fetchResultExtractLyricsButton").disabled = false;
		
	return true;
}

function extractLyrics () {
	if (globalErrorMark != "" && globalOriginalLyrics.search(globalErrorMark) != -1)
		debugOutput("Extract error: error mark found on lyrics page");
		
	document.getElementById("lyricsViewVbox").hidden = false;
	document.getElementById("lyricsFiltersVbox").hidden = false;
	document.getElementById("lyricsTextbox").value = globalOriginalLyrics;
	
	applyLyricsFilters();
	
	document.getElementById("saveSourceButton").disabled = false;
	document.getElementById("saveDescriptionVbox").hidden = false;
}

function onMarksInput () {
	document.getElementById("fetchResultTestMarksButton").disabled = false;
	enableExtrackLyrics(false);
}

function onErrorMarkInput () {
	document.getElementById("fetchErrorTestMarksButton").disabled = false;
	enableExtrackLyrics(false);
}

function onLyricsPageMouseUp (event) {
	if (event.button != 2) return false;
	
	var textbox = document.getElementById("fetchResultTextbox");
	if (textbox.selectionEnd - textbox.selectionStart <= 0) return false;
	
	document.getElementById("lyricsPageContextMenu").openPopup(null, "", event.clientX, event.clientY, false, false);
}

function enableExtrackLyrics (enable) {
	if (enable) {
		document.getElementById("fetchResultExtractLyricsButton").disabled = false;
	}
	else {
		document.getElementById("fetchResultExtractLyricsButton").disabled = true;
	}
}

function showCustomLyricsRegExpField (show) {
	document.getElementById("customLyricsRegExpHbox").hidden = !show;
}

function lyricsFilterHtmlTags (lyrics) {	
	lyrics = lyrics.replace(/ *\<.+\> */g, "");
	
	return lyrics;
}

function lyricsFilterNeedlessLF (lyrics) {	
	while (lyrics.indexOf("\n\n\n") != -1)
		lyrics = lyrics.replace(/\n\n\n/g, "");
		
	lyrics = lyrics.replace(/^\n+/g, "");
	lyrics = lyrics.replace(/\n+$/g, "");
	
	return lyrics;
}

function lyricsFilterNeedlessSyms (lyrics) {
	lyrics = lyrics.replace(/\r/g, "");
	lyrics = lyrics.replace(/\t/g, "");
	
	return lyrics;
}

function lyricsFilterManySpaces (lyrics) {	
	lyrics = lyrics.replace(/  +/g, " ");
	
	return lyrics;
}

function lyricsFilterLowecase (lyrics) {
	lyrics = lyrics.toLowerCase();
	
	return lyrics;
}

function lyricsFilterCapitalizeFirsts (lyrics) {
	var splitted = lyrics.split("\n");
	var newLyrics = "";
	for (var i=0; i<splitted.length; i++) {
		var firstLetter = splitted[i].substr(0, 1);
		var rest = splitted[i].substr(1);
		
		newLyrics += firstLetter.toUpperCase() + rest + "\n";
	}
	newLyrics = newLyrics.substr(0, newLyrics.length-1);
	
	return newLyrics;
}

function lyricsFilterAddCustom (lyrics, searchfor, replacewith) {
	var re = new RegExp(searchfor, "ig");
	
	lyrics = lyrics.replace(re, replacewith);
	
	return lyrics;
}

function trackFilterToLowerCaseAll (trackData) {
	trackData = trackData.toLowerCase();
	
	return trackData;
}

function trackFilterToLowerCaseFirst (trackData) {
	trackData = trackData.substr(0, 1).toLowerCase() + trackData.substr(1);
	
	return trackData;
}

function trackFilterToUpperCaseAll (trackData) {
	trackData = trackData.toUpperCase();
	
	return trackData;
}

function trackFilterToUpperCaseFirst (trackData) {
	trackData = trackData.substr(0, 1).toUpperCase() + trackData.substr(1);
	
	return trackData;
}

function trackFilterRemoveSpaces (trackData) {
	trackData = trackData.replace(/ /g, "");
	
	return trackData;
}

function enableLyricsFilterUpDownButtons (enable) {
	document.getElementById("upFilterButton").disabled = !enable;
	document.getElementById("downFilterButton").disabled = !enable;
}

function moveLyricsFilterUp () {
  var fetchListBox = document.getElementById("lyricsFiltersListBox");
  
  var selectedItem = fetchListBox.selectedItem;
  var selectedIndex = fetchListBox.selectedIndex;
  if (selectedItem) {
    if (selectedIndex) {
      selectedItem.selected = false;
      var cloneItem = selectedItem.cloneNode(true);
      fetchListBox.insertBefore(cloneItem, fetchListBox.getItemAtIndex(selectedIndex-1));
      fetchListBox.removeChild(selectedItem);
      fetchListBox.clearSelection();
      fetchListBox.selectItem(cloneItem);
      
      fetchListBox.scrollToIndex(selectedIndex-1-3);
      
      if (!fetchListBox.selectedIndex) {
	document.getElementById("upFilterButton").disabled = true;
      }
    }
    else {
      document.getElementById("upFilterButton").disabled = true;
    }
  }
  else {
    document.getElementById("upFilterButton").disabled = true;
    document.getElementById("downFilterButton").disabled = true;
  }
  
  applyLyricsFilters();
}

function moveLyricsFilterDown () {
  var fetchListBox = document.getElementById("lyricsFiltersListBox");
  
  var selectedItem = fetchListBox.selectedItem;
  var selectedIndex = fetchListBox.selectedIndex;
  
  if (selectedItem) {
    if (selectedIndex < fetchListBox.getRowCount()-1) {
      selectedItem.selected = false;
      var cloneItem = selectedItem.cloneNode(true);
      fetchListBox.insertBefore(cloneItem, fetchListBox.getItemAtIndex(selectedIndex+2));
      fetchListBox.removeChild(selectedItem);
      fetchListBox.clearSelection();
      fetchListBox.selectItem(cloneItem);
      
      fetchListBox.scrollToIndex(selectedIndex+1-3);
      
      if (fetchListBox.selectedIndex >= fetchListBox.getRowCount()-1) {
	document.getElementById("downFilterButton").disabled = true;
      }
    }
    else {
      document.getElementById("downFilterButton").disabled = true;
    }
  }
  else {
    document.getElementById("upFilterButton").disabled = true;
    document.getElementById("downFilterButton").disabled = true;
  }
  
  applyLyricsFilters();
}

function removeLyricsFilter () {
	var fetchListBox = document.getElementById("lyricsFiltersListBox");

	var selectedItem = fetchListBox.selectedItem;

	if (selectedItem) {
		selectedItem.selected = false;
		fetchListBox.removeChild(selectedItem);
		fetchListBox.clearSelection();

		enableLyricsFilterUpDownButtons(false);
	}
	
	applyLyricsFilters();
}

function removeTrackFilter (data) {
	var fetchListBox = document.getElementById(data + "FiltersListBox");

	var selectedItem = fetchListBox.selectedItem;

	if (selectedItem) {
		selectedItem.selected = false;
		fetchListBox.removeChild(selectedItem);
		fetchListBox.clearSelection();

		var rowsnum = fetchListBox.getAttribute("rows");
		fetchListBox.setAttribute("rows", --rowsnum);
	}
	
	applyTrackFilters(data);
}

function addLyricsFilter (element) {
	var lyricsFiltersListBox = document.getElementById("lyricsFiltersListBox");
	
	var descr = document.createElement('label');
	descr.setAttribute('data', element.getAttribute("data"));
    descr.setAttribute('value', element.label);
    
	var row = document.createElement('listitem');
    row.appendChild(descr);
    
    lyricsFiltersListBox.appendChild(row);
    
    applyLyricsFilters();
}

function addCustomLyricsFilter () {
	var searchfor = document.getElementById("searchLyricsForTextBox").value;
	var replacewith = document.getElementById("replaceLyricsWithTextBox").value;
	
	document.getElementById("searchLyricsForTextBox").value = "";
	document.getElementById("replaceLyricsWithTextBox").value = "";
	
	showCustomLyricsRegExpField(false);
	
	var lyricsFiltersListBox = document.getElementById("lyricsFiltersListBox");

	var descr = document.createElement('label');
	descr.setAttribute('data', searchfor + customRegExpDelimiter + replacewith);
    descr.setAttribute('value', searchfor + customRegExpDelimiter + replacewith);
    
	var row = document.createElement('listitem');
    row.appendChild(descr);
    
    lyricsFiltersListBox.appendChild(row);
    
    applyLyricsFilters();
}

function addTrackFilter (element) {
	var data = lastTrackButtonClicked;
	var fetchListBox = document.getElementById(data + "FiltersListBox");
	
	var rowsnum = fetchListBox.getAttribute("rows");
	fetchListBox.setAttribute("rows", ++rowsnum);
	
	var descr = document.createElement('label');
	descr.setAttribute('data', element.getAttribute("data"));
    descr.setAttribute('value', element.label);
    
	var row = document.createElement('listitem');
    row.appendChild(descr);
    
    fetchListBox.appendChild(row);
    
    applyTrackFilters(data);
}

function applyLyricsFilters () {
	var fetchListBox = document.getElementById("lyricsFiltersListBox");
	var lyricsTextbox = document.getElementById("lyricsTextbox");
	var items = fetchListBox.getElementsByTagName("listitem");
	lyricsTextbox.value = globalOriginalLyrics;
	for (var i=0; i<items.length; i++) {
		var data = items[i].childNodes[0].getAttribute("data");
		switch (data) {
			case "htmltags":
				lyricsTextbox.value = lyricsFilterHtmlTags(lyricsTextbox.value);
				break;
				
			case "needlesslines":
				lyricsTextbox.value = lyricsFilterNeedlessLF(lyricsTextbox.value);
				break;
				
			case "needlesssyms":
				lyricsTextbox.value = lyricsFilterNeedlessSyms(lyricsTextbox.value);
				break;
				
			case "needlessspaces":
				lyricsTextbox.value = lyricsFilterManySpaces(lyricsTextbox.value);
				break;
				
			case "tolowercase":
				lyricsTextbox.value = lyricsFilterLowecase(lyricsTextbox.value);
				break;
				
			case "capitalizefirsts":
				lyricsTextbox.value = lyricsFilterCapitalizeFirsts(lyricsTextbox.value);
				break;
				
			default:
				if (data.indexOf(customRegExpDelimiter) == -1) {
					debugOutput("Unknown lyrics filter: " + data);
					break;
				}
				
				var searchfor = data.split(customRegExpDelimiter)[0];
				var replacewith = data.split(customRegExpDelimiter)[1];
				
				if (!searchfor || searchfor == "") break;
				
				lyricsTextbox.value = lyricsFilterAddCustom(lyricsTextbox.value, searchfor, replacewith);
				break;
		}
	}
}

function applyTrackFilters (data) {
	var fetchListBox = document.getElementById(data + "FiltersListBox");
	var trackInputTextbox = document.getElementById(data + "InputTextbox");
	var trackOutputTextbox = document.getElementById(data + "OutputTextbox")
	
	var items = fetchListBox.getElementsByTagName("listitem");
	trackOutputTextbox.value = trackInputTextbox.value;
	for (var i=0; i<items.length; i++) {
		switch (items[i].childNodes[0].getAttribute("data")) {
			case "tolowercaseall":
				trackOutputTextbox.value = trackFilterToLowerCaseAll(trackOutputTextbox.value);
				break;
				
			case "tolowercasefirst":
				trackOutputTextbox.value = trackFilterToLowerCaseFirst(trackOutputTextbox.value);
				break;
				
			case "touppercaseall":
				trackOutputTextbox.value = trackFilterToUpperCaseAll(trackOutputTextbox.value);
				break;
				
			case "touppercasefirst":
				trackOutputTextbox.value = trackFilterToUpperCaseFirst(trackOutputTextbox.value);
				break;
				
			case "removespaces":
				trackOutputTextbox.value = trackFilterRemoveSpaces(trackOutputTextbox.value);
				break;
		}
	}
}

function replaceCustomRegExps (data) {
	var filtered_trackName = document.getElementById("titleOutputTextbox").value;
	var filtered_artistName = document.getElementById("artistOutputTextbox").value;
	var filtered_albumName = document.getElementById("albumOutputTextbox").value;
	
	var trackName = document.getElementById("titleInputTextbox").value;
	var artistName = document.getElementById("artistInputTextbox").value;
	var albumName = document.getElementById("albumInputTextbox").value;

	data = data.replace("{title}", trackName);
	data = data.replace("{artist}", artistName);
	data = data.replace("{album}", albumName);
	
	data = data.replace("{f_title}", filtered_trackName);
	data = data.replace("{f_artist}", filtered_artistName);
	data = data.replace("{f_album}", filtered_albumName);
	
	data = data.replace("{a}", artistName.substr(0, 1).toLowerCase());
	data = data.replace("{A}", artistName.substr(0, 1).toUpperCase());
	
	data = data.replace("{f_a}", filtered_artistName.substr(0, 1).toLowerCase());
	data = data.replace("{f_A}", filtered_artistName.substr(0, 1).toUpperCase());
	
	return data;
}

function openUserDatabase () {
	var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(Components.interfaces.nsIFilePicker);
	fp.init(window, "Select a File", Components.interfaces.nsIFilePicker.modeOpen);
	fp.appendFilter("MLyrics Source Database", "*.ini");
	
	var res = fp.show();
	if (res == Components.interfaces.nsIFilePicker.returnOK) {
		var selectedFile = fp.file;
		loadDatabase(selectedFile.path);
		document.getElementById("sourceDBFilePath").value = selectedFile.path;
		document.getElementById("saveToLastDBCheckbox").checked = false;
	}
}

function loadDatabase (filePath) {
	var localFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
	localFile.initWithPath(filePath);
	
	var iniFact = Components.manager.getClassObjectByContractID("@mozilla.org/xpcom/ini-parser-factory;1", Components.interfaces.nsIINIParserFactory);
	var iniParser = iniFact.createINIParser(localFile);
	
	var sectEnum = iniParser.getSections();
	while (sectEnum && sectEnum.hasMore()) {
		var sectionName = sectEnum.getNext();
		
		var site = {};
		var keysEnum = iniParser.getKeys(sectionName);
		while (keysEnum && keysEnum.hasMore()) {
			var key = keysEnum.getNext();
			site[key] = iniParser.getString(sectionName, key);
		}
		
		sites[sectionName] = site;
		addSource(sectionName);
	}
	
	debugOutput("OK: loaded database: " + filePath);
}

function addSource (sourceName) {
	var sourcesListBox = document.getElementById("sourcesListBox");
	
	var ownChild = null;
	for (var i=0; i<sourcesListBox.childNodes.length; i++) {
		if (sourcesListBox.childNodes[i].tagName != "listitem") continue;
		
		var name = sourcesListBox.childNodes[i].childNodes[0].getAttribute("data");
		if (name == sourceName) { sourcesListBox.clearSelection(); return; };
	}
	
	var rowsnum = sourcesListBox.getAttribute("rows");
	sourcesListBox.setAttribute("rows", ++rowsnum);
	
	var descr = document.createElement('label');
	descr.setAttribute('data', sourceName);
    descr.setAttribute('value', sourceName);
    
	var row = document.createElement('listitem');
    row.appendChild(descr);
    
    sourcesListBox.appendChild(row);
}

function onSourceClick () {
	var sourcesListBox = document.getElementById("sourcesListBox");
	var selectedItem = sourcesListBox.selectedItem;
	
	var sourcesKeysListBox = document.getElementById("sourcesKeysListBox");
	while (sourcesKeysListBox.childNodes.length > 2) {
		var lastChild = sourcesKeysListBox.childNodes[sourcesKeysListBox.childNodes.length-1];
		if (lastChild.tagName == "listitem") sourcesKeysListBox.removeChild(lastChild);
	}
	sourcesKeysListBox.setAttribute("rows", 0);
	
	if (!selectedItem) {
		var name = "";
		
		var descriptionDescription = "";
		var descriptionValue = "";
		
		var fetchURLDescription = "";
		var fetchURLValue = "";
		
		var startMarkDescription = "";
		var startMarkValue = "";
		
		var endMarkDescription = "";
		var endMarkValue = "";
		
		var errorMarkDescription = "";
		var errorMarkValue = "";
		
		var lyricsFiltersDescription = "";
		var lyricsFiltersValue = "";
		
		var filtersArray = "";
		
		document.getElementById("fetchResultVbox").hidden = true;
		document.getElementById("fetchErrorVbox").hidden = true;
		document.getElementById("fetchResultExtractLyricsButton").disabled = true;
		
		document.getElementById("lyricsViewVbox").hidden = true;
		document.getElementById("customLyricsRegExpHbox").hidden = true;
		document.getElementById("lyricsFiltersVbox").hidden = true;
		
		document.getElementById("saveDescriptionVbox").hidden = true;
		document.getElementById("removeSourceButton").disabled = true;
		document.getElementById("saveSourceButton").disabled = true;
	}
	else {
		var name = selectedItem.childNodes[0].getAttribute("data");
		
		var descriptionDescription = document.getElementById("sourceDescriptionLabel").value;
		var descriptionValue = sites[name].Description;
		
		var fetchURLDescription = document.getElementById("fetchLabel").value;
		var fetchURLValue = sites[name].FetchURL;
		
		var startMarkDescription = document.getElementById("fetchResultStartMarkLabel").value;
		var startMarkValue = sites[name].StartMark;
		
		var endMarkDescription = document.getElementById("fetchResultEndMarkLabel").value;
		var endMarkValue = sites[name].EndMark;
		
		var errorMarkDescription = document.getElementById("fetchResultErrorMarkLabel").value;
		var errorMarkValue = sites[name].ErrorMark;
		
		var lyricsFiltersDescription = document.getElementById("lyricsFiltersCaption").label;
		var lyricsFiltersValue = sites[name].LyricsFilters.replace(/\t/g, " | ");
		
		var filtersArray = sites[name].LyricsFilters.split("\t");
		
		document.getElementById("removeSourceButton").disabled = false;
	}
	
	document.getElementById("sourceNameTextbox").value = name;
	
	addSourceKeysRow(descriptionDescription, descriptionValue);
	document.getElementById("sourceDescriptionTextbox").value = descriptionValue;
	
	addSourceKeysRow(fetchURLDescription, fetchURLValue);
	document.getElementById("fetchTextbox").value = fetchURLValue;
	
	addSourceKeysRow(startMarkDescription, startMarkValue);
	document.getElementById("fetchResultStartMarkTextbox").value = startMarkValue;
	
	addSourceKeysRow(endMarkDescription, endMarkValue);
	document.getElementById("fetchResultEndMarkTextbox").value = endMarkValue;
	
	addSourceKeysRow(errorMarkDescription, errorMarkValue);
	document.getElementById("fetchErrorTestMarkTextbox").value = errorMarkValue;
	
	addSourceKeysRow(lyricsFiltersDescription, lyricsFiltersValue);
	
	var lyricsFiltersListBox = document.getElementById("lyricsFiltersListBox");
	while (lyricsFiltersListBox.childNodes.length > 1) {
		var lastChild = lyricsFiltersListBox.childNodes[lyricsFiltersListBox.childNodes.length-1];
		if (lastChild.tagName == "listitem") lyricsFiltersListBox.removeChild(lastChild);
	}
	
	for (var i=0; i<filtersArray.length; i++) {
		var descr = document.createElement('label');
		descr.setAttribute('data', filtersArray[i]);
		descr.setAttribute('value', getLyricsFilterDescription(filtersArray[i]));
		var row = document.createElement('listitem');
		row.appendChild(descr);
		
		lyricsFiltersListBox.appendChild(row);
	}
	//applyLyricsFilters();
}

function addSourceKeysRow (sSetting, sValue) {
	if (!sSetting || sSetting == "") return;
	
	var sourcesKeysListBox = document.getElementById("sourcesKeysListBox");
	
	var rowsnum = sourcesKeysListBox.getAttribute("rows");
	sourcesKeysListBox.setAttribute("rows", ++rowsnum);
	
	var descrSetting = document.createElement('label');
	descrSetting.setAttribute('data', sSetting);
    descrSetting.setAttribute('value', sSetting);
    
    var descrValue = document.createElement('label');
	descrValue.setAttribute('data', sValue);
    descrValue.setAttribute('value', sValue);
    
	var row = document.createElement('listitem');
    row.appendChild(descrSetting);
    row.appendChild(descrValue);
    
    sourcesKeysListBox.appendChild(row);
}

function getLyricsFilterDescription (tag) {
	var lyricsFiltersPopup = document.getElementById("lyricsFiltersPopup");
	
	for (var i=0; i<lyricsFiltersPopup.childNodes.length; i++) {
		var data = lyricsFiltersPopup.childNodes[i].getAttribute("data");
		if (data == tag) {
			var description = lyricsFiltersPopup.childNodes[i].getAttribute("label");
			return description;
		}
	}
	
	return tag;
}

function saveSource () {
	var name = document.getElementById("sourceNameTextbox").value;
	var Description = document.getElementById("sourceDescriptionTextbox").value;
	var FetchURL = document.getElementById("fetchTextbox").value;
	var StartMark = document.getElementById("fetchResultStartMarkTextbox").value;
	var EndMark = document.getElementById("fetchResultEndMarkTextbox").value;
	var ErrorMark = document.getElementById("fetchErrorTestMarkTextbox").value;
	
	var LyricsFilters = "";
	var fetchListBox = document.getElementById("lyricsFiltersListBox");
	var items = fetchListBox.getElementsByTagName("listitem");
	for (var i=0; i<items.length; i++) {
		var data = items[i].childNodes[0].getAttribute("data");
		LyricsFilters += data + "\t";
	}
	if (items.length) LyricsFilters = LyricsFilters.substr(0, LyricsFilters.length-1);
	
	sites[name] = {};
	sites[name].Description = Description;
	sites[name].FetchURL = FetchURL;
	sites[name].StartMark = StartMark;
	sites[name].EndMark = EndMark;
	sites[name].ErrorMark = ErrorMark;
	sites[name].LyricsFilters = LyricsFilters;
	
	addSource(name);
	
	debugOutput("Successfully added source: " + name);
	
	addNotification("Database changes was not saved", "Save now", saveUserDatabase);
}

function removeSource () {
	var sourcesListBox = document.getElementById("sourcesListBox");
	var selectedItem = sourcesListBox.selectedItem;
	
	var data = selectedItem.childNodes[0].getAttribute("data");
	delete sites[data];
	
	sourcesListBox.removeChild(selectedItem);
	
	addNotification("Database changes was not saved", "Save now", saveUserDatabase);
}

function cancelEditing () {
	var sourcesListBox = document.getElementById("sourcesListBox");
	sourcesListBox.clearSelection();
}

function saveUserDatabase () {
	var filePath = document.getElementById("sourceDBFilePath").value;
	var saveToLastDatabase = document.getElementById("saveToLastDBCheckbox").checked;
	if (filePath == ""  || !saveToLastDatabase) {
		var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(Components.interfaces.nsIFilePicker);
		fp.defaultExtension = "ini";
		fp.defaultString = "MLyrics sites" + ".ini";
		fp.init(window, "Select a File", Components.interfaces.nsIFilePicker.modeSave);
		fp.appendFilter("MLyrics Source Database", "*.ini");
		
		var res = fp.show();
		if (res == Components.interfaces.nsIFilePicker.returnCancel) {
			debugOutput("Database selection canceled by user");
			addNotification("Database changes was not saved", "Save now", saveUserDatabase);
			return;
		}
		
		var localFile = fp.file;
	}
	else {
		var localFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
		localFile.initWithPath(filePath);
	
		if (!localFile.isWritable()) {
			debugOutput("Failed to write into " + filePath + ", file is not writable");
			addNotification("Database changes was not saved", "Save now", saveUserDatabase);
			return;
		}
	}
	
	document.getElementById("saveSourceButton").disabled = true;
	
	var ostream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
	ostream.init(localFile, -1, -1, ostream.DEFER_OPEN);

	var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
	converter.charset = "UTF-8";
	
	var sourcesListBox = document.getElementById("sourcesListBox");
	var data = "; MLyrics Sources Configuration v" + configVersion + "\n";
	for (var i=0; i<sourcesListBox.childNodes.length; i++) {
		if (sourcesListBox.childNodes[i].tagName != "listitem") continue;
		
		var name = sourcesListBox.childNodes[i].childNodes[0].getAttribute("data");
		data += "\n[" + name + "]\n";
		for (var prop in sites[name]) {
			data += prop + "=" + sites[name][prop] + "\n";
		}
	}

	var istream = converter.convertToInputStream(data);
	NetUtil.asyncCopy(istream, ostream,
		function (code) {
			if (code == 0) {
				debugOutput("OK: Database saved to: " + localFile.path);
				if (document.getElementById("sourceDBFilePath").value == "") {
					loadDatabase(localFile.path);
					document.getElementById("sourceDBFilePath").value = localFile.path;
				}
				document.getElementById("saveSourceButton").disabled = true;
			}
			else {
				debugOutput("ERROR: failed to save to: " + localFile.path);
				addNotification("Database changes was not saved", "Save now", saveUserDatabase);
				document.getElementById("saveSourceButton").disabled = false;
			}
		});
}

function onSiteNameInput () {
	document.getElementById("saveSourceButton").disabled = 
		(document.getElementById("sourceNameTextbox").value == "");
}

function addNotification(notificationText, buttonText, callback, notificationLevel) {
	var mTop = document.getElementById("notificationBox");
	
	if (!notificationLevel) notificationLevel = 6;
	

	var notificationButtons = 	[{
									accessKey: null,
									label: buttonText,
									callback: callback,
									popup: null
								}]

	mTop.removeAllNotifications(false);
	mTop.appendNotification(notificationText, notificationCounter++, "chrome://mlyrics/content/images/notif.png", notificationLevel, notificationButtons);
}

function debugOutput(message, needClear) {
	var textBox = document.getElementById("debugTextbox");

	if (needClear || debugOutputTries >= maxDebugOutputTries) {
		textBox.value = "";
		debugOutputTries = 0;
	}

	textBox.value += message + "\n";

	var ti = document.getAnonymousNodes(textBox)[0].childNodes[0];
    	ti.scrollTop = ti.scrollHeight;

	debugOutputTries++;
}

window.addEventListener("load",   onLoad, false);
window.addEventListener("unload", onUnLoad, false);

function getFile(filePath)
{
var file = Components.classes["@mozilla.org/file/local;1"]
			   .createInstance(Components.interfaces.nsILocalFile);

var fstream = Components.classes["@mozilla.org/network/file-input-stream;1"]
.createInstance(Components.interfaces.nsIFileInputStream);
var sstream = Components.classes["@mozilla.org/scriptableinputstream;1"]
.createInstance(Components.interfaces.nsIScriptableInputStream);

file.initWithPath(filePath);
if ( file.exists() == false ) {
debugOutput("File does not exist");
}

fstream.init(file, 0x01, 00004, null);
sstream.init(fstream);

var output = sstream.read(sstream.available());
sstream.close();
fstream.close();

return output;
}
    
var lyricsCodeData = getFile("/home/alex/seeklyrics_page.txt");
var lyricsErrorData = getFile("/home/alex/seeklyrics_error.txt");
