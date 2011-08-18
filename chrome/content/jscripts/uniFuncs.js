try {
Components.utils.import("resource://app/jsmodules/sbProperties.jsm");
}
catch (error) {alert("MLyrics: Unexpected error - module import error\n\n" + error)}

// We need to have base object
if (typeof(this.mlyrics) !== 'object') {
	this.mlyrics = {};
}

mlyrics.lib = {

	preferenceService: null,
	consoleService: null,
	xulRuntime: null,
	localFile: null,
	metadataService: null,

	init: function () {
		this.preferenceService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.mlyrics.");
		this.consoleService = Components.classes['@mozilla.org/consoleservice;1'].getService(Components.interfaces.nsIConsoleService);
		this.xulRuntime = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULRuntime);
		this.localFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
		this.metadataService = Components.classes["@songbirdnest.com/Songbird/FileMetadataService;1"].getService(Components.interfaces.sbIFileMetadataService);
	},

	writeID3Tag: function (mediaItem) {
		
		var mediaItemArray = Components.classes["@songbirdnest.com/moz/xpcom/threadsafe-array;1"].createInstance(Components.interfaces.nsIMutableArray);
		mediaItemArray.appendElement(mediaItem, false);
		
		if (mediaItemArray.length > 0) {
			// Remove read only attribute
			if (this.xulRuntime.OS == "WINNT") {
				var filePath = decodeURIComponent(mediaItem.contentSrc.path).substr(1).replace(/\//g, "\\");
			}
			else {
				var filePath = decodeURIComponent(mediaItem.contentSrc.path);
			}
			
			this.localFile.initWithPath(filePath);
			var oldPermissions = this.localFile.permissions;
			this.localFile.permissions = 0666;
			
			// This will write out the properties in propArray for each item.
			var propArray = ArrayConverter.stringEnumerator([SBProperties.lyrics]);
			var metadataWriteProgress = this.metadataService.write(mediaItemArray, propArray);
			
			var metadataWriteCheck = setInterval(function (){
				if (metadataWriteProgress.status != 32){
					mlyrics.lib.debugOutput("Lyrics write finished");
					clearInterval(metadataWriteCheck);
					if (!metadataWriteProgress.status) {
						mediaItem.setProperty("http://songbirdnest.com/data/1.0#hasLyrics", "chrome://mlyrics/content/images/haslyrics-tagblack.png");
						
						var errorsEnum = metadataWriteProgress.getErrorMessages();
						while (errorsEnum.hasMore())
							throw new Error("SongBird has failed to write lyrics into '" + errorsEnum.getNext() + "'");
					}
					else if (metadataWriteProgress.status == 16) {
						mediaItem.setProperty("http://songbirdnest.com/data/1.0#hasLyrics", "chrome://mlyrics/content/images/haslyrics-tagwhite.png");
					}
					
					// Restore permissions
					mlyrics.lib.localFile.permissions = oldPermissions;
				}
			}, 500);
		}
	},

	fixHasLyr: function (aMediaItem) {
  
		var lyrics 		= aMediaItem.getProperty("http://songbirdnest.com/data/1.0#lyrics");
		var haslyrStrFullOrig 	= aMediaItem.getProperty("http://songbirdnest.com/data/1.0#hasLyrics");
		var isLRC 		= aMediaItem.getProperty("http://songbirdnest.com/data/1.0#hasLRCfile");
		var isSmartScroll 	= aMediaItem.getProperty("http://songbirdnest.com/data/1.0#mlyricsScrollCorrArray");
		
		if (typeof(lyrics) == 'undefined') lyrics = null;
		if (typeof(haslyrStrFullOrig) == 'undefined') haslyrStrFullOrig = null;
		if (typeof(isLRC) == 'undefined') isLRC = "false";
		if (typeof(isSmartScroll) == 'undefined') isLRC = false;

		// Do not have lyrics stored in Database or tag and do not have lrc file
		if (!lyrics && !isLRC) {
			if (haslyrStrFullOrig)
				aMediaItem.setProperty("http://songbirdnest.com/data/1.0#hasLyrics", null);
			return 0;
		}
		
		// Make haslyrics string
		var haslyrStr = "";
		if (lyrics) {
			if (haslyrStrFullOrig && haslyrStrFullOrig.length) {
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
		else if (isSmartScroll) {
			haslyrStr += "-microphone";
		}

		// Picture already shown
		var haslyrStrFull = "chrome://mlyrics/content/images/haslyrics" + haslyrStr + ".png";
		if (!haslyrStrFullOrig || haslyrStrFull.length != haslyrStrFullOrig.length || haslyrStrFull != haslyrStrFullOrig) {
			setTimeout(function () {aMediaItem.setProperty("http://songbirdnest.com/data/1.0#hasLyrics", haslyrStrFull);}, 100);
		
			var trackName = aMediaItem.getProperty("http://songbirdnest.com/data/1.0#trackName");
			mlyrics.lib.debugOutput("[" + trackName + "] haslyrStr: " + haslyrStrFull + " <> " + haslyrStrFullOrig);

			if (haslyrStr.indexOf("-tag") != -1) {
				if (haslyrStr.indexOf("-microphone") == -1) return 1;
			}
			else {
				return 2;
			}
		}

		return 0;
	},

	debugOutput: function (localOutStr) {

		if (!this.preferenceService.getBoolPref("debugMode")) return;

		var localcurrentDate 	= new Date();
		var localMinutes 	= localcurrentDate.getMinutes();
		var localSeconds 	= localcurrentDate.getSeconds();
		var localMilliseconds = localcurrentDate.getMilliseconds();

		if (parseInt(localMinutes, 10) 	< 10) localMinutes 	= "0" + localMinutes;
		if (parseInt(localSeconds, 10) 	< 10) localSeconds 	= "0" + localSeconds;
		if (parseInt(localMilliseconds, 10) 	< 10) localMilliseconds = "0" + localMilliseconds;

		this.consoleService.logStringMessage("MLyrics [" + localMinutes + ":" + localSeconds + ":" + localMilliseconds + "] " + localOutStr);
	}
}

// Initialize when included
mlyrics.lib.init();
