import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useFilteredDates } from '../../hooks/useFilteredDates';
import { CustomDot } from './CustomDot';
import { useChartContainerSize } from './useChartContainerSize';
import { areChartPropsEqual } from '../../../../../utils/chartComparison';

/**
 * Graphique de respiration (éveillé et sommeil)
 * 🟡 FIX #13: Wrapped dans React.memo pour éviter re-renders excessifs
 */
function GarminRespirationChart({ dailyMetrics, selectedDate, periodFilter, customStartDate, customEndDate, colors }) {
  const { filteredDates, displayInfo, selectedDate: effectiveSelectedDate } = useFilteredDates(
    dailyMetrics,
    selectedDate,
    periodFilter,
    customStartDate,
    customEndDate,
    7
  );

  const chartData = React.useMemo(() => {
    if (!dailyMetrics || filteredDates.length === 0) return [];
    
    return filteredDates.map(date => {
      const dm = dailyMetrics[date] || {};
      const resp = dm.respiration || {};
      return {
        date,
        awakeMin: resp.awake?.min || null,
        awakeAvg: resp.awake?.avg || null,
        awakeMax: resp.awake?.max || null,
        sleepMin: resp.sleep?.min || null,
        sleepAvg: resp.sleep?.avg || null,
        sleepMax: resp.sleep?.max || null,
        isSelected: date === effectiveSelectedDate
      };
    }).filter(d => d.awakeAvg !== null || d.sleepAvg !== null);
  }, [dailyMetrics, filteredDates, effectiveSelectedDate]);

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

  // 🔴 FIX #5: Vérifier dimensions avant rendu
  const { containerRef, containerSize } = useChartContainerSize();

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-white font-semibold">💨 Respiration</h4>
        {displayInfo && (
          <div className="text-slate-400 text-xs">{displayInfo}</div>
        )}
      </div>
      <div 
        ref={containerRef} 
        className="h-80 min-h-[320px]" 
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
                  const { key, ...restProps } = props;
                  return (
                    <CustomDot
                      key={key}
                      {...restProps}
                      fill={colors?.green || '#10B981'}
                      stroke={colors?.green || '#10B981'}
                      strokeWidth={2}
                      r={4}
                    />
                  );
                }}
                activeDot={{ r: 7, stroke: colors?.green || '#10B981', strokeWidth: 2 }}
              />
            )}
            {hasAwakeData && chartData.some(d => d.awakeMax !== null) && (
              <Line
                type="monotone"
                dataKey="awakeMax"
                stroke={colors?.green || '#10B981'}
                strokeWidth={1}
                strokeDasharray="5 5"
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
                  const { key, ...restProps } = props;
                  return (
                    <CustomDot
                      key={key}
                      {...restProps}
                      fill={colors?.blue || '#3B82F6'}
                      stroke={colors?.blue || '#3B82F6'}
                      strokeWidth={2}
                      r={4}
                    />
                  );
                }}
                activeDot={{ r: 7, stroke: colors?.blue || '#3B82F6', strokeWidth: 2 }}
              />
            )}
            {hasSleepData && chartData.some(d => d.sleepMax !== null) && (
              <Line
                type="monotone"
                dataKey="sleepMax"
                stroke={colors?.blue || '#3B82F6'}
                strokeWidth={1}
                strokeDasharray="5 5"
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

// 🟡 FIX #13: Memoization avec comparaison optimisée
export default React.memo(GarminRespirationChart, areChartPropsEqual);

