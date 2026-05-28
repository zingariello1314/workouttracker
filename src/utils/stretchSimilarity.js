/**
 * Étirements similaires (banque étirements uniquement).
 */

import { stretchDatabase } from '../data/stretchDatabase';

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

/**
 * @param {object} stretch — entrée banque avec `.key`
 * @param {{ limit?: number }} opts
 * @returns {Array<{ key: string, score: number, entry: object }>}
 */
export function rankSimilarStretchKeys(stretch, opts = {}) {
  const limit = opts.limit ?? 24;
  if (!stretch) return [];
  const selfKey = stretch.key;
  const seedPrimary = stretch.primaryMuscles || [];
  const seedSecondary = stretch.secondaryMuscles || [];
  const seedCat = normToken(stretch.category || '');
  const seedZone = normToken(stretch.bodyZone || '');
  const seedDiff = Number(stretch.difficulty) || 2;

  const rows = [];
  for (const [key, ex] of Object.entries(stretchDatabase)) {
    if (key === selfKey) continue;
    if (ex?.category === 'Drills course' || ex?.category === 'Pliométrie') continue;

    let score = 0;
    score +=
      muscleJaccard(
        [...seedPrimary, ...seedSecondary],
        [...(ex.primaryMuscles || []), ...(ex.secondaryMuscles || [])]
      ) * 45;

    const cat = normToken(ex.category || '');
    if (seedCat && cat && seedCat === cat) score += 16;
    if (seedZone && normToken(ex.bodyZone || '') === seedZone) score += 12;

    const d = Number(ex.difficulty) || 2;
    if (Math.abs(seedDiff - d) <= 1) score += 8;

    if (score > 4) rows.push({ key, score, entry: ex });
  }

  rows.sort((a, b) => b.score - a.score);
  return rows.slice(0, limit);
}
