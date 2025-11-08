/**
 * ✅ PHASE 1.1 : Module de fusion intelligente des données Garmin
 * 
 * Ce module contient toute la logique de fusion des données Garmin :
 * - Fusion intelligente TimeSeries (heartRate, bodyBattery, stress, respiration)
 * - Fusion métriques simples (steps, distance, floors, calories)
 * - Déduplication TimeSeries
 * 
 * La fusion est "intelligente" car elle :
 * - Préserve les données existantes si nouvelles incomplètes
 * - Compare les plages temporelles pour décider quelle version garder
 * - Fusionne les points dans les plages communes
 * - Gère correctement les données compressées (delta encoding)
 * 
 * @module garminDataFusion
 */

import { prepareTimeSeriesForDisplay } from '../utils/garminTimeSeriesUtils';
import { getDecompressed, getTimeSeriesMetadata } from '../utils/garminTimeSeriesCache';
import { decompressTimeSeriesDelta } from '../utils/garminTimeSeriesUtils';

// ==================== DÉDUPLICATION TIME SERIES ====================

/**
 * Déduplique une time series en supprimant les doublons basés sur timestamp
 * 
 * ⚠️ IMPORTANT : Ne déduplique PAS les time series compressées (delta encoding)
 * car les deltas n'ont pas de timestamp et seraient filtrés
 * 
 * @param {Array} series - Time series à dédupliquer
 * @returns {Array} Time series dédupliquée et triée
 * 
 * @example
 * const series = [
 *   { timestamp: 1000, bpm: 60 },
 *   { timestamp: 1000, bpm: 61 }, // Doublon
 *   { timestamp: 2000, bpm: 62 }
 * ];
 * deduplicateTimeSeries(series) // [{ timestamp: 1000, bpm: 60 }, { timestamp: 2000, bpm: 62 }]
 */
export const deduplicateTimeSeries = (series) => {
  if (!Array.isArray(series) || series.length === 0) return [];
  
  // Vérifier si la time series est compressée (delta encoding)
  // Les deltas n'ont pas de timestamp, donc ils seraient filtrés
  const isCompressed = series.length > 1 && series[1] && 
                      (series[1].d_ts !== undefined || series[1].d_val !== undefined);
  
  if (isCompressed) {
    // Garder la time series compressée telle quelle
    return series;
  }
  
  // Sinon, dédupliquer normalement
  const seen = new Map();
  return series
    .filter(ts => {
      if (!ts || !ts.timestamp) return false;
      const key = ts.timestamp;
      if (seen.has(key)) return false;
      seen.set(key, true);
      return true;
    })
    .sort((a, b) => {
      // Trier par timestamp (gérer string et number)
      const tsA = typeof a.timestamp === 'string' ? new Date(a.timestamp).getTime() : a.timestamp;
      const tsB = typeof b.timestamp === 'string' ? new Date(b.timestamp).getTime() : b.timestamp;
      return tsA - tsB;
    });
};

// ==================== FUSION INTELLIGENTE TIME SERIES ====================

/**
 * Compare deux plages temporelles pour déterminer la stratégie de fusion
 * 
 * @param {number} newFirst - Timestamp du premier point des nouvelles données
 * @param {number} newLast - Timestamp du dernier point des nouvelles données
 * @param {number} existingFirst - Timestamp du premier point des données existantes
 * @param {number} existingLast - Timestamp du dernier point des données existantes
 * @returns {string} Stratégie de fusion : 'replace', 'subset', 'extendAfter', 'extendBefore', 'overlap'
 */
const compareTimeRanges = (newFirst, newLast, existingFirst, existingLast) => {
  // Nouvelles données couvrent plage complète (plus large)
  if (newFirst <= existingFirst && newLast >= existingLast) {
    return 'replace';
  }
  
  // Nouvelles données sont un sous-ensemble
  if (newFirst >= existingFirst && newLast <= existingLast) {
    return 'subset';
  }
  
  // Nouvelles données s'étendent après
  if (newLast > existingLast && newFirst >= existingFirst) {
    return 'extendAfter';
  }
  
  // Nouvelles données s'étendent avant
  if (newFirst < existingFirst && newLast <= existingLast) {
    return 'extendBefore';
  }
  
  // Chevauchement partiel
  return 'overlap';
};

/**
 * Fusionne deux points de time series en gérant les conflits
 * 
 * @param {Object} existingPoint - Point existant
 * @param {Object} newPoint - Nouveau point
 * @param {number} toleranceMs - Tolérance en millisecondes pour considérer comme même point (défaut: 60000 = 1 min)
 * @returns {Object} Point fusionné
 */
