var d10 = require ("./d10"),
	querystring = require("querystring"),
	fs = require("fs"),
	files = require("./files"),
	util = require("util"),
	spawn = require('child_process').spawn,
	exec = require('child_process').exec;

var successResp = function(data,ctx) {
	var back = {
		status: "success",
		data: data
	};
	ctx.response.writeHead(200, ctx.headers );
	ctx.response.end (
		JSON.stringify(back)
	);
};

var errResp = function(code, data,ctx) {
	if ( !ctx ) {
		ctx = data;
		data = null;
	}
	var back = {
		status: "error",
		data: {
			code: code,
			message: d10.http.statusMessage(code)
		}
	};
	if (data) {
		back.data.infos = data;
	}
	ctx.response.writeHead(200, ctx.headers );
	ctx.response.end (
		JSON.stringify(back)
	);
};


exports.api = function(app) {
	app.get("/html/my/review", function(request,response) {
		request.ctx.headers["Content-Type"] = "text/html";
		d10.db.db("d10").key([request.ctx.user._id,false]).include_docs(true).getView( 
			{
				success: function(resp) {
					response.writeHead(200, request.ctx.headers );
					if( resp.rows && resp.rows.length ) {
						var r = [];
						resp.rows.forEeach(function(v) { r.push(v.doc); });
						d10.view("review/list",r,{},function(data) {
							response.end(data);
						});
					} else {
						d10.view("review/none",{},{},function(data) {
							response.end(data);
						});
					}
				},
				error: function(err) {
					response.writeHead(423, d10.http.statusMessage(423), request.ctx.headers );
					response.end();
// 					errResp(423,err,request.ctx);
				}
			},
			"user","song"
		);
	});
	
	app.put("/api/song", function(request,response) {
		if ( !request.query.filename || !request.query.filename.length 
			|| !request.query.filesize || !request.query.filesize.length ) {
			return errResp(427,"filename and filesize arguments required",request.ctx);
		}
		
		var bytesCheck = function() {
			var min = 5000;
			if ( filewriter.bytesWritten() > min ) {
				clearInterval(bytesIval);
				bytesIval = null;
				d10.fileType(d10.config.audio.tmpdir+"/"+fileName, function(err,type) {
						if  ( err !== null ) { return ; }
						fileType = type.replace(/\s/g,"");
						if ( fileType == "audio/mpeg" ) {
							console.log("due to filetype checking I launch oggenc");
							createoggwriter();
						} else {
							lamewriter.abort();
						}
					}
				);
			}
		};

		var createoggwriter = function () {
			console.log("-----------------------------------------------");
			console.log("-------      Create OGG encoding        -------");
			console.log("-----------------------------------------------");
			var args = d10.config.cmds.oggenc_opts.slice();
			args.push(d10.config.audio.tmpdir+"/"+id+".ogg");
			args.push("-");
			lamewriter = spawn(d10.config.cmds.lame, d10.config.cmds.lame_opts);
			oggwriter = spawn(d10.config.cmds.oggenc, args);
			oggwriter.on("exit",function() { console.log("oggwriter exited"); oggready = d10.config.audio.tmpdir+"/"+id+".ogg"; });
			lamewriter.on("exit",function() { console.log("lamewriter exited");});
			util.pump(lamewriter.stdout, oggwriter.stdin,function(c) {
				console.log("encoding pump stopped",c);
			});
			function writeBuffer() {
				var buffer = files.bufferSum(lamebuffer.buffer);
				lamebuffer.buffer = [];
				var writeOk = lamewriter.stdin.write(buffer);
				if ( writeOk ) {
					console.log("================= Lame pumping from request ===============");
					util.pump(request, lamewriter.stdin);
					lamebuffer.on = false;
				} else {
					console.log(".");
					lamewriter.stdin.once("drain",function() {writeBuffer();});
				}
			};
			writeBuffer();
		};

		var endOfFileWriter = function() {
		};
		
		var filewriter = null, // the async fileWriter
			lamewriter = null, // the async pipewriter launching lame
			oggwriter = null, // the async pipewriter launching oggend
			oggready = null, // ogg file when ready
			id = "aa"+d10.uid(), // new song uid
			fileName = id+".mp3",
			fileLengthOk = null, // result of the check on the file size
			bytesIval = null,	// bytes checker interval
			lamebuffer = { on: true, buffer: [] };
			fileType = null    // filetype from the file command
			; 
		request.on("error",function(){
			console.log("request ERROR !");
			console.log(arguments);
		});
		request.on("data",function(chunk) {
			if ( lamebuffer.on ) { lamebuffer.buffer.push(chunk); }
			if ( !filewriter  ) {
				bytesIval = setInterval(bytesCheck,500);
				console.log("creating fileWriter");
				filewriter  = new files.fileWriter(d10.config.audio.tmpdir+"/"+fileName);
				filewriter.open();
				filewriter.on("end", function() {
					if ( fileType == null ) {
						d10.fileType(d10.config.audio.tmpdir+"/"+fileName, function(err,type) {
							if  ( err !== null ) { return ; }
							fileType = type.replace(/\s/g,"");
// 							endOfFileWriter();

						});
					} else {
// 						endOfFileWriter();
					}

					console.log("fileWriter end event");
					
				});
			}
			filewriter.write(chunk);
		});
		request.on("end",function() {
			console.log("got request end");
			if ( filewriter  ) {
				filewriter.close(function (n) { console.log(n,"total bytes written"); 
				if ( parseInt(request.query.filesize) != n ) {
					errResp(421, request.query.filesize+" != "+n,request.ctx);
				}
				});
			} else {
				response.writeHead(200, {'Content-Type': 'text/plain'});
				response.end('Nothing sent\n');
			}
			if ( bytesIval ) { clearInterval(bytesIval); }
			
// 			console.log("valid length ? ",fileLengthOk);
		});
		
	});
	
};




























