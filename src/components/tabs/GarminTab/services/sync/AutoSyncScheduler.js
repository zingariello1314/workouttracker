/**
 * Scheduler pour la synchronisation automatique Garmin.
 * 
 * Unifie la logique de planification et de déclenchement automatique,
 * avec support pour :
 * - Planification (daily/weekly/custom)
 * - Auto-sync intelligente (vérification données fraîches)
 * - Historique des déclenchements
 * - Instrumentation télémétrie
 * 
 * @module AutoSyncScheduler
 */

import logger from '../../../../../utils/logger';
import { getAutoSyncSettings } from '../../hooks/useAutoSync';
import { persistAutoSyncHistory, loadAutoSyncHistory, AUTO_SYNC_HISTORY_LIMIT } from '../../../../../hooks/garminAutoSyncHistory';

const log = logger.module('AutoSyncScheduler');

/**
 * Configuration par défaut
 */
const DEFAULT_CONFIG = {
  // Seuil pour auto-sync intelligente (minutes)
  INTELLIGENT_SYNC_THRESHOLD_MIN: 30,
  
  // Intervalle de vérification (ms)
  CHECK_INTERVAL_MS: 60000, // 1 minute
  
  // Marge pour déclenchement planifié (ms)
  SCHEDULED_SYNC_MARGIN_MS: 30000, // 30 secondes
  
  // Minimum entre syncs (ms)
  MIN_INTERVAL_BETWEEN_SYNCS_MS: 60000 // 1 minute
};

/**
 * État du scheduler
 */
const state = {
  enabled: false,
  checkIntervalId: null,
  lastSyncTime: null,
  lastCheckTime: null,
  history: [],
  listeners: new Set(),
  config: { ...DEFAULT_CONFIG }
};

/**
 * Types de déclenchement AutoSync
 */
export const TRIGGER_TYPES = {
  SCHEDULED: 'scheduled', // Planifié (daily/weekly/custom)
  INTELLIGENT: 'intelligent', // Auto-sync intelligente (>30min ou pas de données aujourd'hui)
  MANUAL: 'manual' // Manuel (via bouton)
};

/**
 * Résultat d'un déclenchement AutoSync
 */
export const RESULT_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  SKIPPED: 'skipped', // Ignoré (trop récent, désactivé, etc.)
  CANCELLED: 'cancelled' // Annulé (composant démonté, etc.)
};

/**
 * Enregistre un déclenchement dans l'historique
 */
async function recordTrigger(trigger) {
  try {
    const entry = {
      id: `autosync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      triggerType: trigger.triggerType,
      result: trigger.result,
      reason: trigger.reason || null,
      error: trigger.error || null,
      duration: trigger.duration || null,
      dataFetched: trigger.dataFetched || false,
      settings: {
        enabled: trigger.settings?.enabled ?? false,
        schedule: trigger.settings?.schedule || null,
        customTime: trigger.settings?.customTime || null
      }
    };

    state.history.unshift(entry);
    
    // Limiter la taille de l'historique en mémoire
    if (state.history.length > AUTO_SYNC_HISTORY_LIMIT) {
      state.history = state.history.slice(0, AUTO_SYNC_HISTORY_LIMIT);
    }

    // Persister dans IndexedDB
    await persistAutoSyncHistory(entry);

    // Notifier les listeners
    notifyListeners('trigger', entry);

    log.debug('[AutoSyncScheduler] Déclenchement enregistré', {
      triggerType: trigger.triggerType,
      result: trigger.result,
      reason: trigger.reason
    });
  } catch (error) {
    log.error('[AutoSyncScheduler] Erreur lors de l\'enregistrement du déclenchement', error);
  }
}

/**
 * Notifie les listeners
 */
function notifyListeners(event, data) {
  state.listeners.forEach(listener => {
    try {
      listener(event, data);
    } catch (error) {
      log.error('[AutoSyncScheduler] Erreur dans listener', error);
    }
  });
}

/**
 * Calcule le prochain moment de synchronisation selon le schedule
 */
function calculateNextSync(schedule, customTime) {
  const now = new Date();
  const [hours, minutes] = customTime.split(':').map(Number);
  
  let next = new Date();
  next.setHours(hours, minutes, 0, 0);

  switch (schedule) {
    case 'daily':
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      break;
      
    case 'weekly':
      const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
      next.setDate(now.getDate() + daysUntilMonday);
      if (next <= now) {
        next.setDate(next.getDate() + 7);
      }
      break;
      
    case 'custom':
    default:
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      break;
  }
  
  return next;
}

/**
 * Vérifie si une auto-sync intelligente est nécessaire
 */
async function shouldTriggerIntelligentSync(getLastSyncDate, garminData) {
  try {
    const lastSyncDate = await getLastSyncDate();
    
    if (!lastSyncDate) {
      return {
        shouldSync: true,
        reason: 'Aucune synchronisation précédente'
      };
    }

    const lastSync = new Date(lastSyncDate);
    const now = new Date();
    const minutesSinceLastSync = (now - lastSync) / (1000 * 60);
    
    const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const hasTodayData = garminData?.dailyMetrics?.[todayLocal];

    if (minutesSinceLastSync > state.config.INTELLIGENT_SYNC_THRESHOLD_MIN) {
      return {
        shouldSync: true,
        reason: `Dernière synchronisation il y a ${Math.round(minutesSinceLastSync)} minutes`
      };
    }

    if (!hasTodayData) {
      return {
        shouldSync: true,
        reason: `Pas de données pour aujourd'hui (${todayLocal})`
      };
    }

    return {
      shouldSync: false,
      reason: `Données fraîches (dernière sync: ${Math.round(minutesSinceLastSync)}min)`
    };
  } catch (error) {
    log.error('[AutoSyncScheduler] Erreur lors de la vérification intelligente', error);
    return {
      shouldSync: false,
      reason: `Erreur: ${error.message}`
    };
  }
}

