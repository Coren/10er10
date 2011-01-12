var	connect = require("connect"),
	httpHelper = require("./httpHelper"),
	homepage = require("./d10.router.homepage"),
	cookieSession = require("./cookieSessionMiddleware"),
	api = require("./d10.router.api"),
	plmApi = require("./d10.router.api.plm"),
	listingApi = require("./d10.router.api.listing"),
	songStuff = require("./d10.router.song"),
	invites = require("./d10.router.invites"),
	download = require("./d10.router.audio.download"),
	invitesRouter = require("./invites.router.js"),
	config = require("./config")
	;

function staticRoutes(app) {
	app.get("/js/*",httpHelper.localPathServer("/js","../views/10er10.com/js"));
	app.get("/css/*",httpHelper.localPathServer("/css","../views/10er10.com/css"));
};

function staticAudio (app) {
	app.get("/audio/*",httpHelper.localPathServer("/audio","/var/www/html/audio"));
};

function staticInvites(app) {
	app.get("/static/*",httpHelper.localPathServer("/static","../views/invites.10er10.com/static"));
};

var d10Server = connect.createServer( 
	connect.favicon('../views/10er10.com/favicon.ico'),
	connect.logger(), 
	require("./contextMiddleware").context,
	connect.router(staticRoutes), 
	cookieSession.cookieSession,
	connect.router(download.api),
	connect.router(staticAudio),
	connect.router(homepage.homepage),
	connect.router(api.api),
	connect.router(plmApi.api),
	connect.router(listingApi.api),
	connect.router(songStuff.api),
	connect.router(invites.api)
);

var invitesServer = connect.createServer( 
 	connect.logger(), 
	connect.router(staticInvites),
	connect.router(invitesRouter.api),
	function (request,response) {
		response.writeHead(404,{"Content-Type": "text/plain"});
		response.end("The page does not exist");
	}
);


var globalSrv = connect.createServer(
	// 10er10 vhosts
	connect.vhost("invites.10er10.com",invitesServer),
// 	defaultServer
	d10Server
)
.listen(config.port);

d10Server.on("error",function() {
	console.log("SERVER ERROR");
	console.log(arguments);
});
d10Server.on("clientError",function() {
	console.log("CLIENT ERROR");
	console.log(arguments);
});

globalSrv.on("error",function() {
	console.log("SERVER ERROR");
	console.log(arguments);
});
globalSrv.on("clientError",function() {
	console.log("CLIENT ERROR");
	console.log(arguments);
});

