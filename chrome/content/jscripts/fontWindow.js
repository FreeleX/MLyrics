var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.mlyrics.");
prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);

var xulRuntime = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULRuntime);

var fullScreenStr = "";

function onload () {
	
	if (window.arguments) {
		if (window.arguments[0]) fullScreenStr = "fullScreen_";
	}

	// Create fonts list
	rebuildFonts();

	var fontNode = document.getElementById("defaultFont");

	// Font menu cloning start
	var titleFontNode = fontNode.cloneNode(true);
	titleFontNode.id = "titleFont";
	titleFontNode.hidden = false;
	document.getElementById("titleFontEnable").parentNode.appendChild(titleFontNode);

	var artistFontNode = fontNode.cloneNode(true);
	artistFontNode.id = "artistFont";
	artistFontNode.hidden = false;
	document.getElementById("artistFontEnable").parentNode.appendChild(artistFontNode);

	var albumFontNode = fontNode.cloneNode(true);
	albumFontNode.id = "albumFont";
	albumFontNode.hidden = false;
	document.getElementById("albumFontEnable").parentNode.appendChild(albumFontNode);

	var lyricsFontNode = fontNode.cloneNode(true);
	lyricsFontNode.id = "lyricsFont";
	lyricsFontNode.hidden = false;
	document.getElementById("lyricsFontEnable").parentNode.appendChild(lyricsFontNode);

	var transLyricsFontNode = fontNode.cloneNode(true);
	transLyricsFontNode.id = "transLyricsFont";
	transLyricsFontNode.hidden = false;
	document.getElementById("transLyricsFontEnable").parentNode.appendChild(transLyricsFontNode);

	var lrcLyricsFontNode = fontNode.cloneNode(true);
	lrcLyricsFontNode.id = "lrcLyricsFont";
	lrcLyricsFontNode.hidden = false;
	document.getElementById("lrcLyricsFontEnable").parentNode.appendChild(lrcLyricsFontNode);
	// Font menu cloning end

	document.getElementById("styleSheet").value = prefs.getCharPref(fullScreenStr + "styleSheet")
	document.getElementById("styleSheet").setAttribute("onselect", "prefs.setCharPref(fullScreenStr + 'styleSheet', this.value)");

	// Background init start
	document.getElementById("backgroundColor").color = prefs.getCharPref(fullScreenStr + "backgroundColor");
	document.getElementById("backgroundColor").setAttribute("onchange", "prefs.setCharPref(fullScreenStr + 'backgroundColor', this.color)");

	document.getElementById("filePathTextbox").value = decodeURIComponent(prefs.getCharPref(fullScreenStr + "backgroundImage"));
	
	document.getElementById("showStaticPictureCheckbox").checked = prefs.getBoolPref(fullScreenStr + "showStaticPicIf");
	document.getElementById("showStaticPictureCheckbox").setAttribute("oncommand", "prefs.setBoolPref(fullScreenStr + 'showStaticPicIf', this.checked)");

	document.getElementById("picturePosMenulist").value = prefs.getCharPref(fullScreenStr + "BGImagePos")
	document.getElementById("picturePosMenulist").setAttribute("onselect", "prefs.setCharPref(fullScreenStr + 'BGImagePos', this.value)");

	document.getElementById("CIRadiogroup").setAttribute("oncommand", "onCISelect(this.value)");
	document.getElementById("CIRadiogroup").value = prefs.getCharPref(fullScreenStr + "backgroundType");
	onCISelect(prefs.getCharPref(fullScreenStr + "backgroundType"));
	// Background init end
	
	// Select All block begin 
	document.getElementById("titleSelectAll").addEventListener("CheckboxStateChange", function () {
		document.getElementById("titleStyleEnable").checked = this.checked;
		document.getElementById("titleAlignEnable").checked = this.checked;
		document.getElementById("titleColorEnable").checked = this.checked;
		document.getElementById("titleBGColorEnable").checked = this.checked;
		document.getElementById("titleSizeEnable").checked = this.checked;
		document.getElementById("titleMarginTopEnable").checked = this.checked;
		document.getElementById("titleMarginBottomEnable").checked = this.checked;
		document.getElementById("titleMarginLeftEnable").checked = this.checked;
		document.getElementById("titleMarginRightEnable").checked = this.checked;
		document.getElementById("titleFontEnable").checked = this.checked;
	}, false);
	
	document.getElementById("artistSelectAll").addEventListener("CheckboxStateChange", function () {
		document.getElementById("artistStyleEnable").checked = this.checked;
		document.getElementById("artistAlignEnable").checked = this.checked;
		document.getElementById("artistColorEnable").checked = this.checked;
		document.getElementById("artistBGColorEnable").checked = this.checked;
		document.getElementById("artistSizeEnable").checked = this.checked;
		document.getElementById("artistMarginTopEnable").checked = this.checked;
		document.getElementById("artistMarginBottomEnable").checked = this.checked;
		document.getElementById("artistMarginLeftEnable").checked = this.checked;
		document.getElementById("artistMarginRightEnable").checked = this.checked;
		document.getElementById("artistFontEnable").checked = this.checked;
	}, false);
	
	document.getElementById("albumSelectAll").addEventListener("CheckboxStateChange", function () {
		document.getElementById("albumStyleEnable").checked = this.checked;
		document.getElementById("albumAlignEnable").checked = this.checked;
		document.getElementById("albumColorEnable").checked = this.checked;
		document.getElementById("albumBGColorEnable").checked = this.checked;
		document.getElementById("albumSizeEnable").checked = this.checked;
		document.getElementById("albumMarginTopEnable").checked = this.checked;
		document.getElementById("albumMarginBottomEnable").checked = this.checked;
		document.getElementById("albumMarginLeftEnable").checked = this.checked;
		document.getElementById("albumMarginRightEnable").checked = this.checked;
		document.getElementById("albumFontEnable").checked = this.checked;
	}, false);
	
	document.getElementById("lyricsSelectAll").addEventListener("CheckboxStateChange", function () {
		document.getElementById("lyricsStyleEnable").checked = this.checked;
		document.getElementById("lyricsAlignEnable").checked = this.checked;
		document.getElementById("lyricsColorEnable").checked = this.checked;
		document.getElementById("lyricsBGColorEnable").checked = this.checked;
		document.getElementById("lyricsSizeEnable").checked = this.checked;
		document.getElementById("lyricsMarginTopEnable").checked = this.checked;
		document.getElementById("lyricsMarginBottomEnable").checked = this.checked;
		document.getElementById("lyricsMarginLeftEnable").checked = this.checked;
		document.getElementById("lyricsMarginRightEnable").checked = this.checked;
		document.getElementById("lyricsFontEnable").checked = this.checked;
	}, false);
	
	document.getElementById("transLyricsSelectAll").addEventListener("CheckboxStateChange", function () {
		document.getElementById("transLyricsStyleEnable").checked = this.checked;
		document.getElementById("transLyricsAlignEnable").checked = this.checked;
		document.getElementById("transLyricsColorEnable").checked = this.checked;
		document.getElementById("transLyricsBGColorEnable").checked = this.checked;
		document.getElementById("transLyricsSizeEnable").checked = this.checked;
		document.getElementById("transLyricsMarginTopEnable").checked = this.checked;
		document.getElementById("transLyricsMarginBottomEnable").checked = this.checked;
		document.getElementById("transLyricsMarginLeftEnable").checked = this.checked;
		document.getElementById("transLyricsMarginRightEnable").checked = this.checked;
		document.getElementById("transLyricsFontEnable").checked = this.checked;
	}, false);
	
	document.getElementById("lrcLyricsSelectAll").addEventListener("CheckboxStateChange", function () {
		document.getElementById("lrcLyricsStyleEnable").checked = this.checked;
		document.getElementById("lrcLyricsAlignEnable").checked = this.checked;
		document.getElementById("lrcLyricsColorEnable").checked = this.checked;
		document.getElementById("lrcLyricsBGColorEnable").checked = this.checked;
		document.getElementById("lrcLyricsSizeEnable").checked = this.checked;
		document.getElementById("lrcLyricsMarginTopEnable").checked = this.checked;
		document.getElementById("lrcLyricsMarginBottomEnable").checked = this.checked;
		document.getElementById("lrcLyricsMarginLeftEnable").checked = this.checked;
		document.getElementById("lrcLyricsMarginRightEnable").checked = this.checked;
		document.getElementById("lrcLyricsFontEnable").checked = this.checked;
	}, false);
	// Select All block end

	document.getElementById("titleSize").value = prefs.getIntPref(fullScreenStr + "titleSize");
	document.getElementById("artistSize").value = prefs.getIntPref(fullScreenStr + "artistSize");
	document.getElementById("albumSize").value = prefs.getIntPref(fullScreenStr + "albumSize");
	document.getElementById("lyricsSize").value = prefs.getIntPref(fullScreenStr + "lyricsSize");
	document.getElementById("transLyricsSize").value = prefs.getIntPref(fullScreenStr + "transLyricsSize");
	document.getElementById("lrcLyricsSize").value = prefs.getIntPref(fullScreenStr + "lrcLyricsSize");
	document.getElementById("titleSize").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'titleSize', this.value)");
	document.getElementById("artistSize").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'artistSize', this.value)");
	document.getElementById("albumSize").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'albumSize', this.value)");
	document.getElementById("lyricsSize").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'lyricsSize', this.value)");
	document.getElementById("transLyricsSize").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'transLyricsSize', this.value)");
	document.getElementById("lrcLyricsSize").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'lrcLyricsSize', this.value)");
	
	document.getElementById("titleBoldButton").checked = prefs.getBoolPref(fullScreenStr + "titleBold");
	document.getElementById("artistBoldButton").checked = prefs.getBoolPref(fullScreenStr + "artistBold");
	document.getElementById("albumBoldButton").checked = prefs.getBoolPref(fullScreenStr + "albumBold");
	document.getElementById("lyricsBoldButton").checked = prefs.getBoolPref(fullScreenStr + "lyricsBold");
	document.getElementById("transLyricsBoldButton").checked = prefs.getBoolPref(fullScreenStr + "transLyricsBold");
	document.getElementById("lrcLyricsBoldButton").checked = prefs.getBoolPref(fullScreenStr + "lrcLyricsBold");
	document.getElementById("titleBoldButton").setAttribute("oncommand", "prefs.setBoolPref(fullScreenStr + 'titleBold', this.checked)");
	document.getElementById("artistBoldButton").setAttribute("oncommand", "prefs.setBoolPref(fullScreenStr + 'artistBold', this.checked)");
	document.getElementById("albumBoldButton").setAttribute("oncommand", "prefs.setBoolPref(fullScreenStr + 'albumBold', this.checked)");
	document.getElementById("lyricsBoldButton").setAttribute("oncommand", "prefs.setBoolPref(fullScreenStr + 'lyricsBold', this.checked)");
	document.getElementById("transLyricsBoldButton").setAttribute("oncommand", "prefs.setBoolPref(fullScreenStr + 'transLyricsBold', this.checked)");
	document.getElementById("lrcLyricsBoldButton").setAttribute("oncommand", "prefs.setBoolPref(fullScreenStr + 'lrcLyricsBold', this.checked)");
	
	document.getElementById("titleItalicButton").checked = prefs.getBoolPref(fullScreenStr + "titleItalic");
	document.getElementById("artistItalicButton").checked = prefs.getBoolPref(fullScreenStr + "artistItalic");
	document.getElementById("albumItalicButton").checked = prefs.getBoolPref(fullScreenStr + "albumItalic");
	document.getElementById("lyricsItalicButton").checked = prefs.getBoolPref(fullScreenStr + "lyricsItalic");
	document.getElementById("transLyricsItalicButton").checked = prefs.getBoolPref(fullScreenStr + "transLyricsItalic");
	document.getElementById("lrcLyricsItalicButton").checked = prefs.getBoolPref(fullScreenStr + "lrcLyricsItalic");
	document.getElementById("titleItalicButton").setAttribute("oncommand", "prefs.setBoolPref(fullScreenStr + 'titleItalic', this.checked)");
	document.getElementById("artistItalicButton").setAttribute("oncommand", "prefs.setBoolPref(fullScreenStr + 'artistItalic', this.checked)");
	document.getElementById("albumItalicButton").setAttribute("oncommand", "prefs.setBoolPref(fullScreenStr + 'albumItalic', this.checked)");
	document.getElementById("lyricsItalicButton").setAttribute("oncommand", "prefs.setBoolPref(fullScreenStr + 'lyricsItalic', this.checked)");
	document.getElementById("transLyricsItalicButton").setAttribute("oncommand", "prefs.setBoolPref(fullScreenStr + 'transLyricsItalic', this.checked)");
	document.getElementById("lrcLyricsItalicButton").setAttribute("oncommand", "prefs.setBoolPref(fullScreenStr + 'lrcLyricsItalic', this.checked)");
	
	document.getElementById("titleUnderlinedButton").checked = prefs.getBoolPref(fullScreenStr + "titleUnderlined");
	document.getElementById("artistUnderlinedButton").checked = prefs.getBoolPref(fullScreenStr + "artistUnderlined");
	document.getElementById("albumUnderlinedButton").checked = prefs.getBoolPref(fullScreenStr + "albumUnderlined");
	document.getElementById("lyricsUnderlinedButton").checked = prefs.getBoolPref(fullScreenStr + "lyricsUnderlined");
	document.getElementById("transLyricsUnderlinedButton").checked = prefs.getBoolPref(fullScreenStr + "transLyricsUnderlined");
	document.getElementById("lrcLyricsUnderlinedButton").checked = prefs.getBoolPref(fullScreenStr + "lrcLyricsUnderlined");
	document.getElementById("titleUnderlinedButton").setAttribute("oncommand", "prefs.setBoolPref(fullScreenStr + 'titleUnderlined', this.checked)");
	document.getElementById("artistUnderlinedButton").setAttribute("oncommand", "prefs.setBoolPref(fullScreenStr + 'artistUnderlined', this.checked)");
	document.getElementById("albumUnderlinedButton").setAttribute("oncommand", "prefs.setBoolPref(fullScreenStr + 'albumUnderlined', this.checked)");
	document.getElementById("lyricsUnderlinedButton").setAttribute("oncommand", "prefs.setBoolPref(fullScreenStr + 'lyricsUnderlined', this.checked)");
	document.getElementById("transLyricsUnderlinedButton").setAttribute("oncommand", "prefs.setBoolPref(fullScreenStr + 'transLyricsUnderlined', this.checked)");
	document.getElementById("lrcLyricsUnderlinedButton").setAttribute("oncommand", "prefs.setBoolPref(fullScreenStr + 'lrcLyricsUnderlined', this.checked)");

	document.getElementById("titleAlign").value = prefs.getCharPref(fullScreenStr + "titleAlign");
	document.getElementById("artistAlign").value = prefs.getCharPref(fullScreenStr + "artistAlign");
	document.getElementById("albumAlign").value = prefs.getCharPref(fullScreenStr + "albumAlign");
	document.getElementById("lyricsAlign").value = prefs.getCharPref(fullScreenStr + "lyricsAlign");
	document.getElementById("transLyricsAlign").value = prefs.getCharPref(fullScreenStr + "transLyricsAlign");
	document.getElementById("lrcLyricsAlign").value = prefs.getCharPref(fullScreenStr + "lrcLyricsAlign");
	document.getElementById("titleAlign").setAttribute("onselect", "prefs.setCharPref(fullScreenStr + 'titleAlign', this.value)");
	document.getElementById("artistAlign").setAttribute("onselect", "prefs.setCharPref(fullScreenStr + 'artistAlign', this.value)");
	document.getElementById("albumAlign").setAttribute("onselect", "prefs.setCharPref(fullScreenStr + 'albumAlign', this.value)");
	document.getElementById("lyricsAlign").setAttribute("onselect", "prefs.setCharPref(fullScreenStr + 'lyricsAlign', this.value)");
	document.getElementById("transLyricsAlign").setAttribute("onselect", "prefs.setCharPref(fullScreenStr + 'transLyricsAlign', this.value)");
	document.getElementById("lrcLyricsAlign").setAttribute("onselect", "prefs.setCharPref(fullScreenStr + 'lrcLyricsAlign', this.value)");

	document.getElementById("titleColor").color = prefs.getCharPref(fullScreenStr + "titleColor");
	document.getElementById("artistColor").color = prefs.getCharPref(fullScreenStr + "artistColor");
	document.getElementById("albumColor").color = prefs.getCharPref(fullScreenStr + "albumColor");
	document.getElementById("lyricsColor").color = prefs.getCharPref(fullScreenStr + "lyricsColor");
	document.getElementById("transLyricsColor").color = prefs.getCharPref(fullScreenStr + "transLyricsColor");
	document.getElementById("lrcLyricsColor").color = prefs.getCharPref(fullScreenStr + "lrcLyricsColor");
	document.getElementById("titleColor").setAttribute("onchange", "prefs.setCharPref(fullScreenStr + 'titleColor', this.color)");
	document.getElementById("artistColor").setAttribute("onchange", "prefs.setCharPref(fullScreenStr + 'artistColor', this.color)");
	document.getElementById("albumColor").setAttribute("onchange", "prefs.setCharPref(fullScreenStr + 'albumColor', this.color)");
	document.getElementById("lyricsColor").setAttribute("onchange", "prefs.setCharPref(fullScreenStr + 'lyricsColor', this.color)");
	document.getElementById("transLyricsColor").setAttribute("onchange", "prefs.setCharPref(fullScreenStr + 'transLyricsColor', this.color)");
	document.getElementById("lrcLyricsColor").setAttribute("onchange", "prefs.setCharPref(fullScreenStr + 'lrcLyricsColor', this.color)");

	document.getElementById("titleBGColor").color = prefs.getCharPref(fullScreenStr + "titleBGColor");
	document.getElementById("artistBGColor").color = prefs.getCharPref(fullScreenStr + "artistBGColor");
	document.getElementById("albumBGColor").color = prefs.getCharPref(fullScreenStr + "albumBGColor");
	document.getElementById("lyricsBGColor").color = prefs.getCharPref(fullScreenStr + "lyricsBGColor");
	document.getElementById("transLyricsBGColor").color = prefs.getCharPref(fullScreenStr + "transLyricsBGColor");
	document.getElementById("lrcLyricsBGColor").color = prefs.getCharPref(fullScreenStr + "lrcLyricsBGColor");
	document.getElementById("titleBGColor").setAttribute("onchange", "prefs.setCharPref(fullScreenStr + 'titleBGColor', this.color)");
	document.getElementById("artistBGColor").setAttribute("onchange", "prefs.setCharPref(fullScreenStr + 'artistBGColor', this.color)");
	document.getElementById("albumBGColor").setAttribute("onchange", "prefs.setCharPref(fullScreenStr + 'albumBGColor', this.color)");
	document.getElementById("lyricsBGColor").setAttribute("onchange", "prefs.setCharPref(fullScreenStr + 'lyricsBGColor', this.color)");
	document.getElementById("transLyricsBGColor").setAttribute("onchange", "prefs.setCharPref(fullScreenStr + 'transLyricsBGColor', this.color)");
	document.getElementById("lrcLyricsBGColor").setAttribute("onchange", "prefs.setCharPref(fullScreenStr + 'lrcLyricsBGColor', this.color)");

	document.getElementById("titleOpacity").value = prefs.getIntPref(fullScreenStr + "titleOpacity");
	document.getElementById("artistOpacity").value = prefs.getIntPref(fullScreenStr + "artistOpacity");
	document.getElementById("albumOpacity").value = prefs.getIntPref(fullScreenStr + "albumOpacity");
	document.getElementById("lyricsOpacity").value = prefs.getIntPref(fullScreenStr + "lyricsOpacity");
	document.getElementById("transLyricsOpacity").value = prefs.getIntPref(fullScreenStr + "transLyricsOpacity");
	document.getElementById("lrcLyricsOpacity").value = prefs.getIntPref(fullScreenStr + "lrcLyricsOpacity");
	document.getElementById("titleOpacity").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'titleOpacity', this.value)");
	document.getElementById("artistOpacity").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'artistOpacity', this.value)");
	document.getElementById("albumOpacity").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'albumOpacity', this.value)");
	document.getElementById("lyricsOpacity").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'lyricsOpacity', this.value)");
	document.getElementById("transLyricsOpacity").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'transLyricsOpacity', this.value)");
	document.getElementById("lrcLyricsOpacity").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'lrcLyricsOpacity', this.value)");

	document.getElementById("titleMarginTop").value = prefs.getIntPref(fullScreenStr + "titleMarginTop");
	document.getElementById("artistMarginTop").value = prefs.getIntPref(fullScreenStr + "artistMarginTop");
	document.getElementById("albumMarginTop").value = prefs.getIntPref(fullScreenStr + "albumMarginTop");
	document.getElementById("lyricsMarginTop").value = prefs.getIntPref(fullScreenStr + "lyricsMarginTop");
	document.getElementById("transLyricsMarginTop").value = prefs.getIntPref(fullScreenStr + "transLyricsMarginTop");
	document.getElementById("lrcLyricsMarginTop").value = prefs.getIntPref(fullScreenStr + "lrcLyricsMarginTop");
	document.getElementById("titleMarginTop").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'titleMarginTop', this.value)");
	document.getElementById("artistMarginTop").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'artistMarginTop', this.value)");
	document.getElementById("albumMarginTop").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'albumMarginTop', this.value)");
	document.getElementById("lyricsMarginTop").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'lyricsMarginTop', this.value)");
	document.getElementById("transLyricsMarginTop").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'transLyricsMarginTop', this.value)");
	document.getElementById("lrcLyricsMarginTop").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'lrcLyricsMarginTop', this.value)");

	document.getElementById("titleMarginBottom").value = prefs.getIntPref(fullScreenStr + "titleMarginBottom");
	document.getElementById("artistMarginBottom").value = prefs.getIntPref(fullScreenStr + "artistMarginBottom");
	document.getElementById("albumMarginBottom").value = prefs.getIntPref(fullScreenStr + "albumMarginBottom");
	document.getElementById("lyricsMarginBottom").value = prefs.getIntPref(fullScreenStr + "lyricsMarginBottom");
	document.getElementById("transLyricsMarginBottom").value = prefs.getIntPref(fullScreenStr + "transLyricsMarginBottom");
	document.getElementById("lrcLyricsMarginBottom").value = prefs.getIntPref(fullScreenStr + "lrcLyricsMarginBottom");
	document.getElementById("titleMarginBottom").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'titleMarginBottom', this.value)");
	document.getElementById("artistMarginBottom").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'artistMarginBottom', this.value)");
	document.getElementById("albumMarginBottom").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'albumMarginBottom', this.value)");
	document.getElementById("lyricsMarginBottom").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'lyricsMarginBottom', this.value)");
	document.getElementById("transLyricsMarginBottom").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'transLyricsMarginBottom', this.value)");
	document.getElementById("lrcLyricsMarginBottom").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'lrcLyricsMarginBottom', this.value)");

	document.getElementById("titleMarginLeft").value = prefs.getIntPref(fullScreenStr + "titleMarginLeft");
	document.getElementById("artistMarginLeft").value = prefs.getIntPref(fullScreenStr + "artistMarginLeft");
	document.getElementById("albumMarginLeft").value = prefs.getIntPref(fullScreenStr + "albumMarginLeft");
	document.getElementById("lyricsMarginLeft").value = prefs.getIntPref(fullScreenStr + "lyricsMarginLeft");
	document.getElementById("transLyricsMarginLeft").value = prefs.getIntPref(fullScreenStr + "transLyricsMarginLeft");
	document.getElementById("lrcLyricsMarginLeft").value = prefs.getIntPref(fullScreenStr + "lrcLyricsMarginLeft");
	document.getElementById("titleMarginLeft").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'titleMarginLeft', this.value)");
	document.getElementById("artistMarginLeft").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'artistMarginLeft', this.value)");
	document.getElementById("albumMarginLeft").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'albumMarginLeft', this.value)");
	document.getElementById("lyricsMarginLeft").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'lyricsMarginLeft', this.value)");
	document.getElementById("transLyricsMarginLeft").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'transLyricsMarginLeft', this.value)");
	document.getElementById("lrcLyricsMarginLeft").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'lrcLyricsMarginLeft', this.value)");

	document.getElementById("titleMarginRight").value = prefs.getIntPref(fullScreenStr + "titleMarginRight");
	document.getElementById("artistMarginRight").value = prefs.getIntPref(fullScreenStr + "artistMarginRight");
	document.getElementById("albumMarginRight").value = prefs.getIntPref(fullScreenStr + "albumMarginRight");
	document.getElementById("lyricsMarginRight").value = prefs.getIntPref(fullScreenStr + "lyricsMarginRight");
	document.getElementById("transLyricsMarginRight").value = prefs.getIntPref(fullScreenStr + "transLyricsMarginRight");
	document.getElementById("lrcLyricsMarginRight").value = prefs.getIntPref(fullScreenStr + "lrcLyricsMarginRight");
	document.getElementById("titleMarginRight").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'titleMarginRight', this.value)");
	document.getElementById("artistMarginRight").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'artistMarginRight', this.value)");
	document.getElementById("albumMarginRight").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'albumMarginRight', this.value)");
	document.getElementById("lyricsMarginRight").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'lyricsMarginRight', this.value)");
	document.getElementById("transLyricsMarginRight").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'transLyricsMarginRight', this.value)");
	document.getElementById("lrcLyricsMarginRight").setAttribute("onchange", "prefs.setIntPref(fullScreenStr + 'lrcLyricsMarginRight', this.value)");

	document.getElementById("titleFont").value = prefs.getCharPref(fullScreenStr + "titleFont");
	document.getElementById("artistFont").value = prefs.getCharPref(fullScreenStr + "artistFont");
	document.getElementById("albumFont").value = prefs.getCharPref(fullScreenStr + "albumFont");
	document.getElementById("lyricsFont").value = prefs.getCharPref(fullScreenStr + "lyricsFont");
	document.getElementById("transLyricsFont").value = prefs.getCharPref(fullScreenStr + "transLyricsFont");
	document.getElementById("lrcLyricsFont").value = prefs.getCharPref(fullScreenStr + "lrcLyricsFont");
	document.getElementById("titleFont").setAttribute("onselect", "prefs.setCharPref(fullScreenStr + 'titleFont', this.value)");
	document.getElementById("artistFont").setAttribute("onselect", "prefs.setCharPref(fullScreenStr + 'artistFont', this.value)");
	document.getElementById("albumFont").setAttribute("onselect", "prefs.setCharPref(fullScreenStr + 'albumFont', this.value)");
	document.getElementById("lyricsFont").setAttribute("onselect", "prefs.setCharPref(fullScreenStr + 'lyricsFont', this.value)");
	document.getElementById("transLyricsFont").setAttribute("onselect", "prefs.setCharPref(fullScreenStr + 'transLyricsFont', this.value)");
	document.getElementById("lrcLyricsFont").setAttribute("onselect", "prefs.setCharPref(fullScreenStr + 'lrcLyricsFont', this.value)");

	// Style enable init start
	document.getElementById("titleStyleEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("titleBoldButton").disabled = !this.checked;
		document.getElementById("titleItalicButton").disabled = !this.checked;
		document.getElementById("titleUnderlinedButton").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'titleStyleEnable', this.checked);
	}, false);
	document.getElementById("titleStyleEnable").checked = prefs.getBoolPref(fullScreenStr + 'titleStyleEnable');

	document.getElementById("artistStyleEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("artistBoldButton").disabled = !this.checked;
		document.getElementById("artistItalicButton").disabled = !this.checked;
		document.getElementById("artistUnderlinedButton").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'artistStyleEnable', this.checked);
	}, false);
	document.getElementById("artistStyleEnable").checked = prefs.getBoolPref(fullScreenStr + 'artistStyleEnable');

	document.getElementById("albumStyleEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("albumBoldButton").disabled = !this.checked;
		document.getElementById("albumItalicButton").disabled = !this.checked;
		document.getElementById("albumUnderlinedButton").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'albumStyleEnable', this.checked);
	}, false);
	document.getElementById("albumStyleEnable").checked = prefs.getBoolPref(fullScreenStr + 'albumStyleEnable');

	document.getElementById("lyricsStyleEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("lyricsBoldButton").disabled = !this.checked;
		document.getElementById("lyricsItalicButton").disabled = !this.checked;
		document.getElementById("lyricsUnderlinedButton").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'lyricsStyleEnable', this.checked);
	}, false);
	document.getElementById("lyricsStyleEnable").checked = prefs.getBoolPref(fullScreenStr + 'lyricsStyleEnable');

	document.getElementById("transLyricsStyleEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("transLyricsBoldButton").disabled = !this.checked;
		document.getElementById("transLyricsItalicButton").disabled = !this.checked;
		document.getElementById("transLyricsUnderlinedButton").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'transLyricsStyleEnable', this.checked);
	}, false);
	document.getElementById("transLyricsStyleEnable").checked = prefs.getBoolPref(fullScreenStr + 'transLyricsStyleEnable');

	document.getElementById("lrcLyricsStyleEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("lrcLyricsBoldButton").disabled = !this.checked;
		document.getElementById("lrcLyricsItalicButton").disabled = !this.checked;
		document.getElementById("lrcLyricsUnderlinedButton").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'lrcLyricsStyleEnable', this.checked);
	}, false);
	document.getElementById("lrcLyricsStyleEnable").checked = prefs.getBoolPref(fullScreenStr + 'lrcLyricsStyleEnable');
	// Style enable init end

	// Align enable init start
	document.getElementById("titleAlignEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("titleAlign").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'titleAlignEnable', this.checked);
	}, false);
	document.getElementById("titleAlignEnable").checked = prefs.getBoolPref(fullScreenStr + 'titleAlignEnable');

	document.getElementById("artistAlignEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("artistAlign").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'artistAlignEnable', this.checked);
	}, false);
	document.getElementById("artistAlignEnable").checked = prefs.getBoolPref(fullScreenStr + 'artistAlignEnable');

	document.getElementById("albumAlignEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("albumAlign").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'albumAlignEnable', this.checked);
	}, false);
	document.getElementById("albumAlignEnable").checked = prefs.getBoolPref(fullScreenStr + 'albumAlignEnable');

	document.getElementById("lyricsAlignEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("lyricsAlign").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'lyricsAlignEnable', this.checked);
	}, false);
	document.getElementById("lyricsAlignEnable").checked = prefs.getBoolPref(fullScreenStr + 'lyricsAlignEnable');

	document.getElementById("transLyricsAlignEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("transLyricsAlign").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'transLyricsAlignEnable', this.checked);
	}, false);
	document.getElementById("transLyricsAlignEnable").checked = prefs.getBoolPref(fullScreenStr + 'transLyricsAlignEnable');

	document.getElementById("lrcLyricsAlignEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("lrcLyricsAlign").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'lrcLyricsAlignEnable', this.checked);
	}, false);
	document.getElementById("lrcLyricsAlignEnable").checked = prefs.getBoolPref(fullScreenStr + 'lrcLyricsAlignEnable');
	// Align enable init end

	// Color enable init start
	document.getElementById("titleColorEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("titleColor").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'titleColorEnable', this.checked);
	}, false);
	document.getElementById("titleColorEnable").checked = prefs.getBoolPref(fullScreenStr + 'titleColorEnable');

	document.getElementById("artistColorEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("artistColor").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'artistColorEnable', this.checked);
	}, false);
	document.getElementById("artistColorEnable").checked = prefs.getBoolPref(fullScreenStr + 'artistColorEnable');

	document.getElementById("albumColorEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("albumColor").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'albumColorEnable', this.checked);
	}, false);
	document.getElementById("albumColorEnable").checked = prefs.getBoolPref(fullScreenStr + 'albumColorEnable');

	document.getElementById("lyricsColorEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("lyricsColor").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'lyricsColorEnable', this.checked);
	}, false);
	document.getElementById("lyricsColorEnable").checked = prefs.getBoolPref(fullScreenStr + 'lyricsColorEnable');

	document.getElementById("transLyricsColorEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("transLyricsColor").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'transLyricsColorEnable', this.checked);
	}, false);
	document.getElementById("transLyricsColorEnable").checked = prefs.getBoolPref(fullScreenStr + 'transLyricsColorEnable');

	document.getElementById("lrcLyricsColorEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("lrcLyricsColor").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'lrcLyricsColorEnable', this.checked);
	}, false);
	document.getElementById("lrcLyricsColorEnable").checked = prefs.getBoolPref(fullScreenStr + 'lrcLyricsColorEnable');
	// Color enable init end

	// BGColor enable init start
	document.getElementById("titleBGColorEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("titleBGColor").disabled = !this.checked;
		document.getElementById("titleOpacity").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'titleBGColorEnable', this.checked);
	}, false);
	document.getElementById("titleBGColorEnable").checked = prefs.getBoolPref(fullScreenStr + 'titleBGColorEnable');

	document.getElementById("artistBGColorEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("artistBGColor").disabled = !this.checked;
		document.getElementById("artistOpacity").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'artistBGColorEnable', this.checked);
	}, false);
	document.getElementById("artistBGColorEnable").checked = prefs.getBoolPref(fullScreenStr + 'artistBGColorEnable');

	document.getElementById("albumBGColorEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("albumBGColor").disabled = !this.checked;
		document.getElementById("albumOpacity").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'albumBGColorEnable', this.checked);
	}, false);
	document.getElementById("albumBGColorEnable").checked = prefs.getBoolPref(fullScreenStr + 'albumBGColorEnable');

	document.getElementById("lyricsBGColorEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("lyricsBGColor").disabled = !this.checked;
		document.getElementById("lyricsOpacity").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'lyricsBGColorEnable', this.checked);
	}, false);
	document.getElementById("lyricsBGColorEnable").checked = prefs.getBoolPref(fullScreenStr + 'lyricsBGColorEnable');

	document.getElementById("transLyricsBGColorEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("transLyricsBGColor").disabled = !this.checked;
		document.getElementById("transLyricsOpacity").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'transLyricsBGColorEnable', this.checked);
	}, false);
	document.getElementById("transLyricsBGColorEnable").checked = prefs.getBoolPref(fullScreenStr + 'transLyricsBGColorEnable');

	document.getElementById("lrcLyricsBGColorEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("lrcLyricsBGColor").disabled = !this.checked;
		document.getElementById("lrcLyricsOpacity").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'lrcLyricsBGColorEnable', this.checked);
	}, false);
	document.getElementById("lrcLyricsBGColorEnable").checked = prefs.getBoolPref(fullScreenStr + 'lrcLyricsBGColorEnable');
	// BGColor enable init end

	// Size enable init start
	document.getElementById("titleSizeEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("titleSize").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'titleSizeEnable', this.checked);
	}, false);
	document.getElementById("titleSizeEnable").checked = prefs.getBoolPref(fullScreenStr + 'titleSizeEnable');

	document.getElementById("artistSizeEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("artistSize").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'artistSizeEnable', this.checked);
	}, false);
	document.getElementById("artistSizeEnable").checked = prefs.getBoolPref(fullScreenStr + 'artistSizeEnable');

	document.getElementById("albumSizeEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("albumSize").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'albumSizeEnable', this.checked);
	}, false);
	document.getElementById("albumSizeEnable").checked = prefs.getBoolPref(fullScreenStr + 'albumSizeEnable');

	document.getElementById("lyricsSizeEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("lyricsSize").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'lyricsSizeEnable', this.checked);
	}, false);
	document.getElementById("lyricsSizeEnable").checked = prefs.getBoolPref(fullScreenStr + 'lyricsSizeEnable');

	document.getElementById("transLyricsSizeEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("transLyricsSize").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'transLyricsSizeEnable', this.checked);
	}, false);
	document.getElementById("transLyricsSizeEnable").checked = prefs.getBoolPref(fullScreenStr + 'transLyricsSizeEnable');

	document.getElementById("lrcLyricsSizeEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("lrcLyricsSize").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'lrcLyricsSizeEnable', this.checked);
	}, false);
	document.getElementById("lrcLyricsSizeEnable").checked = prefs.getBoolPref(fullScreenStr + 'lrcLyricsSizeEnable');
	// Size enable init end

	// MarginTop enable init start
	document.getElementById("titleMarginTopEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("titleMarginTop").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'titleMarginTopEnable', this.checked);
	}, false);
	document.getElementById("titleMarginTopEnable").checked = prefs.getBoolPref(fullScreenStr + 'titleMarginTopEnable');

	document.getElementById("artistMarginTopEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("artistMarginTop").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'artistMarginTopEnable', this.checked);
	}, false);
	document.getElementById("artistMarginTopEnable").checked = prefs.getBoolPref(fullScreenStr + 'artistMarginTopEnable');

	document.getElementById("albumMarginTopEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("albumMarginTop").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'albumMarginTopEnable', this.checked);
	}, false);
	document.getElementById("albumMarginTopEnable").checked = prefs.getBoolPref(fullScreenStr + 'albumMarginTopEnable');

	document.getElementById("lyricsMarginTopEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("lyricsMarginTop").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'lyricsMarginTopEnable', this.checked);
	}, false);
	document.getElementById("lyricsMarginTopEnable").checked = prefs.getBoolPref(fullScreenStr + 'lyricsMarginTopEnable');

	document.getElementById("transLyricsMarginTopEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("transLyricsMarginTop").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'transLyricsMarginTopEnable', this.checked);
	}, false);
	document.getElementById("transLyricsMarginTopEnable").checked = prefs.getBoolPref(fullScreenStr + 'transLyricsMarginTopEnable');

	document.getElementById("lrcLyricsMarginTopEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("lrcLyricsMarginTop").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'lrcLyricsMarginTopEnable', this.checked);
	}, false);
	document.getElementById("lrcLyricsMarginTopEnable").checked = prefs.getBoolPref(fullScreenStr + 'lrcLyricsMarginTopEnable');
	// MarginTop enable init end

	// MarginBottom enable init start
	document.getElementById("titleMarginBottomEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("titleMarginBottom").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'titleMarginBottomEnable', this.checked);
	}, false);
	document.getElementById("titleMarginBottomEnable").checked = prefs.getBoolPref(fullScreenStr + 'titleMarginBottomEnable');

	document.getElementById("artistMarginBottomEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("artistMarginBottom").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'artistMarginBottomEnable', this.checked);
	}, false);
	document.getElementById("artistMarginBottomEnable").checked = prefs.getBoolPref(fullScreenStr + 'artistMarginBottomEnable');

	document.getElementById("albumMarginBottomEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("albumMarginBottom").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'albumMarginBottomEnable', this.checked);
	}, false);
	document.getElementById("albumMarginBottomEnable").checked = prefs.getBoolPref(fullScreenStr + 'albumMarginBottomEnable');

	document.getElementById("lyricsMarginBottomEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("lyricsMarginBottom").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'lyricsMarginBottomEnable', this.checked);
	}, false);
	document.getElementById("lyricsMarginBottomEnable").checked = prefs.getBoolPref(fullScreenStr + 'lyricsMarginBottomEnable');

	document.getElementById("transLyricsMarginBottomEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("transLyricsMarginBottom").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'transLyricsMarginBottomEnable', this.checked);
	}, false);
	document.getElementById("transLyricsMarginBottomEnable").checked = prefs.getBoolPref(fullScreenStr + 'transLyricsMarginBottomEnable');

	document.getElementById("lrcLyricsMarginBottomEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("lrcLyricsMarginBottom").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'lrcLyricsMarginBottomEnable', this.checked);
	}, false);
	document.getElementById("lrcLyricsMarginBottomEnable").checked = prefs.getBoolPref(fullScreenStr + 'lrcLyricsMarginBottomEnable');
	// MarginBottom enable init end

	// MarginLeft enable init start
	document.getElementById("titleMarginLeftEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("titleMarginLeft").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'titleMarginLeftEnable', this.checked);
	}, false);
	document.getElementById("titleMarginLeftEnable").checked = prefs.getBoolPref(fullScreenStr + 'titleMarginLeftEnable');

	document.getElementById("artistMarginLeftEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("artistMarginLeft").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'artistMarginLeftEnable', this.checked);
	}, false);
	document.getElementById("artistMarginLeftEnable").checked = prefs.getBoolPref(fullScreenStr + 'artistMarginLeftEnable');

	document.getElementById("albumMarginLeftEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("albumMarginLeft").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'albumMarginLeftEnable', this.checked);
	}, false);
	document.getElementById("albumMarginLeftEnable").checked = prefs.getBoolPref(fullScreenStr + 'albumMarginLeftEnable');

	document.getElementById("lyricsMarginLeftEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("lyricsMarginLeft").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'lyricsMarginLeftEnable', this.checked);
	}, false);
	document.getElementById("lyricsMarginLeftEnable").checked = prefs.getBoolPref(fullScreenStr + 'lyricsMarginLeftEnable');

	document.getElementById("transLyricsMarginLeftEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("transLyricsMarginLeft").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'transLyricsMarginLeftEnable', this.checked);
	}, false);
	document.getElementById("transLyricsMarginLeftEnable").checked = prefs.getBoolPref(fullScreenStr + 'transLyricsMarginLeftEnable');

	document.getElementById("lrcLyricsMarginLeftEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("lrcLyricsMarginLeft").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'lrcLyricsMarginLeftEnable', this.checked);
	}, false);
	document.getElementById("lrcLyricsMarginLeftEnable").checked = prefs.getBoolPref(fullScreenStr + 'lrcLyricsMarginLeftEnable');
	// MarginLeft enable init end

	// MarginRight enable init start
	document.getElementById("titleMarginRightEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("titleMarginRight").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'titleMarginRightEnable', this.checked);
	}, false);
	document.getElementById("titleMarginRightEnable").checked = prefs.getBoolPref(fullScreenStr + 'titleMarginRightEnable');

	document.getElementById("artistMarginRightEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("artistMarginRight").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'artistMarginRightEnable', this.checked);
	}, false);
	document.getElementById("artistMarginRightEnable").checked = prefs.getBoolPref(fullScreenStr + 'artistMarginRightEnable');

	document.getElementById("albumMarginRightEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("albumMarginRight").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'albumMarginRightEnable', this.checked);
	}, false);
	document.getElementById("albumMarginRightEnable").checked = prefs.getBoolPref(fullScreenStr + 'albumMarginRightEnable');

	document.getElementById("lyricsMarginRightEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("lyricsMarginRight").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'lyricsMarginRightEnable', this.checked);
	}, false);
	document.getElementById("lyricsMarginRightEnable").checked = prefs.getBoolPref(fullScreenStr + 'lyricsMarginRightEnable');

	document.getElementById("transLyricsMarginRightEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("transLyricsMarginRight").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'transLyricsMarginRightEnable', this.checked);
	}, false);
	document.getElementById("transLyricsMarginRightEnable").checked = prefs.getBoolPref(fullScreenStr + 'transLyricsMarginRightEnable');

	document.getElementById("lrcLyricsMarginRightEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("lrcLyricsMarginRight").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'lrcLyricsMarginRightEnable', this.checked);
	}, false);
	document.getElementById("lrcLyricsMarginRightEnable").checked = prefs.getBoolPref(fullScreenStr + 'lrcLyricsMarginRightEnable');
	// MarginRight enable init end

	// Font enable init start
	document.getElementById("titleFontEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("titleFont").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'titleFontEnable', this.checked);
	}, false);
	document.getElementById("titleFontEnable").checked = prefs.getBoolPref(fullScreenStr + 'titleFontEnable');

	document.getElementById("artistFontEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("artistFont").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'artistFontEnable', this.checked);
	}, false);
	document.getElementById("artistFontEnable").checked = prefs.getBoolPref(fullScreenStr + 'artistFontEnable');

	document.getElementById("albumFontEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("albumFont").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'albumFontEnable', this.checked);
	}, false);
	document.getElementById("albumFontEnable").checked = prefs.getBoolPref(fullScreenStr + 'albumFontEnable');

	document.getElementById("lyricsFontEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("lyricsFont").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'lyricsFontEnable', this.checked);
	}, false);
	document.getElementById("lyricsFontEnable").checked = prefs.getBoolPref(fullScreenStr + 'lyricsFontEnable');

	document.getElementById("transLyricsFontEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("transLyricsFont").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'transLyricsFontEnable', this.checked);
	}, false);
	document.getElementById("transLyricsFontEnable").checked = prefs.getBoolPref(fullScreenStr + 'transLyricsFontEnable');

	document.getElementById("lrcLyricsFontEnable").addEventListener("CheckboxStateChange", function () {
		document.getElementById("lrcLyricsFont").disabled = !this.checked;
		prefs.setBoolPref(fullScreenStr + 'lrcLyricsFontEnable', this.checked);
	}, false);
	document.getElementById("lrcLyricsFontEnable").checked = prefs.getBoolPref(fullScreenStr + 'lrcLyricsFontEnable');
	// Font enable init end
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
	else if (value == "O") {
		document.getElementById("CIDeck").selectedIndex = 2;
		prefs.setCharPref(fullScreenStr + "backgroundType", "O");
	}
	else {
		document.getElementById("CIDeck").selectedIndex = 3;
		prefs.setCharPref(fullScreenStr + "backgroundType", "E");
	}
}

