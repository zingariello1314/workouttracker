/**
 * F5 — Replay sélection éditoriale (7j / 30j / 3m / 6m + synthétiques longs).
 * Usage: npx vite-node scripts/f5-replay-periods.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildPeriodDiscoveryBundle } from '../src/utils/sport/recapPeriodDiscoveries.js';
import {
  classifyPhenomenon,
  phenomenonIdentity,
  isWeakDescriptiveCard,
  WEAK_DESCRIPTIVE_KINDS,
  EXERCISE_EPISODE_KINDS
} from '../src/utils/sport/recapEditorialSelection.js';
import { resolveVolumeDirection } from '../src/utils/sport/recapComposedNarration.js';

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

const f4BriefPath = path.join(
  root,
  'docs/analyses-documentation/moteur analyse v1/fixtures/f4-replay-brief.json'
);
let f4Before = null;
if (fs.existsSync(f4BriefPath)) {
  try {
    f4Before = JSON.parse(fs.readFileSync(f4BriefPath, 'utf8'));
  } catch {
    f4Before = null;
  }
}

const windows = {
  '7d': { start: '2026-10-24', end: '2026-10-30', voiceHint: 'week' },
  '30d': { start: '2026-10-01', end: '2026-10-30', voiceHint: 'month' },
  '3m': { start: '2026-08-01', end: '2026-10-30', voiceHint: 'long' },
  '6m': { start: '2026-05-01', end: '2026-10-30', voiceHint: 'long' }
};

function cardSummary(d) {
  return {
    kind: d.kind,
    nature: d.nature,
    title: d.title,
    body: d.body,
    score: d.score,
    informativeValue: d.informativeValue,
    phenomenon: d._phenomenon || classifyPhenomenon(d),
    phenomenonId: d._phenomenonId || phenomenonIdentity(d),
    composedOk: Boolean(d.metrics?.composedOk),
    trajectoryOk: Boolean(d.metrics?.trajectoryOk),
    weakDescriptive: isWeakDescriptiveCard(d),
    unresolvedName: /\bun mouvement\b/i.test(`${d.title || ''} ${d.metrics?.name || ''}`),
    editorialFactors: d._editorialValue?.factors || null,
    exerciseId: d.metrics?.exerciseId || null,
    continuity: d.metrics?.composedEvidence?.continuity?.kind || null,
    attribution: d.metrics?.composedEvidence?.volumeAttribution?.kind || null,
    volumeDirection: d.metrics?.composedEvidence
      ? resolveVolumeDirection(d.metrics.composedEvidence).direction
      : null
  };
}

function countDuplicates(selected) {
  const byPhen = new Map();
  let dupes = 0;
  for (const d of selected) {
    const id = phenomenonIdentity(d);
    if (!id || id.startsWith('global|')) continue;
    if (byPhen.has(id)) dupes += 1;
    else byPhen.set(id, d.kind);
  }
  return dupes;
}

function countContradictions(selected) {
  let n = 0;
  for (let i = 0; i < selected.length; i += 1) {
    for (let j = i + 1; j < selected.length; j += 1) {
      const a = selected[i];
      const b = selected[j];
      const ea = a.metrics?.exerciseId;
      const eb = b.metrics?.exerciseId;
      if (!ea || String(ea) !== String(eb)) continue;
      const ca = a.metrics?.composedEvidence;
      const cb = b.metrics?.composedEvidence;
      if (!ca || !cb) continue;
      const da = resolveVolumeDirection(ca).direction;
      const db = resolveVolumeDirection(cb).direction;
      if ((da === 'up' && db === 'down') || (da === 'down' && db === 'up')) n += 1;
    }
  }
  return n;
}

const out = {
  generatedAt: new Date().toISOString(),
  note: 'F5 replay — sélection éditoriale (phénomène, IV, caps, abstention) ; F2/F3/F4 non retunés',
  liveProfileInspected: false,
  periods: {},
  synthetic: {}
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
  const f5 = bundle.debug?.f5 || {};
  const composed = selected.filter((d) => d.metrics?.composedOk);
  const descriptive = selected.filter(
    (d) => isWeakDescriptiveCard(d) || WEAK_DESCRIPTIVE_KINDS.includes(d.kind)
  );
  const episodes = selected.filter(
    (d) => EXERCISE_EPISODE_KINDS.includes(d.kind) || String(d.kind).startsWith('disc_ms_return')
  );
  const beforePeriod = f4Before?.periods?.[period];
  const beforeKinds = Array.isArray(beforePeriod?.selectedKinds)
    ? beforePeriod.selectedKinds
    : Array.isArray(beforePeriod?.selected)
      ? beforePeriod.selected.map((x) => x.kind)
      : null;

  out.periods[period] = {
    ms,
    window,
    pool: all.length,
    eligible: f5.counts?.eligible ?? null,
    selected: selected.length,
    rejected: f5.counts?.rejected ?? null,
    counts: f5.counts || null,
    rejectedByReason: f5.rejectedByReason || bundle.debug?.droppedBy || null,
    selectedKinds: selected.map((d) => d.kind),
    beforeF4SelectedKinds: beforeKinds,
    composedCount: composed.length,
    descriptiveCount: descriptive.length,
    episodeCount: episodes.length,
    duplicatePhenomena: countDuplicates(selected),
    packVolumeContradictions: countContradictions(selected),
    unresolvedNameCount: selected.filter((d) =>
      /\bun mouvement\b/i.test(`${d.title || ''} ${d.metrics?.name || ''}`)
    ).length,
    cards: selected.map(cardSummary),
    texts: selected.map((d) => ({ kind: d.kind, title: d.title, body: d.body })),
    editorialDecisions: (f5.editorialDecisions || []).slice(0, 60),
    displaceLog: f5.displaceLog || bundle.debug?.displaceLog || [],
    reliabilityNotes: (bundle.reliabilityNotes || []).map((n) => n.kind)
  };
}

/** Synthétique : fenêtre 1 an / 2 ans / always avec peu de données documentées. */
function thinSnapshot() {
  const s = {
    reps: {},
    checkedExercises: {},
    calendarDayPlanSnapshots: {}
  };
  for (const d of ['2026-10-10', '2026-10-17', '2026-10-24', '2026-10-28']) {
    s.reps[`${d}_104`] = 40;
    s.checkedExercises[`${d}_104`] = true;
  }
  return s;
}

