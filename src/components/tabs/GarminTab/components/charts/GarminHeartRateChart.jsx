import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useFilteredDates } from '../../hooks/useFilteredDates';
import { CustomDot } from './CustomDot';

/**
 * Graphique de fréquence cardiaque 24h
 */
export default function GarminHeartRateChart({ dailyMetrics, selectedDate, periodFilter, customStartDate, customEndDate, colors }) {
  const { filteredDates, displayInfo, selectedDate: effectiveSelectedDate } = useFilteredDates(
    dailyMetrics,
    selectedDate,
    periodFilter,
    customStartDate,
    customEndDate,
    7 // contextDays par défaut
  );

  const chartData = React.useMemo(() => {
    if (!dailyMetrics || filteredDates.length === 0) return [];
    
    const data = filteredDates.map(date => {
      const dm = dailyMetrics[date] || {};
      const hr = dm.heartRate || {};
      return {
        date,
        resting: hr.resting || null,
        max: hr.max || null,
        avg: hr.avg || null,
        isSelected: date === effectiveSelectedDate
      };
    }).filter(d => d.resting !== null || d.max !== null || d.avg !== null);
    
    // Debug log pour identifier les problèmes de données
    if (data.length === 0 && filteredDates.length > 0) {
      console.warn('[GarminHeartRateChart] No HR data for filtered dates:', filteredDates.map(date => {
        const dm = dailyMetrics[date] || {};
        const hr = dm.heartRate || {};
        return { date, hasHR: !!hr, resting: hr.resting, max: hr.max, avg: hr.avg };
      }));
    }
    
    return data;
  }, [dailyMetrics, filteredDates, effectiveSelectedDate]);

  if (!dailyMetrics || Object.keys(dailyMetrics).length === 0) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 text-center text-slate-400">
        Aucune donnée de fréquence cardiaque disponible.
      </div>
    );
  }

  if (chartData.length === 0) {
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

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-white font-semibold">❤️ Fréquence Cardiaque</h4>
        {displayInfo && (
          <div className="text-slate-400 text-xs">{displayInfo}</div>
        )}
      </div>
      <div className="h-80 min-h-[320px]">
        <ResponsiveContainer width="100%" height="100%" minHeight={320}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
              stroke="#9CA3AF"
            />
            <YAxis
              stroke="#9CA3AF"
              label={{ value: 'bpm', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF' } }}
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
            {chartData.some(d => d.resting !== null) && (
              <Line
                type="monotone"
                dataKey="resting"
                stroke={colors?.green || '#10B981'}
                strokeWidth={2}
                name="FC Repos"
                dot={(props) => (
                  <CustomDot
                    {...props}
                    fill={colors?.green || '#10B981'}
                    stroke={colors?.green || '#10B981'}
                    strokeWidth={2}
                    r={4}
                  />
                )}
                activeDot={{ r: 7, stroke: colors?.green || '#10B981', strokeWidth: 2 }}
              />
            )}
            {chartData.some(d => d.avg !== null) && (
              <Line
                type="monotone"
                dataKey="avg"
                stroke={colors?.primary || '#3B82F6'}
                strokeWidth={2}
                name="FC Moyenne"
                dot={(props) => (
                  <CustomDot
                    {...props}
                    fill={colors?.primary || '#3B82F6'}
                    stroke={colors?.primary || '#3B82F6'}
                    strokeWidth={2}
                    r={4}
                  />
                )}
                activeDot={{ r: 7, stroke: colors?.primary || '#3B82F6', strokeWidth: 2 }}
              />
            )}
            {chartData.some(d => d.max !== null) && (
              <Line
                type="monotone"
                dataKey="max"
                stroke={colors?.red || '#EF4444'}
                strokeWidth={2}
                name="FC Max"
                dot={(props) => (
                  <CustomDot
                    {...props}
                    fill={colors?.red || '#EF4444'}
                    stroke={colors?.red || '#EF4444'}
                    strokeWidth={2}
                    r={4}
                  />
                )}
                activeDot={{ r: 7, stroke: colors?.red || '#EF4444', strokeWidth: 2 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

