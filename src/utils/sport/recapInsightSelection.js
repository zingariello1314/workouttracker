/**
 * Sélection et rotation des insights — priorité aux analyses ancrées sur des données réelles.
 */

function hashString(str) {
  let h = 0;
  const s = String(str || '');
  for (let i = 0; i < s.length; i += 1) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/** Empreinte des données récentes pour faire varier les cartes affichées. */
export function buildInsightRotationSeed(snapshot, strengthExtract, records) {
  const parts = [];
  strengthExtract?.byBenchmarkKey?.forEach((m, key) => {
    if (m.bestRecord?.dateYmd) {
      parts.push(`${key}:${m.bestRecord.dateYmd}:${m.bestRecord.value}`);
    }
  });
  if (records?.bestPace?.date) parts.push(`pace:${records.bestPace.date}`);
  const keys = Object.keys(snapshot?.checkedExercises || {})
    .filter((k) => snapshot.checkedExercises[k])
    .sort()
    .slice(-8);
  parts.push(keys.join('|'));
  return hashString(parts.join(';'));
}

const LOW_VALUE_IDS = new Set([
  'structured_logs',
  'window_trend_flat'
]);

const LOW_VALUE_TEXT = /performances stables|séances comparables|phase de consolidation|poids d'environ \d+ autobus|éléphant/i;

/** Une seule carte tonnage / analogie lourde par sélection. */
const TONNAGE_ANALOGY_IDS = new Set([
  'tonnage_window',
  'tonnage_buses',
  'wow_elephant',
  'tonnage_context',
  'wow_bodyweight_moved'
]);

/**
 * @param {Array<{id, category, text, priority, drillDown?}>} insights
 */
export function selectDiverseBenchmarkInsights(insights, { seed = 0, maxTotal = 18, maxPerCategory = 4 } = {}) {
  const filtered = insights.filter((row) => {
    if (LOW_VALUE_IDS.has(row.id)) return false;
    if (LOW_VALUE_TEXT.test(String(row.text || ''))) return false;
    if (!row.text || String(row.text).trim().length < 12) return false;
    if (row.category === 'progression' && (row.priority || 0) < 68) {
      if (!row.drillDown?.storageKey) return false;
      if ((row.priority || 0) < 60) return false;
    }
    return true;
  });

  const score = (row) => {
    let s = row.priority || 0;
    if (row.drillDown?.dateYmd) s += 12;
    if (row.drillDown?.storageKey || row.drillDown?.exerciseName) s += 6;
    if (row.category === 'strength' && !row.drillDown) s -= 20;
    if (row.category === 'running' && !row.drillDown && !row.id?.startsWith('km_')) s -= 15;
    s += hashString(`${row.id}:${seed}`) % 18;
    return s;
  };

  const sorted = [...filtered].sort((a, b) => score(b) - score(a));

  const categoryCount = new Map();
  const seen = new Set();
  let hasTonnageAnalogy = false;
  const out = [];

  for (const row of sorted) {
    if (out.length >= maxTotal) break;
    if (seen.has(row.id)) continue;
    if (TONNAGE_ANALOGY_IDS.has(row.id)) {
      if (hasTonnageAnalogy) continue;
      hasTonnageAnalogy = true;
    }
    const catN = categoryCount.get(row.category) || 0;
    if (catN >= maxPerCategory) continue;
    seen.add(row.id);
    categoryCount.set(row.category, catN + 1);
    out.push(row);
  }

  return out;
}
