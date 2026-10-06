/**
 * Navigation depuis la barre XP Sport vers l’onglet / ancre qui porte la donnée.
 */

import { openSportRecapGradesView, openSportRecapView, RECAP_VIEW_IDS } from './recapViewConfig';
import { scrollToRecapGradeDetail } from './recapGradesScroll';

export const SPORT_XP_NAV_EVENT_BANK = 'sport:exercises-bank-subtab';
export const SPORT_XP_NAV_EVENT_GARMIN = 'sport:garmin-subtab';
export const SPORT_XP_NAV_EVENT_NUTRITION = 'sport:nutrition-section';

function scrollToId(id, attempts = 14) {
  if (typeof document === 'undefined' || !id) return;
  let n = 0;
  const run = () => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    n += 1;
    if (n < attempts) window.setTimeout(run, 120);
  };
  window.setTimeout(run, 100);
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

/**
 * @param {string} targetId — id logique (row / header)
 * @param {{ setActiveTab: Function, requestOpenEnduranceSubTab?: Function }} api
 * @returns {{ ok: boolean, missing?: string }}
 */
export function navigateFromSportXpBar(targetId, api) {
  const { setActiveTab, requestOpenEnduranceSubTab } = api || {};
  if (!setActiveTab || !targetId) return { ok: false, missing: targetId };

  const goRecapGrades = () => {
    openSportRecapGradesView();
    setActiveTab('recap');
    window.setTimeout(() => scrollToRecapGradeDetail(), 220);
  };

  const goRecapSessions = () => {
    openSportRecapView(RECAP_VIEW_IDS.SESSIONS);
    setActiveTab('recap');
  };

  const map = {
    grades: goRecapGrades,
    merited: goRecapGrades,
    levelXp: goRecapGrades,
    mastery: goRecapGrades,
    dailyAvg: goRecapGrades,
    progress: goRecapGrades,
    totalXp: goRecapGrades,

    weightedReps: () => {
      setActiveTab('today');
      scrollToId('today-exercises-section');
    },
    checked: () => {
      setActiveTab('today');
      scrollToId('today-exercises-section');
    },
    volume: () => {
      setActiveTab('today');
      scrollToId('today-exercises-section');
    },
    weightedTime: () => {
      setActiveTab('today');
      scrollToId('today-exercises-section');
    },
    feedback: goRecapSessions,
    programBonus: () => setActiveTab('program'),

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

    running: () => requestOpenEnduranceSubTab?.('running') || setActiveTab('endurance'),
    pushups: () =>
      requestOpenEnduranceSubTab?.('pushups', {
        anchorId: 'endurance-pushup-challenge-form'
      }) || setActiveTab('endurance'),
    jumpRope: () => requestOpenEnduranceSubTab?.('jumprope') || setActiveTab('endurance'),
    plank: () => requestOpenEnduranceSubTab?.('gainage') || setActiveTab('endurance'),

    miscSessions: goRecapSessions,
    miscTrophies: () => {
      requestOpenEnduranceSubTab?.('performance');
      if (!requestOpenEnduranceSubTab) setActiveTab('endurance');
    },

    groupTraining: () => {
      setActiveTab('today');
      scrollToId('today-exercises-section');
    },
    groupActivity: () => {
      openGarminSubTab('metrics');
      setActiveTab('garmin');
    },
    groupTrophies: () => {
      requestOpenEnduranceSubTab?.('performance');
      if (!requestOpenEnduranceSubTab) setActiveTab('endurance');
    }
  };

  const fn = map[targetId];
  if (!fn) return { ok: false, missing: targetId };
  fn();
  return { ok: true };
}

/** Cibles sans ancre fine dédiée (onglet seulement, ou à créer). */
export const SPORT_XP_NAV_MISSING_ANCHORS = [
  {
    id: 'volume',
    label: 'Volume cumulé (kg×reps)',
    current: 'Aujourd’hui → liste exercices',
    note: 'Pas de panneau « volume XP / dédup » dédié'
  },
  {
    id: 'weightedTime',
    label: 'Temps pondéré',
    current: 'Aujourd’hui → liste exercices',
    note: 'Pas de vue « exos en durée » agrégée'
  },
  {
    id: 'feedback',
    label: 'Séances + feedback',
    current: 'Récap → Séances',
    note: 'Pas d’ancre sur le bloc feedback XP'
  },
  {
    id: 'programBonus',
    label: 'Bonus complétion programme',
    current: 'Onglet Programme',
    note: 'Pas de carte « bonus XP complétion »'
  },
  {
    id: 'mastery',
    label: 'Score de maîtrise',
    current: 'Récap → Grades',
    note: 'Pas de panneau détaillé des axes de maîtrise'
  },
  {
    id: 'dailyAvg',
    label: 'Moyenne XP / jour actif',
    current: 'Récap → Grades',
    note: 'Insight présent côté grades, pas d’ancre dédiée'
  },
  {
    id: 'miscTrophies',
    label: 'Paliers / trophées (pied)',
    current: 'Endurance → Performances',
    note: 'Pas de synthèse unique « 37 paliers · 20 trophées »'
  },
  {
    id: 'jumpRope',
    label: 'Trophées corde',
    current: 'Endurance → Corde',
    note: 'Pas d’ancre trophées corde isolée'
  },
  {
    id: 'plank',
    label: 'Trophées gainage',
    current: 'Endurance → Gainage',
    note: 'Pas d’ancre trophées gainage isolée'
  },
  {
    id: 'running',
    label: 'Trophées course',
    current: 'Endurance → Course',
    note: 'Pas d’ancre « board trophées course » isolée'
  }
];
