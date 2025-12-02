import React, { useMemo } from 'react';

const PortfolioSummary = ({ portfolio }) => {
  const summary = useMemo(() => {
    const totalInvesti = portfolio.reduce((sum, pos) => 
      sum + (pos.quantite * pos.prixEntree), 0
    );
    
    const totalValorise = portfolio.reduce((sum, pos) => 
      sum + (pos.calculs?.valeurPosition || 0), 0
    );
    
    const totalPlusValue = portfolio.reduce((sum, pos) => 
      sum + (pos.calculs?.plusValueEuro || 0), 0
    );
    
    const totalPlusValuePourcent = totalInvesti > 0 
      ? (totalPlusValue / totalInvesti) * 100 
      : 0;

    return {
      totalInvesti,
      totalValorise,
      totalPlusValue,
      totalPlusValuePourcent,
      positions: portfolio.length
    };
  }, [portfolio]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

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
};

export default PortfolioSummary;

