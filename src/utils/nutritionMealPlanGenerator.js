/**
 * Compose un gabarit de journée type : 3 repas + 1 ou 2 collations,
 * à partir des cibles macros et des préférences banque (aimés / ouverts / rotation).
 */

import {
  NUTRITION_FOOD_BANK_ITEMS,
  findBankFoodById,
  nutrientTotalsForGrams
} from '../data/nutritionFoodBank';

const PROTEIN_CAT_RE =
  /^(Viandes|Poissons|Œufs|Produits laitiers|Légumineuses|Protéines végétales|Compléments)$/;
const CARB_CAT_RE = /^Féculents$/;

function classifyFood(food) {
  const cat = food.category || '';
  return {
    isProtein: PROTEIN_CAT_RE.test(cat),
    isCarb: CARB_CAT_RE.test(cat),
    isFatAccessory: /^Mat\. grasses$/.test(cat) || /^Fruits à coque$/.test(cat)
  };
}

function gramsFromKcalAnchor(food, targetKcal) {
  const k = food.per100?.kcal;
  if (!k || k <= 0) return 80;
  const g = (targetKcal / k) * 100;
  return Math.min(450, Math.max(25, Math.round(g / 5) * 5));
}

function buildPool({
  foodBankItems = NUTRITION_FOOD_BANK_ITEMS,
  lovedFoodIds = [],
  openFoodIds = [],
  selectedBankFoodIds = [],
  avoidedFoodIds = []
}) {
  const findInBank = (id) => foodBankItems.find((x) => x.id === id) || findBankFoodById(id);
  const avoided = new Set(avoidedFoodIds);
  const orderedIds = [...new Set([...lovedFoodIds, ...openFoodIds, ...selectedBankFoodIds])];
  const fromPrefs = orderedIds.map((id) => findInBank(id)).filter(Boolean).filter((f) => !avoided.has(f.id));

  if (fromPrefs.length >= 8) {
    return fromPrefs;
  }
  const filler = (foodBankItems || NUTRITION_FOOD_BANK_ITEMS).filter((f) => !avoided.has(f.id));
  const merged = [...fromPrefs];
  const seen = new Set(merged.map((f) => f.id));
  for (const f of filler) {
    if (merged.length >= 48) break;
    if (!seen.has(f.id)) {
      merged.push(f);
      seen.add(f.id);
    }
  }
  return merged;
}

function pickProtein(pool, used) {
  const candidates = pool.filter((f) => classifyFood(f).isProtein && !used.has(f.id));
  candidates.sort((a, b) => (b.per100.protein || 0) - (a.per100.protein || 0));
  const pick = candidates[0];
  if (pick) {
    used.add(pick.id);
    return pick;
  }
  return pool.find((f) => !used.has(f.id)) || pool[0];
}

function pickCarb(pool, used) {
  const candidates = pool.filter((f) => classifyFood(f).isCarb && !used.has(f.id));
  candidates.sort((a, b) => (b.per100.carbs || 0) - (a.per100.carbs || 0));
  const pick = candidates[0];
  if (pick) {
    used.add(pick.id);
    return pick;
  }
  return pool.find((f) => !used.has(f.id)) || pool[0];
}

function pickAccessory(pool, used) {
  const candidates = pool.filter((f) => classifyFood(f).isFatAccessory && !used.has(f.id));
  const pick = candidates[0] || pool.find((f) => !used.has(f.id));
  if (pick) used.add(pick.id);
  return pick || null;
}

