/**

 * Teintes « écorché » par zone Récap — base visible même sans survol.

 */

import { GLB_MESH_TO_MUSCLE_ID, getAllMappedAnatomyMeshKeys } from '../../utils/sport/recapMeshBinding';

import { ECORCHE_IDLE_UNIFORM, normalizeMeshColorKey, stampMeshColorVariants } from '../../utils/anatomy/anatomyMeshColorLookup';

import { normalizeAnatomyMeshName } from '../../utils/anatomy/anatomyBackMeshRegions';

import { resolvePreviewFocusMeshKeys, getFocusMeshKeysForVisualGroup } from '../../utils/anatomy/anatomyMuscleMeshFocus';

import { getAnatomyFamilyFocusMeshKeys, GLB_TIBIALIS_ANTERIOR_NODE } from '../../utils/anatomy/anatomyFamilyFocusMeshes';
/** Couleur de surbrillance au survol (lisible sur fond muscle). */

export const ECORCHE_HOVER_ACCENT = '#5eead4';



/** Surbrillance famille / explorateur. */

export const ECORCHE_FAMILY_FOCUS = '#b85454';



/** @type {Record<string, string>} */

export const ECORCHE_GROUP_BASE = {

  chest: ECORCHE_IDLE_UNIFORM,

  back: ECORCHE_IDLE_UNIFORM,

  shoulders: ECORCHE_IDLE_UNIFORM,

  biceps: ECORCHE_IDLE_UNIFORM,

  triceps: ECORCHE_IDLE_UNIFORM,

  core: ECORCHE_IDLE_UNIFORM,

  quads: ECORCHE_IDLE_UNIFORM,

  hamstrings: ECORCHE_IDLE_UNIFORM,

  calves: ECORCHE_IDLE_UNIFORM,

  tibialis_anterior: ECORCHE_IDLE_UNIFORM,

  forearms: ECORCHE_IDLE_UNIFORM,

  glutes: ECORCHE_IDLE_UNIFORM,

  neck: ECORCHE_IDLE_UNIFORM,

  adductors: ECORCHE_IDLE_UNIFORM,

  legs: ECORCHE_IDLE_UNIFORM,

  full_body: ECORCHE_IDLE_UNIFORM

};



const MESH_KEY_TO_GROUP = (() => {

  /** @type {Record<string, string>} */

  const map = {};

  Object.entries(GLB_MESH_TO_MUSCLE_ID).forEach(([meshName, groupId]) => {

    map[normalizeAnatomyMeshName(meshName)] = groupId;

  });

  return map;

})();



function focusSetHasKey(focusSet, meshKey) {

  if (focusSet.has(meshKey)) return true;

  const dotted = meshKey.replace(/_/g, '.');

  if (focusSet.has(dotted)) return true;

  for (const f of focusSet) {

    if (normalizeMeshColorKey(f) === meshKey) return true;

  }

  return false;

}



/** Toutes les meshes du GLB avec la même teinte de repos. */

export function buildEcorcheBaseMeshColors() {

  const colors = {};

  getAllMappedAnatomyMeshKeys().forEach((key) => {

    colors[key] = ECORCHE_IDLE_UNIFORM;

  });

  return colors;

}



