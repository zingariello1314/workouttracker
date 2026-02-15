import React, { memo, useCallback, useMemo } from 'react';
import useMuscleGroups from '../../../hooks/useMuscleGroups';
import useWeeklyMissions from '../../../hooks/useWeeklyMissions';
import { useWorkout } from '../../../context/WorkoutContext';
import { getTodayWorkoutsFromData } from '../../../context/WorkoutContext/utils/workoutHistoryUtils';
import { getDateStr, getAutoWeekVariant } from '../../../utils/dateUtils';
import '../../../styles/sidebar-visual-enhancements.css';

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
  const { muscleGroups, loading: muscleLoading } = useMuscleGroups();
  const { getMissionsForDay } = useWeeklyMissions();
  const {
    getTodayWorkout,
    getCurrentData,
    updateTempExerciseData,
    workoutDayOverride,
    isGymMode,
    tempData
  } = useWorkout();
  // tempData en dépendance pour réactivité : coche dans Sport > Aujourd'hui se reflète ici (et inversement)

  const currentDate = new Date();
  const dateStr = getDateStr(currentDate);

  const today = useMemo(() => {
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    return days[new Date().getDay()];
  }, []);

  // Séance planifiée : programme en cours + jour en cours (ou jour choisi si "Utiliser l'entraînement de : Lundi")
  // getTodayWorkout utilise déjà workoutDayOverride en interne → on affiche la bonne séance
  const plannedWorkout = useMemo(() => {
    try {
      const workout = getTodayWorkout?.(new Date(), isGymMode ?? false);
      const list = workout?.exercices ?? workout?.exercises;
      if (list?.length > 0) {
        return {
          name: workout.name || 'Séance du jour',
          count: list.length,
          dayLabel: workoutDayOverride || today
        };
      }
    } catch (_) {}
    const dayData = getMissionsForDay(today);
    const missions = dayData.missions?.filter(mission => 
      mission.name?.toLowerCase().includes('sport') ||
      mission.name?.toLowerCase().includes('entraînement') ||
      mission.name?.toLowerCase().includes('musculation') ||
      mission.name?.toLowerCase().includes('cardio') ||
      mission.name?.toLowerCase().includes('fitness')
    ) || [];
    if (missions.length > 0) return { name: missions[0].name, count: missions.length, missions };
    return null;
  }, [getTodayWorkout, getMissionsForDay, today, workoutDayOverride, isGymMode]);

  // Workout complet avec liste d'exercices pour les cartes (même source que plannedWorkout)
  const todayWorkoutWithExercices = useMemo(() => {
    try {
      const workout = getTodayWorkout?.(new Date(), isGymMode ?? false);
      const list = workout?.exercices ?? workout?.exercises ?? [];
      if (list?.length > 0) return { ...workout, exercices: list };
    } catch (_) {}
    return null;
  }, [getTodayWorkout, isGymMode, workoutDayOverride, dateStr]);

  // Clé d'exercice (alignée avec TodayTab : _semaineA/_semaineB en mode salle)
  const getExerciseKey = useCallback((exerciseId) => {
    let key = `${dateStr}_${exerciseId}`;
    if (isGymMode && todayWorkoutWithExercices?.isGymMode) {
      const variant = getAutoWeekVariant(currentDate);
      key += variant === 'A' ? '_semaineA' : '_semaineB';
    }
    return key;
  }, [dateStr, isGymMode, todayWorkoutWithExercices?.isGymMode, currentDate]);

  // Toggle cocher / décocher un exercice (avec auto-reps si série fournie)
  const handleExerciseCheck = useCallback((exerciseId, exercise) => {
    const currentData = getCurrentData?.() || {};
    const key = getExerciseKey(exerciseId);
    const isChecked = currentData.checkedExercises?.[key] || false;
    if (isChecked) {
      updateTempExerciseData?.({
        ...currentData,
        checkedExercises: { ...currentData.checkedExercises, [key]: false },
        reps: { ...currentData.reps, [key]: undefined }
      });
      return;
    }
    let autoReps = null;
    if (exercise?.series?.includes('×')) {
      const m = exercise.series.match(/(\d+)×(\d+)(?:-(\d+))?/);
      if (m) {
        const sets = parseInt(m[1]);
        const minR = parseInt(m[2]);
        const maxR = m[3] ? parseInt(m[3]) : minR;
        autoReps = sets * Math.round((minR + maxR) / 2);
      }
    }
    updateTempExerciseData?.({
      ...currentData,
      checkedExercises: { ...currentData.checkedExercises, [key]: true },
      reps: { ...currentData.reps, [key]: autoReps != null ? String(autoReps) : (currentData.reps?.[key] || '') }
    });
  }, [getCurrentData, getExerciseKey, updateTempExerciseData]);

  // Mise à jour des reps
  const handleUpdateReps = useCallback((exerciseId, value) => {
    const currentData = getCurrentData?.() || {};
    const key = getExerciseKey(exerciseId);
    const clean = value === '' || value == null ? '' : String(Math.min(999, Math.max(0, parseInt(value) || 0)));
    updateTempExerciseData?.({
      ...currentData,
      reps: { ...currentData.reps, [key]: clean }
    });
  }, [getCurrentData, getExerciseKey, updateTempExerciseData]);

  // Détection unité (reps / sec / min) pour le placeholder
  const getExerciseUnit = useCallback((ex) => {
    if (!ex?.series) return { unit: 'reps', label: 'Reps' };
    const s = ex.series.toLowerCase();
    if (s.includes('sec') || s.includes('séc')) return { unit: 'sec', label: 'sec' };
    if (s.includes('min')) return { unit: 'min', label: 'min' };
    return { unit: 'reps', label: 'Reps' };
  }, []);

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

  // Séances réalisées aujourd'hui (données workout cochées)
  const todaySessionsCount = useMemo(() => {
    try {
      const currentData = getCurrentData?.();
      return getTodayWorkoutsFromData(currentData || {}, new Date()).length;
    } catch (_) {
      return 0;
    }
  }, [getCurrentData, data?.sport, tempData]);

  // Objectifs du jour : pas et calories (Garmin/sidebar), séances (workout data)
  const dailyObjectives = useMemo(() => {
    const sportData = data?.sport || {};
    const todayMetrics = sportData.todayMetrics || {};
    const stepsCurrent = todayMetrics.steps ?? sportData.todaySteps ?? 0;
    const caloriesCurrent = todayMetrics.totalCaloriesBurned ?? sportData.todayCalories ?? 0;
    const stepsTarget = sportData.stepsGoal ?? 8500;
    const caloriesTarget = sportData.caloriesGoal ?? 1650;

    const objectives = {
      steps: {
        current: stepsCurrent,
        target: stepsTarget,
        unit: 'pas',
        progressPercent: stepsTarget > 0 ? Math.min(100, Math.round((stepsCurrent / stepsTarget) * 100)) : 0
      },
      calories: {
        current: caloriesCurrent,
        target: caloriesTarget,
        unit: 'cal',
        progressPercent: caloriesTarget > 0 ? Math.min(100, Math.round((caloriesCurrent / caloriesTarget) * 100)) : 0
      },
      workouts: {
        current: todaySessionsCount,
        target: 1,
        unit: 'séances',
        progressPercent: Math.min(100, todaySessionsCount * 100)
      }
    };
    return objectives;
  }, [data, todaySessionsCount, plannedWorkout]);

  // Navigation vers Sport > Aujourd'hui (onglet principal = 'today')
  const handleNavigateToSport = useCallback(() => {
    if (!navigation?.setActiveTab) return;
    try {
      localStorage.setItem('sport.lastSubTab', 'today');
      navigation.setActiveTab('today');
    } catch (error) {
      console.error('[DailyTrainingModule] Erreur navigation sport:', error);
    }
  }, [navigation]);

  // Navigation vers Sport > Aujourd'hui (muscles = même onglet pour l'instant)
  const handleNavigateToMuscles = useCallback(() => {
    if (!navigation?.setActiveTab) return;
    try {
      localStorage.setItem('sport.lastSubTab', 'today');
      navigation.setActiveTab('today');
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
          {/* Liste des exercices du jour – cartes style quêtes avec coche + reps */}
          {!todayWorkoutWithExercices ? (
            <div className="sidebar-info-box">
              <span className="sidebar-info-icon">🏆</span>
              <span>Aucune séance planifiée</span>
              <button 
                type="button"
                className="sidebar-action-button-small"
                onClick={handleNavigateToSport}
              >
                Planifier une séance
              </button>
            </div>
          ) : (
            <div className="sidebar-training-sessions">
              <div className="sidebar-workout-name-badge">
                <span className="sidebar-workout-name-icon" aria-hidden="true">
                  {(todayWorkoutWithExercices.name || '').toLowerCase().includes('repos') ? '🏠' : '💪'}
                </span>
                <span className="sidebar-workout-name-text">{todayWorkoutWithExercices.name || 'Séance du jour'}</span>
              </div>
              <div className="sidebar-quest-list" style={{ marginBottom: 10 }}>
                {todayWorkoutWithExercices.exercices.map((exercise) => {
                  const key = getExerciseKey(exercise.id);
                  const currentData = getCurrentData?.() || {};
                  const isChecked = currentData.checkedExercises?.[key] || false;
                  const repsValue = currentData.reps?.[key] ?? '';
                  const unit = getExerciseUnit(exercise);
                  return (
                    <div
                      key={`ex-${exercise.id}-${key}`}
                      className={`stat-card-premium interactive-quest-card ${isChecked ? 'completed' : ''}`}
                    >
                      <div className="stat-header" style={{ alignItems: 'flex-start', gap: 8 }}>
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => handleExerciseCheck(exercise.id, exercise)}
                          onKeyDown={(e) => e.key === 'Enter' && handleExerciseCheck(exercise.id, exercise)}
                          aria-label={isChecked ? 'Décocher' : 'Cocher'}
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: isChecked ? 'var(--sidebar-premium-gradient-3)' : 'rgba(255,255,255,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            flexShrink: 0
                          }}
                        >
                          {isChecked ? '✓' : '○'}
                        </div>
                        <div className="sidebar-quest-info" style={{ flex: 1, minWidth: 0 }}>
                          <div className="stat-value" style={{ fontSize: '0.875rem', marginBottom: 2, textDecoration: isChecked ? 'line-through' : 'none', opacity: isChecked ? 0.85 : 1 }}>
                            {exercise.name}
                          </div>
                          <div className="stat-title" style={{ fontSize: '0.7rem', marginBottom: 6 }}>
                            {exercise.series}
                            {exercise.materiel && ` • ${exercise.materiel}`}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <input
                              type="number"
                              min={0}
                              max={999}
                              placeholder={unit.label}
                              value={repsValue}
                              onChange={(e) => handleUpdateReps(exercise.id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                width: 56,
                                padding: '4px 6px',
                                fontSize: 12,
                                textAlign: 'center',
                                borderRadius: 6,
                                border: '1px solid rgba(148,163,184,0.4)',
                                background: isChecked ? 'rgba(34,197,94,0.2)' : 'rgba(15,23,42,0.8)',
                                color: 'white'
                              }}
                            />
                            <span className="stat-title" style={{ fontSize: 10 }}>{unit.label}</span>
                            {isChecked && <span style={{ color: 'var(--sidebar-green)', fontSize: 11 }}>✓ Fait</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
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
            <div className="sidebar-objectives-header">
              <span className="sidebar-objectives-icon" aria-hidden="true">🎯</span>
              <span className="sidebar-objectives-title">Objectifs du jour</span>
            </div>
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
                  {Math.round(Number(dailyObjectives.calories.current) || 0)}
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