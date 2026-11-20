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
import { classifyExerciseStanding } from './historicalOrphanExercises';

function movementNatureFromName(name) {
  const label = String(name || '').toLowerCase();
  if (/traction|pomp|dip|squat|soulev|develop|développ|rowing|tirage|fente|hip thrust/.test(label)) return 'polyarticular';
  if (/curl|extension|oiseau|élévation|elevation|kickback|écarté|ecarte/.test(label)) return 'localized';
  return 'other';
}

function readRecordedLoad(snapshot, date, exerciseId) {
  const absent = { recorded: false, value: null, unit: null, mode: null, provenance: 'absent' };
  const bag = snapshot?.exerciseWeights || null;
  const key = `${date}_${exerciseId}`;
  if (!bag) return absent;
  const raw = bag[key] ?? bag[`${date}_${String(exerciseId)}`];
  if (raw == null || raw === '') return absent;
  const perArm = snapshot?.exerciseWeightPerArm?.[key] === true;
  const inference = snapshot?.exerciseSetLogs?.[key]?.weightInference?.mode || null;
  const replicated = inference === 'replicated' || inference === 'habit';
  const mode = perArm ? 'per_arm' : 'total';
  if (typeof raw === 'object') {
    const value = Number(raw.kg ?? raw.value ?? raw.weight);
    const known = Number.isFinite(value) && value > 0;
    return {
      recorded: known,
      value: known ? value : null,
      unit: known ? raw.unit || 'kg' : null,
      mode: known ? raw.mode || mode : null,
      provenance: replicated ? 'replicated' : raw.source || 'object',
      assistance: raw.assistance === true
    };
  }
  const parsed = typeof raw === 'number' ? raw : parseFloat(String(raw).trim().replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed <= 0) return absent;
  return {
    recorded: true,
    value: parsed,
    unit: 'kg',
    mode,
    provenance: replicated ? 'replicated' : 'entered',
    assistance: false
  };
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
    const standing = classifyExerciseStanding(snapshot, id, getExerciseNameById);
    const resolvedName = standing.name || name;
    const groups =
      standing.standing === 'identified'
        ? inferMuscleGroupsForExercise({ name: resolvedName, id }).filter(Boolean)
        : [];
    const day = days.get(date) || emptyDay(date);
    day.reps += count;
    day.exercises.push({
      id,
      name: resolvedName,
      standing: standing.standing,
      orphan: standing.standing === 'historical_orphan',
      movementNature: standing.standing === 'identified' ? movementNatureFromName(resolvedName) : null,
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
    if (resolvedName && standing.standing === 'identified') names[id] = resolvedName;
    recordedExercises += 1;
  });

  const pushupRows = snapshot?.enduranceData?.sessions?.pushups;
  const pushups = Array.isArray(pushupRows) ? pushupRows : Object.values(pushupRows || {});
  const pushupsByDate = new Map();
  pushups.forEach((row) => {
    const date = row?.date;
    if (!date || !isDateInRecapWindow(date, window)) return;
    const count = Number(row.reps ?? row.count) || 0;
    if (count <= 0) return;
    pushupsByDate.set(date, (pushupsByDate.get(date) || 0) + count);
  });
  pushupsByDate.forEach((count, date) => {
    const day = days.get(date) || emptyDay(date);
    if (
      day.exercises.some(
        (item) =>
          item.id === 'complementary_endurance_pushups' ||
          item.provenance === 'complementary_endurance'
      )
    ) {
      return;
    }
    day.reps += count;
    day.exercises.push({
      id: 'complementary_endurance_pushups',
      name: 'Pompes endurance (complémentaire)',
      standing: 'identified',
      orphan: false,
      movementNature: 'localized',
      reps: count,
      setsRecorded: false,
      setCount: null,
      repsPerSet: null,
      setSource: 'endurance_session',
      load: { recorded: false },
      muscleGroups: [],
      provenance: 'complementary_endurance'
    });
    days.set(date, day);
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
