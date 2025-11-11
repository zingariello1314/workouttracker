import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useFilteredDates } from '../../hooks/useFilteredDates';
import { CustomDot } from './CustomDot';
import { useChartContainerSize } from './useChartContainerSize';
import { areChartPropsEqual } from '../../../../../utils/chartComparison';
import { DATE_RANGE, ARIA_LABELS } from '../../constants';

/**
 * Graphique de respiration (éveillé et sommeil)
 * 🟡 FIX #13: Wrapped dans React.memo pour éviter re-renders excessifs
 */
function GarminRespirationChart({ precomputed, dailyMetrics, selectedDate, periodFilter, customStartDate, customEndDate, colors }) {
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
    
    const normalizeRespValue = (value) => {
      if (value === null || value === undefined) return null;
      if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
      }
      if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return Number.isFinite(parsed) ? parsed : null;
      }
      if (typeof value === 'object') {
        if (value.value !== undefined) return normalizeRespValue(value.value);
        if (value.avg !== undefined) return normalizeRespValue(value.avg);
        if (value.average !== undefined) return normalizeRespValue(value.average);
        if (value.mean !== undefined) return normalizeRespValue(value.mean);
        if (Array.isArray(value)) {
          const samples = value
            .map((sample) => normalizeRespValue(sample))
            .filter((num) => num !== null);
          if (samples.length === 0) return null;
          const sum = samples.reduce((acc, num) => acc + num, 0);
          return sum / samples.length;
        }
      }
      return null;
    };

    return filteredDates.map(date => {
      const dm = dailyMetrics[date] || {};
      const resp = dm.respiration || {};
      const awake = resp.awake || {};
      const sleep = resp.sleep || {};
      return {
        date,
        awakeMin: normalizeRespValue(awake.min),
        awakeAvg: normalizeRespValue(awake.avg ?? awake.average ?? awake.mean),
        awakeMax: normalizeRespValue(awake.max),
        sleepMin: normalizeRespValue(sleep.min),
        sleepAvg: normalizeRespValue(sleep.avg ?? sleep.average ?? sleep.mean),
        sleepMax: normalizeRespValue(sleep.max),
        isSelected: date === effectiveSelectedDate
      };
    }).filter(d => d.awakeAvg !== null || d.sleepAvg !== null);
  }, [precomputed, dailyMetrics, filteredDates, effectiveSelectedDate]);

  const avgAwake = React.useMemo(() => {
    if (precomputed?.avgAwake !== undefined) {
      return precomputed.avgAwake;
    }
    const awakeData = chartData.filter(d => d.awakeAvg !== null);
    return awakeData.length ? awakeData.reduce((sum, d) => sum + d.awakeAvg, 0) / awakeData.length : 0;
  }, [precomputed, chartData]);

  const avgSleep = React.useMemo(() => {
    if (precomputed?.avgSleep !== undefined) {
      return precomputed.avgSleep;
    }
    const sleepData = chartData.filter(d => d.sleepAvg !== null);
    return sleepData.length ? sleepData.reduce((sum, d) => sum + d.sleepAvg, 0) / sleepData.length : 0;
  }, [precomputed, chartData]);

  if (!dailyMetrics || Object.keys(dailyMetrics).length === 0) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 text-center text-slate-400">
        Aucune donnée de respiration disponible.
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 text-center text-slate-400">
        Aucune donnée de respiration disponible pour cette période.
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value} resp/min`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const hasAwakeData = chartData.some(d => d.awakeAvg !== null);
  const hasSleepData = chartData.some(d => d.sleepAvg !== null);

  // 🔴 FIX #39: ARIA labels pour accessibilité
  const chartDescription = `Graphique montrant l'évolution de la respiration (éveillé et sommeil) sur la période sélectionnée. ${chartData.length} point(s) de données disponible(s). Moyenne éveillé: ${avgAwake.toFixed(1)} resp/min, sommeil: ${avgSleep.toFixed(1)} resp/min.`;
  
  return (
    <div 
      className="bg-slate-800/60 border border-slate-700 rounded-lg p-6"
      role="region"
      aria-label={ARIA_LABELS.RESPIRATION_CHART}
      aria-describedby="respiration-chart-description"
    >
      <div className="flex items-center justify-between mb-4">
        <h4 id="respiration-chart-title" className="text-white font-semibold">💨 Respiration</h4>
        {displayInfo && (
          <div className="text-slate-400 text-xs" aria-live="polite">{displayInfo}</div>
        )}
      </div>
      <p id="respiration-chart-description" className="sr-only">{chartDescription}</p>
      <div 
        ref={containerRef} 
        className="h-80 min-h-[320px]"
        role="img"
        aria-labelledby="respiration-chart-title"
        aria-describedby="respiration-chart-description"
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
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
              stroke="#9CA3AF"
            />
            <YAxis
              stroke="#9CA3AF"
              label={{ value: 'resp/min', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF' } }}
            />
            <Tooltip content={<CustomTooltip />} />
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
            {hasAwakeData && chartData.some(d => d.awakeMin !== null) && (
              <Line
                type="monotone"
                dataKey="awakeMin"
                stroke={colors?.green || '#10B981'}
                strokeWidth={1}
                strokeDasharray="5 5"
                name="Éveillé Min"
                dot={false}
              />
            )}
            {hasAwakeData && (
              <Line
                type="monotone"
                dataKey="awakeAvg"
                stroke={colors?.green || '#10B981'}
                strokeWidth={3}
                name="Éveillé Moy"
                dot={(props) => {
                  const { key: _omittedKey, payload, index, ...restProps } = props;
                  const dotKey = payload?.date ?? `${payload?.timestamp ?? ''}-${index ?? 0}`;
                  return (
                    <CustomDot
                      key={dotKey}
                      payload={payload}
                      index={index}
                      {...restProps}
                      fill={colors?.green || '#10B981'}
                      stroke={colors?.green || '#10B981'}
                      strokeWidth={2}
                      r={4}
                    />
                  );
                }}
              />
            )}
            {hasAwakeData && chartData.some(d => d.awakeMax !== null) && (
              <Line
                type="monotone"
                dataKey="awakeMax"
                stroke={colors?.green || '#10B981'}
                strokeWidth={1}
                strokeDasharray="3 3"
                name="Éveillé Max"
                dot={false}
              />
            )}
            {hasSleepData && chartData.some(d => d.sleepMin !== null) && (
              <Line
                type="monotone"
                dataKey="sleepMin"
                stroke={colors?.blue || '#3B82F6'}
                strokeWidth={1}
                strokeDasharray="5 5"
                name="Sommeil Min"
                dot={false}
              />
            )}
            {hasSleepData && (
              <Line
                type="monotone"
                dataKey="sleepAvg"
                stroke={colors?.blue || '#3B82F6'}
                strokeWidth={3}
                name="Sommeil Moy"
                dot={(props) => {
                  const { key: _omittedKey, payload, index, ...restProps } = props;
                  const dotKey = payload?.date ?? `${payload?.timestamp ?? ''}-${index ?? 0}`;
                  return (
                    <CustomDot
                      key={dotKey}
                      payload={payload}
                      index={index}
                      {...restProps}
                      fill={colors?.blue || '#3B82F6'}
                      stroke={colors?.blue || '#3B82F6'}
                      strokeWidth={2}
                      r={4}
                    />
                  );
                }}
              />
            )}
            {hasSleepData && chartData.some(d => d.sleepMax !== null) && (
              <Line
                type="monotone"
                dataKey="sleepMax"
                stroke={colors?.blue || '#3B82F6'}
                strokeWidth={1}
                strokeDasharray="3 3"
                name="Sommeil Max"
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default React.memo(GarminRespirationChart, areChartPropsEqual);

