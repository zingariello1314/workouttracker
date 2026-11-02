/**
 * F6 — Baseline / benchmark reproductible (Node via vite-node).
 * Usage: npx vite-node scripts/f6-benchmark-baseline.mjs
 *
 * Sépare fixture historique (juil–oct 2026) et fixture synthétique longue.
 * Ne présente jamais une mesure fixture comme profil live.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildPeriodDiscoveryBundle } from '../src/utils/sport/recapPeriodDiscoveries.js';
import { createRecapComputeScope, scopeStats } from '../src/utils/sport/recapComputeScope.js';
import { createRecapPerfTimer } from '../src/utils/sport/recapPerfInstrumentation.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'docs/analyses-documentation/moteur analyse v1');

const snap = JSON.parse(
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
const getName = (id) => nameById[String(id)] || nameById[id] || '';

const END = '2026-10-30';

/** Fenêtres produit — historique juil–oct limité pour 6m/1y/2y/toujours. */
const windows = {
  today: { start: '2026-10-29', end: END, note: 'approx 24h glissante (borne fixture)' },
  '7d': { start: '2026-10-24', end: END },
  '30d': { start: '2026-10-01', end: END },
  '3m': { start: '2026-08-01', end: END },
  '6m': {
    start: '2026-05-01',
    end: END,
    historyLimit: 'fixture commence ~2026-07 — données avant manquantes'
  },
  '1y': {
    start: '2025-10-30',
    end: END,
    historyLimit: 'fixture juil–oct 2026 seulement'
  },
  '2y': {
    start: '2024-10-30',
    end: END,
    historyLimit: 'fixture juil–oct 2026 seulement'
  },
  all: {
    start: null,
    end: END,
    historyLimit: 'fixture juil–oct 2026 seulement'
  }
};

