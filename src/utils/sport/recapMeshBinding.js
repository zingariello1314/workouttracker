/**
 * Liaison mesh GLB → groupe musculaire Récap (enum `MuscleGroups`).
 * Aligné sur les zones du GLB : neck, tibialis anterior, adductor, etc.
 */
export const GLB_MESH_TO_MUSCLE_ID = {
  // Chest / core
  Chest_002: 'chest',
  pecs: 'chest',
  chest: 'chest',
  abs: 'core',
  sideofabs: 'core',
  side_of_abs: 'core',
  Object_10_003: 'chest',
  Object_10_001: 'chest',
  Object_10_002: 'core',
  Object_10: 'core',

  // Dos / épaules / cou
  back: 'back',
  shoulders: 'shoulders',
  neck: 'neck',
  Object_5: 'back',
  Object_5_001: 'back',
  Object_5_003: 'back',
  Object_13_001: 'back',
  Object_13_002: 'back',
  Object_1: 'shoulders',
  Object_8: 'neck',
  Object_8_001: 'neck',
  Object_19: 'neck',
  Object_19_001: 'neck',
  /** Tête — pas le cou (surbrillance famille Cou). */
  Tête: 'head',
  Tete: 'head',

  // Bras
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
  adductor: 'adductors',
  tibialis_anterior: 'tibialis_anterior',
  /** Nom de nœud GLB (espaces en fin de chaîne). */
  'tibialis_anterior  ': 'tibialis_anterior',
  Object_7: 'quads',
  Object_12: 'adductors',
  Object_3: 'hamstrings',
  Object_0: 'glutes',
  Object_2: 'calves',
  /** Tibial antérieur + cheville (SubTool-1 / Blender : tibialis_anterior → Object_11). */
  Object_11: 'tibialis_anterior',
  Object_11_001: 'tibialis_anterior',
  Object_11_002: 'tibialis_anterior',

  // Fragments jambes / bassin / pieds (même teinte de repos que le reste)
  Object_29_001: 'adductors',
  Object_29_002: 'adductors',
  Object_29_003: 'adductors',
  Object_4: 'calves',
  Object_4_002: 'calves',

  // Mains / poignets — Object_27 = adducteurs sur ce GLB (pas avant-bras)
  Object_27: 'adductors',
  Object_27_001: 'adductors',

  // Dos / os visibles
  Object_13: 'back',
  Object_13_003: 'back',
  Object_5_002: 'back',
  Object_33_001: 'back',

  // Tête / cou (teinte uniforme au repos, pas de surbrillance GLB d’origine)
  Object_6: 'neck'
};

function normalizeMeshName(name) {
  return String(name || '')
    .trim()
    .replace(/\./g, '_')
    .replace(/\s+/g, '_');
}

export function getMeshesForMuscleGroup(groupId) {
  return Object.entries(GLB_MESH_TO_MUSCLE_ID)
    .filter(([, g]) => g === groupId)
    .map(([meshName]) => normalizeMeshName(meshName));
}

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
