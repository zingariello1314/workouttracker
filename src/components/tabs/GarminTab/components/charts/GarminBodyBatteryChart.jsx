import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ReferenceLine } from 'recharts';
import { CustomDot, getCustomDotKey } from './CustomDot';
import { useChartContainerSize } from './useChartContainerSize';
import { useChartData } from '../../hooks/useChartData';
import { areSelectorChartPropsEqual } from '../../../../../utils/chartComparison';
import { ARIA_LABELS } from '../../constants';
import useUIMetricsTelemetry from '../../hooks/useUIMetricsTelemetry';

/**
 * Graphique d'évolution du Body Battery
 * 🟡 FIX #13: Wrapped dans React.memo pour éviter re-renders excessifs
 * ✅ Optimisé avec useChartData et getCustomDotKey
 */
function GarminBodyBatteryChart({ precomputed, selector, colors }) {
  useUIMetricsTelemetry('GarminBodyBatteryChart');
  const { containerRef, containerSize } = useChartContainerSize();

  // Utiliser useChartData pour pré-calculer domaines et métadonnées
  const chartDataConfig = useChartData({
    selector: selector?.trend ?? selector,
    precomputed,
    chartType: 'bodyBattery',
    dataKeys: ['bodyBattery'],
    defaultDomain: [0, 100]
  });

  const chartData = chartDataConfig.data;
  const yAxisDomain = chartDataConfig.yAxisDomain;
  const displayInfo = chartDataConfig.displayInfo;
  const effectiveSelectedDate = chartDataConfig.selectedDate;
  
  // Calculer la moyenne si nécessaire (mémoïsé pour éviter recalculs)
  const avgValue = React.useMemo(() => {
    if (chartData.length === 0) return 0;
    return chartData.reduce((sum, d) => sum + (d.bodyBattery || 0), 0) / chartData.length;
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <div className="rounded-xl border-2 border-[#0F4C5C]/70 bg-black p-6 text-center text-teal-100/55 shadow-md shadow-black/40">
        Aucune donnée Body Battery disponible pour cette période.
      </div>
    );
  }

  const renderTooltip = React.useCallback(({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }
    const value = payload[0].value;
    return (
      <div className="bg-black border border-[#0F4C5C]/60 rounded-lg p-3 shadow-lg">
        <p className="text-teal-100 font-semibold mb-2">{label}</p>
        <p className="text-sm" style={{ color: payload[0].color }}>
          {`Body Battery: ${value}/100`}
        </p>
        <div className="mt-2 text-xs text-teal-100/55">
          {value >= 70 ? 'Excellent' : value >= 50 ? 'Bon' : value >= 30 ? 'Moyen' : 'Faible'}
        </div>
      </div>
    );
  }, []);

  // 🔴 FIX #39: ARIA labels pour accessibilité
  const chartDescription = React.useMemo(() => {
    return `Graphique montrant l'évolution du niveau de batterie corporelle (Body Battery) sur la période sélectionnée. ${chartData.length} point(s) de données disponible(s). Valeur moyenne: ${Math.round(avgValue)}/100.`;
  }, [chartData.length, avgValue]);
  
  return (
    <div 
      className="rounded-xl border-2 border-[#0F4C5C]/70 bg-black p-6 shadow-md shadow-black/40"
      role="region"
      aria-label={ARIA_LABELS.BODY_BATTERY_CHART}
      aria-describedby="body-battery-chart-description"
    >
      <div className="flex items-center justify-between mb-4">
        <h4 id="body-battery-chart-title" className="text-teal-100 font-semibold">🔋 Body Battery</h4>
        <div className="flex items-center gap-3">
          {displayInfo && (
            <div className="text-teal-100/55 text-xs">{displayInfo}</div>
          )}
          {avgValue > 0 && (
            <div className="text-sky-300/75 text-sm">Moyenne: <span className="text-teal-100 font-semibold">{avgValue.toFixed(0)}/100</span></div>
          )}
        </div>
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
            <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="batteryGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors?.green || '#10B981'} stopOpacity={0.3} />
                <stop offset="100%" stopColor={colors?.green || '#10B981'} stopOpacity={0.1} />
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
              domain={yAxisDomain}
              label={{ value: 'Body Battery', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF' } }}
            />
            <Tooltip content={renderTooltip} />
            <Legend />
            {effectiveSelectedDate && chartData.some(d => d.date === effectiveSelectedDate) && (
              <ReferenceLine
                key={`ref-line-${effectiveSelectedDate}`}
                x={effectiveSelectedDate}
                stroke="#FCD34D"
                strokeWidth={2}
                strokeDasharray="5 5"
                label={{ value: "Sélectionné", position: "top", fill: "#FCD34D", fontSize: 10 }}
              />
            )}
            <Area
              type="monotone"
              dataKey="bodyBattery"
              stroke={colors?.green || '#10B981'}
              strokeWidth={3}
              fill="url(#batteryGradient)"
              name="Body Battery"
              dot={(props) => {
                const { key: _omittedKey, payload, index, ...restProps } = props;
                const dotKey = getCustomDotKey(payload, index);
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
              activeDot={{ r: 8, stroke: colors?.green || '#10B981', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const MemoizedGarminBodyBatteryChart = React.memo(GarminBodyBatteryChart, areSelectorChartPropsEqual);

export default MemoizedGarminBodyBatteryChart;
export { MemoizedGarminBodyBatteryChart as GarminBodyBatteryChart };

