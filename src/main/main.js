const { app, BrowserWindow, ipcMain, dialog, Menu, screen } = require('electron');
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
const WINDOW_ASPECT_RATIO = 3 / 4;

let languageMenuItems = {
  en: null,
  zh: null
};
let currentLocale = 'en';
let mainWindowRef = null;

function buildEditMenu(locale) {
  if (process.platform === 'darwin') {
    return { role: 'editMenu' };
  }

  const isZh = locale === 'zh';
  return {
    label: isZh ? '编辑' : 'Edit',
    submenu: [
      { role: 'undo', label: isZh ? '撤销' : 'Undo' },
      { role: 'redo', label: isZh ? '重做' : 'Redo' },
      { type: 'separator' },
      { role: 'cut', label: isZh ? '剪切' : 'Cut' },
      { role: 'copy', label: isZh ? '复制' : 'Copy' },
      { role: 'paste', label: isZh ? '粘贴' : 'Paste' },
      { role: 'selectAll', label: isZh ? '全选' : 'Select All' }
    ]
  };
}

function buildMenuTemplate(locale, mainWindow) {
  return [
    ...(process.platform === 'darwin'
      ? [
          {
            role: 'appMenu'
          },
          buildEditMenu(locale)
        ]
      : [buildEditMenu(locale)]),
    {
      label: '后台任务',
      click: () => {
        if (
          !mainWindow.isDestroyed() &&
          mainWindow.webContents &&
          !mainWindow.webContents.isDestroyed()
        ) {
          mainWindow.webContents.send('menu:command', { type: 'navigate', target: 'monitor' });
        }
      }
    },
    {
      label: '系统设置',
      click: () => {
        if (
          !mainWindow.isDestroyed() &&
          mainWindow.webContents &&
          !mainWindow.webContents.isDestroyed()
        ) {
          mainWindow.webContents.send('menu:command', { type: 'navigate', target: 'settings' });
        }
      }
    },
    {
      label: '语言切换',
      submenu: [
        {
          id: 'language-en',
          label: 'English',
          type: 'radio',
          checked: locale !== 'zh',
          click: () => {
            if (
              !mainWindow.isDestroyed() &&
              mainWindow.webContents &&
              !mainWindow.webContents.isDestroyed()
            ) {
              mainWindow.webContents.send('menu:command', { type: 'locale', locale: 'en' });
            }
          }
        },
        {
          id: 'language-zh',
          label: '中文',
          type: 'radio',
          checked: locale === 'zh',
          click: () => {
            if (
              !mainWindow.isDestroyed() &&
              mainWindow.webContents &&
              !mainWindow.webContents.isDestroyed()
            ) {
              mainWindow.webContents.send('menu:command', { type: 'locale', locale: 'zh' });
            }
          }
        }
      ]
    }
  ];
}

function applyMenuTemplate(mainWindow, locale) {
  const menu = Menu.buildFromTemplate(buildMenuTemplate(locale, mainWindow));
  Menu.setApplicationMenu(menu);
  languageMenuItems = {
    en: menu.getMenuItemById('language-en'),
    zh: menu.getMenuItemById('language-zh')
  };
}

