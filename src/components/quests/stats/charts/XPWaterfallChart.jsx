/**
 * Composant XPWaterfallChart - Contribution XP par période
 */

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
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

const WaterfallTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;

    return (
      <div className="bg-black border-2 border-amber-400/50 rounded-lg p-3 shadow-2xl z-20">
        <div className="relative">
          <p className="text-amber-300 font-semibold mb-2 text-sm tracking-wide">{data.period}</p>
          <div className="space-y-1.5">
            <p className="text-sm">
              <span className={qstatsMuted}>XP gagné:</span>{' '}
              <span className="font-bold text-amber-200">{data.xpGained.toLocaleString('fr-FR')} XP</span>
            </p>
            {data.change !== undefined && (
              <p className="text-sm">
                <span className={qstatsMuted}>Variation:</span>{' '}
                <span className={`font-bold ${data.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {data.change >= 0 ? '+' : ''}{data.change.toLocaleString('fr-FR')} XP
                </span>
              </p>
            )}
            <p className="text-sm">
              <span className={qstatsMuted}>Total cumulé:</span>{' '}
              <span className="font-bold text-amber-300">{data.cumulative.toLocaleString('fr-FR')} XP</span>
            </p>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const XPWaterfallChart = ({ dailyPerformances, selectedPeriod }) => {
  const waterfallData = useMemo(() => {
    if (!dailyPerformances || dailyPerformances.length === 0) return [];

    const periodMap = new Map();

    dailyPerformances.forEach(perf => {
      const date = new Date(perf.date);
      let periodKey;
      let periodLabel;

      if (selectedPeriod === '7d' || selectedPeriod === '30d') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        periodKey = weekStart.toISOString().split('T')[0];
        periodLabel = `Sem. ${formatDateForChart(periodKey, 'short')}`;
      } else {
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        periodLabel = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
      }

      if (!periodMap.has(periodKey)) {
        periodMap.set(periodKey, {
          period: periodLabel,
          xpGained: 0,
        });
      }

      periodMap.get(periodKey).xpGained += perf.xpTotal || 0;
    });

    const periods = Array.from(periodMap.values())
      .sort((a, b) => a.period.localeCompare(b.period));

    let cumulative = 0;
    return periods.map((period, index) => {
      const previousXP = index > 0 ? periods[index - 1].xpGained : 0;
      const change = period.xpGained - previousXP;
      cumulative += period.xpGained;

      return {
        ...period,
        change,
        cumulative,
        startValue: cumulative - period.xpGained,
        endValue: cumulative,
      };
    });
  }, [dailyPerformances, selectedPeriod]);

  if (waterfallData.length === 0) return null;

  const getColor = (change) => {
    if (change > 0) return '#10b981';
    if (change < 0) return '#ef4444';
    return '#64748b';
  };

  return (
    <div className={qstatsPanel}>
      <div className={qstatsHeaderRow}>
        <div className={qstatsAccentBar} />
        Contribution XP par période
      </div>
      <LazyChart height={350}>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={waterfallData}
            margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
          >
            <defs>
              <linearGradient id="waterfallPositiveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#059669" stopOpacity={0.65} />
              </linearGradient>
              <linearGradient id="waterfallNegativeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#dc2626" stopOpacity={0.65} />
              </linearGradient>
              <linearGradient id="waterfallNeutralGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#64748b" stopOpacity={0.9} />
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
            />
            <Tooltip content={<WaterfallTooltip />} />
            <Legend
              wrapperStyle={{ color: '#fbbf24', fontSize: '12px' }}
              iconType="rect"
            />
            <Bar
              dataKey="xpGained"
              name="XP gagné"
              radius={[4, 4, 0, 0]}
              barSize={30}
            >
              {waterfallData.map((entry, index) => {
                const gradientId = entry.change > 0
                  ? 'waterfallPositiveGradient'
                  : entry.change < 0
                    ? 'waterfallNegativeGradient'
                    : 'waterfallNeutralGradient';

                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={`url(#${gradientId})`}
                    style={{
                      filter: `drop-shadow(0 0 6px ${getColor(entry.change)}70)`,
                    }}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </LazyChart>
    </div>
  );
};

export default XPWaterfallChart;
