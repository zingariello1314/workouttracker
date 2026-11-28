import { buildExerciseTrajectory, renderExerciseTrajectoryCopy } from '../../../src/utils/sport/exerciseTrajectoryAnalysis.js';
import { buildComposedEvidenceFromTrajectory, classifyContinuity } from '../../../src/utils/sport/recapComposedEvidence.js';
import { titleFromComposedEvidence } from '../../../src/utils/sport/recapComposedNarration.js';

function ymd(i) {
  const d = new Date('2026-09-28T12:00:00');
  d.setDate(d.getDate() + i * 7);
  return d.toISOString().slice(0, 10);
}
function run(totals, label) {
  const checked = {};
  const reps = {};
  totals.forEach((t, i) => {
    const k = `${ymd(i)}_703294235`;
    checked[k] = true;
    reps[k] = String(t);
  });
  const traj = buildExerciseTrajectory({
    snapshot: { checkedExercises: checked, reps },
    exerciseId: '703294235',
    exerciseName: 'Hyperextension',
    window: { start: ymd(0), end: ymd(totals.length - 1) },
    mode: 'progress'
  });
  const composed = traj.composedEvidence || buildComposedEvidenceFromTrajectory(traj);
  const title = titleFromComposedEvidence(composed, { name: 'Hyperextension' });
  const copy = renderExerciseTrajectoryCopy(traj);
  console.log('\n===', label, '===');
  console.log('shape', traj.shape.primaryStory, traj.shape.kind, traj.shape.path);
  console.log('continuity', classifyContinuity(traj).kind);
  console.log('TITLE:', title);
  console.log('BODY:', (copy.body || '').slice(0, 420));
}

run([48, 48, 48, 48, 48, 48, 48, 24], '7x48 puis 24 (V36-008)');
run([48, 48, 48, 40, 36, 32], 'baisses répétées');
run([48, 36, 48, 40, 48, 44], 'fluctuations');
run([48, 48, 48, 48, 48, 48], 'plateau');
run([48, 48, 24, 48, 48], 'baisse puis retour');
