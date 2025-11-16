/**
 * nutritionBadgesDefinitions.js (Wrapper pour backward compatibility)
 * 
 * ⚠️ DEPRECATED : Utiliser './badges' à la place
 * Ce fichier existe uniquement pour la compatibilité ascendante
 * 
 * Tous les badges sont maintenant définis dans badges/ (modularisé par difficulté)
 * - badges/helpers.js : Fonctions utilitaires communes
 * - badges/easyBadges.js : 20 badges FACILES
 * - badges/simpleBadges.js : 20 badges SIMPLES
 * - badges/mediumBadges.js : 20 badges MOYENS
 * - badges/hardBadges.js : 20 badges DIFFICILES
 * - badges/hardcoreBadges.js : 20 badges HARDCORES
 * - badges/impossibleBadges.js : 20 badges IMPOSSIBLES
 * - badges/index.js : Point d'entrée central (agrège tous les badges)
 * 
 * @deprecated Use './badges' instead
 * @module services/nutrition/nutritionBadgesDefinitions
 */

// Re-export tout depuis le nouveau module badges
export {
  ALL_BADGES,
  EASY_BADGES,
  SIMPLE_BADGES,
  MEDIUM_BADGES,
  HARD_BADGES,
  HARDCORE_BADGES,
  IMPOSSIBLE_BADGES,
  BADGES_BY_DIFFICULTY,
  BADGES_STATS,
  hasRealNutritionData,
  hasMainMealsWithData,
  calculateFiberFromMeals,
  getTargetValue,
  DateHelper
} from './badges';

// Warning en dev pour encourager la migration
if (process.env.NODE_ENV === 'development') {
  console.warn(
    '[DEPRECATED] nutritionBadgesDefinitions.js is deprecated. ' +
    'Use "./badges" instead. This file will be removed in a future version.'
  );
}
