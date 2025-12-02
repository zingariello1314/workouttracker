/**
 * Composant DailyAverageChart - Moyennes de quêtes complétées avec moyennes mobiles
 */

import React, { useMemo } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import LazyChart from '../../../BodyTracking/components/LazyChart';
import { formatDateForChart } from '../utils/dateHelpers';

const DailyAverageTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const date = formatDateForChart(label, 'long');
    
    return (
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-purple-500/30 rounded-lg p-3 shadow-2xl shadow-purple-500/20 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg opacity-50"></div>
        <div className="relative">
          <p className="text-purple-300 font-semibold mb-2 text-sm tracking-wide">{date}</p>
          <div className="space-y-1.5">
            {payload.map((entry, index) => (
              <p key={index} className="text-sm">
                <span className="text-slate-400">{entry.name}:</span>{' '}
                <span className="font-bold" style={{ color: entry.color }}>
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
    // Trier par date
    const sorted = [...dailyPerformances].sort((a, b) => a.date.localeCompare(b.date));
    
    // Calculer moyennes mobiles
    return sorted.map((perf, index) => {
      // Moyenne mobile 7j
      const weekStart = Math.max(0, index - 6);
      const weekData = sorted.slice(weekStart, index + 1);
      const weekAvg = weekData.length > 0
        ? weekData.reduce((sum, p) => sum + (p.completedQuests || 0), 0) / weekData.length
        : 0;

      // Moyenne mobile 30j
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
    <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-slate-900/90 via-slate-800/50 to-slate-900/90 px-4 py-3 shadow-xl shadow-purple-500/10 backdrop-blur-sm">
      <div className="text-xs text-purple-300 mb-3 font-semibold tracking-wide flex items-center gap-2">
        <div className="w-1 h-4 bg-gradient-to-b from-purple-400 to-pink-500 rounded-full"></div>
        Quêtes complétées par jour avec moyennes mobiles
      </div>
      <LazyChart height={300}>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#ec4899" stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" strokeOpacity={0.3} />
            <XAxis 
              dataKey="date" 
              stroke="#a855f7"
              strokeOpacity={0.5}
              tick={{ fill: '#c084fc', fontSize: 11, fontWeight: 500 }}
              tickFormatter={(value) => formatDateForChart(value, 'short')}
            />
            <YAxis 
              stroke="#a855f7"
              strokeOpacity={0.5}
              tick={{ fill: '#c084fc', fontSize: 11, fontWeight: 500 }}
            />
            <Tooltip content={<DailyAverageTooltip />} />
            <Legend 
              wrapperStyle={{ color: '#c084fc', fontSize: '12px' }}
              iconType="rect"
            />
            <Bar 
              dataKey="completed" 
              name="Quêtes complétées" 
              fill="url(#barGradient)" 
              radius={[4, 4, 0, 0]}
              stroke="#a855f7"
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
              style={{ filter: 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.6))' }}
            />
            <Line 
              type="monotone" 
              dataKey="avg30d" 
              name="Moyenne 30j" 
              stroke="#8b5cf6" 
              strokeWidth={3}
              dot={false}
              style={{ filter: 'drop-shadow(0 0 4px rgba(139, 92, 246, 0.6))' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </LazyChart>
    </div>
  );
};

export default DailyAverageChart;

