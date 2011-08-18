// We need to have base object
if (typeof(this.mlyrics) !== 'object') {
	this.mlyrics = {};
}

if (typeof(mlyrics.playlist) !== 'object') {
	mlyrics.playlist = {
		init: function () {
			this.windowMediator = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
			this.songbirdWindow = this.windowMediator.getMostRecentWindow("Songbird:Main");
			this.mediaListView = this.songbirdWindow.gBrowser.currentMediaListView;
		},
		
		onpopupshowing: function () {
			var selectedItems = this.mediaListView.selection.selectedIndexedMediaItems;
			var selectedItemsNum = 0;
			while (selectedItems.hasMoreElements()) {
				selectedItems.getNext();
				selectedItemsNum ++ ;
			}
			
			if (selectedItemsNum > 1) {
				document.getElementById("mlyrics-gather-contextmenu").hidden = false;
			}
			else {
				document.getElementById("mlyrics-gather-contextmenu").hidden = true;
			}
		},
		
		onbatchcommand: function () {
			var batchFetchWindow = openDialog("chrome://mlyrics/content/xul/batch.xul", "mlyrics batch", "chrome,centerscreen,titlebar,resizable,modal=no");
		}
	}
}

mlyrics.playlist.init();
