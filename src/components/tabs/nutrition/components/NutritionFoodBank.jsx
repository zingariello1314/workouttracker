/**
 * Sous-section Nutrition — Banque d'aliments de référence (macros pour 100 g ou 100 ml, portions indicatives).
 */

import React, { useMemo, useState } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from '../../../ui/Card';
import Input from '../../../ui/Input';
import { typography } from '../../../../styles/typography';
import { useWorkout } from '../../../../context/WorkoutContext';
import { useToast } from '../../../ui/Toast';
import {
  NUTRITION_FOOD_BANK_ITEMS,
  NUTRITION_FOOD_BANK_ACTIVE_COUNT,
  NUTRITION_FOOD_BANK_CATEGORIES,
  nutrientTotalsForGrams,
  mergeFoodBankWithOverrides
} from '../../../../data/nutritionFoodBank';
import { Search, ArrowLeft, Save, RotateCcw, Sparkles } from 'lucide-react';

const MACRO_FIELDS = [
  ['kcal', 'Calories (kcal)'],
  ['protein', 'Protéines (g)'],
  ['carbs', 'Glucides (g)'],
  ['fat', 'Lipides (g)'],
  ['fiber', 'Fibres (g)']
];

const MICRO_FIELDS = [
  ['vitaminA', 'Vitamine A (µg)'],
  ['vitaminC', 'Vitamine C (mg)'],
  ['vitaminD', 'Vitamine D (µg)'],
  ['vitaminE', 'Vitamine E (mg)'],
  ['vitaminK', 'Vitamine K (µg)'],
  ['vitaminB6', 'Vitamine B6 (mg)'],
  ['vitaminB12', 'Vitamine B12 (µg)'],
  ['folate', 'Folate B9 (µg)'],
  ['calcium', 'Calcium (mg)'],
  ['iron', 'Fer (mg)'],
  ['magnesium', 'Magnésium (mg)'],
  ['potassium', 'Potassium (mg)'],
  ['sodium', 'Sodium (mg)'],
  ['zinc', 'Zinc (mg)']
];

const buildDefaultMicroValues = (micro = {}) =>
  Object.fromEntries(MICRO_FIELDS.map(([k]) => [k, Number(micro?.[k]) || 0]));

