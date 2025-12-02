/**
 * Composant QuestsStatsView - Vue principale des statistiques QuietQuest
 * Remplace renderStatsView dans QuestsTab.jsx
 */

import React, { useState, useMemo } from 'react';
import { useQuietQuestStats } from '../../../hooks/useQuietQuestStats';
import { useQuietQuestEngine } from '../../../hooks/useQuietQuestEngine';
import KPICards from './components/KPICards';
import PeriodSelector from './components/PeriodSelector';
import CompletionRateChart from './charts/CompletionRateChart';
import DailyAverageChart from './charts/DailyAverageChart';
import CategoryDistributionChart from './charts/CategoryDistributionChart';
import DifficultyAnalysisChart from './charts/DifficultyAnalysisChart';
import CalendarHeatmap from './charts/CalendarHeatmap';
import TopBottomQuestsTable from './charts/TopBottomQuestsTable';
import ActivityRadarChart from './charts/ActivityRadarChart';
import CumulativeXPAreaChart from './charts/CumulativeXPAreaChart';
import PerformanceGaugeChart from './charts/PerformanceGaugeChart';
import DifficultyXPScatterChart from './charts/DifficultyXPScatterChart';
import CategoryTreemapChart from './charts/CategoryTreemapChart';
import CompletionFunnelChart from './charts/CompletionFunnelChart';
import ValidationTimelineChart from './charts/ValidationTimelineChart';
import CategorySankeyChart from './charts/CategorySankeyChart';
import QuestSunburstChart from './charts/QuestSunburstChart';
import XPWaterfallChart from './charts/XPWaterfallChart';
import LazyChart from '../../../components/BodyTracking/components/LazyChart';
import {
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { formatDateForChart } from './utils/dateHelpers';

const QuestsStatsView = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const stats = useQuietQuestStats(selectedPeriod);
  const { allQuests, validations, userData } = useQuietQuestEngine();

  // Données pour graphique XP quotidien (memoized)
  const chartData = useMemo(() => {
    return stats.filteredPerformances
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({
        date: d.date,
        xpTotal: d.xpTotal || 0,
        successRate: d.successRate || 0,
      }));
  }, [stats.filteredPerformances]);

  // Placeholder si pas de données
  if (stats.filteredPerformances.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100">
            Statistiques <span className="text-emerald-400">QuietQuest</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Aucune donnée dans la période sélectionnée. Essaie une période plus large ou coche de nouvelles quêtes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header avec sélecteur de période */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100">
            Statistiques <span className="text-emerald-400">QuietQuest</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Résumé de ton XP gagné, de tes streaks et de ta constance au fil du temps.
          </p>
        </div>
        <PeriodSelector 
          selectedPeriod={selectedPeriod} 
          onPeriodChange={setSelectedPeriod} 
        />
      </div>

      {/* KPIs */}
      <KPICards stats={stats} />

      {/* Score de performance global */}
      <PerformanceGaugeChart stats={stats} />

      {/* Graphique taux de complétion par période */}
      {stats.filteredPerformances.length > 0 && (
        <CompletionRateChart dailyPerformances={stats.filteredPerformances} />
      )}

      {/* Graphique moyennes quotidiennes */}
      {stats.filteredPerformances.length > 0 && (
        <DailyAverageChart dailyPerformances={stats.filteredPerformances} />
      )}

      {/* Graphique XP quotidien */}
      {chartData.length > 0 && (
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-900/90 via-slate-800/50 to-slate-900/90 px-4 py-3 shadow-xl shadow-emerald-500/10 backdrop-blur-sm">
          <div className="text-xs text-emerald-300 mb-3 font-semibold tracking-wide flex items-center gap-2">
            <div className="w-1 h-4 bg-gradient-to-b from-emerald-400 to-cyan-500 rounded-full"></div>
            XP quotidien (toutes quêtes confondues)
          </div>
          <LazyChart height={260}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="xpLineGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="50%" stopColor="#06b6d4" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" strokeOpacity={0.3} />
                <XAxis
                  dataKey="date"
                  stroke="#10b981"
                  strokeOpacity={0.5}
                  tick={{ fill: '#34d399', fontSize: 11, fontWeight: 500 }}
                  tickFormatter={(value) => formatDateForChart(value, 'short')}
                />
                <YAxis
                  stroke="#10b981"
                  strokeOpacity={0.5}
                  tick={{ fill: '#34d399', fontSize: 11, fontWeight: 500 }}
                />
                <Tooltip
                  contentStyle={{
                    background: 'linear-gradient(to bottom right, #0f172a, #1e293b)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)',
                  }}
                  labelStyle={{ color: '#34d399', fontSize: 12, fontWeight: 600 }}
                  labelFormatter={(value) => formatDateForChart(value, 'long')}
                />
                <Legend 
                  wrapperStyle={{ color: '#34d399', fontSize: '12px' }}
                  iconType="line"
                />
                <Line
                  type="monotone"
                  dataKey="xpTotal"
                  stroke="url(#xpLineGradient)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10b981', stroke: '#34d399', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#34d399', stroke: '#10b981', strokeWidth: 2 }}
                  name="XP gagné"
                  style={{ filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </LazyChart>
        </div>
      )}

      {/* RadarChart - Profil d'activité */}
      {stats.categoryStats && stats.categoryStats.length > 0 && (
        <ActivityRadarChart 
          categoryStats={stats.categoryStats}
          validations={validations}
          allQuests={allQuests}
        />
      )}

      {/* Graphiques catégories */}
      {stats.categoryStats && stats.categoryStats.length > 0 && (
        <CategoryDistributionChart categoryStats={stats.categoryStats} />
      )}

      {/* AreaChart - XP cumulé */}
      {stats.filteredPerformances.length > 0 && (
        <CumulativeXPAreaChart 
          dailyPerformances={stats.filteredPerformances}
          validations={validations}
          allQuests={allQuests}
        />
      )}

      {/* WaterfallChart - Contribution XP par période */}
      {stats.filteredPerformances.length > 0 && (
        <XPWaterfallChart 
          dailyPerformances={stats.filteredPerformances}
          selectedPeriod={selectedPeriod}
        />
      )}

      {/* ScatterChart - Corrélation Difficulté vs XP */}
      {validations.length > 0 && (
        <DifficultyXPScatterChart 
          validations={validations}
          allQuests={allQuests}
        />
      )}

      {/* Treemap - Répartition catégories */}
      {stats.categoryStats && stats.categoryStats.length > 0 && (
        <CategoryTreemapChart categoryStats={stats.categoryStats} />
      )}

      {/* FunnelChart - Funnel de complétion */}
      {allQuests.length > 0 && (
        <CompletionFunnelChart 
          allQuests={allQuests}
          validations={validations}
        />
      )}

      {/* TimelineChart - Timeline des validations */}
      {validations.length > 0 && (
        <ValidationTimelineChart 
          validations={validations}
          dailyPerformances={stats.filteredPerformances}
          userData={userData}
        />
      )}

      {/* SankeyChart - Flux XP entre catégories */}
      {validations.length > 0 && (
        <CategorySankeyChart 
          validations={validations}
          allQuests={allQuests}
          selectedPeriod={selectedPeriod}
        />
      )}

      {/* SunburstChart - Hiérarchie complète */}
      {allQuests.length > 0 && (
        <QuestSunburstChart 
          allQuests={allQuests}
          validations={validations}
        />
      )}

      {/* Graphiques difficulté */}
      {stats.difficultyStats && stats.difficultyStats.length > 0 && (
        <DifficultyAnalysisChart difficultyStats={stats.difficultyStats} />
      )}

      {/* Heatmap calendrier */}
      {stats.calendarHeatmap && stats.calendarHeatmap.length > 0 && (
        <CalendarHeatmap 
          calendarHeatmap={stats.calendarHeatmap} 
          dailyPerformances={stats.filteredPerformances}
        />
      )}

      {/* Top/Bottom quêtes */}
      {(stats.topQuests.length > 0 || stats.bottomQuests.length > 0) && (
        <TopBottomQuestsTable 
          topQuests={stats.topQuests} 
          bottomQuests={stats.bottomQuests}
        />
      )}

      {/* Insights */}
      {stats.insights && stats.insights.length > 0 && (
        <div className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3">
          <div className="text-xs text-slate-400 mb-2 font-semibold">💡 Insights automatiques</div>
          <div className="space-y-2">
            {stats.insights.map((insight, idx) => {
              const getTypeStyles = (type) => {
                switch (type) {
                  case 'success':
                    return 'bg-emerald-900/30 border-emerald-700 text-emerald-200';
                  case 'warning':
                    return 'bg-amber-900/30 border-amber-700 text-amber-200';
                  case 'info':
                    return 'bg-blue-900/30 border-blue-700 text-blue-200';
                  default:
                    return 'bg-slate-800/50 border-slate-700 text-slate-200';
                }
              };

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border ${getTypeStyles(insight.type)}`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg">{insight.icon}</span>
                    <p
                      className="text-sm leading-relaxed flex-1"
                      dangerouslySetInnerHTML={{
                        __html: insight.text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-emerald-300">$1</strong>'),
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestsStatsView;

