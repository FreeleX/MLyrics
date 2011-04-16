function ML_fixHasLyr (aMediaItem) {
  
	var lyrics = aMediaItem.getProperty("http://songbirdnest.com/data/1.0#lyrics");
	var haslyrStrFullOrig = aMediaItem.getProperty("http://songbirdnest.com/data/1.0#hasLyrics");
	var isLRC = aMediaItem.getProperty("http://songbirdnest.com/data/1.0#hasLRCfile");
	var trackName = aMediaItem.getProperty("http://songbirdnest.com/data/1.0#trackName");

	// Do not have lyrics stored in Database or tag and do not have lrc file
	if (!lyrics && !isLRC) {
		aMediaItem.setProperty("http://songbirdnest.com/data/1.0#hasLyrics", null);
	}
	else {
		var haslyrStr = "";

		// Make haslyrics string
		if (lyrics) {
			if (haslyrStrFullOrig) {
				if (haslyrStrFullOrig.indexOf("-tagblack") != -1)
					haslyrStr += "-tagblack";
				else 
					haslyrStr += "-tagwhite";
			}
			else {
				haslyrStr += "-tagwhite";
			}
		}

		if (isLRC == "true") {
			haslyrStr += "-clock";
		}

		var haslyrStrFull = "chrome://mlyrics/content/images/haslyrics" + haslyrStr + ".png";

		// Picture already shown
		if (haslyrStrFull != haslyrStrFullOrig) {
			aMediaItem.setProperty("http://songbirdnest.com/data/1.0#hasLyrics", haslyrStrFull);
			
			ML_debugOutput("[" + trackName + "] haslyrStr: " + haslyrStrFull + " <> " + haslyrStrFullOrig);

			if (haslyrStr.indexOf("-tag") != -1)
				return 1;
			else
				return 2;
		}
	}

	return 0;
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
