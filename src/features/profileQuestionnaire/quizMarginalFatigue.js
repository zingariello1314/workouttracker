/**
 * Charge nerveuse avec rendements décroissants, tolérance individuelle et synergies.
 * Remplace la somme linéaire (fractionné=+4, plyo=+3…) par un modèle marginal.
 */

import { computeRecoveryCapacity } from './quizRecoveryEngine';

function clamp(min, max, v) {
  return Math.max(min, Math.min(max, v));
}

/**
 * Tolérance hebdo (points « budget » avant saturation forte).
 */
export function computeNervousTolerance(recoveryScore, deformers, evidence = null) {
  let tol = computeRecoveryCapacity(recoveryScore, deformers);
  const exp = evidence?.maturity;
  if (exp === 'rich' && (evidence.regularityScore || 0) > 0.8) tol += 1.2;
  if (exp === 'rich' && (evidence.activeDays28 || 0) >= 10) tol += 0.5;
  const e = evidence?.referencedProgramAnalysis;
  if (e?.adherence?.adherencePct >= 70 && (e.programAgeDays || 0) >= 14) tol += 0.4;
  if (deformers?.volumeMul > 1.05) tol += 0.3;
  if (deformers?.volumeResponseIndex > 1.06) tol += 0.4;
  if (evidence?.restGap14 >= 9) tol -= 1.5;
  if (evidence?.maturity === 'sparse') tol -= 0.3;
  return clamp(5, 16, Math.round(tol * 10) / 10);
}

/**
 * Points de stress bruts par jour (avant marginalité).
 */
export function stressPointsForDay(profile, answers, deformers, dayContext = {}) {
  if (!profile) return [];
  const pts = [];
  const cardioDesire = answers?.cardioTrainingDesire || 'moderate';
  const typePrefs = Array.isArray(answers?.exerciseTypePreferences)
    ? answers.exerciseTypePreferences
    : [];
  const hiit = cardioDesire === 'priority_hiit';

  if (profile.modality === 'cardio') {
    const hiitCardio = hiit || profile.allowCourseEndurance;
    pts.push({ type: hiitCardio ? 'fractionné' : 'cardio_steady', raw: hiitCardio ? 3.8 : 2 });
    return pts;
  }

  const street = profile.siteFamily === 'street';
  const heavyStrength = street || profile.groups?.includes('lower');
  pts.push({
    type: heavyStrength ? 'strength_heavy' : 'strength_moderate',
    raw: heavyStrength ? 2.8 : 2.1
  });

  if (profile.cardioAddon) {
    pts.push({ type: hiit ? 'fractionné' : 'cardio_steady', raw: hiit ? 2.4 : 1.4 });
  }

  if (deformers?.allowPlyo !== false && typePrefs.includes('plyometrics')) {
    const plyoChance = street ? 0.85 : 0.55;
    if (plyoChance >= 0.5) pts.push({ type: 'plyo', raw: 2.6 * plyoChance });
  }

  if (deformers?.allowFractionné !== false && hiit && profile.modality === 'strength_plus_cardio') {
    pts.push({ type: 'fractionné', raw: 1.8 });
  }

  if (dayContext.prevWasLegsHeavy && profile.groups?.includes('lower')) {
    pts.push({ type: 'synergy_penalty', raw: -0.6 });
  }

  return pts;
}

const TYPE_WEIGHT = {
  fractionné: 1.05,
  plyo: 1,
  strength_heavy: 1,
  strength_moderate: 0.88,
  strength_light: 0.7,
  cardio_steady: 0.75,
  cardio_hiit: 1.05,
  synergy_penalty: 1
};

/**
 * Rendements décroissants : chaque point suivant pèse moins.
 */
export function accumulateMarginalStress(dayStressList, tolerance) {
  const flat = [];
  dayStressList.forEach((dayPts) => {
    dayPts.forEach((p) => {
      if (p.type === 'synergy_penalty') {
        flat.push(p);
        return;
      }
      const w = TYPE_WEIGHT[p.type] ?? 1;
      flat.push({ ...p, weighted: p.raw * w });
    });
  });

  flat.sort((a, b) => (b.weighted || 0) - (a.weighted || 0));

  let cumulative = 0;
  let effective = 0;
  const breakdown = [];

  flat.forEach((p) => {
    const w = p.weighted ?? p.raw ?? 0;
    if (p.type === 'synergy_penalty') {
      effective += w;
      breakdown.push({ type: p.type, marginal: w, effective: w });
      return;
    }
    const marginalFactor = 1 / (1 + 0.38 * Math.pow(cumulative / Math.max(1, tolerance), 1.12));
    const marginal = w * marginalFactor;
    effective += marginal;
    cumulative += w;
    breakdown.push({ type: p.type, raw: w, marginal: Math.round(marginal * 100) / 100, factor: marginalFactor });
  });

  return {
    effectiveLoad: Math.round(effective * 10) / 10,
    rawLoad: Math.round(cumulative * 10) / 10,
    breakdown
  };
}

