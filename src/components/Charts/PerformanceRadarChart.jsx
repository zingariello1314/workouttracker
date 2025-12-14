import React, { memo, useMemo } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';

/**
 * PerformanceRadarChart - Graphique radar pour visualiser les performances multidimensionnelles
 * Idéal pour l'équilibre de vie, compétences, métriques globales
 */
const PerformanceRadarChart = memo(({ 
  data = [], 
  categories = [],
  title = '',
  subtitle = '',
  color = '#8B5CF6',
  fillOpacity = 0.3,
  strokeWidth = 2,
  height = 250,
  showTooltip = true,
  showGrid = true,
  maxValue = 100,
  formatValue = null,
  className = ''
}) => {
  // Formatage par défaut des valeurs
  const defaultFormatValue = useMemo(() => {
    if (formatValue) return formatValue;
    return (value) => `${Math.round(value)}%`;
  }, [formatValue]);

  // Préparation des données pour le radar
  const radarData = useMemo(() => {
    if (!data || data.length === 0) {
      // Données de démonstration si aucune donnée
      return [
        { category: 'Santé', value: 75, fullMark: maxValue },
        { category: 'Travail', value: 60, fullMark: maxValue },
        { category: 'Social', value: 80, fullMark: maxValue },
        { category: 'Loisirs', value: 45, fullMark: maxValue },
        { category: 'Apprentissage', value: 70, fullMark: maxValue },
        { category: 'Créativité', value: 55, fullMark: maxValue }
      ];
    }

    return data.map(item => ({
      category: item.category || item.name || item.label,
      value: Math.min(item.value || 0, maxValue),
      fullMark: maxValue,
      ...item // Préserver les propriétés supplémentaires
    }));
  }, [data, maxValue]);

  // Couleur adaptative basée sur la performance moyenne
  const adaptiveColor = useMemo(() => {
    const avgValue = radarData.reduce((sum, item) => sum + item.value, 0) / radarData.length;
    
    if (avgValue >= 80) return '#10B981'; // Vert - Excellente performance
    if (avgValue >= 60) return '#F59E0B'; // Orange - Bonne performance
    if (avgValue >= 40) return '#EF4444'; // Rouge - Performance à améliorer
    return '#6B7280'; // Gris - Performance faible
  }, [radarData]);

  // Tooltip personnalisé
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    const value = payload[0].value;
    const formattedValue = defaultFormatValue(value);

    return (
      <div className="radar-chart-tooltip">
        <div className="tooltip-header">
          <span className="tooltip-category">{label}</span>
        </div>
        <div className="tooltip-content">
          <div className="tooltip-item">
            <span 
              className="tooltip-color-indicator" 
              style={{ backgroundColor: adaptiveColor }}
            />
            <span className="tooltip-value">{formattedValue}</span>
          </div>
        </div>
      </div>
    );
  };

  if (!radarData || radarData.length === 0) {
    return (
      <div className={`radar-chart-container ${className}`}>
        {title && (
          <div className="chart-header">
            <h3 className="chart-title">{title}</h3>
            {subtitle && <p className="chart-subtitle">{subtitle}</p>}
          </div>
        )}
        <div className="chart-empty-state">
          <div className="empty-chart-icon">🎯</div>
          <div className="empty-chart-message">Aucune donnée de performance</div>
          <div className="empty-chart-suggestion">
            Vos métriques de performance apparaîtront ici
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`radar-chart-container ${className}`}>
      {title && (
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          {subtitle && <p className="chart-subtitle">{subtitle}</p>}
        </div>
      )}
      
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={height}>
          <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
            {showGrid && (
              <PolarGrid 
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth={1}
              />
            )}
            
            <PolarAngleAxis 
              dataKey="category" 
              tick={{ 
                fontSize: 11, 
                fill: 'rgba(255, 255, 255, 0.8)',
                fontWeight: 500
              }}
              className="radar-category-axis"
            />
            
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, maxValue]}
              tick={{ 
                fontSize: 10, 
                fill: 'rgba(255, 255, 255, 0.6)',
                fontWeight: 400
              }}
              tickFormatter={defaultFormatValue}
              axisLine={false}
              className="radar-value-axis"
            />
            
            {showTooltip && (
              <Tooltip content={<CustomTooltip />} />
            )}
            
            <Radar
              name="Performance"
              dataKey="value"
              stroke={adaptiveColor}
              fill={adaptiveColor}
              fillOpacity={fillOpacity}
              strokeWidth={strokeWidth}
              dot={{ 
                fill: adaptiveColor, 
                strokeWidth: 2, 
                r: 4,
                fillOpacity: 0.8
              }}
              activeDot={{ 
                r: 6, 
                stroke: adaptiveColor, 
                strokeWidth: 2,
                fill: '#fff',
                fillOpacity: 1
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Légende des performances */}
      <div className="radar-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: adaptiveColor }}></span>
          <span className="legend-text">Performance actuelle</span>
        </div>
        <div className="legend-stats">
          <span className="legend-avg">
            Moyenne: {defaultFormatValue(
              radarData.reduce((sum, item) => sum + item.value, 0) / radarData.length
            )}
          </span>
        </div>
      </div>
      
      {/* Informations d'accessibilité */}
      <div className="sr-only">
        Graphique radar de performance avec {radarData.length} catégories:
        {radarData.map(item => 
          `${item.category}: ${defaultFormatValue(item.value)}`
        ).join(', ')}
      </div>
    </div>
  );
});

PerformanceRadarChart.displayName = 'PerformanceRadarChart';

export default PerformanceRadarChart;