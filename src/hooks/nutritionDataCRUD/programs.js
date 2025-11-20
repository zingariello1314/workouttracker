/**
 * nutritionDataCRUD/programs.js
 * 
 * Opérations CRUD pour les Programs
 * 
 * ✅ PHASE 14.1 : Split de nutritionDataCRUD.js pour maintenabilité
 * 
 * @module hooks/nutritionDataCRUD/programs
 */

import {
  openNutritionDB,
  STORE_PROGRAMS,
  getQuotaSafeStorage,
  QuotaExceededError,
  classifyIndexedDBError,
  NutritionError,
  NutritionErrorCodes,
  createNutritionErrorFromIndexedDB,
  createValidationError,
  getNutritionDataCache,
  validateProgram,
  z,
  putToStoreWithRetry,
  getFromStoreWithRetry,
  deleteFromStoreWithRetry,
  getNutritionRepository,
  validateAfterOperation,
  log
} from './shared';

/**
 * Récupère tous les programmes
 * 
 * ✅ PHASE 12.2 : Migration vers Repository pattern (rétrocompatible)
 * 
 * @returns {Promise<Array>} Tableau de programs
 */
export const getAllPrograms = async () => {
  try {
    // ✅ PHASE 12.2 : Utiliser Repository getAll (simple et efficace)
    const repository = await getNutritionRepository();
    const allPrograms = await repository.getAll(
      STORE_PROGRAMS,
      { operationName: 'getAllPrograms' }
    );
    return allPrograms;
  } catch (error) {
    // ✅ Fallback vers méthode originale si Repository échoue
    log.warn('[getAllPrograms] Fallback méthode originale:', error);
    
    try {
      const db = await openNutritionDB();
      if (!db) return [];

      const tx = db.transaction([STORE_PROGRAMS], 'readonly');
      const store = tx.objectStore(STORE_PROGRAMS);
      
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      log.error('Erreur getAllPrograms:', error);
      return [];
    }
  }
};

/**
 * Récupère le programme actif
 * 
 * ✅ PHASE 10.1 : Cache en mémoire avec TTL long (changent rarement)
 * ✅ PHASE 12.2 : Migration vers Repository pattern (rétrocompatible)
 * 
 * @param {Object} [options] - Options additionnelles
 * @param {boolean} [options.skipCache] - Forcer skip cache (défaut: false)
 * @returns {Promise<Object|null>} Programme actif ou null
 */
export const getActiveProgram = async (options = {}) => {
  const { skipCache = false } = options;
  
  try {
    // ✅ PHASE 12.2 : Utiliser Repository avec filtre isActive (cache intégré)
    const repository = await getNutritionRepository();
    const allPrograms = await repository.getAll(
      STORE_PROGRAMS,
      { 
        filters: (program) => program.isActive === true,
        operationName: 'getActiveProgram',
        skipCache 
      }
    );
    
    // ✅ Retourner le premier programme actif (normalement il n'y en a qu'un)
    return allPrograms.length > 0 ? allPrograms[0] : null;
  } catch (error) {
    // ✅ Fallback vers méthode originale si Repository échoue
    log.warn('[getActiveProgram] Fallback méthode originale:', error);
    
    const cache = getNutritionDataCache();
    const cacheKey = cache.generateKey('activeProgram', 'current');
    
    try {
      return await cache.get(
        cacheKey,
        async () => {
          try {
            const db = await openNutritionDB();
            if (!db) return null;

            const tx = db.transaction([STORE_PROGRAMS], 'readonly');
            const store = tx.objectStore(STORE_PROGRAMS);
            
            // ✅ CORRECTION : IDBKeyRange.only(true) ne fonctionne pas avec les booléens
            // Récupérer tous les programmes et filtrer manuellement
            return new Promise((resolve, reject) => {
              const request = store.getAll();
              
              request.onsuccess = () => {
                const programs = request.result || [];
                // Filtrer pour trouver le programme actif
                const activeProgram = programs.find(p => p.isActive === true);
                resolve(activeProgram || null);
              };
              request.onerror = () => reject(request.error);
            });
          } catch (error) {
            log.error('Erreur getActiveProgram:', error);
            return null;
          }
        },
        'activeProgram',
        { skipCache }
      );
    } catch (error) {
      log.error('Erreur getActiveProgram (cache):', error);
      return null;
    }
  }
};

