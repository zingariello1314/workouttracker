import { buildPlannedExerciseListForDateStr, buildPlannedStretchListForDateStr } from '../../src/utils/programCompletionBonus.js';
import { generateStretchItemKey } from '../../src/utils/exerciseKeyGenerator.js';

export function days(n) {
  const out = [];
  const start = Date.UTC(2020, 0, 1);
  for (let i = 0; i < n; i += 1) {
    const d = new Date(start + i * 86400000);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export function syntheticWorkout(dayCount) {
  const checkedExercises = {};
  const reps = {};
  for (const date of days(dayCount)) {
    for (let e = 1; e <= 12; e += 1) {
      const key = `${date}_${e}`;
      checkedExercises[key] = true;
      reps[key] = '10';
    }
  }
  return {
    checkedExercises,
    reps,
    checkedStretches: {},
    enduranceData: { sessions: {}, challenges: [] }
  };
}

function plannedDay(date) {
  const empty = { checkedExercises: {}, reps: {}, checkedStretches: {} };
  const exercises = buildPlannedExerciseListForDateStr(date, empty, {});
  const stretches = buildPlannedStretchListForDateStr(date, {});
  const checkedExercises = {};
  const reps = {};
  const checkedStretches = {};
  exercises.forEach((exercise) => {
    const key = `${date}_${exercise.id}`;
    checkedExercises[key] = true;
    reps[key] = '8';
  });
  for (const item of stretches) {
    checkedStretches[generateStretchItemKey(date, item.moment, item.id)] = true;
  }
  return { checkedExercises, reps, checkedStretches };
}

/** Deux journées complètes du programme réel. Le bonus officiel vaut 600. */
export function completeProgramWorkout() {
  const monday = plannedDay('2020-06-01');
  const thursday = plannedDay('2020-06-04');
  return {
    checkedExercises: { ...monday.checkedExercises, ...thursday.checkedExercises },
    reps: { ...monday.reps, ...thursday.reps },
    checkedStretches: { ...monday.checkedStretches, ...thursday.checkedStretches },
    enduranceData: { sessions: {}, challenges: [] }
  };
}
