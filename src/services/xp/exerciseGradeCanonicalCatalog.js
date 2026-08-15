/**

 * Une seule fiche grades par exercice logique (benchmark registre ou nom unique).

 */



import { resolveExerciseBenchmark } from '../../utils/sport/exerciseBenchmarkRegistry';

import { catalogKeyForExerciseId, discoverActiveExerciseIds } from './exerciseGradeDiscovery';

import { resolveCanonicalCatalogKey } from './exerciseGradeNameAliases';
import { normalizeExerciseNameLabel, slugFromExerciseName } from './exerciseGradeNameNormalize';
import { ENDURANCE_BENCHMARK_BRIDGE, forEachEnduranceBenchmarkSession } from './exerciseGradeEnduranceBridge';
import { ENDURANCE_PUSHUPS_WORKOUT_EXERCISE_ID } from '../endurance/pushupEnduranceWorkoutKeys';
import {
  defaultPlainPushupsGradeCatalogKey,
  catalogKeyReceivesPushupDefis,
  exerciseRollsUpToPlainPushups,
  canonicalPushupGradeNameSlug,
  pushupCatalogKeyFromExerciseName
} from './exerciseGradePushupVariants';

export { normalizeExerciseNameLabel, slugFromExerciseName };



/**

 * Clé stable pour agrégation (évite plusieurs cartes pour le même exercice / benchmark).

 */

export function canonicalCatalogKeyForExerciseId(exerciseId, getExerciseNameById) {
  if (String(exerciseId) === ENDURANCE_PUSHUPS_WORKOUT_EXERCISE_ID) {
    return defaultPlainPushupsGradeCatalogKey();
  }

  const rawName =
    typeof getExerciseNameById === 'function' ? getExerciseNameById(exerciseId) : '';
  const namePushupKey = pushupCatalogKeyFromExerciseName(rawName);
  if (namePushupKey) return namePushupKey;

  const reg = resolveExerciseBenchmark(exerciseId, getExerciseNameById);

  if (reg?.key === 'pushups') {
    if (exerciseRollsUpToPlainPushups(exerciseId, getExerciseNameById)) {
      return defaultPlainPushupsGradeCatalogKey();
    }
    const pushupSlug = canonicalPushupGradeNameSlug(rawName);
    if (pushupSlug) return `name:${pushupSlug}`;
    return catalogKeyForExerciseId(exerciseId);
  }

  if (reg?.key === 'pullups_strict') {
    const slug = slugFromExerciseName(rawName);
    if (slug) return `name:${slug}`;
    return catalogKeyForExerciseId(exerciseId);
  }

  const alias = resolveCanonicalCatalogKey(exerciseId, getExerciseNameById, reg?.key);
  if (alias) return alias;

  const slug = canonicalPushupGradeNameSlug(rawName) || slugFromExerciseName(rawName);
  if (slug) return `name:${slug}`;

  return catalogKeyForExerciseId(exerciseId);
}



export function isNameCatalogKey(catalogKey) {

  return String(catalogKey || '').startsWith('name:');

}



export function exerciseNameMatchesNameCatalogKey(catalogKey, exerciseId, getExerciseNameById) {

  if (!isNameCatalogKey(catalogKey)) return false;

  const slug = catalogKey.slice(5);

  const rawName =

    typeof getExerciseNameById === 'function' ? getExerciseNameById(exerciseId) : '';

  const exerciseSlug = canonicalPushupGradeNameSlug(rawName) || slugFromExerciseName(rawName);

  return exerciseSlug === slug;

}



export function discoverCanonicalExerciseGradeCatalogKeys(snapshot, getExerciseNameById) {
  const keys = new Set();
  discoverActiveExerciseIds(snapshot).forEach((id) => {
    keys.add(canonicalCatalogKeyForExerciseId(id, getExerciseNameById));
  });

  Object.keys(ENDURANCE_BENCHMARK_BRIDGE).forEach((bk) => {
    if (bk !== 'pushups') return;
    let n = 0;
    forEachEnduranceBenchmarkSession(snapshot, bk, () => {
      n += 1;
    });
    if (n <= 0) return;
    const plainKey = defaultPlainPushupsGradeCatalogKey();
    const hasPlain = [...keys].some((k) => catalogKeyReceivesPushupDefis(k));
    if (!hasPlain) keys.add(plainKey);
  });

  return [...keys];
}



/** Anciennes clés ex:id ou name:… pouvant pointer vers la même fiche. */

export function legacyCatalogAliasKeysForCanonical(canonicalKey, snapshot, getExerciseNameById) {
  const aliases = new Set();
  if (catalogKeyReceivesPushupDefis(canonicalKey)) {
    aliases.add('pushups');
    aliases.add('pushups_classic');
  }
  discoverActiveExerciseIds(snapshot).forEach((id) => {

    const canonical = canonicalCatalogKeyForExerciseId(id, getExerciseNameById);

    if (canonical !== canonicalKey) return;

    const exKey = catalogKeyForExerciseId(id);

    if (exKey !== canonicalKey) aliases.add(exKey);

    const rawName =
      typeof getExerciseNameById === 'function' ? getExerciseNameById(id) || '' : '';
    const rawSlugKey = `name:${slugFromExerciseName(rawName)}`;
    if (rawSlugKey !== canonicalKey) aliases.add(rawSlugKey);

  });

  return [...aliases];

}


