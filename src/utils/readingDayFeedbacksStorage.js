/**
 * Ressenti / feedback global par jour de lecture (persisté localStorage).
 * Clé : YYYY-MM-DD. Si `filled === true` : +2 intensité case, +20 XP (voir booksCalendarMetrics / useBooksXP).
 */
const STORAGE_KEY = 'momentum_reading_day_feedbacks';

/**
 * @returns {Record<string, { note?: string, filled?: boolean, updatedAt?: string }>}
 */
export function loadReadingDayFeedbacks() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw);
    return p && typeof p === 'object' && !Array.isArray(p) ? p : {};
  } catch {
    return {};
  }
}

export function saveReadingDayFeedbacks(map) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map || {}));
  } catch (e) {
    console.warn('[readingDayFeedbacksStorage] Sauvegarde impossible', e);
  }
}

export function isReadingDayFeedbackFilled(entry) {
  if (!entry || typeof entry !== 'object') return false;
  if (entry.filled === true) return true;
  const n = (entry.note || '').trim();
  return n.length >= 12;
}

/** +20 XP par jour où le ressenti est rempli et au moins une session de lecture existe. */
export function computeBooksDayFeedbackXpBonus(books) {
  const feedbacks = loadReadingDayFeedbacks();
  const datesWithSessions = new Set();
  (books || []).forEach((b) => {
    (b?.readingSessions || []).forEach((s) => {
      const d = (s?.date || '').toString().trim().slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) datesWithSessions.add(d);
    });
  });
  let n = 0;
  Object.entries(feedbacks).forEach(([d, v]) => {
    if (!datesWithSessions.has(d)) return;
    if (isReadingDayFeedbackFilled(v)) n += 1;
  });
  return n * 20;
}
