/**
 * StatisticsErrorBoundary Component
 * 
 * Error Boundary spécialisé pour les composants de statistiques de lecture.
 * Capture les erreurs et affiche des fallbacks appropriés selon le contexte.
 * 
 * Features:
 * - Capture d'erreurs avec contexte détaillé
 * - Fallbacks adaptatifs selon le type d'erreur
 * - Logging des erreurs pour le debugging
 * - Interface de récupération utilisateur-friendly
 * 
 * @see Requirements 1.5
 */

import React from 'react';
import { AlertTriangle, RefreshCw, BarChart3, Database } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';

class StatisticsErrorBoundary extends React.Component {
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
    // Logger l'erreur avec contexte
    this.logError(error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });
  }

  logError = (error, errorInfo) => {
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      props: this.props.context || {},
      retryCount: this.state.retryCount
    };

    // Logger en console en développement
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Statistics Error Boundary');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Context:', errorDetails);
      console.groupEnd();
    }

    // Envoyer à un service de monitoring en production (si configuré)
    if (process.env.NODE_ENV === 'production' && window.errorReporting) {
      try {
        window.errorReporting.captureException(error, {
          tags: { component: 'StatisticsErrorBoundary' },
          extra: errorDetails
        });
      } catch (reportingError) {
        console.warn('Failed to report error:', reportingError);
      }
    }
  };

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: prevState.retryCount + 1
    }));

    // Callback optionnel pour actions de récupération
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0
    });

    // Callback optionnel pour reset complet
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  getErrorType = () => {
    if (!this.state.error) return 'unknown';
    
    const message = this.state.error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'network';
    }
    if (message.includes('data') || message.includes('undefined') || message.includes('null')) {
      return 'data';
    }
    if (message.includes('memory') || message.includes('quota')) {
      return 'memory';
    }
    if (message.includes('permission') || message.includes('access')) {
      return 'permission';
    }
    
    return 'generic';
  };

  renderErrorFallback = () => {
    const errorType = this.getErrorType();
    const { fallbackType = 'full', className = '' } = this.props;
    
    // Fallback minimal pour les composants critiques
    if (fallbackType === 'minimal') {
      return (
        <div className={`text-center py-4 ${className}`}>
          <AlertTriangle className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
          <p className="text-sm text-slate-400">
            Erreur de chargement des statistiques
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={this.handleRetry}
            className="mt-2"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Réessayer
          </Button>
        </div>
      );
    }

    // Messages d'erreur selon le type
    const errorMessages = {
      network: {
        title: 'Problème de connexion',
        description: 'Impossible de charger les données. Vérifiez votre connexion internet.',
        icon: Database,
        color: 'text-blue-500'
      },
      data: {
        title: 'Données corrompues',
        description: 'Les données de lecture semblent corrompues. Essayez de recharger.',
        icon: AlertTriangle,
        color: 'text-yellow-500'
      },
      memory: {
        title: 'Mémoire insuffisante',
        description: 'Pas assez de mémoire pour afficher toutes les statistiques.',
        icon: AlertTriangle,
        color: 'text-red-500'
      },
      permission: {
        title: 'Accès refusé',
        description: 'Permissions insuffisantes pour accéder aux données.',
        icon: AlertTriangle,
        color: 'text-red-500'
      },
      generic: {
        title: 'Erreur inattendue',
        description: 'Une erreur inattendue s\'est produite lors du calcul des statistiques.',
        icon: AlertTriangle,
        color: 'text-red-500'
      }
    };

    const errorConfig = errorMessages[errorType];
    const IconComponent = errorConfig.icon;

    return (
      <Card variant="glass" className={className}>
        <CardContent className="text-center py-8">
          <IconComponent className={`w-12 h-12 mx-auto mb-4 ${errorConfig.color}`} />
          
          <CardTitle size="md" className="mb-2 text-white">
            {errorConfig.title}
          </CardTitle>
          
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            {errorConfig.description}
          </p>

          {/* Actions de récupération */}
          <div className="flex gap-3 justify-center">
            <Button
              variant="primary"
              onClick={this.handleRetry}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Réessayer
            </Button>
            
            {this.state.retryCount > 0 && (
              <Button
                variant="glass"
                onClick={this.handleReset}
                className="flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                Réinitialiser
              </Button>
            )}
          </div>

          {/* Détails techniques en développement */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-6 text-left">
              <summary className="cursor-pointer text-sm text-slate-500 hover:text-slate-300">
                Détails techniques (dev)
              </summary>
              <div className="mt-2 p-3 bg-slate-900/50 rounded text-xs font-mono text-slate-400 overflow-auto max-h-32">
                <div className="mb-2">
                  <strong>Error:</strong> {this.state.error.message}
                </div>
                <div className="mb-2">
                  <strong>ID:</strong> {this.state.errorId}
                </div>
                <div>
                  <strong>Retry Count:</strong> {this.state.retryCount}
                </div>
              </div>
            </details>
          )}
        </CardContent>
      </Card>
    );
  };

  render() {
    if (this.state.hasError) {
      return this.renderErrorFallback();
    }

    return this.props.children;
  }
}

export default StatisticsErrorBoundary;

// HOC pour wrapper automatiquement les composants
export const withStatisticsErrorBoundary = (Component, options = {}) => {
  const WrappedComponent = (props) => (
    <StatisticsErrorBoundary {...options}>
      <Component {...props} />
    </StatisticsErrorBoundary>
  );
  
  WrappedComponent.displayName = `withStatisticsErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};