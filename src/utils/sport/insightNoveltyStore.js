/**
 * Persistance locale de l'historique d'insights Récap (éviter répétitions sémantiques).
 */

const LS_KEY = 'momentum.recapInsightHistory.v1';
const SIG_KEY = 'momentum.recapInsightLastSignature.v1';
const MAX_ENTRIES = 180;
const RECENT_MS = 14 * 86400000;
const STALE_MS = 60 * 86400000;

/**
 * @typedef {{ id: string, theme: string, seenAt: number, count: number }} InsightHistoryEntry
 * @typedef {{ entries: InsightHistoryEntry[], version: number }} InsightHistory
 */

export function emptyInsightHistory() {
  return { version: 1, entries: [] };
}

function safeParse(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.entries)) return emptyInsightHistory();
    return {
      version: parsed.version || 1,
      entries: parsed.entries
        .filter((e) => e?.id && e?.theme)
        .map((e) => ({
          id: String(e.id),
          theme: String(e.theme),
          seenAt: Number(e.seenAt) || 0,
          count: Math.max(1, Number(e.count) || 1)
        }))
    };
  } catch {
    return emptyInsightHistory();
  }
}

/** @returns {InsightHistory} */
export function loadInsightHistory() {
  if (typeof window === 'undefined' || !window.localStorage) return emptyInsightHistory();
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return emptyInsightHistory();
    return pruneInsightHistory(safeParse(raw), Date.now());
  } catch {
    return emptyInsightHistory();
  }
}

/** @param {InsightHistory} history */
export function saveInsightHistory(history) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const pruned = pruneInsightHistory(history, Date.now());
    window.localStorage.setItem(LS_KEY, JSON.stringify(pruned));
  } catch {
    /* quota / private mode */
  }
}

/** @param {InsightHistory} history @param {number} [now] */
export function pruneInsightHistory(history, now = Date.now()) {
  const entries = (history?.entries || [])
    .filter((e) => now - e.seenAt <= STALE_MS)
    .sort((a, b) => b.seenAt - a.seenAt)
    .slice(0, MAX_ENTRIES);
  return { version: 1, entries };
}

/**
 * @param {InsightHistory} history
 * @param {{ id: string, theme: string }[]} items
 * @returns {InsightHistory}
 */
export function recordShownInsights(history, items, now = Date.now()) {
  const base = pruneInsightHistory(history || emptyInsightHistory(), now);
  const map = new Map(base.entries.map((e) => [e.id, { ...e }]));

  (items || []).forEach(({ id, theme }) => {
    if (!id || !theme) return;
    const prev = map.get(id);
    if (prev) {
      map.set(id, { ...prev, seenAt: now, count: prev.count + 1, theme });
    } else {
      map.set(id, { id, theme, seenAt: now, count: 1 });
    }
  });

  return pruneInsightHistory({ version: 1, entries: [...map.values()] }, now);
}

/** @param {InsightHistory} history @param {string} id */
export function findHistoryEntry(history, id) {
  return (history?.entries || []).find((e) => e.id === id) || null;
}

/** @param {InsightHistory} history @param {string} theme @param {number} [now] */
export function recentThemeCount(history, theme, now = Date.now(), withinMs = RECENT_MS) {
  return (history?.entries || []).filter(
    (e) => e.theme === theme && now - e.seenAt <= withinMs
  ).length;
}

export { RECENT_MS, STALE_MS };

export function loadLastInsightSignature() {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    return window.localStorage.getItem(SIG_KEY);
  } catch {
    return null;
  }
}

export function saveLastInsightSignature(signature) {
  if (typeof window === 'undefined' || !window.localStorage || !signature) return;
  try {
    window.localStorage.setItem(SIG_KEY, String(signature));
  } catch {
    /* ignore */
  }
}
