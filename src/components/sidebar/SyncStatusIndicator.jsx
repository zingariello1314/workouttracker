/**
 * Indicateur d'état de synchronisation pour la sidebar
 * Affiche l'état actuel de la synchronisation temps réel
 * 
 * @module components/sidebar/SyncStatusIndicator
 */

import React from 'react';
import { useSyncStatus } from '../../hooks/useSyncState';
import { SYNC_STATES } from '../../services/sidebar/realTimeSyncService';

/**
 * Composant d'indicateur d'état de synchronisation
 */
const SyncStatusIndicator = ({ className = '', showText = true, size = 'small' }) => {
  const { isSyncing, hasErrors, hasConflicts, isHealthy } = useSyncStatus();

  /**
   * Obtient l'icône selon l'état
   * @returns {string} Icône
   */
  const getStatusIcon = () => {
    if (hasErrors) return '❌';
    if (hasConflicts) return '⚠️';
    if (isSyncing) return '🔄';
    if (isHealthy) return '✅';
    return '⚪';
  };

  /**
   * Obtient le texte selon l'état
   * @returns {string} Texte d'état
   */
  const getStatusText = () => {
    if (hasErrors) return 'Erreur de sync';
    if (hasConflicts) return 'Conflits détectés';
    if (isSyncing) return 'Synchronisation...';
    if (isHealthy) return 'Synchronisé';
    return 'Hors ligne';
  };

  /**
   * Obtient la classe CSS selon l'état
   * @returns {string} Classe CSS
   */
  const getStatusClass = () => {
    if (hasErrors) return 'error';
    if (hasConflicts) return 'warning';
    if (isSyncing) return 'syncing';
    if (isHealthy) return 'success';
    return 'offline';
  };

  /**
   * Obtient la couleur selon l'état
   * @returns {string} Couleur
   */
  const getStatusColor = () => {
    if (hasErrors) return '#dc3545';
    if (hasConflicts) return '#ffc107';
    if (isSyncing) return '#007bff';
    if (isHealthy) return '#28a745';
    return '#6c757d';
  };

  return (
    <div 
      className={`sync-status-indicator ${getStatusClass()} size-${size} ${className}`}
      title={getStatusText()}
    >
      <span 
        className={`status-icon ${isSyncing ? 'spinning' : ''}`}
        style={{ color: getStatusColor() }}
      >
        {getStatusIcon()}
      </span>
      
      {showText && (
        <span className="status-text">
          {getStatusText()}
        </span>
      )}
    </div>
  );
};

/**
 * Composant d'indicateur détaillé avec statistiques
 */
export const DetailedSyncStatus = ({ className = '' }) => {
  const { syncState, activeConflicts, syncStats, syncHealth } = useSyncState();

  return (
    <div className={`detailed-sync-status ${className}`}>
      <div className="sync-header">
        <SyncStatusIndicator size="medium" />
        <span className="sync-health">Santé: {syncHealth}</span>
      </div>
      
      <div className="sync-stats">
        <div className="stat-item">
          <span className="stat-label">Opérations:</span>
          <span className="stat-value">{syncStats.totalOperations}</span>
        </div>
        
        <div className="stat-item">
          <span className="stat-label">Succès:</span>
          <span className="stat-value success">{syncStats.successfulOperations}</span>
        </div>
        
        <div className="stat-item">
          <span className="stat-label">Échecs:</span>
          <span className="stat-value error">{syncStats.failedOperations}</span>
        </div>
        
        <div className="stat-item">
          <span className="stat-label">Conflits résolus:</span>
          <span className="stat-value warning">{syncStats.conflictsResolved}</span>
        </div>
      </div>
      
      {activeConflicts.length > 0 && (
        <div className="active-conflicts">
          <span className="conflicts-count">
            {activeConflicts.length} conflit{activeConflicts.length > 1 ? 's' : ''} actif{activeConflicts.length > 1 ? 's' : ''}
          </span>
        </div>
      )}
      
      {syncStats.lastSyncTime && (
        <div className="last-sync">
          Dernière sync: {new Date(syncStats.lastSyncTime).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default SyncStatusIndicator;