import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Play, Square, CheckCircle, Clock, Target, Flame, Zap, MessageSquare, Save, X, Award, Plus, Trash2, BarChart3, PenLine, Scale } from 'lucide-react';
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
import { shouldExcludeStoredGarminRunningSession } from '../../utils/garminRunningLaps';
import DayJustificationButton from './TodayTab/components/DayJustificationButton.jsx';
import { isDayWithoutActivity } from '../../utils/dayJustificationUtils';
import { useTranslation } from '../../utils/translations';
import { loadEnduranceData as loadEnduranceDataService } from '../../services/endurance/enduranceDataService';
import { useNutritionData } from '../../hooks/useNutritionData';
import {
  collectExerciseKeysForWorkoutExercise,
  generateSmartExerciseKey,
  resolveBestRepsStorageKey,
  findLatestExerciseWeightValue
} from '../../utils/exerciseKeyGenerator';
import { normalizeStretchSlots, countStretchItems } from '../../utils/stretchUtils';
import StretchList from './TodayTab/components/StretchList';
import CircuitsTodaySection from './TodayTab/components/CircuitsTodaySection.jsx';
import { intensityCoeffToStarCount, resolveExerciseIntensityCoeff } from '../../utils/trainingLoadUtils';
import { exerciseUsesExternalLoad } from '../../utils/programUtils';
import LoadDifficultyStars from '../sport/LoadDifficultyStars';
import SessionEffortBlock from './TodayTab/components/SessionEffortBlock.jsx';
import { computeTodaySessionComplexity } from '../../utils/todaySessionScore';
import RecordPerformanceModal from '../sport/performance/RecordPerformanceModal';
import { applyPerformanceEntryToData } from '../../utils/exercisePerformanceUtils';
import {
  exerciseIsDumbbellEquipment,
  inferDefaultSetCount,
  computeVolumeKgForWorkoutKey
} from '../../utils/exerciseLoadVolume';
import { collectWorkoutLoadSubsetForDate } from '../../utils/workoutLoadPersistence';
import {
  getExerciseSeriesOverrides,
  mergeSeriesIntoProgramExercises,
  normalizeSeriesInputForStorage
} from '../../utils/dailyVariationSeriesOverrides';
import { findBankFoodByIdWithOverrides, getFoodUnitHints } from '../../data/nutritionFoodBank';

const PENDING_PROGRESS_SECTION_KEY = 'momentum.pendingProgressSection';
const SPOON_TABLESPOON_ML = 15;
const SPOON_TEASPOON_ML = 5;
const SPOON_TABLESPOON_G = 12;
const SPOON_TEASPOON_G = 4;

const unitLabel = (u) => {
  const map = {
    g: 'grammes',
    ml: 'millilitres',
    piece: 'pièce',
    tbsp: 'c. à soupe',
    tsp: 'c. à café'
  };
  return map[u] || u;
};

const unitToBaseAmount = (food, unit, quantity) => {
  const q = Number(quantity);
  if (!food || !Number.isFinite(q)) return null;
  if (unit === 'piece' && food.piece?.grams) return q * food.piece.grams;
  if (unit === 'tbsp') return q * (food.referenceUnit === 'ml' ? SPOON_TABLESPOON_ML : SPOON_TABLESPOON_G);
  if (unit === 'tsp') return q * (food.referenceUnit === 'ml' ? SPOON_TEASPOON_ML : SPOON_TEASPOON_G);
  return q;
};

const baseToUnitAmount = (food, unit, baseAmount) => {
  const b = Number(baseAmount);
  if (!food || !Number.isFinite(b)) return '';
  if (unit === 'piece' && food.piece?.grams) return Math.round((b / food.piece.grams) * 100) / 100;
  if (unit === 'tbsp') {
    const d = food.referenceUnit === 'ml' ? SPOON_TABLESPOON_ML : SPOON_TABLESPOON_G;
    return Math.round((b / d) * 100) / 100;
  }
  if (unit === 'tsp') {
    const d = food.referenceUnit === 'ml' ? SPOON_TEASPOON_ML : SPOON_TEASPOON_G;
    return Math.round((b / d) * 100) / 100;
  }
  return Math.round(b * 10) / 10;
};

/** Résout un exo du programme en appliquant les surcharges « séries » du jour (dailyVariations). */
function resolveProgramExerciseFromWorkout(workout, dailyVariations, dateStr, exerciseId) {
  const list = workout?.exercices || [];
  const ov = getExerciseSeriesOverrides(dailyVariations, dateStr);
  return mergeSeriesIntoProgramExercises(list, ov).find((ex) => ex.id === exerciseId) || null;
}

const resolveExerciseWeightDisplay = (currentData, keys, readKey) => {
  const w = currentData.exerciseWeights || {};
  const ordered = [readKey, ...keys.filter((k) => k !== readKey)];
  for (const k of ordered) {
    const v = w[k];
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v);
  }
  return '';
};

const resolveExerciseSetWeightsDisplay = (currentData, keys, readKey) => {
  const w = currentData.exerciseSetWeights || {};
  const ordered = [readKey, ...keys.filter((k) => k !== readKey)];
  for (const k of ordered) {
    const v = w[k];
    if (Array.isArray(v) && v.some((x) => x !== undefined && x !== null && String(x).trim() !== '')) {
      return v;
    }
  }
  return null;
};

const resolveExerciseWeightPerArm = (currentData, keys, readKey) => {
  const w = currentData.exerciseWeightPerArm || {};
  const ordered = [readKey, ...keys.filter((k) => k !== readKey)];
  return ordered.some((k) => w[k] === true);
};

