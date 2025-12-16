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

import React, { useState, useMemo } from 'react';
import { BarChart3, Calendar, Clock, Target, TrendingUp, Filter } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../ui/Card';
import Button from '../../ui/Button';
import { Select } from '../../ui/Input';
import { useTranslation } from '../../../utils/translations';

// Import des composants de graphiques (à créer)
import ChartsContainer from './statistics/ChartsContainer';
import MetricsPanel from './statistics/MetricsPanel';
import TimeFilters from './statistics/TimeFilters';
import ComparisonMode from './statistics/ComparisonMode';
import ExportTools from './statistics/ExportTools';

// Import des services de données (à créer)
import { useStatisticsData } from '../../../hooks/useStatisticsData';

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

/**
 * Types de graphiques disponibles
 */
const CHART_TYPES = {
  PAGES_PER_DAY: 'pages-per-day',
  READING_SPEED: 'reading-speed',
  HEATMAP_CALENDAR: 'heatmap-calendar',
  GENRE_DISTRIBUTION: 'genre-distribution',
  GOALS_PROGRESS: 'goals-progress'
};

const StatisticsSubTab = ({ books = [] }) => {
  const t = useTranslation();
  
  // État local du composant
  const [selectedPeriod, setSelectedPeriod] = useState('1m');
  const [activeChart, setActiveChart] = useState(CHART_TYPES.PAGES_PER_DAY);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [filters, setFilters] = useState({
    genre: '',
    status: '',
    author: ''
  });

  // Calculer les données statistiques avec le hook personnalisé
  const statisticsData = useStatisticsData(books, selectedPeriod, filters);

  // Mémoriser les options de filtres disponibles
  const filterOptions = useMemo(() => {
    const genres = [...new Set(books.map(book => book.genre).filter(Boolean))];
    const authors = [...new Set(books.map(book => book.author).filter(Boolean))];
    const statuses = ['in-progress', 'completed', 'to-read', 'paused', 'abandoned'];
    
    return { genres, authors, statuses };
  }, [books]);

  // Gestionnaires d'événements
  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
  };

  const handleChartChange = (chartType) => {
    setActiveChart(chartType);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleComparisonToggle = () => {
    setComparisonMode(!comparisonMode);
  };

  // Vérifier si nous avons des données à afficher
  const hasData = books.length > 0 && statisticsData.hasData;

  return (
    <div className="space-y-6">
      {/* Header avec titre et contrôles principaux */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
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
        
        <div className="flex items-center gap-3">
          <Button
            variant={comparisonMode ? 'primary' : 'glass'}
            size="sm"
            onClick={handleComparisonToggle}
            className="flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            {t('books.statistics.comparison', 'Comparaison')}
          </Button>
          <ExportTools 
            statisticsData={statisticsData}
            selectedPeriod={selectedPeriod}
          />
        </div>
      </div>

      {/* Filtres temporels et autres filtres */}
      <Card variant="glass">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Filtres temporels */}
            <TimeFilters
              selectedPeriod={selectedPeriod}
              onPeriodChange={handlePeriodChange}
              periods={TIME_PERIODS}
            />
            
            {/* Séparateur visuel */}
            <div className="hidden lg:block w-px h-6 bg-slate-600"></div>
            
            {/* Autres filtres */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-300">
                  {t('books.statistics.filters', 'Filtres')}:
                </span>
              </div>
              
              <Select
                value={filters.genre}
                onChange={(e) => handleFilterChange('genre', e.target.value)}
                className="min-w-[120px]"
              >
                <option value="">{t('books.statistics.allGenres', 'Tous les genres')}</option>
                {filterOptions.genres.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </Select>
              
              <Select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="min-w-[120px]"
              >
                <option value="">{t('books.statistics.allStatuses', 'Tous les statuts')}</option>
                {filterOptions.statuses.map(status => (
                  <option key={status} value={status}>
                    {t(`books.status.${status}`, status)}
                  </option>
                ))}
              </Select>
              
              <Select
                value={filters.author}
                onChange={(e) => handleFilterChange('author', e.target.value)}
                className="min-w-[120px]"
              >
                <option value="">{t('books.statistics.allAuthors', 'Tous les auteurs')}</option>
                {filterOptions.authors.map(author => (
                  <option key={author} value={author}>{author}</option>
                ))}
              </Select>
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
        <ComparisonMode
          books={books}
          statisticsData={statisticsData}
          selectedPeriod={selectedPeriod}
          filters={filters}
        />
      ) : (
        // Mode normal - dashboard avec métriques et graphiques
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Panneau de métriques (colonne de gauche) */}
          <div className="xl:col-span-1">
            <MetricsPanel 
              statisticsData={statisticsData}
              selectedPeriod={selectedPeriod}
            />
          </div>
          
          {/* Container des graphiques (colonnes de droite) */}
          <div className="xl:col-span-3">
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
    </div>
  );
};

export default StatisticsSubTab;