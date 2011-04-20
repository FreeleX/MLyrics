if (typeof(SBProperties) == "undefined") {
	Components.utils.import("resource://app/jsmodules/sbProperties.jsm");
	if (!SBProperties)
		throw new Error("Failed to import sbProperties.jsm");
}

if (typeof(LibraryUtils) == "undefined") {
	Components.utils.import("resource://app/jsmodules/sbLibraryUtils.jsm");
	if (!LibraryUtils)
		throw new Error("resource://app/jsmodules/sbLibraryUtils.jsm");
}

if (typeof(SBJobUtils) == "undefined") {
	Components.utils.import("resource://app/jsmodules/SBJobUtils.jsm");
	if (!SBJobUtils)
		throw new Error("Failed to import resource://app/jsmodules/SBJobUtils.jsm");
}

if (typeof(this.mlyrics) !== 'object') {
	this.mlyrics = {};
}

( function () {
	if (typeof(mlyrics.scanlib) !== 'object') {
		mlyrics.scanlib = {};
	}
	
	if (typeof(mlyrics.scanlib.scan) !== 'function') {
		mlyrics.scanlib.scan = function () {
			
			//setTimeout(function () {
				var list = LibraryUtils.mainLibrary;
				
				//  Create an enumeration listener to count each item  
				var listener = {

					onEnumerationBegin: function(aMediaList) {
					},
					
					onEnumeratedItem: function(aMediaList, aMediaItem) {
						mlyrics.lib.fixHasLyr(aMediaItem); 
					},
					
					onEnumerationEnd: function(aMediaList, aStatusCode) {
					}
				};
				
				list.enumerateAllItems(listener);
				
			//}, 100);
		}
	}

	if (typeof(mlyrics.scanlib.lrcSyncScan) !== 'function') {
		mlyrics.scanlib.lrcSyncScan = function () {
			
			//setTimeout(function () {
				var list = LibraryUtils.mainLibrary;
				
				//  Create an enumeration listener to count each item  
				var listener = {

					onEnumerationBegin: function(aMediaList) {
					},
					
					onEnumeratedItem: function(aMediaList, aMediaItem) {
						if (!mlyrics.lrc.syncTimeTracks(aMediaItem)) {
							mlyrics.lrc.removeLRC(aMediaItem);
							aMediaItem.setProperty("http://songbirdnest.com/data/1.0#hasLRCfile", null);
						}
					},
					
					onEnumerationEnd: function(aMediaList, aStatusCode) {
					}
				};
				
				list.enumerateAllItems(listener);
				
			//}, 100);
		}
	}

	if (typeof(mlyrics.scanlib.hasLrcScan) !== 'function') {
		mlyrics.scanlib.hasLrcScan = function () {
			
			//setTimeout(function () {
				var list = LibraryUtils.mainLibrary;
				
				//  Create an enumeration listener to count each item  
				var listener = {

					onEnumerationBegin: function(aMediaList) {
					},
					
					onEnumeratedItem: function(aMediaList, aMediaItem) {
						var hasLRCFile = mlyrics.lrc.hasLRCFile(aMediaItem);
						aMediaItem.setProperty("http://songbirdnest.com/data/1.0#hasLRCfile", "" + hasLRCFile);
					},
					
					onEnumerationEnd: function(aMediaList, aStatusCode) {
					}
				};
				
				list.enumerateAllItems(listener);
				
			//}, 100);
		}
	}
} ) ();

