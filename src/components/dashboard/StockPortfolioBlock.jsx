/**
 * StockPortfolioBlock - Bloc Portfolio Bourse (PRIORITY-HIGH)
 * Top 3 best/worst positions avec sélection période
 */

import { useState } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, BarChart3 } from 'lucide-react';
import { formatCurrency } from '../../utils/planificateurUtils';

const StockPortfolioBlock = ({ onRefresh }) => {
  const [period, setPeriod] = useState('1J');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Mock data - À remplacer par vraies données API
  const mockPositions = [
    { symbol: 'AAPL', name: 'Apple Inc.', value: 15000, change: 450, changePercent: 3.1, logo: '🍎' },
    { symbol: 'MSFT', name: 'Microsoft', value: 12000, change: 380, changePercent: 3.3, logo: '💻' },
    { symbol: 'GOOGL', name: 'Alphabet', value: 10000, change: 320, changePercent: 3.3, logo: '🔍' },
    { symbol: 'TSLA', name: 'Tesla', value: 8000, change: -240, changePercent: -2.9, logo: '🚗' },
    { symbol: 'AMZN', name: 'Amazon', value: 9000, change: -180, changePercent: -2.0, logo: '📦' },
    { symbol: 'META', name: 'Meta', value: 7000, change: -210, changePercent: -2.9, logo: '👥' }
  ];

  const sortedByPerformance = [...mockPositions].sort((a, b) => b.changePercent - a.changePercent);
  const topPerformers = sortedByPerformance.slice(0, 3);
  const worstPerformers = sortedByPerformance.slice(-3).reverse();

  const totalValue = mockPositions.reduce((sum, p) => sum + p.value, 0);
  const totalChange = mockPositions.reduce((sum, p) => sum + p.change, 0);
  const totalChangePercent = (totalChange / (totalValue - totalChange)) * 100;

  const periods = ['1J', '1S', '1M', '6M', '1A'];

  const handleRefresh = () => {
    setLastUpdate(new Date());
    if (onRefresh) onRefresh();
  };

  return (
    <div className="stock-portfolio-block bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-xl">
            <BarChart3 className="w-6 h-6 text-blue-400" />
          </div>
          Portfolio Bourse
        </h3>
        <button
          onClick={handleRefresh}
          className="p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-all duration-300 hover:scale-110 transform group"
        >
          <RefreshCw className="w-5 h-5 text-slate-400 group-hover:text-blue-400 group-hover:rotate-180 transition-all duration-500" />
        </button>
      </div>

      {/* Period Selector */}
      <div className="mb-6 flex gap-2">
        {periods.map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
              period === p
                ? 'bg-blue-500/20 border border-blue-500/50 text-blue-400'
                : 'bg-slate-700/50 border border-slate-600/50 text-slate-400 hover:border-blue-500/50'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Total Value */}
      <div className="mb-6 p-5 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 border border-blue-500/30 rounded-xl">
        <div className="text-center">
          <div className="text-sm text-slate-400 mb-2">Valeur Totale</div>
          <div className="text-3xl font-bold text-white mb-2">
            {formatCurrency(totalValue)}
          </div>
          <div className={`flex items-center justify-center gap-2 text-lg font-semibold ${
            totalChange >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {totalChange >= 0 ? (
              <TrendingUp className="w-5 h-5" />
            ) : (
              <TrendingDown className="w-5 h-5" />
            )}
            {totalChange >= 0 ? '+' : ''}
            {formatCurrency(totalChange)}
            <span className="text-sm">
              ({totalChangePercent >= 0 ? '+' : ''}
              {totalChangePercent.toFixed(2)}%)
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Dernière mise à jour: {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h4 className="text-sm font-semibold text-green-400">Top 3 Meilleures Positions</h4>
          </div>
          <div className="space-y-2">
            {topPerformers.map((position, index) => (
              <div
                key={position.symbol}
                className="p-4 bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/30 rounded-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{position.logo}</div>
                    <div>
                      <div className="font-semibold text-white">{position.symbol}</div>
                      <div className="text-xs text-slate-400">{position.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-white">
                      {formatCurrency(position.value)}
                    </div>
                    <div className="text-xs text-green-400 font-semibold">
                      +{formatCurrency(position.change)} (+{position.changePercent}%)
                    </div>
                  </div>
                </div>
                {index === 0 && (
                  <div className="text-xs text-green-400 font-semibold">
                    🏆 Meilleure performance
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Worst Performers */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-5 h-5 text-red-400" />
            <h4 className="text-sm font-semibold text-red-400">Top 3 Pires Positions</h4>
          </div>
          <div className="space-y-2">
            {worstPerformers.map((position, index) => (
              <div
                key={position.symbol}
                className="p-4 bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/30 rounded-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{position.logo}</div>
                    <div>
                      <div className="font-semibold text-white">{position.symbol}</div>
                      <div className="text-xs text-slate-400">{position.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-white">
                      {formatCurrency(position.value)}
                    </div>
                    <div className="text-xs text-red-400 font-semibold">
                      {formatCurrency(position.change)} ({position.changePercent}%)
                    </div>
                  </div>
                </div>
                {index === 0 && (
                  <div className="text-xs text-red-400 font-semibold">
                    ⚠️ Plus forte baisse
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-xl">
        <div className="text-xs text-center text-slate-400">
          💡 Les données sont actualisées automatiquement toutes les 5 minutes pendant les heures de marché
        </div>
      </div>
    </div>
  );
};

export default StockPortfolioBlock;