function rebuildFonts () {
	var langGroupPref = document.getElementById("font.language.group");
	selectDefaultLanguageGroup(langGroupPref.value, readDefaultFontTypeForLanguage(langGroupPref.value) == "serif");
}

function selectDefaultLanguageGroup (aLanguageGroup, aIsSerif) {
	const kFontNameFmtSerif         = "font.name.serif.%LANG%";
	const kFontNameFmtSansSerif     = "font.name.sans-serif.%LANG%";
	const kFontNameListFmtSerif     = "font.name-list.serif.%LANG%";
	const kFontNameListFmtSansSerif = "font.name-list.sans-serif.%LANG%";
	const kFontSizeFmtVariable      = "font.size.variable.%LANG%";

	var prefs = [{ format   : aIsSerif ? kFontNameFmtSerif : kFontNameFmtSansSerif,
			type     : "fontname",
			element  : "defaultFont",
			fonttype : aIsSerif ? "serif" : "sans-serif" },
			{ format   : aIsSerif ? kFontNameListFmtSerif : kFontNameListFmtSansSerif,
			type     : "unichar",
			element  : null,
			fonttype : aIsSerif ? "serif" : "sans-serif" },
			{ format   : kFontSizeFmtVariable,
			type     : "int",
			element  : "defaultFontSize",
			fonttype : null }];
	var preferences = document.getElementById("contentPreferences");
	for (var i = 0; i < prefs.length; ++i) {
		var preference = document.getElementById(prefs[i].format.replace(/%LANG%/, aLanguageGroup));
		if (!preference) {
			preference = document.createElement("preference");
			var name = prefs[i].format.replace(/%LANG%/, aLanguageGroup);
			preference.id = name;
			preference.setAttribute("name", name);
			preference.setAttribute("type", prefs[i].type);
			preferences.appendChild(preference);
		}

		if (!prefs[i].element)
			continue;

		var element = document.getElementById(prefs[i].element);
		if (element) {
			element.setAttribute("preference", preference.id);

			if (prefs[i].fonttype)
				FontBuilder.buildFontList(aLanguageGroup, prefs[i].fonttype, element);

			preference.setElementValue(element);
		}
	}
}

function readDefaultFontTypeForLanguage (aLanguageGroup) {
	const kDefaultFontType = "font.default.%LANG%";
	var defaultFontTypePref = kDefaultFontType.replace(/%LANG%/, aLanguageGroup);
	var preference = document.getElementById(defaultFontTypePref);
	if (!preference) {
		preference = document.createElement("preference");
		preference.id = defaultFontTypePref;
		preference.setAttribute("name", defaultFontTypePref);
		preference.setAttribute("type", "string");
		document.getElementById("contentPreferences").appendChild(preference);
	}
	return preference.value;
}
