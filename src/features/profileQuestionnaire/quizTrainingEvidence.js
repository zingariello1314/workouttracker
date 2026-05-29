/**
 * Signaux issus de l’onglet Sport (coches, reps, endurance, pas) pour affiner le coach à la génération.
 * Ne bloque jamais la génération : maturité none → quiz seul ; sparse/rich → ajustements progressifs.
 */

import {
  deriveJourneyStartYmd,
  countUniqueDaysWithActivityInWindow
} from '../../utils/sport/recapUserAssessment';
import {
  buildTotalStrengthRepsByDate,
  buildMergedStepsByDate
} from '../../utils/sport/recapDailyChartData';
import { aggregateCheckedRepsByDateAndExerciseId } from '../../utils/trainingLoadUtils';
import { aggregateLiftVolumeKgByDate } from '../../utils/exerciseLoadVolume';
import { aggregateSessionLoadAlignment28 } from '../../utils/sport/recapUserAssessment';
import { isMockEnduranceSession, normalizeDateString, parseDurationToMinutes } from '../../utils/calendarUtils';
import {
  analyzeProgramForCoach,
  programAnalysisToCoachAdjustments
} from './quizProgramAnalyzer';

/** Semaines en bloc force avant pivot volume si l’objectif quiz le demande. */
export const FORCE_BLOCK_WEEKS_THRESHOLD = 5;

const MS_DAY = 86400000;

const VOLUME_GOALS = new Set(['muscular_defined', 'lean_toned', 'bulk_mass', 'balanced_functional']);
const FORCE_GOALS = new Set(['strong_powerful', 'athletic_performance']);

function todayYmd() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

