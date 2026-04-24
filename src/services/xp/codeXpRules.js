/**
 * XP catégorie « Code / GitHub » à partir des stats agrégées contributions (profil).
 * Compte les contributions GitHub (commits, PR, issues, etc.), pas uniquement les commits git.
 */

/**
 * @param {{ totalCommits?: number, activeCodingDays?: number } | null | undefined} stats
 * @returns {number}
 */
export function computeCodeCategoryXp(stats) {
  if (!stats) return 0;
  const total = Math.max(0, Number(stats.totalCommits) || 0);
  const active = Math.max(0, Number(stats.activeCodingDays) || 0);
  if (total === 0 && active === 0) return 0;
  // Pondération : régularité (jours actifs) + volume total, plafonné pour rester cohérent avec les autres catégories
  const raw = total * 2.4 + active * 10 + Math.sqrt(total + 1) * 3;
  return Math.min(120000, Math.round(raw));
}
