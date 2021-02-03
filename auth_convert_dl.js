const fs = require("fs");
const https = require("https");
const qs = require("querystring");
//const FormData = require("form-data");

//multipart/form-data boundary
const BOUNDARY = "---321lAzYAnDImYoUnG123---"

//load up the users client_secret/id and permissions
//const AUTH_PAYLOAD = JSON.parse(fs.readFileSync(process.argv[2]));

var TOKEN = false;

var USER_INFO = false;

function getRequest(opt, callback){

	opt.host = "cloud.cadexchanger.com";
	opt.protocol = "https:";
	opt.path = "/api/v1" + opt.path;

	console.log(opt);

	let resBody = "";
	const req = https.get(opt, (res) => {
		res.setEncoding("utf8");
		res.on('data', function(chunk){
			resBody += chunk;
		});
		res.on('end', function(){
			console.log(resBody);
			if(callback){
				callback(JSON.parse(resBody));
			}
		});
	});
	req.on('error', (e) => {
		console.log(e.message);
	});
}

function bodyRequest(opt, payload, callback){

	opt.host = "cloud.cadexchanger.com";
	opt.protocol = "https:";
	opt.path = "/api/v1" + opt.path;

	console.log(opt);

	let resBody = "";

	const req = https.request(opt, function(res){
		//TODO handle known errors
		res.setEncoding("utf8");
		res.on('data', function(chunk){
			resBody += chunk;
		});
		res.on('end', function(){
			console.log(resBody);
			if(callback){
				callback(JSON.parse(resBody));
			}
		});
	});
	req.on('error', (e) => {
		console.log(e.message);
	});
	req.write(payload);
	req.end();
}

function encodeMultipartFormDataFromFile(name, fileName){
	let buffer = fs.readFileSync(fileName);
	let keyBuffer = Buffer.from(BOUNDARY+"\r\nContent-Disposition: form-data; name=\""+name+"\"; filename=\""+fileName+"\"\r\nContent-Type: application/octet-stream\r\n\r\n");
	let endBuffer = Buffer.from("\r\n"+BOUNDARY+"--\r\n");

	return Buffer.concat([keyBuffer, buffer, endBuffer]);
}

function encodeMultipartFormDataFromString(name, value){
	return Buffer.from(BOUNDARY+"\r\nContent-Disposition: form-data; name=\""+name+"\"\r\n\r\n"+value+"\r\n");
}

function multipartFormDataRequest(opt, payload, callback){

	opt.host = "cloud.cadexchanger.com";
	opt.protocol = "https:";
	opt.path = "/api/v1" + opt.path;

	//Content-type mulitpart/form-data already determined from method
	opt.headers['Content-length'] = payload.length;
	
	const req = https.request(opt, function(res){
		const chunks = [];
		res.on("data", function(chunk){
			chunks.push(chunk);
		});
		res.on("end", function(){
			const body = Buffer.concat(chunks);
			//TODO turn body into something useful cause it may contain a whole file
			//look for res headers Content-Disposition attachment; filename="FILENAME.EXT" and save that to a local file or pass along the body as a buffer wrapped by josn with the filename
			callback(body); //maybe translate to string.. or best to leave it to the caller to decide what the data is
		});
	});
	req.write(payload);
	req.end();
}

function setAuth(token, opt){
	if(opt.headers){
		opt.headers["Authorization"] = "Bearer "+token;
	}else{
		opt.headers = {
			"Authorization" : "Bearer "+token
		}
	}
	return opt; //so we can embed like let opt = setAuth(CONVERSIONS_RESULT(id));
}

function setContent(opt, type, size){
	if(!opt.headers){
		opt.headers = {};
	}
	opt.headers['Content-type'] = type;
	opt.headers['Content-Length'] = size; 
	return opt;
}

//const API = module.exports(AUTH_PAYLOAD);

