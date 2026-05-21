/**
 * Stats de fin de livre, classement parmi les terminés.
 * @module utils/bookCompletionUtils
 */

import {
  aggregateCriteriaMeansForBook,
  computeBookScoreFromSessions,
  suggestedPersonalScoreFromSessions,
} from './bookReadingRatings';

export function computeReadingStatsForBook(book) {
  const sessions = Array.isArray(book?.readingSessions) ? book.readingSessions : [];
  const totalPages = sessions.reduce((s, x) => s + (Number(x.pagesRead) || 0), 0);
  const totalMinutes = sessions.reduce((s, x) => s + (Number(x.durationMinutes) || 0), 0);
  const sessionCount = sessions.length;
  const bookPages = Number(book?.pages) || 0;
  const pagesPerMin =
    totalMinutes > 0 ? Math.round((totalPages / totalMinutes) * 10) / 10 : null;

  return {
    sessionCount,
    totalPages,
    totalMinutes,
    bookPages,
    pagesPerMin,
    progressPercent:
      bookPages > 0 ? Math.min(100, Math.round((totalPages / bookPages) * 100)) : null,
  };
}

/**
 * @param {Array} books
 * @param {string} bookId
 * @returns {{ rank: number, total: number, score: number }|null}
 */
export function getCompletedBookRank(books, bookId) {
  const list = (books || []).filter((b) => b?.status === 'completed');
  if (list.length === 0) return null;

  const scored = list
    .map((b) => ({
      id: b.id,
      score: computeBookScoreFromSessions(b.readingSessions) || 0,
      finishedAt: b.finishedAt || '',
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.finishedAt || '').localeCompare(a.finishedAt || '');
    });

  const idx = scored.findIndex((s) => s.id === bookId);
  if (idx < 0) return null;
  return {
    rank: idx + 1,
    total: scored.length,
    score: scored[idx].score,
  };
}

export function formatRankLabel(rankInfo) {
  if (!rankInfo || rankInfo.total < 1) return null;
  const { rank, total, score } = rankInfo;
  const ord =
    rank === 1 ? '1er' : rank === 2 ? '2e' : rank === 3 ? '3e' : `${rank}e`;
  return {
    line: `Dans ton classement, ce livre est le ${ord} meilleur sur ${total} terminé${total > 1 ? 's' : ''}.`,
    score,
  };
}

/**
 * Note finale affichée : 100 % dérivée des sessions ; le bilan de fin est informatif.
 */
export function resolveFinalBookScore(book, completionCriteriaRatings = null) {
  const fromSessions = computeBookScoreFromSessions(book?.readingSessions);
  if (fromSessions != null && fromSessions > 0) return fromSessions;
  if (completionCriteriaRatings) {
    const agg = aggregateCriteriaMeansForBook([
      { criteriaRatings: completionCriteriaRatings },
    ]);
    return agg?.overall ?? 0;
  }
  return Number(book?.personalScore) || 0;
}

