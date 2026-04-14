/**
 * Passe une intensité agrégée (0 → +∞) à une couleur type « heat » (cohérent avec la légende Récap).
 */
export function recapScoreToHex(score) {
  const s = Math.max(0, Number(score) || 0);
  const t = Math.tanh(s / 420);

  if (t < 0.08) return '#cbd5e1';
  if (t < 0.16) return '#7dd3fc';
  if (t < 0.24) return '#38bdf8';
  if (t < 0.32) return '#86efac';
  if (t < 0.4) return '#22c55e';
  if (t < 0.48) return '#facc15';
  if (t < 0.56) return '#fdba74';
  if (t < 0.64) return '#fb923c';
  if (t < 0.72) return '#f87171';
  if (t < 0.8) return '#dc2626';
  if (t < 0.9) return '#a855f7';
  return '#3f0f14';
}

/**
 * Même palette que `recapScoreToHex`, mais l’intensité est ramenée sur la période :
 * quand les scores bruts sont faibles, évite que tout reste gris/bleuet comme un seul palier.
 * Utiliser la même `referenceMax` pour le corps 3D, les meshes et les jauges Récap.
 */
export function recapScoreToHexRelative(score, referenceMax) {
  const ref = Math.max(1e-9, Number(referenceMax) || 0);
  const s = Math.max(0, Number(score) || 0);
  const ratio = s / ref;
  const clamped = Math.max(0, Math.min(ratio, 1.25));

  if (clamped <= 0.01) return '#cbd5e1';

  // Mapping continu basé sur la période courante (pas de seuils fixes).
  // 0.0..1.0 : bleu -> vert -> jaune -> orange -> rouge
  // >1.0 : violet/sombre (sur-sollicitation relative)
  const eased = Math.pow(Math.min(clamped, 1), 0.72);
  let hue;
  let saturation;
  let lightness;

  if (clamped <= 1) {
    hue = 210 - 210 * eased; // 210 (bleu) -> 0 (rouge)
    saturation = 84;
    lightness = 69 - 24 * eased;
  } else {
    const over = Math.min(1, (clamped - 1) / 0.25);
    hue = 285 - 45 * over; // violet -> pourpre
    saturation = 72 + 18 * over;
    lightness = 45 - 18 * over;
  }

  // Format avec virgules pour compatibilité parsing `THREE.Color.set(...)`.
  return `hsl(${Math.round(hue)}, ${Math.round(saturation)}%, ${Math.round(lightness)}%)`;
}

/**
 * Entrée couleur pour une zone : charge affichée + bonus si reps cochées (évite gris total quand la muscu
 * compte mais le decay/cardio rend `displayScore` très bas).
 */
export function recapZoneHueScore(displayScore, repShare, maxRepShareAcrossGroups, colorReferenceMax) {
  const ref = Math.max(1e-9, Number(colorReferenceMax) || 0);
  const d = Math.max(0, Number(displayScore) || 0);
  const r = Math.max(0, Number(repShare) || 0);
  const maxR = Math.max(1e-9, Number(maxRepShareAcrossGroups) || 0);
  const repRatio = maxR > 0 && r > 0 ? Math.min(1, r / maxR) : 0;
  const repBoost = repRatio * ref * 0.34;
  return Math.max(d, repBoost);
}

/**
 * Couleur des cartes « Détail par zone » et des meshes 3D : mélange volume (parts ou total corps entier)
 * et charge relative, avec léger relèvement si cardio sans parts reps (jambes).
 * @param {{ vol: number, maxRH: number, repH?: number, displayScore: number, maxDisplay: number, colorReferenceMax: number, forFullBody?: boolean }} p
 * @returns {number} score à passer à `recapScoreToHexRelative(..., colorReferenceMax)`
 */
export function recapZoneBlendHueScore(p) {
  const ref = Math.max(1e-9, Number(p.colorReferenceMax) || 0);
  const v = Math.max(0, Math.round(Number(p.vol) || 0));
  const rh = Math.max(0, Number(p.repH) || 0);
  const maxR = Math.max(1e-9, Number(p.maxRH) || 0);
  const forFullBody = !!p.forFullBody;
  const repDenomHue = Math.max(1e-9, maxR, forFullBody ? rh : 0);
  const normVol = repDenomHue > 0 ? Math.min(1, v / repDenomHue) : 0;
  const mx = Math.max(1e-9, Number(p.maxDisplay) || 0);
  const ds = Math.max(0, Number(p.displayScore) || 0);
  const normLoad = mx > 0 ? Math.min(1, ds / mx) : 0;
  const hasReps = v > 0;
  const hasLoad = ds > 1e-6;
  const cardioOnlyHueLift = !hasReps && hasLoad ? 0.14 * normLoad : 0;
  const blend01 = Math.min(1, Math.max(0.06, normVol * 0.5 + normLoad * 0.45 + cardioOnlyHueLift));
  return blend01 * ref;
}

/**
 * Bande de récupération (3 niveaux) alignée sur l’échelle `recapScoreToHex`.
 * @param {number} score — typiquement `displayScore` du Récap.
 * @returns {'ready'|'inProgress'|'fatigued'}
 */
export function recapDisplayRecoveryBand(score) {
  const s = Math.max(0, Number(score) || 0);
  const t = Math.tanh(s / 420);
  if (t < 0.36) return 'ready';
  if (t < 0.66) return 'inProgress';
  return 'fatigued';
}
