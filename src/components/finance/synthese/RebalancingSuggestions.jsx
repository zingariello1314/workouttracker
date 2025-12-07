/**
 * Rebalancing Suggestions - Suggestions rééquilibrage automatique
 * Calculs optimisation allocation avec montants précis
 */

import { useMemo } from 'react';
import { ArrowRightLeft, Target, Zap } from 'lucide-react';
import { formatCurrency } from '../../../utils/planificateurUtils';

const RebalancingSuggestions = ({ patrimoine }) => {
  // Calcul suggestions rééquilibrage
  const suggestions = useMemo(() => {
    if (!patrimoine || patrimoine.total.valorise === 0) return [];

    const total = patrimoine.total.valorise;
    const allocationOr = (patrimoine.or.valorisation / total) * 100;
    const allocationBourse = (patrimoine.bourse.valorisation / total) * 100;
    const allocationCash = (patrimoine.cash.valorisation / total) * 100;

    // Allocation cible
    const cibleOr = 20;
    const cibleBourse = 60;
    const cibleCash = 20;

    const suggestionsList = [];

    // Calcul écarts
    const ecartOr = allocationOr - cibleOr;
    const ecartBourse = allocationBourse - cibleBourse;
    const ecartCash = allocationCash - cibleCash;

    // Suggestion rééquilibrage global
    if (Math.abs(ecartOr) > 5 || Math.abs(ecartBourse) > 5 || Math.abs(ecartCash) > 5) {
      const operations = [];

      if (ecartOr > 5) {
        const montant = (ecartOr * total) / 100;
        operations.push({
          from: 'Or',
          to: ecartBourse < 0 ? 'Bourse' : 'Cash',
          montant,
          icon: '🪙'
        });
      }

      if (ecartBourse > 5) {
        const montant = (ecartBourse * total) / 100;
        operations.push({
          from: 'Bourse',
          to: ecartOr < 0 ? 'Or' : 'Cash',
          montant,
          icon: '📈'
        });
      }

      if (ecartCash > 5) {
        const montant = (ecartCash * total) / 100;
        operations.push({
          from: 'Cash',
          to: ecartBourse < 0 ? 'Bourse' : 'Or',
          montant,
          icon: '💵'
        });
      }

      if (operations.length > 0) {
        suggestionsList.push({
          type: 'rebalancing',
          titre: 'Rééquilibrage Automatique',
          description: 'Optimiser allocation selon cible 20/60/20',
          operations,
          priorite: 'high'
        });
      }
    }

    // Suggestion cash excédentaire
    if (allocationCash > 25) {
      const exces = ((allocationCash - 20) * total) / 100;
      const versBourse = exces * 0.7;
      const versOr = exces * 0.3;

      suggestionsList.push({
        type: 'optimization',
        titre: 'Optimisation Cash Excédentaire',
        description: `Répartir ${formatCurrency(exces)} de cash pour améliorer rendement`,
        operations: [
          { from: 'Cash', to: 'Bourse', montant: versBourse, icon: '💵' },
          { from: 'Cash', to: 'Or', montant: versOr, icon: '💵' }
        ],
        priorite: 'medium'
      });
    }

    // Suggestion diversification
    if (allocationBourse > 75) {
      const exces = ((allocationBourse - 60) * total) / 100;
      const versOr = exces * 0.5;
      const versCash = exces * 0.5;

      suggestionsList.push({
        type: 'diversification',
        titre: 'Diversification Recommandée',
        description: `Réduire exposition bourse de ${formatCurrency(exces)}`,
        operations: [
          { from: 'Bourse', to: 'Or', montant: versOr, icon: '📈' },
          { from: 'Bourse', to: 'Cash', montant: versCash, icon: '📈' }
        ],
        priorite: 'high'
      });
    }

    // Suggestion sécurisation gains
    if (patrimoine.total.plusValuePourcent > 20) {
      const gainsSec = patrimoine.total.plusValue * 0.3;

      suggestionsList.push({
        type: 'securisation',
        titre: 'Sécurisation Gains',
        description: `Performance +${patrimoine.total.plusValuePourcent.toFixed(1)}% : sécuriser une partie`,
        operations: [
          { from: 'Bourse', to: 'Cash', montant: gainsSec, icon: '📈' }
        ],
        priorite: 'medium'
      });
    }

    return suggestionsList;
  }, [patrimoine]);

  const priorityColors = {
    high: 'border-red-500 bg-red-500/10',
    medium: 'border-yellow-500 bg-yellow-500/10',
    low: 'border-blue-500 bg-blue-500/10'
  };

  const priorityIcons = {
    high: <Zap className="w-5 h-5 text-red-400" />,
    medium: <Target className="w-5 h-5 text-yellow-400" />,
    low: <ArrowRightLeft className="w-5 h-5 text-blue-400" />
  };

  if (suggestions.length === 0) {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-8 text-center">
        <div className="text-4xl mb-4">🎯</div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Allocation Équilibrée
        </h3>
        <p className="text-slate-300">
          Votre portefeuille est bien équilibré. Aucun rééquilibrage nécessaire.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-semibold text-white mb-2">Suggestions de Rééquilibrage</h3>
        <p className="text-sm text-slate-400">{suggestions.length} suggestion(s) d'optimisation</p>
      </div>

      {/* Suggestions */}
      {suggestions.map((suggestion, index) => (
        <div
          key={index}
          className={`border-2 rounded-xl p-6 ${priorityColors[suggestion.priorite]}`}
        >
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0 mt-1">
              {priorityIcons[suggestion.priorite]}
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-white mb-2">{suggestion.titre}</h4>
              <p className="text-sm text-slate-300">{suggestion.description}</p>
            </div>
          </div>

          {/* Opérations */}
          <div className="space-y-3 mt-4">
            {suggestion.operations.map((op, opIndex) => (
              <div
                key={opIndex}
                className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700"
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-2xl">{op.icon}</span>
                  <div>
                    <div className="text-sm text-slate-400">De</div>
                    <div className="text-white font-semibold">{op.from}</div>
                  </div>
                </div>

                <ArrowRightLeft className="w-5 h-5 text-purple-400 flex-shrink-0" />

                <div className="flex items-center gap-3 flex-1">
                  <div className="text-right">
                    <div className="text-sm text-slate-400">Vers</div>
                    <div className="text-white font-semibold">{op.to}</div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-sm text-slate-400">Montant</div>
                  <div className="text-lg font-bold text-white">
                    {formatCurrency(op.montant)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Impact */}
          <div className="mt-4 p-4 bg-slate-800/50 rounded-lg">
            <div className="text-xs text-slate-400 mb-2">IMPACT ESTIMÉ</div>
            <div className="text-sm text-slate-300">
              {suggestion.type === 'rebalancing' && 'Allocation optimale 20/60/20 atteinte'}
              {suggestion.type === 'optimization' && 'Amélioration rendement potentiel estimé'}
              {suggestion.type === 'diversification' && 'Réduction risque concentration'}
              {suggestion.type === 'securisation' && 'Protection gains réalisés'}
            </div>
          </div>
        </div>
      ))}

      {/* Info */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <ArrowRightLeft className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-slate-300">
            <div className="font-semibold text-white mb-1">Rééquilibrage Intelligent</div>
            Ces suggestions sont calculées automatiquement selon votre allocation actuelle et les objectifs cibles.
            Elles visent à optimiser le couple rendement/risque de votre patrimoine.
          </div>
        </div>
      </div>
    </div>
  );
};

export default RebalancingSuggestions;
