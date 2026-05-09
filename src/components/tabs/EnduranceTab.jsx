import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Calendar, Dumbbell, Waves, Activity, Play, Box, Plus, X, Trash2, Award, Edit, Save, Heart, Zap, Anchor, Footprints, Trophy, Repeat } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import StarRating from '../ui/StarRating';
import { useTranslation } from '../../utils/translations';
import { useFormatters } from '../../utils/translations/formatters-hook';
import { getCachedNamespace } from '../../utils/translations/loader';
import { useLanguage } from '../../context/LanguageContext';
import {
  loadEnduranceData as loadEnduranceDataService,
  persistEnduranceData,
  ENDURANCE_SCHEMA_VERSION,
  normalizeEnduranceSession
} from '../../services/endurance/enduranceDataService';
import {
  evaluateChallenges,
  listMatchingChallengeIds,
  sumPushupRepsInChallengeWindow
} from '../../services/endurance/enduranceChallengesService';
import { PUSHUP_CHALLENGE_PRESET_DEFS, buildPushupPresetChallenge } from '../../services/endurance/pushupChallengePresets';
import {
  GAINAGE_CHALLENGE_PRESET_DEFS,
  JUMPROPE_CHALLENGE_PRESET_DEFS,
  buildGainagePresetChallenge,
  buildJumpropePresetChallenge
} from '../../services/endurance/enduranceActivityChallengePresets';
import {
  createDefaultFormState,
  createDefaultChallengeFormState
} from '../../services/endurance/enduranceFormSchema';
import EnduranceSessionForm from './EnduranceTab/components/EnduranceSessionForm.jsx';
import SwimmingSessionExtras from './EnduranceTab/components/SwimmingSessionExtras.jsx';
import RunningSessionExtras from './EnduranceTab/components/RunningSessionExtras.jsx';
import { handleSubmitSession } from '../../services/endurance/enduranceSubmitUtils';
import EnduranceChallengeReminder from './EnduranceTab/components/ui/EnduranceChallengeReminder.jsx';
import EnduranceSectionHeader from './EnduranceTab/components/ui/EnduranceSectionHeader.jsx';
import RunningGarminSyncBlock from './EnduranceTab/components/RunningGarminSyncBlock.jsx';
import RunningPersonalRecordsPanel from './EnduranceTab/components/RunningPersonalRecordsPanel.jsx';
import RunningSessionDetailPage from './EnduranceTab/components/RunningSessionDetailPage.jsx';
import RunningTrophiesPanel from './EnduranceTab/components/RunningTrophiesPanel.jsx';
import SimpleEnduranceTrophiesPanel from './EnduranceTab/components/SimpleEnduranceTrophiesPanel.jsx';
import PushupTrophiesPanel from './EnduranceTab/components/PushupTrophiesPanel.jsx';
import RunningSessionsHistory from './EnduranceTab/components/RunningSessionsHistory.jsx';
import WalkingStatsPanel from './EnduranceTab/components/WalkingStatsPanel.jsx';
import WalkingTrophiesPanel from './EnduranceTab/components/WalkingTrophiesPanel.jsx';
import ManualDailyWalkPanel from './EnduranceTab/components/ManualDailyWalkPanel.jsx';
import AllTrophiesHubPanel from './EnduranceTab/components/AllTrophiesHubPanel.jsx';
import EnduranceCalendarModernPanel from './EnduranceTab/components/EnduranceCalendarModernPanel.jsx';
import DefisDisciplineCalendarPanel from './EnduranceTab/components/DefisDisciplineCalendarPanel.jsx';
import PerformanceChallengesTab from './PerformanceChallengesTab.jsx';
import CircuitsHubPanel from './EnduranceTab/components/CircuitsHubPanel.jsx';
import {
  inferRunningSessionTypeFromGarminActivity,
  isGarminRunningLikeActivity,
  isGarminWalkingLikeActivity,
  shouldExcludeStoredGarminRunningSession
} from '../../utils/garminRunningLaps';
import { useGarminData } from '../../hooks/useGarminData';
import { isWalkingLikeRunningSession } from '../../utils/runningSessionMovementKind';

