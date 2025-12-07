import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * ErrorMessage Component - Displays error messages with optional retry
 * 
 * @param {Object} props
 * @param {string} props.message - Error message to display
 * @param {Function} props.onRetry - Optional retry callback
 * @param {string} props.type - Error type: 'error', 'warning', 'info'
 */
const ErrorMessage = ({
  message,
  onRetry,
  type = 'error'
}) => {
  const typeStyles = {
    error: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-400',
      icon: 'text-red-500'
    },
    warning: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400',
      icon: 'text-yellow-500'
    },
    info: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      icon: 'text-blue-500'
    }
  };

  const styles = typeStyles[type];

  return (
    <div
      className={`flex items-start gap-3 p-4 ${styles.bg} border ${styles.border} rounded-lg`}
      role="alert"
    >
      <AlertCircle className={`flex-shrink-0 ${styles.icon}`} size={20} />
      
      <div className="flex-1">
        <p className={`text-sm ${styles.text}`}>
          {message}
        </p>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className={`flex items-center gap-2 px-3 py-1 text-sm ${styles.text} hover:bg-white/5 rounded transition-colors`}
          aria-label="Retry"
        >
          <RefreshCw size={16} />
          Réessayer
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
