/** Courbe niveau Sport (spec GRADES_SPORT_REFONTE §1). */

export function cumulXpForLevel(level) {
  const L = Math.max(1, Math.floor(Number(level) || 1));
  const u = L - 1;
  return 15 * u * u + 485 * u;
}

export function xpRequiredForLevelUp(fromLevel) {
  const L = Math.max(1, Math.floor(Number(fromLevel) || 1));
  return 500 + 30 * (L - 1);
}

export function levelFromTotalXp(totalXP) {
  const xp = Math.max(0, Math.floor(Number(totalXP) || 0));
  let level = 1;
  while (cumulXpForLevel(level + 1) <= xp && level < 200) {
    level += 1;
  }
  return level;
}

export function sportXpProgressInLevel(totalXP) {
  const xp = Math.max(0, Math.floor(Number(totalXP) || 0));
  const level = levelFromTotalXp(xp);
  const atStart = cumulXpForLevel(level);
  const atNext = cumulXpForLevel(level + 1);
  const span = atNext - atStart;
  const onLevel = xp - atStart;
  const needed = Math.max(0, atNext - xp);
  const percent = span > 0 ? (onLevel / span) * 100 : 0;
  return {
    level,
    xpOnLevel: onLevel,
    xpForLevel: span,
    xpNeeded: needed,
    percent: Math.min(100, Math.max(0, percent))
  };
}
