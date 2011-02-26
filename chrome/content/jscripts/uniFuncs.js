function ML_fixHasLyr (aMediaItem) {
  
    var lyrics=aMediaItem.getProperty("http://songbirdnest.com/data/1.0#lyrics");
    var haslyr=aMediaItem.getProperty("http://songbirdnest.com/data/1.0#hasLyrics");

    if ((lyrics != null) && (haslyr == null || haslyr.substr(0, 42) != "chrome://mlyrics/content/images/haslyrics-"))
    {
	    aMediaItem.setProperty("http://songbirdnest.com/data/1.0#hasLyrics", "chrome://mlyrics/content/images/haslyrics-white.png");
	    return true;
    }
	  
    else if ((lyrics == null) && (haslyr != null))
    {
	    aMediaItem.setProperty("http://songbirdnest.com/data/1.0#hasLyrics", null);
    }
    
    return false;
}

function ML_debugOutput (localOutStr) {

  if (!ML_debug_preferenceService.getBoolPref("debugMode")) return;

  var localcurrentDate 	= new Date();
  var localMinutes 	= localcurrentDate.getMinutes();
  var localSeconds 	= localcurrentDate.getSeconds();
  var localMilliseconds = localcurrentDate.getMilliseconds();
  
  if (parseInt(localMinutes, 10) 	< 10) localMinutes 	= "0" + localMinutes;
  if (parseInt(localSeconds, 10) 	< 10) localSeconds 	= "0" + localSeconds;
  if (parseInt(localMilliseconds, 10) 	< 10) localMilliseconds = "0" + localMilliseconds;
  
  ML_debug_consoleService.logStringMessage("MLyrics [" + localMinutes + ":" + localSeconds + ":" + localMilliseconds + "] " + localOutStr);
}

ML_debug_preferenceService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.mlyrics.");
ML_debug_consoleService = Components.classes['@mozilla.org/consoleservice;1'].getService(Components.interfaces.nsIConsoleService);