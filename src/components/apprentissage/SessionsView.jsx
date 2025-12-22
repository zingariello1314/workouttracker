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
  loadTimerFromIndexedDB,
  loadPlannerFromIndexedDB,
} from '../../utils/apprentissageIndexedDB';
import { TIMER_DEFAULTS, TIMER_COLORS, WEEK_DAYS } from '../../utils/apprentissageConstants';
import { handleStorageError, ERROR_SEVERITY } from '../../utils/apprentissageErrorHandler';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import TimerComponent from './TimerComponent';
import SubjectSelector from './SubjectSelector';
import WeeklyPlanner from './WeeklyPlanner';
import SessionsHistory from './SessionsHistory';
import BreakPopup from './BreakPopup';
import EndSessionPopup from './EndSessionPopup';
import Modal from '../ui/Modal';


const SessionsView = () => {
  const { subjects, progressionData, addXP, calculateSessionXP, saveTimer, savePlanner, saveSessionsHistory, undo, redo, canUndo, canRedo, pushAction } = useApprentissageEngine();
  const { showSuccess, showError } = useToast();

  // Refs pour drag & drop
  const draggedSubjectRef = useRef(null);

  // État timer
  const [timer, setTimer] = useState({
    isRunning: false,
    isPaused: false,
    currentSubject: null,
    remainingTime: TIMER_DEFAULTS.DEFAULT_SESSION_DURATION,
    plannedDuration: TIMER_DEFAULTS.DEFAULT_SESSION_DURATION,
    breakDuration: TIMER_DEFAULTS.DEFAULT_BREAK_DURATION,
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

  // Sauvegarder état timer (via fonction centralisée)
  useEffect(() => {
    if (!timerLoaded) return;
    
    const toSave = {
      remainingTime: timer.remainingTime,
      plannedDuration: timer.plannedDuration,
      silentMode: timer.silentMode,
    };
    
    saveTimer(toSave);
  }, [timer.remainingTime, timer.plannedDuration, timer.silentMode, timerLoaded, saveTimer]);

  // Sauvegarder planificateur (via fonction centralisée)
  useEffect(() => {
    if (!plannerLoaded) return;
    
    const toSave = {
      compactMode: planner.compactMode,
      subjectOrder: planner.subjectOrder,
    };
    
    savePlanner(toSave);
  }, [planner.compactMode, planner.subjectOrder, plannerLoaded, savePlanner]);

  // Sauvegarder historique (via fonction centralisée)
  useEffect(() => {
    if (!historyLoaded) return;
    
    saveSessionsHistory(sessionsHistory);
  }, [sessionsHistory, historyLoaded, saveSessionsHistory]);

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
        if (newRemaining === TIMER_DEFAULTS.WARNING_TIME && !prev.silentMode) {
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
        remainingTime: TIMER_DEFAULTS.DEFAULT_SESSION_DURATION,
        plannedDuration: TIMER_DEFAULTS.DEFAULT_SESSION_DURATION,
        breakDuration: TIMER_DEFAULTS.DEFAULT_BREAK_DURATION,
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

  // État modales confirmation
  const [showStopModal, setShowStopModal] = useState(false);
  const [showDeleteSessionModal, setShowDeleteSessionModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);

  // Arrêter session
  const stopSession = useCallback(() => {
    setShowStopModal(true);
  }, []);

  const confirmStopSession = useCallback(() => {
    setTimer((prev) => ({
      ...prev,
      isRunning: false,
      isPaused: false,
      currentSubject: null,
      remainingTime: 0,
      progress: 0,
      pulseAnimation: false,
    }));
    setShowStopModal(false);
    showSuccess('Session arrêtée');
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
    if (timer.isPaused) return TIMER_COLORS.PAUSED;
    if (timer.remainingTime <= TIMER_DEFAULTS.WARNING_TIME) return TIMER_COLORS.WARNING;
    return TIMER_COLORS.RUNNING;
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
    setSessionToDelete(index);
    setShowDeleteSessionModal(true);
  }, []);

  const confirmDeleteSession = useCallback(() => {
    if (sessionToDelete !== null) {
      const session = sessionsHistory[sessionToDelete];
      
      // Sauvegarder l'action pour undo
      if (pushAction) {
        pushAction({
          type: 'DELETE_SESSION',
          data: {
            sessionIndex: sessionToDelete,
            session: { ...session }, // Copie pour undo
          },
          undoFn: (data) => {
            setSessionsHistory((prev) => {
              const restored = [...prev];
              restored.splice(data.sessionIndex, 0, data.session);
              return restored.sort((a, b) => b.startTime - a.startTime);
            });
          },
          redoFn: (data) => {
            setSessionsHistory((prev) => prev.filter((_, i) => i !== data.sessionIndex));
          },
        });
      }

      setSessionsHistory((prev) => prev.filter((_, i) => i !== sessionToDelete));
      showSuccess('Session supprimée');
      if (editingSession === sessionToDelete) {
        setEditingSession(null);
      }
      setShowDeleteSessionModal(false);
      setSessionToDelete(null);
    }
  }, [sessionToDelete, editingSession, sessionsHistory, showSuccess, pushAction]);

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

  // Raccourcis clavier
  useKeyboardShortcuts(
    {
      onPauseResume: timer.isRunning ? togglePause : null,
      onStop: timer.isRunning ? stopSession : null,
      onStart: !timer.isRunning && subjects.length > 0 ? () => {
        // Démarrer avec la première matière disponible
        if (subjects.length > 0) {
          startSession(subjects[0]);
        }
      } : null,
      onCancel: () => {
        // Annuler les popups
        if (timer.showBreakPopup) {
          skipBreak();
        }
        if (timer.showEndSessionOptions) {
          finishStudying();
        }
      },
    },
    true
  );

  // Générer jours de la semaine
  const weekDays = useMemo(() => {
    const monday = getCurrentDisplayWeek();
    const days = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const isToday = date.toDateString() === new Date().toDateString();

      days.push({
        name: WEEK_DAYS[i],
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
      {/* Barre d'outils Undo/Redo */}
      {(canUndo || canRedo) && (
        <div className="flex items-center justify-end gap-2 mb-4">
          <button
            type="button"
            onClick={() => {
              undo();
              showSuccess('Action annulée');
            }}
            disabled={!canUndo}
            title="Annuler (Ctrl+Z)"
            aria-label="Annuler la dernière action"
            className="gradient-button-premium gradient-button-premium-sm gradient-button-premium-variant rounded-lg flex items-center gap-2"
          >
            <span>↶</span>
            Annuler
          </button>
          <button
            type="button"
            onClick={() => {
              redo();
              showSuccess('Action refaite');
            }}
            disabled={!canRedo}
            title="Refaire (Ctrl+Y)"
            aria-label="Refaire la dernière action annulée"
            className="gradient-button-premium gradient-button-premium-sm gradient-button-premium-variant rounded-lg flex items-center gap-2"
          >
            <span>↷</span>
            Refaire
          </button>
        </div>
      )}
      
      {/* Timer Principal */}
      {timer.isRunning && (
        <TimerComponent
          timer={timer}
          timerColor={timerColor}
          todayStats={todayStats}
          onTogglePause={togglePause}
          onStop={stopSession}
          onAdjustTime={adjustSessionTime}
          onToggleSilentMode={() => setTimer((prev) => ({ ...prev, silentMode: !prev.silentMode }))}
        />
      )}

      {/* Sélecteur Matière (si timer non démarré) */}
      <SubjectSelector
        subjects={subjects}
        timer={timer}
        getAssignedDay={getAssignedDay}
        onStartSession={startSession}
      />

      {/* Planificateur Hebdomadaire */}
      <WeeklyPlanner
        subjects={subjects}
        planner={planner}
        timer={timer}
        weekDays={weekDays}
        onNavigateWeek={navigateWeek}
        onGoToCurrentWeek={goToCurrentWeek}
        onToggleCompactMode={() => setPlanner((prev) => ({ ...prev, compactMode: !prev.compactMode }))}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onChangeSubjectDay={changeSubjectDay}
        onStartSession={startSession}
      />

      {/* Popup Pause */}
      {timer.showBreakPopup && (
        <BreakPopup
          timer={timer}
          onStartBreak={startBreak}
          onSkipBreak={skipBreak}
        />
      )}

      {/* Popup Fin Session */}
      {timer.showEndSessionOptions && (
        <EndSessionPopup
          timer={timer}
          onContinue={continueSession}
          onFinish={finishStudying}
        />
      )}

      {/* Modale confirmation arrêt */}
      <Modal
        isOpen={showStopModal}
        onClose={() => setShowStopModal(false)}
        title="Arrêter la session ?"
        variant="warning"
        onConfirm={confirmStopSession}
        onCancel={() => setShowStopModal(false)}
        confirmLabel="Oui, arrêter"
        cancelLabel="Annuler"
      >
        <p className="text-slate-300">
          Êtes-vous sûr de vouloir arrêter la session en cours ? 
          Votre progression ne sera pas sauvegardée.
        </p>
      </Modal>

      {/* Modale confirmation suppression session */}
      <Modal
        isOpen={showDeleteSessionModal}
        onClose={() => {
          setShowDeleteSessionModal(false);
          setSessionToDelete(null);
        }}
        title="Supprimer la session ?"
        variant="danger"
        onConfirm={confirmDeleteSession}
        onCancel={() => {
          setShowDeleteSessionModal(false);
          setSessionToDelete(null);
        }}
        confirmLabel="Oui, supprimer"
        cancelLabel="Annuler"
      >
        <p className="text-slate-300">
          Êtes-vous sûr de vouloir supprimer cette session de l'historique ?
          Cette action est irréversible.
        </p>
      </Modal>

      {/* Historique Sessions */}
      <SessionsHistory
        sessionsHistory={sessionsHistory}
        subjects={subjects}
        showManualForm={showManualForm}
        onToggleManualForm={() => setShowManualForm(!showManualForm)}
        manualSession={manualSession}
        onManualSessionChange={setManualSession}
        onAddManualSession={addManualSession}
        editingSession={editingSession}
        editSession={editSession}
        onEditSessionChange={setEditSession}
        onStartEditSession={startEditSession}
        onSaveEditSession={saveEditSession}
        onCancelEditSession={cancelEditSession}
        onDeleteSession={deleteSession}
      />
    </div>
  );
};

export default SessionsView;

