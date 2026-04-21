/** localStorage : période choisie sur la carte Course (récap / dashboard / sidebar). */
export const GARMIN_RUNNING_CARD_PERIOD_LS = 'garmin.runningStats.viewPeriod';

/** localStorage : période choisie sur la carte Muscu (récap / dashboard / sidebar). */
export const STRENGTH_CARD_PERIOD_LS = 'sport.recap.strengthStats.viewPeriod';

/** Identifiants de plage « vue récap » (carte 3D + cartes Course / Muscu indépendantes). */
export const RECAP_VIEW_PERIOD_IDS = ['today', '7d', '30d', '3m', '6m', '1y', '2y', 'all'];

export const RECAP_VIEW_PERIODS = [
  { id: 'today', labelKey: 'recap.period.today' },
  { id: '7d', labelKey: 'recap.period.7d' },
  { id: '30d', labelKey: 'recap.period.30d' },
  { id: '3m', labelKey: 'recap.period.3m' },
  { id: '6m', labelKey: 'recap.period.6m' },
  { id: '1y', labelKey: 'recap.period.1y' },
  { id: '2y', labelKey: 'recap.period.2y' },
  { id: 'all', labelKey: 'recap.period.all' },
];

/**
 * @param {string} storageKey
 * @param {string} [fallback='30d']
 * @returns {typeof RECAP_VIEW_PERIOD_IDS[number]}
 */
export function readStoredRecapViewPeriod(storageKey, fallback = '30d') {
  if (typeof window === 'undefined') return fallback;
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (stored && RECAP_VIEW_PERIOD_IDS.includes(stored)) return stored;
  } catch {
    /* ignore */
  }
  return fallback;
}
