/**
 * Moteur de suggestions « coach transversal » Récap (pur, testable).
 *
 * ## Taxonomie (couverture large, fallbacks en fin de chaîne)
 * - **Sport seul** : régularité, prévu/réalisé, volume hebdo vs moyenne, exos variés, dernier entraînement lointain.
 * - **Nutrition seule / prioritaire** : journal vide + programme, conformité, variance, 1er jour de saisie avec programme.
 * - **Plan repas coches** : streak / volume de coches sans tout le journal.
 * - **Corps** : delta poids 28j / 7j + objectif quiz (`goalPhysique`) si présent.
 * - **Combiné** sport + nutrition ou sport + pas (Garmin) : formulations descriptives (« en parallèle »), zéro causalité médicale.
 * - **Garmin (phase 2)** : pas/semaine vs moyenne, stress + sommeil quand assez de jours échantillonnés — sinon silence.
 * - **Très peu de données** : `keepLogging` / `startAnyPillar`.
 *
 * Priorités : plus le nombre est grand, plus la carte remonte avant dédoublonnage thématique.
 */

const THEME_KEY = (card) => card.theme || card.id.split('.')[0];

function dedupeByTheme(sortedCards, maxVisible) {
  const seen = new Set();
  const out = [];
  for (const c of sortedCards) {
    const k = THEME_KEY(c);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(c);
    if (out.length >= maxVisible) break;
  }
  return out;
}

/**
 * @param {ReturnType<typeof import('./recapCrossCoachAggregate.js').buildRecapCrossCoachAggregate>} aggregate
 * @param {{ maxCards?: number }} [opts]
 */
