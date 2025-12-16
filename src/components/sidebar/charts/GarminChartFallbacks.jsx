import React, { memo, useCallback } from 'react';

/**
 * Composants de fallback pour les différents cas d'erreur des graphiques Garmin
 * 
 * Requirements: 1.4, 1.5
 * - Affichage des messages d'erreur informatifs (1.4)
 * - Fallbacks pour données manquantes (1.4)
 * - Mode dégradé pour les performances (1.5)
 */

/**
 * Fallback pour données manquantes
 */
export const MissingDataFallback = memo(({ 
  selectedDate, 
  onSyncRequest,
  compactMode = false,
  className = ''
}) => {
  const handleSyncClick = useCallback(() => {
    if (onSyncRequest) {
      onSyncRequest();
    }
  }, [onSyncRequest]);

  return (
    <div className={`garmin-fallback missing-data ${compactMode ? 'compact' : ''} ${className}`}>
      <div className="fallback-content">
        <div className="fallback-icon">
          {compactMode ? '📊' : '📊💤'}
        </div>
        
        <div className="fallback-message">
          <h4 className="fallback-title">
            {compactMode ? 'Pas de données FC' : 'Aucune donnée de fréquence cardiaque'}
          </h4>
          
          {!compactMode && selectedDate && (
            <p className="fallback-description">
              Aucune donnée disponible pour le {new Date(selectedDate).toLocaleDateString('fr-FR')}
            </p>
          )}
        </div>
        
        <div className="fallback-actions">
          {onSyncRequest && (
            <button
              onClick={handleSyncClick}
              className="sync-button primary"
              title="Synchroniser les données Garmin"
            >
              {compactMode ? '🔄 Sync' : '🔄 Synchroniser Garmin'}
            </button>
          )}
          
          <div className="fallback-hint">
            {compactMode ? 'Portez votre montre' : 'Portez votre montre Garmin pour collecter des données'}
          </div>
        </div>
      </div>
    </div>
  );
});

MissingDataFallback.displayName = 'MissingDataFallback';

/**
 * Fallback pour erreur de chargement
 */
