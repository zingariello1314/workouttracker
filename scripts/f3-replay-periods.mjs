/**
 * F3 — Replay composition multi-faits (7j / 30j / 3m + longues si couvertes).
 * Usage: npx vite-node scripts/f3-replay-periods.mjs
 *
 * Documente pool, kinds, compositions, textes — sans retune E0.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildPeriodDiscoveryBundle, measureRecapWindow } from '../src/utils/sport/recapPeriodDiscoveries.js';
import { primaryWindowForPeriod, journeyHistoricalWindow } from '../src/utils/sport/recapTemporalContracts.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
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
  '7d': { start: '2026-10-24', end: '2026-10-30' },
  '30d': { start: '2026-10-01', end: '2026-10-30' },
  '3m': { start: '2026-08-01', end: '2026-10-30' },
  // Fixture = juil–oct 2026 : 6m/1y calculables mais couverture réelle partielle
  '6m': { start: '2026-05-01', end: '2026-10-30' }
};

function summarizeDiscovery(d, { includeBody = true } = {}) {
  const ce = d.metrics?.composedEvidence || null;
  const base = {
    kind: d.kind,
    title: d.title,
    trajectoryOk: Boolean(d.metrics?.trajectoryOk),
    composedOk: Boolean(d.metrics?.composedOk),
    composedFactCount: d.metrics?.composedFactCount ?? null,
    primaryStory: d.metrics?.trajectoryPrimaryStory || null,
    setMechanism: d.metrics?.trajectorySetMechanism || null,
    peers: d.metrics?.trajectoryPeers || null,
    continuity: ce?.continuity?.kind || null,
    attribution: ce?.volumeAttribution?.kind || null,
    lexicon: ce?.lexicon?.subjectNoun || null,
    forbidden: (ce?.forbiddenConclusions || []).slice(0, 8),
    conclusion: ce?.conclusion?.text || null,
    comparatorsVerdict: ce?.comparators?.verdict || null,
    evidence: d.evidence || null
  };
  if (includeBody) base.body = d.body;
  return base;
}

const out = {
  generatedAt: new Date().toISOString(),
  note:
    'F3 replay — composedEvidence sur discoveries trajectoire ; E0 scores non retunés ; fixture jul–oct 2026',
  liveProfileInspected: false,
  periods: {}
};

for (const [period, window] of Object.entries(windows)) {
  const t0 = performance.now();
  const measure = measureRecapWindow({
    snapshot: snap,
    window,
    periodId: period,
    getExerciseNameById: getName
  });
  const bundle = buildPeriodDiscoveryBundle({
    snapshot: snap,
    window,
    period,
    getExerciseNameById: getName,
    nameById,
    todayYmd: '2026-10-31'
  });
  const ms = Math.round(performance.now() - t0);

  const all = bundle.all || [];
  const selected = bundle.selected || [];
  const composedAll = all.filter((d) => d.metrics?.composedOk);
  const composedSelected = selected.filter((d) => d.metrics?.composedOk);
  const trajAll = all.filter((d) => d.metrics?.trajectoryOk);

  const coverage = {
    strengthDays: measure.strengthDays,
    trainingDays: measure.trainingDays,
    totalReps: measure.totalReps,
    windowHasStrength: (measure.strengthDays || 0) > 0,
    note:
      period === '6m' || period === '1y'
        ? 'Fenêtre calculable ; couverture réelle limitée à juil–oct 2026 sur cette fixture'
        : 'Fenêtre couverte par la fixture'
  };

  out.periods[period] = {
    ms,
    window,
    primaryMeta: primaryWindowForPeriod(period, new Date(`${window.end}T12:00:00`)),
    journeyMeta: journeyHistoricalWindow(window.end),
    coverage,
    poolSize: all.length,
    selectedSize: selected.length,
    trajectoryOkPool: trajAll.length,
    composedOkPool: composedAll.length,
    composedOkSelected: composedSelected.length,
    selectedKinds: selected.map((d) => d.kind),
    selectedTitles: selected.map((d) => d.title),
    composedPoolSummary: (bundle.debug?.composedPool || null),
    selectedComposed: composedSelected.map((d) => summarizeDiscovery(d, { includeBody: true })),
    selectedTitlesBodies: selected.map((d) => ({
      kind: d.kind,
      title: d.title,
      body: d.body,
      composedOk: Boolean(d.metrics?.composedOk),
      factCount: d.metrics?.composedFactCount ?? null
    })),
    abstentions: {
      trajectoryWithoutComposition: trajAll.filter((d) => !d.metrics?.composedOk).length,
      peersInsufficient: trajAll.filter((d) => d.metrics?.trajectoryPeers === 'insufficient').length,
      noSetMechanism: trajAll.filter((d) => !d.metrics?.trajectorySetAvailable).length
    },
    sampleBeforeAfterNote:
      'Avant F3 : metrics.trajectory* sans composedEvidence ; après : composedEvidence + factCount + continuity/attribution/forbidden'
  };
}

const dest = path.join(
  root,
  'docs/analyses-documentation/moteur analyse v1/fixtures/f3-replay-periods.json'
);
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, JSON.stringify(out, null, 2), 'utf8');

const brief = {
  generatedAt: out.generatedAt,
  periods: Object.fromEntries(
    Object.entries(out.periods).map(([k, v]) => [
      k,
      {
        ms: v.ms,
        pool: v.poolSize,
        selected: v.selectedSize,
        composedPool: v.composedOkPool,
        composedSelected: v.composedOkSelected,
        selectedKinds: v.selectedKinds,
        composedTitles: v.selectedComposed.map((d) => d.title),
        continuities: [...new Set(v.selectedComposed.map((d) => d.continuity).filter(Boolean))],
        coverage: v.coverage
      }
    ])
  )
};
const briefDest = path.join(
  root,
  'docs/analyses-documentation/moteur analyse v1/fixtures/f3-replay-brief.json'
);
fs.writeFileSync(briefDest, JSON.stringify(brief, null, 2), 'utf8');
console.log(JSON.stringify(brief, null, 2));
console.log('wrote', dest);
console.log('wrote', briefDest);
