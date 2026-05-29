/**
 * Récap affiché à la fin du quiz : réponses, placement nuancé, métriques Sport.
 */

import { PROFILE_QUESTION_DEFS } from './constants';
import {
  deriveJourneyStartYmd,
  countUniqueDaysWithActivityInWindow,
  daysBetweenInclusive
} from '../../utils/sport/recapUserAssessment';
import { calendarWeekRange, calendarMonthRange } from '../../utils/sport/recapContextualSuggestions';
import { buildTotalStrengthRepsByDate, buildMergedStepsByDate } from '../../utils/sport/recapDailyChartData';
import { aggregateLiftVolumeKgByDate } from '../../utils/exerciseLoadVolume';
import { sumLiftVolumeKgBetween, sumRepsBetween } from '../../utils/sport/recapCrossCoachAggregate';
import { computeQuizLevelWellnessModifier, getProgramGoalLabel } from './quizInfluence';
import { analyzeProgramForCoach } from './quizProgramAnalyzer';
import {
  placementBandForScore,
  situateRunningKm,
  situateTenureDays,
  situateTotalReps,
  situateTrainingDaysPerWeek,
  situateVolumeKgReps
} from './quizMetricTiers';
import { isMockEnduranceSession, normalizeDateString } from '../../utils/calendarUtils';

function todayYmd() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

function annualizedDaysPerWeek(activeDays, windowDays) {
  if (windowDays <= 0) return 0;
  return Math.round(((activeDays / windowDays) * 7) * 10) / 10;
}

function sumRunningKmBetween(data, startYmd, endYmd) {
  let km = 0;
  const arr = data?.enduranceData?.sessions?.running;
  if (!Array.isArray(arr)) return 0;
  arr.forEach((s) => {
    if (isMockEnduranceSession(s)) return;
    const ds = normalizeDateString(s?.date);
    if (!ds || ds < startYmd || ds > endYmd) return;
    const d = parseFloat(String(s.distance ?? '').replace(',', '.'));
    if (Number.isFinite(d) && d > 0) km += d;
  });
  return Math.round(km * 10) / 10;
}

function experienceQuizScore(answers) {
  const map = {
    beginner_total: 18,
    beginner_0_3m: 28,
    intermediate_3_12m: 48,
    advanced_1_3y: 62,
    expert_3y_plus: 72
  };
  return map[answers?.experienceLevel] ?? 40;
}

function baselinesQuizScore(answers) {
  const b = answers?.strengthBaselineMaxes;
  if (!b || typeof b !== 'object') return 35;
  const vals = [
    b.pushupsMax,
    b.pullupsMax,
    b.dipsMax,
    b.australianPullupsMax,
    b.plankSecMax
  ].filter((x) => x != null && Number(x) > 0);
  if (vals.length === 0) return 35;
  let s = 40 + vals.length * 6;
  if ((b.pullupsMax || 0) >= 8) s += 8;
  if ((b.pushupsMax || 0) >= 25) s += 6;
  if ((b.plankSecMax || 0) >= 90) s += 5;
  return Math.min(85, s);
}

function formatAnswerLabel(question, value) {
  if (value == null) return '—';
  if (question.type === 'vitals' && typeof value === 'object') {
    const bits = [];
    if (value.sex === 'male') bits.push('Homme');
    else if (value.sex === 'female') bits.push('Femme');
    if (value.age != null) bits.push(`${value.age} ans`);
    if (value.weightKg != null) bits.push(`${value.weightKg} kg`);
    if (value.heightCm != null) bits.push(`${value.heightCm} cm`);
    return bits.length ? bits.join(' · ') : '—';
  }
  if (question.type === 'strengthBaselines' && typeof value === 'object') {
    const bits = [];
    if (value.pushupsMax != null) bits.push(`Pompes ${value.pushupsMax}`);
    if (value.pullupsMax != null) bits.push(`Tractions ${value.pullupsMax}`);
    if (value.dipsMax != null) bits.push(`Dips ${value.dipsMax}`);
    if (value.plankSecMax != null) bits.push(`Gainage ${value.plankSecMax}s`);
    return bits.length ? bits.join(' · ') : '—';
  }
  if (question.type === 'existingProgram' && typeof value === 'object') {
    if (value.hasProgram === 'no') return 'Non — pas de programme en cours dans l’app';
    if (value.hasProgram === 'yes') return value.programName ? `Oui — ${value.programName}` : 'Oui (programme sélectionné)';
    return '—';
  }
  if (Array.isArray(value)) {
    const labels = (question.options || []).filter((o) => value.includes(o.key)).map((o) => o.label);
    return labels.join(', ') || value.join(', ');
  }
  const opt = (question.options || []).find((o) => o.key === value);
  return opt?.label || String(value);
}

