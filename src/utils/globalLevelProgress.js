/**
 * Niveau global (dashboard) — courbe type “RPG long terme”.
 *
 * XP pour passer du niveau **n** au niveau **n + 1** (n ≥ 1) :
 *   400 × n^1.55 × (1 + 0.0015n)
 * puis multiplicateurs de palier :
 *   - n multiple de 50 : ×1.4
 *   - sinon n multiple de 10 : ×1.2
 * (un multiple de 50 ne prend que ×1.4, comme dans ta spec.)
 *
 * Début adouci : pour les segments **n < 30** (jusqu’à entrer dans le niveau 30),
 * l’XP demandée est multipliée par {@link EARLY_GAME_XP_FACTOR} (courbe identique,
 * paliers ×1.2 / ×1.4 conservés, puis allègement global).
 */

const MAX_LEVEL_SCAN = 500_000;
/** Segments avec n < EARLY_GAME_UNTIL_SEGMENT → XP réduite (onboarding plus fluide). */
const EARLY_GAME_UNTIL_SEGMENT = 30;
/** < 1 : moins d’XP que la formule brute pour n = 1 … 29. */
const EARLY_GAME_XP_FACTOR = 0.42;

/**
 * @param {number} fromLevel — niveau de départ du segment (1 = passage 1 → 2)
 */
export function xpRequiredForSegment(fromLevel) {
  const n = Math.max(1, Math.floor(Number(fromLevel) || 1));
  let base = 400 * n ** 1.55 * (1 + 0.0015 * n);
  if (n % 50 === 0) {
    base *= 1.4;
  } else if (n % 10 === 0) {
    base *= 1.2;
  }
  if (n < EARLY_GAME_UNTIL_SEGMENT) {
    base *= EARLY_GAME_XP_FACTOR;
  }
  return Math.max(1, Math.round(base));
}

/** XP cumulée minimale pour *entrer* dans ce niveau (niveau 1 = 0). */
export function cumulativeXpAtLevelStart(level) {
  const L = Math.max(1, Math.floor(Number(level) || 1));
  if (L <= 1) return 0;
  let sum = 0;
  for (let i = 1; i <= L - 1; i += 1) {
    sum += xpRequiredForSegment(i);
  }
  return sum;
}

/** XP totale → niveau courant (1-based). */
export function globalLevelFromTotalXp(totalXP) {
  const t = Math.max(0, Math.floor(Number(totalXP) || 0));
  let level = 1;
  let start = 0;
  while (level < MAX_LEVEL_SCAN) {
    const seg = xpRequiredForSegment(level);
    if (start + seg > t) break;
    start += seg;
    level += 1;
  }
  return level;
}

/**
 * @param {number} totalXP
 * @returns {{
 *   level: number,
 *   progress: {
 *     percent: number,
 *     xpNeeded: number,
 *     xpOnLevel: number,
 *     xpForLevel: number,
 *   },
 * }}
 */
export function globalLevelProgressFromTotalXp(totalXP) {
  const t = Math.max(0, Math.floor(Number(totalXP) || 0));
  let level = 1;
  let start = 0;
  while (level < MAX_LEVEL_SCAN) {
    const seg = xpRequiredForSegment(level);
    if (start + seg > t) break;
    start += seg;
    level += 1;
  }

  const span = Math.max(1, xpRequiredForSegment(level));
  const end = start + span;
  const xpOnLevel = t - start;
  const xpNeeded = Math.max(0, end - t);
  const percent = (xpOnLevel / span) * 100;

  return {
    level,
    progress: {
      percent: Math.min(100, Math.max(0, percent)),
      xpNeeded,
      xpOnLevel,
      xpForLevel: span,
    },
  };
}
