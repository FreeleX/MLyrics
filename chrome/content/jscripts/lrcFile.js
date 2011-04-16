Components.utils.import("resource://gre/modules/NetUtil.jsm");

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
		var lrcFilePath = mediaFilePathNoExt + ".lrc";

		this.timeTracksFile.initWithPath(lrcFilePath);
	
		if (this.timeTracksFile.exists()) return true;

		return false;
	},

	readLRC: function (aMediaItem) {
		var result = "";
		result.timeArray = "";
		result.lyrics = "";

		return result;
	},

	writeLRC: function (data, trackMediaItem) {
		
		if (mlyrics.pane.xulRuntime.OS == "WINNT") {
			var mediaFilePath = decodeURIComponent(trackMediaItem.contentSrc.path).substr(1).replace(/\//g, "\\");
			var mediaDirectoryPath = mediaFilePath.substr(0, mediaFilePath.lastIndexOf("\\"));
		}
		else {
			var mediaFilePath = decodeURIComponent(trackMediaItem.contentSrc.path);
			var mediaDirectoryPath = mediaFilePath.substr(0, mediaFilePath.lastIndexOf("/"));
		}

		var mediaFilePathNoExt = mediaFilePath.substr(0, mediaFilePath.lastIndexOf("."));
		var lrcFilePath = mediaFilePathNoExt + ".lrc";
		
		mlyrics.pane.timeTracksFile.initWithPath(mediaDirectoryPath);
		if (!mlyrics.pane.timeTracksFile.isWritable()) {
			setTimeout(function () {throw new Error("SongBird has failed to write lyrics into " + lrcFilePath + ", directory is not writable");}, 100);
			return;
		}
		
		mlyrics.pane.timeTracksFile.initWithPath(lrcFilePath);
		if (mlyrics.pane.timeTracksFile.exists() && !mlyrics.pane.timeTracksFile.isWritable()) {
			setTimeout(function () {throw new Error("SongBird has failed to write lyrics into " + lrcFilePath + ", file is not writable");}, 100);
			return;
		}
		
		var ostream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
		ostream.init(mlyrics.pane.timeTracksFile, 0x02 | 0x08 | 0x20, 0666, ostream.DEFER_OPEN);

		var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
		converter.charset = "UTF-8";

		var istream = converter.convertToInputStream(data);
		
		NetUtil.asyncCopy(istream, ostream, function (code) { trackMediaItem.setProperty("http://songbirdnest.com/data/1.0#hasLRCfile", code == 0); });
	},

	syncTimeTracks: function (aMediaItem) {
		var timeArray = [];
		timeArray[0] = 0;

		var lrcLyrics = aMediaItem.getProperty("http://songbirdnest.com/data/1.0#lyrics");

		if (lrcLyrics) {
			var lrcLyricsArray = lrcLyrics.split("\n");
			for (var i=0; i<lrcLyricsArray.length; i++) {
				if (	lrcLyricsArray[i].substr(0, 1) == "[" && 
					lrcLyricsArray[i].substr(3, 1) == ":" && 
					lrcLyricsArray[i].substr(6, 1) == "." &&
					lrcLyricsArray[i].substr(9, 1) == "]"
				) {
					timeArray[i] = 	parseInt(lrcLyricsArray[i].substr(1, 2))*60*1000 + 
							parseInt(lrcLyricsArray[i].substr(4, 2))*1000 + 
							parseInt(lrcLyricsArray[i].substr(7, 2))*10;
				}
			}
		}

		return timeArray;
	}
}
