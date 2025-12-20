import React, { useState } from 'react';
import TradingViewWidget from './TradingViewWidget';

const StockChart = ({ ticker, dateAchat, prixEntree }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('1m');

  // Mapping des périodes pour TradingView
  const intervalMap = {
    '1j': '1',
    '5j': '5',
    '1m': 'D',
    '3m': 'D',
    '6m': 'W',
    '1a': 'M',
    'Max': 'M'
  };

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
  };

  if (!ticker) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-400">
        Aucun ticker fourni
      </div>
    );
  }

  return (
    <div className="stock-chart-container space-y-4">
      {/* Contrôles période */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-2">
          {['1j', '5j', '1m', '3m', '6m', '1a', 'Max'].map(p => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                selectedPeriod === p
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Graphique TradingView */}
      <div className="bg-slate-900 rounded-lg p-4">
        <TradingViewWidget 
          key={`${ticker}-${intervalMap[selectedPeriod] || 'D'}`}
          ticker={ticker} 
          interval={intervalMap[selectedPeriod] || 'D'} 
          height={500} 
        />
      </div>
    </div>
  );
};

export default StockChart;

