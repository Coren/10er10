var d10 = require("./d10"), when = require("./when"), hash = require("./hash");

var errCodes = {
	430: "Login already registered",
	431: "Login too short",
	432: "Login contains invalid characters",
	440: "Password does not contain enough characters",
	441: "Password does not contain enough different characters"
};


var isValidLogin = function(login, callback) {
	if ( login.length < 3 ) {	return callback(431); }
	if ( 
		login.indexOf("<") >= 0 ||
		login.indexOf(">") >= 0 ||
		login.indexOf("/") >= 0 ||
		login.indexOf("\\") >= 0 ||
		login.indexOf("\"") >= 0 ||
		login.indexOf("'") >= 0 ||
		login.indexOf("&") >= 0 
	)	return callback(432);
	if ( login.toLowerCase() == "admin" ||
		 login.toLowerCase() == "administrateur" ||
		  login.toLowerCase() == "administrator" ||
		   login.toLowerCase() == "root"
	)	return callback(430);
	d10.couch.auth.view("infos/all", {key: ["login",login]}, function(err,back) {
		if ( err ) {
			callback(503);
		} else if ( back.rows.length ) {
			callback(430);
		} else {
			callback();
		}
	});
};



var isValidPassword = function(password, callback) {
	if ( password.length < 8 ) {
		return callback(440);
	}
	var hash = [];
	for ( var i = 0; i<password.length ; i++ ) {
		var c = password.charCodeAt(i);
		if ( hash.indexOf(c) < 0 )	hash.push(c);
	}
	console.log(hash);
	if ( hash.length < 4 ) {
		return callback(441);
	}
	callback();
};


/**
* opts.parent: "us123445547754"
* opts.depth : 4
*
* opts.uuid : 5464623423453656
* opts.callback = function(err,resp)
*
*/
var createUser = function(login,password,opts) {
	var parent = opts.parent && opts.depth ? opts.parent : null;
	var depth = opts.parent && opts.depth ? parseInt(opts.depth,10) : 1;
	var uuid = opts.uuid ? opts.uuid : d10.uid();


	var sendResponse = function(err,resp) {
		if ( opts.callback ) {
			opts.callback(err,resp);
		}
	};

	when (
		{
			login: function(cb) {
				isValidLogin(login, cb);
			},
			password: function(cb) {
				isValidPassword(password,cb);
			}
		},
		function(err,resp) {
			if ( err ) {
				return sendResponse(err,resp);
			}
			
			var authUserDoc = {
				_id: "us"+uuid,
				login: login,
				parent: parent
			};
			var authPrivDoc = {
				_id: "pr"+uuid,
				password: hash.sha1(password),
				depth: depth
			};
			var d10PreferencesDoc = {_id: "up"+uuid};
			var d10PrivateDoc = {_id: "pr"+uuid};
			
			
			when({
				auth: function(cb) {
					d10.couch.auth.storeDocs( [ authUserDoc, authPrivDoc ], function(err,resp) {
						if ( err ) {
												console.log(err,resp);
							cb(500,err);
						} else {
							cb();
						}
					});
				},
				d10: function(cb) {
					d10.couch.d10wi.storeDocs( [ d10PreferencesDoc, d10PrivateDoc ], function(err,resp) {
						if ( err ) {
												console.log(err,resp);
							cb(500,err);
						} else {
							cb();
						}
					});
				}
			},
				function(err,resp) {
					if ( err ) {
						sendResponse(err,resp);
					} else {
						sendResponse(null,uuid);
					}
				}
			);
		}
	);


};

exports.isValidLogin = isValidLogin;
exports.isValidPassword = isValidPassword;
exports.createUser = createUser;


