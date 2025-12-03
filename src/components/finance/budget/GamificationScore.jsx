import React, { useMemo } from 'react';
import { useBudget } from '../../../hooks/useBudget';
import { gamificationEngine } from '../../../services/finance/gamificationEngine';
import LevelSystem from './LevelSystem';
import Achievements from './Achievements';
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const GamificationScore = () => {
  const { budget, depenses, depensesPlanifiees } = useBudget();

  const scoreData = useMemo(() => {
    if (!budget) return null;

    // Calculer score actuel
    const scoreActuel = gamificationEngine.calculateScore(budget, depenses);

    // Calculer historique scores (3 derniers mois)
    const scores = [];
    const now = new Date();

    for (let i = 2; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const moisKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const score = gamificationEngine.calculateScore(budget, depenses, moisKey);
      scores.push({
        mois: date.toLocaleString('fr-FR', { month: 'short', year: 'numeric' }),
        score: score.global,
        discipline: score.dimensions.discipline,
        planification: score.dimensions.planification,
        optimisation: score.dimensions.optimisation,
        epargne: score.dimensions.epargne
      });
    }

    // Calculer XP total
    let totalXP = 0;
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const moisKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      totalXP += gamificationEngine.calculateXP(budget, depenses, moisKey);
    }

    return {
      actuel: scoreActuel,
      historique: scores,
      totalXP
    };
  }, [budget, depenses, depensesPlanifiees]);

  if (!scoreData) {
    return (
      <div className="gamification-score bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Gamification</h4>
        <div className="text-center py-8 text-slate-400">
          Aucune donnée disponible
        </div>
      </div>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="gamification-score space-y-6">
      <h4 className="text-lg font-semibold text-white">Gamification</h4>

      {/* Score global */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h5 className="text-md font-semibold text-white">Score Global</h5>
          <div className={`text-4xl font-bold ${getScoreColor(scoreData.actuel.global)}`}>
            {scoreData.actuel.global}/100
          </div>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-4 mb-4">
          <div
            className={`h-4 rounded-full transition-all ${
              scoreData.actuel.global >= 80 ? 'bg-green-500' :
              scoreData.actuel.global >= 60 ? 'bg-yellow-500' :
              scoreData.actuel.global >= 40 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${scoreData.actuel.global}%` }}
          />
        </div>

        {/* Breakdown dimensions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {scoreData.actuel.breakdown.map((dim, index) => (
            <div key={index} className="bg-slate-700/30 rounded-lg p-3">
              <div className="text-xs text-slate-400 mb-1">{dim.dimension}</div>
              <div className={`text-lg font-bold ${getScoreColor(dim.score)}`}>
                {dim.score}/100
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {dim.poids}% poids
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Système niveaux */}
      <LevelSystem totalXP={scoreData.totalXP} />

      {/* Graphique évolution */}
      {scoreData.historique.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <h5 className="text-md font-semibold text-white mb-4">Évolution Score (3 mois)</h5>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={scoreData.historique}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="mois" 
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                domain={[0, 100]}
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                formatter={(value) => `${value}/100`}
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.3}
                name="Score Global"
              />
              <Line
                type="monotone"
                dataKey="discipline"
                stroke="#10b981"
                strokeWidth={2}
                name="Discipline"
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="planification"
                stroke="#f59e0b"
                strokeWidth={2}
                name="Planification"
                dot={{ r: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Achievements */}
      <Achievements budget={budget} depenses={depenses} />
    </div>
  );
};

export default GamificationScore;

