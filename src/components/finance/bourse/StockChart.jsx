import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, Brush
} from 'recharts';
import { useYahooFinance } from '../../../hooks/useYahooFinance';

const StockChart = ({ ticker, dateAchat, prixEntree }) => {
  const [period, setPeriod] = useState('1m');
  const [showMA, setShowMA] = useState({ ma20: true, ma50: true, ma200: false });
  
  const { historicalData, loading, quoteData } = useYahooFinance(ticker, {
    period,
    enabled: !!ticker,
    autoRefresh: false // Pas besoin auto-refresh pour historique
  });

  // Préparer données pour graphique avec historique réel
  const chartData = useMemo(() => {
    if (!historicalData || historicalData.length === 0) {
      // Si pas d'historique, créer données basiques depuis date achat
      if (!quoteData) return [];
      
      const data = [];
      const startDate = new Date(dateAchat);
      const endDate = new Date();
      const daysDiff = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 0) return [];
      
      const currentPrice = quoteData.prixActuel || prixEntree;
      const priceVariation = (currentPrice - prixEntree) / daysDiff;
      
      for (let i = 0; i <= Math.min(daysDiff, 90); i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const price = prixEntree + (priceVariation * i);
        
        data.push({
          date: date.toISOString().split('T')[0],
          prix: Math.max(0, price),
          volume: 0,
          ma20: null,
          ma50: null,
          ma200: null
        });
      }
      
      return data;
    }
    
    // Utiliser données historiques réelles avec calculs MA
    const { calculateMovingAverages } = require('../../../services/finance/financeCalculations');
    
    const ma20Data = calculateMovingAverages(historicalData, 20);
    const ma50Data = calculateMovingAverages(historicalData, 50);
    const ma200Data = calculateMovingAverages(historicalData, 200);
    
    return historicalData.map((point, index) => {
      const ma20Value = ma20Data.data.find(m => m.date === point.date)?.value || null;
      const ma50Value = ma50Data.data.find(m => m.date === point.date)?.value || null;
      const ma200Value = ma200Data.data.find(m => m.date === point.date)?.value || null;
      
      return {
        date: point.date,
        prix: point.close || point.prixActuel || 0,
        volume: point.volume || 0,
        ma20: ma20Value,
        ma50: ma50Value,
        ma200: ma200Value,
        isAchatDate: point.date === dateAchat
      };
    });
  }, [historicalData, quoteData, dateAchat, prixEntree]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (value) => {
    return new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    
    const data = payload[0].payload;
    
    return (
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-white mb-2">{formatDate(data.date)}</p>
        <div className="space-y-1">
          <p className="text-blue-400">Prix: {formatCurrency(data.prix)}</p>
          {showMA.ma20 && data.ma20 && (
            <p className="text-yellow-400">MA20: {formatCurrency(data.ma20)}</p>
          )}
          {showMA.ma50 && data.ma50 && (
            <p className="text-orange-400">MA50: {formatCurrency(data.ma50)}</p>
          )}
          {showMA.ma200 && data.ma200 && (
            <p className="text-red-400">MA200: {formatCurrency(data.ma200)}</p>
          )}
        </div>
      </div>
    );
  };

  const calculateMA = (data, period) => {
    if (!data || data.length < period) return null;
    const sum = data.reduce((acc, d) => acc + (d.close || d.prixActuel || d.prix || 0), 0);
    return sum / data.length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-400">
        Aucune donnée disponible pour ce graphique
      </div>
    );
  }

  return (
    <div className="stock-chart-container space-y-4">
      {/* Contrôles période et options */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-2">
          {['1j', '5j', '1m', '3m', '6m', '1a', 'Max'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                period === p
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        
        <div className="flex gap-4 items-center">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={showMA.ma20}
              onChange={(e) => setShowMA({...showMA, ma20: e.target.checked})}
              className="rounded"
            />
            MA20
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={showMA.ma50}
              onChange={(e) => setShowMA({...showMA, ma50: e.target.checked})}
              className="rounded"
            />
            MA50
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={showMA.ma200}
              onChange={(e) => setShowMA({...showMA, ma200: e.target.checked})}
              className="rounded"
            />
            MA200
          </label>
        </div>
      </div>

      {/* Graphique principal avec volume */}
      <div className="space-y-4">
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPrix" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="date" 
            stroke="#9ca3af"
            tickFormatter={formatDate}
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#9ca3af"
            domain={['auto', 'auto']}
            tickFormatter={formatCurrency}
            style={{ fontSize: '12px' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          {/* Ligne prix achat (référence) */}
          {prixEntree && (
            <ReferenceLine 
              y={prixEntree} 
              stroke="#10b981" 
              strokeDasharray="5 5"
              label={{ value: `Achat: ${formatCurrency(prixEntree)}`, position: "right", fill: '#10b981' }}
            />
          )}
          
          {/* Zone prix */}
          <Area
            type="monotone"
            dataKey="prix"
            stroke="#3b82f6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorPrix)"
            name="Prix"
          />
          
          {/* Moyennes mobiles */}
          {showMA.ma20 && (
            <Line 
              type="monotone" 
              dataKey="ma20" 
              stroke="#fbbf24" 
              strokeWidth={1.5} 
              dot={false}
              name="MA20"
            />
          )}
          {showMA.ma50 && (
            <Line 
              type="monotone" 
              dataKey="ma50" 
              stroke="#f97316" 
              strokeWidth={1.5} 
              dot={false}
              name="MA50"
            />
          )}
          {showMA.ma200 && (
            <Line 
              type="monotone" 
              dataKey="ma200" 
              stroke="#ef4444" 
              strokeWidth={1.5} 
              dot={false}
              name="MA200"
            />
          )}
          
          {/* Brush pour zoom */}
          <Brush dataKey="date" height={30} stroke="#6b7280" />
        </AreaChart>
      </ResponsiveContainer>

      {/* Graphique volume */}
      {chartData.some(d => d.volume > 0) && (
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date" 
              stroke="#9ca3af"
              tickFormatter={formatDate}
              style={{ fontSize: '12px' }}
            />
            <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
            <Tooltip 
              formatter={(value) => new Intl.NumberFormat('fr-FR').format(value)}
              labelFormatter={formatDate}
            />
            <Area
              type="monotone"
              dataKey="volume"
              stroke="#6b7280"
              fill="#6b7280"
              fillOpacity={0.3}
              name="Volume"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
      </div>
    </div>
  );
};

export default StockChart;

