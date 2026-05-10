/**
 * Score de similarité entre entrées `exerciseDatabase` (pour carrousels « Exercices similaires »).
 */

import { exerciseDatabase } from '../data/exerciseDatabase';
import { getExerciseDatabaseKey, getExerciseDatabaseHit } from './exerciseHeroContent';

function normToken(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function muscleJaccard(a, b) {
  const A = new Set((a || []).map((x) => normToken(x)).filter(Boolean));
  const B = new Set((b || []).map((x) => normToken(x)).filter(Boolean));
  if (A.size === 0 && B.size === 0) return 0;
  let inter = 0;
  A.forEach((x) => {
    if (B.has(x)) inter += 1;
  });
  const union = A.size + B.size - inter;
  return union > 0 ? inter / union : 0;
}

function equipmentSimilarity(eqA, eqB) {
  const a = normToken(eqA);
  const b = normToken(eqB);
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.65;
  return 0;
}

/**
 * @param {object} seedExercise — exercice utilisateur ou banque
 * @param {{ limit?: number, allowLooseMuscleSeed?: boolean }} opts — `allowLooseMuscleSeed` : seed hors banque mais avec muscles (ex. étirement).
 * @returns {Array<{ key: string, score: number, entry: object }>}
 */
export function rankSimilarExerciseKeys(seedExercise, opts = {}) {
  const limit = opts.limit ?? 30;
  const selfKey = getExerciseDatabaseKey(seedExercise);
  const hit = getExerciseDatabaseHit(seedExercise) || (selfKey ? exerciseDatabase[selfKey] : null);
  const looseMuscleSeed =
    opts.allowLooseMuscleSeed &&
    (((seedExercise?.primaryMuscles || []).length > 0) ||
      ((seedExercise?.secondaryMuscles || []).length > 0));
  // Banque hors exercice (ex. étirement proxy) : musculation du score depuis les muscles seulement
  if (!hit && !selfKey && !looseMuscleSeed) return [];

  const seedPrimary = hit?.primaryMuscles || seedExercise?.primaryMuscles || [];
  const seedSecondary = hit?.secondaryMuscles || seedExercise?.secondaryMuscles || [];
  const seedCat = normToken(hit?.category || seedExercise?.category || '');
  const seedEq = hit?.equipment || seedExercise?.equipment || seedExercise?.materiel || '';
  const seedDiff = Number(hit?.difficulty ?? seedExercise?.difficulty);
  const seedName = normToken(hit?.name || seedExercise?.name || '');
  const seedTokens = new Set(seedName.split(/[^a-z0-9]+/).filter((t) => t.length >= 3));

  const rows = [];

  for (const [key, ex] of Object.entries(exerciseDatabase)) {
    if (key === selfKey) continue;

    let score = 0;
    const j = muscleJaccard(
      [...seedPrimary, ...seedSecondary],
      [...(ex.primaryMuscles || []), ...(ex.secondaryMuscles || [])]
    );
    score += j * 42;

    const cat = normToken(ex.category || '');
    if (seedCat && cat && seedCat === cat) score += 18;

    score += equipmentSimilarity(seedEq, ex.equipment || '') * 12;

    const d = Number(ex.difficulty);
    if (Number.isFinite(seedDiff) && Number.isFinite(d) && Math.abs(seedDiff - d) <= 1) score += 6;

    const otherName = normToken(ex.name || '');
    const tokens = otherName.split(/[^a-z0-9]+/).filter((t) => t.length >= 3);
    let overlap = 0;
    tokens.forEach((t) => {
      if (seedTokens.has(t)) overlap += 1;
    });
    score += Math.min(14, overlap * 4);

    const vars = Array.isArray(ex.variations) ? ex.variations : [];
    vars.forEach((v) => {
      const nv = normToken(v);
      if (nv.length >= 4 && seedName.includes(nv)) score += 8;
    });

    if (score <= 0) continue;
    rows.push({ key, score, entry: ex });
  }

  rows.sort((a, b) => b.score - a.score);
  return rows.slice(0, limit);
}
