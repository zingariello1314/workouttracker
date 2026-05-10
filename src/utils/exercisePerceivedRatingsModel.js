/**
 * Ressenti détaillé fiche exercice (8 curseurs 1–5) + note globale « difficulté perçue ».
 * Plus la note est élevée, plus l’exercice est ressenti comme difficile / exigeant.
 *
 * Champs inversés dans le calcul global : plaisir ↑ → difficulté perçue ↓.
 */

export const PERCEIVED_KEYS = [
  'effortGlobal',
  'technicalDifficulty',
  'fatigueAfter',
  'recoveryTime',
  'pleasure',
  'wantAgain',
  'jointDiscomfort',
  'muscleConnection'
];

/** Poids sur l’échelle 1–5 « difficulté » (les plaisirs utilisent 6 - v). Somme = 1. */
const WEIGHTS = {
  effortGlobal: 0.18,
  technicalDifficulty: 0.15,
  fatigueAfter: 0.14,
  recoveryTime: 0.14,
  pleasure: 0.1, // inversion
  wantAgain: 0.1, // inversion
  jointDiscomfort: 0.12,
  muscleConnection: 0.07
};

const INVERT = {
  pleasure: true,
  wantAgain: true
};

export function emptyPerceivedDraft() {
  return {
    effortGlobal: 0,
    technicalDifficulty: 0,
    fatigueAfter: 0,
    recoveryTime: 0,
    pleasure: 0,
    wantAgain: 0,
    jointDiscomfort: 0,
    muscleConnection: 0
  };
}

/** 1–10 (ancien stockage) → 1–5 */
export function scale10to5(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.max(1, Math.min(5, Math.round(1 + ((n - 1) * 4) / 9)));
}

/**
 * Lit l’objet persisté et retourne un brouillon 1–5 (8 clés), en migrant l’ancien triplet si besoin.
 */
export function perceivedStorageToDraft(stored) {
  const out = emptyPerceivedDraft();
  if (!stored || typeof stored !== 'object') return out;

  const hasNew = PERCEIVED_KEYS.some((k) => {
    const x = Number(stored[k]);
    return Number.isFinite(x) && x > 0;
  });

  if (hasNew || Number(stored.schemaVersion) >= 2) {
    PERCEIVED_KEYS.forEach((k) => {
      const x = Math.max(0, Math.min(5, Math.round(Number(stored[k]) || 0)));
      out[k] = x;
    });
    return out;
  }

  const d = scale10to5(stored.difficulty);
  const e = scale10to5(stored.enjoyment);
  const r = scale10to5(stored.recovery);
  if (d) {
    out.effortGlobal = d;
    out.technicalDifficulty = d;
  }
  if (r) {
    out.fatigueAfter = r;
    out.recoveryTime = r;
  }
  if (e) {
    out.pleasure = e;
    out.wantAgain = e;
  }
  return out;
}

function difficultyContribution(key, value1to5) {
  const v = Number(value1to5);
  if (!Number.isFinite(v) || v <= 0) return null;
  const clamped = Math.max(1, Math.min(5, v));
  if (INVERT[key]) return 6 - clamped;
  return clamped;
}

/**
 * Moyenne pondérée 1–5 : uniquement les curseurs renseignés (>0).
 * Rend null si aucun curseur n’est défini.
 */
export function computeGlobalDifficultyPerceived5(draft) {
  let sumW = 0;
  let sum = 0;
  PERCEIVED_KEYS.forEach((key) => {
    const contrib = difficultyContribution(key, draft[key]);
    if (contrib == null) return;
    const w = WEIGHTS[key];
    sumW += w;
    sum += w * contrib;
  });
  if (sumW <= 0) return null;
  return sum / sumW;
}

/** Moyennes affichées par bloc (valeurs brutes utilisateur 1–5, pas inversées). */
export function computeCategoryMeans(draft) {
  const avg2 = (a, b) => {
    const x = Number(draft[a]) || 0;
    const y = Number(draft[b]) || 0;
    const vals = [x, y].filter((n) => n > 0);
    if (vals.length === 0) return null;
    return vals.reduce((s, n) => s + n, 0) / vals.length;
  };
  return {
    intensity: avg2('effortGlobal', 'technicalDifficulty'),
    recovery: avg2('fatigueAfter', 'recoveryTime'),
    motivation: avg2('pleasure', 'wantAgain'),
    bodyFeel: avg2('jointDiscomfort', 'muscleConnection')
  };
}

/** Sérialisation pour IndexedDB / sync. Efface les champs legacy 1–10 si tout est migré. */
export function draftToStoredPayload(draft) {
  const o = { schemaVersion: 2 };
  let any = false;
  PERCEIVED_KEYS.forEach((k) => {
    const v = Math.max(0, Math.min(5, Math.round(Number(draft[k]) || 0)));
    if (v > 0) any = true;
    o[k] = v;
  });
  if (!any) return null;
  return o;
}

export function perceivedDraftDirty(draft, stored) {
  const norm = perceivedStorageToDraft(stored || {});
  return PERCEIVED_KEYS.some((k) => (Number(draft[k]) || 0) !== (Number(norm[k]) || 0));
}
