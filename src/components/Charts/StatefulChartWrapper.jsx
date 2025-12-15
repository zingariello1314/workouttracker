/**
 * Wrapper de Graphique avec Gestion d'États
 * Phase 6 - Tâche 6.3 : Créer les états d'erreur et de chargement uniformes
 * 
 * Ce composant gère tous les états possibles d'un graphique :
 * - États de chargement avec skeletons spécialisés
 * - États d'erreur avec actions de récupération
 * - États vides avec suggestions d'actions
 * - États de données partielles
 * - Transitions fluides entre états
 */

import React, { memo, useEffect, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import OptimizedChartWrapper from './OptimizedChartWrapper';
import chartStateService from '../../services/charts/chartStateService';
import '../../styles/charts-states.css';

const StatefulChartWrapper = memo(({
  children,
  data = [],
  loading = false,
  error = null,
  empty = false,
  partial = false,
  
  // Configuration des états
  chartType = 'line',
  loadingType = 'default',
  errorType = 'default',
  emptyType = 'noData',
  partialType = 'incomplete',
  
  // Messages personnalisés
  loadingMessage = '',
  errorMessage = '',
  emptyMessage = '',
  partialMessage = '',
  
  // Callbacks d'action
  onRetry,
  onDismissError,
  onClearFilters,
  onAdjustFilters,
  onContactSupport,
  
  // Options d'affichage
  showRetryButton = true,
  showErrorDetails = false,
  showEmptyActions = true,
  animateTransitions = true,
  persistentStates = false,
  
  // Props du wrapper optimisé
  ...optimizedProps
}) => {
  const chartRef = useRef(null);
  const [currentState, setCurrentState] = useState(null);
  const [stateHistory, setStateHistory] = useState([]);
  const [retryCount, setRetryCount] = useState(0);

  // Déterminer l'état actuel
  const determineState = useCallback(() => {
    if (loading) return { state: 'loading', type: loadingType };
    if (error) return { state: 'error', type: errorType };
    if (empty) return { state: 'empty', type: emptyType };
    if (partial) return { state: 'partial', type: partialType };
    return null;
  }, [loading, error, empty, partial, loadingType, errorType, emptyType, partialType]);

  // Appliquer l'état au graphique
  const applyState = useCallback((newState) => {
    if (!chartRef.current || !newState) return;

    const { state, type } = newState;
    
    // Préparer les options d'état
    const stateOptions = {
      type,
      chartType,
      message: getStateMessage(state),
      details: getStateDetails(state),
      animated: animateTransitions,
      persistent: persistentStates,
      onRetry: createRetryHandler(),
      onDismiss: createDismissHandler(),
      onClearFilters,
      onAdjustFilters,
      onContactSupport,
      element: chartRef.current
    };

    // Appliquer l'état via le service
    chartStateService.applyState(chartRef.current, state, stateOptions);
    
    // Mettre à jour l'état local
    setCurrentState(newState);
    
    // Ajouter à l'historique
    setStateHistory(prev => [...prev.slice(-4), {
      state: newState,
      timestamp: Date.now()
    }]);

  }, [
    chartType,
    animateTransitions,
    persistentStates,
    onClearFilters,
    onAdjustFilters,
    onContactSupport
  ]);

  // Supprimer l'état actuel
  const clearState = useCallback(() => {
    if (!chartRef.current) return;

    chartStateService.clearState(chartRef.current, animateTransitions);
    setCurrentState(null);
  }, [animateTransitions]);

  // Obtenir le message d'état approprié
  const getStateMessage = useCallback((state) => {
    switch (state) {
      case 'loading':
        return loadingMessage || 'Chargement du graphique...';
      case 'error':
        return errorMessage || (typeof error === 'string' ? error : 'Une erreur s\'est produite');
      case 'empty':
        return emptyMessage || 'Aucune donnée disponible';
      case 'partial':
        return partialMessage || 'Données partielles';
      default:
        return '';
    }
  }, [loadingMessage, errorMessage, emptyMessage, partialMessage, error]);

  // Obtenir les détails d'état
  const getStateDetails = useCallback((state) => {
    if (state === 'error' && showErrorDetails && error && typeof error === 'object') {
      return error;
    }
    return null;
  }, [showErrorDetails, error]);

  // Créer le gestionnaire de retry
  const createRetryHandler = useCallback(() => {
    if (!showRetryButton || !onRetry) return null;

    return async () => {
      try {
        setRetryCount(prev => prev + 1);
        await onRetry();
        // Le succès devrait déclencher un changement d'état depuis l'extérieur
      } catch (retryError) {
        console.error('Erreur lors du retry:', retryError);
        // L'erreur sera gérée par le composant parent
      }
    };
  }, [showRetryButton, onRetry]);

  // Créer le gestionnaire de dismiss
  const createDismissHandler = useCallback(() => {
    if (!onDismissError) return null;

    return () => {
      onDismissError();
      clearState();
    };
  }, [onDismissError, clearState]);

  // Effet pour gérer les changements d'état
  useEffect(() => {
    const newState = determineState();
    
    // Si l'état a changé
    if (!currentState && newState) {
      // Nouveau état à appliquer
      applyState(newState);
    } else if (currentState && !newState) {
      // État à supprimer
      clearState();
    } else if (currentState && newState && 
               (currentState.state !== newState.state || currentState.type !== newState.type)) {
      // État différent à appliquer
      applyState(newState);
    }
  }, [determineState, currentState, applyState, clearState]);

  // Nettoyage lors du démontage
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartStateService.cleanup(chartRef.current);
      }
    };
  }, []);

  // Gestionnaire d'événements d'état
  useEffect(() => {
    if (!chartRef.current) return;

    const handleStateChange = (event) => {
      const { from, to } = event.detail;
      
      // Émettre un événement personnalisé pour le composant parent
      const customEvent = new CustomEvent('chartStateTransition', {
        detail: { from, to, retryCount }
      });
      chartRef.current.dispatchEvent(customEvent);
    };

    const element = chartRef.current;
    element.addEventListener('chartStateChange', handleStateChange);

    return () => {
      element.removeEventListener('chartStateChange', handleStateChange);
    };
  }, [retryCount]);

  // Déterminer si le contenu doit être affiché
  const shouldShowContent = !loading && !error && !empty;

  // Props pour le wrapper optimisé
  const wrapperProps = {
    ...optimizedProps,
    data: shouldShowContent ? data : [],
    loading: false, // Géré par ce composant
    error: null,    // Géré par ce composant
    empty: false    // Géré par ce composant
  };

  return (
    <OptimizedChartWrapper
      ref={chartRef}
      {...wrapperProps}
      data-stateful-chart="true"
      data-current-state={currentState?.state || 'normal'}
      data-retry-count={retryCount}
    >
      {shouldShowContent && children}
      
      {/* Indicateur de données partielles si nécessaire */}
      {partial && shouldShowContent && (
        <PartialDataIndicator
          type={partialType}
          message={partialMessage}
          details={typeof partial === 'object' ? partial : null}
        />
      )}
      
      {/* Informations de debug en développement */}
      {process.env.NODE_ENV === 'development' && (
        <StateDebugInfo
          currentState={currentState}
          stateHistory={stateHistory}
          retryCount={retryCount}
          props={{
            loading,
            error: !!error,
            empty,
            partial
          }}
        />
      )}
    </OptimizedChartWrapper>
  );
});

