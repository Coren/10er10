$(document).ready(function() {


var results = function (search) {
	// 		var loaded = false;
	var ui = null;
	var lastRoute = null;
	var load = function () {
		ui = $("#results div.resultContainer");
		ui.find("div.enlarge button").click(function() {
			var box=$(this).closest("div.rBox");
			var boxClass=box.hasClass("rSum1") ? "rSum1" : box.hasClass("rSum2") ? "rSum2" : null;
			if( !boxClass )	return ;
			var o = {"node":ui.find("div.rCenter"),"class":boxClass,"oldClass":"rCenter"};
			var n = {"node":box,"oldClass":boxClass,"class":"rCenter"};
			if ( !o.node.length ) {
				return ;
			}
			n.node.addClass(n.class).removeClass(n.oldClass);
			o.node.addClass(o.class).removeClass(o.oldClass);
		});
		ui.delegate("button.toggleDetails","click",function() {
			var item = $(this).closest(".rItem");
			if ( item.hasClass("parsed") ) {
				if ( item.hasClass("opened") ) {
					item.removeClass("opened");
				} else {
					item.addClass("opened");
				}
				return ;
			}
			if ( item.data("songs") ) {
				var html = "";
				$.each(item.data("songs"),function(key,val) {
					html+=d10.song_template(val);
				});
				item.find("div.details div.list").html(html);
			}
			item.addClass("parsed").addClass("opened").removeData("songs");
			
		})
		.delegate("div.song","dragstart", d10.dnd.onDragDefault)
		.delegate("div.song","dragend",d10.dnd.removeDragItem)
		.delegate("div.song","dblclick",function(e) {
			d10.playlist.append($(this).clone());
		})
		.delegate("div.song","click",function(e) {
			if ( $(e.target).closest(".add").length == 0 )
				$(this).toggleClass("selected");
		})
		.delegate("button[name=load]","click",function() {
			d10.playlist.append($(this).closest(".rItem").find("div.song").clone());
		})
		.delegate("button[name=loadNow]","click",function() {
			var cur = d10.playlist.current();
			if ( !cur.length ) {
				cur = d10.playlist.first();
				return d10.playlist.append($(this).closest(".rItem").find("div.song").clone(),cur);
			}
			var next = cur.next();
			if ( next.length ) {
				return d10.playlist.append($(this).closest(".rItem").find("div.song").clone(),next);
			}
			return d10.playlist.append($(this).closest(".rItem").find("div.song").clone());
		})
		;
		
		$("#results").find("div.searchBackground img.next").click(function() {
			var rCenter = 	ui.find("div.rCenter"),
				  rSum1 = ui.find("div.rSum1"),
				  rSum2 = ui.find("div.rSum2");
			rCenter.addClass("rSum2").removeClass("rCenter");
			rSum2.addClass("rSum1").removeClass("rSum2");
			rSum1.addClass("rCenter").removeClass("rSum1");
			
		});
		$("#results").find("div.searchBackground img.previous").click(function() {
			var rCenter = 	ui.find("div.rCenter"),
				rSum1 = ui.find("div.rSum1"),
				rSum2 = ui.find("div.rSum2");
			rCenter.addClass("rSum1").removeClass("rCenter");
			rSum1.addClass("rSum2").removeClass("rSum1");
			rSum2.addClass("rCenter").removeClass("rSum2");
																  
		});
	};
	
	var displayDetailsResponse = function (data) {
		if ( this.route != lastRoute ) {
			debug("details info too late",data);
			return false;
		}
		var looped = {};
		$.each ( data.artists, function(key,val) {
			if ( !looped[val.key] ) {
				looped[val.key] = {
					"duration": val.doc.duration,
					"count": 1,
					"songs": [ val.doc ]
				};
			} else {
				looped[val.key].duration += val.doc.duration;
				looped[val.key].count++;
				var inserted = false;
				$.each ( looped[val.key].songs , function (k,v) {
					if ( val.doc.title < v.title ) {
						looped[val.key].songs.splice(k,0,val.doc);
						inserted = true;
						return false;
					}
				});
				if ( !inserted ) {
					looped[val.key].songs.push(val.doc);
				}
			}
		});
		$.each(looped,function(key,val) {
			var anode = $("div.rBox.artists div.items div[name='"+escape(key)+"']",ui);
			if ( !anode ) {
				debug("no node found for ",key,val);
				return ;
			}
			$("span.count",anode).prepend(val.count);
			$("span.duration",anode).prepend(parseInt(val.duration/60));
			anode.data("songs",val.songs).addClass("details");
		});
		looped = {};
		$.each ( data.albums, function(key,val) {
			if ( !looped[val.key] ) {
				looped[val.key] = {
					"duration": val.doc.duration ,
					"count": 1,
					"songs": [ val.doc ]
				};
			} else {
				looped[val.key].duration += val.doc.duration;
				looped[val.key].count++;
				var inserted = false;
				$.each ( looped[val.key].songs , function (k,v) {
					if ( val.doc.tracknumber < v.tracknumber ) {
						looped[val.key].songs.splice(k,0,val.doc);
						inserted = true;
						return false;
					}
				});
				if ( !inserted ) {
					looped[val.key].songs.push(val.doc);
				}
			}
		});
		$.each(looped,function(key,val) {
			var anode = $("div.rBox.albums div.items div[name='"+escape(key)+"']",ui);
			if ( !anode ) {
				debug("no node found for ",key,val);
				return ;
			}
			$("span.count",anode).prepend(val.count);
			$("span.duration",anode).prepend(parseInt(val.duration/60));
			anode.data("songs",val.songs).addClass("details");
		});
	};
	
	var displayAjaxResponse = function(data) {
		debug(data);
		if ( this.route != lastRoute ) {
			debug("info too late");
			return false;
		}
		var html = '';
		$("div.rBox.songs div.list",ui).empty();
		if ( data.title ) {
			for ( var index in data.title ) {
				html+= d10.song_template ( data.title[index].doc ) ;
			}
			if ( html.length ) {
				$("div.rBox.songs div.list",ui).html(html);
			}
		}
		
		var details = {"albums": [], "artists": []};
		
		$("div.rBox.albums div.items",ui).empty().removeData("songs");
		if ( data.album ) {
			html = '';
			for ( var index in data.album ) {
				html+= d10.mustacheView ( "results.album", {"name": data.album[index].doc.album, "ename": escape(data.album[index].doc.album) } ) ;
				details.albums.push(data.album[index].doc.album);
			}
			if ( html.length ) {
				$("div.rBox.albums div.items",ui).html(html);
			}
		}
		$("div.rBox.artists div.items",ui).empty().removeData("songs");
		if ( data.artist ) {
			html = '';
			for ( var index in data.artist ) {
				html+= d10.mustacheView ( "results.artist", {"name": data.artist[index].doc.artist, "ename": escape(data.artist[index].doc.artist) } ) ;
				details.artists.push(data.artist[index].doc.artist);
			}
			if ( html.length ) {
				$("div.rBox.artists div.items",ui).html(html);
			}
		}
		if ( details.artists.length || details.albums.length ) {
			var ajax = {
				"url": site_url+"/api/details",
				"route": lastRoute,
				"dataType": "json",
				"data": details,
				"success": displayDetailsResponse
			};
			setTimeout(function() {
				if ( ajax.route == lastRoute ) {
					d10.bghttp.post(ajax);
				}
			} , 50);
		}
		debug(details);
	};
	
	var route = this.route = function(data) {
		debug("results route",data);
// 		return ;

		if ( !ui ) { load(); }
		
		if ( !data.active && data.segments.length ) {
			search.val(data.segments[0]);
		}
		if ( data.segments.length ) {
			if ( search.val() != data.segments[0] ) {
				debug("1 #/results"+search.val().length ? "/"+encodeURIComponent(search.val()) : "");
				setTimeout(function() {
				window.location.hash="#/results"+search.val().length ? "/"+encodeURIComponent(search.val()) : "";
				},50);
				return ;
			}
		} else {
			if ( search.val().length ) {
				debug("2 #/results"+ "/"+encodeURIComponent(search.val())) ;
				setTimeout(function() {
				window.location.hash="#/results"+ "/"+encodeURIComponent(search.val()) ;
				},50);
				return ;
			}
		}
		
		if ( data.segments.length && data.segments[0].length > 1 ) {
			if ( data.route == lastRoute ) {
				return ;
			}
			lastRoute = data.route;
		} else {
			data.route = "/results";
			if ( lastRoute != data.route ) {
				$("div.rBox.albums div.items, div.rBox.artists div.items",ui).empty();
				$("div.rBox.songs div.items div.list",ui).empty();
				lastRoute = data.route;
			}
			return ;
		}
		if ( data.segments.length ) {
			var q = data.segments[0] ;
			d10.bghttp.get({
				"url": site_url+"/api/search2",
				"route": lastRoute,
				"dataType": "json",
				"data": {"start": q},
				"success": displayAjaxResponse
			});
		} else {
			$("div.items",ui).empty();
		}
		
	};


	$(document).bind("route.results",function(e,data) {
		if ( !$("#search input").has(":focus").length ) {
			$("#search input").get(0).focus();
		}
		d10.results.route(data);
	});

	$("#search input").bind("keyup",function() {
		window.location.hash="#/results/"+encodeURIComponent($(this).val());
	});
	
	
	
	
};
		

d10.results = new results($("#search input"));
delete results;



});