import { useState, useEffect, useRef, useCallback } from 'react';
import { useWorkout } from '../../../context/WorkoutContext';
import { getPhotoUrl } from '../utils/photoNormalizer';
import logger from '../../../utils/logger';
import {
  loadCacheFromDB,
  savePageToCache,
  updateAccessTime,
  evictLRUFromDB,
  cleanExpiredCache,
  invalidateCache as invalidateDBCache
} from '../services/photoPaginationCache';

const log = logger.hook('usePhotosPaginated');

/**
 * ✅ OPTIMISATION: Hook pagination photos avec cache LRU intelligent
 * 
 * Avantages:
 * - Cache LRU pour navigation instantanée pages déjà visitées
 * - Chargement par page (réduit mémoire avec grandes collections)
 * - Préparation migration future vers objectStore IndexedDB séparé
 * - Compatible avec structure actuelle (data.progressPhotos)
 * 
 * @param {number} page - Numéro de page (commence à 1)
 * @param {number} itemsPerPage - Nombre d'items par page
 * @param {object} options - Options supplémentaires
 * @param {string} options.filterBy - Filtrer par angle ('all', 'front', 'side', 'back')
 * @param {boolean} options.enableCache - Activer cache LRU (défaut: true)
 * @param {number} options.maxCacheSize - Taille max cache en pages (défaut: 10)
 * 
 * @returns {{photos: Array, loading: boolean, totalPages: number, totalPhotos: number, error: Error|null}}
 */