function createWindow() {
  const { workAreaSize } = screen.getPrimaryDisplay();
  let targetHeight = Math.round(workAreaSize.height * 0.8);
  let targetWidth = Math.round(targetHeight * WINDOW_ASPECT_RATIO);

  if (targetWidth > workAreaSize.width) {
    targetWidth = Math.round(workAreaSize.width * 0.9);
    targetHeight = Math.round(targetWidth / WINDOW_ASPECT_RATIO);
  }

  const minWidth = Math.min(targetWidth, Math.max(Math.round(targetWidth * 0.6), 480));
  const minHeight = Math.min(targetHeight, Math.max(Math.round(targetHeight * 0.6), 600));

  const mainWindow = new BrowserWindow({
    width: targetWidth,
    height: targetHeight,
    minWidth,
    minHeight,
    title: '本地图书管理',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindowRef = mainWindow;
  mainWindow.setAspectRatio(WINDOW_ASPECT_RATIO);

  applyMenuTemplate(mainWindow, currentLocale);

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

ipcMain.on('locale:changed', (_event, locale) => {
  if (!locale) {
    return;
  }
  currentLocale = locale;
  if (mainWindowRef && !mainWindowRef.isDestroyed()) {
    applyMenuTemplate(mainWindowRef, currentLocale);
  }
  if (languageMenuItems.en) {
    languageMenuItems.en.checked = locale === 'en';
  }
  if (languageMenuItems.zh) {
    languageMenuItems.zh.checked = locale === 'zh';
  }
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

function escapeHtml(content) {
  if (!content) {
    return '';
  }
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isMeaningfulText(content) {
  if (!content || content.trim().length < 32) {
    return false;
  }
  const letters = content.match(/\p{L}/gu) || [];
  if (letters.length < 16) {
    return false;
  }
  const replacementChars = (content.match(/\uFFFD/g) || []).length;
  if (replacementChars > content.length * 0.05) {
    return false;
  }
  return true;
}

function extractReadableText(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    return '';
  }
  const utf8 = buffer.toString('utf8');
  let cleaned = sanitizePlainText(utf8);
  if (!isMeaningfulText(cleaned)) {
    const latin = sanitizePlainText(buffer.toString('latin1'));
    if (latin.length > cleaned.length) {
      cleaned = latin;
    }
  }
  if (!isMeaningfulText(cleaned)) {
    return '';
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

function normalizeXmlValue(value) {
  if (Array.isArray(value)) {
    return normalizeXmlValue(value[0]);
  }
  if (value && typeof value === 'object') {
    return (
      value['#text'] ||
      value.text ||
      value._text ||
      value._ ||
      value.value ||
      ''
    );
  }
  return value || '';
}

function getAttribute(entry, key) {
  if (!entry) {
    return '';
  }
  return (
    entry[key] ||
    entry[`@_${key}`] ||
    entry[key?.toLowerCase?.()] ||
    entry[key?.toUpperCase?.()] ||
    ''
  );
}

function resolveOpfHref(rootPath, href = '') {
  if (!href) {
    return '';
  }
  const base = rootPath.includes('/') ? rootPath.slice(0, rootPath.lastIndexOf('/') + 1) : '';
  const normalized = path.posix.join(base, href).replace(/^\//, '');
  return normalized
    .split('/')
    .map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch (error) {
        return segment;
      }
    })
    .join('/');
}

function sanitizeEpubContent(html) {
  const cleaned = sanitizeHtmlSnippet(html || '');
  return cleaned.replace(/<img[^>]*>/gi, (match) => {
    const altMatch = match.match(/alt\s*=\s*"([^"]*)"/i) || match.match(/alt\s*=\s*'([^']*)'/i);
    const altText = altMatch ? escapeHtml(altMatch[1]) : '';
    if (altText) {
      return `<figure class="foliate-image-placeholder">${altText}</figure>`;
    }
    return '<figure class="foliate-image-placeholder" aria-hidden="true"></figure>';
  });
}

async function extractEpubViewData(buffer) {
  const result = {
    metadata: {
      title: '',
      creator: '',
      language: ''
    },
    spine: [],
    styles: []
  };
  if (!Buffer.isBuffer(buffer)) {
    return result;
  }
  const zip = await JSZip.loadAsync(buffer);
  const containerFile = zip.file('META-INF/container.xml');
  let rootPath = null;
  if (containerFile) {
    try {
      const containerXml = await containerFile.async('text');
      const container = xmlParser.parse(containerXml);
      const rootfiles = container?.container?.rootfiles?.rootfile;
      const entry = Array.isArray(rootfiles) ? rootfiles[0] : rootfiles;
      rootPath =
        getAttribute(entry, 'full-path') ||
        getAttribute(entry, 'fullPath') ||
        getAttribute(entry, 'Full-Path');
    } catch (error) {
      console.warn('Failed to parse EPUB container.xml', error);
    }
  }
  if (!rootPath) {
    return result;
  }
  const opfFile = zip.file(rootPath);
  if (!opfFile) {
    return result;
  }
  try {
    const opfXml = await opfFile.async('text');
    const opf = xmlParser.parse(opfXml);
    const pkg = opf?.package || {};
    const metadata = pkg.metadata || {};
    result.metadata.title = normalizeXmlValue(metadata['dc:title'] || metadata.title).trim();
    result.metadata.creator = normalizeXmlValue(metadata['dc:creator'] || metadata.creator).trim();
    result.metadata.language = (normalizeXmlValue(metadata['dc:language'] || metadata.language) || 'en').trim();

    const manifestRaw = pkg?.manifest?.item;
    const spineRaw = pkg?.spine?.itemref;
    const manifestItems = manifestRaw
      ? Array.isArray(manifestRaw)
        ? manifestRaw
        : [manifestRaw]
      : [];
    const spineItems = spineRaw ? (Array.isArray(spineRaw) ? spineRaw : [spineRaw]) : [];
    const manifestMap = new Map();
    manifestItems.forEach((item) => {
      const id = getAttribute(item, 'id');
      const href = getAttribute(item, 'href');
      if (!id || !href) {
        return;
      }
      manifestMap.set(id, {
        id,
        href,
        mediaType: getAttribute(item, 'media-type') || getAttribute(item, 'mediaType') || '',
        properties: getAttribute(item, 'properties') || ''
      });
    });

    const styles = [];
    for (const item of manifestMap.values()) {
      if (!item.mediaType || !item.mediaType.includes('css')) {
        continue;
      }
      const entryPath = resolveOpfHref(rootPath, item.href);
      const file = zip.file(entryPath);
      if (!file) {
        continue;
      }
      try {
        let css = await file.async('text');
        css = css.replace(/@import[^;]+;/gi, '');
        styles.push(css.trim());
      } catch (error) {
        console.warn('Failed to read EPUB stylesheet', item.href, error);
      }
    }
    if (styles.length) {
      result.styles = styles;
    }

    let totalCharacters = 0;
    for (const spineEntry of spineItems) {
      const idref = getAttribute(spineEntry, 'idref') || getAttribute(spineEntry, 'idRef');
      if (!idref) {
        continue;
      }
      const manifestItem = manifestMap.get(idref);
      if (!manifestItem) {
        continue;
      }
      if (!manifestItem.mediaType || !/html|xml/i.test(manifestItem.mediaType)) {
        continue;
      }
      const entryPath = resolveOpfHref(rootPath, manifestItem.href);
      const file = zip.file(entryPath) || zip.file(manifestItem.href);
      if (!file) {
        continue;
      }
      try {
        const html = await file.async('text');
        const sanitized = sanitizeEpubContent(html);
        if (!sanitized) {
          continue;
        }
        totalCharacters += sanitized.length;
        result.spine.push({
          id: manifestItem.id,
          href: manifestItem.href,
          label: manifestItem.properties || '',
          content: sanitized
        });
      } catch (error) {
        console.warn('Failed to read EPUB spine entry', entryPath, error);
      }
      if (result.spine.length >= 15 || totalCharacters > 250000) {
        break;
      }
    }

    if (!result.spine.length) {
      const fallback = Object.values(zip.files).find((entry) => /\.(x?html?|htm)$/i.test(entry.name));
      if (fallback) {
        try {
          const html = await fallback.async('text');
          const sanitized = sanitizeEpubContent(html);
          if (sanitized) {
            result.spine.push({
              id: fallback.name,
              href: fallback.name,
              label: 'preview',
              content: sanitized
            });
          }
        } catch (error) {
          console.warn('Failed to extract fallback EPUB preview', error);
        }
      }
    }
  } catch (error) {
    console.warn('Failed to extract EPUB view data', error);
  }
  return result;
}

function isAzw3DrmProtected(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 86) {
    return false;
  }
  try {
    const recordCount = buffer.readUInt16BE(76);
    if (!recordCount || buffer.length < 78 + recordCount * 8) {
      return false;
    }
    const record0Offset = buffer.readUInt32BE(78);
    if (record0Offset + 18 > buffer.length) {
      return false;
    }
    const signature = buffer.toString('ascii', record0Offset + 16, record0Offset + 20);
    if (signature !== 'MOBI') {
      return false;
    }
    const encryptionType = buffer.readUInt16BE(record0Offset + 12);
    return encryptionType !== 0;
  } catch (error) {
    console.warn('Failed to inspect AZW3 DRM status', error);
    return false;
  }
}

async function extractAzw3Preview(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    return '';
  }
  const zipSignature = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
  const zipIndex = buffer.indexOf(zipSignature);
  if (zipIndex === -1) {
    return '';
  }
  try {
    const zipSlice = buffer.slice(zipIndex);
    const zip = await JSZip.loadAsync(zipSlice);
    const opfEntries = zip
      .file(/\.opf$/i)
      .sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of opfEntries) {
      try {
        const opfXml = await entry.async('text');
        const opf = xmlParser.parse(opfXml);
        const manifestRaw = opf?.package?.manifest?.item;
        const spineRaw = opf?.package?.spine?.itemref;
        const manifestItems = manifestRaw
          ? Array.isArray(manifestRaw)
            ? manifestRaw
            : [manifestRaw]
          : [];
        const spineItems = spineRaw ? (Array.isArray(spineRaw) ? spineRaw : [spineRaw]) : [];
        if (manifestItems.length === 0 || spineItems.length === 0) {
          continue;
        }
        const manifestMap = new Map();
        for (const item of manifestItems) {
          const id = item?.id || item?.['@_id'] || item?.Id || item?.ID;
          const href = item?.href || item?.['@_href'] || item?.Href || item?.HREF;
          const mediaType =
            item?.['media-type'] || item?.mediaType || item?.['@_media-type'] || item?.MediaType;
          if (id && href) {
            manifestMap.set(id, { href, mediaType });
          }
        }
        if (!manifestMap.size) {
          continue;
        }
        const basePath = entry.name.includes('/') ? entry.name.slice(0, entry.name.lastIndexOf('/') + 1) : '';
        for (const spineItem of spineItems) {
          const idref = spineItem?.idref || spineItem?.['@_idref'] || spineItem?.idRef || spineItem?.IDREF;
          if (!idref || !manifestMap.has(idref)) {
            continue;
          }
          const target = manifestMap.get(idref);
          if (target.mediaType && !/html|xml/i.test(target.mediaType)) {
            continue;
          }
          const normalizedPath = path.posix.join(basePath, target.href).replace(/^\//, '');
          const htmlFile = zip.file(normalizedPath) || zip.file(target.href);
          if (htmlFile) {
            const html = await htmlFile.async('text');
            const sanitized = sanitizeHtmlSnippet(html);
            if (sanitized && sanitized.trim().length > 0) {
              return sanitized;
            }
          }
        }
      } catch (innerError) {
        console.warn('Failed to parse AZW3 OPF entry', entry?.name, innerError);
      }
    }
    const htmlFiles = zip
      .file(/\.x?html?$/i)
      .sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of htmlFiles) {
      const html = await entry.async('text');
      const sanitized = sanitizeHtmlSnippet(html);
      if (sanitized && sanitized.trim().length > 0) {
        return sanitized;
      }
    }
    const textFiles = zip
      .file(/\.txt$/i)
      .sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of textFiles) {
      const text = await entry.async('text');
      const cleaned = sanitizePlainText(text);
      if (cleaned && cleaned.trim().length > 0) {
        return `<pre>${escapeHtml(cleaned)}</pre>`;
      }
    }
  } catch (error) {
    console.warn('Failed to extract AZW3 preview', error);
  }
  return '';
}

async function extractAzw3ViewData(buffer) {
  const empty = {
    metadata: {
      title: '',
      creator: '',
      language: 'en'
    },
    spine: [],
    styles: []
  };
  if (!Buffer.isBuffer(buffer)) {
    return empty;
  }
  const zipSignature = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
  const zipIndex = buffer.indexOf(zipSignature);
  if (zipIndex === -1) {
    return empty;
  }
  try {
    const zipSlice = buffer.slice(zipIndex);
    const zip = await JSZip.loadAsync(zipSlice);
    const opfEntries = zip
      .file(/\.opf$/i)
      .sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of opfEntries) {
      try {
        const opfXml = await entry.async('text');
        const opf = xmlParser.parse(opfXml);
        const pkg = opf?.package || {};
        const metadata = pkg.metadata || {};
        const manifestRaw = pkg?.manifest?.item;
        const spineRaw = pkg?.spine?.itemref;
        const manifestItems = manifestRaw
          ? Array.isArray(manifestRaw)
            ? manifestRaw
            : [manifestRaw]
          : [];
        const spineItems = spineRaw ? (Array.isArray(spineRaw) ? spineRaw : [spineRaw]) : [];
        if (!manifestItems.length || !spineItems.length) {
          continue;
        }
        const manifestMap = new Map();
        manifestItems.forEach((item) => {
          const id = getAttribute(item, 'id');
          const href = getAttribute(item, 'href');
          if (!id || !href) {
            return;
          }
          manifestMap.set(id, {
            id,
            href,
            mediaType:
              getAttribute(item, 'media-type') ||
              getAttribute(item, 'mediaType') ||
              getAttribute(item, 'MediaType') ||
              '',
            properties: getAttribute(item, 'properties') || ''
          });
        });
        if (!manifestMap.size) {
          continue;
        }
        const rootPath = entry.name;
        const styles = [];
        for (const manifestItem of manifestMap.values()) {
          if (!manifestItem.mediaType || !manifestItem.mediaType.includes('css')) {
            continue;
          }
          const entryPath = resolveOpfHref(rootPath, manifestItem.href);
          const file = zip.file(entryPath) || zip.file(manifestItem.href);
          if (!file) {
            continue;
          }
          try {
            let css = await file.async('text');
            css = css.replace(/@import[^;]+;/gi, '');
            styles.push(css.trim());
          } catch (error) {
            console.warn('Failed to read AZW3 stylesheet', manifestItem.href, error);
          }
        }

        const viewData = {
          metadata: {
            title: normalizeXmlValue(metadata['dc:title'] || metadata.title || '').trim(),
            creator: normalizeXmlValue(metadata['dc:creator'] || metadata.creator || '').trim(),
            language:
              (normalizeXmlValue(metadata['dc:language'] || metadata.language) || 'en').trim() || 'en'
          },
          spine: [],
          styles: styles.length ? styles : []
        };

        let totalCharacters = 0;
        for (const spineEntry of spineItems) {
          const idref = getAttribute(spineEntry, 'idref') || getAttribute(spineEntry, 'idRef');
          if (!idref || !manifestMap.has(idref)) {
            continue;
          }
          const manifestItem = manifestMap.get(idref);
          if (!manifestItem.mediaType || !/html|xml/i.test(manifestItem.mediaType)) {
            continue;
          }
          const entryPath = resolveOpfHref(rootPath, manifestItem.href);
          const file = zip.file(entryPath) || zip.file(manifestItem.href);
          if (!file) {
            continue;
          }
          try {
            const html = await file.async('text');
            const sanitized = sanitizeEpubContent(html);
            if (!sanitized) {
              continue;
            }
            totalCharacters += sanitized.length;
            viewData.spine.push({
              id: manifestItem.id,
              href: manifestItem.href,
              label: manifestItem.properties || '',
              content: sanitized
            });
          } catch (error) {
            console.warn('Failed to read AZW3 spine entry', manifestItem.href, error);
          }
          if (viewData.spine.length >= 15 || totalCharacters > 250000) {
            break;
          }
        }

        if (!viewData.spine.length) {
          const fallback = Object.values(zip.files).find((zipEntry) =>
            /\.(x?html?|htm)$/i.test(zipEntry.name)
          );
          if (fallback) {
            try {
              const html = await fallback.async('text');
              const sanitized = sanitizeEpubContent(html);
              if (sanitized) {
                viewData.spine.push({
                  id: fallback.name,
                  href: fallback.name,
                  label: 'preview',
                  content: sanitized
                });
              }
            } catch (error) {
              console.warn('Failed to extract fallback AZW3 preview', error);
            }
          }
        }

        if (viewData.spine.length) {
          return viewData;
        }
      } catch (error) {
        console.warn('Failed to parse AZW3 OPF for Foliate data', entry?.name, error);
      }
    }
  } catch (error) {
    console.warn('Failed to construct AZW3 Foliate view data', error);
  }
  const fallbackHtml = await extractAzw3Preview(buffer);
  if (fallbackHtml) {
    return {
      ...empty,
      spine: [
        {
          id: 'preview',
          href: 'preview.html',
          label: 'preview',
          content: fallbackHtml
        }
      ]
    };
  }
  return empty;
}

