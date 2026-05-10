/**
 * Ressenti étirements (7 curseurs 1–5 pondérés) → note globale /5 → XP par coche (100–300).
 * Compatibilité : ancien triplet difficulty / enjoyment / recovery sur 1–10 conserve la formule XP linéaire historique.
 */

export const STRETCH_XP_MIN = 100;
export const STRETCH_XP_MAX = 300;
export const STRETCH_XP_FALLBACK = 150;

export const STRETCH_V2_KEYS = [
  'stretchIntensityFeel',
  'holdEase',
  'painfulDiscomfort',
  'relaxationAfter',
  'mobilityAfter',
  'wantRegular',
  'goalFit'
];

/** Pondérations (maquette) — somme = 11 ; appliquées sur les seules réponses > 0 */
const WEIGHTS = {
  stretchIntensityFeel: 1.5,
  holdEase: 1.0,
  painfulDiscomfort: 1.5,
  relaxationAfter: 2.0,
  mobilityAfter: 1.5,
  wantRegular: 1.0,
  goalFit: 1.5
};

const INVERT_FOR_GLOBAL = {
  painfulDiscomfort: true
};

function scale10to5(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.max(1, Math.min(5, Math.round(1 + ((n - 1) * 4) / 9)));
}

/** Brouillon vide (tous à 0 = non renseigné) */
export function emptyStretchPerceivedDraft() {
  return STRETCH_V2_KEYS.reduce((o, k) => {
    o[k] = 0;
    return o;
  }, {});
}

function contributionForGlobal(key, raw1to5) {
  const v = Number(raw1to5);
  if (!Number.isFinite(v) || v <= 0) return null;
  const clamped = Math.max(1, Math.min(5, Math.round(v)));
  if (INVERT_FOR_GLOBAL[key]) return 6 - clamped;
  return clamped;
}

/**
 * Note globale pondérée 1–5 ; null si aucun curseur renseigné.
 */
export function computeStretchWeightedGlobal5(draftOrStored) {
  let sumW = 0;
  let sum = 0;
  STRETCH_V2_KEYS.forEach((key) => {
    const c = contributionForGlobal(key, draftOrStored?.[key]);
    if (c == null) return;
    const w = WEIGHTS[key];
    sumW += w;
    sum += w * c;
  });
  if (sumW <= 0) return null;
  return sum / sumW;
}

/** Moyennes affichées par bloc (valeurs brutes 1–5) */
export function computeStretchCategoryMeans(draft) {
  const avgKeys = (keys) => {
    const vals = keys.map((k) => Number(draft[k]) || 0).filter((n) => n > 0);
    if (!vals.length) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };
  return {
    during: avgKeys(['stretchIntensityFeel', 'holdEase', 'painfulDiscomfort']),
    after: avgKeys(['relaxationAfter', 'mobilityAfter']),
    motivation: avgKeys(['wantRegular', 'goalFit'])
  };
}

/** XP à partir de l’ancien triplet 1–10 (moyenne des critères > 0). */
export function computeStretchXpLegacy10(rating) {
  const exec = Math.max(0, Math.min(10, Number(rating?.difficulty) || 0));
  const enjoy = Math.max(0, Math.min(10, Number(rating?.enjoyment) || 0));
  const rec = Math.max(0, Math.min(10, Number(rating?.recovery) || 0));
  const present = [exec, enjoy, rec].filter((n) => n > 0);
  if (present.length === 0) return STRETCH_XP_FALLBACK;
  const avg = present.reduce((s, n) => s + n, 0) / present.length;
  return Math.round(STRETCH_XP_MIN + (avg - 1) * (200 / 9));
}

/** XP depuis la note pondérée /5 : 1 → 100, 5 → 300 (linéaire). */
export function computeStretchXpFromGlobal5(mean5) {
  const m = Math.max(1, Math.min(5, Number(mean5)));
  return Math.round(STRETCH_XP_MIN + (m - 1) * (200 / 4));
}

