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
const MAX_COVER_SIZE_BYTES = 5 * 1024 * 1024;
const UNKNOWN_LABELS = {
  author: { en: 'Unknown author', zh: '未知作者' },
  classification: { en: 'Unknown classification', zh: '未知分类' },
  year: { en: 'Unknown year', zh: '未知年份' },
  cover: { en: 'No cover available', zh: '暂无封面' }
};
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

if (!classificationCatalog.unknown) {
  classificationCatalog.unknown = {
    en: UNKNOWN_LABELS.classification.en,
    zh: UNKNOWN_LABELS.classification.zh
  };
}
if (!classificationEmojiMap.unknown) {
  classificationEmojiMap.unknown = '❔';
}

const defaultBookExtensions = ['pdf', 'epub', 'mobi', 'docx', 'txt', 'azw3'];
const supportedBookExtensions = new Set(
  (Object.keys(formatCatalog || {}).length ? Object.keys(formatCatalog) : defaultBookExtensions).map((key) =>
    key.toLowerCase()
  )
);

const classificationOptions =
  Array.isArray(bootstrapData.classificationOptions) && bootstrapData.classificationOptions.length
    ? bootstrapData.classificationOptions
    : Object.keys(classificationCatalog);

if (!classificationOptions.includes('unknown')) {
  classificationOptions.unshift('unknown');
}

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
  aiProvider: 'openai',
  aiEndpoint: 'https://api.openai.com/v1/chat/completions',
  aiModel: 'gpt-4o-mini',
  aiApiKey: '',
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

const AI_PROVIDERS = [
  { key: 'openai', label: { en: 'OpenAI', zh: 'OpenAI' } },
  { key: 'deepseek', label: { en: 'DeepSeek', zh: 'DeepSeek' } },
  { key: 'kimi', label: { en: 'Kimi', zh: 'Kimi' } },
  { key: 'doubao', label: { en: 'Doubao', zh: '豆包' } },
  { key: 'qwen', label: { en: 'Qwen', zh: '通义千问' } },
  { key: 'ollama', label: { en: 'Ollama (local)', zh: 'Ollama（本地）' } }
];

const METADATA_SAMPLES = [
  {
    author: 'Liu Cixin',
    classification: 'I2067',
    year: 2008,
    summary: {
      en: 'Award-winning science fiction exploring cosmic sociology and humanity\'s future.',
      zh: '获奖科幻作品，聚焦宇宙社会学与人类命运。'
    },
    colors: ['#0f172a', '#38bdf8']
  },
  {
    author: 'Rachel Carson',
    classification: 'X4',
    year: 1962,
    summary: {
      en: 'Seminal environmental writing that reshaped ecological awareness.',
      zh: '奠定现代生态意识的开创性著作。'
    },
    colors: ['#155e75', '#67e8f9']
  },
  {
    author: 'Jane Jacobs',
    classification: 'TU201',
    year: 1961,
    summary: {
      en: 'Urban design classic unpacking the life of vibrant neighbourhoods.',
      zh: '城市设计经典，解析街区的活力之源。'
    },
    colors: ['#1f2937', '#f97316']
  },
  {
    author: 'Ada Lovelace',
    classification: 'TB472',
    year: 1843,
    summary: {
      en: 'Historical notes on computation and creative mathematical thinking.',
      zh: '记录计算思想与创意数学的历史笔记。'
    },
    colors: ['#4c1d95', '#a855f7']
  },
  {
    author: 'Wang Anyi',
    classification: 'I267',
    year: 2000,
    summary: {
      en: 'Lyrical modern Chinese literature capturing urban memory.',
      zh: '抒情的当代文学，捕捉城市与记忆。'
    },
    colors: ['#7c2d12', '#f59e0b']
  },
  {
    author: 'Elinor Ostrom',
    classification: 'F49',
    year: 1990,
    summary: {
      en: 'Groundbreaking governance research on shared resources and cooperation.',
      zh: '关于共享资源治理的开创性研究，强调协作。'
    },
    colors: ['#0f766e', '#34d399']
  }
];

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

const ttsEngine = {
  supported: !!(window.api?.ttsListVoices && window.api?.ttsSynthesize),
  initializing: false,
  initialized: false,
  pending: false,
  voices: [],
  audioContext: null,
  source: null,
  requestId: 0,
  error: null
};

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
  previewAssets: {},
  ttsState: { playing: false, voice: 'default', speed: 1, highlight: true, status: 'idle' },
  exportState: { destination: '~/Documents/Local-Bookshelf/Exports', includeMetadata: true, status: 'idle', progress: 0 },
  aiSessions: {},
  jobs: [],
  toast: null,
  settings: { ...initialSettings },
  activeScan: null,
  activeMetadata: null,
  directoryEditor: null,
  metadataEditor: null,
  exportModal: null,
  jobLogViewer: null,
  floatingAssistantOpen: false
};

