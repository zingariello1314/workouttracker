import { flattenPathologyItems } from '../data/pathology';
import { getStretchByKey } from '../data/stretchDatabase';
import { buildBankExerciseViewFromDatabaseKey } from './exerciseBankViewModel';

/** Extrait une durée en secondes depuis « 3×30 s », « 2×1 min », etc. */
export function parseDurationSecondsFromDosage(dosage, fallback = 60) {
  const s = String(dosage || '');
  const sec = s.match(/(\d+)\s*s(?:ec)?/i);
  if (sec) return Math.max(10, Number(sec[1]));
  const min = s.match(/(\d+)\s*min/i);
  if (min) return Math.max(10, Number(min[1]) * 60);
  return fallback;
}

export function selectionKeyForItem(type, key) {
  return `${type}:${key}`;
}

/**
 * Transforme les items prescription d'une pathologie en cartes banque affichables.
 * @returns {Array<{ type:'exercise'|'stretch', key:string, dosage:string, exercise?:object, stretch?:object }>}
 */
export function buildPathologyRenderableItems(entry, t = (k, d) => d) {
  if (!entry) return [];
  const rows = flattenPathologyItems(entry);
  const out = [];
  rows.forEach((row) => {
    if (row.type === 'exercise' && row.found && row.key) {
      const exercise = buildBankExerciseViewFromDatabaseKey(row.key, t);
      if (exercise) {
        out.push({
          type: 'exercise',
          key: row.key,
          dosage: row.dosage || '',
          group: row.group || '',
          exercise
        });
      }
    } else if (row.type === 'stretch' && row.found && row.key) {
      const raw = getStretchByKey(row.key);
      if (raw) {
        out.push({
          type: 'stretch',
          key: row.key,
          dosage: row.dosage || '',
          group: row.group || '',
          stretch: { ...raw, key: row.key }
        });
      }
    }
  });
  return out;
}

/** Payload modal « bulk » pour BankAddToProgramModal */
export function buildBulkAddPayload(label, renderableItems) {
  const items = (renderableItems || []).map((it) => {
    if (it.type === 'exercise') {
      return {
        kind: 'exercise',
        exercise: it.exercise,
        series: it.dosage || '3×10'
      };
    }
    return {
      kind: 'stretch',
      stretchKey: it.key,
      stretchLabel: it.stretch?.name || it.key,
      duration: parseDurationSecondsFromDosage(it.dosage, it.stretch?.defaultDuration || 60)
    };
  });
  return { kind: 'bulk', label, items };
}
