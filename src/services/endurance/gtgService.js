/**
 * Grease the Groove (GTG) — logique métier pure.
 * Mini-séries fréquentes à ~40–60 % du max, sans aller à l'échec.
 *
 * @module services/endurance/gtgService
 */

import DateHelper from '../../utils/dateHelper';
import {
  findBankExerciseById,
  GTG_BUILTIN_IDS,
  listGtgBankExercises,
  makeGtgDbExerciseId
} from './gtgExerciseBank';

/** @deprecated utiliser GTG_BUILTIN_IDS */
export const GTG_EXERCISE_IDS = GTG_BUILTIN_IDS;

export const GTG_DEFAULT_MAX = {
  pullups: 4,
  dips: 12,
  pushups: 20
};

/** @type {Array<{ id: string, recordExerciseIds: number[], quizKey: string, namePattern?: RegExp }>} */
export const GTG_EXERCISE_DEFS = [
  {
    id: 'pullups',
    recordExerciseIds: [101, 501],
    quizKey: 'pullupsMax'
  },
  {
    id: 'dips',
    recordExerciseIds: [103, 503],
    quizKey: 'dipsMax'
  },
  {
    id: 'pushups',
    recordExerciseIds: [
      104, 105, 201, 202, 206, 301, 302, 309, 310, 504, 601, 602, 634, 654, 701, 702, 709, 710
    ],
    quizKey: 'pushupsMax',
    namePattern: /pompe/i
  }
];

