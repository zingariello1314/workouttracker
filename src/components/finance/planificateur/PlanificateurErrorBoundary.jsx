/**
 * Error Boundary pour le module Planificateur
 * Empêche le crash complet de l'application en cas d'erreur
 */

import React from 'react';
import logger from '../../../utils/logger';

const log = logger.module('PlanificateurErrorBoundary');

class PlanificateurErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Mettre à jour l'état pour afficher l'UI de fallback
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Logger l'erreur
    log.error('Error caught by boundary:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });
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
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-slate-800/50 border-2 border-red-500/50 rounded-2xl p-8 shadow-2xl">
            {/* Icône d'erreur */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
                <span className="text-5xl">⚠️</span>
              </div>
            </div>

            {/* Titre */}
            <h2 className="text-3xl font-bold text-white text-center mb-4">
              Oups ! Une erreur est survenue
            </h2>

            {/* Message */}
            <p className="text-slate-300 text-center mb-6">
              Le module Planificateur a rencontré un problème. Ne vous inquiétez pas, 
              vos données sont sauvegardées et le reste de l'application fonctionne normalement.
            </p>

            {/* Détails de l'erreur (mode développement) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-semibold text-red-400 mb-2">
                  Détails de l'erreur (dev only):
                </h3>
                <pre className="text-xs text-slate-400 overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <span>🔄</span>
                <span>Réessayer</span>
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <span>↻</span>
                <span>Recharger la page</span>
              </button>
            </div>

            {/* Conseils */}
            <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-400 mb-2">
                💡 Que faire ?
              </h4>
              <ul className="text-sm text-slate-300 space-y-1">
                <li>• Cliquez sur "Réessayer" pour relancer le module</li>
                <li>• Si le problème persiste, rechargez la page</li>
                <li>• Vos données sont automatiquement sauvegardées</li>
                <li>• Le reste de l'application continue de fonctionner</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default PlanificateurErrorBoundary;
