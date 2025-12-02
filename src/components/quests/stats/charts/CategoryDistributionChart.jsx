/**
 * Composant CategoryDistributionChart - Top 5 et Bottom 5 catégories
 */

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import LazyChart from '../../../BodyTracking/components/LazyChart';

const CategoryTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    return (
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-emerald-500/30 rounded-lg p-3 shadow-2xl shadow-emerald-500/20 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-lg opacity-50"></div>
        <div className="relative">
          <p className="text-emerald-300 font-semibold mb-2 text-sm tracking-wide">{label}</p>
          <div className="space-y-1.5">
            <p className="text-sm">
              <span className="text-slate-400">Quêtes:</span>{' '}
              <span className="font-bold text-slate-200">{data.questsCount}</span>
            </p>
            <p className="text-sm">
              <span className="text-slate-400">Validations:</span>{' '}
              <span className="font-bold text-emerald-400">{data.validationsCount}</span>
            </p>
            <p className="text-sm">
              <span className="text-slate-400">XP total:</span>{' '}
              <span className="font-bold text-cyan-400">{data.xpTotal.toLocaleString('fr-FR')} XP</span>
            </p>
            <p className="text-sm">
              <span className="text-slate-400">Taux de réussite:</span>{' '}
              <span className="font-bold text-purple-400">{data.completionRate}%</span>
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

  // Fonction pour déterminer la couleur selon le taux de réussite (cyberpunk)
  const getColor = (completionRate) => {
    if (completionRate >= 70) return '#10b981'; // emerald-500 avec glow
    if (completionRate >= 50) return '#06b6d4'; // cyan-500
    if (completionRate >= 30) return '#f59e0b'; // amber-500
    return '#ef4444'; // red-500
  };
  
  const getGradientId = (completionRate, index, prefix = 'top') => {
    if (completionRate >= 70) return `gradient-emerald-${prefix}-${index}`;
    if (completionRate >= 50) return `gradient-cyan-${prefix}-${index}`;
    if (completionRate >= 30) return `gradient-amber-${prefix}-${index}`;
    return `gradient-red-${prefix}-${index}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Top 5 */}
      <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-900/90 via-slate-800/50 to-slate-900/90 px-4 py-3 shadow-xl shadow-emerald-500/10 backdrop-blur-sm">
        <div className="text-xs text-emerald-300 mb-3 font-semibold tracking-wide flex items-center gap-2">
          <div className="w-1 h-4 bg-gradient-to-b from-emerald-400 to-cyan-500 rounded-full"></div>
          🏆 Top 5 Catégories
        </div>
        <LazyChart height={250}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart 
              data={topCategories} 
              layout="vertical"
              margin={{ top: 10, right: 20, left: 60, bottom: 20 }}
            >
              <defs>
                {topCategories.map((entry, index) => {
                  const gradientId = getGradientId(entry.completionRate, index, 'top');
                  const baseColor = getColor(entry.completionRate);
                  return (
                    <linearGradient key={gradientId} id={gradientId} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={baseColor} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={baseColor} stopOpacity={0.5} />
                    </linearGradient>
                  );
                })}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" strokeOpacity={0.3} />
              <XAxis 
                type="number" 
                stroke="#10b981"
                strokeOpacity={0.5}
                tick={{ fill: '#34d399', fontSize: 11, fontWeight: 500 }} 
              />
              <YAxis 
                type="category" 
                dataKey="category" 
                stroke="#10b981"
                strokeOpacity={0.5}
                tick={{ fill: '#34d399', fontSize: 11, fontWeight: 500 }}
                width={50}
              />
              <Tooltip content={<CategoryTooltip />} />
              <Bar dataKey="validationsCount" name="Validations" radius={[0, 8, 8, 0]}>
                {topCategories.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={`url(#${getGradientId(entry.completionRate, index, 'top')})`}
                    stroke={getColor(entry.completionRate)}
                    strokeWidth={1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </LazyChart>
      </div>

      {/* Bottom 5 */}
      <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-slate-900/90 via-slate-800/50 to-slate-900/90 px-4 py-3 shadow-xl shadow-amber-500/10 backdrop-blur-sm">
        <div className="text-xs text-amber-300 mb-3 font-semibold tracking-wide flex items-center gap-2">
          <div className="w-1 h-4 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full"></div>
          📉 Catégories à améliorer
        </div>
        <LazyChart height={250}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart 
              data={bottomCategories} 
              layout="vertical"
              margin={{ top: 10, right: 20, left: 60, bottom: 20 }}
            >
              <defs>
                {bottomCategories.map((entry, index) => {
                  const gradientId = getGradientId(entry.completionRate, index, 'bottom');
                  const baseColor = getColor(entry.completionRate);
                  return (
                    <linearGradient key={gradientId} id={gradientId} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={baseColor} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={baseColor} stopOpacity={0.5} />
                    </linearGradient>
                  );
                })}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" strokeOpacity={0.3} />
              <XAxis 
                type="number" 
                stroke="#f59e0b"
                strokeOpacity={0.5}
                tick={{ fill: '#fbbf24', fontSize: 11, fontWeight: 500 }} 
              />
              <YAxis 
                type="category" 
                dataKey="category" 
                stroke="#f59e0b"
                strokeOpacity={0.5}
                tick={{ fill: '#fbbf24', fontSize: 11, fontWeight: 500 }}
                width={50}
              />
              <Tooltip content={<CategoryTooltip />} />
              <Bar dataKey="validationsCount" name="Validations" radius={[0, 8, 8, 0]}>
                {bottomCategories.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={`url(#${getGradientId(entry.completionRate, index, 'bottom')})`}
                    stroke={getColor(entry.completionRate)}
                    strokeWidth={1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </LazyChart>
      </div>
    </div>
  );
};

export default CategoryDistributionChart;

