/**
 * repository/index.js
 * 
 * ✅ PHASE 12.2 : Barrel exports pour le module Repository
 * 
 * @module services/nutrition/repository
 */

export { NutritionRepository } from './NutritionRepository';
export { RepositoryObserver, getRepositoryObserver } from './repositoryObserver';
export { IndexedDBRepository } from './IndexedDBRepository';
export { LocalStorageRepository } from './LocalStorageRepository';
export { MemoryRepository } from './MemoryRepository';
export {
  getNutritionRepository,
  getCurrentRepositoryType,
  resetRepository,
  setRepositoryOverride,
  isRepositoryTypeAvailable,
  getRepositoryStats,
  RepositoryType
} from './repositoryFactory';
export { getStoreName, hasStoreName, getAvailableStoreNames, STORE_NAME_MAP } from './storeNameMap';