/**
 * ✅ OPTIMISATION 1.3 : Récupère tous les programmes ET le programme actif en une seule transaction
 * 
 * Gain : 50% réduction overhead (1 transaction au lieu de 2)
 * ✅ PHASE 12.2 : Migration vers Repository pattern (rétrocompatible)
 * 
 * @returns {Promise<{programs: Array, activeProgram: Object|null}>}
 */
export const getAllProgramsWithActive = async () => {
  try {
    // ✅ PHASE 12.2 : Utiliser Repository getAll (une seule transaction)
    const repository = await getNutritionRepository();
    const programs = await repository.getAll(
      STORE_PROGRAMS,
      { operationName: 'getAllProgramsWithActive' }
    );
    
    // ✅ Filtrer programme actif (normalement il n'y en a qu'un)
    const activeProgram = programs.find(p => p.isActive === true) || null;
    
    return { programs, activeProgram };
  } catch (error) {
    // ✅ Fallback vers méthode originale si Repository échoue
    log.warn('[getAllProgramsWithActive] Fallback méthode originale:', error);
    
    try {
      const db = await openNutritionDB();
      if (!db) return { programs: [], activeProgram: null };

      const tx = db.transaction([STORE_PROGRAMS], 'readonly');
      const store = tx.objectStore(STORE_PROGRAMS);
      
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        
        request.onsuccess = () => {
          const programs = request.result || [];
          // ✅ Filtrer programme actif dans la même transaction
          const activeProgram = programs.find(p => p.isActive === true) || null;
          resolve({ programs, activeProgram });
        };
        
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      log.error('Erreur getAllProgramsWithActive:', error);
      return { programs: [], activeProgram: null };
    }
  }
};

/**
 * ✅ OPTIMISATION 1.4 : Désactive tous les programmes (utilisé avant d'activer un nouveau)
 * 
 * ✅ PHASE 12.2 : Migration vers Repository batch (transaction atomique)
 * 
 * @param {IDBDatabase} db - Instance de la DB (optionnel, déprécié avec Repository)
 * @returns {Promise<void>}
 */
