/**
 * 🔢 HOOK DE PAGINATION RÉUTILISABLE
 * 
 * Hook optimisé pour gérer la pagination de listes avec :
 * - Calcul automatique du nombre de pages
 * - Navigation entre pages
 * - Option de taille de page personnalisable
 * - Performance optimisée avec useMemo
 */

import { useState, useMemo, useCallback } from 'react';

/**
 * Hook de pagination
 * @param {Array} items - Liste d'éléments à paginer
 * @param {Object} options - Options de pagination
 * @param {number} options.itemsPerPage - Nombre d'éléments par page (défaut: 12)
 * @param {number} options.initialPage - Page initiale (défaut: 1)
 * @returns {Object} - Objet avec données et fonctions de pagination
 */
export const usePagination = (items = [], options = {}) => {
  const {
    itemsPerPage = 12,
    initialPage = 1
  } = options;

  const [currentPage, setCurrentPage] = useState(initialPage);

  // Calculer nombre total de pages (MEMOIZED)
  const totalPages = useMemo(() => {
    if (!items || items.length === 0) return 0;
    return Math.ceil(items.length / itemsPerPage);
  }, [items, itemsPerPage]);

  // Calculer index de début et fin (MEMOIZED)
  const { startIndex, endIndex } = useMemo(() => {
    if (!items || items.length === 0) {
      return { startIndex: 0, endIndex: 0 };
    }
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = Math.min(start + itemsPerPage, items.length);
    
    return { startIndex: start, endIndex: end };
  }, [currentPage, itemsPerPage, items.length]);

  // Obtenir les éléments de la page actuelle (MEMOIZED)
  const paginatedItems = useMemo(() => {
    if (!items || items.length === 0) return [];
    return items.slice(startIndex, endIndex);
  }, [items, startIndex, endIndex]);

  // Navigation vers page suivante
  const goToNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  // Navigation vers page précédente
  const goToPrevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  }, []);

  // Aller à une page spécifique
  const goToPage = useCallback((page) => {
    const pageNumber = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(pageNumber);
  }, [totalPages]);

  // Aller à la première page
  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  // Aller à la dernière page
  const goToLastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  // Réinitialiser à la page 1 si items change significativement
  const resetPagination = useCallback(() => {
    setCurrentPage(1);
  }, []);

  // Informations de pagination
  const paginationInfo = useMemo(() => {
    if (!items || items.length === 0) {
      return {
        currentPage: 0,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage,
        startIndex: 0,
        endIndex: 0,
        hasNextPage: false,
        hasPrevPage: false,
        showingItems: 0
      };
    }

    return {
      currentPage,
      totalPages,
      totalItems: items.length,
      itemsPerPage,
      startIndex: startIndex + 1, // 1-indexed pour affichage
      endIndex,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
      showingItems: paginatedItems.length
    };
  }, [currentPage, totalPages, items?.length, itemsPerPage, startIndex, endIndex, paginatedItems.length]);

  return {
    // Données paginées
    paginatedItems,
    currentPage,
    totalPages,
    paginationInfo,
    
    // Fonctions de navigation
    goToNextPage,
    goToPrevPage,
    goToPage,
    goToFirstPage,
    goToLastPage,
    resetPagination,
    setCurrentPage
  };
};

