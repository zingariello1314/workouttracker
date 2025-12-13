/**
 * Gestionnaire d'erreurs de synchronisation pour les modules sidebar historiques
 * Gère les erreurs de sync temps réel, retry automatique et fallbacks
 * 
 * Requirements: 14.5 - Gestion gracieuse des erreurs de synchronisation
 * 
 * @module services/sidebar/syncErrorHandler
 */

import { errorHandlingService, SYSTEM_ERROR_TYPES } from './errorHandlingService';

/**
 * Types d'erreurs de synchronisation
 */
export const SYNC_ERROR_TYPES = {
  CONNECTION_LOST: 'connection_lost',
  DATA_CONFLICT: 'data_conflict',
  SYNC_TIMEOUT: 'sync_timeout',
  INVALID_DATA: 'invalid_data',
  PERMISSION_DENIED: 'permission_denied',
  RATE_LIMITED: 'rate_limited',
  SERVER_ERROR: 'server_error'
};

/**
 * États de synchronisation
 */
export const SYNC_STATES = {
  CONNECTED: 'connected',
  CONNECTING: 'connecting',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
  RETRYING: 'retrying'
};

/**
 * Configuration des timeouts de synchronisation
 */
const SYNC_TIMEOUTS = {
  CONNECTION: 5000,
  DATA_SYNC: 3000,
  RETRY_DELAY: 1000,
  MAX_RETRY_DELAY: 30000
};

/**
 * Gestionnaire d'erreurs de synchronisation
 */
class SyncErrorHandler {
  constructor() {
    this.isInitialized = false;
    this.syncState = SYNC_STATES.DISCONNECTED;
    this.activeSyncs = new Map();
    this.syncHistory = [];
    this.retryAttempts = new Map();
    this.conflictQueue = [];
    
    // Configuration
    this.config = {
      maxRetries: 5,
      baseRetryDelay: 1000,
      maxRetryDelay: 30000,
      conflictResolutionTimeout: 10000,
      heartbeatInterval: 30000,
      debugMode: process.env.NODE_ENV === 'development'
    };
    
    // Statistiques
    this.stats = {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      retriedSyncs: 0,
      conflictsResolved: 0,
      errorsByType: {},
      averageSyncTime: 0,
      lastSyncTime: null
    };
    
    // Timers
    this.heartbeatTimer = null;
    this.reconnectTimer = null;
  }

  /**
   * Initialise le gestionnaire d'erreurs de synchronisation
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    console.log('[SyncErrorHandler] Initializing sync error handler...');
    
    try {
      // Écouter les événements de synchronisation
      this.setupSyncListeners();
      
      // Écouter les événements d'erreur
      this.setupErrorListeners();
      
      // Démarrer le heartbeat
      this.startHeartbeat();
      
      // Tenter la connexion initiale
      await this.attemptInitialConnection();
      
      this.isInitialized = true;
      console.log('[SyncErrorHandler] Sync error handler initialized');
      
    } catch (error) {
      console.error('[SyncErrorHandler] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Configure les écouteurs d'événements de synchronisation
   */
  setupSyncListeners() {
    if (typeof window === 'undefined') return;
    
    // Écouter les demandes de synchronisation
    window.addEventListener('sidebar:sync:request', (event) => {
      this.handleSyncRequest(event.detail);
    });
    
    // Écouter les succès de synchronisation
    window.addEventListener('sidebar:sync:success', (event) => {
      this.handleSyncSuccess(event.detail);
    });
    
    // Écouter les échecs de synchronisation
    window.addEventListener('sidebar:sync:failed', (event) => {
      this.handleSyncFailure(event.detail);
    });
    
    // Écouter les demandes de reconnexion
    window.addEventListener('sidebar:sync:reconnect', (event) => {
      this.handleReconnectRequest(event.detail);
    });
    
    // Écouter les conflits de données
    window.addEventListener('sidebar:sync:conflict', (event) => {
      this.handleDataConflict(event.detail);
    });
  }

