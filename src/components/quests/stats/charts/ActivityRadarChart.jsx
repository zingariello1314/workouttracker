/**
 * Composant ActivityRadarChart - Profil d'activité par catégorie
 * Visualise l'équilibre entre les différentes catégories avec un graphique radar
 */

import React, { useMemo } from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, ResponsiveContainer, Tooltip } from 'recharts';
import LazyChart from '../../../BodyTracking/components/LazyChart';

const ActivityRadarTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-purple-500/30 rounded-lg p-3 shadow-2xl shadow-purple-500/20 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg opacity-50"></div>
        <div className="relative">
          {payload.map((entry, index) => (
            <div key={index} className="mb-2">
              <p className="text-purple-300 font-semibold mb-1 text-sm tracking-wide">{entry.name}</p>
              <p className="text-sm">
                <span className="text-slate-400">{entry.payload.category}:</span>{' '}
                <span className="font-bold" style={{ color: entry.color }}>
                  {entry.value.toFixed(1)}%
                </span>
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const ActivityRadarChart = ({ categoryStats, validations, allQuests }) => {
  const radarData = useMemo(() => {
    if (!categoryStats || categoryStats.length === 0) return [];

    // Normaliser les valeurs entre 0 et 100 pour chaque métrique
    const categories = ['Santé', 'Travail', 'Apprentissage', 'Lecture', 'Sport', 'Ménage', 'Spirituel', 'Repas', 'Projets', 'Hobby', 'Social', 'Finance', 'Créativité', 'Bien-être'];
    
    // Calculer les max pour normalisation
    const maxValidations = Math.max(...categoryStats.map(c => c.validationsCount), 1);
    const maxXP = Math.max(...categoryStats.map(c => c.xpTotal), 1);
    const maxCompletionRate = Math.max(...categoryStats.map(c => c.completionRate), 1);
    
    // Calculer temps total par catégorie
    const categoryTimeMap = new Map();
    validations.forEach(v => {
      const quest = allQuests.find(q => q.id === v.queteId);
      if (quest && quest.categorie) {
        const current = categoryTimeMap.get(quest.categorie) || 0;
        categoryTimeMap.set(quest.categorie, current + (quest.duree || 0));
      }
    });
    const maxTime = Math.max(...Array.from(categoryTimeMap.values()), 1);

    return categories.map(category => {
      const stats = categoryStats.find(c => c.category === category) || {
        validationsCount: 0,
        xpTotal: 0,
        completionRate: 0,
      };
      const timeTotal = categoryTimeMap.get(category) || 0;

      return {
        category,
        validations: Math.round((stats.validationsCount / maxValidations) * 100),
        xp: Math.round((stats.xpTotal / maxXP) * 100),
        completionRate: stats.completionRate,
        time: Math.round((timeTotal / maxTime) * 100),
      };
    });
  }, [categoryStats, validations, allQuests]);

  if (radarData.length === 0) return null;

  return (
    <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-slate-900/90 via-slate-800/50 to-slate-900/90 px-4 py-3 shadow-xl shadow-purple-500/10 backdrop-blur-sm">
      <div className="text-xs text-purple-300 mb-3 font-semibold tracking-wide flex items-center gap-2">
        <div className="w-1 h-4 bg-gradient-to-b from-purple-400 to-pink-500 rounded-full"></div>
        Profil d'activité par catégorie
      </div>
      <LazyChart height={350}>
        <ResponsiveContainer width="100%" height={350}>
          <RadarChart data={radarData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <defs>
              <linearGradient id="radarValidations" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.2} />
              </linearGradient>
              <linearGradient id="radarXP" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.2} />
              </linearGradient>
              <linearGradient id="radarCompletion" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#a855f7" stopOpacity={0.2} />
              </linearGradient>
              <linearGradient id="radarTime" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <PolarGrid 
              stroke="#1e293b" 
              strokeOpacity={0.3}
              gridType="polygon"
            />
            <PolarAngleAxis 
              dataKey="category" 
              tick={{ fill: '#c084fc', fontSize: 11, fontWeight: 500 }}
              stroke="#a855f7"
              strokeOpacity={0.5}
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 100]}
              tick={{ fill: '#c084fc', fontSize: 10 }}
              stroke="#a855f7"
              strokeOpacity={0.5}
            />
            <Tooltip content={<ActivityRadarTooltip />} />
            <Legend 
              wrapperStyle={{ color: '#c084fc', fontSize: '12px' }}
              iconType="line"
            />
            <Radar
              name="Validations"
              dataKey="validations"
              stroke="#06b6d4"
              fill="url(#radarValidations)"
              fillOpacity={0.6}
              strokeWidth={2}
              style={{ filter: 'drop-shadow(0 0 4px rgba(6, 182, 212, 0.4))' }}
            />
            <Radar
              name="XP"
              dataKey="xp"
              stroke="#10b981"
              fill="url(#radarXP)"
              fillOpacity={0.6}
              strokeWidth={2}
              style={{ filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.4))' }}
            />
            <Radar
              name="Taux de réussite"
              dataKey="completionRate"
              stroke="#a855f7"
              fill="url(#radarCompletion)"
              fillOpacity={0.6}
              strokeWidth={2}
              style={{ filter: 'drop-shadow(0 0 4px rgba(168, 85, 247, 0.4))' }}
            />
            <Radar
              name="Temps"
              dataKey="time"
              stroke="#f59e0b"
              fill="url(#radarTime)"
              fillOpacity={0.6}
              strokeWidth={2}
              style={{ filter: 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.4))' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </LazyChart>
    </div>
  );
};

export default ActivityRadarChart;