const thin = thinSnapshot();
for (const [label, window, period] of [
  ['1y_thin', { start: '2025-10-31', end: '2026-10-30' }, '1y'],
  ['2y_thin', { start: '2024-10-31', end: '2026-10-30' }, '2y'],
  ['always_thin', { start: '2020-01-01', end: '2026-10-30' }, 'all']
]) {
  const bundle = buildPeriodDiscoveryBundle({
    snapshot: thin,
    window,
    period,
    getExerciseNameById: getName,
    nameById,
    todayYmd: '2026-10-31'
  });
  out.synthetic[label] = {
    window,
    pool: (bundle.all || []).length,
    selected: (bundle.selected || []).length,
    selectedKinds: (bundle.selected || []).map((d) => d.kind),
    counts: bundle.debug?.f5?.counts || null,
    note: 'Fenêtre longue, densite réelle faible — le moteur doit s’abstenir plutôt que filler.'
  };
}

const outDir = path.join(root, 'docs/analyses-documentation/moteur analyse v1/fixtures');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'f5-replay-periods.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');

const brief = {
  generatedAt: out.generatedAt,
  periods: Object.fromEntries(
    Object.entries(out.periods).map(([k, v]) => [
      k,
      {
        pool: v.pool,
        selected: v.selected,
        composedCount: v.composedCount,
        descriptiveCount: v.descriptiveCount,
        duplicatePhenomena: v.duplicatePhenomena,
        packVolumeContradictions: v.packVolumeContradictions,
        unresolvedNameCount: v.unresolvedNameCount,
        selectedKinds: v.selectedKinds,
        beforeF4SelectedKinds: v.beforeF4SelectedKinds,
        titles: v.texts.map((t) => t.title)
      }
    ])
  ),
  synthetic: out.synthetic
};
fs.writeFileSync(path.join(outDir, 'f5-replay-brief.json'), JSON.stringify(brief, null, 2), 'utf8');

console.log(JSON.stringify(brief, null, 2));
console.log('\nWrote', outPath);
