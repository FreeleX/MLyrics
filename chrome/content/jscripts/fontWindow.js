var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.mlyrics.");
prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);

var xulRuntime = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULRuntime);

function onload () {

	document.getElementById("styleSheet").value = prefs.getCharPref("styleSheet")
	document.getElementById("styleSheet").setAttribute("onselect", "prefs.setCharPref('styleSheet', this.value)");
	
	var boolApplyCustomFont = prefs.getBoolPref("applyCustomFont");
	enableShowCustomRules(boolApplyCustomFont);
	document.getElementById("applyRulesCheckbox").checked = boolApplyCustomFont;
	document.getElementById("applyRulesCheckbox").setAttribute("oncommand", "enableEdit(this.checked)");
	
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
	document.getElementById("CIRadiogroup").setAttribute("oncommand", "onCISelect(this.value)");

	document.getElementById("filePathTextbox").value = decodeURIComponent(prefs.getCharPref("backgroundImage"));
	
	document.getElementById("showStaticPictureCheckbox").checked = prefs.getBoolPref("showStaticPicIf");
	document.getElementById("showStaticPictureCheckbox").setAttribute("oncommand", "prefs.setBoolPref('showStaticPicIf', this.checked)");

	document.getElementById("picturePosMenulist").value = prefs.getCharPref("BGImagePos")
	document.getElementById("picturePosMenulist").setAttribute("onselect", "prefs.setCharPref('BGImagePos', this.value)");

	document.getElementById("titleSize").value = prefs.getIntPref("titleSize");
	document.getElementById("artistSize").value = prefs.getIntPref("artistSize");
	document.getElementById("albumSize").value = prefs.getIntPref("albumSize");
	document.getElementById("lyricsSize").value = prefs.getIntPref("lyricsSize");
	document.getElementById("transLyricsSize").value = prefs.getIntPref("transLyricsSize");
	document.getElementById("titleSize").setAttribute("onchange", "prefs.setIntPref('titleSize', this.value)");
	document.getElementById("artistSize").setAttribute("onchange", "prefs.setIntPref('artistSize', this.value)");
	document.getElementById("albumSize").setAttribute("onchange", "prefs.setIntPref('albumSize', this.value)");
	document.getElementById("lyricsSize").setAttribute("onchange", "prefs.setIntPref('lyricsSize', this.value)");
	document.getElementById("transLyricsSize").setAttribute("onchange", "prefs.setIntPref('transLyricsSize', this.value)");
	
	document.getElementById("titleBoldButton").checked = prefs.getBoolPref("titleBold");
	document.getElementById("artistBoldButton").checked = prefs.getBoolPref("artistBold");
	document.getElementById("albumBoldButton").checked = prefs.getBoolPref("albumBold");
	document.getElementById("lyricsBoldButton").checked = prefs.getBoolPref("lyricsBold");
	document.getElementById("transLyricsBoldButton").checked = prefs.getBoolPref("transLyricsBold");
	document.getElementById("titleBoldButton").setAttribute("oncommand", "prefs.setBoolPref('titleBold', this.checked)");
	document.getElementById("artistBoldButton").setAttribute("oncommand", "prefs.setBoolPref('artistBold', this.checked)");
	document.getElementById("albumBoldButton").setAttribute("oncommand", "prefs.setBoolPref('albumBold', this.checked)");
	document.getElementById("lyricsBoldButton").setAttribute("oncommand", "prefs.setBoolPref('lyricsBold', this.checked)");
	document.getElementById("transLyricsBoldButton").setAttribute("oncommand", "prefs.setBoolPref('transLyricsBold', this.checked)");
	
	document.getElementById("titleItalicButton").checked = prefs.getBoolPref("titleItalic");
	document.getElementById("artistItalicButton").checked = prefs.getBoolPref("artistItalic");
	document.getElementById("albumItalicButton").checked = prefs.getBoolPref("albumItalic");
	document.getElementById("lyricsItalicButton").checked = prefs.getBoolPref("lyricsItalic");
	document.getElementById("transLyricsItalicButton").checked = prefs.getBoolPref("transLyricsItalic");
	document.getElementById("titleItalicButton").setAttribute("oncommand", "prefs.setBoolPref('titleItalic', this.checked)");
	document.getElementById("artistItalicButton").setAttribute("oncommand", "prefs.setBoolPref('artistItalic', this.checked)");
	document.getElementById("albumItalicButton").setAttribute("oncommand", "prefs.setBoolPref('albumItalic', this.checked)");
	document.getElementById("lyricsItalicButton").setAttribute("oncommand", "prefs.setBoolPref('lyricsItalic', this.checked)");
	document.getElementById("transLyricsItalicButton").setAttribute("oncommand", "prefs.setBoolPref('transLyricsItalic', this.checked)");
	
	document.getElementById("titleUnderlinedButton").checked = prefs.getBoolPref("titleUnderlined");
	document.getElementById("artistUnderlinedButton").checked = prefs.getBoolPref("artistUnderlined");
	document.getElementById("albumUnderlinedButton").checked = prefs.getBoolPref("albumUnderlined");
	document.getElementById("lyricsUnderlinedButton").checked = prefs.getBoolPref("lyricsUnderlined");
	document.getElementById("transLyricsUnderlinedButton").checked = prefs.getBoolPref("transLyricsUnderlined");
	document.getElementById("titleUnderlinedButton").setAttribute("oncommand", "prefs.setBoolPref('titleUnderlined', this.checked)");
	document.getElementById("artistUnderlinedButton").setAttribute("oncommand", "prefs.setBoolPref('artistUnderlined', this.checked)");
	document.getElementById("albumUnderlinedButton").setAttribute("oncommand", "prefs.setBoolPref('albumUnderlined', this.checked)");
	document.getElementById("lyricsUnderlinedButton").setAttribute("oncommand", "prefs.setBoolPref('lyricsUnderlined', this.checked)");
	document.getElementById("transLyricsUnderlinedButton").setAttribute("oncommand", "prefs.setBoolPref('transLyricsUnderlined', this.checked)");

	document.getElementById("titleAlign").value = prefs.getCharPref("titleAlign");
	document.getElementById("artistAlign").value = prefs.getCharPref("artistAlign");
	document.getElementById("albumAlign").value = prefs.getCharPref("albumAlign");
	document.getElementById("lyricsAlign").value = prefs.getCharPref("lyricsAlign");
	document.getElementById("transLyricsAlign").value = prefs.getCharPref("transLyricsAlign");
	document.getElementById("titleAlign").setAttribute("onselect", "prefs.setCharPref('titleAlign', this.value)");
	document.getElementById("artistAlign").setAttribute("onselect", "prefs.setCharPref('artistAlign', this.value)");
	document.getElementById("albumAlign").setAttribute("onselect", "prefs.setCharPref('albumAlign', this.value)");
	document.getElementById("lyricsAlign").setAttribute("onselect", "prefs.setCharPref('lyricsAlign', this.value)");
	document.getElementById("transLyricsAlign").setAttribute("onselect", "prefs.setCharPref('transLyricsAlign', this.value)");

	document.getElementById("titleColor").color = prefs.getCharPref("titleColor");
	document.getElementById("artistColor").color = prefs.getCharPref("artistColor");
	document.getElementById("albumColor").color = prefs.getCharPref("albumColor");
	document.getElementById("lyricsColor").color = prefs.getCharPref("lyricsColor");
	document.getElementById("transLyricsColor").color = prefs.getCharPref("transLyricsColor");
	document.getElementById("titleColor").setAttribute("onchange", "prefs.setCharPref('titleColor', this.color)");
	document.getElementById("artistColor").setAttribute("onchange", "prefs.setCharPref('artistColor', this.color)");
	document.getElementById("albumColor").setAttribute("onchange", "prefs.setCharPref('albumColor', this.color)");
	document.getElementById("lyricsColor").setAttribute("onchange", "prefs.setCharPref('lyricsColor', this.color)");
	document.getElementById("transLyricsColor").setAttribute("onchange", "prefs.setCharPref('transLyricsColor', this.color)");

	document.getElementById("titleBGColor").color = prefs.getCharPref("titleBGColor");
	document.getElementById("artistBGColor").color = prefs.getCharPref("artistBGColor");
	document.getElementById("albumBGColor").color = prefs.getCharPref("albumBGColor");
	document.getElementById("lyricsBGColor").color = prefs.getCharPref("lyricsBGColor");
	document.getElementById("transLyricsBGColor").color = prefs.getCharPref("transLyricsBGColor");
	document.getElementById("titleBGColor").setAttribute("onchange", "prefs.setCharPref('titleBGColor', this.color)");
	document.getElementById("artistBGColor").setAttribute("onchange", "prefs.setCharPref('artistBGColor', this.color)");
	document.getElementById("albumBGColor").setAttribute("onchange", "prefs.setCharPref('albumBGColor', this.color)");
	document.getElementById("lyricsBGColor").setAttribute("onchange", "prefs.setCharPref('lyricsBGColor', this.color)");
	document.getElementById("transLyricsBGColor").setAttribute("onchange", "prefs.setCharPref('transLyricsBGColor', this.color)");

	document.getElementById("titleOpacity").value = prefs.getIntPref("titleOpacity");
	document.getElementById("artistOpacity").value = prefs.getIntPref("artistOpacity");
	document.getElementById("albumOpacity").value = prefs.getIntPref("albumOpacity");
	document.getElementById("lyricsOpacity").value = prefs.getIntPref("lyricsOpacity");
	document.getElementById("transLyricsOpacity").value = prefs.getIntPref("transLyricsOpacity");
	document.getElementById("titleOpacity").setAttribute("onchange", "prefs.setIntPref('titleOpacity', this.value)");
	document.getElementById("artistOpacity").setAttribute("onchange", "prefs.setIntPref('artistOpacity', this.value)");
	document.getElementById("albumOpacity").setAttribute("onchange", "prefs.setIntPref('albumOpacity', this.value)");
	document.getElementById("lyricsOpacity").setAttribute("onchange", "prefs.setIntPref('lyricsOpacity', this.value)");
	document.getElementById("transLyricsOpacity").setAttribute("onchange", "prefs.setIntPref('transLyricsOpacity', this.value)");
}

function enableEdit(enable) {
	enableShowCustomRules(enable);
	prefs.setBoolPref("applyCustomFont", enable);
	alert(document.getElementById("mainVBox").getAttribute("width"));
}

function enableShowCustomRules(enable) {
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
		prefs.setCharPref("backgroundImage",  encodeURIComponent(filePath));
	}
}

function onCISelect (value) {
	if (value == "I") {
		document.getElementById("CIDeck").selectedIndex = 0;
		prefs.setCharPref("backgroundType", "I");
	}
	else if (value == "C") {
		document.getElementById("CIDeck").selectedIndex = 1;
		prefs.setCharPref("backgroundType", "C");
	}
	else {
		document.getElementById("CIDeck").selectedIndex = 2;
		prefs.setCharPref("backgroundType", "O");
	}
}
