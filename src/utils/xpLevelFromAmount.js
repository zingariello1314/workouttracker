/**
 * Niveau et progression pour une quantité d’XP avec paliers **fixes** (Code, etc.).
 * Le niveau **global** du dashboard utilise `globalLevelProgress` (coût croissant par niveau).
 * @param {number} amount
 * @param {number} [step=1000]
 */
export function levelProgressFromXpAmount(amount, step = 1000) {
  const total = Math.max(0, Math.round(Number(amount) || 0));
  const level = Math.floor(total / step) + 1;
  const xpForCurrentLevel = (level - 1) * step;
  const xpForNextLevel = level * step;
  const xpProgress = total - xpForCurrentLevel;
  const xpNeeded = Math.max(0, xpForNextLevel - total);
  const span = xpForNextLevel - xpForCurrentLevel;
  const percent = span > 0 ? (xpProgress / span) * 100 : 0;
  return {
    level,
    progress: {
      percent: Math.min(100, Math.max(0, percent)),
      xpNeeded,
    },
  };
}
