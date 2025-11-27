/**
 * nutritionDataCRUD/index.js
 * 
 * Point d'entrée centralisé pour toutes les opérations CRUD nutrition
 * 
 * ✅ PHASE 14.1 : Réorganisation en modules logiques pour maintenabilité
 * 
 * @module hooks/nutritionDataCRUD
 */

// Daily Meals
export {
  getDailyMeal,
  saveDailyMeal,
  getDailyMealsByRange,
  deleteDailyMeal
} from './dailyMeals';

// Meals
export {
  getMeal,
  saveMeal,
  getMealsByDate,
  getMealsByDateAndType,
  getMealsByDailyMealId,
  deleteMeal,
  getMealsByDateRange,
  getAllMeals,
  saveMeals,
  saveMealsBatch
} from './meals';

// Programs
export {
  getAllPrograms,
  getActiveProgram,
  getAllProgramsWithActive,
  saveProgram,
  deleteProgram
} from './programs';

// Favorite Foods
export {
  getFavoriteFoods,
  saveFavoriteFood,
  getFavoriteFood,
  deleteFavoriteFood
} from './favoriteFoods';

// Hydration
export {
  getHydrationLog,
  saveHydrationLog,
  addWaterIntake,
  getHydrationLogByRange,
  deleteHydrationLog
} from './hydration';




