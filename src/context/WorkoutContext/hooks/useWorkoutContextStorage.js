/**
 * Hook pour la gestion de la sauvegarde/chargement du contexte
 *
 * ✅ PHASE 4 : Extraction de la logique de sauvegarde/chargement
 * Persistance via `LocalWorkoutRepository` / `workoutContextGateway` (même DB que la couche sync).
 *
 * @module context/WorkoutContext/hooks/useWorkoutContextStorage
 */

import { useCallback, useRef } from 'react';
import { createWorkoutRepository } from '../../../services/workout/createWorkoutRepository.js';
import {
  getLegacyUnscopedContext,
  openWorkoutContextDb,
  putContextRow,
} from '../../../services/workout/workoutContextGateway.js';
import { tryMergeSportProgramContextFromCloud } from '../../../services/sport/sportProgramContextCloud.js';

/**
 * Hook pour gérer la sauvegarde et le chargement du contexte
 *
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
  const contextRepoRef = useRef(null);
  const contextRecordId = `context:${contextScopeKey}`;
  const backupKey = `workoutContext_backup:${contextScopeKey}`;
  const legacyBackupKey = 'workoutContext_backup';

  const getContextRepo = useCallback(() => {
    if (typeof window === 'undefined') return null;
    if (!contextRepoRef.current) {
      contextRepoRef.current = createWorkoutRepository('local');
    }
    return contextRepoRef.current;
  }, []);

  const openContextDB = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        console.error('❌ IndexedDB non supporté');
        reject(new Error('IndexedDB non supporté'));
        return;
      }

      openWorkoutContextDb()
        .then((db) => {
          if (!db) {
            console.error('❌ IndexedDB non supporté');
            reject(new Error('IndexedDB non supporté'));
            return;
          }
          if (!db.objectStoreNames.contains('contextData')) {
            console.error('❌ Object store contextData manquant');
            reject(new Error('Structure de base de données invalide'));
            return;
          }
          resolve(db);
        })
        .catch((err) => {
          console.error('❌ Erreur ouverture WorkoutTrackerContextDB:', err);
          reject(err);
        });
    });
  }, []);

  const saveContextToDB = useCallback(
    async (contextData) => {
      const maxRetries = 3;
      const repo = getContextRepo();

      for (let retryCount = 1; retryCount <= maxRetries; retryCount++) {
        try {
          if (!contextData || typeof contextData !== 'object') {
            throw new Error('Données de contexte invalides');
          }

          const dataToSave = {
            id: contextRecordId,
            ...contextData,
            lastSaved: new Date().toISOString(),
          };

          if (!repo) {
            throw new Error('WORKOUT_CONTEXT_REPO_UNAVAILABLE');
          }

          await repo.saveProgramContext(contextScopeKey, contextData);

          try {
            localStorage.setItem(backupKey, JSON.stringify(dataToSave));
          } catch (localStorageError) {
            console.warn('⚠️ Impossible de sauvegarder le contexte en localStorage:', localStorageError);
          }

          return;
        } catch (error) {
          console.error(`❌ Erreur lors de la tentative ${retryCount} de sauvegarde du contexte:`, error);

          if (retryCount === maxRetries) {
            try {
              localStorage.setItem(
                backupKey,
                JSON.stringify({
                  id: contextRecordId,
                  ...contextData,
                  lastSaved: new Date().toISOString(),
                })
              );
            } catch (localStorageError) {
              console.error('❌ Échec de la sauvegarde de secours du contexte:', localStorageError);
            }
            throw error;
          }

          await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
        }
      }
    },
    [getContextRepo, backupKey, contextRecordId, contextScopeKey]
  );

  const loadContext = useCallback(async () => {
    const applyContext = (ctx) => {
      if (!ctx) return;
      if (Array.isArray(ctx.programs)) {
        setPrograms(ctx.programs);
      }
      if ('activeProgram' in ctx) {
        setActiveProgram(ctx.activeProgram ?? null);
      }
      if (Array.isArray(ctx.programHistory)) {
        setProgramHistory(ctx.programHistory);
      }
      if (ctx.weekVariant) {
        setWeekVariant(ctx.weekVariant);
      }
      if (ctx.isGymMode !== undefined) {
        setIsGymMode(ctx.isGymMode);
      }
    };

    try {
      const mergedFromCloud = await tryMergeSportProgramContextFromCloud(contextScopeKey);
      if (mergedFromCloud) {
        const applied = { id: contextRecordId, ...mergedFromCloud };
        applyContext(applied);
        try {
          await saveContextToDB(mergedFromCloud);
        } catch (e) {
          console.warn('⚠️ Persistance après merge cloud sport:', e);
        }
        return { ...applied, lastSaved: new Date().toISOString() };
      }

      const repo = getContextRepo();
      if (repo) {
        const partial = await repo.loadProgramContext(contextScopeKey).catch(() => null);
        // Ligne résiduelle { id, lastSaved } seule → `{}` : continuer vers legacy / backups.
        if (partial != null && Object.keys(partial).length > 0) {
          const savedContext = { id: contextRecordId, ...partial };
          applyContext(savedContext);
          return savedContext;
        }
      }

      const legacyContext = await getLegacyUnscopedContext().catch(() => null);
      if (legacyContext) {
        const migratedContext = { ...legacyContext, id: contextRecordId };
        applyContext(migratedContext);
        try {
          await putContextRow(contextScopeKey, legacyContext);
        } catch {
          // ignore migration write error
        }
        return migratedContext;
      }

      const scopeBackup = localStorage.getItem(backupKey);
      const legacyBackup = localStorage.getItem(legacyBackupKey);
      const backupCandidate = scopeBackup || legacyBackup;
      if (backupCandidate) {
        try {
          const parsedBackup = JSON.parse(backupCandidate);
          const normalized = { ...parsedBackup, id: contextRecordId };
          applyContext(normalized);
          console.warn('⚠️ Contexte chargé depuis localStorage backup');
          return normalized;
        } catch (parseError) {
          console.error('❌ Erreur parsing localStorage backup:', parseError);
          return null;
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Erreur chargement contexte:', error);
      return null;
    }
  }, [
    getContextRepo,
    setPrograms,
    setActiveProgram,
    setProgramHistory,
    setWeekVariant,
    setIsGymMode,
    contextRecordId,
    contextScopeKey,
    backupKey,
    saveContextToDB,
  ]);

  const flushAutoSave = useCallback(
    (contextData) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      return saveContextToDB(contextData);
    },
    [saveContextToDB]
  );

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
