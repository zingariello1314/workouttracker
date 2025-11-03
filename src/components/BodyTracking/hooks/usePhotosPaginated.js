import { useState, useEffect, useRef, useCallback } from 'react';
import { useWorkout } from '../../../context/WorkoutContext';
import { getPhotoUrl } from '../utils/photoNormalizer';
import logger from '../../../utils/logger';

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
  
  // ✅ Cache LRU: Map avec accès ordre insertion
  const pageCacheRef = useRef(new Map());
  const lastAccessRef = useRef(new Map()); // Pour vrai LRU (Least Recently Used)
  
  // ✅ Fonction éviction LRU: supprimer page la moins récemment utilisée
  const evictLRUPage = useCallback(() => {
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
    
    // Évincer page la plus ancienne
    if (oldestPage !== null) {
      log.debug(`Éviction LRU: page ${oldestPage} (accès: ${new Date(oldestAccessTime).toISOString()})`);
      pageCacheRef.current.delete(oldestPage);
      lastAccessRef.current.delete(oldestPage);
    }
  }, [maxCacheSize]);
  
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
      
      // ✅ Vérifier cache d'abord
      const cacheKey = `${page}_${filterBy}`;
      if (enableCache && pageCacheRef.current.has(cacheKey)) {
        log.debug(`Cache hit: page ${page}, filter ${filterBy}`);
        const cachedData = pageCacheRef.current.get(cacheKey);
        setPhotos(cachedData.photos);
        setTotalPhotos(cachedData.totalPhotos);
        setLoading(false);
        
        // ✅ Mettre à jour timestamp accès (LRU)
        lastAccessRef.current.set(cacheKey, Date.now());
        return;
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
      
      // ✅ Mettre en cache si activé
      if (enableCache) {
        // Évincer si nécessaire
        evictLRUPage();
        
        // Ajouter au cache
        const cacheData = {
          photos: pagePhotos,
          totalPhotos: total,
          timestamp: Date.now()
        };
        
        pageCacheRef.current.set(cacheKey, cacheData);
        lastAccessRef.current.set(cacheKey, Date.now());
        
        log.debug(`Cache miss → Cached: page ${page}, filter ${filterBy} (${pagePhotos.length} photos)`);
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
  
  // ✅ Fonction invalidation cache (utile après ajout/suppression photo)
  const invalidateCache = useCallback(() => {
    log.debug('Invalidation cache photos');
    pageCacheRef.current.clear();
    lastAccessRef.current.clear();
    // Recharger page actuelle
    loadPage();
  }, [loadPage]);
  
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

