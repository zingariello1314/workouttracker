/**
 * Net Worth Details - Calculs détaillés par actif
 * Affichage formules et décomposition calculs
 */

import { useMemo } from 'react';
import { Calculator, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../../../utils/planificateurUtils';

const NetWorthDetails = ({ patrimoine }) => {
  // Calculs détaillés
  const details = useMemo(() => {
    if (!patrimoine) return null;

    return {
      or: {
        capitalInvesti: patrimoine.or.capitalInvesti,
        grammes: patrimoine.or.grammes,
        coursActuel: patrimoine.or.grammes > 0 ? patrimoine.or.valorisation / patrimoine.or.grammes : 0,
        valorisation: patrimoine.or.valorisation,
        plusValue: patrimoine.or.plusValue,
        rendement: patrimoine.or.plusValuePourcent
      },
      bourse: {
        capitalInvesti: patrimoine.bourse.capitalInvesti,
        positions: patrimoine.bourse.positions,
        valorisation: patrimoine.bourse.valorisation,
        plusValue: patrimoine.bourse.plusValue,
        rendement: patrimoine.bourse.plusValuePourcent
      },
      cash: {
        capitalInvesti: patrimoine.cash.capitalInvesti,
        valorisation: patrimoine.cash.valorisation,
        plusValue: patrimoine.cash.plusValue,
        rendement: patrimoine.cash.plusValuePourcent
      }
    };
  }, [patrimoine]);

  if (!details) {
    return (
      <div className="text-center text-slate-400 py-8">
        Aucune donnée disponible
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Or Physique */}
      <div className="bg-slate-800/50 border border-yellow-500/30 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">🪙</span>
          <div>
            <h3 className="text-xl font-semibold text-white">Or Physique Net Worth</h3>
            <p className="text-sm text-slate-400">Calculs détaillés valorisation or</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Capital Investi */}
          <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-yellow-400" />
              <span className="text-slate-300">Capital Investi</span>
            </div>
            <span className="text-white font-semibold">
              {formatCurrency(details.or.capitalInvesti)}
            </span>
          </div>

          {/* Grammes */}
          <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-yellow-400">⚖️</span>
              <span className="text-slate-300">Grammes Détenus</span>
            </div>
            <span className="text-white font-semibold">
              {details.or.grammes.toFixed(2)}g
            </span>
          </div>

          {/* Cours Actuel */}
          <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-yellow-400">💰</span>
              <span className="text-slate-300">Cours Or Actuel</span>
            </div>
            <span className="text-white font-semibold">
              {formatCurrency(details.or.coursActuel)}/g
            </span>
          </div>

          {/* Formule */}
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="text-xs text-yellow-400 mb-2 font-mono">FORMULE</div>
            <div className="text-sm text-white font-mono">
              Valorisation = {details.or.grammes.toFixed(2)}g × {formatCurrency(details.or.coursActuel)}/g
            </div>
            <div className="text-lg text-white font-bold mt-2">
              = {formatCurrency(details.or.valorisation)}
            </div>
          </div>

          {/* Plus-Value */}
          <div className={`p-4 border-2 rounded-lg ${
            details.or.plusValue >= 0 
              ? 'bg-green-500/10 border-green-500' 
              : 'bg-red-500/10 border-red-500'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {details.or.plusValue >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-green-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-400" />
                )}
                <span className="text-white font-semibold">Plus-Value</span>
              </div>
              <div className="text-right">
                <div className={`text-xl font-bold ${
                  details.or.plusValue >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {details.or.plusValue >= 0 ? '+' : ''}{formatCurrency(details.or.plusValue)}
                </div>
                <div className={`text-sm ${
                  details.or.plusValue >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {details.or.rendement >= 0 ? '+' : ''}{details.or.rendement.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bourse */}
      <div className="bg-slate-800/50 border border-blue-500/30 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">📈</span>
          <div>
            <h3 className="text-xl font-semibold text-white">Bourse Net Worth</h3>
            <p className="text-sm text-slate-400">Valorisation portfolio avec tracking injections</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Capital Investi */}
          <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-400" />
              <span className="text-slate-300">Capital Investi (Injections cumulées)</span>
            </div>
            <span className="text-white font-semibold">
              {formatCurrency(details.bourse.capitalInvesti)}
            </span>
          </div>

          {/* Positions */}
          <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-blue-400">📊</span>
              <span className="text-slate-300">Nombre Positions</span>
            </div>
            <span className="text-white font-semibold">
              {details.bourse.positions}
            </span>
          </div>

          {/* Valorisation */}
          <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-blue-400">💎</span>
              <span className="text-slate-300">Valorisation Portfolio Live</span>
            </div>
            <span className="text-white font-semibold">
              {formatCurrency(details.bourse.valorisation)}
            </span>
          </div>

          {/* Plus-Value */}
          <div className={`p-4 border-2 rounded-lg ${
            details.bourse.plusValue >= 0 
              ? 'bg-green-500/10 border-green-500' 
              : 'bg-red-500/10 border-red-500'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {details.bourse.plusValue >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-green-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-400" />
                )}
                <span className="text-white font-semibold">Plus-Value</span>
              </div>
              <div className="text-right">
                <div className={`text-xl font-bold ${
                  details.bourse.plusValue >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {details.bourse.plusValue >= 0 ? '+' : ''}{formatCurrency(details.bourse.plusValue)}
                </div>
                <div className={`text-sm ${
                  details.bourse.plusValue >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {details.bourse.rendement >= 0 ? '+' : ''}{details.bourse.rendement.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cash */}
      <div className="bg-slate-800/50 border border-green-500/30 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">💵</span>
          <div>
            <h3 className="text-xl font-semibold text-white">Cash Net Worth</h3>
            <p className="text-sm text-slate-400">Liquidités accumulées</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Capital Investi */}
          <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-green-400" />
              <span className="text-slate-300">Capital Investi</span>
            </div>
            <span className="text-white font-semibold">
              {formatCurrency(details.cash.capitalInvesti)}
            </span>
          </div>

          {/* Cash Détenu */}
          <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-green-400">💰</span>
              <span className="text-slate-300">Cash Détenu</span>
            </div>
            <span className="text-white font-semibold">
              {formatCurrency(details.cash.valorisation)}
            </span>
          </div>

          {/* Note */}
          <div className="p-4 bg-slate-700/30 rounded-lg">
            <div className="text-xs text-slate-400 mb-1">NOTE</div>
            <div className="text-sm text-slate-300">
              Le cash ne génère pas de rendement. Valorisation = Capital investi.
            </div>
          </div>
        </div>
      </div>

      {/* Total Patrimoine */}
      <div className="bg-gradient-to-br from-purple-600/20 to-purple-700/20 border-2 border-purple-500 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">💎</span>
          <div>
            <h3 className="text-xl font-semibold text-white">TOTAL PATRIMOINE NET WORTH</h3>
            <p className="text-sm text-purple-300">Consolidation globale</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <div className="text-sm text-slate-400 mb-2">Total Investi</div>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(patrimoine.total.investi)}
            </div>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <div className="text-sm text-slate-400 mb-2">Total Valorisé</div>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(patrimoine.total.valorise)}
            </div>
          </div>
          <div className={`p-4 rounded-lg ${
            patrimoine.total.plusValue >= 0 
              ? 'bg-green-500/20 border border-green-500' 
              : 'bg-red-500/20 border border-red-500'
          }`}>
            <div className="text-sm text-slate-400 mb-2">Plus-Value Globale</div>
            <div className={`text-2xl font-bold ${
              patrimoine.total.plusValue >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {patrimoine.total.plusValue >= 0 ? '+' : ''}{formatCurrency(patrimoine.total.plusValue)}
            </div>
            <div className={`text-sm ${
              patrimoine.total.plusValue >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {patrimoine.total.plusValuePourcent >= 0 ? '+' : ''}{patrimoine.total.plusValuePourcent.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetWorthDetails;
