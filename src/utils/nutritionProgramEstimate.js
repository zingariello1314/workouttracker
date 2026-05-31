/**
 * Estimation TDEE / objectifs macros à partir du profil utilisateur
 * (impédancemètre facultatif — pourcentage de graisse si disponible)
 */

import { mifflinStJeorBmr, normalizeSexForBmr } from './metabolicBmr';

/** @typedef {{ heightCm?: number, weightKg?: number, age?: number, sex?: 'male'|'female'|'other', bodyFatPercent?: number|null, activityFactor?: number, goal?: string, weeklyWeightDeltaKg?: number }} ProfileInput */

/** Dernières mesures impédance utiles pour pré-remplir le profil */
export function extractProfileFromProgressEntries(progressEntries = []) {
  if (!Array.isArray(progressEntries) || progressEntries.length === 0) {
    return null;
  }

  const impedance = [...progressEntries]
    .filter((e) => e && e.type === 'impedance' && e.date)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));

  const latest = impedance[0];
  if (!latest) return null;

  const ageFromImpedance =
    latest.chronologicalAge != null ? Number(latest.chronologicalAge) : null;

  return {
    weightKg: latest.weight != null ? Number(latest.weight) : null,
    heightCm: latest.heightCm != null ? Number(latest.heightCm) : null,
    /** Âge réel saisi à l’impédance (programme nutrition → champ âge) */
    age: ageFromImpedance != null && !Number.isNaN(ageFromImpedance) ? Math.round(ageFromImpedance) : null,
    chronologicalAge: ageFromImpedance,
    bodyFatPercent:
      latest.bodyFatPercentage != null ? Number(latest.bodyFatPercentage) : null,
    muscleMassKg: latest.muscleMass != null ? Number(latest.muscleMass) : null,
    waterPercent: latest.bodyWater != null ? Number(latest.bodyWater) : null,
    visceralFat: latest.visceralFatIndex != null ? Number(latest.visceralFatIndex) : null,
    basalMetabolism: latest.basalMetabolism != null ? Number(latest.basalMetabolism) : null,
    date: latest.date,
  };
}

/**
 * Recalcule un programme généré si une nouvelle mesure impédance
 * s'écarte sensiblement du poids de référence.
 */
export function adaptProgramFromLatestImpedance(program, progressEntries = [], options = {}) {
  if (!program || program.creationMode !== 'generated') return null;
  const profile = extractProfileFromProgressEntries(progressEntries);
  if (!profile || profile.weightKg == null) return null;

  const thresholdKg = Number(options.thresholdKg) > 0 ? Number(options.thresholdKg) : 0.7;
  const pp = program.planProfile || {};
  const baseline = Number(pp.baselineWeightKg);
  if (!Number.isFinite(baseline)) return null;

  const latestWeight = Number(profile.weightKg);
  if (!Number.isFinite(latestWeight)) return null;
  const delta = latestWeight - baseline;
  if (Math.abs(delta) < thresholdKg) return null;

  const est = estimateProgramTargets({
    baselineWeightKg: latestWeight,
    heightCm: Number(pp.heightCm) || undefined,
    age: Number(pp.age) || undefined,
    sex: pp.sex || 'other',
    bodyFatPercent:
      profile.bodyFatPercent != null
        ? profile.bodyFatPercent
        : (pp.bodyFatPercent != null && pp.bodyFatPercent !== '' ? Number(pp.bodyFatPercent) : null),
    activityFactor: Number(pp.activityFactor) || 1.55,
    goal: program.goal,
    weeklyWeightDeltaKg:
      pp.targetWeightDeltaKg != null && pp.targetWeightDeltaKg !== ''
        ? Number(pp.targetWeightDeltaKg)
        : undefined
  });

  return {
    ...program,
    targetCalories: est.targetCalories,
    targetProtein: est.targetProtein,
    targetCarbs: est.targetCarbs,
    targetFat: est.targetFat,
    targetProteinPercent: Math.round(((est.targetProtein * 4) / Math.max(1, est.targetCalories)) * 100),
    targetCarbsPercent: Math.round(((est.targetCarbs * 4) / Math.max(1, est.targetCalories)) * 100),
    targetFatPercent: Math.round(((est.targetFat * 9) / Math.max(1, est.targetCalories)) * 100),
    planProfile: {
      ...pp,
      baselineWeightKg: latestWeight,
      impedanceSourceDate: profile.date || pp.impedanceSourceDate || null,
      estimatedBmr: est.bmr,
      estimatedTdee: est.tdee,
      estimateNote: `${est.note} Ajustement auto via impédance (Δ ${delta > 0 ? '+' : ''}${delta.toFixed(2)} kg).`,
      lastAdaptiveAt: new Date().toISOString()
    }
  };
}

function mifflinBmr({ weightKg, heightCm, age, sex }) {
  return mifflinStJeorBmr({
    weightKg,
    heightCm,
    ageYears: age,
    sex: normalizeSexForBmr(sex)
  });
}

function katchBmr(weightKg, bodyFatPercent) {
  const w = Number(weightKg);
  const bf = Number(bodyFatPercent);
  if (!w || bf == null || Number.isNaN(bf) || bf >= 100 || bf < 3) return null;
  const lbm = w * (1 - bf / 100);
  return 370 + 21.6 * lbm;
}

