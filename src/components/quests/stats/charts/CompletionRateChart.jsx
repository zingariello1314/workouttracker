/**
 * Composant CompletionRateChart - Taux de complétion par période avec comparaison
 */

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import LazyChart from '../../../BodyTracking/components/LazyChart';
import { getTodayDateStr, addDays } from '../../../../hooks/useQuietQuestEngine';
import { calculateCompletionRateByPeriod } from '../utils/statsCalculations';

const CompletionRateTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const current = payload.find(p => p.dataKey === 'current')?.value || 0;
    const previous = payload.find(p => p.dataKey === 'previous')?.value || 0;
    const variation = current - previous;
    const variationPercent = previous > 0 ? Math.round((variation / previous) * 100) : 0;
    
    return (
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-cyan-500/30 rounded-lg p-3 shadow-2xl shadow-cyan-500/20 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-lg opacity-50"></div>
        <div className="relative">
          <p className="text-cyan-300 font-semibold mb-2 text-sm tracking-wide">{label}</p>
          <div className="space-y-1.5">
            <p className="text-sm">
              <span className="text-slate-400">Actuelle:</span>{' '}
              <span className="font-bold text-cyan-400">{current}%</span>
            </p>
            <p className="text-sm">
              <span className="text-slate-400">Précédente:</span>{' '}
              <span className="font-bold text-slate-300">{previous}%</span>
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
    <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-slate-900/90 via-slate-800/50 to-slate-900/90 px-4 py-3 shadow-xl shadow-cyan-500/10 backdrop-blur-sm">
      <div className="text-xs text-cyan-300 mb-3 font-semibold tracking-wide flex items-center gap-2">
        <div className="w-1 h-4 bg-gradient-to-b from-cyan-400 to-purple-500 rounded-full"></div>
        Taux de complétion par période (avec comparaison)
      </div>
      <LazyChart height={300}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
            <defs>
              <linearGradient id="currentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="previousGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#64748b" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#475569" stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" strokeOpacity={0.3} />
            <XAxis 
              dataKey="period" 
              stroke="#06b6d4"
              strokeOpacity={0.5}
              tick={{ fill: '#67e8f9', fontSize: 11, fontWeight: 500 }}
            />
            <YAxis 
              stroke="#06b6d4"
              strokeOpacity={0.5}
              tick={{ fill: '#67e8f9', fontSize: 11, fontWeight: 500 }}
              domain={[0, 100]}
            />
            <Tooltip content={<CompletionRateTooltip />} />
            <Legend 
              wrapperStyle={{ color: '#67e8f9', fontSize: '12px' }}
              iconType="rect"
            />
            <Bar 
              dataKey="current" 
              name="Période actuelle" 
              fill="url(#currentGradient)" 
              radius={[8, 8, 0, 0]}
              stroke="#06b6d4"
              strokeWidth={1}
            />
            <Bar 
              dataKey="previous" 
              name="Période précédente" 
              fill="url(#previousGradient)" 
              radius={[8, 8, 0, 0]}
              stroke="#64748b"
              strokeWidth={1}
            />
          </BarChart>
        </ResponsiveContainer>
      </LazyChart>
    </div>
  );
};

export default CompletionRateChart;

