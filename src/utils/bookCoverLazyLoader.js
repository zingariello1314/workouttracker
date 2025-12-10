/**
 * 📚 BOOK COVER LAZY LOADER
 * 
 * Système de chargement paresseux des couvertures de livres par batch
 * Optimise les performances en chargeant seulement les couvertures visibles
 * 
 * Features:
 * - Chargement par batch (8 couvertures à la fois par défaut)
 * - IntersectionObserver pour détecter la visibilité
 * - Cache mémoire pour éviter les rechargements
 * - Gestion d'erreur robuste
 * - Cleanup automatique des ObjectURLs
 * 
 * @module utils/bookCoverLazyLoader
 */

import { isBrowser, hasIntersectionObserver } from './isBrowser';

// Configuration par défaut
const DEFAULT_BATCH_SIZE = 8;
const DEFAULT_ROOT_MARGIN = '100px';
const DEFAULT_THRESHOLD = 0.01;

// Cache global des couvertures chargées
const coverCache = new Map();
const loadingPromises = new Map();

/**
 * Nettoie le cache des couvertures
 */
export const clearCoverCache = () => {
  // Libérer les ObjectURLs pour éviter les fuites mémoire
  for (const [key, value] of coverCache.entries()) {
    if (value && typeof value === 'string' && value.startsWith('blob:')) {
      URL.revokeObjectURL(value);
    }
  }
  coverCache.clear();
  loadingPromises.clear();
};

/**
 * Charge une couverture de livre depuis IndexedDB
 * 
 * @param {string} bookId - ID du livre
 * @param {string} coverInline - DataURL de la couverture (si disponible)
 * @returns {Promise<string|null>} URL de la couverture ou null
 */
const loadBookCover = async (bookId, coverInline) => {
  try {
    // Si déjà en cache, retourner immédiatement
    if (coverCache.has(bookId)) {
      return coverCache.get(bookId);
    }

    // Si déjà en cours de chargement, attendre la promesse existante
    if (loadingPromises.has(bookId)) {
      return await loadingPromises.get(bookId);
    }

    // Créer une nouvelle promesse de chargement
    const loadPromise = (async () => {
      // Si coverInline est disponible, l'utiliser directement
      if (coverInline && typeof coverInline === 'string') {
        coverCache.set(bookId, coverInline);
        return coverInline;
      }

      // Sinon, essayer de charger depuis IndexedDB (si implémenté)
      // Pour l'instant, retourner null si pas de coverInline
      coverCache.set(bookId, null);
      return null;
    })();

    loadingPromises.set(bookId, loadPromise);
    
    try {
      const result = await loadPromise;
      return result;
    } finally {
      loadingPromises.delete(bookId);
    }
  } catch (error) {
    console.error('[bookCoverLazyLoader] Erreur chargement couverture:', bookId, error);
    coverCache.set(bookId, null);
    return null;
  }
};

/**
 * Crée un lazy loader pour les couvertures de livres
 * 
 * @param {HTMLElement} container - Container des éléments livre
 * @param {Array} books - Liste des livres avec leurs métadonnées
 * @param {Object} options - Options de configuration
 * @param {number} options.batchSize - Taille du batch (défaut: 8)
 * @param {string} options.rootMargin - Marge avant viewport (défaut: '100px')
 * @param {number} options.threshold - Seuil de visibilité (défaut: 0.01)
 * @param {Function} options.onCoverLoaded - Callback appelé quand une couverture est chargée
 * @returns {Object} { observer, loadBatch, cleanup }
 */