function buildSlotFoods(pool, slotKcal, used, variant = 0) {
  const protein = pickProtein(pool, used);
  const carb = pickCarb(pool, used);
  const acc = variant % 2 === 0 ? pickAccessory(pool, used) : null;

  /** @type {{ foodId: string, name: string, approximateGrams: number, notes?: string }[]} */
  const foods = [];

  const pKcal = slotKcal * 0.45;
  const cKcal = slotKcal * (acc ? 0.35 : 0.42);
  const aKcal = acc ? slotKcal * 0.2 : 0;

  if (protein) {
    let g = gramsFromKcalAnchor(protein, pKcal);
    if (protein.piece?.grams && g <= protein.piece.grams * 2) {
      const nPieces = Math.max(1, Math.round(g / protein.piece.grams));
      g = Math.min(450, Math.max(protein.piece.grams, nPieces * protein.piece.grams));
      foods.push({
        foodId: protein.id,
        name: protein.name,
        approximateGrams: g,
        notes: `≈ ${nPieces} × ${protein.piece.label}`
      });
    } else {
      foods.push({ foodId: protein.id, name: protein.name, approximateGrams: g });
    }
  }
  if (carb && carb.id !== protein?.id) {
    const g = gramsFromKcalAnchor(carb, cKcal);
    foods.push({ foodId: carb.id, name: carb.name, approximateGrams: g });
  }
  if (acc) {
    const g = gramsFromKcalAnchor(acc, aKcal);
    foods.push({ foodId: acc.id, name: acc.name, approximateGrams: g, notes: 'Petite portion type condiment / gras' });
  }

  return foods;
}

/**
 * Répartition kcal par repas selon créneau d’entraînement et charge du jour.
 * @param {{ trainingWindow?: string, snacksPerDay?: 1|2, sportDay?: boolean }} opts
 */
export function resolveMealKcalShares(opts = {}) {
  const snacksPerDay = Number(opts.snacksPerDay) === 1 ? 1 : 2;
  let bShare = snacksPerDay === 1 ? 0.26 : 0.22;
  let lShare = snacksPerDay === 1 ? 0.35 : 0.33;
  let dShare = snacksPerDay === 1 ? 0.33 : 0.3;
  let snackShare = snacksPerDay === 1 ? 0.06 : 0.15;

  const w = opts.trainingWindow;
  if (w === 'very_early_morning' || w === 'morning') {
    bShare += 0.04;
    lShare -= 0.02;
    dShare -= 0.02;
  } else if (w === 'midday') {
    lShare += 0.05;
    bShare -= 0.02;
    dShare -= 0.03;
  } else if (w === 'afternoon') {
    lShare += 0.02;
    snackShare += 0.02;
    dShare -= 0.02;
    bShare -= 0.02;
  } else if (w === 'evening' || w === 'night') {
    dShare += 0.05;
    lShare -= 0.03;
    bShare -= 0.02;
  }

  if (opts.sportDay) {
    snackShare += 0.02;
    dShare -= 0.01;
    lShare -= 0.01;
  }

  const sum = bShare + lShare + dShare + snackShare;
  return {
    breakfast: bShare / sum,
    lunch: lShare / sum,
    dinner: dShare / sum,
    snack: snackShare / sum,
    snacksPerDay
  };
}

function slotTimingHintFr(slot, trainingWindow) {
  const map = {
    breakfast: {
      very_early_morning: 'Repas léger possible avant séance très tôt ; sinon après.',
      morning: 'Petit-déjeuner renforcé si séance matinale.',
      midday: 'Petit-déjeuner équilibré.',
      afternoon: 'Petit-déjeuner classique.',
      evening: 'Petit-déjeuner protéiné.',
      night: 'Petit-déjeuner classique.'
    },
    lunch: {
      midday: 'Déjeuner = repas principal autour de la séance.',
      afternoon: 'Déjeuner solide ; collation avant séance si faim.',
      default: 'Déjeuner équilibré.'
    },
    dinner: {
      evening: 'Dîner post-séance : protéines + glucides modérés.',
      night: 'Dîner plus tôt si séance tardive ; portion modérée.',
      default: 'Dîner équilibré.'
    }
  };
  if (slot.startsWith('snack')) {
    if (trainingWindow === 'morning' || trainingWindow === 'very_early_morning') {
      return 'Collation utile si écart avant/après séance matin.';
    }
    if (trainingWindow === 'evening' || trainingWindow === 'afternoon') {
      return 'Collation post-séance ou goûter protéiné.';
    }
    return 'Collation selon faim.';
  }
  if (slot === 'breakfast') return map.breakfast[trainingWindow] || map.breakfast.midday;
  if (slot === 'lunch') return map.lunch[trainingWindow] || map.lunch.default;
  if (slot === 'dinner') return map.dinner[trainingWindow] || map.dinner.default;
  return null;
}

