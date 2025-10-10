const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  selectDirectory(defaultPath) {
    return ipcRenderer.invoke('dialog:select-directory', { defaultPath });
  },
  loadState() {
    return ipcRenderer.invoke('state:load');
  },
  saveState(state) {
    return ipcRenderer.invoke('state:save', state);
  },
  bootstrap() {
    return ipcRenderer.invoke('bootstrap:data');
  },
  initializeSystem() {
    return ipcRenderer.invoke('system:initialize');
  },
  backupSystem(options) {
    return ipcRenderer.invoke('system:backup', options);
  },
  readDirectoryEntries(directoryPath) {
    return ipcRenderer.invoke('fs:read-directory', { path: directoryPath });
  }
});
