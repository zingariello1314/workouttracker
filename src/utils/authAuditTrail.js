const DB_NAME = 'WorkoutTrackerSecurityDB';
const STORE_NAME = 'authAuditTrail';
const MAX_EVENTS = 500;

const openSecurityDb = () =>
  new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('eventType', 'eventType', { unique: false });
      }
    };
    req.onsuccess = (event) => resolve(event.target.result);
    req.onerror = () => resolve(null);
  });

/** URL absolue si audit distant configuré ; sinon pas d’appel (évite 404 sur le dev Vite :3001). */
const getAuditEventsPostUrl = () => {
  const explicit = String(import.meta.env.VITE_AUTH_AUDIT_BASE_URL || '').trim();
  if (explicit) return `${explicit.replace(/\/$/, '')}/auth/audit/events`;
  const serverBase = String(import.meta.env.VITE_AUTH_SERVER_BASE || '').trim();
  if (serverBase) return `${serverBase.replace(/\/$/, '')}/auth/audit/events`;
  return '';
};

const postAuditToServer = async (event) => {
  const url = getAuditEventsPostUrl();
  if (!url) return;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
    if (!res.ok) return;
  } catch {
    // backend optionnel / hors ligne
  }
};

export const logAuthAuditEvent = async (eventType, payload = {}) => {
  const event = {
    id:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `audit_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    eventType,
    timestamp: new Date().toISOString(),
    payload
  };

  const db = await openSecurityDb();
  if (db) {
    try {
      const tx = db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(event);
      const getAllReq = store.getAll();
      getAllReq.onsuccess = () => {
        const all = getAllReq.result || [];
        if (all.length > MAX_EVENTS) {
          all
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
            .slice(0, all.length - MAX_EVENTS)
            .forEach((oldEvent) => store.delete(oldEvent.id));
        }
      };
    } catch {
      // ignore local audit errors
    }
  }

  await postAuditToServer(event);
  return event;
};
