/**
 * Application progression cycle + séances manquées + calibrage reps (SPEC §6.6–6.7).
 */

import { QUIZ_SCHEDULE_DAY_ORDER } from './trainingScheduleFromQuiz';
import { scaleSeriesForProgressionPhase, resolveCycleWeekMeta } from './quizProgression';
import { computeProgramWeekIndex1 } from './quizProgramWeek';
import { parseSetsCount, parseRepsMid } from './quizSessionLimits';

const DAY_NAMES_FR = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

function ymdFromDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function scheduleDayForYmd(schedule, ymd) {
  const dow = new Date(
    Number(ymd.slice(0, 4)),
    Number(ymd.slice(5, 7)) - 1,
    Number(ymd.slice(8, 10))
  ).getDay();
  return schedule?.[DAY_NAMES_FR[dow]] || null;
}

/**
 * Facteur volume si ≥2 séances prévues manquées sur 14 j (SPEC : −20 %).
 */
export function detectMissedSessionVolumeFactor(snapshot, schedule, lookbackDays = 14) {
  if (!schedule || typeof schedule !== 'object') return 1;
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - (lookbackDays - 1));

  let planned = 0;
  let missed = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const ymd = ymdFromDate(cur);
    const daySched = scheduleDayForYmd(schedule, ymd);
    if (daySched?.active === true) {
      planned += 1;
      const any = Object.keys(snapshot?.checkedExercises || {}).some(
        (k) => k.startsWith(`${ymd}_`) && snapshot.checkedExercises[k]
      );
      if (!any) missed += 1;
    }
    cur.setDate(cur.getDate() + 1);
  }

  if (planned < 4) return 1;
  if (missed >= 2 && missed / planned >= 0.35) return 0.8;
  return 1;
}

/**
 * Calibre séries depuis patterns programme analysé (nom ≈ match).
 */
export function calibrateSeriesFromProgramPatterns(exercise, patterns = []) {
  if (!exercise || !patterns?.length) return exercise;
  const name = String(exercise.name || '').toLowerCase();
  const hit = patterns.find((p) => {
    const pn = String(p.name || '').toLowerCase();
    return pn && (name.includes(pn.slice(0, 6)) || pn.includes(name.slice(0, 6)));
  });
  if (!hit || !(hit.avgReps > 0)) return exercise;

  const sets = parseSetsCount(exercise.series);
  const targetReps = Math.max(4, Math.min(20, Math.round(hit.avgReps)));
  const hi = Math.min(22, targetReps + 2);
  return {
    ...exercise,
    series: targetReps === hi ? `${sets}×${targetReps}` : `${sets}×${targetReps}-${hi}`,
    notes: [exercise.notes, `Calibré sur tes ${hit.sessions} séances récentes (~${hit.avgReps} reps).`]
      .filter(Boolean)
      .join(' ')
  };
}

function scaleExerciseSeries(ex, weekMeta, missedFactor) {
  if (!ex?.series || /min|sec|course/i.test(String(ex.series))) return ex;
  let series = scaleSeriesForProgressionPhase(ex.series, weekMeta);
  if (missedFactor < 1) {
    series = scaleSeriesForProgressionPhase(series, {
      volumeFactor: missedFactor,
      phase: 'recovery'
    });
  }
  return { ...ex, series };
}

/**
 * Applique progression semaine 1 (+ facteur séances manquées) sur tout le schedule généré.
 */
export function applyCycleProgressionToSchedule(schedule, totalWeeks, opts = {}) {
  const weekMeta = resolveCycleWeekMeta(totalWeeks, 1);
  const combinedFactor = Number(opts.volumeFactor);
  if (Number.isFinite(combinedFactor) && combinedFactor > 0) {
    weekMeta.volumeFactor = Math.round(combinedFactor * (weekMeta.volumeFactor || 1) * 1000) / 1000;
  }
  const missedFactor = Number(opts.missedVolumeFactor) || 1;

  QUIZ_SCHEDULE_DAY_ORDER.forEach((dayKey) => {
    const day = schedule?.[dayKey];
    if (!day?.active || !Array.isArray(day.exercises)) return;
    day.exercises = day.exercises.map((ex) => scaleExerciseSeries(ex, weekMeta, missedFactor));
    if (day.salleVariants) {
      ['semaineA', 'semaineB'].forEach((vk) => {
        const list = day.salleVariants[vk]?.exercises;
        if (!Array.isArray(list)) return;
        day.salleVariants[vk].exercises = list.map((ex) => scaleExerciseSeries(ex, weekMeta, missedFactor));
      });
    }
  });

  return { weekMeta, missedFactor };
}

/**
 * Progression pour une semaine donnée du cycle (génération ou regen partielle).
 */
export function applyProgressionForWeek(schedule, totalWeeks, weekIndex1, opts = {}) {
  const weekMeta = resolveCycleWeekMeta(totalWeeks, weekIndex1);
  const missedFactor = Number(opts.missedVolumeFactor) || 1;
  QUIZ_SCHEDULE_DAY_ORDER.forEach((dayKey) => {
    const day = schedule?.[dayKey];
    if (!day?.active || !Array.isArray(day.exercises)) return;
    day.exercises = day.exercises.map((ex) => scaleExerciseSeries(ex, weekMeta, missedFactor));
    if (day.salleVariants) {
      ['semaineA', 'semaineB'].forEach((vk) => {
        const list = day.salleVariants[vk]?.exercises;
        if (!Array.isArray(list)) return;
        day.salleVariants[vk].exercises = list.map((ex) => scaleExerciseSeries(ex, weekMeta, missedFactor));
      });
    }
  });
  return { weekMeta, week: weekIndex1, missedFactor };
}

export { computeProgramWeekIndex1 };

/**
 * Signaux Phase C : suggérer regénération (2 sem. faibles + stagnation repères).
 */
export function detectCoachRegenerationSignals(snapshot, answers, trainingEvidence = null) {
  const reasons = [];
  let score = 0;

  const reg = Number(trainingEvidence?.regularityScore);
  if (Number.isFinite(reg) && reg < 0.4 && (trainingEvidence?.activeDays28 || 0) >= 2) {
    score += 2;
    reasons.push('Régularité basse sur les 4 dernières semaines.');
  }

  const b = answers?.strengthBaselineMaxes;
  if (b && typeof b === 'object' && trainingEvidence?.maturity === 'rich') {
    const filled = ['pushupsMax', 'pullupsMax', 'dipsMax'].filter((f) => b[f] > 0);
    if (filled.length >= 2 && (trainingEvidence?.totalReps28 || 0) < 400) {
      score += 1;
      reasons.push('Repères déclarés élevés mais peu de reps enregistrées récemment (stagnation possible).');
    }
  }

  if (trainingEvidence?.referencedProgramAnalysis?.adherence?.adherencePct != null) {
    const pct = trainingEvidence.referencedProgramAnalysis.adherence.adherencePct;
    if (pct < 45 && trainingEvidence.referencedProgramAnalysis.programAgeDays >= 21) {
      score += 2;
      reasons.push('Adhérence faible sur le programme actuellement suivi.');
    }
  }

  return {
    suggestRegeneration: score >= 2,
    reasons: reasons.slice(0, 3)
  };
}
