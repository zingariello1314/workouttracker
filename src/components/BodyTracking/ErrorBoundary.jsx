/**
 * 🔴 ERROR BOUNDARY PROFESSIONNEL - BODY TRACKING
 * 
 * Capture et gère les erreurs JavaScript dans les composants BodyTracking,
 * empêchant une erreur isolée de faire crasher toute l'application.
 */
import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import logger from '../../utils/logger';

const log = logger.component('BodyTrackingErrorBoundary');

class BodyTrackingErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      lastErrorTime: null
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
    log.error('Erreur capturée dans composant BodyTracking:', {
      error: error.toString(),
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorInfo: errorInfo
    });
    
    // Mettre à jour l'état avec les détails
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
      lastErrorTime: Date.now()
    }));

    // Optionnel : envoyer l'erreur à un service de tracking d'erreurs
    // if (window.trackError) {
    //   window.trackError(error, {
    //     componentStack: errorInfo.componentStack,
    //     context: 'BodyTracking',
    //     userId: this.props.userId
    //   });
    // }
  }

  handleReset = () => {
    // Réinitialiser l'état pour permettre un nouveau rendu
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
      // Ne pas réinitialiser errorCount et lastErrorTime pour tracking
    });
    
    log.info('Error Boundary réinitialisé par utilisateur');
  };

  handleGoHome = () => {
    // Rediriger vers la page d'accueil ou une section sécurisée
    if (window.location.hash) {
      window.location.hash = '#/home';
    } else {
      window.location.href = '/';
    }
  };

  getErrorType = () => {
    if (!this.state.error) return 'unknown';
    
    const errorString = this.state.error.toString().toLowerCase();
    
    if (errorString.includes('null') || errorString.includes('undefined')) {
      return 'null_reference';
    }
    if (errorString.includes('cannot read')) {
      return 'property_access';
    }
    if (errorString.includes('indexeddb') || errorString.includes('database')) {
      return 'storage';
    }
    if (errorString.includes('network') || errorString.includes('fetch')) {
      return 'network';
    }
    if (errorString.includes('parsing') || errorString.includes('json')) {
      return 'data_parsing';
    }
    
    return 'unknown';
  };

  getErrorSuggestion = (errorType) => {
    const suggestions = {
      null_reference: 'Certaines données semblent manquantes. Essayez de rafraîchir la page ou de resynchroniser vos données.',
      property_access: 'Un problème de données s\'est produit. Vérifiez que toutes vos mesures sont valides.',
      storage: 'Un problème de stockage local s\'est produit. Vérifiez que votre navigateur permet le stockage local.',
      network: 'Un problème de connexion s\'est produit. Vérifiez votre connexion internet.',
      data_parsing: 'Un problème de format de données s\'est produit. Les données peuvent être corrompues.',
      unknown: 'Une erreur inattendue s\'est produite. Si le problème persiste, contactez le support.'
    };
    
    return suggestions[errorType] || suggestions.unknown;
  };

  render() {
    if (this.state.hasError) {
      const errorType = this.getErrorType();
      const suggestion = this.getErrorSuggestion(errorType);
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      // Si trop d'erreurs en peu de temps, bloquer le rendu pour éviter loop infini
      const { errorCount, lastErrorTime } = this.state;
      const recentErrors = errorCount > 3 && lastErrorTime && (Date.now() - lastErrorTime) < 60000;
      
      if (recentErrors) {
        return (
          <Card className="bg-red-900/20 border-red-700">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-red-300 mb-2">
                Trop d'erreurs détectées
              </h3>
              <p className="text-slate-300 mb-4">
                Plusieurs erreurs se sont produites récemment. Veuillez rafraîchir la page complètement.
              </p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Rafraîchir la page
              </Button>
            </CardContent>
          </Card>
        );
      }

      // UI de fallback normale
      return (
        <Card className="bg-red-900/20 border-red-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-300">
              <AlertTriangle className="w-6 h-6" />
              Erreur dans le suivi corporel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-300">
              Une erreur s'est produite dans cette section. L'erreur a été enregistrée et l'application continue de fonctionner.
            </p>
            
            <div className="bg-slate-800/50 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-2">
                <strong className="text-slate-300">Suggestion :</strong>
              </p>
              <p className="text-sm text-slate-300">
                {suggestion}
              </p>
            </div>

            {/* Détails de l'erreur en développement uniquement */}
            {isDevelopment && this.state.error && (
              <details className="bg-slate-900/50 rounded-lg p-4 text-xs">
                <summary className="cursor-pointer text-red-400 mb-2 font-medium">
                  Détails techniques (développement uniquement)
                </summary>
                <div className="mt-2 space-y-2 text-slate-400">
                  <div>
                    <strong className="text-red-300">Type d'erreur:</strong>
                    <span className="ml-2 text-slate-300">{errorType}</span>
                  </div>
                  <div>
                    <strong className="text-red-300">Message:</strong>
                    <pre className="mt-1 text-xs whitespace-pre-wrap break-words">
                      {this.state.error.toString()}
                    </pre>
                  </div>
                  {this.state.error.stack && (
                    <div>
                      <strong className="text-red-300">Stack trace:</strong>
                      <pre className="mt-1 text-xs whitespace-pre-wrap break-words max-h-40 overflow-auto">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                  {this.state.errorInfo && this.state.errorInfo.componentStack && (
                    <div>
                      <strong className="text-red-300">Component stack:</strong>
                      <pre className="mt-1 text-xs whitespace-pre-wrap break-words max-h-40 overflow-auto">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                  <div>
                    <strong className="text-red-300">Nombre d'erreurs:</strong>
                    <span className="ml-2 text-slate-300">{errorCount}</span>
                  </div>
                </div>
              </details>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={this.handleReset}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                aria-label="Réessayer de charger cette section"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Réessayer
              </Button>
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                aria-label="Retourner à l'accueil"
              >
                <Home className="w-4 h-4 mr-2" />
                Accueil
              </Button>
            </div>

            <p className="text-slate-500 text-xs text-center pt-2">
              Si le problème persiste, essayez de rafraîchir la page ou de synchroniser à nouveau vos données.
            </p>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default BodyTrackingErrorBoundary;

