import React, { memo, useCallback, useMemo } from 'react';
import useMuscleGroups from '../../../hooks/useMuscleGroups';
import useWeeklyMissions from '../../../hooks/useWeeklyMissions';

/**
 * DailyTrainingModule - Module Entraînement du Jour (Position 15)
 * Structure identique aux anciens modules sidebar - PATTERN LEGACY
 * 
 * Fonctionnalités:
 * - Affichage des séances planifiées aujourd'hui
 * - Affichage des groupes musculaires ciblés avec progression
 * - Affichage des objectifs sportifs quotidiens
 * - Navigation vers Sport > module entraînement
 * - Mise à jour des indicateurs de progression
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */
const DailyTrainingModule = memo(({ 
  isExpanded,
  onToggle,
  data = {},
  navigation
}) => {
  // Hooks pour les données d'entraînement
  const { muscleGroups, loading: muscleLoading } = useMuscleGroups();
  const { missions, getMissionsForDay } = useWeeklyMissions();

  // Obtenir le jour actuel
  const today = useMemo(() => {
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    return days[new Date().getDay()];
  }, []);

  // Récupérer les missions sportives du jour
  const todayMissions = useMemo(() => {
    const dayData = getMissionsForDay(today);
    return dayData.missions?.filter(mission => 
      mission.name?.toLowerCase().includes('sport') ||
      mission.name?.toLowerCase().includes('entraînement') ||
      mission.name?.toLowerCase().includes('musculation') ||
      mission.name?.toLowerCase().includes('cardio') ||
      mission.name?.toLowerCase().includes('fitness')
    ) || [];
  }, [getMissionsForDay, today]);

  // Calculer les groupes musculaires ciblés aujourd'hui
  const todayMuscleGroups = useMemo(() => {
    if (!muscleGroups || muscleGroups.length === 0) return [];
    
    // Simuler une rotation des groupes musculaires basée sur le jour de la semaine
    const dayIndex = new Date().getDay();
    const groupsPerDay = Math.ceil(muscleGroups.length / 7);
    const startIndex = (dayIndex * groupsPerDay) % muscleGroups.length;
    
    return muscleGroups.slice(startIndex, startIndex + groupsPerDay).map(group => ({
      ...group,
      progressPercent: group.target > 0 ? Math.min(Math.round((group.current / group.target) * 100), 100) : 0
    }));
  }, [muscleGroups]);

  // Calculer les objectifs sportifs quotidiens
  const dailyObjectives = useMemo(() => {
    const sportData = data?.sport || {};
    const todayMetrics = sportData.todayMetrics || {};
    
    // Objectifs par défaut
    const objectives = {
      steps: {
        current: todayMetrics.steps || sportData.todaySteps || 0,
        target: 10000,
        unit: 'pas'
      },
      calories: {
        current: todayMetrics.totalCaloriesBurned || sportData.todayCalories || 0,
        target: 500,
        unit: 'cal'
      },
      workouts: {
        current: todayMissions.filter(m => m.completed).length,
        target: Math.max(1, todayMissions.length),
        unit: 'séances'
      }
    };

    // Calculer les pourcentages de progression
    Object.keys(objectives).forEach(key => {
      const obj = objectives[key];
      obj.progressPercent = obj.target > 0 ? Math.min(Math.round((obj.current / obj.target) * 100), 100) : 0;
    });

    return objectives;
  }, [data, todayMissions]);

  // Navigation vers Sport > module entraînement
  const handleNavigateToSport = useCallback(async () => {
    if (!navigation?.navigateToModule) return;
    
    try {
      await navigation.navigateToModule({
        tab: 'sport',
        subtab: 'today',
        moduleId: 'training-module',
        scrollBehavior: 'smooth',
        highlightDuration: 2000
      });
    } catch (error) {
      console.error('[DailyTrainingModule] Erreur navigation sport:', error);
    }
  }, [navigation]);

  // Navigation vers les groupes musculaires
  const handleNavigateToMuscles = useCallback(async () => {
    if (!navigation?.navigateToModule) return;
    
    try {
      await navigation.navigateToModule({
        tab: 'sport',
        subtab: 'muscles',
        moduleId: 'muscle-groups-grid',
        scrollBehavior: 'smooth',
        highlightDuration: 2000
      });
    } catch (error) {
      console.error('[DailyTrainingModule] Erreur navigation muscles:', error);
    }
  }, [navigation]);

  // Obtenir l'icône de progression
  const getProgressIcon = (percent) => {
    if (percent >= 100) return '✅';
    if (percent >= 75) return '🔥';
    if (percent >= 50) return '💪';
    if (percent >= 25) return '⚡';
    return '🎯';
  };

  // Obtenir la couleur de progression
  const getProgressColor = (percent) => {
    if (percent >= 100) return 'var(--sidebar-success)';
    if (percent >= 75) return 'var(--sidebar-gold)';
    if (percent >= 50) return 'var(--sidebar-cyan)';
    return 'var(--sidebar-orange)';
  };

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
          <span className="sidebar-section-icon">💪</span>
          Entraînement du Jour
          {todayMissions.length > 0 && (
            <span className="sidebar-section-badge">{todayMissions.length}</span>
          )}
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
          {/* Séances planifiées aujourd'hui */}
          {todayMissions.length === 0 ? (
            <div className="sidebar-info-box">
              <span className="sidebar-info-icon">🏋️</span>
              <span>Aucune séance planifiée</span>
              <button 
                className="sidebar-action-button-small"
                onClick={handleNavigateToSport}
              >
                Planifier une séance
              </button>
            </div>
          ) : (
            <div className="sidebar-training-sessions">
              <div className="sidebar-subsection-title">Séances du jour</div>
              {todayMissions.map(mission => (
                <div 
                  key={mission.id} 
                  className={`sidebar-training-item ${mission.completed ? 'completed' : ''}`}
                >
                  <div className="sidebar-training-status">
                    {mission.completed ? '✅' : '⏳'}
                  </div>
                  <div className="sidebar-training-info">
                    <div className="sidebar-training-name">{mission.name}</div>
                    <div className="sidebar-training-meta">
                      <span className="sidebar-training-target">
                        {mission.targetValue} {mission.unit}
                      </span>
                      <span className="sidebar-training-xp">{mission.xp || 10} XP</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Groupes musculaires ciblés */}
          {!muscleLoading && todayMuscleGroups.length > 0 && (
            <div className="sidebar-muscle-groups">
              <div className="sidebar-subsection-title">Muscles ciblés</div>
              <div className="sidebar-data-grid">
                {todayMuscleGroups.slice(0, 2).map(group => (
                  <div 
                    key={group.id} 
                    className="sidebar-data-card clickable"
                    onClick={handleNavigateToMuscles}
                  >
                    <span className="sidebar-data-icon">
                      {getProgressIcon(group.progressPercent)}
                    </span>
                    <div className="sidebar-data-value">
                      {group.current}/{group.target}
                    </div>
                    <div className="sidebar-data-label">{group.name}</div>
                    <div className="sidebar-data-progress">
                      <div 
                        className="sidebar-data-progress-bar" 
                        style={{ 
                          width: `${group.progressPercent}%`,
                          backgroundColor: getProgressColor(group.progressPercent)
                        }}
                      />
                    </div>
                    <div className="sidebar-data-hint">{group.progressPercent}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Objectifs sportifs quotidiens */}
          <div className="sidebar-daily-objectives">
            <div className="sidebar-subsection-title">Objectifs du jour</div>
            <div className="sidebar-data-grid">
              <div className="sidebar-data-card clickable" onClick={handleNavigateToSport}>
                <span className="sidebar-data-icon">👟</span>
                <div className="sidebar-data-value">
                  {dailyObjectives.steps.current.toLocaleString()}
                </div>
                <div className="sidebar-data-label">Pas</div>
                <div className="sidebar-data-progress">
                  <div 
                    className="sidebar-data-progress-bar" 
                    style={{ 
                      width: `${dailyObjectives.steps.progressPercent}%`,
                      backgroundColor: getProgressColor(dailyObjectives.steps.progressPercent)
                    }}
                  />
                </div>
                <div className="sidebar-data-hint">
                  {dailyObjectives.steps.progressPercent}% de {dailyObjectives.steps.target.toLocaleString()}
                </div>
              </div>

              <div className="sidebar-data-card clickable" onClick={handleNavigateToSport}>
                <span className="sidebar-data-icon">🔥</span>
                <div className="sidebar-data-value">
                  {dailyObjectives.calories.current}
                </div>
                <div className="sidebar-data-label">Calories</div>
                <div className="sidebar-data-progress">
                  <div 
                    className="sidebar-data-progress-bar" 
                    style={{ 
                      width: `${dailyObjectives.calories.progressPercent}%`,
                      backgroundColor: getProgressColor(dailyObjectives.calories.progressPercent)
                    }}
                  />
                </div>
                <div className="sidebar-data-hint">
                  {dailyObjectives.calories.progressPercent}% de {dailyObjectives.calories.target}
                </div>
              </div>

              <div className="sidebar-data-card clickable" onClick={handleNavigateToSport}>
                <span className="sidebar-data-icon">🏋️</span>
                <div className="sidebar-data-value">
                  {dailyObjectives.workouts.current}/{dailyObjectives.workouts.target}
                </div>
                <div className="sidebar-data-label">Séances</div>
                <div className="sidebar-data-progress">
                  <div 
                    className="sidebar-data-progress-bar" 
                    style={{ 
                      width: `${dailyObjectives.workouts.progressPercent}%`,
                      backgroundColor: getProgressColor(dailyObjectives.workouts.progressPercent)
                    }}
                  />
                </div>
                <div className="sidebar-data-hint">
                  {dailyObjectives.workouts.progressPercent}% complété
                </div>
              </div>
            </div>
          </div>

          {/* Navigation vers Sport */}
          <button 
            className="sidebar-action-button clickable"
            onClick={handleNavigateToSport}
          >
            <span className="sidebar-action-icon">🏋️</span>
            <span>Voir l'entraînement</span>
            <span className="sidebar-action-arrow">→</span>
          </button>
        </div>
      )}
    </section>
  );
});

DailyTrainingModule.displayName = 'DailyTrainingModule';

export default DailyTrainingModule;