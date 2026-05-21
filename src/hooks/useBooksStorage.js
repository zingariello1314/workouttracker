import { createContext, createElement, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { loadBooks, saveBooks } from '../utils/booksStorage';
import { getAllBooksFromIndexedDB, saveBooksToIndexedDB } from '../utils/booksIndexedDB';
import { useAuth } from '../context/AuthContext';
import logger from '../utils/logger';
import { isAdminUser } from '../utils/accessControl';
import { migrateBooksGenres } from '../data/bookGenres';
import { normalizeBooksForPersistence } from '../utils/booksPersistence';

const booksLog = logger.module('useBooksStorage');

// Hook centralisant le chargement et la persistance des livres
// - lecture prioritaire depuis IndexedDB (si disponible), sinon localStorage (fallback lecture uniquement)
// - sauvegarde UNIQUEMENT vers IndexedDB (localStorage saturé, utilisé uniquement en fallback de lecture)
// - API simple pour BooksTab : { books, setBooks, isLoading }
// - ✅ NOUVEAU : Filtre par userId (isolation par utilisateur)

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

export const BooksStorageContext = createContext(null);

function useBooksStorageImpl() {
  const { currentUser, isAuthenticated, loading: authLoading } = useAuth();
  const isAdmin = isAdminUser(currentUser);
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const debounceTimerRef = useRef(null);
  const lastSavedHashRef = useRef(HASH_EMPTY);
  const isInitialLoadRef = useRef(true);
  const booksRef = useRef(books);
  useEffect(() => {
    booksRef.current = books;
  }, [books]);

  // ✅ Calculer le userId pour le filtrage
  // Admin : userId = null (ou "main") pour récupérer les livres sans userId ou avec userId = adminId
  // Autre user : userId = currentUser.id
  // Déconnecté : userId = null → retourne [] (pas de livres)
  const userId = isAuthenticated && currentUser 
    ? (isAdmin ? null : currentUser.id)
    : null;

  // Chargement initial
  useEffect(() => {
    let isMounted = true;

    const loadInitialBooks = async () => {
      if (authLoading) {
        return;
      }

      // ✅ Si déconnecté, ne rien charger (état vide)
      if (!isAuthenticated) {
        if (isMounted) {
          setBooks([]);
          lastSavedHashRef.current = computeHash([]);
          setIsLoading(false);
          isInitialLoadRef.current = false;
          booksLog.debug('[useBooksStorage] ⚠️ Utilisateur déconnecté : aucun livre chargé');
        }
        return;
      }

      try {
        // 1) Essayer IndexedDB
        const allIndexedBooks = await getAllBooksFromIndexedDB();
        booksLog.debug('[useBooksStorage] Chargement IndexedDB:', allIndexedBooks.length, 'livres trouvés (tous utilisateurs)');
        
        // ✅ Filtrer par userId
        // Admin : récupère les livres sans userId (anciennes données) OU avec userId = adminId
        // Autre user : récupère uniquement les livres avec userId = currentUser.id
        const adminId = isAdmin ? currentUser.id : null;
        
        const filteredBooks = allIndexedBooks.filter(book => {
          if (!book) return false;
          // Admin : récupère les livres sans userId (anciennes données) OU avec userId = adminId
          if (adminId) {
            return !book.userId || book.userId === adminId;
          }
          // Autre user : uniquement ses propres livres
          return book.userId === userId;
        });
        
        booksLog.debug('[useBooksStorage] Livres filtrés pour userId:', userId || adminId || 'déconnecté', ':', filteredBooks.length, 'livres');
        
        if (isMounted && Array.isArray(filteredBooks) && filteredBooks.length > 0) {
          booksLog.debug('[useBooksStorage] ✅ Utilisation des livres depuis IndexedDB (filtrés)');
          const prepared = normalizeBooksForPersistence(migrateBooksGenres(filteredBooks));
          setBooks(prepared);
          lastSavedHashRef.current = computeHash(prepared);
          saveBooks(prepared, currentUser.id);
          void saveBooksToIndexedDB(prepared).catch((err) => {
            console.warn('[useBooksStorage] Resync IndexedDB après normalisation:', err);
          });
          return;
        }

        // 2) Sinon, fallback vers localStorage (seulement si connecté)
        const localBooks = loadBooks(userId || currentUser?.id);
        // ✅ Filtrer aussi localStorage par userId
        const filteredLocalBooks = localBooks.filter(book => {
          if (!book) return false;
          if (adminId) {
            return !book.userId || book.userId === adminId;
          }
          return book.userId === userId;
        });
        
        booksLog.debug('[useBooksStorage] Chargement localStorage:', filteredLocalBooks.length, 'livres trouvés (filtrés)');
        if (isMounted) {
          if (filteredLocalBooks.length > 0) {
            booksLog.debug('[useBooksStorage] ✅ Utilisation des livres depuis localStorage (filtrés)');
            const userIdToAssign = currentUser.id;
            const migrated = normalizeBooksForPersistence(
              migrateBooksGenres(
                filteredLocalBooks.map((book) => ({
                  ...book,
                  userId: book.userId || userIdToAssign,
                }))
              )
            );
            setBooks(migrated);
            lastSavedHashRef.current = computeHash(migrated);
            saveBooks(migrated, currentUser.id);
            void saveBooksToIndexedDB(migrated).catch((err) => {
              console.warn('[useBooksStorage] Migration localStorage → IndexedDB:', err);
            });
          } else {
            booksLog.debug('[useBooksStorage] ⚠️ Aucun livre trouvé (IndexedDB et localStorage vides pour cet utilisateur)');
            setBooks(filteredLocalBooks);
            lastSavedHashRef.current = computeHash(filteredLocalBooks);
          }
        }
      } catch (error) {
        console.error('[useBooksStorage] ❌ Erreur lors du chargement:', error);
        if (isMounted) {
          const fallback = loadBooks(userId || currentUser?.id);
          // ✅ Filtrer aussi le fallback
          const filteredFallback = fallback.filter(book => {
            if (!book) return false;
            const adminId = isAdmin ? currentUser.id : null;
            if (adminId) {
              return !book.userId || book.userId === adminId;
            }
            return book.userId === userId;
          });
          booksLog.debug('[useBooksStorage] Fallback localStorage:', filteredFallback.length, 'livres (filtrés)');
          setBooks(filteredFallback);
          lastSavedHashRef.current = computeHash(filteredFallback);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          isInitialLoadRef.current = false;
          booksLog.debug('[useBooksStorage] Chargement initial terminé, isInitialLoadRef = false');
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
  }, [isAuthenticated, authLoading, currentUser, userId]);

  useEffect(() => {
    if (!isAuthenticated || !currentUser) return undefined;

    const flushBooks = () => {
      if (isInitialLoadRef.current) return;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      const userIdToAssign = currentUser.id;
      const booksWithUserId = normalizeBooksForPersistence(
        Array.isArray(booksRef.current)
          ? booksRef.current.map((book) => ({
              ...book,
              userId: book.userId || userIdToAssign,
            }))
          : []
      );
      saveBooksToIndexedDB(booksWithUserId).catch(() => {});
      saveBooks(booksWithUserId, userIdToAssign);
    };

    window.addEventListener('pagehide', flushBooks);
    window.addEventListener('beforeunload', flushBooks);
    return () => {
      window.removeEventListener('pagehide', flushBooks);
      window.removeEventListener('beforeunload', flushBooks);
    };
  }, [isAuthenticated, currentUser]);

  const scheduleSave = useCallback(
    (nextBooks) => {
      // ✅ Si déconnecté, ne rien sauvegarder
      if (!isAuthenticated || !currentUser) {
        booksLog.debug('[useBooksStorage] ⚠️ Utilisateur déconnecté : sauvegarde ignorée');
        return;
      }

      // ✅ Ajouter userId à chaque livre avant sauvegarde
      const userIdToAssign = currentUser.id;
      
      const booksWithUserId = normalizeBooksForPersistence(
        Array.isArray(nextBooks)
          ? nextBooks.map((book) => ({
              ...book,
              userId: book.userId || userIdToAssign,
            }))
          : []
      );

      const nextHash = computeHash(booksWithUserId);
      if (nextHash === lastSavedHashRef.current) {
        return;
      }

      lastSavedHashRef.current = nextHash;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        try {
          await saveBooksToIndexedDB(booksWithUserId);
          saveBooks(booksWithUserId, userIdToAssign);
          booksLog.debug('[useBooksStorage] ✅ Sauvegarde IndexedDB + localStorage (userId:', userIdToAssign, ')');
        } catch (error) {
          console.error('[useBooksStorage] ❌ Erreur sauvegarde IndexedDB:', error);
          try {
            saveBooks(booksWithUserId, userIdToAssign);
          } catch (lsErr) {
            console.error('[useBooksStorage] ❌ Erreur sauvegarde localStorage:', lsErr);
          }
        }
      }, 800);
    },
    [isAuthenticated, currentUser]
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
        // Écriture immédiate (IndexedDB) pour ne pas perdre les changements si F5 avant la fin du debounce
        if (isAuthenticated && currentUser) {
          const userIdToAssign = currentUser.id;
          const booksWithUserId = normalizeBooksForPersistence(
            Array.isArray(next)
              ? next.map((book) => ({
                  ...book,
                  userId: book.userId || userIdToAssign,
                }))
              : []
          );
          saveBooksToIndexedDB(booksWithUserId).catch(() => {});
          try {
            saveBooks(booksWithUserId, userIdToAssign);
          } catch {
            /* ignore */
          }
        }
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave, isAuthenticated, currentUser]
  );

  return {
    books,
    setBooks: updateBooks,
    isLoading,
  };
}

export function BooksStorageProvider({ children }) {
  const value = useBooksStorageImpl();
  return createElement(BooksStorageContext.Provider, { value }, children);
}

export const useBooksStorage = () => {
  const ctx = useContext(BooksStorageContext);
  if (ctx == null) {
    throw new Error('useBooksStorage doit être utilisé dans un BooksStorageProvider (voir App.jsx).');
  }
  return ctx;
};

export default useBooksStorage;



