import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ReferenceLine } from 'recharts';
import { CustomDot } from './CustomDot';
import { useChartContainerSize } from './useChartContainerSize';
import { areDerivedChartPropsEqual } from '../../../../../utils/chartComparison';
import { ARIA_LABELS } from '../../constants';

/**
 * Graphique d'évolution du Body Battery
 * 🟡 FIX #13: Wrapped dans React.memo pour éviter re-renders excessifs
 */
function GarminBodyBatteryChart({ precomputed, colors }) {
  const { containerRef, containerSize } = useChartContainerSize();

  const chartData = precomputed?.data ?? [];
  const displayInfo = precomputed?.displayInfo ?? null;
  const effectiveSelectedDate = precomputed?.selectedDate ?? null;
  const avgValue = precomputed?.average ?? (chartData.length === 0
    ? 0
    : chartData.reduce((sum, d) => sum + d.bodyBattery, 0) / chartData.length);

  if (chartData.length === 0) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 text-center text-slate-400">
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
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-lg">
        <p className="text-white font-semibold mb-2">{label}</p>
        <p className="text-sm" style={{ color: payload[0].color }}>
          {`Body Battery: ${value}/100`}
        </p>
        <div className="mt-2 text-xs text-slate-400">
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
      className="bg-slate-800/60 border border-slate-700 rounded-lg p-6"
      role="region"
      aria-label={ARIA_LABELS.BODY_BATTERY_CHART}
      aria-describedby="body-battery-chart-description"
    >
      <div className="flex items-center justify-between mb-4">
        <h4 id="body-battery-chart-title" className="text-white font-semibold">🔋 Body Battery</h4>
        <div className="flex items-center gap-3">
          {displayInfo && (
            <div className="text-slate-400 text-xs">{displayInfo}</div>
          )}
          {avgValue > 0 && (
            <div className="text-slate-400 text-sm">Moyenne: <span className="text-white font-semibold">{avgValue.toFixed(0)}/100</span></div>
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
              domain={[0, 100]}
              label={{ value: 'Body Battery', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF' } }}
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
              dataKey="bodyBattery"
              stroke={colors?.green || '#10B981'}
              strokeWidth={3}
              fill="url(#batteryGradient)"
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

export default React.memo(GarminBodyBatteryChart, areDerivedChartPropsEqual);

