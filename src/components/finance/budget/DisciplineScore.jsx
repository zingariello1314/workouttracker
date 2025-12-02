/**
 * Composant DisciplineScore - Score de discipline budgétaire
 * Score 0-100 basé sur respect budgets, historique évolutif, facteurs d'impact
 */

import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useBudget } from '../../../hooks/useBudget';

const DisciplineScore = () => {
  const { budget, categories, depensesMoisActuel, depenses } = useBudget();
  const [selectedView, setSelectedView] = useState('score'); // 'score' ou 'details'

  const scoreData = useMemo(() => {
    if (!budget || !categories || categories.length === 0) return null;

    let scoreTotal = 100;
    const facteurs = [];

    // Facteur 1 : Respect des budgets par catégorie
    categories.forEach(cat => {
      const depensesCat = depensesMoisActuel.filter(d => d.categorie === cat.id);
      const totalDepenses = depensesCat.reduce((sum, d) => sum + (d.montant || 0), 0);
      const budgetCat = cat.budgetMensuel || 0;
      
      if (budgetCat > 0) {
        const pourcentUtilise = (totalDepenses / budgetCat) * 100;
        
        if (pourcentUtilise > 100) {
          // Pénalité pour dépassement
          const penalite = (pourcentUtilise - 100) * 2;
          scoreTotal -= Math.min(penalite, 20); // Max 20 points de pénalité par catégorie
          facteurs.push({
            nom: cat.nom,
            impact: -Math.min(penalite, 20),
            raison: `Dépassement de ${(pourcentUtilise - 100).toFixed(1)}%`,
            type: 'negative'
          });
        } else if (pourcentUtilise <= 100 && pourcentUtilise >= 90) {
          // Bonus pour gestion serrée
          const bonus = 5;
          scoreTotal += bonus;
          facteurs.push({
            nom: cat.nom,
            impact: bonus,
            raison: `Gestion optimale (${pourcentUtilise.toFixed(0)}%)`,
            type: 'positive'
          });
        } else if (pourcentUtilise < 50 && budgetCat > 100) {
          // Légère pénalité si sous-utilisation importante (peut indiquer mauvaise planification)
          const penalite = 2;
          scoreTotal -= penalite;
          facteurs.push({
            nom: cat.nom,
            impact: -penalite,
            raison: `Sous-utilisation (${pourcentUtilise.toFixed(0)}%) - Budget peut être ajusté`,
            type: 'warning'
          });
        }
      }
    });

    // Facteur 2 : Respect budget global
    const metrics = {
      revenus: budget.revenus || 0,
      depenses: depensesMoisActuel.reduce((sum, d) => sum + (d.montant || 0), 0),
      epargne: budget.epargne?.actuelle || 0
    };
    const pourcentGlobal = metrics.revenus > 0 ? (metrics.depenses / metrics.revenus) * 100 : 0;

    if (pourcentGlobal > 100) {
      const penalite = (pourcentGlobal - 100) * 3;
      scoreTotal -= Math.min(penalite, 30);
      facteurs.push({
        nom: 'Budget global',
        impact: -Math.min(penalite, 30),
        raison: `Dépassement global de ${(pourcentGlobal - 100).toFixed(1)}%`,
        type: 'negative'
      });
    } else if (pourcentGlobal <= 100 && pourcentGlobal >= 95) {
      const bonus = 10;
      scoreTotal += bonus;
      facteurs.push({
        nom: 'Budget global',
        impact: bonus,
        raison: `Excellent contrôle (${pourcentGlobal.toFixed(0)}%)`,
        type: 'positive'
      });
    }

    // Facteur 3 : Épargne
    const objectifEpargne = budget.epargne?.objectif || 0;
    if (objectifEpargne > 0) {
      const ratioEpargne = (metrics.epargne / objectifEpargne) * 100;
      if (ratioEpargne >= 100) {
        const bonus = 15;
        scoreTotal += bonus;
        facteurs.push({
          nom: 'Épargne',
          impact: bonus,
          raison: `Objectif épargne atteint (${ratioEpargne.toFixed(0)}%)`,
          type: 'positive'
        });
      } else if (ratioEpargne >= 80) {
        const bonus = 5;
        scoreTotal += bonus;
        facteurs.push({
          nom: 'Épargne',
          impact: bonus,
          raison: `Bon niveau d'épargne (${ratioEpargne.toFixed(0)}%)`,
          type: 'positive'
        });
      } else if (ratioEpargne < 50) {
        const penalite = 5;
        scoreTotal -= penalite;
        facteurs.push({
          nom: 'Épargne',
          impact: -penalite,
          raison: `Épargne insuffisante (${ratioEpargne.toFixed(0)}%)`,
          type: 'negative'
        });
      }
    }

    // Normaliser le score entre 0 et 100
    const scoreFinal = Math.max(0, Math.min(100, Math.round(scoreTotal)));

    // Historique (simulation basée sur les 6 derniers mois)
    const historique = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const depensesMois = depenses.filter(d => {
        const depenseDate = new Date(d.date);
        return depenseDate.getFullYear() === date.getFullYear() && 
               depenseDate.getMonth() === date.getMonth();
      });

      if (depensesMois.length > 0 || i === 0) {
        // Calcul simplifié du score pour chaque mois
        const depensesMoisTotal = depensesMois.reduce((sum, d) => sum + (d.montant || 0), 0);
        const pourcentMois = metrics.revenus > 0 ? (depensesMoisTotal / metrics.revenus) * 100 : 0;
        const scoreMois = pourcentMois <= 100 ? 100 - (pourcentMois - 100) * 2 : Math.max(0, 100 - (pourcentMois - 100) * 3);
        
        historique.push({
          mois: date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
          score: Math.max(0, Math.min(100, Math.round(scoreMois)))
        });
      }
    }

    return {
      score: scoreFinal,
      facteurs,
      historique
    };
  }, [budget, categories, depensesMoisActuel, depenses]);

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

  if (!scoreData) {
    return (
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <p className="text-slate-400 text-center py-8">
          Aucune donnée disponible pour calculer le score de discipline.
        </p>
      </div>
    );
  }

  const badge = getScoreBadge(scoreData.score);

  return (
    <div className="discipline-score space-y-6">
      {/* Score principal */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Score de Discipline</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedView('score')}
              className={`px-3 py-1 rounded text-sm transition-all ${
                selectedView === 'score'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Score
            </button>
            <button
              onClick={() => setSelectedView('details')}
              className={`px-3 py-1 rounded text-sm transition-all ${
                selectedView === 'details'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Détails
            </button>
          </div>
        </div>

        {selectedView === 'score' ? (
          <div className="text-center">
            <div className={`text-6xl font-bold mb-4 ${getScoreColor(scoreData.score)}`}>
              {scoreData.score}
            </div>
            <div className={`inline-block px-4 py-2 rounded-lg border ${badge.color}`}>
              {badge.text}
            </div>
            
            {/* Graphique historique */}
            {scoreData.historique.length > 1 && (
              <div className="mt-6">
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
        ) : (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-300 mb-3">Facteurs d'impact</h4>
            {scoreData.facteurs.map((facteur, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  facteur.type === 'positive'
                    ? 'bg-green-900/20 border-green-500/50'
                    : facteur.type === 'negative'
                    ? 'bg-red-900/20 border-red-500/50'
                    : 'bg-yellow-900/20 border-yellow-500/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white">{facteur.nom}</div>
                    <div className="text-sm text-slate-400">{facteur.raison}</div>
                  </div>
                  <div className={`text-lg font-bold ${
                    facteur.impact > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {facteur.impact > 0 ? '+' : ''}{facteur.impact.toFixed(0)}
                  </div>
                </div>
              </div>
            ))}
            {scoreData.facteurs.length === 0 && (
              <div className="text-center text-slate-400 py-4">
                Aucun facteur d'impact pour le moment.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DisciplineScore;
