/**
 * Section Activité Physique de la Sidebar Premium
 * Affiche les données sport et santé avec navigation contextuelle
 * 
 * @module components/sidebar/ActivitePhysiqueSection
 */

import React, { memo, useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * Section Activité Physique (ex-Sport & Santé)
 * Toutes les cartes sont cliquables et mènent vers les sections appropriées
 * 
 * Performance optimizations:
 * - React.memo pour éviter les re-renders inutiles
 * - useCallback pour les event handlers
 * 
 * @param {Object} props
 * @param {boolean} props.isExpanded - État d'expansion de la section
 * @param {Function} props.onToggle - Callback pour toggle l'expansion
 * @param {Object} props.data - Données sport et santé
 * @param {number} props.data.weeklyWorkouts - Nombre d'entraînements cette semaine
 * @param {number} props.data.todayCalories - Calories brûlées aujourd'hui
 * @param {number} props.data.todaySteps - Pas effectués aujourd'hui
 * @param {number} props.data.avgHeartRate - Fréquence cardiaque moyenne
 * @param {boolean} props.data.hasGarminData - Présence de données Garmin
 * @param {Object} props.navigation - Fonctions de navigation
 */
const ActivitePhysiqueSection = memo(({ isExpanded, onToggle, data, navigation }) => {
  /**
   * Navigation vers l'historique des entraînements
   */
  const handleWorkoutsClick = useCallback(() => {
    navigation.toSportHistory({ filter: 'week' });
  }, [navigation]);

  /**
   * Navigation vers les métriques Garmin - Calories
   */
  const handleCaloriesClick = useCallback(() => {
    navigation.toGarmin({ tab: 'metrics', section: 'calories' });
  }, [navigation]);

  /**
   * Navigation vers les métriques Garmin - Pas
   */
  const handleStepsClick = useCallback(() => {
    navigation.toGarmin({ tab: 'metrics', section: 'steps' });
  }, [navigation]);

  /**
   * Navigation vers la fréquence cardiaque Garmin
   */
  const handleHeartRateClick = useCallback(() => {
    navigation.toGarmin({ tab: 'heartRate' });
  }, [navigation]);

  /**
   * Navigation vers les paramètres Garmin
   */
  const handleGarminSettingsClick = useCallback(() => {
    navigation.toGarmin({ tab: 'settings' });
  }, [navigation]);

  /**
   * Gestion de la navigation au clavier
   */
  const handleKeyDown = useCallback((e, callback) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      callback();
    }
  }, []);

  return (
    <section className={`sidebar-section ${isExpanded ? 'expanded' : ''}`}>
      <header 
        className="sidebar-section-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label="Section Activité Physique"
        onKeyDown={(e) => handleKeyDown(e, onToggle)}
      >
        <h2 className="sidebar-section-title">
          <span className="sidebar-section-icon" aria-hidden="true">💪</span>
          Activité Physique
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
            {/* Entraînements cette semaine - Cliquable vers Sport > Historique */}
            <div 
              className="sidebar-data-card clickable"
              onClick={handleWorkoutsClick}
              onKeyDown={(e) => handleKeyDown(e, handleWorkoutsClick)}
              role="button"
              tabIndex={0}
              aria-label={`${data.weeklyWorkouts} entraînements cette semaine. Cliquer pour voir l'historique`}
              title="Voir l'historique des entraînements"
            >
              <span className="sidebar-data-icon" aria-hidden="true">🏋️</span>
              <div className="sidebar-data-value">{data.weeklyWorkouts}</div>
              <div className="sidebar-data-label">Entraînements</div>
              <div className="sidebar-data-hint">Voir historique</div>
            </div>
            
            {/* Calories brûlées - Cliquable vers Garmin > Métriques > Calories */}
            <div 
              className="sidebar-data-card clickable"
              onClick={handleCaloriesClick}
              onKeyDown={(e) => handleKeyDown(e, handleCaloriesClick)}
              role="button"
              tabIndex={0}
              aria-label={`${data.todayCalories > 0 ? data.todayCalories.toLocaleString() : '0'} calories brûlées aujourd'hui. Cliquer pour voir les détails`}
              title="Voir les détails des calories"
            >
              <span className="sidebar-data-icon" aria-hidden="true">🔥</span>
              <div className="sidebar-data-value">
                {data.todayCalories > 0 ? data.todayCalories.toLocaleString() : '0'}
              </div>
              <div className="sidebar-data-label">Calories</div>
              <div className="sidebar-data-hint">Voir métriques</div>
            </div>
            
            {/* Pas aujourd'hui - Cliquable vers Garmin > Métriques > Pas */}
            <div 
              className="sidebar-data-card clickable"
              onClick={handleStepsClick}
              onKeyDown={(e) => handleKeyDown(e, handleStepsClick)}
              role="button"
              tabIndex={0}
              aria-label={`${data.todaySteps > 0 ? data.todaySteps.toLocaleString() : '0'} pas aujourd'hui. Cliquer pour voir les détails`}
              title="Voir les détails des pas"
            >
              <span className="sidebar-data-icon" aria-hidden="true">👟</span>
              <div className="sidebar-data-value">
                {data.todaySteps > 0 ? data.todaySteps.toLocaleString() : '0'}
              </div>
              <div className="sidebar-data-label">Pas</div>
              <div className="sidebar-data-hint">Voir métriques</div>
            </div>
            
            {/* Fréquence cardiaque - Cliquable vers Garmin > Fréquence Cardiaque */}
            <div 
              className="sidebar-data-card clickable"
              onClick={handleHeartRateClick}
              onKeyDown={(e) => handleKeyDown(e, handleHeartRateClick)}
              role="button"
              tabIndex={0}
              aria-label={`${data.avgHeartRate} BPM fréquence cardiaque moyenne. Cliquer pour voir le graphique`}
              title="Voir le graphique de fréquence cardiaque"
            >
              <span className="sidebar-data-icon" aria-hidden="true">❤️</span>
              <div className="sidebar-data-value">{data.avgHeartRate}</div>
              <div className="sidebar-data-label">BPM</div>
              <div className="sidebar-data-hint">Voir graphique</div>
            </div>
          </div>
          
          {/* Indicateur Garmin - Cliquable vers Garmin > Paramètres */}
          {!data.hasGarminData && (
            <div 
              className="sidebar-info-box warning clickable"
              onClick={handleGarminSettingsClick}
              onKeyDown={(e) => handleKeyDown(e, handleGarminSettingsClick)}
              role="button"
              tabIndex={0}
              aria-label="Données Garmin non disponibles. Cliquer pour configurer"
              title="Configurer la connexion Garmin"
            >
              <span className="sidebar-info-icon" aria-hidden="true">⚠️</span>
              <span>Données Garmin non disponibles</span>
              <div className="sidebar-data-hint">Configurer</div>
            </div>
          )}
        </div>
      )}
    </section>
  );
});

ActivitePhysiqueSection.displayName = 'ActivitePhysiqueSection';

ActivitePhysiqueSection.propTypes = {
  isExpanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  data: PropTypes.shape({
    weeklyWorkouts: PropTypes.number.isRequired,
    todayCalories: PropTypes.number.isRequired,
    todaySteps: PropTypes.number.isRequired,
    avgHeartRate: PropTypes.number.isRequired,
    hasGarminData: PropTypes.bool.isRequired
  }).isRequired,
  navigation: PropTypes.object.isRequired
};

export default ActivitePhysiqueSection;
