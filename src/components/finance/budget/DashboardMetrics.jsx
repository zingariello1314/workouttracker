/**
 * Composant DashboardMetrics - Affiche les métriques clés du budget
 */

import React, { useMemo } from 'react';
import { useBudget } from '../../../hooks/useBudget';

const DashboardMetrics = () => {
  const { budget, depensesMoisActuel, calculateMetrics } = useBudget();

  const metrics = useMemo(() => {
    return calculateMetrics();
  }, [calculateMetrics]);

  if (!metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-slate-700/50 rounded-lg animate-pulse"></div>
        ))}
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getStatutColor = (statut) => {
    switch (statut) {
      case 'CRITIQUE':
        return 'text-red-400 border-red-500';
      case 'DEPASSEMENT':
        return 'text-orange-400 border-orange-500';
      case 'ATTENTION':
        return 'text-yellow-400 border-yellow-500';
      default:
        return 'text-green-400 border-green-500';
    }
  };

  const MetricCard = ({ label, value, icon, color, subtitle, badge }) => (
    <div className={`bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 ${badge ? getStatutColor(badge) : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        {badge && (
          <span className={`text-xs px-2 py-1 rounded border ${getStatutColor(badge)}`}>
            {badge}
          </span>
        )}
      </div>
      <div className="text-slate-400 text-sm mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color || 'text-white'}`}>{value}</div>
      {subtitle && (
        <div className="text-xs text-slate-500 mt-1">{subtitle}</div>
      )}
    </div>
  );

  // Calcul du pourcentage de progression du mois
  const now = new Date();
  const joursEcoules = now.getDate();
  const joursTotal = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const pourcentMois = (joursEcoules / joursTotal) * 100;

  return (
    <div className="dashboard-metrics space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Revenus"
          value={formatCurrency(metrics.revenus)}
          icon="💰"
          color="text-green-400"
        />
        <MetricCard
          label="Dépenses"
          value={formatCurrency(metrics.depenses)}
          icon="💸"
          color="text-red-400"
          subtitle={`${metrics.pourcentUtilise}% du budget`}
        />
        <MetricCard
          label="Épargne"
          value={formatCurrency(metrics.epargne)}
          icon="💎"
          color="text-blue-400"
        />
        <MetricCard
          label="Restant"
          value={formatCurrency(metrics.restant)}
          icon="📊"
          color={metrics.restant >= 0 ? 'text-green-400' : 'text-red-400'}
          badge={metrics.statut}
        />
      </div>

      {/* Projection fin de mois avec barre de progression */}
      <div className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm text-slate-400 mb-1">Projection fin de mois</div>
            <div className={`text-xl font-bold ${metrics.projection > metrics.revenus ? 'text-red-400' : 'text-green-400'}`}>
              {formatCurrency(metrics.projection)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-400 mb-1">Écart prévu</div>
            <div className={`text-lg font-semibold ${metrics.projection > metrics.revenus ? 'text-red-400' : 'text-green-400'}`}>
              {metrics.projection > metrics.revenus ? '+' : ''}{formatCurrency(metrics.projection - metrics.revenus)}
            </div>
          </div>
        </div>
        
        {/* Barre de progression du mois */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Progression du mois</span>
            <span>{joursEcoules} / {joursTotal} jours ({pourcentMois.toFixed(0)}%)</span>
          </div>
          <div className="w-full bg-slate-700/50 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${pourcentMois}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardMetrics;

