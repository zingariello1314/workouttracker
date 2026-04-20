import React, { useMemo, useState } from 'react';
import { Play, Square, CheckCircle, Clock, Target, Flame, Zap, MessageSquare, Save, X, Award, Plus, Trash2, BarChart3 } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { useToast } from '../../components/ui/Toast';
import { workoutProgram } from '../../data/workoutProgram';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { Input, Checkbox } from '../ui/Input';
import ChallengeCard from '../ui/ChallengeCard';
import { typography } from '../../styles/typography';
import { getAutoWeekVariant } from '../../utils/dateUtils';
import { calculateAutoReps, detectExerciseUnit } from '../../utils/exerciseCalculations';
import { useTodayExercises } from '../../hooks/useTodayExercises';
import AddExceptionalExerciseModal from '../modals/AddExceptionalExerciseModal';
import { isMockEnduranceSession } from '../../utils/calendarUtils';
import DayJustificationButton from './TodayTab/components/DayJustificationButton.jsx';
import { isDayWithoutActivity } from '../../utils/dayJustificationUtils';
import { useTranslation } from '../../utils/translations';
import SportXPBar from './TodayTab/components/SportXPBar';
import { loadEnduranceData as loadEnduranceDataService } from '../../services/endurance/enduranceDataService';
import {
  collectExerciseKeysForWorkoutExercise,
  generateSmartExerciseKey,
  resolveBestRepsStorageKey,
  findLatestExerciseWeightValue
} from '../../utils/exerciseKeyGenerator';
import { resolveExerciseIntensityCoeff } from '../../utils/trainingLoadUtils';
import { exerciseUsesExternalLoad } from '../../utils/programUtils';
import LoadDifficultyStars from '../sport/LoadDifficultyStars';
import { computeTodaySessionComplexity } from '../../utils/todaySessionScore';

const resolveExerciseWeightDisplay = (currentData, keys, readKey) => {
  const w = currentData.exerciseWeights || {};
  const ordered = [readKey, ...keys.filter((k) => k !== readKey)];
  for (const k of ordered) {
    const v = w[k];
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v);
  }
  return '';
};

