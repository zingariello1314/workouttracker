/**
 * ReadingSpeedChart Component
 * 
 * Graphique affichant l'évolution de la vitesse de lecture dans le temps.
 * Permet de filtrer par genre et compare avec les objectifs.
 * 
 * @see Requirements 3.1, 3.3, 3.4, 3.5
 */

import React, { useMemo, useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from 'recharts';
import { TrendingUp, Filter, Target, BookOpen } from 'lucide-react';
import { useTranslation } from '../../../../../utils/translations';

// Utilitaire pour formater les dates
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', { 
    day: '2-digit', 
    month: '2-digit' 
  });
};

// Utilitaire pour formater les dates complètes
const formatFullDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', { 
    weekday: 'long',
    day: 'numeric', 
    month: 'long',
    year: 'numeric'
  });
};

// Composant de tooltip personnalisé
const CustomTooltip = ({ active, payload, label }) => {
  const t = useTranslation();
  
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0].payload;
  
  return (
    <div className="bg-slate-800/95 border border-slate-600 rounded-lg p-3 shadow-lg">
      <p className="font-semibold text-white mb-2">
        {formatFullDate(label)}
      </p>
      <div className="space-y-1 text-sm">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-300" />
          <span className="text-slate-300">
            {data.speed.toFixed(1)} {t('books.statistics.pagesPerHour', 'pages/heure')}
          </span>
        </div>
        {data.genre && (
          <div className="text-slate-400 text-xs">
            Genre: {data.genre}
          </div>
        )}
        <div className="text-slate-400 text-xs">
          {data.totalPages} pages • {data.totalMinutes} minutes
        </div>
        {data.sessions > 1 && (
          <div className="text-slate-400 text-xs">
            {data.sessions} sessions de lecture
          </div>
        )}
      </div>
    </div>
  );
};

// Composant de filtre par genre
const GenreFilter = ({ genres, selectedGenre, onGenreChange }) => {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Filter className="w-4 h-4 text-slate-400" />
      <select 
        value={selectedGenre} 
        onChange={(e) => onGenreChange(e.target.value)}
        className="bg-slate-800 border border-slate-600 rounded px-3 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
      >
        <option value="">Tous les genres</option>
        {genres.map(genre => (
          <option key={genre} value={genre}>{genre}</option>
        ))}
      </select>
    </div>
  );
};

