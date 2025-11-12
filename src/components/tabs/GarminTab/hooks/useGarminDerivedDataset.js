import { useMemo, useRef } from 'react';
import { buildDerivedDataset } from '../utils/chartDataBuilders';
import { useGarminSelectors } from './useGarminSelectors';
import { useGarminContext } from '../context/GarminContext';
import { useFilteredDates } from './useFilteredDates';
import { DATE_RANGE } from '../constants';

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

    // Cache miss ou expiré : recalculer
    const dataset = buildDerivedDataset({
      dailyMetrics,
      activities: activitiesByType,
      dates,
      anchorDate,
      displayInfo,
      colors
    });

    // Stocker dans le cache
    derivedDatasetCache.set(cacheKey, {
      dataset,
      timestamp: now,
      hitCount: 1
    });

    // Nettoyer si nécessaire
    cleanupCache();

    lastDatasetRef.current = dataset;
    lastCacheKeyRef.current = cacheKey;
    return dataset;
  }, [
    cacheKey,
    dailyMetrics,
    activitiesByType,
    dates,
    anchorDate,
    displayInfo,
    colors
  ]);

  return derivedDataset;
};

/**
 * Fonction utilitaire pour obtenir un dataset dérivé en dehors d'un composant React
 * (utilisé par exportAll, etc.)
 * 
 * @param {Object} params - Paramètres du dataset
 * @param {Object} params.dailyMetrics - Métriques quotidiennes
 * @param {Object} params.activities - Activités par type
 * @param {Array<string>} params.dates - Dates à inclure
 * @param {string} params.anchorDate - Date d'ancrage
 * @param {string} params.displayInfo - Info d'affichage
 * @param {Object} params.colors - Palette de couleurs (optionnel)
 * @returns {Object} Dataset dérivé
 */
export const getDerivedDatasetSync = ({
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

  // Cache miss : calculer
  const dataset = buildDerivedDataset({
    dailyMetrics,
    activities,
    dates,
    anchorDate,
    displayInfo,
    colors
  });

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



