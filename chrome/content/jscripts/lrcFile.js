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

	readLRC: function (trackMediaItem) {

		var result = {timeArray: "", lyrics: ""};

		if (this.xulRuntime.OS == "WINNT") {
			var mediaFilePath = decodeURIComponent(trackMediaItem.contentSrc.path).substr(1).replace(/\//g, "\\");
			var mediaDirectoryPath = mediaFilePath.substr(0, mediaFilePath.lastIndexOf("\\"));
		}
		else {
			var mediaFilePath = decodeURIComponent(trackMediaItem.contentSrc.path);
			var mediaDirectoryPath = mediaFilePath.substr(0, mediaFilePath.lastIndexOf("/"));
		}

		var mediaFilePathNoExt = mediaFilePath.substr(0, mediaFilePath.lastIndexOf("."));
		var lrcFilePath = mediaFilePathNoExt + ".lrc";

		this.timeTracksFile.initWithPath(lrcFilePath);

		if (!this.timeTracksFile.exists() || !this.timeTracksFile.isReadable()) {
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

		result.timeArray = this.getTimeTracks(istream);
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
		var lrcFilePath = mediaFilePathNoExt + ".lrc";

		this.timeTracksFile.initWithPath(lrcFilePath);

		if (this.timeTracksFile.exists())
			this.timeTracksFile.remove(false);
	},

	getTimeTracks: function (lrcLyrics) {
		var timeArray = [];
		timeArray[0] = 0;
		
		if (lrcLyrics) {
			var lrcLyricsArray = lrcLyrics.split("\n");

			for (var i=0; i<lrcLyricsArray.length; i++) {
				if (	lrcLyricsArray[i].substr(0, 1) == "[" && 
					lrcLyricsArray[i].substr(3, 1) == ":" && 
					lrcLyricsArray[i].substr(6, 1) == "." &&
					lrcLyricsArray[i].substr(9, 1) == "]"
				) {
					timeArray[i] = 	parseInt(lrcLyricsArray[i].substr(1, 2), 10)*60*1000 + 
							parseInt(lrcLyricsArray[i].substr(4, 2), 10)*1000 + 
							parseInt(lrcLyricsArray[i].substr(7, 2), 10)*10;
				}
			}
		}

		return timeArray;
	},

	getClearLyrics: function (lrcLyrics) {
		return lrcLyrics.replace(/\[.*\:.*\..*\]/g, "");
	},

	syncTimeTracks: function (aMediaItem) {
		
	}
}
