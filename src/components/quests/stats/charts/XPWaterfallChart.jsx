/**
 * Composant XPWaterfallChart - Contribution XP par période
 * Visualise la contribution de chaque période à l'XP total
 */

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import LazyChart from '../../../BodyTracking/components/LazyChart';
import { formatDateForChart } from '../utils/dateHelpers';

const WaterfallTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    return (
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-cyan-500/30 rounded-lg p-3 shadow-2xl shadow-cyan-500/20 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg opacity-50"></div>
        <div className="relative">
          <p className="text-cyan-300 font-semibold mb-2 text-sm tracking-wide">{data.period}</p>
          <div className="space-y-1.5">
            <p className="text-sm">
              <span className="text-slate-400">XP gagné:</span>{' '}
              <span className="font-bold text-emerald-400">{data.xpGained.toLocaleString('fr-FR')} XP</span>
            </p>
            {data.change !== undefined && (
              <p className="text-sm">
                <span className="text-slate-400">Variation:</span>{' '}
                <span className={`font-bold ${data.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {data.change >= 0 ? '+' : ''}{data.change.toLocaleString('fr-FR')} XP
                </span>
              </p>
            )}
            <p className="text-sm">
              <span className="text-slate-400">Total cumulé:</span>{' '}
              <span className="font-bold text-cyan-400">{data.cumulative.toLocaleString('fr-FR')} XP</span>
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

    // Grouper par semaine ou mois selon la période
    const periodMap = new Map();
    
    dailyPerformances.forEach(perf => {
      const date = new Date(perf.date);
      let periodKey;
      let periodLabel;
      
      if (selectedPeriod === '7d' || selectedPeriod === '30d') {
        // Par semaine
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay()); // Dimanche
        periodKey = weekStart.toISOString().split('T')[0];
        periodLabel = `Sem. ${formatDateForChart(periodKey, 'short')}`;
      } else {
        // Par mois
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

    // Convertir en array et trier
    const periods = Array.from(periodMap.values())
      .sort((a, b) => {
        // Extraire la date pour trier
        const dateA = dailyPerformances.find(p => {
          const date = new Date(p.date);
          const periodKey = selectedPeriod === '7d' || selectedPeriod === '30d'
            ? (() => {
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                return weekStart.toISOString().split('T')[0];
              })()
            : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          return periodMap.has(periodKey) && periodMap.get(periodKey).period === a.period;
        });
        // Simplification : trier par label
        return a.period.localeCompare(b.period);
      });

    // Calculer les variations et totaux cumulés
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

  // Couleur selon la variation
  const getColor = (change) => {
    if (change > 0) return '#10b981'; // Vert pour positif
    if (change < 0) return '#ef4444'; // Rouge pour négatif
    return '#64748b'; // Gris pour neutre
  };

  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-slate-900/90 via-slate-800/50 to-slate-900/90 px-4 py-3 shadow-xl shadow-cyan-500/10 backdrop-blur-sm">
      <div className="text-xs text-cyan-300 mb-3 font-semibold tracking-wide flex items-center gap-2">
        <div className="w-1 h-4 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full"></div>
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
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#059669" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="waterfallNegativeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#dc2626" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="waterfallNeutralGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#64748b" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#475569" stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" strokeOpacity={0.3} />
            <XAxis
              dataKey="period"
              stroke="#06b6d4"
              strokeOpacity={0.5}
              tick={{ fill: '#22d3ee', fontSize: 11, fontWeight: 500 }}
            />
            <YAxis
              stroke="#06b6d4"
              strokeOpacity={0.5}
              tick={{ fill: '#22d3ee', fontSize: 11, fontWeight: 500 }}
            />
            <Tooltip content={<WaterfallTooltip />} />
            <Legend
              wrapperStyle={{ color: '#22d3ee', fontSize: '12px' }}
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
                      filter: `drop-shadow(0 0 6px ${getColor(entry.change)}60)`,
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

