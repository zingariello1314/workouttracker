/**
 * ProgressBar - Composant de Barre de Progression Réutilisable
 *
 * @module components/ui/ProgressBar
 */

import React, { useEffect, useState } from 'react';
import {
  getXpAppearancePreference,
  subscribeXpAppearance
} from '../../utils/xpAppearancePreference';

/**
 * @param {Object} props
 * @param {number} props.value - Valeur actuelle (0 à max)
 * @param {number} props.max - Valeur maximale
 * @param {string} props.color - 'blue' | 'green' | 'orange' | 'red' | hex (#rrggbb)
 * @param {string} props.className - Classes CSS additionnelles
 */
const ProgressBar = ({ value, max, color = 'blue', className = '' }) => {
  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const [nutritionAccent, setNutritionAccent] = useState(
    () => getXpAppearancePreference().nutritionAccent
  );

  useEffect(
    () =>
      subscribeXpAppearance((pref) => {
        setNutritionAccent(pref.nutritionAccent);
      }),
    []
  );

  const colorClasses = {
    blue: 'bg-blue-500',
    green: null,
    orange: 'bg-orange-500',
    red: 'bg-red-500'
  };

  const isHex = typeof color === 'string' && color.startsWith('#');
  const fillClass = isHex ? '' : colorClasses[color] || colorClasses.blue;
  const fillStyle = {
    width: `${percent}%`,
    ...(color === 'green' ? { backgroundColor: nutritionAccent } : null),
    ...(isHex ? { backgroundColor: color } : null)
  };

  return (
    <div className={`w-full bg-slate-700 rounded-full h-2 overflow-hidden ${className}`}>
      <div
        className={`h-full ${fillClass || ''} transition-all duration-300`}
        style={fillStyle}
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
