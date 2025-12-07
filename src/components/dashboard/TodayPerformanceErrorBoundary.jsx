import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Error Boundary for TodayPerformanceBlock
 * Catches and handles rendering errors gracefully
 */
class TodayPerformanceErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('TodayPerformanceBlock Error:', error);
    console.error('Error Info:', errorInfo);

    // Update state with error details
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Log to error tracking service (e.g., Sentry)
    if (window.errorTracker) {
      window.errorTracker.captureException(error, {
        context: 'TodayPerformanceBlock',
        componentStack: errorInfo.componentStack
      });
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReset = () => {
    // Clear all data and retry
    if (window.confirm('Voulez-vous réinitialiser toutes les données ? Cette action est irréversible.')) {
      try {
        // Clear localStorage
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key.startsWith('mission_') || key === 'targetedMuscle') {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));

        // Clear IndexedDB
        const deleteRequest = indexedDB.deleteDatabase('QuietQuestDB');
        deleteRequest.onsuccess = () => {
          window.location.reload();
        };
        deleteRequest.onerror = () => {
          window.location.reload();
        };
      } catch (err) {
        console.error('Error resetting data:', err);
        window.location.reload();
      }
    }
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, errorCount } = this.state;

      // If error persists after multiple retries, show more severe error
      const isPersistent = errorCount > 2;

      return (
        <div className="relative overflow-hidden bg-gradient-to-br from-red-500/10 to-red-600/10 border-2 border-red-500/50 rounded-2xl p-6 backdrop-blur-sm">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-400/5 to-transparent pointer-events-none"></div>

          <div className="relative">
            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-red-500/20 rounded-full border-2 border-red-500/50">
                <AlertTriangle className="w-12 h-12 text-red-400" />
              </div>
            </div>

            {/* Error Message */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white mb-2">
                {isPersistent ? 'Erreur Persistante' : 'Une erreur est survenue'}
              </h3>
              <p className="text-slate-400 mb-4">
                {isPersistent
                  ? 'Le composant Performance Aujourd\'hui rencontre des difficultés répétées.'
                  : 'Le composant Performance Aujourd\'hui a rencontré une erreur inattendue.'}
              </p>

              {/* Error Details (Development only) */}
              {process.env.NODE_ENV === 'development' && error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm text-red-400 hover:text-red-300 mb-2">
                    Détails de l'erreur (développement)
                  </summary>
                  <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
                    <p className="text-xs text-red-400 font-mono mb-2">
                      {error.toString()}
                    </p>
                    {errorInfo && (
                      <pre className="text-xs text-slate-400 overflow-auto max-h-40">
                        {errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors"
                aria-label="Réessayer de charger le composant"
              >
                <RefreshCw className="w-5 h-5" />
                Réessayer
              </button>

              {isPersistent && (
                <button
                  onClick={this.handleReset}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors"
                  aria-label="Réinitialiser toutes les données"
                >
                  <AlertTriangle className="w-5 h-5" />
                  Réinitialiser les données
                </button>
              )}
            </div>

            {/* Help Text */}
            <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <p className="text-sm text-slate-400 text-center">
                Si le problème persiste, essayez de :
              </p>
              <ul className="mt-2 text-sm text-slate-400 space-y-1">
                <li>• Rafraîchir la page (F5)</li>
                <li>• Vider le cache du navigateur</li>
                <li>• Vérifier la console pour plus de détails</li>
                {isPersistent && <li>• Réinitialiser les données (bouton ci-dessus)</li>}
              </ul>
            </div>

            {/* Error Count Badge */}
            {errorCount > 1 && (
              <div className="mt-4 text-center">
                <span className="inline-block px-3 py-1 bg-red-500/20 border border-red-500/50 rounded-full text-xs text-red-400">
                  Erreur #{errorCount}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default TodayPerformanceErrorBoundary;
