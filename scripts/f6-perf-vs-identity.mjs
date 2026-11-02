/**
 * F6 — Comparaison gains perf vs identité analytique.
 * Usage: npx vite-node scripts/f6-perf-vs-identity.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildPeriodDiscoveryBundle } from '../src/utils/sport/recapPeriodDiscoveries.js';
import { createRecapComputeScope, scopeStats } from '../src/utils/sport/recapComputeScope.js';

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

const windows = {
  today: { start: '2026-10-29', end: '2026-10-30' },
  '7d': { start: '2026-10-24', end: '2026-10-30' },
  '30d': { start: '2026-10-01', end: '2026-10-30' },
  '3m': { start: '2026-08-01', end: '2026-10-30' },
  '6m': { start: '2026-05-01', end: '2026-10-30', historyLimit: true }
};

function cardSemantic(d) {
  return {
    kind: d.kind,
    nature: d.nature || null,
    family: d.family || null,
    title: d.title,
    body: d.body,
    evidence: d.evidence ?? null,
    score: d.score ?? null,
    informativeValue: d.informativeValue ?? null,
    exerciseId: d.metrics?.exerciseId ?? null,
    name: d.metrics?.name ?? null,
    composedOk: Boolean(d.metrics?.composedOk),
    composedFactCount: d.metrics?.composedFactCount ?? null,
    continuity: d.metrics?.composedEvidence?.continuity?.kind ?? null,
    attribution: d.metrics?.composedEvidence?.volumeAttribution?.kind ?? null,
    trajectoryOk: Boolean(d.metrics?.trajectoryOk),
    trajectoryPrimaryStory: d.metrics?.trajectoryPrimaryStory ?? null,
    f4Used: Boolean(d.metrics?.f4Narration?.used),
    f4Depth: d.metrics?.f4Narration?.depth ?? null,
    phenomenonId: d._phenomenonId ?? null,
    phenomenon: d._phenomenon ?? null
  };
}

function poolKinds(bundle) {
  return (bundle.all || [])
    .map((d) => `${d.kind}|${d.metrics?.exerciseId ?? ''}|${d.title}`)
    .sort();
}

function selectedSemantic(bundle) {
  return (bundle.selected || []).map(cardSemantic);
}

function droppedReasons(bundle) {
  const acc = {};
  for (const d of bundle.dropped || []) {
    const r = d.reason || 'unknown';
    acc[r] = (acc[r] || 0) + 1;
  }
  return acc;
}

function diffArrays(a, b, label) {
  const sa = JSON.stringify(a);
  const sb = JSON.stringify(b);
  if (sa === sb) return { equal: true, label, lengthA: a?.length, lengthB: b?.length };
  // Localiser les premiers écarts
  const diffs = [];
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n && diffs.length < 8; i += 1) {
    if (JSON.stringify(a[i]) !== JSON.stringify(b[i])) {
      diffs.push({
        index: i,
        before: a[i] ?? null,
        after: b[i] ?? null
      });
    }
  }
  return { equal: false, label, lengthA: a.length, lengthB: b.length, sampleDiffs: diffs };
}

function runPair(period, window) {
  const t0 = performance.now();
  const without = buildPeriodDiscoveryBundle({
    snapshot: snap,
    window: { start: window.start, end: window.end },
    period,
    getExerciseNameById: getName
  });
  const msWithout = Math.round((performance.now() - t0) * 100) / 100;

  const scope = createRecapComputeScope({ snapshot: snap, period, window });
  const t1 = performance.now();
  const withScope = buildPeriodDiscoveryBundle({
    snapshot: snap,
    window: { start: window.start, end: window.end },
    period,
    getExerciseNameById: getName,
    computeScope: scope
  });
  const msWith = Math.round((performance.now() - t1) * 100) / 100;

  const selA = selectedSemantic(without);
  const selB = selectedSemantic(withScope);
  const poolA = poolKinds(without);
  const poolB = poolKinds(withScope);
  const dropA = droppedReasons(without);
  const dropB = droppedReasons(withScope);

  const selectedCmp = diffArrays(selA, selB, 'selected');
  const poolCmp = {
    equal: JSON.stringify(poolA) === JSON.stringify(poolB),
    lengthA: poolA.length,
    lengthB: poolB.length
  };
  const dropCmp = {
    equal: JSON.stringify(dropA) === JSON.stringify(dropB),
    before: dropA,
    after: dropB
  };

  // Champs non déterministes exclus explicitement
  const excludedFromIdentity = [
    'debug.f6.counters',
    'debug.f6.scopeId',
    'perf ms',
    'p35ComputeMs / p36ComputeMs'
  ];

  return {
    period,
    historyLimit: Boolean(window.historyLimit),
    timing: {
      withoutScopeMs: msWithout,
      withScopeMs: msWith,
      absoluteGainMs: Math.round((msWithout - msWith) * 100) / 100,
      relativeGainPct:
        msWithout > 0 ? Math.round((100 * (msWithout - msWith)) / msWithout) : null
    },
    scope: scopeStats(scope),
    identity: {
      selectedEqual: selectedCmp.equal,
      poolEqual: poolCmp.equal,
      droppedReasonsEqual: dropCmp.equal,
      selectedCount: selA.length,
      poolCount: poolA.length,
      selectedCmp,
      poolCmp,
      dropCmp,
      excludedFromIdentity
    },
    selectedCards: selA
  };
}

const results = {
  generatedAt: new Date().toISOString(),
  fixture: 'workout-main-jul-oct-2026',
  method:
    'Même snapshot/fenêtre ; sans scope vs avec createRecapComputeScope ; identité sémantique stricte',
  rule:
    'Une accélération qui change kind/title/body/score/informativeValue/preuves/sélection = régression',
  periods: {},
  summary: null
};

for (const [period, window] of Object.entries(windows)) {
  console.error(`[identity] ${period}…`);
  results.periods[period] = runPair(period, window);
}

const rows = Object.values(results.periods);
results.summary = {
  allSelectedEqual: rows.every((r) => r.identity.selectedEqual),
  allPoolEqual: rows.every((r) => r.identity.poolEqual),
  allDroppedEqual: rows.every((r) => r.identity.droppedReasonsEqual),
  periodsChecked: rows.map((r) => r.period),
  anySilentRegression: rows.some(
    (r) => !r.identity.selectedEqual || !r.identity.poolEqual
  ),
  timingNote:
    'Les ms ici sont un seul passage Node après chauffe partielle — voir baseline pour médianes. L’identité prime sur le Δms.'
};

const jsonPath = path.join(outDir, 'fixtures/f6-perf-vs-identity.json');
fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), 'utf8');
console.log(
  JSON.stringify(
    {
      summary: results.summary,
      perPeriod: Object.fromEntries(
        rows.map((r) => [
          r.period,
          {
            selectedEqual: r.identity.selectedEqual,
            poolEqual: r.identity.poolEqual,
            droppedEqual: r.identity.droppedReasonsEqual,
            selected: r.identity.selectedCount,
            Δms: r.timing.absoluteGainMs,
            Δpct: r.timing.relativeGainPct,
            lifetimeHits: r.scope?.lifetimeHits
          }
        ])
      )
    },
    null,
    2
  )
);
process.exit(results.summary.anySilentRegression ? 1 : 0);
