import { memo, useMemo, useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';

/**
 * ReadingProgressChart - Graphique spécialisé pour la progression de lecture
 * Barres empilées avec types de lecture (fiction, non-fiction, technique)
 * Inclut objectifs et comparaisons temporelles (Task 3.3)
 */
const ReadingProgressChart = memo(({ 
  data = [], 
  title = 'Pages lues par jour',
  subtitle = '',
  height = 160,
  showTooltip = true,
  showGrid = true,
  showLegend = true,
  showObjectives = true,
  dailyObjective = 50, // Pages par jour par défaut
  monthlyObjective = 1500, // Pages par mois par défaut
  previousPeriodData = null, // Données période précédente pour comparaison
  onBarClick = null, // Callback pour drill-down (Task 3.4)
  enableAnimations = true, // Animations fluides (Task 3.4)
  className = ''
}) => {
  // État pour les interactions (Task 3.4)
  const [hoveredBar, setHoveredBar] = useState(null);
  const [selectedReadingType, setSelectedReadingType] = useState(null);
  // Couleurs sémantiques pour les types de lecture
  const READING_COLORS = {
    fiction: '#3B82F6',      // Bleu - détente, évasion
    nonFiction: '#F59E0B',   // Orange - apprentissage, développement
    technical: '#8B5CF6',    // Violet - expertise, compétences
  };

  // Formatage des valeurs pour les tooltips
  const formatPages = (value) => {
    if (value === 0) return '0 page';
    if (value === 1) return '1 page';
    return `${value} pages`;
  };

  // Tooltip personnalisé avec détails par type et comparaisons (Task 3.3)
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    const total = data.fiction + data.nonFiction + data.technical;
    
    // Comparaison avec objectif quotidien
    const objectiveProgress = dailyObjective > 0 ? (total / dailyObjective) * 100 : 0;
    const objectiveStatus = objectiveProgress >= 100 ? '✅' : 
                           objectiveProgress >= 75 ? '🟡' : 
                           objectiveProgress >= 50 ? '🟠' : '🔴';

    // Comparaison avec période précédente si disponible
    const previousDayData = previousPeriodData?.find(d => d.formattedDate === label);
    const previousTotal = previousDayData ? previousDayData.total : 0;
    const comparison = previousTotal > 0 ? 
      ((total - previousTotal) / previousTotal * 100).toFixed(0) : null;

    return (
      <div className="reading-chart-tooltip">
        <div className="tooltip-header">
          <span className="tooltip-date">{label}</span>
          <span className="tooltip-total">{formatPages(total)}</span>
        </div>
        
        <div className="tooltip-content">
          {data.fiction > 0 && (
            <div className="tooltip-item">
              <span 
                className="tooltip-color-indicator" 
                style={{ backgroundColor: READING_COLORS.fiction }}
              />
              <span className="tooltip-name">Fiction</span>
              <span className="tooltip-value">{formatPages(data.fiction)}</span>
            </div>
          )}
          {data.nonFiction > 0 && (
            <div className="tooltip-item">
              <span 
                className="tooltip-color-indicator" 
                style={{ backgroundColor: READING_COLORS.nonFiction }}
              />
              <span className="tooltip-name">Non-fiction</span>
              <span className="tooltip-value">{formatPages(data.nonFiction)}</span>
            </div>
          )}
          {data.technical > 0 && (
            <div className="tooltip-item">
              <span 
                className="tooltip-color-indicator" 
                style={{ backgroundColor: READING_COLORS.technical }}
              />
              <span className="tooltip-name">Technique</span>
              <span className="tooltip-value">{formatPages(data.technical)}</span>
            </div>
          )}
          {total === 0 && (
            <div className="tooltip-empty">
              <span className="tooltip-empty-text">Aucune lecture</span>
            </div>
          )}
        </div>

        {/* Objectif quotidien */}
        {showObjectives && dailyObjective > 0 && (
          <div className="tooltip-objective">
            <div className="tooltip-objective-header">
              <span className="objective-icon">{objectiveStatus}</span>
              <span className="objective-text">Objectif quotidien</span>
            </div>
            <div className="objective-progress">
              <span className="objective-value">{Math.round(objectiveProgress)}%</span>
              <span className="objective-target">({formatPages(dailyObjective)})</span>
            </div>
          </div>
        )}

        {/* Comparaison période précédente */}
        {comparison !== null && (
          <div className="tooltip-comparison">
            <span className="comparison-label">vs période précédente:</span>
            <span className={`comparison-value ${comparison >= 0 ? 'positive' : 'negative'}`}>
              {comparison >= 0 ? '+' : ''}{comparison}%
            </span>
          </div>
        )}
      </div>
    );
  };

  // Légende interactive (Task 3.4)
  const CustomLegend = ({ payload }) => {
    if (!payload || !payload.length) return null;

    const handleLegendClick = useCallback((dataKey) => {
      setSelectedReadingType(prev => prev === dataKey ? null : dataKey);
    }, []);

    return (
      <div className="reading-chart-legend">
        {payload.map((entry, index) => (
          <div 
            key={index} 
            className={`legend-item ${selectedReadingType === entry.dataKey ? 'selected' : ''} ${selectedReadingType && selectedReadingType !== entry.dataKey ? 'dimmed' : ''}`}
            onClick={() => handleLegendClick(entry.dataKey)}
            style={{ cursor: 'pointer' }}
          >
            <span 
              className="legend-color" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="legend-label">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  // Gestion des interactions avec les barres (Task 3.4)
  const handleBarClick = useCallback((data, index) => {
    if (onBarClick) {
      onBarClick({
        date: data.date,
        data: data,
        readingType: selectedReadingType,
        index
      });
    }
  }, [onBarClick, selectedReadingType]);

  const handleMouseEnter = useCallback((data, index) => {
    setHoveredBar(index);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredBar(null);
  }, []);

  // Statistiques de la période avec objectifs et comparaisons (Task 3.3)
  const periodStats = useMemo(() => {
    if (!data || data.length === 0) return null;

    const totalPages = data.reduce((sum, day) => sum + day.total, 0);
    const totalFiction = data.reduce((sum, day) => sum + day.fiction, 0);
    const totalNonFiction = data.reduce((sum, day) => sum + day.nonFiction, 0);
    const totalTechnical = data.reduce((sum, day) => sum + day.technical, 0);
    
    const daysWithReading = data.filter(day => day.total > 0).length;
    const avgPagesPerDay = daysWithReading > 0 ? Math.round(totalPages / daysWithReading) : 0;

    // Calculs d'objectifs
    const dailyObjectiveTotal = dailyObjective * data.length;
    const objectiveProgress = dailyObjectiveTotal > 0 ? (totalPages / dailyObjectiveTotal) * 100 : 0;
    const objectiveStatus = objectiveProgress >= 100 ? 'success' : 
                           objectiveProgress >= 75 ? 'warning' : 
                           objectiveProgress >= 50 ? 'caution' : 'danger';

    // Comparaison avec période précédente
    let previousComparison = null;
    if (previousPeriodData && previousPeriodData.length > 0) {
      const previousTotal = previousPeriodData.reduce((sum, day) => sum + day.total, 0);
      if (previousTotal > 0) {
        const changePercent = ((totalPages - previousTotal) / previousTotal) * 100;
        previousComparison = {
          changePercent: Math.round(changePercent),
          previousTotal,
          trend: changePercent >= 5 ? 'up' : changePercent <= -5 ? 'down' : 'stable'
        };
      }
    }

    return {
      totalPages,
      totalFiction,
      totalNonFiction,
      totalTechnical,
      daysWithReading,
      avgPagesPerDay,
      totalDays: data.length,
      objectiveProgress: Math.round(objectiveProgress),
      objectiveStatus,
      dailyObjectiveTotal,
      previousComparison
    };
  }, [data, dailyObjective, previousPeriodData]);

  if (!data || data.length === 0) {
    return (
      <div className={`reading-chart-container ${className}`}>
        {title && (
          <div className="chart-header">
            <h3 className="chart-title">{title}</h3>
            {subtitle && <p className="chart-subtitle">{subtitle}</p>}
          </div>
        )}
        <div className="chart-empty-state">
          <div className="empty-chart-icon">📚</div>
          <div className="empty-chart-message">Aucune donnée de lecture</div>
          <div className="empty-chart-suggestion">
            Commencez à enregistrer vos sessions de lecture
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`reading-chart-container ${className}`}>
      {title && (
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          {subtitle && <p className="chart-subtitle">{subtitle}</p>}
        </div>
      )}
      
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart 
            data={data} 
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
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
              tickFormatter={formatPages}
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
            
            {/* Ligne de référence pour objectif quotidien (Task 3.3) */}
            {showObjectives && dailyObjective > 0 && (
              <ReferenceLine 
                y={dailyObjective} 
                stroke="rgba(34, 197, 94, 0.8)"
                strokeDasharray="4 4"
                strokeWidth={2}
                label={{ 
                  value: `Objectif: ${formatPages(dailyObjective)}`, 
                  position: 'topRight',
                  style: { 
                    fill: 'rgba(34, 197, 94, 0.9)', 
                    fontSize: '11px',
                    fontWeight: '600'
                  }
                }}
              />
            )}
            
            {/* Barres empilées par type de lecture avec interactions (Task 3.4) */}
            <Bar 
              dataKey="fiction" 
              stackId="reading"
              fill={selectedReadingType === 'fiction' ? READING_COLORS.fiction : 
                    selectedReadingType && selectedReadingType !== 'fiction' ? 
                    `${READING_COLORS.fiction}40` : READING_COLORS.fiction}
              name="Fiction"
              radius={[0, 0, 0, 0]}
              onClick={handleBarClick}
              animationBegin={0}
              animationDuration={enableAnimations ? 800 : 0}
              animationEasing="ease-out"
            />
            <Bar 
              dataKey="nonFiction" 
              stackId="reading"
              fill={selectedReadingType === 'nonFiction' ? READING_COLORS.nonFiction : 
                    selectedReadingType && selectedReadingType !== 'nonFiction' ? 
                    `${READING_COLORS.nonFiction}40` : READING_COLORS.nonFiction}
              name="Non-fiction"
              radius={[0, 0, 0, 0]}
              onClick={handleBarClick}
              animationBegin={enableAnimations ? 200 : 0}
              animationDuration={enableAnimations ? 800 : 0}
              animationEasing="ease-out"
            />
            <Bar 
              dataKey="technical" 
              stackId="reading"
              fill={selectedReadingType === 'technical' ? READING_COLORS.technical : 
                    selectedReadingType && selectedReadingType !== 'technical' ? 
                    `${READING_COLORS.technical}40` : READING_COLORS.technical}
              name="Technique"
              radius={[2, 2, 0, 0]}
              onClick={handleBarClick}
              animationBegin={enableAnimations ? 400 : 0}
              animationDuration={enableAnimations ? 800 : 0}
              animationEasing="ease-out"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Statistiques de la période avec objectifs et comparaisons (Task 3.3) */}
      {periodStats && (
        <div className="reading-chart-stats">
          <div className="stat-item">
            <span className="stat-label">Total:</span>
            <span className="stat-value">{formatPages(periodStats.totalPages)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Moyenne/jour:</span>
            <span className="stat-value">{formatPages(periodStats.avgPagesPerDay)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Jours actifs:</span>
            <span className="stat-value">{periodStats.daysWithReading}/{periodStats.totalDays}</span>
          </div>
          
          {/* Progression vers objectif */}
          {showObjectives && dailyObjective > 0 && (
            <div className={`stat-item objective-stat ${periodStats.objectiveStatus}`}>
              <span className="stat-label">Objectif:</span>
              <span className="stat-value">
                {periodStats.objectiveProgress}%
                <span className="objective-indicator">
                  {periodStats.objectiveStatus === 'success' ? '✅' : 
                   periodStats.objectiveStatus === 'warning' ? '🟡' : 
                   periodStats.objectiveStatus === 'caution' ? '🟠' : '🔴'}
                </span>
              </span>
            </div>
          )}
          
          {/* Comparaison période précédente */}
          {periodStats.previousComparison && (
            <div className={`stat-item comparison-stat ${periodStats.previousComparison.trend}`}>
              <span className="stat-label">Évolution:</span>
              <span className="stat-value">
                {periodStats.previousComparison.changePercent >= 0 ? '+' : ''}
                {periodStats.previousComparison.changePercent}%
                <span className="trend-indicator">
                  {periodStats.previousComparison.trend === 'up' ? '↗️' : 
                   periodStats.previousComparison.trend === 'down' ? '↘️' : '➡️'}
                </span>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

ReadingProgressChart.displayName = 'ReadingProgressChart';

export default ReadingProgressChart;