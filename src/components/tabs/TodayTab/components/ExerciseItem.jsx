/**
 * 💪 COMPOSANT EXERCISE ITEM
 * 
 * Composant pour afficher un exercice individuel avec checkbox, saisie reps, et bouton variations.
 * Utilise les hooks personnalisés pour optimiser les performances et la cohérence.
 * 
 * @module ExerciseItem
 */

import React, { useCallback, useMemo } from 'react';
import { Zap } from 'lucide-react';
import { Checkbox } from '../../ui/Input';
import { Input } from '../../ui/Input';
import Button from '../../ui/Button';
import { useExerciseTracking } from '../hooks/useExerciseTracking';
import { useWorkout } from '../../../../context/WorkoutContext';
import { calculateAutoReps, detectExerciseUnit } from '../../../../utils/exerciseCalculations';
import { intensityCoeffToStarCount, resolveExerciseIntensityCoeff } from '../../../../utils/trainingLoadUtils';
import LoadDifficultyStars from '../../../sport/LoadDifficultyStars';
import SessionEffortBlock from './SessionEffortBlock';

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
const ExerciseItem = ({ exercise, date, isGymMode, onShowVariations }) => {
  const { toggleExercise, updateReps, updateSessionEffortStars, getExerciseStatus } = useExerciseTracking({
    date,
    isGymMode
  });
  const { data, getCurrentData } = useWorkout();

  const { isChecked, reps, sessionEffortStars } = getExerciseStatus(exercise);

  const loadCoeff = useMemo(() => {
    const live = typeof getCurrentData === 'function' ? getCurrentData() : null;
    const coeffs = live?.exerciseIntensityCoeffs ?? data?.exerciseIntensityCoeffs ?? {};
    const a = resolveExerciseIntensityCoeff(exercise, coeffs);
    if (exercise?.originalId != null && String(exercise.originalId) !== String(exercise.id)) {
      const b = resolveExerciseIntensityCoeff({ ...exercise, id: exercise.originalId }, coeffs);
      const hasA =
        coeffs[String(exercise.id)] !== undefined &&
        coeffs[String(exercise.id)] !== null &&
        coeffs[String(exercise.id)] !== '';
      const hasB =
        coeffs[String(exercise.originalId)] !== undefined &&
        coeffs[String(exercise.originalId)] !== null &&
        coeffs[String(exercise.originalId)] !== '';
      if (hasB && !hasA) return b;
    }
    return a;
  }, [exercise, data?.exerciseIntensityCoeffs, getCurrentData]);

  const coefStarCount = useMemo(
    () => intensityCoeffToStarCount(loadCoeff),
    [loadCoeff]
  );

  // Détecter l'unité de l'exercice (sec, min, ou reps)
  const exerciseUnit = useMemo(() => detectExerciseUnit(exercise), [exercise]);

  // Déterminer le placeholder et le label selon l'unité
  const inputPlaceholder = useMemo(() => {
    if (!exerciseUnit) {
      return 'Reps';
    }
    return exerciseUnit.unit === 'sec' ? 'Sec' :
      exerciseUnit.unit === 'min' ? 'Min' :
        'Reps';
  }, [exerciseUnit]);

  const inputLabel = useMemo(() => {
    if (!exerciseUnit) return 'Reps';
    return exerciseUnit.unit === 'sec' ? 'sec' :
      exerciseUnit.unit === 'min' ? 'min' :
        'Reps';
  }, [exerciseUnit]);

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
        updateReps(exercise, autoReps.toString());
      }
    }
  }, [exercise, reps, updateReps, exerciseUnit]);

  // Handler pour toggle
  const handleToggle = useCallback(() => {
    toggleExercise(exercise);
  }, [exercise, toggleExercise]);

  // Handler pour changement reps
  const handleRepsChange = useCallback((e) => {
    updateReps(exercise, e.target.value);
  }, [exercise, updateReps]);

  // Handler pour afficher variations
  const handleShowVariations = useCallback(() => {
    if (onShowVariations) {
      onShowVariations(exercise);
    }
  }, [exercise, onShowVariations]);

  const handleSessionStars = useCallback(
    (n) => {
      updateSessionEffortStars(exercise, n);
    },
    [exercise, updateSessionEffortStars]
  );

  return (
    <div className="flex items-center space-x-3 p-4 bg-slate-700/50 rounded-lg border border-slate-600/50 hover:bg-slate-700/70 transition-all duration-200">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <div className="font-medium text-white shrink-0">{exercise.name}</div>
          <span className="shrink-0 inline-flex items-center text-sky-400" title="Indice charge (auto, avant « Fait »)">
            <LoadDifficultyStars coeff={loadCoeff} className="scale-95" />
          </span>
        </div>
        {isChecked && (
          <div className="mt-2 pt-2 border-t border-slate-600/50 w-full">
            <p className="text-[11px] font-medium text-amber-200/90 mb-1.5">Ressenti aujourd’hui</p>
            <SessionEffortBlock
              idPrefix={`ex-${exercise.id}`}
              persistedValue={sessionEffortStars}
              suggestedStars={coefStarCount}
              onChange={handleSessionStars}
            />
          </div>
        )}
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
};

ExerciseItem.displayName = 'ExerciseItem';

export default ExerciseItem;


