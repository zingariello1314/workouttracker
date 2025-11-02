/**
 * 🔔 HOOK DE NOTIFICATION - BODY TRACKING
 * 
 * Système de notifications toast pour feedback utilisateur
 * dans les composants BodyTracking.
 */
import { useState, useCallback, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ id, message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, type === 'error' ? 5000 : 3000); // Erreurs restent plus longtemps

    return () => clearTimeout(timer);
  }, [id, onClose, type]);

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
      bg: 'bg-blue-600/90',
      border: 'border-blue-500',
      icon: <Info className="w-5 h-5 text-blue-100" />
    }
  };

  const style = typeStyles[type] || typeStyles.info;

  return (
    <div
      className={`${style.bg} ${style.border} border rounded-lg shadow-lg p-4 min-w-[300px] max-w-[500px] text-white backdrop-blur-sm animate-slide-in-right`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">{style.icon}</div>
        <div className="flex-1">
          <p className="font-medium text-sm">{message}</p>
        </div>
        <button
          onClick={() => onClose(id)}
          className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
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

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showSuccess = useCallback((message) => showToast(message, 'success'), [showToast]);
  const showError = useCallback((message) => showToast(message, 'error'), [showToast]);
  const showWarning = useCallback((message) => showToast(message, 'warning'), [showToast]);
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

