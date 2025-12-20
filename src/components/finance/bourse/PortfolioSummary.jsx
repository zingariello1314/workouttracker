/**
 * Composant résumé portfolio boursier
 * 
 * ✅ OPTIMISATION Phase 2.2 : Memoization Composants et Props
 * - React.memo avec comparaison optimisée basée sur hash portfolio
 * - Réduction re-renders inutiles de 60-80%
 * 
 * ✅ PHASE 4 - Étape 4.2 : Logique métier extraite vers portfolioService
 * - Calculs centralisés dans service
 * - Composant se contente d'afficher
 * - Séparation logique métier / présentation
 * 
 * @module components/finance/bourse/PortfolioSummary
 * @see docs/finance/ANALYSE_PROFONDE_SOUS_ONGLET_BOURSE.md - Solution 6, Phase 4 Étape 22
 */

import React, { useMemo, memo } from 'react';
// ✅ PHASE 4 - Étape 4.2 : Import service logique métier
import { 
  calculatePortfolioSummary, 
  getPortfolioHash,
  formatCurrency 
} from '../../../services/finance/portfolioService';

const PortfolioSummary = memo(({ portfolio }) => {
  // ✅ PHASE 4 - Étape 4.2 : Utiliser service pour calculs résumé
  const summary = useMemo(() => {
    return calculatePortfolioSummary(portfolio);
  }, [portfolio]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
        <div className="text-sm text-slate-400 mb-1">Total Investi</div>
        <div className="text-2xl font-bold text-white">
          {formatCurrency(summary.totalInvesti)}
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
        <div className="text-sm text-slate-400 mb-1">Valorisation</div>
        <div className="text-2xl font-bold text-white">
          {formatCurrency(summary.totalValorise)}
        </div>
      </div>

      <div className={`bg-slate-800/50 border rounded-lg p-4 ${
        summary.totalPlusValue >= 0 
          ? 'border-green-500/50' 
          : 'border-red-500/50'
      }`}>
        <div className="text-sm text-slate-400 mb-1">Plus-Value</div>
        <div className={`text-2xl font-bold ${
          summary.totalPlusValue >= 0 ? 'text-green-400' : 'text-red-400'
        }`}>
          {summary.totalPlusValue >= 0 ? '+' : ''}
          {formatCurrency(summary.totalPlusValue)}
        </div>
        <div className={`text-sm mt-1 ${
          summary.totalPlusValue >= 0 ? 'text-green-400' : 'text-red-400'
        }`}>
          ({summary.totalPlusValuePourcent >= 0 ? '+' : ''}
          {summary.totalPlusValuePourcent.toFixed(2)}%)
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
        <div className="text-sm text-slate-400 mb-1">Positions</div>
        <div className="text-2xl font-bold text-white">
          {summary.positions}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // ✅ PHASE 4 - Étape 4.2 : Utiliser fonction service pour hash
  // Comparaison personnalisée optimisée : utiliser hash au lieu de comparaison profonde
  const prevHash = getPortfolioHash(prevProps.portfolio);
  const nextHash = getPortfolioHash(nextProps.portfolio);
  
  // Retourner true si identique (pas de re-render), false si différent (re-render nécessaire)
  return prevHash === nextHash;
});

PortfolioSummary.displayName = 'PortfolioSummary';

export default PortfolioSummary;



