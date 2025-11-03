import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { CustomDot } from './CustomDot';
import { useChartContainerSize } from './useChartContainerSize';
import { areChartPropsEqual } from '../../../../../utils/chartComparison';
import { prepareTimeSeriesForDisplay } from '../../../../../utils/garminTimeSeriesUtils';

/**
 * Graphique Heart Rate Time Series 24h (courbe FC minute par minute)
 * Affiche la fréquence cardiaque tout au long de la journée sélectionnée
 * 🟡 FIX #13: Wrapped dans React.memo pour éviter re-renders excessifs
 */
function GarminHeartRateTimeSeriesChart({ dailyMetrics, selectedDate, periodFilter, customStartDate, customEndDate, colors }) {
  // 🔴 FIX: Tous les hooks doivent être appelés AVANT les early returns
  // 🔴 FIX #20: useChartContainerSize doit être appelé AVANT les early returns
  const { containerRef, containerSize } = useChartContainerSize();

  const timeSeriesData = React.useMemo(() => {
    if (!dailyMetrics || !selectedDate) return [];
    
    const dayMetrics = dailyMetrics[selectedDate];
    const rawTimeSeries = dayMetrics?.heartRate?.timeSeries || [];
    
    if (rawTimeSeries.length === 0) return [];
    
    // 🔴 FIX #24: Décompresser la time series si elle est compressée
    const timeSeries = prepareTimeSeriesForDisplay(rawTimeSeries);
    
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

  // ✅ CORRECTION: Afficher même avec données partielles - permettre les espaces vides
  const validTimeSeries = React.useMemo(() => {
    // Filtrer et nettoyer les données valides
    const validData = timeSeriesData.filter(d => d.bpm != null && d.timestamp && d.bpm > 0);
    
    if (validData.length === 0) return [];
    
    // ✅ Créer une structure qui permet les gaps : utiliser les données réelles
    // Recharts gère automatiquement les gaps si on utilise connectNulls={false}
    return validData;
  }, [timeSeriesData]);
  
  // Afficher avec avertissement si données partielles (< 100 points pour une journée complète)
  const isPartialData = validTimeSeries.length > 0 && validTimeSeries.length < 100;

  // Calculer min/max pour l'axe Y
  const bpmValues = React.useMemo(() => {
    return validTimeSeries.map(d => d.bpm).filter(v => v != null);
  }, [validTimeSeries]);
  const minBpm = bpmValues.length > 0 ? Math.max(0, Math.min(...bpmValues) - 10) : 50;
  const maxBpm = bpmValues.length > 0 ? Math.min(220, Math.max(...bpmValues) + 10) : 180;

  // ✅ CORRECTION: Afficher le graphique même avec peu de données (1 point minimum)
  if (!dailyMetrics || !selectedDate || validTimeSeries.length === 0) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 text-center text-slate-400">
        <p>Aucune donnée de fréquence cardiaque (time series) disponible pour {selectedDate}.</p>
        <p className="text-xs mt-2">Les données time series ne sont disponibles que pour les jours où la FC a été mesurée.</p>
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
        <h4 className="text-white font-semibold">❤️ Fréquence Cardiaque - 24h ({selectedDate})</h4>
        <div className="text-slate-400 text-xs">
          {validTimeSeries.length} points
          {isPartialData && (
            <span className="text-yellow-400 ml-2" title="Données partielles : moins de 100 points pour cette journée">
              ⚠️ Données partielles
            </span>
          )}
        </div>
      </div>
      <div ref={containerRef} className="h-80 min-h-[320px]">
        <ResponsiveContainer 
          width={Math.max(400, containerSize.width)} 
          height={Math.max(320, containerSize.height)} 
          minHeight={320} 
          minWidth={400}
        >
          <AreaChart data={validTimeSeries} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
              // ✅ CORRECTION: Permettre l'affichage même avec des gaps temporels
              // L'axe X s'adapte automatiquement aux données disponibles
              domain={['dataMin', 'dataMax']}
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
              connectNulls={false}
              // ✅ CORRECTION: Permettre les gaps visuels (espaces vides) dans le graphique
              // connectNulls={false} empêche de connecter les points s'il y a des null
              // Mais ici on utilise les données réelles, donc les gaps seront automatiques
              dot={(props) => {
                const { key, ...restProps } = props;
                // ✅ Afficher tous les points si peu de données, sinon seulement toutes les heures
                const hour = props.payload?.hour;
                const minute = props.payload?.minute;
                // Si peu de données (< 10 points), afficher tous les points
                if (validTimeSeries.length < 10) {
                  return (
                    <CustomDot
                      key={key}
                      {...restProps}
                      fill={colors?.red || '#EF4444'}
                      stroke={colors?.red || '#EF4444'}
                      strokeWidth={2}
                      r={4}
                    />
                  );
                }
                // Sinon, afficher seulement à l'heure pile pour éviter surcharge
                if (minute !== 0) return null;
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

