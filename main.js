//debug run:
//npm start -- -d
//or
//electron main.js -d
const {app, BrowserWindow, Menu, MenuItem, ipcMain, dialog} = require('electron');
const url = require('url');
const path = require('path');
const fs = require('fs');

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
			console.log("no file selected");
		}
	});
});

app.whenReady().then(createWindow);

