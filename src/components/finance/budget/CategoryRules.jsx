/**
 * Composant CategoryRules - Affichage des règles et alertes d'une catégorie
 */

import React, { useMemo } from 'react';

const CategoryRules = ({ category, depenses }) => {
  const alerts = useMemo(() => {
    if (!category || !depenses) return [];

    const rules = category.regles || {};
    const depenseActuelle = depenses.reduce((sum, d) => sum + (d.montant || 0), 0);
    const budgetCat = category.budgetMensuel || 0;
    
    if (budgetCat === 0) return [];

    const pourcentUtilise = (depenseActuelle / budgetCat) * 100;
    const alerts = [];

    // Alerte 80%
    if (rules.alerte80 && pourcentUtilise >= 80 && pourcentUtilise < 100) {
      alerts.push({
        type: 'WARNING_80',
        message: `80% du budget utilisé`,
        priority: 'medium',
        color: 'bg-yellow-900/20 border-yellow-500/50 text-yellow-300'
      });
    }

    // Alerte 100%
    if (rules.alerte100 && pourcentUtilise >= 100) {
      alerts.push({
        type: 'CRITICAL_100',
        message: `Budget épuisé (${pourcentUtilise.toFixed(0)}%)`,
        priority: 'high',
        color: 'bg-red-900/20 border-red-500/50 text-red-300'
      });
    }

    // Alerte 120%
    if (rules.alerte120 && pourcentUtilise >= 120) {
      alerts.push({
        type: 'CRITICAL_120',
        message: `Budget dépassé de ${(pourcentUtilise - 100).toFixed(1)}%`,
        priority: 'critical',
        color: 'bg-red-900/30 border-red-500 text-red-200'
      });
    }

    return alerts;
  }, [category, depenses]);

  if (alerts.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      {alerts.map((alert, index) => (
        <div
          key={index}
          className={`p-2 rounded-lg border text-xs ${alert.color}`}
        >
          <div className="flex items-center gap-2">
            <span>
              {alert.type === 'CRITICAL_120' || alert.type === 'CRITICAL_100' ? '🔴' : '⚠️'}
            </span>
            <span className="font-medium">{alert.message}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CategoryRules;

