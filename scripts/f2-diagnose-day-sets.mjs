/**
 * F2 — Diagnostic strengthDays vs trainingDays (non invasif).
 * Usage: npx vite-node scripts/f2-diagnose-day-sets.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { measureRecapWindow } from '../src/utils/sport/recapPeriodDiscoveries.js';
import {
  countTrainingDaysInRange,
  dayCountsAsCalendarTrainingDay,
  dayHasRecordedReps
} from '../src/utils/sport/recapTrainingDayTruth.js';
import DateHelper from '../src/utils/dateHelper.js';
import { assertWindowMeasureConsistency } from '../src/utils/sport/recapInsightValidate.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const snap = JSON.parse(
  fs.readFileSync(
    path.join(root, 'docs/analyses-documentation/fixtures/workout-main-jul-oct-2026.json'),
    'utf8'
  )
);

const windows = {
  '30d': { start: '2026-10-01', end: '2026-10-30' },
  '3m': { start: '2026-08-01', end: '2026-10-30' }
};

function strengthDatesFromMeasure(m) {
  return Object.keys(m.repsByDate || {}).sort();
}

function calendarDates(snapshot, start, end) {
  const out = [];
  for (const d of DateHelper.getDateRange(start, end)) {
    if (dayCountsAsCalendarTrainingDay(snapshot, d, null)) out.push(d);
  }
  return out;
}

const report = {};
for (const [period, window] of Object.entries(windows)) {
  const m = measureRecapWindow({
    snapshot: snap,
    window,
    periodId: period,
    garminData: null
  });
  const strength = strengthDatesFromMeasure(m);
  const training = calendarDates(snap, window.start, window.end);
  const sOnly = strength.filter((d) => !training.includes(d));
  const tOnly = training.filter((d) => !strength.includes(d));
  const validation = assertWindowMeasureConsistency(m);
  report[period] = {
    measure: {
      strengthDays: m.strengthDays,
      trainingDays: m.trainingDays,
      totalReps: m.totalReps,
      strengthReps: m.strengthReps
    },
    countTrainingDaysInRange: countTrainingDaysInRange(
      snap,
      window.start,
      window.end,
      null
    ),
    strengthOnly: sOnly,
    trainingOnly: tOnly,
    bothCount: strength.filter((d) => training.includes(d)).length,
    strengthOnlyDetail: sOnly.map((d) => ({
      d,
      dayHasRecordedReps: dayHasRecordedReps(snap, d),
      calendar: dayCountsAsCalendarTrainingDay(snap, d, null),
      reps: m.repsByDate?.[d] ?? null
    })),
    validation
  };
}

const dest = path.join(
  root,
  'docs/analyses-documentation/moteur analyse v1/fixtures/f2-day-sets-diagnosis.json'
);
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, JSON.stringify(report, null, 2), 'utf8');
console.log(JSON.stringify(report, null, 2));
console.log('wrote', dest);
