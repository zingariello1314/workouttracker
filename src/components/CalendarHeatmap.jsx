import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Activity, 
  Flame, 
  TrendingUp,
  Award,
  Target,
  Clock,
  Zap,
  BarChart3
} from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import { useAuth } from '../context/AuthContext';
import { isAdminUser } from '../utils/accessControl';
import { useToast } from './ui/Toast';
import { getDateStr, getDayName } from '../utils/dateUtils';
import JustificationModal from './modals/JustificationModal';
import { workoutProgram } from '../data/workoutProgram';
import { calculateAutoReps } from '../utils/exerciseCalculations';
import Input, { Checkbox } from './ui/Input';
import Button from './ui/Button';
import { Check, Save, Plus, X, Trash2, Pencil } from 'lucide-react';
import AddExceptionalExerciseModal from './modals/AddExceptionalExerciseModal';
import {
  calculateDayIntensityWithGarmin,
  getGarminActivityIcons,
  getGarminCardioMinutesByKindForDate
} from '../utils/garminCalendarUtils';
import {
  computeCalendarDayVisualContext,
  computeLiftVolumeRelativeVisualBoost01,
  CALENDAR_VISUAL_CONSTANTS,
  calendarDayHasPaintSignal
} from '../utils/calendarDayVisualModel';
import {
  isMockEnduranceSession,
  parseDurationToMinutes,
  normalizeDateString,
  calculateIntensityLevel,
  calculateTimeIntensityLevel,
  validateDuration,
  validateDate,
  validateNumericValue,
  collectEnduranceSessionsForCalendarDay
} from '../utils/calendarUtils';
import {
  paceMinPerKmFromSession,
  parseRunningSessionDurationMinutes,
  formatPaceMinPerKm
} from '../utils/runningPersonalRecords';
import {
  resolveRunningSessionDisplayType,
  runningSessionTypeLabel
} from '../utils/runningSessionTypeLabel';
import {
  inferRunningSessionTypeFromGarminActivity,
  shouldExcludeStoredGarminRunningSession
} from '../utils/garminRunningLaps';
import { isWalkingLikeRunningSession } from '../utils/runningSessionMovementKind';
import {
  buildDailyTrainingLoadByDate,
  resolveExerciseIntensityCoeff,
  getEnduranceLoadForDate,
  computeStrengthCalendarContribution,
  computeMedianWeightKgForExercise,
  computeExternalLoadMultiplier
} from '../utils/trainingLoadUtils';
import { exerciseUsesExternalLoad } from '../utils/programUtils';
import {
  computeVolumeKgReps,
  computeVolumeKgForWorkoutKey,
  aggregateLiftVolumeKgByDate
} from '../utils/exerciseLoadVolume';
import LoadDifficultyStars from './sport/LoadDifficultyStars';
import {
  getDayJustification,
  isDayWithoutActivity,
  JUSTIFICATION_REASONS,
  JUSTIFICATION_COLORS,
  JUSTIFICATION_DAY_NUMBER_CLASS,
  JUSTIFICATION_TEXT,
  JUSTIFICATION_ICONS
} from '../utils/dayJustificationUtils';
import { useTranslation } from '../utils/translations';
import { useLanguage } from '../context/LanguageContext';
import { loadTranslationNamespace } from '../utils/translations/loader';
import { useFormatters } from '../utils/translations/formatters-hook';
import { garminCardioKindEmoji, garminCardioPrimaryLabel } from '../utils/runningSessionTypeLabel';
import {
  collectCalendarRepKeysForExercise,
  resolveBestRepsStorageKey,
  generateStretchItemKey
} from '../utils/exerciseKeyGenerator';
import { buildPlannedStretchListForDateStr } from '../utils/programCompletionBonus';
import { calendarHeatmapCompositeBackground } from '../utils/calendarHeatmapTint';
import { normalizeManualDailyWalkByDate, mergedDailySteps } from '../utils/sport/manualDailyWalkUtils';
import {
  isSessionFeedbackFilled,
  normalizeDifficultyForCalendarModel,
  sessionFeedbackVisualBoost01,
  computeSessionFeedbackWeightedScore10
} from '../utils/sessionFeedbackUtils';
import {
  computeQuestIntensityForDate,
  createNeutralQuestIntensity,
  sumQuestXpForMonth,
} from '../utils/questCalendarMetrics';
import { applyRelativePerformanceTint } from '../utils/calendarRelativeDayRanking';
import {
  buildBooksSessionsByDate,
  computeBooksIntensityForDate,
  createNeutralBooksIntensity,
  sumBooksMinutesForMonth,
  sumBooksPagesForMonth,
} from '../utils/booksCalendarMetrics';
import {
  buildLearningSessionsByDate,
  sumLearningSessionsForMonth,
} from '../utils/apprentissageCalendarMetrics';
import BooksCalendarDayDetailPanel from './books/BooksCalendarDayDetailPanel';

/**
 * Fond des grands blocs : sport (noir + contour bleu), livres (noir + bleu vif), quêtes (noir + doré), apprentissage (noir + vert).
 * @param {'sport'|'quests'|'books'|'apprentissage'} variant
 * @param {'header'|'legend'|'month'|'wide'} slot
 */
function heatmapModuleShell(variant, isEmbed, slot) {
  if (variant === 'books') {
    if (isEmbed) {
      return slot === 'month'
        ? 'bg-black rounded-lg border-2 border-[#3A86FF] min-w-0 px-1.5 py-2'
        : 'bg-black rounded-lg border-2 border-[#3A86FF] min-w-0 px-2 py-1.5';
    }
    const pad = slot === 'header' || slot === 'legend' ? 'p-4' : 'p-6';
    return `bg-black rounded-xl border-2 border-[#3A86FF] text-sky-100 ${pad}`;
  }
  if (variant === 'apprentissage') {
    if (isEmbed) {
      return slot === 'month'
        ? 'bg-black rounded-lg border-2 border-emerald-500/60 min-w-0 px-1.5 py-2'
        : 'bg-black rounded-lg border-2 border-emerald-500/60 min-w-0 px-2 py-1.5';
    }
    const pad = slot === 'header' || slot === 'legend' ? 'p-4' : 'p-6';
    return `bg-black rounded-xl border-2 border-emerald-500/70 text-emerald-50 ${pad}`;
  }
  if (variant === 'quests') {
    if (isEmbed) {
      return slot === 'month'
        ? 'bg-black rounded-lg border-2 border-amber-400/70 min-w-0 px-1.5 py-2'
        : 'bg-black rounded-lg border-2 border-amber-400/70 min-w-0 px-2 py-1.5';
    }
    const pad = slot === 'header' || slot === 'legend' ? 'p-4' : 'p-6';
    return `bg-black rounded-xl border-2 border-amber-400/75 text-amber-50 ${pad}`;
  }
  if (isEmbed) {
    return slot === 'month'
      ? 'min-w-0 rounded-lg border border-blue-500/50 bg-black px-1.5 py-2'
      : 'min-w-0 rounded-lg border border-blue-500/50 bg-black px-2 py-1.5';
  }
  const pad = slot === 'header' || slot === 'legend' ? 'p-4' : 'p-6';
  return `rounded-xl border-2 border-blue-500/55 bg-black text-sky-100 ${pad}`;
}

/** Grille mini « vue année » : même logique visuelle que le dashboard / livres, avec teinte par domaine. */
function yearMiniGridShell(variant) {
  if (variant === 'quests') return 'bg-black border-2 border-amber-400/70 rounded-lg p-2';
  if (variant === 'books') return 'bg-black border-2 border-[#3A86FF] rounded-lg p-2';
  if (variant === 'apprentissage') return 'bg-black border-2 border-emerald-500/60 rounded-lg p-2';
  return 'rounded-lg border-2 border-blue-500/50 bg-black p-2';
}

/**
 * Classes Tailwind pour les niveaux 0–4 (légende + repli sans dégradé HSL).
 * 0 = blanc (aucune donnée). 1 = vert très clair → 2 jaune → 3 orange → 4 rouge foncé.
 */
function getIntensityColor(level, isToday = false) {
  const safe = Math.max(0, Math.min(4, Math.round(Number(level) || 0)));
  const baseColors = {
    4: 'bg-red-900 border-red-700/90',
    3: 'bg-orange-600 border-orange-500/90',
    2: 'bg-yellow-500 border-yellow-600/85',
    1: 'bg-emerald-200 border-emerald-500/70',
    0: 'bg-black border-2 border-blue-500/55',
  };
  const todayRing = isToday ? ' ring-2 ring-amber-300/95' : '';
  return `${baseColors[safe]}${todayRing}`;
}

/** Texte du chiffre du jour : toujours noir (lisibilité uniforme sur toutes les teintes). */
function heatmapDayNumberTone() {
  return 'text-black';
}

/** Métriques Garmin quotidiennes : évite le panneau « choix » sur un jour déjà « vécu ». */
function hasMeaningfulGarminDailyMetrics(garminData, dateStr, manualSteps = 0) {
  if (!dateStr) return false;
  const dm = garminData?.dailyMetrics?.[dateStr];
  const steps = mergedDailySteps(dm?.steps, manualSteps);
  const kcal = Number(dm?.calories?.active) || 0;
  const mod = Number(dm?.intensityMinutes?.moderate) || 0;
  const vig = Number(dm?.intensityMinutes?.vigorous) || 0;
  const tot =
    dm?.intensityMinutes?.total != null && Number.isFinite(Number(dm.intensityMinutes.total))
      ? Number(dm.intensityMinutes.total)
      : mod + vig;
  return steps >= 180 || kcal >= 22 || tot >= 1;
}

