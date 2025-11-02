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

