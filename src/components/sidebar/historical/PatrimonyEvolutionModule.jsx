import React, { memo, useCallback, useMemo, useState } from 'react';
import deepLinkService from '../../../services/navigation/DeepLinkService';
import StatCard from '../enhanced/StatCard';
import PeriodSelector from '../enhanced/PeriodSelector';
import EnhancedLineChart from '../../charts/EnhancedLineChart';
import '../../../styles/sidebar-visual-enhancements.css';
import '../../../styles/enhanced-charts.css';

/**
 * PatrimonyEvolutionModule - Module Évolution Patrimoine (Position 8)
 * Affiche l'évolution du patrimoine net avec calculs sur périodes configurables
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */
const PatrimonyEvolutionModule = memo(({ 
  isExpanded,
  onToggle,
  data = {},
  navigation
}) => {
  // Période sélectionnée pour les calculs (Requirement 5.1)
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  /**
   * Navigation vers Finances > Patrimoine (Requirement 5.4)
   */
  const handleNavigateToPatrimony = useCallback(async () => {
    if (!navigation?.setActiveTab) return;
    
    try {
      const target = {
        tab: 'finances',
        subtab: 'patrimoine',
        moduleId: 'patrimony-module',
        scrollBehavior: 'smooth',
        highlightDuration: 2000
      };

      await deepLinkService.navigateToModule(target, navigation.setActiveTab);
    } catch (error) {
      console.error('[PatrimonyEvolutionModule] Erreur navigation vers Patrimoine:', error);
    }
  }, [navigation]);

  // Calculs de patrimoine sur périodes configurables (Requirements 5.1, 5.2, 5.3)
  const patrimonyMetrics = useMemo(() => {
    const patrimonyData = data?.finances?.patrimony || data?.patrimony || {};
    const periodData = getPatrimonyDataForPeriod(patrimonyData, selectedPeriod);
    
    return {
      netWorthChange: calculateNetWorthChange(periodData),
      averageSavings: calculateAverageSavings(periodData),
      investmentPerformance: calculateInvestmentPerformance(periodData),
      objectivesReached: countObjectivesReached(periodData)
    };
  }, [data, selectedPeriod]);

  /**
   * Calcule les données de patrimoine pour une période donnée
   * Formatées pour le nouveau graphique intelligent
   */
  function getPatrimonyDataForPeriod(patrimonyData, period) {
    const days = period === '7d' ? 7 : 
                 period === '30d' ? 30 : 
                 period === '3m' ? 90 : 
                 period === '6m' ? 180 : 365;
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Filtrer les données de patrimoine pour la période
    const history = patrimonyData.history || [];
    const filteredData = history.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDate && entryDate <= endDate;
    });

    // Formater pour EnhancedLineChart avec données intelligibles
    return filteredData.map(entry => ({
      date: entry.date,
      value: entry.netWorth || 0,
      patrimony: entry.netWorth || 0,
      savings: entry.savings || 0,
      investments: entry.investments || 0
    }));
  }

  /**
   * Calcule la variation du patrimoine net (Requirement 5.1)
   */
  function calculateNetWorthChange(periodData) {
    if (periodData.length < 2) return { value: 0, percentage: 0 };
    
    const oldest = periodData[0];
    const newest = periodData[periodData.length - 1];
    
    const change = newest.netWorth - oldest.netWorth;
    const percentage = oldest.netWorth > 0 ? (change / oldest.netWorth) * 100 : 0;
    
    return { value: change, percentage };
  }

  /**
   * Calcule l'épargne moyenne par mois (Requirement 5.2)
   */
  function calculateAverageSavings(periodData) {
    if (periodData.length === 0) return 0;
    
    const totalSavings = periodData.reduce((sum, entry) => sum + (entry.savings || 0), 0);
    const months = periodData.length / 30; // Approximation
    
    return months > 0 ? totalSavings / months : 0;
  }

  /**
   * Calcule la performance des investissements (Requirement 5.3)
   */
  function calculateInvestmentPerformance(periodData) {
    if (periodData.length < 2) return 0;
    
    const oldest = periodData[0];
    const newest = periodData[periodData.length - 1];
    
    const oldInvestments = oldest.investments || 0;
    const newInvestments = newest.investments || 0;
    
    return oldInvestments > 0 ? ((newInvestments - oldInvestments) / oldInvestments) * 100 : 0;
  }

  /**
   * Compte les objectifs atteints (Requirement 5.5)
   */
  function countObjectivesReached(periodData) {
    return periodData.reduce((count, entry) => count + (entry.objectivesReached || 0), 0);
  }

  // Options de période
  const periodOptions = [
    { value: '7d', label: '7j' },
    { value: '30d', label: '30j' },
    { value: '3m', label: '3m' },
    { value: '6m', label: '6m' },
    { value: '1a', label: '1an' }
  ];

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
          <span className="sidebar-section-icon">💰</span>
          Évolution Patrimoine
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
          {/* Sélecteur de période enrichi */}
          <PeriodSelector
            value={selectedPeriod}
            onChange={setSelectedPeriod}
            options={periodOptions}
            label="Période d'analyse"
            icon="📅"
          />

          {/* Graphique patrimoine INTELLIGENT - Remplace le graphique moche et ininterpretable */}
          <EnhancedLineChart
            data={getPatrimonyDataForPeriod(data?.finances?.patrimony || data?.patrimony || {}, selectedPeriod)}
            xKey="date"
            yKey="value"
            title="Évolution du patrimoine net"
            subtitle={`Période : ${periodOptions.find(p => p.value === selectedPeriod)?.label || selectedPeriod}`}
            color={patrimonyMetrics.netWorthChange.percentage >= 0 ? "#10B981" : "#EF4444"}
            height={180}
            showTooltip={true}
            showGrid={true}
            showDots={true}
            formatValue={(value) => new Intl.NumberFormat('fr-FR', { 
              style: 'currency', 
              currency: 'EUR',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(value)}
            formatXAxis={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString('fr-FR', { 
                month: 'short', 
                day: 'numeric' 
              });
            }}
          />

          <div className="sidebar-content-dense">
            {/* Variation patrimoine net (Requirement 5.1) */}
            <StatCard
              title="Variation patrimoine"
              value={`${patrimonyMetrics.netWorthChange.value >= 0 ? '+' : ''}${patrimonyMetrics.netWorthChange.value.toLocaleString()}€`}
              trend={patrimonyMetrics.netWorthChange.percentage >= 0 ? '↗️' : '↘️'}
              icon="💰"
              color={patrimonyMetrics.netWorthChange.percentage >= 0 ? "var(--sidebar-green)" : "var(--sidebar-red)"}
              onClick={handleNavigateToPatrimony}
            />

            {/* Épargne moyenne/mois (Requirement 5.2) */}
            <StatCard
              title="Épargne/mois"
              value={`${patrimonyMetrics.averageSavings.toLocaleString()}€`}
              trend="💵"
              icon="💵"
              color="var(--sidebar-blue)"
              onClick={handleNavigateToPatrimony}
            />

            {/* Performance investissements (Requirement 5.3) */}
            <StatCard
              title="Performance invest."
              value={`${patrimonyMetrics.investmentPerformance >= 0 ? '+' : ''}${patrimonyMetrics.investmentPerformance.toFixed(1)}%`}
              trend={patrimonyMetrics.investmentPerformance >= 0 ? '↗️' : '↘️'}
              icon="📈"
              color={patrimonyMetrics.investmentPerformance >= 0 ? "var(--sidebar-green)" : "var(--sidebar-red)"}
              onClick={handleNavigateToPatrimony}
            />

            {/* Objectifs atteints (Requirement 5.5) */}
            <StatCard
              title="Objectifs atteints"
              value={patrimonyMetrics.objectivesReached}
              trend="🎯"
              icon="🎯"
              color="var(--sidebar-gold)"
              onClick={handleNavigateToPatrimony}
            />
          </div>
        </div>
      )}
    </section>
  );
});



PatrimonyEvolutionModule.displayName = 'PatrimonyEvolutionModule';

export default PatrimonyEvolutionModule;
