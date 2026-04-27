/**
 * Hook pour la gestion de la sauvegarde/chargement du contexte
 * 
 * ✅ PHASE 4 : Extraction de la logique de sauvegarde/chargement
 * 
 * @module context/WorkoutContext/hooks/useWorkoutContextStorage
 */

import { useCallback, useRef } from 'react';

/**
 * Hook pour gérer la sauvegarde et le chargement du contexte
 * 
 * @param {Function} loadFromDB - Fonction pour charger depuis la DB
 * @param {Function} setPrograms - Fonction pour définir les programmes
 * @param {Function} setActiveProgram - Fonction pour définir le programme actif
 * @param {Function} setProgramHistory - Fonction pour définir l'historique des programmes
 * @param {Function} setWeekVariant - Fonction pour définir la variante de semaine
 * @param {Function} setIsGymMode - Fonction pour définir le mode gym
 * @returns {Object} { openContextDB, saveContextToDB, loadContext, autoSaveContext, flushAutoSave }
 */
export const useWorkoutContextStorage = (
  setPrograms,
  setActiveProgram,
  setProgramHistory,
  setWeekVariant,
  setIsGymMode,
  contextScopeKey = 'anonymous'
) => {
  const debounceTimerRef = useRef(null);
  const contextRecordId = `context:${contextScopeKey}`;
  const backupKey = `workoutContext_backup:${contextScopeKey}`;
  const legacyBackupKey = 'workoutContext_backup';

  const openContextDB = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        console.error('❌ IndexedDB non supporté');
        reject(new Error('IndexedDB non supporté'));
        return;
      }

      const request = indexedDB.open('WorkoutTrackerContextDB', 1);
      
      request.onupgradeneeded = (event) => {
        try {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('contextData')) {
            const store = db.createObjectStore('contextData', { keyPath: 'id' });
          }
        } catch (error) {
          console.error('❌ Erreur lors de la création de l\'object store:', error);
          reject(error);
        }
      };
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains('contextData')) {
          console.error('❌ Object store contextData manquant');
          reject(new Error('Structure de base de données invalide'));
          return;
        }
        
        resolve(db);
      };
      
      request.onerror = (event) => {
        console.error('❌ Erreur ouverture WorkoutTrackerContextDB:', event.target.error);
        reject(event.target.error);
      };

      request.onblocked = (event) => {
        console.warn('⚠️ Ouverture de WorkoutTrackerContextDB bloquée');
        reject(new Error('Base de données bloquée'));
      };
    });
  }, []);

  const saveContextToDB = useCallback(async (contextData) => {
    const maxRetries = 3;
    
    for (let retryCount = 1; retryCount <= maxRetries; retryCount++) {
      try {
        if (!contextData || typeof contextData !== 'object') {
          throw new Error('Données de contexte invalides');
        }

        const dataToSave = {
          id: contextRecordId,
          ...contextData,
          lastSaved: new Date().toISOString()
        };
        
        const db = await openContextDB();
        const transaction = db.transaction(['contextData'], 'readwrite');
        const store = transaction.objectStore('contextData');
        
        return new Promise((resolve, reject) => {
          const request = store.put(dataToSave);
          
          request.onsuccess = () => {
            try {
              localStorage.setItem(backupKey, JSON.stringify(dataToSave));
            } catch (localStorageError) {
              console.warn('⚠️ Impossible de sauvegarder le contexte en localStorage:', localStorageError);
            }
            
            resolve();
          };
          
          request.onerror = (event) => {
            console.error(`❌ Erreur sauvegarde contexte (tentative ${retryCount}):`, event.target.error);
            reject(event.target.error);
          };
          
          transaction.onerror = (event) => {
            console.error(`❌ Erreur transaction contexte (tentative ${retryCount}):`, event.target.error);
            reject(event.target.error);
          };
        });
        
      } catch (error) {
        console.error(`❌ Erreur lors de la tentative ${retryCount} de sauvegarde du contexte:`, error);
        
        if (retryCount === maxRetries) {
          try {
            localStorage.setItem(backupKey, JSON.stringify({
              id: contextRecordId,
              ...contextData,
              lastSaved: new Date().toISOString()
            }));
          } catch (localStorageError) {
            console.error('❌ Échec de la sauvegarde de secours du contexte:', localStorageError);
          }
          throw error;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }
  }, [openContextDB, backupKey, contextRecordId]);

  const loadContext = useCallback(async () => {
    try {
      // loadFromDB devrait charger depuis IndexedDB, mais ici on charge juste le contexte
      // On utilise openContextDB pour charger directement le contexte
      const db = await openContextDB();
      const transaction = db.transaction(['contextData'], 'readonly');
      const store = transaction.objectStore('contextData');
      
      return new Promise((resolve, reject) => {
        const request = store.get(contextRecordId);
        
        request.onsuccess = () => {
          const savedContext = request.result;
          const applyContext = (ctx) => {
            if (!ctx) return;
            if (ctx.programs) {
              setPrograms(ctx.programs);
            }
            if (ctx.activeProgram) {
              setActiveProgram(ctx.activeProgram);
            }
            if (ctx.programHistory) {
              setProgramHistory(ctx.programHistory);
            }
            if (ctx.weekVariant) {
              setWeekVariant(ctx.weekVariant);
            }
            if (ctx.isGymMode !== undefined) {
              setIsGymMode(ctx.isGymMode);
            }
          };

          if (savedContext) {
            applyContext(savedContext);
            resolve(savedContext);
          } else {
            // Migration douce legacy -> scope utilisateur
            const legacyRequest = store.get('context');
            legacyRequest.onsuccess = async () => {
              const legacyContext = legacyRequest.result;
              if (legacyContext) {
                const migratedContext = { ...legacyContext, id: contextRecordId };
                applyContext(migratedContext);
                try {
                  const writeTx = db.transaction(['contextData'], 'readwrite');
                  const writeStore = writeTx.objectStore('contextData');
                  writeStore.put(migratedContext);
                } catch {
                  // ignore migration write error
                }
                resolve(migratedContext);
                return;
              }

              // Tenter backup scope puis backup legacy
              const scopeBackup = localStorage.getItem(backupKey);
              const legacyBackup = localStorage.getItem(legacyBackupKey);
              const backupCandidate = scopeBackup || legacyBackup;
              if (backupCandidate) {
                try {
                  const parsedBackup = JSON.parse(backupCandidate);
                  const normalized = { ...parsedBackup, id: contextRecordId };
                  applyContext(normalized);
                  console.warn('⚠️ Contexte chargé depuis localStorage backup');
                  resolve(normalized);
                } catch (parseError) {
                  console.error('❌ Erreur parsing localStorage backup:', parseError);
                  resolve(null);
                }
              } else {
                resolve(null);
              }
            };
            legacyRequest.onerror = () => resolve(null);
          }
        };
        
        request.onerror = (event) => {
          console.error('❌ Erreur lecture contexte depuis IndexedDB:', event.target.error);
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error('❌ Erreur chargement contexte:', error);
      return null;
    }
  }, [
    openContextDB,
    setPrograms,
    setActiveProgram,
    setProgramHistory,
    setWeekVariant,
    setIsGymMode,
    contextRecordId,
    backupKey
  ]);

  const flushAutoSave = useCallback((contextData) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    return saveContextToDB(contextData);
  }, [saveContextToDB]);

  const autoSaveContext = useCallback(
    (contextData) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        saveContextToDB(contextData);
      }, 350);
    },
    [saveContextToDB]
  );

  return {
    openContextDB,
    saveContextToDB,
    loadContext,
    autoSaveContext,
    flushAutoSave,
  };
};
