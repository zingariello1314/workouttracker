/**
 * Liaison mesh GLB → groupe musculaire Récap (enum `MuscleGroups`).
 *
 * Modèle `ecorche-muscles-decoupes.glb` : meshes techniques `Object_*` ;
 * nœuds scène portent les noms métier (biceps, triceps, forearms…).
 */
export const GLB_MESH_TO_MUSCLE_ID = {
  // Chest / core (noms métier + meshes)
  Chest_002: 'chest',
  pecs: 'chest',
  abs: 'core',
  sideofabs: 'core',
  Object_10_003: 'chest',
  Object_10_001: 'chest',
  Object_10_002: 'core',
  Object_10: 'core',

  // Dos / épaules
  back: 'back',
  shoulders: 'shoulders',
  Object_5: 'back',
  Object_5_001: 'back',
  Object_5_003: 'back',
  Object_13_001: 'back',
  Object_13_002: 'back',
  Object_1: 'shoulders',
  Object_8: 'shoulders',
  Object_8_001: 'shoulders',

  // Bras (découpés)
  biceps: 'biceps',
  triceps: 'triceps',
  forearms: 'forearms',
  forearms_2: 'forearms',
  Object_15_001: 'biceps',
  Object_15: 'triceps',
  Object_14: 'forearms',
  Object_9: 'forearms',

  // Jambes
  quads: 'quads',
  hamstrings: 'hamstrings',
  glutes: 'glutes',
  calves: 'calves',
  tibialis_anterior: 'tibialis_anterior',
  Object_7: 'quads',
  Object_12: 'quads',
  Object_3: 'hamstrings',
  Object_0: 'glutes',
  Object_2: 'calves',
  Object_11: 'tibialis_anterior'
};

function normalizeMeshName(name) {
  return String(name || '')
    .trim()
    .replace(/\./g, '_');
}

export function getMeshesForMuscleGroup(groupId) {
  return Object.entries(GLB_MESH_TO_MUSCLE_ID)
    .filter(([, g]) => g === groupId)
    .map(([meshName]) => normalizeMeshName(meshName));
}

/** Meshes mappés (pour teintes focus / aperçus). */
export function getAllMappedAnatomyMeshKeys() {
  const keys = new Set();
  Object.keys(GLB_MESH_TO_MUSCLE_ID).forEach((meshName) => {
    keys.add(normalizeMeshName(meshName));
  });
  return [...keys];
}

export function muscleGroupFromMeshName(meshName) {
  const norm = normalizeMeshName(meshName);
  return GLB_MESH_TO_MUSCLE_ID[norm] || GLB_MESH_TO_MUSCLE_ID[meshName] || null;
}
