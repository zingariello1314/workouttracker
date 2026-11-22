import fs from 'fs';
import { collectPushupEnduranceSessions } from '../src/utils/sport/recapMuscleLoadEngine.js';
import { endurancePushupsAlreadyInWorkoutTotals } from '../src/services/endurance/pushupEnduranceWorkoutKeys.js';
import { enduranceRepsForSession } from '../src/utils/trainingLoadUtils.js';
import { isMockEnduranceSession } from '../src/utils/calendarUtils.js';
import { classicExclusiveRepsForDay } from '../src/utils/sport/recapP35DayModel.js';
import { aggregateCheckedRepsByDateAndExerciseId } from '../src/utils/trainingLoadUtils.js';
import { collectLifetimeRepHistory } from '../src/utils/sport/athleteJourney.js';

const snap = JSON.parse(
  fs.readFileSync('artifacts/analysis-eval/snapshots/momentum-sport-backup-2026-11-21.json', 'utf8')
).data;

const start = '2026-10-23';
const end = '2026-11-21';
const prevStart = '2026-09-23';
const prevEnd = '2026-10-22';

const sessions = collectPushupEnduranceSessions(snap) || [];
const mapSessions = (lo, hi) =>
  sessions
    .filter((s) => {
      const d = String(s?.date || '').slice(0, 10);
      return d >= lo && d <= hi;
    })
    .map((s) => {
      const d = String(s.date).slice(0, 10);
      return {
        date: d,
        reps: enduranceRepsForSession('pushups', s),
        mock: isMockEnduranceSession(s),
        already: endurancePushupsAlreadyInWorkoutTotals(snap, d),
        complementary: snap.reps[`${d}_complementary_endurance_pushups`]
      };
    });

console.log('endurance cur30', mapSessions(start, end));
console.log('endurance prev30', mapSessions(prevStart, prevEnd));

const life = collectLifetimeRepHistory(snap, end);
const catDays = new Set();
life.forEach((list) =>
  list.forEach((s) => {
    if (s.date >= prevStart && s.date <= prevEnd) catDays.add(s.date);
  })
);
const grouped = aggregateCheckedRepsByDateAndExerciseId(snap.reps, snap.checkedExercises);
const measureDays = new Set();
for (const [k, v] of grouped) {
  const d = k.slice(0, 10);
  if (d < prevStart || d > prevEnd) continue;
  const id = k.slice(d.length + 2);
  const pack = classicExclusiveRepsForDay(snap, d);
  const row = (pack.syncDeduction?.perKey || []).find((e) => String(e.storageId) === String(id));
  const allowed = row ? Math.max(0, Math.floor(Number(row.exclusiveReps) || 0)) : v.reps;
  if (allowed > 0) measureDays.add(d);
}
console.log('prev catalog days', [...catDays].sort());
console.log('prev measure-like days', [...measureDays].sort());
console.log(
  'catalog-only',
  [...catDays].filter((d) => !measureDays.has(d)).sort()
);
for (const d of [...catDays].filter((x) => !measureDays.has(x)).sort()) {
  const pack = classicExclusiveRepsForDay(snap, d);
  console.log('day exclusive', d, {
    classicTotal: pack.classicTotalReps,
    exclusive: pack.classicExclusiveReps,
    gtg: pack.gtgSyncedReps,
    perKeySample: (pack.syncDeduction?.perKey || []).slice(0, 8)
  });
}
