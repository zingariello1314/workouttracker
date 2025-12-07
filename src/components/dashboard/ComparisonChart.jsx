/**
 * ComparisonChart Component
 * Graphique de comparaison multi-périodes avec barres ou lignes
 */

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const ComparisonChart = ({ 
  data, 
  periods = ['7j', '30j', '90j'], 
  label = 'Valeur',
  type = 'bar',
  showTrend = true 
}) => {
  const maxValue = useMemo(() => {
    return Math.max(...Object.values(data));
  }, [data]);

  const getTrendIcon = (current, previous) => {
    if (!previous) return null;
    const diff = ((current - previous) / previous) * 100;
    
    if (diff > 5) return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (diff < -5) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  const getTrendColor = (current, previous) => {
    if (!previous) return 'bg-blue-500';
    const diff = ((current - previous) / previous) * 100;
    
    if (diff > 5) return 'bg-green-500';
    if (diff < -5) return 'bg-red-500';
    return 'bg-blue-500';
  };

  const getTrendPercentage = (current, previous) => {
    if (!previous) return null;
    const diff = ((current - previous) / previous) * 100;
    return diff.toFixed(1);
  };

  return (
    <div className="space-y-4">
      {type === 'bar' ? (
        <div className="space-y-3">
          {periods.map((period, index) => {
            const value = data[period] || 0;
            const previousValue = index > 0 ? data[periods[index - 1]] : null;
            const percentage = (value / maxValue) * 100;
            const trendPercentage = getTrendPercentage(value, previousValue);

            return (
              <div key={period} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300 font-medium">{period}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold">{value}</span>
                    {showTrend && trendPercentage && (
                      <div className="flex items-center gap-1">
                        {getTrendIcon(value, previousValue)}
                        <span className={`text-xs ${
                          parseFloat(trendPercentage) > 0 ? 'text-green-400' : 
                          parseFloat(trendPercentage) < 0 ? 'text-red-400' : 
                          'text-slate-400'
                        }`}>
                          {trendPercentage > 0 ? '+' : ''}{trendPercentage}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="relative h-8 bg-slate-700/30 rounded-lg overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 ${getTrendColor(value, previousValue)} transition-all duration-500 rounded-lg`}
                    style={{ width: `${percentage}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20"></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Line chart (simplified SVG)
        <div className="relative h-48 bg-slate-800/30 rounded-lg p-4">
          <svg className="w-full h-full" viewBox="0 0 300 150">
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map(y => (
              <line
                key={y}
                x1="0"
                y1={150 - (y * 1.5)}
                x2="300"
                y2={150 - (y * 1.5)}
                stroke="rgb(71, 85, 105)"
                strokeWidth="0.5"
                strokeDasharray="2,2"
              />
            ))}

            {/* Line path */}
            <polyline
              points={periods.map((period, index) => {
                const x = (index / (periods.length - 1)) * 280 + 10;
                const value = data[period] || 0;
                const y = 150 - ((value / maxValue) * 130 + 10);
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke="rgb(59, 130, 246)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points */}
            {periods.map((period, index) => {
              const x = (index / (periods.length - 1)) * 280 + 10;
              const value = data[period] || 0;
              const y = 150 - ((value / maxValue) * 130 + 10);
              
              return (
                <g key={period}>
                  <circle
                    cx={x}
                    cy={y}
                    r="4"
                    fill="rgb(59, 130, 246)"
                    stroke="rgb(30, 41, 59)"
                    strokeWidth="2"
                  />
                  <text
                    x={x}
                    y="145"
                    textAnchor="middle"
                    fill="rgb(148, 163, 184)"
                    fontSize="10"
                  >
                    {period}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Amélioration</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span>Stable</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>Régression</span>
        </div>
      </div>
    </div>
  );
};

export default ComparisonChart;
