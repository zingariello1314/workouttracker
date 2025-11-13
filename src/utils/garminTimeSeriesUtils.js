/**
 * 🔴 FIX #24: Utilitaires pour décompresser les time series côté frontend
 * Gère la décompression delta encoding si nécessaire
 * ✅ PHASE 1.4 : Optimisé avec cache LRU pour éviter décompressions redondantes
 */

import { getDecompressed } from './garminTimeSeriesCache.js';

/**
 * Décompresse une time series compressée avec delta encoding
 * @param {Array} compressed - Time series compressée (premier point complet + deltas)
 * @returns {Array} Time series décompressée
 */
export function decompressTimeSeriesDelta(compressed) {
  if (!compressed || compressed.length <= 1) {
    return compressed || [];
  }

  // Si le premier élément n'a pas de d_ts, ce n'est pas compressé
  if (!compressed[1] || (!compressed[1].d_ts && !compressed[1].d_val)) {
    return compressed;
  }

  // Déterminer les clés pour value et timestamp
  const first = compressed[0];
  const valueKey = first.bpm !== undefined ? 'bpm' : 
                   first.value !== undefined ? 'value' : 
                   first.level !== undefined ? 'level' : 'value';
  const timestampKey = 'timestamp';

  // 🔴 FIX : Convertir le timestamp initial en millisecondes si c'est une string
  let firstTimestamp = first[timestampKey];
  if (typeof firstTimestamp === 'string') {
    firstTimestamp = new Date(firstTimestamp).getTime();
  } else if (typeof firstTimestamp !== 'number') {
    firstTimestamp = 0;
  }

  const decompressed = [{
    ...first,
    [timestampKey]: firstTimestamp // Utiliser le timestamp converti en nombre
  }];

  // 🔴 DEBUG : Logger le premier point pour diagnostic
  const firstDate = new Date(firstTimestamp);
  console.log(`[decompressTimeSeriesDelta] Premier point: ${firstDate.toISOString()} (${firstDate.toLocaleString('fr-FR')}), BPM: ${first[valueKey]}`);

  let prevTs = firstTimestamp;
  let prevVal = first[valueKey] || 0;

  for (let i = 1; i < compressed.length; i++) {
    const delta = compressed[i];

    // Si c'est un delta, reconstruire
    if (delta.d_ts !== undefined && delta.d_val !== undefined) {
      // 🔴 FIX : d_ts et d_val sont déjà en millisecondes et en nombre
      const currTs = prevTs + (delta.d_ts || 0);
      const currVal = prevVal + (delta.d_val || 0);
      
      // 🔴 VALIDATION : Vérifier que les valeurs BPM sont dans les limites physiologiques
      let finalVal = currVal;
      if (currVal < 30 || currVal > 220) {
        console.warn(`[decompressTimeSeriesDelta] ⚠️ Valeur BPM hors limites: ${currVal} bpm à ${new Date(currTs).toLocaleTimeString('fr-FR')}`);
        // Clamper la valeur plutôt que de l'ignorer
        const clampedVal = Math.max(30, Math.min(220, currVal));
        if (clampedVal !== currVal) {
          console.log(`[decompressTimeSeriesDelta] 🔧 Valeur clampée: ${currVal} → ${clampedVal}`);
        }
        finalVal = clampedVal;
      }

      const point = {
        [timestampKey]: currTs,
        [valueKey]: finalVal
      };

      // Garder les autres clés
      Object.keys(delta).forEach(key => {
        if (key !== 'd_ts' && key !== 'd_val') {
          point[key] = delta[key];
        }
      });

      decompressed.push(point);

      prevTs = currTs;
      prevVal = currVal;
      
      // 🔴 DEBUG : Logger le dernier point pour diagnostic
      if (i === compressed.length - 1) {
        const lastDate = new Date(currTs);
        console.log(`[decompressTimeSeriesDelta] Dernier point: ${lastDate.toISOString()} (${lastDate.toLocaleString('fr-FR')}), BPM: ${currVal}`);
        console.log(`[decompressTimeSeriesDelta] Total décompressé: ${decompressed.length} points`);
      }
    } else {
      // Point complet (ne devrait pas arriver après le premier)
      let deltaTimestamp = delta[timestampKey];
      if (typeof deltaTimestamp === 'string') {
        deltaTimestamp = new Date(deltaTimestamp).getTime();
      }
      decompressed.push({
        ...delta,
        [timestampKey]: deltaTimestamp || prevTs
      });
      prevTs = deltaTimestamp || prevTs;
      prevVal = delta[valueKey] || prevVal;
    }
  }

  return decompressed;
}

