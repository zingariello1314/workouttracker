import React, { memo, useCallback, useMemo, useState } from 'react';
import { openApprentissageDB, loadSessionsHistoryFromIndexedDB, loadSubjectsFromIndexedDB, loadProgressionFromIndexedDB } from '../../../utils/apprentissageIndexedDB';
import '../../../styles/express-learning-module.css';

/**
 * ExpressLearningModule - Module Apprentissage Express (Position 21)
 * Affiche les sessions récentes, temps d'étude total, progression par domaine et statistiques de régularité
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */
const ExpressLearningModule = memo(({ 
  isExpanded,
  onToggle,
  data = {},
  navigation
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [learningData, setLearningData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Périodes configurables pour les calculs
  const periods = {
    '7d': { label: '7j', days: 7 },
    '30d': { label: '30j', days: 30 },
    '3m': { label: '3m', days: 90 },
    '6m': { label: '6m', days: 180 },
    '1y': { label: '1a', days: 365 }
  };

  // Charger les données d'apprentissage
  const loadLearningData = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const db = await openApprentissageDB();
      if (!db) {
        // Fallback vers localStorage si IndexedDB indisponible
        const subjects = JSON.parse(localStorage.getItem('apprentissage_subjects') || '[]');
        const sessions = JSON.parse(localStorage.getItem('apprentissage_sessions_history') || '[]');
        const progression = JSON.parse(localStorage.getItem('apprentissage_progression') || '{}');
        
        setLearningData({ subjects, sessions, progression });
        setHasLoaded(true);
        return;
      }

      const [subjects, sessions, progression] = await Promise.all([
        loadSubjectsFromIndexedDB(db),
        loadSessionsHistoryFromIndexedDB(db),
        loadProgressionFromIndexedDB(db)
      ]);

      setLearningData({
        subjects: subjects || [],
        sessions: sessions || [],
        progression: progression || {}
      });
      setHasLoaded(true);
    } catch (error) {
      console.error('[ExpressLearningModule] Erreur chargement données:', error);
      setLearningData({ subjects: [], sessions: [], progression: {} });
      setHasLoaded(true);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Charger les données au montage uniquement
  React.useEffect(() => {
    if (!hasLoaded) {
      loadLearningData();
    }
  }, [hasLoaded, loadLearningData]);

  // Calculer les statistiques pour la période sélectionnée
  const statistics = useMemo(() => {
    if (!learningData) {
      return {
        recentSessions: [],
        totalStudyTime: 0,
        subjectProgression: [],
        regularityStats: { streak: 0, consistency: 0, averageDaily: 0 }
      };
    }

    const { subjects, sessions, progression } = learningData;
    const periodDays = periods[selectedPeriod].days;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - periodDays);

    // Filtrer les sessions de la période
    const periodSessions = sessions.filter(session => {
      const sessionDate = new Date(session.startTime || session.date);
      return sessionDate >= cutoffDate;
    });

    // Sessions récentes par matière (dernières 5)
    const recentSessions = periodSessions
      .slice(0, 5)
      .map(session => ({
        subject: session.subject || 'Matière inconnue',
        duration: Math.round((session.duration || 0) / 60), // en minutes
        date: new Date(session.startTime || session.date),
        xpGained: session.xpGained || 0
      }));

    // Temps d'étude total sur la période (en heures)
    const totalStudyTime = Math.round(
      periodSessions.reduce((total, session) => total + (session.duration || 0), 0) / 3600
    );

    // Progression par domaine de connaissance
    const subjectStats = {};
    subjects.forEach(subject => {
      const subjectSessions = periodSessions.filter(s => s.subject === subject.name);
      const totalTime = subjectSessions.reduce((total, s) => total + (s.duration || 0), 0);
      const sessionCount = subjectSessions.length;
      const avgXP = progression.subjects?.[subject.id]?.xp || 0;
      const level = progression.subjects?.[subject.id]?.level || 1;

      if (sessionCount > 0) {
        subjectStats[subject.name] = {
          name: subject.name,
          icon: subject.icon || '📚',
          totalTime: Math.round(totalTime / 60), // en minutes
          sessionCount,
          level,
          xp: avgXP,
          progress: Math.min((avgXP % 100), 100) // Progression vers niveau suivant
        };
      }
    });

    const subjectProgression = Object.values(subjectStats)
      .sort((a, b) => b.totalTime - a.totalTime)
      .slice(0, 3); // Top 3 matières

    // Statistiques de régularité
    const dailyStats = {};
    periodSessions.forEach(session => {
      const dateKey = new Date(session.startTime || session.date).toISOString().split('T')[0];
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = 0;
      }
      dailyStats[dateKey] += session.duration || 0;
    });

    const studyDays = Object.keys(dailyStats).length;
    const consistency = Math.round((studyDays / periodDays) * 100);
    const averageDaily = studyDays > 0 ? Math.round(totalStudyTime / studyDays * 10) / 10 : 0;
    
    // Calcul du streak (jours consécutifs)
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < periodDays; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateKey = checkDate.toISOString().split('T')[0];
      
      if (dailyStats[dateKey]) {
        streak++;
      } else {
        break;
      }
    }

    return {
      recentSessions,
      totalStudyTime,
      subjectProgression,
      regularityStats: { streak, consistency, averageDaily }
    };
  }, [learningData, selectedPeriod, periods]);

  /**
   * Navigation vers Paramètres > module apprentissage
   * Requirement 11.4
   */
  const handleNavigation = useCallback(() => {
    if (!navigation) return;
    
    // Navigation précise vers l'onglet Paramètres > module apprentissage
    navigation.navigateToModule({
      tab: 'settings',
      subtab: 'learning',
      moduleId: 'apprentissage-main',
      scrollBehavior: 'smooth',
      highlightDuration: 2000
    });
  }, [navigation]);

  // Formater la durée
  const formatDuration = useCallback((minutes) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins}min` : `${hours}h`;
  }, []);

  // Formater la date relative
  const formatRelativeDate = useCallback((date) => {
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }, []);

  return (
    <section className={`sidebar-section ${isExpanded ? 'expanded' : ''}`}>
      <header 
        className="sidebar-section-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
      >
        <h2 className="sidebar-section-title">
          <span className="sidebar-section-icon">⚡</span>
          Apprentissage Express
        </h2>
        <span 
          className={`sidebar-section-toggle ${isExpanded ? 'expanded' : ''}`}
          aria-hidden="true"
        >
          ▼
        </span>
      </header>
      
      {isExpanded && (
        <div className="sidebar-section-content">
          {isLoading ? (
            <div className="sidebar-loading">
              <span className="sidebar-loading-icon">⏳</span>
              <span>Chargement...</span>
            </div>
          ) : (
            <div className="sidebar-data-grid">
              {/* Sélecteur de période */}
              <div className="sidebar-data-card" style={{ gridColumn: '1 / -1' }}>
                <div className="sidebar-data-header">
                  <span className="sidebar-data-icon">⚙️</span>
                  <span className="sidebar-data-label">Période</span>
                </div>
                <div className="sidebar-period-buttons">
                  {Object.entries(periods).map(([key, period]) => (
                    <button
                      key={key}
                      className={`sidebar-period-btn ${selectedPeriod === key ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPeriod(key);
                      }}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        background: selectedPeriod === key ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '0.25rem',
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {period.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Temps d'étude total - Requirement 11.2 */}
              <div className="sidebar-data-card clickable" onClick={handleNavigation}>
                <span className="sidebar-data-icon">⏱️</span>
                <div className="sidebar-data-value">{statistics.totalStudyTime}h</div>
                <div className="sidebar-data-label">Temps d'étude</div>
                <div className="sidebar-data-hint">{periods[selectedPeriod].label}</div>
              </div>

              {/* Régularité - Requirement 11.5 */}
              <div className="sidebar-data-card clickable" onClick={handleNavigation}>
                <span className="sidebar-data-icon">🔥</span>
                <div className="sidebar-data-value">{statistics.regularityStats.streak}</div>
                <div className="sidebar-data-label">Streak</div>
                <div className="sidebar-data-hint">{statistics.regularityStats.consistency}% régularité</div>
              </div>

              {/* Sessions récentes par matière - Requirement 11.1 */}
              <div className="sidebar-data-card" style={{ gridColumn: '1 / -1' }}>
                <div className="sidebar-data-header">
                  <span className="sidebar-data-icon">📚</span>
                  <span className="sidebar-data-label">Sessions récentes</span>
                </div>
                <div className="sidebar-data-list">
                  {statistics.recentSessions.length > 0 ? (
                    statistics.recentSessions.map((session, index) => (
                      <div key={index} className="sidebar-data-item">
                        <div className="sidebar-data-item-main">
                          <span className="sidebar-data-item-title">{session.subject}</span>
                          <span className="sidebar-data-item-value">{formatDuration(session.duration)}</span>
                        </div>
                        <div className="sidebar-data-item-subtitle">{formatRelativeDate(session.date)}</div>
                      </div>
                    ))
                  ) : (
                    <div className="sidebar-empty-state">Aucune session récente</div>
                  )}
                </div>
              </div>

              {/* Progression par domaine - Requirement 11.3 */}
              <div className="sidebar-data-card" style={{ gridColumn: '1 / -1' }}>
                <div className="sidebar-data-header">
                  <span className="sidebar-data-icon">📈</span>
                  <span className="sidebar-data-label">Top matières</span>
                </div>
                <div className="sidebar-data-list">
                  {statistics.subjectProgression.length > 0 ? (
                    statistics.subjectProgression.map((subject, index) => (
                      <div key={index} className="sidebar-data-item">
                        <div className="sidebar-data-item-main">
                          <span className="sidebar-data-item-icon">{subject.icon}</span>
                          <span className="sidebar-data-item-title">{subject.name}</span>
                          <span className="sidebar-data-item-badge">Niv. {subject.level}</span>
                        </div>
                        <div className="sidebar-data-item-subtitle">
                          <span>{formatDuration(subject.totalTime)}</span>
                          <div className="sidebar-progress-bar" style={{ 
                            flex: 1, 
                            height: '4px', 
                            background: 'rgba(255, 255, 255, 0.1)', 
                            borderRadius: '2px',
                            marginLeft: '0.5rem'
                          }}>
                            <div 
                              className="sidebar-progress-fill" 
                              style={{ 
                                width: `${subject.progress}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                                borderRadius: '2px',
                                transition: 'width 0.3s ease'
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="sidebar-empty-state">Aucune progression récente</div>
                  )}
                </div>
              </div>

              {/* Statistiques de régularité détaillées */}
              <div className="sidebar-data-card clickable" onClick={handleNavigation}>
                <span className="sidebar-data-icon">📊</span>
                <div className="sidebar-data-value">{statistics.regularityStats.averageDaily}h</div>
                <div className="sidebar-data-label">Moyenne/jour</div>
                <div className="sidebar-data-hint">Voir détails</div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
});

ExpressLearningModule.displayName = 'ExpressLearningModule';

export default ExpressLearningModule;
