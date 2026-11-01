/**
 * Mise en forme visuelle du prose Analyses :
 * - dates jj/mm et ISO → « 12 octobre 2026 »
 * - couleur sur chiffres + unités, durées `7 h 42`, schémas `3 × 12`
 * - segments sémantiques optionnels (exercices / dates) sans obliger l’UI à deviner
 */

import { formatDayFr } from './recapTrainingTimeline';

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

/** ISO yyyy-mm-dd → français long (prose utilisateur). */
export function expandIsoDatesInProseMarks(text) {
  return String(text || '').replace(/\b(20\d{2})-(\d{2})-(\d{2})\b/g, (full, y, m, d) => {
    return formatDayFr(`${y}-${m}-${d}`, true) || full;
  });
}

function isColorWorthy(token) {
  const t = String(token || '');
  if (!t) return false;
  if (/[+\u2212\-−]/.test(t)) return true;
  if (/%/.test(t)) return true;
  if (/\d\s*\/\s*\d/.test(t)) return true;
  if (/[a-zA-ZàâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ]/.test(t)) return true;
  // minutes isolées dans une durée déjà découpée (ex. « 42 » après « 7 h »)
  if (/^\d{1,2}$/.test(t)) return true;
  return false;
}

/**
 * Prépare le texte : ISO + slash dates.
 */
export function normalizeRecapProseForMarks(text) {
  return expandSlashDatesInProse(expandIsoDatesInProseMarks(text));
}

/**
 * Découpe le texte en segments : chaînes brutes ou tokens « valeur » à colorer.
 * Reconnaît notamment `7 h 42`, `22 min`, `3 × 12`, pourcentages, flèches de comparaison.
 * @returns {Array<{ text: string, mark: boolean, kind?: string }>}
 */
export function segmentRecapProseValues(text) {
  const raw = normalizeRecapProseForMarks(text);
  if (!raw) return [];

  // Ordre : durées h+min, schémas N × M, puis nombres+unités classiques
  const re = new RegExp(
    [
      // 7 h 42 / 7h42
      String.raw`\d+\s*h\s*\d{1,2}`,
      // 3 × 12 ou 3x12
      String.raw`\d+\s*[×x]\s*\d+`,
      // 36 → 19
      String.raw`\d+(?:[.,]\d+)?\s*→\s*\d+(?:[.,]\d+)?`,
      // nombre + unité / % / ratio
      String.raw`(?:[+\u2212\-−]\s*)?\d+(?:[\s\u00a0\u202f]\d{3})*(?:[.,]\d+)?(?:\s*%|\s*/\s*\d+(?:[.,]\d+)?|\s*(?:${RECAP_VALUE_UNITS})\b(?:\(s\))?)?`
    ].join('|'),
    'gi'
  );

  const out = [];
  let last = 0;
  for (const match of raw.matchAll(re)) {
    const token = match[0];
    const index = match.index ?? 0;
    if (!token) continue;
    if (index > last) out.push({ text: raw.slice(last, index), mark: false });
    let kind = 'value';
    if (/\d+\s*h\s*\d{1,2}/i.test(token)) kind = 'duration';
    else if (/[×x]/i.test(token)) kind = 'scheme';
    else if (/→/.test(token)) kind = 'comparison';
    out.push({ text: token, mark: isColorWorthy(token), kind });
    last = index + token.length;
  }
  if (last < raw.length) out.push({ text: raw.slice(last), mark: false });
  return out;
}

/**
 * Segmentation sémantique optionnelle.
 * `entities`: [{ type: 'exercise'|'date'|'value', text, start?, end? }]
 * Si start/end absents, cherche la première occurrence exacte non encore marquée.
 * Fallback : segmentRecapProseValues.
 *
 * @returns {Array<{ text: string, mark: boolean, kind?: string }>}
 */
export function segmentRecapProseSemantic(text, { entities = [] } = {}) {
  const raw = normalizeRecapProseForMarks(text);
  if (!raw) return [];
  if (!entities.length) return segmentRecapProseValues(raw);

  const spans = [];
  const used = [];
  for (const ent of entities) {
    const needle = String(ent.text || '');
    if (!needle) continue;
    let start = ent.start;
    let end = ent.end;
    if (start == null || end == null) {
      let from = 0;
      let found = -1;
      while (from <= raw.length) {
        const idx = raw.indexOf(needle, from);
        if (idx < 0) break;
        const overlaps = used.some(([a, b]) => !(idx + needle.length <= a || idx >= b));
        if (!overlaps) {
          found = idx;
          break;
        }
        from = idx + 1;
      }
      if (found < 0) continue;
      start = found;
      end = found + needle.length;
    }
    if (start < 0 || end > raw.length || start >= end) continue;
    const overlaps = used.some(([a, b]) => !(end <= a || start >= b));
    if (overlaps) continue;
    used.push([start, end]);
    spans.push({
      start,
      end,
      text: raw.slice(start, end),
      mark: true,
      kind: ent.type || 'entity'
    });
  }
  spans.sort((a, b) => a.start - b.start);

  if (!spans.length) return segmentRecapProseValues(raw);

  const out = [];
  let cursor = 0;
  for (const sp of spans) {
    if (sp.start > cursor) {
      // Sous-segmenter le prose intermédiaire pour les valeurs
      segmentRecapProseValues(raw.slice(cursor, sp.start)).forEach((p) => out.push(p));
    }
    out.push({ text: sp.text, mark: true, kind: sp.kind });
    cursor = sp.end;
  }
  if (cursor < raw.length) {
    segmentRecapProseValues(raw.slice(cursor)).forEach((p) => out.push(p));
  }
  return out;
}
