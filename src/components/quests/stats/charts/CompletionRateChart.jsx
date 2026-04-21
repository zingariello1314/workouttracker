/**
 * Composant CompletionRateChart - Taux de complétion par période avec comparaison
 */

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import LazyChart from '../../../BodyTracking/components/LazyChart';
import { calculateCompletionRateByPeriod } from '../utils/statsCalculations';
import {
  qstatsPanel,
  qstatsHeaderRow,
  qstatsAccentBar,
  qstatsMuted,
  qstatsChartGrid,
  qstatsChartTick,
  qstatsChartAxis,
} from '../questsStatsTheme';

const CompletionRateTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const current = payload.find(p => p.dataKey === 'current')?.value || 0;
    const previous = payload.find(p => p.dataKey === 'previous')?.value || 0;
    const variation = current - previous;
    const variationPercent = previous > 0 ? Math.round((variation / previous) * 100) : 0;

    return (
      <div className="bg-black border-2 border-amber-400/50 rounded-lg p-3 shadow-2xl z-20">
        <div className="relative">
          <p className="text-amber-300 font-semibold mb-2 text-sm tracking-wide">{label}</p>
          <div className="space-y-1.5">
            <p className="text-sm">
              <span className={qstatsMuted}>Actuelle:</span>{' '}
              <span className="font-bold text-amber-200">{current}%</span>
            </p>
            <p className="text-sm">
              <span className={qstatsMuted}>Précédente:</span>{' '}
              <span className="font-bold text-amber-400/90">{previous}%</span>
            </p>
            {variation !== 0 && (
              <p className={`text-sm mt-2 font-semibold ${variation > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {variation > 0 ? '↑' : '↓'} {Math.abs(variation)}% ({variationPercent > 0 ? '+' : ''}{variationPercent}%)
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const CompletionRateChart = ({ dailyPerformances }) => {
  const chartData = useMemo(() => {
    if (!dailyPerformances || dailyPerformances.length === 0) return [];
    return calculateCompletionRateByPeriod(dailyPerformances);
  }, [dailyPerformances]);

  if (chartData.length === 0) return null;

  return (
    <div className={qstatsPanel}>
      <div className={qstatsHeaderRow}>
        <div className={qstatsAccentBar} />
        Taux de complétion par période (avec comparaison)
      </div>
      <LazyChart height={300}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
            <defs>
              <linearGradient id="currentGradientQuests" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.75} />
              </linearGradient>
              <linearGradient id="previousGradientQuests" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#64748b" stopOpacity={0.85} />
                <stop offset="100%" stopColor="#475569" stopOpacity={0.65} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={qstatsChartGrid} strokeOpacity={0.45} />
            <XAxis
              dataKey="period"
              stroke={qstatsChartAxis}
              strokeOpacity={0.85}
              tick={{ fill: qstatsChartTick, fontSize: 11, fontWeight: 500 }}
            />
            <YAxis
              stroke={qstatsChartAxis}
              strokeOpacity={0.85}
              tick={{ fill: qstatsChartTick, fontSize: 11, fontWeight: 500 }}
              domain={[0, 100]}
            />
            <Tooltip content={<CompletionRateTooltip />} />
            <Legend
              wrapperStyle={{ color: '#fbbf24', fontSize: '12px' }}
              iconType="rect"
            />
            <Bar
              dataKey="current"
              name="Période actuelle"
              fill="url(#currentGradientQuests)"
              radius={[8, 8, 0, 0]}
              stroke="#22d3ee"
              strokeWidth={1}
            />
            <Bar
              dataKey="previous"
              name="Période précédente"
              fill="url(#previousGradientQuests)"
              radius={[8, 8, 0, 0]}
              stroke="#94a3b8"
              strokeWidth={1}
            />
          </BarChart>
        </ResponsiveContainer>
      </LazyChart>
    </div>
  );
};

export default CompletionRateChart;
