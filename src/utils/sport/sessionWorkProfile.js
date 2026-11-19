/**
 * Profil de travail partagé d'une fenêtre.
 * Une série reconstruite n'est pas un format exécuté.
 * Une charge absente n'est pas une charge nulle.
 */

import {
  extractDateStrFromWorkoutKey,
  extractExerciseIdFromWorkoutKey
} from '../exerciseKeyGenerator';
import { isDateInRecapWindow } from './recapMuscleLoadEngine';
import { inferMuscleGroupsForExercise } from './recapMuscleInference';
import { readTrustedSessionSets } from './exerciseTrajectoryAnalysis';

function readRecordedLoad(snapshot, date, exerciseId) {
  const bag = snapshot?.exerciseWeights || null;
  if (!bag) return { recorded: false, value: null, unit: null, provenance: 'absent' };
  const raw = bag[`${date}_${exerciseId}`] ?? bag[`${date}_${String(exerciseId)}`];
  if (raw == null || raw === '') return { recorded: false, value: null, unit: null, provenance: 'absent' };
  if (typeof raw === 'number') {
    return raw > 0
      ? { recorded: true, value: raw, unit: 'kg', provenance: 'numeric' }
      : { recorded: false, value: null, unit: null, provenance: 'absent' };
  }
  if (typeof raw === 'object') {
    const value = Number(raw.kg ?? raw.value ?? raw.weight);
    const known = Number.isFinite(value) && value > 0;
    return {
      recorded: true,
      value: known ? value : null,
      unit: known ? raw.unit || 'kg' : raw.unit || null,
      provenance: raw.mode || raw.source || 'object'
    };
  }
  return { recorded: true, value: null, unit: null, provenance: 'unparsed' };
}

function emptyDay(date) {
  return {
    date,
    activityKind: 'strength_checked',
    reps: 0,
    exercises: [],
    recordedSetCount: 0,
    reconstructedExerciseCount: 0,
    loadRecordedCount: 0
  };
}

/**
 * @returns {{
 *   days: object[],
 *   strengthDayCount: number,
 *   reps: number,
 *   repsByExercise: Record<string, number>,
 *   names: Record<string, string>,
 *   recordedSetCoverage: number,
 *   meanRecordedSets: number|null,
 *   meanRepsPerRecordedSet: number|null
 * }}
 */
export function buildSessionWorkProfiles(snapshot, window, getExerciseNameById = null) {
  const days = new Map();
  const repsByExercise = {};
  const names = {};
  const reps = snapshot?.reps || {};
  const checked = snapshot?.checkedExercises || {};
  let recordedExercises = 0;
  let exercisesWithSets = 0;
  let recordedSetCount = 0;
  let recordedSetReps = 0;

  Object.keys(reps).forEach((key) => {
    if (checked[key] !== true) return;
    const date = extractDateStrFromWorkoutKey(key);
    const exerciseId = extractExerciseIdFromWorkoutKey(key);
    if (!date || exerciseId == null || !isDateInRecapWindow(date, window)) return;
    const count = parseInt(String(reps[key]), 10) || 0;
    if (count <= 0) return;
    const id = String(exerciseId);
    const name =
      (typeof getExerciseNameById === 'function' ? getExerciseNameById(id) : null) || null;
    const sets = readTrustedSessionSets(snapshot, date, id, count);
    const load = readRecordedLoad(snapshot, date, id);
    const groups = inferMuscleGroupsForExercise({ name, id }).filter(Boolean);
    const day = days.get(date) || emptyDay(date);
    day.reps += count;
    day.exercises.push({
      id,
      name,
      reps: count,
      setsRecorded: sets.trusted === true,
      setCount: sets.trusted ? sets.setCount : null,
      repsPerSet: sets.trusted ? sets.perSet : null,
      setSource: sets.source,
      load,
      muscleGroups: groups
    });
    if (sets.trusted) {
      day.recordedSetCount += sets.setCount || 0;
      recordedSetCount += sets.setCount || 0;
      recordedSetReps += count;
      exercisesWithSets += 1;
    } else if (String(sets.source || '').startsWith('reconstructed_')) {
      day.reconstructedExerciseCount += 1;
    }
    if (load.recorded) day.loadRecordedCount += 1;
    days.set(date, day);
    repsByExercise[id] = (repsByExercise[id] || 0) + count;
    if (name) names[id] = name;
    recordedExercises += 1;
  });

  const list = [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
  const totalReps = list.reduce((sum, day) => sum + day.reps, 0);
  return {
    days: list,
    strengthDayCount: list.length,
    reps: totalReps,
    repsByExercise,
    names,
    recordedSetCoverage: recordedExercises ? exercisesWithSets / recordedExercises : 0,
    meanRecordedSets: list.length && recordedSetCount ? recordedSetCount / list.length : null,
    meanRepsPerRecordedSet: recordedSetCount ? recordedSetReps / recordedSetCount : null,
    population: 'checked_strength_days'
  };
}
