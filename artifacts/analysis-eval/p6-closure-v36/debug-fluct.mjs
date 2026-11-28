import { buildExerciseTrajectory } from '../../../src/utils/sport/exerciseTrajectoryAnalysis.js';
import { classifyContinuity } from '../../../src/utils/sport/recapComposedEvidence.js';

function ymd(i) {
  const d = new Date('2026-09-28T12:00:00');
  d.setDate(d.getDate() + i * 7);
  return d.toISOString().slice(0, 10);
}
const totals = [48, 36, 48, 40, 48, 44];
const checked = {};
const reps = {};
totals.forEach((t, i) => {
  const k = `${ymd(i)}_1`;
  checked[k] = true;
  reps[k] = String(t);
});
const traj = buildExerciseTrajectory({
  snapshot: { checkedExercises: checked, reps },
  exerciseId: 1,
  exerciseName: 'H',
  window: { start: ymd(0), end: ymd(5) },
  mode: 'progress'
});
console.log(JSON.stringify({ shape: traj.shape, cont: classifyContinuity(traj) }, null, 2));
