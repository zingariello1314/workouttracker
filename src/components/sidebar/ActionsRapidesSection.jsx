/**
 * Section Actions Rapides
 * Boutons d'actions rapides pour accès direct aux fonctionnalités principales
 * 
 * @module components/sidebar/ActionsRapidesSection
 */

import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { useQuickActions } from '../../context/QuickActionsContext';

/**
 * Composant ActionsRapidesSection
 * Affiche une grille 2x2 de boutons principaux et une ligne 1x4 de boutons secondaires
 * 
 * @param {Object} props - Props du composant
 * @param {boolean} props.isExpanded - État d'expansion de la section
 * @param {Function} props.onToggle - Callback pour toggle l'expansion
 * @param {Object} props.navigation - Objet de navigation
 * @returns {JSX.Element} Section d'actions rapides
 */
const ActionsRapidesSection = memo(({ isExpanded, onToggle, navigation }) => {
  const { startPomodoroSession, pomodoroActive } = useQuickActions();

  /**
   * Démarre une session Pomodoro et navigue vers l'onglet Focus
   */
  const handleFocusClick = () => {
    startPomodoroSession(25);
    navigation.toFocus();
  };

  /**
   * Navigue vers Livres avec action d'ajout de pages
   */
  const handleReadClick = () => {
    navigation.toBooks({ action: 'addPages' });
  };

  /**
   * Navigue vers Sport avec action de nouvelle séance
   */
  const handleSportClick = () => {
    navigation.toSport({ action: 'newWorkout' });
  };

  /**
   * Navigue vers Quêtes avec filtre aujourd'hui
   */
  const handleQuestsClick = () => {
    navigation.toQuests({ filter: 'today' });
  };

  /**
   * Navigue vers Finance > Planificateur avec action d'ajout de revenu
   */
  const handleRevenueClick = () => {
    navigation.toFinancePlanificateur({ action: 'addRevenue' });
  };

  /**
   * Navigue vers Finance > Planificateur avec action d'ajout de dépense
   */
  const handleExpenseClick = () => {
    navigation.toFinancePlanificateur({ action: 'addExpense' });
  };

  /**
   * Navigue vers Nutrition avec action d'ajout de repas
   */
  const handleMealClick = () => {
    navigation.toNutrition({ action: 'addMeal' });
  };

  /**
   * Navigue vers les paramètres
   */
  const handleSettingsClick = () => {
    navigation.toSettings();
  };

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
          <span className="sidebar-section-icon" aria-hidden="true">⚡</span>
          Actions Rapides
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
          {/* Grille 2x2 - Boutons principaux */}
          <div className="sidebar-actions-grid" role="group" aria-label="Actions principales">
            <button
              className="sidebar-action-btn primary"
              onClick={handleFocusClick}
              aria-label="Démarrer une session Pomodoro de 25 minutes"
              title="Démarrer Focus 25min"
              disabled={pomodoroActive}
            >
              <span className="sidebar-action-icon" aria-hidden="true">🎯</span>
              <span className="sidebar-action-label">Focus 25min</span>
            </button>

            <button
              className="sidebar-action-btn primary"
              onClick={handleReadClick}
              aria-label="Ajouter des pages lues"
              title="Ajouter pages lues"
            >
              <span className="sidebar-action-icon" aria-hidden="true">📖</span>
              <span className="sidebar-action-label">Lire +Pages</span>
            </button>

            <button
              className="sidebar-action-btn primary"
              onClick={handleSportClick}
              aria-label="Ajouter une nouvelle séance de sport"
              title="Nouvelle séance de sport"
            >
              <span className="sidebar-action-icon" aria-hidden="true">💪</span>
              <span className="sidebar-action-label">Sport</span>
            </button>

            <button
              className="sidebar-action-btn primary"
              onClick={handleQuestsClick}
              aria-label="Voir les quêtes du jour"
              title="Quêtes du jour"
            >
              <span className="sidebar-action-icon" aria-hidden="true">✅</span>
              <span className="sidebar-action-label">Quêtes</span>
            </button>
          </div>

          {/* Ligne 1x4 - Boutons secondaires */}
          <div className="sidebar-actions-secondary" role="group" aria-label="Actions secondaires">
            <button
              className="sidebar-action-btn secondary"
              onClick={handleRevenueClick}
              aria-label="Ajouter un revenu"
              title="Ajouter revenu"
            >
              <span className="sidebar-action-icon" aria-hidden="true">💰</span>
              <span className="sidebar-action-label">+Revenu</span>
            </button>

            <button
              className="sidebar-action-btn secondary"
              onClick={handleExpenseClick}
              aria-label="Ajouter une dépense"
              title="Ajouter dépense"
            >
              <span className="sidebar-action-icon" aria-hidden="true">📊</span>
              <span className="sidebar-action-label">+Dépense</span>
            </button>

            <button
              className="sidebar-action-btn secondary"
              onClick={handleMealClick}
              aria-label="Ajouter un repas"
              title="Ajouter repas"
            >
              <span className="sidebar-action-icon" aria-hidden="true">🍽️</span>
              <span className="sidebar-action-label">+Repas</span>
            </button>

            <button
              className="sidebar-action-btn secondary"
              onClick={handleSettingsClick}
              aria-label="Ouvrir les paramètres"
              title="Paramètres"
            >
              <span className="sidebar-action-icon" aria-hidden="true">⚙️</span>
              <span className="sidebar-action-label">Réglages</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
});

ActionsRapidesSection.displayName = 'ActionsRapidesSection';

ActionsRapidesSection.propTypes = {
  isExpanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  navigation: PropTypes.object.isRequired,
};

export default ActionsRapidesSection;
