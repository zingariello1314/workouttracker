/**
 * GenreDistributionChart Component
 * 
 * Graphique de répartition par genre avec deux vues:
 * 1. Graphique en secteurs (pie chart) montrant la répartition du temps de lecture par genre
 * 2. Graphique en barres comparatif des vitesses de lecture par genre
 * 
 * Features:
 * - Interactivité: click sur secteur pour filtrer les autres graphiques
 * - Tooltips détaillés avec pourcentages et temps
 * - Basculement entre vue répartition et vue vitesses
 * - Couleurs cohérentes pour chaque genre
 * 
 * @see Requirements 5.1, 5.2, 5.3
 */

import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PieChart as PieChartIcon, BarChart3, Clock, BookOpen, Zap } from 'lucide-react';
import Button from '../../../../ui/Button';
import { useTranslation } from '../../../../../utils/translations';

/**
 * Palette de couleurs pour les genres
 */
const GENRE_COLORS = [
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#84CC16', // Lime
  '#F97316', // Orange
  '#8B5A2B', // Brown
  '#6B7280', // Gray
  '#14B8A6'  // Teal
];

/**
 * Types de vues disponibles
 */
const VIEW_TYPES = {
  DISTRIBUTION: 'distribution',
  SPEED_COMPARISON: 'speed-comparison'
};

