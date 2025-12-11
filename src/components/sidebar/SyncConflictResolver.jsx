/**
 * Composant pour résoudre les conflits de synchronisation
 * Affiche les conflits détectés et permet à l'utilisateur de les résoudre
 * 
 * @module components/sidebar/SyncConflictResolver
 */

import React, { useState } from 'react';
import { useSyncState } from '../../hooks/useSyncState';
import { CONFLICT_TYPES } from '../../services/sidebar/realTimeSyncService';

/**
 * Composant de résolution des conflits de synchronisation
 */
const SyncConflictResolver = ({ className = '' }) => {
  const { activeConflicts, resolveConflict } = useSyncState();
  const [expandedConflict, setExpandedConflict] = useState(null);

  // Ne rien afficher s'il n'y a pas de conflits
  if (activeConflicts.length === 0) {
    return null;
  }

  /**
   * Obtient l'icône pour un type de conflit
   * @param {string} type - Type de conflit
   * @returns {string} Icône
   */
  const getConflictIcon = (type) => {
    switch (type) {
      case CONFLICT_TYPES.VERSION_MISMATCH:
        return '🔄';
      case CONFLICT_TYPES.CONCURRENT_EDIT:
        return '⚡';
      case CONFLICT_TYPES.DATA_CORRUPTION:
        return '⚠️';
      default:
        return '❓';
    }
  };

  /**
   * Obtient le titre pour un type de conflit
   * @param {string} type - Type de conflit
   * @returns {string} Titre
   */
  const getConflictTitle = (type) => {
    switch (type) {
      case CONFLICT_TYPES.VERSION_MISMATCH:
        return 'Conflit de version';
      case CONFLICT_TYPES.CONCURRENT_EDIT:
        return 'Édition simultanée';
      case CONFLICT_TYPES.DATA_CORRUPTION:
        return 'Données corrompues';
      default:
        return 'Conflit inconnu';
    }
  };

  /**
   * Obtient la description pour un type de conflit
   * @param {string} type - Type de conflit
   * @returns {string} Description
   */
  const getConflictDescription = (type) => {
    switch (type) {
      case CONFLICT_TYPES.VERSION_MISMATCH:
        return 'Les données ont été modifiées ailleurs. Choisissez quelle version conserver.';
      case CONFLICT_TYPES.CONCURRENT_EDIT:
        return 'Plusieurs modifications simultanées détectées. Fusion nécessaire.';
      case CONFLICT_TYPES.DATA_CORRUPTION:
        return 'Les données semblent corrompues. Rechargement recommandé.';
      default:
        return 'Un conflit de synchronisation s\'est produit.';
    }
  };

  /**
   * Gère la résolution d'un conflit
   * @param {string} conflictId - ID du conflit
   * @param {string} resolution - Type de résolution
   */
  const handleResolveConflict = async (conflictId, resolution) => {
    try {
      await resolveConflict(conflictId, resolution);
      setExpandedConflict(null);
    } catch (error) {
      console.error('[SyncConflictResolver] Erreur résolution conflit:', error);
    }
  };

  /**
   * Bascule l'expansion d'un conflit
   * @param {string} conflictId - ID du conflit
   */
  const toggleConflictExpansion = (conflictId) => {
    setExpandedConflict(expandedConflict === conflictId ? null : conflictId);
  };

  return (
    <div className={`sync-conflict-resolver ${className}`}>
      <div className="conflict-header">
        <span className="conflict-icon">⚠️</span>
        <span className="conflict-count">
          {activeConflicts.length} conflit{activeConflicts.length > 1 ? 's' : ''} de synchronisation
        </span>
      </div>

      <div className="conflicts-list">
        {activeConflicts.map((conflict) => (
          <div 
            key={conflict.id} 
            className={`conflict-item ${expandedConflict === conflict.id ? 'expanded' : ''}`}
          >
            <div 
              className="conflict-summary"
              onClick={() => toggleConflictExpansion(conflict.id)}
            >
              <span className="conflict-type-icon">
                {getConflictIcon(conflict.type)}
              </span>
              <div className="conflict-info">
                <div className="conflict-title">
                  {getConflictTitle(conflict.type)}
                </div>
                <div className="conflict-time">
                  {new Date(conflict.timestamp).toLocaleTimeString()}
                </div>
              </div>
              <span className="expand-icon">
                {expandedConflict === conflict.id ? '▼' : '▶'}
              </span>
            </div>

            {expandedConflict === conflict.id && (
              <div className="conflict-details">
                <div className="conflict-description">
                  {getConflictDescription(conflict.type)}
                </div>

                <div className="conflict-operation">
                  <strong>Opération:</strong> {conflict.operation?.eventName || 'Inconnue'}
                </div>

                <div className="conflict-actions">
                  {conflict.type === CONFLICT_TYPES.VERSION_MISMATCH && (
                    <>
                      <button
                        className="resolve-btn keep-current"
                        onClick={() => handleResolveConflict(conflict.id, 'keep_current')}
                      >
                        Garder la version actuelle
                      </button>
                      <button
                        className="resolve-btn keep_incoming"
                        onClick={() => handleResolveConflict(conflict.id, 'keep_incoming')}
                      >
                        Utiliser la nouvelle version
                      </button>
                    </>
                  )}

                  {conflict.type === CONFLICT_TYPES.CONCURRENT_EDIT && (
                    <>
                      <button
                        className="resolve-btn merge"
                        onClick={() => handleResolveConflict(conflict.id, 'merge')}
                      >
                        Fusionner automatiquement
                      </button>
                      <button
                        className="resolve-btn manual"
                        onClick={() => handleResolveConflict(conflict.id, 'manual_review')}
                      >
                        Révision manuelle
                      </button>
                    </>
                  )}

                  {conflict.type === CONFLICT_TYPES.DATA_CORRUPTION && (
                    <>
                      <button
                        className="resolve-btn reload"
                        onClick={() => handleResolveConflict(conflict.id, 'reload_from_source')}
                      >
                        Recharger les données
                      </button>
                      <button
                        className="resolve-btn reset"
                        onClick={() => handleResolveConflict(conflict.id, 'reset_to_default')}
                      >
                        Réinitialiser
                      </button>
                    </>
                  )}

                  <button
                    className="resolve-btn ignore"
                    onClick={() => handleResolveConflict(conflict.id, 'ignore')}
                  >
                    Ignorer
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SyncConflictResolver;