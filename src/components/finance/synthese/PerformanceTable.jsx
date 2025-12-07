/**
 * Table Performance - Calculs Plus-Values Automatisés
 * Affichage détaillé performance par actif
 */

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency } from '../../../utils/planificateurUtils';

const PerformanceTable = ({ patrimoine }) => {
  // Calcul données table
  const tableData = useMemo(() => {
    if (!patrimoine) return [];

    return [
      {
        type: 'Or Physique',
        icon: '🪙',
        capital: patrimoine.or.capitalInvesti,
        valorisation: patrimoine.or.valorisation,
        gains: patrimoine.or.plusValue,
        rendement: patrimoine.or.plusValuePourcent,
        color: 'yellow'
      },
      {
        type: 'Bourse',
        icon: '📈',
        capital: patrimoine.bourse.capitalInvesti,
        valorisation: patrimoine.bourse.valorisation,
        gains: patrimoine.bourse.plusValue,
        rendement: patrimoine.bourse.plusValuePourcent,
        color: 'blue'
      },
      {
        type: 'Cash',
        icon: '💵',
        capital: patrimoine.cash.capitalInvesti,
        valorisation: patrimoine.cash.valorisation,
        gains: patrimoine.cash.plusValue,
        rendement: patrimoine.cash.plusValuePourcent,
        color: 'green'
      },
      {
        type: 'TOTAL',
        icon: '💎',
        capital: patrimoine.total.investi,
        valorisation: patrimoine.total.valorise,
        gains: patrimoine.total.plusValue,
        rendement: patrimoine.total.plusValuePourcent,
        color: 'purple',
        isTotal: true
      }
    ];
  }, [patrimoine]);

  const getColorClasses = (color, isTotal = false) => {
    const colors = {
      yellow: isTotal ? 'bg-yellow-500/20 border-yellow-500' : 'border-yellow-500/30',
      blue: isTotal ? 'bg-blue-500/20 border-blue-500' : 'border-blue-500/30',
      green: isTotal ? 'bg-green-500/20 border-green-500' : 'border-green-500/30',
      purple: 'bg-purple-500/20 border-purple-500'
    };
    return colors[color] || '';
  };

  const getPerformanceIcon = (rendement) => {
    if (rendement > 0) return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (rendement < 0) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  const getPerformanceColor = (rendement) => {
    if (rendement > 0) return 'text-green-400';
    if (rendement < 0) return 'text-red-400';
    return 'text-slate-400';
  };

  if (!patrimoine) {
    return (
      <div className="text-center text-slate-400 py-8">
        Aucune donnée disponible
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
        <span className="text-2xl" aria-hidden="true">📊</span>
        Performance Détaillée
      </h3>

      {/* Version Desktop - Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">
                Type
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300">
                Capital Investi
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300">
                Valorisation
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300">
                Gains/Pertes
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300">
                Rendement
              </th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, index) => (
              <tr 
                key={index}
                className={`border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors ${
                  row.isTotal ? `border-2 ${getColorClasses(row.color, true)}` : ''
                }`}
              >
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl" aria-hidden="true">{row.icon}</span>
                    <span className={`font-medium ${
                      row.isTotal ? 'text-white text-lg' : 'text-slate-200'
                    }`}>
                      {row.type}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className={`${row.isTotal ? 'text-white font-semibold' : 'text-slate-300'}`}>
                    {formatCurrency(row.capital)}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className={`${row.isTotal ? 'text-white font-semibold' : 'text-slate-300'}`}>
                    {formatCurrency(row.valorisation)}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {getPerformanceIcon(row.rendement)}
                    <span className={`font-semibold ${getPerformanceColor(row.rendement)}`}>
                      {row.gains >= 0 ? '+' : ''}{formatCurrency(row.gains)}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className={`font-semibold ${getPerformanceColor(row.rendement)}`}>
                    {row.rendement >= 0 ? '+' : ''}{row.rendement.toFixed(2)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Version Mobile - Cards */}
      <div className="md:hidden space-y-4">
        {tableData.map((row, index) => (
          <div 
            key={index}
            className={`border-2 rounded-xl p-4 ${getColorClasses(row.color, row.isTotal)}`}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl" aria-hidden="true">{row.icon}</span>
              <span className={`font-semibold ${
                row.isTotal ? 'text-white text-lg' : 'text-slate-200'
              }`}>
                {row.type}
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Capital Investi</span>
                <span className="text-white font-medium">
                  {formatCurrency(row.capital)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Valorisation</span>
                <span className="text-white font-medium">
                  {formatCurrency(row.valorisation)}
                </span>
              </div>
              
              <div className="h-px bg-slate-700"></div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Gains/Pertes</span>
                <div className="flex items-center gap-2">
                  {getPerformanceIcon(row.rendement)}
                  <span className={`font-semibold ${getPerformanceColor(row.rendement)}`}>
                    {row.gains >= 0 ? '+' : ''}{formatCurrency(row.gains)}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Rendement</span>
                <span className={`font-semibold ${getPerformanceColor(row.rendement)}`}>
                  {row.rendement >= 0 ? '+' : ''}{row.rendement.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Légende */}
      <div className="mt-6 pt-4 border-t border-slate-700">
        <div className="flex flex-wrap gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3 h-3 text-green-400" />
            <span>Performance positive</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown className="w-3 h-3 text-red-400" />
            <span>Performance négative</span>
          </div>
          <div className="flex items-center gap-2">
            <Minus className="w-3 h-3 text-slate-400" />
            <span>Performance neutre</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceTable;