const mergeTimeSeriesPoint = (existingPoint, newPoint, toleranceMs = 60000) => {
  // Si timestamps très proches (< tolerance), priorité au nouveau point
  const timeDiff = Math.abs(existingPoint.timestamp - newPoint.timestamp);
  if (timeDiff < toleranceMs) {
    return newPoint; // Nouveau point remplace l'existant
  }
  
  // Sinon, garder les deux (sera géré par l'appelant)
  return null;
};

/**
 * Fusionne intelligemment deux time series en préservant les données existantes si nouvelles incomplètes
 * 
 * Stratégies de fusion :
 * 1. **replace** : Nouvelles données couvrent plage plus large → Remplacement complet
 * 2. **subset** : Nouvelles données sont sous-ensemble → Fusion intelligente (remplacer points dans plage, garder reste)
 * 3. **extendAfter** : Nouvelles données s'étendent après → Fusion (ajouter points nouveaux)
 * 4. **extendBefore** : Nouvelles données s'étendent avant → Fusion (ajouter points nouveaux)
 * 5. **overlap** : Chevauchement partiel → Fusion avec déduplication
 * 
 * ⚠️ IMPORTANT : Cette fonction décompresse les time series pour comparaison, ce qui peut être coûteux.
 * Pour optimiser, considérer ajouter des métadonnées (firstTimestamp, lastTimestamp, count) dans format compressé.
 * 
 * @param {Array} newTimeSeries - Nouvelles time series (peut être compressée)
 * @param {Array} existingTimeSeries - Time series existantes (peut être compressée)
 * @param {string} date - Date pour logging (optionnel)
 * @param {Object} options - Options de fusion
 * @param {number} options.toleranceMs - Tolérance en ms pour considérer même point (défaut: 60000 = 1 min)
 * @param {boolean} options.preserveCompressed - Si true, préserver format compressé si possible (défaut: false)
 * @returns {Array} Time series fusionnée
 * 
 * @example
 * const merged = mergeTimeSeriesIntelligently(
 *   newData.heartRate.timeSeries,
 *   existingData.heartRate.timeSeries,
 *   '2025-01-15'
 * );
 */
