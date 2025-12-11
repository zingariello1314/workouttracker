/**
 * PatrimonyEvolutionModule - Module d'évolution patrimoine (Position 9)
 * 
 * Fonctionnalités:
 * - Calculs de variation patrimoine net sur périodes configurables
 * - Affichage épargne moyenne et performance investissements
 * - Indicateurs de tendance et objectifs atteints
 * - Mini-graphique d'évolution
 * - Navigation vers Finances > module patrimoine
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import React, { memo, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  DollarSign,
  Target,
  PieChart,
  Calendar,
  BarChart3
} from 'lucide-react';
import { useSynthese } from '../../../hooks/useSynthese';
import deepLinkService from '../../../services/navigation/DeepLinkService';
import { formatCurrency } from '../../../utils/planificateurUtils';
import '../../../styles/patrimony-evolution-module.css';

/**
 * Composant de sélection de période
 */
const PeriodSelector = memo(({ 
  selectedPeriod, 
  onPeriodChange,
  periods 
}) => {
  return (
    <div className="period-selector">
      <select
        value={selectedPeriod}
        onChange={(e) => onPeriodChange(e.target.value)}
        className="period-select bg-slate-700/50 border border-slate-600/50 rounded-lg px-2 py-1 text-xs text-white focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
        aria-label="Sélectionner la période d'analyse"
      >
        {periods.map(period => (
          <option key={period.value} value={period.value}>
            {period.label}
          </option>
        ))}
      </select>
    </div>
  );
});

PeriodSelector.displayName = 'PeriodSelector';

/**
 * Composant d'indicateur de tendance
 */
const TrendIndicator = memo(({ 
  current, 
  previous, 
  type = 'currency' 
}) => {
  const getTrend = () => {
    if (previous === 0) {
      return current > 0 ? 'up' : 'neutral';
    }
    
    const change = ((current - previous) / Math.abs(previous)) * 100;
    
    if (Math.abs(change) < 2) return 'neutral';
    return change > 0 ? 'up' : 'down';
  };

  const trend = getTrend();
  
  const getIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-3 h-3 text-green-400" />;
      case 'down':
        return <TrendingDown className="w-3 h-3 text-red-400" />;
      default:
        return <Minus className="w-3 h-3 text-slate-400" />;
    }
  };

  const getChangeText = () => {
    if (previous === 0) return '';
    
    const change = Math.abs(((current - previous) / Math.abs(previous)) * 100);
    const sign = current > previous ? '+' : '-';
    
    return `${sign}${change.toFixed(1)}%`;
  };

  return (
    <div className="flex items-center gap-1">
      {getIcon()}
      <span className={`text-xs ${
        trend === 'up' ? 'text-green-400' : 
        trend === 'down' ? 'text-red-400' : 
        'text-slate-400'
      }`}>
        {getChangeText()}
      </span>
    </div>
  );
});

TrendIndicator.displayName = 'TrendIndicator';

/**
 * Composant de mini-graphique d'évolution
 */
const EvolutionChart = memo(({ 
  data, 
  height = 40 
}) => {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => Math.abs(d)), 1);
  const minValue = Math.min(...data);
  const hasNegative = minValue < 0;
  
  return (
    <div className="evolution-chart flex items-end gap-1 h-10 relative">
      {hasNegative && (
        <div 
          className="absolute w-full border-t border-slate-600/50"
          style={{ 
            bottom: `${(Math.abs(minValue) / (maxValue + Math.abs(minValue))) * height}px` 
          }}
        />
      )}
      {data.map((value, index) => {
        const isPositive = value >= 0;
        const barHeight = (Math.abs(value) / maxValue) * height;
        
        return (
          <div
            key={index}
            className={`rounded-sm min-w-[2px] flex-1 ${
              isPositive ? 'bg-green-500/60' : 'bg-red-500/60'
            }`}
            style={{
              height: `${barHeight}px`,
              alignSelf: hasNegative ? 'center' : 'flex-end'
            }}
            title={`Période ${index + 1}: ${formatCurrency(value)}`}
          />
        );
      })}
    </div>
  );
});