ipcMain.handle('tts:set-auth-token', async (_event, token) => {
  try {
    tts.setHuggingFaceToken(typeof token === 'string' ? token : '');
    return { success: true };
  } catch (error) {
    console.error('Failed to update Hugging Face token', error);
    return { success: false, error: error?.message || 'unavailable' };
  }
});

ipcMain.handle('tts:list-voices', async () => {
  try {
    const voices = await tts.listVoices();
    return { success: true, voices };
  } catch (error) {
    console.error('Failed to enumerate TTS voices', error);
    const code = error?.code === 'HUGGINGFACE_AUTH' || error?.message === 'huggingface-auth'
      ? 'huggingface-auth'
      : undefined;
    return {
      success: false,
      error: code || error?.message || 'unavailable',
      code
    };
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
    if (error?.code === 'HUGGINGFACE_AUTH' || error?.message === 'huggingface-auth') {
      return { success: false, error: 'huggingface-auth', code: 'huggingface-auth' };
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
    let azw3DrmProtected = false;
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
      return {
        success: true,
        kind: 'foliate',
        mime: 'application/epub+zip',
        data: buffer.toString('base64')
      };
    }
    if (format === 'azw3') {
      azw3DrmProtected = isAzw3DrmProtected(buffer);
      if (azw3DrmProtected) {
        return { success: false, error: 'Preview unavailable: AZW3 file is DRM-protected.' };
      }
      const viewData = await extractAzw3ViewData(buffer);
      if (Array.isArray(viewData?.spine) && viewData.spine.length) {
        return {
          success: true,
          kind: 'foliate',
          mime: 'application/epub+zip',
          data: buffer.toString('base64'),
          book: viewData
        };
      }
      const html = await extractAzw3Preview(buffer);
      if (html) {
        return { success: true, kind: 'html', content: html };
      }
    }
    if (format === 'mobi' || (format === 'azw3' && !azw3DrmProtected)) {
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

ipcMain.handle('foliate:open', async (_event, options = {}) => {
  try {
    let buffer = null;
    let format = typeof options?.format === 'string' ? options.format.toLowerCase() : '';
    if (options?.data && typeof options.data === 'string') {
      buffer = Buffer.from(options.data, 'base64');
    } else if (options?.path && typeof options.path === 'string') {
      buffer = await fsPromises.readFile(options.path);
      if (!format) {
        const ext = path.extname(options.path);
        if (ext) {
          format = ext.slice(1).toLowerCase();
        }
      }
    }
    if (!buffer) {
      return { success: false, error: 'Missing book data' };
    }
    let viewData = null;
    if (format === 'azw3') {
      if (isAzw3DrmProtected(buffer)) {
        return { success: false, error: 'Preview unavailable: AZW3 file is DRM-protected.' };
      }
      viewData = await extractAzw3ViewData(buffer);
    }
    if (!viewData?.spine?.length) {
      viewData = await extractEpubViewData(buffer);
    }
    if (!viewData?.spine?.length) {
      return { success: false, error: 'Unable to extract book content' };
    }
    return { success: true, book: viewData };
  } catch (error) {
    console.error('Failed to prepare Foliate view data', error);
    return { success: false, error: error?.message || 'Unable to open book' };
  }
});
