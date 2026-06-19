/**
 * Exercices / circuits les moins cochés — métriques Récap.
 * Compte uniquement les séances réellement effectuées (pas les jours sans entraînement ni le futur).
 */

import DateHelper from '../dateHelper';
import { buildPlannedExerciseListForDateStr } from '../programCompletionBonus';
import { collectCalendarRepKeysForExercise } from '../exerciseKeyGenerator';
import { isExerciseIncludedForSessionDate } from '../programExerciseScheduling';
import { dayHasCheckedWorkout } from '../trainingStreakUtils';
import { getCircuitIdsForDay } from '../circuits/circuitDefinitionUtils';
import {
  isLegacyCircuitHeaderExercise,
  isLegacyCircuitSlotExercise
} from '../circuits/legacyCircuitProgramSync';

const DAY_NAMES = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const RECAP_METRICS_MAX_DAYS = 366;

/** Dates inclusives dans la fenêtre (copie légère pour éviter import circulaire). */
function getWindowDates(window, snapshot) {
  if (!window?.end) return [];
  let dates;
  if (window.start != null) {
    dates = DateHelper.getDateRange(window.start, window.end);
  } else {
    const set = new Set();
    const addFromKeys = (obj) => {
      if (!obj || typeof obj !== 'object') return;
      Object.keys(obj).forEach((k) => {
        const d = k.slice(0, 10);
        if (/^\d{4}-\d{2}-\d{2}$/.test(d)) set.add(d);
      });
    };
    addFromKeys(snapshot?.checkedExercises);
    addFromKeys(snapshot?.reps);
    if (set.size === 0) return [window.end];
    dates = DateHelper.getDateRange([...set].sort()[0], window.end);
  }
  if (dates.length > RECAP_METRICS_MAX_DAYS) {
    dates = dates.slice(dates.length - RECAP_METRICS_MAX_DAYS);
  }
  return dates;
}

function dayNameFromDateStr(dateStr) {
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return DAY_NAMES[d.getDay()];
}

/** Jour où l'utilisateur a fait de la musculation (exo coché ou tour de circuit). */
export function dayHadStrengthActivity(snapshot, dateStr) {
  if (dayHasCheckedWorkout(snapshot, dateStr)) return true;
  const cp = snapshot?.circuitProgress?.[dateStr];
  if (!cp || typeof cp !== 'object') return false;
  return Object.values(cp).some((v) => (Number(v?.roundsCompleted) || 0) > 0);
}

/** Parse `ex_1738…_abc` → date d'ajout approximative. */
export function inferAddedDateFromExerciseId(exercise) {
  const id = String(exercise?.originalId ?? exercise?.id ?? '');
  const m = id.match(/^ex_(\d{10,})_/);
  if (!m) return null;
  const ts = parseInt(m[1], 10);
  if (!Number.isFinite(ts) || ts < 1e12) return null;
  return DateHelper.toYYYYMMDD(new Date(ts));
}

/** Première date où l'exercice apparaît dans reps / coches / poids. */
export function inferExerciseFirstTrackedDate(snapshot, exerciseId) {
  const idStr = String(exerciseId);
  let min = null;
  const scan = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
      if (!/^\d{4}-\d{2}-\d{2}_/.test(key)) continue;
      const rest = key.slice(11);
      if (!rest.startsWith(idStr) && !rest.match(new RegExp(`^${idStr}(?:_|$)`))) continue;
      const d = key.slice(0, 10);
      if (!min || d < min) min = d;
    }
  };
  scan(snapshot?.checkedExercises);
  scan(snapshot?.reps);
  scan(snapshot?.exerciseWeights);
  return min;
}

/** Date à partir de laquelle compter les occurrences planifiées. */
export function getExerciseEligibleSince(exercise, snapshot) {
  if (exercise?.addedToProgramAt && /^\d{4}-\d{2}-\d{2}$/.test(exercise.addedToProgramAt)) {
    return exercise.addedToProgramAt;
  }
  return inferAddedDateFromExerciseId(exercise) || inferExerciseFirstTrackedDate(snapshot, exercise.id) || null;
}

function isExerciseChecked(snapshot, dateStr, exercise) {
  const chk = snapshot?.checkedExercises || {};
  const keys = collectCalendarRepKeysForExercise(dateStr, exercise);
  return keys.some((k) => chk[k] === true);
}

function isCircuitChecked(snapshot, dateStr, def) {
  const progress = snapshot?.circuitProgress?.[dateStr]?.[def.id];
  const rounds = Math.max(0, Number(progress?.roundsCompleted) || 0);
  const target = Math.max(1, Number(def.targetRounds) || 1);
  return rounds >= target;
}

/** Regroupe les exos legacy « circuit abdos » d'une séance. */
function partitionLegacyCircuitGroups(exercises) {
  const standalone = [];
  const groups = [];
  let current = null;

  const flush = () => {
    if (current && current.exercises.length > 0) groups.push(current);
    current = null;
  };

  for (const ex of exercises) {
    if (isLegacyCircuitHeaderExercise(ex)) {
      flush();
      current = {
        key: `legacy_header:${ex.id}`,
        label: ex.name || 'Circuit',
        exercises: []
      };
      continue;
    }
    if (isLegacyCircuitSlotExercise(ex) || String(ex.type || '').toLowerCase().includes('circuit_abdos')) {
      if (!current) {
        current = { key: 'legacy_abdos', label: 'Circuit abdos', exercises: [] };
      }
      current.exercises.push(ex);
      continue;
    }
    flush();
    standalone.push(ex);
  }
  flush();
  return { standalone, groups };
}

