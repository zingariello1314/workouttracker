/**
 * Synthese Error Boundary - Gestion erreurs robuste
 * Fallback UI professionnel avec retry
 */

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class SyntheseErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[SyntheseErrorBoundary] Error caught:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-slate-800/50 border-2 border-red-500/50 rounded-xl p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-3">
              Erreur Module Synthèse
            </h2>
            <p className="text-slate-300 mb-6">
              Une erreur est survenue lors du chargement du module Synthèse Financière.
            </p>
            
            {this.state.error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-left">
                <div className="text-xs text-red-400 font-mono mb-2">DÉTAILS TECHNIQUE</div>
                <div className="text-sm text-slate-300 font-mono break-all">
                  {this.state.error.toString()}
                </div>
              </div>
            )}

            <button
              onClick={this.handleRetry}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-semibold"
            >
              <RefreshCw className="w-5 h-5" />
              Recharger le module
            </button>

            <p className="text-xs text-slate-500 mt-4">
              Si le problème persiste, contactez le support technique
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SyntheseErrorBoundary;
