import React, { useMemo, useState, useEffect, useCallback, useRef, startTransition, memo } from 'react';
import { Play, Square, CheckCircle, Clock, Target, Flame, Zap, MessageSquare, Save, X, Award, Plus, Trash2, BarChart3, PenLine, Scale, ChevronLeft, ChevronRight } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { useSessionDraftVersion, useExerciseUiVersion, useSessionCommitDirty, useSessionCommitEpoch, getSessionCommitDirty } from '../../context/WorkoutContext/sessionDraftStore';
import { startTodayCheckMeasure, scheduleTodayCheckIdle, yieldToNextPaint } from '../../utils/todayCheckMeasure';
import { markTodayViewPrepared } from '../../utils/preloadTabs';
import { useToast } from '../../components/ui/Toast';
import { workoutProgram } from '../../data/workoutProgram';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { Input, Checkbox } from '../ui/Input';
import ChallengeCard from '../ui/ChallengeCard';
import { typography } from '../../styles/typography';
import { getAutoWeekVariant, getDateStr as dateToYmd } from '../../utils/dateUtils';
import { calculateAutoReps, detectExerciseUnit, resolvePrescriptionAutofillValue } from '../../utils/exerciseCalculations';
import { useTodayExercises } from '../../hooks/useTodayExercises';
import AddExceptionalExerciseModal from '../modals/AddExceptionalExerciseModal';
import { isMockEnduranceSession, collectEnduranceSessionsForCalendarDay } from '../../utils/calendarUtils';
import { shouldExcludeStoredGarminRunningSession } from '../../utils/garminRunningLaps';
import DayJustificationButton from './TodayTab/components/DayJustificationButton.jsx';
import { isDayWithoutActivity } from '../../utils/dayJustificationUtils';
import { useTranslation } from '../../utils/translations';
import { useLanguage, LANGUAGES } from '../../context/LanguageContext';
import { loadEnduranceData as loadEnduranceDataService } from '../../services/endurance/enduranceDataService';
import { applyWorkoutRepIntegrations } from '../../services/endurance/workoutRepIntegrations';
import { useNutritionData } from '../../hooks/useNutritionData';
import {
  collectExerciseKeysForWorkoutExercise,
  generateSmartExerciseKey,
  resolveBestRepsStorageKey,
  peekLastExerciseWeightValue,
  isLastExerciseWeightIndexReady,
  noteLastExerciseWeightFromKey,
  pauseLastExerciseWeightIndex,
  resumeLastExerciseWeightIndex,
  extractDateStrFromWorkoutKey
} from '../../utils/exerciseKeyGenerator';
import { normalizeStretchSlots, countStretchItems, resolveEtirementsForDay } from '../../utils/stretchUtils';
import { syncStretchLinkedQuests } from '../../utils/questStretchSync';

import { withSessionSaveTimeout, isSessionSaveTimeoutError } from '../../utils/sessionSaveTimeout';
import StretchList from './TodayTab/components/StretchList';
import PlyometricBlock from '../program/PlyometricBlock';
import RunningDrillsBlock from '../program/RunningDrillsBlock';
import CircuitsTodaySection from './TodayTab/components/CircuitsTodaySection.jsx';
import { intensityCoeffToStarCount, resolveExerciseIntensityCoeff } from '../../utils/trainingLoadUtils';
import { todayExerciseVisualGroup, todayFocusTags, uniqueTodayExerciseGroups } from './TodayTab/utils/todayExerciseVisualGroup';
import PushupChallengeTodayPanel from './TodayTab/components/PushupChallengeTodayPanel.jsx';
import GtgTodaySchedulePanel from './TodayTab/components/GtgTodaySchedulePanel.jsx';
import {
  getExerciseWeightUiMode,
  exerciseShowsWeightField
} from '../../utils/exerciseWeightEligibility';
import { resolveProgramExerciseNotes } from '../../utils/exerciseHeroContent';
import { hasExerciseVariations } from '../../utils/exerciseVariationResolver';
import ReferenceDifficultyStars from '../sport/ReferenceDifficultyStars';
import { resolveExerciseScoring } from '../../utils/exerciseScoringResolver';
import CollapsibleSessionPerceived from './TodayTab/components/CollapsibleSessionPerceived.jsx';
import ExerciseSetDetailPanel from './TodayTab/components/ExerciseSetDetailPanel.jsx';
import ExerciseTimeInput from '../ui/ExerciseTimeInput.jsx';
import {
  computeOverallSessionStars,
  pickStoredSessionPerceived,
  sessionPerceivedToPayload
} from '../../utils/exerciseSessionPerceivedModel';
import { computeTodaySessionComplexity } from '../../utils/todaySessionScore';
import {
  computeWeeklyWeighInReminder,
  weighInReminderMessageFr,
  weighInReminderTitleFr
} from '../../utils/bodyTracking/weeklyWeighInReminder';
import ImpedanceQuickCapture from './nutrition/components/ImpedanceQuickCapture';
import RecordPerformanceModal from '../sport/performance/RecordPerformanceModal';
import { applyPerformanceEntryToData } from '../../utils/exercisePerformanceUtils';
import {
  exerciseIsDumbbellEquipment,
  inferDefaultSetCount,
  computeVolumeKgForWorkoutKey
} from '../../utils/exerciseLoadVolume';
import { collectWorkoutLoadSubsetForDate } from '../../utils/workoutLoadPersistence';
import { buildSetLogFromPrescription } from '../../utils/exerciseSetLogUtils';
import {
  evaluateVolumeCompletion,
  getPlannedTotalFromPrescription
} from '../../utils/programPrescriptionNormalizer';
import {
  getExerciseSeriesOverrides,
  mergeSeriesIntoProgramExercises,
  normalizeSeriesInputForStorage
} from '../../utils/dailyVariationSeriesOverrides';
import { findBankFoodByIdWithOverrides, getFoodUnitHints } from '../../data/nutritionFoodBank';
import { useQuietQuestEngine, getQuestsForDate } from '../../hooks/useQuietQuestEngine';

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

