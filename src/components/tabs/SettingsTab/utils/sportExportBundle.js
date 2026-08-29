/**
 * Export Sport complet — données brutes + journal quotidien lisible.
 * @module components/tabs/SettingsTab/utils/sportExportBundle
 */

import { findExerciseInDatabase } from '../../../../data/exerciseDatabase';
import { getStretchByKey } from '../../../../data/stretchDatabase';
import { workoutProgram } from '../../../../data/workoutProgram';
import {
  parseExerciseKey,
  parseStretchItemKey,
  parseStretchKey,
  isStretchItemKey
} from '../../../../utils/exerciseKeyGenerator';
import { normalizeStretchSlots, flattenStretchItems } from '../../../../utils/stretchUtils';
import { createWorkoutRepository } from '../../../../services/workout/createWorkoutRepository';
import { buildEnduranceExportStats } from './exportUtils';
import {
  aggregateLiftVolumeKgByDate,
  computeVolumeKgForWorkoutKey
} from '../../../../utils/exerciseLoadVolume';
import { collectDedupedCheckedVolumeKeys } from '../../../../utils/trainingLoadUtils';

const DAY_KEY_RE = /^(\d{4}-\d{2}-\d{2})_/;

/** @param {string} scopeKey */
export async function loadSportProgramContext(scopeKey = 'anonymous') {
  try {
    const repo = createWorkoutRepository('local');
    return (await repo.loadProgramContext(scopeKey)) || null;
  } catch {
    return null;
  }
}

/** @param {string} scopeKey @param {Record<string, unknown>} ctx */
export async function persistSportProgramContext(scopeKey, ctx) {
  if (!ctx || typeof ctx !== 'object') return;
  try {
    const repo = createWorkoutRepository('local');
    await repo.saveProgramContext(scopeKey, ctx);
  } catch (err) {
    console.warn('[sportExport] Échec persistance contexte programme:', err);
  }
}

/** @param {unknown} user */
export function sanitizeUserProfileForExport(user) {
  if (!user || typeof user !== 'object') return null;
  return {
    id: user.id ?? null,
    username: user.username ?? null,
    email: user.email ?? null,
    avatarUrl: user.avatarUrl ?? null,
    profileQuestionnaire: user.profileQuestionnaire ?? null
  };
}

/**
 * @param {Array<object>} programs
 * @param {object|null} activeProgram
 * @param {string|number} exerciseId
 */
export function resolveExerciseNameFromPrograms(programs, activeProgram, exerciseId) {
  const searchId = typeof exerciseId === 'string' ? parseInt(exerciseId, 10) : exerciseId;
  const allPrograms = [];
  if (Array.isArray(programs)) allPrograms.push(...programs);
  if (activeProgram && !allPrograms.some((p) => p?.id === activeProgram.id)) {
    allPrograms.push(activeProgram);
  }

  const searchInList = (list) => {
    if (!Array.isArray(list)) return null;
    for (const ex of list) {
      const numeric = typeof ex.id === 'number' ? ex.id : parseInt(String(ex.id), 10);
      if (numeric === searchId || String(ex.id) === String(exerciseId)) {
        return ex.name || ex.nom || String(exerciseId);
      }
    }
    return null;
  };

  for (const program of allPrograms) {
    const schedule = program?.schedule;
    if (!schedule || typeof schedule !== 'object') continue;
    for (const daySchedule of Object.values(schedule)) {
      const found =
        searchInList(daySchedule?.exercises) ||
        searchInList(daySchedule?.exercices) ||
        searchInList(daySchedule?.salleVariants?.semaineA?.exercises) ||
        searchInList(daySchedule?.salleVariants?.semaineB?.exercises);
      if (found) return found;
    }
  }

  for (const day of Object.values(workoutProgram)) {
    const list = day?.exercices || day?.exercises;
    if (!Array.isArray(list)) continue;
    const hit = list.find((ex) => ex.id === searchId || String(ex.id) === String(exerciseId));
    if (hit?.name) return hit.name;
  }

  const dbHit = findExerciseInDatabase(String(exerciseId));
  return dbHit?.name || `Exercice #${exerciseId}`;
}

