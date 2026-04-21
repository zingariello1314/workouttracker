/**
 * Composant DifficultyAnalysisChart - Analyse par difficulté (Pie + Bar)
 */

import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import LazyChart from '../../../BodyTracking/components/LazyChart';
import {
  qstatsPanel,
  qstatsHeaderRow,
  qstatsAccentBar,
  qstatsMuted,
  qstatsChartGrid,
  qstatsChartTick,
  qstatsChartAxis,
  qstatsDifficultyColors,
  qstatsDifficultyGradients,
} from '../questsStatsTheme';

const COLORS = qstatsDifficultyColors;
const GRADIENTS = qstatsDifficultyGradients;

const DifficultyTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const color = COLORS[data.difficulty] || '#f59e0b';

    return (
      <div className="bg-black border-2 border-amber-400/50 rounded-lg p-3 shadow-2xl z-20">
        <div className="relative">
          <p className="font-semibold mb-2 text-sm tracking-wide text-amber-300">{data.label}</p>
          <div className="space-y-1.5">
            <p className="text-sm">
              <span className={qstatsMuted}>Quêtes:</span>{' '}
              <span className="font-bold text-amber-100">{data.questsCount}</span>
            </p>
            <p className="text-sm">
              <span className={qstatsMuted}>Validations:</span>{' '}
              <span className="font-bold text-amber-200" style={{ color }}>{data.validationsCount}</span>
            </p>
            <p className="text-sm">
              <span className={qstatsMuted}>XP total:</span>{' '}
              <span className="font-bold text-cyan-400">{data.xpTotal.toLocaleString('fr-FR')} XP</span>
            </p>
            <p className="text-sm">
              <span className={qstatsMuted}>XP moyen:</span>{' '}
              <span className="font-bold text-purple-400">{data.xpAverage} XP</span>
            </p>
            <p className="text-sm">
              <span className={qstatsMuted}>Taux de réussite:</span>{' '}
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
      <div className={qstatsPanel}>
        <div className={qstatsHeaderRow}>
          <div className={qstatsAccentBar} />
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
                      <stop offset="0%" stopColor={gradient.from} stopOpacity={0.95} />
                      <stop offset="100%" stopColor={gradient.to} stopOpacity={0.75} />
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
                style={{ filter: 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.45))' }}
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
                wrapperStyle={{ color: '#fbbf24', fontSize: '12px' }}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        </LazyChart>
      </div>

      <div className={qstatsPanel}>
        <div className={qstatsHeaderRow}>
          <div className={qstatsAccentBar} />
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
                      <stop offset="0%" stopColor={gradient.from} stopOpacity={0.95} />
                      <stop offset="100%" stopColor={gradient.to} stopOpacity={0.65} />
                    </linearGradient>
                  );
                })}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={qstatsChartGrid} strokeOpacity={0.45} />
              <XAxis
                dataKey="label"
                stroke={qstatsChartAxis}
                strokeOpacity={0.85}
                tick={{ fill: qstatsChartTick, fontSize: 11, fontWeight: 500 }}
              />
              <YAxis
                stroke={qstatsChartAxis}
                strokeOpacity={0.85}
                tick={{ fill: qstatsChartTick, fontSize: 11, fontWeight: 500 }}
              />
              <Tooltip content={<DifficultyTooltip />} />
              <Legend
                wrapperStyle={{ color: '#fbbf24', fontSize: '12px' }}
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
