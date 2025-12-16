/**
 * Hook pour récupérer les vraies données Garmin depuis l'onglet Sport
 * et les formater pour le module Garmin de la sidebar
 */

import { useState, useEffect, useCallback } from 'react';
import { useGarminData } from './useGarminData';
import { useAuth } from '../context/AuthContext';
import garminRealDataService from '../services/garmin/garminRealDataService';
import { garminDataErrorHandler, GarminErrorType } from '../utils/garminDataErrorHandler';

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
    enableTimeSeriesData = true, // Toujours activer pour la sidebar
    optimizeForSidebar = true
  } = options;
  
  const { isAuthenticated } = useAuth();
  const { loadDataForTab, dbReady } = useGarminData();
  const [garminData, setGarminData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastErrorTime, setLastErrorTime] = useState(null);
  const maxRetries = 3;

  /**
   * Charge les vraies données Garmin avec optimisations de performance
   */
  const loadRealGarminData = useCallback(async () => {
    if (!dbReady || !isAuthenticated) {
      const demoData = garminRealDataService.getEmptyData();
      console.log('[useRealGarminData] DB non prête ou non authentifié, utilisation de données de démonstration');
      setGarminData(demoData);
      return;
    }

    // Clé de cache optimisée avec hash pour éviter les clés trop longues
    const cacheKey = `${selectedDate}-${enableTimeSeriesData}-${optimizeForSidebar}`;
    
    // Cache intelligent avec vérification de fraîcheur (Requirement 3.5)
    const cachedData = garminRealDataService.getCachedData(cacheKey);
    if (cachedData) {
      // Vérifier si le cache n'est pas trop ancien (5 minutes max)
      const cacheAge = Date.now() - (cachedData.lastUpdate || 0);
      if (cacheAge < 5 * 60 * 1000) {
        setGarminData(cachedData);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      // Charger les données de la semaine courante (comme dans l'onglet Sport)
      const rawData = await loadDataForTab('metrics', null, 'week');
      
      if (!rawData || !rawData.dailyMetrics || Object.keys(rawData.dailyMetrics).length === 0) {
        console.warn('[useRealGarminData] Aucune donnée Garmin disponible, utilisation de données de démonstration');
        const demoData = garminRealDataService.getEmptyData();
        setGarminData(demoData);
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
      
      // Créer une erreur Garmin standardisée
      const garminError = garminDataErrorHandler.handleSyncError(
        'loadRealGarminData',
        err,
        'useRealGarminData'
      );
      
      setError(garminError.message);
      setLastErrorTime(Date.now());
      setRetryCount(prev => prev + 1);
      
      // En cas d'erreur, utiliser des données de démonstration pour que le graphique s'affiche
      const demoData = garminRealDataService.getEmptyData();
      console.log('[useRealGarminData] Utilisation de données de démonstration après erreur');
      setGarminData(demoData);
    } finally {
      setLoading(false);
    }
  }, [dbReady, isAuthenticated, loadDataForTab, selectedDate, enableTimeSeriesData, optimizeForSidebar]);

  /**
   * Force le rechargement des données avec gestion d'erreurs
   */
  const refreshData = useCallback(() => {
    // Vérifier si on peut retry
    if (retryCount >= maxRetries) {
      console.warn('[useRealGarminData] Nombre maximum de tentatives atteint');
      return;
    }
    
    // Reset des états d'erreur
    setError(null);
    setLastErrorTime(null);
    
    // Vider le cache pour forcer un rechargement
    garminRealDataService.clearCache();
    loadRealGarminData();
  }, [loadRealGarminData, retryCount, maxRetries]);

  /**
   * Reset des erreurs
   */
  const resetErrors = useCallback(() => {
    setError(null);
    setRetryCount(0);
    setLastErrorTime(null);
  }, []);

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

  // Rafraîchissement automatique optimisé avec gestion intelligente (Requirements 3.5, 1.5)
  useEffect(() => {
    // Rafraîchissement adaptatif basé sur l'activité de l'utilisateur
    let interval;
    let isUserActive = true;
    let lastActivity = Date.now();
    
    // Détecter l'activité de l'utilisateur
    const handleUserActivity = () => {
      isUserActive = true;
      lastActivity = Date.now();
    };
    
    // Événements d'activité utilisateur
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });
    
    // Vérifier l'inactivité toutes les minutes
    const inactivityCheck = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivity;
      isUserActive = timeSinceLastActivity < 5 * 60 * 1000; // 5 minutes d'inactivité
    }, 60 * 1000);
    
    // Rafraîchissement adaptatif
    const startAdaptiveRefresh = () => {
      if (interval) clearInterval(interval);
      
      // Fréquence basée sur l'activité utilisateur et les performances
      const getRefreshInterval = () => {
        if (!isUserActive) return 30 * 60 * 1000; // 30 minutes si inactif
        if (retryCount > 0) return 15 * 60 * 1000; // 15 minutes si erreurs récentes
        return 10 * 60 * 1000; // 10 minutes normal
      };
      
      interval = setInterval(() => {
        if (isAuthenticated && dbReady && !loading && isUserActive) {
          loadRealGarminData();
        }
      }, getRefreshInterval());
    };
    
    startAdaptiveRefresh();
    
    // Redémarrer l'intervalle quand l'utilisateur redevient actif
    const activityInterval = setInterval(() => {
      if (isUserActive && interval) {
        startAdaptiveRefresh();
      }
    }, 5 * 60 * 1000); // Vérifier toutes les 5 minutes

    return () => {
      if (interval) clearInterval(interval);
      if (inactivityCheck) clearInterval(inactivityCheck);
      if (activityInterval) clearInterval(activityInterval);
      
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
    };
  }, [isAuthenticated, dbReady, loadRealGarminData, loading, retryCount]);

  return {
    garminData,
    loading,
    error,
    refreshData,
    resetErrors,
    hasData: garminData?.hasData || false,
    lastUpdate: garminData?.lastUpdate || null,
    retryCount,
    maxRetries,
    canRetry: retryCount < maxRetries,
    lastErrorTime
  };
};