export const mergeTimeSeriesIntelligently = (
  newTimeSeries,
  existingTimeSeries,
  date = null,
  options = {}
) => {
  const { toleranceMs = 60000, preserveCompressed = false } = options;
  
  // Si pas de nouvelles données, garder les existantes
  if (!newTimeSeries || newTimeSeries.length === 0) {
    return existingTimeSeries || [];
  }
  
  // Si pas de données existantes, utiliser les nouvelles
  if (!existingTimeSeries || existingTimeSeries.length === 0) {
    return newTimeSeries;
  }
  
  // ✅ PHASE 1.4 : Utiliser métadonnées pour comparaison rapide (évite décompression si possible)
  // Essayer d'abord avec métadonnées pour décisions simples
  const newMetadata = getTimeSeriesMetadata(newTimeSeries);
  const existingMetadata = getTimeSeriesMetadata(existingTimeSeries);
  
  // Si les métadonnées suffisent pour décider (ex: nouvelles données complètement après existantes)
  // on peut éviter la décompression complète
  if (newMetadata.firstTimestamp && existingMetadata.lastTimestamp && 
      newMetadata.firstTimestamp > existingMetadata.lastTimestamp) {
    // Nouvelles données complètement après existantes → fusion simple sans décompression
    return deduplicateTimeSeries([
      ...existingTimeSeries,
      ...newTimeSeries
    ]);
  }
  
  // Décompresser pour comparaison (nécessaire pour comparer plages temporelles)
  // ✅ PHASE 1.4 : Utiliser cache pour éviter décompressions redondantes
  const decompressForComparison = (ts) => {
    if (!ts || ts.length === 0) return [];
    // Utiliser cache pour décompression
    return getDecompressed(ts, decompressTimeSeriesDelta);
  };
  
  const newDecompressed = decompressForComparison(newTimeSeries);
  const existingDecompressed = decompressForComparison(existingTimeSeries);
  
  // Si décompression échoue ou donne des résultats vides, fallback sur déduplication simple
  if (newDecompressed.length === 0 || existingDecompressed.length === 0) {
    // Fallback : fusionner normalement (dédupliquer)
    return deduplicateTimeSeries([
      ...existingTimeSeries,
      ...newTimeSeries
    ]);
  }
  
  // Comparer les plages temporelles
  const newFirst = newDecompressed[0].timestamp;
  const newLast = newDecompressed[newDecompressed.length - 1].timestamp;
  const existingFirst = existingDecompressed[0].timestamp;
  const existingLast = existingDecompressed[existingDecompressed.length - 1].timestamp;
  
  const strategy = compareTimeRanges(newFirst, newLast, existingFirst, existingLast);
  
  // Stratégie 1 : Remplacement complet (nouvelles couvrent plage plus large)
  if (strategy === 'replace') {
    if (date) {
      console.log(`[GarminDataFusion] Nouvelles données couvrent plage complète (${new Date(newFirst).toLocaleTimeString('fr-FR')} → ${new Date(newLast).toLocaleTimeString('fr-FR')}), remplacement pour ${date}`);
    }
    return newTimeSeries; // Retourner format original (compressé si c'était compressé)
  }
  
  // Stratégie 2 : Sous-ensemble (fusion intelligente)
  if (strategy === 'subset') {
    if (date) {
      console.log(`[GarminDataFusion] Nouvelles données sont un sous-ensemble (${new Date(newFirst).toLocaleTimeString('fr-FR')} → ${new Date(newLast).toLocaleTimeString('fr-FR')}), fusion intelligente pour ${date}`);
    }
    
    // Fusionner : garder existantes, remplacer seulement les points dans la plage des nouvelles
    const merged = [...existingDecompressed];
    
    newDecompressed.forEach(newPoint => {
      const index = merged.findIndex(p => 
        Math.abs(p.timestamp - newPoint.timestamp) < toleranceMs
      );
      if (index >= 0) {
        merged[index] = newPoint; // Remplacer
      } else {
        merged.push(newPoint); // Ajouter si nouveau
      }
    });
    
    merged.sort((a, b) => a.timestamp - b.timestamp);
    
    // ⚠️ NOTE : Retourner décompressé car fusionné (ne pas recompresser ici pour éviter perte)
    // Si besoin de compression, le faire dans le module de sauvegarde
    return merged;
  }
  
  // Stratégie 3 : Extension après (fusion)
  if (strategy === 'extendAfter') {
    if (date) {
      console.log(`[GarminDataFusion] Nouvelles données s'étendent après (${new Date(newLast).toLocaleTimeString('fr-FR')}), fusion pour ${date}`);
    }
    
    const merged = [...existingDecompressed];
    newDecompressed.forEach(newPoint => {
      const index = merged.findIndex(p => 
        Math.abs(p.timestamp - newPoint.timestamp) < toleranceMs
      );
      if (index >= 0) {
        merged[index] = newPoint; // Remplacer si existe
      } else {
        merged.push(newPoint); // Ajouter si nouveau
      }
    });
    
    merged.sort((a, b) => a.timestamp - b.timestamp);
    return merged;
  }
  
  // Stratégie 4 : Extension avant (fusion)
  if (strategy === 'extendBefore') {
    if (date) {
      console.log(`[GarminDataFusion] Nouvelles données s'étendent avant (${new Date(newFirst).toLocaleTimeString('fr-FR')}), fusion pour ${date}`);
    }
    
    const merged = [...newDecompressed];
    existingDecompressed.forEach(existingPoint => {
      const index = merged.findIndex(p => 
        Math.abs(p.timestamp - existingPoint.timestamp) < toleranceMs
      );
      if (index >= 0) {
        merged[index] = existingPoint; // Remplacer si existe (priorité existantes)
      } else {
        merged.push(existingPoint); // Ajouter si nouveau
      }
    });
    
    merged.sort((a, b) => a.timestamp - b.timestamp);
    return merged;
  }
  
  // Stratégie 5 : Chevauchement partiel (fallback sur déduplication)
  // Comparer nombre de points décompressés pour décider
  const newIsCompressed = newTimeSeries.length > 1 && newTimeSeries[1] && 
                          (newTimeSeries[1].d_ts !== undefined || newTimeSeries[1].d_val !== undefined);
  const existingIsCompressed = existingTimeSeries.length > 1 && existingTimeSeries[1] && 
                              (existingTimeSeries[1].d_ts !== undefined || existingTimeSeries[1].d_val !== undefined);
  
  // Si nouvelles compressées et existantes non compressées, comparer nombre de points
  if (newIsCompressed && !existingIsCompressed) {
    if (newDecompressed.length > existingDecompressed.length) {
      if (date) {
        console.log(`[GarminDataFusion] Nouvelles données compressées plus complètes (${newDecompressed.length} vs ${existingDecompressed.length} points), remplacement pour ${date}`);
      }
      return newTimeSeries;
    }
  }
  
  // Si existantes compressées et nouvelles non compressées, garder existantes si plus complètes
  if (!newIsCompressed && existingIsCompressed) {
    if (existingDecompressed.length > newDecompressed.length) {
      if (date) {
        console.log(`[GarminDataFusion] Données existantes compressées plus complètes (${existingDecompressed.length} vs ${newDecompressed.length} points), conservation pour ${date}`);
      }
      return existingTimeSeries;
    }
  }
  
  // Fallback : fusionner normalement (dédupliquer)
  return deduplicateTimeSeries([
    ...existingTimeSeries,
    ...newTimeSeries
  ]);
};

