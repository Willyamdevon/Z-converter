const { app, BrowserWindow, ipcMain, Menu, dialog, shell } = require('electron');
// const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const { convertPngToGif, convertJpgToGif, convertPngToJpg, convertJpgToPng, convertMkvToMp4, convertMp4ToMov, convertMp4ToMp3, convertMkvToMp3, convertMkvToWav, convertMkvToMov, convertMp4ToWav, convertMp3ToWav, convertWavToMp3} = require('./converterImages');


// const ffmpegPath = process.env.NODE_ENV === 'development'
//   ? require('ffmpeg-static')
//   : path.join(process.resourcesPath, 'ffmpeg.exe');

// ffmpeg.setFfmpegPath(ffmpegPath); 


const args = process.argv.slice(1);
if (args.some(arg => arg.startsWith('--from='))) {
  const { app } = require('electron');
  const { handleDllConversion } = require('./dll-handler');

  app.whenReady().then(async () => {
    await handleDllConversion(args);
    app.quit();
  });
  return;
}


function getOutputPath(inputPath, newExtension) {
  return path.join(
    path.dirname(inputPath),
    `${path.basename(inputPath, path.extname(inputPath))}${newExtension}`
  );
}


function createWindow() {
  const win = new BrowserWindow({
    width: 850,
    height: 700,
    minWidth: 600,
    minHeight: 400,
    maxWidth: 1200,
    maxHeight: 900,
    resizable: true,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    },
  });

  Menu.setApplicationMenu(null);
  win.loadFile('index.html');

  ipcMain.on('window:minimize', () => win.minimize());
  ipcMain.on('window:maximize', () => {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  });
  
  ipcMain.on('window:close', () => win.close());

  win.webContents.openDevTools() // DevTools

}

ipcMain.handle('convert-file', async (_, { type, inputPath, outputPath, options }) => {
  switch(type) {
    case 'png-to-gif':
      return await convertPngToGif(inputPath, outputPath);
    case 'jpg-to-gif':
      return await convertJpgToGif(inputPath, outputPath, options);
    case 'png-to-jpg':
      return await convertPngToJpg(inputPath, outputPath, options?.quality);
    case 'jpg-to-png':
      return await convertJpgToPng(inputPath, outputPath);
    case 'mkv-to-mp4':
      return await convertMkvToMp4(inputPath, outputPath);
    case 'mp4-to-mov':
      return await convertMp4ToMov(inputPath, outputPath);
    case 'mp4-to-mp3':
      return await convertMp4ToMp3(inputPath, outputPath);
    case 'mkv-to-mp3':
      return await convertMkvToMp3(inputPath, outputPath);
    case 'mkv-to-wav':
      return await convertMkvToWav(inputPath, outputPath);
    case 'mkv-to-mov':
      return await convertMkvToMov(inputPath, outputPath);
    case 'mp4-to-wav':
      return await convertMp3ToWav(inputPath, outputPath);
    case 'wav-to-mp3':
      return await convertWavToMp3(inputPath, outputPath)
    default:
      return { success: false, error: `Unknown conversion type: ${type}` };
  }
});


ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Files', extensions: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mkv', "mp3", "wav", 'mov'] }
    ]
  });
  return result.filePaths[0];
});

ipcMain.handle('save-file-dialog', async (event, defaultPath) => {
  const result = await dialog.showSaveDialog({
    defaultPath,
    filters: [
      { name: 'Files', extensions: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mkv', "mp3", "wav", 'mov'] }
    ]
  });
  return result.filePath;
});

ipcMain.on('open-folder', (event, path) => {
  shell.showItemInFolder(path);
});

ipcMain.handle('open-folder-dialog', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  return result.filePaths[0];
});
app.whenReady().then(createWindow);
