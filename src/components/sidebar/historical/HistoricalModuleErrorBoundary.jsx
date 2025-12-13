/**
 * Error Boundary spécialisé pour les modules historiques de la sidebar
 * Gère les erreurs de rendu, de données et de navigation avec fallbacks gracieux
 * 
 * Requirements: 14.5 - Gestion gracieuse des erreurs
 * 
 * @component HistoricalModuleErrorBoundary
 */

import React from 'react';
import { AlertTriangle, RefreshCw, Home, Settings } from 'lucide-react';

/**
 * Types d'erreurs gérées
 */
export const ERROR_TYPES = {
  RENDER_ERROR: 'render_error',
  DATA_ERROR: 'data_error',
  NAVIGATION_ERROR: 'navigation_error',
  SYNC_ERROR: 'sync_error',
  PERFORMANCE_ERROR: 'performance_error',
  UNKNOWN_ERROR: 'unknown_error'
};

/**
 * Niveaux de sévérité des erreurs
 */
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Configuration des types d'erreurs
 */
const ERROR_CONFIG = {
  [ERROR_TYPES.RENDER_ERROR]: {
    severity: ERROR_SEVERITY.HIGH,
    retryable: true,
    maxRetries: 2,
    fallbackComponent: true,
    userMessage: 'Erreur d\'affichage du module'
  },
  [ERROR_TYPES.DATA_ERROR]: {
    severity: ERROR_SEVERITY.MEDIUM,
    retryable: true,
    maxRetries: 3,
    fallbackComponent: true,
    userMessage: 'Erreur de chargement des données'
  },
  [ERROR_TYPES.NAVIGATION_ERROR]: {
    severity: ERROR_SEVERITY.LOW,
    retryable: true,
    maxRetries: 1,
    fallbackComponent: false,
    userMessage: 'Erreur de navigation'
  },
  [ERROR_TYPES.SYNC_ERROR]: {
    severity: ERROR_SEVERITY.MEDIUM,
    retryable: true,
    maxRetries: 5,
    fallbackComponent: true,
    userMessage: 'Erreur de synchronisation'
  },
  [ERROR_TYPES.PERFORMANCE_ERROR]: {
    severity: ERROR_SEVERITY.LOW,
    retryable: false,
    maxRetries: 0,
    fallbackComponent: true,
    userMessage: 'Performance dégradée'
  },
  [ERROR_TYPES.UNKNOWN_ERROR]: {
    severity: ERROR_SEVERITY.HIGH,
    retryable: true,
    maxRetries: 1,
    fallbackComponent: true,
    userMessage: 'Erreur inattendue'
  }
};

class HistoricalModuleErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: null,
      retryCount: 0,
      isRetrying: false,
      lastErrorTime: null,
      errorHistory: []
    };
    
    // Configuration
    this.config = {
      maxErrorHistory: 10,
      retryDelay: 1000,
      maxRetryDelay: 10000,
      errorReportingEnabled: true,
      fallbackTimeout: 5000
    };
    
    // Bindings
    this.handleRetry = this.handleRetry.bind(this);
    this.handleReset = this.handleReset.bind(this);
    this.handleFallbackAction = this.handleFallbackAction.bind(this);
    
    // Auto-retry timer
    this.retryTimer = null;
    this.fallbackTimer = null;
  }

  static getDerivedStateFromError(error) {
    // Analyser le type d'erreur
    const errorType = HistoricalModuleErrorBoundary.classifyError(error);
    
    return {
      hasError: true,
      error,
      errorType,
      lastErrorTime: Date.now()
    };
  }

  componentDidCatch(error, errorInfo) {
    const errorType = this.state.errorType || ERROR_TYPES.UNKNOWN_ERROR;
    const errorConfig = ERROR_CONFIG[errorType];
    
    // Mettre à jour l'état avec les informations détaillées
    this.setState(prevState => ({
      errorInfo,
      errorHistory: [
        ...prevState.errorHistory.slice(-(this.config.maxErrorHistory - 1)),
        {
          error: error.message,
          stack: error.stack,
          errorInfo: errorInfo.componentStack,
          timestamp: Date.now(),
          type: errorType,
          moduleId: this.props.moduleId
        }
      ]
    }));
    
    // Logger l'erreur
    this.logError(error, errorInfo, errorType);
    
    // Notifier les services externes
    this.notifyErrorServices(error, errorInfo, errorType);
    
    // Déclencher un retry automatique si configuré
    if (errorConfig.retryable && this.state.retryCount < errorConfig.maxRetries) {
      this.scheduleAutoRetry(errorConfig);
    }
    
    // Déclencher le fallback si nécessaire
    if (errorConfig.fallbackComponent) {
      this.scheduleFallbackTimeout();
    }
  }

  /**
   * Classifie le type d'erreur basé sur le message et la stack
   */
  static classifyError(error) {
    const message = error.message?.toLowerCase() || '';
    const stack = error.stack?.toLowerCase() || '';
    
    // Erreurs de rendu React
    if (message.includes('render') || stack.includes('render')) {
      return ERROR_TYPES.RENDER_ERROR;
    }
    
    // Erreurs de données/API
    if (message.includes('fetch') || message.includes('network') || 
        message.includes('data') || message.includes('api')) {
      return ERROR_TYPES.DATA_ERROR;
    }
    
    // Erreurs de navigation
    if (message.includes('navigation') || message.includes('route') || 
        message.includes('scroll') || message.includes('deeplink')) {
      return ERROR_TYPES.NAVIGATION_ERROR;
    }
    
    // Erreurs de synchronisation
    if (message.includes('sync') || message.includes('websocket') || 
        message.includes('realtime')) {
      return ERROR_TYPES.SYNC_ERROR;
    }
    
    // Erreurs de performance
    if (message.includes('performance') || message.includes('memory') || 
        message.includes('timeout')) {
      return ERROR_TYPES.PERFORMANCE_ERROR;
    }
    
    return ERROR_TYPES.UNKNOWN_ERROR;
  }

  /**
   * Programme un retry automatique
   */
  scheduleAutoRetry(errorConfig) {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
    
    // Calcul du délai avec backoff exponentiel
    const delay = Math.min(
      this.config.retryDelay * Math.pow(2, this.state.retryCount),
      this.config.maxRetryDelay
    );
    
    this.retryTimer = setTimeout(() => {
      this.handleRetry();
    }, delay);
  }

  /**
   * Programme le timeout de fallback
   */
  scheduleFallbackTimeout() {
    if (this.fallbackTimer) {
      clearTimeout(this.fallbackTimer);
    }
    
    this.fallbackTimer = setTimeout(() => {
      // Forcer l'affichage du fallback si l'erreur persiste
      this.setState({ showFallback: true });
    }, this.config.fallbackTimeout);
  }

  /**
   * Gère le retry manuel ou automatique
   */
  async handleRetry() {
    const { errorType, retryCount } = this.state;
    const errorConfig = ERROR_CONFIG[errorType];
    
    if (retryCount >= errorConfig.maxRetries) {
      console.warn(`[HistoricalModuleErrorBoundary] Max retries reached for ${this.props.moduleId}`);
      return;
    }
    
    this.setState({ 
      isRetrying: true,
      retryCount: retryCount + 1
    });
    
    try {
      // Attendre un délai avant le retry
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Réinitialiser l'état d'erreur
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorType: null,
        isRetrying: false,
        showFallback: false
      });
      
      // Notifier le succès du retry
      this.notifyRetrySuccess();
      
    } catch (retryError) {
      console.error(`[HistoricalModuleErrorBoundary] Retry failed for ${this.props.moduleId}:`, retryError);
      
      this.setState({ 
        isRetrying: false,
        error: retryError,
        errorType: HistoricalModuleErrorBoundary.classifyError(retryError)
      });
      
      // Programmer le prochain retry si possible
      if (this.state.retryCount < errorConfig.maxRetries) {
        this.scheduleAutoRetry(errorConfig);
      }
    }
  }

  /**
   * Réinitialise complètement l'état d'erreur
   */
  handleReset() {
    // Nettoyer les timers
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    
    if (this.fallbackTimer) {
      clearTimeout(this.fallbackTimer);
      this.fallbackTimer = null;
    }
    
    // Réinitialiser l'état
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: null,
      retryCount: 0,
      isRetrying: false,
      lastErrorTime: null,
      showFallback: false
    });
    
    // Notifier la réinitialisation
    if (this.props.onReset) {
      this.props.onReset();
    }
  }

  /**
   * Gère les actions de fallback
   */
  handleFallbackAction(action) {
    switch (action) {
      case 'home':
        // Naviguer vers l'accueil
        if (typeof window !== 'undefined') {
          window.location.hash = '#/';
        }
        break;
        
      case 'settings':
        // Naviguer vers les paramètres
        if (typeof window !== 'undefined') {
          window.location.hash = '#/settings';
        }
        break;
        
      case 'refresh':
        // Rafraîchir la page
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
        break;
        
      default:
        console.warn(`[HistoricalModuleErrorBoundary] Unknown fallback action: ${action}`);
    }
  }

  /**
   * Log l'erreur avec contexte
   */
  logError(error, errorInfo, errorType) {
    const logData = {
      moduleId: this.props.moduleId,
      moduleName: this.props.moduleName,
      errorType,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      errorInfo: {
        componentStack: errorInfo.componentStack
      },
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown'
    };
    
    console.error(`[HistoricalModuleErrorBoundary] Error in module ${this.props.moduleId}:`, logData);
    
    // Envoyer à un service de logging externe si configuré
    if (this.config.errorReportingEnabled && this.props.onError) {
      this.props.onError(logData);
    }
  }

  /**
   * Notifie les services externes de l'erreur
   */
  notifyErrorServices(error, errorInfo, errorType) {
    // Émettre un événement personnalisé
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sidebar:module:error', {
        detail: {
          moduleId: this.props.moduleId,
          errorType,
          error: error.message,
          timestamp: Date.now()
        }
      }));
    }
    
    // Notifier le gestionnaire de performance si disponible
    if (typeof window !== 'undefined' && window.performanceOptimizationManager) {
      window.performanceOptimizationManager.handleError(this.props.moduleId, error, errorType);
    }
  }

  /**
   * Notifie le succès du retry
   */
  notifyRetrySuccess() {
    console.log(`[HistoricalModuleErrorBoundary] Retry successful for module ${this.props.moduleId}`);
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sidebar:module:retry:success', {
        detail: {
          moduleId: this.props.moduleId,
          retryCount: this.state.retryCount,
          timestamp: Date.now()
        }
      }));
    }
  }

  componentWillUnmount() {
    // Nettoyer les timers
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
    
    if (this.fallbackTimer) {
      clearTimeout(this.fallbackTimer);
    }
  }

  /**
   * Rendu du composant d'erreur
   */
  renderErrorUI() {
    const { error, errorType, retryCount, isRetrying, showFallback } = this.state;
    const { moduleId, moduleName } = this.props;
    
    const errorConfig = ERROR_CONFIG[errorType] || ERROR_CONFIG[ERROR_TYPES.UNKNOWN_ERROR];
    const canRetry = errorConfig.retryable && retryCount < errorConfig.maxRetries;
    
    // Interface d'erreur minimale pour la sidebar
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 m-2">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-red-300 truncate">
              {moduleName || moduleId}
            </h4>
            <p className="text-xs text-red-400/80 truncate">
              {errorConfig.userMessage}
            </p>
          </div>
        </div>
        
        {/* Actions de récupération */}
        <div className="flex items-center gap-1 mt-2">
          {canRetry && (
            <button
              onClick={this.handleRetry}
              disabled={isRetrying}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-red-600/50 hover:bg-red-600/70 
                         text-red-100 rounded transition-colors disabled:opacity-50"
              title="Réessayer"
            >
              <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Retry...' : 'Retry'}
            </button>
          )}
          
          <button
            onClick={this.handleReset}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-600/50 hover:bg-gray-600/70 
                       text-gray-100 rounded transition-colors"
            title="Réinitialiser"
          >
            Reset
          </button>
        </div>
        
        {/* Fallback actions si l'erreur persiste */}
        {showFallback && (
          <div className="mt-2 pt-2 border-t border-red-500/20">
            <p className="text-xs text-red-400/60 mb-1">Actions alternatives:</p>
            <div className="flex gap-1">
              <button
                onClick={() => this.handleFallbackAction('home')}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600/50 hover:bg-blue-600/70 
                           text-blue-100 rounded transition-colors"
                title="Aller à l'accueil"
              >
                <Home className="w-3 h-3" />
                Accueil
              </button>
              
              <button
                onClick={() => this.handleFallbackAction('settings')}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-600/50 hover:bg-gray-600/70 
                           text-gray-100 rounded transition-colors"
                title="Aller aux paramètres"
              >
                <Settings className="w-3 h-3" />
                Paramètres
              </button>
            </div>
          </div>
        )}
        
        {/* Informations de debug en mode développement */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-2 text-xs">
            <summary className="text-red-400/60 cursor-pointer">Debug Info</summary>
            <div className="mt-1 p-2 bg-red-950/30 rounded text-red-300/80 font-mono text-xs">
              <div>Type: {errorType}</div>
              <div>Retries: {retryCount}/{errorConfig.maxRetries}</div>
              <div>Error: {error?.message}</div>
            </div>
          </details>
        )}
      </div>
    );
  }

  render() {
    if (this.state.hasError) {
      return this.renderErrorUI();
    }

    return this.props.children;
  }
}

export default HistoricalModuleErrorBoundary;