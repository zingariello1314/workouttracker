/**
 * Error Boundary for Quotes System
 * Catches and handles errors gracefully with retry logic
 */

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import logger from '../../utils/logger';

const log = logger.component('QuotesErrorBoundary');

export class QuotesErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    log.error('Quotes system error caught', { error, errorInfo });
    this.setState({
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    this.setState((prevState) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <AlertTriangle className="text-red-400" size={48} />
            <h3 className="text-xl font-semibold text-white">
              Erreur du système de citations
            </h3>
            <p className="text-gray-300 max-w-md">
              Une erreur s'est produite lors du chargement des citations. Vous pouvez réessayer ou
              continuer avec la citation par défaut.
            </p>

            {this.state.error && (
              <details className="text-left w-full max-w-md">
                <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300">
                  Détails techniques
                </summary>
                <pre className="mt-2 text-xs text-red-400 bg-slate-900/50 p-3 rounded overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleRetry}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <RefreshCw size={16} />
                Réessayer {this.state.retryCount > 0 && `(${this.state.retryCount})`}
              </button>
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Réinitialiser
              </button>
            </div>

            {this.state.retryCount >= 3 && (
              <p className="text-sm text-yellow-400">
                Si le problème persiste, essayez de vider le cache du navigateur ou contactez le
                support.
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
