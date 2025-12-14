import React, { memo, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

/**
 * ResponsiveBarChart - Graphique en barres intelligent et responsive
 * Idéal pour comparer des valeurs par catégories ou périodes
 */
const ResponsiveBarChart = memo(({ 
  data = [], 
  xKey = 'name',
  yKey = 'value',
  title = '',
  subtitle = '',
  color = '#3B82F6',
  height = 200,
  showTooltip = true,
  showGrid = true,
  showLegend = false,
  formatValue = null,
  formatXAxis = null,
  orientation = 'vertical', // 'vertical' ou 'horizontal'
  barSize = null,
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
    return (value) => value;
  }, [formatXAxis]);

  // Couleurs adaptatives pour les barres
  const getBarColor = useMemo(() => {
    if (typeof color === 'string') return () => color;
    
    // Couleur basée sur la valeur
    return (value, index) => {
      const maxValue = Math.max(...data.map(d => d[yKey]));
      const ratio = value / maxValue;
      
      if (ratio >= 0.8) return '#10B981'; // Vert
      if (ratio >= 0.6) return '#F59E0B'; // Orange
      if (ratio >= 0.4) return '#EF4444'; // Rouge
      return '#6B7280'; // Gris
    };
  }, [color, data, yKey]);

  // Données enrichies avec couleurs
  const enrichedData = useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      barColor: typeof color === 'string' ? color : getBarColor(item[yKey], index)
    }));
  }, [data, color, getBarColor, yKey]);

  // Tooltip personnalisé
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    const value = payload[0].value;
    const formattedLabel = defaultFormatXAxis(label);
    const formattedValue = defaultFormatValue(value);

    return (
      <div className="bar-chart-tooltip">
        <div className="tooltip-header">
          <span className="tooltip-label">{formattedLabel}</span>
        </div>
        <div className="tooltip-content">
          <div className="tooltip-item">
            <span 
              className="tooltip-color-indicator" 
              style={{ backgroundColor: payload[0].color }}
            />
            <span className="tooltip-name">{title || yKey}</span>
            <span className="tooltip-value">{formattedValue}</span>
          </div>
        </div>
      </div>
    );
  };

  // Rendu de la barre personnalisée avec couleur adaptative
  const CustomBar = (props) => {
    const { fill, ...otherProps } = props;
    const barColor = props.payload?.barColor || fill;
    return <Bar {...otherProps} fill={barColor} />;
  };

  if (!data || data.length === 0) {
    return (
      <div className={`bar-chart-container ${className}`}>
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
            Les données de comparaison apparaîtront ici
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bar-chart-container ${className}`}>
      {title && (
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          {subtitle && <p className="chart-subtitle">{subtitle}</p>}
        </div>
      )}
      
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart 
            data={enrichedData} 
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            layout={orientation === 'horizontal' ? 'horizontal' : 'vertical'}
          >
            {showGrid && (
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="rgba(255, 255, 255, 0.1)"
                strokeOpacity={0.5}
              />
            )}
            
            <XAxis 
              dataKey={orientation === 'horizontal' ? yKey : xKey}
              axisLine={false}
              tickLine={false}
              tick={{ 
                fontSize: 12, 
                fill: 'rgba(255, 255, 255, 0.7)',
                fontWeight: 500
              }}
              tickFormatter={orientation === 'horizontal' ? defaultFormatValue : defaultFormatXAxis}
              type={orientation === 'horizontal' ? 'number' : 'category'}
            />
            
            <YAxis 
              dataKey={orientation === 'horizontal' ? xKey : yKey}
              axisLine={false}
              tickLine={false}
              tick={{ 
                fontSize: 12, 
                fill: 'rgba(255, 255, 255, 0.7)',
                fontWeight: 500
              }}
              tickFormatter={orientation === 'horizontal' ? defaultFormatXAxis : defaultFormatValue}
              type={orientation === 'horizontal' ? 'category' : 'number'}
              width={orientation === 'horizontal' ? 80 : undefined}
            />
            
            {showTooltip && (
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ 
                  fill: 'rgba(255, 255, 255, 0.1)'
                }}
              />
            )}
            
            {showLegend && (
              <Legend 
                wrapperStyle={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '12px'
                }}
              />
            )}
            
            <Bar 
              dataKey={yKey}
              fill={color}
              radius={[2, 2, 0, 0]}
              maxBarSize={barSize}
              shape={<CustomBar />}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Statistiques rapides */}
      <div className="bar-chart-stats">
        <div className="stat-item">
          <span className="stat-label">Total:</span>
          <span className="stat-value">
            {defaultFormatValue(data.reduce((sum, item) => sum + (item[yKey] || 0), 0))}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Moyenne:</span>
          <span className="stat-value">
            {defaultFormatValue(data.reduce((sum, item) => sum + (item[yKey] || 0), 0) / data.length)}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Max:</span>
          <span className="stat-value">
            {defaultFormatValue(Math.max(...data.map(item => item[yKey] || 0)))}
          </span>
        </div>
      </div>
    </div>
  );
});

ResponsiveBarChart.displayName = 'ResponsiveBarChart';

export default ResponsiveBarChart;