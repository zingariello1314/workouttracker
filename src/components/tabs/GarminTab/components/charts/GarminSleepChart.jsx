import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Line, ReferenceLine } from 'recharts';
import { useFilteredDates } from '../../hooks/useFilteredDates';
import { CustomDot } from './CustomDot';
import { useChartContainerSize } from './useChartContainerSize';
import { areChartPropsEqual } from '../../../../../utils/chartComparison';
import { formatSleepDuration } from '../../utils/garminFormatters';
import { DATE_RANGE, ARIA_LABELS } from '../../constants';

/**
 * Graphique de sommeil (durée et phases)
 * 🟡 FIX #13: Wrapped dans React.memo pour éviter re-renders excessifs
 */
function GarminSleepChart({ precomputed, dailyMetrics, selectedDate, periodFilter, customStartDate, customEndDate, colors }) {
  // 🔴 FIX: Tous les hooks doivent être appelés AVANT les early returns
  // 🔴 FIX #51-60: Utiliser constante pour contextDays
  const fallbackFiltered = useFilteredDates(
    dailyMetrics,
    selectedDate,
    periodFilter,
    customStartDate,
    customEndDate,
    DATE_RANGE.ACTIVITIES_DAYS
  );

  // 🔴 FIX #20: useChartContainerSize doit être appelé AVANT les early returns
  const { containerRef, containerSize } = useChartContainerSize();

  const filteredDates = precomputed?.filteredDates ?? fallbackFiltered.filteredDates;
  const displayInfo = precomputed?.displayInfo ?? fallbackFiltered.displayInfo;
  const effectiveSelectedDate = precomputed?.selectedDate ?? fallbackFiltered.selectedDate;

  const chartData = React.useMemo(() => {
    if (precomputed?.data) {
      return precomputed.data;
    }

    if (!dailyMetrics || filteredDates.length === 0) return [];
    
    return filteredDates.map(date => {
      const dm = dailyMetrics[date] || {};
      const sleep = dm.sleep || {};
      return {
        date,
        duration: sleep.duration ? Math.round(sleep.duration * 60) : null, // en minutes
        deepSleep: sleep.deepSleep ? Math.round(sleep.deepSleep * 60) : null,
        lightSleep: sleep.lightSleep ? Math.round(sleep.lightSleep * 60) : null,
        remSleep: sleep.remSleep ? Math.round(sleep.remSleep * 60) : null,
        quality: sleep.quality || null,
        isSelected: date === effectiveSelectedDate
      };
    }).filter(d => d.duration !== null || d.quality !== null);
  }, [precomputed, dailyMetrics, filteredDates, effectiveSelectedDate]);

  const avgDuration = React.useMemo(() => {
    if (precomputed?.averageDuration !== undefined) {
      return precomputed.averageDuration;
    }
    const filtered = chartData.filter(d => d.duration !== null);
    if (filtered.length === 0) return 0;
    return filtered.reduce((sum, d) => sum + d.duration, 0) / filtered.length;
  }, [precomputed, chartData]);

  if (!dailyMetrics || Object.keys(dailyMetrics).length === 0) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 text-center text-slate-400">
        Aucune donnée de sommeil disponible.
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 text-center text-slate-400">
        Aucune donnée de sommeil disponible pour cette période.
      </div>
    );
  }

  const renderTooltip = React.useCallback(({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-lg">
        <p className="text-white font-semibold mb-2">{label}</p>
        {payload.map((entry, index) => {
          const value = entry.value;
          let displayValue = value;
          let unit = '';
          if (entry.dataKey === 'duration' || entry.dataKey === 'deepSleep' || entry.dataKey === 'lightSleep' || entry.dataKey === 'remSleep') {
            const hours = Math.floor(value / 60);
            const minutes = value % 60;
            displayValue = `${hours}h${minutes}m`;
          } else if (entry.dataKey === 'quality') {
            unit = '/100';
          }
          return (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${displayValue}${unit}`}
            </p>
          );
        })}
      </div>
    );
  }, []);

  // 🔴 FIX #39: ARIA labels pour accessibilité
  const chartDescription = React.useMemo(() => (
    `Graphique montrant l'évolution du sommeil (durée, phases profondes, légères, REM) sur la période sélectionnée. ${chartData.length} point(s) de données disponible(s). Durée moyenne: ${Math.floor(avgDuration / 60)}h${Math.round(avgDuration % 60)}m.`
  ), [chartData.length, avgDuration]);
  
  return (
    <div 
      className="bg-slate-800/60 border border-slate-700 rounded-lg p-6"
      role="region"
      aria-label={ARIA_LABELS.SLEEP_CHART}
      aria-describedby="sleep-chart-description"
    >
      <div className="flex items-center justify-between mb-4">
        <h4 id="sleep-chart-title" className="text-white font-semibold">😴 Sommeil</h4>
        <div className="flex items-center gap-3">
          {displayInfo && (
            <div className="text-slate-400 text-xs" aria-live="polite">{displayInfo}</div>
          )}
          {avgDuration > 0 && (
            <div className="text-slate-400 text-sm">
              Durée moyenne: <span className="text-white font-semibold">
                {Math.floor(avgDuration / 60)}h{Math.round(avgDuration % 60)}m
              </span>
            </div>
          )}
        </div>
      </div>
      <p id="sleep-chart-description" className="sr-only">{chartDescription}</p>
      <div 
        ref={containerRef} 
        className="h-80 min-h-[320px]"
        role="img"
        aria-labelledby="sleep-chart-title"
        aria-describedby="sleep-chart-description"
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
          <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
              stroke="#9CA3AF"
            />
            <YAxis
              yAxisId="left"
              stroke="#9CA3AF"
              label={{ value: 'Minutes', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF' } }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#9CA3AF"
              label={{ value: 'Qualité', angle: 90, position: 'insideRight', style: { fill: '#9CA3AF' } }}
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
            <Bar yAxisId="left" dataKey="duration" fill={colors?.indigo || '#6366F1'} name="Durée (min)" />
            {chartData.some(d => d.deepSleep !== null) && (
              <Bar yAxisId="left" dataKey="deepSleep" stackId="sleep" fill={colors?.purple || '#8B5CF6'} name="Sommeil profond" />
            )}
            {chartData.some(d => d.lightSleep !== null) && (
              <Bar yAxisId="left" dataKey="lightSleep" stackId="sleep" fill={colors?.sky || '#38BDF8'} name="Sommeil léger" />
            )}
            {chartData.some(d => d.remSleep !== null) && (
              <Bar yAxisId="left" dataKey="remSleep" stackId="sleep" fill={colors?.pink || '#EC4899'} name="Sommeil REM" />
            )}
            {chartData.some(d => d.quality !== null) && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="quality"
                stroke={colors?.amber || '#F59E0B'}
                strokeWidth={3}
                name="Qualité"
                dot={(props) => {
                  const { key: _omittedKey, payload, index, ...restProps } = props;
                  const dotKey = payload?.date ?? `${payload?.timestamp ?? ''}-${index ?? 0}`;
                  return (
                    <CustomDot
                      key={dotKey}
                      payload={payload}
                      index={index}
                      {...restProps}
                      fill={colors?.amber || '#F59E0B'}
                      stroke={colors?.amber || '#F59E0B'}
                      strokeWidth={2}
                      r={4}
                    />
                  );
                }}
                activeDot={{ r: 8, stroke: colors?.amber || '#F59E0B', strokeWidth: 2 }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default React.memo(GarminSleepChart, areChartPropsEqual);