const ReadingSpeedChart = ({ books, statisticsData, selectedPeriod, filters }) => {
  const t = useTranslation();
  const [selectedGenre, setSelectedGenre] = useState('');

  // Extraire les données de vitesse et les genres disponibles
  const { chartData, genres, averageSpeed, goalSpeed } = useMemo(() => {
    if (!statisticsData?.chartData?.readingSpeed?.evolution) {
      return { chartData: [], genres: [], averageSpeed: 0, goalSpeed: 0 };
    }

    const speedData = statisticsData.chartData.readingSpeed.evolution;
    const genreData = statisticsData.chartData.readingSpeed.byGenre || [];
    const availableGenres = genreData.map(g => g.genre).filter(Boolean);
    
    // Filtrer par genre si sélectionné
    const filteredData = selectedGenre 
      ? speedData.filter(d => d.genre === selectedGenre)
      : speedData;

    // Calculer la vitesse moyenne
    const totalSpeed = filteredData.reduce((sum, d) => sum + d.speed, 0);
    const avgSpeed = filteredData.length > 0 ? totalSpeed / filteredData.length : 0;

    // Objectif de vitesse (peut être configuré par l'utilisateur)
    const userGoalSpeed = statisticsData.goals?.readingSpeed || 30; // 30 pages/heure par défaut

    return {
      chartData: filteredData,
      genres: availableGenres,
      averageSpeed: avgSpeed,
      goalSpeed: userGoalSpeed
    };
  }, [statisticsData, selectedGenre]);

  // Calculer les statistiques de performance
  const performanceStats = useMemo(() => {
    if (chartData.length === 0) return null;

    const speeds = chartData.map(d => d.speed);
    const maxSpeed = Math.max(...speeds);
    const minSpeed = Math.min(...speeds);
    const trend = chartData.length > 1 
      ? chartData[chartData.length - 1].speed - chartData[0].speed 
      : 0;

    return {
      max: maxSpeed,
      min: minSpeed,
      trend: trend,
      improvement: trend > 0,
      goalAchievement: (chartData.filter(d => d.speed >= goalSpeed).length / chartData.length) * 100
    };
  }, [chartData, goalSpeed]);

  // Vérifier s'il y a des données à afficher
  if (!chartData || chartData.length === 0) {
    return (
      <div className="space-y-4">
        {genres.length > 0 && (
          <GenreFilter 
            genres={genres} 
            selectedGenre={selectedGenre} 
            onGenreChange={setSelectedGenre} 
          />
        )}
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <TrendingUp className="w-16 h-16 text-slate-500 mb-4" />
          <h3 className="text-lg font-semibold text-slate-300 mb-2">
            {selectedGenre 
              ? `Aucune donnée pour le genre "${selectedGenre}"`
              : t('books.statistics.charts.readingSpeed.noData.title', 'Aucune donnée de vitesse disponible')
            }
          </h3>
          <p className="text-slate-400 max-w-md">
            {t('books.statistics.charts.readingSpeed.noData.description', 
              'Enregistre des sessions de lecture avec durée pour voir l\'évolution de ta vitesse de lecture.')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtre par genre */}
      {genres.length > 0 && (
        <GenreFilter 
          genres={genres} 
          selectedGenre={selectedGenre} 
          onGenreChange={setSelectedGenre} 
        />
      )}

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-2xl font-bold text-white">
            {averageSpeed.toFixed(1)}
          </div>
          <div className="text-xs text-slate-400">Vitesse moyenne</div>
          <div className="text-xs text-slate-500">pages/heure</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-2xl font-bold text-white">
            {performanceStats?.max.toFixed(1)}
          </div>
          <div className="text-xs text-slate-400">Maximum</div>
          <div className="text-xs text-slate-500">pages/heure</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className={`text-2xl font-bold ${performanceStats?.improvement ? 'text-sky-300' : 'text-red-400'}`}>
            {performanceStats?.improvement ? '+' : ''}{performanceStats?.trend.toFixed(1)}
          </div>
          <div className="text-xs text-slate-400">Évolution</div>
          <div className="text-xs text-slate-500">depuis le début</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-2xl font-bold text-white">
            {performanceStats?.goalAchievement.toFixed(0)}%
          </div>
          <div className="text-xs text-slate-400">Objectif atteint</div>
          <div className="text-xs text-slate-500">{goalSpeed}p/h</div>
        </div>
      </div>

      {/* Graphique principal */}
      <div className="h-80 min-h-80">
        {chartData.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              stroke="#9CA3AF"
              fontSize={12}
            />
            <YAxis 
              stroke="#9CA3AF"
              fontSize={12}
              label={{ 
                value: 'Pages/heure', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle', fill: '#9CA3AF' }
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* Ligne d'objectif */}
            {goalSpeed > 0 && (
              <ReferenceLine 
                y={goalSpeed} 
                stroke="#3A86FF" 
                strokeDasharray="5 5"
                label={{ 
                  value: `Objectif: ${goalSpeed}p/h`, 
                  position: 'topRight',
                  fill: '#93c5fd',
                  fontSize: 12
                }}
              />
            )}
            
            {/* Ligne de moyenne */}
            {averageSpeed > 0 && (
              <ReferenceLine 
                y={averageSpeed} 
                stroke="#F59E0B" 
                strokeDasharray="3 3"
                label={{ 
                  value: `Moyenne: ${averageSpeed.toFixed(1)}p/h`, 
                  position: 'topLeft',
                  fill: '#F59E0B',
                  fontSize: 12
                }}
              />
            )}
            
            {/* Ligne principale */}
            <Line 
              type="monotone" 
              dataKey="speed" 
              stroke="#3B82F6" 
              strokeWidth={2}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2, fill: '#FFFFFF' }}
              name="Vitesse de lecture"
            />
          </LineChart>
        </ResponsiveContainer>
        )}
      </div>

      {/* Analyse et recommandations */}
      {performanceStats && (
        <div className="bg-slate-800/30 rounded-lg p-4">
          <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Analyse de performance
          </h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-300 mb-2">
                <span className="font-medium">Tendance:</span> 
                <span className={`ml-2 ${performanceStats.improvement ? 'text-sky-300' : 'text-red-400'}`}>
                  {performanceStats.improvement ? 'En amélioration' : 'En baisse'}
                </span>
              </p>
              <p className="text-slate-300">
                <span className="font-medium">Écart min-max:</span> 
                <span className="ml-2 text-blue-400">
                  {(performanceStats.max - performanceStats.min).toFixed(1)} pages/heure
                </span>
              </p>
            </div>
            <div>
              <p className="text-slate-300 mb-2">
                <span className="font-medium">Objectif atteint:</span> 
                <span className={`ml-2 ${performanceStats.goalAchievement >= 70 ? 'text-sky-300' : 'text-amber-300'}`}>
                  {performanceStats.goalAchievement.toFixed(0)}% du temps
                </span>
              </p>
              {selectedGenre && (
                <p className="text-slate-400 text-xs">
                  Données filtrées pour: {selectedGenre}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Légende et informations */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-blue-400"></div>
            <span>Vitesse de lecture</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-[#3A86FF] border-dashed"></div>
            <span>Objectif</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-yellow-400 border-dashed"></div>
            <span>Moyenne</span>
          </div>
        </div>
        <div className="text-xs">
          {selectedGenre ? `Genre: ${selectedGenre}` : 'Tous genres'} • 
          Période: {selectedPeriod === 'all' ? 'Toutes les données' : /^\d{4}$/.test(selectedPeriod) ? `Année ${selectedPeriod}` : `Derniers ${selectedPeriod}`}
        </div>
      </div>
    </div>
  );
};

export default ReadingSpeedChart;