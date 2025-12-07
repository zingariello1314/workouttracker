/**
 * Allocation Alerts - Alertes intelligentes allocation
 * Détection déviations + suggestions actionables
 */

import { useMemo } from 'react';
import { AlertTriangle, AlertCircle, Info, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../../../utils/planificateurUtils';

const AllocationAlerts = ({ patrimoine }) => {
  // Calcul alertes intelligentes
  const alerts = useMemo(() => {
    if (!patrimoine || patrimoine.total.valorise === 0) return [];

    const total = patrimoine.total.valorise;
    const allocationOr = (patrimoine.or.valorisation / total) * 100;
    const allocationBourse = (patrimoine.bourse.valorisation / total) * 100;
    const allocationCash = (patrimoine.cash.valorisation / total) * 100;

    const alertsList = [];

    // Allocation cible recommandée
    const cibleOr = 20;
    const cibleBourse = 60;
    const cibleCash = 20;

    // Alerte Bourse trop faible
    if (allocationBourse < 40) {
      const manque = (40 - allocationBourse) * total / 100;
      alertsList.push({
        type: 'allocation',
        priorite: 'warning',
        icon: <AlertTriangle className="w-5 h-5" />,
        titre: 'Part Bourse Insuffisante',
        message: `Votre allocation bourse est de ${allocationBourse.toFixed(1)}%, en dessous du minimum recommandé de 40%`,
        action: `Augmenter de ${formatCurrency(manque)} pour atteindre 40%`,
        color: 'yellow'
      });
    }

    // Alerte Bourse trop élevée
    if (allocationBourse > 80) {
      const exces = (allocationBourse - 80) * total / 100;
      alertsList.push({
        type: 'allocation',
        priorite: 'warning',
        icon: <AlertTriangle className="w-5 h-5" />,
        titre: 'Surexposition Bourse',
        message: `Votre allocation bourse est de ${allocationBourse.toFixed(1)}%, au-dessus du maximum recommandé de 80%`,
        action: `Réduire de ${formatCurrency(exces)} pour diversifier`,
        color: 'yellow'
      });
    }

    // Alerte Cash trop élevé
    if (allocationCash > 25) {
      const exces = (allocationCash - 25) * total / 100;
      alertsList.push({
        type: 'liquidites',
        priorite: 'info',
        icon: <Info className="w-5 h-5" />,
        titre: 'Liquidités Excédentaires',
        message: `Vous avez ${allocationCash.toFixed(1)}% en cash, au-dessus de 25%`,
        action: `Investir ${formatCurrency(exces)} pour optimiser rendement`,
        color: 'blue'
      });
    }

    // Alerte Cash trop faible
    if (allocationCash < 10 && total > 5000) {
      const manque = (10 - allocationCash) * total / 100;
      alertsList.push({
        type: 'liquidites',
        priorite: 'warning',
        icon: <AlertCircle className="w-5 h-5" />,
        titre: 'Réserve de Sécurité Faible',
        message: `Vous n'avez que ${allocationCash.toFixed(1)}% en cash`,
        action: `Constituer ${formatCurrency(manque)} de réserve (minimum 10%)`,
        color: 'yellow'
      });
    }

    // Alerte Or trop élevé
    if (allocationOr > 30) {
      const exces = (allocationOr - 30) * total / 100;
      alertsList.push({
        type: 'allocation',
        priorite: 'info',
        icon: <Info className="w-5 h-5" />,
        titre: 'Surpondération Or',
        message: `Votre allocation or est de ${allocationOr.toFixed(1)}%, au-dessus de 30%`,
        action: `Rééquilibrer ${formatCurrency(exces)} vers bourse`,
        color: 'blue'
      });
    }

    // Alerte Performance négative
    if (patrimoine.total.plusValuePourcent < -5) {
      alertsList.push({
        type: 'performance',
        priorite: 'error',
        icon: <TrendingDown className="w-5 h-5" />,
        titre: 'Performance Négative',
        message: `Votre patrimoine affiche ${patrimoine.total.plusValuePourcent.toFixed(1)}% de perte`,
        action: 'Revoir stratégie d\'investissement et allocation',
        color: 'red'
      });
    }

    // Alerte Performance excellente
    if (patrimoine.total.plusValuePourcent > 15) {
      alertsList.push({
        type: 'performance',
        priorite: 'success',
        icon: <TrendingUp className="w-5 h-5" />,
        titre: 'Excellente Performance',
        message: `Votre patrimoine affiche +${patrimoine.total.plusValuePourcent.toFixed(1)}% de gain`,
        action: 'Envisager de sécuriser une partie des gains',
        color: 'green'
      });
    }

    // Alerte Déviation allocation cible
    const deviationOr = Math.abs(allocationOr - cibleOr);
    const deviationBourse = Math.abs(allocationBourse - cibleBourse);
    const deviationCash = Math.abs(allocationCash - cibleCash);
    const deviationMax = Math.max(deviationOr, deviationBourse, deviationCash);

    if (deviationMax > 15) {
      alertsList.push({
        type: 'rebalancing',
        priorite: 'warning',
        icon: <AlertTriangle className="w-5 h-5" />,
        titre: 'Rééquilibrage Requis',
        message: `Déviation de ${deviationMax.toFixed(1)}% par rapport à l'allocation cible`,
        action: `Cible: Or ${cibleOr}%, Bourse ${cibleBourse}%, Cash ${cibleCash}%`,
        color: 'yellow'
      });
    }

    return alertsList;
  }, [patrimoine]);

  const colorClasses = {
    red: 'bg-red-500/20 border-red-500 text-red-400',
    yellow: 'bg-yellow-500/20 border-yellow-500 text-yellow-400',
    blue: 'bg-blue-500/20 border-blue-500 text-blue-400',
    green: 'bg-green-500/20 border-green-500 text-green-400'
  };

  if (alerts.length === 0) {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-8 text-center">
        <div className="text-4xl mb-4">✅</div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Allocation Optimale
        </h3>
        <p className="text-slate-300">
          Votre répartition patrimoniale est équilibrée. Aucune action requise.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-xl font-semibold text-white">Alertes Allocation</h3>
          <p className="text-sm text-slate-400">{alerts.length} alerte(s) détectée(s)</p>
        </div>
        <div className="flex gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-slate-400">Critique</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-slate-400">Attention</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-slate-400">Info</span>
          </div>
        </div>
      </div>

      {/* Alertes */}
      {alerts.map((alert, index) => (
        <div
          key={index}
          className={`border-2 rounded-xl p-5 ${colorClasses[alert.color]}`}
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
              {alert.icon}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-white mb-2">{alert.titre}</h4>
              <p className="text-sm mb-3">{alert.message}</p>
              <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                <div className="text-xs text-slate-400 mb-1">ACTION RECOMMANDÉE</div>
                <div className="text-sm font-medium text-white">{alert.action}</div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Allocation Actuelle vs Cible */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mt-6">
        <h4 className="text-lg font-semibold text-white mb-4">Allocation Actuelle vs Cible</h4>
        <div className="space-y-4">
          {/* Or */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-300">Or</span>
              <span className="text-white font-medium">
                {((patrimoine.or.valorisation / patrimoine.total.valorise) * 100).toFixed(1)}% 
                <span className="text-slate-400 ml-2">(cible: 20%)</span>
              </span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-yellow-500 transition-all"
                style={{ width: `${Math.min(((patrimoine.or.valorisation / patrimoine.total.valorise) * 100), 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Bourse */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-300">Bourse</span>
              <span className="text-white font-medium">
                {((patrimoine.bourse.valorisation / patrimoine.total.valorise) * 100).toFixed(1)}% 
                <span className="text-slate-400 ml-2">(cible: 60%)</span>
              </span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${Math.min(((patrimoine.bourse.valorisation / patrimoine.total.valorise) * 100), 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Cash */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-300">Cash</span>
              <span className="text-white font-medium">
                {((patrimoine.cash.valorisation / patrimoine.total.valorise) * 100).toFixed(1)}% 
                <span className="text-slate-400 ml-2">(cible: 20%)</span>
              </span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all"
                style={{ width: `${Math.min(((patrimoine.cash.valorisation / patrimoine.total.valorise) * 100), 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllocationAlerts;