/** Synergie : plyo + force bas volume le même jour → réduction combinée. */
export function applySynergyDiscounts(dayPts) {
  if (!dayPts.length) return dayPts;
  const hasPlyo = dayPts.some((p) => p.type === 'plyo');
  const hasLightForce = dayPts.some(
    (p) => p.type === 'strength_moderate' || p.type === 'strength_light'
  );
  const hasFractionné = dayPts.some((p) => p.type === 'fractionné');
  if (hasPlyo && hasLightForce && !hasFractionné) {
    return dayPts.map((p) =>
      p.type === 'plyo' ? { ...p, raw: p.raw * 0.82 } : p.type === 'strength_moderate' ? { ...p, raw: p.raw * 0.9 } : p
    );
  }
  if (hasFractionné && hasLightForce) {
    return dayPts.map((p) => (p.type === 'fractionné' ? { ...p, raw: p.raw * 0.88 } : p));
  }
  return dayPts;
}

/**
 * @param {Record<string, object>} weekProfiles
 * @param {string[]} activeDayKeys
 * @param {object} answers
 * @param {object} deformers
 * @param {number} recoveryScore
 * @param {object|null} [trainingEvidence]
 */
export function analyzeWeeklyLoadMarginal(
  weekProfiles,
  activeDayKeys,
  answers,
  deformers,
  recoveryScore,
  trainingEvidence = null
) {
  const tolerance = computeNervousTolerance(recoveryScore, deformers, trainingEvidence);
  const recoveryCapacity = tolerance;

  const dayStressList = [];
  let fractionnéDays = 0;
  let cardioDedicated = 0;
  let addonDays = 0;

  activeDayKeys.forEach((dayKey, idx) => {
    const p = weekProfiles[dayKey];
    if (!p) return;
    if (p.modality === 'cardio') cardioDedicated += 1;
    if (p.cardioAddon) addonDays += 1;

    const prevKey = idx > 0 ? activeDayKeys[idx - 1] : null;
    const prev = prevKey ? weekProfiles[prevKey] : null;
    const prevWasLegsHeavy =
      prev?.groups?.includes('lower') && prev?.modality !== 'cardio';

    let pts = stressPointsForDay(p, answers, deformers, { prevWasLegsHeavy });
    pts = applySynergyDiscounts(pts);
    if (pts.some((x) => x.type === 'fractionné')) fractionnéDays += 1;
    dayStressList.push(pts);
  });

  const { effectiveLoad, rawLoad, breakdown } = accumulateMarginalStress(dayStressList, tolerance);
  const overloaded = effectiveLoad > recoveryCapacity;
  const loadRatio = recoveryCapacity > 0 ? effectiveLoad / recoveryCapacity : 1;

  const cuts = {
    suppressPlyo: Boolean(deformers?.allowPlyo === false),
    suppressFractionné: Boolean(deformers?.allowFractionné === false),
    suppressDrills: false,
    reduceCircuitDays: false,
    reduceCardioDedicated: false,
    reduceAddons: false,
    reduceMaxExercises: false
  };

  if (overloaded) {
    cuts.suppressPlyo = true;
    cuts.suppressFractionné = true;
    cuts.reduceAddons = true;
    cuts.reduceCircuitDays = true;
    if (cardioDedicated > 2) cuts.reduceCardioDedicated = true;
  }
  if (effectiveLoad > recoveryCapacity + 1.8) {
    cuts.reduceMaxExercises = true;
    cuts.suppressDrills = true;
  }

  if (deformers?.maxNervousStressDaysPerWeek != null) {
    const heavyDays =
      cardioDedicated +
      addonDays +
      activeDayKeys.filter((k) => weekProfiles[k]?.siteFamily === 'street').length;
    if (heavyDays > deformers.maxNervousStressDaysPerWeek + cardioDedicated) {
      cuts.reduceAddons = true;
    }
  }

  const loadAnalysis = {
    nervousLoad: effectiveLoad,
    rawNervousLoad: rawLoad,
    recoveryCapacity,
    nervousTolerance: tolerance,
    marginalModel: true,
    loadRatio: Math.round(loadRatio * 100) / 100,
    tendonBudget: null,
    fractionnéDays,
    cardioDedicated,
    addonDays,
    cuts,
    overloaded,
    stressBreakdown: breakdown.slice(0, 12)
  };

  return loadAnalysis;
}

export { computeRecoveryCapacity };
