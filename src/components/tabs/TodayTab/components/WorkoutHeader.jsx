/**
 * 📋 COMPOSANT WORKOUT HEADER
 * 
 * Composant pour afficher l'en-tête du workout du jour.
 * Affiche le nom, le focus, la durée, et le toggle gym/maison si applicable.
 * 
 * @module WorkoutHeader
 */

import React, { memo } from 'react';
import GymModeToggle from './GymModeToggle';

/**
 * Composant pour afficher l'en-tête du workout
 * 
 * @param {Object} props
 * @param {Object} props.workout - Objet workout contenant name, focus, duree, isGymMode
 * @param {boolean} props.hasGymVariants - Si des variantes gym sont disponibles
 * @param {boolean} props.isGymMode - Mode salle actuellement activé
 * @param {Function} props.setIsGymMode - Fonction pour changer le mode
 * @param {string} props.weekVariant - Variante de semaine actuelle ('A' ou 'B')
 * @param {boolean} props.showWeekVariant - Afficher le badge de variante semaine
 * 
 * @example
 * <WorkoutHeader
 *   workout={workout}
 *   hasGymVariants={hasGymVariants}
 *   isGymMode={isGymMode}
 *   setIsGymMode={setIsGymMode}
 *   weekVariant="A"
 *   showWeekVariant={true}
 * />
 */
const WorkoutHeader = memo(({ 
  workout, 
  hasGymVariants = false, 
  isGymMode = false, 
  setIsGymMode, 
  weekVariant = null,
  showWeekVariant = false 
}) => {
  // Déterminer le gradient selon le type de workout
  const isRestDay = workout.focus?.includes('Repos') || false;
  const gradientClass = isRestDay
    ? 'bg-gradient-to-r from-blue-900/80 to-slate-800/80'
    : 'bg-gradient-to-r from-pink-600/80 to-purple-600/80';

  return (
    <div className={`p-6 rounded-lg shadow-xl border border-slate-700 ${gradientClass} backdrop-blur-sm`}>
      <h2 className="text-2xl font-bold text-white">{workout.name}</h2>
      {workout.focus && (
        <p className="text-sm text-gray-200 opacity-90 mt-1">{workout.focus}</p>
      )}
      {workout.duree && (
        <p className="text-xs text-gray-300 mt-2">⏱️ {workout.duree}</p>
      )}
      
      {/* Toggle Gym/Maison - seulement si variantes disponibles */}
      {hasGymVariants && setIsGymMode && (
        <GymModeToggle
          isGymMode={isGymMode}
          setIsGymMode={setIsGymMode}
          weekVariant={weekVariant}
          showWeekVariant={showWeekVariant}
        />
      )}
    </div>
  );
});

WorkoutHeader.displayName = 'WorkoutHeader';

export default WorkoutHeader;




