import { useMemo, useRef, useState, useEffect } from 'react';
import { buildDerivedDataset } from '../utils/chartDataBuilders';
import { useGarminSelectors } from './useGarminSelectors';
import { useGarminContext } from '../context/GarminContext';
import { useFilteredDates } from './useFilteredDates';
import { DATE_RANGE } from '../constants';
import { useSyncWorker } from './useSyncWorker';
import { shouldUseWorker } from '../utils/activityUtils';

/**
 * Cache global pour les datasets dérivés (partagé entre hooks React et fonctions async)
 * Structure : Map<cacheKey, { dataset, timestamp, hitCount }>
 */
const derivedDatasetCache = new Map();
const CACHE_MAX_SIZE = 50; // Limite pour éviter fuite mémoire
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Génère une clé de cache stable basée sur les inputs
 */
const generateCacheKey = ({ datesHash, anchorDate, displayInfo }) => {
  return `derived:${datesHash}:${anchorDate || 'null'}:${displayInfo || 'null'}`;
};

/**
 * Nettoie le cache (LRU) si nécessaire
 */
const cleanupCache = () => {
  if (derivedDatasetCache.size <= CACHE_MAX_SIZE) return;

  // Trier par timestamp (plus ancien en premier) et hitCount (moins utilisé en premier)
  const entries = Array.from(derivedDatasetCache.entries())
    .map(([key, value]) => ({ key, ...value }))
    .sort((a, b) => {
      // D'abord par timestamp (plus ancien = priorité suppression)
      const timeDiff = a.timestamp - b.timestamp;
      if (Math.abs(timeDiff) > 1000) return timeDiff;
      // Puis par hitCount (moins utilisé = priorité suppression)
      return a.hitCount - b.hitCount;
    });

  // Supprimer les 25% les plus anciens/peu utilisés
  const toRemove = Math.floor(entries.length * 0.25);
  for (let i = 0; i < toRemove; i++) {
    derivedDatasetCache.delete(entries[i].key);
  }
};

/**
 * Calcule un hash simple des dates pour la clé de cache
 */
const hashDates = (dates) => {
  if (!Array.isArray(dates) || dates.length === 0) return 'empty';
  // Utiliser les premières et dernières dates + longueur pour un hash rapide
  const sorted = [...dates].sort();
  return `${sorted[0]}:${sorted[sorted.length - 1]}:${sorted.length}`;
};

/**
 * Hook pour obtenir un dataset dérivé avec cache mémoïsé
 * 
 * Ce hook centralise le calcul de `buildDerivedDataset` et le partage
 * entre tous les consommateurs (UI, exports JSON, PDF) pour garantir
 * la cohérence et optimiser les performances.
 * 
 * @param {Object} options - Options pour le dataset
 * @param {Array<string>} options.dates - Dates à inclure (optionnel, utilise filteredDates par défaut)
 * @param {string} options.anchorDate - Date d'ancrage (optionnel, utilise selectedDate par défaut)
 * @param {string} options.displayInfo - Info d'affichage (optionnel)
 * @returns {Object} Dataset dérivé avec chartData et selectors
 */
