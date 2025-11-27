/**
 * storeNameMap.js
 * 
 * ✅ PHASE 12.2 : Mapping entre noms de stores simplifiés et noms complets IndexedDB
 * 
 * Permet d'utiliser des noms simplifiés (ex: 'dailyMeals') dans le code
 * tout en mappant vers les noms réels IndexedDB (ex: 'nutrition_dailyMeals').
 * 
 * @module services/nutrition/repository/storeNameMap
 */

// ✅ Mapping entre noms simplifiés et noms complets IndexedDB
export const STORE_NAME_MAP = {
  // DailyMeals
  dailyMeals: 'nutrition_dailyMeals',
  dailyMeal: 'nutrition_dailyMeals',
  
  // Meals
  meals: 'nutrition_meals',
  meal: 'nutrition_meals',
  
  // Programs
  programs: 'nutrition_programs',
  program: 'nutrition_programs',
  
  // FavoriteFoods
  favoriteFoods: 'nutrition_favoriteFoods',
  favoriteFood: 'nutrition_favoriteFoods',
  foods: 'nutrition_favoriteFoods',
  food: 'nutrition_favoriteFoods',
  
  // HydrationLog
  hydrationLog: 'nutrition_hydrationLog',
  hydration: 'nutrition_hydrationLog',
  
  // MealPhotos
  mealPhotos: 'nutrition_mealPhotos',
  mealPhoto: 'nutrition_mealPhotos',
  
  // Gamification
  gamification: 'nutrition_gamification',
  
  // ShareLinks
  shareLinks: 'nutrition_shareLinks',
  shareLink: 'nutrition_shareLinks',
  
  // ProgressPhotos
  progressPhotos: 'nutrition_progressPhotos',
  progressPhoto: 'nutrition_progressPhotos',
  
  // MLModels
  mlModels: 'nutrition_mlModels',
  mlModel: 'nutrition_mlModels',
  
  // APICache
  apiCache: 'nutrition_apiCache'
};

/**
 * Récupère le nom complet du store depuis un nom simplifié
 * 
 * @param {string} storeName - Nom simplifié (ex: 'dailyMeals') ou nom complet (ex: 'nutrition_dailyMeals')
 * @returns {string} Nom complet du store (ex: 'nutrition_dailyMeals')
 * 
 * @example
 * getStoreName('dailyMeals') // 'nutrition_dailyMeals'
 * getStoreName('nutrition_dailyMeals') // 'nutrition_dailyMeals' (déjà complet)
 */
export function getStoreName(storeName) {
  if (!storeName || typeof storeName !== 'string') {
    return storeName; // Retourner tel quel si invalide
  }
  
  // ✅ Si le nom commence déjà par 'nutrition_', c'est déjà un nom complet
  if (storeName.startsWith('nutrition_')) {
    return storeName;
  }
  
  // ✅ Chercher dans le mapping
  const mappedName = STORE_NAME_MAP[storeName];
  if (mappedName) {
    return mappedName;
  }
  
  // ✅ Si non trouvé, retourner tel quel (peut être un nom personnalisé)
  return storeName;
}

/**
 * Vérifie si un nom de store existe dans le mapping
 * 
 * @param {string} storeName - Nom simplifié ou complet
 * @returns {boolean} true si le store existe
 */
export function hasStoreName(storeName) {
  if (!storeName || typeof storeName !== 'string') {
    return false;
  }
  
  // ✅ Si le nom commence par 'nutrition_', considérer comme valide
  if (storeName.startsWith('nutrition_')) {
    return true;
  }
  
  // ✅ Vérifier dans le mapping
  return storeName in STORE_NAME_MAP;
}

/**
 * Récupère tous les noms de stores disponibles
 * 
 * @returns {Array<string>} Tableau des noms complets de stores
 */
export function getAvailableStoreNames() {
  return Object.values(STORE_NAME_MAP);
}

/**
 * Récupère tous les noms simplifiés disponibles
 * 
 * @returns {Array<string>} Tableau des noms simplifiés
 */
export function getSimplifiedStoreNames() {
  return Object.keys(STORE_NAME_MAP);
}





