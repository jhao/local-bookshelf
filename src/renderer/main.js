import { translations } from './data.js';

const root = document.getElementById('root');

const supportedCoverTypes = ['image/png', 'image/jpeg', 'image/webp'];

const classificationCatalog = {
  'climate.adaptation': { en: 'Climate Adaptation', zh: '气候适应' },
  'climate.policy': { en: 'Climate Policy', zh: '气候政策' },
  'climate.science': { en: 'Earth System Science', zh: '地球系统科学' },
  'climate.energy': { en: 'Energy Transition', zh: '能源转型' },
  'design.systems': { en: 'Design Systems', zh: '设计系统' },
  'design.process': { en: 'Product Process', zh: '产品流程' },
  'design.accessibility': { en: 'Accessibility', zh: '无障碍' },
  'literature.fiction': { en: 'Modern Fiction', zh: '现代小说' },
  'literature.poetry': { en: 'Poetry', zh: '诗歌' },
  'literature.essay': { en: 'Essay & Critique', zh: '随笔与评论' }
};

const formatCatalog = {
  pdf: { en: 'PDF', zh: 'PDF' },
  epub: { en: 'EPUB', zh: 'EPUB' },
  mobi: { en: 'MOBI', zh: 'MOBI' },
  docx: { en: 'DOCX', zh: 'DOCX' },
  txt: { en: 'Plain Text', zh: '纯文本' },
  azw3: { en: 'AZW3', zh: 'AZW3' }
};

const statEmojiMap = {
  collections: '🗂️',
  books: '📚',
  enrichment: '✨',
  reading: '🎧'
};

const collectionEmojiMap = {
  'new-collection': '🌟',
  climate: '🌤️',
  design: '🎨',
  literature: '📖'
};

const classificationEmojiMap = {
  'climate.adaptation': '🏙️',
  'climate.policy': '📜',
  'climate.science': '🌊',
  'climate.energy': '🔋',
  'design.systems': '🧩',
  'design.process': '🛠️',
  'design.accessibility': '♿',
  'literature.fiction': '🕯️',
  'literature.poetry': '🎴',
  'literature.essay': '📝'
};

const enrichmentLabels = {
  complete: { en: 'Complete', zh: '已完成' },
  inprogress: { en: 'In Progress', zh: '进行中' },
  queued: { en: 'Queued', zh: '排队中' },
  failed: { en: 'Failed', zh: '失败' }
};

const classificationOptions = [
  'climate.adaptation',
  'climate.policy',
  'climate.science',
  'climate.energy',
  'design.systems',
  'design.process',
  'design.accessibility',
  'literature.fiction',
  'literature.poetry',
  'literature.essay'
];

const formatOptions = ['pdf', 'epub', 'mobi', 'docx', 'txt', 'azw3'];

const directoryOptions = [
  {
    id: 'handbooks',
    path: '/Volumes/Research/Climate-Handbooks',
    helper: 'Shared folder mounted from NAS',
    lastIndexed: '2024-05-22T08:30:00Z'
  },
  {
    id: 'ipcc',
    path: '/Users/alex/Documents/IPCC-AR6',
    helper: 'Downloaded assessment reports',
    lastIndexed: '2024-05-20T10:02:00Z'
  },
  {
    id: 'design-system',
    path: 'D:/Libraries/Design-Systems',
    helper: 'Sketches, PDFs, and pattern audits',
    lastIndexed: '2024-04-28T14:10:00Z'
  },
  {
    id: 'literature',
    path: '/Volumes/Archive/Modern-Literature',
    helper: 'Digitised literary anthologies',
    lastIndexed: '2024-05-12T21:40:00Z'
  }
];

const initialCollectionMetadata = {
  climate: {
    directories: ['/Volumes/Research/Climate-Handbooks', '/Users/alex/Documents/IPCC-AR6'],
    lastScan: '2024-06-02T10:30:00Z',
    pagination: 20,
    aiEnabled: true
  },
  design: {
    directories: ['D:/Libraries/Design-Systems', 'D:/Libraries/Accessibility-Guides'],
    lastScan: '2024-05-28T18:20:00Z',
    pagination: 12,
    aiEnabled: true
  },
  literature: {
    directories: ['/Volumes/Archive/Modern-Literature'],
    lastScan: '2024-06-04T09:05:00Z',
    pagination: 50,
    aiEnabled: true
  }
};

