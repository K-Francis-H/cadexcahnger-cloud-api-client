//debug run:
//npm start -- -d
//or
//electron main.js -d
const {app, BrowserWindow, Menu, MenuItem, ipcMain, dialog} = require('electron');
const url = require('url');
const path = require('path');
const fs = require('fs');

const AUTH = JSON.parse(fs.readFileSync("auth.json", "utf8"));
//TODO if AUTH doesnot exist cant be loaded pop a dialog asking user to give us the creds
const API = require("./auth_convert_dl.js")(AUTH);

const CACHE = {};//persistent cache object for storing data between html files

let win

function createWindow() {
	win = new BrowserWindow({
		width: 800, 
		height: 600, 
		webPreferences : { 
			nodeIntegration: true
		}
	});
	//win.loadFile('index.html');
	win.loadURL(url.format ({ 
		pathname: path.join(__dirname, 'index.html'), 
		protocol: 'file:', 
		slashes: true 
	})); 

	if(process.argv[2] === "-d"){
		win.webContents.openDevTools();
	}
}

function dlog(msg){
	win.webContents.send('log', msg);
}

//TODO we need to know the context in which this was called on the renderer side. Try to just open and use dialog there...
ipcMain.on('uploadFile', (event, path) => {
	dialog.showOpenDialog({properties: ['openFile']}).then( (result) => {
		console.log(result);
		if(result.filePaths[0]){//at least one file selected, ignore others
			let file = {
				name: result.filePaths[0],
				data: fs.readFileSync(result.filePaths[0]) //Buffer
			}
			event.sender.send("fileUploadData", file);
		}else{
			dlog("no file selected");
		}
	});
});

ipcMain.on('download', (event, name, data) => {
	//let fileId = arg[0];
	dlog(name);
	//TODO recieve buffer or do all downloading from here...
	//dialog.showSaveDialog(...()=>{});
	//API.v1.DATA.GET.downloadFile(arg, (res) => {
		//open save dialog then write buffer to file chosen by save dialog...
	let path = dialog.showSaveDialogSync({
		title : "Save File",
		defaultPath : name,
		//
		properties : ["showOverwriteConfirmation"]
	});
	if(path){//otherwise user cancelled
		fs.writeFileSync(path, data);
	}
	//});
});

//for these calls arg = [key, value]
ipcMain.on('store', (event, key, value) => {
	CACHE[key] = value;
	dlog(CACHE);
});

ipcMain.on('retrieve', (event, key) => {
	event.sender.send('retrieve', key, CACHE[key]);
});

ipcMain.on('retrieveAndDestroy', (event, key) => {
	event.sender.send('retrieve', key, CACHE[key]);
	delete CACHE[key];
});

app.whenReady().then(createWindow);

