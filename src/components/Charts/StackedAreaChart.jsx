import React, { memo, useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

/**
 * StackedAreaChart - Graphique en aires empilées pour visualiser les tendances temporelles
 * Idéal pour montrer l'évolution de plusieurs catégories dans le temps
 */
const StackedAreaChart = memo(({ 
  data = [], 
  xKey = 'date',
  series = [], // [{ key: 'series1', name: 'Série 1', color: '#10B981' }]
  title = '',
  subtitle = '',
  height = 250,
  showTooltip = true,
  showGrid = true,
  showLegend = true,
  formatValue = null,
  formatXAxis = null,
  stackOffset = 'none', // 'none', 'expand', 'wiggle', 'silhouette'
  className = '',
  annotations = [], // Points d'événements importants
  allowToggleSeries = true
}) => {
  const [hiddenSeries, setHiddenSeries] = useState(new Set());

  // Formatage intelligent par défaut
  const defaultFormatValue = useMemo(() => {
    if (formatValue) return formatValue;
    
    // Détection automatique du type de données
    if (data.length > 0 && series.length > 0) {
      const firstValue = data[0][series[0].key];
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
  }, [data, series, formatValue]);

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

  // Palette de couleurs harmonieuses par défaut
  const defaultColors = [
    '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', 
    '#EF4444', '#06B6D4', '#84CC16', '#F97316'
  ];

  // Préparation des séries avec couleurs par défaut
  const processedSeries = useMemo(() => {
    return series.map((serie, index) => ({
      ...serie,
      color: serie.color || defaultColors[index % defaultColors.length]
    }));
  }, [series]);

  // Filtrage des séries visibles
  const visibleSeries = useMemo(() => {
    return processedSeries.filter(serie => !hiddenSeries.has(serie.key));
  }, [processedSeries, hiddenSeries]);

  // Toggle de visibilité des séries
  const toggleSeries = (seriesKey) => {
    if (!allowToggleSeries) return;
    
    setHiddenSeries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(seriesKey)) {
        newSet.delete(seriesKey);
      } else {
        newSet.add(seriesKey);
      }
      return newSet;
    });
  };

  // Tooltip personnalisé avec formatage riche
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    const formattedLabel = defaultFormatXAxis(label);
    const total = payload.reduce((sum, entry) => sum + (entry.value || 0), 0);

    return (
      <div className="stacked-area-tooltip">
        <div className="tooltip-header">
          <span className="tooltip-label">{formattedLabel}</span>
          <span className="tooltip-total">Total: {defaultFormatValue(total)}</span>
        </div>
        <div className="tooltip-content">
          {payload.map((entry, index) => (
            <div key={index} className="tooltip-item">
              <span 
                className="tooltip-color-indicator" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="tooltip-name">{entry.name}</span>
              <span className="tooltip-value">{defaultFormatValue(entry.value)}</span>
              <span className="tooltip-percentage">
                ({((entry.value / total) * 100).toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Légende interactive personnalisée
  const CustomLegend = ({ payload }) => {
    if (!showLegend || !payload) return null;

    return (
      <div className="stacked-area-legend">
        {payload.map((entry, index) => {
          const isHidden = hiddenSeries.has(entry.dataKey);
          return (
            <div 
              key={index} 
              className={`legend-item ${isHidden ? 'legend-item-hidden' : ''} ${allowToggleSeries ? 'legend-item-clickable' : ''}`}
              onClick={() => toggleSeries(entry.dataKey)}
            >
              <span 
                className="legend-color" 
                style={{ 
                  backgroundColor: isHidden ? '#9CA3AF' : entry.color,
                  opacity: isHidden ? 0.5 : 1
                }}
              />
              <span className="legend-text">{entry.value}</span>
            </div>
          );
        })}
      </div>
    );
  };

  if (!data || data.length === 0) {
    return (
      <div className={`stacked-area-chart-container ${className}`}>
        {title && (
          <div className="chart-header">
            <h3 className="chart-title">{title}</h3>
            {subtitle && <p className="chart-subtitle">{subtitle}</p>}
          </div>
        )}
        <div className="chart-empty-state">
          <div className="empty-chart-icon">📈</div>
          <div className="empty-chart-message">Aucune donnée de tendance</div>
          <div className="empty-chart-suggestion">
            Les tendances temporelles apparaîtront ici une fois les données disponibles
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`stacked-area-chart-container ${className}`}>
      {title && (
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          {subtitle && <p className="chart-subtitle">{subtitle}</p>}
        </div>
      )}
      
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart 
            data={data} 
            margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
            stackOffset={stackOffset}
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
                  stroke: 'rgba(255, 255, 255, 0.2)', 
                  strokeWidth: 1
                }}
              />
            )}
            
            {showLegend && (
              <Legend 
                content={<CustomLegend />}
                wrapperStyle={{ paddingTop: '20px' }}
              />
            )}
            
            {/* Rendu des aires empilées */}
            {visibleSeries.map((serie, index) => (
              <Area
                key={serie.key}
                type="monotone"
                dataKey={serie.key}
                stackId="1"
                stroke={serie.color}
                fill={serie.color}
                fillOpacity={0.7}
                strokeWidth={2}
                name={serie.name}
                connectNulls={false}
              />
            ))}
            
            {/* Annotations pour événements importants */}
            {annotations.map((annotation, index) => (
              <Area
                key={`annotation-${index}`}
                type="monotone"
                dataKey={() => 0}
                stroke="rgba(255, 255, 255, 0.8)"
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="transparent"
                dot={{ 
                  fill: '#fff', 
                  stroke: annotation.color || '#F59E0B',
                  strokeWidth: 3,
                  r: 5
                }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* Annotations textuelles */}
      {annotations.length > 0 && (
        <div className="chart-annotations">
          {annotations.map((annotation, index) => (
            <div key={index} className="annotation-item">
              <span 
                className="annotation-marker" 
                style={{ backgroundColor: annotation.color || '#F59E0B' }}
              />
              <span className="annotation-text">{annotation.text}</span>
              <span className="annotation-date">{annotation.date}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* Informations d'accessibilité */}
      <div className="sr-only">
        Graphique en aires empilées montrant l'évolution de {visibleSeries.length} séries dans le temps.
        {visibleSeries.map(serie => `${serie.name}`).join(', ')}
      </div>
    </div>
  );
});

StackedAreaChart.displayName = 'StackedAreaChart';

export default StackedAreaChart;