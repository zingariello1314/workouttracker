/**
 * Composant DailyAverageChart - Moyennes de quêtes complétées avec moyennes mobiles
 */

import React, { useMemo } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import LazyChart from '../../../BodyTracking/components/LazyChart';
import { formatDateForChart } from '../utils/dateHelpers';
import {
  qstatsPanel,
  qstatsHeaderRow,
  qstatsAccentBar,
  qstatsMuted,
  qstatsChartGrid,
  qstatsChartTick,
  qstatsChartAxis,
} from '../questsStatsTheme';

const DailyAverageTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const date = formatDateForChart(label, 'long');

    return (
      <div className="bg-black border-2 border-amber-400/50 rounded-lg p-3 shadow-2xl z-20">
        <div className="relative">
          <p className="text-amber-300 font-semibold mb-2 text-sm tracking-wide">{date}</p>
          <div className="space-y-1.5">
            {payload.map((entry, index) => (
              <p key={index} className="text-sm">
                <span className={qstatsMuted}>{entry.name}:</span>{' '}
                <span className="font-bold text-amber-200">
                  {entry.value.toFixed(1)}
                </span>
              </p>
            ))}
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const DailyAverageChart = ({ dailyPerformances }) => {
  const chartData = useMemo(() => {
    const sorted = [...dailyPerformances].sort((a, b) => a.date.localeCompare(b.date));

    return sorted.map((perf, index) => {
      const weekStart = Math.max(0, index - 6);
      const weekData = sorted.slice(weekStart, index + 1);
      const weekAvg = weekData.length > 0
        ? weekData.reduce((sum, p) => sum + (p.completedQuests || 0), 0) / weekData.length
        : 0;

      const monthStart = Math.max(0, index - 29);
      const monthData = sorted.slice(monthStart, index + 1);
      const monthAvg = monthData.length > 0
        ? monthData.reduce((sum, p) => sum + (p.completedQuests || 0), 0) / monthData.length
        : 0;

      return {
        date: perf.date,
        completed: perf.completedQuests || 0,
        avg7d: Math.round(weekAvg * 100) / 100,
        avg30d: Math.round(monthAvg * 100) / 100,
      };
    });
  }, [dailyPerformances]);

  if (chartData.length === 0) return null;

  return (
    <div className={qstatsPanel}>
      <div className={qstatsHeaderRow}>
        <div className={qstatsAccentBar} />
        Quêtes complétées par jour avec moyennes mobiles
      </div>
      <LazyChart height={300}>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
            <defs>
              <linearGradient id="barGradientQuestsAvg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.55} />
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
            <Tooltip content={<DailyAverageTooltip />} />
            <Legend
              wrapperStyle={{ color: '#fbbf24', fontSize: '12px' }}
              iconType="rect"
            />
            <Bar
              dataKey="completed"
              name="Quêtes complétées"
              fill="url(#barGradientQuestsAvg)"
              radius={[4, 4, 0, 0]}
              stroke="#9333ea"
              strokeWidth={1}
            />
            <Line
              type="monotone"
              dataKey="avg7d"
              name="Moyenne 7j"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={false}
              strokeDasharray="5 5"
              style={{ filter: 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.55))' }}
            />
            <Line
              type="monotone"
              dataKey="avg30d"
              name="Moyenne 30j"
              stroke="#22c55e"
              strokeWidth={3}
              dot={false}
              style={{ filter: 'drop-shadow(0 0 4px rgba(34, 197, 94, 0.55))' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </LazyChart>
    </div>
  );
};

export default DailyAverageChart;