const DEFAULT_SLOT_TIMES_6 = ['10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];
const DEFAULT_SCHEDULE_FROM = '08:00';
const DEFAULT_SCHEDULE_TO = '20:00';
const DEFAULT_INTERVAL_HOURS = 2;

export function todayYmd() {
  return DateHelper.getTodayLocal?.() || new Date().toISOString().slice(0, 10);
}

export function parseTimeToMinutes(hhmm) {
  const parts = String(hhmm || '0:0').split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

export function formatMinutesToTime(totalMin) {
  const clamped = Math.max(0, Math.min(24 * 60 - 1, Math.round(totalMin)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Créneaux espacés de `intervalHours` entre from et to (inclus), max 12.
 */
export function buildSlotTimesFromInterval(
  from = DEFAULT_SCHEDULE_FROM,
  to = DEFAULT_SCHEDULE_TO,
  intervalHours = DEFAULT_INTERVAL_HOURS
) {
  const start = parseTimeToMinutes(from);
  let end = parseTimeToMinutes(to);
  if (end < start) end = start;
  const step = Math.max(1, Math.round(Number(intervalHours) || 2)) * 60;
  const times = [];
  for (let t = start; t <= end && times.length < 12; t += step) {
    times.push(formatMinutesToTime(t));
  }
  if (times.length === 0) times.push(formatMinutesToTime(start));
  if (times.length === 1 && end > start) times.push(formatMinutesToTime(end));
  return times;
}

export function buildDefaultSlotTimes(count = 6) {
  const n = Math.max(4, Math.min(12, Math.round(Number(count) || 6)));
  if (n === 6) return [...DEFAULT_SLOT_TIMES_6];
  const times = buildSlotTimesFromInterval(DEFAULT_SCHEDULE_FROM, DEFAULT_SCHEDULE_TO, DEFAULT_INTERVAL_HOURS);
  if (times.length === n) return times;
  const start = parseTimeToMinutes(DEFAULT_SCHEDULE_FROM);
  const end = parseTimeToMinutes(DEFAULT_SCHEDULE_TO);
  const step = n > 1 ? (end - start) / (n - 1) : 0;
  return Array.from({ length: n }, (_, i) => formatMinutesToTime(Math.round(start + step * i)));
}

function isValidGtgExerciseId(id, catalog) {
  if (GTG_BUILTIN_IDS.includes(id)) return true;
  if (catalog && catalog[id]) return true;
  if (String(id).startsWith('db_') && findBankExerciseById(id)) return true;
  return false;
}

export function normalizeGtgConfig(raw = {}) {
  const customCatalog =
    raw.customCatalog && typeof raw.customCatalog === 'object' ? { ...raw.customCatalog } : {};
  const selectedIds = Array.isArray(raw.selectedIds)
    ? raw.selectedIds.filter((id) => isValidGtgExerciseId(id, customCatalog))
    : [...GTG_BUILTIN_IDS];
  const safeSelected = selectedIds.length > 0 ? selectedIds : [...GTG_BUILTIN_IDS];
  const scheduleFrom = String(raw.scheduleFrom || DEFAULT_SCHEDULE_FROM).slice(0, 5);
  const scheduleTo = String(raw.scheduleTo || DEFAULT_SCHEDULE_TO).slice(0, 5);
  const intervalHours = Math.max(1, Math.min(4, Math.round(Number(raw.intervalHours) || DEFAULT_INTERVAL_HOURS)));
  const slotMode = raw.slotMode === 'manual' ? 'manual' : 'interval';

  let slotTimes;
  if (slotMode === 'manual' && Array.isArray(raw.slotTimes) && raw.slotTimes.length >= 2) {
    slotTimes = raw.slotTimes.map((tm) => String(tm || '').slice(0, 5));
  } else {
    slotTimes = buildSlotTimesFromInterval(scheduleFrom, scheduleTo, intervalHours);
  }
  const slotsCount = Math.max(2, Math.min(12, slotTimes.length));
  slotTimes = slotTimes.slice(0, 12);
  const manualMax = { ...GTG_DEFAULT_MAX, ...(raw.manualMax || {}) };
  safeSelected.forEach((id) => {
    const v = manualMax[id];
    if (v === '' || v === null || v === undefined) {
      if (!(id in manualMax)) manualMax[id] = null;
      return;
    }
    const n = Math.round(Number(v));
    manualMax[id] = Number.isFinite(n) && n > 0 ? n : null;
  });

  const perExerciseRaw =
    raw.perExercise && typeof raw.perExercise === 'object' ? { ...raw.perExercise } : {};
  const perExercise = {};
  safeSelected.forEach((id) => {
    const pe = perExerciseRaw[id] || {};
    const exFrom = String(pe.scheduleFrom || scheduleFrom).slice(0, 5);
    const exTo = String(pe.scheduleTo || scheduleTo).slice(0, 5);
    const exInterval = Math.max(
      1,
      Math.min(4, Math.round(Number(pe.intervalHours) || intervalHours))
    );
    const exSlotMode = pe.slotMode === 'manual' ? 'manual' : 'interval';
    let exSlotTimes;
    if (exSlotMode === 'manual' && Array.isArray(pe.slotTimes) && pe.slotTimes.length >= 1) {
      exSlotTimes = pe.slotTimes.map((tm) => String(tm || '').slice(0, 5));
    } else {
      exSlotTimes = buildSlotTimesFromInterval(exFrom, exTo, exInterval);
    }
    perExercise[id] = {
      scheduleFrom: exFrom,
      scheduleTo: exTo,
      intervalHours: exInterval,
      slotMode: exSlotMode,
      slotTimes: exSlotTimes.slice(0, 12)
    };
  });

  return {
    selectedIds: safeSelected,
    slotsCount,
    slotTimes,
    manualMax,
    customCatalog,
    scheduleFrom,
    scheduleTo,
    intervalHours,
    slotMode,
    perExercise
  };
}

/** Horaires d'un exercice (propre ou défaut global). */
export function getPerExerciseSchedule(config, exerciseId) {
  const pe = config?.perExercise?.[exerciseId];
  const from = String(pe?.scheduleFrom || config?.scheduleFrom || DEFAULT_SCHEDULE_FROM).slice(0, 5);
  const to = String(pe?.scheduleTo || config?.scheduleTo || DEFAULT_SCHEDULE_TO).slice(0, 5);
  const intervalHours = Math.max(
    1,
    Math.min(4, Math.round(Number(pe?.intervalHours ?? config?.intervalHours) || DEFAULT_INTERVAL_HOURS))
  );
  let slotTimes;
  if (pe?.slotMode === 'manual' && Array.isArray(pe?.slotTimes) && pe.slotTimes.length >= 1) {
    slotTimes = pe.slotTimes.map((t) => String(t || '').slice(0, 5));
  } else {
    slotTimes = buildSlotTimesFromInterval(from, to, intervalHours);
  }
  return { scheduleFrom: from, scheduleTo: to, intervalHours, slotTimes: slotTimes.slice(0, 12) };
}

export function normalizeGtgData(raw = {}) {
  const config = normalizeGtgConfig(raw.config || {});
  const days = raw.days && typeof raw.days === 'object' ? { ...raw.days } : {};
  const workoutSync =
    raw.workoutSync && typeof raw.workoutSync === 'object' ? { ...raw.workoutSync } : {};
  return { config, days, workoutSync };
}

export function getGtgExerciseLabel(exerciseId, config = {}, ctx = {}) {
  const t = ctx.t;
  const builtinKeys = {
    pullups: 'endurance.gtg.exercise.pullups',
    dips: 'endurance.gtg.exercise.dips',
    pushups: 'endurance.gtg.exercise.pushups'
  };
  if (builtinKeys[exerciseId] && typeof t === 'function') return t(builtinKeys[exerciseId]);
  if (builtinKeys[exerciseId]) {
    const fr = { pullups: 'Tractions', dips: 'Dips', pushups: 'Pompes' };
    return fr[exerciseId] || exerciseId;
  }
  const cat = config.customCatalog?.[exerciseId];
  if (cat?.name) return cat.name;
  const bank = findBankExerciseById(exerciseId);
  return bank?.name || exerciseId;
}

function defaultPerExerciseEntry(config) {
  return {
    scheduleFrom: config.scheduleFrom,
    scheduleTo: config.scheduleTo,
    intervalHours: config.intervalHours,
    slotMode: 'interval',
    slotTimes: buildSlotTimesFromInterval(
      config.scheduleFrom,
      config.scheduleTo,
      config.intervalHours
    )
  };
}

export function addGtgBankExercise(gtgData, bankEntry) {
  const normalized = normalizeGtgData(gtgData);
  const id = bankEntry.id || makeGtgDbExerciseId(bankEntry.bankKey);
  const customCatalog = {
    ...normalized.config.customCatalog,
    [id]: { bankKey: bankEntry.bankKey, name: bankEntry.name }
  };
  const selectedIds = normalized.config.selectedIds.includes(id)
    ? normalized.config.selectedIds
    : [...normalized.config.selectedIds, id];
  const perExercise = {
    ...normalized.config.perExercise,
    [id]: defaultPerExerciseEntry(normalized.config)
  };
  return updateGtgConfig(normalized, { customCatalog, selectedIds, perExercise });
}

export function removeGtgExercise(gtgData, exerciseId) {
  const normalized = normalizeGtgData(gtgData);
  const selectedIds = normalized.config.selectedIds.filter((id) => id !== exerciseId);
  if (selectedIds.length === 0) return normalized;
  const customCatalog = { ...normalized.config.customCatalog };
  delete customCatalog[exerciseId];
  const perExercise = { ...normalized.config.perExercise };
  delete perExercise[exerciseId];
  const manualMax = { ...normalized.config.manualMax };
  delete manualMax[exerciseId];
  return updateGtgConfig(normalized, { selectedIds, customCatalog, perExercise, manualMax });
}

/** Met à jour la config d'un exercice (max, horaires, fréquence). */
export function updateGtgExerciseConfig(gtgData, exerciseId, patch = {}) {
  const normalized = normalizeGtgData(gtgData);
  if (!normalized.config.selectedIds.includes(exerciseId)) return normalized;

  const perExercise = { ...normalized.config.perExercise };
  const cur = { ...(perExercise[exerciseId] || defaultPerExerciseEntry(normalized.config)), ...patch };

  if (
    patch.scheduleFrom != null ||
    patch.scheduleTo != null ||
    patch.intervalHours != null ||
    patch.slotMode === 'interval'
  ) {
    cur.slotMode = patch.slotMode === 'manual' ? 'manual' : 'interval';
    if (cur.slotMode !== 'manual') {
      cur.slotTimes = buildSlotTimesFromInterval(
        cur.scheduleFrom || normalized.config.scheduleFrom,
        cur.scheduleTo || normalized.config.scheduleTo,
        cur.intervalHours || normalized.config.intervalHours
      );
    }
  }

  if (patch.slotTimes && Array.isArray(patch.slotTimes)) {
    cur.slotMode = 'manual';
    cur.slotTimes = patch.slotTimes.map((t) => String(t || '').slice(0, 5)).slice(0, 12);
  }

  perExercise[exerciseId] = cur;

  const manualMax = { ...normalized.config.manualMax };
  if ('manualMax' in patch) {
    const v = patch.manualMax;
    if (v === '' || v === null || v === undefined) manualMax[exerciseId] = null;
    else {
      const n = Math.round(Number(v));
      manualMax[exerciseId] = Number.isFinite(n) && n > 0 ? n : null;
    }
  }

  return updateGtgConfig(normalized, { perExercise, manualMax });
}

function maxFromRecords(records, def) {
  const list = Array.isArray(records) ? records : [];
  let best = 0;
  list.forEach((r) => {
    if (!r || String(r.performanceType || '').toLowerCase() === 'duration') return;
    const id = Number(r.exerciseId);
    const name = String(r.exerciseName || r.name || '');
    const idMatch = def.recordExerciseIds?.includes(id);
    const nameMatch = def.namePattern?.test(name);
    if (!idMatch && !nameMatch) return;
    const reps = Number(r.reps) || 0;
    if (reps > best) best = reps;
  });
  return best;
}

function maxFromQuiz(quizAnswers, quizKey) {
  const v = quizAnswers?.strengthBaselineMaxes?.[quizKey];
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
}

function maxFromPushupSessions(enduranceData) {
  const sessions = enduranceData?.sessions?.pushups;
  if (!Array.isArray(sessions)) return 0;
  return sessions.reduce((m, s) => Math.max(m, Math.round(Number(s?.reps) || 0)), 0);
}

/**
 * Résout le max utilisé pour calculer les reps GTG d'un exercice.
 */
function maxFromCustomBank(exerciseId, records, bankEntry) {
  const list = Array.isArray(records) ? records : [];
  const name = String(bankEntry?.name || '').toLowerCase();
  let best = 0;
  list.forEach((r) => {
    if (!r || String(r.performanceType || '').toLowerCase() === 'duration') return;
    const rid = String(r.exerciseId || '');
    const rname = String(r.exerciseName || r.name || '').toLowerCase();
    if (rid !== exerciseId && rname !== name && !rname.includes(name.slice(0, 6))) return;
    const reps = Number(r.reps) || 0;
    if (reps > best) best = reps;
  });
  return best;
}

export function resolveGtgMaxReps(exerciseId, { workoutData = {}, profileQuestionnaire = null } = {}) {
  const config = normalizeGtgConfig(workoutData?.enduranceData?.gtg?.config || {});
  const manual = config.manualMax?.[exerciseId];
  if (manual != null && manual > 0) return manual;

  const def = GTG_EXERCISE_DEFS.find((d) => d.id === exerciseId);
  const records = workoutData?.exerciseMaxRecords || [];
  const qq = profileQuestionnaire?.answers || profileQuestionnaire || {};

  if (!def) {
    const bank = findBankExerciseById(exerciseId) || config.customCatalog?.[exerciseId];
    const fromRecords = maxFromCustomBank(exerciseId, records, bank);
    return Math.max(1, fromRecords || 8);
  }

  let fromRecords = maxFromRecords(records, def);
  const fromQuiz = maxFromQuiz(qq, def.quizKey);

  if (exerciseId === 'pushups' && fromRecords <= 0) {
    fromRecords = Math.max(fromRecords, maxFromPushupSessions(workoutData?.enduranceData));
  }

  const best = Math.max(fromRecords, fromQuiz, GTG_DEFAULT_MAX[exerciseId] || 1);
  return Math.max(1, best);
}

/**
 * Reps cible (~50 %) + fourchette 40–60 % pour l'affichage.
 */
export function computeGtgRepsPerSet(maxReps) {
  const m = Math.max(1, Math.round(Number(maxReps) || 1));
  const reps = Math.max(1, Math.round(m * 0.5));
  const rangeLow = Math.max(1, Math.floor(m * 0.4));
  const rangeHigh = Math.max(reps, Math.ceil(m * 0.6));
  return { reps, rangeLow, rangeHigh, maxReps: m };
}

export function getGtgExercisePlan(exerciseId, ctx = {}) {
  const maxReps = resolveGtgMaxReps(exerciseId, ctx);
  const { reps, rangeLow, rangeHigh } = computeGtgRepsPerSet(maxReps);
  return { exerciseId, maxReps, repsPerSet: reps, rangeLow, rangeHigh };
}

function migrateLegacyDayRecord(dayRecord, selectedIds) {
  if (dayRecord?.exercises && typeof dayRecord.exercises === 'object') {
    return dayRecord;
  }
  const exercises = {};
  selectedIds.forEach((id) => {
    exercises[id] = { slots: {} };
  });
  const legacySlots = dayRecord?.slots || {};
  Object.entries(legacySlots).forEach(([si, slot]) => {
    if (!slot || typeof slot !== 'object') return;
    selectedIds.forEach((exId) => {
      if (slot[exId]?.done) {
        exercises[exId].slots[si] = {
          done: true,
          updatedAt: slot[exId].updatedAt || new Date().toISOString()
        };
      }
    });
  });
  return { exercises, slots: legacySlots };
}

export function getDayRecord(gtgData, dateStr, selectedIds = []) {
  const days = gtgData?.days || {};
  const raw = days[dateStr] || {};
  return migrateLegacyDayRecord(raw, selectedIds);
}

function getExerciseDaySlots(dayRecord, exerciseId) {
  return dayRecord?.exercises?.[exerciseId]?.slots || {};
}

export function isMiniSetDone(dayRecord, slotIndex, exerciseId) {
  return Boolean(getExerciseDaySlots(dayRecord, exerciseId)?.[String(slotIndex)]?.done);
}

/**
 * Plan du jour : créneaux horaires + reps attendues + état coché.
 */
export function buildGtgDayPlan(gtgData, dateStr, ctx = {}) {
  const normalized = normalizeGtgData(gtgData);
  const { config } = normalized;
  const { selectedIds } = config;
  const dayRecord = getDayRecord(normalized, dateStr, selectedIds);

  const exercisePlans = selectedIds.map((id) => {
    const plan = getGtgExercisePlan(id, ctx);
    const schedule = getPerExerciseSchedule(config, id);
    const slots = schedule.slotTimes.map((time, index) => ({
      index,
      time,
      reps: plan.repsPerSet,
      rangeLow: plan.rangeLow,
      rangeHigh: plan.rangeHigh,
      maxReps: plan.maxReps,
      done: isMiniSetDone(dayRecord, index, id)
    }));
    const completedCount = slots.filter((s) => s.done).length;
    return {
      ...plan,
      schedule,
      slots,
      completedCount,
      totalCount: slots.length,
      isComplete: slots.length > 0 && completedCount === slots.length
    };
  });

  const timeMap = new Map();
  exercisePlans.forEach((ep) => {
    ep.slots.forEach((s) => {
      if (!timeMap.has(s.time)) timeMap.set(s.time, []);
      timeMap.get(s.time).push({
        exerciseId: ep.exerciseId,
        reps: s.reps,
        done: s.done,
        slotIndex: s.index
      });
    });
  });
  const slots = Array.from(timeMap.entries())
    .sort(([a], [b]) => parseTimeToMinutes(a) - parseTimeToMinutes(b))
    .map(([time, items], index) => ({
      index,
      time,
      items,
      completedCount: items.filter((i) => i.done).length,
      totalCount: items.length,
      isComplete: items.length > 0 && items.every((i) => i.done)
    }));

  const exercises = exercisePlans.map((ep) => ({
    exerciseId: ep.exerciseId,
    maxReps: ep.maxReps,
    repsPerSet: ep.repsPerSet,
    rangeLow: ep.rangeLow,
    rangeHigh: ep.rangeHigh
  }));

  let plannedMiniSets = 0;
  let doneMiniSets = 0;
  let doneReps = 0;
  exercisePlans.forEach((ep) => {
    ep.slots.forEach((s) => {
      plannedMiniSets += 1;
      if (s.done) {
        doneMiniSets += 1;
        doneReps += s.reps;
      }
    });
  });

  const progressPct = plannedMiniSets > 0 ? (doneMiniSets / plannedMiniSets) * 100 : 0;

  return {
    dateStr,
    config,
    exercises,
    exercisePlans,
    slots,
    plannedMiniSets,
    doneMiniSets,
    doneReps,
    progressPct,
    reached50: progressPct >= 50,
    reached100: progressPct >= 99.5
  };
}

export function toggleGtgMiniSet(gtgData, dateStr, slotIndex, exerciseId) {
  const normalized = normalizeGtgData(gtgData);
  const { config } = normalized;
  if (!config.selectedIds.includes(exerciseId)) return normalized;

  const dayRecord = getDayRecord(normalized, dateStr, config.selectedIds);
  const exercises = { ...(dayRecord.exercises || {}) };
  const exDay = { slots: { ...(exercises[exerciseId]?.slots || {}) } };
  const key = String(slotIndex);
  const cur = Boolean(exDay.slots[key]?.done);
  exDay.slots[key] = { done: !cur, updatedAt: new Date().toISOString() };
  exercises[exerciseId] = exDay;

  return {
    ...normalized,
    days: {
      ...normalized.days,
      [dateStr]: { exercises }
    }
  };
}

export function updateGtgConfig(gtgData, patch = {}) {
  const normalized = normalizeGtgData(gtgData);
  const merged = { ...normalized.config, ...patch };
  if (
    patch.scheduleFrom != null ||
    patch.scheduleTo != null ||
    patch.intervalHours != null ||
    patch.slotMode === 'interval'
  ) {
    merged.slotMode = patch.slotMode === 'manual' ? 'manual' : 'interval';
    if (merged.slotMode === 'interval') {
      merged.slotTimes = buildSlotTimesFromInterval(
        merged.scheduleFrom,
        merged.scheduleTo,
        merged.intervalHours
      );
    }
  }
  const nextConfig = normalizeGtgConfig(merged);
  return { ...normalized, config: nextConfig };
}

/** Somme GTG sur une fenêtre inclusive. */
export function summarizeGtgWindow(gtgData, startYmd, endYmd, ctx = {}) {
  const normalized = normalizeGtgData(gtgData);
  const range = DateHelper.getDateRange(startYmd, endYmd);
  let daysWithAny = 0;
  let daysAt50 = 0;
  let daysAt100 = 0;
  let totalMiniSetsDone = 0;
  let totalReps = 0;
  let activeDaysStreak = 0;
  let bestStreak = 0;

  range.forEach((d) => {
    const plan = buildGtgDayPlan(normalized, d, ctx);
    if (plan.doneMiniSets > 0) {
      daysWithAny += 1;
      activeDaysStreak += 1;
      bestStreak = Math.max(bestStreak, activeDaysStreak);
    } else {
      activeDaysStreak = 0;
    }
    if (plan.reached50) daysAt50 += 1;
    if (plan.reached100) daysAt100 += 1;
    totalMiniSetsDone += plan.doneMiniSets;
    totalReps += plan.doneReps;
  });

  return {
    daysInWindow: range.length,
    daysWithAny,
    daysAt50,
    daysAt100,
    totalMiniSetsDone,
    totalReps,
    bestStreak,
    hasConfig: (normalized.config?.selectedIds?.length || 0) > 0
  };
}

/** Historique plat de toutes les mini-séries cochées sur une fenêtre. */
export function collectGtgMiniSetHistory(gtgData, startYmd, endYmd, ctx = {}) {
  const normalized = normalizeGtgData(gtgData);
  const range = DateHelper.getDateRange(startYmd, endYmd);
  const rows = [];
  range.forEach((dateStr) => {
    const plan = buildGtgDayPlan(normalized, dateStr, ctx);
    (plan.exercisePlans || []).forEach((ep) => {
      ep.slots.forEach((s) => {
        if (!s.done) return;
        rows.push({
          dateStr,
          time: s.time,
          slotIndex: s.index,
          exerciseId: ep.exerciseId,
          reps: s.reps
        });
      });
    });
  });
  return rows;
}

/** Map date → reps GTG cumulées (pour graphique). */
export function aggregateGtgRepsByDate(gtgData, ctx = {}) {
  const normalized = normalizeGtgData(gtgData);
  const map = new Map();
  const dayKeys = Object.keys(normalized.days || {}).sort();
  dayKeys.forEach((dateStr) => {
    const plan = buildGtgDayPlan(normalized, dateStr, ctx);
    if (plan.doneReps > 0) map.set(dateStr, plan.doneReps);
    else if (plan.doneMiniSets > 0) map.set(dateStr, plan.doneMiniSets);
  });
  return map;
}

/** Map date → nombre de mini-séries (intensité calendrier). */
export function aggregateGtgMiniSetsByDate(gtgData, ctx = {}) {
  const normalized = normalizeGtgData(gtgData);
  const map = new Map();
  Object.keys(normalized.days || {}).forEach((dateStr) => {
    const plan = buildGtgDayPlan(normalized, dateStr, ctx);
    if (plan.doneMiniSets > 0) map.set(dateStr, plan.doneMiniSets);
  });
  return map;
}

export function listGtgFundamentalBankSuggestions() {
  return listGtgBankExercises().filter((e) => e.isFundamental);
}

/** Signature légère pour invalidation cache XP. */
export function gtgChecksum(gtg) {
  if (!gtg || typeof gtg !== 'object') return '0';
  const n = normalizeGtgData(gtg);
  const dayKeys = Object.keys(n.days || {}).sort();
  let tally = `${n.config.selectedIds.join(',')}`;
  n.config.selectedIds.forEach((ex) => {
    const pe = n.config.perExercise?.[ex];
    if (pe) tally += `|${ex}:${pe.scheduleFrom}-${pe.scheduleTo}@${pe.intervalHours}`;
  });
  dayKeys.forEach((d) => {
    const day = getDayRecord(n, d, n.config.selectedIds);
    n.config.selectedIds.forEach((ex) => {
      const slots = day.exercises?.[ex]?.slots || {};
      Object.keys(slots).forEach((si) => {
        if (slots[si]?.done) tally += `+${d}:${ex}:${si}`;
      });
    });
  });
  return tally;
}
