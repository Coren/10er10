var couch = require("./couch.rest").joc,
	config = require ("./config"),
	utils = require ("connect/utils"); 

var getDb = function(name) {
	if ( config.couch[name] ) {
		return new couch(config.couch[name].dsn, config.couch[name].database);
	}
	return false;
};

exports.db = getDb;

exports.loginInfos = function(login, cb, ecb) {
	var db = getDb("auth");
	db	.include_docs(true)
		.key( ["login",login] )
		.getView({
			success: function(resp) {
				if ( resp.rows && resp.rows.length == 1 ) {
					db.include_docs(true)
					.startkey([resp.rows[0].doc._id.replace(/^us/,""),""])
					.endkey([resp.rows[0].doc._id.replace(/^us/,""),[]])
					.getView({
						success: cb ? cb : function() {},
						error: ecb ? ecb: function() {}
					},"infos","all");
				} else {
					console.log("fucking shit",resp);
					ecb ? ecb(): function() {};
				}
			},
			error: ecb ? ecb: function() {}
		}, "infos","all");	
};

exports.d10Infos = function (login, cb, ecb) {

	var db = getDb("d10");
	db	.include_docs(true)
	.startkey( [login,null] )
	.endkey( [login,[]] )
	.getView({
		success: cb ? cb: function() {},
		 error: ecb ? ecb: function() {}
	}, "user","all_infos");	
};