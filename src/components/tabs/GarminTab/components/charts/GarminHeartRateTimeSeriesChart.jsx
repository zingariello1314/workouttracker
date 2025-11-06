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
function GarminHeartRateTimeSeriesChart({ dailyMetrics, selectedDate, periodFilter, customStartDate, customEndDate, colors, activities }) {
  // 🔴 FIX: Tous les hooks doivent être appelés AVANT les early returns
  // 🔴 FIX #20: useChartContainerSize doit être appelé AVANT les early returns
  // 🔴 FIX : Hauteur minimale augmentée à 550px pour éviter coupure verticale
  const { containerRef, containerSize } = useChartContainerSize(550, 400);

  // 🔴 NOUVEAU : Création d'une courbe continue comme Garmin Connect
  const enrichedData = React.useMemo(() => {
    if (!dailyMetrics || !selectedDate) return null;
    
    const dayMetrics = dailyMetrics[selectedDate];
    if (!dayMetrics) return null;
    
    const rawTimeSeries = dayMetrics?.heartRate?.timeSeries || [];
    
    // 🔴 FIX : Décompresser la time series si elle est compressée (delta encoding)
    const timeSeries = prepareTimeSeriesForDisplay(rawTimeSeries);
    
    // 🔴 DEBUG : Logger pour diagnostiquer la décompression et valider les données
    if (rawTimeSeries.length > 0) {
      const isCompressed = rawTimeSeries.length > 1 && rawTimeSeries[1] && (rawTimeSeries[1].d_ts !== undefined || rawTimeSeries[1].d_val !== undefined);
      if (isCompressed) {
        console.log(`[GarminHeartRateTimeSeriesChart] ${selectedDate}: ${rawTimeSeries.length} points compressés → ${timeSeries.length} points décompressés`);
        
        // 🔴 VALIDATION : Logger les premiers et derniers points pour comparaison avec Garmin Connect
        if (timeSeries.length > 0) {
          const firstPoint = timeSeries[0];
          const lastPoint = timeSeries[timeSeries.length - 1];
          const firstDate = new Date(firstPoint.timestamp);
          const lastDate = new Date(lastPoint.timestamp);
          
          console.log(`[GarminHeartRateTimeSeriesChart] 📊 Validation: Premier point ${firstDate.toLocaleTimeString('fr-FR')} (${firstPoint.bpm} bpm), Dernier point ${lastDate.toLocaleTimeString('fr-FR')} (${lastPoint.bpm} bpm)`);
          
          // Calculer stats pour validation
          const bpmValues = timeSeries.map(ts => ts.bpm).filter(bpm => bpm > 0);
          if (bpmValues.length > 0) {
            const minBpm = Math.min(...bpmValues);
            const maxBpm = Math.max(...bpmValues);
            const avgBpm = Math.round(bpmValues.reduce((a, b) => a + b, 0) / bpmValues.length);
            console.log(`[GarminHeartRateTimeSeriesChart] 📊 Stats décompressées: Min=${minBpm} bpm, Max=${maxBpm} bpm, Moy=${avgBpm} bpm`);
          }
        }
      } else {
        // ⚠️ Données non compressées : peut être normal pour données anciennes ou fusionnées
        // Ne pas afficher comme erreur critique, juste comme info
        if (rawTimeSeries.length > 1) {
          console.log(`[GarminHeartRateTimeSeriesChart] ℹ️ ${selectedDate}: ${rawTimeSeries.length} points non compressés (format non compressé, normal pour données anciennes ou fusionnées)`);
        } else {
          console.warn(`[GarminHeartRateTimeSeriesChart] ⚠️ ${selectedDate}: Seulement ${rawTimeSeries.length} point(s) dans IndexedDB. Les données compressées ont probablement été perdues lors d'une sauvegarde précédente.`);
          console.warn(`[GarminHeartRateTimeSeriesChart] 💡 SOLUTION: Resynchroniser les données pour le ${selectedDate} pour récupérer les points manquants.`);
        }
      }
    }
    
    // Métriques agrégées
    const maxHR = dayMetrics?.heartRate?.max || null;
    const restingHR = dayMetrics?.heartRate?.resting || null;
    const avgHR = dayMetrics?.heartRate?.avg || null;
    
    // 🔴 NOUVEAU : Si pas de restingHR, on ne peut pas créer de courbe enrichie
    if (!restingHR && timeSeries.length === 0) {
      return null;
    }
    
    // 🔴 NOUVEAU : Récupérer les activités du jour pour enrichir la courbe
    const dayActivities = [];
    if (activities) {
      const allActivities = [
        ...(activities.swimming || []),
        ...(activities.jumpRope || []),
        ...(activities.cardio || [])
      ];
      
      // Filtrer les activités du jour sélectionné
      allActivities.forEach(act => {
        if (act.date === selectedDate) {
          dayActivities.push(act);
        }
      });
    }
    
    // ✅ PHASE 1.2 : Supprimer complètement createContinuousHeartRateCurve
    // ✅ Utiliser uniquement enrichHeartRateTimeSeriesForVisualization qui ne génère pas de données artificielles
    // ✅ Si < 10 points : afficher uniquement les points réels (pas de courbe continue)
    // ✅ Si >= 10 points : interpolation linéaire simple entre points réels uniquement
    
    // Enrichir les données réelles (stats, zones, gaps) SANS générer de données artificielles
    const enriched = enrichHeartRateTimeSeriesForVisualization(timeSeries, {
      maxHR,
      restingHR,
      enableDownsampling: timeSeries.length > 1000, // Downsampling seulement si > 1000 points
      downsamplingThreshold: 1000,
      targetPoints: 500
    });
    
    // ✅ PHASE 1.2 : Marquer si on a peu de données (< 10 points) pour affichage conditionnel
    // Le composant affichera uniquement les points (pas de courbe) si enriched.timeSeries.length < 10
    return {
      ...enriched,
      hasEnoughDataForCurve: enriched.timeSeries.length >= 10,
      realPointsCount: timeSeries.length
    };
  }, [dailyMetrics, selectedDate, activities]);

  const timeSeriesData = React.useMemo(() => {
    if (!enrichedData || !enrichedData.timeSeries || enrichedData.timeSeries.length === 0) return [];
    
    // 🔴 FIX : Décompression et transformation des données pour le graphique
    // prepareTimeSeriesForDisplay est déjà appelé dans enrichedData, mais on double-vérifie
    const transformed = enrichedData.timeSeries.map(ts => {
      // 🔴 FIX : S'assurer que timestamp est toujours un nombre (millisecondes)
      let timestamp;
      if (typeof ts.timestamp === 'number') {
        timestamp = ts.timestamp;
      } else if (typeof ts.timestamp === 'string') {
        timestamp = new Date(ts.timestamp).getTime();
      } else {
        // Fallback : utiliser Date.now() si timestamp invalide
        timestamp = Date.now();
      }
      
      // 🔴 FIX : S'assurer que bpm est toujours un nombre
      const bpm = typeof ts.bpm === 'number' ? ts.bpm : (typeof ts.bpm === 'string' ? parseFloat(ts.bpm) : 0);
      
      const date = new Date(timestamp);
      
      // 🔴 FIX : Vérifier que la date est valide
      if (isNaN(date.getTime())) {
        console.warn('[GarminHeartRateTimeSeriesChart] Invalid timestamp:', ts.timestamp, 'for point:', ts);
        return null;
      }
      
      return {
        time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        timestamp: timestamp,
        bpm: bpm,
        hour: date.getHours(),
        minute: date.getMinutes(),
        // 🔴 NOUVEAU : Préserver les métadonnées pour l'affichage
        isReal: ts.isReal === true,
        isActivity: ts.isActivity === true
      };
    })
    .filter(ts => ts !== null) // Filtrer les points invalides
    .sort((a, b) => a.timestamp - b.timestamp);
    
    // ✅ PLAN INTÉGRATION : Ajouter des points virtuels à 00:00 et 23:59 pour forcer l'axe X à afficher 24h
    // Ces points virtuels permettent à Recharts d'étendre l'axe X jusqu'à 23:59
    // Ils ne sont PAS des données réelles, juste des marqueurs pour l'affichage
    if (transformed.length > 0 && selectedDate) {
      const dayStart = new Date(selectedDate + 'T00:00:00').getTime();
      const dayEnd = new Date(selectedDate + 'T23:59:59').getTime();
      
      const firstPoint = transformed[0];
      const lastPoint = transformed[transformed.length - 1];
      
      const result = [];
      
      // Point virtuel à 00:00 si le premier point réel est après 00:05
      if (firstPoint.timestamp > dayStart + 5 * 60 * 1000) {
        result.push({
          time: '00:00',
          timestamp: dayStart,
          bpm: null, // Pas de données = gap
          hour: 0,
          minute: 0,
          isReal: false,
          isVirtual: true,
          isActivity: false
        });
      }
      
      // Points réels
      result.push(...transformed);
      
      // Point virtuel à 23:59 si le dernier point réel est avant 23:54
      if (lastPoint.timestamp < dayEnd - 5 * 60 * 1000) {
        result.push({
          time: '23:59',
          timestamp: dayEnd,
          bpm: null, // Pas de données = gap
          hour: 23,
          minute: 59,
          isReal: false,
          isVirtual: true,
          isActivity: false
        });
      }
      
      return result;
    }
    
    return transformed;
  }, [enrichedData, selectedDate]);

  // ✅ CORRECTION: Afficher même avec données partielles - permettre les espaces vides
  const validTimeSeries = React.useMemo(() => {
    if (!enrichedData || !enrichedData.timeSeries || enrichedData.timeSeries.length === 0) return [];
    
    // Filtrer et nettoyer les données valides
    const validData = timeSeriesData.filter(d => d.bpm != null && d.timestamp && d.bpm > 0);
    
    if (validData.length === 0) return [];
    
    // ✅ Créer une structure qui permet les gaps : utiliser les données réelles
    // Recharts gère automatiquement les gaps si on utilise connectNulls={false}
    return validData;
  }, [timeSeriesData, enrichedData]);
  
  // ✅ PHASE 2.1 : Calculer les gaps pour visualisation (gaps internes + gap final)
  // Pour ReferenceArea avec XAxis de type category, on doit utiliser les valeurs de time string
  // pour que Recharts puisse positionner correctement les zones
  // 🔴 FIX : Définir gapAreas AVANT tous les early returns pour éviter "is not defined"
  const gapAreas = React.useMemo(() => {
    // ✅ Protection : Si pas de données, retourner tableau vide
    if (!validTimeSeries || validTimeSeries.length === 0 || !selectedDate) return [];
    if (!enrichedData) return [];
    
    const gaps = [];
    
    // 1. Gaps internes détectés par enrichHeartRateTimeSeriesForVisualization
    if (enrichedData.gaps && Array.isArray(enrichedData.gaps) && enrichedData.gaps.length > 0) {
      enrichedData.gaps.forEach(gap => {
        // Convertir les timestamps en format compatible avec Recharts (time string)
        const startDate = new Date(gap.start);
        const endDate = new Date(gap.end);
        const startTimeStr = startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const endTimeStr = endDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        
        // Trouver les points les plus proches dans validTimeSeries
        const startIdx = validTimeSeries.findIndex(p => p.time === startTimeStr || 
          Math.abs(new Date(p.timestamp).getTime() - gap.start) < 2 * 60 * 1000);
        const endIdx = validTimeSeries.findIndex(p => p.time === endTimeStr || 
          Math.abs(new Date(p.timestamp).getTime() - gap.end) < 2 * 60 * 1000);
        
        // Si on trouve les points, utiliser leurs time strings, sinon utiliser les time strings calculés
        const x1 = startIdx >= 0 ? validTimeSeries[startIdx].time : startTimeStr;
        const x2 = endIdx >= 0 ? validTimeSeries[endIdx].time : endTimeStr;
        
        gaps.push({
          x1,
          x1Timestamp: gap.start,
          x2,
          x2Timestamp: gap.end,
          duration: gap.duration,
          type: 'internal'
        });
      });
    }
    
    // 2. Gap initial : gap de 00:00 au premier point réel (si > 5 min)
    if (validTimeSeries.length > 0) {
      const firstPoint = validTimeSeries[0];
      const firstTimestamp = firstPoint.timestamp;
      const dayStart = new Date(selectedDate + 'T00:00:00');
      const dayStartTs = dayStart.getTime();
      
      // Si le premier point est après 00:05, créer un gap initial
      if (firstTimestamp > dayStartTs + 5 * 60 * 1000) {
        const gapDuration = (firstTimestamp - dayStartTs) / 1000; // En secondes
        
        gaps.push({
          x1: '00:00', // Time string pour 00:00
          x1Timestamp: dayStartTs,
          x2: firstPoint.time, // Time string du premier point réel
          x2Timestamp: firstTimestamp,
          duration: gapDuration,
          type: 'initial'
        });
      }
    }
    
    // 3. Gap final : gap après le dernier point réel (jusqu'à 23:59 si applicable)
    if (validTimeSeries.length > 0) {
      const lastPoint = validTimeSeries[validTimeSeries.length - 1];
      const lastTimestamp = lastPoint.timestamp;
      
      // Vérifier si le dernier point n'est pas à 23:59
      const dayEnd = new Date(selectedDate + 'T23:59:59');
      const dayEndTs = dayEnd.getTime();
      
      // Si le dernier point est avant 23:59, créer un gap final
      if (lastTimestamp < dayEndTs - 60000) { // -1 min de tolérance
        const gapDuration = (dayEndTs - lastTimestamp) / 1000; // En secondes
        
        // Seulement si le gap est significatif (> 5 minutes)
        if (gapDuration > 5 * 60) {
          gaps.push({
            x1: lastPoint.time, // Utiliser le time string du dernier point
            x1Timestamp: lastTimestamp,
            x2: '23:59', // Time string pour 23:59
            x2Timestamp: dayEndTs,
            duration: gapDuration,
            type: 'final'
          });
        }
      }
    }
    
    return gaps;
  }, [validTimeSeries, enrichedData, selectedDate]);
  
  // ✅ PHASE 1.2 : Utiliser hasEnoughDataForCurve au lieu de isEnriched
  const hasEnoughDataForCurve = enrichedData?.hasEnoughDataForCurve === true;
  
  // Afficher avec avertissement si données partielles (mais suffisantes pour une courbe)
  const isPartialData = validTimeSeries.length > 0 && validTimeSeries.length < 100 && hasEnoughDataForCurve;

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

  // ✅ CORRECTION: Afficher le graphique même avec peu de données (courbe enrichie si nécessaire)
  if (!dailyMetrics || !selectedDate) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 text-center text-slate-400">
        <p>Aucune donnée de fréquence cardiaque disponible pour {selectedDate}.</p>
        <p className="text-xs mt-2">Synchronisez vos données Garmin pour afficher le graphique.</p>
      </div>
    );
  }
  
  // Si pas de données du tout (pas même de métriques agrégées), afficher message
  const dayMetrics = dailyMetrics[selectedDate];
  if (!dayMetrics || (!dayMetrics?.heartRate?.timeSeries?.length && !dayMetrics?.heartRate?.resting)) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 text-center text-slate-400">
        <p>Aucune donnée de fréquence cardiaque disponible pour {selectedDate}.</p>
        <p className="text-xs mt-2">Synchronisez vos données Garmin pour afficher le graphique.</p>
      </div>
    );
  }
  
  // Si pas de timeSeries mais on peut créer une courbe enrichie, continuer
  if (validTimeSeries.length === 0 && !hasEnoughDataForCurve) {
    // Essayer de créer une courbe enrichie avec les métriques agrégées
    const restingHR = dayMetrics?.heartRate?.resting;
    const avgHR = dayMetrics?.heartRate?.avg;
    const maxHR = dayMetrics?.heartRate?.max;
    
    if (!restingHR) {
      return (
        <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 text-center text-slate-400">
          <p>Aucune donnée de fréquence cardiaque disponible pour {selectedDate}.</p>
          <p className="text-xs mt-2">Synchronisez vos données Garmin pour afficher le graphique.</p>
        </div>
      );
    }
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
    <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 pb-12">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-white font-semibold">❤️ Fréquence Cardiaque - 24h ({selectedDate})</h4>
        <div className="text-slate-400 text-xs flex items-center gap-3">
          <span>
            {(() => {
              const realCount = enrichedData?.realPointsCount;
              const totalCount = validTimeSeries.length;
              if (realCount && realCount !== totalCount) {
                return `${realCount} point${realCount > 1 ? 's' : ''} réel${realCount > 1 ? 's' : ''} (${totalCount} total)`;
              }
              return `${totalCount} point${totalCount > 1 ? 's' : ''}`;
            })()}
          </span>
          {!hasEnoughDataForCurve && (
            <span className="text-yellow-400" title="Données insuffisantes : moins de 10 points réels. Seuls les points réels sont affichés (pas de courbe continue).">
              ⚠️ Données insuffisantes ({enrichedData?.realPointsCount || 0} points)
            </span>
          )}
          {hasEnoughDataForCurve && isPartialData && (
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
      <div ref={containerRef} className="h-[550px] min-h-[550px] px-2 pb-2">
        <ResponsiveContainer 
          width={Math.max(400, containerSize.width)} 
          height={Math.max(550, containerSize.height)} 
          minHeight={550} 
          minWidth={400}
        >
          <AreaChart data={validTimeSeries} margin={{ top: 10, right: 40, left: 60, bottom: 30 }}>
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
              {/* ✅ PHASE 2.1 : Gradient pour zones sans données (gaps) - vert clair comme Garmin Connect */}
              <linearGradient id="gapGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#86EFAC" stopOpacity={0.2}/>
                <stop offset="100%" stopColor="#86EFAC" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            {/* 🔴 FIX : Désactiver temporairement les zones FC en arrière-plan qui polluent le graphique */}
            {/* Les zones FC seront affichées uniquement dans la légende, pas en arrière-plan */}
            {/* TODO : Réactiver avec un meilleur style (opacité réduite, pas de stroke) */}
            {/* {enrichedData?.metadata?.zoneThresholds?.map((zone, idx) => {
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
                  stroke="none"
                  strokeOpacity={0}
                  ifOverflow="extendDomain"
                  opacity={0.05}
                />
              );
            })} */}
            {/* ✅ PHASE 2.1 : Zones sans données (gaps) - vert clair comme Garmin Connect */}
            {/* 🔴 FIX : Protection contre gapAreas undefined */}
            {gapAreas && Array.isArray(gapAreas) && gapAreas.length > 0 && gapAreas.map((gap, idx) => {
              // Utiliser x1 et x2 basés sur le time string pour compatibilité avec XAxis
              // Recharts utilisera les valeurs de time pour positionner les ReferenceArea
              return (
                <ReferenceArea
                  key={`gap-${idx}-${gap.type}`}
                  x1={gap.x1}
                  x2={gap.x2}
                  y1={minBpm}
                  y2={maxBpm}
                  fill="url(#gapGradient)"
                  stroke="#86EFAC"
                  strokeWidth={1}
                  strokeOpacity={0.4}
                  strokeDasharray="4 4"
                  ifOverflow="extendDomain"
                  label={{
                    value: "Pas de données",
                    position: "inside",
                    fill: "#86EFAC",
                    fontSize: 10,
                    fontWeight: 500,
                    opacity: 0.7
                  }}
                />
              );
            })}
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis
              dataKey="time"
              type="category"
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              interval="preserveStartEnd"
              // ✅ PLAN INTÉGRATION : Avec les points virtuels à 00:00 et 23:59, dataMin/dataMax couvrira toujours 24h
              // Les points virtuels forcent Recharts à afficher toute la plage
              domain={['dataMin', 'dataMax']}
            />
            <YAxis
              domain={[minBpm, maxBpm]}
              stroke="#9CA3AF"
              label={{ value: 'bpm', angle: -90, position: 'left', style: { fill: '#9CA3AF', textAnchor: 'middle' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type={enrichedData?.hasEnoughDataForCurve ? "monotone" : "linear"}
              // ✅ PHASE 1.2 : Si < 10 points, utiliser "linear" (interpolation linéaire simple)
              // Si >= 10 points, utiliser "monotone" (interpolation cubique fluide)
              dataKey="bpm"
              stroke={colors?.red || '#EF4444'}
              strokeWidth={enrichedData?.hasEnoughDataForCurve ? 2 : 1}
              // ✅ PHASE 1.2 : Réduire l'épaisseur si peu de données
              fill={enrichedData?.hasEnoughDataForCurve ? "url(#colorBpm)" : "none"}
              // ✅ PHASE 1.2 : Pas de remplissage si peu de données (affichage points uniquement)
              name="FC (bpm)"
              connectNulls={false}
              // ✅ PLAN INTÉGRATION : connectNulls={false} pour créer des gaps visuels
              // Les points virtuels (bpm: null) créeront des gaps dans la courbe
              dot={(props) => {
                const { key, ...restProps } = props;
                const payload = props.payload;
                const isReal = payload?.isReal;
                const isActivity = payload?.isActivity;
                
                // ✅ PHASE 1.2 : Afficher tous les points si peu de données (< 10 points)
                // Pour les données abondantes (>= 10 points), afficher uniquement les points réels et activités
                // 🔴 FIX : Utiliser enrichedData?.hasEnoughDataForCurve directement pour éviter problème de closure
                const enoughData = enrichedData?.hasEnoughDataForCurve === true;
                if (!enoughData || isReal || isActivity) {
                  return (
                    <CustomDot
                      key={key}
                      {...restProps}
                      fill={isActivity ? '#10B981' : (isReal ? '#EF4444' : '#6B7280')}
                      stroke={isActivity ? '#10B981' : (isReal ? '#EF4444' : '#6B7280')}
                      strokeWidth={isReal || isActivity ? 2 : 1.5}
                      r={isReal || isActivity ? 5 : 3}
                      opacity={isReal || isActivity ? 1 : 0.6}
                    />
                  );
                }
                
                // Ne pas afficher les autres points pour éviter surcharge
                return null;
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

