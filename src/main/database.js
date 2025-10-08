const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const { app } = require('electron');

const seeds = require('./seed-data');

let dbInstance = null;

function getDatabasePath() {
  return path.join(app.getPath('userData'), 'local-bookshelf.db');
}

function getDatabase() {
  if (dbInstance) {
    return dbInstance;
  }
  const databasePath = getDatabasePath();
  dbInstance = new Database(databasePath);
  dbInstance.pragma('journal_mode = WAL');
  return dbInstance;
}

function ensureTables(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS translations (
      locale TEXT PRIMARY KEY,
      payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS app_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

function populateStaticData(database) {
  const insertTranslation = database.prepare(
    'INSERT OR REPLACE INTO translations (locale, payload) VALUES (?, ?)' 
  );
  Object.entries(seeds.translations).forEach(([locale, payload]) => {
    insertTranslation.run(locale, JSON.stringify(payload));
  });

  const metaSeeds = {
    supportedCoverTypes: seeds.supportedCoverTypes,
    classificationCatalog: seeds.classificationCatalog,
    formatCatalog: seeds.formatCatalog,
    statEmojiMap: seeds.statEmojiMap,
    collectionEmojiMap: seeds.collectionEmojiMap,
    classificationEmojiMap: seeds.classificationEmojiMap,
    enrichmentLabels: seeds.enrichmentLabels,
    classificationOptions: seeds.classificationOptions,
    formatOptions: seeds.formatOptions,
    directoryOptions: seeds.directoryOptions,
    initialCollectionMetadata: seeds.initialCollectionMetadata,
    initialCollectionBooks: seeds.initialCollectionBooks,
    initialSettings: seeds.initialSettings,
    defaultWizardData: seeds.defaultWizardData
  };

  const insertMeta = database.prepare('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)');
  Object.entries(metaSeeds).forEach(([key, value]) => {
    insertMeta.run(key, JSON.stringify(value));
  });
}

function initializeDatabase() {
  const database = getDatabase();
  ensureTables(database);
  database.transaction(() => {
    populateStaticData(database);
  })();
}

function loadState() {
  const database = getDatabase();
  const row = database.prepare('SELECT payload FROM app_state WHERE id = 1').get();
  if (!row || !row.payload) {
    return null;
  }
  try {
    return JSON.parse(row.payload);
  } catch (error) {
    console.error('Failed to parse stored state', error);
    return null;
  }
}

function saveState(nextState) {
  if (!nextState || typeof nextState !== 'object') {
    return false;
  }
  const database = getDatabase();
  const payload = JSON.stringify(nextState);
  const timestamp = new Date().toISOString();
  database
    .prepare(
      `INSERT INTO app_state (id, payload, updated_at)
       VALUES (1, ?, ?)
       ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at`
    )
    .run(payload, timestamp);
  return true;
}

function getBootstrapData() {
  const database = getDatabase();
  const translationRows = database.prepare('SELECT locale, payload FROM translations').all();
  const translations = translationRows.reduce((acc, row) => {
    try {
      acc[row.locale] = JSON.parse(row.payload);
    } catch (error) {
      console.error('Failed to parse translation payload', row.locale, error);
    }
    return acc;
  }, {});

  const metaRows = database.prepare('SELECT key, value FROM meta').all();
  const meta = metaRows.reduce((acc, row) => {
    try {
      acc[row.key] = JSON.parse(row.value);
    } catch (error) {
      console.error('Failed to parse meta payload', row.key, error);
    }
    return acc;
  }, {});

  return {
    translations,
    ...meta
  };
}

function resetDatabase() {
  const database = getDatabase();
  database.transaction(() => {
    database.exec('DELETE FROM app_state; DELETE FROM meta; DELETE FROM translations;');
    populateStaticData(database);
  })();
}

async function backupDatabase(targetPath) {
  if (!targetPath) {
    throw new Error('A target path is required for backup');
  }
  const database = getDatabase();
  database.pragma('wal_checkpoint(FULL)');
  database.pragma('wal_checkpoint(TRUNCATE)');
  await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.promises.copyFile(getDatabasePath(), targetPath);
}

module.exports = {
  initializeDatabase,
  loadState,
  saveState,
  getBootstrapData,
  resetDatabase,
  backupDatabase,
  getDatabasePath
};