module.exports = function(authObj){
//authObj = AUTH_PAYLOAD
/*const API =	*/return {
/*		meta : {
			getUserInfo(callback){
				
			}
		},
*/
		v1 : {
			ACCOUNT : {
				GET : {
					USERS_ME : function(callback){
						checkAuth(authObj, () => {
							/*getRequest(setAuth(TOKEN, GET_USERS_ME), (res) => {
								callback(res);
							});*/
							checkInfo( (res) => {
								USER_INFO = res.user;
								callback(res.user);
							});
						});
					}
				}
			},

			DATA : {
				GET : {
					//query can be null/undefined/{} since this method will lookup necessary params if they are not provided
					FILES : function(query, callback){
						query = query || {};
						checkAuth(authObj, () => {
							checkInfo( (res) => {
								USER_INFO = res.user;
								if(!query.parentFolder){
									query.parentFolder = USER_INFO.rootFolder;
								}
								getRequest(setAuth(TOKEN, FILES("GET", query)), callback);
							});
						});
					},

					FILES_ID : function(id, callback){
						checkAuth(authObj, () => {
							//no USER_INFO, specific file, no need for parentFolder
							getRequest(setAuth(TOKEN, FILES_ID("GET", id)), callback); 
						});
					},

					FILES_SHARING : function(id, callback){
						checkAuth(authObj, () => {
							//no USER_INFO, specific file, no need for parentFolder
							getRequest(setAuth(TOKEN, FILES_SHARING("GET", id)), callback);
						});
					},

					FILE_REVISIONS : function(query, callback){//query must contain ids
						checkAuth(authObj, () => {
							getRequest(setAuth(TOKEN, FILE_REVISIONS("GET", query)), callback);
						});
					},

					FILE_REVISIONS_ID : function(id, callback){
						checkAuth(authObj, () => {
							getRequest(setAuth(TOKEN, FILE_REVISIONS_ID("GET", id)), callback);
						});
					},

					FOLDERS : function(query /*nullable*/, callback){
						checkAuth(authObj, () => {
							checkInfo( (res) => {
								//parentFolder is a must in query if its null/unbdefined/{}
								if(!query){
									query = {
										parentFolder : res.rootFolder
									};
								}
								getRequest(setAuth(TOKEN, FOLDERS("GET", query)), callback);
							});
						});
					},

					FOLDERS_ID : function(id, callback){
						checkAuth(authObj, () => {
							getRequest(setAuth(TOKEN, FOLDERS_ID("GET", id)), callback);
						});
					},

					FILES_EXTENSIONS : function(callback){
						checkAuth(authObj, () => {
							getRequest(setAuth(TOKEN, FILES_EXTENSIONS), callback);
						});
					}
				},

				PUT : {
					/*
						file : {
							file : Object //changes to file, I guess a buffer that overwrites the existing one
							name : String //new name of file OPTIONAL
							parentFolder : String //new folder to put file in OPTIONAL
							activeRevision : String //id of new revision to set as active
						}
					*/
					FILES_ID : function(id, fileUpdate, callback){
						checkAuth(authObj, () => {
							bodyRequest(
								setAuth(TOKEN, FILES_ID("PUT", id)),
								{fileUpdate},
								callback
							);
						});
					},

					FILES_SHARING : function(id, isPublic, callback){
						checkAuth(authObj, () => {
							bodyRequest(
								setAuth(TOKEN, FILES_SHARING("PUT", id)),
								{ 'public' : isPublic},
								callback
							);
						});
					},
					/*
						folder : {
							name : String //new name of folder OPTIONAL
						}
					*/
					FOLDERS_ID : function(id, folderUpdate, callback){
						checkAuth(authObj, () => {
							bodyRequest(
								setAuth(TOKEN, FOLDERS_ID("PUT", id)),
								{folderUpdate},
								callback
							);
						});
					}
				},

				POST : {
					//despite name only uploads 1 file member per call
					/*
						args : {
							fileName : String //REQUIRED
							parentFolder : String<uuid> //OPTIONAL
						}
					*/
					FILES : function(args, callback){
						checkAuth(authObj, () => {
							let formDataBuf;
							let filebuf = encodeMultipartFormDataFromFile("data", args.fileName)
							if(args.parentFolder){
								let parentFolderBuf = encodeMultipartFormDataFromString("parentFolder", args.parentFolder);
								formDataBuf = Buffer.concat([parentFolderBuf, fileBuf]);
							}else{
								//only the one param
								formDataBuf = fileBuf;
							}
							
							multipartFormDataRequest(
								setAuth(TOKEN, FILES("POST")),
								formDataBuf,
								callback
							);
						});
					},

					FILE_REVISIONS : function(id, fileName, callback){
						checkAuth(authObj, () => {
							multipartFormDataRequest(
								setAuth(TOKEN, FILE_REVISIONS("POST", "")),
								Buffer.concat([
									encodeMultipartFormDataFromString("file", id),
									encodeMultipartFormDataFromFile("data", fileName)	
								]),
								callback
							);
						});
					},

					//create folder with 'name' in 'parentFolder'
					FOLDERS : function(parentFolder, name, callback){
						checkAuth(authObj, () => {
							bodyRequest(
								setAuth(TOKEN, FOLDERS("POST")),
								{
									"parentFolder" : parentFolder,
									"name" : name
								},
								callback
							);
						});
					}
				},

				DELETE : {
					
					FILES_ID : function(id, callback){
						checkAuth(authObj, () => {
							getRequest(
								setAuth(TOKEN, FILES_ID("DELETE", id)),
								callback
							);
						});
					},

					FILE_REVISIONS_ID : function(id, callback){
						checkAuth(authObj, () => {
							getRequest(
								setAuth(TOKEN, FILE_REVISIONS_ID("DELETE", id)),
								callback
							);
						});
					}

				}
			},

			CONVERSION : {
				
				GET : {
					CONVERSIONS_ID : function(id, callback){
						checkAuth(authObj, () => {
							getRequest(setAuth(TOKEN, CONVERSIONS_ID("GET", id)), callback);
						});
					},

					CONVERSIONS_ID_RESULT : function(id, callback){
						checkAuth(authObj, () => {
							getRequest(setAuth(TOKEN, CONVERSIONS_RESULT(id)), callback)
						});
					}
				},

				POST : {
					//uploads AND converts file
					/*
						fileName : String //REQUIRED
						extension : String //REQUIRED format is inferred from this
						parameters : Object //OPTIONAL import/export options of format:
						{
							<format_name> : {
								"import" : {
									<param_name> : <value>
								},
								"export" : {
									<param_name> : <value>
								},
							}
						}
					*/
					CONVERSIONS : function(args, callback){
						checkAuth(authObj, () => {
							let srcFormat = getSrcFormat(fileName);

							let targetFormat = getFormatFromExtension(args.extension);
							let targetFormatBuf = encodeMulitpartFormDataFromString("format", targetFormat);
							let targetExtBuf = encodeMultipartFormDataFromString("extension", args.extension);

							let fileBuf = encodeMultipartFormDataFromFIle("data", fileName);
							
							let formDataBuf;

							if(args.parameters){
								let paramBuf = encodeMultipartFormDataFromString("parameters", JSON.stringify(args.parameters));
								formDataBuf = Buffer.concat([targetFormatBuf,targetExtBuf,paramBuf,fileBuf]);
							}else{
								formDataBuf = Buffer.concat([targetFormatBuf,targetExtBuf,fileBuf]);
							}

							//TODO check if infile is allowable import

							//TODO check if export filetype is allowable

							multipartFormDataRequest(
								setAuth(TOKEN, CONVERSIONS),
								formDataBuf,		
								callback
							);
						});
					},

					//converts an already uploaded file
					//optional revision_id to change a non active revision of the file
					//TODO switch to args. wrap options up into an object
					FILES_ID_CONVERT : function(id, extension, parameters, callback){
						checkAuth(authObj, () => {
							bodyRequest(
								setAuth(TOKEN, FILES_CONVERT(id)),
								JSON.stringify({ 
									"format" : getFormatFromExtension(extension),
									"extension" : extension,
									"parameters" : parameters
								}),
								callback
							);
						});
					}
				},

				DELETE : {
					CONVERSIONS_ID : function(id, callback){
						checkAuth(authObj, () => {
							getRequest(setAuth(TOKEN, CONVERSIONS_ID("DELETE", id)), callback);
						});
					}
				}

			},

			VIEWER : {
				GET : {
					EMBEDDED_VIEWER : function(id, cameraType, displayMode, callback){
						//TODO
						//getRequest(
					}
				}
			}
		}
	}
}//TODO----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

