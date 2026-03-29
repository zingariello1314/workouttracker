/**
 * ✅ PHASE 1.2 : Module de traitement des réponses de synchronisation Garmin
 * 
 * Ce module contient la fonction `processSyncResponse` qui gère :
 * - Sauvegarde des activités et métriques dans IndexedDB
 * - Mise à jour de la date de dernière synchronisation
 * - Rechargement des données complètes depuis IndexedDB (fusionnées)
 * - Import automatique vers l'onglet Endurance
 * 
 * Optimisations :
 * - Sauvegarde AVANT mise à jour de l'état (garantit cohérence)
 * - Rechargement depuis IndexedDB pour afficher données fusionnées
 * - Logging détaillé pour diagnostic (durées, compteurs)
 * - Gestion fallback si IndexedDB non disponible
 * 
 * @module garminSyncProcessor
 */

import logger from '../../../../utils/logger';
import { getTodayDateStr } from './garminDateUtils';

const log = logger.module('garminSyncProcessor');

/**
 * Traite la réponse de synchronisation Garmin
 * 
 * Cette fonction orchestre le traitement complet d'une réponse de sync :
 * 1. Sauvegarde les activités et métriques dans IndexedDB
 * 2. Met à jour la date de dernière synchronisation
 * 3. Recharge les données complètes depuis IndexedDB (pour afficher données fusionnées)
 * 4. Met à jour l'état avec les données complètes
 * 5. Importe automatiquement vers l'onglet Endurance si activités présentes
 * 
 * ⚠️ IMPORTANT : La sauvegarde se fait AVANT la mise à jour de l'état pour garantir
 * la cohérence des données. Le rechargement depuis IndexedDB garantit qu'on affiche
 * toutes les données fusionnées, pas seulement celles de la sync actuelle.
 * 
 * @param {Object} json - Réponse JSON du serveur
 * @param {Object} syncDateRange - Plage de dates de synchronisation (optionnel)
 * @param {string} syncDateRange.startDate - Date de début (YYYY-MM-DD)
 * @param {string} syncDateRange.endDate - Date de fin (YYYY-MM-DD)
 * @param {boolean} dbReady - Si IndexedDB est prêt
 * @param {Function} saveActivities - Fonction pour sauvegarder les activités
 * @param {Function} saveDailyMetrics - Fonction pour sauvegarder les métriques
 * @param {Function} setGarminData - Fonction pour mettre à jour l'état des données
 * @param {Function} setLastSyncDate - Fonction pour mettre à jour la date de dernière sync
 * @param {Function} loadAllData - Fonction pour charger toutes les données depuis IndexedDB
 * @param {Function|null} importToEndurance - Fonction pour importer vers Endurance (optionnel)
 * @param {boolean} skipLastSyncUpdate - Si true, ne met pas à jour la date de dernière sync (pour backfill)
 * @returns {Promise<void>} Promise résolue quand le traitement est terminé
 * 
 * @example
 * await processSyncResponse(
 *   jsonResponse,
 *   { startDate: '2025-01-01', endDate: '2025-01-15' },
 *   true, // dbReady
 *   saveActivities,
 *   saveDailyMetrics,
 *   setGarminData,
 *   setLastSyncDate,
 *   loadAllData,
 *   importToEndurance
 * );
 */
