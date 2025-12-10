/**
 * Section Finances de la Sidebar Premium
 * Affiche les données financières avec navigation contextuelle
 * 
 * @module components/sidebar/FinancesSection
 */

import React, { memo } from 'react';
import PropTypes from 'prop-types';

/**
 * Section Finances
 * Toutes les cartes sont cliquables et mènent vers les sections appropriées
 * 
 * @param {Object} props
 * @param {boolean} props.isExpanded - État d'expansion de la section
 * @param {Function} props.onToggle - Callback pour toggle l'expansion
 * @param {Object} props.data - Données financières
 * @param {number} props.data.netWorth - Patrimoine net
 * @param {number} props.data.investments - Investissements totaux
 * @param {number} props.data.monthlyBudget - Budget mensuel
 * @param {number} props.data.monthlySavings - Épargne mensuelle
 * @param {boolean} props.data.hasData - Présence de données financières
 * @param {Object} props.navigation - Fonctions de navigation
 */
const FinancesSection = memo(({ isExpanded, onToggle, data, navigation }) => {
  /**
   * Formater les montants en devise
   */
  const formatCurrency = (value) => {
    const numValue = Number(value);
    if (isNaN(numValue) || numValue === null || numValue === undefined) {
      return '0€';
    }
    
    if (numValue >= 1000000) {
      return `${(numValue / 1000000).toFixed(1)}M€`;
    } else if (numValue >= 1000) {
      return `${(numValue / 1000).toFixed(1)}K€`;
    }
    return `${numValue.toFixed(0)}€`;
  };

  /**
   * Calculer le taux d'épargne
   */
  const savingsRate = data.monthlyBudget > 0 
    ? Math.round((data.monthlySavings / data.monthlyBudget) * 100)
    : 0;

  /**
   * Navigation vers Finance > Synthèse > Patrimoine
   */
  const handleNetWorthClick = () => {
    navigation.toFinanceSynthese({ section: 'patrimoine' });
  };

  /**
   * Navigation vers Finance > Synthèse > Investissements
   */
  const handleInvestmentsClick = () => {
    navigation.toFinanceSynthese({ section: 'investissements' });
  };

  /**
   * Navigation vers Finance > Planificateur > Répartition
   */
  const handleBudgetClick = () => {
    navigation.toFinancePlanificateur({ section: 'repartition' });
  };

  /**
   * Navigation vers Finance > Planificateur > Épargne
   */
  const handleSavingsClick = () => {
    navigation.toFinancePlanificateur({ section: 'epargne' });
  };

  /**
   * Navigation vers Finance > Synthèse > Comparaison
   */
  const handleSavingsRateClick = () => {
    navigation.toFinanceSynthese({ section: 'comparaison' });
  };

  /**
   * Navigation vers Finance > Configuration
   */
  const handleConfigClick = () => {
    navigation.toFinance({ action: 'configure' });
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

  return (
    <section className={`sidebar-section ${isExpanded ? 'expanded' : ''}`}>
      <header 
        className="sidebar-section-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label="Section Finances"
        onKeyDown={(e) => handleKeyDown(e, onToggle)}
      >
        <h2 className="sidebar-section-title">
          <span className="sidebar-section-icon" aria-hidden="true">💰</span>
          Finances
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
            {/* Patrimoine - Cliquable vers Finance > Synthèse > Patrimoine */}
            <div 
              className="sidebar-data-card clickable"
              onClick={handleNetWorthClick}
              onKeyDown={(e) => handleKeyDown(e, handleNetWorthClick)}
              role="button"
              tabIndex={0}
              aria-label={`Patrimoine net: ${formatCurrency(data.netWorth)}. Cliquer pour voir les détails`}
              title="Voir le détail du patrimoine net"
            >
              <span className="sidebar-data-icon" aria-hidden="true">💎</span>
              <div className="sidebar-data-value">{formatCurrency(data.netWorth)}</div>
              <div className="sidebar-data-label">Patrimoine</div>
              <div className="sidebar-data-hint">Voir synthèse</div>
            </div>
            
            {/* Investissements - Cliquable vers Finance > Synthèse > Investissements */}
            <div 
              className="sidebar-data-card clickable"
              onClick={handleInvestmentsClick}
              onKeyDown={(e) => handleKeyDown(e, handleInvestmentsClick)}
              role="button"
              tabIndex={0}
              aria-label={`Investissements: ${formatCurrency(data.investments)}. Cliquer pour voir les détails`}
              title="Voir le détail des investissements"
            >
              <span className="sidebar-data-icon" aria-hidden="true">📈</span>
              <div className="sidebar-data-value">{formatCurrency(data.investments)}</div>
              <div className="sidebar-data-label">Investissements</div>
              <div className="sidebar-data-hint">Voir détail</div>
            </div>
            
            {/* Budget - Cliquable vers Finance > Planificateur > Répartition */}
            <div 
              className="sidebar-data-card clickable"
              onClick={handleBudgetClick}
              onKeyDown={(e) => handleKeyDown(e, handleBudgetClick)}
              role="button"
              tabIndex={0}
              aria-label={`Budget mensuel: ${formatCurrency(data.monthlyBudget)}. Cliquer pour voir la répartition`}
              title="Voir la répartition du budget"
            >
              <span className="sidebar-data-icon" aria-hidden="true">💳</span>
              <div className="sidebar-data-value">{formatCurrency(data.monthlyBudget)}</div>
              <div className="sidebar-data-label">Budget</div>
              <div className="sidebar-data-hint">Voir répartition</div>
            </div>
            
            {/* Épargne - Cliquable vers Finance > Planificateur > Épargne */}
            <div 
              className="sidebar-data-card clickable"
              onClick={handleSavingsClick}
              onKeyDown={(e) => handleKeyDown(e, handleSavingsClick)}
              role="button"
              tabIndex={0}
              aria-label={`Épargne mensuelle: ${formatCurrency(data.monthlySavings)}. Cliquer pour voir les objectifs`}
              title="Voir les objectifs d'épargne"
            >
              <span className="sidebar-data-icon" aria-hidden="true">🏦</span>
              <div className="sidebar-data-value">{formatCurrency(data.monthlySavings)}</div>
              <div className="sidebar-data-label">Épargne</div>
              <div className="sidebar-data-hint">Voir objectifs</div>
            </div>
          </div>
          
          {/* Taux d'épargne - Cliquable vers Finance > Synthèse > Comparaison */}
          {data.monthlyBudget > 0 && (
            <div 
              className="sidebar-info-box clickable"
              onClick={handleSavingsRateClick}
              onKeyDown={(e) => handleKeyDown(e, handleSavingsRateClick)}
              role="button"
              tabIndex={0}
              aria-label={`Taux d'épargne: ${savingsRate}% du budget mensuel. Cliquer pour voir la comparaison`}
              title="Voir la comparaison mensuelle"
            >
              <div className="sidebar-info-title">Taux d'épargne</div>
              <div className="sidebar-info-content">
                <span className="sidebar-info-icon" aria-hidden="true">📊</span>
                <span>{savingsRate}% du budget mensuel</span>
              </div>
              <div className="sidebar-data-hint">Voir comparaison</div>
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
              aria-label="Données financières non disponibles. Cliquer pour configurer"
              title="Configurer les données financières"
            >
              <span className="sidebar-info-icon" aria-hidden="true">⚠️</span>
              <span>Données financières non disponibles</span>
              <div className="sidebar-data-hint">Configurer</div>
            </div>
          )}
        </div>
      )}
    </section>
  );
});

FinancesSection.displayName = 'FinancesSection';

FinancesSection.propTypes = {
  isExpanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  data: PropTypes.shape({
    netWorth: PropTypes.number.isRequired,
    investments: PropTypes.number.isRequired,
    monthlyBudget: PropTypes.number.isRequired,
    monthlySavings: PropTypes.number.isRequired,
    hasData: PropTypes.bool.isRequired
  }).isRequired,
  navigation: PropTypes.object.isRequired
};

export default FinancesSection;