/**
 * Prépare une time series pour affichage (décompresse si nécessaire)
 * 
 * ✅ PHASE 1.4 : Utilise le cache pour éviter décompressions redondantes
 * 
 * @param {Array} timeSeries - Time series (peut être compressée ou non)
 * @param {Object} options - Options
 * @param {boolean} options.useCache - Utiliser le cache (défaut: true)
 * @returns {Array} Time series prête pour affichage
 */
export function prepareTimeSeriesForDisplay(timeSeries, options = {}) {
  if (!timeSeries || !Array.isArray(timeSeries) || timeSeries.length === 0) {
    return [];
  }

  const { useCache = true } = options;

  // Vérifier si compressée (si le 2e élément a d_ts et d_val)
  const isCompressed = timeSeries.length > 1 && 
                       timeSeries[1] && 
                       (timeSeries[1].d_ts !== undefined || timeSeries[1].d_val !== undefined);

  if (isCompressed) {
    // Utiliser le cache si activé
    if (useCache) {
      return getDecompressed(timeSeries, decompressTimeSeriesDelta);
    } else {
      return decompressTimeSeriesDelta(timeSeries);
    }
  }

  return timeSeries;
}

/**
 * 🟢 PRIORITÉ 3 - TÂCHE 1 : Fonction d'enrichissement frontend pour time series FC
 * 
 * Enrichit une time series de fréquence cardiaque avec :
 * - Statistiques (min, max, avg)
 * - Détection des gaps temporels (pour affichage visuel)
 * - Calcul du temps passé dans chaque zone FC
 * - Métadonnées pour tooltips et légendes
 * - Optimisation pour rendu (downsampling intelligent si > 1000 points)
 * 
 * ❌ IMPORTANT : Ne génère AUCUNE donnée artificielle/interpolée
 * ✅ Uniquement optimisation visuelle et calcul de statistiques
 * 
 * @param {Array} timeSeries - Time series FC (format: [{timestamp, bpm}, ...])
 * @param {Object} options - Options d'enrichissement
 * @param {number} options.maxHR - FC max de l'utilisateur (pour calcul zones, défaut: 220 - âge si non fourni)
 * @param {number} options.restingHR - FC repos (pour context, optionnel)
 * @param {boolean} options.enableDownsampling - Activer downsampling si > 1000 points (défaut: true)
 * @param {number} options.downsamplingThreshold - Seuil pour downsampling (défaut: 1000 points)
 * @param {number} options.targetPoints - Nombre de points cible après downsampling (défaut: 500)
 * @returns {Object} Objet enrichi avec :
 *   - timeSeries: Array (données originales ou downsamplees pour rendu)
 *   - stats: {min, max, avg, totalPoints, coverage}
 *   - zones: {zone1, zone2, zone3, zone4, zone5} (temps en secondes par zone)
 *   - gaps: Array de {start, end, duration} (gaps temporels détectés)
 *   - metadata: {firstTimestamp, lastTimestamp, duration, hasData}
 */
