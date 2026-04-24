/**
 * Trophées contributions GitHub : évaluation + persistance déblocages + XP (IndexedDB).
 */

import { flattenWeeksToDayMap, prevUtcCalendarDay, contributionStreaksFromWeeks } from '../../utils/githubContributions';
import { loadGithubTrophyUnlocks, saveGithubTrophyUnlocks, grantGithubTrophyXpOnce } from './codeJournalIDB';
import { GITHUB_CONTRIBUTION_TROPHY_DEFS } from './githubContributionTrophyCatalog';

function utcYmd(d) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/** Liste des dates UTC Y-M-D des `lastN` jours se terminant inclus à `endYmd`. */
export function rollingUtcDateKeys(endYmd, lastN) {
  const keys = [];
  let cur = endYmd;
  for (let i = 0; i < lastN; i += 1) {
    keys.push(cur);
    const p = prevUtcCalendarDay(cur);
    if (!p) break;
    cur = p;
  }
  return keys;
}

/**
 * @param {Map<string, { contributionCount?: number }>} dayMap
 * @param {string} endYmd
 * @param {number} windowDays
 */
export function windowStatsFromDayMap(dayMap, endYmd, windowDays) {
  const keys = rollingUtcDateKeys(endYmd, windowDays);
  let total = 0;
  let active = 0;
  for (const k of keys) {
    const c = Number(dayMap.get(k)?.contributionCount) || 0;
    total += c;
    if (c > 0) active += 1;
  }
  const calendarSpan = keys.length || 1;
  return {
    total,
    activeDays: active,
    avgPerActiveDay: active > 0 ? total / active : 0,
    avgPerCalendarDay: total / calendarSpan,
    spanDays: calendarSpan,
  };
}

function lifetimeTotalFromMap(dayMap) {
  let t = 0;
  for (const d of dayMap.values()) {
    t += Number(d?.contributionCount) || 0;
  }
  return t;
}

/** @deprecated utiliser GITHUB_CONTRIBUTION_TROPHY_DEFS */
export const TROPHY_DEFS = GITHUB_CONTRIBUTION_TROPHY_DEFS;

/**
 * @param {any[]} weeks — semaines GraphQL fusionnées
 */
export async function evaluateAndMergeTrophies(userId, weeks) {
  const existing = await loadGithubTrophyUnlocks(userId);
  const map = flattenWeeksToDayMap(weeks);
  const endYmd = utcYmd(new Date());
  const unlocked = { ...existing };
  const lifetimeTotal = lifetimeTotalFromMap(map);
  const streaks = weeks?.length ? contributionStreaksFromWeeks(weeks) : { longest: 0, current: 0, activeDaysTotal: 0 };
  const longestStreak = streaks.longest || 0;

  const window = (n) => windowStatsFromDayMap(map, endYmd, n);
  const ctx = { lifetimeTotal, longestStreak, window };

  const details = [];

  for (const def of GITHUB_CONTRIBUTION_TROPHY_DEFS) {
    let stats;
    if (def.windowDays != null) {
      stats = window(def.windowDays);
    } else if (def.streakMin != null) {
      stats = {
        total: longestStreak,
        activeDays: def.streakMin,
        avgPerActiveDay: 0,
        avgPerCalendarDay: 0,
        spanDays: def.streakMin,
      };
    } else {
      stats = {
        total: lifetimeTotal,
        activeDays: 0,
        avgPerActiveDay: 0,
        avgPerCalendarDay: 0,
        spanDays: null,
      };
    }

    const ok = def.met(ctx);
    const pct = Math.min(100, Math.max(0, def.progress(ctx)));
    details.push({
      id: def.id,
      title: def.title,
      windowDays: def.windowDays ?? null,
      streakMin: def.streakMin ?? null,
      description: def.description,
      xpReward: def.xpReward,
      stats,
      progressPercent: pct,
      met: ok,
    });
    if (ok && !unlocked[def.id]) {
      unlocked[def.id] = new Date().toISOString();
    }
  }

  await saveGithubTrophyUnlocks(userId, unlocked);

  for (const def of GITHUB_CONTRIBUTION_TROPHY_DEFS) {
    if (!def.met(ctx)) continue;
    try {
      await grantGithubTrophyXpOnce(userId, def.id, def.xpReward);
    } catch {
      // ne pas bloquer l’affichage des trophées
    }
  }

  return { unlocked, details };
}
