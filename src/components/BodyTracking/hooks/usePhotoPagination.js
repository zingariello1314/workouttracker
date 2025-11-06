/**
 * ✅ PHASE 2.4 : Hook unifié de pagination photos
 * 
 * Unifie les deux systèmes de pagination :
 * - Pagination classique (mémoire) : < 50 photos
 * - Pagination avec cache LRU : ≥ 50 photos
 * 
 * Avantages :
 * - API unifiée pour les deux cas
 * - Détection automatique du mode optimal
 * - Gestion transparente du cache
 * - Performance optimisée selon taille collection
 * 
 * @param {number} itemsPerPage - Nombre d'items par page
 * @param {string} filterBy - Filtrer par angle ('all', 'front', 'side', 'back')
 * @param {string} viewMode - Mode d'affichage ('grid' ou 'list')
 * 
 * @returns {Object} - Objet avec données et fonctions de pagination unifiées
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useWorkout } from '../../../context/WorkoutContext';
import { usePagination } from './usePagination';
import usePhotosPaginated from './usePhotosPaginated';
import { getPhotoUrl } from '../utils/photoNormalizer';
import logger from '../../../utils/logger';

const log = logger.hook('usePhotoPagination');

// ✅ Seuil pour activer pagination avec cache LRU
const PAGINATION_CACHE_THRESHOLD = 50;

const usePhotoPagination = (itemsPerPage = 12, filterBy = 'all', viewMode = 'grid') => {
  const { data } = useWorkout();
  
  // ✅ Calculer itemsPerPage selon viewMode si non fourni
  const calculatedItemsPerPage = useMemo(() => {
    if (itemsPerPage) return itemsPerPage;
    return viewMode === 'grid' ? 12 : 8;
  }, [itemsPerPage, viewMode]);
  
  // ✅ Détecter automatiquement si pagination avec cache nécessaire
  const totalPhotosCount = useMemo(() => {
    return data?.progressPhotos?.length || 0;
  }, [data?.progressPhotos?.length]);
  
  const useCachePagination = useMemo(() => {
    return totalPhotosCount >= PAGINATION_CACHE_THRESHOLD;
  }, [totalPhotosCount]);
  
  // ✅ État page unifié (utilisé pour les deux modes)
  const [currentPage, setCurrentPage] = useState(1);
  
  // ✅ PHASE 3.2 : Optimisation - Utiliser useMemo avec dépendances stables
  // Créer un hash stable basé sur les IDs des photos pour éviter recalculs inutiles
  const photosHash = useMemo(() => {
    if (!data?.progressPhotos || data.progressPhotos.length === 0) {
      return '';
    }
    // Créer hash simple basé sur IDs et longueur (plus rapide que deep compare)
    return `${data.progressPhotos.length}_${data.progressPhotos.map(p => p.id).join(',')}`;
  }, [data?.progressPhotos]);
  
  // ✅ PHASE 3.2 : Préparer photos pour pagination classique (si < 50)
  // Normaliser et préparer toutes les photos en mémoire avec useMemo optimisé
  const allPhotosNormalized = useMemo(() => {
    if (!data?.progressPhotos || data.progressPhotos.length === 0) {
      return [];
    }
    
    // Filtrer selon angle
    let filtered = data.progressPhotos.filter(photo => {
      if (filterBy === 'all') return true;
      return photo.angle === filterBy;
    });
    
    // Trier par date (plus récent en premier)
    filtered = filtered.sort((a, b) => {
      const dateA = a.date ? new Date(a.date) : (a.timestamp ? new Date(a.timestamp) : new Date(0));
      const dateB = b.date ? new Date(b.date) : (b.timestamp ? new Date(b.timestamp) : new Date(0));
      return dateB - dateA;
    });
    
    // Normaliser structure (compatible avec getPhotoUrl)
    return filtered.map(photo => ({
      id: photo.id,
      // ✅ OPTIMISATION: Préserver structure multi-résolution si présente
      ...(photo.resolutions ? { resolutions: photo.resolutions } : {}),
      url: getPhotoUrl(photo, 'preview'), // Utiliser preview par défaut
      date: photo.date ? new Date(photo.date) : (photo.timestamp ? new Date(photo.timestamp) : new Date()),
      angle: photo.angle || 'front',
      weight: photo.weight,
      notes: photo.notes,
      tags: photo.tags || ['progress'],
      filename: photo.filename,
      type: photo.type,
      analysis: photo.analysis,
      capture: photo.capture,
      measurements: photo.measurements,
      savedAt: photo.savedAt,
      version: photo.version
    }));
  }, [photosHash, filterBy]); // ✅ Dépendances stables : hash + filterBy
  
  // ✅ PHASE 2.4 : Utiliser pagination avec cache LRU si ≥ 50 photos
  const {
    photos: cachedPhotos,
    loading: cacheLoading,
    totalPages: cacheTotalPages,
    totalPhotos: cacheTotalPhotos,
    invalidateCache: invalidateCachePagination
  } = usePhotosPaginated(
    useCachePagination ? currentPage : 1, // Utiliser currentPage seulement si cache activé
    calculatedItemsPerPage,
    {
      filterBy,
      enableCache: true,
      maxCacheSize: 10
    }
  );
  
  // ✅ PHASE 2.4 : Utiliser pagination classique si < 50 photos
  const {
    paginatedItems: classicPhotos,
    currentPage: classicCurrentPage,
    totalPages: classicTotalPages,
    paginationInfo: classicPaginationInfo,
    goToNextPage: classicGoToNextPage,
    goToPrevPage: classicGoToPrevPage,
    goToPage: classicGoToPage,
    goToFirstPage: classicGoToFirstPage,
    goToLastPage: classicGoToLastPage,
    resetPagination: classicResetPagination
  } = usePagination(
    useCachePagination ? [] : allPhotosNormalized, // Utiliser allPhotosNormalized seulement si pas de cache
    {
      itemsPerPage: calculatedItemsPerPage,
      initialPage: 1
    }
  );
  
  // ✅ PHASE 2.4 : Synchroniser currentPage avec pagination classique
  useEffect(() => {
    if (!useCachePagination && classicCurrentPage !== currentPage) {
      setCurrentPage(classicCurrentPage);
    }
  }, [useCachePagination, classicCurrentPage, currentPage]);
  
  // ✅ PHASE 2.4 : API unifiée - Fonctions navigation
  const goToNextPage = useCallback(() => {
    if (useCachePagination) {
      setCurrentPage(prev => Math.min(prev + 1, cacheTotalPages));
    } else {
      classicGoToNextPage();
    }
  }, [useCachePagination, cacheTotalPages, classicGoToNextPage]);
  
  const goToPrevPage = useCallback(() => {
    if (useCachePagination) {
      setCurrentPage(prev => Math.max(prev - 1, 1));
    } else {
      classicGoToPrevPage();
    }
  }, [useCachePagination, classicGoToPrevPage]);
  
  const goToPage = useCallback((page) => {
    if (useCachePagination) {
      const pageNumber = Math.max(1, Math.min(page, cacheTotalPages));
      setCurrentPage(pageNumber);
    } else {
      classicGoToPage(page);
    }
  }, [useCachePagination, cacheTotalPages, classicGoToPage]);
  
  const goToFirstPage = useCallback(() => {
    if (useCachePagination) {
      setCurrentPage(1);
    } else {
      classicGoToFirstPage();
    }
  }, [useCachePagination, classicGoToFirstPage]);
  
  const goToLastPage = useCallback(() => {
    if (useCachePagination) {
      setCurrentPage(cacheTotalPages);
    } else {
      classicGoToLastPage();
    }
  }, [useCachePagination, cacheTotalPages, classicGoToLastPage]);
  
  const resetPagination = useCallback(() => {
    if (useCachePagination) {
      setCurrentPage(1);
      invalidateCachePagination();
    } else {
      classicResetPagination();
    }
  }, [useCachePagination, invalidateCachePagination, classicResetPagination]);
  
  // ✅ PHASE 2.4 : API unifiée - Données
  const photos = useMemo(() => {
    return useCachePagination ? cachedPhotos : classicPhotos;
  }, [useCachePagination, cachedPhotos, classicPhotos]);
  
  const loading = useMemo(() => {
    return useCachePagination ? cacheLoading : false;
  }, [useCachePagination, cacheLoading]);
  
  const totalPages = useMemo(() => {
    return useCachePagination ? cacheTotalPages : classicTotalPages;
  }, [useCachePagination, cacheTotalPages, classicTotalPages]);
  
  const totalPhotos = useMemo(() => {
    return useCachePagination ? cacheTotalPhotos : allPhotosNormalized.length;
  }, [useCachePagination, cacheTotalPhotos, allPhotosNormalized.length]);
  
  const finalCurrentPage = useMemo(() => {
    return useCachePagination ? currentPage : classicCurrentPage;
  }, [useCachePagination, currentPage, classicCurrentPage]);
  
  // ✅ PHASE 2.4 : Informations pagination unifiées
  const paginationInfo = useMemo(() => {
    if (useCachePagination) {
      return {
        currentPage: finalCurrentPage,
        totalPages,
        totalPhotos,
        itemsPerPage: calculatedItemsPerPage,
        startIndex: (finalCurrentPage - 1) * calculatedItemsPerPage,
        endIndex: Math.min(finalCurrentPage * calculatedItemsPerPage, totalPhotos),
        hasNextPage: finalCurrentPage < totalPages,
        hasPrevPage: finalCurrentPage > 1,
        showingItems: photos.length,
        mode: 'cache' // Mode cache LRU
      };
    } else {
      return {
        ...classicPaginationInfo,
        mode: 'classic' // Mode mémoire
      };
    }
  }, [
    useCachePagination,
    finalCurrentPage,
    totalPages,
    totalPhotos,
    calculatedItemsPerPage,
    photos.length,
    classicPaginationInfo
  ]);
  
  // ✅ PHASE 2.4 : Fonction invalidation cache unifiée
  const invalidateCache = useCallback(() => {
    if (useCachePagination) {
      invalidateCachePagination();
      log.info('Cache pagination invalidé (mode cache LRU)');
    } else {
      // En mode classique, pas de cache à invalider
      // Mais on peut réinitialiser la pagination
      classicResetPagination();
      log.info('Pagination réinitialisée (mode classique)');
    }
  }, [useCachePagination, invalidateCachePagination, classicResetPagination]);
  
  // ✅ PHASE 2.4 : Réinitialiser page quand filtre change
  useEffect(() => {
    resetPagination();
  }, [filterBy]); // eslint-disable-line react-hooks/exhaustive-deps
  
  return {
    // Données
    photos,
    loading,
    totalPages,
    totalPhotos,
    currentPage: finalCurrentPage,
    paginationInfo,
    
    // Navigation
    goToNextPage,
    goToPrevPage,
    goToPage,
    goToFirstPage,
    goToLastPage,
    resetPagination,
    
    // Utilitaires
    invalidateCache,
    
    // Métadonnées
    useCachePagination, // Indique si cache LRU est utilisé
    mode: useCachePagination ? 'cache' : 'classic' // Mode actuel
  };
};

export default usePhotoPagination;

