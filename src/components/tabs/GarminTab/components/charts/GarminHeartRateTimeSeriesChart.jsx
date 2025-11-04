import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ReferenceArea } from 'recharts';
import { CustomDot } from './CustomDot';
import { useChartContainerSize } from './useChartContainerSize';
import { areChartPropsEqual } from '../../../../../utils/chartComparison';
import { 
  prepareTimeSeriesForDisplay, 
  enrichHeartRateTimeSeriesForVisualization 
} from '../../../../../utils/garminTimeSeriesUtils';

/**
 * Graphique Heart Rate Time Series 24h (courbe FC minute par minute)
 * Affiche la fréquence cardiaque tout au long de la journée sélectionnée
 * 🟡 FIX #13: Wrapped dans React.memo pour éviter re-renders excessifs
 */
function GarminHeartRateTimeSeriesChart({ dailyMetrics, selectedDate, periodFilter, customStartDate, customEndDate, colors }) {
  // 🔴 FIX: Tous les hooks doivent être appelés AVANT les early returns
  // 🔴 FIX #20: useChartContainerSize doit être appelé AVANT les early returns
  const { containerRef, containerSize } = useChartContainerSize();

  // 🟢 PRIORITÉ 3 - TÂCHE 1 : Enrichissement des données avec fonction utilitaire
  const enrichedData = React.useMemo(() => {
    if (!dailyMetrics || !selectedDate) return null;
    
    const dayMetrics = dailyMetrics[selectedDate];
    const rawTimeSeries = dayMetrics?.heartRate?.timeSeries || [];
    
    if (rawTimeSeries.length === 0) return null;
    
    // Décompresser la time series si elle est compressée
    const timeSeries = prepareTimeSeriesForDisplay(rawTimeSeries);
    
    // Enrichir avec statistiques, zones, gaps, etc.
    const maxHR = dayMetrics?.heartRate?.max || null;
    const restingHR = dayMetrics?.heartRate?.resting || null;
    
    return enrichHeartRateTimeSeriesForVisualization(timeSeries, {
      maxHR,
      restingHR,
      enableDownsampling: true,
      downsamplingThreshold: 1000,
      targetPoints: 500
    });
  }, [dailyMetrics, selectedDate]);

  const timeSeriesData = React.useMemo(() => {
    if (!enrichedData || !enrichedData.timeSeries || enrichedData.timeSeries.length === 0) return [];
    
    // Transformer les données enrichies pour le graphique
    return enrichedData.timeSeries.map(ts => {
      const timestamp = typeof ts.timestamp === 'number' ? ts.timestamp : new Date(ts.timestamp).getTime();
      const date = new Date(timestamp);
      return {
        time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        timestamp: timestamp,
        bpm: ts.bpm,
        hour: date.getHours(),
        minute: date.getMinutes()
      };
    }).sort((a, b) => a.timestamp - b.timestamp);
  }, [enrichedData]);

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

  // Calculer min/max pour l'axe Y (utiliser stats enrichies si disponibles)
  const bpmValues = React.useMemo(() => {
    if (enrichedData?.stats) {
      return [enrichedData.stats.min, enrichedData.stats.max];
    }
    return validTimeSeries.map(d => d.bpm).filter(v => v != null);
  }, [enrichedData, validTimeSeries]);
  const minBpm = enrichedData?.stats 
    ? Math.max(0, enrichedData.stats.min - 10) 
    : (bpmValues.length > 0 ? Math.max(0, Math.min(...bpmValues) - 10) : 50);
  const maxBpm = enrichedData?.stats 
    ? Math.min(220, enrichedData.stats.max + 10) 
    : (bpmValues.length > 0 ? Math.min(220, Math.max(...bpmValues) + 10) : 180);

  // ✅ CORRECTION: Afficher le graphique même avec peu de données (1 point minimum)
  if (!dailyMetrics || !selectedDate || validTimeSeries.length === 0) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 text-center text-slate-400">
        <p>Aucune donnée de fréquence cardiaque (time series) disponible pour {selectedDate}.</p>
        <p className="text-xs mt-2">Les données time series ne sont disponibles que pour les jours où la FC a été mesurée.</p>
      </div>
    );
  }

  // 🟢 PRIORITÉ 3 - TÂCHE 2 : Tooltip enrichi avec zone FC et statistiques
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0];
      const bpm = dataPoint?.value;
      
      // Déterminer la zone FC pour ce point
      let zoneInfo = null;
      if (bpm && enrichedData?.metadata?.zoneThresholds) {
        const effectiveMaxHR = enrichedData.metadata.effectiveMaxHR;
        const hrPercentage = bpm / effectiveMaxHR;
        
        for (const zone of enrichedData.metadata.zoneThresholds) {
          const zoneMin = zone.minBpm / effectiveMaxHR;
          const zoneMax = zone.maxBpm / effectiveMaxHR;
          if (hrPercentage >= zoneMin && hrPercentage < zoneMax) {
            zoneInfo = zone;
            break;
          }
        }
        // Zone 5 inclut 100%
        if (!zoneInfo && hrPercentage >= 0.90) {
          zoneInfo = enrichedData.metadata.zoneThresholds[4];
        }
      }
      
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-lg min-w-[200px]">
          <p className="text-white font-semibold mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-sm font-medium" style={{ color: dataPoint?.color || '#EF4444' }}>
              {`FC: ${bpm} bpm`}
            </p>
            {zoneInfo && (
              <div className="pt-1 border-t border-slate-700">
                <p className="text-xs text-slate-400">Zone FC</p>
                <p className="text-sm font-medium" style={{ color: zoneInfo.color }}>
                  {zoneInfo.name}
                </p>
                <p className="text-xs text-slate-500">
                  {zoneInfo.minBpm}-{zoneInfo.maxBpm} bpm
                </p>
              </div>
            )}
            {enrichedData?.stats && (
              <div className="pt-1 border-t border-slate-700">
                <p className="text-xs text-slate-400">Moyenne: {enrichedData.stats.avg} bpm</p>
                <p className="text-xs text-slate-400">Points: {enrichedData.stats.totalPoints}</p>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-white font-semibold">❤️ Fréquence Cardiaque - 24h ({selectedDate})</h4>
        <div className="text-slate-400 text-xs flex items-center gap-3">
          <span>{validTimeSeries.length} points</span>
          {isPartialData && (
            <span className="text-yellow-400" title="Données partielles : moins de 100 points pour cette journée">
              ⚠️ Données partielles
            </span>
          )}
        </div>
      </div>
      
      {/* 🟢 PRIORITÉ 3 - TÂCHE 2 : Légende interactive des zones FC */}
      {enrichedData?.metadata?.zoneThresholds && enrichedData.metadata.zoneThresholds.length > 0 && (
        <div className="mb-4 p-3 bg-slate-900/50 border border-slate-700 rounded-lg">
          <p className="text-xs text-slate-400 mb-2">Zones de Fréquence Cardiaque</p>
          <div className="grid grid-cols-5 gap-2">
            {enrichedData.metadata.zoneThresholds.map((zone) => {
              const zoneTime = enrichedData.zones?.[zone.zone] || 0;
              const minutes = Math.round(zoneTime / 60);
              const percentage = enrichedData.metadata.duration > 0 
                ? Math.round((zoneTime / enrichedData.metadata.duration) * 100) 
                : 0;
              
              return (
                <div 
                  key={zone.zone} 
                  className="flex flex-col items-center p-2 rounded hover:bg-slate-800/50 transition-colors cursor-help"
                  title={`${zone.name} (${zone.minBpm}-${zone.maxBpm} bpm)`}
                >
                  <div 
                    className="w-full h-2 rounded mb-1"
                    style={{ backgroundColor: zone.color, opacity: 0.6 }}
                  />
                  <div className="text-xs font-medium text-center" style={{ color: zone.color }}>
                    {zone.name.split(' - ')[0]}
                  </div>
                  <div className="text-xs text-slate-500 text-center">
                    {zone.minBpm}-{zone.maxBpm} bpm
                  </div>
                  {zoneTime > 0 && (
                    <div className="text-xs text-slate-400 text-center mt-1">
                      {minutes} min ({percentage}%)
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
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
              {/* 🟢 PRIORITÉ 3 - TÂCHE 2 : Gradients pour zones FC */}
              {enrichedData?.metadata?.zoneThresholds?.map((zone, idx) => (
                <linearGradient key={`zone-${zone.zone}`} id={`zoneGradient-${zone.zone}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={zone.color} stopOpacity={0.15}/>
                  <stop offset="100%" stopColor={zone.color} stopOpacity={0.05}/>
                </linearGradient>
              ))}
            </defs>
            {/* 🟢 PRIORITÉ 3 - TÂCHE 2 : Zones FC en arrière-plan */}
            {enrichedData?.metadata?.zoneThresholds?.map((zone, idx) => {
              const zoneMin = zone.minBpm;
              const zoneMax = zone.maxBpm;
              // Vérifier que la zone est visible dans la plage affichée
              if (zoneMax < minBpm || zoneMin > maxBpm) return null;
              
              return (
                <ReferenceArea
                  key={`refArea-${zone.zone}`}
                  y1={Math.max(zoneMin, minBpm)}
                  y2={Math.min(zoneMax, maxBpm)}
                  fill={`url(#zoneGradient-${zone.zone})`}
                  stroke={zone.color}
                  strokeWidth={0.5}
                  strokeOpacity={0.3}
                  ifOverflow="extendDomain"
                />
              );
            })}
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
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
      <div className="mt-4 space-y-2">
        {/* Statistiques principales */}
        <div className="text-xs text-slate-400 flex gap-4">
          <div>Min: {enrichedData?.stats?.min || (bpmValues.length > 0 ? Math.min(...bpmValues) : '—')} bpm</div>
          <div>Max: {enrichedData?.stats?.max || (bpmValues.length > 0 ? Math.max(...bpmValues) : '—')} bpm</div>
          <div>Moyenne: {enrichedData?.stats?.avg || (bpmValues.length > 0 ? Math.round(bpmValues.reduce((a, b) => a + b, 0) / bpmValues.length) : '—')} bpm</div>
          {enrichedData?.stats?.coverage !== undefined && (
            <div>Couverture: {enrichedData.stats.coverage}%</div>
          )}
        </div>
        
        {/* Zones FC (si disponibles) */}
        {enrichedData?.zones && Object.values(enrichedData.zones).some(v => v > 0) && (
          <div className="text-xs text-slate-400 pt-2 border-t border-slate-700">
            <div className="font-semibold text-slate-300 mb-1">Temps par zone FC :</div>
            <div className="grid grid-cols-5 gap-2">
              {enrichedData.metadata?.zoneThresholds?.map((zone, idx) => {
                const zoneTime = enrichedData.zones[zone.zone] || 0;
                const minutes = Math.round(zoneTime / 60);
                const percentage = enrichedData.metadata.duration > 0 
                  ? Math.round((zoneTime / enrichedData.metadata.duration) * 100) 
                  : 0;
                return (
                  <div key={zone.zone} className="flex flex-col items-center">
                    <div className="text-xs font-medium" style={{ color: zone.color }}>
                      {zone.name.split(' - ')[0]}
                    </div>
                    <div className="text-slate-400">{minutes} min</div>
                    <div className="text-slate-500">{percentage}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
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

