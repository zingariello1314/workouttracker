/**
 * Composant EmptyState - Affiche un état vide avec message encourageant
 * Améliore l'UX quand il n'y a pas de données
 */

import React from 'react';

const EmptyState = ({ 
  icon = '📚',
  title,
  message,
  actionLabel,
  onAction,
  className = ''
}) => {
  // Gérer l'icône : si c'est un composant React, l'invoquer
  const IconComponent = icon;
  const renderIcon = () => {
    if (!icon) return null;
    
    // Si c'est un composant React (fonction ou classe)
    if (typeof icon === 'function' || (icon && icon.$$typeof)) {
      return <IconComponent size={64} />;
    }
    
    // Si c'est déjà un élément React ou une string
    return icon;
  };

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`} role="status" aria-live="polite">
      <div className="text-6xl mb-4" aria-hidden="true">
        {renderIcon()}
      </div>
      {title && (
        <h3 className="text-xl font-bold text-slate-200 mb-2">
          {title}
        </h3>
      )}
      {message && (
        <p className="text-slate-400 max-w-md mb-6">
          {message}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="gradient-button-premium gradient-button-premium-md rounded-lg font-semibold"
          aria-label={actionLabel}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;

