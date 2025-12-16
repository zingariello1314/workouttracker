import React from 'react';

/**
 * Error Boundary spécifique pour les graphiques Garmin
 * Gère les erreurs de rendu et fournit des fallbacks appropriés
 * 
 * Requirements: 1.4, 1.5
 * - Gérer les cas de données manquantes ou incomplètes (1.4)
 * - Maintenir les performances et la responsivité (1.5)
 */
class GarminChartErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Met à jour l'état pour afficher l'UI de fallback
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log l'erreur pour le debugging
    console.error('[GarminChartErrorBoundary] Erreur capturée:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
      hasError: true
    });

    // Reporter l'erreur si un service de reporting est configuré
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    
    if (this.state.retryCount < maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));

      // Callback de retry si fourni
      if (this.props.onRetry) {
        this.props.onRetry(this.state.retryCount + 1);
      }
    }
  };

  render() {
    if (this.state.hasError) {
      const { 
        fallbackComponent: FallbackComponent,
        showRetryButton = true,
        maxRetries = 3,
        compactMode = false
      } = this.props;

      // Utiliser un composant de fallback personnalisé si fourni
      if (FallbackComponent) {
        return (
          <FallbackComponent
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            onRetry={this.handleRetry}
            retryCount={this.state.retryCount}
            maxRetries={maxRetries}
          />
        );
      }

      // Fallback par défaut
      const canRetry = this.state.retryCount < maxRetries;
      
      return (
        <div className={`garmin-chart-error-fallback ${compactMode ? 'compact' : ''}`}>
          <div className="error-content">
            <div className="error-icon">
              {compactMode ? '⚠️' : '📊⚠️'}
            </div>
            
            <div className="error-message">
              <h4 className="error-title">
                {compactMode ? 'Erreur graphique' : 'Erreur d\'affichage du graphique'}
              </h4>
              
              {!compactMode && (
                <p className="error-description">
                  Une erreur s'est produite lors du rendu du graphique de fréquence cardiaque.
                </p>
              )}
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="error-details">
                  <summary>Détails techniques</summary>
                  <pre className="error-stack">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </div>
            
            {showRetryButton && (
              <div className="error-actions">
                {canRetry ? (
                  <button
                    onClick={this.handleRetry}
                    className="retry-button"
                    title={`Tentative ${this.state.retryCount + 1}/${maxRetries}`}
                  >
                    {compactMode ? '🔄' : '🔄 Réessayer'}
                  </button>
                ) : (
                  <span className="max-retries-reached">
                    {compactMode ? 'Max tentatives' : 'Nombre maximum de tentatives atteint'}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GarminChartErrorBoundary;