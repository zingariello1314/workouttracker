/**
 * Composant CumulativeXPAreaChart - Évolution XP cumulé avec zones empilées
 */

import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
  qstatsCategoryChartColors,
} from '../questsStatsTheme';

const CATEGORIES = ['Santé', 'Travail', 'Apprentissage', 'Lecture', 'Sport', 'Ménage', 'Spirituel', 'Repas', 'Projets', 'Hobby', 'Social', 'Finance', 'Créativité', 'Bien-être'];

const categoryColors = Object.fromEntries(
  CATEGORIES.map((c) => [c, qstatsCategoryChartColors[c] || { from: '#f59e0b', to: '#fbbf24' }])
);

const CumulativeXPTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const date = formatDateForChart(label, 'long');
    const total = payload.reduce((sum, entry) => sum + (entry.value || 0), 0);

    return (
      <div className="bg-black border-2 border-amber-400/50 rounded-lg p-3 shadow-2xl z-20">
        <div className="relative">
          <p className="text-amber-300 font-semibold mb-2 text-sm tracking-wide">{date}</p>
          <p className="text-sm text-amber-200 mb-2 font-bold">
            Total cumulé: {total.toLocaleString('fr-FR')} XP
          </p>
          <div className="space-y-1.5">
            {payload
              .filter(entry => entry.value > 0)
              .sort((a, b) => b.value - a.value)
              .map((entry, index) => (
                <p key={index} className="text-sm">
                  <span className={qstatsMuted}>{entry.name}:</span>{' '}
                  <span className="font-bold text-amber-200">
                    {entry.value.toLocaleString('fr-FR')} XP
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

const CumulativeXPAreaChart = ({ dailyPerformances, validations, allQuests }) => {
  const chartData = useMemo(() => {
    if (!dailyPerformances || dailyPerformances.length === 0) return [];

    const sorted = [...dailyPerformances].sort((a, b) => a.date.localeCompare(b.date));

    const dateCategoryMap = new Map();
    validations.forEach(v => {
      const quest = allQuests.find(q => q.id === v.queteId);
      if (quest && quest.categorie) {
        const key = `${v.date}_${quest.categorie}`;
        const current = dateCategoryMap.get(key) || 0;
        dateCategoryMap.set(key, current + (v.xpGagne || 0));
      }
    });

    const categoryTotals = new Map();
    CATEGORIES.forEach(cat => categoryTotals.set(cat, 0));

    return sorted.map(perf => {
      const dayData = {
        date: perf.date,
      };

      CATEGORIES.forEach(category => {
        const key = `${perf.date}_${category}`;
        const xpForDay = dateCategoryMap.get(key) || 0;
        const currentTotal = categoryTotals.get(category);
        const newTotal = currentTotal + xpForDay;
        categoryTotals.set(category, newTotal);
        dayData[category] = newTotal;
      });

      return dayData;
    });
  }, [dailyPerformances, validations, allQuests]);

  if (chartData.length === 0) return null;

  return (
    <div className={qstatsPanel}>
      <div className={qstatsHeaderRow}>
        <div className={qstatsAccentBar} />
        Évolution XP cumulé par catégorie
      </div>
      <LazyChart height={350}>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
            <defs>
              {CATEGORIES.map((category) => {
                const colors = categoryColors[category];
                return (
                  <linearGradient key={`area-${category}`} id={`area-${category}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colors.from} stopOpacity={0.85} />
                    <stop offset="100%" stopColor={colors.to} stopOpacity={0.15} />
                  </linearGradient>
                );
              })}
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
            <Tooltip content={<CumulativeXPTooltip />} />
            <Legend
              wrapperStyle={{ color: '#fbbf24', fontSize: '12px' }}
              iconType="rect"
            />
            {CATEGORIES.map((category) => {
              const colors = categoryColors[category];
              return (
                <Area
                  key={category}
                  type="monotone"
                  dataKey={category}
                  stackId="1"
                  stroke={colors.from}
                  fill={`url(#area-${category})`}
                  strokeWidth={1.5}
                  style={{ filter: `drop-shadow(0 0 3px ${colors.from}55)` }}
                />
              );
            })}
          </AreaChart>
        </ResponsiveContainer>
      </LazyChart>
    </div>
  );
};

export default CumulativeXPAreaChart;
