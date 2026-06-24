/**
 * Nutrition journalière pour le calendrier sport (bande, récap, score holistique).
 */

import { MEAL_TYPE_LABELS } from '../constants/nutrition.constants';

/** Vert lime — distinct des bandes emerald/sky existantes. */
export const CALENDAR_NUTRITION_STRIPE_COLOR = '#84cc16';

function clampScore(n) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function sumMealCalories(meals) {
  return (meals || []).reduce((s, m) => s + (Number(m.totalCalories) || 0), 0);
}

export function countMealFoods(meals) {
  return (meals || []).reduce(
    (s, m) => s + (Array.isArray(m.foods) ? m.foods.length : 0),
    0
  );
}

/**
 * Score nutrition : journalisation (repas + aliments) + énergie totale saisie.
 * @param {Array|null} meals
 */
export function computeNutritionDayScore(meals) {
  if (!Array.isArray(meals) || meals.length === 0) return null;
  const totalKcal = sumMealCalories(meals);
  const mealCount = meals.length;
  const foodCount = countMealFoods(meals);
  const loggingScore = clampScore(38 + mealCount * 14 + Math.min(28, foodCount * 4));
  const energyScore =
    totalKcal > 0 ? clampScore(Math.min(100, 42 + totalKcal / 32)) : 48;
  const score = clampScore(loggingScore * 0.62 + energyScore * 0.38);
  return { score, totalKcal, mealCount, foodCount, meals };
}

export function buildNutritionDayStripe(meals) {
  if (!Array.isArray(meals) || meals.length === 0) return null;
  return {
    kind: 'nutrition',
    color: CALENDAR_NUTRITION_STRIPE_COLOR,
    key: 'nutrition'
  };
}

function mealTypeLabel(type) {
  return MEAL_TYPE_LABELS[type] || type || 'Repas';
}

function formatFoodLine(food) {
  const name = food?.name || food?.label || 'Aliment';
  const kcal = Number(food?.calories) || 0;
  return kcal > 0 ? `${name} (${Math.round(kcal)} kcal)` : name;
}

/**
 * Lignes récap calendrier (style Garmin) pour les repas du jour.
 */
export function buildNutritionDayRecapRows(meals, t = (k, d) => d || k) {
  if (!Array.isArray(meals) || meals.length === 0) return [];
  const totalKcal = sumMealCalories(meals);
  const rows = meals.map((meal, idx) => {
    const type = meal?.type || meal?.mealType;
    const title = mealTypeLabel(type);
    const mealKcal = Math.round(Number(meal.totalCalories) || 0);
    const foods = Array.isArray(meal.foods) ? meal.foods : [];
    const foodDetail =
      foods.length > 0
        ? foods
            .slice(0, 6)
            .map(formatFoodLine)
            .join(' · ')
        : t('calendar.heatmap.dayRecap.nutritionNoFoods', 'Repas sans détail alimentaire');
    return {
      id: `nutrition-meal-${meal.id || idx}`,
      kind: 'nutrition',
      icon: '🥗',
      iconBg: `${CALENDAR_NUTRITION_STRIPE_COLOR}33`,
      title,
      subtitle: `${mealKcal} kcal — ${foodDetail}`,
      meal,
      totalKcal: mealKcal
    };
  });
  if (rows.length > 1) {
    rows.unshift({
      id: 'nutrition-day-total',
      kind: 'nutrition',
      icon: '🍽️',
      iconBg: `${CALENDAR_NUTRITION_STRIPE_COLOR}44`,
      title: t('calendar.heatmap.dayRecap.nutritionTotal', 'Nutrition du jour'),
      subtitle: `${Math.round(totalKcal)} kcal · ${meals.length} repas`,
      meals,
      totalKcal: Math.round(totalKcal)
    });
  }
  return rows;
}