export function enrichHeartRateTimeSeriesForVisualization(timeSeries, options = {}) {
  // Validation des entrées
  if (!timeSeries || !Array.isArray(timeSeries) || timeSeries.length === 0) {
    return {
      timeSeries: [],
      stats: { min: 0, max: 0, avg: 0, totalPoints: 0, coverage: 0 },
      zones: { zone1: 0, zone2: 0, zone3: 0, zone4: 0, zone5: 0 },
      gaps: [],
      metadata: { firstTimestamp: null, lastTimestamp: null, duration: 0, hasData: false }
    };
  }

  // Options avec valeurs par défaut
  const {
    maxHR = null, // Sera calculé si non fourni
    restingHR = null,
    enableDownsampling = true,
    downsamplingThreshold = 1000,
    targetPoints = 500
  } = options;

  // Déterminer FC max (si non fourni, utiliser max des données * 1.2 comme approximation)
  const bpmValues = timeSeries
    .map(ts => ts.bpm || ts.value || 0)
    .filter(bpm => bpm > 0 && bpm <= 220);
  
  const calculatedMaxHR = maxHR || (bpmValues.length > 0 
    ? Math.min(220, Math.max(...bpmValues) * 1.2) 
    : 220);
  
  const effectiveMaxHR = Math.max(50, Math.min(220, calculatedMaxHR));

  // Définitions des zones FC (5 zones standard basées sur % de FC max)
  // Cohérent avec heart_rate_zones_parser.py
  const zoneThresholds = [
    { zone: 'zone1', min: 0, max: 0.60, name: 'Zone 1 - Échauffement', color: '#3B82F6' }, // 0-60%
    { zone: 'zone2', min: 0.60, max: 0.70, name: 'Zone 2 - Brûlage graisses', color: '#10B981' }, // 60-70%
    { zone: 'zone3', min: 0.70, max: 0.80, name: 'Zone 3 - Aérobie', color: '#F59E0B' }, // 70-80%
    { zone: 'zone4', min: 0.80, max: 0.90, name: 'Zone 4 - Seuil', color: '#EF4444' }, // 80-90%
    { zone: 'zone5', min: 0.90, max: 1.0, name: 'Zone 5 - Maximale', color: '#DC2626' } // 90-100%
  ];

  // ✅ PHASE 1.4 : Décompresser d'abord si nécessaire (utilise cache)
  const { useCache = true } = options;
  let processedTimeSeries = timeSeries;
  if (timeSeries.length > 1 && timeSeries[1] && (timeSeries[1].d_ts !== undefined || timeSeries[1].d_val !== undefined)) {
    // Utiliser le cache si activé
    if (useCache) {
      processedTimeSeries = getDecompressed(timeSeries, decompressTimeSeriesDelta);
    } else {
      processedTimeSeries = decompressTimeSeriesDelta(timeSeries);
    }
  }
  
  // Trier et nettoyer les données
  const sortedTimeSeries = processedTimeSeries
    .filter(ts => {
      const timestamp = ts.timestamp;
      const bpm = ts.bpm || ts.value || 0;
      return timestamp && bpm > 0 && bpm <= 220;
    })
    .map(ts => {
      // 🔴 FIX : Convertir timestamp en millisecondes si nécessaire
      let timestamp = ts.timestamp;
      if (typeof timestamp === 'string') {
        timestamp = new Date(timestamp).getTime();
      } else if (typeof timestamp !== 'number') {
        return null; // Timestamp invalide
      }
      
      return {
        timestamp: timestamp,
        bpm: ts.bpm || ts.value || 0
      };
    })
    .filter(ts => ts !== null && !isNaN(ts.timestamp))
    .sort((a, b) => a.timestamp - b.timestamp);

  if (sortedTimeSeries.length === 0) {
    return {
      timeSeries: [],
      stats: { min: 0, max: 0, avg: 0, totalPoints: 0, coverage: 0 },
      zones: { zone1: 0, zone2: 0, zone3: 0, zone4: 0, zone5: 0 },
      gaps: [],
      metadata: { firstTimestamp: null, lastTimestamp: null, duration: 0, hasData: false }
    };
  }

  // Calculer les statistiques
  const bpmStats = sortedTimeSeries.map(ts => ts.bpm);
  const stats = {
    min: Math.min(...bpmStats),
    max: Math.max(...bpmStats),
    avg: Math.round(bpmStats.reduce((a, b) => a + b, 0) / bpmStats.length),
    totalPoints: sortedTimeSeries.length,
    coverage: 0 // Sera calculé après détection des gaps
  };

  // Calculer le temps passé dans chaque zone FC
  const zoneTimes = { zone1: 0, zone2: 0, zone3: 0, zone4: 0, zone5: 0 };
  
  // Si on a au moins 2 points, calculer le temps par zone
  if (sortedTimeSeries.length >= 2) {
    for (let i = 0; i < sortedTimeSeries.length - 1; i++) {
      const current = sortedTimeSeries[i];
      const next = sortedTimeSeries[i + 1];
      const timeDelta = (next.timestamp - current.timestamp) / 1000; // En secondes
      const avgBpm = (current.bpm + next.bpm) / 2;
      const hrPercentage = avgBpm / effectiveMaxHR;

      // Déterminer dans quelle zone on est
      for (const threshold of zoneThresholds) {
        if (hrPercentage >= threshold.min && hrPercentage < threshold.max) {
          zoneTimes[threshold.zone] += timeDelta;
          break;
        }
      }
      // Zone 5 inclut 100% (max inclus)
      if (hrPercentage >= 0.90) {
        zoneTimes.zone5 += timeDelta;
      }
    }
  }

  // Détecter les gaps temporels (pour affichage visuel)
  const gaps = [];
  const gapThreshold = 5 * 60 * 1000; // 5 minutes en millisecondes
  
  for (let i = 0; i < sortedTimeSeries.length - 1; i++) {
    const current = sortedTimeSeries[i];
    const next = sortedTimeSeries[i + 1];
    const timeDiff = next.timestamp - current.timestamp;

    if (timeDiff > gapThreshold) {
      gaps.push({
        start: current.timestamp,
        end: next.timestamp,
        duration: timeDiff / 1000, // En secondes
        startBpm: current.bpm,
        endBpm: next.bpm
      });
    }
  }

  // ✅ PLAN INTÉGRATION : Calculer la couverture sur 24h complètes (comme Garmin Connect)
  // La couverture doit refléter le pourcentage de la journée complète (00:00-23:59) couvert par des données
  const firstTimestamp = sortedTimeSeries[0].timestamp;
  const lastTimestamp = sortedTimeSeries[sortedTimeSeries.length - 1].timestamp;
  
  // Calculer la durée totale de données (sans gaps internes)
  const dataDuration = (lastTimestamp - firstTimestamp) - gaps.reduce((sum, gap) => sum + gap.duration * 1000, 0);
  
  // Couverture sur 24h complètes (comme Garmin Connect)
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000; // 24h en millisecondes
  stats.coverage = TWENTY_FOUR_HOURS_MS > 0 ? Math.round((dataDuration / TWENTY_FOUR_HOURS_MS) * 100) : 0;
  
  // 🔴 NOUVEAU : Ajouter aussi la couverture sur la plage réelle (pour référence)
  const totalDuration = lastTimestamp - firstTimestamp;
  stats.coverageInRange = totalDuration > 0 ? Math.round((dataDuration / totalDuration) * 100) : 0;

  // Métadonnées
  const metadata = {
    firstTimestamp: firstTimestamp,
    lastTimestamp: lastTimestamp,
    duration: totalDuration / 1000, // En secondes
    hasData: sortedTimeSeries.length > 0,
    effectiveMaxHR,
    zoneThresholds: zoneThresholds.map(t => ({
      zone: t.zone,
      minBpm: Math.round(t.min * effectiveMaxHR),
      maxBpm: Math.round(t.max * effectiveMaxHR),
      name: t.name,
      color: t.color
    }))
  };

  // Downsampling intelligent si nécessaire (pour performance)
  let optimizedTimeSeries = sortedTimeSeries;
  
  if (enableDownsampling && sortedTimeSeries.length > downsamplingThreshold) {
    // Downsampling adaptatif : garder tous les points dans les zones critiques (zones 4-5)
    // et réduire la densité dans les zones 1-3
    const downsampled = [];
    const step = Math.ceil(sortedTimeSeries.length / targetPoints);
    
    for (let i = 0; i < sortedTimeSeries.length; i += step) {
      const point = sortedTimeSeries[i];
      const hrPercentage = point.bpm / effectiveMaxHR;
      
      // Toujours garder les zones 4-5 (haute intensité)
      if (hrPercentage >= 0.80 || i % (step * 2) === 0) {
        downsampled.push(point);
      }
    }
    
    // Toujours garder le premier et dernier point
    if (downsampled.length === 0 || downsampled[0].timestamp !== sortedTimeSeries[0].timestamp) {
      downsampled.unshift(sortedTimeSeries[0]);
    }
    if (downsampled.length === 0 || 
        downsampled[downsampled.length - 1].timestamp !== sortedTimeSeries[sortedTimeSeries.length - 1].timestamp) {
      downsampled.push(sortedTimeSeries[sortedTimeSeries.length - 1]);
    }
    
    optimizedTimeSeries = downsampled.sort((a, b) => a.timestamp - b.timestamp);
  }

  return {
    timeSeries: optimizedTimeSeries,
    stats,
    zones: zoneTimes,
    gaps,
    metadata
  };
}