function conversionParametersBuilder(format, opt){

}

function getFormatFromExtension(extension){
	switch(extension.toLowerCase()){
		case "sldasm":
		case "sldpart":
			return "SolidWorks";
		//TODO need to use regex to mathc multi extensions files
		//case "asm.*":
		//case "prt.*":
			//return "Creo"
		case "prt":
			return "NX";
		case "igs":
		case "iges":
			return "IGES";
		case "stp":
		case "step":
			return "STEP";
		case "sat":
		case "sab": //import only
			return "ACIS";
		case "x_t":
		case "x_b":
		//import only (below)
		case "xmt_txt":
		case "xmt_bin":
		case "xmp_txt":
		case "xmp_bin":
			return "ParaSolid";
		case "jt":
			return "JT";
		case "ifc":
			return "IFC";
		case "3dm":
			return "Rhino";
		case "brep":
			return "BRep";
		case "3ds":
			return "3DS";
		case "3mf":
			return "3MF";
		case "dae":
			return "Collada";
		case "dxf":
			return "DXF";
		case "fbx":
			return "FBX";
		case "glb":
		case "gltf":
			return "glTF";
		case "obj":
			return "OBJ";
		case "stl":
			return "STL";
		case "wrl":
			return "VRML";
		case "x3d":
			return "X3D";
		case "png":
		case "jpg":
		case "jpeg":
		case "bmp":
			return "Image";
		case "zip":
			return "Archive";
	}
}

