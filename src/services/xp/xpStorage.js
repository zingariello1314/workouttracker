/**
 * Service de stockage pour le système XP centralisé
 * Utilise IndexedDB avec fallback localStorage
 */

const DB_NAME = 'QuietQuestDB';
const STORE_NAME = 'xpSystem';

const createXPStore = (db) => {
  if (!db.objectStoreNames.contains(STORE_NAME)) {
    const store = db.createObjectStore(STORE_NAME, { keyPath: 'userId' });
    store.createIndex('lastUpdated', 'lastUpdated', { unique: false });
  }
};

const upgradeXPDB = (nextVersion) =>
  new Promise((resolve) => {
    const upgradeRequest = indexedDB.open(DB_NAME, nextVersion);
    upgradeRequest.onupgradeneeded = (event) => {
      const db = event.target.result;
      createXPStore(db);
    };
    upgradeRequest.onsuccess = () => resolve(upgradeRequest.result);
    upgradeRequest.onerror = () => {
      console.warn('[XPStorage] Erreur IndexedDB (upgrade), utilisation localStorage');
      resolve(null);
    };
  });

/**
 * Ouvre la base de données IndexedDB et garantit l'existence du store XP.
 */
export const openXPDB = async () => {
  return new Promise((resolve) => {
    if (!window.indexedDB) {
      console.warn('[XPStorage] IndexedDB non disponible, utilisation localStorage');
      resolve(null);
      return;
    }

    const request = indexedDB.open(DB_NAME);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      createXPStore(db);
    };
    
    request.onsuccess = async () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const nextVersion = (db.version || 1) + 1;
        db.close();
        const upgraded = await upgradeXPDB(nextVersion);
        resolve(upgraded);
        return;
      }
      resolve(db);
    };
    request.onerror = () => {
      console.warn('[XPStorage] Erreur IndexedDB, utilisation localStorage');
      resolve(null);
    };
  });
};

/**
 * Sauvegarde les données XP
 */
export const saveXPData = async (xpData) => {
  try {
    const db = await openXPDB();
    
    if (!db) {
      // Fallback localStorage
      const key = `xpData_${xpData.userId}`;
      localStorage.setItem(key, JSON.stringify({
        ...xpData,
        lastUpdated: new Date().toISOString()
      }));
      return;
    }
    
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.put({
        ...xpData,
        lastUpdated: new Date().toISOString()
      });
      
      request.onsuccess = () => {
        // Backup localStorage
        const key = `xpData_${xpData.userId}`;
        try {
          localStorage.setItem(key, JSON.stringify(xpData));
        } catch (e) {
          console.warn('[XPStorage] Erreur backup localStorage:', e);
        }
        resolve();
      };
      
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[XPStorage] Erreur sauvegarde:', error);
    // Fallback localStorage
    const key = `xpData_${xpData.userId}`;
    try {
      localStorage.setItem(key, JSON.stringify(xpData));
    } catch (e) {
      console.error('[XPStorage] Erreur fallback:', e);
    }
  }
};

/**
 * Charge les données XP
 */
export const loadXPData = async (userId) => {
  try {
    const db = await openXPDB();
    
    if (!db) {
      // Fallback localStorage
      const key = `xpData_${userId}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    }
    
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.get(userId);
      
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result);
        } else {
          // Essayer localStorage en fallback
          const key = `xpData_${userId}`;
          const data = localStorage.getItem(key);
          resolve(data ? JSON.parse(data) : null);
        }
      };
      
      request.onerror = () => {
        // Fallback localStorage
        const key = `xpData_${userId}`;
        const data = localStorage.getItem(key);
        resolve(data ? JSON.parse(data) : null);
      };
    });
  } catch (error) {
    console.error('[XPStorage] Erreur chargement:', error);
    // Fallback localStorage
    const key = `xpData_${userId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }
};
