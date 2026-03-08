/**
 * StatisticsSubTab Component
 * 
 * Sous-onglet dédié aux statistiques de lecture dans l'onglet Livres.
 * Affiche des graphiques interactifs et des métriques détaillées basées sur
 * les sessions de lecture des utilisateurs.
 * 
 * Features:
 * - Dashboard avec métriques principales
 * - Graphiques interactifs (pages/jour, vitesse, heatmap, genres, objectifs)
 * - Filtres temporels (7j, 1m, 3m, 6m, 1an, tout)
 * - Mode comparaison entre périodes
 * - Export des statistiques
 * 
 * @see Requirements 1.1, 1.2, 10.3
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { BarChart3, Calendar, TrendingUp, Filter } from 'lucide-react';
import Button from '../../ui/Button';
import DebouncedInput from '../../ui/DebouncedInput';
import { useTranslation } from '../../../utils/translations';
import { sidebarEvents, SIDEBAR_EVENTS } from '../../../utils/sidebarEvents';

// Import des styles mobile
import '../../../styles/statistics-mobile.css';

// Import des composants de graphiques
import ChartsContainer from './statistics/ChartsContainer';
import MetricsPanel, { SessionAnalysis, AccomplishmentsSection } from './statistics/MetricsPanel';
import TimeFilters from './statistics/TimeFilters';
import ComparisonMode from './statistics/ComparisonMode';
import { ExportToolsContent } from './statistics/ExportTools';
import PredictionsPanel from './statistics/PredictionsPanel';
import Card, { CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { Activity, Trophy, Download } from 'lucide-react';

// Import du moniteur de performance (dev seulement)
import PerformanceMonitor from '../../debug/PerformanceMonitor';

// Import de l'error boundary
import StatisticsErrorBoundary from '../../statistics/StatisticsErrorBoundary';

// Import des services de données
import { useStatisticsData } from '../../../hooks/useStatisticsData';
import { useUserPreferences } from '../../../hooks/useUserPreferences';

/**
 * Types de périodes temporelles supportées
 */
const TIME_PERIODS = {
  '7d': { label: '7 jours', days: 7, granularity: 'day' },
  '1m': { label: '1 mois', days: 30, granularity: 'day' },
  '3m': { label: '3 mois', days: 90, granularity: 'week' },
  '6m': { label: '6 mois', days: 180, granularity: 'week' },
  '1y': { label: '1 an', days: 365, granularity: 'month' },
  'all': { label: 'Tout', days: null, granularity: 'month' }
};