const deactivateAllPrograms = async (db = null) => {
  try {
    // ✅ PHASE 12.2 : Utiliser Repository batch pour désactiver tous les programmes actifs
    try {
      const repository = await getNutritionRepository();
      
      // ✅ Récupérer tous les programmes actifs
      const allPrograms = await repository.getAll(
        STORE_PROGRAMS,
        { 
          filters: (program) => program.isActive === true,
          operationName: 'deactivateAllPrograms:get'
        }
      );
      
      if (allPrograms.length === 0) {
        return; // Rien à désactiver
      }
      
      // ✅ Créer opérations batch pour désactiver tous les programmes actifs
      const operations = allPrograms.map(program => ({
        type: 'save',
        store: STORE_PROGRAMS,
        data: { ...program, isActive: false }
      }));
      
      // ✅ Exécuter batch (transaction atomique)
      const result = await repository.batch(operations, { operationName: 'deactivateAllPrograms' });
      
      if (!result.success) {
        log.warn('[deactivateAllPrograms] Erreur batch, fallback méthode originale');
        throw new Error('Batch failed');
      }
      
      log.debug(`[deactivateAllPrograms] ${allPrograms.length} programmes désactivés`);
      return;
    } catch (error) {
      // ✅ Fallback vers méthode originale si Repository échoue
      log.warn('[deactivateAllPrograms] Fallback méthode originale:', error);
      
      if (!db) {
        db = await openNutritionDB();
        if (!db) return;
      }

      const tx = db.transaction([STORE_PROGRAMS], 'readwrite');
      const store = tx.objectStore(STORE_PROGRAMS);
      
      return new Promise((resolve, reject) => {
        // ✅ CORRECTION : IDBKeyRange.only(true) ne fonctionne pas avec les booléens
        // Récupérer tous les programmes actifs et les désactiver
        const request = store.getAll();
        
        request.onsuccess = () => {
          const programs = request.result || [];
          const activePrograms = programs.filter(p => p.isActive === true);
          
          if (activePrograms.length === 0) {
            resolve();
            return;
          }
          
          // ✅ OPTIMISATION 1.4 : Tous les put() dans la même transaction (exécution batch automatique par IndexedDB)
          activePrograms.forEach(program => {
            program.isActive = false;
            store.put(program); // ✅ Pas besoin de gérer les callbacks individuels
          });
          
          // ✅ Transaction complète résolue automatiquement
          tx.oncomplete = () => resolve();
          tx.onerror = () => {
            log.error('Erreur transaction deactivateAllPrograms:', tx.error);
            reject(tx.error);
          };
        };
        
        request.onerror = () => reject(request.error);
      });
    }
  } catch (error) {
    log.error('Erreur deactivateAllPrograms:', error);
  }
};

/**
 * Sauvegarde ou met à jour un programme
 * 
 * ✅ OPTIMISATION 4.2 : Accepte dbInstance optionnel pour éviter double ouverture DB
 * ✅ PHASE 12.2 : Migration vers Repository pattern (rétrocompatible)
 * 
 * @param {Object} program - Données du programme (doit contenir 'id')
 * @param {Object} options - Options optionnelles
 * @param {IDBDatabase} options.dbInstance - Instance de la DB (évite réouverture, déprécié avec Repository)
 * @returns {Promise<boolean>} true si succès
 */