/**
 * @param {Array<object>} programs
 * @param {object|null} activeProgram
 * @param {string|number} stretchId
 * @param {string} [moment]
 */
export function resolveStretchLabelFromPrograms(programs, activeProgram, stretchId, moment) {
  const idStr = String(stretchId);
  const allPrograms = [];
  if (Array.isArray(programs)) allPrograms.push(...programs);
  if (activeProgram && !allPrograms.some((p) => p?.id === activeProgram.id)) {
    allPrograms.push(activeProgram);
  }

  for (const program of allPrograms) {
    const schedule = program?.schedule;
    if (!schedule || typeof schedule !== 'object') continue;
    for (const [dayName, daySchedule] of Object.entries(schedule)) {
      const raw = daySchedule?.etirements || daySchedule?.stretches;
      if (!raw) continue;
      const slots = normalizeStretchSlots(raw, dayName);
      for (const item of flattenStretchItems(slots)) {
        if (String(item.id) !== idStr) continue;
        if (moment && item.moment && item.moment !== moment) continue;
        if (item.displayName) return item.displayName;
        if (item.customName) return item.customName;
        if (item.stretchKey) {
          const db = getStretchByKey(item.stretchKey);
          if (db?.name) return db.name;
        }
        if (item.legacyText) return item.legacyText;
      }
    }
  }

  const db = getStretchByKey(idStr);
  if (db?.name) return db.name;
  return `Étirement #${stretchId}`;
}

/** @param {Record<string, unknown>} workoutData */
function collectSportDates(workoutData) {
  const dates = new Set();

  const scanKeys = (map) => {
    if (!map || typeof map !== 'object') return;
    for (const key of Object.keys(map)) {
      const m = key.match(DAY_KEY_RE);
      if (m) dates.add(m[1]);
    }
  };

  scanKeys(workoutData.reps);
  scanKeys(workoutData.checkedExercises);
  scanKeys(workoutData.checkedStretches);
  scanKeys(workoutData.exerciseWeights);
  scanKeys(workoutData.exerciseSessionEffortStars);
  scanKeys(workoutData.stretchSessionEffortStars);

  if (workoutData.dailyVariations && typeof workoutData.dailyVariations === 'object') {
    for (const d of Object.keys(workoutData.dailyVariations)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) dates.add(d);
    }
  }
  if (workoutData.dayJustifications && typeof workoutData.dayJustifications === 'object') {
    for (const d of Object.keys(workoutData.dayJustifications)) dates.add(d);
  }
  if (workoutData.sessionFeedbacks && typeof workoutData.sessionFeedbacks === 'object') {
    for (const d of Object.keys(workoutData.sessionFeedbacks)) dates.add(d);
  }
  if (workoutData.circuitProgress && typeof workoutData.circuitProgress === 'object') {
    for (const d of Object.keys(workoutData.circuitProgress)) dates.add(d);
  }

  const sessions = workoutData.enduranceData?.sessions || {};
  for (const list of Object.values(sessions)) {
    if (!Array.isArray(list)) continue;
    for (const s of list) {
      if (s?.date && /^\d{4}-\d{2}-\d{2}$/.test(String(s.date).slice(0, 10))) {
        dates.add(String(s.date).slice(0, 10));
      }
    }
  }

  if (workoutData.enduranceData?.gtg?.days && typeof workoutData.enduranceData.gtg.days === 'object') {
    for (const d of Object.keys(workoutData.enduranceData.gtg.days)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) dates.add(d);
    }
  }

  return [...dates].sort();
}

/**
 * Journal quotidien lisible (exercices, reps, étirements, feedbacks…).
 * @param {Record<string, unknown>} workoutData
 * @param {{ programs?: object[], activeProgram?: object|null }} programCtx
 */
