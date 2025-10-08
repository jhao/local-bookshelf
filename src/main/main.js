const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

const {
  initializeDatabase,
  loadState,
  saveState,
  getBootstrapData,
  resetDatabase,
  backupDatabase
} = require('./database');

const isDev = process.env.NODE_ENV !== 'production';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    title: 'Local Bookshelf',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

app.whenReady().then(() => {
  try {
    initializeDatabase();
  } catch (error) {
    console.error('Failed to initialize database', error);
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('dialog:select-directory', async (event, options = {}) => {
  const browserWindow = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showOpenDialog(browserWindow, {
    title: 'Choose a folder',
    defaultPath: options.defaultPath || undefined,
    properties: ['openDirectory', 'createDirectory']
  });
  if (result.canceled || !result.filePaths.length) {
    return null;
  }
  return result.filePaths[0];
});

ipcMain.handle('state:load', async () => {
  try {
    return loadState();
  } catch (error) {
    console.error('Failed to load state from database', error);
    return null;
  }
});

ipcMain.handle('state:save', async (_event, nextState) => {
  try {
    return saveState(nextState);
  } catch (error) {
    console.error('Failed to persist state to database', error);
    return false;
  }
});

ipcMain.handle('bootstrap:data', async () => {
  try {
    return getBootstrapData();
  } catch (error) {
    console.error('Failed to load bootstrap data', error);
    return null;
  }
});

ipcMain.handle('system:initialize', async () => {
  try {
    resetDatabase();
    return { success: true };
  } catch (error) {
    console.error('Failed to reset database', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('system:backup', async (event, options = {}) => {
  const browserWindow = BrowserWindow.fromWebContents(event.sender);
  const timestamp = new Date()
    .toISOString()
    .replace(/[:]/g, '-')
    .replace(/\..+$/, '');
  const defaultFileName = options.defaultFileName || `local-bookshelf-backup-${timestamp}.db`;
  const defaultPath = options.defaultPath || path.join(app.getPath('documents'), defaultFileName);
  const result = await dialog.showSaveDialog(browserWindow, {
    title: 'Create database backup',
    defaultPath,
    filters: [{ name: 'SQLite Database', extensions: ['db'] }]
  });
  if (result.canceled || !result.filePath) {
    return { success: false, cancelled: true };
  }
  try {
    await backupDatabase(result.filePath);
    return { success: true, path: result.filePath };
  } catch (error) {
    console.error('Failed to back up database', error);
    return { success: false, message: error.message };
  }
});