export const LoadingErrorFallback = memo(({ 
  error, 
  onRetry,
  retryCount = 0,
  maxRetries = 3,
  compactMode = false,
  className = ''
}) => {
  const canRetry = retryCount < maxRetries;
  
  const handleRetryClick = useCallback(() => {
    if (onRetry && canRetry) {
      onRetry();
    }
  }, [onRetry, canRetry]);

  // Déterminer le type d'erreur pour un message approprié
  const getErrorMessage = () => {
    if (!error) return 'Erreur inconnue';
    
    const errorMessage = error.message || error.toString();
    
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return compactMode ? 'Erreur réseau' : 'Erreur de connexion réseau';
    }
    
    if (errorMessage.includes('timeout')) {
      return compactMode ? 'Délai dépassé' : 'Délai d\'attente dépassé';
    }
    
    if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
      return compactMode ? 'Accès refusé' : 'Problème d\'autorisation';
    }
    
    return compactMode ? 'Erreur chargement' : 'Erreur de chargement des données';
  };

  const getSuggestion = () => {
    if (!error) return 'Réessayez dans quelques instants';
    
    const errorMessage = error.message || error.toString();
    
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return 'Vérifiez votre connexion internet';
    }
    
    if (errorMessage.includes('timeout')) {
      return 'Le serveur met du temps à répondre';
    }
    
    if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
      return 'Vérifiez vos autorisations Garmin';
    }
    
    return 'Réessayez ou contactez le support';
  };

  return (
    <div className={`garmin-fallback loading-error ${compactMode ? 'compact' : ''} ${className}`}>
      <div className="fallback-content">
        <div className="fallback-icon error">
          {compactMode ? '⚠️' : '⚠️📡'}
        </div>
        
        <div className="fallback-message">
          <h4 className="fallback-title">
            {getErrorMessage()}
          </h4>
          
          {!compactMode && (
            <p className="fallback-description">
              {getSuggestion()}
            </p>
          )}
          
          {retryCount > 0 && (
            <div className="retry-info">
              Tentative {retryCount}/{maxRetries}
            </div>
          )}
        </div>
        
        <div className="fallback-actions">
          {canRetry ? (
            <button
              onClick={handleRetryClick}
              className="retry-button primary"
              title={`Réessayer (${retryCount + 1}/${maxRetries})`}
            >
              {compactMode ? '🔄' : '🔄 Réessayer'}
            </button>
          ) : (
            <div className="max-retries-message">
              {compactMode ? 'Max tentatives' : 'Nombre maximum de tentatives atteint'}
            </div>
          )}
          
          {!compactMode && (
            <div className="fallback-hint">
              {getSuggestion()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

LoadingErrorFallback.displayName = 'LoadingErrorFallback';

/**
 * Fallback pour mode dégradé (performances)
 */
export const DegradedModeFallback = memo(({ 
  reason = 'performance',
  onEnableFullMode,
  compactMode = false,
  className = ''
}) => {
  const handleEnableFullMode = useCallback(() => {
    if (onEnableFullMode) {
      onEnableFullMode();
    }
  }, [onEnableFullMode]);

  const getReasonMessage = () => {
    switch (reason) {
      case 'performance':
        return compactMode ? 'Mode simplifié' : 'Mode simplifié activé pour les performances';
      case 'data_size':
        return compactMode ? 'Trop de données' : 'Trop de données à afficher';
      case 'memory':
        return compactMode ? 'Mémoire limitée' : 'Mémoire insuffisante pour le mode complet';
      default:
        return compactMode ? 'Mode dégradé' : 'Mode dégradé activé';
    }
  };

  return (
    <div className={`garmin-fallback degraded-mode ${compactMode ? 'compact' : ''} ${className}`}>
      <div className="fallback-content">
        <div className="fallback-icon warning">
          {compactMode ? '⚡' : '⚡📊'}
        </div>
        
        <div className="fallback-message">
          <h4 className="fallback-title">
            {getReasonMessage()}
          </h4>
          
          {!compactMode && (
            <p className="fallback-description">
              Le graphique est affiché en mode simplifié pour maintenir les performances.
            </p>
          )}
        </div>
        
        <div className="fallback-actions">
          {onEnableFullMode && (
            <button
              onClick={handleEnableFullMode}
              className="enable-full-button secondary"
              title="Activer le mode complet (peut être plus lent)"
            >
              {compactMode ? '🔧 Complet' : '🔧 Mode complet'}
            </button>
          )}
          
          <div className="fallback-hint">
            {compactMode ? 'Fonctionnalités réduites' : 'Certaines fonctionnalités sont désactivées'}
          </div>
        </div>
      </div>
    </div>
  );
});

DegradedModeFallback.displayName = 'DegradedModeFallback';

/**
 * Fallback pour données insuffisantes
 */
export const InsufficientDataFallback = memo(({ 
  dataPointsCount = 0,
  minimumRequired = 10,
  onShowStaticView,
  compactMode = false,
  className = ''
}) => {
  const handleShowStaticView = useCallback(() => {
    if (onShowStaticView) {
      onShowStaticView();
    }
  }, [onShowStaticView]);

  return (
    <div className={`garmin-fallback insufficient-data ${compactMode ? 'compact' : ''} ${className}`}>
      <div className="fallback-content">
        <div className="fallback-icon info">
          {compactMode ? '📈' : '📈📊'}
        </div>
        
        <div className="fallback-message">
          <h4 className="fallback-title">
            {compactMode ? 'Données limitées' : 'Données insuffisantes pour le graphique'}
          </h4>
          
          {!compactMode && (
            <p className="fallback-description">
              {dataPointsCount} point{dataPointsCount > 1 ? 's' : ''} disponible{dataPointsCount > 1 ? 's' : ''} 
              (minimum {minimumRequired} requis pour une courbe)
            </p>
          )}
        </div>
        
        <div className="fallback-actions">
          {onShowStaticView && (
            <button
              onClick={handleShowStaticView}
              className="static-view-button secondary"
              title="Afficher les zones de fréquence cardiaque"
            >
              {compactMode ? '📊 Zones' : '📊 Voir les zones FC'}
            </button>
          )}
          
          <div className="fallback-hint">
            {compactMode ? 'Portez votre montre plus' : 'Portez votre montre plus longtemps pour plus de données'}
          </div>
        </div>
      </div>
    </div>
  );
});

InsufficientDataFallback.displayName = 'InsufficientDataFallback';

/**
 * Indicateur de chargement avec timeout
 */
export const LoadingWithTimeout = memo(({ 
  timeout = 10000,
  onTimeout,
  compactMode = false,
  className = ''
}) => {
  const [isTimedOut, setIsTimedOut] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsTimedOut(true);
      if (onTimeout) {
        onTimeout();
      }
    }, timeout);

    return () => clearTimeout(timer);
  }, [timeout, onTimeout]);

  if (isTimedOut) {
    return (
      <LoadingErrorFallback
        error={{ message: 'timeout' }}
        compactMode={compactMode}
        className={className}
      />
    );
  }

  return (
    <div className={`garmin-fallback loading ${compactMode ? 'compact' : ''} ${className}`}>
      <div className="fallback-content">
        <div className="fallback-icon loading">
          <div className="loading-spinner">⏳</div>
        </div>
        
        <div className="fallback-message">
          <h4 className="fallback-title">
            {compactMode ? 'Chargement...' : 'Chargement des données FC...'}
          </h4>
          
          {!compactMode && (
            <p className="fallback-description">
              Récupération des données de fréquence cardiaque
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

LoadingWithTimeout.displayName = 'LoadingWithTimeout';