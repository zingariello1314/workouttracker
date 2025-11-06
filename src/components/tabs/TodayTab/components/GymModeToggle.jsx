/**
 * 🏋️ COMPOSANT GYM MODE TOGGLE
 * 
 * Composant pour basculer entre mode Maison et Salle.
 * Affiché uniquement les jours où des variantes gym sont disponibles (samedi/dimanche).
 * 
 * @module GymModeToggle
 */

import React, { memo } from 'react';

/**
 * Composant pour basculer entre mode Maison et Salle
 * 
 * @param {Object} props
 * @param {boolean} props.isGymMode - Mode salle actuellement activé
 * @param {Function} props.setIsGymMode - Fonction pour changer le mode
 * @param {string} props.weekVariant - Variante de semaine actuelle ('A' ou 'B')
 * @param {boolean} props.showWeekVariant - Afficher le badge de variante semaine
 * 
 * @example
 * <GymModeToggle
 *   isGymMode={isGymMode}
 *   setIsGymMode={setIsGymMode}
 *   weekVariant="A"
 *   showWeekVariant={true}
 * />
 */
const GymModeToggle = memo(({ isGymMode, setIsGymMode, weekVariant, showWeekVariant = false }) => {
  return (
    <div className="mt-4 flex items-center gap-3">
      <span className="text-sm text-gray-200">Mode d'entraînement:</span>
      <div className="flex items-center bg-slate-700/50 rounded-lg p-1">
        <button
          onClick={() => setIsGymMode(false)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
            !isGymMode 
              ? 'bg-purple-600 text-white shadow-md' 
              : 'text-gray-300 hover:text-white'
          }`}
          aria-label="Mode maison"
          aria-pressed={!isGymMode}
        >
          🏠 Maison
        </button>
        <button
          onClick={() => setIsGymMode(true)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
            isGymMode 
              ? 'bg-purple-600 text-white shadow-md' 
              : 'text-gray-300 hover:text-white'
          }`}
          aria-label="Mode salle"
          aria-pressed={isGymMode}
        >
          🏋️ Salle
        </button>
      </div>
      {showWeekVariant && weekVariant && (
        <span 
          className="text-xs text-gray-400 bg-slate-700/30 px-2 py-1 rounded"
          aria-label={`Variante semaine ${weekVariant}`}
        >
          Semaine {weekVariant}
        </span>
      )}
    </div>
  );
});

GymModeToggle.displayName = 'GymModeToggle';

export default GymModeToggle;