export const useGarminDerivedDataset = ({
  dates: datesOverride = null,
  anchorDate: anchorDateOverride = null,
  displayInfo: displayInfoOverride = null
} = {}) => {
  const {
    allDailyMetrics: dailyMetrics,
    activitiesByType,
    selectedDate,
    periodFilter,
    customRange
  } = useGarminSelectors();

  const { colors } = useGarminContext();

  const {
    filteredDates: defaultFilteredDates,
    displayInfo: defaultDisplayInfo,
    selectedDate: effectiveSelectedDate
  } = useFilteredDates(
    dailyMetrics,
    selectedDate,
    periodFilter,
    customRange?.start || null,
    customRange?.end || null,
    DATE_RANGE.ACTIVITIES_DAYS
  );

  // Utiliser les overrides si fournis, sinon les valeurs par défaut
  const dates = datesOverride || defaultFilteredDates;
  const anchorDate = anchorDateOverride !== null ? anchorDateOverride : (selectedDate || effectiveSelectedDate);
  const displayInfo = displayInfoOverride || defaultDisplayInfo;

  // Générer la clé de cache
  const datesHash = useMemo(() => hashDates(dates), [dates]);
  const cacheKey = useMemo(
    () => generateCacheKey({ datesHash, anchorDate, displayInfo }),
    [datesHash, anchorDate, displayInfo]
  );

  // Référence pour éviter recalculs inutiles si les données brutes n'ont pas changé
  const lastDatasetRef = useRef(null);
  const lastCacheKeyRef = useRef(null);

  // Initialiser le worker si nécessaire
  const syncWorker = useSyncWorker();
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const [datasetState, setDatasetState] = useState(null);

  // Vérifier si le worker est prêt et si on doit l'utiliser
  useEffect(() => {
    if (syncWorker && syncWorker.isReady) {
      setIsWorkerReady(true);
    }
  }, [syncWorker]);

  // Gérer le calcul asynchrone avec le worker si nécessaire
  useEffect(() => {
    const cached = derivedDatasetCache.get(cacheKey);
    const now = Date.now();
    
    // Si cache valide, pas besoin de recalculer
    if (cached && (now - cached.timestamp) < CACHE_TTL_MS) {
      return;
    }

    // Si le worker est disponible et qu'on dépasse le seuil, utiliser le worker
    const useWorker = isWorkerReady && syncWorker && shouldUseWorker(activitiesByType);
    
    if (useWorker) {
      buildDerivedDataset({
        dailyMetrics,
        activities: activitiesByType,
        dates,
        anchorDate,
        displayInfo,
        colors,
        syncWorker
      }).then((dataset) => {
        // Stocker dans le cache
        derivedDatasetCache.set(cacheKey, {
          dataset,
          timestamp: Date.now(),
          hitCount: 1
        });
        cleanupCache();
        lastDatasetRef.current = dataset;
        lastCacheKeyRef.current = cacheKey;
        setDatasetState(dataset);
      }).catch((error) => {
        console.warn('[useGarminDerivedDataset] Erreur worker, fallback synchrone', error);
        // Fallback synchrone en cas d'erreur
        buildDerivedDataset({
          dailyMetrics,
          activities: activitiesByType,
          dates,
          anchorDate,
          displayInfo,
          colors,
          syncWorker: null
        }).then((dataset) => {
          derivedDatasetCache.set(cacheKey, {
            dataset,
            timestamp: Date.now(),
            hitCount: 1
          });
          cleanupCache();
          lastDatasetRef.current = dataset;
          lastCacheKeyRef.current = cacheKey;
          setDatasetState(dataset);
        });
      });
    } else {
      // Version synchrone (rapide pour <1000 activités ou worker non disponible)
      buildDerivedDataset({
        dailyMetrics,
        activities: activitiesByType,
        dates,
        anchorDate,
        displayInfo,
        colors,
        syncWorker: null
      }).then((dataset) => {
        derivedDatasetCache.set(cacheKey, {
          dataset,
          timestamp: Date.now(),
          hitCount: 1
        });
        cleanupCache();
        lastDatasetRef.current = dataset;
        lastCacheKeyRef.current = cacheKey;
        setDatasetState(dataset);
      });
    }
  }, [
    cacheKey,
    dailyMetrics,
    activitiesByType,
    dates,
    anchorDate,
    displayInfo,
    colors,
    isWorkerReady,
    syncWorker
  ]);

  // Retourner le dataset depuis le cache ou l'état
  const derivedDataset = useMemo(() => {
    // Vérifier le cache global d'abord
    const cached = derivedDatasetCache.get(cacheKey);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < CACHE_TTL_MS) {
      // Cache hit : incrémenter hitCount et retourner
      cached.hitCount++;
      lastDatasetRef.current = cached.dataset;
      lastCacheKeyRef.current = cacheKey;
      return cached.dataset;
    }

    // Si pas de cache, retourner le dernier dataset calculé ou un dataset par défaut
    if (datasetState && lastCacheKeyRef.current === cacheKey) {
      return datasetState;
    }

    // Retourner le dernier dataset en cache ou un dataset par défaut
    return lastDatasetRef.current || {
      filteredDates: dates,
      displayInfo,
      effectiveSelectedDate: anchorDate,
      heartRateTrend: { data: [], filteredDates: dates, displayInfo, selectedDate: anchorDate },
      bodyBatteryTrend: { data: [], filteredDates: dates, displayInfo, selectedDate: anchorDate },
      stressTrend: { data: [], filteredDates: dates, displayInfo, selectedDate: anchorDate },
      sleepTrend: { data: [], filteredDates: dates, displayInfo, selectedDate: anchorDate },
      respirationTrend: { data: [], filteredDates: dates, displayInfo, selectedDate: anchorDate },
      correlation: { sleepPerformanceData: [], batteryIntensityData: [], filteredDates: dates, displayInfo, selectedDate: anchorDate },
      activityHeatmap: { activityByDate: {}, weeks: [] },
      heartRateTimeSeries: { enriched: null, chartData: [], stats: null, hasEnoughDataForCurve: false, realPointsCount: 0 },
      selectors: {}
    };
  }, [
    cacheKey,
    datasetState,
    dates,
    anchorDate,
    displayInfo
  ]);

  return derivedDataset;
};

