/**
 * Signaux utilisateur pour suggestions pyramide (historique reps + records).
 * @module services/trainingPatterns/pyramidUserSignals
 */

/**
 * Parse "5×4", "4 x 10-12", "3X8" → { sets, repsPerSet } (range → moyenne arrondie).
 * @param {string|null|undefined} seriesText
 * @returns {{ sets: number, repsPerSet: number }|null}
 */
export function parseStraightSetSeries(seriesText) {
  if (seriesText == null || typeof seriesText !== 'string') return null;
  const s = String(seriesText).trim().replace(/\s+/g, '').replace(/[xX]/g, '×');
  const range = s.match(/^(\d+)×(\d+)-(\d+)$/);
  if (range) {
    const sets = parseInt(range[1], 10);
    const a = parseInt(range[2], 10);
    const b = parseInt(range[3], 10);
    const repsPerSet = Math.round((a + b) / 2);
    if (sets > 0 && repsPerSet > 0) return { sets, repsPerSet };
    return null;
  }
  const fixed = s.match(/^(\d+)×(\d+)$/);
  if (fixed) {
    const sets = parseInt(fixed[1], 10);
    const repsPerSet = parseInt(fixed[2], 10);
    if (sets > 0 && repsPerSet > 0) return { sets, repsPerSet };
  }
  return null;
}

/**
 * Somme les reps enregistrées pour un exercice sur une date (toutes clés maison / salle A-B).
 * @param {Record<string, unknown>} reps
 * @param {string} dateStr YYYY-MM-DD
 * @param {string|number} exerciseId
 */
export function sumRepsForExerciseOnDate(reps, dateStr, exerciseId) {
  if (!reps || typeof reps !== 'object') return 0;
  const id = String(exerciseId);
  const esc = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`^${dateStr}_${esc}(?:_|$)`);
  let sum = 0;
  for (const [key, val] of Object.entries(reps)) {
    if (!re.test(key)) continue;
    const n = Number(val);
    if (Number.isFinite(n) && n > 0) sum += n;
  }
  return Math.round(sum);
}

/**
 * Agrège le volume total par jour où l'exercice a été fait (reps > 0).
 * @param {Record<string, unknown>} reps
 * @param {string|number} exerciseId
 * @param {{ maxDays?: number }} [opts]
 * @returns {{ totals: number[], meanPerSession: number|null, stdSample: number|null, sessionDates: string[] }}
 */
export function collectRecentSessionTotalsForExercise(reps, exerciseId, opts = {}) {
  const maxDays = opts.maxDays != null ? Math.max(7, Math.floor(opts.maxDays)) : 120;
  const id = String(exerciseId);
  const esc = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`^(\\d{4}-\\d{2}-\\d{2})_${esc}(?:_|$)`);

  const byDate = new Map();
  if (reps && typeof reps === 'object') {
    for (const [key, val] of Object.entries(reps)) {
      const m = key.match(re);
      if (!m) continue;
      const n = Number(val);
      if (!Number.isFinite(n) || n <= 0) continue;
      const d = m[1];
      byDate.set(d, (byDate.get(d) || 0) + n);
    }
  }

  const sessionDates = [...byDate.keys()].sort((a, b) => b.localeCompare(a)).slice(0, maxDays);
  const totals = sessionDates.map((d) => byDate.get(d) || 0).filter((t) => t > 0);

  if (totals.length === 0) {
    return { totals: [], meanPerSession: null, stdSample: null, sessionDates: [] };
  }

  const meanPerSession = totals.reduce((a, b) => a + b, 0) / totals.length;
  const variance =
    totals.length > 1
      ? totals.reduce((acc, t) => acc + (t - meanPerSession) ** 2, 0) / (totals.length - 1)
      : 0;
  const stdSample = variance > 0 ? Math.sqrt(variance) : 0;

  return {
    totals,
    meanPerSession: Math.round(meanPerSession * 10) / 10,
    stdSample: Math.round(stdSample * 10) / 10,
    sessionDates
  };
}

/**
 * Max reps « performance » pour un exerciseId (onglet Performances).
 * @param {Array<{ exerciseId?: string|number, reps?: number }>} records
 * @param {string|number} exerciseId
 */
export function getObservedMaxRepsFromRecords(records, exerciseId) {
  if (!Array.isArray(records)) return null;
  const id = String(exerciseId);
  let best = null;
  for (const r of records) {
    if (String(r.exerciseId) !== id) continue;
    if (r.performanceType && r.performanceType !== 'reps') continue;
    const n = Number(r.reps);
    if (!Number.isFinite(n) || n <= 0) continue;
    if (best == null || n > best) best = Math.floor(n);
  }
  return best;
}