const GenreDistributionChart = ({ 
  books = [], 
  statisticsData, 
  selectedPeriod, 
  filters,
  onGenreFilter 
}) => {
  const t = useTranslation();
  const [activeView, setActiveView] = useState(VIEW_TYPES.DISTRIBUTION);
  const [selectedGenre, setSelectedGenre] = useState(null);

  // Calculer les données de répartition par genre
  const genreData = useMemo(() => {
    if (!statisticsData?.sessions || statisticsData.sessions.length === 0) {
      return { distributionData: [], speedData: [] };
    }

    // Grouper les sessions par genre de livre
    const genreStats = {};
    
    statisticsData.sessions.forEach(session => {
      const book = books.find(b => b.id === session.bookId);
      if (!book || !book.genre) return;
      
      const genre = book.genre;
      if (!genreStats[genre]) {
        genreStats[genre] = {
          genre,
          totalTime: 0,
          totalPages: 0,
          sessionCount: 0,
          books: new Set()
        };
      }
      
      genreStats[genre].totalTime += session.durationMinutes;
      genreStats[genre].totalPages += session.pagesRead;
      genreStats[genre].sessionCount += 1;
      genreStats[genre].books.add(session.bookId);
    });

    // Convertir en tableaux pour les graphiques
    const genres = Object.values(genreStats);
    const totalTime = genres.reduce((sum, genre) => sum + genre.totalTime, 0);

    // Données pour le graphique en secteurs (répartition du temps)
    const distributionData = genres.map((genre, index) => ({
      genre: genre.genre,
      time: genre.totalTime,
      percentage: totalTime > 0 ? (genre.totalTime / totalTime * 100) : 0,
      pages: genre.totalPages,
      sessions: genre.sessionCount,
      booksCount: genre.books.size,
      color: GENRE_COLORS[index % GENRE_COLORS.length]
    })).sort((a, b) => b.time - a.time);

    // Données pour le graphique en barres (vitesses par genre)
    const speedData = genres.map((genre, index) => ({
      genre: genre.genre,
      speed: genre.totalTime > 0 ? (genre.totalPages / (genre.totalTime / 60)) : 0, // pages/heure
      avgSessionTime: genre.sessionCount > 0 ? (genre.totalTime / genre.sessionCount) : 0,
      totalPages: genre.totalPages,
      color: GENRE_COLORS[index % GENRE_COLORS.length]
    })).sort((a, b) => b.speed - a.speed);

    return { distributionData, speedData };
  }, [books, statisticsData]);

  // Gestionnaire de clic sur un secteur du pie chart
  const handlePieClick = (data) => {
    const genre = data.genre;
    setSelectedGenre(selectedGenre === genre ? null : genre);
    
    // Émettre l'événement de filtrage si une fonction est fournie
    if (onGenreFilter) {
      onGenreFilter(selectedGenre === genre ? '' : genre);
    }
  };

  // Gestionnaire de clic sur une barre du bar chart
  const handleBarClick = (data) => {
    handlePieClick(data);
  };

  // Tooltip personnalisé pour le pie chart
  const PieTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload[0]) return null;
    
    const data = payload[0].payload;
    return (
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
        <div className="font-medium text-white mb-2">{data.genre}</div>
        <div className="space-y-1 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-300 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Temps:
            </span>
            <span className="text-white font-medium">
              {Math.round(data.time)} min ({data.percentage.toFixed(1)}%)
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-300 flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              Pages:
            </span>
            <span className="text-white">{data.pages}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-300">Sessions:</span>
            <span className="text-white">{data.sessions}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-300">Livres:</span>
            <span className="text-white">{data.booksCount}</span>
          </div>
        </div>
        <div className="text-xs text-slate-400 mt-2">
          Cliquer pour filtrer
        </div>
      </div>
    );
  };

  // Tooltip personnalisé pour le bar chart
  const BarTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload[0]) return null;
    
    const data = payload[0].payload;
    return (
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
        <div className="font-medium text-white mb-2">{label}</div>
        <div className="space-y-1 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-300 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Vitesse:
            </span>
            <span className="text-white font-medium">
              {data.speed.toFixed(1)} pages/h
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-300">Session moy.:</span>
            <span className="text-white">{Math.round(data.avgSessionTime)} min</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-300">Total pages:</span>
            <span className="text-white">{data.totalPages}</span>
          </div>
        </div>
        <div className="text-xs text-slate-400 mt-2">
          Cliquer pour filtrer
        </div>
      </div>
    );
  };

  // Vérifier si nous avons des données
  const hasData = genreData.distributionData.length > 0;

  if (!hasData) {
    return (
      <div className="text-center py-12">
        <PieChartIcon className="w-16 h-16 text-slate-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-300 mb-2">
          {t('books.statistics.genres.noData.title', 'Aucune donnée par genre')}
        </h3>
        <p className="text-slate-400">
          {t('books.statistics.genres.noData.description', 
            'Assure-toi que tes livres ont des genres définis pour voir cette analyse.')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Contrôles de vue */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={activeView === VIEW_TYPES.DISTRIBUTION ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveView(VIEW_TYPES.DISTRIBUTION)}
            className="flex items-center gap-2"
          >
            <PieChartIcon className="w-4 h-4" />
            {t('books.statistics.genres.distribution', 'Répartition')}
          </Button>
          <Button
            variant={activeView === VIEW_TYPES.SPEED_COMPARISON ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveView(VIEW_TYPES.SPEED_COMPARISON)}
            className="flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            {t('books.statistics.genres.speeds', 'Vitesses')}
          </Button>
        </div>
        
        {selectedGenre && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedGenre(null);
              if (onGenreFilter) onGenreFilter('');
            }}
            className="text-slate-400 hover:text-white"
          >
            Effacer le filtre: {selectedGenre}
          </Button>
        )}
      </div>

      {/* Graphique principal */}
      <div className="h-96">
        {activeView === VIEW_TYPES.DISTRIBUTION ? (
          // Vue répartition - Pie Chart
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={genreData.distributionData}
                cx="50%"
                cy="50%"
                outerRadius={120}
                innerRadius={40}
                paddingAngle={2}
                dataKey="time"
                onClick={handlePieClick}
                className="cursor-pointer"
              >
                {genreData.distributionData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    stroke={selectedGenre === entry.genre ? '#ffffff' : 'transparent'}
                    strokeWidth={selectedGenre === entry.genre ? 2 : 0}
                    opacity={selectedGenre && selectedGenre !== entry.genre ? 0.3 : 1}
                  />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry) => (
                  <span style={{ color: entry.color }}>
                    {value} ({entry.payload.percentage.toFixed(1)}%)
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          // Vue vitesses - Bar Chart
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={genreData.speedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="genre" 
                stroke="#9CA3AF"
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis 
                stroke="#9CA3AF"
                label={{ 
                  value: 'Pages/heure', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fill: '#9CA3AF' }
                }}
              />
              <Tooltip content={<BarTooltip />} />
              <Bar 
                dataKey="speed" 
                onClick={handleBarClick}
                className="cursor-pointer"
              >
                {genreData.speedData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    stroke={selectedGenre === entry.genre ? '#ffffff' : 'transparent'}
                    strokeWidth={selectedGenre === entry.genre ? 2 : 0}
                    opacity={selectedGenre && selectedGenre !== entry.genre ? 0.3 : 1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Résumé statistique */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-300">
            {genreData.distributionData.length}
          </div>
          <div className="text-sm text-slate-400">
            {t('books.statistics.genres.summary.genres', 'Genres lus')}
          </div>
        </div>
        
        <div className="bg-slate-800/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-cyan-300">
            {genreData.distributionData[0]?.genre || '-'}
          </div>
          <div className="text-sm text-slate-400">
            {t('books.statistics.genres.summary.favorite', 'Genre favori')}
          </div>
        </div>
        
        <div className="bg-slate-800/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-emerald-300">
            {genreData.speedData[0]?.speed.toFixed(1) || '0'} p/h
          </div>
          <div className="text-sm text-slate-400">
            {t('books.statistics.genres.summary.fastestGenre', 'Plus rapide')}
          </div>
        </div>
        
        <div className="bg-slate-800/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-amber-300">
            {Math.round(genreData.distributionData.reduce((sum, g) => sum + g.time, 0) / genreData.distributionData.length) || 0} min
          </div>
          <div className="text-sm text-slate-400">
            {t('books.statistics.genres.summary.avgTime', 'Temps moy./genre')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenreDistributionChart;