import fallbackSeedData from '../shared/seed-data.json' assert { type: 'json' };

;(async () => {
function clone(value) {
  if (value === null || value === undefined) {
    return value;
  }
  return JSON.parse(JSON.stringify(value));
}

function mergeLocaleTranslations(baseLocale = {}, overrideLocale = {}) {
  const baseClone = clone(baseLocale) || {};
  const overrideClone = clone(overrideLocale) || {};
  const merged = { ...baseClone, ...overrideClone };

  const pickArray = (overrideValue, baseValue) => {
    if (Array.isArray(overrideValue) && overrideValue.length) {
      return clone(overrideValue);
    }
    if (Array.isArray(baseValue)) {
      return clone(baseValue);
    }
    return [];
  };

  merged.stats = pickArray(overrideClone.stats, baseClone.stats);
  merged.collections = pickArray(overrideClone.collections, baseClone.collections);
  merged.roadmapItems = pickArray(overrideClone.roadmapItems, baseClone.roadmapItems);

  if (baseClone.wizard || overrideClone.wizard) {
    const baseWizard = baseClone.wizard || {};
    const overrideWizard = overrideClone.wizard || {};
    merged.wizard = {
      ...clone(baseWizard),
      ...clone(overrideWizard),
      steps: pickArray(overrideWizard.steps, baseWizard.steps)
    };
  }

  return merged;
}

function mergeTranslations(baseTranslations = {}, overrideTranslations = {}) {
  const locales = new Set([
    ...Object.keys(baseTranslations || {}),
    ...Object.keys(overrideTranslations || {})
  ]);
  const result = {};
  locales.forEach((locale) => {
    result[locale] = mergeLocaleTranslations(
      baseTranslations?.[locale],
      overrideTranslations?.[locale]
    );
  });
  return result;
}

function mergeBootstrapData(base = {}, override = {}) {
  const baseClone = clone(base) || {};
  const overrideClone = clone(override) || {};
  const result = { ...baseClone, ...overrideClone };

  result.translations = mergeTranslations(baseClone.translations, overrideClone.translations);

  const objectKeys = [
    'classificationCatalog',
    'formatCatalog',
    'statEmojiMap',
    'collectionEmojiMap',
    'classificationEmojiMap',
    'enrichmentLabels',
    'initialCollectionMetadata',
    'initialCollectionBooks'
  ];
  objectKeys.forEach((key) => {
    result[key] = {
      ...(baseClone[key] ? clone(baseClone[key]) : {}),
      ...(overrideClone[key] ? clone(overrideClone[key]) : {})
    };
  });

  const arrayKeys = ['supportedCoverTypes', 'classificationOptions', 'formatOptions', 'directoryOptions'];
  arrayKeys.forEach((key) => {
    const overrideArray =
      Array.isArray(overrideClone[key]) && overrideClone[key].length ? clone(overrideClone[key]) : null;
    const baseArray = Array.isArray(baseClone[key]) ? clone(baseClone[key]) : [];
    result[key] = overrideArray || baseArray;
  });

  result.initialSettings = {
    ...(baseClone.initialSettings ? clone(baseClone.initialSettings) : {}),
    ...(overrideClone.initialSettings ? clone(overrideClone.initialSettings) : {})
  };

  result.defaultWizardData = {
    ...(baseClone.defaultWizardData ? clone(baseClone.defaultWizardData) : {}),
    ...(overrideClone.defaultWizardData ? clone(overrideClone.defaultWizardData) : {})
  };

  return result;
}

const fallbackBootstrapData = mergeBootstrapData(fallbackSeedData ?? {}, {});
let bootstrapData = mergeBootstrapData(fallbackBootstrapData, {});
if (window.api?.bootstrap) {
  try {
    const remoteBootstrap = (await window.api.bootstrap()) || {};
    bootstrapData = mergeBootstrapData(fallbackBootstrapData, remoteBootstrap);
  } catch (error) {
    console.error('Failed to load bootstrap data, using fallback seed data', error);
    bootstrapData = mergeBootstrapData(fallbackBootstrapData, {});
  }
} else {
  console.warn('Bootstrap API is not available. Using bundled seed data.');
  bootstrapData = mergeBootstrapData(fallbackBootstrapData, {});
}

const translations = bootstrapData.translations || {};

const supportedCoverTypes = bootstrapData.supportedCoverTypes || ['image/png', 'image/jpeg', 'image/webp'];
const defaultCoverExtensionMap = {
  'image/png': ['png'],
  'image/jpeg': ['jpg', 'jpeg'],
  'image/webp': ['webp']
};
const supportedCoverExtensions = Array.from(
  new Set(
    supportedCoverTypes.flatMap((type) => {
      const normalized = defaultCoverExtensionMap[type];
      if (normalized && Array.isArray(normalized)) {
        return normalized;
      }
      const ext = type.split('/').pop();
      return ext ? [ext.toLowerCase()] : [];
    })
  )
);

const classificationCatalog = bootstrapData.classificationCatalog || {};
const formatCatalog = bootstrapData.formatCatalog || {};
const statEmojiMap = bootstrapData.statEmojiMap || {};
const collectionEmojiMap = bootstrapData.collectionEmojiMap || {};
const classificationEmojiMap = bootstrapData.classificationEmojiMap || {};
const enrichmentLabels = bootstrapData.enrichmentLabels || {};

const classificationOptions =
  Array.isArray(bootstrapData.classificationOptions) && bootstrapData.classificationOptions.length
    ? bootstrapData.classificationOptions
    : Object.keys(classificationCatalog);

const formatOptions =
  Array.isArray(bootstrapData.formatOptions) && bootstrapData.formatOptions.length
    ? bootstrapData.formatOptions
    : Object.keys(formatCatalog);

const directoryOptions = Array.isArray(bootstrapData.directoryOptions) ? bootstrapData.directoryOptions : [];

const initialCollectionMetadata = bootstrapData.initialCollectionMetadata || {};
const initialCollectionBooks = bootstrapData.initialCollectionBooks || {};
const defaultSettingsFallback = {
  metadataSources: 'Douban, OpenLibrary',
  apiKey: '',
  rateLimit: 60,
  proxy: '',
  cachePath: '~/Library Application Support/LocalBookshelf/covers',
  previewPath: '~/Library Application Support/LocalBookshelf/previews',
  embeddingsPath: '~/Library Application Support/LocalBookshelf/embeddings',
  paginationDefault: 20,
  theme: 'system',
  analytics: true,
  offline: false
};
const initialSettings = { ...defaultSettingsFallback, ...(bootstrapData.initialSettings || {}) };

const defaultWizardTemplate = bootstrapData.defaultWizardData || {};
const defaultWizardData = {
  mode: defaultWizardTemplate.mode || 'create',
  targetId: defaultWizardTemplate.targetId ?? null,
  paths: Array.isArray(defaultWizardTemplate.paths) ? [...defaultWizardTemplate.paths] : [],
  name: defaultWizardTemplate.name || '',
  description: defaultWizardTemplate.description || '',
  coverName: defaultWizardTemplate.coverName || '',
  coverFile: null
};

const initialBookmarks = Object.values(initialCollectionBooks)
  .flat()
  .reduce((map, book) => {
    map[book.id] = new Set(book.bookmarks || []);
    return map;
  }, {});

const initialPreviewStates = Object.values(initialCollectionBooks)
  .flat()
  .reduce((map, book) => {
    map[book.id] = {
      page: book.progress?.currentPage || 1,
      zoom: 1,
      fit: 'width',
      fullscreen: false
    };
    return map;
  }, {});

const availableLocales = Object.keys(translations);
const defaultLocale = availableLocales.includes('en') ? 'en' : availableLocales[0] || 'en';

const root = document.getElementById('root');

const DROP_ZONE_SELECTOR = '.wizard-dropzone, .wizard-cover-dropzone';
let dragGuardsRegistered = false;

const state = {
  locale: defaultLocale,
  showWizard: false,
  wizardStep: 0,
  wizardData: { ...defaultWizardData },
  wizardErrors: [],
  userCollections: [],
  collectionOverrides: {},
  collectionMeta: JSON.parse(JSON.stringify(initialCollectionMetadata)),
  collectionBooks: JSON.parse(JSON.stringify(initialCollectionBooks)),
  selectedCollectionId: null,
  selectedBookId: null,
  activePage: 'dashboard',
  preferences: {},
  bookmarks: Object.keys(initialBookmarks).reduce((map, id) => {
    map[id] = new Set(initialBookmarks[id]);
    return map;
  }, {}),
  previewStates: initialPreviewStates,
  ttsState: { playing: false, voice: 'female', speed: 1, highlight: true },
  exportState: { destination: '~/Documents/Local-Bookshelf/Exports', includeMetadata: true, status: 'idle', progress: 0 },
  aiSessions: {},
  jobs: [],
  toast: null,
  settings: { ...initialSettings },
  activeScan: null,
  directoryEditor: null,
  exportModal: null
};

const persistence = {
  hydrating: true,
  hydrated: false,
  pending: null,
  timeout: null,
  lastSerialized: null
};

function getFileExtension(name) {
  if (!name || typeof name !== 'string') {
    return '';
  }
  const index = name.lastIndexOf('.');
  if (index === -1) {
    return '';
  }
  return name.slice(index + 1).toLowerCase();
}

function isSupportedCoverFile(file) {
  if (!file) {
    return false;
  }
  if (file.type && supportedCoverTypes.includes(file.type)) {
    return true;
  }
  const extension = getFileExtension(file.name || file.path || '');
  if (!extension) {
    return false;
  }
  return supportedCoverExtensions.includes(extension);
}

function extractDroppedDirectories(event) {
  const directories = [];
  const transfer = event?.dataTransfer;
  if (!transfer) {
    return directories;
  }
  const items = Array.from(transfer.items || []);
  items.forEach((item) => {
    if (!item || item.kind !== 'file') {
      return;
    }
    if (typeof item.webkitGetAsEntry === 'function') {
      const entry = item.webkitGetAsEntry();
      if (entry?.isDirectory) {
        const file = item.getAsFile();
        if (file?.path) {
          directories.push(file.path);
        }
      }
      return;
    }
    const file = item.getAsFile();
    if (file?.path && (!file.type || file.type === '')) {
      directories.push(file.path);
    }
  });
  if (directories.length) {
    return Array.from(new Set(directories)).filter(Boolean);
  }
  const files = Array.from(transfer.files || []);
  files.forEach((file) => {
    if (file?.path && (!file.type || file.type === '')) {
      directories.push(file.path);
    }
  });
  return Array.from(new Set(directories)).filter(Boolean);
}

function registerGlobalDragGuards() {
  if (dragGuardsRegistered || typeof document === 'undefined') {
    return;
  }
  dragGuardsRegistered = true;
  const guard = (event) => {
    if (!event) {
      return;
    }
    const target = event.target;
    const allowDropTarget = target instanceof Element && target.closest(DROP_ZONE_SELECTOR);
    if (!allowDropTarget) {
      event.preventDefault();
      event.stopPropagation();
    }
  };
  document.addEventListener('dragover', guard);
  document.addEventListener('drop', guard);
}

registerGlobalDragGuards();

function serializeState() {
  const preferences = {};
  Object.entries(state.preferences || {}).forEach(([collectionId, preference]) => {
    preferences[collectionId] = {
      viewMode: preference.viewMode,
      pageSize: preference.pageSize,
      page: preference.page,
      search: preference.search,
      classification: Array.from(preference.classification || []),
      format: preference.format,
      yearFrom: preference.yearFrom,
      yearTo: preference.yearTo,
      filtersCollapsed: preference.filtersCollapsed,
      sort: preference.sort,
      selected: Array.from(preference.selected || [])
    };
  });

  const bookmarks = {};
  Object.entries(state.bookmarks || {}).forEach(([bookId, entries]) => {
    bookmarks[bookId] = Array.from(entries || []);
  });

  const collectionBooks = {};
  Object.entries(state.collectionBooks || {}).forEach(([collectionId, books]) => {
    collectionBooks[collectionId] = deepCloneBooks(books);
  });

  return {
    version: 1,
    locale: state.locale,
    userCollections: JSON.parse(JSON.stringify(state.userCollections || [])),
    collectionOverrides: JSON.parse(JSON.stringify(state.collectionOverrides || {})),
    collectionMeta: JSON.parse(JSON.stringify(state.collectionMeta || {})),
    collectionBooks,
    preferences,
    bookmarks,
    previewStates: JSON.parse(JSON.stringify(state.previewStates || {})),
    settings: JSON.parse(JSON.stringify(state.settings || {})),
    ttsState: JSON.parse(JSON.stringify(state.ttsState || {})),
    exportState: JSON.parse(JSON.stringify(state.exportState || {})),
    aiSessions: JSON.parse(JSON.stringify(state.aiSessions || {})),
    selectedCollectionId: state.selectedCollectionId,
    selectedBookId: state.selectedBookId
  };
}

function applyPersistedState(persisted) {
  if (!persisted || typeof persisted !== 'object') {
    return;
  }
  if (persisted.locale && translations[persisted.locale]) {
    state.locale = persisted.locale;
  }
  if (Array.isArray(persisted.userCollections)) {
    state.userCollections = JSON.parse(JSON.stringify(persisted.userCollections));
  }
  if (persisted.collectionOverrides) {
    state.collectionOverrides = {
      ...state.collectionOverrides,
      ...JSON.parse(JSON.stringify(persisted.collectionOverrides))
    };
  }
  if (persisted.collectionMeta) {
    state.collectionMeta = {
      ...state.collectionMeta,
      ...JSON.parse(JSON.stringify(persisted.collectionMeta))
    };
  }
  if (persisted.collectionBooks) {
    Object.entries(persisted.collectionBooks).forEach(([collectionId, books]) => {
      state.collectionBooks[collectionId] = deepCloneBooks(books);
    });
  }
  if (persisted.preferences) {
    state.preferences = {};
    Object.entries(persisted.preferences).forEach(([collectionId, preference]) => {
      state.preferences[collectionId] = {
        ...preference,
        selected: new Set(preference.selected || []),
        classification: new Set(preference.classification || []),
        filtersCollapsed:
          typeof preference.filtersCollapsed === 'boolean' ? preference.filtersCollapsed : true
      };
    });
  }
  if (persisted.bookmarks) {
    Object.entries(persisted.bookmarks).forEach(([bookId, entries]) => {
      state.bookmarks[bookId] = new Set(entries || []);
    });
  }
  if (persisted.previewStates) {
    state.previewStates = { ...state.previewStates, ...persisted.previewStates };
  }
  if (persisted.settings) {
    state.settings = { ...state.settings, ...persisted.settings };
  }
  if (persisted.ttsState) {
    state.ttsState = { ...state.ttsState, ...persisted.ttsState };
  }
  if (persisted.exportState) {
    state.exportState = { ...state.exportState, ...persisted.exportState };
  }
  if (persisted.aiSessions) {
    state.aiSessions = persisted.aiSessions;
  }
  if (persisted.selectedCollectionId) {
    state.selectedCollectionId = persisted.selectedCollectionId;
  }
  if (persisted.selectedBookId) {
    state.selectedBookId = persisted.selectedBookId;
  }
}

function schedulePersist(force = false) {
  if (persistence.hydrating || !persistence.hydrated || !window.api?.saveState) {
    return;
  }
  const data = serializeState();
  const serialized = JSON.stringify(data);
  if (!force && serialized === persistence.lastSerialized) {
    return;
  }

  const flush = () => {
    persistence.lastSerialized = serialized;
    window.api
      .saveState(data)
      .catch((error) => console.error('Failed to persist state', error));
  };

  if (force) {
    if (persistence.timeout) {
      clearTimeout(persistence.timeout);
      persistence.timeout = null;
    }
    flush();
    return;
  }

  persistence.pending = { data, serialized };
  if (persistence.timeout) {
    clearTimeout(persistence.timeout);
  }
  persistence.timeout = setTimeout(() => {
    if (!persistence.pending) {
      return;
    }
    const payload = persistence.pending;
    persistence.pending = null;
    persistence.timeout = null;
    persistence.lastSerialized = payload.serialized;
    window.api
      .saveState(payload.data)
      .catch((error) => console.error('Failed to persist state', error));
  }, 350);
}

async function requestDirectory(defaultPath = '', fallbackPrompt = '') {
  if (window.api?.selectDirectory) {
    try {
      const selected = await window.api.selectDirectory(defaultPath);
      if (selected) {
        return selected;
      }
    } catch (error) {
      console.error('Directory selection failed', error);
    }
  }
  if (!fallbackPrompt) {
    return null;
  }
  const manual = window.prompt(fallbackPrompt, defaultPath || '');
  if (manual && manual.trim()) {
    return manual.trim();
  }
  return null;
}

async function initializeApp() {
  try {
    if (window.api?.loadState) {
      const persisted = await window.api.loadState();
      applyPersistedState(persisted);
      if (state.selectedCollectionId) {
        ensurePreferences(state.selectedCollectionId);
        const books = getBooks(state.selectedCollectionId);
        if (state.selectedBookId && !books.find((book) => book.id === state.selectedBookId)) {
          state.selectedBookId = books[0]?.id || null;
        }
      }
    }
  } catch (error) {
    console.error('Failed to restore state', error);
  } finally {
    persistence.hydrating = false;
    renderApp();
    persistence.hydrated = true;
    schedulePersist(true);
  }
}

function createElement(tag, options = {}) {
  const element = document.createElement(tag);
  if (options.className) {
    element.className = options.className;
  }
  if (options.text) {
    element.textContent = options.text;
  }
  if (options.html) {
    element.innerHTML = options.html;
  }
  if (options.attributes) {
    Object.entries(options.attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }
  if (options.children) {
    options.children.forEach((child) => {
      if (child) {
        element.appendChild(child);
      }
    });
  }
  return element;
}

function getPack() {
  return translations[state.locale] || translations.en || Object.values(translations)[0] || {};
}

function formatDate(dateString) {
  if (!dateString) {
    return state.locale === 'zh' ? '暂无记录' : 'No record';
  }
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleString(state.locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatSize(sizeMB) {
  if (sizeMB >= 1024) {
    return `${(sizeMB / 1024).toFixed(1)} GB`;
  }
  return `${sizeMB.toFixed(1)} MB`;
}

function getClassificationLabel(key) {
  const labels = classificationCatalog[key];
  if (!labels) {
    return key;
  }
  return labels[state.locale] || labels.en;
}

function getFormatLabel(key) {
  const labels = formatCatalog[key];
  if (!labels) {
    return key.toUpperCase();
  }
  return labels[state.locale] || labels.en;
}

function getEnrichmentLabel(key) {
  const labels = enrichmentLabels[key];
  if (!labels) {
    return key;
  }
  return labels[state.locale] || labels.en;
}

function deepCloneBooks(books) {
  return JSON.parse(JSON.stringify(books));
}

function getCollectionEmoji(id) {
  return collectionEmojiMap[id] || '📚';
}

function getClassificationEmoji(key) {
  return classificationEmojiMap[key] || '📘';
}

function setActivePage(page) {
  state.activePage = page;
  if (page !== 'collection') {
    state.directoryEditor = null;
  }
  if (page !== 'collection' && page !== 'preview') {
    state.selectedBookId = null;
    if (page === 'dashboard') {
      state.selectedCollectionId = null;
    }
  }
  renderApp();
}

function getCollectionDisplay(id) {
  const pack = getPack();
  if (id === 'new-collection') {
    return {
      id,
      title: state.locale === 'zh' ? '创建新收藏集' : 'New Collection',
      description:
        state.locale === 'zh'
          ? '打开多步骤向导，添加文件夹、元数据与封面。'
          : 'Launch the creation wizard to add folders, metadata, and a custom cover.',
      stats:
        state.locale === 'zh' ? '向导 · 拖放路径 · 自动扫描' : 'Wizard · Drag & Drop Paths · Auto Scan',
      actions: [pack.newCollectionLabel]
    };
  }
  const overrides = state.collectionOverrides[id];
  const basePack = Array.isArray(pack.collections)
    ? pack.collections.find((item) => item.id === id)
    : null;
  const user = state.userCollections.find((item) => item.id === id);
  if (user) {
    return {
      id,
      title: user.names[state.locale] || user.names.en,
      description: user.descriptions[state.locale] || user.descriptions.en,
      stats: user.stats[state.locale] || user.stats.en,
      actions: user.actions[state.locale] || user.actions.en
    };
  }
  if (!basePack) {
    return null;
  }
  return {
    id,
    title: overrides?.names?.[state.locale] || overrides?.name || basePack.title,
    description: overrides?.descriptions?.[state.locale] || overrides?.description || basePack.description,
    stats: overrides?.stats?.[state.locale] || overrides?.stats?.en || basePack.stats,
    actions: basePack.actions
  };
}

function getCollectionList() {
  const baseOrder = ['new-collection', 'climate', 'design', 'literature'];
  const baseCards = baseOrder.map((id) => getCollectionDisplay(id)).filter(Boolean);
  const userCards = state.userCollections
    .filter((item) => !baseOrder.includes(item.id))
    .map((item) => getCollectionDisplay(item.id));
  return [...baseCards, ...userCards];
}

function ensurePreferences(collectionId) {
  if (!state.preferences[collectionId]) {
    const meta = state.collectionMeta[collectionId] || {};
    state.preferences[collectionId] = {
      viewMode: 'cards',
      pageSize: meta.pagination || state.settings.paginationDefault,
      page: 1,
      search: '',
      classification: new Set(),
      format: 'all',
      yearFrom: 2000,
      yearTo: new Date().getFullYear(),
      filtersCollapsed: true,
      selected: new Set(),
      sort: { column: 'title', direction: 'asc' }
    };
  } else {
    const preference = state.preferences[collectionId];
    if (!(preference.classification instanceof Set)) {
      preference.classification = new Set(preference.classification || []);
    }
    if (!(preference.selected instanceof Set)) {
      preference.selected = new Set(preference.selected || []);
    }
    if (typeof preference.filtersCollapsed !== 'boolean') {
      preference.filtersCollapsed = true;
    }
  }
  return state.preferences[collectionId];
}

function getBooks(collectionId) {
  if (!state.collectionBooks[collectionId]) {
    state.collectionBooks[collectionId] = deepCloneBooks(initialCollectionBooks.design || []);
  }
  return state.collectionBooks[collectionId];
}

function getPreviewState(bookId, defaultPage = 1) {
  if (!state.previewStates[bookId]) {
    state.previewStates[bookId] = {
      page: defaultPage,
      zoom: 1,
      fit: 'width',
      fullscreen: false
    };
  }
  return state.previewStates[bookId];
}

function getBookmarks(bookId) {
  if (!state.bookmarks[bookId]) {
    state.bookmarks[bookId] = new Set();
  }
  return state.bookmarks[bookId];
}

function setSelectedCollection(collectionId) {
  state.selectedCollectionId = collectionId;
  state.directoryEditor = null;
  state.activePage = 'collection';
  const books = getBooks(collectionId);
  if (books.length) {
    state.selectedBookId = books[0].id;
    const preview = getPreviewState(state.selectedBookId, books[0].progress?.currentPage || 1);
    preview.page = books[0].progress?.currentPage || 1;
    preview.zoom = 1;
    preview.fit = 'width';
  }
  ensurePreferences(collectionId);
  renderApp();
}

function setSelectedBook(bookId) {
  state.selectedBookId = bookId;
  const book = findBookById(bookId);
  if (book) {
    const preview = getPreviewState(bookId, book.progress?.currentPage || 1);
    preview.page = book.progress?.currentPage || 1;
    preview.zoom = 1;
    preview.fit = 'width';
  }
  if (state.selectedCollectionId) {
    state.activePage = 'preview';
  }
  renderApp();
}

function findBookById(bookId) {
  for (const collectionId of Object.keys(state.collectionBooks)) {
    const book = state.collectionBooks[collectionId].find((item) => item.id === bookId);
    if (book) {
      return book;
    }
  }
  return null;
}

function openDirectoryEditor(collectionId) {
  const meta = state.collectionMeta[collectionId] || { directories: [] };
  state.directoryEditor = {
    collectionId,
    value: (meta.directories || []).join('\n'),
    rescan: false
  };
  renderApp();
}

function closeDirectoryEditor() {
  state.directoryEditor = null;
  renderApp();
}

function saveDirectoryEditor() {
  const editor = state.directoryEditor;
  if (!editor) {
    return;
  }
  const collectionId = editor.collectionId;
  const raw = editor.value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  state.collectionMeta[collectionId] = state.collectionMeta[collectionId] || {};
  state.collectionMeta[collectionId].directories = raw;
  const overrides = state.collectionOverrides[collectionId] || {};
  state.collectionOverrides[collectionId] = { ...overrides, paths: [...raw] };
  state.directoryEditor = null;
  const pack = getPack();
  showToast(pack.collectionDetail.directorySaved);
  renderApp();
  if (editor.rescan) {
    const display = getCollectionDisplay(collectionId);
    createJob({
      type: 'scan',
      collectionId,
      label: `${display?.title || collectionId} · Rescan`,
      onComplete: () => {
        state.collectionMeta[collectionId] = state.collectionMeta[collectionId] || {};
        state.collectionMeta[collectionId].lastScan = new Date().toISOString();
        showToast(pack.collectionDetail.rescanCompleted);
        renderApp();
      }
    });
  }
}

function refreshMetadata(collectionId, bookIds = []) {
  if (!collectionId) {
    return;
  }
  const books = getBooks(collectionId);
  const targets = Array.isArray(bookIds) && bookIds.length ? books.filter((book) => bookIds.includes(book.id)) : books;
  if (!targets.length) {
    return;
  }
  const startedAt = new Date();
  targets.forEach((book) => {
    book.enrichment = 'inprogress';
    book.metadataUpdatedAt = startedAt.toISOString();
  });
  renderApp();
  const pack = getPack();
  const display = getCollectionDisplay(collectionId);

  let index = 0;
  const tickUpdate = () => {
    if (index >= targets.length) {
      return;
    }
    const book = targets[index];
    book.sizeMB = Number((book.sizeMB * (0.95 + Math.random() * 0.1)).toFixed(1));
    book.summary = `${book.summary.replace(/\s+$/, '')} ${
      state.locale === 'zh' ? '（元数据检查中…）' : '(Metadata refreshing…)'
    }`;
    renderApp();
    index += 1;
    setTimeout(tickUpdate, 400 + Math.random() * 300);
  };
  tickUpdate();

  createJob({
    type: 'enrichment',
    collectionId,
    label: `${display?.title || collectionId} · Metadata refresh`,
    onComplete: () => {
      const stamp = new Date();
      const stampText = stamp.toLocaleString(state.locale === 'zh' ? 'zh-CN' : 'en-US');
      targets.forEach((book) => {
        book.enrichment = 'complete';
        book.metadataUpdatedAt = stamp.toISOString();
        const interimRemoved = book.summary
          .replace(/\s*\(Metadata refreshing…\)$/u, '')
          .replace(/[（(]元数据检查中…[）)]?$/u, '')
          .trim();
        const cleaned = interimRemoved
          .replace(/\s*\(Metadata refreshed .*\)$/u, '')
          .replace(/\s*（.+?已刷新元数据）$/u, '')
          .replace(/\s*（元数据检查中…）$/u, '')
          .trim();
        const note = state.locale === 'zh'
          ? `（${stampText} 已刷新元数据）`
          : `(Metadata refreshed ${stampText})`;
        const separator = cleaned.length ? (state.locale === 'zh' ? '' : ' ') : '';
        book.summary = `${cleaned}${separator}${note}`.trim();
      });
      showToast(pack.collectionDetail.metadataUpdated);
      renderApp();
    }
  });
}

function openExportModal(bookIds, collectionId = state.selectedCollectionId) {
  const ids = Array.from(new Set(bookIds || [])).filter(Boolean);
  if (!ids.length) {
    return;
  }
  state.exportModal = {
    collectionId: collectionId || state.selectedCollectionId,
    bookIds: ids
  };
  state.exportState.status = 'idle';
  state.exportState.progress = 0;
  renderApp();
}

function closeExportModal() {
  if (state.exportState.status === 'running') {
    return;
  }
  state.exportModal = null;
  if (state.exportState.status !== 'idle') {
    state.exportState.status = 'idle';
    state.exportState.progress = 0;
  }
  renderApp();
}

function doesCollectionNameExist(name, ignoreId = null) {
  if (!name) {
    return false;
  }
  const normalized = name.trim().toLowerCase();
  const existing = [...state.userCollections.map((item) => ({ id: item.id, names: item.names }))];
  ['climate', 'design', 'literature'].forEach((id) => {
    const card = getCollectionDisplay(id);
    if (card) {
      existing.push({ id, names: { en: card.title, zh: card.title } });
    }
  });
  return existing.some((entry) => {
    if (ignoreId && entry.id === ignoreId) {
      return false;
    }
    return Object.values(entry.names || {})
      .filter(Boolean)
      .some((value) => value.trim().toLowerCase() === normalized);
  });
}

function showToast(message) {
  state.toast = { message, timestamp: Date.now() };
  renderApp();
  setTimeout(() => {
    if (state.toast && Date.now() - state.toast.timestamp >= 2600) {
      state.toast = null;
      renderApp();
    }
  }, 2800);
}

function pushScanLog(message) {
  if (!state.activeScan || !message) {
    return;
  }
  const locale = state.locale === 'zh' ? 'zh-CN' : 'en-US';
  const timestamp = new Date().toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  state.activeScan.logs.push(`${timestamp} · ${message}`);
  if (state.activeScan.logs.length > 30) {
    state.activeScan.logs = state.activeScan.logs.slice(-30);
  }
}

function updateScanOverlay(job) {
  if (!state.activeScan || state.activeScan.jobId !== job?.id) {
    return;
  }
  const pack = getPack();
  const overlayPack = pack.scanOverlay;
  if (!overlayPack) {
    return;
  }
  state.activeScan.progress = job.progress;
  state.activeScan.status = job.status;
  const milestones = state.activeScan.milestones;

  const ensureMilestone = (key, message) => {
    if (!milestones.includes(key) && message) {
      milestones.push(key);
      pushScanLog(message);
    }
  };

  if (job.status === 'queued') {
    ensureMilestone('queued', overlayPack.logs.queued);
  }
  if (job.status === 'running') {
    const firstPath = state.activeScan.paths?.[0] || overlayPack.logs.fallbackPath;
    ensureMilestone('running', overlayPack.logs.start.replace('{path}', firstPath));
  }

  const checkpoints = [
    { key: 'discovery', value: 20, message: overlayPack.logs.discovery },
    { key: 'metadata', value: 50, message: overlayPack.logs.metadata },
    { key: 'embeddings', value: 80, message: overlayPack.logs.embeddings }
  ];

  checkpoints.forEach(({ key, value, message }) => {
    if (job.progress >= value) {
      ensureMilestone(key, message);
    }
  });

  if (job.status === 'completed') {
    ensureMilestone('completed', overlayPack.logs.completed);
  }
}

function createJob({ type, collectionId, label, onComplete }) {
  const job = {
    id: `job-${Date.now()}-${jobCounter++}`,
    type,
    collectionId,
    label,
    progress: 0,
    status: 'queued',
    updatedAt: new Date(),
    onComplete
  };
  state.jobs.unshift(job);
  updateScanOverlay(job);
  renderApp();
  setTimeout(() => startJob(job), 300);
  return job;
}

function startJob(job) {
  if (!job) {
    return;
  }
  job.status = 'running';
  job.updatedAt = new Date();
  updateScanOverlay(job);
  renderApp();
  advanceJob(job);
}

function advanceJob(job) {
  if (!job || job.status !== 'running') {
    return;
  }
  if (job.progress >= 100) {
    job.progress = 100;
    job.status = 'completed';
    job.updatedAt = new Date();
    updateScanOverlay(job);
    renderApp();
    if (typeof job.onComplete === 'function') {
      job.onComplete();
    }
    return;
  }
  const increment = Math.min(100 - job.progress, Math.round(Math.random() * 15) + 10);
  job.progress += increment;
  job.updatedAt = new Date();
  updateScanOverlay(job);
  renderApp();
  setTimeout(() => advanceJob(job), 600 + Math.random() * 400);
}

function generateBooksForNewCollection(collectionId, name) {
  const base = deepCloneBooks(initialCollectionBooks.design);
  return base.map((book, index) => ({
    ...book,
    id: `${collectionId}-book-${index + 1}`,
    title: `${name} · ${book.title}`,
    progress: { currentPage: Math.min(book.progress?.currentPage || 1, book.pages) }
  }));
}

function openWizard(mode = 'create', targetId = null) {
  state.showWizard = true;
  state.wizardStep = 0;
  state.wizardErrors = [];
  state.wizardData = { ...defaultWizardData, mode, targetId };
  if (mode === 'edit' && targetId) {
    const display = getCollectionDisplay(targetId);
    const meta = state.collectionMeta[targetId] || { directories: [] };
    state.wizardData.paths = [...meta.directories];
    state.wizardData.name = display?.title || '';
    state.wizardData.description = display?.description || '';
    state.wizardData.coverName = state.collectionOverrides[targetId]?.coverName || '';
  }
  renderApp();
}

function closeWizard() {
  state.showWizard = false;
  state.wizardErrors = [];
  state.wizardStep = 0;
  state.wizardData = { ...defaultWizardData };
  renderApp();
}

function validateWizardStep(step) {
  const pack = getPack();
  const errors = [];
  if (step === 0 && state.wizardData.paths.length === 0) {
    errors.push(pack.wizard.validations.missingPaths);
  }
  if (step === 1) {
    if (!state.wizardData.name.trim()) {
      errors.push(pack.wizard.validations.missingName);
    } else if (
      state.wizardData.mode === 'create' &&
      doesCollectionNameExist(state.wizardData.name)
    ) {
      errors.push(pack.wizard.validations.duplicateName);
    } else if (
      state.wizardData.mode === 'edit' &&
      doesCollectionNameExist(state.wizardData.name, state.wizardData.targetId)
    ) {
      errors.push(pack.wizard.validations.duplicateName);
    }
  }
  if (step === 2 && state.wizardData.coverFile) {
    if (!supportedCoverTypes.includes(state.wizardData.coverFile.type)) {
      errors.push(pack.wizard.validations.invalidCover);
    }
  }
  state.wizardErrors = errors;
  renderApp();
  return errors.length === 0;
}

function completeWizard() {
  if (!validateWizardStep(1)) {
    return;
  }
  const pack = getPack();
  if (state.wizardData.mode === 'create') {
    const collectionId = `collection-${Date.now()}`;
    const name = state.wizardData.name.trim();
    const description = state.wizardData.description.trim();
    const newCollection = {
      id: collectionId,
      names: { en: name, zh: name },
      descriptions: { en: description, zh: description },
      stats: {
        en: '120 books · Initial scan pending',
        zh: '120 本 · 等待首次扫描'
      },
      actions: {
        en: ['Resume Reading', 'Open AI Chat', 'Rescan'],
        zh: ['继续阅读', '开启 AI 对话', '重新扫描']
      }
    };
    state.userCollections.push(newCollection);
    state.collectionMeta[collectionId] = {
      directories: [...state.wizardData.paths],
      lastScan: new Date().toISOString(),
      pagination: state.settings.paginationDefault,
      aiEnabled: true
    };
    state.collectionBooks[collectionId] = generateBooksForNewCollection(collectionId, name);
    const firstBook = state.collectionBooks[collectionId][0];
    if (firstBook) {
      state.previewStates[firstBook.id] = {
        page: firstBook.progress?.currentPage || 1,
        zoom: 1,
        fit: 'width',
        fullscreen: false
      };
      state.bookmarks[firstBook.id] = new Set(firstBook.bookmarks || []);
    }
    state.collectionOverrides[collectionId] = {
      names: { en: name, zh: name },
      descriptions: { en: description, zh: description },
      stats: {
        en: '120 books · Initial scan pending',
        zh: '120 本 · 等待首次扫描'
      },
      coverName: state.wizardData.coverName,
      paths: [...state.wizardData.paths]
    };
    showToast(pack.wizard.successTitle);
    const job = createJob({
      type: 'scan',
      collectionId,
      label: `${name} · Initial scan`,
      onComplete: () => {
        state.collectionOverrides[collectionId].stats = {
          en: '120 books · Scan completed just now',
          zh: '120 本 · 扫描刚刚完成'
        };
        state.collectionMeta[collectionId].lastScan = new Date().toISOString();
        renderApp();
      }
    });
    state.activeScan = {
      jobId: job.id,
      collectionId,
      collectionName: name,
      paths: [...state.wizardData.paths],
      progress: 0,
      status: 'queued',
      logs: [],
      milestones: []
    };
    state.showWizard = false;
    state.wizardErrors = [];
    state.wizardStep = 0;
    state.wizardData = { ...defaultWizardData };
    renderApp();
    return;
  }
  if (state.wizardData.mode === 'edit' && state.wizardData.targetId) {
    const targetId = state.wizardData.targetId;
    const overrides = state.collectionOverrides[targetId] || {};
    state.collectionOverrides[targetId] = {
      ...overrides,
      names: { en: state.wizardData.name.trim(), zh: state.wizardData.name.trim() },
      descriptions: { en: state.wizardData.description.trim(), zh: state.wizardData.description.trim() },
      coverName: state.wizardData.coverName,
      paths: [...state.wizardData.paths]
    };
    state.collectionMeta[targetId] = state.collectionMeta[targetId] || {};
    state.collectionMeta[targetId].directories = [...state.wizardData.paths];
    showToast(pack.settings.saved);
    createJob({
      type: 'scan',
      collectionId: targetId,
      label: `${state.wizardData.name.trim()} · Rescan`,
      onComplete: () => {
        state.collectionMeta[targetId].lastScan = new Date().toISOString();
        renderApp();
      }
    });
    closeWizard();
  }
}
function switchLocale(locale) {
  if (locale === state.locale) {
    return;
  }
  if (!translations[locale]) {
    return;
  }
  state.locale = locale;
  renderApp();
}

function renderTopBar(pack) {
  const titleGroup = createElement('div', { className: 'hero-group' });
  titleGroup.appendChild(createElement('h1', { text: pack.heroTitle }));
  if (pack.heroSubtitle) {
    titleGroup.appendChild(createElement('p', { text: pack.heroSubtitle }));
  }

  const actions = createElement('div', { className: 'action-group' });
  const monitorButton = createElement('button', {
    className: `pill-button${state.activePage === 'monitor' ? ' active' : ''}`,
    text: `🛠️ ${pack.actionBar.toggleMonitor}`
  });
  monitorButton.type = 'button';
  monitorButton.addEventListener('click', () => setActivePage('monitor'));

  const settingsButton = createElement('button', {
    className: `pill-button${state.activePage === 'settings' ? ' active' : ''}`,
    text: `⚙️ ${pack.actionBar.openSettings}`
  });
  settingsButton.type = 'button';
  settingsButton.addEventListener('click', () => setActivePage('settings'));

  const toggle = createElement('div', {
    className: 'language-toggle',
    attributes: { role: 'group', 'aria-label': pack.localeLabel }
  });
  toggle.appendChild(createElement('span', { text: pack.localeLabel }));

  const englishButton = createElement('button', {
    text: 'English',
    className: state.locale === 'en' ? 'active' : ''
  });
  englishButton.type = 'button';
  englishButton.addEventListener('click', () => switchLocale('en'));

  const chineseButton = createElement('button', {
    text: '中文',
    className: state.locale === 'zh' ? 'active' : ''
  });
  chineseButton.type = 'button';
  chineseButton.addEventListener('click', () => switchLocale('zh'));

  toggle.appendChild(englishButton);
  toggle.appendChild(chineseButton);

  actions.appendChild(monitorButton);
  actions.appendChild(settingsButton);
  actions.appendChild(toggle);

  return createElement('header', {
    className: 'top-bar',
    children: [titleGroup, actions]
  });
}

function renderBreadcrumbs(pack) {
  const nav = createElement('nav', {
    className: 'breadcrumbs',
    attributes: { 'aria-label': state.locale === 'zh' ? '页面导航' : 'Page navigation' }
  });
  const list = createElement('ol');
  const items = [
    {
      id: 'dashboard',
      label: '🏠',
      ariaLabel: state.locale === 'zh' ? '返回首页' : 'Return to dashboard'
    }
  ];

  if ((state.activePage === 'collection' || state.activePage === 'preview') && state.selectedCollectionId) {
    const display = getCollectionDisplay(state.selectedCollectionId);
    items.push({
      id: 'collection',
      label: `${getCollectionEmoji(state.selectedCollectionId)} ${display?.title || ''}`
    });
  }
  if (state.activePage === 'preview') {
    const book = findBookById(state.selectedBookId);
    items.push({
      id: 'preview',
      label: `📖 ${book?.title || (state.locale === 'zh' ? '图书预览' : 'Preview')}`
    });
  } else if (state.activePage === 'monitor') {
    items.push({ id: 'monitor', label: `🛠️ ${pack.monitor.title}` });
  } else if (state.activePage === 'settings') {
    items.push({ id: 'settings', label: `⚙️ ${pack.settings.title}` });
  }

  items.forEach((item) => {
    const entry = createElement('li');
    const button = createElement('button', {
      text: item.label,
      className: item.id === state.activePage ? 'active' : ''
    });
    button.type = 'button';
    if (item.ariaLabel) {
      button.setAttribute('aria-label', item.ariaLabel);
      button.title = item.ariaLabel;
    }
    button.addEventListener('click', () => {
      if ((item.id === 'collection' || item.id === 'preview') && !state.selectedCollectionId) {
        return;
      }
      setActivePage(item.id);
    });
    entry.appendChild(button);
    list.appendChild(entry);
  });

  nav.appendChild(list);
  return nav;
}

function renderStats(pack) {
  const statsGrid = createElement('section', {
    className: 'dashboard-grid',
    attributes: { 'aria-label': 'dashboard' }
  });
  const stats = Array.isArray(pack.stats) ? pack.stats : [];
  stats.forEach((stat) => {
    const card = createElement('article', { className: 'dashboard-card' });
    const emoji = statEmojiMap[stat.id] || '📊';
    card.appendChild(createElement('h3', { text: `${emoji} ${stat.label}` }));
    card.appendChild(createElement('strong', { text: stat.value }));
    card.appendChild(createElement('p', { text: stat.helper }));
    statsGrid.appendChild(card);
  });
  return statsGrid;
}

function handleCollectionAction(collectionId, actionLabel) {
  const pack = getPack();
  const normalized = actionLabel.trim();
  const resumeLabels = [pack.collectionDetail.resumeReading, 'Resume Reading', '继续阅读'];
  const previewLabels = [pack.collectionDetail.cardActions.preview, 'Preview Library', '预览文库'];
  const chatLabels = [pack.collectionDetail.cardActions.chat, 'Open AI Chat', '开启 AI 对话'];
  const editLabels = ['Edit', '编辑'];
  const rescanLabels = [pack.collectionDetail.rescan, '重新扫描'];
  if (resumeLabels.includes(normalized) || previewLabels.includes(normalized)) {
    setSelectedCollection(collectionId);
    return;
  }
  if (chatLabels.includes(normalized)) {
    setSelectedCollection(collectionId);
    ensureAiSession(collectionId);
    return;
  }
  if (editLabels.includes(normalized)) {
    openWizard('edit', collectionId);
    return;
  }
  if (rescanLabels.includes(normalized)) {
    const display = getCollectionDisplay(collectionId);
    createJob({
      type: 'scan',
      collectionId,
      label: `${display?.title || collectionId} · Rescan`,
      onComplete: () => {
        state.collectionMeta[collectionId] = state.collectionMeta[collectionId] || {};
        state.collectionMeta[collectionId].lastScan = new Date().toISOString();
        showToast(state.locale === 'zh' ? '扫描已完成' : 'Scan completed');
        renderApp();
      }
    });
  }
}

function renderCollections(pack) {
  const section = createElement('section', { className: 'collection-section' });
  const header = createElement('div', { className: 'section-header' });
  header.appendChild(createElement('h2', { text: pack.collectionsTitle }));
  header.appendChild(createElement('p', { text: pack.collectionsSubtitle }));

  const grid = createElement('div', { className: 'collection-grid' });
  const collections = getCollectionList();
  collections.forEach((collection) => {
    const isNew = collection.id === 'new-collection';
    const card = createElement('div', {
      className: `collection-card${isNew ? ' new-collection-card' : ''}`
    });
    const placeholderText = state.locale === 'zh' ? '图片占位' : 'Image placeholder';
    card.appendChild(createElement('div', { className: 'image-placeholder', text: placeholderText }));
    const emoji = getCollectionEmoji(collection.id);
    card.appendChild(createElement('h4', { text: `${emoji} ${collection.title}` }));
    card.appendChild(createElement('p', { text: collection.description }));
    card.appendChild(createElement('p', { text: collection.stats }));
    const actionRow = createElement('div', { className: 'collection-actions' });
    collection.actions.forEach((action) => {
      const button = createElement('button', { text: action });
      button.type = 'button';
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        if (isNew) {
          openWizard('create');
          return;
        }
        handleCollectionAction(collection.id, action);
      });
      actionRow.appendChild(button);
    });
    if (!isNew) {
      card.addEventListener('click', () => setSelectedCollection(collection.id));
    }
    card.appendChild(actionRow);
    grid.appendChild(card);
  });

  section.appendChild(header);
  section.appendChild(grid);
  return section;
}

function renderRoadmap(pack) {
  const section = createElement('section', { className: 'collection-section' });
  section.appendChild(
    createElement('div', {
      className: 'section-header',
      children: [createElement('h2', { text: `🚀 ${pack.roadmapTitle}` })]
    })
  );
  const grid = createElement('div', { className: 'dashboard-grid multi-column' });
  const items = Array.isArray(pack.roadmapItems) ? pack.roadmapItems : [];
  items.forEach((item) => {
    const card = createElement('article', { className: 'dashboard-card' });
    card.appendChild(createElement('p', { text: item }));
    grid.appendChild(card);
  });
  section.appendChild(grid);
  return section;
}

function renderDashboardPage(pack) {
  const page = createElement('main', { className: 'page dashboard-page' });
  page.appendChild(renderStats(pack));
  page.appendChild(renderCollections(pack));
  return page;
}

function renderCollectionPage(pack) {
  const page = createElement('main', { className: 'page collection-page' });
  const detail = renderCollectionDetail(pack);
  if (detail) {
    page.appendChild(detail);
  }
  const ai = renderAiPanel(pack);
  if (ai) {
    page.appendChild(ai);
  }
  return page;
}
function renderFilters(collectionId, preferences, pack) {
  const filters = createElement('div', { className: 'filters-panel expanded' });
  const searchSection = createElement('div', { className: 'filter-section search-section' });
  const searchInput = createElement('input', {
    className: 'search-input',
    attributes: { type: 'search', placeholder: pack.collectionDetail.searchPlaceholder }
  });
  searchInput.value = preferences.search;
  searchInput.addEventListener('input', (event) => {
    preferences.search = event.target.value;
    preferences.page = 1;
    renderApp();
  });
  searchSection.appendChild(searchInput);
  filters.appendChild(searchSection);

  const classificationSection = createElement('div', { className: 'filter-section classification-section' });
  classificationSection.appendChild(
    createElement('span', { className: 'filter-section-label', text: pack.collectionDetail.filters.classification })
  );
  const classificationGroup = createElement('div', { className: 'chip-group' });
  const classificationClear = createElement('button', {
    className: `filter-chip clear-chip${preferences.classification?.size ? '' : ' active'}`,
    children: [createElement('span', { className: 'chip-label', text: state.locale === 'zh' ? '不限' : 'All' })]
  });
  classificationClear.type = 'button';
  classificationClear.setAttribute('aria-pressed', preferences.classification?.size ? 'false' : 'true');
  classificationClear.addEventListener('click', () => {
    if (preferences.classification instanceof Set) {
      preferences.classification.clear();
    } else {
      preferences.classification = new Set();
    }
    preferences.page = 1;
    renderApp();
  });
  classificationGroup.appendChild(classificationClear);
  classificationOptions.forEach((option) => {
    const isActive = preferences.classification?.has(option);
    const chip = createElement('button', {
      className: `filter-chip${isActive ? ' active' : ''}`,
      children: [
        createElement('span', {
          className: 'chip-check',
          attributes: { 'aria-hidden': 'true' },
          children: [createElement('span', { className: 'chip-check-icon', text: '✓' })]
        }),
        createElement('span', { className: 'chip-label', text: getClassificationLabel(option) })
      ]
    });
    chip.type = 'button';
    chip.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    chip.addEventListener('click', () => {
      if (preferences.classification.has(option)) {
        preferences.classification.delete(option);
      } else {
        preferences.classification.add(option);
      }
      preferences.page = 1;
      renderApp();
    });
    classificationGroup.appendChild(chip);
  });
  classificationSection.appendChild(classificationGroup);
  filters.appendChild(classificationSection);

  const formatSection = createElement('div', { className: 'filter-section format-section' });
  formatSection.appendChild(createElement('span', { className: 'filter-section-label', text: pack.collectionDetail.filters.format }));
  const formatGroup = createElement('div', { className: 'chip-group' });
  const formatClear = createElement('button', {
    className: `filter-chip${preferences.format === 'all' ? ' active' : ''}`,
    text: state.locale === 'zh' ? '全部' : 'All'
  });
  formatClear.type = 'button';
  formatClear.addEventListener('click', () => {
    preferences.format = 'all';
    preferences.page = 1;
    renderApp();
  });
  formatGroup.appendChild(formatClear);
  formatOptions.forEach((option) => {
    const chip = createElement('button', {
      className: `filter-chip${preferences.format === option ? ' active' : ''}`,
      text: getFormatLabel(option)
    });
    chip.type = 'button';
    chip.addEventListener('click', () => {
      preferences.format = option;
      preferences.page = 1;
      renderApp();
    });
    formatGroup.appendChild(chip);
  });
  formatSection.appendChild(formatGroup);
  filters.appendChild(formatSection);

  const yearSection = createElement('div', { className: 'filter-section year-section' });
  yearSection.appendChild(createElement('span', { className: 'filter-section-label', text: pack.collectionDetail.filters.publication }));
  const yearInputs = createElement('div', { className: 'year-inputs' });
  const fromInput = createElement('input', {
    className: 'year-input',
    attributes: { type: 'number', min: 1900, max: new Date().getFullYear() }
  });
  fromInput.value = preferences.yearFrom;
  fromInput.addEventListener('change', (event) => {
    const value = Number(event.target.value);
    preferences.yearFrom = Number.isNaN(value) ? preferences.yearFrom : value;
    preferences.page = 1;
    renderApp();
  });
  const toInput = createElement('input', {
    className: 'year-input',
    attributes: { type: 'number', min: 1900, max: new Date().getFullYear() }
  });
  toInput.value = preferences.yearTo;
  toInput.addEventListener('change', (event) => {
    const value = Number(event.target.value);
    preferences.yearTo = Number.isNaN(value) ? preferences.yearTo : value;
    preferences.page = 1;
    renderApp();
  });
  yearInputs.appendChild(createElement('span', { text: pack.collectionDetail.filters.from }));
  yearInputs.appendChild(fromInput);
  yearInputs.appendChild(createElement('span', { text: pack.collectionDetail.filters.to }));
  yearInputs.appendChild(toInput);
  yearSection.appendChild(yearInputs);
  filters.appendChild(yearSection);

  const footer = createElement('div', { className: 'filter-footer' });
  const resetButton = createElement('button', {
    className: 'ghost-button',
    text: pack.collectionDetail.filters.reset
  });
  resetButton.type = 'button';
  resetButton.addEventListener('click', () => {
    preferences.search = '';
    preferences.classification.clear();
    preferences.format = 'all';
    preferences.yearFrom = 2000;
    preferences.yearTo = new Date().getFullYear();
    preferences.page = 1;
    renderApp();
  });
  footer.appendChild(resetButton);
  filters.appendChild(footer);
  return filters;
}

function applyBookFilters(books, preferences) {
  return books
    .filter((book) => {
      const hasClassification = preferences.classification instanceof Set && preferences.classification.size > 0;
      if (hasClassification && !preferences.classification.has(book.classification)) {
        return false;
      }
      if (preferences.format !== 'all' && book.format !== preferences.format) {
        return false;
      }
      if (preferences.yearFrom && book.publicationYear < preferences.yearFrom) {
        return false;
      }
      if (preferences.yearTo && book.publicationYear > preferences.yearTo) {
        return false;
      }
      if (!preferences.search) {
        return true;
      }
      const value = preferences.search.trim().toLowerCase();
      return (
        book.title.toLowerCase().includes(value) ||
        book.author.toLowerCase().includes(value) ||
        (book.summary && book.summary.toLowerCase().includes(value))
      );
    })
    .sort((a, b) => {
      const { column, direction } = preferences.sort;
      let compare = 0;
      if (column === 'title') {
        compare = a.title.localeCompare(b.title);
      } else if (column === 'author') {
        compare = a.author.localeCompare(b.author);
      } else if (column === 'year') {
        compare = a.publicationYear - b.publicationYear;
      } else if (column === 'format') {
        compare = a.format.localeCompare(b.format);
      } else if (column === 'size') {
        compare = a.sizeMB - b.sizeMB;
      } else if (column === 'enrichment') {
        compare = a.enrichment.localeCompare(b.enrichment);
      }
      return direction === 'asc' ? compare : -compare;
    });
}

function toggleSort(preferences, column) {
  if (preferences.sort.column === column) {
    preferences.sort.direction = preferences.sort.direction === 'asc' ? 'desc' : 'asc';
  } else {
    preferences.sort.column = column;
    preferences.sort.direction = 'asc';
  }
  renderApp();
}

function renderCardView(books, preferences, pack) {
  const grid = createElement('div', { className: 'book-card-grid' });
  if (!books.length) {
    grid.appendChild(createElement('p', { className: 'empty-state', text: pack.collectionDetail.noResults }));
    return grid;
  }
  books.forEach((book) => {
    const card = createElement('article', { className: 'book-card' });
    const placeholderText = state.locale === 'zh' ? '封面占位' : 'Cover placeholder';
    card.appendChild(createElement('div', { className: 'image-placeholder small', text: placeholderText }));
    const header = createElement('div', { className: 'book-card-header' });
    const checkbox = createElement('input', {
      attributes: { type: 'checkbox', 'aria-label': book.title }
    });
    checkbox.checked = preferences.selected.has(book.id);
    checkbox.addEventListener('change', (event) => {
      if (event.target.checked) {
        preferences.selected.add(book.id);
      } else {
        preferences.selected.delete(book.id);
      }
      renderApp();
    });
    header.appendChild(checkbox);
    const emoji = getClassificationEmoji(book.classification);
    header.appendChild(createElement('h3', { text: `${emoji} ${book.title}` }));
    card.appendChild(header);
    card.appendChild(
      createElement('p', {
        className: 'book-meta',
        text: `${book.author} · ${getClassificationLabel(book.classification)} · ${book.publicationYear}`
      })
    );
    card.appendChild(createElement('p', { className: 'book-summary', text: book.summary }));
    const progress = Math.round((book.progress?.currentPage || 1) / book.pages * 100);
    card.appendChild(
      createElement('div', {
        className: 'progress-bar',
        children: [
          createElement('span', { text: `${progress}%` }),
          createElement('div', {
            className: 'progress-track',
            children: [
              createElement('div', {
                className: 'progress-fill',
                attributes: { style: `width: ${progress}%` }
              })
            ]
          })
        ]
      })
    );
    const actionRow = createElement('div', { className: 'collection-actions' });
    const previewButton = createElement('button', { text: pack.collectionDetail.cardActions.preview });
    previewButton.type = 'button';
    previewButton.addEventListener('click', () => setSelectedBook(book.id));
    const exportButton = createElement('button', { text: pack.collectionDetail.cardActions.export });
    exportButton.type = 'button';
    exportButton.addEventListener('click', (event) => {
      event.stopPropagation();
      openExportModal([book.id], state.selectedCollectionId);
    });
    const chatButton = createElement('button', { text: pack.collectionDetail.cardActions.chat });
    chatButton.type = 'button';
    chatButton.addEventListener('click', () => {
      ensureAiSession(state.selectedCollectionId);
      sendAiMessage(state.selectedCollectionId, `${book.title} summary`);
    });
    actionRow.appendChild(previewButton);
    actionRow.appendChild(exportButton);
    actionRow.appendChild(chatButton);
    card.appendChild(actionRow);
    card.addEventListener('click', (event) => {
      if (event.target.tagName.toLowerCase() === 'input' || event.target.tagName.toLowerCase() === 'button') {
        return;
      }
      setSelectedBook(book.id);
    });
    grid.appendChild(card);
  });
  return grid;
}

function renderTableView(books, preferences, pack) {
  const wrapper = createElement('div', { className: 'table-wrapper' });
  if (!books.length) {
    wrapper.appendChild(createElement('p', { className: 'empty-state', text: pack.collectionDetail.noResults }));
    return wrapper;
  }
  const table = createElement('table', { className: 'book-table' });
  const thead = createElement('thead');
  const headerRow = createElement('tr');

  const selectHeader = createElement('th');
  selectHeader.appendChild(createElement('span', { text: '#' }));
  headerRow.appendChild(selectHeader);

  const headers = [
    { key: 'title', label: pack.collectionDetail.tableHeaders[0] },
    { key: 'author', label: pack.collectionDetail.tableHeaders[1] },
    { key: 'classification', label: pack.collectionDetail.tableHeaders[2] },
    { key: 'year', label: pack.collectionDetail.tableHeaders[3] },
    { key: 'format', label: pack.collectionDetail.tableHeaders[4] },
    { key: 'size', label: pack.collectionDetail.tableHeaders[5] },
    { key: 'dateAdded', label: pack.collectionDetail.tableHeaders[6] },
    { key: 'enrichment', label: pack.collectionDetail.tableHeaders[7] },
    { key: 'actions', label: pack.collectionDetail.tableHeaders[8] }
  ];

  headers.forEach((header) => {
    const th = createElement('th');
    const button = createElement('button', {
      className: 'table-sort',
      text: header.label
    });
    button.type = 'button';
    button.addEventListener('click', () => toggleSort(preferences, header.key));
    if (preferences.sort.column === header.key) {
      button.classList.add(preferences.sort.direction === 'asc' ? 'sort-asc' : 'sort-desc');
    }
    th.appendChild(button);
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = createElement('tbody');
  books.forEach((book) => {
    const row = createElement('tr');
    const checkboxCell = createElement('td');
    const checkbox = createElement('input', { attributes: { type: 'checkbox', 'aria-label': book.title } });
    checkbox.checked = preferences.selected.has(book.id);
    checkbox.addEventListener('change', (event) => {
      if (event.target.checked) {
        preferences.selected.add(book.id);
      } else {
        preferences.selected.delete(book.id);
      }
      renderApp();
    });
    checkboxCell.appendChild(checkbox);
    row.appendChild(checkboxCell);

    const titleCell = createElement('td');
    const titleButton = createElement('button', { className: 'link-button', text: book.title });
    titleButton.type = 'button';
    titleButton.addEventListener('click', (event) => {
      event.stopPropagation();
      setSelectedBook(book.id);
    });
    titleCell.appendChild(titleButton);
    row.appendChild(titleCell);

    row.appendChild(createElement('td', { text: book.author }));
    row.appendChild(createElement('td', { text: getClassificationLabel(book.classification) }));
    row.appendChild(createElement('td', { text: `${book.publicationYear}` }));
    row.appendChild(createElement('td', { text: getFormatLabel(book.format) }));
    row.appendChild(createElement('td', { text: formatSize(book.sizeMB) }));
    row.appendChild(createElement('td', { text: formatDate(book.dateAdded) }));
    row.appendChild(createElement('td', { text: getEnrichmentLabel(book.enrichment) }));

    const actionCell = createElement('td', { className: 'table-actions' });
    const exportButton = createElement('button', {
      className: 'ghost-button small',
      text: pack.collectionDetail.cardActions.export
    });
    exportButton.type = 'button';
    exportButton.addEventListener('click', (event) => {
      event.stopPropagation();
      openExportModal([book.id], state.selectedCollectionId);
    });
    const chatButton = createElement('button', {
      className: 'ghost-button small',
      text: pack.collectionDetail.cardActions.chat
    });
    chatButton.type = 'button';
    chatButton.addEventListener('click', (event) => {
      event.stopPropagation();
      ensureAiSession(state.selectedCollectionId);
      sendAiMessage(state.selectedCollectionId, `${book.title} summary`);
    });
    actionCell.appendChild(exportButton);
    actionCell.appendChild(chatButton);
    row.appendChild(actionCell);
    row.addEventListener('click', (event) => {
      const tag = event.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'button') {
        return;
      }
      setSelectedBook(book.id);
    });
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  wrapper.appendChild(table);
  return wrapper;
}

function renderPaginationControls(preferences, totalItems, pack) {
  const container = createElement('div', { className: 'pagination-controls' });
  const totalPages = Math.max(1, Math.ceil(totalItems / preferences.pageSize));
  if (preferences.page > totalPages) {
    preferences.page = totalPages;
  }

  const sizeSelect = createElement('select');
  [10, 20, 50, 100, 200].forEach((value) => {
    const option = createElement('option', { text: `${value}` });
    option.value = value;
    if (preferences.pageSize === value) {
      option.selected = true;
    }
    sizeSelect.appendChild(option);
  });
  sizeSelect.addEventListener('change', (event) => {
    preferences.pageSize = Number(event.target.value);
    preferences.page = 1;
    renderApp();
  });

  const prevButton = createElement('button', {
    className: 'ghost-button',
    text: pack.collectionDetail.pagination.previous
  });
  prevButton.type = 'button';
  prevButton.disabled = preferences.page <= 1;
  prevButton.addEventListener('click', () => {
    if (preferences.page > 1) {
      preferences.page -= 1;
      renderApp();
    }
  });

  const nextButton = createElement('button', {
    className: 'ghost-button',
    text: pack.collectionDetail.pagination.next
  });
  nextButton.type = 'button';
  nextButton.disabled = preferences.page >= totalPages;
  nextButton.addEventListener('click', () => {
    if (preferences.page < totalPages) {
      preferences.page += 1;
      renderApp();
    }
  });

  container.appendChild(createElement('span', { text: `${pack.collectionDetail.pagination.label}` }));
  container.appendChild(sizeSelect);
  container.appendChild(createElement('span', { text: `${preferences.page} / ${totalPages}` }));
  container.appendChild(prevButton);
  container.appendChild(nextButton);
  return container;
}

function renderBulkActions(preferences, pack) {
  const container = createElement('div', { className: 'bulk-actions' });
  container.appendChild(createElement('span', { text: pack.collectionDetail.bulkActions.title }));
  const selectAll = createElement('button', {
    className: 'ghost-button',
    text: pack.collectionDetail.bulkActions.selectAll
  });
  selectAll.type = 'button';
  selectAll.addEventListener('click', () => {
    const books = getBooks(state.selectedCollectionId);
    books.forEach((book) => preferences.selected.add(book.id));
    renderApp();
  });
  const clear = createElement('button', {
    className: 'ghost-button',
    text: pack.collectionDetail.bulkActions.clear
  });
  clear.type = 'button';
  clear.addEventListener('click', () => {
    preferences.selected.clear();
    renderApp();
  });
  const refresh = createElement('button', {
    className: 'primary-button',
    text: pack.collectionDetail.bulkActions.refreshMetadata
  });
  refresh.type = 'button';
  refresh.addEventListener('click', () => {
    const ids = Array.from(preferences.selected);
    if (!ids.length) {
      showToast(state.locale === 'zh' ? '请选择至少一本书' : 'Select at least one book');
      return;
    }
    refreshMetadata(state.selectedCollectionId, ids);
  });
  container.appendChild(selectAll);
  container.appendChild(clear);
  container.appendChild(refresh);
  return container;
}
function startExport(bookIds, collectionId = state.selectedCollectionId) {
  const ids = Array.from(new Set(bookIds && bookIds.length ? bookIds : state.exportModal?.bookIds || [])).filter(Boolean);
  const targetCollection = collectionId || state.exportModal?.collectionId || state.selectedCollectionId;
  if (!ids.length || !targetCollection) {
    return;
  }
  if (state.exportState.status === 'running') {
    return;
  }
  const pack = getPack();
  if (state.exportModal) {
    state.exportModal.collectionId = targetCollection;
    state.exportModal.bookIds = ids;
  }
  state.exportState.status = 'running';
  state.exportState.progress = 0;
  renderApp();
  const incrementExport = () => {
    if (state.exportState.status !== 'running') {
      return;
    }
    if (state.exportState.progress >= 100) {
      state.exportState.progress = 100;
      state.exportState.status = 'completed';
      createJob({
        type: 'export',
        collectionId: targetCollection,
        label: `${ids.length} book(s)`,
        onComplete: () => {}
      });
      showToast(pack.exportDialog.completed);
      renderApp();
      return;
    }
    state.exportState.progress += Math.min(100 - state.exportState.progress, Math.round(Math.random() * 20) + 15);
    renderApp();
    setTimeout(incrementExport, 500 + Math.random() * 400);
  };
  setTimeout(incrementExport, 400);
}

function renderCollectionDetail(pack) {
  const collectionId = state.selectedCollectionId;
  if (!collectionId) {
    return null;
  }
  const display = getCollectionDisplay(collectionId);
  const meta = state.collectionMeta[collectionId] || { directories: [], lastScan: null };
  const preferences = ensurePreferences(collectionId);
  const books = applyBookFilters(getBooks(collectionId), preferences);
  const startIndex = (preferences.page - 1) * preferences.pageSize;
  const paginated = books.slice(startIndex, startIndex + preferences.pageSize);
  const currentYear = new Date().getFullYear();

  const activeFilters =
    (preferences.classification?.size || 0) +
    (preferences.search.trim() ? 1 : 0) +
    (preferences.format !== 'all' ? 1 : 0) +
    (preferences.yearFrom !== 2000 || preferences.yearTo !== currentYear ? 1 : 0);

  const section = createElement('section', { className: 'detail-section' });
  const hero = createElement('div', { className: 'collection-hero' });
  const info = createElement('div', { className: 'collection-hero-info' });
  info.appendChild(
    createElement('h2', {
      text: `${getCollectionEmoji(collectionId)} ${pack.collectionDetail.titlePrefix}: ${display?.title || ''}`
    })
  );
  info.appendChild(
    createElement('p', {
      className: 'detail-subtitle',
      text: `${pack.collectionDetail.subtitle} · ${pack.collectionDetail.lastScanLabel}: ${formatDate(meta.lastScan)}`
    })
  );

  const directoriesContainer = createElement('div', { className: 'directory-container' });
  directoriesContainer.appendChild(createElement('span', { className: 'directory-title', text: pack.collectionDetail.directories }));
  const editorState = state.directoryEditor;
  if (editorState && editorState.collectionId === collectionId) {
    const textarea = createElement('textarea', {
      className: 'directory-textarea',
      attributes: {
        rows: 4,
        placeholder: pack.collectionDetail.directoryEditor.placeholder
      }
    });
    textarea.value = editorState.value;
    textarea.addEventListener('input', (event) => {
      state.directoryEditor.value = event.target.value;
    });
    const rescanToggle = createElement('label', { className: 'rescan-toggle' });
    const rescanInput = createElement('input', { attributes: { type: 'checkbox' } });
    rescanInput.checked = !!editorState.rescan;
    rescanInput.addEventListener('change', (event) => {
      state.directoryEditor.rescan = event.target.checked;
    });
    rescanToggle.appendChild(rescanInput);
    rescanToggle.appendChild(createElement('span', { text: pack.collectionDetail.directoryEditor.rescan }));
    const editorActions = createElement('div', { className: 'directory-editor-actions' });
    const cancelButton = createElement('button', {
      className: 'ghost-button',
      text: pack.collectionDetail.directoryEditor.cancel
    });
    cancelButton.type = 'button';
    cancelButton.addEventListener('click', closeDirectoryEditor);
    const saveButton = createElement('button', {
      className: 'primary-button',
      text: pack.collectionDetail.directoryEditor.save
    });
    saveButton.type = 'button';
    saveButton.addEventListener('click', saveDirectoryEditor);
    editorActions.appendChild(cancelButton);
    editorActions.appendChild(saveButton);
    directoriesContainer.appendChild(textarea);
    directoriesContainer.appendChild(rescanToggle);
    directoriesContainer.appendChild(editorActions);
  } else {
    if (meta.directories?.length) {
      const list = createElement('ul', { className: 'directory-list' });
      meta.directories.forEach((pathValue) => {
        list.appendChild(createElement('li', { text: pathValue }));
      });
      directoriesContainer.appendChild(list);
    } else {
      directoriesContainer.appendChild(
        createElement('p', { className: 'directory-empty', text: pack.collectionDetail.directoryEmpty })
      );
    }
    const editButton = createElement('button', { className: 'ghost-button', text: pack.collectionDetail.editDirectories });
    editButton.type = 'button';
    editButton.addEventListener('click', () => openDirectoryEditor(collectionId));
    directoriesContainer.appendChild(editButton);
  }
  info.appendChild(directoriesContainer);

  const actionRow = createElement('div', { className: 'detail-actions' });
  const rescan = createElement('button', { className: 'ghost-button', text: pack.collectionDetail.rescan });
  rescan.type = 'button';
  rescan.addEventListener('click', () => {
    createJob({
      type: 'scan',
      collectionId,
      label: `${display?.title || ''} · Rescan`,
      onComplete: () => {
        state.collectionMeta[collectionId] = state.collectionMeta[collectionId] || {};
        state.collectionMeta[collectionId].lastScan = new Date().toISOString();
        showToast(pack.collectionDetail.rescanCompleted);
        renderApp();
      }
    });
  });
  const refresh = createElement('button', { className: 'primary-button', text: pack.collectionDetail.refresh });
  refresh.type = 'button';
  refresh.addEventListener('click', () => {
    refreshMetadata(collectionId);
  });
  const chat = createElement('button', { className: 'ghost-button', text: pack.collectionDetail.openChat });
  chat.type = 'button';
  chat.addEventListener('click', () => {
    ensureAiSession(collectionId);
    renderApp();
  });
  actionRow.appendChild(rescan);
  actionRow.appendChild(refresh);
  actionRow.appendChild(chat);
  info.appendChild(actionRow);

  const side = createElement('div', { className: 'collection-hero-side' });
  const placeholderText = state.locale === 'zh' ? '封面' : 'Cover';
  side.appendChild(createElement('div', { className: 'image-placeholder avatar', text: placeholderText }));
  const filterToggle = createElement('button', {
    className: `filter-icon-button${preferences.filtersCollapsed ? ' collapsed' : ''}`,
    text: '🎛️'
  });
  filterToggle.type = 'button';
  filterToggle.setAttribute('aria-label', pack.collectionDetail.filtersToggle);
  filterToggle.title = pack.collectionDetail.filtersToggle;
  filterToggle.setAttribute('data-count', `${activeFilters}`);
  filterToggle.addEventListener('click', () => {
    preferences.filtersCollapsed = !preferences.filtersCollapsed;
    renderApp();
  });
  side.appendChild(filterToggle);

  hero.appendChild(info);
  hero.appendChild(side);
  section.appendChild(hero);

  if (preferences.filtersCollapsed && activeFilters > 0) {
    const summary = createElement('div', { className: 'filter-summary' });
    summary.appendChild(createElement('span', { className: 'filter-summary-label', text: pack.collectionDetail.activeFilters }));
    if (preferences.search.trim()) {
      summary.appendChild(createElement('span', { className: 'filter-chip active', text: `🔍 ${preferences.search.trim()}` }));
    }
    if (preferences.classification?.size) {
      preferences.classification.forEach((key) => {
        summary.appendChild(createElement('span', { className: 'filter-chip active', text: getClassificationLabel(key) }));
      });
    }
    if (preferences.format !== 'all') {
      summary.appendChild(createElement('span', { className: 'filter-chip active', text: getFormatLabel(preferences.format) }));
    }
    if (preferences.yearFrom !== 2000 || preferences.yearTo !== currentYear) {
      summary.appendChild(
        createElement('span', {
          className: 'filter-chip active',
          text: `${preferences.yearFrom} - ${preferences.yearTo}`
        })
      );
    }
    section.appendChild(summary);
  }

  if (!preferences.filtersCollapsed) {
    section.appendChild(renderFilters(collectionId, preferences, pack));
  }

  const layoutToggle = createElement('div', { className: 'layout-toggle' });
  const cardButton = createElement('button', {
    className: preferences.viewMode === 'cards' ? 'active' : '',
    text: pack.collectionDetail.layoutToggle.cards
  });
  cardButton.type = 'button';
  cardButton.addEventListener('click', () => {
    preferences.viewMode = 'cards';
    renderApp();
  });
  const tableButton = createElement('button', {
    className: preferences.viewMode === 'table' ? 'active' : '',
    text: pack.collectionDetail.layoutToggle.table
  });
  tableButton.type = 'button';
  tableButton.addEventListener('click', () => {
    preferences.viewMode = 'table';
    renderApp();
  });
  layoutToggle.appendChild(cardButton);
  layoutToggle.appendChild(tableButton);
  section.appendChild(layoutToggle);

  section.appendChild(renderBulkActions(preferences, pack));

  if (preferences.viewMode === 'cards') {
    section.appendChild(renderCardView(paginated, preferences, pack));
  } else {
    section.appendChild(renderTableView(paginated, preferences, pack));
  }

  section.appendChild(renderPaginationControls(preferences, books.length, pack));
  return section;
}

function createPreviewSection(pack, book, previewState) {
  const panel = createElement('section', { className: 'preview-panel' });
  panel.appendChild(createElement('h3', { text: pack.previewPanel.title }));
  panel.appendChild(createElement('p', { className: 'preview-summary', text: book.summary }));

  const controls = createElement('div', { className: 'preview-controls' });
  const zoomOut = createElement('button', { text: pack.previewPanel.zoomOut });
  zoomOut.type = 'button';
  zoomOut.addEventListener('click', () => {
    previewState.zoom = Math.max(0.5, previewState.zoom - 0.1);
    renderApp();
  });
  const zoomIn = createElement('button', { text: pack.previewPanel.zoomIn });
  zoomIn.type = 'button';
  zoomIn.addEventListener('click', () => {
    previewState.zoom = Math.min(2.5, previewState.zoom + 0.1);
    renderApp();
  });
  const fitWidth = createElement('button', { text: pack.previewPanel.fitWidth });
  fitWidth.type = 'button';
  fitWidth.addEventListener('click', () => {
    previewState.fit = 'width';
    renderApp();
  });
  const fitPage = createElement('button', { text: pack.previewPanel.fitPage });
  fitPage.type = 'button';
  fitPage.addEventListener('click', () => {
    previewState.fit = 'page';
    renderApp();
  });
  const prevPage = createElement('button', { text: pack.previewPanel.previousPage });
  prevPage.type = 'button';
  prevPage.addEventListener('click', () => {
    previewState.page = Math.max(1, previewState.page - 1);
    renderApp();
  });
  const nextPage = createElement('button', { text: pack.previewPanel.nextPage });
  nextPage.type = 'button';
  nextPage.addEventListener('click', () => {
    previewState.page = Math.min(book.pages, previewState.page + 1);
    renderApp();
  });
  controls.appendChild(zoomOut);
  controls.appendChild(zoomIn);
  controls.appendChild(fitWidth);
  controls.appendChild(fitPage);
  controls.appendChild(prevPage);
  controls.appendChild(nextPage);
  panel.appendChild(controls);

  panel.appendChild(
    createElement('p', {
      className: 'preview-page',
      text: `${pack.previewPanel.currentPage} ${previewState.page} ${pack.previewPanel.of} ${book.pages}`
    })
  );

  const content = createElement('div', {
    className: `preview-content fit-${previewState.fit}${state.ttsState.playing && state.ttsState.highlight ? ' tts-active' : ''}`,
    text: book.preview
  });
  content.style.transform = `scale(${previewState.zoom})`;
  panel.appendChild(content);

  const bookmarks = getBookmarks(book.id);
  const bookmarkButton = createElement('button', {
    className: 'ghost-button',
    text: bookmarks.has(previewState.page) ? pack.previewPanel.removeBookmark : pack.previewPanel.addBookmark
  });
  bookmarkButton.type = 'button';
  bookmarkButton.addEventListener('click', () => {
    if (bookmarks.has(previewState.page)) {
      bookmarks.delete(previewState.page);
      showToast(pack.previewPanel.removedBookmark);
    } else {
      bookmarks.add(previewState.page);
      showToast(pack.previewPanel.savedBookmark);
    }
    renderApp();
  });
  panel.appendChild(bookmarkButton);

  return panel;
}

function renderPreviewPage(pack) {
  const collectionId = state.selectedCollectionId;
  if (!collectionId) {
    return renderDashboardPage(pack);
  }
  const books = getBooks(collectionId);
  if (!books.length) {
    setActivePage('collection');
    return renderCollectionPage(pack);
  }
  const book = books.find((item) => item.id === state.selectedBookId) || books[0];
  if (!book) {
    setActivePage('collection');
    return renderCollectionPage(pack);
  }
  state.selectedBookId = book.id;
  const previewState = getPreviewState(book.id, book.progress?.currentPage || 1);

  const page = createElement('main', { className: 'page preview-page' });
  const header = createElement('div', { className: 'preview-header' });
  const backButton = createElement('button', { className: 'ghost-button', text: pack.previewPanel.back });
  backButton.type = 'button';
  backButton.addEventListener('click', () => {
    setActivePage('collection');
  });
  const titleGroup = createElement('div', { className: 'preview-title-group' });
  titleGroup.appendChild(createElement('h2', { text: book.title }));
  titleGroup.appendChild(
    createElement('p', {
      className: 'preview-subtitle',
      text: `${book.author} · ${getClassificationLabel(book.classification)} · ${book.publicationYear}`
    })
  );
  const headerActions = createElement('div', { className: 'preview-header-actions' });
  const exportButton = createElement('button', { className: 'primary-button', text: pack.previewPanel.export });
  exportButton.type = 'button';
  exportButton.addEventListener('click', () => {
    openExportModal([book.id], collectionId);
  });
  headerActions.appendChild(exportButton);
  header.appendChild(backButton);
  header.appendChild(titleGroup);
  header.appendChild(headerActions);
  page.appendChild(header);

  const layout = createElement('div', { className: 'preview-layout' });
  const mainColumn = createElement('div', { className: 'preview-main' });
  mainColumn.appendChild(createPreviewSection(pack, book, previewState));
  layout.appendChild(mainColumn);

  const sideColumn = createElement('aside', { className: 'preview-side' });
  sideColumn.appendChild(renderTtsPanel(pack, book));
  const metadataCard = createElement('div', { className: 'preview-metadata' });
  metadataCard.appendChild(createElement('h4', { text: pack.previewPanel.metadataTitle }));
  metadataCard.appendChild(createElement('p', { text: `${pack.previewPanel.formatLabel}: ${getFormatLabel(book.format)}` }));
  metadataCard.appendChild(createElement('p', { text: `${pack.previewPanel.sizeLabel}: ${formatSize(book.sizeMB)}` }));
  metadataCard.appendChild(createElement('p', { text: `${pack.previewPanel.pagesLabel}: ${book.pages}` }));
  metadataCard.appendChild(
    createElement('p', {
      text: `${pack.previewPanel.updatedLabel}: ${formatDate(book.metadataUpdatedAt || book.dateAdded)}`
    })
  );
  sideColumn.appendChild(metadataCard);
  layout.appendChild(sideColumn);
  page.appendChild(layout);

  const aiPanel = renderAiPanel(pack);
  if (aiPanel) {
    page.appendChild(aiPanel);
  }
  return page;
}

function renderTtsPanel(pack, book) {
  const container = createElement('div', { className: 'tts-panel' });
  container.appendChild(createElement('h4', { text: pack.ttsPanel.title }));
  const controls = createElement('div', { className: 'tts-controls' });
  const playButton = createElement('button', { text: state.ttsState.playing ? pack.ttsPanel.pause : pack.ttsPanel.play });
  playButton.type = 'button';
  playButton.addEventListener('click', () => {
    state.ttsState.playing = !state.ttsState.playing;
    renderApp();
  });
  const speedSelect = createElement('select');
  [0.5, 1, 1.25, 1.5, 2, 3].forEach((value) => {
    const option = createElement('option', { text: `${value}×` });
    option.value = value;
    if (state.ttsState.speed === value) {
      option.selected = true;
    }
    speedSelect.appendChild(option);
  });
  speedSelect.addEventListener('change', (event) => {
    state.ttsState.speed = Number(event.target.value);
  });

  const voiceSelect = createElement('select');
  [
    { key: 'female', label: pack.ttsPanel.female },
    { key: 'male', label: pack.ttsPanel.male },
    { key: 'neutral', label: pack.ttsPanel.neutral }
  ].forEach((option) => {
    const node = createElement('option', { text: option.label });
    node.value = option.key;
    if (state.ttsState.voice === option.key) {
      node.selected = true;
    }
    voiceSelect.appendChild(node);
  });
  voiceSelect.addEventListener('change', (event) => {
    state.ttsState.voice = event.target.value;
  });

  const highlightToggle = createElement('label', { className: 'highlight-toggle' });
  const highlightInput = createElement('input', { attributes: { type: 'checkbox' } });
  highlightInput.checked = state.ttsState.highlight;
  highlightInput.addEventListener('change', (event) => {
    state.ttsState.highlight = event.target.checked;
    renderApp();
  });
  highlightToggle.appendChild(highlightInput);
  highlightToggle.appendChild(createElement('span', { text: pack.ttsPanel.highlight }));

  controls.appendChild(playButton);
  controls.appendChild(createElement('span', { text: `${pack.ttsPanel.speed}` }));
  controls.appendChild(speedSelect);
  controls.appendChild(createElement('span', { text: `${pack.ttsPanel.voice}` }));
  controls.appendChild(voiceSelect);
  controls.appendChild(highlightToggle);
  container.appendChild(controls);

  if (!book.tts) {
    container.appendChild(
      createElement('p', {
        className: 'tts-warning',
        text: state.locale === 'zh' ? '该格式暂不支持朗读' : 'TTS is not available for this format.'
      })
    );
  }
  return container;
}

function renderExportModal(pack) {
  if (!state.exportModal) {
    return null;
  }
  const { bookIds } = state.exportModal;
  const overlay = createElement('div', { className: 'modal-overlay export-overlay' });
  const panel = createElement('div', { className: 'modal-panel export-modal' });
  panel.appendChild(createElement('h3', { text: pack.exportDialog.title }));
  panel.appendChild(
    createElement('p', {
      className: 'export-count',
      text: pack.exportDialog.count.replace('{count}', bookIds.length)
    })
  );
  panel.appendChild(createElement('p', { className: 'export-description', text: pack.exportDialog.subtitle }));

  const destinationLabel = createElement('label', { text: pack.exportDialog.destination });
  const destinationInput = createElement('input', {
    className: 'export-input',
    attributes: { type: 'text', value: state.exportState.destination }
  });
  destinationInput.addEventListener('change', (event) => {
    state.exportState.destination = event.target.value;
  });
  panel.appendChild(destinationLabel);
  panel.appendChild(destinationInput);

  const metadataToggle = createElement('label', { className: 'highlight-toggle export-toggle' });
  const metadataInput = createElement('input', { attributes: { type: 'checkbox' } });
  metadataInput.checked = state.exportState.includeMetadata;
  metadataInput.addEventListener('change', (event) => {
    state.exportState.includeMetadata = event.target.checked;
  });
  metadataToggle.appendChild(metadataInput);
  metadataToggle.appendChild(createElement('span', { text: pack.exportDialog.metadata }));
  panel.appendChild(metadataToggle);

  const progress = createElement('div', { className: 'progress-track export-progress' });
  const fill = createElement('div', {
    className: 'progress-fill',
    attributes: { style: `width: ${state.exportState.progress}%` }
  });
  progress.appendChild(fill);
  panel.appendChild(progress);

  const statusKey = state.exportState.status;
  const statusText =
    statusKey === 'completed'
      ? pack.exportDialog.completed
      : statusKey === 'running'
        ? pack.exportDialog.running.replace('{progress}', state.exportState.progress)
        : pack.exportDialog.idle;
  panel.appendChild(createElement('p', { className: 'export-status', text: statusText }));

  const actions = createElement('div', { className: 'modal-actions' });
  const cancelButton = createElement('button', {
    className: 'ghost-button',
    text: state.exportState.status === 'completed' ? pack.exportDialog.close : pack.exportDialog.cancel
  });
  cancelButton.type = 'button';
  cancelButton.disabled = state.exportState.status === 'running';
  cancelButton.addEventListener('click', closeExportModal);

  const startButton = createElement('button', {
    className: 'primary-button',
    text: pack.exportDialog.start
  });
  startButton.type = 'button';
  startButton.disabled = state.exportState.status === 'running';
  startButton.addEventListener('click', () => {
    startExport(bookIds, state.exportModal?.collectionId);
  });
  actions.appendChild(cancelButton);
  actions.appendChild(startButton);
  panel.appendChild(actions);

  overlay.appendChild(panel);
  return overlay;
}
function ensureAiSession(collectionId) {
  if (!state.aiSessions[collectionId]) {
    const display = getCollectionDisplay(collectionId);
    state.aiSessions[collectionId] = {
      messages: [
        {
          role: 'assistant',
          content:
            state.locale === 'zh'
              ? `欢迎来到「${display?.title || ''}」研究助手。我可以基于本地图书文本提供摘要、提问和引用。`
              : `Welcome to the ${display?.title || ''} research assistant. Ask about themes, insights, or request citations.`,
          citations: []
        }
      ],
      loading: false
    };
  }
  return state.aiSessions[collectionId];
}

function sendAiMessage(collectionId, prompt) {
  if (!prompt.trim()) {
    return;
  }
  const session = ensureAiSession(collectionId);
  session.messages.push({ role: 'user', content: prompt, citations: [] });
  session.loading = true;
  renderApp();
  setTimeout(() => {
    const books = getBooks(collectionId);
    const cited = books[Math.floor(Math.random() * books.length)];
    session.messages.push({
      role: 'assistant',
      content:
        state.locale === 'zh'
          ? `根据《${cited.title}》的第 ${Math.ceil(Math.random() * cited.pages)} 页，建议关注其关于 ${getClassificationLabel(
              cited.classification
            )} 的讨论，以支持你的问题。`
          : `Drawing on page ${Math.ceil(Math.random() * cited.pages)} of “${cited.title}”, consider the section on ${getClassificationLabel(
              cited.classification
            )} to deepen this line of inquiry.`,
      citations: [{ bookId: cited.id, page: Math.ceil(Math.random() * cited.pages) }]
    });
    session.loading = false;
    renderApp();
  }, 650);
}

function renderAiPanel(pack) {
  const collectionId = state.selectedCollectionId;
  if (!collectionId) {
    return null;
  }
  const session = ensureAiSession(collectionId);
  const container = createElement('section', { className: 'ai-panel' });
  container.appendChild(createElement('h3', { text: pack.aiPanel.title }));
  container.appendChild(createElement('p', { className: 'ai-notice', text: pack.aiPanel.groundingNotice }));

  const transcript = createElement('div', { className: 'ai-transcript' });
  session.messages.forEach((message) => {
    const bubble = createElement('div', { className: `ai-bubble ${message.role}` });
    bubble.appendChild(createElement('p', { text: message.content }));
    if (message.citations && message.citations.length) {
      const citationList = createElement('ul', { className: 'ai-citations' });
      message.citations.forEach((citation) => {
        const book = findBookById(citation.bookId);
        citationList.appendChild(
          createElement('li', {
            text: `${pack.aiPanel.citationLabel}: ${book?.title || ''} · ${state.locale === 'zh' ? '第' : 'p.'} ${citation.page}`
          })
        );
      });
      bubble.appendChild(citationList);
    }
    transcript.appendChild(bubble);
  });
  if (session.loading) {
    transcript.appendChild(
      createElement('div', {
        className: 'ai-bubble assistant loading',
        text: state.locale === 'zh' ? '正在检索向量索引…' : 'Retrieving collection index…'
      })
    );
  }
  container.appendChild(transcript);

  const composer = createElement('div', { className: 'ai-composer' });
  const input = createElement('textarea', {
    attributes: { placeholder: pack.aiPanel.placeholder, rows: 2 }
  });
  const sendButton = createElement('button', { text: pack.aiPanel.send });
  sendButton.type = 'button';
  sendButton.addEventListener('click', () => {
    sendAiMessage(collectionId, input.value);
    input.value = '';
  });
  composer.appendChild(input);
  composer.appendChild(sendButton);

  const newChat = createElement('button', { className: 'ghost-button', text: pack.aiPanel.newChat });
  newChat.type = 'button';
  newChat.addEventListener('click', () => {
    state.aiSessions[collectionId] = undefined;
    ensureAiSession(collectionId);
    renderApp();
  });

  container.appendChild(composer);
  container.appendChild(newChat);
  return container;
}
function renderSettingsPage(pack) {
  const page = createElement('main', { className: 'page settings-page' });
  const panel = createElement('section', { className: 'settings-panel' });
  panel.appendChild(createElement('h2', { text: `⚙️ ${pack.settings.title}` }));

  const metadataGroup = createElement('div', { className: 'settings-group' });
  metadataGroup.appendChild(createElement('h3', { text: pack.settings.tabs[0] }));
  const metadataSources = createElement('input', {
    attributes: { type: 'text', value: state.settings.metadataSources }
  });
  metadataSources.addEventListener('change', (event) => {
    state.settings.metadataSources = event.target.value;
  });
  const apiKey = createElement('input', {
    attributes: { type: 'text', value: state.settings.apiKey, placeholder: pack.settings.apiKey }
  });
  apiKey.addEventListener('change', (event) => {
    state.settings.apiKey = event.target.value;
  });
  const rateLimit = createElement('input', {
    attributes: { type: 'number', min: 1, value: state.settings.rateLimit }
  });
  rateLimit.addEventListener('change', (event) => {
    state.settings.rateLimit = Number(event.target.value);
  });
  const proxy = createElement('input', {
    attributes: { type: 'text', value: state.settings.proxy, placeholder: 'https://proxy.local:7890' }
  });
  proxy.addEventListener('change', (event) => {
    state.settings.proxy = event.target.value;
  });

  metadataGroup.appendChild(createElement('label', { text: pack.settings.metadataSources }));
  metadataGroup.appendChild(metadataSources);
  metadataGroup.appendChild(createElement('label', { text: pack.settings.apiKey }));
  metadataGroup.appendChild(apiKey);
  metadataGroup.appendChild(createElement('label', { text: pack.settings.rateLimit }));
  metadataGroup.appendChild(rateLimit);
  metadataGroup.appendChild(createElement('label', { text: pack.settings.proxy }));
  metadataGroup.appendChild(proxy);

  const storageGroup = createElement('div', { className: 'settings-group' });
  storageGroup.appendChild(createElement('h3', { text: pack.settings.tabs[1] }));
  const cachePath = createElement('input', {
    attributes: { type: 'text', value: state.settings.cachePath }
  });
  cachePath.addEventListener('change', (event) => {
    state.settings.cachePath = event.target.value;
  });
  const previewPath = createElement('input', {
    attributes: { type: 'text', value: state.settings.previewPath }
  });
  previewPath.addEventListener('change', (event) => {
    state.settings.previewPath = event.target.value;
  });
  const embeddingsPath = createElement('input', {
    attributes: { type: 'text', value: state.settings.embeddingsPath }
  });
  embeddingsPath.addEventListener('change', (event) => {
    state.settings.embeddingsPath = event.target.value;
  });
  storageGroup.appendChild(createElement('label', { text: pack.settings.cachePath }));
  storageGroup.appendChild(cachePath);
  storageGroup.appendChild(createElement('label', { text: pack.settings.previewPath }));
  storageGroup.appendChild(previewPath);
  storageGroup.appendChild(createElement('label', { text: pack.settings.embeddingsPath }));
  storageGroup.appendChild(embeddingsPath);

  const readerGroup = createElement('div', { className: 'settings-group' });
  readerGroup.appendChild(createElement('h3', { text: pack.settings.tabs[2] }));
  const paginationInput = createElement('input', {
    attributes: { type: 'number', min: 10, max: 500, value: state.settings.paginationDefault }
  });
  paginationInput.addEventListener('change', (event) => {
    state.settings.paginationDefault = Number(event.target.value);
  });
  const themeSelect = createElement('select');
  ['system', 'light', 'dark'].forEach((value) => {
    const option = createElement('option', { text: value });
    option.value = value;
    if (state.settings.theme === value) {
      option.selected = true;
    }
    themeSelect.appendChild(option);
  });
  themeSelect.addEventListener('change', (event) => {
    state.settings.theme = event.target.value;
  });
  const analyticsToggle = createElement('label', { className: 'highlight-toggle' });
  const analyticsInput = createElement('input', { attributes: { type: 'checkbox' } });
  analyticsInput.checked = state.settings.analytics;
  analyticsInput.addEventListener('change', (event) => {
    state.settings.analytics = event.target.checked;
  });
  analyticsToggle.appendChild(analyticsInput);
  analyticsToggle.appendChild(createElement('span', { text: pack.settings.analytics }));
  const offlineToggle = createElement('label', { className: 'highlight-toggle' });
  const offlineInput = createElement('input', { attributes: { type: 'checkbox' } });
  offlineInput.checked = state.settings.offline;
  offlineInput.addEventListener('change', (event) => {
    state.settings.offline = event.target.checked;
  });
  offlineToggle.appendChild(offlineInput);
  offlineToggle.appendChild(createElement('span', { text: pack.settings.offline }));

  readerGroup.appendChild(createElement('label', { text: pack.settings.paginationDefault }));
  readerGroup.appendChild(paginationInput);
  readerGroup.appendChild(createElement('label', { text: pack.settings.theme }));
  readerGroup.appendChild(themeSelect);
  readerGroup.appendChild(analyticsToggle);
  readerGroup.appendChild(offlineToggle);

  let systemGroup = null;
  if (pack.settings.system) {
    systemGroup = createElement('div', { className: 'settings-group system-group' });
    systemGroup.appendChild(createElement('h3', { text: pack.settings.system.title }));
    systemGroup.appendChild(createElement('p', { className: 'settings-helper', text: pack.settings.system.helper }));

    const systemActions = createElement('div', { className: 'system-actions' });

    const initializeButton = createElement('button', {
      className: 'ghost-button danger',
      text: `🧹 ${pack.settings.system.initialize}`
    });
    initializeButton.type = 'button';
    initializeButton.addEventListener('click', async () => {
      if (!window.confirm(pack.settings.system.initializeConfirm)) {
        return;
      }
      if (!window.api?.initializeSystem) {
        showToast(pack.settings.system.initializeFailure);
        return;
      }
      initializeButton.disabled = true;
      try {
        const result = await window.api.initializeSystem();
        if (result?.success) {
          showToast(pack.settings.system.initializeSuccess);
          setTimeout(() => {
            window.location.reload();
          }, 800);
        } else {
          showToast(pack.settings.system.initializeFailure);
        }
      } catch (error) {
        console.error('Failed to initialize system', error);
        showToast(pack.settings.system.initializeFailure);
      } finally {
        initializeButton.disabled = false;
      }
    });

    const backupButton = createElement('button', {
      className: 'ghost-button',
      text: `💾 ${pack.settings.system.backup}`
    });
    backupButton.type = 'button';
    backupButton.addEventListener('click', async () => {
      if (!window.api?.backupSystem) {
        showToast(pack.settings.system.backupFailure);
        return;
      }
      backupButton.disabled = true;
      try {
        const result = await window.api.backupSystem();
        if (result?.success && result.path) {
          const message = (pack.settings.system.backupSuccess || '').replace('{path}', result.path);
          showToast(message);
        } else if (result?.cancelled) {
          showToast(pack.settings.system.backupCanceled);
        } else {
          showToast(pack.settings.system.backupFailure);
        }
      } catch (error) {
        console.error('Failed to back up system', error);
        showToast(pack.settings.system.backupFailure);
      } finally {
        backupButton.disabled = false;
      }
    });

    systemActions.appendChild(initializeButton);
    systemActions.appendChild(backupButton);
    systemGroup.appendChild(systemActions);
  }
  const actions = createElement('div', { className: 'settings-actions' });
  const backButton = createElement('button', { className: 'ghost-button', text: pack.wizard.cancel });
  backButton.type = 'button';
  backButton.addEventListener('click', () => setActivePage('dashboard'));
  const saveButton = createElement('button', { className: 'ghost-button primary', text: pack.settings.save });
  saveButton.type = 'button';
  saveButton.addEventListener('click', () => {
    showToast(pack.settings.saved);
  });
  actions.appendChild(backButton);
  actions.appendChild(saveButton);

  panel.appendChild(metadataGroup);
  panel.appendChild(storageGroup);
  panel.appendChild(readerGroup);
  if (systemGroup) {
    panel.appendChild(systemGroup);
  }
  panel.appendChild(actions);
  page.appendChild(panel);
  return page;
}

function getJobTypeLabel(type) {
  if (type === 'scan') {
    return state.locale === 'zh' ? '文件扫描' : 'Filesystem scan';
  }
  if (type === 'enrichment') {
    return state.locale === 'zh' ? '元数据刷新' : 'Metadata refresh';
  }
  if (type === 'export') {
    return state.locale === 'zh' ? '导出 PDF' : 'Export to PDF';
  }
  return type;
}

function renderMonitorPage(pack) {
  const page = createElement('main', { className: 'page monitor-page' });
  const panel = createElement('section', { className: 'monitor-panel' });
  panel.appendChild(createElement('h2', { text: `🛠️ ${pack.monitor.title}` }));

  if (!state.jobs.length) {
    panel.appendChild(createElement('p', { className: 'empty-state', text: pack.monitor.empty }));
  } else {
    const table = createElement('table', { className: 'book-table job-table' });
    const thead = createElement('thead');
    const headerRow = createElement('tr');
    pack.monitor.tableHeaders.forEach((label) => {
      headerRow.appendChild(createElement('th', { text: label }));
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
    const tbody = createElement('tbody');
    state.jobs.forEach((job) => {
      const row = createElement('tr');
      row.appendChild(createElement('td', { text: getJobTypeLabel(job.type) }));
      row.appendChild(createElement('td', { text: getCollectionDisplay(job.collectionId)?.title || '' }));
      const progressCell = createElement('td');
      progressCell.appendChild(
        createElement('div', {
          className: 'progress-track',
          children: [
            createElement('div', {
              className: 'progress-fill',
              attributes: { style: `width: ${job.progress}%` }
            })
          ]
        })
      );
      progressCell.appendChild(createElement('span', { text: `${job.progress}%` }));
      row.appendChild(progressCell);
      row.appendChild(createElement('td', { text: pack.monitor.statuses[job.status] || job.status }));
      row.appendChild(createElement('td', { text: formatDate(job.updatedAt) }));
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    panel.appendChild(table);
  }

  const actionRow = createElement('div', { className: 'settings-actions' });
  const backButton = createElement('button', { className: 'ghost-button', text: pack.wizard.cancel });
  backButton.type = 'button';
  backButton.addEventListener('click', () => setActivePage('dashboard'));
  actionRow.appendChild(backButton);
  panel.appendChild(actionRow);
  page.appendChild(panel);
  return page;
}

function renderWizardOverlay(pack) {
  if (!state.showWizard) {
    return null;
  }
  const overlay = createElement('div', { className: 'modal-overlay' });
  const panel = createElement('div', { className: 'modal-panel wizard' });
  panel.appendChild(createElement('h3', { text: pack.wizard.title }));

  const stepList = createElement('ol', { className: 'wizard-steps' });
  pack.wizard.steps.forEach((step, index) => {
    const classes = ['wizard-step'];
    if (index === state.wizardStep) {
      classes.push('active');
    } else if (index < state.wizardStep) {
      classes.push('completed');
    }
    const item = createElement('li', { className: classes.join(' ') });
    item.appendChild(createElement('span', { className: 'wizard-step-index', text: index + 1 }));
    item.appendChild(createElement('span', { className: 'wizard-step-title', text: step.title }));
    stepList.appendChild(item);
  });
  panel.appendChild(stepList);

  const stepInfo = pack.wizard.steps[state.wizardStep];
  panel.appendChild(createElement('h4', { text: stepInfo.title }));
  panel.appendChild(createElement('p', { className: 'wizard-helper', text: stepInfo.helper }));

  if (state.wizardErrors.length) {
    const errorList = createElement('ul', { className: 'wizard-errors' });
    state.wizardErrors.forEach((error) => {
      errorList.appendChild(createElement('li', { text: error }));
    });
    panel.appendChild(errorList);
  }

  if (state.wizardStep === 0) {
    const mutatePaths = (rawPath, options = {}) => {
      const normalized = (rawPath || '').trim();
      if (!normalized) {
        return false;
      }
      const existingIndex = state.wizardData.paths.findIndex((entry) => entry === normalized);
      if (typeof options.replaceIndex === 'number') {
        if (existingIndex !== -1 && existingIndex !== options.replaceIndex) {
          showToast(pack.wizard.duplicatePath);
          return false;
        }
        if (state.wizardData.paths[options.replaceIndex] === normalized) {
          return false;
        }
        state.wizardData.paths.splice(options.replaceIndex, 1, normalized);
      } else {
        if (existingIndex !== -1) {
          showToast(pack.wizard.duplicatePath);
          return false;
        }
        state.wizardData.paths.push(normalized);
      }
      renderApp();
      return true;
    };

    panel.appendChild(createElement('h5', { className: 'path-section-title', text: pack.wizard.selectedTitle }));

    const dropZoneTitle =
      pack.wizard.dropZoneTitle || (state.locale === 'zh' ? '拖放文件夹到此处' : 'Drag & drop folders');
    const dropZoneSubtitle =
      pack.wizard.dropZoneSubtitle ||
      (state.locale === 'zh'
        ? '可直接从 Finder 或资源管理器拖入目录，即刻添加。'
        : 'Drop directories from Finder or Explorer to add them instantly.');
    const dropZoneInvalidMessage =
      pack.wizard.dropNoValidEntries ||
      (state.locale === 'zh' ? '仅支持拖放文件夹。' : 'Only folders can be added from drag-and-drop.');
    const dropZone = createElement('div', { className: 'wizard-dropzone' });
    dropZone.appendChild(createElement('span', { className: 'wizard-drop-title', text: dropZoneTitle }));
    dropZone.appendChild(createElement('span', { className: 'wizard-drop-subtext', text: dropZoneSubtitle }));
    const setDropZoneActive = (active) => {
      dropZone.classList.toggle('active', Boolean(active));
    };
    ['dragenter', 'dragover'].forEach((eventName) => {
      dropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        event.stopPropagation();
        setDropZoneActive(true);
      });
    });
    dropZone.addEventListener('dragleave', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const related = event.relatedTarget;
      if (!(related instanceof Element) || !dropZone.contains(related)) {
        setDropZoneActive(false);
      }
    });
    dropZone.addEventListener('drop', (event) => {
      event.preventDefault();
      event.stopPropagation();
      setDropZoneActive(false);
      const directories = extractDroppedDirectories(event);
      if (!directories.length) {
        if (event.dataTransfer?.files?.length) {
          showToast(dropZoneInvalidMessage);
        }
        return;
      }
      directories.forEach((pathValue) => {
        mutatePaths(pathValue);
      });
    });
    panel.appendChild(dropZone);

    const pathList = createElement('div', { className: 'path-list' });
    if (!state.wizardData.paths.length) {
      pathList.appendChild(createElement('p', { className: 'wizard-helper', text: pack.wizard.emptyPathHelper }));
    } else {
      state.wizardData.paths.forEach((pathValue, index) => {
        const row = createElement('div', { className: 'path-row' });
        row.appendChild(createElement('span', { className: 'path-text', text: pathValue }));
        const actions = createElement('div', { className: 'path-actions' });
        const editButton = createElement('button', { className: 'ghost-button small', text: pack.wizard.editPath });
        editButton.type = 'button';
        editButton.addEventListener('click', async () => {
          const selected = await requestDirectory(pathValue);
          if (selected) {
            mutatePaths(selected, { replaceIndex: index });
          }
        });
        const removeButton = createElement('button', {
          className: 'ghost-button small danger',
          text: pack.wizard.removePath
        });
        removeButton.type = 'button';
        removeButton.addEventListener('click', () => {
          state.wizardData.paths.splice(index, 1);
          renderApp();
        });
        actions.appendChild(editButton);
        actions.appendChild(removeButton);
        row.appendChild(actions);
        pathList.appendChild(row);
      });
    }
    panel.appendChild(pathList);

    const browseButton = createElement('button', { className: 'ghost-button primary', text: pack.wizard.browseForPath });
    browseButton.type = 'button';
    browseButton.addEventListener('click', async () => {
      const selected = await requestDirectory('');
      if (selected) {
        mutatePaths(selected);
      }
    });
    panel.appendChild(browseButton);
  } else if (state.wizardStep === 1) {
    const nameField = createElement('div', { className: 'wizard-field' });
    const nameInput = createElement('input', {
      className: 'wizard-input',
      attributes: { type: 'text', value: state.wizardData.name }
    });
    nameInput.addEventListener('input', (event) => {
      state.wizardData.name = event.target.value;
    });
    const descriptionField = createElement('div', { className: 'wizard-field' });
    const descriptionInput = createElement('textarea', {
      className: 'wizard-textarea',
      attributes: { rows: 3, value: state.wizardData.description }
    });
    descriptionInput.addEventListener('input', (event) => {
      state.wizardData.description = event.target.value;
    });
    nameField.appendChild(createElement('label', { text: pack.wizard.nameLabel }));
    nameField.appendChild(nameInput);
    descriptionField.appendChild(createElement('label', { text: pack.wizard.descriptionLabel }));
    descriptionField.appendChild(descriptionInput);
    panel.appendChild(nameField);
    panel.appendChild(descriptionField);
  } else if (state.wizardStep === 2) {
    const coverField = createElement('div', { className: 'wizard-field' });
    const coverInput = createElement('input', {
      className: 'wizard-file',
      attributes: { type: 'file', accept: 'image/png,image/jpeg,image/webp' }
    });
    const invalidCoverMessage =
      pack.wizard.validations?.invalidCover ||
      (state.locale === 'zh' ? '仅支持 PNG、JPG、WebP 格式。' : 'Only PNG, JPG, and WebP formats are supported.');
    const assignCoverFile = (file) => {
      if (!file) {
        return false;
      }
      if (!isSupportedCoverFile(file)) {
        showToast(invalidCoverMessage);
        return false;
      }
      state.wizardData.coverFile = file;
      state.wizardData.coverName = file.name;
      renderApp();
      return true;
    };
    coverInput.addEventListener('change', (event) => {
      const file = event.target.files?.[0];
      if (!assignCoverFile(file)) {
        event.target.value = '';
      }
    });
    coverField.appendChild(createElement('label', { text: pack.wizard.coverLabel }));
    coverField.appendChild(coverInput);
    const coverDropTitle =
      pack.wizard.coverDropTitle || (state.locale === 'zh' ? '拖放封面图片' : 'Drag & drop a cover image');
    const coverDropSubtitle =
      pack.wizard.coverDropSubtitle ||
      (state.locale === 'zh' ? '支持 PNG、JPG 或 WebP 格式。' : 'PNG, JPG, or WebP files work best.');
    const coverDropZone = createElement('div', {
      className: `wizard-cover-dropzone${state.wizardData.coverName ? ' has-file' : ''}`
    });
    coverDropZone.appendChild(createElement('span', { className: 'wizard-drop-title', text: coverDropTitle }));
    coverDropZone.appendChild(createElement('span', { className: 'wizard-drop-subtext', text: coverDropSubtitle }));
    if (state.wizardData.coverName) {
      coverDropZone.appendChild(createElement('span', { className: 'file-name-tag', text: state.wizardData.coverName }));
    }
    const setCoverDropActive = (active) => {
      coverDropZone.classList.toggle('active', Boolean(active));
    };
    ['dragenter', 'dragover'].forEach((eventName) => {
      coverDropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        event.stopPropagation();
        setCoverDropActive(true);
      });
    });
    coverDropZone.addEventListener('dragleave', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const related = event.relatedTarget;
      if (!(related instanceof Element) || !coverDropZone.contains(related)) {
        setCoverDropActive(false);
      }
    });
    coverDropZone.addEventListener('drop', (event) => {
      event.preventDefault();
      event.stopPropagation();
      setCoverDropActive(false);
      const files = Array.from(event.dataTransfer?.files || []);
      if (!files.length) {
        return;
      }
      const supported = files.find((file) => isSupportedCoverFile(file));
      if (!supported) {
        showToast(invalidCoverMessage);
        return;
      }
      assignCoverFile(supported);
    });
    coverField.appendChild(coverDropZone);
    panel.appendChild(coverField);
    panel.appendChild(createElement('p', { className: 'wizard-helper', text: pack.wizard.dropHint }));
  }

  const actions = createElement('div', { className: 'modal-actions' });
  const cancelButton = createElement('button', { className: 'ghost-button', text: pack.wizard.cancel });
  cancelButton.type = 'button';
  cancelButton.addEventListener('click', closeWizard);
  const backButton = createElement('button', { className: 'ghost-button', text: pack.wizard.back });
  backButton.type = 'button';
  backButton.disabled = state.wizardStep === 0;
  backButton.addEventListener('click', () => {
    if (state.wizardStep > 0) {
      state.wizardStep -= 1;
      state.wizardErrors = [];
      renderApp();
    }
  });
  const nextButton = createElement('button', {
    className: 'primary-button',
    text: state.wizardStep === pack.wizard.steps.length - 1 ? pack.wizard.finish : pack.wizard.next
  });
  nextButton.type = 'button';
  nextButton.addEventListener('click', () => {
    if (!validateWizardStep(state.wizardStep)) {
      return;
    }
    if (state.wizardStep === 2) {
      completeWizard();
      return;
    }
    state.wizardStep += 1;
    state.wizardErrors = [];
    renderApp();
  });
  actions.appendChild(cancelButton);
  actions.appendChild(backButton);
  actions.appendChild(nextButton);
  panel.appendChild(actions);
  overlay.appendChild(panel);
  return overlay;
}

function renderScanOverlay(pack) {
  if (!state.activeScan) {
    return null;
  }
  const overlayPack = pack.scanOverlay;
  if (!overlayPack) {
    return null;
  }
  const overlay = createElement('div', { className: 'modal-overlay' });
  const panel = createElement('div', { className: 'modal-panel wizard scan-panel' });
  const collectionName = state.activeScan.collectionName || overlayPack.fallbackName || '';
  const title = overlayPack.title.replace('{name}', collectionName);
  panel.appendChild(createElement('h3', { text: title }));
  panel.appendChild(createElement('p', { className: 'wizard-helper', text: overlayPack.subtitle }));

  if (state.activeScan.paths?.length) {
    const pathGroup = createElement('div', { className: 'scan-paths' });
    pathGroup.appendChild(createElement('span', { className: 'scan-paths-label', text: overlayPack.pathsTitle }));
    const list = createElement('ul');
    state.activeScan.paths.forEach((pathValue) => {
      list.appendChild(createElement('li', { text: pathValue }));
    });
    pathGroup.appendChild(list);
    panel.appendChild(pathGroup);
  }

  const progressWrapper = createElement('div', { className: 'scan-progress' });
  const percent = Math.min(100, Math.round(state.activeScan.progress || 0));
  const statusText = overlayPack.status[state.activeScan.status] || state.activeScan.status;
  const statusRow = createElement('div', {
    className: 'scan-status-row',
    children: [
      createElement('span', { className: 'scan-progress-label', text: `${overlayPack.progressLabel} · ${percent}%` }),
      createElement('span', { className: 'scan-status-label', text: `${overlayPack.statusLabel} · ${statusText}` })
    ]
  });
  progressWrapper.appendChild(statusRow);
  const track = createElement('div', { className: 'scan-progress-track' });
  const fill = createElement('div', { className: 'scan-progress-fill' });
  fill.style.width = `${percent}%`;
  track.appendChild(fill);
  progressWrapper.appendChild(track);
  panel.appendChild(progressWrapper);

  panel.appendChild(createElement('h4', { text: overlayPack.logTitle }));
  const logBox = createElement('div', { className: 'scan-log' });
  if (!state.activeScan.logs.length) {
    logBox.appendChild(createElement('p', { className: 'wizard-helper', text: overlayPack.logs.empty }));
  } else {
    const logList = createElement('ul');
    state.activeScan.logs.forEach((entry) => {
      logList.appendChild(createElement('li', { text: entry }));
    });
    logBox.appendChild(logList);
  }
  panel.appendChild(logBox);

  const actions = createElement('div', { className: 'modal-actions' });
  const homeButton = createElement('button', { className: 'ghost-button', text: overlayPack.buttons.home });
  homeButton.type = 'button';
  homeButton.addEventListener('click', () => {
    state.activeScan = null;
    setActivePage('dashboard');
  });
  const openButton = createElement('button', { className: 'primary-button', text: overlayPack.buttons.openCollection });
  openButton.type = 'button';
  openButton.addEventListener('click', () => {
    const targetId = state.activeScan?.collectionId;
    state.activeScan = null;
    if (targetId) {
      setSelectedCollection(targetId);
    } else {
      setActivePage('dashboard');
    }
  });
  actions.appendChild(homeButton);
  actions.appendChild(openButton);
  panel.appendChild(actions);
  overlay.appendChild(panel);
  return overlay;
}

function renderToast() {
  if (!state.toast) {
    return null;
  }
  return createElement('div', { className: 'toast', text: state.toast.message });
}

function renderApp() {
  const pack = getPack();
  root.innerHTML = '';
  const appShell = createElement('div', { className: 'app-shell' });
  appShell.appendChild(renderTopBar(pack));
  appShell.appendChild(renderBreadcrumbs(pack));

  if (state.activePage === 'dashboard') {
    appShell.appendChild(renderDashboardPage(pack));
  } else if (state.activePage === 'collection' && state.selectedCollectionId) {
    appShell.appendChild(renderCollectionPage(pack));
  } else if (state.activePage === 'preview' && state.selectedCollectionId) {
    appShell.appendChild(renderPreviewPage(pack));
  } else if (state.activePage === 'monitor') {
    appShell.appendChild(renderMonitorPage(pack));
  } else if (state.activePage === 'settings') {
    appShell.appendChild(renderSettingsPage(pack));
  } else {
    appShell.appendChild(renderDashboardPage(pack));
  }
  root.appendChild(appShell);
  if (state.showWizard) {
    const overlay = renderWizardOverlay(pack);
    if (overlay) {
      root.appendChild(overlay);
    }
  }
  if (state.activeScan) {
    const scanOverlay = renderScanOverlay(pack);
    if (scanOverlay) {
      root.appendChild(scanOverlay);
    }
  }
  const exportModal = renderExportModal(pack);
  if (exportModal) {
    root.appendChild(exportModal);
  }
  const toast = renderToast();
  if (toast) {
    root.appendChild(toast);
  }
  schedulePersist();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
  });
} else {
  initializeApp();
}
})();