function percentile(sorted, p) {
  if (!sorted.length) return null;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

function median(arr) {
  const s = [...arr].sort((a, b) => a - b);
  if (!s.length) return null;
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round(((s[mid - 1] + s[mid]) / 2) * 100) / 100;
}

function runOnce(period, window, { useScope }) {
  const t0 = performance.now();
  const computeScope = useScope
    ? createRecapComputeScope({ snapshot: snap, period, window })
    : null;
  const perf = createRecapPerfTimer({ enabled: true, label: period });
  const bundle = buildPeriodDiscoveryBundle({
    snapshot: snap,
    window: { start: window.start, end: window.end },
    period,
    getExerciseNameById: getName,
    computeScope,
    perfTimer: perf
  });
  const ms = Math.round((performance.now() - t0) * 100) / 100;
  const selected = (bundle.selected || []).map((d) => ({
    kind: d.kind,
    title: d.title,
    body: d.body,
    informativeValue: d.informativeValue,
    exerciseId: d.metrics?.exerciseId || null,
    composedOk: Boolean(d.metrics?.composedOk)
  }));
  return {
    ms,
    all: (bundle.all || []).length,
    selected: selected.length,
    composedOk: selected.filter((d) => d.composedOk).length,
    trajMisses: computeScope?.counters?.trajectoryMisses ?? null,
    trajHits: computeScope?.counters?.trajectoryHits ?? null,
    lifetimeHits: computeScope?.counters?.lifetimeHits ?? null,
    lifetimeMisses: computeScope?.counters?.lifetimeMisses ?? null,
    scope: scopeStats(computeScope),
    steps: perf.snapshot(),
    selectedCards: selected
  };
}

function measurePeriod(period, window, passes = 5) {
  const coldNoScope = runOnce(period, window, { useScope: false });
  const coldScope = runOnce(period, window, { useScope: true });
  const warmNo = [];
  const warmScope = [];
  for (let i = 0; i < passes; i += 1) {
    warmNo.push(runOnce(period, window, { useScope: false }).ms);
    warmScope.push(runOnce(period, window, { useScope: true }).ms);
  }
  const sortNo = [...warmNo].sort((a, b) => a - b);
  const sortSc = [...warmScope].sort((a, b) => a - b);
  return {
    period,
    window,
    historyLimit: window.historyLimit || null,
    fixture: 'workout-main-jul-oct-2026',
    environment: {
      runtime: 'node/vite-node',
      note: 'Pas un navigateur réel ni un profil live'
    },
    cold: {
      withoutScopeMs: coldNoScope.ms,
      withScopeMs: coldScope.ms,
      absoluteGainMs: Math.round((coldNoScope.ms - coldScope.ms) * 100) / 100,
      relativeGainPct:
        coldNoScope.ms > 0
          ? Math.round((100 * (coldNoScope.ms - coldScope.ms)) / coldNoScope.ms)
          : null,
      scopeCounters: coldScope.scope,
      steps: coldScope.steps,
      all: coldScope.all,
      selected: coldScope.selected,
      composedOk: coldScope.composedOk
    },
    warm: {
      passes,
      withoutScope: {
        samplesMs: warmNo,
        medianMs: median(warmNo),
        p95Ms: percentile(sortNo, 95)
      },
      withScope: {
        samplesMs: warmScope,
        medianMs: median(warmScope),
        p95Ms: percentile(sortSc, 95)
      },
      absoluteGainMedianMs:
        median(warmNo) != null && median(warmScope) != null
          ? Math.round((median(warmNo) - median(warmScope)) * 100) / 100
          : null,
      relativeGainMedianPct:
        median(warmNo) > 0
          ? Math.round((100 * (median(warmNo) - median(warmScope))) / median(warmNo))
          : null
    },
    nonRegressionFingerprint: coldScope.selectedCards.map((c) => `${c.kind}|${c.title}|${c.exerciseId}`)
  };
}

/** Fixture synthétique dense déterministe pour tests d'échelle. */
function buildSyntheticSnapshot({ days, exercises, setsPerEx = 3, repsBase = 10 }) {
  const reps = {};
  const checkedExercises = {};
  const start = new Date('2024-01-01T12:00:00Z');
  for (let d = 0; d < days; d += 1) {
    if (d % 2 === 1) continue; // clairsemé : 1 jour sur 2
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

function measureScale() {
  const sizes = [
    { label: '6w', days: 42, exercises: 8 },
    { label: '6m', days: 180, exercises: 12 },
    { label: '1y', days: 365, exercises: 16 },
    { label: '2y', days: 730, exercises: 20 }
  ];
  const out = [];
  for (const sz of sizes) {
    const synthetic = buildSyntheticSnapshot(sz);
    const end = new Date('2024-01-01T12:00:00Z');
    end.setUTCDate(end.getUTCDate() + sz.days - 1);
    const endYmd = end.toISOString().slice(0, 10);
    const window = { start: '2024-01-01', end: endYmd };
    const t0 = performance.now();
    const scope = createRecapComputeScope({ snapshot: synthetic, period: sz.label, window });
    const bundle = buildPeriodDiscoveryBundle({
      snapshot: synthetic,
      window,
      period: 'all',
      getExerciseNameById: (id) => `Ex ${id}`,
      computeScope: scope
    });
    const ms = Math.round((performance.now() - t0) * 100) / 100;
    out.push({
      label: sz.label,
      days: sz.days,
      exercises: sz.exercises,
      ms,
      all: (bundle.all || []).length,
      selected: (bundle.selected || []).length,
      scope: scopeStats(scope),
      fixture: 'synthetic-deterministic',
      note: 'Pas un profil réel'
    });
  }
  return out;
}

const results = {
  generatedAt: new Date().toISOString(),
  method:
    'vite-node ; performance.now ; froid = 1er passage ; chaud = 5 passages ; médiane + p95',
  liveProfile: 'non accessible — non mesuré',
  browserGuest: 'non mesuré dans ce script Node',
  periods: {},
  scaleSynthetic: null
};

// Moins de passes chaudes pour rester reproductible sous ~2–3 min Node.
const PASS_WARM = 3;
for (const [period, window] of Object.entries(windows)) {
  console.error(`[f6-bench] period=${period}…`);
  results.periods[period] = measurePeriod(period, window, PASS_WARM);
}

console.error('[f6-bench] scale synthetic…');
results.scaleSynthetic = measureScale();

const briefPath = path.join(outDir, 'fixtures/f6-benchmark-brief.json');
fs.mkdirSync(path.dirname(briefPath), { recursive: true });
fs.writeFileSync(briefPath, JSON.stringify(results, null, 2), 'utf8');

const md = [];
md.push('# F6 — Baseline & benchmarks');
md.push('');
md.push(`Généré : ${results.generatedAt}`);
md.push('');
md.push('## Conditions');
md.push('');
md.push(`- Runtime : ${results.method}`);
md.push('- Fixture historique : `workout-main-jul-oct-2026`');
md.push('- Profil live : **non mesuré**');
md.push('- Navigateur guest : **non mesuré**');
md.push('');
md.push('| Période | Froid sans scope (ms) | Froid avec scope (ms) | Gain froid % | Chaud médiane sans | Chaud médiane avec | Gain chaud % | Sélectionnées | Limite historique |');
md.push('|---|---:|---:|---:|---:|---:|---:|---:|---|');
for (const [period, row] of Object.entries(results.periods)) {
  md.push(
    `| ${period} | ${row.cold.withoutScopeMs} | ${row.cold.withScopeMs} | ${row.cold.relativeGainPct ?? '—'} | ${row.warm.withoutScope.medianMs} | ${row.warm.withScope.medianMs} | ${row.warm.relativeGainMedianPct ?? '—'} | ${row.cold.selected} | ${row.historyLimit || 'ok'} |`
  );
}
md.push('');
md.push('## Charge synthétique');
md.push('');
md.push('| Taille | Jours | Exercices | ms | all | selected | trajHits | lifetimeHits |');
md.push('|---|---:|---:|---:|---:|---:|---:|---:|');
for (const row of results.scaleSynthetic) {
  md.push(
    `| ${row.label} | ${row.days} | ${row.exercises} | ${row.ms} | ${row.all} | ${row.selected} | ${row.scope?.trajectoryHits ?? 0} | ${row.scope?.lifetimeHits ?? 0} |`
  );
}
md.push('');
md.push('Voir aussi `fixtures/f6-benchmark-brief.json`.');

fs.writeFileSync(path.join(outDir, 'BASELINE-BENCHMARKS-F6-2026-11-01.md'), md.join('\n'), 'utf8');
console.log(JSON.stringify({
  wrote: briefPath,
  periods: Object.fromEntries(
    Object.entries(results.periods).map(([k, v]) => [
      k,
      {
        coldGainPct: v.cold.relativeGainPct,
        warmGainPct: v.warm.relativeGainMedianPct,
        selected: v.cold.selected,
        lifetimeHits: v.cold.scopeCounters?.lifetimeHits
      }
    ])
  ),
  scale: results.scaleSynthetic.map((r) => ({ label: r.label, ms: r.ms, selected: r.selected }))
}, null, 2));
