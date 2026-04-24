/**
 * Agrégation calendrier de contributions GitHub (GraphQL viewer).
 */

import { fetchGitHubGraphql } from './githubApi';

const VIEWER_META = `
  query ViewerMeta {
    viewer {
      login
      createdAt
    }
  }
`;

const CONTRIBUTIONS_YEAR = `
  query ContributionsYear($from: DateTime!, $to: DateTime!) {
    viewer {
      login
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
              contributionLevel
              color
            }
          }
        }
      }
    }
  }
`;

export async function fetchViewerMeta(accessToken) {
  const data = await fetchGitHubGraphql(accessToken, VIEWER_META, {});
  return data?.viewer || null;
}

export async function fetchContributionsForRange(accessToken, fromIso, toIso) {
  const data = await fetchGitHubGraphql(accessToken, CONTRIBUTIONS_YEAR, {
    from: fromIso,
    to: toIso,
  });
  const coll = data?.viewer?.contributionsCollection;
  const cal = coll?.contributionCalendar;
  if (!coll || !cal) return null;
  return {
    login: data.viewer.login,
    totalContributions: cal.totalContributions ?? 0,
    weeks: cal.weeks || [],
  };
}

/** Année civile UTC (aligné sur le graphe GitHub web). */
export function yearRangeUtc(year) {
  const from = `${year}-01-01T00:00:00Z`;
  const to = `${year}-12-31T23:59:59Z`;
  return { from, to };
}

export function flattenWeeksToDayMap(weeks) {
  const map = new Map();
  for (const w of weeks || []) {
    for (const d of w.contributionDays || []) {
      if (d?.date) {
        map.set(d.date, d);
      }
    }
  }
  return map;
}

export function contributionLevelToTier(level) {
  const v = String(level || 'NONE').toUpperCase();
  if (v === 'FOURTH_QUARTILE') return 4;
  if (v === 'THIRD_QUARTILE') return 3;
  if (v === 'SECOND_QUARTILE') return 2;
  if (v === 'FIRST_QUARTILE') return 1;
  return 0;
}

export function tierToHeatClass(tier) {
  if (tier >= 4) return 'gh4';
  if (tier === 3) return 'gh3';
  if (tier === 2) return 'gh2';
  if (tier === 1) return 'gh1';
  return 'gh0';
}

/**
 * Statistiques sur une liste de semaines (une année ou agrégat multi-requêtes avec jours uniques).
 */
export function computeContributionStats(weeks) {
  const map = flattenWeeksToDayMap(weeks);
  let total = 0;
  let activeDays = 0;
  let bestDate = null;
  let bestCount = -1;
  for (const d of map.values()) {
    const c = Number(d.contributionCount) || 0;
    total += c;
    if (c > 0) activeDays += 1;
    if (c > bestCount) {
      bestCount = c;
      bestDate = d.date;
    }
  }
  const calendarDays = map.size;
  return {
    totalCommits: total,
    activeCodingDays: activeDays,
    calendarDays,
    avgPerActiveDay: activeDays > 0 ? total / activeDays : 0,
    avgPerCalendarDay: calendarDays > 0 ? total / calendarDays : 0,
    bestDay: bestDate && bestCount > 0 ? { date: bestDate, count: bestCount } : null,
  };
}

/**
 * Charge plusieurs années en parallèle (dédoublonne les jours par clé date).
 */
export async function fetchMultiYearContributions(accessToken, years) {
  const sorted = [...new Set(years)].sort((a, b) => a - b);
  const chunks = [];
  const batchSize = 4;
  for (let i = 0; i < sorted.length; i += batchSize) {
    const batch = sorted.slice(i, i + batchSize);
    const part = await Promise.all(
      batch.map(async (y) => {
        const { from, to } = yearRangeUtc(y);
        const one = await fetchContributionsForRange(accessToken, from, to);
        return { year: y, weeks: one?.weeks || [], total: one?.totalContributions ?? 0 };
      }),
    );
    chunks.push(...part);
    if (i + batchSize < sorted.length) {
      await new Promise((r) => setTimeout(r, 120));
    }
  }
  const mergedWeeksByDate = new Map();
  for (const ch of chunks) {
    const m = flattenWeeksToDayMap(ch.weeks);
    for (const [k, v] of m) mergedWeeksByDate.set(k, v);
  }
  // Reconstruire des « semaines » factices n'est pas nécessaire pour les stats ; pour le graphe année unique on affiche une année.
  const allWeeks = chunks.flatMap((c) => c.weeks);
  const stats = computeContributionStats(allWeeks);
  return {
    years: chunks,
    stats,
    perYearTotals: Object.fromEntries(chunks.map((c) => [String(c.year), c.total])),
  };
}
