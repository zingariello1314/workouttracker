/**
 * Meshes GLB à surligner par famille (explorateur Anatomie).
 * Source unique — ne pas dériver des visualGroupIds ni de tous les muscles de la famille
 * (évite dos sur épaules/abdos, adducteurs sur avant-bras, tête sur cou, etc.).
 *
 * Noms vérifiés : `public/models/ecorche-muscles-decoupes.glb` (+ script glb-mesh-bounds.mjs).
 */
import { normalizeAnatomyMeshName } from './anatomyBackMeshRegions';

const n = normalizeAnatomyMeshName;

/** Nom exact du nœud mesh dans le GLB exporté. */
export const GLB_TIBIALIS_ANTERIOR_NODE = 'tibialis_anterior  ';

/** @type {Record<string, string[]>} */
export const ANATOMY_FAMILY_FOCUS_MESHES = {
  pectoraux: [n('Chest.002'), n('pecs')],
  epaules: [n('shoulders')],
  'haut-dos': [n('back'), n('Object_13.001'), n('Object_13.003')],
  'bas-dos': [n('back'), n('Object_13.001'), n('Object_13.003')],
  biceps: [n('biceps')],
  triceps: [n('triceps')],
  'avant-bras': [n('forearms'), n('forearms 2')],
  abdominaux: [n('abs'), n('sideofabs')],
  fessiers: [n('glutes')],
  cuisses: [
    n('quads'),
    n('hamstrings'),
    n('Object_27'),
    n('Object_29.001'),
    n('Object_29.002')
  ],
  mollets: [n('calves')],
  tibia: [
    n('tibialis_anterior'),
    GLB_TIBIALIS_ANTERIOR_NODE,
    n('Object_11'),
    n('Object_11.001'),
    n('Object_11.002')
  ],
  cou: [n('Object_19'), n('Object_19.001')]
};

/** @param {string | null | undefined} familyId */
export function getAnatomyFamilyFocusMeshKeys(familyId) {
  if (!familyId) return [];
  return ANATOMY_FAMILY_FOCUS_MESHES[familyId] || [];
}
