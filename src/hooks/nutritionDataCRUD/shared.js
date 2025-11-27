/**
 * nutritionDataCRUD/shared.js
 * 
 * Imports et utilitaires partagés pour tous les modules CRUD
 * 
 * ✅ PHASE 14.1 : Centralisation imports communs pour éviter duplication
 * 
 * @module hooks/nutritionDataCRUD/shared
 */

import { 
  openNutritionDB,
  STORE_DAILY_MEALS,
  STORE_MEALS,
  STORE_PROGRAMS,
  STORE_FAVORITE_FOODS,
  STORE_MEAL_PHOTOS,
  STORE_HYDRATION_LOG,
  STORE_API_CACHE
} from '../nutritionDataUtils';
import { getQuotaSafeStorage, QuotaExceededError } from '../../utils/quotaSafeStorage';
import { classifyIndexedDBError } from '../garminErrorHandler';
import { 
  NutritionError, 
  NutritionErrorCodes,
  createNutritionErrorFromIndexedDB,
  createValidationError
} from '../../utils/nutritionErrors';
import { getNutritionDataCache } from '../../services/nutrition/nutritionDataCache';
import { 
  validateDailyMeal,
  validateMeal,
  validateProgram,
  validateFavoriteFood,
  validateHydrationLog
} from '../../services/nutrition/nutritionSchemas';
import { z } from 'zod';
import {
  putToStoreWithRetry,
  getFromStoreWithRetry,
  deleteFromStoreWithRetry,
  getAllFromStoreWithRetry
} from '../../services/nutrition/nutritionRetryUtils';
// ✅ PHASE 12.2 : Import Repository pour migration progressive
import { getNutritionRepository } from '../../services/nutrition/repository';
// ✅ OPTIMISATION : Validation cohérence stores (évite orphelins, garantit intégrité)
import { validateAfterOperation } from '../../services/nutrition/nutritionStoreConsistency';

// Logger partagé
export const log = {
  debug: (...args) => console.log('[nutritionDataCRUD]', ...args),
  info: (...args) => console.info('[nutritionDataCRUD]', ...args),
  warn: (...args) => console.warn('[nutritionDataCRUD]', ...args),
  error: (...args) => console.error('[nutritionDataCRUD]', ...args)
};

// Exports pour utilisation dans modules séparés
export {
  openNutritionDB,
  STORE_DAILY_MEALS,
  STORE_MEALS,
  STORE_PROGRAMS,
  STORE_FAVORITE_FOODS,
  STORE_MEAL_PHOTOS,
  STORE_HYDRATION_LOG,
  STORE_API_CACHE,
  getQuotaSafeStorage,
  QuotaExceededError,
  classifyIndexedDBError,
  NutritionError,
  NutritionErrorCodes,
  createNutritionErrorFromIndexedDB,
  createValidationError,
  getNutritionDataCache,
  validateDailyMeal,
  validateMeal,
  validateProgram,
  validateFavoriteFood,
  validateHydrationLog,
  z,
  putToStoreWithRetry,
  getFromStoreWithRetry,
  deleteFromStoreWithRetry,
  getAllFromStoreWithRetry,
  getNutritionRepository,
  validateAfterOperation
};




