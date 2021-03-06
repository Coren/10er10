var ncouch = require("../ncouch");
var config = require("../config");
var configChecker = require("./configChecker");
var when = require("../when");
var fs = require("fs");


var configCheck = function() {
	configChecker.check(function(err) {
		if ( err ) {
			console.log("stop installation process");
		}else {
			console.log("all good. Let's go dancing");
			createDatabases();
		}
	});
}

var createDatabase = function(type, client, infos,then) {
	client.createDatabase(infos.database,function(err,resp) {
		console.log(err,resp);
		if ( err ) {
			console.log("Oh no ! Something went wrong when creating database",infos,err);
			return then(new Error("Database transaction failed"));
		}
		populateDatabase(type, client,infos,then);
	});
};

var populateDatabase = function(type, client,infos,then) {
	var file = "db/"+type+"-design.json";
	fs.readFile(file, function(err,resp) {
		if ( err ) {
			console.log("Oh no ! Something went wrong when reading database dump "+file);
			return then(new Error("File system transaction failed"));
		}
		
		
		var design = null;
		try {
			design = JSON.parse(resp);
		} catch (e) { design = null }
		if ( !design ) {
			console.log("Oh no ! Something went wrong when parsing database dump to JSON");
			return then ( new Error("JSON parsing failed") );
		}
		
		var db = client.database(infos.database);
		
		var insertOne = function() {
			if ( !design.length ) {
				return then();
			}
			var doc = design.pop();
			console.log("Storing "+infos.database+":"+doc._id);
			db.deleteDoc(doc._id,function(err,resp,m) {
// 				if ( err ) {
// 					console.log(err,resp,m);
// 				}
				db.storeDoc(doc,function(err,resp) {
					if ( err ) {
						console.log("Oh no ! Something went wrong when storing "+infos.database+": "+design._id);
						then(err);
					} else {
						insertOne();
					}
				});
			});
		};
		insertOne();
	});
};


var createDatabases = function() {
	var whenFns = {};
	for ( var type in dbs ) {
		whenFns[type] = (function(type, infos) {
			return function(then) {
				var client = ncouch.server(infos.dsn).debug(false);
				client.databaseExists(infos.database,function(err,res) {
					if ( err ) {
						console.log("Oh no ! Something went wrong when checking if database exists",infos);
						return then(new Error("Database transaction failed"));
					}
					if ( !res ) {
						createDatabase(type, client, infos,then);
					} else {
						populateDatabase(type, client,infos,then);
					}
				});
			};
		})(type, dbs[type]);
	}
	when(whenFns,function(errs,resp) {
		if ( !errs ) {
			console.log("End of installation");
		}
	});
};

var dbs;

if ( process.argv.length > 2 && process.argv[2] == "-p" ) {
	console.log("Setting up 10er10 PROD environment");
	dbs = config.couch_prod;
} else {
	console.log("Setting up 10er10 DEV environment");	
	dbs = config.couch_dev;
}

console.log("Hit [Ctrl]-C to abort or wait 5 seconds");

setTimeout(function() {
	configCheck();
},5000);
