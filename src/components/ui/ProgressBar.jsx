/**
 * ProgressBar - Composant de Barre de Progression Réutilisable
 * 
 * Composant UI générique pour afficher une barre de progression avec différentes couleurs.
 * 
 * @module components/ui/ProgressBar
 */

import React from 'react';

/**
 * Composant ProgressBar
 * 
 * @param {Object} props
 * @param {number} props.value - Valeur actuelle (0 à max)
 * @param {number} props.max - Valeur maximale
 * @param {string} props.color - Couleur de la barre ('blue', 'green', 'orange', 'red')
 * @param {string} props.className - Classes CSS additionnelles
 */
const ProgressBar = ({ value, max, color = 'blue', className = '' }) => {
  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500'
  };

  return (
    <div className={`w-full bg-slate-700 rounded-full h-2 overflow-hidden ${className}`}>
      <div
        className={`h-full ${colorClasses[color] || colorClasses.blue} transition-all duration-300`}
        style={{ width: `${percent}%` }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`Progression: ${Math.round(percent)}%`}
      />
    </div>
  );
};

export default ProgressBar;

