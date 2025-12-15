import React, { memo, useMemo, useState, useCallback } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

/**
 * CreativeBubbleChart - Graphique en bulles créatif et interactif
 * Idéal pour visualiser des projets créatifs avec des interactions ludiques
 */
const CreativeBubbleChart = memo(({ 
  data = [], 
  xKey = 'x',
  yKey = 'y',
  sizeKey = 'size',
  colorKey = 'category',
  title = '',
  subtitle = '',
  height = 300,
  showTooltip = true,
  showGrid = true,
  formatValue = null,
  formatXAxis = null,
  formatYAxis = null,
  className = '',
  onBubbleClick = null,
  onBubbleHover = null,
  animationDuration = 1000,
  maxBubbleSize = 50,
  minBubbleSize = 10,
  colorPalette = null
}) => {
  const [hoveredBubble, setHoveredBubble] = useState(null);
  const [selectedBubble, setSelectedBubble] = useState(null);

  // Palette de couleurs créatives par défaut
  const defaultColorPalette = {
    'Créativité': '#FF6B9D',
    'Innovation': '#4ECDC4', 
    'Art': '#45B7D1',
    'Musique': '#96CEB4',
    'Écriture': '#FFEAA7',
    'Design': '#DDA0DD',
    'Photo': '#98D8C8',
    'Vidéo': '#F7DC6F',
    'Projet': '#BB8FCE',
    'Idée': '#85C1E9'
  };

  const colors = colorPalette || defaultColorPalette;

  // Formatage par défaut
  const defaultFormatValue = useMemo(() => {
    if (formatValue) return formatValue;
    return (value) => value?.toLocaleString('fr-FR') || '0';
  }, [formatValue]);

  const defaultFormatXAxis = useMemo(() => {
    if (formatXAxis) return formatXAxis;
    return (value) => value;
  }, [formatXAxis]);

  const defaultFormatYAxis = useMemo(() => {
    if (formatYAxis) return formatYAxis;
    return (value) => value;
  }, [formatYAxis]);

  // Préparation des données avec normalisation des tailles
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Calcul des min/max pour normaliser les tailles
    const sizes = data.map(item => item[sizeKey] || 1);
    const minSize = Math.min(...sizes);
    const maxSize = Math.max(...sizes);
    const sizeRange = maxSize - minSize || 1;

    return data.map((item, index) => {
      const normalizedSize = minBubbleSize + 
        ((item[sizeKey] - minSize) / sizeRange) * (maxBubbleSize - minBubbleSize);
      
      const category = item[colorKey] || 'Projet';
      const color = colors[category] || colors['Projet'] || '#BB8FCE';

      return {
        ...item,
        id: item.id || index,
        normalizedSize,
        color,
        category,
        // Ajout de propriétés pour l'animation
        originalX: item[xKey],
        originalY: item[yKey],
        animatedX: item[xKey],
        animatedY: item[yKey]
      };
    });
  }, [data, sizeKey, colorKey, xKey, yKey, minBubbleSize, maxBubbleSize, colors]);

  // Gestion du clic sur une bulle
  const handleBubbleClick = useCallback((data, index) => {
    setSelectedBubble(data);
    if (onBubbleClick) {
      onBubbleClick(data, index);
    }
  }, [onBubbleClick]);

  // Gestion du survol d'une bulle
  const handleBubbleHover = useCallback((data, index) => {
    setHoveredBubble(data);
    if (onBubbleHover) {
      onBubbleHover(data, index);
    }
  }, [onBubbleHover]);

  // Tooltip créatif personnalisé
  const CreativeTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    
    return (
      <div className="creative-bubble-tooltip">
        <div className="tooltip-header" style={{ borderColor: data.color }}>
          <div className="tooltip-icon" style={{ backgroundColor: data.color }}>
            {data.icon || '🎨'}
          </div>
          <div className="tooltip-title">
            <h4>{data.name || data.title || 'Projet'}</h4>
            <span className="tooltip-category">{data.category}</span>
          </div>
        </div>
        
        <div className="tooltip-content">
          <div className="tooltip-metrics">
            <div className="metric-item">
              <span className="metric-label">Progression:</span>
              <span className="metric-value">{data[yKey]}%</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Complexité:</span>
              <span className="metric-value">{data[xKey]}/10</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Impact:</span>
              <span className="metric-value">{data[sizeKey]}</span>
            </div>
          </div>
          
          {data.description && (
            <div className="tooltip-description">
              {data.description}
            </div>
          )}
          
          {data.tags && (
            <div className="tooltip-tags">
              {data.tags.map((tag, index) => (
                <span key={index} className="tooltip-tag" style={{ backgroundColor: data.color + '20' }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        
        <div className="tooltip-footer">
          <span className="tooltip-hint">Cliquez pour plus de détails</span>
        </div>
      </div>
    );
  };

  // Rendu personnalisé des bulles avec effets créatifs
  const CustomBubble = (props) => {
    const { cx, cy, payload } = props;
    const isHovered = hoveredBubble?.id === payload.id;
    const isSelected = selectedBubble?.id === payload.id;
    
    const bubbleSize = payload.normalizedSize * (isHovered ? 1.2 : 1);
    const opacity = isSelected ? 1 : (isHovered ? 0.9 : 0.7);

    return (
      <g>
        {/* Effet de halo pour les bulles sélectionnées */}
        {(isHovered || isSelected) && (
          <circle
            cx={cx}
            cy={cy}
            r={bubbleSize + 8}
            fill={payload.color}
            opacity={0.2}
            className="bubble-halo"
          />
        )}
        
        {/* Bulle principale */}
        <circle
          cx={cx}
          cy={cy}
          r={bubbleSize}
          fill={payload.color}
          opacity={opacity}
          stroke={isSelected ? '#fff' : 'transparent'}
          strokeWidth={isSelected ? 3 : 0}
          className="creative-bubble"
          style={{
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            filter: isHovered ? 'brightness(1.1)' : 'none'
          }}
          onClick={() => handleBubbleClick(payload)}
          onMouseEnter={() => handleBubbleHover(payload)}
          onMouseLeave={() => setHoveredBubble(null)}
        />
        
        {/* Icône ou texte dans la bulle */}
        {bubbleSize > 20 && (
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={Math.min(bubbleSize / 3, 14)}
            fill="#fff"
            fontWeight="bold"
            className="bubble-text"
            style={{ pointerEvents: 'none' }}
          >
            {payload.icon || payload.name?.charAt(0) || '🎨'}
          </text>
        )}
        
        {/* Effet de brillance */}
        <circle
          cx={cx - bubbleSize * 0.3}
          cy={cy - bubbleSize * 0.3}
          r={bubbleSize * 0.2}
          fill="rgba(255, 255, 255, 0.4)"
          className="bubble-shine"
          style={{ pointerEvents: 'none' }}
        />
      </g>
    );
  };

  if (!processedData || processedData.length === 0) {
    return (
      <div className={`creative-bubble-chart-container ${className}`}>
        {title && (
          <div className="chart-header">
            <h3 className="chart-title">{title}</h3>
            {subtitle && <p className="chart-subtitle">{subtitle}</p>}
          </div>
        )}
        <div className="chart-empty-state creative-empty">
          <div className="empty-chart-icon">🎨</div>
          <div className="empty-chart-message">Aucun projet créatif</div>
          <div className="empty-chart-suggestion">
            Vos projets créatifs apparaîtront ici sous forme de bulles interactives
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`creative-bubble-chart-container ${className}`}>
      {title && (
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          {subtitle && <p className="chart-subtitle">{subtitle}</p>}
        </div>
      )}
      
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={height}>
          <ScatterChart
            data={processedData}
            margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
          >
            {showGrid && (
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="rgba(255, 255, 255, 0.1)"
                strokeOpacity={0.3}
              />
            )}
            
            <XAxis 
              type="number"
              dataKey={xKey}
              axisLine={false}
              tickLine={false}
              tick={{ 
                fontSize: 12, 
                fill: 'rgba(255, 255, 255, 0.7)',
                fontWeight: 500
              }}
              tickFormatter={defaultFormatXAxis}
              domain={['dataMin - 0.5', 'dataMax + 0.5']}
            />
            
            <YAxis 
              type="number"
              dataKey={yKey}
              axisLine={false}
              tickLine={false}
              tick={{ 
                fontSize: 12, 
                fill: 'rgba(255, 255, 255, 0.7)',
                fontWeight: 500
              }}
              tickFormatter={defaultFormatYAxis}
              domain={['dataMin - 5', 'dataMax + 5']}
            />
            
            {showTooltip && (
              <Tooltip 
                content={<CreativeTooltip />}
                cursor={false}
              />
            )}
            
            <Scatter
              dataKey={yKey}
              shape={<CustomBubble />}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      
      {/* Légende créative */}
      <div className="creative-legend">
        <div className="legend-title">Catégories de projets</div>
        <div className="legend-items">
          {Object.entries(colors).map(([category, color]) => {
            const hasData = processedData.some(item => item.category === category);
            if (!hasData) return null;
            
            return (
              <div key={category} className="creative-legend-item">
                <div 
                  className="legend-bubble" 
                  style={{ backgroundColor: color }}
                />
                <span className="legend-text">{category}</span>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Panneau de détails pour la bulle sélectionnée */}
      {selectedBubble && (
        <div className="bubble-details-panel">
          <div className="details-header">
            <h4>{selectedBubble.name || selectedBubble.title}</h4>
            <button 
              className="close-details"
              onClick={() => setSelectedBubble(null)}
            >
              ×
            </button>
          </div>
          <div className="details-content">
            <div className="detail-metric">
              <span>Progression:</span>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${selectedBubble[yKey]}%`,
                    backgroundColor: selectedBubble.color
                  }}
                />
              </div>
              <span>{selectedBubble[yKey]}%</span>
            </div>
            
            {selectedBubble.description && (
              <div className="detail-description">
                {selectedBubble.description}
              </div>
            )}
            
            {selectedBubble.nextSteps && (
              <div className="detail-next-steps">
                <h5>Prochaines étapes:</h5>
                <ul>
                  {selectedBubble.nextSteps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Informations d'accessibilité */}
      <div className="sr-only">
        Graphique en bulles créatif avec {processedData.length} projets.
        Utilisez les flèches pour naviguer entre les bulles.
      </div>
    </div>
  );
});

CreativeBubbleChart.displayName = 'CreativeBubbleChart';

export default CreativeBubbleChart;