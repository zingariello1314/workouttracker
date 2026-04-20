/**
 * Modèle visuel multi-paramètres pour le calendrier (teinte des cases).
 *
 * Les coefficients sont des HEURISTIQUES pour comparer des journées entre elles
 * (cohérence relative), pas des équivalences physiologiques exactes.
 *
 * Échelle indicative « unités de charge visuelle » (UCV) — repère mental :
 * - 1 rep street type curl / tirage avec coefficient d’intensité ≈ 1 → ~1 UCV
 *   (les étoiles / coefficients par exo multiplient déjà strengthLoad).
 * - ~24 kcal actives « utiles » (au-delà d’un fond bas) → ~1 UCV (ordre de grandeur MET léger→modéré).
 * - ~1800 pas marginaux au-dessus de ta base habituelle → ~1 UCV (plafonné dans le blend).
 * - ~1 min de fractionné intense (FC élevée / allure rapide) compte déjà plus lourd
 *   via enduranceLoadForDate (allure, type) qu’1 min de fondamental très facile.
 */

export const CALENDAR_VISUAL_CONSTANTS = {
  /** Kcal actives : ordre de grandeur pour ~1 UCV dans la part « métabolique » */
  KCAL_PER_VISUAL_UNIT: 24,
  /** Pas marginaux : ordre de grandeur pour ~1 UCV (hors palier habituel) */
  STEPS_PER_VISUAL_UNIT: 1800,
  /** Minutes intensité Garmin (total) pour saturer la part cardio quotidien (plus haut = moins de saturation sur des journées « marche »). */
  INTENSITY_MIN_FULL: 96,
  /** Poids des minutes « modérées » vs « soutenues » quand Garmin fournit la répartition (soutenu = 1). */
  INTENSITY_MODERATE_WEIGHT: 0.38,
  INTENSITY_MODERATE_WEIGHT_WALK_DAY: 0.12,
  /** Charge street + endurance (déjà pondérée) pour saturer la part « charge » */
  LOAD_UNITS_FULL: 720,
  /** Reps brutes (indicateur secondaire si charge pas disponible) */
  RAW_REPS_FULL: 420
};

/**
 * Indique si la case a un signal visuel (Garmin, pas, charge, etc.) :
 * sert à ne pas ouvrir le panneau « justifier / saisir » quand la case est déjà teintée.
 */
export function calendarDayHasPaintSignal(intensity) {
  if (!intensity || typeof intensity !== 'object') return false;
  if (intensity.justification) return true;
  if ((intensity.level ?? 0) > 0) return true;
  if ((intensity.completedCount ?? 0) > 0) return true;
  if ((intensity.trainingLoad ?? 0) > 0.75) return true;
  if ((intensity.reps ?? 0) > 0) return true;
  if ((intensity.activeKcal ?? 0) > 26) return true;
  if ((intensity.steps ?? 0) > 650) return true;
  if ((intensity.intensityMinutesTotal ?? 0) > 0) return true;
  if ((intensity.garminIcons?.length ?? 0) > 0) return true;
  const vc = intensity.visualContext;
  if (vc && typeof vc.composite01 === 'number' && vc.composite01 > 0.0035) return true;
  return false;
}

/**
 * @param {object} p
 * @param {number} [p.level] 0–4 après Garmin + feedback
 * @param {number} [p.activeKcal]
 * @param {number} [p.kcalRefMedian]
 * @param {number} [p.steps]
 * @param {number} [p.stepsRefMedian]
 * @param {number} [p.intensityMinutesTotal] Garmin : total affiché (objectif hebdo / somme)
 * @param {number} [p.intensityMinutesModerate] Si présent avec vigorous : minutes modérées Garmin
 * @param {number} [p.intensityMinutesVigorous] Si présent avec moderate : minutes soutenues Garmin
 * @param {boolean} [p.walkHeavy]
 * @param {boolean} [p.walkOnlyDay]
 * @param {number|null} [p.feedbackDiff] 1–5 session ressentie
 * @param {number} [p.strengthLoad]
 * @param {number} [p.enduranceLoad]
 * @param {number} [p.totalReps]
 */
