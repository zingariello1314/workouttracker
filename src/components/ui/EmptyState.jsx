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
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`} role="status" aria-live="polite">
      <div className="text-6xl mb-4" aria-hidden="true">
        {icon}
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
          onClick={onAction}
          className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          aria-label={actionLabel}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;

