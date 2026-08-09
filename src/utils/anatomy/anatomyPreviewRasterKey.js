/**
 * Clé fichier pour previews raster banque (.webp sous /public/anatomy-previews/).
 * Alignée sur la même logique que l’aperçu WebGL carte (couleurs mesh + vue + mode).
 */

function fnv1a32(seed, str) {
  let h = seed >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Même chaîne que l’aperçu WebGl carte (`demandSignature` dans AnatomyModelCanvas). */
function cameraTuneSuffix(anatomy) {
  const o = anatomy.cameraTuningOverride;
  if (!o) return '';
  const chunks = [];
  if (typeof o.boundsMargin === 'number' && Number.isFinite(o.boundsMargin)) chunks.push(`bm${o.boundsMargin}`);
  if (typeof o.cameraDistanceFactor === 'number' && Number.isFinite(o.cameraDistanceFactor)) {
    chunks.push(`df${o.cameraDistanceFactor}`);
  }
  if (typeof o.targetOffsetX === 'number' && Number.isFinite(o.targetOffsetX)) {
    chunks.push(`tx${o.targetOffsetX}`);
  }
  return chunks.length ? `|${chunks.join(':')}` : '';
}

export function buildCardDemandSignature(anatomy) {
  const parts = Object.entries(anatomy.meshColors || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`);
  return `${anatomy.inferredView}|${anatomy.uniformBodyColor ?? ''}|${String(anatomy.usedFullBodyUniform)}|${String(anatomy.anatomyFallback)}|${parts.join(';')}${cameraTuneSuffix(anatomy)}`;
}

/** @param {object} anatomy — sortie de `resolveBankItemAnatomy` */
export function buildAnatomyRasterSignature(anatomy, mode) {
  const parts = Object.entries(anatomy.meshColors || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`);
  return `${mode}|${anatomy.inferredView}|${anatomy.uniformBodyColor ?? ''}|${String(anatomy.usedFullBodyUniform)}|${String(anatomy.anatomyFallback)}|${parts.join(';')}${cameraTuneSuffix(anatomy)}`;
}

/** Nom de fichier sans extension ; double hash pour limiter collisions. */
export function anatomyRasterFileBase(anatomy, mode) {
  const sig = buildAnatomyRasterSignature(anatomy, mode);
  const h1 = fnv1a32(0x811c9dc5, sig);
  const h2 = fnv1a32(0xcbf29ce4, `${sig}:${sig.length}`);
  return `${h1.toString(16).padStart(8, '0')}${h2.toString(16).padStart(8, '0')}`;
}

export function getAnatomyPreviewRasterSrc(anatomy, mode) {
  const base = anatomyRasterFileBase(anatomy, mode);
  const prefix = typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL != null ? import.meta.env.BASE_URL : '/';
  const root = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
  return `${root}/anatomy-previews/${base}.webp`;
}
