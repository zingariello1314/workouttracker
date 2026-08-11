import { removeCatalogCheckHistoryEntry } from './exerciseGradeCheckHistoryRemove';
import { resolveCatalogDef } from './exerciseGradeDiscovery';
import { extractMetricsForCatalogKey } from './exerciseGradeCatalogMetrics';
import { resolveExerciseGradeForMetrics } from './exerciseGradeEngine';
import { reconcileExerciseGradeMilestones } from './exerciseGradeMilestones';
import { collectCatalogCheckHistory } from './exerciseGradeCheckHistory';

/**
 * Supprime une coche et réaligne grades / historique local.
 */
export function removeExerciseGradeCheckAndReconcile(
  workoutData,
  rowId,
  catalogKey,
  getExerciseNameById,
  vitals
) {
  const { next, removed } = removeCatalogCheckHistoryEntry(
    workoutData,
    rowId,
    catalogKey,
    getExerciseNameById
  );
  if (!removed) {
    return { next: workoutData, removed: false, remainingChecks: null, gradeRemoved: false };
  }

  const def = resolveCatalogDef(catalogKey, getExerciseNameById);
  const metrics = def
    ? extractMetricsForCatalogKey(next, catalogKey, getExerciseNameById)
    : null;
  const grade = def
    ? resolveExerciseGradeForMetrics(metrics, def, vitals, {
        catalogKey,
        getExerciseNameById
      })
    : null;

  reconcileExerciseGradeMilestones(
    catalogKey,
    grade?.sortIndex ?? -1,
    Boolean(grade?.hasActivity)
  );

  const remainingChecks = collectCatalogCheckHistory(next, catalogKey, getExerciseNameById).length;

  return {
    next,
    removed: true,
    remainingChecks,
    gradeRemoved: remainingChecks === 0
  };
}