function ymdAddDays(ymd, delta) {
  const d = new Date(
    Number(ymd.slice(0, 4)),
    Number(ymd.slice(5, 7)) - 1,
    Number(ymd.slice(8, 10))
  );
  d.setDate(d.getDate() + delta);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daysBetweenInclusive(startYmd, endYmd) {
  if (!startYmd || !endYmd || endYmd < startYmd) return 0;
  const a = new Date(
    Number(startYmd.slice(0, 4)),
    Number(startYmd.slice(5, 7)) - 1,
    Number(startYmd.slice(8, 10))
  );
  const b = new Date(
    Number(endYmd.slice(0, 4)),
    Number(endYmd.slice(5, 7)) - 1,
    Number(endYmd.slice(8, 10))
  );
  return Math.max(0, Math.floor((b - a) / MS_DAY) + 1);
}

function windowStart28(endYmd) {
  return ymdAddDays(endYmd, -27);
}

/** @returns {'none'|'sparse'|'rich'} */
export function resolveEvidenceMaturity({ activeDays28, tenureDays, lifetimeReps }) {
  if (!lifetimeReps && activeDays28 <= 0) return 'none';
  if (activeDays28 >= 10 || (tenureDays >= 21 && activeDays28 >= 6)) return 'rich';
  if (activeDays28 >= 3 || tenureDays >= 7 || lifetimeReps > 80) return 'sparse';
  return 'none';
}

function inferScheduleRepEmphasis(schedule) {
  let force = 0;
  let volume = 0;
  let neutral = 0;
  const scanSeries = (series) => {
    const s = String(series || '');
    if (!s) {
      neutral += 1;
      return;
    }
    if (/4\s*×\s*[345]|3\s*×\s*[345]|×\s*4\b|×\s*5\b|4–8|4-8/i.test(s)) force += 1;
    else if (/1[2-9]|1[0-9]–|15|20\s*min/i.test(s)) volume += 1;
    else neutral += 1;
  };
  if (!schedule || typeof schedule !== 'object') return 'unknown';
  Object.values(schedule).forEach((day) => {
    if (!day?.active) return;
    (day.exercises || []).forEach((ex) => scanSeries(ex.series));
    if (day.salleVariants) {
      ['semaineA', 'semaineB'].forEach((vk) => {
        (day.salleVariants[vk]?.exercises || []).forEach((ex) => scanSeries(ex.series));
      });
    }
  });
  const total = force + volume + neutral;
  if (total === 0) return 'unknown';
  if (force >= volume + 1) return 'force';
  if (volume >= force + 1) return 'volume';
  return 'balanced';
}

function inferLoggedRepEmphasis(snapshot, startYmd, endYmd) {
  const grouped = aggregateCheckedRepsByDateAndExerciseId(snapshot?.reps, snapshot?.checkedExercises);
  let low = 0;
  let high = 0;
  let mid = 0;
  grouped.forEach(({ reps }, gkey) => {
    const dateStr = gkey.slice(0, 10);
    if (dateStr < startYmd || dateStr > endYmd) return;
    const r = Number(reps) || 0;
    if (r <= 0) return;
    if (r <= 8) low += 1;
    else if (r >= 14) high += 1;
    else mid += 1;
  });
  const n = low + mid + high;
  if (n < 6) return 'insufficient';
  if (low >= high + 4) return 'force';
  if (high >= low + 4) return 'volume';
  return 'balanced';
}

function programWeeksElapsed(activeProgram, endYmd) {
  const raw = activeProgram?.startDate || activeProgram?.createdAt;
  if (!raw) return 0;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return 0;
  const startYmd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return Math.max(0, Math.floor(daysBetweenInclusive(startYmd, endYmd) / 7));
}

function sumEnduranceMinutes28(data, startYmd, endYmd) {
  const sessions = data?.enduranceData?.sessions;
  if (!sessions || typeof sessions !== 'object') return { minutes: 0, sessions: 0 };
  let minutes = 0;
  let count = 0;
  Object.keys(sessions).forEach((type) => {
    const arr = sessions[type];
    if (!Array.isArray(arr)) return;
    arr.forEach((s) => {
      if (isMockEnduranceSession(s)) return;
      const ds = normalizeDateString(s?.date);
      if (!ds || ds < startYmd || ds > endYmd) return;
      const m = parseDurationToMinutes(s?.duration || 0);
      if (m > 0) {
        minutes += m;
        count += 1;
      }
    });
  });
  return { minutes: Math.round(minutes), sessions: count };
}

function sumSteps28(data, startYmd, endYmd, garminDailyMetrics) {
  const map = buildMergedStepsByDate(garminDailyMetrics, data?.enduranceData?.manualDailyWalkByDate);
  let sum = 0;
  map.forEach((v, k) => {
    if (k >= startYmd && k <= endYmd) sum += v;
  });
  return sum;
}

function countRestGapDays(snapshot, endYmd, lookbackDays = 14) {
  const start = ymdAddDays(endYmd, -(lookbackDays - 1));
  const activeCount = countUniqueDaysWithActivityInWindow(snapshot, start, endYmd);
  return Math.max(0, lookbackDays - activeCount);
}

/**
 * @param {object} input
 * @param {object} [input.snapshot]
 * @param {object} [input.answers]
 * @param {object|null} [input.activeProgram]
 * @param {object|null} [input.previousProgramMeta] — quizGenerationMeta du programme remplacé
 * @param {(date: Date) => object|null} [input.getWorkoutForDate]
 * @param {boolean} [input.isGymMode]
 * @param {object|null} [input.garminDailyMetrics]
 * @param {object[]} [input.programs]
 * @param {(id: string) => string} [input.getExerciseNameById]
 */
export function buildTrainingEvidence({
  snapshot = null,
  answers = {},
  activeProgram = null,
  previousProgramMeta = null,
  getWorkoutForDate = null,
  isGymMode = false,
  garminDailyMetrics = null,
  programs = [],
  getExerciseNameById = null
} = {}) {
  const data = snapshot || {};
  const endYmd = todayYmd();
  const start28 = windowStart28(endYmd);

  const journeyStart =
    data?.trainingPrefs?.journeyStartYmd && /^\d{4}-\d{2}-\d{2}$/.test(String(data.trainingPrefs.journeyStartYmd))
      ? String(data.trainingPrefs.journeyStartYmd).slice(0, 10)
      : deriveJourneyStartYmd(data);

  const tenureDays = journeyStart ? daysBetweenInclusive(journeyStart, endYmd) : 0;
  const activeDays28 = countUniqueDaysWithActivityInWindow(data, start28, endYmd);

  const repsFull = buildTotalStrengthRepsByDate(data);
  let lifetimeReps = 0;
  repsFull.forEach((v) => {
    lifetimeReps += Number(v) || 0;
  });

  const maturity = resolveEvidenceMaturity({ activeDays28, tenureDays, lifetimeReps });

  const expectedWeekly = Math.max(
    2,
    Math.min(7, Array.isArray(answers?.availableTrainingDays) ? answers.availableTrainingDays.length : 3)
  );
  const expected28 = (expectedWeekly * 28) / 7;
  const regularityScore = Math.min(1, activeDays28 / Math.max(1, expected28));

  const endurance28 = sumEnduranceMinutes28(data, start28, endYmd);
  const stepsSum28 = sumSteps28(data, start28, endYmd, garminDailyMetrics);
  const sessionLoadAlignment28 =
    typeof getWorkoutForDate === 'function'
      ? aggregateSessionLoadAlignment28(data, start28, endYmd, getWorkoutForDate, isGymMode)
      : null;

  const programMeta = activeProgram?.quizGenerationMeta || previousProgramMeta || null;
  let scheduleEmphasis = inferScheduleRepEmphasis(activeProgram?.schedule);
  const loggedEmphasis = inferLoggedRepEmphasis(data, start28, endYmd);
  let programWeeks = programWeeksElapsed(activeProgram, endYmd);
  const generationMode = programMeta?.generationMode || null;
  const restGap14 = countRestGapDays(data, endYmd, 14);

  const goal = answers?.goalPhysique || 'balanced_functional';
  const prevGoal = previousProgramMeta?.quizGoalAtGeneration || null;
  const goalChanged = prevGoal && prevGoal !== goal;

  const whyLines = [];
  const adjustments = {
    volumeMulDelta: 0,
    maxExercisesDelta: 0,
    repRangeOverride: null,
    suppressPlyo: false,
    adherenceVolumeCut: false
  };

  let referencedProgramAnalysis = null;
  const progAns = answers?.existingProgramInApp;
  if (progAns?.hasProgram === 'yes' && progAns?.programId) {
    const ref = (programs || []).find((p) => String(p.id) === String(progAns.programId));
    if (ref) {
      referencedProgramAnalysis = analyzeProgramForCoach(ref, data, getExerciseNameById, answers);
      const progAdj = programAnalysisToCoachAdjustments(referencedProgramAnalysis, answers);
      if (progAdj.volumeMulDelta) adjustments.volumeMulDelta += progAdj.volumeMulDelta;
      if (progAdj.maxExercisesDelta) adjustments.maxExercisesDelta += progAdj.maxExercisesDelta;
      progAdj.whyLines.forEach((line) => {
        if (line && !whyLines.includes(line)) whyLines.push(line);
      });
      programWeeks = Math.max(programWeeks, Math.floor((referencedProgramAnalysis.programAgeDays || 0) / 7));
      if (referencedProgramAnalysis.emphasis === 'force') scheduleEmphasis = 'force';
      else if (referencedProgramAnalysis.emphasis === 'volume') scheduleEmphasis = 'volume';
    }
  }

  const forceBlockWeeks =
    programWeeks >= FORCE_BLOCK_WEEKS_THRESHOLD &&
    (scheduleEmphasis === 'force' ||
      loggedEmphasis === 'force' ||
      generationMode === 'performance_hybrid' ||
      FORCE_GOALS.has(goal));

  if (maturity === 'none') {
    whyLines.push(
      'Premier cycle calé sur ton quiz : dès que tu coches des séances, les prochains programmes pourront s’appuyer sur ton historique réel.'
    );
  } else if (maturity === 'sparse') {
    whyLines.push(
      `Quelques séances déjà enregistrées (${activeDays28} jour(s) actif(s) sur 28) : ajustements légers, le quiz reste la base principale.`
    );
  } else {
    whyLines.push(
      `Historique suffisant (${activeDays28} jours actifs / 28, parcours ~${tenureDays} j) : le prochain cycle intègre tes reps et ta régularité.`
    );
  }

  if (maturity !== 'none') {
    if (regularityScore < 0.45 && activeDays28 >= 2) {
      adjustments.volumeMulDelta -= 0.08;
      adjustments.adherenceVolumeCut = true;
      whyLines.push(
        'Régularité en dessous de ce que tu vises au quiz : volume légèrement réduit pour favoriser l’adhérence.'
      );
    } else if (regularityScore > 0.85 && maturity === 'rich') {
      adjustments.volumeMulDelta += 0.04;
      whyLines.push('Bonne régularité récente : léger renfort du volume sur ce cycle.');
    }

    if (restGap14 >= 10 && maturity !== 'none') {
      adjustments.volumeMulDelta -= 0.06;
      adjustments.suppressPlyo = true;
      whyLines.push('Plusieurs jours sans activité récemment : reprise prudente (volume et pliométrie allégés).');
    }
  }

  if (maturity === 'rich' && forceBlockWeeks && VOLUME_GOALS.has(goal)) {
    adjustments.volumeMulDelta += 0.07;
    adjustments.maxExercisesDelta += 1;
    adjustments.repRangeOverride = '8–15 selon exo';
    whyLines.push(
      `Tu es en phase plutôt force depuis ~${programWeeks} semaine(s) et ton objectif actuel pousse vers le volume : prochain cycle orienté hypertrophie / répétitions.`
    );
  }

  if (maturity === 'rich' && FORCE_GOALS.has(goal) && loggedEmphasis === 'volume' && programWeeks >= 3) {
    adjustments.repRangeOverride = '4–8 (force) / 8–12 (accessoires)';
    adjustments.volumeMulDelta -= 0.04;
    whyLines.push(
      'Tes séances récentes montrent beaucoup de reps par série : on réoriente vers des charges plus lourdes et moins de volume inutile.'
    );
  }

  if (goalChanged && maturity !== 'none') {
    whyLines.push('Objectif quiz mis à jour depuis le dernier programme : structure recalibrée en conséquence.');
  }

  if (maturity !== 'none' && endurance28.minutes >= 90 && answers?.cardioTrainingDesire !== 'minimal') {
    adjustments.maxDedicatedCardioHint = Math.min(4, Math.ceil(endurance28.minutes / 45));
    if (endurance28.sessions >= 4) {
      whyLines.push(
        `Cardio déjà bien présent dans tes logs (${endurance28.minutes} min / 28 j) : le plan équilibre force et endurance.`
      );
    }
  }

  if (
    maturity === 'rich' &&
    sessionLoadAlignment28?.avgScore0to100 != null &&
    sessionLoadAlignment28.avgScore0to100 < 55 &&
    sessionLoadAlignment28.sessionDaysScored >= 3
  ) {
    adjustments.volumeMulDelta -= 0.05;
    whyLines.push(
      'Écart fréquent entre prévu et réalisé (séries/reps) : fourchettes un peu plus souples sur ce cycle.'
    );
  } else if (
    maturity === 'rich' &&
    sessionLoadAlignment28?.avgScore0to100 != null &&
    sessionLoadAlignment28.avgScore0to100 > 88 &&
    sessionLoadAlignment28.sessionDaysScored >= 3
  ) {
    adjustments.volumeMulDelta += 0.03;
  }

  if (maturity !== 'none' && stepsSum28 > 120000 && answers?.goalPhysique === 'endurance_lean') {
    whyLines.push('Beaucoup de marche / pas enregistrés : séances structurées complémentaires, pas redondantes.');
  }

  const lift28 = aggregateLiftVolumeKgByDate(data);
  let vol28 = 0;
  lift28.forEach((v, k) => {
    if (k >= start28 && k <= endYmd) vol28 += v;
  });

  return {
    maturity,
    journeyStartYmd: journeyStart,
    tenureDays,
    activeDays28,
    regularityScore: Math.round(regularityScore * 100) / 100,
    restGap14,
    lifetimeReps: Math.round(lifetimeReps),
    volumeKgReps28: Math.round(vol28),
    enduranceMinutes28: endurance28.minutes,
    enduranceSessions28: endurance28.sessions,
    stepsSum28,
    sessionLoadAlignment28,
    programWeeks,
    scheduleEmphasis,
    loggedEmphasis,
    generationMode,
    goalChanged,
    forceBlockWeeks,
    referencedProgramAnalysis,
    adjustments,
    whyLines: whyLines.slice(0, 6)
  };
}

/**
 * Fusionne les ajustements historiques dans les deformers coach.
 * @param {import('./quizCoachPipeline').ArchetypeDeformers} deformers
 * @param {ReturnType<typeof buildTrainingEvidence>} evidence
 */
export function applyTrainingEvidenceToDeformers(deformers, evidence) {
  if (!deformers || !evidence || evidence.maturity === 'none') {
    return { ...deformers };
  }
  const a = evidence.adjustments || {};
  const next = {
    ...deformers,
    preferredGroupWeights: { ...deformers.preferredGroupWeights }
  };
  /* volumeMulDelta → quizGlobalLoadEngine (signal history_delta), pas ici */
  if (a.maxExercisesDelta) {
    next.maxExercisesPerSession = Math.min(10, (next.maxExercisesPerSession || 7) + a.maxExercisesDelta);
  }
  if (a.repRangeOverride) {
    next.repRangeOverride = a.repRangeOverride;
  }
  if (a.suppressPlyo) {
    next.allowPlyo = false;
  }
  if (a.maxDedicatedCardioHint != null && Number.isFinite(a.maxDedicatedCardioHint)) {
    const cur = next.maxDedicatedCardioDays;
    if (cur == null) next.maxDedicatedCardioDays = a.maxDedicatedCardioHint;
    else next.maxDedicatedCardioDays = Math.max(cur, a.maxDedicatedCardioHint);
  }
  return next;
}