export function buildSportDailyJournal(workoutData, programCtx = {}) {
  const programs = programCtx.programs || [];
  const activeProgram = programCtx.activeProgram ?? null;
  const journal = {};

  const ensureDay = (dateStr) => {
    if (!journal[dateStr]) {
      journal[dateStr] = {
        date: dateStr,
        exercises: [],
        stretches: [],
        enduranceSessions: [],
        sessionFeedback: workoutData.sessionFeedbacks?.[dateStr] ?? null,
        dayJustification: workoutData.dayJustifications?.[dateStr] ?? null,
        dailyVariation: workoutData.dailyVariations?.[dateStr] ?? null,
        circuitProgress: workoutData.circuitProgress?.[dateStr] ?? null
      };
    }
    return journal[dateStr];
  };

  const reps = workoutData.reps || {};
  const checked = workoutData.checkedExercises || {};
  const exerciseKeys = new Set([
    ...Object.keys(reps),
    ...Object.keys(checked),
    ...Object.keys(workoutData.exerciseWeights || {}),
    ...Object.keys(workoutData.exerciseSessionEffortStars || {})
  ]);

  for (const key of exerciseKeys) {
    if (isStretchItemKey(key)) continue;
    if (key.includes('_stretch_')) continue;
    if (key.includes('_complementary_')) continue;

    const parsed = parseExerciseKey(key);
    if (!parsed?.dateStr || !parsed.exerciseId) continue;

    const repsVal = reps[key];
    const hasReps = repsVal !== undefined && repsVal !== null && String(repsVal).trim() !== '';
    const isChecked = Boolean(checked[key]);
    if (!hasReps && !isChecked) continue;

    const day = ensureDay(parsed.dateStr);
    const volumeKg = isChecked && hasReps
      ? Math.round(computeVolumeKgForWorkoutKey(key, workoutData) * 10) / 10
      : 0;
    day.exercises.push({
      key,
      exerciseId: parsed.exerciseId,
      name: resolveExerciseNameFromPrograms(programs, activeProgram, parsed.exerciseId),
      weekVariant: parsed.weekVariant,
      reps: hasReps ? Number.parseInt(String(repsVal), 10) || String(repsVal) : null,
      checked: isChecked,
      weightKg: workoutData.exerciseWeights?.[key] ?? null,
      weightPerArm: workoutData.exerciseWeightPerArm?.[key] === true,
      setWeights: workoutData.exerciseSetWeights?.[key] ?? null,
      volumeKg: volumeKg > 0 ? volumeKg : null,
      effortStars: workoutData.exerciseSessionEffortStars?.[key] ?? null,
      pleasureStars: workoutData.exerciseSessionPleasureStars?.[key] ?? null,
      perceived: workoutData.exerciseSessionPerceived?.[key] ?? null
    });
  }

  const stretchChecked = workoutData.checkedStretches || {};
  for (const key of Object.keys(stretchChecked)) {
    const itemParsed = parseStretchItemKey(key);
    if (itemParsed) {
      const day = ensureDay(itemParsed.dateStr);
      day.stretches.push({
        key,
        format: 'item',
        moment: itemParsed.moment,
        stretchId: itemParsed.stretchId,
        name: resolveStretchLabelFromPrograms(
          programs,
          activeProgram,
          itemParsed.stretchId,
          itemParsed.moment
        ),
        checked: Boolean(stretchChecked[key]),
        effortStars: workoutData.stretchSessionEffortStars?.[key] ?? null
      });
      continue;
    }

    const legacy = parseStretchKey(key);
    if (legacy) {
      const day = ensureDay(legacy.dateStr);
      day.stretches.push({
        key,
        format: 'legacy_moment',
        moment: legacy.moment,
        checked: Boolean(stretchChecked[key])
      });
    }
  }

  const enduranceSessions = workoutData.enduranceData?.sessions || {};
  for (const [activityType, list] of Object.entries(enduranceSessions)) {
    if (!Array.isArray(list)) continue;
    for (const session of list) {
      const dateStr = session?.date ? String(session.date).slice(0, 10) : null;
      if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) continue;
      const day = ensureDay(dateStr);
      day.enduranceSessions.push({
        activityType,
        ...session
      });
    }
  }

  for (const dateStr of collectSportDates(workoutData)) {
    ensureDay(dateStr);
  }

  for (const day of Object.values(journal)) {
    day.liftVolumeKg =
      Math.round(
        day.exercises.reduce((s, ex) => s + (Number(ex.volumeKg) || 0), 0) * 10
      ) / 10;
    day.exercises.sort((a, b) => String(a.name).localeCompare(String(b.name), 'fr'));
    day.stretches.sort((a, b) => `${a.moment}_${a.name}`.localeCompare(`${b.moment}_${b.name}`, 'fr'));
  }

  return journal;
}