const TodayTab = () => {
  const {
    currentDate,
    data,
    updateData,
    getTodayWorkout,
    getDateStr,
    getDayName,
    setSelectedExercise,
    setShowExerciseVariations,
    setSessionData,
    setShowSessionFeedback,
    isGymMode,
    setIsGymMode,
    workoutDayOverride,
    setWorkoutDayOverride,
    hasUnsavedExercises,
    hasUnsavedStretches,
    saveExerciseChanges,
    discardExerciseChanges,
    saveStretchChanges,
    discardStretchChanges,
    updateTempExerciseData,
    updateTempStretchData,
    getCurrentData,
    updateReps,
    toggleCheck,
    // ✅ NOUVEAU : Fonctions de variations journalières
    suppressExerciseForToday,
    restoreExerciseForToday,
    addExceptionalExercise,
    removeExceptionalExercise,
    markExceptionalExerciseComplete
  } = useWorkout();
  
  const { showSuccess, showError } = useToast();
  const t = useTranslation();

  const normalizedEndurance = useMemo(() => {
    try {
      const { sessions, challenges } = loadEnduranceDataService(data?.enduranceData || {});
      return { sessions, challenges };
    } catch (error) {
      console.error('[TodayTab] Erreur normalisation endurance:', error);
      return { sessions: data?.enduranceData?.sessions || {}, challenges: data?.enduranceData?.challenges || [] };
    }
  }, [data?.enduranceData]);

  // Récupérer les défis actifs
  const getActiveChallenges = () => {
    const challenges = normalizedEndurance.challenges || [];
    const todayStr = getDateStr(currentDate);
    const now = new Date();
    
    return challenges.filter(challenge => {
      // Cas récurrent: afficher si non réalisé aujourd'hui
      if (challenge.type === 'recurrent') {
        const doneToday = challenge.lastCompletedDate === todayStr;
        // Même si le statut a été mis par erreur à 'completed', on le considère actif tant que pas fait aujourd'hui
        return !doneToday;
      }
      // Cas non récurrent: seulement si actif et dans la fenêtre de validité
      if (challenge.status !== 'active') return false;
      switch (challenge.type) {
        case 'ponctuel':
          return new Date(challenge.targetDate) >= now;
        case 'periode':
          return new Date(challenge.endDate) >= now;
        default:
          return true;
      }
    });
  };

  // Fonction pour valider un défi
  const handleChallengeComplete = async (challengeId, completionData) => {
    try {
      // Déterminer le type d'activité du défi
      const activityType = getActiveChallenges().find(c => c.id === challengeId)?.activityType || 'pushups';
      
      // ✅ CORRECTION : Normaliser les données pour les pushups/boxing
      // Pour pushups : s'assurer que count existe (utilisé par défaut dans CalendarHeatmap)
      // Si reps existe mais pas count, copier reps dans count pour cohérence
      const normalizedData = { ...completionData };
      if (activityType === 'pushups' || activityType === 'boxing') {
        if (normalizedData.reps && !normalizedData.count) {
          normalizedData.count = normalizedData.reps;
        }
      }
      
      // Créer une session d'endurance pour valider le défi
      const sessionData = {
        id: Date.now(),
        date: getDateStr(currentDate),
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        ...normalizedData,
        validatedChallenges: [challengeId]
      };

      // Mettre à jour les données d'endurance
      const enduranceData = data?.enduranceData || {};
      const currentSessions = enduranceData.sessions || {};
      // Note: activityType est déjà défini plus haut (ligne 82)
      
      const updatedSessions = {
        ...currentSessions,
        [activityType]: [...(currentSessions[activityType] || []), sessionData]
      };

      // Marquer le défi comme complété
      const updatedChallenges = (enduranceData.challenges || []).map(challenge => {
        if (challenge.id !== challengeId) return challenge;
        if (challenge.type === 'recurrent') {
          // Marquer comme réalisé pour aujourd'hui uniquement
          return {
            ...challenge,
            status: 'active',
            lastCompletedDate: getDateStr(currentDate),
            completedSessionId: sessionData.id
          };
        }
        return {
          ...challenge,
          status: 'completed',
          completedAt: new Date().toISOString(),
          completedSessionId: sessionData.id
        };
      });

      // Sauvegarder
      await updateData({
        ...data,
        enduranceData: {
          ...enduranceData,
          sessions: updatedSessions,
          challenges: updatedChallenges,
          lastUpdated: new Date().toISOString()
        }
      });

      showSuccess(t('today.challenges.completed'));
    } catch (error) {
      console.error('❌ Erreur lors de la validation du défi:', error);
      showError(t('today.messages.errorValidating'), {
        title: t('today.messages.validationFailed'),
        message: t('today.messages.errorValidatingMessage'),
        suggestions: [
          t('today.messages.suggestions.checkFields'),
          t('today.messages.suggestions.tryAgain')
        ]
      });
      throw error;
    }
  };

  // Debug IndexedDB supprimé (réservé au mode dev si nécessaire)

  // Note: calculateAutoReps est maintenant importé depuis utils/exerciseCalculations

  // Gestionnaire pour l'auto-remplissage au focus/clic
  const handleInputFocus = (exerciseId, exercise) => {
    const currentData = getCurrentData();
    const workoutForDay = getTodayWorkout(currentDate, isGymMode);
    const exerciseUnit = detectExerciseUnit(exercise);
    if (exerciseUnit?.isTimeBased) return;

    const keys = collectExerciseKeysForWorkoutExercise(currentDate, exercise, {
      isGymMode,
      workoutIsGymMode: workoutForDay?.isGymMode
    });
    const readKey = resolveBestRepsStorageKey(currentData, keys) || keys[0];
    const currentValue = String(currentData.reps?.[readKey] ?? '').trim();

    if (!currentValue && exercise.series) {
      const autoReps = calculateAutoReps(exercise.series, { round: true });
      if (autoReps != null) {
        updateLocalReps(exerciseId, autoReps.toString(), currentDate);
      }
    }
  };

  const handleWeightInputFocus = (exerciseId, exercise) => {
    if (!exerciseUsesExternalLoad(exercise)) return;
    const currentData = getCurrentData();
    const workoutForDay = getTodayWorkout(currentDate, isGymMode);
    const keys = collectExerciseKeysForWorkoutExercise(currentDate, exercise, {
      isGymMode,
      workoutIsGymMode: workoutForDay?.isGymMode
    });
    const readKey = resolveBestRepsStorageKey(currentData, keys) || keys[0];
    const displayed = resolveExerciseWeightDisplay(currentData, keys, readKey).trim();
    if (displayed) return;
    const ids = [exerciseId, exercise?.originalId].filter((x) => x != null);
    const latest = findLatestExerciseWeightValue(currentData, ids);
    if (latest) {
      updateLocalExerciseWeight(exerciseId, latest, currentDate);
    }
  };

  // Fonction pour gérer le clic sur une case à cocher avec auto-remplissage
  const handleExerciseCheck = (exerciseId, date) => {
    const currentData = getCurrentData();
    const dateStr = getDateStr(date);
    const workout = getTodayWorkout(date, isGymMode);
    const exercise = workout.exercices?.find((ex) => ex.id === exerciseId);
    const fallbackKey = `${dateStr}_${exerciseId}`;

    if (!exercise) {
      const isCurrentlyChecked = !!currentData.checkedExercises?.[fallbackKey];
      updateTempExerciseData({
        ...currentData,
        checkedExercises: {
          ...currentData.checkedExercises,
          [fallbackKey]: !isCurrentlyChecked
        },
        reps: {
          ...currentData.reps,
          [fallbackKey]: !isCurrentlyChecked ? currentData.reps?.[fallbackKey] || '' : undefined
        },
        exerciseWeights: {
          ...(currentData.exerciseWeights || {}),
          [fallbackKey]: !isCurrentlyChecked
            ? currentData.exerciseWeights?.[fallbackKey] ?? ''
            : undefined
        }
      });
      return;
    }

    const keys = collectExerciseKeysForWorkoutExercise(date, exercise, {
      isGymMode,
      workoutIsGymMode: workout?.isGymMode
    });
    const primaryKey = generateSmartExerciseKey(date, exercise.id, {
      isGymMode,
      workoutIsGymMode: workout?.isGymMode,
      weekVariant: getAutoWeekVariant(date)
    });
    const isCurrentlyChecked = keys.some((k) => currentData.checkedExercises?.[k] === true);

    const stripKeys = (checkedObj, repsObj, weightsObj) => {
      const nextChecked = { ...checkedObj };
      const nextReps = { ...repsObj };
      const nextWeights = { ...weightsObj };
      keys.forEach((k) => {
        delete nextChecked[k];
        delete nextReps[k];
        delete nextWeights[k];
      });
      return { nextChecked, nextReps, nextWeights };
    };

    if (isCurrentlyChecked) {
      const { nextChecked, nextReps, nextWeights } = stripKeys(
        currentData.checkedExercises,
        currentData.reps,
        currentData.exerciseWeights || {}
      );
      updateTempExerciseData({
        ...currentData,
        checkedExercises: nextChecked,
        reps: nextReps,
        exerciseWeights: nextWeights
      });
      return;
    }

    if (exercise.series) {
      const seriesText = exercise.series;
      let autoReps = null;
      if (seriesText.includes('×')) {
        const match = seriesText.match(/(\d+)×(\d+)(?:-(\d+))?/);
        if (match) {
          const sets = parseInt(match[1], 10);
          const minReps = parseInt(match[2], 10);
          const maxReps = match[3] ? parseInt(match[3], 10) : minReps;
          autoReps = sets * Math.round((minReps + maxReps) / 2);
        }
      }
      const { nextChecked, nextReps, nextWeights } = stripKeys(
        currentData.checkedExercises,
        currentData.reps,
        currentData.exerciseWeights || {}
      );
      nextChecked[primaryKey] = true;
      nextReps[primaryKey] = autoReps != null ? autoReps.toString() : '';
      const prevKeyForWeight = resolveBestRepsStorageKey(currentData, keys);
      nextWeights[primaryKey] =
        prevKeyForWeight && currentData.exerciseWeights?.[prevKeyForWeight] != null
          ? String(currentData.exerciseWeights[prevKeyForWeight])
          : '';
      updateTempExerciseData({
        ...currentData,
        checkedExercises: nextChecked,
        reps: nextReps,
        exerciseWeights: nextWeights
      });
      return;
    }

    const { nextChecked, nextReps, nextWeights } = stripKeys(
      currentData.checkedExercises,
      currentData.reps,
      currentData.exerciseWeights || {}
    );
    nextChecked[primaryKey] = true;
    const prevKey = resolveBestRepsStorageKey(currentData, keys);
    nextReps[primaryKey] =
      prevKey && currentData.reps?.[prevKey] != null ? String(currentData.reps[prevKey]) : '';
    nextWeights[primaryKey] =
      prevKey && currentData.exerciseWeights?.[prevKey] != null
        ? String(currentData.exerciseWeights[prevKey])
        : '';
    updateTempExerciseData({
      ...currentData,
      checkedExercises: nextChecked,
      reps: nextReps,
      exerciseWeights: nextWeights
    });
  };

  const updateLocalReps = (exerciseId, reps, date) => {
    const currentData = getCurrentData();
    const dateStr = getDateStr(date);
    const workout = getTodayWorkout(date, isGymMode);
    const exercise = workout.exercices?.find((ex) => ex.id === exerciseId);
    const key = exercise
      ? generateSmartExerciseKey(date, exercise.id, {
          isGymMode,
          workoutIsGymMode: workout?.isGymMode,
          weekVariant: getAutoWeekVariant(date)
        })
      : `${dateStr}_${exerciseId}`;

    updateTempExerciseData({
      ...currentData,
      reps: {
        ...currentData.reps,
        [key]: reps
      }
    });
  };

  const updateLocalExerciseWeight = (exerciseId, weightStr, date) => {
    const currentData = getCurrentData();
    const dateStr = getDateStr(date);
    const workout = getTodayWorkout(date, isGymMode);
    const exercise = workout.exercices?.find((ex) => ex.id === exerciseId);
    const key = exercise
      ? generateSmartExerciseKey(date, exercise.id, {
          isGymMode,
          workoutIsGymMode: workout?.isGymMode,
          weekVariant: getAutoWeekVariant(date)
        })
      : `${dateStr}_${exerciseId}`;

    updateTempExerciseData({
      ...currentData,
      exerciseWeights: {
        ...(currentData.exerciseWeights || {}),
        [key]: weightStr
      }
    });
  };

  // Fonctions locales pour les étirements
  const toggleEtirement = (type, date) => {
    const currentData = getCurrentData();
    const dateStr = getDateStr(date);
    const key = `${dateStr}_${type}`;
    
    const newData = {
      ...currentData,
      checkedStretches: {
        ...currentData.checkedStretches,
        [key]: !currentData.checkedStretches[key]
      }
    };
    updateTempStretchData(newData);
  };

  // Sauvegarder les exercices avec vérification d'intégrité
  const handleSaveExercises = async () => {
    try {
      // Utiliser la fonction de sauvegarde du contexte avec gestion d'erreurs
      await saveExerciseChanges();
      showSuccess(t('today.messages.exercisesSaved'));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des exercices:', error);
      showError(t('today.messages.errorSavingExercises'), {
        title: t('today.messages.saveFailed'),
        message: t('today.messages.errorMessage'),
        suggestions: [
          t('today.messages.suggestions.checkInternet'),
          t('today.messages.suggestions.refresh'),
          t('today.messages.suggestions.contactSupport')
        ]
      });
    }
  };

  // Sauvegarder les étirements avec vérification d'intégrité
  const handleSaveStretches = async () => {
    try {
      // Utiliser la fonction de sauvegarde du contexte avec gestion d'erreurs
      await saveStretchChanges();
      showSuccess(t('today.messages.stretchesSaved'));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des étirements:', error);
      showError(t('today.messages.errorSavingStretches'), {
        title: t('today.messages.saveFailed'),
        message: t('today.messages.errorMessage'),
        suggestions: [
          t('today.messages.suggestions.checkInternet'),
          t('today.messages.suggestions.refresh'),
          t('today.messages.suggestions.contactSupport')
        ]
      });
    }
  };

  const handleDiscardExercises = () => {
    discardExerciseChanges();
  };

  const handleDiscardStretches = () => {
    discardStretchChanges();
  };

  // ✅ NOUVEAU : Handler pour supprimer un exercice pour aujourd'hui
  const handleSuppressExercise = async (exerciseId) => {
    try {
      // Confirmation avant suppression
      const confirmed = window.confirm(
        t('today.confirmations.suppressExercise')
      );
      
      if (!confirmed) {
        return;
      }

      await suppressExerciseForToday(exerciseId);
      showSuccess(t('today.messages.exerciseSuppressed'));
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de l\'exercice:', error);
      showError(t('today.messages.errorSuppressing'), {
        title: t('today.messages.suppressFailed'),
        message: error.message || t('today.messages.errorMessage'),
        suggestions: [
          t('today.messages.suggestions.checkExerciseExists'),
          t('today.messages.suggestions.tryAgain')
        ]
      });
    }
  };

  // ✅ NOUVEAU : Handler pour restaurer un exercice supprimé
  const handleRestoreExercise = async (exerciseId) => {
    try {
      await restoreExerciseForToday(exerciseId);
      showSuccess(t('today.messages.exerciseRestored'));
    } catch (error) {
      console.error('❌ Erreur lors de la restauration de l\'exercice:', error);
      showError(t('today.messages.errorRestoring'), {
        title: t('today.messages.restoreFailed'),
        message: error.message || t('today.messages.errorMessage'),
        suggestions: [
          t('today.messages.suggestions.checkWasSuppressed'),
          t('today.messages.suggestions.tryAgain')
        ]
      });
    }
  };

  // ✅ NOUVEAU : Handler pour compléter un exercice exceptionnel
  const handleExceptionalExerciseComplete = async (exerciseId, actualReps, actualDuration) => {
    try {
      await markExceptionalExerciseComplete(exerciseId, actualReps, actualDuration);
      showSuccess(t('today.messages.exceptionalExerciseCompleted'));
    } catch (error) {
      console.error('❌ Erreur lors de la complétion de l\'exercice exceptionnel:', error);
      showError(t('today.messages.errorCompleting'), {
        title: t('today.messages.completeFailed'),
        message: error.message || t('today.messages.errorMessage'),
        suggestions: [
          t('today.messages.suggestions.checkExerciseExists'),
          t('today.messages.suggestions.tryAgain')
        ]
      });
    }
  };

  // ✅ NOUVEAU : Handler pour supprimer un exercice exceptionnel
  const handleRemoveExceptionalExercise = async (exerciseId) => {
    try {
      const confirmed = window.confirm(
        t('today.confirmations.removeExceptionalExercise')
      );
      
      if (!confirmed) {
        return;
      }

      await removeExceptionalExercise(exerciseId);
      showSuccess(t('today.messages.exceptionalExerciseRemoved'));
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de l\'exercice exceptionnel:', error);
      showError(t('today.messages.errorRemoving'), {
        title: t('today.messages.removeFailed'),
        message: error.message || t('today.messages.errorMessage'),
        suggestions: [
          t('today.messages.suggestions.checkExerciseExists'),
          t('today.messages.suggestions.tryAgain')
        ]
      });
    }
  };

  const workout = getTodayWorkout(currentDate, isGymMode);
  const dateStr = getDateStr(currentDate);
  const dayName = getDayName(currentDate);

  // Calculer la variante de semaine automatique (toujours basée sur la date)
  const currentWeekVariant = getAutoWeekVariant(currentDate);

  // Vérifier si des variantes gym sont disponibles pour ce jour
  const hasGymVariants = (dayName === 'samedi' || dayName === 'dimanche') && 
                        workoutProgram[dayName] && 
                        workoutProgram[dayName].salleVariants;

  // ✅ NOUVEAU : Utiliser le hook useTodayExercises pour obtenir exercices avec variations
  const {
    programExercises,
    additionalExercises,
    suppressedExerciseIds,
    metadata: exercisesMetadata
  } = useTodayExercises({ date: currentDate, isGymMode });

  /** Exercices avec charge (haltères, barre, gilet) en tête — même critère que le filtre équipement de l'onglet Exercices. */
  const exercisesWithLoadFirst = useMemo(() => {
    const list = programExercises || [];
    return list
      .map((ex, i) => ({ ex, i }))
      .sort((a, b) => {
        const wa = exerciseUsesExternalLoad(a.ex) ? 1 : 0;
        const wb = exerciseUsesExternalLoad(b.ex) ? 1 : 0;
        if (wb !== wa) return wb - wa;
        return a.i - b.i;
      })
      .map((x) => x.ex);
  }, [programExercises]);

  const todaySessionComplexity = useMemo(
    () => computeTodaySessionComplexity(currentDate, workout, getCurrentData(), isGymMode),
    [currentDate, workout, isGymMode, getCurrentData, data, hasUnsavedExercises]
  );

  // ✅ État pour modal d'ajout d'exercice exceptionnel
  const [showAddExceptionalModal, setShowAddExceptionalModal] = useState(false);

  const handleSessionFeedback = () => {
    // Calculer la durée réelle basée sur les exercices accomplis
    const calculateSessionDuration = () => {
      const sessionData = getCurrentData();
      const completedExercises = (workout.exercices || []).filter((exercise) => {
        const keys = collectExerciseKeysForWorkoutExercise(currentDate, exercise, {
          isGymMode,
          workoutIsGymMode: workout.isGymMode
        });
        return keys.some((k) => sessionData.checkedExercises?.[k] === true);
      });
      
      if (completedExercises.length === 0) return 0;
      
      let totalDurationMinutes = 0;
      
      completedExercises.forEach(exercise => {
        if (exercise.series) {
          let exerciseDuration = 0;
          
          // Extraire le nombre de séries et répétitions
          const seriesMatch = exercise.series.match(/(\d+)×(\d+)(?:-(\d+))?/);
          if (seriesMatch) {
            const sets = parseInt(seriesMatch[1]);
            const minReps = parseInt(seriesMatch[2]);
            const maxReps = seriesMatch[3] ? parseInt(seriesMatch[3]) : minReps;
            const avgReps = (minReps + maxReps) / 2;
            
            // Temps par répétition (en secondes) selon le type d'exercice
            let timePerRep = 3; // défaut 3 secondes par rep
            
            if (exercise.name.toLowerCase().includes('planche') || 
                exercise.name.toLowerCase().includes('gainage')) {
              // Exercices isométriques : temps en secondes directement
              if (exercise.series.includes('sec') || exercise.series.includes('min')) {
                const timeMatch = exercise.series.match(/(\d+)\s*(sec|min)/);
                if (timeMatch) {
                  const timeValue = parseInt(timeMatch[1]);
                  const timeUnit = timeMatch[2];
                  exerciseDuration = timeUnit === 'min' ? timeValue * 60 : timeValue;
                }
              } else {
                exerciseDuration = avgReps; // Pour les planches en secondes
              }
            } else {
              // Exercices dynamiques
              exerciseDuration = sets * avgReps * timePerRep; // en secondes
              
              // Ajouter le temps de repos entre séries
              const restTime = exercise.rest || 90; // repos par défaut 90s
              exerciseDuration += (sets - 1) * restTime;
            }
            
            totalDurationMinutes += exerciseDuration / 60; // convertir en minutes
          } else if (exercise.series.includes('sec')) {
            // Exercices en secondes (circuits, etc.)
            const timeMatch = exercise.series.match(/(\d+)\s*sec/);
            if (timeMatch) {
              totalDurationMinutes += parseInt(timeMatch[1]) / 60;
            }
          } else if (exercise.series.includes('min')) {
            // Exercices en minutes
            const timeMatch = exercise.series.match(/(\d+)\s*min/);
            if (timeMatch) {
              totalDurationMinutes += parseInt(timeMatch[1]);
            }
          }
        }
      });
      
      return Math.round(totalDurationMinutes);
    };

    const todayData = {
      date: dateStr,
      exercises: [
        // Exercices classiques
        ...(workout.exercices || []).map((exercise) => {
          const exerciseKey = `${dateStr}_${exercise.id}`;
          const isChecked = data.checkedExercises[exerciseKey] || false;
          const reps = data.reps[exerciseKey] || '';
          return {
            ...exercise,
            completed: isChecked,
            reps: parseInt(reps) || 0
          };
        }).filter(ex => ex.completed),
        // Activités complémentaires
        ...(workout.complementaryActivity && data.checkedExercises[`${dateStr}_complementary_${workout.complementaryActivity.name.toLowerCase()}`] ? [{
          id: `complementary_${workout.complementaryActivity.name.toLowerCase()}`,
          name: workout.complementaryActivity.name,
          completed: true,
          reps: 0,
          duration: workout.complementaryActivity.duration
        }] : [])
      ],
      totalReps: (workout.exercices || []).reduce((total, exercise) => {
        const exerciseKey = `${dateStr}_${exercise.id}`;
        const reps = data.reps[exerciseKey] || '';
        return total + (parseInt(reps) || 0);
      }, 0),
      estimatedDuration: Math.max(30, (workout.exercices || []).length * 3),
      duration: calculateSessionDuration() // Ajouter la durée réelle calculée
    };
    
    setSessionData(todayData);
    setShowSessionFeedback(true);
  };

  const handleSave = () => {
    saveChanges();
  };

  const handleDiscard = () => {
    discardChanges();
  };

  const hasStretchesContent =
    workout.etirements &&
    Object.keys(workout.etirements).length > 0 &&
    Object.values(workout.etirements).some(
      (txt) => txt && String(txt).trim().length > 0
    );

  /** Jour sans exercices : n’afficher l’écran « jour de repos » plein écran que s’il n’y a pas non plus d’étirements prévus */
  if ((!workout.exercices || workout.exercices.length === 0) && !hasStretchesContent) {
    const activeChallenges = getActiveChallenges();
    const currentData = getCurrentData();
    const hasNoActivity = isDayWithoutActivity(currentData, dateStr);
    
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <SportXPBar />
        <div className="text-center py-12 bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700">
          <div className="text-gray-400 mb-4">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-semibold mb-2 text-white">{t('today.restDay.title')}</h3>
            <p>{t('today.restDay.message')}</p>
          </div>
        </div>
        
        {/* ✅ NOUVEAU : Bouton/Badge de justification si jour sans activité */}
        {hasNoActivity && (
          <DayJustificationButton date={currentDate} />
        )}
        
        {/* Section des défis actifs, même si jour de repos */}
        {activeChallenges.length > 0 && (
          <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
            <Card.Header>
              <Card.Title className="flex items-center text-purple-200">
                <Award className="mr-2" size={20} />
                {t('today.challenges.title')} ({activeChallenges.length})
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                {activeChallenges.map(challenge => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    onComplete={handleChallengeComplete}
                  />
                ))}
              </div>
            </Card.Content>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Contenu avec z-index relatif */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-6 space-y-6">
        <SportXPBar />
        {/* Workout Header */}
      <div className={`p-6 rounded-lg shadow-xl border border-slate-700 ${
        workout.focus?.includes('Repos')
          ? 'bg-gradient-to-r from-blue-900/80 to-slate-800/80' 
          : 'bg-gradient-to-r from-pink-600/80 to-purple-600/80'
      } backdrop-blur-sm`}>
        <h2 className="text-2xl font-bold text-white">{workout.name}</h2>
        <p className="text-sm text-gray-200 opacity-90 mt-1">{workout.focus}</p>
        {workout.duree ? (
          <p className="text-xs text-gray-300 mt-2">⏱️ {workout.duree}</p>
        ) : null}
        
        {/* Toggle Gym/Maison - seulement pour samedi et dimanche */}
        {hasGymVariants && (
          <div className="mt-4 flex items-center gap-3">
            <span className="text-sm text-gray-200">{t('today.workout.trainingMode')}</span>
            <div className="flex items-center bg-slate-700/50 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setIsGymMode(false)}
                className={`gradient-button-premium gradient-button-premium-sm rounded-lg ${
                  !isGymMode 
                    ? 'gradient-button-premium-variant' 
                    : ''
                }`}
              >
                {t('today.workout.home')}
              </button>
              <button
                type="button"
                onClick={() => setIsGymMode(true)}
                className={`gradient-button-premium gradient-button-premium-sm rounded-lg ${
                  isGymMode 
                    ? 'gradient-button-premium-variant' 
                    : ''
                }`}
              >
                {t('today.workout.gym')}
              </button>
            </div>
            {data.weekVariant && (
              <span className="text-xs text-gray-400 bg-slate-700/30 px-2 py-1 rounded">
                {t('today.workout.week', 'Semaine {{week}}', { week: currentWeekVariant })}
              </span>
            )}
          </div>
        )}
        {/* Choix d'afficher l'entraînement d'un autre jour (ex. faire lundi un vendredi) */}
        <div className="mt-4 pt-4 border-t border-slate-600/50">
          <p className="text-xs text-slate-400 mb-2">{t('today.workout.useWorkoutOf', "Utiliser l'entraînement de :")}</p>
          <div className="flex flex-wrap gap-1.5">
            {['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'].map((d) => {
              const label = d.charAt(0).toUpperCase() + d.slice(1);
              const isCurrentDay = d === dayName;
              const isSelected = workoutDayOverride ? workoutDayOverride === d : isCurrentDay;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setWorkoutDayOverride(isCurrentDay ? null : d)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/50'
                      : 'bg-slate-700/50 text-slate-300 border border-slate-600 hover:border-slate-500'
                  }`}
                  title={isCurrentDay ? t('today.workout.todayWorkout', "Entraînement du jour") : t('today.workout.useDayWorkout', "Afficher et faire l'entraînement du {{day}}", { day: label })}
                >
                  {isCurrentDay ? t('today.workout.today', "Aujourd'hui") : label}
                </button>
              );
            })}
          </div>
          {workoutDayOverride && (
            <p className="text-xs text-amber-400/90 mt-2">
              {t('today.workout.overrideHint', "Tu affiches l'entraînement du {{day}}. La session sera enregistrée pour aujourd'hui.", { day: workoutDayOverride.charAt(0).toUpperCase() + workoutDayOverride.slice(1) })}
            </p>
          )}
        </div>
      </div>

      {workout?.exercices?.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-teal-500/30 bg-slate-800/60 px-4 py-3 text-sm text-slate-200">
          <BarChart3 className="h-5 w-5 shrink-0 text-teal-400" />
          <div className="min-w-0 flex-1">
            <span className="font-medium text-white">{t('today.sessionScore.title')}</span>
            {todaySessionComplexity.score0to100 != null ? (
              <span className="ml-2 text-teal-200">
                {t('today.sessionScore.score', { score: todaySessionComplexity.score0to100 })}
              </span>
            ) : (
              <span className="ml-2 text-slate-400">{t('today.sessionScore.na')}</span>
            )}
            <span className="mx-2 text-slate-500">·</span>
            <span className="text-slate-400">
              {t('today.sessionScore.load', {
                done: todaySessionComplexity.completedLoad,
                ref: todaySessionComplexity.plannedLoadEstimate
              })}
            </span>
            <span className="mx-2 text-slate-500">·</span>
            <span className="text-slate-400">
              {t('today.sessionScore.doneCount', {
                n: todaySessionComplexity.completedCount,
                total: todaySessionComplexity.plannedCount
              })}
            </span>
          </div>
        </div>
      )}

      {/* ✅ NOUVEAU : Bouton/Badge de justification si jour sans activité (même avec exercices prévus) */}
      {(() => {
        const currentData = getCurrentData();
        const hasNoActivity = isDayWithoutActivity(currentData, dateStr);
        return hasNoActivity ? <DayJustificationButton date={currentDate} /> : null;
      })()}

      {/* Exercices */}
      <div className="bg-slate-800/80 backdrop-blur-sm p-6 rounded-lg shadow-xl border border-slate-700">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          {t('today.exercises.title')}
          {exercisesWithLoadFirst.length > 0 && (
            <span className="text-sm text-slate-400">({exercisesWithLoadFirst.length})</span>
          )}
        </h3>
        {exercisesWithLoadFirst.length === 0 && additionalExercises.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p>{t('today.exercises.noExercises', 'Aucun exercice prévu pour aujourd\'hui')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* ✅ NOUVEAU : Exercices du programme (filtrés selon variations) */}
            {exercisesWithLoadFirst.map((exercise) => {
            const currentData = getCurrentData();
            const keys = collectExerciseKeysForWorkoutExercise(currentDate, exercise, {
              isGymMode,
              workoutIsGymMode: workout.isGymMode
            });
            const readKey = resolveBestRepsStorageKey(currentData, keys) || keys[0];
            const isChecked = keys.some((k) => currentData.checkedExercises?.[k] === true);
            const reps =
              currentData.reps?.[readKey] !== undefined && currentData.reps?.[readKey] !== null
                ? String(currentData.reps[readKey])
                : '';
            const showWeightField = exerciseUsesExternalLoad(exercise);
            const weightStr = showWeightField
              ? resolveExerciseWeightDisplay(currentData, keys, readKey)
              : '';

            const coeffs = currentData.exerciseIntensityCoeffs ?? {};
            let loadCoeff = resolveExerciseIntensityCoeff(exercise, coeffs);
            if (
              exercise?.originalId != null &&
              String(exercise.originalId) !== String(exercise.id)
            ) {
              const b = resolveExerciseIntensityCoeff(
                { ...exercise, id: exercise.originalId },
                coeffs
              );
              const hasA =
                coeffs[String(exercise.id)] !== undefined &&
                coeffs[String(exercise.id)] !== null &&
                coeffs[String(exercise.id)] !== '';
              const hasB =
                coeffs[String(exercise.originalId)] !== undefined &&
                coeffs[String(exercise.originalId)] !== null &&
                coeffs[String(exercise.originalId)] !== '';
              if (hasB && !hasA) loadCoeff = b;
            }

            return (
              <div key={exercise.id} className="flex items-center space-x-3 p-4 bg-slate-700/50 rounded-lg border border-slate-600/50 hover:bg-slate-700/70 transition-all duration-200">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <div className="font-medium text-white shrink-0">{exercise.name}</div>
                    <span className="shrink-0 inline-flex items-center text-amber-300">
                      <LoadDifficultyStars coeff={loadCoeff} className="scale-95" />
                    </span>
                  </div>
                  <div className="text-sm text-gray-300">
                    {exercise.series}
                    {exercise.materiel && ` • ${exercise.materiel}`}
                    {exercise.notes && ` • ${exercise.notes}`}
                  </div>
                </div>
                
                <div className="flex items-center flex-wrap gap-2">
                  <Checkbox
                    checked={isChecked}
                    onChange={() => handleExerciseCheck(exercise.id, currentDate)}
                    className="text-green-400"
                    name={`exercise_${exercise.id}`}
                  />
                  {/* 🔴 FIX : Détecter l'unité de l'exercice pour afficher le bon placeholder */}
                  {(() => {
                    const exerciseUnit = detectExerciseUnit(exercise);
                    const inputPlaceholder = exerciseUnit?.unit === 'sec' ? 'Sec' : 
                                             exerciseUnit?.unit === 'min' ? 'Min' : 
                                             'Reps';
                    const inputLabel = exerciseUnit?.unit === 'sec' ? 'sec' : 
                                      exerciseUnit?.unit === 'min' ? 'min' : 
                                      'Reps';
                    
                    return (
                      <div className="flex items-center flex-wrap gap-2">
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            placeholder={inputPlaceholder}
                            value={reps}
                            onChange={(e) => updateLocalReps(exercise.id, e.target.value, currentDate)}
                            onFocus={() => handleInputFocus(exercise.id, exercise)}
                            className={`w-20 text-center ${isChecked ? 'bg-green-600/20 border-green-500 text-green-300' : 'bg-slate-800 border-slate-600 text-white'}`}
                            size="sm"
                          />
                          <span className="text-slate-400 text-xs min-w-[35px]">
                            {inputLabel}
                          </span>
                        </div>
                        {showWeightField && (
                          <div className="flex items-center gap-1">
                            <Input
                              type="text"
                              inputMode="decimal"
                              placeholder={t('today.exercises.weightPlaceholder')}
                              value={weightStr}
                              onChange={(e) =>
                                updateLocalExerciseWeight(exercise.id, e.target.value, currentDate)
                              }
                              onFocus={() => handleWeightInputFocus(exercise.id, exercise)}
                              className={`w-[4.5rem] text-center ${isChecked ? 'bg-green-600/20 border-green-500 text-green-300' : 'bg-slate-800 border-slate-600 text-white'}`}
                              size="sm"
                            />
                            <span className="text-slate-400 text-xs min-w-[28px]">
                              {t('today.exercises.weightUnit')}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  {isChecked && (
                    <div className="text-green-400 text-sm font-medium">✓ {t('today.exercises.completed')}</div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedExercise(exercise);
                      setShowExerciseVariations(true);
                    }}
                    className="gradient-button-premium gradient-button-premium-sm gradient-button-premium-variant rounded-lg flex items-center gap-2"
                  >
                    <Zap className="w-4 h-4" />
                  </button>
                  {/* ✅ NOUVEAU : Bouton pour supprimer l'exercice pour aujourd'hui */}
                  <button
                    type="button"
                    onClick={() => handleSuppressExercise(exercise.id)}
                    className="gradient-button-premium gradient-button-premium-sm rounded-lg flex items-center gap-2"
                    title={t('today.exercises.suppressTitle')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* ✅ NOUVEAU : Section Exercices Exceptionnels */}
          {additionalExercises.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-600/50">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <span className="text-yellow-400">⭐</span>
                  {t('today.exercises.exceptionalTitle', 'Exercices Exceptionnels')}
                  {exercisesMetadata.additionalCount > 0 && (
                    <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full">
                      {exercisesMetadata.additionalCount}
                    </span>
                  )}
                </h4>
              </div>
              <div className="space-y-3">
                {additionalExercises.map((exercise) => {
                  const isCompleted = exercise.completed || false;
                  
                  return (
                    <div 
                      key={exercise.id} 
                      className="flex items-center space-x-3 p-4 bg-gradient-to-r from-yellow-700/20 to-orange-700/20 rounded-lg border border-yellow-500/30 hover:from-yellow-700/30 hover:to-orange-700/30 transition-all duration-200"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-white flex items-center gap-2">
                          {exercise.name}
                          <span className="text-xs bg-yellow-500/30 text-yellow-200 px-2 py-0.5 rounded-full">
                            {t('today.exercises.exceptional', 'Exceptionnel')}
                          </span>
                        </div>
                        <div className="text-sm text-gray-300 mt-1">
                          {exercise.type === 'reps' ? (
                            <>
                              {exercise.series} {t('today.exercises.series')}
                              {exercise.repsPerSeries && exercise.repsPerSeries.length > 0 && (
                                <span className="ml-2">
                                  ({exercise.repsPerSeries.join(' + ')} {t('today.exercises.reps')})
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              {exercise.duration ? `${Math.floor(exercise.duration / 60)}min ${exercise.duration % 60}s` : t('today.exercises.duration')}
                            </>
                          )}
                          {exercise.materiel && ` • ${exercise.materiel}`}
                          {exercise.notes && ` • ${exercise.notes}`}
                        </div>
                        {exercise.completed && (
                          <div className="text-xs text-green-300 mt-1">
                            {exercise.type === 'reps' && exercise.totalReps ? (
                              t('today.exercises.completedWithReps', { reps: exercise.totalReps })
                            ) : exercise.type === 'duration' && exercise.actualDuration ? (
                              t('today.exercises.completedWithDuration', { 
                                minutes: Math.floor(exercise.actualDuration / 60), 
                                seconds: exercise.actualDuration % 60 
                              })
                            ) : (
                              t('today.exercises.completedSimple')
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={isCompleted}
                          onChange={() => {
                            if (!isCompleted) {
                              // Compléter l'exercice
                              if (exercise.type === 'reps') {
                                handleExceptionalExerciseComplete(exercise.id, exercise.repsPerSeries);
                              } else {
                                handleExceptionalExerciseComplete(exercise.id, null, exercise.duration);
                              }
                            } else {
                              // Décocher (non implémenté pour l'instant, mais prévu)
                              console.log('Décocher exercice exceptionnel non encore implémenté');
                            }
                          }}
                          className="text-yellow-400"
                          name={`exceptional_${exercise.id}`}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveExceptionalExercise(exercise.id)}
                          className="gradient-button-premium gradient-button-premium-sm rounded-lg flex items-center gap-2"
                          title={t('today.exercises.removeExceptionalTitle')}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

            {/* ✅ NOUVEAU : Bouton pour ajouter un exercice exceptionnel */}
            <div className="mt-4 pt-4 border-t border-slate-600/50">
              <button
                type="button"
                onClick={() => setShowAddExceptionalModal(true)}
                className="gradient-button-premium gradient-button-premium-md rounded-lg w-full flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {t('today.exercises.addExceptional')}
              </button>
            </div>
            
            {/* Activités complémentaires */}
          {workout.complementaryActivity && (
            <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-700/30 to-blue-700/30 rounded-lg border border-purple-500/50 hover:from-purple-700/40 hover:to-blue-700/40 transition-all duration-200">
              <div className="flex-1">
                <div className="font-medium text-white flex items-center gap-2">
                  {workout.complementaryActivity.name}
                  <span className="text-xs bg-purple-500/30 text-purple-200 px-2 py-1 rounded-full">
                    {workout.complementaryActivity.type}
                  </span>
                </div>
                <div className="text-sm text-gray-300">
                  {workout.complementaryActivity.duration} min • {workout.complementaryActivity.timeSlot}
                </div>
                <div className="text-xs text-purple-200 mt-1">
                  {workout.complementaryActivity.benefits.join(' • ')}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={getCurrentData().checkedExercises[`${dateStr}_complementary_${workout.complementaryActivity.name.toLowerCase()}`] || false}
                  onChange={() => handleExerciseCheck(`complementary_${workout.complementaryActivity.name.toLowerCase()}`, currentDate)}
                  className="text-purple-400"
                  name={`complementary_${workout.complementaryActivity.name.toLowerCase()}`}
                />
                
                {/* Champ de saisie pour les minutes */}
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    placeholder={t('today.exercises.minutes')}
                    value={getCurrentData().reps[`${dateStr}_complementary_${workout.complementaryActivity.name.toLowerCase()}_minutes`] || ''}
                    onChange={(e) => updateReps(`complementary_${workout.complementaryActivity.name.toLowerCase()}_minutes`, e.target.value, currentDate)}
                    onFocus={() => handleInputFocus(`complementary_${workout.complementaryActivity.name.toLowerCase()}_minutes`, { series: `1×${workout.complementaryActivity.duration}min` })}
                    className="w-16 text-center"
                    min="0"
                    max="300"
                  />
                  <span className="text-purple-300 text-sm font-medium">{t('today.exercises.minutesLabel')}</span>
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    setSelectedExercise(workout.complementaryActivity);
                    setShowExerciseVariations(true);
                  }}
                  className="gradient-button-premium gradient-button-premium-sm gradient-button-premium-variant rounded-lg flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          </div>
        )}

        {/* Boutons de sauvegarde */}
        {hasUnsavedExercises && (
          <div className="mt-6 pt-4 border-t border-slate-600/50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-yellow-400 flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                {t('today.exercises.unsavedChanges')}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleDiscardExercises}
                  className="gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  {t('today.exercises.discard')}
                </button>
                <button
                  type="button"
                  onClick={handleSaveExercises}
                  className="gradient-button-premium gradient-button-premium-md rounded-lg flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {t('today.exercises.save')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Étirements - Afficher seulement s'il y a des étirements avec contenu */}
      {hasStretchesContent && (
        <div className="bg-slate-800/80 backdrop-blur-sm p-6 rounded-lg shadow-xl border border-slate-700">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-purple-400">🧘‍♂️</span>
            {t('today.stretches.titleOfDay')}
          </h3>
          <div className="space-y-4">
            {Object.entries(workout.etirements).map(([moment, description]) => {
              // Traduire le moment (Matin, Midi, Soir)
              const momentKey = moment.toLowerCase();
              const translatedMoment = momentKey === 'matin' ? t('today.stretchMoments.matin') :
                                      momentKey === 'midi' ? t('today.stretchMoments.midi') :
                                      momentKey === 'soir' ? t('today.stretchMoments.soir') :
                                      moment;
              
              return (
              <div key={moment} className="border-l-4 border-purple-500/50 pl-4 bg-slate-700/30 rounded-r-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-white capitalize flex items-center gap-2">
                    <span className="text-purple-400">•</span>
                    {translatedMoment}
                  </h4>
                  <label className="flex items-center">
                    <Checkbox
                    checked={data.checkedStretches[`${dateStr}_${moment}`] || false}
                    onChange={() => toggleEtirement(moment, currentDate)}
                    className="w-5 h-5"
                  />
                  </label>
                </div>
                <p className="text-sm text-gray-300">{description}</p>
              </div>
              );
            })}
          </div>

          {/* Boutons de sauvegarde */}
          {hasUnsavedStretches && (
            <div className="mt-6 pt-4 border-t border-slate-600/50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-yellow-400 flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  {t('today.exercises.unsavedChanges')}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleDiscardStretches}
                    className="gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    {t('today.exercises.discard')}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveStretches}
                    className="gradient-button-premium gradient-button-premium-md rounded-lg flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {t('today.stretches.save')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}



      {/* Sessions d'endurance du jour */}
      {(() => {
        const sessions = normalizedEndurance.sessions || {};
        const todayEnduranceSessions = [];
        
        // ✅ PHASE 1 : Utiliser la fonction centralisée depuis calendarUtils
        // isMockSession remplacé par isMockEnduranceSession (importée)
        
        // Collecter toutes les sessions d'endurance du jour (FILTRER LES MOCK)
        Object.entries(sessions).forEach(([activityType, activitySessions]) => {
          if (Array.isArray(activitySessions)) {
            activitySessions.forEach(session => {
              if (session.date === dateStr) {
                // ✅ PHASE 1 : Filtrer les sessions mock (fonction centralisée)
                if (!isMockEnduranceSession(session)) {
                  todayEnduranceSessions.push({
                    ...session,
                    activityType,
                    activityName: {
                      boxing: t('today.endurance.activities.boxing'),
                      pushups: t('today.endurance.activities.pushups'),
                      swimming: t('today.endurance.activities.swimming'),
                      jumprope: t('today.endurance.activities.jumprope'),
                      running: t('today.endurance.activities.running')
                    }[activityType] || activityType
                  });
                }
              }
            });
          }
        });
        
        if (todayEnduranceSessions.length === 0) return null;
        
        return (
          <Card className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/20">
            <Card.Header>
              <Card.Title className="flex items-center text-orange-200">
                <Zap className="mr-2" size={20} />
                {t('today.endurance.sessionsTitle')}
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-3">
                {todayEnduranceSessions.map((session, index) => (
                  <div key={index} className="bg-orange-700/20 rounded-lg p-3 border border-orange-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-orange-200">{session.activityName}</h4>
                      <span className="text-orange-300 text-sm">{session.time}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      {session.count && (
                        <div className="text-center">
                          <div className="text-orange-200 font-bold">{session.count}</div>
                          <div className="text-orange-300">{t('today.endurance.repetitions')}</div>
                        </div>
                      )}
                      {session.duration && (
                        <div className="text-center">
                          <div className="text-orange-200 font-bold">{session.duration}min</div>
                          <div className="text-orange-300">{t('today.endurance.duration')}</div>
                        </div>
                      )}
                      {session.distance && (
                        <div className="text-center">
                          <div className="text-orange-200 font-bold">{session.distance}m</div>
                          <div className="text-orange-300">{t('today.endurance.distance')}</div>
                        </div>
                      )}
                      {session.jumps && (
                        <div className="text-center">
                          <div className="text-orange-200 font-bold">{session.jumps}</div>
                          <div className="text-orange-300">{t('today.endurance.jumps')}</div>
                        </div>
                      )}
                    </div>
                    {session.notes && (
                      <div className="mt-2 text-orange-300 text-sm italic">
                        "{session.notes}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card.Content>
          </Card>
        );
      })()}

      {/* Section des défis actifs */}
      {(() => {
        const activeChallenges = getActiveChallenges();
        if (activeChallenges.length === 0) return null;
        
        return (
          <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
            <Card.Header>
              <Card.Title className="flex items-center text-purple-200">
                <Award className="mr-2" size={20} />
                {t('today.challenges.title')} ({activeChallenges.length})
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                {activeChallenges.map(challenge => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    onComplete={handleChallengeComplete}
                  />
                ))}
              </div>
            </Card.Content>
          </Card>
        );
      })()}

      {/* Bouton de feedback de session */}
      <div className="text-center">
        <button
          type="button"
          onClick={handleSessionFeedback}
          className="gradient-button-premium gradient-button-premium-lg rounded-lg flex items-center justify-center gap-2 mx-auto"
        >
          <MessageSquare className="w-5 h-5" />
          {t('today.sessionFeedback.button')}
        </button>
      </div>

      {/* ✅ NOUVEAU : Modal d'ajout d'exercice exceptionnel */}
      <AddExceptionalExerciseModal
        isOpen={showAddExceptionalModal}
        onClose={() => setShowAddExceptionalModal(false)}
      />
      </div>
    </div>
  );
};

export default TodayTab;