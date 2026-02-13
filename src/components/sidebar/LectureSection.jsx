/**
 * LectureSection - Section Livres de la Sidebar
 * Affiche les statistiques de lecture avec navigation contextuelle
 * 
 * Performance optimizations:
 * - React.memo pour éviter les re-renders inutiles
 * - useCallback pour les event handlers
 * - useMemo pour les calculs coûteux
 * 
 * @module components/sidebar/LectureSection
 */

import { memo, useCallback, useMemo } from 'react';

/**
 * Section Lecture (ex-Livres)
 * Toutes les cartes sont cliquables et mènent vers les sections appropriées
 * 
 * Requirements: 2.6, 2.7, 5.1, 5.2, 5.3, 5.4, 5.5, 9.1, 9.2
 */
const LectureSection = memo(({ isExpanded, onToggle, data, navigation, todayDate, embedded = false }) => {
  // Données défensives pour éviter NaN / undefined (module unifié, chargement, etc.)
  const safeData = useMemo(() => ({
    currentBooks: 0,
    todayPages: 0,
    todayMinutes: 0,
    dailyGoal: 30,
    hasData: false,
    ...(data || {})
  }), [data]);

  // Memoize expensive calculations
  const progressPercentage = useMemo(() => {
    return safeData.dailyGoal > 0 
      ? Math.round((safeData.todayMinutes / safeData.dailyGoal) * 100) 
      : 0;
  }, [safeData.dailyGoal, safeData.todayMinutes]);

  // Memoize navigation callbacks to prevent unnecessary re-renders
  const handleCurrentBooksClick = useCallback(() => {
    navigation.toBooks({ filter: 'current' });
  }, [navigation]);

  const handleTodayStatsClick = useCallback(() => {
    navigation.toBooks({ tab: 'stats', date: todayDate });
  }, [navigation, todayDate]);

  const handleSessionsClick = useCallback(() => {
    navigation.toBooks({ tab: 'stats', section: 'sessions' });
  }, [navigation]);

  const handleSettingsClick = useCallback(() => {
    navigation.toBooks({ action: 'settings' });
  }, [navigation]);

  const handleProgressionClick = useCallback(() => {
    navigation.toBooks({ tab: 'stats', section: 'progression' });
  }, [navigation]);

  // Memoize keyboard event handler
  const handleKeyDown = useCallback((e, callback) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      callback();
    }
  }, []);

  const content = (
    <div className="sidebar-section-content">
          <div className="sidebar-data-grid">
            {/* Livres en cours - Cliquable → Livres (filtre: en cours) */}
            <div 
              className="sidebar-data-card clickable"
              onClick={handleCurrentBooksClick}
              onKeyDown={(e) => handleKeyDown(e, handleCurrentBooksClick)}
              role="button"
              tabIndex={0}
              aria-label={`${safeData.currentBooks} livres en cours. Cliquer pour voir la liste`}
              title="Voir les livres en cours"
            >
              <span className="sidebar-data-icon" aria-hidden="true">📚</span>
              <div className="sidebar-data-value">{safeData.currentBooks}</div>
              <div className="sidebar-data-label">En cours</div>
            </div>
            
            {/* Pages lues aujourd'hui - Cliquable → Livres > Stats (aujourd'hui) */}
            <div 
              className="sidebar-data-card clickable"
              onClick={handleTodayStatsClick}
              onKeyDown={(e) => handleKeyDown(e, handleTodayStatsClick)}
              role="button"
              tabIndex={0}
              aria-label={`${safeData.todayPages} pages lues aujourd'hui. Cliquer pour voir les statistiques`}
              title="Voir les statistiques du jour"
            >
              <span className="sidebar-data-icon" aria-hidden="true">📄</span>
              <div className="sidebar-data-value">{safeData.todayPages}</div>
              <div className="sidebar-data-label">Pages</div>
            </div>
            
            {/* Temps de lecture - Cliquable → Livres > Stats > Sessions */}
            <div 
              className="sidebar-data-card clickable"
              onClick={handleSessionsClick}
              onKeyDown={(e) => handleKeyDown(e, handleSessionsClick)}
              role="button"
              tabIndex={0}
              aria-label={`${safeData.todayMinutes} minutes de lecture. Cliquer pour voir les sessions`}
              title="Voir le détail des sessions"
            >
              <span className="sidebar-data-icon" aria-hidden="true">⏰</span>
              <div className="sidebar-data-value">{safeData.todayMinutes}min</div>
              <div className="sidebar-data-label">Lecture</div>
            </div>
            
            {/* Objectif quotidien - Cliquable → Livres > Paramètres */}
            <div 
              className="sidebar-data-card clickable"
              onClick={handleSettingsClick}
              onKeyDown={(e) => handleKeyDown(e, handleSettingsClick)}
              role="button"
              tabIndex={0}
              aria-label={`Objectif quotidien: ${safeData.dailyGoal} minutes. Cliquer pour modifier`}
              title="Modifier l'objectif quotidien"
            >
              <span className="sidebar-data-icon" aria-hidden="true">🎯</span>
              <div className="sidebar-data-value">{safeData.dailyGoal}min</div>
              <div className="sidebar-data-label">Objectif</div>
            </div>
          </div>
          
          {/* Progression du jour - Barre cliquable → Livres > Stats > Progression */}
          {safeData.dailyGoal > 0 && (
            <div 
              className="sidebar-info-box clickable"
              onClick={handleProgressionClick}
              onKeyDown={(e) => handleKeyDown(e, handleProgressionClick)}
              role="button"
              tabIndex={0}
              aria-label={`Progression du jour: ${safeData.todayMinutes} sur ${safeData.dailyGoal} minutes (${progressPercentage}%). Cliquer pour voir la progression détaillée`}
              title="Voir la progression détaillée"
            >
              <div className="sidebar-info-title">Progression du jour</div>
              <div className="sidebar-info-content">
                <span className="sidebar-info-icon" aria-hidden="true">📊</span>
                <span>{safeData.todayMinutes} / {safeData.dailyGoal} min ({progressPercentage}%)</span>
              </div>
              <div className="sidebar-progress-mini">
                <div 
                  className="sidebar-progress-mini-bar" 
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  role="progressbar"
                  aria-valuenow={progressPercentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                ></div>
              </div>
            </div>
          )}
          
          {/* Indicateur données manquantes - cliquable → Livres */}
          {!safeData.hasData && (
            <div 
              className="sidebar-info-box warning clickable"
              onClick={handleSettingsClick}
              onKeyDown={(e) => handleKeyDown(e, handleSettingsClick)}
              role="button"
              tabIndex={0}
              aria-label="Données de lecture non disponibles. Cliquer pour ouvrir les paramètres Livres"
              title="Ouvrir les paramètres Livres"
            >
              <span className="sidebar-info-icon" aria-hidden="true">⚠️</span>
              <span>Données de lecture non disponibles</span>
            </div>
          )}
        </div>
  );

  if (embedded) {
    return isExpanded ? content : null;
  }

  return (
    <section className={`sidebar-section ${isExpanded ? 'expanded' : ''}`}>
      <header 
        className="sidebar-section-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label="Section Lecture"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <h2 className="sidebar-section-title">
          <span className="sidebar-section-icon" aria-hidden="true">📖</span>
          Lecture
        </h2>
        <span 
          className={`sidebar-section-toggle ${isExpanded ? 'expanded' : ''}`}
          aria-hidden="true"
        >
          ▼
        </span>
      </header>
      {isExpanded && content}
    </section>
  );
});

LectureSection.displayName = 'LectureSection';

export default LectureSection;
