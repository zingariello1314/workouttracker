/**
 * Liaison mesh GLB -> groupe musculaire Récap (enum `MuscleGroups`).
 *
 * Nouveau modèle découpé (`ecorche-muscles-decoupes.glb`) :
 * - les noms "métier" (chest, back, shoulders...) sont sur les nodes,
 * - les meshes ont des noms techniques (`Object_*`).
 * Cette table mappe donc `Object_*` vers les groupes pour que la couleur dépende
 * bien des reps/charges calculées.
 *
 * Notes de correspondance :
 * - `glutes` est rapproché de `hamstrings` (pas de groupe "glutes" séparé dans `MuscleGroups`).
 * - `tibialis_anterior` est maintenant un groupe dédié.
 * - `forearms` est rapproché de `biceps` (proxy bras ; pas de groupe forearms dédié).
 */
export const GLB_MESH_TO_MUSCLE_ID = {
  // Chest / Core
  Chest_002: 'chest',
  pecs: 'chest',
  abs: 'core',
  sideofabs: 'core',
  Object_10_003: 'chest', // node: Chest.002
  Object_10_001: 'chest', // node: pecs
  Object_10_002: 'core', // node: abs
  Object_10: 'core', // node: sideofabs

  // Back / Shoulders
  back: 'back',
  shoulders: 'shoulders',
  Object_5: 'back', // node: back
  Object_5_001: 'back', // node: Object_13.001 (back segment)
  Object_5_003: 'back', // node: Object_13.003 (back segment)
  Object_1: 'shoulders', // node: shoulders

  // Arms
  biceps: 'biceps',
  triceps: 'triceps',
  forearms: 'biceps',
  forearms_2: 'biceps',
  Object_15_001: 'biceps', // node: biceps
  Object_15: 'triceps', // node: triceps
  Object_14: 'biceps', // node: forearms
  Object_9: 'biceps', // node: forearms 2

  // Legs
  quads: 'quads',
  hamstrings: 'hamstrings',
  glutes: 'hamstrings',
  calves: 'calves',
  tibialis_anterior: 'tibialis_anterior',
  Object_7: 'quads', // node: quads
  Object_3: 'hamstrings', // node: hamstrings
  Object_0: 'hamstrings', // node: glutes (mapped to posterior chain)
  Object_2: 'calves', // node: calves
  Object_11: 'tibialis_anterior' // node: tibialis_anterior
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
