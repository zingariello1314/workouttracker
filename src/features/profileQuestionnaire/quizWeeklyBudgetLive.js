/**
 * Boucle budgets live v6.2a (SPEC §14.5) — ajustement semaine N+1 depuis adhérence / manques.
 * Lecture seule sur le programme figé ; pas de regénération du schedule.
 */

import { detectMissedSessionVolumeFactor } from './quizProgressionApply';
import { computeProgramWeekIndex1 } from './quizProgramWeek';

const MS_DAY = 86400000;
const DAY_NAMES_FR = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

export const LIVE_BUDGET_LIMITS = {
  strengthMulMin: 0.9,
  strengthMulMax: 1.05,
  recoveryDeltaMin: -0.08,
  recoveryDeltaMax: 0.03,
  runKmMulMin: 0.88,
  runKmMulMax: 1.03
};

function ymdFromDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function ymdAddDays(ymd, delta) {
  const d = new Date(
    Number(ymd.slice(0, 4)),
    Number(ymd.slice(5, 7)) - 1,
    Number(ymd.slice(8, 10))
  );
  d.setDate(d.getDate() + delta);
  return ymdFromDate(d);
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function round3(n) {
  return Math.round(n * 1000) / 1000;
}

function dayHadActivity(snapshot, ymd) {
  const checked = snapshot?.checkedExercises || {};
  if (Object.keys(checked).some((k) => k.startsWith(`${ymd}_`) && checked[k])) return true;
  const reps = snapshot?.reps || {};
  return Object.keys(reps).some((k) => k.startsWith(`${ymd}_`) && Number(reps[k]) > 0);
}

/**
 * Adhérence sur jours d’entraînement prévus dans [startYmd, endYmd].
 */
export function adherencePctForWindow(program, snapshot, startYmd, endYmd) {
  const schedule = program?.schedule;
  if (!schedule || endYmd < startYmd) return null;
  let planned = 0;
  let done = 0;
  let cur = startYmd;
  while (cur <= endYmd) {
    const d = new Date(
      Number(cur.slice(0, 4)),
      Number(cur.slice(5, 7)) - 1,
      Number(cur.slice(8, 10))
    );
    const name = DAY_NAMES_FR[d.getDay()];
    if (schedule[name]?.active) {
      planned += 1;
      if (dayHadActivity(snapshot, cur)) done += 1;
    }
    cur = ymdAddDays(cur, 1);
  }
  if (planned < 2) return null;
  return Math.round((done / planned) * 100);
}

/**
 * Adhérence sur les 7 derniers jours et la semaine précédente.
 */
export function computeTwoWeekAdherence(program, snapshot, endYmd) {
  const w1End = endYmd;
  const w1Start = ymdAddDays(endYmd, -6);
  const w0End = ymdAddDays(w1Start, -1);
  const w0Start = ymdAddDays(w0End, -6);
  return {
    recent: adherencePctForWindow(program, snapshot, w1Start, w1End),
    previous: adherencePctForWindow(program, snapshot, w0Start, w0End)
  };
}

/**
 * Baseline figée à la génération pour le live.
 * @param {object} weeklyPlanner
 */
export function freezeLiveBudgetBaseline(weeklyPlanner) {
  const b = weeklyPlanner?.budgets;
  if (!b) return null;
  return {
    missionId: b.missionId,
    recoveryBudget: Number(b.recoveryBudget) || 1,
    strengthFamilies: { ...(b.strengthFamilies || {}) },
    runKmTarget: b.run?.kmTarget ?? null,
    capturedAt: new Date().toISOString()
  };
}

/**
 * @param {object} input
 * @param {object} input.program
 * @param {object} [input.snapshot]
 * @param {string} [input.sessionYmd]
 * @param {object} [input.trainingEvidence]
 */
export function computeLiveBudgetAdjustment(input = {}) {
  const { program, snapshot = {}, sessionYmd, trainingEvidence = null } = input;
  const meta = program?.quizGenerationMeta;
  const baseline =
    meta?.weeklyPlanner?.liveBudgetBaseline ||
    freezeLiveBudgetBaseline(meta?.weeklyPlanner) ||
    null;

  const adjustments = [];
  let strengthVolumeMul = 1;
  let recoveryBudgetDelta = 0;
  let runKmMul = 1;
  let softenRunQuality = false;

  if (!baseline || meta?.liveCoachEnabled === false) {
    return {
      strengthVolumeMul: 1,
      recoveryBudgetDelta: 0,
      runKmMul: 1,
      softenRunQuality: false,
      adjustments,
      summaryFr: null,
      weekIndex: computeProgramWeekIndex1(program, sessionYmd || new Date())
    };
  }

  const endYmd =
    sessionYmd && /^\d{4}-\d{2}-\d{2}$/.test(String(sessionYmd))
      ? String(sessionYmd).slice(0, 10)
      : ymdFromDate(new Date());

  const twoWeek = computeTwoWeekAdherence(program, snapshot, endYmd);
  const missedFactor = detectMissedSessionVolumeFactor(snapshot, program?.schedule, 14);

  if (missedFactor < 1) {
    strengthVolumeMul *= missedFactor;
    adjustments.push({
      signal: 'missed_sessions',
      action: 'scale_volume',
      factor: missedFactor,
      reasonFr: 'Plusieurs séances prévues non faites — volume de la séance ajusté à la baisse.'
    });
  }

  const lowRecent = twoWeek.recent != null && twoWeek.recent < 60;
  const lowPrev = twoWeek.previous != null && twoWeek.previous < 60;
  if (lowRecent && lowPrev) {
    recoveryBudgetDelta = -0.05;
    strengthVolumeMul *= 0.95;
    softenRunQuality = true;
    adjustments.push({
      signal: 'low_adherence_2w',
      action: 'recovery_down_quality_soft',
      reasonFr: `Adhérence faible 2 semaines d’affilée (~${twoWeek.recent} % / ${twoWeek.previous} %) — récup et charge modérées.`
    });
  } else if (lowRecent && !lowPrev) {
    strengthVolumeMul *= 0.97;
    adjustments.push({
      signal: 'low_adherence_1w',
      action: 'scale_volume_light',
      reasonFr: `Semaine récente difficile (~${twoWeek.recent} % adhérence) — léger frein volume.`
    });
  }

  const highRecent = twoWeek.recent != null && twoWeek.recent >= 85;
  const highPrev = twoWeek.previous != null && twoWeek.previous >= 80;
  if (highRecent && highPrev && (trainingEvidence?.maturity === 'rich' || twoWeek.recent >= 90)) {
    strengthVolumeMul *= 1.02;
    adjustments.push({
      signal: 'high_adherence_2w',
      action: 'boost_priority_2pct',
      reasonFr: 'Très bonne assiduité sur 2 semaines — léger bonus volume (priorités quiz).'
    });
  }

  if (trainingEvidence?.adjustments?.adherenceVolumeCut) {
    strengthVolumeMul *= 0.96;
  }

  strengthVolumeMul = clamp(
    strengthVolumeMul,
    LIVE_BUDGET_LIMITS.strengthMulMin,
    LIVE_BUDGET_LIMITS.strengthMulMax
  );
  recoveryBudgetDelta = clamp(
    recoveryBudgetDelta,
    LIVE_BUDGET_LIMITS.recoveryDeltaMin,
    LIVE_BUDGET_LIMITS.recoveryDeltaMax
  );
  runKmMul = clamp(runKmMul, LIVE_BUDGET_LIMITS.runKmMulMin, LIVE_BUDGET_LIMITS.runKmMulMax);

  const summaryFr =
    adjustments.length > 0
      ? adjustments.map((a) => a.reasonFr).join(' ')
      : null;

  return {
    strengthVolumeMul: round3(strengthVolumeMul),
    recoveryBudgetDelta: round3(recoveryBudgetDelta),
    runKmMul: round3(runKmMul),
    softenRunQuality,
    adjustments,
    summaryFr,
    twoWeekAdherence: twoWeek,
    weekIndex: computeProgramWeekIndex1(program, endYmd),
    baselineRecovery: baseline.recoveryBudget
  };
}

/**
 * Stagnation repères vs logs (regen quiz).
 */
export function detectBaselineStagnation(snapshot, program, answers) {
  const startRaw = program?.startDate || program?.createdAt;
  if (!startRaw) return { stagnant: false, reasonFr: null };
  const start = new Date(startRaw);
  const ageDays = Math.floor((Date.now() - start.getTime()) / MS_DAY);
  if (ageDays < 28) return { stagnant: false, reasonFr: null };

  const b = answers?.strengthBaselineMaxes || program?.quizGenerationMeta?.quizGoalAtGeneration;
  const pullBaseline = Number(answers?.strengthBaselineMaxes?.pullupsMax) || 0;
  if (pullBaseline < 3) return { stagnant: false, reasonFr: null };

  const reps = snapshot?.reps || {};
  const pullReps = [];
  Object.keys(reps).forEach((k) => {
    if (!/traction|pull/i.test(k)) return;
    const r = Number(reps[k]) || 0;
    if (r > 0) pullReps.push({ date: k.slice(0, 10), r });
  });
  pullReps.sort((a, b) => a.date.localeCompare(b.date));
  if (pullReps.length < 6) return { stagnant: false, reasonFr: null };

  const firstHalf = pullReps.slice(0, Math.floor(pullReps.length / 2));
  const secondHalf = pullReps.slice(Math.floor(pullReps.length / 2));
  const avg = (arr) => arr.reduce((s, x) => s + x.r, 0) / Math.max(1, arr.length);
  const delta = avg(secondHalf) - avg(firstHalf);
  if (delta < 1 && avg(secondHalf) <= pullBaseline + 2) {
    return {
      stagnant: true,
      reasonFr:
        'Peu de progression sur les tractions malgré un mois de programme — une regénération quiz peut recaler le plan.'
    };
  }
  return { stagnant: false, reasonFr: null };
}