/**
 * Vérifie si une sync planifiée doit être déclenchée
 */
function shouldTriggerScheduledSync(settings) {
  if (!settings.enabled) {
    return {
      shouldSync: false,
      reason: 'Auto-sync planifiée désactivée'
    };
  }

  const nextSync = calculateNextSync(settings.schedule, settings.customTime);
  const now = new Date();
  const timeUntilSync = nextSync.getTime() - now.getTime();

  // Vérifier si on est dans la marge de déclenchement
  if (timeUntilSync <= state.config.SCHEDULED_SYNC_MARGIN_MS && timeUntilSync >= -state.config.SCHEDULED_SYNC_MARGIN_MS) {
    return {
      shouldSync: true,
      reason: `Sync planifiée (${settings.schedule} à ${settings.customTime})`,
      nextSync
    };
  }

  return {
    shouldSync: false,
    reason: `Prochaine sync planifiée: ${nextSync.toLocaleString('fr-FR')}`,
    nextSync
  };
}

/**
 * Vérifie si on peut déclencher une sync (évite les syncs trop fréquentes)
 */
function canTriggerSync() {
  if (!state.lastSyncTime) {
    return true;
  }

  const timeSinceLastSync = Date.now() - state.lastSyncTime;
  if (timeSinceLastSync < state.config.MIN_INTERVAL_BETWEEN_SYNCS_MS) {
    return {
      canSync: false,
      reason: `Sync trop récente (il y a ${Math.round(timeSinceLastSync / 1000)}s)`
    };
  }

  return {
    canSync: true
  };
}

/**
 * Démarre le scheduler
 */
