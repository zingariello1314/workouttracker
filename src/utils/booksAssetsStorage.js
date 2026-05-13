// Stockage des assets Livres (PDFs, couvertures) dans IndexedDB
// Version minimaliste, non branchée à la UI pour l'instant.

import {
  BOOKS_ASSETS_DB_NAME,
  BOOKS_ASSETS_DB_VERSION,
  STORE_BOOK_PDF_FILES,
  STORE_BOOK_IMAGES,
  applyBooksAssetsSchemaUpgrade,
} from '../services/books/booksAssetsDbGateway.js';

const openAssetsDB = () => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }

    const request = indexedDB.open(BOOKS_ASSETS_DB_NAME, BOOKS_ASSETS_DB_VERSION);

    request.onupgradeneeded = (event) => {
      applyBooksAssetsSchemaUpgrade(event);
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
      const tx = db.transaction([STORE_BOOK_PDF_FILES], 'readwrite');
      const store = tx.objectStore(STORE_BOOK_PDF_FILES);
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
      const tx = db.transaction([STORE_BOOK_PDF_FILES], 'readonly');
      const store = tx.objectStore(STORE_BOOK_PDF_FILES);
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
      const tx = db.transaction([STORE_BOOK_PDF_FILES], 'readwrite');
      const store = tx.objectStore(STORE_BOOK_PDF_FILES);
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
      const tx = db.transaction([STORE_BOOK_IMAGES], 'readwrite');
      const store = tx.objectStore(STORE_BOOK_IMAGES);
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
      const tx = db.transaction([STORE_BOOK_IMAGES], 'readonly');
      const store = tx.objectStore(STORE_BOOK_IMAGES);
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
      const tx = db.transaction([STORE_BOOK_IMAGES], 'readwrite');
      const store = tx.objectStore(STORE_BOOK_IMAGES);
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
};