/**
 * @param {{
 *   targetCalories: number,
 *   targetProtein: number,
 *   targetCarbs: number,
 *   targetFat: number,
 *   lovedFoodIds?: string[],
 *   avoidedFoodIds?: string[],
 *   openFoodIds?: string[],
 *   selectedBankFoodIds?: string[],
 *   snacksPerDay?: 1|2,
 *   trainingWindow?: string,
 *   sportDay?: boolean,
 * }} params
 */
export function generateMealPlanOutline(params) {
  const kcal = Math.max(1200, Math.min(9000, Number(params.targetCalories) || 2200));
  const shares = resolveMealKcalShares({
    snacksPerDay: params.snacksPerDay,
    trainingWindow: params.trainingWindow,
    sportDay: params.sportDay
  });
  const snacksPerDay = shares.snacksPerDay;

  const pool = buildPool({
    foodBankItems: Array.isArray(params.foodBankItems) && params.foodBankItems.length ? params.foodBankItems : NUTRITION_FOOD_BANK_ITEMS,
    lovedFoodIds: params.lovedFoodIds,
    openFoodIds: params.openFoodIds,
    selectedBankFoodIds: params.selectedBankFoodIds,
    avoidedFoodIds: params.avoidedFoodIds
  });

  if (!pool.length) {
    return [
      {
        slot: 'info',
        label: 'Banque vide',
        foods: [
          {
            foodId: '_',
            name: 'Aucun aliment disponible (tout évité ?). Retire des exclusions ou coche des aliments.',
            approximateGrams: 0
          }
        ]
      }
    ];
  }

  const used = new Set();
  const trainingWindow = params.trainingWindow || null;

  const slots = [
    { slot: 'breakfast', label: 'Petit-déjeuner', kcal: kcal * shares.breakfast },
    { slot: 'lunch', label: 'Déjeuner', kcal: kcal * shares.lunch },
    { slot: 'dinner', label: 'Dîner', kcal: kcal * shares.dinner }
  ];

  const perSnack = (kcal * shares.snack) / snacksPerDay;
  for (let i = 0; i < snacksPerDay; i++) {
    slots.push({
      slot: `snack_${i + 1}`,
      label: snacksPerDay === 2 ? (i === 0 ? 'Collation (matin / avant midi)' : 'Collation (après-midi)') : 'Collation',
      kcal: perSnack
    });
  }

  const foodById = new Map((Array.isArray(params.foodBankItems) ? params.foodBankItems : NUTRITION_FOOD_BANK_ITEMS).map((f) => [f.id, f]));
  return slots.map(({ slot, label, kcal: slotKcal }, idx) => ({
    slot,
    label,
    timingHintFr: slotTimingHintFr(slot, trainingWindow),
    targetKcalRounded: Math.round(slotKcal),
    foods: buildSlotFoods(pool, slotKcal, used, idx)
      .map((row) => {
        const ff = foodById.get(row.foodId) || findBankFoodById(row.foodId);
        const tot =
          ff && row.approximateGrams ? nutrientTotalsForGrams(ff.per100, row.approximateGrams) : null;
        return {
          ...row,
          kcalRounded: tot ? tot.kcal : undefined,
          proteinRounded: tot ? tot.protein : undefined
        };
      })
      .filter((x) => x.foodId && x.name)
  }));
}
