/**
 * LearningStatusBlock - Bloc Status Apprentissage (PRIORITY-HIGH)
 * Suivi apprentissage quotidien avec timer et streak
 * 
 * @version 4.0.1 - Refonte CSS Complète
 * 
 * Phase 4: Intégration CSS ✅
 * - Utilisation des classes CSS custom du code Vue.js
 * - Design signature rose néon (#ff1493)
 * - Effets néon et glow
 * - Animations ripple et pulse-glow
 * - Structure HTML identique au template Vue.js
 * 
 * @component
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import '../../styles/learning-status-block.css';

const LearningStatusBlock = ({ 
  allData = null, 
  learningData = null, 
  onStartTimer = null,
  onOpenNotes = null,
  onNavigate = null 
}) => {
  const [timeStudied, setTimeStudied] = useState(0);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  // Extraire les données depuis allData (structure Vue.js)
  const learningStatus = useMemo(() => {
    if (allData?.mockData?.learningStatus) {
      return allData.mockData.learningStatus;
    }
    return learningData || {};
  }, [allData, learningData]);

  // Fallback pour streakDays
  const streakDays = useMemo(() => {
    const fromLearning = learningStatus.streakDays;
    const fromUser = allData?.mockData?.user?.streakDays;
    const value = fromLearning ?? fromUser ?? 0;
    return Number.isFinite(Number(value)) ? Number(value) : 0;
  }, [learningStatus, allData]);

  // Timer actif
  const isTimerActive = useMemo(() => {
    return allData?.mockData?.activeTimer?.isActive || false;
  }, [allData]);

  useEffect(() => {
    if (learningStatus?.timeStudiedToday !== undefined) {
      setTimeStudied(learningStatus.timeStudiedToday || 0);
    } else if (learningStatus?.todaySessions) {
      setTimeStudied(learningStatus.todaySessions.totalTime || 0);
    }
  }, [learningStatus]);

  useEffect(() => {
    if (learningStatus?.sessionsCompleted !== undefined) {
      setSessionsCompleted(learningStatus.sessionsCompleted || 0);
    } else if (learningStatus?.todaySessions?.sessions) {
      setSessionsCompleted(learningStatus.todaySessions.sessions.length || 0);
    }
  }, [learningStatus]);

  const formatDuration = useCallback((minutes) => {
    const value = typeof minutes === 'object' && minutes ? (minutes.minutes ?? 0) : Number(minutes) || 0;
    const hours = Math.floor(value / 60);
    const mins = value % 60;
    return hours > 0 ? `${hours}h${mins > 0 ? mins.toString().padStart(2, '0') : ''}` : `${mins}min`;
  }, []);

  const getObjectiveStatus = useCallback((percent) => {
    if (percent >= 100) return 'completed';
    if (percent >= 75) return 'on-track';
    if (percent >= 25) return 'in-progress';
    return 'at-risk';
  }, []);

  const getProgressClass = useCallback((percent) => {
    if (percent >= 100) return 'completed';
    if (percent >= 75) return 'good';
    if (percent >= 50) return 'average';
    return 'low';
  }, []);

  const getObjectiveIcon = useCallback((status) => {
    switch (status) {
      case 'completed': return '✅';
      case 'on-track': return '🎯';
      case 'in-progress': return '⏳';
      case 'at-risk': return '⚠️';
      default: return '❓';
    }
  }, []);

  const getObjectiveMessage = useCallback((status) => {
    switch (status) {
      case 'completed': return 'Objectif quotidien atteint !';
      case 'on-track': return 'Bon rythme, continuez !';
      case 'in-progress': return 'En cours, maintenez l\'effort';
      case 'at-risk': return 'Objectif à risque, accélérez !';
      default: return 'Commencez votre apprentissage';
    }
  }, []);

  const formatRewardDate = useCallback((dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'aujourd\'hui';
    if (diffDays === 1) return 'hier';
    if (diffDays < 7) return `il y a ${diffDays} jours`;
    return date.toLocaleDateString('fr-FR');
  }, []);

  if (!learningStatus || Object.keys(learningStatus).length === 0) {
    return (
      <div className="dashboard-card learning-status-card priority-high">
        <div className="card-glow"></div>
        <div className="card-content">
          <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255, 255, 255, 0.6)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎓</div>
            <div>Aucune donnée d'apprentissage</div>
          </div>
        </div>
      </div>
    );
  }

  const activeSubject = learningStatus.activeSubject || 'Aucune matière';

  const startSession = useCallback(() => {
    if (isTimerActive) return;
    if (onStartTimer) {
      onStartTimer({
        type: 'start-learning-session',
        subject: activeSubject,
        duration: 25,
        timestamp: new Date()
      });
    }
  }, [isTimerActive, onStartTimer, activeSubject]);

  const startFirstSession = useCallback(() => {
    startSession();
  }, [startSession]);

  const openNotes = useCallback((e) => {
    if (e) e.stopPropagation();
    if (onOpenNotes) {
      onOpenNotes({
        type: 'learning-notes',
        subject: activeSubject
      });
    }
  }, [onOpenNotes, activeSubject]);

  const navigateToPlanner = useCallback(() => {
    if (onNavigate) {
      onNavigate('planificateur');
    }
  }, [onNavigate]);

  const subjectType = learningStatus.subjectType || 'apprentissage';
  const dailyObjectiveMinutes = learningStatus.dailyObjectiveMinutes || learningStatus.dailyGoal || 120;
  const sessionsPlanned = learningStatus.sessionsPlanned || 4;
  const streak = learningStatus.streak || streakDays;
  const latestReward = learningStatus.latestReward || null;

  const progressPercent = Math.min((timeStudied / dailyObjectiveMinutes) * 100, 100);
  const timeRemainingToday = Math.max(0, dailyObjectiveMinutes - timeStudied);
  const objectiveStatus = getObjectiveStatus(progressPercent);
  const progressClass = getProgressClass(progressPercent);
  const hasSessionToday = sessionsCompleted > 0;

  const subjectIcons = {
    'Écriture': '✍️',
    'Programmation': '💻',
    'Langues': '🗣️',
    'Mathématiques': '🔢',
    'Sciences': '🔬',
    'Histoire': '📜',
    'Philosophie': '🤔',
    'Physique': '⚛️',
    'Informatique': '💻',
    'Anglais': '🇬🇧',
    'Lecture': '📚'
  };

  const subjectIcon = subjectIcons[activeSubject] || '📚';

  const objectiveText = useMemo(() => {
    switch (objectiveStatus) {
      case 'completed': return 'ATTEINT';
      case 'on-track': return 'EN COURS';
      case 'in-progress': return 'EN COURS';
      case 'at-risk': return 'À RISQUE';
      default: return 'EN ATTENTE';
    }
  }, [objectiveStatus]);

  return (
    <div 
      className="dashboard-card learning-status-card priority-high"
      onClick={navigateToPlanner}
      role="button"
      tabIndex={0}
      aria-label="Bloc apprentissage - Cliquer pour accéder au planificateur"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigateToPlanner();
        }
      }}
    >
      <div className="card-glow"></div>
      
      <div className="card-header">
        <span className="card-icon">{subjectIcon}</span>
        <h3 className="card-title">APPRENTISSAGE</h3>
        <span className={`card-badge ${objectiveStatus}`}>{objectiveText}</span>
      </div>
      
      <div className="card-content">
        <div className="active-subject">
          <div className="subject-display">
            <span className="subject-icon-large">{subjectIcon}</span>
            <div className="subject-info">
              <div className="subject-name">{activeSubject}</div>
              <div className="subject-type">{subjectType}</div>
            </div>
          </div>
          
          <div className="learning-stats">
            <div className="stat">
              <span className="stat-label">Streak</span>
              <span className="stat-value">{streak} jours</span>
            </div>
            <div className="stat">
              <span className="stat-label">Sessions</span>
              <span className="stat-value">{sessionsCompleted}/{sessionsPlanned}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Objectif</span>
              <span className="stat-value">{formatDuration(dailyObjectiveMinutes)}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Restant</span>
              <span className="stat-value">{formatDuration(timeRemainingToday)}</span>
            </div>
          </div>
        </div>
        
        <div className="daily-progress">
          <div className="progress-header">
            <span className="progress-label">Sessions aujourd'hui</span>
            <span className="progress-count">{sessionsCompleted}/{sessionsPlanned}</span>
          </div>
          
          <div className="progress-bar">
            <div 
              className={`progress-fill ${progressClass}`}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          
          <div className="progress-details">
            <div className="time-studied">
              <span className="time-icon">⏱️</span>
              <span className="time-text">{formatDuration(timeStudied)} étudié</span>
            </div>
            <div className="time-remaining">
              <span className="remaining-text">{formatDuration(timeRemainingToday)} restant</span>
            </div>
          </div>
        </div>
        
        <div className={`daily-objective ${objectiveStatus}`}>
          <div className="objective-indicator">
            <span className="objective-icon">{getObjectiveIcon(objectiveStatus)}</span>
            <span className="objective-text">{getObjectiveMessage(objectiveStatus)}</span>
          </div>
        </div>
        
        <div className="status-extras">
          {!hasSessionToday && !isTimerActive && (
            <div className="start-timer">
              <button 
                className="start-session-btn" 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  startFirstSession(); 
                }}
              >
                <span className="btn-icon">▶️</span>
                <span className="btn-text">Commencer première session</span>
              </button>
            </div>
          )}
          
          {latestReward && (
            <div className="latest-reward">
              <div className="reward-display">
                <span className="reward-icon">{latestReward.icon || '🏆'}</span>
                <span className="reward-text">{latestReward.name}</span>
                <span className="reward-date">{formatRewardDate(latestReward.date)}</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="quick-actions">
          <button 
            className="action-btn primary" 
            onClick={(e) => { 
              e.stopPropagation(); 
              startSession(); 
            }}
            disabled={isTimerActive}
          >
            <span className="btn-icon">{isTimerActive ? '⏱️' : '🎯'}</span>
            <span className="btn-text">{isTimerActive ? 'En cours' : 'Session'}</span>
          </button>
          
          <button 
            className="action-btn secondary" 
            onClick={(e) => { 
              e.stopPropagation(); 
              openNotes(e); 
            }}
          >
            <span className="btn-icon">📝</span>
            <span className="btn-text">Notes</span>
          </button>
        </div>
      </div>
    </div>
  );
};

LearningStatusBlock.propTypes = {
  allData: PropTypes.shape({
    mockData: PropTypes.shape({
      learningStatus: PropTypes.shape({
        activeSubject: PropTypes.string,
        subjectType: PropTypes.string,
        sessionsCompleted: PropTypes.number,
        sessionsPlanned: PropTypes.number,
        timeStudiedToday: PropTypes.number,
        dailyObjectiveMinutes: PropTypes.number,
        streakDays: PropTypes.number,
        subjects: PropTypes.arrayOf(PropTypes.string),
        latestReward: PropTypes.shape({
          name: PropTypes.string,
          icon: PropTypes.string,
          date: PropTypes.string
        })
      }),
      activeTimer: PropTypes.shape({
        isActive: PropTypes.bool
      }),
      user: PropTypes.shape({
        streakDays: PropTypes.number
      })
    })
  }),
  learningData: PropTypes.shape({
    activeSubject: PropTypes.string,
    dailyGoal: PropTypes.number,
    subjects: PropTypes.arrayOf(PropTypes.string),
    todaySessions: PropTypes.shape({
      totalTime: PropTypes.number,
      sessions: PropTypes.array
    }),
    streak: PropTypes.number
  }),
  onStartTimer: PropTypes.func,
  onOpenNotes: PropTypes.func,
  onNavigate: PropTypes.func
};

export default LearningStatusBlock;
