import { GLB_MESH_TO_MUSCLE_ID } from '../sport/recapMeshBinding';

/** Teinte de repos unique (la plus sombre) — tout le corps au même niveau sans sélection. */
export const ECORCHE_IDLE_UNIFORM = '#3a2222';

export function normalizeMeshColorKey(name) {
  return String(name || '')
    .trim()
    .replace(/\./g, '_')
    .replace(/\s+/g, '_');
}

/** Résout une couleur pour un mesh Three.js (nom avec points ou underscores). */
export function lookupMeshColor(meshName, muscleColors) {
  if (!muscleColors || meshName == null) return null;
  const rawName = String(meshName);
  if (muscleColors[rawName]) return muscleColors[rawName];
  const raw = rawName.trim();
  if (!raw) return null;
  const norm = normalizeMeshColorKey(raw);
  if (muscleColors[raw]) return muscleColors[raw];
  if (muscleColors[meshName]) return muscleColors[meshName];
  if (muscleColors[norm]) return muscleColors[norm];
  const dotted = norm.replace(/_/g, '.');
  if (muscleColors[dotted]) return muscleColors[dotted];
  const spaced = norm.replace(/_/g, ' ');
  if (muscleColors[spaced]) return muscleColors[spaced];
  const groupId =
    GLB_MESH_TO_MUSCLE_ID[norm] ||
    GLB_MESH_TO_MUSCLE_ID[raw] ||
    GLB_MESH_TO_MUSCLE_ID[rawName];
  if (groupId && muscleColors[`@group:${groupId}`]) return muscleColors[`@group:${groupId}`];
  return null;
}

/** Résout une couleur en testant le mesh et toute sa chaîne de nœuds nommés. */
export function resolveMeshHighlightColor(meshObject, muscleColors) {
  if (!meshObject?.isMesh || !muscleColors) return null;
  let o = meshObject;
  while (o) {
    if (o.name) {
      const c = lookupMeshColor(o.name, muscleColors);
      if (c) return c;
    }
    o = o.parent;
  }
  return null;
}

/** Écrit une couleur sous toutes les variantes de nom (underscores, points, espaces). */
export function stampMeshColorVariants(colors, normKey, hex) {
  if (!colors || !normKey) return;
  const key = normalizeMeshColorKey(normKey);
  if (!key) return;
  colors[key] = hex;
  const dotted = key.replace(/_/g, '.');
  if (dotted !== key) colors[dotted] = hex;
  const spaced = key.replace(/_/g, ' ');
  if (spaced !== key) colors[spaced] = hex;
}

/** Nom effectif du mesh pour la peinture (mesh ou ancêtre tibialis / parent nommé). */
export function resolveAnatomyMeshPaintName(object) {
  if (!object) return '';
  const chain = [];
  let o = object;
  while (o) {
    if (o.name) chain.push(o.name);
    o = o.parent;
  }
  const tibialisNode = chain.find((nm) => /tibialis_anterior/i.test(String(nm).trim()));
  if (tibialisNode) return tibialisNode;
  if (object.name) return object.name;
  return chain.find(Boolean) || '';
}