let jobCounter = 0;

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
    selectedBookId: state.selectedBookId,
    floatingAssistantOpen: state.floatingAssistantOpen
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
  if (!state.ttsState.status) {
    state.ttsState.status = 'idle';
  }
  if (!state.ttsState.voice) {
    state.ttsState.voice = 'default';
  }
  if (!state.ttsState.speed) {
    state.ttsState.speed = 1;
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
  if (typeof persisted.floatingAssistantOpen === 'boolean') {
    state.floatingAssistantOpen = persisted.floatingAssistantOpen;
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
    initializeTtsEngine();
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

function renderBookCover(book, size = 'default') {
  const classes = ['book-cover'];
  if (size && size !== 'default') {
    classes.push(size);
  }
  const placeholderText = getUnknownText('cover');
  const createPlaceholder = () =>
    createElement('span', { className: 'cover-placeholder-text', text: placeholderText });

  if (!book || !book.coverUrl) {
    const wrapper = createElement('div', { className: classes.join(' ') });
    wrapper.appendChild(createPlaceholder());
    return wrapper;
  }

  const image = createElement('img', {
    attributes: { src: book.coverUrl, alt: book?.title || placeholderText }
  });
  const wrapper = createElement('div', { className: classes.join(' ') });
  image.addEventListener('error', () => {
    wrapper.innerHTML = '';
    wrapper.appendChild(createPlaceholder());
  });
  wrapper.appendChild(image);
  return wrapper;
}

function getPack() {
  return translations[state.locale] || translations.en || Object.values(translations)[0] || {};
}

function getLocaleKey() {
  return state.locale === 'zh' ? 'zh' : 'en';
}

function getAiProviderDisplayName(providerKey) {
  const entry = AI_PROVIDERS.find((item) => item.key === providerKey);
  if (!entry) {
    return providerKey || 'AI';
  }
  const labels = entry.label || {};
  return labels[getLocaleKey()] || labels.en || entry.key;
}

function getUnknownText(key) {
  const labels = UNKNOWN_LABELS[key];
  if (!labels) {
    return key;
  }
  return labels[getLocaleKey()] || labels.en;
}

function formatAuthorText(author) {
  if (!author) {
    return getUnknownText('author');
  }
  if (typeof author === 'string') {
    const parts = author.split('·');
    if (parts.length >= 2) {
      return parts[getLocaleKey() === 'zh' ? parts.length - 1 : 0].trim();
    }
    if (author.trim().toLowerCase().startsWith('unknown')) {
      return getUnknownText('author');
    }
    return author;
  }
  return `${author}`;
}

function formatPublicationYearText(year) {
  const numeric = Number(year);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return getUnknownText('year');
  }
  return `${numeric}`;
}

function isUnknownAuthor(author) {
  if (!author) {
    return true;
  }
  if (typeof author === 'string') {
    const normalized = author.trim().toLowerCase();
    return normalized === '' || normalized.startsWith('unknown') || normalized.includes('未知');
  }
  return false;
}

function isUnknownClassification(classification) {
  if (!classification) {
    return true;
  }
  return classification === 'unknown' || classification === '未知';
}

function isUnknownYear(year) {
  const numeric = Number(year);
  return !Number.isFinite(numeric) || numeric <= 0;
}

function escapeSvgText(value) {
  return (value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function createCoverDataUrl(title, author, colors = []) {
  const [primary, secondary] = colors.length >= 2 ? colors : ['#1d4ed8', '#38bdf8'];
  const safeTitle = escapeSvgText((title || '').slice(0, 24));
  const safeAuthor = escapeSvgText((author || '').slice(0, 32));
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 480">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${primary}" />
      <stop offset="100%" stop-color="${secondary}" />
    </linearGradient>
  </defs>
  <rect width="320" height="480" rx="28" fill="url(#g)" />
  <text x="30" y="220" font-family="'Inter', 'PingFang SC', sans-serif" font-size="26" font-weight="700" fill="#f8fafc">
    ${safeTitle}
  </text>
  <text x="30" y="270" font-family="'Inter', 'PingFang SC', sans-serif" font-size="18" fill="#e0f2fe">
    ${safeAuthor}
  </text>
</svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function formatDate(dateString) {
  if (!dateString) {
    return getLocaleKey() === 'zh' ? '暂无记录' : 'No record';
  }
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleString(getLocaleKey() === 'zh' ? 'zh-CN' : 'en-US', {
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
    if (key === 'unknown') {
      return getUnknownText('classification');
    }
    return key;
  }
  return labels[getLocaleKey()] || labels.en;
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
  return labels[getLocaleKey()] || labels.en;
}

function getBookSummaryText(book) {
  if (!book) {
    return '';
  }
  if (typeof book.summary === 'string') {
    return book.summary;
  }
  if (book.summary && typeof book.summary === 'object') {
    return book.summary[state.locale] || book.summary.en || Object.values(book.summary)[0] || '';
  }
  return '';
}

function getBookPreviewText(book) {
  if (!book) {
    return '';
  }
  if (typeof book.preview === 'string') {
    return book.preview;
  }
  if (book.preview && typeof book.preview === 'object') {
    return book.preview[state.locale] || book.preview.en || Object.values(book.preview)[0] || '';
  }
  return '';
}

function convertHtmlToPlainText(html) {
  if (!html) {
    return '';
  }
  const container = document.createElement('div');
  container.innerHTML = html;
  const text = container.textContent || container.innerText || '';
  return text.replace(/\s+/g, ' ').trim();
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
  if (page !== 'preview') {
    Object.values(state.previewStates || {}).forEach((entry) => {
      if (entry) {
        entry.fullscreen = false;
      }
    });
    if (state.ttsState.playing) {
      stopTts(false);
    }
    state.metadataEditor = null;
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
    ensurePreviewAsset(book);
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
    const job = createJob({
      type: 'scan',
      collectionId,
      label: `${display?.title || collectionId} · Rescan`,
      paths: raw
    });
    activateScan(job, { collectionName: display?.title || collectionId, paths: raw });
  }
}

function generateMetadataForBook(book, index) {
  const sample = METADATA_SAMPLES[index % METADATA_SAMPLES.length] || METADATA_SAMPLES[0];
  const localeKey = getLocaleKey();
  const classificationPool = classificationOptions.filter((value) => value !== 'unknown');
  const fallbackClassification =
    classificationPool[index % Math.max(classificationPool.length, 1)] || 'unknown';
  const classification =
    sample?.classification && classificationPool.includes(sample.classification)
      ? sample.classification
      : fallbackClassification;
  const author = sample?.author || formatAuthorText(book.author);
  const year = sample?.year || new Date().getFullYear();
  const summary = sample?.summary?.[localeKey] || sample?.summary?.en || '';
  const coverUrl = createCoverDataUrl(book.title, author, sample?.colors);
  return { author, classification, year, summary, coverUrl };
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
  const pack = getPack();
  const display = getCollectionDisplay(collectionId);
  const startedAt = new Date();
  targets.forEach((book) => {
    book.enrichment = 'inprogress';
    book.metadataUpdatedAt = startedAt.toISOString();
    if (!book._originalSummary) {
      book._originalSummary = getBookSummaryText(book);
    }
    book.summary = `${book._originalSummary} (Metadata refreshing…) · 元数据检查中…`;
  });
  renderApp();

  const targetIds = targets.map((book) => book.id);
  const job = createJob({
    type: 'enrichment',
    collectionId,
    label: `${display?.title || collectionId} · ${pack.collectionDetail.refresh}`,
    totalFiles: targets.length,
    manualProgress: true
  });
  job.totalBookFiles = targets.length;
  job.scannedFiles = 0;
  job.logs = [];
  const controller = { cancelled: false, timeoutId: null, finish: null };
  job.controller = controller;
  job.metadataTargets = targetIds;

  activateMetadataRefresh(job, {
    collectionName: display?.title || collectionId,
    totalBooks: targets.length,
    targetIds
  });
  pushMetadataLog(state.locale === 'zh' ? '开始刷新元数据' : 'Metadata refresh started', job.id);

  const finalizeSuccess = () => {
    const stamp = new Date();
    if (controller.timeoutId) {
      clearTimeout(controller.timeoutId);
      controller.timeoutId = null;
    }
    targets.forEach((book) => {
      if (book.enrichment !== 'failed') {
        book.enrichment = 'complete';
      }
      book.metadataUpdatedAt = stamp.toISOString();
    });
    job.status = 'completed';
    job.progress = 100;
    job.scannedFiles = targets.length;
    job.completedUpdates = job.completedUpdates || targets.length;
    job.updatedAt = new Date();
    updateJobOverlays(job);
    if (state.activeMetadata && state.activeMetadata.jobId === job.id) {
      state.activeMetadata.finished = true;
      state.activeMetadata.visible = true;
      state.activeMetadata.status = 'completed';
      state.activeMetadata.progress = job.progress;
      state.activeMetadata.completed = job.completedUpdates;
      state.activeMetadata.totalBooks = targets.length;
      state.activeMetadata.logs = Array.isArray(job.logs) ? job.logs.slice(-30) : [];
    }
    renderApp();
    showToast(pack.collectionDetail.metadataUpdated);
    if (typeof job.onComplete === 'function') {
      job.onComplete(job);
    }
  };

  const finalizeCancel = () => {
    if (controller.timeoutId) {
      clearTimeout(controller.timeoutId);
      controller.timeoutId = null;
    }
    targets.forEach((book) => {
      book.enrichment = 'queued';
      book.metadataUpdatedAt = startedAt.toISOString();
      if (book._originalSummary) {
        book.summary = book._originalSummary;
      }
    });
    job.status = 'cancelled';
    job.updatedAt = new Date();
    updateJobOverlays(job);
    if (state.activeMetadata && state.activeMetadata.jobId === job.id) {
      state.activeMetadata.finished = true;
      state.activeMetadata.visible = true;
      state.activeMetadata.status = 'cancelled';
      state.activeMetadata.progress = job.progress;
      state.activeMetadata.completed = job.completedUpdates || job.scannedFiles || 0;
      state.activeMetadata.logs = Array.isArray(job.logs) ? job.logs.slice(-30) : [];
    }
    renderApp();
  };

  controller.finish = { success: finalizeSuccess, cancel: finalizeCancel };

  const step = (index) => {
    if (controller.cancelled || job.status !== 'running') {
      if (controller.cancelled && controller.finish?.cancel) {
        controller.finish.cancel();
      }
      return;
    }
    if (index >= targets.length) {
      finalizeSuccess();
      return;
    }
    const book = targets[index];
    book.sizeMB = Number((book.sizeMB * (0.95 + Math.random() * 0.1)).toFixed(1));
    const providerName = getAiProviderDisplayName(state.settings.aiProvider);
    pushMetadataLog(
      state.locale === 'zh'
        ? `正在通过 ${providerName} 更新《${book.title}》`
        : `Refreshing ${book.title} via ${providerName}`,
      job.id
    );
    const metadata = generateMetadataForBook(book, index);
    book.author = metadata.author;
    book.classification = metadata.classification;
    book.publicationYear = metadata.year;
    book.coverUrl = metadata.coverUrl;
    const baseSummary = book._originalSummary || getBookSummaryText(book);
    if (!book._originalSummary && baseSummary) {
      book._originalSummary = baseSummary;
    }
    const summaryPieces = [metadata.summary, baseSummary].filter(Boolean);
    const combinedSummary = summaryPieces.join('\n').trim();
    book.summary = combinedSummary || baseSummary || metadata.summary;
    book.enrichment = 'complete';
    book.metadataUpdatedAt = new Date().toISOString();
    job.completedUpdates = (job.completedUpdates || 0) + 1;
    const classificationLabel = getClassificationLabel(book.classification || 'unknown');
    const yearLabel = formatPublicationYearText(book.publicationYear);
    pushMetadataLog(
      state.locale === 'zh'
        ? `《${book.title}》更新完成：作者 ${metadata.author}，分类 ${classificationLabel}，年份 ${yearLabel}，封面 ${metadata.coverUrl ? '已生成' : '暂无'}`
        : `${book.title} updated: author ${metadata.author}, classification ${classificationLabel}, year ${yearLabel}, cover ${metadata.coverUrl ? 'updated' : 'pending'}.`,
      job.id
    );
    job.scannedFiles = index + 1;
    job.progress = Math.round(((index + 1) / Math.max(targets.length, 1)) * 100);
    job.updatedAt = new Date();
    updateJobOverlays(job);
    renderApp();
    controller.timeoutId = setTimeout(() => step(index + 1), 420 + Math.random() * 300);
  };

  controller.timeoutId = setTimeout(() => step(0), 320);
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

function pushScanLog(message, jobId = state.activeScan?.jobId) {
  if (!message || !jobId) {
    return;
  }
  const locale = state.locale === 'zh' ? 'zh-CN' : 'en-US';
  const timestamp = new Date().toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  const entry = `${timestamp} · ${message}`;
  const job = state.jobs.find((item) => item.id === jobId);
  if (job) {
    if (!Array.isArray(job.logs)) {
      job.logs = [];
    }
    job.logs.push(entry);
    if (job.logs.length > 120) {
      job.logs = job.logs.slice(-120);
    }
  }
  if (state.activeScan && state.activeScan.jobId === jobId) {
    state.activeScan.logs.push(entry);
    if (state.activeScan.logs.length > 30) {
      state.activeScan.logs = state.activeScan.logs.slice(-30);
    }
  }
}

function updateScanOverlay(job) {
  if (!job || job.type !== 'scan') {
    return;
  }
  const pack = getPack();
  const overlayPack = pack.scanOverlay;
  if (!overlayPack) {
    return;
  }
  if (!Array.isArray(job.milestones)) {
    job.milestones = [];
  }
  const milestones = job.milestones;

  const ensureMilestone = (key, message) => {
    if (!milestones.includes(key) && message) {
      milestones.push(key);
      pushScanLog(message, job.id);
    }
  };

  if (job.status === 'queued') {
    ensureMilestone('queued', overlayPack.logs.queued);
  }
  if (job.status === 'running') {
    const firstPath = (job.paths && job.paths[0]) || overlayPack.logs.fallbackPath;
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

  if (state.activeScan && state.activeScan.jobId === job.id) {
    const keepListOpen = !!state.activeScan.showFileList;
    state.activeScan.progress = job.progress;
    state.activeScan.status = job.status;
    state.activeScan.discoveredFiles = job.discoveredFiles || 0;
    state.activeScan.scannedFiles = job.scannedFiles || 0;
    state.activeScan.totalFiles = job.totalFiles || job.totalBookFiles || 0;
    state.activeScan.totalBookFiles = job.totalBookFiles || 0;
    state.activeScan.files = Array.isArray(job.files) ? [...job.files] : [];
    state.activeScan.showFileList = keepListOpen && state.activeScan.files.length > 0;
    if (Array.isArray(job.logs)) {
      state.activeScan.logs = job.logs.slice(-30);
    }
    state.activeScan.milestones = job.milestones;
  }
}

function generateBookId(collectionId, filePath) {
  const source = `${collectionId || ''}:${filePath || ''}`;
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) | 0;
  }
  return `book-${collectionId || 'collection'}-${Math.abs(hash)}`;
}

function normalizeTitleFromFile(name) {
  if (!name) {
    return '';
  }
  const base = name.replace(/\.[^.]+$/, '');
  return base
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function createBookFromFile(record, collectionId) {
  const filePath = record?.path || '';
  const rawName = record?.name || (filePath ? filePath.split(/[\\/]/).pop() : '');
  const extension = (record?.extension || getFileExtension(rawName || filePath || '')).toLowerCase();
  const title = normalizeTitleFromFile(rawName) || rawName || 'Untitled';
  const id = generateBookId(collectionId, filePath || rawName || title);
  const modified = typeof record?.modifiedAt === 'number' ? new Date(record.modifiedAt) : new Date();
  const publicationYear = null;
  const sizeMBRaw = typeof record?.size === 'number' ? record.size / (1024 * 1024) : 0;
  const sizeMB = Number(Math.max(sizeMBRaw, 0.1).toFixed(1));
  const pages = Math.max(20, Math.round(sizeMB * 35));
  const classificationMap = {
    pdf: 'TB472',
    epub: 'I2067',
    mobi: 'I227',
    azw3: 'I2067',
    txt: 'F2',
    doc: 'TB472.1',
    docx: 'TB472.1'
  };
  const classification = 'unknown';
  const summary = `${title} · Imported from local filesystem · 本地文件导入`;
  const previewSource = extension ? extension.toUpperCase() : 'FILE';
  const preview = `Preview generated from ${previewSource} · 来自 ${previewSource} 文件的预览`;
  const ttsFormats = new Set(['pdf', 'epub', 'mobi', 'azw3', 'txt', 'doc', 'docx']);
  const exportFormats = new Set(['pdf', 'epub']);

  return {
    id,
    title,
    author: 'Unknown Author · 未知作者',
    classification,
    publicationYear,
    format: extension || 'pdf',
    sizeMB,
    dateAdded: new Date().toISOString(),
    enrichment: 'queued',
    pages,
    progress: { currentPage: 1 },
    isbn: '',
    summary,
    preview,
    coverUrl: null,
    bookmarks: [],
    tts: ttsFormats.has(extension),
    exportable: exportFormats.has(extension),
    metadataUpdatedAt: modified.toISOString(),
    path: filePath,
    _originalSummary: summary
  };
}

function updateBookMetadata(collectionId, bookId, updates = {}) {
  if (!collectionId || !bookId || !updates || typeof updates !== 'object') {
    return;
  }
  const books = getBooks(collectionId);
  const index = books.findIndex((entry) => entry.id === bookId);
  if (index === -1) {
    return;
  }
  const next = { ...books[index], ...updates };
  const list = books.slice();
  list[index] = next;
  state.collectionBooks[collectionId] = list;
  schedulePersist(true);
}

function openMetadataEditor(field, book) {
  if (!book || !state.selectedCollectionId) {
    return;
  }
  const editor = {
    field,
    bookId: book.id,
    collectionId: state.selectedCollectionId,
    value: '',
    preview: null,
    error: null
  };
  if (field === 'author') {
    editor.value = !isUnknownAuthor(book.author) && typeof book.author === 'string' ? book.author : '';
  } else if (field === 'classification') {
    editor.value = !isUnknownClassification(book.classification) ? book.classification : '';
  } else if (field === 'year') {
    editor.value = !isUnknownYear(book.publicationYear) ? String(book.publicationYear) : '';
  } else if (field === 'cover') {
    editor.preview = book.coverUrl || null;
  }
  state.metadataEditor = editor;
  renderApp();
}

function closeMetadataEditor() {
  state.metadataEditor = null;
  renderApp();
}

function clearMetadataField(field, book, pack) {
  if (!book || !state.selectedCollectionId) {
    return;
  }
  const metadataPack = pack.metadataEditor || {};
  const updates = {};
  if (field === 'author') {
    updates.author = '';
  } else if (field === 'classification') {
    updates.classification = 'unknown';
  } else if (field === 'year') {
    updates.publicationYear = null;
  } else if (field === 'cover') {
    updates.coverUrl = null;
  }
  updateBookMetadata(state.selectedCollectionId, book.id, updates);
  if (field === 'cover') {
    showToast(metadataPack.coverCleared || 'Cover removed');
  } else {
    showToast(metadataPack.cleared || 'Field cleared');
  }
  renderApp();
}

function updateCollectionStats(collectionId) {
  const books = getBooks(collectionId) || [];
  const totalSize = books.reduce((sum, book) => sum + (Number(book.sizeMB) || 0), 0);
  const roundedSize = Number(totalSize.toFixed(1));
  const count = books.length;
  const sizeText = roundedSize >= 1024 ? `${(roundedSize / 1024).toFixed(1)} GB` : `${roundedSize.toFixed(1)} MB`;
  const stats = {
    en: `${count} ${count === 1 ? 'book' : 'books'} · ${sizeText}`,
    zh: `${count} 本 · ${sizeText}`
  };
  const meta = state.collectionMeta[collectionId] || {};
  meta.bookCount = count;
  meta.totalSizeMB = roundedSize;
  state.collectionMeta[collectionId] = meta;
  const userIndex = state.userCollections.findIndex((item) => item.id === collectionId);
  if (userIndex !== -1) {
    state.userCollections[userIndex] = {
      ...state.userCollections[userIndex],
      stats
    };
  } else {
    const overrides = state.collectionOverrides[collectionId] || {};
    overrides.stats = stats;
    state.collectionOverrides[collectionId] = overrides;
  }
  return stats;
}

function applyScanResults(job) {
  if (!job || job.type !== 'scan' || !job.collectionId) {
    return;
  }
  const collectionId = job.collectionId;
  const books = (Array.isArray(job.files) ? job.files : []).map((file) => createBookFromFile(file, collectionId));
  state.collectionBooks[collectionId] = books;

  const meta = state.collectionMeta[collectionId] || {};
  meta.lastScan = new Date().toISOString();
  meta.totalFiles = typeof job.totalFiles === 'number' ? job.totalFiles : books.length;
  meta.bookCount = books.length;
  meta.totalSizeMB = Number(books.reduce((sum, book) => sum + (Number(book.sizeMB) || 0), 0).toFixed(1));
  state.collectionMeta[collectionId] = meta;

  updateCollectionStats(collectionId);

  books.forEach((book) => {
    if (!state.previewStates[book.id]) {
      state.previewStates[book.id] = { page: 1, zoom: 1, fit: 'width', fullscreen: false };
    }
    if (!state.bookmarks[book.id]) {
      state.bookmarks[book.id] = new Set();
    }
    if (!book._originalSummary) {
      book._originalSummary = getBookSummaryText(book);
    }
  });

  Object.keys(state.bookmarks).forEach((bookId) => {
    if (!books.some((book) => book.id === bookId)) {
      delete state.bookmarks[bookId];
    }
  });

  const preference = ensurePreferences(collectionId);
  preference.selected = new Set();
  preference.page = 1;

  if (state.selectedCollectionId === collectionId) {
    const current = books.find((book) => book.id === state.selectedBookId);
    if (!current) {
      state.selectedBookId = books[0]?.id || null;
      if (!state.selectedBookId && state.activePage === 'preview') {
        state.activePage = 'collection';
      }
    }
  }

  const pack = getPack();
  const toastMessage = books.length
    ? pack.collectionDetail.rescanCompleted
    : pack.collectionDetail.noBooksFound || (state.locale === 'zh' ? '未找到符合条件的图书文件' : 'No supported book files were found');
  showToast(toastMessage);
}

function updateJobOverlays(job) {
  updateScanOverlay(job);
  updateMetadataOverlay(job);
}

function createJob({ type, collectionId, label, onComplete, paths = [], totalFiles = null, manualProgress = false }) {
  let jobPaths = Array.isArray(paths) ? [...paths] : [];
  if (type === 'scan' && !jobPaths.length && collectionId) {
    const overridePaths = state.collectionOverrides[collectionId]?.paths || [];
    const metaPaths = state.collectionMeta[collectionId]?.directories || [];
    jobPaths = [...overridePaths];
    metaPaths.forEach((entry) => {
      if (!jobPaths.includes(entry)) {
        jobPaths.push(entry);
      }
    });
  }
  const books = type === 'scan' && collectionId ? getBooks(collectionId) : [];
  const estimatedTotal = typeof totalFiles === 'number' && totalFiles >= 0 ? totalFiles : null;
  const initialCount =
    type === 'scan'
      ? estimatedTotal !== null
        ? estimatedTotal
        : Array.isArray(books)
          ? books.length
          : 0
      : estimatedTotal !== null
        ? estimatedTotal
        : 0;
  const job = {
    id: `job-${Date.now()}-${jobCounter++}`,
    type,
    collectionId,
    label,
    progress: 0,
    status: 'queued',
    updatedAt: new Date(),
    onComplete,
    paths: jobPaths,
    logs: [],
    discoveredFiles: 0,
    scannedFiles: 0,
    totalFiles: type === 'scan' ? initialCount : estimatedTotal !== null ? estimatedTotal : 0,
    totalBookFiles: initialCount,
    milestones: [],
    files: [],
    manualProgress: !!manualProgress,
    controller: null,
    completedUpdates: 0
  };
  state.jobs.unshift(job);
  updateJobOverlays(job);
  renderApp();
  setTimeout(() => startJob(job), 300);
  return job;
}

function activateScan(job, options = {}) {
  if (!job || job.type !== 'scan') {
    return;
  }
  const display =
    options.collectionName ||
    getCollectionDisplay(job.collectionId)?.title ||
    (options.fallbackName || job.label || '');
  const pathList = Array.isArray(options.paths) && options.paths.length ? options.paths : job.paths || [];
  state.activeScan = {
    jobId: job.id,
    collectionId: job.collectionId,
    collectionName: display,
    paths: [...pathList],
    progress: job.progress,
    status: job.status,
    logs: Array.isArray(job.logs) ? [...job.logs] : [],
    milestones: job.milestones,
    discoveredFiles: job.discoveredFiles,
    scannedFiles: job.scannedFiles,
    totalFiles: job.totalFiles || job.totalBookFiles,
    totalBookFiles: job.totalBookFiles,
    files: Array.isArray(job.files) ? [...job.files] : [],
    showFileList: false
  };
}

function activateMetadataRefresh(job, options = {}) {
  if (!job || job.type !== 'enrichment') {
    return;
  }
  const display =
    options.collectionName ||
    getCollectionDisplay(job.collectionId)?.title ||
    job.label || '';
  state.activeMetadata = {
    jobId: job.id,
    collectionId: job.collectionId,
    collectionName: display,
    totalBooks: options.totalBooks || job.totalBookFiles || 0,
    completed: job.completedUpdates || job.scannedFiles || 0,
    progress: job.progress || 0,
    status: job.status,
    logs: Array.isArray(job.logs) ? job.logs.slice(-30) : [],
    visible: true,
    targetIds: Array.isArray(options.targetIds) ? [...options.targetIds] : [],
    finished: false
  };
  renderApp();
}

function pushMetadataLog(message, jobId = state.activeMetadata?.jobId) {
  if (!message || !jobId) {
    return;
  }
  const locale = state.locale === 'zh' ? 'zh-CN' : 'en-US';
  const timestamp = new Date().toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  const entry = `${timestamp} · ${message}`;
  const job = state.jobs.find((item) => item.id === jobId);
  if (job) {
    if (!Array.isArray(job.logs)) {
      job.logs = [];
    }
    job.logs.push(entry);
    if (job.logs.length > 120) {
      job.logs = job.logs.slice(-120);
    }
  }
  if (state.activeMetadata && state.activeMetadata.jobId === jobId) {
    if (!Array.isArray(state.activeMetadata.logs)) {
      state.activeMetadata.logs = [];
    }
    state.activeMetadata.logs.push(entry);
    if (state.activeMetadata.logs.length > 30) {
      state.activeMetadata.logs = state.activeMetadata.logs.slice(-30);
    }
  }
}

function updateMetadataOverlay(job) {
  if (!job || job.type !== 'enrichment') {
    return;
  }
  if (state.activeMetadata && state.activeMetadata.jobId === job.id) {
    state.activeMetadata.progress = job.progress;
    state.activeMetadata.status = job.status;
    state.activeMetadata.completed = job.completedUpdates || job.scannedFiles || 0;
    state.activeMetadata.totalBooks = job.totalBookFiles || state.activeMetadata.totalBooks || 0;
    state.activeMetadata.logs = Array.isArray(job.logs) ? job.logs.slice(-30) : [];
    if (['completed', 'failed', 'cancelled'].includes(job.status)) {
      state.activeMetadata.finished = true;
      state.activeMetadata.visible = true;
    }
  }
}

function backgroundMetadataRefresh() {
  if (!state.activeMetadata) {
    return;
  }
  state.activeMetadata.visible = false;
  renderApp();
}

function cancelMetadataRefresh() {
  if (!state.activeMetadata) {
    return;
  }
  const job = state.jobs.find((entry) => entry.id === state.activeMetadata.jobId);
  if (!job || job.type !== 'enrichment') {
    closeMetadataOverlay();
    return;
  }
  if (job.status !== 'running') {
    closeMetadataOverlay();
    return;
  }
  if (job.controller) {
    job.controller.cancelled = true;
    if (job.controller.timeoutId) {
      clearTimeout(job.controller.timeoutId);
      job.controller.timeoutId = null;
    }
  }
  job.status = 'cancelled';
  job.progress = Math.min(job.progress, 100);
  job.updatedAt = new Date();
  const targetIds = Array.isArray(state.activeMetadata.targetIds) ? state.activeMetadata.targetIds : [];
  targetIds.forEach((bookId) => {
    const book = findBookById(bookId);
    if (!book) {
      return;
    }
    book.enrichment = 'queued';
    if (book._originalSummary) {
      book.summary = book._originalSummary;
    }
  });
  pushMetadataLog(state.locale === 'zh' ? '元数据刷新已取消' : 'Metadata refresh cancelled', job.id);
  updateJobOverlays(job);
  if (state.activeMetadata && state.activeMetadata.jobId === job.id) {
    state.activeMetadata.finished = true;
    state.activeMetadata.visible = true;
    state.activeMetadata.status = 'cancelled';
    state.activeMetadata.progress = job.progress;
    state.activeMetadata.completed = job.completedUpdates || job.scannedFiles || 0;
    state.activeMetadata.logs = Array.isArray(job.logs) ? job.logs.slice(-30) : [];
  }
  renderApp();
}

function closeMetadataOverlay() {
  if (!state.activeMetadata) {
    return;
  }
  state.activeMetadata.visible = false;
  state.activeMetadata = null;
  renderApp();
}

function openJobLog(jobId) {
  if (!jobId) {
    return;
  }
  const job = state.jobs.find((item) => item.id === jobId);
  if (!job) {
    state.jobLogViewer = null;
    renderApp();
    return;
  }
  state.jobLogViewer = jobId;
  renderApp();
}

function closeJobLog() {
  if (!state.jobLogViewer) {
    return;
  }
  state.jobLogViewer = null;
  renderApp();
}

function startJob(job) {
  if (!job) {
    return;
  }
  job.status = 'running';
  job.updatedAt = new Date();
  updateJobOverlays(job);
  renderApp();
  if (job.type === 'scan') {
    runScanJob(job);
    return;
  }
  if (job.manualProgress) {
    return;
  }
  advanceJob(job);
}

function advanceJob(job) {
  if (!job || job.status !== 'running') {
    return;
  }
  if (job.type === 'scan') {
    return;
  }
  if (job.manualProgress) {
    return;
  }
  if (job.progress >= 100) {
    job.progress = 100;
    job.status = 'completed';
    job.updatedAt = new Date();
    updateJobOverlays(job);
    renderApp();
    if (typeof job.onComplete === 'function') {
      job.onComplete();
    }
    return;
  }
  const increment = Math.min(100 - job.progress, Math.round(Math.random() * 15) + 10);
  job.progress += increment;
  job.updatedAt = new Date();
  updateJobOverlays(job);
  renderApp();
  setTimeout(() => advanceJob(job), 600 + Math.random() * 400);
}

async function runScanJob(job) {
  if (!job || job.type !== 'scan') {
    return;
  }

  if (!window.api?.enumerateFiles) {
    await runFallbackScanJob(job);
    return;
  }

  const log = (messageZh, messageEn) => {
    pushScanLog(state.locale === 'zh' ? messageZh : messageEn, job.id);
  };

  const paths = Array.isArray(job.paths) ? job.paths.filter(Boolean) : [];
  if (!paths.length) {
    job.discoveredFiles = 0;
    job.totalFiles = 0;
    job.files = [];
    job.totalBookFiles = 0;
    job.scannedFiles = 0;
    job.progress = 100;
    job.status = 'completed';
    job.updatedAt = new Date();
    updateJobOverlays(job);
    applyScanResults(job);
    renderApp();
    if (typeof job.onComplete === 'function') {
      job.onComplete(job);
    }
    return;
  }

  const allEntries = [];
  const seenPaths = new Set();
  let totalDiscovered = 0;

  for (const targetPath of paths) {
    log(`统计目录文件：${targetPath}`, `Counting files in ${targetPath}`);
    let enumeration = null;
    try {
      enumeration = await window.api.enumerateFiles(targetPath);
    } catch (error) {
      console.error('Failed to enumerate directory', targetPath, error);
      log(`无法统计目录：${targetPath}`, `Unable to inspect ${targetPath}`);
      continue;
    }
    if (!enumeration || enumeration.exists === false || enumeration.error) {
      const reason = enumeration?.error ? ` · ${enumeration.error}` : '';
      log(`目录不可访问：${targetPath}${reason}`, `Directory unavailable: ${targetPath}${reason}`);
      continue;
    }
    const files = Array.isArray(enumeration.files) ? enumeration.files : [];
    totalDiscovered += enumeration.totalFiles || files.length;
    files.forEach((file) => {
      if (!file || !file.path || seenPaths.has(file.path)) {
        return;
      }
      seenPaths.add(file.path);
      allEntries.push(file);
    });
  }

  job.discoveredFiles = 0;
  job.totalFiles = totalDiscovered || allEntries.length;
  job.files = [];
  job.totalBookFiles = 0;
  job.scannedFiles = 0;
  job.progress = 5;
  job.updatedAt = new Date();
  updateJobOverlays(job);
  renderApp();

  if (!allEntries.length) {
    log('未发现文件', 'No files detected in the selected paths');
    job.progress = 100;
    job.status = 'completed';
    job.updatedAt = new Date();
    updateJobOverlays(job);
    applyScanResults(job);
    renderApp();
    if (typeof job.onComplete === 'function') {
      job.onComplete(job);
    }
    return;
  }

  const sortedEntries = allEntries.sort((a, b) => (a?.path || '').localeCompare(b?.path || ''));
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  for (let index = 0; index < sortedEntries.length && job.status === 'running'; index += 1) {
    const entry = sortedEntries[index];
    job.discoveredFiles += 1;
    const extension = (entry?.extension || getFileExtension(entry?.name || entry?.path || '')).toLowerCase();
    if (extension && supportedBookExtensions.has(extension)) {
      job.files.push({
        path: entry?.path || '',
        name: entry?.name || (entry?.path ? entry.path.split(/[\\/]/).pop() : ''),
        extension,
        size: typeof entry?.size === 'number' ? entry.size : null,
        modifiedAt: typeof entry?.modifiedAt === 'number' ? entry.modifiedAt : null
      });
    }
    job.totalBookFiles = job.files.length;
    const base = Math.max(job.totalFiles || sortedEntries.length, 1);
    job.progress = Math.min(45, Math.round((job.discoveredFiles / base) * 45));
    job.updatedAt = new Date();
    updateJobOverlays(job);
    renderApp();
    await delay(20);
  }

  if (job.files.length) {
    log(`匹配到 ${job.files.length} 个受支持的文件`, `Found ${job.files.length} supported files`);
  } else {
    log('未找到受支持的图书文件', 'No supported book files detected');
  }

  job.files.sort((a, b) => (a?.path || '').localeCompare(b?.path || ''));

  const totalBooks = Math.max(job.files.length, 1);
  for (let index = 0; index < job.files.length && job.status === 'running'; index += 1) {
    job.scannedFiles = index + 1;
    const progressSegment = Math.round(((index + 1) / totalBooks) * 55);
    job.progress = Math.min(99, 45 + progressSegment);
    job.updatedAt = new Date();
    updateJobOverlays(job);
    renderApp();
    await delay(35);
  }

  job.totalFiles = job.totalFiles || job.discoveredFiles;
  job.totalBookFiles = job.files.length;
  job.scannedFiles = job.files.length;
  job.progress = 100;
  job.status = 'completed';
  job.updatedAt = new Date();
  updateJobOverlays(job);
  applyScanResults(job);
  renderApp();
  if (typeof job.onComplete === 'function') {
    job.onComplete(job);
  }
}

async function runFallbackScanJob(job) {
  if (!job || job.type !== 'scan') {
    return;
  }

  if (!window.api?.readDirectoryEntries) {
    console.warn('Filesystem scan API is unavailable. Completing scan without reading files.');
    job.progress = 100;
    job.status = 'completed';
    job.updatedAt = new Date();
    updateJobOverlays(job);
    applyScanResults(job);
    renderApp();
    if (typeof job.onComplete === 'function') {
      job.onComplete(job);
    }
    return;
  }

  const queue = [];
  const enqueued = new Set();
  const visited = new Set();
  const seenFiles = new Set();

  (Array.isArray(job.files) ? job.files : []).forEach((file) => {
    if (file?.path) {
      seenFiles.add(file.path);
    }
  });

  (Array.isArray(job.paths) ? job.paths : []).forEach((pathValue) => {
    if (pathValue && !enqueued.has(pathValue)) {
      queue.push(pathValue);
      enqueued.add(pathValue);
    }
  });

  if (!queue.length) {
    job.progress = 100;
    job.status = 'completed';
    job.updatedAt = new Date();
    updateJobOverlays(job);
    job.totalFiles = 0;
    job.totalBookFiles = 0;
    job.scannedFiles = 0;
    job.files = [];
    applyScanResults(job);
    renderApp();
    if (typeof job.onComplete === 'function') {
      job.onComplete(job);
    }
    return;
  }

  const log = (messageZh, messageEn) => {
    pushScanLog(state.locale === 'zh' ? messageZh : messageEn, job.id);
  };

  let processedDirectories = 0;

  while (queue.length && job.status === 'running') {
    const current = queue.shift();
    if (!current || visited.has(current)) {
      continue;
    }
    visited.add(current);
    processedDirectories += 1;

    log(`扫描目录：${current}`, `Scanning directory: ${current}`);

    let result;
    try {
      result = await window.api.readDirectoryEntries(current);
    } catch (error) {
      console.error('Failed to read directory entries', error);
      log(`无法读取目录：${current}`, `Unable to read directory: ${current}`);
      continue;
    }

    if (!result || result.exists === false || result.error) {
      const reason = result?.error ? ` · ${result.error}` : '';
      log(`目录不可访问：${current}${reason}`, `Directory unavailable: ${current}${reason}`);
      continue;
    }

    const childDirs = Array.isArray(result.directories) ? result.directories : [];
    childDirs.forEach((entry) => {
      const nextPath = entry?.path;
      if (nextPath && !enqueued.has(nextPath)) {
        queue.push(nextPath);
        enqueued.add(nextPath);
      }
    });

    const files = Array.isArray(result.files) ? result.files : [];
    let matchedFiles = 0;
    files.forEach((file) => {
      job.discoveredFiles += 1;
      const extension = (file?.extension || getFileExtension(file?.name || file?.path || '')).toLowerCase();
      if (!extension || !supportedBookExtensions.has(extension)) {
        return;
      }
      if (file?.path && seenFiles.has(file.path)) {
        return;
      }
      const record = {
        path: file?.path || '',
        name: file?.name || (file?.path ? file.path.split(/[\\/]/).pop() : ''),
        extension,
        size: typeof file?.size === 'number' ? file.size : null
      };
      job.files.push(record);
      if (record.path) {
        seenFiles.add(record.path);
      }
      matchedFiles += 1;
    });

    job.scannedFiles = job.files.length;
    job.totalBookFiles = job.files.length;

    if (matchedFiles > 0) {
      log(
        `匹配到 ${matchedFiles} 个受支持的文件`,
        `Found ${matchedFiles} supported file${matchedFiles > 1 ? 's' : ''}`
      );
    }

    const denominator = processedDirectories + queue.length;
    const completionRatio = denominator > 0 ? processedDirectories / denominator : 1;
    const nextProgress = Math.round(completionRatio * 100);
    job.progress = Math.min(99, Math.max(job.progress, nextProgress));
    job.updatedAt = new Date();
    updateJobOverlays(job);
    renderApp();

    await new Promise((resolve) => setTimeout(resolve, 80));
  }

  job.progress = 100;
  job.status = 'completed';
  job.updatedAt = new Date();
  job.totalFiles = job.discoveredFiles;
  job.totalBookFiles = job.files.length;
  job.scannedFiles = job.files.length;
  updateJobOverlays(job);
  applyScanResults(job);
  renderApp();
  if (typeof job.onComplete === 'function') {
    job.onComplete(job);
  }
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
        en: '0 books · Scan pending',
        zh: '0 本 · 等待扫描'
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
    state.collectionBooks[collectionId] = [];
    state.collectionOverrides[collectionId] = {
      names: { en: name, zh: name },
      descriptions: { en: description, zh: description },
      stats: {
        en: '0 books · Scan pending',
        zh: '0 本 · 等待扫描'
      },
      coverName: state.wizardData.coverName,
      paths: [...state.wizardData.paths]
    };
    showToast(pack.wizard.successTitle);
    const job = createJob({
      type: 'scan',
      collectionId,
      label: `${name} · Initial scan`
    });
    activateScan(job, { collectionName: name, paths: state.wizardData.paths });
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
    const job = createJob({
      type: 'scan',
      collectionId: targetId,
      label: `${state.wizardData.name.trim()} · Rescan`,
      paths: state.wizardData.paths
    });
    activateScan(job, { collectionName: state.wizardData.name.trim(), paths: state.wizardData.paths });
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
    const paths = state.collectionOverrides[collectionId]?.paths || state.collectionMeta[collectionId]?.directories || [];
    const confirmText =
      pack.collectionDetail.confirmRescan ||
      (state.locale === 'zh' ? '确认要重新扫描目录？' : 'Rescan the configured directories?');
    if (!window.confirm(confirmText)) {
      return;
    }
    const job = createJob({
      type: 'scan',
      collectionId,
      label: `${display?.title || collectionId} · Rescan`,
      paths
    });
    activateScan(job, { collectionName: display?.title || collectionId, paths });
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
  const baselineYearFrom = 2000;
  const baselineYearTo = new Date().getFullYear();
  return books
    .filter((book) => {
      const hasClassification = preferences.classification instanceof Set && preferences.classification.size > 0;
      if (hasClassification && !preferences.classification.has(book.classification)) {
        return false;
      }
      if (preferences.format !== 'all' && book.format !== preferences.format) {
        return false;
      }
      const hasYear = Number.isFinite(book.publicationYear) && book.publicationYear > 0;
      const yearFromActive = preferences.yearFrom && preferences.yearFrom !== baselineYearFrom;
      const yearToActive = preferences.yearTo && preferences.yearTo !== baselineYearTo;
      if (yearFromActive && hasYear && book.publicationYear < preferences.yearFrom) {
        return false;
      }
      if (yearToActive && hasYear && book.publicationYear > preferences.yearTo) {
        return false;
      }
      if ((yearFromActive || yearToActive) && !hasYear) {
        return false;
      }
      if (!preferences.search) {
        return true;
      }
      const value = preferences.search.trim().toLowerCase();
      const summary = getBookSummaryText(book).toLowerCase();
      return (
        book.title.toLowerCase().includes(value) ||
        book.author.toLowerCase().includes(value) ||
        summary.includes(value)
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
        const aYear = Number.isFinite(a.publicationYear) ? a.publicationYear : 0;
        const bYear = Number.isFinite(b.publicationYear) ? b.publicationYear : 0;
        compare = aYear - bYear;
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
    card.appendChild(renderBookCover(book, 'small'));
    const header = createElement('div', { className: 'book-card-header' });
    const checkbox = createElement('input', {
      className: 'styled-checkbox',
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
    const authorText = formatAuthorText(book.author);
    const classificationLabel = getClassificationLabel(book.classification || 'unknown');
    const yearText = formatPublicationYearText(book.publicationYear);
    card.appendChild(
      createElement('p', {
        className: 'book-meta',
        text: `${authorText} · ${classificationLabel} · ${yearText}`
      })
    );
    card.appendChild(
      createElement('p', { className: 'book-summary', text: getBookSummaryText(book) })
    );
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
    const checkbox = createElement('input', {
      className: 'styled-checkbox',
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

    row.appendChild(createElement('td', { text: formatAuthorText(book.author) }));
    row.appendChild(createElement('td', { text: getClassificationLabel(book.classification || 'unknown') }));
    row.appendChild(createElement('td', { text: formatPublicationYearText(book.publicationYear) }));
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

  const sizeSelect = createElement('select', { className: 'styled-select' });
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
  const heroBook = paginated[0] || books[0] || null;
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
    const confirmText =
      pack.collectionDetail.confirmRescan ||
      (state.locale === 'zh' ? '确认要重新扫描目录？' : 'Rescan the configured directories?');
    if (!window.confirm(confirmText)) {
      return;
    }
    const job = createJob({
      type: 'scan',
      collectionId,
      label: `${display?.title || ''} · Rescan`
    });
    activateScan(job, { collectionName: display?.title || '', paths: meta.directories || [] });
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
    state.floatingAssistantOpen = true;
    renderApp();
  });
  actionRow.appendChild(rescan);
  actionRow.appendChild(refresh);
  actionRow.appendChild(chat);
  info.appendChild(actionRow);

  const side = createElement('div', { className: 'collection-hero-side' });
  side.appendChild(renderBookCover(heroBook, 'avatar'));
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

function trimPreviewText(text, limit = 40000) {
  if (!text) {
    return '';
  }
  const normalized = text.trim();
  if (normalized.length <= limit) {
    return normalized;
  }
  return `${normalized.slice(0, limit)}…`;
}

function wrapPreviewHtml(content) {
  const styles = `
    <style>
      body { font-family: 'Inter', 'PingFang SC', sans-serif; margin: 0 auto; padding: 24px; line-height: 1.65; max-width: 760px; color: #1f2937; background: #ffffff; }
      h1, h2, h3, h4 { color: #0f172a; }
      img, video { max-width: 100%; height: auto; }
      p { margin: 0 0 1em; }
      pre { white-space: pre-wrap; background: #f8fafc; padding: 20px; border-radius: 12px; line-height: 1.7; }
    </style>
  `;
  return `<!DOCTYPE html><html><head><meta charset="utf-8">${styles}</head><body>${content}</body></html>`;
}

function ensurePreviewAsset(book) {
  if (!book) {
    return null;
  }
  const cached = state.previewAssets[book.id];
  if (cached) {
    return cached;
  }
  if (!book.path || !window.api?.loadPreviewAsset) {
    const fallback = trimPreviewText(getBookPreviewText(book) || getBookSummaryText(book));
    const result = fallback
      ? { status: 'ready', kind: 'text', content: fallback }
      : { status: 'error', error: 'unavailable' };
    state.previewAssets[book.id] = result;
    return result;
  }
  state.previewAssets[book.id] = { status: 'loading' };
  window.api
    .loadPreviewAsset({ path: book.path, format: book.format })
    .then((response) => {
      if (response?.success) {
        const payload = { ...response, status: 'ready' };
        if (payload.kind === 'text') {
          payload.content = trimPreviewText(payload.content);
        }
        state.previewAssets[book.id] = payload;
      } else {
        state.previewAssets[book.id] = {
          status: 'error',
          error: response?.error || 'unavailable'
        };
      }
      renderApp();
    })
    .catch((error) => {
      state.previewAssets[book.id] = { status: 'error', error: error?.message || 'unavailable' };
      renderApp();
    });
  return state.previewAssets[book.id];
}

function getPreviewAssetText(book) {
  if (!book) {
    return '';
  }
  const asset = state.previewAssets[book.id];
  if (!asset || asset.status !== 'ready') {
    return '';
  }
  if (asset.kind === 'text') {
    return asset.content || '';
  }
  if (asset.kind === 'html') {
    return convertHtmlToPlainText(asset.content || '');
  }
  return '';
}

function renderPreviewViewer(pack, book, previewState) {
  const asset = ensurePreviewAsset(book);
  const classes = [`fit-${previewState.fit}`];
  if (previewState.fullscreen) {
    classes.push('fullscreen');
  }
  const viewer = createElement('div', { className: `preview-viewer ${classes.join(' ')}` });
  if (!asset || asset.status === 'loading') {
    viewer.appendChild(createElement('p', { className: 'preview-loading', text: pack.previewPanel.loadingPreview }));
    return viewer;
  }
  if (asset.status === 'error') {
    const message = asset.error
      ? `${pack.previewPanel.unavailable} (${asset.error})`
      : pack.previewPanel.unavailable;
    viewer.appendChild(createElement('p', { className: 'preview-error', text: message }));
    return viewer;
  }
  if (asset.kind === 'dataUrl') {
    const frameWrapper = createElement('div', { className: 'preview-frame-wrapper' });
    frameWrapper.style.transform = `scale(${previewState.zoom})`;
    frameWrapper.style.transformOrigin = 'top left';
    frameWrapper.style.width = `${(1 / previewState.zoom) * 100}%`;
    frameWrapper.style.height = '100%';
    const frame = createElement('iframe', {
      className: 'preview-frame',
      attributes: {
        src: asset.data,
        title: `${book.title} preview`,
        sandbox: 'allow-same-origin allow-scripts',
        allow: 'fullscreen'
      }
    });
    frame.setAttribute('loading', 'lazy');
    frame.style.height = '100%';
    frameWrapper.appendChild(frame);
    viewer.appendChild(frameWrapper);
    return viewer;
  }
  if (asset.kind === 'html') {
    const frameWrapper = createElement('div', { className: 'preview-frame-wrapper' });
    frameWrapper.style.transform = `scale(${previewState.zoom})`;
    frameWrapper.style.transformOrigin = 'top left';
    frameWrapper.style.width = `${(1 / previewState.zoom) * 100}%`;
    frameWrapper.style.height = '100%';
    const frame = createElement('iframe', {
      className: 'preview-frame',
      attributes: {
        srcdoc: wrapPreviewHtml(asset.content || ''),
        title: `${book.title} preview`,
        sandbox: 'allow-same-origin'
      }
    });
    frame.setAttribute('loading', 'lazy');
    frame.style.height = '100%';
    frameWrapper.appendChild(frame);
    viewer.appendChild(frameWrapper);
    return viewer;
  }
  const textBlock = createElement('pre', {
    className: 'preview-text',
    text: asset.content || trimPreviewText(getBookPreviewText(book)) || ''
  });
  textBlock.setAttribute('dir', 'auto');
  textBlock.style.fontSize = `${Math.max(0.8, previewState.zoom)}rem`;
  textBlock.style.height = '100%';
  if (state.ttsState.playing && state.ttsState.highlight) {
    textBlock.classList.add('tts-active');
  }
  viewer.appendChild(textBlock);
  return viewer;
}

function exitPreviewFullscreen() {
  let changed = false;
  Object.values(state.previewStates || {}).forEach((entry) => {
    if (entry && entry.fullscreen) {
      entry.fullscreen = false;
      changed = true;
    }
  });
  if (changed) {
    renderApp();
  }
}

function syncFullscreenClass() {
  const hasFullscreen = Object.values(state.previewStates || {}).some((entry) => entry?.fullscreen);
  document.body.classList.toggle('preview-fullscreen-active', hasFullscreen);
}

function createPreviewSection(pack, book, previewState) {
  const panel = createElement('section', { className: 'preview-panel' });
  if (previewState.fullscreen) {
    panel.classList.add('fullscreen');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
  }
  panel.appendChild(createElement('h3', { text: pack.previewPanel.title }));
  panel.appendChild(
    createElement('p', { className: 'preview-summary', text: getBookSummaryText(book) })
  );

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
  const fullscreenToggle = createElement('button', {
    text: previewState.fullscreen ? pack.previewPanel.exitFullscreen : pack.previewPanel.enterFullscreen
  });
  fullscreenToggle.type = 'button';
  fullscreenToggle.addEventListener('click', () => {
    previewState.fullscreen = !previewState.fullscreen;
    renderApp();
  });
  controls.appendChild(zoomOut);
  controls.appendChild(zoomIn);
  controls.appendChild(fitWidth);
  controls.appendChild(fitPage);
  controls.appendChild(prevPage);
  controls.appendChild(nextPage);
  controls.appendChild(fullscreenToggle);
  panel.appendChild(controls);

  panel.appendChild(
    createElement('p', {
      className: 'preview-page',
      text: `${pack.previewPanel.currentPage} ${previewState.page} ${pack.previewPanel.of} ${book.pages}`
    })
  );

  panel.appendChild(renderPreviewViewer(pack, book, previewState));

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
  ensurePreviewAsset(book);
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
      text: `${formatAuthorText(book.author)} · ${getClassificationLabel(book.classification || 'unknown')} · ${formatPublicationYearText(book.publicationYear)}`
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
  sideColumn.appendChild(renderEditableCover(book, pack));
  sideColumn.appendChild(renderTtsPanel(pack, book));
  sideColumn.appendChild(renderMetadataCard(pack, book));
  layout.appendChild(sideColumn);
  page.appendChild(layout);

  return page;
}

function getNarrationText(book) {
  if (!book) {
    return '';
  }
  const assetText = getPreviewAssetText(book);
  if (assetText) {
    return trimPreviewText(assetText);
  }
  const previewText = getBookPreviewText(book);
  if (previewText) {
    return trimPreviewText(previewText);
  }
  return trimPreviewText(getBookSummaryText(book));
}

async function initializeTtsEngine() {
  if (!ttsEngine.supported || ttsEngine.initializing || ttsEngine.initialized) {
    return;
  }
  ttsEngine.initializing = true;
  ttsEngine.error = null;
  try {
    const response = await window.api.ttsListVoices();
    if (response?.success && Array.isArray(response.voices)) {
      ttsEngine.voices = response.voices.map((voice) => ({
        id: voice.id,
        label: voice.label || voice.name || voice.id,
        language: voice.language || voice.lang || 'en'
      }));
      if (!ttsEngine.voices.length) {
        ttsEngine.voices.push({ id: 'default', label: 'Default', language: 'en' });
      }
      if (!state.ttsState.voice || !ttsEngine.voices.some((voice) => voice.id === state.ttsState.voice)) {
        state.ttsState.voice = ttsEngine.voices[0].id;
      }
      ttsEngine.initialized = true;
    } else {
      ttsEngine.error = response?.error || 'unavailable';
    }
  } catch (error) {
    console.warn('Failed to initialize TTS engine', error);
    ttsEngine.error = error?.message || 'unavailable';
  } finally {
    ttsEngine.initializing = false;
    renderApp();
  }
}

function ensureAudioContext() {
  if (!ttsEngine.supported) {
    return null;
  }
  if (!ttsEngine.audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return null;
    }
    ttsEngine.audioContext = new AudioContextClass();
  }
  return ttsEngine.audioContext;
}

function base64ToArrayBuffer(base64) {
  const binary = window.atob(base64);
  const length = binary.length;
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function stopTts(shouldRender = true) {
  ttsEngine.requestId += 1;
  ttsEngine.pending = false;
  if (ttsEngine.source) {
    try {
      ttsEngine.source.stop();
    } catch (error) {
      console.warn('Failed to stop TTS playback', error);
    }
    try {
      ttsEngine.source.disconnect();
    } catch (error) {
      console.warn('Failed to release TTS audio nodes', error);
    }
  }
  ttsEngine.source = null;
  state.ttsState.playing = false;
  state.ttsState.status = 'idle';
  if (shouldRender) {
    renderApp();
  }
}

function startTts(pack, book) {
  if (!ttsEngine.supported) {
    showToast(pack.ttsPanel.unsupported);
    return;
  }
  initializeTtsEngine();
  if (ttsEngine.initializing) {
    showToast(pack.ttsPanel.initializing);
    return;
  }
  if (ttsEngine.pending && state.ttsState.status === 'generating') {
    showToast(pack.ttsPanel.generatingMessage || pack.ttsPanel.loading);
    return;
  }
  const asset = ensurePreviewAsset(book);
  if (asset && asset.status === 'loading') {
    showToast(pack.ttsPanel.loading);
    return;
  }
  const narration = getNarrationText(book);
  if (!narration) {
    showToast(pack.ttsPanel.noText);
    return;
  }
  const context = ensureAudioContext();
  if (!context) {
    showToast(pack.ttsPanel.unsupported);
    return;
  }
  const requestId = ++ttsEngine.requestId;
  ttsEngine.pending = true;
  state.ttsState.status = 'generating';
  state.ttsState.playing = false;
  renderApp();
  window.api
    .ttsSynthesize({ text: narration, voice: state.ttsState.voice })
    .then(async (response) => {
      if (requestId !== ttsEngine.requestId) {
        return;
      }
      if (!response?.success) {
        throw response?.error || new Error('unavailable');
      }
      const arrayBuffer = base64ToArrayBuffer(response.audio);
      const audioContext = ensureAudioContext();
      if (!audioContext) {
        throw new Error('Audio unavailable');
      }
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      return new Promise((resolve, reject) => {
        audioContext.decodeAudioData(
          arrayBuffer,
          (buffer) => resolve({ buffer, sampleRate: response.sampleRate }),
          (error) => reject(error)
        );
      });
    })
    .then((payload) => {
      if (!payload || requestId !== ttsEngine.requestId) {
        return;
      }
      const audioContext = ensureAudioContext();
      if (!audioContext) {
        throw new Error('Audio unavailable');
      }
      const source = audioContext.createBufferSource();
      source.buffer = payload.buffer;
      source.playbackRate.value = Number(state.ttsState.speed) || 1;
      source.onended = () => {
        if (requestId !== ttsEngine.requestId) {
          return;
        }
        state.ttsState.playing = false;
        state.ttsState.status = 'idle';
        ttsEngine.source = null;
        renderApp();
      };
      source.connect(audioContext.destination);
      ttsEngine.source = source;
      ttsEngine.pending = false;
      state.ttsState.playing = true;
      state.ttsState.status = 'playing';
      source.start(0);
      renderApp();
    })
    .catch((error) => {
      if (requestId !== ttsEngine.requestId) {
        return;
      }
      console.error('Failed to synthesize audio', error);
      ttsEngine.pending = false;
      state.ttsState.playing = false;
      state.ttsState.status = 'idle';
      const code = typeof error === 'string' ? error : error?.code || error?.message;
      if (code === 'busy') {
        showToast(pack.ttsPanel.busy);
      } else if (code === 'empty') {
        showToast(pack.ttsPanel.noText);
      } else {
        showToast(pack.ttsPanel.error);
      }
      renderApp();
    });
}

function renderEditableMetadataRow(pack, book, field, label, value) {
  const metadataPack = pack.metadataEditor || {};
  const row = createElement('div', { className: 'metadata-editable' });
  if (field === 'author' && isUnknownAuthor(book.author)) {
    row.classList.add('unknown');
  } else if (field === 'classification' && isUnknownClassification(book.classification)) {
    row.classList.add('unknown');
  } else if (field === 'year' && isUnknownYear(book.publicationYear)) {
    row.classList.add('unknown');
  }
  row.appendChild(createElement('span', { className: 'metadata-label', text: label }));
  row.appendChild(createElement('span', { className: 'metadata-value', text: value }));
  const actions = createElement('div', { className: 'metadata-editable-actions' });
  const editButton = createElement('button', {
    className: 'metadata-action-button',
    text: metadataPack.edit || 'Edit'
  });
  editButton.type = 'button';
  editButton.addEventListener('click', () => openMetadataEditor(field, book));
  const clearButton = createElement('button', {
    className: 'metadata-action-button',
    text: metadataPack.clear || 'Clear'
  });
  clearButton.type = 'button';
  clearButton.addEventListener('click', () => clearMetadataField(field, book, pack));
  actions.appendChild(editButton);
  actions.appendChild(clearButton);
  row.appendChild(actions);
  return row;
}

function renderEditableCover(book, pack) {
  const metadataPack = pack.metadataEditor || {};
  const wrapper = createElement('div', { className: 'cover-editor' });
  wrapper.appendChild(renderBookCover(book, 'avatar'));
  if (!book.coverUrl) {
    wrapper.classList.add('missing');
  }
  const actions = createElement('div', { className: 'metadata-editable-actions' });
  const editButton = createElement('button', {
    className: 'metadata-action-button',
    text: metadataPack.edit || 'Edit'
  });
  editButton.type = 'button';
  editButton.addEventListener('click', () => openMetadataEditor('cover', book));
  const clearButton = createElement('button', {
    className: 'metadata-action-button',
    text: metadataPack.clear || 'Clear'
  });
  clearButton.type = 'button';
  clearButton.addEventListener('click', () => clearMetadataField('cover', book, pack));
  actions.appendChild(editButton);
  actions.appendChild(clearButton);
  wrapper.appendChild(actions);
  return wrapper;
}

function renderMetadataCard(pack, book) {
  const metadataPack = pack.metadataEditor || {};
  const card = createElement('div', { className: 'preview-metadata editable' });
  card.appendChild(createElement('h4', { text: pack.previewPanel.metadataTitle }));
  card.appendChild(
    renderEditableMetadataRow(
      pack,
      book,
      'author',
      metadataPack.authorLabel || pack.collectionDetail.tableHeaders?.[1] || 'Author',
      formatAuthorText(book.author)
    )
  );
  card.appendChild(
    renderEditableMetadataRow(
      pack,
      book,
      'classification',
      metadataPack.classificationLabel || pack.collectionDetail.tableHeaders?.[2] || 'Classification',
      getClassificationLabel(book.classification || 'unknown')
    )
  );
  card.appendChild(
    renderEditableMetadataRow(
      pack,
      book,
      'year',
      metadataPack.yearLabel || pack.collectionDetail.tableHeaders?.[3] || 'Year',
      formatPublicationYearText(book.publicationYear)
    )
  );
  card.appendChild(createElement('p', { text: `${pack.previewPanel.formatLabel}: ${getFormatLabel(book.format)}` }));
  card.appendChild(createElement('p', { text: `${pack.previewPanel.sizeLabel}: ${formatSize(book.sizeMB)}` }));
  card.appendChild(createElement('p', { text: `${pack.previewPanel.pagesLabel}: ${book.pages}` }));
  card.appendChild(
    createElement('p', {
      text: `${pack.previewPanel.updatedLabel}: ${formatDate(book.metadataUpdatedAt || book.dateAdded)}`
    })
  );
  return card;
}

function renderTtsPanel(pack, book) {
  const container = createElement('div', { className: 'tts-panel' });
  container.appendChild(createElement('h4', { text: pack.ttsPanel.title }));
  initializeTtsEngine();
  const controls = createElement('div', { className: 'tts-controls' });
  const supported = ttsEngine.supported;
  const hasError = !!ttsEngine.error;
  const initializing = ttsEngine.initializing;
  const isPlaying = state.ttsState.playing;
  const isGenerating = state.ttsState.status === 'generating';
  const disabled = !supported || initializing || hasError;
  const buttonLabel = isPlaying ? pack.ttsPanel.stop : pack.ttsPanel.play;
  const playButton = createElement('button', { text: isGenerating ? pack.ttsPanel.stop : buttonLabel });
  playButton.type = 'button';
  playButton.disabled = disabled && !isPlaying && !isGenerating;
  playButton.addEventListener('click', () => {
    if (state.ttsState.playing || state.ttsState.status === 'generating') {
      stopTts();
    } else {
      startTts(pack, book);
    }
  });
  const speedSelect = createElement('select', { className: 'tts-select' });
  speedSelect.disabled = disabled || isGenerating;
  [0.5, 0.75, 1, 1.25, 1.5, 2].forEach((value) => {
    const label = `${value}×`;
    const option = createElement('option', { text: label });
    option.value = value;
    if (Number(state.ttsState.speed || 1) === value) {
      option.selected = true;
    }
    speedSelect.appendChild(option);
  });
  speedSelect.addEventListener('change', (event) => {
    const value = Number(event.target.value) || 1;
    state.ttsState.speed = value;
    if (ttsEngine.source) {
      try {
        ttsEngine.source.playbackRate.value = value;
      } catch (error) {
        console.warn('Failed to adjust playback rate', error);
      }
    }
    renderApp();
  });
  const voiceSelect = createElement('select', { className: 'tts-select' });
  const hasVoices = ttsEngine.voices.length > 0;
  voiceSelect.disabled = disabled || !hasVoices || isGenerating;
  if (hasVoices) {
    ttsEngine.voices.forEach((voice) => {
      const languageLabel =
        voice.language && typeof voice.language === 'string'
          ? voice.language.toUpperCase()
          : voice.language || '';
      const label = languageLabel ? `${voice.label} · ${languageLabel}` : voice.label;
      const option = createElement('option', { text: label });
      option.value = voice.id;
      if (state.ttsState.voice === voice.id) {
        option.selected = true;
      }
      voiceSelect.appendChild(option);
    });
  } else {
    voiceSelect.appendChild(createElement('option', { text: initializing ? pack.ttsPanel.initializing : pack.ttsPanel.loading }));
  }
  voiceSelect.addEventListener('change', (event) => {
    state.ttsState.voice = event.target.value;
    if (state.ttsState.playing) {
      stopTts(false);
      startTts(pack, book);
    } else {
      renderApp();
    }
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
  if (!supported) {
    container.appendChild(createElement('p', { className: 'tts-warning', text: pack.ttsPanel.unsupported }));
  } else if (hasError) {
    const detail = ttsEngine.error ? ` (${ttsEngine.error})` : '';
    container.appendChild(createElement('p', { className: 'tts-warning', text: `${pack.ttsPanel.error}${detail}` }));
  } else if (initializing) {
    container.appendChild(createElement('p', { className: 'tts-helper', text: pack.ttsPanel.initializing }));
  } else if (isGenerating) {
    container.appendChild(createElement('p', { className: 'tts-helper', text: pack.ttsPanel.generating }));
  } else if (ttsEngine.pending) {
    container.appendChild(createElement('p', { className: 'tts-helper', text: pack.ttsPanel.loading }));
  } else if (!hasVoices) {
    container.appendChild(createElement('p', { className: 'tts-helper', text: pack.ttsPanel.loading }));
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
    const providerName = getAiProviderDisplayName(state.settings.aiProvider);
    state.aiSessions[collectionId] = {
      messages: [
        {
          role: 'assistant',
          content:
            state.locale === 'zh'
              ? `欢迎来到「${display?.title || ''}」研究助手，我将通过 ${providerName} 接口回答与本收藏集相关的问题。`
              : `Welcome to the ${display?.title || ''} research assistant. Responses are powered by ${providerName} and grounded in this collection.`,
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
    const cited = books.length ? books[Math.floor(Math.random() * books.length)] : null;
    const classificationLabel = cited ? getClassificationLabel(cited.classification || 'unknown') : '';
    session.messages.push({
      role: 'assistant',
      content: cited
        ? state.locale === 'zh'
          ? `根据《${cited.title}》的第 ${Math.ceil(Math.random() * cited.pages)} 页，建议关注其关于 ${classificationLabel} 的讨论，以支持你的问题。`
          : `Drawing on page ${Math.ceil(Math.random() * cited.pages)} of “${cited.title}”, consider the section on ${classificationLabel} to deepen this line of inquiry.`
        : state.locale === 'zh'
        ? '索引中暂时没有可引用的图书，请完成扫描或刷新后再试。'
        : 'No indexed books are available yet. Scan or refresh metadata before trying again.',
      citations: cited ? [{ bookId: cited.id, page: Math.ceil(Math.random() * cited.pages) }] : []
    });
    session.loading = false;
    renderApp();
  }, 650);
}

function renderAiConversationContent(pack, collectionId) {
  if (!collectionId) {
    return null;
  }
  const session = ensureAiSession(collectionId);
  const container = createElement('div', { className: 'ai-conversation' });
  container.appendChild(createElement('p', { className: 'ai-notice', text: pack.aiPanel.groundingNotice }));
  container.appendChild(
    createElement('span', {
      className: 'ai-provider-tag',
      text: `${pack.aiPanel.providerLabel}: ${getAiProviderDisplayName(state.settings.aiProvider)}`
    })
  );

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
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendAiMessage(collectionId, input.value);
      input.value = '';
    }
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

function renderFloatingAssistant(pack) {
  const allowedPages = ['collection', 'preview'];
  if (!state.selectedCollectionId || !allowedPages.includes(state.activePage)) {
    if (state.floatingAssistantOpen) {
      state.floatingAssistantOpen = false;
    }
    return null;
  }
  const collectionId = state.selectedCollectionId;
  const classes = ['floating-assistant'];
  if (state.floatingAssistantOpen) {
    classes.push('open');
  }
  const wrapper = createElement('div', { className: classes.join(' ') });
  const toggle = createElement('button', {
    className: 'floating-assistant-toggle',
    text: '🤖',
    attributes: {
      type: 'button',
      'aria-label': state.floatingAssistantOpen ? pack.aiPanel.close : pack.aiPanel.toggleLabel
    }
  });
  toggle.addEventListener('click', () => {
    state.floatingAssistantOpen = !state.floatingAssistantOpen;
    if (state.floatingAssistantOpen) {
      ensureAiSession(collectionId);
    }
    renderApp();
  });
  wrapper.appendChild(toggle);
  if (state.floatingAssistantOpen) {
    ensureAiSession(collectionId);
    const panel = createElement('div', { className: 'floating-assistant-panel' });
    const header = createElement('div', { className: 'floating-assistant-header' });
    header.appendChild(createElement('span', { className: 'floating-assistant-title', text: pack.aiPanel.title }));
    const closeButton = createElement('button', {
      className: 'floating-assistant-close',
      text: '✕',
      attributes: { type: 'button', 'aria-label': pack.aiPanel.close }
    });
    closeButton.addEventListener('click', () => {
      state.floatingAssistantOpen = false;
      renderApp();
    });
    header.appendChild(closeButton);
    panel.appendChild(header);
    const conversation = renderAiConversationContent(pack, collectionId);
    if (conversation) {
      panel.appendChild(conversation);
    }
    wrapper.appendChild(panel);
  }
  return wrapper;
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

  const aiHeading = createElement('h4', { className: 'settings-subheading', text: pack.settings.aiSectionTitle });
  metadataGroup.appendChild(aiHeading);
  const providerSelect = createElement('select', { className: 'styled-select' });
  AI_PROVIDERS.forEach((provider) => {
    const option = createElement('option', {
      text: provider.label[getLocaleKey()] || provider.label.en || provider.key
    });
    option.value = provider.key;
    if (state.settings.aiProvider === provider.key) {
      option.selected = true;
    }
    providerSelect.appendChild(option);
  });
  providerSelect.addEventListener('change', (event) => {
    state.settings.aiProvider = event.target.value;
    if (state.selectedCollectionId) {
      state.aiSessions[state.selectedCollectionId] = undefined;
      ensureAiSession(state.selectedCollectionId);
    }
    renderApp();
  });
  const aiEndpoint = createElement('input', {
    attributes: { type: 'text', value: state.settings.aiEndpoint, placeholder: 'https://api.openai.com/v1/chat/completions' }
  });
  aiEndpoint.addEventListener('change', (event) => {
    state.settings.aiEndpoint = event.target.value;
  });
  const aiModel = createElement('input', {
    attributes: { type: 'text', value: state.settings.aiModel, placeholder: 'gpt-4o-mini' }
  });
  aiModel.addEventListener('change', (event) => {
    state.settings.aiModel = event.target.value;
  });
  const aiKey = createElement('input', {
    attributes: { type: 'text', value: state.settings.aiApiKey, placeholder: pack.settings.aiApiKey }
  });
  aiKey.addEventListener('change', (event) => {
    state.settings.aiApiKey = event.target.value;
  });

  metadataGroup.appendChild(createElement('label', { text: pack.settings.aiProvider }));
  metadataGroup.appendChild(providerSelect);
  metadataGroup.appendChild(createElement('label', { text: pack.settings.aiEndpoint }));
  metadataGroup.appendChild(aiEndpoint);
  metadataGroup.appendChild(createElement('label', { text: pack.settings.aiModel }));
  metadataGroup.appendChild(aiModel);
  metadataGroup.appendChild(createElement('label', { text: pack.settings.aiApiKey }));
  metadataGroup.appendChild(aiKey);
  metadataGroup.appendChild(createElement('p', { className: 'settings-helper', text: pack.settings.aiNote }));

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
    const numberLocale = state.locale === 'zh' ? 'zh-CN' : 'en-US';
    state.jobs.forEach((job) => {
      const row = createElement('tr');
      const jobCell = createElement('td');
      const jobButton = createElement('button', {
        className: 'job-log-link',
        text: job.label || getJobTypeLabel(job.type)
      });
      jobButton.type = 'button';
      jobButton.addEventListener('click', () => openJobLog(job.id));
      jobCell.appendChild(jobButton);
      jobCell.appendChild(createElement('span', { className: 'job-type-pill', text: getJobTypeLabel(job.type) }));
      row.appendChild(jobCell);

      const collectionTitle = getCollectionDisplay(job.collectionId)?.title || '';
      row.appendChild(createElement('td', { text: collectionTitle || '—' }));

      const discoveryValue =
        job.type === 'scan'
          ? `${(job.discoveredFiles || 0).toLocaleString(numberLocale)} / ${(job.totalBookFiles || 0).toLocaleString(
              numberLocale
            )}`
          : '—';
      row.appendChild(createElement('td', { text: discoveryValue }));

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
      const scannedValue =
        job.type === 'scan' ? (job.scannedFiles || 0).toLocaleString(numberLocale) : '—';
      row.appendChild(createElement('td', { text: scannedValue }));
      const statusText = pack.monitor.statuses[job.status] || job.status;
      row.appendChild(createElement('td', { text: statusText }));
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

function renderBookMetadataEditorOverlay(pack) {
  const editor = state.metadataEditor;
  if (!editor) {
    return null;
  }
  const metadataPack = pack.metadataEditor || {};
  const overlay = createElement('div', { className: 'modal-overlay metadata-editor-overlay' });
  const panel = createElement('div', { className: 'modal-panel metadata-editor-modal' });
  const titles = {
    author: metadataPack.authorTitle,
    classification: metadataPack.classificationTitle,
    year: metadataPack.yearTitle,
    cover: metadataPack.coverTitle
  };
  panel.appendChild(createElement('h3', { text: titles[editor.field] || metadataPack.title || 'Edit metadata' }));

  if (editor.field === 'cover') {
    const acceptTypes = supportedCoverTypes.length ? supportedCoverTypes.join(',') : 'image/*';
    if (metadataPack.coverUploadHint) {
      panel.appendChild(createElement('p', { className: 'metadata-helper', text: metadataPack.coverUploadHint }));
    }
    const fileInput = createElement('input', {
      className: 'metadata-input',
      attributes: { type: 'file', accept: acceptTypes }
    });
    fileInput.addEventListener('change', (event) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }
      if (supportedCoverTypes.length && file.type && !supportedCoverTypes.includes(file.type)) {
        state.metadataEditor.error = 'invalidImage';
        renderApp();
        return;
      }
      if (file.size > MAX_COVER_SIZE_BYTES) {
        state.metadataEditor.error = 'invalidImage';
        renderApp();
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        state.metadataEditor.preview = reader.result;
        state.metadataEditor.error = null;
        renderApp();
      };
      reader.onerror = () => {
        state.metadataEditor.error = 'invalidImage';
        renderApp();
      };
      reader.readAsDataURL(file);
    });
    panel.appendChild(fileInput);
    if (editor.preview) {
      panel.appendChild(
        createElement('img', {
          className: 'metadata-cover-preview',
          attributes: {
            src: editor.preview,
            alt: metadataPack.coverPreview || 'Cover preview'
          }
        })
      );
    }
  } else {
    const isYear = editor.field === 'year';
    const placeholderKey = `${editor.field}Placeholder`;
    const input = createElement('input', {
      className: 'metadata-input',
      attributes: {
        type: isYear ? 'number' : 'text',
        value: editor.value || '',
        placeholder: metadataPack[placeholderKey] || (isYear ? 'YYYY' : '')
      }
    });
    if (isYear) {
      input.setAttribute('min', '0');
      input.setAttribute('max', `${new Date().getFullYear() + 2}`);
      input.setAttribute('step', '1');
    }
    input.addEventListener('input', (event) => {
      state.metadataEditor.value = event.target.value;
      state.metadataEditor.error = null;
    });
    panel.appendChild(input);
  }

  if (editor.error === 'invalidYear') {
    panel.appendChild(createElement('p', { className: 'metadata-error', text: metadataPack.invalidYear || 'Please enter a valid year.' }));
  } else if (editor.error === 'invalidImage') {
    panel.appendChild(createElement('p', { className: 'metadata-error', text: metadataPack.invalidImage || 'Unsupported image type.' }));
  }

  const actions = createElement('div', { className: 'modal-actions' });
  const cancelButton = createElement('button', {
    className: 'ghost-button',
    text: metadataPack.cancel || pack.exportDialog.cancel || 'Cancel'
  });
  cancelButton.type = 'button';
  cancelButton.addEventListener('click', () => closeMetadataEditor());

  const saveButton = createElement('button', {
    className: 'primary-button',
    text: metadataPack.save || 'Save'
  });
  saveButton.type = 'button';
  if (editor.field === 'cover') {
    saveButton.disabled = !state.metadataEditor.preview;
    saveButton.addEventListener('click', () => {
      if (!state.metadataEditor.preview) {
        state.metadataEditor.error = 'invalidImage';
        renderApp();
        return;
      }
      updateBookMetadata(editor.collectionId, editor.bookId, { coverUrl: state.metadataEditor.preview });
      showToast(metadataPack.coverSaved || 'Cover updated');
      closeMetadataEditor();
    });
  } else {
    saveButton.addEventListener('click', () => {
      const rawValue = (state.metadataEditor.value || '').toString().trim();
      const updates = {};
      if (editor.field === 'author') {
        updates.author = rawValue;
      } else if (editor.field === 'classification') {
        updates.classification = rawValue || 'unknown';
      } else if (editor.field === 'year') {
        const numeric = Number(rawValue);
        if (!Number.isFinite(numeric) || numeric <= 0) {
          state.metadataEditor.error = 'invalidYear';
          renderApp();
          return;
        }
        updates.publicationYear = numeric;
      }
      updateBookMetadata(editor.collectionId, editor.bookId, updates);
      showToast(metadataPack.saved || 'Book details updated');
      closeMetadataEditor();
    });
  }
  actions.appendChild(cancelButton);
  actions.appendChild(saveButton);
  panel.appendChild(actions);

  overlay.appendChild(panel);
  return overlay;
}

function renderMetadataOverlay(pack) {
  if (!state.activeMetadata || state.activeMetadata.visible === false) {
    return null;
  }
  const overlayPack = pack.metadataOverlay;
  if (!overlayPack) {
    return null;
  }
  const overlay = createElement('div', { className: 'modal-overlay metadata-overlay' });
  const panel = createElement('div', { className: 'modal-panel wizard scan-panel metadata-panel' });
  const collectionName = state.activeMetadata.collectionName || overlayPack.fallbackName || '';
  const titleTemplate = overlayPack.title || '{name}';
  panel.appendChild(createElement('h3', { text: titleTemplate.replace('{name}', collectionName) }));
  if (overlayPack.subtitle) {
    panel.appendChild(createElement('p', { className: 'wizard-helper', text: overlayPack.subtitle }));
  }
  const providerName = getAiProviderDisplayName(state.settings.aiProvider);
  panel.appendChild(
    createElement('p', {
      className: 'metadata-provider',
      text:
        state.locale === 'zh'
          ? `调用模型：${providerName}`
          : `Model provider: ${providerName}`
    })
  );

  const percent = Math.min(100, Math.round(state.activeMetadata.progress || 0));
  const statusKey = state.activeMetadata.status || 'queued';
  const statusLabel = overlayPack.status?.[statusKey] || statusKey;

  const statusRow = createElement('div', {
    className: 'scan-status-row',
    children: [
      createElement('span', {
        className: 'scan-progress-label',
        text: `${overlayPack.progressLabel || 'Progress'} · ${percent}%`
      }),
      createElement('span', {
        className: 'scan-status-label',
        text: `${overlayPack.statusLabel || 'Status'} · ${statusLabel}`
      })
    ]
  });
  const progressWrapper = createElement('div', { className: 'scan-progress' });
  progressWrapper.appendChild(statusRow);
  const track = createElement('div', { className: 'scan-progress-track' });
  const fill = createElement('div', { className: 'scan-progress-fill' });
  fill.style.width = `${percent}%`;
  track.appendChild(fill);
  progressWrapper.appendChild(track);
  panel.appendChild(progressWrapper);

  const metrics = createElement('div', { className: 'scan-metrics' });
  const numberLocale = state.locale === 'zh' ? 'zh-CN' : 'en-US';
  metrics.appendChild(
    createElement('div', {
      className: 'scan-metric',
      children: [
        createElement('span', {
          className: 'scan-metric-label',
          text: overlayPack.metrics?.totalBooks || 'Books selected'
        }),
        createElement('strong', {
          className: 'scan-metric-value',
          text: (state.activeMetadata.totalBooks || 0).toLocaleString(numberLocale)
        })
      ]
    })
  );
  metrics.appendChild(
    createElement('div', {
      className: 'scan-metric',
      children: [
        createElement('span', {
          className: 'scan-metric-label',
          text: overlayPack.metrics?.updatedBooks || 'Books updated'
        }),
        createElement('strong', {
          className: 'scan-metric-value',
          text: (state.activeMetadata.completed || 0).toLocaleString(numberLocale)
        })
      ]
    })
  );
  panel.appendChild(metrics);

  panel.appendChild(createElement('h4', { text: overlayPack.logTitle || 'Activity log' }));
  const logBox = createElement('div', { className: 'scan-log' });
  if (!Array.isArray(state.activeMetadata.logs) || !state.activeMetadata.logs.length) {
    logBox.appendChild(
      createElement('p', {
        className: 'wizard-helper',
        text: overlayPack.logs?.empty || (state.locale === 'zh' ? '等待刷新开始…' : 'Waiting for updates to begin…')
      })
    );
  } else {
    const list = createElement('ul');
    state.activeMetadata.logs.forEach((entry) => {
      list.appendChild(createElement('li', { text: entry }));
    });
    logBox.appendChild(list);
  }
  panel.appendChild(logBox);

  const actions = createElement('div', { className: 'modal-actions' });
  const isFinished = state.activeMetadata?.finished || ['completed', 'failed', 'cancelled'].includes(statusKey);
  if (isFinished) {
    const closeButton = createElement('button', {
      className: 'primary-button',
      text: overlayPack.buttons?.close || 'Close'
    });
    closeButton.type = 'button';
    closeButton.addEventListener('click', closeMetadataOverlay);
    actions.appendChild(closeButton);
  } else {
    const backgroundButton = createElement('button', {
      className: 'ghost-button',
      text: overlayPack.buttons?.background || 'Run in background'
    });
    backgroundButton.type = 'button';
    backgroundButton.addEventListener('click', backgroundMetadataRefresh);
    const cancelButton = createElement('button', {
      className: 'primary-button',
      text: overlayPack.buttons?.cancel || 'Cancel run'
    });
    cancelButton.type = 'button';
    cancelButton.disabled = statusKey !== 'running';
    cancelButton.addEventListener('click', cancelMetadataRefresh);
    actions.appendChild(backgroundButton);
    actions.appendChild(cancelButton);
  }
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

  if (typeof state.activeScan.discoveredFiles === 'number') {
    const numberLocale = state.locale === 'zh' ? 'zh-CN' : 'en-US';
    const metrics = createElement('div', { className: 'scan-metrics' });
    const hasFiles = Array.isArray(state.activeScan.files) && state.activeScan.files.length > 0;
    metrics.appendChild(
      createElement('div', {
        className: 'scan-metric',
        children: [
          createElement('span', {
            className: 'scan-metric-label',
            text:
              overlayPack.discoveryLabel ||
              overlayPack.discoveryStats ||
              pack.monitor?.discoveryColumn ||
              'Discovered / Total'
          }),
          createElement('strong', {
            className: 'scan-metric-value',
            text: `${(state.activeScan.discoveredFiles || 0).toLocaleString(numberLocale)} / ${(
              state.activeScan.totalFiles || state.activeScan.totalBookFiles || 0
            ).toLocaleString(numberLocale)}`
          })
        ]
      })
    );
    const scannedValueContainer = createElement('strong', { className: 'scan-metric-value' });
    const scannedButton = createElement('button', {
      className: 'scan-metric-button',
      text: (state.activeScan.scannedFiles || 0).toLocaleString(numberLocale),
      attributes: { type: 'button' }
    });
    scannedButton.setAttribute(
      'title',
      hasFiles
        ? state.locale === 'zh'
          ? '查看已扫描的文件名称'
          : 'View scanned file names'
        : state.locale === 'zh'
        ? '暂无可展示的文件'
        : 'No files available yet'
    );
    if (!hasFiles) {
      scannedButton.disabled = true;
    }
    scannedButton.addEventListener('click', () => {
      if (!Array.isArray(state.activeScan.files) || !state.activeScan.files.length) {
        return;
      }
      state.activeScan.showFileList = !state.activeScan.showFileList;
      renderApp();
    });
    scannedValueContainer.appendChild(scannedButton);
    metrics.appendChild(
      createElement('div', {
        className: 'scan-metric',
        children: [
          createElement('span', {
            className: 'scan-metric-label',
            text: overlayPack.scannedLabel || pack.monitor?.scannedColumn || 'Files scanned'
          }),
          scannedValueContainer
        ]
      })
    );
    panel.appendChild(metrics);
    if (hasFiles && state.activeScan.showFileList) {
      const fileListWrapper = createElement('div', { className: 'scan-file-list' });
      const filesTitle = overlayPack.filesTitle || 'Scanned files';
      fileListWrapper.appendChild(createElement('h4', { text: filesTitle }));
      const fileList = createElement('ul');
      state.activeScan.files.forEach((file) => {
        const label = file?.path || file?.name || '';
        fileList.appendChild(createElement('li', { text: label }));
      });
      fileListWrapper.appendChild(fileList);
      panel.appendChild(fileListWrapper);
    }
  }

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

function renderJobLogOverlay(pack) {
  if (!state.jobLogViewer) {
    return null;
  }
  const job = state.jobs.find((entry) => entry.id === state.jobLogViewer);
  if (!job) {
    state.jobLogViewer = null;
    return null;
  }
  const overlayPack = (pack.monitor && pack.monitor.logViewer) || {};
  const overlay = createElement('div', { className: 'modal-overlay job-log-overlay' });
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      closeJobLog();
    }
  });
  const panel = createElement('div', { className: 'modal-panel wizard scan-panel job-log-panel' });
  const jobName = job.label || getJobTypeLabel(job.type);
  const statusLabel = pack.monitor?.statuses?.[job.status] || job.status;
  const titleTemplate = overlayPack.title || 'Scan log · {job}';
  panel.appendChild(createElement('h3', { text: titleTemplate.replace('{job}', jobName) }));
  const subtitleTemplate = overlayPack.subtitle || '{status} · {progress}';
  panel.appendChild(
    createElement('p', {
      className: 'wizard-helper',
      text: subtitleTemplate.replace('{status}', statusLabel).replace('{progress}', `${job.progress}%`)
    })
  );

  if (Array.isArray(job.paths) && job.paths.length) {
    const pathGroup = createElement('div', { className: 'scan-paths' });
    const pathsTitle = overlayPack.pathsTitle || pack.scanOverlay?.pathsTitle || 'Paths';
    pathGroup.appendChild(createElement('span', { className: 'scan-paths-label', text: pathsTitle }));
    const pathList = createElement('ul');
    job.paths.forEach((pathValue) => {
      pathList.appendChild(createElement('li', { text: pathValue }));
    });
    pathGroup.appendChild(pathList);
    panel.appendChild(pathGroup);
  }

  if (job.type === 'scan') {
    const numberLocale = state.locale === 'zh' ? 'zh-CN' : 'en-US';
    const metrics = createElement('div', { className: 'scan-metrics' });
    metrics.appendChild(
      createElement('div', {
        className: 'scan-metric',
        children: [
          createElement('span', {
            className: 'scan-metric-label',
            text:
              overlayPack.discoveryLabel ||
              overlayPack.discoveryStats ||
              pack.monitor?.discoveryColumn ||
              'Discovered / Total'
          }),
          createElement('strong', {
            className: 'scan-metric-value',
            text: `${(job.discoveredFiles || 0).toLocaleString(numberLocale)} / ${(
              job.totalFiles || job.totalBookFiles || 0
            ).toLocaleString(numberLocale)}`
          })
        ]
      })
    );
    metrics.appendChild(
      createElement('div', {
        className: 'scan-metric',
        children: [
          createElement('span', {
            className: 'scan-metric-label',
            text: overlayPack.scannedLabel || pack.monitor?.scannedColumn || 'Files scanned'
          }),
          createElement('strong', {
            className: 'scan-metric-value',
            text: (job.scannedFiles || 0).toLocaleString(numberLocale)
          })
        ]
      })
    );
    panel.appendChild(metrics);
    if (Array.isArray(job.files) && job.files.length) {
      const fileListWrapper = createElement('div', { className: 'scan-file-list' });
      const filesTitle = overlayPack.filesTitle || pack.scanOverlay?.filesTitle || 'Scanned files';
      fileListWrapper.appendChild(createElement('h4', { text: filesTitle }));
      const fileList = createElement('ul');
      job.files.forEach((file) => {
        const label = file?.path || file?.name || '';
        fileList.appendChild(createElement('li', { text: label }));
      });
      fileListWrapper.appendChild(fileList);
      panel.appendChild(fileListWrapper);
    }
  }

  panel.appendChild(
    createElement('h4', { text: overlayPack.logTitle || pack.scanOverlay?.logTitle || 'Activity log' })
  );
  const logBox = createElement('div', { className: 'scan-log' });
  if (!Array.isArray(job.logs) || !job.logs.length) {
    const emptyText =
      overlayPack.empty ||
      overlayPack.logs?.empty ||
      pack.scanOverlay?.logs?.empty ||
      (state.locale === 'zh' ? '暂无日志记录' : 'No log entries yet.');
    logBox.appendChild(createElement('p', { className: 'wizard-helper', text: emptyText }));
  } else {
    const logList = createElement('ul');
    job.logs.forEach((entry) => {
      logList.appendChild(createElement('li', { text: entry }));
    });
    logBox.appendChild(logList);
  }
  panel.appendChild(logBox);

  const actions = createElement('div', { className: 'modal-actions' });
  const closeButton = createElement('button', { className: 'ghost-button', text: overlayPack.close || 'Close' });
  closeButton.type = 'button';
  closeButton.addEventListener('click', () => closeJobLog());
  actions.appendChild(closeButton);
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
  syncFullscreenClass();
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
  const metadataEditorOverlay = renderBookMetadataEditorOverlay(pack);
  if (metadataEditorOverlay) {
    root.appendChild(metadataEditorOverlay);
  }
  const metadataOverlay = renderMetadataOverlay(pack);
  if (metadataOverlay) {
    root.appendChild(metadataOverlay);
  }
  const jobLogOverlay = renderJobLogOverlay(pack);
  if (jobLogOverlay) {
    root.appendChild(jobLogOverlay);
  }
  const exportModal = renderExportModal(pack);
  if (exportModal) {
    root.appendChild(exportModal);
  }
  const floatingAssistant = renderFloatingAssistant(pack);
  if (floatingAssistant) {
    root.appendChild(floatingAssistant);
  }
  const toast = renderToast();
  if (toast) {
    root.appendChild(toast);
  }
  schedulePersist();
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    exitPreviewFullscreen();
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
  });
} else {
  initializeApp();
}
})();