const CalendarHeatmap = ({
  workoutHistory = [],
  garminData = null,
  initialViewMode = 'year', // 'month', 'year', 'streaks'
  compact = false,
  /** Réduit typo / grilles / légende pour calendrier dans la sidebar (avec compact) */
  embedInSidebar = false,
  /** 'sport' | 'quests' | 'books' | 'apprentissage' */
  variant = 'sport',
  /** Requis si variant === 'quests' : { validationsByDate, validations?, allQuests, getQuestsForDate, prayerLocation? } */
  questCalendarContext = null,
  /** Requis si variant === 'books' : { sessionsByDate } ou { books } */
  booksCalendarContext = null,
  /** Requis si variant === 'apprentissage' : { sessionsByDate?: Map, sessionsHistory?: array } */
  apprentissageCalendarContext = null,
}) => {
  const isSidebarEmbed = Boolean(compact && embedInSidebar);
  const isQuestsOrBooks =
    variant === 'quests' || variant === 'books' || variant === 'apprentissage';
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState(
    compact ? 'month' : initialViewMode || 'year'
  ); // 'month', 'year', 'streaks'
  const [selectedDate, setSelectedDate] = useState(null);
  /** Après un clic sur une case : afficher le nombre de pas sur la tuile (si Garmin a des pas). */
  const [stepsRevealedByDateStr, setStepsRevealedByDateStr] = useState({});
  const [showStats, setShowStats] = useState(false);
  // ✅ NOUVEAU : État pour la modal de justification (gardée pour l'édition)
  const [justificationModalDate, setJustificationModalDate] = useState(null);
  // ✅ NOUVEAU : Mode d'affichage du panneau : 'details' | 'choice' | 'workout-entry' | 'justification'
  const [panelMode, setPanelMode] = useState('details');
  const [panelDate, setPanelDate] = useState(null);
  // ✅ États pour la saisie de séance
  const [selectedProgramId, setSelectedProgramId] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null); // 'maison' | 'salle_semaineA' | 'salle_semaineB'
  const [workout, setWorkout] = useState(null);
  const [repsData, setRepsData] = useState({});
  const [checkedExercises, setCheckedExercises] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [dataUpdateTrigger, setDataUpdateTrigger] = useState(0); // ✅ NOUVEAU : Pour forcer le re-render après sauvegarde
  /** Jour du programme (lundi… dimanche) dont on affiche les exercices ; la sauvegarde reste sur la date du calendrier. */
  const [workoutEntryTemplateDay, setWorkoutEntryTemplateDay] = useState(null);
  const [showCalendarExceptionalModal, setShowCalendarExceptionalModal] = useState(false);
  /** Édition des reps depuis le détail jour (clé `dateStr_id` ou variante semaine). */
  const [editingRepsStorageKey, setEditingRepsStorageKey] = useState(null);
  const [editingRepsDraft, setEditingRepsDraft] = useState('');

  // Récupérer les données du contexte pour le calcul du temps réel
  const {
    data,
    getCurrentData,
    getTodayWorkout,
    programs,
    getExerciseNameById,
    activeProgram,
    getEffectiveRestDayForDate,
    updateReps,
    toggleCheck,
    updateData,
    removeExceptionalExercise,
    markExceptionalExerciseComplete,
    hasUnsavedExercises,
    hasUnsavedStretches,
    replaceDraftWorkoutData
  } = useWorkout();
  const { currentUser, isAuthenticated } = useAuth();
  const { showSuccess, showError } = useToast();
  const isAdmin = isAdminUser(currentUser);
  
  // ✅ Initialiser le programme actif quand on entre en mode workout-entry
  useEffect(() => {
    if (panelMode === 'workout-entry' && !selectedProgramId) {
      if (activeProgram) {
        setSelectedProgramId(activeProgram.id);
      } else if (isAdmin && isAuthenticated) {
        setSelectedProgramId('default');
      }
    }
  }, [panelMode, selectedProgramId, activeProgram, isAdmin, isAuthenticated]);

  useEffect(() => {
    if (!selectedDate) {
      setEditingRepsStorageKey(null);
      setEditingRepsDraft('');
    }
  }, [selectedDate]);

  const workoutEntryTargetDateStr =
    panelMode === 'workout-entry' ? getDateStr(selectedDate?.date || panelDate || null) : null;

  useEffect(() => {
    if (panelMode !== 'workout-entry' || !workoutEntryTargetDateStr) return;
    const d = selectedDate?.date || panelDate;
    if (!d) return;
    setWorkoutEntryTemplateDay(getDayName(d));
  }, [panelMode, workoutEntryTargetDateStr, selectedDate?.date, panelDate]);

  // ✅ NOUVEAU : Initialiser selectedVariant quand on entre en mode workout-entry et qu'un programme est sélectionné
  useEffect(() => {
    if (panelMode === 'workout-entry' && selectedProgramId && panelDate && !selectedVariant) {
      const templateDay = workoutEntryTemplateDay || getDayName(panelDate);
      let firstVariantId = null;
      
      if (selectedProgramId === 'default' && isAdmin && isAuthenticated) {
        const dayWorkout = workoutProgram[templateDay];
        if (dayWorkout) {
          firstVariantId = 'maison'; // Toujours commencer par maison
        }
      } else if (selectedProgramId && programs) {
        const program = programs.find(p => p.id === selectedProgramId);
        if (program && program.schedule && program.schedule[templateDay]) {
          firstVariantId = 'maison'; // Toujours commencer par maison
        }
      }
      
      if (firstVariantId) {
        setSelectedVariant(firstVariantId);
      }
    }
  }, [panelMode, selectedProgramId, panelDate, isAdmin, isAuthenticated, programs, selectedVariant, workoutEntryTemplateDay]);
  
  // ✅ Initialiser les données de reps quand le workout change
  useEffect(() => {
    if (panelMode === 'workout-entry' && workout && workout.exercices && panelDate) {
      const dateStr = getDateStr(panelDate);
      const allDataForEntry = getCurrentData();
      const initialReps = {};
      const initialChecked = {};
      
      workout.exercices.forEach(exercise => {
        const keys = collectCalendarRepKeysForExercise(dateStr, exercise);
        const finalKey =
          resolveBestRepsStorageKey(allDataForEntry, keys) || `${dateStr}_${exercise.id}`;
        initialReps[exercise.id] = allDataForEntry.reps?.[finalKey] || '';
        initialChecked[exercise.id] = allDataForEntry.checkedExercises?.[finalKey] || false;
      });
      
      setRepsData(initialReps);
      setCheckedExercises(initialChecked);
    }
  }, [panelMode, workout, panelDate, selectedVariant, getCurrentData, getDateStr, dataUpdateTrigger]);
  // Utiliser getCurrentData() pour accéder aux données actuelles (temp + sauvegardées)
  // ✅ NOUVEAU : Recalculer allData quand dataUpdateTrigger change pour avoir les données les plus récentes
  const allData = useMemo(() => getCurrentData(), [dataUpdateTrigger, getCurrentData, data]);

  const liftVolumeByDateMap = useMemo(() => {
    if (variant !== 'sport') return null;
    return aggregateLiftVolumeKgByDate(allData);
  }, [variant, allData]);
  
  // ✅ NOUVEAU : Traductions
  const t = useTranslation();
  const { language } = useLanguage();
  const { formatDate: formatLocaleDate } = useFormatters();

  useEffect(() => {
    const lang = language || 'fr';
    loadTranslationNamespace(lang, 'calendar').catch(() => {});
    loadTranslationNamespace(lang, 'endurance').catch(() => {});
  }, [language]);

  // ✅ PHASE 2.3 : Cache pour les intensités calculées (useRef pour persister entre renders)
  const intensityCache = useRef({});

  const questIntensityMap = useMemo(() => {
    if (variant !== 'quests' || !questCalendarContext || compact) return null;
    const year = currentDate.getFullYear();
    const raw = new Map();
    const cursor = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
    while (cursor <= end) {
      const dateStr = getDateStr(cursor);
      raw.set(dateStr, computeQuestIntensityForDate(dateStr, questCalendarContext));
      cursor.setDate(cursor.getDate() + 1);
    }
    return applyRelativePerformanceTint(raw, viewMode, currentDate, {
      getScore: (int) => Number(int.intensityScore) || 0,
      hasActivity: (int) => (int.questData?.completedCount ?? 0) > 0,
    });
  }, [variant, questCalendarContext, currentDate, compact, viewMode]);

  const booksIntensityMap = useMemo(() => {
    if (variant !== 'books' || !booksCalendarContext || compact) return null;
    const sessionsByDate =
      booksCalendarContext.sessionsByDate ||
      buildBooksSessionsByDate(booksCalendarContext.books || []);
    const year = currentDate.getFullYear();
    const raw = new Map();
    const cursor = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
    const dayFb =
      booksCalendarContext.dayFeedbacks && typeof booksCalendarContext.dayFeedbacks === 'object'
        ? booksCalendarContext.dayFeedbacks
        : null;
    while (cursor <= end) {
      const dateStr = getDateStr(cursor);
      raw.set(dateStr, computeBooksIntensityForDate(dateStr, sessionsByDate, dayFb));
      cursor.setDate(cursor.getDate() + 1);
    }
    return applyRelativePerformanceTint(raw, viewMode, currentDate, {
      getScore: (int) => Number(int.intensityScore) || 0,
      hasActivity: (int) => (int.bookData?.sessions ?? 0) > 0,
    });
  }, [variant, booksCalendarContext, currentDate, compact, viewMode]);

  const learningIntensityMap = useMemo(() => {
    if (variant !== 'apprentissage' || !apprentissageCalendarContext || compact) return null;
    const sessionsByDate =
      apprentissageCalendarContext.sessionsByDate ||
      buildLearningSessionsByDate(apprentissageCalendarContext.sessionsHistory || []);
    const year = currentDate.getFullYear();
    const raw = new Map();
    const cursor = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
    while (cursor <= end) {
      const dateStr = getDateStr(cursor);
      raw.set(dateStr, computeBooksIntensityForDate(dateStr, sessionsByDate, null));
      cursor.setDate(cursor.getDate() + 1);
    }
    return applyRelativePerformanceTint(raw, viewMode, currentDate, {
      getScore: (int) => Number(int.intensityScore) || 0,
      hasActivity: (int) => (int.bookData?.sessions ?? 0) > 0,
    });
  }, [variant, apprentissageCalendarContext, currentDate, compact, viewMode]);

  const learningYearAggregates = useMemo(() => {
    if (variant !== 'apprentissage' || !learningIntensityMap) return null;
    let totalMinutes = 0;
    let totalSessions = 0;
    let activeDays = 0;
    let bestDay = null;
    let bestScore = -1;
    const monthMinutes = Array(12).fill(0);
    for (const [ds, inten] of learningIntensityMap.entries()) {
      const bd = inten?.bookData;
      if (!bd || bd.sessions <= 0) continue;
      totalMinutes += bd.minutes || 0;
      totalSessions += bd.sessions || 0;
      activeDays += 1;
      const score = Number(inten.intensityScore) || 0;
      if (score > bestScore) {
        bestScore = score;
        bestDay = { dateStr: ds, bd };
      }
      const mi = parseInt(ds.slice(5, 7), 10) - 1;
      if (mi >= 0 && mi < 12) monthMinutes[mi] += bd.minutes || 0;
    }
    let bestMonthIdx = -1;
    let bestMonthMinutes = -1;
    for (let m = 0; m < 12; m++) {
      const x = monthMinutes[m];
      if (x > 0 && x > bestMonthMinutes) {
        bestMonthMinutes = x;
        bestMonthIdx = m;
      }
    }
    return {
      totalMinutes,
      totalSessions,
      activeDays,
      bestDay,
      bestMonthIdx,
      bestMonthMinutes,
    };
  }, [variant, learningIntensityMap]);

  const learningSessionsByDateResolved = useMemo(() => {
    if (variant !== 'apprentissage' || !apprentissageCalendarContext) return null;
    return (
      apprentissageCalendarContext.sessionsByDate ||
      buildLearningSessionsByDate(apprentissageCalendarContext.sessionsHistory || [])
    );
  }, [variant, apprentissageCalendarContext]);

  const questYearAggregates = useMemo(() => {
    if (variant !== 'quests' || !questIntensityMap) return null;
    let totalXp = 0;
    let totalMinutes = 0;
    let totalChecks = 0;
    let activeDays = 0;
    let bestDay = null;
    let bestScore = -1;
    const monthXp = Array(12).fill(0);
    for (const [ds, inten] of questIntensityMap.entries()) {
      const qd = inten?.questData;
      if (!qd) continue;
      totalXp += qd.xpTotal || 0;
      totalMinutes += qd.minutesOccupied || 0;
      totalChecks += qd.completedCount || 0;
      if ((qd.completedUnique || 0) > 0) activeDays += 1;
      const score = (qd.xpTotal || 0) + (qd.minutesOccupied || 0) * 1.5 + (qd.completedUnique || 0) * 20;
      if (score > bestScore) {
        bestScore = score;
        bestDay = { dateStr: ds, qd };
      }
      const mi = parseInt(ds.slice(5, 7), 10) - 1;
      if (mi >= 0 && mi < 12) monthXp[mi] += qd.xpTotal || 0;
    }
    let bestMonthIdx = -1;
    let bestMonthXp = -1;
    for (let m = 0; m < 12; m++) {
      const x = monthXp[m];
      if (x > 0 && x > bestMonthXp) {
        bestMonthXp = x;
        bestMonthIdx = m;
      }
    }
    return {
      totalXp,
      totalMinutes,
      totalChecks,
      activeDays,
      bestDay,
      bestMonthIdx,
      bestMonthXp,
      monthXp,
    };
  }, [variant, questIntensityMap]);

  const booksYearAggregates = useMemo(() => {
    if (variant !== 'books' || !booksIntensityMap) return null;
    let totalPages = 0;
    let totalMinutes = 0;
    let totalSessions = 0;
    let activeDays = 0;
    let bestDay = null;
    let bestScore = -1;
    const monthPages = Array(12).fill(0);
    for (const [ds, inten] of booksIntensityMap.entries()) {
      const bd = inten?.bookData;
      if (!bd || bd.sessions <= 0) continue;
      totalPages += bd.pages || 0;
      totalMinutes += bd.minutes || 0;
      totalSessions += bd.sessions || 0;
      activeDays += 1;
      const score = Number(inten.intensityScore) || 0;
      if (score > bestScore) {
        bestScore = score;
        bestDay = { dateStr: ds, bd };
      }
      const mi = parseInt(ds.slice(5, 7), 10) - 1;
      if (mi >= 0 && mi < 12) monthPages[mi] += bd.pages || 0;
    }
    let bestMonthIdx = -1;
    let bestMonthPages = -1;
    for (let m = 0; m < 12; m++) {
      const x = monthPages[m];
      if (x > 0 && x > bestMonthPages) {
        bestMonthPages = x;
        bestMonthIdx = m;
      }
    }
    return {
      totalPages,
      totalMinutes,
      totalSessions,
      activeDays,
      bestDay,
      bestMonthIdx,
      bestMonthPages,
    };
  }, [variant, booksIntensityMap]);

  // ✅ PHASE 2.3 : Invalider le cache lorsque les données sources changent
  useEffect(() => {
    // Vider le cache lorsque allData change (les données sources ont changé)
    // ✅ NOUVEAU : Invalider aussi si les justifications changent
    intensityCache.current = {};
  }, [
    allData,
    garminData,
    allData?.dayJustifications,
    allData?.sessionFeedbacks,
    variant,
    questIntensityMap,
    booksIntensityMap,
    learningIntensityMap,
  ]);

  // Fonction pour obtenir le nom du jour
  const getDayName = (date) => {
    const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    return days[date.getDay()];
  };

  // ✅ PHASE 2.1 : Mémoriser les seuils dynamiques basés sur toutes les données existantes
  // Recalcul uniquement si allData.reps change (évite les recalculs inutiles)
  const dynamicThresholds = useMemo(() => {
    if (!allData?.reps) return { min: 0, max: 100, thresholds: [0, 25, 50, 75, 100] };
    
    // Récupérer toutes les répétitions par jour
    const dailyReps = {};
    Object.keys(allData.reps).forEach(key => {
      const reps = parseInt(allData.reps[key]) || 0;
      if (reps > 0) {
        const dateMatch = key.match(/^(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          const date = dateMatch[1];
          dailyReps[date] = (dailyReps[date] || 0) + reps;
        }
      }
    });
    
    const repValues = Object.values(dailyReps).filter(reps => reps > 0);
    
    if (repValues.length === 0) {
      return { min: 0, max: 100, thresholds: [0, 25, 50, 75, 100] };
    }
    
    const min = Math.min(...repValues);
    const max = Math.max(...repValues);
    
    // Créer des seuils proportionnels
    const range = max - min;
    const thresholds = [
      0, // Pas d'exercice
      min, // Minimum enregistré (vert)
      min + range * 0.33, // Modéré (jaune)
      min + range * 0.66, // Intense (orange)
      max // Maximum (rouge)
    ];
    
    return { min, max, thresholds, dailyReps };
  }, [allData?.reps]);

  // Seuils dynamiques basés sur la charge pondérée (alignés sur buildDailyTrainingLoadByDate)
  const dynamicLoadThresholds = useMemo(() => {
    const dailyLoad = buildDailyTrainingLoadByDate(allData, getExerciseNameById);
    const values = Object.values(dailyLoad).filter((v) => v > 0);
    if (values.length === 0) {
      return { min: 0, max: 100, thresholds: [0, 25, 50, 75, 100], dailyLoad };
    }
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const thresholds = [0, min, min + range * 0.33, min + range * 0.66, max];
    return { min, max, thresholds, dailyLoad };
  }, [allData, getExerciseNameById]);

  // ✅ PHASE 1 : Utiliser la fonction centralisée depuis calendarUtils
  // calculateDynamicIntensityLevel remplacé par calculateIntensityLevel (importée)

  // ✅ PHASE 2.2 : Mémoriser les seuils dynamiques pour la durée (temps)
  // Recalcul uniquement si allData.checkedExercises, allData.enduranceData.sessions, ou allData.reps change
  const dynamicTimeThresholds = useMemo(() => {
    if (!allData) return { min: 0, max: 0, thresholds: [0, 30, 60, 90] };
    
    const durations = [];
    
    // Collecter toutes les durées des activités complémentaires et d'endurance
    Object.keys(allData.checkedExercises || {}).forEach(key => {
      if (allData.checkedExercises[key]) {
        const dateMatch = key.match(/^(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          const dateStr = dateMatch[1];
          const dayDate = new Date(dateStr);
          const dayName = getDayName(dayDate);
          // ✅ Utiliser getTodayWorkout pour obtenir le workout du jour (inclut le programme actif)
          const workoutRaw = getTodayWorkout ? getTodayWorkout(dayDate, false) : (workoutProgram[dayName] || null);
          const workout = workoutRaw ? {
            ...workoutRaw,
            exercices: workoutRaw.exercices || workoutRaw.exercises || [],
            salleVariants: workoutRaw.salleVariants,
            complementaryActivity: workoutRaw.complementaryActivity
          } : null;
          
          if (workout?.complementaryActivity) {
            const complementaryKey = `${dateStr}_complementary_${workout.complementaryActivity.name.toLowerCase()}`;
            if (allData.checkedExercises[complementaryKey]) {
              const minutesKey = `${dateStr}_complementary_${workout.complementaryActivity.name.toLowerCase()}_minutes`;
              const manualMinutes = parseInt(allData.reps?.[minutesKey] || 0);
              const duration = manualMinutes > 0 ? manualMinutes : workout.complementaryActivity.duration || 90;
              durations.push(duration);
            }
          }
        }
      }
    });
    
    // ✅ PHASE 1 : Utiliser la fonction centralisée depuis calendarUtils
    // isMockSessionForThresholds remplacé par isMockEnduranceSession (importée)
    
    const enduranceData = allData?.enduranceData || {};
    const enduranceSessions = enduranceData.sessions || {};
    Object.entries(enduranceSessions).forEach(([activityType, sessions]) => {
      if (Array.isArray(sessions)) {
        sessions.forEach(session => {
          // ✅ PHASE 1 : Exclure les sessions mock du calcul des seuils (fonction centralisée)
          if (isMockEnduranceSession(session)) {
            return; // Ignorer cette session mock
          }
          
          if (session.duration) {
            // ✅ PHASE 1 : Utiliser parseDurationToMinutes pour cohérence
            const durationMinutes = parseDurationToMinutes(session.duration, 'calculateDynamicTimeThresholds');
            
            if (durationMinutes > 0) {
              durations.push(Math.round(durationMinutes));
            }
          }
        });
      }
    });
    
    if (durations.length === 0) {
      return { min: 0, max: 0, thresholds: [0, 30, 60, 90] };
    }
    
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    
    // Calculer les seuils basés sur les données réelles
    const thresholds = [
      min, // Niveau 1 (vert) - minimum
      min + (max - min) * 0.25, // Niveau 2 (jaune) - 25%
      min + (max - min) * 0.5,  // Niveau 3 (orange) - 50%
      min + (max - min) * 0.75  // Niveau 4 (rouge) - 75%
    ];
    
    return { min, max, thresholds };
  }, [allData?.checkedExercises, allData?.enduranceData?.sessions, allData?.reps]);

  /** Médiane des kcal actives Garmin (référence pour teintes calendrier). */
  const garminKcalMedianRef = useMemo(() => {
    if (!garminData?.dailyMetrics) return 0;
    const vals = Object.values(garminData.dailyMetrics)
      .map((d) => (d && typeof d.calories?.active === 'number' ? d.calories.active : 0))
      .filter((v) => v > 40)
      .sort((a, b) => a - b);
    if (vals.length === 0) return 420;
    const mid = Math.floor(vals.length / 2);
    return vals.length % 2 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2;
  }, [garminData?.dailyMetrics]);

  /** Médiane des pas (référence pour la part « volume quotidien » des teintes). */
  const garminStepsMedianRef = useMemo(() => {
    if (!garminData?.dailyMetrics) return 0;
    const vals = Object.values(garminData.dailyMetrics)
      .map((d) => (d && typeof d.steps === 'number' ? d.steps : 0))
      .filter((v) => v > 800)
      .sort((a, b) => a - b);
    if (vals.length === 0) return 7200;
    const mid = Math.floor(vals.length / 2);
    return vals.length % 2 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2;
  }, [garminData?.dailyMetrics]);

  // ✅ NOUVEAU : Fonction pour détecter une vraie activité Garmin (vs pas quotidiens)
  // Détecte une activité d'entraînement réelle basée sur des critères stricts
  const detectRealGarminActivity = (dateStr, garminData) => {
    if (!garminData || !dateStr) return { hasActivity: false, intensity: null, duration: 0 };
    
    // Critère 1 : Activités Garmin enregistrées (swimming, jumpRope, cardio) avec durée significative
    const swimming = (garminData.activities?.swimming || []).filter(a => a.date === dateStr);
    const jumpRope = (garminData.activities?.jumpRope || []).filter(a => a.date === dateStr);
    const cardio = (garminData.activities?.cardio || []).filter(a => a.date === dateStr);
    
    let totalActivityDuration = 0;
    
    // Calculer la durée totale des activités enregistrées
    [...swimming, ...jumpRope, ...cardio].forEach(act => {
      const duration = parseDurationToMinutes(act.duration || act.totalTime || 0, 'detectRealGarminActivity');
      if (duration > 0) {
        totalActivityDuration += duration;
      }
    });
    
    // Si on a des activités enregistrées avec durée > 10 minutes, c'est une vraie activité
    if (totalActivityDuration >= 10) {
      // Calculer l'intensité basée sur la durée
      const { thresholds: timeThresholds } = dynamicTimeThresholds;
      const intensity = calculateTimeIntensityLevel(totalActivityDuration, timeThresholds);
      return { hasActivity: true, intensity, duration: totalActivityDuration, source: 'activities' };
    }
    
    // Critère 2 : Calories actives significativement supérieures à la moyenne
    const dailyMetrics = garminData.dailyMetrics?.[dateStr];
    if (dailyMetrics?.calories?.active) {
      // Calculer la moyenne des calories actives sur 7 jours
      const dateObj = new Date(dateStr);
      const calories7Jours = [];
      for (let i = 1; i <= 7; i++) {
        const checkDate = new Date(dateObj);
        checkDate.setDate(checkDate.getDate() - i);
        const checkDateStr = getDateStr(checkDate);
        const cal = garminData.dailyMetrics?.[checkDateStr]?.calories?.active || 0;
        if (cal > 0) calories7Jours.push(cal);
      }
      const avgCalories = calories7Jours.length > 0 
        ? calories7Jours.reduce((sum, c) => sum + c, 0) / calories7Jours.length 
        : 0;
      
      // Si calories actives > 1.5x la moyenne ET > 300, c'est une vraie activité
      const currentCalories = dailyMetrics.calories.active;
      if (avgCalories > 0 && currentCalories > avgCalories * 1.5 && currentCalories > 300) {
        // Estimer la durée basée sur les calories (approximation : 10 cal/min pour activité modérée)
        const estimatedDuration = Math.round(currentCalories / 10);
        const { thresholds: timeThresholds } = dynamicTimeThresholds;
        const intensity = calculateTimeIntensityLevel(estimatedDuration, timeThresholds);
        return { hasActivity: true, intensity, duration: estimatedDuration, source: 'calories' };
      }
    }
    
    // Critère 3 : Minutes d'intensité significatives (> 20 minutes)
    if (dailyMetrics?.intensityMinutes?.total && dailyMetrics.intensityMinutes.total >= 20) {
      const intensityMinutes = dailyMetrics.intensityMinutes.total;
      // Utiliser les minutes d'intensité comme durée
      const { thresholds: timeThresholds } = dynamicTimeThresholds;
      const intensity = calculateTimeIntensityLevel(intensityMinutes, timeThresholds);
      return { hasActivity: true, intensity, duration: intensityMinutes, source: 'intensityMinutes' };
    }
    
    // Critère 4 : ActiveTime significatif (> 30 minutes) — atténué si la journée est surtout de la marche
    if (dailyMetrics?.activeTime && dailyMetrics.activeTime >= 30) {
      let effectiveActive = dailyMetrics.activeTime;
      const cardioKind = getGarminCardioMinutesByKindForDate(garminData, dateStr);
      const walkHeavy =
        cardioKind.walk >= (cardioKind.run + cardioKind.other + 5) * 1.35 &&
        cardioKind.run < 22 &&
        cardioKind.other < 25;
      const walkOnlyDay =
        cardioKind.total > 8 &&
        cardioKind.walk >= cardioKind.total * 0.72 &&
        cardioKind.run < 12;
      if (walkHeavy || walkOnlyDay) {
        effectiveActive = Math.min(effectiveActive * 0.36, 44);
      }
      const { thresholds: timeThresholds } = dynamicTimeThresholds;
      let intensity = calculateTimeIntensityLevel(effectiveActive, timeThresholds);
      if (walkHeavy || walkOnlyDay) {
        intensity = Math.min(intensity, 2);
      }
      return {
        hasActivity: true,
        intensity,
        duration: dailyMetrics.activeTime,
        source: 'activeTime'
      };
    }
    
    return { hasActivity: false, intensity: null, duration: 0 };
  };
  
  // ✅ PHASE 1 : Utiliser la fonction centralisée depuis calendarUtils
  // calculateDynamicTimeIntensityLevel remplacé par calculateTimeIntensityLevel (importée)
  const getIntensityForDate = (date, currentDataOverride = null) => {
    const dateStr = getDateStr(date);

    if (variant === 'quests' && questIntensityMap) {
      return questIntensityMap.get(dateStr) || createNeutralQuestIntensity();
    }
    if (variant === 'books' && booksIntensityMap) {
      return booksIntensityMap.get(dateStr) || createNeutralBooksIntensity();
    }
    if (variant === 'apprentissage' && learningIntensityMap) {
      return learningIntensityMap.get(dateStr) || createNeutralBooksIntensity();
    }

    // Données fraîches ; `currentDataOverride` évite un tour de render après updateData (getCurrentData peut encore pointer sur l’ancien brouillon).
    const currentData = currentDataOverride ?? getCurrentData();
    
    // ✅ PHASE 2.3 : Vérifier le cache avant de calculer (ignorer le cache si snapshot explicite)
    const cacheKey = dateStr;
    if (!currentDataOverride && intensityCache.current[cacheKey]) {
      const cached = intensityCache.current[cacheKey];
      // ✅ NOUVEAU : Ajouter justification si absente du cache (pour éviter recalcul)
      if (!cached.justification) {
        cached.justification = getDayJustification(currentData, dateStr);
      }
      return cached;
    }
    
    const dayName = getDayName(date);
    const effectiveRestDay =
      variant === 'sport' && activeProgram
        ? getEffectiveRestDayForDate(date, activeProgram, currentData)
        : null;
    const isPlannedRestDay = variant === 'sport' && !!effectiveRestDay && dayName === effectiveRestDay;
    
    // ✅ NOUVEAU : Récupérer les exercices de TOUS les programmes pour cette date
    const getAllExercisesForDate = () => {
      const allExercises = [];
      const exercisesIdsSeen = new Set();
      
      // 1. Ajouter les exercices du programme par défaut (workoutProgram)
      const defaultWorkout = workoutProgram[dayName];
      if (defaultWorkout?.exercices) {
        defaultWorkout.exercices.forEach(ex => {
          if (!exercisesIdsSeen.has(ex.id)) {
            exercisesIdsSeen.add(ex.id);
            allExercises.push({
              ...ex,
              programName: 'Cycle 3+1',
              programId: 'default'
            });
          }
        });
      }
      
      // 2. Ajouter les exercices de tous les programmes personnalisés
      if (programs && Array.isArray(programs)) {
        programs.forEach(program => {
          if (program.schedule && program.schedule[dayName]) {
            const daySchedule = program.schedule[dayName];
            if (daySchedule.exercises) {
              daySchedule.exercises.forEach((ex, index) => {
                // Convertir l'ID string en ID numérique (comme dans getTodayWorkoutWrapper)
                let numericId;
                if (typeof ex.id === 'string') {
                  let hash = 0;
                  for (let i = 0; i < ex.id.length; i++) {
                    const char = ex.id.charCodeAt(i);
                    hash = ((hash << 5) - hash) + char;
                    hash = hash & hash;
                  }
                  numericId = Math.abs(hash) + 10000;
                } else {
                  numericId = ex.id;
                }
                
                if (!exercisesIdsSeen.has(numericId)) {
                  exercisesIdsSeen.add(numericId);
                  allExercises.push({
                    id: numericId,
                    name: ex.name,
                    series: ex.series,
                    type: ex.type || 'standard',
                    materiel: ex.materiel || 'poids du corps',
                    notes: ex.notes || '',
                    programName: program.name || 'Programme personnalisé',
                    programId: program.id
                  });
                }
              });
            }
          }
        });
      }
      
      return allExercises;
    };
    
    let allExercisesForDate = getAllExercisesForDate();
    const plannedIds = new Set(allExercisesForDate.map(ex => ex.id));
    
    // ✅ Inclure les exercices enregistrés pour cette date mais d'un autre jour (ex. entraînement du lundi fait le vendredi)
    const prefix = `${dateStr}_`;
    const reps = currentData?.reps || {};
    const checked = currentData?.checkedExercises || {};
    [...Object.keys(reps), ...Object.keys(checked)].forEach(key => {
      if (!key.startsWith(prefix)) return;
      const rest = key.slice(prefix.length);
      const match = rest.match(/^(\d+)(?:_semaineA|_semaineB)?$/);
      if (match) {
        const id = parseInt(match[1], 10);
        if (!plannedIds.has(id)) {
          plannedIds.add(id);
          allExercisesForDate = [...allExercisesForDate, {
            id,
            name: getExerciseNameById ? getExerciseNameById(id) : `Exercice ${id}`,
            series: '',
            programName: 'Séance enregistrée',
            programId: 'recorded'
          }];
        }
      }
    });
    
    // Pour compatibilité avec le code existant, créer un workout "virtuel" avec tous les exercices
    const workout = allExercisesForDate.length > 0 ? {
      exercices: allExercisesForDate,
      name: 'Tous les programmes',
      isGymMode: false
    } : null;
    
    // ✅ LOGS DE DEBUG DÉSACTIVÉS pour réduire le bruit (33k messages)
    // Debug pour le 28 octobre 2025 (réactiver uniquement si nécessaire)
    // if (dateStr === '2025-10-28') {
    //   console.log('🔍 DEBUG CalendarHeatmap - 28 octobre 2025:');
    //   console.log('Date string:', dateStr);
    //   console.log('Day name:', dayName);
    //   console.log('Workout found:', workout?.name);
    //   console.log('All data:', allData);
    //   console.log('Checked exercises:', allData?.checkedExercises);
    //   console.log('Reps data:', allData?.reps);
    // }
    
    // ✅ PHASE 1 : Utiliser la fonction centralisée depuis calendarUtils
    // isMockSession remplacé par isMockEnduranceSession (importée)

    // Calculer les données d'endurance pour cette date
    // NOTE: Les sessions d'endurance détaillées n'impactent PAS l'intensité du calendrier
    // Elles servent uniquement à fournir des détails sur ce qui s'est passé
    const getEnduranceDataForDate = () => {
      const enduranceData = currentData?.enduranceData || {};
      const sessions = enduranceData.sessions || {};
      
      let enduranceReps = 0;
      let enduranceDuration = 0;
      let enduranceDistance = 0;
      let enduranceJumps = 0;
      let enduranceSessions = 0;
      
      // Parcourir toutes les activités d'endurance (pour les détails uniquement)
      // ✅ FIX : Filtrer les sessions mock
      Object.entries(sessions).forEach(([activityType, activitySessions]) => {
        if (Array.isArray(activitySessions)) {
          activitySessions.forEach(session => {
            // ✅ PHASE 1 : Exclure les sessions mock (fonction centralisée)
            if (isMockEnduranceSession(session)) {
              return; // Ignorer cette session mock
            }
            if (activityType === 'running' && shouldExcludeStoredGarminRunningSession(session)) {
              return;
            }
            // ✅ PHASE 4 : Valider la date (vérifier si future et normaliser)
            const dateValidation = validateDate(session.date, `getEnduranceDataForDate.${activityType}.${session.id || 'unknown'}`);
            const sessionDateStr = dateValidation.normalizedDate;
            
            // Ignorer les sessions avec dates futures (sauf si on veut les inclure pour le futur)
            if (dateValidation.isFuture) {
              return; // Ignorer cette session (date future)
            }
              
            // Comparer les dates normalisées
            if (sessionDateStr && sessionDateStr === dateStr) {
              enduranceSessions++;
              
              // ✅ CORRECTION : Ajouter les répétitions (pompes, boxe) - EXCLURE jumprope
              // Les sauts (jumprope) ne sont PAS des répétitions d'exercices, ils sont comptés séparément dans enduranceJumps
              // Seulement les activités avec count (pushups, boxing) ou reps (boxing) sont des répétitions
              // ✅ Les sessions créées depuis les défis (TodayTab) ont maintenant count ET reps (normalisé)
              // ✅ Les sessions créées depuis EnduranceTab ont count
              // ✅ Cette logique gère les deux cas : count (prioritaire) ou reps (fallback)
              if (activityType !== 'jumprope') {
                // Priorité : count > reps (pour éviter d'ajouter les deux si les deux existent)
                // Si count existe, l'utiliser (priorité pour cohérence avec EnduranceTab)
                // Sinon, utiliser reps (fallback pour compatibilité avec anciennes sessions ou défis)
                const rawReps = session.count !== undefined && session.count !== null
                  ? session.count
                  : (session.reps !== undefined && session.reps !== null ? session.reps : 0);
                // ✅ PHASE 4 : Valider la valeur numérique (rejette négatif, NaN)
                const repsValidation = validateNumericValue(rawReps, `getEnduranceDataForDate.${dateStr}.${activityType}.reps`, false);
                if (repsValidation.normalizedValue > 0) {
                  enduranceReps += repsValidation.normalizedValue;
                }
              }
              // ✅ PHASE 4 : Utiliser parseDurationToMinutes + validation centralisée
              if (session.duration) {
                const durationMinutes = parseDurationToMinutes(session.duration, `getEnduranceDataForDate.${dateStr}`);
                const durationValidation = validateDuration(durationMinutes, `getEnduranceDataForDate.${dateStr}.${activityType}.${session.id || 'unknown'}`);
                enduranceDuration += Math.round(durationValidation.clampedValue);
              }
              
              // ✅ PHASE 4 : Ajouter la distance avec validation
              if (session.distance) {
                const distValidation = validateNumericValue(session.distance, `getEnduranceDataForDate.${dateStr}.${activityType}.distance`, false);
                if (distValidation.normalizedValue > 0) {
                  enduranceDistance += distValidation.normalizedValue;
                }
              }
              if (session.laps && Array.isArray(session.laps)) {
                session.laps.forEach((lap, lapIdx) => {
                  const lapDistValidation = validateNumericValue(lap.distance, `getEnduranceDataForDate.${dateStr}.${activityType}.lap[${lapIdx}].distance`, false);
                  if (lapDistValidation.normalizedValue > 0) {
                    enduranceDistance += lapDistValidation.normalizedValue;
                  }
                });
              }
              
              // ✅ PHASE 4 : Ajouter les sauts avec validation
              // ✅ CORRECTION : Pour jumprope, les sauts peuvent être dans jumps OU reps
              if (activityType === 'jumprope') {
                const rawJumps = session.jumps || session.reps || 0;
                const jumpsValidation = validateNumericValue(rawJumps, `getEnduranceDataForDate.${dateStr}.jumprope.jumps`, false);
                if (jumpsValidation.normalizedValue > 0) {
                  enduranceJumps += jumpsValidation.normalizedValue;
                }
              } else if (session.jumps) {
                // Pour les autres activités, utiliser jumps si présent
                const jumpsValidation = validateNumericValue(session.jumps, `getEnduranceDataForDate.${dateStr}.${activityType}.jumps`, false);
                if (jumpsValidation.normalizedValue > 0) {
                  enduranceJumps += jumpsValidation.normalizedValue;
                }
              }
            }
          });
        }
      });
      
      // Arrondir la distance pour éviter les erreurs de précision flottante
      enduranceDistance = Math.round(enduranceDistance * 10) / 10;
      
      return {
        reps: enduranceReps,
        duration: enduranceDuration,
        distance: enduranceDistance,
        jumps: enduranceJumps,
        sessions: enduranceSessions
      };
    };
    
    const enduranceData = getEnduranceDataForDate();
    
    // Si pas d'exercices pour ce jour ET pas de données d'endurance, retourner des valeurs par défaut
    if (allExercisesForDate.length === 0 && enduranceData.sessions === 0) {
      return {
        level: 0,
        reps: 0,
        trainingLoad: 0,
        strengthLoad: 0,
        duration: 0,
        exerciseCount: 0,
        completedCount: 0,
        intensityScore: 0,
        programCompletionRatio: 0,
        programCheckedCount: 0,
        programPlannedCount: 0,
        enduranceData: enduranceData,
        activeKcal: 0,
        kcalRefMedian: garminKcalMedianRef,
        steps: 0,
        stepsRefMedian: garminStepsMedianRef,
        intensityMinutesTotal: 0,
        visualContext: null,
        isPlannedRestDay
      };
    }

    // ✅ NOUVEAU : Utiliser tous les exercices de tous les programmes (déjà récupérés dans getAllExercisesForDate)
    const exercisesList = allExercisesForDate;
    
    // ✅ CORRECTION : Calculer les répétitions totales de manière séquentielle et claire
    // Le total doit être : exercices classiques COCHÉS + reps d'endurance (pompes, boxe, défis complétés)
    let totalReps = 0; // ✅ CORRECTION : Commencer à 0 au lieu de enduranceData.reps
    let strengthLoad = 0; // Charge pondérée (reps × coefficient) — musculation / pdc
    let completedExercises = 0;
    let totalPlannedExercises = exercisesList.length;
    let exercisesReps = 0; // Pour debug : somme des reps des exercices classiques
    const plannedResolvedKeys = new Set();
    const adHocCompletedExercises = [];
    
    // ✅ ÉTAPE 1 : Calculer les répétitions des exercices classiques COCHÉS
    // Seulement les exercices avec checkedExercises = true ET reps > 0
    const weightsStore = currentData?.exerciseWeights || {};

    exercisesList.forEach(exercise => {
      const uniquePossibleKeys = collectCalendarRepKeysForExercise(dateStr, exercise);
      const baseKey = `${dateStr}_${exercise.id}`;
      const finalKey =
        resolveBestRepsStorageKey(currentData, uniquePossibleKeys) || baseKey;
      plannedResolvedKeys.add(finalKey);
      
      const rawReps = currentData?.reps?.[finalKey] || 0;
      const isCompleted = currentData?.checkedExercises?.[finalKey] || false;

      // ✅ PHASE 4 : Valider la valeur numérique (rejette négatif, NaN)
      const repsValidation = validateNumericValue(rawReps, `getIntensityForDate.${dateStr}.${exercise.id}.reps`, false);
      const reps = repsValidation.normalizedValue;
      
      // Complété : la coche compte pour la fréquence ; le volume ne s’ajoute que si reps > 0
      if (isCompleted) {
        if (reps > 0) {
          completedExercises++;
          exercisesReps += reps;
          totalReps += reps;
          const coeff = resolveExerciseIntensityCoeff(
            exercise,
            currentData?.exerciseIntensityCoeffs || {}
          );
          const usesLoad = exerciseUsesExternalLoad(exercise);
          const pickWeightStr = () => {
            for (const k of uniquePossibleKeys) {
              const v = weightsStore[k];
              if (v !== undefined && v !== null && String(v).trim() !== '') return String(v);
            }
            return '';
          };
          const perArm = uniquePossibleKeys.some((k) => currentData?.exerciseWeightPerArm?.[k] === true);
          let setArr = null;
          for (const k of uniquePossibleKeys) {
            const a = currentData?.exerciseSetWeights?.[k];
            if (Array.isArray(a) && a.some((x) => String(x ?? '').trim() !== '')) {
              setArr = a;
              break;
            }
          }
          const volumeKg = computeVolumeKgReps({
            exercise,
            totalReps: reps,
            singleWeightStr: pickWeightStr(),
            perArm,
            setWeightStrs: Array.isArray(setArr) ? setArr : null
          });
          const wKg = reps > 0 && volumeKg > 0 ? volumeKg / reps : 0;
          const medianKg = computeMedianWeightKgForExercise(weightsStore, exercise.id);
          const wMult = computeExternalLoadMultiplier(usesLoad, wKg, medianKg);
          strengthLoad += computeStrengthCalendarContribution(
            {
              id: exercise.id,
              name: exercise.name,
              nom: exercise.name,
              series: exercise.series || '',
              type: exercise.type || ''
            },
            reps,
            coeff,
            wMult
          );
        } else {
          completedExercises++;
        }
      }
    });

    // ✅ NOUVEAU : inclure les exos enregistrés hors programme (ex: max saisi depuis Défis/Performance)
    // pour que le calendrier affiche bien reps + exo du jour même si non planifié.
    const checkedMap = currentData?.checkedExercises || {};
    const repsMap = currentData?.reps || {};
    Object.entries(checkedMap).forEach(([key, isCompleted]) => {
      if (!isCompleted) return;
      if (!String(key).startsWith(`${dateStr}_`)) return;
      if (plannedResolvedKeys.has(key)) return;
      if (String(key).includes('_complementary_')) return; // déjà traité via enduranceData

      const rawReps = repsMap[key];
      const repsValidation = validateNumericValue(rawReps, `getIntensityForDate.${dateStr}.adhoc.${key}`, false);
      const reps = repsValidation.normalizedValue;

      const rawId = String(key).slice(`${dateStr}_`.length).replace(/_semaineA$|_semaineB$/, '');
      const dayVariation = currentData?.dailyVariations?.[dateStr];
      const exceptionalSource = Array.isArray(dayVariation?.additionalExercises)
        ? dayVariation.additionalExercises.find((ex) => String(ex?.id) === String(rawId))
        : null;
      const exerciseName = exceptionalSource?.name || getExerciseNameById?.(rawId) || rawId;

      completedExercises++;
      if (reps > 0) {
        exercisesReps += reps;
        totalReps += reps;
      }

      const coeff = resolveExerciseIntensityCoeff(
        { id: rawId, name: exerciseName, series: '', type: 'standard' },
        currentData?.exerciseIntensityCoeffs || {}
      );
      if (reps > 0) {
        const usesLoad = exerciseUsesExternalLoad({ name: exerciseName, materiel: '', equipment: '' });
        const volumeKgAd = computeVolumeKgForWorkoutKey(key, currentData);
        const wKg = reps > 0 && volumeKgAd > 0 ? volumeKgAd / reps : 0;
        const medianKg = computeMedianWeightKgForExercise(weightsStore, rawId);
        const wMult = computeExternalLoadMultiplier(usesLoad, wKg, medianKg);
        strengthLoad += computeStrengthCalendarContribution(
          { id: rawId, name: exerciseName, nom: exerciseName, series: '', type: 'standard' },
          reps,
          coeff,
          wMult
        );
      }

      adHocCompletedExercises.push({
        name: exerciseName,
        reps,
        exerciseId: rawId,
        series: exceptionalSource?.series || '',
        type: exceptionalSource?.type || 'standard',
        materiel: exceptionalSource?.materiel || '',
        programName: exceptionalSource ? 'Exceptionnel' : 'Performance',
        programId: 'performance',
        _storageKey: key
      });
    });

    /** Ratio complétion programme : (exos + étirements) cochés / (exos + étirements) prévus.
     *  La couleur de la case du jour reflète la complétion globale du programme :
     *  cocher TOUS les étirements d'un jour de pure mobilité passe le ratio à 100 %. */
    const dvForCompletion = currentData?.dailyVariations?.[dateStr];
    const suppressedForCompletion = new Set(
      Array.isArray(dvForCompletion?.suppressedExercises)
        ? dvForCompletion.suppressedExercises.filter((id) => typeof id === 'number' && !Number.isNaN(id))
        : []
    );
    const exercisesListForCompletion = exercisesList.filter((ex) => !suppressedForCompletion.has(ex.id));
    const chkForCompletion = currentData?.checkedExercises || {};
    let programCheckedCount = 0;
    exercisesListForCompletion.forEach((exercise) => {
      const keysC = collectCalendarRepKeysForExercise(dateStr, exercise);
      if (keysC.some((k) => chkForCompletion[k] === true)) programCheckedCount += 1;
    });

    // Volet étirements : items planifiés × items cochés ce jour-là
    const stretchPlannedList = buildPlannedStretchListForDateStr(dateStr, {
      programs: Array.isArray(programs) ? programs : []
    });
    const checkedStretchesForCompletion = currentData?.checkedStretches || {};
    let stretchCheckedCount = 0;
    stretchPlannedList.forEach((item) => {
      const k = generateStretchItemKey(dateStr, item.moment, item.id);
      if (checkedStretchesForCompletion[k] === true) stretchCheckedCount += 1;
    });

    const totalForCompletion = exercisesListForCompletion.length + stretchPlannedList.length;
    const checkedForCompletion = programCheckedCount + stretchCheckedCount;
    const programCompletionRatio =
      totalForCompletion > 0 ? checkedForCompletion / totalForCompletion : 0;

    // ✅ ÉTAPE 2 : Ajouter les reps d'endurance (pompes, boxe, défis complétés)
    // Les défis complétés sont déjà inclus dans enduranceData.reps via les sessions d'endurance
    // (voir getEnduranceDataForDate qui parcourt enduranceData.sessions)
    const enduranceRepsValue = enduranceData.reps || 0;
    
    // 🔍 DEBUG : Vérifier si enduranceRepsValue est suspect et tracer les sessions problématiques
    if (enduranceRepsValue > 1000) {
      console.warn(`⚠️ [getIntensityForDate] ${dateStr} - enduranceRepsValue suspect: ${enduranceRepsValue}`);
      // Tracer chaque session d'endurance pour cette date pour identifier la source
      const enduranceDataRawDebug = allData?.enduranceData || {};
      const sessionsDebug = enduranceDataRawDebug.sessions || {};
      const problematicSessions = [];
      Object.entries(sessionsDebug).forEach(([activityType, activitySessions]) => {
        if (Array.isArray(activitySessions)) {
          activitySessions.forEach(session => {
            if (isMockEnduranceSession(session)) return;
            const sessionDateStr = normalizeDateString(session.date);
            if (sessionDateStr && sessionDateStr === dateStr) {
              // ✅ CORRECTION : Exclure jumprope du calcul des reps (comme dans getEnduranceDataForDate)
              if (activityType !== 'jumprope') {
                const sessionReps = session.count !== undefined && session.count !== null
                  ? parseInt(session.count) || 0
                  : (session.reps !== undefined && session.reps !== null ? parseInt(session.reps) || 0 : 0);
                if (sessionReps > 0) {
                  problematicSessions.push({
                    activityType,
                    count: session.count,
                    reps: session.reps,
                    sessionReps,
                    session: session // Session complète pour inspection
                  });
                }
              }
            }
          });
        }
      });
      console.warn(`   Sessions d'endurance trouvées pour ${dateStr}:`, problematicSessions);
      console.warn(`   enduranceData calculé (getEnduranceDataForDate):`, enduranceData);
      console.warn(`   enduranceDataRaw (allData.enduranceData):`, enduranceDataRawDebug);
      
      // 🔍 LOG DÉTAILLÉ : Afficher chaque session avec tous ses champs pour identifier la source
      console.warn(`   🔍 ANALYSE DÉTAILLÉE DES ${problematicSessions.length} SESSION(S) PROBLÉMATIQUE(S):`);
      problematicSessions.forEach((sessionInfo, index) => {
        const totalRepsFromThisSession = sessionInfo.sessionReps || 0;
        console.warn(`   📊 Session ${index + 1}/${problematicSessions.length} (${sessionInfo.activityType}):`);
        console.warn(`      - count: ${sessionInfo.count}`);
        console.warn(`      - reps: ${sessionInfo.reps}`);
        console.warn(`      - sessionReps calculé: ${totalRepsFromThisSession} (utilisé dans le total)`);
        console.warn(`      - date: ${sessionInfo.session?.date}`);
        console.warn(`      - duration: ${sessionInfo.session?.duration}`);
        console.warn(`      - validatedChallenges:`, sessionInfo.session?.validatedChallenges);
        console.warn(`      - Session complète:`, sessionInfo.session);
      });
      
      // Calculer la somme des reps des sessions pour vérifier
      const totalRepsFromSessions = problematicSessions.reduce((sum, s) => sum + (s.sessionReps || 0), 0);
      console.warn(`   ✅ VÉRIFICATION: Somme des reps des ${problematicSessions.length} session(s) = ${totalRepsFromSessions} (doit correspondre à enduranceRepsValue = ${enduranceRepsValue})`);
    }
    
    totalReps += enduranceRepsValue;

    const enduranceLoadForCalendar = getEnduranceLoadForDate(dateStr, currentData);
    
    // 🔍 DEBUG : Logger les détails du calcul pour diagnostiquer les problèmes
    // ✅ CORRECTION : Définir enduranceDataRaw avant le bloc if pour éviter les erreurs de scope
    const enduranceDataRaw = currentData?.enduranceData || {}; // ✅ CORRECTION : Renommer pour éviter conflit avec enduranceData du getEnduranceDataForDate
    
    if (dateStr === '2025-11-03' || dateStr === '2025-11-04' || totalReps > 1000 || enduranceRepsValue > 1000) { // Log pour les dates problématiques ou valeurs suspectes
      // 🔍 DEBUG DÉTAILLÉ : Tracer chaque exercice compté
      const exercisesDetails = [];
      exercisesList.forEach(exercise => {
        const keys = collectCalendarRepKeysForExercise(dateStr, exercise);
        const actualKey =
          resolveBestRepsStorageKey(currentData, keys) || `${dateStr}_${exercise.id}`;
        const reps = parseInt(currentData?.reps?.[actualKey] || 0);
        const isCompleted = currentData?.checkedExercises?.[actualKey] || false;
        if (isCompleted && reps > 0) {
          exercisesDetails.push({ exerciseId: exercise.id, name: exercise.name, key: actualKey, reps, isCompleted });
        }
      });
      
      // 🔍 DEBUG DÉTAILLÉ : Tracer chaque session d'endurance
      const enduranceSessionsDetails = [];
      const sessions = enduranceDataRaw.sessions || {};
      Object.entries(sessions).forEach(([activityType, activitySessions]) => {
        if (Array.isArray(activitySessions)) {
          activitySessions.forEach(session => {
            if (isMockEnduranceSession(session)) return;
            const sessionDateStr = normalizeDateString(session.date);
            if (sessionDateStr && sessionDateStr === dateStr) {
              // ✅ CORRECTION : Exclure jumprope du calcul des reps (comme dans getEnduranceDataForDate)
              if (activityType !== 'jumprope') {
                const sessionReps = session.count !== undefined && session.count !== null
                  ? parseInt(session.count) || 0
                  : (session.reps !== undefined && session.reps !== null ? parseInt(session.reps) || 0 : 0);
                if (sessionReps > 0) {
                  enduranceSessionsDetails.push({
                    activityType: activityType || session.activityType || 'unknown',
                    count: session.count,
                    reps: session.reps,
                    sessionReps,
                    duration: session.duration,
                    validatedChallenges: session.validatedChallenges
                  });
                }
              }
            }
          });
        }
      });
      
      console.log(`🔍 [getIntensityForDate] ${dateStr} - CALCUL DÉTAILLÉ DES RÉPÉTITIONS:`, {
        exercisesReps,
        exercisesDetails,
        enduranceReps: enduranceRepsValue,
        enduranceSessionsDetails,
        totalReps,
        completedExercises,
        totalPlannedExercises,
        exercisesListLength: exercisesList.length,
        enduranceDataDetails: {
          sessions: enduranceDataRaw.sessions,
          reps: enduranceDataRaw.reps,
          sessionsCount: Object.values(enduranceDataRaw.sessions || {}).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0),
          enduranceDataCalculated: enduranceData // Valeur retournée par getEnduranceDataForDate
        }
      });
    }

    // ✅ CORRECTION PB 2: Calculer la durée réelle avec PRIORITÉ Garmin > Programme
    // Principe: Si Garmin a une durée pour cette date, utiliser Garmin (plus précis), sinon utiliser la durée prévue du programme
    const calculateRealDuration = () => {
      // ✅ PRIORITÉ 1.1: Vérifier les dailyMetrics Garmin (durée totale d'activité de la journée)
      if (garminData?.dailyMetrics && typeof garminData.dailyMetrics === 'object') {
        // dailyMetrics est un objet avec clés de date: { "YYYY-MM-DD": {...metrics} }
        const dailyMetric = garminData.dailyMetrics[dateStr];
        
        if (dailyMetric) {
          let metricsDurationMinutes = 0;
          
          // Vérifier activeTime (durée d'activité active en minutes)
          if (dailyMetric.activeTime !== undefined && dailyMetric.activeTime !== null) {
            const rawActiveTime = typeof dailyMetric.activeTime === 'number' 
              ? dailyMetric.activeTime 
              : parseInt(dailyMetric.activeTime) || 0;
            // ✅ PHASE 4 : Valider la durée (vérifier > 24h)
            const activeTimeValidation = validateDuration(rawActiveTime, `calculateRealDuration.GarminDailyMetrics.${dateStr}.activeTime`);
            metricsDurationMinutes = activeTimeValidation.clampedValue;
          }
          // Sinon vérifier activeDurationMinutes
          else if (dailyMetric.activeDurationMinutes !== undefined && dailyMetric.activeDurationMinutes !== null) {
            const rawActiveDurationMinutes = typeof dailyMetric.activeDurationMinutes === 'number'
              ? dailyMetric.activeDurationMinutes
              : parseInt(dailyMetric.activeDurationMinutes) || 0;
            // ✅ PHASE 4 : Valider la durée (vérifier > 24h)
            const activeDurationValidation = validateDuration(rawActiveDurationMinutes, `calculateRealDuration.GarminDailyMetrics.${dateStr}.activeDurationMinutes`);
            metricsDurationMinutes = activeDurationValidation.clampedValue;
          }
          // Sinon vérifier totalActivityDuration (en secondes généralement)
          else if (dailyMetric.totalActivityDuration !== undefined && dailyMetric.totalActivityDuration !== null) {
            const totalActivityDuration = typeof dailyMetric.totalActivityDuration === 'number'
              ? dailyMetric.totalActivityDuration
              : parseInt(dailyMetric.totalActivityDuration) || 0;
            // ✅ PHASE 3 : Utiliser parseDurationToMinutes pour cohérence absolue
            const parsedDuration = parseDurationToMinutes(totalActivityDuration, `calculateRealDuration.GarminDailyMetrics.${dateStr}`);
            // ✅ PHASE 4 : Valider la durée (vérifier > 24h)
            const durationValidation = validateDuration(parsedDuration, `calculateRealDuration.GarminDailyMetrics.${dateStr}.totalActivityDuration`);
            metricsDurationMinutes = durationValidation.clampedValue;
          }
          
          // Si durée trouvée dans dailyMetrics, l'utiliser (plus précise)
          if (metricsDurationMinutes > 0) {
            // ✅ LOGS DÉSACTIVÉS pour réduire le bruit (33k messages)
            // console.log(`✅ [calculateRealDuration] Retour depuis dailyMetrics: ${metricsDurationMinutes} min`);
            return Math.round(metricsDurationMinutes);
          } else {
            // ✅ LOGS DÉSACTIVÉS pour réduire le bruit (33k messages)
            // console.log(`🔍 [calculateRealDuration] dailyMetrics trouvé pour ${dateStr} mais aucune durée valide`);
          }
        }
      }
      
      // ✅ PRIORITÉ 1.2: Vérifier les activités Garmin détaillées pour cette date
      if (garminData?.activities) {
        // Calculer la durée totale des activités Garmin pour cette date
        let garminDurationMinutes = 0;
        
        // Cardio
        const activitésCardio = (garminData.activities.cardio || []).filter(act => {
          // ✅ PHASE 4 : Valider la date de l'activité (exclure dates futures)
          const actDateInput = act.date || act.startTime || act.start;
          const dateValidation = validateDate(actDateInput, `calculateRealDuration.Cardio.filter`);
          if (!dateValidation.isValid || dateValidation.isFuture) {
            return false; // Ignorer les activités avec dates invalides ou futures
          }
          return dateValidation.normalizedDate === dateStr;
        });
        // ✅ LOGS DÉSACTIVÉS pour réduire le bruit (33k messages)
        // console.log(`🔍 [calculateRealDuration] Trouvé ${activitésCardio.length} activité(s) cardio pour ${dateStr}`);
        activitésCardio.forEach((act, idx) => {
          // ✅ PHASE 1 : Utiliser parseDurationToMinutes pour cohérence absolue
          const actId = act.id || act.activityId || `cardio-${idx}`;
          const actDate = act.date || act.startTime || act.start || 'unknown';
          
          let actDurationMinutes = 0;
          
          // Priorité : duration > totalTime > elapsedTime
          if (act.duration) {
            actDurationMinutes = parseDurationToMinutes(act.duration, `calculateRealDuration.Cardio[${idx}].${actId}`);
          } else if (act.totalTime) {
            // totalTime généralement en secondes (convertir en minutes)
            actDurationMinutes = parseDurationToMinutes(act.totalTime, `calculateRealDuration.Cardio[${idx}].${actId}.totalTime`);
          } else if (act.elapsedTime) {
            // elapsedTime généralement en secondes (convertir en minutes)
            actDurationMinutes = parseDurationToMinutes(act.elapsedTime, `calculateRealDuration.Cardio[${idx}].${actId}.elapsedTime`);
          } else {
            // ✅ LOGS DÉSACTIVÉS pour réduire le bruit (33k messages) - Garder uniquement les warnings critiques
            // console.log(`⚠️ [calculateRealDuration] Cardio[${idx}] (${actId}) - Aucune durée trouvée`);
          }
          
          // ✅ PHASE 4 : Utiliser la fonction centralisée de validation
          const durationValidation = validateDuration(actDurationMinutes, `calculateRealDuration.Cardio[${idx}].${actId}`);
          if (!durationValidation.isValid && durationValidation.warnings.length > 0) {
            // Ajouter les détails de l'activité aux warnings
            console.warn(`⚠️ [calculateRealDuration] Cardio[${idx}] (${actId}) - Données brutes:`, {
              duration: act.duration,
              totalTime: act.totalTime,
              elapsedTime: act.elapsedTime,
              date: actDate,
              name: act.name || act.activityName || 'unknown'
            });
          }
          actDurationMinutes = durationValidation.clampedValue;
          
          garminDurationMinutes += actDurationMinutes;
        });
        // ✅ LOGS DÉSACTIVÉS pour réduire le bruit (33k messages)
        // console.log(`🔍 [calculateRealDuration] Durée totale cardio (après ${activitésCardio.length} activité(s)): ${garminDurationMinutes} min`);
        
        // Natation
        const activitésNatation = (garminData.activities.swimming || []).filter(act => {
          // ✅ PHASE 4 : Valider la date de l'activité (exclure dates futures)
          const actDateInput = act.date || act.startTime || act.start;
          const dateValidation = validateDate(actDateInput, `calculateRealDuration.Swimming.filter`);
          if (!dateValidation.isValid || dateValidation.isFuture) {
            return false; // Ignorer les activités avec dates invalides ou futures
          }
          return dateValidation.normalizedDate === dateStr;
        });
        activitésNatation.forEach((act, idx) => {
          // ✅ PHASE 1 : Utiliser parseDurationToMinutes pour cohérence absolue
          const actId = act.id || act.activityId || `swimming-${idx}`;
          
          let actDurationMinutes = 0;
          
          // Priorité : duration > totalTime > elapsedTime
          if (act.duration) {
            actDurationMinutes = parseDurationToMinutes(act.duration, `calculateRealDuration.Swimming[${idx}].${actId}`);
          } else if (act.totalTime) {
            actDurationMinutes = parseDurationToMinutes(act.totalTime, `calculateRealDuration.Swimming[${idx}].${actId}.totalTime`);
          } else if (act.elapsedTime) {
            actDurationMinutes = parseDurationToMinutes(act.elapsedTime, `calculateRealDuration.Swimming[${idx}].${actId}.elapsedTime`);
          }
          
          // ✅ PHASE 4 : Utiliser la fonction centralisée de validation
          const durationValidation = validateDuration(actDurationMinutes, `calculateRealDuration.Swimming[${idx}].${actId}`);
          actDurationMinutes = durationValidation.clampedValue;
          if (!durationValidation.isValid && durationValidation.warnings.length > 0) {
            console.warn(`⚠️ [calculateRealDuration] Swimming[${idx}] (${actId}) - Données brutes:`, {
              duration: act.duration,
              totalTime: act.totalTime,
              elapsedTime: act.elapsedTime,
              date: actDate,
              name: act.name || act.activityName || 'unknown'
            });
          }
          
          garminDurationMinutes += actDurationMinutes;
        });
        
        // Corde à sauter
        const activitésCorde = (garminData.activities.jumpRope || []).filter(act => {
          // ✅ PHASE 4 : Valider la date de l'activité (exclure dates futures)
          const actDateInput = act.date || act.startTime || act.start;
          const dateValidation = validateDate(actDateInput, `calculateRealDuration.JumpRope.filter`);
          if (!dateValidation.isValid || dateValidation.isFuture) {
            return false; // Ignorer les activités avec dates invalides ou futures
          }
          return dateValidation.normalizedDate === dateStr;
        });
        activitésCorde.forEach((act, idx) => {
          // ✅ PHASE 1 : Utiliser parseDurationToMinutes pour cohérence absolue
          const actId = act.id || act.activityId || `jumpRope-${idx}`;
          
          let actDurationMinutes = 0;
          
          // Priorité : durationSec > duration > totalTime > elapsedTime
          const dur = act.durationSec || act.duration;
          if (dur) {
            actDurationMinutes = parseDurationToMinutes(dur, `calculateRealDuration.JumpRope[${idx}].${actId}`);
          } else if (act.totalTime) {
            actDurationMinutes = parseDurationToMinutes(act.totalTime, `calculateRealDuration.JumpRope[${idx}].${actId}.totalTime`);
          } else if (act.elapsedTime) {
            actDurationMinutes = parseDurationToMinutes(act.elapsedTime, `calculateRealDuration.JumpRope[${idx}].${actId}.elapsedTime`);
          }
          
          // ✅ PHASE 4 : Utiliser la fonction centralisée de validation
          const durationValidation = validateDuration(actDurationMinutes, `calculateRealDuration.JumpRope[${idx}].${actId}`);
          actDurationMinutes = durationValidation.clampedValue;
          if (!durationValidation.isValid && durationValidation.warnings.length > 0) {
            console.warn(`⚠️ [calculateRealDuration] JumpRope[${idx}] (${actId}) - Données brutes:`, {
              duration: act.duration,
              durationSec: act.durationSec,
              totalTime: act.totalTime,
              elapsedTime: act.elapsedTime,
              date: actDate,
              name: act.name || act.activityName || 'unknown'
            });
          }
          
          garminDurationMinutes += actDurationMinutes;
        });
        
        // ✅ Si durée Garmin trouvée, l'utiliser ET RETOURNER DIRECTEMENT (sans rien ajouter)
        // Les données Garmin sont la source de vérité absolue pour la durée d'entraînement
        if (garminDurationMinutes > 0) {
          // ✅ LOGS DÉSACTIVÉS pour réduire le bruit (33k messages)
          // console.log(`✅ [calculateRealDuration] Retour depuis activités Garmin: ${garminDurationMinutes} min`);
          return Math.round(garminDurationMinutes);
        } else {
          // ✅ LOGS DÉSACTIVÉS pour réduire le bruit (33k messages)
          // console.log(`🔍 [calculateRealDuration] Pas d'activités Garmin trouvées pour ${dateStr}`);
        }
      }
      
      // ✅ PRIORITÉ 2: Si PAS de données Garmin, utiliser la durée prévue du programme
      // Ne PAS ajouter enduranceData.duration car cela peut inclure des valeurs mock
      // Le programme est la source de vérité quand Garmin n'est pas disponible
      if (workout) {
        let programDurationMinutes = 0;
        
        // Priorité 1: workout.duration (nombre en minutes)
        if (workout.duration && typeof workout.duration === 'number') {
          programDurationMinutes = workout.duration;
          // ✅ LOGS DÉSACTIVÉS pour réduire le bruit (33k messages)
          // console.log(`🔍 [calculateRealDuration] workout.duration trouvé: ${programDurationMinutes} min`);
        }
        // Priorité 2: workout.estimatedDuration (nombre en minutes)
        else if (workout.estimatedDuration && typeof workout.estimatedDuration === 'number') {
          programDurationMinutes = workout.estimatedDuration;
          // ✅ LOGS DÉSACTIVÉS pour réduire le bruit (33k messages)
          // console.log(`🔍 [calculateRealDuration] workout.estimatedDuration trouvé: ${programDurationMinutes} min`);
        }
        // Priorité 3: parser workout.duree (format texte comme "1h", "45-55 min", etc.)
        else if (workout.duree && typeof workout.duree === 'string') {
          const dureeStr = workout.duree.trim();
          
          // Parser différents formats
          // Format "1h" ou "~1 h"
          const hourMatch = dureeStr.match(/(\d+)\s*h/);
          if (hourMatch) {
            programDurationMinutes = parseInt(hourMatch[1]) * 60;
            // ✅ LOGS DÉSACTIVÉS pour réduire le bruit (33k messages)
            // console.log(`🔍 [calculateRealDuration] workout.duree (heures) parsé: ${hourMatch[1]}h → ${programDurationMinutes} min`);
          }
          // Format "45-55 min" ou "45 min"
          else {
            const minMatch = dureeStr.match(/(\d+)(?:\s*-\s*(\d+))?\s*min/);
            if (minMatch) {
              const minMin = parseInt(minMatch[1]);
              const minMax = minMatch[2] ? parseInt(minMatch[2]) : minMin;
              programDurationMinutes = Math.round((minMin + minMax) / 2); // Moyenne si plage
              // ✅ LOGS DÉSACTIVÉS pour réduire le bruit (33k messages)
              // console.log(`🔍 [calculateRealDuration] workout.duree (minutes) parsé: ${minMin}-${minMax} min → ${programDurationMinutes} min`);
            }
            // Sinon essayer de parser un nombre simple
            else {
              const simpleNum = parseInt(dureeStr);
              if (!isNaN(simpleNum) && simpleNum > 0 && simpleNum < 300) {
                programDurationMinutes = simpleNum; // Assumons que c'est en minutes si raisonnable
                // ✅ LOGS DÉSACTIVÉS pour réduire le bruit (33k messages)
                // console.log(`🔍 [calculateRealDuration] workout.duree (nombre simple) parsé: ${simpleNum} min`);
              }
            }
          }
        }
        
        // ✅ Si durée du programme trouvée, la retourner directement
        if (programDurationMinutes > 0) {
          // ✅ LOGS DÉSACTIVÉS pour réduire le bruit (33k messages)
          // console.log(`✅ [calculateRealDuration] Retour depuis programme: ${programDurationMinutes} min`);
          return Math.round(programDurationMinutes);
        } else {
          // ✅ LOGS DÉSACTIVÉS pour réduire le bruit (33k messages)
          // console.log(`🔍 [calculateRealDuration] Aucune durée trouvée dans workout pour ${dateStr}`);
        }
      }

      // ✅ Si aucune durée n'a été trouvée (ni Garmin, ni programme), retourner 0
      // ✅ LOGS DÉSACTIVÉS pour réduire le bruit (33k messages) - Garder uniquement les warnings critiques
      // console.log(`⚠️ [calculateRealDuration] Aucune durée trouvée (ni Garmin, ni programme) pour ${dateStr}, retour 0`);
      return 0;
    };

    let realDuration = calculateRealDuration();
    
    // Vérifier si une activité complémentaire est cochée (depuis le programme par défaut ou actif)
    const defaultWorkout = workoutProgram[dayName];
    const activeWorkoutRaw = getTodayWorkout ? getTodayWorkout(date, false) : null;
    const activeWorkout = activeWorkoutRaw ? {
      ...activeWorkoutRaw,
      exercices: activeWorkoutRaw.exercices || activeWorkoutRaw.exercises || [],
      complementaryActivity: activeWorkoutRaw.complementaryActivity
    } : null;
    
    const complementaryActivity = activeWorkout?.complementaryActivity || defaultWorkout?.complementaryActivity;
    const isComplementaryChecked = complementaryActivity && 
      currentData?.checkedExercises?.[`${dateStr}_complementary_${complementaryActivity.name.toLowerCase()}`];
    
        // Les sessions d'endurance détaillées n'impactent PAS l'intensité du calendrier
        // Seules les activités complémentaires de l'onglet Aujourd'hui comptent
        const totalActivities = completedExercises + (isComplementaryChecked ? 1 : 0);
        const completionRate = programCompletionRatio;
        
        // Debug pour le 28 octobre 2025
        if (dateStr === '2025-10-28') {
          // ✅ LOGS DE DEBUG DÉSACTIVÉS pour réduire le bruit (33k messages)
          // console.log('🔍 DEBUG Calcul intensité:');
          // console.log('Completed exercises:', completedExercises);
          // console.log('Endurance sessions:', enduranceData.sessions);
          // console.log('Is complementary checked:', isComplementaryChecked);
          // console.log('Total activities:', totalActivities);
          // console.log('Real duration:', realDuration);
          // console.log('Total reps:', totalReps);
        }
        
        // Calculer le niveau d'intensité avec logique hiérarchique et seuils dynamiques
        let intensityLevel = 0;
        if (totalActivities > 0) {
          // LOGIQUE HIÉRARCHIQUE :
          // 1. Si il y a des reps → priorité aux reps (seuils dynamiques)
          // 2. Si il y a que du temps → basé sur le temps (seuils dynamiques)
          // 3. Les sessions d'endurance détaillées n'impactent PAS l'intensité du calendrier
          
          if (totalReps > 0 || strengthLoad > 0 || enduranceLoadForCalendar > 0) {
            // Charge muscu pondérée + endurance (course = durée / allure / type ; autres = reps)
            const totalIntensityMetric = strengthLoad + enduranceLoadForCalendar;
            const { thresholds } = dynamicLoadThresholds;
            intensityLevel = calculateIntensityLevel(totalIntensityMetric, thresholds);
            
            // ✅ LOGS DE DEBUG DÉSACTIVÉS pour réduire le bruit (33k messages)
            // Debug pour le 28 octobre 2025 (réactiver uniquement si nécessaire)
            // if (dateStr === '2025-10-28') {
            //   console.log('🔍 DEBUG Logique REPS DYNAMIQUE:');
            //   console.log('Total reps:', totalReps);
            //   console.log('Thresholds:', thresholds);
            //   console.log('Final intensity level:', intensityLevel);
            // }
          } else {
            // BASÉ SUR LE TEMPS : Utiliser des seuils dynamiques pour la durée
            // Seulement les activités complémentaires de l'onglet Aujourd'hui
            // ✅ PHASE 2.2 : Utiliser les seuils mémorisés (évite les recalculs inutiles)
            const { thresholds: timeThresholds } = dynamicTimeThresholds;
            // ✅ PHASE 1 : Utiliser la fonction centralisée
            intensityLevel = calculateTimeIntensityLevel(realDuration, timeThresholds);
            
            // ✅ LOGS DE DEBUG DÉSACTIVÉS pour réduire le bruit (33k messages)
            // Debug pour le 28 octobre 2025 (réactiver uniquement si nécessaire)
            // if (dateStr === '2025-10-28') {
            //   console.log('🔍 DEBUG Logique TEMPS DYNAMIQUE:');
            //   console.log('Real duration:', realDuration);
            //   console.log('Time thresholds:', timeThresholds);
            //   console.log('Final intensity level:', intensityLevel);
            // }
          }
        } else {
          // ✅ NOUVEAU : Si pas d'exercices mais vraie activité Garmin détectée, utiliser Garmin
          const garminActivity = detectRealGarminActivity(dateStr, garminData);
          if (garminActivity.hasActivity && garminActivity.intensity !== null) {
            let gLevel = garminActivity.intensity;
            // Sans street ni charge endurance saisie : éviter des niveaux « extrêmes » surtout passifs
            if (completedExercises === 0 && enduranceLoadForCalendar <= 0) {
              gLevel = Math.min(3, gLevel);
              gLevel = Math.max(0, Math.round(gLevel * 0.86));
            }
            intensityLevel = gLevel;
            // Mettre à jour realDuration avec la durée détectée depuis Garmin
            if (garminActivity.duration > realDuration) {
              realDuration = garminActivity.duration;
            }
          }
        }
        
        // PHASE 5.3 : Appliquer les ajustements Garmin (recalibrage, records, etc.)
        let adjustedIntensity = intensityLevel;
        if (garminData && intensityLevel > 0) {
          const workoutIntensity = {
            level: intensityLevel,
            duration: realDuration,
            reps: totalReps
          };

          const garminAdjusted = calculateDayIntensityWithGarmin(dateStr, workoutIntensity, garminData);
          adjustedIntensity = garminAdjusted.level;
        }

        const sessionFbForDay = currentData.sessionFeedbacks?.[dateStr];
        if (sessionFbForDay && isSessionFeedbackFilled(sessionFbForDay)) {
          const diff5 = normalizeDifficultyForCalendarModel(sessionFbForDay);
          if (diff5 != null) {
            const bump = Math.round((diff5 - 3) * 0.35);
            adjustedIntensity = Math.max(0, Math.min(4, adjustedIntensity + bump));
          }
        }

        if (exercisesListForCompletion.length > 0) {
          adjustedIntensity = Math.min(
            4,
            adjustedIntensity + Math.round(programCompletionRatio * 2)
          );
        }
    
    // L'intensité ne dépend que des activités complémentaires de l'onglet Aujourd'hui
    const intensityScore = completionRate * 100 + (totalReps * 0.1) + (isComplementaryChecked ? 50 : 0);
    
    // PHASE 5.3 : Récupérer les icônes Garmin pour cette date
    const garminIcons = garminData ? getGarminActivityIcons(garminData, dateStr) : [];
    
    // ✅ NOUVEAU : Récupérer la justification pour ce jour
    const justification = getDayJustification(currentData, dateStr);
    
    const activeKcal =
      garminData?.dailyMetrics?.[dateStr]?.calories?.active != null
        ? Number(garminData.dailyMetrics[dateStr].calories.active) || 0
        : 0;

    const dm = garminData?.dailyMetrics?.[dateStr];
    const manualStepsNorm = normalizeManualDailyWalkByDate(currentData?.enduranceData?.manualDailyWalkByDate);
    const manualStepsForDay = manualStepsNorm[dateStr]?.steps ?? 0;
    const garminStepsRounded =
      dm?.steps != null && Number.isFinite(Number(dm.steps)) ? Math.max(0, Math.round(Number(dm.steps))) : 0;
    const stepsVal = mergedDailySteps(garminStepsRounded, manualStepsForDay);
    let intensityMinutesTotal = 0;
    let intensityMinutesModerate;
    let intensityMinutesVigorous;
    if (dm?.intensityMinutes != null) {
      const im = dm.intensityMinutes;
      const hasMod = im.moderate != null && Number.isFinite(Number(im.moderate));
      const hasVig = im.vigorous != null && Number.isFinite(Number(im.vigorous));
      if (hasMod || hasVig) {
        intensityMinutesModerate = hasMod ? Math.max(0, Math.round(Number(im.moderate))) : 0;
        intensityMinutesVigorous = hasVig ? Math.max(0, Math.round(Number(im.vigorous))) : 0;
      }
      if (im.total != null && Number.isFinite(Number(im.total))) {
        intensityMinutesTotal = Math.max(0, Math.round(Number(im.total)));
      } else if (hasMod || hasVig) {
        intensityMinutesTotal = (intensityMinutesModerate ?? 0) + (intensityMinutesVigorous ?? 0);
      }
    }

    const cardioKindV = garminData
      ? getGarminCardioMinutesByKindForDate(garminData, dateStr)
      : { walk: 0, run: 0, other: 0, total: 0 };
    const walkHeavyV =
      cardioKindV.walk >= (cardioKindV.run + cardioKindV.other + 5) * 1.35 &&
      cardioKindV.run < 22 &&
      cardioKindV.other < 25;
    const walkOnlyDayV =
      cardioKindV.total > 8 &&
      cardioKindV.walk >= cardioKindV.total * 0.72 &&
      cardioKindV.run < 12;

    const fbRaw = currentData.sessionFeedbacks?.[dateStr];
    const fbDiffVal = normalizeDifficultyForCalendarModel(fbRaw);

    const dayLiftVol =
      variant === 'sport' && liftVolumeByDateMap ? liftVolumeByDateMap.get(dateStr) || 0 : 0;
    const relativeLiftVolumeBoost01 =
      variant === 'sport' && liftVolumeByDateMap
        ? computeLiftVolumeRelativeVisualBoost01(dateStr, dayLiftVol, liftVolumeByDateMap)
        : 0;

    const visualContext = computeCalendarDayVisualContext({
      level: adjustedIntensity,
      activeKcal,
      kcalRefMedian: garminKcalMedianRef,
      steps: stepsVal,
      stepsRefMedian: garminStepsMedianRef,
      intensityMinutesTotal,
      ...(intensityMinutesModerate !== undefined && intensityMinutesVigorous !== undefined
        ? {
            intensityMinutesModerate,
            intensityMinutesVigorous
          }
        : {}),
      walkHeavy: walkHeavyV,
      walkOnlyDay: walkOnlyDayV,
      feedbackDiff: fbDiffVal,
      strengthLoad,
      enduranceLoad: enduranceLoadForCalendar,
      totalReps,
      relativeLiftVolumeBoost01
    });

    const result = {
      level: adjustedIntensity, // Utiliser le niveau ajusté par Garmin
      reps: totalReps,
      activeKcal,
      kcalRefMedian: garminKcalMedianRef,
      steps: stepsVal,
      stepsRefMedian: garminStepsMedianRef,
      intensityMinutesTotal,
      ...(intensityMinutesModerate !== undefined && intensityMinutesVigorous !== undefined
        ? { intensityMinutesModerate, intensityMinutesVigorous }
        : {}),
      visualContext,
      trainingLoad: strengthLoad + enduranceLoadForCalendar,
      strengthLoad,
      duration: realDuration,
      exerciseCount: totalPlannedExercises + adHocCompletedExercises.length,
      completedCount: completedExercises,
      intensityScore,
      completionRate: Math.round(completionRate * 100),
      programCompletionRatio,
      programCheckedCount,
      programPlannedCount: exercisesListForCompletion.length,
      enduranceData: enduranceData,
      // PHASE 5.3 : Ajouter les icônes Garmin
      garminIcons: garminIcons,
      // Garder la compatibilité avec l'ancien format
      exercises: completedExercises,
      // ✅ NOUVEAU : Ajouter la justification si elle existe
      ...(justification && { justification }),
      feedbackBoost01: sessionFeedbackVisualBoost01(fbRaw),
      weightedFeedbackScore10: computeSessionFeedbackWeightedScore10(fbRaw),
      isPlannedRestDay,
      // ✅ CORRECTION : Utiliser la même logique que pour le calcul du total
      // (chercher les variantes _semaineA, _semaineB, et vérifier reps > 0)
      session: completedExercises > 0 ? {
        exercises: [
          ...exercisesList
          .filter(ex => {
            const keys = collectCalendarRepKeysForExercise(dateStr, ex);
            const actualKey =
              resolveBestRepsStorageKey(currentData, keys) || `${dateStr}_${ex.id}`;
            const reps = parseInt(currentData?.reps?.[actualKey] || 0);
            const isCompleted = currentData?.checkedExercises?.[actualKey] || false;
            return isCompleted;
          })
          .map(ex => {
            const keys = collectCalendarRepKeysForExercise(dateStr, ex);
            const baseKey = `${dateStr}_${ex.id}`;
            const finalKey = resolveBestRepsStorageKey(currentData, keys) || baseKey;
            
            return {
              name: ex.name,
              reps: parseInt(currentData?.reps?.[finalKey] || 0),
              exerciseId: ex.id,
              series: ex.series || '',
              type: ex.type || '',
              materiel: ex.materiel || '',
              programName: ex.programName || 'Programme inconnu',
              programId: ex.programId,
              _storageKey: finalKey
            };
          }),
          ...adHocCompletedExercises
        ]
      } : null
    };
    
    // ✅ PHASE 2.3 : Mettre en cache le résultat avant de le retourner
    intensityCache.current[cacheKey] = result;
    
    // Limiter la taille du cache (garder seulement les 90 derniers jours)
    const cacheKeys = Object.keys(intensityCache.current);
    if (cacheKeys.length > 90) {
      const oldestKeys = cacheKeys.sort().slice(0, cacheKeys.length - 90);
      oldestKeys.forEach(key => delete intensityCache.current[key]);
    }
    
    return result;
  };

  const handleDeleteExerciseRecordFromCalendar = async (exercise) => {
    if (!selectedDate?.date || !exercise) return;
    const dateStr = getDateStr(selectedDate.date);
    const fallbackExerciseId = exercise.exerciseId ?? exercise.id;
    const storageKeyRaw = exercise._storageKey || `${dateStr}_${fallbackExerciseId}`;
    const storageKey = String(storageKeyRaw || '').trim();
    if (!storageKey || !storageKey.startsWith(`${dateStr}_`)) return;

    try {
      const latestData = getCurrentData();
      const nextChecked = { ...(latestData?.checkedExercises || {}) };
      const nextReps = { ...(latestData?.reps || {}) };
      const nextWeights = { ...(latestData?.exerciseWeights || {}) };

      delete nextChecked[storageKey];
      delete nextReps[storageKey];
      delete nextWeights[storageKey];

      const payload = {
        ...latestData,
        checkedExercises: nextChecked,
        reps: nextReps,
        exerciseWeights: nextWeights
      };

      await updateData(payload);

      if (hasUnsavedExercises || hasUnsavedStretches) {
        replaceDraftWorkoutData(payload);
      }

      delete intensityCache.current[dateStr];
      Object.keys(intensityCache.current)
        .filter((key) => key.startsWith(dateStr))
        .forEach((key) => delete intensityCache.current[key]);

      setDataUpdateTrigger((p) => p + 1);
      const updatedDay = {
        date: selectedDate.date,
        intensity: getIntensityForDate(selectedDate.date, payload)
      };
      setSelectedDate(updatedDay);
      showSuccess(t('calendar.heatmap.dayDetails.exerciseDeleteSuccess', 'Enregistrement supprimé du calendrier'));
    } catch (error) {
      console.error('[CalendarHeatmap] Erreur suppression enregistrement exercice:', error);
      showError(t('calendar.heatmap.dayDetails.exerciseDeleteError', 'Impossible de supprimer cet enregistrement'));
    }
  };

  const handleUpdateExerciseRepsFromCalendar = async (exercise, repsValue) => {
    if (!selectedDate?.date || !exercise) return;
    const dateStr = getDateStr(selectedDate.date);
    const fallbackExerciseId = exercise.exerciseId ?? exercise.id;
    const storageKeyRaw = exercise._storageKey || `${dateStr}_${fallbackExerciseId}`;
    const storageKey = String(storageKeyRaw || '').trim();
    if (!storageKey || !storageKey.startsWith(`${dateStr}_`)) return;

    const parsed = parseInt(String(repsValue ?? '').replace(/\s/g, ''), 10);
    if (!Number.isFinite(parsed) || parsed < 1) {
      showError(
        t(
          'calendar.heatmap.dayDetails.exerciseRepsInvalid',
          'Indiquez un nombre de répétitions valide (minimum 1).'
        )
      );
      return;
    }
    const capped = Math.min(parsed, 99999);

    try {
      const latestData = getCurrentData();
      const nextChecked = { ...(latestData?.checkedExercises || {}) };
      const nextReps = { ...(latestData?.reps || {}) };

      if (!nextChecked[storageKey]) {
        showError(
          t(
            'calendar.heatmap.dayDetails.exerciseRepsUpdateMissing',
            'Cet enregistrement n’est plus disponible. Rechargez le calendrier.'
          )
        );
        return;
      }

      nextReps[storageKey] = capped;

      const payload = {
        ...latestData,
        checkedExercises: nextChecked,
        reps: nextReps
      };

      await updateData(payload);

      if (hasUnsavedExercises || hasUnsavedStretches) {
        replaceDraftWorkoutData(payload);
      }

      delete intensityCache.current[dateStr];
      Object.keys(intensityCache.current)
        .filter((key) => key.startsWith(dateStr))
        .forEach((key) => delete intensityCache.current[key]);

      setDataUpdateTrigger((p) => p + 1);
      setEditingRepsStorageKey(null);
      setEditingRepsDraft('');
      const updatedDay = {
        date: selectedDate.date,
        intensity: getIntensityForDate(selectedDate.date, payload)
      };
      setSelectedDate(updatedDay);
      showSuccess(
        t('calendar.heatmap.dayDetails.exerciseRepsUpdated', 'Nombre de répétitions mis à jour')
      );
    } catch (error) {
      console.error('[CalendarHeatmap] Erreur mise à jour reps exercice:', error);
      showError(
        t('calendar.heatmap.dayDetails.exerciseRepsUpdateError', 'Impossible de mettre à jour les répétitions')
      );
    }
  };

  // Calcul des streaks
  const calculateStreaks = () => {
    const today = new Date();
    const sortedHistory = [...workoutHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    // Calculer le streak actuel
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = getDateStr(checkDate);
      
      const hasWorkout = sortedHistory.some(session => session.date === dateStr);
      
      if (hasWorkout) {
        if (i === 0 || currentStreak > 0) currentStreak++;
      } else {
        break;
      }
    }
    
    // Calculer le plus long streak
    let consecutiveDays = 0;
    for (const session of sortedHistory) {
      consecutiveDays++;
      tempStreak = Math.max(tempStreak, consecutiveDays);
      
      // Vérifier s'il y a une interruption
      const nextIndex = sortedHistory.indexOf(session) + 1;
      if (nextIndex < sortedHistory.length) {
        const currentDate = new Date(session.date);
        const nextDate = new Date(sortedHistory[nextIndex].date);
        const dayDiff = (nextDate - currentDate) / (1000 * 60 * 60 * 24);
        
        if (dayDiff > 1) {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 0;
          consecutiveDays = 0;
        }
      }
    }
    
    longestStreak = Math.max(longestStreak, tempStreak);
    
    return { currentStreak, longestStreak };
  };

  // Navigation
  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(currentDate.getMonth() + direction);
    } else if (viewMode === 'year') {
      newDate.setFullYear(currentDate.getFullYear() + direction);
    }
    setCurrentDate(newDate);
  };

  // Génération des jours du mois avec intensité dynamique
  const generateMonthDays = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    
    // Commencer par le lundi de la semaine contenant le 1er du mois
    const dayOfWeek = firstDay.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(firstDay.getDate() - mondayOffset);
    
    const days = [];
    const currentDay = new Date(startDate);
    
    // Générer 6 semaines (42 jours) pour couvrir tout le mois
    for (let i = 0; i < 42; i++) {
      const isCurrentMonthDay = currentDay.getMonth() === month;
      
      // ✅ CORRECTION PB 1: Ne calculer l'intensité QUE pour les jours du mois courant
      // Évite de colorer les jours des mois précédents/suivants
      let intensity;
      if (isCurrentMonthDay) {
        intensity = getIntensityForDate(currentDay);
      } else {
        // Pour les jours hors mois, utiliser des valeurs neutres (pas d'intensité)
        intensity = {
          level: 0,
          reps: 0,
          trainingLoad: 0,
          strengthLoad: 0,
          duration: 0,
          exerciseCount: 0,
          completedCount: 0,
          intensityScore: 0,
          completionRate: 0,
          programCompletionRatio: 0,
          programCheckedCount: 0,
          programPlannedCount: 0,
          activeKcal: 0,
          kcalRefMedian: 0,
          steps: 0,
          stepsRefMedian: 0,
          intensityMinutesTotal: 0,
          visualContext: null,
          enduranceData: { reps: 0, duration: 0, distance: 0, jumps: 0, sessions: 0 },
          garminIcons: [],
          exercises: 0,
          session: null
        };
      }
      
      days.push({
        date: new Date(currentDay),
        isCurrentMonth: isCurrentMonthDay,
        isToday: currentDay.toDateString() === new Date().toDateString(),
        intensity
      });
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return days;
  };
  
  // ✅ NOUVEAU : Fonction pour calculer les statistiques de justifications par mois
  const calculateMonthJustificationStats = (monthDays) => {
    const stats = {
      [JUSTIFICATION_REASONS.MALADIE]: 0,
      [JUSTIFICATION_REASONS.FLEMME]: 0,
      [JUSTIFICATION_REASONS.PAS_LE_TEMPS]: 0,
      [JUSTIFICATION_REASONS.REPOS]: 0,
      [JUSTIFICATION_REASONS.AUTRE]: 0
    };
    
    monthDays.forEach(day => {
      if (day.isCurrentMonth && day.intensity?.justification) {
        const reason = day.intensity.justification.reason;
        if (stats[reason] !== undefined) {
          stats[reason]++;
        }
      }
    });
    
    return stats;
  };

  // Génération complète de l'année avec statistiques
  const generateYearData = (date) => {
    const year = date.getFullYear();
    const months = [];
    let yearStats = {
      totalSessions: 0,
      totalReps: 0,
      totalDuration: 0,
      avgIntensity: 0,
      bestMonth: null,
      bestDay: null
    };
    
    for (let month = 0; month < 12; month++) {
      const monthDate = new Date(year, month, 1);
      const monthDays = generateMonthDays(monthDate);
      
      // Calculer les stats du mois
      const monthSessions = monthDays.filter(day => 
        day.isCurrentMonth && day.intensity.level > 0
      );
      
      const monthTotalReps = monthSessions.reduce((sum, day) => sum + day.intensity.reps, 0);
      const monthTotalDuration = monthSessions.reduce((sum, day) => sum + day.intensity.duration, 0);
      const avgIntensity = monthSessions.length > 0 
        ? monthSessions.reduce((sum, day) => sum + day.intensity.level, 0) / monthSessions.length
        : 0;
      
      const monthData = {
        date: monthDate,
        days: monthDays,
        sessionsCount: monthSessions.length,
        totalReps: monthTotalReps,
        totalDuration: monthTotalDuration,
        avgIntensity: Math.round(avgIntensity * 10) / 10,
        bestDay: monthSessions.reduce((best, day) => 
          day.intensity.intensityScore > (best?.intensity.intensityScore || 0) ? day : best, null
        )
      };
      
      months.push(monthData);
      
      // Mettre à jour les stats annuelles
      yearStats.totalSessions += monthData.sessionsCount;
      yearStats.totalReps += monthData.totalReps;
      yearStats.totalDuration += monthData.totalDuration;
      
      if (!yearStats.bestMonth || monthData.totalReps > yearStats.bestMonth.totalReps) {
        yearStats.bestMonth = monthData;
      }
      
      if (monthData.bestDay && (!yearStats.bestDay || 
          monthData.bestDay.intensity.intensityScore > yearStats.bestDay.intensity.intensityScore)) {
        yearStats.bestDay = monthData.bestDay;
      }
    }
    
    yearStats.avgIntensity = yearStats.totalSessions > 0 
      ? Math.round((yearStats.totalReps / yearStats.totalSessions) * 10) / 10
      : 0;
    
    return { months, yearStats };
  };

  // Données calculées
  const monthDays = useMemo(() => generateMonthDays(currentDate), [
    currentDate,
    allData,
    garminData,
    garminKcalMedianRef,
    garminStepsMedianRef,
    variant,
    questIntensityMap,
    booksIntensityMap,
    learningIntensityMap,
  ]);
  const { months: yearMonths, yearStats } = useMemo(() => {
    if (isSidebarEmbed) {
      return {
        months: [],
        yearStats: {
          totalSessions: 0,
          totalReps: 0,
          totalDuration: 0,
          avgIntensity: 0,
          bestMonth: null,
          bestDay: null
        }
      };
    }
    return generateYearData(currentDate);
  }, [
    isSidebarEmbed,
    currentDate,
    allData,
    garminData,
    garminKcalMedianRef,
    garminStepsMedianRef,
    variant,
    questIntensityMap,
    booksIntensityMap,
    learningIntensityMap,
  ]);

  /**
   * Couleur case : dégradé direct depuis l’indice composite (sans recalage « teinte » sur la période).
   */
  const getDayColorStyle = (intensity, isToday = false) => {
    if (intensity?.isPlannedRestDay && !intensity?.justification) {
      const todayRing = isToday ? ' ring-2 ring-amber-300/95' : '';
      return {
        className: `bg-black border-2 border-violet-500/85${todayRing}`,
        style: undefined,
        dayNumberClass: 'text-violet-200'
      };
    }
    if (intensity?.justification) {
      const reason = intensity.justification.reason;
      const baseColor = JUSTIFICATION_COLORS[reason] || JUSTIFICATION_COLORS[JUSTIFICATION_REASONS.AUTRE];
      const todayRing = isToday ? ' ring-2 ring-amber-300/95' : '';
      const dayNum =
        JUSTIFICATION_DAY_NUMBER_CLASS[reason] ||
        JUSTIFICATION_DAY_NUMBER_CLASS[JUSTIFICATION_REASONS.AUTRE];
      return { className: `${baseColor}${todayRing}`, style: undefined, dayNumberClass: dayNum };
    }
    const level = Math.max(0, Math.min(4, intensity?.level || 0));
    const kcal = intensity?.activeKcal || 0;
    const kref = intensity?.kcalRefMedian || 0;
    const steps = intensity?.steps ?? 0;
    const intMin = intensity?.intensityMinutesTotal ?? 0;
    const vc = intensity?.visualContext;
    const tl = intensity?.trainingLoad ?? 0;

    const hasQuietGarmin =
      kcal >= 22 ||
      steps >= 380 ||
      intMin >= 1 ||
      tl >= 1.2 ||
      (vc && typeof vc.composite01 === 'number' && vc.composite01 >= 0.004);

    let u = typeof vc?.composite01 === 'number' ? Math.min(1, Math.max(0, vc.composite01)) : 0;
    if (hasQuietGarmin && level === 0) {
      u = Math.max(u, 0.12 + Math.min(0.08, steps / 18000) + Math.min(0.06, kcal / 800));
    }
    const levelFloor = (level / 4) * 0.28;
    u = Math.max(u, levelFloor);
    if (kcal > 85 && kref > 55) {
      const kn = Math.min(1.45, kcal / kref);
      const tk = Math.min(1, (level / 4) * 0.52 + (kn / 1.45) * 0.48);
      u = Math.max(u, tk * 0.55);
    }

    u += intensity?.feedbackBoost01 ?? 0;
    const programCompletionBlend = Math.min(1, Math.max(0, intensity?.programCompletionRatio ?? 0));
    if (variant === 'sport' && programCompletionBlend > 0) {
      u = Math.min(1, u + programCompletionBlend * 0.42);
    }
    u = Math.min(1, Math.max(0, u));

    const isRestLike =
      level === 0 &&
      !intensity?.justification &&
      !hasQuietGarmin &&
      u < 0.01 &&
      kcal < 48 &&
      steps < 3600 &&
      intMin < 3 &&
      tl < 1.5;

    if (isRestLike) {
      const todayRing = isToday ? ' ring-2 ring-amber-300/95' : '';
      if (variant === 'quests') {
        return {
          className: `bg-zinc-950 border-2 border-amber-500/55${todayRing}`,
          style: undefined,
          dayNumberClass: 'text-amber-100',
        };
      }
      if (variant === 'apprentissage') {
        return {
          className: `bg-black border-2 border-emerald-600/50${todayRing}`,
          style: undefined,
          dayNumberClass: 'text-emerald-200',
        };
      }
      if (variant === 'books') {
        return {
          className: `bg-zinc-950 border-2 border-[#3A86FF]${todayRing}`,
          style: undefined,
          dayNumberClass: 'text-sky-200',
        };
      }
      return {
        className: `bg-black border-2 border-blue-500/55${todayRing}`,
        style: undefined,
        dayNumberClass: 'text-sky-200/90',
      };
    }

    const ring = isToday ? 'ring-2 ring-amber-300/95' : '';
    const borderTone =
      variant === 'quests'
        ? 'border-2 border-amber-500/45'
        : variant === 'books'
          ? 'border-2 border-[#3A86FF]/55'
          : variant === 'apprentissage'
            ? 'border-2 border-emerald-500/50'
            : 'border-2 border-blue-500/50';

    if (variant === 'sport' && level === 0 && u < 0.08 && !intensity?.justification) {
      return {
        className: `${borderTone} bg-black ${ring}`.trim(),
        style: undefined,
        dayNumberClass: 'text-sky-200/90',
      };
    }

    return {
      className: `${borderTone} ${ring}`.trim(),
      style: { backgroundColor: calendarHeatmapCompositeBackground(u) },
      dayNumberClass: undefined,
    };
  };

  const getIntensityLabel = (level) => {
    const labels = {
      4: t('calendar.heatmap.intensityLabels.extreme', 'Extrême'),
      3: t('calendar.heatmap.intensityLabels.intense', 'Intense'),
      2: t('calendar.heatmap.intensityLabels.moderate', 'Modéré'),
      1: t('calendar.heatmap.intensityLabels.light', 'Léger'),
      0: t('calendar.heatmap.intensityLabels.rest', 'Repos')
    };
    return labels[level];
  };

  const getDayTooltip = (day, intensity) => {
    if (variant === 'quests' && intensity?.questData) {
      const qd = intensity.questData;
      const dateStr = day.date.toLocaleDateString('fr-FR');
      return `${dateStr} — ${qd.completedUnique ?? 0}/${qd.scheduledTotal ?? 0} quêtes · ${qd.xpTotal ?? 0} XP · ${qd.minutesOccupied ?? 0} min`;
    }
    if ((variant === 'books' || variant === 'apprentissage') && intensity?.bookData) {
      const bd = intensity.bookData;
      const dateStr = day.date.toLocaleDateString('fr-FR');
      return `${dateStr} — ${bd.sessions ?? 0} session(s) · ${bd.pages ?? 0} p. · ${bd.minutes ?? 0} min`;
    }
    const dateStr = day.date.toLocaleDateString('fr-FR');
    const vc = intensity?.visualContext;
    const scoreHint =
      vc != null && vc.visualScore100 != null
        ? ` — ${t('calendar.heatmap.tooltip.visualScore', { score: vc.visualScore100 })}`
        : '';
    const stepsHint =
      intensity?.steps > 0 ? ` — ${t('calendar.heatmap.tooltip.steps', { n: intensity.steps })}` : '';
    const baseTooltip = `${dateStr} - ${getIntensityLabel(intensity?.level || 0)}${intensity?.duration > 0 ? ` (${intensity.duration}min)` : ''}${intensity?.reps > 0 ? ` - ${intensity.reps} reps` : ''}${stepsHint}${scoreHint}`;

    if (intensity?.justification) {
      const reasonLabel = t(`justification.${intensity.justification.reason}`) || t('justification.autre');
      const note = intensity.justification.note ? ` : ${intensity.justification.note}` : '';
      return `${baseTooltip}\n${t('justification.button.dayJustified')} : ${reasonLabel}${note}`;
    }

    return baseTooltip;
  };

  const streaks = useMemo(() => {
    if (isSidebarEmbed) {
      return { currentStreak: 0, longestStreak: 0 };
    }
    return calculateStreaks();
  }, [isSidebarEmbed, workoutHistory]);

  // Constantes pour l'affichage
  const monthNames = useMemo(() => [
    t('calendar.heatmap.monthNames.january'),
    t('calendar.heatmap.monthNames.february'),
    t('calendar.heatmap.monthNames.march'),
    t('calendar.heatmap.monthNames.april'),
    t('calendar.heatmap.monthNames.may'),
    t('calendar.heatmap.monthNames.june'),
    t('calendar.heatmap.monthNames.july'),
    t('calendar.heatmap.monthNames.august'),
    t('calendar.heatmap.monthNames.september'),
    t('calendar.heatmap.monthNames.october'),
    t('calendar.heatmap.monthNames.november'),
    t('calendar.heatmap.monthNames.december')
  ], [t]);
  
  const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  return (
    <div className={isSidebarEmbed ? 'space-y-2 min-w-0' : 'space-y-6'}>
      {/* En-tête avec navigation */}
      <div className={heatmapModuleShell(variant, isSidebarEmbed, 'header')}>
        {!compact && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              {(isQuestsOrBooks ? ['month', 'year'] : ['month', 'year', 'streaks']).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-2 rounded-lg transition-all border ${
                    viewMode === mode
                      ? variant === 'quests'
                        ? 'bg-amber-500/25 border-amber-400 text-amber-100 font-semibold'
                        : variant === 'books'
                          ? 'bg-[#3A86FF]/18 border-[#3A86FF] text-sky-100 font-semibold'
                            : variant === 'apprentissage'
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-50 font-semibold'
                            : 'border-2 border-blue-400 bg-blue-950/45 font-semibold text-sky-50'
                      : variant === 'quests'
                        ? 'bg-black/50 border-amber-800/45 text-amber-300/90 hover:border-amber-500/55'
                        : variant === 'books'
                          ? 'bg-black/50 border-[#3A86FF]/45 text-sky-200/90 hover:border-[#3A86FF]'
                          : variant === 'apprentissage'
                            ? 'bg-black border-emerald-600/50 text-emerald-200/90 hover:border-emerald-400/80 hover:bg-emerald-950/30'
                            : 'border border-blue-500/50 bg-black text-sky-300 hover:border-sky-400/80 hover:text-sky-50'
                  }`}
                >
                  {mode === 'month'
                    ? t('calendar.heatmap.viewModes.month')
                    : mode === 'year'
                      ? t('calendar.heatmap.viewModes.year')
                      : t('calendar.heatmap.viewModes.streaks')}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between gap-1 min-w-0">
          <button
            type="button"
            onClick={() => navigateDate(-1)}
            className={
              variant === 'apprentissage'
                ? isSidebarEmbed
                  ? 'shrink-0 rounded-md border border-emerald-500/50 bg-black p-1 transition-all hover:border-emerald-400'
                  : 'rounded-lg border-2 border-emerald-500/55 bg-black p-2 transition-all hover:border-emerald-400'
                : variant === 'books'
                  ? isSidebarEmbed
                    ? 'shrink-0 rounded-md border border-[#3A86FF]/55 bg-black p-1 transition-all hover:border-sky-400'
                    : 'rounded-lg border-2 border-[#3A86FF]/60 bg-black p-2 transition-all hover:border-sky-400'
                  : variant === 'quests'
                    ? isSidebarEmbed
                      ? 'shrink-0 rounded-md border border-amber-500/50 bg-black p-1 transition-all hover:border-amber-400'
                      : 'rounded-lg border-2 border-amber-500/55 bg-black p-2 transition-all hover:border-amber-400'
                    : isSidebarEmbed
                      ? 'shrink-0 rounded-md border border-blue-500/50 bg-black p-1 transition-all hover:border-sky-400/70'
                      : 'rounded-lg border-2 border-blue-500/55 bg-black p-2 transition-all hover:border-sky-400/80'
            }
          >
            <ChevronLeft
              size={isSidebarEmbed ? 16 : 20}
              className={
                variant === 'apprentissage'
                  ? 'text-emerald-200'
                  : variant === 'books'
                    ? 'text-sky-200'
                    : variant === 'quests'
                      ? 'text-amber-200'
                      : 'text-sky-300'
              }
            />
          </button>

          <h3
            className={
              isSidebarEmbed
                ? `text-xs sm:text-sm font-semibold text-center truncate px-1 min-w-0 flex-1 ${
                    variant === 'quests'
                      ? 'text-amber-50'
                      : variant === 'books'
                        ? 'text-sky-100'
                        : variant === 'apprentissage'
                          ? 'text-emerald-100'
                          : 'text-sky-50'
                  }`
                : `text-xl font-bold ${
                    variant === 'quests'
                      ? 'text-amber-50'
                      : variant === 'books'
                        ? 'text-sky-100'
                        : variant === 'apprentissage'
                          ? 'text-emerald-100'
                          : 'text-sky-50'
                  }`
            }
          >
            {viewMode === 'month' || compact
              ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
              : viewMode === 'year'
              ? currentDate.getFullYear()
              : t('calendar.heatmap.streaksAnalysis')
            }
          </h3>

          <button
            type="button"
            onClick={() => navigateDate(1)}
            className={
              variant === 'apprentissage'
                ? isSidebarEmbed
                  ? 'shrink-0 rounded-md border border-emerald-500/50 bg-black p-1 transition-all hover:border-emerald-400'
                  : 'rounded-lg border-2 border-emerald-500/55 bg-black p-2 transition-all hover:border-emerald-400'
                : variant === 'books'
                  ? isSidebarEmbed
                    ? 'shrink-0 rounded-md border border-[#3A86FF]/55 bg-black p-1 transition-all hover:border-sky-400'
                    : 'rounded-lg border-2 border-[#3A86FF]/60 bg-black p-2 transition-all hover:border-sky-400'
                  : variant === 'quests'
                    ? isSidebarEmbed
                      ? 'shrink-0 rounded-md border border-amber-500/50 bg-black p-1 transition-all hover:border-amber-400'
                      : 'rounded-lg border-2 border-amber-500/55 bg-black p-2 transition-all hover:border-amber-400'
                    : isSidebarEmbed
                      ? 'shrink-0 rounded-md border border-blue-500/50 bg-black p-1 transition-all hover:border-sky-400/70'
                      : 'rounded-lg border-2 border-blue-500/55 bg-black p-2 transition-all hover:border-sky-400/80'
            }
          >
            <ChevronRight
              size={isSidebarEmbed ? 16 : 20}
              className={
                variant === 'apprentissage'
                  ? 'text-emerald-200'
                  : variant === 'books'
                    ? 'text-sky-200'
                    : variant === 'quests'
                      ? 'text-amber-200'
                      : 'text-sky-300'
              }
            />
          </button>
        </div>
      </div>

      {/* Légende améliorée */}
      <div className={heatmapModuleShell(variant, isSidebarEmbed, 'legend')}>
        <div
          className={
            isSidebarEmbed
              ? 'flex flex-col gap-1.5 min-w-0'
              : 'flex items-center justify-between'
          }
        >
          <div
            className={
              isSidebarEmbed
                ? 'flex flex-wrap items-center gap-x-1.5 gap-y-1 min-w-0'
                : 'flex items-center gap-4'
            }
          >
            <span
              className={
                isSidebarEmbed
                  ? variant === 'apprentissage'
                    ? 'text-[10px] text-emerald-300/80 shrink-0'
                    : 'text-[10px] text-slate-400 shrink-0'
                  : variant === 'apprentissage'
                    ? 'text-emerald-200/85 text-sm'
                    : 'text-slate-300 text-sm'
              }
            >
              {t('calendar.heatmap.intensity')}
            </span>
            <div className={isSidebarEmbed ? 'flex flex-wrap gap-x-1.5 gap-y-0.5 min-w-0' : 'flex flex-wrap gap-2'}>
              {[
                { level: 0, u: 0 },
                { level: 1, u: 0.16 },
                { level: 2, u: 0.42 },
                { level: 3, u: 0.72 },
                { level: 4, u: 1 }
              ].map(({ level, u }) => (
                <div
                  key={level}
                  className={isSidebarEmbed ? 'flex items-center gap-0.5 shrink-0' : 'flex items-center gap-1'}
                >
                  <div
                    className={`rounded border shrink-0 ${
                      variant === 'apprentissage'
                        ? 'border-emerald-500/50'
                        : variant === 'quests' || variant === 'books'
                          ? 'border-slate-600/70'
                          : 'border-blue-500/55'
                    } ${isSidebarEmbed ? 'w-2.5 h-2.5' : 'w-4 h-4'}`}
                    style={{ backgroundColor: calendarHeatmapCompositeBackground(u) }}
                  />
                  <span
                    className={
                      isSidebarEmbed
                        ? variant === 'apprentissage'
                          ? 'text-[9px] text-emerald-300/75 leading-none'
                          : variant === 'quests' || variant === 'books'
                            ? 'text-[9px] text-slate-400 leading-none'
                            : 'text-[9px] leading-none text-[#7ab9a8]'
                        : variant === 'apprentissage'
                          ? 'text-xs text-emerald-200/75'
                          : variant === 'quests' || variant === 'books'
                            ? 'text-xs text-slate-400'
                            : 'text-xs text-[#7ab9a8]'
                    }
                  >
                    {getIntensityLabel(level)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {!isSidebarEmbed && (
            <button
              type="button"
              onClick={() => setShowStats(!showStats)}
              className={
                variant === 'quests'
                  ? 'text-sm text-amber-300 hover:text-amber-200'
                  : variant === 'books'
                    ? 'text-sm text-sky-300 hover:text-sky-200'
                    : variant === 'apprentissage'
                      ? 'text-sm text-emerald-300 hover:text-emerald-200'
                      : 'text-sm text-sky-400 hover:text-sky-200'
              }
            >
              {showStats ? t('calendar.heatmap.hideStats') : t('calendar.heatmap.showStats')}
            </button>
          )}
        </div>
      </div>

      {/* Vue mensuelle détaillée */}
      {(viewMode === 'month' || compact) && (
        <div className={heatmapModuleShell(variant, isSidebarEmbed, 'month')}>
          {/* En-têtes des jours */}
          <div className={`grid grid-cols-7 ${isSidebarEmbed ? 'gap-0.5 mb-1' : 'gap-2 mb-4'}`}>
            {weekDays.map((day, index) => (
              <div
                key={`weekday-${index}`}
                className={
                  isSidebarEmbed
                    ? `text-center text-[9px] font-medium py-0.5 px-0 ${
                        variant === 'quests'
                          ? 'text-amber-500/80'
                          : variant === 'books'
                            ? 'text-sky-300/90'
                            : variant === 'apprentissage'
                              ? 'text-emerald-400/85'
                              : 'text-[#88c9b4]/90'
                      }`
                    : `text-center text-sm font-medium p-2 ${
                        variant === 'quests'
                          ? 'text-amber-400/85'
                          : variant === 'books'
                            ? 'text-sky-300/90'
                            : variant === 'apprentissage'
                              ? 'text-emerald-300/90'
                              : 'text-[#88c9b4]/90'
                      }`
                }
              >
                {day}
              </div>
            ))}
          </div>

          {/* Grille des jours */}
          <div className={`grid grid-cols-7 ${isSidebarEmbed ? 'gap-0.5' : 'gap-2'}`}>
            {monthDays.map((day, index) => {
              const cellColor = getDayColorStyle(day.intensity, day.isToday);
              const dayHasPaint = calendarDayHasPaintSignal(day.intensity);
              const dayNumTone = cellColor.dayNumberClass ?? heatmapDayNumberTone();
              const dayDateStr = getDateStr(day.date);
              const stepsCount =
                day.intensity?.steps != null && Number.isFinite(Number(day.intensity.steps))
                  ? Math.max(0, Math.round(Number(day.intensity.steps)))
                  : 0;
              const showStepsOnTile =
                stepsCount > 0 && stepsRevealedByDateStr[dayDateStr] === true;
              const stepsLocale = language === 'en' ? 'en-US' : 'fr-FR';
              const stepsTileLabel = showStepsOnTile
                ? t('calendar.heatmap.stepsOnCell', {
                    count: stepsCount.toLocaleString(stepsLocale)
                  })
                : '';
              const questTileCount =
                variant === 'quests'
                  ? day.intensity?.questData?.completedUnique ?? 0
                  : variant === 'books' || variant === 'apprentissage'
                    ? day.intensity?.bookData?.sessions ?? 0
                    : 0;
              const showQuestCountOnTile =
                (variant === 'quests' &&
                  questTileCount > 0 &&
                  (day.intensity?.level > 0 || dayHasPaint)) ||
                ((variant === 'books' || variant === 'apprentissage') &&
                  questTileCount > 0 &&
                  dayHasPaint);
              return (
              <div
                key={index}
                onClick={() => {
                  const dateStr = getDateStr(day.date);
                  setStepsRevealedByDateStr((prev) => ({ ...prev, [dateStr]: true }));
                  if (isQuestsOrBooks) {
                    setSelectedDate(day);
                    setPanelMode('details');
                    setPanelDate(null);
                    return;
                  }
                  const manualTap = normalizeManualDailyWalkByDate(allData?.enduranceData?.manualDailyWalkByDate)[
                    dateStr
                  ]?.steps ?? 0;
                  const hasGarmin = hasMeaningfulGarminDailyMetrics(garminData, dateStr, manualTap);
                  if (!dayHasPaint && !hasGarmin && isDayWithoutActivity(allData, dateStr)) {
                    setPanelDate(day.date);
                    setPanelMode('choice');
                    setSelectedDate(null);
                  } else {
                    setSelectedDate(day);
                    setPanelMode('details');
                    setPanelDate(null);
                  }
                }}
                className={`
                  aspect-square rounded-lg ${isSidebarEmbed ? 'border' : 'border-2'} cursor-pointer transition-all duration-200 relative min-w-0
                  ${cellColor.className}
                  ${day.isCurrentMonth ? 'border-transparent' : 'border-slate-600 opacity-30'}
                  ${selectedDate?.date.toDateString() === day.date.toDateString()
                    ? variant === 'quests'
                      ? 'ring-2 ring-amber-400'
                      : variant === 'books'
                        ? 'ring-2 ring-[#3A86FF]'
                        : variant === 'apprentissage'
                          ? 'ring-2 ring-emerald-400'
                          : 'ring-2 ring-blue-400/90'
                    : ''}
                  ${
                    isSidebarEmbed
                      ? variant === 'quests'
                        ? 'hover:ring-1 hover:ring-amber-400/80'
                        : variant === 'books'
                          ? 'hover:ring-1 hover:ring-[#3A86FF]/85'
                          : variant === 'apprentissage'
                            ? 'hover:ring-1 hover:ring-emerald-400/80'
                            : 'hover:ring-1 hover:ring-blue-400/80'
                      : variant === 'quests'
                        ? 'hover:ring-2 hover:ring-amber-400/90 hover:scale-105'
                        : variant === 'books'
                          ? 'hover:ring-2 hover:ring-[#3A86FF] hover:scale-105'
                          : variant === 'apprentissage'
                            ? 'hover:ring-2 hover:ring-emerald-400/90 hover:scale-105'
                            : 'hover:ring-2 hover:ring-sky-400/80 hover:scale-105'
                  }
                `}
                style={cellColor.style}
                  title={getDayTooltip(day, day.intensity)}
              >
                <div className="w-full h-full flex flex-col items-center justify-center relative px-px">
                  {isSidebarEmbed ? (
                    <span
                      className={`tabular-nums text-[10px] font-semibold leading-none text-center max-w-full truncate flex flex-col items-center gap-0 ${dayNumTone}`}
                    >
                      <span className="leading-none">
                        {day.date.getDate()}
                        {showQuestCountOnTile ? (
                          <span className={`text-[7px] font-normal opacity-95 ${dayNumTone}`}>
                            ·{questTileCount}
                          </span>
                        ) : (day.intensity.level > 0 || dayHasPaint) && Number(day.intensity.reps) > 0 ? (
                          <span className={`text-[7px] font-normal opacity-95 ${dayNumTone}`}>
                            ·{day.intensity.reps}
                          </span>
                        ) : null}
                      </span>
                      {showStepsOnTile ? (
                        <span className={`text-[6px] font-medium leading-none mt-0.5 max-w-full truncate ${dayNumTone}`}>
                          {stepsTileLabel}
                        </span>
                      ) : null}
                    </span>
                  ) : (
                    <>
                      <span className={`text-sm font-semibold ${dayNumTone}`}>
                        {day.date.getDate()}
                      </span>
                      {showQuestCountOnTile ? (
                        <div className={`text-xs leading-none opacity-95 ${dayNumTone}`}>
                          {questTileCount}
                        </div>
                      ) : (
                        (day.intensity.level > 0 || dayHasPaint) &&
                        Number(day.intensity.reps) > 0 && (
                          <div className={`text-xs leading-none opacity-95 ${dayNumTone}`}>
                            {day.intensity.reps}
                          </div>
                        )
                      )}
                      {showStepsOnTile ? (
                        <div className={`text-[10px] leading-tight font-medium mt-0.5 ${dayNumTone}`}>
                          {stepsTileLabel}
                        </div>
                      ) : null}
                    </>
                  )}
                  {/* PHASE 5.3 : Icônes Garmin (discret, en bas à droite) */}
                  {day.intensity.garminIcons && day.intensity.garminIcons.length > 0 && !isSidebarEmbed && (
                    <div className="absolute bottom-1 right-1 flex gap-0.5">
                      {day.intensity.garminIcons.map((iconData, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] leading-none"
                          title={iconData.label}
                        >
                          {iconData.icon}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {day.isToday && (
                  <div
                    className={`absolute bg-blue-500 rounded-full ${isSidebarEmbed ? 'top-0 right-0 w-1.5 h-1.5' : '-top-1 -right-1 w-3 h-3'}`}
                  />
                )}
              </div>
            );
            })}
          </div>
          
          {/* ✅ NOUVEAU : Compteurs de justifications en bas du mois */}
          {(() => {
            if (isQuestsOrBooks) return null;
            const monthStats = calculateMonthJustificationStats(monthDays);
            const hasJustifications = Object.values(monthStats).some(count => count > 0);
            
            if (!hasJustifications) return null;
            
            return (
              <div className={isSidebarEmbed ? 'mt-2 pt-2 border-t border-slate-700/50' : 'mt-4 pt-4 border-t border-slate-700/50'}>
                <div className={isSidebarEmbed ? 'text-[10px] text-slate-400 mb-1' : 'text-xs text-slate-400 mb-2'}>
                  {t('calendar.heatmap.monthlyJustifications')}
                </div>
                <div className="flex flex-wrap gap-2">
                  {monthStats[JUSTIFICATION_REASONS.MALADIE] > 0 && (
                    <div className={`flex items-center gap-1 rounded px-2 py-1 text-xs ${JUSTIFICATION_COLORS[JUSTIFICATION_REASONS.MALADIE]} ${JUSTIFICATION_TEXT[JUSTIFICATION_REASONS.MALADIE]}`}>
                      <span>{JUSTIFICATION_ICONS[JUSTIFICATION_REASONS.MALADIE]}</span>
                      <span className="font-medium">{monthStats[JUSTIFICATION_REASONS.MALADIE]}</span>
                      <span className="opacity-85">{t(`justification.${JUSTIFICATION_REASONS.MALADIE}`)}</span>
                    </div>
                  )}
                  {monthStats[JUSTIFICATION_REASONS.FLEMME] > 0 && (
                    <div className={`flex items-center gap-1 rounded px-2 py-1 text-xs ${JUSTIFICATION_COLORS[JUSTIFICATION_REASONS.FLEMME]} ${JUSTIFICATION_TEXT[JUSTIFICATION_REASONS.FLEMME]}`}>
                      <span>{JUSTIFICATION_ICONS[JUSTIFICATION_REASONS.FLEMME]}</span>
                      <span className="font-medium">{monthStats[JUSTIFICATION_REASONS.FLEMME]}</span>
                      <span className="opacity-85">{t(`justification.${JUSTIFICATION_REASONS.FLEMME}`)}</span>
                    </div>
                  )}
                  {monthStats[JUSTIFICATION_REASONS.PAS_LE_TEMPS] > 0 && (
                    <div className={`flex items-center gap-1 rounded px-2 py-1 text-xs ${JUSTIFICATION_COLORS[JUSTIFICATION_REASONS.PAS_LE_TEMPS]} ${JUSTIFICATION_TEXT[JUSTIFICATION_REASONS.PAS_LE_TEMPS]}`}>
                      <span>{JUSTIFICATION_ICONS[JUSTIFICATION_REASONS.PAS_LE_TEMPS]}</span>
                      <span className="font-medium">{monthStats[JUSTIFICATION_REASONS.PAS_LE_TEMPS]}</span>
                      <span className="opacity-85">{t(`justification.${JUSTIFICATION_REASONS.PAS_LE_TEMPS}`)}</span>
                    </div>
                  )}
                  {monthStats[JUSTIFICATION_REASONS.REPOS] > 0 && (
                    <div className={`flex items-center gap-1 rounded px-2 py-1 text-xs ${JUSTIFICATION_COLORS[JUSTIFICATION_REASONS.REPOS]} ${JUSTIFICATION_TEXT[JUSTIFICATION_REASONS.REPOS]}`}>
                      <span>{JUSTIFICATION_ICONS[JUSTIFICATION_REASONS.REPOS]}</span>
                      <span className="font-medium">{monthStats[JUSTIFICATION_REASONS.REPOS]}</span>
                      <span className="opacity-85">{t(`justification.${JUSTIFICATION_REASONS.REPOS}`)}</span>
                    </div>
                  )}
                  {monthStats[JUSTIFICATION_REASONS.AUTRE] > 0 && (
                    <div className={`flex items-center gap-1 rounded px-2 py-1 text-xs ${JUSTIFICATION_COLORS[JUSTIFICATION_REASONS.AUTRE]} ${JUSTIFICATION_TEXT[JUSTIFICATION_REASONS.AUTRE]}`}>
                      <span>{JUSTIFICATION_ICONS[JUSTIFICATION_REASONS.AUTRE]}</span>
                      <span className="font-medium">{monthStats[JUSTIFICATION_REASONS.AUTRE]}</span>
                      <span className="opacity-85">{t(`justification.${JUSTIFICATION_REASONS.AUTRE}`)}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Vue annuelle complète */}
      {!compact && viewMode === 'year' && (
        <div className="space-y-6">
          {/* Résumé annuel */}
          <div className={heatmapModuleShell(variant, isSidebarEmbed, 'wide')}>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="text-amber-400" />
              {t('calendar.heatmap.yearSummary', { year: currentDate.getFullYear() })}
            </h3>

            {variant === 'quests' && questYearAggregates ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-black border border-slate-600 rounded-lg p-4">
                  <div className="text-slate-400 text-sm">
                    {t('quests.calendar.yearBestMonthXp', 'Meilleur mois (XP)')}
                  </div>
                  <div className="text-xl font-bold text-white">
                    {questYearAggregates.bestMonthIdx >= 0 && questYearAggregates.bestMonthXp > 0
                      ? monthNames[questYearAggregates.bestMonthIdx]
                      : 'N/A'}
                  </div>
                  <div className="text-sm text-slate-300">
                    {questYearAggregates.bestMonthXp > 0 ? `${questYearAggregates.bestMonthXp} XP` : '—'}
                  </div>
                </div>
                <div className="bg-black border border-slate-600 rounded-lg p-4">
                  <div className="text-slate-400 text-sm">
                    {t('quests.calendar.yearBestDay', 'Jour le plus chargé')}
                  </div>
                  <div className="text-xl font-bold text-white">
                    {questYearAggregates.bestDay?.dateStr
                      ? new Date(`${questYearAggregates.bestDay.dateStr}T12:00:00`).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                        })
                      : 'N/A'}
                  </div>
                  <div className="text-sm text-slate-300">
                    {questYearAggregates.bestDay?.qd?.xpTotal || 0} XP ·{' '}
                    {questYearAggregates.bestDay?.qd?.completedUnique || 0}{' '}
                    {t('quests.calendar.questsDone', 'quêtes')}
                  </div>
                </div>
                <div className="bg-black border border-slate-600 rounded-lg p-4">
                  <div className="text-slate-400 text-sm">
                    {t('quests.calendar.yearTotals', 'Totaux année')}
                  </div>
                  <div className="text-xl font-bold text-white">{questYearAggregates.totalXp} XP</div>
                  <div className="text-sm text-slate-300">
                    {questYearAggregates.activeDays}{' '}
                    {t('quests.calendar.activeDaysShort', 'jours actifs')} ·{' '}
                    {questYearAggregates.totalMinutes} min
                  </div>
                </div>
              </div>
            ) : variant === 'apprentissage' && learningYearAggregates ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-black border-2 border-emerald-500/55 rounded-lg p-4">
                  <div className="text-emerald-200/70 text-sm">Meilleur mois (temps d&apos;étude)</div>
                  <div className="text-xl font-bold text-emerald-50">
                    {learningYearAggregates.bestMonthIdx >= 0 && learningYearAggregates.bestMonthMinutes > 0
                      ? monthNames[learningYearAggregates.bestMonthIdx]
                      : 'N/A'}
                  </div>
                  <div className="text-sm text-emerald-200/80">
                    {learningYearAggregates.bestMonthMinutes > 0
                      ? `${learningYearAggregates.bestMonthMinutes} min`
                      : '—'}
                  </div>
                </div>
                <div className="bg-black border-2 border-emerald-500/55 rounded-lg p-4">
                  <div className="text-emerald-200/70 text-sm">Jour le plus chargé</div>
                  <div className="text-xl font-bold text-emerald-50">
                    {learningYearAggregates.bestDay?.dateStr
                      ? new Date(`${learningYearAggregates.bestDay.dateStr}T12:00:00`).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                        })
                      : 'N/A'}
                  </div>
                  <div className="text-sm text-emerald-200/80">
                    {(learningYearAggregates.bestDay?.bd?.minutes || 0) +
                      ' min · ' +
                      (learningYearAggregates.bestDay?.bd?.sessions || 0) +
                      ' session(s)'}
                  </div>
                </div>
                <div className="bg-black border-2 border-emerald-500/55 rounded-lg p-4">
                  <div className="text-emerald-200/70 text-sm">Totaux année</div>
                  <div className="text-xl font-bold text-emerald-50">{learningYearAggregates.totalMinutes} min</div>
                  <div className="text-sm text-emerald-200/80">
                    {learningYearAggregates.activeDays} jours avec étude ·{' '}
                    {learningYearAggregates.totalSessions} sessions
                  </div>
                </div>
              </div>
            ) : variant === 'books' && booksYearAggregates ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-black/90 border border-[#3A86FF]/45 rounded-lg p-4">
                  <div className="text-sky-200/80 text-sm">Meilleur mois (pages)</div>
                  <div className="text-xl font-bold text-sky-100">
                    {booksYearAggregates.bestMonthIdx >= 0 && booksYearAggregates.bestMonthPages > 0
                      ? monthNames[booksYearAggregates.bestMonthIdx]
                      : 'N/A'}
                  </div>
                  <div className="text-sm text-sky-200/85">
                    {booksYearAggregates.bestMonthPages > 0
                      ? `${booksYearAggregates.bestMonthPages} p.`
                      : '—'}
                  </div>
                </div>
                <div className="bg-black/90 border border-[#3A86FF]/45 rounded-lg p-4">
                  <div className="text-sky-200/80 text-sm">Jour le plus chargé</div>
                  <div className="text-xl font-bold text-sky-100">
                    {booksYearAggregates.bestDay?.dateStr
                      ? new Date(`${booksYearAggregates.bestDay.dateStr}T12:00:00`).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                        })
                      : 'N/A'}
                  </div>
                  <div className="text-sm text-sky-200/85">
                    {(booksYearAggregates.bestDay?.bd?.pages || 0) +
                      ' p. · ' +
                      (booksYearAggregates.bestDay?.bd?.minutes || 0) +
                      ' min'}
                  </div>
                </div>
                <div className="bg-black/90 border border-[#3A86FF]/45 rounded-lg p-4">
                  <div className="text-sky-200/80 text-sm">Totaux année</div>
                  <div className="text-xl font-bold text-sky-100">{booksYearAggregates.totalPages} p.</div>
                  <div className="text-sm text-sky-200/85">
                    {booksYearAggregates.activeDays} jours avec session · {booksYearAggregates.totalMinutes}{' '}
                    min · {booksYearAggregates.totalSessions} sessions
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg border-2 border-blue-500/45 bg-black p-4">
                  <div className="text-sm text-sky-500">{t('calendar.heatmap.bestMonth')}</div>
                  <div className="text-xl font-bold text-sky-50">
                    {yearStats.bestMonth ? monthNames[yearStats.bestMonth.date.getMonth()] : 'N/A'}
                  </div>
                  <div className="text-sm text-sky-300/90">
                    {yearStats.bestMonth?.totalReps || 0} reps
                  </div>
                </div>

                <div className="rounded-lg border-2 border-sky-600/40 bg-black p-4">
                  <div className="text-sm text-sky-500">{t('calendar.heatmap.bestDay')}</div>
                  <div className="text-xl font-bold text-sky-50">
                    {yearStats.bestDay
                      ? yearStats.bestDay.date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
                      : 'N/A'}
                  </div>
                  <div className="text-sm text-sky-300/90">
                    {yearStats.bestDay?.intensity.reps || 0} reps
                  </div>
                </div>

                <div className="rounded-lg border-2 border-blue-500/45 bg-black p-4">
                  <div className="text-sm text-sky-500">{t('calendar.heatmap.avgPerSession')}</div>
                  <div className="text-xl font-bold text-sky-50">{yearStats.avgIntensity}</div>
                  <div className="text-sm text-sky-300/90">{t('calendar.heatmap.repsPerSession')}</div>
                </div>
              </div>
            )}
          </div>

          {/* Grille des mois */}
          <div className={heatmapModuleShell(variant, isSidebarEmbed, 'wide')}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {yearMonths.map((month, monthIndex) => (
                <div key={monthIndex} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4
                      className={`font-medium ${
                        variant === 'quests'
                          ? 'text-amber-50'
                          : variant === 'books'
                            ? 'text-sky-100'
                            : variant === 'apprentissage'
                              ? 'text-emerald-100'
                              : 'text-white'
                      }`}
                    >
                      {monthNames[month.date.getMonth()]}
                    </h4>
                    <div
                      className={`text-xs ${
                        variant === 'quests'
                          ? 'text-amber-200/65'
                          : variant === 'books'
                            ? 'text-sky-200/80'
                            : variant === 'apprentissage'
                              ? 'text-emerald-300/75'
                              : 'text-slate-400'
                      }`}
                    >
                      {variant === 'quests'
                        ? `${month.days.filter(
                            (d) =>
                              d.isCurrentMonth &&
                              (d.intensity?.questData?.completedUnique || 0) > 0
                          ).length} jour(s) avec quêtes`
                        : variant === 'books'
                          ? `${month.days.filter(
                              (d) =>
                                d.isCurrentMonth && (d.intensity?.bookData?.sessions || 0) > 0
                            ).length} jour(s) avec lecture`
                          : variant === 'apprentissage'
                            ? `${month.days.filter(
                                (d) =>
                                  d.isCurrentMonth && (d.intensity?.bookData?.sessions || 0) > 0
                              ).length} jour(s) avec étude`
                            : t('calendar.stats.sessions', { count: month.sessionsCount })}
                    </div>
                  </div>
                  
                  {/* Mini calendrier */}
                  <div className={yearMiniGridShell(variant)}>
                    <div className="grid grid-cols-7 gap-1 mb-1">
                      {weekDays.map((day, index) => (
                        <div
                          key={`year-weekday-${index}`}
                          className={`text-center text-xs ${
                            variant === 'quests'
                              ? 'text-amber-500/85 font-semibold'
                              : variant === 'books'
                                ? 'text-sky-300/90 font-semibold'
                                : variant === 'apprentissage'
                                  ? 'text-emerald-100/90'
                                  : 'text-slate-500'
                          }`}
                        >
                          {day}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {month.days.map((day, dayIndex) => {
                        const yCell = getDayColorStyle(day.intensity, false);
                        const yPaint = calendarDayHasPaintSignal(day.intensity);
                        const yDayNumTone = yCell.dayNumberClass ?? heatmapDayNumberTone();
                        const yDateStr = getDateStr(day.date);
                        const yStepsCount =
                          day.intensity?.steps != null && Number.isFinite(Number(day.intensity.steps))
                            ? Math.max(0, Math.round(Number(day.intensity.steps)))
                            : 0;
                        const yShowSteps =
                          yStepsCount > 0 && stepsRevealedByDateStr[yDateStr] === true;
                        const yStepsLocale = language === 'en' ? 'en-US' : 'fr-FR';
                        const yStepsLabel = yShowSteps
                          ? t('calendar.heatmap.stepsOnCell', {
                              count: yStepsCount.toLocaleString(yStepsLocale)
                            })
                          : '';
                        return (
                        <div
                          key={dayIndex}
                          className={`
                            aspect-square rounded-sm cursor-pointer transition-all text-xs flex flex-col items-center justify-center gap-0 py-0.5
                            ${yCell.className}
                            ${day.isCurrentMonth ? '' : 'opacity-20'}
                            hover:ring-1 ${
                              variant === 'quests'
                                ? 'hover:ring-amber-400/90'
                                : variant === 'books'
                                  ? 'hover:ring-[#3A86FF]/90'
                                  : variant === 'apprentissage'
                                    ? 'hover:ring-emerald-400/90'
                                    : 'hover:ring-blue-400/90'
                            } hover:scale-110
                          `}
                          style={yCell.style}
                          onClick={() => {
                            const dateStr = getDateStr(day.date);
                            setStepsRevealedByDateStr((prev) => ({ ...prev, [dateStr]: true }));
                            setCurrentDate(new Date(day.date));
                            setViewMode('month');
                            if (isQuestsOrBooks) {
                              setSelectedDate(day);
                              setPanelMode('details');
                              setPanelDate(null);
                              return;
                            }
                            const yHasPaint = calendarDayHasPaintSignal(day.intensity);
                            const manualY =
                              normalizeManualDailyWalkByDate(allData?.enduranceData?.manualDailyWalkByDate)[
                                dateStr
                              ]?.steps ?? 0;
                            const hasGarmin = hasMeaningfulGarminDailyMetrics(garminData, dateStr, manualY);
                            if (!yHasPaint && !hasGarmin && isDayWithoutActivity(allData, dateStr)) {
                              setPanelDate(day.date);
                              setPanelMode('choice');
                              setSelectedDate(null);
                            } else {
                              setSelectedDate(day);
                              setPanelMode('details');
                              setPanelDate(null);
                            }
                          }}
                          title={getDayTooltip(day, day.intensity)}
                        >
                          <span
                            className={`leading-none tabular-nums ${
                              day.isCurrentMonth
                                ? `text-xs font-bold ${yDayNumTone}`
                                : `text-[10px] font-medium ${yDayNumTone}`
                            }`}
                          >
                            {day.date.getDate()}
                          </span>
                          {yShowSteps ? (
                            <span
                              className={`leading-none text-[8px] font-medium text-center max-w-[95%] truncate mt-px ${yDayNumTone}`}
                            >
                              {yStepsLabel}
                            </span>
                          ) : null}
                        </div>
                      );
                      })}
                    </div>
                  </div>

                  {/* Stats du mois */}
                  {variant === 'quests' && questCalendarContext?.validationsByDate ? (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-black/90 border border-amber-500/40 rounded p-2 text-center text-amber-100">
                        <div className="text-amber-200 font-bold tabular-nums">
                          {sumQuestXpForMonth(
                            month.date.getFullYear(),
                            month.date.getMonth(),
                            questCalendarContext.validationsByDate
                          )}
                        </div>
                        <div className="text-amber-200/60">
                          {t('quests.calendar.monthXp', 'XP ce mois')}
                        </div>
                      </div>
                      <div className="bg-black/90 border border-amber-500/40 rounded p-2 text-center text-amber-100">
                        <div className="text-amber-200 font-bold tabular-nums">
                          {month.days.reduce(
                            (sum, d) =>
                              sum +
                              (d.isCurrentMonth ? d.intensity?.questData?.completedCount || 0 : 0),
                            0
                          )}
                        </div>
                        <div className="text-amber-200/60">
                          {t('quests.calendar.monthChecks', 'Validations')}
                        </div>
                      </div>
                    </div>
                  ) : variant === 'books' && booksCalendarContext?.sessionsByDate ? (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-black/90 border border-[#3A86FF]/40 rounded p-2 text-center text-sky-100">
                        <div className="text-sky-100 font-bold tabular-nums">
                          {sumBooksPagesForMonth(
                            month.date.getFullYear(),
                            month.date.getMonth(),
                            booksCalendarContext.sessionsByDate
                          )}
                        </div>
                        <div className="text-sky-200/80">Pages ce mois</div>
                      </div>
                      <div className="bg-black/90 border border-[#3A86FF]/40 rounded p-2 text-center text-sky-100">
                        <div className="text-sky-100 font-bold tabular-nums">
                          {sumBooksMinutesForMonth(
                            month.date.getFullYear(),
                            month.date.getMonth(),
                            booksCalendarContext.sessionsByDate
                          )}
                          min
                        </div>
                        <div className="text-sky-200/80">Temps lecture</div>
                      </div>
                    </div>
                  ) : variant === 'apprentissage' && learningSessionsByDateResolved ? (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-black border-2 border-emerald-500/50 rounded p-2 text-center">
                        <div className="text-emerald-100 font-bold tabular-nums">
                          {sumLearningSessionsForMonth(
                            month.date.getFullYear(),
                            month.date.getMonth(),
                            learningSessionsByDateResolved
                          )}
                        </div>
                        <div className="text-emerald-300/70">Sessions ce mois</div>
                      </div>
                      <div className="bg-black border-2 border-emerald-500/50 rounded p-2 text-center">
                        <div className="text-emerald-100 font-bold tabular-nums">
                          {sumBooksMinutesForMonth(
                            month.date.getFullYear(),
                            month.date.getMonth(),
                            learningSessionsByDateResolved
                          )}
                          min
                        </div>
                        <div className="text-emerald-300/70">Temps d&apos;étude</div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-700/50 rounded p-2 text-center">
                        <div className="text-white font-bold">{month.totalReps}</div>
                        <div className="text-slate-400">{t('calendar.stats.reps_endurance')}</div>
                      </div>
                      <div className="bg-slate-700/50 rounded p-2 text-center">
                        <div className="text-white font-bold">{month.totalDuration}min</div>
                        <div className="text-slate-400">{t('calendar.stats.total_time')}</div>
                      </div>
                    </div>
                  )}

                  {/* ✅ NOUVEAU : Compteurs de justifications en dessous des stats */}
                  {(() => {
                    if (isQuestsOrBooks) return null;
                    const monthStats = calculateMonthJustificationStats(month.days);
                    const hasJustifications = Object.values(monthStats).some(count => count > 0);
                    
                    if (!hasJustifications) return null;
                    
                    return (
                      <div className="mt-2 pt-2 border-t border-slate-700/50">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {monthStats[JUSTIFICATION_REASONS.MALADIE] > 0 && (
                            <div className={`flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] ${JUSTIFICATION_COLORS[JUSTIFICATION_REASONS.MALADIE]} ${JUSTIFICATION_TEXT[JUSTIFICATION_REASONS.MALADIE]}`}>
                              <span className="text-[10px]">{JUSTIFICATION_ICONS[JUSTIFICATION_REASONS.MALADIE]}</span>
                              <span className="font-medium">{monthStats[JUSTIFICATION_REASONS.MALADIE]}</span>
                            </div>
                          )}
                          {monthStats[JUSTIFICATION_REASONS.FLEMME] > 0 && (
                            <div className={`flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] ${JUSTIFICATION_COLORS[JUSTIFICATION_REASONS.FLEMME]} ${JUSTIFICATION_TEXT[JUSTIFICATION_REASONS.FLEMME]}`}>
                              <span className="text-[10px]">{JUSTIFICATION_ICONS[JUSTIFICATION_REASONS.FLEMME]}</span>
                              <span className="font-medium">{monthStats[JUSTIFICATION_REASONS.FLEMME]}</span>
                            </div>
                          )}
                          {monthStats[JUSTIFICATION_REASONS.PAS_LE_TEMPS] > 0 && (
                            <div className={`flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] ${JUSTIFICATION_COLORS[JUSTIFICATION_REASONS.PAS_LE_TEMPS]} ${JUSTIFICATION_TEXT[JUSTIFICATION_REASONS.PAS_LE_TEMPS]}`}>
                              <span className="text-[10px]">{JUSTIFICATION_ICONS[JUSTIFICATION_REASONS.PAS_LE_TEMPS]}</span>
                              <span className="font-medium">{monthStats[JUSTIFICATION_REASONS.PAS_LE_TEMPS]}</span>
                            </div>
                          )}
                          {monthStats[JUSTIFICATION_REASONS.REPOS] > 0 && (
                            <div className={`flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] ${JUSTIFICATION_COLORS[JUSTIFICATION_REASONS.REPOS]} ${JUSTIFICATION_TEXT[JUSTIFICATION_REASONS.REPOS]}`}>
                              <span className="text-[10px]">{JUSTIFICATION_ICONS[JUSTIFICATION_REASONS.REPOS]}</span>
                              <span className="font-medium">{monthStats[JUSTIFICATION_REASONS.REPOS]}</span>
                            </div>
                          )}
                          {monthStats[JUSTIFICATION_REASONS.AUTRE] > 0 && (
                            <div className={`flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] ${JUSTIFICATION_COLORS[JUSTIFICATION_REASONS.AUTRE]} ${JUSTIFICATION_TEXT[JUSTIFICATION_REASONS.AUTRE]}`}>
                              <span className="text-[10px]">{JUSTIFICATION_ICONS[JUSTIFICATION_REASONS.AUTRE]}</span>
                              <span className="font-medium">{monthStats[JUSTIFICATION_REASONS.AUTRE]}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Vue Streaks */}
      {!compact && viewMode === 'streaks' && !isQuestsOrBooks && (
        <div className="rounded-xl border-2 border-blue-500/55 bg-black p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-sky-600/40 bg-black/80 p-6 text-center">
              <Flame className="mx-auto mb-4 h-12 w-12 text-orange-500" />
              <div className="mb-2 text-3xl font-bold text-sky-50">{streaks.currentStreak}</div>
              <div className="text-sky-300/90">{t('calendar.heatmap.streaks.currentStreak')}</div>
              <div className="mt-2 text-sm text-sky-500">
                {streaks.currentStreak > 0 ? t('calendar.heatmap.streaks.consecutiveDays') : t('calendar.heatmap.streaks.noStreak')}
              </div>
            </div>
            
            <div className="rounded-lg border border-blue-500/45 bg-black/80 p-6 text-center">
              <Award className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
              <div className="mb-2 text-3xl font-bold text-sky-50">{streaks.longestStreak}</div>
              <div className="text-sky-300/90">{t('calendar.heatmap.streaks.longestStreak')}</div>
              <div className="mt-2 text-sm text-sky-500">{t('calendar.heatmap.streaks.longestStreakDesc')}</div>
            </div>
          </div>
        </div>
      )}

      {/* Panneau de détails / choix / saisie */}
      {((selectedDate && panelMode === 'details') || panelMode === 'choice' || panelMode === 'workout-entry' || panelMode === 'justification') && (() => {
        // Déterminer la date à afficher
        const displayDate = selectedDate?.date || panelDate;
        if (!displayDate) return null;
        
        const dateStr = getDateStr(displayDate);
        const formattedDate = formatLocaleDate(displayDate, { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        
        // MODE CHOIX : Afficher les options (Justifier OU Saisir)
        if (panelMode === 'choice') {
          return (
            <div className="rounded-xl border-2 border-blue-500/55 bg-black p-6">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-bold text-sky-50">{formattedDate}</h3>
                <button
                  onClick={() => {
                    setPanelMode('details');
                    setPanelDate(null);
                  }}
                  className="text-2xl leading-none text-sky-500 hover:text-sky-50"
                >
                  ×
                </button>
              </div>
              
              <div className="mb-6 text-center">
                <p className="mb-6 text-sm text-sky-300/90">
                  {t('calendar.workoutChoice.message', 'Que souhaitez-vous faire pour ce jour ?')}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setJustificationModalDate(displayDate);
                    setPanelMode('details');
                    setPanelDate(null);
                  }}
                  className="flex flex-col items-center justify-center gap-3 p-6 bg-red-900/30 border-2 border-red-500 rounded-lg hover:bg-red-900/50 hover:border-red-400 transition-colors"
                >
                  <span className="text-4xl">🔴</span>
                  <span className="text-white font-semibold">{t('calendar.workoutChoice.justify', 'Justifier l\'absence')}</span>
                </button>
                
                <button
                  onClick={() => setPanelMode('workout-entry')}
                  className="flex flex-col items-center justify-center gap-3 p-6 bg-emerald-900/30 border-2 border-emerald-500 rounded-lg hover:bg-emerald-900/50 hover:border-emerald-400 transition-colors"
                >
                  <span className="text-4xl">💪</span>
                  <span className="text-white font-semibold">{t('calendar.workoutChoice.enterWorkout', 'Saisir une séance')}</span>
                </button>
              </div>
            </div>
          );
        }
        
        // MODE WORKOUT-ENTRY : Formulaire de saisie inline
        if (panelMode === 'workout-entry') {
          const calendarDayName = getDayName(displayDate);
          const templateDayName = workoutEntryTemplateDay || calendarDayName;
          const programDayOptions = [
            'lundi',
            'mardi',
            'mercredi',
            'jeudi',
            'vendredi',
            'samedi',
            'dimanche'
          ];
          const allDataForEntry = getCurrentData();
          
          // Liste des programmes disponibles (calcul simple, pas de hook)
          const availablePrograms = (() => {
            const programList = [];
            if (isAdmin && isAuthenticated) {
              programList.push({ id: 'default', name: t('calendar.workoutEntry.program.default', 'Programme par défaut') });
            }
            if (programs && programs.length > 0) {
              programs.forEach(program => {
                programList.push({
                  id: program.id,
                  name: program.name || t('calendar.workoutEntry.program.unnamed', 'Programme sans nom'),
                  isActive: program.id === activeProgram?.id
                });
              });
            }
            return programList;
          })();
          
          // ✅ NOUVEAU : Obtenir toutes les variantes disponibles pour ce jour
          const availableVariants = (() => {
            if (!selectedProgramId) return [];
            
            const variants = [];
            
            if (selectedProgramId === 'default' && isAdmin && isAuthenticated) {
              const dayWorkout = workoutProgram[templateDayName];
              if (dayWorkout) {
                // Toujours ajouter la variante Maison (exercices de base)
                variants.push({
                  id: 'maison',
                  label: 'Maison',
                  name: dayWorkout.name || 'Maison',
                  exercices: dayWorkout.exercices || []
                });
                
                // Ajouter les variantes salle si disponibles
                if (dayWorkout.salleVariants) {
                  if (dayWorkout.salleVariants.semaineA) {
                    variants.push({
                      id: 'salle_semaineA',
                      label: 'Salle - Semaine A',
                      name: dayWorkout.salleVariants.semaineA.name || 'Salle - Semaine A',
                      exercices: dayWorkout.salleVariants.semaineA.exercices || []
                    });
                  }
                  if (dayWorkout.salleVariants.semaineB) {
                    variants.push({
                      id: 'salle_semaineB',
                      label: 'Salle - Semaine B',
                      name: dayWorkout.salleVariants.semaineB.name || 'Salle - Semaine B',
                      exercices: dayWorkout.salleVariants.semaineB.exercices || []
                    });
                  }
                }
              }
            } else if (selectedProgramId && programs) {
              const program = programs.find(p => p.id === selectedProgramId);
              if (program && program.schedule) {
                const daySchedule = program.schedule[templateDayName];
                if (daySchedule) {
                  // ✅ NOUVEAU : Fonction helper pour convertir les IDs string en IDs numériques
                  // (même logique que dans getIntensityForDate)
                  const convertExerciseId = (exId) => {
                    if (typeof exId === 'string') {
                      let hash = 0;
                      for (let i = 0; i < exId.length; i++) {
                        const char = exId.charCodeAt(i);
                        hash = ((hash << 5) - hash) + char;
                        hash = hash & hash;
                      }
                      return Math.abs(hash) + 10000;
                    }
                    return exId;
                  };
                  
                  // ✅ NOUVEAU : Convertir les IDs des exercices pour la variante maison
                  const maisonExercices = (daySchedule.exercises || daySchedule.exercices || []).map(ex => ({
                    ...ex,
                    id: convertExerciseId(ex.id)
                  }));
                  
                  // Variante maison (exercices de base)
                  variants.push({
                    id: 'maison',
                    label: 'Maison',
                    name: daySchedule.name || program.name || 'Maison',
                    exercices: maisonExercices
                  });
                  
                  // Variantes salle si disponibles
                  if (daySchedule.salleVariants) {
                    if (daySchedule.salleVariants.semaineA) {
                      const semaineAExercices = (daySchedule.salleVariants.semaineA.exercises || daySchedule.salleVariants.semaineA.exercices || []).map(ex => ({
                        ...ex,
                        id: convertExerciseId(ex.id)
                      }));
                      variants.push({
                        id: 'salle_semaineA',
                        label: 'Salle - Semaine A',
                        name: daySchedule.salleVariants.semaineA.name || 'Salle - Semaine A',
                        exercices: semaineAExercices
                      });
                    }
                    if (daySchedule.salleVariants.semaineB) {
                      const semaineBExercices = (daySchedule.salleVariants.semaineB.exercises || daySchedule.salleVariants.semaineB.exercices || []).map(ex => ({
                        ...ex,
                        id: convertExerciseId(ex.id)
                      }));
                      variants.push({
                        id: 'salle_semaineB',
                        label: 'Salle - Semaine B',
                        name: daySchedule.salleVariants.semaineB.name || 'Salle - Semaine B',
                        exercices: semaineBExercices
                      });
                    }
                  }
                }
              }
            }
            
            return variants;
          })();
          
          // ✅ NOUVEAU : Initialiser selectedVariant avec la première variante disponible
          // Utiliser selectedVariant directement, ou la première variante disponible si null
          const effectiveVariant = selectedVariant || (availableVariants.length > 0 ? availableVariants[0].id : null);
          
          // Charger le workout selon la variante sélectionnée
          const currentWorkout = (() => {
            if (!selectedProgramId || !effectiveVariant) return null;
            
            const variant = availableVariants.find(v => v.id === effectiveVariant);
            if (variant) {
              return {
                name: variant.name,
                exercices: variant.exercices || []
              };
            }
            
            return null;
          })();
          
          // Mettre à jour l'état workout si nécessaire (pour useEffect)
          if (currentWorkout && JSON.stringify(currentWorkout) !== JSON.stringify(workout)) {
            setWorkout(currentWorkout);
          }
          
          // Handlers
          const handleRepsChange = (exerciseId, value) => {
            setRepsData(prev => ({ ...prev, [exerciseId]: value }));
          };
          
          const handleToggleCheck = (exerciseId) => {
            setCheckedExercises(prev => ({ ...prev, [exerciseId]: !prev[exerciseId] }));
          };
          
          const handleInputFocus = (exerciseId, exercise) => {
            const currentValue = repsData[exerciseId] || '';
            if (!currentValue && exercise.series) {
              const autoReps = calculateAutoReps(exercise.series);
              if (autoReps) {
                handleRepsChange(exerciseId, autoReps.toString());
              }
            }
          };
          
          const handleSave = async () => {
            if (!currentWorkout) {
              showError(t('calendar.workoutEntry.errors.noWorkout', 'Aucun programme sélectionné'));
              return;
            }
            
            setIsSaving(true);
            
            try {
              // ✅ NOUVEAU : S'assurer que dateStr est défini (il devrait l'être depuis le scope parent)
              const saveDateStr = getDateStr(displayDate);
              
              // ✅ NOUVEAU : Déterminer le suffixe selon la variante sélectionnée
              const weekSuffix = effectiveVariant === 'salle_semaineA' ? '_semaineA' : 
                                 effectiveVariant === 'salle_semaineB' ? '_semaineB' : '';
              
              // 🔍 DEBUG : Logs pour diagnostiquer le problème (toujours actif pour janvier 2026)
              const isDebugDate = saveDateStr === '2026-01-17' || saveDateStr.startsWith('2026-01');
              if (isDebugDate) {
                console.log('[DEBUG handleSave] === DÉBUT SAUVEGARDE ===');
                console.log('[DEBUG handleSave] selectedProgramId:', selectedProgramId);
                console.log('[DEBUG handleSave] effectiveVariant:', effectiveVariant);
                console.log('[DEBUG handleSave] weekSuffix:', weekSuffix);
                console.log('[DEBUG handleSave] saveDateStr:', saveDateStr);
                console.log('[DEBUG handleSave] currentWorkout.exercices:', currentWorkout.exercices.map(ex => ({ id: ex.id, name: ex.name, idType: typeof ex.id })));
                console.log('[DEBUG handleSave] repsData keys:', Object.keys(repsData));
                console.log('[DEBUG handleSave] checkedExercises keys:', Object.keys(checkedExercises));
              }
              
              // Préparer les données à sauvegarder
              const updatedReps = { ...allDataForEntry.reps || {} };
              const updatedCheckedExercises = { ...allDataForEntry.checkedExercises || {} };
              
              // ✅ CORRECTION : Unifier la logique de sauvegarde en utilisant uniquement currentWorkout.exercices
              // Cela garantit que les IDs utilisés correspondent exactement à ceux du workout
              const savedKeys = [];
              currentWorkout.exercices.forEach(exercise => {
                const exerciseId = exercise.id; // ID converti si programme personnalisé
                const isChecked = checkedExercises[exerciseId] || false;
                const reps = repsData[exerciseId] || '';
                
                const baseKey = `${saveDateStr}_${exerciseId}`;
                const key = weekSuffix ? `${baseKey}${weekSuffix}` : baseKey;
                
                if (isDebugDate) {
                  console.log(`[DEBUG handleSave] Exercice: ${exercise.name} (id: ${exerciseId}, type: ${typeof exerciseId}), checked: ${isChecked}, reps: ${reps}, key: ${key}`);
                }
                
                if (isChecked) {
                  const parsedReps =
                    reps === '' || reps == null ? 0 : parseInt(String(reps), 10);
                  const safeReps =
                    Number.isFinite(parsedReps) && parsedReps >= 0 && parsedReps <= 999 ? parsedReps : 0;
                  updatedReps[key] = safeReps;
                  updatedCheckedExercises[key] = true;
                  savedKeys.push(key);
                  if (isDebugDate) {
                    console.log(`[DEBUG handleSave] ✅ Sauvegardé: ${key} = ${safeReps} reps (coché)`);
                  }
                } else {
                  // ✅ CORRECTION : Si l'exercice est décoché ou n'a pas de reps, supprimer UNIQUEMENT la variante actuelle
                  // Ne pas supprimer les autres variantes qui pourraient avoir des données valides
                  if (updatedReps[key] !== undefined || updatedCheckedExercises[key] !== undefined) {
                    delete updatedReps[key];
                    delete updatedCheckedExercises[key];
                    if (isDebugDate) {
                      console.log(`[DEBUG handleSave] 🗑️ Supprimé: ${key} (variante actuelle uniquement)`);
                    }
                  }
                }
              });
              
              if (isDebugDate) {
                console.log('[DEBUG handleSave] Clés sauvegardées:', savedKeys);
                console.log('[DEBUG handleSave] updatedReps (après traitement):', Object.keys(updatedReps).filter(k => k.startsWith(saveDateStr)));
                console.log('[DEBUG handleSave] updatedCheckedExercises (après traitement):', Object.keys(updatedCheckedExercises).filter(k => k.startsWith(saveDateStr)));
              }
              
              // Sauvegarder toutes les modifications en une seule fois
              await updateData({
                ...allDataForEntry,
                reps: updatedReps,
                checkedExercises: updatedCheckedExercises
              });
              
              // ✅ NOUVEAU : Invalider le cache d'intensité pour cette date pour forcer le recalcul
              // Invalider de manière agressive pour être sûr
              if (intensityCache.current[saveDateStr]) {
                delete intensityCache.current[saveDateStr];
              }
              // Invalider aussi les variantes possibles au cas où
              const cacheKeysToDelete = Object.keys(intensityCache.current).filter(k => k.startsWith(saveDateStr));
              cacheKeysToDelete.forEach(k => delete intensityCache.current[k]);
              
              if (isDebugDate) {
                console.log('[DEBUG handleSave] Cache invalidé pour:', saveDateStr, 'et variantes');
              }
              
              // Nettoyer les états du formulaire
              setWorkout(null);
              setRepsData({});
              setCheckedExercises({});
              setSelectedProgramId(null);
              setSelectedVariant(null);
              setWorkoutEntryTemplateDay(null);
              setShowCalendarExceptionalModal(false);
              
              // ✅ NOUVEAU : Déclencher un re-render pour que allData soit recalculé avec les nouvelles données
              setDataUpdateTrigger(prev => prev + 1);
              
              if (isDebugDate) {
                console.log('[DEBUG handleSave] dataUpdateTrigger incrémenté, allData sera recalculé');
              }
              
              // ✅ NOUVEAU : Attendre que le contexte soit mis à jour et que le re-render soit fait
              // On utilise plusieurs tentatives pour s'assurer que les données sont bien mises à jour
              const updateSelectedDate = (attempt = 0) => {
                // Récupérer les données fraîches depuis le contexte
                const freshData = getCurrentData();
                
                // ✅ CORRECTION : Vérifier que les données sauvegardées sont bien présentes dans freshData
                // Récupérer toutes les clés pour cette date dans freshData
                const freshDataRepsKeys = Object.keys(freshData.reps || {}).filter(k => k.startsWith(saveDateStr));
                const freshDataCheckedKeys = Object.keys(freshData.checkedExercises || {}).filter(k => k.startsWith(saveDateStr));
                const allKeysForDate = [...new Set([...freshDataRepsKeys, ...freshDataCheckedKeys])];
                
                // Vérifier si les clés sauvegardées sont présentes (ou si toutes les clés ont été supprimées)
                const savedKeysInFreshData = savedKeys.filter(key => {
                  return freshData.reps?.[key] !== undefined || freshData.checkedExercises?.[key] !== undefined;
                });
                
                // Si on a sauvegardé des clés, vérifier qu'elles sont présentes
                // Si on n'a pas sauvegardé de clés (tous exercices décochés), vérifier que les anciennes clés ont été supprimées
                const dataMatches = savedKeys.length > 0 
                  ? savedKeysInFreshData.length === savedKeys.length
                  : allKeysForDate.length === 0; // Si rien n'a été sauvegardé, vérifier que tout a été supprimé
                
                if (isDebugDate) {
                  console.log(`[DEBUG handleSave] Tentative ${attempt + 1}:`, {
                    savedKeys,
                    savedKeysInFreshData,
                    allKeysForDate,
                    freshDataRepsKeys,
                    freshDataCheckedKeys,
                    dataMatches
                  });
                }
                
                // Si les données correspondent (soit sauvegardées, soit supprimées), recalculer l'intensité
                if (dataMatches || attempt >= 4) {
                  // ✅ CORRECTION : Invalider le cache de manière agressive avant de recalculer
                  if (intensityCache.current[saveDateStr]) {
                    delete intensityCache.current[saveDateStr];
                  }
                  // Invalider aussi toutes les variantes possibles
                  const cacheKeysToDelete = Object.keys(intensityCache.current).filter(k => k.startsWith(saveDateStr));
                  cacheKeysToDelete.forEach(k => delete intensityCache.current[k]);
                  
                  if (isDebugDate) {
                    console.log(`[DEBUG handleSave] Cache invalidé avant recalcul (tentative ${attempt + 1})`);
                    console.log(`[DEBUG handleSave] Données fraîches avant recalcul:`, {
                      repsKeys: Object.keys(freshData.reps || {}).filter(k => k.startsWith(saveDateStr)),
                      checkedKeys: Object.keys(freshData.checkedExercises || {}).filter(k => k.startsWith(saveDateStr))
                    });
                  }
                  
                  // Recalculer l'intensité avec les données fraîches
                  const dayIntensity = getIntensityForDate(displayDate);
                  
                  if (isDebugDate) {
                    console.log(`[DEBUG handleSave] Intensité recalculée:`, {
                      completedCount: dayIntensity.completedCount,
                      reps: dayIntensity.reps,
                      level: dayIntensity.level
                    });
                  }
                  
                  // Créer un objet day similaire à celui utilisé dans generateMonthDays
                  const updatedDay = {
                    date: displayDate,
                    intensity: dayIntensity
                  };
                  
                  setSelectedDate(updatedDay);
                  setPanelMode('details');
                  setPanelDate(null);
                } else {
                  // Les données ne correspondent pas encore, réessayer après un délai
                  if (isDebugDate) {
                    console.log(`[DEBUG handleSave] Données pas encore synchronisées, nouvelle tentative dans 200ms...`);
                  }
                  setTimeout(() => updateSelectedDate(attempt + 1), 200);
                }
              };
              
              // Démarrer la mise à jour après un court délai pour laisser le temps au contexte de se mettre à jour
              setTimeout(() => updateSelectedDate(0), 200);
              
              showSuccess(t('calendar.workoutEntry.messages.saveSuccess', 'Séance enregistrée avec succès'));
            } catch (error) {
              console.error('[CalendarHeatmap] Erreur lors de la sauvegarde:', error);
              showError(t('calendar.workoutEntry.messages.saveError', 'Erreur lors de la sauvegarde'));
            } finally {
              setIsSaving(false);
            }
          };

          const calendarAdditionalExercises = Array.isArray(
            allDataForEntry?.dailyVariations?.[dateStr]?.additionalExercises
          )
            ? allDataForEntry.dailyVariations[dateStr].additionalExercises
            : [];

          const handleCalendarExceptionalComplete = async (exerciseId, actualReps, actualDuration) => {
            try {
              await markExceptionalExerciseComplete(exerciseId, actualReps, actualDuration, displayDate);
              showSuccess(t('today.messages.exceptionalExerciseCompleted'));
              setDataUpdateTrigger((p) => p + 1);
            } catch (error) {
              console.error('[CalendarHeatmap] Erreur complétion exercice exceptionnel:', error);
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

          const handleCalendarExceptionalRemove = async (exerciseId) => {
            const confirmed = window.confirm(
              t('today.confirmations.removeExceptionalExercise')
            );
            if (!confirmed) return;
            try {
              await removeExceptionalExercise(exerciseId, displayDate);
              showSuccess(t('today.messages.exceptionalExerciseRemoved'));
              setDataUpdateTrigger((p) => p + 1);
            } catch (error) {
              console.error('[CalendarHeatmap] Erreur suppression exercice exceptionnel:', error);
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
          
          return (
            <div className="overflow-hidden rounded-xl border-2 border-blue-500/55 bg-black">
              {/* En-tête fixe */}
              <div className="sticky top-0 z-10 border-b border-blue-500/50 bg-black/95 px-6 py-4 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-lg font-bold text-sky-50">
                      {t('calendar.workoutEntry.title', 'Saisie de séance - {{date}}', { date: formattedDate })}
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setPanelMode('details');
                      setPanelDate(null);
                      setWorkout(null);
                      setRepsData({});
                      setCheckedExercises({});
                      setSelectedProgramId(null);
                      setSelectedVariant(null);
                      setWorkoutEntryTemplateDay(null);
                      setShowCalendarExceptionalModal(false);
                    }}
                    className="ml-4 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded text-2xl leading-none text-sky-500 transition-colors hover:bg-slate-950 hover:text-sky-50"
                    aria-label="Fermer"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              {/* Contenu scrollable */}
              <div className="max-h-[calc(100vh-300px)] space-y-6 overflow-y-auto px-6 py-6">
                {/* Sélection du programme */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">
                    {t('calendar.workoutEntry.program.label', 'Programme')}
                  </label>
                  <select
                    value={selectedProgramId || ''}
                    onChange={(e) => {
                      setSelectedProgramId(e.target.value);
                      setSelectedVariant(null); // Réinitialiser la variante quand on change de programme
                    }}
                    disabled={isSaving}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50 transition-all"
                  >
                    <option value="">{t('calendar.workoutEntry.program.select', 'Sélectionner un programme')}</option>
                    {availablePrograms.map(program => (
                      <option key={program.id} value={program.id}>
                        {program.name} {program.isActive ? `(${t('calendar.workoutEntry.program.active', 'Actif')})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedProgramId && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300">
                      {t('calendar.workoutEntry.templateDay.label', 'Jour du programme (modèle)')}
                    </label>
                    <p className="text-xs text-sky-300/75 leading-relaxed">
                      {t(
                        'calendar.workoutEntry.templateDay.hint',
                        'Les exercices affichés viennent du jour choisi. Les coches et reps sont enregistrées pour la date du calendrier ({{calendarDay}}).',
                        { calendarDay: formattedDate }
                      )}
                    </p>
                    <select
                      value={templateDayName}
                      onChange={(e) => {
                        setWorkoutEntryTemplateDay(e.target.value);
                        setSelectedVariant(null);
                      }}
                      disabled={isSaving}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50 transition-all"
                    >
                      {programDayOptions.map((dKey) => (
                        <option key={dKey} value={dKey}>
                          {t(`calendar.workoutEntry.weekdays.${dKey}`, dKey)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                {/* ✅ NOUVEAU : Sélection de la variante (Maison / Salle Semaine A / Salle Semaine B) */}
                {selectedProgramId && availableVariants.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300">
                      {t('calendar.workoutEntry.variant.label', 'Variante')}
                    </label>
                    <select
                      value={effectiveVariant || ''}
                      onChange={(e) => setSelectedVariant(e.target.value)}
                      disabled={isSaving}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50 transition-all"
                    >
                      {availableVariants.map(variant => (
                        <option key={variant.id} value={variant.id}>
                          {variant.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                {/* Titre du workout */}
                {currentWorkout && currentWorkout.name && (
                  <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg px-4 py-3">
                    <h4 className="text-emerald-300 font-semibold text-base">
                      {currentWorkout.name}
                    </h4>
                  </div>
                )}
                
                {/* Liste des exercices */}
                {currentWorkout && currentWorkout.exercices && currentWorkout.exercices.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="text-white font-medium text-sm uppercase tracking-wide mb-4">
                      {t('calendar.workoutEntry.exercises.title', 'Exercices')}
                    </h4>
                    <div className="space-y-2">
                      {currentWorkout.exercices.map((exercise) => {
                        const exerciseId = exercise.id;
                        const currentReps = repsData[exerciseId] || '';
                        const isChecked = checkedExercises[exerciseId] || false;
                        
                        return (
                          <div 
                            key={exerciseId} 
                            className={`flex items-start gap-3 p-4 rounded-lg border transition-all ${
                              isChecked 
                                ? 'bg-emerald-900/20 border-emerald-500/50' 
                                : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                            }`}
                          >
                            {/* Checkbox */}
                            <button
                              type="button"
                              onClick={() => handleToggleCheck(exerciseId)}
                              disabled={isSaving}
                              className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all mt-0.5 ${
                                isChecked
                                  ? 'bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/50'
                                  : 'bg-slate-800 border-slate-600 hover:border-slate-500 hover:bg-slate-700'
                              } disabled:opacity-50`}
                              aria-label={isChecked ? 'Décocher' : 'Cocher'}
                            >
                              {isChecked && <Check size={12} className="text-white" />}
                            </button>
                            
                            {/* Informations de l'exercice */}
                            <div className="flex-1 min-w-0 space-y-1">
                              <h5 className={`font-medium text-sm ${
                                isChecked ? 'text-emerald-200' : 'text-white'
                              }`}>
                                {exercise.name}
                              </h5>
                              <div className="flex items-center gap-2 text-xs text-slate-400">
                                <span className="bg-slate-800/50 px-2 py-0.5 rounded">
                                  {exercise.series}
                                </span>
                                {exercise.materiel && (
                                  <span className="text-slate-500">
                                    • {exercise.materiel}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Input pour les reps */}
                            <div className="flex-shrink-0">
                              <Input
                                type="number"
                                placeholder="0"
                                value={currentReps}
                                onChange={(e) => handleRepsChange(exerciseId, e.target.value)}
                                onFocus={() => handleInputFocus(exerciseId, exercise)}
                                disabled={isSaving || !isChecked}
                                className={`w-20 text-center font-semibold ${
                                  isChecked 
                                    ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200 focus:ring-emerald-500' 
                                    : 'bg-slate-800/50 border-slate-600 text-slate-500 cursor-not-allowed'
                                }`}
                                min="0"
                                max="999"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : currentWorkout ? (
                  <div className="text-center py-12 text-slate-400">
                    <p className="text-sm">{t('calendar.workoutEntry.noExercises', 'Aucun exercice prévu pour ce jour')}</p>
                  </div>
                ) : selectedProgramId ? (
                  <div className="text-center py-12 text-slate-400">
                    <p className="text-sm">{t('calendar.workoutEntry.loading', 'Chargement...')}</p>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <p className="text-sm">{t('calendar.workoutEntry.selectProgram', 'Veuillez sélectionner un programme')}</p>
                  </div>
                )}

                {calendarAdditionalExercises.length > 0 && (
                  <div className="space-y-3 border-t border-amber-500/35 pt-4">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-amber-200">
                      <span>⭐</span>
                      {t('today.exercises.exceptionalTitle', 'Exercices Exceptionnels')}
                    </h4>
                    <div className="space-y-2">
                      {calendarAdditionalExercises.map((exercise) => {
                        const isCompleted = exercise.completed || false;
                        return (
                          <div
                            key={exercise.id}
                            className="flex items-center gap-3 rounded-lg border border-amber-500/35 bg-slate-900/50 p-4 ring-1 ring-slate-700/40"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2 font-medium text-white">
                                <span className="truncate">{exercise.name}</span>
                                <span className="shrink-0 rounded-full bg-amber-500/25 px-2 py-0.5 text-xs text-amber-100">
                                  {t('today.exercises.exceptional', 'Exceptionnel')}
                                </span>
                              </div>
                              <div className="mt-1 text-sm text-slate-400">
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
                                    {exercise.duration
                                      ? `${Math.floor(exercise.duration / 60)}min ${exercise.duration % 60}s`
                                      : t('today.exercises.duration')}
                                  </>
                                )}
                                {exercise.materiel && ` • ${exercise.materiel}`}
                                {exercise.notes && ` • ${exercise.notes}`}
                              </div>
                              {exercise.completed && (
                                <div className="mt-1 text-xs text-emerald-300">
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
                            <div className="flex shrink-0 items-center gap-2">
                              <Checkbox
                                checked={isCompleted}
                                onChange={() => {
                                  if (!isCompleted) {
                                    if (exercise.type === 'reps') {
                                      handleCalendarExceptionalComplete(
                                        exercise.id,
                                        exercise.repsPerSeries
                                      );
                                    } else {
                                      handleCalendarExceptionalComplete(
                                        exercise.id,
                                        null,
                                        exercise.duration
                                      );
                                    }
                                  }
                                }}
                                className="text-amber-400"
                                name={`cal_exceptional_${exercise.id}`}
                                disabled={isSaving}
                              />
                              <button
                                type="button"
                                onClick={() => handleCalendarExceptionalRemove(exercise.id)}
                                className="rounded-lg border border-slate-600 bg-slate-800/80 p-2 text-slate-200 transition-colors hover:border-rose-500/50 hover:bg-rose-950/30 hover:text-rose-100"
                                title={t('today.exercises.removeExceptionalTitle')}
                                disabled={isSaving}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="border-t border-slate-700 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowCalendarExceptionalModal(true)}
                    disabled={isSaving}
                    className="w-full border border-amber-500/40 text-amber-100 hover:bg-amber-950/25"
                    icon={Plus}
                  >
                    {t('today.exercises.addExceptional')}
                  </Button>
                </div>

                <AddExceptionalExerciseModal
                  isOpen={showCalendarExceptionalModal}
                  onClose={() => setShowCalendarExceptionalModal(false)}
                  targetDate={displayDate}
                />
              </div>
              
              {/* Footer fixe avec les boutons */}
              <div className="sticky bottom-0 bg-slate-800/95 backdrop-blur-sm border-t border-slate-700 px-6 py-4 z-10">
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => {
                      setPanelMode('details');
                      setPanelDate(null);
                      setWorkout(null);
                      setRepsData({});
                      setCheckedExercises({});
                      setSelectedProgramId(null);
                      setSelectedVariant(null);
                      setWorkoutEntryTemplateDay(null);
                      setShowCalendarExceptionalModal(false);
                    }}
                    disabled={isSaving}
                    className="flex-1"
                  >
                    {t('common.cancel', 'Annuler')}
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleSave}
                    disabled={isSaving || !currentWorkout}
                    icon={Save}
                    className="flex-1"
                    loading={isSaving}
                  >
                    {t('common.save', 'Sauvegarder')}
                  </Button>
                </div>
              </div>
            </div>
          );
        }

        if (variant === 'apprentissage' && selectedDate && panelMode === 'details') {
          const bd = selectedDate.intensity?.bookData;
          const entries = bd?.entries || [];
          return (
            <div className={`${heatmapModuleShell(variant, isSidebarEmbed, 'wide')} space-y-4`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-emerald-50">
                  {formatLocaleDate(selectedDate.date, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  className="text-emerald-300/80 hover:text-emerald-100 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-black border-2 border-emerald-500/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-emerald-100">{bd?.sessions ?? 0}</div>
                  <div className="text-xs text-emerald-300/70">Sessions</div>
                </div>
                <div className="bg-black border-2 border-emerald-500/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-emerald-100">{bd?.minutes ?? 0} min</div>
                  <div className="text-xs text-emerald-300/70">Temps total</div>
                </div>
                <div className="bg-black border-2 border-emerald-500/50 rounded-lg p-3 text-center md:col-span-2">
                  <div className="text-2xl font-bold text-emerald-100">{bd?.uniqueBooks ?? 0}</div>
                  <div className="text-xs text-emerald-300/70">Matières / sujets touchés</div>
                </div>
              </div>
              {entries.length > 0 ? (
                <div>
                  <h4 className="text-emerald-200 font-medium mb-2">Sessions enregistrées</h4>
                  <ul className="space-y-2">
                    {entries.map((row, idx) => (
                      <li
                        key={`${row.sessionId || idx}`}
                        className="flex justify-between gap-2 bg-black border border-emerald-500/45 rounded-lg px-3 py-2 text-sm"
                      >
                        <span className="text-emerald-50 font-medium truncate">{row.bookTitle}</span>
                        <span className="text-emerald-200/80 shrink-0">
                          {row.durationMinutes || 0} min
                          {row.startTime ? ` · ${row.startTime}` : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-emerald-200/65 text-sm">Aucune session d&apos;étude ce jour.</p>
              )}
            </div>
          );
        }

        if (variant === 'quests' && selectedDate && panelMode === 'details') {
          const qd = selectedDate.intensity?.questData;
          return (
            <div className={`${heatmapModuleShell(variant, isSidebarEmbed, 'wide')} space-y-4`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-white">
                  {formatLocaleDate(selectedDate.date, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  className="text-slate-400 hover:text-white text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-black/90 border border-amber-500/35 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-amber-50">{qd?.completedUnique ?? 0}</div>
                  <div className="text-xs text-amber-200/55">Quêtes cochées (uniques)</div>
                </div>
                <div className="bg-black/90 border border-amber-500/35 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-amber-50">{qd?.scheduledTotal ?? 0}</div>
                  <div className="text-xs text-amber-200/55">Prévues ce jour</div>
                </div>
                <div className="bg-black/90 border border-amber-500/35 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-amber-50">{qd?.minutesOccupied ?? 0} min</div>
                  <div className="text-xs text-amber-200/55">Temps occupé (durées param.)</div>
                </div>
                <div className="bg-black/90 border border-amber-500/35 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-amber-300">{qd?.xpTotal ?? 0}</div>
                  <div className="text-xs text-amber-200/55">XP ce jour</div>
                </div>
              </div>
              {qd?.completedRows?.length > 0 && (
                <div>
                  <h4 className="text-white font-medium mb-2">Validations</h4>
                  <ul className="space-y-2">
                    {qd.completedRows.map((row, idx) => (
                      <li
                        key={`${row.queteId}-${idx}`}
                        className="flex justify-between gap-2 bg-black/80 border border-amber-600/30 rounded-lg px-3 py-2 text-sm"
                      >
                        <span className="text-white font-medium truncate">{row.nom}</span>
                        <span className="text-slate-300 shrink-0">
                          {row.dureeMinutes} min · {row.xp} XP
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {qd?.scheduledNotDone?.length > 0 && (
                <div>
                  <h4 className="text-slate-300 font-medium mb-2 text-sm">Prévues mais non cochées</h4>
                  <ul className="space-y-1">
                    {qd.scheduledNotDone.map((row) => (
                      <li
                        key={row.queteId}
                        className="text-slate-400 text-xs flex justify-between gap-2"
                      >
                        <span className="truncate">{row.nom}</span>
                        <span className="shrink-0">{row.dureeMinutes} min</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {!qd?.completedRows?.length && !qd?.scheduledNotDone?.length && (
                <p className="text-slate-400 text-sm">Aucune quête prévue ni cochée ce jour.</p>
              )}
            </div>
          );
        }

        if (variant === 'books' && selectedDate && panelMode === 'details') {
          const bd = selectedDate.intensity?.bookData;
          const ds = getDateStr(selectedDate.date);
          const booksList = booksCalendarContext?.books || [];
          const covers = booksCalendarContext?.coverUrls || {};
          const df = booksCalendarContext?.dayFeedbacks?.[ds];
          return (
            <div className={heatmapModuleShell(variant, isSidebarEmbed, 'wide')}>
              <BooksCalendarDayDetailPanel
                dateStr={ds}
                heading={formatLocaleDate(selectedDate.date, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
                onClose={() => setSelectedDate(null)}
                bd={bd}
                books={booksList}
                coverUrls={covers}
                dayFeedback={df}
                onSaveDayFeedback={booksCalendarContext?.setDayFeedback}
                onUpdateBookSession={booksCalendarContext?.onUpdateBookSession}
              />
            </div>
          );
        }
        
        // MODE DETAILS : Afficher les détails du jour (code existant)
        if (selectedDate && panelMode === 'details') {
          const selectedDateStr = getDateStr(selectedDate.date);
          const enduranceDay = collectEnduranceSessionsForCalendarDay(allData, selectedDateStr);
          const garminByEnduranceId = new Map();
          (garminData?.activities?.cardio || []).forEach((act) => {
            const k = act?.garminId ?? act?.id;
            if (k != null && String(k) !== '') garminByEnduranceId.set(String(k), act);
          });
          const dailyMetrics = garminData?.dailyMetrics?.[selectedDateStr];
          const manualSel = normalizeManualDailyWalkByDate(allData?.enduranceData?.manualDailyWalkByDate)[
            selectedDateStr
          ];
          const mergedDetailSteps = mergedDailySteps(
            dailyMetrics?.steps != null && Number.isFinite(Number(dailyMetrics.steps))
              ? Math.round(Number(dailyMetrics.steps))
              : 0,
            manualSel?.steps ?? 0
          );
          const swimming = (garminData?.activities?.swimming || []).filter(a => a.date === selectedDateStr);
          const jumpRope = (garminData?.activities?.jumpRope || []).filter(a => a.date === selectedDateStr);
          const cardio = (garminData?.activities?.cardio || []).filter(a => a.date === selectedDateStr);
          // ✅ NOUVEAU : Récupérer la justification pour ce jour
          const justification = selectedDate.intensity?.justification || getDayJustification(allData, selectedDateStr);
          
          // Calculer les ajustements Garmin pour cette date
          let garminAdjustments = null;
          if (garminData && selectedDate.intensity.level > 0) {
            const workoutIntensity = {
              level: selectedDate.intensity.level,
              duration: selectedDate.intensity.duration,
              reps: selectedDate.intensity.reps
            };
            const adjusted = calculateDayIntensityWithGarmin(selectedDateStr, workoutIntensity, garminData);
            if (adjusted.multiplier !== 1.0) {
              garminAdjustments = adjusted;
            }
          }

          const vcDetail = selectedDate.intensity?.visualContext;
          const colorMixRows = [
            ['level', 'calendar.heatmap.colorMix.barLevel', 'bg-cyan-500'],
            ['kcal', 'calendar.heatmap.colorMix.barKcal', 'bg-amber-500'],
            ['steps', 'calendar.heatmap.colorMix.barSteps', 'bg-emerald-500'],
            ['intensityMin', 'calendar.heatmap.colorMix.barIntMin', 'bg-violet-500'],
            ['load', 'calendar.heatmap.colorMix.barLoad', 'bg-rose-500'],
            ['repsHint', 'calendar.heatmap.colorMix.barReps', 'bg-slate-400']
          ];
          const dayFeedback = allData?.sessionFeedbacks?.[selectedDateStr];
          const intenD = selectedDate.intensity;
          const caAbs = vcDetail?.contribAbsolute || {};
          const kcalRefD = intenD.kcalRefMedian || 0;
          const stepsRefD = intenD.stepsRefMedian || 0;
          const activeKD = intenD.activeKcal || 0;
          const stepsVD = intenD.steps ?? 0;
          const intMinD = intenD.intensityMinutesTotal ?? 0;
          const pctKcalVsRef =
            kcalRefD > 45
              ? Math.round(((activeKD - kcalRefD) / Math.max(1, kcalRefD)) * 100)
              : null;
          const pctStepsVsRef =
            stepsRefD > 600
              ? Math.round(((stepsVD - stepsRefD * 0.72) / Math.max(1, stepsRefD * 0.35)) * 100)
              : null;
          const fmtU = (n) => (Number.isFinite(n) ? (Math.round(n * 1000) / 1000).toString() : '—');
          const mixValueLine = (key) => {
            switch (key) {
              case 'level':
                return `${intenD.level} / 4 · ${t('calendar.heatmap.colorMix.contribUnits', 'unités')} ${fmtU(
                  caAbs.level
                )}`;
              case 'kcal':
                return `${Math.round(activeKD)} kcal${
                  kcalRefD ? ` · ${t('calendar.heatmap.colorMix.baselineKcal', { ref: Math.round(kcalRefD) })}` : ''
                }${pctKcalVsRef != null ? ` (${pctKcalVsRef >= 0 ? '+' : ''}${pctKcalVsRef}%)` : ''} · ${fmtU(
                  caAbs.kcal
                )}`;
              case 'steps':
                return `${stepsVD} pas${
                  stepsRefD
                    ? ` · ${t('calendar.heatmap.colorMix.baselineSteps', { ref: Math.round(stepsRefD) })}`
                    : ''
                }${pctStepsVsRef != null ? ` (${pctStepsVsRef >= 0 ? '+' : ''}${pctStepsVsRef}%)` : ''} · ${fmtU(
                  caAbs.steps
                )}`;
              case 'intensityMin': {
                const baseLine = `${intMinD} min · ${fmtU(caAbs.intensityMin)}`;
                if (
                  intenD.intensityMinutesModerate != null &&
                  intenD.intensityMinutesVigorous != null &&
                  vcDetail?.intensityMinutesEffective != null
                ) {
                  return `${baseLine} · ${t('calendar.heatmap.colorMix.intensitySplit', {
                    mod: intenD.intensityMinutesModerate,
                    vig: intenD.intensityMinutesVigorous,
                    effective: fmtU(vcDetail.intensityMinutesEffective)
                  })}`;
                }
                return baseLine;
              }
              case 'load':
                return `${t('calendar.heatmap.dayDetails.street')} ${fmtU(
                  vcDetail.strengthLoad || 0
                )} + ${t('calendar.heatmap.dayDetails.enduranceShort')} ${fmtU(
                  vcDetail.enduranceLoad || 0
                )} · ${fmtU(caAbs.load)}`;
              case 'repsHint':
                return `${intenD.reps ?? 0} reps · ${fmtU(caAbs.repsHint)}`;
              default:
                return '';
            }
          };
          const cardioKindsD = garminData
            ? getGarminCardioMinutesByKindForDate(garminData, selectedDateStr)
            : { walk: 0, run: 0, other: 0, total: 0 };
          
          return (
            <div className="space-y-6 rounded-xl border-2 border-blue-500/55 bg-black p-6">
            {/* En-tête */}
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-sky-50">
                {formatLocaleDate(selectedDate.date, { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-2xl leading-none text-sky-500 hover:text-sky-50"
              >
                ×
              </button>
            </div>
            
            {/* ✅ NOUVEAU : Bandeau de justification si le jour est justifié */}
            {justification && (
              <div className={`mb-4 flex items-start gap-3 rounded-lg border-2 p-4 ${JUSTIFICATION_COLORS[justification.reason] || JUSTIFICATION_COLORS[JUSTIFICATION_REASONS.AUTRE]} ${JUSTIFICATION_TEXT[justification.reason] || JUSTIFICATION_TEXT[JUSTIFICATION_REASONS.AUTRE]}`}>
                <span className="text-2xl" aria-hidden="true">{JUSTIFICATION_ICONS[justification.reason] || '❓'}</span>
                <div className="flex-1">
                  <div className="mb-1 font-semibold">
                    {t(`justification.${justification.reason}`) || t('justification.autre')}
                  </div>
                  {justification.note && (
                    <div className="text-sm opacity-90">
                      {justification.note}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedDate(null);
                    setJustificationModalDate(selectedDate.date);
                  }}
                  className="text-sm underline opacity-80 hover:opacity-100"
                  title={t('calendar.heatmap.dayDetails.modifyJustification')}
                >
                  {t('calendar.heatmap.dayDetails.modify')}
                </button>
              </div>
            )}
            
            {/* Statistiques principales - Masquer si jour justifié (sauf repos) */}
            {(!justification || justification.reason === JUSTIFICATION_REASONS.REPOS) && (
              <div>
                <h4 className="mb-3 flex items-center font-medium text-sky-100">
                  <Activity className="mr-2" size={16} />
                  {t('calendar.heatmap.dayDetails.workoutStats')}
                </h4>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="rounded-lg border border-blue-500/40 bg-black p-4 text-center">
                    <div className="text-2xl font-bold text-sky-50">{selectedDate.intensity.reps}</div>
                    <div className="text-sm text-sky-500">{t('calendar.heatmap.dayDetails.totalReps')}</div>
                  </div>
                  <div className="rounded-lg border border-sky-600/35 bg-black p-4 text-center">
                    <div className="text-2xl font-bold text-sky-50">{selectedDate.intensity.completedCount}</div>
                    <div className="text-sm text-sky-500">{t('calendar.heatmap.dayDetails.classicExercises')}</div>
                  </div>
                  <div className="rounded-lg border border-blue-500/40 bg-black p-4 text-center">
                    <div className="text-2xl font-bold text-sky-50">{selectedDate.intensity.duration}min</div>
                    <div className="text-sm text-sky-500">{t('calendar.heatmap.dayDetails.totalDuration')}</div>
                  </div>
                  <div className="rounded-lg border border-sky-600/35 bg-black p-4 text-center">
                    <div className="text-2xl font-bold text-sky-50">{getIntensityLabel(selectedDate.intensity.level)}</div>
                    <div className="text-sm text-sky-500">{t('calendar.heatmap.dayDetails.globalIntensity')}</div>
                    {garminAdjustments && (
                      <div className="mt-1 text-xs text-green-400">
                        {garminAdjustments.multiplier > 1 ? '⬆' : '⬇'} {t('calendar.heatmap.dayDetails.garminAdjusted')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {(!justification || justification.reason === JUSTIFICATION_REASONS.REPOS) && vcDetail && (
              <div className="space-y-3 rounded-lg border-2 border-blue-500/45 bg-black p-4">
                <h4 className="flex items-center gap-2 font-medium text-sky-100">
                  <BarChart3 size={18} />
                  {t('calendar.heatmap.colorMix.title')}
                </h4>
                <p className="text-xs text-sky-500">{t('calendar.heatmap.colorMix.subtitle')}</p>
                <p className="rounded-md border border-blue-500/35 bg-black/80 px-2 py-1.5 text-[11px] leading-snug text-sky-300/90">
                  {t(
                    'calendar.heatmap.colorMix.scaleExplainer',
                    'Couleur des cases : du vert clair (jour le plus calme sur la période affichée) au rouge foncé (jour le plus chargé). Les pourcentages = part du mélange ; à droite = tes valeurs réelles et unités internes.'
                  )}
                </p>
                <div className="text-sm font-semibold text-sky-50">
                  {t('calendar.heatmap.colorMix.score', { score: vcDetail.visualScore100 })}
                </div>
                {vcDetail.synergyStreetEndurance > 1.001 && (
                  <p className="text-xs text-emerald-200/95">
                    {t('calendar.heatmap.colorMix.synergyLine', {
                      mult: Math.round(vcDetail.synergyStreetEndurance * 1000) / 1000
                    })}
                  </p>
                )}
                {garminData && (cardioKindsD.total > 0 || cardioKindsD.walk > 0) && (
                  <p className="text-xs text-sky-200/90">
                    {t('calendar.heatmap.colorMix.cardioSplit', {
                      walk: Math.round(cardioKindsD.walk),
                      run: Math.round(cardioKindsD.run),
                      other: Math.round(cardioKindsD.other)
                    })}
                  </p>
                )}
                <div className="space-y-3">
                  {colorMixRows.map(([key, labelKey, colorClass]) => {
                    const pct = Math.round(((vcDetail.breakdownShares || {})[key] || 0) * 100);
                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex flex-wrap items-start justify-between gap-2 text-xs text-sky-500">
                          <span className="min-w-0 flex-1">{t(labelKey)}</span>
                          <span className="shrink-0 font-medium tabular-nums text-sky-100">{pct}%</span>
                        </div>
                        <div className="text-right text-[11px] leading-snug text-sky-300/90">
                          {mixValueLine(key)}
                        </div>
                        <div className="h-2 overflow-hidden rounded-full border border-blue-500/25 bg-black">
                          <div
                            className={`h-full rounded-full ${colorClass}`}
                            style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {(vcDetail.walkHeavy || vcDetail.walkOnlyDay) && (
                  <p className="text-xs text-amber-200/90">{t('calendar.heatmap.colorMix.walkNote')}</p>
                )}
                <div className="border-t border-blue-500/30 pt-3 text-xs text-sky-300/90">
                  {dayFeedback?.difficulte != null && Number(dayFeedback.difficulte) >= 1 ? (
                    <div>
                      <div className="text-sky-500">
                        {t('calendar.heatmap.colorMix.feedback', { n: dayFeedback.difficulte })}
                      </div>
                      {dayFeedback.note ? (
                        <div className="mt-1 text-sky-100">
                          <span className="text-sky-500">{t('calendar.heatmap.colorMix.feedbackNote')} </span>
                          {dayFeedback.note}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="text-sky-600">{t('calendar.heatmap.colorMix.feedbackNone')}</div>
                  )}
                </div>
                <div className="rounded-md border border-blue-500/35 bg-black/80 p-3 text-xs text-sky-300/90">
                  <div className="mb-1 font-medium text-sky-100">{t('calendar.heatmap.equiv.title')}</div>
                  <p className="mt-1 text-sky-500">{t('calendar.heatmap.equiv.intro')}</p>
                  <ul className="mt-2 list-disc space-y-1.5 pl-4 marker:text-sky-500">
                    <li>{t('calendar.heatmap.equiv.b1', { kcal: CALENDAR_VISUAL_CONSTANTS.KCAL_PER_VISUAL_UNIT })}</li>
                    <li>{t('calendar.heatmap.equiv.b2', { steps: CALENDAR_VISUAL_CONSTANTS.STEPS_PER_VISUAL_UNIT })}</li>
                    <li>{t('calendar.heatmap.equiv.b3')}</li>
                    <li>{t('calendar.heatmap.equiv.b4')}</li>
                    <li>{t('calendar.heatmap.equiv.b5')}</li>
                  </ul>
                  {(vcDetail.approxRepEquivFromKcal > 0 || vcDetail.approxRepEquivFromSteps > 0) && (
                    <p className="mt-2 text-sky-500">
                      {t('calendar.heatmap.equiv.todayApprox', {
                        kcalU: vcDetail.approxRepEquivFromKcal,
                        stepU: vcDetail.approxRepEquivFromSteps
                      })}
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {/* ✅ NOUVEAU : Message si jour justifié (pas d'entraînement) - Sauf repos */}
            {justification && justification.reason !== JUSTIFICATION_REASONS.REPOS && (
              <div className="rounded-lg border border-blue-500/40 bg-black p-4 text-center">
                <div className="text-sm text-sky-500">
                  {t('calendar.heatmap.dayDetails.noWorkoutJustified')}
                </div>
              </div>
            )}

            {/* Ajustements Garmin appliqués - Masquer si jour justifié (sauf repos) */}
            {(!justification || justification.reason === JUSTIFICATION_REASONS.REPOS) && garminAdjustments && (
              <div className="bg-slate-800/40 border border-amber-500/25 rounded-lg p-4">
                <h4 className="text-amber-300 font-medium mb-2 flex items-center">
                  <Target className="mr-2" size={16} />
                  {t('calendar.heatmap.dayDetails.garminAdjustments')}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {garminAdjustments.adjustments.timeReal && (
                    <div className="bg-slate-800/50 rounded p-2">
                      <div className="text-slate-300">⏱️ {t('calendar.heatmap.dayDetails.realTime')}</div>
                      <div className="text-white">
                        {garminAdjustments.adjustments.timeReal.réel.toFixed(0)}min ({t('calendar.heatmap.dayDetails.planned')}: {garminAdjustments.adjustments.timeReal.prévu}min)
                      </div>
                    </div>
                  )}
                  {garminAdjustments.adjustments.swimmingRecord && garminAdjustments.adjustments.swimmingRecord.distance > garminAdjustments.adjustments.swimmingRecord.record && (
                    <div className="bg-slate-800/50 rounded p-2">
                      <div className="text-slate-300">🏊 {t('calendar.heatmap.dayDetails.swimmingRecord')}</div>
                      <div className="text-white">
                        {garminAdjustments.adjustments.swimmingRecord.distance}m ({t('calendar.heatmap.dayDetails.record')}: {garminAdjustments.adjustments.swimmingRecord.record}m)
                      </div>
                    </div>
                  )}
                  {garminAdjustments.adjustments.jumpRopeRecord && garminAdjustments.adjustments.jumpRopeRecord.sauts > garminAdjustments.adjustments.jumpRopeRecord.record && (
                    <div className="bg-slate-800/50 rounded p-2">
                      <div className="text-slate-300">🪢 {t('calendar.heatmap.dayDetails.jumpRopeRecord')}</div>
                      <div className="text-white">
                        {garminAdjustments.adjustments.jumpRopeRecord.sauts} {t('calendar.heatmap.dayDetails.jumps')} ({t('calendar.heatmap.dayDetails.record')}: {garminAdjustments.adjustments.jumpRopeRecord.record})
                      </div>
                    </div>
                  )}
                  {garminAdjustments.adjustments.caloriesActive && (
                    <div className="bg-slate-800/50 rounded p-2">
                      <div className="text-slate-300">🔥 {t('calendar.heatmap.dayDetails.activeCalories')}</div>
                      <div className="text-white">
                        {Math.round(garminAdjustments.adjustments.caloriesActive.calories)} ({t('calendar.heatmap.dayDetails.average')}: {Math.round(garminAdjustments.adjustments.caloriesActive.moyenne)})
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Activités Garmin - Masquer si jour justifié (sauf repos) */}
            {(!justification || justification.reason === JUSTIFICATION_REASONS.REPOS) && (swimming.length > 0 || jumpRope.length > 0 || cardio.length > 0 || dailyMetrics) && (
              <div>
                <h4 className="text-white font-medium mb-3 flex items-center">
                  <Zap className="mr-2 text-amber-400" size={16} />
                  {t('calendar.heatmap.dayDetails.garminData')}
                </h4>
                <div className="space-y-4">
                  {/* Natation */}
                  {swimming.length > 0 && (
                    <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-4">
                      <div className="text-cyan-400 font-medium mb-2">🏊 {t('calendar.heatmap.dayDetails.swimming')} ({swimming.length} {swimming.length > 1 ? t('calendar.heatmap.dayDetails.sessions') : t('calendar.heatmap.dayDetails.session')})</div>
                      {swimming.map((act, idx) => (
                        <div key={idx} className="bg-slate-800/50 rounded p-2 mt-2 text-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-slate-400">{t('calendar.heatmap.dayDetails.distance')}:</span>
                              <span className="text-white ml-2">{act.distance || act.totalDistance || 0}m</span>
                            </div>
                            <div>
                              <span className="text-slate-400">Durée:</span>
                              <span className="text-white ml-2">
                                {parseDurationToMinutes(act.duration || act.totalTime || 0, `GarminActivities.Swimming[${idx}]`)}min
                              </span>
                            </div>
                            {act.avgHR && (
                              <div>
                                <span className="text-slate-400">{t('calendar.heatmap.dayDetails.avgHR')}:</span>
                                <span className="text-white ml-2">{act.avgHR} bpm</span>
                              </div>
                            )}
                            {act.calories?.active && (
                              <div>
                                <span className="text-slate-400">Calories:</span>
                                <span className="text-white ml-2">{act.calories.active}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Corde à sauter */}
                  {jumpRope.length > 0 && (
                    <div className="bg-amber-950/30 border border-amber-600/25 rounded-lg p-4">
                      <div className="text-amber-300 font-medium mb-2">🪢 {t('calendar.heatmap.dayDetails.jumpRope')} ({jumpRope.length} {jumpRope.length > 1 ? t('calendar.heatmap.dayDetails.sessions') : t('calendar.heatmap.dayDetails.session')})</div>
                      {jumpRope.map((act, idx) => (
                        <div key={idx} className="bg-slate-800/50 rounded p-2 mt-2 text-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-slate-400">{t('calendar.heatmap.dayDetails.jumps')}:</span>
                              <span className="text-white ml-2">{act.jumps || 0}</span>
                            </div>
                            <div>
                              <span className="text-slate-400">Durée:</span>
                              <span className="text-white ml-2">
                                {parseDurationToMinutes(act.duration || act.totalTime || 0, `GarminActivities.JumpRope[${idx}]`)}min
                              </span>
                            </div>
                            {act.speed && (
                              <div>
                                <span className="text-slate-400">{t('calendar.heatmap.dayDetails.speed')}:</span>
                                <span className="text-white ml-2">{act.speed.toFixed(1)} {t('calendar.heatmap.dayDetails.jumps')}/min</span>
                              </div>
                            )}
                            {act.maxContinuous && (
                              <div>
                                <span className="text-slate-400">{t('calendar.heatmap.dayDetails.maxContinuous')}:</span>
                                <span className="text-white ml-2">{act.maxContinuous}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Cardio */}
                  {cardio.length > 0 && (
                    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                      <div className="text-red-400 font-medium mb-2">
                        {t('calendar.heatmap.dayDetails.cardioActivities')} ({cardio.length}{' '}
                        {cardio.length > 1 ? t('calendar.heatmap.dayDetails.sessions') : t('calendar.heatmap.dayDetails.session')})
                      </div>
                      {cardio.map((act, idx) => (
                        <div key={idx} className="bg-slate-800/50 rounded p-2 mt-2 text-sm">
                          <div className="text-white font-semibold text-base mb-2">
                            {garminCardioKindEmoji(act)} {garminCardioPrimaryLabel(act, t)}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-slate-400">Durée:</span>
                              <span className="text-white ml-2">
                                {parseDurationToMinutes(act.duration || act.totalTime || 0, `GarminActivities.Cardio[${idx}]`)}min
                              </span>
                            </div>
                            {act.distance != null && Number(act.distance) > 0 && (
                              <div>
                                <span className="text-slate-400">{t('calendar.heatmap.dayDetails.distance')}</span>
                                <span className="text-white ml-2">{Number(act.distance).toFixed(2)} km</span>
                              </div>
                            )}
                            {act.calories?.active && (
                              <div>
                                <span className="text-slate-400">Calories:</span>
                                <span className="text-white ml-2">{act.calories.active}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Métriques quotidiennes (Garmin + saisie manuelle pas du jour) */}
                  {(dailyMetrics || manualSel || mergedDetailSteps > 0) && (
                    <div className="rounded-lg border border-sky-600/40 bg-black p-4">
                      <div className="mb-2 font-medium text-[#7ecbb0]">📊 {t('calendar.heatmap.dayDetails.dailyMetrics')}</div>
                      {manualSel?.steps > 0 ? (
                        <p className="mb-2 text-xs text-sky-200/90">
                          {t('calendar.heatmap.dayDetails.manualStepsNote')}
                        </p>
                      ) : null}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        {mergedDetailSteps > 0 && (
                          <div className="bg-slate-800/50 rounded p-2">
                            <div className="text-slate-400">{t('calendar.heatmap.dayDetails.steps')}</div>
                            <div className="text-white font-semibold">{mergedDetailSteps.toLocaleString()}</div>
                          </div>
                        )}
                        {(dailyMetrics?.distance ?? 0) > 0 && (
                          <div className="bg-slate-800/50 rounded p-2">
                            <div className="text-slate-400">{t('calendar.heatmap.dayDetails.distance')}</div>
                            <div className="text-white font-semibold">{dailyMetrics.distance.toFixed(1)} km</div>
                          </div>
                        )}
                        {(dailyMetrics?.calories?.active ?? 0) > 0 && (
                          <div className="bg-slate-800/50 rounded p-2">
                            <div className="text-slate-400">{t('calendar.heatmap.dayDetails.activeCalories')}</div>
                            <div className="text-white font-semibold">{Math.round(dailyMetrics.calories.active)}</div>
                          </div>
                        )}
                        {(dailyMetrics?.heartRate?.resting ?? 0) > 0 && (
                          <div className="bg-slate-800/50 rounded p-2">
                            <div className="text-slate-400">{t('calendar.heatmap.dayDetails.restingHR')}</div>
                            <div className="text-white font-semibold">{dailyMetrics.heartRate.resting} bpm</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(!justification || justification.reason === JUSTIFICATION_REASONS.REPOS) &&
              enduranceDay.rows.length > 0 && (
              <div className="rounded-xl border border-emerald-600/40 bg-black/90 p-4">
                <h4 className="mb-3 flex items-center font-medium text-emerald-100">
                  <Activity className="mr-2" size={16} />
                  {t('calendar.heatmap.dayDetails.enduranceSessionsDetailTitle')}
                </h4>
                <div className="space-y-3">
                  {enduranceDay.rows.map(({ activityType, session }, idx) => {
                    const gAct =
                      session?.garminId != null || session?.id != null
                        ? garminByEnduranceId.get(String(session.garminId ?? session.id))
                        : null;
                    const notesLine =
                      session.notes && String(session.notes).trim() ? (
                        <div className="mt-2 text-xs text-slate-500">
                          <span className="font-medium text-slate-400">
                            {t('calendar.heatmap.dayDetails.enduranceNotes')}
                          </span>{' '}
                          {session.notes}
                        </div>
                      ) : null;

                    if (activityType === 'running') {
                      const isWalk = isWalkingLikeRunningSession(session, gAct);
                      const inferredFromGarmin = gAct
                        ? inferRunningSessionTypeFromGarminActivity(gAct)
                        : undefined;
                      const displayRunType = isWalk
                        ? 'walking'
                        : resolveRunningSessionDisplayType(session, inferredFromGarmin);
                      const paceNum = paceMinPerKmFromSession(session);
                      const paceStr =
                        paceNum != null ? formatPaceMinPerKm(paceNum) : String(session.pace || '—');
                      const dist = parseFloat(String(session.distance ?? '').replace(',', '.')) || 0;
                      const durMin = parseRunningSessionDurationMinutes(session.duration);
                      const speedKmh =
                        durMin > 0 && dist > 0
                          ? dist / (durMin / 60)
                          : parseFloat(String(session.speed ?? '').replace(',', '.')) || null;
                      const speedLabel =
                        speedKmh != null && Number.isFinite(speedKmh)
                          ? `${speedKmh.toFixed(2)} km/h`
                          : session.speed
                            ? `${session.speed} km/h`
                            : '—';

                      return (
                        <div
                          key={`cal-end-${activityType}-${session.id ?? idx}`}
                          className="rounded-xl border border-[#0F4C5C]/50 bg-slate-950/80 p-4"
                        >
                          <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                            <span
                              className={`text-base font-bold ${
                                displayRunType === 'interval'
                                  ? 'text-amber-200'
                                  : displayRunType === 'walking'
                                    ? 'text-sky-300'
                                    : 'text-emerald-200'
                              }`}
                            >
                              {runningSessionTypeLabel(displayRunType, t)}
                            </span>
                            <span className="text-sm font-medium text-white">{session.date}</span>
                            {session.time ? (
                              <span className="text-sm text-slate-400">{session.time}</span>
                            ) : null}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
                            <div>
                              <span className="text-slate-400">{t('endurance.running.details.distance')}</span>
                              <span className="ml-2 font-semibold text-white">{session.distance} km</span>
                            </div>
                            <div>
                              <span className="text-slate-400">{t('endurance.running.details.duration')}</span>
                              <span className="ml-2 font-semibold text-white">{session.duration}</span>
                            </div>
                            <div>
                              <span className="text-slate-400">{t('endurance.running.details.pace')}</span>
                              <span className="ml-2 font-semibold text-white">{paceStr}</span>
                            </div>
                            <div>
                              <span className="text-slate-400">{t('endurance.running.details.speed')}</span>
                              <span className="ml-2 font-semibold text-white">{speedLabel}</span>
                            </div>
                          </div>
                          {notesLine}
                        </div>
                      );
                    }

                    if (activityType === 'swimming') {
                      const swimTotalM =
                        Array.isArray(session.laps) && session.laps.length > 0
                          ? session.laps.reduce(
                              (s, lap) =>
                                s + (parseFloat(String(lap?.distance ?? '').replace(',', '.')) || 0),
                              0
                            )
                          : parseFloat(String(session.distance ?? '').replace(',', '.')) || 0;
                      const swimMin = parseDurationToMinutes(
                        session.duration || session.totalTime || 0,
                        `CalendarHeatmap.swim.${idx}`
                      );
                      return (
                        <div
                          key={`cal-end-${activityType}-${session.id ?? idx}`}
                          className="rounded-xl border border-cyan-600/35 bg-slate-950/80 p-4"
                        >
                          <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                            <span className="text-base font-bold text-cyan-200">
                              {t('calendar.heatmap.dayDetails.swimming')}
                            </span>
                            <span className="text-sm font-medium text-white">{session.date}</span>
                            {session.time ? (
                              <span className="text-sm text-slate-400">{session.time}</span>
                            ) : null}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-3">
                            <div>
                              <span className="text-slate-400">{t('calendar.heatmap.dayDetails.distance')}</span>
                              <span className="ml-2 font-semibold text-white">
                                {Math.round(swimTotalM)} m
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400">{t('calendar.heatmap.dayDetails.duration')}</span>
                              <span className="ml-2 font-semibold text-white">
                                {session.duration || (swimMin > 0 ? `${swimMin} min` : '—')}
                              </span>
                            </div>
                            {session.pace100m ? (
                              <div>
                                <span className="text-slate-400">
                                  {t('endurance.swimming.details.pace100m')}
                                </span>
                                <span className="ml-2 font-semibold text-white">{session.pace100m}</span>
                              </div>
                            ) : null}
                          </div>
                          {notesLine}
                        </div>
                      );
                    }

                    if (activityType === 'jumprope') {
                      const jumps = session.jumps ?? session.reps ?? session.count ?? 0;
                      return (
                        <div
                          key={`cal-end-${activityType}-${session.id ?? idx}`}
                          className="rounded-xl border border-amber-600/35 bg-slate-950/80 p-4"
                        >
                          <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                            <span className="text-base font-bold text-amber-200">
                              {t('calendar.heatmap.dayDetails.jumpRope')}
                            </span>
                            <span className="text-sm font-medium text-white">{session.date}</span>
                            {session.time ? (
                              <span className="text-sm text-slate-400">{session.time}</span>
                            ) : null}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-slate-400">{t('calendar.heatmap.dayDetails.jumps')}</span>
                              <span className="ml-2 font-semibold text-white">{jumps}</span>
                            </div>
                            <div>
                              <span className="text-slate-400">{t('calendar.heatmap.dayDetails.duration')}</span>
                              <span className="ml-2 font-semibold text-white">{session.duration || '—'}</span>
                            </div>
                          </div>
                          {notesLine}
                        </div>
                      );
                    }

                    const strengthLabel =
                      activityType === 'boxing'
                        ? t('calendar.heatmap.dayDetails.enduranceActBoxing')
                        : activityType === 'gainage'
                          ? t('calendar.heatmap.dayDetails.enduranceActGainage')
                          : activityType === 'pushups'
                            ? t('calendar.heatmap.dayDetails.pushups')
                            : activityType;
                    const repsVal =
                      session.count ?? session.reps ?? session.jumps ?? 0;
                    return (
                      <div
                        key={`cal-end-${activityType}-${session.id ?? idx}`}
                        className="rounded-xl border border-slate-600/40 bg-slate-950/80 p-4"
                      >
                        <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                          <span className="text-base font-bold text-slate-200">{strengthLabel}</span>
                          <span className="text-sm font-medium text-white">{session.date}</span>
                          {session.time ? (
                            <span className="text-sm text-slate-400">{session.time}</span>
                          ) : null}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-slate-400">{t('calendar.heatmap.dayDetails.totalReps')}</span>
                            <span className="ml-2 font-semibold text-white">{repsVal}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">{t('calendar.heatmap.dayDetails.duration')}</span>
                            <span className="ml-2 font-semibold text-white">{session.duration || '—'}</span>
                          </div>
                        </div>
                        {notesLine}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Données d'endurance détaillées */}
            {selectedDate.intensity.enduranceData && selectedDate.intensity.enduranceData.sessions > 0 && (
              <div>
                <h4 className="text-white font-medium mb-3 flex items-center">
                  <Activity className="mr-2" size={16} />
                  {t('calendar.heatmap.dayDetails.enduranceActivities')}
                </h4>
                <div className={`grid gap-4 ${selectedDate.intensity.enduranceData.reps > 0 ? 'grid-cols-2 md:grid-cols-5' : 'grid-cols-2 md:grid-cols-4'}`}>
                  <div className="bg-orange-700/30 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-orange-200">{selectedDate.intensity.enduranceData.sessions}</div>
                    <div className="text-orange-300 text-sm">{t('calendar.heatmap.dayDetails.enduranceSessions')}</div>
                  </div>
                  {selectedDate.intensity.enduranceData.reps > 0 && (
                    <div className="bg-red-700/30 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-red-200">{selectedDate.intensity.enduranceData.reps}</div>
                      <div className="text-red-300 text-sm">{t('calendar.heatmap.dayDetails.pushups')}</div>
                    </div>
                  )}
                  <div className="bg-blue-700/30 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-blue-200">
                      {(() => {
                        const parts = [];
                        if (enduranceDay.runningDistanceKm > 0) {
                          const r = enduranceDay.runningDistanceKm;
                          parts.push(r % 1 === 0 ? `${r} km` : `${r.toFixed(1)} km`);
                        }
                        if (enduranceDay.swimmingDistanceM > 0) {
                          parts.push(`${Math.round(enduranceDay.swimmingDistanceM)} m`);
                        }
                        if (parts.length > 0) return parts.join(' · ');
                        const legacy = selectedDate.intensity.enduranceData.distance;
                        if (legacy > 0) {
                          return legacy % 1 === 0 ? `${legacy}` : parseFloat(legacy.toFixed(1)).toString();
                        }
                        return '—';
                      })()}
                    </div>
                    <div className="text-blue-300 text-sm">{t('calendar.heatmap.dayDetails.enduranceDistance')}</div>
                  </div>
                  <div className="bg-amber-900/25 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-amber-100">{selectedDate.intensity.enduranceData.jumps}</div>
                    <div className="text-amber-300 text-sm">{t('calendar.heatmap.dayDetails.enduranceJumps')}</div>
                  </div>
                  <div className="bg-slate-700/40 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-slate-100">{selectedDate.intensity.enduranceData.duration}min</div>
                    <div className="text-slate-300 text-sm">{t('calendar.heatmap.dayDetails.enduranceDuration')}</div>
                  </div>
                </div>
              </div>
            )}
          
            {/* Exercices réalisés - Masquer si jour justifié (sauf repos) */}
            {(!justification || justification.reason === JUSTIFICATION_REASONS.REPOS) && selectedDate.intensity.session && selectedDate.intensity.session.exercises.length > 0 && (
              <div>
                <h4 className="text-white font-medium mb-2">{t('calendar.heatmap.dayDetails.exercisesCompleted')}</h4>
                <div className="space-y-2">
                  {selectedDate.intensity.session.exercises.map((exercise, index) => {
                    // Récupérer le nom du programme depuis l'exercice ou via getExerciseNameById
                    const programName = exercise.programName || 'Programme inconnu';
                    const exerciseName = exercise.name || (getExerciseNameById ? getExerciseNameById(exercise.exerciseId || exercise.id) : `Exercice ${exercise.exerciseId || exercise.id}`);
                    const dateStrForRow = getDateStr(selectedDate.date);
                    const rowStorageKey =
                      exercise._storageKey ||
                      `${dateStrForRow}_${exercise.exerciseId ?? exercise.id}`;
                    const isEditingReps = editingRepsStorageKey === rowStorageKey;
                    const coeffData = getCurrentData();
                    const userCoeffs = coeffData?.exerciseIntensityCoeffs || {};
                    const loadCoeff = resolveExerciseIntensityCoeff(
                      {
                        id: exercise.exerciseId ?? exercise.id,
                        name: exerciseName,
                        nom: exerciseName,
                        series: exercise.series || '',
                        type: exercise.type || ''
                      },
                      userCoeffs
                    );
                    
                    return (
                      <div key={rowStorageKey || index} className="bg-slate-700/30 rounded p-2">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-slate-300 font-medium">{exerciseName}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingRepsStorageKey(rowStorageKey);
                                  setEditingRepsDraft(String(exercise.reps ?? ''));
                                }}
                                className="inline-flex shrink-0 rounded border border-slate-500/50 bg-slate-800/60 p-1 text-sky-300 hover:bg-slate-700/80 hover:text-sky-200"
                                title={t(
                                  'calendar.heatmap.dayDetails.editExerciseReps',
                                  'Modifier le nombre de répétitions'
                                )}
                                aria-label={t(
                                  'calendar.heatmap.dayDetails.editExerciseReps',
                                  'Modifier le nombre de répétitions'
                                )}
                              >
                                <Pencil size={14} />
                              </button>
                              <LoadDifficultyStars coeff={loadCoeff} className="scale-90" />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {isEditingReps ? (
                              <div className="flex flex-wrap items-center justify-end gap-1">
                                <Input
                                  type="number"
                                  min={1}
                                  max={99999}
                                  value={editingRepsDraft}
                                  onChange={(e) => setEditingRepsDraft(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleUpdateExerciseRepsFromCalendar(exercise, editingRepsDraft);
                                    }
                                    if (e.key === 'Escape') {
                                      setEditingRepsStorageKey(null);
                                      setEditingRepsDraft('');
                                    }
                                  }}
                                  className="h-8 w-[4.5rem] px-1 text-center text-sm font-semibold bg-slate-800/80 border-slate-500 text-white"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateExerciseRepsFromCalendar(exercise, editingRepsDraft)
                                  }
                                  className="inline-flex rounded border border-emerald-500/50 bg-emerald-950/30 p-1 text-emerald-200 hover:bg-emerald-900/40"
                                  title={t('calendar.heatmap.dayDetails.saveReps', 'Enregistrer')}
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingRepsStorageKey(null);
                                    setEditingRepsDraft('');
                                  }}
                                  className="inline-flex rounded border border-slate-500/50 bg-slate-800/60 p-1 text-slate-300 hover:bg-slate-700/80"
                                  title={t('calendar.heatmap.dayDetails.cancelRepsEdit', 'Annuler')}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <span className="text-white font-medium">
                                {exercise.reps} {t('calendar.heatmap.dayDetails.reps')}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteExerciseRecordFromCalendar(exercise)}
                              className="inline-flex items-center gap-1 rounded border border-rose-500/45 bg-rose-950/20 px-2 py-1 text-[11px] text-rose-200 hover:bg-rose-900/30"
                              title={t('calendar.heatmap.dayDetails.deleteExerciseRecord', 'Supprimer cet enregistrement')}
                            >
                              <Trash2 size={12} />
                              {t('calendar.heatmap.dayDetails.deleteShort', 'Supprimer')}
                            </button>
                          </div>
                        </div>
                        {programName && (
                          <div className="text-xs text-slate-400 flex items-center gap-1">
                            <span className="text-sky-400">📋</span>
                            <span>{programName}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* ✅ NOUVEAU : Bouton pour saisir/modifier la séance - Toujours disponible */}
            {(!justification || justification.reason === JUSTIFICATION_REASONS.REPOS) && (
              <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-emerald-300 font-medium mb-1 flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      {selectedDate.intensity.completedCount === 0 
                        ? t('calendar.heatmap.dayDetails.garminActivityDetected', 'Activité Garmin détectée')
                        : t('calendar.heatmap.dayDetails.modifyWorkout', 'Modifier ma séance')
                      }
                    </h4>
                    <p className="text-slate-300 text-sm">
                      {selectedDate.intensity.completedCount === 0 
                        ? t('calendar.heatmap.dayDetails.noExercisesButActivity', 'Une activité a été enregistrée sur votre montre Garmin mais aucun exercice n\'a été saisi. Souhaitez-vous enregistrer votre séance maintenant ?')
                        : t('calendar.heatmap.dayDetails.modifyWorkoutMessage', 'Vous pouvez modifier ou compléter votre séance enregistrée.')
                      }
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      setPanelMode('workout-entry');
                      setPanelDate(selectedDate.date);
                      setSelectedDate(null);
                    }}
                    icon={Save}
                    className="ml-4"
                  >
                    {selectedDate.intensity.completedCount === 0
                      ? t('calendar.heatmap.dayDetails.enterWorkout', 'Saisir ma séance')
                      : t('calendar.heatmap.dayDetails.modifyWorkout', 'Modifier ma séance')
                    }
                  </Button>
                </div>
              </div>
            )}
            </div>
          );
        }
        
        // Si aucun mode ne correspond, retourner null
        return null;
      })()}
      
      {/* ✅ NOUVEAU : Modal de justification */}
      {justificationModalDate && (
        <JustificationModal
          isOpen={!!justificationModalDate}
          onClose={() => setJustificationModalDate(null)}
          date={justificationModalDate}
          existingJustification={getDayJustification(allData, getDateStr(justificationModalDate))}
        />
      )}
      
    </div>
  );
};

export default CalendarHeatmap;