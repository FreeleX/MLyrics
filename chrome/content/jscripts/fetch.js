// We need to have base object
if (typeof(this.mlyrics) !== 'object') {
	this.mlyrics = {};
}

mlyrics.fetch = {
	
	abortTimeout: 30000,
	prefs: null,
	cSourceURL: "",
	fetchMediaItem: null,
	
	init: function () {
		this.prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.mlyrics.");
		this.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
		
		var sources = this.prefs.getCharPref("fetchSourcesList").split("|");
		for (var i=0; i<sources.length; i++) {
			
			if (typeof(this.source[sources[i]]) !== 'object') {
				mlyrics.lib.debugOutput("Does not have object for " + sources[i] + " source");
				continue;
			}
			
			// Add this function to all source objects
			this.source[sources[i]].getCleanStr = function (str) {
				
				var edit_str = str.split(" (");
				var search_str = str;
				if (edit_str.length>0)
				{
					search_str = edit_str[0];
				}
				
				return search_str;
			}
			
			// Add this function to all source objects
			this.source[sources[i]].fixGeneralCharacters = function (respLyr) {
				
				if (respLyr == null || respLyr == "") return "";
				
				respLyr = respLyr.replace(/<span>/g, "");
				respLyr = respLyr.replace(/\r\n/g, "\n");
				respLyr = respLyr.replace(/\r/g, "");
				respLyr = respLyr.replace(/\n\n\n/g, "\n\n");
				
				return respLyr;
			}
		}
	},
	
	source: {
		
		// http://letras.terra.com.br
		// ==========================
		TERRA: {
			getUrl: function (artist, album, track) {
				
				//SINCE TERRA LYRICS website doesn't works good with encodeURIComponent, we're encoding it 'manually'.
				var _search_artist = escape( this.getCleanStr(artist) ) .replace(/\+/g, '%2B')
											.replace(/\"/g, '%22')
											.replace(/\'/g, '%27');
											
				var _search_track = escape( this.getCleanStr(track) )	.replace(/\+/g, '%2B')
											.replace(/\"/g, '%22')
											.replace(/\'/g, '%27');
											
				var url = "http://letras.terra.com.br/winamp.php?musica=" + _search_track + "&artista=" + _search_artist;
				return url;
			},
			
			getLyrics: function (artist, album, track, cbFn) {
				
				var url = this.getUrl(artist, album, track);
				
				var req = new XMLHttpRequest();
				if (!req) {
					cbFn("");
					return;
				}
				
				mlyrics.lib.debugOutput("Fetch: " + url);
				
				var sourceObj = this;
				
				req.open("GET", url, true);
				
				var abortTimeout = setTimeout(function () {req.abort(); cbFn("");}, mlyrics.fetch.abortTimeout);
				
				req.onreadystatechange = function() {
					
					if (typeof(mlyrics.pane) != "undefined" && 
					    mlyrics.pane.playlistPlaybackServiceListener.curMediaItem != mlyrics.fetch.fetchMediaItem)
					{
						mlyrics.lib.debugOutput("Fetch1 abort - track changed");
						clearTimeout(abortTimeout);
						this.abort();
						return;
					}
					
					if (this.readyState != 4) return;
					
					mlyrics.lib.debugOutput("Got lyrics data");
					
					clearTimeout(abortTimeout);
					
					var respLyr = "";
					if (this.status == 200) {
						
						this.overrideMimeType('text/xml; charset=iso-8859-1');
						respLyr = sourceObj.filterText(this.responseText, sourceObj.getCleanStr(artist), sourceObj.getCleanStr(track));
						respLyr = sourceObj.fixCharacters(respLyr);
						respLyr = sourceObj.fixGeneralCharacters(respLyr);
					}
					
					cbFn(respLyr);
				}
				
				req.onerror = function () {clearTimeout(abortTimeout);};
				
				req.send(null);
			},
			
			filterText: function (respLyr, artist, track) {
				if (respLyr == null || respLyr == "") return "";
				
				var exprArtist = new RegExp('target="_blank">.*</a></h2>', "i");
				var respArtistStart = respLyr.search(exprArtist);
				if (respArtistStart != -1) {
					respArtistStart += 16;
					var respArtistEnd = respLyr.indexOf('</a></h2>', respArtistStart);
					var respArtist = respLyr.substring(respArtistStart, respArtistEnd);
					if (respArtist.toLowerCase() != artist.toLowerCase()) {
						mlyrics.lib.debugOutput("Artist " + artist + " doesn't match " + respArtist + " the one we're looking for");
						return "";
					}
				}
				
				var exprTitle = new RegExp('target="_blank">.*</a></h1>', "i");
				var respTitleStart = respLyr.search(exprTitle);
				if (respTitleStart != -1) {
					respTitleStart += 16;
					var respTitleEnd = respLyr.indexOf('</a></h1>', respTitleStart);
					var respTitle = respLyr.substring(respTitleStart, respTitleEnd);
					if (respTitle.toLowerCase() != track.toLowerCase()) {
						mlyrics.lib.debugOutput("Track " + track + " doesn't match " + respTitle + " the one we're looking for");
						return "";
					}
				}
				
				if(respLyr.indexOf("<div id=\"info\">") == -1 && respLyr.indexOf("<div id=\'info\'>") == -1) {
					if(respLyr.indexOf("<div id='at'>") != -1) {
						var respLyrResult = respLyr.split("<p>");
						var lyrDiv = respLyrResult[2].split("</p>");
						var respLyr = lyrDiv[0];
					} else {
						var respLyrResult = respLyr.split("<p>");
						if (respLyrResult.length > 1) {
							var lyrDiv = respLyrResult[1].split("</p>");
							var respLyr = lyrDiv[0];
						}
						else {
							var respLyr = "";
						}
					}
					
					respLyr = respLyr.replace(/<br\/>/g,"");
					respLyr = respLyr.replace(/&lt;br\/&gt;/g,"");
					respLyr = respLyr.replace(/&lt;p&gt;/g,"");
					respLyr = respLyr.replace(/&lt;\/p&gt;/g,"");
				} else {
					respLyr = "";
				}
				return respLyr;
			},
			
			fixCharacters: function(respLyr) {
				if (respLyr== null || respLyr == "") return "";
					
				String.prototype.ASCIIchars = ["&iexcl;", "&cent;", "&pound;", "&curren;", "&yen;", "&brvbar;", "&sect;", "&uml;", "&copy;", "&ordf;", "&laquo;", "&not;", "&shy;", "&reg;", "&macr;", "&deg;", "&plusmn;", "&sup2;", "&sup3;", "&acute;", "&micro;", "&para;", "&middot;", "&cedil;", "&sup1;", "&ordm;", "&raquo;", "&frac14;", "&frac12;", "&frac34;", "&iquest;", "&Agrave;", "&Aacute;", "&Acirc;", "&Atilde;", "&Auml;", "&Aring;", "&AElig;", "&Ccedil;", "&Egrave;", "&Eacute;", "&Ecirc;", "&Euml;", "&Igrave;", "&Iacute;", "&Icirc;", "&Iuml;", "&ETH;", "&Ntilde;", "&Ograve;", "&Oacute;", "&Ocirc;", "&Otilde;", "&Ouml;", "&times;", "&Oslash;", "&Ugrave;", "&Uacute;", "&Ucirc;", "&Uuml;", "&Yacute;", "&THORN;", "&szlig;", "&agrave;", "&aacute;", "&acirc;", "&atilde;", "&auml;", "&aring;", "&aelig;", "&ccedil;", "&egrave;", "&eacute;", "&ecirc;", "&euml;", "&igrave;", "&iacute;", "&icirc;", "&iuml;", "&eth;", "&ntilde;", "&ograve;", "&oacute;", "&ocirc;", "&otilde;", "&ouml;", "&divide;", "&oslash;", "&ugrave;", "&uacute;", "&ucirc;", "&uuml;", "&yacute;", "&thorn;", "&yuml;", "&euro;", "&amp;" ];
				String.prototype.ISOchars = ["¡", "¢", "£", "¤", "¥", "¦", "§", "¨", "©", "ª", "«", "¬", "­", "®", "¯", "°", "±", "²", "³", "´", "µ", "¶", "·", "¸", "¹", "º", "»", "¼", "½", "¾", "¿", "À", "Á", "Â", "Ã", "Ä", "Å", "Æ", "Ç", "È", "É", "Ê", "Ë", "Ì", "Í", "Î", "Ï", "Ð", "Ñ", "Ò", "Ó", "Ô", "Õ", "Ö", "×", "Ø", "Ù", "Ú", "Û", "Ü", "Ý", "Þ", "ß", "à", "á", "â", "ã", "ä", "å", "æ", "ç", "è", "é", "ê", "ë", "ì", "í", "î", "ï", "ð", "ñ", "ò", "ó", "ô", "õ", "ö", "÷", "ø", "ù", "ú", "û", "ü", "ý", "þ", "ÿ", "€", "&"];
				
				String.prototype.ASCIIDecode = function() {
					var s = this.replace(/&amp;#(\d+);/g, function(str, s1) { return String.fromCharCode(s1); });
					for(var i = 0; i < this.ASCIIchars.length; i++)
						s = s.replace(new RegExp(this.ASCIIchars[i], "g"), this.ISOchars[i]);
					return s;
				};
				
				String.prototype.ASCIIEncode = function(inc) {
					var cooked = "";
					for (var i = 0; i < this.length; i++) {
						var index = -1;
						for(var j=0; j<this.ISOchars; j++) {
							if(this.ISOchars[j] == this.charAt(i)) {
								index = j;
								break;
							}
						}
						if(index > -1)
							cooked += this.ASCIIchars[index];
						else
							cooked += this.charAt(i);
					}
					return cooked;
				};
				
				respLyr = respLyr.replace(/&#039;/g, "'");
				respLyr = respLyr.replace(/&quot;/g, "\"");
				respLyr = respLyr.replace(/\u2019/g, "'");
				respLyr = respLyr.replace(/\`/g, "'");
				respLyr = respLyr.replace(/\´/g, "'");
				respLyr = respLyr.ASCIIDecode();
				//respLyr = respLyr.replace(/\r\n/g, "\n");
				respLyr = respLyr.replace(/\u007F/g, "");
				
				return respLyr;
			},
		},
		
		// http://lyrdb.com
		// ================
		LYRDB: {
			getUrl: function (artist, album, track) {
				var _artist = encodeURIComponent( this.getCleanStr(artist).replace(/\'/g, "") );
				var _track = encodeURIComponent( this.getCleanStr(track).replace(/\'/g, "") );
				
				var url = "http://webservices.lyrdb.com/lookup.php?q=" + _artist + "|" + _track + "&for=match&agent=Songbird";
				return url;
			},
			
			getLyrics: function (artist, album, track, cbFn) {
				
				var url = this.getUrl(artist, album, track);
				
				var sourceObj = this;
				
				var req = new XMLHttpRequest();
				if (!req) {
					cbFn("");
					return;
				}
				
				mlyrics.lib.debugOutput("Fetch: " + url);
				
				req.open("GET", url, true);
				
				var abortTimeout = setTimeout(function () {req.abort(); cbFn("");}, mlyrics.fetch.abortTimeout);
				
				req.onreadystatechange = function() {
					
					if (typeof(mlyrics.pane) != "undefined" && 
					    mlyrics.pane.playlistPlaybackServiceListener.curMediaItem != mlyrics.fetch.fetchMediaItem)
					{
						mlyrics.lib.debugOutput("Fetch1 abort - track changed");
						clearTimeout(abortTimeout);
						this.abort();
						return;
					}
					
					if (this.readyState != 4) return;
					
					mlyrics.lib.debugOutput("Got lyrics data");
					
					clearTimeout(abortTimeout);
					
					var respLyr = "";
					if (this.status == 200) {
						respLyr = this.responseText;
						
						var idPosEnd = respLyr.indexOf("\\");
						if (idPosEnd != -1) {
							
							var songId = respLyr.substr(0, idPosEnd);
							var songUrl = "http://webservices.lyrdb.com/getlyr.php?q=" + songId;
							
							sourceObj.getLyrics2(songUrl, cbFn);
						}
						else {
							cbFn("");
						}
					}
					else {
						cbFn("");
					}
				}
				
				req.onerror = function () {clearTimeout(abortTimeout);};
				
				req.send(null);
			},
			
			getLyrics2: function (songUrl, cbFn) {
				mlyrics.lib.debugOutput("Fetch2: " + songUrl);
				
				var req2 = new XMLHttpRequest();
				if (!req2) {
					cbFn("");
					return;
				}
				
				var sourceObj = this;
				
				req2.open("GET", songUrl, true);
				
				var abortTimeout = setTimeout(function () {req2.abort(); cbFn("");}, mlyrics.fetch.abortTimeout);
				
				req2.onreadystatechange = function () {
					
					if (typeof(mlyrics.pane) != "undefined" && 
					    mlyrics.pane.playlistPlaybackServiceListener.curMediaItem != mlyrics.fetch.fetchMediaItem)
					{
						mlyrics.lib.debugOutput("Fetch2 abort - track changed");
						clearTimeout(abortTimeout);
						this.abort();
						return;
					}
					
					if (this.readyState != 4) return;
					
					mlyrics.lib.debugOutput("Got2 lyrics data");
					
					clearTimeout(abortTimeout);
					
					if (this.status == 200) {
						var respLyr = this.responseText;
						if (respLyr.substr(0, 6) == "error:") respLyr = "";
					}
					else {
						var respLyr = "";
					}
					
					respLyr = sourceObj.filterText(respLyr);
					respLyr = sourceObj.fixCharacters(respLyr);
					respLyr = sourceObj.fixGeneralCharacters(respLyr);
					
					cbFn(respLyr);
				}
				
				req2.onerror = function () {clearTimeout(abortTimeout);};
				
				req2.send(null);
			},
			
			filterText: function (respLyr) {
				if (respLyr == null || respLyr == "") return "";
				
				return respLyr;
			},
			
			fixCharacters: function(respLyr) {
				if (respLyr == null || respLyr == "") return "";
				
				respLyr = respLyr.replace(/\r\n/g, "\n");
				
				return respLyr;
			}
		},
		
		// http://darklyrics.com
		// =====================
		DARKLYRICS: {
			getUrl: function (artist, album, track) {
				
				var _artist = encodeURIComponent( this.filterASCIIDigitSym( this.getCleanStr(artist).toLowerCase() ) );
				var _album = encodeURIComponent( this.filterASCIIDigitSym( this.getCleanStr(album).toLowerCase() ) );
				
				var url= "http://www.darklyrics.com/lyrics/" + _artist + "/" + _album + ".html";
				return url;
			},
			
			filterASCIIDigitSym: function (respLyr) {
				if (respLyr!= null && respLyr != "") {
					respLyr = escape(respLyr)
					respLyr = respLyr.replace(/%../g, "");
					respLyr = respLyr.replace(/\./g, "");
					respLyr = respLyr.replace(/'/g, "");
					respLyr = unescape(respLyr);
				}
				
				return respLyr;
			},
			
			getLyrics: function (artist, album, track, cbFn) {
				
				if (album == "") {
					cbFn("");
					return;
				}
				
				var sourceObj = this;
				
				var url = this.getUrl(artist, album, track);
				
				var req = new XMLHttpRequest();
				if (!req) {
					cbFn("");
					return;
				}
				
				mlyrics.lib.debugOutput("Fetch: " + url);
				
				req.open("GET", url, true);
				
				var abortTimeout = setTimeout(function () {req.abort(); cbFn("");}, mlyrics.fetch.abortTimeout);
				
				req.onreadystatechange = function() {
					
					if (typeof(mlyrics.pane) != "undefined" && 
					    mlyrics.pane.playlistPlaybackServiceListener.curMediaItem != mlyrics.fetch.fetchMediaItem)
					{
						mlyrics.lib.debugOutput("Fetch1 abort - track changed");
						clearTimeout(abortTimeout);
						this.abort();
						return;
					}
					
					if (this.readyState != 4) return;
					
					mlyrics.lib.debugOutput("Got lyrics data");
					
					clearTimeout(abortTimeout);
					
					var respLyr = "";
					if (this.status == 200) {
						
						respLyr = sourceObj.filterText(this.responseText, sourceObj.getCleanStr(track));
						respLyr = sourceObj.fixCharacters(respLyr);
						respLyr = sourceObj.fixGeneralCharacters(respLyr);
					}
					
					cbFn(respLyr);
				}
				
				req.onerror = function () {clearTimeout(abortTimeout);};
				
				req.send(null);
			},
			
			filterText: function (respLyr, search_track) {
				if (respLyr == null || respLyr == "") return "";
				
				if (respLyr.indexOf("\u00E4") == -1) {
				  var _search_track = search_track.replace(/\u00E4/g, "\uFFFD");
				}
				else {
				  var _search_track = search_track
				}
				
				var exprSong = new RegExp(_search_track + "</a></h3>", "i");
				var songPos = respLyr.search(exprSong);
				if (songPos != -1) {
				  var songPosStart = respLyr.indexOf("\n", songPos);
				  var songPosEnd = respLyr.indexOf("<br />\n<h3>", songPosStart);
				  if (songPosEnd == -1) {
					  songPosEnd = respLyr.indexOf("<br />\n\r", songPosStart);
				  }
				  
				  respLyr = respLyr.substring(songPosStart+1, songPosEnd);
				}
				else {
				  mlyrics.lib.debugOutput("position 1 not found")
				  respLyr = "";
				}
				
				return respLyr;
			},
			
			fixCharacters: function(respLyr) {
				if (respLyr== null || respLyr == "") return "";
				
				respLyr = respLyr.replace(/^[ \t]+/, "");
				respLyr = respLyr.replace(/\n<br>/g, "\n");
				respLyr = respLyr.replace(/<br>/g, "");
				respLyr = respLyr.replace(/<br \/>/g, "");
				respLyr = respLyr.replace(/<i>/g, "");
				respLyr = respLyr.replace(/<\/i>/g, "");
				respLyr = respLyr.replace(/\t/g, "");
				respLyr = respLyr.replace(/\uFFFD/g, "'");
				respLyr = respLyr.replace(/\r\n/g, "\n");
				  
				return respLyr;
			}
		},
		
		// http://azlyrics.com
		// ===================
		AZLYRICS: {
			
			getUrl: function (artist, album, track) {
				var _artist = encodeURIComponent( this.filterASCIIDigitSym( this.getCleanStr(artist).toLowerCase() ) );
				var _track = encodeURIComponent( this.filterASCIIDigitSym( this.getCleanStr(track).toLowerCase() ) );
				
				var url= "http://www.azlyrics.com/lyrics/" + _artist + "/" + _track + ".html";
				return url;
			},
			
			filterASCIIDigitSym: function (respLyr) {
				if (respLyr!= null && respLyr != "") {
					respLyr = escape(respLyr)

					respLyr = respLyr.replace(/%../g, "");
					respLyr = respLyr.replace(/\./g, "");
					respLyr = respLyr.replace(/'/g, "");
					respLyr = unescape(respLyr);
				}
				
				return respLyr;
			},
			
			getLyrics: function (artist, album, track, cbFn) {
				
				if (album == "") {
					cbFn("");
					return;
				}
				
				var sourceObj = this;
				
				var url = this.getUrl(artist, album, track);
				
				var req = new XMLHttpRequest();
				if (!req) {
					cbFn("");
					return;
				}
				
				mlyrics.lib.debugOutput("Fetch: " + url);
				
				req.open("GET", url, true);
				
				var abortTimeout = setTimeout(function () {req.abort(); cbFn("");}, mlyrics.fetch.abortTimeout);
				
				req.onreadystatechange = function() {
					
					if (typeof(mlyrics.pane) != "undefined" && 
					    mlyrics.pane.playlistPlaybackServiceListener.curMediaItem != mlyrics.fetch.fetchMediaItem)
					{
						mlyrics.lib.debugOutput("Fetch1 abort - track changed");
						clearTimeout(abortTimeout);
						this.abort();
						return;
					}
					
					if (this.readyState != 4) return;
					
					mlyrics.lib.debugOutput("Got lyrics data");
					
					clearTimeout(abortTimeout);
					
					var respLyr = "";
					if (this.status == 200) {
						
						respLyr = sourceObj.filterText(this.responseText);
						respLyr = sourceObj.fixCharacters(respLyr);
						respLyr = sourceObj.fixGeneralCharacters(respLyr);
					}
					
					cbFn(respLyr);
				}
				
				req.onerror = function () {clearTimeout(abortTimeout);};
				
				req.send(null);
			},
			
			filterText: function (respLyr) {
				if (respLyr == null || respLyr == "") return "";
				
				var songStartPos = respLyr.indexOf("<!-- start of lyrics -->");
				if (songStartPos != -1) {
				  var songEndPos = respLyr.indexOf("<!-- end of lyrics -->");
				  respLyr = respLyr.substring(songStartPos+26, songEndPos);
				}
				else {
				  respLyr = "";
				}
				
				return respLyr;
			},
			
			fixCharacters: function(respLyr) {
				if (respLyr== null || respLyr == "") return "";
				
				respLyr = respLyr.replace(/\n<br>/g, "\n");
				respLyr = respLyr.replace(/<br>/g, "");
				respLyr = respLyr.replace(/<i>/g, "");
				respLyr = respLyr.replace(/<\/i>/g, "");
				respLyr = respLyr.replace(/\r\n/g, "\n");
				
				return respLyr;
			}
		},
		
		// http://batlyrics.com
		// ====================
		BATLYRICS: {
			getUrl: function (artist, album, track) {
				var _artist = encodeURIComponent( this.getCleanStr(artist).toLowerCase().replace(/ /g, "_") );
				var _track = encodeURIComponent( this.getCleanStr(track).toLowerCase().replace(/ /g, "_") );
				
				var url= "http://batlyrics.com/" + _track + "-lyrics-" + _artist + ".html";
				return url;
			},
			
			getLyrics: function (artist, album, track, cbFn) {
				
				if (album == "") {
					cbFn("");
					return;
				}
				
				var sourceObj = this;
				
				var url = this.getUrl(artist, album, track);
				
				var req = new XMLHttpRequest();
				if (!req) {
					cbFn("");
					return;
				}
				
				mlyrics.lib.debugOutput("Fetch: " + url);
				
				req.open("GET", url, true);
				
				var abortTimeout = setTimeout(function () {req.abort(); cbFn("");}, mlyrics.fetch.abortTimeout);
				
				req.onreadystatechange = function() {
					
					if (typeof(mlyrics.pane) != "undefined" && 
					    mlyrics.pane.playlistPlaybackServiceListener.curMediaItem != mlyrics.fetch.fetchMediaItem)
					{
						mlyrics.lib.debugOutput("Fetch1 abort - track changed");
						clearTimeout(abortTimeout);
						this.abort();
						return;
					}
					
					if (this.readyState != 4) return;
					
					mlyrics.lib.debugOutput("Got lyrics data");
					
					clearTimeout(abortTimeout);
					
					var respLyr = "";
					if (this.status == 200) {
						
						respLyr = sourceObj.filterText(this.responseText);
						respLyr = sourceObj.fixCharacters(respLyr);
						respLyr = sourceObj.fixGeneralCharacters(respLyr);
					}
					
					cbFn(respLyr);
				}
				
				req.onerror = function () {clearTimeout(abortTimeout);};
				
				req.send(null);
			},
			
			filterText: function (respLyr) {
				if (respLyr == null || respLyr == "") return "";
				
				var songStartPos = respLyr.indexOf("<pre id=\"from_pre\">");
				if (songStartPos != -1) {
				  var songEndPos = respLyr.indexOf("</pre>", songStartPos);
				  respLyr = respLyr.substring(songStartPos+19, songEndPos);
				}
				else {
				  respLyr = "";
				}
				
				return respLyr;
			},
			
			fixCharacters: function(respLyr) {
				if (respLyr== null || respLyr == "") return "";
				
				respLyr = respLyr.replace(/\n<span.*<\/span>/g, "");
				respLyr = respLyr.replace(/ <br>/g, "\n");
				respLyr = respLyr.replace(/<br> /g, "\n");
				respLyr = respLyr.replace(/<br>/g, "\n");
				respLyr = respLyr.replace(/\r\n/g, "\n");
				
				return respLyr;
			}
		},
		
		// http://metrolyrics.com
		// ======================
		METROLYRICS: {
			getUrl: function (artist, album, track) {
				var _artist = encodeURIComponent( this.filterASCIIDigitSym( this.getCleanStr(artist).toLowerCase().replace(/ /g, "-") ) );
				var _track = encodeURIComponent( this.filterASCIIDigitSym( this.getCleanStr(track).toLowerCase().replace(/ /g, "-") ) );
				
				var url= "http://www.metrolyrics.com/" + _track + "-lyrics-" + _artist + ".html";
				return url;
			},
			
			filterASCIIDigitSym: function (respLyr) {
				if (respLyr!= null && respLyr != "") {
					respLyr = escape(respLyr)
					respLyr = respLyr.replace(/%../g, "");
					respLyr = respLyr.replace(/\./g, "");
					respLyr = respLyr.replace(/'/g, "");
					respLyr = unescape(respLyr);
				}
				
				return respLyr;
			},
			
			getLyrics: function (artist, album, track, cbFn) {
				
				if (album == "") {
					cbFn("");
					return;
				}
				
				var sourceObj = this;
				
				var url = this.getUrl(artist, album, track);
				
				var req = new XMLHttpRequest();
				if (!req) {
					cbFn("");
					return;
				}
				
				mlyrics.lib.debugOutput("Fetch: " + url);
				
				req.open("GET", url, true);
				
				var abortTimeout = setTimeout(function () {req.abort(); cbFn("");}, mlyrics.fetch.abortTimeout);
				
				req.onreadystatechange = function() {
					
					if (typeof(mlyrics.pane) != "undefined" && 
					    mlyrics.pane.playlistPlaybackServiceListener.curMediaItem != mlyrics.fetch.fetchMediaItem)
					{
						mlyrics.lib.debugOutput("Fetch1 abort - track changed");
						clearTimeout(abortTimeout);
						this.abort();
						return;
					}
					
					if (this.readyState != 4) return;
					
					mlyrics.lib.debugOutput("Got lyrics data");
					
					clearTimeout(abortTimeout);
					
					var respLyr = "";
					if (this.status == 200) {
						
						respLyr = sourceObj.filterText(this.responseText, sourceObj.getCleanStr(artist), sourceObj.getCleanStr(track));
						respLyr = sourceObj.fixCharacters(respLyr);
						respLyr = sourceObj.fixGeneralCharacters(respLyr);
					}
					
					cbFn(respLyr);
				}
				
				req.onerror = function () {clearTimeout(abortTimeout);};
				
				req.send(null);
			},
			
			filterText: function (respLyr, artist, track) {
				if (respLyr == null || respLyr == "") return "";
				
				// Verify title to make sure metrolyrics didn't redirect to another track
				var titleStartPos = respLyr.indexOf("<title>");
				if (titleStartPos != -1) {
					var titleEndPos = respLyr.indexOf("</title>");
					var respTitle = respLyr.substring(titleStartPos+7, titleEndPos);
					var titleCheck = artist.toLowerCase() + " - " + track.toLowerCase() + " lyrics";
					if (titleCheck != respTitle.toLowerCase()) {
						mlyrics.lib.debugOutput("Redirected and track " + titleCheck + " doesn't match " + respTitle.toLowerCase() + " the one we're looking for");
						return "";
					}
				}
				else {
					mlyrics.lib.debugOutput("No title found, broken page?");
					return "";
				}
				
				var songStartPos = respLyr.indexOf("id=\"lyrics\">");
				if (songStartPos != -1) {
					var songEndPos = respLyr.indexOf("<br /><br /></div>");
					respLyr = respLyr.substring(songStartPos+12, songEndPos);
				}
				else {
					respLyr = "";
				}
				
				return respLyr;
			},
			
			fixCharacters: function(respLyr) {
				if (respLyr== null || respLyr == "") return "";
				respLyr = respLyr.replace(/<br \/><span.*<\/span><br \/><br \/>/g, "");
				
				if (respLyr.indexOf("<br />&#10;") == -1) {
					respLyr = respLyr.replace(/<br \/>/g, "&#10;");
				}
				else {
					respLyr = respLyr.replace(/<br \/>/g, "");
				}
				
				respLyr = this.specCharsDecode(respLyr);
				respLyr = respLyr.replace(/\r\n/g, "\n");
				
				respLyr = respLyr.substr(0, respLyr.length-1);
				
				return respLyr;
			},
			
			specCharsDecode: function (inString) {
				var outString = "";
				inString = inString.replace(/&#/g, "");
				var inArray = inString.split(";");
				
				for (var i=0; i<inArray.length; i++) {
					if (!parseInt(inArray[i], 10)) {
						switch (inArray[i]) {
							case "&nbsp":
								outString += " ";
								break;
								
							default:
								mlyrics.lib.debugOutput("Unexpected lyrics symbol '" + inArray[i] + "', filtered");
								break;
						}
					}
					else {
						outString += String.fromCharCode(inArray[i]);
					}
				}
				
				return outString;
			}
		},
		
		// http://lyricwiki.org
		// ====================
		LWIKI: {
			getUrl: function (artist, album, track) {
				var url = "http://lyrics.wikia.com/api.php?action=lyrics&fmt=json&func=getSong&artist=" + encodeURIComponent( this.getCleanStr(artist) ) +
														"&song=" + encodeURIComponent( this.getCleanStr(track) );
				return url;
			},
			
			getLyrics: function (artist, album, track, cbFn) {
				
				var url = this.getUrl(artist, album, track);
				
				var sourceObj = this;
				
				var req = new XMLHttpRequest();
				if (!req) {
					cbFn("");
					return;
				}
				
				mlyrics.lib.debugOutput("Fetch: " + url);
				
				req.open("GET", url, true);
				
				var abortTimeout = setTimeout(function () {req.abort(); cbFn("");}, mlyrics.fetch.abortTimeout);
				
				req.onreadystatechange = function() {
					
					if (typeof(mlyrics.pane) != "undefined" && 
					    mlyrics.pane.playlistPlaybackServiceListener.curMediaItem != mlyrics.fetch.fetchMediaItem)
					{
						mlyrics.lib.debugOutput("Fetch1 abort - track changed");
						clearTimeout(abortTimeout);
						this.abort();
						return;
					}
					
					if (this.readyState != 4) return;
					
					mlyrics.lib.debugOutput("Got lyrics data");
					
					clearTimeout(abortTimeout);
					
					var respLyr = "";
					if (this.status == 200) {
						respLyr = this.responseText;
						
						var songUrlStartPos = respLyr.indexOf("'url':'");
						if (songUrlStartPos != -1) {
							var songUrlEndPos = respLyr.indexOf("'", songUrlStartPos+7);
							var songUrl = respLyr.substring(songUrlStartPos+7, songUrlEndPos);
							
							sourceObj.getLyrics2(songUrl, cbFn);
						}
						else {
							cbFn("");
						}
					}
					else {
						cbFn("");
					}
				}
				
				req.onerror = function () {clearTimeout(abortTimeout);};
				
				req.send(null);
			},
			
			getLyrics2: function (songUrl, cbFn) {
				mlyrics.lib.debugOutput("Fetch2: " + songUrl);
				
				var req2 = new XMLHttpRequest();
				if (!req2) {
					cbFn("");
					return;
				}
				
				var sourceObj = this;
				
				req2.open("GET", songUrl, true);
				
				var abortTimeout = setTimeout(function () {req2.abort(); cbFn("");}, mlyrics.fetch.abortTimeout);
				
				req2.onreadystatechange = function () {
					
					if (typeof(mlyrics.pane) != "undefined" && 
					    mlyrics.pane.playlistPlaybackServiceListener.curMediaItem != mlyrics.fetch.fetchMediaItem)
					{
						mlyrics.lib.debugOutput("Fetch2 abort - track changed");
						clearTimeout(abortTimeout);
						this.abort();
						return;
					}
					
					if (this.readyState != 4) return;
					
					mlyrics.lib.debugOutput("Got2 lyrics data");
					
					clearTimeout(abortTimeout);
					
					if (this.status == 200) {
						var respLyr = this.responseText;
						if (respLyr.substr(0, 6) == "error:") respLyr = "";
					}
					else {
						var respLyr = "";
					}
					
					respLyr = sourceObj.filterText(respLyr);
					respLyr = sourceObj.fixCharacters(respLyr);
					
					// If text not full skip it.
					if (respLyr.indexOf("[...]") != -1) respLyr = "";
					
					respLyr = sourceObj.fixGeneralCharacters(respLyr);
					
					cbFn(respLyr);
				}
				
				req2.onerror = function () {clearTimeout(abortTimeout);};
				
				req2.send(null);
			},
			
			filterText: function (respLyr) {
				if (respLyr == null || respLyr == "") return "";
				
				var lyrFirstPos = respLyr.indexOf("</a></div>&");
				if (lyrFirstPos != -1) {
					var lyrLastPos = respLyr.indexOf("<!--", lyrFirstPos);
					respLyr = respLyr.substring(lyrFirstPos+10, lyrLastPos);
				}
				else {
					respLyr = "";
				}
				      
				return respLyr;
			},
			
			fixCharacters: function(respLyr) {
				if (respLyr== null || respLyr == "") return "";
				
				respLyr = respLyr.replace(/<br \/>/g, "&#10;");
				respLyr = this.specCharsDecode(respLyr);
				respLyr = respLyr.replace(/\r\n/g, "\n");
				
				//respLyr = respLyr.substr(0, respLyr.length-1);
					
				return respLyr;
			},
			
			specCharsDecode: function (inString) {
				var outString = "";
				inString = inString.replace(/&#/g, "");
				var inArray = inString.split(";");
				
				for (var i=0; i<inArray.length; i++) {
					if (!parseInt(inArray[i], 10)) {
						switch (inArray[i]) {
							case "&nbsp":
								outString += " ";
								break;
								
							default:
								mlyrics.lib.debugOutput("Unexpected lyrics symbol '" + inArray[i] + "', filtered");
								break;
						}
					}
					else {
						outString += String.fromCharCode(inArray[i]);
					}
				}
				
				return outString;
			}
		},
		
		// http://chartlyrics.com
		// ======================
		CHARTLYRICS: {
			getUrl: function (artist, album, track) {
				var url = "http://api.chartlyrics.com/apiv1.asmx/SearchLyric?artist=" + encodeURIComponent( this.getCleanStr(artist) ) +
												"&song=" + encodeURIComponent( this.getCleanStr(track) );
				return url;
			},
			
			getLyrics: function (artist, album, track, cbFn) {
				
				if (album == "") {
					cbFn("");
					return;
				}
				
				var sourceObj = this;
				
				var url = this.getUrl(artist, album, track);
				
				var req = new XMLHttpRequest();
				if (!req) {
					cbFn("");
					return;
				}
				
				mlyrics.lib.debugOutput("Fetch: " + url);
				
				req.open("GET", url, true);
				
				var abortTimeout = setTimeout(function () {req.abort(); cbFn("");}, mlyrics.fetch.abortTimeout);
				
				req.onreadystatechange = function() {
					
					if (typeof(mlyrics.pane) != "undefined" && 
					    mlyrics.pane.playlistPlaybackServiceListener.curMediaItem != mlyrics.fetch.fetchMediaItem)
					{
						mlyrics.lib.debugOutput("Fetch1 abort - track changed");
						clearTimeout(abortTimeout);
						this.abort();
						return;
					}
					
					if (this.readyState != 4) return;
					
					mlyrics.lib.debugOutput("Got lyrics data");
					
					clearTimeout(abortTimeout);
					
					var respLyr = "";
					if (this.status == 200) {
						respLyr = this.responseText;
						
						if (respLyr.indexOf("<ArrayOfSearchLyricResult") != -1) {
							var respArr = respLyr.split("</SearchLyricResult>")
							for (var i=0; i<respArr.length; i++) {
								var songNameStart = respArr[i].indexOf("<Song>");
								if (songNameStart != -1) {
									var songNameEnd = respArr[i].indexOf("</Song>", songNameStart);
									var songName = respArr[i].substring(songNameStart+6, songNameEnd);
									if (songName.toLowerCase() != track.toLowerCase()) continue;
									
									var lyricIdStart = respArr[i].indexOf("<LyricId>");
									if (lyricIdStart == -1) continue;
									var lyricIdEnd = respArr[i].indexOf("</LyricId>", lyricIdStart);
									var lyricId = respArr[i].substring(lyricIdStart+9, lyricIdEnd);
									
									var lyricChecksumStart = respArr[i].indexOf("<LyricChecksum>");
									if (lyricChecksumStart == -1) continue;
									var lyricChecksumEnd = respArr[i].indexOf("</LyricChecksum>", lyricChecksumStart);
									var lyricChecksum = respArr[i].substring(lyricChecksumStart+15, lyricChecksumEnd);
									
									sourceObj.getLyrics2(lyricId, lyricChecksum, cbFn);
									return;
								}
							}
						}
					}
					
					cbFn("");
				}
				
				req.onerror = function () {clearTimeout(abortTimeout);};
				
				req.send(null);
			},
			
			getLyrics2: function (lyricId, lyricChecksum, cbFn) {
				
				var songUrl = "http://api.chartlyrics.com/apiv1.asmx/GetLyric?lyricId=" + lyricId + "&lyricCheckSum=" + lyricChecksum;
				mlyrics.lib.debugOutput("Fetch2: " + songUrl);
				
				var req2 = new XMLHttpRequest();
				if (!req2) {
					cbFn("");
					return;
				}
				
				var sourceObj = this;
				
				req2.open("GET", songUrl, true);
				
				var abortTimeout = setTimeout(function () {req2.abort(); cbFn("");}, mlyrics.fetch.abortTimeout);
				
				req2.onreadystatechange = function () {
					
					if (typeof(mlyrics.pane) != "undefined" && 
					    mlyrics.pane.playlistPlaybackServiceListener.curMediaItem != mlyrics.fetch.fetchMediaItem)
					{
						mlyrics.lib.debugOutput("Fetch2 abort - track changed");
						clearTimeout(abortTimeout);
						this.abort();
						return;
					}
					
					if (this.readyState != 4) return;
					
					mlyrics.lib.debugOutput("Got2 lyrics data");
					
					clearTimeout(abortTimeout);
					
					if (this.status == 200) {
						var respLyr = this.responseText;
						
						var lyricStart = respLyr.indexOf("<Lyric>");
						var lyricEnd = respLyr.indexOf("</Lyric>");
						respLyr = respLyr.substring(lyricStart+7, lyricEnd);
					}
					else {
						var respLyr = "";
					}
					
					respLyr = sourceObj.filterText(this.responseText);
					respLyr = sourceObj.fixCharacters(respLyr);
					respLyr = sourceObj.fixGeneralCharacters(respLyr);
					
					cbFn(respLyr);
				}
				
				req2.onerror = function () {clearTimeout(abortTimeout);};
				
				req2.send(null);
			},
			
			filterText: function (respLyr) {
				if (respLyr == null || respLyr == "") return "";
				
				var songStartPos = respLyr.indexOf("<Lyric>");
				if (songStartPos != -1) {
				  var songEndPos = respLyr.indexOf("</Lyric>");
				  respLyr = respLyr.substring(songStartPos+7, songEndPos);
				}
				else {
				  respLyr = "";
				}
				
				return respLyr;
			},
			
			fixCharacters: function(respLyr) {
				if (respLyr== null || respLyr == "") return "";
				
				//respLyr = respLyr.replace(/\r\n/g, "\n");
				
				return respLyr;
			}
		},
		
		// http://lololyrics.com
		// =====================
		LOLOLYRICS: {
			getUrl: function (artist, album, track) {
				var url = "http://api.lololyrics.com/old/getLyric?artist=" + encodeURIComponent( this.getCleanStr(artist) ) + "&track=" + encodeURIComponent( this.getCleanStr(track) );
				return url;
			},
			
			getLyrics: function (artist, album, track, cbFn) {
				
				var url = this.getUrl(artist, album, track);
				
				var sourceObj = this;
				
				var req = new XMLHttpRequest();
				if (!req) {
					cbFn("");
					return;
				}
				
				mlyrics.lib.debugOutput("Fetch: " + url);
				
				req.open("GET", url, true);
				
				var abortTimeout = setTimeout(function () {req.abort(); cbFn("");}, mlyrics.fetch.abortTimeout);
				
				req.onreadystatechange = function() {
					
					if (typeof(mlyrics.pane) != "undefined" && 
					    mlyrics.pane.playlistPlaybackServiceListener.curMediaItem != mlyrics.fetch.fetchMediaItem)
					{
						mlyrics.lib.debugOutput("Fetch1 abort - track changed");
						clearTimeout(abortTimeout);
						this.abort();
						return;
					}
					
					if (this.readyState != 4) return;
					
					mlyrics.lib.debugOutput("Got lyrics data");
					
					clearTimeout(abortTimeout);
					
					var respLyr = "";
					if (this.status == 200) {
						respLyr = sourceObj.filterText(this.responseText);
						respLyr = sourceObj.fixCharacters(respLyr);
						respLyr = sourceObj.fixGeneralCharacters(respLyr);
					}
					
					cbFn(respLyr);
				}
				
				req.onerror = function () {clearTimeout(abortTimeout);};
				
				req.send(null);
			},
			
			filterText: function (respLyr) {
				if (respLyr == null || respLyr == "") return "";
				
				var lyrFirstPos = respLyr.indexOf("<response>");
				if (lyrFirstPos != -1) {
					var lyrLastPos = respLyr.indexOf("</response>", lyrFirstPos);
					respLyr = respLyr.substring(lyrFirstPos+10, lyrLastPos);
				}
				else {
					respLyr = "";
				}
				      
				return respLyr;
			},
			
			fixCharacters: function(respLyr) {
				if (respLyr== null || respLyr == "") return "";
				
				respLyr = respLyr.replace(/<br \/>/g, "");
				//respLyr = respLyr.replace(/\r\n/g, "\n");
				
				respLyr = respLyr.substr(0, respLyr.length-4);
					
				return respLyr;
			}
		},
		
		// http://goodsongs.com.ua
		// =======================
		GOODSONGS: {
			getUrl: function (artist, album, track) {
				var _artist = escape( this.utf8_decode( this.getCleanStr(artist) ) );
				var _track = escape( this.utf8_decode( this.getCleanStr(track) ) );
				
				var url = "http://goodsongs.com.ua/songsapi.php?method=gettext&artist=" + _artist + "&song=" + _track;
				return url;
			},
			
			utf8_decode: function (aa) {
				var bb = '', c = 0;
				for (var i = 0; i < aa.length; i++) {
					c = aa.charCodeAt(i);
					if (c > 127) {
					if (c > 1024) {
						if (c == 1025) {
						c = 1016;
						} else if (c == 1105) {
						c = 1032;
						}
						bb += String.fromCharCode(c - 848);
					}
					} else {
					bb += aa.charAt(i);
					}
				}
				return bb;
			},
			
			getLyrics: function (artist, album, track, cbFn) {
				
				if (album == "") {
					cbFn("");
					return;
				}
				
				var sourceObj = this;
				
				var url = this.getUrl(artist, album, track);
				
				var req = new XMLHttpRequest();
				if (!req) {
					cbFn("");
					return;
				}
				
				mlyrics.lib.debugOutput("Fetch: " + url);
				
				req.open("GET", url, true);
				
				var abortTimeout = setTimeout(function () {req.abort(); cbFn("");}, mlyrics.fetch.abortTimeout);
				
				req.onreadystatechange = function() {
					
					if (typeof(mlyrics.pane) != "undefined" && 
					    mlyrics.pane.playlistPlaybackServiceListener.curMediaItem != mlyrics.fetch.fetchMediaItem)
					{
						mlyrics.lib.debugOutput("Fetch1 abort - track changed");
						clearTimeout(abortTimeout);
						this.abort();
						return;
					}
					
					if (this.readyState != 4) return;
					
					mlyrics.lib.debugOutput("Got lyrics data");
					
					clearTimeout(abortTimeout);
					
					var respLyr = "";
					if (this.status == 200) {
						respLyr = sourceObj.filterText(this.responseText);
						respLyr = sourceObj.fixCharacters(respLyr);
						respLyr = sourceObj.fixGeneralCharacters(respLyr);
					}
					
					cbFn(respLyr);
				}
				
				req.onerror = function () {clearTimeout(abortTimeout);};
				
				req.send(null);
			},
			
			filterText: function (respLyr) {
				if (respLyr == null || respLyr == "") return "";
				
				if (respLyr.substr(0, 3) == "no_") {
				  respLyr = "";
				}
				
				return respLyr;
			},
			
			fixCharacters: function(respLyr) {
				if (respLyr == null || respLyr == "") return "";
				
				respLyr = respLyr.replace(/<br \/>/g, "");
				//respLyr = respLyr.replace(/\r\n/g, "\n");
				
				return respLyr;
			}
		},
		
		// http://jpopasia.com
		// ===================
		JPOPASIA: {
			getUrl: function (artist, album, track) {
				var url = "http://www.jpopasia.com/lyrics/" + encodeURIComponent( this.getCleanStr(artist).replace(/ /g, "_") );
				return url;
			},
			
			getLyrics: function (artist, album, track, cbFn) {
				
				var url = this.getUrl(artist, album, track);
				
				var sourceObj = this;
				
				var req = new XMLHttpRequest();
				if (!req) {
					cbFn("");
					return;

				}
				
				mlyrics.lib.debugOutput("Fetch: " + url);
				
				req.open("GET", url, true);
				
				var abortTimeout = setTimeout(function () {req.abort(); cbFn("");}, mlyrics.fetch.abortTimeout);
				
				req.onreadystatechange = function() {
					
					if (typeof(mlyrics.pane) != "undefined" && 
					    mlyrics.pane.playlistPlaybackServiceListener.curMediaItem != mlyrics.fetch.fetchMediaItem)
					{
						mlyrics.lib.debugOutput("Fetch1 abort - track changed");
						clearTimeout(abortTimeout);
						this.abort();
						return;
					}
					
					if (this.readyState != 4) return;
					
					mlyrics.lib.debugOutput("Got lyrics data");
					
					clearTimeout(abortTimeout);
					
					var respLyr = "";
					if (this.status == 200) {
						respLyr = this.responseText;
						
						var exprSong = new RegExp("\"><a href=\"http:\/\/www.jpopasia.com\/lyrics\/.*<b>" + sourceObj.getCleanStr(track), "i");
						var songUrlStartPos = respLyr.search(exprSong);
						if (songUrlStartPos != -1) {
							var songUrlEndPos = respLyr.indexOf("\"", songUrlStartPos+12);
							var songUrl = respLyr.substring(songUrlStartPos+11, songUrlEndPos);
							
							sourceObj.getLyrics2(songUrl, cbFn);
						}
						else {
							cbFn("");
						}
					}
					else {
						cbFn("");
					}
				}
				
				req.onerror = function () {clearTimeout(abortTimeout);};
				
				req.send(null);
			},
			
			getLyrics2: function (songUrl, cbFn) {
				mlyrics.lib.debugOutput("Fetch2: " + songUrl);
				
				var req2 = new XMLHttpRequest();
				if (!req2) {
					cbFn("");
					return;
				}
				
				var sourceObj = this;
				
				req2.open("GET", songUrl, true);
				
				var abortTimeout = setTimeout(function () {req2.abort(); cbFn("");}, mlyrics.fetch.abortTimeout);
				
				req2.onreadystatechange = function () {
					
					if (typeof(mlyrics.pane) != "undefined" && 
					    mlyrics.pane.playlistPlaybackServiceListener.curMediaItem != mlyrics.fetch.fetchMediaItem)
					{
						mlyrics.lib.debugOutput("Fetch2 abort - track changed");
						clearTimeout(abortTimeout);
						this.abort();
						return;
					}
					
					if (this.readyState != 4) return;
					
					mlyrics.lib.debugOutput("Got2 lyrics data");
					
					clearTimeout(abortTimeout);
					
					if (this.status == 200) {
						var respLyr = this.responseText;
					}
					else {
						var respLyr = "";
					}
					
					respLyr = sourceObj.filterText(respLyr);
					respLyr = sourceObj.fixCharacters(respLyr);
					respLyr = sourceObj.fixGeneralCharacters(respLyr);
					
					cbFn(respLyr);
				}
				
				req2.onerror = function () {clearTimeout(abortTimeout);};
				
				req2.send(null);
			},
			
			filterText: function (respLyr) {
				if (respLyr == null || respLyr == "") return "";
				
				var KrespLyr = "";
				var RrespLyr = "";
				var TrespLyr = "";
				
				var KlyrStart = respLyr.indexOf("<h1>Kanji Lyric</h1>");
				if (KlyrStart != -1) {
					var KlyrFirstPos = respLyr.indexOf("<td colspan=\"2\"><br/>", KlyrStart);
					var KlyrLastPos = respLyr.indexOf("<br />\r\n<br />\r\n<br />\r\n<br />\r\n", KlyrFirstPos);
					if (KlyrLastPos == -1) {
						KlyrLastPos = respLyr.indexOf("<br/><br/>", KlyrFirstPos);
					}
					KrespLyr = respLyr.substring(KlyrFirstPos+21, KlyrLastPos);
					
					KrespLyr = KrespLyr.replace(/<br \/>/g, "");
					KrespLyr = KrespLyr.replace(/\r\n/g, "\n");
					KrespLyr = this.specCharsDecode2(KrespLyr);
				}
				
				/*var RlyrStart = respLyr.indexOf("<h1>Romaji Lyric</h1>");
				if (RlyrStart != -1) {
					var RlyrFirstPos = respLyr.indexOf("<td colspan=\"2\"><br/>", RlyrStart);
					var RlyrLastPos = respLyr.indexOf("<br />\r\n<br />\r\n<br />\r\n<br />\r\n", RlyrFirstPos);
					RrespLyr = respLyr.substring(RlyrFirstPos+21, RlyrLastPos);
					
					RrespLyr = RrespLyr.replace(/<br \/>/g, "");
					RrespLyr = RrespLyr.replace(/\r\n/g, "\n");
				}*/
				
				var TlyrStart = respLyr.indexOf("<h1>Lyric Translation</h1>");
				if (mlyrics.fetch.prefs.getCharPref("trLang") == "en" && TlyrStart != -1) {
					var TlyrFirstPos = respLyr.indexOf("<td colspan=\"2\"><br/>", TlyrStart);
					var TlyrLastPos = respLyr.indexOf("<br />\r\n<br />\r\n<br />\r\n", TlyrFirstPos);
					if (TlyrLastPos == -1) {
						TlyrLastPos = respLyr.indexOf("<br/><br/>", TlyrFirstPos);
					}
					TrespLyr = respLyr.substring(TlyrFirstPos+21, TlyrLastPos);
					
					TrespLyr = TrespLyr.replace(/<br \/>/g, "");
					TrespLyr = TrespLyr.replace(/\r\n/g, "\n");
				}
				
					
				respLyr = KrespLyr;
				
				/*if (RrespLyr != "") {
					var Rdelimiter = "\n\n =================== \n ( Romaji Lyrics ) \n =================== \n\n";
					
					if (KrespLyr != "") {
						respLyr = respLyr + Rdelimiter + RrespLyr;
					}
					else {
						respLyr = RrespLyr;
					}
				}*/
				
				if (TrespLyr != "") {
					var Tdelimiter = "\n\n =================== \n [ English Translated ] \n =================== \n\n";
					
					if (KrespLyr != "" || RrespLyr != "") {
						respLyr = respLyr + Tdelimiter + TrespLyr;
					}
					else {
						respLyr = TrespLyr;
					}
				}
				      
				return respLyr;
			},
			
			fixCharacters: function(respLyr) {
				if (respLyr== null || respLyr == "") return "";
				
				respLyr = respLyr.replace(/\r\n/g, "\n");
				
				return respLyr;
			},
			
			specCharsDecode2: function (inString) {
				var outString = "";
				var i=0;
				while (i<inString.length) {
					if (inString.substr(i, 1) == "&" &&
						inString.substr(i+1, 1) == "#") {
						i+=2;
						var tempString = "";
						while (inString.substr(i, 1) != ";" && i<inString.length) {
							tempString += inString.substr(i, 1) + "";
							i++;
						}
						outString += String.fromCharCode(tempString) + "";
					}
					else {
						outString += inString.substr(i, 1);
					}
					i++;
				}
				return outString;
			}
		},
		
		// http://lyricsvip.com
		// ====================
		LYRICSVIP: {
			getUrl: function (artist, album, track) {
				var url = "http://www.lyricsvip.com/" + encodeURIComponent(this.getCleanStr(artist).replace(/ /g, "-")) + "-Lyrics.html";
				return url;
			},
			
			getLyrics: function (artist, album, track, cbFn) {
				
				var url = this.getUrl(artist, album, track);
				
				var sourceObj = this;
				
				var req = new XMLHttpRequest();
				if (!req) {
					cbFn("");
					return;
				}
				
				mlyrics.lib.debugOutput("Fetch: " + url);
				
				req.open("GET", url, true);
				
				var abortTimeout = setTimeout(function () {req.abort(); cbFn("");}, mlyrics.fetch.abortTimeout);
				
				req.onreadystatechange = function() {
					
					if (typeof(mlyrics.pane) != "undefined" && 
					    mlyrics.pane.playlistPlaybackServiceListener.curMediaItem != mlyrics.fetch.fetchMediaItem)
					{
						mlyrics.lib.debugOutput("Fetch1 abort - track changed");
						clearTimeout(abortTimeout);
						this.abort();
						return;
					}
					
					if (this.readyState != 4) return;
					
					mlyrics.lib.debugOutput("Got lyrics data");
					
					clearTimeout(abortTimeout);
					
					var respLyr = "";
					if (this.status == 200) {
						respLyr = this.responseText;
						
						var _track = track.replace(/\(/g, "\\(").replace(/\)/g, "\\)"); // replace () for regualr expression
						var _search_track = sourceObj.getCleanStr(track).replace(/\(/g, "\\(").replace(/\)/g, "\\)");
						
						var exprSong = new RegExp("<a href=\"http:\/\/www.lyricsvip.com\/.*-Lyrics.html\">" + _track + "<\/a><br \/>", "i");
						var songUrlStartPos = respLyr.search(exprSong);
						if (songUrlStartPos == -1) {
							exprSong = new RegExp("<a href=\"http:\/\/www.lyricsvip.com\/.*-Lyrics.html\">" + _search_track + "<\/a><br \/>", "i");
							songUrlStartPos = respLyr.search(exprSong);
						}
						
						if (songUrlStartPos != -1) {
							var songUrlEndPos = respLyr.indexOf("\"", songUrlStartPos+9);
							var songUrl = respLyr.substring(songUrlStartPos+9, songUrlEndPos);
							
							sourceObj.getLyrics2(songUrl, cbFn);
						}

						else {
							cbFn("");

						}
					}
					else {
						cbFn("");
					}
				}
				
				req.onerror = function () {clearTimeout(abortTimeout);};
				
				req.send(null);
			},
			
			getLyrics2: function (songUrl, cbFn) {
				mlyrics.lib.debugOutput("Fetch2: " + songUrl);
				
				var req2 = new XMLHttpRequest();
				if (!req2) {
					cbFn("");
					return;
				}
				
				var sourceObj = this;
				
				req2.open("GET", songUrl, true);
				
				var abortTimeout = setTimeout(function () {req2.abort(); cbFn("");}, mlyrics.fetch.abortTimeout);
				
				req2.onreadystatechange = function () {
					
					if (typeof(mlyrics.pane) != "undefined" && 
					    mlyrics.pane.playlistPlaybackServiceListener.curMediaItem != mlyrics.fetch.fetchMediaItem)
					{
						mlyrics.lib.debugOutput("Fetch2 abort - track changed");
						clearTimeout(abortTimeout);
						this.abort();
						return;
					}
					
					if (this.readyState != 4) return;
					
					mlyrics.lib.debugOutput("Got2 lyrics data");
					
					clearTimeout(abortTimeout);
					
					if (this.status == 200) {
						var respLyr = this.responseText;
						if (respLyr.substr(0, 6) == "error:") respLyr = "";
					}
					else {
						var respLyr = "";
					}
					
					respLyr = sourceObj.filterText(respLyr);
					respLyr = sourceObj.fixCharacters(respLyr);
					respLyr = sourceObj.fixGeneralCharacters(respLyr);
					
					cbFn(respLyr);
				}
				
				req2.onerror = function () {clearTimeout(abortTimeout);};
				
				req2.send(null);
			},
			
			filterText: function (respLyr) {
				if (respLyr == null || respLyr == "") return "";
				
				var lyrFirstPos = respLyr.indexOf("</h2>\n<br />\n");
				if (lyrFirstPos != -1) {
				var lyrLastPos = respLyr.indexOf("\n&nbsp;", lyrFirstPos);
					respLyr = respLyr.substring(lyrFirstPos+13, lyrLastPos);
				}
				else {
					respLyr = "";
				}
				      
				return respLyr;
			},
			
			fixCharacters: function(respLyr) {
				if (respLyr== null || respLyr == "") return "";
				
				respLyr = respLyr.replace(/<br \/>/g, "");
				//respLyr = respLyr.replace(/\r\n/g, "\n");
					
				return respLyr;
			}
		},
		
		// http://songteksten.net
		// ====================
		SONGTEKSTEN: {
			getUrl: function (artist, album, track) {
				var url = "http://songteksten.net/search/results.html?q=" + encodeURIComponent(this.getCleanStr(track)) + "&type=title";
				return url;
			},
			
			getLyrics: function (artist, album, track, cbFn) {
				
				var url = this.getUrl(artist, album, track);
				
				var sourceObj = this;
				
				var req = new XMLHttpRequest();
				if (!req) {
					cbFn("");
					return;
				}
				
				mlyrics.lib.debugOutput("Fetch: " + url);
				
				req.open("GET", url, true);
				
				var abortTimeout = setTimeout(function () {req.abort(); cbFn("");}, mlyrics.fetch.abortTimeout);
				
				req.onreadystatechange = function() {
					
					if (typeof(mlyrics.pane) != "undefined" && 
					    mlyrics.pane.playlistPlaybackServiceListener.curMediaItem != mlyrics.fetch.fetchMediaItem)
					{
						mlyrics.lib.debugOutput("Fetch1 abort - track changed");
						clearTimeout(abortTimeout);
						this.abort();
						return;
					}
					
					if (this.readyState != 4) return;
					
					mlyrics.lib.debugOutput("Got lyrics data");
					
					clearTimeout(abortTimeout);
					
					var respLyr = "";
					if (this.status == 200) {
						respLyr = this.responseText.toLowerCase();
						
						var _track = sourceObj.getCleanStr(track).toLowerCase();
						var _artist = sourceObj.getCleanStr(artist).toLowerCase();
						
						var songUrl = "";
						var tdPos = 0;
						while (true) {
							tdPos = respLyr.indexOf("<td><a href=", tdPos+1);
							if (tdPos == -1) break;
							
							var trackPosStart = respLyr.indexOf(_track + "</a></td>", tdPos);
							if (trackPosStart != -1) {
								var cuttedPieceEnd = respLyr.indexOf("</tr>", tdPos);
								var cuttedPiece = respLyr.substring(tdPos, cuttedPieceEnd);
								
								var artistStartPos = cuttedPiece.indexOf(">" + _artist + "</a></td>");
								if (artistStartPos != -1) {
									var songUrlEndPos = cuttedPiece.indexOf("\">");
									songUrl = cuttedPiece.substring(13, songUrlEndPos);
									break;
								}
							}
						}
						
						if (songUrl != "") {
							sourceObj.getLyrics2(songUrl, cbFn);
						}
						else {
							cbFn("");
						}
					}
					else {
						cbFn("");
					}
				}
				
				req.onerror = function () {clearTimeout(abortTimeout);};
				
				req.send(null);
			},
			
			getLyrics2: function (songUrl, cbFn) {
				mlyrics.lib.debugOutput("Fetch2: " + songUrl);
				
				var req2 = new XMLHttpRequest();
				if (!req2) {
					cbFn("");
					return;
				}
				
				var sourceObj = this;
				
				req2.open("GET", songUrl, true);
				
				var abortTimeout = setTimeout(function () {req2.abort(); cbFn("");}, mlyrics.fetch.abortTimeout);
				
				req2.onreadystatechange = function () {
					
					if (typeof(mlyrics.pane) != "undefined" && 
					    mlyrics.pane.playlistPlaybackServiceListener.curMediaItem != mlyrics.fetch.fetchMediaItem)
					{
						mlyrics.lib.debugOutput("Fetch2 abort - track changed");
						clearTimeout(abortTimeout);
						this.abort();
						return;
					}
					
					if (this.readyState != 4) return;
					
					mlyrics.lib.debugOutput("Got2 lyrics data");
					
					clearTimeout(abortTimeout);
					
					if (this.status == 200) {
						var respLyr = this.responseText;
					}
					else {
						var respLyr = "";
					}
					
					respLyr = sourceObj.filterText(respLyr);
					respLyr = sourceObj.fixCharacters(respLyr);
					respLyr = sourceObj.fixGeneralCharacters(respLyr);
					
					cbFn(respLyr);
				}
				
				req2.onerror = function () {clearTimeout(abortTimeout);};
				
				req2.send(null);
			},
			
			filterText: function (respLyr) {
				if (respLyr == null || respLyr == "") return "";
				
				var lyrFirstPos = respLyr.indexOf("</h1>");
				if (lyrFirstPos != -1) {
				var lyrLastPos = respLyr.indexOf("<div id=\"social\">", lyrFirstPos);
					respLyr = respLyr.substring(lyrFirstPos+6, lyrLastPos);
				}
				else {
					respLyr = "";
				}
				      
				return respLyr;
			},
			
			fixCharacters: function(respLyr) {
				if (respLyr== null || respLyr == "") return "";
				
				respLyr = respLyr.replace(/<br \/>/g, "");
				//respLyr = respLyr.replace(/\r\n/g, "\n");
					
				return respLyr;
			}
		},
		
		// http://www.hindilyrix.com
		// =========================
		HINDILYRICS: {
			getUrl: function (artist, album, track) {
				var url= "http://www.hindilyrix.com/songs/get_song_" + encodeURIComponent(track) + ".html"
				return url;
			},
			
			getLyrics: function (artist, album, track, cbFn) {
				
				if (album == "") {
					cbFn("");
					return;
				}
				
				var sourceObj = this;
				
				var url = this.getUrl(artist, album, track);
				
				var req = new XMLHttpRequest();
				if (!req) {
					cbFn("");
					return;
				}
				
				mlyrics.lib.debugOutput("Fetch: " + url);
				
				req.open("GET", url, true);
				
				var abortTimeout = setTimeout(function () {req.abort(); cbFn("");}, mlyrics.fetch.abortTimeout);
				
				req.onreadystatechange = function() {
					
					if (typeof(mlyrics.pane) != "undefined" && 
					    mlyrics.pane.playlistPlaybackServiceListener.curMediaItem != mlyrics.fetch.fetchMediaItem)
					{
						mlyrics.lib.debugOutput("Fetch1 abort - track changed");
						clearTimeout(abortTimeout);
						this.abort();
						return;
					}
					
					if (this.readyState != 4) return;
					
					mlyrics.lib.debugOutput("Got lyrics data");
					
					clearTimeout(abortTimeout);
					
					var respLyr = "";
					if (this.status == 200) {
						
						respLyr = sourceObj.filterText(this.responseText, sourceObj.getCleanStr(track));
						respLyr = sourceObj.fixCharacters(respLyr);
						respLyr = sourceObj.fixGeneralCharacters(respLyr);
					}
					
					cbFn(respLyr);
				}
				
				req.onerror = function () {clearTimeout(abortTimeout);};
				
				req.send(null);
			},
			
			filterText: function (respLyr, search_track) {
				if (respLyr == null || respLyr == "") return "";
				
				var lyrFirstPos = respLyr.indexOf("<pre>");
				if (lyrFirstPos != -1) {
				var lyrLastPos = respLyr.indexOf("</pre>", lyrFirstPos);
					respLyr = respLyr.substring(lyrFirstPos+5, lyrLastPos);
				}
				else {
					respLyr = "";
				}
				
				return respLyr;
			},
			
			fixCharacters: function(respLyr) {
				if (respLyr== null || respLyr == "") return "";
				
				respLyr = respLyr.replace(/\r\n/g, "\n");
				respLyr = respLyr.replace(/(\n|.)\[ .* \]/g, "");
				respLyr = respLyr.replace(/<font.*>/, "");
				respLyr = respLyr.replace(/<\/font>/, "");
				  
				return respLyr;
			}
		},
		
		// http://www.animelyrics.com
		// ==========================
		ANIMELYRICS: {
			getUrl: function (artist, album, track) {
				var url= "http://www.animelyrics.com/search.php?q=" + encodeURIComponent(track) + "&t=title";
				return url;
			},
			
			getLyrics: function (artist, album, track, cbFn) {
				
				var url = this.getUrl(artist, album, track);
				
				var sourceObj = this;
				
				var req = new XMLHttpRequest();
				if (!req) {
					cbFn("");
					return;
				}
				
				mlyrics.lib.debugOutput("Fetch: " + url);
				
				req.open("GET", url, true);
				
				var abortTimeout = setTimeout(function () {req.abort(); cbFn("");}, mlyrics.fetch.abortTimeout);
				
				req.onreadystatechange = function() {
					
					if (typeof(mlyrics.pane) != "undefined" && 
					    mlyrics.pane.playlistPlaybackServiceListener.curMediaItem != mlyrics.fetch.fetchMediaItem)
					{
						mlyrics.lib.debugOutput("Fetch1 abort - track changed");
						clearTimeout(abortTimeout);
						this.abort();
						return;
					}
					
					if (this.readyState != 4) return;
					
					mlyrics.lib.debugOutput("Got lyrics data");
					
					clearTimeout(abortTimeout);
					
					var respLyr = "";
					if (this.status == 200) {
						respLyr = this.responseText.toLowerCase();
						
						var _track = track.toLowerCase();
						var _artist = artist.toLowerCase();
						
						var songUrl = "";
						var tdPos = 0;
						while (true) {
							tdPos = respLyr.indexOf("</a> / <a href=", tdPos+1);
							if (tdPos == -1) break;
							
							var trackPosStart = respLyr.indexOf("><span class=highlight>" + _track + "</span></a>", tdPos);
							if (trackPosStart != -1) {
								var cuttedPieceEnd = respLyr.indexOf("<!-- result item end -->", tdPos);
								var cuttedPiece = respLyr.substring(tdPos, cuttedPieceEnd);
								
								var artistStartPos = cuttedPiece.indexOf(">" + _artist + "</a>");
								if (artistStartPos != -1) {
									var songUrlStartPos = cuttedPiece.indexOf("<!-- result item start --><a href=\"");
									var songUrlEndPos = cuttedPiece.indexOf("\">");
									songUrl = "http://www.animelyrics.com" + cuttedPiece.substring(songUrlStartPos+35, songUrlEndPos);
									break;
								}
							}
						}
						
						if (songUrl != "") {
							sourceObj.getLyrics2(songUrl, cbFn);
						}
						else {
							cbFn("");
						}
					}
					else {
						cbFn("");
					}
				}
				
				req.onerror = function () {clearTimeout(abortTimeout);};
				
				req.send(null);
			},
			
			getLyrics2: function (songUrl, cbFn) {
				mlyrics.lib.debugOutput("Fetch2: " + songUrl);
				
				var req2 = new XMLHttpRequest();
				if (!req2) {
					cbFn("");
					return;
				}
				
				var sourceObj = this;
				
				req2.open("GET", songUrl, true);
				
				var abortTimeout = setTimeout(function () {req2.abort(); cbFn("");}, mlyrics.fetch.abortTimeout);
				
				req2.onreadystatechange = function () {
					
					if (typeof(mlyrics.pane) != "undefined" && 
					    mlyrics.pane.playlistPlaybackServiceListener.curMediaItem != mlyrics.fetch.fetchMediaItem)
					{
						mlyrics.lib.debugOutput("Fetch2 abort - track changed");
						clearTimeout(abortTimeout);
						this.abort();
						return;
					}
					
					if (this.readyState != 4) return;
					
					mlyrics.lib.debugOutput("Got2 lyrics data");
					
					clearTimeout(abortTimeout);
					
					if (this.status == 200) {
						var respLyr = this.responseText;
					}
					else {
						var respLyr = "";
					}
					
					respLyr = sourceObj.filterText(respLyr);
					respLyr = sourceObj.fixCharacters(respLyr);
					respLyr = sourceObj.fixGeneralCharacters(respLyr);
					
					cbFn(respLyr);
				}
				
				req2.onerror = function () {clearTimeout(abortTimeout);};
				
				req2.send(null);
			},
			
			filterText: function (respLyr, search_track) {
				if (respLyr == null || respLyr == "") return "";
				
				if (respLyr.indexOf("<td class=romaji NOWRAP>", lyrFirstPos+1) == -1) {
					var hasRomajiClass = false;
				}
				else {
					var hasRomajiClass = true;
				}
					
				var tempLyr = "";
				var lyrFirstPos = 0;
				while (true) {
					if (hasRomajiClass)
						lyrFirstPos = respLyr.indexOf("<td class=romaji NOWRAP><pre class=lyrics>", lyrFirstPos+1);
					else
						lyrFirstPos = respLyr.indexOf("<pre class=lyrics>", lyrFirstPos+1);
						
					if (lyrFirstPos == -1) break;
					
					if (hasRomajiClass) 
						lyrFirstPos += 42
					else
						lyrFirstPos += 18;
					
					var lyrLastPos = respLyr.indexOf("</pre>", lyrFirstPos);
					tempLyr += respLyr.substring(lyrFirstPos, lyrLastPos) + "\n\n";
				}
				
				return tempLyr;
			},
			
			fixCharacters: function(respLyr) {
				if (respLyr== null || respLyr == "") return "";
				
				respLyr = respLyr.replace(/\r\n/g, "\n");
				  
				return respLyr;
			}
		},
		
		// http://www.shiron.net/
		// ======================
		SHIRONET: {
			getUrl: function (artist, album, track) {
				var url= "http://www.shiron.net/searchSongs?q=" + encodeURIComponent(track) + "&type=lyrics"
				return url;
			},
			
			getLyrics: function (artist, album, track, cbFn) {
				
				var url = this.getUrl(artist, album, track);
				
				var sourceObj = this;
				
				var req = new XMLHttpRequest();
				if (!req) {
					cbFn("");
					return;
				}
				
				mlyrics.lib.debugOutput("Fetch: " + url);
				
				req.open("GET", url, true);
				
				var abortTimeout = setTimeout(function () {req.abort(); cbFn("");}, mlyrics.fetch.abortTimeout);
				
				req.onreadystatechange = function() {
					
					if (typeof(mlyrics.pane) != "undefined" && 
					    mlyrics.pane.playlistPlaybackServiceListener.curMediaItem != mlyrics.fetch.fetchMediaItem)
					{
						mlyrics.lib.debugOutput("Fetch1 abort - track changed");
						clearTimeout(abortTimeout);
						this.abort();
						return;
					}
					
					if (this.readyState != 4) return;
					
					mlyrics.lib.debugOutput("Got lyrics data");
					
					clearTimeout(abortTimeout);
					
					var respLyr = "";
					if (this.status == 200) {
						respLyr = this.responseText.toLowerCase();
						
						var _track = track.toLowerCase();
						var _artist = artist.toLowerCase();
						
						var songUrl = "";
						var tableRowStart = 0;
						while (true) {
							tableRowStart = respLyr.indexOf("<table border=\"0\" cellspacing=\"0\" cellpadding=\"0\">", tableRowStart+1);
							if (tableRowStart == -1) break;
							
							var tableRowEnd = respLyr.indexOf("</table>", tableRowStart);
							var cuttedTable = respLyr.substring(tableRowStart, tableRowEnd);
							
							cuttedTable = cuttedTable.replace(/<b>/g, "")
							cuttedTable = cuttedTable.replace(/<\/b>/g, "")
							
							var trackPosStart = cuttedTable.indexOf(_track + "</a> -");
							if (trackPosStart != -1) {
								var artistStartPos = cuttedTable.indexOf(_artist + "</a>", trackPosStart+1);
								if (artistStartPos != -1) {
									var songUrlStartPos = cuttedTable.indexOf("<a href=\"");
									var songUrlEndPos = cuttedTable.indexOf("\"", songUrlStartPos+9);
									songUrl = "http://www.shiron.net" + cuttedTable.substring(songUrlStartPos+9, songUrlEndPos);
									break;
								}

							}
						}
						
						if (songUrl != "") {
							sourceObj.getLyrics2(songUrl, cbFn);
						}
						else {
							cbFn("");
						}
					}
					else {
						cbFn("");
					}
				}
				
				req.onerror = function () {clearTimeout(abortTimeout);};
				
				req.send(null);
			},
			
			getLyrics2: function (songUrl, cbFn) {
				mlyrics.lib.debugOutput("Fetch2: " + songUrl);
				
				var req2 = new XMLHttpRequest();
				if (!req2) {
					cbFn("");
					return;
				}
				
				var sourceObj = this;
				
				req2.open("GET", songUrl, true);
				
				var abortTimeout = setTimeout(function () {req2.abort(); cbFn("");}, mlyrics.fetch.abortTimeout);
				
				req2.onreadystatechange = function () {
					
					if (typeof(mlyrics.pane) != "undefined" && 
					    mlyrics.pane.playlistPlaybackServiceListener.curMediaItem != mlyrics.fetch.fetchMediaItem)
					{
						mlyrics.lib.debugOutput("Fetch2 abort - track changed");
						clearTimeout(abortTimeout);
						this.abort();
						return;
					}
					
					if (this.readyState != 4) return;
					
					mlyrics.lib.debugOutput("Got2 lyrics data");
					
					clearTimeout(abortTimeout);
					
					if (this.status == 200) {
						var respLyr = this.responseText;
					}
					else {
						var respLyr = "";
					}
					
					respLyr = sourceObj.filterText(respLyr);
					respLyr = sourceObj.fixCharacters(respLyr);
					respLyr = sourceObj.fixGeneralCharacters(respLyr);
					
					cbFn(respLyr);
				}
				
				req2.onerror = function () {clearTimeout(abortTimeout);};
				
				req2.send(null);
			},
			
			filterText: function (respLyr, search_track) {
				if (respLyr == null || respLyr == "") return "";
				
				var lyricsStartPos = respLyr.indexOf("<span class=\"artist_lyrics_text\">");
				if (lyricsStartPos != -1) {
					var lyricsEndPos = respLyr.indexOf("</span>", lyricsStartPos);
					respLyr = respLyr.substring(lyricsStartPos+33, lyricsEndPos);
				}
				else {
					respLyr = "";
				}
				
				return respLyr;
			},
			
			fixCharacters: function(respLyr) {
				if (respLyr== null || respLyr == "") return "";
				
				respLyr = respLyr.replace(/<br>/g, "");
				respLyr = respLyr.replace(/<BR>/g, "\n");
				respLyr = respLyr.replace(/\r\n/g, "\n");
				  
				return respLyr;
			}
		}
	},
	
	fetchNext: function (artist, album, track, cbFn, counter, forceone, cbSProgress) {
		
		if (!album) album = "";
		
		if (!artist || !track) {
			this.docallback("", cbFn);
			return;
		}
		
		var sources = this.prefs.getCharPref("fetchSourcesList").split("|");
		
		if (counter === undefined) counter=0;
		
		if (counter >= sources.length || counter < 0) {
			this.docallback("", cbFn);
			return;
		}
		
		this.cSourceURL = this.prefs.getCharPref("laddress_" + sources[counter]);
		this.cbSProgress = cbSProgress;
		
		if (cbSProgress) {
			cbSProgress(this.cSourceURL, true, counter);
		}
		
		var lm_webLoc = sources[counter];
		
		if (!this.prefs.getBoolPref("fetch_" + lm_webLoc) && !forceone) {
			this.fetchNext (artist, album, track, cbFn, ++counter, false, cbSProgress);
			return;
		}
		
		// Lib style autodetect (John Doe by default)
		var artistDelimPos = artist.indexOf(", ");
		if (artistDelimPos != -1) {			// Doe, John
			artist = artist.substr(artistDelimPos+2) + " " + artist.substring(0, artistDelimPos);
		}
		
		if (typeof(mlyrics.pane) != "undefined") {
			this.fetchMediaItem = mlyrics.pane.playlistPlaybackServiceListener.curMediaItem;
		}
		
		if (typeof(this.source[lm_webLoc]) === 'object') {
			var fetchObj = this;
			this.source[lm_webLoc].getLyrics(artist, 
							 album, 
							 track,
							 function (gotLyrics) {
								 if (!forceone && ( !gotLyrics || gotLyrics == "" ) ) {
									 fetchObj.fetchNext(artist, album, track, cbFn, ++counter, false, cbSProgress);
								 }
								 else {
									 if (!forceone) {
										var oldPopularity = fetchObj.prefs.getIntPref("popularity_" + sources[counter]);
										fetchObj.prefs.setIntPref("popularity_" + sources[counter], ++oldPopularity);
									 }
									 fetchObj.docallback(gotLyrics, cbFn, ++counter);
								 }
							 }
							);
		}
		else {
			this.fetchNext(artist, album, track, cbFn, ++counter, false, cbSProgress);
		}
	},
	
	googleTranslate: function (lyrics, cbFn, ignoreTrack) {
		
		// Do not translate already translated lyrics
		if (lyrics.indexOf("\n [ Google translated ] \n") != -1) {
			var translDelimPos1 = lyrics.indexOf("\n\n =================== \n [ ");
			if (translDelimPos1 != -1) {
				lyrics = lyrics.substr(0, translDelimPos1);
			}
		}
		
		var transLang = this.prefs.getCharPref("trLang");
		var transLyrics = "";
		var detectedLang = "";
		
		var langIgnoreList = this.prefs.getCharPref("ignoreLanguages").split("|");
		
		mlyrics.lib.debugOutput("Lyrics len: " + lyrics.length)
		
		var getURL = "http://translate.google.com/translate_a/t";
		var postData = "client=songbird&multires=1&text=" + encodeURIComponent(lyrics) + "&hl=en&sl=auto&ie=UTF-8&tl=" + transLang;
		
		var treq = new XMLHttpRequest();
		if (treq && lyrics.substr(0, 12).toLowerCase() != "instrumental" && lyrics.substr(1, 12).toLowerCase() != "instrumental") {
			
			if (this.cbSProgress) {
				this.cbSProgress("translate.google.com", true);
			}
			
			mlyrics.lib.debugOutput("Translate request");
			
			treq.open("POST", getURL, true);
			treq.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
			
			var abortTimeout = setTimeout(function () {treq.abort(); cbFn("");}, mlyrics.fetch.abortTimeout);
			
			treq.onreadystatechange = function () {
				
				if (typeof(mlyrics.pane) != "undefined" && 
					( mlyrics.pane.playlistPlaybackServiceListener.curMediaItem != mlyrics.fetch.fetchMediaItem && !ignoreTrack )
				)
				{
					mlyrics.lib.debugOutput("Translate abort - track changed");
					clearTimeout(abortTimeout);
					treq.abort();
					return;
				}
				
				if (this.readyState != 4) return;
				
				mlyrics.lib.debugOutput("Translate request part finished");
				
				clearTimeout(abortTimeout);
				
				if (this.status == 200) {
					
					var getlLyr = this.responseText;
					
					mlyrics.lib.debugOutput("Translated length: " + getlLyr.length);
					
					if (typeof(JSON) != "undefined") {
					
						var transLyrObj = JSON.parse(getlLyr);
						
						if (getlLyr != "") {
							detectedLang = transLyrObj.src;
							
							var ignoreLang = false;
							
							for (var i=0; i<langIgnoreList.length; i++) {
								if (detectedLang == langIgnoreList[i]) {
									ignoreLang = true;
									break;
								}
							}
							
							if ( !ignoreLang &&
							  ( detectedLang != transLang ||
								( lyrics.indexOf("\n [ English Translated Lyrics ] \n") != -1 && transLang == "en" ) // Do not translate already translated lyrics
							  )
							) {
								for (var i=0; i<transLyrObj.sentences.length; i++) {
									transLyrics += transLyrObj.sentences[i].trans;
								}
							}
							else {
								mlyrics.lib.debugOutput("Translation from " + detectedLang + " to " + transLang + " cannot be done");
							}
						}
					}
					else {
						Components.utils.reportError("JSON object does not exist");
					}
				}
				else {
					mlyrics.lib.debugOutput("Google translate responsed: " + this.status);
				}
				
				transLyrics = transLyrics.replace(/\r\n/g, "\n");
				
				cbFn(transLyrics, detectedLang);
			}
			
			treq.onerror = function () {clearTimeout(abortTimeout);};
			
			treq.send(postData);
		}
		else {
			cbFn("", "");
		}
	},
	
	docallback: function(respLyr, cbFn, counter) {
	
		if (respLyr.length < 10) {
			cbFn("");
		}
		else {
			var fetchObj = this;
			
			if (this.prefs.getCharPref("enableTranslate") == "TRANSLATE" && respLyr.toLowerCase() != "[instrumental]") {
				
				var stepTranslate = function (lyrics, translated, lang) {
							
							// Because google likes to trim \n at the end
							if (translated != "") {
								translated = translated.substr(0, translated.length-1);
							}
							
							// all translations done
							if (lyrics == "") {
								
								mlyrics.lib.debugOutput("Translation finished");
								
								if (translated != "") {
									var delimiter = "\n\n =================== \n [ Google translated ] \n =================== \n\n";
									cbFn(respLyr + delimiter + translated, fetchObj.cSourceURL, counter);
								}
								else {
									cbFn(respLyr, fetchObj.cSourceURL, counter);
								}
								
								return;
							}
							
							// part size
							var lyrPart = lyrics.substr(0, 10000);
							
							var delimiter = "\n";
							if (lyrPart.indexOf("\n") == -1) delimiter = " ";
							
							var gotLength = lyrPart.lastIndexOf(delimiter)+1;
							if (gotLength == 0) gotLength = 10000;
							
							fetchObj.googleTranslate( lyrics.substr(0, gotLength) + "0",
											function (trlyrics, trlang) {
												stepTranslate(lyrics.substr(gotLength), translated + "" + trlyrics, trlang);
											}
										);
					}
					
				stepTranslate(respLyr, "");
			}
			else {
				cbFn(respLyr, fetchObj.cSourceURL, counter);
			}
		}
	},
	
	latin2utf8: function (inpStr) {
		var localStr = "";
		var localCode = null;
		for (var i=0; i<inpStr.length; i++) {
			localCode = inpStr.charCodeAt(i);
			if ((localCode >= 192) && (localCode <= 255)) {
				localStr += String.fromCharCode(localCode+848);
			}
			if ((localCode >= 32) && (localCode <= 126)) {
				localStr += inpStr.substr(i, 1);
			}
		}
		
		return localStr;
	}
}

mlyrics.fetch.init();
