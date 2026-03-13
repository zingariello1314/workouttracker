/**
 * Constantes pour BooksTab
 * 
 * ✅ PHASE 4 : Extraction des constantes
 * 
 * @module components/tabs/BooksTab/constants
 */

export const emptyBookForm = {
  id: null,
  title: '',
  author: '',
  year: '',
  genre: '',
  pages: '',
  status: 'in-progress', // 'in-progress' | 'completed' | 'to-read' | 'abandoned' | 'paused'
  shortSummary: '',
  longSummary: '',
  personalScore: 0,
};

export const emptySessionForm = {
  date: '',
  durationMinutes: '',
  pagesRead: '',
  startTime: '',
  note: '',
};

export const PAGE_SIZE = 30;

export const SORT_MODES = {
  RECENT: 'recent',
  TITLE: 'title',
  AUTHOR: 'author',
  PAGES: 'pages',
  SCORE: 'score',
};
