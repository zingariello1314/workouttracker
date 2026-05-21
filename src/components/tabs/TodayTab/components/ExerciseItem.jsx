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
import { getDateStr } from '../../../../utils/dateUtils';
import { formatStepsDash } from '../../../../services/trainingPatterns/pyramidEngine';
import { resolveExercisePyramidPattern } from '../../../../services/trainingPatterns/resolveExercisePyramidPattern';
import {
  collectRecentSessionTotalsForExercise,
  estimateSessionsPerWeek
} from '../../../../services/trainingPatterns/pyramidUserSignals';
import { intensityCoeffToStarCount, resolveExerciseIntensityCoeff } from '../../../../utils/trainingLoadUtils';
import LoadDifficultyStars from '../../../sport/LoadDifficultyStars';
import SessionTriplePerceivedBlock from './SessionTriplePerceivedBlock';

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
  const {
    toggleExercise,
    updateReps,
    updateSessionPerceived,
    getExerciseStatus
  } = useExerciseTracking({
    date,
    isGymMode
  });
  const { data, getCurrentData } = useWorkout();

  const { isChecked, reps, sessionEffortStars, sessionPerceived } = getExerciseStatus(exercise);

  const dateStr = useMemo(() => getDateStr(date), [date]);
  const trainingPattern = useMemo(() => {
    const live = typeof getCurrentData === 'function' ? getCurrentData() : null;
    const snapshot = live || data;
    const recent = collectRecentSessionTotalsForExercise(snapshot?.reps || {}, exercise.id, { maxDays: 90 });
    const sessionsPerWeek = estimateSessionsPerWeek(snapshot?.reps || {}, exercise.id, { windowDays: 42 });
    return resolveExercisePyramidPattern({
      dailyVariations: snapshot?.dailyVariations,
      dateStr,
      exercise,
      records: snapshot?.exerciseMaxRecords || [],
      meanSessionTotal: recent.meanPerSession,
      sessionsPerWeek
    });
  }, [data, dateStr, exercise, getCurrentData]);

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
    if (reps) return;
    if (exerciseUnit?.isTimeBased) return;

    let autoReps = null;
    if (trainingPattern && Number.isFinite(Number(trainingPattern.totalReps))) {
      autoReps = Math.round(Number(trainingPattern.totalReps));
    } else if (exercise.series) {
      autoReps = calculateAutoReps(exercise.series, { round: true });
    }
    if (autoReps !== null) {
      updateReps(exercise, String(autoReps));
    }
  }, [exercise, reps, updateReps, exerciseUnit, trainingPattern]);

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

  const handleSessionPerceived = useCallback(
    (draft, overall) => {
      updateSessionPerceived(exercise, draft, overall);
    },
    [exercise, updateSessionPerceived]
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
            <p className="text-[11px] font-medium text-amber-200/90 mb-1.5">Ressenti de la séance</p>
            <SessionTriplePerceivedBlock
              idPrefix={`ex-${exercise.id}`}
              persistedDraft={sessionPerceived}
              suggestedStars={sessionEffortStars ?? coefStarCount}
              onChange={handleSessionPerceived}
            />
          </div>
        )}
        <div className="text-sm text-gray-300">
          {exercise.series}
          {exercise.materiel && ` • ${exercise.materiel}`}
          {exercise.notes && ` • ${exercise.notes}`}
        </div>
        {trainingPattern ? (
          <div className="mt-2 rounded-md border border-amber-500/40 bg-amber-950/30 px-2 py-1.5 text-[11px] leading-snug text-amber-50/95">
            <span className="font-semibold text-amber-200">
              Plan pyramide{' '}
              {String(trainingPattern.source || '').includes('program') ? '(programme)' : '(jour / Défis)'}
            </span>
            {trainingPattern.label ? (
              <span className="text-amber-100/90"> · {trainingPattern.label}</span>
            ) : null}
            <div className="mt-0.5 font-mono text-[10px] text-amber-100/85">{formatStepsDash(trainingPattern.steps)}</div>
            <div className="mt-0.5 text-amber-100/75">
              {trainingPattern.totalReps != null ? `${trainingPattern.totalReps} reps totales prévues` : ''}
              {trainingPattern.restBetweenStepsSec != null
                ? ` · ~${trainingPattern.restBetweenStepsSec}s entre paliers`
                : ''}
            </div>
          </div>
        ) : null}
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


