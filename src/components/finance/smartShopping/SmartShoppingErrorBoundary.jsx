/**
 * SmartShoppingErrorBoundary - Error Boundary pour Smart Shopping
 * Gestion erreurs avec fallback UI élégant
 */

import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class SmartShoppingErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Smart Shopping Error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="max-w-md w-full">
            <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 border-2 border-red-500/50 rounded-2xl p-8 text-center">
              <div className="inline-block p-4 bg-red-500/20 rounded-2xl mb-6">
                <AlertTriangle className="w-12 h-12 text-red-400" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-3">
                Oups ! Une erreur est survenue
              </h2>
              
              <p className="text-slate-300 mb-6">
                Le module Smart Shopping a rencontré un problème. Vos données sont sauvegardées.
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 p-4 bg-slate-800/50 rounded-lg text-left">
                  <div className="text-xs text-red-400 font-mono break-all">
                    {this.state.error.toString()}
                  </div>
                </div>
              )}
              
              <button
                onClick={this.handleReset}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-500 hover:to-green-500 text-white rounded-xl font-medium shadow-lg hover:scale-105 transform transition-all duration-300"
              >
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  Recharger le module
                </span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SmartShoppingErrorBoundary;
