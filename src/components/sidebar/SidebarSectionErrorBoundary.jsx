import React from 'react';

/**
 * Error Boundary pour les sections de la Sidebar
 * Capture les erreurs dans les composants enfants et affiche un fallback UI
 * 
 * @component
 * @example
 * <SidebarSectionErrorBoundary sectionName="Lecture">
 *   <LectureSection />
 * </SidebarSectionErrorBoundary>
 */
class SidebarSectionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Mettre à jour l'état pour afficher le fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Logger l'erreur pour le débogage
    const sectionName = this.props.sectionName || 'Unknown Section';
    console.error(`[SidebarSection:${sectionName}] Error caught:`, {
      error,
      errorInfo,
      componentStack: errorInfo.componentStack
    });

    // Sauvegarder les détails de l'erreur dans l'état
    this.setState({
      error,
      errorInfo
    });

    // Optionnel: Envoyer l'erreur à un service de monitoring
    // this.reportErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const sectionName = this.props.sectionName || 'Section';
      
      return (
        <div className="sidebar-section-error">
          <div className="sidebar-section-error-content">
            <span className="sidebar-section-error-icon">⚠️</span>
            <span className="sidebar-section-error-text">
              {sectionName} temporairement indisponible
            </span>
          </div>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="sidebar-section-error-details">
              <summary>Détails de l'erreur (dev only)</summary>
              <pre className="sidebar-section-error-stack">
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default SidebarSectionErrorBoundary;
