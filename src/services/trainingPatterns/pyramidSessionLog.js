/**
 * Journal des séances pyramide complétées (Aujourd’hui : coche avec plan actif).
 * @module services/trainingPatterns/pyramidSessionLog
 */

/**
 * @param {object} data
 * @param {{
 *   dateStr: string,
 *   exerciseId: string|number,
 *   exerciseName?: string,
 *   repsDone: number,
 *   plannedTotalReps: number,
 *   patternType: string,
 *   programId?: string|null,
 *   source?: string
 * }} entry
 */
export function appendPyramidSessionLogEntry(data, entry) {
  const prev = Array.isArray(data?.pyramidSessionLog) ? data.pyramidSessionLog : [];
  const id = `pylog_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const row = {
    id,
    dateStr: String(entry.dateStr || '').slice(0, 10),
    exerciseId: entry.exerciseId,
    exerciseName: entry.exerciseName != null ? String(entry.exerciseName) : '',
    repsDone: Math.max(0, Math.round(Number(entry.repsDone) || 0)),
    plannedTotalReps: Math.max(0, Math.round(Number(entry.plannedTotalReps) || 0)),
    patternType: String(entry.patternType || ''),
    programId: entry.programId != null ? String(entry.programId) : null,
    source: String(entry.source || 'today'),
    loggedAt: new Date().toISOString()
  };
  return {
    ...data,
    pyramidSessionLog: [...prev, row]
  };
}
