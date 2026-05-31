/**
 * Enrichissement repas v6.4 — plan détaillé (PDJ / déj / dîner + collations) aligné sport.
 * Réutilise la banque nutrition Momentum (`generateMealPlanOutline`).
 */

import { NUTRITION_FOOD_BANK_ITEMS, nutrientTotalsForGrams, findBankFoodById } from '../../data/nutritionFoodBank';
import { generateMealPlanOutline } from '../../utils/nutritionMealPlanGenerator';
import { estimateProgramTargets, suggestedBankSelectionQuota } from '../../utils/nutritionProgramEstimate';
import { mapQuizGoalToNutritionGoal } from './quizInfluence';
import { buildNutritionDayAlignment } from './quizNutritionDayAlignment';

const ACTIVITY_TO_FACTOR = {
  sedentary: 1.2,
  lightly_active: 1.35,
  moderately_active: 1.55,
  very_active: 1.725
};

function round1(n) {
  return Math.round(n * 10) / 10;
}

/**
 * @param {number} kcal
 * @param {object} baseMacros — targetProtein, targetCarbs, targetFat @ ref kcal
 * @param {number} refKcal
 * @param {boolean} sportDay
 */
function scaleMacrosForDay(kcal, baseMacros, refKcal, sportDay) {
  if (!kcal || !baseMacros || !refKcal) {
    return { kcal, protein: null, carbs: null, fat: null };
  }
  const ratio = kcal / refKcal;
  let protein = baseMacros.targetProtein * ratio;
  let carbs = baseMacros.targetCarbs * ratio;
  let fat = baseMacros.targetFat * ratio;
  if (sportDay) {
    carbs *= 1.08;
    fat *= 0.94;
  } else {
    carbs *= 0.95;
    fat *= 1.03;
  }
  const computed = protein * 4 + carbs * 4 + fat * 9;
  const fix = kcal / Math.max(1, computed);
  return {
    kcal: Math.round(kcal),
    protein: round1(protein * fix),
    carbs: round1(carbs * fix),
    fat: round1(fat * fix)
  };
}

function sumMealsNutrients(meals) {
  let kcal = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  (meals || []).forEach((slot) => {
    (slot.foods || []).forEach((row) => {
      if (row.kcalRounded != null) kcal += row.kcalRounded;
      const food = findBankFoodById(row.foodId);
      if (food && row.approximateGrams) {
        const t = nutrientTotalsForGrams(food.per100, row.approximateGrams);
        protein += t.protein || 0;
        carbs += t.carbs || 0;
        fat += t.fat || 0;
      } else if (row.proteinRounded) {
        protein += row.proteinRounded;
      }
    });
  });
  return {
    kcalRounded: Math.round(kcal),
    proteinRounded: round1(protein),
    carbsRounded: round1(carbs),
    fatRounded: round1(fat)
  };
}

function mealPreferencesFromQuiz(answers) {
  const prefs = answers?.nutritionFoodPreferences || {};
  return {
    lovedFoodIds: prefs.lovedFoodIds || [],
    avoidedFoodIds: prefs.avoidedFoodIds || [],
    openFoodIds: prefs.openFoodIds || [],
    selectedBankFoodIds: prefs.selectedBankFoodIds || [],
    snacksPerDay: answers?.nutritionSnacksPerDay === 1 ? 1 : 2
  };
}

function buildProgramTargetsFromQuiz(answers) {
  const vitals = answers?.vitalsSelfReport || {};
  const weight = Number(vitals.weightKg) || 70;
  const goal = mapQuizGoalToNutritionGoal(
    answers?.goalPhysique || 'balanced_functional',
    answers?.currentPhysique
  );
  const activityFactor = ACTIVITY_TO_FACTOR[answers?.activityOutsideTraining] ?? 1.55;
  return estimateProgramTargets({
    baselineWeightKg: weight,
    heightCm: Number(vitals.heightCm) || 175,
    age: Number(vitals.age) || 30,
    sex: vitals.sex === 'female' ? 'female' : vitals.sex === 'male' ? 'male' : 'other',
    bodyFatPercent: answers?.bodyFatPercentEstimate ?? null,
    activityFactor,
    goal
  });
}

