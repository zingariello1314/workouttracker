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
 * @returns {Object} Données Garmin formatées pour la sidebar
 */
export const useRealGarminData = () => {
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

    // Vérifier le cache d'abord
    const cachedData = garminRealDataService.getCachedData();
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

      // Utiliser le service pour formater les données
      const today = new Date().toISOString().slice(0, 10);
      const todayMetrics = rawData.dailyMetrics[today] || {};
      
      // Si pas de données pour aujourd'hui, prendre la date la plus récente
      const availableDates = Object.keys(rawData.dailyMetrics).sort();
      const latestDate = availableDates.length > 0 ? availableDates[availableDates.length - 1] : null;
      const metricsToUse = Object.keys(todayMetrics).length > 0 ? todayMetrics : (latestDate ? rawData.dailyMetrics[latestDate] : {});
      
      // Formater les données avec le service
      const formattedData = garminRealDataService.processMetrics(metricsToUse, rawData.dailyMetrics, latestDate || today);
      
      // Mettre à jour le cache
      garminRealDataService.updateCache(formattedData);
      
      setGarminData(formattedData);
      
      console.log('[useRealGarminData] Données Garmin réelles chargées:', {
        hasHeartRateZones: !!formattedData.heartRateZones?.length,
        hasSleepPhases: !!formattedData.sleepPhases?.length,
        hasStressLevels: !!formattedData.stressLevels?.length,
        dataDate: formattedData.dataDate,
        hasData: formattedData.hasData,
        calories: formattedData.todayMetrics?.calories,
        steps: formattedData.todayMetrics?.steps,
        heartRate: formattedData.todayMetrics?.heartRate
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
  }, [dbReady, isAuthenticated, loadDataForTab]);

  /**
   * Force le rechargement des données
   */
  const refreshData = useCallback(() => {
    // Vider le cache pour forcer un rechargement
    garminRealDataService.cache.clear();
    garminRealDataService.lastUpdate = null;
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