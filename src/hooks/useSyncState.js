/**
 * Hook pour gérer l'état de synchronisation temps réel
 * Fournit l'état de synchronisation et les méthodes de contrôle
 * 
 * @module hooks/useSyncState
 */

import { useState, useEffect, useCallback } from 'react';
import { useSidebarEvents } from '../utils/sidebarEvents';
import { 
  realTimeSyncService, 
  SYNC_STATES, 
  CONFLICT_TYPES, 
  HISTORICAL_SYNC_EVENTS 
} from '../services/sidebar/realTimeSyncService';

/**
 * Hook pour gérer l'état de synchronisation
 * 
 * @returns {Object} État et méthodes de synchronisation
 * @returns {string} returns.syncState - État actuel de synchronisation
 * @returns {Array} returns.activeConflicts - Conflits actifs
 * @returns {boolean} returns.isOnline - État de connexion
 * @returns {Object} returns.syncStats - Statistiques de synchronisation
 * @returns {Function} returns.forceSyncAll - Force une synchronisation complète
 * @returns {Function} returns.resolveConflict - Résout un conflit manuellement
 * @returns {Function} returns.startSync - Démarre le service de synchronisation
 * @returns {Function} returns.stopSync - Arrête le service de synchronisation
 */
export const useSyncState = () => {
  const [syncState, setSyncState] = useState(SYNC_STATES.IDLE);
  const [activeConflicts, setActiveConflicts] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStats, setSyncStats] = useState({
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    conflictsResolved: 0,
    lastSyncTime: null
  });

  // Écouter les changements d'état de synchronisation
  useSidebarEvents(HISTORICAL_SYNC_EVENTS.SYNC_STATE_CHANGED, useCallback((data) => {
    setSyncState(data.currentState);
    
    // Mettre à jour les statistiques
    setSyncStats(prev => ({
      ...prev,
      totalOperations: prev.totalOperations + 1,
      successfulOperations: data.currentState === SYNC_STATES.IDLE 
        ? prev.successfulOperations + 1 
        : prev.successfulOperations,
      failedOperations: data.currentState === SYNC_STATES.ERROR 
        ? prev.failedOperations + 1 
        : prev.failedOperations,
      lastSyncTime: Date.now()
    }));
  }, []));

  // Écouter les conflits détectés
  useSidebarEvents(HISTORICAL_SYNC_EVENTS.CONFLICT_DETECTED, useCallback((data) => {
    setActiveConflicts(prev => [...prev, {
      id: data.conflictId,
      type: data.conflict.type,
      operation: data.operation,
      timestamp: Date.now(),
      status: 'pending'
    }]);
  }, []));

  // Écouter les conflits résolus
  useSidebarEvents(HISTORICAL_SYNC_EVENTS.CONFLICT_RESOLVED, useCallback((data) => {
    setActiveConflicts(prev => 
      prev.filter(conflict => conflict.id !== data.conflictId)
    );
    
    // Mettre à jour les statistiques
    setSyncStats(prev => ({
      ...prev,
      conflictsResolved: prev.conflictsResolved + 1
    }));
  }, []));

  // Écouter les changements de connexion
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Reprendre la synchronisation quand on revient en ligne
      if (syncState === SYNC_STATES.ERROR) {
        realTimeSyncService.start();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncState]);

  // Initialiser le service de synchronisation
  useEffect(() => {
    realTimeSyncService.start();
    
    return () => {
      realTimeSyncService.stop();
    };
  }, []);

  // Méthodes de contrôle
  const forceSyncAll = useCallback(async () => {
    try {
      await realTimeSyncService.forceSyncAll();
    } catch (error) {
      console.error('[useSyncState] Erreur force sync:', error);
    }
  }, []);

  const resolveConflict = useCallback(async (conflictId, resolution) => {
    try {
      // Marquer le conflit comme résolu localement
      setActiveConflicts(prev => 
        prev.map(conflict => 
          conflict.id === conflictId 
            ? { ...conflict, status: 'resolved', resolution }
            : conflict
        )
      );
      
      // Notifier le service
      realTimeSyncService.resolveConflict(conflictId, resolution, null);
    } catch (error) {
      console.error('[useSyncState] Erreur resolving conflict:', error);
    }
  }, []);

  const startSync = useCallback(() => {
    realTimeSyncService.start();
  }, []);

  const stopSync = useCallback(() => {
    realTimeSyncService.stop();
  }, []);

  // Calculer l'état de santé de la synchronisation
  const syncHealth = useCallback(() => {
    const { totalOperations, successfulOperations, failedOperations } = syncStats;
    
    if (totalOperations === 0) return 'unknown';
    
    const successRate = successfulOperations / totalOperations;
    const failureRate = failedOperations / totalOperations;
    
    if (successRate >= 0.95) return 'excellent';
    if (successRate >= 0.85) return 'good';
    if (successRate >= 0.70) return 'fair';
    if (failureRate >= 0.30) return 'poor';
    
    return 'unknown';
  }, [syncStats]);

  return {
    syncState,
    activeConflicts,
    isOnline,
    syncStats,
    syncHealth: syncHealth(),
    forceSyncAll,
    resolveConflict,
    startSync,
    stopSync
  };
};

/**
 * Hook simplifié pour obtenir uniquement l'état de synchronisation
 * 
 * @returns {Object} État de synchronisation simplifié
 * @returns {boolean} returns.isSyncing - Indique si une synchronisation est en cours
 * @returns {boolean} returns.hasErrors - Indique s'il y a des erreurs
 * @returns {boolean} returns.hasConflicts - Indique s'il y a des conflits
 * @returns {boolean} returns.isHealthy - Indique si la synchronisation est saine
 */
export const useSyncStatus = () => {
  const { syncState, activeConflicts, syncHealth } = useSyncState();
  
  return {
    isSyncing: syncState === SYNC_STATES.SYNCING,
    hasErrors: syncState === SYNC_STATES.ERROR,
    hasConflicts: activeConflicts.length > 0,
    isHealthy: syncHealth === 'excellent' || syncHealth === 'good'
  };
};

/**
 * Hook pour écouter les événements de synchronisation spécifiques
 * 
 * @param {string} eventType - Type d'événement à écouter
 * @param {Function} callback - Fonction à appeler lors de l'événement
 */
export const useSyncEvents = (eventType, callback) => {
  useSidebarEvents(eventType, callback);
};

export default useSyncState;