import React, { memo, useMemo } from 'react';

/**
 * EnhancedMiniChart - Mini-graphique enrichi
 * Corrige les problèmes de graphiques "moches et illisibles"
 */
const EnhancedMiniChart = memo(({ 
  data = [], 
  title = '', 
  color = 'var(--sidebar-cyan)',
  type = 'line', // 'line', 'area', 'bar'
  height = 40,
  showGrid = false,
  animated = true
}) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      // Données de fallback pour éviter un graphique vide
      return Array.from({ length: 10 }, (_, i) => ({
        x: i * 10,
        y: 15 + Math.sin(i * 0.5) * 5 + Math.random() * 3
      }));
    }

    // Normaliser les données
    const maxValue = Math.max(...data.map(d => d.value || d.y || d));
    const minValue = Math.min(...data.map(d => d.value || d.y || d));
    const range = maxValue - minValue || 1;

    return data.map((item, index) => {
      const value = item.value || item.y || item;
      const normalizedY = height - ((value - minValue) / range) * (height - 4) - 2;
      return {
        x: (index / (data.length - 1)) * 100,
        y: Math.max(2, Math.min(height - 2, normalizedY))
      };
    });
  }, [data, height]);

  const pathData = useMemo(() => {
    if (chartData.length === 0) return '';
    
    const points = chartData.map(point => `${point.x},${point.y}`).join(' ');
    
    if (type === 'area') {
      const firstPoint = chartData[0];
      const lastPoint = chartData[chartData.length - 1];
      return `M ${firstPoint.x},${height} L ${points} L ${lastPoint.x},${height} Z`;
    }
    
    return `M ${points.replace(/,/g, ' L ').replace(/L/, 'M')}`;
  }, [chartData, type, height]);

  const isPositiveTrend = useMemo(() => {
    if (chartData.length < 2) return true;
    return chartData[chartData.length - 1].y < chartData[0].y;
  }, [chartData]);

  const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="sidebar-mini-chart-container">
      {title && (
        <div className="sidebar-mini-chart-title">{title}</div>
      )}
      <svg 
        viewBox={`0 0 100 ${height}`} 
        className="sidebar-mini-chart-svg"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
          
          {animated && (
            <filter id="glow">
              <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          )}
        </defs>

        {/* Grille de fond (optionnelle) */}
        {showGrid && (
          <g opacity="0.1">
            {[0, 25, 50, 75, 100].map(x => (
              <line key={x} x1={x} y1="0" x2={x} y2={height} stroke="white" strokeWidth="0.5" />
            ))}
            {[height * 0.25, height * 0.5, height * 0.75].map(y => (
              <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="white" strokeWidth="0.5" />
            ))}
          </g>
        )}

        {/* Zone de remplissage (pour type area) */}
        {type === 'area' && (
          <path
            d={pathData}
            fill={`url(#${gradientId})`}
            stroke="none"
          />
        )}

        {/* Ligne principale */}
        <path
          d={pathData}
          fill={type === 'area' ? 'none' : 'transparent'}
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={animated ? "url(#glow)" : undefined}
          style={{
            transition: animated ? 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
          }}
        />

        {/* Points de données */}
        {chartData.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="1.5"
            fill={color}
            opacity="0.8"
            style={{
              transition: animated ? `all 0.3s ease ${index * 0.05}s` : 'none'
            }}
          />
        ))}

        {/* Indicateur de tendance */}
        <g opacity="0.6">
          <polygon
            points={isPositiveTrend ? "85,8 90,3 95,8 90,6" : "85,12 90,17 95,12 90,14"}
            fill={isPositiveTrend ? "var(--sidebar-green)" : "var(--sidebar-red)"}
          />
        </g>
      </svg>
    </div>
  );
});

EnhancedMiniChart.displayName = 'EnhancedMiniChart';

export default EnhancedMiniChart;