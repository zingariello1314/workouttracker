import React, { useMemo, useState } from 'react';

const DAY_ORDER = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

/**
 * Panneau repas alignés sport (meta `nutritionAlignment.byDay`).
 */
const ProgramNutritionWeekPanel = ({ nutritionAlignment, compact = false }) => {
  const byDay = nutritionAlignment?.byDay;
  const [openDay, setOpenDay] = useState(null);

  const orderedDays = useMemo(() => {
    if (!byDay || typeof byDay !== 'object') return [];
    return DAY_ORDER.filter((d) => byDay[d]).map((key) => ({ key, ...byDay[key] }));
  }, [byDay]);

  if (!orderedDays.length) return null;

  return (
    <div
      className={`rounded-xl border border-emerald-500/25 bg-emerald-950/20 space-y-2 ${
        compact ? 'p-3' : 'p-4'
      }`}
    >
      <div>
        <p className="text-xs uppercase tracking-wide text-emerald-300/90">Repas — semaine type</p>
        {nutritionAlignment.summaryFr ? (
          <p className="text-xs text-slate-300 mt-1">{nutritionAlignment.summaryFr}</p>
        ) : null}
      </div>
      <ul className="space-y-1">
        {orderedDays.map((day) => {
          const expanded = openDay === day.key;
          const meals = Array.isArray(day.meals) ? day.meals : [];
          return (
            <li key={day.key} className="rounded-lg border border-slate-700/60 bg-slate-900/40">
              <button
                type="button"
                className="w-full flex items-center justify-between px-3 py-2 text-left text-sm text-slate-100"
                onClick={() => setOpenDay(expanded ? null : day.key)}
              >
                <span>{day.dayLabelFr || day.key}</span>
                <span className="text-xs text-slate-400">
                  {day.kcalRounded != null ? `${day.kcalRounded} kcal` : ''}
                  {expanded ? ' ▲' : ' ▼'}
                </span>
              </button>
              {expanded ? (
                <div className="px-3 pb-3 space-y-2 text-xs text-slate-300">
                  {meals.map((slot) => (
                    <div key={slot.label || slot.slotId}>
                      <p className="font-medium text-emerald-200/90">{slot.label}</p>
                      {(slot.foods || []).length ? (
                        <ul className="list-disc list-inside mt-0.5">
                          {slot.foods.map((f) => (
                            <li key={`${slot.label}-${f.name}`}>
                              {f.name}
                              {f.approximateGrams != null ? ` ~${f.approximateGrams} g` : ''}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-slate-500 italic">—</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ProgramNutritionWeekPanel;
