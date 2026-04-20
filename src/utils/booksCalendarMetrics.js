/**
 * Agrégation des sessions de lecture par jour (tous les livres).
 * @module utils/booksCalendarMetrics
 */

import { averageCriteriaScore, getBookDisplayRating } from './bookReadingRatings';
import { isReadingDayFeedbackFilled } from './readingDayFeedbacksStorage';

/** Même forme minimale que le calendrier quêtes / sport pour getDayColorStyle */
export function createNeutralBooksIntensity() {
  return {
    level: 0,
    reps: 0,
    trainingLoad: 0,
    strengthLoad: 0,
    duration: 0,
    exerciseCount: 0,
    completedCount: 0,
    intensityScore: 0,
    completionRate: 0,
    activeKcal: 0,
    kcalRefMedian: 0,
    steps: 0,
    stepsRefMedian: 0,
    intensityMinutesTotal: 0,
    visualContext: { composite01: 0, visualScore100: 0 },
    enduranceData: { reps: 0, duration: 0, distance: 0, jumps: 0, sessions: 0 },
    garminIcons: [],
    exercises: 0,
    session: null,
    bookData: null,
  };
}

/**
 * @param {Array} books
 * @returns {Map<string, { sessions: number, pages: number, minutes: number, entries: Array }>}
 */
export function buildBooksSessionsByDate(books) {
  const map = new Map();
  for (const book of books || []) {
    const title = book?.title || book?.nom || 'Livre';
    for (const s of book?.readingSessions || []) {
      const raw = (s?.date || '').toString().trim().slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) continue;
      const cur = map.get(raw) || {
        sessions: 0,
        pages: 0,
        minutes: 0,
        entries: [],
        sumSessionCriteria: 0,
        ratedSessions: 0,
        bookIds: new Set(),
      };
      cur.sessions += 1;
      cur.pages += Number(s.pagesRead) || 0;
      cur.minutes += Number(s.durationMinutes) || 0;
      cur.bookIds.add(book.id);
      const critAvg = averageCriteriaScore(s?.criteriaRatings);
      if (Number.isFinite(critAvg) && critAvg > 0) {
        cur.sumSessionCriteria += critAvg;
        cur.ratedSessions += 1;
      }
      cur.entries.push({
        bookTitle: title,
        bookId: book.id,
        sessionId: s.id || null,
        pagesRead: Number(s.pagesRead) || 0,
        durationMinutes: Number(s.durationMinutes) || 0,
        startTime: s.startTime || '',
        note: s.note || '',
        sessionScore: s.sessionScore,
        criteriaRatings: s.criteriaRatings && typeof s.criteriaRatings === 'object' ? { ...s.criteriaRatings } : undefined,
      });
      map.set(raw, cur);
    }
  }
  return map;
}

/**
 * Score pour comparer les jours : volume + qualité perçue + diversité des livres,
 * avec courbe légèrement concave pour éviter qu’un seul chiffre écrase le reste (proche du sport).
 */
export function booksDayPerformanceScore(day) {
  if (!day || day.sessions <= 0) return 0;
  const nBooks = day.bookIds && typeof day.bookIds.size === 'number' ? day.bookIds.size : 1;
  const diversity = Math.min(nBooks * 14, 52);
  const avgCrit =
    day.ratedSessions > 0 ? day.sumSessionCriteria / day.ratedSessions : 5;
  const quality = 12 + (avgCrit - 5) * 9;
  const base = day.pages * 1.75 + day.minutes * 1.08 + day.sessions * 26 + diversity + quality;
  return Math.pow(Math.max(0, base), 0.94);
}

export function computeBooksIntensityForDate(dateStr, sessionsByDate, dayFeedbacks = null) {
  const neutral = createNeutralBooksIntensity();
  if (!dateStr) return neutral;
  const day = sessionsByDate.get(dateStr);
  if (!day || day.sessions <= 0) {
    return {
      ...neutral,
      bookData: {
        dateStr,
        sessions: 0,
        pages: 0,
        minutes: 0,
        entries: [],
        uniqueBooks: 0,
      },
    };
  }
  let intensityScore = booksDayPerformanceScore(day);
  const fb = dayFeedbacks && typeof dayFeedbacks === 'object' ? dayFeedbacks[dateStr] : null;
  if (fb && isReadingDayFeedbackFilled(fb)) {
    intensityScore += 2;
  }
  return {
    ...neutral,
    intensityScore,
    duration: Math.round(day.minutes),
    completedCount: day.sessions,
    exerciseCount: day.sessions,
    trainingLoad: day.minutes,
    bookData: {
      dateStr,
      sessions: day.sessions,
      pages: day.pages,
      minutes: day.minutes,
      entries: day.entries,
      uniqueBooks: day.bookIds && day.bookIds.size ? day.bookIds.size : 0,
    },
  };
}

