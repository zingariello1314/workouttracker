import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Calendar, Dumbbell, Waves, Activity, Play, Box, Plus, X, Trash2, Award, Edit, Save, Heart, Zap } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import StarRating from '../ui/StarRating';

const EnduranceTab = () => {
  const { data, updateData, getWorkoutHistory } = useWorkout();
  
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

  const setSessions = useCallback((activityType, newSessions) => {
    setEnduranceState(prev => ({
      ...prev,
      sessions: {
        ...prev.sessions,
        [activityType]: newSessions
      }
    }));
  }, []);

  const setChallenges = useCallback((newChallenges) => {
    setEnduranceState(prev => ({ ...prev, challenges: newChallenges }));
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

  // Charger les données d'endurance depuis les données principales
  useEffect(() => {
    loadEnduranceData();
  }, [data]);

  const loadEnduranceData = useCallback(() => {
    try {
    const enduranceData = data.enduranceData || {};
    
      setEnduranceState(prev => ({
        ...prev,
        sessions: {
          boxing: enduranceData.sessions?.boxing || enduranceData.boxingSessions || [],
          pushups: enduranceData.sessions?.pushups || enduranceData.pushupSessions || [],
          swimming: enduranceData.sessions?.swimming || enduranceData.swimmingSessions || [],
          jumprope: enduranceData.sessions?.jumprope || enduranceData.jumpropeSessions || [],
          running: enduranceData.sessions?.running || enduranceData.runningSessions || []
        },
        challenges: enduranceData.challenges || []
      }));
    } catch (error) {
      console.error('Erreur lors du chargement des données d\'endurance:', error);
    }
  }, [data.enduranceData]);

  const saveEnduranceData = useCallback(async (newData) => {
    try {
      // Validation des données avant sauvegarde
      if (!newData || typeof newData !== 'object') {
        throw new Error('Données invalides pour la sauvegarde');
      }

      // Validation des sessions
      Object.entries(newData).forEach(([key, value]) => {
        if (key.includes('Sessions') && !Array.isArray(value)) {
          throw new Error(`Les sessions ${key} doivent être un tableau`);
        }
        if (key === 'challenges' && !Array.isArray(value)) {
          throw new Error('Les défis doivent être un tableau');
        }
      });

      // 🔧 FUSION INTELLIGENTE : Préserver les données existantes
      const currentData = data || {};
      const currentEnduranceData = currentData.enduranceData || {};
      
      const updatedData = {
        ...currentData, // Préserver TOUTES les données existantes (JSON importé, etc.)
        enduranceData: {
          ...currentEnduranceData, // Préserver les données d'endurance existantes
          ...newData, // Ajouter les nouvelles données d'endurance
          lastUpdated: new Date().toISOString()
        }
      };

      console.log('🔄 Sauvegarde des données d\'endurance:', newData);
      await updateData(updatedData);
      
      // Forcer la mise à jour de l'état local après sauvegarde
      setEnduranceState(prev => ({
        ...prev,
        sessions: {
          boxing: newData.sessions?.boxing || prev.sessions.boxing,
          pushups: newData.sessions?.pushups || prev.sessions.pushups,
          swimming: newData.sessions?.swimming || prev.sessions.swimming,
          jumprope: newData.sessions?.jumprope || prev.sessions.jumprope,
          running: newData.sessions?.running || prev.sessions.running
        },
        challenges: newData.challenges || prev.challenges
      }));
      
      console.log('✅ Données d\'endurance sauvegardées avec succès (fusion intelligente)');
    } catch (error) {
      console.error('❌ Erreur sauvegarde endurance:', error);
      throw error; // Re-throw pour permettre la gestion d'erreur dans les composants appelants
    }
  }, [data, updateData]);

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
      console.error('Erreur lors de la récupération des exercices d\'endurance:', error);
      return [];
    }
  }, [getWorkoutHistory, isEnduranceExercise]);

  // Fonction pour obtenir le nom d'un exercice par son ID
  const getExerciseName = useCallback((exerciseId) => {
    // Cette fonction devrait récupérer le nom depuis votre base de données d'exercices
    // Pour l'instant, on utilise l'ID comme nom (à améliorer avec une vraie base de données)
    return exerciseId || 'Exercice inconnu';
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
  const ChallengeReminder = useMemo(() => {
    const activeChallenges = getActiveChallenges();
    const urgentChallenges = getUrgentChallenges();
    
    if (activeChallenges.length === 0) return null;
    
    return (
      <div className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-500/30 rounded-xl p-4 mb-6 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
            <Award className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-orange-200">
            ⚠️ Vous avez {activeChallenges.length} défi{activeChallenges.length > 1 ? 's' : ''} à accomplir
          </h3>
        </div>
        
        <div className="space-y-2">
          {urgentChallenges.length > 0 && (
            <div className="text-red-300 text-sm font-medium">
              🚨 {urgentChallenges.length} défi{urgentChallenges.length > 1 ? 's' : ''} urgent{urgentChallenges.length > 1 ? 's' : ''} (échéance &lt; 24h)
            </div>
          )}
          
          <div className="flex flex-wrap gap-2">
            {activeChallenges.slice(0, 3).map(challenge => (
              <button
                key={challenge.id}
                onClick={() => setActiveTab(challenge.activityType)}
                className="px-3 py-1 bg-orange-500/30 hover:bg-orange-500/50 text-orange-200 rounded-lg text-sm transition-colors"
              >
                {challenge.name}
              </button>
            ))}
            {activeChallenges.length > 3 && (
              <span className="px-3 py-1 text-orange-300 text-sm">
                +{activeChallenges.length - 3} autres...
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }, [getActiveChallenges, getUrgentChallenges, setActiveTab]);

  // Formulaires pour chaque type d'activité
  const [sessionForm, setSessionForm] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    count: '',
    duration: '',
    notes: '',
    // Évaluations par étoiles
    congestion: 0,
    motivation: 0,
    sentimentAvant: 0,
    sentimentApres: 0
  });

  const [boxingForm, setBoxingForm] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    duration: '',
    notes: '',
    // Évaluations par étoiles
    congestion: 0,
    motivation: 0,
    sentimentAvant: 0,
    sentimentApres: 0
  });

  const [swimmingForm, setSwimmingForm] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    swimType: 'crawl',
    laps: [{ distance: 25, time: '' }],
    notes: '',
    // Nouveaux champs pour la natation
    heartRate: '', // Fréquence cardiaque moyenne (bpm)
    calories: '', // Calories dépensées
    pace100m: '', // Allure moyenne sur 100m (mm:ss)
    // Évaluations par étoiles
    congestion: 0,
    motivation: 0,
    sentimentAvant: 0,
    sentimentApres: 0
  });

  const [jumpropeForm, setJumpropeForm] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    duration: '',
    type: 'continue',
    jumps: '',
    sessionNumber: 1,
    // Nouveaux champs métriques
    hrMax: '', // BPM max
    hrAvg: '', // BPM moyen
    bestStreak: '', // meilleure série de sauts
    jumpsPerMin: '', // moyenne sauts/min
    calories: '', // calories brûlées
    notes: '',
    // Évaluations par étoiles
    congestion: 0,
    motivation: 0,
    sentimentAvant: 0,
    sentimentApres: 0,
    // Nouveaux critères
    fluidite: 0,
    transpiration: 0
  });

  const [runningForm, setRunningForm] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    distance: '',
    duration: '',
    type: 'endurance',
    elevation: '',
    notes: '',
    // Évaluations par étoiles
    congestion: 0,
    motivation: 0,
    sentimentAvant: 0,
    sentimentApres: 0
  });

  const [challengeForm, setChallengeForm] = useState({
    name: '',
    type: 'ponctuel',
    targetDate: '',
    startDate: '',
    endDate: '',
    frequency: 'daily',
    moment: 'matin',
    goalCount: '',
    goalDuration: '',
    goalDistance: '',
    activityType: 'pushups'
  });

  // Fonction de validation des défis (améliorée)
  const validateChallenges = useCallback((sessionData, activityType) => {
    const validatedChallengeIds = [];
    const updatedChallenges = challenges.map(challenge => {
      if (challenge.activityType !== activityType || challenge.status !== 'active') {
        return challenge;
      }

      let isValid = false;
      
      switch (challenge.type) {
        case 'ponctuel':
          isValid = validatePonctuelChallenge(challenge, sessionData);
          break;
        case 'recurrent':
          isValid = validateRecurrentChallenge(challenge, sessionData);
          break;
        case 'periode':
          isValid = validatePeriodeChallenge(challenge, sessionData);
          break;
        default:
          isValid = false;
      }

      if (isValid) {
        validatedChallengeIds.push(challenge.id);
        // Pour les défis récurrents, on ne les "termine" pas définitivement
        if (challenge.type === 'recurrent') {
          return {
            ...challenge,
            status: 'active',
            lastCompletedDate: sessionData.date, // YYYY-MM-DD
            completedSessionId: sessionData.id
          };
        }
        // Ponctuels / période → marqués comme complétés
        return { 
          ...challenge, 
          status: 'completed', 
          completedAt: new Date().toISOString(),
          completedSessionId: sessionData.id
        };
      }
      
      return challenge;
    });

    return { validatedChallengeIds, updatedChallenges };
  }, [challenges]);

  // Validation pour défis ponctuels
  const validatePonctuelChallenge = useCallback((challenge, sessionData) => {
    const sessionDate = new Date(sessionData.date);
    const targetDate = new Date(challenge.targetDate);
    
    // Vérifier si la session est dans la période de validité (permet les dates antérieures)
    // Pour les défis antérieurs, on vérifie que la session est antérieure ou égale à la date cible
    if (sessionDate > targetDate) return false;
    
    // Vérifier les objectifs selon l'activité
    switch (challenge.activityType) {
      case 'pushups':
        return (!challenge.goalCount || parseInt(sessionData.count) >= challenge.goalCount) &&
               (!challenge.goalDuration || parseFloat(sessionData.duration) <= challenge.goalDuration);
      case 'swimming':
        // totalTime est en secondes, convertir en minutes pour la comparaison
        const totalTimeMinutes = typeof sessionData.totalTime === 'number' ? 
          sessionData.totalTime / 60 : parseFloat(sessionData.totalTime || 0) / 60;
        return (!challenge.goalDistance || parseFloat(sessionData.totalDistance) >= challenge.goalDistance) &&
               (!challenge.goalDuration || totalTimeMinutes <= challenge.goalDuration);
      case 'running':
        return (!challenge.goalDistance || parseFloat(sessionData.distance) >= challenge.goalDistance) &&
               (!challenge.goalDuration || parseFloat(sessionData.duration) <= challenge.goalDuration);
      case 'jumprope':
        return (!challenge.goalDuration || parseFloat(sessionData.duration) >= challenge.goalDuration) &&
               (!challenge.goalJumps || parseInt(sessionData.jumps) >= challenge.goalJumps);
      default:
        return false;
    }
  }, []);

  // Validation pour défis récurrents
  const validateRecurrentChallenge = useCallback((challenge, sessionData) => {
    // Défis récurrents : vérifier la fréquence et les objectifs
    const sessionDate = new Date(sessionData.date);
    
    // Vérifier si la session est dans la période de validité (permet les dates antérieures)
    if (challenge.endDate && sessionDate > new Date(challenge.endDate)) return false;
    if (challenge.startDate && sessionDate < new Date(challenge.startDate)) return false;
    
    // Vérifier la fréquence selon le type
    switch (challenge.frequency) {
      case 'daily':
        // Vérifier si c'est le bon moment de la journée
        if (challenge.timeOfDay && challenge.timeOfDay !== sessionData.timeOfDay) return false;
        break;
      case 'weekly':
        // Vérifier si c'est le bon jour de la semaine
        if (challenge.dayOfWeek && challenge.dayOfWeek !== sessionDate.getDay()) return false;
        break;
    }
    
    // Vérifier les objectifs
    return validatePonctuelChallenge(challenge, sessionData);
  }, [validatePonctuelChallenge]);

  // Validation pour défis sur période
  const validatePeriodeChallenge = useCallback((challenge, sessionData) => {
    const sessionDate = new Date(sessionData.date);
    const startDate = new Date(challenge.startDate);
    const endDate = new Date(challenge.endDate);
    
    // Vérifier si la session est dans la période (permet les dates antérieures)
    if (sessionDate < startDate || sessionDate > endDate) return false;
    
    // Pour les défis sur période, on accumule les sessions
    // Cette fonction sera appelée pour chaque session et la progression sera calculée séparément
    return validatePonctuelChallenge(challenge, sessionData);
  }, [validatePonctuelChallenge]);

  // Fonctions d'ajout de sessions (refactorisées)
  const addSession = useCallback(async (activityType, sessionData) => {
    try {
    const newSession = {
      id: Date.now(),
        ...sessionData,
      validatedChallenges: []
    };

      // Validation des défis
      const { validatedChallengeIds, updatedChallenges } = validateChallenges(sessionData, activityType);
      newSession.validatedChallenges = validatedChallengeIds;

      // Mise à jour des sessions
      const currentSessions = sessions[activityType] || [];
      const updatedSessions = [...currentSessions, newSession];
      
      setSessions(activityType, updatedSessions);
      setChallenges(updatedChallenges);
      
      // Sauvegarde avec structure cohérente
      const saveData = {
        sessions: {
          ...sessions,
          [activityType]: updatedSessions
        },
        challenges: updatedChallenges
      };
      
      await saveEnduranceData(saveData);

      // Notification de succès
      if (validatedChallengeIds.length > 0) {
        console.log(`🎉 ${validatedChallengeIds.length} défi(s) validé(s) !`);
      }

      return { success: true, validatedChallenges: validatedChallengeIds };
    } catch (error) {
      console.error(`❌ Erreur lors de l'ajout de la session ${activityType}:`, error);
      return { success: false, error: error.message };
    }
  }, [sessions, validateChallenges, setSessions, setChallenges, saveEnduranceData]);

  // Fonction de modification des sessions
  const updateSession = useCallback(async (activityType, sessionId, updatedData) => {
    try {
      const currentSessions = sessions[activityType] || [];
      const updatedSessions = currentSessions.map(session => 
        session.id === sessionId ? { ...session, ...updatedData } : session
      );
      
      setSessions(activityType, updatedSessions);
      
      // Sauvegarde
      const saveData = {
        sessions: {
          ...sessions,
          [activityType]: updatedSessions
        }
      };
      
      await saveEnduranceData(saveData);
      
      // Fermer le mode édition
      setUI({ 
        editingSession: null, 
        showSessionForm: false,
        allowPastDates: false
      });
      
      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la modification de la session:', error);
      return { success: false, error: error.message };
    }
  }, [sessions, setSessions, setUI, saveEnduranceData]);

  // Fonctions de reset des formulaires
  const resetPushupForm = useCallback(() => {
    setSessionForm({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      count: '',
      duration: '',
      notes: '',
      // Évaluations par étoiles
      congestion: 0,
      motivation: 0,
      sentimentAvant: 0,
      sentimentApres: 0
    });
  }, []);

  const resetBoxingForm = useCallback(() => {
    setBoxingForm({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      duration: '',
      notes: '',
      // Évaluations par étoiles
      congestion: 0,
      motivation: 0,
      sentimentAvant: 0,
      sentimentApres: 0
    });
  }, []);

  const resetSwimmingForm = useCallback(() => {
    setSwimmingForm({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      swimType: 'crawl',
      laps: [{ distance: 25, time: '' }],
      notes: '',
      // Nouveaux champs pour la natation
      heartRate: '',
      calories: '',
      pace100m: '',
      // Évaluations par étoiles
      congestion: 0,
      motivation: 0,
      sentimentAvant: 0,
      sentimentApres: 0
    });
  }, []);

  const resetJumpropeForm = useCallback(() => {
    setJumpropeForm({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      duration: '',
      type: 'continue',
      jumps: '',
      sessionNumber: 1,
      hrMax: '',
      hrAvg: '',
      bestStreak: '',
      jumpsPerMin: '',
      calories: '',
      notes: '',
      // Évaluations par étoiles
      congestion: 0,
      motivation: 0,
      sentimentAvant: 0,
      sentimentApres: 0,
      fluidite: 0,
      transpiration: 0
    });
  }, []);

  const resetRunningForm = useCallback(() => {
    setRunningForm({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      distance: '',
      duration: '',
      type: 'endurance',
      elevation: '',
      notes: '',
      // Évaluations par étoiles
      congestion: 0,
      motivation: 0,
      sentimentAvant: 0,
      sentimentApres: 0
    });
  }, []);

  const resetChallengeForm = useCallback(() => {
    setChallengeForm({
      name: '',
      type: 'ponctuel',
      targetDate: '',
      startDate: '',
      endDate: '',
      frequency: 'daily',
      moment: 'matin',
      goalCount: '',
      goalDuration: '',
      goalDistance: '',
      notes: ''
    });
  }, []);

  // Fonctions spécifiques pour chaque activité
  const addPushupSession = useCallback(async () => {
    if (ui.editingSession) {
      // Mode modification
      const result = await updateSession(ui.editingSession.activityType, ui.editingSession.sessionId, sessionForm);
      if (result.success) {
        resetPushupForm();
      }
      return result;
    } else {
      // Mode création
      const result = await addSession('pushups', sessionForm);
      if (result.success) {
        resetPushupForm();
        setUI({ showSessionForm: false });
      }
      return result;
    }
  }, [addSession, updateSession, sessionForm, ui.editingSession, resetPushupForm, setUI]);

  const addBoxingSession = useCallback(async () => {
    if (ui.editingSession) {
      // Mode modification
      const result = await updateSession(ui.editingSession.activityType, ui.editingSession.sessionId, boxingForm);
      if (result.success) {
        resetBoxingForm();
      }
      return result;
    } else {
      // Mode création
      const result = await addSession('boxing', boxingForm);
      if (result.success) {
        resetBoxingForm();
        setUI({ showSessionForm: false });
      }
      return result;
    }
  }, [addSession, updateSession, boxingForm, ui.editingSession, resetBoxingForm, setUI]);

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
    
    const result = await addSession('swimming', sessionData);
    if (result.success) {
      resetSwimmingForm();
      setUI({ showSessionForm: false });
    }
    return result;
  }, [addSession, swimmingForm]);

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

    const result = await addSession('jumprope', sessionData);
    if (result.success) {
      resetJumpropeForm();
      setUI({ showSessionForm: false });
    }
    return result;
  }, [addSession, jumpropeForm]);

  const addRunningSession = useCallback(async () => {
    const result = await addSession('running', runningForm);
    if (result.success) {
    resetRunningForm();
      setUI({ showSessionForm: false });
    }
    return result;
  }, [addSession, runningForm]);



  // Fonction d'ajout de défi (améliorée)
  const addChallenge = useCallback(async () => {
    try {
      // Validation des données du défi
      if (!challengeForm.name || !challengeForm.activityType) {
        throw new Error('Nom et type d\'activité requis');
      }

    const newChallenge = {
      id: Date.now(),
      ...challengeForm,
      status: 'active',
      createdAt: new Date().toISOString(),
      progress: 0
    };

    const updatedChallenges = [...challenges, newChallenge];
    setChallenges(updatedChallenges);
    
    await saveEnduranceData({
      challenges: updatedChallenges
    });

    resetChallengeForm();
      setUI({ showChallengeModal: false });
      
      console.log('✅ Défi créé avec succès');
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur lors de la création du défi:', error);
      return { success: false, error: error.message };
    }
  }, [challengeForm, challenges, setChallenges, saveEnduranceData]);


  // Fonctions de suppression (refactorisées)
  const deleteSession = useCallback(async (activityType, id) => {
    try {
      const currentSessions = enduranceState?.sessions || {};
      const activitySessions = currentSessions[activityType] || [];
      const updatedSessions = activitySessions.filter(s => s.id !== id);
      
      setSessions(activityType, updatedSessions);
      
      await saveEnduranceData({
        sessions: {
          ...currentSessions,
          [activityType]: updatedSessions
        }
      });
      
      console.log(`✅ Session ${activityType} supprimée avec succès`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Erreur lors de la suppression de la session ${activityType}:`, error);
      return { success: false, error: error.message };
    }
  }, [enduranceState?.sessions, setSessions, saveEnduranceData]);

  const deleteChallenge = useCallback(async (id) => {
    try {
      const updatedChallenges = challenges.filter(c => c.id !== id);
      setChallenges(updatedChallenges);
      
      await saveEnduranceData({
        challenges: updatedChallenges
      });
      
      console.log('✅ Défi supprimé avec succès');
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du défi:', error);
      return { success: false, error: error.message };
    }
  }, [challenges, setChallenges, saveEnduranceData]);

  // Fonctions spécifiques pour chaque activité
  const deletePushupSession = useCallback((id) => deleteSession('pushups', id), [deleteSession]);
  const deleteBoxingSession = useCallback((id) => deleteSession('boxing', id), [deleteSession]);
  const deleteSwimmingSession = useCallback((id) => deleteSession('swimming', id), [deleteSession]);
  const deleteJumpropeSession = useCallback((id) => deleteSession('jumprope', id), [deleteSession]);
  const deleteRunningSession = useCallback((id) => deleteSession('running', id), [deleteSession]);

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
      
      setChallenges(updatedChallenges);
      
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
      console.error('Erreur lors de la modification du défi:', error);
      return { success: false, error: error.message };
    }
  }, [challenges, setChallenges, setUI, saveEnduranceData]);

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

  const getMonthLabels = () => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    return months;
  };

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

  const menuItems = [
    { id: 'boxing', label: 'Boxe', icon: Box },
    { id: 'pushups', label: 'Pompes', icon: Dumbbell },
    { id: 'swimming', label: 'Natation', icon: Waves },
    { id: 'jumprope', label: 'Corde à sauter', icon: Activity },
    { id: 'running', label: 'Course', icon: Play },
    { id: 'calendar', label: 'Calendrier', icon: Calendar }
  ];

  // Composant pour afficher les exercices d'endurance depuis l'historique (optimisé)
  const EnduranceHistorySection = useMemo(() => {
    const enduranceExercises = getEnduranceExercisesFromHistory();
    
    if (enduranceExercises.length === 0) {
      return (
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Exercices d'Endurance depuis vos Séances</h3>
          <p className="text-slate-400">Aucun exercice d'endurance trouvé dans vos séances passées.</p>
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
                  <span className="text-slate-400 ml-2">{exercise.reps} répétitions</span>
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
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Menu latéral */}
      <div className="w-72 bg-slate-900/50 backdrop-blur-xl border-r border-slate-700/50">
        <div className="p-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-violet-500 bg-clip-text text-transparent">
            Endurance
          </h1>
          <p className="text-slate-400 text-sm mt-2">Suivez votre progression</p>
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
          {ChallengeReminder}
          
          {/* Section exercices d'endurance depuis l'historique */}
          {EnduranceHistorySection}

          {/* SECTION BOXE */}
          {activeTab === 'boxing' && (
            <>
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-4xl font-bold text-white mb-2">Boxe</h2>
                  <p className="text-slate-400">Enregistrez vos sessions d'entraînement</p>
                </div>
                <div className="flex gap-3">
                <button
                    onClick={() => setUI({ showSessionForm: !ui.showSessionForm })}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
                >
                  <Plus className="w-5 h-5" />
                  Nouvelle session
                </button>
                  <button
                    onClick={() => setUI({ showSessionForm: !ui.showSessionForm, allowPastDates: true })}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-orange-500/50 transition-all duration-300 hover:scale-105"
                  >
                    <Calendar className="w-5 h-5" />
                    Données antérieures
                  </button>
                </div>
              </div>

              {/* Formulaire de session boxe */}
              {ui.showSessionForm && (
                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 mb-8 shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-white">
                      {ui.editingSession ? 'Modifier la session de boxe' : 'Enregistrer une session de boxe'}
                    </h3>
                    {ui.allowPastDates && (
                      <span className="bg-orange-500/20 border border-orange-500/30 text-orange-400 px-3 py-1 rounded-lg text-sm font-medium">
                        📅 Mode données antérieures
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">Date</label>
                      <input
                        type="date"
                        value={boxingForm.date}
                        onChange={(e) => setBoxingForm({...boxingForm, date: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">Heure</label>
                      <input
                        type="time"
                        value={boxingForm.time}
                        onChange={(e) => setBoxingForm({...boxingForm, time: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-slate-300 text-sm font-medium mb-2">Durée (minutes)</label>
                      <input
                        type="number"
                        step="5"
                        value={boxingForm.duration}
                        onChange={(e) => setBoxingForm({...boxingForm, duration: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="Ex: 60"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-slate-300 text-sm font-medium mb-2">Notes</label>
                      <textarea
                        value={boxingForm.notes}
                        onChange={(e) => setBoxingForm({...boxingForm, notes: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                        rows="3"
                        placeholder="Type d'entraînement, sparring, sac..."
                      />
                    </div>
                  </div>
                  
                  {/* Évaluations par étoiles */}
                  <div className="mt-6 p-4 bg-slate-800/30 rounded-xl border border-slate-600/30">
                    <h4 className="text-slate-200 font-semibold mb-4 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      Évaluation de la session
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <StarRating
                          label="Congestion musculaire"
                          rating={boxingForm.congestion}
                          onRatingChange={(rating) => setBoxingForm({...boxingForm, congestion: rating})}
                          size="md"
                        />
                        <StarRating
                          label="Motivation"
                          rating={boxingForm.motivation}
                          onRatingChange={(rating) => setBoxingForm({...boxingForm, motivation: rating})}
                          size="md"
                        />
                      </div>
                      <div className="space-y-4">
                        <StarRating
                          label="Sentiment avant"
                          rating={boxingForm.sentimentAvant}
                          onRatingChange={(rating) => setBoxingForm({...boxingForm, sentimentAvant: rating})}
                          size="md"
                        />
                        <StarRating
                          label="Sentiment après"
                          rating={boxingForm.sentimentApres}
                          onRatingChange={(rating) => setBoxingForm({...boxingForm, sentimentApres: rating})}
                          size="md"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => setUI({ showSessionForm: false })}
                      className="px-6 py-3 text-slate-300 border border-slate-600/50 rounded-xl hover:bg-slate-700/50 transition-all"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={addBoxingSession}
                      className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all flex items-center gap-2"
                    >
                      {ui.editingSession ? (
                        <>
                          <Save className="w-4 h-4" />
                          Modifier
                        </>
                      ) : (
                        'Enregistrer'
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Historique boxe */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">Historique</h3>
                <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
                  {sessions.boxing.length === 0 ? (
                    <div className="p-12 text-center">
                      <Box className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400 text-lg">Aucune session enregistrée</p>
                      <p className="text-slate-500 text-sm mt-2">Commencez par créer votre première session</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-700/50">
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Date</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Heure</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Durée</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Notes</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sessions.boxing.sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time)).map((session, idx) => (
                            <tr 
                              key={session.id} 
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
                                    onClick={() => editSession('boxing', session.id)}
                                    className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                                    title="Modifier la session"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                <button
                                  onClick={() => deleteBoxingSession(session.id)}
                                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                    title="Supprimer la session"
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
              {/* Header */}
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-4xl font-bold text-white mb-2">Pompes</h2>
                  <p className="text-slate-400">Gérez vos sessions et défis</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setUI({ showSessionForm: !ui.showSessionForm })}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
                  >
                    <Plus className="w-5 h-5" />
                    Nouvelle session
                  </button>
                  <button
                    onClick={() => setUI({ showSessionForm: !ui.showSessionForm, allowPastDates: true })}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-orange-500/50 transition-all duration-300 hover:scale-105"
                  >
                    <Calendar className="w-5 h-5" />
                    Données antérieures
                  </button>
                  <button
                    onClick={() => setUI({ showChallengeModal: true })}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-pink-500/50 transition-all duration-300 hover:scale-105"
                  >
                    <Award className="w-5 h-5" />
                    Créer un défi
                  </button>
                </div>
              </div>

              {/* Rappel défis actifs */}
              {activeChallenges.length > 0 && (
                <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm border border-amber-500/30 rounded-2xl p-6 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="bg-amber-500/20 p-3 rounded-xl">
                      <Award className="w-6 h-6 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg mb-2">
                        {activeChallenges.length} défi{activeChallenges.length > 1 ? 's' : ''} en cours
                      </h3>
                      <div className="space-y-2">
                        {activeChallenges.map(c => (
                          <div key={c.id} className="text-amber-200 text-sm flex items-center gap-2">
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
                  <h3 className="text-2xl font-bold text-white mb-6">Enregistrer une session</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">Date</label>
                      <input
                        type="date"
                        value={sessionForm.date}
                        onChange={(e) => setSessionForm({...sessionForm, date: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">Heure</label>
                      <input
                        type="time"
                        value={sessionForm.time}
                        onChange={(e) => setSessionForm({...sessionForm, time: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">Nombre de pompes</label>
                      <input
                        type="number"
                        value={sessionForm.count}
                        onChange={(e) => setSessionForm({...sessionForm, count: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="Ex: 50"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">Durée (minutes)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={sessionForm.duration}
                        onChange={(e) => setSessionForm({...sessionForm, duration: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="Ex: 5"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-slate-300 text-sm font-medium mb-2">Notes</label>
                      <textarea
                        value={sessionForm.notes}
                        onChange={(e) => setSessionForm({...sessionForm, notes: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                        rows="3"
                        placeholder="Commentaires optionnels..."
                      />
                    </div>
                  </div>
                  
                  {/* Évaluations par étoiles */}
                  <div className="mt-6 p-4 bg-slate-800/30 rounded-xl border border-slate-600/30">
                    <h4 className="text-slate-200 font-semibold mb-4 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      Évaluation de la session
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <StarRating
                          label="Congestion musculaire"
                          rating={sessionForm.congestion}
                          onRatingChange={(rating) => setSessionForm({...sessionForm, congestion: rating})}
                          size="md"
                        />
                        <StarRating
                          label="Motivation"
                          rating={sessionForm.motivation}
                          onRatingChange={(rating) => setSessionForm({...sessionForm, motivation: rating})}
                          size="md"
                        />
                      </div>
                      <div className="space-y-4">
                        <StarRating
                          label="Sentiment avant"
                          rating={sessionForm.sentimentAvant}
                          onRatingChange={(rating) => setSessionForm({...sessionForm, sentimentAvant: rating})}
                          size="md"
                        />
                        <StarRating
                          label="Sentiment après"
                          rating={sessionForm.sentimentApres}
                          onRatingChange={(rating) => setSessionForm({...sessionForm, sentimentApres: rating})}
                          size="md"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => setUI({ showSessionForm: false })}
                      className="px-6 py-3 text-slate-300 border border-slate-600/50 rounded-xl hover:bg-slate-700/50 transition-all"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={addPushupSession}
                      className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all"
                    >
                      Enregistrer
                    </button>
                  </div>
                </div>
              )}

              {/* Liste des défis */}
              {challenges.filter(c => c.activityType === 'pushups').length > 0 && (
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-white mb-6">Défis</h3>
                  <div className="grid gap-4">
                    {challenges.filter(c => c.activityType === 'pushups').map(challenge => (
                      <div key={challenge.id} className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-xl border border-slate-600/50 rounded-2xl p-6 hover:border-purple-500/50 transition-all">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Award className="w-5 h-5 text-purple-400" />
                              <h4 className="font-bold text-xl text-white">{challenge.name}</h4>
                            </div>
                            <div className="space-y-1 text-slate-400 text-sm">
                              <p>
                                {challenge.type === 'ponctuel' && `📅 Date cible: ${challenge.targetDate}`}
                                {challenge.type === 'recurrent' && `🔄 ${challenge.frequency === 'daily' ? 'Quotidien' : 'Hebdomadaire'} - ${challenge.moment}`}
                                {challenge.type === 'periode' && `📆 ${challenge.startDate} → ${challenge.endDate}`}
                              </p>
                              <p className="text-purple-300">
                                🎯 Objectif: {challenge.goalCount && `${challenge.goalCount} pompes`}
                                {challenge.goalCount && challenge.goalDuration && ' en '}
                                {challenge.goalDuration && `${challenge.goalDuration} min`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-4 py-2 rounded-xl text-sm font-medium ${
                              challenge.status === 'active' 
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            }`}>
                              {challenge.status === 'active' ? '🔥 En cours' : '✅ Terminé'}
                            </span>
                            <button
                              onClick={() => editChallenge(challenge.id)}
                              className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                              title="Modifier le défi"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => deleteChallenge(challenge.id)}
                              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                              title="Supprimer le défi"
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
                <h3 className="text-2xl font-bold text-white mb-6">Historique</h3>
                <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
                  {sessions.pushups.length === 0 ? (
                    <div className="p-12 text-center">
                      <Dumbbell className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400 text-lg">Aucune session enregistrée</p>
                      <p className="text-slate-500 text-sm mt-2">Commencez par créer votre première session</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-700/50">
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Date</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Heure</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Pompes</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Durée</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Notes</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sessions.pushups.sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time)).map((session, idx) => (
                            <tr 
                              key={session.id} 
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
                                      ✓ Défi validé
                                    </span>
                                  )}
                                  <button
                                    onClick={() => editSession('pushups', session.id)}
                                    className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                                    title="Modifier la session"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => deletePushupSession(session.id)}
                                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                    title="Supprimer la session"
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

          {/* SECTION NATATION */}
          {activeTab === 'swimming' && (
            <>
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-4xl font-bold text-white mb-2">Natation</h2>
                  <p className="text-slate-400">Suivez vos longueurs et performances</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setUI({ showSessionForm: !ui.showSessionForm })}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
                  >
                    <Plus className="w-5 h-5" />
                    Nouvelle session
                  </button>
                  <button
                    onClick={() => setUI({ showChallengeModal: true })}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-pink-500/50 transition-all duration-300 hover:scale-105"
                  >
                    <Award className="w-5 h-5" />
                    Créer un défi
                  </button>
                </div>
              </div>

              {activeChallenges.length > 0 && (
                <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm border border-amber-500/30 rounded-2xl p-6 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="bg-amber-500/20 p-3 rounded-xl">
                      <Award className="w-6 h-6 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg mb-2">
                        {activeChallenges.length} défi{activeChallenges.length > 1 ? 's' : ''} en cours
                      </h3>
                      <div className="space-y-2">
                        {activeChallenges.map(c => (
                          <div key={c.id} className="text-amber-200 text-sm flex items-center gap-2">
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
                  <h3 className="text-2xl font-bold text-white mb-6">Enregistrer une session de natation</h3>
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">Date</label>
                      <input
                        type="date"
                        value={swimmingForm.date}
                        onChange={(e) => setSwimmingForm({...swimmingForm, date: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">Heure</label>
                      <input
                        type="time"
                        value={swimmingForm.time}
                        onChange={(e) => setSwimmingForm({...swimmingForm, time: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-slate-300 text-sm font-medium mb-2">Type de nage</label>
                      <select
                        value={swimmingForm.swimType}
                        onChange={(e) => setSwimmingForm({...swimmingForm, swimType: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                      >
                        <option value="crawl">Crawl</option>
                        <option value="brasse">Brasse</option>
                        <option value="dos">Dos</option>
                        <option value="papillon">Papillon</option>
                        <option value="mixte">Mixte</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-white font-semibold">Longueurs</h4>
                      <button
                        onClick={addLap}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        Ajouter une longueur
                      </button>
                    </div>
                    <div className="space-y-3">
                      {swimmingForm.laps.map((lap, index) => (
                        <div key={index} className="flex gap-3 items-center bg-slate-900/30 p-4 rounded-xl">
                          <span className="text-slate-400 font-medium w-8">#{index + 1}</span>
                          <div className="flex-1">
                            <label className="block text-slate-400 text-xs mb-1">Distance (m)</label>
                            <input
                              type="number"
                              value={lap.distance}
                              onChange={(e) => updateLap(index, 'distance', e.target.value)}
                              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-slate-400 text-xs mb-1">Temps (mm:ss)</label>
                            <input
                              type="text"
                              value={lap.time}
                              onChange={(e) => updateLap(index, 'time', e.target.value)}
                              placeholder="1:30"
                              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                            />
                          </div>
                          {swimmingForm.laps.length > 1 && (
                            <button
                              onClick={() => removeLap(index)}
                              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Nouveaux champs pour la natation */}
                  <div className="mb-6 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                    <h4 className="text-blue-200 font-semibold mb-4 flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Métriques avancées
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-slate-300 text-sm font-medium mb-2">Fréquence cardiaque moyenne</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={swimmingForm.heartRate}
                            onChange={(e) => setSwimmingForm({...swimmingForm, heartRate: e.target.value})}
                            placeholder="150"
                            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                          />
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm">bpm</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-slate-300 text-sm font-medium mb-2">Calories dépensées</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={swimmingForm.calories}
                            onChange={(e) => setSwimmingForm({...swimmingForm, calories: e.target.value})}
                            placeholder="300"
                            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                          />
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm">kcal</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-slate-300 text-sm font-medium mb-2">Allure 100m</label>
                        <input
                          type="text"
                          value={swimmingForm.pace100m}
                          onChange={(e) => setSwimmingForm({...swimmingForm, pace100m: e.target.value})}
                          placeholder="1:45"
                          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-slate-300 text-sm font-medium mb-2">Notes</label>
                    <textarea
                      value={swimmingForm.notes}
                      onChange={(e) => setSwimmingForm({...swimmingForm, notes: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                      rows="3"
                      placeholder="Commentaires sur la séance..."
                    />
                  </div>

                  {/* Évaluations par étoiles */}
                  <div className="mt-6 p-4 bg-slate-800/30 rounded-xl border border-slate-600/30">
                    <h4 className="text-slate-200 font-semibold mb-4 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      Évaluation de la session
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <StarRating
                          label="Congestion musculaire"
                          rating={swimmingForm.congestion}
                          onRatingChange={(rating) => setSwimmingForm({...swimmingForm, congestion: rating})}
                          size="md"
                        />
                        <StarRating
                          label="Motivation"
                          rating={swimmingForm.motivation}
                          onRatingChange={(rating) => setSwimmingForm({...swimmingForm, motivation: rating})}
                          size="md"
                        />
                      </div>
                      <div className="space-y-4">
                        <StarRating
                          label="Sentiment avant"
                          rating={swimmingForm.sentimentAvant}
                          onRatingChange={(rating) => setSwimmingForm({...swimmingForm, sentimentAvant: rating})}
                          size="md"
                        />
                        <StarRating
                          label="Sentiment après"
                          rating={swimmingForm.sentimentApres}
                          onRatingChange={(rating) => setSwimmingForm({...swimmingForm, sentimentApres: rating})}
                          size="md"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => setUI({ showSessionForm: false })}
                      className="px-6 py-3 text-slate-300 border border-slate-600/50 rounded-xl hover:bg-slate-700/50 transition-all"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={addSwimmingSession}
                      className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all"
                    >
                      Enregistrer
                    </button>
                  </div>
                </div>
              )}

              {challenges.filter(c => c.activityType === 'swimming').length > 0 && (
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-white mb-6">Défis</h3>
                  <div className="grid gap-4">
                    {challenges.filter(c => c.activityType === 'swimming').map(challenge => (
                      <div key={challenge.id} className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-xl border border-slate-600/50 rounded-2xl p-6 hover:border-purple-500/50 transition-all">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Award className="w-5 h-5 text-purple-400" />
                              <h4 className="font-bold text-xl text-white">{challenge.name}</h4>
                            </div>
                            <div className="space-y-1 text-slate-400 text-sm">
                              <p>
                                {challenge.type === 'ponctuel' && `📅 Date cible: ${challenge.targetDate}`}
                                {challenge.type === 'recurrent' && `🔄 ${challenge.frequency === 'daily' ? 'Quotidien' : 'Hebdomadaire'}`}
                                {challenge.type === 'periode' && `📆 ${challenge.startDate} → ${challenge.endDate}`}
                              </p>
                              <p className="text-purple-300">
                                🎯 Objectif: {challenge.goalDistance && `${challenge.goalDistance}m`}
                                {challenge.goalDistance && challenge.goalTime && ' en '}
                                {challenge.goalTime && `${challenge.goalTime} min`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-4 py-2 rounded-xl text-sm font-medium ${
                              challenge.status === 'active' 
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            }`}>
                              {challenge.status === 'active' ? '🔥 En cours' : '✅ Terminé'}
                            </span>
                            <button
                              onClick={() => editChallenge(challenge.id)}
                              className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                              title="Modifier le défi"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => deleteChallenge(challenge.id)}
                              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                              title="Supprimer le défi"
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
                <h3 className="text-2xl font-bold text-white mb-6">Historique</h3>
                <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
                  {sessions.swimming.length === 0 ? (
                    <div className="p-12 text-center">
                      <Waves className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400 text-lg">Aucune session enregistrée</p>
                      <p className="text-slate-500 text-sm mt-2">Commencez par créer votre première session</p>
                    </div>
                  ) : (
                    <div className="space-y-4 p-6">
                      {sessions.swimming.sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time)).map((session) => (
                        <div key={session.id} className="bg-slate-900/30 border border-slate-700/50 rounded-xl p-6 hover:border-purple-500/30 transition-all">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-white font-bold text-lg">{session.date}</span>
                                <span className="text-slate-400">{session.time}</span>
                                <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg text-sm">
                                  {session.swimType ? (session.swimType.charAt(0).toUpperCase() + session.swimType.slice(1)) : 'Natation'}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="text-slate-400">Distance totale:</span>
                                  <span className="text-white font-bold ml-2">{session.totalDistance}m</span>
                                </div>
                                <div>
                                  <span className="text-slate-400">Temps total:</span>
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
                                  <span className="text-slate-400">Allure moy:</span>
                                  <span className="text-white font-bold ml-2">{session.avgPace}s/25m</span>
                                </div>
                                {session.heartRate && (
                                  <div>
                                    <span className="text-slate-400">FC moyenne:</span>
                                    <span className="text-white font-bold ml-2">{session.heartRate} bpm</span>
                                  </div>
                                )}
                                {session.calories && (
                                  <div>
                                    <span className="text-slate-400">Calories:</span>
                                    <span className="text-white font-bold ml-2">
                                      {typeof session.calories === 'object' 
                                        ? (session.calories.total || session.calories.active || 0) 
                                        : session.calories} kcal
                                    </span>
                                  </div>
                                )}
                                {session.pace100m && (
                                  <div>
                                    <span className="text-slate-400">Allure 100m:</span>
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
                                className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                                title="Modifier la session"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteSwimmingSession(session.id)}
                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                title="Supprimer la session"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          {session.laps && Array.isArray(session.laps) && session.laps.length > 0 && (
                            <div className="border-t border-slate-700/50 pt-4">
                              <h5 className="text-slate-400 text-sm mb-3">Détail des longueurs:</h5>
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
                              <span className="font-medium">Notes:</span> {session.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* SECTION CORDE À SAUTER */}
          {activeTab === 'jumprope' && (
            <>
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-4xl font-bold text-white mb-2">Corde à Sauter</h2>
                  <p className="text-slate-400">Suivez vos sessions et défis</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setUI({ showSessionForm: !ui.showSessionForm })}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
                  >
                    <Plus className="w-5 h-5" />
                    Nouvelle session
                  </button>
                  <button
                    onClick={() => setUI({ showChallengeModal: true })}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-pink-500/50 transition-all duration-300 hover:scale-105"
                  >
                    <Award className="w-5 h-5" />
                    Créer un défi
                  </button>
                </div>
              </div>

              {/* Rappel défis actifs */}
              {activeChallenges.length > 0 && (
                <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm border border-amber-500/30 rounded-2xl p-6 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="bg-amber-500/20 p-3 rounded-xl">
                      <Award className="w-6 h-6 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg mb-2">
                        ⚠️ Vous avez {activeChallenges.length} défi{activeChallenges.length > 1 ? 's' : ''} à accomplir
                      </h3>
                      <div className="space-y-2">
                        {activeChallenges.map(c => (
                          <div key={c.id} className="text-amber-200 text-sm flex items-center gap-2">
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
                  <h3 className="text-2xl font-bold text-white mb-6">Enregistrer une session</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">Date</label>
                      <input
                        type="date"
                        value={jumpropeForm.date}
                        onChange={(e) => setJumpropeForm({...jumpropeForm, date: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">Heure</label>
                      <input
                        type="time"
                        value={jumpropeForm.time}
                        onChange={(e) => setJumpropeForm({...jumpropeForm, time: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">Durée (mm:ss)</label>
                      <input
                        type="text"
                        value={jumpropeForm.duration}
                        onChange={(e) => setJumpropeForm({...jumpropeForm, duration: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="Ex: 5:30"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">Type</label>
                      <select
                        value={jumpropeForm.type}
                        onChange={(e) => setJumpropeForm({...jumpropeForm, type: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                      >
                        <option value="continue">Continue</option>
                        <option value="fractionne">Fractionné</option>
                        <option value="technique">Technique</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">Nombre de sauts (optionnel)</label>
                      <input
                        type="number"
                        value={jumpropeForm.jumps}
                        onChange={(e) => setJumpropeForm({...jumpropeForm, jumps: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="Ex: 500"
                      />
                    </div>
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">BPM max</label>
                    <input
                      type="number"
                      value={jumpropeForm.hrMax}
                      onChange={(e) => setJumpropeForm({...jumpropeForm, hrMax: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                      placeholder="Ex: 185"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">BPM moyen</label>
                    <input
                      type="number"
                      value={jumpropeForm.hrAvg}
                      onChange={(e) => setJumpropeForm({...jumpropeForm, hrAvg: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                      placeholder="Ex: 158"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">Meilleure série (sauts)</label>
                    <input
                      type="number"
                      value={jumpropeForm.bestStreak}
                      onChange={(e) => setJumpropeForm({...jumpropeForm, bestStreak: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                      placeholder="Ex: 220"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">Sauts / minute (moy.)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={jumpropeForm.jumpsPerMin}
                      onChange={(e) => setJumpropeForm({...jumpropeForm, jumpsPerMin: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                      placeholder="Ex: 120"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">Calories brûlées</label>
                    <input
                      type="number"
                      value={jumpropeForm.calories}
                      onChange={(e) => setJumpropeForm({...jumpropeForm, calories: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                      placeholder="Ex: 180"
                    />
                  </div>
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">Session #</label>
                      <input
                        type="number"
                        min="1"
                        value={jumpropeForm.sessionNumber}
                        onChange={(e) => setJumpropeForm({...jumpropeForm, sessionNumber: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-slate-300 text-sm font-medium mb-2">Notes</label>
                      <textarea
                        value={jumpropeForm.notes}
                        onChange={(e) => setJumpropeForm({...jumpropeForm, notes: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                        rows="3"
                        placeholder="Commentaires optionnels..."
                      />
                    </div>
                  </div>
                  
                  {/* Évaluations par étoiles */}
                  <div className="mt-6 p-4 bg-slate-800/30 rounded-xl border border-slate-600/30">
                    <h4 className="text-slate-200 font-semibold mb-4 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      Évaluation de la session
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <StarRating
                          label="Congestion musculaire"
                          rating={jumpropeForm.congestion}
                          onRatingChange={(rating) => setJumpropeForm({...jumpropeForm, congestion: rating})}
                          size="md"
                        />
                        <StarRating
                          label="Motivation"
                          rating={jumpropeForm.motivation}
                          onRatingChange={(rating) => setJumpropeForm({...jumpropeForm, motivation: rating})}
                          size="md"
                        />
                        <StarRating
                          label="Fluidité"
                          rating={jumpropeForm.fluidite}
                          onRatingChange={(rating) => setJumpropeForm({...jumpropeForm, fluidite: rating})}
                          size="md"
                        />
                      </div>
                      <div className="space-y-4">
                        <StarRating
                          label="Sentiment avant"
                          rating={jumpropeForm.sentimentAvant}
                          onRatingChange={(rating) => setJumpropeForm({...jumpropeForm, sentimentAvant: rating})}
                          size="md"
                        />
                        <StarRating
                          label="Sentiment après"
                          rating={jumpropeForm.sentimentApres}
                          onRatingChange={(rating) => setJumpropeForm({...jumpropeForm, sentimentApres: rating})}
                          size="md"
                        />
                        <StarRating
                          label="Transpiration"
                          rating={jumpropeForm.transpiration}
                          onRatingChange={(rating) => setJumpropeForm({...jumpropeForm, transpiration: rating})}
                          size="md"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => setUI({ showSessionForm: false })}
                      className="px-6 py-3 text-slate-300 border border-slate-600/50 rounded-xl hover:bg-slate-700/50 transition-all"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={addJumpropeSession}
                      className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all"
                    >
                      Enregistrer
                    </button>
                    <button
                      onClick={() => {
                        addJumpropeSession();
                        setJumpropeForm({...jumpropeForm, sessionNumber: parseInt(jumpropeForm.sessionNumber) + 1});
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-green-500/50 transition-all"
                    >
                      Enregistrer et créer une autre
                    </button>
                  </div>
                </div>
              )}

              {/* Liste des défis */}
              {challenges.filter(c => c.activityType === 'jumprope').length > 0 && (
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-white mb-6">Défis</h3>
                  <div className="grid gap-4">
                    {challenges.filter(c => c.activityType === 'jumprope').map(challenge => (
                      <div key={challenge.id} className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-xl border border-slate-600/50 rounded-2xl p-6 hover:border-purple-500/50 transition-all">
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
                                {challenge.status === 'active' ? '🔥 En cours' : '✅ Terminé'}
                              </span>
                            </div>
                            <div className="space-y-1 text-slate-400 text-sm">
                              <p>
                                {challenge.type === 'ponctuel' && `📅 Date cible: ${challenge.targetDate}`}
                                {challenge.type === 'recurrent' && `🔄 ${challenge.frequency === 'daily' ? 'Quotidien' : 'Hebdomadaire'} - ${challenge.moment}`}
                                {challenge.type === 'periode' && `📆 ${challenge.startDate} → ${challenge.endDate}`}
                              </p>
                              <p className="text-purple-300">
                                🎯 Objectif: {challenge.goalDuration && `${challenge.goalDuration} min`}
                                {challenge.goalDuration && challenge.goalCount && ' ou '}
                                {challenge.goalCount && `${challenge.goalCount} sauts`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => editChallenge(challenge.id)}
                              className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                              title="Modifier le défi"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => deleteChallenge(challenge.id)}
                              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                              title="Supprimer le défi"
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
                <h3 className="text-2xl font-bold text-white mb-6">Historique</h3>
                <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
                  {sessions.jumprope.length === 0 ? (
                    <div className="p-12 text-center">
                      <Activity className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400 text-lg">Aucune session enregistrée</p>
                      <p className="text-slate-500 text-sm mt-2">Commencez par créer votre première session</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-700/50">
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Date</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Heure</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Durée</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Type</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Sauts</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Session</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Notes</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sessions.jumprope.sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time)).map((session, idx) => (
                            <tr 
                              key={session.id} 
                              className={`border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors ${idx % 2 === 0 ? 'bg-slate-800/20' : 'bg-slate-800/10'}`}
                            >
                              <td className="px-6 py-4 text-slate-300">{session.date}</td>
                              <td className="px-6 py-4 text-slate-300">{session.time}</td>
                              <td className="px-6 py-4">
                                <span className="text-white font-bold text-lg">{session.duration}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg text-xs">
                                  {session.type ? (session.type.charAt(0).toUpperCase() + session.type.slice(1)) : 'Corde à sauter'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-slate-300">{session.jumps || '-'}</td>
                              <td className="px-6 py-4 text-slate-300">#{session.sessionNumber}</td>
                              <td className="px-6 py-4 text-slate-400 text-sm">{session.notes || '-'}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  {session.validatedChallenges?.length > 0 && (
                                    <span className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-400 px-3 py-1 rounded-lg text-xs font-medium">
                                      ✓ Défi validé
                                    </span>
                                  )}
                                  <button
                                    onClick={() => editSession('jumprope', session.id)}
                                    className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                                    title="Modifier la session"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => deleteJumpropeSession(session.id)}
                                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                    title="Supprimer la session"
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

          {/* SECTION COURSE */}
          {activeTab === 'running' && (
            <>
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-4xl font-bold text-white mb-2">Course</h2>
                  <p className="text-slate-400">Suivez vos performances et défis</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setUI({ showSessionForm: !ui.showSessionForm })}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
                  >
                    <Plus className="w-5 h-5" />
                    Nouvelle session
                  </button>
                  <button
                    onClick={() => setUI({ showChallengeModal: true })}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-pink-500/50 transition-all duration-300 hover:scale-105"
                  >
                    <Award className="w-5 h-5" />
                    Créer un défi
                  </button>
                </div>
              </div>

              {/* Rappel défis actifs */}
              {activeChallenges.length > 0 && (
                <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm border border-amber-500/30 rounded-2xl p-6 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="bg-amber-500/20 p-3 rounded-xl">
                      <Award className="w-6 h-6 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg mb-2">
                        ⚠️ Vous avez {activeChallenges.length} défi{activeChallenges.length > 1 ? 's' : ''} à accomplir
                      </h3>
                      <div className="space-y-2">
                        {activeChallenges.map(c => (
                          <div key={c.id} className="text-amber-200 text-sm flex items-center gap-2">
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
                  <h3 className="text-2xl font-bold text-white mb-6">Enregistrer une session</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">Date</label>
                      <input
                        type="date"
                        value={runningForm.date}
                        onChange={(e) => setRunningForm({...runningForm, date: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">Heure</label>
                      <input
                        type="time"
                        value={runningForm.time}
                        onChange={(e) => setRunningForm({...runningForm, time: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">Distance (km)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={runningForm.distance}
                        onChange={(e) => setRunningForm({...runningForm, distance: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="Ex: 5.0"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">Durée (hh:mm:ss)</label>
                      <input
                        type="text"
                        value={runningForm.duration}
                        onChange={(e) => setRunningForm({...runningForm, duration: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="Ex: 0:25:30"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">Type</label>
                      <select
                        value={runningForm.type}
                        onChange={(e) => setRunningForm({...runningForm, type: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                      >
                        <option value="endurance">Endurance</option>
                        <option value="fractionne">Fractionné</option>
                        <option value="recuperation">Récupération</option>
                        <option value="tempo">Tempo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">Dénivelé (m) - Optionnel</label>
                      <input
                        type="number"
                        value={runningForm.elevation}
                        onChange={(e) => setRunningForm({...runningForm, elevation: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="Ex: 150"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-slate-300 text-sm font-medium mb-2">Notes</label>
                      <textarea
                        value={runningForm.notes}
                        onChange={(e) => setRunningForm({...runningForm, notes: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                        rows="3"
                        placeholder="Commentaires sur la course, conditions météo, sensations..."
                      />
                    </div>
                  </div>
                  
                  {/* Calculs automatiques */}
                  {runningForm.distance && runningForm.duration && (
                    <div className="mt-6 p-4 bg-slate-900/30 border border-slate-600/50 rounded-xl">
                      <h4 className="text-white font-semibold mb-3">Calculs automatiques</h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-slate-400">Allure:</span>
                          <span className="text-white font-bold ml-2">
                            {(() => {
                              const distance = parseFloat(runningForm.distance);
                              const [hours, minutes, seconds] = runningForm.duration.split(':').map(Number);
                              const totalSeconds = hours * 3600 + minutes * 60 + seconds;
                              const pace = distance > 0 ? ((totalSeconds / 60) / distance).toFixed(2) : 0;
                              return `${pace} min/km`;
                            })()}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Vitesse:</span>
                          <span className="text-white font-bold ml-2">
                            {(() => {
                              const distance = parseFloat(runningForm.distance);
                              const [hours, minutes, seconds] = runningForm.duration.split(':').map(Number);
                              const totalSeconds = hours * 3600 + minutes * 60 + seconds;
                              const speed = distance > 0 ? (distance / (totalSeconds / 3600)).toFixed(2) : 0;
                              return `${speed} km/h`;
                            })()}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Dénivelé:</span>
                          <span className="text-white font-bold ml-2">
                            {runningForm.elevation ? `${runningForm.elevation}m` : 'Non renseigné'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Évaluations par étoiles */}
                  <div className="mt-6 p-4 bg-slate-800/30 rounded-xl border border-slate-600/30">
                    <h4 className="text-slate-200 font-semibold mb-4 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      Évaluation de la session
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <StarRating
                          label="Congestion musculaire"
                          rating={runningForm.congestion}
                          onRatingChange={(rating) => setRunningForm({...runningForm, congestion: rating})}
                          size="md"
                        />
                        <StarRating
                          label="Motivation"
                          rating={runningForm.motivation}
                          onRatingChange={(rating) => setRunningForm({...runningForm, motivation: rating})}
                          size="md"
                        />
                      </div>
                      <div className="space-y-4">
                        <StarRating
                          label="Sentiment avant"
                          rating={runningForm.sentimentAvant}
                          onRatingChange={(rating) => setRunningForm({...runningForm, sentimentAvant: rating})}
                          size="md"
                        />
                        <StarRating
                          label="Sentiment après"
                          rating={runningForm.sentimentApres}
                          onRatingChange={(rating) => setRunningForm({...runningForm, sentimentApres: rating})}
                          size="md"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => setUI({ showSessionForm: false })}
                      className="px-6 py-3 text-slate-300 border border-slate-600/50 rounded-xl hover:bg-slate-700/50 transition-all"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={addRunningSession}
                      className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all"
                    >
                      Enregistrer
                    </button>
                  </div>
                </div>
              )}

              {/* Liste des défis */}
              {challenges.filter(c => c.activityType === 'running').length > 0 && (
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-white mb-6">Défis</h3>
                  <div className="grid gap-4">
                    {challenges.filter(c => c.activityType === 'running').map(challenge => (
                      <div key={challenge.id} className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-xl border border-slate-600/50 rounded-2xl p-6 hover:border-purple-500/50 transition-all">
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
                                {challenge.status === 'active' ? '🔥 En cours' : '✅ Terminé'}
                              </span>
                            </div>
                            <div className="space-y-1 text-slate-400 text-sm">
                              <p>
                                {challenge.type === 'ponctuel' && `📅 Date cible: ${challenge.targetDate}`}
                                {challenge.type === 'recurrent' && `🔄 ${challenge.frequency === 'daily' ? 'Quotidien' : 'Hebdomadaire'} - ${challenge.moment}`}
                                {challenge.type === 'periode' && `📆 ${challenge.startDate} → ${challenge.endDate}`}
                              </p>
                              <p className="text-purple-300">
                                🎯 Objectif: {challenge.goalDistance && `${challenge.goalDistance}km`}
                                {challenge.goalDistance && challenge.goalDuration && ' en '}
                                {challenge.goalDuration && `${challenge.goalDuration} min`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => editChallenge(challenge.id)}
                              className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                              title="Modifier le défi"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => deleteChallenge(challenge.id)}
                              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                              title="Supprimer le défi"
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
                <h3 className="text-2xl font-bold text-white mb-6">Historique</h3>
                <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
                  {sessions.running.length === 0 ? (
                    <div className="p-12 text-center">
                      <Play className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400 text-lg">Aucune session enregistrée</p>
                      <p className="text-slate-500 text-sm mt-2">Commencez par créer votre première session</p>
                    </div>
                  ) : (
                    <div className="space-y-4 p-6">
                      {sessions.running.sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time)).map((session) => (
                        <div key={session.id} className="bg-slate-900/30 border border-slate-700/50 rounded-xl p-6 hover:border-purple-500/30 transition-all">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-white font-bold text-lg">{session.date}</span>
                                <span className="text-slate-400">{session.time}</span>
                                <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg text-sm">
                                  {session.type ? (session.type.charAt(0).toUpperCase() + session.type.slice(1)) : 'Boxing'}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-slate-400">Distance:</span>
                                  <span className="text-white font-bold ml-2">{session.distance}km</span>
                                </div>
                                <div>
                                  <span className="text-slate-400">Durée:</span>
                                  <span className="text-white font-bold ml-2">{session.duration}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400">Allure:</span>
                                  <span className="text-white font-bold ml-2">{session.pace} min/km</span>
                                </div>
                                <div>
                                  <span className="text-slate-400">Vitesse:</span>
                                  <span className="text-white font-bold ml-2">{session.speed} km/h</span>
                                </div>
                                {session.elevation && (
                                  <div>
                                    <span className="text-slate-400">Dénivelé:</span>
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
                                className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                                title="Modifier la session"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteRunningSession(session.id)}
                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                title="Supprimer la session"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          {session.notes && (
                            <div className="mt-4 text-slate-400 text-sm">
                              <span className="font-medium">Notes:</span> {session.notes}
                            </div>
                          )}
                        </div>
                      ))}
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
                  <h2 className="text-4xl font-bold text-white mb-2">Calendrier d'Activité</h2>
                  <p className="text-slate-400">Vue d'ensemble de vos activités d'endurance</p>
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
                    <option value="all">Toutes les activités</option>
                    <option value="boxing">Boxe</option>
                    <option value="pushups">Pompes</option>
                    <option value="swimming">Natation</option>
                    <option value="jumprope">Corde à sauter</option>
                    <option value="running">Course</option>
                  </select>
                </div>
              </div>

              {/* Statistiques rapides */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-white">{getTotalActivities}</div>
                  <div className="text-slate-400 text-sm">Activités totales</div>
                </div>
                <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-white">{getCurrentStreak}</div>
                  <div className="text-slate-400 text-sm">Jours consécutifs</div>
                </div>
                <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-white">{getBestStreak}</div>
                  <div className="text-slate-400 text-sm">Meilleure série</div>
                </div>
                <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-white">{getActiveDays}</div>
                  <div className="text-slate-400 text-sm">Jours actifs</div>
                </div>
              </div>

              {/* Bouton de diagnostic (temporaire pour debug) */}
              <div className="mb-6">
                <button
                  onClick={diagnoseDataState}
                  className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 rounded-lg text-blue-300 hover:text-blue-200 transition-all text-sm"
                >
                  🔍 Diagnostic des données (Console)
                </button>
              </div>

              {/* Heatmap */}
              <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 mb-8">
                <h3 className="text-xl font-bold text-white mb-4">Heatmap d'Activité - {ui.selectedYear}</h3>
                
                {/* Légende */}
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-slate-400 text-sm">Moins d'activité</span>
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
                  <span className="text-slate-400 text-sm">Plus d'activité</span>
                </div>

                {/* Calendrier simplifié */}
                <div className="space-y-4">
                  {Array.from({ length: 12 }, (_, monthIndex) => {
                    const monthName = getMonthLabels()[monthIndex];
                    const monthDate = new Date(ui.selectedYear, monthIndex, 1);
                    const daysInMonth = new Date(ui.selectedYear, monthIndex + 1, 0).getDate();
                    const firstDayOfWeek = monthDate.getDay();
                    
                    return (
                      <div key={monthIndex} className="bg-slate-900/30 rounded-lg p-4">
                        <h4 className="text-white font-semibold mb-3">{monthName}</h4>
                        <div className="grid grid-cols-7 gap-1">
                          {/* Jours de la semaine */}
                          {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, dayIndex) => (
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
                                title={`${dayDate.toLocaleDateString('fr-FR')} - ${activityCount} activité${activityCount > 1 ? 's' : ''}`}
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
                        Activités du {ui.selectedDay.toLocaleDateString('fr-FR', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </h3>
                      <button
                        onClick={() => setSelectedDay(null)}
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
                                  {activity.type === 'boxing' ? 'Boxe' :
                                   activity.type === 'pushups' ? 'Pompes' :
                                   activity.type === 'swimming' ? 'Natation' :
                                   activity.type === 'jumprope' ? 'Corde à sauter' :
                                   'Course'}
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
                          Aucune activité enregistrée ce jour
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
              <h3 className="text-3xl font-bold text-white">Créer un défi</h3>
              <button
                onClick={() => setUI({ showChallengeModal: false })}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Nom du défi</label>
                <input
                  type="text"
                  value={challengeForm.name}
                  onChange={(e) => setChallengeForm({...challengeForm, name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Ex: 100 pompes par jour"
                />
              </div>
              
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Type d'activité</label>
                <select
                  value={challengeForm.activityType}
                  onChange={(e) => setChallengeForm({...challengeForm, activityType: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                >
                  <option value="pushups">Pompes</option>
                  <option value="swimming">Natation</option>
                  <option value="jumprope">Corde à sauter</option>
                  <option value="running">Course</option>
                </select>
              </div>
              
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Type de défi</label>
                <select
                  value={challengeForm.type}
                  onChange={(e) => setChallengeForm({...challengeForm, type: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                >
                  <option value="ponctuel">Ponctuel</option>
                  <option value="recurrent">Récurrent</option>
                  <option value="periode">Sur une période</option>
                </select>
              </div>

              {challengeForm.type === 'ponctuel' && (
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Date cible</label>
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
                    <label className="block text-slate-300 text-sm font-medium mb-2">Fréquence</label>
                    <select
                      value={challengeForm.frequency}
                      onChange={(e) => setChallengeForm({...challengeForm, frequency: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                    >
                      <option value="daily">Quotidien</option>
                      <option value="weekly">Hebdomadaire</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">Moment</label>
                    <select
                      value={challengeForm.moment}
                      onChange={(e) => setChallengeForm({...challengeForm, moment: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                    >
                      <option value="matin">Matin</option>
                      <option value="midi">Midi</option>
                      <option value="soir">Soir</option>
                    </select>
                  </div>
                </div>
              )}

              {challengeForm.type === 'periode' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">Date début</label>
                    <input
                      type="date"
                      value={challengeForm.startDate}
                      onChange={(e) => setChallengeForm({...challengeForm, startDate: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">Date fin</label>
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
                    {challengeForm.activityType === 'swimming' ? 'Distance (mètres)' : 
                     challengeForm.activityType === 'running' ? 'Distance (km)' : 
                     challengeForm.activityType === 'jumprope' ? 'Nombre de sauts' :
                     'Nombre'}
                  </label>
                  <input
                    type="number"
                    value={challengeForm.goalCount}
                    onChange={(e) => setChallengeForm({...challengeForm, goalCount: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="Optionnel"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Durée max (minutes)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={challengeForm.goalDuration}
                    onChange={(e) => setChallengeForm({...challengeForm, goalDuration: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="Optionnel"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => setUI({ showChallengeModal: false })}
                className="px-6 py-3 text-slate-300 border border-slate-600/50 rounded-xl hover:bg-slate-700/50 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={addChallenge}
                className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-pink-500/50 transition-all"
              >
                Créer le défi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnduranceTab;
