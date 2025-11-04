/**
 * 💪 COMPOSANT EXERCISE ITEM
 * 
 * Composant pour afficher un exercice individuel avec checkbox, saisie reps, et bouton variations.
 * Utilise les hooks personnalisés pour optimiser les performances et la cohérence.
 * 
 * @module ExerciseItem
 */

import React, { memo, useCallback, useMemo } from 'react';
import { Zap } from 'lucide-react';
import { Checkbox } from '../../ui/Input';
import { Input } from '../../ui/Input';
import Button from '../../ui/Button';
import { useExerciseTracking } from '../hooks/useExerciseTracking';
import { calculateAutoReps, detectExerciseUnit } from '../../../../utils/exerciseCalculations';

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

  // 🔴 FIX : Détecter l'unité de l'exercice (sec, min, ou reps)
  const exerciseUnit = useMemo(() => {
    const unit = detectExerciseUnit(exercise);
    // 🔴 DEBUG : Logger pour vérifier la détection (toujours pour debug)
    console.log(`[ExerciseItem] ${exercise.name || 'Unknown'} - series: "${exercise.series}" - unit:`, unit);
    return unit;
  }, [exercise]);

  // Déterminer le placeholder et le label selon l'unité
  const inputPlaceholder = useMemo(() => {
    if (!exerciseUnit) {
      console.warn(`[ExerciseItem] No unit detected for ${exercise.name}, defaulting to Reps`);
      return 'Reps';
    }
    const placeholder = exerciseUnit.unit === 'sec' ? 'Sec' : 
                        exerciseUnit.unit === 'min' ? 'Min' : 
                        'Reps';
    console.log(`[ExerciseItem] ${exercise.name} - placeholder: "${placeholder}", unit:`, exerciseUnit);
    return placeholder;
  }, [exerciseUnit, exercise.name]);

  const inputLabel = useMemo(() => {
    if (!exerciseUnit) return 'Reps';
    const label = exerciseUnit.unit === 'sec' ? 'sec' : 
                   exerciseUnit.unit === 'min' ? 'min' : 
                   'Reps';
    console.log(`[ExerciseItem] ${exercise.name} - label: "${label}"`);
    return label;
  }, [exerciseUnit, exercise.name]);

  // Handler pour auto-remplissage au focus
  const handleInputFocus = useCallback(() => {
    if (!reps && exercise.series) {
      // Pour les exercices basés sur le temps, ne pas auto-remplir
      // L'utilisateur doit saisir manuellement le temps
      if (exerciseUnit?.isTimeBased) {
        return;
      }
      
      const autoReps = calculateAutoReps(exercise.series, { round: true });
      if (autoReps !== null) {
        updateReps(exercise.id, autoReps.toString());
      }
    }
  }, [exercise.series, exercise.id, reps, updateReps, exerciseUnit]);

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
        <div className="flex items-center gap-1">
          <Input
            type="number"
            placeholder={inputPlaceholder}
            value={reps}
            onChange={handleRepsChange}
            onFocus={handleInputFocus}
            className={`w-20 text-center ${isChecked ? 'bg-green-600/20 border-green-500 text-green-300' : 'bg-slate-800 border-slate-600 text-white'}`}
            size="sm"
            aria-label={`${exerciseUnit?.isTimeBased ? 'Temps' : 'Répétitions'} pour ${exercise.name}`}
          />
          <span className="text-slate-400 text-xs min-w-[35px]">
            {inputLabel}
          </span>
        </div>
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


