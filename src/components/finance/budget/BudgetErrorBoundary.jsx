import React from 'react';

class BudgetErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Budget Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[400px] p-6">
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">⚠️</span>
              <h3 className="text-xl font-bold text-red-400">Erreur dans le module Budget</h3>
            </div>
            <p className="text-slate-300 mb-4">
              Une erreur s'est produite lors du chargement du module Budget Personnel.
            </p>
            {this.state.error && (
              <details className="mb-4">
                <summary className="text-sm text-slate-400 cursor-pointer mb-2">
                  Détails techniques
                </summary>
                <pre className="text-xs text-slate-500 bg-slate-900/50 p-3 rounded overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null, errorInfo: null });
                window.location.reload();
              }}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default BudgetErrorBoundary;

