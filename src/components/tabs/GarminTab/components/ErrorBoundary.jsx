/**
 * 🔴 FIX : Error Boundary pour isoler les erreurs dans les composants Garmin
 * Empêche une erreur dans un composant de faire crasher toute l'application
 */
import React from 'react';
import logger from '../../../../utils/logger';

const log = logger.component('GarminErrorBoundary');

class GarminErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Mettre à jour l'état pour afficher l'UI de fallback au prochain render
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error, errorInfo) {
    // Logger l'erreur pour debugging
    log.error('Erreur capturée dans composant Garmin:', error, errorInfo);
    
    this.setState({
      errorInfo
    });

    // Optionnel : envoyer l'erreur à un service de tracking
    // trackError(error, { componentStack: errorInfo.componentStack });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      // UI de fallback personnalisée
      return (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 text-center">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          
          <h3 className="text-lg font-semibold text-red-300 mb-2">
            Une erreur s'est produite
          </h3>
          
          <p className="text-slate-300 text-sm mb-4">
            Un problème est survenu dans l'onglet Garmin. L'erreur a été enregistrée et l'application continue de fonctionner.
          </p>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-4 text-left bg-slate-900/50 rounded p-4 text-xs text-slate-400 max-h-64 overflow-auto">
              <summary className="cursor-pointer text-red-400 mb-2 font-medium">
                Détails de l'erreur (développement uniquement)
              </summary>
              <div className="mt-2 space-y-2">
                <div>
                  <strong className="text-red-300">Erreur:</strong>
                  <pre className="mt-1 text-xs whitespace-pre-wrap">
                    {this.state.error.toString()}
                  </pre>
                </div>
                {this.state.errorInfo && (
                  <div>
                    <strong className="text-red-300">Stack:</strong>
                    <pre className="mt-1 text-xs whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}

          <div className="mt-6">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
              aria-label="Réessayer"
            >
              Réessayer
            </button>
          </div>

          <p className="text-slate-500 text-xs mt-4">
            Si le problème persiste, essayez de rafraîchir la page ou de synchroniser à nouveau vos données.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GarminErrorBoundary;

