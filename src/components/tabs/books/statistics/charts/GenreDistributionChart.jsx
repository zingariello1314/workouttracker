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

  // Calculer les données de répartition par genre à partir des données déjà agrégées
  const genreData = useMemo(() => {
    const genreDist = statisticsData?.chartData?.genreDistribution;
    if (!genreDist || (!genreDist.pie && !genreDist.bar)) {
      return { distributionData: [], speedData: [] };
    }

    const pie = Array.isArray(genreDist.pie) ? genreDist.pie : [];
    const bar = Array.isArray(genreDist.bar) ? genreDist.bar : [];

    if (pie.length === 0 || bar.length === 0) {
      return { distributionData: [], speedData: [] };
    }

    // Répartition par genre basée sur le TEMPS (minutes) pour coller au texte du tooltip
    const totalMinutes = pie.reduce((sum, g) => sum + (g.minutes || 0), 0);

    const distributionData = pie
      .map((g, index) => ({
        genre: g.genre,
        time: g.minutes || 0,
        percentage: totalMinutes > 0 ? ((g.minutes || 0) / totalMinutes) * 100 : 0,
        pages: g.pages || 0,
        sessions: g.sessions || 0,
        booksCount: g.books || 0,
        color: GENRE_COLORS[index % GENRE_COLORS.length]
      }))
      .sort((a, b) => b.time - a.time);

    // Vitesses par genre : utiliser les données \"bar\" fournies par le transformer
    const minutesByGenre = pie.reduce((acc, g) => {
      acc[g.genre] = g.minutes || 0;
      return acc;
    }, {});

    const sessionsByGenre = pie.reduce((acc, g) => {
      acc[g.genre] = g.sessions || 0;
      return acc;
    }, {});

    const speedData = bar
      .map((item, index) => {
        const totalMinutes = minutesByGenre[item.genre] || 0;
        const sessionCount = sessionsByGenre[item.genre] || 0;
        const avgSessionTime = sessionCount > 0 ? totalMinutes / sessionCount : 0;

        return {
          genre: item.genre,
          speed: item.speed || 0,
          avgSessionTime,
          totalPages: item.pages || 0,
          color: GENRE_COLORS[index % GENRE_COLORS.length]
        };
      })
      .sort((a, b) => b.speed - a.speed);

    return { distributionData, speedData };
  }, [statisticsData]);

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
                formatter={(_, entry) => {
                  const genreLabel = entry?.payload?.genre || '';
                  const pct = entry?.payload?.percentage ?? 0;
                  return (
                    <span style={{ color: entry.color }}>
                      {genreLabel} ({pct.toFixed(1)}%)
                    </span>
                  );
                }}
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

      {/* Détail des livres pour le genre sélectionné */}
      {selectedGenre && (
        <div className="bg-slate-800/40 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-semibold text-slate-200">
            {t(
              'books.statistics.genres.booksForGenre',
              'Livres pour le genre {{genre}}',
              { genre: selectedGenre }
            )}
          </h4>
          {(() => {
            const booksForGenre = books
              .filter((b) => b.genre === selectedGenre)
              .map((book) => {
                const sessions = Array.isArray(book.readingSessions)
                  ? book.readingSessions
                  : [];
                const totalPages = sessions.reduce(
                  (sum, s) => sum + (Number(s.pagesRead) || 0),
                  0
                );
                const totalMinutes = sessions.reduce(
                  (sum, s) => sum + (Number(s.durationMinutes) || 0),
                  0
                );
                const speed =
                  totalMinutes > 0
                    ? (totalPages / (totalMinutes / 60)).toFixed(1)
                    : null;
                const declaredPages = Number(book.pages) || 0;
                const progressPercent =
                  declaredPages > 0
                    ? Math.min(
                        100,
                        Math.round((totalPages / declaredPages) * 100)
                      )
                    : null;

                return {
                  id: book.id,
                  title: book.title,
                  author: book.author,
                  status: book.status,
                  totalPages,
                  totalMinutes,
                  speed,
                  progressPercent,
                  declaredPages,
                };
              })
              .filter((b) => b.totalPages > 0 || b.totalMinutes > 0)
              .sort((a, b) => b.totalPages - a.totalPages);

            if (booksForGenre.length === 0) {
              return (
                <p className="text-sm text-slate-400">
                  {t(
                    'books.statistics.genres.noBooksForGenre',
                    'Aucun livre avec sessions pour ce genre.'
                  )}
                </p>
              );
            }

            return (
              <div className="space-y-2 text-xs text-slate-300">
                <div className="grid grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 pb-1 border-b border-slate-700/60">
                  <div className="font-semibold text-slate-400">
                    {t('books.statistics.genres.table.book', 'Livre')}
                  </div>
                  <div className="font-semibold text-slate-400 text-right">
                    {t('books.statistics.genres.table.pages', 'Pages lues')}
                  </div>
                  <div className="font-semibold text-slate-400 text-right">
                    {t('books.statistics.genres.table.speed', 'Vitesse')}
                  </div>
                  <div className="font-semibold text-slate-400 text-right">
                    {t('books.statistics.genres.table.status', 'Statut')}
                  </div>
                </div>
                {booksForGenre.map((book) => (
                  <div
                    key={book.id}
                    className="grid grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 items-center"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-100 truncate">
                        {book.title || 'Livre sans titre'}
                      </div>
                      {book.author && (
                        <div className="text-slate-400 truncate">
                          {book.author}
                        </div>
                      )}
                      {book.progressPercent != null && (
                        <div className="text-[11px] text-slate-500">
                          {book.progressPercent}% de {book.declaredPages} p.
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      {book.totalPages || 0}
                    </div>
                    <div className="text-right">
                      {book.speed ? `${book.speed} p/h` : '—'}
                    </div>
                    <div className="text-right capitalize">
                      {book.status || 'in-progress'}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default GenreDistributionChart;