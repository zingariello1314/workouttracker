/**
 * ✅ PHASE 1.1 : Hook principal pour la gestion des données Garmin
 * 
 * Ce hook délègue toutes les opérations aux modules spécialisés :
 * - `garminDataUtils` : Utilitaires partagés (openDB, queue, fallback)
 * - `garminDataSave` : Sauvegarde activités et métriques
 * - `garminDataLoad` : Chargement optimisé par plage/onglet
 * - `garminDataPurge` : Purge automatique et suppression mock
 * 
 * Le hook gère uniquement :
 * - L'état `dbReady` (initialisation IndexedDB)
 * - L'export/import JSON (délégation à loadAllData/save)
 * - L'auto-purge quotidienne (délégation à garminDataPurge)
 * 
 * @module useGarminData
 */

import { useState, useEffect, useCallback } from 'react';
import { openDB, getUseFallback, setUseFallback } from './garminDataUtils';
import { saveActivities, saveDailyMetrics } from './garminDataSave';
import {
  loadAllData,
  loadDataByRange,
  loadDataForTab,
  calculateDateRange,
  getLastSyncDate,
  setLastSyncDate,
  getSyncStartDate,
  getLastSyncTimestampForDate
} from './garminDataLoad';
import { autoPurge, purgeOldTimeSeries, deleteMockActivities } from './garminDataPurge';
import {
  saveForcedRangeEntry,
  loadForcedRangesHistory,
  clearForcedRangesHistory,
  importForcedRangesHistory,
  FORCED_HISTORY_LIMIT
} from './garminForcedHistory';
import { buildGarminChartDataset } from '../components/tabs/GarminTab/utils/chartDataBuilders';

/**
 * Hook principal pour la gestion des données Garmin dans IndexedDB
 * Gère la sauvegarde, le chargement, et l'optimisation des données
 * 
 * @returns {Object} Interface du hook
 * @returns {boolean} returns.dbReady - Si la base de données est prête
 * @returns {Function} returns.saveActivities - Fonction pour sauvegarder les activités
 * @returns {Function} returns.saveDailyMetrics - Fonction pour sauvegarder les métriques
 * @returns {Function} returns.loadAllData - Fonction pour charger toutes les données
 * @returns {Function} returns.loadDataByRange - Fonction pour charger par plage de dates
 * @returns {Function} returns.loadDataForTab - Fonction pour charger selon l'onglet
 * @returns {Function} returns.calculateDateRange - Fonction pour calculer plages de dates
 * @returns {Function} returns.exportAll - Fonction pour exporter toutes les données
 * @returns {Function} returns.importAll - Fonction pour importer des données
 * @returns {Function} returns.purgeOldTimeSeries - Fonction pour purger les vieilles time series
 * @returns {Function} returns.autoPurge - Fonction pour purge automatique
 * @returns {Function} returns.getLastSyncDate - Récupère la dernière date de sync
 * @returns {Function} returns.setLastSyncDate - Stocke la dernière date de sync
 * @returns {Function} returns.getSyncStartDate - Calcule la date de début pour sync incrémentale
 * @returns {Function} returns.getLastSyncTimestampForDate - Récupère le timestamp exact de dernière sync pour une date
 * @returns {Function} returns.deleteMockActivities - Supprime toutes les activités mock
 * 
 * @example
 * const { saveActivities, loadAllData } = useGarminData();
 * await saveActivities({ swimming: [...], cardio: [...] });
 * const data = await loadAllData();
 */
