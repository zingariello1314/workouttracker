/**
 * PatrimonyLiveBlock - Bloc Patrimoine Temps Réel (PRIORITY-MAX)
 * Affichage patrimoine avec jauges circulaires et alertes
 */

import { TrendingUp, TrendingDown, RefreshCw, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../utils/planificateurUtils';
import CircularGauge from './CircularGauge';

const PatrimonyLiveBlock = ({ patrimony, onRefresh }) => {
  if (!patrimony) {
    return (
      <div className="patrimony-live-block bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
        <div className="text-center py-8 text-slate-400">
          <div className="text-4xl mb-3">💎</div>
          <div>Aucune donnée patrimoniale</div>
          <div className="text-xs mt-2">Configurez vos actifs dans Finance</div>
        </div>
      </div>
    );
  }

  const { or, bourse, cash, total } = patrimony;

  // Calculate allocation percentages
  const totalValue = total.valorise || 1;
  const orPercent = ((or.valorisation / totalValue) * 100).toFixed(1);
  const boursePercent = ((bourse.valorisation / totalValue) * 100).toFixed(1);
  const cashPercent = ((cash.valorisation / totalValue) * 100).toFixed(1);

  // Target allocations (example - should come from settings)
  const targets = {
    or: 30,
    bourse: 50,
    cash: 20
  };

  // Calculate health status
  const getHealthStatus = (current, target) => {
    const diff = Math.abs(current - target);
    if (diff <= 5) return 'good';
    if (diff <= 10) return 'warning';
    return 'critical';
  };

  const orHealth = getHealthStatus(parseFloat(orPercent), targets.or);
  const bourseHealth = getHealthStatus(parseFloat(boursePercent), targets.bourse);
  const cashHealth = getHealthStatus(parseFloat(cashPercent), targets.cash);

  const globalHealth = [orHealth, bourseHealth, cashHealth].includes('critical') 
    ? 'critical' 
    : [orHealth, bourseHealth, cashHealth].includes('warning') 
    ? 'warning' 
    : 'good';

  const healthColors = {
    good: { bg: 'from-green-500/10 to-green-600/10', border: 'border-green-500/30', text: 'text-green-400' },
    warning: { bg: 'from-yellow-500/10 to-yellow-600/10', border: 'border-yellow-500/30', text: 'text-yellow-400' },
    critical: { bg: 'from-red-500/10 to-red-600/10', border: 'border-red-500/30', text: 'text-red-400' }
  };

  const healthLabels = {
    good: 'Excellent',
    warning: 'Attention',
    critical: 'Critique'
  };

  const lastUpdate = new Date(patrimony.lastUpdate).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="patrimony-live-block bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-xl">
            <span className="text-2xl">💎</span>
          </div>
          Patrimoine Temps Réel
        </h3>
        <button
          onClick={onRefresh}
          className="p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-all duration-300 hover:scale-110 transform group"
          aria-label="Actualiser"
        >
          <RefreshCw className="w-5 h-5 text-slate-400 group-hover:text-purple-400 group-hover:rotate-180 transition-all duration-500" />
        </button>
      </div>

      {/* Total Value & Performance */}
      <div className="mb-6 p-5 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 border border-purple-500/30 rounded-xl">
        <div className="text-center">
          <div className="text-sm text-slate-400 mb-2">Valeur Totale</div>
          <div className="text-4xl font-bold text-white mb-3">
            {formatCurrency(total.valorise)}
          </div>
          <div className={`flex items-center justify-center gap-2 text-lg font-semibold ${
            total.plusValue >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {total.plusValue >= 0 ? (
              <TrendingUp className="w-5 h-5" />
            ) : (
              <TrendingDown className="w-5 h-5" />
            )}
            {total.plusValue >= 0 ? '+' : ''}
            {formatCurrency(total.plusValue)}
            <span className="text-sm">
              ({total.plusValuePourcent >= 0 ? '+' : ''}
              {total.plusValuePourcent.toFixed(2)}%)
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Dernière mise à jour: {lastUpdate}
          </div>
        </div>
      </div>

      {/* Circular Gauges */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Or */}
        <div className="text-center">
          <CircularGauge
            value={parseFloat(orPercent)}
            max={100}
            size={100}
            strokeWidth={8}
            color="#eab308"
            showPercentage={false}
            className="mx-auto mb-3"
          />
          <div className="text-xs text-slate-400 mb-1">🪙 Or</div>
          <div className="text-lg font-bold text-yellow-400">{orPercent}%</div>
          <div className="text-xs text-slate-500">Cible: {targets.or}%</div>
          <div className={`text-xs mt-1 ${healthColors[orHealth].text}`}>
            {healthLabels[orHealth]}
          </div>
        </div>

        {/* Bourse */}
        <div className="text-center">
          <CircularGauge
            value={parseFloat(boursePercent)}
            max={100}
            size={100}
            strokeWidth={8}
            color="#3b82f6"
            showPercentage={false}
            className="mx-auto mb-3"
          />
          <div className="text-xs text-slate-400 mb-1">📈 Bourse</div>
          <div className="text-lg font-bold text-blue-400">{boursePercent}%</div>
          <div className="text-xs text-slate-500">Cible: {targets.bourse}%</div>
          <div className={`text-xs mt-1 ${healthColors[bourseHealth].text}`}>
            {healthLabels[bourseHealth]}
          </div>
        </div>

        {/* Cash */}
        <div className="text-center">
          <CircularGauge
            value={parseFloat(cashPercent)}
            max={100}
            size={100}
            strokeWidth={8}
            color="#10b981"
            showPercentage={false}
            className="mx-auto mb-3"
          />
          <div className="text-xs text-slate-400 mb-1">💵 Cash</div>
          <div className="text-lg font-bold text-green-400">{cashPercent}%</div>
          <div className="text-xs text-slate-500">Cible: {targets.cash}%</div>
          <div className={`text-xs mt-1 ${healthColors[cashHealth].text}`}>
            {healthLabels[cashHealth]}
          </div>
        </div>
      </div>

      {/* Global Health Status */}
      <div className={`p-4 bg-gradient-to-r ${healthColors[globalHealth].bg} border ${healthColors[globalHealth].border} rounded-xl`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {globalHealth === 'critical' && <AlertTriangle className={`w-5 h-5 ${healthColors[globalHealth].text}`} />}
            <div>
              <div className="text-sm font-semibold text-white">Statut Global</div>
              <div className={`text-xs ${healthColors[globalHealth].text}`}>
                {healthLabels[globalHealth]}
              </div>
            </div>
          </div>
          <div className={`text-2xl font-bold ${healthColors[globalHealth].text}`}>
            {globalHealth === 'good' && '✓'}
            {globalHealth === 'warning' && '⚠️'}
            {globalHealth === 'critical' && '⚠️'}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {globalHealth !== 'good' && (
        <div className="mt-4 space-y-2">
          {orHealth !== 'good' && (
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span className="text-yellow-400">•</span>
              Or: Écart de {Math.abs(parseFloat(orPercent) - targets.or).toFixed(1)}% vs cible
            </div>
          )}
          {bourseHealth !== 'good' && (
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span className="text-yellow-400">•</span>
              Bourse: Écart de {Math.abs(parseFloat(boursePercent) - targets.bourse).toFixed(1)}% vs cible
            </div>
          )}
          {cashHealth !== 'good' && (
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span className="text-yellow-400">•</span>
              Cash: Écart de {Math.abs(parseFloat(cashPercent) - targets.cash).toFixed(1)}% vs cible
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PatrimonyLiveBlock;