function namesMatchCircuitItem(exercise, item) {
  const a = String(exercise.name || '').trim().toLowerCase();
  const b = String(item.exerciseName || item.exerciseKey || '').trim().toLowerCase();
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

/**
 * @returns {Map<string, object>}
 */
function initBucket() {
  return new Map();
}

function bumpBucket(map, key, entry, plannedInc, checkedInc, child = null) {
  const prev = map.get(key) || {
    ...entry,
    planned: 0,
    checked: 0,
    children: []
  };
  prev.planned += plannedInc;
  prev.checked += checkedInc;
  if (child && !prev.children.some((c) => c.id === child.id && c.date === child.date)) {
    prev.children.push(child);
  }
  map.set(key, prev);
}

/**
 * Exercices et circuits les moins cochés (séances effectuées uniquement).
 * @returns {Array<{ id, name, kind: 'exercise'|'circuit', planned, checked, pct, children? }>}
 */
export function computeLeastCheckedExercises(snapshot, window, ctx = {}, limit = 8) {
  const todayYmd = DateHelper.getTodayLocal();
  const dates = getWindowDates(window, snapshot).filter((d) => d <= todayYmd);
  const bucket = initBucket();
  const { getExerciseNameById, activeProgram = null } = ctx;
  const circuitDefinitions = snapshot?.circuitDefinitions || {};

  dates.forEach((dateStr) => {
    if (!dayHadStrengthActivity(snapshot, dateStr)) return;

    const dayName = dayNameFromDateStr(dateStr);
    let exoList = buildPlannedExerciseListForDateStr(dateStr, snapshot, ctx);
    const dv = snapshot?.dailyVariations?.[dateStr];
    const suppressed = new Set(
      Array.isArray(dv?.suppressedExercises)
        ? dv.suppressedExercises.filter((id) => typeof id === 'number' && !Number.isNaN(id))
        : []
    );
    if (suppressed.size > 0) {
      exoList = exoList.filter((ex) => !suppressed.has(ex.id));
    }

    exoList = exoList.filter(
      (ex) =>
        isExerciseIncludedForSessionDate(ex, dateStr) &&
        (!getExerciseEligibleSince(ex, snapshot) || dateStr >= getExerciseEligibleSince(ex, snapshot))
    );

    const skipExerciseIds = new Set();

    if (dayName && activeProgram) {
      const circuitIds = getCircuitIdsForDay(activeProgram, dayName);
      circuitIds.forEach((circuitId) => {
        const def = circuitDefinitions[circuitId];
        if (!def) return;
        const checked = isCircuitChecked(snapshot, dateStr, def) ? 1 : 0;
        bumpBucket(
          bucket,
          `circuit:${circuitId}`,
          {
            id: circuitId,
            name: def.name || 'Circuit',
            kind: 'circuit'
          },
          1,
          checked,
          {
            id: circuitId,
            date: dateStr,
            checked: checked === 1,
            rounds: snapshot?.circuitProgress?.[dateStr]?.[circuitId]?.roundsCompleted ?? 0,
            target: def.targetRounds ?? 1
          }
        );
        exoList.forEach((ex) => {
          if ((def.items || []).some((item) => namesMatchCircuitItem(ex, item))) {
            skipExerciseIds.add(ex.id);
          }
        });
      });
    }

    const remaining = exoList.filter((ex) => !skipExerciseIds.has(ex.id));
    const { standalone, groups } = partitionLegacyCircuitGroups(remaining);

    groups.forEach((group) => {
      const eligible = group.exercises.filter(
        (ex) =>
          isExerciseIncludedForSessionDate(ex, dateStr) &&
          (!getExerciseEligibleSince(ex, snapshot) || dateStr >= getExerciseEligibleSince(ex, snapshot))
      );
      if (eligible.length === 0) return;
      const allChecked = eligible.every((ex) => isExerciseChecked(snapshot, dateStr, ex));
      bumpBucket(
        bucket,
        `legacy:${group.key}`,
        {
          id: group.key,
          name: group.label,
          kind: 'circuit'
        },
        1,
        allChecked ? 1 : 0,
        {
          id: group.key,
          date: dateStr,
          checked: allChecked,
          exercises: eligible.map((ex) => ({
            id: ex.id,
            name: ex.name,
            checked: isExerciseChecked(snapshot, dateStr, ex)
          }))
        }
      );
    });

    standalone.forEach((exercise) => {
      const id = exercise.id;
      const name =
        exercise.name ||
        (typeof getExerciseNameById === 'function' ? getExerciseNameById(id) : null) ||
        `Exercice ${id}`;
      const checked = isExerciseChecked(snapshot, dateStr, exercise) ? 1 : 0;
      bumpBucket(
        bucket,
        `ex:${id}`,
        { id, name, kind: 'exercise' },
        1,
        checked,
        { id, name, date: dateStr, checked: checked === 1 }
      );
    });
  });

  return [...bucket.values()]
    .filter((e) => e.planned >= 2)
    .map((e) => ({
      ...e,
      pct: Math.round((e.checked / e.planned) * 1000) / 10
    }))
    .sort((a, b) => a.pct - b.pct || b.planned - a.planned)
    .slice(0, limit);
}
