/**
 * 🍞 TOAST COMPONENT
 * 
 * Composant individuel de notification toast.
 * Design moderne, accessible, avec animations fluides.
 * 
 * @module Toast
 */

import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

/**
 * Types de toast disponibles
 */
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

/**
 * Durées d'affichage par type (en millisecondes)
 */
const TOAST_DURATIONS = {
  [TOAST_TYPES.SUCCESS]: 3000,
  [TOAST_TYPES.ERROR]: 5000,
  [TOAST_TYPES.WARNING]: 4000,
  [TOAST_TYPES.INFO]: 3000
};

/**
 * Composant Toast individuel
 * 
 * @param {Object} props
 * @param {string} props.id - Identifiant unique du toast
 * @param {string} props.message - Message à afficher
 * @param {string} props.type - Type de toast (success, error, warning, info)
 * @param {Function} props.onClose - Callback appelé pour fermer le toast
 * @param {Object|null} props.details - Détails optionnels (titre, suggestions, etc.)
 */
const Toast = ({ id, message, type = TOAST_TYPES.INFO, onClose, details = null }) => {
  // Auto-dismiss après la durée définie
  useEffect(() => {
    const duration = details ? TOAST_DURATIONS[type] + 2000 : TOAST_DURATIONS[type];
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, onClose, type, details]);

  // Styles par type
  const typeStyles = {
    [TOAST_TYPES.SUCCESS]: {
      bg: 'bg-green-600/95',
      border: 'border-green-500/50',
      icon: <CheckCircle className="w-5 h-5 text-green-100" />,
      iconBg: 'bg-green-500/20'
    },
    [TOAST_TYPES.ERROR]: {
      bg: 'bg-red-600/95',
      border: 'border-red-500/50',
      icon: <XCircle className="w-5 h-5 text-red-100" />,
      iconBg: 'bg-red-500/20'
    },
    [TOAST_TYPES.WARNING]: {
      bg: 'bg-yellow-600/95',
      border: 'border-yellow-500/50',
      icon: <AlertCircle className="w-5 h-5 text-yellow-100" />,
      iconBg: 'bg-yellow-500/20'
    },
    [TOAST_TYPES.INFO]: {
      bg: 'bg-blue-600/95',
      border: 'border-blue-500/50',
      icon: <Info className="w-5 h-5 text-blue-100" />,
      iconBg: 'bg-blue-500/20'
    }
  };

  const style = typeStyles[type] || typeStyles[TOAST_TYPES.INFO];
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <div
      className={`
        ${style.bg} ${style.border} 
        border rounded-lg shadow-xl p-4 
        min-w-[300px] max-w-[500px] 
        text-white backdrop-blur-sm
        animate-slide-in-right
        transition-all duration-300
        hover:shadow-2xl
      `}
      role="alert"
      aria-live={type === TOAST_TYPES.ERROR ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      <div className="flex items-start gap-3">
        {/* Icône */}
        <div className={`flex-shrink-0 ${style.iconBg} rounded-full p-1.5`}>
          {style.icon}
        </div>
        
        {/* Contenu */}
        <div className="flex-1 min-w-0">
          {details ? (
            <>
              {details.title && (
                <p className="font-semibold text-sm mb-1 break-words">
                  {details.title}
                </p>
              )}
              <p className="font-medium text-xs opacity-90 mb-2 break-words">
                {details.message || message}
              </p>
              {details.suggestions && details.suggestions.length > 0 && (
                <>
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-xs text-white/80 hover:text-white underline mb-2 transition-colors"
                    aria-expanded={showDetails}
                    aria-label={showDetails ? 'Masquer les suggestions' : 'Voir les suggestions'}
                  >
                    {showDetails ? 'Masquer' : 'Voir'} les suggestions ({details.suggestions.length})
                  </button>
                  {showDetails && (
                    <ul className="text-xs space-y-1 mt-2 list-disc list-inside opacity-90">
                      {details.suggestions.map((suggestion, index) => (
                        <li key={index} className="break-words">{suggestion}</li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </>
          ) : (
            <p className="font-medium text-sm break-words">{message}</p>
          )}
        </div>
        
        {/* Bouton fermer */}
        <button
          onClick={() => onClose(id)}
          className="flex-shrink-0 text-white/70 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
          aria-label="Fermer la notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;


