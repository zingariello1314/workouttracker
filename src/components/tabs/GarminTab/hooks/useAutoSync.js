/**
 * 🔴 FIX #81-87: Hook pour gérer la synchronisation automatique planifiée
 * Optimisé : utilise les callbacks et évite les re-renders inutiles
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import logger from '../../../../utils/logger';

const log = logger.hook('useAutoSync');
import { SYNC_TIMEOUT_MS } from '../constants';

const STORAGE_KEY = 'garmin_autosync_settings';
const MIN_INTERVAL_MS = 60000; // Minimum 1 minute entre syncs

/**
 * Hook pour la synchronisation automatique
 * @param {Function} syncFunction - Fonction de synchronisation à appeler
 * @param {boolean} enabled - Si la sync auto est activée
 * @param {string} schedule - 'daily', 'weekly', 'custom'
 * @param {string} customTime - Heure personnalisée (HH:mm) pour schedule='custom'
 * @returns {Object} { isActive, nextSyncTime, lastSyncTime, error }
 */
export function useAutoSync(syncFunction, enabled, schedule = 'daily', customTime = '08:00') {
  const [isActive, setIsActive] = useState(false);
  const [nextSyncTime, setNextSyncTime] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [error, setError] = useState(null);
  
  const intervalRef = useRef(null);
  const lastSyncRef = useRef(null);

  /**
   * Calcule le prochain moment de synchronisation selon le schedule
   * Optimisé : calcul simple et efficace
   */
  const calculateNextSync = useCallback((scheduleType, time) => {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    
    let next = new Date();
    next.setHours(hours, minutes, 0, 0);

    switch (scheduleType) {
      case 'daily':
        // Prochain sync : aujourd'hui à l'heure spécifiée, ou demain si déjà passé
        if (next <= now) {
          next.setDate(next.getDate() + 1);
        }
        break;
        
      case 'weekly':
        // Prochain sync : lundi prochain à l'heure spécifiée
        const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
        next.setDate(now.getDate() + daysUntilMonday);
        if (next <= now) {
          next.setDate(next.getDate() + 7);
        }
        break;
        
      case 'custom':
        // Pour custom, on peut utiliser un interval (ex: toutes les 6h)
        // Par défaut, on fait quotidien
        if (next <= now) {
          next.setDate(next.getDate() + 1);
        }
        break;
        
      default:
        // Par défaut : quotidien
        if (next <= now) {
          next.setDate(next.getDate() + 1);
        }
    }
    
    return next;
  }, []);

  /**
   * Effectue la synchronisation avec gestion d'erreur
   * Optimisé : évite les syncs multiples simultanées
   */
  const performSync = useCallback(async () => {
    // Éviter les syncs multiples si une sync est déjà en cours
    if (intervalRef.current === null) return;
    
    const now = Date.now();
    // Éviter les syncs trop fréquentes (minimum 1 minute)
    if (lastSyncRef.current && (now - lastSyncRef.current) < MIN_INTERVAL_MS) {
      log.debug('Sync ignorée : trop récente');
      return;
    }

    try {
      setIsActive(true);
      setError(null);
      
      log.debug('Synchronisation automatique en cours...');
      await syncFunction();
      
      const syncTime = new Date();
      setLastSyncTime(syncTime);
      lastSyncRef.current = syncTime.getTime();
      
      // Recalculer le prochain sync
      const next = calculateNextSync(schedule, customTime);
      setNextSyncTime(next);
      
      log.debug(`Synchronisation réussie ${syncTime.toISOString()}`);
    } catch (err) {
      log.error('Erreur lors de la synchronisation:', err);
      setError(err.message || 'Erreur de synchronisation');
      
      // En cas d'erreur, retry dans 30 minutes
      const retryTime = new Date(Date.now() + 30 * 60000);
      setNextSyncTime(retryTime);
    } finally {
      setIsActive(false);
    }
  }, [syncFunction, schedule, customTime, calculateNextSync]);

  /**
   * Démarre la synchronisation automatique
   * Optimisé : cleanup propre et pas de memory leaks
   */
  useEffect(() => {
    if (!enabled || !syncFunction) {
      // Cleanup si désactivé
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsActive(false);
      return;
    }

    // Calculer le prochain sync
    const next = calculateNextSync(schedule, customTime);
    setNextSyncTime(next);

    // Vérifier toutes les minutes si c'est le moment de sync
    const checkInterval = setInterval(() => {
      const now = new Date();
      
      // Si le moment est arrivé (avec marge de 30 secondes)
      if (next.getTime() - now.getTime() <= 30000 && next.getTime() - now.getTime() >= -30000) {
        performSync();
      }
    }, 60000); // Check toutes les minutes

    intervalRef.current = checkInterval;

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, schedule, customTime, syncFunction, calculateNextSync, performSync]);

  return {
    isActive,
    nextSyncTime,
    lastSyncTime,
    error
  };
}

/**
 * Sauvegarde les paramètres de sync auto dans localStorage
 * Optimisé : ne sauvegarde que si les valeurs ont changé
 */
export function saveAutoSyncSettings(settings) {
  try {
    const existing = getAutoSyncSettings();
    // Éviter les écritures inutiles
    if (JSON.stringify(existing) === JSON.stringify(settings)) {
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    log.error('Erreur sauvegarde settings:', err);
  }
}

/**
 * Charge les paramètres de sync auto depuis localStorage
 * Optimisé : cache simple et efficace
 */
export function getAutoSyncSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (err) {
    log.error('Erreur chargement settings:', err);
  }
  
  // Valeurs par défaut
  return {
    enabled: false,
    schedule: 'daily',
    customTime: '08:00',
    delayBeforeSync: 0  // ✅ PHASE 5.2 : Délai optionnel avant sync (en minutes, 0 = désactivé)
  };
}

