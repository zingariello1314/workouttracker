/**
 * Error Boundary for Quotes System
 * Catches and handles errors gracefully with retry logic
 */

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import logger from '../../utils/logger';
import { settingsTheme as S } from '../tabs/SettingsTab/settingsThemeClasses';

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
        <div className={`rounded-lg border-2 border-red-800/60 bg-black p-6 shadow-lg shadow-red-950/30`}>
          <div className="flex flex-col items-center space-y-4 text-center">
            <AlertTriangle className="text-red-400" size={48} />
            <h3 className="text-xl font-semibold text-red-100">
              Erreur du système de citations
            </h3>
            <p className={`max-w-md text-sm ${S.body}`}>
              Une erreur s'est produite lors du chargement des citations. Vous pouvez réessayer ou
              continuer avec la citation par défaut.
            </p>

            {this.state.error && (
              <details className="w-full max-w-md text-left">
                <summary className={`cursor-pointer text-sm ${S.muted} hover:text-red-100`}>
                  Détails techniques
                </summary>
                <pre className="mt-2 max-h-40 overflow-auto rounded border border-red-900/50 bg-red-950/30 p-3 text-xs text-red-300">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={this.handleRetry}
                className={S.btnPrimary}
              >
                <RefreshCw size={16} />
                Réessayer {this.state.retryCount > 0 && `(${this.state.retryCount})`}
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className={S.btnSecondary}
              >
                Réinitialiser
              </button>
            </div>

            {this.state.retryCount >= 3 && (
              <p className="text-sm text-amber-300/90">
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