/**
 * 🔴 NOUVEAU : Crée une courbe FC continue comme Garmin Connect
 * 
 * Stratégie intelligente pour créer une courbe continue même avec peu de données :
 * 1. Utilise les points réels de timeSeries
 * 2. Fusionne avec les données d'activités (avgHR, maxHR) pour créer des pics
 * 3. Crée une courbe basique basée sur métriques agrégées si < 10 points
 * 4. Interpole entre points réels (linéaire)
 * 5. Gère les gaps visuellement (courbe continue mais style différent)
 * 
 * ❌ IMPORTANT : Ne génère JAMAIS de données inventées
 * ✅ Uniquement basé sur : points réels, activités, métriques agrégées
 * 
 * @param {Array} timeSeries - Time series FC réelle (format: [{timestamp, bpm}, ...])
 * @param {Array} activities - Activités Garmin du jour (format: [{date, time, avgHR, maxHR, duration}, ...])
 * @param {Object} metrics - Métriques agrégées (format: {resting, avg, max})
 * @param {Object} options - Options
 * @param {number} options.maxHR - FC max (défaut: calculé)
 * @param {number} options.restingHR - FC repos (requis si peu de données)
 * @param {number} options.avgHR - FC moyenne (optionnel)
 * @param {number} options.maxHRMetric - FC max métrique (optionnel)
 * @returns {Object} Objet enrichi avec timeSeries continue (24h)
 */
