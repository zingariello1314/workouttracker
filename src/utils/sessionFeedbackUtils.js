/**
 * Feedback de session (Aujourd’hui) : détection « rempli », normalisation pour le calendrier,
 * bonus d’intensité (+2 points sur une échelle 0–100), note pondérée pour l’historique.
 */

const NUMERIC_FIELDS = [
  'ressenti',
  'difficulte',
  'energieDebut',
  'energieFin',
  'motivation',
  'douleur',
  'sommeil',
  'hydratation',
  'nutrition'
];

/**
 * @param {object|null|undefined} fb
 * @returns {boolean}
 */
export function isSessionFeedbackFilled(fb) {
  if (!fb || typeof fb !== 'object') return false;
  for (const k of NUMERIC_FIELDS) {
    const v = fb[k];
    if (typeof v === 'number' && v > 0) return true;
  }
  if (Array.isArray(fb.tags) && fb.tags.length > 0) return true;
  if (Array.isArray(fb.equipementUtilise) && fb.equipementUtilise.length > 0) return true;
  if (typeof fb.notes === 'string' && fb.notes.trim().length > 0) return true;
  if (typeof fb.prochainObjectif === 'string' && fb.prochainObjectif.trim().length > 0) return true;
  if (typeof fb.musiquesEcoutees === 'string' && fb.musiquesEcoutees.trim().length > 0) return true;
  if (typeof fb.tempsRepos === 'string' && fb.tempsRepos.trim().length > 0) return true;
  if (typeof fb.environnement === 'string' && fb.environnement.trim().length > 0) return true;
  if (typeof fb.meteo === 'string' && fb.meteo.trim().length > 0) return true;
  if (fb.partenaire === true) return true;
  if (fb.objectifAtteint === true || fb.objectifAtteint === false) return true;
  return false;
}

/**
 * Mappe difficulté / ressenti (échelle 1–10 dans l’UI) vers 1–5 pour le modèle visuel du calendrier.
 * @param {object|null|undefined} fb
 * @returns {number|null}
 */
export function normalizeDifficultyForCalendarModel(fb) {
  if (!fb || typeof fb !== 'object') return null;
  const d = Number(fb.difficulte);
  const r = Number(fb.ressenti);
  const primary = Number.isFinite(d) && d > 0 ? d : Number.isFinite(r) && r > 0 ? r : NaN;
  if (!Number.isFinite(primary) || primary <= 0) return null;
  if (primary <= 5) return Math.max(1, Math.min(5, Math.round(primary)));
  return Math.max(1, Math.min(5, Math.round(1 + ((primary - 1) * 4) / 9)));
}

/** Bonus demandé : +2 sur une échelle 0–100 → +0.02 sur composite 0–1 */
export const SESSION_FEEDBACK_INTENSITY_BOOST_ON_100 = 2;

export function sessionFeedbackVisualBoost01(fb) {
  return isSessionFeedbackFilled(fb) ? SESSION_FEEDBACK_INTENSITY_BOOST_ON_100 / 100 : 0;
}

/**
 * Note générale 0–10 (pondérée). Les dimensions « séance » pèsent plus que le contexte.
 * @param {object|null|undefined} fb
 * @returns {number|null}
 */
export function computeSessionFeedbackWeightedScore10(fb) {
  if (!isSessionFeedbackFilled(fb)) return null;
  const norm = (v) => {
    const n = Number(v);
    return n > 0 && n <= 10 ? n / 10 : null;
  };
  let sum = 0;
  let wsum = 0;
  const add = (v, w) => {
    const x = norm(v);
    if (x == null) return;
    sum += x * w;
    wsum += w;
  };
  add(fb.ressenti, 2.2);
  add(fb.difficulte, 1.8);
  add(fb.motivation, 1.4);
  add(fb.energieDebut, 0.7);
  add(fb.energieFin, 0.7);
  add(fb.sommeil, 0.45);
  add(fb.hydratation, 0.35);
  add(fb.nutrition, 0.35);
  if (Number(fb.douleur) > 0) {
    const pain = Math.min(10, Math.max(0, Number(fb.douleur))) / 10;
    sum += (1 - pain) * 0.9;
    wsum += 0.9;
  }
  if (fb.objectifAtteint === true) {
    sum += 0.12;
    wsum += 0.12;
  } else if (fb.objectifAtteint === false) {
    sum += 0.03;
    wsum += 0.12;
  }
  if (wsum <= 0) return null;
  return Math.round((sum / wsum) * 100) / 10;
}
