/**
 * Composant DifficultyXPScatterChart - Corrélation Difficulté vs XP gagné
 * Nuage de points analysant la relation entre difficulté des quêtes et XP réellement gagné
 */

import React, { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import LazyChart from '../../../BodyTracking/components/LazyChart';

const ScatterTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    return (
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-amber-500/30 rounded-lg p-3 shadow-2xl shadow-amber-500/20 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg opacity-50"></div>
        <div className="relative">
          <p className="text-amber-300 font-semibold mb-2 text-sm tracking-wide">{data.nom}</p>
          <div className="space-y-1.5">
            <p className="text-sm">
              <span className="text-slate-400">Difficulté:</span>{' '}
              <span className="font-bold text-amber-400">{data.difficultyLabel}</span>
            </p>
            <p className="text-sm">
              <span className="text-slate-400">XP moyen:</span>{' '}
              <span className="font-bold text-emerald-400">{data.xpAverage.toFixed(1)} XP</span>
            </p>
            <p className="text-sm">
              <span className="text-slate-400">Validations:</span>{' '}
              <span className="font-bold text-cyan-400">{data.validationsCount}</span>
            </p>
            <p className="text-sm">
              <span className="text-slate-400">Catégorie:</span>{' '}
              <span className="font-bold text-purple-400">{data.categorie}</span>
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

    // Grouper validations par quête
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

    // Calculer XP moyen par quête et préparer données pour scatter
    return Array.from(questMap.values())
      .map(quest => {
        const xpAverage = quest.xpValues.length > 0
          ? quest.xpValues.reduce((sum, xp) => sum + xp, 0) / quest.xpValues.length
          : 0;
        
        return {
          ...quest,
          xpAverage: Math.round(xpAverage * 10) / 10,
          validationsCount: quest.xpValues.length,
          // Pour le scatter : x = difficulté, y = XP moyen
          x: quest.difficulte,
          y: xpAverage,
        };
      })
      .filter(q => q.validationsCount > 0); // Filtrer les quêtes sans validation
  }, [validations, allQuests]);

  if (scatterData.length === 0) return null;

  // Couleurs par catégorie
  const categoryColors = {
    'Santé': '#10b981',
    'Travail': '#3b82f6',
    'Apprentissage': '#8b5cf6',
    'Lecture': '#ec4899',
    'Sport': '#f59e0b',
    'Ménage': '#06b6d4',
    'Spirituel': '#6366f1',
    'Repas': '#f97316',
    'Projets': '#14b8a6',
    'Hobby': '#a855f7',
    'Social': '#ef4444',
    'Finance': '#22c55e',
    'Créativité': '#eab308',
    'Bien-être': '#06b6d4',
  };

  // Trouver le max pour normaliser la taille des points
  const maxValidations = Math.max(...scatterData.map(d => d.validationsCount), 1);

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-slate-900/90 via-slate-800/50 to-slate-900/90 px-4 py-3 shadow-xl shadow-amber-500/10 backdrop-blur-sm">
      <div className="text-xs text-amber-300 mb-3 font-semibold tracking-wide flex items-center gap-2">
        <div className="w-1 h-4 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full"></div>
        Corrélation Difficulté vs XP gagné
      </div>
      <LazyChart height={350}>
        <ResponsiveContainer width="100%" height={350}>
          <ScatterChart
            data={scatterData}
            margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" strokeOpacity={0.3} />
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
              stroke="#f59e0b"
              strokeOpacity={0.5}
              tick={{ fill: '#fbbf24', fontSize: 11, fontWeight: 500 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="XP moyen"
              stroke="#f59e0b"
              strokeOpacity={0.5}
              tick={{ fill: '#fbbf24', fontSize: 11, fontWeight: 500 }}
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
                const size = 5 + (entry.validationsCount / maxValidations) * 15; // Taille entre 5 et 20
                const color = categoryColors[entry.categorie] || '#9ca3af';
                
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={color}
                    opacity={0.7}
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

