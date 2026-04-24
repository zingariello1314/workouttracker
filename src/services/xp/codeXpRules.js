/**
 * XP catégorie « Code / GitHub » à partir des stats agrégées contributions (profil).
 * Compte les contributions GitHub (commits, PR, issues, etc.), pas uniquement les commits git.
 */

export function progressiveContributionXp(totalContributions) {
  const total = Math.max(0, Number(totalContributions) || 0);
  let remaining = total;
  let xp = 0;

  const blocks = [
    { size: 10, xpEach: 24 },
    { size: 20, xpEach: 30 },
    { size: 30, xpEach: 38 },
    { size: 40, xpEach: 48 },
  ];

  for (const block of blocks) {
    if (remaining <= 0) break;
    const used = Math.min(remaining, block.size);
    xp += used * block.xpEach;
    remaining -= used;
  }

  if (remaining > 0) {
    // Après 100 contributions, progression douce avec une pente stable (évite les sauts trop brutaux).
    xp += remaining * 56;
  }

  return xp;
}

export function streakXpMultiplier(currentStreakDays) {
  const streak = Math.max(0, Number(currentStreakDays) || 0);
  if (streak <= 0) return 1;
  if (streak >= 10) return 3;
  if (streak >= 5) return 2;
  return 1 + streak * 0.2;
}

/**
 * @param {{ totalCommits?: number, activeCodingDays?: number } | null | undefined} stats
 * @param {{ currentStreakDays?: number } | undefined} options
 * @returns {number}
 */
export function computeCodeCategoryXp(stats, options = {}) {
  if (!stats) return 0;
  const total = Math.max(0, Number(stats.totalCommits) || 0);
  const active = Math.max(0, Number(stats.activeCodingDays) || 0);
  if (total === 0 && active === 0) return 0;

  const contributionsBaseXp = progressiveContributionXp(total);
  const regularityXp = active * 14;
  const streakMultiplier = streakXpMultiplier(options.currentStreakDays);
  const raw = (contributionsBaseXp + regularityXp) * streakMultiplier;
  return Math.min(220000, Math.round(raw));
}
