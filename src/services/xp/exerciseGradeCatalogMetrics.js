/**

 * Métriques par clé catalogue (ex:id ou benchmark endurance).

 */



import { resolveExerciseBenchmark } from '../../utils/sport/exerciseBenchmarkRegistry';

import {

  parseExerciseIdFromCatalogKey,

  shouldAttachEnduranceToExercise

} from './exerciseGradeDiscovery';

import {
  exerciseNameMatchesNameCatalogKey,
  isNameCatalogKey
} from './exerciseGradeCanonicalCatalog';

import { forEachEnduranceBenchmarkSession } from './exerciseGradeEnduranceBridge';

import { analyzeStructuredSession } from '../../utils/sport/strengthBenchmarkExtractors';

import { summarizeExerciseSession } from '../../utils/sport/volumeProgressionEngine';

import {
  catalogKeyReceivesPushupDefis,
  exerciseRollsUpToPlainPushups
} from './exerciseGradePushupVariants';
import {
  isPushupsCatalogKey,
  classifyPushupWorkoutChannel,
  emptyPushupChannels,
  mergePushupChannels
} from './exerciseGradePushupChannels';
import { mergePerformancePeakIntoMetrics } from './exerciseGradePerformancePeak';
import { resolveCatalogDef } from './exerciseGradeDiscovery';
import { ENDURANCE_PUSHUPS_WORKOUT_EXERCISE_ID } from '../endurance/pushupEnduranceWorkoutKeys';



function exerciseIdFromStorageKey(key) {

  const m = String(key || '').match(/^(\d{4}-\d{2}-\d{2})_(.+)$/);

  if (!m) return null;

  let id = m[2].replace(/_semaineA$|_semaineB$/, '');

  if (id.startsWith('complementary_')) {
    return id === ENDURANCE_PUSHUPS_WORKOUT_EXERCISE_ID ? id : null;
  }

  return id;

}



function endurancePushupsAlreadySyncedOnDay(snapshot, dateStr) {
  const key = `${dateStr}_${ENDURANCE_PUSHUPS_WORKOUT_EXERCISE_ID}`;
  return snapshot?.checkedExercises?.[key] === true;
}



/** Même règle partout : ex:id strict, sinon clé benchmark registre. */

export function exerciseMatchesCatalogKey(catalogKey, exId, getExerciseNameById) {

  if (catalogKeyReceivesPushupDefis(catalogKey)) {
    if (String(exId) === ENDURANCE_PUSHUPS_WORKOUT_EXERCISE_ID) return true;
    if (exerciseRollsUpToPlainPushups(exId, getExerciseNameById)) return true;
  }

  if (isNameCatalogKey(catalogKey)) {
    return exerciseNameMatchesNameCatalogKey(catalogKey, exId, getExerciseNameById);
  }

  const targetExId = parseExerciseIdFromCatalogKey(catalogKey);

  if (targetExId) return String(exId) === String(targetExId);

  const def = resolveExerciseBenchmark(exId, getExerciseNameById);

  return def?.key === catalogKey;

}



export function shouldIncludeEnduranceForCatalog(catalogKey, getExerciseNameById) {
  void getExerciseNameById;
  return catalogKeyReceivesPushupDefis(catalogKey);
}



/** Reps réelles (séries structurées + saisie legacy), aligné récap. */

export function sessionRepsForCheckedKey(snapshot, storageKey, getExerciseNameById) {

  const summary = summarizeExerciseSession(snapshot, storageKey);

  if (summary && summary.totalReps > 0) return summary.totalReps;

  return parseInt(String(snapshot?.reps?.[storageKey]), 10) || 0;

}



function emptyDayActivity(trackPushups) {

  return {

    reps: 0,

    checks: 0,

    pushupChannels: trackPushups ? emptyPushupChannels() : null

  };

}



function bumpDay(byDate, dateStr, repsDelta, checkDelta, catalogKey, getExerciseNameById, channel) {

  if (!dateStr) return;

  const trackPushups = isPushupsCatalogKey(catalogKey, getExerciseNameById);

  const prev = byDate.get(dateStr) || emptyDayActivity(trackPushups);

  prev.reps += repsDelta;

  prev.checks += checkDelta;

  if (trackPushups && repsDelta > 0 && channel) {

    prev.pushupChannels[channel] = (prev.pushupChannels[channel] || 0) + repsDelta;

  }

  byDate.set(dateStr, prev);

}



/**

 * Agrège les séances programme par (jour, exercice) — max reps entre variantes semaine A/B.

 */

function forEachCatalogWorkoutDayTotals(snapshot, catalogKey, getExerciseNameById, onDayEx) {

  const checked = snapshot?.checkedExercises || {};

  const groups = new Map();



  for (const [key, val] of Object.entries(checked)) {

    if (val !== true) continue;

    const exId = exerciseIdFromStorageKey(key);

    if (!exId || !exerciseMatchesCatalogKey(catalogKey, exId, getExerciseNameById)) continue;

    const dateStr = key.slice(0, 10);

    const gkey = `${dateStr}::${exId}`;

    if (!groups.has(gkey)) groups.set(gkey, []);

    groups.get(gkey).push(key);

  }



  groups.forEach((keys, gkey) => {

    const dateStr = gkey.slice(0, 10);

    const exId = gkey.split('::')[1];

    let reps = 0;

    keys.forEach((k) => {

      reps = Math.max(reps, sessionRepsForCheckedKey(snapshot, k, getExerciseNameById));

    });

    const checks = keys.length;

    let channel = null;

    if (isPushupsCatalogKey(catalogKey, getExerciseNameById) && reps > 0) {

      channel = classifyPushupWorkoutChannel(exId, getExerciseNameById);

    }

    onDayEx({ dateStr, exId, reps, checks, channel });

  });

}