EvolutionChart.displayName = 'EvolutionChart';

/**
 * Composant principal PatrimonyEvolutionModule
 */
const PatrimonyEvolutionModule = memo(({ 
  moduleId, 
  moduleType, 
  navigationTarget,
  data = {},
  navigation,
  isExpanded = true // Toujours affiché par défaut pour les modules historiques
}) => {
  // États
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [metrics, setMetrics] = useState(null);
  const [previousMetrics, setPreviousMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hook Synthèse pour accéder aux données financières
  const { 
    patrimoine, 
    planEpargne, 
    historique, 
    loading: syntheseLoading,
    error: syntheseError 
  } = useSynthese();

  // Configuration des périodes
  const periods = useMemo(() => [
    { value: '30', label: '30 jours' },
    { value: '90', label: '3 mois' },
    { value: '180', label: '6 mois' },
    { value: '365', label: '1 an' }
  ], []);

  // Calcul des métriques basé sur les données disponibles
  const calculateMetrics = useCallback((days) => {
    try {
      if (!patrimoine) {
        return {
          netWorthChange: { value: 0, percentage: 0, trend: 'neutral' },
          averageSavings: 0,
          investmentPerformance: { value: 0, percentage: 0 },
          objectivesReached: 0
        };
      }

      const currentNetWorth = patrimoine.total?.valorise || 0;
      
      // Calcul de la variation du patrimoine net
      // Si on a un historique, utiliser les données réelles
      let netWorthChange = { value: 0, percentage: 0, trend: 'neutral' };
      if (historique && historique.length > 0) {
        // Trouver l'entrée la plus proche de la période demandée
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - parseInt(days));
        
        const pastEntry = historique.find(entry => {
          const entryDate = new Date(entry.date);
          return entryDate <= targetDate;
        });
        
        if (pastEntry) {
          const pastNetWorth = pastEntry.patrimoine?.total?.valorise || 0;
          const change = currentNetWorth - pastNetWorth;
          const percentage = pastNetWorth > 0 ? (change / pastNetWorth) * 100 : 0;
          
          netWorthChange = {
            value: change,
            percentage,
            trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
          };
        }
      } else {
        // Simulation basée sur la performance actuelle
        const totalPlusValue = patrimoine.total?.plusValue || 0;
        const simulatedChange = totalPlusValue * (parseInt(days) / 365); // Extrapolation annuelle
        
        netWorthChange = {
          value: simulatedChange,
          percentage: currentNetWorth > 0 ? (simulatedChange / currentNetWorth) * 100 : 0,
          trend: simulatedChange > 0 ? 'up' : simulatedChange < 0 ? 'down' : 'neutral'
        };
      }

      // Épargne moyenne mensuelle
      const averageSavings = planEpargne?.totalMensuel || 0;

      // Performance des investissements
      const investmentValue = (patrimoine.or?.valorisation || 0) + (patrimoine.bourse?.valorisation || 0);
      const investmentCost = (patrimoine.or?.capitalInvesti || 0) + (patrimoine.bourse?.capitalInvesti || 0);
      const investmentGain = investmentValue - investmentCost;
      const investmentPerformance = {
        value: investmentGain,
        percentage: investmentCost > 0 ? (investmentGain / investmentCost) * 100 : 0
      };

      // Objectifs atteints (simulation)
      let objectivesReached = 0;
      if (netWorthChange.trend === 'up') objectivesReached++;
      if (investmentPerformance.percentage > 5) objectivesReached++;
      if (averageSavings > 0) objectivesReached++;

      return {
        netWorthChange,
        averageSavings,
        investmentPerformance,
        objectivesReached
      };
    } catch (err) {
      console.error('Erreur lors du calcul des métriques patrimoine:', err);
      return {
        netWorthChange: { value: 0, percentage: 0, trend: 'neutral' },
        averageSavings: 0,
        investmentPerformance: { value: 0, percentage: 0 },
        objectivesReached: 0
      };
    }
  }, [patrimoine, planEpargne, historique]);

  // Chargement des métriques
  const loadMetrics = useCallback(async (days) => {
    try {
      setIsLoading(true);
      setError(null);

      // Calculer les métriques pour la période actuelle
      const currentMetrics = calculateMetrics(days);
      
      // Calculer les métriques pour la période précédente (pour comparaison)
      const previousPeriodDays = parseInt(days) * 2;
      const previousMetrics = calculateMetrics(previousPeriodDays);
      
      setMetrics(currentMetrics);
      setPreviousMetrics(previousMetrics);
      
    } catch (err) {
      console.error('Erreur lors du chargement des métriques patrimoine:', err);
      setError('Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  }, [calculateMetrics]);

  // Debug: Log des données reçues
  React.useEffect(() => {
    console.log('[PatrimonyEvolutionModule] Props reçues:', {
      moduleId,
      moduleType,
      data,
      navigation
    });
  }, [moduleId, moduleType, data, navigation]);

  // Effet pour charger les données
  useEffect(() => {
    if (syntheseLoading) {
      setIsLoading(true);
      return;
    }
    
    if (syntheseError) {
      setError(syntheseError);
      setIsLoading(false);
      return;
    }
    
    loadMetrics(selectedPeriod);
  }, [selectedPeriod, loadMetrics, syntheseLoading, syntheseError]);

  // Écouter les événements de synchronisation
  useEffect(() => {
    const handleFinanceUpdated = (event) => {
      if (event.detail?.type === 'patrimoine') {
        // Recharger les métriques après une mise à jour du patrimoine
        loadMetrics(selectedPeriod);
      }
    };

    window.addEventListener('sidebar:finance:updated', handleFinanceUpdated);

    return () => {
      window.removeEventListener('sidebar:finance:updated', handleFinanceUpdated);
    };
  }, [selectedPeriod, loadMetrics]);

  // Handler de navigation
  const handleNavigateToFinance = useCallback(async () => {
    if (navigation?.setActiveTab) {
      try {
        await deepLinkService.navigateToModule({
          tab: 'finance',
          subtab: 'synthese',
          moduleId: 'patrimony-module',
          scrollBehavior: 'smooth'
        }, navigation.setActiveTab);
      } catch (error) {
        console.error('Erreur de navigation vers Finances:', error);
        // Fallback
        navigation.setActiveTab('finance');
      }
    }
  }, [navigation]);

  // Génération de données pour le mini-graphique
  const chartData = useMemo(() => {
    if (!metrics || !historique || historique.length === 0) {
      // Données simulées basées sur les métriques actuelles
      const baseValue = metrics?.netWorthChange?.value || 0;
      const periods = Math.min(parseInt(selectedPeriod) / 7, 12); // Max 12 points
      
      return Array.from({ length: periods }, (_, i) => {
        const variation = (Math.random() - 0.5) * 0.3;
        return baseValue * (1 + variation) * ((i + 1) / periods);
      });
    }
    
    // Utiliser les données réelles de l'historique
    const days = parseInt(selectedPeriod);
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - days);
    
    const relevantHistory = historique
      .filter(entry => new Date(entry.date) >= targetDate)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-12); // Max 12 points
    
    if (relevantHistory.length === 0) return [];
    
    const baseValue = relevantHistory[0].patrimoine?.total?.valorise || 0;
    
    return relevantHistory.map(entry => {
      const currentValue = entry.patrimoine?.total?.valorise || 0;
      return currentValue - baseValue;
    });
  }, [metrics, historique, selectedPeriod]);

  if (isLoading) {
    return (
      <div 
        className="sidebar-section historical-module patrimony-evolution-module"
        data-module-id={moduleId}
        data-module-type={moduleType}
      >
        <div className="sidebar-section-header">
          <h3 className="sidebar-section-title">
            <span className="sidebar-section-icon">💎</span>
            Évolution Patrimoine
          </h3>
        </div>
        {isExpanded && (
          <div className="sidebar-section-content">
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            </div>
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="sidebar-section historical-module patrimony-evolution-module"
        data-module-id={moduleId}
        data-module-type={moduleType}
      >
        <div className="sidebar-section-header">
          <h3 className="sidebar-section-title">
            <span className="sidebar-section-icon">💎</span>
            Évolution Patrimoine
          </h3>
        </div>
        {isExpanded && (
          <div className="sidebar-section-content">
            <div className="text-center py-4 text-red-400 text-sm">
              {error}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className="sidebar-section historical-module patrimony-evolution-module cursor-pointer"
      data-module-id={moduleId}
      data-module-type={moduleType}
      onClick={handleNavigateToFinance}
    >
      <div className="sidebar-section-header">
        <div className="flex items-center justify-between">
          <h3 className="sidebar-section-title">
            <span className="sidebar-section-icon">💎</span>
            Évolution Patrimoine
          </h3>
          <PeriodSelector
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
            periods={periods}
          />
        </div>
      </div>

      {isExpanded && (
        <div className="sidebar-section-content space-y-3">
        {/* Variation patrimoine net */}
        <div className="metric-card bg-slate-700/30 rounded-lg p-3 border border-slate-600/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-slate-400">Variation Net Worth</span>
            </div>
            <TrendIndicator 
              current={metrics?.netWorthChange?.value || 0} 
              previous={previousMetrics?.netWorthChange?.value || 0} 
              type="currency"
            />
          </div>
          <div className="text-lg font-semibold text-white">
            {formatCurrency(metrics?.netWorthChange?.value || 0)}
          </div>
          <div className={`text-xs ${
            (metrics?.netWorthChange?.percentage || 0) >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {(metrics?.netWorthChange?.percentage || 0) >= 0 ? '+' : ''}
            {(metrics?.netWorthChange?.percentage || 0).toFixed(2)}%
          </div>
        </div>

        {/* Métriques secondaires */}
        <div className="grid grid-cols-2 gap-3">
          {/* Épargne moyenne */}
          <div className="metric-card bg-slate-700/30 rounded-lg p-3 border border-slate-600/50">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-xs text-slate-400">Épargne/mois</span>
            </div>
            <div className="text-lg font-semibold text-white">
              {formatCurrency(metrics?.averageSavings || 0)}
            </div>
          </div>

          {/* Performance investissements */}
          <div className="metric-card bg-slate-700/30 rounded-lg p-3 border border-slate-600/50">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-slate-400">Perf. Invest.</span>
            </div>
            <div className="text-lg font-semibold text-white">
              {formatCurrency(metrics?.investmentPerformance?.value || 0)}
            </div>
            <div className={`text-xs ${
              (metrics?.investmentPerformance?.percentage || 0) >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {(metrics?.investmentPerformance?.percentage || 0) >= 0 ? '+' : ''}
              {(metrics?.investmentPerformance?.percentage || 0).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Objectifs atteints */}
        <div className="metric-card bg-slate-700/30 rounded-lg p-3 border border-slate-600/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-orange-400" />
              <span className="text-xs text-slate-400">Objectifs atteints</span>
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: 3 }, (_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i < (metrics?.objectivesReached || 0) 
                      ? 'bg-green-400' 
                      : 'bg-slate-600'
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="text-lg font-semibold text-white mt-1">
            {metrics?.objectivesReached || 0}/3
          </div>
        </div>

        {/* Mini-graphique d'évolution */}
        {chartData.length > 0 && (
          <div className="chart-container bg-slate-700/20 rounded-lg p-3 border border-slate-600/30">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span className="text-xs text-slate-400">Évolution patrimoine</span>
            </div>
            <EvolutionChart data={chartData} />
          </div>
        )}

        {/* Indicateur de navigation */}
        <div className="navigation-hint text-center">
          <span className="text-xs text-slate-500">
            Cliquer pour voir les détails →
          </span>
        </div>
        </div>
      )}
    </div>
  );
});

PatrimonyEvolutionModule.displayName = 'PatrimonyEvolutionModule';

export default PatrimonyEvolutionModule;