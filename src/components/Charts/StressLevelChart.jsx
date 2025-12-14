import { memo, useMemo, useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';

/**
 * StressLevelChart - Graphique spécialisé pour les niveaux de stress
 * Courbe lissée avec gradient vert→rouge et conseils contextuels (Task 4.4)
 */
const StressLevelChart = memo(({ 
  data = [], 
  title = 'Niveaux de Stress',
  subtitle = '',
  height = 160,
  showTooltip = true,
  showGrid = true,
  showThresholds = true,
  enableAnimations = true,
  className = ''
}) => {
  // État pour les interactions
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Définition des niveaux de stress avec couleurs et conseils
  const STRESS_LEVELS = useMemo(() => [
    {
      id: 'rest',
      name: 'Repos',
      range: { min: 0, max: 25 },
      color: '#10B981', // Vert
      description: 'État de repos et récupération',
      advice: 'Profitez de ce moment de calme pour vous ressourcer',
      icon: '😌'
    },
    {
      id: 'low',
      name: 'Stress Faible',
      range: { min: 25, max: 50 },
      color: '#F59E0B', // Jaune
      description: 'Stress léger, situation normale',
      advice: 'Maintenez vos activités habituelles',
      icon: '🙂'
    },
    {
      id: 'moderate',
      name: 'Stress Modéré',
      range: { min: 50, max: 75 },
      color: '#F97316', // Orange
      description: 'Stress modéré, attention requise',
      advice: 'Prenez des pauses régulières et respirez profondément',
      icon: '😐'
    },
    {
      id: 'high',
      name: 'Stress Élevé',
      range: { min: 75, max: 100 },
      color: '#EF4444', // Rouge
      description: 'Stress élevé, action recommandée',
      advice: 'Pratiquez la méditation ou une activité relaxante',
      icon: '😰'
    }
  ], []);

  // Formatage des données avec lissage
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map((point, index) => {
      const stress = point.stress || point.stressLevel || 0;
      
      // Lissage simple avec les points adjacents
      let smoothedStress = stress;
      if (data.length > 2) {
        const prev = index > 0 ? (data[index - 1].stress || data[index - 1].stressLevel || 0) : stress;
        const next = index < data.length - 1 ? (data[index + 1].stress || data[index + 1].stressLevel || 0) : stress;
        smoothedStress = Math.round((prev + stress + next) / 3);
      }

      return {
        ...point,
        stress: Math.max(0, Math.min(100, stress)),
        smoothedStress: Math.max(0, Math.min(100, smoothedStress)),
        formattedTime: point.time ? new Date(point.time).toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }) : point.label
      };
    });
  }, [data]);

  // Calcul des statistiques de stress
  const stressStats = useMemo(() => {
    if (!chartData.length) return null;

    const stressValues = chartData.map(p => p.stress);
    const avgStress = stressValues.reduce((sum, val) => sum + val, 0) / stressValues.length;
    const maxStress = Math.max(...stressValues);
    const minStress = Math.min(...stressValues);

    // Calcul du temps passé dans chaque niveau
    const levelStats = STRESS_LEVELS.map(level => {
      const pointsInLevel = chartData.filter(p => 
        p.stress >= level.range.min && p.stress < level.range.max
      ).length;
      const timePercent = (pointsInLevel / chartData.length) * 100;
      
      return {
        ...level,
        timePercent: Math.round(timePercent),
        pointsCount: pointsInLevel
      };
    });

    // Déterminer le niveau dominant
    const dominantLevel = levelStats.reduce((prev, current) => 
      current.timePercent > prev.timePercent ? current : prev
    );

    return {
      avgStress: Math.round(avgStress),
      maxStress,
      minStress,
      levelStats,
      dominantLevel,
      totalPoints: chartData.length
    };
  }, [chartData, STRESS_LEVELS]);

  // Fonction pour obtenir la couleur du gradient basée sur le niveau de stress
  const getStressColor = (stress) => {
    const level = STRESS_LEVELS.find(l => stress >= l.range.min && stress < l.range.max);
    return level ? level.color : STRESS_LEVELS[STRESS_LEVELS.length - 1].color;
  };

  // Fonction pour obtenir le niveau de stress actuel
  const getCurrentStressLevel = (stress) => {
    return STRESS_LEVELS.find(l => stress >= l.range.min && stress < l.range.max) || STRESS_LEVELS[0];
  };

  // Tooltip personnalisé avec conseils
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    const currentStress = data.stress;
    const currentLevel = getCurrentStressLevel(currentStress);

    return (
      <div className="stress-chart-tooltip">
        <div className="tooltip-header">
          <span className="tooltip-time">{label}</span>
          <span className="tooltip-stress" style={{ color: currentLevel.color }}>
            {currentStress}/100
          </span>
        </div>
        
        <div className="tooltip-level">
          <div className="level-info">
            <span className="level-icon">{currentLevel.icon}</span>
            <span className="level-name">{currentLevel.name}</span>
            <span className="level-range">({currentLevel.range.min}-{currentLevel.range.max})</span>
          </div>
          <div className="level-description">{currentLevel.description}</div>
        </div>

        <div className="tooltip-advice">
          <div className="advice-header">💡 Conseil</div>
          <div className="advice-text">{currentLevel.advice}</div>
        </div>

        {/* Événements contextuels si disponibles */}
        {data.event && (
          <div className="tooltip-event">
            <div className="event-header">📅 Événement</div>
            <div className="event-text">{data.event}</div>
          </div>
        )}
      </div>
    );
  };

  // Génération du gradient pour la courbe
  const generateGradient = () => {
    const gradientStops = STRESS_LEVELS.map((level, index) => (
      <stop 
        key={level.id}
        offset={`${(level.range.max / 100) * 100}%`}
        stopColor={level.color}
        stopOpacity={0.8}
      />
    ));

    return (
      <defs>
        <linearGradient id="stressGradient" x1="0" y1="0" x2="0" y2="1">
          {gradientStops}
        </linearGradient>
        <linearGradient id="stressAreaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="url(#stressGradient)" stopOpacity={0.3} />
          <stop offset="100%" stopColor="url(#stressGradient)" stopOpacity={0.1} />
        </linearGradient>
      </defs>
    );
  };

  if (!chartData || chartData.length === 0) {
    return (
      <div className={`stress-chart-container ${className}`}>
        {title && (
          <div className="chart-header">
            <h3 className="chart-title">{title}</h3>
            {subtitle && <p className="chart-subtitle">{subtitle}</p>}
          </div>
        )}
        <div className="chart-empty-state">
          <div className="empty-chart-icon">😌</div>
          <div className="empty-chart-message">Aucune donnée de stress</div>
          <div className="empty-chart-suggestion">
            Activez le suivi du stress sur votre montre Garmin
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`stress-chart-container ${className}`}>
      {title && (
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          {subtitle && <p className="chart-subtitle">{subtitle}</p>}
        </div>
      )}
      
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart 
            data={chartData} 
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            {generateGradient()}
            
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
              domain={[0, 100]}
              tickFormatter={(value) => `${value}`}
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

            {/* Lignes de référence pour les seuils de stress */}
            {showThresholds && STRESS_LEVELS.slice(1).map((level, index) => (
              <ReferenceLine 
                key={`threshold-${level.id}`}
                y={level.range.min} 
                stroke={level.color}
                strokeDasharray="2 2"
                strokeWidth={1}
                strokeOpacity={0.5}
                label={{ 
                  value: level.name, 
                  position: 'topRight',
                  style: { 
                    fill: level.color, 
                    fontSize: '10px',
                    fontWeight: '500'
                  }
                }}
              />
            ))}
            
            {/* Aire avec gradient */}
            <Area
              dataKey="smoothedStress"
              stroke="url(#stressGradient)"
              fill="url(#stressAreaGradient)"
              strokeWidth={3}
              dot={false}
              activeDot={{ 
                r: 4, 
                stroke: 'rgba(255, 255, 255, 0.8)',
                strokeWidth: 2,
                fill: 'url(#stressGradient)'
              }}
              animationBegin={0}
              animationDuration={enableAnimations ? 1500 : 0}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* Légende des niveaux de stress */}
      <div className="stress-levels-legend">
        {STRESS_LEVELS.map((level, index) => (
          <div key={level.id} className="stress-level-item">
            <div className="level-header">
              <span className="level-icon">{level.icon}</span>
              <span 
                className="level-color" 
                style={{ backgroundColor: level.color }}
              />
              <span className="level-name">{level.name}</span>
              <span className="level-range">{level.range.min}-{level.range.max}</span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Statistiques et conseils */}
      {stressStats && (
        <div className="stress-stats">
          <div className="stats-summary">
            <div className="stat-item">
              <span className="stat-label">Moyenne:</span>
              <span 
                className="stat-value"
                style={{ color: getStressColor(stressStats.avgStress) }}
              >
                {stressStats.avgStress}/100
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Max:</span>
              <span 
                className="stat-value"
                style={{ color: getStressColor(stressStats.maxStress) }}
              >
                {stressStats.maxStress}/100
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Niveau dominant:</span>
              <span 
                className="stat-value"
                style={{ color: stressStats.dominantLevel.color }}
              >
                {stressStats.dominantLevel.name} ({stressStats.dominantLevel.timePercent}%)
              </span>
            </div>
          </div>

          <div className="stress-advice-card">
            <div className="advice-header">
              <span className="advice-icon">{stressStats.dominantLevel.icon}</span>
              <span className="advice-title">Conseil personnalisé</span>
            </div>
            <div className="advice-content">
              {stressStats.dominantLevel.advice}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

StressLevelChart.displayName = 'StressLevelChart';

export default StressLevelChart;