//debug run:
//npm start -- -d
//or
//electron main.js -d
const {app, BrowserWindow, Menu, MenuItem} = require('electron')
const url = require('url')
const path = require('path')

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

app.whenReady().then(createWindow);

