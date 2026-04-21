/**
 * Composant DifficultyXPScatterChart - Corrélation Difficulté vs XP gagné
 */

import React, { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import LazyChart from '../../../BodyTracking/components/LazyChart';
import {
  qstatsPanel,
  qstatsHeaderRow,
  qstatsAccentBar,
  qstatsMuted,
  qstatsChartGrid,
  qstatsChartTick,
  qstatsChartAxis,
  qstatsCategoryStroke,
} from '../questsStatsTheme';

const categoryColors = { ...qstatsCategoryStroke, Autre: '#94a3b8' };

const ScatterTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;

    return (
      <div className="bg-black border-2 border-amber-400/50 rounded-lg p-3 shadow-2xl z-20">
        <div className="relative">
          <p className="text-amber-300 font-semibold mb-2 text-sm tracking-wide">{data.nom}</p>
          <div className="space-y-1.5">
            <p className="text-sm">
              <span className={qstatsMuted}>Difficulté:</span>{' '}
              <span className="font-bold text-amber-200">{data.difficultyLabel}</span>
            </p>
            <p className="text-sm">
              <span className={qstatsMuted}>XP moyen:</span>{' '}
              <span className="font-bold text-yellow-300">{data.xpAverage.toFixed(1)} XP</span>
            </p>
            <p className="text-sm">
              <span className={qstatsMuted}>Validations:</span>{' '}
              <span className="font-bold text-amber-300">{data.validationsCount}</span>
            </p>
            <p className="text-sm">
              <span className={qstatsMuted}>Catégorie:</span>{' '}
              <span className="font-bold text-amber-200">{data.categorie}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const DifficultyXPScatterChart = ({ validations, allQuests }) => {
  const scatterData = useMemo(() => {
    if (!validations || !allQuests || validations.length === 0) return [];

    const questMap = new Map();

    validations.forEach(v => {
      const quest = allQuests.find(q => q.id === v.queteId);
      if (!quest) return;

      if (!questMap.has(quest.id)) {
        questMap.set(quest.id, {
          id: quest.id,
          nom: quest.nom,
          difficulte: quest.difficulte,
          difficultyLabel: {
            1: 'Facile',
            2: 'Moyen',
            3: 'Difficile',
            4: 'Épique'
          }[quest.difficulte] || 'N/A',
          categorie: quest.categorie,
          xpValues: [],
        });
      }

      questMap.get(quest.id).xpValues.push(v.xpGagne || 0);
    });

    return Array.from(questMap.values())
      .map(quest => {
        const xpAverage = quest.xpValues.length > 0
          ? quest.xpValues.reduce((sum, xp) => sum + xp, 0) / quest.xpValues.length
          : 0;

        return {
          ...quest,
          xpAverage: Math.round(xpAverage * 10) / 10,
          validationsCount: quest.xpValues.length,
          x: quest.difficulte,
          y: xpAverage,
        };
      })
      .filter(q => q.validationsCount > 0);
  }, [validations, allQuests]);

  if (scatterData.length === 0) return null;

  const maxValidations = Math.max(...scatterData.map(d => d.validationsCount), 1);

  return (
    <div className={qstatsPanel}>
      <div className={qstatsHeaderRow}>
        <div className={qstatsAccentBar} />
        Corrélation Difficulté vs XP gagné
      </div>
      <LazyChart height={350}>
        <ResponsiveContainer width="100%" height={350}>
          <ScatterChart
            data={scatterData}
            margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={qstatsChartGrid} strokeOpacity={0.45} />
            <XAxis
              type="number"
              dataKey="x"
              name="Difficulté"
              domain={[0.5, 4.5]}
              ticks={[1, 2, 3, 4]}
              tickFormatter={(value) => {
                const labels = { 1: 'Facile', 2: 'Moyen', 3: 'Difficile', 4: 'Épique' };
                return labels[value] || value;
              }}
              stroke={qstatsChartAxis}
              strokeOpacity={0.85}
              tick={{ fill: qstatsChartTick, fontSize: 11, fontWeight: 500 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="XP moyen"
              stroke={qstatsChartAxis}
              strokeOpacity={0.85}
              tick={{ fill: qstatsChartTick, fontSize: 11, fontWeight: 500 }}
            />
            <Tooltip content={<ScatterTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            <Legend
              wrapperStyle={{ color: '#fbbf24', fontSize: '12px' }}
            />
            <Scatter
              name="Quêtes"
              data={scatterData}
              fill="#f59e0b"
            >
              {scatterData.map((entry, index) => {
                const size = 5 + (entry.validationsCount / maxValidations) * 15;
                const color = categoryColors[entry.categorie] || '#3b82f6';

                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={color}
                    opacity={0.85}
                    r={size}
                  />
                );
              })}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </LazyChart>
    </div>
  );
};

export default DifficultyXPScatterChart;
