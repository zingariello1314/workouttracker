/**
 * F7.0 — Profilage isolé du bloc sync discoveries (pas de profil live).
 * Usage: npx vite-node scripts/f7-profile-discoveries.mjs
 *
 * Produit un tableau inclusive/exclusive/appels + volumes.
 * Ne mute aucune donnée sportive.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildPeriodDiscoveryBundle } from '../src/utils/sport/recapPeriodDiscoveries.js';
import { createRecapComputeScope, scopeStats } from '../src/utils/sport/recapComputeScope.js';
import { createRecapPerfTimer } from '../src/utils/sport/recapPerfInstrumentation.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'docs/analyses-documentation/moteur analyse v1');

const snapHist = JSON.parse(
  fs.readFileSync(
    path.join(root, 'docs/analyses-documentation/fixtures/workout-main-jul-oct-2026.json'),
    'utf8'
  )
);
const nameById = JSON.parse(
  fs.readFileSync(
    path.join(root, 'docs/analyses-documentation/fixtures/exercise-name-map-main.json'),
    'utf8'
  )
);
const getName = (id) => nameById[String(id)] || nameById[id] || `Ex ${id}`;

function buildSyntheticSnapshot({ days, exercises, setsPerEx = 3, repsBase = 10 }) {
  const reps = {};
  const checkedExercises = {};
  const start = new Date('2024-01-01T12:00:00Z');
  for (let d = 0; d < days; d += 1) {
    if (d % 2 === 1) continue;
    const dt = new Date(start.getTime() + d * 86400000);
    const ymd = dt.toISOString().slice(0, 10);
    for (let e = 1; e <= exercises; e += 1) {
      const id = 1000 + e;
      for (let s = 1; s <= setsPerEx; s += 1) {
        const key = `${ymd}_${id}`;
        reps[key] = repsBase + (e % 5) + (s % 3);
        checkedExercises[`${key}_s${s}`] = true;
      }
      checkedExercises[`${ymd}_${id}`] = true;
    }
  }
  return { reps, checkedExercises, enduranceData: { gtg: { days: {} }, sessions: {} } };
}

function volumeOf(snapshot, window) {
  const keys = Object.keys(snapshot?.reps || {});
  let inWin = 0;
  for (const k of keys) {
    const ymd = k.slice(0, 10);
    if ((!window.start || ymd >= window.start) && (!window.end || ymd <= window.end)) inWin += 1;
  }
  return {
    repKeysTotal: keys.length,
    repKeysInWindow: inWin,
    checkedKeys: Object.keys(snapshot?.checkedExercises || {}).length,
    spanDays:
      window.start && window.end
        ? Math.round(
            (Date.parse(`${window.end}T12:00:00Z`) - Date.parse(`${window.start}T12:00:00Z`)) /
              86400000
          ) + 1
        : null
  };
}

function rankedSteps(steps) {
  return Object.entries(steps || {})
    .map(([name, row]) => ({ name, ...row }))
    .sort((a, b) => b.inclusiveMs - a.inclusiveMs);
}

function profileOnce({ label, snapshot, window, period, getExerciseNameById }) {
  const computeScope = createRecapComputeScope({ snapshot, period, window });
  const perf = createRecapPerfTimer({ enabled: true, label });
  const t0 = performance.now();
  const bundle = buildPeriodDiscoveryBundle({
    snapshot,
    window,
    period,
    getExerciseNameById,
    computeScope,
    perfTimer: perf
  });
  const ms = Math.round((performance.now() - t0) * 100) / 100;
  const steps = perf.snapshot();
  return {
    label,
    period,
    window,
    ms,
    volume: volumeOf(snapshot, window),
    all: (bundle.all || []).length,
    selected: (bundle.selected || []).length,
    scope: scopeStats(computeScope),
    stepsRanked: rankedSteps(steps),
    steps
  };
}

const END_HIST = '2026-10-30';
const cases = [
  {
    label: 'hist-7d',
    snapshot: snapHist,
    window: { start: '2026-10-24', end: END_HIST },
    period: '7d',
    getExerciseNameById: getName,
    note: 'fixture juil–oct'
  },
  {
    label: 'hist-30d',
    snapshot: snapHist,
    window: { start: '2026-10-01', end: END_HIST },
    period: '30d',
    getExerciseNameById: getName,
    note: 'fixture juil–oct'
  },
  {
    label: 'hist-window-as-2y',
    snapshot: snapHist,
    window: { start: '2024-10-30', end: END_HIST },
    period: '2y',
    getExerciseNameById: getName,
    note: 'fenêtre 2y mais données fixture ~juil–oct seulement — mesure coût calendaire'
  }
];

for (const sz of [
  { label: 'synth-6m', days: 180, exercises: 12 },
  { label: 'synth-1y', days: 365, exercises: 16 },
  { label: 'synth-2y', days: 730, exercises: 20 }
]) {
  const synthetic = buildSyntheticSnapshot(sz);
  const end = new Date('2024-01-01T12:00:00Z');
  end.setUTCDate(end.getUTCDate() + sz.days - 1);
  const endYmd = end.toISOString().slice(0, 10);
  cases.push({
    label: sz.label,
    snapshot: synthetic,
    window: { start: '2024-01-01', end: endYmd },
    period: 'all',
    getExerciseNameById: (id) => `Ex ${id}`,
    note: 'synthetic-deterministic — pas un profil réel'
  });
}

const rows = [];
for (const c of cases) {
  console.error(`[f7-profile] start ${c.label}…`);
  const row = profileOnce(c);
  row.note = c.note;
  rows.push(row);
  const top = (row.stepsRanked || []).slice(0, 8)
    .map((s) => `${s.name}=${s.inclusiveMs}ms(${s.calls})`)
    .join(' | ');
  console.error(`[f7-profile] ${c.label} total=${row.ms}ms  top: ${top}`);
}

const summary = rows.map((r) => ({
  label: r.label,
  ms: r.ms,
  spanDays: r.volume.spanDays,
  repKeysInWindow: r.volume.repKeysInWindow,
  all: r.all,
  selected: r.selected,
  trajMisses: r.scope?.trajectoryMisses ?? null,
  trajHits: r.scope?.trajectoryHits ?? null,
  topExclusive: (r.stepsRanked || [])
    .slice()
    .sort((a, b) => b.exclusiveMs - a.exclusiveMs)
    .slice(0, 10)
    .map((s) => ({
      name: s.name,
      exclusiveMs: s.exclusiveMs,
      inclusiveMs: s.inclusiveMs,
      calls: s.calls
    })),
  topInclusive: (r.stepsRanked || []).slice(0, 10).map((s) => ({
    name: s.name,
    inclusiveMs: s.inclusiveMs,
    exclusiveMs: s.exclusiveMs,
    calls: s.calls
  })),
  note: r.note
}));

const dest = path.join(outDir, 'fixtures/f7-profile-discoveries.json');
fs.writeFileSync(
  dest,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      purpose: 'F7.0 — isolation coût sync buildPeriodDiscoveryBundle',
      liveBrowser: 'non — profil live verrouillé ; mesures fixture + synthétiques',
      rows: summary,
      full: rows
    },
    null,
    2
  ),
  'utf8'
);
console.log(JSON.stringify(summary, null, 2));
console.error(`[f7-profile] wrote ${dest}`);
