/**
 * Section Nutrition de la Sidebar Premium
 * Affiche les données nutritionnelles avec navigation contextuelle
 * 
 * @module components/sidebar/NutritionSection
 */

import React, { memo } from 'react';
import PropTypes from 'prop-types';

/**
 * Section Nutrition
 * Toutes les cartes sont cliquables et mènent vers les sections appropriées
 * 
 * @param {Object} props
 * @param {boolean} props.isExpanded - État d'expansion de la section
 * @param {Function} props.onToggle - Callback pour toggle l'expansion
 * @param {Object} props.data - Données nutritionnelles
 * @param {number} props.data.calories - Calories consommées
 * @param {number} props.data.proteins - Protéines en grammes
 * @param {number} props.data.carbs - Glucides en grammes
 * @param {number} props.data.fats - Lipides en grammes
 * @param {number} props.data.compliance - Pourcentage de compliance (0-100)
 * @param {boolean} props.data.hasData - Présence de données nutritionnelles
 * @param {Object} props.navigation - Fonctions de navigation
 * @param {string} props.todayDate - Date du jour au format ISO (YYYY-MM-DD)
 */
const NutritionSection = memo(({ isExpanded, onToggle, data, navigation, todayDate }) => {
  /**
   * Navigation vers Nutrition (aujourd'hui)
   */
  const handleCaloriesClick = () => {
    navigation.toNutrition({ date: todayDate });
  };

  /**
   * Navigation vers Nutrition > Macros
   */
  const handleMacrosClick = () => {
    navigation.toNutrition({ date: todayDate, section: 'macros' });
  };

  /**
   * Navigation vers Nutrition > Stats
   */
  const handleComplianceClick = () => {
    navigation.toNutrition({ tab: 'stats' });
  };

  /**
   * Navigation vers Nutrition > Configuration
   */
  const handleConfigClick = () => {
    navigation.toNutrition({ action: 'configure' });
  };

  /**
   * Gestion de la navigation au clavier
   */
  const handleKeyDown = (e, callback) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      callback();
    }
  };

  /**
   * Déterminer la couleur de la barre de compliance
   */
  const getComplianceColor = () => {
    if (data.compliance >= 90 && data.compliance <= 110) return '#22c55e'; // Vert - parfait
    if (data.compliance >= 80 && data.compliance <= 120) return '#eab308'; // Jaune - acceptable
    return '#ef4444'; // Rouge - hors cible
  };

  return (
    <section className={`sidebar-section ${isExpanded ? 'expanded' : ''}`}>
      <header 
        className="sidebar-section-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label="Section Nutrition"
        onKeyDown={(e) => handleKeyDown(e, onToggle)}
      >
        <h2 className="sidebar-section-title">
          <span className="sidebar-section-icon" aria-hidden="true">🍽️</span>
          Nutrition
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
            {/* Calories - Cliquable vers Nutrition (aujourd'hui) */}
            <div 
              className="sidebar-data-card clickable nutrition"
              onClick={handleCaloriesClick}
              onKeyDown={(e) => handleKeyDown(e, handleCaloriesClick)}
              role="button"
              tabIndex={0}
              aria-label={`Calories: ${data.calories} kcal. Cliquer pour voir le détail des repas`}
              title="Voir le détail des repas"
            >
              <span className="sidebar-data-icon" aria-hidden="true">🔥</span>
              <div className="sidebar-data-value">{data.calories}</div>
              <div className="sidebar-data-label">Calories</div>
              <div className="sidebar-data-hint">Voir repas</div>
            </div>
            
            {/* Protéines - Cliquable vers Nutrition > Macros */}
            <div 
              className="sidebar-data-card clickable nutrition"
              onClick={handleMacrosClick}
              onKeyDown={(e) => handleKeyDown(e, handleMacrosClick)}
              role="button"
              tabIndex={0}
              aria-label={`Protéines: ${data.proteins} grammes. Cliquer pour voir la répartition des macros`}
              title="Voir la répartition des macros"
            >
              <span className="sidebar-data-icon" aria-hidden="true">🥩</span>
              <div className="sidebar-data-value">{data.proteins}g</div>
              <div className="sidebar-data-label">Protéines</div>
              <div className="sidebar-data-hint">Voir macros</div>
            </div>
            
            {/* Glucides - Cliquable vers Nutrition > Macros */}
            <div 
              className="sidebar-data-card clickable nutrition"
              onClick={handleMacrosClick}
              onKeyDown={(e) => handleKeyDown(e, handleMacrosClick)}
              role="button"
              tabIndex={0}
              aria-label={`Glucides: ${data.carbs} grammes. Cliquer pour voir la répartition des macros`}
              title="Voir la répartition des macros"
            >
              <span className="sidebar-data-icon" aria-hidden="true">🍞</span>
              <div className="sidebar-data-value">{data.carbs}g</div>
              <div className="sidebar-data-label">Glucides</div>
              <div className="sidebar-data-hint">Voir macros</div>
            </div>
            
            {/* Lipides - Cliquable vers Nutrition > Macros */}
            <div 
              className="sidebar-data-card clickable nutrition"
              onClick={handleMacrosClick}
              onKeyDown={(e) => handleKeyDown(e, handleMacrosClick)}
              role="button"
              tabIndex={0}
              aria-label={`Lipides: ${data.fats} grammes. Cliquer pour voir la répartition des macros`}
              title="Voir la répartition des macros"
            >
              <span className="sidebar-data-icon" aria-hidden="true">🥑</span>
              <div className="sidebar-data-value">{data.fats}g</div>
              <div className="sidebar-data-label">Lipides</div>
              <div className="sidebar-data-hint">Voir macros</div>
            </div>
          </div>
          
          {/* Compliance - Cliquable vers Nutrition > Stats */}
          {data.hasData && (
            <div 
              className="sidebar-info-box clickable"
              onClick={handleComplianceClick}
              onKeyDown={(e) => handleKeyDown(e, handleComplianceClick)}
              role="button"
              tabIndex={0}
              aria-label={`Compliance: ${data.compliance}% de l'objectif calorique. Cliquer pour voir les statistiques`}
              title="Voir les statistiques nutritionnelles"
            >
              <div className="sidebar-info-title">Compliance</div>
              <div className="sidebar-info-content">
                <span className="sidebar-info-icon" aria-hidden="true">📊</span>
                <span>{data.compliance}% de l'objectif</span>
              </div>
              <div className="sidebar-progress-mini">
                <div 
                  className="sidebar-progress-mini-bar" 
                  style={{ 
                    width: `${Math.min(data.compliance, 100)}%`,
                    backgroundColor: getComplianceColor()
                  }}
                  aria-hidden="true"
                ></div>
              </div>
              <div className="sidebar-data-hint">Voir stats</div>
            </div>
          )}
          
          {/* Indicateur données manquantes - Cliquable vers Configuration */}
          {!data.hasData && (
            <div 
              className="sidebar-info-box warning clickable"
              onClick={handleConfigClick}
              onKeyDown={(e) => handleKeyDown(e, handleConfigClick)}
              role="button"
              tabIndex={0}
              aria-label="Données nutritionnelles non disponibles. Cliquer pour configurer"
              title="Configurer les données nutritionnelles"
            >
              <span className="sidebar-info-icon" aria-hidden="true">⚠️</span>
              <span>Aucun repas loggé aujourd'hui</span>
              <div className="sidebar-data-hint">Ajouter repas</div>
            </div>
          )}
        </div>
      )}
    </section>
  );
});

NutritionSection.displayName = 'NutritionSection';

NutritionSection.propTypes = {
  isExpanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  data: PropTypes.shape({
    calories: PropTypes.number.isRequired,
    proteins: PropTypes.number.isRequired,
    carbs: PropTypes.number.isRequired,
    fats: PropTypes.number.isRequired,
    compliance: PropTypes.number.isRequired,
    hasData: PropTypes.bool.isRequired
  }).isRequired,
  navigation: PropTypes.object.isRequired,
  todayDate: PropTypes.string.isRequired
};

export default NutritionSection;