// ==================== FUSION MÉTRIQUES SIMPLES ====================

/**
 * Fusionne deux valeurs numériques en privilégiant les nouvelles si > 0 et >= existantes
 * 
 * Logique :
 * - Si nouvelles > 0 ET nouvelles >= existantes → Utiliser nouvelles
 * - Sinon → Garder existantes (évite d'écraser avec 0)
 * 
 * @param {number|undefined|null} newValue - Nouvelle valeur
 * @param {number|undefined|null} existingValue - Valeur existante
 * @param {number} defaultValue - Valeur par défaut si les deux sont vides (défaut: 0)
 * @returns {number} Valeur fusionnée
 * 
 * @example
 * mergeNumericValue(5000, 3000) // 5000 (nouvelles > existantes)
 * mergeNumericValue(0, 5000) // 5000 (évite écraser avec 0)
 * mergeNumericValue(5000, 0) // 5000 (nouvelles valides)
 */
export const mergeNumericValue = (newValue, existingValue, defaultValue = 0) => {
  const newNum = newValue !== undefined && newValue !== null ? Number(newValue) : null;
  const existingNum = existingValue !== undefined && existingValue !== null ? Number(existingValue) : null;
  
  // Si nouvelles valides (> 0) ET >= existantes, utiliser nouvelles
  if (newNum !== null && newNum > 0 && (existingNum === null || newNum >= existingNum)) {
    return newNum;
  }
  
  // Sinon, garder existantes ou default
  return existingNum !== null ? existingNum : defaultValue;
};

/**
 * Fusion dédiée pour la distance quotidienne.
 * Les données issues de Garmin Connect sont considérées comme source de vérité :
 * - Si la nouvelle valeur > 0 → on la conserve, même si elle est inférieure à l'ancienne (cas de corrections).
 * - Sinon → on conserve l'existante.
 * @param {number|undefined|null} newValue
 * @param {number|undefined|null} existingValue
 * @param {string|null} date - Date pour logging (optionnel)
 * @returns {number}
 */
const mergeDistanceValue = (newValue, existingValue, date = null) => {
  const newNum = newValue !== undefined && newValue !== null ? Number(newValue) : null;
  const existingNum = existingValue !== undefined && existingValue !== null ? Number(existingValue) : null;

  if (newNum !== null && isFinite(newNum) && newNum > 0) {
    if (existingNum !== null && isFinite(existingNum) && Math.abs(existingNum - newNum) > 5) {
      try {
        console.warn(`[garminDataFusion] Distance correction detectée pour ${date || 'date inconnue'} : ancienne=${existingNum} km, nouvelle=${newNum} km`);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[garminDataFusion] Distance correction detectée', { date, existingNum, newNum });
      }
    }
    return newNum;
  }

  return existingNum !== null && isFinite(existingNum) ? existingNum : 0;
};

/**
 * Fusionne les métriques simples (steps, distance, floors) en préservant les valeurs existantes
 * 
 * @param {Object} newMetrics - Nouvelles métriques
 * @param {Object} existingMetrics - Métriques existantes
 * @returns {Object} Métriques fusionnées
 */
export const mergeSimpleMetrics = (newMetrics, existingMetrics) => {
  return {
    steps: mergeNumericValue(newMetrics.steps, existingMetrics.steps),
    distance: mergeDistanceValue(newMetrics.distance, existingMetrics.distance, newMetrics.date || null),
    floors: mergeNumericValue(newMetrics.floors, existingMetrics.floors)
  };
};

