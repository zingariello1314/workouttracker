/**
 * Rejeu P3.2b — Phase 1 candidats + packs avant/après (Phase 2).
 * Usage: npx vite-node scripts/p32b-replay-oct.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildP32bMuscleDiscoveries } from '../src/utils/sport/recapMuscleP32bDiscoveries.js';
import { buildPeriodDiscoveryBundle } from '../src/utils/sport/recapPeriodDiscoveries.js';
import { resolveContentClass } from '../src/utils/sport/recapDiscoveryContentClass.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const snapshot = JSON.parse(
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
  '7j': { start: '2026-10-24', end: '2026-10-30' },
  '30j': { start: '2026-10-01', end: '2026-10-30' },
  '3m': { start: '2026-08-01', end: '2026-10-30' },
  long: { start: '2026-07-01', end: '2026-10-30' }
};

const P32B_KIND_SET = new Set([
  'disc_muscle_exposure_contrast',
  'disc_muscle_exposure_shift',
  'disc_muscle_movement_structure',
  'disc_muscle_plan_vs_actual',
  'disc_muscle_ledger_limits'
]);

const out = { generatedAt: new Date().toISOString(), horizons: {} };

for (const [label, window] of Object.entries(windows)) {
  const pack = buildP32bMuscleDiscoveries({
    snapshot,
    window,
    getExerciseNameById: getName,
    nameById
  });
  const before = buildPeriodDiscoveryBundle({
    snapshot,
    window,
    getExerciseNameById: getName,
    nameById,
    includeP32bMuscleDiscoveries: false
  });
  const after = buildPeriodDiscoveryBundle({
    snapshot,
    window,
    getExerciseNameById: getName,
    nameById,
    includeP32bMuscleDiscoveries: true
  });
  const slim = (d) => ({
    kind: d.kind,
    nature: d.nature,
    score: d.score,
    informativeValue: d.informativeValue,
    contentClass: resolveContentClass(d),
    title: d.title,
    body: d.body,
    evidence: d.evidence,
    metrics: d.metrics
  });
  out.horizons[label] = {
    window,
    metricsSummary: {
      W: {
        R: pack.metrics.W?.totals?.R,
        R_mono: pack.metrics.W?.totals?.R_mono,
        R_multi: pack.metrics.W?.totals?.R_multi,
        R_non_attr: pack.metrics.W?.totals?.R_non_attr,
        iso: pack.metrics.W?.reliability?.isoSecondsSum
      },
      C: { R: pack.metrics.C?.totals?.R },
      H: { R: pack.metrics.H?.totals?.R },
      comparableWC: pack.metrics.comparableWC,
      plan: {
        snapshotDayCount: pack.metrics.plan?.snapshotDayCount,
        planMuscleComparable: pack.metrics.plan?.planMuscleComparable,
        materialGap: pack.metrics.plan?.materialGap || null
      },
      flags: pack.metrics.flags,
      topGroups: (pack.metrics.W?.groups || []).slice(0, 8).map((g) => ({
        group: g.group,
        daysP: g.exposureDaysPrimary,
        daysS: g.exposureDaysSecondary,
        mono: g.monoReps,
        multiTouch: g.multiTouchReps,
        ex: g.distinctExercisesPrimary
      })),
      movement: pack.metrics.W?.movement
    },
    candidates: (pack.discoveries || []).map(slim),
    rejected: pack.rejected,
    packBeforeSelected: (before.selected || []).map((d) => ({
      kind: d.kind,
      title: d.title,
      informativeValue: d.informativeValue
    })),
    packAfterSelected: (after.selected || []).map((d) => ({
      kind: d.kind,
      title: d.title,
      informativeValue: d.informativeValue
    })),
    p32bInSelected: (after.selected || [])
      .filter((d) => P32B_KIND_SET.has(d.kind))
      .map((d) => d.kind),
    reliabilityNotesAfter: (after.reliabilityNotes || []).map((n) => ({
      kind: n.kind,
      title: n.title
    }))
  };
}

const dest = path.join(root, 'docs/analyses-documentation/fixtures/p32b-replay-oct-2026.json');
fs.writeFileSync(dest, JSON.stringify(out, null, 2));
console.log('Wrote', dest);
for (const [label, h] of Object.entries(out.horizons)) {
  console.log(`\n=== ${label} ===`);
  console.log(
    'R',
    h.metricsSummary.W.R,
    'mono',
    h.metricsSummary.W.R_mono,
    'multi',
    h.metricsSummary.W.R_multi,
    'snap',
    h.metricsSummary.plan.snapshotDayCount,
    'WC',
    h.metricsSummary.comparableWC
  );
  console.log('cand', h.candidates.map((c) => c.kind).join('|') || '-');
  console.log('rej', h.rejected.map((r) => `${r.kind}:${r.reason}`).join('|'));
  console.log('selB', h.packBeforeSelected.map((s) => s.kind).join('|'));
  console.log('selA', h.packAfterSelected.map((s) => s.kind).join('|'));
  console.log('p32bSel', h.p32bInSelected.join('|') || '-');
  for (const c of h.candidates) {
    console.log('>>', c.kind, '|', c.title);
    console.log(c.body);
  }
}
