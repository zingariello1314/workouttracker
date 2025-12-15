import React, { memo, useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { CustomDot } from '../../tabs/GarminTab/components/charts/CustomDot';
import { 
  prepareTimeSeriesForDisplay, 
  enrichHeartRateTimeSeriesForVisualization
} from '../../../utils/garminTimeSeriesUtils';

/**
 * SidebarHeartRateChart - Wrapper optimisé pour la sidebar
 * Composant wrapper autour de GarminHeartRateTimeSeriesChart adapté pour l'espace restreint de la sidebar
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4
 * - Contraintes de hauteur (max 300px) (4.1)
 * - Priorisation de la courbe FC principale (4.2)
 * - Tailles de police adaptées à l'espace sidebar (4.3)
 * - Légende compacte pour l'espace réduit (4.4)
 */
const SidebarHeartRateChart = memo(({ 
  garminData,
  selectedDate,
  height = 280,
  compactMode = true,
  colors = { red: '#EF4444' },
  activities = [],
  className = '',
  containerWidth = null, // Nouvelle prop pour la responsivité
  onNavigateToSport = null, // Nouvelle prop pour la navigation (Requirement 3.3)
  onDataPointClick = null, // Nouvelle prop pour les interactions (Requirement 1.3)
  showNavigationHint = true // Afficher l'indication de navigation (Requirement 3.3)
}) => {
  // État pour la responsivité (Requirement 4.4)
  const containerRef = useRef(null);
  const [actualWidth, setActualWidth] = useState(containerWidth || 280);
  
  // État pour l'interactivité (Requirements 1.3, 2.3)
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null);

  // Observer de redimensionnement pour la responsivité (Requirement 4.4)
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Vérifier si ResizeObserver est disponible et n'est pas un mock
    if (typeof ResizeObserver === 'undefined' || 
        (typeof ResizeObserver === 'function' && ResizeObserver.toString().includes('vi.fn'))) {
      return;
    }

    try {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width } = entry.contentRect;
          setActualWidth(width);
        }
      });

      resizeObserver.observe(containerRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    } catch (error) {
      // Ignorer les erreurs de ResizeObserver en mode test
      console.warn('ResizeObserver not available:', error);
    }
  }, []);

  // Utiliser la largeur effective (prop ou mesurée)
  const effectiveWidth = containerWidth || actualWidth;

  // Enrichissement des données pour la visualisation
  const enrichedData = useMemo(() => {
    if (!garminData || !selectedDate) return null;
    
    const dayMetrics = garminData.dailyMetrics?.[selectedDate];
    if (!dayMetrics) return null;
    
    const rawTimeSeries = dayMetrics?.heartRate?.timeSeries || [];
    
    // Décompresser les données avec cache
    const timeSeries = prepareTimeSeriesForDisplay(rawTimeSeries, { useCache: true });
    
    // Métriques agrégées
    const maxHR = dayMetrics?.heartRate?.max || null;
    const restingHR = dayMetrics?.heartRate?.resting || null;
    const avgHR = dayMetrics?.heartRate?.avg || null;
    
    if (!restingHR && timeSeries.length === 0) {
      return null;
    }
    
    // Enrichir les données (stats, zones, gaps) sans générer de données artificielles
    const enriched = enrichHeartRateTimeSeriesForVisualization(timeSeries, {
      maxHR,
      restingHR,
      enableDownsampling: timeSeries.length > 500, // Plus agressif pour la sidebar
      downsamplingThreshold: 500,
      targetPoints: 200 // Moins de points pour la sidebar
    });
    
    const hasEnoughDataForCurve = enriched.timeSeries.length >= 10;
    const enrichedWithMeta = {
      ...enriched,
      hasEnoughDataForCurve,
      realPointsCount: timeSeries.length
    };

    if (!enrichedWithMeta.stats && avgHR !== null) {
      enrichedWithMeta.stats = {
        resting: restingHR,
        max: maxHR,
        avg: avgHR
      };
    }

    return enrichedWithMeta;
  }, [garminData, selectedDate, activities]);

  // Transformation des données pour le graphique
  const timeSeriesData = useMemo(() => {
    if (!enrichedData || !enrichedData.timeSeries || enrichedData.timeSeries.length === 0) return [];
    
    const transformed = enrichedData.timeSeries.map(ts => {
      let timestamp;
      if (typeof ts.timestamp === 'number') {
        timestamp = ts.timestamp;
      } else if (typeof ts.timestamp === 'string') {
        timestamp = new Date(ts.timestamp).getTime();
      } else {
        timestamp = Date.now();
      }
      
      const bpm = typeof ts.bpm === 'number' ? ts.bpm : (typeof ts.bpm === 'string' ? parseFloat(ts.bpm) : 0);
      const date = new Date(timestamp);
      
      if (isNaN(date.getTime())) {
        return null;
      }
      
      return {
        time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        timestamp: timestamp,
        bpm: bpm,
        hour: date.getHours(),
        minute: date.getMinutes(),
        isReal: ts.isReal === true,
        isActivity: ts.isActivity === true
      };
    })
    .filter(ts => ts !== null)
    .sort((a, b) => a.timestamp - b.timestamp);
    
    // Points virtuels pour forcer l'axe X à afficher 24h (mode compact)
    if (transformed.length > 0 && selectedDate && compactMode) {
      const dayStart = new Date(selectedDate + 'T00:00:00').getTime();
      const dayEnd = new Date(selectedDate + 'T23:59:59').getTime();
      
      const firstPoint = transformed[0];
      const lastPoint = transformed[transformed.length - 1];
      
      const result = [];
      
      // Point virtuel à 00:00 si nécessaire
      if (firstPoint.timestamp > dayStart + 5 * 60 * 1000) {
        result.push({
          time: '00:00',
          timestamp: dayStart,
          bpm: null,
          hour: 0,
          minute: 0,
          isReal: false,
          isVirtual: true,
          isActivity: false
        });
      }
      
      result.push(...transformed);
      
      // Point virtuel à 23:59 si nécessaire
      if (lastPoint.timestamp < dayEnd - 5 * 60 * 1000) {
        result.push({
          time: '23:59',
          timestamp: dayEnd,
          bpm: null,
          hour: 23,
          minute: 59,
          isReal: false,
          isVirtual: true,
          isActivity: false
        });
      }
      
      return result;
    }
    
    return transformed;
  }, [enrichedData, selectedDate, compactMode]);

  // Données valides pour l'affichage
  const validTimeSeries = useMemo(() => {
    if (!enrichedData || !enrichedData.timeSeries || enrichedData.timeSeries.length === 0) return [];
    
    const validData = timeSeriesData.filter(d => d.bpm != null && d.timestamp && d.bpm > 0);
    return validData;
  }, [timeSeriesData, enrichedData]);

  // Calcul min/max pour l'axe Y
  const bpmValues = useMemo(() => {
    if (enrichedData?.stats) {
      return [enrichedData.stats.min, enrichedData.stats.max];
    }
    return validTimeSeries.map(d => d.bpm).filter(v => v != null);
  }, [enrichedData, validTimeSeries]);

  const minBpm = enrichedData?.stats 
    ? Math.max(0, enrichedData.stats.min - 10) 
    : (bpmValues.length > 0 ? Math.max(0, Math.min(...bpmValues) - 10) : 50);
  const maxBpm = enrichedData?.stats 
    ? Math.min(220, enrichedData.stats.max + 10) 
    : (bpmValues.length > 0 ? Math.min(220, Math.max(...bpmValues) + 10) : 180);

  const hasEnoughDataForCurve = enrichedData?.hasEnoughDataForCurve === true;

  // Calcul de la taille optimale pour la sidebar (Requirement 4.3)
  const getOptimalSizes = useMemo(() => {
    const isNarrow = effectiveWidth < 300;
    const isVeryNarrow = effectiveWidth < 250;
    
    return {
      fontSize: {
        axis: isVeryNarrow ? 8 : isNarrow ? 9 : 10,
        tooltip: isVeryNarrow ? 10 : 11,
        header: isVeryNarrow ? 12 : 13,
        stats: isVeryNarrow ? 9 : 10,
        legend: isVeryNarrow ? 8 : 9
      },
      margins: {
        top: isVeryNarrow ? 3 : 5,
        right: isVeryNarrow ? 10 : 15,
        left: isVeryNarrow ? 20 : 25,
        bottom: isVeryNarrow ? 10 : 15
      },
      dotSize: {
        normal: isVeryNarrow ? 1.5 : 2,
        active: isVeryNarrow ? 2.5 : 3
      },
      strokeWidth: isVeryNarrow ? 1.5 : 2
    };
  }, [effectiveWidth]);

  // Tooltip ultra-compact pour la sidebar (Requirements 1.3, 2.3, 4.3, 4.4, 4.5)
  const renderCompactTooltip = useCallback(({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }
    const dataPoint = payload[0];
    const bpm = dataPoint?.value;
    const originalPayload = dataPoint?.payload;

    // Informations sur la zone FC
    let zoneInfo = null;
    if (bpm && enrichedData?.metadata?.zoneThresholds) {
      const effectiveMaxHR = enrichedData.metadata.effectiveMaxHR;
      const hrPercentage = bpm / effectiveMaxHR;

      for (const zone of enrichedData.metadata.zoneThresholds) {
        const zoneMin = zone.minBpm / effectiveMaxHR;
        const zoneMax = zone.maxBpm / effectiveMaxHR;
        if (hrPercentage >= zoneMin && hrPercentage < zoneMax) {
          zoneInfo = zone;
          break;
        }
      }
      if (!zoneInfo && hrPercentage >= 0.90) {
        zoneInfo = enrichedData.metadata.zoneThresholds[4];
      }
    }

    // Informations sur le type de données (Requirement 1.3)
    const isRealData = originalPayload?.isReal === true;
    const isActivityData = originalPayload?.isActivity === true;
    const dataTypeInfo = isActivityData ? 'Activité' : isRealData ? 'Mesure réelle' : 'Interpolé';

    const sizes = getOptimalSizes;
    const isVeryNarrow = effectiveWidth < 250;
    
    return (
      <div 
        className="bg-slate-900/95 border border-slate-700 rounded-lg shadow-xl backdrop-blur-sm" 
        style={{ 
          minWidth: isVeryNarrow ? '140px' : '180px',
          padding: isVeryNarrow ? '8px' : '12px',
          maxWidth: effectiveWidth < 300 ? '200px' : '220px'
        }}
      >
        {/* En-tête avec heure (Requirement 4.5) */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-white font-semibold" 
             style={{ fontSize: `${sizes.fontSize.tooltip}px` }}>
            {label}
          </p>
          {!isVeryNarrow && (
            <span className="text-slate-400 text-xs">
              {dataTypeInfo}
            </span>
          )}
        </div>
        
        {/* Valeur FC principale (Requirement 1.3) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <p className="font-medium" 
               style={{ 
                 color: isActivityData ? '#10B981' : (dataPoint?.color || colors.red),
                 fontSize: `${sizes.fontSize.tooltip}px`
               }}>
              {`${bpm} bpm`}
            </p>
            {isActivityData && !isVeryNarrow && (
              <span className="text-green-400 text-xs">🏃‍♂️</span>
            )}
          </div>
          
          {/* Zone FC avec couleur (Requirement 2.3) */}
          {zoneInfo && (
            <div className="pt-1 border-t border-slate-700/50">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: zoneInfo.color }}
                />
                <p className="font-medium text-slate-200" 
                   style={{ fontSize: `${sizes.fontSize.tooltip - 1}px` }}>
                  {isVeryNarrow ? zoneInfo.name.charAt(0) : zoneInfo.name.split(' - ')[0]}
                </p>
              </div>
              {!isVeryNarrow && (
                <p className="text-slate-400 text-xs mt-1">
                  {`${zoneInfo.minBpm}-${zoneInfo.maxBpm} bpm`}
                </p>
              )}
            </div>
          )}
          
          {/* Statistiques contextuelles (Requirement 4.5) */}
          {!isVeryNarrow && enrichedData?.stats && (
            <div className="pt-1 border-t border-slate-700/50 mt-2">
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                <div>Min: {enrichedData.stats.min}</div>
                <div>Max: {enrichedData.stats.max}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }, [enrichedData, colors.red, getOptimalSizes, effectiveWidth]);

  // Gestionnaire de clic sur un point de données (Requirements 1.3, 2.3)
  const handleDataPointClick = useCallback((data, index, event) => {
    if (!data) return;
    
    setSelectedPoint(data);
    
    // Callback personnalisé si fourni
    if (onDataPointClick) {
      onDataPointClick(data, index, event);
    }
    
    // Navigation vers le sous-onglet Sport si demandé (Requirement 3.3)
    if (onNavigateToSport && event?.ctrlKey) {
      onNavigateToSport(data);
    }
  }, [onDataPointClick, onNavigateToSport]);

  // Gestionnaire de survol (Requirements 1.3, 2.3)
  const handleDataPointHover = useCallback((data, index) => {
    setHoveredPoint(data);
  }, []);

  // Gestionnaire de sortie de survol
  const handleDataPointLeave = useCallback(() => {
    setHoveredPoint(null);
  }, []);

  // Gestionnaire de clic sur le graphique pour navigation (Requirement 3.3)
  const handleChartClick = useCallback((event) => {
    if (onNavigateToSport && showNavigationHint) {
      // Double-clic pour naviguer vers le sous-onglet Sport
      if (event?.detail === 2) {
        onNavigateToSport();
      }
    }
  }, [onNavigateToSport, showNavigationHint]);

  // Légende ultra-compacte pour la sidebar (Requirements 4.3, 4.4)
  const CompactLegend = memo(() => {
    if (!enrichedData?.metadata?.zoneThresholds || !compactMode) return null;

    const sizes = getOptimalSizes;
    const isVeryNarrow = effectiveWidth < 250;
    
    // En mode très étroit, afficher seulement les zones avec le plus de temps
    const zonesToShow = isVeryNarrow ? 2 : 3;
    const significantZones = enrichedData.metadata.zoneThresholds
      .map(zone => ({
        ...zone,
        time: enrichedData.zones?.[zone.zone] || 0,
        percentage: enrichedData.metadata.duration > 0 
          ? Math.round((enrichedData.zones?.[zone.zone] || 0) / enrichedData.metadata.duration * 100) 
          : 0
      }))
      .filter(zone => zone.percentage > 0)
      .sort((a, b) => b.time - a.time)
      .slice(0, zonesToShow);

    if (significantZones.length === 0) return null;

    return (
      <div className="mt-2 p-2 bg-slate-900/30 border border-slate-700/50 rounded">
        <p className="text-slate-400 mb-1" 
           style={{ fontSize: `${sizes.fontSize.legend}px` }}>
          Zones FC
        </p>
        <div className={`flex ${isVeryNarrow ? 'flex-col gap-1' : 'flex-wrap gap-1'}`}>
          {significantZones.map((zone) => (
            <div 
              key={zone.zone} 
              className="flex items-center"
              style={{ fontSize: `${sizes.fontSize.legend}px` }}
              title={`${zone.name} (${zone.minBpm}-${zone.maxBpm} bpm)`}
            >
              <div 
                className="rounded-full mr-1"
                style={{ 
                  backgroundColor: zone.color,
                  width: isVeryNarrow ? '6px' : '8px',
                  height: isVeryNarrow ? '6px' : '8px'
                }}
              />
              <span className="text-slate-300">
                {isVeryNarrow ? zone.name.charAt(0) : zone.name.split(' - ')[0]}
              </span>
              <span className="text-slate-500 ml-1">{zone.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  });

  CompactLegend.displayName = 'CompactLegend';

  // Vérifications d'affichage
  if (!garminData || !selectedDate) {
    return (
      <div className={`bg-slate-800/60 border border-slate-700 rounded-lg p-4 text-center text-slate-400 ${className}`}>
        <p className="text-sm">Aucune donnée FC disponible</p>
        <p className="text-xs mt-1">Synchronisez vos données Garmin</p>
      </div>
    );
  }

  if (!enrichedData || validTimeSeries.length === 0) {
    return (
      <div className={`bg-slate-800/60 border border-slate-700 rounded-lg p-4 text-center text-slate-400 ${className}`}>
        <p className="text-sm">Aucune donnée FC pour {selectedDate}</p>
        <p className="text-xs mt-1">Synchronisez vos données Garmin</p>
      </div>
    );
  }

  // Contrainte de hauteur stricte (Requirement 4.1)
  const constrainedHeight = Math.min(height, 300);
  const sizes = getOptimalSizes;
  const isVeryNarrow = effectiveWidth < 250;
  
  return (
    <div 
      ref={containerRef}
      className={`bg-slate-800/60 border border-slate-700 rounded-lg ${isVeryNarrow ? 'p-2' : 'p-3'} ${className}`}>
      {/* En-tête ultra-compact (Requirements 4.2, 4.3) */}
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-white font-semibold" 
            style={{ fontSize: `${sizes.fontSize.header}px` }}>
          ❤️ FC{isVeryNarrow ? '' : ' - 24h'}
        </h4>
        <div className="text-slate-400" 
             style={{ fontSize: `${sizes.fontSize.stats}px` }}>
          {validTimeSeries.length}{isVeryNarrow ? 'pts' : ` point${validTimeSeries.length > 1 ? 's' : ''}`}
          {!hasEnoughDataForCurve && (
            <span className="text-yellow-400 ml-1" title="Données insuffisantes">⚠️</span>
          )}
        </div>
      </div>
      
      {/* Graphique principal avec priorité à la courbe FC (Requirements 4.1, 4.2) */}
      <div className="w-full" style={{ height: constrainedHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={validTimeSeries} margin={sizes.margins}>
            <defs>
              <linearGradient id="sidebarColorBpm" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.red} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={colors.red} stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            {/* Grille simplifiée pour l'espace réduit */}
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#374151" 
              opacity={isVeryNarrow ? 0.1 : 0.2} 
            />
            
            {/* Axe X avec police adaptée (Requirement 4.3) */}
            <XAxis
              dataKey="time"
              type="category"
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF', fontSize: sizes.fontSize.axis }}
              interval={isVeryNarrow ? "preserveStartEnd" : "preserveStartEnd"}
              domain={['dataMin', 'dataMax']}
              height={isVeryNarrow ? 20 : 25}
            />
            
            {/* Axe Y avec police adaptée (Requirement 4.3) */}
            <YAxis
              domain={[minBpm, maxBpm]}
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF', fontSize: sizes.fontSize.axis }}
              width={isVeryNarrow ? 30 : 35}
            />
            
            <Tooltip content={renderCompactTooltip} />
            
            {/* Courbe FC principale avec priorité visuelle (Requirement 4.2) */}
            <Area
              type={hasEnoughDataForCurve ? "monotone" : "linear"}
              dataKey="bpm"
              stroke={colors.red}
              strokeWidth={sizes.strokeWidth}
              fill={hasEnoughDataForCurve ? "url(#sidebarColorBpm)" : "none"}
              name="FC (bpm)"
              connectNulls={false}
              onClick={handleChartClick}
              onMouseEnter={handleDataPointLeave} // Reset hover when entering area
              dot={(props) => {
                const { key: _omittedKey, payload, index, ...restProps } = props;
                const isReal = payload?.isReal;
                const isActivity = payload?.isActivity;
                const isHovered = hoveredPoint?.timestamp === payload?.timestamp;
                const isSelected = selectedPoint?.timestamp === payload?.timestamp;
                
                // En mode très compact, afficher encore moins de points
                const skipInterval = isVeryNarrow ? 8 : 5;
                if (compactMode && !isReal && !isActivity && index % skipInterval !== 0 && !isHovered && !isSelected) {
                  return null;
                }
                
                if (!hasEnoughDataForCurve || isReal || isActivity || isHovered || isSelected) {
                  const dotKey = payload?.timestamp ?? `${payload?.hour}-${payload?.minute}-${index}`;
                  
                  // Couleurs interactives (Requirements 1.3, 2.3)
                  let dotFill = isActivity ? '#10B981' : (isReal ? colors.red : '#6B7280');
                  let dotStroke = dotFill;
                  let dotStrokeWidth = isReal || isActivity ? 1.5 : 1;
                  let dotRadius = isReal || isActivity ? sizes.dotSize.active : sizes.dotSize.normal;
                  let dotOpacity = isReal || isActivity ? 1 : 0.6;
                  
                  // États interactifs
                  if (isSelected) {
                    dotFill = '#FCD34D'; // Jaune pour sélection
                    dotStroke = '#FCD34D';
                    dotStrokeWidth = 2;
                    dotRadius = sizes.dotSize.active + 1;
                    dotOpacity = 1;
                  } else if (isHovered) {
                    dotStrokeWidth = 2;
                    dotRadius = sizes.dotSize.active;
                    dotOpacity = 1;
                  }
                  
                  return (
                    <CustomDot
                      key={dotKey}
                      payload={payload}
                      index={index}
                      {...restProps}
                      fill={dotFill}
                      stroke={dotStroke}
                      strokeWidth={dotStrokeWidth}
                      r={dotRadius}
                      opacity={dotOpacity}
                      isSelected={isSelected}
                      style={{ cursor: 'pointer' }}
                      onClick={(event) => handleDataPointClick(payload, index, event)}
                      onMouseEnter={() => handleDataPointHover(payload, index)}
                      onMouseLeave={handleDataPointLeave}
                    />
                  );
                }
                
                return null;
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Statistiques ultra-compactes (Requirements 4.3, 4.4) */}
      <div className="mt-2 text-slate-400 flex justify-between" 
           style={{ fontSize: `${sizes.fontSize.stats}px` }}>
        {isVeryNarrow ? (
          // Version ultra-compacte pour espaces très restreints
          <>
            <div>{enrichedData?.stats?.min || (bpmValues.length > 0 ? Math.min(...bpmValues) : '—')}</div>
            <div>{enrichedData?.stats?.max || (bpmValues.length > 0 ? Math.max(...bpmValues) : '—')}</div>
            <div>{enrichedData?.stats?.avg || (bpmValues.length > 0 ? Math.round(bpmValues.reduce((a, b) => a + b, 0) / bpmValues.length) : '—')}</div>
          </>
        ) : (
          // Version compacte normale
          <>
            <div>Min: {enrichedData?.stats?.min || (bpmValues.length > 0 ? Math.min(...bpmValues) : '—')} bpm</div>
            <div>Max: {enrichedData?.stats?.max || (bpmValues.length > 0 ? Math.max(...bpmValues) : '—')} bpm</div>
            <div>Moy: {enrichedData?.stats?.avg || (bpmValues.length > 0 ? Math.round(bpmValues.reduce((a, b) => a + b, 0) / bpmValues.length) : '—')} bpm</div>
          </>
        )}
      </div>

      {/* Légende ultra-compacte (Requirement 4.4) */}
      <CompactLegend />
      
      {/* Indication de navigation (Requirement 3.3) */}
      {showNavigationHint && onNavigateToSport && !isVeryNarrow && (
        <div className="mt-2 text-center">
          <button
            onClick={() => onNavigateToSport()}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors duration-200 flex items-center justify-center gap-1 w-full py-1 rounded hover:bg-slate-800/30"
            title="Voir les détails dans l'onglet Sport"
          >
            <span>📊</span>
            <span>Voir détails Sport</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-600">Double-clic</span>
          </button>
        </div>
      )}
    </div>
  );
});

SidebarHeartRateChart.displayName = 'SidebarHeartRateChart';

export default SidebarHeartRateChart;