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

    // Ouvrir sans version spécifique pour obtenir la version actuelle
    const request = indexedDB.open(DB_NAME);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(BOOKS_STORE)) {
        console.log('[booksIndexedDB] Création du store "books"');
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
      const db = event.target.result;
      // Vérifier que le store existe, sinon forcer un upgrade
      if (!db.objectStoreNames.contains(BOOKS_STORE)) {
        console.warn('[booksIndexedDB] ⚠️ Le store "books" n\'existe pas, fermeture et réouverture avec upgrade');
        const currentVersion = db.version;
        db.close();
        // Réessayer avec une version supérieure pour forcer l'upgrade
        const upgradeRequest = indexedDB.open(DB_NAME, currentVersion + 1);
        upgradeRequest.onupgradeneeded = (e) => {
          const upgradeDb = e.target.result;
          if (!upgradeDb.objectStoreNames.contains(BOOKS_STORE)) {
            console.log('[booksIndexedDB] Création du store "books" (upgrade forcé)');
            const store = upgradeDb.createObjectStore(BOOKS_STORE, { keyPath: 'id' });
            try {
              store.createIndex('status', 'status', { unique: false });
            } catch {
              // Index optionnel
            }
          }
        };
        upgradeRequest.onsuccess = (e) => {
          console.log('[booksIndexedDB] ✅ Base mise à jour avec le store "books"');
          resolve(e.target.result);
        };
        upgradeRequest.onerror = (e) => {
          console.error('[booksIndexedDB] ❌ Erreur lors de l\'upgrade forcé:', e.target.error);
          resolve(null);
        };
        return;
      }
      console.log('[booksIndexedDB] ✅ Base ouverte, store "books" présent');
      resolve(db);
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
    console.error('[booksIndexedDB] ❌ Impossible d\'ouvrir IndexedDB');
    return false;
  }

  const safeBooks = Array.isArray(books) ? books : [];
  console.log('[booksIndexedDB] Sauvegarde de', safeBooks.length, 'livres');

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([BOOKS_STORE], 'readwrite');
      const store = transaction.objectStore(BOOKS_STORE);

      const clearRequest = store.clear();

      clearRequest.onsuccess = () => {
        if (safeBooks.length === 0) {
          console.log('[booksIndexedDB] ✅ Base vidée (0 livres)');
          resolve(true);
          return;
        }

        let remaining = safeBooks.length;
        let failed = false;
        let savedCount = 0;

        safeBooks.forEach((book) => {
          // Préserver TOUS les champs du livre, en normalisant seulement ceux qui sont manquants
          const normalized = {
            ...book, // Préserver TOUS les champs existants (y compris ceux non listés)
            id: book.id,
            readingSessions: Array.isArray(book.readingSessions) ? book.readingSessions : [],
          };
          
          // Normaliser seulement les champs manquants (sans écraser les valeurs existantes)
          if (normalized.title === undefined || normalized.title === null) normalized.title = '';
          if (normalized.author === undefined || normalized.author === null) normalized.author = '';
          if (normalized.year === undefined || normalized.year === null) normalized.year = '';
          if (normalized.pages === undefined || normalized.pages === null) normalized.pages = '';
          if (normalized.status === undefined || normalized.status === null) normalized.status = 'in-progress';
          if (normalized.genre === undefined || normalized.genre === null) normalized.genre = '';
          if (normalized.coverUrl === undefined || normalized.coverUrl === null) normalized.coverUrl = '';
          if (normalized.shortSummary === undefined || normalized.shortSummary === null) normalized.shortSummary = '';
          if (normalized.longSummary === undefined || normalized.longSummary === null) normalized.longSummary = '';
          if (normalized.notes === undefined || normalized.notes === null) normalized.notes = '';
          if (normalized.personalScore === undefined || normalized.personalScore === null) {
            normalized.personalScore = typeof book.personalScore === 'number' ? book.personalScore : 0;
          }
          if (normalized.hasPdf === undefined || normalized.hasPdf === null) {
            normalized.hasPdf = book.hasPdf === true || book.hasPdf === 'true' || book.hasPdf === 1;
          }
          // hasCover doit être true si coverInline existe
          if (normalized.hasCover === undefined || normalized.hasCover === null) {
            normalized.hasCover = !!normalized.coverInline;
          } else if (!normalized.hasCover && normalized.coverInline) {
            normalized.hasCover = true;
          }
          // Préserver coverInline tel quel (même si null)
          if (normalized.coverInline === undefined) normalized.coverInline = null;
          if (normalized.createdAt === undefined || normalized.createdAt === null) normalized.createdAt = null;
          if (normalized.updatedAt === undefined || normalized.updatedAt === null) normalized.updatedAt = null;
          if (normalized.version === undefined || normalized.version === null) normalized.version = '1.1';

          const putRequest = store.put(normalized);
          putRequest.onerror = (error) => {
            console.error(`[booksIndexedDB] ❌ Erreur sauvegarde livre ${book.id || 'sans-id'}:`, error);
            failed = true;
            if (--remaining === 0) {
              console.error('[booksIndexedDB] ❌ Échec sauvegarde:', savedCount, '/', safeBooks.length, 'livres sauvegardés');
              resolve(false);
            }
          };
          putRequest.onsuccess = () => {
            savedCount++;
            if (--remaining === 0) {
              if (!failed) {
                console.log('[booksIndexedDB] ✅', savedCount, 'livres sauvegardés avec succès');
              }
              resolve(!failed);
            }
          };
        });
      };

      clearRequest.onerror = (error) => {
        console.error('[booksIndexedDB] ❌ Erreur lors du clear:', error);
        resolve(false);
      };
    } catch (error) {
      console.error('[booksIndexedDB] ❌ Exception lors de la sauvegarde:', error);
      resolve(false);
    }
  });
};


