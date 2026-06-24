import React from 'react';
import { ExternalLink, UtensilsCrossed } from 'lucide-react';
import { MEAL_TYPE_LABELS } from '../../constants/nutrition.constants';
import { sumMealCalories } from '../../utils/calendarNutritionDay';

function mealLabel(meal) {
  const type = meal?.type || meal?.mealType;
  return MEAL_TYPE_LABELS[type] || type || 'Repas';
}

/**
 * Résumé nutrition du jour avec lien vers l'onglet Nutrition.
 */
export default function CalendarDayNutritionSummary({ meals, onOpenNutrition, t }) {
  const tr = t || ((k, d) => d);
  if (!Array.isArray(meals) || meals.length === 0) return null;

  const totalKcal = sumMealCalories(meals);

  return (
    <div className="rounded-xl border border-lime-500/35 bg-lime-950/15 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h4 className="flex items-center gap-2 font-medium text-lime-100">
          <UtensilsCrossed className="h-4 w-4" aria-hidden />
          {tr('calendar.heatmap.dayDetails.nutritionTitle', 'Nutrition du jour')}
        </h4>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold tabular-nums text-lime-50">
            {Math.round(totalKcal)} kcal
          </span>
          {onOpenNutrition ? (
            <button
              type="button"
              onClick={onOpenNutrition}
              className="inline-flex items-center gap-1 text-xs text-lime-300 underline-offset-2 hover:text-lime-100 hover:underline"
            >
              {tr('calendar.heatmap.dayDetails.openNutrition', 'Ouvrir Nutrition')}
              <ExternalLink className="h-3 w-3" aria-hidden />
            </button>
          ) : null}
        </div>
      </div>
      <div className="space-y-2">
        {meals.map((meal, idx) => {
          const foods = Array.isArray(meal.foods) ? meal.foods : [];
          const mealKcal = Math.round(Number(meal.totalCalories) || 0);
          return (
            <div
              key={meal.id || `meal-${idx}`}
              className="rounded-lg border border-lime-600/25 bg-slate-900/40 p-3"
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-lime-100">{mealLabel(meal)}</span>
                <span className="text-sm font-semibold tabular-nums text-lime-50">
                  {mealKcal} kcal
                </span>
              </div>
              {foods.length > 0 ? (
                <ul className="space-y-0.5 text-xs text-slate-400">
                  {foods.map((food, fi) => {
                    const kcal = Math.round(Number(food?.calories) || 0);
                    return (
                      <li key={food.id || `${idx}-${fi}`} className="flex justify-between gap-2">
                        <span className="truncate">{food?.name || food?.label || 'Aliment'}</span>
                        {kcal > 0 ? (
                          <span className="shrink-0 tabular-nums text-lime-200/80">{kcal} kcal</span>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-xs text-slate-500">
                  {tr('calendar.heatmap.dayDetails.nutritionNoFoodDetail', 'Pas de détail alimentaire')}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
