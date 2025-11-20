/**
 * nutritionDataCRUD/hydration.js
 * 
 * Opérations CRUD pour les Hydration Logs
 * 
 * ✅ PHASE 14.1 : Split de nutritionDataCRUD.js pour maintenabilité
 * 
 * @module hooks/nutritionDataCRUD/hydration
 */

import {
  openNutritionDB,
  STORE_HYDRATION_LOG,
  getQuotaSafeStorage,
  QuotaExceededError,
  classifyIndexedDBError,
  NutritionError,
  NutritionErrorCodes,
  createNutritionErrorFromIndexedDB,
  createValidationError,
  getNutritionDataCache,
  validateHydrationLog,
  z,
  putToStoreWithRetry,
  getFromStoreWithRetry,
  deleteFromStoreWithRetry,
  getNutritionRepository,
  log
} from './shared';

/**
 * Récupère l'entrée d'hydratation pour une date
 * 
 * ✅ PHASE 12.2 : Migration vers Repository pattern (rétrocompatible)
 * 
 * @param {string} date - Date au format YYYY-MM-DD
 * @returns {Promise<Object|null>} Entrée d'hydratation ou null
 */
export const getHydrationLog = async (date) => {
  try {
    // ✅ PHASE 12.2 : Utiliser Repository (cache intégré)
    const repository = await getNutritionRepository();
    const result = await repository.get(
      STORE_HYDRATION_LOG,
      date,
      { operationName: 'getHydrationLog' }
    );
    
    if (result) {
      log.debug(`HydrationLog récupéré: ${date}`);
    }
    return result;
  } catch (error) {
    // ✅ Fallback vers méthode originale si Repository échoue
    log.warn('[getHydrationLog] Fallback méthode originale:', error);
    
    try {
      const db = await openNutritionDB();
      if (!db) return null;

      const tx = db.transaction([STORE_HYDRATION_LOG], 'readonly');
      const store = tx.objectStore(STORE_HYDRATION_LOG);
      
      return new Promise((resolve, reject) => {
        const request = store.get(date);
        request.onsuccess = () => {
          const result = request.result || null;
          if (result) {
            log.debug(`HydrationLog récupéré: ${date}`);
          }
          resolve(result);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      log.error('Erreur getHydrationLog:', error);
      return null;
    }
  }
};

/**
 * Sauvegarde ou met à jour une entrée d'hydratation
 * 
 * ✅ PHASE 12.2 : Migration vers Repository pattern (rétrocompatible)
 * 
 * @param {Object} hydrationEntry - Données d'hydratation
 * @param {string} hydrationEntry.date - Date au format YYYY-MM-DD (keyPath)
 * @param {number} hydrationEntry.waterIntake - Quantité d'eau consommée (ml)
 * @param {number} hydrationEntry.targetWater - Objectif d'eau (ml, optionnel, défaut: 2000ml)
 * @param {Array<Object>} hydrationEntry.entries - Entrées détaillées (optionnel)
 * @param {string} hydrationEntry.notes - Notes (optionnel)
 * @returns {Promise<boolean>} true si succès
 */
export const saveHydrationLog = async (hydrationEntry) => {
  try {
    // ✅ PHASE 10.2 : Validation complète avec Zod
    let validatedHydrationLog;
    try {
      validatedHydrationLog = validateHydrationLog(hydrationEntry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        // ✅ Protection : Vérifier que error.errors existe et contient au moins un élément
        if (!error.errors || error.errors.length === 0) {
          log.error('[saveHydrationLog] Erreur validation Zod (pas d\'erreurs détaillées):', error);
          throw createValidationError(
            NutritionErrorCodes.VALIDATION_INVALID_DATA,
            'unknown',
            null,
            'Erreur de validation des données'
          );
        }
        const firstError = error.errors[0];
        const errorPath = Array.isArray(firstError.path) && firstError.path.length > 0 
          ? firstError.path.join('.') 
          : 'unknown';
        const errorField = Array.isArray(firstError.path) && firstError.path.length > 0
          ? firstError.path[0]
          : null;
        log.error('[saveHydrationLog] Erreur validation Zod:', error.errors);
        throw createValidationError(
          NutritionErrorCodes.VALIDATION_INVALID_DATA,
          errorPath,
          hydrationEntry?.[errorField] || null,
          firstError.message || 'Erreur de validation'
        );
      }
      throw error;
    }

    // Valeurs par défaut (déjà validées par Zod, mais appliquer defaults si nécessaire)
    const dataToSave = {
      ...validatedHydrationLog,
      targetWater: validatedHydrationLog.targetWater || 2000, // 2L par défaut si non défini
      lastModified: validatedHydrationLog.lastModified || new Date().toISOString(),
      createdAt: validatedHydrationLog.createdAt || new Date().toISOString()
    };

    // ✅ PHASE 12.2 : Utiliser Repository (validation, cache, observer intégrés)
    try {
      const repository = await getNutritionRepository();
      await repository.save(
        STORE_HYDRATION_LOG,
        dataToSave,
        { validate: false, operationName: 'saveHydrationLog' } // Déjà validé avec Zod
      );
      
      log.debug(`HydrationLog sauvegardé: ${dataToSave.date} (${dataToSave.waterIntake}ml)`);
      return true;
    } catch (error) {
      // ✅ Fallback vers méthode originale si Repository échoue
      log.warn('[saveHydrationLog] Fallback méthode originale:', error);
      
      const db = await openNutritionDB();
      if (!db) return false;

      const tx = db.transaction([STORE_HYDRATION_LOG], 'readwrite');
      const store = tx.objectStore(STORE_HYDRATION_LOG);
      
      return new Promise((resolve, reject) => {
        const request = store.put(dataToSave);
        request.onsuccess = () => {
          log.debug(`HydrationLog sauvegardé: ${dataToSave.date} (${dataToSave.waterIntake}ml)`);
          resolve(true);
        };
        request.onerror = () => reject(request.error);
      });
    }
  } catch (error) {
    log.error('Erreur saveHydrationLog:', error);
    return false;
  }
};

/**
 * Ajoute une quantité d'eau à l'hydratation du jour
 * 
 * @param {string} date - Date au format YYYY-MM-DD
 * @param {number} amount - Quantité d'eau à ajouter (ml)
 * @param {Object} options - Options
 * @param {string} options.entryType - Type d'entrée ('manual', 'bottle', 'glass', etc.)
 * @param {string} options.notes - Notes pour cette entrée
 * @returns {Promise<boolean>} true si succès
 */
export const addWaterIntake = async (date, amount, options = {}) => {
  try {
    if (!date || !amount || amount <= 0) {
      throw new Error('date et amount (positif) requis');
    }

    // Récupérer entrée existante ou créer nouvelle
    const existing = await getHydrationLog(date);
    const currentIntake = existing?.waterIntake || 0;
    const targetWater = existing?.targetWater || 2000;
    const existingEntries = existing?.entries || [];

    // Créer nouvelle entrée détaillée
    const newEntry = {
      id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      amount: amount,
      type: options.entryType || 'manual',
      notes: options.notes || ''
    };

    // Mettre à jour
    const updated = {
      date,
      waterIntake: currentIntake + amount,
      targetWater,
      entries: [...existingEntries, newEntry],
      notes: existing?.notes || '',
      lastModified: new Date().toISOString(),
      createdAt: existing?.createdAt || new Date().toISOString()
    };

    return await saveHydrationLog(updated);
  } catch (error) {
    log.error('Erreur addWaterIntake:', error);
    return false;
  }
};

/**
 * Récupère les entrées d'hydratation sur une plage de dates
 * 
 * ✅ PHASE 12.2 : Migration vers Repository pattern (rétrocompatible)
 * 
 * @param {string} startDate - Date de début (YYYY-MM-DD)
 * @param {string} endDate - Date de fin (YYYY-MM-DD)
 * @returns {Promise<Array>} Tableau d'entrées d'hydratation (triées par date)
 */
export const getHydrationLogByRange = async (startDate, endDate) => {
  try {
    // ✅ PHASE 12.2 : Utiliser Repository avec filtre par plage de dates
    const repository = await getNutritionRepository();
    const allEntries = await repository.getAll(
      STORE_HYDRATION_LOG,
      { 
        filters: (entry) => entry.date >= startDate && entry.date <= endDate,
        operationName: 'getHydrationLogByRange'
      }
    );
    
    // ✅ Trier par date (croissant) comme l'implémentation originale
    allEntries.sort((a, b) => a.date.localeCompare(b.date));
    
    log.debug(`HydrationLog récupéré: ${allEntries.length} entrées entre ${startDate} et ${endDate}`);
    return allEntries;
  } catch (error) {
    // ✅ Fallback vers méthode originale si Repository échoue
    log.warn('[getHydrationLogByRange] Fallback méthode originale:', error);
    
    try {
      const db = await openNutritionDB();
      if (!db) return [];

      const tx = db.transaction([STORE_HYDRATION_LOG], 'readonly');
      const store = tx.objectStore(STORE_HYDRATION_LOG);
      
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => {
          const allEntries = request.result || [];
          
          // Filtrer par plage de dates
          const filtered = allEntries.filter(entry => {
            const entryDate = entry.date;
            return entryDate >= startDate && entryDate <= endDate;
          });
          
          // Trier par date (croissant)
          filtered.sort((a, b) => a.date.localeCompare(b.date));
          
          log.debug(`HydrationLog récupéré: ${filtered.length} entrées entre ${startDate} et ${endDate}`);
          resolve(filtered);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      log.error('Erreur getHydrationLogByRange:', error);
      return [];
    }
  }
};

/**
 * Supprime une entrée d'hydratation
 * 
 * ✅ PHASE 12.2 : Migration vers Repository pattern (rétrocompatible)
 * 
 * @param {string} date - Date au format YYYY-MM-DD
 * @returns {Promise<boolean>} true si succès
 */
export const deleteHydrationLog = async (date) => {
  try {
    // ✅ PHASE 12.2 : Utiliser Repository (cache invalidation + observer intégrés)
    const repository = await getNutritionRepository();
    await repository.delete(
      STORE_HYDRATION_LOG,
      date,
      { operationName: 'deleteHydrationLog' }
    );
    
    log.debug(`HydrationLog supprimé: ${date}`);
    return true;
  } catch (error) {
    // ✅ Fallback vers méthode originale si Repository échoue
    log.warn('[deleteHydrationLog] Fallback méthode originale:', error);
    
    try {
      const db = await openNutritionDB();
      if (!db) return false;

      const tx = db.transaction([STORE_HYDRATION_LOG], 'readwrite');
      const store = tx.objectStore(STORE_HYDRATION_LOG);
      
      return new Promise((resolve, reject) => {
        const request = store.delete(date);
        request.onsuccess = () => {
          log.debug(`HydrationLog supprimé: ${date}`);
          resolve(true);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      log.error('Erreur deleteHydrationLog:', error);
      return false;
    }
  }
};