export function sumBooksPagesForMonth(year, monthIndex, sessionsByDate) {
  if (!sessionsByDate || typeof sessionsByDate.forEach !== 'function') return 0;
  const y = String(year);
  const m = String(monthIndex + 1).padStart(2, '0');
  const prefix = `${y}-${m}-`;
  let sum = 0;
  sessionsByDate.forEach((day, ds) => {
    if (!ds || !ds.startsWith(prefix)) return;
    sum += day?.pages || 0;
  });
  return sum;
}

/**
 * Statistiques « bibliothèque » pour le bandeau calendrier (tous les livres).
 * @param {Array} books
 */
export function computeBooksLibraryCalendarStats(books) {
  const list = Array.isArray(books) ? books : [];
  let totalMinutes = 0;
  let totalPagesFromSessions = 0;

  const bookAgg = list.map((book) => {
    const sessions = Array.isArray(book?.readingSessions) ? book.readingSessions : [];
    const mins = sessions.reduce((s, x) => s + (Number(x.durationMinutes) || 0), 0);
    const pages = sessions.reduce((s, x) => s + (Number(x.pagesRead) || 0), 0);
    totalMinutes += mins;
    totalPagesFromSessions += pages;

    let pph = 0;
    if (mins > 0 && pages > 0) {
      pph = (pages / mins) * 60;
    }

    const dates = sessions
      .map((s) => (s.date || '').toString().slice(0, 10))
      .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
      .sort();
    const spanDays =
      dates.length >= 2
        ? Math.max(
            1,
            Math.round(
              (new Date(`${dates[dates.length - 1]}T12:00:00`) -
                new Date(`${dates[0]}T12:00:00`)) /
                (86400000)
            ) + 1
          )
        : null;

    const totalP = Number(book.pages) || 0;
    const completionPph = totalP > 0 && mins > 0 ? (totalP / mins) * 60 : pph;

    return { book, sessions, mins, pages, pph, completionPph, spanDays, sessionCount: sessions.length };
  });

  const pagesPerHour =
    totalMinutes > 0 ? Math.round(((totalPagesFromSessions / totalMinutes) * 60) * 10) / 10 : 0;

  const finished = bookAgg.filter((x) => x.book.status === 'completed');
  const finishedCount = finished.length;

  const inProgressWithSession = bookAgg.filter(
    (x) => x.book.status === 'in-progress' && x.sessionCount > 0
  ).length;

  const startedWithSession = bookAgg.filter((x) => x.sessionCount > 0).length;

  const fastest = bookAgg
    .filter((x) => x.sessionCount > 0 && x.mins >= 20 && x.pages >= 10)
    .sort((a, b) => b.pph - a.pph)[0];

  const fastestCompletion = finished
    .filter((x) => x.spanDays != null && x.spanDays >= 1 && x.mins >= 15)
    .sort((a, b) => b.completionPph - a.completionPph)[0];

  const pickFast = fastestCompletion || fastest;

  const mostLiked = [...bookAgg]
    .map((x) => ({ ...x, disp: getBookDisplayRating(x.book) }))
    .filter((x) => x.disp.value > 0)
    .sort((a, b) => b.disp.value - a.disp.value)[0];

  const mostTime = [...bookAgg].filter((x) => x.mins > 0).sort((a, b) => b.mins - a.mins)[0];

  return {
    finishedCount,
    pagesPerHour,
    fastestBook: pickFast?.book || null,
    fastestPph: pickFast ? Math.round(pickFast.pph * 10) / 10 : null,
    mostLikedBook: mostLiked?.book || null,
    mostLikedScore: mostLiked ? mostLiked.disp.value : 0,
    inProgressWithSession,
    startedWithSession,
    mostTimeBook: mostTime?.book || null,
    mostTimeMinutes: mostTime?.mins || 0,
  };
}

export function sumBooksMinutesForMonth(year, monthIndex, sessionsByDate) {
  if (!sessionsByDate || typeof sessionsByDate.forEach !== 'function') return 0;
  const y = String(year);
  const m = String(monthIndex + 1).padStart(2, '0');
  const prefix = `${y}-${m}-`;
  let sum = 0;
  sessionsByDate.forEach((day, ds) => {
    if (!ds || !ds.startsWith(prefix)) return;
    sum += day?.minutes || 0;
  });
  return sum;
}
