import React, { useEffect } from 'react';
import TelemetryCoordinator from '../utils/TelemetryCoordinator';
// ✅ Item 16 : Utiliser isBrowser() pour vérifications centralisées
import { isBrowser } from '../../../../utils/isBrowser';
import { useTranslation } from '../../../../utils/translations';

/**
 * Composant Toast accessible pour feedback visuel
 * Supporte aria-live, instrumentation, et fermeture automatique
 */
export function Toast({ message, type = 'success', duration = 3000, onClose, id }) {
  const t = useTranslation();
  
  useEffect(() => {
    // Instrumentation : enregistrer l'affichage du toast
    // ✅ Item 16 : Utiliser isBrowser() pour vérifications centralisées
    if (id && isBrowser()) {
      TelemetryCoordinator.recordEvent('toast_shown', {
        type,
        messageLength: typeof message === 'string' ? message.length : 0,
        duration,
        timestamp: new Date().toISOString()
      });
    }

    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
        // Instrumentation : enregistrer la fermeture automatique
        // ✅ Item 16 : Utiliser isBrowser() pour vérifications centralisées
        if (id && isBrowser()) {
          TelemetryCoordinator.recordEvent('toast_closed', {
            type,
            reason: 'auto',
            timestamp: new Date().toISOString()
          });
        }
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose, type, message, id]);

  const bgColor = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600';
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  const role = type === 'error' ? 'alert' : 'status';
  const ariaLive = type === 'error' ? 'assertive' : 'polite';

  return (
    <div
      className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-4 rounded-lg shadow-lg z-50 min-w-[300px] max-w-[500px]`}
      style={{ animation: 'slideInRight 0.3s ease-out' }}
      role={role}
      aria-live={ariaLive}
      aria-atomic="true"
    >
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0">{icon}</span>
        <div className="flex-1">
          {typeof message === 'string' ? (
            <p className="font-medium">{message}</p>
          ) : (
            <div>{message}</div>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            // Instrumentation : enregistrer la fermeture manuelle
            // ✅ Item 16 : Utiliser isBrowser() pour vérifications centralisées
            if (id && isBrowser()) {
              TelemetryCoordinator.recordEvent('toast_closed', {
                type,
                reason: 'manual',
                timestamp: new Date().toISOString()
              });
            }
            onClose?.();
          }}
          className="text-white/80 hover:text-white flex-shrink-0 ml-2 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 rounded"
          aria-label={t('garmin.toast.close')}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/**
 * Hook pour gérer les toasts
 */
export function useToast() {
  const [toasts, setToasts] = React.useState([]);

  const showToast = React.useCallback((message, type = 'success', duration = 3000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts(prev => [...prev, { id, message, type, duration }]);
    return id;
  }, []);

  const removeToast = React.useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );

  return { showToast, removeToast, ToastContainer };
}

