/**
 * PagesPerDayChart Component
 * 
 * Graphique en ligne affichant l'évolution des pages lues par jour.
 * Utilise Recharts pour l'interactivité et supporte les tooltips détaillés.
 * 
 * @see Requirements 2.1, 2.3, 2.5
 */

import React, { useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { Calendar, BookOpen } from 'lucide-react';
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
          <BookOpen className="w-4 h-4 text-purple-300" />
          <span className="text-slate-300">
            {data.pages} {t('books.statistics.pages', 'pages lues')}
          </span>
        </div>
        {data.sessions > 0 && (
          <div className="text-slate-400 text-xs">
            {data.sessions} session(s) • {data.totalMinutes} minutes
          </div>
        )}
        {data.books && data.books.length > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-600">
            <p className="text-xs text-slate-400 mb-1">Livres lus:</p>
            {data.books.slice(0, 3).map((book, index) => (
              <p key={index} className="text-xs text-slate-300">
                • {book.title} ({book.pagesRead}p)
              </p>
            ))}
            {data.books.length > 3 && (
              <p className="text-xs text-slate-400">
                ... et {data.books.length - 3} autre(s)
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const PagesPerDayChart = ({ books, statisticsData, selectedPeriod, filters }) => {
  const t = useTranslation();

  // Transformer les données pour le graphique
  const chartData = useMemo(() => {
    if (!statisticsData?.chartData?.pagesPerDay) {
      return [];
    }

    return statisticsData.chartData.pagesPerDay.map(dayData => ({
      date: dayData.date,
      pages: dayData.pages,
      sessions: dayData.sessions,
      totalMinutes: dayData.totalMinutes,
      books: dayData.books || []
    }));
  }, [statisticsData]);

  // Calculer la moyenne pour la ligne de référence
  const averagePages = useMemo(() => {
    if (chartData.length === 0) return 0;
    const totalPages = chartData.reduce((sum, day) => sum + day.pages, 0);
    return totalPages / chartData.length;
  }, [chartData]);

  // Vérifier s'il y a des données à afficher
  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Calendar className="w-16 h-16 text-slate-500 mb-4" />
        <h3 className="text-lg font-semibold text-slate-300 mb-2">
          {t('books.statistics.charts.pagesPerDay.noData.title', 'Aucune donnée disponible')}
        </h3>
        <p className="text-slate-400 max-w-md">
          {t('books.statistics.charts.pagesPerDay.noData.description', 
            'Enregistre des sessions de lecture pour voir l\'évolution de tes pages lues quotidiennement.')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-2xl font-bold text-white">
            {chartData.reduce((sum, day) => sum + day.pages, 0)}
          </div>
          <div className="text-xs text-slate-400">Pages totales</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-2xl font-bold text-white">
            {averagePages.toFixed(1)}
          </div>
          <div className="text-xs text-slate-400">Moyenne/jour</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-2xl font-bold text-white">
            {Math.max(...chartData.map(d => d.pages))}
          </div>
          <div className="text-xs text-slate-400">Maximum</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-2xl font-bold text-white">
            {chartData.filter(d => d.pages > 0).length}
          </div>
          <div className="text-xs text-slate-400">Jours actifs</div>
        </div>
      </div>

      {/* Graphique principal */}
      <div className="h-80">
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
                value: 'Pages', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle', fill: '#9CA3AF' }
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Ligne de moyenne */}
            {averagePages > 0 && (
              <ReferenceLine 
                y={averagePages} 
                stroke="#F59E0B" 
                strokeDasharray="5 5"
                label={{ 
                  value: `Moyenne: ${averagePages.toFixed(1)}p`, 
                  position: 'topRight',
                  fill: '#F59E0B',
                  fontSize: 12
                }}
              />
            )}
            
            {/* Ligne principale */}
            <Line 
              type="monotone" 
              dataKey="pages" 
              stroke="#8B5CF6" 
              strokeWidth={2}
              dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#8B5CF6', strokeWidth: 2, fill: '#FFFFFF' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Légende et informations */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-purple-400"></div>
            <span>Pages lues</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-yellow-400 border-dashed"></div>
            <span>Moyenne</span>
          </div>
        </div>
        <div className="text-xs">
          Période: {selectedPeriod === 'all' ? 'Toutes les données' : `Derniers ${selectedPeriod}`}
        </div>
      </div>
    </div>
  );
};

export default PagesPerDayChart;