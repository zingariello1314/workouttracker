import React, { useMemo, memo } from 'react';
import { useTranslation } from '../../../utils/translations';
import { useBudget } from '../../../hooks/useBudget';

/**
 * ✅ SOLUTION 1.16 : Optimisation Mémoïsation Composants
 * 
 * Optimisations appliquées :
 * - Utilisation directe de calculateMetrics() dans useMemo avec dépendances stables
 * - Mémoïsation de formatCurrency avec useMemo
 * - Mémoïsation des fonctions de mapping de statut
 * - React.memo pour éviter re-renders si props parent ne changent pas
 */
const DashboardMetrics = memo(() => {
  const t = useTranslation();
  const { calculateMetrics, budget, depenses } = useBudget();

  // ✅ SOLUTION 1.16 : Utiliser calculateMetrics directement avec dépendances stables
  // calculateMetrics utilise déjà un cache interne, donc même si la fonction change,
  // le cache évite les recalculs. Cependant, utiliser les données directement évite
  // les re-renders causés par le changement de référence de la fonction.
  const metrics = useMemo(() => {
    if (!budget) return null;
    return calculateMetrics();
  }, [calculateMetrics, budget, depenses]);

  // ✅ SOLUTION 1.16 : Mémoïser formatCurrency pour éviter recréation à chaque render
  const formatCurrency = useMemo(() => {
    return (value) => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    };
  }, []);

  // ✅ SOLUTION 1.16 : Mémoïser les fonctions de mapping statut
  const getStatutColor = useMemo(() => {
    return (statut) => {
      switch (statut) {
        case 'MAITRISE':
          return 'bg-green-600/20 border-green-500/50 text-green-400';
        case 'ATTENTION':
          return 'bg-yellow-600/20 border-yellow-500/50 text-yellow-400';
        case 'DEPASSEMENT':
          return 'bg-orange-600/20 border-orange-500/50 text-orange-400';
        case 'CRITIQUE':
          return 'bg-red-600/20 border-red-500/50 text-red-400';
        default:
          return 'bg-slate-600/20 border-slate-500/50 text-slate-400';
      }
    };
  }, []);

  const getStatutLabel = useMemo(() => {
    return (statut) => {
      switch (statut) {
        case 'MAITRISE':
          return t('finance.budget.statut.maitrise');
        case 'ATTENTION':
          return t('finance.budget.statut.attention');
        case 'DEPASSEMENT':
          return t('finance.budget.statut.depassement');
        case 'CRITIQUE':
          return t('finance.budget.statut.critique');
        default:
          return statut;
      }
    };
  }, [t]);

  // ✅ SOLUTION 1.16 : Mémoïser les valeurs formatées pour éviter recalculs
  // ⚠️ IMPORTANT : Tous les hooks doivent être appelés AVANT tout return conditionnel
  const formattedRevenus = useMemo(() => {
    return metrics ? formatCurrency(metrics.revenus) : '';
  }, [metrics?.revenus, formatCurrency]);
  
  const formattedDepenses = useMemo(() => {
    return metrics ? formatCurrency(metrics.depenses) : '';
  }, [metrics?.depenses, formatCurrency]);
  
  const formattedEpargne = useMemo(() => {
    return metrics ? formatCurrency(metrics.epargne) : '';
  }, [metrics?.epargne, formatCurrency]);
  
  const formattedRestant = useMemo(() => {
    return metrics ? formatCurrency(metrics.restant) : '';
  }, [metrics?.restant, formatCurrency]);
  
  const statutColor = useMemo(() => {
    return metrics ? getStatutColor(metrics.statut) : '';
  }, [metrics?.statut, getStatutColor]);
  
  const statutLabel = useMemo(() => {
    return metrics ? getStatutLabel(metrics.statut) : '';
  }, [metrics?.statut, getStatutLabel]);
  
  const pourcentUtilise = useMemo(() => {
    return metrics ? metrics.pourcentUtilise.toFixed(1) : '0.0';
  }, [metrics?.pourcentUtilise]);

  if (!metrics) {
    return (
      <div className="text-center py-8 text-slate-400">
        Aucune donnée disponible
      </div>
    );
  }

  return (
    <div className="dashboard-metrics grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Revenus */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl">💰</span>
          <span className="text-xs text-slate-400 uppercase">Revenus</span>
        </div>
        <div className="text-2xl font-bold text-white mb-1">
          {formattedRevenus}
        </div>
        <div className="text-sm text-slate-400">Mensuel</div>
      </div>

      {/* Dépenses */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl">💸</span>
          <span className="text-xs text-slate-400 uppercase">Dépenses</span>
        </div>
        <div className="text-2xl font-bold text-white mb-1">
          {formattedDepenses}
        </div>
        <div className="text-sm text-slate-400">
          {pourcentUtilise}% du budget
        </div>
      </div>

      {/* Épargne */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl">💎</span>
          <span className="text-xs text-slate-400 uppercase">Épargne</span>
        </div>
        <div className="text-2xl font-bold text-white mb-1">
          {formattedEpargne}
        </div>
        <div className="text-sm text-slate-400">Actuelle</div>
      </div>

      {/* Restant */}
      <div className={`bg-slate-800/50 border rounded-lg p-6 ${statutColor}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl">📊</span>
          <span className="text-xs uppercase">Restant</span>
        </div>
        <div className="text-2xl font-bold mb-1">
          {formattedRestant}
        </div>
        <div className="text-sm font-medium">
          {statutLabel}
        </div>
      </div>
    </div>
  );
});

DashboardMetrics.displayName = 'DashboardMetrics';

export default DashboardMetrics;
