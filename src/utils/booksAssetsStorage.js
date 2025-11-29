// Stockage des assets Livres (PDFs, couvertures) dans IndexedDB
// Version minimaliste, non branchée à la UI pour l'instant.

// DB dédiée aux assets Livres pour éviter toute collision de schéma
const DB_NAME = 'WorkoutTrackerBooksAssets';
const PDF_STORE = 'bookPdfFiles';
const IMAGE_STORE = 'bookImages';

const openAssetsDB = () => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }

    const request = indexedDB.open(DB_NAME);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(PDF_STORE)) {
        db.createObjectStore(PDF_STORE, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(IMAGE_STORE)) {
        db.createObjectStore(IMAGE_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = () => {
      resolve(null);
    };
  });
};

export const saveBookPdf = async (id, file) => {
  const db = await openAssetsDB();
  if (!db || !id || !file) return false;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([PDF_STORE], 'readwrite');
      const store = tx.objectStore(PDF_STORE);
      const record = {
        id,
        file,
        mimeType: file.type || 'application/pdf',
        size: file.size || null,
        updatedAt: new Date().toISOString(),
      };
      const request = store.put(record);
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
};

export const getBookPdf = async (id) => {
  const db = await openAssetsDB();
  if (!db || !id) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([PDF_STORE], 'readonly');
      const store = tx.objectStore(PDF_STORE);
      const request = store.get(id);
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
};

export const deleteBookPdf = async (id) => {
  const db = await openAssetsDB();
  if (!db || !id) return false;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([PDF_STORE], 'readwrite');
      const store = tx.objectStore(PDF_STORE);
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
};

export const saveBookCover = async (id, blob, meta = {}) => {
  const db = await openAssetsDB();
  if (!db || !id || !blob) return false;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([IMAGE_STORE], 'readwrite');
      const store = tx.objectStore(IMAGE_STORE);
      const record = {
        id,
        blob,
        mimeType: blob.type || 'image/jpeg',
        size: blob.size || null,
        updatedAt: new Date().toISOString(),
        ...meta,
      };
      const request = store.put(record);
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
};

export const getBookCover = async (id) => {
  const db = await openAssetsDB();
  if (!db || !id) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([IMAGE_STORE], 'readonly');
      const store = tx.objectStore(IMAGE_STORE);
      const request = store.get(id);
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
};

export const deleteBookCover = async (id) => {
  const db = await openAssetsDB();
  if (!db || !id) return false;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([IMAGE_STORE], 'readwrite');
      const store = tx.objectStore(IMAGE_STORE);
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
};


