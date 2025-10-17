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
  },
  enumerateFiles(directoryPath, options = {}) {
    const payload =
      options && typeof options === 'object' ? { ...options, path: directoryPath } : { path: directoryPath };
    return ipcRenderer.invoke('fs:enumerate-files', payload);
  },
  loadPreviewAsset(options) {
    return ipcRenderer.invoke('preview:load', options);
  },
  openFoliate(options) {
    return ipcRenderer.invoke('foliate:open', options);
  },
  revealInFileManager(targetPath) {
    return ipcRenderer.invoke('file:reveal', { path: targetPath });
  },
  onMenuCommand(callback) {
    if (typeof callback !== 'function') {
      return () => {};
    }
    const subscription = (_event, command) => {
      callback(command);
    };
    ipcRenderer.on('menu:command', subscription);
    return () => {
      ipcRenderer.removeListener('menu:command', subscription);
    };
  },
  notifyLocaleChanged(locale) {
    if (!locale) {
      return;
    }
    ipcRenderer.send('locale:changed', locale);
  }
});
