/**
 * Limites par séance (SPEC §6.4) : exos, tirages, blocs lourds, séries effectives.
 */

const HEAVY_PATTERN = /4×[345]|3×[345]|4-8|force|×5\b/i;
const PULL_PATTERN = /traction|pull|rowing|chin|australien/i;

export function parseSetsCount(series) {
  const m = String(series || '').match(/^(\d+)×/);
  return m ? Math.max(1, parseInt(m[1], 10)) : 3;
}

export function parseRepsMid(series) {
  const s = String(series || '');
  const m = s.match(/×(\d+)(?:-(\d+))?/);
  if (!m) return 10;
  const lo = parseInt(m[1], 10);
  const hi = m[2] ? parseInt(m[2], 10) : lo;
  return Math.round((lo + hi) / 2);
}

export function estimateEffectiveSets(exercises) {
  if (!Array.isArray(exercises)) return 0;
  let total = 0;
  exercises.forEach((ex) => {
    if (String(ex.type || '').includes('cardio')) {
      total += 1;
      return;
    }
    total += parseSetsCount(ex.series);
  });
  return total;
}

function isHeavyExercise(ex) {
  const s = `${ex.series || ''} ${ex.intensity || ''} ${ex.name || ''}`;
  return HEAVY_PATTERN.test(s);
}

function isPullExercise(ex) {
  const k = `${ex.exerciseBankKey || ''} ${ex.name || ''}`.toLowerCase();
  return PULL_PATTERN.test(k);
}

/**
 * @param {object[]} exercises
 * @param {object} deformers
 * @param {{ modality?: string }} [profile]
 */
export function enforceSessionExerciseLimits(exercises, deformers = {}, profile = {}) {
  if (!Array.isArray(exercises) || exercises.length === 0) return exercises;

  const maxEx = deformers.maxExercisesPerSession ?? 7;
  const maxPull = deformers.maxPullingPatternsPerSession ?? 3;
  const maxHeavy = deformers.maxHeavyBlocksPerSession ?? 2;
  const maxTotalSets =
    deformers.maxEffectiveSetsPerSession ?? (profile?.modality === 'cardio' ? 12 : 25);
  const exerciseCountMul = deformers.exerciseCountMul ?? 1;
  const capEx = Math.max(3, Math.min(8, Math.round(maxEx * exerciseCountMul)));

  const mains = [];
  const accessories = [];
  const cardio = [];

  exercises.forEach((ex) => {
    if (String(ex.type || '').includes('cardio') || String(ex.series || '').includes('min')) {
      cardio.push(ex);
    } else if (isHeavyExercise(ex) || parseSetsCount(ex.series) >= 4) {
      mains.push(ex);
    } else {
      accessories.push(ex);
    }
  });

  let heavyKept = 0;
  const keptMains = mains.filter((ex) => {
    if (isHeavyExercise(ex)) {
      if (heavyKept >= maxHeavy) return false;
      heavyKept += 1;
    }
    return true;
  });

  let pullCount = 0;
  const filterPull = (list) =>
    list.filter((ex) => {
      if (!isPullExercise(ex)) return true;
      pullCount += 1;
      return pullCount <= maxPull;
    });

  let ordered = [...filterPull(keptMains), ...filterPull(accessories.slice(0, 2)), ...cardio];

  while (ordered.length > capEx) ordered.pop();

  let sets = estimateEffectiveSets(ordered);
  while (sets > maxTotalSets && ordered.length > 0) {
    ordered.pop();
    sets = estimateEffectiveSets(ordered);
  }

  return ordered;
}