function getSrcFormatFromFileName(fileName){
	let parts = fileName.split(".");
	let extension = fileName.split(".")[1];
	return getSrcFormatFromExtension(extension);
	
}

function canImport(fileName){
	let parts = fileName.split(".");
	let extension = fileName.split(".")[1];
	//for(let i=1; i < extension.length; i++){
	//	extension
	//}
	switch(extension.toLowerCase()){
		case "sldasm":
		case "sldpart":
		//TODO need to use regex to mathc multi extensions files
		//case "asm.*":
		//case "prt.*":
			//return "Creo"
		case "prt":
		case "igs":
		case "iges":
		case "stp":
		case "step":
		case "sat":
		case "sab": 
		case "x_t":
		case "x_b":
		case "xmt_txt":
		case "xmt_bin":
		case "xmp_txt":
		case "xmp_bin":
		case "jt":
		case "ifc":
		case "3dm":
		case "brep":
		case "3ds":
		case "3mf":
		case "dae":
		case "dxf":
		case "fbx":
		case "glb":
		case "gltf":
		case "obj":
		case "stl":
		case "wrl":
		case "zip":
			return true;
		case "x3d":
		case "png":
		case "jpg":
		case "jpeg":
		case "bmp":
		default:
			return false;
	}
}

function canExport(fileName){
	let parts = fileName.split(".");
	let extension = fileName.split(".")[1];
	//for(let i=1; i < extension.length; i++){
	//	extension
	//}
	switch(extension.toLowerCase()){
		case "igs":
		case "iges":
		case "stp":
		case "step":
		case "sat":
		case "x_t":
		case "x_b":
		case "jt":
		case "ifc":
		case "3dm":
		case "brep":
		case "dae":
		case "dxf":
		case "fbx":
		case "glb":
		case "gltf":
		case "obj":
		case "stl":
		case "wrl":
		case "zip":
		case "x3d":
		case "png":
		case "jpg":
		case "jpeg":
		case "bmp":
			return true;
		case "sldasm":
		case "sldpart":
		//TODO need to use regex to mathc multi extensions files
		//case "asm.*":
		//case "prt.*":
			//return "Creo"
		case "prt":
		case "sab":
		case "xmt_txt":
		case "xmt_bin":
		case "xmp_txt":
		case "xmp_bin":
		case "3ds":
		case "3mf":
		default:
			return false;
	}
}


