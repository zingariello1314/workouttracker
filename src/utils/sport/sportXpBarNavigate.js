/**
 * Navigation depuis la barre XP Sport vers l’onglet / ancre qui porte la donnée.
 */

import { openSportRecapGradesView, openSportRecapView, RECAP_VIEW_IDS } from './recapViewConfig';
import { scrollToRecapGradeDetail } from './recapGradesScroll';
import { getDateStr } from '../dateUtils';

export const SPORT_XP_NAV_EVENT_BANK = 'sport:exercises-bank-subtab';
export const SPORT_XP_NAV_EVENT_GARMIN = 'sport:garmin-subtab';
export const SPORT_XP_NAV_EVENT_NUTRITION = 'sport:nutrition-section';
export const SPORT_XP_NAV_EVENT_CALENDAR = 'sport:calendar-select-date';

function scrollToId(id, attempts = 16) {
  if (typeof document === 'undefined' || !id) return;
  let n = 0;
  const run = () => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    n += 1;
    if (n < attempts) window.setTimeout(run, 140);
  };
  window.setTimeout(run, 160);
}

function openGarminSubTab(subTab) {
  try {
    localStorage.setItem('garmin.activeSubTab', subTab);
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SPORT_XP_NAV_EVENT_GARMIN, { detail: { subTab } }));
  }
}

function openExercisesBankSubTab(subTab) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SPORT_XP_NAV_EVENT_BANK, { detail: { subTab } }));
  }
}

function openCalendarXpAnchor(anchorId) {
  const today = getDateStr(new Date());
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(SPORT_XP_NAV_EVENT_CALENDAR, {
        detail: { dateStr: today, anchorId }
      })
    );
  }
  scrollToId(anchorId);
}

/**
 * @param {string} targetId — id logique (row / header)
 * @param {{ setActiveTab: Function, requestOpenEnduranceSubTab?: Function }} api
 * @returns {{ ok: boolean, missing?: string }}
 */
export function navigateFromSportXpBar(targetId, api) {
  const { setActiveTab, requestOpenEnduranceSubTab } = api || {};
  if (!setActiveTab || !targetId) return { ok: false, missing: targetId };

  const goRecapGrades = (anchorId) => {
    openSportRecapGradesView();
    setActiveTab('recap');
    window.setTimeout(() => {
      if (anchorId) scrollToId(anchorId);
      else scrollToRecapGradeDetail();
    }, 220);
  };

  const goRecapSessions = (anchorId) => {
    openSportRecapView(RECAP_VIEW_IDS.SESSIONS);
    setActiveTab('recap');
    if (anchorId) window.setTimeout(() => scrollToId(anchorId), 240);
  };

  const goCalendarXp = (anchorId) => {
    setActiveTab('calendar');
    openCalendarXpAnchor(anchorId || 'calendar-xp-insights');
  };

  const map = {
    grades: () => goRecapGrades('recap-grades-section'),
    merited: () => goRecapGrades('recap-grades-section'),
    levelXp: () => goRecapGrades('recap-grades-section'),
    mastery: () => goCalendarXp('calendar-xp-mastery-axes'),
    dailyAvg: () => goCalendarXp('calendar-xp-daily-avg'),
    progress: () => goRecapGrades('recap-grades-section'),
    totalXp: () => goRecapGrades('recap-grades-section'),

    weightedReps: () => {
      setActiveTab('today');
      scrollToId('today-exercises-section');
    },
    checked: () => {
      setActiveTab('today');
      scrollToId('today-exercises-section');
    },
    volume: () => goCalendarXp('calendar-xp-volume'),
    weightedTime: () => goCalendarXp('calendar-xp-weighted-time'),
    feedback: () => goRecapSessions('recap-sessions-feedback'),
    programBonus: () => goCalendarXp('calendar-xp-program-bonus'),

    stretches: () => {
      openExercisesBankSubTab('stretches');
      setActiveTab('exercises');
    },
    circuits: () => {
      if (requestOpenEnduranceSubTab) {
        requestOpenEnduranceSubTab('circuits');
      } else {
        openExercisesBankSubTab('circuits');
        setActiveTab('exercises');
      }
    },
    challenges: () => setActiveTab('performance-challenges'),
    gtg: () => {
      requestOpenEnduranceSubTab?.('gtg', { anchorId: 'endurance-gtg-config' });
      if (!requestOpenEnduranceSubTab) setActiveTab('endurance');
    },

    calories: () => {
      openGarminSubTab('metrics');
      setActiveTab('garmin');
      scrollToId('garmin-metrics-panel');
    },
    steps: () => {
      openGarminSubTab('metrics');
      setActiveTab('garmin');
      scrollToId('garmin-metrics-panel');
    },
    food: () => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent(SPORT_XP_NAV_EVENT_NUTRITION, { detail: { section: 'journal' } })
        );
      }
      setActiveTab('nutrition');
      scrollToId('nutrition-journal-section');
    },

    running: () => goCalendarXp('calendar-xp-board-running'),
    pushups: () =>
      requestOpenEnduranceSubTab?.('pushups', {
        anchorId: 'endurance-pushup-challenge-form'
      }) || setActiveTab('endurance'),
    jumpRope: () => goCalendarXp('calendar-xp-board-jumprope'),
    plank: () => goCalendarXp('calendar-xp-board-plank'),

    miscSessions: () => goRecapSessions('recap-sessions-feedback'),
    miscTrophies: () => goCalendarXp('calendar-xp-trophy-summary'),

    groupTraining: () => {
      setActiveTab('today');
      scrollToId('today-exercises-section');
    },
    groupActivity: () => {
      openGarminSubTab('metrics');
      setActiveTab('garmin');
    },
    groupTrophies: () => goCalendarXp('calendar-xp-trophy-summary')
  };

  const fn = map[targetId];
  if (!fn) return { ok: false, missing: targetId };
  fn();
  return { ok: true };
}

/** Ancres fines désormais couvertes (calendrier XP + recap). */
export const SPORT_XP_NAV_MISSING_ANCHORS = [];
