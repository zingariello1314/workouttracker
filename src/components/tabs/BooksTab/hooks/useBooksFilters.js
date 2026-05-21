/**
 * Hook pour la gestion des filtres, recherche et tri des livres
 * 
 * ✅ PHASE 4 : Extraction de la logique de filtres
 * 
 * @module components/tabs/BooksTab/hooks/useBooksFilters
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { SORT_MODES, PAGE_SIZE } from '../constants';
import { normalizeBookGenre } from '../../../../data/bookGenres';

/**
 * Hook de debounce personnalisé
 */
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook pour gérer les filtres, recherche et tri des livres
 * 
 * @param {Array} books - Liste de tous les livres
 * @returns {Object} { search, setSearch, filterGenre, setFilterGenre, ...filteredAndSortedBooks }
 */
export const useBooksFilters = (books = []) => {
  const [search, setSearch] = useState('');
  const [filterGenre, setFilterGenre] = useState('');
  const [filterMinYear, setFilterMinYear] = useState('');
  const [filterMaxYear, setFilterMaxYear] = useState('');
  const [filterMinScore, setFilterMinScore] = useState('');
  const [sortMode, setSortMode] = useState(SORT_MODES.RECENT);

  const debouncedSearch = useDebounce(search, 300);
  const debouncedMinYear = useDebounce(filterMinYear, 200);
  const debouncedMaxYear = useDebounce(filterMaxYear, 200);
  const debouncedMinScore = useDebounce(filterMinScore, 200);

  const filteredAndSortedBooks = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const minYear = debouncedMinYear ? Number(debouncedMinYear) || null : null;
    const maxYear = debouncedMaxYear ? Number(debouncedMaxYear) || null : null;
    const minScore = debouncedMinScore ? Number(debouncedMinScore) || 0 : 0;
    const genreQuery = filterGenre.trim().toLowerCase();

    const matchesSearch = (book) => {
      if (!q) return true;
      const haystack = `${book.title || ''} ${book.author || ''} ${book.genre || ''}`.toLowerCase();
      return haystack.includes(q);
    };

    const matchesGenre = (book) => {
      if (!genreQuery) return true;
      const bookGenre = normalizeBookGenre(book.genre).toLowerCase();
      return bookGenre === genreQuery;
    };

    const matchesYear = (book) => {
      const y = Number(book.year) || null;
      if (!y) return true;
      if (minYear !== null && y < minYear) return false;
      if (maxYear !== null && y > maxYear) return false;
      return true;
    };

    const matchesScore = (book) => {
      const score = Number(book.personalScore) || 0;
      if (!minScore) return true;
      return score >= minScore;
    };

    const sortFn = (a, b) => {
      switch (sortMode) {
        case SORT_MODES.TITLE: {
          return (a.title || '').localeCompare(b.title || '', undefined, {
            sensitivity: 'base',
          });
        }
        case SORT_MODES.AUTHOR: {
          return (a.author || '').localeCompare(b.author || '', undefined, {
            sensitivity: 'base',
          });
        }
        case SORT_MODES.PAGES: {
          const pa = Number(a.pages) || 0;
          const pb = Number(b.pages) || 0;
          return pb - pa;
        }
        case SORT_MODES.SCORE: {
          const sa = Number(a.personalScore) || 0;
          const sb = Number(b.personalScore) || 0;
          return sb - sa;
        }
        case SORT_MODES.RECENT:
        default: {
          const da = a.createdAt ? Date.parse(a.createdAt) : 0;
          const db = b.createdAt ? Date.parse(b.createdAt) : 0;
          return db - da;
        }
      }
    };

    return [...books]
      .filter(matchesSearch)
      .filter(matchesGenre)
      .filter(matchesYear)
      .filter(matchesScore)
      .sort(sortFn);
  }, [books, debouncedSearch, filterGenre, debouncedMinYear, debouncedMaxYear, debouncedMinScore, sortMode]);

  return {
    search,
    setSearch,
    filterGenre,
    setFilterGenre,
    filterMinYear,
    setFilterMinYear,
    filterMaxYear,
    setFilterMaxYear,
    filterMinScore,
    setFilterMinScore,
    sortMode,
    setSortMode,
    filteredAndSortedBooks,
  };
};
