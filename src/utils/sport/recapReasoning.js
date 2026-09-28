/**
 * Couche commune : une question produit un constat, pas un paragraphe.
 * Absent, zéro, inconnu et non comparable restent des états distincts.
 */

export const DATA_STATE = {
  MEASURED: 'measured',
  MEASURED_ZERO: 'measured_zero',
  NOT_RECORDED: 'not_recorded',
  UNKNOWN: 'unknown',
  INSUFFICIENT: 'insufficient',
  NOT_COMPARABLE: 'not_comparable'
};

export function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

/**
 * Même pourcentage, force différente selon la base, l'écart absolu et l'effectif.
 */
export function contextualMagnitude({ rel = 0, abs = 0, base = 0, n = 0 } = {}) {
  if (n < 2 || base <= 0) {
    return { strength: 0, state: n < 2 ? DATA_STATE.INSUFFICIENT : DATA_STATE.NOT_COMPARABLE };
  }
  const relScore = Math.min(1, Math.abs(rel) / 45);
  const absFloor = Math.max(base * 0.2, n <= 4 ? base * 0.34 : 1);
  const absScore = Math.min(1, Math.abs(abs) / absFloor);
  const sample = Math.min(1, n / 8);
  const strength = relScore * 0.42 + absScore * 0.38 + sample * 0.2;
  return {
    strength,
    state: strength >= 0.42 ? DATA_STATE.MEASURED : DATA_STATE.INSUFFICIENT
  };
}

export function compareIdSets(currentIds, priorIds) {
  const a = currentIds instanceof Set ? currentIds : new Set(currentIds || []);
  const b = priorIds instanceof Set ? priorIds : new Set(priorIds || []);
  if (!a.size || !b.size) {
    return { state: DATA_STATE.UNKNOWN, score: 0.55, shared: 0, caveat: '' };
  }
  let shared = 0;
  a.forEach((id) => {
    if (b.has(id)) shared += 1;
  });
  const union = a.size + b.size - shared;
  const jaccard = union ? shared / union : 0;
  if (jaccard < 0.4) {
    return {
      state: DATA_STATE.NOT_COMPARABLE,
      score: 0.32,
      shared,
      jaccard,
      caveat:
        'La composition des exercices a changé, ce qui limite une comparaison directe du volume.'
    };
  }
  if (jaccard < 0.7) {
    return {
      state: DATA_STATE.MEASURED,
      score: 0.62,
      shared,
      jaccard,
      caveat: 'Une partie des mouvements n’est pas la même d’une fenêtre à l’autre.'
    };
  }
  return { state: DATA_STATE.MEASURED, score: 0.78 + jaccard * 0.22, shared, jaccard, caveat: '' };
}

export function buildCoverage(ctx) {
  const trained = ctx?.dates?.length || 0;
  const span = Math.max(1, ctx?.spanDays || trained || 1);
  let feedbackDays = 0;
  if (ctx?.feedback && trained) {
    ctx.dates.forEach((d) => {
      const row = ctx.feedback[d];
      if (row && typeof row === 'object' && Object.keys(row).length) feedbackDays += 1;
    });
  }
  const hasFeedbackStore = ctx?.feedback && typeof ctx.feedback === 'object';
  let garminDays = 0;
  const metrics = ctx?.garminData?.dailyMetrics;
  if (metrics && ctx?.win?.start) {
    Object.keys(metrics).forEach((d) => {
      if (d >= ctx.win.start && d <= ctx.win.end) garminDays += 1;
    });
  }
  return {
    spanDays: span,
    trainedDays: trained,
    temporal: trained / span,
    feedback: {
      state: !hasFeedbackStore
        ? DATA_STATE.UNKNOWN
        : feedbackDays === 0
          ? DATA_STATE.UNKNOWN
          : feedbackDays / trained >= 0.7
            ? DATA_STATE.MEASURED
            : DATA_STATE.INSUFFICIENT,
      n: feedbackDays,
      nPossible: trained,
      ratio: trained ? feedbackDays / trained : null
    },
    garmin: {
      state: ctx?.garminData ? (garminDays ? DATA_STATE.MEASURED : DATA_STATE.UNKNOWN) : DATA_STATE.UNKNOWN,
      n: garminDays,
      ratio: span ? garminDays / span : null
    }
  };
}

export function seriesStats(values) {
  const nums = (values || []).filter((n) => Number.isFinite(n));
  if (!nums.length) return null;
  const mean = nums.reduce((s, n) => s + n, 0) / nums.length;
  const variance = nums.reduce((s, n) => s + (n - mean) ** 2, 0) / nums.length;
  const sd = Math.sqrt(variance);
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return {
    n: nums.length,
    mean,
    median,
    sd,
    cv: mean > 0 ? sd / mean : null,
    min: sorted[0],
    max: sorted[sorted.length - 1]
  };
}

export function renderReasoning({ observation, comparison, interpretation, limit }) {
  return [observation, comparison, interpretation, limit].filter((part) => part && String(part).trim()).join(' ');
}

/**
 * Ce que cette carte ajoute par rapport aux conclusions déjà affichées.
 * Une décomposition (volume_up:from_frequency) reste nouvelle même si volume_up est déjà dit.
 */
export function informationGain(findings = [], told = new Set()) {
  const keys = findings.filter(Boolean);
  if (!keys.length) return 1;
  return keys.filter((key) => !told.has(key)).length;
}

export function markTold(told, findings = [], subsumes = []) {
  findings.forEach((key) => told.add(key));
  subsumes.forEach((key) => told.add(key));
}

/** Richesse = faits, comparaisons, limites. La longueur n'est qu'un appoint. */
export function readingRichness(text, title = '') {
  const blob = `${title} ${text || ''}`;
  let score = 0;
  if (String(title).trim()) score += 22;
  const nums = blob.match(/\d+(?:[.,]\d+)?/g) || [];
  score += Math.min(28, new Set(nums).size * 5);
  if (/%|contre|avant|depuis|plutôt|alors que|fenêtre/i.test(blob)) score += 16;
  if (/limite|pas directement|ne décrit pas|n'est pas observable|composition|inconnu|pas renseign/i.test(blob)) {
    score += 14;
  }
  if (/cette semaine/i.test(blob)) score -= 18;
  score += Math.min(12, Math.round(String(text || '').length / 80));
  return score;
}
