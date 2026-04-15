/**
 * Couleurs « heat » Récap : mapping relatif à la période + spectre pour la légende.
 * Le corps 3D et les panneaux utilisent la même fonction pour rester alignés.
 */

/**
 * @param {number} clamped — ratio charge/réf, typiquement dans [0, 1.25]
 * @returns {string} couleur CSS (hsl ou hex)
 */
function loadRatioToCssColor(clamped) {
  const c = Math.max(0, Math.min(Number(clamped) || 0, 1.25));

  if (c <= 0.01) return '#cbd5e1';

  // Courbe plus « ouverte » que x^0.72 : les scores proches se séparent mieux en teinte.
  if (c <= 1) {
    const eased = Math.pow(c, 0.5);
    const hue = 218 - 218 * eased;
    // Saturation plus haute au milieu du spectre (verts / jaunes) → mélange visuel plus riche.
    const saturation = 72 + 26 * Math.sin(eased * Math.PI);
    const lightness = 74 - 32 * eased + 4 * Math.sin(eased * Math.PI * 2);
    return `hsl(${Math.round(hue)}, ${Math.round(saturation)}%, ${Math.round(Math.max(38, Math.min(82, lightness)))}%)`;
  }

  const over = Math.min(1, (c - 1) / 0.25);
  const hue = 285 - 45 * over;
  const saturation = 72 + 18 * over;
  const lightness = 45 - 18 * over;
  return `hsl(${Math.round(hue)}, ${Math.round(saturation)}%, ${Math.round(lightness)}%)`;
}

/**
 * Ratio charge / référence (même plafond que pour le rendu couleur).
 */
export function recapLoadRatioClamped(score, referenceMax) {
  const ref = Math.max(1e-9, Number(referenceMax) || 0);
  const s = Math.max(0, Number(score) || 0);
  return Math.max(0, Math.min(s / ref, 1.25));
}

/**
 * Même palette que l’historique `recapScoreToHex`, mais l’intensité est ramenée sur la période :
 * quand les scores bruts sont faibles, évite que tout reste gris/bleuet comme un seul palier.
 * Utiliser la même `referenceMax` pour le corps 3D, les meshes et les jauges Récap.
 */
export function recapScoreToHexRelative(score, referenceMax) {
  return loadRatioToCssColor(recapLoadRatioClamped(score, referenceMax));
}

/**
 * Échantillons pour un dégradé CSS (légende) — beaucoup de stops = transitions fines visibles.
 * @param {number} segmentCount — nombre de points (≥ 2)
 * @param {number} [maxRatio=1.06] — jusqu’où balayer sur l’axe charge (avant zone surcharge violette)
 */
export function recapIntensityGradientStops(segmentCount = 36, maxRatio = 1.06) {
  const n = Math.max(2, Math.floor(segmentCount));
  const out = [];
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    const r = u * maxRatio;
    out.push({ offset: u, color: loadRatioToCssColor(r) });
  }
  return out;
}

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
