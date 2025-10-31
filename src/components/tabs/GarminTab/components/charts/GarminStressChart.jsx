import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ReferenceLine } from 'recharts';
import { useFilteredDates } from '../../hooks/useFilteredDates';
import { CustomDot } from './CustomDot';

/**
 * Graphique d'évolution du Stress
 */
export default function GarminStressChart({ dailyMetrics, selectedDate, periodFilter, customStartDate, customEndDate, colors }) {
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
      return {
        date,
        stress: dm.stress !== undefined && dm.stress !== null ? dm.stress : null,
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

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
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
    }
    return null;
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-white font-semibold">😰 Stress</h4>
        <div className="flex items-center gap-3">
          {displayInfo && (
            <div className="text-slate-400 text-xs">{displayInfo}</div>
          )}
          {avgValue > 0 && (
            <div className="text-slate-400 text-sm">Moyenne: <span className="text-white font-semibold">{avgValue.toFixed(0)}</span></div>
          )}
        </div>
      </div>
      <div className="h-80 min-h-[320px]">
        <ResponsiveContainer width="100%" height="100%" minHeight={320}>
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
              dataKey="stress"
              stroke={colors?.purple || '#8B5CF6'}
              strokeWidth={3}
              fill="url(#stressGradient)"
              name="Stress"
              dot={(props) => (
                <CustomDot
                  {...props}
                  fill={colors?.purple || '#8B5CF6'}
                  stroke={colors?.purple || '#8B5CF6'}
                  strokeWidth={2}
                  r={4}
                />
              )}
              activeDot={{ r: 8, stroke: colors?.purple || '#8B5CF6', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