export const processSyncResponse = async (
  json,
  syncDateRange = null,
  dbReady,
  saveActivities,
  saveDailyMetrics,
  setGarminData,
  setLastSyncDate,
  loadAllData,
  importToEndurance = null,
  skipLastSyncUpdate = false
) => {
  // Validation des paramètres
  if (!json || typeof json !== 'object') {
    log.warn('[processSyncResponse] Invalid JSON response');
    return;
  }
  
  // Logging détaillé du traitement
  const processStartTime = Date.now();
  log.info(`[🔍 DIAGNOSTIC] Début traitement réponse - OK: ${json.ok}, Data présent: ${!!json.data}`);
  
  // Vérifier que la réponse est valide et contient des données
  if (!json.data || !json.ok) {
    log.warn('[processSyncResponse] Response not OK or no data');
    return;
  }
  
  // Sauvegarder dans IndexedDB AVANT de mettre à jour l'état
  if (dbReady) {
    try {
      const saveStartTime = Date.now();
      
      // Compter les activités et métriques avant sauvegarde
      const activitiesBeforeSave = Object.values(json.data.activities || {}).reduce(
        (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
        0
      );
      const dailyMetricsBeforeSave = Object.keys(json.data.dailyMetrics || {}).length;
      
      log.info(`[🔍 DIAGNOSTIC] Sauvegarde IndexedDB - Activités: ${activitiesBeforeSave}, Métriques: ${dailyMetricsBeforeSave}`);
      
      // Sauvegarder activités et métriques
      await saveActivities(json.data.activities || {});
      await saveDailyMetrics(json.data.dailyMetrics || {});
      
      const saveDuration = Date.now() - saveStartTime;
      log.info(`[🔍 DIAGNOSTIC] Sauvegarde IndexedDB terminée - Durée: ${saveDuration}ms`);
      
      // Mettre à jour la date de dernière synchronisation (sauf si skipLastSyncUpdate)
      if (!skipLastSyncUpdate) {
        const syncTimestamp = new Date().toISOString();
        let syncDateToSave = null;
        
        if (syncDateRange && syncDateRange.endDate) {
          syncDateToSave = syncDateRange.endDate;
        } else {
          // Par défaut, utiliser aujourd'hui
          syncDateToSave = getTodayDateStr();
        }
        
        await setLastSyncDate(syncDateToSave);
        log.info(`[🔍 DIAGNOSTIC] Timestamp de dernière sync mis à jour: ${syncDateToSave} (timestamp: ${syncTimestamp})`);
      } else {
        log.info(`[🔍 DIAGNOSTIC] Skip mise à jour lastSyncDate (backfill)`);
      }
      
      // Recharger les données depuis IndexedDB pour avoir les données complètes (fusionnées)
      // Cela garantit qu'on affiche toutes les données, pas seulement celles de la sync actuelle
      const loadStartTime = Date.now();
      const allData = await loadAllData();
      const loadDuration = Date.now() - loadStartTime;
      
      const activitiesAfterLoad = Object.values(allData.activities || {}).reduce(
        (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
        0
      );
      const dailyMetricsAfterLoad = Object.keys(allData.dailyMetrics || {}).length;
      
      log.info(`[🔍 DIAGNOSTIC] Données rechargées depuis IndexedDB - Durée: ${loadDuration}ms, Activités: ${activitiesAfterLoad}, Métriques: ${dailyMetricsAfterLoad}`);
      
      // Mettre à jour l'état avec les données complètes
      setGarminData(allData);
      
    } catch (error) {
      log.error('[processSyncResponse] Error saving to IndexedDB:', error);
      // Fallback : utiliser les données de la réponse directement
      setGarminData(json.data);
    }
  } else {
    // Fallback : IndexedDB non disponible, utiliser les données directement
    log.warn('[processSyncResponse] IndexedDB not ready, using response data directly');
    setGarminData(json.data);
    
    // Sauvegarder aussi la date de sync en fallback (sauf si skipLastSyncUpdate)
    if (!skipLastSyncUpdate) {
      try {
        let syncDateToSave = null;
        
        if (syncDateRange && syncDateRange.endDate) {
          syncDateToSave = syncDateRange.endDate;
        } else {
          syncDateToSave = getTodayDateStr();
        }
        
        await setLastSyncDate(syncDateToSave);
        log.info(`[🔍 DIAGNOSTIC] Timestamp de dernière sync (fallback): ${syncDateToSave}`);
      } catch (error) {
        log.error('[processSyncResponse] Error setting last sync date (fallback):', error);
      }
    }
  }
  
  // Import automatique vers Endurance si activités présentes
  // (cardio = courses, vélo, etc. — les courses sont importées dans sessions.running via useGarminImport)
  if (json.data.activities) {
    const hasSwimming = json.data.activities.swimming?.length > 0;
    const hasJumpRope = json.data.activities.jumpRope?.length > 0;
    const hasCardio = json.data.activities.cardio?.length > 0;

    if (
      (hasSwimming || hasJumpRope || hasCardio) &&
      importToEndurance &&
      typeof importToEndurance === 'function'
    ) {
      try {
        log.debug(
          '[processSyncResponse] Import Endurance (natation / corde / cardio course)',
          { hasSwimming, hasJumpRope, hasCardio }
        );
        await importToEndurance(json.data);
        log.debug('[processSyncResponse] Activities imported to Endurance successfully');
      } catch (error) {
        log.warn('[processSyncResponse] Error importing to Endurance:', error);
        // Ne pas bloquer le traitement si l'import échoue
      }
    }
  }
  
  const processDuration = Date.now() - processStartTime;
  log.info(`[🔍 DIAGNOSTIC] Traitement réponse terminé - Durée totale: ${processDuration}ms`);
};

