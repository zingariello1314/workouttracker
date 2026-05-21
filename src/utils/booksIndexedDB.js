// Compat : API historique — délègue à `services/books` (gateway + repository Phase 1).

<<<<<<< HEAD
import { openBooksDb } from '../services/books/booksDbGateway.js';
import { createBooksRepository } from '../services/books/createBooksRepository.js';
=======
import logger from './logger';
import { normalizeBookForPersistence } from './booksPersistence';
>>>>>>> 9e0d966 (avancements au niveau de la remise a niveau de la sauvegarde des quetes de livre set ajouts d etrucs dans livres)

/** @deprecated préférer `openBooksDb` depuis `services/books/booksDbGateway` */
export const openBooksDB = openBooksDb;

let _repo;
function getRepo() {
  if (!_repo) _repo = createBooksRepository('local');
  return _repo;
}

/**
 * Récupère tous les livres depuis IndexedDB.
 * Ne propage pas d’erreur vers l’appelant.
 */
export const getAllBooksFromIndexedDB = async () => {
  try {
    return await getRepo().loadAll();
  } catch {
    return [];
  }
};

/**
 * Merge intelligent puis persistance — même contrat qu’avant.
 */
export const saveBooksToIndexedDB = async (books) => {
  try {
    return await getRepo().saveMerged(books);
  } catch {
    return false;
  }
<<<<<<< HEAD
=======

  const safeBooks = Array.isArray(books) ? books : [];
  booksIdxLog.debug('[booksIndexedDB] Sauvegarde de', safeBooks.length, 'livres');

  return new Promise(async (resolve) => {
    try {
      // ✅ Récupérer tous les livres existants pour merge intelligent
      const allExistingBooks = await getAllBooksFromIndexedDB();
      
      // ✅ Extraire les userIds des livres à sauvegarder
      const userIdsToUpdate = new Set(safeBooks.map(b => b.userId).filter(Boolean));
      
      // ✅ Filtrer les livres existants : garder ceux qui ne sont PAS dans la liste à sauvegarder
      const booksToKeep = allExistingBooks.filter(existing => {
        // Garder les livres d'autres utilisateurs
        if (existing.userId && !userIdsToUpdate.has(existing.userId)) {
          return true;
        }
        // Garder les livres sans userId (anciennes données, seront migrées par authMigration)
        if (!existing.userId) {
          return !safeBooks.some((newBook) => newBook.id === existing.id);
        }
        return !safeBooks.some((newBook) => newBook.id === existing.id);
      });
      
      booksIdxLog.debug('[booksIndexedDB] Merge :', booksToKeep.length, 'livres conservés (autres utilisateurs),', safeBooks.length, 'livres à sauvegarder');

      const transaction = db.transaction([BOOKS_STORE], 'readwrite');
      const store = transaction.objectStore(BOOKS_STORE);

      // ✅ Clear uniquement si on veut vraiment tout remplacer (pour compatibilité)
      // Sinon, on fait un merge : on garde les autres utilisateurs
      const clearRequest = store.clear();

      clearRequest.onsuccess = () => {
        // ✅ Sauvegarder d'abord les livres à conserver (autres utilisateurs)
        let remaining = booksToKeep.length + safeBooks.length;
        let failed = false;
        let savedCount = 0;

        const saveBook = (book) => {
          const normalized = normalizeBookForPersistence(book);

          const putRequest = store.put(normalized);
          putRequest.onerror = (error) => {
            console.error(`[booksIndexedDB] ❌ Erreur sauvegarde livre ${book.id || 'sans-id'}:`, error);
            failed = true;
            if (--remaining === 0) {
              console.error('[booksIndexedDB] ❌ Échec sauvegarde:', savedCount, '/', (booksToKeep.length + safeBooks.length), 'livres sauvegardés');
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

        // ✅ Sauvegarder d'abord les livres à conserver
        booksToKeep.forEach(saveBook);
        
        // ✅ Puis sauvegarder les nouveaux/modifiés
        safeBooks.forEach(saveBook);
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
>>>>>>> 9e0d966 (avancements au niveau de la remise a niveau de la sauvegarde des quetes de livre set ajouts d etrucs dans livres)
};