export async function startScheduler(syncFunction, getLastSyncDate, garminData) {
  if (state.checkIntervalId) {
    log.warn('[AutoSyncScheduler] Scheduler déjà démarré');
    return;
  }

  // Charger l'historique depuis IndexedDB
  try {
    const history = await loadAutoSyncHistory(AUTO_SYNC_HISTORY_LIMIT);
    state.history = history || [];
    log.debug('[AutoSyncScheduler] Historique chargé', { count: state.history.length });
  } catch (error) {
    log.error('[AutoSyncScheduler] Erreur lors du chargement de l\'historique', error);
    state.history = [];
  }

  state.enabled = true;
  state.lastCheckTime = Date.now();

  const checkAndSync = async () => {
    if (!state.enabled) {
      return;
    }

    state.lastCheckTime = Date.now();

    try {
      const settings = getAutoSyncSettings();
      
      // Vérifier sync planifiée
      const scheduledCheck = shouldTriggerScheduledSync(settings);
      if (scheduledCheck.shouldSync) {
        const canSync = canTriggerSync();
        if (canSync.canSync) {
          const startTime = Date.now();
          try {
            await syncFunction();
            const duration = Date.now() - startTime;
            state.lastSyncTime = Date.now();
            
            await recordTrigger({
              triggerType: TRIGGER_TYPES.SCHEDULED,
              result: RESULT_TYPES.SUCCESS,
              reason: scheduledCheck.reason,
              duration,
              dataFetched: true,
              settings
            });
          } catch (error) {
            await recordTrigger({
              triggerType: TRIGGER_TYPES.SCHEDULED,
              result: RESULT_TYPES.ERROR,
              reason: scheduledCheck.reason,
              error: error.message,
              settings
            });
          }
          return;
        } else {
          await recordTrigger({
            triggerType: TRIGGER_TYPES.SCHEDULED,
            result: RESULT_TYPES.SKIPPED,
            reason: canSync.reason,
            settings
          });
        }
      }

      // Vérifier auto-sync intelligente (seulement si planifiée désactivée ou en complément)
      if (!settings.enabled || settings.allowIntelligentSync !== false) {
        const intelligentCheck = await shouldTriggerIntelligentSync(getLastSyncDate, garminData);
        if (intelligentCheck.shouldSync) {
          const canSync = canTriggerSync();
          if (canSync.canSync) {
            const startTime = Date.now();
            try {
              await syncFunction();
              const duration = Date.now() - startTime;
              state.lastSyncTime = Date.now();
              
              await recordTrigger({
                triggerType: TRIGGER_TYPES.INTELLIGENT,
                result: RESULT_TYPES.SUCCESS,
                reason: intelligentCheck.reason,
                duration,
                dataFetched: true,
                settings
              });
            } catch (error) {
              await recordTrigger({
                triggerType: TRIGGER_TYPES.INTELLIGENT,
                result: RESULT_TYPES.ERROR,
                reason: intelligentCheck.reason,
                error: error.message,
                settings
              });
            }
          } else {
            await recordTrigger({
              triggerType: TRIGGER_TYPES.INTELLIGENT,
              result: RESULT_TYPES.SKIPPED,
              reason: canSync.reason,
              settings
            });
          }
        }
      }
    } catch (error) {
      log.error('[AutoSyncScheduler] Erreur lors de la vérification', error);
    }
  };

  // Vérifier immédiatement
  checkAndSync();

  // Puis vérifier périodiquement
  state.checkIntervalId = setInterval(checkAndSync, state.config.CHECK_INTERVAL_MS);

  log.info('[AutoSyncScheduler] Scheduler démarré');
}

/**
 * Arrête le scheduler
 */
export function stopScheduler() {
  if (state.checkIntervalId) {
    clearInterval(state.checkIntervalId);
    state.checkIntervalId = null;
  }
  state.enabled = false;
  log.info('[AutoSyncScheduler] Scheduler arrêté');
}

/**
 * Enregistre un déclenchement manuel
 */
export async function recordManualTrigger(syncFunction, result, error = null, duration = null) {
  const startTime = Date.now();
  const settings = getAutoSyncSettings();
  
  await recordTrigger({
    triggerType: TRIGGER_TYPES.MANUAL,
    result: result || RESULT_TYPES.SUCCESS,
    reason: 'Synchronisation manuelle',
    error,
    duration: duration || (Date.now() - startTime),
    dataFetched: result === RESULT_TYPES.SUCCESS,
    settings
  });

  if (result === RESULT_TYPES.SUCCESS) {
    state.lastSyncTime = Date.now();
  }
}

/**
 * Obtient l'historique des déclenchements
 */
export function getHistory(limit = AUTO_SYNC_HISTORY_LIMIT) {
  return state.history.slice(0, limit);
}

/**
 * Obtient les statistiques
 */
export function getStats() {
  const history = state.history;
  const total = history.length;
  const byType = history.reduce((acc, entry) => {
    acc[entry.triggerType] = (acc[entry.triggerType] || 0) + 1;
    return acc;
  }, {});
  const byResult = history.reduce((acc, entry) => {
    acc[entry.result] = (acc[entry.result] || 0) + 1;
    return acc;
  }, {});

  const successful = history.filter(e => e.result === RESULT_TYPES.SUCCESS);
  const avgDuration = successful.length > 0
    ? successful.reduce((sum, e) => sum + (e.duration || 0), 0) / successful.length
    : 0;

  return {
    total,
    byType,
    byResult,
    avgDuration,
    lastSyncTime: state.lastSyncTime,
    lastCheckTime: state.lastCheckTime,
    enabled: state.enabled
  };
}

/**
 * Ajoute un listener pour les événements
 */
export function addListener(listener) {
  state.listeners.add(listener);
  return () => {
    state.listeners.delete(listener);
  };
}

/**
 * Configure le scheduler
 */
export function configure(config) {
  state.config = { ...state.config, ...config };
  log.debug('[AutoSyncScheduler] Configuration mise à jour', state.config);
}

export default {
  startScheduler,
  stopScheduler,
  recordManualTrigger,
  getHistory,
  getStats,
  addListener,
  configure,
  TRIGGER_TYPES,
  RESULT_TYPES
};

