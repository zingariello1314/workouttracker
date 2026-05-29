/**
 * Charge tendineuse (street : tractions, dips, volume pompes).
 */

const PULL_KEYS = new Set([
  'tractions pronation',
  'tractions australiennes',
  'tractions supination',
  'chin-ups'
]);

const PUSH_HEAVY_KEYS = new Set(['dips', 'pompes déclinées', 'pompes pseudo-planche']);

function exerciseTendonLoad(dbKey, intensity) {
  const k = String(dbKey || '').toLowerCase();
  const heavy = intensity === 'heavy' || intensity === 'lourde';
  if (PULL_KEYS.has(k) || k.includes('traction') || k.includes('pull')) return heavy ? 3 : 2;
  if (k.includes('dip')) return heavy ? 3 : 2;
  if (k.includes('pompe') && (k.includes('déclin') || k.includes('pseudo') || k.includes('planche'))) {
    return heavy ? 2 : 1.5;
  }
  if (k.includes('pompe')) return 1;
  return 0;
}

/**
 * Budget tendineux hebdo (points) selon quiz.
 */
export function computeTendonBudget(answers, recoveryScore = 70) {
  let budget = 14;
  const exp = answers?.experienceLevel;
  if (exp === 'beginner_total' || exp === 'beginner_0_3m') budget = 10;
  else if (exp === 'expert_3y_plus' || exp === 'advanced_1_3y') budget = 18;

  const flex = answers?.flexibilityLevel;
  if (flex === 'very_stiff' || flex === 'below_avg') budget -= 3;

  budget *= recoveryScore / 72;
  return Math.max(6, Math.min(22, Math.round(budget)));
}

/**
 * Estime charge tendon d’une séance à partir des exos planifiés.
 */
export function estimateSessionTendonLoad(exercises) {
  if (!Array.isArray(exercises)) return 0;
  let pullPatterns = 0;
  let load = 0;
  exercises.forEach((ex) => {
    const key = ex.exerciseBankKey || ex.name;
    const t = exerciseTendonLoad(key, ex.intensity);
    if (t >= 2 && (String(key).includes('traction') || String(key).includes('pull'))) {
      pullPatterns += 1;
    }
    load += t;
  });
  if (pullPatterns > 3) load += (pullPatterns - 3) * 1.5;
  return load;
}

export function maxPullPatternsForSession(deformers) {
  return deformers?.maxPullingPatternsPerSession ?? 3;
}
