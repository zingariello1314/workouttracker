/**
 * Helpers pour le référentiel de scoring musculation (hors endurance).
 * @typedef {'reps'|'seconds'|'minutes'} ScoringUnit
 * @typedef {'dynamic'|'isometric'} ScoringType
 * @typedef {{ name: string, unit: ScoringUnit, difficultyStars: number, intensityCoeff: number, scoringType: ScoringType, aliases?: string[], muscleGroup?: string }} ScoringEntry
 */

export function slugifyScoringKey(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/** @param {string} name @param {ScoringUnit} unit @param {number} stars @param {number} coeff @param {object} [opts] */
export function scoringEntry(name, unit, stars, coeff, opts = {}) {
  const scoringType =
    opts.scoringType || (unit === 'seconds' ? 'isometric' : 'dynamic');
  return {
    key: slugifyScoringKey(name),
    name,
    unit,
    difficultyStars: stars,
    intensityCoeff: coeff,
    scoringType,
    aliases: opts.aliases || [],
    muscleGroup: opts.muscleGroup || ''
  };
}

/** @param {ScoringEntry[]} entries */
export function buildScoringMap(entries) {
  /** @type {Map<string, ScoringEntry>} */
  const byKey = new Map();
  /** @type {Map<string, string>} */
  const nameToKey = new Map();

  const register = (entry) => {
    if (!entry?.key) return;
    byKey.set(entry.key, entry);
    nameToKey.set(slugifyScoringKey(entry.name), entry.key);
    for (const alias of entry.aliases || []) {
      nameToKey.set(slugifyScoringKey(alias), entry.key);
    }
  };

  for (const raw of entries) {
    register(raw);
  }

  return { byKey, nameToKey };
}