const NutritionFoodBank = ({ isVisible: _isVisible }) => {
  const { data, updateData } = useWorkout();
  const { showSuccess, showError } = useToast();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [macroSort, setMacroSort] = useState('none');
  const [selectedFoodId, setSelectedFoodId] = useState(null);
  const [draft, setDraft] = useState(null);

  const userFoodBank = useMemo(
    () => mergeFoodBankWithOverrides(NUTRITION_FOOD_BANK_ITEMS, data?.nutritionFoodOverrides),
    [data?.nutritionFoodOverrides]
  );

  const selectedFood = useMemo(
    () => userFoodBank.find((x) => x.id === selectedFoodId) || null,
    [selectedFoodId, userFoodBank]
  );

  const openFood = (item) => {
    setSelectedFoodId(item.id);
    setDraft({
      description: item.description || '',
      per100: {
        kcal: item.per100?.kcal ?? '',
        protein: item.per100?.protein ?? '',
        carbs: item.per100?.carbs ?? '',
        fat: item.per100?.fat ?? '',
        fiber: item.per100?.fiber ?? ''
      },
      microPer100: buildDefaultMicroValues(item.microPer100)
    });
  };

  const closeFoodPage = () => {
    setSelectedFoodId(null);
    setDraft(null);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = userFoodBank.filter((item) => {
      if (category && item.category !== category) return false;
      if (!q) return true;
      return item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
    });
    if (macroSort === 'protein') arr = [...arr].sort((a, b) => (b.per100.protein || 0) - (a.per100.protein || 0));
    if (macroSort === 'carbs') arr = [...arr].sort((a, b) => (b.per100.carbs || 0) - (a.per100.carbs || 0));
    if (macroSort === 'fat') arr = [...arr].sort((a, b) => (b.per100.fat || 0) - (a.per100.fat || 0));
    if (macroSort === 'kcal') arr = [...arr].sort((a, b) => (b.per100.kcal || 0) - (a.per100.kcal || 0));
    return arr;
  }, [query, category, macroSort, userFoodBank]);

  const saveFoodOverrides = async () => {
    if (!selectedFood || !draft) return;
    try {
      const overrides = data?.nutritionFoodOverrides || {};
      const next = {
        ...(data || {}),
        nutritionFoodOverrides: {
          ...overrides,
          [selectedFood.id]: {
            description: String(draft.description || ''),
            per100: {
              kcal: Number(draft.per100?.kcal) || 0,
              protein: Number(draft.per100?.protein) || 0,
              carbs: Number(draft.per100?.carbs) || 0,
              fat: Number(draft.per100?.fat) || 0,
              fiber: Number(draft.per100?.fiber) || 0
            },
            microPer100: Object.fromEntries(
              MICRO_FIELDS.map(([k]) => [k, Number(draft.microPer100?.[k]) || 0])
            ),
            updatedAt: new Date().toISOString()
          }
        }
      };
      await updateData(next);
      showSuccess('Valeurs personnalisées sauvegardées pour ton compte.');
    } catch (error) {
      showError("Impossible d'enregistrer les modifications de l'aliment.");
    }
  };

  const resetFoodOverrides = async () => {
    if (!selectedFood) return;
    try {
      const overrides = { ...(data?.nutritionFoodOverrides || {}) };
      delete overrides[selectedFood.id];
      const next = {
        ...(data || {}),
        nutritionFoodOverrides: overrides
      };
      await updateData(next);
      const base = NUTRITION_FOOD_BANK_ITEMS.find((x) => x.id === selectedFood.id);
      if (base) openFood(base);
      showSuccess('Valeurs réinitialisées avec les valeurs par défaut.');
    } catch {
      showError("Impossible de réinitialiser l'aliment.");
    }
  };

  if (selectedFood && draft) {
    return (
      <div className="space-y-6">
        <Card variant="sport">
          <CardHeader>
            <button
              type="button"
              onClick={closeFoodPage}
              className="inline-flex items-center gap-2 text-sm text-teal-200 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à la banque
            </button>
            <CardTitle className={`${typography.presets.h2} text-white mt-2`}>{selectedFood.name}</CardTitle>
            <p className="text-teal-200/80 text-sm mt-2">
              Édition personnalisée par utilisateur. Ces valeurs restent sur ton compte après déconnexion/reconnexion.
            </p>
          </CardHeader>
        </Card>

        <Card variant="sport" className="bg-black/90 border border-[#0F4C5C]/60 shadow-[0_20px_70px_rgba(2,12,27,0.55)]">
          <CardContent className="p-4 space-y-4">
            <div className="rounded-xl border border-[#0F4C5C]/50 bg-gradient-to-br from-[#022f36]/35 to-black p-4">
              <div className="mb-2 inline-flex items-center gap-2 text-emerald-200 text-xs">
                <Sparkles className="h-4 w-4" />
                Description riche de l'aliment
              </div>
              <label className="block text-xs text-teal-400 mb-1">Description</label>
              <textarea
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                className="w-full min-h-[110px] rounded-lg border border-[#0F4C5C]/55 bg-black/80 px-3 py-2 text-sm text-teal-50"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 rounded-xl border border-[#0F4C5C]/45 bg-black/45 p-3">
                <h4 className="text-white font-semibold">Macros (pour 100 {selectedFood.referenceUnit})</h4>
                {MACRO_FIELDS.map(([k, label]) => (
                  <label key={k} className="block text-xs text-teal-300">
                    {label}
                    <input
                      type="number"
                      step="0.1"
                      value={draft.per100?.[k] ?? ''}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          per100: { ...(d.per100 || {}), [k]: e.target.value === '' ? 0 : Number(e.target.value) }
                        }))
                      }
                      className="mt-1 w-full rounded border border-[#0F4C5C]/55 bg-black px-2 py-1 text-teal-100"
                    />
                  </label>
                ))}
              </div>
              <div className="space-y-2 rounded-xl border border-[#0F4C5C]/45 bg-black/45 p-3">
                <h4 className="text-white font-semibold">Micronutriments</h4>
                <div className="max-h-80 overflow-y-auto pr-1 space-y-2">
                  {MICRO_FIELDS.map(([k, label]) => (
                    <label key={k} className="block text-xs text-teal-300">
                      {label}
                      <input
                        type="number"
                        step="0.1"
                        value={draft.microPer100?.[k] ?? ''}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            microPer100: {
                              ...(d.microPer100 || {}),
                              [k]: e.target.value === '' ? 0 : Number(e.target.value)
                            }
                          }))
                        }
                        className="mt-1 w-full rounded border border-[#0F4C5C]/55 bg-black px-2 py-1 text-teal-100"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={resetFoodOverrides}
                className="inline-flex items-center gap-2 rounded-lg border border-amber-500/65 bg-amber-950/30 px-4 py-2 text-sm text-amber-100 hover:bg-amber-900/40"
              >
                <RotateCcw className="h-4 w-4" />
                Réinitialiser (défaut)
              </button>
              <button
                type="button"
                onClick={saveFoodOverrides}
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/60 bg-emerald-900/30 px-4 py-2 text-sm text-emerald-100 hover:bg-emerald-900/50"
              >
                <Save className="h-4 w-4" />
                Enregistrer mes valeurs
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card variant="sport">
        <CardHeader>
          <CardTitle className={`${typography.presets.h2} text-white`}>Banque aliments</CardTitle>
          <p className="text-teal-200/80 text-sm mt-2">
            {NUTRITION_FOOD_BANK_ACTIVE_COUNT} références : valeurs pour 100&nbsp;g ou 100&nbsp;ml (liquides).
            Portions type (œufs, tranches) affichées quand disponibles.
          </p>
        </CardHeader>
      </Card>

      <Card variant="sport" className="bg-black">
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:items-end">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-600/90" size={18} />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un ingrédient…"
                className="border-[#0F4C5C]/55 bg-black text-teal-50 pl-10 placeholder:text-teal-800"
              />
            </div>
            <div className="w-full">
              <label className="block text-xs text-teal-600/95 mb-1">Catégorie</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-[#0F4C5C]/55 bg-black px-3 py-2 text-sm text-teal-50 focus:outline-none focus:ring-2 focus:ring-[#0F5C45]/50"
              >
                <option value="">Toutes</option>
                {(NUTRITION_FOOD_BANK_CATEGORIES || []).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full">
              <label className="block text-xs text-teal-600/95 mb-1">Trier par macro</label>
              <select
                value={macroSort}
                onChange={(e) => setMacroSort(e.target.value)}
                className="w-full rounded-lg border border-[#0F4C5C]/55 bg-black px-3 py-2 text-sm text-teal-50 focus:outline-none focus:ring-2 focus:ring-[#0F5C45]/50"
              >
                <option value="none">Aucun tri macro</option>
                <option value="protein">Plus de protéines</option>
                <option value="carbs">Plus de glucides</option>
                <option value="fat">Plus de lipides</option>
                <option value="kcal">Plus de calories</option>
              </select>
            </div>
          </div>

          <p className="text-teal-700/90 text-xs">
            Les macros servent au moment de créer un programme (préférences, quota de variété).
          </p>

          <div className="max-h-[min(70vh,560px)] overflow-y-auto rounded-lg border border-[#0F4C5C]/45 p-2">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-teal-700/95 text-sm">Aucun résultat.</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                {filtered.map((item) => {
                  const unitLabel = item.referenceUnit === 'ml' ? '100 ml' : '100 g';
                  const isSelected = selectedFoodId === item.id;
                  return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => openFood(item)}
                    className={`rounded-lg border p-2 text-left transition ${
                      isSelected
                        ? 'border-emerald-400/70 bg-emerald-950/25 shadow-[0_0_0_1px_rgba(52,211,153,0.22)]'
                        : 'border-[#0F4C5C]/45 bg-black/80 hover:border-[#0F5C45]/65'
                    }`}
                  >
                    <div className="text-white font-medium text-sm line-clamp-2">{item.name}</div>
                    <div className="text-[10px] text-teal-700 mt-0.5">{item.category}</div>
                    <div className="text-[11px] text-teal-100/85 mt-1">
                      {unitLabel} · {item.per100.kcal} kcal
                    </div>
                    <div className="grid grid-cols-2 gap-1 mt-1">
                      <MacroPill label="Protéines" value={`${item.per100.protein} g`} />
                      <MacroPill label="Glucides" value={`${item.per100.carbs} g`} />
                      <MacroPill label="Lipides" value={`${item.per100.fat} g`} />
                      <MacroPill label="Fibres" value={`${item.per100.fiber} g`} />
                    </div>
                    {item.piece ? (
                      <div className="mt-2 text-[10px] text-teal-300/80">
                        {item.piece.label}
                        {' · '}
                        {(() => {
                          const t = nutrientTotalsForGrams(item.per100, item.piece.grams);
                          return `${t.kcal} kcal`;
                        })()}
                      </div>
                    ) : null}
                    <p className="text-[10px] text-teal-800 mt-1">{item.key || item.id}</p>
                  </button>
                );
              })}
              </div>
            )}
          </div>
          <p className="text-xs text-teal-500/90">
            Clique sur un aliment pour ouvrir sa page dédiée et modifier ses valeurs personnalisées.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

function MacroPill({ label, value }) {
  return (
    <div className="rounded-md border border-[#0F4C5C]/45 bg-black/80 px-1.5 py-1">
      <div className="text-[10px] uppercase tracking-wide text-teal-700">{label}</div>
      <div className="text-white font-semibold">{value}</div>
    </div>
  );
}

export default NutritionFoodBank;
