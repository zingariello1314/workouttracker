/**
 * Horaires de prière (Adhan) : calcul pour une date + coordonnées.
 * Méthode de calcul et ajustements (minutes) pour coller à une mosquée ou une appli.
 * @module utils/prayerTimes
 */

import { Coordinates, CalculationMethod, PrayerTimes } from 'adhan';

const PRIERE_KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

/** Méthodes disponibles (clé Adhan → libellé français) */
export const PRAYER_METHODS = [
  { value: 'MoonsightingCommittee', label: 'Moonsighting Committee (UK, Amérique du Nord)' },
  { value: 'MuslimWorldLeague', label: 'Ligue islamique mondiale (18° / 17°)' },
  { value: 'Egyptian', label: 'Autorité égyptienne (19.5° / 17.5°)' },
  { value: 'UmmAlQura', label: 'Umm Al-Qura (Makkah, Isha 90 min après Maghrib)' },
  { value: 'Karachi', label: 'Karachi (18° / 18°)' },
  { value: 'NorthAmerica', label: 'ISNA / Amérique du Nord (15° / 15°)' },
  { value: 'Kuwait', label: 'Koweït (18° / 17.5°)' },
  { value: 'Qatar', label: 'Qatar (18°, Isha 90 min après Maghrib)' },
  { value: 'Turkey', label: 'Turquie (Diyanet)' },
  { value: 'Dubai', label: 'Dubaï (UAE)' },
];

function formatTime(d) {
  if (!d || !(d instanceof Date)) return '';
  const h = d.getHours();
  const m = d.getMinutes();
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function getParams(methodKey, adjustments) {
  const key = methodKey && typeof CalculationMethod[methodKey] === 'function'
    ? methodKey
    : 'MoonsightingCommittee';
  const params = CalculationMethod[key]();
  if (adjustments && typeof adjustments === 'object') {
    const keys = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
    keys.forEach((k) => {
      const v = adjustments[k];
      if (typeof v === 'number') params.adjustments[k] = (params.adjustments[k] || 0) + v;
    });
  }
  return params;
}

/**
 * Retourne l'heure d'une prière pour une date et une position données.
 * @param {string|Date} date - Date du jour (YYYY-MM-DD ou Date)
 * @param {string} priere - 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'
 * @param {{ lat: number, lng: number, method?: string, adjustments?: object }} location - Coordonnées + optionnel: méthode de calcul, ajustements (minutes)
 * @returns {string|null} Heure en HH:mm ou null
 */
export function getPrayerTimeForDate(date, priere, location) {
  if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
    return null;
  }
  if (!PRIERE_KEYS.includes(priere)) return null;

  let d;
  if (typeof date === 'string') {
    const [y, m, day] = date.split('-').map(Number);
    d = new Date(y, (m || 1) - 1, day || 1);
  } else if (date instanceof Date) {
    d = date;
  } else {
    return null;
  }

  try {
    const coordinates = new Coordinates(location.lat, location.lng);
    const params = getParams(location.method, location.adjustments);
    const prayerTimes = new PrayerTimes(coordinates, d, params);
    const dateObj = prayerTimes[priere];
    return dateObj ? formatTime(dateObj) : null;
  } catch {
    return null;
  }
}

export { PRIERE_KEYS };