export const useGarminData = () => {
  const [dbReady, setDbReady] = useState(false);

  // Initialisation IndexedDB
  useEffect(() => {
    openDB()
      .then((db) => {
        setDbReady(true);
        if (getUseFallback()) {
          console.warn('[GarminData] Mode fallback localStorage activé');
        }
      })
      .catch((err) => {
        console.error('[GarminData] DB error:', err);
        setUseFallback(true);
        setDbReady(true); // Permettre fonctionnement en fallback
      });
  }, []);

  // Auto-purge quotidienne (une fois par jour)
  useEffect(() => {
    if (!dbReady) return;
    
    const lastPurge = localStorage.getItem('lastGarminPurge');
    const now = new Date().toISOString().split('T')[0];
    
    if (lastPurge !== now) {
      autoPurge(dbReady)
        .then((summary) => {
          if (summary && (summary.activitiesPurged || summary.metricsPurged)) {
            console.debug('[GarminData] autoPurge summary', summary);
          }
        })
        .catch((error) => {
          console.error('[GarminData] autoPurge error', error);
        });
      localStorage.setItem('lastGarminPurge', now);
    }
  }, [dbReady]);

  // Wrappers pour compatibilité avec l'API existante
  // Ces fonctions délèguent aux modules mais conservent la signature originale

  /**
   * Sauvegarde les activités dans IndexedDB avec gestion de queue
   * 
   * @param {Object} activities - Objet contenant les activités par type
   * @param {Array} activities.swimming - Liste des activités de natation
   * @param {Array} activities.jumpRope - Liste des activités de corde à sauter
   * @param {Array} activities.cardio - Liste des activités cardio
   * @returns {Promise<void>} Promise résolue quand la sauvegarde est terminée
   */
  const saveActivitiesWrapper = useCallback(async (activities) => {
    if (!dbReady) return;
    await saveActivities(activities, dbReady);
  }, [dbReady]);

  /**
   * Sauvegarde les métriques quotidiennes dans IndexedDB avec gestion de queue
   * 
   * @param {Object} dailyMetrics - Métriques quotidiennes par date (YYYY-MM-DD)
   * @returns {Promise<void>} Promise résolue quand la sauvegarde est terminée
   */
  const saveDailyMetricsWrapper = useCallback(async (dailyMetrics) => {
    if (!dbReady) return;
    await saveDailyMetrics(dailyMetrics, dbReady);
  }, [dbReady]);

  /**
   * Charge toutes les données (utilisé comme fallback par loadDataForTab)
   * 
   * @returns {Promise<Object>} { activities, dailyMetrics }
   */
  const loadAllDataWrapper = useCallback(async () => {
    return await loadAllData(dbReady);
  }, [dbReady]);

  /**
   * Charge les données par plage de dates (optimisé avec range queries IndexedDB)
   * 
   * @param {string} startDate - Date de début (YYYY-MM-DD)
   * @param {string} endDate - Date de fin (YYYY-MM-DD)
   * @returns {Promise<Object>} { activities, dailyMetrics }
   */
  const loadDataByRangeWrapper = useCallback(async (startDate, endDate) => {
    return await loadDataByRange(startDate, endDate, dbReady);
  }, [dbReady]);

  /**
   * Charge seulement les données nécessaires selon l'onglet actif
   * 
   * @param {string} tab - Onglet actif ('activities', 'metrics', 'charts', 'dashboard')
   * @param {string|null} selectedDate - Date sélectionnée (YYYY-MM-DD) ou null
   * @param {string} periodFilter - Filtre de période ('all', 'week', 'month', 'year', 'custom')
   * @param {string|null} customStartDate - Date de début personnalisée pour 'custom'
   * @param {string|null} customEndDate - Date de fin personnalisée pour 'custom'
   * @returns {Promise<Object>} { activities, dailyMetrics }
   */
  const loadDataForTabWrapper = useCallback(async (tab, selectedDate, periodFilter, customStartDate, customEndDate) => {
    return await loadDataForTab(tab, selectedDate, periodFilter, customStartDate, customEndDate, dbReady);
  }, [dbReady]);
  
  const loadForcedRangesHistoryWrapper = useCallback(async (limit = FORCED_HISTORY_LIMIT) => {
    return await loadForcedRangesHistory(limit);
  }, []);

  const saveForcedRangeEntryWrapper = useCallback(async (entry) => {
    if (!dbReady) return null;
    return await saveForcedRangeEntry(entry);
  }, [dbReady]);

  const clearForcedRangesHistoryWrapper = useCallback(async () => {
    if (!dbReady) return;
    await clearForcedRangesHistory();
  }, [dbReady]);
  
  /**
   * Calcule la plage de dates selon le periodFilter
   * 
   * @param {string} periodFilter - Filtre de période ('all', 'week', 'month', 'year', 'custom')
   * @param {string|null} customStartDate - Date de début personnalisée (YYYY-MM-DD) pour 'custom'
   * @param {string|null} customEndDate - Date de fin personnalisée (YYYY-MM-DD) pour 'custom'
   * @returns {Object|null} { start, end } - Plage de dates calculée ou null pour 'all'
   */
  const calculateDateRangeWrapper = useCallback((periodFilter, customStartDate, customEndDate) => {
    return calculateDateRange(periodFilter, customStartDate, customEndDate);
  }, []);

  /**
   * Exporte toutes les données depuis IndexedDB
   * 
   * @returns {Promise<Object>} Toutes les données (activities, dailyMetrics)
   */
  const exportAll = useCallback(async () => {
    const [coreData, forcedHistory] = await Promise.all([
      loadAllDataWrapper(),
      loadForcedRangesHistoryWrapper(FORCED_HISTORY_LIMIT)
    ]);

    const parseSummary = (key) => {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      } catch (error) {
        console.warn('[GarminData] Unable to parse maintenance summary', key, error);
        return null;
      }
    };
 
    const derivedDates = Object.keys(coreData.dailyMetrics || {}).sort();
    const lastDate = derivedDates.length ? derivedDates[derivedDates.length - 1] : null;
    const exportDates = derivedDates.slice(-30);
    const derivedCharts = buildGarminChartDataset({
      dailyMetrics: coreData.dailyMetrics || {},
      activities: coreData.activities || {},
      filteredDates: exportDates,
      selectedDate: lastDate,
      effectiveSelectedDate: lastDate,
      displayInfo: null
    });

    return {
      ...coreData,
      forcedRangesHistory: forcedHistory,
      maintenance: {
        purgeSummary: parseSummary('garmin_lastPurgeSummary'),
        lastPurge: localStorage.getItem('garmin_lastPurge'),
        purgeErrors: parseSummary('garmin_purgeErrors')
      },
      derivedCharts
    };
  }, [loadAllDataWrapper, loadForcedRangesHistoryWrapper]);

  /**
   * Importe des données dans IndexedDB
   * 
   * @param {Object} data - Données à importer
   * @param {Object} data.activities - Activités par type (optionnel)
   * @param {Object} data.dailyMetrics - Métriques quotidiennes par date (optionnel)
   * @returns {Promise<void>} Promise résolue quand l'import est terminé
   */
  const importAll = useCallback(async (data) => {
    if (!dbReady) return;
    if (data.activities) await saveActivities(data.activities, dbReady);
    if (data.dailyMetrics) await saveDailyMetrics(data.dailyMetrics, dbReady);
    if (Array.isArray(data.forcedRangesHistory) && data.forcedRangesHistory.length > 0) {
      await importForcedRangesHistory(data.forcedRangesHistory);
    }
    if (data.maintenance) {
      const { purgeSummary, timeSeriesSummary, mockCleanupSummary } = data.maintenance;
      try {
        if (purgeSummary) {
          localStorage.setItem('garmin_lastPurgeSummary', JSON.stringify(purgeSummary));
        }
        if (timeSeriesSummary) {
          localStorage.setItem('garmin_lastTimeSeriesPurge', JSON.stringify(timeSeriesSummary));
        }
        if (mockCleanupSummary) {
          localStorage.setItem('garmin_lastMockCleanup', JSON.stringify(mockCleanupSummary));
        }
      } catch (error) {
        console.warn('[GarminData] Unable to import maintenance summaries', error);
      }
    }
  }, [dbReady]);

  /**
   * Purge les time series > 90 jours pour libérer de l'espace
   * 
   * @returns {Promise<void>} Promise résolue quand la purge est terminée
   */
  const purgeOldTimeSeriesWrapper = useCallback(async () => {
    await purgeOldTimeSeries(dbReady);
  }, [dbReady]);

  /**
   * Purge automatiquement les données > 90 jours
   * 
   * @returns {Promise<void>} Promise résolue quand la purge est terminée
   */
  const autoPurgeWrapper = useCallback(async () => {
    await autoPurge(dbReady);
  }, [dbReady]);

  /**
   * Récupère la date de dernière synchronisation
   * 
   * @returns {Promise<string|null>} Date de dernière sync (YYYY-MM-DD) ou null si jamais sync
   */
  const getLastSyncDateWrapper = useCallback(async () => {
    return await getLastSyncDate();
  }, []);
  
  /**
   * Stocke la date de dernière synchronisation
   * 
   * @param {string} date - Date de sync (YYYY-MM-DD)
   * @returns {Promise<void>} Promise résolue quand la sauvegarde est terminée
   */
  const setLastSyncDateWrapper = useCallback(async (date) => {
    await setLastSyncDate(date);
  }, []);

  /**
   * Calcule la date de début pour la synchronisation incrémentale
   * 
   * @returns {Promise<string>} Date de début (YYYY-MM-DD)
   */
  const getSyncStartDateWrapper = useCallback(async () => {
    return await getSyncStartDate();
  }, []);

  /**
   * Récupère le timestamp exact de dernière sync pour une date spécifique
   * 
   * @param {string} date - Date au format YYYY-MM-DD
   * @returns {Promise<string|null>} Timestamp ISO de dernière sync ou null
   */
  const getLastSyncTimestampForDateWrapper = useCallback(async (date) => {
    return await getLastSyncTimestampForDate(date);
  }, []);

  /**
   * Supprime toutes les données mock (activités + métriques quotidiennes)
   * 
   * @returns {Promise<Object>} { activities: number, metrics: number } - Nombre d'éléments supprimés
   */
  const deleteMockActivitiesWrapper = useCallback(async () => {
    return await deleteMockActivities(dbReady);
  }, [dbReady]);

  return {
    dbReady,
    saveActivities: saveActivitiesWrapper,
    saveDailyMetrics: saveDailyMetricsWrapper,
    loadAllData: loadAllDataWrapper,
    loadDataByRange: loadDataByRangeWrapper,
    loadDataForTab: loadDataForTabWrapper,
    calculateDateRange: calculateDateRangeWrapper,
    exportAll,
    importAll,
    purgeOldTimeSeries: purgeOldTimeSeriesWrapper,
    autoPurge: autoPurgeWrapper,
    getLastSyncDate: getLastSyncDateWrapper,
    setLastSyncDate: setLastSyncDateWrapper,
    getSyncStartDate: getSyncStartDateWrapper,
    getLastSyncTimestampForDate: getLastSyncTimestampForDateWrapper,
    deleteMockActivities: deleteMockActivitiesWrapper,
    saveForcedRangeEntry: saveForcedRangeEntryWrapper,
    loadForcedRangesHistory: loadForcedRangesHistoryWrapper,
    clearForcedRangesHistory: clearForcedRangesHistoryWrapper,
  };
};
