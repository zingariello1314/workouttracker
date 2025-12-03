import React, { useMemo } from 'react';
import { useTranslation } from '../../../utils/translations';

/**
 * Composant de contrôle répartition intelligent
 * Affiche les alertes d'équilibre et les suggestions
 */
const RepartitionControl = ({ salaire, repartition, ecart, onRepartitionChange, formatCurrency }) => {
  const t = useTranslation();

  const statut = useMemo(() => {
    if (Math.abs(ecart) < 1) {
      return { type: 'success', message: 'Répartition équilibrée, 0€ non alloué', icon: '✅' };
    } else if (ecart < 0) {
      return { 
        type: 'warning', 
        message: `Sur-allocation de ${formatCurrency(Math.abs(ecart))}, ajuster répartition`, 
        icon: '⚠️' 
      };
    } else {
      return { 
        type: 'info', 
        message: `Sous-allocation de ${formatCurrency(ecart)}, budget disponible`, 
        icon: '💰' 
      };
    }
  }, [ecart, formatCurrency]);

  const totalAlloue = useMemo(() => {
    return Object.values(repartition).reduce((sum, val) => sum + (val || 0), 0);
  }, [repartition]);

  const pourcentAlloue = useMemo(() => {
    return salaire > 0 ? (totalAlloue / salaire) * 100 : 0;
  }, [totalAlloue, salaire]);

  return (
    <div className={`repartition-control rounded-lg p-6 border ${
      statut.type === 'success' 
        ? 'bg-green-900/30 border-green-500/50' 
        : statut.type === 'warning'
        ? 'bg-yellow-900/30 border-yellow-500/50'
        : 'bg-blue-900/30 border-blue-500/50'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{statut.icon}</span>
          <div>
            <h4 className="text-lg font-semibold text-white">Contrôle Répartition</h4>
            <p className={`text-sm ${
              statut.type === 'success' ? 'text-green-300' :
              statut.type === 'warning' ? 'text-yellow-300' : 'text-blue-300'
            }`}>
              {statut.message}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div className="bg-slate-800/50 rounded-lg p-4">
          <div className="text-sm text-slate-400 mb-1">Salaire Total</div>
          <div className="text-xl font-bold text-white">{formatCurrency(salaire)}</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4">
          <div className="text-sm text-slate-400 mb-1">Total Alloué</div>
          <div className="text-xl font-bold text-white">{formatCurrency(totalAlloue)}</div>
          <div className="text-xs text-slate-500 mt-1">{pourcentAlloue.toFixed(1)}%</div>
        </div>
        <div className={`bg-slate-800/50 rounded-lg p-4 ${
          ecart >= 0 ? 'border border-green-500/50' : 'border border-yellow-500/50'
        }`}>
          <div className="text-sm text-slate-400 mb-1">Écart</div>
          <div className={`text-xl font-bold ${
            ecart >= 0 ? 'text-green-400' : 'text-yellow-400'
          }`}>
            {formatCurrency(ecart)}
          </div>
        </div>
      </div>

      {/* Suggestions */}
      {Math.abs(ecart) > 50 && (
        <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
          <div className="text-sm font-medium text-slate-300 mb-2">💡 Suggestions</div>
          <ul className="text-xs text-slate-400 space-y-1">
            {ecart < 0 && (
              <li>• Réduire certaines allocations pour équilibrer</li>
            )}
            {ecart > 0 && (
              <li>• Allouer le surplus à une catégorie ou le garder en sécurité</li>
            )}
            <li>• Cliquez sur les sliders pour ajuster en temps réel</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default RepartitionControl;

