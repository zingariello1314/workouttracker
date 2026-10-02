/**
 * Deux libellés ne décrivent le même mouvement que s'ils sont des synonymes
 * explicites. Une planche n'est jamais une pompe, même si le nom contient
 * « planche » à côté d'une variante de pompes.
 */
import { isIsometricExerciseByName } from '../exerciseCalculations';

function norm(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

export function isHoldExerciseName(name) {
  return isIsometricExerciseByName(name);
}

function isPushupName(n) {
  return /pompe|push-up|pushup/.test(n);
}

/** @returns {string|null} famille de pompes, jamais une planche */
export function pushupFamily(name) {
  const n = norm(name);
  if (!n || !isPushupName(n)) return null;
  if (/pseudo-planche|pseudo planche/.test(n)) return 'pompes-pseudo-planche';
  if (/inclin/.test(n)) return 'pompes-inclinees';
  if (/declin/.test(n)) return 'pompes-declinees';
  if (/serre|diamant/.test(n)) return 'pompes-serrees';
  if (/lest|gilet|weighted/.test(n)) return 'pompes-lestees';
  return 'pompes';
}

function holdFamily(name) {
  const n = norm(name);
  if (!n || isPushupName(n) || !isHoldExerciseName(name)) return null;
  if (/bras tendus|straight arm/.test(n)) return 'hold:planche-bras-tendus';
  if (/lateral/.test(n)) return 'hold:gainage-lateral';
  if (/dynamique|dynamic/.test(n)) return 'hold:gainage-dynamique';
  if (/^planche$|^gainage$|gainage ventral|avant-bras|avant bras/.test(n)) return 'hold:gainage';
  return `hold:${n.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
}

/** Clé de regroupement. Null = cet id reste seul. */
export function movementKey(name) {
  return pushupFamily(name) || holdFamily(name) || null;
}

export function sameMovementName(a, b) {
  const ka = movementKey(a);
  const kb = movementKey(b);
  if (!ka || !kb) return norm(a) !== '' && norm(a) === norm(b);
  return ka === kb;
}

/** Une planche ne doit pas raconter le volume d'une pompe faite le même jour. */
export function volumeSharedWithRepSibling(session, exerciseId, reps) {
  const total = Number(reps);
  if (!Number.isFinite(total) || total <= 0) return false;
  return (session?.exercises || []).some((other) => {
    if (String(other.id) === String(exerciseId)) return false;
    if (Number(other.reps) !== total) return false;
    return !isHoldExerciseName(other.name);
  });
}
