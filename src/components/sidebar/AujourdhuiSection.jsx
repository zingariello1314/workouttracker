/**
 * Section Aujourd'hui
 * Affiche un résumé des activités du jour avec navigation contextuelle
 * 
 * @module components/sidebar/AujourdhuiSection
 */

import React, { memo } from 'react';
import PropTypes from 'prop-types';

/**
 * Composant AujourdhuiSection
 * Affiche les quêtes, sport, lecture et nutrition du jour avec navigation vers les sections appropriées
 * 
 * @param {Object} props - Props du composant
 * @param {boolean} props.isExpanded - État d'expansion de la section
 * @param {Function} props.onToggle - Callback pour toggle l'expansion
 * @param {Object} props.data - Données du jour (questsCompleted, questsTotal, workoutDone, pagesRead, mealsLogged, mealsTarget)
 * @param {Object} props.navigation - Objet de navigation
 * @param {string} props.todayDate - Date du jour au format ISO (YYYY-MM-DD)
 * @returns {JSX.Element} Section aujourd'hui
 */
const AujourdhuiSection = memo(({ isExpanded, onToggle, data, navigation, todayDate }) => {
  return (
    <section className={`sidebar-section ${isExpanded ? 'expanded' : ''}`}>
      <header 
        className="sidebar-section-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <h2 className="sidebar-section-title">
          <span className="sidebar-section-icon" aria-hidden="true">📅</span>
          Aujourd'hui
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
          <div className="sidebar-data-grid" role="group" aria-label="Activités du jour">
            {/* Quêtes - Navigation vers Quêtes (filtre: aujourd'hui) */}
            <div 
              className="sidebar-data-card clickable quests"
              role="button"
              tabIndex={0}
              aria-label={`Quêtes: ${data.questsCompleted} sur ${data.questsTotal} complétées. Cliquer pour voir les quêtes du jour`}
              title="Voir les quêtes du jour"
              onClick={() => navigation.toQuests({ filter: 'today' })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigation.toQuests({ filter: 'today' });
                }
              }}
            >
              <span className="sidebar-data-icon" aria-hidden="true">✅</span>
              <div className="sidebar-data-value" aria-hidden="true">
                {data.questsCompleted}/{data.questsTotal}
              </div>
              <div className="sidebar-data-label" aria-hidden="true">Quêtes</div>
              <div className="sidebar-data-hint">Voir quêtes</div>
            </div>
            
            {/* Sport - Navigation vers Sport > Aujourd'hui */}
            <div 
              className="sidebar-data-card clickable sport"
              role="button"
              tabIndex={0}
              aria-label={`Sport: ${data.workoutDone ? 'Entraînement fait' : 'Entraînement à faire'}. Cliquer pour voir l'activité du jour`}
              title="Voir l'activité du jour"
              onClick={() => navigation.toSport({ tab: 'today' })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigation.toSport({ tab: 'today' });
                }
              }}
            >
              <span className="sidebar-data-icon" aria-hidden="true">💪</span>
              <div className="sidebar-data-value" aria-hidden="true">
                {data.workoutDone ? 'Fait ✓' : 'À faire'}
              </div>
              <div className="sidebar-data-label" aria-hidden="true">Sport</div>
              <div className="sidebar-data-hint">Voir activité</div>
            </div>
            
            {/* Lecture - Navigation vers Livres > Stats (aujourd'hui) */}
            <div 
              className="sidebar-data-card clickable reading"
              role="button"
              tabIndex={0}
              aria-label={`Lecture: ${data.pagesRead} pages lues. Cliquer pour voir les statistiques de lecture`}
              title="Voir les statistiques de lecture"
              onClick={() => navigation.toBooks({ tab: 'stats', date: todayDate })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigation.toBooks({ tab: 'stats', date: todayDate });
                }
              }}
            >
              <span className="sidebar-data-icon" aria-hidden="true">📖</span>
              <div className="sidebar-data-value" aria-hidden="true">
                {data.pagesRead} pages
              </div>
              <div className="sidebar-data-label" aria-hidden="true">Lecture</div>
              <div className="sidebar-data-hint">Voir stats</div>
            </div>
            
            {/* Nutrition - Navigation vers Nutrition (aujourd'hui) */}
            <div 
              className="sidebar-data-card clickable nutrition"
              role="button"
              tabIndex={0}
              aria-label={`Nutrition: ${data.mealsLogged} sur ${data.mealsTarget} repas loggés. Cliquer pour voir les repas du jour`}
              title="Voir les repas du jour"
              onClick={() => navigation.toNutrition({ date: todayDate })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigation.toNutrition({ date: todayDate });
                }
              }}
            >
              <span className="sidebar-data-icon" aria-hidden="true">🍽️</span>
              <div className="sidebar-data-value" aria-hidden="true">
                {data.mealsLogged}/{data.mealsTarget}
              </div>
              <div className="sidebar-data-label" aria-hidden="true">Repas</div>
              <div className="sidebar-data-hint">Voir repas</div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
});

AujourdhuiSection.displayName = 'AujourdhuiSection';

AujourdhuiSection.propTypes = {
  isExpanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  data: PropTypes.shape({
    questsCompleted: PropTypes.number.isRequired,
    questsTotal: PropTypes.number.isRequired,
    workoutDone: PropTypes.bool.isRequired,
    pagesRead: PropTypes.number.isRequired,
    mealsLogged: PropTypes.number.isRequired,
    mealsTarget: PropTypes.number.isRequired,
  }).isRequired,
  navigation: PropTypes.object.isRequired,
  todayDate: PropTypes.string.isRequired,
};

export default AujourdhuiSection;
