import { GLB_MESH_TO_MUSCLE_ID } from '../../utils/sport/recapMeshBinding';
import { MuscleGroups } from '../../data/workoutProgramEnhanced';
import {
  resolveAnatomyTargetFromVisualGroup,
  anatomyTargetForFamily,
  getAnatomyFamily,
  getAnatomyMuscle
} from '../../data/anatomy/anatomyRegistry';
import { meshInAnatomyBackRegion, normalizeAnatomyMeshName } from '../../utils/anatomy/anatomyBackMeshRegions';

function normalizeMeshName(name) {
  return String(name || '')
    .trim()
    .replace(/\./g, '_');
}

/** Clic sur le modèle 3D → famille + muscle mis en avant, ou choix haut/bas du dos. */
export function resolveAnatomyFromMeshClick(meshName) {
  const norm = normalizeAnatomyMeshName(meshName);
  const groupId = GLB_MESH_TO_MUSCLE_ID[norm] || GLB_MESH_TO_MUSCLE_ID[meshName];
  if (!groupId) return null;

  if (groupId === MuscleGroups.BACK) {
    if (meshInAnatomyBackRegion(norm, 'upper')) {
      return anatomyTargetForFamily('haut-dos');
    }
    if (meshInAnatomyBackRegion(norm, 'lower')) {
      return anatomyTargetForFamily('bas-dos');
    }
    return { kind: 'backChoice', familyIds: ['haut-dos', 'bas-dos'] };
  }

  return resolveAnatomyTargetFromVisualGroup(groupId);
}

export function visualGroupFromMesh(meshName) {
  const norm = normalizeMeshName(meshName);
  return GLB_MESH_TO_MUSCLE_ID[norm] || GLB_MESH_TO_MUSCLE_ID[meshName] || null;
}

export function resolveMeshHoverLabel(meshName) {
  const target = resolveAnatomyFromMeshClick(meshName);
  if (!target) return null;
  if (target.kind === 'backChoice') {
    return {
      muscleName: '',
      familyName: 'Dos — haut ou bas',
      muscleId: null,
      familyId: null
    };
  }
  const muscle = getAnatomyMuscle(target.muscleId);
  const family = getAnatomyFamily(target.familyId);
  if (!muscle && !family) return null;
  return {
    muscleName: muscle?.name || '',
    familyName: family?.name || '',
    muscleId: target.muscleId,
    familyId: target.familyId
  };
}
