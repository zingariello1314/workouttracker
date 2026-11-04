/**
 * Empreinte 8 périodes pour comparaison avant/après modularisation.
 * Usage (via vitest/vite-node pour résoudre les imports sans extension) :
 *   npx vite-node scripts/fingerprint-period-bundles.mjs [out.json]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildPeriodDiscoveryBundle } from '../src/utils/sport/recapPeriodDiscoveries.js';
import { addCalendarDays } from '../src/utils/sport/garminRunningPeriodStats.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const fixturePath = path.join(
  root,
  'docs/analyses-documentation/fixtures/workout-main-jul-oct-2026.json'
);
const nameMapPath = path.join(
  root,
  'docs/analyses-documentation/fixtures/exercise-name-map-main.json'
);

const end = '2026-10-30';
const PERIODS = [
  { period: 'today', window: { start: end, end } },
  { period: '7d', window: { start: addCalendarDays(end, -6), end } },
  { period: '30d', window: { start: addCalendarDays(end, -29), end } },
  { period: '3m', window: { start: addCalendarDays(end, -89), end } },
  { period: '6m', window: { start: addCalendarDays(end, -179), end } },
  { period: '1y', window: { start: addCalendarDays(end, -364), end } },
  { period: '2y', window: { start: addCalendarDays(end, -729), end } },
  { period: 'all', window: { start: '2020-01-01', end } }
];

function cardFp(d) {
  return {
    kind: d.kind,
    nature: d.nature,
    family: d.family,
    score: d.score,
    informativeValue: d.informativeValue,
    title: d.title,
    body: d.body,
    evidence: d.evidence,
    metrics: {
      exerciseId: d.metrics?.exerciseId ?? null,
      name: d.metrics?.name || d.metrics?.exerciseName || null,
      totalReps: d.metrics?.totalReps ?? null,
      gapDays: d.metrics?.gapDays ?? null,
      contentClass: d.metrics?.contentClass ?? null
    }
  };
}

function fingerprint(bundle, ms) {
  return {
    ms,
    question: bundle.question,
    periodReps: bundle.comparisons?.period?.totalReps ?? null,
    periodTrainingDays: bundle.comparisons?.period?.trainingDays ?? null,
    candidateCount: (bundle.all || []).length,
    selectedCount: (bundle.selected || []).length,
    droppedCount: (bundle.dropped || []).length,
    candidates: (bundle.all || [])
      .map(cardFp)
      .sort((a, b) => String(a.kind).localeCompare(b.kind) || String(a.title).localeCompare(b.title)),
    selected: (bundle.selected || []).map(cardFp),
    dropped: (bundle.dropped || []).map((d) => ({
      kind: d.kind,
      reason: d.reason,
      title: d.title,
      informativeValue: d.informativeValue
    }))
  };
}

if (!fs.existsSync(fixturePath)) {
  console.error('fixture missing', fixturePath);
  process.exit(1);
}

const snapshot = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
const nameById = fs.existsSync(nameMapPath)
  ? JSON.parse(fs.readFileSync(nameMapPath, 'utf8'))
  : {};
const getName = (id) => nameById[String(id)] || nameById[id] || '';

const out = {};
for (const { period, window } of PERIODS) {
  const t0 = Date.now();
  const bundle = buildPeriodDiscoveryBundle({
    snapshot,
    window,
    period,
    getExerciseNameById: getName,
    extraNameById: nameById
  });
  const ms = Date.now() - t0;
  out[period] = fingerprint(bundle, ms);
  console.log(
    `${period}: candidates=${out[period].candidateCount} selected=${out[period].selectedCount} dropped=${out[period].droppedCount} ${ms}ms reps=${out[period].periodReps}`
  );
}

const outPath =
  process.argv[2] ||
  path.join(root, 'docs/analyses-documentation/fixtures/period-bundle-fingerprint-after.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log('wrote', outPath);