/** Surbrillance d’une famille (explorateur) — listes explicites par `familyId`. */
export function buildFamilyFocusMeshColors(visualGroupIds = [], { dimOthers = true, familyId = null } = {}) {
  const colors = {};
  const idle = dimOthers ? ECORCHE_IDLE_UNIFORM : null;

  let focusKeys = [];
  if (familyId) {
    focusKeys = getAnatomyFamilyFocusMeshKeys(familyId);
  } else {
    const focus = new Set((visualGroupIds || []).filter(Boolean));
    getAllMappedAnatomyMeshKeys().forEach((key) => {
      const groupId = MESH_KEY_TO_GROUP[key];
      if (groupId && focus.has(groupId)) focusKeys.push(key);
    });
  }

  const focusSet = new Set(focusKeys.map((k) => normalizeMeshColorKey(k)));

  getAllMappedAnatomyMeshKeys().forEach((key) => {
    const norm = normalizeMeshColorKey(key);
    const inFocus = focusSetHasKey(focusSet, norm);
    const hex = inFocus ? ECORCHE_FAMILY_FOCUS : idle;
    if (hex) stampMeshColorVariants(colors, key, hex);
  });

  focusSet.forEach((k) => stampMeshColorVariants(colors, k, ECORCHE_FAMILY_FOCUS));

  if (familyId === 'tibia') {
    colors[GLB_TIBIALIS_ANTERIOR_NODE] = ECORCHE_FAMILY_FOCUS;
    colors['@group:tibialis_anterior'] = ECORCHE_FAMILY_FOCUS;
    stampMeshColorVariants(colors, GLB_TIBIALIS_ANTERIOR_NODE, ECORCHE_FAMILY_FOCUS);
  }

  return colors;
}



/** @deprecated — préférer buildFamilyFocusMeshColors via famille */

export function buildPickModeEcorcheMeshColors(hoveredGroupId) {

  const colors = buildEcorcheBaseMeshColors();

  if (!hoveredGroupId) return colors;



  getAllMappedAnatomyMeshKeys().forEach((key) => {

    const g = MESH_KEY_TO_GROUP[key];

    if (g === hoveredGroupId) {

      colors[key] = ECORCHE_HOVER_ACCENT;

    } else {

      colors[key] = ECORCHE_IDLE_UNIFORM;

    }

  });

  return colors;

}



export function mergeEcorcheHoverHighlight(existingColors, hoveredGroupId) {

  if (!hoveredGroupId) return existingColors || buildEcorcheBaseMeshColors();

  const base = { ...(existingColors || buildEcorcheBaseMeshColors()) };

  getAllMappedAnatomyMeshKeys().forEach((key) => {

    const g = MESH_KEY_TO_GROUP[key];

    if (g === hoveredGroupId) {

      base[key] = ECORCHE_HOVER_ACCENT;

    } else {

      base[key] = ECORCHE_IDLE_UNIFORM;

    }

  });

  return base;

}



export function isEcorcheHoverColor(hex) {

  return hex === ECORCHE_HOVER_ACCENT;

}



/** Rouge vif des vignettes « muscle de la famille ». */
export const ECORCHE_PREVIEW_FOCUS = '#ef4444';



export function isEcorchePreviewFocusColor(hex) {

  return hex === ECORCHE_PREVIEW_FOCUS || hex === '#dc2626';

}

export function isEcorcheFamilyFocusColor(hex) {

  return hex === ECORCHE_FAMILY_FOCUS;

}


/** Surbrillance rouge ciblée pour une fiche muscle (vignettes / rail). */

export function buildMuscleFocusMeshColors(muscleId, visualGroupId, { dimOthers = true } = {}) {

  const focusKeys = resolvePreviewFocusMeshKeys(muscleId, visualGroupId) || [];

  const focusSet = new Set(focusKeys.map((k) => normalizeMeshColorKey(k)));

  if (focusSet.size === 0 && visualGroupId) {
    getFocusMeshKeysForVisualGroup(visualGroupId).forEach((k) => focusSet.add(normalizeMeshColorKey(k)));
  }
  if (focusSet.size === 0) return null;



  const colors = {};

  getAllMappedAnatomyMeshKeys().forEach((key) => {

    const isFocus = focusSetHasKey(focusSet, key);

    if (isFocus) {

      stampMeshColorVariants(colors, key, ECORCHE_PREVIEW_FOCUS);

    } else if (dimOthers) {

      stampMeshColorVariants(colors, key, ECORCHE_IDLE_UNIFORM);

    }

  });

  focusSet.forEach((key) => {
    stampMeshColorVariants(colors, key, ECORCHE_PREVIEW_FOCUS);
  });

  return Object.keys(colors).length ? colors : null;

}


