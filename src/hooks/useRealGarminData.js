/**
 * Hook pour récupérer les vraies données Garmin depuis l'onglet Sport
 * et les formater pour le module Garmin de la sidebar
 */

import { useState, useEffect, useCallback } from 'react';
import { useGarminData } from './useGarminData';
import { useAuth } from '../context/AuthContext';
import garminRealDataService from '../services/garmin/garminRealDataService';

/**
 * Hook pour récupérer les vraies données Garmin
 * @param {Object} options - Options pour le hook
 * @param {string} options.selectedDate - Date sélectionnée (format YYYY-MM-DD), par défaut aujourd'hui
 * @param {boolean} options.enableTimeSeriesData - Activer les données de série temporelle pour les graphiques
 * @param {boolean} options.optimizeForSidebar - Optimiser les données pour l'affichage sidebar (réduction de taille)
 * @returns {Object} Données Garmin formatées pour la sidebar
 */
export const useRealGarminData = (options = {}) => {
  const { 
    selectedDate = new Date().toISOString().slice(0, 10),
    enableTimeSeriesData = false,
    optimizeForSidebar = true
  } = options;
  
  const { isAuthenticated } = useAuth();
  const { loadDataForTab, dbReady } = useGarminData();
  const [garminData, setGarminData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Charge les vraies données Garmin
   */
  const loadRealGarminData = useCallback(async () => {
    if (!dbReady || !isAuthenticated) {
      setGarminData(garminRealDataService.getEmptyData());
      return;
    }

    // Créer une clé de cache unique basée sur les options
    const cacheKey = `${selectedDate}-${enableTimeSeriesData}-${optimizeForSidebar}`;
    
    // Vérifier le cache d'abord avec la clé spécifique
    const cachedData = garminRealDataService.getCachedData(cacheKey);
    if (cachedData) {
      setGarminData(cachedData);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Charger les données de la semaine courante (comme dans l'onglet Sport)
      const rawData = await loadDataForTab('metrics', null, 'week');
      
      if (!rawData || !rawData.dailyMetrics) {
        console.warn('[useRealGarminData] Aucune donnée Garmin disponible');
        const emptyData = garminRealDataService.getEmptyData();
        setGarminData(emptyData);
        return;
      }

      // Utiliser la date sélectionnée ou la date la plus récente disponible
      const targetMetrics = rawData.dailyMetrics[selectedDate] || {};
      
      // Si pas de données pour la date sélectionnée, prendre la date la plus récente
      const availableDates = Object.keys(rawData.dailyMetrics).sort();
      const latestDate = availableDates.length > 0 ? availableDates[availableDates.length - 1] : null;
      const metricsToUse = Object.keys(targetMetrics).length > 0 ? targetMetrics : (latestDate ? rawData.dailyMetrics[latestDate] : {});
      const effectiveDate = Object.keys(targetMetrics).length > 0 ? selectedDate : latestDate;
      
      // Formater les données avec le service, en incluant les options
      const formattedData = garminRealDataService.processMetrics(
        metricsToUse, 
        rawData.dailyMetrics, 
        effectiveDate || selectedDate,
        {
          enableTimeSeriesData,
          optimizeForSidebar,
          selectedDate
        }
      );
      
      // Mettre à jour le cache avec la clé spécifique
      garminRealDataService.updateCache(formattedData, cacheKey);
      
      setGarminData(formattedData);
      
      console.log('[useRealGarminData] Données Garmin réelles chargées:', {
        selectedDate: effectiveDate,
        hasHeartRateZones: !!formattedData.heartRateZones?.length,
        hasHeartRateTimeSeries: !!formattedData.heartRateTimeSeries?.length,
        hasSleepPhases: !!formattedData.sleepPhases?.length,
        hasStressLevels: !!formattedData.stressLevels?.length,
        dataDate: formattedData.dataDate,
        hasData: formattedData.hasData,
        calories: formattedData.todayMetrics?.calories,
        steps: formattedData.todayMetrics?.steps,
        heartRate: formattedData.todayMetrics?.heartRate,
        enableTimeSeriesData,
        optimizeForSidebar
      });
      
    } catch (err) {
      console.error('[useRealGarminData] Erreur lors du chargement des données:', err);
      setError(err.message);
      
      // En cas d'erreur, utiliser des données vides
      const emptyData = garminRealDataService.getEmptyData();
      setGarminData(emptyData);
    } finally {
      setLoading(false);
    }
  }, [dbReady, isAuthenticated, loadDataForTab, selectedDate, enableTimeSeriesData, optimizeForSidebar]);

  /**
   * Force le rechargement des données
   */
  const refreshData = useCallback(() => {
    // Vider le cache pour forcer un rechargement
    garminRealDataService.clearCache();
    loadRealGarminData();
  }, [loadRealGarminData]);

  // Charger les données au montage et quand les dépendances changent
  useEffect(() => {
    loadRealGarminData();
  }, [loadRealGarminData]);

  // Écouter les événements de rafraîchissement Garmin
  useEffect(() => {
    const handleGarminRefresh = () => {
      console.log('[useRealGarminData] Événement de rafraîchissement Garmin reçu');
      refreshData();
    };

    // Écouter les événements personnalisés de rafraîchissement
    window.addEventListener('garmin:refresh:request', handleGarminRefresh);
    window.addEventListener('garmin:data:updated', handleGarminRefresh);

    return () => {
      window.removeEventListener('garmin:refresh:request', handleGarminRefresh);
      window.removeEventListener('garmin:data:updated', handleGarminRefresh);
    };
  }, [refreshData]);

  // Rafraîchissement automatique toutes les 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (isAuthenticated && dbReady) {
        loadRealGarminData();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated, dbReady, loadRealGarminData]);

  return {
    garminData,
    loading,
    error,
    refreshData,
    hasData: garminData?.hasData || false,
    lastUpdate: garminData?.lastUpdate || null
  };
};