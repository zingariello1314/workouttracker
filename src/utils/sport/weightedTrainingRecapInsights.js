/**
 * Analyses Récap : reps / volume avec vs sans lesté, tendances, suggestions.
 */
import { aggregateCheckedRepsByDateAndExerciseId } from '../trainingLoadUtils';
import { computeVolumeKgForWorkoutKey } from '../exerciseLoadVolume';
import { getExerciseWeightUiMode } from '../exerciseWeightEligibility';

function parseWeightFromStore(workoutData, storageKey) {
  const w = workoutData?.exerciseWeights?.[storageKey];
  if (w == null || String(w).trim() === '') return 0;
  const n = parseFloat(String(w).replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function hasWeightedMark(workoutData, storageKey) {
  return workoutData?.exerciseMarkedWeighted?.[storageKey] === true;
}

function sessionIsWeighted(workoutData, dateStr, exerciseId) {
  const base = `${dateStr}_${exerciseId}`;
  const keys = [base, `${base}_semaineA`, `${base}_semaineB`];
  return keys.some((k) => {
    const w = parseWeightFromStore(workoutData, k);
    const marked = hasWeightedMark(workoutData, k);
    return w > 0 || marked;
  });
}

/**
 * @param {object} workoutData
 * @param {{ start: string, end: string }} window
 */
export function analyzeWeightedTrainingPeriod(workoutData, window) {
  const grouped = aggregateCheckedRepsByDateAndExerciseId(
    workoutData?.reps,
    workoutData?.checkedExercises
  );
  let repsBw = 0;
  let repsWeighted = 0;
  let volumeKgWeighted = 0;
  const byExercise = new Map();

  grouped.forEach(({ reps: r }, gkey) => {
    const sep = gkey.lastIndexOf('::');
    const dateStr = gkey.slice(0, sep);
    const idStr = gkey.slice(sep + 2);
    if (dateStr < window.start || dateStr > window.end) return;
    const reps = Math.max(0, parseInt(String(r), 10) || 0);
    if (reps <= 0) return;

    const key = `${dateStr}_${idStr}`;
    const vol = computeVolumeKgForWorkoutKey(key, workoutData);
    const wKg = reps > 0 && vol > 0 ? vol / reps : parseWeightFromStore(workoutData, key);
    const weighted = wKg > 0 || hasWeightedMark(workoutData, key);

    if (weighted) {
      repsWeighted += reps;
      volumeKgWeighted += vol;
    } else {
      repsBw += reps;
    }

    if (!byExercise.has(idStr)) {
      byExercise.set(idStr, { id: idStr, repsBw: 0, repsW: 0, volKg: 0, lastWeight: 0 });
    }
    const row = byExercise.get(idStr);
    if (weighted) {
      row.repsW += reps;
      row.volKg += vol;
      if (wKg > 0) row.lastWeight = wKg;
    } else {
      row.repsBw += reps;
    }
  });

  return {
    repsBw,
    repsWeighted,
    volumeKgWeighted: Math.round(volumeKgWeighted),
    byExercise: [...byExercise.values()]
  };
}

/**
 * @returns {string[]} phrases pour snippets Récap
 */
export function buildWeightedTrainingRecapSnippets(workoutData, window, getExerciseNameById) {
  const stats = analyzeWeightedTrainingPeriod(workoutData, window);
  const lines = [];
  const total = stats.repsBw + stats.repsWeighted;
  if (total < 20) return lines;

  if (stats.repsWeighted > 0 && stats.repsBw > 0) {
    const pctW = Math.round((stats.repsWeighted / total) * 100);
    lines.push(
      `Répartition lesté : ~${stats.repsWeighted} reps chargées (${pctW} %) vs ~${stats.repsBw} reps poids du corps sur la période.`
    );
  } else if (stats.repsWeighted > 0) {
    lines.push(
      `Volume lesté : ~${stats.repsWeighted} reps pour ~${stats.volumeKgWeighted.toLocaleString('fr-FR')} kg×rep.`
    );
  }

  stats.byExercise
    .filter((row) => row.repsBw >= 40 && row.repsW === 0)
    .slice(0, 2)
    .forEach((row) => {
      const name =
        (typeof getExerciseNameById === 'function' && getExerciseNameById(row.id)) || `#${row.id}`;
      const exLike = { name, materiel: '' };
      if (getExerciseWeightUiMode(exLike)?.mode === 'optional') {
        lines.push(
          `${name} : beaucoup de reps sans lesté (~${row.repsBw}) — une progression en charge légère pourrait débloquer le volume.`
        );
      }
    });

  stats.byExercise
    .filter((row) => row.repsW >= 15 && row.lastWeight > 0)
    .sort((a, b) => b.volKg - a.volKg)
    .slice(0, 2)
    .forEach((row) => {
      const name =
        (typeof getExerciseNameById === 'function' && getExerciseNameById(row.id)) || `#${row.id}`;
      lines.push(
        `${name} lesté : ~${row.repsW} reps récentes (dernière charge utile ~${Math.round(row.lastWeight)} kg).`
      );
    });

  stats.byExercise
    .filter((row) => row.repsW >= 15 && row.repsBw >= 15 && row.lastWeight > 0)
    .slice(0, 2)
    .forEach((row) => {
      const name =
        (typeof getExerciseNameById === 'function' && getExerciseNameById(row.id)) || `#${row.id}`;
      const shareW = Math.round((row.repsW / (row.repsW + row.repsBw)) * 100);
      lines.push(
        `${name} : ~${shareW} % des reps en lesté récent — compare avec tes séries poids du corps pour ajuster charge ou volume.`
      );
    });

  return lines.slice(0, 5);
}

/** Multiplicateur nuancé pour heat Récap (1 = normal, max ~1.35 pour séances très chargées). */
export function weightedRecapLoadMultiplier(reps, volumeKg) {
  const r = Math.max(0, Number(reps) || 0);
  const v = Math.max(0, Number(volumeKg) || 0);
  if (r <= 0 || v <= 0) return 1;
  const avgKg = v / r;
  const setsEstimate = Math.max(1, Math.min(8, Math.round(r / 8)));
  const nuance = Math.min(0.12, setsEstimate * 0.025);
  const loadFactor = Math.min(0.23, avgKg / 120);
  return 1 + nuance + loadFactor;
}
