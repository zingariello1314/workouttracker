/**
 * Sous-ensemble de la banque nutrition pour le quiz (évite une liste de 200+ aliments).
 */
import { NUTRITION_FOOD_BANK_ITEMS } from '../../data/nutritionFoodBank';

const CATEGORY_QUOTA = [
  'Viandes',
  'Poissons',
  'Œufs',
  'Produits laitiers',
  'Féculents',
  'Légumes',
  'Fruits',
  'Légumineuses',
  'Protéines végétales',
  'Mat. grasses'
];

/** @type {import('../../data/nutritionFoodBank.js').NutritionBankFood[]} */
export const QUIZ_CURATED_NUTRITION_FOODS = CATEGORY_QUOTA.flatMap((cat) =>
  NUTRITION_FOOD_BANK_ITEMS.filter((f) => f.category === cat).slice(0, 3)
).slice(0, 28);
