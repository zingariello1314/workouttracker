/**
 * Liaison noms de meshes du GLB ↔ ids MuscleGroups (workoutProgramEnhanced).
 * Le GLB Sketchfab « anatomy basemesh » actuel n’expose que quelques meshes plein corps
 * (souvent Object_2 / Object_3 / Object_4) sans vraie découpe musculaire : tant que ce
 * mapping est vide, BodyMap applique `uniformBodyColor` (pic de charge de la période).
 *
 * @example { 'PectoralMajor_L': 'chest', 'Latissimus_R': 'back' }
 */
export const GLB_MESH_TO_MUSCLE_ID = {};

export function getMeshesForMuscleGroup(groupId) {
  return Object.entries(GLB_MESH_TO_MUSCLE_ID)
    .filter(([, g]) => g === groupId)
    .map(([meshName]) => meshName);
}
