import React from 'react';
import { LineChart } from 'lucide-react';

const MetricsChart = ({ data, colors }) => {
  // Calculer les données des mesures corporelles
  const metricsData = React.useMemo(() => {
    if (!data.data?.progressEntries) return [];
    
    return data.data.progressEntries
      .filter(entry => {
        const entryDate = new Date(entry.date);
        const startDate = new Date(data.startDate);
        return entryDate >= startDate;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [data.data?.progressEntries, data.startDate]);

  if (metricsData.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-gray-400">
        <div className="text-center">
          <LineChart className="mx-auto mb-4 text-gray-500" size={48} />
          <p className="text-lg font-medium">Aucune mesure enregistrée</p>
          <p className="text-sm text-gray-500 mt-2">Enregistrez vos mesures corporelles pour voir l'évolution !</p>
        </div>
      </div>
    );
  }

  // Métriques disponibles - basées sur la structure réelle des données
  const availableMetrics = [
    { key: 'weight', label: 'Poids', color: colors.primary, unit: 'kg' },
    { key: 'waist', label: 'Tour de taille', color: colors.secondary, unit: 'cm' },
    { key: 'chest', label: 'Tour de poitrine', color: colors.accent, unit: 'cm' },
    { key: 'arm', label: 'Tour de bras', color: colors.purple, unit: 'cm' },
    { key: 'thigh', label: 'Tour de cuisse', color: colors.pink, unit: 'cm' }
  ];

  const maxValues = {};
  const minValues = {};
  
  availableMetrics.forEach(metric => {
    const values = metricsData.map(d => d[metric.key]).filter(v => v != null);
    if (values.length > 0) {
      maxValues[metric.key] = Math.max(...values);
      minValues[metric.key] = Math.min(...values);
    }
  });

  return (
    <div className="space-y-4">
      {/* Graphique multi-lignes */}
      <div className="h-80 relative">
        <svg width="100%" height="100%" className="overflow-visible">
          <defs>
            {availableMetrics.map(metric => (
              <linearGradient key={metric.key} id={`gradient-${metric.key}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={metric.color} stopOpacity="0.3"/>
                <stop offset="100%" stopColor={metric.color} stopOpacity="0.05"/>
              </linearGradient>
            ))}
          </defs>
          
          {/* Grille de fond */}
          <g opacity="0.1">
            {[...Array(6)].map((_, i) => (
              <line
                key={i}
                x1="0"
                y1={`${(i / 5) * 100}%`}
                x2="100%"
                y2={`${(i / 5) * 100}%`}
                stroke="white"
                strokeWidth="1"
              />
            ))}
          </g>
          
          {/* Lignes pour chaque métrique */}
          {availableMetrics.map(metric => {
            const values = metricsData.map(d => d[metric.key]).filter(v => v != null);
            if (values.length === 0) return null;
            
            const max = maxValues[metric.key];
            const min = minValues[metric.key];
            const range = max - min || 1;
            
            return (
              <g key={metric.key}>
                {/* Zone sous la courbe */}
                <path
                  d={`M 0,100% ${values.map((value, i) => {
                    const x = (i / (values.length - 1)) * 100;
                    const y = 100 - ((value - min) / range) * 80;
                    return `L ${x}%,${y}%`;
                  }).join(' ')} L 100%,100% Z`}
                  fill={`url(#gradient-${metric.key})`}
                />
                
                {/* Ligne */}
                <polyline
                  fill="none"
                  stroke={metric.color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={values.map((value, i) => {
                    const x = (i / (values.length - 1)) * 100;
                    const y = 100 - ((value - min) / range) * 80;
                    return `${x}%,${y}%`;
                  }).join(' ')}
                />
                
                {/* Points */}
                {values.map((value, i) => {
                  const x = (i / (values.length - 1)) * 100;
                  const y = 100 - ((value - min) / range) * 80;
                  
                  return (
                    <circle
                      key={i}
                      cx={`${x}%`}
                      cy={`${y}%`}
                      r="4"
                      fill={metric.color}
                      className="hover:r-6 transition-all duration-300 cursor-pointer"
                      style={{
                        filter: `drop-shadow(0 2px 4px ${metric.color}40)`
                      }}
                      title={`${metric.label}: ${value} ${metric.unit}`}
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Légende des métriques */}
      <div className="grid grid-cols-2 gap-2">
        {availableMetrics.map(metric => {
          const values = metricsData.map(d => d[metric.key]).filter(v => v != null);
          if (values.length === 0) return null;
          
          const latest = values[values.length - 1];
          const previous = values.length > 1 ? values[values.length - 2] : latest;
          const trend = latest > previous ? '↗' : latest < previous ? '↘' : '→';
          
          return (
            <div key={metric.key} className="flex items-center justify-between bg-slate-700/50 rounded-lg p-2">
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: metric.color }}
                />
                <span className="text-xs text-gray-300">{metric.label}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-sm font-semibold text-white">{latest}</span>
                <span className="text-xs text-gray-400">{metric.unit}</span>
                <span className="text-xs text-gray-500">{trend}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MetricsChart;
