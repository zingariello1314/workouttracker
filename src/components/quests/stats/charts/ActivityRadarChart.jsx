/**
 * Composant ActivityRadarChart - Profil d'activité par catégorie
 */

import React, { useMemo } from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, ResponsiveContainer, Tooltip } from 'recharts';
import LazyChart from '../../../BodyTracking/components/LazyChart';
import {
  qstatsPanel,
  qstatsHeaderRow,
  qstatsAccentBar,
  qstatsMuted,
  qstatsChartGrid,
} from '../questsStatsTheme';

const ActivityRadarTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black border-2 border-amber-400/55 rounded-lg p-3 shadow-2xl z-20">
        <div className="relative">
          {payload.map((entry, index) => (
            <div key={index} className="mb-2">
              <p className="text-amber-300 font-semibold mb-1 text-sm tracking-wide">{entry.name}</p>
              <p className="text-sm">
                <span className={qstatsMuted}>{entry.payload.category}:</span>{' '}
                <span className="font-bold text-amber-200">
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

    const categories = ['Santé', 'Travail', 'Apprentissage', 'Lecture', 'Sport', 'Ménage', 'Spirituel', 'Repas', 'Projets', 'Hobby', 'Social', 'Finance', 'Créativité', 'Bien-être'];

    const maxValidations = Math.max(...categoryStats.map(c => c.validationsCount), 1);
    const maxXP = Math.max(...categoryStats.map(c => c.xpTotal), 1);
    const maxCompletionRate = Math.max(...categoryStats.map(c => c.completionRate), 1);

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

  const tickFill = '#fbbf24';
  const strokeAxis = '#b45309';

  return (
    <div className={qstatsPanel}>
      <div className={qstatsHeaderRow}>
        <div className={qstatsAccentBar} />
        Profil d'activité par catégorie
      </div>
      <LazyChart height={350}>
        <ResponsiveContainer width="100%" height={350}>
          <RadarChart data={radarData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <defs>
              <linearGradient id="radarValidations" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.85} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.2} />
              </linearGradient>
              <linearGradient id="radarXP" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.85} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.2} />
              </linearGradient>
              <linearGradient id="radarCompletion" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity={0.85} />
                <stop offset="100%" stopColor="#a855f7" stopOpacity={0.2} />
              </linearGradient>
              <linearGradient id="radarTime" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.85} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <PolarGrid
              stroke={qstatsChartGrid}
              strokeOpacity={0.65}
              gridType="polygon"
            />
            <PolarAngleAxis
              dataKey="category"
              tick={{ fill: tickFill, fontSize: 11, fontWeight: 500 }}
              stroke={strokeAxis}
              strokeOpacity={0.7}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: tickFill, fontSize: 10 }}
              stroke={strokeAxis}
              strokeOpacity={0.7}
            />
            <Tooltip content={<ActivityRadarTooltip />} />
            <Legend
              wrapperStyle={{ color: '#fbbf24', fontSize: '12px' }}
              iconType="line"
            />
            <Radar
              name="Validations"
              dataKey="validations"
              stroke="#06b6d4"
              fill="url(#radarValidations)"
              fillOpacity={0.6}
              strokeWidth={2}
              style={{ filter: 'drop-shadow(0 0 4px rgba(6, 182, 212, 0.45))' }}
            />
            <Radar
              name="XP"
              dataKey="xp"
              stroke="#10b981"
              fill="url(#radarXP)"
              fillOpacity={0.6}
              strokeWidth={2}
              style={{ filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.45))' }}
            />
            <Radar
              name="Taux de réussite"
              dataKey="completionRate"
              stroke="#a855f7"
              fill="url(#radarCompletion)"
              fillOpacity={0.6}
              strokeWidth={2}
              style={{ filter: 'drop-shadow(0 0 4px rgba(168, 85, 247, 0.45))' }}
            />
            <Radar
              name="Temps"
              dataKey="time"
              stroke="#f59e0b"
              fill="url(#radarTime)"
              fillOpacity={0.6}
              strokeWidth={2}
              style={{ filter: 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.45))' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </LazyChart>
    </div>
  );
};

export default ActivityRadarChart;