/**
 * @param {object} input
 * @param {object} input.answers
 * @param {object} [input.snapshot]
 * @param {object[]} [input.programs]
 * @param {(id: string) => string} [input.getExerciseNameById]
 * @param {object|null} [input.garminDailyMetrics]
 */
export function buildQuizCompletionRecap({
  answers = {},
  snapshot = null,
  programs = [],
  getExerciseNameById,
  garminDailyMetrics = null
}) {
  const data = snapshot || {};
  const endYmd = todayYmd();
  const week = calendarWeekRange(endYmd);
  const month = calendarMonthRange(endYmd);
  const d28 = new Date();
  d28.setDate(d28.getDate() - 27);
  const window28Start = `${d28.getFullYear()}-${String(d28.getMonth() + 1).padStart(2, '0')}-${String(d28.getDate()).padStart(2, '0')}`;

  const journeyStart =
    data?.trainingPrefs?.journeyStartYmd && /^\d{4}-\d{2}-\d{2}$/.test(String(data.trainingPrefs.journeyStartYmd))
      ? String(data.trainingPrefs.journeyStartYmd).slice(0, 10)
      : deriveJourneyStartYmd(data);

  const tenureDays = journeyStart ? daysBetweenInclusive(journeyStart, endYmd) : 0;
  const daysWeek = countUniqueDaysWithActivityInWindow(data, week.startYmd, week.endYmd);
  const daysMonth = countUniqueDaysWithActivityInWindow(data, month.startYmd, month.endYmd);
  const daysSinceStart = journeyStart
    ? countUniqueDaysWithActivityInWindow(data, journeyStart, endYmd)
    : 0;

  const liftMap = aggregateLiftVolumeKgByDate(data);
  const repsMap = buildTotalStrengthRepsByDate(data);
  const volWeek = Math.round(sumLiftVolumeKgBetween(liftMap, week.startYmd, week.endYmd));
  const volMonth = Math.round(sumLiftVolumeKgBetween(liftMap, month.startYmd, month.endYmd));
  const volSince = journeyStart ? Math.round(sumLiftVolumeKgBetween(liftMap, journeyStart, endYmd)) : 0;
  const vol28 = Math.round(sumLiftVolumeKgBetween(liftMap, window28Start, endYmd));

  const repsWeek = Math.round(sumRepsBetween(repsMap, week.startYmd, week.endYmd));
  const repsMonth = Math.round(sumRepsBetween(repsMap, month.startYmd, month.endYmd));
  const repsSince = journeyStart ? Math.round(sumRepsBetween(repsMap, journeyStart, endYmd)) : 0;

  const kmWeek = sumRunningKmBetween(data, week.startYmd, week.endYmd);
  const kmMonth = sumRunningKmBetween(data, month.startYmd, month.endYmd);
  const kmSince = journeyStart ? sumRunningKmBetween(data, journeyStart, endYmd) : 0;

  const stepsMap = buildMergedStepsByDate(garminDailyMetrics, data?.enduranceData?.manualDailyWalkByDate);
  let stepsMonth = 0;
  stepsMap.forEach((v, k) => {
    if (k >= month.startYmd && k <= month.endYmd) stepsMonth += v;
  });

  const weekDaysPerWeek = annualizedDaysPerWeek(daysWeek, 7);
  const monthDaysPerWeek = annualizedDaysPerWeek(
    daysMonth,
    Math.max(1, daysBetweenInclusive(month.startYmd, month.endYmd))
  );

  const metrics = [
    {
      id: 'days_week',
      label: 'Jours d’entraînement (semaine en cours)',
      value: daysWeek,
      display: `${daysWeek} j (~${weekDaysPerWeek} j/sem.)`,
      situation: situateTrainingDaysPerWeek(weekDaysPerWeek)
    },
    {
      id: 'days_month',
      label: 'Jours d’entraînement (mois en cours)',
      value: daysMonth,
      display: `${daysMonth} j (~${monthDaysPerWeek} j/sem.)`,
      situation: situateTrainingDaysPerWeek(monthDaysPerWeek)
    },
    {
      id: 'days_since',
      label: 'Jours actifs depuis la 1ʳᵉ saisie',
      value: daysSinceStart,
      display: journeyStart
        ? `${daysSinceStart} j (depuis le ${journeyStart.split('-').reverse().join('/')})`
        : 'Aucune saisie pour l’instant',
      situation: situateTenureDays(tenureDays)
    },
    {
      id: 'kg_week',
      label: 'Kg soulevés (semaine, reps × charge)',
      value: volWeek,
      display: volWeek > 0 ? `${volWeek.toLocaleString('fr-FR')} kg×reps` : '—',
      situation: situateVolumeKgReps(volWeek)
    },
    {
      id: 'kg_month',
      label: 'Kg soulevés (mois en cours)',
      value: volMonth,
      display: volMonth > 0 ? `${volMonth.toLocaleString('fr-FR')} kg×reps` : '—',
      situation: situateVolumeKgReps(volMonth)
    },
    {
      id: 'kg_since',
      label: 'Kg soulevés (depuis la 1ʳᵉ saisie)',
      value: volSince,
      display: volSince > 0 ? `${volSince.toLocaleString('fr-FR')} kg×reps` : '—',
      situation: situateVolumeKgReps(volSince)
    },
    {
      id: 'km_week',
      label: 'Km courus (semaine)',
      value: kmWeek,
      display: kmWeek > 0 ? `${kmWeek} km` : '—',
      situation: situateRunningKm(kmWeek)
    },
    {
      id: 'km_month',
      label: 'Km courus (mois)',
      value: kmMonth,
      display: kmMonth > 0 ? `${kmMonth} km` : '—',
      situation: situateRunningKm(kmMonth)
    },
    {
      id: 'km_since',
      label: 'Km courus (depuis la 1ʳᵉ saisie)',
      value: kmSince,
      display: kmSince > 0 ? `${kmSince} km` : '—',
      situation: situateRunningKm(kmSince)
    },
    {
      id: 'reps_month',
      label: 'Reps force (mois)',
      value: repsMonth,
      display: repsMonth > 0 ? `${repsMonth.toLocaleString('fr-FR')} reps` : '—',
      situation: situateTotalReps(repsMonth)
    }
  ];

  if (stepsMonth > 0) {
    metrics.push({
      id: 'steps_month',
      label: 'Pas (mois, max Garmin / manuel)',
      value: stepsMonth,
      display: stepsMonth.toLocaleString('fr-FR'),
      situation: situateTenureDays(Math.min(100, Math.round(stepsMonth / 8000)))
    });
  }

  const metricScore =
    metrics.length > 0
      ? metrics.reduce((a, m) => a + (m.situation?.score || 40), 0) / metrics.length
      : 25;

  const quizScore =
    experienceQuizScore(answers) * 0.45 +
    baselinesQuizScore(answers) * 0.35 +
    (computeQuizLevelWellnessModifier(answers) + 50) * 0.2;

  const hasLogs = daysSinceStart > 0 || vol28 > 0 || repsMonth > 0;
  const dataWeight = hasLogs ? 0.52 : 0.12;
  const quizWeight = 1 - dataWeight;

  let score0to100 = Math.round(quizScore * quizWeight + metricScore * dataWeight);
  score0to100 = Math.max(8, Math.min(96, score0to100));

  const placement = placementBandForScore(score0to100);

  const experienceLabels = {
    beginner_total: 'Débutant complet (quiz)',
    beginner_0_3m: 'Novice (< 3 mois)',
    intermediate_3_12m: 'Intermédiaire court',
    advanced_1_3y: 'Intermédiaire confirmé (1–3 ans)',
    expert_3y_plus: 'Expérience longue (3 ans+)'
  };

  const quizSummary = PROFILE_QUESTION_DEFS.filter((q) => {
    const v = answers?.[q.id];
    if (v == null) return false;
    if (q.type === 'vitals' || q.type === 'strengthBaselines') {
      return formatAnswerLabel(q, v) !== '—';
    }
    if (q.type === 'existingProgram') return true;
    if (Array.isArray(v)) return v.length > 0;
    return true;
  }).map((q) => ({
    id: q.id,
    title: q.title,
    valueLabel: formatAnswerLabel(q, answers[q.id])
  }));

  let existingProgramAnalysis = null;
  const progAns = answers?.existingProgramInApp;
  if (progAns?.hasProgram === 'yes' && progAns?.programId) {
    const prog = (programs || []).find((p) => String(p.id) === String(progAns.programId));
    if (prog) {
      existingProgramAnalysis = analyzeProgramForCoach(prog, data, getExerciseNameById, answers);
    }
  }

  const goalLabel = getProgramGoalLabel(answers?.goalPhysique || 'balanced_functional');

  return {
    placement: {
      score0to100,
      bandId: placement.id,
      bandLabel: placement.label,
      bandDescription: placement.description,
      experienceLabel: experienceLabels[answers?.experienceLevel] || '—',
      goalLabel,
      dataTrust: hasLogs ? 'Historique Sport pris en compte' : 'Peu de saisies — placement surtout depuis le quiz'
    },
    quizSummary,
    metrics,
    journeyStartYmd: journeyStart,
    hasActivityLogs: hasLogs,
    existingProgramAnalysis
  };
}
