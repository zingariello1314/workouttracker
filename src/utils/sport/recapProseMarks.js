/**
 * Mise en forme visuelle du prose Analyses :
 * - dates jj/mm → « 12 octobre 2026 »
 * - couleur uniquement sur chiffre + signe + unité (pas de chiffre isolé)
 */

const MONTHS_OK = new Set(
  Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
);

/** Unités collées au nombre pour la couleur (frontière de mot). */
export const RECAP_VALUE_UNITS =
  'km|kcal|kg|reps?|r[ée]p[ée]titions?|min(?:utes?)?|h(?:eures?)?|jours?|journ[ée]es?|s[ée]ances?|mini-?s[ée]ries?|s[ée]ries?|passages?|semaines?|nuits?|j\\.';

/**
 * Réécrit les dates paddées jj/mm[/aaaa] en long français.
 * Évite de toucher aux ratios du type « 2,7 / 5 ».
 */
export function expandSlashDatesInProse(text) {
  return String(text || '').replace(
    /\b(\d{2})\s*\/\s*(\d{2})(?:\s*\/\s*(\d{2,4}))?\b/g,
    (full, dd, mm, yy) => {
      if (!MONTHS_OK.has(mm)) return full;
      const day = Number(dd);
      const month = Number(mm);
      if (day < 1 || day > 31) return full;
      let year = null;
      if (yy) {
        year = Number(yy);
        if (year < 100) year += 2000;
      }
      const date = new Date(year || 2000, month - 1, day);
      if (Number.isNaN(date.getTime()) || date.getDate() !== day) return full;
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        ...(year ? { year: 'numeric' } : {})
      });
    }
  );
}

function isColorWorthy(token) {
  const t = String(token || '');
  if (!t) return false;
  if (/[+\u2212\-−]/.test(t)) return true;
  if (/%/.test(t)) return true;
  if (/\d\s*\/\s*\d/.test(t)) return true;
  if (/[a-zA-ZàâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ]/.test(t)) return true;
  return false;
}

/**
 * Découpe le texte en segments : chaînes brutes ou tokens « valeur » à colorer.
 * @returns {Array<{ text: string, mark: boolean }>}
 */
export function segmentRecapProseValues(text) {
  const raw = expandSlashDatesInProse(text);
  if (!raw) return [];
  const re = new RegExp(
    String.raw`(?:[+\u2212\-−]\s*)?\d+(?:[\s\u00a0\u202f]\d{3})*(?:[.,]\d+)?(?:\s*%|\s*/\s*\d+(?:[.,]\d+)?|\s*(?:${RECAP_VALUE_UNITS})\b(?:\(s\))?)?`,
    'gi'
  );
  const out = [];
  let last = 0;
  for (const match of raw.matchAll(re)) {
    const token = match[0];
    const index = match.index ?? 0;
    if (!token) continue;
    if (index > last) out.push({ text: raw.slice(last, index), mark: false });
    out.push({ text: token, mark: isColorWorthy(token) });
    last = index + token.length;
  }
  if (last < raw.length) out.push({ text: raw.slice(last), mark: false });
  return out;
}
