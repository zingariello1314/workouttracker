/**
 * Deep link Récap grades → Calendrier sport (jour ouvert + ancre sur la coche).
 */

import { forEachEnduranceBenchmarkSession } from '../../services/xp/exerciseGradeEnduranceBridge';

export const CALENDAR_DAY_EXERCISES_SECTION_ID = 'calendar-day-exercise-detail';
export const CALENDAR_RECORD_SPOTLIGHT_CLASS = 'calendar-record-spotlight';

const FALLBACK_ANCHOR_IDS = [
  CALENDAR_DAY_EXERCISES_SECTION_ID,
  'calendar-day-holistic-detail'
];

export function calendarExerciseRecordElementId(storageKey) {
  if (!storageKey) return null;
  return `cal-ex-${String(storageKey).replace(/[^a-zA-Z0-9_-]/g, '_')}`;
}

export function calendarEnduranceHistoryElementId(historyRowId) {
  if (!historyRowId) return null;
  return `cal-end-h-${String(historyRowId).replace(/[^a-zA-Z0-9_:.-]/g, '_')}`;
}

/** Même id que {@link collectCatalogCheckHistory} / suppression d’historique. */
export function resolveEnduranceHistoryRowId(snapshot, session, benchmarkKey = 'pushups') {
  if (!session) return null;
  let idx = 0;
  let match = null;
  forEachEnduranceBenchmarkSession(snapshot, benchmarkKey, ({ dateStr, session: s }) => {
    const id = `e:${dateStr}:${idx}:${s?.id ?? idx}`;
    if (s === session) match = id;
    idx += 1;
  });
  return match;
}

/**
 * @param {{ id?: string, dateStr?: string, source?: string }} row
 * @returns {{ dateYmd: string, scrollAnchor: string } | null}
 */
export function calendarDeepLinkFromCheckHistoryRow(row) {
  if (!row?.dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(String(row.dateStr))) return null;

  if (row.source === 'workout' && String(row.id || '').startsWith('w:')) {
    const storageKey = String(row.id).slice(2);
    return {
      dateYmd: row.dateStr,
      scrollAnchor: calendarExerciseRecordElementId(storageKey) || CALENDAR_DAY_EXERCISES_SECTION_ID
    };
  }

  if (row.source === 'endurance' && String(row.id || '').startsWith('e:')) {
    return {
      dateYmd: row.dateStr,
      scrollAnchor: calendarEnduranceHistoryElementId(row.id) || CALENDAR_DAY_EXERCISES_SECTION_ID
    };
  }

  return {
    dateYmd: row.dateStr,
    scrollAnchor: CALENDAR_DAY_EXERCISES_SECTION_ID
  };
}

function applyRecordSpotlight(el) {
  if (!el?.classList) return;
  el.classList.remove(CALENDAR_RECORD_SPOTLIGHT_CLASS);
  // reflow pour relancer l’animation si clic répété
  void el.offsetWidth;
  el.classList.add(CALENDAR_RECORD_SPOTLIGHT_CLASS);
  window.setTimeout(() => {
    el.classList.remove(CALENDAR_RECORD_SPOTLIGHT_CLASS);
  }, 3600);
}

/**
 * Scroll + pulse sur l’enregistrement (réessais tant que le panneau jour charge).
 */
export function scrollToCalendarRecordAnchor(anchorId, { onSettled } = {}) {
  if (typeof document === 'undefined') return () => {};

  const targetId = anchorId || CALENDAR_DAY_EXERCISES_SECTION_ID;
  const MAX_ATTEMPTS = 40;
  const INTERVAL_MS = 130;
  let attempts = 0;
  let cancelled = false;
  let scrollTimer = null;
  let spotlightTimer = null;

  const finish = (foundExact) => {
    if (!cancelled) onSettled?.({ foundExact: Boolean(foundExact) });
  };

  const tryLocate = () => {
    if (cancelled) return;
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      spotlightTimer = window.setTimeout(() => {
        if (!cancelled) applyRecordSpotlight(el);
        finish(true);
      }, 520);
      return;
    }
    attempts += 1;
    if (attempts >= MAX_ATTEMPTS) {
      if (targetId === CALENDAR_DAY_EXERCISES_SECTION_ID) {
        for (const fallbackId of FALLBACK_ANCHOR_IDS) {
          const fallback = document.getElementById(fallbackId);
          if (fallback) {
            fallback.scrollIntoView({ behavior: 'smooth', block: 'start' });
            spotlightTimer = window.setTimeout(() => {
              if (!cancelled) applyRecordSpotlight(fallback);
              finish(false);
            }, 520);
            return;
          }
        }
      }
      finish(false);
      return;
    }
    scrollTimer = window.setTimeout(tryLocate, INTERVAL_MS);
  };

  scrollTimer = window.setTimeout(tryLocate, 80);

  return () => {
    cancelled = true;
    if (scrollTimer) window.clearTimeout(scrollTimer);
    if (spotlightTimer) window.clearTimeout(spotlightTimer);
  };
}
