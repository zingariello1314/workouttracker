/**
 * Persistance livres via IndexedDB — même logique qu’historiquement `booksIndexedDB.js`.
 */

import logger from '../../utils/logger.js';
import { BooksRepositoryPhase1 } from './BooksRepositoryPhase1.js';
import { BOOKS_STORE_NAME, openBooksDb } from './booksDbGateway.js';

const booksIdxLog = logger.module('booksIndexedDB');

function normalizeBookForPut(book) {
  const normalized = {
    ...book,
    id: book.id,
    readingSessions: Array.isArray(book.readingSessions) ? book.readingSessions : [],
  };
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
  if (normalized.hasCover === undefined || normalized.hasCover === null) {
    normalized.hasCover = !!normalized.coverInline;
  } else if (!normalized.hasCover && normalized.coverInline) {
    normalized.hasCover = true;
  }
  if (normalized.coverInline === undefined) normalized.coverInline = null;
  if (normalized.createdAt === undefined || normalized.createdAt === null) normalized.createdAt = null;
  if (normalized.updatedAt === undefined || normalized.updatedAt === null) normalized.updatedAt = null;
  if (normalized.version === undefined || normalized.version === null) normalized.version = '1.1';
  return normalized;
}

async function getAllWithDb(db) {
  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([BOOKS_STORE_NAME], 'readonly');
      const store = transaction.objectStore(BOOKS_STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        const result = Array.isArray(request.result) ? request.result : [];
        resolve(result);
      };
      request.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

export class LocalBooksRepository extends BooksRepositoryPhase1 {
  async loadAll() {
    const db = await openBooksDb();
    if (!db) return [];
    return getAllWithDb(db);
  }

  async saveMerged(books) {
    const db = await openBooksDb();
    if (!db) {
      console.error('[booksIndexedDB] ❌ Impossible d\'ouvrir IndexedDB');
      return false;
    }

    const safeBooks = Array.isArray(books) ? books : [];
    booksIdxLog.debug('[booksIndexedDB] Sauvegarde de', safeBooks.length, 'livres');

    return new Promise((resolve) => {
      try {
        getAllWithDb(db).then((allExistingBooks) => {
          const userIdsToUpdate = new Set(safeBooks.map((b) => b.userId).filter(Boolean));

          const booksToKeep = allExistingBooks.filter((existing) => {
            if (existing.userId && !userIdsToUpdate.has(existing.userId)) {
              return true;
            }
            if (!existing.userId) {
              return true;
            }
            return !safeBooks.some((newBook) => newBook.id === existing.id);
          });

          booksIdxLog.debug(
            '[booksIndexedDB] Merge :',
            booksToKeep.length,
            'livres conservés (autres utilisateurs),',
            safeBooks.length,
            'livres à sauvegarder'
          );

          const transaction = db.transaction([BOOKS_STORE_NAME], 'readwrite');
          const store = transaction.objectStore(BOOKS_STORE_NAME);
          const clearRequest = store.clear();

          clearRequest.onsuccess = () => {
            let remaining = booksToKeep.length + safeBooks.length;
            if (remaining === 0) {
              resolve(true);
              return;
            }
            let failed = false;
            let savedCount = 0;

            const saveBook = (book) => {
              const normalized = normalizeBookForPut(book);
              const putRequest = store.put(normalized);
              putRequest.onerror = (error) => {
                console.error(`[booksIndexedDB] ❌ Erreur sauvegarde livre ${book.id || 'sans-id'}:`, error);
                failed = true;
                if (--remaining === 0) {
                  console.error(
                    '[booksIndexedDB] ❌ Échec sauvegarde:',
                    savedCount,
                    '/',
                    booksToKeep.length + safeBooks.length,
                    'livres sauvegardés'
                  );
                  resolve(false);
                }
              };
              putRequest.onsuccess = () => {
                savedCount++;
                if (--remaining === 0) {
                  if (!failed) {
                    booksIdxLog.debug('[booksIndexedDB] ✅', savedCount, 'livres sauvegardés avec succès (merge intelligent)');
                  }
                  resolve(!failed);
                }
              };
            };

            booksToKeep.forEach(saveBook);
            safeBooks.forEach(saveBook);
          };

          clearRequest.onerror = (error) => {
            console.error('[booksIndexedDB] ❌ Erreur lors du clear:', error);
            resolve(false);
          };
        });
      } catch (error) {
        console.error('[booksIndexedDB] ❌ Exception lors de la sauvegarde:', error);
        resolve(false);
      }
    });
  }
}
