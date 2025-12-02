/**
 * Composant BehavioralMetrics - Métriques psychologiques et comportementales
 */

import React, { useMemo } from 'react';
import { useBudget } from '../../../hooks/useBudget';

const BehavioralMetrics = () => {
  const { budget, depenses, depensesMoisActuel } = useBudget();

  const metrics = useMemo(() => {
    if (!budget || !depenses || depenses.length === 0) return null;

    // Impulsivité index : % dépenses non planifiées
    const depensesPlanifiees = depensesMoisActuel.filter(d => d.datePlanifiee || d.statut === 'planifie' || d.statut === 'confirme');
    const depensesImpulsives = depensesMoisActuel.filter(d => !d.datePlanifiee && d.statut !== 'planifie' && d.statut !== 'confirme');
    const totalDepenses = depensesMoisActuel.length;
    const impulsiviteIndex = totalDepenses > 0 
      ? Math.round((depensesImpulsives.length / totalDepenses) * 100)
      : 0;

    // Procrastination score : Délai planification → réalisation
    const depensesAvecDelai = depensesMoisActuel
      .filter(d => d.datePlanifiee && d.date)
      .map(d => {
        const datePlanifiee = new Date(d.datePlanifiee);
        const dateReelle = new Date(d.date);
        const delai = Math.abs((dateReelle - datePlanifiee) / (1000 * 60 * 60 * 24));
        return delai;
      });
    const procrastinationScore = depensesAvecDelai.length > 0
      ? Math.round(depensesAvecDelai.reduce((sum, d) => sum + d, 0) / depensesAvecDelai.length)
      : 0;

    // Satisfaction budgétaire (simulation - nécessite input utilisateur)
    const satisfactionBudgetaire = 75; // À remplacer par input utilisateur

    return {
      impulsivite: {
        index: impulsiviteIndex,
        label: impulsiviteIndex < 20 ? 'Faible' : impulsiviteIndex < 50 ? 'Modérée' : 'Élevée',
        color: impulsiviteIndex < 20 ? 'text-green-400' : impulsiviteIndex < 50 ? 'text-yellow-400' : 'text-red-400'
      },
      procrastination: {
        score: procrastinationScore,
        label: procrastinationScore < 3 ? 'Ponctuel' : procrastinationScore < 7 ? 'Modéré' : 'Élevé',
        color: procrastinationScore < 3 ? 'text-green-400' : procrastinationScore < 7 ? 'text-yellow-400' : 'text-red-400'
      },
      satisfaction: {
        score: satisfactionBudgetaire,
        label: satisfactionBudgetaire >= 80 ? 'Très satisfait' : satisfactionBudgetaire >= 60 ? 'Satisfait' : 'Insatisfait',
        color: satisfactionBudgetaire >= 80 ? 'text-green-400' : satisfactionBudgetaire >= 60 ? 'text-yellow-400' : 'text-red-400'
      }
    };
  }, [budget, depenses, depensesMoisActuel]);

  if (!metrics) {
    return (
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <p className="text-slate-400 text-center py-8">
          Aucune donnée disponible pour les métriques comportementales.
        </p>
      </div>
    );
  }

  const MetricCard = ({ title, value, label, color, description }) => (
    <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4">
      <div className="text-sm text-slate-400 mb-2">{title}</div>
      <div className={`text-2xl font-bold mb-1 ${color}`}>{value}</div>
      <div className="text-sm text-slate-300 mb-2">{label}</div>
      {description && (
        <div className="text-xs text-slate-500">{description}</div>
      )}
    </div>
  );

  return (
    <div className="behavioral-metrics space-y-6">
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Métriques Comportementales</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Impulsivité"
            value={`${metrics.impulsivite.index}%`}
            label={metrics.impulsivite.label}
            color={metrics.impulsivite.color}
            description={`${depensesMoisActuel.filter(d => !d.datePlanifiee).length} dépenses non planifiées`}
          />
          <MetricCard
            title="Procrastination"
            value={`${metrics.procrastination.score}j`}
            label={metrics.procrastination.label}
            color={metrics.procrastination.color}
            description="Délai moyen planification → réalisation"
          />
          <MetricCard
            title="Satisfaction"
            value={`${metrics.satisfaction.score}%`}
            label={metrics.satisfaction.label}
            color={metrics.satisfaction.color}
            description="Auto-évaluation mensuelle"
          />
        </div>
      </div>
    </div>
  );
};

export default BehavioralMetrics;

