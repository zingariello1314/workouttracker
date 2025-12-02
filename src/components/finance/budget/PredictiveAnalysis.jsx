/**
 * Composant PredictiveAnalysis - Analyse prédictive
 * Projection fin de mois, alertes contextuelles, recommandations
 */

import React, { useMemo } from 'react';
import { useBudget } from '../../../hooks/useBudget';

const PredictiveAnalysis = () => {
  const { budget, categories, depensesMoisActuel, calculateMetrics } = useBudget();

  const analysis = useMemo(() => {
    if (!budget || !categories || categories.length === 0) return null;

    const metrics = calculateMetrics();
    if (!metrics) return null;

    const now = new Date();
    const joursEcoules = now.getDate();
    const joursTotal = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const joursRestants = joursTotal - joursEcoules;

    // Projection fin de mois
    const rythmeActuel = joursEcoules > 0 ? metrics.depenses / joursEcoules : 0;
    const projection = rythmeActuel * joursTotal;
    const ecartProjection = projection - metrics.revenus;

    // Alertes contextuelles par catégorie
    const alertes = categories
      .map(cat => {
        const depensesCat = depensesMoisActuel.filter(d => d.categorie === cat.id);
        const totalDepenses = depensesCat.reduce((sum, d) => sum + (d.montant || 0), 0);
        const budgetCat = cat.budgetMensuel || 0;
        const pourcentUtilise = budgetCat > 0 ? (totalDepenses / budgetCat) * 100 : 0;
        const projectionCat = (totalDepenses / joursEcoules) * joursTotal;
        const ecartCat = projectionCat - budgetCat;

        let alerte = null;
        if (pourcentUtilise >= 100) {
          alerte = {
            type: 'CRITICAL',
            message: `${cat.nom} : Budget épuisé (${pourcentUtilise.toFixed(0)}%)`,
            action: 'Arrêter les dépenses dans cette catégorie'
          };
        } else if (pourcentUtilise >= 80) {
          alerte = {
            type: 'WARNING',
            message: `${cat.nom} : ${pourcentUtilise.toFixed(0)}% du budget utilisé`,
            action: 'Réduire les dépenses'
          };
        } else if (ecartCat > 0 && projectionCat > budgetCat) {
          alerte = {
            type: 'INFO',
            message: `${cat.nom} : Risque de dépassement prévu`,
            action: 'Surveiller les dépenses'
          };
        }

        return alerte;
      })
      .filter(a => a !== null);

    // Recommandations
    const recommandations = [];

    // Recommandation 1 : Écart projection
    if (ecartProjection > 0) {
      recommandations.push({
        type: 'REBALANCE',
        message: `Projection : dépassement de ${formatCurrency(ecartProjection)} prévu`,
        suggestion: 'Réduire les dépenses de ' + formatCurrency(ecartProjection / joursRestants) + ' par jour',
        priority: 'high'
      });
    } else if (ecartProjection < -100) {
      recommandations.push({
        type: 'OPPORTUNITY',
        message: `Économie prévue : ${formatCurrency(Math.abs(ecartProjection))}`,
        suggestion: 'Envisager d\'augmenter l\'épargne',
        priority: 'low'
      });
    }

    // Recommandation 2 : Catégories avec marge
    const categoriesAvecMarge = categories
      .map(cat => {
        const depensesCat = depensesMoisActuel.filter(d => d.categorie === cat.id);
        const totalDepenses = depensesCat.reduce((sum, d) => sum + (d.montant || 0), 0);
        const budgetCat = cat.budgetMensuel || 0;
        const marge = budgetCat - totalDepenses;
        return { cat, marge };
      })
      .filter(item => item.marge > 50)
      .sort((a, b) => b.marge - a.marge);

    const categoriesEnDifficulte = categories
      .map(cat => {
        const depensesCat = depensesMoisActuel.filter(d => d.categorie === cat.id);
        const totalDepenses = depensesCat.reduce((sum, d) => sum + (d.montant || 0), 0);
        const budgetCat = cat.budgetMensuel || 0;
        const projectionCat = (totalDepenses / joursEcoules) * joursTotal;
        const besoin = projectionCat - budgetCat;
        return { cat, besoin };
      })
      .filter(item => item.besoin > 0)
      .sort((a, b) => b.besoin - a.besoin);

    // Recommandation de rééquilibrage
    if (categoriesEnDifficulte.length > 0 && categoriesAvecMarge.length > 0) {
      const source = categoriesAvecMarge[0];
      const cible = categoriesEnDifficulte[0];
      const montantTransfert = Math.min(source.marge * 0.3, cible.besoin);

      if (montantTransfert > 10) {
        recommandations.push({
          type: 'REBALANCE',
          message: `Rééquilibrer : ${formatCurrency(montantTransfert)} de ${source.cat.nom} vers ${cible.cat.nom}`,
          suggestion: 'Ajuster les budgets mensuels',
          priority: 'medium'
        });
      }
    }

    return {
      projection,
      ecartProjection,
      joursRestants,
      alertes,
      recommandations
    };
  }, [budget, categories, depensesMoisActuel, calculateMetrics]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (!analysis) {
    return (
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <p className="text-slate-400 text-center py-8">
          Aucune donnée disponible pour l'analyse prédictive.
        </p>
      </div>
    );
  }

  const getAlerteColor = (type) => {
    switch (type) {
      case 'CRITICAL':
        return 'bg-red-900/20 border-red-500/50 text-red-300';
      case 'WARNING':
        return 'bg-orange-900/20 border-orange-500/50 text-orange-300';
      case 'INFO':
        return 'bg-blue-900/20 border-blue-500/50 text-blue-300';
      default:
        return 'bg-slate-700/50 border-slate-600/50 text-slate-300';
    }
  };

  const getRecommandationColor = (type) => {
    switch (type) {
      case 'REBALANCE':
        return 'bg-yellow-900/20 border-yellow-500/50 text-yellow-300';
      case 'OPPORTUNITY':
        return 'bg-green-900/20 border-green-500/50 text-green-300';
      default:
        return 'bg-slate-700/50 border-slate-600/50 text-slate-300';
    }
  };

  return (
    <div className="predictive-analysis space-y-6">
      {/* Projection fin de mois */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Projection Fin de Mois</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-slate-400 mb-1">Projection totale</div>
            <div className={`text-2xl font-bold ${analysis.ecartProjection > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {formatCurrency(analysis.projection)}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-400 mb-1">Écart prévu</div>
            <div className={`text-xl font-semibold ${analysis.ecartProjection > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {analysis.ecartProjection > 0 ? '+' : ''}{formatCurrency(analysis.ecartProjection)}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-400 mb-1">Jours restants</div>
            <div className="text-xl font-semibold text-white">
              {analysis.joursRestants} jours
            </div>
          </div>
        </div>
      </div>

      {/* Alertes contextuelles */}
      {analysis.alertes.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Alertes</h3>
          <div className="space-y-3">
            {analysis.alertes.map((alerte, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getAlerteColor(alerte.type)}`}
              >
                <div className="font-semibold mb-1">{alerte.message}</div>
                <div className="text-sm opacity-80">{alerte.action}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommandations */}
      {analysis.recommandations.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recommandations</h3>
          <div className="space-y-3">
            {analysis.recommandations.map((rec, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getRecommandationColor(rec.type)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="font-semibold">{rec.message}</div>
                  {rec.priority === 'high' && (
                    <span className="text-xs px-2 py-1 bg-red-500/20 text-red-300 rounded">
                      Priorité
                    </span>
                  )}
                </div>
                <div className="text-sm opacity-80">{rec.suggestion}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.alertes.length === 0 && analysis.recommandations.length === 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <div className="text-center text-slate-400 py-8">
            <p className="text-lg mb-2">✅</p>
            <p>Tout va bien ! Aucune alerte ou recommandation pour le moment.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictiveAnalysis;
