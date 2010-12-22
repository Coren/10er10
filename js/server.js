/*var util = require("util"),
	fs = require("fs"),
	http = require("http"),*/
var	connect = require("connect"),
/*	files = require("./files"),
	stat = require("./serverstat"),*/
	httpHelper = require("./httpHelper"),
/*	couch = require("./couch.rest"),
	hash = require("./hash"),
	mustache = require("./mustache"),
	config = require("./config"),*/
	homepage = require("./d10.router.homepage"),
	cookieSession = require("./cookieSessionMiddleware"),
	api = require("./d10.router.api"),
	plmApi = require("./d10.router.api.plm")
	listingApi = require("./d10.router.api.listing");

function staticRoutes(app) {
	var staticAudio = httpHelper.localPathServer("/audio","/var/www/html/audio");
	var staticContent = httpHelper.localPathServer("/css","/var/www/html/d10/css");
	var staticJs = httpHelper.localPathServer("/js","/var/www/html/d10/js");
	app.get("/audio/*",staticAudio);
	app.get("/js/*",staticJs);
	app.get("/css/*",staticContent);
};

// var test2 = function (req,res,next) { console.log("here 2 !");next(); };

connect.createServer( 
	connect.logger(), 
	require("./contextMiddleware").context,
	connect.router(staticRoutes), 
	cookieSession.cookieSession,
	connect.router(homepage.homepage),
	connect.router(api.api),
	connect.router(plmApi.api),
	connect.router(listingApi.api)
).listen(8124);

// connect.createServer(connect.staticProvider("/var/www/html/audio")).listen(8118);
	

/*	var db = couch.joc("http://localhost:5984/","auth");
	db.limit(4).include_docs(true).getAllDocs({
		success: function(data) {			
// 			console.log("getAlldocs success",util.inspect(data)); 		
			data.rows.forEach(function(v,k) {
				console.log(v.doc);
			});
		},
		error: function(data) {			console.log("getAlldocs error"); 		},
	});*/
	
// 	console.log(hash.sha1("reggae4me"));
	
	
	/*
    app.post('/', function(request, response, next){
		console.log(request.headers);
		var fw = null;
		request.on("data",function(chunk) {
			if ( !fw ) {
				console.log("creating fileWriter");
				console.log(files);
				fw = new files.fileWriter("/tmp/test.ogg");
				fw.open();
			}
	// 		console.log("got request data chunk",typeof chunk);
			fw.write(chunk);
		});
		request.on("end",function() {
			console.log("got request end");
			if ( fw ) {
				fw.close(function (n) {console.log(n,"total bytes written");
					files.md5_file("/tmp/test.ogg", function(text) {
						response.writeHead(200, {'Content-Type': 'text/plain'});
						response.end('Hello World\n'+text+'\n');
						
					});
				});
			} else {
				response.writeHead(200, {'Content-Type': 'text/plain'});
				response.end('Nothing sent\n');
			}

		});
    });
    */