var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.mlyrics.");
prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);

var currentOffset = 0;

window.addEventListener("load", onfLoad, false); 

function onfLoad() {
	
	window.resizeTo(screen.width-41, screen.height-41);
	
	var tagBtn = document.getElementById("ML-vbox-multi-fetch-tag");
	refreshFromTag(tagBtn);
	tagBtn.setAttribute("oncommand", "refreshFromTag(this)");
	
	var trackDataObj = window.opener.document.getElementById("lyrics-editor").trackData;
	document.title += "  [ " + trackDataObj.artist + " - " + trackDataObj.album + " - " + trackDataObj.track + " ]";
	
	createNext(0);
}

function createNext (nIndex) {
	currentOffset = nIndex;
	
	var vboxTab = document.getElementById("ML-vbox-multi-fetch-Tab");
	var hbox = document.getElementById("ML-hbox-multi-fetch");
	
	var sources = prefs.getCharPref("fetchSourcesList").split("|");
	
	var laddress = prefs.getCharPref("laddress_" + sources[nIndex]);
	var newVbox = vboxTab.cloneNode(true);
	
	newVbox.id = "ML-vbox-multi-fetch-source" + nIndex;
	newVbox.childNodes[0].setAttribute("label", laddress);
	newVbox.childNodes[0].setAttribute("oncommand", "refetch(" + nIndex + ", this)");
	
	hbox.appendChild(newVbox);
	
	hbox.scrollLeft = hbox.scrollWidth;
	
	refetch(nIndex, 
		newVbox.childNodes[0],
		function () {
			if (currentOffset == nIndex) {
				nIndex++;
				if (nIndex < sources.length) createNext(nIndex);
			}
		}
	       );
}

function refetch (lindex, callbtn, cbFn) {
	
	var trackDataObj = window.opener.document.getElementById("lyrics-editor").trackData;
	
	callbtn.parentNode.childNodes[0].disabled = true;
	callbtn.parentNode.childNodes[1].disabled = true;
	document.getElementById("ML-progress-multi").hidden = false;
	
	setTimeout(function () {callbtn.disabled = false;}, 500);
	
	var lm_lyrics=mlyrics.fetch.fetchNext(  trackDataObj.artist, 
						trackDataObj.album, 
						trackDataObj.track, 
						
						function (lyrics, source, localIndex) {
							
							callbtn.parentNode.childNodes[0].disabled = false;
							callbtn.parentNode.childNodes[1].disabled = false;
							callbtn.parentNode.childNodes[1].value=lyrics;
							
							if (lyrics == "" && prefs.getBoolPref("multiHideEmpty")) {
								callbtn.parentNode.hidden = true;
							}
							
							document.getElementById("ML-progress-multi").hidden = true;
							
							if (cbFn) cbFn();
						},
						
						lindex,
						true,
						
						function (lsource, lprogress, localIndex) {
							if (typeof(localIndex) == "undefined") return;
						}
					);
}

function refreshFromTag (callbtn) {
	var trackDataObj = window.opener.document.getElementById("lyrics-editor").trackData;
	callbtn.parentNode.childNodes[1].value = trackDataObj.lyrics;
}

function accept(callbtn) {
	window.opener.document.getElementById("lyrics-editor").value = callbtn.parentNode.childNodes[1].value;
	
	if (callbtn.parentNode.id == "ML-vbox-multi-fetch-Tab") {
		window.opener.document.getElementById("refreshMenuItem").selectedIndex = 0;
		window.opener.document.getElementById("lyrics-edit-source").value = null;
	}
	else {
		var sources = prefs.getCharPref("fetchSourcesList").split("|");
		var sIndex = parseInt(callbtn.parentNode.id.substr(26), 10);
		
		window.opener.document.getElementById("refreshMenuItem").selectedIndex = sIndex + 2;
		window.opener.document.getElementById("lyrics-edit-source").value = prefs.getCharPref("laddress_" + sources[sIndex]);
	}
	
	window.close();
}

function onHideEmpty (checkbox) {
	var hbox = document.getElementById("ML-hbox-multi-fetch");
	for (var i=0; i<hbox.childNodes.length; i++) {
		if (hbox.childNodes[i].childNodes[1].value == "" && hbox.childNodes[i].id != "ML-vbox-multi-fetch-Tab")
			hbox.childNodes[i].hidden = checkbox.checked;
	}
}