export function computeRecapCrossCoachInsights(aggregate, opts = {}) {
  const maxCards = opts.maxCards ?? 6;
  const gaps = [];
  const raw = [];

  const fit = aggregate?.fitness || {};
  const nut = aggregate?.nutrition || {};
  const wt = aggregate?.weekTrend || {};
  const body = aggregate?.body || {};
  const pc = aggregate?.planChecks28 || {};
  const quiz = aggregate?.quiz || {};
  const gm = aggregate?.garmin || {};
  const jr = aggregate?.journey || {};
  const ph = aggregate?.profileHints || {};

  const hasSportSignal =
    Number(fit.activeDays28) > 0 ||
    Number(fit.totalReps28) > 0 ||
    Number(fit.volumeKgRepsSum28) > 0;

  const hasBodySignal =
    body.latestWeightKg != null ||
    body.weightDelta28 != null ||
    body.weightDelta7 != null;
  const nutritionReady = nut.status === 'ready';
  const hasNutritionSignal =
    nutritionReady && (Number(nut.daysWithLoggedMeals28) > 0 || Number(nut.avgComplianceScore) > 0);

  const garminDataReady = gm.status === 'ready' && gm.hasAnyGarminSignal === true;

  const strongSportBaseline =
    Number(fit.activeDays28) >= 8 || Number(fit.totalReps28) > 800 || Number(fit.weightedDays28) >= 5;

  if (quiz.totalCount > 0 && quiz.completedCount < quiz.totalCount) {
    raw.push({
      id: 'quiz.incomplete',
      theme: 'quiz',
      priority: strongSportBaseline ? 34 : 62,
      pillar: 'body',
      templateKey: 'quizIncomplete',
      payload: { done: quiz.completedCount, total: quiz.totalCount }
    });
    if (!strongSportBaseline) gaps.push({ code: 'quiz', severity: 'info' });
  }

  if (
    nutritionReady &&
    Number(nut.programsOwnedCount) > 0 &&
    Number(nut.daysWithLoggedMeals28) === 0
  ) {
    raw.push({
      id: 'nutrition.log_first',
      theme: 'nutrition_log',
      priority: hasSportSignal ? 81 : 78,
      pillar: 'nutrition',
      templateKey: hasSportSignal ? 'logMealsWhenProgramWithTraining' : 'logMealsWhenProgram',
      payload: {}
    });
    gaps.push({ code: 'nutrition_empty', severity: 'warn' });
  }

  if (
    nutritionReady &&
    Number(nut.programsOwnedCount) === 0 &&
    Number(nut.daysWithLoggedMeals28) === 0 &&
    hasSportSignal &&
    Number(fit.activeDays28) >= 5
  ) {
    raw.push({
      id: 'nutrition.correlation_hint',
      theme: 'nutrition_correlation',
      priority: 41,
      pillar: 'nutrition',
      templateKey: 'tryMealsForTrainingContext',
      payload: {}
    });
  }

  if (
    nutritionReady &&
    Number(nut.programsOwnedCount) > 0 &&
    Number(nut.daysWithLoggedMeals28) === 1
  ) {
    raw.push({
      id: 'nutrition.first_day_program',
      theme: 'nutrition_milestone',
      priority: 76,
      pillar: 'nutrition',
      templateKey: 'firstNutritionJournalDay',
      payload: {}
    });
  }

  if (wt.confident && wt.avgPriorWeeksActiveDays != null) {
    const cur = Number(wt.currentActiveDays) || 0;
    const prev = Number(wt.avgPriorWeeksActiveDays) || 0;
    if (cur >= prev + 1.5 && prev >= 0.5) {
      raw.push({
        id: 'week.activity_up',
        theme: 'week_activity',
        priority: 86,
        pillar: 'sport',
        templateKey: 'weekMoreActive',
        payload: { current: cur, priorAvg: Math.round(prev * 10) / 10 }
      });
    } else if (cur + 1.5 <= prev && prev >= 2) {
      raw.push({
        id: 'week.activity_down',
        theme: 'week_activity',
        priority: 52,
        pillar: 'sport',
        templateKey: 'weekLessActive',
        payload: { current: cur, priorAvg: Math.round(prev * 10) / 10 }
      });
    }
  }

  if (wt.confident && wt.avgPriorWeeksLift != null && wt.avgPriorWeeksLift > 0) {
    const cur = Number(wt.currentLiftSum) || 0;
    const prev = Number(wt.avgPriorWeeksLift) || 1;
    const ratio = cur / prev;
    if (ratio >= 1.2) {
      let templateKey = 'weekLiftVolumeModerate';
      if (ratio >= 2.8) templateKey = 'weekLiftVolumeVeryStrong';
      else if (ratio >= 2) templateKey = 'weekLiftVolumeStrong';
      raw.push({
        id: 'week.lift_up',
        theme: 'week_volume',
        priority: 84,
        pillar: 'sport',
        templateKey,
        payload: {}
      });
    }
  }

  if (wt.confident && wt.avgPriorWeeksReps != null && wt.avgPriorWeeksReps >= 100) {
    const cur = Number(wt.currentRepsSum) || 0;
    const prev = Number(wt.avgPriorWeeksReps) || 1;
    const r = cur / prev;
    if (r >= 1.35) {
      raw.push({
        id: 'week.reps_up',
        theme: 'reps_trend',
        priority: 72,
        pillar: 'sport',
        templateKey: 'repsWeekStrongerVsRecentWeeks',
        payload: {}
      });
    } else if (prev >= 160 && r <= 0.72) {
      raw.push({
        id: 'week.reps_soft',
        theme: 'reps_trend',
        priority: 44,
        pillar: 'sport',
        templateKey: 'repsWeekQuieterVsRecentWeeks',
        payload: {}
      });
    }
  }

  if (
    garminDataReady &&
    gm.weekStepsTrendConfident &&
    gm.avgPriorWeeksSteps != null &&
    gm.avgPriorWeeksSteps > 800
  ) {
    const cur = Number(gm.weekStepsCurrent) || 0;
    const prev = Number(gm.avgPriorWeeksSteps) || 1;
    const ratio = cur / prev;
    if (ratio >= 1.15) {
      const templateKey = ratio >= 1.55 ? 'weekStepsUpStrong' : 'weekStepsUpModerate';
      raw.push({
        id: 'garmin.steps_up',
        theme: 'week_steps',
        priority: 82,
        pillar: 'sport',
        templateKey,
        payload: {}
      });
    } else if (ratio <= 0.78 && cur < prev * 0.85 && prev > 4000) {
      raw.push({
        id: 'garmin.steps_down',
        theme: 'week_steps',
        priority: 45,
        pillar: 'sport',
        templateKey: 'weekFewerSteps',
        payload: {}
      });
    }
  }

  if (
    garminDataReady &&
    wt.confident &&
    gm.weekStepsTrendConfident &&
    Number(wt.currentActiveDays) >= (Number(wt.avgPriorWeeksActiveDays) || 0) &&
    Number(gm.weekStepsCurrent) >= (Number(gm.avgPriorWeeksSteps) || 0) * 1.08
  ) {
    raw.push({
      id: 'combo.steps_training',
      theme: 'combo_steps_training',
      priority: 73,
      pillar: 'combined',
      templateKey: 'stepsAndTrainingUp',
      payload: {}
    });
  }

  if (
    garminDataReady &&
    Number(gm.stressSampleDays) >= 5 &&
    Number(gm.sleepSampleDays) >= 5 &&
    gm.avgStress28 != null &&
    gm.avgSleepHours28 != null &&
    gm.avgStress28 >= 52 &&
    gm.avgSleepHours28 <= 6.75
  ) {
    raw.push({
      id: 'garmin.stress_sleep',
      theme: 'garmin_recovery',
      priority: 57,
      pillar: 'body',
      templateKey: 'garminStressSleepLoad',
      payload: {
        stress: Math.round(Number(gm.avgStress28) * 10) / 10,
        sleep: Math.round(Number(gm.avgSleepHours28) * 100) / 100
      }
    });
  }

  if (nutritionReady && wt.confident && hasSportSignal) {
    const curA = Number(wt.currentActiveDays) || 0;
    const prevA = Number(wt.avgPriorWeeksActiveDays) || 0;
    const meanPct = Number(nut.meanPctCaloriesVsTarget);
    if (
      curA >= (prevA || 0) + 0.5 &&
      Number.isFinite(meanPct) &&
      meanPct >= 85 &&
      meanPct <= 115
    ) {
      raw.push({
        id: 'combo.sport_nutrition',
        theme: 'combo_sn',
        priority: 80,
        pillar: 'combined',
        templateKey: 'sportUpNutritionAligned',
        payload: { meanPct: Math.round(meanPct) }
      });
    }
  }

  if (pc.streakDaysWithAnyCheckEndingToday >= 2) {
    raw.push({
      id: 'plan.streak_checks',
      theme: 'plan_adherence',
      priority: 74,
      pillar: 'nutrition',
      templateKey: 'planCheckStreak',
      payload: { days: pc.streakDaysWithAnyCheckEndingToday }
    });
  } else if (pc.checkedLeafTotal >= 5 && pc.daysWithAnyPlanCheck >= 3) {
    raw.push({
      id: 'plan.regular_checks',
      theme: 'plan_adherence',
      priority: 58,
      pillar: 'nutrition',
      templateKey: 'planChecksBuilding',
      payload: { leaves: pc.checkedLeafTotal, days: pc.daysWithAnyPlanCheck }
    });
  }

  const reg = Number(fit.regularityScore);
  if (Number.isFinite(reg) && reg < 0.42 && fit.tenureDays >= 10) {
    raw.push({
      id: 'sport.regularity',
      theme: 'regularity',
      priority: 64,
      pillar: 'sport',
      templateKey: 'regularityLow',
      payload: { pct: Math.round(reg * 100) }
    });
  }

  const sla = fit.sessionLoadAlignment28 || {};
  if (sla.avgScore0to100 != null && sla.avgScore0to100 < 40 && sla.sessionDaysScored >= 4) {
    raw.push({
      id: 'sport.session_align',
      theme: 'session_align',
      priority: 60,
      pillar: 'sport',
      templateKey: 'sessionLoadGap',
      payload: { score: Math.round(sla.avgScore0to100) }
    });
  } else if (sla.avgScore0to100 != null && sla.avgScore0to100 > 85 && sla.sessionDaysScored >= 3) {
    raw.push({
      id: 'sport.session_align_good',
      theme: 'session_align',
      priority: 56,
      pillar: 'sport',
      templateKey: 'sessionLoadGood',
      payload: { score: Math.round(sla.avgScore0to100) }
    });
  }

  if (Number(fit.sessionOverrideDays28) >= 4) {
    raw.push({
      id: 'sport.series_overrides',
      theme: 'series_overrides',
      priority: 49,
      pillar: 'sport',
      templateKey: 'seriesOverridesMany',
      payload: {
        days: Number(fit.sessionOverrideDays28),
        touches: Number(fit.sessionOverrideTouches28) || 0
      }
    });
  }

  if (
    Number(fit.distinctExercisesChecked28) >= 14 &&
    Number(fit.tenureDays) >= 21 &&
    Number(fit.activeDays28) >= 4
  ) {
    raw.push({
      id: 'sport.exercise_variety',
      theme: 'exercise_variety',
      priority: 47,
      pillar: 'sport',
      templateKey: 'distinctExercisesRich',
      payload: { n: Number(fit.distinctExercisesChecked28) }
    });
  }

  const w28 = body.weightDelta28;
  if (w28 != null && Math.abs(w28) >= 0.35) {
    raw.push({
      id: 'body.weight_delta',
      theme: 'weight',
      priority: 55,
      pillar: 'body',
      templateKey: w28 < 0 ? 'weightDown28' : 'weightUp28',
      payload: { delta: Math.round(Math.abs(w28) * 10) / 10 }
    });
  }

  const goalPhys = ph.goalPhysique;
  if (goalPhys === 'lean_toned' && w28 != null && w28 <= -0.25) {
    raw.push({
      id: 'body.weight_context_lean',
      theme: 'weight_goal',
      priority: 52,
      pillar: 'combined',
      templateKey: 'weightTrendMatchesLeanGoal',
      payload: { delta: Math.round(Math.abs(w28) * 10) / 10 }
    });
  }
  if (goalPhys === 'muscular_defined' && w28 != null && w28 >= 0.35) {
    raw.push({
      id: 'body.weight_context_bulk',
      theme: 'weight_goal',
      priority: 50,
      pillar: 'combined',
      templateKey: 'weightTrendMassGoal',
      payload: { delta: Math.round(Math.abs(w28) * 10) / 10 }
    });
  }

  const w7 = body.weightDelta7;
  if (w7 != null && Math.abs(w7) >= 0.25) {
    raw.push({
      id: 'body.weight_delta7',
      theme: 'weight_7',
      priority: 48,
      pillar: 'body',
      templateKey: w7 < 0 ? 'weightDown7' : 'weightUp7',
      payload: { delta: Math.round(Math.abs(w7) * 10) / 10 }
    });
  }

  if (!hasBodySignal && fit.tenureDays >= 14) {
    raw.push({
      id: 'body.weigh_in_hint',
      theme: 'weight',
      priority: 38,
      pillar: 'body',
      templateKey: 'addWeighIn',
      payload: {}
    });
    gaps.push({ code: 'body_weight', severity: 'info' });
  }

  const sinceLast = jr.daysSinceLastActivity;
  if (
    typeof sinceLast === 'number' &&
    sinceLast >= 10 &&
    fit.tenureDays >= 21 &&
    hasSportSignal &&
    Number(fit.activeDays28) <= 3
  ) {
    raw.push({
      id: 'sport.quiet_recent',
      theme: 'last_session',
      priority: 59,
      pillar: 'sport',
      templateKey: 'quietSportRecentDays',
      payload: { days: sinceLast }
    });
  }

  if (nutritionReady && Number(nut.daysWithLoggedMeals28) > 0 && Number(nut.daysWithLoggedMeals28) <= 4) {
    raw.push({
      id: 'nutrition.newbie_logging',
      theme: 'nutrition_start',
      priority: 48,
      pillar: 'nutrition',
      templateKey: 'firstMealsLogged',
      payload: { days: nut.daysWithLoggedMeals28 }
    });
  }

  if (Number(nut.programsOwnedCount) >= 1 && Number(nut.daysWithLoggedMeals28) >= 5) {
    raw.push({
      id: 'nutrition.program_active',
      theme: 'nutrition_program',
      priority: 44,
      pillar: 'nutrition',
      templateKey: 'nutritionProgramBuilding',
      payload: {}
    });
  }

  const comp = nut.avgComplianceScore;
  if (nutritionReady && comp != null && comp >= 72 && Number(nut.daysWithLoggedMeals28) >= 5) {
    raw.push({
      id: 'nutrition.compliance_good',
      theme: 'compliance',
      priority: 50,
      pillar: 'nutrition',
      templateKey: 'complianceStrong',
      payload: { score: Math.round(comp) }
    });
  }

  if (nutritionReady && comp != null && comp < 45 && Number(nut.daysWithLoggedMeals28) >= 5) {
    raw.push({
      id: 'nutrition.compliance_low',
      theme: 'compliance',
      priority: 58,
      pillar: 'nutrition',
      templateKey: 'complianceLow',
      payload: { score: Math.round(comp) }
    });
  }

  const stdCal = Number(nut.calorieDeltaStdApprox);
  if (
    nutritionReady &&
    Number.isFinite(stdCal) &&
    stdCal > 220 &&
    Number(nut.daysWithLoggedMeals28) >= 6
  ) {
    raw.push({
      id: 'nutrition.variance',
      theme: 'variance',
      priority: 42,
      pillar: 'nutrition',
      templateKey: 'calorieVariance',
      payload: {}
    });
  }

  if (fit.programCompletion28 && fit.programCompletion28.ratio >= 0.62) {
    raw.push({
      id: 'sport.program_adherence',
      theme: 'program_adherence',
      priority: 46,
      pillar: 'sport',
      templateKey: 'trainingProgramAnchored',
      payload: { pct: fit.programCompletion28.pct }
    });
  }

  if (raw.length === 0) {
    if (hasSportSignal || hasNutritionSignal || hasBodySignal) {
      raw.push({
        id: 'fallback.keep_logging',
        theme: 'keep',
        priority: 14,
        pillar: 'combined',
        templateKey: 'keepLogging',
        payload: {}
      });
    } else {
      raw.push({
        id: 'fallback.global_seed',
        theme: 'global_seed',
        priority: 11,
        pillar: 'combined',
        templateKey: 'startAnyPillar',
        payload: {}
      });
    }
  }

  raw.sort((a, b) => b.priority - a.priority);
  const cards = dedupeByTheme(raw, maxCards);

  return {
    cards,
    candidates: raw,
    dataGaps: gaps
  };
}