/**
 * Fonction utilitaire pour obtenir un dataset dérivé en dehors d'un composant React
 * (utilisé par exportAll, etc.)
 * 
 * Note: Cette fonction est maintenant asynchrone car buildDerivedDataset est async.
 * Pour les exports, on n'utilise pas le worker (syncWorker: null) pour garantir
 * la rapidité et la simplicité.
 * 
 * @param {Object} params - Paramètres du dataset
 * @param {Object} params.dailyMetrics - Métriques quotidiennes
 * @param {Object} params.activities - Activités par type
 * @param {Array<string>} params.dates - Dates à inclure
 * @param {string} params.anchorDate - Date d'ancrage
 * @param {string} params.displayInfo - Info d'affichage
 * @param {Object} params.colors - Palette de couleurs (optionnel)
 * @returns {Promise<Object>} Dataset dérivé
 */
export const getDerivedDatasetSync = async ({
  dailyMetrics,
  activities,
  dates,
  anchorDate,
  displayInfo,
  colors = null
}) => {
  const datesHash = hashDates(dates);
  const cacheKey = generateCacheKey({ datesHash, anchorDate, displayInfo });

  // Vérifier le cache
  const cached = derivedDatasetCache.get(cacheKey);
  const now = Date.now();

  if (cached && (now - cached.timestamp) < CACHE_TTL_MS) {
    cached.hitCount++;
    return cached.dataset;
  }

  // Cache miss : calculer (version synchrone sans worker pour compatibilité exports)
  // Note: buildDerivedDataset est maintenant async, mais on l'appelle sans worker pour rester synchrone
  // Dans les exports, on préfère la rapidité et la simplicité plutôt que l'optimisation worker
  let dataset;
  try {
    // Appel synchrone sans worker (rapide pour exports)
    dataset = await buildDerivedDataset({
      dailyMetrics,
      activities,
      dates,
      anchorDate,
      displayInfo,
      colors,
      syncWorker: null // Pas de worker pour version sync
    });
  } catch (error) {
    console.error('[getDerivedDatasetSync] Erreur buildDerivedDataset', error);
    // Retourner un dataset vide en cas d'erreur
    dataset = {
      filteredDates: dates || [],
      displayInfo,
      effectiveSelectedDate: anchorDate,
      heartRateTrend: { data: [], filteredDates: dates || [], displayInfo, selectedDate: anchorDate },
      bodyBatteryTrend: { data: [], filteredDates: dates || [], displayInfo, selectedDate: anchorDate },
      stressTrend: { data: [], filteredDates: dates || [], displayInfo, selectedDate: anchorDate },
      sleepTrend: { data: [], filteredDates: dates || [], displayInfo, selectedDate: anchorDate },
      respirationTrend: { data: [], filteredDates: dates || [], displayInfo, selectedDate: anchorDate },
      correlation: { sleepPerformanceData: [], batteryIntensityData: [], filteredDates: dates || [], displayInfo, selectedDate: anchorDate },
      activityHeatmap: { activityByDate: {}, weeks: [] },
      heartRateTimeSeries: { enriched: null, chartData: [], stats: null, hasEnoughDataForCurve: false, realPointsCount: 0 },
      selectors: {}
    };
  }

  // Stocker dans le cache
  derivedDatasetCache.set(cacheKey, {
    dataset,
    timestamp: now,
    hitCount: 1
  });

  cleanupCache();

  return dataset;
};

/**
 * Nettoie le cache manuellement (utile pour tests ou purge explicite)
 */
export const clearDerivedDatasetCache = () => {
  derivedDatasetCache.clear();
};

/**
 * Obtient les statistiques du cache (utile pour debugging)
 */
export const getDerivedDatasetCacheStats = () => {
  const entries = Array.from(derivedDatasetCache.values());
  return {
    size: derivedDatasetCache.size,
    maxSize: CACHE_MAX_SIZE,
    ttlMs: CACHE_TTL_MS,
    totalHits: entries.reduce((sum, e) => sum + e.hitCount, 0),
    avgHits: entries.length > 0 ? entries.reduce((sum, e) => sum + e.hitCount, 0) / entries.length : 0,
    oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => e.timestamp)) : null,
    newestEntry: entries.length > 0 ? Math.max(...entries.map(e => e.timestamp)) : null
  };
};

export default useGarminDerivedDataset;