const DEFAULT_ACTIVITY = 1.55;

/**
 * @param {ProfileInput & { baselineWeightKg?: number }} input
 * @returns {{ tdee: number, bmr: number, targetCalories: number, targetProtein: number, targetCarbs: number, targetFat: number, note: string }}
 */
export function estimateProgramTargets(input = {}) {
  const weightKg = Number(input.baselineWeightKg ?? input.weightKg) || 70;
  const heightCm = Number(input.heightCm) || 175;
  const age = Number(input.age) || 30;
  const sex = input.sex === 'female' ? 'female' : input.sex === 'male' ? 'male' : 'other';
  const bf = input.bodyFatPercent != null && input.bodyFatPercent !== ''
    ? Number(input.bodyFatPercent)
    : null;

  const activity = Number(input.activityFactor) > 0 ? Number(input.activityFactor) : DEFAULT_ACTIVITY;

  let bmr = katchBmr(weightKg, bf);
  if (bmr == null) {
    bmr = mifflinBmr({ weightKg, heightCm, age, sex });
  }
  if (bmr == null) bmr = 1700;

  const tdee = Math.round(bmr * activity);

  const rawGoal = String(input.goal || 'maintenance');
  const goal =
    rawGoal === 'stagnation' || rawGoal === 'stabilization' || rawGoal === 'maintain'
      ? 'maintenance'
      : rawGoal;
  const weeklyDelta = Number(input.weeklyWeightDeltaKg ?? input.targetWeightDeltaKg);
  let calAdjust = 0;
  if (Number.isFinite(weeklyDelta) && weeklyDelta !== 0) {
    calAdjust = Math.round((weeklyDelta * 7700) / 7);
  } else {
    if (goal === 'cutting' || goal === 'cut') calAdjust = -400;
    else if (goal === 'bulking' || goal === 'bulk') calAdjust = 350;
    // Masse sèche : surplus modéré pour limiter le gras tout en suivant la courbe dans Suivi corporel
    else if (goal === 'lean_bulk') calAdjust = 200;
    else if (goal === 'recomp') calAdjust = -150;
    else calAdjust = 0;
  }

  const targetCalories = Math.min(10000, Math.max(1200, tdee + calAdjust));

  // Protéines : priorité masse maigre / objectif
  let proteinGPerKg = 1.6;
  if (goal === 'cutting' || goal === 'cut' || goal === 'recomp') proteinGPerKg = 2;
  if (goal === 'lean_bulk') proteinGPerKg = 2.05;
  if (goal === 'bulking' || goal === 'bulk') proteinGPerKg = 1.8;
  if (goal === 'maintenance') proteinGPerKg = 1.65;

  const targetProtein = Math.round(Math.min(220, Math.max(60, weightKg * proteinGPerKg)) * 10) / 10;
  const proteinKcal = targetProtein * 4;

  let fatRatio = 0.28;
  if (goal === 'cutting' || goal === 'cut') fatRatio = 0.3;
  if (goal === 'bulking' || goal === 'bulk') fatRatio = 0.26;
  if (goal === 'lean_bulk') fatRatio = 0.27;

  const fatKcal = targetCalories * fatRatio;
  const targetFat = Math.round((fatKcal / 9) * 10) / 10;

  const remaining = Math.max(0, targetCalories - proteinKcal - fatKcal);
  const targetCarbs = Math.round((remaining / 4) * 10) / 10;

  let note =
    bf != null
      ? `Estimation basée sur BMR type Katch–McArdle (masse maigre estimée) × activité ${activity}.`
      : `Estimation type Mifflin–St Jeor × activité ${activity}. Ajoutez le % de graisse (impédancemètre) pour affiner.`;
  if (goal === 'lean_bulk') {
    note +=
      ' Masse sèche : surplus léger (ordre ~+200 kcal si tu ne fixes pas Δ poids/hebdo) — ajuste selon +0,1 à +0,25 kg/semaine sur ton suivi poids.';
  }
  if (goal === 'maintenance') {
    note +=
      ' Stabilisation : vise environ 0 kg de variation hebdomadaire ; corrige avec le graphique Suivi corporel / impédances.';
  }

  return {
    bmr: Math.round(bmr),
    tdee,
    targetCalories,
    targetProtein,
    targetCarbs,
    targetFat,
    note,
  };
}

/**
 * Nombre conseillé d’aliments de la banque à inclure dans la rotation du programme,
 * selon l’objectif et l’objectif énergétique (ordre de grandeur pour la variance hebdomadaire).
 * @param {string} goal
 * @param {number} targetCalories
 */
export function suggestedBankSelectionQuota(goal = 'maintenance', targetCalories = 2500) {
  const g = String(goal || 'maintenance');
  const kcal = Number(targetCalories);
  const base = Number.isFinite(kcal) ? Math.round(kcal / 85) : 28;
  const adj =
    g === 'cutting' || g === 'cut'
      ? 5
      : g === 'recomp'
        ? 4
        : g === 'lean_bulk'
          ? 2
          : g === 'bulking' || g === 'bulk'
            ? -2
            : 0;
  return Math.min(55, Math.max(12, base + adj));
}
