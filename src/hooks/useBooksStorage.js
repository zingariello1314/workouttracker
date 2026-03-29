import { createContext, createElement, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { loadBooks, saveBooks } from '../utils/booksStorage';
import { getAllBooksFromIndexedDB, saveBooksToIndexedDB } from '../utils/booksIndexedDB';
import { useAuth } from '../context/AuthContext';
import logger from '../utils/logger';

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
  const { currentUser, isAuthenticated } = useAuth();
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const debounceTimerRef = useRef(null);
  const lastSavedHashRef = useRef(HASH_EMPTY);
  const isInitialLoadRef = useRef(true);

  // ✅ Calculer le userId pour le filtrage
  // Admin : userId = null (ou "main") pour récupérer les livres sans userId ou avec userId = adminId
  // Autre user : userId = currentUser.id
  // Déconnecté : userId = null → retourne [] (pas de livres)
  const userId = isAuthenticated && currentUser 
    ? (currentUser.role === 'admin' || currentUser.username === 'zingariello1314' ? null : currentUser.id)
    : null;

  // Chargement initial
  useEffect(() => {
    let isMounted = true;

    const loadInitialBooks = async () => {
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
        const adminId = currentUser?.role === 'admin' || currentUser?.username === 'zingariello1314' 
          ? currentUser.id 
          : null;
        
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
          setBooks(filteredBooks);
          lastSavedHashRef.current = computeHash(filteredBooks);
          return;
        }

        // 2) Sinon, fallback vers localStorage (seulement si connecté)
        const localBooks = loadBooks();
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
          } else {
            booksLog.debug('[useBooksStorage] ⚠️ Aucun livre trouvé (IndexedDB et localStorage vides pour cet utilisateur)');
          }
          setBooks(filteredLocalBooks);
          lastSavedHashRef.current = computeHash(filteredLocalBooks);
        }
      } catch (error) {
        console.error('[useBooksStorage] ❌ Erreur lors du chargement:', error);
        if (isMounted) {
          const fallback = loadBooks();
          // ✅ Filtrer aussi le fallback
          const filteredFallback = fallback.filter(book => {
            if (!book) return false;
            const adminId = currentUser?.role === 'admin' || currentUser?.username === 'zingariello1314' 
              ? currentUser.id 
              : null;
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
  }, [isAuthenticated, currentUser, userId]);

  const scheduleSave = useCallback(
    (nextBooks) => {
      if (isInitialLoadRef.current) {
        return;
      }

      // ✅ Si déconnecté, ne rien sauvegarder
      if (!isAuthenticated || !currentUser) {
        booksLog.debug('[useBooksStorage] ⚠️ Utilisateur déconnecté : sauvegarde ignorée');
        return;
      }

      // ✅ Ajouter userId à chaque livre avant sauvegarde
      const userIdToAssign = currentUser.role === 'admin' || currentUser.username === 'zingariello1314'
        ? currentUser.id
        : currentUser.id;
      
      const booksWithUserId = Array.isArray(nextBooks) 
        ? nextBooks.map(book => ({
            ...book,
            userId: book.userId || userIdToAssign // Préserver userId existant ou assigner
          }))
        : [];

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
          // ✅ Sauvegarder avec userId (merge avec les autres livres dans IndexedDB)
          await saveBooksToIndexedDB(booksWithUserId);
          booksLog.debug('[useBooksStorage] ✅ Sauvegarde IndexedDB réussie (avec userId:', userIdToAssign, ')');
        } catch (error) {
          // Ne pas casser l'app en cas d'erreur IndexedDB, mais logger l'erreur
          console.error('[useBooksStorage] ❌ Erreur sauvegarde IndexedDB:', error);
          // NE PLUS sauvegarder dans localStorage (saturé)
          // localStorage est utilisé uniquement comme fallback de LECTURE
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
        if (isAuthenticated && currentUser && !isInitialLoadRef.current) {
          const userIdToAssign =
            currentUser.role === 'admin' || currentUser.username === 'zingariello1314'
              ? currentUser.id
              : currentUser.id;
          const booksWithUserId = Array.isArray(next)
            ? next.map((book) => ({
                ...book,
                userId: book.userId || userIdToAssign
              }))
            : [];
          saveBooksToIndexedDB(booksWithUserId).catch(() => {});
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



