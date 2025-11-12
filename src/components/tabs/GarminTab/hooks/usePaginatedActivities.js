/**
 * Hook pour gérer la pagination et la virtualisation des activités Garmin.
 * 
 * Optimise le rendu des listes d'activités en utilisant la virtualisation
 * pour les listes >100 items, réduisant le coût de rendu initial.
 * 
 * @module usePaginatedActivities
 */

import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { PAGINATION } from '../constants';

/**
 * Génère une clé de stabilité pour un tableau d'activités basée sur les IDs.
 * Permet de détecter les changements réels de contenu même si la référence du tableau change.
 * 
 * @param {Array} activities - Tableau d'activités
 * @returns {string} Clé de stabilité
 */
function getActivitiesStabilityKey(activities) {
  if (!Array.isArray(activities) || activities.length === 0) {
    return 'empty';
  }
  
  // Créer une clé basée sur les IDs et dates des activités
  // Stratégie : prendre les 10 premiers + les 10 derniers pour détecter ajouts/suppressions
  // + la longueur totale pour détecter changements de taille
  const firstKeys = activities
    .slice(0, 10)
    .map(act => act.id || `${act.date}_${act.time || ''}_${act.type || ''}`)
    .join('|');
  
  const lastKeys = activities.length > 10
    ? activities
        .slice(-10)
        .map(act => act.id || `${act.date}_${act.time || ''}_${act.type || ''}`)
        .join('|')
    : '';
  
  return `${activities.length}_${firstKeys}${lastKeys ? `_${lastKeys}` : ''}`;
}

/**
 * Hook pour gérer la pagination des activités avec virtualisation optionnelle.
 * 
 * @param {Object} params
 * @param {Array} params.allActivities - Toutes les activités à paginer
 * @param {number} params.itemsPerPage - Nombre d'items par page (défaut: PAGINATION.ACTIVITIES_PER_PAGE)
 * @param {boolean} params.enableVirtualization - Activer la virtualisation pour listes >100 items (défaut: true)
 * @param {number} params.virtualizationThreshold - Seuil pour activer la virtualisation (défaut: 100)
 * @returns {Object} État et fonctions de pagination
 */
export const usePaginatedActivities = ({
  allActivities = [],
  itemsPerPage = PAGINATION.ACTIVITIES_PER_PAGE,
  enableVirtualization = true,
  virtualizationThreshold = 100
}) => {
  const [currentPage, setCurrentPage] = useState(PAGINATION.INITIAL_PAGE);
  
  // Créer une clé de stabilité pour détecter les vrais changements de contenu
  const activitiesKey = useMemo(() => getActivitiesStabilityKey(allActivities), [allActivities]);
  const previousKeyRef = useRef(activitiesKey);
  
  // Calculer le total de pages
  const totalPages = useMemo(() => {
    return Math.ceil(allActivities.length / itemsPerPage);
  }, [allActivities.length, itemsPerPage]);

  // Déterminer si la virtualisation doit être activée
  const shouldVirtualize = useMemo(() => {
    return enableVirtualization && allActivities.length > virtualizationThreshold;
  }, [enableVirtualization, allActivities.length, virtualizationThreshold]);

  // Calculer les activités paginées (pour mode non-virtualisé)
  // Utiliser activitiesKey comme déclencheur, mais garder allActivities pour le slice
  const paginatedActivities = useMemo(() => {
    if (shouldVirtualize) {
      // En mode virtualisé, retourner toutes les activités (la virtualisation gère l'affichage)
      return allActivities;
    }
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return allActivities.slice(startIndex, endIndex);
    // Note: allActivities est nécessaire pour le slice, mais activitiesKey déclenche le recalcul
  }, [activitiesKey, currentPage, itemsPerPage, shouldVirtualize, allActivities]);

  // Calculer les indices pour l'affichage
  const paginationInfo = useMemo(() => {
    if (shouldVirtualize) {
      return {
        startIndex: 0,
        endIndex: allActivities.length,
        total: allActivities.length,
        currentPage: 1,
        totalPages: 1
      };
    }
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, allActivities.length);
    
    return {
      startIndex,
      endIndex,
      total: allActivities.length,
      currentPage,
      totalPages
    };
  }, [allActivities.length, currentPage, itemsPerPage, totalPages, shouldVirtualize]);

  // Fonctions de navigation
  const goToPage = useCallback((page) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  }, [totalPages]);

  const goToNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const goToPreviousPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  }, []);

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToLastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  // Reset à la page 1 quand les activités changent réellement
  useEffect(() => {
    const hasChanged = previousKeyRef.current !== activitiesKey;
    if (hasChanged && !shouldVirtualize) {
      setCurrentPage(PAGINATION.INITIAL_PAGE);
      previousKeyRef.current = activitiesKey;
    } else if (hasChanged) {
      previousKeyRef.current = activitiesKey;
    }
  }, [activitiesKey, shouldVirtualize]);

  return {
    // Données
    paginatedActivities,
    allActivities,
    
    // État de pagination
    currentPage,
    totalPages,
    itemsPerPage,
    
    // Info d'affichage
    paginationInfo,
    
    // Mode virtualisation
    shouldVirtualize,
    
    // Fonctions de navigation
    goToPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    setCurrentPage
  };
};

export default usePaginatedActivities;

