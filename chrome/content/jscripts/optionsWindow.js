var xulRuntime = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULRuntime);

var ignoreListChanged = false;

function onload () {
  if (xulRuntime.OS == "Linux" || xulRuntime.OS == "Darwin") onsaveunload = onsaveaccept;

  if (typeof(gBrowser) == "undefined")
    gBrowser = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow("Songbird:Main").window.gBrowser;
  
  var fetchListBox = document.getElementById("fetchListBox");
  
  var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.mlyrics.");
  prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
  
  var sources = prefs.getCharPref("fetchSourcesList").split("|");
  
  fetchListBox.setAttribute("rows", "" + 7);
  
  var maxPopularity = 0;
  for (var i=0; i<sources.length; i++) {
	  var popularity = prefs.getIntPref("popularity_" + sources[i]);
	  if (popularity > maxPopularity) maxPopularity = popularity;
  }
  
  for (var i=0; i<sources.length; i++) {
    var laddress = prefs.getCharPref("laddress_" + sources[i]);
    if (prefs.getBoolPref("fetch_" + sources[i])) {
      var enabled = "true";
    }
    else {
      var enabled = "false";
    }
    
    var description = prefs.getCharPref("descr_" + sources[i]);
    var popularity = prefs.getIntPref("popularity_" + sources[i]);
    
    var element = document.createElement('checkbox');
    element.setAttribute('label', laddress);
    element.setAttribute('checked', enabled);
    
    var descr = document.createElement('label');
    descr.setAttribute('value', description);
    
    var popul = document.createElement('progressmeter');
    popul.setAttribute('mode', 'determined');
    popul.setAttribute('value', Math.log(popularity)/Math.log(maxPopularity)*100);
    
    var populValue = document.createElement('label');
    populValue.setAttribute('value', popularity);
    
    var row = document.createElement('listitem');
    row.setAttribute('id', "fetch_" + sources[i]);
    row.setAttribute('ondblclick', 'checkOnDoubleClick()');
    row.appendChild(element);
    row.appendChild(descr);
    row.appendChild(populValue);
    row.appendChild(popul);
    
    fetchListBox.appendChild(row);
  }
  
  var langIgnoreList = prefs.getCharPref("ignoreLanguages").split("|");
  var ignoreLangListBox = document.getElementById("ignoreLangListBox");
  var trLanguagePopup = document.getElementById("trLanguagePopup");
  for (var i=0; i<trLanguagePopup.childNodes.length; i++) {
	var checked = false;
	
	for (var j=0; j<langIgnoreList.length; j++) {
		if (trLanguagePopup.childNodes[i].value == langIgnoreList[j]) {
			checked = true;
			break;
		}
	}
	
	var element = document.createElement('listitem');
	element.setAttribute('label', trLanguagePopup.childNodes[i].label);
	element.setAttribute('type', 'checkbox');
	element.setAttribute('checked', checked);
	element.setAttribute('value', trLanguagePopup.childNodes[i].value);
	element.setAttribute('oncommand', 'ignoreListChanged = true;');

	ignoreLangListBox.appendChild(element);
  }
  
  if (prefs.getCharPref("enableTranslate") != 'TRANSLATE') {
	enableTranslateLanguage(false);
  }
}

function onsaveaccept () {
  var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.mlyrics.");
  prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
  
  var sources = prefs.getCharPref("fetchSourcesList").split("|");
  
  for (var i=0; i<sources.length; i++) {
    var element = document.getElementById("fetch_" + sources[i]);
    prefs.setBoolPref("fetch_" + sources[i], element.childNodes[0].checked);
  }
  
  var fetchListBox = document.getElementById("fetchListBox");
  
  var listOrder = "";
  var items = fetchListBox.getElementsByTagName("listitem");
  for (var i=0; i<items.length; i++) {
    if (listOrder != "") {
      listOrder += "|";
    }
    listOrder += items[i].id.substr(6);
  }
  
  if (listOrder != "") prefs.setCharPref("fetchSourcesList", listOrder);
  
  var ignoreLangListBox = document.getElementById("ignoreLangListBox");
  var ignoreList = "";
  for (var i=0; i<ignoreLangListBox.childNodes.length; i++) {
	  if (ignoreLangListBox.childNodes[i].checked) {
		if (ignoreList != "") {
			ignoreList += "|";
		}
		ignoreList += ignoreLangListBox.childNodes[i].value;
	  }
  }
  
  // Protection against unusual ignore languages list clear
  if (ignoreListChanged) prefs.setCharPref("ignoreLanguages", ignoreList);
}

function checkOnDoubleClick () {
  var fetchListBox = document.getElementById("fetchListBox");

  var selectedItem = fetchListBox.selectedItem;
  selectedItem.childNodes[0].checked = !selectedItem.childNodes[0].checked;
}

function enableUpDownButtons () {
  document.getElementById("upSourceButton").disabled = false;
  document.getElementById("downSourceButton").disabled = false;
}

function enableTranslateLanguage (state) {
  document.getElementById("trLanguageMenu").disabled = !state;
  document.getElementById("trMetadataCheckbox").disabled = !state;
  //document.getElementById("ignoreLangListBox").disabled = !state;
  //enableSaveTranslationBox(state)
}

function enableSaveTranslationBox (state) {
  if (!state) {
	  document.getElementById("pref_saveTranslation").value = "NEVERSAVE";
	  document.getElementById("saveTranslation").disabled = true;
  }
  else {
	  document.getElementById("saveTranslation").disabled = false;
  }
}

function moveSourceUp () {
  var fetchListBox = document.getElementById("fetchListBox");
  
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
	document.getElementById("upSourceButton").disabled = true;
      }
    }
    else {
      document.getElementById("upSourceButton").disabled = true;
    }
  }
  else {
    document.getElementById("upSourceButton").disabled = true;
    document.getElementById("downSourceButton").disabled = true;
  }
}

function moveSourceDown () {
  var fetchListBox = document.getElementById("fetchListBox");
  
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
	document.getElementById("downSourceButton").disabled = true;
      }
    }
    else {
      document.getElementById("downSourceButton").disabled = true;
    }
  }
  else {
    document.getElementById("upSourceButton").disabled = true;
    document.getElementById("downSourceButton").disabled = true;
  }
}

function openURL (url) {
	var newTab = gBrowser.addTab(url);
	gBrowser.selectedTab = newTab;
	self.close();
}
