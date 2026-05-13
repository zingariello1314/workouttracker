/**
 * Journal Code / GitHub — persistance longue durée (IndexedDB), par utilisateur Momentum.
 * Migration automatique depuis l’ancien localStorage `momentum.code.journal.v1.*`.
 */

import {
  CODE_JOURNAL_DB_NAME as DB_NAME,
  CODE_JOURNAL_DB_VERSION as DB_VERSION,
  STORE_CODE_JOURNAL_ENTRIES,
  STORE_CODE_META,
  applyCodeJournalSchemaUpgrade,
} from './codeJournalDbGateway.js';

const LEGACY_LS_PREFIX = 'momentum.code.journal.v1.';

/** XP Code ajoutée à chaque nouvel enregistrement dans le journal (hors simple édition). */
export const JOURNAL_XP_PER_SAVE = 250;

const journalXpMetaKey = (userId) => `${userId || 'main'}:journalXpBonus`;

function legacyStorageKey(userId) {
  return `${LEGACY_LS_PREFIX}${userId || 'anon'}`;
}

export function openCodeDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      applyCodeJournalSchemaUpgrade(e);
    };
  });
}

async function migrateFromLocalStorage(userId) {
  if (typeof localStorage === 'undefined') return;
  const key = legacyStorageKey(userId);
  const raw = localStorage.getItem(key);
  if (!raw) return;
  let list = [];
  try {
    const p = JSON.parse(raw);
    list = Array.isArray(p) ? p : [];
  } catch {
    return;
  }
  if (!list.length) {
    localStorage.removeItem(key);
    return;
  }
  const db = await openCodeDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CODE_JOURNAL_ENTRIES, 'readwrite');
    const store = tx.objectStore(STORE_CODE_JOURNAL_ENTRIES);
    for (const row of list) {
      if (!row?.id) continue;
      store.put({ ...row, userId: row.userId || userId });
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  localStorage.removeItem(key);
}

/**
 * À appeler une fois au chargement du journal pour un userId donné.
 */
export async function initCodeJournalForUser(userId) {
  await migrateFromLocalStorage(userId);
}

export async function loadCodeJournalEntriesAsync(userId) {
  await initCodeJournalForUser(userId);
  const db = await openCodeDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CODE_JOURNAL_ENTRIES, 'readonly');
    const idx = tx.objectStore(STORE_CODE_JOURNAL_ENTRIES).index('byUser');
    const req = idx.getAll(userId);
    req.onsuccess = () => {
      const rows = req.result || [];
      rows.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
      resolve(rows);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function loadGithubTrophyUnlocks(userId) {
  const db = await openCodeDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CODE_META, 'readonly');
    const req = tx.objectStore(STORE_CODE_META).get(`${userId}:githubTrophies`);
    req.onsuccess = () => resolve(req.result?.unlocked || {});
    req.onerror = () => reject(req.error);
  });
}

export async function saveGithubTrophyUnlocks(userId, unlocked) {
  const db = await openCodeDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CODE_META, 'readwrite');
    tx.objectStore(STORE_CODE_META).put({
      key: `${userId}:githubTrophies`,
      unlocked,
      updatedAt: new Date().toISOString(),
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function appendCodeJournalEntryAsync(userId, entry) {
  await initCodeJournalForUser(userId);
  const db = await openCodeDB();
  const id = entry.id || `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  const row = {
    ...entry,
    id,
    userId,
    createdAt: entry.createdAt || new Date().toISOString(),
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CODE_JOURNAL_ENTRIES, 'readwrite');
    tx.objectStore(STORE_CODE_JOURNAL_ENTRIES).put(row);
    tx.oncomplete = () => resolve(id);
    tx.onerror = () => reject(tx.error);
  });
}

export async function updateCodeJournalEntryAsync(userId, entry) {
  if (!entry?.id) throw new Error('updateCodeJournalEntryAsync: id manquant');
  await initCodeJournalForUser(userId);
  const db = await openCodeDB();
  const row = {
    ...entry,
    id: entry.id,
    userId,
    updatedAt: new Date().toISOString(),
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CODE_JOURNAL_ENTRIES, 'readwrite');
    tx.objectStore(STORE_CODE_JOURNAL_ENTRIES).put(row);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteCodeJournalEntryAsync(userId, id) {
  await initCodeJournalForUser(userId);
  const db = await openCodeDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CODE_JOURNAL_ENTRIES, 'readwrite');
    tx.objectStore(STORE_CODE_JOURNAL_ENTRIES).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadJournalXpBonusTotal(userId) {
  const db = await openCodeDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CODE_META, 'readonly');
    const req = tx.objectStore(STORE_CODE_META).get(journalXpMetaKey(userId));
    req.onsuccess = () => resolve(Number(req.result?.total) || 0);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Ajoute de l’XP « journal » persistée (IndexedDB) et notifie l’UI (barre Code / globale).
 * @param {string} userId
 * @param {number} [amount]
 * @returns {Promise<number>} nouveau total bonus
 */
export async function addJournalXpBonus(userId, amount = JOURNAL_XP_PER_SAVE) {
  const prev = await loadJournalXpBonusTotal(userId);
  const next = prev + (Number(amount) || 0);
  const db = await openCodeDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CODE_META, 'readwrite');
    tx.objectStore(STORE_CODE_META).put({
      key: journalXpMetaKey(userId),
      total: next,
      updatedAt: new Date().toISOString(),
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('momentum-code-journal-xp', { detail: { userId } }));
  }
  return next;
}

const githubTrophyXpStateKey = (userId) => `${userId || 'main'}:githubTrophyXpState`;

export async function loadGithubTrophyXpState(userId) {
  const db = await openCodeDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CODE_META, 'readonly');
    const req = tx.objectStore(STORE_CODE_META).get(githubTrophyXpStateKey(userId));
    req.onsuccess = () => {
      const r = req.result || {};
      const granted = r.granted && typeof r.granted === 'object' ? { ...r.granted } : {};
      resolve({ total: Number(r.total) || 0, granted });
    };
    req.onerror = () => reject(req.error);
  });
}

export async function loadGithubTrophyXpTotal(userId) {
  const s = await loadGithubTrophyXpState(userId);
  return s.total;
}

/**
 * Attribue l’XP d’un trophée une seule fois (idempotent par trophyId).
 * @returns {Promise<number>} total XP trophées après l’opération
 */
export async function grantGithubTrophyXpOnce(userId, trophyId, xpAmount) {
  const key = githubTrophyXpStateKey(userId);
  const amt = Math.round(Number(xpAmount) || 0);
  const db = await openCodeDB();
  return new Promise((resolve, reject) => {
    let resultTotal = 0;
    let didGrant = false;
    const tx = db.transaction(STORE_CODE_META, 'readwrite');
    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => {
      if (didGrant && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('momentum-github-trophy-xp', { detail: { userId } }));
      }
      resolve(resultTotal);
    };
    const store = tx.objectStore(STORE_CODE_META);
    const req = store.get(key);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const r = req.result || {};
      const granted = r.granted && typeof r.granted === 'object' ? { ...r.granted } : {};
      if (granted[trophyId] != null) {
        resultTotal = Number(r.total) || 0;
        return;
      }
      granted[trophyId] = amt;
      resultTotal = (Number(r.total) || 0) + amt;
      didGrant = amt > 0;
      store.put({
        key,
        total: resultTotal,
        granted,
        updatedAt: new Date().toISOString(),
      });
    };
  });
}