/**
 * Max observé : d’abord par id programme, sinon par nom d’exercice (ex. id banque `db_*` vs id programme 101).
 * @param {Array<Record<string, unknown>>} records
 * @param {{ programExerciseId: string|number, exerciseName?: string }} ctx
 */
export function resolveObservedMaxReps(records, ctx) {
  const direct = getObservedMaxRepsFromRecords(records, ctx?.programExerciseId);
  if (direct != null) return direct;
  const name = String(ctx?.exerciseName || '').toLowerCase().trim();
  if (!name || !Array.isArray(records)) return null;
  let best = null;
  for (const r of records) {
    const rn = String(r.exerciseName || '').toLowerCase().trim();
    if (rn !== name) continue;
    if (r.performanceType && r.performanceType !== 'reps') continue;
    const n = Number(r.reps);
    if (!Number.isFinite(n) || n <= 0) continue;
    if (best == null || n > best) best = Math.floor(n);
  }
  return best;
}

/**
 * Exercices du programme intégré (ids numériques + séries) pour caler pyramides sur Aujourd’hui.
 * @param {Record<string, unknown>} workoutProgramRoot
 */
export function collectProgramExercises(workoutProgramRoot) {
  const map = new Map();
  const add = (ex) => {
    if (!ex || typeof ex !== 'object' || ex.id == null) return;
    const id = Number(ex.id);
    if (!Number.isFinite(id) || id <= 0) return;
    if (!map.has(id)) {
      map.set(id, {
        id,
        name: ex.name || ex.nom || `Exercice ${id}`,
        series: ex.series != null ? String(ex.series) : ''
      });
    }
  };
  const root = workoutProgramRoot && typeof workoutProgramRoot === 'object' ? workoutProgramRoot : {};
  for (const day of Object.values(root)) {
    if (!day || typeof day !== 'object') continue;
    if (Array.isArray(day.exercices)) day.exercices.forEach(add);
    if (day.salleVariants && typeof day.salleVariants === 'object') {
      for (const v of Object.values(day.salleVariants)) {
        if (v && Array.isArray(v.exercices)) v.exercices.forEach(add);
      }
    }
  }
  return [...map.values()].sort((a, b) => String(a.name).localeCompare(String(b.name), 'fr'));
}

/**
 * Exercices issus d’un programme personnalisé actif (`schedule.*.exercises`).
 * @param {Record<string, unknown>|null|undefined} activeProgram
 */
export function collectCustomProgramExercises(activeProgram) {
  const map = new Map();
  const add = (ex) => {
    if (!ex || typeof ex !== 'object' || ex.id == null) return;
    const id = Number(ex.id);
    if (!Number.isFinite(id) || id <= 0) return;
    if (!map.has(id)) {
      map.set(id, {
        id,
        name: ex.name || `Exercice ${id}`,
        series: ex.series != null ? String(ex.series) : ''
      });
    }
  };
  const sch = activeProgram?.schedule;
  if (!sch || typeof sch !== 'object') return [];
  for (const day of Object.values(sch)) {
    if (!day || typeof day !== 'object') continue;
    if (Array.isArray(day.exercises)) day.exercises.forEach(add);
    if (day.salleVariants && typeof day.salleVariants === 'object') {
      for (const v of Object.values(day.salleVariants)) {
        if (v && Array.isArray(v.exercises)) v.exercises.forEach(add);
      }
    }
  }
  return [...map.values()].sort((a, b) => String(a.name).localeCompare(String(b.name), 'fr'));
}

/**
 * Fréquence hebdomadaire approximative (sessions avec reps > 0 sur fenêtre glissante).
 * @param {Record<string, unknown>} reps
 * @param {string|number} exerciseId
 * @param {{ windowDays?: number }} [opts]
 */
export function estimateSessionsPerWeek(reps, exerciseId, opts = {}) {
  const windowDays = opts.windowDays != null ? Math.max(14, Math.floor(opts.windowDays)) : 42;
  const { sessionDates } = collectRecentSessionTotalsForExercise(reps, exerciseId, { maxDays: windowDays });
  const n = sessionDates.length;
  if (n === 0) return null;
  const perWeek = (n / windowDays) * 7;
  return Math.round(perWeek * 10) / 10;
}
