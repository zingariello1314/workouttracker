import { formatDate } from './translations/formatters.js';

/** Parse une clé `YYYY-MM-DD` en Date locale (évite décalage UTC). */
export function parseEnduranceDateKey(key) {
  if (key == null || key === '') return null;
  const str = String(key).trim();
  const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  }
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Heure affichée `HH:MM` (tronque secondes si présentes). */
export function formatEnduranceTimeLabel(timeStr) {
  if (!timeStr) return '';
  const s = String(timeStr).trim();
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (m) return `${m[1].padStart(2, '0')}:${m[2]}`;
  return s;
}

/**
 * Date lisible pour l’onglet Défis : « 20 mai 2026 » (+ « · 07:05 » si heure).
 * @param {string} dateStr
 * @param {string} [timeStr]
 * @param {string} [language='fr']
 */
export function formatEnduranceSessionDateLabel(dateStr, timeStr, language = 'fr') {
  const d = parseEnduranceDateKey(dateStr);
  const dateLabel = d ? formatDate(d, language) : dateStr || '—';
  const timeLabel = formatEnduranceTimeLabel(timeStr);
  return timeLabel ? `${dateLabel} · ${timeLabel}` : dateLabel;
}

/** Date seule (sans heure), pour colonnes date / heure séparées. */
export function formatEnduranceSessionDateOnly(dateStr, language = 'fr') {
  const d = parseEnduranceDateKey(dateStr);
  return d ? formatDate(d, language) : dateStr || '—';
}
