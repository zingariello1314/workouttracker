/**
 * 🔔 HOOK DE NOTIFICATION - BODY TRACKING
 * 
 * Système de notifications toast pour feedback utilisateur
 * dans les composants BodyTracking.
 */
import React, { useState, useCallback, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ id, message, type, onClose, detailedFeedback = null }) => {
  const [showDetails, setShowDetails] = React.useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, type === 'error' ? 7000 : (detailedFeedback ? 8000 : 3000)); // Erreurs détaillées restent plus longtemps

    return () => clearTimeout(timer);
  }, [id, onClose, type, detailedFeedback]);

  const typeStyles = {
    success: {
      bg: 'bg-green-600/90',
      border: 'border-green-500',
      icon: <CheckCircle className="w-5 h-5 text-green-100" />
    },
    error: {
      bg: 'bg-red-600/90',
      border: 'border-red-500',
      icon: <XCircle className="w-5 h-5 text-red-100" />
    },
    warning: {
      bg: 'bg-yellow-600/90',
      border: 'border-yellow-500',
      icon: <AlertCircle className="w-5 h-5 text-yellow-100" />
    },
    info: {
      bg: 'bg-[#0F4C5C]/90',
      border: 'border-[#0F5C45]/55',
      icon: <Info className="w-5 h-5 text-sky-100/90" />
    }
  };

  const style = typeStyles[type] || typeStyles.info;

  return (
    <div
      className={`${style.bg} ${style.border} border rounded-lg shadow-lg p-4 min-w-[300px] max-w-[600px] text-teal-100 backdrop-blur-sm animate-slide-in-right`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">{style.icon}</div>
        <div className="flex-1">
          {/* ✅ OPTIMISATION: Message avec titre si feedback détaillé */}
          {detailedFeedback ? (
            <>
              <p className="font-semibold text-sm mb-1">{detailedFeedback.title}</p>
              <p className="font-medium text-xs opacity-90 mb-2">{detailedFeedback.message}</p>
              {detailedFeedback.suggestions && detailedFeedback.suggestions.length > 0 && (
                <>
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-xs text-teal-100/80 hover:text-teal-100 underline mb-2"
                  >
                    {showDetails ? 'Masquer' : 'Voir'} les suggestions ({detailedFeedback.suggestions.length})
                  </button>
                  {showDetails && (
                    <ul className="text-xs space-y-1 mt-2 list-disc list-inside opacity-90">
                      {detailedFeedback.suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </>
          ) : (
            <p className="font-medium text-sm">{message}</p>
          )}
        </div>
        <button
          onClick={() => onClose(id)}
          className="flex-shrink-0 text-teal-100/80 hover:text-teal-100 transition-colors"
          aria-label="Fermer la notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/**
 * Hook pour gérer les toasts
 */
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success', detailedFeedback = null) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, detailedFeedback }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showSuccess = useCallback((message) => showToast(message, 'success'), [showToast]);
  const showError = useCallback((message, detailedFeedback = null) => showToast(message, 'error', detailedFeedback), [showToast]);
  const showWarning = useCallback((message, detailedFeedback = null) => showToast(message, 'warning', detailedFeedback), [showToast]);
  const showInfo = useCallback((message) => showToast(message, 'info'), [showToast]);

  const ToastContainer = () => (
    <div 
      className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            id={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={removeToast}
            detailedFeedback={toast.detailedFeedback}
          />
        </div>
      ))}
    </div>
  );

  return { 
    showToast, 
    showSuccess, 
    showError, 
    showWarning, 
    showInfo,
    removeToast, 
    ToastContainer 
  };
};

