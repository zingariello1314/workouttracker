/**
 * Composant GamificationScore - Score multi-dimensionnel de gamification
 * Score global pondéré basé sur discipline, planification, optimisation, épargne
 */

import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useBudget } from '../../../hooks/useBudget';

const GamificationScore = () => {
  const { budget, categories, depenses, depensesMoisActuel } = useBudget();

  const scoreData = useMemo(() => {
    if (!budget || !categories || categories.length === 0) return null;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    // Dimension 1 : Discipline (40%)
    let disciplineScore = 100;
    categories.forEach(cat => {
      const depensesCat = depensesMoisActuel.filter(d => d.categorie === cat.id);
      const totalDepenses = depensesCat.reduce((sum, d) => sum + (d.montant || 0), 0);
      const budgetCat = cat.budgetMensuel || 0;
      
      if (budgetCat > 0) {
        const pourcentUtilise = (totalDepenses / budgetCat) * 100;
        
        if (pourcentUtilise > 100) {
          disciplineScore -= (pourcentUtilise - 100) * 2;
        } else if (pourcentUtilise <= 100 && pourcentUtilise >= 90) {
          disciplineScore += 5;
        }
      }
    });
    disciplineScore = Math.max(0, Math.min(100, disciplineScore));

    // Dimension 2 : Planification (30%)
    const depensesPlanifiees = depensesMoisActuel.filter(d => d.statut === 'planifie' || d.statut === 'confirme');
    const depensesImpulsives = depensesMoisActuel.filter(d => !d.datePlanifiee);
    const totalDepenses = depensesMoisActuel.length;
    const planificationScore = totalDepenses > 0 
      ? Math.round((depensesPlanifiees.length / totalDepenses) * 100)
      : 50;

    // Dimension 3 : Optimisation (20%)
    const economies = categories.reduce((sum, cat) => {
      const depensesCat = depensesMoisActuel.filter(d => d.categorie === cat.id);
      const totalDepenses = depensesCat.reduce((s, d) => s + (d.montant || 0), 0);
      const budgetCat = cat.budgetMensuel || 0;
      if (totalDepenses < budgetCat) {
        return sum + (budgetCat - totalDepenses);
      }
      return sum;
    }, 0);
    const objectifEconomies = budget.objectifs?.economies || 0;
    const optimisationScore = objectifEconomies > 0
      ? Math.min(100, Math.round((economies / objectifEconomies) * 100))
      : 50;

    // Dimension 4 : Épargne (10%)
    const epargneReelle = budget.epargne?.actuelle || 0;
    const epargneObjectif = budget.epargne?.objectif || 0;
    const epargneScore = epargneObjectif > 0
      ? Math.min(100, Math.round((epargneReelle / epargneObjectif) * 100))
      : 50;

    // Score global pondéré
    const globalScore = Math.round(
      disciplineScore * 0.40 +
      planificationScore * 0.30 +
      optimisationScore * 0.20 +
      epargneScore * 0.10
    );

    // Historique (simulation sur 6 mois)
    const historique = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(year, month - i, 1);
      const depensesMois = depenses.filter(d => {
        const depenseDate = new Date(d.date);
        return depenseDate.getFullYear() === date.getFullYear() &&
               depenseDate.getMonth() === date.getMonth();
      });

      if (depensesMois.length > 0 || i === 0) {
        // Calcul simplifié
        const depensesTotal = depensesMois.reduce((sum, d) => sum + (d.montant || 0), 0);
        const revenus = budget.revenus || 0;
        const pourcent = revenus > 0 ? (depensesTotal / revenus) * 100 : 0;
        const scoreMois = Math.max(0, Math.min(100, 100 - (pourcent - 100) * 2));
        
        historique.push({
          mois: date.toLocaleDateString('fr-FR', { month: 'short' }),
          score: Math.round(scoreMois)
        });
      }
    }

    return {
      global: globalScore,
      dimensions: {
        discipline: disciplineScore,
        planification: planificationScore,
        optimisation: optimisationScore,
        epargne: epargneScore
      },
      breakdown: {
        discipline: `Respect des budgets : ${disciplineScore}/100`,
        planification: `${depensesPlanifiees.length}/${totalDepenses} dépenses planifiées`,
        optimisation: `${Math.round(economies)}€ économisés`,
        epargne: `${Math.round((epargneReelle / epargneObjectif) * 100)}% de l'objectif`
      },
      historique
    };
  }, [budget, categories, depenses, depensesMoisActuel]);

  if (!scoreData) {
    return (
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <p className="text-slate-400 text-center py-8">
          Aucune donnée disponible pour calculer le score de gamification.
        </p>
      </div>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBadge = (score) => {
    if (score >= 90) return { text: 'Excellent', color: 'bg-green-500/20 text-green-300 border-green-500/50' };
    if (score >= 80) return { text: 'Très bon', color: 'bg-green-500/20 text-green-300 border-green-500/50' };
    if (score >= 70) return { text: 'Bon', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50' };
    if (score >= 60) return { text: 'Moyen', color: 'bg-orange-500/20 text-orange-300 border-orange-500/50' };
    return { text: 'À améliorer', color: 'bg-red-500/20 text-red-300 border-red-500/50' };
  };

  const badge = getScoreBadge(scoreData.global);

  return (
    <div className="gamification-score space-y-6">
      {/* Score global */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Score de Gamification</h3>
        <div className="text-center mb-6">
          <div className={`text-6xl font-bold mb-4 ${getScoreColor(scoreData.global)}`}>
            {scoreData.global}
          </div>
          <div className={`inline-block px-4 py-2 rounded-lg border ${badge.color}`}>
            {badge.text}
          </div>
        </div>

        {/* Dimensions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Object.entries(scoreData.dimensions).map(([key, value]) => (
            <div key={key} className="text-center">
              <div className="text-xs text-slate-400 mb-1 capitalize">{key}</div>
              <div className={`text-2xl font-bold ${getScoreColor(value)}`}>{value}</div>
              <div className="text-xs text-slate-500 mt-1">
                {scoreData.breakdown[key]}
              </div>
            </div>
          ))}
        </div>

        {/* Graphique historique */}
        {scoreData.historique.length > 1 && (
          <div>
            <h4 className="text-sm text-slate-400 mb-2">Évolution (6 mois)</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={scoreData.historique}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="mois" stroke="#9ca3af" />
                <YAxis domain={[0, 100]} stroke="#9ca3af" />
                <Tooltip 
                  formatter={(value) => `${value}/100`}
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default GamificationScore;

