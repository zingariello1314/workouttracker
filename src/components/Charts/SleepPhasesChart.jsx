import { memo, useMemo, useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';

/**
 * SleepPhasesChart - Graphique spécialisé pour les phases de sommeil
 * Barres empilées avec phases colorées et recommandations (Task 4.3)
 */
const SleepPhasesChart = memo(({ 
  data = [], 
  title = 'Phases de Sommeil',
  subtitle = '',
  height = 160,
  showTooltip = true,
  showGrid = true,
  showLegend = true,
  showObjectives = true,
  sleepObjective = 480, // 8h en minutes par défaut
  enableAnimations = true,
  className = ''
}) => {
  // État pour les interactions
  const [selectedPhase, setSelectedPhase] = useState(null);

  // Définition des phases de sommeil avec couleurs sémantiques
  const SLEEP_PHASES = useMemo(() => [
    {
      id: 'awake',
      name: 'Éveils',
      shortName: 'Éveils',
      color: '#F97316', // Orange
      description: 'Périodes d\'éveil pendant la nuit',
      recommendation: 'Normal si < 5% du temps total',
      idealPercent: { min: 0, max: 5 }
    },
    {
      id: 'light',
      name: 'Sommeil Léger',
      shortName: 'Léger',
      color: '#60A5FA', // Bleu clair
      description: 'Phase de transition et récupération légère',
      recommendation: 'Devrait représenter 45-55% du sommeil',
      idealPercent: { min: 45, max: 55 }
    },
    {
      id: 'deep',
      name: 'Sommeil Profond',
      shortName: 'Profond',
      color: '#8B5CF6', // Violet
      description: 'Phase de récupération physique intense',
      recommendation: 'Essentiel : 15-20% du sommeil total',
      idealPercent: { min: 15, max: 20 }
    },
    {
      id: 'rem',
      name: 'Sommeil REM',
      shortName: 'REM',
      color: '#F59E0B', // Jaune
      description: 'Phase de récupération mentale et rêves',
      recommendation: 'Important : 20-25% du sommeil total',
      idealPercent: { min: 20, max: 25 }
    }
  ], []);

  // Formatage du temps en heures:minutes
  const formatDuration = (minutes) => {
    if (!minutes || minutes === 0) return '0min';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h${mins.toString().padStart(2, '0')}`;
  };

  // Calcul de la qualité du sommeil (défini avant utilisation)
  const calculateSleepQuality = useCallback((light, deep, rem, awake) => {
    let score = 100;
    
    // Pénalités basées sur les recommandations
    const phases = [
      { percent: light, ideal: { min: 45, max: 55 }, weight: 0.3 },
      { percent: deep, ideal: { min: 15, max: 20 }, weight: 0.4 },
      { percent: rem, ideal: { min: 20, max: 25 }, weight: 0.3 },
      { percent: awake, ideal: { min: 0, max: 5 }, weight: 0.2 }
    ];

    phases.forEach(phase => {
      if (phase.percent < phase.ideal.min) {
        score -= (phase.ideal.min - phase.percent) * phase.weight;
      } else if (phase.percent > phase.ideal.max) {
        score -= (phase.percent - phase.ideal.max) * phase.weight;
      }
    });

    return Math.max(0, Math.min(100, Math.round(score)));
  }, []);

  // Formatage des données avec phases
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map(night => {
      const totalSleep = (night.light || 0) + (night.deep || 0) + (night.rem || 0) + (night.awake || 0);
      
      return {
        ...night,
        totalSleep,
        formattedDate: night.date ? new Date(night.date).toLocaleDateString('fr-FR', { 
          month: 'short', 
          day: 'numeric' 
        }) : night.label,
        // Calculer les pourcentages pour les recommandations
        lightPercent: totalSleep > 0 ? Math.round((night.light / totalSleep) * 100) : 0,
        deepPercent: totalSleep > 0 ? Math.round((night.deep / totalSleep) * 100) : 0,
        remPercent: totalSleep > 0 ? Math.round((night.rem / totalSleep) * 100) : 0,
        awakePercent: totalSleep > 0 ? Math.round((night.awake / totalSleep) * 100) : 0
      };
    });
  }, [data]);

  // Calcul des statistiques moyennes
  const sleepStats = useMemo(() => {
    if (!chartData.length) return null;

    const totalNights = chartData.length;
    const totals = chartData.reduce((acc, night) => ({
      totalSleep: acc.totalSleep + night.totalSleep,
      light: acc.light + (night.light || 0),
      deep: acc.deep + (night.deep || 0),
      rem: acc.rem + (night.rem || 0),
      awake: acc.awake + (night.awake || 0)
    }), { totalSleep: 0, light: 0, deep: 0, rem: 0, awake: 0 });

    const avgTotalSleep = totals.totalSleep / totalNights;
    const avgLight = totals.light / totalNights;
    const avgDeep = totals.deep / totalNights;
    const avgRem = totals.rem / totalNights;
    const avgAwake = totals.awake / totalNights;

    // Calcul des pourcentages moyens
    const avgLightPercent = avgTotalSleep > 0 ? (avgLight / avgTotalSleep) * 100 : 0;
    const avgDeepPercent = avgTotalSleep > 0 ? (avgDeep / avgTotalSleep) * 100 : 0;
    const avgRemPercent = avgTotalSleep > 0 ? (avgRem / avgTotalSleep) * 100 : 0;
    const avgAwakePercent = avgTotalSleep > 0 ? (avgAwake / avgTotalSleep) * 100 : 0;

    // Évaluation de la qualité
    const objectiveProgress = sleepObjective > 0 ? (avgTotalSleep / sleepObjective) * 100 : 0;
    const qualityScore = calculateSleepQuality(avgLightPercent, avgDeepPercent, avgRemPercent, avgAwakePercent);

    return {
      avgTotalSleep: Math.round(avgTotalSleep),
      avgLight: Math.round(avgLight),
      avgDeep: Math.round(avgDeep),
      avgRem: Math.round(avgRem),
      avgAwake: Math.round(avgAwake),
      avgLightPercent: Math.round(avgLightPercent),
      avgDeepPercent: Math.round(avgDeepPercent),
      avgRemPercent: Math.round(avgRemPercent),
      avgAwakePercent: Math.round(avgAwakePercent),
      objectiveProgress: Math.round(objectiveProgress),
      qualityScore,
      totalNights
    };
  }, [chartData, sleepObjective, calculateSleepQuality]);

  // Tooltip personnalisé avec recommandations
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    const totalSleep = data.totalSleep;
    
    // Évaluation de la qualité de cette nuit
    const qualityScore = calculateSleepQuality(
      data.lightPercent, data.deepPercent, data.remPercent, data.awakePercent
    );

    const getQualityStatus = (score) => {
      if (score >= 85) return { text: 'Excellent', color: '#10B981', icon: '😴' };
      if (score >= 70) return { text: 'Bon', color: '#F59E0B', icon: '😊' };
      if (score >= 50) return { text: 'Moyen', color: '#F97316', icon: '😐' };
      return { text: 'Insuffisant', color: '#EF4444', icon: '😵' };
    };

    const qualityStatus = getQualityStatus(qualityScore);

    return (
      <div className="sleep-phases-tooltip">
        <div className="tooltip-header">
          <span className="tooltip-date">{label}</span>
          <span className="tooltip-total">{formatDuration(totalSleep)}</span>
        </div>
        
        <div className="tooltip-content">
          {SLEEP_PHASES.map(phase => {
            const duration = data[phase.id] || 0;
            const percent = data[`${phase.id}Percent`] || 0;
            
            if (duration === 0) return null;
            
            return (
              <div key={phase.id} className="tooltip-phase">
                <div className="phase-info">
                  <span 
                    className="phase-color-indicator" 
                    style={{ backgroundColor: phase.color }}
                  />
                  <span className="phase-name">{phase.shortName}</span>
                  <span className="phase-duration">{formatDuration(duration)}</span>
                  <span className="phase-percent">({percent}%)</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Qualité du sommeil */}
        <div className="tooltip-quality">
          <div className="quality-header">
            <span className="quality-icon">{qualityStatus.icon}</span>
            <span className="quality-text">Qualité: {qualityStatus.text}</span>
            <span className="quality-score" style={{ color: qualityStatus.color }}>
              {qualityScore}/100
            </span>
          </div>
        </div>

        {/* Objectif */}
        {showObjectives && sleepObjective > 0 && (
          <div className="tooltip-objective">
            <span className="objective-label">Objectif:</span>
            <span className="objective-progress">
              {Math.round((totalSleep / sleepObjective) * 100)}% 
              ({formatDuration(sleepObjective)})
            </span>
          </div>
        )}
      </div>
    );
  };

  // Légende interactive
  const CustomLegend = ({ payload }) => {
    if (!payload || !payload.length) return null;

    const handleLegendClick = useCallback((dataKey) => {
      setSelectedPhase(prev => prev === dataKey ? null : dataKey);
    }, []);

    return (
      <div className="sleep-phases-legend">
        {payload.map((entry, index) => {
          const phase = SLEEP_PHASES.find(p => p.id === entry.dataKey);
          if (!phase) return null;

          const isSelected = selectedPhase === entry.dataKey;
          const isDimmed = selectedPhase && selectedPhase !== entry.dataKey;

          return (
            <div 
              key={index} 
              className={`legend-item ${isSelected ? 'selected' : ''} ${isDimmed ? 'dimmed' : ''}`}
              onClick={() => handleLegendClick(entry.dataKey)}
            >
              <span 
                className="legend-color" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="legend-label">{phase.shortName}</span>
              <span className="legend-ideal">{phase.idealPercent.min}-{phase.idealPercent.max}%</span>
            </div>
          );
        })}
      </div>
    );
  };

  if (!chartData || chartData.length === 0) {
    return (
      <div className={`sleep-phases-container ${className}`}>
        {title && (
          <div className="chart-header">
            <h3 className="chart-title">{title}</h3>
            {subtitle && <p className="chart-subtitle">{subtitle}</p>}
          </div>
        )}
        <div className="chart-empty-state">
          <div className="empty-chart-icon">😴</div>
          <div className="empty-chart-message">Aucune donnée de sommeil</div>
          <div className="empty-chart-suggestion">
            Portez votre montre Garmin la nuit pour analyser votre sommeil
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`sleep-phases-container ${className}`}>
      {title && (
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          {subtitle && <p className="chart-subtitle">{subtitle}</p>}
        </div>
      )}
      
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart 
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
              dataKey="formattedDate"
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
              tickFormatter={formatDuration}
            />
            
            {showTooltip && (
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ 
                  fill: 'rgba(255, 255, 255, 0.05)'
                }}
              />
            )}
            
            {showLegend && (
              <Legend 
                content={<CustomLegend />}
                wrapperStyle={{
                  paddingTop: '10px'
                }}
              />
            )}

            {/* Ligne de référence pour objectif de sommeil */}
            {showObjectives && sleepObjective > 0 && (
              <ReferenceLine 
                y={sleepObjective} 
                stroke="rgba(34, 197, 94, 0.8)"
                strokeDasharray="4 4"
                strokeWidth={2}
                label={{ 
                  value: `Objectif: ${formatDuration(sleepObjective)}`, 
                  position: 'topRight',
                  style: { 
                    fill: 'rgba(34, 197, 94, 0.9)', 
                    fontSize: '11px',
                    fontWeight: '600'
                  }
                }}
              />
            )}
            
            {/* Barres empilées par phase de sommeil */}
            {SLEEP_PHASES.map((phase, index) => (
              <Bar 
                key={phase.id}
                dataKey={phase.id} 
                stackId="sleep"
                fill={selectedPhase === phase.id ? phase.color : 
                      selectedPhase && selectedPhase !== phase.id ? 
                      `${phase.color}40` : phase.color}
                name={phase.shortName}
                radius={index === SLEEP_PHASES.length - 1 ? [2, 2, 0, 0] : [0, 0, 0, 0]}
                animationBegin={enableAnimations ? index * 150 : 0}
                animationDuration={enableAnimations ? 800 : 0}
                animationEasing="ease-out"
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Statistiques moyennes avec recommandations */}
      {sleepStats && (
        <div className="sleep-phases-stats">
          <div className="stats-header">
            <span className="stats-title">Moyennes sur {sleepStats.totalNights} nuits</span>
            <div className="quality-indicator">
              <span className="quality-label">Qualité:</span>
              <span 
                className="quality-score"
                style={{ 
                  color: sleepStats.qualityScore >= 85 ? '#10B981' : 
                         sleepStats.qualityScore >= 70 ? '#F59E0B' : 
                         sleepStats.qualityScore >= 50 ? '#F97316' : '#EF4444'
                }}
              >
                {sleepStats.qualityScore}/100
              </span>
            </div>
          </div>
          
          <div className="phases-breakdown">
            {SLEEP_PHASES.map(phase => {
              const avgPercent = sleepStats[`avg${phase.id.charAt(0).toUpperCase() + phase.id.slice(1)}Percent`];
              const avgDuration = sleepStats[`avg${phase.id.charAt(0).toUpperCase() + phase.id.slice(1)}`];
              const isInRange = avgPercent >= phase.idealPercent.min && avgPercent <= phase.idealPercent.max;
              
              return (
                <div key={phase.id} className="phase-stat">
                  <div className="phase-stat-header">
                    <span 
                      className="phase-color" 
                      style={{ backgroundColor: phase.color }}
                    />
                    <span className="phase-name">{phase.shortName}</span>
                    <span className={`phase-status ${isInRange ? 'good' : 'warning'}`}>
                      {avgPercent}% {isInRange ? '✓' : '⚠️'}
                    </span>
                  </div>
                  <div className="phase-details">
                    <span className="phase-duration">{formatDuration(avgDuration)}</span>
                    <span className="phase-ideal">Idéal: {phase.idealPercent.min}-{phase.idealPercent.max}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

SleepPhasesChart.displayName = 'SleepPhasesChart';

export default SleepPhasesChart;