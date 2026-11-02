/**
 * F4 — Replay narration (7j / 30j / 3m / 6m) — avant/après via draft*BeforeF4.
 * Usage: npx vite-node scripts/f4-replay-periods.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildPeriodDiscoveryBundle } from '../src/utils/sport/recapPeriodDiscoveries.js';

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
  '6m': { start: '2026-05-01', end: '2026-10-30' }
};

function depthVisible(d) {
  const n = d.metrics?.f4Narration;
  if (!n?.used) return 'not_narrated';
  return n.depth || 'unknown';
}

function factsUsed(d) {
  const ce = d.metrics?.composedEvidence;
  if (!ce?.composed) return [];
  const used = [];
  if (ce.decomposition && ce.decomposition.available !== false) used.push('decomposition');
  if (ce.continuity && !['unclear', 'insufficient'].includes(ce.continuity.kind)) used.push('continuity');
  if (ce.volumeAttribution) used.push('volumeAttribution');
  if (ce.comparators && ce.comparators.verdict !== 'insufficient') used.push('comparators');
  if (ce.windows?.historical) used.push('historicalContext');
  if (d.metrics?.f4Narration?.used) used.push('f4Narration');
  return used;
}

const out = {
  generatedAt: new Date().toISOString(),
  note: 'F4 replay — narration depuis composedEvidence ; E0 non retuné ; kinds attendus stables',
  liveProfileInspected: false,
  periods: {}
};

for (const [period, window] of Object.entries(windows)) {
  const t0 = performance.now();
  const bundle = buildPeriodDiscoveryBundle({
    snapshot: snap,
    window,
    period,
    getExerciseNameById: getName,
    nameById,
    todayYmd: '2026-10-31'
  });
  const ms = Math.round(performance.now() - t0);
  const selected = bundle.selected || [];
  const all = bundle.all || [];

  const narratedSelected = selected.filter((d) => d.metrics?.f4Narration?.used);
  const composedSelected = selected.filter((d) => d.metrics?.composedOk);
  const beforeAfter = selected
    .filter((d) => d.metrics?.composedOk || d.metrics?.f4Narration)
    .map((d) => ({
      kind: d.kind,
      depth: depthVisible(d),
      narrated: Boolean(d.metrics?.f4Narration?.used),
      consistencyOk: d.metrics?.f4Narration?.consistencyOk !== false && d.metrics?.f4Narration?.used,
      consistencyIssues: d.metrics?.f4Narration?.consistencyIssues || [],
      abstained: Boolean(d.metrics?.f4Narration?.abstained),
      factsUsed: factsUsed(d),
      titleBefore: d.metrics?.draftTitleBeforeF4 || null,
      titleAfter: d.title,
      bodyBefore: d.metrics?.draftBodyBeforeF4 || null,
      bodyAfter: d.body,
      continuity: d.metrics?.composedEvidence?.continuity?.kind || null,
      attribution: d.metrics?.composedEvidence?.volumeAttribution?.kind || null,
      setMechanism: d.metrics?.trajectorySetMechanism || null,
      volumeDirection: d.metrics?.f4Narration?.volumeDirection || null
    }));
  const narratedOk = beforeAfter.filter((x) => x.narrated && x.consistencyOk);

  out.periods[period] = {
    ms,
    window,
    poolSize: all.length,
    selectedSize: selected.length,
    selectedKinds: selected.map((d) => d.kind),
    composedOkSelected: composedSelected.length,
    narratedSelected: narratedSelected.length,
    narrationCoherent: narratedOk.length,
    abstainedNarration: beforeAfter.filter((x) => x.abstained).length,
    depthCounts: narratedSelected.reduce((acc, d) => {
      const k = depthVisible(d);
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {}),
    visibleDepthScore: {
      compositionAvailable: composedSelected.length,
      compositionUsedInText: narratedSelected.length,
      narrationCoherentVerified: narratedOk.length,
      withMechanism: beforeAfter.filter((x) => x.narrated && (x.factsUsed.includes('decomposition') || x.factsUsed.includes('volumeAttribution'))).length,
      withContinuity: beforeAfter.filter((x) => x.narrated && x.factsUsed.includes('continuity')).length,
      withComparator: beforeAfter.filter((x) => x.narrated && x.factsUsed.includes('comparators')).length
    },
    f4Debug: bundle.debug?.f4 || null,
    beforeAfter,
    editorialWarnings: (bundle.debug?.f4?.editorialTrace || []).slice(0, 20)
  };
}

const dest = path.join(
  root,
  'docs/analyses-documentation/moteur analyse v1/fixtures/f4-replay-periods.json'
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
        selected: v.selectedSize,
        kinds: v.selectedKinds,
        narrated: v.narratedSelected,
        coherent: v.narrationCoherent,
        composed: v.composedOkSelected,
        depthCounts: v.depthCounts,
        visibleDepthScore: v.visibleDepthScore,
        sampleTitles: v.beforeAfter.filter((x) => x.narrated).slice(0, 6).map((x) => ({
          before: x.titleBefore,
          after: x.titleAfter,
          depth: x.depth,
          consistencyOk: x.consistencyOk
        }))
      }
    ])
  )
};
const briefDest = path.join(
  root,
  'docs/analyses-documentation/moteur analyse v1/fixtures/f4-replay-brief.json'
);
fs.writeFileSync(briefDest, JSON.stringify(brief, null, 2), 'utf8');
console.log(JSON.stringify(brief, null, 2));
console.log('wrote', dest);
console.log('wrote', briefDest);
