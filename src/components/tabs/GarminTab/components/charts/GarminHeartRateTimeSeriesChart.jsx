import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { CustomDot } from './CustomDot';
import { useChartContainerSize } from './useChartContainerSize';
import { areChartPropsEqual } from '../../../../../utils/chartComparison';

/**
 * Graphique Heart Rate Time Series 24h (courbe FC minute par minute)
 * Affiche la fréquence cardiaque tout au long de la journée sélectionnée
 * 🟡 FIX #13: Wrapped dans React.memo pour éviter re-renders excessifs
 */
function GarminHeartRateTimeSeriesChart({ dailyMetrics, selectedDate, periodFilter, customStartDate, customEndDate, colors }) {
  const timeSeriesData = React.useMemo(() => {
    if (!dailyMetrics || !selectedDate) return [];
    
    const dayMetrics = dailyMetrics[selectedDate];
    const timeSeries = dayMetrics?.heartRate?.timeSeries || [];
    
    if (timeSeries.length === 0) return [];
    
    // Transformer les données pour le graphique
    return timeSeries.map(ts => {
      const date = new Date(ts.timestamp);
      return {
        time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        timestamp: ts.timestamp,
        bpm: ts.bpm,
        hour: date.getHours(),
        minute: date.getMinutes()
      };
    }).sort((a, b) => {
      // Trier par timestamp
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return dateA.getTime() - dateB.getTime();
    });
  }, [dailyMetrics, selectedDate]);

  if (!dailyMetrics || !selectedDate || timeSeriesData.length === 0) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 text-center text-slate-400">
        <p>Aucune donnée de fréquence cardiaque (time series) disponible pour {selectedDate}.</p>
        <p className="text-xs mt-2">Les données time series ne sont disponibles que pour les jours où la FC a été mesurée en continu.</p>
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

  // Calculer min/max pour l'axe Y
  const bpmValues = timeSeriesData.map(d => d.bpm).filter(v => v != null);
  const minBpm = bpmValues.length > 0 ? Math.max(0, Math.min(...bpmValues) - 10) : 50;
  const maxBpm = bpmValues.length > 0 ? Math.min(220, Math.max(...bpmValues) + 10) : 180;

  // 🔴 FIX #5: Vérifier dimensions du conteneur avant rendu
  const containerRef = React.useRef(null);
  const [containerSize, setContainerSize] = React.useState({ width: 0, height: 320 });

  React.useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setContainerSize({ width, height });
        }
      }
    });
    
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // 🔴 FIX #29: Afficher même avec données partielles
  const validTimeSeries = timeSeriesData.filter(d => d.bpm != null && d.timestamp);
  
  if (!dailyMetrics || !selectedDate || validTimeSeries.length === 0) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 text-center text-slate-400">
        <p>Aucune donnée de fréquence cardiaque (time series) disponible pour {selectedDate}.</p>
        <p className="text-xs mt-2">Les données time series ne sont disponibles que pour les jours où la FC a été mesurée en continu.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-white font-semibold">❤️ Fréquence Cardiaque - 24h ({selectedDate})</h4>
        <div className="text-slate-400 text-xs">
          {validTimeSeries.length} points
          {validTimeSeries.length < 100 && (
            <span className="text-yellow-400 ml-2">⚠️ Données partielles</span>
          )}
        </div>
      </div>
      <div ref={containerRef} className="h-80 min-h-[320px]">
        <ResponsiveContainer width="100%" height="100%" minHeight={320} minWidth={400}>
          <AreaChart data={timeSeriesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorBpm" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors?.red || '#EF4444'} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={colors?.red || '#EF4444'} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="time"
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[minBpm, maxBpm]}
              stroke="#9CA3AF"
              label={{ value: 'bpm', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="bpm"
              stroke={colors?.red || '#EF4444'}
              strokeWidth={2}
              fill="url(#colorBpm)"
              name="FC (bpm)"
              dot={(props) => {
                const { key, ...restProps } = props;
                // Afficher un point seulement toutes les heures pour éviter surcharge
                const hour = props.payload?.hour;
                const minute = props.payload?.minute;
                if (minute !== 0) return null; // Afficher seulement à l'heure pile
                return (
                  <CustomDot
                    key={key}
                    {...restProps}
                    fill={colors?.red || '#EF4444'}
                    stroke={colors?.red || '#EF4444'}
                    strokeWidth={2}
                    r={3}
                  />
                );
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 text-xs text-slate-400 flex gap-4">
        <div>Min: {bpmValues.length > 0 ? Math.min(...bpmValues) : '—'} bpm</div>
        <div>Max: {bpmValues.length > 0 ? Math.max(...bpmValues) : '—'} bpm</div>
        <div>Moyenne: {bpmValues.length > 0 ? Math.round(bpmValues.reduce((a, b) => a + b, 0) / bpmValues.length) : '—'} bpm</div>
      </div>
    </div>
  );
}

// 🟡 FIX #13: Memoization avec comparaison optimisée
export default React.memo(GarminHeartRateTimeSeriesChart, (prevProps, nextProps) => {
  return prevProps.selectedDate === nextProps.selectedDate &&
         prevProps.periodFilter === nextProps.periodFilter &&
         prevProps.customStartDate === nextProps.customStartDate &&
         prevProps.customEndDate === nextProps.customEndDate &&
         // Comparaison optimisée : seulement les timeSeries de la date sélectionnée
         JSON.stringify(prevProps.dailyMetrics?.[prevProps.selectedDate]?.heartRate?.timeSeries) ===
         JSON.stringify(nextProps.dailyMetrics?.[nextProps.selectedDate]?.heartRate?.timeSeries) &&
         prevProps.colors === nextProps.colors;
});