export const saveProgram = async (program, options = {}) => {
  try {
    // ✅ PHASE 10.2 : Validation complète avec Zod
    let validatedProgram;
    try {
      validatedProgram = validateProgram(program);
    } catch (error) {
      if (error instanceof z.ZodError) {
        // ✅ Protection : Vérifier que error.errors existe et contient au moins un élément
        if (!error.errors || error.errors.length === 0) {
          log.error('[saveProgram] Erreur validation Zod (pas d\'erreurs détaillées):', error);
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
        log.error('[saveProgram] Erreur validation Zod:', error.errors);
        throw createValidationError(
          NutritionErrorCodes.VALIDATION_INVALID_DATA,
          errorPath,
          program?.[errorField] || null,
          firstError.message || 'Erreur de validation'
        );
      }
      throw error;
    }

    // Utiliser validatedProgram pour sauvegarde
    const dataToSave = validatedProgram;

    // ✅ PHASE 12.2 : Utiliser Repository (validation, cache, observer intégrés)
    try {
      const repository = await getNutritionRepository();
      
      // ✅ Si programme devient actif, désactiver les autres via batch
      if (validatedProgram.isActive) {
        await deactivateAllPrograms(); // ✅ Utiliser Repository batch
      }
      
      // ✅ Sauvegarder le programme
      await repository.save(
        STORE_PROGRAMS,
        dataToSave,
        { validate: false, operationName: 'saveProgram' } // Déjà validé avec Zod
      );
      
      // ✅ OPTIMISATION : Valider cohérence après activation (s'assurer qu'un seul est actif)
      if (validatedProgram.isActive) {
        try {
          await validateAfterOperation('activateProgram', dataToSave.id, { autoFix: true, verbose: false });
        } catch (validationError) {
          log.warn('[saveProgram] Erreur validation cohérence (non bloquant):', validationError);
        }
      }
      
      log.debug(`Program sauvegardé: ${dataToSave.id}`);
      return true;
    } catch (error) {
      // ✅ Fallback vers méthode originale si Repository échoue
      log.warn('[saveProgram] Fallback méthode originale:', error);
      
      const { dbInstance = null } = options;
      const db = dbInstance || await openNutritionDB();
      if (!db) return false;

      // Si programme devient actif, désactiver les autres (utiliser validatedProgram)
      if (validatedProgram.isActive) {
        await deactivateAllPrograms(db); // ✅ Utiliser DB existante
      }

      const tx = db.transaction([STORE_PROGRAMS], 'readwrite');
      const store = tx.objectStore(STORE_PROGRAMS);
      
      // ✅ PHASE 10.4 : Retry automatique avec backoff exponentiel
      try {
        await putToStoreWithRetry(
          store,
          dataToSave,
          'saveProgram',
          { programId: dataToSave.id, storeName: STORE_PROGRAMS }
        );
        
        log.debug(`Program sauvegardé: ${dataToSave.id}`);
        
        // ✅ PHASE 10.1 : Invalider cache après sauvegarde
        const cache = getNutritionDataCache();
        // Invalider cache programme actif (si activé/désactivé)
        cache.invalidate(cache.generateKey('activeProgram', 'current'));
        // Invalider aussi cache programmes (si modification)
        cache.invalidateType('program');
        
        return true;
      } catch (error) {
        // ✅ OPTIMISATION : Convertir erreur IndexedDB en NutritionError standardisée
        const nutritionError = createNutritionErrorFromIndexedDB(
          error,
          'saveProgram',
          { programId: dataToSave.id, storeName: STORE_PROGRAMS }
        );
        log.error('[saveProgram] Erreur IndexedDB après retry:', nutritionError.toJSON());
        throw nutritionError;
      }
    }
  } catch (error) {
    log.error('Erreur saveProgram:', error);
    return false;
  }
};

/**
 * Supprime un programme
 * 
 * ✅ PHASE 12.2 : Migration vers Repository pattern (rétrocompatible)
 * 
 * @param {string} programId - ID du programme
 * @returns {Promise<boolean>} true si succès
 */
export const deleteProgram = async (programId) => {
  try {
    // ✅ PHASE 12.2 : Utiliser Repository (cache invalidation + observer intégrés)
    const repository = await getNutritionRepository();
    await repository.delete(
      STORE_PROGRAMS,
      programId,
      { operationName: 'deleteProgram' }
    );
    
    // ✅ OPTIMISATION : Valider cohérence après suppression (nettoyer références orphelines)
    try {
      await validateAfterOperation('deleteProgram', programId, { autoFix: true, verbose: false });
    } catch (validationError) {
      log.warn('[deleteProgram] Erreur validation cohérence (non bloquant):', validationError);
    }
    
    log.debug(`Program supprimé: ${programId}`);
    return true;
  } catch (error) {
    // ✅ Fallback vers méthode originale si Repository échoue
    log.warn('[deleteProgram] Fallback méthode originale:', error);
    
    try {
      const db = await openNutritionDB();
      if (!db) return false;

      const tx = db.transaction([STORE_PROGRAMS], 'readwrite');
      const store = tx.objectStore(STORE_PROGRAMS);
      
      return new Promise((resolve, reject) => {
        const request = store.delete(programId);
        request.onsuccess = () => {
          log.debug(`Program supprimé: ${programId}`);
          
          // ✅ PHASE 10.1 : Invalider cache après suppression
          const cache = getNutritionDataCache();
          // Invalider cache programme actif (peut-être supprimé)
          cache.invalidate(cache.generateKey('activeProgram', 'current'));
          // Invalider aussi cache programmes
          cache.invalidateType('program');
          
          resolve(true);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      log.error('Erreur deleteProgram:', error);
      return false;
    }
  }
};

