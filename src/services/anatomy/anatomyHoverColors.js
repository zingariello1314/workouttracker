import { GLB_MESH_TO_MUSCLE_ID } from '../../utils/sport/recapMeshBinding';
import {
  buildPickModeEcorcheMeshColors,
  mergeEcorcheHoverHighlight,
  ECORCHE_HOVER_ACCENT,
  buildEcorcheBaseMeshColors
} from './ecorcheMeshColors';

function normalizeMeshName(name) {
  return String(name || '')
    .trim()
    .replace(/\./g, '_');
}

/** @deprecated — utiliser buildPickModeEcorcheMeshColors */
export function buildPickModeMeshColors(hoveredGroupId) {
  return buildPickModeEcorcheMeshColors(hoveredGroupId);
}

export function mergeHoverHighlight(existingColors, hoveredGroupId) {
  return mergeEcorcheHoverHighlight(existingColors, hoveredGroupId);
}

export { ECORCHE_HOVER_ACCENT, buildEcorcheBaseMeshColors };

export function visualGroupFromMeshName(meshName) {
  const norm = normalizeMeshName(meshName);
  return GLB_MESH_TO_MUSCLE_ID[norm] || GLB_MESH_TO_MUSCLE_ID[meshName] || null;
}