/** Même logique que `useExerciseTracking` / fiche : étoiles séance par clé jour+exo. */
function pickExerciseSessionEffortStars(currentData, keys, primaryKey) {
  const map = currentData?.exerciseSessionEffortStars || {};
  for (const key of keys) {
    const n = Number(map[key]);
    if (Number.isFinite(n) && n >= 1 && n <= 5) return Math.round(n);
  }
  const p = Number(map[primaryKey]);
  if (Number.isFinite(p) && p >= 1 && p <= 5) return Math.round(p);
  return null;
}

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
    markExceptionalExerciseComplete,
    updateExerciseSeriesOverrideForDate,
    setActiveTab,
    activeProgram,
    getEffectiveRestDayForDate,
    applyWeeklyRestDaySwap
  } = useWorkout();
  
  const { showSuccess, showError } = useToast();
  const t = useTranslation();
  const nutritionData = useNutritionData();
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [activeNutritionProgram, setActiveNutritionProgram] = useState(null);

  const maybeApplyRestDaySwapBeforeSave = useCallback(async () => {
    if (!activeProgram || !workoutDayOverride) return false;
    const todayName = getDayName(currentDate);
    const effectiveRestDay = getEffectiveRestDayForDate(currentDate, activeProgram, getCurrentData());
    if (!effectiveRestDay || todayName !== effectiveRestDay) return false;
    if (workoutDayOverride === effectiveRestDay) return false;

    const confirmEnabled = getCurrentData()?.trainingPrefs?.swapRestConfirmEnabled !== false;
    if (confirmEnabled) {
      const ok = window.confirm(
        `Tu es en jour de repos (${effectiveRestDay}) mais tu as suivi la séance de ${workoutDayOverride}. Voulez-vous déplacer le repos de cette semaine sur ${workoutDayOverride} ?`
      );
      if (!ok) return false;
    }

    const swapped = await applyWeeklyRestDaySwap({
      programId: activeProgram.id,
      date: currentDate,
      fromDay: effectiveRestDay,
      toDay: workoutDayOverride
    });
    if (swapped) {
      showSuccess(`Jour de repos déplacé vers ${workoutDayOverride} pour cette semaine.`);
    }
    return swapped;
  }, [
    activeProgram,
    workoutDayOverride,
    currentDate,
    getDayName,
    getEffectiveRestDayForDate,
    getCurrentData,
    applyWeeklyRestDaySwap,
    showSuccess
  ]);

  const normalizedEndurance = useMemo(() => {
    try {
      const { sessions, challenges } = loadEnduranceDataService(data?.enduranceData || {});
      return { sessions, challenges };
    } catch (error) {
      console.error('[TodayTab] Erreur normalisation endurance:', error);
      return { sessions: data?.enduranceData?.sessions || {}, challenges: data?.enduranceData?.challenges || [] };
    }
  }, [data?.enduranceData]);

  const handleSavePerformanceFromToday = async (payload) => {
    const currentData = getCurrentData();
    const next = applyPerformanceEntryToData(
      currentData,
      {
        ...payload,
        source: 'today',
        recordedAt: new Date().toISOString()
      },
      { dateStr: getDateStr(currentDate), addToTodayReps: payload.addToTodayReps }
    );
    await updateData(next);
    setShowPerformanceModal(false);
    showSuccess('Max enregistré');
  };

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
    const exercise = resolveProgramExerciseFromWorkout(workout, currentData.dailyVariations, dateStr, exerciseId);
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
        },
        exerciseWeightPerArm: (() => {
          const o = { ...(currentData.exerciseWeightPerArm || {}) };
          if (isCurrentlyChecked) delete o[fallbackKey];
          return o;
        })(),
        exerciseSetWeights: (() => {
          const o = { ...(currentData.exerciseSetWeights || {}) };
          if (isCurrentlyChecked) delete o[fallbackKey];
          return o;
        })()
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

    const stripKeys = (checkedObj, repsObj, weightsObj, perArmObj, setWObj) => {
      const nextChecked = { ...checkedObj };
      const nextReps = { ...repsObj };
      const nextWeights = { ...weightsObj };
      const nextPerArm = { ...(perArmObj || {}) };
      const nextSetW = { ...(setWObj || {}) };
      keys.forEach((k) => {
        delete nextChecked[k];
        delete nextReps[k];
        delete nextWeights[k];
        delete nextPerArm[k];
        delete nextSetW[k];
      });
      return { nextChecked, nextReps, nextWeights, nextPerArm, nextSetW };
    };

    if (isCurrentlyChecked) {
      const { nextChecked, nextReps, nextWeights, nextPerArm, nextSetW } = stripKeys(
        currentData.checkedExercises,
        currentData.reps,
        currentData.exerciseWeights || {},
        currentData.exerciseWeightPerArm || {},
        currentData.exerciseSetWeights || {}
      );
      updateTempExerciseData({
        ...currentData,
        checkedExercises: nextChecked,
        reps: nextReps,
        exerciseWeights: nextWeights,
        exerciseWeightPerArm: nextPerArm,
        exerciseSetWeights: nextSetW
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
      const { nextChecked, nextReps, nextWeights, nextPerArm, nextSetW } = stripKeys(
        currentData.checkedExercises,
        currentData.reps,
        currentData.exerciseWeights || {},
        currentData.exerciseWeightPerArm || {},
        currentData.exerciseSetWeights || {}
      );
      nextChecked[primaryKey] = true;
      nextReps[primaryKey] = autoReps != null ? autoReps.toString() : '';
      const prevKeyForWeight = resolveBestRepsStorageKey(currentData, keys);
      nextWeights[primaryKey] =
        prevKeyForWeight && currentData.exerciseWeights?.[prevKeyForWeight] != null
          ? String(currentData.exerciseWeights[prevKeyForWeight])
          : '';
      if (prevKeyForWeight && currentData.exerciseWeightPerArm?.[prevKeyForWeight] === true) {
        nextPerArm[primaryKey] = true;
      }
      if (prevKeyForWeight && Array.isArray(currentData.exerciseSetWeights?.[prevKeyForWeight])) {
        nextSetW[primaryKey] = [...currentData.exerciseSetWeights[prevKeyForWeight]];
      }
      updateTempExerciseData({
        ...currentData,
        checkedExercises: nextChecked,
        reps: nextReps,
        exerciseWeights: nextWeights,
        exerciseWeightPerArm: nextPerArm,
        exerciseSetWeights: nextSetW
      });
      return;
    }

    const { nextChecked, nextReps, nextWeights, nextPerArm, nextSetW } = stripKeys(
      currentData.checkedExercises,
      currentData.reps,
      currentData.exerciseWeights || {},
      currentData.exerciseWeightPerArm || {},
      currentData.exerciseSetWeights || {}
    );
    nextChecked[primaryKey] = true;
    const prevKey = resolveBestRepsStorageKey(currentData, keys);
    nextReps[primaryKey] =
      prevKey && currentData.reps?.[prevKey] != null ? String(currentData.reps[prevKey]) : '';
    nextWeights[primaryKey] =
      prevKey && currentData.exerciseWeights?.[prevKey] != null
        ? String(currentData.exerciseWeights[prevKey])
        : '';
    if (prevKey && currentData.exerciseWeightPerArm?.[prevKey] === true) {
      nextPerArm[primaryKey] = true;
    }
    if (prevKey && Array.isArray(currentData.exerciseSetWeights?.[prevKey])) {
      nextSetW[primaryKey] = [...currentData.exerciseSetWeights[prevKey]];
    }
    updateTempExerciseData({
      ...currentData,
      checkedExercises: nextChecked,
      reps: nextReps,
      exerciseWeights: nextWeights,
      exerciseWeightPerArm: nextPerArm,
      exerciseSetWeights: nextSetW
    });
  };

  const updateLocalReps = (exerciseId, reps, date) => {
    const currentData = getCurrentData();
    const dateStr = getDateStr(date);
    const workout = getTodayWorkout(date, isGymMode);
    const exercise = resolveProgramExerciseFromWorkout(workout, currentData.dailyVariations, dateStr, exerciseId);
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
    const exercise = resolveProgramExerciseFromWorkout(workout, currentData.dailyVariations, dateStr, exerciseId);
    const key = exercise
      ? generateSmartExerciseKey(date, exercise.id, {
          isGymMode,
          workoutIsGymMode: workout?.isGymMode,
          weekVariant: getAutoWeekVariant(date)
        })
      : `${dateStr}_${exerciseId}`;

    const nextSetW = { ...(currentData.exerciseSetWeights || {}) };
    delete nextSetW[key];
    updateTempExerciseData({
      ...currentData,
      exerciseWeights: {
        ...(currentData.exerciseWeights || {}),
        [key]: weightStr
      },
      exerciseSetWeights: nextSetW
    });
  };

  const getExercisePrimaryStorageKey = (exerciseId, date) => {
    const dateStr = getDateStr(date);
    const workout = getTodayWorkout(date, isGymMode);
    const snapshot = getCurrentData();
    const exercise = resolveProgramExerciseFromWorkout(workout, snapshot.dailyVariations, dateStr, exerciseId);
    return exercise
      ? generateSmartExerciseKey(date, exercise.id, {
          isGymMode,
          workoutIsGymMode: workout?.isGymMode,
          weekVariant: getAutoWeekVariant(date)
        })
      : `${dateStr}_${exerciseId}`;
  };

  const updateLocalExerciseWeightPerArm = (exerciseId, checked, date) => {
    const currentData = getCurrentData();
    const key = getExercisePrimaryStorageKey(exerciseId, date);
    const next = { ...(currentData.exerciseWeightPerArm || {}) };
    if (checked) next[key] = true;
    else delete next[key];
    updateTempExerciseData({ ...currentData, exerciseWeightPerArm: next });
  };

  const updateExerciseSetWeightAtIndex = (exerciseId, setIndex, value, date, exercise) => {
    const currentData = getCurrentData();
    const key = getExercisePrimaryStorageKey(exerciseId, date);
    const n = inferDefaultSetCount(exercise, 0);
    const count = Math.max(1, n);
    const prevRow =
      (Array.isArray(currentData.exerciseSetWeights?.[key]) &&
        currentData.exerciseSetWeights[key].slice()) ||
      Array.from({ length: count }, () => String(currentData.exerciseWeights?.[key] || '').trim());
    while (prevRow.length < count) prevRow.push(String(currentData.exerciseWeights?.[key] || '').trim());
    prevRow[setIndex] = value;
    updateTempExerciseData({
      ...currentData,
      exerciseSetWeights: { ...(currentData.exerciseSetWeights || {}), [key]: prevRow }
    });
  };

  const clearExerciseSetWeightsForExercise = (exerciseId, date) => {
    const currentData = getCurrentData();
    const key = getExercisePrimaryStorageKey(exerciseId, date);
    const next = { ...(currentData.exerciseSetWeights || {}) };
    delete next[key];
    updateTempExerciseData({ ...currentData, exerciseSetWeights: next });
  };

  const initExerciseSetWeightsFromSeries = (exerciseId, date, exercise) => {
    const currentData = getCurrentData();
    const key = getExercisePrimaryStorageKey(exerciseId, date);
    const n = inferDefaultSetCount(exercise, 0);
    const count = Math.max(1, n);
    const base = String(currentData.exerciseWeights?.[key] || '').trim();
    const row = Array.from({ length: count }, () => base);
    updateTempExerciseData({
      ...currentData,
      exerciseSetWeights: { ...(currentData.exerciseSetWeights || {}), [key]: row }
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
      await maybeApplyRestDaySwapBeforeSave();
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

  const updateSessionEffortStarsToday = useCallback(
    (exercise, starCount) => {
      const currentData = getCurrentData();
      const keyOpts = { isGymMode, workoutIsGymMode: workout?.isGymMode };
      const primaryKey = generateSmartExerciseKey(currentDate, exercise.id, keyOpts);
      const keys = collectExerciseKeysForWorkoutExercise(currentDate, exercise, keyOpts);
      const next = { ...(currentData.exerciseSessionEffortStars || {}) };
      keys.forEach((k) => {
        if (k !== primaryKey) delete next[k];
      });
      const n = Math.round(Number(starCount));
      if (!Number.isFinite(n) || n < 1 || n > 5) delete next[primaryKey];
      else next[primaryKey] = n;
      updateTempExerciseData({
        ...currentData,
        exerciseSessionEffortStars: next
      });
    },
    [getCurrentData, updateTempExerciseData, currentDate, isGymMode, workout?.isGymMode]
  );

  useEffect(() => {
    let mounted = true;
    const loadActiveNutrition = async () => {
      if (!nutritionData?.dbReady) {
        if (mounted) setActiveNutritionProgram(null);
        return;
      }
      try {
        const p = await nutritionData.getActiveProgram();
        if (mounted) setActiveNutritionProgram(p || null);
      } catch {
        if (mounted) setActiveNutritionProgram(null);
      }
    };
    loadActiveNutrition();
    return () => {
      mounted = false;
    };
  }, [nutritionData, nutritionData?.dbReady, dateStr]);

  const nutritionPlannedChecks = useMemo(() => {
    return getCurrentData()?.nutritionPlanChecks?.[dateStr] || {};
  }, [getCurrentData, dateStr, data?.nutritionPlanChecks]);

  const setPlannedFoodCheck = useCallback(async (slot, foodId, patch) => {
    const cur = getCurrentData();
    const checks = cur.nutritionPlanChecks || {};
    const dayChecks = checks[dateStr] || {};
    const slotChecks = dayChecks[slot] || {};
    const prev = slotChecks[foodId] || {};
    const next = {
      ...cur,
      nutritionPlanChecks: {
        ...checks,
        [dateStr]: {
          ...dayChecks,
          [slot]: {
            ...slotChecks,
            [foodId]: {
              ...prev,
              ...patch
            }
          }
        }
      }
    };
    await updateData(next);
  }, [getCurrentData, dateStr, updateData]);

  const weighInReminderDue = useMemo(() => {
    const cfg = data?.bodyTrackingPrefs?.weeklyWeighInDay;
    if (cfg === undefined || cfg === null) return false;
    const day = new Date(currentDate).getDay();
    if (day !== cfg) return false;
    const key = dateStr.slice(0, 10);
    const entries = getCurrentData()?.progressEntries || [];
    const hasToday = entries.some(
      (e) => e && e.type === 'impedance' && e.date && String(e.date).slice(0, 10) === key
    );
    return !hasToday;
  }, [data?.bodyTrackingPrefs?.weeklyWeighInDay, currentDate, dateStr, getCurrentData, data?.progressEntries]);

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

  // ✅ État pour modal d'ajout d'exercice exceptionnel
  const [showAddExceptionalModal, setShowAddExceptionalModal] = useState(false);
  /** Modal « adapter le prévu du jour » (séries × reps) pour un exo du programme */
  const [seriesAdaptDialog, setSeriesAdaptDialog] = useState(null);

  /** Conserver strictement l'ordre du programme pour éviter toute confusion dans Aujourd'hui. */
  const orderedProgramExercises = useMemo(() => programExercises || [], [programExercises]);

  const todaySessionComplexity = useMemo(
    () => computeTodaySessionComplexity(currentDate, workout, getCurrentData(), isGymMode),
    [currentDate, workout, isGymMode, getCurrentData, data, hasUnsavedExercises]
  );

  const handleSessionFeedback = () => {
    const seriesOverridesToday = getExerciseSeriesOverrides(
      getCurrentData()?.dailyVariations,
      dateStr
    );
    const programExercisesMerged = mergeSeriesIntoProgramExercises(
      workout?.exercices || [],
      seriesOverridesToday
    );

    // Calculer la durée réelle basée sur les exercices accomplis
    const calculateSessionDuration = () => {
      const sessionData = getCurrentData();
      const completedExercises = programExercisesMerged.filter((exercise) => {
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

    const snapshot = getCurrentData();

    const buildProgramExerciseRow = (exercise) => {
      const keys = collectExerciseKeysForWorkoutExercise(currentDate, exercise, {
        isGymMode,
        workoutIsGymMode: workout.isGymMode
      });
      const done = keys.some((k) => snapshot.checkedExercises?.[k] === true);
      if (!done) return null;
      const finalKey = resolveBestRepsStorageKey(snapshot, keys) || `${dateStr}_${exercise.id}`;
      const reps = parseInt(String(snapshot.reps?.[finalKey] ?? ''), 10) || 0;
      if (reps <= 0) return null;
      const vol = computeVolumeKgForWorkoutKey(finalKey, snapshot);
      return {
        ...exercise,
        completed: true,
        reps,
        storageKey: finalKey,
        weightEntered: resolveExerciseWeightDisplay(snapshot, keys, finalKey) || undefined,
        perArm: resolveExerciseWeightPerArm(snapshot, keys, finalKey),
        setWeights: resolveExerciseSetWeightsDisplay(snapshot, keys, finalKey),
        volumeKg: Math.round(vol * 10) / 10
      };
    };

    const programRows = programExercisesMerged.map(buildProgramExerciseRow).filter(Boolean);
    const complementaryRows =
      workout.complementaryActivity &&
      data.checkedExercises[`${dateStr}_complementary_${workout.complementaryActivity.name.toLowerCase()}`]
        ? [
            {
              id: `complementary_${workout.complementaryActivity.name.toLowerCase()}`,
              name: workout.complementaryActivity.name,
              completed: true,
              reps: 0,
              duration: workout.complementaryActivity.duration
            }
          ]
        : [];

    const todayData = {
      date: dateStr,
      exercises: [...programRows, ...complementaryRows],
      totalReps: programRows.reduce((total, ex) => total + (parseInt(ex.reps, 10) || 0), 0),
      estimatedDuration: Math.max(30, programExercisesMerged.length * 3),
      duration: calculateSessionDuration(),
      workoutLoadSnapshot: collectWorkoutLoadSubsetForDate(snapshot, dateStr)
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

  const openSeriesAdaptForExercise = (exercise) => {
    const raw = (workout.exercices || []).find((e) => e.id === exercise.id);
    setSeriesAdaptDialog({
      exerciseId: exercise.id,
      name: exercise.name || '',
      programSeries: String(raw?.series ?? '').trim(),
      draft: String(exercise.series ?? '').trim()
    });
  };

  const saveSeriesAdaptFromDialog = async () => {
    if (!seriesAdaptDialog) return;
    try {
      const normDraft = normalizeSeriesInputForStorage(seriesAdaptDialog.draft);
      const normProg = normalizeSeriesInputForStorage(seriesAdaptDialog.programSeries);
      const toStore = normDraft && normDraft !== normProg ? normDraft : '';
      await updateExerciseSeriesOverrideForDate(dateStr, seriesAdaptDialog.exerciseId, toStore);
      setSeriesAdaptDialog(null);
      showSuccess(
        toStore
          ? t('today.seriesAdapt.saved', 'Prévu du jour enregistré')
          : t('today.seriesAdapt.resetToast', 'Retour au prévu du programme')
      );
    } catch (err) {
      showError(err?.message || t('today.messages.errorMessage'));
    }
  };

  const resetSeriesAdaptFromDialog = async () => {
    if (!seriesAdaptDialog) return;
    try {
      await updateExerciseSeriesOverrideForDate(dateStr, seriesAdaptDialog.exerciseId, '');
      setSeriesAdaptDialog(null);
      showSuccess(t('today.seriesAdapt.resetToast', 'Retour au prévu du programme'));
    } catch (err) {
      showError(err?.message || t('today.messages.errorMessage'));
    }
  };

  // Détection robuste qui gère TOUS les formats historiques :
  //   - tableau ({ matin: [{...}], midi: [...], soir: [...] })  ← nouveau format
  //   - chaîne ({ matin: "...", midi: "..." })                  ← legacy
  //   - objet enrichi ({ matin: { instructions, ... } })        ← exporté/importé
  const normalizedTodayStretches = useMemo(
    () => normalizeStretchSlots(workout?.etirements, dayName),
    [workout?.etirements, dayName]
  );
  const hasStretchesContent = countStretchItems(normalizedTodayStretches) > 0;

  /** Jour sans exercices : n’afficher l’écran « jour de repos » plein écran que s’il n’y a pas non plus d’étirements prévus */
  if ((!workout.exercices || workout.exercices.length === 0) && !hasStretchesContent) {
    const activeChallenges = getActiveChallenges();
    const currentData = getCurrentData();
    const hasNoActivity = isDayWithoutActivity(currentData, dateStr);
    
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="text-center py-12 bg-black rounded-xl border-2 border-[#0F4C5C]/70">
          <div className="text-teal-200/80 mb-4">
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
          <Card variant="sport">
            <Card.Header className="border-b border-[#0F4C5C]/40">
              <Card.Title className="flex items-center text-teal-200">
                <Award className="mr-2 text-teal-400" size={20} />
                {t('today.challenges.title')} ({activeChallenges.length})
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                {activeChallenges.map((challenge, idx) => (
                  <ChallengeCard
                    key={`rest-${challenge.id || challenge.title || 'challenge'}-${idx}`}
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
        {/* Workout Header */}
      <div className={`p-6 rounded-xl shadow-xl border-2 ${
        workout.focus?.includes('Repos')
          ? 'border-[#0F5C45]/60 bg-black'
          : 'border-[#0F4C5C]/70 bg-black'
      }`}>
        <h2 className="text-2xl font-bold text-white">{workout.name}</h2>
        <p className="text-sm text-gray-200 opacity-90 mt-1">{workout.focus}</p>
        {workout.duree ? (
          <p className="text-xs text-gray-300 mt-2">⏱️ {workout.duree}</p>
        ) : null}
        
        {/* Toggle Gym/Maison - seulement pour samedi et dimanche */}
        {hasGymVariants && (
          <div className="mt-4 flex items-center gap-3">
            <span className="text-sm text-gray-200">{t('today.workout.trainingMode')}</span>
            <div className="flex items-center bg-black/80 rounded-lg p-1 ring-1 ring-[#0F4C5C]/45">
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
              <span className="text-xs text-teal-200/80 bg-black/60 px-2 py-1 rounded border border-[#0F4C5C]/40">
                {t('today.workout.week', 'Semaine {{week}}', { week: currentWeekVariant })}
              </span>
            )}
          </div>
        )}
        {/* Choix d'afficher l'entraînement d'un autre jour (ex. faire lundi un vendredi) */}
        <div className="mt-4 pt-4 border-t border-[#0F4C5C]/40">
          <p className="text-xs text-teal-200/75 mb-2">{t('today.workout.useWorkoutOf', "Utiliser l'entraînement de :")}</p>
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
                      : 'bg-black text-teal-100/85 border border-[#0F4C5C]/50 hover:border-[#0F5C45]/55'
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

      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => setShowPerformanceModal(true)}
          className="rounded-lg border border-[#0F5C45]/55 bg-[#0F5C45]/30 px-4 py-2 text-sm text-white"
        >
          Enregistrer un max
        </button>
      </div>

      {workout?.exercices?.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border-2 border-[#0F5C45]/45 bg-black px-4 py-3 text-sm text-teal-100/90">
          <BarChart3 className="h-5 w-5 shrink-0 text-teal-400" />
          <div className="min-w-0 flex-1">
            <span className="font-medium text-white">{t('today.sessionScore.title')}</span>
            {todaySessionComplexity.score0to100 != null ? (
              <span className="ml-2 text-teal-200">
                {t('today.sessionScore.score', { score: todaySessionComplexity.score0to100 })}
              </span>
            ) : (
              <span className="ml-2 text-teal-700">{t('today.sessionScore.na')}</span>
            )}
            <span className="mx-2 text-teal-800">·</span>
            <span className="text-teal-200/80">
              {t('today.sessionScore.load', {
                done: todaySessionComplexity.completedLoad,
                ref: todaySessionComplexity.plannedLoadEstimate
              })}
            </span>
            <span className="mx-2 text-teal-800">·</span>
            <span className="text-teal-200/80">
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

      {/* Rappel pesée (jour configuré dans Impédancemètre) */}
      {weighInReminderDue && (
        <button
          type="button"
          onClick={() => {
            try {
              sessionStorage.setItem(PENDING_PROGRESS_SECTION_KEY, 'impedance');
            } catch {
              /* ignore */
            }
            setActiveTab?.('progress');
          }}
          className="mb-3 flex w-full items-start gap-3 rounded-xl border-2 border-amber-500/50 bg-amber-950/40 p-4 text-left transition hover:border-amber-400/70"
        >
          <Scale className="mt-0.5 h-8 w-8 shrink-0 text-amber-300" />
          <div>
            <div className="text-base font-semibold text-amber-100">
              {t('today.weighIn.title', 'Pèsée attendue')}
            </div>
            <p className="mt-1 text-sm text-amber-200/85">
              {t(
                'today.weighIn.hint',
                "Aujourd'hui est ton jour de mesure. Touche pour ouvrir Suivi corporel → Impédancemètre et enregistrer ta pesée."
              )}
            </p>
          </div>
        </button>
      )}

      {Array.isArray(activeNutritionProgram?.mealPlanPreferences?.generatedMealPlan) &&
      activeNutritionProgram.mealPlanPreferences.generatedMealPlan.length > 0 ? (
        <div className="mb-3 rounded-xl border-2 border-[#0F5C45]/45 bg-black p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="text-white font-semibold">
              Nutrition du jour - {activeNutritionProgram.name}
            </h3>
            {activeNutritionProgram.planProfile?.targetWeightKg ? (
              <span className="text-xs text-teal-200">
                Objectif : {activeNutritionProgram.planProfile.targetWeightKg} kg
              </span>
            ) : null}
          </div>
          <p className="text-xs text-teal-300/80 mb-3">
            Coche les aliments réalisés et ajuste la quantité. Tu peux choisir l’unité (g/ml/pièce/cuillère) selon l’aliment.
          </p>
          <div className="space-y-3">
            {activeNutritionProgram.mealPlanPreferences.generatedMealPlan.map((slot) => (
              <div key={slot.slot} className="rounded-lg border border-[#0F4C5C]/50 bg-black/70 p-3">
                <h4 className="text-sm font-medium text-teal-100 mb-2">{slot.label}</h4>
                <div className="space-y-2">
                  {(slot.foods || []).map((food) => {
                    const st = nutritionPlannedChecks?.[slot.slot]?.[food.foodId] || {};
                    const bank = findBankFoodByIdWithOverrides(food.foodId, data?.nutritionFoodOverrides);
                    const options = getFoodUnitHints(bank);
                    const defaultUnit = st.unit || (bank?.piece ? 'piece' : (bank?.referenceUnit || 'g'));
                    const selectedUnit = options.includes(defaultUnit) ? defaultUnit : options[0];
                    const baseAmount = st.baseAmount ?? st.grams ?? food.approximateGrams ?? '';
                    const shownAmount = st.amount ?? baseToUnitAmount(bank, selectedUnit, baseAmount);
                    return (
                      <div key={`${slot.slot}-${food.foodId}`} className="grid grid-cols-[auto,1fr,92px,120px] gap-2 items-center">
                        <input
                          type="checkbox"
                          checked={Boolean(st.checked)}
                          onChange={async (e) => {
                            await setPlannedFoodCheck(slot.slot, food.foodId, {
                              checked: e.target.checked,
                              unit: selectedUnit,
                              amount: shownAmount,
                              baseAmount,
                              grams: baseAmount,
                              updatedAt: new Date().toISOString()
                            });
                          }}
                          className="rounded border-[#0F4C5C]"
                        />
                        <div className="text-sm text-white truncate">
                          {food.name}
                        </div>
                        <select
                          value={selectedUnit}
                          onChange={async (e) => {
                            const nextUnit = e.target.value;
                            const nextShown = baseToUnitAmount(bank, nextUnit, baseAmount);
                            await setPlannedFoodCheck(slot.slot, food.foodId, {
                              checked: Boolean(st.checked),
                              unit: nextUnit,
                              amount: nextShown,
                              baseAmount,
                              grams: baseAmount,
                              updatedAt: new Date().toISOString()
                            });
                          }}
                          className="w-full rounded border border-[#0F4C5C]/55 bg-black px-2 py-1 text-teal-100 text-xs"
                        >
                          {options.map((u) => (
                            <option key={u} value={u}>
                              {unitLabel(u)}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={shownAmount}
                          onChange={async (e) => {
                            const v = e.target.value === '' ? '' : Number(e.target.value);
                            const nextBase = v === '' ? '' : unitToBaseAmount(bank, selectedUnit, v);
                            await setPlannedFoodCheck(slot.slot, food.foodId, {
                              checked: Boolean(st.checked),
                              unit: selectedUnit,
                              amount: v,
                              baseAmount: nextBase,
                              grams: nextBase,
                              updatedAt: new Date().toISOString()
                            });
                          }}
                          className="w-full rounded border border-[#0F4C5C]/55 bg-black px-2 py-1 text-teal-100 text-sm"
                          placeholder={selectedUnit === 'piece' ? 'nb' : selectedUnit}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-3 rounded-xl border border-[#0F4C5C]/55 bg-black/70 p-3 text-xs text-teal-200/80">
          Aucun plan repas généré actif pour aujourd'hui. Crée/active un programme nutritionnel avec plan journalier.
        </div>
      )}

      {/* Exercices */}
      <div className="bg-black p-6 rounded-xl shadow-xl border-2 border-[#0F4C5C]/70">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          {t('today.exercises.title')}
          {orderedProgramExercises.length > 0 && (
            <span className="text-sm text-teal-600">({orderedProgramExercises.length})</span>
          )}
        </h3>
        {orderedProgramExercises.length === 0 && additionalExercises.length === 0 ? (
          <div className="text-center py-8 text-teal-700">
            <p>{t('today.exercises.noExercises', 'Aucun exercice prévu pour aujourd\'hui')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* ✅ NOUVEAU : Exercices du programme (filtrés selon variations) */}
            {orderedProgramExercises.map((exercise) => {
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
            const setWeightsRow = showWeightField
              ? resolveExerciseSetWeightsDisplay(currentData, keys, readKey)
              : null;

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

            const exerciseUnit = detectExerciseUnit(exercise);
            const inputPlaceholder =
              exerciseUnit?.unit === 'sec' ? 'Sec' : exerciseUnit?.unit === 'min' ? 'Min' : 'Reps';
            const inputLabel =
              exerciseUnit?.unit === 'sec' ? 'sec' : exerciseUnit?.unit === 'min' ? 'min' : 'Reps';

            const primaryKeyForStars = generateSmartExerciseKey(currentDate, exercise.id, {
              isGymMode,
              workoutIsGymMode: workout.isGymMode
            });
            const sessionEffortStars = pickExerciseSessionEffortStars(currentData, keys, primaryKeyForStars);
            const coefStarCount = intensityCoeffToStarCount(loadCoeff);

            return (
              <div
                key={exercise.id}
                className="flex flex-col gap-3 p-4 bg-black rounded-lg border border-[#0F4C5C]/45 hover:border-[#0F5C45]/50 transition-all duration-200 w-full min-w-0"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-3 min-w-0">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
                      <div className="font-medium text-white break-words">{exercise.name}</div>
                      <span className="inline-flex items-center text-amber-300 shrink-0">
                        <LoadDifficultyStars coeff={loadCoeff} className="scale-95" />
                      </span>
                    </div>
                    <div className="text-sm text-gray-300 break-words flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span>
                        {exercise.series}
                        {exercise.materiel && ` • ${exercise.materiel}`}
                        {exercise.notes && ` • ${exercise.notes}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => openSeriesAdaptForExercise(exercise)}
                        className="inline-flex items-center gap-1 rounded-md border border-teal-700/50 bg-[#0F4C5C]/20 px-2 py-0.5 text-[11px] font-medium text-teal-200 hover:border-teal-500/60 hover:bg-[#0F4C5C]/35"
                        title={t(
                          'today.seriesAdapt.openTitle',
                          'Adapter séries × reps pour aujourd’hui seulement'
                        )}
                      >
                        <PenLine className="w-3.5 h-3.5 shrink-0" />
                        {t('today.seriesAdapt.short', 'Prévu du jour')}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                    <Checkbox
                      checked={isChecked}
                      onChange={() => handleExerciseCheck(exercise.id, currentDate)}
                      className="text-green-400"
                      name={`exercise_${exercise.id}`}
                    />
                    {isChecked && (
                      <span className="text-green-400 text-sm font-medium whitespace-nowrap">
                        ✓ {t('today.exercises.completed')}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedExercise(exercise);
                        setShowExerciseVariations(true);
                      }}
                      className="gradient-button-premium gradient-button-premium-sm gradient-button-premium-variant rounded-lg flex items-center gap-2 shrink-0"
                    >
                      <Zap className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSuppressExercise(exercise.id)}
                      className="gradient-button-premium gradient-button-premium-sm rounded-lg flex items-center gap-2 shrink-0"
                      title={t('today.exercises.suppressTitle')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-1 border-t border-[#0F4C5C]/35 min-w-0">
                  <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        placeholder={inputPlaceholder}
                        value={reps}
                        onChange={(e) => updateLocalReps(exercise.id, e.target.value, currentDate)}
                        onFocus={() => handleInputFocus(exercise.id, exercise)}
                        className={`w-20 text-center ${isChecked ? 'bg-green-600/20 border-green-500 text-green-300' : 'bg-black border-[#0F4C5C]/50 text-white'}`}
                        size="sm"
                      />
                      <span className="text-teal-700 text-xs whitespace-nowrap">{inputLabel}</span>
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
                          className={`w-[4.5rem] text-center ${isChecked ? 'bg-green-600/20 border-green-500 text-green-300' : 'bg-black border-[#0F4C5C]/50 text-white'}`}
                          size="sm"
                        />
                        <span className="text-teal-700 text-xs whitespace-nowrap">
                          {t('today.exercises.weightUnit')}
                        </span>
                      </div>
                    )}
                  </div>

                  {showWeightField && exerciseIsDumbbellEquipment(exercise) && (
                    <label className="flex items-start gap-3 text-sm text-teal-600 cursor-pointer w-full max-w-xl">
                      <Checkbox
                        checked={resolveExerciseWeightPerArm(currentData, keys, readKey)}
                        onChange={(e) =>
                          updateLocalExerciseWeightPerArm(exercise.id, e.target.checked, currentDate)
                        }
                        className="text-teal-400 mt-0.5 shrink-0"
                        name={`per_arm_${exercise.id}`}
                      />
                      <span className="leading-snug">{t('today.exercises.weightPerArm')}</span>
                    </label>
                  )}

                  {showWeightField && inferDefaultSetCount(exercise, 0) > 1 && (
                    <div className="flex flex-col gap-2 w-full min-w-0">
                      {setWeightsRow ? (
                        <>
                          <div className="flex flex-wrap gap-x-3 gap-y-2 items-end">
                            {setWeightsRow.map((sw, idx) => (
                              <div
                                key={`${exercise.id}_setw_${idx}`}
                                className="flex items-center gap-1.5 shrink-0"
                              >
                                <span className="text-teal-700 text-xs font-medium whitespace-nowrap">
                                  S{idx + 1}
                                </span>
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  value={sw != null ? String(sw) : ''}
                                  onChange={(e) =>
                                    updateExerciseSetWeightAtIndex(
                                      exercise.id,
                                      idx,
                                      e.target.value,
                                      currentDate,
                                      exercise
                                    )
                                  }
                                  className={`w-16 text-center text-sm ${isChecked ? 'bg-green-600/20 border-green-500 text-green-300' : 'bg-black border-[#0F4C5C]/50 text-white'}`}
                                  size="sm"
                                />
                                <span className="text-teal-700 text-xs whitespace-nowrap">
                                  {t('today.exercises.weightUnit')}
                                </span>
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => clearExerciseSetWeightsForExercise(exercise.id, currentDate)}
                            className="text-left text-xs text-teal-500 hover:text-teal-300 underline w-fit"
                          >
                            {t('today.exercises.perSetReset')}
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => initExerciseSetWeightsFromSeries(exercise.id, currentDate, exercise)}
                          className="text-left text-xs text-teal-500 hover:text-teal-300 underline w-fit"
                        >
                          {t('today.exercises.perSetOpen')}
                        </button>
                      )}
                    </div>
                  )}

                  {isChecked && (
                    <div className="w-full pt-3 mt-1 border-t border-[#0F4C5C]/45">
                      <p className="text-[11px] font-medium text-amber-200/90 mb-1.5">
                        {t('today.exercises.sessionEffortLabel', 'Ressenti aujourd’hui')}
                      </p>
                      <SessionEffortBlock
                        idPrefix={`today-ex-${exercise.id}`}
                        persistedValue={sessionEffortStars}
                        suggestedStars={coefStarCount}
                        onChange={(n) => updateSessionEffortStarsToday(exercise, n)}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* ✅ NOUVEAU : Section Exercices Exceptionnels */}
          {additionalExercises.length > 0 && (
            <div className="mt-6 pt-6 border-t border-[#0F4C5C]/40">
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
                      className="flex items-center space-x-3 p-4 bg-black rounded-lg border border-amber-500/35 ring-1 ring-[#0F4C5C]/25 hover:border-amber-400/45 transition-all duration-200"
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
            <div className="mt-4 pt-4 border-t border-[#0F4C5C]/40">
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
            <div className="flex items-center space-x-3 p-4 bg-black rounded-lg border border-[#0F4C5C]/50 hover:border-[#0F5C45]/45 transition-all duration-200">
              <div className="flex-1">
                <div className="font-medium text-white flex items-center gap-2">
                  {workout.complementaryActivity.name}
                  <span className="text-xs bg-[#0F4C5C]/35 text-teal-100 px-2 py-1 rounded-full border border-[#0F5C45]/40">
                    {workout.complementaryActivity.type}
                  </span>
                </div>
                <div className="text-sm text-teal-100/80">
                  {workout.complementaryActivity.duration} min • {workout.complementaryActivity.timeSlot}
                </div>
                <div className="text-xs text-teal-300/90 mt-1">
                  {workout.complementaryActivity.benefits.join(' • ')}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={getCurrentData().checkedExercises[`${dateStr}_complementary_${workout.complementaryActivity.name.toLowerCase()}`] || false}
                  onChange={() => handleExerciseCheck(`complementary_${workout.complementaryActivity.name.toLowerCase()}`, currentDate)}
                  className="text-teal-400"
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
                  <span className="text-teal-200 text-sm font-medium">{t('today.exercises.minutesLabel')}</span>
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
          <div className="mt-6 pt-4 border-t border-[#0F4C5C]/40">
            <div className="flex items-center justify-between">
              <div className="text-sm text-amber-300 flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
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

      {/* Étirements — UNE carte par étirement individuel, groupé par moment.
         La granularité est par item (id stable depuis stretchDatabase) :
         chaque coche déclenche XP + complétion calendrier. */}
      {hasStretchesContent && (
        <div className="bg-black p-6 rounded-xl shadow-xl border-2 border-[#0F4C5C]/70">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <span className="text-teal-400">🧘‍♂️</span>
              {t('today.stretches.titleOfDay')}
              <span className="text-xs font-normal text-slate-400">
                ({countStretchItems(normalizedTodayStretches)})
              </span>
            </h3>
          </div>

          <StretchList stretches={workout?.etirements} date={currentDate} />

          {hasUnsavedStretches && (
            <div className="mt-6 pt-4 border-t border-[#0F4C5C]/40">
              <div className="flex items-center justify-between">
                <div className="text-sm text-amber-300 flex items-center gap-2">
                  <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
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
                  if (activityType === 'running' && shouldExcludeStoredGarminRunningSession(session)) {
                    return;
                  }
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
          <Card variant="sport">
            <Card.Header className="border-b border-[#0F4C5C]/40">
              <Card.Title className="flex items-center text-amber-200">
                <Zap className="mr-2 text-amber-400" size={20} />
                {t('today.endurance.sessionsTitle')}
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-3">
                {todayEnduranceSessions.map((session, index) => (
                  <div key={index} className="bg-black rounded-lg p-3 border border-amber-500/35 ring-1 ring-[#0F4C5C]/20">
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

      {/* Circuits planifiés aujourd'hui */}
      <CircuitsTodaySection dayName={dayName} dateStr={dateStr} />

      {/* Section des défis actifs */}
      {(() => {
        const activeChallenges = getActiveChallenges();
        if (activeChallenges.length === 0) return null;
        
        return (
          <Card variant="sport">
            <Card.Header className="border-b border-[#0F4C5C]/40">
              <Card.Title className="flex items-center text-teal-200">
                <Award className="mr-2 text-teal-400" size={20} />
                {t('today.challenges.title')} ({activeChallenges.length})
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                {activeChallenges.map((challenge, idx) => (
                  <ChallengeCard
                    key={`main-${challenge.id || challenge.title || 'challenge'}-${idx}`}
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
          className="mx-auto flex items-center justify-center gap-2 rounded-xl border-2 border-[#0F5C45]/55 bg-black px-8 py-3 text-base font-semibold text-teal-50 shadow-lg shadow-black/40 transition hover:border-[#0F5C45] hover:bg-[#0F4C5C]/25"
        >
          <MessageSquare className="h-5 w-5 text-teal-400" />
          {t('today.sessionFeedback.button')}
        </button>
      </div>

      {/* Adapter séries × reps (variation journalière) */}
      {seriesAdaptDialog && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="series-adapt-title"
        >
          <div className="w-full max-w-md rounded-xl border-2 border-[#0F4C5C]/70 bg-slate-950 p-5 shadow-2xl">
            <h4 id="series-adapt-title" className="text-lg font-semibold text-white mb-1">
              {t('today.seriesAdapt.title', 'Prévu pour aujourd’hui')}
            </h4>
            <p className="text-sm text-teal-200/80 mb-3 break-words">{seriesAdaptDialog.name}</p>
            <p className="text-xs text-slate-500 mb-2">
              {t('today.seriesAdapt.programLabel', 'Dans le programme :')}{' '}
              <span className="text-slate-300 font-mono">
                {seriesAdaptDialog.programSeries || '—'}
              </span>
            </p>
            <label className="block text-xs text-teal-600 mb-1">
              {t('today.seriesAdapt.inputLabel', 'Séries × reps pour ce jour (ex. 5×15, 4×8-12)')}
            </label>
            <Input
              type="text"
              value={seriesAdaptDialog.draft}
              onChange={(e) =>
                setSeriesAdaptDialog((d) => (d ? { ...d, draft: e.target.value } : d))
              }
              className="w-full bg-black border-[#0F4C5C]/50 text-white mb-4"
              placeholder="5×15"
            />
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => setSeriesAdaptDialog(null)}
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
              >
                {t('today.seriesAdapt.cancel', 'Annuler')}
              </button>
              <button
                type="button"
                onClick={resetSeriesAdaptFromDialog}
                className="rounded-lg border border-amber-700/50 px-4 py-2 text-sm text-amber-200 hover:bg-amber-950/40"
              >
                {t('today.seriesAdapt.reset', 'Réinitialiser')}
              </button>
              <button
                type="button"
                onClick={saveSeriesAdaptFromDialog}
                className="rounded-lg border border-[#0F5C45]/60 bg-[#0F5C45]/30 px-4 py-2 text-sm font-medium text-white hover:bg-[#0F5C45]/45"
              >
                {t('today.seriesAdapt.save', 'Enregistrer')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ NOUVEAU : Modal d'ajout d'exercice exceptionnel */}
      <AddExceptionalExerciseModal
        isOpen={showAddExceptionalModal}
        onClose={() => setShowAddExceptionalModal(false)}
      />
      <RecordPerformanceModal
        isOpen={showPerformanceModal}
        onClose={() => setShowPerformanceModal(false)}
        onSubmit={handleSavePerformanceFromToday}
        title={t('today.performanceModal.title', 'Enregistrer un max depuis Aujourd’hui')}
      />
      </div>
    </div>
  );
};

export default TodayTab;