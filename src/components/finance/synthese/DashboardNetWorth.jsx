/**
 * Dashboard Net Worth Consolidé
 * Visualisation globale patrimoine avec graphiques interactifs
 */

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../../../utils/planificateurUtils';

const DashboardNetWorth = ({ patrimoine }) => {
  // Données pour graphique barres
  const chartData = useMemo(() => {
    if (!patrimoine) return [];

    return [
      {
        actif: 'Or',
        investi: patrimoine.or.capitalInvesti,
        valorise: patrimoine.or.valorisation,
        plusValue: patrimoine.or.plusValue,
        color: '#f59e0b'
      },
      {
        actif: 'Bourse',
        investi: patrimoine.bourse.capitalInvesti,
        valorise: patrimoine.bourse.valorisation,
        plusValue: patrimoine.bourse.plusValue,
        color: '#3b82f6'
      },
      {
        actif: 'Cash',
        investi: patrimoine.cash.capitalInvesti,
        valorise: patrimoine.cash.valorisation,
        plusValue: patrimoine.cash.plusValue,
        color: '#10b981'
      }
    ];
  }, [patrimoine]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 shadow-xl">
          <p className="text-white font-semibold mb-2">{data.actif}</p>
          <p className="text-slate-300 text-sm">
            Investi: {formatCurrency(data.investi)}
          </p>
          <p className="text-slate-300 text-sm">
            Valorisé: {formatCurrency(data.valorise)}
          </p>
          <p className={`text-sm font-semibold ${data.plusValue >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            Plus-value: {data.plusValue >= 0 ? '+' : ''}{formatCurrency(data.plusValue)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (!patrimoine) {
    return (
      <div className="text-center text-slate-400 py-8">
        Aucune donnée disponible
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Graphique Principal */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">💎</span>
          Net Worth Consolidé
        </h3>
        
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} barGap={8}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="actif" 
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af' }}
            />
            <YAxis 
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af' }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="investi" 
              name="Capital Investi"
              radius={[8, 8, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-investi-${index}`} fill="#6b7280" />
              ))}
            </Bar>
            <Bar 
              dataKey="valorise" 
              name="Valorisation Actuelle"
              radius={[8, 8, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-valorise-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Totaux Consolidés */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Investi */}
        <div className="bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-slate-600 rounded-xl p-6">
          <div className="text-sm text-slate-400 mb-2 font-medium">
            Total Investi
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {formatCurrency(patrimoine.total.investi)}
          </div>
          <div className="text-xs text-slate-500">
            Capital cumulé
          </div>
        </div>

        {/* Total Valorisé */}
        <div className="bg-gradient-to-br from-purple-600/30 to-purple-700/30 border-2 border-purple-500 rounded-xl p-6">
          <div className="text-sm text-purple-300 mb-2 font-medium">
            Total Valorisé
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {formatCurrency(patrimoine.total.valorise)}
          </div>
          <div className="text-xs text-purple-400">
            Valeur actuelle
          </div>
        </div>

        {/* Plus-Value Globale */}
        <div className={`bg-gradient-to-br ${
          patrimoine.total.plusValue >= 0 
            ? 'from-green-600/30 to-green-700/30 border-green-500' 
            : 'from-red-600/30 to-red-700/30 border-red-500'
        } border-2 rounded-xl p-6`}>
          <div className={`text-sm mb-2 font-medium ${
            patrimoine.total.plusValue >= 0 ? 'text-green-300' : 'text-red-300'
          }`}>
            Plus-Value Globale
          </div>
          <div className="text-3xl font-bold text-white mb-1 flex items-center gap-2">
            {patrimoine.total.plusValue >= 0 ? (
              <TrendingUp className="w-6 h-6 text-green-400" />
            ) : (
              <TrendingDown className="w-6 h-6 text-red-400" />
            )}
            {patrimoine.total.plusValue >= 0 ? '+' : ''}
            {formatCurrency(patrimoine.total.plusValue)}
          </div>
          <div className={`text-xs font-semibold ${
            patrimoine.total.plusValue >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {patrimoine.total.plusValue >= 0 ? '+' : ''}
            {patrimoine.total.plusValuePourcent.toFixed(2)}% de rendement
          </div>
        </div>
      </div>

      {/* Détails par Actif */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Or */}
        <div className="bg-slate-800/50 border border-yellow-500/30 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl" aria-hidden="true">🪙</span>
            <span className="text-xs text-yellow-400 font-semibold">OR</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Investi</span>
              <span className="text-white font-medium">
                {formatCurrency(patrimoine.or.capitalInvesti)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Valorisé</span>
              <span className="text-white font-medium">
                {formatCurrency(patrimoine.or.valorisation)}
              </span>
            </div>
            <div className="h-px bg-slate-700 my-2"></div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Plus-value</span>
              <span className={`font-semibold ${
                patrimoine.or.plusValue >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {patrimoine.or.plusValue >= 0 ? '+' : ''}
                {formatCurrency(patrimoine.or.plusValue)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Rendement</span>
              <span className={`font-semibold ${
                patrimoine.or.plusValuePourcent >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {patrimoine.or.plusValuePourcent >= 0 ? '+' : ''}
                {patrimoine.or.plusValuePourcent.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Bourse */}
        <div className="bg-slate-800/50 border border-blue-500/30 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl" aria-hidden="true">📈</span>
            <span className="text-xs text-blue-400 font-semibold">BOURSE</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Investi</span>
              <span className="text-white font-medium">
                {formatCurrency(patrimoine.bourse.capitalInvesti)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Valorisé</span>
              <span className="text-white font-medium">
                {formatCurrency(patrimoine.bourse.valorisation)}
              </span>
            </div>
            <div className="h-px bg-slate-700 my-2"></div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Plus-value</span>
              <span className={`font-semibold ${
                patrimoine.bourse.plusValue >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {patrimoine.bourse.plusValue >= 0 ? '+' : ''}
                {formatCurrency(patrimoine.bourse.plusValue)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Rendement</span>
              <span className={`font-semibold ${
                patrimoine.bourse.plusValuePourcent >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {patrimoine.bourse.plusValuePourcent >= 0 ? '+' : ''}
                {patrimoine.bourse.plusValuePourcent.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Cash */}
        <div className="bg-slate-800/50 border border-green-500/30 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl" aria-hidden="true">💵</span>
            <span className="text-xs text-green-400 font-semibold">CASH</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Investi</span>
              <span className="text-white font-medium">
                {formatCurrency(patrimoine.cash.capitalInvesti)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Valorisé</span>
              <span className="text-white font-medium">
                {formatCurrency(patrimoine.cash.valorisation)}
              </span>
            </div>
            <div className="h-px bg-slate-700 my-2"></div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Plus-value</span>
              <span className="font-semibold text-slate-400">
                {formatCurrency(patrimoine.cash.plusValue)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Rendement</span>
              <span className="font-semibold text-slate-400">
                {patrimoine.cash.plusValuePourcent.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardNetWorth;