export const createBookCoverLazyLoader = (container, books, options = {}) => {
  if (!isBrowser() || !hasIntersectionObserver()) {
    console.warn('[bookCoverLazyLoader] IntersectionObserver non disponible');
    return null;
  }

  if (!container || !Array.isArray(books)) {
    console.warn('[bookCoverLazyLoader] Container ou books invalide');
    return null;
  }

  const {
    batchSize = DEFAULT_BATCH_SIZE,
    rootMargin = DEFAULT_ROOT_MARGIN,
    threshold = DEFAULT_THRESHOLD,
    onCoverLoaded = () => {}
  } = options;

  // Queue des livres à charger
  const loadQueue = [...books];
  let isLoading = false;

  /**
   * Charge un batch de couvertures
   */
  const loadBatch = async () => {
    if (isLoading || loadQueue.length === 0) return;

    isLoading = true;
    const batch = loadQueue.splice(0, batchSize);

    try {
      // Charger toutes les couvertures du batch en parallèle
      const loadPromises = batch.map(async (book) => {
        try {
          const coverUrl = await loadBookCover(book.id, book.coverInline);
          
          // Notifier que la couverture est chargée
          onCoverLoaded(book.id, coverUrl);
          
          return { bookId: book.id, coverUrl };
        } catch (error) {
          console.error('[bookCoverLazyLoader] Erreur chargement batch:', book.id, error);
          return { bookId: book.id, coverUrl: null };
        }
      });

      await Promise.all(loadPromises);
    } catch (error) {
      console.error('[bookCoverLazyLoader] Erreur batch:', error);
    } finally {
      isLoading = false;
    }
  };

  // Observer pour détecter quand charger le prochain batch
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Déclencher le chargement du prochain batch
        loadBatch();
      }
    });
  }, {
    root: null,
    rootMargin,
    threshold
  });

  // Observer les éléments livre dans le container
  const bookElements = container.querySelectorAll('[data-book-id]');
  bookElements.forEach(element => {
    observer.observe(element);
  });

  // Charger le premier batch immédiatement
  loadBatch();

  return {
    observer,
    loadBatch,
    cleanup: () => {
      observer.disconnect();
    }
  };
};

/**
 * Hook React pour le lazy loading des couvertures
 * 
 * @param {Array} books - Liste des livres
 * @param {Object} options - Options de configuration
 * @returns {Object} { loadedCovers, isLoading, loadBatch }
 */
export const useBookCoverLazyLoader = (books, options = {}) => {
  if (!isBrowser()) {
    return {
      loadedCovers: new Map(),
      isLoading: false,
      loadBatch: () => {}
    };
  }

  const [loadedCovers, setLoadedCovers] = React.useState(new Map());
  const [isLoading, setIsLoading] = React.useState(false);
  const loaderRef = React.useRef(null);

  const onCoverLoaded = React.useCallback((bookId, coverUrl) => {
    setLoadedCovers(prev => new Map(prev.set(bookId, coverUrl)));
  }, []);

  const loadBatch = React.useCallback(async () => {
    if (!books || books.length === 0) return;

    setIsLoading(true);
    
    try {
      const batchSize = options.batchSize || DEFAULT_BATCH_SIZE;
      const batch = books.slice(0, batchSize);
      
      const loadPromises = batch.map(async (book) => {
        const coverUrl = await loadBookCover(book.id, book.coverInline);
        return { bookId: book.id, coverUrl };
      });

      const results = await Promise.all(loadPromises);
      
      setLoadedCovers(prev => {
        const newMap = new Map(prev);
        results.forEach(({ bookId, coverUrl }) => {
          newMap.set(bookId, coverUrl);
        });
        return newMap;
      });
    } catch (error) {
      console.error('[useBookCoverLazyLoader] Erreur:', error);
    } finally {
      setIsLoading(false);
    }
  }, [books, options.batchSize]);

  // Cleanup au démontage
  React.useEffect(() => {
    return () => {
      if (loaderRef.current) {
        loaderRef.current.cleanup();
      }
    };
  }, []);

  return {
    loadedCovers,
    isLoading,
    loadBatch
  };
};

export default {
  createBookCoverLazyLoader,
  useBookCoverLazyLoader,
  clearCoverCache
};