const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // правильный путь
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

// Обработка события на запись файла
ipcMain.on('write-file', (event, filename, content) => {
  const filePath = path.join(__dirname, filename); // можно изменить путь
  fs.writeFileSync(filePath, content);
});
