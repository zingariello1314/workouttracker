/**
 * Meshes GLB à surligner pour une fiche muscle (aperçus famille / rail).
 * Clés = noms normalisés (`.` → `_`), alignés sur `recapMeshBinding`.
 */
import { normalizeAnatomyMeshName } from './anatomyBackMeshRegions';
import { MuscleGroups } from '../../data/workoutProgramEnhanced';
import { getMeshesForMuscleGroup } from '../sport/recapMeshBinding';

const M = {
  chestMain: normalizeAnatomyMeshName('Object_10.003'),
  pecs: normalizeAnatomyMeshName('Object_10.001'),
  abs: normalizeAnatomyMeshName('Object_10.002'),
  sideAbs: normalizeAnatomyMeshName('Object_10'),
  backUpper: normalizeAnatomyMeshName('Object_5'),
  backUpperA: normalizeAnatomyMeshName('Object_13.001'),
  backUpperB: normalizeAnatomyMeshName('Object_13.002'),
  backLowerA: normalizeAnatomyMeshName('Object_5.001'),
  backLowerB: normalizeAnatomyMeshName('Object_5.003'),
  shoulders: normalizeAnatomyMeshName('Object_1'),
  biceps: normalizeAnatomyMeshName('Object_15.001'),
  triceps: normalizeAnatomyMeshName('Object_15'),
  forearmA: normalizeAnatomyMeshName('Object_14'),
  forearmB: normalizeAnatomyMeshName('Object_9'),
  quads: normalizeAnatomyMeshName('Object_7'),
  adductor: normalizeAnatomyMeshName('Object_12'),
  hamstrings: normalizeAnatomyMeshName('Object_3'),
  glutes: normalizeAnatomyMeshName('Object_0'),
  calves: normalizeAnatomyMeshName('Object_2'),
  tibialis: normalizeAnatomyMeshName('Object_11'),
  neckA: normalizeAnatomyMeshName('Object_8'),
  neckB: normalizeAnatomyMeshName('Object_8.001')
};

/** @type {Record<string, string[]>} */
export const ANATOMY_MUSCLE_FOCUS_MESHES = {
  'grand-pectoral': [M.chestMain, M.pecs],
  'petit-pectoral': [M.pecs],
  deltoide: [M.shoulders],
  'coiffe-rotateurs': [M.shoulders],
  'petit-rond': [M.shoulders],
  'grand-rond': [M.backUpper],
  'dentele-anterieur': [M.chestMain],
  'grand-dorsal': [M.backUpper, M.backUpperA, M.backUpperB],
  trapezes: [M.backUpper, M.backUpperA, M.backUpperB],
  rhomboides: [M.backUpper],
  splenius: [M.neckA, M.neckB],
  'elevateur-scapula': [M.backUpper, M.shoulders],
  'sterno-cleido-mastoidien': [M.neckA, M.neckB],
  'erecteurs-rachis': [M.backLowerA, M.backLowerB],
  multifides: [M.backLowerA, M.backLowerB],
  'biceps-brachial': [M.biceps],
  brachial: [M.biceps],
  'brachio-radial': [M.forearmA, M.forearmB],
  'triceps-brachial': [M.triceps],
  'avant-bras-ensemble': [M.forearmA, M.forearmB],
  'grand-droit': [M.abs],
  'oblique-externe': [M.sideAbs],
  'oblique-interne': [M.sideAbs],
  transverse: [M.abs, M.sideAbs],
  pyramidal: [M.abs],
  'carre-lombes': [M.sideAbs, M.backLowerA],
  'psoas-iliaque': [M.abs],
  'quadriceps-femoral': [M.quads],
  'ischio-jambiers': [M.hamstrings],
  'adducteurs-ensemble': [M.adductor],
  'grand-fessier': [M.glutes],
  'moyen-fessier': [M.glutes],
  'petit-fessier': [M.glutes],
  gastrocnemien: [M.calves],
  soleaire: [M.calves],
  'tibial-anterieur': [M.tibialis]
};

/**
 * @param {string | null | undefined} muscleId
 * @returns {string[] | null}
 */
export function getFocusMeshKeysForMuscleId(muscleId) {
  if (!muscleId) return null;
  const list = ANATOMY_MUSCLE_FOCUS_MESHES[muscleId];
  if (list?.length) return list;
  return null;
}

/**
 * Fallback : tous les meshes du groupe visuel (moins précis).
 * @param {string | null | undefined} visualGroupId
 */
export function getFocusMeshKeysForVisualGroup(visualGroupId) {
  if (!visualGroupId) return [];
  return getMeshesForMuscleGroup(visualGroupId).map(normalizeAnatomyMeshName);
}

/** @param {string} muscleId @param {string} [visualGroupId] */
export function resolvePreviewFocusMeshKeys(muscleId, visualGroupId) {
  return (
    getFocusMeshKeysForMuscleId(muscleId) ||
    (visualGroupId && visualGroupId !== MuscleGroups.FULL_BODY
      ? getFocusMeshKeysForVisualGroup(visualGroupId)
      : null)
  );
}
