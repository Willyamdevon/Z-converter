const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  writeFile: (filename, content) => {
    ipcRenderer.send('write-file', filename, content);
  }
});
