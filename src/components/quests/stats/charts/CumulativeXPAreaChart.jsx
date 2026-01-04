/**
 * Composant CumulativeXPAreaChart - Évolution XP cumulé avec zones empilées
 * Visualise l'accumulation d'XP dans le temps avec zones colorées par catégorie
 */

import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import LazyChart from '../../../BodyTracking/components/LazyChart';
import { formatDateForChart } from '../utils/dateHelpers';

const CumulativeXPTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const date = formatDateForChart(label, 'long');
    const total = payload.reduce((sum, entry) => sum + (entry.value || 0), 0);
    
    return (
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-cyan-500/30 rounded-lg p-3 shadow-2xl shadow-cyan-500/20 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg opacity-50"></div>
        <div className="relative">
          <p className="text-cyan-300 font-semibold mb-2 text-sm tracking-wide">{date}</p>
          <p className="text-sm text-cyan-400 mb-2 font-bold">
            Total cumulé: {total.toLocaleString('fr-FR')} XP
          </p>
          <div className="space-y-1.5">
            {payload
              .filter(entry => entry.value > 0)
              .sort((a, b) => b.value - a.value)
              .map((entry, index) => (
                <p key={index} className="text-sm">
                  <span className="text-slate-400">{entry.name}:</span>{' '}
                  <span className="font-bold" style={{ color: entry.color }}>
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

    // Trier par date
    const sorted = [...dailyPerformances].sort((a, b) => a.date.localeCompare(b.date));
    
    // Créer Map date -> validations par catégorie
    const dateCategoryMap = new Map();
    validations.forEach(v => {
      const quest = allQuests.find(q => q.id === v.queteId);
      if (quest && quest.categorie) {
        const key = `${v.date}_${quest.categorie}`;
        const current = dateCategoryMap.get(key) || 0;
        dateCategoryMap.set(key, current + (v.xpGagne || 0));
      }
    });

    // Calculer XP cumulé par catégorie
    const categories = ['Santé', 'Travail', 'Apprentissage', 'Lecture', 'Sport', 'Ménage', 'Spirituel', 'Repas', 'Projets', 'Hobby', 'Social', 'Finance', 'Créativité', 'Bien-être'];
    const categoryTotals = new Map();
    categories.forEach(cat => categoryTotals.set(cat, 0));

    return sorted.map(perf => {
      const dayData = {
        date: perf.date,
      };

      // Ajouter XP de chaque catégorie pour ce jour
      categories.forEach(category => {
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

  // Couleurs pour chaque catégorie
  const categoryColors = {
    'Santé': { from: '#10b981', to: '#34d399' },
    'Travail': { from: '#3b82f6', to: '#60a5fa' },
    'Apprentissage': { from: '#8b5cf6', to: '#a78bfa' },
    'Lecture': { from: '#ec4899', to: '#f472b6' },
    'Sport': { from: '#f59e0b', to: '#fbbf24' },
    'Ménage': { from: '#06b6d4', to: '#22d3ee' },
    'Spirituel': { from: '#6366f1', to: '#818cf8' },
    'Repas': { from: '#f97316', to: '#fb923c' },
    'Projets': { from: '#14b8a6', to: '#2dd4bf' },
    'Hobby': { from: '#a855f7', to: '#c084fc' },
    'Social': { from: '#ef4444', to: '#f87171' },
    'Finance': { from: '#22c55e', to: '#4ade80' },
    'Créativité': { from: '#eab308', to: '#facc15' },
    'Bien-être': { from: '#06b6d4', to: '#38bdf8' },
  };

  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-slate-900/90 via-slate-800/50 to-slate-900/90 px-4 py-3 shadow-xl shadow-cyan-500/10 backdrop-blur-sm">
      <div className="text-xs text-cyan-300 mb-3 font-semibold tracking-wide flex items-center gap-2">
        <div className="w-1 h-4 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full"></div>
        Évolution XP cumulé par catégorie
      </div>
      <LazyChart height={350}>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
            <defs>
              {Object.entries(categoryColors).map(([category, colors], index) => (
                <linearGradient key={`area-${category}`} id={`area-${category}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.from} stopOpacity={0.8} />
                  <stop offset="100%" stopColor={colors.from} stopOpacity={0.1} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" strokeOpacity={0.3} />
            <XAxis
              dataKey="date"
              stroke="#06b6d4"
              strokeOpacity={0.5}
              tick={{ fill: '#67e8f9', fontSize: 11, fontWeight: 500 }}
              tickFormatter={(value) => formatDateForChart(value, 'short')}
            />
            <YAxis
              stroke="#06b6d4"
              strokeOpacity={0.5}
              tick={{ fill: '#67e8f9', fontSize: 11, fontWeight: 500 }}
            />
            <Tooltip content={<CumulativeXPTooltip />} />
            <Legend 
              wrapperStyle={{ color: '#67e8f9', fontSize: '12px' }}
              iconType="rect"
            />
            {Object.entries(categoryColors).map(([category, colors]) => (
              <Area
                key={category}
                type="monotone"
                dataKey={category}
                stackId="1"
                stroke={colors.from}
                fill={`url(#area-${category})`}
                strokeWidth={1.5}
                style={{ filter: 'drop-shadow(0 0 3px rgba(6, 182, 212, 0.3))' }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </LazyChart>
    </div>
  );
};

export default CumulativeXPAreaChart;

