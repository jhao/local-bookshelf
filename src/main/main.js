const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = process.env.NODE_ENV !== 'production';

function getStateFilePath() {
  return path.join(app.getPath('userData'), 'local-bookshelf-state.json');
}

async function readStateFromDisk() {
  const filePath = getStateFilePath();
  try {
    const data = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    console.error('Failed to read persisted state', error);
    return null;
  }
}

async function writeStateToDisk(state) {
  if (!state || typeof state !== 'object') {
    return false;
  }
  const filePath = getStateFilePath();
  try {
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, JSON.stringify(state, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Failed to write persisted state', error);
    return false;
  }
}

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
  return readStateFromDisk();
});

ipcMain.handle('state:save', async (_event, nextState) => {
  return writeStateToDisk(nextState);
});
