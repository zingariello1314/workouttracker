/**
 * F2 — Replay 7j/30j/3m + diagnostic contrats (avant/après documenté dans docs).
 * Usage: npx vite-node scripts/f2-replay-periods.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildPeriodDiscoveryBundle, measureRecapWindow } from '../src/utils/sport/recapPeriodDiscoveries.js';
import { explainStrengthVsCalendarTrainingGap } from '../src/utils/sport/recapDayContracts.js';
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
  '3m': { start: '2026-08-01', end: '2026-10-30' }
};

const out = {
  generatedAt: new Date().toISOString(),
  note: 'F2 replay — contrats jours annotés ; reject strength>training retiré',
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
  const gap = explainStrengthVsCalendarTrainingGap(snap, window, null);
  const bundle = buildPeriodDiscoveryBundle({
    snapshot: snap,
    window,
    period,
    getExerciseNameById: getName,
    nameById,
    todayYmd: '2026-10-31'
  });
  const ms = Math.round(performance.now() - t0);
  out.periods[period] = {
    ms,
    window,
    primaryMeta: primaryWindowForPeriod(period, new Date(`${window.end}T12:00:00`)),
    journeyMeta: journeyHistoricalWindow(window.end),
    measure: {
      strengthDays: measure.strengthDays,
      trainingDays: measure.trainingDays,
      totalReps: measure.totalReps,
      dayContracts: measure.dayContracts
    },
    gap: {
      methodologicallyExpected: gap.methodologicallyExpected,
      strengthOnly: gap.strengthOnly,
      causes: (gap.strengthOnlyDetail || []).map((d) => ({ date: d.date, cause: d.cause }))
    },
    poolSize: (bundle.all || []).length,
    selectedSize: (bundle.selected || []).length,
    droppedSize: (bundle.dropped || []).length,
    selectedKinds: (bundle.selected || []).map((d) => d.kind),
    droppedReasons: [...new Set((bundle.dropped || []).map((d) => d.reason))].sort(),
    selectedTitles: (bundle.selected || []).map((d) => d.title)
  };
}

const dest = path.join(
  root,
  'docs/analyses-documentation/moteur analyse v1/fixtures/f2-replay-periods.json'
);
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, JSON.stringify(out, null, 2), 'utf8');
console.log(JSON.stringify(out, null, 2));
console.log('wrote', dest);
