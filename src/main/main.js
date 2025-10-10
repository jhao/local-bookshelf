const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const util = require('util');
const { exec } = require('child_process');
const JSZip = require('jszip');
const { XMLParser } = require('fast-xml-parser');
const mammoth = require('mammoth');

const fsPromises = fs.promises;
const execAsync = util.promisify(exec);
const xmlParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });

const {
  initializeDatabase,
  loadState,
  saveState,
  getBootstrapData,
  resetDatabase,
  backupDatabase
} = require('./database');

const tts = require('./tts');
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

function parseFindOutput(output = '', rootPath) {
  const lines = output.split(/\r?\n/);
  const files = [];
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed === '.' || trimmed === './') {
      return;
    }
    const relative = trimmed.startsWith('./') ? trimmed.slice(2) : trimmed;
    if (!relative) {
      return;
    }
    const fullPath = path.resolve(rootPath, relative);
    files.push(fullPath);
  });
  return files;
}

function parseTreeOutput(output = '', rootPath) {
  const lines = output.split(/\r?\n/);
  const files = [];
  const stack = [rootPath];
  const summaryPattern = /^\s*\d+\s+(File|Dir)\(s\)/i;
  lines.forEach((line) => {
    if (!line || !line.trim()) {
      return;
    }
    const trimmed = line.trim();
    if (/^(Folder PATH listing|Volume serial number)/i.test(trimmed)) {
      return;
    }
    if (/^[A-Za-z]:\\/.test(trimmed)) {
      stack.length = 1;
      stack[0] = trimmed;
      return;
    }
    if (summaryPattern.test(trimmed)) {
      return;
    }
    const normalized = line.replace(/\|   /g, '    ').replace(/`   /g, '    ');
    const content = normalized.trim();
    if (!content) {
      return;
    }
    if (content.startsWith('+---') || content.startsWith('\\---')) {
      const name = content.slice(4).trim();
      const depth = Math.max(0, Math.floor(normalized.indexOf(content) / 4));
      const parent = stack[depth] || stack[stack.length - 1] || rootPath;
      const fullPath = path.join(parent, name);
      stack[depth + 1] = fullPath;
      return;
    }
    if (content.endsWith('\\')) {
      const name = content.slice(0, -1);
      const depth = Math.max(0, Math.floor(normalized.indexOf(content) / 4));
      const parent = stack[depth] || stack[stack.length - 1] || rootPath;
      const fullPath = path.join(parent, name);
      stack[depth + 1] = fullPath;
      return;
    }
    const depth = Math.max(0, Math.floor(normalized.indexOf(content) / 4));
    const parent = stack[depth] || stack[stack.length - 1] || rootPath;
    const fullPath = path.join(parent, content);
    files.push(fullPath);
  });
  return files;
}

async function walkDirectory(directoryPath, collector = []) {
  const entries = await fsPromises.readdir(directoryPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      try {
        await walkDirectory(fullPath, collector);
      } catch (error) {
        console.warn('Failed to traverse directory', fullPath, error);
      }
      continue;
    }
    if (entry.isFile()) {
      collector.push(fullPath);
    }
  }
  return collector;
}

async function enumerateDirectory(directoryPath) {
  const isWindows = process.platform === 'win32';
  const isDarwin = process.platform === 'darwin';
  try {
    if (isWindows) {
      const command = `tree "${directoryPath}" /F /A`;
      const { stdout } = await execAsync(command, { maxBuffer: 20 * 1024 * 1024 });
      const parsed = parseTreeOutput(stdout, directoryPath);
      if (parsed.length) {
        return parsed;
      }
    } else {
      const command = 'find . -type f -print';
      const { stdout } = await execAsync(command, { cwd: directoryPath, maxBuffer: 20 * 1024 * 1024 });
      const parsed = parseFindOutput(stdout, directoryPath);
      if (parsed.length || !isDarwin) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn('Directory enumeration command failed', error);
  }
  return walkDirectory(directoryPath);
}

ipcMain.handle('fs:enumerate-files', async (_event, options = {}) => {
  const directoryPath = options.path;
  if (!directoryPath || typeof directoryPath !== 'string') {
    return { path: directoryPath || null, exists: false, files: [], totalFiles: 0, error: 'Invalid path' };
  }
  try {
    const stats = await fsPromises.stat(directoryPath);
    if (!stats.isDirectory()) {
      return { path: directoryPath, exists: false, files: [], totalFiles: 0, error: 'Not a directory' };
    }
  } catch (error) {
    return { path: directoryPath, exists: false, files: [], totalFiles: 0, error: error.message };
  }

  try {
    const paths = await enumerateDirectory(directoryPath);
    const uniquePaths = Array.from(new Set(paths));
    const files = [];
    for (const filePath of uniquePaths) {
      try {
        const stats = await fsPromises.stat(filePath);
        if (!stats.isFile()) {
          continue;
        }
        files.push({
          path: filePath,
          name: path.basename(filePath),
          size: stats.size,
          modifiedAt: stats.mtimeMs,
          extension: path.extname(filePath).replace(/^\./, '').toLowerCase()
        });
      } catch (error) {
        console.warn('Failed to inspect file', filePath, error);
      }
    }
    return { path: directoryPath, exists: true, files, totalFiles: uniquePaths.length };
  } catch (error) {
    console.error('Failed to enumerate directory', error);
    return { path: directoryPath, exists: false, files: [], totalFiles: 0, error: error.message };
  }
});

function normalizeExtension(format, filePath) {
  if (typeof format === 'string' && format.trim()) {
    return format.trim().toLowerCase();
  }
  if (typeof filePath === 'string') {
    const ext = path.extname(filePath).replace(/^\./, '');
    if (ext) {
      return ext.toLowerCase();
    }
  }
  return '';
}

function sanitizePlainText(content) {
  if (!content) {
    return '';
  }
  return content
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\t ]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractReadableText(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    return '';
  }
  const utf8 = buffer.toString('utf8');
  let cleaned = sanitizePlainText(utf8);
  if (cleaned.length < 64) {
    const latin = sanitizePlainText(buffer.toString('latin1'));
    if (latin.length > cleaned.length) {
      cleaned = latin;
    }
  }
  if (cleaned.length > 40000) {
    cleaned = `${cleaned.slice(0, 40000)}…`;
  }
  return cleaned;
}

function sanitizeHtmlSnippet(html) {
  if (!html) {
    return '';
  }
  return html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
}

async function extractEpubPreview(buffer) {
  try {
    const zip = await JSZip.loadAsync(buffer);
    const containerFile = zip.file('META-INF/container.xml');
    let rootPath = null;
    if (containerFile) {
      const containerXml = await containerFile.async('text');
      const container = xmlParser.parse(containerXml);
      const rootfile = container?.container?.rootfiles?.rootfile;
      const entry = Array.isArray(rootfile) ? rootfile[0] : rootfile;
      rootPath =
        entry?.['full-path'] || entry?.['fullPath'] || entry?.fullpath || entry?.['@_full-path'] || entry?.['Full-Path'];
    }

    let manifestItems = [];
    let spineItems = [];
    if (rootPath) {
      const opfFile = zip.file(rootPath);
      if (opfFile) {
        const opfXml = await opfFile.async('text');
        const opf = xmlParser.parse(opfXml);
        const manifest = opf?.package?.manifest?.item;
        const spine = opf?.package?.spine?.itemref;
        if (manifest) {
          manifestItems = Array.isArray(manifest) ? manifest : [manifest];
        }
        if (spine) {
          spineItems = Array.isArray(spine) ? spine : [spine];
        }
        const firstSpine = spineItems[0];
        const idref = firstSpine?.idref || firstSpine?.['@_idref'] || firstSpine?.idRef;
        if (idref) {
          const target = manifestItems.find((item) => item?.id === idref || item?.['@_id'] === idref);
          const href = target?.href || target?.['@_href'];
          if (href) {
            const base = rootPath.includes('/') ? rootPath.slice(0, rootPath.lastIndexOf('/') + 1) : '';
            const normalized = path.posix.join(base, href).replace(/^\//, '');
            const htmlFile = zip.file(normalized) || zip.file(href);
            if (htmlFile) {
              const html = await htmlFile.async('text');
              return sanitizeHtmlSnippet(html);
            }
          }
        }
      }
    }

    const fallback = Object.values(zip.files).find((entry) => /\.(x?html?|htm)$/i.test(entry.name));
    if (fallback) {
      const html = await fallback.async('text');
      return sanitizeHtmlSnippet(html);
    }
  } catch (error) {
    console.warn('Failed to extract EPUB preview', error);
  }
  return null;
}

ipcMain.handle('tts:list-voices', async () => {
  try {
    const voices = await tts.listVoices();
    return { success: true, voices };
  } catch (error) {
    console.error('Failed to enumerate TTS voices', error);
    return { success: false, error: error?.message || 'unavailable' };
  }
});

ipcMain.handle('tts:synthesize', async (_event, options = {}) => {
  try {
    const result = await tts.synthesize(options.text || '', { voice: options.voice });
    return { success: true, ...result };
  } catch (error) {
    if (error?.code === 'BUSY') {
      return { success: false, error: 'busy' };
    }
    if (error?.message === 'empty') {
      return { success: false, error: 'empty' };
    }
    console.error('Failed to synthesize speech', error);
    return { success: false, error: error?.message || 'unavailable' };
  }
});

ipcMain.handle('preview:load', async (_event, options = {}) => {
  const filePath = options.path;
  const format = normalizeExtension(options.format, filePath);
  if (!filePath || typeof filePath !== 'string') {
    return { success: false, error: 'Missing file path' };
  }
  try {
    await fsPromises.access(filePath, fs.constants.R_OK);
  } catch (error) {
    return { success: false, error: 'File not accessible' };
  }

  try {
    const buffer = await fsPromises.readFile(filePath);
    if (format === 'pdf') {
      return {
        success: true,
        kind: 'dataUrl',
        mime: 'application/pdf',
        data: `data:application/pdf;base64,${buffer.toString('base64')}`
      };
    }
    if (format === 'txt') {
      return { success: true, kind: 'text', content: sanitizePlainText(buffer.toString('utf8')) };
    }
    if (format === 'docx') {
      const result = await mammoth.convertToHtml({ buffer });
      return { success: true, kind: 'html', content: sanitizeHtmlSnippet(result.value || '') };
    }
    if (format === 'epub') {
      const html = await extractEpubPreview(buffer);
      if (html) {
        return { success: true, kind: 'html', content: html };
      }
    }
    if (format === 'mobi' || format === 'azw3') {
      const text = extractReadableText(buffer);
      if (text) {
        return { success: true, kind: 'text', content: text };
      }
    }
    const fallbackText = extractReadableText(buffer);
    if (fallbackText) {
      return { success: true, kind: 'text', content: fallbackText };
    }
    return { success: false, error: 'Unsupported preview format' };
  } catch (error) {
    console.error('Failed to load preview asset', error);
    return { success: false, error: error.message };
  }
});
