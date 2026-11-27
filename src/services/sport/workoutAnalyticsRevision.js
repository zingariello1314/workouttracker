/**
 * Empreinte des champs analytiques workout (clé de cache / révision Worker).
 * Couvre les entrées qui changent le résultat métier même si le nombre de clés reste identique.
 */

function mixStr(h, s) {
  let x = h | 0;
  const str = String(s || '');
  for (let i = 0; i < str.length; i += 1) {
    x = (Math.imul(x, 31) + str.charCodeAt(i)) | 0;
  }
  return x;
}

function mixMap(h, obj, valueMode = 'truthy') {
  if (!obj || typeof obj !== 'object') return mixStr(h, '0');
  const keys = Object.keys(obj);
  let x = mixStr(h, keys.length);
  for (let i = 0; i < keys.length; i += 1) {
    const k = keys[i];
    x = mixStr(x, k);
    const v = obj[k];
    if (valueMode === 'truthy') {
      if (v) x = (x + 1) | 0;
    } else if (valueMode === 'number') {
      const n = Number(v);
      if (Number.isFinite(n)) x = (x + Math.round(n * 1000)) | 0;
    } else if (valueMode === 'raw') {
      if (Array.isArray(v)) {
        x = mixStr(x, v.length);
        for (let j = 0; j < v.length; j += 1) x = mixStr(x, v[j]);
      } else if (v && typeof v === 'object') {
        x = mixStr(x, JSON.stringify(v));
      } else {
        x = mixStr(x, v);
      }
    }
  }
  return x;
}

function mixNestedDates(h, obj) {
  if (!obj || typeof obj !== 'object') return mixStr(h, '0');
  const keys = Object.keys(obj);
  let x = mixStr(h, keys.length);
  for (let i = 0; i < keys.length; i += 1) {
    const k = keys[i];
    x = mixStr(x, k);
    const day = obj[k];
    if (!day || typeof day !== 'object') continue;
    if (Array.isArray(day.addedExercises)) x = mixStr(x, day.addedExercises.length);
    if (Array.isArray(day.suppressedExerciseIds)) {
      x = mixStr(x, day.suppressedExerciseIds.join(','));
    }
    if (day.seriesOverrides && typeof day.seriesOverrides === 'object') {
      x = mixMap(x, day.seriesOverrides, 'raw');
    }
  }
  return x;
}

/**
 * @param {object|null|undefined} data
 * @returns {string}
 */
export function fingerprintWorkoutAnalytics(data) {
  if (!data || typeof data !== 'object') return 'empty';
  let h = 0x811c9dc5;
  h = mixMap(h, data.reps, 'number');
  h = mixMap(h, data.checkedExercises, 'truthy');
  h = mixMap(h, data.checkedStretches, 'truthy');
  h = mixMap(h, data.exerciseIntensityCoeffs, 'number');
  h = mixMap(h, data.exerciseWeights, 'raw');
  h = mixMap(h, data.exerciseWeightPerArm, 'truthy');
  h = mixMap(h, data.exerciseSetWeights, 'raw');
  h = mixMap(h, data.exerciseSetLogs, 'raw');
  h = mixMap(h, data.exerciseMarkedWeighted, 'truthy');
  h = mixMap(h, data.exerciseSeriesOverrides, 'raw');
  h = mixNestedDates(h, data.dailyVariations);
  h = mixMap(h, data.dayJustifications, 'raw');
  h = mixMap(h, data.restDaySwaps, 'raw');
  h = mixMap(h, data.garminActivityDateOverrides, 'raw');

  const endo = data.enduranceData || {};
  const sessions = endo.sessions || {};
  for (const [type, list] of Object.entries(sessions)) {
    h = mixStr(h, type);
    if (!Array.isArray(list)) {
      h = mixStr(h, 0);
      continue;
    }
    h = mixStr(h, list.length);
    // Contenu borné : id/date/count pour invalider sans cloner tout l’historique
    for (let i = 0; i < list.length; i += 1) {
      const s = list[i] || {};
      h = mixStr(h, s.id ?? s.sessionId ?? i);
      h = mixStr(h, s.date || '');
      h = mixStr(h, s.count ?? s.reps ?? s.distance ?? '');
    }
  }
  h = mixStr(h, Array.isArray(endo.challenges) ? endo.challenges.length : 0);
  return `w${(h >>> 0).toString(16)}`;
}
