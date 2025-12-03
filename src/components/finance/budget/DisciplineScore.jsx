import React, { useMemo } from 'react';
import { useBudget } from '../../../hooks/useBudget';
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const DisciplineScore = () => {
  const { budget, depenses, categories } = useBudget();

  const scoreData = useMemo(() => {
    if (!budget || !categories || categories.length === 0) return null;

    // Calculer score pour les 3 derniers mois
    const scores = [];
    const now = new Date();

    for (let i = 2; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const moisKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      const depensesMois = depenses.filter(d => {
        const dDate = new Date(d.date);
        const dMois = `${dDate.getFullYear()}-${String(dDate.getMonth() + 1).padStart(2, '0')}`;
        return dMois === moisKey;
      });

      let score = 100;
      let totalPenalites = 0;
      let totalBonus = 0;
      const details = [];

      // Analyser chaque catégorie
      categories.forEach(categorie => {
        const depensesCategorie = depensesMois.filter(d => d.categorie === categorie.id);
        const depenseMois = depensesCategorie.reduce((sum, d) => sum + d.montant, 0);
        const budgetCategorie = categorie.budgetMensuel || 0;

        if (budgetCategorie > 0) {
          const pourcentUtilise = (depenseMois / budgetCategorie) * 100;

          if (pourcentUtilise > 100) {
            // Pénalité dépassement
            const penalite = (pourcentUtilise - 100) * 2;
            totalPenalites += penalite;
            details.push({
              categorie: categorie.nom,
              type: 'penalite',
              valeur: penalite,
              raison: `Dépassement de ${(pourcentUtilise - 100).toFixed(1)}%`
            });
          } else if (pourcentUtilise <= 100 && pourcentUtilise >= 90) {
            // Bonus gestion serrée
            totalBonus += 5;
            details.push({
              categorie: categorie.nom,
              type: 'bonus',
              valeur: 5,
              raison: 'Gestion serrée (90-100%)'
            });
          } else if (pourcentUtilise < 50 && depenseMois > 0) {
            // Bonus économie
            totalBonus += 3;
            details.push({
              categorie: categorie.nom,
              type: 'bonus',
              valeur: 3,
              raison: 'Économie significative'
            });
          }
        }
      });

      // Score final
      score = Math.max(0, Math.min(100, score - totalPenalites + totalBonus));

      scores.push({
        mois: date.toLocaleString('fr-FR', { month: 'short', year: 'numeric' }),
        score: Math.round(score),
        penalites: Math.round(totalPenalites),
        bonus: totalBonus,
        details
      });
    }

    // Score actuel (mois en cours)
    const moisActuel = new Date().toISOString().slice(0, 7);
    const depensesMoisActuel = depenses.filter(d => {
      const dDate = new Date(d.date);
      const dMois = `${dDate.getFullYear()}-${String(dDate.getMonth() + 1).padStart(2, '0')}`;
      return dMois === moisActuel;
    });

    let scoreActuel = 100;
    let penalitesActuelles = 0;
    let bonusActuels = 0;
    const detailsActuels = [];

    categories.forEach(categorie => {
      const depensesCategorie = depensesMoisActuel.filter(d => d.categorie === categorie.id);
      const depenseActuelle = depensesCategorie.reduce((sum, d) => sum + d.montant, 0);
      const budgetCategorie = categorie.budgetMensuel || 0;

      if (budgetCategorie > 0) {
        const joursEcoules = new Date().getDate();
        const joursTotal = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        const pourcentTemps = (joursEcoules / joursTotal) * 100;
        const pourcentBudget = (depenseActuelle / budgetCategorie) * 100;

        // Ajuster selon progression du mois
        const pourcentUtiliseAjuste = pourcentTemps > 0 
          ? (pourcentBudget / pourcentTemps) * 100 
          : 0;

        if (pourcentUtiliseAjuste > 100) {
          const penalite = (pourcentUtiliseAjuste - 100) * 2;
          penalitesActuelles += penalite;
          detailsActuels.push({
            categorie: categorie.nom,
            type: 'penalite',
            valeur: penalite,
            raison: `En avance sur le budget`
          });
        } else if (pourcentUtiliseAjuste <= 100 && pourcentUtiliseAjuste >= 90) {
          bonusActuels += 5;
          detailsActuels.push({
            categorie: categorie.nom,
            type: 'bonus',
            valeur: 5,
            raison: 'Gestion optimale'
          });
        }
      }
    });

    scoreActuel = Math.max(0, Math.min(100, scoreActuel - penalitesActuelles + bonusActuels));

    return {
      historique: scores,
      actuel: {
        score: Math.round(scoreActuel),
        penalites: Math.round(penalitesActuelles),
        bonus: bonusActuels,
        details: detailsActuels
      },
      evolution: scores.length > 0 
        ? scoreActuel - scores[scores.length - 1].score 
        : 0
    };
  }, [budget, depenses, categories]);

  if (!scoreData) {
    return (
      <div className="discipline-score bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Score Discipline</h4>
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

  const getScoreLabel = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Très bon';
    if (score >= 60) return 'Bon';
    if (score >= 40) return 'Moyen';
    return 'À améliorer';
  };

  return (
    <div className="discipline-score space-y-6">
      <h4 className="text-lg font-semibold text-white">Score Discipline</h4>

      {/* Score actuel */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h5 className="text-md font-semibold text-white">Score Actuel</h5>
          <div className={`text-4xl font-bold ${getScoreColor(scoreData.actuel.score)}`}>
            {scoreData.actuel.score}/100
          </div>
        </div>
        <div className="text-center mb-4">
          <div className={`text-lg font-semibold ${getScoreColor(scoreData.actuel.score)} mb-2`}>
            {getScoreLabel(scoreData.actuel.score)}
          </div>
          <div className="w-full bg-slate-700 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all ${
                scoreData.actuel.score >= 80 ? 'bg-green-500' :
                scoreData.actuel.score >= 60 ? 'bg-yellow-500' :
                scoreData.actuel.score >= 40 ? 'bg-orange-500' : 'bg-red-500'
              }`}
              style={{ width: `${scoreData.actuel.score}%` }}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-slate-400">Pénalités</div>
            <div className="text-red-400 font-semibold">-{scoreData.actuel.penalites.toFixed(1)}</div>
          </div>
          <div>
            <div className="text-slate-400">Bonus</div>
            <div className="text-green-400 font-semibold">+{scoreData.actuel.bonus.toFixed(1)}</div>
          </div>
        </div>
        {scoreData.evolution !== 0 && (
          <div className={`text-sm mt-2 text-center ${
            scoreData.evolution > 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {scoreData.evolution > 0 ? '↑' : '↓'} {Math.abs(scoreData.evolution)} points vs mois précédent
          </div>
        )}
      </div>

      {/* Graphique évolution */}
      {scoreData.historique.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <h5 className="text-md font-semibold text-white mb-4">Évolution (3 mois)</h5>
          <ResponsiveContainer width="100%" height={200}>
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
                name="Score"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Détails facteurs d'impact */}
      {scoreData.actuel.details.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <h5 className="text-md font-semibold text-white mb-4">Facteurs d'Impact</h5>
          <div className="space-y-2">
            {scoreData.actuel.details.map((detail, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  detail.type === 'bonus'
                    ? 'bg-green-900/20 border border-green-500/30 text-green-300'
                    : 'bg-red-900/20 border border-red-500/30 text-red-300'
                }`}
              >
                <div>
                  <div className="font-semibold">{detail.categorie}</div>
                  <div className="text-sm opacity-80">{detail.raison}</div>
                </div>
                <div className="text-lg font-bold">
                  {detail.type === 'bonus' ? '+' : '-'}{detail.valeur.toFixed(1)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DisciplineScore;