function checkAuth(authObj, callback){
	if(!TOKEN){//also check timeout
		auth(authObj, (newAuth) => {
			TOKEN = newAuth.access_token;
			setAuthTimeout(newAuth.expires_in);
			callback();
		});
	}else{
		callback();
	}
}

function setAuthTimeout(ttl){//ttl in seconds
	setTimeout(function(){
		TOKEN = false;
		//TODO possible to make this self refresh rather than lazily doing it above
	}, (ttl-5)*1000);//minus 5 sec to help buffer, in milliseconds
}

function checkInfo(callback){
	if(!USER_INFO){
		//module.exports.v1.ACCOUNT.GET.USERS_ME(callback)
		user(TOKEN, callback);
	}else{
		callback(USER_INFO);
	}
}


const API_V1 = "https://cloud.cadexchanger.com/api/v1";

function COMMON(opt){
	////TODO add future support for different apis
	opt.host = "cloud.cadexcchanger.com";
	opt.path = "/api/v1";
	opt.protocol = "https:";
}

const GET_USERS_ME = {
	method : "GET",
	path : "/users/me"
};

function FILES(method, query){
	//methods : {GET, POST}
	let opt = {
		method : method,
		path : "/files"
	};
	if(method === "GET"){
		opt.path = "/files?"+qs.stringify(query);
		//fields:
		//parentFolder	: MANDATORY id obtained from GET /users/me
		//ids 		: OPTIONAL array [] of file ids to fetch
		//<field>	: search queries of structure property[criteria]=value
		//		example: name[startsWith]=con
	}
	if(method === "POST"){
		opt.headers["Content-type"] = 'multipart/form-data; charset=utf-8; boundary="'+BOUNDARY+'"';
	}
	return opt;
}

const FILES_ID = function(method, id){
	//methods : {GET, PUT, DELETE}
	let opt = {
		method : method,
		path : "/files/"+id
	};
	if(method === "PUT"){
		opt.headers = opt.headers || {};
		opt.headers['Content-type'] = 'application/json';
	}
}

const FILES_SHARING = function(method, id){
	//methods : {GET, PUT}	
	return {
		method : method,
		path : "/files/"+id+"/sharing"
	};
}

const FILE_REVISIONS = function(method, query){
	//methods : {POST, GET}	
	let opt = {
		method : method,
		path : "/filerevisions"+qs.stringify(query)
	};
	if(method === "POST"){
		opt.headers = opt.headers || {};
		opt.headers['Content-type'] = 'multipart/form-data; charset=utf-8; boundary="'+BOUNDARY+'"';
	}
	return opt;
		
}

const FILE_REVISIONS_ID = function(method, id){
	//methods : {GET, DELETE}	
	return {
		method : method,
		path : "/filerevisions/"+id
	};
}

const FOLDERS = function(method, query){
	//methods : {POST, GET}	
	let opt = {
		method : method,
		path : "/folders"+qs.stringify(query)
	};
	if(method === "POST"){
		opt.headers = opt.headers || {};
		opt.headers['Content-type'] = 'application/json';
	}
}

const FOLDERS_ID = function(method, id){
	//methods : {GET, PUT, DELETE}
	return {
		method : method,
		path : "/folders/"+id
	}
	if(method === "PUT"){
		opt.headers['Content-type'] = 'application/json';
	}
};

const FILES_EXTENSIONS = {
	method : "GET",
	path : "/files/extensions"
};

const CONVERSIONS = {
	method : "POST",
	path : "/conversions"
};

const CONVERSIONS_ID = function(method, id){
	//methods : {GET, DELETE}	
	return {
		method : method,
		path : "/conversions/"+id
	};
};

const FILES_CONVERT = function(id){
	return {
		method : "POST",
		path : "/files/"+id+"/convert"
	}
};

const CONVERSIONS_RESULT = function(id){
	return {
		method : "GET",
		path : "/conversions/"+id+"/result"
	};
};

