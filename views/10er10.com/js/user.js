(function($){

function user () {
	var infos = null;


	var orderPlaylists = function(playlists) {
		var pl = [];
		$.each(playlists,function(k,v) {
			var inserted = false;
			$.each(pl,function(pk,pv) {
				if ( v.name < pv.name ) {
					inserted = true;
					pl.splice(pk,0,v);
					return false;
				}
			});
			if ( !inserted )	{
				pl.push(v);
			}
		});
		return pl;
	};

	$(document).bind('user.infos',function(e,data) { infos = data.data.data; debug(infos); infos.playlists = orderPlaylists(infos.playlists);	});
	$(document).bind('user.playlists',function(e,data) {
		infos.playlists = orderPlaylists(data.data.data);
	});
	$(document).bind('rplAppendSuccess',function(e,data) {
		infos.playlists = jQuery.map(infos.playlists, function(n, i){
      if ( n._id == data.playlist._id )	return data.playlist;
			else																				return n;
    });
	});
	
	$(document).bind('rplCreationSuccess',function(e,data) {
		var newlist = [] ;
		var set = false;
		for ( var index in infos.playlists ) {
			if ( infos.playlists[index].name > data.playlist.name && !set ) {
				newlist[ newlist.length ] = data.playlist;
				set=true;
			}
			newlist[ newlist.length ] = infos.playlists[index];
		}
		if ( !set ) {
			newlist[ newlist.length ] = data.playlist;
		}
		infos.playlists = newlist;
	});

  $(document).bind('rplRenameSuccess',function(e,data) {
    for ( var index in infos.playlists ) {
      if ( infos.playlists[index]._id == data.playlist._id ) {
        infos.playlists[index].name = data.playlist.name;
        break;
      }
    }
  });

  $(document).bind('rplDropSuccess',function(e,data) {
    var newlist = [] ;
    for ( var index in infos.playlists ) {
      if ( infos.playlists[index]._id != data.playlist._id) {
        newlist[ newlist.length ] = infos.playlists[index];
      }
    }
    infos.playlists = newlist;
  });

  
	this.refresh_infos = function () {
		d10.bghttp.get ( { 'callback': 'triggerEvent:user.infos','url': site_url+'/api/userinfos','dataType': 'json' } );
	}

	this.refresh_playlists = function () {
		d10.bghttp.get ( { 'callback': 'triggerEvent:user.playlists','url': site_url+'/api/userinfos/playlists','dataType': 'json' } );
	}

	this.got_infos = function () {
		if ( infos == null )	return false;
		return true;
	}

	this.get_preferences = function () {
		if ( infos == null || ! infos.preferences )	return false;
		return infos.preferences;
	}
	
	this.get_playlists = function () {
		if ( infos == null || ! infos.playlists )	return [] ;
		return infos.playlists;
	}
	this.playlist_exists = function (name) {
		var pl = this.get_playlists();
		for ( var index in pl ) {
			if ( pl[index].name == name ) {
				return true;
			}
		}
		return false;
	}
	
// 	this.get_playlist = function (id, success) {
// 		if ( !id.length || id.substr(0,2) != 'pl' ) {
// 			return false;
// 		}
// 		var opts = { 'callback': 'triggerEvent:user.playlist.get','url': site_url+'/api/plm/'+id,'dataType': 'json' };
// 		if ( typeof success == "function" ) {
// 			opts.success = success;
// 		}
// 		d10.bghttp.get ( opts );
// 	}
	
	this.get_invites_count = function() {
    if ( infos == null )  return 0;
    if ( !infos.user ) return 0;
    if ( !infos.user.invites )  return 0;
    return parseInt(infos.user.invites);
  }
}

d10.user = new user();

})(jQuery);