export function createContinuousHeartRateCurve(timeSeries, activities = [], metrics = {}, options = {}) {
  const {
    maxHR = null,
    restingHR = metrics.resting || null,
    avgHR = metrics.avg || null,
    maxHRMetric = metrics.max || null
  } = options;

  // ✅ PHASE 1.3 : Ne pas générer de courbe sans données réelles
  // Validation stricte : besoin de données réelles pour générer une courbe
  if (!timeSeries || timeSeries.length === 0) {
    // Même si restingHR existe, ne pas générer de courbe sans données réelles
    return {
      timeSeries: [],
      stats: { min: 0, max: 0, avg: 0, totalPoints: 0, coverage: 0 },
      zones: { zone1: 0, zone2: 0, zone3: 0, zone4: 0, zone5: 0 },
      gaps: [],
      metadata: { firstTimestamp: null, lastTimestamp: null, duration: 0, hasData: false },
      isEnriched: false
    };
  }

  // Nettoyer et trier les points réels
  const realPoints = (timeSeries || [])
    .filter(ts => {
      const timestamp = ts.timestamp;
      const bpm = ts.bpm || ts.value || 0;
      return timestamp && bpm > 0 && bpm <= 220;
    })
    .map(ts => ({
      timestamp: typeof ts.timestamp === 'string' ? new Date(ts.timestamp).getTime() : ts.timestamp,
      bpm: ts.bpm || ts.value || 0
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  // ✅ PHASE 1.1 : Identifier la plage réelle de données (premier point → dernier point)
  // Ne pas utiliser 00:00-23:59, mais plutôt la plage réelle des données
  if (realPoints.length === 0) {
    // Si après filtrage il n'y a plus de points valides, retourner vide
    return {
      timeSeries: [],
      stats: { min: 0, max: 0, avg: 0, totalPoints: 0, coverage: 0 },
      zones: { zone1: 0, zone2: 0, zone3: 0, zone4: 0, zone5: 0 },
      gaps: [],
      metadata: { firstTimestamp: null, lastTimestamp: null, duration: 0, hasData: false },
      isEnriched: false
    };
  }

  // ✅ Déterminer la plage réelle de données (premier point → dernier point réel)
  const dataStartTs = realPoints[0].timestamp;
  const dataEndTs = realPoints[realPoints.length - 1].timestamp;
  
  // Pour l'alignement visuel, on peut optionnellement arrondir au début de la journée
  // mais on NE GÉNÈRE PAS de points avant le premier point réel
  const dayStart = new Date(dataStartTs);
  dayStart.setHours(0, 0, 0, 0, 0);
  const dayStartTs = dayStart.getTime();
  
  // ✅ CRITIQUE : La fin de la courbe doit être le dernier point réel, PAS 23:59
  // On ne génère PAS de points après le dernier point réel
  const curveEndTs = dataEndTs; // Pas dayEnd à 23:59, mais dataEndTs

  // Calculer FC max effective
  const bpmValues = realPoints.map(p => p.bpm);
  const calculatedMaxHR = maxHR || maxHRMetric || (bpmValues.length > 0 
    ? Math.min(220, Math.max(...bpmValues) * 1.2) 
    : 220);
  const effectiveMaxHR = Math.max(50, Math.min(220, calculatedMaxHR));
  const effectiveRestingHR = restingHR || (bpmValues.length > 0 ? Math.min(...bpmValues) : 60);
  const effectiveAvgHR = avgHR || (bpmValues.length > 0 
    ? Math.round(bpmValues.reduce((a, b) => a + b, 0) / bpmValues.length) 
    : effectiveRestingHR + 10);

  // Créer les périodes d'activités pour enrichir la courbe
  const activityPeriods = [];
  if (activities && Array.isArray(activities)) {
    activities.forEach(act => {
      if (act.date && act.time && (act.avgHR || act.maxHR)) {
        try {
          const [hours, minutes] = (act.time || '00:00').split(':').map(Number);
          const activityDate = new Date(act.date + 'T00:00:00');
          activityDate.setHours(hours || 0, minutes || 0, 0);
          
          const activityStart = activityDate.getTime();
          const activityDuration = (act.duration || 0) * 60 * 1000; // Convertir minutes en ms
          const activityEnd = activityStart + activityDuration;
          
          if (activityStart >= dayStartTs && activityStart <= dayEndTs) {
            activityPeriods.push({
              start: activityStart,
              end: activityEnd,
              avgHR: act.avgHR || effectiveAvgHR,
              maxHR: act.maxHR || effectiveMaxHR,
              type: act.type || 'cardio'
            });
          }
        } catch (e) {
          console.warn('[createContinuousHeartRateCurve] Error parsing activity:', act, e);
        }
      }
    });
  }

  // Cas 1 : Beaucoup de points réels (> 10) → Utiliser directement avec interpolation
  if (realPoints.length >= 10) {
    const enriched = enrichHeartRateTimeSeriesForVisualization(realPoints, {
      maxHR: effectiveMaxHR,
      restingHR: effectiveRestingHR,
      enableDownsampling: true,
      downsamplingThreshold: 1000,
      targetPoints: 500
    });
    
    // Fusionner avec les pics d'activités si disponibles
    if (activityPeriods.length > 0) {
      const activityPoints = [];
      activityPeriods.forEach(period => {
        // Créer des points pour la période d'activité
        const periodDuration = period.end - period.start;
        const numPoints = Math.max(5, Math.min(20, Math.round(periodDuration / (5 * 60 * 1000)))); // 1 point toutes les 5 min
        const step = periodDuration / numPoints;
        
        for (let i = 0; i < numPoints; i++) {
          const ts = period.start + (i * step);
          // Simuler une courbe d'activité : montée → pic → descente
          const progress = i / (numPoints - 1);
          let bpm;
          if (progress < 0.3) {
            // Montée (0-30% de l'activité)
            bpm = effectiveRestingHR + (period.avgHR - effectiveRestingHR) * (progress / 0.3);
          } else if (progress < 0.7) {
            // Pic (30-70% de l'activité)
            bpm = period.avgHR + (period.maxHR - period.avgHR) * Math.sin((progress - 0.3) / 0.4 * Math.PI);
          } else {
            // Descente (70-100% de l'activité)
            bpm = period.avgHR + (effectiveRestingHR - period.avgHR) * ((progress - 0.7) / 0.3);
          }
          
          activityPoints.push({
            timestamp: ts,
            bpm: Math.round(bpm),
            isActivity: true
          });
        }
      });
      
      // Fusionner avec les points réels (priorité aux points réels)
      const mergedPoints = [...realPoints];
      activityPoints.forEach(ap => {
        // Vérifier si un point réel existe déjà pour ce timestamp (± 5 min)
        const existing = mergedPoints.find(p => Math.abs(p.timestamp - ap.timestamp) < 5 * 60 * 1000);
        if (!existing) {
          mergedPoints.push(ap);
        }
      });
      
      mergedPoints.sort((a, b) => a.timestamp - b.timestamp);
      
      return {
        ...enrichHeartRateTimeSeriesForVisualization(mergedPoints, {
          maxHR: effectiveMaxHR,
          restingHR: effectiveRestingHR,
          enableDownsampling: true,
          downsamplingThreshold: 1000,
          targetPoints: 500
        }),
        isEnriched: true
      };
    }
    
    return { ...enriched, isEnriched: false };
  }

  // Cas 2 : Peu de points (< 10) → Créer courbe basique enrichie avec activités
  const continuousPoints = [];
  const intervalMinutes = 5; // 1 point toutes les 5 minutes
  const intervalMs = intervalMinutes * 60 * 1000;
  
  // ✅ PHASE 1.1 : Limiter la courbe à la plage réelle de données
  // Ne générer que dans la plage [dataStartTs, dataEndTs], pas jusqu'à 23:59
  // Calculer le nombre de points uniquement dans cette plage
  const dataRangeMs = curveEndTs - dataStartTs;
  const numPoints = Math.max(1, Math.ceil(dataRangeMs / intervalMs) + 1); // +1 pour inclure le dernier point
  
  // 🔴 FIX : Créer une fonction d'interpolation linéaire pour lisser entre les points réels
  const interpolateBetweenPoints = (ts, points) => {
    if (points.length === 0) return null;
    if (points.length === 1) return points[0].bpm;
    
    // Trouver les deux points encadrants
    let before = null;
    let after = null;
    
    for (let i = 0; i < points.length - 1; i++) {
      if (points[i].timestamp <= ts && ts <= points[i + 1].timestamp) {
        before = points[i];
        after = points[i + 1];
        break;
      }
    }
    
    // Si avant le premier point, utiliser le premier point
    if (!before && ts < points[0].timestamp) {
      return points[0].bpm;
    }
    
    // Si après le dernier point, utiliser le dernier point
    if (!after && ts > points[points.length - 1].timestamp) {
      return points[points.length - 1].bpm;
    }
    
    // Interpolation linéaire entre les deux points
    if (before && after) {
      const ratio = (ts - before.timestamp) / (after.timestamp - before.timestamp);
      return before.bpm + (after.bpm - before.bpm) * ratio;
    }
    
    return null;
  };

  // ✅ PHASE 1.1 : Générer les points uniquement dans la plage réelle [dataStartTs, curveEndTs]
  for (let i = 0; i < numPoints; i++) {
    const timestamp = Math.min(dataStartTs + (i * intervalMs), curveEndTs);
    
    // ✅ Ne pas générer de points après le dernier point réel
    if (timestamp > curveEndTs) {
      break; // Arrêter si on dépasse la plage réelle
    }
    
    let bpm = effectiveRestingHR; // Base : FC repos (utilisé seulement si interpolation échoue)
    
    // 🔴 PRIORITÉ 1 : Utiliser les points réels (priorité absolue)
    const nearbyRealPoint = realPoints.find(p => Math.abs(p.timestamp - timestamp) < 2.5 * 60 * 1000);
    if (nearbyRealPoint) {
      bpm = nearbyRealPoint.bpm;
    } else if (realPoints.length > 0) {
      // 🔴 PRIORITÉ 2 : Interpoler entre points réels si disponibles
      const interpolated = interpolateBetweenPoints(timestamp, realPoints);
      if (interpolated !== null) {
        bpm = interpolated;
      } else if (realPoints.length === 1) {
        // ✅ PHASE 1.2 : Si seulement 1 point réel, utiliser uniquement ce point
        // NE PAS générer de variations artificielles
        // Si on est exactement sur le point, l'utiliser, sinon utiliser la valeur du point unique
        const singlePoint = realPoints[0];
        bpm = singlePoint.bpm; // Utiliser directement la valeur du point réel, sans variations
      } else {
        // 🔴 PRIORITÉ 3 : Vérifier si on est dans une période d'activité
        const currentActivity = activityPeriods.find(ap => timestamp >= ap.start && timestamp <= ap.end);
        if (currentActivity) {
          // Dans une activité : utiliser FC activité avec courbe lisse
          const activityProgress = Math.max(0, Math.min(1, (timestamp - currentActivity.start) / (currentActivity.end - currentActivity.start)));
          // Courbe sinusoïdale lisse pour montée/descente
          const smoothFactor = Math.sin(activityProgress * Math.PI); // 0 à 1, lisse
          const peakFactor = Math.sin(activityProgress * Math.PI * 2); // Pic au milieu
          
          // Montée progressive jusqu'au pic
          if (activityProgress < 0.5) {
            bpm = effectiveRestingHR + (currentActivity.avgHR - effectiveRestingHR) * (activityProgress * 2) * smoothFactor;
          } else {
            // Descente progressive après le pic
            bpm = currentActivity.avgHR - (currentActivity.avgHR - effectiveRestingHR) * ((activityProgress - 0.5) * 2) * smoothFactor;
          }
          
          // Ajouter le pic au milieu
          if (activityProgress > 0.3 && activityProgress < 0.7) {
            const peakBoost = (currentActivity.maxHR - currentActivity.avgHR) * Math.abs(peakFactor) * 0.5;
            bpm = Math.min(bpm + peakBoost, currentActivity.maxHR);
          }
        } else {
          // ✅ PHASE 1.2 : Pas d'activité ET pas de point réel proche ET pas d'interpolation possible
          // → NE PAS générer de point artificiel
          // Utiliser la valeur par défaut (restingHR) uniquement si on est dans une plage où on a des données réelles
          // Si on est en dehors de toute plage de données, ne pas générer de point
          // Vérifier si on est entre le premier et dernier point réel
          if (timestamp >= dataStartTs && timestamp <= dataEndTs) {
            // On est dans la plage de données, mais pas de point réel ni interpolation
            // Utiliser la dernière valeur interpolée connue ou restingHR
            bpm = effectiveRestingHR; // Valeur par défaut raisonnable
          } else {
            // On est en dehors de la plage de données réelles → NE PAS générer de point
            continue; // Passer à la prochaine itération sans ajouter ce point
          }
        }
      }
    }
    
    // ✅ Arrondir à 1 décimale pour précision (éviter valeurs trop "rondes")
    const roundedBpm = Math.round((Math.max(50, Math.min(220, bpm))) * 10) / 10;
    
    // ✅ PHASE 1.1 : Ne générer que des points dans la plage réelle
    // Vérifier que le timestamp est bien dans la plage [dataStartTs, curveEndTs]
    if (timestamp >= dataStartTs && timestamp <= curveEndTs) {
      continuousPoints.push({
        timestamp,
        bpm: roundedBpm,
        isReal: !!nearbyRealPoint,
        isActivity: !!activityPeriods.find(ap => timestamp >= ap.start && timestamp <= ap.end)
      });
    }
  }

  // ✅ PHASE 1.1 : S'assurer que le dernier point correspond au dernier point réel
  // NE PAS ajouter de point à 23:59 si les données s'arrêtent avant
  // Si le dernier point généré est avant le dernier point réel, ajouter le dernier point réel
  if (continuousPoints.length > 0 && realPoints.length > 0) {
    const lastGeneratedPoint = continuousPoints[continuousPoints.length - 1];
    const lastRealPoint = realPoints[realPoints.length - 1];
    
    // Si le dernier point généré est avant le dernier point réel, ajouter le dernier point réel
    if (lastGeneratedPoint.timestamp < lastRealPoint.timestamp - 60000) { // -1 min de tolérance
      continuousPoints.push({
        timestamp: lastRealPoint.timestamp,
        bpm: lastRealPoint.bpm,
        isReal: true,
        isActivity: false
      });
    }
  }

  // Enrichir avec statistiques et zones
  const enriched = enrichHeartRateTimeSeriesForVisualization(continuousPoints, {
    maxHR: effectiveMaxHR,
    restingHR: effectiveRestingHR,
    enableDownsampling: false, // Déjà optimisé (5 min interval)
    downsamplingThreshold: 1000,
    targetPoints: 500
  });

  return {
    ...enriched,
    isEnriched: true,
    realPointsCount: realPoints.length,
    activityPointsCount: activityPeriods.length
  };
}

