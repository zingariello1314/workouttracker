/**
 * ComparisonMode Component
 * 
 * Interface de comparaison entre deux périodes pour analyser l'évolution
 * des habitudes de lecture. Permet de sélectionner deux périodes et
 * d'afficher les différences et pourcentages d'évolution.
 * 
 * @see Requirements 9.1, 9.2, 9.3, 9.4
 */

import React, { useState, useMemo } from 'react';
import { Calendar, TrendingUp, TrendingDown, Minus, ArrowRight, BarChart3, Clock, BookOpen, Target } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import Button from '../../../ui/Button';
import { Select } from '../../../ui/Input';
import { useTranslation } from '../../../../utils/translations';
import FavoriteComparisons from './FavoriteComparisons';

// Import des services
import SessionAggregator from '../../../../services/statistics/SessionAggregator';
import MetricsCalculator from '../../../../services/statistics/MetricsCalculator';

/**
 * Périodes prédéfinies pour la comparaison
 */
const COMPARISON_PERIODS = {
  '7d': { label: '7 derniers jours', days: 7 },
  '1m': { label: '30 derniers jours', days: 30 },
  '3m': { label: '3 derniers mois', days: 90 },
  '6m': { label: '6 derniers mois', days: 180 },
  '1y': { label: '1 dernière année', days: 365 }
};

/**
 * Périodes personnalisées pour comparaison historique
 */
const HISTORICAL_PERIODS = {
  'last_week': { label: 'Semaine dernière', offset: 7, duration: 7 },
  'last_month': { label: 'Mois dernier', offset: 30, duration: 30 },
  'last_quarter': { label: 'Trimestre dernier', offset: 90, duration: 90 },
  'same_period_last_year': { label: 'Même période l\'an dernier', offset: 365, duration: 30 }
};

