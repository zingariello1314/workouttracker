/**
 * badges/index.js
 * 
 * Point d'entrée central pour tous les badges de nutrition
 * Agrége tous les badges par niveau de difficulté et exporte les interfaces publiques
 * 
 * @module services/nutrition/badges
 */

// Imports de tous les badges par niveau de difficulté
import { EASY_BADGES } from './easyBadges';
import { SIMPLE_BADGES } from './simpleBadges';
import { MEDIUM_BADGES } from './mediumBadges';
import { HARD_BADGES } from './hardBadges';
import { HARDCORE_BADGES } from './hardcoreBadges';
import { IMPOSSIBLE_BADGES } from './impossibleBadges';

// Re-export des helpers pour usage externe si nécessaire
export {
  hasRealNutritionData,
  hasMainMealsWithData,
  calculateFiberFromMeals,
  getTargetValue,
  DateHelper
} from './helpers';

// Export individuel de chaque niveau (pour compatibilité et usage spécifique)
export { EASY_BADGES };
export { SIMPLE_BADGES };
export { MEDIUM_BADGES };
export { HARD_BADGES };
export { HARDCORE_BADGES };
export { IMPOSSIBLE_BADGES };

// Export de tous les badges agrégés (ordre : Facile → Impossible)
export const ALL_BADGES = [
  ...EASY_BADGES,
  ...SIMPLE_BADGES,
  ...MEDIUM_BADGES,
  ...HARD_BADGES,
  ...HARDCORE_BADGES,
  ...IMPOSSIBLE_BADGES
];

// Export par catégorie (pour filtrage/filtres UI)
export const BADGES_BY_DIFFICULTY = {
  easy: EASY_BADGES,
  simple: SIMPLE_BADGES,
  medium: MEDIUM_BADGES,
  hard: HARD_BADGES,
  hardcore: HARDCORE_BADGES,
  impossible: IMPOSSIBLE_BADGES
};

// Statistiques sur les badges (pour affichage UI)
export const BADGES_STATS = {
  total: ALL_BADGES.length,
  byDifficulty: {
    easy: EASY_BADGES.length,
    simple: SIMPLE_BADGES.length,
    medium: MEDIUM_BADGES.length,
    hard: HARD_BADGES.length,
    hardcore: HARDCORE_BADGES.length,
    impossible: IMPOSSIBLE_BADGES.length
  },
  byCategory: ALL_BADGES.reduce((acc, badge) => {
    const category = badge.category || 'other';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {}),
  byRarity: ALL_BADGES.reduce((acc, badge) => {
    const rarity = badge.rarity || 'common';
    acc[rarity] = (acc[rarity] || 0) + 1;
    return acc;
  }, {})
};