  /**
   * Configure les écouteurs d'erreurs
   */
  setupErrorListeners() {
    if (typeof window === 'undefined') return;
    
    // Écouter les erreurs de connexion
    window.addEventListener('websocket:error', (event) => {
      this.handleConnectionError(event.detail);
    });
    
    // Écouter les déconnexions
    window.addEventListener('websocket:close', (event) => {
      this.handleConnectionLost(event.detail);
    });
    
    // Écouter les erreurs de données
    window.addEventListener('data:validation:error', (event) => {
      this.handleDataValidationError(event.detail);
    });
  }

  /**
   * Tente la connexion initiale
   */
  async attemptInitialConnection() {
    this.setSyncState(SYNC_STATES.CONNECTING);
    
    try {
      // Émettre l'événement de connexion
      window.dispatchEvent(new CustomEvent('sidebar:sync:connect', {
        detail: { timeout: SYNC_TIMEOUTS.CONNECTION }
      }));
      
      // Attendre la confirmation de connexion
      const connected = await this.waitForConnection();
      
      if (connected) {
        this.setSyncState(SYNC_STATES.CONNECTED);
        console.log('[SyncErrorHandler] Initial connection successful');
      } else {
        throw new Error('Initial connection timeout');
      }
      
    } catch (error) {
      console.error('[SyncErrorHandler] Initial connection failed:', error);
      this.setSyncState(SYNC_STATES.ERROR);
      
      // Programmer une reconnexion
      this.scheduleReconnect();
    }
  }