const StatisticsSubTabContent = ({ books = [] }) => {
  const t = useTranslation();
  
  // Gestion des préférences utilisateur
  const {
    preferences,
    updateFilters,
    updateDisplay,
    isSectionExpanded,
    toggleSection
  } = useUserPreferences();
  
  // État local du composant basé sur les préférences
  const [selectedPeriod, setSelectedPeriod] = useState(preferences.filters.selectedPeriod);
  const [activeChart, setActiveChart] = useState(preferences.display.activeChart);
  const [comparisonMode, setComparisonMode] = useState(preferences.display.comparisonMode);
  const [filters, setFilters] = useState({
    genre: preferences.filters.genre,
    status: preferences.filters.status,
    author: preferences.filters.author
  });
  
  // État pour forcer la re-calcul des données lors des événements sidebar
  const [dataVersion, setDataVersion] = useState(0);
  
  // Écouter les événements sidebar pour mettre à jour les statistiques en temps réel
  const handleSidebarEvent = useCallback(() => {
    // Forcer le recalcul des données en incrémentant la version
    setDataVersion(prev => prev + 1);
  }, []);
  
  useEffect(() => {
    // S'abonner aux événements qui affectent les statistiques
    sidebarEvents.on(SIDEBAR_EVENTS.BOOK_ADDED, handleSidebarEvent);
    sidebarEvents.on(SIDEBAR_EVENTS.BOOK_UPDATED, handleSidebarEvent);
    sidebarEvents.on(SIDEBAR_EVENTS.BOOK_DELETED, handleSidebarEvent);
    sidebarEvents.on(SIDEBAR_EVENTS.PAGES_READ, handleSidebarEvent);
    
    return () => {
      // Nettoyer les listeners
      sidebarEvents.off(SIDEBAR_EVENTS.BOOK_ADDED, handleSidebarEvent);
      sidebarEvents.off(SIDEBAR_EVENTS.BOOK_UPDATED, handleSidebarEvent);
      sidebarEvents.off(SIDEBAR_EVENTS.BOOK_DELETED, handleSidebarEvent);
      sidebarEvents.off(SIDEBAR_EVENTS.PAGES_READ, handleSidebarEvent);
    };
  }, [handleSidebarEvent]);

  // Calculer les données statistiques (métriques + graphiques) à partir des livres et sessions
  // Inclut déjà les prédictions et patterns calculés par MetricsCalculator
  const statisticsData = useStatisticsData(books, selectedPeriod, filters, dataVersion);
  
  // Prédictions directement issues du calcul des métriques
  const predictions = statisticsData.predictions || [];

  // Mémoriser les options de filtres disponibles
  const filterOptions = useMemo(() => {
    const genres = [...new Set(books.map(book => book.genre).filter(Boolean))];
    const authors = [...new Set(books.map(book => book.author).filter(Boolean))];
    const statuses = ['in-progress', 'completed', 'to-read', 'paused', 'abandoned'];
    
    return { genres, authors, statuses };
  }, [books]);

  // Gestionnaires d'événements avec persistance
  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    updateFilters({ selectedPeriod: period });
  };

  const handleChartChange = (chartType) => {
    setActiveChart(chartType);
    updateDisplay({ activeChart: chartType });
  };

  const handleFilterChange = (filterType, value) => {
    const newFilters = {
      ...filters,
      [filterType]: value
    };
    setFilters(newFilters);
    updateFilters(newFilters);
  };

  const handleComparisonToggle = () => {
    const newComparisonMode = !comparisonMode;
    setComparisonMode(newComparisonMode);
    updateDisplay({ comparisonMode: newComparisonMode });
  };

  // Vérifier si nous avons des données à afficher
  const hasData = books.length > 0 && statisticsData.hasData;

  return (
    <div className="statistics-container">
      {/* Header avec titre et contrôles principaux */}
      <div className="statistics-header">
        <div className="statistics-title-section">
          <BarChart3 className="w-6 h-6 text-purple-300" />
          <div>
            <h2 className="text-2xl font-bold text-white">
              {t('books.statistics.title', 'Statistiques de Lecture')}
            </h2>
            <p className="text-sm text-slate-400">
              {t('books.statistics.subtitle', 'Analyse de tes habitudes et progression de lecture')}
            </p>
          </div>
        </div>
        
        <div className="statistics-controls">
          <Button
            variant={comparisonMode ? 'primary' : 'glass'}
            size="sm"
            onClick={handleComparisonToggle}
            className="flex items-center gap-2 touch-target"
          >
            <TrendingUp className="w-4 h-4" />
            {t('books.statistics.comparison', 'Comparaison')}
          </Button>
        </div>
      </div>

      {/* Filtres temporels et autres filtres */}
      <Card variant="glass">
        <CardContent className="p-4">
          <div className="filters-container">
            {/* Filtres temporels */}
            <div className="time-filters">
              <TimeFilters
                selectedPeriod={selectedPeriod}
                onPeriodChange={handlePeriodChange}
                periods={TIME_PERIODS}
              />
            </div>
            
            {/* Séparateur visuel */}
            <div className="hidden lg:block w-px h-6 bg-slate-600"></div>
            
            {/* Autres filtres */}
            <div className="other-filters">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-300">
                  {t('books.statistics.filters', 'Filtres')}:
                </span>
              </div>
              
              <DebouncedInput
                type="select"
                value={filters.genre}
                onChange={(e) => handleFilterChange('genre', e.target.value)}
                className="min-w-[120px] touch-target"
                delay={200}
                showLoadingIndicator={true}
              >
                <option value="">{t('books.statistics.allGenres', 'Tous les genres')}</option>
                {filterOptions.genres.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </DebouncedInput>
              
              <DebouncedInput
                type="select"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="min-w-[120px] touch-target"
                delay={200}
                showLoadingIndicator={true}
              >
                <option value="">{t('books.statistics.allStatuses', 'Tous les statuts')}</option>
                {filterOptions.statuses.map(status => (
                  <option key={status} value={status}>
                    {t(`books.status.${status}`, status)}
                  </option>
                ))}
              </DebouncedInput>
              
              <DebouncedInput
                type="select"
                value={filters.author}
                onChange={(e) => handleFilterChange('author', e.target.value)}
                className="min-w-[120px] touch-target"
                delay={200}
                showLoadingIndicator={true}
              >
                <option value="">{t('books.statistics.allAuthors', 'Tous les auteurs')}</option>
                {filterOptions.authors.map(author => (
                  <option key={author} value={author}>{author}</option>
                ))}
              </DebouncedInput>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contenu principal */}
      {!hasData ? (
        // État vide - pas de données
        <Card variant="glass">
          <CardContent className="text-center py-12">
            <Calendar className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-300 mb-2">
              {t('books.statistics.noData.title', 'Aucune donnée de lecture')}
            </h3>
            <p className="text-slate-400 mb-4">
              {t('books.statistics.noData.description', 
                'Commence à enregistrer des sessions de lecture pour voir tes statistiques apparaître ici.')}
            </p>
            <div className="text-sm text-slate-500">
              <p>{t('books.statistics.noData.suggestions.title', 'Pour commencer:')}</p>
              <ul className="mt-2 space-y-1">
                <li>• {t('books.statistics.noData.suggestions.addBook', 'Ajoute un livre à ta bibliothèque')}</li>
                <li>• {t('books.statistics.noData.suggestions.addSession', 'Enregistre une session de lecture')}</li>
                <li>• {t('books.statistics.noData.suggestions.viewStats', 'Reviens ici pour voir tes statistiques')}</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      ) : comparisonMode ? (
        // Mode comparaison
        <div className="comparison-layout">
          <ComparisonMode
            books={books}
            statisticsData={statisticsData}
            selectedPeriod={selectedPeriod}
            filters={filters}
            userPreferences={{
              preferences,
              addFavoriteComparison: (comparison) => {
                // Placeholder for future implementation
                console.log('Add favorite comparison:', comparison);
              },
              removeFavoriteComparison: (id) => {
                // Placeholder for future implementation
                console.log('Remove favorite comparison:', id);
              }
            }}
          />
        </div>
      ) : (
        // Mode normal - dashboard avec métriques et graphiques
        <div className="space-y-6">
          {/* Panneau de prédictions et insights */}
          <div className="predictions-panel">
            <PredictionsPanel predictions={predictions} />
          </div>
          
          {/* Panneau de métriques (pleine largeur) */}
          <div className="metrics-panel-full">
            <MetricsPanel 
              statisticsData={statisticsData}
              selectedPeriod={selectedPeriod}
              books={books}
              userPreferences={{ isSectionExpanded, toggleSection }}
            />
          </div>
          
          {/* Modules supplémentaires au-dessus des graphiques */}
          <div className="modules-section space-y-4">
            {/* Analyse des sessions */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle size="sm" className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-300" />
                  Analyse des sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SessionAnalysis 
                  metrics={statisticsData?.metrics} 
                  patterns={statisticsData?.patterns} 
                />
              </CardContent>
            </Card>
            
            {/* Accomplissements */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle size="sm" className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-green-300" />
                  Accomplissements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AccomplishmentsSection 
                  books={books} 
                  metrics={statisticsData?.metrics} 
                  predictions={statisticsData?.predictions} 
                />
              </CardContent>
            </Card>
            
            {/* Outils d'export */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle size="sm" className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-green-300" />
                  Outils d'Export et Partage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ExportToolsContent 
                  statisticsData={statisticsData}
                  selectedPeriod={selectedPeriod}
                  books={books}
                />
              </CardContent>
            </Card>
          </div>
          
          {/* Container des graphiques (pleine largeur) */}
          <div className="charts-main-full">
            <ChartsContainer
              books={books}
              statisticsData={statisticsData}
              activeChart={activeChart}
              onChartChange={handleChartChange}
              selectedPeriod={selectedPeriod}
              filters={filters}
            />
          </div>
        </div>
      )}
      
      {/* Moniteur de performance (dev seulement) */}
      <PerformanceMonitor statisticsData={statisticsData} />
    </div>
  );
};

// Wrapper avec Error Boundary
const StatisticsSubTab = ({ books = [] }) => {
  return (
    <StatisticsErrorBoundary
      context={{ books: books?.length || 0 }}
      fallbackType="full"
      onRetry={() => {
        // Invalider le cache lors du retry
        if (window.statisticsCache) {
          window.statisticsCache.clear();
        }
      }}
      onReset={() => {
        // Reset complet des préférences si nécessaire
        if (window.confirm('Réinitialiser toutes les préférences des statistiques ?')) {
          localStorage.removeItem('statisticsPreferences');
          window.location.reload();
        }
      }}
    >
      <StatisticsSubTabContent books={books} />
    </StatisticsErrorBoundary>
  );
};

export default StatisticsSubTab;