const EMBEDDED_VIEWER = function(id, cameraType, displayMode){
	let opt = {
		method : "GET",
		path : "/embedded.html?fileId="+id
	};
};


 
const USERS = {};
/*
auth(AUTH_PAYLOAD, (authObject) => {
	let token = authObject.access_token;
	user(token, (res) => {
		console.log(res);
		USERS[res.user.id] = res.user; 
		ls(token, res.user.rootFolder, (r) =>{
			listFiles(r);
		});
		/*API.v1.CONVERSION.POST.FILES_ID_CONVERT(
			"60186e0ead2eb7002794bd62",
			"3dm",
			{ "Rhino" : {"export" : { "version" : 4 } } },
			console.log
		);
	});
	 
});
*/

function listFiles(lsResult){
	let files = lsResult.files;
	for(i=0; i < files.length; i++){
		let fileName = files[i].name;
		let size = files[i].size;
		let id = files[i].id;
		let parentFolder = files[i].parentFolder;
		let owner = files[i].owner;
		let lastModified = new Date(files[i].updatedAt);
		let date = lastModified.getFullYear()+"/"+lastModified.getMonth()+"/"+lastModified.getDay();
		let time = lastModified.getHours()+":"+lastModified.getMinutes();
		console.log(fileName+" "+id);
		//TODO format it nice like ls
	}
}

function auth(payload, callback){
	//remove client_id/secret form the payload
	let content = JSON.stringify({
		"grant_type": payload.grant_type,
		"scope": payload.scope
	});

	let opt = {
		method : "POST",
		host : "cloud.cadexchanger.com",
		path : "/api/v1/oauth2/token",
		protocol : "https:",
		port : 443,
		auth : payload.client_id+":"+payload.client_secret,
		headers: {
			'Content-type' : 'application/json',
			'Content-Length' : content.length
		}
	}
	let resBody = "";

	const req = https.request(opt, function(res){
		console.log(res.statusCode);
		//TODO handle known errors
		res.setEncoding("utf8");
		res.on('data', function(chunk){
			resBody += chunk;
		});
		res.on('end', function(){
			console.log(resBody);
			if(callback){
				callback(JSON.parse(resBody));
			}
		});
	});
	req.on('error', (e) => {
		console.log(e.message);
	});
	req.write(content);
	req.end();
}

function user(token, callback){
	let opt = {
		method : "GET",
		host : "cloud.cadexchanger.com",
		//path : "/api/v1/users/me",
		path : "/users/me",
		protocol : "https:",
		port : 443,
		headers : {
			'Authorization' : 'Bearer '+token,
		}
	}
	getRequest(opt, callback);
}

function ls(token, directory, callback){
	let opt = {
		method : "GET",
		host : "cloud.cadexchanger.com",
		//path : "/api/v1/files?parentFolder="+directory,
		path : "/files?parentFolder="+directory,
		protocol : "https:",
		port : 443,
		headers : {
			'Authorization' : 'Bearer '+token,
		}
	}
	getRequest(opt, callback);
}

function folders(token, directory, callback){

}

function convert(token, fileId, format, callback){

}

function rm(token, fileId, callback){

}

function put(token, callback){

}

function get(token, fileId, callback) {

}

function request(opt, callback){
	
}



//api calls

/*
const http = require("https");

const options = {
  "method": "POST",
  "hostname": "cloud.cadexchanger.com",
  "port": null,
  "path": "/api/v1/files",
  "headers": {
    "Authorization": "Bearer <access_token>",
    "Content-Length": "0",
    "content-type": "multipart/form-data; boundary=---011000010111000001101001"
  }
};

const req = http.request(options, function (res) {
  const chunks = [];

  res.on("data", function (chunk) {
    chunks.push(chunk);
  });

  res.on("end", function () {
    const body = Buffer.concat(chunks);
    console.log(body.toString());
  });
});

req.write("-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"parentFolder\"\r\n\r\n5bbc5098001f642aaa4f89fe\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"data\"\r\n\r\n\r\n-----011000010111000001101001--\r\n");
req.end();
*/


