import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar, BarChart, ReferenceLine } from 'recharts';
import { CustomDot } from './CustomDot';
import { useChartContainerSize } from './useChartContainerSize';
import { areSelectorChartPropsEqual } from '../../../../../utils/chartComparison';
import useUIMetricsTelemetry from '../../hooks/useUIMetricsTelemetry';

/**
 * Graphiques de corrélation (sommeil/performance, Body Battery/intensité)
 * 🟡 FIX #13: Wrapped dans React.memo pour éviter re-renders excessifs
 */
function GarminCorrelationCharts({ precomputed, selector, colors }) {
  useUIMetricsTelemetry('GarminCorrelationCharts');
  const metadata = selector?.metadata ?? {};
  const displayInfo = metadata?.displayInfo ?? precomputed?.displayInfo ?? null;
  const effectiveSelectedDate = metadata?.selectedDateRaw ?? precomputed?.selectedDate ?? null;
  const sleepPerformanceData = selector?.sleep?.correlation?.sleepPerformanceData
    ?? precomputed?.sleepPerformanceData ?? [];
  const batteryIntensityData = selector?.activity?.correlation?.batteryIntensityData
    ?? precomputed?.batteryIntensityData ?? [];

  // 🟡 FIX : Hauteur augmentée maintenant que le conteneur n'a plus de limite fixe
  const chartHeight = 360;
  const chartMinHeight = 360;
  
  // 🔴 FIX #5: Vérifier dimensions avant rendu (pour les 2 graphiques)
  const { containerRef: containerRef1, containerSize: containerSize1 } = useChartContainerSize(chartMinHeight, 400);
  const { containerRef: containerRef2, containerSize: containerSize2 } = useChartContainerSize(chartMinHeight, 400);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}${entry.unit || ''}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-5">
      {/* Corrélation Sommeil / Performance */}
      {sleepPerformanceData.length > 0 && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-white font-semibold">😴 Corrélation Sommeil / Performance</h4>
          {displayInfo && (
            <div className="text-slate-400 text-xs">{displayInfo}</div>
          )}
          </div>
          <div 
            ref={containerRef1} 
            className="w-full min-w-[400px]" 
            style={{ 
              width: '100%', 
              height: `${chartHeight}px`, 
              minHeight: `${chartMinHeight}px`, 
              minWidth: '400px',
              position: 'relative',
              display: 'block',
              boxSizing: 'border-box'
            }}
          >
            {/* containerSize1 est toujours valide grâce à useChartContainerSize qui garantit minWidth/minHeight */}
            <ResponsiveContainer 
              width={Math.max(400, containerSize1.width)} 
              height={Math.max(chartMinHeight, containerSize1.height)} 
              minHeight={chartMinHeight} 
              minWidth={400}
            >
                <ComposedChart data={sleepPerformanceData} margin={{ top: 5, right: 30, left: 20, bottom: 65 }}>
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
                  label={{ value: 'Pas / Qualité', angle: 90, position: 'insideRight', style: { fill: '#9CA3AF' } }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {effectiveSelectedDate && sleepPerformanceData.some(d => d.date === effectiveSelectedDate) && (
                  <ReferenceLine
                    x={effectiveSelectedDate}
                    stroke="#FCD34D"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    label={{ value: "Sélectionné", position: "top", fill: "#FCD34D", fontSize: 10 }}
                  />
                )}
                <Bar
                  yAxisId="left"
                  dataKey="sleepDuration"
                  fill={colors?.indigo || '#6366F1'}
                  name="Durée sommeil (min)"
                />
                {sleepPerformanceData.some(d => d.sleepQuality !== null) && (
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="sleepQuality"
                    stroke={colors?.purple || '#8B5CF6'}
                    strokeWidth={2}
                    name="Qualité sommeil"
                    dot={(props) => {
                      const { key: _omittedKey, payload, index, ...restProps } = props;
                      const dotKey = payload?.date ?? `${payload?.timestamp ?? ''}-${index ?? 0}`;
                      return (
                        <CustomDot
                          key={dotKey}
                          payload={payload}
                          index={index}
                          {...restProps}
                          fill={colors?.purple || '#8B5CF6'}
                          stroke={colors?.purple || '#8B5CF6'}
                          strokeWidth={2}
                          r={4}
                        />
                      );
                    }}
                  />
                )}
                {sleepPerformanceData.some(d => d.steps !== null) && (
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="steps"
                    stroke={colors?.emerald || '#10B981'}
                    strokeWidth={2}
                    name="Pas"
                    dot={false}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Corrélation Body Battery / Intensité */}
      {batteryIntensityData.length > 0 && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-white font-semibold">⚡ Body Battery & Intensité</h4>
            {displayInfo && (
              <div className="text-slate-400 text-xs">{displayInfo}</div>
            )}
          </div>
          <div 
            ref={containerRef2} 
            className="w-full min-w-[400px]" 
            style={{ 
              width: '100%', 
              height: `${chartHeight}px`, 
              minHeight: `${chartMinHeight}px`, 
              minWidth: '400px',
              position: 'relative',
              display: 'block',
              boxSizing: 'border-box'
            }}
          >
            <ResponsiveContainer 
              width={Math.max(400, containerSize2.width)} 
              height={Math.max(chartMinHeight, containerSize2.height)} 
              minHeight={chartMinHeight} 
              minWidth={400}
            >
              <ComposedChart data={batteryIntensityData} margin={{ top: 5, right: 30, left: 20, bottom: 65 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
                  stroke="#9CA3AF"
                />
                <YAxis
                  yAxisId="left"
                  stroke="#9CA3AF"
                  label={{ value: 'Body Battery', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF' } }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#9CA3AF"
                  label={{ value: 'Minutes intensité', angle: 90, position: 'insideRight', style: { fill: '#9CA3AF' } }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {effectiveSelectedDate && batteryIntensityData.some(d => d.date === effectiveSelectedDate) && (
                  <ReferenceLine
                    x={effectiveSelectedDate}
                    stroke="#FCD34D"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    label={{ value: "Sélectionné", position: "top", fill: "#FCD34D", fontSize: 10 }}
                  />
                )}
                <Bar
                  yAxisId="right"
                  dataKey="intensityTotal"
                  fill={colors?.orange || '#F97316'}
                  name="Intensité totale (min)"
                />
                {batteryIntensityData.some(d => d.intensityModerate !== null) && (
                  <Bar
                    yAxisId="right"
                    dataKey="intensityModerate"
                    fill={colors?.amber || '#F59E0B'}
                    stackId="intensity"
                    name="Intensité modérée"
                  />
                )}
                {batteryIntensityData.some(d => d.intensityVigorous !== null) && (
                  <Bar
                    yAxisId="right"
                    dataKey="intensityVigorous"
                    fill={colors?.rose || '#F43F5E'}
                    stackId="intensity"
                    name="Intensité vigoureuse"
                  />
                )}
                {batteryIntensityData.some(d => d.bodyBattery !== null) && (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="bodyBattery"
                    stroke={colors?.emerald || '#10B981'}
                    strokeWidth={3}
                    name="Body Battery"
                    dot={(props) => {
                      const { key: _omittedKey, payload, index, ...restProps } = props;
                      const dotKey = payload?.date ?? `${payload?.timestamp ?? ''}-${index ?? 0}`;
                      return (
                        <CustomDot
                          key={dotKey}
                          payload={payload}
                          index={index}
                          {...restProps}
                          fill={colors?.emerald || '#10B981'}
                          stroke={colors?.emerald || '#10B981'}
                          strokeWidth={2}
                          r={4}
                        />
                      );
                    }}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

const MemoizedGarminCorrelationCharts = React.memo(GarminCorrelationCharts, areSelectorChartPropsEqual);

export default MemoizedGarminCorrelationCharts;
export { MemoizedGarminCorrelationCharts as GarminCorrelationCharts };