/**
 * Volume kg×reps par jour avec détail par exercice.
 * @param {Record<string, unknown>} workoutData
 * @param {{ programs?: object[], activeProgram?: object|null }} programCtx
 */
export function buildDailyLiftVolumeDetail(workoutData, programCtx = {}) {
  const programs = programCtx.programs || [];
  const activeProgram = programCtx.activeProgram ?? null;
  const byDate = {};

  collectDedupedCheckedVolumeKeys(workoutData).forEach((key) => {
    const vol = computeVolumeKgForWorkoutKey(key, workoutData);
    if (vol <= 0) return;
    const m = String(key).match(/^(\d{4}-\d{2}-\d{2})_/);
    if (!m) return;
    const dateStr = m[1];
    if (!byDate[dateStr]) {
      byDate[dateStr] = { date: dateStr, totalKg: 0, exercises: [] };
    }
    const parsed = parseExerciseKey(key);
    const repsVal = workoutData.reps?.[key];
    byDate[dateStr].totalKg += vol;
    byDate[dateStr].exercises.push({
      key,
      exerciseId: parsed?.exerciseId ?? null,
      name: resolveExerciseNameFromPrograms(programs, activeProgram, parsed?.exerciseId),
      reps: parseInt(String(repsVal), 10) || 0,
      weightKg: workoutData.exerciseWeights?.[key] ?? null,
      weightPerArm: workoutData.exerciseWeightPerArm?.[key] === true,
      volumeKg: Math.round(vol * 10) / 10
    });
  });

  const liftMap = aggregateLiftVolumeKgByDate(workoutData);
  liftMap.forEach((total, dateStr) => {
    if (!byDate[dateStr]) {
      byDate[dateStr] = { date: dateStr, totalKg: total, exercises: [] };
    } else {
      byDate[dateStr].totalKg = total;
    }
  });

  return Object.values(byDate)
    .map((d) => ({
      ...d,
      totalKg: Math.round(d.totalKg * 10) / 10,
      exercises: d.exercises.sort((a, b) => String(a.name).localeCompare(String(b.name), 'fr'))
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** @param {Record<string, unknown>} workoutData */
export function buildLiftVolumeSummary(workoutData) {
  const detail = buildDailyLiftVolumeDetail(workoutData);
  const totalKg = detail.reduce((s, d) => s + d.totalKg, 0);
  let peakDay = null;
  let peakKg = 0;
  detail.forEach((d) => {
    if (d.totalKg > peakKg) {
      peakKg = d.totalKg;
      peakDay = d.date;
    }
  });
  return {
    totalKg: Math.round(totalKg * 10) / 10,
    daysWithVolume: detail.length,
    peakDay,
    peakKg: Math.round(peakKg * 10) / 10,
    byDate: Object.fromEntries(detail.map((d) => [d.date, d.totalKg]))
  };
}

/** @param {Record<string, unknown>} workoutData @param {object} programCtx @param {object|null} userProfile */
export function buildSportExportMetadata(workoutData, programCtx = {}, userProfile = null) {
  const programs = programCtx.programs || workoutData.programs || [];
  const dailyJournal = buildSportDailyJournal(workoutData, programCtx);
  const dailyLiftVolume = buildDailyLiftVolumeDetail(workoutData, programCtx);
  const liftVolumeSummary = buildLiftVolumeSummary(workoutData);
  const journalDays = Object.keys(dailyJournal).length;
  const journalExercises = Object.values(dailyJournal).reduce((n, d) => n + (d.exercises?.length || 0), 0);
  const journalStretches = Object.values(dailyJournal).reduce((n, d) => n + (d.stretches?.length || 0), 0);

  return {
    totalExercises: Object.keys(workoutData.checkedExercises || {}).length,
    totalReps: Object.keys(workoutData.reps || {}).length,
    totalStretches: Object.keys(workoutData.checkedStretches || {}).length,
    repsWithValue: Object.values(workoutData.reps || {}).filter(
      (v) => v !== undefined && v !== null && String(v).trim() !== ''
    ).length,
    loadTracking: {
      exerciseWeightKeys: Object.keys(workoutData.exerciseWeights || {}).length,
      exercisePerArmKeys: Object.keys(workoutData.exerciseWeightPerArm || {}).filter(
        (k) => workoutData.exerciseWeightPerArm[k] === true
      ).length,
      exerciseSetWeightKeys: Object.keys(workoutData.exerciseSetWeights || {}).length
    },
    historyReps: Object.keys(workoutData.historyReps || {}).length,
    sessionFeedbacks: Object.keys(workoutData.sessionFeedbacks || {}).length,
    dailyVariations: Object.keys(workoutData.dailyVariations || {}).length,
    dayJustifications: Object.keys(workoutData.dayJustifications || {}).length,
    exerciseSessionPerceived: Object.keys(workoutData.exerciseSessionPerceived || {}).length,
    circuitDefinitions: Object.keys(workoutData.circuitDefinitions || {}).length,
    circuitProgressDays: Object.keys(workoutData.circuitProgress || {}).length,
    exerciseMaxRecords: (workoutData.exerciseMaxRecords || []).length,
    exerciseMaxHistory: (workoutData.exerciseMaxHistory || []).length,
    performanceRetestPlans: (workoutData.performanceRetestPlans || []).length,
    pyramidSessionLog: (workoutData.pyramidSessionLog || []).length,
    programs: Array.isArray(programs) ? programs.length : 0,
    activeProgram: programCtx.activeProgram?.name || workoutData.activeProgram?.name || null,
    programHistory: (programCtx.programHistory || workoutData.programHistory || []).length,
    profileQuestionnairePresent: Boolean(
      userProfile?.profileQuestionnaire || workoutData.profileQuestionnaire
    ),
    dailyJournal: {
      days: journalDays,
      exerciseEntries: journalExercises,
      stretchEntries: journalStretches
    },
    liftVolume: liftVolumeSummary,
    dailyLiftVolumeDays: dailyLiftVolume.length,
    enduranceSummary: buildEnduranceExportStats(workoutData.enduranceData || {}),
    enduranceLastUpdated: workoutData.enduranceData?.lastUpdated || null,
    dateRange: (() => {
      const dates = collectSportDates(workoutData);
      return {
        earliest: dates[0] || null,
        latest: dates[dates.length - 1] || null
      };
    })()
  };
}

/**
 * Prépare le payload Sport complet (données brutes + contexte + journal).
 * @param {{ workoutData: Record<string, unknown>, programContext?: object|null, userProfile?: object|null }} input
 */
export function prepareSportExportBundle({ workoutData, programContext = null, userProfile = null }) {
  const ctx = programContext || {};
  const programs = ctx.programs ?? workoutData.programs ?? [];
  const activeProgram = ctx.activeProgram ?? workoutData.activeProgram ?? null;
  const programHistory = ctx.programHistory ?? workoutData.programHistory ?? [];
  const weekVariant = ctx.weekVariant ?? workoutData.weekVariant ?? 'A';
  const isGymMode = ctx.isGymMode ?? workoutData.isGymMode ?? false;

  const userSnapshot = sanitizeUserProfileForExport(userProfile);
  const profileQuestionnaire =
    userProfile?.profileQuestionnaire ?? workoutData.profileQuestionnaire ?? null;

  const dailyJournal = buildSportDailyJournal(workoutData, { programs, activeProgram });
  const dailyLiftVolume = buildDailyLiftVolumeDetail(workoutData, { programs, activeProgram });

  const data = {
    ...workoutData,
    programs,
    activeProgram,
    programHistory,
    weekVariant,
    isGymMode,
    profileQuestionnaire,
    userProfileSnapshot: userSnapshot
  };

  return {
    data,
    sportExport: {
      schemaVersion: '2.0',
      dailyJournal,
      dailyLiftVolume
    },
    metadata: buildSportExportMetadata(workoutData, { programs, activeProgram, programHistory }, userProfile)
  };
}

/** Champs objet fusionnés clé par clé (import). */
export const WORKOUT_MAP_MERGE_FIELDS = [
  'checkedExercises',
  'reps',
  'checkedStretches',
  'historyReps',
  'exerciseWeights',
  'exerciseWeightPerArm',
  'exerciseSetWeights',
  'exerciseIntensityCoeffs',
  'exercisePerceivedRatings',
  'exercisePersonalNotes',
  'exerciseSessionEffortStars',
  'exerciseSessionPleasureStars',
  'exerciseSessionPerceived',
  'stretchPerceivedRatings',
  'stretchPersonalNotes',
  'stretchSessionEffortStars',
  'dailyVariations',
  'sessionFeedbacks',
  'dayJustifications',
  'circuitDefinitions',
  'circuitProgress',
  'trainingPrefs',
  'restDaySwaps',
  'addictionQuitData'
];

/**
 * Fusionne les champs workout importés avec l'existant (sans écraser nutrition/livres).
 * @param {Record<string, unknown>} backup
 * @param {Record<string, unknown>} imported
 */
export function mergeWorkoutMapFields(backup, imported) {
  const out = {};
  for (const field of WORKOUT_MAP_MERGE_FIELDS) {
    out[field] = {
      ...(backup?.[field] && typeof backup[field] === 'object' ? backup[field] : {}),
      ...(imported?.[field] && typeof imported[field] === 'object' ? imported[field] : {})
    };
  }
  return out;
}

/**
 * Aperçu UI export (compteurs complets incl. programmes IndexedDB + journal).
 * @param {Record<string, unknown>} workoutData
 * @param {object} programCtx
 * @param {object|null} userProfile
 */
export function buildSportExportPreview(workoutData = {}, programCtx = {}, userProfile = null) {
  const meta = buildSportExportMetadata(workoutData, programCtx, userProfile);
  const dailyLiftVolume = buildDailyLiftVolumeDetail(workoutData, programCtx);
  const pq = userProfile?.profileQuestionnaire ?? workoutData.profileQuestionnaire;
  const ed = workoutData.enduranceData || {};
  const sessions = ed.sessions || {};

  return {
    ...meta,
    dailyLiftVolume,
    liftVolume: meta.liftVolume,
    activeProgramLabel: meta.activeProgram || 'Aucun',
    quiz: {
      present: Boolean(pq),
      completed: pq?.completedCount ?? 0,
      total: pq?.totalCount ?? 0
    },
    endurance: {
      boxing: (sessions.boxing || ed.boxingSessions || []).length,
      pushups: (sessions.pushups || ed.pushupSessions || []).length,
      swimming: (sessions.swimming || ed.swimmingSessions || []).length,
      jumprope: (sessions.jumprope || ed.jumpropeSessions || []).length,
      running: (sessions.running || ed.runningSessions || []).length,
      challenges: (ed.challenges || []).length,
      gtgDays: ed.gtg?.days ? Object.keys(ed.gtg.days).length : 0,
      gtgExercises: Array.isArray(ed.gtg?.config?.selectedIds) ? ed.gtg.config.selectedIds.length : 0
    },
    bodyTracking: {
      photos: (workoutData.progressPhotos || []).length,
      progressEntries: (workoutData.progressEntries || []).length,
      reminders: (workoutData.bodyTrackingReminders || []).length,
      weighInPrefs: Boolean(workoutData.bodyTrackingPrefs?.weighInsPerWeek || workoutData.bodyTrackingPrefs?.weeklyWeighInDay != null),
      photosWithWeight: (workoutData.progressPhotos || []).filter((p) => p.weight).length,
      photosWithNotes: (workoutData.progressPhotos || []).filter((p) => p.notes).length,
      photosWithMeasurements: (workoutData.progressPhotos || []).filter(
        (p) => p.measurements && Object.keys(p.measurements).length > 0
      ).length,
      lastUpdated: workoutData.bodyTrackingLastUpdated || null
    },
    configuration: {
      startDate: workoutData.startDate || null,
      weekVariant: workoutData.weekVariant || programCtx.weekVariant || 'A',
      programHistory: meta.programHistory,
      circuitDefinitions: meta.circuitDefinitions,
      circuitProgressDays: meta.circuitProgressDays,
      exerciseMaxRecords: meta.exerciseMaxRecords,
      exerciseMaxHistory: meta.exerciseMaxHistory,
      performanceRetestPlans: meta.performanceRetestPlans,
      pyramidSessionLog: meta.pyramidSessionLog
    }
  };
}

/** @param {object|null} existing @param {object|null} imported */
export function mergeProfileQuestionnaire(existing, imported) {
  if (!imported) return existing || null;
  if (!existing) return imported;
  return {
    ...existing,
    ...imported,
    answers: { ...(existing.answers || {}), ...(imported.answers || {}) },
    quizRoundHistory: [
      ...(existing.quizRoundHistory || []),
      ...(imported.quizRoundHistory || []).filter(
        (h) => !(existing.quizRoundHistory || []).some((e) => e?.completedAt === h?.completedAt)
      )
    ],
    completedCount: Math.max(existing.completedCount || 0, imported.completedCount || 0),
    totalCount: Math.max(existing.totalCount || 0, imported.totalCount || 0)
  };
}

/** @param {object|null} existing @param {object|null} imported */
export function mergeSportProgramContext(existing, imported) {
  const base = existing || {};
  const imp = imported || {};
  const mergedPrograms = [...(base.programs || [])];
  for (const p of imp.programs || []) {
    const idx = mergedPrograms.findIndex((x) => x?.id != null && x.id === p?.id);
    if (idx >= 0) mergedPrograms[idx] = { ...mergedPrograms[idx], ...p };
    else mergedPrograms.push(p);
  }
  const mergedHistory = [...(base.programHistory || [])];
  for (const h of imp.programHistory || []) {
    const dup = mergedHistory.some(
      (e) => e?.id === h?.id || (e?.startDate === h?.startDate && e?.endDate === h?.endDate)
    );
    if (!dup) mergedHistory.push(h);
  }
  return {
    programs: mergedPrograms,
    activeProgram: imp.activeProgram ?? base.activeProgram ?? null,
    programHistory: mergedHistory,
    weekVariant: imp.weekVariant ?? base.weekVariant,
    isGymMode: imp.isGymMode ?? base.isGymMode
  };
}

/** @param {Record<string, unknown>} imported */
export function extractSportProgramContextFromImport(imported) {
  if (!imported || typeof imported !== 'object') return null;
  const hasPrograms = Array.isArray(imported.programs) && imported.programs.length > 0;
  const hasActive = imported.activeProgram != null;
  const hasHistory = Array.isArray(imported.programHistory) && imported.programHistory.length > 0;
  if (!hasPrograms && !hasActive && !hasHistory && imported.weekVariant == null && imported.isGymMode == null) {
    return null;
  }
  return {
    programs: imported.programs ?? [],
    activeProgram: imported.activeProgram ?? null,
    programHistory: imported.programHistory ?? [],
    weekVariant: imported.weekVariant,
    isGymMode: imported.isGymMode
  };
}
