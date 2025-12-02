/**
 * Composant AIRecommendations - Recommandations contextuelles basées sur l'IA
 */

import React, { useMemo } from 'react';
import { useBudget } from '../../../hooks/useBudget';
import { budgetAI } from '../../../services/finance/budgetAI';

const AIRecommendations = () => {
  const { budget, categories, depenses, depensesMoisActuel } = useBudget();

  const recommendations = useMemo(() => {
    if (!budget || !depenses || depenses.length === 0) return [];

    const recs = [];

    // Analyse des patterns temporels
    const patterns = budgetAI.detectTemporalPatterns(depenses);
    
    // Recommandation basée sur pattern hebdomadaire
    if (patterns.weekly && patterns.weekly.length > 0) {
      const maxDay = patterns.weekly.reduce((max, day) => 
        day.average > max.average ? day : max, patterns.weekly[0]
      );
      const avgWeekly = patterns.weekly.reduce((sum, d) => sum + d.average, 0) / patterns.weekly.length;
      
      if (maxDay.average > avgWeekly * 1.2) {
        recs.push({
          type: 'MICRO_ADJUSTMENT',
          message: `Reporter les achats du ${maxDay.dayName} au lendemain = économie estimée ${Math.round((maxDay.average - avgWeekly) * 0.3)}€/mois`,
          impact: 'low',
          priority: 'medium'
        });
      }
    }

    // Recommandations de substitution
    const depensesLoisirs = depensesMoisActuel.filter(d => {
      const cat = categories.find(c => c.id === d.categorie);
      return cat && (cat.nom.toLowerCase().includes('loisir') || cat.nom.toLowerCase().includes('sortie'));
    });
    
    if (depensesLoisirs.length > 0) {
      const totalLoisirs = depensesLoisirs.reduce((sum, d) => sum + (d.montant || 0), 0);
      if (totalLoisirs > 100) {
        recs.push({
          type: 'SUBSTITUTION',
          message: `Ciné 12€ → Streaming 3€ = économie ${(depensesLoisirs.length * 9)}€/mois`,
          impact: 'medium',
          priority: 'low'
        });
      }
    }

    // Optimisations groupées
    const categoriesAvecMarge = categories.filter(cat => {
      const depensesCat = depensesMoisActuel.filter(d => d.categorie === cat.id);
      const totalDepenses = depensesCat.reduce((sum, d) => sum + (d.montant || 0), 0);
      return (cat.budgetMensuel || 0) - totalDepenses > 50;
    });

    if (categoriesAvecMarge.length >= 3) {
      const totalMarge = categoriesAvecMarge.reduce((sum, cat) => {
        const depensesCat = depensesMoisActuel.filter(d => d.categorie === cat.id);
        const totalDepenses = depensesCat.reduce((s, d) => s + (d.montant || 0), 0);
        return sum + ((cat.budgetMensuel || 0) - totalDepenses);
      }, 0);

      recs.push({
        type: 'GROUPED_OPTIMIZATION',
        message: `3 ajustements = économie ${Math.round(totalMarge * 0.2)}€/mois`,
        impact: 'high',
        priority: 'high'
      });
    }

    // Objectifs adaptatifs
    const depensesTotal = depensesMoisActuel.reduce((sum, d) => sum + (d.montant || 0), 0);
    const revenus = budget.revenus || 0;
    
    if (revenus > 0) {
      const pourcentUtilise = (depensesTotal / revenus) * 100;
      
      if (pourcentUtilise > 95) {
        recs.push({
          type: 'ADAPTIVE_GOAL',
          message: `Budget serré (${pourcentUtilise.toFixed(0)}%). Réduire objectif épargne de 10% = +${Math.round((budget.epargne?.objectif || 0) * 0.1)}€ disponible`,
          impact: 'medium',
          priority: 'high'
        });
      }
    }

    return recs;
  }, [budget, categories, depenses, depensesMoisActuel]);

  const getRecommendationColor = (type) => {
    switch (type) {
      case 'MICRO_ADJUSTMENT':
        return 'bg-blue-900/20 border-blue-500/50 text-blue-300';
      case 'SUBSTITUTION':
        return 'bg-green-900/20 border-green-500/50 text-green-300';
      case 'GROUPED_OPTIMIZATION':
        return 'bg-yellow-900/20 border-yellow-500/50 text-yellow-300';
      case 'ADAPTIVE_GOAL':
        return 'bg-purple-900/20 border-purple-500/50 text-purple-300';
      default:
        return 'bg-slate-700/50 border-slate-600/50 text-slate-300';
    }
  };

  if (recommendations.length === 0) {
    return (
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recommandations IA</h3>
        <div className="text-center text-slate-400 py-8">
          <p className="text-lg mb-2">🤖</p>
          <p>Aucune recommandation pour le moment</p>
          <p className="text-sm mt-2">Continuez à utiliser l'application pour recevoir des suggestions personnalisées</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-recommendations bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Recommandations IA</h3>
      <div className="space-y-3">
        {recommendations.map((rec, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${getRecommendationColor(rec.type)}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="font-semibold mb-1">{rec.message}</div>
                <div className="text-xs opacity-80">Impact : {rec.impact}</div>
              </div>
              {rec.priority === 'high' && (
                <span className="text-xs px-2 py-1 bg-red-500/20 text-red-300 rounded">
                  Priorité
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIRecommendations;