  /**
   * Attend la confirmation de connexion
   */
  waitForConnection() {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), SYNC_TIMEOUTS.CONNECTION);
      
      const handleConnected = () => {
        clearTimeout(timeout);
        window.removeEventListener('sidebar:sync:connected', handleConnected);
        resolve(true);
      };
      
      window.addEventListener('sidebar:sync:connected', handleConnected);
    });
  }

  /**
   * Démarre le heartbeat
   */
  startHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    
    this.heartbeatTimer = setInterval(() => {
      this.performHeartbeat();
    }, this.config.heartbeatInterval);
  }

  /**
   * Effectue un heartbeat
   */
  performHeartbeat() {
    if (this.syncState === SYNC_STATES.CONNECTED) {
      window.dispatchEvent(new CustomEvent('sidebar:sync:heartbeat'));
    }
  }

  /**
   * Gère une demande de synchronisation
   */
  async handleSyncRequest(syncData) {
    const syncId = this.generateSyncId(syncData);
    
    console.log(`[SyncErrorHandler] Handling sync request:`, syncData);
    
    // Vérifier l'état de connexion
    if (this.syncState !== SYNC_STATES.CONNECTED) {
      await this.handleSyncFailure({
        ...syncData,
        syncId,
        error: 'Not connected'
      });
      return;
    }
    
    // Enregistrer la synchronisation active
    this.activeSyncs.set(syncId, {
      ...syncData,
      startTime: Date.now(),
      attempts: 0
    });
    
    this.stats.totalSyncs++;
    
    try {
      // Exécuter la synchronisation avec timeout
      const success = await this.executeSyncWithTimeout(syncData);
      
      if (success) {
        this.handleSyncSuccess({ ...syncData, syncId });
      } else {
        this.handleSyncFailure({ 
          ...syncData, 
          syncId,
          error: 'Sync timeout'
        });
      }
      
    } catch (error) {
      this.handleSyncFailure({ 
        ...syncData, 
        syncId,
        error: error.message
      });
    }
  }

  /**
   * Exécute la synchronisation avec timeout
   */
  async executeSyncWithTimeout(syncData) {
    const timeout = SYNC_TIMEOUTS.DATA_SYNC;
    
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        resolve(false);
      }, timeout);
      
      this.executeSync(syncData)
        .then((success) => {
          clearTimeout(timeoutId);
          resolve(success);
        })
        .catch(() => {
          clearTimeout(timeoutId);
          resolve(false);
        });
    });
  }

  /**
   * Exécute la synchronisation
   */
  async executeSync(syncData) {
    const { moduleId, dataType, data, operation } = syncData;
    
    try {
      // Émettre l'événement de synchronisation
      window.dispatchEvent(new CustomEvent('sidebar:data:sync', {
        detail: {
          moduleId,
          dataType,
          data,
          operation,
          timestamp: Date.now()
        }
      }));
      
      // Attendre la confirmation
      return await this.waitForSyncConfirmation(syncData);
      
    } catch (error) {
      console.error('[SyncErrorHandler] Sync execution failed:', error);
      return false;
    }
  }

  /**
   * Attend la confirmation de synchronisation
   */
  waitForSyncConfirmation(syncData) {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), SYNC_TIMEOUTS.DATA_SYNC);
      
      const handleConfirmation = (event) => {
        const { detail } = event;
        if (detail.moduleId === syncData.moduleId && detail.dataType === syncData.dataType) {
          clearTimeout(timeout);
          window.removeEventListener('sidebar:sync:confirmed', handleConfirmation);
          resolve(true);
        }
      };
      
      window.addEventListener('sidebar:sync:confirmed', handleConfirmation);
    });
  }

  /**
   * Gère le succès de synchronisation
   */
  handleSyncSuccess(syncData) {
    const { syncId } = syncData;
    
    console.log(`[SyncErrorHandler] Sync successful:`, syncData);
    
    // Nettoyer la synchronisation active
    const activeSync = this.activeSyncs.get(syncId);
    if (activeSync) {
      const syncTime = Date.now() - activeSync.startTime;
      this.updateSyncStats(true, syncTime);
      this.activeSyncs.delete(syncId);
    }
    
    // Mettre à jour les statistiques
    this.stats.successfulSyncs++;
    this.stats.lastSyncTime = Date.now();
    
    // Ajouter à l'historique
    this.addToSyncHistory({
      ...syncData,
      success: true,
      timestamp: Date.now()
    });
    
    // Nettoyer les tentatives de retry
    const retryKey = this.getRetryKey(syncData);
    this.retryAttempts.delete(retryKey);
  }

  /**
   * Gère l'échec de synchronisation
   */
  async handleSyncFailure(syncData) {
    const { syncId, error } = syncData;
    
    console.error(`[SyncErrorHandler] Sync failed:`, syncData);
    
    // Mettre à jour les statistiques
    this.stats.failedSyncs++;
    
    // Déterminer le type d'erreur
    const errorType = this.classifySyncError(error);
    
    if (!this.stats.errorsByType[errorType]) {
      this.stats.errorsByType[errorType] = 0;
    }
    this.stats.errorsByType[errorType]++;
    
    // Ajouter à l'historique
    this.addToSyncHistory({
      ...syncData,
      success: false,
      error,
      errorType,
      timestamp: Date.now()
    });
    
    // Tenter un retry si possible
    const retryKey = this.getRetryKey(syncData);
    const currentRetries = this.retryAttempts.get(retryKey) || 0;
    
    if (currentRetries < this.config.maxRetries && this.shouldRetry(errorType)) {
      console.log(`[SyncErrorHandler] Attempting retry ${currentRetries + 1}/${this.config.maxRetries}`);
      
      this.retryAttempts.set(retryKey, currentRetries + 1);
      this.stats.retriedSyncs++;
      
      // Calculer le délai de retry avec backoff exponentiel
      const delay = Math.min(
        this.config.baseRetryDelay * Math.pow(2, currentRetries),
        this.config.maxRetryDelay
      );
      
      setTimeout(() => {
        this.handleSyncRequest(syncData);
      }, delay);
      
    } else {
      // Échec définitif - appliquer les fallbacks
      await this.applySyncFallback(syncData, errorType);
      
      // Nettoyer
      this.activeSyncs.delete(syncId);
      this.retryAttempts.delete(retryKey);
      
      // Notifier le service d'erreur principal
      await errorHandlingService.handleSystemError(SYSTEM_ERROR_TYPES.SYNC_FAILED, {
        ...syncData,
        error,
        errorType
      });
    }
  }

  /**
   * Classifie le type d'erreur de synchronisation
   */
  classifySyncError(error) {
    const errorMessage = error?.toLowerCase() || '';
    
    if (errorMessage.includes('connection') || errorMessage.includes('network')) {
      return SYNC_ERROR_TYPES.CONNECTION_LOST;
    }
    
    if (errorMessage.includes('conflict') || errorMessage.includes('version')) {
      return SYNC_ERROR_TYPES.DATA_CONFLICT;
    }
    
    if (errorMessage.includes('timeout')) {
      return SYNC_ERROR_TYPES.SYNC_TIMEOUT;
    }
    
    if (errorMessage.includes('invalid') || errorMessage.includes('validation')) {
      return SYNC_ERROR_TYPES.INVALID_DATA;
    }
    
    if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
      return SYNC_ERROR_TYPES.PERMISSION_DENIED;
    }
    
    if (errorMessage.includes('rate') || errorMessage.includes('limit')) {
      return SYNC_ERROR_TYPES.RATE_LIMITED;
    }
    
    return SYNC_ERROR_TYPES.SERVER_ERROR;
  }

  /**
   * Détermine si un retry doit être tenté
   */
  shouldRetry(errorType) {
    const retryableErrors = [
      SYNC_ERROR_TYPES.CONNECTION_LOST,
      SYNC_ERROR_TYPES.SYNC_TIMEOUT,
      SYNC_ERROR_TYPES.SERVER_ERROR,
      SYNC_ERROR_TYPES.RATE_LIMITED
    ];
    
    return retryableErrors.includes(errorType);
  }

  /**
   * Applique les fallbacks de synchronisation
   */
  async applySyncFallback(syncData, errorType) {
    console.log(`[SyncErrorHandler] Applying fallback for ${errorType}:`, syncData);
    
    try {
      switch (errorType) {
        case SYNC_ERROR_TYPES.CONNECTION_LOST:
          // Fallback: utiliser les données en cache
          await this.useCachedData(syncData);
          this.scheduleReconnect();
          break;
          
        case SYNC_ERROR_TYPES.DATA_CONFLICT:
          // Fallback: ajouter à la queue de résolution de conflits
          this.queueConflictResolution(syncData);
          break;
          
        case SYNC_ERROR_TYPES.INVALID_DATA:
          // Fallback: utiliser les données par défaut
          await this.useDefaultData(syncData);
          break;
          
        case SYNC_ERROR_TYPES.PERMISSION_DENIED:
          // Fallback: mode lecture seule
          this.enableReadOnlyMode(syncData);
          break;
          
        case SYNC_ERROR_TYPES.RATE_LIMITED:
          // Fallback: différer la synchronisation
          this.deferSync(syncData);
          break;
          
        default:
          // Fallback général: utiliser les données en cache
          await this.useCachedData(syncData);
      }
      
    } catch (fallbackError) {
      console.error('[SyncErrorHandler] Fallback failed:', fallbackError);
    }
  }

  /**
   * Utilise les données en cache
   */
  async useCachedData(syncData) {
    window.dispatchEvent(new CustomEvent('sidebar:use:cache', {
      detail: {
        moduleId: syncData.moduleId,
        dataType: syncData.dataType,
        fallbackReason: 'sync_failed'
      }
    }));
  }

  /**
   * Utilise les données par défaut
   */
  async useDefaultData(syncData) {
    window.dispatchEvent(new CustomEvent('sidebar:use:default', {
      detail: {
        moduleId: syncData.moduleId,
        dataType: syncData.dataType,
        fallbackReason: 'invalid_data'
      }
    }));
  }

  /**
   * Active le mode lecture seule
   */
  enableReadOnlyMode(syncData) {
    window.dispatchEvent(new CustomEvent('sidebar:mode:readonly', {
      detail: {
        moduleId: syncData.moduleId,
        reason: 'permission_denied'
      }
    }));
  }

  /**
   * Diffère la synchronisation
   */
  deferSync(syncData) {
    // Programmer la synchronisation pour plus tard
    setTimeout(() => {
      this.handleSyncRequest(syncData);
    }, 60000); // 1 minute
  }

  /**
   * Ajoute un conflit à la queue de résolution
   */
  queueConflictResolution(syncData) {
    this.conflictQueue.push({
      ...syncData,
      timestamp: Date.now()
    });
    
    // Notifier l'utilisateur du conflit
    window.dispatchEvent(new CustomEvent('sidebar:notification:show', {
      detail: {
        type: 'warning',
        severity: 'medium',
        title: 'Conflit de données détecté',
        message: `Conflit dans le module ${syncData.moduleId}. Résolution en cours...`,
        actions: [
          { label: 'Résoudre', action: 'resolve_conflict', data: syncData },
          { label: 'Ignorer', action: 'dismiss' }
        ],
        duration: 10000
      }
    }));
  }

  /**
   * Gère les erreurs de connexion
   */
  handleConnectionError(errorData) {
    console.error('[SyncErrorHandler] Connection error:', errorData);
    
    this.setSyncState(SYNC_STATES.ERROR);
    
    // Programmer une reconnexion
    this.scheduleReconnect();
  }

  /**
   * Gère la perte de connexion
   */
  handleConnectionLost(errorData) {
    console.warn('[SyncErrorHandler] Connection lost:', errorData);
    
    this.setSyncState(SYNC_STATES.DISCONNECTED);
    
    // Programmer une reconnexion
    this.scheduleReconnect();
    
    // Notifier l'utilisateur
    window.dispatchEvent(new CustomEvent('sidebar:notification:show', {
      detail: {
        type: 'warning',
        severity: 'medium',
        message: 'Connexion perdue. Tentative de reconnexion...',
        duration: 5000
      }
    }));
  }

  /**
   * Gère les erreurs de validation de données
   */
  handleDataValidationError(errorData) {
    console.error('[SyncErrorHandler] Data validation error:', errorData);
    
    // Traiter comme une erreur de données invalides
    this.handleSyncFailure({
      ...errorData,
      error: 'Data validation failed'
    });
  }

  /**
   * Gère les demandes de reconnexion
   */
  async handleReconnectRequest(requestData) {
    console.log('[SyncErrorHandler] Reconnection requested:', requestData);
    
    if (this.syncState === SYNC_STATES.CONNECTING || this.syncState === SYNC_STATES.RETRYING) {
      console.log('[SyncErrorHandler] Reconnection already in progress');
      return;
    }
    
    await this.attemptReconnection();
  }

  /**
   * Gère les conflits de données
   */
  handleDataConflict(conflictData) {
    console.warn('[SyncErrorHandler] Data conflict:', conflictData);
    
    this.queueConflictResolution(conflictData);
  }

  /**
   * Programme une reconnexion
   */
  scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    this.reconnectTimer = setTimeout(() => {
      this.attemptReconnection();
    }, 5000); // 5 secondes
  }

  /**
   * Tente une reconnexion
   */
  async attemptReconnection() {
    if (this.syncState === SYNC_STATES.CONNECTING || this.syncState === SYNC_STATES.RETRYING) {
      return;
    }
    
    console.log('[SyncErrorHandler] Attempting reconnection...');
    
    this.setSyncState(SYNC_STATES.RETRYING);
    
    try {
      await this.attemptInitialConnection();
      
      // Notifier le succès de reconnexion
      window.dispatchEvent(new CustomEvent('sidebar:notification:show', {
        detail: {
          type: 'success',
          message: 'Connexion rétablie',
          duration: 3000
        }
      }));
      
    } catch (error) {
      console.error('[SyncErrorHandler] Reconnection failed:', error);
      
      // Programmer une nouvelle tentative
      this.scheduleReconnect();
    }
  }

  /**
   * Définit l'état de synchronisation
   */
  setSyncState(newState) {
    const oldState = this.syncState;
    this.syncState = newState;
    
    console.log(`[SyncErrorHandler] Sync state changed: ${oldState} -> ${newState}`);
    
    // Émettre l'événement de changement d'état
    window.dispatchEvent(new CustomEvent('sidebar:sync:state:changed', {
      detail: {
        oldState,
        newState,
        timestamp: Date.now()
      }
    }));
  }

  /**
   * Utilitaires
   */
  
  generateSyncId(syncData) {
    const { moduleId, dataType, operation } = syncData;
    return `sync_${moduleId}_${dataType}_${operation}_${Date.now()}`;
  }

  getRetryKey(syncData) {
    return `${syncData.moduleId}_${syncData.dataType}_${syncData.operation}`;
  }

  addToSyncHistory(syncRecord) {
    this.syncHistory.push(syncRecord);
    
    // Limiter la taille de l'historique
    if (this.syncHistory.length > 200) {
      this.syncHistory.shift();
    }
  }

  updateSyncStats(success, syncTime) {
    if (success) {
      // Calculer le temps moyen de synchronisation
      const totalSyncs = this.stats.successfulSyncs + 1;
      this.stats.averageSyncTime = 
        (this.stats.averageSyncTime * this.stats.successfulSyncs + syncTime) / totalSyncs;
    }
  }

  /**
   * API publique
   */
  
  /**
   * Force une synchronisation avec gestion d'erreur
   */
  async syncWithErrorHandling(syncData) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    return await this.handleSyncRequest(syncData);
  }

  /**
   * Obtient l'état actuel de synchronisation
   */
  getSyncState() {
    return this.syncState;
  }

  /**
   * Obtient les statistiques de synchronisation
   */
  getStats() {
    return {
      ...this.stats,
      syncState: this.syncState,
      activeSyncs: this.activeSyncs.size,
      retryAttempts: this.retryAttempts.size,
      conflictQueue: this.conflictQueue.length,
      historySize: this.syncHistory.length
    };
  }

  /**
   * Obtient l'historique de synchronisation
   */
  getSyncHistory(limit = 50) {
    return this.syncHistory.slice(-limit);
  }

  /**
   * Résout un conflit de données
   */
  async resolveConflict(conflictId, resolution) {
    const conflict = this.conflictQueue.find(c => c.syncId === conflictId);
    
    if (!conflict) {
      console.warn(`[SyncErrorHandler] Conflict not found: ${conflictId}`);
      return false;
    }
    
    try {
      // Appliquer la résolution
      window.dispatchEvent(new CustomEvent('sidebar:conflict:resolve', {
        detail: {
          conflict,
          resolution,
          timestamp: Date.now()
        }
      }));
      
      // Supprimer de la queue
      this.conflictQueue = this.conflictQueue.filter(c => c.syncId !== conflictId);
      
      this.stats.conflictsResolved++;
      
      return true;
      
    } catch (error) {
      console.error('[SyncErrorHandler] Conflict resolution failed:', error);
      return false;
    }
  }

  /**
   * Nettoie les ressources
   */
  cleanup() {
    console.log('[SyncErrorHandler] Cleaning up sync error handler');
    
    // Nettoyer les timers
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Nettoyer les données
    this.activeSyncs.clear();
    this.retryAttempts.clear();
    this.conflictQueue = [];
    this.syncHistory = [];
    
    this.setSyncState(SYNC_STATES.DISCONNECTED);
    this.isInitialized = false;
  }
}

// Instance singleton
export const syncErrorHandler = new SyncErrorHandler();

export default syncErrorHandler;