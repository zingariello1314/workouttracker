import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ReferenceLine } from 'recharts';
import { useFilteredDates } from '../../hooks/useFilteredDates';
import { CustomDot } from './CustomDot';
import { useChartContainerSize } from './useChartContainerSize';
import { areChartPropsEqual } from '../../../../../utils/chartComparison';
import { DATE_RANGE, ARIA_LABELS } from '../../constants';
import logger from '../../../../../utils/logger';

const log = logger.component('GarminBodyBatteryChart');

/**
 * Graphique d'évolution du Body Battery
 * 🟡 FIX #13: Wrapped dans React.memo pour éviter re-renders excessifs
 */
function GarminBodyBatteryChart({ precomputed, dailyMetrics, selectedDate, periodFilter, customStartDate, customEndDate, colors }) {
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
    
    const data = filteredDates.map(date => {
      const dm = dailyMetrics[date] || {};
      // PHASE 3.1 : Gérer nouveau format (dict avec current + timeSeries) et ancien format (int)
      let bodyBatteryValue = null;
      if (dm.bodyBattery !== undefined && dm.bodyBattery !== null) {
        if (typeof dm.bodyBattery === 'object' && dm.bodyBattery.current !== undefined) {
          bodyBatteryValue = dm.bodyBattery.current;
        } else if (typeof dm.bodyBattery === 'number') {
          bodyBatteryValue = dm.bodyBattery;
        }
      }
      return {
        date,
        bodyBattery: bodyBatteryValue,
        isSelected: date === effectiveSelectedDate
      };
    }).filter(d => d.bodyBattery !== null);
    
    // Debug log pour identifier les problèmes de données
    if (data.length === 0 && filteredDates.length > 0) {
      log.warn('No Body Battery data for filtered dates:', filteredDates.map(date => {
        const dm = dailyMetrics[date] || {};
        return { date, bodyBattery: dm.bodyBattery, hasBodyBattery: dm.bodyBattery !== undefined && dm.bodyBattery !== null };
      }));
    }
    
    return data;
  }, [precomputed, dailyMetrics, filteredDates, effectiveSelectedDate]);

  const avgValue = React.useMemo(() => {
    if (precomputed?.average !== undefined) {
      return precomputed.average;
    }
    if (chartData.length === 0) return 0;
    return chartData.reduce((sum, d) => sum + d.bodyBattery, 0) / chartData.length;
  }, [precomputed, chartData]);

  if (!dailyMetrics || Object.keys(dailyMetrics).length === 0) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 text-center text-slate-400">
        Aucune donnée Body Battery disponible.
      </div>
    );
  }

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

export default React.memo(GarminBodyBatteryChart, areChartPropsEqual);

