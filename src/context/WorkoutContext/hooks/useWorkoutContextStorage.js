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
 * @returns {Object} { openContextDB, saveContextToDB, loadContext, autoSaveContext }
 */
export const useWorkoutContextStorage = (
  setPrograms,
  setActiveProgram,
  setProgramHistory,
  setWeekVariant,
  setIsGymMode
) => {
  const debounceTimerRef = useRef(null);

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
          id: 'context',
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
              localStorage.setItem('workoutContext_backup', JSON.stringify(dataToSave));
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
            localStorage.setItem('workoutContext_backup', JSON.stringify({
              id: 'context',
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
  }, [openContextDB]);

  const loadContext = useCallback(async () => {
    try {
      // loadFromDB devrait charger depuis IndexedDB, mais ici on charge juste le contexte
      // On utilise openContextDB pour charger directement le contexte
      const db = await openContextDB();
      const transaction = db.transaction(['contextData'], 'readonly');
      const store = transaction.objectStore('contextData');
      
      return new Promise((resolve, reject) => {
        const request = store.get('context');
        
        request.onsuccess = () => {
          const savedContext = request.result;
          if (savedContext) {
            if (savedContext.programs) {
              setPrograms(savedContext.programs);
            }
            if (savedContext.activeProgram) {
              setActiveProgram(savedContext.activeProgram);
            }
            if (savedContext.programHistory) {
              setProgramHistory(savedContext.programHistory);
            }
            if (savedContext.weekVariant) {
              setWeekVariant(savedContext.weekVariant);
            }
            if (savedContext.isGymMode !== undefined) {
              setIsGymMode(savedContext.isGymMode);
            }
            resolve(savedContext);
          } else {
            // Tenter de charger depuis localStorage si IndexedDB est vide
            const localStorageBackup = localStorage.getItem('workoutContext_backup');
            if (localStorageBackup) {
              try {
                const parsedBackup = JSON.parse(localStorageBackup);
                if (parsedBackup.programs) {
                  setPrograms(parsedBackup.programs);
                }
                if (parsedBackup.activeProgram) {
                  setActiveProgram(parsedBackup.activeProgram);
                }
                if (parsedBackup.programHistory) {
                  setProgramHistory(parsedBackup.programHistory);
                }
                if (parsedBackup.weekVariant) {
                  setWeekVariant(parsedBackup.weekVariant);
                }
                if (parsedBackup.isGymMode !== undefined) {
                  setIsGymMode(parsedBackup.isGymMode);
                }
                console.warn('⚠️ Contexte chargé depuis localStorage (IndexedDB vide)');
                resolve(parsedBackup);
              } catch (parseError) {
                console.error('❌ Erreur parsing localStorage backup:', parseError);
                resolve(null);
              }
            } else {
              resolve(null);
            }
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
  }, [openContextDB, setPrograms, setActiveProgram, setProgramHistory, setWeekVariant, setIsGymMode]);

  const autoSaveContext = useCallback((contextData) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      saveContextToDB(contextData);
    }, 1000);
  }, [saveContextToDB]);

  return {
    openContextDB,
    saveContextToDB,
    loadContext,
    autoSaveContext,
  };
};
