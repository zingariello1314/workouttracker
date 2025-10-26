import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';

const CorrelationsChart = ({ data, colors }) => {
  const [selectedMetrics, setSelectedMetrics] = useState({
    x: 'weight',
    y: 'waist'
  });

  // Métriques disponibles pour la corrélation
  const availableMetrics = [
    { key: 'weight', label: 'Poids', unit: 'kg' },
    { key: 'waist', label: 'Tour de taille', unit: 'cm' },
    { key: 'chest', label: 'Tour de poitrine', unit: 'cm' },
    { key: 'arm', label: 'Tour de bras', unit: 'cm' },
    { key: 'thigh', label: 'Tour de cuisse', unit: 'cm' }
  ];

  // Calculer les données de corrélation
  const correlationData = React.useMemo(() => {
    if (!data.data?.progressEntries) return [];
    
    return data.data.progressEntries
      .filter(entry => {
        const entryDate = new Date(entry.date);
        const startDate = new Date(data.startDate);
        return entry[selectedMetrics.x] != null && 
               entry[selectedMetrics.y] != null &&
               entryDate >= startDate;
      })
      .map(entry => ({
        x: parseFloat(entry[selectedMetrics.x]) || 0,
        y: parseFloat(entry[selectedMetrics.y]) || 0,
        date: entry.date
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [data.data?.progressEntries, data.startDate, selectedMetrics]);

  // Calculer le coefficient de corrélation
  const correlationCoefficient = React.useMemo(() => {
    if (correlationData.length < 2) return 0;
    
    const n = correlationData.length;
    const sumX = correlationData.reduce((sum, d) => sum + d.x, 0);
    const sumY = correlationData.reduce((sum, d) => sum + d.y, 0);
    const sumXY = correlationData.reduce((sum, d) => sum + d.x * d.y, 0);
    const sumXX = correlationData.reduce((sum, d) => sum + d.x * d.x, 0);
    const sumYY = correlationData.reduce((sum, d) => sum + d.y * d.y, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }, [correlationData]);

  if (correlationData.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-gray-400">
        <div className="text-center">
          <TrendingUp className="mx-auto mb-4 text-gray-500" size={48} />
          <p className="text-lg font-medium">Données insuffisantes</p>
          <p className="text-sm text-gray-500 mt-2">Enregistrez plus de mesures pour voir les corrélations !</p>
        </div>
      </div>
    );
  }

  const xMetric = availableMetrics.find(m => m.key === selectedMetrics.x);
  const yMetric = availableMetrics.find(m => m.key === selectedMetrics.y);

  // Calculer les min/max pour l'échelle
  const xValues = correlationData.map(d => d.x);
  const yValues = correlationData.map(d => d.y);
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);
  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;

  return (
    <div className="space-y-4">
      {/* Contrôles de sélection */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Métrique X</label>
          <select
            value={selectedMetrics.x}
            onChange={(e) => setSelectedMetrics(prev => ({ ...prev, x: e.target.value }))}
            className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            {availableMetrics.map(metric => (
              <option key={metric.key} value={metric.key}>
                {metric.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Métrique Y</label>
          <select
            value={selectedMetrics.y}
            onChange={(e) => setSelectedMetrics(prev => ({ ...prev, y: e.target.value }))}
            className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            {availableMetrics.map(metric => (
              <option key={metric.key} value={metric.key}>
                {metric.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Graphique de dispersion */}
      <div className="h-80 relative">
        <svg width="100%" height="100%" className="overflow-visible">
          {/* Grille de fond */}
          <g opacity="0.1">
            {[...Array(6)].map((_, i) => (
              <line
                key={`h-${i}`}
                x1="0"
                y1={`${(i / 5) * 100}%`}
                x2="100%"
                y2={`${(i / 5) * 100}%`}
                stroke="white"
                strokeWidth="1"
              />
            ))}
            {[...Array(6)].map((_, i) => (
              <line
                key={`v-${i}`}
                x1={`${(i / 5) * 100}%`}
                y1="0"
                x2={`${(i / 5) * 100}%`}
                y2="100%"
                stroke="white"
                strokeWidth="1"
              />
            ))}
          </g>
          
          {/* Points de données */}
          {correlationData.map((point, index) => {
            const x = ((point.x - xMin) / xRange) * 100;
            const y = 100 - ((point.y - yMin) / yRange) * 100;
            
            return (
              <circle
                key={index}
                cx={`${x}%`}
                cy={`${y}%`}
                r="6"
                fill={colors.primary}
                className="hover:r-8 transition-all duration-300 cursor-pointer"
                style={{
                  filter: 'drop-shadow(0 4px 8px rgba(59, 130, 246, 0.4))'
                }}
                title={`${new Date(point.date).toLocaleDateString('fr-FR')}: ${xMetric.label} ${point.x}${xMetric.unit}, ${yMetric.label} ${point.y}${yMetric.unit}`}
              />
            );
          })}
        </svg>
        
        {/* Légende des axes */}
        <div className="absolute bottom-2 left-2 text-xs text-gray-400">
          {xMetric.label} ({xMetric.unit})
        </div>
        <div className="absolute top-2 right-2 text-xs text-gray-400 transform -rotate-90 origin-center">
          {yMetric.label} ({yMetric.unit})
        </div>
      </div>

      {/* Statistiques de corrélation */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-700/50 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Corrélation</div>
          <div className="text-lg font-bold text-blue-400">
            {correlationCoefficient.toFixed(3)}
          </div>
          <div className="text-xs text-gray-500">
            {Math.abs(correlationCoefficient) > 0.7 ? 'Forte' : 
             Math.abs(correlationCoefficient) > 0.3 ? 'Modérée' : 'Faible'}
          </div>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Points</div>
          <div className="text-lg font-bold text-green-400">
            {correlationData.length}
          </div>
          <div className="text-xs text-gray-500">données</div>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Tendance</div>
          <div className="text-lg font-bold text-purple-400">
            {correlationCoefficient > 0 ? '↗' : correlationCoefficient < 0 ? '↘' : '→'}
          </div>
          <div className="text-xs text-gray-500">
            {correlationCoefficient > 0 ? 'Positive' : correlationCoefficient < 0 ? 'Négative' : 'Neutre'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CorrelationsChart;
