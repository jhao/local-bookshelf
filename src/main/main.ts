import { app, BrowserWindow, nativeTheme } from 'electron';
import path from 'path';

const isDev = process.env.NODE_ENV !== 'production';

if (isDev) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('ts-node').register({
    project: path.resolve(__dirname, '../../tsconfig.preload.json')
  });
}

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1e1e1e' : '#ffffff',
    webPreferences: {
      preload: isDev
        ? path.join(__dirname, '../preload/index.ts')
        : path.join(__dirname, '..', 'preload', 'index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev) {
    const rendererUrl = process.env.VITE_DEV_SERVER_URL ?? 'http://localhost:5173';
    mainWindow.loadURL(rendererUrl);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    const rendererPath = path.join(__dirname, '..', 'renderer', 'index.html');
    mainWindow.loadFile(rendererPath);
  }
}

app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
