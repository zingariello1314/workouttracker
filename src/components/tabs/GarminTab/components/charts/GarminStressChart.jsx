import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ReferenceLine } from 'recharts';
import { useFilteredDates } from '../../hooks/useFilteredDates';
import { CustomDot } from './CustomDot';
import { useChartContainerSize } from './useChartContainerSize';
import { areChartPropsEqual } from '../../../../../utils/chartComparison';
import { DATE_RANGE, ARIA_LABELS } from '../../constants';

/**
 * Graphique d'évolution du Stress
 * 🟡 FIX #13: Wrapped dans React.memo pour éviter re-renders excessifs
 */
function GarminStressChart({ dailyMetrics, selectedDate, periodFilter, customStartDate, customEndDate, colors }) {
  // 🔴 FIX: Tous les hooks doivent être appelés AVANT les early returns
  // 🔴 FIX #51-60: Utiliser constante pour contextDays
  const { filteredDates, displayInfo, selectedDate: effectiveSelectedDate } = useFilteredDates(
    dailyMetrics,
    selectedDate,
    periodFilter,
    customStartDate,
    customEndDate,
    DATE_RANGE.ACTIVITIES_DAYS
  );

  // 🔴 FIX #20: useChartContainerSize doit être appelé AVANT les early returns
  const { containerRef, containerSize } = useChartContainerSize();

  const chartData = React.useMemo(() => {
    if (!dailyMetrics || filteredDates.length === 0) return [];
    
    return filteredDates.map(date => {
      const dm = dailyMetrics[date] || {};
      // PHASE 3.2 : Gérer nouveau format (dict avec average/max + timeSeries) et ancien format (int)
      let stressValue = null;
      if (dm.stress !== undefined && dm.stress !== null) {
        if (typeof dm.stress === 'object' && dm.stress.average !== undefined) {
          stressValue = dm.stress.average;
        } else if (typeof dm.stress === 'number') {
          stressValue = dm.stress;
        }
      }
      return {
        date,
        stress: stressValue,
        isSelected: date === effectiveSelectedDate
      };
    }).filter(d => d.stress !== null);
  }, [dailyMetrics, filteredDates, effectiveSelectedDate]);

  const avgValue = React.useMemo(() => {
    if (chartData.length === 0) return 0;
    return chartData.reduce((sum, d) => sum + d.stress, 0) / chartData.length;
  }, [chartData]);

  if (!dailyMetrics || Object.keys(dailyMetrics).length === 0) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 text-center text-slate-400">
        Aucune donnée de stress disponible.
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 text-center text-slate-400">
        Aucune donnée de stress disponible pour cette période.
      </div>
    );
  }

  const renderTooltip = React.useCallback(({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }
    const value = payload[0].value;
    let stressLevel = 'Faible';
    let color = colors?.green || '#10B981';
    if (value > 75) {
      stressLevel = 'Très élevé';
      color = colors?.red || '#EF4444';
    } else if (value > 50) {
      stressLevel = 'Élevé';
      color = colors?.orange || '#F59E0B';
    } else if (value > 25) {
      stressLevel = 'Modéré';
      color = colors?.yellow || '#FCD34D';
    }

    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-lg">
        <p className="text-white font-semibold mb-2">{label}</p>
        <p className="text-sm" style={{ color }}>
          {`Stress: ${value}`}
        </p>
        <div className="mt-2 text-xs text-slate-400">
          Niveau: {stressLevel}
        </div>
      </div>
    );
  }, [colors]);

  // 🔴 FIX #39: ARIA labels pour accessibilité
  const chartDescription = React.useMemo(() => (
    `Graphique montrant l'évolution du niveau de stress sur la période sélectionnée. ${chartData.length} point(s) de données disponible(s). Valeur moyenne: ${Math.round(avgValue)}/100.`
  ), [chartData.length, avgValue]);
  
  return (
    <div 
      className="bg-slate-800/60 border border-slate-700 rounded-lg p-6"
      role="region"
      aria-label={ARIA_LABELS.STRESS_CHART}
      aria-describedby="stress-chart-description"
    >
      <div className="flex items-center justify-between mb-4">
        <h4 id="stress-chart-title" className="text-white font-semibold">😰 Stress</h4>
        <div className="flex items-center gap-3">
          {displayInfo && (
            <div className="text-slate-400 text-xs" aria-live="polite">{displayInfo}</div>
          )}
          {avgValue > 0 && (
            <div className="text-slate-400 text-sm">Moyenne: <span className="text-white font-semibold">{avgValue.toFixed(0)}</span></div>
          )}
        </div>
      </div>
      <p id="stress-chart-description" className="sr-only">{chartDescription}</p>
      <div 
        ref={containerRef} 
        className="h-80 min-h-[320px]"
        role="img"
        aria-labelledby="stress-chart-title"
        aria-describedby="stress-chart-description"
        tabIndex={0} 
        style={{ 
          width: '100%', 
          height: '320px', 
          minHeight: '320px', 
          minWidth: '400px',
          position: 'relative',
          display: 'block',
          boxSizing: 'border-box'
        }}
      >
        {/* containerSize est toujours valide grâce à useChartContainerSize qui garantit minWidth/minHeight */}
        <ResponsiveContainer 
          width={Math.max(400, containerSize.width)} 
          height={Math.max(320, containerSize.height)} 
          minHeight={320} 
          minWidth={400}
        >
          <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="stressGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors?.purple || '#8B5CF6'} stopOpacity={0.3} />
                <stop offset="100%" stopColor={colors?.purple || '#8B5CF6'} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
              stroke="#9CA3AF"
            />
            <YAxis
              stroke="#9CA3AF"
              domain={[0, 100]}
              label={{ value: 'Stress', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF' } }}
            />
            <Tooltip content={renderTooltip} />
            <Legend />
            {effectiveSelectedDate && chartData.some(d => d.date === effectiveSelectedDate) && (
              <ReferenceLine
                x={effectiveSelectedDate}
                stroke="#FCD34D"
                strokeWidth={2}
                strokeDasharray="5 5"
                label={{ value: "Sélectionné", position: "top", fill: "#FCD34D", fontSize: 10 }}
              />
            )}
            <Area
              type="monotone"
              dataKey="stress"
              stroke={colors?.purple || '#8B5CF6'}
              strokeWidth={3}
              fill="url(#stressGradient)"
              name="Stress"
              dot={(props) => {
                const { key, ...restProps } = props;
                return (
                  <CustomDot
                    key={key}
                    {...restProps}
                    fill={colors?.purple || '#8B5CF6'}
                    stroke={colors?.purple || '#8B5CF6'}
                    strokeWidth={2}
                    r={4}
                  />
                );
              }}
              activeDot={{ r: 8, stroke: colors?.purple || '#8B5CF6', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// 🟡 FIX #13: Memoization avec comparaison optimisée
export default React.memo(GarminStressChart, areChartPropsEqual);

