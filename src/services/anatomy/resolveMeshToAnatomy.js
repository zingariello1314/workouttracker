import { GLB_MESH_TO_MUSCLE_ID } from '../../utils/sport/recapMeshBinding';
import {
  resolveAnatomyTargetFromVisualGroup,
  getAnatomyFamily,
  getAnatomyMuscle
} from '../../data/anatomy/anatomyRegistry';

function normalizeMeshName(name) {
  return String(name || '')
    .trim()
    .replace(/\./g, '_');
}

/** Clic sur le modèle 3D → famille + muscle mis en avant. */
export function resolveAnatomyFromMeshClick(meshName) {
  const norm = normalizeMeshName(meshName);
  const groupId = GLB_MESH_TO_MUSCLE_ID[norm] || GLB_MESH_TO_MUSCLE_ID[meshName];
  if (!groupId) return null;
  return resolveAnatomyTargetFromVisualGroup(groupId);
}

export function visualGroupFromMesh(meshName) {
  const norm = normalizeMeshName(meshName);
  return GLB_MESH_TO_MUSCLE_ID[norm] || GLB_MESH_TO_MUSCLE_ID[meshName] || null;
}

export function resolveMeshHoverLabel(meshName) {
  const target = resolveAnatomyFromMeshClick(meshName);
  if (!target) return null;
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
