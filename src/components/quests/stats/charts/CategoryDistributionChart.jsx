/**
 * Composant CategoryDistributionChart - Top 5 et Bottom 5 catégories
 */

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import LazyChart from '../../../BodyTracking/components/LazyChart';
import {
  qstatsPanel,
  qstatsHeaderRow,
  qstatsAccentBar,
  qstatsMuted,
  qstatsChartGrid,
  qstatsChartTick,
  qstatsChartAxis,
} from '../questsStatsTheme';

const CategoryTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;

    return (
      <div className="bg-black border-2 border-amber-400/50 rounded-lg p-3 shadow-2xl z-20">
        <div className="relative">
          <p className="text-amber-300 font-semibold mb-2 text-sm tracking-wide">{label}</p>
          <div className="space-y-1.5">
            <p className="text-sm">
              <span className={qstatsMuted}>Quêtes:</span>{' '}
              <span className="font-bold text-amber-100">{data.questsCount}</span>
            </p>
            <p className="text-sm">
              <span className={qstatsMuted}>Validations:</span>{' '}
              <span className="font-bold text-amber-300">{data.validationsCount}</span>
            </p>
            <p className="text-sm">
              <span className={qstatsMuted}>XP total:</span>{' '}
              <span className="font-bold text-amber-200">{data.xpTotal.toLocaleString('fr-FR')} XP</span>
            </p>
            <p className="text-sm">
              <span className={qstatsMuted}>Taux de réussite:</span>{' '}
              <span className="font-bold text-yellow-300">{data.completionRate}%</span>
            </p>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const CategoryDistributionChart = ({ categoryStats }) => {
  const { topCategories, bottomCategories } = useMemo(() => {
    const sorted = [...categoryStats].sort((a, b) => b.validationsCount - a.validationsCount);

    return {
      topCategories: sorted.slice(0, 5),
      bottomCategories: sorted.slice(-5).reverse(),
    };
  }, [categoryStats]);

  const getColor = (completionRate) => {
    if (completionRate >= 70) return '#10b981';
    if (completionRate >= 50) return '#06b6d4';
    if (completionRate >= 30) return '#f59e0b';
    return '#ef4444';
  };

  const getGradientId = (completionRate, index, prefix = 'top') =>
    `gradient-qc-${prefix}-${index}-${Math.round(completionRate)}`;

  const barPanel = (title, data, prefix) => (
    <div className={qstatsPanel}>
      <div className={qstatsHeaderRow}>
        <div className={qstatsAccentBar} />
        {title}
      </div>
      <LazyChart height={250}>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 10, right: 20, left: 60, bottom: 20 }}
          >
            <defs>
              {data.map((entry, index) => {
                const gradientId = getGradientId(entry.completionRate, index, prefix);
                const baseColor = getColor(entry.completionRate);
                return (
                  <linearGradient key={gradientId} id={gradientId} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={baseColor} stopOpacity={0.95} />
                    <stop offset="100%" stopColor={baseColor} stopOpacity={0.45} />
                  </linearGradient>
                );
              })}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={qstatsChartGrid} strokeOpacity={0.45} />
            <XAxis
              type="number"
              stroke={qstatsChartAxis}
              strokeOpacity={0.85}
              tick={{ fill: qstatsChartTick, fontSize: 11, fontWeight: 500 }}
            />
            <YAxis
              type="category"
              dataKey="category"
              stroke={qstatsChartAxis}
              strokeOpacity={0.85}
              tick={{ fill: qstatsChartTick, fontSize: 11, fontWeight: 500 }}
              width={50}
            />
            <Tooltip content={<CategoryTooltip />} />
            <Bar dataKey="validationsCount" name="Validations" radius={[0, 8, 8, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${prefix}-${index}`}
                  fill={`url(#${getGradientId(entry.completionRate, index, prefix)})`}
                  stroke={getColor(entry.completionRate)}
                  strokeWidth={1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </LazyChart>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {barPanel('🏆 Top 5 Catégories', topCategories, 'top')}
      {barPanel('📉 Catégories à améliorer', bottomCategories, 'bottom')}
    </div>
  );
};

export default CategoryDistributionChart;
