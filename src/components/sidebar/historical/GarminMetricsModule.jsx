import React, { memo, useCallback } from 'react';

/**
 * Module de métriques Garmin (Position 5)
 * Affiche les métriques Garmin du jour avec navigation vers Sport > Aujourd'hui
 * Structure identique aux anciens modules sidebar - PATTERN LEGACY
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */
const GarminMetricsModule = memo(({ 
  isExpanded,
  onToggle,
  data = {},
  navigation
}) => {

  // Pas d'état local, pas de useEffect - PATTERN LEGACY
  // Utiliser directement les props comme les modules legacy
  const metrics = data?.sport?.todayMetrics || {
    calories: { active: 245, resting: 1456, total: 1701 },
    bodyBattery: 78,
    steps: 8432,
    heartRate: { resting: 58, average: 72, max: 145 }
  };

  /**
   * Navigation vers Sport > sous-onglet Aujourd'hui
   */
  const handleNavigateToSport = useCallback(() => {
    if (!navigation) return;

    const target = {
      tab: 'sport',
      subtab: 'today',
      moduleId: 'garmin-today-module',
      scrollBehavior: 'smooth',
      highlightDuration: 2000
    };

    navigation.navigateToModule(target);
  }, [navigation]);

  /**
   * Formate les calories pour l'affichage
   */
  const formatCalories = (calories) => {
    if (!calories) return { active: 0, resting: 0, total: 0 };
    
    if (typeof calories === 'number') {
      return { active: 0, resting: calories, total: calories };
    }
    
    return {
      active: calories.active || 0,
      resting: calories.resting || 0,
      total: calories.total || calories.active + calories.resting || 0
    };
  };

  /**
   * Formate la fréquence cardiaque pour l'affichage
   */
  const formatHeartRate = (heartRate) => {
    if (!heartRate) return { resting: null, max: null, average: null };
    
    return {
      resting: heartRate.resting || heartRate.rest || null,
      max: heartRate.max || heartRate.maximum || null,
      average: heartRate.avg || heartRate.average || null
    };
  };

  const calories = formatCalories(metrics.calories);
  const heartRate = formatHeartRate(metrics.heartRate);
  const bodyBattery = metrics.bodyBattery || null;
  const steps = metrics.steps || 0;

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
          <span className="sidebar-section-icon">⌚</span>
          Métriques Garmin
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
          <div className="sidebar-data-grid">
            {/* Calories */}
            <div className="sidebar-data-card clickable" onClick={handleNavigateToSport}>
              <span className="sidebar-data-icon">🔥</span>
              <div className="sidebar-data-value">
                {calories.active} + {calories.resting}
              </div>
              <div className="sidebar-data-label">Calories</div>
              <div className="sidebar-data-hint">Voir détails</div>
            </div>

            {/* Body Battery */}
            {bodyBattery !== null && (
              <div className="sidebar-data-card clickable" onClick={handleNavigateToSport}>
                <span className="sidebar-data-icon">🔋</span>
                <div className="sidebar-data-value">{bodyBattery}%</div>
                <div className="sidebar-data-label">Body Battery</div>
                <div className="sidebar-data-hint">Voir détails</div>
              </div>
            )}

            {/* Pas */}
            <div className="sidebar-data-card clickable" onClick={handleNavigateToSport}>
              <span className="sidebar-data-icon">👟</span>
              <div className="sidebar-data-value">{steps.toLocaleString()}</div>
              <div className="sidebar-data-label">Pas</div>
              <div className="sidebar-data-hint">Voir détails</div>
            </div>

            {/* Fréquence Cardiaque */}
            <div className="sidebar-data-card clickable" onClick={handleNavigateToSport}>
              <span className="sidebar-data-icon">❤️</span>
              <div className="sidebar-data-value">
                {heartRate.resting || heartRate.average || 'N/A'} bpm
              </div>
              <div className="sidebar-data-label">FC Repos</div>
              <div className="sidebar-data-hint">Voir détails</div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
});

GarminMetricsModule.displayName = 'GarminMetricsModule';

export default GarminMetricsModule;