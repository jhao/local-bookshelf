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
  }
});
