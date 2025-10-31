import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ReferenceLine } from 'recharts';
import { useFilteredDates } from '../../hooks/useFilteredDates';
import { CustomDot } from './CustomDot';

/**
 * Graphique d'évolution du Body Battery
 */
export default function GarminBodyBatteryChart({ dailyMetrics, selectedDate, periodFilter, customStartDate, customEndDate, colors }) {
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
    
    const data = filteredDates.map(date => {
      const dm = dailyMetrics[date] || {};
      return {
        date,
        bodyBattery: dm.bodyBattery !== undefined && dm.bodyBattery !== null ? dm.bodyBattery : null,
        isSelected: date === effectiveSelectedDate
      };
    }).filter(d => d.bodyBattery !== null);
    
    // Debug log pour identifier les problèmes de données
    if (data.length === 0 && filteredDates.length > 0) {
      console.warn('[GarminBodyBatteryChart] No Body Battery data for filtered dates:', filteredDates.map(date => {
        const dm = dailyMetrics[date] || {};
        return { date, bodyBattery: dm.bodyBattery, hasBodyBattery: dm.bodyBattery !== undefined && dm.bodyBattery !== null };
      }));
    }
    
    return data;
  }, [dailyMetrics, filteredDates, effectiveSelectedDate]);

  const avgValue = React.useMemo(() => {
    if (chartData.length === 0) return 0;
    return chartData.reduce((sum, d) => sum + d.bodyBattery, 0) / chartData.length;
  }, [chartData]);

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

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
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
    }
    return null;
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-white font-semibold">🔋 Body Battery</h4>
        <div className="flex items-center gap-3">
          {displayInfo && (
            <div className="text-slate-400 text-xs">{displayInfo}</div>
          )}
          {avgValue > 0 && (
            <div className="text-slate-400 text-sm">Moyenne: <span className="text-white font-semibold">{avgValue.toFixed(0)}/100</span></div>
          )}
        </div>
      </div>
      <div className="h-80 min-h-[320px]">
        <ResponsiveContainer width="100%" height="100%" minHeight={320}>
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
            <Area
              type="monotone"
              dataKey="bodyBattery"
              stroke={colors?.green || '#10B981'}
              strokeWidth={3}
              fill="url(#batteryGradient)"
              name="Body Battery"
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
              activeDot={{ r: 8, stroke: colors?.green || '#10B981', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

