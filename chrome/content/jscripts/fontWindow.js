var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.mlyrics.");
prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);

var xulRuntime = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULRuntime);

function onload () {
	if (xulRuntime.OS == "Linux") {
		onsaveunload = onsaveaccept;
		onsaveBIU_ = onsaveBIU;
	}
	
	enableEdit(document.getElementById("applyRulesCheckbox").checked);
	
	if (prefs.getCharPref("backgroundType") == "C") {
		document.getElementById("CIRadiogroup").value = "C";
		document.getElementById("CIDeck").selectedIndex = 1;
	}
	else if (prefs.getCharPref("backgroundType") == "I") {
		document.getElementById("CIRadiogroup").value = "I";
		document.getElementById("CIDeck").selectedIndex = 0;
	}
	else {
		document.getElementById("CIRadiogroup").value = "O";
		document.getElementById("CIDeck").selectedIndex = 2;
	}
	
	document.getElementById("filePathTextbox").value = decodeURIComponent(prefs.getCharPref("backgroundImage"));
	
	document.getElementById("titleBoldButton").checked = prefs.getBoolPref("titleBold");
	document.getElementById("artistBoldButton").checked = prefs.getBoolPref("artistBold");
	document.getElementById("albumBoldButton").checked = prefs.getBoolPref("albumBold");
	document.getElementById("lyricsBoldButton").checked = prefs.getBoolPref("lyricsBold");
	document.getElementById("transLyricsBoldButton").checked = prefs.getBoolPref("transLyricsBold");
	
	document.getElementById("titleItalicButton").checked = prefs.getBoolPref("titleItalic");
	document.getElementById("artistItalicButton").checked = prefs.getBoolPref("artistItalic");
	document.getElementById("albumItalicButton").checked = prefs.getBoolPref("albumItalic");
	document.getElementById("lyricsItalicButton").checked = prefs.getBoolPref("lyricsItalic");
	document.getElementById("transLyricsItalicButton").checked = prefs.getBoolPref("transLyricsItalic");
	
	document.getElementById("titleUnderlinedButton").checked = prefs.getBoolPref("titleUnderlined");
	document.getElementById("artistUnderlinedButton").checked = prefs.getBoolPref("artistUnderlined");
	document.getElementById("albumUnderlinedButton").checked = prefs.getBoolPref("albumUnderlined");
	document.getElementById("lyricsUnderlinedButton").checked = prefs.getBoolPref("lyricsUnderlined");
	document.getElementById("transLyricsUnderlinedButton").checked = prefs.getBoolPref("transLyricsUnderlined");
}

function onsaveaccept () {
	onsaveBIU();
	
	if (xulRuntime.OS != "Linux") prefs.setCharPref("backgroundImage",  encodeURIComponent(document.getElementById("filePathTextbox").value));
	
	if (xulRuntime.OS != "Linux") prefs.setCharPref("backgroundType", document.getElementById("CIRadiogroup").value);
}

function onsaveBIU () {
	prefs.setBoolPref("titleBold", document.getElementById("titleBoldButton").checked);
	prefs.setBoolPref("artistBold", document.getElementById("artistBoldButton").checked);
	prefs.setBoolPref("albumBold", document.getElementById("albumBoldButton").checked);
	prefs.setBoolPref("lyricsBold", document.getElementById("lyricsBoldButton").checked);
	prefs.setBoolPref("transLyricsBold", document.getElementById("transLyricsBoldButton").checked);
	
	prefs.setBoolPref("titleItalic", document.getElementById("titleItalicButton").checked);
	prefs.setBoolPref("artistItalic", document.getElementById("artistItalicButton").checked);
	prefs.setBoolPref("albumItalic", document.getElementById("albumItalicButton").checked);
	prefs.setBoolPref("lyricsItalic", document.getElementById("lyricsItalicButton").checked);
	prefs.setBoolPref("transLyricsItalic", document.getElementById("transLyricsItalicButton").checked);
	
	prefs.setBoolPref("titleUnderlined", document.getElementById("titleUnderlinedButton").checked);
	prefs.setBoolPref("artistUnderlined", document.getElementById("artistUnderlinedButton").checked);
	prefs.setBoolPref("albumUnderlined", document.getElementById("albumUnderlinedButton").checked);
	prefs.setBoolPref("lyricsUnderlined", document.getElementById("lyricsUnderlinedButton").checked);
	prefs.setBoolPref("transLyricsUnderlined", document.getElementById("transLyricsUnderlinedButton").checked);
}

function enableEdit(enable) {
	document.getElementById("backgroundHbox").hidden = !enable;
	document.getElementById("titleHbox").hidden = !enable;
	document.getElementById("artistHbox").hidden = !enable;
	document.getElementById("albumHbox").hidden = !enable;
	document.getElementById("lyricsHbox").hidden = !enable;
	document.getElementById("transLyricsHbox").hidden = !enable;
}

function selectImagesFolder () {
	const nsIFilePicker = Components.interfaces.nsIFilePicker;

	var filePickerInstance = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
	filePickerInstance.appendFilters(nsIFilePicker.filterImages);
	filePickerInstance.init(window, "Select image", nsIFilePicker.modeOpen);

	var choise = filePickerInstance.show();
	if (choise == nsIFilePicker.returnOK) {
		var filePath = filePickerInstance.file.path;
		document.getElementById("filePathTextbox").value = filePath;
		if (xulRuntime.OS == "Linux") prefs.setCharPref("backgroundImage",  encodeURIComponent(filePath));
	}
}

function onCISelect (value) {
	if (value == "I") {
		document.getElementById("CIDeck").selectedIndex = 0;
		if (xulRuntime.OS == "Linux") prefs.setCharPref("backgroundType", "I");
	}
	else if (value == "C") {
		document.getElementById("CIDeck").selectedIndex = 1;
		if (xulRuntime.OS == "Linux") prefs.setCharPref("backgroundType", "C");
	}
	else {
		document.getElementById("CIDeck").selectedIndex = 2;
		if (xulRuntime.OS == "Linux") prefs.setCharPref("backgroundType", "O");
	}
}