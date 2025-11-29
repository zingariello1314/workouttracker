// Stockage avancé des livres dans IndexedDB (WorkoutTrackerDB)
// Implémentation minimale, soigneusement alignée sur useWorkoutData.openDB
// et conçue pour rester silencieuse en cas d'échec (fallback via localStorage).

const DB_NAME = 'WorkoutTrackerDB';
const BOOKS_STORE = 'books';

/**
 * Ouvre la base WorkoutTrackerDB et garantit l'existence du store "books".
 * Retourne null si IndexedDB n'est pas disponible ou en cas d'échec non récupérable.
 */
export const openBooksDB = () => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }

    const request = indexedDB.open(DB_NAME);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(BOOKS_STORE)) {
        const store = db.createObjectStore(BOOKS_STORE, { keyPath: 'id' });
        // Index simple sur le statut pour d'éventuels filtres futurs
        try {
          store.createIndex('status', 'status', { unique: false });
        } catch {
          // Index non critique : ignorer en cas d'erreur
        }
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      const error = event.target.error;

      // Gestion spécifique de VersionError inspirée de useWorkoutData.openDB
      if (error && error.name === 'VersionError') {
        try {
          const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
          deleteRequest.onsuccess = () => {
            const newRequest = indexedDB.open(DB_NAME, 1);
            newRequest.onupgradeneeded = (e) => {
              const db = e.target.result;
              if (!db.objectStoreNames.contains(BOOKS_STORE)) {
                const store = db.createObjectStore(BOOKS_STORE, { keyPath: 'id' });
                try {
                  store.createIndex('status', 'status', { unique: false });
                } catch {
                  // Index optionnel
                }
              }
            };
            newRequest.onsuccess = (e) => resolve(e.target.result);
            newRequest.onerror = () => resolve(null);
          };
          deleteRequest.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      } else {
        resolve(null);
      }
    };
  });
};

/**
 * Récupère tous les livres depuis IndexedDB.
 * Toujours une opération en lecture seule, ne jette pas d'erreur vers l'appelant.
 */
export const getAllBooksFromIndexedDB = async () => {
  const db = await openBooksDB();
  if (!db) {
    return [];
  }

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([BOOKS_STORE], 'readonly');
      const store = transaction.objectStore(BOOKS_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const result = Array.isArray(request.result) ? request.result : [];
        resolve(result);
      };

      request.onerror = () => {
        resolve([]);
      };
    } catch {
      resolve([]);
    }
  });
};

/**
 * Remplace le contenu du store "books" par la liste fournie.
 * Stratégie full-replace cohérente avec la sauvegarde du contexte global.
 * Ne jette pas d'erreur vers l'appelant : en cas d'échec, l'appelant peut
 * se reposer sur localStorage comme c'est déjà le cas aujourd'hui.
 */
export const saveBooksToIndexedDB = async (books) => {
  const db = await openBooksDB();
  if (!db) {
    return false;
  }

  const safeBooks = Array.isArray(books) ? books : [];

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([BOOKS_STORE], 'readwrite');
      const store = transaction.objectStore(BOOKS_STORE);

      const clearRequest = store.clear();

      clearRequest.onsuccess = () => {
        if (safeBooks.length === 0) {
          resolve(true);
          return;
        }

        let remaining = safeBooks.length;
        let failed = false;

        safeBooks.forEach((book) => {
          // Nettoyage léger : garantir la présence de champs basiques
          const normalized = {
            id: book.id,
            title: book.title || '',
            author: book.author || '',
            year: book.year ?? '',
            pages: book.pages ?? '',
            status: book.status || 'in-progress',
            personalScore: typeof book.personalScore === 'number' ? book.personalScore : 0,
            notes: book.notes || '',
            readingSessions: Array.isArray(book.readingSessions) ? book.readingSessions : [],
            createdAt: book.createdAt || null,
            updatedAt: book.updatedAt || null,
            version: book.version || '1.0',
          };

          const putRequest = store.put(normalized);
          putRequest.onerror = () => {
            failed = true;
            if (--remaining === 0) {
              resolve(!failed);
            }
          };
          putRequest.onsuccess = () => {
            if (--remaining === 0) {
              resolve(!failed);
            }
          };
        });
      };

      clearRequest.onerror = () => {
        resolve(false);
      };
    } catch {
      resolve(false);
    }
  });
};


