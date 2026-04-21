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
import {
  qstatsPanel,
  qstatsHeaderRow,
  qstatsAccentBar,
  qstatsMuted,
  qstatsChartGrid,
  qstatsChartTick,
  qstatsChartAxis,
} from './questsStatsTheme';

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
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Statistiques <span className="text-amber-400">QuietQuest</span>
          </h1>
          <p className={`${qstatsMuted} text-sm mt-1`}>
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
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Statistiques <span className="text-amber-400">QuietQuest</span>
          </h1>
          <p className={`${qstatsMuted} text-sm mt-1`}>
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

      {/* Calendrier d'activité — au-dessus des insights, année en cours */}
      {stats.calendarHeatmap && stats.calendarHeatmap.length > 0 && (
        <CalendarHeatmap 
          calendarHeatmap={stats.calendarHeatmap}
          calendarMonthSpans={stats.calendarMonthSpans || []}
          dailyPerformances={stats.filteredPerformances}
        />
      )}

      {/* Insights automatiques — en haut */}
      {stats.insights && stats.insights.length > 0 && (
        <div className={qstatsPanel}>
          <div className={`${qstatsMuted} text-xs mb-2 font-semibold`}>💡 Insights automatiques</div>
          <div className="space-y-2">
            {stats.insights.map((insight, idx) => {
              const getTypeStyles = (type) => {
                switch (type) {
                  case 'success':
                    return 'bg-black border-amber-400/70 text-amber-200';
                  case 'warning':
                    return 'bg-black border-amber-500/55 text-amber-300';
                  case 'info':
                    return 'bg-black border-amber-300/50 text-amber-100';
                  default:
                    return 'bg-black border-amber-500/40 text-amber-100';
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
                        __html: insight.text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-amber-400">$1</strong>'),
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top 10 quêtes + Quêtes à relancer — en haut */}
      {(stats.topQuests.length > 0 || stats.bottomQuests.length > 0) && (
        <TopBottomQuestsTable 
          topQuests={stats.topQuests} 
          bottomQuests={stats.bottomQuests}
        />
      )}

      {/* Graphique moyennes quotidiennes */}
      {stats.filteredPerformances.length > 0 && (
        <DailyAverageChart dailyPerformances={stats.filteredPerformances} />
      )}

      {/* Graphique XP quotidien */}
      {chartData.length > 0 && (
        <div className={qstatsPanel}>
          <div className={qstatsHeaderRow}>
            <div className={qstatsAccentBar} />
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
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                    <stop offset="50%" stopColor="#06b6d4" stopOpacity={0.75} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.35} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={qstatsChartGrid} strokeOpacity={0.45} />
                <XAxis
                  dataKey="date"
                  stroke={qstatsChartAxis}
                  strokeOpacity={0.85}
                  tick={{ fill: qstatsChartTick, fontSize: 11, fontWeight: 500 }}
                  tickFormatter={(value) => formatDateForChart(value, 'short')}
                />
                <YAxis
                  stroke={qstatsChartAxis}
                  strokeOpacity={0.85}
                  tick={{ fill: qstatsChartTick, fontSize: 11, fontWeight: 500 }}
                />
                <Tooltip
                  contentStyle={{
                    background: '#000000',
                    border: '1px solid rgba(251, 191, 36, 0.45)',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    boxShadow: '0 0 16px rgba(245, 158, 11, 0.25)',
                  }}
                  labelStyle={{ color: '#fcd34d', fontSize: 12, fontWeight: 600 }}
                  labelFormatter={(value) => formatDateForChart(value, 'long')}
                />
                <Legend 
                  wrapperStyle={{ color: '#fbbf24', fontSize: '12px' }}
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
                  style={{ filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.55))' }}
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

      {/* Score de performance global — en bas */}
      <PerformanceGaugeChart stats={stats} />

      {/* Taux de complétion par période — en bas */}
      {stats.filteredPerformances.length > 0 && (
        <CompletionRateChart dailyPerformances={stats.filteredPerformances} />
      )}
    </div>
  );
};

export default QuestsStatsView;

