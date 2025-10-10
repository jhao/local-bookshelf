const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const fsPromises = fs.promises;

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

ipcMain.handle('fs:read-directory', async (_event, options = {}) => {
  const directoryPath = options.path;
  if (!directoryPath || typeof directoryPath !== 'string') {
    return { path: directoryPath || null, exists: false, directories: [], files: [], error: 'Invalid path' };
  }
  try {
    const stats = await fsPromises.stat(directoryPath);
    if (!stats.isDirectory()) {
      return { path: directoryPath, exists: false, directories: [], files: [], error: 'Not a directory' };
    }
  } catch (error) {
    return { path: directoryPath, exists: false, directories: [], files: [], error: error.message };
  }

  try {
    const entries = await fsPromises.readdir(directoryPath, { withFileTypes: true });
    const directories = [];
    const files = [];
    for (const entry of entries) {
      try {
        const fullPath = path.join(directoryPath, entry.name);
        if (entry.isDirectory()) {
          directories.push({ path: fullPath, name: entry.name });
          continue;
        }
        if (entry.isFile()) {
          const fileStats = await fsPromises.stat(fullPath);
          files.push({
            path: fullPath,
            name: entry.name,
            size: fileStats.size,
            modifiedAt: fileStats.mtimeMs,
            extension: entry.name.includes('.') ? entry.name.split('.').pop().toLowerCase() : ''
          });
        }
      } catch (error) {
        // Skip problematic entries but continue scanning.
        console.warn('Failed to inspect directory entry', error);
      }
    }

    return { path: directoryPath, exists: true, directories, files };
  } catch (error) {
    return { path: directoryPath, exists: false, directories: [], files: [], error: error.message };
  }
});
