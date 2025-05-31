const { app, BrowserWindow, ipcMain, Menu, dialog, shell } = require('electron');
const { convertPngToGif, convertJpgToGif, convertPngToJpg, convertJpgToPng } = require('./converterImages');
const path = require('path');

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

// Обработчик конвертации
// ipcMain.handle('convert-file', async (_, { inputPath, outputFormat }) => {
//   try {
//     const outputPath = getOutputPath(inputPath, `.${outputFormat.toLowerCase()}`);
//     const inputExt = path.extname(inputPath).slice(1).toLowerCase();
//     const converterName = `${inputExt}To${outputFormat.toLowerCase()}`;

//     if (!converters[converterName]) {
//       throw new Error(`Unsupported conversion: ${inputExt} to ${outputFormat}`);
//     }

//     await converters[converterName](inputPath, outputPath);
//     return { success: true, outputPath };
//   } catch (error) {
//     console.error('Conversion error:', error);
//     return { success: false, error: error.message };
//   }
// });

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
    default:
      return { success: false, error: `Unknown conversion type: ${type}` };
  }
});


// Диалог выбора файла
ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'ico'] }
    ]
  });
  return result.filePaths[0];
});

// Диалог сохранения файла
ipcMain.handle('save-file-dialog', async (event, defaultPath) => {
  const result = await dialog.showSaveDialog({
    defaultPath,
    filters: [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'ico'] }
    ]
  });
  return result.filePath;
});

ipcMain.on('open-folder', (event, path) => {
  // Открываем папку и выделяем файл (но не открываем его)
  shell.showItemInFolder(path);
});

ipcMain.handle('open-folder-dialog', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'] // Ключевое отличие!
  });
  return result.filePaths[0]; // Возвращаем первую выбранную папку
});
app.whenReady().then(createWindow);
