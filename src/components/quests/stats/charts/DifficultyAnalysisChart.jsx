/**
 * Composant DifficultyAnalysisChart - Analyse par difficulté (Pie + Bar)
 */

import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import LazyChart from '../../../BodyTracking/components/LazyChart';

const COLORS = {
  1: '#10b981', // Facile - emerald-500
  2: '#06b6d4', // Moyen - cyan-500
  3: '#f59e0b', // Difficile - amber-500
  4: '#ef4444', // Épique - red-500
};

const GRADIENTS = {
  1: { from: '#10b981', to: '#34d399' }, // emerald
  2: { from: '#06b6d4', to: '#22d3ee' }, // cyan
  3: { from: '#f59e0b', to: '#fbbf24' }, // amber
  4: { from: '#ef4444', to: '#f87171' }, // red
};

const DifficultyTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const color = COLORS[data.difficulty] || '#9ca3af';
    
    return (
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border rounded-lg p-3 shadow-2xl backdrop-blur-sm" style={{ borderColor: `${color}30` }}>
        <div className="absolute inset-0 rounded-lg opacity-50" style={{ background: `linear-gradient(to right, ${color}10, ${GRADIENTS[data.difficulty]?.to || color}10)` }}></div>
        <div className="relative">
          <p className="font-semibold mb-2 text-sm tracking-wide" style={{ color }}>{data.label}</p>
          <div className="space-y-1.5">
            <p className="text-sm">
              <span className="text-slate-400">Quêtes:</span>{' '}
              <span className="font-bold text-slate-200">{data.questsCount}</span>
            </p>
            <p className="text-sm">
              <span className="text-slate-400">Validations:</span>{' '}
              <span className="font-bold" style={{ color }}>{data.validationsCount}</span>
            </p>
            <p className="text-sm">
              <span className="text-slate-400">XP total:</span>{' '}
              <span className="font-bold text-cyan-400">{data.xpTotal.toLocaleString('fr-FR')} XP</span>
            </p>
            <p className="text-sm">
              <span className="text-slate-400">XP moyen:</span>{' '}
              <span className="font-bold text-purple-400">{data.xpAverage} XP</span>
            </p>
            <p className="text-sm">
              <span className="text-slate-400">Taux de réussite:</span>{' '}
              <span className="font-bold text-yellow-400">{data.completionRate}%</span>
            </p>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const DifficultyAnalysisChart = ({ difficultyStats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Répartition (Pie) */}
      <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-slate-900/90 via-slate-800/50 to-slate-900/90 px-4 py-3 shadow-xl shadow-cyan-500/10 backdrop-blur-sm">
        <div className="text-xs text-cyan-300 mb-3 font-semibold tracking-wide flex items-center gap-2">
          <div className="w-1 h-4 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full"></div>
          Répartition par difficulté
        </div>
        <LazyChart height={300}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <defs>
                {difficultyStats.map((entry, index) => {
                  const gradient = GRADIENTS[entry.difficulty];
                  return (
                    <linearGradient key={`pie-gradient-${index}`} id={`pie-gradient-${index}`}>
                      <stop offset="0%" stopColor={gradient.from} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={gradient.to} stopOpacity={0.7} />
                    </linearGradient>
                  );
                })}
              </defs>
              <Pie
                data={difficultyStats}
                dataKey="validationsCount"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={30}
                label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
                style={{ filter: 'drop-shadow(0 0 6px rgba(6, 182, 212, 0.4))' }}
              >
                {difficultyStats.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={`url(#pie-gradient-${index})`}
                    stroke={COLORS[entry.difficulty]}
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<DifficultyTooltip />} />
              <Legend 
                wrapperStyle={{ color: '#67e8f9', fontSize: '12px' }}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        </LazyChart>
      </div>

      {/* XP moyen (Bar) */}
      <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-slate-900/90 via-slate-800/50 to-slate-900/90 px-4 py-3 shadow-xl shadow-purple-500/10 backdrop-blur-sm">
        <div className="text-xs text-purple-300 mb-3 font-semibold tracking-wide flex items-center gap-2">
          <div className="w-1 h-4 bg-gradient-to-b from-purple-400 to-pink-500 rounded-full"></div>
          XP moyen par difficulté
        </div>
        <LazyChart height={300}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={difficultyStats} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <defs>
                {difficultyStats.map((entry, index) => {
                  const gradient = GRADIENTS[entry.difficulty];
                  return (
                    <linearGradient key={`bar-gradient-${index}`} id={`bar-gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={gradient.from} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={gradient.to} stopOpacity={0.6} />
                    </linearGradient>
                  );
                })}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" strokeOpacity={0.3} />
              <XAxis 
                dataKey="label" 
                stroke="#a855f7"
                strokeOpacity={0.5}
                tick={{ fill: '#c084fc', fontSize: 11, fontWeight: 500 }}
              />
              <YAxis 
                stroke="#a855f7"
                strokeOpacity={0.5}
                tick={{ fill: '#c084fc', fontSize: 11, fontWeight: 500 }}
              />
              <Tooltip content={<DifficultyTooltip />} />
              <Legend 
                wrapperStyle={{ color: '#c084fc', fontSize: '12px' }}
                iconType="rect"
              />
              <Bar dataKey="xpAverage" name="XP moyen" radius={[8, 8, 0, 0]}>
                {difficultyStats.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={`url(#bar-gradient-${index})`}
                    stroke={COLORS[entry.difficulty]}
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

export default DifficultyAnalysisChart;