/**
 * @param {object} answers
 * @param {Record<string, object>} schedule
 * @param {object} [weeklyPlanner]
 */
export function buildEnrichedNutritionPlan(answers, schedule, weeklyPlanner = null) {
  const alignment = buildNutritionDayAlignment(answers, schedule, weeklyPlanner);
  const targets = buildProgramTargetsFromQuiz(answers);
  const foodPrefs = mealPreferencesFromQuiz(answers);
  const trainingWindow = answers?.preferredTrainingWindow || null;
  const refKcal = targets.targetCalories;

  const byDay = {};
  Object.entries(alignment.byDay || {}).forEach(([dayKey, dayInfo]) => {
    const sport = dayInfo.intensity === 'sport';
    const macros = scaleMacrosForDay(dayInfo.kcalTarget, targets, refKcal, sport);
    const meals = generateMealPlanOutline({
      foodBankItems: NUTRITION_FOOD_BANK_ITEMS,
      targetCalories: macros.kcal,
      targetProtein: macros.protein,
      targetCarbs: macros.carbs,
      targetFat: macros.fat,
      ...foodPrefs,
      trainingWindow,
      sportDay: sport
    });
    const summed = sumMealsNutrients(meals);
    byDay[dayKey] = {
      ...dayInfo,
      macros,
      macrosFromMeals: summed,
      meals,
      mealCount: meals.filter((m) => m.slot !== 'info').length
    };
  });

  const restDay = Object.values(byDay).find((d) => d.intensity !== 'sport') || Object.values(byDay)[0];
  const sportDay = Object.values(byDay).find((d) => d.intensity === 'sport');

  const weeklyOutline =
    restDay?.meals ||
    generateMealPlanOutline({
      foodBankItems: NUTRITION_FOOD_BANK_ITEMS,
      targetCalories: targets.targetCalories,
      targetProtein: targets.targetProtein,
      targetCarbs: targets.targetCarbs,
      targetFat: targets.targetFat,
      ...foodPrefs,
      trainingWindow,
      sportDay: false
    });

  const programSeed = {
    goal: mapQuizGoalToNutritionGoal(answers?.goalPhysique, answers?.currentPhysique),
    targetCalories: targets.targetCalories,
    targetProtein: targets.targetProtein,
    targetCarbs: targets.targetCarbs,
    targetFat: targets.targetFat,
    adjustForWorkout: Boolean(sportDay && restDay && sportDay.macros?.kcal !== restDay.macros?.kcal),
    workoutDayCalories: sportDay?.macros?.kcal ?? targets.targetCalories + 150,
    restDayCalories: restDay?.macros?.kcal ?? targets.targetCalories,
    mealPlanPreferences: {
      ...foodPrefs,
      maxWeeklyFoodVariety: suggestedBankSelectionQuota(
        mapQuizGoalToNutritionGoal(answers?.goalPhysique, answers?.currentPhysique),
        targets.targetCalories
      ),
      generatedMealPlan: weeklyOutline,
      mealPlanByDay: Object.fromEntries(
        Object.entries(byDay).map(([k, d]) => [k, { macros: d.macros, meals: d.meals }])
      )
    },
    timingHint: alignment.base?.timingHint,
    mealStructureHint: alignment.base?.mealStructureHint
  };

  const detailFr = Object.values(byDay)
    .slice(0, 3)
    .map((d) => {
      const slots = (d.meals || [])
        .filter((m) => m.foods?.length)
        .map((m) => `${m.label} (~${m.targetKcalRounded || '?'} kcal)`)
        .join(', ');
      return `${d.dayLabelFr} : ${slots}`;
    })
    .join(' · ');

  const summaryFr = [
    alignment.summaryFr,
    `Macros type : ${targets.targetProtein} g P / ${targets.targetCarbs} g G / ${targets.targetFat} g L.`,
    detailFr ? `Exemple : ${detailFr}` : null
  ]
    .filter(Boolean)
    .join(' ');

  return {
    version: 1,
    alignment,
    targets,
    byDay,
    weeklyOutline,
    programSeed,
    summaryFr,
    linkModuleFr:
      'Ouvre l’onglet Nutrition → nouveau programme : le gabarit repas et les kcal jours sport/repos sont préremplis depuis le quiz.'
  };
}
