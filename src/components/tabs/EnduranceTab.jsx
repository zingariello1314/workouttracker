import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Calendar, Dumbbell, Waves, Activity, Play, Box, Plus, X, Trash2, Award, Edit, Save, Heart, Zap } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import StarRating from '../ui/StarRating';
import { useTranslation } from '../../utils/translations';
import { useFormatters } from '../../utils/translations/formatters-hook';
import { getCachedNamespace } from '../../utils/translations/loader';
import { useLanguage } from '../../context/LanguageContext';
import {
  loadEnduranceData as loadEnduranceDataService,
  persistEnduranceData,
  ENDURANCE_SCHEMA_VERSION
} from '../../services/endurance/enduranceDataService';
import { evaluateChallenges } from '../../services/endurance/enduranceChallengesService';
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

const EnduranceTab = () => {
  const { data, updateData, getWorkoutHistory } = useWorkout();
  const t = useTranslation();
  const { formatDate } = useFormatters();
  const { language } = useLanguage();
  
  // État unifié pour toutes les sessions d'endurance
  const [enduranceState, setEnduranceState] = useState({
    activeTab: 'boxing',
    sessions: {
      boxing: [],
      pushups: [],
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
  const activeTab = enduranceState?.activeTab || 'boxing';
  const sessions = enduranceState?.sessions || {
    boxing: [],
    pushups: [],
    swimming: [],
    jumprope: [],
    running: []
  };
  const challenges = enduranceState?.challenges || [];
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

  // Setters optimisés
  const setActiveTab = useCallback((tab) => {
    setEnduranceState(prev => ({ ...prev, activeTab: tab }));
  }, []);

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

  const saveEnduranceData = useCallback(async (newData) => {
    try {
      if (!newData || typeof newData !== 'object') {
        throw new Error(t('endurance.errors.invalidData'));
      }

      const mergedSessions = {
        boxing: Array.isArray(enduranceState.sessions?.boxing) ? enduranceState.sessions.boxing : [],
        pushups: Array.isArray(enduranceState.sessions?.pushups) ? enduranceState.sessions.pushups : [],
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
    return challenges.filter(challenge => {
      if (challenge.status !== 'active') return false;
      
      // Vérifier si le défi est encore valide selon son type
      switch (challenge.type) {
        case 'ponctuel':
          return new Date(challenge.targetDate) > now;
        case 'periode':
          return new Date(challenge.endDate) > now;
        case 'recurrent':
          return true; // Les défis récurrents sont toujours actifs
        default:
          return true;
      }
    });
  }, [challenges]);

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
  const [runningForm, setRunningForm] = useState(() => createDefaultFormState('running'));

  const [challengeForm, setChallengeForm] = useState(() => createDefaultChallengeFormState('pushups'));

  const addSession = useCallback(async (activityType, sessionData) => {
    try {
      const currentSessionsMap = enduranceState.sessions || {};
      const activitySessions = Array.isArray(currentSessionsMap[activityType])
        ? currentSessionsMap[activityType]
        : [];

      const evaluation = evaluateChallenges(challenges, sessionData, activityType, { logger: enduranceLogger });

      const newSession = {
        ...sessionData,
        activityType,
        validatedChallenges: evaluation.validatedIds
      };

      const updatedSessionsMap = {
        ...currentSessionsMap,
        [activityType]: [...activitySessions, newSession]
      };

      await saveEnduranceData({
        sessions: updatedSessionsMap,
        challenges: evaluation.updatedChallenges
      });

      if (evaluation.validatedIds.length > 0) {
        enduranceLogger.info?.(`[EnduranceTab] Défis validés pour ${activityType}:`, evaluation.validatedIds);
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

      const updatedSessions = activitySessions.map(session =>
        String(session.id) === String(sessionId)
          ? { ...session, ...updatedData }
          : session
      );

      const updatedSessionsMap = {
        ...currentSessionsMap,
        [activityType]: updatedSessions
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
  }, [enduranceState.sessions, saveEnduranceData, setUI]);

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

  const resetRunningForm = useCallback(() => {
    setRunningForm(createDefaultFormState('running'));
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



  // Fonction d'ajout de défi (améliorée)
  const addChallenge = useCallback(async () => {
    try {
      if (!challengeForm.name || !challengeForm.activityType) {
        throw new Error(t('endurance.errors.nameAndTypeRequired'));
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
  const deleteRunningSession = useCallback((id, index) => deleteSession('running', id, index), [deleteSession]);

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
    if (ui.selectedActivityFilter === 'all' || ui.selectedActivityFilter === 'running') {
      count += sessions.running.filter(s => s.date === dateStr).length;
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
    
    sessions.running.filter(s => s.date === dateStr).forEach(session => {
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

  const menuItems = useMemo(() => [
    { id: 'boxing', label: t('endurance.menu.boxing'), icon: Box },
    { id: 'pushups', label: t('endurance.menu.pushups'), icon: Dumbbell },
    { id: 'swimming', label: t('endurance.menu.swimming'), icon: Waves },
    { id: 'jumprope', label: t('endurance.menu.jumprope'), icon: Activity },
    { id: 'running', label: t('endurance.menu.running'), icon: Play },
    { id: 'calendar', label: t('endurance.menu.calendar'), icon: Calendar }
  ], [t]);

  // Composant pour afficher les exercices d'endurance depuis l'historique (optimisé)
  const EnduranceHistorySection = useMemo(() => {
    const enduranceExercises = getEnduranceExercisesFromHistory();
    
    if (enduranceExercises.length === 0) {
      return (
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 mb-8">
          <h3 className="text-xl font-bold text-white mb-4">{t('endurance.history.fromWorkouts.title')}</h3>
          <p className="text-slate-400">{t('endurance.history.fromWorkouts.none')}</p>
        </div>
      );
    }

    return (
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 mb-8">
        <h3 className="text-xl font-bold text-white mb-4">Exercices d'Endurance depuis vos Séances</h3>
        <div className="space-y-3">
          {enduranceExercises.slice(0, 10).map((exercise, index) => (
            <div key={exercise.id || index} className="bg-slate-900/50 border border-slate-600/50 rounded-lg p-4">
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

  return (
    <div className="relative min-h-screen">
      {/* Contenu avec z-index relatif */}
      <div className="relative z-10 flex h-screen">
        {/* Menu latéral */}
      <div className="w-72 bg-slate-900/50 backdrop-blur-xl border-r border-slate-700/50">
        <div className="p-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-violet-500 bg-clip-text text-transparent">
            {t('endurance.title')}
          </h1>
          <p className="text-slate-400 text-sm mt-2">{t('endurance.subtitle')}</p>
        </div>
        
        <nav className="px-4">
          {menuItems.map(item => {
            const Icon = item.icon;
            const count = challenges.filter(c => c.activityType === item.id && c.status === 'active').length;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-5 py-4 rounded-xl mb-2 transition-all duration-300 group ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-pink-500 to-violet-600 shadow-lg shadow-purple-500/50'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <div className="flex items-center">
                  <Icon className={`w-5 h-5 mr-3 ${activeTab === item.id ? '' : 'group-hover:scale-110 transition-transform'}`} />
                  <span className="font-medium">{item.label}</span>
                </div>
                {count > 0 && (
                  <span className="bg-pink-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 overflow-auto">
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
                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 mb-8 shadow-2xl">
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
                <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
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
                          <tr className="border-b border-slate-700/50">
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
                              className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors"
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

              {/* Rappel défis actifs */}
              {activeChallenges.length > 0 && (
                <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm border border-amber-500/30 rounded-2xl p-6 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="bg-amber-500/20 p-3 rounded-xl">
                      <Award className="w-6 h-6 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg mb-2">
                        {activeChallenges.length === 1 
                          ? t('endurance.challenges.active', { count: activeChallenges.length })
                          : t('endurance.challenges.activePlural', { count: activeChallenges.length })
                        }
                      </h3>
                      <div className="space-y-2">
                        {activeChallenges.map((c, idx) => (
                          <div key={`active-challenge-${c.id}-${idx}`} className="text-amber-200 text-sm flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
                            {c.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Formulaire de session */}
              {ui.showSessionForm && (
                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 mb-8 shadow-2xl">
                  <h3 className="text-2xl font-bold text-white mb-6">{t('endurance.actions.newSession')}</h3>
                  <EnduranceSessionForm
                    activityType="pushups"
                    formState={sessionForm}
                    setFormState={setSessionForm}
                    onSubmit={addPushupSession}
                    onCancel={() => setUI({ showSessionForm: false })}
                    onUpdate={updateSession}
                    onDelete={deletePushupSession}
                    onEdit={editSession}
                    onReset={resetPushupForm}
                  />
                </div>
              )}

              {/* Liste des défis */}
              {challenges.filter(c => c.activityType === 'pushups').length > 0 && (
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-white mb-6">{t('endurance.challenges.title')}</h3>
                  <div className="grid gap-4">
                    {challenges.filter(c => c.activityType === 'pushups').map((challenge, idx) => (
                      <div key={`pushups-challenge-${challenge.id}-${idx}`} className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-xl border border-slate-600/50 rounded-2xl p-6 hover:border-purple-500/50 transition-all">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Award className="w-5 h-5 text-purple-400" />
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
                              <p className="text-purple-300">
                                {challenge.goalCount && challenge.goalDuration
                                  ? t('endurance.challenges.details.goalPushupsWithDuration', { count: challenge.goalCount, duration: challenge.goalDuration })
                                  : challenge.goalCount
                                  ? t('endurance.challenges.details.goalPushups', { count: challenge.goalCount })
                                  : challenge.goalDuration
                                  ? `${challenge.goalDuration} min`
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

              {/* Historique */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">{t('endurance.history.title')}</h3>
                <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
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
                          <tr className="border-b border-slate-700/50">
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
                              className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors"
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
                <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm border border-amber-500/30 rounded-2xl p-6 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="bg-amber-500/20 p-3 rounded-xl">
                      <Award className="w-6 h-6 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg mb-2">
                        {activeChallenges.length === 1 
                          ? t('endurance.challenges.active', { count: activeChallenges.length })
                          : t('endurance.challenges.activePlural', { count: activeChallenges.length })
                        }
                      </h3>
                      <div className="space-y-2">
                        {activeChallenges.map((c, idx) => (
                          <div key={`active-challenge-${c.id}-${idx}`} className="text-amber-200 text-sm flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
                            {c.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {ui.showSessionForm && (
                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 mb-8 shadow-2xl">
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
                      <div key={`swimming-challenge-${challenge.id}-${idx}`} className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-xl border border-slate-600/50 rounded-2xl p-6 hover:border-purple-500/50 transition-all">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Award className="w-5 h-5 text-purple-400" />
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
                              <p className="text-purple-300">
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
                <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
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
                        <div key={`swimming-${session.id}-${idx}`} className="bg-slate-900/30 border border-slate-700/50 rounded-xl p-6 hover:border-purple-500/30 transition-all">
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
                            <div className="border-t border-slate-700/50 pt-4">
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

              {/* Rappel défis actifs */}
              {activeChallenges.length > 0 && (
                <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm border border-amber-500/30 rounded-2xl p-6 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="bg-amber-500/20 p-3 rounded-xl">
                      <Award className="w-6 h-6 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg mb-2">
                        {activeChallenges.length === 1
                          ? t('endurance.challenges.toComplete', { count: activeChallenges.length })
                          : t('endurance.challenges.toCompletePlural', { count: activeChallenges.length })
                        }
                      </h3>
                      <div className="space-y-2">
                        {activeChallenges.map((c, idx) => (
                          <div key={`active-challenge-${c.id}-${idx}`} className="text-amber-200 text-sm flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
                            {c.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {ui.showSessionForm && (
                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 mb-8 shadow-2xl">
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
                      <div key={`jumprope-challenge-${challenge.id}-${idx}`} className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-xl border border-slate-600/50 rounded-2xl p-6 hover:border-purple-500/50 transition-all">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Award className="w-5 h-5 text-purple-400" />
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
                              <p className="text-purple-300">
                                {challenge.goalDuration && challenge.goalCount
                                  ? t('endurance.challenges.details.goalJumpropeOrJumps', { duration: challenge.goalDuration, jumps: challenge.goalCount })
                                  : challenge.goalDuration
                                  ? t('endurance.challenges.details.goalJumprope', { duration: challenge.goalDuration })
                                  : challenge.goalCount
                                  ? `${challenge.goalCount} sauts`
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

              {/* Historique */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">{t('endurance.history.title')}</h3>
                <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
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
                          <tr className="border-b border-slate-700/50">
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
                              className={`border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors ${idx % 2 === 0 ? 'bg-slate-800/20' : 'bg-slate-800/10'}`}
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
                      'gradient-button-premium gradient-button-premium-md rounded-lg flex items-center gap-2'
                  },
                  {
                    key: 'create-running-challenge',
                    label: t('endurance.actions.createChallenge'),
                    icon: Award,
                    onClick: () => setUI({ showChallengeModal: true }),
                    className:
                      'gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg flex items-center gap-2'
                  }
                ]}
              />

              {/* Rappel défis actifs */}
              {activeChallenges.length > 0 && (
                <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm border border-amber-500/30 rounded-2xl p-6 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="bg-amber-500/20 p-3 rounded-xl">
                      <Award className="w-6 h-6 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg mb-2">
                        {activeChallenges.length === 1
                          ? t('endurance.challenges.toComplete', { count: activeChallenges.length })
                          : t('endurance.challenges.toCompletePlural', { count: activeChallenges.length })
                        }
                      </h3>
                      <div className="space-y-2">
                        {activeChallenges.map((c, idx) => (
                          <div key={`active-challenge-${c.id}-${idx}`} className="text-amber-200 text-sm flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
                            {c.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Formulaire de session */}
              {ui.showSessionForm && (
                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 mb-8 shadow-2xl">
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
                      onClick={() => setUI({ showSessionForm: false })}
                      className="gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg"
                    >
                      {t('endurance.actions.cancel')}
                    </button>
                    <button
                      onClick={addRunningSession}
                      className="gradient-button-premium gradient-button-premium-md rounded-lg"
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
                      <div key={`running-challenge-${challenge.id}-${idx}`} className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-xl border border-slate-600/50 rounded-2xl p-6 hover:border-purple-500/50 transition-all">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Award className="w-5 h-5 text-purple-400" />
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
                              <p className="text-purple-300">
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

              {/* Historique */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">{t('endurance.history.title')}</h3>
                <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
                  {sessions.running.length === 0 ? (
                    <div className="p-12 text-center">
                      <Play className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400 text-lg">{t('endurance.history.noSessions')}</p>
                      <p className="text-slate-500 text-sm mt-2">{t('endurance.history.noSessionsHint')}</p>
                    </div>
                  ) : (
                    <div className="space-y-4 p-6">
                      {sessions.running.sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time)).map((session, idx) => {
                        const originalIndex = sessions.running.findIndex(s => s === session);
                        return (
                        <div key={`running-${session.id}-${idx}`} className="bg-slate-900/30 border border-slate-700/50 rounded-xl p-6 hover:border-purple-500/30 transition-all">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-white font-bold text-lg">{session.date}</span>
                                <span className="text-slate-400">{session.time}</span>
                                <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg text-sm">
                                  {session.type ? (session.type.charAt(0).toUpperCase() + session.type.slice(1)) : t('endurance.running.details.type')}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-slate-400">{t('endurance.running.details.distance')}</span>
                                  <span className="text-white font-bold ml-2">{session.distance}km</span>
                                </div>
                                <div>
                                  <span className="text-slate-400">{t('endurance.running.details.duration')}</span>
                                  <span className="text-white font-bold ml-2">{session.duration}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400">{t('endurance.running.details.pace')}</span>
                                  <span className="text-white font-bold ml-2">{session.pace} min/km</span>
                                </div>
                                <div>
                                  <span className="text-slate-400">{t('endurance.running.details.speed')}</span>
                                  <span className="text-white font-bold ml-2">{session.speed} km/h</span>
                                </div>
                                {session.elevation && (
                                  <div>
                                    <span className="text-slate-400">{t('endurance.running.details.elevation')}</span>
                                    <span className="text-white font-bold ml-2">{session.elevation}m</span>
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
                                onClick={() => editSession('running', session.id)}
                                className="gradient-button-premium gradient-button-premium-sm gradient-button-premium-variant rounded-lg p-2"
                                title="Modifier la session"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteRunningSession(session.id, originalIndex)}
                                className="gradient-button-premium gradient-button-premium-sm rounded-lg p-2"
                                title="Supprimer la session"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
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

          {/* SECTION CALENDRIER HEATMAP */}
          {activeTab === 'calendar' && (
            <>
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-4xl font-bold text-white mb-2">{t('endurance.sections.calendar.title')}</h2>
                  <p className="text-slate-400">{t('endurance.sections.calendar.subtitle')}</p>
                </div>
                <div className="flex gap-3">
                  <select
                    value={ui.selectedYear}
                    onChange={(e) => setUI({ selectedYear: parseInt(e.target.value) })}
                    className="px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    <option value={2024}>2024</option>
                    <option value={2025}>2025</option>
                  </select>
                  <select
                    value={ui.selectedActivityFilter}
                    onChange={(e) => setUI({ selectedActivityFilter: e.target.value })}
                    className="px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    <option value="all">{t('endurance.calendar.filters.all')}</option>
                    <option value="boxing">{t('endurance.calendar.filters.boxing')}</option>
                    <option value="pushups">{t('endurance.calendar.filters.pushups')}</option>
                    <option value="swimming">{t('endurance.calendar.filters.swimming')}</option>
                    <option value="jumprope">{t('endurance.calendar.filters.jumprope')}</option>
                    <option value="running">{t('endurance.calendar.filters.running')}</option>
                  </select>
                </div>
              </div>

              {/* Statistiques rapides */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-white">{getTotalActivities}</div>
                  <div className="text-slate-400 text-sm">{t('endurance.calendar.stats.totalActivities')}</div>
                </div>
                <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-white">{getCurrentStreak}</div>
                  <div className="text-slate-400 text-sm">{t('endurance.calendar.stats.consecutiveDays')}</div>
                </div>
                <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-white">{getBestStreak}</div>
                  <div className="text-slate-400 text-sm">{t('endurance.calendar.stats.bestStreak')}</div>
                </div>
                <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-white">{getActiveDays}</div>
                  <div className="text-slate-400 text-sm">{t('endurance.calendar.stats.activeDays')}</div>
                </div>
              </div>

              {/* Bouton de diagnostic (temporaire pour debug) */}
              <div className="mb-6">
                <button
                  onClick={diagnoseDataState}
                  className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 rounded-lg text-blue-300 hover:text-blue-200 transition-all text-sm"
                >
                  {t('endurance.calendar.diagnostic')}
                </button>
              </div>

              {/* Heatmap */}
              <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 mb-8">
                <h3 className="text-xl font-bold text-white mb-4">{t('endurance.calendar.heatmap.title', { year: ui.selectedYear })}</h3>
                
                {/* Légende */}
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-slate-400 text-sm">{t('endurance.calendar.heatmap.less')}</span>
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4].map(level => (
                      <div
                        key={level}
                        className={`w-3 h-3 rounded-sm ${
                          level === 0 ? 'bg-slate-700' :
                          level === 1 ? 'bg-green-500/20' :
                          level === 2 ? 'bg-green-500/40' :
                          level === 3 ? 'bg-green-500/60' :
                          'bg-green-500'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-slate-400 text-sm">{t('endurance.calendar.heatmap.more')}</span>
                </div>

                {/* Calendrier simplifié */}
                <div className="space-y-4">
                  {Array.from({ length: 12 }, (_, monthIndex) => {
                    const monthName = getMonthLabels[monthIndex];
                    const monthDate = new Date(ui.selectedYear, monthIndex, 1);
                    const daysInMonth = new Date(ui.selectedYear, monthIndex + 1, 0).getDate();
                    const firstDayOfWeek = monthDate.getDay();
                    
                    return (
                      <div key={monthIndex} className="bg-slate-900/30 rounded-lg p-4">
                        <h4 className="text-white font-semibold mb-3">{monthName}</h4>
                        <div className="grid grid-cols-7 gap-1">
                          {/* Jours de la semaine */}
                          {(() => {
                            const enduranceData = getCachedNamespace(language, 'endurance');
                            const weekdays = enduranceData?.calendar?.weekdays?.short;
                            return Array.isArray(weekdays) ? weekdays : ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
                          })().map((day, dayIndex) => (
                            <div key={`header-${dayIndex}`} className="text-slate-500 text-xs text-center py-1">
                              {day}
                            </div>
                          ))}
                          
                          {/* Cases vides pour aligner */}
                          {Array.from({ length: firstDayOfWeek }, (_, i) => (
                            <div key={`empty-${i}`} className="w-6 h-6"></div>
                          ))}
                          
                          {/* Jours du mois */}
                          {Array.from({ length: daysInMonth }, (_, dayIndex) => {
                            const dayNumber = dayIndex + 1;
                            const dayDate = new Date(ui.selectedYear, monthIndex, dayNumber);
                            const activityCount = getActivityCountForDay(dayDate);
                            const intensity = Math.min(4, Math.floor(activityCount / 2));
                            
                            return (
                              <div
                                key={`day-${dayNumber}`}
                                className={`w-6 h-6 rounded-sm cursor-pointer transition-all hover:scale-110 flex items-center justify-center text-xs ${
                                  activityCount === 0 ? 'bg-slate-700 hover:bg-slate-600 text-slate-400' :
                                  intensity === 1 ? 'bg-green-500/20 hover:bg-green-500/30 text-green-300' :
                                  intensity === 2 ? 'bg-green-500/40 hover:bg-green-500/50 text-green-200' :
                                  intensity === 3 ? 'bg-green-500/60 hover:bg-green-500/70 text-green-100' :
                                  'bg-green-500 hover:bg-green-400 text-white'
                                }`}
                                onClick={() => handleDayClick(dayDate)}
                                title={activityCount === 1
                                  ? t('endurance.calendar.heatmap.dayTitle', { date: dayDate.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US'), count: activityCount })
                                  : t('endurance.calendar.heatmap.dayTitlePlural', { date: dayDate.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US'), count: activityCount })
                                }
                              >
                                {dayNumber}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal des activités du jour */}
              {ui.selectedDay && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-2xl font-bold text-white">
                        {t('endurance.calendar.heatmap.dayActivities', { 
                          date: formatDate(ui.selectedDay, { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })
                        })}
                      </h3>
                      <button
                        onClick={() => setUI({ selectedDay: null })}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {getActivitiesForDay(ui.selectedDay).map((activity, index) => (
                        <div 
                          key={index}
                          className="bg-slate-900/50 border border-slate-600/50 rounded-xl p-4 hover:border-purple-500/50 transition-all cursor-pointer"
                          onClick={() => navigateToActivity(activity.type)}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${
                                activity.type === 'boxing' ? 'bg-red-500' :
                                activity.type === 'pushups' ? 'bg-orange-500' :
                                activity.type === 'swimming' ? 'bg-blue-500' :
                                activity.type === 'jumprope' ? 'bg-purple-500' :
                                'bg-green-500'
                              }`} />
                              <div>
                                <div className="text-white font-medium">
                                  {activity.type === 'boxing' ? t('endurance.menu.boxing') :
                                   activity.type === 'pushups' ? t('endurance.menu.pushups') :
                                   activity.type === 'swimming' ? t('endurance.menu.swimming') :
                                   activity.type === 'jumprope' ? t('endurance.menu.jumprope') :
                                   t('endurance.menu.running')}
                                </div>
                                <div className="text-slate-400 text-sm">{activity.time}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-white font-medium">{activity.duration}</div>
                              {activity.distance && (
                                <div className="text-slate-400 text-sm">{activity.distance}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {getActivitiesForDay(ui.selectedDay).length === 0 && (
                        <div className="text-center py-8 text-slate-400">
                          {t('endurance.calendar.heatmap.noActivities')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal création de défi */}
      {ui.showChallengeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
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
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder={t('endurance.challenges.modal.namePlaceholder')}
                />
              </div>
              
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">{t('endurance.challenges.modal.activityType')}</label>
                <select
                  value={challengeForm.activityType}
                  onChange={(e) => setChallengeForm({...challengeForm, activityType: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                >
                  <option value="pushups">{t('endurance.menu.pushups')}</option>
                  <option value="swimming">{t('endurance.menu.swimming')}</option>
                  <option value="jumprope">{t('endurance.menu.jumprope')}</option>
                  <option value="running">{t('endurance.menu.running')}</option>
                </select>
              </div>
              
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">{t('endurance.challenges.modal.challengeType')}</label>
                <select
                  value={challengeForm.type}
                  onChange={(e) => setChallengeForm({...challengeForm, type: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                >
                  <option value="ponctuel">{t('endurance.challenges.types.ponctuel')}</option>
                  <option value="recurrent">{t('endurance.challenges.types.recurrent')}</option>
                  <option value="periode">{t('endurance.challenges.types.periode')}</option>
                </select>
              </div>

              {challengeForm.type === 'ponctuel' && (
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">{t('endurance.challenges.modal.targetDate')}</label>
                  <input
                    type="date"
                    value={challengeForm.targetDate}
                    onChange={(e) => setChallengeForm({...challengeForm, targetDate: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
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
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
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
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
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
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">{t('endurance.challenges.modal.endDate')}</label>
                    <input
                      type="date"
                      value={challengeForm.endDate}
                      onChange={(e) => setChallengeForm({...challengeForm, endDate: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">
                    {t(`endurance.challenges.modal.goalCount.${challengeForm.activityType}`, { fallback: t('endurance.challenges.modal.goalCount.default') })}
                  </label>
                  <input
                    type="number"
                    value={challengeForm.goalCount}
                    onChange={(e) => setChallengeForm({...challengeForm, goalCount: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
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
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder={t('endurance.challenges.modal.optional')}
                  />
                </div>
              </div>
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