StatefulChartWrapper.displayName = 'StatefulChartWrapper';

StatefulChartWrapper.propTypes = {
  // Contenu et données
  children: PropTypes.node,
  data: PropTypes.array,
  
  // États
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.object, PropTypes.bool]),
  empty: PropTypes.bool,
  partial: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
  
  // Configuration des états
  chartType: PropTypes.oneOf([
    'line', 'bar', 'pie', 'donut', 'area', 'radar', 'scatter', 'bubble'
  ]),
  loadingType: PropTypes.string,
  errorType: PropTypes.oneOf([
    'network', 'timeout', 'parsing', 'validation', 'permission', 'notFound', 'server', 'default'
  ]),
  emptyType: PropTypes.oneOf([
    'noData', 'filtered', 'loading', 'permission', 'maintenance', 'default'
  ]),
  partialType: PropTypes.oneOf([
    'incomplete', 'outdated', 'limited', 'default'
  ]),
  
  // Messages personnalisés
  loadingMessage: PropTypes.string,
  errorMessage: PropTypes.string,
  emptyMessage: PropTypes.string,
  partialMessage: PropTypes.string,
  
  // Callbacks d'action
  onRetry: PropTypes.func,
  onDismissError: PropTypes.func,
  onClearFilters: PropTypes.func,
  onAdjustFilters: PropTypes.func,
  onContactSupport: PropTypes.func,
  
  // Options d'affichage
  showRetryButton: PropTypes.bool,
  showErrorDetails: PropTypes.bool,
  showEmptyActions: PropTypes.bool,
  animateTransitions: PropTypes.bool,
  persistentStates: PropTypes.bool
};

// ===== COMPOSANT INDICATEUR DE DONNÉES PARTIELLES =====

