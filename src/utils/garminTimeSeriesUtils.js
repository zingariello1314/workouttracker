/**
 * 🔴 FIX #24: Utilitaires pour décompresser les time series côté frontend
 * Gère la décompression delta encoding si nécessaire
 */

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
  if (!compressed[1] || !compressed[1].d_ts && !compressed[1].d_val) {
    return compressed;
  }

  // Déterminer les clés pour value et timestamp
  const first = compressed[0];
  const valueKey = first.bpm !== undefined ? 'bpm' : 
                   first.value !== undefined ? 'value' : 
                   first.level !== undefined ? 'level' : 'value';
  const timestampKey = 'timestamp';

  const decompressed = [{ ...first }];

  let prevTs = first[timestampKey] || 0;
  let prevVal = first[valueKey] || 0;

  for (let i = 1; i < compressed.length; i++) {
    const delta = compressed[i];

    // Si c'est un delta, reconstruire
    if (delta.d_ts !== undefined && delta.d_val !== undefined) {
      const currTs = prevTs + delta.d_ts;
      const currVal = prevVal + delta.d_val;

      const point = {
        [timestampKey]: currTs,
        [valueKey]: currVal
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
    } else {
      // Point complet (ne devrait pas arriver après le premier)
      decompressed.push(delta);
      prevTs = delta[timestampKey] || prevTs;
      prevVal = delta[valueKey] || prevVal;
    }
  }

  return decompressed;
}

/**
 * Prépare une time series pour affichage (décompresse si nécessaire)
 * @param {Array} timeSeries - Time series (peut être compressée ou non)
 * @returns {Array} Time series prête pour affichage
 */
export function prepareTimeSeriesForDisplay(timeSeries) {
  if (!timeSeries || !Array.isArray(timeSeries) || timeSeries.length === 0) {
    return [];
  }

  // Vérifier si compressée (si le 2e élément a d_ts et d_val)
  const isCompressed = timeSeries.length > 1 && 
                       timeSeries[1] && 
                       (timeSeries[1].d_ts !== undefined || timeSeries[1].d_val !== undefined);

  if (isCompressed) {
    return decompressTimeSeriesDelta(timeSeries);
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

  // Trier et nettoyer les données
  const sortedTimeSeries = timeSeries
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

  // Calculer la couverture (pourcentage du temps avec données)
  const firstTimestamp = sortedTimeSeries[0].timestamp;
  const lastTimestamp = sortedTimeSeries[sortedTimeSeries.length - 1].timestamp;
  const totalDuration = lastTimestamp - firstTimestamp;
  const dataDuration = totalDuration - gaps.reduce((sum, gap) => sum + gap.duration * 1000, 0);
  stats.coverage = totalDuration > 0 ? Math.round((dataDuration / totalDuration) * 100) : 0;

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