const EnduranceTab = () => {
  const { data, updateData, getWorkoutHistory, pendingEnduranceSubTab, clearPendingEnduranceSubTab } =
    useWorkout();
  const t = useTranslation();
  const { formatDate } = useFormatters();
  const { language } = useLanguage();
  
  // État unifié pour toutes les sessions d'endurance
  const [enduranceState, setEnduranceState] = useState({
    activeTab: 'running',
    sessions: {
      boxing: [],
      pushups: [],
      gainage: [],
      swimming: [],
      jumprope: [],
      running: []
    },
    challenges: [],
    ui: {
      showChallengeModal: false,
      showSessionForm: false,
      selectedYear: new Date().getFullYear(),
      selectedActivityFilter: 'all',
      selectedDay: null,
      allowPastDates: false,
      editingSession: null,
      editingChallenge: null
    }
  });

  // Getters pour faciliter l'accès aux données
  const activeTab = enduranceState?.activeTab || 'running';
  const sessions = enduranceState?.sessions || {
    boxing: [],
    pushups: [],
    gainage: [],
    swimming: [],
    jumprope: [],
    running: []
  };
  const challenges = enduranceState?.challenges || [];
  const { loadAllData, dbReady } = useGarminData();
  const [garminRunningKindByGarminId, setGarminRunningKindByGarminId] = useState(() => new Map());
  const [garminRunningById, setGarminRunningById] = useState(() => new Map());
  const ui = enduranceState?.ui || {
    showChallengeModal: false,
    showSessionForm: false,
    selectedYear: new Date().getFullYear(),
    selectedActivityFilter: 'all',
    selectedDay: null,
    allowPastDates: false,
    editingSession: null,
    editingChallenge: null
  };

  const buildChallengeKey = useCallback((challenge) => {
    return [
      challenge?.name || '',
      challenge?.activityType || '',
      challenge?.type || '',
      challenge?.targetDate || '',
      challenge?.startDate || '',
      challenge?.endDate || '',
      challenge?.frequency || '',
      challenge?.dayOfWeek ?? '',
      challenge?.goalCount ?? '',
      challenge?.goalDuration ?? '',
      challenge?.goalDistance ?? '',
      challenge?.goalJumps ?? '',
      challenge?.status || ''
    ].join('|');
  }, []);

  const uniqueChallenges = useMemo(() => {
    const seen = new Set();
    const unique = [];
    challenges.forEach((challenge) => {
      const key = buildChallengeKey(challenge);
      if (seen.has(key)) return;
      seen.add(key);
      unique.push(challenge);
    });
    return unique;
  }, [challenges, buildChallengeKey]);

  // Setters optimisés
  const setActiveTab = useCallback((tab) => {
    setEnduranceState(prev => ({ ...prev, activeTab: tab }));
  }, []);

  useEffect(() => {
    if (!pendingEnduranceSubTab) return;
    setEnduranceState((prev) => ({ ...prev, activeTab: pendingEnduranceSubTab }));
    clearPendingEnduranceSubTab?.();
  }, [pendingEnduranceSubTab, clearPendingEnduranceSubTab]);

  const setUI = useCallback((uiUpdates) => {
    setEnduranceState(prev => ({
      ...prev,
      ui: { ...prev.ui, ...uiUpdates }
    }));
  }, []);

  // 🔍 Fonction de diagnostic des données (pour debug)
  const diagnoseDataState = useCallback(() => {
    console.log('🔍 DIAGNOSTIC DES DONNÉES:');
    console.log('📊 Données principales:', data);
    console.log('🏃 Données d\'endurance:', data?.enduranceData);
    console.log('📅 Exercices cochés:', Object.keys(data?.checkedExercises || {}).length);
    console.log('🔢 Répétitions:', Object.keys(data?.reps || {}).length);
    console.log('📸 Photos de progression:', data?.progressPhotos?.length || 0);
    console.log('💬 Feedbacks de session:', Object.keys(data?.sessionFeedbacks || {}).length);
  }, [data]);

  const enduranceLogger = useMemo(() => ({
    debug: (...args) => console.debug('[EnduranceTab]', ...args),
    info: (...args) => console.info('[EnduranceTab]', ...args),
    warn: (...args) => console.warn('[EnduranceTab]', ...args),
    error: (...args) => console.error('[EnduranceTab]', ...args)
  }), []);

  const normalizationKeyRef = useRef(null);

  const loadEnduranceState = useCallback(async () => {
    try {
      const rawEnduranceData = data?.enduranceData || {};
      const {
        sessions: normalizedSessions,
        challenges: normalizedChallenges,
        metadata
      } = loadEnduranceDataService(rawEnduranceData, { logger: enduranceLogger });

      setEnduranceState(prev => ({
        ...prev,
        sessions: normalizedSessions,
        challenges: normalizedChallenges
      }));

      const schemaNeedsUpdate = (rawEnduranceData.schemaVersion || ENDURANCE_SCHEMA_VERSION) !== ENDURANCE_SCHEMA_VERSION;
      const hasLegacy = (metadata.legacyMigrated || 0) > 0;
      const duplicatesResolved =
        (metadata.duplicatesResolved?.sessions || 0) +
        (metadata.duplicatesResolved?.challenges || 0);

      const normalizationKey = [
        rawEnduranceData.lastUpdated || 'no-updated',
        rawEnduranceData.schemaVersion || 'legacy',
        metadata.legacyMigrated || 0,
        metadata.duplicatesResolved?.sessions || 0,
        metadata.duplicatesResolved?.challenges || 0
      ].join('|');

      if (
        (schemaNeedsUpdate || hasLegacy || duplicatesResolved > 0) &&
        normalizationKeyRef.current !== normalizationKey
      ) {
        await persistEnduranceData({
          currentData: data || {},
          patch: {
            sessions: normalizedSessions,
            challenges: normalizedChallenges
          },
          updateData,
          logger: enduranceLogger
        });
        normalizationKeyRef.current = normalizationKey;
      } else {
        normalizationKeyRef.current = normalizationKey;
      }
    } catch (error) {
      console.error('❌ [EnduranceTab] Erreur lors du chargement des données (service):', error);
      normalizationKeyRef.current = null;
    }
  }, [data, enduranceLogger, updateData]);

  useEffect(() => {
    loadEnduranceState();
  }, [loadEnduranceState]);

  /**
   * Garmin (IndexedDB) : garde les cartes id → activité pour course/marche sur tout l’onglet Défis.
   * Avant : ne chargeait que sur l’onglet « course » et ignorait les séances sans tours → données « vides » jusqu’au backfill.
   */
  useEffect(() => {
    if (!dbReady) return;
    let cancelled = false;
    (async () => {
      try {
        const loaded = await loadAllData();
        if (cancelled || !loaded?.activities?.cardio) return;
        const m = new Map();
        const full = new Map();
        for (const act of loaded.activities.cardio) {
          const id = act.garminId ?? act.id;
          if (id == null) continue;
          if (Array.isArray(act.running?.laps) && act.running.laps.length > 0) {
            m.set(String(id), inferRunningSessionTypeFromGarminActivity(act));
          }
          if (isGarminRunningLikeActivity(act) || isGarminWalkingLikeActivity(act)) {
            full.set(String(id), act);
          }
        }
        setGarminRunningKindByGarminId(m);
        setGarminRunningById(full);
      } catch {
        if (!cancelled) {
          setGarminRunningKindByGarminId(new Map());
          setGarminRunningById(new Map());
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dbReady, loadAllData, sessions.running]);

  const saveEnduranceData = useCallback(async (newData) => {
    try {
      if (!newData || typeof newData !== 'object') {
        throw new Error(t('endurance.errors.invalidData'));
      }

      const mergedSessions = {
        boxing: Array.isArray(enduranceState.sessions?.boxing) ? enduranceState.sessions.boxing : [],
        pushups: Array.isArray(enduranceState.sessions?.pushups) ? enduranceState.sessions.pushups : [],
        gainage: Array.isArray(enduranceState.sessions?.gainage) ? enduranceState.sessions.gainage : [],
        swimming: Array.isArray(enduranceState.sessions?.swimming) ? enduranceState.sessions.swimming : [],
        jumprope: Array.isArray(enduranceState.sessions?.jumprope) ? enduranceState.sessions.jumprope : [],
        running: Array.isArray(enduranceState.sessions?.running) ? enduranceState.sessions.running : []
      };

      if (newData.sessions && typeof newData.sessions === 'object') {
        Object.entries(newData.sessions).forEach(([activityType, value]) => {
          if (Array.isArray(value) && activityType in mergedSessions) {
            mergedSessions[activityType] = value;
          }
        });
      }

      const mergedChallenges = Array.isArray(newData.challenges)
        ? newData.challenges
        : Array.isArray(enduranceState.challenges)
          ? enduranceState.challenges
          : [];

      const normalized = loadEnduranceDataService(
        {
          sessions: mergedSessions,
          challenges: mergedChallenges,
          schemaVersion: ENDURANCE_SCHEMA_VERSION
        },
        { logger: enduranceLogger }
      );

      const result = await persistEnduranceData({
        currentData: data || {},
        patch: {
          sessions: normalized.sessions,
          challenges: normalized.challenges
        },
        updateData,
        logger: enduranceLogger
      });

      const nextSessions = result?.enduranceData?.sessions || normalized.sessions;
      const nextChallenges = result?.enduranceData?.challenges || normalized.challenges;

      setEnduranceState(prev => ({
        ...prev,
        sessions: nextSessions,
        challenges: nextChallenges
      }));

      return { success: true };
    } catch (error) {
      console.error('❌ [EnduranceTab] Erreur sauvegarde endurance (service):', error);
      throw error;
    }
  }, [data, enduranceLogger, enduranceState.challenges, enduranceState.sessions, updateData]);

  // Fonction pour identifier les exercices d'endurance (améliorée)
  const isEnduranceExercise = useCallback((exerciseName) => {
    if (!exerciseName || typeof exerciseName !== 'string') return false;
    
    const enduranceKeywords = [
      // Boxe
      'boxe', 'boxing', 'shadow boxing', 'punching bag', 'sack de frappe',
      // Natation
      'natation', 'swimming', 'nage', 'piscine', 'crawl', 'brasse', 'dos', 'papillon',
      // Pompes et variantes
      'pompes', 'push-ups', 'push up', 'pushups', 'pompes inclinées', 'pompes déclinées',
      'diamond push-ups', 'wide push-ups', 'pompes diamant', 'pompes larges',
      // Corde à sauter
      'corde à sauter', 'jump rope', 'saut à la corde', 'corde',
      // Course et cardio
      'course', 'running', 'jogging', 'sprint', 'course à pied',
      // Exercices d'endurance spécifiques
      'burpees', 'mountain climbers', 'jumping jacks', 'high knees', 'jumping squats',
      'plank', 'planche', 'gainage', 'wall sit', 'chaise murale',
      // Cardio général
      'cardio', 'endurance', 'aérobic', 'aerobic'
    ];
    
    const normalizedName = exerciseName.toLowerCase().trim();
    return enduranceKeywords.some(keyword => normalizedName.includes(keyword.toLowerCase()));
  }, []);

  // Récupérer les exercices d'endurance depuis l'historique des séances (corrigé)
  const getEnduranceExercisesFromHistory = useCallback(() => {
    try {
    const history = getWorkoutHistory();
      if (!Array.isArray(history)) return [];
      
    const enduranceExercises = [];
    
    history.forEach(workout => {
        if (!workout || !workout.exercises) return;
        
        // Correction : workout.exercises est un objet, pas un array
        Object.entries(workout.exercises).forEach(([key, exercise]) => {
          if (exercise && exercise.exerciseId) {
            // Récupérer le nom de l'exercice depuis la base de données
            const exerciseName = getExerciseName(exercise.exerciseId);
            
            if (isEnduranceExercise(exerciseName)) {
          enduranceExercises.push({
                id: key,
                exerciseId: exercise.exerciseId,
                name: exerciseName,
                reps: exercise.reps || 0,
                completed: exercise.completed || false,
                variant: exercise.variant || '',
            date: workout.date,
                workoutType: workout.type || 'unknown'
          });
            }
        }
      });
    });
    
      return enduranceExercises.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
      console.error(t('endurance.errors.fetchError'), error);
      return [];
    }
  }, [getWorkoutHistory, isEnduranceExercise]);

  // Fonction pour obtenir le nom d'un exercice par son ID
  const getExerciseName = useCallback((exerciseId) => {
    // Cette fonction devrait récupérer le nom depuis votre base de données d'exercices
    // Pour l'instant, on utilise l'ID comme nom (à améliorer avec une vraie base de données)
    return exerciseId || t('endurance.errors.unknownExercise');
  }, []);

  // Système de rappel des défis actifs
  const getActiveChallenges = useCallback(() => {
    const now = new Date();
    return uniqueChallenges.filter(challenge => {
      if (challenge.status !== 'active') return false;
      
      // Vérifier si le défi est encore valide selon son type
      switch (challenge.type) {
        case 'ponctuel':
          return new Date(challenge.targetDate) > now;
        case 'periode':
        case 'pushups_cumul':
          return new Date(challenge.endDate) > now;
        case 'recurrent':
          // Reste affiché comme « en cours » : chaque nouvelle session peut encore contribuer / être marquée.
          return true;
        default:
          return true;
      }
    });
  }, [uniqueChallenges]);

  // Fonction pour obtenir les défis urgents (échéance < 24h)
  const getUrgentChallenges = useCallback(() => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    return getActiveChallenges().filter(challenge => {
      if (challenge.type === 'ponctuel') {
        const targetDate = new Date(challenge.targetDate);
        return targetDate <= tomorrow && targetDate > now;
      }
      return false;
    });
  }, [getActiveChallenges]);

  // Composant de rappel des défis

  // Formulaires pour chaque type d'activité
  const [sessionForm, setSessionForm] = useState(() => createDefaultFormState('pushups'));
  const [boxingForm, setBoxingForm] = useState(() => createDefaultFormState('boxing'));
  const [swimmingForm, setSwimmingForm] = useState(() => createDefaultFormState('swimming'));
  const [jumpropeForm, setJumpropeForm] = useState(() => createDefaultFormState('jumprope'));
  const [gainageForm, setGainageForm] = useState(() => createDefaultFormState('gainage'));
  const [runningForm, setRunningForm] = useState(() => createDefaultFormState('running'));
  const [walkingForm, setWalkingForm] = useState(() => ({ ...createDefaultFormState('running'), type: 'walk' }));

  const [challengeForm, setChallengeForm] = useState(() => createDefaultChallengeFormState('pushups'));
  /** Modal détail séance course (Garmin / manuel) */
  const [runningDetailSession, setRunningDetailSession] = useState(null);
  const [runningSubView, setRunningSubView] = useState('sessions');
  const [walkingSubView, setWalkingSubView] = useState('sessions');
  const [jumpropeSubView, setJumpropeSubView] = useState('sessions');
  const [gainageSubView, setGainageSubView] = useState('sessions');
  const [pushupsSubView, setPushupsSubView] = useState('sessions');

  const addSession = useCallback(async (activityType, sessionData) => {
    try {
      const currentSessionsMap = enduranceState.sessions || {};
      const activitySessions = Array.isArray(currentSessionsMap[activityType])
        ? currentSessionsMap[activityType]
        : [];

      const normalizedSessionInput = normalizeEnduranceSession(activityType, sessionData);
      const relatedPushupSessions =
        activityType === 'pushups' ? [...activitySessions, normalizedSessionInput] : undefined;

      const evaluation = evaluateChallenges(challenges, normalizedSessionInput, activityType, {
        logger: enduranceLogger,
        relatedPushupSessions
      });
      const badgeIds = listMatchingChallengeIds(challenges, normalizedSessionInput, activityType, {
        logger: enduranceLogger,
        relatedPushupSessions
      });

      const newSession = {
        ...normalizedSessionInput,
        activityType,
        validatedChallenges: badgeIds
      };

      const updatedSessionsMap = {
        ...currentSessionsMap,
        [activityType]: [...activitySessions, newSession]
      };

      await saveEnduranceData({
        sessions: updatedSessionsMap,
        challenges: evaluation.updatedChallenges
      });

      if (badgeIds.length > 0) {
        enduranceLogger.info?.(`[EnduranceTab] Défis correspondant à la session (${activityType}):`, badgeIds);
      }

      return { success: true, validatedChallengeIds: evaluation.validatedIds };
    } catch (error) {
      console.error(`❌ [EnduranceTab] Erreur lors de l'ajout de la session ${activityType}:`, error);
      return { success: false, error: error.message };
    }
  }, [challenges, enduranceLogger, enduranceState.sessions, saveEnduranceData]);

  const updateSession = useCallback(async (activityType, sessionId, updatedData) => {
    try {
      const currentSessionsMap = enduranceState.sessions || {};
      const activitySessions = Array.isArray(currentSessionsMap[activityType])
        ? currentSessionsMap[activityType]
        : [];

      const updatedSessions = activitySessions.map((session) => {
        if (String(session.id) !== String(sessionId)) return session;
        const merged = normalizeEnduranceSession(activityType, { ...session, ...updatedData });
        return merged;
      });
      const relatedPushupSessions = activityType === 'pushups' ? updatedSessions : undefined;
      const withBadges = updatedSessions.map((session) => {
        const badgeIds = listMatchingChallengeIds(challenges, session, activityType, {
          logger: enduranceLogger,
          relatedPushupSessions
        });
        return { ...session, validatedChallenges: badgeIds };
      });

      const updatedSessionsMap = {
        ...currentSessionsMap,
        [activityType]: withBadges
      };

      await saveEnduranceData({
        sessions: updatedSessionsMap
      });

      setUI({
        editingSession: null,
        showSessionForm: false,
        allowPastDates: false
      });

      return { success: true };
    } catch (error) {
      console.error('❌ [EnduranceTab] Erreur lors de la modification de la session:', error);
      return { success: false, error: error.message };
    }
  }, [challenges, enduranceLogger, enduranceState.sessions, saveEnduranceData, setUI]);

  // Fonctions de reset des formulaires
  const resetPushupForm = useCallback(() => {
    setSessionForm(createDefaultFormState('pushups'));
  }, []);

  const resetBoxingForm = useCallback(() => {
    setBoxingForm(createDefaultFormState('boxing'));
  }, []);

  const resetSwimmingForm = useCallback(() => {
    setSwimmingForm(createDefaultFormState('swimming'));
  }, []);

  const resetJumpropeForm = useCallback(() => {
    setJumpropeForm(createDefaultFormState('jumprope'));
  }, []);

  const resetGainageForm = useCallback(() => {
    setGainageForm(createDefaultFormState('gainage'));
  }, []);

  const resetRunningForm = useCallback(() => {
    setRunningForm(createDefaultFormState('running'));
  }, []);
  const resetWalkingForm = useCallback(() => {
    setWalkingForm({ ...createDefaultFormState('running'), type: 'walk' });
  }, []);

  const resetChallengeForm = useCallback((activityType) => {
    const nextActivity = activityType || challengeForm.activityType || 'pushups';
    setChallengeForm(createDefaultChallengeFormState(nextActivity));
  }, [challengeForm.activityType]);

  const submitSession = useCallback(async (activityType, payload, resetFn) => {
    return handleSubmitSession({
      activityType,
      payload,
      resetFn,
      ui,
      addSession,
      updateSession,
      setUI
    });
  }, [addSession, setUI, ui, updateSession]);

  // Fonctions spécifiques pour chaque activité
  const addPushupSession = useCallback(async () => {
    return submitSession('pushups', sessionForm, resetPushupForm);
  }, [submitSession, sessionForm, resetPushupForm]);

  const addGainageSession = useCallback(async () => {
    return submitSession('gainage', gainageForm, resetGainageForm);
  }, [gainageForm, resetGainageForm, submitSession]);

  const addBoxingSession = useCallback(async () => {
    return submitSession('boxing', boxingForm, resetBoxingForm);
  }, [submitSession, boxingForm, resetBoxingForm]);

  const addSwimmingSession = useCallback(async () => {
    const totalDistance = swimmingForm.laps.reduce((sum, lap) => sum + parseFloat(lap.distance || 0), 0);
    const totalTime = swimmingForm.laps.reduce((sum, lap) => {
      const [min, sec] = (lap.time || '0:0').split(':').map(Number);
      return sum + (min * 60 + sec);
    }, 0);
    
    const avgPace = swimmingForm.laps.length > 0 ? totalTime / swimmingForm.laps.length : 0;
    
    // Calculer l'allure sur 100m si fournie ou estimer
    let pace100m = swimmingForm.pace100m;
    if (!pace100m && totalDistance > 0 && totalTime > 0) {
      // Estimation basée sur la distance totale et le temps
      const pacePer100m = (totalTime / totalDistance) * 100;
      const minutes = Math.floor(pacePer100m / 60);
      const seconds = Math.floor(pacePer100m % 60);
      pace100m = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    const sessionData = {
      ...swimmingForm,
      totalDistance,
      totalTime: totalTime, // Garder en secondes pour la cohérence
      avgPace: avgPace.toFixed(1), // Allure moyenne en secondes par 25m
      pace100m: pace100m, // Allure sur 100m
      heartRate: swimmingForm.heartRate ? parseInt(swimmingForm.heartRate) : null,
      calories: swimmingForm.calories ? parseInt(swimmingForm.calories) : null
    };
    
    return submitSession('swimming', sessionData, resetSwimmingForm);
  }, [resetSwimmingForm, submitSession, swimmingForm]);

  const addJumpropeSession = useCallback(async () => {
    // Calculs sécurisés
    const parseMmSs = (str) => {
      if (!str) return 0;
      const parts = String(str).split(':');
      if (parts.length === 2) {
        const m = parseInt(parts[0]) || 0;
        const s = parseInt(parts[1]) || 0;
        return m * 60 + s;
      }
      const asNum = parseInt(str);
      return Number.isFinite(asNum) ? asNum : 0;
    };

    const durationSec = parseMmSs(jumpropeForm.duration);
    let jumpsPerMin = parseFloat(jumpropeForm.jumpsPerMin);
    if ((!jumpsPerMin || isNaN(jumpsPerMin)) && durationSec > 0 && jumpropeForm.jumps) {
      jumpsPerMin = (Number(jumpropeForm.jumps) || 0) / (durationSec / 60);
    }

    const sessionData = {
      ...jumpropeForm,
      durationSec,
      hrMax: jumpropeForm.hrMax ? parseInt(jumpropeForm.hrMax) : null,
      hrAvg: jumpropeForm.hrAvg ? parseInt(jumpropeForm.hrAvg) : null,
      bestStreak: jumpropeForm.bestStreak ? parseInt(jumpropeForm.bestStreak) : null,
      jumpsPerMin: jumpsPerMin ? Math.round(jumpsPerMin * 10) / 10 : null,
      calories: jumpropeForm.calories ? parseInt(jumpropeForm.calories) : null,
      congestion: jumpropeForm.congestion || 0,
      motivation: jumpropeForm.motivation || 0,
      sentimentAvant: jumpropeForm.sentimentAvant || 0,
      sentimentApres: jumpropeForm.sentimentApres || 0,
      fluidite: jumpropeForm.fluidite || 0,
      transpiration: jumpropeForm.transpiration || 0
    };

    return submitSession('jumprope', sessionData, resetJumpropeForm);
  }, [jumpropeForm, resetJumpropeForm, submitSession]);

  const addRunningSession = useCallback(async () => {
    return submitSession('running', runningForm, resetRunningForm);
  }, [runningForm, resetRunningForm, submitSession]);
  const addWalkingSession = useCallback(async () => {
    return submitSession('running', { ...walkingForm, type: 'walk' }, resetWalkingForm);
  }, [walkingForm, resetWalkingForm, submitSession]);



  // Fonction d'ajout de défi (améliorée)
  const addPresetPushupChallenge = useCallback(
    async (presetId) => {
      const built = buildPushupPresetChallenge(presetId);
      if (!built) return { success: false };
      try {
        const currentChallenges = Array.isArray(enduranceState.challenges) ? enduranceState.challenges : [];
        const newChallenge = {
          ...built,
          status: 'active',
          createdAt: new Date().toISOString(),
          progress: 0
        };
        await saveEnduranceData({ challenges: [...currentChallenges, newChallenge] });
        enduranceLogger.info?.('[EnduranceTab] Défi pompes (modèle)', presetId);
        return { success: true };
      } catch (error) {
        console.error('[EnduranceTab] Preset défi pompes:', error);
        return { success: false, error: error.message };
      }
    },
    [enduranceLogger, enduranceState.challenges, saveEnduranceData]
  );

  const addPresetGainageChallenge = useCallback(
    async (presetId) => {
      const built = buildGainagePresetChallenge(presetId);
      if (!built) return { success: false };
      try {
        const currentChallenges = Array.isArray(enduranceState.challenges) ? enduranceState.challenges : [];
        const newChallenge = {
          ...built,
          status: 'active',
          createdAt: new Date().toISOString(),
          progress: 0
        };
        await saveEnduranceData({ challenges: [...currentChallenges, newChallenge] });
        enduranceLogger.info?.('[EnduranceTab] Défi gainage (modèle)', presetId);
        return { success: true };
      } catch (error) {
        console.error('[EnduranceTab] Preset défi gainage:', error);
        return { success: false, error: error.message };
      }
    },
    [enduranceLogger, enduranceState.challenges, saveEnduranceData]
  );

  const addPresetJumpropeChallenge = useCallback(
    async (presetId) => {
      const built = buildJumpropePresetChallenge(presetId);
      if (!built) return { success: false };
      try {
        const currentChallenges = Array.isArray(enduranceState.challenges) ? enduranceState.challenges : [];
        const newChallenge = {
          ...built,
          status: 'active',
          createdAt: new Date().toISOString(),
          progress: 0
        };
        await saveEnduranceData({ challenges: [...currentChallenges, newChallenge] });
        enduranceLogger.info?.('[EnduranceTab] Défi corde (modèle)', presetId);
        return { success: true };
      } catch (error) {
        console.error('[EnduranceTab] Preset défi corde:', error);
        return { success: false, error: error.message };
      }
    },
    [enduranceLogger, enduranceState.challenges, saveEnduranceData]
  );

  const addChallenge = useCallback(async () => {
    try {
      if (!challengeForm.name || !challengeForm.activityType) {
        throw new Error(t('endurance.errors.nameAndTypeRequired'));
      }
      if (challengeForm.type === 'pushups_cumul') {
        if (!challengeForm.startDate || !challengeForm.endDate) {
          throw new Error(t('endurance.errors.pushupsCumulDates'));
        }
        const g = Number(challengeForm.goalTotalCount);
        if (!Number.isFinite(g) || g <= 0) {
          throw new Error(t('endurance.errors.pushupsCumulGoal'));
        }
      }

      const newChallenge = {
        ...challengeForm,
        status: 'active',
        createdAt: new Date().toISOString(),
        progress: 0
      };

      const currentChallenges = Array.isArray(enduranceState.challenges) ? enduranceState.challenges : [];
      const updatedChallenges = [...currentChallenges, newChallenge];

      await saveEnduranceData({
        challenges: updatedChallenges
      });

      resetChallengeForm(challengeForm.activityType);
      setUI({ showChallengeModal: false });

      enduranceLogger.info?.('[EnduranceTab] Défi créé avec succès');
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur lors de la création du défi:', error);
      return { success: false, error: error.message };
    }
  }, [challengeForm, enduranceLogger, enduranceState.challenges, resetChallengeForm, saveEnduranceData, setUI]);


  // ✅ FIX DOUBLONS : Fonction de suppression améliorée (utilise index si ID dupliqué)
  const deleteSession = useCallback(async (activityType, id, index = null) => {
    try {
      const currentSessions = enduranceState?.sessions || {};
      const activitySessions = currentSessions[activityType] || [];
      
      // ✅ FIX : Si index fourni, supprimer par index (évite problèmes avec IDs dupliqués)
      // Sinon, supprimer par ID (comportement normal)
      let updatedSessions;
      if (index !== null && index >= 0 && index < activitySessions.length) {
        // Vérifier que l'ID correspond aussi (double sécurité)
        if (activitySessions[index].id === id) {
          updatedSessions = activitySessions.filter((_, idx) => idx !== index);
        } else {
          // Si l'ID ne correspond pas, utiliser la méthode normale
          updatedSessions = activitySessions.filter(s => s.id !== id);
        }
      } else {
        // ✅ FIX : Si plusieurs sessions avec le même ID, supprimer seulement la première
        const firstIndex = activitySessions.findIndex(s => s.id === id);
        if (firstIndex !== -1) {
          updatedSessions = activitySessions.filter((_, idx) => idx !== firstIndex);
        } else {
          updatedSessions = activitySessions.filter(s => s.id !== id);
        }
      }
      
      const updatedSessionsMap = {
        ...currentSessions,
        [activityType]: updatedSessions
      };

      await saveEnduranceData({
        sessions: updatedSessionsMap
      });
      
      enduranceLogger.info?.(`[EnduranceTab] Session ${activityType} supprimée avec succès`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Erreur lors de la suppression de la session ${activityType}:`, error);
      return { success: false, error: error.message };
    }
  }, [enduranceLogger, enduranceState?.sessions, saveEnduranceData]);

  // ✅ FIX DOUBLONS : Supprimer défi par ID ou par index (comme pour les sessions)
  const deleteChallenge = useCallback(async (id, index = null) => {
    try {
      let updatedChallenges;
      
      if (index !== null && index >= 0 && index < challenges.length) {
        // ✅ FIX : Supprimer par index si fourni (évite problèmes avec IDs dupliqués)
        const filteredChallenges = challenges.filter(c => c.activityType === challenges[index].activityType);
        const activityChallenges = challenges.filter((_, idx) => idx === index);
        if (activityChallenges.length > 0) {
          // Trouver l'index réel dans le tableau filtré
          const realIndex = filteredChallenges.findIndex(c => c.id === id);
          if (realIndex !== -1) {
            updatedChallenges = challenges.filter((_, idx) => idx !== index);
          } else {
            // Fallback : supprimer par index fourni
            updatedChallenges = challenges.filter((_, idx) => idx !== index);
          }
        } else {
          updatedChallenges = challenges.filter((_, idx) => idx !== index);
        }
      } else {
        // ✅ FIX : Si index non fourni, supprimer seulement la première occurrence avec cet ID
        const firstIndex = challenges.findIndex(c => String(c.id) === String(id));
        if (firstIndex !== -1) {
          updatedChallenges = challenges.filter((_, idx) => idx !== firstIndex);
        } else {
          // Fallback : supprimer tous (ancien comportement)
          updatedChallenges = challenges.filter(c => String(c.id) !== String(id));
        }
      }
      
      await saveEnduranceData({
        challenges: updatedChallenges
      });
      
      enduranceLogger.info?.('[EnduranceTab] Défi supprimé avec succès');
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du défi:', error);
      return { success: false, error: error.message };
    }
  }, [challenges, enduranceLogger, saveEnduranceData]);

  // ✅ FIX DOUBLONS : Fonctions de suppression avec index pour éviter problèmes d'IDs dupliqués
  const deletePushupSession = useCallback((id, index) => deleteSession('pushups', id, index), [deleteSession]);
  const deleteBoxingSession = useCallback((id, index) => deleteSession('boxing', id, index), [deleteSession]);
  const deleteSwimmingSession = useCallback((id, index) => deleteSession('swimming', id, index), [deleteSession]);
  const deleteJumpropeSession = useCallback((id, index) => deleteSession('jumprope', id, index), [deleteSession]);
  const deleteGainageSession = useCallback((id, index) => deleteSession('gainage', id, index), [deleteSession]);
  const deleteRunningSession = useCallback((id, index) => deleteSession('running', id, index), [deleteSession]);

  /** Réintègre une séance « cardio Garmin » dans course (défis, XP, calendrier) — choix persisté sur la séance. */
  const restoreRunningSessionFromGarminCardioExclusion = useCallback(
    async (sessionId) => {
      const list = Array.isArray(sessions.running) ? [...sessions.running] : [];
      const i = list.findIndex((s) => String(s.id) === String(sessionId));
      if (i < 0) return;
      list[i] = { ...list[i], includeInRunningDespiteGarminCardio: true };
      await saveEnduranceData({ sessions: { running: list } });
    },
    [sessions.running, saveEnduranceData]
  );

  // Fonctions de modification des sessions
  const editSession = useCallback((activityType, sessionId) => {
    const currentSessions = enduranceState?.sessions || {};
    const session = currentSessions[activityType]?.find(s => s.id === sessionId);
    if (session) {
      setUI({ 
        editingSession: { activityType, sessionId, session },
        showSessionForm: true,
        allowPastDates: true
      });
      
      // Pré-remplir le formulaire selon l'activité
      switch (activityType) {
        case 'boxing':
          setBoxingForm({
            date: session.date,
            time: session.time,
            duration: session.duration,
            notes: session.notes || ''
          });
          break;
        case 'pushups':
          setSessionForm({
            date: session.date,
            time: session.time,
            count: session.count,
            duration: session.duration,
            notes: session.notes || ''
          });
          break;
        case 'swimming':
          setSwimmingForm({
            date: session.date,
            time: session.time,
            strokeType: session.strokeType,
            laps: session.laps || [{ distance: 25, time: '' }],
            notes: session.notes || ''
          });
          break;
        case 'jumprope':
          setJumpropeForm({
            date: session.date,
            time: session.time,
            duration: session.duration,
            type: session.type,
            jumps: session.jumps || '',
            notes: session.notes || ''
          });
          break;
        case 'gainage':
          setGainageForm({
            date: session.date,
            time: session.time,
            count: session.count,
            duration: session.duration,
            notes: session.notes || ''
          });
          break;
        case 'running':
          setRunningForm({
            date: session.date,
            time: session.time,
            distance: session.distance,
            duration: session.duration,
            type: session.type,
            elevation: session.elevation || '',
            notes: session.notes || ''
          });
          break;
      }
    }
  }, [sessions, setUI]);

  // Fonctions de modification des défis
  const editChallenge = useCallback((challengeId) => {
    const challenge = challenges.find(c => c.id === challengeId);
    if (challenge) {
      setUI({ 
        editingChallenge: challengeId,
        showChallengeModal: true
      });
      
      // Pré-remplir le formulaire de défi
      setChallengeForm({
        name: challenge.name,
        activityType: challenge.activityType,
        type: challenge.type,
        targetDate: challenge.targetDate,
        startDate: challenge.startDate,
        endDate: challenge.endDate,
        frequency: challenge.frequency,
        timeOfDay: challenge.timeOfDay,
        dayOfWeek: challenge.dayOfWeek,
        goalCount: challenge.goalCount || '',
        goalDuration: challenge.goalDuration || '',
        goalDistance: challenge.goalDistance || '',
        notes: challenge.notes || ''
      });
    }
  }, [challenges, setUI]);

  const updateChallenge = useCallback(async (challengeId, updatedData) => {
    try {
      const updatedChallenges = challenges.map(challenge => 
        challenge.id === challengeId ? { ...challenge, ...updatedData } : challenge
      );
      
      // Sauvegarde
      const saveData = {
        challenges: updatedChallenges
      };
      
      await saveEnduranceData(saveData);
      
      // Fermer le mode édition
      setUI({ 
        editingChallenge: null,
        showChallengeModal: false
      });
      
      return { success: true };
    } catch (error) {
      console.error(t('endurance.errors.updateError'), error);
      return { success: false, error: error.message };
    }
  }, [challenges, saveEnduranceData, setUI]);

  // Fonctions pour le calendrier heatmap
  // Fonctions pour le calendrier heatmap (optimisées)
  const getTotalActivities = useMemo(() => {
    const currentSessions = enduranceState?.sessions || {};
    const total = Object.values(currentSessions).reduce((total, activitySessions) => {
      if (Array.isArray(activitySessions)) {
        return total + activitySessions.length;
      }
      return total;
    }, 0);
    console.log('🔍 getTotalActivities calculé:', total, 'sessions:', currentSessions);
    return total;
  }, [enduranceState?.sessions]);

  const getCurrentStreak = useMemo(() => {
    const currentSessions = enduranceState?.sessions || {};
    const allSessions = Object.entries(currentSessions).flatMap(([type, activitySessions]) =>
      Array.isArray(activitySessions) ? activitySessions.map(s => ({ ...s, type })) : []
    );
    
    const today = new Date();
    let streak = 0;
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      const hasActivity = allSessions.some(session => session.date === dateStr);
      if (hasActivity) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }, [enduranceState?.sessions]);

  const getBestStreak = useMemo(() => {
    const currentSessions = enduranceState?.sessions || {};
    const allSessions = Object.entries(currentSessions).flatMap(([type, activitySessions]) =>
      Array.isArray(activitySessions) ? activitySessions.map(s => ({ ...s, type })) : []
    );
    
    if (allSessions.length === 0) return 0;
    
    const sortedSessions = allSessions.sort((a, b) => new Date(a.date) - new Date(b.date));
    let maxStreak = 0;
    let currentStreak = 1;
    
    for (let i = 1; i < sortedSessions.length; i++) {
      const prevDate = new Date(sortedSessions[i-1].date);
      const currDate = new Date(sortedSessions[i].date);
      const diffDays = (currDate - prevDate) / (1000 * 60 * 60 * 24);
      
      if (diffDays === 1) {
        currentStreak++;
      } else {
        maxStreak = Math.max(maxStreak, currentStreak);
        currentStreak = 1;
      }
    }
    
    return Math.max(maxStreak, currentStreak);
  }, [enduranceState?.sessions]);

  const getActiveDays = useMemo(() => {
    const currentSessions = enduranceState?.sessions || {};
    const allSessions = Object.entries(currentSessions).flatMap(([type, activitySessions]) =>
      Array.isArray(activitySessions) ? activitySessions.map(s => ({ ...s, type })) : []
    );
    
    const uniqueDays = new Set(allSessions.map(session => session.date));
    return uniqueDays.size;
  }, [enduranceState?.sessions]);

  const getMonthLabels = useMemo(() => {
    // Récupérer directement depuis le namespace pour obtenir l'array
    const enduranceData = getCachedNamespace(language, 'endurance');
    const months = enduranceData?.calendar?.months?.short;
    return Array.isArray(months) ? months : ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  }, [language]);

  const getCalendarDays = () => {
    const year = ui.selectedYear;
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    const days = [];
    
    // Ajouter les jours vides pour aligner avec le début de l'année
    const startDayOfWeek = startDate.getDay();
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // Ajouter tous les jours de l'année
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const getActivityCountForDay = useCallback((day) => {
    if (!day) return 0;
    
    const dateStr = day.toISOString().split('T')[0];
    let count = 0;
    
    if (ui.selectedActivityFilter === 'all' || ui.selectedActivityFilter === 'boxing') {
      count += sessions.boxing.filter(s => s.date === dateStr).length;
    }
    if (ui.selectedActivityFilter === 'all' || ui.selectedActivityFilter === 'pushups') {
      count += sessions.pushups.filter(s => s.date === dateStr).length;
    }
    if (ui.selectedActivityFilter === 'all' || ui.selectedActivityFilter === 'swimming') {
      count += sessions.swimming.filter(s => s.date === dateStr).length;
    }
    if (ui.selectedActivityFilter === 'all' || ui.selectedActivityFilter === 'jumprope') {
      count += sessions.jumprope.filter(s => s.date === dateStr).length;
    }
    if (ui.selectedActivityFilter === 'all' || ui.selectedActivityFilter === 'gainage') {
      count += (sessions.gainage || []).filter(s => s.date === dateStr).length;
    }
    if (ui.selectedActivityFilter === 'all' || ui.selectedActivityFilter === 'running') {
      count += sessions.running.filter(
        (s) => s.date === dateStr && !shouldExcludeStoredGarminRunningSession(s)
      ).length;
    }
    
    return count;
  }, [sessions, ui.selectedActivityFilter]);

  const handleDayClick = useCallback((day) => {
    setUI({ selectedDay: day });
  }, []);

  const getActivitiesForDay = useCallback((day) => {
    if (!day) return [];
    
    const dateStr = day.toISOString().split('T')[0];
    const activities = [];
    
    sessions.boxing.filter(s => s.date === dateStr).forEach(session => {
      activities.push({
        type: 'boxing',
        time: session.time,
        duration: `${session.duration} min`,
        distance: null
      });
    });
    
    sessions.pushups.filter(s => s.date === dateStr).forEach(session => {
      activities.push({
        type: 'pushups',
        time: session.time,
        duration: session.duration,
        distance: `${session.count} pompes`
      });
    });
    
    sessions.swimming.filter(s => s.date === dateStr).forEach(session => {
      // totalTime est en secondes, convertir en minutes pour l'affichage
      const totalTimeSeconds = typeof session.totalTime === 'number' ? 
        session.totalTime : parseFloat(session.totalTime || 0);
      const durationMinutes = (totalTimeSeconds / 60).toFixed(1);
      
      activities.push({
        type: 'swimming',
        time: session.time,
        duration: `${durationMinutes} min`,
        distance: `${session.totalDistance}m`
      });
    });
    
    sessions.jumprope.filter(s => s.date === dateStr).forEach(session => {
      activities.push({
        type: 'jumprope',
        time: session.time,
        duration: session.duration,
        distance: session.jumps ? `${session.jumps} sauts` : null
      });
    });

    (sessions.gainage || []).filter(s => s.date === dateStr).forEach(session => {
      activities.push({
        type: 'gainage',
        time: session.time,
        duration: `${session.duration} min`,
        distance: session.count != null ? `${session.count} s` : null
      });
    });
    
    sessions.running
      .filter((s) => s.date === dateStr && !shouldExcludeStoredGarminRunningSession(s))
      .forEach((session) => {
        activities.push({
          type: 'running',
          time: session.time,
          duration: session.duration,
          distance: `${session.distance}km`
        });
      });
    
    return activities.sort((a, b) => a.time.localeCompare(b.time));
  }, [sessions]);

  const navigateToActivity = useCallback((activityType) => {
    setUI({ selectedDay: null });
    setActiveTab(activityType);
  }, [setActiveTab]);

  const addLap = useCallback(() => {
    setSwimmingForm(prev => ({
      ...prev,
      laps: [...prev.laps, { distance: 25, time: '' }]
    }));
  }, []);

  const removeLap = useCallback((index) => {
    setSwimmingForm(prev => ({
      ...prev,
      laps: prev.laps.filter((_, i) => i !== index)
    }));
  }, []);

  const updateLap = useCallback((index, field, value) => {
    setSwimmingForm(prev => {
      const newLaps = [...prev.laps];
      newLaps[index][field] = value;
      return { ...prev, laps: newLaps };
    });
  }, []);

  const activeChallenges = useMemo(() => getActiveChallenges(), [getActiveChallenges]);
  const urgentChallenges = useMemo(() => getUrgentChallenges(), [getUrgentChallenges]);

  const menuItems = useMemo(
    () => [
      { id: 'running', label: t('endurance.menu.running'), icon: Play },
      { id: 'walking', label: t('endurance.menu.walking'), icon: Footprints },
      { id: 'pushups', label: t('endurance.menu.pushups'), icon: Dumbbell },
      { id: 'jumprope', label: t('endurance.menu.jumprope'), icon: Activity },
      { id: 'gainage', label: t('endurance.menu.gainage'), icon: Anchor },
      { id: 'boxing', label: t('endurance.menu.boxing'), icon: Box },
      { id: 'swimming', label: t('endurance.menu.swimming'), icon: Waves },
      { id: 'circuits', label: t('endurance.menu.circuits', 'Circuits'), icon: Repeat },
      { id: 'trophies', label: t('endurance.menu.allTrophies', 'Tous mes trophées'), icon: Award },
      { id: 'performance', label: t('endurance.menu.performance', 'Performances'), icon: Trophy },
      { id: 'calendar', label: t('endurance.menu.calendar'), icon: Calendar }
    ],
    [t]
  );

  // Composant pour afficher les exercices d'endurance depuis l'historique (optimisé)
  const EnduranceHistorySection = useMemo(() => {
    const enduranceExercises = getEnduranceExercisesFromHistory();
    
    if (enduranceExercises.length === 0) {
      return (
        <div className="bg-black border border-[#0F4C5C]/50 rounded-2xl p-8 mb-8">
          <h3 className="text-xl font-bold text-white mb-4">{t('endurance.history.fromWorkouts.title')}</h3>
          <p className="text-slate-400">{t('endurance.history.fromWorkouts.none')}</p>
        </div>
      );
    }

    return (
      <div className="bg-black border border-[#0F4C5C]/50 rounded-2xl p-8 mb-8">
        <h3 className="text-xl font-bold text-white mb-4">Exercices d'Endurance depuis vos Séances</h3>
        <div className="space-y-3">
          {enduranceExercises.slice(0, 10).map((exercise, index) => (
            <div key={exercise.id || index} className="bg-black border border-[#0F4C5C]/50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-white font-medium">{exercise.name}</span>
                  <span className="text-slate-400 ml-2">{t('endurance.history.fromWorkouts.reps', { count: exercise.reps })}</span>
                </div>
                <div className="text-slate-400 text-sm">{exercise.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }, [getEnduranceExercisesFromHistory]);

  const runningGarminCardioExcluded = useMemo(
    () => (sessions.running || []).filter((s) => shouldExcludeStoredGarminRunningSession(s)),
    [sessions.running]
  );
  const walkingSessions = useMemo(
    () =>
      (sessions.running || []).filter(
        (s) =>
          !shouldExcludeStoredGarminRunningSession(s) &&
          isWalkingLikeRunningSession(s, garminRunningById.get(String(s?.garminId ?? s?.id ?? '')) || null)
      ),
    [sessions.running, garminRunningById]
  );
  const runningSessionsNoWalk = useMemo(
    () =>
      (sessions.running || []).filter(
        (s) =>
          !shouldExcludeStoredGarminRunningSession(s) &&
          !isWalkingLikeRunningSession(s, garminRunningById.get(String(s?.garminId ?? s?.id ?? '')) || null)
      ),
    [sessions.running, garminRunningById]
  );

  return (
    <div className="relative">
      {/* Contenu avec z-index relatif */}
      <div className="relative z-10 flex min-h-0 flex-col md:flex-row md:items-start">
        {/* Menu latéral — une seule zone de scroll (page) */}
        <div className="mb-6 w-full shrink-0 rounded-2xl border-2 border-[#0F4C5C]/70 bg-black p-1 shadow-lg shadow-black/40 md:mb-0 md:mr-6 md:w-72 md:self-stretch">
        <div className="px-4 pb-3 pt-4">
          <h1 className="bg-gradient-to-r from-teal-200 via-sky-300 to-cyan-400 bg-clip-text text-3xl font-bold text-transparent">
            {t('endurance.title')}
          </h1>
          <p className="mt-1.5 text-sm text-teal-700">{t('endurance.subtitle')}</p>
        </div>
        
        <nav className="px-4">
          {menuItems.map(item => {
            const Icon = item.icon;
            const count = activeChallenges.filter(c => c.activityType === item.id).length;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`group mb-2 flex w-full items-center justify-between rounded-xl border px-5 py-4 transition-all duration-300 ${
                  activeTab === item.id
                    ? 'border-[#0F5C45]/70 bg-[#0F5C45]/25 text-white shadow-md shadow-black/30'
                    : 'border-transparent text-teal-200/90 hover:border-[#0F4C5C]/40 hover:bg-[#0F4C5C]/10 hover:text-white'
                }`}
              >
                <div className="flex items-center">
                  <Icon className={`w-5 h-5 mr-3 ${activeTab === item.id ? '' : 'group-hover:scale-110 transition-transform'}`} />
                  <span className="font-medium">{item.label}</span>
                </div>
                {count > 0 && (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0F5C45] text-xs font-bold text-white shadow-md shadow-black/30">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        </div>

      {/* Contenu principal — pas de scroll interne : le scroll est celui de la page */}
      <div className="min-w-0 flex-1">
        {runningDetailSession ? (
          <RunningSessionDetailPage
            session={runningDetailSession}
            onBack={() => setRunningDetailSession(null)}
          />
        ) : (
        <div className="max-w-7xl mx-auto p-8">
          {/* Rappel des défis actifs */}
          <EnduranceChallengeReminder
            activeChallenges={activeChallenges}
            urgentChallenges={urgentChallenges}
            onSelectActivity={setActiveTab}
          />
          
          {/* Section exercices d'endurance depuis l'historique */}
          {EnduranceHistorySection}

          {/* SECTION BOXE */}
          {activeTab === 'boxing' && (
            <>
              <EnduranceSectionHeader
                title={t('endurance.sections.boxing.title')}
                subtitle={t('endurance.sections.boxing.subtitle')}
                actions={[
                  {
                    key: 'new-boxing-session',
                    label: t('endurance.actions.newSession'),
                    icon: Plus,
                    onClick: () => setUI({ showSessionForm: !ui.showSessionForm }),
                    className:
                      'gradient-button-premium gradient-button-premium-md rounded-lg flex items-center gap-2'
                  },
                  {
                    key: 'past-boxing-session',
                    label: t('endurance.actions.pastData'),
                    icon: Calendar,
                    onClick: () => setUI({ showSessionForm: !ui.showSessionForm, allowPastDates: true }),
                    className:
                      'gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg flex items-center gap-2'
                  }
                ]}
              />

              {/* Formulaire de session boxe */}
              {ui.showSessionForm && (
                <div className="bg-black border-2 border-[#0F4C5C]/70 rounded-2xl p-8 mb-8 shadow-2xl shadow-black/40">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-white">
                      {ui.editingSession ? t('endurance.sections.boxing.editSession') : t('endurance.sections.boxing.newSession')}
                    </h3>
                    {ui.allowPastDates && (
                      <span className="bg-orange-500/20 border border-orange-500/30 text-orange-400 px-3 py-1 rounded-lg text-sm font-medium">
                        {t('endurance.modes.pastDataMode')}
                      </span>
                    )}
                  </div>
                  <EnduranceSessionForm
                    activityType="boxing"
                    formState={boxingForm}
                    setFormState={setBoxingForm}
                    onSubmit={addBoxingSession}
                    onCancel={() => setUI({ showSessionForm: false })}
                    onUpdate={updateSession}
                    onDelete={deleteBoxingSession}
                    onEdit={editSession}
                    onReset={resetBoxingForm}
                  />
                </div>
              )}

              {/* Historique boxe */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">{t('endurance.history.title')}</h3>
                <div className="bg-black border border-[#0F4C5C]/50 rounded-2xl overflow-hidden">
                  {sessions.boxing.length === 0 ? (
                    <div className="p-12 text-center">
                      <Box className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400 text-lg">{t('endurance.history.noSessions')}</p>
                      <p className="text-slate-500 text-sm mt-2">{t('endurance.history.noSessionsHint')}</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#0F4C5C]/45">
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">{t('endurance.table.headers.date')}</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">{t('endurance.table.headers.time')}</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">{t('endurance.table.headers.duration')}</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">{t('endurance.table.headers.notes')}</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">{t('endurance.table.headers.actions')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sessions.boxing.sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time)).map((session, idx) => (
                            <tr 
                              key={`boxing-${session.id}-${idx}`} 
                              className="border-b border-[#0F4C5C]/25 hover:bg-[#0F4C5C]/12 transition-colors"
                            >
                              <td className="px-6 py-4 text-slate-300">{session.date}</td>
                              <td className="px-6 py-4 text-slate-300">{session.time}</td>
                              <td className="px-6 py-4">
                                <span className="text-white font-bold text-lg">{session.duration} min</span>
                              </td>
                              <td className="px-6 py-4 text-slate-400 text-sm">{session.notes || '-'}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => editSession('boxing', session.id)}
                                    className="gradient-button-premium gradient-button-premium-sm gradient-button-premium-variant rounded-lg p-2"
                                    title={t('endurance.session.edit')}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                <button
                                  onClick={() => deleteBoxingSession(session.id, idx)}
                                  className="gradient-button-premium gradient-button-premium-sm rounded-lg p-2"
                                    title={t('endurance.session.delete')}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* SECTION POMPES */}
          {activeTab === 'pushups' && (
            <>
              <EnduranceSectionHeader
                title={t('endurance.sections.pushups.title')}
                subtitle={t('endurance.sections.pushups.subtitle')}
                actions={[
                  {
                    key: 'new-pushup-session',
                    label: t('endurance.actions.newSession'),
                    icon: Plus,
                    onClick: () => setUI({ showSessionForm: !ui.showSessionForm }),
                    className:
                      'gradient-button-premium gradient-button-premium-md rounded-lg flex items-center gap-2'
                  },
                  {
                    key: 'past-pushup-session',
                    label: t('endurance.actions.pastData'),
                    icon: Calendar,
                    onClick: () => setUI({ showSessionForm: !ui.showSessionForm, allowPastDates: true }),
                    className:
                      'gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg flex items-center gap-2'
                  },
                  {
                    key: 'create-pushup-challenge',
                    label: t('endurance.actions.createChallenge'),
                    icon: Award,
                    onClick: () => setUI({ showChallengeModal: true }),
                    className:
                      'gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg flex items-center gap-2'
                  }
                ]}
              />

              <div className="mb-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPushupsSubView('sessions')}
                  className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                    pushupsSubView === 'sessions'
                      ? 'border-[#0F5C45]/80 bg-[#0F5C45]/25 text-white'
                      : 'border-[#0F4C5C]/45 bg-black text-teal-100 hover:border-[#0F5C45]/50'
                  }`}
                >
                  {t('endurance.subViews.sessionsAndChallenges')}
                </button>
                <button
                  type="button"
                  onClick={() => setPushupsSubView('trophies')}
                  className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                    pushupsSubView === 'trophies'
                      ? 'border-sky-500/70 bg-sky-500/15 text-sky-100'
                      : 'border-[#0F4C5C]/45 bg-black text-teal-100 hover:border-sky-500/40'
                  }`}
                >
                  {t('endurance.subViews.trophies')}
                </button>
                <button
                  type="button"
                  onClick={() => setPushupsSubView('calendar')}
                  className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                    pushupsSubView === 'calendar'
                      ? 'border-amber-500/70 bg-amber-500/10 text-amber-100'
                      : 'border-[#0F4C5C]/45 bg-black text-teal-100 hover:border-amber-500/40'
                  }`}
                >
                  {t('endurance.subViews.calendar')}
                </button>
              </div>

              {pushupsSubView === 'trophies' ? (
                <PushupTrophiesPanel sessions={sessions.pushups} />
              ) : pushupsSubView === 'calendar' ? (
                <DefisDisciplineCalendarPanel
                  activityKind="pushups"
                  sessions={sessions.pushups}
                  onEditSession={(type, id) => editSession(type, id)}
                />
              ) : (
                <>
              <div className="mb-6 rounded-xl border border-[#0F4C5C]/40 bg-slate-950/40 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-teal-200/90">
                  {t('endurance.pushupPresets.title')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {PUSHUP_CHALLENGE_PRESET_DEFS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addPresetPushupChallenge(p.id)}
                      className="rounded-lg border border-slate-600/60 bg-black/50 px-3 py-1.5 text-left text-[11px] text-slate-200 transition hover:border-emerald-500/50 hover:text-white"
                    >
                      {t(p.labelKey)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rappel défis actifs */}
              {activeChallenges.length > 0 && (
                <div className="mb-8 rounded-2xl border-2 border-[#0F4C5C]/55 bg-black p-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-[#0F4C5C]/25 p-3">
                      <Award className="h-6 w-6 text-sky-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg mb-2">
                        {activeChallenges.length === 1
                          ? t('endurance.challenges.active', { count: activeChallenges.length })
                          : t('endurance.challenges.activePlural', { count: activeChallenges.length })}
                      </h3>
                      <p className="text-sm text-teal-100/90 leading-relaxed">
                        {t(
                          'endurance.challenges.reminderBody',
                          'Ouvre l’onglet de chaque activité concernée pour voir le détail de tes défis.'
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Formulaire de session */}
              {ui.showSessionForm && (
                <div className="bg-black border-2 border-[#0F4C5C]/70 rounded-2xl p-8 mb-8 shadow-2xl shadow-black/40">
                  <h3 className="text-2xl font-bold text-white mb-6">{t('endurance.actions.newSession')}</h3>
                  <EnduranceSessionForm
                    activityType="pushups"
                    formState={sessionForm}
                    setFormState={setSessionForm}
                  />
                  <div className="mt-6 flex flex-wrap justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setUI({ showSessionForm: false })}
                      className="gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg"
                    >
                      {t('endurance.actions.cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={addPushupSession}
                      className="gradient-button-premium gradient-button-premium-md rounded-lg"
                    >
                      {t('endurance.actions.save')}
                    </button>
                  </div>
                </div>
              )}

              {/* Liste des défis */}
              {uniqueChallenges.filter(c => c.activityType === 'pushups').length > 0 && (
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-white mb-6">{t('endurance.challenges.title')}</h3>
                  <div className="grid gap-4">
                    {uniqueChallenges.filter(c => c.activityType === 'pushups').map((challenge, idx) => (
                      <div key={`pushups-challenge-${challenge.id}-${idx}`} className="bg-black border-2 border-[#0F4C5C]/70 rounded-2xl p-6 hover:border-[#0F5C45]/90 transition-all">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Award className="w-5 h-5 text-sky-400" />
                              <h4 className="font-bold text-xl text-white">{challenge.name}</h4>
                            </div>
                            <div className="space-y-1 text-slate-400 text-sm">
                              <p>
                                {challenge.type === 'ponctuel' && t('endurance.challenges.details.targetDate', { date: challenge.targetDate })}
                                {challenge.type === 'recurrent' && (challenge.frequency === 'daily' 
                                  ? t('endurance.challenges.details.recurrentDaily')
                                  : t('endurance.challenges.details.recurrentWeekly')
                                )}
                                {challenge.type === 'periode' && t('endurance.challenges.details.period', { startDate: challenge.startDate, endDate: challenge.endDate })}
                                {challenge.type === 'pushups_cumul' &&
                                  t('endurance.challenges.details.period', { startDate: challenge.startDate, endDate: challenge.endDate })}
                              </p>
                              {challenge.type === 'pushups_cumul' && (
                                <p className="text-teal-200/95 text-sm">
                                  {t('endurance.challenges.details.cumulProgress', {
                                    current: sumPushupRepsInChallengeWindow(challenge, sessions.pushups || []),
                                    goal: challenge.goalTotalCount ?? 0
                                  })}
                                </p>
                              )}
                              <p className="text-sky-300">
                                {challenge.type === 'pushups_cumul'
                                  ? t('endurance.challenges.details.goalPushups', { count: challenge.goalTotalCount ?? 0 })
                                  : challenge.goalCount && challenge.goalDuration
                                    ? t('endurance.challenges.details.goalPushupsWithDuration', {
                                        count: challenge.goalCount,
                                        duration: challenge.goalDuration
                                      })
                                    : challenge.goalCount
                                      ? t('endurance.challenges.details.goalPushups', { count: challenge.goalCount })
                                      : challenge.goalDuration
                                        ? `${challenge.goalDuration} min`
                                        : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-4 py-2 rounded-xl text-sm font-medium ${
                              challenge.status === 'active' 
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            }`}>
                              {challenge.status === 'active' ? t('endurance.challenges.status.active') : t('endurance.challenges.status.completed')}
                            </span>
                            <button
                              type="button"
                              onClick={() => editChallenge(challenge.id)}
                              className="gradient-button-premium gradient-button-premium-sm gradient-button-premium-variant rounded-lg p-2"
                              title={t('endurance.session.editChallenge')}
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                // ✅ FIX DOUBLONS : Trouver l'index réel dans le tableau complet
                                const realIndex = challenges.findIndex(c => c === challenge);
                                deleteChallenge(challenge.id, realIndex);
                              }}
                              className="gradient-button-premium gradient-button-premium-sm rounded-lg p-2"
                              title={t('endurance.session.deleteChallenge')}
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Historique */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">{t('endurance.history.title')}</h3>
                <div className="bg-black border border-[#0F4C5C]/50 rounded-2xl overflow-hidden">
                  {sessions.pushups.length === 0 ? (
                    <div className="p-12 text-center">
                      <Dumbbell className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400 text-lg">{t('endurance.history.noSessions')}</p>
                      <p className="text-slate-500 text-sm mt-2">{t('endurance.history.noSessionsHint')}</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#0F4C5C]/45">
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Date</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Heure</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">{t('endurance.table.headers.pushups')}</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Durée</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Notes</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sessions.pushups.sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time)).map((session, idx) => {
                            // ✅ FIX DOUBLONS : Trouver l'index réel dans le tableau non-trié pour la suppression
                            const originalIndex = sessions.pushups.findIndex(s => s === session);
                            return (
                            <tr 
                              key={`pushups-${session.id}-${idx}`} 
                              className="border-b border-[#0F4C5C]/25 hover:bg-[#0F4C5C]/12 transition-colors"
                            >
                              <td className="px-6 py-4 text-slate-300">{session.date}</td>
                              <td className="px-6 py-4 text-slate-300">{session.time}</td>
                              <td className="px-6 py-4">
                                <span className="text-white font-bold text-lg">{session.count}</span>
                              </td>
                              <td className="px-6 py-4 text-slate-300">{session.duration} min</td>
                              <td className="px-6 py-4 text-slate-400 text-sm">{session.notes || '-'}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  {session.validatedChallenges?.length > 0 && (
                                    <span className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-400 px-3 py-1 rounded-lg text-xs font-medium">
                                      {t('endurance.challenges.validated')}
                                    </span>
                                  )}
                                  <button
                                    onClick={() => editSession('pushups', session.id)}
                                    className="gradient-button-premium gradient-button-premium-sm gradient-button-premium-variant rounded-lg p-2"
                                    title={t('endurance.session.edit')}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => deletePushupSession(session.id, originalIndex)}
                                    className="gradient-button-premium gradient-button-premium-sm rounded-lg p-2"
                                    title={t('endurance.session.delete')}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
                </>
              )}
            </>
          )}

          {/* SECTION NATATION */}
          {activeTab === 'swimming' && (
            <>
              <EnduranceSectionHeader
                title={t('endurance.sections.swimming.title')}
                subtitle={t('endurance.sections.swimming.subtitle')}
                actions={[
                  {
                    key: 'new-swimming-session',
                    label: t('endurance.actions.newSession'),
                    icon: Plus,
                    onClick: () => setUI({ showSessionForm: !ui.showSessionForm }),
                    className:
                      'gradient-button-premium gradient-button-premium-md rounded-lg flex items-center gap-2'
                  },
                  {
                    key: 'create-swimming-challenge',
                    label: t('endurance.actions.createChallenge'),
                    icon: Award,
                    onClick: () => setUI({ showChallengeModal: true }),
                    className:
                      'gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg flex items-center gap-2'
                  }
                ]}
              />

              {activeChallenges.length > 0 && (
                <div className="mb-8 rounded-2xl border-2 border-[#0F4C5C]/55 bg-black p-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-[#0F4C5C]/25 p-3">
                      <Award className="h-6 w-6 text-sky-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg mb-2">
                        {activeChallenges.length === 1 
                          ? t('endurance.challenges.active', { count: activeChallenges.length })
                          : t('endurance.challenges.activePlural', { count: activeChallenges.length })
                        }
                      </h3>
                      <p className="text-sm text-teal-100/90 leading-relaxed">
                        {t(
                          'endurance.challenges.reminderBody',
                          'Ouvre l’onglet de chaque activité concernée pour voir le détail de tes défis.'
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {ui.showSessionForm && (
                <div className="bg-black border-2 border-[#0F4C5C]/70 rounded-2xl p-8 mb-8 shadow-2xl shadow-black/40">
                  <h3 className="text-2xl font-bold text-white mb-6">{t('endurance.sections.swimming.newSession')}</h3>
                  <EnduranceSessionForm
                    activityType="swimming"
                    formState={swimmingForm}
                    setFormState={setSwimmingForm}
                  />

                  <SwimmingSessionExtras
                    laps={swimmingForm.laps}
                    onAddLap={addLap}
                    onRemoveLap={removeLap}
                    onUpdateLap={updateLap}
                    heartRate={swimmingForm.heartRate}
                    calories={swimmingForm.calories}
                    pace100m={swimmingForm.pace100m}
                    onChangeHeartRate={(value) => setSwimmingForm(prev => ({ ...prev, heartRate: value }))}
                    onChangeCalories={(value) => setSwimmingForm(prev => ({ ...prev, calories: value }))}
                    onChangePace100m={(value) => setSwimmingForm(prev => ({ ...prev, pace100m: value }))}
                  />

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => {
                        resetSwimmingForm();
                        setUI({ showSessionForm: false });
                      }}
                      className="gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg"
                    >
                      {t('endurance.actions.cancel')}
                    </button>
                    <button
                      onClick={addSwimmingSession}
                      className="gradient-button-premium gradient-button-premium-md rounded-lg"
                    >
                      {t('endurance.actions.save')}
                    </button>
                  </div>
                </div>
              )}

              {challenges.filter(c => c.activityType === 'swimming').length > 0 && (
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-white mb-6">{t('endurance.challenges.title')}</h3>
                  <div className="grid gap-4">
                    {challenges.filter(c => c.activityType === 'swimming').map((challenge, idx) => (
                      <div key={`swimming-challenge-${challenge.id}-${idx}`} className="bg-black border-2 border-[#0F4C5C]/70 rounded-2xl p-6 hover:border-[#0F5C45]/90 transition-all">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Award className="w-5 h-5 text-sky-400" />
                              <h4 className="font-bold text-xl text-white">{challenge.name}</h4>
                            </div>
                            <div className="space-y-1 text-slate-400 text-sm">
                              <p>
                                {challenge.type === 'ponctuel' && t('endurance.challenges.details.targetDate', { date: challenge.targetDate })}
                                {challenge.type === 'recurrent' && (challenge.frequency === 'daily' 
                                  ? t('endurance.challenges.details.recurrentDaily')
                                  : t('endurance.challenges.details.recurrentWeekly')
                                )}
                                {challenge.type === 'periode' && t('endurance.challenges.details.period', { startDate: challenge.startDate, endDate: challenge.endDate })}
                              </p>
                              <p className="text-sky-300">
                                {challenge.goalDistance && challenge.goalTime
                                  ? t('endurance.challenges.details.goalSwimmingWithTime', { distance: challenge.goalDistance, time: challenge.goalTime })
                                  : challenge.goalDistance
                                  ? t('endurance.challenges.details.goalSwimming', { distance: challenge.goalDistance })
                                  : challenge.goalTime
                                  ? `${challenge.goalTime} min`
                                  : ''
                                }
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-4 py-2 rounded-xl text-sm font-medium ${
                              challenge.status === 'active' 
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            }`}>
                              {challenge.status === 'active' ? t('endurance.challenges.status.active') : t('endurance.challenges.status.completed')}
                            </span>
                            <button
                              type="button"
                              onClick={() => editChallenge(challenge.id)}
                              className="gradient-button-premium gradient-button-premium-sm gradient-button-premium-variant rounded-lg p-2"
                              title={t('endurance.session.editChallenge')}
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                // ✅ FIX DOUBLONS : Trouver l'index réel dans le tableau complet
                                const realIndex = challenges.findIndex(c => c === challenge);
                                deleteChallenge(challenge.id, realIndex);
                              }}
                              className="gradient-button-premium gradient-button-premium-sm rounded-lg p-2"
                              title={t('endurance.session.deleteChallenge')}
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-2xl font-bold text-white mb-6">{t('endurance.history.title')}</h3>
                <div className="bg-black border border-[#0F4C5C]/50 rounded-2xl overflow-hidden">
                  {sessions.swimming.length === 0 ? (
                    <div className="p-12 text-center">
                      <Waves className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400 text-lg">{t('endurance.history.noSessions')}</p>
                      <p className="text-slate-500 text-sm mt-2">{t('endurance.history.noSessionsHint')}</p>
                    </div>
                  ) : (
                    <div className="space-y-4 p-6">
                      {sessions.swimming.sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time)).map((session, idx) => {
                        const originalIndex = sessions.swimming.findIndex(s => s === session);
                        return (
                        <div key={`swimming-${session.id}-${idx}`} className="bg-black border border-[#0F4C5C]/45 rounded-xl p-6 hover:border-[#0F5C45]/45 transition-all">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-white font-bold text-lg">{session.date}</span>
                                <span className="text-slate-400">{session.time}</span>
                                <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg text-sm">
                                  {session.swimType ? (session.swimType.charAt(0).toUpperCase() + session.swimType.slice(1)) : t('endurance.swimming.details.swimType')}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="text-slate-400">{t('endurance.swimming.details.totalDistance')}</span>
                                  <span className="text-white font-bold ml-2">{session.totalDistance}m</span>
                                </div>
                                <div>
                                  <span className="text-slate-400">{t('endurance.swimming.details.totalTime')}</span>
                                  <span className="text-white font-bold ml-2">
                                    {(() => {
                                      // totalTime est en secondes
                                      const totalSeconds = typeof session.totalTime === 'number' ? session.totalTime : 
                                        (typeof session.totalTime === 'string' ? parseFloat(session.totalTime) : 0);
                                      const minutes = Math.floor(totalSeconds / 60);
                                      const seconds = Math.floor(totalSeconds % 60);
                                      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
                                    })()}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-400">{t('endurance.swimming.details.avgPace')}</span>
                                  <span className="text-white font-bold ml-2">{session.avgPace}s/25m</span>
                                </div>
                                {session.heartRate && (
                                  <div>
                                    <span className="text-slate-400">{t('endurance.swimming.details.heartRate')}</span>
                                    <span className="text-white font-bold ml-2">{session.heartRate} bpm</span>
                                  </div>
                                )}
                                {session.calories && (
                                  <div>
                                    <span className="text-slate-400">{t('endurance.swimming.details.calories')}</span>
                                    <span className="text-white font-bold ml-2">
                                      {typeof session.calories === 'object' 
                                        ? (session.calories.total || session.calories.active || 0) 
                                        : session.calories} kcal
                                    </span>
                                  </div>
                                )}
                                {session.pace100m && (
                                  <div>
                                    <span className="text-slate-400">{t('endurance.swimming.details.pace100m')}</span>
                                    <span className="text-white font-bold ml-2">{session.pace100m}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {session.validatedChallenges?.length > 0 && (
                                <span className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-400 px-3 py-1 rounded-lg text-xs font-medium">
                                  ✓ Défi validé
                                </span>
                              )}
                              <button
                                onClick={() => editSession('swimming', session.id)}
                                className="gradient-button-premium gradient-button-premium-sm gradient-button-premium-variant rounded-lg p-2"
                                title="Modifier la session"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteSwimmingSession(session.id, originalIndex)}
                                className="gradient-button-premium gradient-button-premium-sm rounded-lg p-2"
                                title="Supprimer la session"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          {session.laps && Array.isArray(session.laps) && session.laps.length > 0 && (
                            <div className="border-t border-[#0F4C5C]/45 pt-4">
                              <h5 className="text-slate-400 text-sm mb-3">{t('endurance.swimming.details.title')}</h5>
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                {session.laps.map((lap, idx) => (
                                  <div key={idx} className="bg-slate-800/50 px-3 py-2 rounded-lg">
                                    <span className="text-slate-500 text-xs">#{idx + 1}</span>
                                    <span className="text-white font-medium ml-2">{lap.distance}m</span>
                                    <span className="text-slate-400 ml-2 text-sm">{lap.time}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {session.notes && (
                            <div className="mt-4 text-slate-400 text-sm">
                              <span className="font-medium">{t('endurance.swimming.details.notes')}</span> {session.notes}
                            </div>
                          )}
                        </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* SECTION CORDE À SAUTER */}
          {activeTab === 'jumprope' && (
            <>
              <EnduranceSectionHeader
                title={t('endurance.sections.jumprope.title')}
                subtitle={t('endurance.sections.jumprope.subtitle')}
                actions={[
                  {
                    key: 'new-jumprope-session',
                    label: t('endurance.actions.newSession'),
                    icon: Plus,
                    onClick: () => setUI({ showSessionForm: !ui.showSessionForm }),
                    className:
                      'gradient-button-premium gradient-button-premium-md rounded-lg flex items-center gap-2'
                  },
                  {
                    key: 'create-jumprope-challenge',
                    label: t('endurance.actions.createChallenge'),
                    icon: Award,
                    onClick: () => setUI({ showChallengeModal: true }),
                    className:
                      'gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg flex items-center gap-2'
                  }
                ]}
              />

              <div className="mb-6 rounded-xl border border-[#0F4C5C]/40 bg-slate-950/40 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-teal-200/90">
                  {t('endurance.jumpropePresets.title')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {JUMPROPE_CHALLENGE_PRESET_DEFS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addPresetJumpropeChallenge(p.id)}
                      className="rounded-lg border border-slate-600/60 bg-black/50 px-3 py-1.5 text-left text-[11px] text-slate-200 transition hover:border-emerald-500/50 hover:text-white"
                    >
                      {t(p.labelKey)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setJumpropeSubView('sessions')}
                  className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                    jumpropeSubView === 'sessions'
                      ? 'border-[#0F5C45]/80 bg-[#0F5C45]/25 text-white'
                      : 'border-[#0F4C5C]/45 bg-black text-teal-100 hover:border-[#0F5C45]/50'
                  }`}
                >
                  {t('endurance.subViews.sessionsAndChallenges')}
                </button>
                <button
                  type="button"
                  onClick={() => setJumpropeSubView('trophies')}
                  className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                    jumpropeSubView === 'trophies'
                      ? 'border-sky-500/70 bg-sky-500/15 text-sky-100'
                      : 'border-[#0F4C5C]/45 bg-black text-teal-100 hover:border-sky-500/40'
                  }`}
                >
                  {t('endurance.subViews.trophies')}
                </button>
                <button
                  type="button"
                  onClick={() => setJumpropeSubView('calendar')}
                  className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                    jumpropeSubView === 'calendar'
                      ? 'border-amber-500/70 bg-amber-500/10 text-amber-100'
                      : 'border-[#0F4C5C]/45 bg-black text-teal-100 hover:border-amber-500/40'
                  }`}
                >
                  {t('endurance.subViews.calendar')}
                </button>
              </div>

              {jumpropeSubView === 'trophies' ? (
                <SimpleEnduranceTrophiesPanel
                  activityType="jumprope"
                  sessions={sessions.jumprope}
                  title="Trophées — Corde à sauter"
                />
              ) : jumpropeSubView === 'calendar' ? (
                <DefisDisciplineCalendarPanel
                  activityKind="jumprope"
                  sessions={sessions.jumprope}
                  onEditSession={(type, id) => editSession(type, id)}
                />
              ) : (
                <>
              {/* Rappel défis actifs */}
              {activeChallenges.length > 0 && (
                <div className="mb-8 rounded-2xl border-2 border-[#0F4C5C]/55 bg-black p-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-[#0F4C5C]/25 p-3">
                      <Award className="h-6 w-6 text-sky-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg mb-2">
                        {activeChallenges.length === 1
                          ? t('endurance.challenges.toComplete', { count: activeChallenges.length })
                          : t('endurance.challenges.toCompletePlural', { count: activeChallenges.length })
                        }
                      </h3>
                      <p className="text-sm text-teal-100/90 leading-relaxed">
                        {t(
                          'endurance.challenges.reminderBody',
                          'Ouvre l’onglet de chaque activité concernée pour voir le détail de tes défis.'
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {ui.showSessionForm && (
                <div className="bg-black border-2 border-[#0F4C5C]/70 rounded-2xl p-8 mb-8 shadow-2xl shadow-black/40">
                  <h3 className="text-2xl font-bold text-white mb-6">{t('endurance.sections.jumprope.newSession')}</h3>
                  <EnduranceSessionForm
                    activityType="jumprope"
                    formState={jumpropeForm}
                    setFormState={setJumpropeForm}
                  />

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => setUI({ showSessionForm: false })}
                      className="gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg"
                    >
                      {t('endurance.actions.cancel')}
                    </button>
                    <button
                      onClick={addJumpropeSession}
                      className="gradient-button-premium gradient-button-premium-md rounded-lg"
                    >
                      {t('endurance.actions.save')}
                    </button>
                    <button
                      onClick={() => {
                        addJumpropeSession();
                        setJumpropeForm({ ...jumpropeForm, sessionNumber: parseInt(jumpropeForm.sessionNumber) + 1 });
                      }}
                      className="gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg"
                    >
                      {t('endurance.actions.saveAndCreateAnother')}
                    </button>
                  </div>
                </div>
              )}

              {/* Liste des défis */}
              {challenges.filter(c => c.activityType === 'jumprope').length > 0 && (
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-white mb-6">{t('endurance.challenges.title')}</h3>
                  <div className="grid gap-4">
                    {challenges.filter(c => c.activityType === 'jumprope').map((challenge, idx) => (
                      <div key={`jumprope-challenge-${challenge.id}-${idx}`} className="bg-black border-2 border-[#0F4C5C]/70 rounded-2xl p-6 hover:border-[#0F5C45]/90 transition-all">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Award className="w-5 h-5 text-sky-400" />
                              <h4 className="font-bold text-xl text-white">{challenge.name}</h4>
                              <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                challenge.status === 'active' 
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              }`}>
                                {challenge.status === 'active' ? t('endurance.challenges.status.active') : t('endurance.challenges.status.completed')}
                              </span>
                            </div>
                            <div className="space-y-1 text-slate-400 text-sm">
                              <p>
                                {challenge.type === 'ponctuel' && t('endurance.challenges.details.targetDate', { date: challenge.targetDate })}
                                {challenge.type === 'recurrent' && (challenge.frequency === 'daily' 
                                  ? t('endurance.challenges.details.recurrentDaily')
                                  : t('endurance.challenges.details.recurrentWeekly')
                                )}
                                {challenge.type === 'periode' && t('endurance.challenges.details.period', { startDate: challenge.startDate, endDate: challenge.endDate })}
                              </p>
                              <p className="text-sky-300">
                                {(() => {
                                  const jumps = challenge.goalJumps ?? challenge.goalCount;
                                  if (challenge.goalDuration && jumps)
                                    return t('endurance.challenges.details.goalJumpropeOrJumps', {
                                      duration: challenge.goalDuration,
                                      jumps
                                    });
                                  if (challenge.goalDuration)
                                    return t('endurance.challenges.details.goalJumprope', { duration: challenge.goalDuration });
                                  if (jumps) return `${jumps} sauts`;
                                  return '';
                                })()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => editChallenge(challenge.id)}
                              className="gradient-button-premium gradient-button-premium-sm gradient-button-premium-variant rounded-lg p-2"
                              title={t('endurance.session.editChallenge')}
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                // ✅ FIX DOUBLONS : Trouver l'index réel dans le tableau complet
                                const realIndex = challenges.findIndex(c => c === challenge);
                                deleteChallenge(challenge.id, realIndex);
                              }}
                              className="gradient-button-premium gradient-button-premium-sm rounded-lg p-2"
                              title={t('endurance.session.deleteChallenge')}
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Historique */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">{t('endurance.history.title')}</h3>
                <div className="bg-black border border-[#0F4C5C]/50 rounded-2xl overflow-hidden">
                  {sessions.jumprope.length === 0 ? (
                    <div className="p-12 text-center">
                      <Activity className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400 text-lg">{t('endurance.history.noSessions')}</p>
                      <p className="text-slate-500 text-sm mt-2">{t('endurance.history.noSessionsHint')}</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#0F4C5C]/45">
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Date</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Heure</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Durée</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">{t('endurance.table.headers.type')}</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">{t('endurance.table.headers.jumps')}</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">{t('endurance.table.headers.session')}</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Notes</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sessions.jumprope.sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time)).map((session, idx) => {
                            const originalIndex = sessions.jumprope.findIndex(s => s === session);
                            return (
                            <tr 
                              key={`jumprope-${session.id}-${idx}`} 
                              className={`border-b border-[#0F4C5C]/25 hover:bg-[#0F4C5C]/12 transition-colors ${idx % 2 === 0 ? 'bg-slate-800/20' : 'bg-slate-800/10'}`}
                            >
                              <td className="px-6 py-4 text-slate-300">{session.date}</td>
                              <td className="px-6 py-4 text-slate-300">{session.time}</td>
                              <td className="px-6 py-4">
                                <span className="text-white font-bold text-lg">{session.duration}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg text-xs">
                                  {session.type ? (session.type.charAt(0).toUpperCase() + session.type.slice(1)) : t('endurance.menu.jumprope')}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-slate-300">{session.jumps || '-'}</td>
                              <td className="px-6 py-4 text-slate-300">#{session.sessionNumber}</td>
                              <td className="px-6 py-4 text-slate-400 text-sm">{session.notes || '-'}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  {session.validatedChallenges?.length > 0 && (
                                    <span className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-400 px-3 py-1 rounded-lg text-xs font-medium">
                                      {t('endurance.challenges.validated')}
                                    </span>
                                  )}
                                  <button
                                    onClick={() => editSession('jumprope', session.id)}
                                    className="gradient-button-premium gradient-button-premium-sm gradient-button-premium-variant rounded-lg p-2"
                                    title={t('endurance.session.edit')}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => deleteJumpropeSession(session.id, originalIndex)}
                                    className="gradient-button-premium gradient-button-premium-sm rounded-lg p-2"
                                    title={t('endurance.session.delete')}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
                </>
              )}
            </>
          )}

          {/* SECTION GAINAGE */}
          {activeTab === 'gainage' && (
            <>
              <EnduranceSectionHeader
                title={t('endurance.sections.gainage.title')}
                subtitle={t('endurance.sections.gainage.subtitle')}
                actions={[
                  {
                    key: 'new-gainage-session',
                    label: t('endurance.actions.newSession'),
                    icon: Plus,
                    onClick: () => setUI({ showSessionForm: !ui.showSessionForm }),
                    className:
                      'gradient-button-premium gradient-button-premium-md rounded-lg flex items-center gap-2'
                  },
                  {
                    key: 'past-gainage-session',
                    label: t('endurance.actions.pastData'),
                    icon: Calendar,
                    onClick: () => setUI({ showSessionForm: !ui.showSessionForm, allowPastDates: true }),
                    className:
                      'gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg flex items-center gap-2'
                  },
                  {
                    key: 'create-gainage-challenge',
                    label: t('endurance.actions.createChallenge'),
                    icon: Award,
                    onClick: () => setUI({ showChallengeModal: true }),
                    className:
                      'gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg flex items-center gap-2'
                  }
                ]}
              />

              <div className="mb-6 rounded-xl border border-[#0F4C5C]/40 bg-slate-950/40 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-teal-200/90">
                  {t('endurance.gainagePresets.title')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {GAINAGE_CHALLENGE_PRESET_DEFS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addPresetGainageChallenge(p.id)}
                      className="rounded-lg border border-slate-600/60 bg-black/50 px-3 py-1.5 text-left text-[11px] text-slate-200 transition hover:border-emerald-500/50 hover:text-white"
                    >
                      {t(p.labelKey)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setGainageSubView('sessions')}
                  className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                    gainageSubView === 'sessions'
                      ? 'border-[#0F5C45]/80 bg-[#0F5C45]/25 text-white'
                      : 'border-[#0F4C5C]/45 bg-black text-teal-100 hover:border-[#0F5C45]/50'
                  }`}
                >
                  {t('endurance.subViews.sessionsAndChallenges')}
                </button>
                <button
                  type="button"
                  onClick={() => setGainageSubView('trophies')}
                  className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                    gainageSubView === 'trophies'
                      ? 'border-sky-500/70 bg-sky-500/15 text-sky-100'
                      : 'border-[#0F4C5C]/45 bg-black text-teal-100 hover:border-sky-500/40'
                  }`}
                >
                  {t('endurance.subViews.trophies')}
                </button>
                <button
                  type="button"
                  onClick={() => setGainageSubView('calendar')}
                  className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                    gainageSubView === 'calendar'
                      ? 'border-amber-500/70 bg-amber-500/10 text-amber-100'
                      : 'border-[#0F4C5C]/45 bg-black text-teal-100 hover:border-amber-500/40'
                  }`}
                >
                  {t('endurance.subViews.calendar')}
                </button>
              </div>

              {gainageSubView === 'trophies' ? (
                <SimpleEnduranceTrophiesPanel
                  activityType="gainage"
                  sessions={sessions.gainage}
                  title="Trophées — Gainage"
                />
              ) : gainageSubView === 'calendar' ? (
                <DefisDisciplineCalendarPanel
                  activityKind="gainage"
                  sessions={sessions.gainage}
                  onEditSession={(type, id) => editSession(type, id)}
                />
              ) : (
                <>
              {activeChallenges.length > 0 && (
                <div className="mb-8 rounded-2xl border-2 border-[#0F4C5C]/55 bg-black p-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-[#0F4C5C]/25 p-3">
                      <Award className="h-6 w-6 text-sky-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg mb-2">
                        {activeChallenges.length === 1
                          ? t('endurance.challenges.active', { count: activeChallenges.length })
                          : t('endurance.challenges.activePlural', { count: activeChallenges.length })
                        }
                      </h3>
                      <p className="text-sm text-teal-100/90 leading-relaxed">
                        {t(
                          'endurance.challenges.reminderBody',
                          'Ouvre l’onglet de chaque activité concernée pour voir le détail de tes défis.'
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {ui.showSessionForm && (
                <div className="bg-black border-2 border-[#0F4C5C]/70 rounded-2xl p-8 mb-8 shadow-2xl shadow-black/40">
                  <h3 className="text-2xl font-bold text-white mb-6">{t('endurance.actions.newSession')}</h3>
                  <EnduranceSessionForm
                    activityType="gainage"
                    formState={gainageForm}
                    setFormState={setGainageForm}
                  />
                  <div className="mt-6 flex flex-wrap justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setUI({ showSessionForm: false })}
                      className="gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg"
                    >
                      {t('endurance.actions.cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={addGainageSession}
                      className="gradient-button-premium gradient-button-premium-md rounded-lg"
                    >
                      {t('endurance.actions.save')}
                    </button>
                  </div>
                </div>
              )}

              {uniqueChallenges.filter((c) => c.activityType === 'gainage').length > 0 && (
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-white mb-6">{t('endurance.challenges.title')}</h3>
                  <div className="grid gap-4">
                    {uniqueChallenges.filter((c) => c.activityType === 'gainage').map((challenge, idx) => (
                      <div
                        key={`gainage-challenge-${challenge.id}-${idx}`}
                        className="bg-black border-2 border-[#0F4C5C]/70 rounded-2xl p-6 hover:border-[#0F5C45]/90 transition-all"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Award className="w-5 h-5 text-sky-400" />
                              <h4 className="font-bold text-xl text-white">{challenge.name}</h4>
                            </div>
                            <div className="space-y-1 text-slate-400 text-sm">
                              <p>
                                {challenge.type === 'ponctuel' &&
                                  t('endurance.challenges.details.targetDate', { date: challenge.targetDate })}
                                {challenge.type === 'recurrent' &&
                                  (challenge.frequency === 'daily'
                                    ? t('endurance.challenges.details.recurrentDaily')
                                    : t('endurance.challenges.details.recurrentWeekly'))}
                                {challenge.type === 'periode' &&
                                  t('endurance.challenges.details.period', {
                                    startDate: challenge.startDate,
                                    endDate: challenge.endDate
                                  })}
                              </p>
                              <p className="text-sky-300">
                                {challenge.goalCount && challenge.goalDuration
                                  ? t('endurance.challenges.details.goalGainageWithDuration', {
                                      seconds: challenge.goalCount,
                                      duration: challenge.goalDuration
                                    })
                                  : challenge.goalCount
                                    ? t('endurance.challenges.details.goalGainageSeconds', {
                                        seconds: challenge.goalCount
                                      })
                                    : challenge.goalDuration
                                      ? `${challenge.goalDuration} min max`
                                      : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-4 py-2 rounded-xl text-sm font-medium ${
                                challenge.status === 'active'
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              }`}
                            >
                              {challenge.status === 'active'
                                ? t('endurance.challenges.status.active')
                                : t('endurance.challenges.status.completed')}
                            </span>
                            <button
                              type="button"
                              onClick={() => editChallenge(challenge.id)}
                              className="gradient-button-premium gradient-button-premium-sm gradient-button-premium-variant rounded-lg p-2"
                              title={t('endurance.session.editChallenge')}
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const realIndex = challenges.findIndex((c) => c === challenge);
                                deleteChallenge(challenge.id, realIndex);
                              }}
                              className="gradient-button-premium gradient-button-premium-sm rounded-lg p-2"
                              title={t('endurance.session.deleteChallenge')}
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-2xl font-bold text-white mb-6">{t('endurance.history.title')}</h3>
                <div className="bg-black border border-[#0F4C5C]/50 rounded-2xl overflow-hidden">
                  {sessions.gainage.length === 0 ? (
                    <div className="p-12 text-center">
                      <Anchor className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400 text-lg">{t('endurance.history.noSessions')}</p>
                      <p className="text-slate-500 text-sm mt-2">{t('endurance.history.noSessionsHint')}</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#0F4C5C]/45">
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Date</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Heure</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                              {t('endurance.table.headers.gainageSeconds')}
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Durée</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Notes</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sessions.gainage
                            .sort((a, b) => new Date(`${b.date} ${b.time}`) - new Date(`${a.date} ${a.time}`))
                            .map((session, idx) => {
                              const originalIndex = sessions.gainage.findIndex((s) => s === session);
                              return (
                                <tr
                                  key={`gainage-${session.id}-${idx}`}
                                  className="border-b border-[#0F4C5C]/25 hover:bg-[#0F4C5C]/12 transition-colors"
                                >
                                  <td className="px-6 py-4 text-slate-300">{session.date}</td>
                                  <td className="px-6 py-4 text-slate-300">{session.time}</td>
                                  <td className="px-6 py-4">
                                    <span className="text-white font-bold text-lg">{session.count}</span>
                                  </td>
                                  <td className="px-6 py-4 text-slate-300">{session.duration} min</td>
                                  <td className="px-6 py-4 text-slate-400 text-sm">{session.notes || '-'}</td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                      {session.validatedChallenges?.length > 0 && (
                                        <span className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-400 px-3 py-1 rounded-lg text-xs font-medium">
                                          {t('endurance.challenges.validated')}
                                        </span>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => editSession('gainage', session.id)}
                                        className="gradient-button-premium gradient-button-premium-sm gradient-button-premium-variant rounded-lg p-2"
                                        title={t('endurance.session.edit')}
                                      >
                                        <Edit className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => deleteGainageSession(session.id, originalIndex)}
                                        className="gradient-button-premium gradient-button-premium-sm rounded-lg p-2"
                                        title={t('endurance.session.delete')}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
                </>
              )}
            </>
          )}

          {/* SECTION COURSE */}
          {activeTab === 'running' && (
            <>
              <EnduranceSectionHeader
                title={t('endurance.sections.running.title')}
                subtitle={t('endurance.sections.running.subtitle')}
                actions={[
                  {
                    key: 'new-running-session',
                    label: t('endurance.actions.newSession'),
                    icon: Plus,
                    onClick: () => setUI({ showSessionForm: !ui.showSessionForm }),
                    className:
                      'inline-flex items-center gap-2 rounded-lg border border-[#0F4C5C]/60 bg-black px-4 py-2 text-sm font-medium text-teal-100 shadow-sm transition hover:border-[#0F5C45]/70 hover:bg-[#0F4C5C]/15'
                  },
                  {
                    key: 'create-running-challenge',
                    label: t('endurance.actions.createChallenge'),
                    icon: Award,
                    onClick: () => setUI({ showChallengeModal: true }),
                    className:
                      'inline-flex items-center gap-2 rounded-lg border border-[#0F5C45]/80 bg-[#0F5C45]/25 px-4 py-2 text-sm font-medium text-white shadow-md transition hover:bg-[#0F5C45]/40'
                  }
                ]}
              />

              <div className="mb-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setRunningSubView('sessions')}
                  className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                    runningSubView === 'sessions'
                      ? 'border-sky-500/70 bg-sky-500/15 text-sky-100'
                      : 'border-[#0F4C5C]/45 bg-black text-teal-100 hover:border-sky-500/40'
                  }`}
                >
                  {t('endurance.subViews.sessionsAndChallenges')}
                </button>
                <button
                  type="button"
                  onClick={() => setRunningSubView('trophies')}
                  className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                    runningSubView === 'trophies'
                      ? 'border-sky-500/70 bg-sky-500/15 text-sky-100'
                      : 'border-[#0F4C5C]/45 bg-black text-teal-100 hover:border-sky-500/40'
                  }`}
                >
                  {t('endurance.subViews.trophies')}
                </button>
                <button
                  type="button"
                  onClick={() => setRunningSubView('calendar')}
                  className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                    runningSubView === 'calendar'
                      ? 'border-amber-500/70 bg-amber-500/10 text-amber-100'
                      : 'border-[#0F4C5C]/45 bg-black text-teal-100 hover:border-amber-500/40'
                  }`}
                >
                  {t('endurance.subViews.calendar')}
                </button>
              </div>

              {runningSubView === 'trophies' ? (
                <RunningTrophiesPanel sessions={runningSessionsNoWalk} garminById={garminRunningById} />
              ) : runningSubView === 'calendar' ? (
                <DefisDisciplineCalendarPanel
                  activityKind="running"
                  sessions={runningSessionsNoWalk}
                  garminById={garminRunningById}
                  onEditSession={(type, id) => editSession(type, id)}
                />
              ) : (
                <>
              <RunningGarminSyncBlock />

              <RunningPersonalRecordsPanel sessions={runningSessionsNoWalk} garminById={garminRunningById} />

              {/* Rappel défis actifs */}
                  {activeChallenges.length > 0 && (
                    <div className="mb-8 rounded-2xl border-2 border-[#0F4C5C]/55 bg-black p-6">
                      <div className="flex items-start gap-4">
                        <div className="rounded-xl bg-[#0F4C5C]/25 p-3">
                          <Award className="h-6 w-6 text-sky-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-semibold text-lg mb-2">
                            {activeChallenges.length === 1
                              ? t('endurance.challenges.toComplete', { count: activeChallenges.length })
                              : t('endurance.challenges.toCompletePlural', { count: activeChallenges.length })
                            }
                          </h3>
                          <p className="text-sm text-teal-100/90 leading-relaxed">
                            {t(
                              'endurance.challenges.reminderBody',
                              'Ouvre l’onglet de chaque activité concernée pour voir le détail de tes défis.'
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

              {/* Formulaire de session */}
              {ui.showSessionForm && (
                    <div className="bg-black border-2 border-[#0F4C5C]/70 rounded-2xl p-8 mb-8 shadow-2xl shadow-black/40">
                      <h3 className="text-2xl font-bold text-white mb-6">{t('endurance.actions.newSession')}</h3>
                      <EnduranceSessionForm
                        activityType="running"
                        formState={runningForm}
                        setFormState={setRunningForm}
                      />

                      {/* Calculs automatiques */}
                      {runningForm.distance && runningForm.duration && (
                        <RunningSessionExtras
                          distance={runningForm.distance}
                          duration={runningForm.duration}
                        />
                      )}

                      <div className="mt-6 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setUI({ showSessionForm: false })}
                          className="rounded-lg border border-[#0F4C5C]/55 bg-black px-4 py-2 text-sm font-medium text-teal-100 transition hover:border-[#0F5C45]/60 hover:bg-[#0F4C5C]/12"
                        >
                          {t('endurance.actions.cancel')}
                        </button>
                        <button
                          type="button"
                          onClick={addRunningSession}
                          className="rounded-lg border border-[#0F5C45]/80 bg-[#0F5C45]/30 px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0F5C45]/45"
                        >
                          {t('endurance.actions.save')}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Liste des défis */}
                  {challenges.filter(c => c.activityType === 'running').length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-2xl font-bold text-white mb-6">{t('endurance.challenges.title')}</h3>
                      <div className="grid gap-4">
                        {challenges.filter(c => c.activityType === 'running').map((challenge, idx) => (
                          <div key={`running-challenge-${challenge.id}-${idx}`} className="bg-black border-2 border-[#0F4C5C]/70 rounded-2xl p-6 hover:border-[#0F5C45]/90 transition-all">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <Award className="w-5 h-5 text-sky-400" />
                                  <h4 className="font-bold text-xl text-white">{challenge.name}</h4>
                                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                    challenge.status === 'active' 
                                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                  }`}>
                                    {challenge.status === 'active' ? t('endurance.challenges.status.active') : t('endurance.challenges.status.completed')}
                                  </span>
                                </div>
                                <div className="space-y-1 text-slate-400 text-sm">
                                  <p>
                                    {challenge.type === 'ponctuel' && t('endurance.challenges.details.targetDate', { date: challenge.targetDate })}
                                    {challenge.type === 'recurrent' && (challenge.frequency === 'daily' 
                                      ? t('endurance.challenges.details.recurrentDaily')
                                      : t('endurance.challenges.details.recurrentWeekly')
                                    )}
                                    {challenge.type === 'periode' && t('endurance.challenges.details.period', { startDate: challenge.startDate, endDate: challenge.endDate })}
                                  </p>
                                  <p className="text-sky-300">
                                    {challenge.goalDistance && challenge.goalDuration
                                      ? t('endurance.challenges.details.goalRunningWithDuration', { distance: challenge.goalDistance, duration: challenge.goalDuration })
                                      : challenge.goalDistance
                                      ? t('endurance.challenges.details.goalRunning', { distance: challenge.goalDistance })
                                      : challenge.goalDuration
                                      ? `${challenge.goalDuration} min`
                                      : ''
                                    }
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => editChallenge(challenge.id)}
                                  className="gradient-button-premium gradient-button-premium-sm gradient-button-premium-variant rounded-lg p-2"
                                  title={t('endurance.session.editChallenge')}
                                >
                                  <Edit className="w-5 h-5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    // ✅ FIX DOUBLONS : Trouver l'index réel dans le tableau complet
                                    const realIndex = challenges.findIndex(c => c === challenge);
                                    deleteChallenge(challenge.id, realIndex);
                                  }}
                                  className="gradient-button-premium gradient-button-premium-sm rounded-lg p-2"
                                  title={t('endurance.session.deleteChallenge')}
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {runningGarminCardioExcluded.length > 0 && (
                    <div className="mb-6 rounded-xl border border-amber-500/45 bg-amber-950/25 p-4 text-amber-100">
                      <h4 className="mb-2 text-sm font-semibold text-amber-200">
                        {t('endurance.running.excludedCardioBannerTitle')}
                      </h4>
                      <p className="mb-3 text-xs leading-relaxed text-amber-100/90">
                        {t('endurance.running.excludedCardioBannerBody')}
                      </p>
                      <ul className="space-y-2">
                        {runningGarminCardioExcluded.map((session) => {
                          const idx = (sessions.running || []).findIndex(
                            (s) => s === session || s.id === session.id
                          );
                          return (
                            <li
                              key={String(session.id)}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/30 bg-black/40 px-3 py-2 text-xs"
                            >
                              <span className="min-w-0 flex-1 text-slate-300">
                                {session.date} {session.time ? session.time : ''} · {session.notes}
                              </span>
                              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => restoreRunningSessionFromGarminCardioExclusion(session.id)}
                                  className="rounded border border-emerald-500/55 px-2 py-1 text-emerald-200 hover:bg-emerald-950/35"
                                >
                                  {t('endurance.running.excludedCardioRestore')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteRunningSession(session.id, idx >= 0 ? idx : 0)}
                                  className="rounded border border-rose-500/50 px-2 py-1 text-rose-200 hover:bg-rose-950/40"
                                >
                                  {t('endurance.running.excludedCardioDelete')}
                                </button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {runningSessionsNoWalk.length === 0 ? (
                    <div className="mb-8 rounded-2xl border border-[#0F4C5C]/50 bg-black p-12 text-center">
                      <Play className="mx-auto mb-4 h-16 w-16 text-slate-600" />
                      <p className="text-lg text-slate-400">{t('endurance.history.noSessions')}</p>
                      <p className="mt-2 text-sm text-slate-500">{t('endurance.history.noSessionsHint')}</p>
                    </div>
                  ) : (
                    <RunningSessionsHistory
                      sessions={runningSessionsNoWalk}
                      garminById={garminRunningById}
                      garminRunningKindByGarminId={garminRunningKindByGarminId}
                      mode="running"
                      onOpenDetail={setRunningDetailSession}
                      onEdit={(id) => editSession('running', id)}
                      onDelete={(id, originalIndex) => deleteRunningSession(id, originalIndex)}
                    />
                  )}
                </>
              )}

            </>
          )}

          {/* SECTION MARCHE */}
          {activeTab === 'walking' && (
            <>
              <EnduranceSectionHeader
                title={t('endurance.sections.walking.title')}
                subtitle={t('endurance.sections.walking.subtitle')}
                actions={[
                  {
                    key: 'new-walking-session',
                    label: t('endurance.actions.newSession'),
                    icon: Plus,
                    onClick: () => {
                      setWalkingForm((prev) => ({ ...prev, type: 'walk' }));
                      setUI({ showSessionForm: !ui.showSessionForm });
                    },
                    className:
                      'inline-flex items-center gap-2 rounded-lg border border-[#0F4C5C]/60 bg-black px-4 py-2 text-sm font-medium text-teal-100 shadow-sm transition hover:border-[#0F5C45]/70 hover:bg-[#0F4C5C]/15'
                  }
                ]}
              />

              <div className="mb-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setWalkingSubView('sessions')}
                  className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                    walkingSubView === 'sessions'
                      ? 'border-sky-500/70 bg-sky-500/15 text-sky-100'
                      : 'border-[#0F4C5C]/45 bg-black text-teal-100 hover:border-sky-500/40'
                  }`}
                >
                  {t('endurance.subViews.sessionsAndChallenges')}
                </button>
                <button
                  type="button"
                  onClick={() => setWalkingSubView('trophies')}
                  className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                    walkingSubView === 'trophies'
                      ? 'border-sky-500/70 bg-sky-500/15 text-sky-100'
                      : 'border-[#0F4C5C]/45 bg-black text-teal-100 hover:border-sky-500/40'
                  }`}
                >
                  {t('endurance.subViews.trophies')}
                </button>
                <button
                  type="button"
                  onClick={() => setWalkingSubView('calendar')}
                  className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                    walkingSubView === 'calendar'
                      ? 'border-amber-500/70 bg-amber-500/10 text-amber-100'
                      : 'border-[#0F4C5C]/45 bg-black text-teal-100 hover:border-amber-500/40'
                  }`}
                >
                  {t('endurance.subViews.calendar')}
                </button>
                <button
                  type="button"
                  onClick={() => setWalkingSubView('dailyWalkManual')}
                  className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                    walkingSubView === 'dailyWalkManual'
                      ? 'border-emerald-500/70 bg-emerald-500/10 text-emerald-100'
                      : 'border-[#0F4C5C]/45 bg-black text-teal-100 hover:border-emerald-500/40'
                  }`}
                >
                  {t('endurance.subViews.dailyWalkManual')}
                </button>
              </div>

              {walkingSubView === 'trophies' ? (
                <WalkingTrophiesPanel sessions={walkingSessions} />
              ) : walkingSubView === 'dailyWalkManual' ? (
                <ManualDailyWalkPanel currentData={data} updateData={updateData} />
              ) : walkingSubView === 'calendar' ? (
                <DefisDisciplineCalendarPanel
                  activityKind="walking"
                  sessions={walkingSessions}
                  onEditSession={(type, id) => editSession(type, id)}
                />
              ) : (
                <>
              <RunningGarminSyncBlock />
              <WalkingStatsPanel sessions={walkingSessions} garminById={garminRunningById} />

              {ui.showSessionForm && (
                <div className="bg-black border-2 border-[#0F4C5C]/70 rounded-2xl p-8 mb-8 shadow-2xl shadow-black/40">
                  <h3 className="text-2xl font-bold text-white mb-6">Nouvelle session de marche</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="text-sm text-teal-100">
                      Date
                      <input
                        type="date"
                        value={walkingForm.date || ''}
                        onChange={(e) => setWalkingForm((prev) => ({ ...prev, date: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-[#0F4C5C]/50 bg-black px-3 py-2 text-white"
                      />
                    </label>
                    <label className="text-sm text-teal-100">
                      Heure
                      <input
                        type="time"
                        value={walkingForm.time || ''}
                        onChange={(e) => setWalkingForm((prev) => ({ ...prev, time: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-[#0F4C5C]/50 bg-black px-3 py-2 text-white"
                      />
                    </label>
                    <label className="text-sm text-teal-100">
                      Distance (km)
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={walkingForm.distance || ''}
                        onChange={(e) => setWalkingForm((prev) => ({ ...prev, distance: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-[#0F4C5C]/50 bg-black px-3 py-2 text-white"
                      />
                    </label>
                    <label className="text-sm text-teal-100">
                      Durée (hh:mm:ss)
                      <input
                        type="text"
                        value={walkingForm.duration || ''}
                        onChange={(e) => setWalkingForm((prev) => ({ ...prev, duration: e.target.value }))}
                        placeholder="00:45:00"
                        className="mt-1 w-full rounded-lg border border-[#0F4C5C]/50 bg-black px-3 py-2 text-white"
                      />
                    </label>
                    <label className="text-sm text-teal-100 md:col-span-2">
                      Notes
                      <textarea
                        value={walkingForm.notes || ''}
                        onChange={(e) => setWalkingForm((prev) => ({ ...prev, notes: e.target.value }))}
                        rows={3}
                        className="mt-1 w-full rounded-lg border border-[#0F4C5C]/50 bg-black px-3 py-2 text-white"
                      />
                    </label>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setUI({ showSessionForm: false })}
                      className="rounded-lg border border-[#0F4C5C]/55 bg-black px-4 py-2 text-sm font-medium text-teal-100 transition hover:border-[#0F5C45]/60 hover:bg-[#0F4C5C]/12"
                    >
                      {t('endurance.actions.cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={addWalkingSession}
                      className="rounded-lg border border-[#0F5C45]/80 bg-[#0F5C45]/30 px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0F5C45]/45"
                    >
                      {t('endurance.actions.save')}
                    </button>
                  </div>
                </div>
              )}

              {walkingSessions.length === 0 ? (
                <div className="mb-8 rounded-2xl border border-[#0F4C5C]/50 bg-black p-12 text-center">
                  <Play className="mx-auto mb-4 h-16 w-16 text-slate-600" />
                  <p className="text-lg text-slate-400">Aucune marche enregistrée</p>
                  <p className="mt-2 text-sm text-slate-500">Synchronise Garmin ou ajoute une séance manuelle.</p>
                </div>
              ) : (
                <RunningSessionsHistory
                  sessions={walkingSessions}
                  garminById={garminRunningById}
                  garminRunningKindByGarminId={garminRunningKindByGarminId}
                  mode="walking"
                  title="Historique des marches"
                  onOpenDetail={setRunningDetailSession}
                  onEdit={(id) => editSession('running', id)}
                  onDelete={(id, originalIndex) => deleteRunningSession(id, originalIndex)}
                />
              )}
                </>
              )}
            </>
          )}

          {/* SECTION TOUS LES TROPHEES */}
          {activeTab === 'trophies' && (
            <AllTrophiesHubPanel
              sessions={sessions}
              garminRunningById={garminRunningById}
              onOpenCategoryTrophies={(categoryId) => {
                if (categoryId === 'running') {
                  setRunningSubView('trophies');
                  setActiveTab('running');
                  return;
                }
                if (categoryId === 'walking') {
                  setWalkingSubView('trophies');
                  setActiveTab('walking');
                  return;
                }
                if (categoryId === 'pushups') {
                  setPushupsSubView('trophies');
                  setActiveTab('pushups');
                  return;
                }
                if (categoryId === 'jumprope') {
                  setJumpropeSubView('trophies');
                  setActiveTab('jumprope');
                  return;
                }
                if (categoryId === 'gainage') {
                  setGainageSubView('trophies');
                  setActiveTab('gainage');
                }
              }}
            />
          )}

          {/* SECTION CIRCUITS */}
          {activeTab === 'circuits' && <CircuitsHubPanel />}

          {/* SECTION PERFORMANCES */}
          {activeTab === 'performance' && <PerformanceChallengesTab />}

          {/* SECTION CALENDRIER HEATMAP */}
          {activeTab === 'calendar' && (
            <>
              <EnduranceCalendarModernPanel
                sessions={sessions}
                selectedYear={ui.selectedYear}
                selectedActivityFilter={ui.selectedActivityFilter}
                onYearChange={(year) => setUI({ selectedYear: year })}
                onActivityFilterChange={(value) => setUI({ selectedActivityFilter: value })}
                onEditSession={(activityType, id) => {
                  editSession(activityType, id);
                  setActiveTab(activityType);
                }}
              />
            </>
          )}
        </div>
        )}
      </div>

      {/* Modal création de défi */}
      {ui.showChallengeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-[#0F4C5C]/45 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-3xl font-bold text-white">{t('endurance.challenges.modal.title')}</h3>
              <button
                onClick={() => setUI({ showChallengeModal: false })}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">{t('endurance.challenges.modal.name')}</label>
                <input
                  type="text"
                  value={challengeForm.name}
                  onChange={(e) => setChallengeForm({...challengeForm, name: e.target.value})}
                  className="w-full px-4 py-3 bg-black border border-[#0F4C5C]/50 rounded-xl text-white focus:outline-none focus:border-[#0F5C45] transition-colors"
                  placeholder={t('endurance.challenges.modal.namePlaceholder')}
                />
              </div>
              
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">{t('endurance.challenges.modal.activityType')}</label>
                <select
                  value={challengeForm.activityType}
                  onChange={(e) => setChallengeForm({...challengeForm, activityType: e.target.value})}
                  className="w-full px-4 py-3 bg-black border border-[#0F4C5C]/50 rounded-xl text-white focus:outline-none focus:border-[#0F5C45] transition-colors"
                >
                  <option value="boxing">{t('endurance.menu.boxing')}</option>
                  <option value="pushups">{t('endurance.menu.pushups')}</option>
                  <option value="swimming">{t('endurance.menu.swimming')}</option>
                  <option value="jumprope">{t('endurance.menu.jumprope')}</option>
                  <option value="gainage">{t('endurance.menu.gainage')}</option>
                  <option value="running">{t('endurance.menu.running')}</option>
                </select>
              </div>
              
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">{t('endurance.challenges.modal.challengeType')}</label>
                <select
                  value={challengeForm.type}
                  onChange={(e) => setChallengeForm({ ...challengeForm, type: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-[#0F4C5C]/50 rounded-xl text-white focus:outline-none focus:border-[#0F5C45] transition-colors"
                >
                  <option value="ponctuel">{t('endurance.challenges.types.ponctuel')}</option>
                  <option value="recurrent">{t('endurance.challenges.types.recurrent')}</option>
                  <option value="periode">{t('endurance.challenges.types.periode')}</option>
                  {challengeForm.activityType === 'pushups' ? (
                    <option value="pushups_cumul">{t('endurance.challenges.types.pushups_cumul')}</option>
                  ) : null}
                </select>
              </div>

              {challengeForm.type === 'ponctuel' && (
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">{t('endurance.challenges.modal.targetDate')}</label>
                  <input
                    type="date"
                    value={challengeForm.targetDate}
                    onChange={(e) => setChallengeForm({...challengeForm, targetDate: e.target.value})}
                    className="w-full px-4 py-3 bg-black border border-[#0F4C5C]/50 rounded-xl text-white focus:outline-none focus:border-[#0F5C45] transition-colors"
                  />
                </div>
              )}

              {challengeForm.type === 'recurrent' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">{t('endurance.challenges.modal.frequency')}</label>
                    <select
                      value={challengeForm.frequency}
                      onChange={(e) => setChallengeForm({...challengeForm, frequency: e.target.value})}
                      className="w-full px-4 py-3 bg-black border border-[#0F4C5C]/50 rounded-xl text-white focus:outline-none focus:border-[#0F5C45] transition-colors"
                    >
                      <option value="daily">{t('endurance.challenges.frequencies.daily')}</option>
                      <option value="weekly">{t('endurance.challenges.frequencies.weekly')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">{t('endurance.challenges.modal.moment')}</label>
                    <select
                      value={challengeForm.moment}
                      onChange={(e) => setChallengeForm({...challengeForm, moment: e.target.value})}
                      className="w-full px-4 py-3 bg-black border border-[#0F4C5C]/50 rounded-xl text-white focus:outline-none focus:border-[#0F5C45] transition-colors"
                    >
                      <option value="matin">{t('endurance.challenges.moments.morning')}</option>
                      <option value="midi">{t('endurance.challenges.moments.midday')}</option>
                      <option value="soir">{t('endurance.challenges.moments.evening')}</option>
                    </select>
                  </div>
                </div>
              )}

              {challengeForm.type === 'periode' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">{t('endurance.challenges.modal.startDate')}</label>
                    <input
                      type="date"
                      value={challengeForm.startDate}
                      onChange={(e) => setChallengeForm({...challengeForm, startDate: e.target.value})}
                      className="w-full px-4 py-3 bg-black border border-[#0F4C5C]/50 rounded-xl text-white focus:outline-none focus:border-[#0F5C45] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">{t('endurance.challenges.modal.endDate')}</label>
                    <input
                      type="date"
                      value={challengeForm.endDate}
                      onChange={(e) => setChallengeForm({...challengeForm, endDate: e.target.value})}
                      className="w-full px-4 py-3 bg-black border border-[#0F4C5C]/50 rounded-xl text-white focus:outline-none focus:border-[#0F5C45] transition-colors"
                    />
                  </div>
                </div>
              )}

              {challengeForm.type === 'pushups_cumul' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        {t('endurance.challenges.modal.startDate')}
                      </label>
                      <input
                        type="date"
                        value={challengeForm.startDate}
                        onChange={(e) => setChallengeForm({ ...challengeForm, startDate: e.target.value })}
                        className="w-full rounded-xl border border-[#0F4C5C]/50 bg-black px-4 py-3 text-white transition-colors focus:border-[#0F5C45] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        {t('endurance.challenges.modal.endDate')}
                      </label>
                      <input
                        type="date"
                        value={challengeForm.endDate}
                        onChange={(e) => setChallengeForm({ ...challengeForm, endDate: e.target.value })}
                        className="w-full rounded-xl border border-[#0F4C5C]/50 bg-black px-4 py-3 text-white transition-colors focus:border-[#0F5C45] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      {t('endurance.challenges.modal.goalTotalCount')}
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={challengeForm.goalTotalCount}
                      onChange={(e) => setChallengeForm({ ...challengeForm, goalTotalCount: e.target.value })}
                      className="w-full rounded-xl border border-[#0F4C5C]/50 bg-black px-4 py-3 text-white transition-colors focus:border-[#0F5C45] focus:outline-none"
                      placeholder="500"
                    />
                  </div>
                </div>
              )}

              {challengeForm.type !== 'pushups_cumul' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">
                    {t(`endurance.challenges.modal.goalCount.${challengeForm.activityType}`, { fallback: t('endurance.challenges.modal.goalCount.default') })}
                  </label>
                  <input
                    type="number"
                    value={challengeForm.goalCount}
                    onChange={(e) => setChallengeForm({...challengeForm, goalCount: e.target.value})}
                    className="w-full px-4 py-3 bg-black border border-[#0F4C5C]/50 rounded-xl text-white focus:outline-none focus:border-[#0F5C45] transition-colors"
                    placeholder={t('endurance.challenges.modal.optional')}
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">{t('endurance.challenges.modal.goalDuration')}</label>
                  <input
                    type="number"
                    step="0.5"
                    value={challengeForm.goalDuration}
                    onChange={(e) => setChallengeForm({...challengeForm, goalDuration: e.target.value})}
                    className="w-full px-4 py-3 bg-black border border-[#0F4C5C]/50 rounded-xl text-white focus:outline-none focus:border-[#0F5C45] transition-colors"
                    placeholder={t('endurance.challenges.modal.optional')}
                  />
                </div>
              </div>
              )}
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setUI({ showChallengeModal: false })}
                className="gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={addChallenge}
                className="gradient-button-premium gradient-button-premium-md rounded-lg"
              >
                {t('endurance.challenges.modal.create')}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default EnduranceTab;
