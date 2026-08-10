/** Identifiants des vues du sous-onglet Récap Sport (redesign navigation latérale). */

export const RECAP_VIEW_IDS = {
  SNAPSHOT: 'snapshot',
  ANALYSE: 'analyse',
  CORPS: 'corps',
  TENDANCES: 'tendances',
  SESSIONS: 'sessions',
  GRADES: 'grades'
};

export const RECAP_ACTIVE_VIEW_LS = 'sport.recap.activeView';

export const RECAP_NAV_SECTIONS = [
  {
    id: 'synthesis',
    items: [
      { id: RECAP_VIEW_IDS.SNAPSHOT, labelKey: 'recap.nav.snapshot', defaultLabel: 'Snapshot' },
      { id: RECAP_VIEW_IDS.ANALYSE, labelKey: 'recap.nav.analyse', defaultLabel: 'Analyse' },
      { id: RECAP_VIEW_IDS.GRADES, labelKey: 'recap.nav.grades', defaultLabel: 'Grades' }
    ]
  },
  {
    id: 'data',
    items: [
      { id: RECAP_VIEW_IDS.CORPS, labelKey: 'recap.nav.corps', defaultLabel: 'Corps' },
      { id: RECAP_VIEW_IDS.TENDANCES, labelKey: 'recap.nav.tendances', defaultLabel: 'Tendances' },
      { id: RECAP_VIEW_IDS.SESSIONS, labelKey: 'recap.nav.sessions', defaultLabel: 'Séances' }
    ]
  }
];

export function readStoredRecapView(fallback = RECAP_VIEW_IDS.SNAPSHOT) {
  try {
    const stored = localStorage.getItem(RECAP_ACTIVE_VIEW_LS);
    if (stored && Object.values(RECAP_VIEW_IDS).includes(stored)) return stored;
  } catch {
    /* ignore */
  }
  return fallback;
}

/** Ouvre le sous-onglet Récap → Grades (à appeler avant setActiveTab('recap')). */
export function openSportRecapGradesView() {
  try {
    localStorage.setItem(RECAP_ACTIVE_VIEW_LS, RECAP_VIEW_IDS.GRADES);
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('sport:recap-view', { detail: { view: RECAP_VIEW_IDS.GRADES } })
    );
  }
}
