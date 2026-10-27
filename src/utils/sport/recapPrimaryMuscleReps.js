/**
 * Attribution musculaire **primaire** pour affichage Spec #24 (B1).
 * Les shares multi-groupes restent internes (recapMuscleLoadEngine) ;
 * l'utilisateur ne voit que les reps du groupe primaire de chaque exo.
 */

import { MuscleGroups } from '../../data/workoutProgramEnhanced';
import { aggregateCheckedRepsByDateAndExerciseId } from '../trainingLoadUtils';
import { inferMuscleLoadRolesForExercise } from './recapMuscleInference';
import { resolveExerciseNameForRecap } from './recapStrengthPeriodStats';
import { isDateInRecapWindow } from './recapMuscleLoadEngine';
import { logRecapReject } from './recapRejectLog';

/**
 * @param {{ name?: string, id?: string|number }} exerciseLike
 * @returns {string|null} MuscleGroups id primaire
 */
export function primaryMuscleGroupForExercise(exerciseLike) {
  const roles = inferMuscleLoadRolesForExercise(exerciseLike);
  const primary = roles?.primary?.filter((g) => g && g !== MuscleGroups.FULL_BODY) || [];
  if (primary.length) return primary[0];
  const secondary = roles?.secondary?.filter((g) => g && g !== MuscleGroups.FULL_BODY) || [];
  return secondary[0] || null;
}

/**
 * Totaux par groupe = somme des reps des exos dont le primaire est ce groupe.
 * @returns {{
 *   byGroup: Record<string, number>,
 *   byExercise: Array<{ id: string, name: string, reps: number, primaryGroup: string|null }>,
 *   totalPrimaryReps: number
 * }}
 */
export function buildPrimaryMuscleRepsByWindow(snapshot, window, getExerciseNameById = null) {
  const byGroup = {};
  const byExercise = [];
  if (!snapshot || !window?.end) {
    return { byGroup, byExercise, totalPrimaryReps: 0 };
  }

  const grouped = aggregateCheckedRepsByDateAndExerciseId(snapshot?.reps, snapshot?.checkedExercises);
  const acc = new Map();

  grouped.forEach(({ reps: r }, gkey) => {
    const sep = gkey.lastIndexOf('::');
    const dateStr = gkey.slice(0, sep);
    const idStr = gkey.slice(sep + 2);
    if (!isDateInRecapWindow(dateStr, window)) return;
    const rInt = Math.max(0, Math.floor(Number(r) || 0));
    if (rInt <= 0) return;
    const name = resolveExerciseNameForRecap(idStr, getExerciseNameById);
    const cur = acc.get(idStr) || { id: idStr, name: name || '', reps: 0 };
    cur.reps += rInt;
    if (!cur.name && name) cur.name = name;
    acc.set(idStr, cur);
  });

  let totalPrimaryReps = 0;
  acc.forEach((row) => {
    const name = row.name || `Exercice ${row.id}`;
    const primaryGroup = primaryMuscleGroupForExercise({ id: row.id, name });
    byExercise.push({
      id: row.id,
      name,
      reps: row.reps,
      primaryGroup
    });
    totalPrimaryReps += row.reps;
    if (primaryGroup) {
      byGroup[primaryGroup] = (byGroup[primaryGroup] || 0) + row.reps;
    }
  });

  byExercise.sort((a, b) => b.reps - a.reps);
  return { byGroup, byExercise, totalPrimaryReps };
}

/**
 * Compare shares multi-groupes (interne) vs primaires (affichage) — log only.
 */
export function logPrimaryVsShareGap(shareByGroup, primaryByGroup, label = 'muscle') {
  if (!shareByGroup || !primaryByGroup) return;
  Object.keys(shareByGroup).forEach((g) => {
    if (g === MuscleGroups.FULL_BODY) return;
    const share = Math.round(Number(shareByGroup[g]) || 0);
    const primary = Math.round(Number(primaryByGroup[g]) || 0);
    if (share > primary + 5 && primary >= 0) {
      logRecapReject({
        id: `${label}:${g}`,
        rule: 'share_gt_primary_display',
        values: { group: g, share, primary }
      });
    }
  });
}