function emptyMetrics() {

  return {

    maxSetReps: 0,

    maxDailyTotalReps: 0,

    maxHoldSeconds: 0,

    maxWeightKg: 0,

    totalReps: 0,

    totalVolumeKg: 0,

    lifetimeHoldSeconds: 0,

    sessionCount: 0,

    checkCount: 0,

    bestExerciseName: null

  };

}



function bumpFromWorkout(snapshot, catalogKey, getExerciseNameById, metrics, dailyReps) {

  forEachCatalogWorkoutDayTotals(snapshot, catalogKey, getExerciseNameById, ({ dateStr, exId, reps, checks }) => {

    dailyReps.set(dateStr, (dailyReps.get(dateStr) || 0) + reps);

    metrics.checkCount += checks;

    metrics.totalReps += reps;

    metrics.sessionCount += checks;

    metrics.maxSetReps = Math.max(metrics.maxSetReps, reps);

    if (!metrics.bestExerciseName && getExerciseNameById) {

      metrics.bestExerciseName = getExerciseNameById(exId);

    }

  });



  const checked = snapshot?.checkedExercises || {};

  Object.keys(checked).forEach((storageKey) => {

    if (checked[storageKey] !== true) return;

    const exId = exerciseIdFromStorageKey(storageKey);

    if (!exId || !exerciseMatchesCatalogKey(catalogKey, exId, getExerciseNameById)) return;



    const analysis = analyzeStructuredSession(snapshot, storageKey, getExerciseNameById);

    if (!analysis) return;

    metrics.maxSetReps = Math.max(metrics.maxSetReps, analysis.maxSetReps || 0);

    metrics.maxHoldSeconds = Math.max(metrics.maxHoldSeconds, analysis.maxHoldSeconds || 0);

    metrics.maxWeightKg = Math.max(metrics.maxWeightKg, analysis.maxSetWeight || 0);

    metrics.totalVolumeKg += analysis.volumeKgReps || 0;

    if (analysis.isHold) metrics.lifetimeHoldSeconds += analysis.maxHoldSeconds || 0;

  });

}



function applyEndurance(snapshot, catalogKey, getExerciseNameById, metrics, dailyReps) {

  let enduranceKey = catalogKey;

  const attach = shouldAttachEnduranceToExercise(catalogKey, getExerciseNameById);

  if (attach) enduranceKey = attach;

  if (!ENDURANCE_KEYS.has(enduranceKey) && !parseExerciseIdFromCatalogKey(catalogKey)) {

    if (!ENDURANCE_KEYS.has(catalogKey)) return;

    enduranceKey = catalogKey;

  }

  if (!shouldIncludeEnduranceForCatalog(catalogKey, getExerciseNameById)) return;



  forEachEnduranceBenchmarkSession(snapshot, enduranceKey, ({ dateStr, reps }) => {
    if (endurancePushupsAlreadySyncedOnDay(snapshot, dateStr)) return;

    metrics.checkCount += 1;

    metrics.sessionCount += 1;

    metrics.totalReps += reps;

    dailyReps.set(dateStr, (dailyReps.get(dateStr) || 0) + reps);

  });

}



const ENDURANCE_KEYS = new Set(['pushups', 'pushups_classic']);



export function extractMetricsForCatalogKey(snapshot, catalogKey, getExerciseNameById) {

  const metrics = emptyMetrics();

  const dailyReps = new Map();



  bumpFromWorkout(snapshot, catalogKey, getExerciseNameById, metrics, dailyReps);

  applyEndurance(snapshot, catalogKey, getExerciseNameById, metrics, dailyReps);



  let maxDay = 0;

  dailyReps.forEach((v) => {

    maxDay = Math.max(maxDay, v);

  });

  metrics.maxDailyTotalReps = maxDay;

  metrics.lifetimeVolumeKg = metrics.totalVolumeKg;

  const def = resolveCatalogDef(catalogKey, getExerciseNameById);
  const merged = mergePerformancePeakIntoMetrics(
    metrics,
    snapshot,
    catalogKey,
    getExerciseNameById,
    def?.metric || 'max_set_reps'
  );

  return merged.metrics;
}



export function collectCatalogActivityByDate(snapshot, catalogKey, getExerciseNameById) {

  const byDate = new Map();



  forEachCatalogWorkoutDayTotals(snapshot, catalogKey, getExerciseNameById, ({

    dateStr,

    reps,

    checks,

    channel

  }) => {

    bumpDay(byDate, dateStr, reps, checks, catalogKey, getExerciseNameById, channel);

  });



  let enduranceKey = catalogKey;

  const attach = shouldAttachEnduranceToExercise(catalogKey, getExerciseNameById);

  if (attach) enduranceKey = attach;

  if (shouldIncludeEnduranceForCatalog(catalogKey, getExerciseNameById)) {

    forEachEnduranceBenchmarkSession(snapshot, enduranceKey, ({ dateStr, reps: r }) => {
      if (endurancePushupsAlreadySyncedOnDay(snapshot, dateStr)) return;

      bumpDay(byDate, dateStr, r, 1, catalogKey, getExerciseNameById, 'defis');

    });

  }



  return byDate;

}



export { mergePushupChannels, isPushupsCatalogKey };