const PartialDataIndicator = memo(({ type, message, details }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getPartialIcon = (type) => {
    const icons = {
      incomplete: '⚠️',
      outdated: '🕐',
      limited: '📊',
      default: '⚠️'
    };
    return icons[type] || icons.default;
  };

  const getPartialMessage = (type) => {
    const messages = {
      incomplete: 'Données incomplètes',
      outdated: 'Données obsolètes',
      limited: 'Données limitées',
      default: 'Données partielles'
    };
    return message || messages[type] || messages.default;
  };

  return (
    <div className="chart-partial-content">
      <div className="chart-partial-icon">
        {getPartialIcon(type)}
      </div>
      <div className="chart-partial-title">
        {getPartialMessage(type)}
      </div>
      {details && (
        <>
          <div className="chart-partial-message">
            Cliquez pour plus de détails
          </div>
          <button
            className="chart-partial-toggle"
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: '0.8rem',
              marginTop: '4px'
            }}
          >
            {isExpanded ? '▼ Masquer' : '▶ Détails'}
          </button>
          {isExpanded && (
            <div className="chart-partial-details" style={{
              marginTop: '8px',
              padding: '8px',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '4px',
              fontSize: '0.75rem',
              textAlign: 'left'
            }}>
              <pre>{JSON.stringify(details, null, 2)}</pre>
            </div>
          )}
        </>
      )}
    </div>
  );
});

PartialDataIndicator.displayName = 'PartialDataIndicator';

// ===== COMPOSANT DE DEBUG =====

const StateDebugInfo = memo(({ currentState, stateHistory, retryCount, props }) => {
  const [showDebug, setShowDebug] = useState(false);

  if (!showDebug) {
    return (
      <button
        onClick={() => setShowDebug(true)}
        style={{
          position: 'absolute',
          top: '5px',
          left: '5px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          border: 'none',
          padding: '2px 6px',
          fontSize: '10px',
          borderRadius: '3px',
          cursor: 'pointer',
          zIndex: 1001
        }}
      >
        States
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: '5px',
        left: '5px',
        background: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        padding: '8px',
        fontSize: '10px',
        borderRadius: '4px',
        maxWidth: '200px',
        zIndex: 1001,
        maxHeight: '200px',
        overflowY: 'auto'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <strong>States Debug</strong>
        <button
          onClick={() => setShowDebug(false)}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '0',
            fontSize: '12px'
          }}
        >
          ×
        </button>
      </div>
      
      <div><strong>État actuel:</strong></div>
      <div>{currentState ? `${currentState.state} (${currentState.type})` : 'normal'}</div>
      
      <div style={{ marginTop: '4px' }}><strong>Props:</strong></div>
      <div>Loading: {props.loading ? '✅' : '❌'}</div>
      <div>Error: {props.error ? '✅' : '❌'}</div>
      <div>Empty: {props.empty ? '✅' : '❌'}</div>
      <div>Partial: {props.partial ? '✅' : '❌'}</div>
      
      <div style={{ marginTop: '4px' }}><strong>Retry:</strong> {retryCount}</div>
      
      {stateHistory.length > 0 && (
        <>
          <div style={{ marginTop: '4px' }}><strong>Historique:</strong></div>
          {stateHistory.slice(-3).map((entry, index) => (
            <div key={index} style={{ fontSize: '9px', opacity: 0.7 }}>
              {entry.state.state} ({new Date(entry.timestamp).toLocaleTimeString()})
            </div>
          ))}
        </>
      )}
    </div>
  );
});

StateDebugInfo.displayName = 'StateDebugInfo';

// ===== HOOKS UTILITAIRES =====

/**
 * Hook pour gérer les états d'un graphique
 */
export const useChartState = (initialState = {}) => {
  const [state, setState] = useState({
    loading: false,
    error: null,
    empty: false,
    partial: false,
    ...initialState
  });

  const setLoading = useCallback((loading) => {
    setState(prev => ({ ...prev, loading, error: null }));
  }, []);

  const setError = useCallback((error) => {
    setState(prev => ({ ...prev, error, loading: false }));
  }, []);

  const setEmpty = useCallback((empty) => {
    setState(prev => ({ ...prev, empty }));
  }, []);

  const setPartial = useCallback((partial) => {
    setState(prev => ({ ...prev, partial }));
  }, []);

  const clearState = useCallback(() => {
    setState({
      loading: false,
      error: null,
      empty: false,
      partial: false
    });
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, [initialState]);

  return {
    ...state,
    setLoading,
    setError,
    setEmpty,
    setPartial,
    clearState,
    reset
  };
};

/**
 * Hook pour gérer les retry avec backoff
 */
export const useRetryWithBackoff = (retryFn, maxRetries = 3) => {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const retry = useCallback(async () => {
    if (retryCount >= maxRetries || isRetrying) return;

    setIsRetrying(true);
    
    try {
      // Délai exponentiel : 1s, 2s, 4s, 8s...
      const delay = Math.pow(2, retryCount) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      await retryFn();
      setRetryCount(0); // Reset en cas de succès
    } catch (error) {
      setRetryCount(prev => prev + 1);
      throw error;
    } finally {
      setIsRetrying(false);
    }
  }, [retryFn, retryCount, maxRetries, isRetrying]);

  const reset = useCallback(() => {
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  return {
    retry,
    retryCount,
    isRetrying,
    canRetry: retryCount < maxRetries && !isRetrying,
    reset
  };
};

export default StatefulChartWrapper;