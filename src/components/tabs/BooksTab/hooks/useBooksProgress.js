/**
 * Hook pour calculer la progression des livres
 * 
 * ✅ PHASE 4 : Extraction de la logique de progression
 * 
 * @module components/tabs/BooksTab/hooks/useBooksProgress
 */

import { useMemo } from 'react';

/**
 * Hook pour calculer la progression des livres
 * 
 * @param {Array} books - Liste de tous les livres
 * @param {Array} filteredAndSortedBooks - Livres filtrés et triés
 * @returns {Object} { booksWithProgress, filteredAndSortedBooksWithProgress, filteredLibraryBooks, filteredCompletedBooks, filteredToReadBooks }
 */
export const useBooksProgress = (books = [], filteredAndSortedBooks = []) => {
  const booksWithProgress = useMemo(() => {
    return books.map((book) => {
      const totalPages = Number(book.pages) || 0;
      let progressPercent = null;
      
      if (totalPages > 0) {
        const totalPagesRead = (book.readingSessions || []).reduce(
          (sum, s) => sum + (Number(s.pagesRead) || 0),
          0
        );
        if (totalPagesRead > 0) {
          progressPercent = Math.min(100, Math.round((totalPagesRead / totalPages) * 100));
        } else {
          progressPercent = 0;
        }
      }
      
      return {
        ...book,
        _progressPercent: progressPercent,
      };
    });
  }, [books]);

  const filteredAndSortedBooksWithProgress = useMemo(() => {
    return filteredAndSortedBooks.map((book) => {
      const bookWithProgress = booksWithProgress.find((b) => b.id === book.id);
      return bookWithProgress || book;
    });
  }, [filteredAndSortedBooks, booksWithProgress]);

  const filteredLibraryBooks = useMemo(
    () => filteredAndSortedBooksWithProgress.filter((b) => b.status === 'in-progress'),
    [filteredAndSortedBooksWithProgress]
  );

  const filteredCompletedBooks = useMemo(
    () => filteredAndSortedBooksWithProgress.filter((b) => b.status === 'completed'),
    [filteredAndSortedBooksWithProgress]
  );

  const filteredToReadBooks = useMemo(
    () => filteredAndSortedBooksWithProgress.filter((b) => b.status === 'to-read'),
    [filteredAndSortedBooksWithProgress]
  );

  return {
    booksWithProgress,
    filteredAndSortedBooksWithProgress,
    filteredLibraryBooks,
    filteredCompletedBooks,
    filteredToReadBooks,
  };
};
