/**
 * ErrorBoundary - Composant générique réutilisable
 * 
 * Error Boundary React pour capturer et gérer les erreurs dans n'importe quel composant.
 * Peut être utilisé globalement ou pour des sections spécifiques.
 * 
 * Features:
 * - Capture d'erreurs JavaScript dans l'arbre de composants
 * - Logging détaillé des erreurs
 * - UI de fallback personnalisable
 * - Mécanisme de retry
 * - Support du contexte pour debugging
 * 
 * @example
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <MyComponent />
 * </ErrorBoundary>
 */

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from './Card';
import Button from './Button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Mettre à jour l'état pour afficher l'UI de fallback
    return {
      hasError: true,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error, errorInfo) {
    // Logger l'erreur
    this.logError(error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Optionnel : envoyer à un service de tracking
    if (this.props.onError) {
      this.props.onError(error, errorInfo, {
        errorId: this.state.errorId,
        context: this.props.context
      });
    }
  }

  logError = (error, errorInfo) => {
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      errorId: this.state.errorId,
      context: this.props.context || {},
      retryCount: this.state.retryCount
    };

    // Logger en console en développement
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorBoundary] Erreur capturée:', errorDetails);
    }

    // Logger via le système de logging si disponible
    if (window.logger) {
      window.logger.error('ErrorBoundary', errorDetails);
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: this.state.retryCount + 1
    });
  };

  handleGoHome = () => {
    if (this.props.onGoHome) {
      this.props.onGoHome();
    } else if (window.setActiveTab) {
      window.setActiveTab('home');
    } else {
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      // Si un fallback personnalisé est fourni, l'utiliser
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // UI de fallback par défaut
      return (
        <Card className="max-w-2xl mx-auto mt-8">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <CardTitle className="text-red-500">
                {this.props.title || 'Une erreur est survenue'}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-slate-300">
                {this.props.message || 
                  "Une erreur inattendue s'est produite. L'application a été protégée contre un crash complet."}
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 p-4 bg-slate-900 rounded-lg">
                  <summary className="cursor-pointer text-sm text-slate-400 mb-2">
                    Détails techniques (mode développement)
                  </summary>
                  <div className="space-y-2 text-xs font-mono">
                    <div>
                      <strong className="text-red-400">Erreur:</strong>
                      <pre className="mt-1 text-slate-300 overflow-auto">
                        {this.state.error.toString()}
                      </pre>
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <strong className="text-red-400">Stack:</strong>
                        <pre className="mt-1 text-slate-300 overflow-auto max-h-40">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <strong className="text-red-400">Component Stack:</strong>
                        <pre className="mt-1 text-slate-300 overflow-auto max-h-40">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={this.handleReset}
                  variant="primary"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Réessayer
                </Button>
                {this.props.showHomeButton !== false && (
                  <Button
                    onClick={this.handleGoHome}
                    variant="secondary"
                    className="flex items-center gap-2"
                  >
                    <Home className="w-4 h-4" />
                    Retour à l'accueil
                  </Button>
                )}
              </div>

              {this.state.retryCount > 0 && (
                <p className="text-xs text-slate-500 mt-4">
                  Tentative de récupération #{this.state.retryCount}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
