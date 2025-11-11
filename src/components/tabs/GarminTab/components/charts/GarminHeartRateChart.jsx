import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useFilteredDates } from '../../hooks/useFilteredDates';
import { CustomDot } from './CustomDot';
import { useChartContainerSize } from './useChartContainerSize';
import { areChartPropsEqual } from '../../../../../utils/chartComparison';
import { DATE_RANGE, ARIA_LABELS } from '../../constants';
import logger from '../../../../../utils/logger';

const log = logger.component('GarminHeartRateChart');

/**
 * Graphique de fréquence cardiaque 24h
 * 🟡 FIX #13: Wrapped dans React.memo pour éviter re-renders excessifs
 */
function GarminHeartRateChart({ precomputed, dailyMetrics, selectedDate, periodFilter, customStartDate, customEndDate, colors }) {
  // 🔴 FIX: Tous les hooks doivent être appelés AVANT les early returns
  // Sinon l'ordre des hooks change entre les rendus
  // 🔴 FIX #51-60: Utiliser constante pour contextDays
  const fallbackFiltered = useFilteredDates(
    dailyMetrics,
    selectedDate,
    periodFilter,
    customStartDate,
    customEndDate,
    DATE_RANGE.ACTIVITIES_DAYS // contextDays par défaut
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
      const hr = dm.heartRate || {};
      return {
        date,
        resting: hr.resting || dm.restingHeartRate || dm.restingHR || null,
        max: hr.max || dm.maxHeartRate || dm.maxHR || null,
        avg: hr.avg || hr.average || dm.avgHeartRate || dm.averageHeartRate || null,
        isSelected: date === effectiveSelectedDate
      };
    }).filter(d => d.resting !== null || d.max !== null || d.avg !== null);

    // Debug log pour identifier les problèmes de données
    if (data.length === 0 && filteredDates.length > 0) {
      log.warn('No HR data for filtered dates:', filteredDates.map(date => {
        const dm = dailyMetrics[date] || {};
        const hr = dm.heartRate || {};
        return { date, hasHR: !!hr, resting: hr.resting, max: hr.max, avg: hr.avg };
      }));
    }

    return data;
  }, [precomputed, dailyMetrics, filteredDates, effectiveSelectedDate]);

  // ✅ FIX : Calculer le domaine Y avec marge pour éviter que les valeurs ne touchent le bord
  const yAxisDomain = React.useMemo(() => {
    if (precomputed?.yAxisDomain) {
      return precomputed.yAxisDomain;
    }

    if (!chartData || chartData.length === 0) return [0, 180];

    // Trouver les valeurs min et max parmi toutes les valeurs FC (resting, max, avg)
    let minValue = Infinity;
    let maxValue = -Infinity;

    chartData.forEach(d => {
      if (d.resting !== null && d.resting !== undefined) {
        minValue = Math.min(minValue, d.resting);
        maxValue = Math.max(maxValue, d.resting);
      }
      if (d.max !== null && d.max !== undefined) {
        minValue = Math.min(minValue, d.max);
        maxValue = Math.max(maxValue, d.max);
      }
      if (d.avg !== null && d.avg !== undefined) {
        minValue = Math.min(minValue, d.avg);
        maxValue = Math.max(maxValue, d.avg);
      }
    });

    // Si aucune valeur trouvée, utiliser des valeurs par défaut
    if (minValue === Infinity || maxValue === -Infinity) {
      return [0, 180];
    }

    // Calculer la marge : 10% de la plage ou minimum 10 bpm
    const range = maxValue - minValue;
    const margin = Math.max(range * 0.1, 10); // 10% ou minimum 10 bpm

    // Calculer le domaine avec marge
    const domainMin = Math.max(0, Math.floor(minValue - margin));
    const domainMax = Math.ceil(maxValue + margin);

    // S'assurer que le domaine ne dépasse pas les limites physiologiques raisonnables
    // (0-220 bpm pour un adulte)
    const finalMin = Math.max(0, domainMin);
    const finalMax = Math.min(220, domainMax);

    return [finalMin, finalMax];
  }, [precomputed, chartData]);

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

export default React.memo(GarminHeartRateChart, areChartPropsEqual);

