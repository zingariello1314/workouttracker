import React from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useFilteredDates } from '../../hooks/useFilteredDates';
import { useChartContainerSize } from './useChartContainerSize';
import { DATE_RANGE, ARIA_LABELS } from '../../constants';
import logger from '../../../../../utils/logger';
import { areChartPropsEqual } from '../../../../../utils/chartComparison';
import { Activity } from 'lucide-react';

const log = logger.component('GarminDailyActivityChart');

/**
 * Graphique d'activité quotidienne (Steps, Calories, Distance)
 * Affiche les 3 métriques principales d'activité sur une période
 */
function GarminDailyActivityChart({ dailyMetrics, selectedDate, periodFilter, customStartDate, customEndDate, colors }) {
  const { filteredDates, displayInfo, selectedDate: effectiveSelectedDate } = useFilteredDates(
    dailyMetrics,
    selectedDate,
    periodFilter,
    customStartDate,
    customEndDate,
    DATE_RANGE.ACTIVITIES_DAYS
  );

  const { containerRef, containerSize } = useChartContainerSize();

  const chartData = React.useMemo(() => {
    if (!dailyMetrics || filteredDates.length === 0) return [];
    
    const data = filteredDates.map(date => {
      const dm = dailyMetrics[date] || {};
      
      // Extraire steps
      const steps = dm.steps || 0;
      
      // Extraire calories (peut être un objet ou un nombre)
      let calories = 0;
      if (dm.calories) {
        if (typeof dm.calories === 'object' && dm.calories.total !== undefined) {
          calories = dm.calories.total;
        } else if (typeof dm.calories === 'number') {
          calories = dm.calories;
        }
      }
      
      // Extraire distance : le backend fournit désormais la distance en kilomètres.
      // Pour compatibilité ascendante, convertir depuis les mètres si nécessaire.
      let distanceKm = 0;
      const rawDistance = dm.distance;

      const normalizeDistance = (value) => {
        if (value === null || value === undefined) return 0;
        if (typeof value === 'number') {
          // Si la valeur est très grande (>= 100), considérer qu'elle est en mètres (données legacy) et convertir.
          return value >= 100 ? value / 1000 : value;
        }
        if (typeof value === 'string') {
          const parsed = parseFloat(value);
          if (!Number.isNaN(parsed)) {
            return parsed >= 100 ? parsed / 1000 : parsed;
          }
          return 0;
        }
        if (typeof value === 'object') {
          const candidate =
            value.value ??
            value.total ??
            value.avg ??
            value.average ??
            value.distance ??
            value.km ??
            null;
          return normalizeDistance(candidate);
        }
        return 0;
      };

      distanceKm = normalizeDistance(rawDistance);
      
      return {
        date,
        steps,
        calories,
        distance: parseFloat(distanceKm.toFixed(2)),
        isSelected: date === effectiveSelectedDate
      };
    }).filter(d => d.steps > 0 || d.calories > 0 || d.distance > 0);
    
    return data;
  }, [dailyMetrics, filteredDates, effectiveSelectedDate]);

  if (!dailyMetrics || Object.keys(dailyMetrics).length === 0) {
    return (
      <div className="rounded-xl border-2 border-[#0F4C5C]/70 bg-black p-6 text-center text-teal-100/55 shadow-md shadow-black/40">
        Aucune donnée d'activité disponible.
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="rounded-xl border-2 border-[#0F4C5C]/70 bg-black p-6 text-center text-teal-100/55 shadow-md shadow-black/40">
        Aucune donnée d'activité disponible pour cette période.
      </div>
    );
  }

  // Calculer les moyennes
  const avgSteps = chartData.length > 0 
    ? Math.round(chartData.reduce((sum, d) => sum + d.steps, 0) / chartData.length)
    : 0;
  const avgCalories = chartData.length > 0
    ? Math.round(chartData.reduce((sum, d) => sum + d.calories, 0) / chartData.length)
    : 0;
  const avgDistance = chartData.length > 0
    ? parseFloat((chartData.reduce((sum, d) => sum + d.distance, 0) / chartData.length).toFixed(2))
    : 0;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black border border-[#0F4C5C]/60 rounded-lg p-3 shadow-lg min-w-[200px]">
          <p className="text-teal-100 font-semibold mb-2">{label}</p>
          <div className="space-y-1">
            {payload.map((entry, index) => {
              let value = entry.value;
              let unit = '';
              let label = entry.name;
              
              if (entry.dataKey === 'steps') {
                unit = ' pas';
                label = 'Pas';
              } else if (entry.dataKey === 'calories') {
                unit = ' kcal';
                label = 'Calories';
              } else if (entry.dataKey === 'distance') {
                unit = ' km';
                label = 'Distance';
                value = value.toFixed(2);
              }
              
              return (
                <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
                  {`${label}: ${value}${unit}`}
                </p>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  // Formater les dates pour l'affichage
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div 
      className="rounded-xl border-2 border-[#0F4C5C]/70 bg-black p-6 pb-8 shadow-md shadow-black/40"
      role="region"
      aria-label={ARIA_LABELS.DAILY_ACTIVITY_CHART || 'Graphique d\'activité quotidienne'}
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-teal-100 font-semibold flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Activité Quotidienne
        </h4>
        <div className="flex items-center gap-3">
          {displayInfo && (
            <div className="text-teal-100/55 text-xs">{displayInfo}</div>
          )}
          <div className="text-sky-300/70 text-xs">
            Moy: {avgSteps.toLocaleString()} pas, {avgCalories} kcal, {avgDistance} km
          </div>
        </div>
      </div>
      
      <div 
        ref={containerRef} 
        className="h-80 min-h-[320px] px-2 pb-2"
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
        <ResponsiveContainer 
          width={Math.max(400, containerSize.width)} 
          height={Math.max(320, containerSize.height)} 
          minHeight={320} 
          minWidth={400}
        >
          <ComposedChart data={chartData} margin={{ top: 10, right: 40, left: 20, bottom: 30 }}>
            <defs>
              <linearGradient id="stepsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors?.blue || '#3B82F6'} stopOpacity={0.3} />
                <stop offset="100%" stopColor={colors?.blue || '#3B82F6'} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="left"
              label={{ value: 'Pas / Calories', angle: -90, position: 'left', style: { fill: '#9CA3AF', textAnchor: 'middle' } }}
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              label={{ value: 'Distance (km)', angle: 90, position: 'right', style: { fill: '#9CA3AF', textAnchor: 'middle' } }}
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="steps"
              fill={colors?.blue || '#3B82F6'}
              name="Pas"
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="calories"
              stroke={colors?.red || '#EF4444'}
              strokeWidth={2}
              dot={{ fill: colors?.red || '#EF4444', r: 4 }}
              name="Calories"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="distance"
              stroke={colors?.green || '#10B981'}
              strokeWidth={2}
              dot={{ fill: colors?.green || '#10B981', r: 4 }}
              name="Distance (km)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 space-y-2">
        <div className="text-xs text-teal-100/55 flex gap-4">
          <div>Max Pas: {Math.max(...chartData.map(d => d.steps)).toLocaleString()}</div>
          <div>Max Calories: {Math.max(...chartData.map(d => d.calories))}</div>
          <div>Max Distance: {Math.max(...chartData.map(d => d.distance)).toFixed(2)} km</div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(GarminDailyActivityChart, areChartPropsEqual);

