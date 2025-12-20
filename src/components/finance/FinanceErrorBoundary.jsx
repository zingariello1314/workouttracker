/**
 * FinanceErrorBoundary.jsx
 * 
 * ErrorBoundary React pour capturer et gérer les erreurs dans les composants Finance.
 * 
 * ✅ PHASE 4 - Étape 4.7 : ErrorBoundary pour gestion erreurs React
 * 
 * @module components/finance/FinanceErrorBoundary
 * @see docs/finance/ANALYSE_PROFONDE_SOUS_ONGLET_BOURSE.md - Phase 4, Étape 27
 */

import React from 'react';
import { FinanceError, FinanceErrorCodes, wrapError } from '../../utils/financeErrors';
import logger from '../../utils/logger';

const log = logger.module('FinanceErrorBoundary');

/**
 * ErrorBoundary pour composants Finance
 * 
 * Capture les erreurs JavaScript dans l'arbre de composants enfants,
 * les log, et affiche une UI de fallback.
 * 
 * @example
 * <FinanceErrorBoundary>
 *   <FinanceTab />
 * </FinanceErrorBoundary>
 */
class FinanceErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorBoundaryError: null // Erreur dans le boundary lui-même
    };
  }

  /**
   * Méthode lifecycle React appelée quand une erreur est levée
   * 
   * @param {Error} error - Erreur levée
   * @param {Object} errorInfo - Informations sur l'erreur (componentStack)
   * @returns {Object} Nouvel état
   */
  static getDerivedStateFromError(error) {
    // Mettre à jour l'état pour que le prochain rendu affiche l'UI de fallback
    return {
      hasError: true,
      error
    };
  }

  /**
   * Méthode lifecycle React appelée après qu'une erreur a été levée
   * 
   * @param {Error} error - Erreur levée
   * @param {Object} errorInfo - Informations sur l'erreur (componentStack)
   */
  componentDidCatch(error, errorInfo) {
    // Logger l'erreur
    const wrappedError = wrapError(error, 'FinanceErrorBoundary');
    
    log.error('Erreur capturée par FinanceErrorBoundary:', {
      error: wrappedError.toJSON(),
      componentStack: errorInfo.componentStack,
      errorInfo
    });

    // Stocker l'erreur et les infos pour affichage
    this.setState({
      error: wrappedError,
      errorInfo
    });

    // Optionnel : envoyer l'erreur à un service de reporting
    // reportErrorToService(wrappedError, errorInfo);
  }

  /**
   * Réinitialiser l'erreur (permet de réessayer)
   */
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  /**
   * Rendu de l'UI de fallback en cas d'erreur
   */
  render() {
    if (this.state.hasError) {
      const { error } = this.state;
      const isFinanceError = error instanceof FinanceError;
      const isRecoverable = isFinanceError && error.isRecoverable();
      const isCritical = isFinanceError && error.isCritical();

      return (
        <div className="finance-error-boundary min-h-screen flex items-center justify-center bg-slate-900 p-4">
          <div className="max-w-2xl w-full bg-slate-800 border border-red-500/50 rounded-lg p-6 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isCritical ? 'bg-red-500/20' : 'bg-orange-500/20'
                }`}>
                  <span className="text-2xl">
                    {isCritical ? '🚨' : '⚠️'}
                  </span>
                </div>
              </div>
              
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-white mb-2">
                  {isCritical ? 'Erreur Critique' : 'Erreur dans le Module Finance'}
                </h2>
                
                <p className="text-slate-300 mb-4">
                  {isFinanceError 
                    ? error.getUserMessage()
                    : error?.message || 'Une erreur inattendue s\'est produite.'}
                </p>

                {isFinanceError && (
                  <div className="mb-4 p-3 bg-slate-700/50 rounded border border-slate-600/50">
                    <div className="text-sm text-slate-400 mb-1">
                      Code d'erreur: <code className="text-orange-400">{error.code}</code>
                    </div>
                    {error.details && Object.keys(error.details).length > 0 && (
                      <div className="text-xs text-slate-500 mt-2">
                        Détails: {JSON.stringify(error.details, null, 2)}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3">
                  {isRecoverable && (
                    <button
                      onClick={this.handleReset}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Réessayer
                    </button>
                  )}
                  
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    Recharger la page
                  </button>
                </div>

                {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                  <details className="mt-4">
                    <summary className="text-sm text-slate-400 cursor-pointer hover:text-slate-300">
                      Détails techniques (développement)
                    </summary>
                    <pre className="mt-2 p-3 bg-slate-900 rounded text-xs text-slate-400 overflow-auto max-h-64">
                      {this.state.error?.stack || error?.stack}
                      {'\n\n'}
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Pas d'erreur, rendre les enfants normalement
    return this.props.children;
  }
}

export default FinanceErrorBoundary;