/** Nombre d’exercices du programme du jour avec au moins une case cochée (pour sync quête « liée sport »). */
function countCheckedProgramExercisesForDay(dataSnapshot, date, workout, isGymMode) {
  if (!dataSnapshot || !workout || !Array.isArray(workout.exercices)) return 0;
  const dateStr = dateToYmd(date);
  const list = mergeSeriesIntoProgramExercises(
    workout.exercices,
    getExerciseSeriesOverrides(dataSnapshot.dailyVariations, dateStr)
  );
  if (!list.length) return 0;
  const weekVariant = getAutoWeekVariant(date);
  let n = 0;
  for (const exercise of list) {
    const keys = collectExerciseKeysForWorkoutExercise(date, exercise, {
      isGymMode,
      workoutIsGymMode: workout?.isGymMode,
      weekVariant,
    });
    if (keys.some((k) => dataSnapshot.checkedExercises?.[k] === true)) n += 1;
  }
  return n;
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

function pickExerciseSessionPleasureStars(currentData, keys, primaryKey) {
  const map = currentData?.exerciseSessionPleasureStars || {};
  for (const key of keys) {
    const n = Number(map[key]);
    if (Number.isFinite(n) && n >= 1 && n <= 5) return Math.round(n);
  }
  const p = Number(map[primaryKey]);
  if (Number.isFinite(p) && p >= 1 && p <= 5) return Math.round(p);
  return null;
}

const optimisticChecks = new Map();
const optimisticCheckListeners = new Map();

function subscribeOptimisticCheck(exerciseId, listener) {
  const key = String(exerciseId);
  let set = optimisticCheckListeners.get(key);
  if (!set) {
    set = new Set();
    optimisticCheckListeners.set(key, set);
  }
  set.add(listener);
  return () => set.delete(listener);
}

function notifyOptimisticCheck(exerciseId) {
  const set = optimisticCheckListeners.get(String(exerciseId));
  if (!set) return;
  set.forEach((listener) => listener());
}

function setOptimisticCheck(exerciseId, checked) {
  optimisticChecks.set(String(exerciseId), !!checked);
  notifyOptimisticCheck(exerciseId);
}

function clearOptimisticCheck(exerciseId) {
  const key = String(exerciseId);
  if (!optimisticChecks.has(key)) return;
  optimisticChecks.delete(key);
  notifyOptimisticCheck(exerciseId);
}

function useOptimisticCheck(exerciseId) {
  const key = String(exerciseId);
  const [value, setValue] = useState(() =>
    optimisticChecks.has(key) ? optimisticChecks.get(key) : undefined
  );
  useEffect(
    () =>
      subscribeOptimisticCheck(key, () => {
        setValue(optimisticChecks.has(key) ? optimisticChecks.get(key) : undefined);
      }),
    [key]
  );
  return value;
}

function TodayExerciseCheck({ exerciseId, checked, onToggle, className, name, id }) {
  const optimistic = useOptimisticCheck(exerciseId);
  const shown = optimistic === undefined ? !!checked : optimistic;
  useEffect(() => {
    if (optimistic !== undefined && optimistic === !!checked) {
      clearOptimisticCheck(exerciseId);
    }
  }, [optimistic, checked, exerciseId]);
  return (
    <Checkbox
      checked={shown}
      onChange={() => {
        const key = String(exerciseId);
        const current = optimisticChecks.has(key) ? optimisticChecks.get(key) : !!checked;
        const next = !current;
        setOptimisticCheck(exerciseId, next);
        onToggle(next);
      }}
      className={className}
      name={name}
      id={id}
    />
  );
}

function TodaySessionTextField({ value, onCommitSilent, ...inputProps }) {
  const [text, setText] = useState(String(value ?? ''));
  const focusedRef = useRef(false);
  useEffect(() => {
    if (!focusedRef.current) setText(String(value ?? ''));
  }, [value]);
  return (
    <Input
      {...inputProps}
      value={text}
      onFocus={(e) => {
        focusedRef.current = true;
        inputProps.onFocus?.(e);
      }}
      onChange={(e) => {
        const next = e.target.value;
        setText(next);
        onCommitSilent(next);
      }}
      onBlur={(e) => {
        focusedRef.current = false;
        inputProps.onBlur?.(e);
      }}
    />
  );
}

function TodayDraftReader({ children }) {
  useSessionDraftVersion();
  const { getCurrentData } = useWorkout();
  return children(getCurrentData() || {});
}

const IsolatedTodayExerciseCard = memo(function IsolatedTodayExerciseCard({ exerciseId, children }) {
  useExerciseUiVersion(exerciseId);
  useSessionCommitEpoch();
  const { getCurrentData } = useWorkout();
  return children(getCurrentData() || {});
});

function LastWeightIndexKeeper() {
  const dirty = useSessionCommitDirty();
  const { getCurrentData } = useWorkout();
  useEffect(() => {
    if (dirty.exercises) {
      pauseLastExerciseWeightIndex();
      return undefined;
    }
    resumeLastExerciseWeightIndex(getCurrentData);
    return () => pauseLastExerciseWeightIndex();
  }, [dirty.exercises, getCurrentData]);
  return null;
}

function TodaySessionCommitBar({
  kind,
  onSave,
  onDiscard,
  unsavedLabel,
  saveLabel,
  savingLabel,
  discardLabel
}) {
  const dirty = useSessionCommitDirty();
  const [saving, setSaving] = useState(false);
  const show = kind === 'stretches' ? dirty.stretches : dirty.exercises;
  if (!show && !saving) return null;

  const handleSaveClick = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await onSave();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-6 pt-4 border-t border-[#0F4C5C]/40">
      <div className="flex items-center justify-between">
        <div className="text-sm text-amber-300 flex items-center gap-2">
          <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
          {unsavedLabel}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onDiscard}
            className="gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            {discardLabel}
          </button>
          <button
            type="button"
            onClick={handleSaveClick}
            disabled={saving}
            className="gradient-button-premium gradient-button-premium-md rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? savingLabel : saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const TodayTab = () => {
  const {
    currentDate,
    setCurrentDate,
    changeSessionCalendarDate,
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
    patchSessionExerciseDraft,
    writeExerciseDraftCell,
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
    addProgressEntry,
    activeProgram,
    getEffectiveRestDayForDate,
    applyWeeklyRestDaySwap
  } = useWorkout();
  
  const { showSuccess, showError } = useToast();
  const t = useTranslation();
  const { language } = useLanguage();
  const uiLocale = language === LANGUAGES.EN ? 'en-US' : 'fr-FR';
  const {
    allQuests: quietQuests,
    toggleQuestValidation,
    isQuestCompletedOnDate,
    todayDate: quietEngineToday,
    prayerLocation,
    getQuestsForDate: getQuestsForDateMemoized,
  } = useQuietQuestEngine();
  const nutritionData = useNutritionData();
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [exerciseGroupFilter, setExerciseGroupFilter] = useState('all');
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
      if (challenge.activityType === 'pushups') return false;
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
      if (activityType === 'pushups' || activityType === 'boxing' || activityType === 'gainage') {
        if (normalizedData.reps != null && normalizedData.count == null) {
          normalizedData.count = normalizedData.reps;
        }
        if (normalizedData.count != null && normalizedData.reps == null) {
          normalizedData.reps = normalizedData.count;
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
      const mergedPayload = applyWorkoutRepIntegrations(
        {
          ...data,
          enduranceData: {
            ...enduranceData,
            sessions: updatedSessions,
            challenges: updatedChallenges,
            lastUpdated: new Date().toISOString()
          }
        },
        { workoutAggregate: data }
      );

      await updateData(mergedPayload);

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

  const lastWeightIdsForExercise = (exercise, exerciseId) =>
    [exerciseId, exercise?.id, exercise?.originalId, exercise?.exerciseKey, exercise?.bankKey].filter(
      (x) => x != null
    );

  const plannedRepsForExercise = (exercise) => {
    if (!exercise?.series) return '';
    const planned = getPlannedTotalFromPrescription(exercise);
    if (planned != null) return String(planned);
    const autoVal = resolvePrescriptionAutofillValue(exercise, { round: true });
    if (autoVal != null) return String(autoVal);
    const calc = calculateAutoReps(exercise.series, { round: true });
    return calc != null ? String(calc) : '';
  };

  /** Quêtes « liées sport » : même jour que l’engine, cocher si au moins un exo programme coché, décocher si plus aucun. */
  const syncSportLinkedQuestsWithProgramSnapshot = useCallback(
    (date, dataSnapshot) => {
      const calendarDateStr = getDateStr(date);
      if (!calendarDateStr || calendarDateStr !== quietEngineToday) return;
      if (!Array.isArray(quietQuests) || quietQuests.length === 0) return;
      const workout = getTodayWorkout(date, isGymMode);
      const count = countCheckedProgramExercisesForDay(dataSnapshot, date, workout, isGymMode);
      const todays = getQuestsForDate(quietQuests, calendarDateStr, prayerLocation);
      const idsToday = new Set(todays.map((q) => q.id));
      for (const q of quietQuests) {
        if (!q || q.completeWithTodaySportExercise !== true) continue;
        if (!idsToday.has(q.id)) continue;
        const completed = isQuestCompletedOnDate(q.id, calendarDateStr);
        if (count > 0) {
          if (!completed) toggleQuestValidation(q.id, calendarDateStr, { origin: 'today-program-exercise' });
        } else if (completed) {
          toggleQuestValidation(q.id, calendarDateStr, { origin: 'today-program-exercise' });
        }
      }
    },
    [
      getDateStr,
      quietEngineToday,
      quietQuests,
      prayerLocation,
      isQuestCompletedOnDate,
      toggleQuestValidation,
      getTodayWorkout,
      isGymMode,
    ]
  );

  /** Quêtes « Étirements » liées : sync matin/midi/soir ↔ validations quêtes. */
  const syncStretchLinkedQuestsWithSnapshot = useCallback(
    (date, dataSnapshot) => {
      const calendarDateStr = getDateStr(date);
      if (!calendarDateStr || calendarDateStr !== quietEngineToday) return;
      if (!Array.isArray(quietQuests) || quietQuests.length === 0) return;
      const stretchDay = workoutDayOverride || getDayName(date);
      const workoutForDay = getTodayWorkout(date, isGymMode);
      const resolved = resolveEtirementsForDay(
        workoutForDay?.etirements,
        stretchDay,
        workoutProgram
      );
      syncStretchLinkedQuests({
        date,
        dataSnapshot,
        allQuests: quietQuests,
        prayerLocation,
        isQuestCompletedOnDate,
        toggleQuestValidation,
        getQuestsForDate: getQuestsForDateMemoized,
        resolvedEtirements: resolved,
        effectiveStretchDay: stretchDay,
      });
    },
    [
      quietEngineToday,
      quietQuests,
      prayerLocation,
      isQuestCompletedOnDate,
      toggleQuestValidation,
      getQuestsForDateMemoized,
      getTodayWorkout,
      isGymMode,
      workoutDayOverride,
      workoutProgram,
    ]
  );

  const handleStretchDataChange = useCallback(
    (nextSnapshot) => {
      syncStretchLinkedQuestsWithSnapshot(currentDate, nextSnapshot);
    },
    [currentDate, syncStretchLinkedQuestsWithSnapshot]
  );

  const [expandedPerceivedIds, setExpandedPerceivedIds] = useState(() => new Set());
  const savingLockRef = useRef(false);

  const collapseAllPerceivedPanels = useCallback(() => {
    setExpandedPerceivedIds(new Set());
  }, []);

  const togglePerceivedPanel = useCallback((exerciseId) => {
    const id = String(exerciseId);
    setExpandedPerceivedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const applyExerciseCheck = (exerciseId, date, shouldCheck) => {
    pauseLastExerciseWeightIndex();
    const measure = startTodayCheckMeasure(shouldCheck ? 'check' : 'uncheck');
    measure.mark('handler');
    const currentData = getCurrentData();
    const dateStr = getDateStr(date);
    const exercise = resolveProgramExerciseFromWorkout(workout, currentData.dailyVariations, dateStr, exerciseId);
    const fallbackKey = `${dateStr}_${exerciseId}`;

    const stripKeysInPlace = (draft, keys) => {
      keys.forEach((k) => {
        delete draft.checkedExercises[k];
        delete draft.reps[k];
        delete draft.exerciseWeights[k];
        delete draft.exerciseWeightPerArm[k];
        delete draft.exerciseSetWeights[k];
        delete draft.exerciseSetLogs[k];
        delete draft.exerciseSessionPerceived[k];
        delete draft.exerciseSessionEffortStars[k];
        delete draft.exerciseSessionPleasureStars[k];
      });
    };

    if (!exercise) {
      const isCurrentlyChecked = !!currentData.checkedExercises?.[fallbackKey];
      if (isCurrentlyChecked === shouldCheck) {
        return;
      }
      measure.mark('apply:fallback');
      patchSessionExerciseDraft(
        (draft) => {
          if (shouldCheck) {
            draft.checkedExercises[fallbackKey] = true;
          } else {
            stripKeysInPlace(draft, [fallbackKey]);
          }
        },
        { exerciseId }
      );
      if (!shouldCheck) {
        startTransition(() => {
          setExpandedPerceivedIds((prev) => {
            const next = new Set(prev);
            next.delete(String(exerciseId));
            return next;
          });
        });
      }
      measure.mark('patched');
      measure.flush();
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
    if (isCurrentlyChecked === shouldCheck) {
      return;
    }

    if (!shouldCheck) {
      measure.mark('apply:uncheck');
      patchSessionExerciseDraft(
        (draft) => {
          stripKeysInPlace(draft, keys);
        },
        { exerciseId: exercise.id }
      );
      startTransition(() => {
        setExpandedPerceivedIds((prev) => {
          const next = new Set(prev);
          next.delete(String(exercise.id));
          return next;
        });
      });
      measure.mark('patched');
      measure.flush();
      return;
    }

    const prevKeyForWeight = resolveBestRepsStorageKey(currentData, keys);
    const todayWeight =
      prevKeyForWeight && extractDateStrFromWorkoutKey(prevKeyForWeight) === dateStr
        ? String(currentData.exerciseWeights?.[prevKeyForWeight] ?? '').trim()
        : '';
    const peekedWeight =
      exerciseShowsWeightField(exercise, false) && isLastExerciseWeightIndexReady()
        ? peekLastExerciseWeightValue(lastWeightIdsForExercise(exercise, exerciseId))
        : '';
    const weightToStore = todayWeight || peekedWeight;
    const repsVal = plannedRepsForExercise(exercise);

    measure.mark('apply:check');
    patchSessionExerciseDraft(
      (draft) => {
        stripKeysInPlace(draft, keys);
        draft.checkedExercises[primaryKey] = true;
        draft.reps[primaryKey] = repsVal;
        if (weightToStore) draft.exerciseWeights[primaryKey] = weightToStore;
        if (prevKeyForWeight && currentData.exerciseWeightPerArm?.[prevKeyForWeight] === true) {
          draft.exerciseWeightPerArm[primaryKey] = true;
        }
        if (prevKeyForWeight && Array.isArray(currentData.exerciseSetWeights?.[prevKeyForWeight])) {
          draft.exerciseSetWeights[primaryKey] = [...currentData.exerciseSetWeights[prevKeyForWeight]];
        }
        if (exercise.id != null && exercise.name) {
          draft.exerciseDisplayNames[String(exercise.id)] = String(exercise.name);
        }
        let builtLog = null;
        try {
          builtLog = buildSetLogFromPrescription(exercise, {
            totalReps: repsVal ? parseInt(repsVal, 10) : undefined,
            workoutData: draft,
            storageKey: primaryKey
          });
        } catch {
          builtLog = null;
        }
        if (builtLog?.sets?.length) {
          draft.exerciseSetLogs[primaryKey] = builtLog;
        } else if (prevKeyForWeight && currentData.exerciseSetLogs?.[prevKeyForWeight]) {
          draft.exerciseSetLogs[primaryKey] = { ...currentData.exerciseSetLogs[prevKeyForWeight] };
        }
        if (weightToStore) noteLastExerciseWeightFromKey(primaryKey, weightToStore);
      },
      { exerciseId: exercise.id }
    );
    measure.mark('patched');
    measure.flush();
  };

  const applyExerciseCheckRef = useRef(applyExerciseCheck);
  applyExerciseCheckRef.current = applyExerciseCheck;

  const pendingCheckFrameRef = useRef(new Map());
  const queueExerciseCheck = (exerciseId, date, shouldCheck) => {
    const key = String(exerciseId);
    const prev = pendingCheckFrameRef.current.get(key);
    if (prev) cancelAnimationFrame(prev);
    const frame = requestAnimationFrame(() => {
      pendingCheckFrameRef.current.delete(key);
      try {
        applyExerciseCheckRef.current(exerciseId, date, shouldCheck);
      } catch (error) {
        console.error('Erreur lors de la coche exercice:', error);
        clearOptimisticCheck(exerciseId);
      }
    });
    pendingCheckFrameRef.current.set(key, frame);
  };

  const patchDraftField = (mapKey, storageKey, value) => {
    if (!storageKey) return;
    pauseLastExerciseWeightIndex();
    writeExerciseDraftCell(mapKey, storageKey, value);
    if (mapKey === 'exerciseWeights') noteLastExerciseWeightFromKey(storageKey, value);
  };

  const updateLocalReps = (storageKey, reps) => {
    patchDraftField('reps', storageKey, reps);
  };

  const updateLocalExerciseWeight = (storageKey, weightStr) => {
    patchDraftField('exerciseWeights', storageKey, weightStr);
  };

  const updateLocalExerciseMarkedWeighted = (storageKey, checked, exerciseId) => {
    patchSessionExerciseDraft((draft) => {
      if (!draft.exerciseMarkedWeighted || typeof draft.exerciseMarkedWeighted !== 'object') {
        draft.exerciseMarkedWeighted = {};
      }
      if (checked) draft.exerciseMarkedWeighted[storageKey] = true;
      else delete draft.exerciseMarkedWeighted[storageKey];
    }, { exerciseId });
  };

  const updateLocalExerciseWeightPerArm = (storageKey, checked, exerciseId) => {
    patchSessionExerciseDraft((draft) => {
      if (!draft.exerciseWeightPerArm || typeof draft.exerciseWeightPerArm !== 'object') {
        draft.exerciseWeightPerArm = {};
      }
      if (checked) draft.exerciseWeightPerArm[storageKey] = true;
      else delete draft.exerciseWeightPerArm[storageKey];
    }, { exerciseId });
  };

  const updateExerciseSetWeightAtIndex = (storageKey, setIndex, value, exercise) => {
    pauseLastExerciseWeightIndex();
    const count = Math.max(1, inferDefaultSetCount(exercise, 0));
    patchSessionExerciseDraft((draft) => {
      const existing = draft.exerciseSetWeights?.[storageKey];
      if (Array.isArray(existing) && String(existing[setIndex] ?? '') === String(value ?? '')) {
        return false;
      }
      const prevRow =
        (Array.isArray(existing) && existing.slice()) ||
        Array.from({ length: count }, () => String(draft.exerciseWeights?.[storageKey] || '').trim());
      while (prevRow.length < count) {
        prevRow.push(String(draft.exerciseWeights?.[storageKey] || '').trim());
      }
      prevRow[setIndex] = value;
      if (!draft.exerciseSetWeights || typeof draft.exerciseSetWeights !== 'object' || Array.isArray(draft.exerciseSetWeights)) {
        draft.exerciseSetWeights = {};
      }
      draft.exerciseSetWeights[storageKey] = prevRow;
      return true;
    }, { silent: true });
  };

  const clearExerciseSetWeightsForExercise = (storageKey, exerciseId) => {
    patchSessionExerciseDraft((draft) => {
      if (draft.exerciseSetWeights) delete draft.exerciseSetWeights[storageKey];
    }, { exerciseId });
  };

  const initExerciseSetWeightsFromSeries = (storageKey, exercise) => {
    const currentData = getCurrentData();
    const n = inferDefaultSetCount(exercise, 0);
    const count = Math.max(1, n);
    const base = String(currentData.exerciseWeights?.[storageKey] || '').trim();
    const row = Array.from({ length: count }, () => base);
    patchSessionExerciseDraft((draft) => {
      if (!draft.exerciseSetWeights || typeof draft.exerciseSetWeights !== 'object') {
        draft.exerciseSetWeights = {};
      }
      draft.exerciseSetWeights[storageKey] = row;
    }, { exerciseId: exercise?.id });
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
    if (savingLockRef.current) return;
    const dirtyAtClick = getSessionCommitDirty();
    const hadExercisesDraft = dirtyAtClick.exercises;
    const hadStretchesDraft = dirtyAtClick.stretches;
    savingLockRef.current = true;
    try {
      await yieldToNextPaint();
      try {
        await maybeApplyRestDaySwapBeforeSave();
      } catch (error) {
        console.error('Erreur swap repos avant sauvegarde:', error);
      }
      await withSessionSaveTimeout(saveExerciseChanges());
      collapseAllPerceivedPanels();
      if (hadExercisesDraft && hadStretchesDraft) {
        showSuccess(t('today.messages.sessionSaved'));
      } else if (hadExercisesDraft) {
        showSuccess(t('today.messages.exercisesSaved'));
      } else if (hadStretchesDraft) {
        showSuccess(t('today.messages.stretchesSaved'));
      }
      scheduleTodayCheckIdle(() => {
        syncSportLinkedQuestsWithProgramSnapshot(currentDate, getCurrentData());
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des exercices:', error);
      if (isSessionSaveTimeoutError(error)) {
        showError(
          t(
            'today.messages.saveTimeout',
            'La sauvegarde prend trop de temps. Réessaie ou rafraîchis la page.'
          )
        );
        return;
      }
      showError(t('today.messages.errorSavingExercises'), {
        title: t('today.messages.saveFailed'),
        message: t('today.messages.errorMessage'),
        suggestions: [
          t('today.messages.suggestions.checkInternet'),
          t('today.messages.suggestions.refresh'),
          t('today.messages.suggestions.contactSupport')
        ]
      });
    } finally {
      savingLockRef.current = false;
    }
  };

  // Sauvegarder les étirements avec vérification d'intégrité
  const handleSaveStretches = async () => {
    if (savingLockRef.current) return;
    const dirtyAtClick = getSessionCommitDirty();
    const hadExercisesDraft = dirtyAtClick.exercises;
    const hadStretchesDraft = dirtyAtClick.stretches;
    savingLockRef.current = true;
    try {
      await yieldToNextPaint();
      try {
        await maybeApplyRestDaySwapBeforeSave();
      } catch (error) {
        console.error('Erreur swap repos avant sauvegarde:', error);
      }
      await withSessionSaveTimeout(saveStretchChanges());
      collapseAllPerceivedPanels();
      if (hadExercisesDraft && hadStretchesDraft) {
        showSuccess(t('today.messages.sessionSaved'));
      } else if (hadStretchesDraft) {
        showSuccess(t('today.messages.stretchesSaved'));
      } else if (hadExercisesDraft) {
        showSuccess(t('today.messages.exercisesSaved'));
      }
      scheduleTodayCheckIdle(() => {
        syncSportLinkedQuestsWithProgramSnapshot(currentDate, getCurrentData());
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des étirements:', error);
      if (isSessionSaveTimeoutError(error)) {
        showError(
          t(
            'today.messages.saveTimeout',
            'La sauvegarde prend trop de temps. Réessaie ou rafraîchis la page.'
          )
        );
        return;
      }
      showError(t('today.messages.errorSavingStretches'), {
        title: t('today.messages.saveFailed'),
        message: t('today.messages.errorMessage'),
        suggestions: [
          t('today.messages.suggestions.checkInternet'),
          t('today.messages.suggestions.refresh'),
          t('today.messages.suggestions.contactSupport')
        ]
      });
    } finally {
      savingLockRef.current = false;
    }
  };

  const handleDiscardExercises = () => {
    discardExerciseChanges();
    collapseAllPerceivedPanels();
  };

  const handleDiscardStretches = () => {
    discardStretchChanges();
    collapseAllPerceivedPanels();
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

  const workout = useMemo(
    () => getTodayWorkout(currentDate, isGymMode),
    [getTodayWorkout, currentDate, isGymMode]
  );
  const dateStr = getDateStr(currentDate);
  const dayName = getDayName(currentDate);
  const calendarTodayYmd = getDateStr(new Date());
  const canGoForwardSportDay = dateStr < calendarTodayYmd;
  const isRecordingRealToday = dateStr === calendarTodayYmd;

  const formattedSportSessionDate = useMemo(
    () =>
      currentDate.toLocaleDateString(uiLocale, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }),
    [currentDate, uiLocale]
  );

  const confirmLeaveDayWithUnsavedDraft = useCallback(() => {
    const dirty = getSessionCommitDirty();
    if (!dirty.exercises && !dirty.stretches) return true;
    return window.confirm(
      t(
        'today.dateNav.leaveWithoutSave',
        'Des modifications ne sont pas enregistrées. Changer de jour quand même ? (Utilise « Enregistrer » pour garder la séance du jour affiché.)'
      )
    );
  }, [t]);

  const shiftSportCalendarDay = useCallback(
    (delta) => {
      if (delta === 0) return;

      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + delta);
      nextDate.setHours(12, 0, 0, 0);
      const nextDateStr = getDateStr(nextDate);
      if (delta > 0 && nextDateStr > calendarTodayYmd) return;
      if (nextDateStr === dateStr) return;
      if (!confirmLeaveDayWithUnsavedDraft()) return;

      discardExerciseChanges();
      changeSessionCalendarDate(nextDate);
    },
    [
      currentDate,
      dateStr,
      calendarTodayYmd,
      confirmLeaveDayWithUnsavedDraft,
      changeSessionCalendarDate,
      discardExerciseChanges,
      getDateStr,
    ]
  );

  const goToSportSessionToday = useCallback(() => {
    if (dateStr === calendarTodayYmd) return;
    if (!confirmLeaveDayWithUnsavedDraft()) return;
    discardExerciseChanges();
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    changeSessionCalendarDate(today);
  }, [dateStr, calendarTodayYmd, confirmLeaveDayWithUnsavedDraft, changeSessionCalendarDate, discardExerciseChanges]);

  const sportSessionDateNavRow = (
    <div
      className="today-b-date flex flex-wrap items-center justify-center gap-3 rounded-xl border-2 border-[#0F5C45]/45 bg-black px-4 py-3"
      role="group"
      aria-label="Date de la séance"
    >
      <button
        type="button"
        onClick={() => shiftSportCalendarDay(-1)}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#0F5C45]/55 text-teal-100 transition hover:bg-[#0F5C45]/25 hover:text-white"
        title={t('today.dateNav.prevDay')}
        aria-label={t('today.dateNav.prevDay')}
      >
        <ChevronLeft className="h-5 w-5" aria-hidden />
      </button>
      <div className="min-w-0 flex-1 text-center">
        <p className="today-date-label text-sm font-medium capitalize text-white sm:text-base">{formattedSportSessionDate}</p>
        {isRecordingRealToday ? (
          <div className="today-date-sub">Aujourd'hui</div>
        ) : (
          <button
            type="button"
            onClick={() => goToSportSessionToday()}
            className="mt-1 text-xs font-medium text-teal-300 underline-offset-2 hover:text-teal-100 hover:underline"
          >
            {t('today.dateNav.backToToday', "Revenir à aujourd'hui")}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => shiftSportCalendarDay(1)}
        disabled={!canGoForwardSportDay}
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#0F5C45]/55 text-teal-100 transition hover:bg-[#0F5C45]/25 hover:text-white ${
          !canGoForwardSportDay ? 'cursor-not-allowed opacity-35 hover:bg-transparent' : ''
        }`}
        title={canGoForwardSportDay ? t('today.dateNav.nextDay') : t('today.dateNav.nextDisabled')}
        aria-label={canGoForwardSportDay ? t('today.dateNav.nextDay') : t('today.dateNav.nextDisabled')}
      >
        <ChevronRight className="h-5 w-5" aria-hidden />
      </button>
    </div>
  );

  const updateSessionPerceivedToday = useCallback(
    (exercise, draft, overallStars) => {
      const currentData = getCurrentData();
      const keyOpts = { isGymMode, workoutIsGymMode: workout?.isGymMode };
      const primaryKey = generateSmartExerciseKey(currentDate, exercise.id, keyOpts);
      const keys = collectExerciseKeysForWorkoutExercise(currentDate, exercise, keyOpts);
      const nextPerceived = { ...(currentData.exerciseSessionPerceived || {}) };
      const nextStars = { ...(currentData.exerciseSessionEffortStars || {}) };
      keys.forEach((k) => {
        if (k !== primaryKey) {
          delete nextPerceived[k];
          delete nextStars[k];
        }
      });
      const payload = sessionPerceivedToPayload(draft);
      const overall =
        overallStars != null
          ? Math.round(Number(overallStars))
          : computeOverallSessionStars(draft);
      if (payload) nextPerceived[primaryKey] = payload;
      else delete nextPerceived[primaryKey];
      if (Number.isFinite(overall) && overall >= 1 && overall <= 5) nextStars[primaryKey] = overall;
      else delete nextStars[primaryKey];
      updateTempExerciseData({
        ...currentData,
        exerciseSessionPerceived: nextPerceived,
        exerciseSessionEffortStars: nextStars
      });
    },
    [getCurrentData, updateTempExerciseData, currentDate, isGymMode, workout?.isGymMode]
  );

  const updateSessionPleasureStarsToday = useCallback(
    (exercise, starCount) => {
      const currentData = getCurrentData();
      const keyOpts = { isGymMode, workoutIsGymMode: workout?.isGymMode };
      const primaryKey = generateSmartExerciseKey(currentDate, exercise.id, keyOpts);
      const keys = collectExerciseKeysForWorkoutExercise(currentDate, exercise, keyOpts);
      const next = { ...(currentData.exerciseSessionPleasureStars || {}) };
      keys.forEach((k) => {
        if (k !== primaryKey) delete next[k];
      });
      const n = Math.round(Number(starCount));
      if (!Number.isFinite(n) || n < 1 || n > 5) delete next[primaryKey];
      else next[primaryKey] = n;
      updateTempExerciseData({
        ...currentData,
        exerciseSessionPleasureStars: next
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

  const weighInReminder = useMemo(() => {
    const entries = getCurrentData()?.progressEntries || data?.progressEntries || [];
    return computeWeeklyWeighInReminder({
      prefs: data?.bodyTrackingPrefs,
      weeklyWeighInDay: data?.bodyTrackingPrefs?.weeklyWeighInDay,
      viewDate: currentDate,
      progressEntries: entries
    });
  }, [
    data?.bodyTrackingPrefs,
    currentDate,
    getCurrentData,
    data?.progressEntries
  ]);

  const lastImpedanceEntry = useMemo(() => {
    const entries = getCurrentData()?.progressEntries || data?.progressEntries || [];
    return (
      [...entries]
        .filter((e) => e?.type === 'impedance')
        .sort((a, b) => String(b.date).localeCompare(String(a.date)))[0] || null
    );
  }, [getCurrentData, data?.progressEntries]);

  // Calculer la variante de semaine automatique (toujours basée sur la date)
  const currentWeekVariant = getAutoWeekVariant(currentDate);

  // Vérifier si des variantes gym sont disponibles pour ce jour
  const hasGymVariants = (() => {
    const daySchedule = activeProgram?.schedule?.[dayName];
    if (daySchedule?.salleVariants) {
      const countA = daySchedule.salleVariants.semaineA?.exercises?.length || 0;
      const countB = daySchedule.salleVariants.semaineB?.exercises?.length || 0;
      return countA + countB > 0;
    }
    return (
      (dayName === 'samedi' || dayName === 'dimanche') &&
      Boolean(workoutProgram[dayName]?.salleVariants)
    );
  })();

  // ✅ NOUVEAU : Utiliser le hook useTodayExercises pour obtenir exercices avec variations
  const {
    programExercises,
    supplementalExercises,
    additionalExercises,
    suppressedExerciseIds,
    metadata: exercisesMetadata
  } = useTodayExercises({ date: currentDate, isGymMode });

  // ✅ État pour modal d'ajout d'exercice exceptionnel
  const [showAddExceptionalModal, setShowAddExceptionalModal] = useState(false);
  /** Modal « adapter le prévu du jour » (séries × reps) pour un exo du programme */
  const [seriesAdaptDialog, setSeriesAdaptDialog] = useState(null);

  /** Exercices du programme uniquement (hors GTG). */
  const orderedProgramExercises = useMemo(() => programExercises || [], [programExercises]);

  const orderedSupplementalExercises = useMemo(
    () => supplementalExercises || [],
    [supplementalExercises]
  );

  const exercisesForTodayList = useMemo(
    () => [...orderedProgramExercises, ...orderedSupplementalExercises],
    [orderedProgramExercises, orderedSupplementalExercises]
  );

  const todayExerciseFilterGroups = useMemo(
    () => uniqueTodayExerciseGroups(exercisesForTodayList),
    [exercisesForTodayList]
  );

  useEffect(() => {
    setExerciseGroupFilter('all');
  }, [dateStr, workoutDayOverride]);

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

    const exceptionalCompletedReps = (additionalExercises || []).reduce((sum, ex) => {
      if (!ex?.completed) return sum;
      if (ex?.type !== 'reps') return sum;
      const n = Math.max(
        0,
        Math.floor(
          Number(
            ex?.totalReps ??
              (Array.isArray(ex?.actualReps) ? ex.actualReps.reduce((a, b) => a + (Number(b) || 0), 0) : 0)
          ) || 0
        )
      );
      return sum + n;
    }, 0);

    const todayData = {
      date: dateStr,
      exercises: [...programRows, ...complementaryRows],
      totalReps:
        programRows.reduce((total, ex) => total + (parseInt(ex.reps, 10) || 0), 0) + exceptionalCompletedReps,
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
          ? t('today.seriesAdapt.saved', 'Séries / reps du jour enregistrées')
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
  const effectiveStretchDay = workoutDayOverride || dayName;
  const resolvedWorkoutEtirements = useMemo(
    () => resolveEtirementsForDay(workout?.etirements, effectiveStretchDay, workoutProgram),
    [workout?.etirements, effectiveStretchDay]
  );
  const normalizedTodayStretches = useMemo(
    () => normalizeStretchSlots(resolvedWorkoutEtirements, effectiveStretchDay),
    [resolvedWorkoutEtirements, effectiveStretchDay]
  );
  const hasStretchesContent = countStretchItems(normalizedTodayStretches) > 0;
  const hasPlyometricsContent =
    Array.isArray(workout?.pliometrie?.items) && workout.pliometrie.items.length > 0;
  const hasDrillsContent =
    Array.isArray(workout?.drillsCourse?.items) && workout.drillsCourse.items.length > 0;

  useEffect(() => {
    markTodayViewPrepared();
  }, []);

  useEffect(() => {
    // Verrou local (savingLockRef) : plus d’état isSavingSessionDraft.
    if (savingLockRef.current) return;
    if (!hasStretchesContent || !Array.isArray(quietQuests) || quietQuests.length === 0) return;
    const snapshot =
      hasUnsavedExercises || hasUnsavedStretches ? getCurrentData() : data;
    syncStretchLinkedQuestsWithSnapshot(currentDate, snapshot);
  }, [
    hasStretchesContent,
    normalizedTodayStretches,
    quietQuests,
    quietEngineToday,
    currentDate,
    syncStretchLinkedQuestsWithSnapshot,
    getCurrentData,
    data,
    hasUnsavedExercises,
    hasUnsavedStretches,
  ]);

  /** Jour sans exercices : n’afficher l’écran « jour de repos » plein écran que s’il n’y a pas non plus d’étirements prévus */
  if (
    (!workout.exercices || workout.exercices.length === 0) &&
    !hasStretchesContent &&
    !hasPlyometricsContent &&
    !hasDrillsContent
  ) {
    const activeChallenges = getActiveChallenges();
    const currentData = getCurrentData();
    const hasNoActivity = isDayWithoutActivity(currentData, dateStr);
    
    return (
      <div className="today-sport-shell max-w-[1240px] mx-auto px-4 py-6 space-y-6">
        {sportSessionDateNavRow}
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
    <div className="relative min-h-screen today-sport-shell">
      <LastWeightIndexKeeper />
      {/* Contenu avec z-index relatif */}
      <div className="relative z-10 max-w-[1240px] mx-auto px-4 py-6 space-y-6">
        {/* Workout Header */}
      <div className={`today-hero p-6 rounded-xl shadow-xl border-2 ${
        workout.focus?.includes('Repos')
          ? 'border-[#0F5C45]/60 bg-black'
          : 'border-[#0F4C5C]/70 bg-black'
      }`}>
        <div className="today-hero-title">
        <div className="today-eyebrow">{t('today.workout.sessionEyebrow', 'Séance du jour')}</div>
        <h2 className="text-2xl font-bold text-white">{workout.name}</h2>
        {todayFocusTags(workout.focus).length > 0 ? (
          <div className="today-hero-tags">
            {todayFocusTags(workout.focus).map((tag) => (
              <span key={tag} className="today-tag">{tag}</span>
            ))}
          </div>
        ) : workout.focus ? (
          <p className="text-sm text-gray-200 opacity-90 mt-1">{workout.focus}</p>
        ) : null}
        {workout.duree ? (
          <p className="text-xs text-gray-300 mt-2">⏱️ {workout.duree}</p>
        ) : null}
        </div>
        <div className="today-hero-controls">
        
        {/* Toggle Gym/Maison - seulement pour samedi et dimanche */}
        {hasGymVariants && (
          <div className="today-control-row">
            <span className="today-control-label">{t('today.workout.trainingMode')}</span>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setIsGymMode(false)}
                className={`today-mode-chip today-mode-home ${!isGymMode ? 'is-on' : ''}`}
              >
                {t('today.workout.home')}
              </button>
              <button
                type="button"
                onClick={() => setIsGymMode(true)}
                className={`today-mode-chip today-mode-gym ${isGymMode ? 'is-on' : ''}`}
              >
                {t('today.workout.gym')}
              </button>
            {data.weekVariant && (
              <span className="today-week-pill">
                {t('today.workout.week', 'Semaine {{week}}', { week: currentWeekVariant })}
              </span>
            )}
            </div>
          </div>
        )}
        <div className="today-control-row">
          <p className="today-control-label">{t('today.workout.useWorkoutOf', "Utiliser l'entraînement de :")}</p>
          <div className="today-day-row">
            {['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'].map((d) => {
              const shorts = { lundi: 'Lun', mardi: 'Mar', mercredi: 'Mer', jeudi: 'Jeu', vendredi: 'Ven', samedi: 'Sam', dimanche: 'Dim' };
              const label = shorts[d] || d;
              const isCurrentDay = d === dayName;
              const isSelected = workoutDayOverride ? workoutDayOverride === d : isCurrentDay;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setWorkoutDayOverride(isCurrentDay ? null : d)}
                  className={`today-day-pill ${isSelected ? 'is-today' : ''}`}
                  title={isCurrentDay ? t('today.workout.todayWorkout', "Entraînement du jour") : t('today.workout.useDayWorkout', "Afficher et faire l'entraînement du {{day}}", { day: d.charAt(0).toUpperCase() + d.slice(1) })}
                >
                  {isCurrentDay
                    ? isRecordingRealToday
                      ? t('today.workout.today', "Aujourd'hui")
                      : label
                    : label}
                </button>
              );
            })}
          </div>
          {workoutDayOverride && (
            <p className="text-xs text-amber-400/90 mt-2">
              {dateStr < calendarTodayYmd
                ? t('today.workout.overrideHintForDate', {
                    day: workoutDayOverride.charAt(0).toUpperCase() + workoutDayOverride.slice(1),
                    date: currentDate.toLocaleDateString(uiLocale, {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })
                  })
                : t('today.workout.overrideHint', {
                    day: workoutDayOverride.charAt(0).toUpperCase() + workoutDayOverride.slice(1),
                    date: currentDate.toLocaleDateString(uiLocale, {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long'
                    })
                  })}
            </p>
          )}
        </div>
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => setShowPerformanceModal(true)}
            className="today-btn rounded-lg border border-[#0F5C45]/55 bg-[#0F5C45]/30 px-4 py-2 text-sm text-white"
          >
            Enregistrer un max
          </button>
        </div>
        </div>
      </div>

      <div className="today-bento">
      {sportSessionDateNavRow}

      {workout?.exercices?.length > 0 && (
        <div className="today-b-load rounded-xl border-2 border-[#0F5C45]/45 bg-black px-5 py-4">
          <div className="today-eyebrow">{t('today.sessionScore.title')}</div>
          <div className="today-load-num-row">
            <span className="today-load-num">
              {todaySessionComplexity.score0to100 != null ? `${todaySessionComplexity.score0to100}%` : t('today.sessionScore.na')}
            </span>
            {todaySessionComplexity.score0to100 != null ? (
              <span className="today-load-sub">{t('today.sessionScore.scoreSub', 'du volume estimatif')}</span>
            ) : null}
          </div>
          <div className="today-bar">
            <div
              className="today-bar-fill"
              style={{ width: `${Math.min(100, Math.max(0, todaySessionComplexity.score0to100 ?? 0))}%` }}
            />
          </div>
          <div className="today-stat-line">
            <span>
              {t('today.sessionScore.load', {
                done: todaySessionComplexity.completedLoad,
                ref: todaySessionComplexity.plannedLoadEstimate
              })}
            </span>
            <span>
              {t('today.sessionScore.doneCount', {
                n: todaySessionComplexity.completedCount,
                total: todaySessionComplexity.plannedCount
              })}
            </span>
          </div>
        </div>
      )}

      {/* ✅ NOUVEAU : Bouton/Badge de justification si jour sans activité (même avec exercices prévus) */}
      <div className="today-b-activity">
      {(() => {
        const currentData = getCurrentData();
        const hasNoActivity = isDayWithoutActivity(currentData, dateStr);
        return hasNoActivity ? <DayJustificationButton date={currentDate} /> : null;
      })()}
      </div>

      {Array.isArray(activeNutritionProgram?.mealPlanPreferences?.generatedMealPlan) &&
      activeNutritionProgram.mealPlanPreferences.generatedMealPlan.length > 0 ? null : (
        <div className="today-b-nutrition today-module flex items-center justify-between gap-4 rounded-xl border px-5 py-3">
          <p className="text-[13px] m-0">
            🍽 Aucun plan repas généré actif pour aujourd'hui — crée ou active un programme nutritionnel avec plan journalier.
          </p>
          <button
            type="button"
            onClick={() => setActiveTab?.('nutrition')}
            className="today-btn today-btn-ghost shrink-0"
          >
            Configurer
          </button>
        </div>
      )}
      </div>

      {/* Rappel pesée hebdomadaire (jour configuré dans Impédancemètre) */}
      {weighInReminder.show ? (
        <div className="mb-3 rounded-xl border-2 border-amber-500/50 bg-amber-950/40 p-4">
          <div className="flex items-start gap-3">
            <Scale className="mt-0.5 h-8 w-8 shrink-0 text-amber-300" />
            <div className="min-w-0 flex-1">
              <div className="text-base font-semibold text-amber-100">
                {weighInReminderTitleFr(weighInReminder)}
              </div>
              <p className="mt-1 text-sm text-amber-200/85">{weighInReminderMessageFr(weighInReminder)}</p>
              {weighInReminder.weekStartYmd && weighInReminder.perWeek > 0 ? (
                <p className="mt-1 text-xs text-amber-300/70">
                  Semaine du{' '}
                  {new Date(`${weighInReminder.weekStartYmd}T12:00:00`).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long'
                  })}
                  {weighInReminder.weekEndYmd
                    ? ` au ${new Date(`${weighInReminder.weekEndYmd}T12:00:00`).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long'
                      })}`
                    : ''}{' '}
                  · {weighInReminder.doneThisWeek}/{weighInReminder.perWeek} pesée
                  {weighInReminder.perWeek > 1 ? 's' : ''}
                </p>
              ) : weighInReminder.dueDateYmd ? (
                <p className="mt-1 text-xs text-amber-300/70">
                  Jour de pesée prévu :{' '}
                  {new Date(`${weighInReminder.dueDateYmd}T12:00:00`).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })}
                </p>
              ) : null}
            </div>
          </div>
          <div className="mt-4">
            <ImpedanceQuickCapture
              addProgressEntry={addProgressEntry}
              entryDate={dateStr}
              lastEntry={lastImpedanceEntry}
              notes="Saisie depuis Aujourd’hui (rappel pesée)"
              title="Enregistrer la pesée maintenant"
              hint="Poids, taille et âge suffisent. Le formulaire complet reste dans Suivi corporel → Impédancemètre."
              onSuccess={() => showSuccess('Mesure impédance enregistrée')}
            />
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
              className="mt-2 text-xs text-amber-200/80 underline"
            >
              Ouvrir le formulaire complet (toutes les lignes de l’impédancemètre)
            </button>
          </div>
        </div>
      ) : null}

      {Array.isArray(activeNutritionProgram?.mealPlanPreferences?.generatedMealPlan) &&
      activeNutritionProgram.mealPlanPreferences.generatedMealPlan.length > 0 ? (
        <div className="today-module mb-3 rounded-xl border-2 border-[#0F5C45]/45 bg-black p-4">
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
      ) : null}

      {/* Exercices */}
      <div className="today-ex-section">
        <div className="today-section-head">
        <h3 className="font-semibold text-white mb-0 flex items-center gap-2">
          {t('today.exercises.title')}
          {orderedProgramExercises.length > 0 && (
            <span className="today-section-count">· {orderedProgramExercises.length}</span>
          )}
        </h3>
        {todayExerciseFilterGroups.length > 0 && (
          <div className="today-filters" role="tablist" aria-label={t('today.exerciseFilters.label', 'Filtrer par muscle')}>
            <button
              type="button"
              data-today-filter="all"
              className={`today-filter ${exerciseGroupFilter === 'all' ? 'is-on' : ''}`}
              onClick={() => setExerciseGroupFilter('all')}
            >
              {t('today.exerciseFilters.all', 'Tous')}
            </button>
            {todayExerciseFilterGroups.map((groupId) => (
              <button
                type="button"
                key={groupId}
                data-today-filter={groupId}
                className={`today-filter ${exerciseGroupFilter === groupId ? 'is-on' : ''}`}
                onClick={() => setExerciseGroupFilter(groupId)}
              >
                {t(`today.exerciseFilters.${groupId}`, groupId)}
              </button>
            ))}
          </div>
        )}
        </div>
        {orderedProgramExercises.length === 0 && additionalExercises.length === 0 ? (
          <div className="text-center py-8 text-teal-700">
            <p>{t('today.exercises.noExercises', 'Aucun exercice prévu pour aujourd\'hui')}</p>
          </div>
        ) : (
          <TodayDraftReader>
          {(sessionSnapshot) => (
          <>
          <div className="today-ex-masonry">
            {/* ✅ NOUVEAU : Exercices du programme (filtrés selon variations) */}
            {exercisesForTodayList.map((exercise) => (
            <IsolatedTodayExerciseCard key={exercise.id} exerciseId={exercise.id}>
            {(sessionSnapshot) => {
            const isProgramExercise = !exercise.source;
            const currentData = sessionSnapshot;
            const keys = collectExerciseKeysForWorkoutExercise(currentDate, exercise, {
              isGymMode,
              workoutIsGymMode: workout.isGymMode
            });
            const readKey = resolveBestRepsStorageKey(currentData, keys) || keys[0];
            const dataChecked = keys.some((k) => currentData.checkedExercises?.[k] === true);
            const checkboxChecked = dataChecked;
            const isChecked = checkboxChecked;
            const reps =
              currentData.reps?.[readKey] !== undefined && currentData.reps?.[readKey] !== null
                ? String(currentData.reps[readKey])
                : '';
            const weightUiMode = isProgramExercise ? getExerciseWeightUiMode(exercise) : null;
            const markedWeighted =
              isProgramExercise && currentData.exerciseMarkedWeighted?.[readKey] === true;
            const showWeightField =
              isProgramExercise && exerciseShowsWeightField(exercise, markedWeighted);
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

            const volumeCompletion = (() => {
              const val = Number(reps);
              if (!Number.isFinite(val) || val <= 0) return null;
              return evaluateVolumeCompletion(exercise, val);
            })();

            const primaryKeyForStars = generateSmartExerciseKey(currentDate, exercise.id, {
              isGymMode,
              workoutIsGymMode: workout.isGymMode
            });
            const sessionEffortStars = pickExerciseSessionEffortStars(currentData, keys, primaryKeyForStars);
            const sessionPleasureStars = pickExerciseSessionPleasureStars(currentData, keys, primaryKeyForStars);
            const scoring = resolveExerciseScoring(exercise);
            const coefStarCount = scoring?.difficultyStars ?? intensityCoeffToStarCount(loadCoeff);

            const visualGroup = todayExerciseVisualGroup(exercise);

            return (
              <div
                data-today-group={visualGroup}
                className={`today-ex-card flex flex-col gap-2 p-4 bg-black rounded-lg border border-[#0F4C5C]/45 w-full min-w-0 ${
                  exerciseGroupFilter !== 'all' && visualGroup !== exerciseGroupFilter
                    ? 'is-filtered-out'
                    : ''
                }`}
              >
                <div className="today-ex-top">
                  <div className="today-ex-name min-w-0">
                    {exercise.name}
                    {exercise.supplementalLabel ? (
                      <span className="today-tag ml-2 align-middle">{exercise.supplementalLabel}</span>
                    ) : null}
                  </div>
                  <div className="today-ex-actions">
                    <TodayExerciseCheck
                      exerciseId={exercise.id}
                      checked={checkboxChecked}
                      onToggle={(shouldCheck) => queueExerciseCheck(exercise.id, currentDate, shouldCheck)}
                      className="today-ex-check text-green-400"
                      name={`exercise_${exercise.id}`}
                      id={`today-ex-check-${exercise.id}`}
                    />
                    {hasExerciseVariations(exercise) ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedExercise(exercise);
                        setShowExerciseVariations(true);
                      }}
                      className="today-ex-icon zap"
                      title={t('today.exercises.variations', 'Variations')}
                    >
                      <Zap className="w-3.5 h-3.5" />
                    </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => handleSuppressExercise(exercise.id)}
                      className="today-ex-icon del"
                      title={t('today.exercises.suppressTitle')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {isChecked ? (
                  <span className="text-[11px] text-emerald-300">✓ {t('today.exercises.completed')}</span>
                ) : null}

                <div className="today-ex-badge">
                  {scoring ? (
                    <ReferenceDifficultyStars
                      stars={scoring.difficultyStars}
                      intensityCoeff={scoring.intensityCoeff}
                      variant="pill"
                      size="sm"
                      showCoeff
                      className="today-ref-stars"
                    />
                  ) : (
                    <ReferenceDifficultyStars
                      stars={Math.min(8, Math.max(1, coefStarCount))}
                      intensityCoeff={loadCoeff}
                      variant="pill"
                      size="sm"
                      showCoeff
                      className="today-ref-stars"
                      title="Difficulté estimée (hors référentiel)"
                    />
                  )}
                </div>

                <div className="today-ex-meta">
                  <b>{exercise.series}</b>
                  {exercise.materiel ? ` · ${exercise.materiel}` : ''}
                  {resolveProgramExerciseNotes(exercise)
                    ? ` · ${resolveProgramExerciseNotes(exercise)}`
                    : ''}
                </div>
                <button
                  type="button"
                  onClick={() => openSeriesAdaptForExercise(exercise)}
                  className="today-ex-link"
                  title={t(
                    'today.seriesAdapt.openTitle',
                    'Modifier séries × reps pour aujourd’hui'
                  )}
                >
                  <PenLine className="w-3.5 h-3.5 shrink-0 inline" />
                  {' '}
                  {t('today.seriesAdapt.short', 'Séries & reps du jour')}
                </button>

                <div className="flex flex-col gap-2 min-w-0">
                  <div className="today-ex-fields">
                    <div className="today-field">
                      <label>{String(inputLabel).toUpperCase()}</label>
                      {exerciseUnit?.isTimeBased ? (
                        <ExerciseTimeInput
                          unit={exerciseUnit.unit === 'min' ? 'min' : 'sec'}
                          value={reps}
                          onChange={(next) =>
                            updateLocalReps(primaryKeyForStars, next === '' ? '' : String(next))
                          }
                          className={
                            isChecked
                              ? '[&_input]:bg-green-600/20 [&_input]:border-green-500 [&_input]:text-green-300'
                              : ''
                          }
                        />
                      ) : (
                        <TodaySessionTextField
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          placeholder={inputPlaceholder}
                          value={reps}
                          onCommitSilent={(next) => updateLocalReps(primaryKeyForStars, next)}
                          className={`w-full text-center ${isChecked ? 'bg-green-600/20 border-green-500 text-green-300' : 'bg-black border-[#0F4C5C]/50 text-white'}`}
                          size="sm"
                        />
                      )}
                    </div>
                    {showWeightField && (
                      <div className="today-field">
                        <label>{t('today.exercises.weightFieldLabel', 'Poids')}</label>
                        <TodaySessionTextField
                          type="text"
                          inputMode="decimal"
                          autoComplete="off"
                          placeholder="kg"
                          value={weightStr}
                          onCommitSilent={(next) =>
                            updateLocalExerciseWeight(primaryKeyForStars, next)
                          }
                          className={`w-full text-center ${isChecked ? 'bg-green-600/20 border-green-500 text-green-300' : 'bg-black border-[#0F4C5C]/50 text-white'}`}
                          size="sm"
                        />
                      </div>
                    )}
                  </div>
                  {volumeCompletion?.status === 'complete' ? (
                    <span className="text-[10px] text-green-400 whitespace-nowrap">✓ objectif</span>
                  ) : null}
                  {volumeCompletion?.status === 'near' ? (
                    <span className="text-[10px] text-amber-400 whitespace-nowrap">
                      −{volumeCompletion.gap} {inputLabel}
                    </span>
                  ) : null}
                  {volumeCompletion?.status === 'below' && volumeCompletion.planned ? (
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">
                      {volumeCompletion.done}/{volumeCompletion.planned}
                    </span>
                  ) : null}
                    {weightUiMode?.mode === 'optional' && (
                      <label className="today-ex-subcheck">
                        <Checkbox
                          checked={markedWeighted}
                          onChange={(e) =>
                            updateLocalExerciseMarkedWeighted(primaryKeyForStars, e.target.checked, exercise.id)
                          }
                          className="scale-90 text-violet-400"
                          name={`weighted_${exercise.id}`}
                        />
                        {t('today.exercises.optionalWeighted', 'Lesté')}
                      </label>
                    )}

                  {showWeightField && exerciseIsDumbbellEquipment(exercise) && (
                    <label className="today-ex-subcheck">
                      <Checkbox
                        checked={resolveExerciseWeightPerArm(currentData, keys, readKey)}
                        onChange={(e) =>
                          updateLocalExerciseWeightPerArm(primaryKeyForStars, e.target.checked, exercise.id)
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
                                <TodaySessionTextField
                                  type="text"
                                  inputMode="decimal"
                                  autoComplete="off"
                                  value={sw != null ? String(sw) : ''}
                                  onCommitSilent={(next) =>
                                    updateExerciseSetWeightAtIndex(
                                      primaryKeyForStars,
                                      idx,
                                      next,
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
                            onClick={() => clearExerciseSetWeightsForExercise(primaryKeyForStars, exercise.id)}
                          className="today-ex-link text-left w-fit"
                          >
                            {t('today.exercises.perSetReset')}
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => initExerciseSetWeightsFromSeries(primaryKeyForStars, exercise)}
                          className="today-ex-link text-left w-fit"
                        >
                          {t('today.exercises.perSetOpen')}
                        </button>
                      )}
                    </div>
                  )}

                  {isChecked && inferDefaultSetCount(exercise, 0) > 1 && !exerciseUnit?.isTimeBased && (
                    <ExerciseSetDetailPanel
                      storageKey={readKey}
                      exercise={exercise}
                      getWorkoutData={getCurrentData}
                      onApply={(next) => updateTempExerciseData(next, { silent: true })}
                      perArm={resolveExerciseWeightPerArm(currentData, keys, readKey)}
                      onPerArmChange={(checked) =>
                        updateLocalExerciseWeightPerArm(primaryKeyForStars, checked, exercise.id)
                      }
                      isChecked={isChecked}
                      t={t}
                    />
                  )}

                  {isChecked && (
                    <CollapsibleSessionPerceived
                      label={t('today.exercises.sessionEffortLabel', 'Ressenti de la séance')}
                      expanded={expandedPerceivedIds.has(String(exercise.id))}
                      onToggle={() => togglePerceivedPanel(exercise.id)}
                      idPrefix={`today-ex-${exercise.id}`}
                      persistedDraft={pickStoredSessionPerceived(
                        currentData,
                        keys,
                        primaryKeyForStars
                      )}
                      suggestedStars={sessionEffortStars ?? coefStarCount}
                      onChange={(draft, overall) => updateSessionPerceivedToday(exercise, draft, overall)}
                    />
                  )}
                </div>
              </div>
            );
            }}
            </IsolatedTodayExerciseCard>
            ))}
          </div>
          <div>

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
                          {resolveProgramExerciseNotes(exercise) && ` • ${resolveProgramExerciseNotes(exercise)}`}
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
                className="today-cta-add gradient-button-premium gradient-button-premium-md rounded-lg w-full flex items-center justify-center gap-2"
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
                {(() => {
                  const complementaryId = `complementary_${workout.complementaryActivity.name.toLowerCase()}`;
                  const complementaryDataChecked = !!sessionSnapshot.checkedExercises?.[`${dateStr}_${complementaryId}`];
                  const complementaryChecked = complementaryDataChecked;
                  return (
                <TodayExerciseCheck
                  exerciseId={complementaryId}
                  checked={complementaryChecked}
                  onToggle={(shouldCheck) => queueExerciseCheck(complementaryId, currentDate, shouldCheck)}
                  className="text-teal-400"
                  name={complementaryId}
                />
                  );
                })()}
                
                {/* Saisie durée (min + sec) */}
                <div className="flex items-center space-x-2">
                  <ExerciseTimeInput
                    unit="min"
                    value={
                      sessionSnapshot.reps[
                        `${dateStr}_complementary_${workout.complementaryActivity.name.toLowerCase()}_minutes`
                      ] || ''
                    }
                    onChange={(next) =>
                      updateReps(
                        `complementary_${workout.complementaryActivity.name.toLowerCase()}_minutes`,
                        next === '' ? '' : String(next),
                        currentDate
                      )
                    }
                  />
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
          </>
          )}
          </TodayDraftReader>
        )}

        <TodaySessionCommitBar
          kind="exercises"
          onSave={handleSaveExercises}
          onDiscard={handleDiscardExercises}
          unsavedLabel={t('today.exercises.unsavedChanges')}
          discardLabel={t('today.exercises.discard')}
          saveLabel={t('today.exercises.save')}
          savingLabel={t('today.exercises.saving', 'Enregistrement…')}
        />
      </div>

      <div>
        <div className="today-section-head">
          <h2 className="today-section-title">
            {t('today.challengesSection.title', 'Défis & routines complémentaires')}
          </h2>
        </div>
        <div className="today-challenge-row">
        <PushupChallengeTodayPanel date={currentDate} />
        <GtgTodaySchedulePanel date={currentDate} />
        </div>
      </div>

      {/* Étirements — UNE carte par étirement individuel, groupé par moment.
         La granularité est par item (id stable depuis stretchDatabase) :
         chaque coche déclenche XP + complétion calendrier. */}
      {hasStretchesContent && (
        <div className="today-module bg-black p-6 rounded-xl shadow-xl border-2 border-[#0F4C5C]/70">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <span className="text-teal-400">🧘‍♂️</span>
              {t('today.stretches.titleOfDay')}
              <span className="today-section-count">
                · {countStretchItems(normalizedTodayStretches)}
              </span>
            </h3>
          </div>

          <StretchList
            stretches={resolvedWorkoutEtirements}
            date={currentDate}
            onAfterStretchDataChange={handleStretchDataChange}
          />

          {hasPlyometricsContent && (
            <PlyometricBlock pliometrie={workout.pliometrie} embedded />
          )}

          {hasDrillsContent && (
            <RunningDrillsBlock drillsCourse={workout.drillsCourse} embedded />
          )}

          <TodaySessionCommitBar
            kind="stretches"
            onSave={handleSaveStretches}
            onDiscard={handleDiscardStretches}
            unsavedLabel={t('today.exercises.unsavedChanges')}
            discardLabel={t('today.exercises.discard')}
            saveLabel={t('today.stretches.save')}
            savingLabel={t('today.stretches.saving', 'Enregistrement…')}
          />
        </div>
      )}

      {!hasStretchesContent && (hasPlyometricsContent || hasDrillsContent) && (
        <div className="bg-black p-6 rounded-xl shadow-xl border-2 border-[#0F4C5C]/70">
          {hasPlyometricsContent && <PlyometricBlock pliometrie={workout.pliometrie} />}
          {hasDrillsContent && (
            <RunningDrillsBlock
              drillsCourse={workout.drillsCourse}
              embedded={hasPlyometricsContent}
            />
          )}
        </div>
      )}

      {/* Sessions d'endurance du jour */}
      {(() => {
        const currentData = getCurrentData();
        const dataForCalendar = { ...currentData, enduranceData: normalizedEndurance };
        const { rows } = collectEnduranceSessionsForCalendarDay(dataForCalendar, dateStr);
        const todayEnduranceSessions = rows.map(({ activityType, session }) => ({
          ...session,
          activityType,
          activityName: {
            boxing: t('today.endurance.activities.boxing'),
            pushups: t('today.endurance.activities.pushups'),
            swimming: t('today.endurance.activities.swimming'),
            jumprope: t('today.endurance.activities.jumprope'),
            running: t('today.endurance.activities.running')
          }[activityType] || activityType
        }));
        
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
          className="today-btn-feedback mx-auto flex items-center justify-center gap-2 rounded-xl border-2 border-[#0F5C45]/55 bg-black px-8 py-3 text-base font-semibold text-teal-50 shadow-lg shadow-black/40 transition hover:border-[#0F5C45] hover:bg-[#0F4C5C]/25"
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
              {t('today.seriesAdapt.title', 'Séries × reps pour aujourd’hui')}
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