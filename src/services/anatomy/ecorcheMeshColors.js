/**
 * Teintes « écorché » par zone Récap — base visible même sans survol.
 */
import { GLB_MESH_TO_MUSCLE_ID } from '../../utils/sport/recapMeshBinding';
import { meshInAnatomyBackRegion, normalizeAnatomyMeshName } from '../../utils/anatomy/anatomyBackMeshRegions';
import { getAnatomyFamily } from '../../data/anatomy/anatomyRegistry';

/** Couleur de surbrillance au survol (lisible sur fond muscle). */
export const ECORCHE_HOVER_ACCENT = '#5eead4';

/** @type {Record<string, string>} */
export const ECORCHE_GROUP_BASE = {
  chest: '#b84a4a',
  back: '#9a4040',
  shoulders: '#a84545',
  biceps: '#8f3d3d',
  triceps: '#7a3636',
  core: '#6d3333',
  quads: '#5c2e2e',
  hamstrings: '#4f2828',
  calves: '#452424',
  tibialis_anterior: '#4a2626',
  legs: '#5c2e2e',
  full_body: '#8b4040'
};

function normalizeMeshName(name) {
  return String(name || '')
    .trim()
    .replace(/\./g, '_');
}

function baseForGroup(groupId) {
  return ECORCHE_GROUP_BASE[groupId] || '#7a3838';
}

/** Toutes les meshes du GLB avec leur couleur écorché. */
export function buildEcorcheBaseMeshColors() {
  const colors = {};
  Object.entries(GLB_MESH_TO_MUSCLE_ID).forEach(([meshName, groupId]) => {
    colors[normalizeMeshName(meshName)] = baseForGroup(groupId);
  });
  return colors;
}

function darkenHex(hex, factor = 0.55) {
  const h = hex.replace('#', '');
  if (h.length !== 6) return hex;
  const r = Math.round(parseInt(h.slice(0, 2), 16) * factor);
  const g = Math.round(parseInt(h.slice(2, 4), 16) * factor);
  const b = Math.round(parseInt(h.slice(4, 6), 16) * factor);
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

function brightenHex(hex, factor = 1.35) {
  const h = hex.replace('#', '');
  if (h.length !== 6) return hex;
  const r = Math.min(255, Math.round(parseInt(h.slice(0, 2), 16) * factor));
  const g = Math.min(255, Math.round(parseInt(h.slice(2, 4), 16) * factor));
  const b = Math.min(255, Math.round(parseInt(h.slice(4, 6), 16) * factor));
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

/** Surbrillance d’une famille (plusieurs groupes visuels) — reste en palette écorché. */
export function buildFamilyFocusMeshColors(visualGroupIds = [], { dimOthers = true, familyId = null } = {}) {
  const focus = new Set((visualGroupIds || []).filter(Boolean));
  const backRegion = familyId ? getAnatomyFamily(familyId)?.anatomyBackRegion : null;
  const colors = {};
  Object.entries(GLB_MESH_TO_MUSCLE_ID).forEach(([meshName, groupId]) => {
    const key = normalizeAnatomyMeshName(meshName);
    const base = baseForGroup(groupId);
    let inFocus = focus.has(groupId);
    if (groupId === 'back' && backRegion) {
      inFocus = meshInAnatomyBackRegion(key, backRegion);
    }
    if (inFocus) {
      colors[key] = brightenHex(base, 1.42);
    } else {
      colors[key] = dimOthers ? darkenHex(base, 0.48) : base;
    }
  });
  return colors;
}

/** @deprecated — préférer buildFamilyFocusMeshColors via famille */
export function buildPickModeEcorcheMeshColors(hoveredGroupId) {
  const colors = buildEcorcheBaseMeshColors();
  if (!hoveredGroupId) return colors;

  Object.entries(GLB_MESH_TO_MUSCLE_ID).forEach(([meshName, groupId]) => {
    const key = normalizeMeshName(meshName);
    if (groupId === hoveredGroupId) {
      colors[key] = ECORCHE_HOVER_ACCENT;
    } else {
      colors[key] = darkenHex(baseForGroup(groupId), 0.42);
    }
  });
  return colors;
}

export function mergeEcorcheHoverHighlight(existingColors, hoveredGroupId) {
  if (!hoveredGroupId) return existingColors || buildEcorcheBaseMeshColors();
  const base = { ...(existingColors || buildEcorcheBaseMeshColors()) };
  Object.entries(GLB_MESH_TO_MUSCLE_ID).forEach(([meshName, groupId]) => {
    const key = normalizeMeshName(meshName);
    if (groupId === hoveredGroupId) {
      base[key] = ECORCHE_HOVER_ACCENT;
    } else if (!existingColors?.[key]) {
      base[key] = darkenHex(baseForGroup(groupId), 0.42);
    } else {
      base[key] = darkenHex(existingColors[key], 0.55);
    }
  });
  return base;
}

export function isEcorcheHoverColor(hex) {
  return hex === ECORCHE_HOVER_ACCENT;
}
