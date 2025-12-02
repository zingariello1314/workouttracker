/**
 * Composant SessionsView - Vue Sessions de l'onglet Apprentissage
 * Gestion des sessions d'étude avec timer, planificateur et historique
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useApprentissageEngine } from '../../hooks/useApprentissageEngine';
import { useToast } from '../ui/Toast';
import sounds from '../../utils/apprentissageAudio';
import {
  openApprentissageDB,
  loadSessionsHistoryFromIndexedDB,
  saveSessionsHistoryToIndexedDB,
  loadTimerFromIndexedDB,
  saveTimerToIndexedDB,
  loadPlannerFromIndexedDB,
  savePlannerToIndexedDB,
} from '../../utils/apprentissageIndexedDB';

// Formatage temps (secondes → MM:SS)
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const SessionsView = () => {
  const { subjects, progressionData, addXP, calculateSessionXP } = useApprentissageEngine();
  const { showSuccess, showError } = useToast();

  // Refs pour drag & drop
  const draggedSubjectRef = useRef(null);

  // État timer
  const [timer, setTimer] = useState({
    isRunning: false,
    isPaused: false,
    currentSubject: null,
    remainingTime: 25 * 60,
    plannedDuration: 25 * 60,
    breakDuration: 5 * 60,
    isBreakTime: false,
    progress: 0,
    pulseAnimation: false,
    silentMode: false,
    showBreakPopup: false,
    showEndSessionOptions: false,
  });
  
  const [timerLoaded, setTimerLoaded] = useState(false);

  // Statistiques du jour
  const [todayStats, setTodayStats] = useState({
    sessionsCount: 0,
    totalWorkTime: 0, // en secondes
    totalBreakTime: 0,
    subjectsStudied: [],
  });

  // Planificateur
  const [planner, setPlanner] = useState({
    currentWeekOffset: 0,
    compactMode: false,
    subjectOrder: {},
  });
  
  const [plannerLoaded, setPlannerLoaded] = useState(false);

  // Historique sessions
  const [sessionsHistory, setSessionsHistory] = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  
  const userId = 'main'; // TODO: utiliser le userId réel depuis AuthContext

  // État édition session
  const [editingSession, setEditingSession] = useState(null);
  const [editSession, setEditSession] = useState({
    subjectName: '',
    duration: 25,
    type: 'work',
    date: '',
    time: '',
  });

  // Formulaire ajout manuel
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualSession, setManualSession] = useState({
    subjectName: '',
    duration: 25,
    type: 'work',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
  });

  // Charger données depuis IndexedDB au montage
  useEffect(() => {
    const loadData = async () => {
      try {
        const db = await openApprentissageDB();
        
        if (db) {
          // Charger timer
          const loadedTimer = await loadTimerFromIndexedDB(db, userId);
          if (loadedTimer) {
            setTimer((prev) => ({
              ...prev,
              remainingTime: loadedTimer.remainingTime || prev.remainingTime,
              plannedDuration: loadedTimer.plannedDuration || prev.plannedDuration,
              silentMode: loadedTimer.silentMode || prev.silentMode,
            }));
          }
          setTimerLoaded(true);
          
          // Charger planificateur
          const loadedPlanner = await loadPlannerFromIndexedDB(db, userId);
          if (loadedPlanner) {
            setPlanner((prev) => ({
              ...prev,
              compactMode: loadedPlanner.compactMode || prev.compactMode,
              subjectOrder: loadedPlanner.subjectOrder || prev.subjectOrder,
            }));
          }
          setPlannerLoaded(true);
          
          // Charger historique
          const loadedHistory = await loadSessionsHistoryFromIndexedDB(db, userId);
          if (loadedHistory && loadedHistory.length > 0) {
            setSessionsHistory(loadedHistory);
          }
          setHistoryLoaded(true);
        } else {
          // Fallback localStorage
          try {
            const savedTimer = localStorage.getItem('apprentissage_timer');
            if (savedTimer) {
              const parsed = JSON.parse(savedTimer);
              setTimer((prev) => ({
                ...prev,
                remainingTime: parsed.remainingTime || prev.remainingTime,
                plannedDuration: parsed.plannedDuration || prev.plannedDuration,
                silentMode: parsed.silentMode || prev.silentMode,
              }));
            }
            
            const savedPlanner = localStorage.getItem('apprentissage_planner');
            if (savedPlanner) {
              const parsed = JSON.parse(savedPlanner);
              setPlanner((prev) => ({
                ...prev,
                compactMode: parsed.compactMode || prev.compactMode,
                subjectOrder: parsed.subjectOrder || prev.subjectOrder,
              }));
            }
            
            const savedHistory = localStorage.getItem('apprentissage_sessions_history');
            if (savedHistory) {
              setSessionsHistory(JSON.parse(savedHistory));
            }
          } catch (e) {
            console.error('[SessionsView] Error loading from localStorage:', e);
          }
          setTimerLoaded(true);
          setPlannerLoaded(true);
          setHistoryLoaded(true);
        }
      } catch (error) {
        console.error('[SessionsView] Error loading data:', error);
        setTimerLoaded(true);
        setPlannerLoaded(true);
        setHistoryLoaded(true);
      }
    };
    
    loadData();
  }, []);

  // Sauvegarder état timer (avec debounce)
  const timerSaveDebounceRef = useRef(null);
  useEffect(() => {
    if (!timerLoaded) return;
    
    if (timerSaveDebounceRef.current) {
      clearTimeout(timerSaveDebounceRef.current);
    }
    
    timerSaveDebounceRef.current = setTimeout(async () => {
      const toSave = {
        remainingTime: timer.remainingTime,
        plannedDuration: timer.plannedDuration,
        silentMode: timer.silentMode,
      };
      
      try {
        const db = await openApprentissageDB();
        if (db) {
          await saveTimerToIndexedDB(db, toSave, userId);
        } else {
          localStorage.setItem('apprentissage_timer', JSON.stringify(toSave));
        }
      } catch (error) {
        console.error('[SessionsView] Error saving timer:', error);
        localStorage.setItem('apprentissage_timer', JSON.stringify(toSave));
      }
    }, 300);
  }, [timer.remainingTime, timer.plannedDuration, timer.silentMode, timerLoaded]);

  // Sauvegarder planificateur (avec debounce)
  const plannerSaveDebounceRef = useRef(null);
  useEffect(() => {
    if (!plannerLoaded) return;
    
    if (plannerSaveDebounceRef.current) {
      clearTimeout(plannerSaveDebounceRef.current);
    }
    
    plannerSaveDebounceRef.current = setTimeout(async () => {
      const toSave = {
        compactMode: planner.compactMode,
        subjectOrder: planner.subjectOrder,
      };
      
      try {
        const db = await openApprentissageDB();
        if (db) {
          await savePlannerToIndexedDB(db, toSave, userId);
        } else {
          localStorage.setItem('apprentissage_planner', JSON.stringify(toSave));
        }
      } catch (error) {
        console.error('[SessionsView] Error saving planner:', error);
        localStorage.setItem('apprentissage_planner', JSON.stringify(toSave));
      }
    }, 300);
  }, [planner.compactMode, planner.subjectOrder, plannerLoaded]);

  // Sauvegarder historique (avec debounce)
  const historySaveDebounceRef = useRef(null);
  useEffect(() => {
    if (!historyLoaded) return;
    
    if (historySaveDebounceRef.current) {
      clearTimeout(historySaveDebounceRef.current);
    }
    
    historySaveDebounceRef.current = setTimeout(async () => {
      try {
        const db = await openApprentissageDB();
        if (db) {
          await saveSessionsHistoryToIndexedDB(db, sessionsHistory, userId);
        } else {
          localStorage.setItem('apprentissage_sessions_history', JSON.stringify(sessionsHistory));
        }
      } catch (error) {
        console.error('[SessionsView] Error saving history:', error);
        localStorage.setItem('apprentissage_sessions_history', JSON.stringify(sessionsHistory));
      }
    }, 300);
  }, [sessionsHistory, historyLoaded]);

  // Intervalle timer
  useEffect(() => {
    if (!timer.isRunning || timer.isPaused) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev.remainingTime <= 1) {
          // Timer terminé
          handleTimerEnd();
          return { ...prev, isRunning: false, remainingTime: 0, progress: 100 };
        }

        const newRemaining = prev.remainingTime - 1;
        const total = prev.plannedDuration;
        const progress = ((total - newRemaining) / total) * 100;

        // Avertissement 5 dernières minutes
        if (newRemaining === 5 * 60 && !prev.silentMode) {
          sounds.warning();
        }

        return {
          ...prev,
          remainingTime: newRemaining,
          progress,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timer.isRunning, timer.isPaused, timer.silentMode]);

  // Calculer statistiques du jour
  useEffect(() => {
    const today = new Date().toDateString();
    const todaySessions = sessionsHistory.filter(
      (s) => new Date(s.startTime).toDateString() === today && s.type === 'work'
    );

    const totalWork = todaySessions.reduce((sum, s) => sum + (s.actualWorkTime || 0), 0);
    const totalBreak = todaySessions.reduce((sum, s) => sum + (s.pauseTime || 0), 0);
    const subjectsList = [...new Set(todaySessions.map((s) => s.subject))];

    setTodayStats({
      sessionsCount: todaySessions.length,
      totalWorkTime: totalWork,
      totalBreakTime: totalBreak,
      subjectsStudied: subjectsList,
    });
  }, [sessionsHistory]);

  // Démarrer session
  const startSession = useCallback(
    (subject) => {
      if (!subject) {
        showError('Veuillez sélectionner une matière');
        return;
      }

      setTimer({
        isRunning: true,
        isPaused: false,
        currentSubject: subject,
        remainingTime: 25 * 60, // 25 minutes par défaut
        plannedDuration: 25 * 60,
        breakDuration: 5 * 60,
        isBreakTime: false,
        progress: 0,
        pulseAnimation: true,
        silentMode: false,
      });

      showSuccess(`Session démarrée pour ${subject.name}`);
    },
    [showSuccess, showError]
  );

  // Pause/Reprendre
  const togglePause = useCallback(() => {
    setTimer((prev) => ({
      ...prev,
      isPaused: !prev.isPaused,
    }));
  }, []);

  // Arrêter session
  const stopSession = useCallback(() => {
    if (window.confirm('Êtes-vous sûr de vouloir arrêter la session ?')) {
      setTimer((prev) => ({
        ...prev,
        isRunning: false,
        isPaused: false,
        currentSubject: null,
        remainingTime: 0,
        progress: 0,
        pulseAnimation: false,
      }));
      showSuccess('Session arrêtée');
    }
  }, [showSuccess]);

  // Ajuster temps (+10 min)
  const adjustSessionTime = useCallback((minutes) => {
    setTimer((prev) => {
      const newRemaining = prev.remainingTime + minutes * 60;
      const newPlanned = prev.plannedDuration + minutes * 60;
      return {
        ...prev,
        remainingTime: newRemaining,
        plannedDuration: newPlanned,
      };
    });
  }, []);

  // Fin timer
  const handleTimerEnd = useCallback(() => {
    if (timer.currentSubject) {
      const sessionData = {
        subject: timer.currentSubject.name,
        startTime: Date.now() - timer.plannedDuration * 1000,
        endTime: Date.now(),
        plannedDuration: timer.plannedDuration,
        actualWorkTime: timer.plannedDuration,
        pauseTime: 0,
        completed: true,
        type: timer.isBreakTime ? 'break' : 'work',
      };

      // Jouer son
      if (!timer.silentMode) {
        if (timer.isBreakTime) {
          sounds.breakEnd();
        } else {
          sounds.sessionEnd();
        }
      }

      // Calculer et ajouter XP si session work
      if (!timer.isBreakTime) {
        const baseXP = calculateSessionXP(sessionData);
        addXP(timer.currentSubject.name, baseXP, sessionData);
      }

      setSessionsHistory((prev) => [sessionData, ...prev]);
      showSuccess('Session terminée !');

      // Afficher popup pause après session work
      if (!timer.isBreakTime) {
        setTimer((prev) => ({
          ...prev,
          showBreakPopup: true,
        }));
      } else {
        // Après pause, proposer nouvelle session
        setTimer((prev) => ({
          ...prev,
          showBreakPopup: false,
          isBreakTime: false,
          showEndSessionOptions: true,
        }));
      }
    }

    setTimer((prev) => ({
      ...prev,
      isRunning: false,
      isPaused: false,
      progress: 100,
      pulseAnimation: false,
    }));
  }, [timer.currentSubject, timer.plannedDuration, timer.isBreakTime, timer.silentMode, calculateSessionXP, addXP, showSuccess]);

  // Couleur timer dynamique
  const timerColor = useMemo(() => {
    if (timer.isPaused) return '#ff8c42'; // Orange
    if (timer.remainingTime <= 5 * 60) return '#ff4757'; // Rouge (5 dernières minutes)
    return '#2ed573'; // Vert
  }, [timer.isPaused, timer.remainingTime]);

  // Obtenir jour assigné
  const getAssignedDay = useCallback(
    (subjectName) => {
      return planner.subjectOrder[subjectName] || null;
    },
    [planner]
  );

  // Changer jour assigné
  const changeSubjectDay = useCallback((subjectName, newDay) => {
    setPlanner((prev) => {
      const updated = { ...prev };
      if (newDay) {
        updated.subjectOrder[subjectName] = newDay;
      } else {
        delete updated.subjectOrder[subjectName];
      }
      return updated;
    });
  }, []);

  // Drag & Drop handlers
  const handleDragStart = useCallback((e, subject) => {
    draggedSubjectRef.current = subject;
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e, targetDay) => {
    e.preventDefault();
    const subject = draggedSubjectRef.current;
    if (subject) {
      changeSubjectDay(subject.name, targetDay);
      draggedSubjectRef.current = null;
    }
  }, [changeSubjectDay]);

  // Popups handlers
  const startBreak = useCallback(() => {
    setTimer((prev) => ({
      ...prev,
      showBreakPopup: false,
      isBreakTime: true,
      isRunning: true,
      remainingTime: prev.breakDuration,
      plannedDuration: prev.breakDuration,
      progress: 0,
      pulseAnimation: true,
      isPaused: false,
    }));
  }, []);

  const skipBreak = useCallback(() => {
    setTimer((prev) => ({
      ...prev,
      showBreakPopup: false,
      showEndSessionOptions: true,
    }));
  }, []);

  const continueSession = useCallback(() => {
    if (timer.currentSubject) {
      setTimer((prev) => ({
        ...prev,
        showEndSessionOptions: false,
        isRunning: true,
        remainingTime: prev.plannedDuration,
        progress: 0,
        pulseAnimation: true,
      }));
    }
  }, [timer.currentSubject]);

  const finishStudying = useCallback(() => {
    setTimer((prev) => ({
      ...prev,
      showEndSessionOptions: false,
      currentSubject: null,
      isRunning: false,
      isPaused: false,
      remainingTime: 0,
      progress: 0,
    }));
  }, []);

  // Ajout session manuelle
  const addManualSession = useCallback(() => {
    if (!manualSession.subjectName || !manualSession.date || !manualSession.time) {
      showError('Veuillez remplir tous les champs');
      return;
    }

    const dateTime = new Date(`${manualSession.date}T${manualSession.time}`);
    const duration = manualSession.duration * 60; // en secondes

    const sessionData = {
      subject: manualSession.subjectName,
      startTime: dateTime.getTime(),
      endTime: dateTime.getTime() + duration * 1000,
      plannedDuration: duration,
      actualWorkTime: duration,
      pauseTime: 0,
      completed: true,
      type: manualSession.type,
      isManual: true,
    };

    // Calculer et ajouter XP si session work
    if (manualSession.type === 'work') {
      const baseXP = calculateSessionXP(sessionData);
      addXP(manualSession.subjectName, baseXP, sessionData);
    }

    setSessionsHistory((prev) => {
      const updated = [sessionData, ...prev];
      updated.sort((a, b) => b.startTime - a.startTime);
      return updated;
    });

    showSuccess('Session ajoutée');
    setShowManualForm(false);
    setManualSession({
      subjectName: '',
      duration: 25,
      type: 'work',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
    });
  }, [manualSession, calculateSessionXP, addXP, showSuccess, showError]);

  // Édition session
  const startEditSession = useCallback((index) => {
    const session = sessionsHistory[index];
    const date = new Date(session.startTime);
    setEditSession({
      subjectName: session.subject,
      duration: Math.floor(session.actualWorkTime / 60),
      type: session.type,
      date: date.toISOString().split('T')[0],
      time: date.toTimeString().slice(0, 5),
    });
    setEditingSession(index);
    setShowManualForm(false);
  }, [sessionsHistory]);

  const saveEditSession = useCallback(() => {
    if (!editSession.subjectName || !editSession.date || !editSession.time) {
      showError('Veuillez remplir tous les champs');
      return;
    }

    if (editingSession === null) return;

    const dateTime = new Date(`${editSession.date}T${editSession.time}`);
    const duration = editSession.duration * 60;

    const sessionData = {
      subject: editSession.subjectName,
      startTime: dateTime.getTime(),
      endTime: dateTime.getTime() + duration * 1000,
      plannedDuration: duration,
      actualWorkTime: duration,
      pauseTime: 0,
      completed: true,
      type: editSession.type,
      isManual: true,
    };

    setSessionsHistory((prev) => {
      const updated = [...prev];
      updated[editingSession] = sessionData;
      updated.sort((a, b) => b.startTime - a.startTime);
      return updated;
    });

    showSuccess('Session modifiée');
    setEditingSession(null);
    setEditSession({
      subjectName: '',
      duration: 25,
      type: 'work',
      date: '',
      time: '',
    });
  }, [editSession, editingSession, showSuccess, showError]);

  const cancelEditSession = useCallback(() => {
    setEditingSession(null);
    setEditSession({
      subjectName: '',
      duration: 25,
      type: 'work',
      date: '',
      time: '',
    });
  }, []);

  const deleteSession = useCallback((index) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette session ?')) {
      setSessionsHistory((prev) => prev.filter((_, i) => i !== index));
      showSuccess('Session supprimée');
      if (editingSession === index) {
        setEditingSession(null);
      }
    }
  }, [editingSession, showSuccess]);

  // Navigation semaine
  const navigateWeek = useCallback((direction) => {
    setPlanner((prev) => ({
      ...prev,
      currentWeekOffset: prev.currentWeekOffset + direction,
    }));
  }, []);

  // Aller à la semaine actuelle
  const goToCurrentWeek = useCallback(() => {
    setPlanner((prev) => ({
      ...prev,
      currentWeekOffset: 0,
    }));
  }, []);

  // Calculer lundi de la semaine affichée
  const getCurrentDisplayWeek = useCallback(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Lundi
    const monday = new Date(today.setDate(diff));
    monday.setDate(monday.getDate() + planner.currentWeekOffset * 7);
    return monday;
  }, [planner.currentWeekOffset]);

  // Générer jours de la semaine
  const weekDays = useMemo(() => {
    const monday = getCurrentDisplayWeek();
    const days = [];
    const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const isToday = date.toDateString() === new Date().toDateString();

      days.push({
        name: dayNames[i],
        date: date.getDate(),
        fullDate: date,
        isToday,
        subjects: subjects.filter((s) => planner.subjectOrder[s.name] === i + 1),
      });
    }

    return days;
  }, [getCurrentDisplayWeek, subjects, planner]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Timer Principal */}
      {timer.isRunning && (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-emerald-500/30 rounded-xl p-6 shadow-xl shadow-emerald-500/10">
          <div className="flex flex-col items-center">
            {/* Cercle Timer */}
            <div
              className={`relative w-72 h-72 rounded-full border-8 flex flex-col items-center justify-center mb-6 transition-all duration-300 ${
                timer.isRunning && !timer.isPaused ? 'animate-pulse' : ''
              }`}
              style={{
                borderColor: `${timerColor}33`,
                background: `radial-gradient(circle, ${timerColor}08 0%, transparent 70%)`,
              }}
            >
              {/* SVG Progression */}
              <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="rgba(0, 255, 148, 0.1)"
                  strokeWidth="2"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={timerColor}
                  strokeWidth="3"
                  strokeDasharray={283}
                  strokeDashoffset={283 - (timer.progress * 283) / 100}
                  strokeLinecap="round"
                />
              </svg>

              {/* Affichage temps */}
              <div className="relative z-10 text-center">
                <div
                  className="text-5xl font-black mb-2"
                  style={{
                    color: timerColor,
                    textShadow: `0 0 20px ${timerColor}80`,
                  }}
                >
                  {formatTime(timer.remainingTime)}
                </div>
                <div className="text-lg text-emerald-400 font-semibold uppercase tracking-wider">
                  {timer.isPaused ? '🍫 PAUSE' : '📚 FOCUS'}
                </div>
                {timer.currentSubject && (
                  <div className="text-sm text-slate-400 mt-2">
                    {timer.currentSubject.name}
                  </div>
                )}
              </div>
            </div>

            {/* Contrôles */}
            <div className="flex gap-3 flex-wrap justify-center">
              <button
                onClick={togglePause}
                className="px-6 py-3 bg-gradient-to-r from-slate-800 to-slate-900 border-2 border-emerald-500 rounded-lg text-emerald-400 font-semibold uppercase tracking-wide hover:from-emerald-500/20 hover:to-cyan-500/20 hover:text-cyan-300 hover:border-cyan-400 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/40 transition-all duration-200"
              >
                {timer.isPaused ? '▶️ Reprendre' : '⏸️ Pause'}
              </button>
              <button
                onClick={stopSession}
                className="px-6 py-3 bg-gradient-to-r from-slate-800 to-slate-900 border-2 border-red-500 rounded-lg text-red-400 font-semibold uppercase tracking-wide hover:from-red-500/20 hover:to-red-600/20 hover:text-red-300 hover:border-red-400 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-500/40 transition-all duration-200"
              >
                ⏹️ Arrêter
              </button>
              <button
                onClick={() => adjustSessionTime(10)}
                className="px-6 py-3 bg-gradient-to-r from-slate-800 to-slate-900 border-2 border-cyan-500 rounded-lg text-cyan-400 font-semibold uppercase tracking-wide hover:from-cyan-500/20 hover:to-blue-500/20 hover:text-cyan-300 hover:border-cyan-400 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/40 transition-all duration-200"
              >
                +10 min
              </button>
              <button
                onClick={() => setTimer((prev) => ({ ...prev, silentMode: !prev.silentMode }))}
                className={`px-6 py-3 bg-gradient-to-r from-slate-800 to-slate-900 border-2 border-slate-500 rounded-lg font-semibold uppercase tracking-wide hover:-translate-y-0.5 transition-all duration-200 ${
                  timer.silentMode ? 'text-slate-500' : 'text-slate-300'
                }`}
              >
                {timer.silentMode ? '🔇' : '🔊'}
              </button>
            </div>

            {/* Statistiques du jour */}
            <div className="mt-6 flex gap-6 flex-wrap justify-center">
              <div className="text-center">
                <div className="text-2xl mb-1">🎯</div>
                <div className="text-xl font-bold text-cyan-400">{todayStats.sessionsCount}</div>
                <div className="text-xs text-slate-400">Sessions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-1">⏱️</div>
                <div className="text-xl font-bold text-emerald-400">
                  {Math.floor(todayStats.totalWorkTime / 60)}h
                  {todayStats.totalWorkTime % 60}
                </div>
                <div className="text-xs text-slate-400">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-1">☕</div>
                <div className="text-xl font-bold text-amber-400">
                  {Math.floor(todayStats.totalBreakTime / 60)}h
                  {todayStats.totalBreakTime % 60}
                </div>
                <div className="text-xs text-slate-400">Break</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sélecteur Matière (si timer non démarré) */}
      {!timer.isRunning && subjects.length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-emerald-500/30 rounded-xl p-6 shadow-xl shadow-emerald-500/10">
          <h3 className="text-xl font-bold text-emerald-400 mb-4">🎯 Commencer une session</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subject) => (
              <button
                key={subject.id}
                onClick={() => startSession(subject)}
                className="p-4 bg-slate-900/50 border border-slate-700/50 rounded-lg hover:border-emerald-500/50 hover:bg-slate-800/70 transition-all duration-200 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📚</span>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-200">{subject.name}</div>
                    <div className="text-xs text-slate-400">
                      📁 {subject.files?.length || 0} fichier(s)
                    </div>
                    {getAssignedDay(subject.name) && (
                      <div className="text-xs text-emerald-400 mt-1">
                        {['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'][getAssignedDay(subject.name)]}
                      </div>
                    )}
                  </div>
                  <span className="text-xl">▶️</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Planificateur Hebdomadaire */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-emerald-500/30 rounded-xl p-6 shadow-xl shadow-emerald-500/10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-emerald-400">📅 Planificateur Hebdomadaire</h3>
          <div className="flex gap-2">
            <button
              onClick={() => navigateWeek(-1)}
              className="px-3 py-1 bg-slate-700/50 border border-slate-600 rounded text-slate-300 hover:bg-slate-600 transition-all"
            >
              ⬅️
            </button>
            <button
              onClick={goToCurrentWeek}
              className="px-4 py-1 bg-emerald-500/20 border border-emerald-500/50 rounded text-emerald-400 hover:bg-emerald-500/30 transition-all text-sm"
            >
              {planner.currentWeekOffset === 0 ? 'Cette semaine' : 'Aller à aujourd\'hui'}
            </button>
            <button
              onClick={() => navigateWeek(1)}
              className="px-3 py-1 bg-slate-700/50 border border-slate-600 rounded text-slate-300 hover:bg-slate-600 transition-all"
            >
              ➡️
            </button>
            <button
              onClick={() => setPlanner((prev) => ({ ...prev, compactMode: !prev.compactMode }))}
              className="px-4 py-1 bg-slate-700/50 border border-slate-600 rounded text-slate-300 hover:bg-slate-600 transition-all text-sm"
            >
              {planner.compactMode ? '📈 Vue étendue' : '📊 Vue compacte'}
            </button>
          </div>
        </div>

        {/* Grille jours */}
        <div className="grid grid-cols-7 gap-3">
              {weekDays.map((day, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border ${
                day.isToday
                  ? 'border-emerald-500/50 bg-emerald-500/10'
                  : 'border-slate-700/50 bg-slate-900/30'
              }`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index + 1)}
            >
              <div className="text-center mb-2">
                <div className="text-sm font-semibold text-slate-300">{day.name}</div>
                <div className="text-lg font-bold text-emerald-400">{day.date}</div>
              </div>
              <div className="space-y-2 min-h-[100px]">
                {day.subjects.length > 0 ? (
                  day.subjects.map((subject) => (
                    <div
                      key={subject.id}
                      className="p-2 bg-slate-800/50 border border-emerald-500/30 rounded text-xs flex items-center justify-between group"
                      draggable
                      onDragStart={(e) => handleDragStart(e, subject)}
                    >
                      <div className="font-semibold text-slate-200 truncate flex-1">{subject.name}</div>
                      {!timer.isRunning && (
                        <button
                          onClick={() => startSession(subject)}
                          className="ml-2 text-emerald-400 hover:text-emerald-300 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Démarrer session"
                        >
                          ▶️
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500 text-center py-4">
                    Glissez une matière ici
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Matières non assignées */}
        {(() => {
          const unassigned = subjects.filter((s) => !planner.subjectOrder[s.name]);
          if (unassigned.length === 0) return null;

          return (
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-slate-400 mb-3">📋 Matières à programmer</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {unassigned.map((subject) => (
                  <div
                    key={subject.id}
                    className="p-3 bg-slate-900/50 border border-slate-700/50 rounded-lg flex items-center justify-between group"
                    draggable
                    onDragStart={(e) => handleDragStart(e, subject)}
                  >
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-slate-300 mb-1">❓</div>
                      <div className="text-sm font-semibold text-slate-200 truncate">{subject.name}</div>
                      <div className="text-xs text-slate-500">Non programmé</div>
                    </div>
                    <select
                      className="ml-2 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-300"
                      value=""
                      onChange={(e) => {
                        const day = e.target.value ? parseInt(e.target.value) : null;
                        changeSubjectDay(subject.name, day);
                      }}
                    >
                      <option value="">Choisir un jour</option>
                      <option value="1">Lundi</option>
                      <option value="2">Mardi</option>
                      <option value="3">Mercredi</option>
                      <option value="4">Jeudi</option>
                      <option value="5">Vendredi</option>
                      <option value="6">Samedi</option>
                      <option value="7">Dimanche</option>
                    </select>
                    {!timer.isRunning && (
                      <button
                        onClick={() => startSession(subject)}
                        className="ml-2 text-emerald-400 hover:text-emerald-300 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Démarrer session"
                      >
                        ▶️
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Popup Pause */}
      {timer.showBreakPopup && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md animate-[overlayFadeIn_0.3s_ease-out]">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-3 border-orange-500 rounded-[25px] p-12 max-w-md w-full mx-4 backdrop-blur-xl shadow-2xl animate-[popupSlideIn_0.4s_cubic-bezier(0.16,1,0.3,1)]">
            <div className="text-center">
              <div className="text-5xl mb-4">🍫</div>
              <h3 className="text-2xl font-bold text-orange-400 uppercase tracking-wide mb-2">
                TEMPS DE PAUSE
              </h3>
              <div className="text-xl font-semibold text-slate-300 mb-4">
                {timer.breakDuration / 60} MIN
              </div>
              <p className="text-slate-400 mb-6">Repose-toi bien !</p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={startBreak}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500/20 to-amber-500/20 border-2 border-orange-500 rounded-lg text-orange-400 font-bold uppercase tracking-wide hover:from-orange-500/30 hover:to-amber-500/30 hover:scale-105 transition-all duration-200"
                >
                  DÉMARRER PAUSE
                </button>
                <button
                  onClick={skipBreak}
                  className="px-6 py-3 bg-slate-800/50 border-2 border-slate-600 rounded-lg text-slate-300 font-bold uppercase tracking-wide hover:bg-slate-700/50 hover:scale-105 transition-all duration-200"
                >
                  PASSER
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popup Fin Session */}
      {timer.showEndSessionOptions && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md" style={{ animation: 'overlayFadeIn 0.3s ease-out' }}>
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-3 border-emerald-500 rounded-[25px] p-12 max-w-md w-full mx-4 backdrop-blur-xl shadow-2xl" style={{ animation: 'popupSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div className="text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold text-emerald-400 uppercase tracking-wide mb-2">
                SESSION TERMINÉE
              </h3>
              {timer.currentSubject && (
                <div className="text-lg font-semibold text-slate-300 mb-6">
                  {timer.currentSubject.name}
                </div>
              )}
              <div className="flex gap-4 justify-center">
                <button
                  onClick={continueSession}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border-2 border-emerald-500 rounded-lg text-emerald-400 font-bold uppercase tracking-wide hover:from-emerald-500/30 hover:to-cyan-500/30 hover:scale-105 transition-all duration-200"
                >
                  CONTINUER
                </button>
                <button
                  onClick={finishStudying}
                  className="px-6 py-3 bg-slate-800/50 border-2 border-slate-600 rounded-lg text-slate-300 font-bold uppercase tracking-wide hover:bg-slate-700/50 hover:scale-105 transition-all duration-200"
                >
                  TERMINER
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Historique Sessions */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-emerald-500/30 rounded-xl p-6 shadow-xl shadow-emerald-500/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-emerald-400 uppercase tracking-wide">📊 SESSION ARCHIVE</h3>
          <button
            onClick={() => setShowManualForm(!showManualForm)}
            className={`px-4 py-2 rounded-lg font-semibold text-xs uppercase tracking-wide transition-all duration-200 ${
              showManualForm
                ? 'bg-red-900/30 border border-red-500/50 text-red-400 hover:bg-red-500/20'
                : 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30'
            }`}
          >
            {showManualForm ? '❌ CANCEL' : '➕ MANUAL DATA ENTRY'}
          </button>
        </div>

        {/* Formulaire ajout manuel */}
        {showManualForm && (
          <div className="mb-6 p-4 bg-slate-900/50 border border-emerald-500/30 rounded-lg">
            <h4 className="text-sm font-bold text-emerald-400 mb-4 uppercase">✏️ DATA ENTRY PROTOCOL</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">PROTOCOL:</label>
                <select
                  value={manualSession.subjectName}
                  onChange={(e) => setManualSession((prev) => ({ ...prev, subjectName: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm text-slate-200"
                >
                  <option value="">SELECT PROTOCOL</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">TYPE:</label>
                <select
                  value={manualSession.type}
                  onChange={(e) => setManualSession((prev) => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm text-slate-200"
                >
                  <option value="work">📚 WORK</option>
                  <option value="break">☕ BREAK</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">DURATION (MIN):</label>
                <input
                  type="number"
                  min="1"
                  max="480"
                  value={manualSession.duration}
                  onChange={(e) => setManualSession((prev) => ({ ...prev, duration: parseInt(e.target.value) || 25 }))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm text-slate-200"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">DATE:</label>
                <input
                  type="date"
                  value={manualSession.date}
                  onChange={(e) => setManualSession((prev) => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm text-slate-200"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">TIME:</label>
                <input
                  type="time"
                  value={manualSession.time}
                  onChange={(e) => setManualSession((prev) => ({ ...prev, time: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm text-slate-200"
                />
              </div>
            </div>
            <button
              onClick={addManualSession}
              disabled={!manualSession.subjectName}
              className="mt-4 px-6 py-2 bg-emerald-500/20 border border-emerald-500 rounded-lg text-emerald-400 font-semibold uppercase text-xs tracking-wide disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-500/30 transition-all duration-200"
            >
              ✅ COMMIT DATA
            </button>
          </div>
        )}

        {/* Statistiques */}
        {sessionsHistory.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
              <div className="text-2xl font-bold text-cyan-400">
                {sessionsHistory.filter((s) => s.type === 'work').length}
              </div>
              <div className="text-xs text-slate-400 uppercase mt-1">Total Sessions</div>
            </div>
            <div className="text-center p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
              <div className="text-2xl font-bold text-emerald-400">
                {Math.floor(sessionsHistory.reduce((sum, s) => sum + (s.actualWorkTime || 0), 0) / 3600)}H
              </div>
              <div className="text-xs text-slate-400 uppercase mt-1">Total Time</div>
            </div>
            <div className="text-center p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
              <div className="text-2xl font-bold text-purple-400">
                {[...new Set(sessionsHistory.filter((s) => s.type === 'work').map((s) => s.subject))].length}
              </div>
              <div className="text-xs text-slate-400 uppercase mt-1">Protocols</div>
            </div>
          </div>
        )}

        {/* Liste sessions */}
        {sessionsHistory.length > 0 ? (
          <div className="space-y-2">
            <div className="text-sm font-semibold text-slate-400 mb-3">RECENT ACTIVITY:</div>
            {sessionsHistory.slice(0, 10).map((session, index) => {
              const isEditing = editingSession === index;
              return (
                <div
                  key={index}
                  className={`p-3 bg-slate-900/50 border rounded-lg ${
                    isEditing ? 'border-cyan-500/50' : 'border-slate-700/50'
                  }`}
                >
                  {!isEditing ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-xl">{session.type === 'work' ? '📚' : '☕'}</span>
                        <div className="flex-1">
                          <div className="font-semibold text-slate-200">{session.subject}</div>
                          <div className="text-xs text-slate-400">
                            {new Date(session.startTime).toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                            })}{' '}
                            - {new Date(session.startTime).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {Math.floor(session.actualWorkTime / 60)}MIN
                            {session.isManual && ' • ✏️ MANUAL'}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditSession(index)}
                          className="px-2 py-1 bg-slate-800/50 border border-slate-600 rounded text-slate-400 hover:bg-slate-700/50 transition-all"
                          title="MODIFY ENTRY"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => deleteSession(index)}
                          className="px-2 py-1 bg-red-900/30 border border-red-500/50 rounded text-red-400 hover:bg-red-500/20 transition-all"
                          title="DELETE ENTRY"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">PROTOCOL:</label>
                          <select
                            value={editSession.subjectName}
                            onChange={(e) => setEditSession((prev) => ({ ...prev, subjectName: e.target.value }))}
                            className="w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-200"
                          >
                            {subjects.map((s) => (
                              <option key={s.id} value={s.name}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">TYPE:</label>
                          <select
                            value={editSession.type}
                            onChange={(e) => setEditSession((prev) => ({ ...prev, type: e.target.value }))}
                            className="w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-200"
                          >
                            <option value="work">📚 WORK</option>
                            <option value="break">☕ BREAK</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">DURATION:</label>
                          <input
                            type="number"
                            min="1"
                            max="480"
                            value={editSession.duration}
                            onChange={(e) => setEditSession((prev) => ({ ...prev, duration: parseInt(e.target.value) || 25 }))}
                            className="w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">DATE:</label>
                          <input
                            type="date"
                            value={editSession.date}
                            onChange={(e) => setEditSession((prev) => ({ ...prev, date: e.target.value }))}
                            className="w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">TIME:</label>
                          <input
                            type="time"
                            value={editSession.time}
                            onChange={(e) => setEditSession((prev) => ({ ...prev, time: e.target.value }))}
                            className="w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-200"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={saveEditSession}
                          disabled={!editSession.subjectName}
                          className="px-4 py-1.5 bg-emerald-500/20 border border-emerald-500 rounded text-emerald-400 font-semibold text-xs uppercase disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-500/30 transition-all"
                        >
                          ✅ SAVE
                        </button>
                        <button
                          onClick={cancelEditSession}
                          className="px-4 py-1.5 bg-slate-800/50 border border-slate-600 rounded text-slate-300 font-semibold text-xs uppercase hover:bg-slate-700/50 transition-all"
                        >
                          ❌ CANCEL
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-slate-300 text-lg font-semibold mb-2">🕘 NO SESSION DATA AVAILABLE</div>
            <div className="text-slate-400">Initialize first protocol or add manual entry!</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionsView;

