import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { CustomDot } from './CustomDot';
import { useChartContainerSize } from './useChartContainerSize';
import { areSelectorChartPropsEqual } from '../../../../../utils/chartComparison';
import { ARIA_LABELS } from '../../constants';
import useUIMetricsTelemetry from '../../hooks/useUIMetricsTelemetry';

/**
 * Graphique de fréquence cardiaque 24h
 * 🟡 FIX #13: Wrapped dans React.memo pour éviter re-renders excessifs
 */
function GarminHeartRateChart({ precomputed, selector, colors }) {
  useUIMetricsTelemetry('GarminHeartRateChart');
  const { containerRef, containerSize } = useChartContainerSize();

  const trend = selector?.trend ?? selector ?? precomputed ?? {};
  const chartData = Array.isArray(trend?.data) ? trend.data : precomputed?.data ?? [];
  const displayInfo = trend?.displayInfo ?? precomputed?.displayInfo ?? null;
  const effectiveSelectedDate = trend?.selectedDate ?? precomputed?.selectedDate ?? null;

  // ✅ FIX : Calculer le domaine Y avec marge pour éviter que les valeurs ne touchent le bord
  const yAxisDomain = React.useMemo(() => {
    if (Array.isArray(trend?.yAxisDomain)) return trend.yAxisDomain;
    if (precomputed?.yAxisDomain) return precomputed.yAxisDomain;
    if (!chartData || chartData.length === 0) return [0, 180];

    let minValue = Infinity;
    let maxValue = -Infinity;

    chartData.forEach(d => {
      ['resting', 'max', 'avg'].forEach((key) => {
        const value = d[key];
        if (value !== null && value !== undefined) {
          minValue = Math.min(minValue, value);
          maxValue = Math.max(maxValue, value);
        }
      });
    });

    if (minValue === Infinity || maxValue === -Infinity) return [0, 180];

    const range = maxValue - minValue;
    const margin = Math.max(range * 0.1, 10);
    const domainMin = Math.max(0, Math.floor(minValue - margin));
    const domainMax = Math.min(220, Math.ceil(maxValue + margin));

    return [domainMin, domainMax];
  }, [precomputed, chartData]);

  if (!chartData.length) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 text-center text-slate-400">
        Aucune donnée de fréquence cardiaque disponible pour cette période.
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
              {`${entry.name}: ${entry.value} bpm`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // 🔴 FIX #39: ARIA labels pour accessibilité
  const chartDescription = `Graphique montrant l'évolution de la fréquence cardiaque (repos, maximum, moyenne) sur la période sélectionnée. ${chartData.length} point(s) de données disponible(s).`;
  
  return (
    <div 
      className="bg-slate-800/60 border border-slate-700 rounded-lg p-6"
      role="region"
      aria-label={ARIA_LABELS.HEART_RATE_CHART}
      aria-describedby="heart-rate-chart-description"
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-white font-semibold" id="heart-rate-chart-title">❤️ Fréquence Cardiaque</h4>
        {displayInfo && (
          <div className="text-slate-400 text-xs" aria-live="polite">{displayInfo}</div>
        )}
      </div>
      <p id="heart-rate-chart-description" className="sr-only">{chartDescription}</p>
      <div 
        ref={containerRef} 
        className="h-80 min-h-[320px]" 
        role="img"
        aria-labelledby="heart-rate-chart-title"
        aria-describedby="heart-rate-chart-description"
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
        {/* Utiliser les dimensions garanties pour éviter les warnings Recharts */}
        <ResponsiveContainer 
          width={Math.max(400, containerSize.width)} 
          height={Math.max(320, containerSize.height)} 
          minHeight={320} 
          minWidth={400}
          aria-label={ARIA_LABELS.HEART_RATE_CHART}
        >
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            aria-label={ARIA_LABELS.HEART_RATE_CHART}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
              stroke="#9CA3AF"
            />
            <YAxis
              stroke="#9CA3AF"
              label={{ value: 'bpm', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF' } }}
              domain={yAxisDomain}
              allowDataOverflow={false}
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
            <Line
              type="monotone"
              dataKey="resting"
              stroke={colors?.sky || '#38BDF8'}
              strokeWidth={3}
              dot={(props) => {
                const { key: _omittedKey, payload, index, ...restProps } = props;
                const dotKey =
                  payload?.timestamp ??
                  payload?.date ??
                  `${payload?.time || ''}-${payload?.hour ?? ''}-${payload?.minute ?? ''}-${index ?? 0}`;
                return (
                  <CustomDot
                    key={dotKey}
                    payload={payload}
                    index={index}
                    {...restProps}
                    fill={colors?.sky || '#38BDF8'}
                    stroke={colors?.sky || '#38BDF8'}
                    strokeWidth={2}
                    r={4}
                  />
                );
              }}
              name="Repos"
            />
            <Line
              type="monotone"
              dataKey="avg"
              stroke={colors?.emerald || '#22C55E'}
              strokeWidth={3}
              dot={(props) => {
                const { key: _omittedKey, payload, index, ...restProps } = props;
                const dotKey =
                  payload?.timestamp ??
                  payload?.date ??
                  `${payload?.time || ''}-${payload?.hour ?? ''}-${payload?.minute ?? ''}-${index ?? 0}`;
                return (
                  <CustomDot
                    key={dotKey}
                    payload={payload}
                    index={index}
                    {...restProps}
                    fill={colors?.emerald || '#22C55E'}
                    stroke={colors?.emerald || '#22C55E'}
                    strokeWidth={2}
                    r={4}
                  />
                );
              }}
              name="Moyenne"
            />
            <Line
              type="monotone"
              dataKey="max"
              stroke={colors?.rose || '#F43F5E'}
              strokeWidth={3}
              dot={(props) => {
                const { key: _omittedKey, payload, index, ...restProps } = props;
                const dotKey =
                  payload?.timestamp ??
                  payload?.date ??
                  `${payload?.time || ''}-${payload?.hour ?? ''}-${payload?.minute ?? ''}-${index ?? 0}`;
                return (
                  <CustomDot
                    key={dotKey}
                    payload={payload}
                    index={index}
                    {...restProps}
                    fill={colors?.rose || '#F43F5E'}
                    stroke={colors?.rose || '#F43F5E'}
                    strokeWidth={2}
                    r={4}
                  />
                );
              }}
              name="Maximum"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const MemoizedGarminHeartRateChart = React.memo(GarminHeartRateChart, areSelectorChartPropsEqual);

export default MemoizedGarminHeartRateChart;
export { MemoizedGarminHeartRateChart as GarminHeartRateChart };

