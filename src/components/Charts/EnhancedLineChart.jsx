import React, { memo, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * EnhancedLineChart - Graphique linéaire intelligible et interactif
 * Remplace les graphiques moches et ininterpretables par une visualisation claire
 */
const EnhancedLineChart = memo(({ 
  data = [], 
  xKey = 'date',
  yKey = 'value', 
  title = '',
  subtitle = '',
  color = '#10B981', 
  showTooltip = true,
  showGrid = true,
  formatValue = null,
  formatXAxis = null,
  height = 200,
  showDots = true,
  strokeWidth = 3,
  className = ''
}) => {
  // Formatage intelligent par défaut
  const defaultFormatValue = useMemo(() => {
    if (formatValue) return formatValue;
    
    // Détection automatique du type de données
    if (data.length > 0) {
      const firstValue = data[0][yKey];
      if (typeof firstValue === 'number') {
        if (firstValue > 1000) {
          // Probablement monétaire
          return (value) => new Intl.NumberFormat('fr-FR', { 
            style: 'currency', 
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(value);
        } else if (firstValue < 1) {
          // Probablement pourcentage
          return (value) => `${(value * 100).toFixed(1)}%`;
        }
      }
    }
    
    return (value) => value?.toLocaleString('fr-FR') || '0';
  }, [data, yKey, formatValue]);

  const defaultFormatXAxis = useMemo(() => {
    if (formatXAxis) return formatXAxis;
    
    // Détection automatique du format de date
    if (data.length > 0) {
      const firstX = data[0][xKey];
      if (typeof firstX === 'string' && firstX.includes('-')) {
        // Format date ISO
        return (value) => {
          const date = new Date(value);
          return date.toLocaleDateString('fr-FR', { 
            month: 'short', 
            day: 'numeric' 
          });
        };
      }
    }
    
    return (value) => value;
  }, [data, xKey, formatXAxis]);

  // Calcul de la tendance pour la couleur adaptative
  const trendColor = useMemo(() => {
    if (data.length < 2) return color;
    
    const firstValue = data[0][yKey];
    const lastValue = data[data.length - 1][yKey];
    
    if (lastValue > firstValue) {
      return '#10B981'; // Vert pour tendance positive
    } else if (lastValue < firstValue) {
      return '#EF4444'; // Rouge pour tendance négative
    }
    
    return '#6B7280'; // Gris pour tendance neutre
  }, [data, yKey, color]);

  // Tooltip personnalisé avec formatage riche
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    const value = payload[0].value;
    const formattedLabel = defaultFormatXAxis(label);
    const formattedValue = defaultFormatValue(value);

    return (
      <div className="enhanced-chart-tooltip">
        <div className="tooltip-header">
          <span className="tooltip-label">{formattedLabel}</span>
        </div>
        <div className="tooltip-content">
          <div className="tooltip-item">
            <span 
              className="tooltip-color-indicator" 
              style={{ backgroundColor: trendColor }}
            />
            <span className="tooltip-name">{title || yKey}</span>
            <span className="tooltip-value">{formattedValue}</span>
          </div>
        </div>
      </div>
    );
  };

  if (!data || data.length === 0) {
    return (
      <div className={`enhanced-chart-container ${className}`}>
        {title && (
          <div className="chart-header">
            <h3 className="chart-title">{title}</h3>
            {subtitle && <p className="chart-subtitle">{subtitle}</p>}
          </div>
        )}
        <div className="chart-empty-state">
          <div className="empty-chart-icon">📊</div>
          <div className="empty-chart-message">Aucune donnée disponible</div>
          <div className="empty-chart-suggestion">
            Les données apparaîtront ici une fois disponibles
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`enhanced-chart-container ${className}`}>
      {title && (
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          {subtitle && <p className="chart-subtitle">{subtitle}</p>}
        </div>
      )}
      
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={height}>
          <LineChart 
            data={data} 
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            {showGrid && (
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="rgba(255, 255, 255, 0.1)"
                strokeOpacity={0.5}
              />
            )}
            
            <XAxis 
              dataKey={xKey}
              axisLine={false}
              tickLine={false}
              tick={{ 
                fontSize: 12, 
                fill: 'rgba(255, 255, 255, 0.7)',
                fontWeight: 500
              }}
              tickFormatter={defaultFormatXAxis}
            />
            
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ 
                fontSize: 12, 
                fill: 'rgba(255, 255, 255, 0.7)',
                fontWeight: 500
              }}
              tickFormatter={defaultFormatValue}
              width={80}
            />
            
            {showTooltip && (
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ 
                  stroke: trendColor, 
                  strokeWidth: 1,
                  strokeDasharray: '5 5'
                }}
              />
            )}
            
            <Line 
              type="monotone" 
              dataKey={yKey} 
              stroke={trendColor}
              strokeWidth={strokeWidth}
              dot={showDots ? { 
                fill: trendColor, 
                strokeWidth: 2, 
                r: 4,
                fillOpacity: 0.8
              } : false}
              activeDot={{ 
                r: 6, 
                stroke: trendColor, 
                strokeWidth: 2,
                fill: '#fff',
                fillOpacity: 1
              }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

EnhancedLineChart.displayName = 'EnhancedLineChart';

export default EnhancedLineChart;