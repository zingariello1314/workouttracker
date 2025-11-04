/**
 * 💪 COMPOSANT EXERCISE ITEM
 * 
 * Composant pour afficher un exercice individuel avec checkbox, saisie reps, et bouton variations.
 * Utilise les hooks personnalisés pour optimiser les performances et la cohérence.
 * 
 * @module ExerciseItem
 */

import React, { memo, useCallback } from 'react';
import { Zap } from 'lucide-react';
import { Checkbox } from '../../ui/Input';
import { Input } from '../../ui/Input';
import Button from '../../ui/Button';
import { useExerciseTracking } from '../hooks/useExerciseTracking';
import { calculateAutoReps } from '../../../../utils/exerciseCalculations';

/**
 * Composant pour afficher un exercice individuel
 * 
 * @param {Object} props
 * @param {Object} props.exercise - Objet exercice (id, name, series, materiel, notes)
 * @param {Date} props.date - Date de l'exercice
 * @param {boolean} props.isGymMode - Mode salle activé
 * @param {Function} props.onShowVariations - Callback pour afficher les variations
 * 
 * @example
 * <ExerciseItem
 *   exercise={exercise}
 *   date={currentDate}
 *   isGymMode={isGymMode}
 *   onShowVariations={(exercise) => setShowVariations(exercise)}
 * />
 */
const ExerciseItem = memo(({ exercise, date, isGymMode, onShowVariations }) => {
  const { toggleExercise, updateReps, getExerciseStatus } = useExerciseTracking({
    date,
    isGymMode
  });

  const { isChecked, reps } = getExerciseStatus(exercise.id);

  // Handler pour auto-remplissage au focus
  const handleInputFocus = useCallback(() => {
    if (!reps && exercise.series) {
      const autoReps = calculateAutoReps(exercise.series, { round: true });
      if (autoReps !== null) {
        updateReps(exercise.id, autoReps.toString());
      }
    }
  }, [exercise.series, exercise.id, reps, updateReps]);

  // Handler pour toggle
  const handleToggle = useCallback(() => {
    toggleExercise(exercise.id);
  }, [exercise.id, toggleExercise]);

  // Handler pour changement reps
  const handleRepsChange = useCallback((e) => {
    updateReps(exercise.id, e.target.value);
  }, [exercise.id, updateReps]);

  // Handler pour afficher variations
  const handleShowVariations = useCallback(() => {
    if (onShowVariations) {
      onShowVariations(exercise);
    }
  }, [exercise, onShowVariations]);

  return (
    <div className="flex items-center space-x-3 p-4 bg-slate-700/50 rounded-lg border border-slate-600/50 hover:bg-slate-700/70 transition-all duration-200">
      <div className="flex-1">
        <div className="font-medium text-white">{exercise.name}</div>
        <div className="text-sm text-gray-300">
          {exercise.series}
          {exercise.materiel && ` • ${exercise.materiel}`}
          {exercise.notes && ` • ${exercise.notes}`}
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          checked={isChecked}
          onChange={handleToggle}
          className="text-green-400"
          name={`exercise_${exercise.id}`}
          aria-label={`Marquer ${exercise.name} comme complété`}
        />
        <Input
          type="number"
          placeholder="Reps"
          value={reps}
          onChange={handleRepsChange}
          onFocus={handleInputFocus}
          className={`w-20 text-center ${isChecked ? 'bg-green-600/20 border-green-500 text-green-300' : 'bg-slate-800 border-slate-600 text-white'}`}
          size="sm"
          aria-label={`Répétitions pour ${exercise.name}`}
        />
        {isChecked && (
          <div className="text-green-400 text-sm font-medium" aria-label="Exercice complété">
            ✓ Fait
          </div>
        )}
        {onShowVariations && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleShowVariations}
            icon={Zap}
            className="bg-blue-600 hover:bg-blue-700"
            aria-label={`Voir les variations de ${exercise.name}`}
          />
        )}
      </div>
    </div>
  );
});

ExerciseItem.displayName = 'ExerciseItem';

export default ExerciseItem;

