/**
 * Normalisation des livres et sessions avant persistance (IndexedDB / localStorage).
 */

import { normalizeBookGenre } from '../data/bookGenres';
import { normalizeCriteriaRatings } from './bookReadingRatings';

const DEFAULT_CRITERIA = {
  immersion: 5,
  rythme: 5,
  richesse: 5,
  concentration: 5,
  plaisir: 5,
};

/**
 * @param {object} session
 * @param {number} index
 * @returns {object}
 */
export function normalizeReadingSession(session, index = 0) {
  if (!session || typeof session !== 'object') {
    return {
      id: `session_${Date.now()}_${index}`,
      date: new Date().toISOString().slice(0, 10),
      durationMinutes: 0,
      pagesRead: 0,
      startTime: '',
      note: '',
      criteriaRatings: { ...DEFAULT_CRITERIA },
    };
  }

  const dateRaw = session.date || new Date().toISOString().slice(0, 10);
  const dateStr =
    typeof dateRaw === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateRaw)
      ? dateRaw.slice(0, 10)
      : new Date().toISOString().slice(0, 10);

  return {
    id:
      typeof session.id === 'string' && session.id.trim()
        ? session.id.trim()
        : `session_${Date.now()}_${index}`,
    date: dateStr,
    durationMinutes: Math.max(0, Number(session.durationMinutes) || 0),
    pagesRead: Math.max(0, Number(session.pagesRead) || 0),
    startTime: typeof session.startTime === 'string' ? session.startTime : '',
    note: typeof session.note === 'string' ? session.note : '',
    criteriaRatings: normalizeCriteriaRatings(session.criteriaRatings || DEFAULT_CRITERIA),
  };
}

/**
 * @param {object} book
 * @returns {object}
 */
export function normalizeBookForPersistence(book) {
  if (!book || typeof book !== 'object') return book;

  const sessions = Array.isArray(book.readingSessions) ? book.readingSessions : [];
  const normalizedSessions = sessions.map((s, i) => normalizeReadingSession(s, i));

  const now = new Date().toISOString();

  return {
    ...book,
    id: book.id,
    title: book.title ?? '',
    author: book.author ?? '',
    year: book.year ?? '',
    genre: normalizeBookGenre(book.genre),
    pages: book.pages ?? '',
    status: book.status ?? 'in-progress',
    shortSummary: book.shortSummary ?? book.notes ?? '',
    longSummary: book.longSummary ?? '',
    notes: book.notes ?? book.shortSummary ?? '',
    personalScore:
      typeof book.personalScore === 'number' && !Number.isNaN(book.personalScore)
        ? book.personalScore
        : 0,
    readingSessions: normalizedSessions,
    hasPdf: book.hasPdf === true || book.hasPdf === 'true' || book.hasPdf === 1,
    hasCover: !!book.hasCover || !!book.coverInline,
    coverUrl: book.coverUrl ?? '',
    coverInline: book.coverInline ?? null,
    completionReview:
      book.completionReview && typeof book.completionReview === 'object'
        ? book.completionReview
        : undefined,
    finishedAt: book.finishedAt ?? null,
    createdAt: book.createdAt || now,
    updatedAt: book.updatedAt || book.createdAt || now,
    version: book.version || '1.2',
    userId: book.userId || undefined,
  };
}

/**
 * @param {Array} books
 * @returns {Array}
 */
export function normalizeBooksForPersistence(books) {
  if (!Array.isArray(books)) return [];
  return books.map(normalizeBookForPersistence);
}
