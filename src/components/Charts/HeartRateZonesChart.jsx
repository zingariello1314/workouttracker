import { memo, useMemo, useState, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

/**
 * HeartRateZonesChart - Graphique spécialisé pour les zones cardiaques
 * Zones colorées avec seuils et explications contextuelles (Task 4.2)
 */
const HeartRateZonesChart = memo(({ 
  data = [], 
  title = 'Zones de Fréquence Cardiaque',
  subtitle = '',
  height = 180,
  showTooltip = true,
  showGrid = true,
  showZoneLabels = true,
  maxHeartRate = 190, // FCMax par défaut (220 - 30 ans)
  userAge = 30,
  enableAnimations = true,
  className = ''
}) => {
  // État pour les interactions
  const [hoveredZone, setHoveredZone] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);

  // Calcul automatique de la FCMax si âge fourni
  const calculatedMaxHR = useMemo(() => {
    return maxHeartRate || (220 - userAge);
  }, [maxHeartRate, userAge]);

  // Définition des zones cardiaques avec couleurs sémantiques
  const HEART_RATE_ZONES = useMemo(() => [
    {
      id: 'zone1',
      name: 'Zone 1 - Récupération',
      shortName: 'Récupération',
      color: '#3B82F6', // Bleu
      minPercent: 50,
      maxPercent: 60,
      description: 'Récupération active, amélioration de la circulation',
      benefits: 'Récupération, échauffement, retour au calme'
    },
    {
      id: 'zone2',
      name: 'Zone 2 - Aérobie',
      shortName: 'Aérobie',
      color: '#10B981', // Vert
      minPercent: 60,
      maxPercent: 70,
      description: 'Développement de l\'endurance de base',
      benefits: 'Combustion des graisses, endurance fondamentale'
    },
    {
      id: 'zone3',
      name: 'Zone 3 - Tempo',
      shortName: 'Tempo',
      color: '#F59E0B', // Jaune
      minPercent: 70,
      maxPercent: 80,
      description: 'Amélioration de l\'efficacité cardiaque',
      benefits: 'Endurance, efficacité cardiovasculaire'
    },
    {
      id: 'zone4',
      name: 'Zone 4 - Seuil',
      shortName: 'Seuil',
      color: '#F97316', // Orange
      minPercent: 80,
      maxPercent: 90,
      description: 'Développement de la puissance aérobie',
      benefits: 'Seuil lactique, performance en course'
    },
    {
      id: 'zone5',
      name: 'Zone 5 - VO2Max',
      shortName: 'VO2Max',
      color: '#EF4444', // Rouge
      minPercent: 90,
      maxPercent: 100,
      description: 'Développement de la puissance maximale',
      benefits: 'Puissance maximale, vitesse, VO2Max'
    }
  ], []);

  // Calcul des seuils en BPM
  const zoneThresholds = useMemo(() => {
    return HEART_RATE_ZONES.map(zone => ({
      ...zone,
      minBPM: Math.round((zone.minPercent / 100) * calculatedMaxHR),
      maxBPM: Math.round((zone.maxPercent / 100) * calculatedMaxHR)
    }));
  }, [HEART_RATE_ZONES, calculatedMaxHR]);

  // Formatage des données avec zones
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map(point => {
      const hr = point.heartRate || point.bpm || 0;
      const zones = {};
      
      // Calculer dans quelle zone se trouve la FC
      zoneThresholds.forEach(zone => {
        zones[zone.id] = (hr >= zone.minBPM && hr <= zone.maxBPM) ? hr : 0;
      });

      return {
        ...point,
        heartRate: hr,
        ...zones,
        formattedTime: point.time ? new Date(point.time).toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }) : point.label
      };
    });
  }, [data, zoneThresholds]);

  // Calcul du temps passé dans chaque zone
  const zoneStats = useMemo(() => {
    if (!chartData.length) return {};

    const stats = {};
    const totalPoints = chartData.length;

    zoneThresholds.forEach(zone => {
      const pointsInZone = chartData.filter(point => point[zone.id] > 0).length;
      const timeInZone = (pointsInZone / totalPoints) * 100;
      
      stats[zone.id] = {
        ...zone,
        timePercent: Math.round(timeInZone),
        pointsCount: pointsInZone,
        avgBPM: pointsInZone > 0 ? 
          Math.round(chartData.filter(p => p[zone.id] > 0)
            .reduce((sum, p) => sum + p.heartRate, 0) / pointsInZone) : 0
      };
    });

    return stats;
  }, [chartData, zoneThresholds]);

  // Tooltip personnalisé avec explications des zones
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    const currentHR = data.heartRate;
    
    // Trouver la zone active
    const activeZone = zoneThresholds.find(zone => 
      currentHR >= zone.minBPM && currentHR <= zone.maxBPM
    );

    return (
      <div className="hr-zones-tooltip">
        <div className="tooltip-header">
          <span className="tooltip-time">{label}</span>
          <span className="tooltip-hr">{currentHR} bpm</span>
        </div>
        
        {activeZone && (
          <div className="tooltip-zone">
            <div className="zone-info">
              <span 
                className="zone-color-indicator" 
                style={{ backgroundColor: activeZone.color }}
              />
              <span className="zone-name">{activeZone.shortName}</span>
              <span className="zone-range">
                {activeZone.minBPM}-{activeZone.maxBPM} bpm
              </span>
            </div>
            <div className="zone-description">{activeZone.description}</div>
            <div className="zone-benefits">{activeZone.benefits}</div>
          </div>
        )}

        <div className="tooltip-stats">
          <div className="stat-item">
            <span className="stat-label">% FCMax:</span>
            <span className="stat-value">{Math.round((currentHR / calculatedMaxHR) * 100)}%</span>
          </div>
        </div>
      </div>
    );
  };

  // Légende interactive des zones
  const ZoneLegend = () => (
    <div className="hr-zones-legend">
      {zoneThresholds.map((zone, index) => {
        const stats = zoneStats[zone.id];
        const isSelected = selectedZone === zone.id;
        const isDimmed = selectedZone && selectedZone !== zone.id;

        return (
          <div 
            key={zone.id}
            className={`zone-legend-item ${isSelected ? 'selected' : ''} ${isDimmed ? 'dimmed' : ''}`}
            onClick={() => setSelectedZone(prev => prev === zone.id ? null : zone.id)}
            onMouseEnter={() => setHoveredZone(zone.id)}
            onMouseLeave={() => setHoveredZone(null)}
          >
            <div className="zone-header">
              <span 
                className="zone-color" 
                style={{ backgroundColor: zone.color }}
              />
              <span className="zone-name">{zone.shortName}</span>
              <span className="zone-range">{zone.minBPM}-{zone.maxBPM}</span>
            </div>
            {stats && (
              <div className="zone-stats">
                <span className="zone-time">{stats.timePercent}% du temps</span>
                {stats.avgBPM > 0 && (
                  <span className="zone-avg">Moy: {stats.avgBPM} bpm</span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // Gestion des interactions
  const handleZoneClick = useCallback((zoneId) => {
    setSelectedZone(prev => prev === zoneId ? null : zoneId);
  }, []);

  if (!chartData || chartData.length === 0) {
    return (
      <div className={`hr-zones-container ${className}`}>
        {title && (
          <div className="chart-header">
            <h3 className="chart-title">{title}</h3>
            {subtitle && <p className="chart-subtitle">{subtitle}</p>}
          </div>
        )}
        <div className="chart-empty-state">
          <div className="empty-chart-icon">❤️</div>
          <div className="empty-chart-message">Aucune donnée de fréquence cardiaque</div>
          <div className="empty-chart-suggestion">
            Connectez votre montre Garmin pour voir vos zones cardiaques
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`hr-zones-container ${className}`}>
      {title && (
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          {subtitle && <p className="chart-subtitle">{subtitle}</p>}
          <div className="chart-info">
            <span className="fcmax-info">FCMax: {calculatedMaxHR} bpm</span>
          </div>
        </div>
      )}
      
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart 
            data={chartData} 
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            {showGrid && (
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="rgba(255, 255, 255, 0.1)"
                strokeOpacity={0.3}
              />
            )}
            
            <XAxis 
              dataKey="formattedTime"
              axisLine={false}
              tickLine={false}
              tick={{ 
                fontSize: 11, 
                fill: 'rgba(255, 255, 255, 0.7)',
                fontWeight: 500
              }}
            />
            
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ 
                fontSize: 11, 
                fill: 'rgba(255, 255, 255, 0.7)',
                fontWeight: 500
              }}
              domain={[0, calculatedMaxHR]}
              tickFormatter={(value) => `${value} bpm`}
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

            {/* Lignes de référence pour les seuils de zones */}
            {showZoneLabels && zoneThresholds.map((zone, index) => (
              <ReferenceLine 
                key={`threshold-${zone.id}`}
                y={zone.minBPM} 
                stroke={zone.color}
                strokeDasharray="2 2"
                strokeWidth={1}
                strokeOpacity={0.6}
                label={{ 
                  value: `${zone.shortName} (${zone.minBPM})`, 
                  position: 'topRight',
                  style: { 
                    fill: zone.color, 
                    fontSize: '10px',
                    fontWeight: '500'
                  }
                }}
              />
            ))}
            
            {/* Aires empilées pour chaque zone */}
            {zoneThresholds.map((zone, index) => (
              <Area
                key={zone.id}
                dataKey={zone.id}
                stackId="zones"
                stroke={zone.color}
                fill={selectedZone === zone.id ? zone.color : 
                      selectedZone && selectedZone !== zone.id ? 
                      `${zone.color}20` : `${zone.color}80`}
                strokeWidth={2}
                animationBegin={enableAnimations ? index * 100 : 0}
                animationDuration={enableAnimations ? 1000 : 0}
                animationEasing="ease-out"
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* Légende interactive des zones */}
      <ZoneLegend />
      
      {/* Résumé des zones */}
      <div className="hr-zones-summary">
        <div className="summary-title">Répartition du temps par zone</div>
        <div className="zones-distribution">
          {Object.values(zoneStats).map(zone => (
            <div key={zone.id} className="zone-bar-container">
              <div className="zone-bar-label">
                <span className="zone-name">{zone.shortName}</span>
                <span className="zone-percent">{zone.timePercent}%</span>
              </div>
              <div className="zone-bar-bg">
                <div 
                  className="zone-bar-fill"
                  style={{ 
                    width: `${zone.timePercent}%`,
                    backgroundColor: zone.color
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

HeartRateZonesChart.displayName = 'HeartRateZonesChart';

export default HeartRateZonesChart;