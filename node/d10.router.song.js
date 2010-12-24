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
						resp.rows.forEach(function(v) { r.push(v.doc); });
						d10.view("review/list",{rows: r},{},function(data) {
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
	
	app.get("/html/my/review/:id", function(request,response,next) {
		if ( request.params.id.substr(0,2) != "aa" ) {
			return next();
		}
		d10.db.db("d10").getDoc(
			{
				success: function(doc) {
					request.ctx.headers["Content-Type"] = "text/html";
					response.writeHead(200, request.ctx.headers );
					d10.view("review/song",doc,{},function(data) {
						response.end(data);
					});
				},
				error: function(err) {
					next();
				}
			},
			request.params.id
						 );
	});
	
	app.put("/api/meta/:id",function(request,response,next) {
		console.log("Taking");
		if ( request.params.id.substr(0,2) != "aa" ) {
			return next();
		}
		console.log("Still here");
		var body = "";
		request.setEncoding("utf8");
		request.on("data",function(chunk) {
			body+=chunk;
		});
		request.on("end",function() {
			if ( !body.length ) {
				return errResp(427,"no parameters sent",request.ctx);
			}
			request.body = querystring.parse(body);
			var fields = {};
			var errors = {};
			
			fields.title = request.body.title ? d10.sanitize.string(request.body.title) : "";
			if ( !fields.title.length ) {	errors.title = "Le morceau doit avoir un titre"; }
			fields.artist = request.body.artist ? d10.sanitize.string(request.body.artist) : "";
			if ( !fields.artist.length ) {	errors.artist = "Le morceau doit avoir un artiste"; }
			fields.genre = request.body.genre? d10.sanitize.genre(request.body.genre) : "";
			if ( !fields.genre.length ) {	errors.genre = "Genre inconnu"; }
			
			if ( d10.count(errors) ) {
				request.ctx.headers["Content-Type"] = "application/json";
				response.writeHead(200,request.ctx.headers);
				/*
				 * array (	'status'=>'error',
						'data'=>array(
								'code'   =>6,
								'message'=>$ec[6]
							),
							'fields'=> $fields
			);*/
				response.end(JSON.stringify(
					{
						status: "error",
						data: {
							code: 6,
							message: d10.http.statusMessage(425)
						},
						fields: errors
					}
								  ));
				return ;
			}
			console.log("And here too");
			if ( request.body.album ) {
				fields.album = d10.sanitize.string(request.body.album);
			}
			if ( request.body.tracknumber && !isNaN(parseInt(request.body.tracknumber,10)) ) {
				fields.tracknumber = parseInt(request.body.tracknumber,10);
			}
			if ( request.body.date && !isNaN(parseInt(request.body.date,10)) ) {
				fields.date= parseInt(request.body.date,10);
			}
			
			fields.valid = true;
			fields.reviewed = true;
			
			d10.db.db("d10").getDoc(
				{
					success: function(doc) {
						console.log("getDoc success");
						for ( var i in fields ) {
							doc[i] = fields[i];
						}
						d10.db.db("d10").storeDoc(
							{
								success: function(resp) {
									console.log("storeDoc success");
									successResp("recorded",request.ctx);
								},
								error: function(foo,err) {
									console.log("storeDoc error");
									errResp(err.statusCode, err.statusMessage, request.ctx);
								}
							},
							doc
										 );
						
					},
					error: function(foo,err) {
						console.log("getDoc error");
						errResp(err.statusCode, err.statusMessage, request.ctx);
					}
				}
				, request.params.id
							 );
			
// 			artist = request.body.artist ? d10.sanitize.string(request.body.artist) : "";
			
		});
	});
	
	
	
	
	app.put("/api/song", function(request,response) {
		if ( !request.query.filename || !request.query.filename.length 
			|| !request.query.filesize || !request.query.filesize.length ) {
			return errResp(427,"filename and filesize arguments required",request.ctx);
		}
		
		var safeErrResp = function(code,data,ctx) {
			console.log("sending errorResponse ",code);
			console.log(data);
			if ( errResponse ) return ;
			errResponse = {code: code, data: data};
			if ( job.requestEnd ) {errResp(code,data,ctx);}
			else	{ request.on("end",function() {errResp(code,data,ctx);}); };
		};
		
		var bytesCheck = function() {
			var min = 5000;
			if ( job.fileWriter.bytesWritten() > min ) {
				clearInterval(bytesIval);
				bytesIval = null;
				job.run("fileType");
			}
		};

		var endOfFileWriter = function() {	};
		var jobid = "aa"+d10.uid(),job = {
			id: jobid,
			fileName: jobid+".mp3",
			fileType: null,
			fileSha1: null,
			oggName: jobid+".ogg",
			oggLength: null,
			fileWriter: null,
			lameWriter: null,
// 			lameWriterEnd: false,
			requestEnd: false,
			oggWriter: null,
			bufferJoin: 8,
			lameBuffer: {status: true, buffer: []},
			tasks: {
				oggEncode: {
					status: null, // null (rien), true (running) or false (stopped)
					run: function(then) {
						console.log("-----------------------------------------------");
						console.log("-------      Create OGG encoding        -------");
						console.log("-----------------------------------------------");
						var args = d10.config.cmds.oggenc_opts.slice();
						args.push(d10.config.audio.tmpdir+"/"+this.oggName,"-");
						job.lameWriter = spawn(d10.config.cmds.lame, d10.config.cmds.lame_opts);
						job.oggWriter = spawn(d10.config.cmds.oggenc, args);
						job.oggWriter.on("exit",function(code) {
							console.log("launching oggwriter end of operation callback");
							then(code ? code : null,null);
						});
						job.lameWriter.on("exit",function() { console.log("lamewriter exited"); });
						util.pump(job.lameWriter.stdout, job.oggWriter.stdin,function(c) { console.log("encoding pump stopped",c); });
						function writeBuffer() {
							if ( ! job.lameBuffer.buffer.length ) {
								if ( job.requestEnd ) {
									job.lameWriter.stdin.end();
								} else {
									console.log("================= Lame pumping from request ===============");
									util.pump(request, job.lameWriter.stdin);
									job.lameBuffer.status = false;
								}
								return ;
							}
							
			// 				var buffer = files.bufferSum(job.lameBuffer.buffer);job.lameBuffer.buffer = [];
			// 				var pfusion =3;
			// 				var buffer = job.lameBuffer.buffer.shift();
							console.log("Size: ",job.lameBuffer.buffer.length," bufferJoin: ",job.bufferJoin);
							var buffer = files.bufferSum(
								job.lameBuffer.buffer.splice(0, job.lameBuffer.buffer.length <= job.bufferJoin ? job.lameBuffer.buffer.length : job.bufferJoin)
							);
			// 				console.log("writing "+buffer.length+" bytes to lameWriter");
							var writeOk = job.lameWriter.stdin.write(buffer);
							if ( writeOk ) { writeBuffer(); } 
							else {
								console.log(".");
								job.lameWriter.stdin.once("drain",function() {writeBuffer();});
							}
						};
						writeBuffer();
					}
				},
				fileType: {
					status: null,
					run: function(then) { 
						d10.fileType(d10.config.audio.tmpdir+"/"+this.fileName, function(err,type) {
								if ( !err ) {
									job.fileType = type;
								}
								then(err,type);
							}
						);
					}
				},
				fileMeta: {
					status: null,
					run: function(then) {
						if ( this.tasks.fileType.response == "audio/mpeg" )  {
							d10.id3tags(d10.config.audio.tmpdir+"/"+this.fileName,function(err,cb) {
								then(err,cb);
							});
						} else if ( this.tasks.fileType.response == "application/ogg" )  {
							d10.oggtags(d10.config.audio.tmpdir+"/"+this.fileName,function(err,cb) {
								then(err,cb);
							});
						} else {
							then("invalid file type");
						}
					}
				},
				oggLength: {
					status: null,
					run: function(then) {
						var file = (this.tasks.fileType.response == "application/ogg" ) ? this.fileName : this.oggName ;
						d10.oggLength(d10.config.audio.tmpdir+"/"+file,function(err,len) {
							if ( !err ) {
								if ( len && len.length && len.length > 2 ) {
									len = 60*parseInt(len[1],10) + parseInt(len[2],10);
								}
// 								job.oggLength = len;
// 								console.log("oggLength : ");
// // 								console.log(job.oggLength);
							}
// 							if ( err ) { console.log("oggLength is in error",d10.config.audio.tmpdir+"/"+file);console.log(err);console.log(len);}
							then(err,len);
						});
					}
				},
				sha1File: {
					status: null,
					run: function(then) {
						files.sha1_file(d10.config.audio.tmpdir+"/"+this.fileName, function(err,resp) {
							if ( !err ) {
								resp = resp.split(" ",2).shift();
							}
							then(err,resp);
						});
					}
				},
				sha1Check: {
					status: null,
					run: function(then) {
						/*
						$view = $this->couch_ci->key((string)$sha1)->getView("song","sha1");
						if ( count($view->rows) ) {
							return json_error(14);
						}
						*/
						if ( this.tasks.sha1File.err ) {
							return then(err);
						} else if ( !this.tasks.sha1File.response || !this.tasks.sha1File.response.length ) {
							return then("Sha1 not available");
						}
						d10.db.db("d10").key( this.tasks.sha1File.response ).getView(
							{
								success: function(resp) {
									console.log("sha1Check couch response ");
									console.log(resp);
									if (!resp.rows || resp.rows.length) {
										then(433);
									} else {
										then(null,null);
									}
									
								},
								error: function(err) {
									then(501);
								}
							},
							"song",
							"sha1"
						);
						
					}
				},
				cleanupTags: {
					status: null,
					run: function(then) {
// 						console.log("cleanup tags");
// 						console.log(this.tasks.fileMeta.response);
						var tags = JSON.parse(JSON.stringify(this.tasks.fileMeta.response));
// 						console.log(tags);
						if ( tags.genre ) {
							var value = "";
							d10.config.genres.forEach(function(v,k) {
								if ( value == v.toLowerCase() ) {
									value=v;
								}
							});
							tags.genre = value;
						}
						['ALBUM','ARTIST','TITLE'].forEach(function(v,k) {
							if ( tags[v] ) {
								tags[v] = d10.ucwords(tags[v].toLowerCase());
							}
						});
						['ALBUM','TRACKNUMBER','ARTIST','TITLE','GENRE','DATE'].forEach(function(v,k) {
							if ( !tags[v] ) { tags[v] = null; }
						});
						console.log(tags);
						then(null,tags);
					}
				},
				moveFile: {
					status: null,
					run: function(then) {
						var c = this.id[2],
							filename = this.oggName,
							sourceFile = d10.config.audio.tmpdir+"/";
							sourceFile+= (this.tasks.fileType.response == "application/ogg" ) ? this.fileName : this.oggName ;
						console.log("moveFile : ",sourceFile," -> ",d10.config.audio.dir+"/"+c+"/"+filename);
						var moveFile = function() {
							fs.rename(
								sourceFile,
								d10.config.audio.dir+"/"+c+"/"+filename,
								then
							);
						};
						fs.stat(d10.config.audio.dir+"/"+c,function(err,stat) {
							if ( err && err.errno != 2 ) {
								then(err);
							} else if ( err ) {
								fs.mkdir(d10.config.audio.dir+"/"+c,0775, function(err,stat) {
									if ( err ) {
										then(err);
									} else {
										moveFile();
									}
								});
							} else {
								moveFile();
							}
// 							then(e,stat);
						});
					}
				},
				applyTagsToFile: {
					status: null,
					run: function(then) {
						d10.setOggtags(d10.config.audio.dir+"/"+this.oggName,this.tasks.cleanupTags.response,function(err,cb) {
							then(err,cb);
						});
					}
				},
				createDocument: {
					status: null,
					run: function(then) {
						
						var resp = this.tasks.oggLength.response,						
							duration = 0;
						if ( 
							Object.prototype.toString.call(resp) === '[object Array]' &&
							resp.length > 2 && 
							!isNaN(parseFloat(resp[1])) && 
							!isNaN(parseFloat(resp[2])) 
						) {
							duration = parseFloat(resp[1])*60 + parseFloat(resp[2]);
						}
						
						var doc = {
							_id: this.id,
							filename: request.query.filename,
							sha1: this.tasks.sha1File.response,
							user: request.ctx.user._id,
							reviewed: false,
							valid: false,
							hits: 0,
							duration: duration
						};
						for ( var index in this.tasks.cleanupTags.response ) {
							var k = index.toLowerCase(),
								v = this.tasks.cleanupTags.response[index];
							if ( k == "date" || k == "tracknumber" ) {
								doc[k] = parseFloat(v);
								if ( isNaN(doc[k]) )	doc[k]=0;
							} else {
								doc[k] = v;
							}
						}
						if ( typeof doc.title == "string" && doc.title.length &&
							typeof doc.artist == "string" && doc.artist.length ) {
							doc.valid = true;
						}
// 						return then(null,doc);
						d10.db.db("d10").storeDoc(
							{
								success: function(resp) {
									console.log("doc storage: ");
									console.log(resp);
									doc._rev = resp.rev;
									then(null,doc);
								},
								error: function(err) {
									then(err);
								}
							},
							doc
						);
// 						then(null,doc);
					}
				}
			},
			queue: [],
			run: function(taskName) {
				console.log("JOB: run "+taskName);
				if ( this.tasks[taskName] && this.tasks[taskName].status === null &&  this.queue.indexOf(taskName) < 0 ) {
					this.queue.push(taskName);
					this.tasks[taskName].run.call(this, function(err,resp) { job.endOfTask.call(job,taskName,err,resp); });
				}
			},
			endOfTask: function(taskName, err,resp) {
				var i = this.queue.indexOf(taskName);
				if ( i >= 0 ) {
					this.queue.splice(i,1);
				}
				this.tasks[taskName].status = false;
				this.tasks[taskName].err = err;
				this.tasks[taskName].response = resp;
				this.emit(taskName+":complete",[err,resp]);
				if ( this.allCompleteCallbacks.length && !this.running() ) {
					while ( cb = this.allCompleteCallbacks.shift() ) {
						cb.call(this);
					}
				}
			},
			callbacks: {},
			bind: function(evt,cb,once) {
				if ( this.callbacks[evt] )	this.callbacks[evt].push({cb:cb, once: once});
				else						this.callbacks[evt]=[{cb:cb, once: once}];
			},
			once: function(evt,cb) {
				this.bind(evt,cb,true);
			},
			emit: function(evt,data) {
				console.log("JOB: emit "+evt);
				if ( this.callbacks[evt] ) {
					var remove = [];
					this.callbacks[evt].forEach(function(v,k) {
						var env = {type: evt};
						v.cb.apply(env,data);
						if ( v.once ) { remove.push(k); }
					});
					callbacks = this.callbacks;
					remove.forEach(function(v) { callbacks[evt].splice(v,1); });
				}
			},
			complete: function(task, cb) {
				if ( !this.tasks[task] ) {
					return false;
				}
				if ( this.tasks[task] == false ) {
					cb.call(this,this.tasks[task].err, this.tasks[task].response);
				}
				this.bind(task+":complete",cb);
			},
			running: function() {
				var count = 0;
				for ( var t in this.tasks ) {
					if ( this.tasks[t].status === true ) count++;
				}
				return count;
			},
			allCompleteCallbacks: [],
			allComplete: function(cb) {
				if ( this.running() ) {
					this.allCompleteCallbacks.push(cb);
				} else {
					cb.call(this);
				}
			}
		};
		console.log("filename : ",job.fileName,"ogg name : ",job.oggName);
		job.complete("oggEncode",function(err,resp) {
			if ( err ) {
				console.log("SEVERE: error on oggEncode task",err);
				job.allComplete(function() { safeErrResp(422,err,request.ctx); });
			} else {
				job.emit("oggAvailable",[]);
			}
		});
		job.complete("fileType",function(err,resp) {
			console.log("filetype complete : ",resp);
			if ( err ) {
				job.allComplete(function() { safeErrResp(421,err,request.ctx); });
			}
			if ( resp == "audio/mpeg" ) {
				job.run("oggEncode");
				job.run("fileMeta");
			} else {
				job.lameBuffer.status = false;
				job.lameBuffer.buffer = [];
				if ( resp == "application/ogg" ) {
					job.run("fileMeta");
				} else {
					job.allComplete(function() { safeErrResp(415,resp,request.ctx); });
				}
			}
		});

		job.complete("fileMeta",function(err,data) {
			console.log("fileMeta : ");
			console.log(err);
			console.log(data);
		});
		
		
		job.complete("sha1Check",function(err,resp) {
			if ( err ) {
				return safeErrResp(433,err,request.ctx);
			}
			job.run("moveFile");
		});
		job.complete("moveFile",function(err,resp) {
			console.log("moveFile finidhed");
			if ( err ) {
				return safeErrResp(432,err,request.ctx);
			}
			if ( job.tasks.fileType.response == "audio/mpeg" ) {
				fs.unlink(d10.config.audio.tmpdir+"/"+job.fileName,function()  {});
			}
			job.run("cleanupTags");
		});
		
		job.complete("cleanupTags",function(err,resp) {
			console.log("cleanupTags finidhed");
			job.run("createDocument");
			job.run("applyTagsToFile");
		});
		
		job.complete("createDocument",function(err,resp) {
			console.log("db document recorded");
			console.log(resp);
			successResp(resp,request.ctx);
		});
		
		
		job.once("oggAvailable",function() {
			console.log("OGG FILE IS AVAILABLE ! ");
			job.run("oggLength");
			var steps = ["oggLength","sha1File","fileMeta"],
				complete = 0,
				onAllComplete = function() {
					if ( job.tasks.sha1File.err ) {
						safeErrResp(503,err,request.ctx);
					} else if ( job.tasks.oggLength.err || job.tasks.oggLength.response == 0 ) {
						safeErrResp(436,err,request.ctx);
					} else {
						console.log("GOT EVERYTHING I NEED TO PROCEED WITH RECORDING OF THE SONG");
						
						job.run("sha1Check");
					}
				};
			steps.forEach(function(v,k) {
				if ( job.tasks[v].status === false ) {
					complete++;
				} else {
					job.complete(v,function() {
						complete++;
						if ( complete == steps.length ) {
							onAllComplete();
						}
					});
					if ( job.tasks[v].status === null ) {
						job.run(v);
					}
					
				}
			});
			if ( complete == steps.length ) {
				onAllComplete();
			}
		});
			
			
			/*
			
			var ival = setInterval(function() {
				var count = 0, errs = [];
				steps.forEach(function(v) {
					if ( job.tasks[v].status === null ) {
						job.run(v);
					} else if ( job.tasks[v].status === false ) {
						count++;
						if (job.tasks[v].err) {
							errs.push(err);
						}
					}
				});
				if ( count === steps.length ) {
					clearInterval(ival);
					console.log("GOT EVERYTHING I NEED TO PROCEED WITH RECORDING OF THE SONG, and "+errs.length+" errors");
// 					job.complete("moveFile",function(err,stat) {
// 						console.log("moveFile finidhed");
// 						console.log(err);
// 					});
// 					job.run("moveFile");
					
				}
			},200);
		});
		*/
		
		var bytesIval = null,	// bytes checker interval
			errResponse = null  // the error response to send
			; 
		request.on("error",function(){
			console.log("request ERROR !");
			console.log(arguments);
		});
		
		request.on("end",function() {
			job.requestEnd = true;
			console.log("got request end");
			if ( job.fileWriter  ) {
				job.fileWriter.close();
			} else {
				response.writeHead(200, {'Content-Type': 'text/plain'});
				response.end('Nothing sent\n');
			}
			if ( bytesIval ) { clearInterval(bytesIval); }
			
// 			console.log("valid length ? ",fileLengthOk);
		});
		
		request.on("data",function(chunk) {
			
			if ( !job.fileWriter  ) {
				
				console.log("creating fileWriter");
				job.fileWriter  = new files.fileWriter(d10.config.audio.tmpdir+"/"+job.fileName);
				bytesIval = setInterval(bytesCheck,500);
				job.fileWriter.open();

				job.fileWriter.on("end", function() {
// 					console.log(job.fileWriter.bytesWritten(),"total bytes written");
					if ( parseInt(request.query.filesize) != job.fileWriter.bytesWritten() ) {
						return errResp(421, request.query.filesize+" != "+n,request.ctx);
					}
					job.bufferJoin = 20;
					
// 					if ( job.tasks.fileType.status === null ) {
// 						job.run("fileType");
					if ( job.tasks.fileType.status === false ) {
						if ( job.tasks.fileType.response != "audio/mpeg" && job.tasks.fileType.response != "application/ogg"  ) {
							//send headers bc we can't tell the file type
// 							console.log("ERROR: no headers");
// 							return errResp(420, job.tasks.fileType.response, request.ctx);
							return ;
						}
					}
// 					job.run("sha1File");
					
					if ( job.tasks.fileType.response == "application/ogg" ) { job.emit("oggAvailable",[]); }
					console.log("fileWriter end event");
				});
			}

			if ( job.lameBuffer.status ) { job.lameBuffer.buffer.push(chunk); }
			
			job.fileWriter.write(chunk);
		});

	});
	
};


					/*
					var complete = ["fileType","sha1File","oggLength"];
					complete.forEach(function(v,k) {
						job.run(v);
					});
					var completeIval = setInterval(function() {
						var count=0;
						complete.forEach(function(v,k) {
							if ( job.tasks[v].status === false ) {
								count++;
							}
						});
						if ( count == complete.length ) {
							console.log("Got everything to be happy");
						}
					},200);
					*/
					
					
					
					/*
					if ( fileType == null ) {
						d10.fileType(d10.config.audio.tmpdir+"/"+fileName, function(err,type) {
							if  ( err !== null ) { return ; }
							fileType = type.replace(/\s/g,"");
// 							endOfFileWriter();
							if ( fileType == "audio/mpeg" ) {
								console.log("due to filetype checking I launch oggenc");
								createoggwriter(
									function(err,res) { console.log("oggwriter exited"); oggready = d10.config.audio.tmpdir+"/"+id+".ogg"; }
								);
							} else {
								job.lameBuffer.status = false;
								job.lameBuffer.buffer = [];
								if ( fileType == "application/ogg" ) {
									fs.rename(
										d10.config.audio.tmpdir+"/"+fileName, 
										d10.config.audio.tmpdir+"/"+id+".ogg",
										function ( ) {
											oggready=d10.config.audio.tmpdir+"/"+id+".ogg";
										}
									   );
								} else {
									errors.push([420, ""]);
								}
							}
						});
					} else {
						if ( oggready ) {
							console.log("launching oggready");
							oggLength(oggready,function(err,res) {
								if ( err ) { console.log("oggLength : error : ",err); }
								else		{ 
									console.log("oggLength : output");
									console.log(res);
								}
							});
// 							oggLength(oggready);
						}
						else if ( job.oggWriter ) {
							var wival = setInterval(function() {
								if ( oggready ) {
									console.log("-- ogg file ready, getting song length");
									oggLength(oggready,function(err,res) {
										if ( err ) { console.log("oggLength : error : ",err); }
										else		{ 
											console.log("oggLength : output");
											console.log(res);
										}
									}
									);
								}
								clearInterval(wival);
							},500);
						}
// 						endOfFileWriter();
					}
					*/




