/**
 * Point d’entrée unique pour le calcul d’XP (detail, banque, service XP).
 */
export function computeStretchXpFromRating(rating) {
  if (!rating || typeof rating !== 'object') return STRETCH_XP_FALLBACK;

  const global5 = computeStretchWeightedGlobal5(rating);
  const hasV2Answers = global5 != null;

  if (hasV2Answers || Number(rating.schemaVersion) >= 2) {
    if (global5 == null) return STRETCH_XP_FALLBACK;
    return computeStretchXpFromGlobal5(global5);
  }

  const anyLegacy =
    (Number(rating.difficulty) || 0) > 0 ||
    (Number(rating.enjoyment) || 0) > 0 ||
    (Number(rating.recovery) || 0) > 0;
  if (anyLegacy) return computeStretchXpLegacy10(rating);
  return STRETCH_XP_FALLBACK;
}

export function stretchStorageToDraft(stored) {
  const out = emptyStretchPerceivedDraft();
  if (!stored || typeof stored !== 'object') return out;

  const hasV2 = STRETCH_V2_KEYS.some((k) => {
    const x = Number(stored[k]);
    return Number.isFinite(x) && x > 0;
  });

  if (hasV2 || Number(stored.schemaVersion) >= 2) {
    STRETCH_V2_KEYS.forEach((k) => {
      const x = Math.max(0, Math.min(5, Math.round(Number(stored[k]) || 0)));
      out[k] = x;
    });
    return out;
  }

  const d = scale10to5(stored.difficulty);
  const e = scale10to5(stored.enjoyment);
  const r = scale10to5(stored.recovery);
  if (d) {
    out.stretchIntensityFeel = d;
    out.holdEase = Math.max(1, Math.min(5, 6 - d));
  }
  if (r) {
    out.relaxationAfter = r;
    out.mobilityAfter = r;
  }
  if (e) {
    out.wantRegular = e;
    out.goalFit = e;
  }
  return out;
}

export function stretchDraftToStored(draft) {
  const o = { schemaVersion: 2 };
  let any = false;
  STRETCH_V2_KEYS.forEach((k) => {
    const v = Math.max(0, Math.min(5, Math.round(Number(draft[k]) || 0)));
    if (v > 0) any = true;
    o[k] = v;
  });
  return any ? o : null;
}

export function stretchPerceivedDraftDirty(draft, stored) {
  const norm = stretchStorageToDraft(stored || {});
  return STRETCH_V2_KEYS.some((k) => (Number(draft[k]) || 0) !== (Number(norm[k]) || 0));
}

export function getStretchWeightDisplay(key) {
  return WEIGHTS[key] ?? 1;
}

/** True si au moins un critère (ancien ou v2) a été saisi. */
export function stretchRatingHasAnswers(r) {
  if (!r || typeof r !== 'object') return false;
  const v2Any = STRETCH_V2_KEYS.some((k) => {
    const x = Number(r[k]);
    return Number.isFinite(x) && x > 0;
  });
  if (Number(r.schemaVersion) >= 2) return v2Any;
  if (v2Any) return true;
  const a = Number(r.difficulty) || 0;
  const b = Number(r.enjoyment) || 0;
  const c = Number(r.recovery) || 0;
  return a > 0 || b > 0 || c > 0;
}

/** Hash stable pour cache XP (inclut ancien + nouveau schéma). */
export function stretchRatingChecksum(r) {
  if (!r || typeof r !== 'object') return 0;
  let h = (Number(r.schemaVersion) || 0) * 13;
  STRETCH_V2_KEYS.forEach((k, i) => {
    h += (Number(r[k]) || 0) * (i + 3) * 17;
  });
  h +=
    (Number(r.difficulty) || 0) * 11 +
    (Number(r.enjoyment) || 0) * 101 +
    (Number(r.recovery) || 0) * 1009;
  return h | 0;
}