// ==================== FUSION MÉTRIQUES QUOTIDIENNES COMPLÈTE ====================

/**
 * Fusionne complètement deux métriques quotidiennes en préservant les données existantes
 * 
 * Cette fonction gère :
 * - Métriques simples (steps, distance, floors)
 * - Objets imbriqués (calories, heartRate, bodyBattery, stress, respiration, sleep)
 * - Time series intelligentes (heartRate.timeSeries, bodyBattery.timeSeries, etc.)
 * - Métadonnées (lastSynced)
 * 
 * @param {Object} newMetrics - Nouvelles métriques quotidiennes
 * @param {Object} existingMetrics - Métriques existantes
 * @param {string} date - Date pour logging (optionnel)
 * @returns {Object} Métriques fusionnées
 * 
 * @example
 * const merged = mergeDailyMetrics(
 *   { steps: 5000, heartRate: { timeSeries: [...] } },
 *   { steps: 3000, heartRate: { timeSeries: [...] } },
 *   '2025-01-15'
 * );
 */
export const mergeDailyMetrics = (newMetrics, existingMetrics, date = null) => {
  if (!existingMetrics) {
    // Pas de données existantes, utiliser nouvelles avec lastSynced
    return {
      date: date || newMetrics.date,
      ...newMetrics,
      lastSynced: new Date().toISOString()
    };
  }
  
  // Fusionner métriques simples
  const simpleMetrics = mergeSimpleMetrics(newMetrics, existingMetrics);
  
  // Fusionner objets imbriqués
  const merged = {
    ...existingMetrics,
    ...newMetrics,
    // Remplacer métriques simples avec valeurs fusionnées
    ...simpleMetrics,
    // Fusionner calories (spread simple, nouvelles valeurs remplacent)
    calories: { ...existingMetrics.calories, ...(newMetrics.calories || {}) },
    // Fusionner heartRate avec time series intelligente
    heartRate: {
      ...existingMetrics.heartRate,
      ...(newMetrics.heartRate || {}),
      timeSeries: mergeTimeSeriesIntelligently(
        newMetrics.heartRate?.timeSeries || [],
        existingMetrics.heartRate?.timeSeries || [],
        date
      )
    },
    // Fusionner zones FC (garder nouvelles si présentes)
    heartRateZones: newMetrics.heartRateZones || existingMetrics.heartRateZones,
    // Fusionner métriques performance (garder nouvelles si présentes)
    performance: newMetrics.performance || existingMetrics.performance,
    // Fusionner bodyBattery avec time series
    bodyBattery: newMetrics.bodyBattery ? {
      ...existingMetrics.bodyBattery,
      ...newMetrics.bodyBattery,
      timeSeries: deduplicateTimeSeries([
        ...(existingMetrics.bodyBattery?.timeSeries || []),
        ...(newMetrics.bodyBattery?.timeSeries || [])
      ]),
      current: newMetrics.bodyBattery.current ?? existingMetrics.bodyBattery?.current
    } : existingMetrics.bodyBattery,
    // Fusionner stress avec time series
    stress: newMetrics.stress ? {
      ...existingMetrics.stress,
      ...newMetrics.stress,
      timeSeries: deduplicateTimeSeries([
        ...(existingMetrics.stress?.timeSeries || []),
        ...(newMetrics.stress?.timeSeries || [])
      ]),
      average: newMetrics.stress.average ?? existingMetrics.stress?.average,
      max: newMetrics.stress.max ?? existingMetrics.stress?.max
    } : existingMetrics.stress,
    // Fusionner respiration avec time series
    respiration: newMetrics.respiration ? {
      ...existingMetrics.respiration,
      ...newMetrics.respiration,
      timeSeries: deduplicateTimeSeries([
        ...(existingMetrics.respiration?.timeSeries || []),
        ...(newMetrics.respiration?.timeSeries || [])
      ]),
      awake: newMetrics.respiration.awake ?? existingMetrics.respiration?.awake,
      sleep: newMetrics.respiration.sleep ?? existingMetrics.respiration?.sleep
    } : existingMetrics.respiration,
    // Fusionner sleep (spread simple)
    sleep: { ...existingMetrics.sleep, ...(newMetrics.sleep || {}) },
    // Fusionner intensityMinutes (garder nouvelles si présentes)
    intensityMinutes: newMetrics.intensityMinutes || existingMetrics.intensityMinutes,
    // Mettre à jour lastSynced
    lastSynced: new Date().toISOString()
  };
  
  return merged;
};

