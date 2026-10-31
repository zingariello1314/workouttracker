/**
 * Rejeu P3.5 sur fixture réelle (jul–oct 2026).
 * Usage: npx vite-node scripts/p35-replay-oct.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildP35Discoveries, P35_KINDS } from '../src/utils/sport/recapP35Discoveries.js';
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
  '3m': { start: '2026-08-01', end: '2026-10-30' }
};

const P35_SET = new Set(Object.values(P35_KINDS));

function slim(d) {
  return {
    kind: d.kind,
    nature: d.nature,
    score: d.score,
    contentClass: resolveContentClass(d),
    title: d.title,
    body: d.body,
    evidence: d.evidence,
    metrics: {
      proofLevel: d.metrics?.proofLevel,
      exerciseId: d.metrics?.exerciseId,
      gtgSharePct: d.metrics?.gtgSharePct,
      scale: d.metrics?.scale
    }
  };
}

const out = {
  generatedAt: new Date().toISOString(),
  source: 'docs/analyses-documentation/fixtures/workout-main-jul-oct-2026.json',
  horizons: {}
};

for (const [label, window] of Object.entries(windows)) {
  const t0 = performance.now();
  const pack = buildP35Discoveries({
    snapshot,
    window,
    getExerciseNameById: getName
  });
  const tPack = performance.now() - t0;

  const t1 = performance.now();
  const bundleOff = buildPeriodDiscoveryBundle({
    snapshot,
    window,
    getExerciseNameById: getName,
    nameById,
    includeP35Discoveries: false
  });
  const tOff = performance.now() - t1;

  const t2 = performance.now();
  const bundleOn = buildPeriodDiscoveryBundle({
    snapshot,
    window,
    getExerciseNameById: getName,
    nameById,
    includeP35Discoveries: true
  });
  const tOn = performance.now() - t2;

  const selectedP35 = (bundleOn.selected || []).filter((d) => P35_SET.has(d.kind));
  const allP35 = (bundleOn.all || []).filter((d) => P35_SET.has(d.kind));
  const droppedP35 = (bundleOn.dropped || []).filter((d) => P35_SET.has(d.kind));

  const fbKeys = Object.keys(snapshot.sessionFeedbacks || {}).filter(
    (k) => k >= window.start && k <= window.end
  );

  out.horizons[label] = {
    window,
    sources: {
      hasGtgConfig: Boolean(snapshot?.enduranceData?.gtg?.config?.selectedIds?.length),
      gtgDayKeysInWindow: Object.keys(snapshot?.enduranceData?.gtg?.days || {}).filter(
        (k) => k >= window.start && k <= window.end
      ).length,
      sessionFeedbackKeysInWindow: fbKeys.length,
      dayPlanSnapshotsInWindow: Object.keys(snapshot?.calendarDayPlanSnapshots || {}).filter(
        (k) => k >= window.start && k <= window.end
      ).length,
      programRevisionLogPresent: Boolean(snapshot?.programRevisionLog)
    },
    coverage: pack.metrics?.coverage || null,
    abstentions: pack.abstentions || [],
    candidatesProduced: (pack.discoveries || []).map(slim),
    candidatesInPool: allP35.map(slim),
    candidatesSelected: selectedP35.map(slim),
    candidatesDropped: droppedP35.map((d) => ({
      kind: d.kind,
      reason: d.reason,
      title: d.title
    })),
    packSelectedKinds: (bundleOn.selected || []).map((d) => d.kind),
    collisions: {
      selectedKindsAlsoRivalPlan:
        selectedP35.some((d) => d.kind === P35_KINDS.GAP_NATURE) &&
        (bundleOn.selected || []).some((d) =>
          ['disc_plan_follow_rate', 'disc_plan_recurring_skip', 'disc_offplan_pattern'].includes(
            d.kind
          )
        ),
      selectedKindsAlsoRivalGtgUnplanned:
        selectedP35.some((d) => d.kind === P35_KINDS.GTG_OUTSIDE_CLASSIC) &&
        (bundleOn.selected || []).some((d) =>
          ['disc_gtg_unplanned_now', 'disc_gtg_unplanned_role'].includes(d.kind)
        )
    },
    performance: {
      p35PackMs: Math.round(tPack * 10) / 10,
      bundleWithoutP35Ms: Math.round(tOff * 10) / 10,
      bundleWithP35Ms: Math.round(tOn * 10) / 10,
      overheadMs: Math.round((tOn - tOff) * 10) / 10,
      metricsComputeMs: pack.metrics?.performance?.computeMs
    },
    controlWithoutP35Selected: (bundleOff.selected || []).map((d) => d.kind)
  };
}

const dest = path.join(root, 'docs/analyses-documentation/fixtures/p35-replay-oct-2026.json');
fs.writeFileSync(dest, JSON.stringify(out, null, 2), 'utf8');
console.log(JSON.stringify(out, null, 2));
console.log('\nWrote', dest);
