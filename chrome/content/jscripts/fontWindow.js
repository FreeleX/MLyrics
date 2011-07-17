var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.mlyrics.");
prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);

var xulRuntime = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULRuntime);

var fullScreenStr = "";

function onload () {

	if (window.arguments) {
		if (window.arguments[0]) fullScreenStr = "fullScreen_";
	}

	document.getElementById("styleSheet").value = prefs.getCharPref(fullScreenStr + "styleSheet")
	document.getElementById("styleSheet").setAttribute("onselect", "prefs.setCharPref(fullScreenStr + 'styleSheet', this.value)");
	
	var boolApplyCustomFont = prefs.getBoolPref(fullScreenStr + "applyCustomFont");
	enableShowCustomRules(boolApplyCustomFont);
	document.getElementById("applyRulesCheckbox").checked = boolApplyCustomFont;
	document.getElementById("applyRulesCheckbox").setAttribute("oncommand", "enableEdit(this.checked)");
	
	if (prefs.getCharPref(fullScreenStr + "backgroundType") == "C") {
		document.getElementById("CIRadiogroup").value = "C";
		document.getElementById("CIDeck").selectedIndex = 1;
	}
	else if (prefs.getCharPref(fullScreenStr + "backgroundType") == "I") {
		document.getElementById("CIRadiogroup").value = "I";
		document.getElementById("CIDeck").selectedIndex = 0;
	}
	else {
		document.getElementById("CIRadiogroup").value = "O";
		document.getElementById("CIDeck").selectedIndex = 2;
	}
	document.getElementById("CIRadiogroup").setAttribute("oncommand", "onCISelect(this.value)");

	document.getElementById("backgroundColor").color = prefs.getCharPref(fullScreenStr + "backgroundColor");
	document.getElementById("backgroundColor").setAttribute("onchange", "prefs.setCharPref(fullScreenStr + 'backgroundColor', this.color)");

	document.getElementById("filePathTextbox").value = decodeURIComponent(prefs.getCharPref(fullScreenStr + "backgroundImage"));
	
	document.getElementById("showStaticPictureCheckbox").checked = prefs.getBoolPref(fullScreenStr + "showStaticPicIf");
	document.getElementById("showStaticPictureCheckbox").setAttribute("oncommand", "prefs.setBoolPref(fullScreenStr + 'showStaticPicIf', this.checked)");

	document.getElementById("picturePosMenulist").value = prefs.getCharPref(fullScreenStr + "BGImagePos")
	document.getElementById("picturePosMenulist").setAttribute("onselect", "prefs.setCharPref(fullScreenStr + 'BGImagePos', this.value)");

	document.getElementById("titleSize").value = prefs.getIntPref(fullScreenStr + "titleSize");
	document.getElementById("artistSize").value = prefs.getIntPref(fullScreenStr + "artistSize");
	document.getElementById("albumSize").value = prefs.getIntPref(fullScreenStr + "albumSize");
	document.getElementById("lyricsSize").value = prefs.getIntPref(fullScreenStr + "lyricsSize");
	document.getElementById("transLyricsSize").value = prefs.getIntPref(fullScreenStr + "transLyricsSize");
	document.getElementById("titleSize").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'titleSize', this.value)");
	document.getElementById("artistSize").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'artistSize', this.value)");
	document.getElementById("albumSize").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'albumSize', this.value)");
	document.getElementById("lyricsSize").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'lyricsSize', this.value)");
	document.getElementById("transLyricsSize").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'transLyricsSize', this.value)");
	
	document.getElementById("titleBoldButton").checked = prefs.getBoolPref(fullScreenStr + "titleBold");
	document.getElementById("artistBoldButton").checked = prefs.getBoolPref(fullScreenStr + "artistBold");
	document.getElementById("albumBoldButton").checked = prefs.getBoolPref(fullScreenStr + "albumBold");
	document.getElementById("lyricsBoldButton").checked = prefs.getBoolPref(fullScreenStr + "lyricsBold");
	document.getElementById("transLyricsBoldButton").checked = prefs.getBoolPref(fullScreenStr + "transLyricsBold");
	document.getElementById("titleBoldButton").setAttribute("oncommand", "prefs.setBoolPref(fullScreenStr + 'titleBold', this.checked)");
	document.getElementById("artistBoldButton").setAttribute("oncommand", "prefs.setBoolPref(fullScreenStr + 'artistBold', this.checked)");
	document.getElementById("albumBoldButton").setAttribute("oncommand", "prefs.setBoolPref(fullScreenStr + 'albumBold', this.checked)");
	document.getElementById("lyricsBoldButton").setAttribute("oncommand", "prefs.setBoolPref(fullScreenStr + 'lyricsBold', this.checked)");
	document.getElementById("transLyricsBoldButton").setAttribute("oncommand", "prefs.setBoolPref(fullScreenStr + 'transLyricsBold', this.checked)");
	
	document.getElementById("titleItalicButton").checked = prefs.getBoolPref(fullScreenStr + "titleItalic");
	document.getElementById("artistItalicButton").checked = prefs.getBoolPref(fullScreenStr + "artistItalic");
	document.getElementById("albumItalicButton").checked = prefs.getBoolPref(fullScreenStr + "albumItalic");
	document.getElementById("lyricsItalicButton").checked = prefs.getBoolPref(fullScreenStr + "lyricsItalic");
	document.getElementById("transLyricsItalicButton").checked = prefs.getBoolPref(fullScreenStr + "transLyricsItalic");
	document.getElementById("titleItalicButton").setAttribute("oncommand", "prefs.setBoolPref(fullScreenStr + 'titleItalic', this.checked)");
	document.getElementById("artistItalicButton").setAttribute("oncommand", "prefs.setBoolPref(fullScreenStr + 'artistItalic', this.checked)");
	document.getElementById("albumItalicButton").setAttribute("oncommand", "prefs.setBoolPref(fullScreenStr + 'albumItalic', this.checked)");
	document.getElementById("lyricsItalicButton").setAttribute("oncommand", "prefs.setBoolPref(fullScreenStr + 'lyricsItalic', this.checked)");
	document.getElementById("transLyricsItalicButton").setAttribute("oncommand", "prefs.setBoolPref(fullScreenStr + 'transLyricsItalic', this.checked)");
	
	document.getElementById("titleUnderlinedButton").checked = prefs.getBoolPref(fullScreenStr + "titleUnderlined");
	document.getElementById("artistUnderlinedButton").checked = prefs.getBoolPref(fullScreenStr + "artistUnderlined");
	document.getElementById("albumUnderlinedButton").checked = prefs.getBoolPref(fullScreenStr + "albumUnderlined");
	document.getElementById("lyricsUnderlinedButton").checked = prefs.getBoolPref(fullScreenStr + "lyricsUnderlined");
	document.getElementById("transLyricsUnderlinedButton").checked = prefs.getBoolPref(fullScreenStr + "transLyricsUnderlined");
	document.getElementById("titleUnderlinedButton").setAttribute("oncommand", "prefs.setBoolPref(fullScreenStr + 'titleUnderlined', this.checked)");
	document.getElementById("artistUnderlinedButton").setAttribute("oncommand", "prefs.setBoolPref(fullScreenStr + 'artistUnderlined', this.checked)");
	document.getElementById("albumUnderlinedButton").setAttribute("oncommand", "prefs.setBoolPref(fullScreenStr + 'albumUnderlined', this.checked)");
	document.getElementById("lyricsUnderlinedButton").setAttribute("oncommand", "prefs.setBoolPref(fullScreenStr + 'lyricsUnderlined', this.checked)");
	document.getElementById("transLyricsUnderlinedButton").setAttribute("oncommand", "prefs.setBoolPref(fullScreenStr + 'transLyricsUnderlined', this.checked)");

	document.getElementById("titleAlign").value = prefs.getCharPref(fullScreenStr + "titleAlign");
	document.getElementById("artistAlign").value = prefs.getCharPref(fullScreenStr + "artistAlign");
	document.getElementById("albumAlign").value = prefs.getCharPref(fullScreenStr + "albumAlign");
	document.getElementById("lyricsAlign").value = prefs.getCharPref(fullScreenStr + "lyricsAlign");
	document.getElementById("transLyricsAlign").value = prefs.getCharPref(fullScreenStr + "transLyricsAlign");
	document.getElementById("titleAlign").setAttribute("onselect", "prefs.setCharPref(fullScreenStr + 'titleAlign', this.value)");
	document.getElementById("artistAlign").setAttribute("onselect", "prefs.setCharPref(fullScreenStr + 'artistAlign', this.value)");
	document.getElementById("albumAlign").setAttribute("onselect", "prefs.setCharPref(fullScreenStr + 'albumAlign', this.value)");
	document.getElementById("lyricsAlign").setAttribute("onselect", "prefs.setCharPref(fullScreenStr + 'lyricsAlign', this.value)");
	document.getElementById("transLyricsAlign").setAttribute("onselect", "prefs.setCharPref(fullScreenStr + 'transLyricsAlign', this.value)");

	document.getElementById("titleColor").color = prefs.getCharPref(fullScreenStr + "titleColor");
	document.getElementById("artistColor").color = prefs.getCharPref(fullScreenStr + "artistColor");
	document.getElementById("albumColor").color = prefs.getCharPref(fullScreenStr + "albumColor");
	document.getElementById("lyricsColor").color = prefs.getCharPref(fullScreenStr + "lyricsColor");
	document.getElementById("transLyricsColor").color = prefs.getCharPref(fullScreenStr + "transLyricsColor");
	document.getElementById("titleColor").setAttribute("onchange", "prefs.setCharPref(fullScreenStr + 'titleColor', this.color)");
	document.getElementById("artistColor").setAttribute("onchange", "prefs.setCharPref(fullScreenStr + 'artistColor', this.color)");
	document.getElementById("albumColor").setAttribute("onchange", "prefs.setCharPref(fullScreenStr + 'albumColor', this.color)");
	document.getElementById("lyricsColor").setAttribute("onchange", "prefs.setCharPref(fullScreenStr + 'lyricsColor', this.color)");
	document.getElementById("transLyricsColor").setAttribute("onchange", "prefs.setCharPref(fullScreenStr + 'transLyricsColor', this.color)");

	document.getElementById("titleBGColorEnable").checked = prefs.getBoolPref(fullScreenStr + "titleBGColorEnable");
	document.getElementById("artistBGColorEnable").checked = prefs.getBoolPref(fullScreenStr + "artistBGColorEnable");
	document.getElementById("albumBGColorEnable").checked = prefs.getBoolPref(fullScreenStr + "albumBGColorEnable");
	document.getElementById("lyricsBGColorEnable").checked = prefs.getBoolPref(fullScreenStr + "lyricsBGColorEnable");
	document.getElementById("transLyricsBGColorEnable").checked = prefs.getBoolPref(fullScreenStr + "transLyricsBGColorEnable");
	document.getElementById("titleBGColorEnable").setAttribute("oncommand", "prefs.setBoolPref(fullScreenStr + 'titleBGColorEnable', this.checked);" +
										"document.getElementById('titleBGColor').disabled=!this.checked;" +
										"document.getElementById('titleOpacity').disabled=!this.checked;");															
	document.getElementById("artistBGColorEnable").setAttribute("oncommand", "prefs.setBoolPref(fullScreenStr + 'artistBGColorEnable', this.checked);" +
										"document.getElementById('artistBGColor').disabled=!this.checked;" +
										"document.getElementById('artistOpacity').disabled=!this.checked;");
	document.getElementById("albumBGColorEnable").setAttribute("oncommand", "prefs.setBoolPref(fullScreenStr + 'albumBGColorEnable', this.checked);" +
										"document.getElementById('albumBGColor').disabled=!this.checked;" +
										"document.getElementById('albumOpacity').disabled=!this.checked;");
	document.getElementById("lyricsBGColorEnable").setAttribute("oncommand", "prefs.setBoolPref(fullScreenStr + 'lyricsBGColorEnable', this.checked);" +
										"document.getElementById('lyricsBGColor').disabled=!this.checked;" +
										"document.getElementById('lyricsOpacity').disabled=!this.checked;");
	document.getElementById("transLyricsBGColorEnable").setAttribute("oncommand", "prefs.setBoolPref(fullScreenStr + 'transLyricsBGColorEnable', this.checked);" +
										"document.getElementById('transLyricsBGColor').disabled=!this.checked;" +
										"document.getElementById('transLyricsOpacity').disabled=!this.checked;");

	document.getElementById("titleBGColor").disabled = !prefs.getBoolPref(fullScreenStr + "titleBGColorEnable");
	document.getElementById("artistBGColor").disabled = !prefs.getBoolPref(fullScreenStr + "artistBGColorEnable");
	document.getElementById("albumBGColor").disabled = !prefs.getBoolPref(fullScreenStr + "albumBGColorEnable");
	document.getElementById("lyricsBGColor").disabled = !prefs.getBoolPref(fullScreenStr + "lyricsBGColorEnable");
	document.getElementById("transLyricsBGColor").disabled = !prefs.getBoolPref(fullScreenStr + "transLyricsBGColorEnable");
	
	document.getElementById("titleBGColor").color = prefs.getCharPref(fullScreenStr + "titleBGColor");
	document.getElementById("artistBGColor").color = prefs.getCharPref(fullScreenStr + "artistBGColor");
	document.getElementById("albumBGColor").color = prefs.getCharPref(fullScreenStr + "albumBGColor");
	document.getElementById("lyricsBGColor").color = prefs.getCharPref(fullScreenStr + "lyricsBGColor");
	document.getElementById("transLyricsBGColor").color = prefs.getCharPref(fullScreenStr + "transLyricsBGColor");
	document.getElementById("titleBGColor").setAttribute("onchange", "prefs.setCharPref(fullScreenStr + 'titleBGColor', this.color)");
	document.getElementById("artistBGColor").setAttribute("onchange", "prefs.setCharPref(fullScreenStr + 'artistBGColor', this.color)");
	document.getElementById("albumBGColor").setAttribute("onchange", "prefs.setCharPref(fullScreenStr + 'albumBGColor', this.color)");
	document.getElementById("lyricsBGColor").setAttribute("onchange", "prefs.setCharPref(fullScreenStr + 'lyricsBGColor', this.color)");
	document.getElementById("transLyricsBGColor").setAttribute("onchange", "prefs.setCharPref(fullScreenStr + 'transLyricsBGColor', this.color)");

	document.getElementById("titleOpacity").disabled = !prefs.getBoolPref(fullScreenStr + "titleBGColorEnable");
	document.getElementById("artistOpacity").disabled = !prefs.getBoolPref(fullScreenStr + "artistBGColorEnable");
	document.getElementById("albumOpacity").disabled = !prefs.getBoolPref(fullScreenStr + "albumBGColorEnable");
	document.getElementById("lyricsOpacity").disabled = !prefs.getBoolPref(fullScreenStr + "lyricsBGColorEnable");
	document.getElementById("transLyricsOpacity").disabled = !prefs.getBoolPref(fullScreenStr + "transLyricsBGColorEnable");

	document.getElementById("titleOpacity").value = prefs.getIntPref(fullScreenStr + "titleOpacity");
	document.getElementById("artistOpacity").value = prefs.getIntPref(fullScreenStr + "artistOpacity");
	document.getElementById("albumOpacity").value = prefs.getIntPref(fullScreenStr + "albumOpacity");
	document.getElementById("lyricsOpacity").value = prefs.getIntPref(fullScreenStr + "lyricsOpacity");
	document.getElementById("transLyricsOpacity").value = prefs.getIntPref(fullScreenStr + "transLyricsOpacity");
	document.getElementById("titleOpacity").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'titleOpacity', this.value)");
	document.getElementById("artistOpacity").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'artistOpacity', this.value)");
	document.getElementById("albumOpacity").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'albumOpacity', this.value)");
	document.getElementById("lyricsOpacity").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'lyricsOpacity', this.value)");
	document.getElementById("transLyricsOpacity").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'transLyricsOpacity', this.value)");
	
	document.getElementById("titleMarginTop").value = prefs.getIntPref(fullScreenStr + "titleMarginTop");
	document.getElementById("artistMarginTop").value = prefs.getIntPref(fullScreenStr + "artistMarginTop");
	document.getElementById("albumMarginTop").value = prefs.getIntPref(fullScreenStr + "albumMarginTop");
	document.getElementById("lyricsMarginTop").value = prefs.getIntPref(fullScreenStr + "lyricsMarginTop");
	document.getElementById("transLyricsMarginTop").value = prefs.getIntPref(fullScreenStr + "transLyricsMarginTop");
	document.getElementById("titleMarginTop").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'titleMarginTop', this.value)");
	document.getElementById("artistMarginTop").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'artistMarginTop', this.value)");
	document.getElementById("albumMarginTop").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'albumMarginTop', this.value)");
	document.getElementById("lyricsMarginTop").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'lyricsMarginTop', this.value)");
	document.getElementById("transLyricsMarginTop").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'transLyricsMarginTop', this.value)");
	
	document.getElementById("titleMarginBottom").value = prefs.getIntPref(fullScreenStr + "titleMarginBottom");
	document.getElementById("artistMarginBottom").value = prefs.getIntPref(fullScreenStr + "artistMarginBottom");
	document.getElementById("albumMarginBottom").value = prefs.getIntPref(fullScreenStr + "albumMarginBottom");
	document.getElementById("lyricsMarginBottom").value = prefs.getIntPref(fullScreenStr + "lyricsMarginBottom");
	document.getElementById("transLyricsMarginBottom").value = prefs.getIntPref(fullScreenStr + "transLyricsMarginBottom");
	document.getElementById("titleMarginBottom").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'titleMarginBottom', this.value)");
	document.getElementById("artistMarginBottom").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'artistMarginBottom', this.value)");
	document.getElementById("albumMarginBottom").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'albumMarginBottom', this.value)");
	document.getElementById("lyricsMarginBottom").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'lyricsMarginBottom', this.value)");
	document.getElementById("transLyricsMarginBottom").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'transLyricsMarginBottom', this.value)");
}

function enableEdit(enable) {
	enableShowCustomRules(enable);
	prefs.setBoolPref(fullScreenStr + "applyCustomFont", enable);
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
		prefs.setCharPref(fullScreenStr + "backgroundImage",  encodeURIComponent(filePath));
	}
}

function onCISelect (value) {
	if (value == "I") {
		document.getElementById("CIDeck").selectedIndex = 0;
		prefs.setCharPref(fullScreenStr + "backgroundType", "I");
	}
	else if (value == "C") {
		document.getElementById("CIDeck").selectedIndex = 1;
		prefs.setCharPref(fullScreenStr + "backgroundType", "C");
	}
	else {
		document.getElementById("CIDeck").selectedIndex = 2;
		prefs.setCharPref(fullScreenStr + "backgroundType", "O");
	}
}
