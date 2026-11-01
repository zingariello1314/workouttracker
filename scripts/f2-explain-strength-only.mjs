import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  hasNonGtgMomentumWorkoutForDate,
  gtgAloneCountsAsTrainingDay
} from '../src/utils/calendarGtgDay.js';
import { classicExclusiveRepsForDay, buildP35DayRecord } from '../src/utils/sport/recapP35DayModel.js';
import { normalizeGtgData } from '../src/services/endurance/gtgService.js';
import { dayHasCircuitProgress, dayHasMomentumEnduranceSession } from '../src/utils/sport/recapTrainingDayTruth.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const snap = JSON.parse(
  fs.readFileSync(
    path.join(root, 'docs/analyses-documentation/fixtures/workout-main-jul-oct-2026.json'),
    'utf8'
  )
);
const dates = ['2026-09-02', '2026-10-01', '2026-10-03', '2026-10-06', '2026-10-15'];
for (const d of dates) {
  const gtg = normalizeGtgData(snap?.enduranceData?.gtg);
  const sync = gtg.workoutSync?.[d] || {};
  const reps = Object.fromEntries(
    Object.entries(snap.reps || {}).filter(([k]) => k.startsWith(`${d}_`))
  );
  const excl = classicExclusiveRepsForDay(snap, d);
  const rec = buildP35DayRecord(snap, d);
  console.log(
    JSON.stringify(
      {
        d,
        hasNonGtg: hasNonGtgMomentumWorkoutForDate(snap, d),
        gtgAlone: gtgAloneCountsAsTrainingDay(snap, d),
        endurance: dayHasMomentumEnduranceSession(snap, d),
        circuit: dayHasCircuitProgress(snap, d),
        sync,
        reps,
        classicExclusive: excl.classicExclusiveReps,
        classicTotal: excl.classicTotalReps,
        gtgSynced: excl.gtgSyncedReps,
        reliable: excl.syncDeduction?.reliable,
        coexistence: rec.coexistence,
        gtgHasActivity: rec.gtg?.hasActivity
      },
      null,
      2
    )
  );
}
