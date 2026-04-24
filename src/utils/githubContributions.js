/**
 * Agrégation calendrier de contributions GitHub (GraphQL viewer).
 */

import { fetchGitHubGraphql } from './githubApi';

// Dédoublonnage + micro-cache pour éviter les rafales de requêtes GraphQL
// quand plusieurs widgets demandent les mêmes données en parallèle.
const GITHUB_CACHE_TTL_MS = 15_000;
const contributionsRequestCache = new Map();

function tokenKey(accessToken) {
  const t = String(accessToken || '');
  if (!t) return 'anon';
  return `tok:${t.slice(-10)}`;
}

function getCachedValue(key) {
  const hit = contributionsRequestCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.ts > GITHUB_CACHE_TTL_MS) {
    contributionsRequestCache.delete(key);
    return null;
  }
  return hit.value;
}

function setCachedValue(key, value) {
  contributionsRequestCache.set(key, { value, ts: Date.now() });
}

async function withRequestDedup(cacheKey, fetcher) {
  const cached = getCachedValue(cacheKey);
  if (cached != null) return cached;

  const inflight = contributionsRequestCache.get(`${cacheKey}:inflight`)?.value;
  if (inflight) return inflight;

  const promise = (async () => {
    try {
      const data = await fetcher();
      setCachedValue(cacheKey, data);
      return data;
    } finally {
      contributionsRequestCache.delete(`${cacheKey}:inflight`);
    }
  })();

  contributionsRequestCache.set(`${cacheKey}:inflight`, { value: promise, ts: Date.now() });
  return promise;
}

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
  const key = `viewer:${tokenKey(accessToken)}`;
  return withRequestDedup(key, async () => {
    const data = await fetchGitHubGraphql(accessToken, VIEWER_META, {});
    return data?.viewer || null;
  });
}

export async function fetchContributionsForRange(accessToken, fromIso, toIso) {
  const key = `range:${tokenKey(accessToken)}:${fromIso}:${toIso}`;
  return withRequestDedup(key, async () => {
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
  });
}

/** Année civile UTC (aligné sur le graphe GitHub web). */
export function yearRangeUtc(year) {
  const from = `${year}-01-01T00:00:00Z`;
  const to = `${year}-12-31T23:59:59Z`;
  return { from, to };
}

function padUtc(n) {
  return String(n).padStart(2, '0');
}

/**
 * Fenêtre glissante « comme GitHub » : du même jour (UTC) il y a un an 00:00
 * jusqu’au jour courant 23:59 — évite d’afficher des mois futurs vides.
 */
export function rollingTwelveMonthsRangeUtc(now = new Date()) {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();
  const to = `${y}-${padUtc(m + 1)}-${padUtc(d)}T23:59:59Z`;
  const start = new Date(Date.UTC(y, m, d, 0, 0, 0, 0));
  start.setUTCFullYear(start.getUTCFullYear() - 1);
  const sy = start.getUTCFullYear();
  const sm = start.getUTCMonth();
  const sd = start.getUTCDate();
  const from = `${sy}-${padUtc(sm + 1)}-${padUtc(sd)}T00:00:00Z`;
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
  const key = `multi:${tokenKey(accessToken)}:${sorted.join(',')}`;
  return withRequestDedup(key, async () => {
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
  });
}

/** Jour suivant (UTC) au format YYYY-MM-DD. */
export function nextUtcCalendarDay(ymd) {
  const p = String(ymd || '').split('-').map(Number);
  if (p.length !== 3 || p.some((x) => !Number.isFinite(x))) return null;
  const dt = new Date(Date.UTC(p[0], p[1] - 1, p[2]));
  dt.setUTCDate(dt.getUTCDate() + 1);
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Jour précédent (UTC) au format YYYY-MM-DD. */
export function prevUtcCalendarDay(ymd) {
  const p = String(ymd || '').split('-').map(Number);
  if (p.length !== 3 || p.some((x) => !Number.isFinite(x))) return null;
  const dt = new Date(Date.UTC(p[0], p[1] - 1, p[2]));
  dt.setUTCDate(dt.getUTCDate() - 1);
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Histogramme des cases par palier (0 = vide … 4 = le plus actif). */
export function contributionTierHistogramFromWeeks(weeks) {
  const map = flattenWeeksToDayMap(weeks);
  const counts = [0, 0, 0, 0, 0];
  for (const d of map.values()) {
    const t = contributionLevelToTier(d.contributionLevel);
    if (t >= 0 && t <= 4) counts[t] += 1;
  }
  return counts;
}

/**
 * Jours actifs consécutifs : série la plus longue, et série « en cours » (se termine au dernier jour avec activité).
 */
export function contributionStreaksFromWeeks(weeks) {
  const map = flattenWeeksToDayMap(weeks);
  const active = new Set();
  for (const [date, day] of map) {
    if ((Number(day?.contributionCount) || 0) > 0) active.add(date);
  }
  const sorted = [...active].sort();
  let longest = 0;
  let run = 0;
  let prev = null;
  for (const date of sorted) {
    if (prev == null) {
      run = 1;
    } else if (nextUtcCalendarDay(prev) === date) {
      run += 1;
    } else {
      longest = Math.max(longest, run);
      run = 1;
    }
    prev = date;
  }
  longest = Math.max(longest, run);

  if (!sorted.length) {
    return { longest: 0, current: 0, activeDaysTotal: 0 };
  }

  /** Série « en cours » au sens GitHub : se termine au dernier jour avec activité. */
  const lastActive = sorted[sorted.length - 1];
  let current = 0;
  let d = lastActive;
  while (active.has(d)) {
    current += 1;
    const p = prevUtcCalendarDay(d);
    if (!p) break;
    d = p;
  }

  return { longest, current, activeDaysTotal: sorted.length };
}

/** Années UTC [start…now] à partir de `viewer.createdAt` (même logique que le hook GitHub). */
export function contributionYearSpanUtc(createdAtIso, maxYearsBack = 25) {
  const now = new Date().getUTCFullYear();
  let start = now - maxYearsBack;
  if (createdAtIso) {
    try {
      const y = new Date(createdAtIso).getUTCFullYear();
      if (!Number.isNaN(y)) start = Math.min(now, Math.max(start, y));
    } catch {
      // ignore
    }
  }
  const years = [];
  for (let y = start; y <= now; y += 1) years.push(y);
  if (!years.length) years.push(now);
  return years;
}
