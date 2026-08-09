/** Segmentation anatomie 3D : haut vs bas du dos (mesh GLB découpé). */

const UPPER_BACK_MESHES = new Set(['back', 'Object_5', 'Object_13_001', 'Object_13_002']);

const LOWER_BACK_MESHES = new Set(['Object_5_001', 'Object_5_003']);

export function normalizeAnatomyMeshName(name) {
  return String(name || '')
    .trim()
    .replace(/\./g, '_')
    .replace(/\s+/g, '_');
}

/** @param {'upper'|'lower'} region */
export function meshInAnatomyBackRegion(meshName, region) {
  const norm = normalizeAnatomyMeshName(meshName);
  if (region === 'upper') return UPPER_BACK_MESHES.has(norm);
  if (region === 'lower') return LOWER_BACK_MESHES.has(norm);
  return false;
}

export const ANATOMY_BACK_FAMILY_IDS = ['haut-dos', 'bas-dos'];