const usePhotosPaginated = (page = 1, itemsPerPage = 12, options = {}) => {
  const { data } = useWorkout();
  
  const {
    filterBy = 'all',
    enableCache = true,
    maxCacheSize = 10
  } = options;
  
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPhotos, setTotalPhotos] = useState(0);
  
  // ✅ PHASE 3.4 : Cache LRU mémoire + IndexedDB
  const pageCacheRef = useRef(new Map());
  const lastAccessRef = useRef(new Map()); // Pour vrai LRU (Least Recently Used)
  const cacheLoadedRef = useRef(false); // Flag pour chargement initial cache IndexedDB
  const saveDebounceTimerRef = useRef(null); // Debounce sauvegarde IndexedDB
  
  // ✅ PHASE 3.4 : Charger cache depuis IndexedDB au démarrage
  useEffect(() => {
    if (!enableCache || cacheLoadedRef.current) return;

    const loadCache = async () => {
      try {
        log.debug('Chargement cache IndexedDB...');
        const dbCache = await loadCacheFromDB();
        
        // Fusionner cache IndexedDB dans cache mémoire
        dbCache.forEach((value, key) => {
          pageCacheRef.current.set(key, value);
          lastAccessRef.current.set(key, value.accessTime || value.timestamp);
        });

        cacheLoadedRef.current = true;
        log.debug(`✅ Cache IndexedDB chargé: ${dbCache.size} pages`);

        // Nettoyer cache expiré en arrière-plan
        cleanExpiredCache().catch(err => {
          log.error('Erreur nettoyage cache expiré', err);
        });
      } catch (err) {
        log.error('Erreur chargement cache IndexedDB', err);
        cacheLoadedRef.current = true; // Marquer comme chargé même en cas d'erreur
      }
    };

    loadCache();
  }, [enableCache]);

  // ✅ PHASE 3.4 : Fonction éviction LRU (mémoire + IndexedDB)
  const evictLRUPage = useCallback(async () => {
    if (pageCacheRef.current.size < maxCacheSize) return;
    
    // Trouver page avec accès le plus ancien
    let oldestPage = null;
    let oldestAccessTime = Infinity;
    
    for (const [cachedPage] of pageCacheRef.current) {
      const accessTime = lastAccessRef.current.get(cachedPage) || 0;
      if (accessTime < oldestAccessTime) {
        oldestAccessTime = accessTime;
        oldestPage = cachedPage;
      }
    }
    
    // Évincer page la plus ancienne (mémoire)
    if (oldestPage !== null) {
      log.debug(`Éviction LRU mémoire: page ${oldestPage}`);
      pageCacheRef.current.delete(oldestPage);
      lastAccessRef.current.delete(oldestPage);
    }

    // Éviction LRU dans IndexedDB (en arrière-plan)
    if (enableCache) {
      evictLRUFromDB(maxCacheSize).catch(err => {
        log.error('Erreur éviction LRU IndexedDB', err);
      });
    }
  }, [maxCacheSize, enableCache]);
  
  // ✅ Charger page depuis cache ou calculer
  const loadPage = useCallback(async () => {
    if (!data?.progressPhotos) {
      setPhotos([]);
      setTotalPhotos(0);
      setLoading(false);
      return;
    }
    
    try {
      setError(null);
      
      // ✅ PHASE 3.4 : Vérifier cache mémoire d'abord
      const cacheKey = `${page}_${filterBy}`;
      if (enableCache && pageCacheRef.current.has(cacheKey)) {
        log.debug(`Cache hit mémoire: page ${page}, filter ${filterBy}`);
        const cachedData = pageCacheRef.current.get(cacheKey);
        setPhotos(cachedData.photos);
        setTotalPhotos(cachedData.totalPhotos);
        setLoading(false);
        
        // ✅ Mettre à jour timestamp accès (LRU mémoire)
        const now = Date.now();
        lastAccessRef.current.set(cacheKey, now);
        
        // ✅ PHASE 3.4 : Mettre à jour accessTime dans IndexedDB (en arrière-plan)
        if (cacheLoadedRef.current) {
          updateAccessTime(cacheKey).catch(err => {
            log.error('Erreur mise à jour accessTime IndexedDB', err);
          });
        }
        return;
      }

      // ✅ PHASE 3.4 : Si cache mémoire vide, vérifier IndexedDB (si chargé)
      if (enableCache && cacheLoadedRef.current) {
        // Le cache IndexedDB a déjà été chargé dans le cache mémoire au démarrage
        // Si on arrive ici, la page n'est pas en cache
      }
      
      setLoading(true);
      
      // ✅ Filtrer et trier photos (même logique que PhotoGallerySection)
      let filteredPhotos = data.progressPhotos
        .filter(photo => {
          if (filterBy === 'all') return true;
          return photo.angle === filterBy;
        })
        .map(photo => ({
          id: photo.id,
          url: getPhotoUrl(photo),
          date: photo.date ? new Date(photo.date) : (photo.timestamp ? new Date(photo.timestamp) : new Date()),
          angle: photo.angle || 'front',
          weight: photo.weight,
          notes: photo.notes,
          tags: photo.tags || ['progress'],
          filename: photo.filename,
          type: photo.type,
          analysis: photo.analysis,
          capture: photo.capture
        }))
        .sort((a, b) => {
          const dateA = a.date instanceof Date ? a.date : new Date(a.date || 0);
          const dateB = b.date instanceof Date ? b.date : new Date(b.date || 0);
          return dateB - dateA; // Plus récent en premier
        });
      
      const total = filteredPhotos.length;
      setTotalPhotos(total);
      
      // ✅ Calculer pagination
      const totalPages = Math.ceil(total / itemsPerPage);
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = Math.min(startIndex + itemsPerPage, total);
      
      // ✅ Extraire page demandée
      const pagePhotos = filteredPhotos.slice(startIndex, endIndex);
      
      // ✅ PHASE 3.4 : Mettre en cache (mémoire + IndexedDB) si activé
      if (enableCache) {
        // Évincer si nécessaire
        await evictLRUPage();
        
        // Ajouter au cache mémoire
        const now = Date.now();
        const cacheData = {
          photos: pagePhotos,
          totalPhotos: total,
          timestamp: now,
          accessTime: now
        };
        
        pageCacheRef.current.set(cacheKey, cacheData);
        lastAccessRef.current.set(cacheKey, now);
        
        log.debug(`Cache miss → Cached: page ${page}, filter ${filterBy} (${pagePhotos.length} photos)`);

        // ✅ PHASE 3.4 : Sauvegarder dans IndexedDB (debounced pour performance)
        if (cacheLoadedRef.current) {
          // Annuler sauvegarde précédente si en attente
          if (saveDebounceTimerRef.current) {
            clearTimeout(saveDebounceTimerRef.current);
          }

          // Debounce sauvegarde (évite trop de writes)
          saveDebounceTimerRef.current = setTimeout(async () => {
            try {
              await savePageToCache(cacheKey, {
                photos: pagePhotos,
                totalPhotos: total
              });
            } catch (err) {
              log.error('Erreur sauvegarde cache IndexedDB', err);
            }
          }, 300); // 300ms debounce
        }
      }
      
      setPhotos(pagePhotos);
      setLoading(false);
      
    } catch (err) {
      log.error('Erreur chargement page photos', err);
      setError(err);
      setPhotos([]);
      setLoading(false);
    }
  }, [page, itemsPerPage, filterBy, data?.progressPhotos, enableCache, evictLRUPage]);
  
  // ✅ Charger page quand dépendances changent
  useEffect(() => {
    loadPage();
  }, [loadPage]);
  
  // ✅ Calculer totalPages
  const totalPages = Math.ceil(totalPhotos / itemsPerPage);
  
  // ✅ PHASE 3.4 : Fonction invalidation cache (mémoire + IndexedDB)
  const invalidateCache = useCallback(async () => {
    log.debug('Invalidation cache photos (mémoire + IndexedDB)');
    
    // Invalider cache mémoire
    pageCacheRef.current.clear();
    lastAccessRef.current.clear();
    
    // Invalider cache IndexedDB (en arrière-plan)
    if (enableCache) {
      invalidateDBCache().catch(err => {
        log.error('Erreur invalidation cache IndexedDB', err);
      });
    }
    
    // Recharger page actuelle
    loadPage();
  }, [loadPage, enableCache]);
  
  return {
    photos,
    loading,
    error,
    totalPages,
    totalPhotos,
    invalidateCache
  };
};

export default usePhotosPaginated;

