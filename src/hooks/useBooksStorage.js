import { useCallback, useEffect, useRef, useState } from 'react';
import { loadBooks, saveBooks } from '../utils/booksStorage';
import { getAllBooksFromIndexedDB, saveBooksToIndexedDB } from '../utils/booksIndexedDB';

// Hook centralisant le chargement et la persistance des livres
// - lecture prioritaire depuis IndexedDB (si disponible), sinon localStorage (fallback lecture uniquement)
// - sauvegarde UNIQUEMENT vers IndexedDB (localStorage saturé, utilisé uniquement en fallback de lecture)
// - API simple pour BooksTab : { books, setBooks, isLoading }

const HASH_EMPTY = 'EMPTY';

const computeHash = (value) => {
  try {
    const json = JSON.stringify(value);
    // Hash très simple et peu coûteux (xxd style)
    let hash = 0;
    for (let i = 0; i < json.length; i += 1) {
      const char = json.charCodeAt(i);
      hash = (hash * 31 + char) >>> 0;
    }
    return `${hash}:${json.length}`;
  } catch {
    return HASH_EMPTY;
  }
};

export const useBooksStorage = () => {
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const debounceTimerRef = useRef(null);
  const lastSavedHashRef = useRef(HASH_EMPTY);
  const isInitialLoadRef = useRef(true);

  // Chargement initial
  useEffect(() => {
    let isMounted = true;

    const loadInitialBooks = async () => {
      try {
        // 1) Essayer IndexedDB
        const indexedBooks = await getAllBooksFromIndexedDB();
        console.log('[useBooksStorage] Chargement IndexedDB:', indexedBooks.length, 'livres trouvés');
        if (isMounted && Array.isArray(indexedBooks) && indexedBooks.length > 0) {
          console.log('[useBooksStorage] ✅ Utilisation des livres depuis IndexedDB');
          setBooks(indexedBooks);
          lastSavedHashRef.current = computeHash(indexedBooks);
          return;
        }

        // 2) Sinon, fallback vers localStorage
        const localBooks = loadBooks();
        console.log('[useBooksStorage] Chargement localStorage:', localBooks.length, 'livres trouvés');
        if (isMounted) {
          if (localBooks.length > 0) {
            console.log('[useBooksStorage] ✅ Utilisation des livres depuis localStorage');
          } else {
            console.log('[useBooksStorage] ⚠️ Aucun livre trouvé (IndexedDB et localStorage vides)');
          }
          setBooks(localBooks);
          lastSavedHashRef.current = computeHash(localBooks);
        }
      } catch (error) {
        console.error('[useBooksStorage] ❌ Erreur lors du chargement:', error);
        if (isMounted) {
          const fallback = loadBooks();
          console.log('[useBooksStorage] Fallback localStorage:', fallback.length, 'livres');
          setBooks(fallback);
          lastSavedHashRef.current = computeHash(fallback);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          isInitialLoadRef.current = false;
          console.log('[useBooksStorage] Chargement initial terminé, isInitialLoadRef = false');
        }
      }
    };

    loadInitialBooks();

    return () => {
      isMounted = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const scheduleSave = useCallback(
    (nextBooks) => {
      if (isInitialLoadRef.current) {
        return;
      }

      const nextHash = computeHash(nextBooks);
      if (nextHash === lastSavedHashRef.current) {
        return;
      }

      lastSavedHashRef.current = nextHash;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        try {
          await saveBooksToIndexedDB(nextBooks);
          console.log('[useBooksStorage] ✅ Sauvegarde IndexedDB réussie');
        } catch (error) {
          // Ne pas casser l'app en cas d'erreur IndexedDB, mais logger l'erreur
          console.error('[useBooksStorage] ❌ Erreur sauvegarde IndexedDB:', error);
          // NE PLUS sauvegarder dans localStorage (saturé)
          // localStorage est utilisé uniquement comme fallback de LECTURE
        }
      }, 800);
    },
    []
  );

  const updateBooks = useCallback(
    (updater) => {
      setBooks((prev) => {
        const next =
          typeof updater === 'function'
            ? updater(prev)
            : Array.isArray(updater)
            ? updater
            : prev;
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave]
  );

  return {
    books,
    setBooks: updateBooks,
    isLoading,
  };
};

export default useBooksStorage;



