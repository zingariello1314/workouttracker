/**
 * Schéma IndexedDB dashboard (QuietQuestDashboard).
 *
 * @module services/dashboard/dashboardDbGateway
 */

export const DASHBOARD_DB_NAME = 'QuietQuestDashboard';
export const DASHBOARD_DB_VERSION = 2;

export const DASHBOARD_STORES = {
  QUESTS: 'quests',
  SPORT_SESSIONS: 'sportSessions',
  READING_SESSIONS: 'readingSessions',
  BOOKS: 'books',
  PATRIMONY: 'patrimony',
  SETTINGS: 'settings',
  MUSCLE_GROUPS: 'muscleGroups',
  PERFORMANCE_HISTORY: 'performanceHistory',
  ACHIEVEMENTS: 'achievements',
};

/**
 * @param {IDBVersionChangeEvent} event
 */
export function applyDashboardSchemaUpgrade(event) {
  const db = event.target.result;
  const S = DASHBOARD_STORES;

  if (!db.objectStoreNames.contains(S.QUESTS)) {
    const questStore = db.createObjectStore(S.QUESTS, { keyPath: 'id' });
    questStore.createIndex('date', 'date', { unique: false });
  }

  if (!db.objectStoreNames.contains(S.SPORT_SESSIONS)) {
    const sportStore = db.createObjectStore(S.SPORT_SESSIONS, { keyPath: 'id' });
    sportStore.createIndex('date', 'date', { unique: false });
  }

  if (!db.objectStoreNames.contains(S.READING_SESSIONS)) {
    const readingStore = db.createObjectStore(S.READING_SESSIONS, { keyPath: 'id' });
    readingStore.createIndex('date', 'date', { unique: false });
    readingStore.createIndex('bookId', 'bookId', { unique: false });
  }

  if (!db.objectStoreNames.contains(S.BOOKS)) {
    const bookStore = db.createObjectStore(S.BOOKS, { keyPath: 'id' });
    bookStore.createIndex('active', 'active', { unique: false });
  }

  if (!db.objectStoreNames.contains(S.PATRIMONY)) {
    db.createObjectStore(S.PATRIMONY, { keyPath: 'id' });
  }

  if (!db.objectStoreNames.contains(S.SETTINGS)) {
    db.createObjectStore(S.SETTINGS, { keyPath: 'key' });
  }

  if (!db.objectStoreNames.contains(S.MUSCLE_GROUPS)) {
    const muscleStore = db.createObjectStore(S.MUSCLE_GROUPS, { keyPath: 'id' });
    muscleStore.createIndex('name', 'name', { unique: false });
    muscleStore.createIndex('createdAt', 'createdAt', { unique: false });
  }

  if (!db.objectStoreNames.contains(S.PERFORMANCE_HISTORY)) {
    const perfStore = db.createObjectStore(S.PERFORMANCE_HISTORY, { keyPath: 'id' });
    perfStore.createIndex('date', 'date', { unique: true });
    perfStore.createIndex('createdAt', 'createdAt', { unique: false });
  }

  if (!db.objectStoreNames.contains(S.ACHIEVEMENTS)) {
    const achieveStore = db.createObjectStore(S.ACHIEVEMENTS, { keyPath: 'id' });
    achieveStore.createIndex('date', 'date', { unique: false });
    achieveStore.createIndex('type', 'type', { unique: false });
    achieveStore.createIndex('completed', 'completed', { unique: false });
  }
}
