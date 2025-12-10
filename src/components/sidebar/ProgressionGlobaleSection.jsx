/**
 * Section Progression Globale (anciennement Métriques Vitales)
 * Affiche les métriques clés de progression QuietQuest avec navigation contextuelle
 * 
 * @module components/sidebar/ProgressionGlobaleSection
 */

import React, { memo } from 'react';
import PropTypes from 'prop-types';

/**
 * Composant ProgressionGlobaleSection
 * Affiche XP, Niveau, Streak et Focus avec navigation vers les sections appropriées
 * 
 * @param {Object} props - Props du composant
 * @param {boolean} props.isExpanded - État d'expansion de la section
 * @param {Function} props.onToggle - Callback pour toggle l'expansion
 * @param {Object} props.metrics - Données des métriques (xp, level, streak, focus)
 * @param {Object} props.navigation - Objet de navigation
 * @returns {JSX.Element} Section de progression globale
 */
const ProgressionGlobaleSection = memo(({ isExpanded, onToggle, metrics, navigation }) => {
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
          <span className="sidebar-section-icon" aria-hidden="true">📊</span>
          Progression Globale
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
          <div className="sidebar-metrics-grid" role="group" aria-label="Métriques de progression">
            {/* XP - Navigation vers Quêtes > Progression */}
            <div 
              className="sidebar-metric-card xp clickable" 
              role="button"
              tabIndex={0}
              aria-label={`XP Total: ${metrics.xp.toLocaleString()} points. Cliquer pour voir la progression`}
              title="Voir la progression XP"
              onClick={() => navigation.toQuests({ section: 'progression' })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigation.toQuests({ section: 'progression' });
                }
              }}
            >
              <span className="sidebar-metric-icon" aria-hidden="true">⭐</span>
              <div className="sidebar-metric-value" aria-hidden="true">
                {metrics.xp.toLocaleString()}
              </div>
              <div className="sidebar-metric-label" aria-hidden="true">XP Total</div>
              <div className="sidebar-data-hint">Voir progression</div>
            </div>
            
            {/* Niveau - Navigation vers Quêtes > Niveau */}
            <div 
              className="sidebar-metric-card level clickable"
              role="button"
              tabIndex={0}
              aria-label={`Niveau: ${metrics.level}. Cliquer pour voir les détails du niveau`}
              title="Voir les détails du niveau"
              onClick={() => navigation.toQuests({ section: 'niveau' })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigation.toQuests({ section: 'niveau' });
                }
              }}
            >
              <span className="sidebar-metric-icon" aria-hidden="true">🎖️</span>
              <div className="sidebar-metric-value" aria-hidden="true">{metrics.level}</div>
              <div className="sidebar-metric-label" aria-hidden="true">Niveau</div>
              <div className="sidebar-data-hint">Voir niveau</div>
            </div>
            
            {/* Streak - Navigation vers Quêtes > Stats > Calendrier */}
            <div 
              className="sidebar-metric-card streak clickable"
              role="button"
              tabIndex={0}
              aria-label={`Streak: ${metrics.streak} jours consécutifs. Cliquer pour voir le calendrier`}
              title="Voir le calendrier de streak"
              onClick={() => navigation.toQuests({ section: 'stats', subsection: 'calendrier' })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigation.toQuests({ section: 'stats', subsection: 'calendrier' });
                }
              }}
            >
              <span className="sidebar-metric-icon" aria-hidden="true">🔥</span>
              <div className="sidebar-metric-value" aria-hidden="true">{metrics.streak}</div>
              <div className="sidebar-metric-label" aria-hidden="true">Jours</div>
              <div className="sidebar-data-hint">Voir calendrier</div>
            </div>
            
            {/* Focus - Navigation vers Quêtes > Stats > Focus */}
            <div 
              className="sidebar-metric-card focus clickable"
              role="button"
              tabIndex={0}
              aria-label={`Focus: ${metrics.focus} pourcent. Cliquer pour voir les statistiques de focus`}
              title="Voir les statistiques de focus"
              onClick={() => navigation.toQuests({ section: 'stats', subsection: 'focus' })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigation.toQuests({ section: 'stats', subsection: 'focus' });
                }
              }}
            >
              <span className="sidebar-metric-icon" aria-hidden="true">⚡</span>
              <div className="sidebar-metric-value" aria-hidden="true">{metrics.focus}%</div>
              <div className="sidebar-metric-label" aria-hidden="true">Focus</div>
              <div className="sidebar-data-hint">Voir focus</div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
});

ProgressionGlobaleSection.displayName = 'ProgressionGlobaleSection';

ProgressionGlobaleSection.propTypes = {
  isExpanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  metrics: PropTypes.shape({
    xp: PropTypes.number.isRequired,
    level: PropTypes.number.isRequired,
    streak: PropTypes.number.isRequired,
    focus: PropTypes.number.isRequired,
  }).isRequired,
  navigation: PropTypes.object.isRequired,
};

export default ProgressionGlobaleSection;
