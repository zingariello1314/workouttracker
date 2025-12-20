import React, { useMemo } from 'react';
import { useYahooFinance } from '../../../hooks/useYahooFinance';
import { calculateRSI, calculateMACD, calculateBollingerBands } from '../../../services/finance/financeCalculations';

const TechnicalIndicators = ({ ticker }) => {
  const { historicalData, loading } = useYahooFinance(ticker, {
    period: '3m',
    enabled: !!ticker,
    autoRefresh: false
  });

  // ✅ PHASE 3 - Étape 3.16 : Validation robuste avant calcul indicateurs
  const indicators = useMemo(() => {
    // ✅ PHASE 3.16 : Vérifier que historicalData est un tableau valide
    if (!historicalData || !Array.isArray(historicalData) || historicalData.length === 0) {
      return {
        rsi: null,
        macd: null,
        bollinger: null
      };
    }

    // ✅ PHASE 3.16 : Vérifier que les données contiennent au moins un élément avec prix
    const hasValidData = historicalData.some(d => d && (d.close !== undefined || d.prixActuel !== undefined));
    if (!hasValidData) {
      return {
        rsi: null,
        macd: null,
        bollinger: null
      };
    }

    try {
      const rsi = calculateRSI(historicalData, 14);
      const macd = calculateMACD(historicalData);
      const bollinger = calculateBollingerBands(historicalData, 20, 2);

      return {
        rsi,
        macd,
        bollinger
      };
    } catch (error) {
      // ✅ PHASE 3.16 : Gestion erreur gracieuse si calcul échoue
      console.error('Error calculating technical indicators:', error);
      return {
        rsi: null,
        macd: null,
        bollinger: null
      };
    }
  }, [historicalData]);

  if (loading) {
    return (
      <div className="text-center py-4 text-slate-400">
        Chargement indicateurs...
      </div>
    );
  }

  if (!indicators.rsi && !indicators.macd && !indicators.bollinger) {
    return (
      <div className="text-center py-4 text-slate-400 text-sm">
        Données insuffisantes pour calculer les indicateurs techniques
      </div>
    );
  }

  const getRSIColor = (rsi) => {
    if (rsi < 30) return 'text-green-400'; // Survente = opportunité
    if (rsi > 70) return 'text-red-400'; // Surachat = danger
    return 'text-slate-400';
  };

  const getRSILabel = (rsi) => {
    if (rsi < 30) return 'Survente';
    if (rsi > 70) return 'Surachat';
    return 'Neutre';
  };

  return (
    <div className="technical-indicators space-y-4">
      <h4 className="font-semibold text-white mb-3">Indicateurs Techniques</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* RSI */}
        {indicators.rsi !== null && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-2">RSI (14)</div>
            <div className={`text-2xl font-bold ${getRSIColor(indicators.rsi)}`}>
              {indicators.rsi.toFixed(2)}
            </div>
            <div className={`text-sm mt-1 ${getRSIColor(indicators.rsi)}`}>
              {getRSILabel(indicators.rsi)}
            </div>
            <div className="mt-2 w-full bg-slate-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  indicators.rsi < 30 ? 'bg-green-500' :
                  indicators.rsi > 70 ? 'bg-red-500' : 'bg-blue-500'
                }`}
                style={{ width: `${indicators.rsi}%` }}
              />
            </div>
          </div>
        )}

        {/* MACD */}
        {indicators.macd && indicators.macd.macd !== null && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-2">MACD</div>
            <div className="space-y-1">
              <div className="text-white">
                <span className="text-xs text-slate-400">MACD: </span>
                <span className={indicators.macd.macd >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {indicators.macd.macd.toFixed(4)}
                </span>
              </div>
              {indicators.macd.signal !== null && (
                <div className="text-white">
                  <span className="text-xs text-slate-400">Signal: </span>
                  <span>{indicators.macd.signal.toFixed(4)}</span>
                </div>
              )}
              {indicators.macd.histogram !== null && (
                <div className="text-white">
                  <span className="text-xs text-slate-400">Histogram: </span>
                  <span className={indicators.macd.histogram >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {indicators.macd.histogram.toFixed(4)}
                  </span>
                </div>
              )}
            </div>
            {indicators.macd.histogram !== null && (
              <div className="mt-2 text-xs text-slate-400">
                {indicators.macd.histogram >= 0 ? '📈 Haussier' : '📉 Baissier'}
              </div>
            )}
          </div>
        )}

        {/* Bollinger Bands */}
        {indicators.bollinger && indicators.bollinger.middle !== null && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-2">Bollinger Bands</div>
            <div className="space-y-1 text-sm">
              <div className="text-red-400">
                Supérieure: {indicators.bollinger.upper?.toFixed(2) || 'N/A'}
              </div>
              <div className="text-slate-300">
                Moyenne: {indicators.bollinger.middle.toFixed(2)}
              </div>
              <div className="text-green-400">
                Inférieure: {indicators.bollinger.lower?.toFixed(2) || 'N/A'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TechnicalIndicators;



