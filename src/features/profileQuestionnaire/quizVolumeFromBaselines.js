/**
 * Ajuste séries / reps à partir des max déclarés au quiz (pompes, tractions, etc.).
 */

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

function readMax(answers, field) {
  const b = answers?.strengthBaselineMaxes;
  if (!b || typeof b !== 'object') return null;
  const n = Number(b[field]);
  if (!Number.isFinite(n) || n < 1) return null;
  return n;
}

/** Seuils par mouvement : en dessous = débutant, au-dessus = avancé. */
export const BASELINE_THRESHOLDS = {
  pushupsMax: { beginner: 10, advanced: 25 },
  pullupsMax: { beginner: 4, advanced: 12 },
  dipsMax: { beginner: 5, advanced: 18 },
  australianPullupsMax: { beginner: 8, advanced: 20 },
  squatGobletMax: { beginner: 12, advanced: 30 },
  lungesMax: { beginner: 10, advanced: 24 },
  plankSecMax: { beginner: 35, advanced: 90 }
};

/**
 * @returns {'beginner'|'intermediate'|'advanced'|null}
 */
export function classifyBaselineField(field, max) {
  const t = BASELINE_THRESHOLDS[field];
  if (!t || max == null) return null;
  const n = Number(max);
  if (!Number.isFinite(n)) return null;
  if (n <= t.beginner) return 'beginner';
  if (n >= t.advanced) return 'advanced';
  return 'intermediate';
}

const BASELINE_MAP = {
  pompes: { field: 'pushupsMax', unit: 'reps', setsByTier: { beginner: 3, intermediate: 4, advanced: 4 } },
  'tractions pronation': { field: 'pullupsMax', unit: 'reps', setsByTier: { beginner: 3, intermediate: 4, advanced: 5 } },
  'tractions australiennes': { field: 'australianPullupsMax', unit: 'reps', setsByTier: { beginner: 3, intermediate: 3, advanced: 4 } },
  dips: { field: 'dipsMax', unit: 'reps', setsByTier: { beginner: 3, intermediate: 4, advanced: 4 } },
  'squat gobelet': { field: 'squatGobletMax', unit: 'reps', setsByTier: { beginner: 3, intermediate: 3, advanced: 4 } },
  fentes: { field: 'lungesMax', unit: 'reps', setsByTier: { beginner: 3, intermediate: 3, advanced: 4 } },
  gainage: { field: 'plankSecMax', unit: 'sec', setsByTier: { beginner: 3, intermediate: 3, advanced: 3 } },
  'gainage latéral': { field: 'plankSecMax', unit: 'sec', setsByTier: { beginner: 2, intermediate: 3, advanced: 3 } },
  'rowing haltère': { field: 'australianPullupsMax', unit: 'reps', setsByTier: { beginner: 3, intermediate: 3, advanced: 4 } },
  'développé militaire': { field: 'pushupsMax', unit: 'reps', setsByTier: { beginner: 3, intermediate: 3, advanced: 4 } }
};

function workPctForTier(tier) {
  if (tier === 'beginner') return 0.45;
  if (tier === 'advanced') return 0.62;
  return 0.55;
}

function repsForTier(max, tier, unit) {
  if (unit === 'sec') {
    const work = clamp(max * workPctForTier(tier), 20, tier === 'advanced' ? 100 : 75);
    return work;
  }
  const lo = tier === 'beginner' ? 4 : 5;
  const hi = tier === 'advanced' ? 20 : 15;
  return clamp(max * workPctForTier(tier), lo, hi);
}

/**
 * @param {string} dbKey
 * @param {object} answers
 * @param {string} defaultSeries
 */
export function applyBaselineToSeries(dbKey, answers, defaultSeries) {
  const rule = BASELINE_MAP[dbKey];
  if (!rule) return defaultSeries;
  const max = readMax(answers, rule.field);
  if (max == null) return defaultSeries;

  const tier = classifyBaselineField(rule.field, max) || 'intermediate';
  const sets = rule.setsByTier[tier] || 3;

  if (rule.unit === 'sec') {
    const work = repsForTier(max, tier, 'sec');
    return `${sets}×${work} sec`;
  }

  const reps = repsForTier(max, tier, 'reps');
  return `${sets}×${reps}`;
}

export function hasStrengthBaselines(answers) {
  const b = answers?.strengthBaselineMaxes;
  if (!b || typeof b !== 'object') return false;
  return Object.values(BASELINE_MAP).some((rule) => readMax(answers, rule.field) != null);
}

/** Niveau global dérivé des repères renseignés. */
export function overallStrengthTier(answers) {
  const b = answers?.strengthBaselineMaxes;
  if (!b) return 'intermediate';
  const tiers = [];
  Object.keys(BASELINE_THRESHOLDS).forEach((field) => {
    const t = classifyBaselineField(field, b[field]);
    if (t) tiers.push(t);
  });
  if (!tiers.length) return 'intermediate';
  if (tiers.filter((t) => t === 'beginner').length >= tiers.length / 2) return 'beginner';
  if (tiers.filter((t) => t === 'advanced').length >= Math.ceil(tiers.length / 3)) return 'advanced';
  return 'intermediate';
}

const TIER_RANK = { beginner: 0, intermediate: 1, advanced: 2 };

/**
 * Niveau effectif pour prescription : repères observables ≥ expérience déclarée seule.
 */
export function effectiveStrengthTier(answers) {
  const fromBaselines = overallStrengthTier(answers);
  if (!hasStrengthBaselines(answers)) return fromBaselines;

  const exp = answers?.experienceLevel;
  let fromExp = 'intermediate';
  if (exp === 'beginner_total' || exp === 'beginner_0_3m') fromExp = 'beginner';
  else if (exp === 'advanced_1_3y' || exp === 'expert_3y_plus') fromExp = 'advanced';

  return TIER_RANK[fromBaselines] >= TIER_RANK[fromExp] ? fromBaselines : fromExp;
}
