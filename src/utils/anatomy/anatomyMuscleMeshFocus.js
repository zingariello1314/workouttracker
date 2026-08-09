/**
 * Meshes GLB à surligner pour une fiche muscle (aperçus famille / rail).
 * Noms alignés sur le GLB courant (`public/models/ecorche-muscles-decoupes.glb`).
 */
import { normalizeAnatomyMeshName } from './anatomyBackMeshRegions';
import { MuscleGroups } from '../../data/workoutProgramEnhanced';
import { getMeshesForMuscleGroup } from '../sport/recapMeshBinding';

const n = normalizeAnatomyMeshName;

const M = {
  chestMain: n('Chest.002'),
  pecs: n('pecs'),
  abs: n('abs'),
  sideAbs: n('sideofabs'),
  backUpper: n('back'),
  backUpperA: n('Object_13.001'),
  backUpperB: n('Object_13.003'),
  shoulders: n('shoulders'),
  biceps: n('biceps'),
  triceps: n('triceps'),
  forearmA: n('forearms'),
  forearmB: n('forearms 2'),
  forearmHandA: n('forearms'),
  quads: n('quads'),
  adductorA: n('Object_29.001'),
  adductorB: n('Object_29.002'),
  hamstrings: n('hamstrings'),
  glutes: n('glutes'),
  calves: n('calves'),
  tibialis: n('tibialis_anterior'),
  neckA: n('Object_19'),
  neckB: n('Object_19.001'),
  head: n('Tête')
};

const ALL_BACK = [M.backUpper, M.backUpperA, M.backUpperB, n('back')];

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
  rhomboides: [M.backUpper, M.backUpperA],
  splenius: [M.neckA, M.neckB],
  'elevateur-scapula': [M.backUpper, M.shoulders],
  'sterno-cleido-mastoidien': [M.neckA, M.neckB],
  'erecteurs-rachis': ALL_BACK,
  multifides: ALL_BACK,
  'biceps-brachial': [M.biceps],
  brachial: [M.biceps],
  'brachio-radial': [M.forearmA, M.forearmB, M.forearmHandA],
  'triceps-brachial': [M.triceps],
  'avant-bras-ensemble': [M.forearmA, M.forearmB, M.forearmHandA],
  'grand-droit': [M.abs],
  'oblique-externe': [M.sideAbs],
  'oblique-interne': [M.sideAbs],
  transverse: [M.abs, M.sideAbs],
  pyramidal: [M.abs],
  'carre-lombes': [M.sideAbs, ...ALL_BACK],
  'psoas-iliaque': [M.abs],
  'quadriceps-femoral': [M.quads],
  'ischio-jambiers': [M.hamstrings],
  'adducteurs-ensemble': [M.adductorA, M.adductorB, n('Object_27')],
  'grand-fessier': [M.glutes],
  'moyen-fessier': [M.glutes],
  'petit-fessier': [M.glutes],
  gastrocnemien: [M.calves],
  soleaire: [M.calves],
  'tibial-anterieur': [M.tibialis, n('Object_11.002'), n('Object_11.001'), n('Object_11')]
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