export function computeCalendarDayVisualContext(p) {
  const level = Number(p.level) || 0;
  const activeKcal = Math.max(0, Number(p.activeKcal) || 0);
  const kcalRefMedian = Math.max(0, Number(p.kcalRefMedian) || 0);
  const steps = Math.max(0, Number(p.steps) || 0);
  const stepsRefMedian = Math.max(0, Number(p.stepsRefMedian) || 0);
  const intensityMinutesTotal = Math.max(0, Number(p.intensityMinutesTotal) || 0);
  const hasIntensitySplit =
    p.intensityMinutesModerate !== undefined && p.intensityMinutesVigorous !== undefined;
  const intensityModerateIn = hasIntensitySplit ? Math.max(0, Number(p.intensityMinutesModerate) || 0) : 0;
  const intensityVigorousIn = hasIntensitySplit ? Math.max(0, Number(p.intensityMinutesVigorous) || 0) : 0;
  const walkHeavy = !!p.walkHeavy;
  const walkOnlyDay = !!p.walkOnlyDay;
  const feedbackDiff =
    p.feedbackDiff != null && Number.isFinite(Number(p.feedbackDiff))
      ? Math.max(1, Math.min(5, Math.round(Number(p.feedbackDiff))))
      : null;
  const strengthLoad = Math.max(0, Number(p.strengthLoad) || 0);
  const enduranceLoad = Math.max(0, Number(p.enduranceLoad) || 0);
  const totalReps = Math.max(0, Number(p.totalReps) || 0);

  const levelNorm = Math.max(0, Math.min(1, level / 4));

  let kcalNorm = 0;
  if (kcalRefMedian > 55 && activeKcal > 40) {
    const kn = Math.min(1.45, activeKcal / kcalRefMedian);
    kcalNorm = kn / 1.45;
  } else if (activeKcal > 120) {
    kcalNorm = Math.min(1, (activeKcal - 100) / 420);
  }

  let stepsNorm = 0;
  if (steps > 0 && stepsRefMedian > 2000) {
    const floor = stepsRefMedian * 0.72;
    const marginal = Math.max(0, steps - floor);
    stepsNorm = Math.min(1, marginal / (stepsRefMedian * 0.9 + 800));
  } else if (steps > 0 && stepsRefMedian > 800) {
    const floor = stepsRefMedian * 0.58;
    const marginal = Math.max(0, steps - floor);
    stepsNorm = Math.min(1, marginal / (stepsRefMedian * 1.05 + 500));
  } else if (steps > 12500) {
    stepsNorm = Math.min(1, (steps - 9000) / 16000);
  } else if (steps > 650) {
    stepsNorm = Math.min(0.22, (steps - 500) / 12000);
  } else if (steps > 220) {
    stepsNorm = Math.min(0.07, (steps - 180) / 6000);
  }

  const intMinDenom = Math.max(1, CALENDAR_VISUAL_CONSTANTS.INTENSITY_MIN_FULL);
  let intensityMinutesEffective;
  let intMinNorm;
  if (hasIntensitySplit) {
    const modW = walkHeavy || walkOnlyDay
      ? CALENDAR_VISUAL_CONSTANTS.INTENSITY_MODERATE_WEIGHT_WALK_DAY
      : CALENDAR_VISUAL_CONSTANTS.INTENSITY_MODERATE_WEIGHT;
    /* Soutenu = plein poids ; modéré = fraction (marche = surtout modéré). */
    intensityMinutesEffective = intensityVigorousIn * 1 + intensityModerateIn * modW;
    intMinNorm = Math.min(1, intensityMinutesEffective / intMinDenom);
  } else {
    intensityMinutesEffective = intensityMinutesTotal;
    intMinNorm = Math.min(1, intensityMinutesTotal / intMinDenom);
    /* Sans répartition modéré/soutenu : atténuer si journée très marche (minutes totales gonflées). */
    if (walkHeavy || walkOnlyDay) {
      intMinNorm *= 0.38;
    }
  }

  const load = strengthLoad + enduranceLoad;
  const loadNorm = Math.min(1, load / Math.max(1, CALENDAR_VISUAL_CONSTANTS.LOAD_UNITS_FULL));

  const repHintNorm = Math.min(1, totalReps / Math.max(1, CALENDAR_VISUAL_CONSTANTS.RAW_REPS_FULL));

  const walkDampen = walkHeavy || walkOnlyDay ? 0.24 : 0;

  let feedbackShift = 0;
  if (feedbackDiff != null) {
    feedbackShift = (feedbackDiff - 3) * 0.035;
  }

  /* Street + charge volontaire mieux récompensés ; pas / kcal passifs atténués */
  /* Le niveau 0–4 est déjà piloté par la charge : moins de poids ici évite un double « coup de massue » sur l’indice visuel. */
  const w = {
    level: 0.32,
    kcal: 0.17,
    steps: 0.07,
    intensityMin: 0.08,
    load: 0.27,
    repsHint: 0.09
  };

  const contrib = {
    level: w.level * levelNorm,
    kcal: w.kcal * kcalNorm,
    steps: w.steps * stepsNorm,
    intensityMin: w.intensityMin * intMinNorm,
    load: w.load * loadNorm,
    repsHint: w.repsHint * repHintNorm
  };

  const preBlend = contrib.level + contrib.kcal + contrib.steps + contrib.intensityMin + contrib.load + contrib.repsHint;
  let compositeRaw = preBlend * (1 - walkDampen) + feedbackShift;
  /* Bonus charge : atténué (avant × jusqu’à ~1,42) pour ne pas gonfler l’indice quand load + niveau décrivent déjà la même séance. */
  if (strengthLoad > 0) {
    compositeRaw *= 1 + Math.min(0.2, strengthLoad / 520);
  } else if (enduranceLoad > 0) {
    compositeRaw *= 1 + Math.min(0.14, enduranceLoad / 880);
  }
  /** Même journée : street (charge) + endurance saisie → bonus modéré (récompense la variété). */
  const synergyStreetEndurance =
    strengthLoad >= 14 && enduranceLoad >= 10 ? 1.085 : strengthLoad >= 8 && enduranceLoad >= 6 ? 1.045 : 1;
  compositeRaw *= synergyStreetEndurance;
  const composite01 = Math.max(0, Math.min(1, compositeRaw));

  const denom = preBlend > 1e-6 ? preBlend : 1;
  const breakdownShares = {
    level: contrib.level / denom,
    kcal: contrib.kcal / denom,
    steps: contrib.steps / denom,
    intensityMin: contrib.intensityMin / denom,
    load: contrib.load / denom,
    repsHint: contrib.repsHint / denom
  };

  const approxRepEquivFromKcal =
    activeKcal > 60 ? Math.round((activeKcal - 50) / CALENDAR_VISUAL_CONSTANTS.KCAL_PER_VISUAL_UNIT) : 0;
  const approxRepEquivFromSteps =
    stepsNorm > 0 && stepsRefMedian > 2000
      ? Math.round(
          (Math.max(0, steps - stepsRefMedian * 0.72) / CALENDAR_VISUAL_CONSTANTS.STEPS_PER_VISUAL_UNIT) * 10
        ) / 10
      : steps > 10000
        ? Math.round(((steps - 8000) / CALENDAR_VISUAL_CONSTANTS.STEPS_PER_VISUAL_UNIT) * 10) / 10
        : 0;

  return {
    composite01,
    visualScore100: Math.round(composite01 * 100),
    levelNorm,
    kcalNorm,
    stepsNorm,
    intMinNorm,
    intensityMinutesEffective,
    intensityMinutesGarminSplit: hasIntensitySplit,
    intensityMinutesModerateUsed: hasIntensitySplit ? intensityModerateIn : null,
    intensityMinutesVigorousUsed: hasIntensitySplit ? intensityVigorousIn : null,
    loadNorm,
    repHintNorm,
    walkDampen,
    walkHeavy,
    walkOnlyDay,
    feedbackShift,
    feedbackDiff,
    strengthLoad,
    enduranceLoad,
    loadTotal: load,
    breakdownShares,
    /** Unités « brutes » avant normalisation en parts (affichage détail jour). */
    contribAbsolute: { ...contrib },
    synergyStreetEndurance,
    approxRepEquivFromKcal,
    approxRepEquivFromSteps,
    weights: w
  };
}