const initialCollectionBooks = {
  climate: [
    {
      id: 'climate-1',
      title: 'Resilient Cities 2040',
      author: 'Mara Liang',
      classification: 'climate.adaptation',
      publicationYear: 2024,
      format: 'pdf',
      sizeMB: 18.4,
      dateAdded: '2024-05-18',
      enrichment: 'complete',
      pages: 328,
      progress: { currentPage: 215 },
      isbn: '978-0-12-864302-1',
      summary: 'Action playbook for municipal adaptation projects across coastal regions.',
      preview:
        'Chapter 7 synthesises community-led design sprints with parametric flood models, outlining a replicable strategy for mid-sized cities.',
      bookmarks: [64, 214],
      tts: true,
      exportable: true
    },
    {
      id: 'climate-2',
      title: 'Policy Pathways for Net-Zero Provinces',
      author: 'Dr. Felix Noor',
      classification: 'climate.policy',
      publicationYear: 2022,
      format: 'epub',
      sizeMB: 6.2,
      dateAdded: '2024-04-11',
      enrichment: 'inprogress',
      pages: 412,
      progress: { currentPage: 87 },
      isbn: '978-1-4028-9462-9',
      summary: 'Comparative policy toolkit aligning provincial statutes with national carbon commitments.',
      preview:
        'Section 3.2 analyses differentiated responsibilities across heavy industry clusters with annotated case law.',
      bookmarks: [23, 198],
      tts: true,
      exportable: true
    },
    {
      id: 'climate-3',
      title: 'Ocean Heat Budget Explorer',
      author: 'IPCC Working Group I',
      classification: 'climate.science',
      publicationYear: 2023,
      format: 'pdf',
      sizeMB: 52.7,
      dateAdded: '2024-03-07',
      enrichment: 'complete',
      pages: 512,
      progress: { currentPage: 132 },
      isbn: '978-0-321-87777-4',
      summary: 'High-resolution datasets and visualisations for ocean heat content analysis.',
      preview:
        'Appendix D introduces a methodology for downscaling CMIP6 outputs with GPU-accelerated interpolation.',
      bookmarks: [112, 256, 401],
      tts: false,
      exportable: true
    },
    {
      id: 'climate-4',
      title: 'Distributed Energy Retrofit Manual',
      author: 'Helena Ortiz',
      classification: 'climate.energy',
      publicationYear: 2021,
      format: 'docx',
      sizeMB: 9.1,
      dateAdded: '2024-02-19',
      enrichment: 'queued',
      pages: 226,
      progress: { currentPage: 34 },
      isbn: '978-0-452-29078-6',
      summary: 'Practical guidance for retrofitting mid-rise buildings with hybrid solar microgrids.',
      preview:
        'Workbook templates cover financial modelling, procurement sequencing, and occupant engagement scripts.',
      bookmarks: [48],
      tts: true,
      exportable: true
    }
  ],
  design: [
    {
      id: 'design-1',
      title: 'Multi-Platform Design Tokens',
      author: 'Lina Osei',
      classification: 'design.systems',
      publicationYear: 2023,
      format: 'pdf',
      sizeMB: 12.2,
      dateAdded: '2024-05-01',
      enrichment: 'complete',
      pages: 280,
      progress: { currentPage: 144 },
      isbn: '978-0-07-352343-1',
      summary: 'Unified token taxonomy bridging web, desktop, and native mobile design systems.',
      preview:
        'The alignment matrix maps each decision token to platform accessibility requirements with traceable histories.',
      bookmarks: [56, 233],
      tts: true,
      exportable: true
    },
    {
      id: 'design-2',
      title: 'Inclusive Motion Guidelines',
      author: 'Yuko Nishimura',
      classification: 'design.accessibility',
      publicationYear: 2020,
      format: 'pdf',
      sizeMB: 4.8,
      dateAdded: '2024-04-16',
      enrichment: 'complete',
      pages: 164,
      progress: { currentPage: 98 },
      isbn: '978-0-12-549080-2',
      summary: 'Framework for designing motion systems that respect vestibular comfort and localisation.',
      preview:
        'Case studies demonstrate velocity envelopes and offer CSS/SwiftUI code recipes to ship responsibly.',
      bookmarks: [34, 88, 129],
      tts: true,
      exportable: true
    },
    {
      id: 'design-3',
      title: 'Operational Playbook for DesignOps',
      author: 'Carlos Mendes',
      classification: 'design.process',
      publicationYear: 2021,
      format: 'epub',
      sizeMB: 5.6,
      dateAdded: '2024-03-08',
      enrichment: 'inprogress',
      pages: 312,
      progress: { currentPage: 201 },
      isbn: '978-0-7637-2026-6',
      summary: 'Roadmap for scaling design systems governance with measurable service levels.',
      preview:
        'The service blueprint highlights intake triage, triads, and backlog analytics for distributed teams.',
      bookmarks: [76, 240],
      tts: true,
      exportable: true
    },
    {
      id: 'design-4',
      title: 'Accessibility Compliance Field Notes',
      author: 'Priya Venkataraman',
      classification: 'design.accessibility',
      publicationYear: 2019,
      format: 'docx',
      sizeMB: 3.4,
      dateAdded: '2024-02-14',
      enrichment: 'complete',
      pages: 198,
      progress: { currentPage: 45 },
      isbn: '978-0-13-466535-4',
      summary: 'Annotated checklist mapping WCAG 2.2 success criteria to practical inspection routines.',
      preview:
        'Field observations catalogue recurring defects and remediation scripts used by enterprise auditors.',
      bookmarks: [18, 172],
      tts: true,
      exportable: true
    }
  ],
  literature: [
    {
      id: 'literature-1',
      title: 'Midnight Courtyard',
      author: 'Han Yuerong',
      classification: 'literature.fiction',
      publicationYear: 2018,
      format: 'epub',
      sizeMB: 2.3,
      dateAdded: '2024-05-30',
      enrichment: 'complete',
      pages: 296,
      progress: { currentPage: 186 },
      isbn: '978-7-5321-6783-4',
      summary: 'Interwoven narratives exploring urban solitude and resilience in Shanghai.',
      preview:
        'Chapter 12 juxtaposes architectural memories with present-day dialogues, inviting reflective annotation.',
      bookmarks: [45, 132, 205],
      tts: true,
      exportable: true
    },
    {
      id: 'literature-2',
      title: 'Letters to the South Wind',
      author: 'Qiu Ansheng',
      classification: 'literature.essay',
      publicationYear: 2020,
      format: 'pdf',
      sizeMB: 7.9,
      dateAdded: '2024-04-22',
      enrichment: 'complete',
      pages: 224,
      progress: { currentPage: 44 },
      isbn: '978-7-5366-9860-2',
      summary: 'Literary reportage blending climate narratives with personal field diaries.',
      preview:
        'Essays weave metaphors from typhoon tracking data and oral histories collected along the coast.',
      bookmarks: [38, 110],
      tts: true,
      exportable: true
    },
    {
      id: 'literature-3',
      title: 'Echoes on Lushan Trail',
      author: 'Zhang Mingwei',
      classification: 'literature.poetry',
      publicationYear: 2015,
      format: 'pdf',
      sizeMB: 3.1,
      dateAdded: '2024-03-19',
      enrichment: 'inprogress',
      pages: 168,
      progress: { currentPage: 98 },
      isbn: '978-7-5302-9342-7',
      summary: 'Bilingual poetry sequence inspired by misty mornings in Jiangxi.',
      preview:
        'Bamboo stanza forms echo classical cadences while layering contemporary environmental imagery.',
      bookmarks: [12, 97, 146],
      tts: true,
      exportable: true
    },
    {
      id: 'literature-4',
      title: 'Oral Histories of the Pearl Delta',
      author: 'Luo Jia',
      classification: 'literature.essay',
      publicationYear: 2017,
      format: 'txt',
      sizeMB: 1.1,
      dateAdded: '2024-02-02',
      enrichment: 'complete',
      pages: 342,
      progress: { currentPage: 276 },
      isbn: '978-7-108-06618-2',
      summary: 'First-person recollections documenting delta transformations across generations.',
      preview:
        'Transcripts reveal dialect variations and migratory patterns, with inline translator annotations.',
      bookmarks: [64, 241, 322],
      tts: true,
      exportable: true
    }
  ]
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

const initialSettings = {
  metadataSources: 'Douban, OpenLibrary',
  apiKey: '',
  rateLimit: 60,
  proxy: '',
  cachePath: '~/Library/Application Support/LocalBookshelf/covers',
  previewPath: '~/Library/Application Support/LocalBookshelf/previews',
  embeddingsPath: '~/Library/Application Support/LocalBookshelf/embeddings',
  paginationDefault: 20,
  theme: 'system',
  analytics: true,
  offline: false
};

let jobCounter = 0;

const defaultWizardData = {
  mode: 'create',
  targetId: null,
  paths: [],
  name: '',
  description: '',
  coverName: '',
  coverFile: null
};

const state = {
  locale: 'en',
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
  activeScan: null
};

const persistence = {
  hydrating: true,
  hydrated: false,
  pending: null,
  timeout: null,
  lastSerialized: null
};

function serializeState() {
  const preferences = {};
  Object.entries(state.preferences || {}).forEach(([collectionId, preference]) => {
    preferences[collectionId] = {
      ...preference,
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
        selected: new Set(preference.selected || [])
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
  return translations[state.locale];
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
  const basePack = translations[state.locale].collections.find((item) => item.id === id);
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
      classification: 'all',
      format: 'all',
      yearFrom: 2000,
      yearTo: new Date().getFullYear(),
      selected: new Set(),
      sort: { column: 'title', direction: 'asc' }
    };
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

  if (state.activePage === 'collection' && state.selectedCollectionId) {
    const display = getCollectionDisplay(state.selectedCollectionId);
    items.push({
      id: 'collection',
      label: `${getCollectionEmoji(state.selectedCollectionId)} ${display?.title || ''}`
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
      if (item.id === 'collection' && !state.selectedCollectionId) {
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
  pack.stats.forEach((stat) => {
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
  const exportLabels = [pack.collectionDetail.cardActions.export, 'Export PDF Set', '批量导出 PDF'];
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
  if (exportLabels.includes(normalized)) {
    setSelectedCollection(collectionId);
    startExport(getBooks(collectionId).map((book) => book.id));
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
  pack.roadmapItems.forEach((item) => {
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
  const experienceGrid = createElement('div', { className: 'experience-grid' });
  const preview = renderPreviewPanel(pack);
  if (preview) {
    experienceGrid.appendChild(preview);
  }
  const ai = renderAiPanel(pack);
  if (ai) {
    experienceGrid.appendChild(ai);
  }
  if (experienceGrid.childElementCount) {
    page.appendChild(experienceGrid);
  }
  return page;
}
function renderFilters(collectionId, preferences, pack) {
  const filters = createElement('div', { className: 'filters-panel' });
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

  const classificationSelect = createElement('select', { className: 'filter-select' });
  const allOption = createElement('option', {
    text: state.locale === 'zh' ? '全部分类' : 'All classifications'
  });
  allOption.value = 'all';
  classificationSelect.appendChild(allOption);
  classificationOptions.forEach((option) => {
    const node = createElement('option', { text: getClassificationLabel(option) });
    node.value = option;
    if (preferences.classification === option) {
      node.selected = true;
    }
    classificationSelect.appendChild(node);
  });
  classificationSelect.value = preferences.classification;
  classificationSelect.addEventListener('change', (event) => {
    preferences.classification = event.target.value;
    preferences.page = 1;
    renderApp();
  });

  const formatSelect = createElement('select', { className: 'filter-select' });
  const allFormat = createElement('option', {
    text: state.locale === 'zh' ? '全部格式' : 'All formats'
  });
  allFormat.value = 'all';
  formatSelect.appendChild(allFormat);
  formatOptions.forEach((option) => {
    const node = createElement('option', { text: getFormatLabel(option) });
    node.value = option;
    if (preferences.format === option) {
      node.selected = true;
    }
    formatSelect.appendChild(node);
  });
  formatSelect.value = preferences.format;
  formatSelect.addEventListener('change', (event) => {
    preferences.format = event.target.value;
    preferences.page = 1;
    renderApp();
  });

  const yearContainer = createElement('div', { className: 'year-filter' });
  const fromInput = createElement('input', {
    attributes: { type: 'number', min: 1900, max: new Date().getFullYear() }
  });
  fromInput.value = preferences.yearFrom;
  fromInput.addEventListener('change', (event) => {
    preferences.yearFrom = Number(event.target.value) || preferences.yearFrom;
    preferences.page = 1;
    renderApp();
  });
  const toInput = createElement('input', {
    attributes: { type: 'number', min: 1900, max: new Date().getFullYear() }
  });
  toInput.value = preferences.yearTo;
  toInput.addEventListener('change', (event) => {
    preferences.yearTo = Number(event.target.value) || preferences.yearTo;
    preferences.page = 1;
    renderApp();
  });
  yearContainer.appendChild(createElement('label', { text: pack.collectionDetail.filters.publication }));
  yearContainer.appendChild(
    createElement('div', {
      className: 'year-inputs',
      children: [
        createElement('span', { text: pack.collectionDetail.filters.from }),
        fromInput,
        createElement('span', { text: pack.collectionDetail.filters.to }),
        toInput
      ]
    })
  );

  const resetButton = createElement('button', {
    className: 'ghost-button',
    text: pack.collectionDetail.filters.reset
  });
  resetButton.type = 'button';
  resetButton.addEventListener('click', () => {
    preferences.search = '';
    preferences.classification = 'all';
    preferences.format = 'all';
    preferences.yearFrom = 2000;
    preferences.yearTo = new Date().getFullYear();
    preferences.page = 1;
    renderApp();
  });

  filters.appendChild(searchInput);
  filters.appendChild(
    createElement('div', {
      className: 'filter-row',
      children: [
        createElement('label', { text: pack.collectionDetail.filters.classification }),
        classificationSelect,
        createElement('label', { text: pack.collectionDetail.filters.format }),
        formatSelect,
        yearContainer,
        resetButton
      ]
    })
  );
  return filters;
}

function applyBookFilters(books, preferences) {
  return books
    .filter((book) => {
      if (preferences.classification !== 'all' && book.classification !== preferences.classification) {
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
    exportButton.addEventListener('click', () => startExport([book.id]));
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
    { key: 'enrichment', label: pack.collectionDetail.tableHeaders[7] }
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

    const values = [
      book.title,
      book.author,
      getClassificationLabel(book.classification),
      book.publicationYear,
      getFormatLabel(book.format),
      formatSize(book.sizeMB),
      formatDate(book.dateAdded),
      getEnrichmentLabel(book.enrichment)
    ];
    values.forEach((value) => {
      const cell = createElement('td', { text: value });
      row.appendChild(cell);
    });
    row.addEventListener('click', (event) => {
      if (event.target.tagName.toLowerCase() === 'input') {
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
  const refresh = createElement('button', { text: pack.collectionDetail.bulkActions.refreshMetadata });
  refresh.type = 'button';
  refresh.addEventListener('click', () => {
    const ids = Array.from(preferences.selected);
    if (!ids.length) {
      showToast(state.locale === 'zh' ? '请选择至少一本书' : 'Select at least one book');
      return;
    }
    const title = getCollectionDisplay(state.selectedCollectionId)?.title || '';
    createJob({
      type: 'enrichment',
      collectionId: state.selectedCollectionId,
      label: `${title} · Metadata refresh`,
      onComplete: () => showToast(state.locale === 'zh' ? '元数据已刷新' : 'Metadata refreshed')
    });
  });
  const exportButton = createElement('button', { text: pack.collectionDetail.bulkActions.export });
  exportButton.type = 'button';
  exportButton.addEventListener('click', () => {
    const ids = Array.from(preferences.selected);
    if (!ids.length) {
      showToast(state.locale === 'zh' ? '请选择至少一本书' : 'Select at least one book');
      return;
    }
    startExport(ids);
  });
  container.appendChild(selectAll);
  container.appendChild(clear);
  container.appendChild(refresh);
  container.appendChild(exportButton);
  return container;
}
function startExport(bookIds) {
  if (!bookIds.length) {
    return;
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
        collectionId: state.selectedCollectionId,
        label: `${bookIds.length} book(s)`,
        onComplete: () => {}
      });
      showToast(state.locale === 'zh' ? '导出完成' : 'Export completed');
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

  const section = createElement('section', { className: 'detail-section' });
  const placeholderText = state.locale === 'zh' ? '封面预留' : 'Cover placeholder';
  section.appendChild(createElement('div', { className: 'image-placeholder tall', text: placeholderText }));
  section.appendChild(
    createElement('h2', {
      text: `${getCollectionEmoji(collectionId)} ${pack.collectionDetail.titlePrefix}: ${display?.title || ''}`
    })
  );
  section.appendChild(
    createElement('p', {
      className: 'detail-subtitle',
      text: `${pack.collectionDetail.subtitle} · ${state.locale === 'zh' ? '最近扫描' : 'Last scan'}: ${formatDate(
        meta.lastScan
      )}`
    })
  );

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
        showToast(state.locale === 'zh' ? '扫描已完成' : 'Scan completed');
        renderApp();
      }
    });
  });
  const refresh = createElement('button', { className: 'ghost-button', text: pack.collectionDetail.refresh });
  refresh.type = 'button';
  refresh.addEventListener('click', () => {
    createJob({
      type: 'enrichment',
      collectionId,
      label: `${display?.title || ''} · Metadata`,
      onComplete: () => showToast(state.locale === 'zh' ? '元数据已刷新' : 'Metadata refreshed')
    });
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
  section.appendChild(actionRow);

  section.appendChild(renderFilters(collectionId, preferences, pack));

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

function renderPreviewPanel(pack) {
  const collectionId = state.selectedCollectionId;
  if (!collectionId) {
    return null;
  }
  const books = getBooks(collectionId);
  if (!books.length) {
    return null;
  }
  const book = books.find((item) => item.id === state.selectedBookId) || books[0];
  const previewState = getPreviewState(book.id, book.progress?.currentPage || 1);
  const panel = createElement('section', { className: 'preview-panel' });
  panel.appendChild(createElement('h3', { text: pack.previewPanel.title }));
  panel.appendChild(
    createElement('p', {
      className: 'preview-meta',
      text: `${book.title} · ${book.author} · ${getFormatLabel(book.format)} · ${formatSize(book.sizeMB)}`
    })
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
    previewState.zoom = Math.min(2, previewState.zoom + 0.1);
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

  panel.appendChild(renderTtsPanel(pack, book));
  panel.appendChild(renderExportPanel(pack, [book.id]));
  return panel;
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

function renderExportPanel(pack, bookIds) {
  const container = createElement('div', { className: 'export-panel' });
  container.appendChild(createElement('h4', { text: pack.exportPanel.title }));
  const destinationInput = createElement('input', {
    attributes: { type: 'text', value: state.exportState.destination }
  });
  destinationInput.addEventListener('change', (event) => {
    state.exportState.destination = event.target.value;
  });
  const metadataToggle = createElement('label', { className: 'highlight-toggle' });
  const metadataInput = createElement('input', { attributes: { type: 'checkbox' } });
  metadataInput.checked = state.exportState.includeMetadata;
  metadataInput.addEventListener('change', (event) => {
    state.exportState.includeMetadata = event.target.checked;
  });
  metadataToggle.appendChild(metadataInput);
  metadataToggle.appendChild(createElement('span', { text: pack.exportPanel.metadataPage }));

  const startButton = createElement('button', { text: pack.exportPanel.start });
  startButton.type = 'button';
  startButton.addEventListener('click', () => startExport(bookIds));

  const progress = createElement('div', { className: 'progress-track' });
  const fill = createElement('div', {
    className: 'progress-fill',
    attributes: { style: `width: ${state.exportState.progress}%` }
  });
  progress.appendChild(fill);

  const statusText =
    state.exportState.status === 'completed'
      ? pack.exportPanel.success
      : state.exportState.status === 'running'
        ? `${pack.exportPanel.progressLabel}: ${state.exportState.progress}%`
        : '';

  container.appendChild(createElement('label', { text: pack.exportPanel.destination }));
  container.appendChild(destinationInput);
  container.appendChild(metadataToggle);
  container.appendChild(startButton);
  container.appendChild(progress);
  if (statusText) {
    container.appendChild(createElement('p', { className: 'export-status', text: statusText }));
  }
  return container;
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
    coverInput.addEventListener('change', (event) => {
      const file = event.target.files?.[0];
      if (file) {
        state.wizardData.coverFile = file;
        state.wizardData.coverName = file.name;
      }
    });
    coverField.appendChild(createElement('label', { text: pack.wizard.coverLabel }));
    coverField.appendChild(coverInput);
    panel.appendChild(coverField);
    if (state.wizardData.coverName) {
      panel.appendChild(createElement('span', { className: 'file-name-tag', text: state.wizardData.coverName }));
    } else {
      panel.appendChild(createElement('p', { className: 'wizard-helper', text: pack.wizard.dropHint }));
    }
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
  const toast = renderToast();
  if (toast) {
    root.appendChild(toast);
  }
  schedulePersist();
}

document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});
