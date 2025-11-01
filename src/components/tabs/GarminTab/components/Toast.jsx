import React, { useEffect } from 'react';

/**
 * 🟡 FIX #33: Composant Toast pour feedback visuel
 */
export function Toast({ message, type = 'success', duration = 3000, onClose }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const bgColor = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600';
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';

  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-4 rounded-lg shadow-lg z-50 min-w-[300px] max-w-[500px]`} style={{ animation: 'slideInRight 0.3s ease-out' }}>
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
          onClick={onClose}
          className="text-white/80 hover:text-white flex-shrink-0 ml-2"
          aria-label="Fermer"
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
    const id = Date.now();
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

