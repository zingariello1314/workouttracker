/**
 * Hook pour la gestion de la pagination des livres
 * 
 * ✅ PHASE 4 : Extraction de la logique de pagination
 * 
 * @module components/tabs/BooksTab/hooks/useBooksPagination
 */

import { useState, useMemo, useCallback } from 'react';
import { PAGE_SIZE } from '../constants';

/**
 * Hook pour gérer la pagination des livres
 * 
 * @param {Array} filteredLibraryBooks - Livres en cours filtrés
 * @param {Array} filteredCompletedBooks - Livres terminés filtrés
 * @param {Array} filteredToReadBooks - Livres à lire filtrés
 * @returns {Object} { pageInProgress, setPageInProgress, pageCompleted, setPageCompleted, pageToRead, setPageToRead, paginatedInProgressBooks, paginatedCompletedBooks, paginatedToReadBooks }
 */
export const useBooksPagination = (
  filteredLibraryBooks = [],
  filteredCompletedBooks = [],
  filteredToReadBooks = []
) => {
  const [pageInProgress, setPageInProgress] = useState(0);
  const [pageCompleted, setPageCompleted] = useState(0);
  const [pageToRead, setPageToRead] = useState(0);

  const paginatedInProgressBooks = useMemo(() => {
    const start = pageInProgress * PAGE_SIZE;
    return filteredLibraryBooks.slice(start, start + PAGE_SIZE);
  }, [filteredLibraryBooks, pageInProgress]);

  const paginatedCompletedBooks = useMemo(() => {
    const start = pageCompleted * PAGE_SIZE;
    return filteredCompletedBooks.slice(start, start + PAGE_SIZE);
  }, [filteredCompletedBooks, pageCompleted]);

  const paginatedToReadBooks = useMemo(() => {
    const start = pageToRead * PAGE_SIZE;
    return filteredToReadBooks.slice(start, start + PAGE_SIZE);
  }, [filteredToReadBooks, pageToRead]);

  return {
    pageInProgress,
    setPageInProgress,
    pageCompleted,
    setPageCompleted,
    pageToRead,
    setPageToRead,
    paginatedInProgressBooks,
    paginatedCompletedBooks,
    paginatedToReadBooks,
  };
};
