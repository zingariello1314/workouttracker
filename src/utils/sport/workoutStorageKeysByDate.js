/**
 * Index O(n) des clés de stockage workout par date (YYYY-MM-DD).
 * Évite le parcours global des maps à chaque cellule du calendrier.
 */

const YMD_RE = /^(\d{4}-\d{2}-\d{2})_/;

/**
 * @param {object|null|undefined} obj
 * @param {Map<string, string[]>} into
 */
function absorbKeys(obj, into) {
  if (!obj || typeof obj !== 'object') return;
  for (const key of Object.keys(obj)) {
    const m = YMD_RE.exec(key);
    if (!m) continue;
    const ymd = m[1];
    const list = into.get(ymd);
    if (list) list.push(key);
    else into.set(ymd, [key]);
  }
}

/**
 * @param {object|null|undefined} workoutData
 * @returns {{
 *   repsKeysByDate: Map<string, string[]>,
 *   checkedKeysByDate: Map<string, string[]>,
 *   allKeysByDate: Map<string, string[]>,
 *   hasCheckedOnDate: (ymd: string) => boolean,
 *   orphanExerciseIdsForDate: (ymd: string, plannedIds: Set<string>) => number[]
 * }}
 */
export function indexWorkoutStorageKeysByDate(workoutData) {
  const repsKeysByDate = new Map();
  const checkedKeysByDate = new Map();
  const allKeysByDate = new Map();

  absorbKeys(workoutData?.reps, repsKeysByDate);
  absorbKeys(workoutData?.checkedExercises, checkedKeysByDate);

  const mergeDate = (ymd) => {
    const set = new Set([
      ...(repsKeysByDate.get(ymd) || []),
      ...(checkedKeysByDate.get(ymd) || [])
    ]);
    allKeysByDate.set(ymd, [...set]);
  };
  for (const ymd of new Set([...repsKeysByDate.keys(), ...checkedKeysByDate.keys()])) {
    mergeDate(ymd);
  }

  const checked = workoutData?.checkedExercises || {};

  return {
    repsKeysByDate,
    checkedKeysByDate,
    allKeysByDate,
    hasCheckedOnDate(ymd) {
      const keys = checkedKeysByDate.get(ymd);
      if (!keys || keys.length === 0) return false;
      for (let i = 0; i < keys.length; i += 1) {
        if (checked[keys[i]]) return true;
      }
      return false;
    },
    orphanExerciseIdsForDate(ymd, plannedIds) {
      const keys = allKeysByDate.get(ymd) || [];
      const out = [];
      const seen = new Set();
      for (let i = 0; i < keys.length; i += 1) {
        const rest = keys[i].slice(ymd.length + 1);
        const match = rest.match(/^(\d+)(?:_semaineA|_semaineB)?$/);
        if (!match) continue;
        const id = parseInt(match[1], 10);
        const idStr = String(id);
        if (plannedIds.has(idStr) || seen.has(idStr)) continue;
        seen.add(idStr);
        out.push(id);
      }
      return out;
    }
  };
}

/**
 * Index des sessions endurance par date calendaire (une passe).
 * @param {object|null|undefined} workoutData
 * @param {(session: object, overrides: object) => string|null} resolveCalendarDate
 * @param {(session: object) => boolean} isMock
 * @param {(session: object) => boolean} shouldExcludeRunning
 * @returns {Map<string, Array<{ activityType: string, session: object }>>}
 */
export function indexEnduranceSessionsByDate(
  workoutData,
  resolveCalendarDate,
  isMock,
  shouldExcludeRunning
) {
  const byDate = new Map();
  const sessionsMap = workoutData?.enduranceData?.sessions || {};
  const overrides =
    workoutData?.garminActivityDateOverrides && typeof workoutData.garminActivityDateOverrides === 'object'
      ? workoutData.garminActivityDateOverrides
      : {};

  for (const [activityType, sessions] of Object.entries(sessionsMap)) {
    if (!Array.isArray(sessions)) continue;
    for (let i = 0; i < sessions.length; i += 1) {
      const session = sessions[i];
      if (typeof isMock === 'function' && isMock(session)) continue;
      if (
        activityType === 'running' &&
        typeof shouldExcludeRunning === 'function' &&
        shouldExcludeRunning(session)
      ) {
        continue;
      }
      const calendarDate =
        typeof resolveCalendarDate === 'function'
          ? resolveCalendarDate(session, overrides)
          : session?.date || null;
      if (!calendarDate) continue;
      const list = byDate.get(calendarDate);
      const row = { activityType, session };
      if (list) list.push(row);
      else byDate.set(calendarDate, [row]);
    }
  }
  return byDate;
}