const ComparisonMode = ({ 
  books, 
  selectedPeriod, 
  filters, 
  userPreferences 
}) => {
  const t = useTranslation();
  
  // État local pour la comparaison
  const [comparisonType, setComparisonType] = useState('periods'); // 'periods' ou 'historical'
  const [period1, setPeriod1] = useState('1m');
  const [period2, setPeriod2] = useState('3m');
  const [historicalPeriod, setHistoricalPeriod] = useState('last_month');

  // Calculer les données pour les deux périodes
  const comparisonData = useMemo(() => {
    if (comparisonType === 'periods') {
      // Comparaison entre deux périodes récentes
      const data1 = SessionAggregator.aggregateSessions(books, period1, filters);
      const data2 = SessionAggregator.aggregateSessions(books, period2, filters);
      
      const metrics1 = MetricsCalculator.calculateBasicMetrics(data1);
      const metrics2 = MetricsCalculator.calculateBasicMetrics(data2);
      
      return {
        period1: {
          label: COMPARISON_PERIODS[period1].label,
          data: data1,
          metrics: metrics1
        },
        period2: {
          label: COMPARISON_PERIODS[period2].label,
          data: data2,
          metrics: metrics2
        }
      };
    } else {
      // Comparaison historique
      const currentData = SessionAggregator.aggregateSessions(books, selectedPeriod, filters);
      const historicalData = getHistoricalData(books, historicalPeriod, filters);
      
      const currentMetrics = MetricsCalculator.calculateBasicMetrics(currentData);
      const historicalMetrics = MetricsCalculator.calculateBasicMetrics(historicalData);
      
      return {
        period1: {
          label: 'Période actuelle',
          data: currentData,
          metrics: currentMetrics
        },
        period2: {
          label: HISTORICAL_PERIODS[historicalPeriod].label,
          data: historicalData,
          metrics: historicalMetrics
        }
      };
    }
  }, [books, comparisonType, period1, period2, historicalPeriod, selectedPeriod, filters]);

  // Calculer les différences et évolutions
  const evolution = useMemo(() => {
    return calculateEvolution(comparisonData.period1.metrics, comparisonData.period2.metrics);
  }, [comparisonData]);

  // Gestionnaires d'événements pour les comparaisons favorites
  const handleAddFavoriteComparison = (comparisonData) => {
    if (userPreferences?.addFavoriteComparison) {
      const comparison = {
        name: comparisonData.name,
        period1: { 
          key: period1, 
          label: COMPARISON_PERIODS[period1]?.label || period1 
        },
        period2: { 
          key: period2, 
          label: COMPARISON_PERIODS[period2]?.label || period2 
        },
        filters: filters,
        type: comparisonType,
        config: comparisonType === 'periods' 
          ? { period1, period2 } 
          : { historicalPeriod }
      };
      
      return userPreferences.addFavoriteComparison(comparison);
    }
  };

  const handleLoadFavoriteComparison = (comparison) => {
    if (comparison.type) {
      setComparisonType(comparison.type);
    }
    
    if (comparison.config) {
      if (comparison.config.period1 && comparison.config.period2) {
        setPeriod1(comparison.config.period1);
        setPeriod2(comparison.config.period2);
      }
      if (comparison.config.historicalPeriod) {
        setHistoricalPeriod(comparison.config.historicalPeriod);
      }
    }
  };

  const handleRemoveFavoriteComparison = (comparisonId) => {
    if (userPreferences?.removeFavoriteComparison) {
      userPreferences.removeFavoriteComparison(comparisonId);
    }
  };

  // Obtenir les comparaisons favorites
  const favoriteComparisons = userPreferences?.preferences?.favoriteComparisons || [];

  // Données de la comparaison actuelle pour les favoris
  const currentComparisonForFavorites = {
    period1: { 
      key: period1, 
      label: COMPARISON_PERIODS[period1]?.label || period1 
    },
    period2: { 
      key: period2, 
      label: COMPARISON_PERIODS[period2]?.label || period2 
    },
    filters: filters,
    type: comparisonType
  };

  return (
    <div className="space-y-6">
      {/* Header avec contrôles de comparaison */}
      <Card variant="books">
        <CardHeader className="border-b border-[#3A86FF]/25">
          <CardTitle tone="books" className="flex items-center gap-3 normal-case tracking-wide">
            <TrendingUp className="w-5 h-5 text-[#93c5fd]" />
            {t('books.statistics.comparison.title', 'Mode Comparaison')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Type de comparaison */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={comparisonType === 'periods' ? 'books' : 'booksMuted'}
              size="sm"
              onClick={() => setComparisonType('periods')}
              className="normal-case tracking-normal"
            >
              Périodes récentes
            </Button>
            <Button
              variant={comparisonType === 'historical' ? 'books' : 'booksMuted'}
              size="sm"
              onClick={() => setComparisonType('historical')}
              className="normal-case tracking-normal"
            >
              Comparaison historique
            </Button>
          </div>

          {/* Sélection des périodes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {comparisonType === 'periods' ? (
              <>
                <div>
                  <label className="block text-sm text-[#93c5fd] mb-2">Période 1</label>
                  <Select
                    fieldTone="books"
                    value={period1}
                    onChange={(e) => setPeriod1(e.target.value)}
                    className="w-full"
                  >
                    {Object.entries(COMPARISON_PERIODS).map(([key, period]) => (
                      <option key={key} value={key}>{period.label}</option>
                    ))}
                  </Select>
                </div>
                
                <div className="flex justify-center">
                  <ArrowRight className="w-6 h-6 text-slate-400" />
                </div>
                
                <div>
                  <label className="block text-sm text-[#93c5fd] mb-2">Période 2</label>
                  <Select
                    fieldTone="books"
                    value={period2}
                    onChange={(e) => setPeriod2(e.target.value)}
                    className="w-full"
                  >
                    {Object.entries(COMPARISON_PERIODS).map(([key, period]) => (
                      <option key={key} value={key}>{period.label}</option>
                    ))}
                  </Select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm text-[#93c5fd] mb-2">Période actuelle</label>
                  <div className="p-2 bg-black/70 border border-[#3A86FF]/35 rounded text-sm text-[#bfdbfe]">
                    {COMPARISON_PERIODS[selectedPeriod]?.label || selectedPeriod}
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <ArrowRight className="w-6 h-6 text-slate-400" />
                </div>
                
                <div>
                  <label className="block text-sm text-[#93c5fd] mb-2">Période historique</label>
                  <Select
                    fieldTone="books"
                    value={historicalPeriod}
                    onChange={(e) => setHistoricalPeriod(e.target.value)}
                    className="w-full"
                  >
                    {Object.entries(HISTORICAL_PERIODS).map(([key, period]) => (
                      <option key={key} value={key}>{period.label}</option>
                    ))}
                  </Select>
                </div>
              </>
            )}
          </div>

        </CardContent>
      </Card>

      {/* Comparaisons favorites */}
      <FavoriteComparisons
        favoriteComparisons={favoriteComparisons}
        onAddFavorite={handleAddFavoriteComparison}
        onRemoveFavorite={handleRemoveFavoriteComparison}
        onLoadComparison={handleLoadFavoriteComparison}
        currentComparison={currentComparisonForFavorites}
      />

      {/* Résultats de la comparaison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Période 1 */}
        <PeriodCard
          period={comparisonData.period1}
          color="blue"
          isReference={false}
        />
        
        {/* Période 2 */}
        <PeriodCard
          period={comparisonData.period2}
          color="purple"
          isReference={true}
        />
      </div>

      {/* Analyse des évolutions */}
      <EvolutionAnalysis evolution={evolution} />

      {/* Graphiques comparatifs */}
      <ComparisonCharts 
        period1={comparisonData.period1}
        period2={comparisonData.period2}
      />
    </div>
  );
};

/**
 * Composant pour afficher les métriques d'une période
 */
const PeriodCard = ({ period, color, isReference }) => {
  const t = useTranslation();
  
  const accentRing =
    color === 'blue' ? 'ring-1 ring-sky-400/35' : 'ring-1 ring-violet-400/35';

  return (
    <Card variant="books" className={accentRing}>
      <CardHeader className="border-b border-[#3A86FF]/25">
        <CardTitle tone="books" className="flex items-center justify-between normal-case tracking-wide">
          <span>{period.label}</span>
          {isReference && (
            <span className="text-xs bg-[#3A86FF]/20 text-[#bfdbfe] border border-[#3A86FF]/40 px-2 py-1 rounded">
              Référence
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <MetricItem
            icon={<BookOpen className="w-4 h-4" />}
            label="Pages lues"
            value={period.metrics.totalPages || 0}
            unit="pages"
          />
          <MetricItem
            icon={<Clock className="w-4 h-4" />}
            label="Temps total"
            value={Math.round((period.metrics.totalTime || 0) / 60 * 10) / 10}
            unit="heures"
          />
          <MetricItem
            icon={<BarChart3 className="w-4 h-4" />}
            label="Sessions"
            value={period.metrics.sessionsCount || 0}
            unit="sessions"
          />
          <MetricItem
            icon={<TrendingUp className="w-4 h-4" />}
            label="Vitesse moy."
            value={period.metrics.averageSpeed || 0}
            unit="p/h"
          />
        </div>
        
        <div className="pt-2 border-t border-[#3A86FF]/25">
          <div className="text-sm text-[#93c5fd]/85 space-y-1">
            <div>Streak actuel: {period.metrics.currentStreak || 0} jours</div>
            <div>Jours actifs: {period.metrics.uniqueDays || 0}</div>
            <div>Livres touchés: {period.metrics.uniqueBooks || 0}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Composant pour afficher une métrique individuelle
 */
const MetricItem = ({ icon, label, value, unit }) => (
    <div className="text-center">
    <div className="flex items-center justify-center gap-1 text-[#93c5fd]/80 mb-1">
      {icon}
      <span className="text-xs">{label}</span>
    </div>
    <div className="text-lg font-semibold text-[#bfdbfe]">
      {typeof value === 'number' ? value.toLocaleString() : value}
    </div>
    <div className="text-xs text-[#93c5fd]/65">{unit}</div>
  </div>
);

/**
 * Composant pour l'analyse des évolutions
 */
const EvolutionAnalysis = ({ evolution }) => {
  const t = useTranslation();

  return (
    <Card variant="books">
      <CardHeader className="border-b border-[#3A86FF]/25">
        <CardTitle tone="books" className="flex items-center gap-3 normal-case tracking-wide">
          <TrendingUp className="w-5 h-5 text-[#93c5fd]" />
          Analyse des évolutions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(evolution).map(([metric, data]) => (
            <EvolutionItem key={metric} metric={metric} data={data} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Composant pour afficher l'évolution d'une métrique
 */
const EvolutionItem = ({ metric, data }) => {
  const getMetricLabel = (metric) => {
    const labels = {
      totalPages: 'Pages lues',
      totalTime: 'Temps total',
      sessionsCount: 'Sessions',
      averageSpeed: 'Vitesse moyenne',
      currentStreak: 'Streak actuel',
      uniqueDays: 'Jours actifs'
    };
    return labels[metric] || metric;
  };

  const getIcon = () => {
    if (data.percentage > 5) return <TrendingUp className="w-4 h-4 text-sky-300" />;
    if (data.percentage < -5) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  const getColorClass = () => {
    if (data.percentage > 5) return 'text-sky-300';
    if (data.percentage < -5) return 'text-red-400';
    return 'text-slate-400';
  };

  return (
    <div className="text-center p-3 bg-black/70 border border-[#3A86FF]/25 rounded-xl">
      <div className="flex items-center justify-center gap-1 text-[#93c5fd]/75 mb-2">
        {getIcon()}
        <span className="text-xs">{getMetricLabel(metric)}</span>
      </div>
      <div className={`text-lg font-semibold ${getColorClass()}`}>
        {data.percentage > 0 ? '+' : ''}{data.percentage}%
      </div>
      <div className="text-xs text-[#93c5fd]/65">
        {data.current} vs {data.previous}
      </div>
    </div>
  );
};

/**
 * Composant pour les graphiques comparatifs
 */
const ComparisonCharts = ({ period1, period2 }) => {
  // Placeholder pour les graphiques comparatifs
  // Sera implémenté avec Recharts dans une version future
  return (
    <Card variant="books">
      <CardHeader className="border-b border-[#3A86FF]/25">
        <CardTitle tone="books" className="flex items-center gap-3 normal-case tracking-wide">
          <BarChart3 className="w-5 h-5 text-[#93c5fd]" />
          Graphiques comparatifs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-[#93c5fd]/80">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Graphiques comparatifs en cours de développement</p>
          <p className="text-sm mt-2">
            Affichage côte à côte des évolutions temporelles
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Utilitaire pour obtenir les données historiques
 */
function getHistoricalData(books, historicalPeriod, filters) {
  const config = HISTORICAL_PERIODS[historicalPeriod];
  if (!config) return { sessions: [], byDate: {}, byGenre: {}, byAuthor: {}, streaks: {}, totalSessions: 0, totalPages: 0, totalMinutes: 0, uniqueDays: 0, uniqueBooks: 0 };

  // Calculer les dates de début et fin de la période historique
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - config.offset);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - config.duration);

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  // Filtrer les sessions dans cette période
  const allSessions = SessionAggregator.extractAllSessions(books);
  const historicalSessions = allSessions.filter(session => 
    session.normalizedDate >= startDateStr && session.normalizedDate <= endDateStr
  );

  // Appliquer les filtres supplémentaires
  const filteredSessions = SessionAggregator.filterByCriteria(historicalSessions, filters);

  // Créer les agrégations
  const byDate = SessionAggregator.groupByDate(filteredSessions);
  const byGenre = SessionAggregator.groupByGenre(filteredSessions);
  const byAuthor = SessionAggregator.groupByAuthor(filteredSessions);
  const streaks = SessionAggregator.calculateStreaks(filteredSessions);

  return {
    sessions: filteredSessions,
    byDate,
    byGenre,
    byAuthor,
    streaks,
    totalSessions: filteredSessions.length,
    totalPages: filteredSessions.reduce((sum, s) => sum + s.pagesRead, 0),
    totalMinutes: filteredSessions.reduce((sum, s) => sum + s.durationMinutes, 0),
    uniqueDays: Object.keys(byDate).length,
    uniqueBooks: new Set(filteredSessions.map(s => s.bookId)).size
  };
}

/**
 * Utilitaire pour calculer l'évolution entre deux périodes
 */
function calculateEvolution(current, previous) {
  const evolution = {};
  
  const metrics = ['totalPages', 'totalTime', 'sessionsCount', 'averageSpeed', 'currentStreak', 'uniqueDays'];
  
  metrics.forEach(metric => {
    const currentValue = current[metric] || 0;
    const previousValue = previous[metric] || 0;
    
    let percentage = 0;
    if (previousValue > 0) {
      percentage = Math.round(((currentValue - previousValue) / previousValue) * 100);
    } else if (currentValue > 0) {
      percentage = 100;
    }
    
    evolution[metric] = {
      current: currentValue,
      previous: previousValue,
      difference: currentValue - previousValue,
      percentage
    };
  });
  
  return evolution;
}

export default ComparisonMode;