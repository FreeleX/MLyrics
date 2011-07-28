try {
Components.utils.import("resource://gre/modules/NetUtil.jsm");
}
catch (error) {alert("MLyrics: Unexpected error - module import error\n\n" + error)}

// We need to have base object
if (typeof(this.mlyrics) !== 'object') {
	this.mlyrics = {};
}

mlyrics.lrc = {
	xulRuntime: null,
	timeTracksFile: null,

	init: function () {
		this.xulRuntime = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULRuntime);
		this.timeTracksFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
	},

	hasLRCFile: function (aMediaItem) {
		if (this.xulRuntime.OS == "WINNT") {
			var mediaFilePath = decodeURIComponent(aMediaItem.contentSrc.path).substr(1).replace(/\//g, "\\");
			var mediaDirectoryPath = mediaFilePath.substr(0, mediaFilePath.lastIndexOf("\\"));
		}
		else {
			var mediaFilePath = decodeURIComponent(aMediaItem.contentSrc.path);
			var mediaDirectoryPath = mediaFilePath.substr(0, mediaFilePath.lastIndexOf("/"));
		}

		var mediaFilePathNoExt = mediaFilePath.substr(0, mediaFilePath.lastIndexOf("."));
		if (mediaFilePathNoExt == "") return false;

		var lrcFilePath = mediaFilePathNoExt + ".lrc";
		mlyrics.lib.debugOutput("haslrcfile: " + lrcFilePath);
		
		try {
		mlyrics.lrc.timeTracksFile.initWithPath(lrcFilePath);
		}
		catch (e) {return false;};
		
		if (mlyrics.lrc.timeTracksFile.exists()) return true;

		return false;
	},

	readLRC: function (trackMediaItem) {

		var result = {timeArray: "", lyrics: "", origContent: ""};

		if (this.xulRuntime.OS == "WINNT") {
			var mediaFilePath = decodeURIComponent(trackMediaItem.contentSrc.path).substr(1).replace(/\//g, "\\");
			var mediaDirectoryPath = mediaFilePath.substr(0, mediaFilePath.lastIndexOf("\\"));
		}
		else {
			var mediaFilePath = decodeURIComponent(trackMediaItem.contentSrc.path);
			var mediaDirectoryPath = mediaFilePath.substr(0, mediaFilePath.lastIndexOf("/"));
		}

		var mediaFilePathNoExt = mediaFilePath.substr(0, mediaFilePath.lastIndexOf("."));
		if (mediaFilePathNoExt == "") return result;

		var lrcFilePath = mediaFilePathNoExt + ".lrc";
		this.timeTracksFile.initWithPath(lrcFilePath);

		if (!this.timeTracksFile.exists()) {
			mlyrics.lib.debugOutput("Cannot read, LRC file does not exist: " + lrcFilePath);
			return result;
		}
		else if (!this.timeTracksFile.isReadable())
		{
			setTimeout(function () {throw new Error("SongBird has failed to read lyrics from " + lrcFilePath);}, 100);
			return result;
		}

		var fstream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
		var sstream = Components.classes["@mozilla.org/scriptableinputstream;1"].createInstance(Components.interfaces.nsIScriptableInputStream);

		fstream.init(this.timeTracksFile, 0x01, 00004, null);
		sstream.init(fstream);

		var data = sstream.read(sstream.available());

		sstream.close();
		
		var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
		converter.charset = "UTF-8";

		var istream = converter.ConvertToUnicode(data);

		result.origContent = istream;
		result.timeStruct = this.getTimeTracks(istream);
		result.lyrics    = this.getClearLyrics(istream);

		return result;
	},

	writeLRC: function (data, trackMediaItem) {
		
		if (this.xulRuntime.OS == "WINNT") {
			var mediaFilePath = decodeURIComponent(trackMediaItem.contentSrc.path).substr(1).replace(/\//g, "\\");
			var mediaDirectoryPath = mediaFilePath.substr(0, mediaFilePath.lastIndexOf("\\"));
		}
		else {
			var mediaFilePath = decodeURIComponent(trackMediaItem.contentSrc.path);
			var mediaDirectoryPath = mediaFilePath.substr(0, mediaFilePath.lastIndexOf("/"));
		}

		var mediaFilePathNoExt = mediaFilePath.substr(0, mediaFilePath.lastIndexOf("."));
		if (mediaFilePathNoExt == "") return;

		var lrcFilePath = mediaFilePathNoExt + ".lrc";
		this.timeTracksFile.initWithPath(mediaDirectoryPath);

		if (!this.timeTracksFile.isWritable()) {
			setTimeout(function () {throw new Error("SongBird has failed to write lyrics into " + lrcFilePath + ", directory is not writable");}, 100);
			return;
		}
		
		this.timeTracksFile.initWithPath(lrcFilePath);
		if (this.timeTracksFile.exists() && !this.timeTracksFile.isWritable()) {
			setTimeout(function () {throw new Error("SongBird has failed to write lyrics into " + lrcFilePath + ", file is not writable");}, 100);
			return;
		}
		
		var ostream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
		ostream.init(this.timeTracksFile, 0x02 | 0x08 | 0x20, 0666, ostream.DEFER_OPEN);

		var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
		converter.charset = "UTF-8";

		var istream = converter.convertToInputStream(data);
		
		NetUtil.asyncCopy(istream, ostream, function (code) { trackMediaItem.setProperty("http://songbirdnest.com/data/1.0#hasLRCfile", code == 0); });
	},

	removeLRC: function (trackMediaItem) {
		if (this.xulRuntime.OS == "WINNT") {
			var mediaFilePath = decodeURIComponent(trackMediaItem.contentSrc.path).substr(1).replace(/\//g, "\\");
			var mediaDirectoryPath = mediaFilePath.substr(0, mediaFilePath.lastIndexOf("\\"));
		}
		else {
			var mediaFilePath = decodeURIComponent(trackMediaItem.contentSrc.path);
			var mediaDirectoryPath = mediaFilePath.substr(0, mediaFilePath.lastIndexOf("/"));
		}

		var mediaFilePathNoExt = mediaFilePath.substr(0, mediaFilePath.lastIndexOf("."));
		if (mediaFilePathNoExt == "") return;

		var lrcFilePath = mediaFilePathNoExt + ".lrc";
		this.timeTracksFile.initWithPath(lrcFilePath);

		if (this.timeTracksFile.exists())
			this.timeTracksFile.remove(false);
	},

	getTimeTracks: function (lrcLyrics) {
		var timeStruct = {timeArray: [], origTimeTracks: []};
		
		if (lrcLyrics) {
			var lrcLyricsArray = lrcLyrics.split("\n");

			for (var i=0; i<lrcLyricsArray.length; i++) {
				if (	lrcLyricsArray[i].substr(0, 1) == "[" && 
					lrcLyricsArray[i].substr(3, 1) == ":" && 
					lrcLyricsArray[i].substr(6, 1) == "." &&
					lrcLyricsArray[i].substr(9, 1) == "]"
				) {
					timeStruct.origTimeTracks[i] = lrcLyricsArray[i].substr(1, 8);
					timeStruct.timeArray[i] = 	parseInt(lrcLyricsArray[i].substr(1, 2), 10)*60*1000 + 
									parseInt(lrcLyricsArray[i].substr(4, 2), 10)*1000 + 
									parseInt(lrcLyricsArray[i].substr(7, 2), 10)*10;
				}
			}
		}

		return timeStruct;
	},

	getClearLyrics: function (lrcLyrics) {
		return lrcLyrics.replace(/\r/g, "").replace(/\[\d{2}\:\d{2}\.\d{2}\]/g, "").replace(/\[.{2}\:{1}.*\].*\n/g, "");
	},

	syncTimeTracks: function (aMediaItem) {
		
		var haslyrStrFullOrig = aMediaItem.getProperty("http://songbirdnest.com/data/1.0#hasLyrics");

		// We have nothing
		if (!haslyrStrFullOrig)
			return true;

		var hasLyrics = (haslyrStrFullOrig.indexOf("-tag") != -1);
		var hasLRC = (haslyrStrFullOrig.indexOf("-clock") != -1);

		// We have no .lrc to syn with
		if (!hasLRC) 
			return true;

		var lrcData = this.readLRC(aMediaItem);
		lrcData.lyrics = lrcData.lyrics.replace(/\r/g, "");

		// If has no lyrics - sync from .lrc file
		if (!hasLyrics) {
			aMediaItem.setProperty("http://songbirdnest.com/data/1.0#lyrics", lrcData.lyrics);

			mlyrics.lib.writeID3Tag(aMediaItem);
			return true;
		}

		var lyricsOrig = aMediaItem.getProperty("http://songbirdnest.com/data/1.0#lyrics");

		var translDelimPos1 = lyricsOrig.indexOf("\n\n =================== \n [ ");
		if (translDelimPos1 == -1) {
			var lyrics = lyricsOrig.replace(/\r/g, "");
		}
		else {
			var lyrics = lyricsOrig.substr(0, translDelimPos1).replace(/\r/g, "");
		}

		var lyricsArray = lyrics.split("\n");
		var lrcLyricsArray = lrcData.lyrics.split("\n");

		if (lyricsArray[lyricsArray.length-1] == "") lyricsArray.length --;
		if (lrcLyricsArray[lrcLyricsArray.length-1] == "") lrcLyricsArray.length --;

		if (lyricsArray.length != lrcLyricsArray.length) {
			// Sync cannot be done - number of lines is not equal
			mlyrics.lib.debugOutput("LRC sync fail: " + lyricsArray.length + " <> " + lrcLyricsArray.length);
			return false;
		}

		// Compare line-by-line
		var needSync = false;
		for (var i=0; i<lyricsArray.length; i++) {
			if (lyricsArray[i].length != lrcLyricsArray[i].length)  {
				needSync = true;
				break;
			}
		}

		// No need to sync
		if (!needSync) return true;

		var lrcLyrics = "";
		for (var i=0; i<lyricsArray.length; i++) {
			lrcLyrics += "[" + lrcData.timeStruct.origTimeTracks[i] + "]" + lyricsArray[i] + "\n";
		}

		mlyrics.lrc.writeLRC(lrcLyrics, aMediaItem);

		var mediaFilePath = decodeURIComponent(aMediaItem.contentSrc.path);
		mlyrics.lib.debugOutput("LRC synced for: " + mediaFilePath);

		return true;
	}
}
