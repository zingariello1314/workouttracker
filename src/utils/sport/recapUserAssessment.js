/**
 * Évaluation agrégée du profil training (Récap).
 * Volume kg×reps : uniquement jours avec volume halie > 0 (voir aggregateLiftVolumeKgByDate).
 */

import { aggregateLiftVolumeKgByDate } from '../exerciseLoadVolume';
import { buildTotalStrengthRepsByDate } from './recapDailyChartData';
import { buildWeightByDateMap } from './recapAssessmentSeries';
import { computeTodaySessionComplexity } from '../todaySessionScore';
import { isMockEnduranceSession, normalizeDateString } from '../calendarUtils';
import { getExerciseDatabaseHit } from '../exerciseHeroContent';
import { normalizeProfileQuestionnaire } from '../../features/profileQuestionnaire/schema';
import { PROFILE_QUESTION_DEFS } from '../../features/profileQuestionnaire/constants';

const MS_DAY = 86400000;

const DAY_NAMES_FR = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

function ymdToUtcMs(y) {
  if (!y || !/^\d{4}-\d{2}-\d{2}$/.test(y)) return NaN;
  return Date.UTC(Number(y.slice(0, 4)), Number(y.slice(5, 7)) - 1, Number(y.slice(8, 10)));
}

/** Incrémente une date calendaire locale (YYYY-MM-DD). */
function ymdAddDaysLocal(ymd, delta) {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(y, m - 1, d + delta);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

function countSeriesOverrideStats28(data, startYmd, endYmd) {
  let daysWithOverride = 0;
  let exerciseTouches = 0;
  let cur = startYmd;
  while (cur <= endYmd) {
    const ov = data?.dailyVariations?.[cur]?.exerciseSeriesOverrides;
    if (ov && typeof ov === 'object') {
      const keys = Object.keys(ov).filter((k) => {
        const v = ov[k];
        return v != null && String(v).trim() !== '';
      });
      if (keys.length > 0) {
        daysWithOverride += 1;
        exerciseTouches += keys.length;
      }
    }
    cur = ymdAddDaysLocal(cur, 1);
  }
  return {
    seriesOverrideDays28: daysWithOverride,
    seriesOverrideExerciseTouches28: exerciseTouches
  };
}

/**
 * Moyenne des scores jour (charge prévue vs réalisée) sur les jours où le programme prévoit au moins un exercice.
 * Le prévu inclut les overrides « séries/reps du jour » (`dailyVariations.exerciseSeriesOverrides`).
 */
function aggregateSessionLoadAlignment28(data, startYmd, endYmd, getWorkoutForDate, isGymMode) {
  const override = countSeriesOverrideStats28(data, startYmd, endYmd);
  if (typeof getWorkoutForDate !== 'function') {
    return {
      avgScore0to100: null,
      sessionDaysScored: 0,
      sessionDaysWithPlan: 0,
      ...override
    };
  }
  let sumScore = 0;
  let countScore = 0;
  let sessionDaysWithPlan = 0;
  let cur = startYmd;
  while (cur <= endYmd) {
    const y = Number(cur.slice(0, 4));
    const m = Number(cur.slice(5, 7));
    const dom = Number(cur.slice(8, 10));
    const dateObj = new Date(y, m - 1, dom);
    const workout = getWorkoutForDate(dateObj);
    const rawList = workout?.exercices || workout?.exercises;
    if (!Array.isArray(rawList) || rawList.length === 0) {
      cur = ymdAddDaysLocal(cur, 1);
      continue;
    }
    sessionDaysWithPlan += 1;
    const c = computeTodaySessionComplexity(dateObj, workout, data, Boolean(isGymMode));
    if (c.score0to100 != null) {
      sumScore += c.score0to100;
      countScore += 1;
    }
    cur = ymdAddDaysLocal(cur, 1);
  }
  return {
    avgScore0to100: countScore > 0 ? Math.round((sumScore / countScore) * 10) / 10 : null,
    sessionDaysScored: countScore,
    sessionDaysWithPlan,
    ...override
  };
}

export function daysBetweenInclusive(startYmd, endYmd) {
  const a = ymdToUtcMs(startYmd);
  const b = ymdToUtcMs(endYmd);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return 0;
  return Math.floor((b - a) / MS_DAY) + 1;
}

function collectCircuitSessionDates(data) {
  const out = [];
  const prog = data?.circuitProgress;
  if (!prog || typeof prog !== 'object') return out;
  Object.keys(prog).forEach((d) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return;
    const dayObj = prog[d];
    if (!dayObj || typeof dayObj !== 'object') return;
    if (Object.keys(dayObj).length > 0) out.push(d);
  });
  return out;
}

function collectEnduranceSessionDates(data) {
  const set = new Set();
  const sessions = data?.enduranceData?.sessions;
  if (!sessions || typeof sessions !== 'object') return [];
  Object.keys(sessions).forEach((type) => {
    const arr = sessions[type];
    if (!Array.isArray(arr)) return;
    arr.forEach((s) => {
      if (isMockEnduranceSession(s)) return;
      const ds = normalizeDateString(s?.date);
      if (ds) set.add(ds);
    });
  });
  return [...set];
}

/**
 * @returns {string|null} YYYY-MM-DD
 */
export function parseCheckedExerciseDatePrefix(key) {
  const m = String(key).match(/^(\d{4}-\d{2}-\d{2})_(.+)$/);
  return m ? m[1] : null;
}

/**
 * Première activité enregistrée (cases cochées, endurance, circuits, volume ou reps).
 * @returns {string|null} YYYY-MM-DD
 */
export function deriveJourneyStartYmd(data) {
  let min = null;
  const consider = (s) => {
    if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(String(s).slice(0, 10))) return;
    const y = String(s).slice(0, 10);
    if (!min || y < min) min = y;
  };

  const checked = data?.checkedExercises || {};
  Object.keys(checked).forEach((k) => {
    if (!checked[k]) return;
    consider(k.slice(0, 10));
  });

  collectEnduranceSessionDates(data).forEach(consider);
  collectCircuitSessionDates(data).forEach(consider);

  const liftMap = aggregateLiftVolumeKgByDate(data);
  liftMap.forEach((v, d) => {
    if (v > 0) consider(d);
  });

  const repsMap = buildTotalStrengthRepsByDate(data);
  repsMap.forEach((v, d) => {
    if (v > 0) consider(d);
  });

  return min;
}

/**
 * Dernière activité connue (mêmes sources que deriveJourneyStartYmd).
 * @returns {string|null} YYYY-MM-DD
 */
export function deriveLastActivityYmd(data) {
  let max = null;
  const consider = (s) => {
    if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(String(s).slice(0, 10))) return;
    const y = String(s).slice(0, 10);
    if (!max || y > max) max = y;
  };

  const checked = data?.checkedExercises || {};
  Object.keys(checked).forEach((k) => {
    if (!checked[k]) return;
    consider(k.slice(0, 10));
  });

  collectEnduranceSessionDates(data).forEach(consider);
  collectCircuitSessionDates(data).forEach(consider);

  const liftMap = aggregateLiftVolumeKgByDate(data);
  liftMap.forEach((v, d) => {
    if (v > 0) consider(d);
  });

  const repsMap = buildTotalStrengthRepsByDate(data);
  repsMap.forEach((v, d) => {
    if (v > 0) consider(d);
  });

  return max;
}

function filterMapToWindow(map, startYmd, endYmd) {
  const out = new Map();
  if (!(map instanceof Map)) return out;
  map.forEach((v, k) => {
    if (k >= startYmd && k <= endYmd) out.set(k, v);
  });
  return out;
}

export function countUniqueDaysWithActivityInWindow(data, startYmd, endYmd) {
  const set = new Set();
  const inWin = (d) => d && d >= startYmd && d <= endYmd;

  Object.keys(data?.checkedExercises || {}).forEach((k) => {
    if (!data.checkedExercises[k]) return;
    const d = parseCheckedExerciseDatePrefix(k);
    if (d && inWin(d)) set.add(d);
  });

  collectEnduranceSessionDates(data).forEach((d) => {
    if (inWin(d)) set.add(d);
  });
  collectCircuitSessionDates(data).forEach((d) => {
    if (inWin(d)) set.add(d);
  });

  aggregateLiftVolumeKgByDate(data).forEach((v, d) => {
    if (v > 0 && inWin(d)) set.add(d);
  });

  buildTotalStrengthRepsByDate(data).forEach((v, d) => {
    if (v > 0 && inWin(d)) set.add(d);
  });

  return set.size;
}

function quizExpectedSessionsPerWeek(answers) {
  const freq = answers?.weeklyTrainingFrequencyCurrent;
  const map = {
    '0': 0.25,
    '1_2': 1.5,
    '3_4': 3.5,
    '5_6': 5.5,
    '7': 7
  };
  return map[freq] != null ? map[freq] : 3;
}

function mapExperienceToLevelBoost(answers) {
  const ex = answers?.experienceLevel;
  const table = {
    beginner_total: 0,
    beginner_0_3m: 8,
    intermediate_3_12m: 18,
    advanced_1_3y: 28,
    expert_3y_plus: 35
  };
  return table[ex] ?? 12;
}

/**
 * @param {(id: string) => string} [getExerciseNameById]
 */
function avgDifficultyFromCheckedExercises(data, windowStart, windowEnd, getExerciseNameById) {
  const contrib = [];
  Object.keys(data?.checkedExercises || {}).forEach((key) => {
    if (!data.checkedExercises[key]) return;
    const d = parseCheckedExerciseDatePrefix(key);
    if (!d || d < windowStart || d > windowEnd) return;
    const m = String(key).match(/^(\d{4}-\d{2}-\d{2})_(.+)$/);
    if (!m) return;
    const tail = m[2];
    if (tail.startsWith('complementary_') || tail.startsWith('stretch_')) return;
    const idPart = String(tail).split('_')[0];
    if (!/^\d+$/.test(idPart)) return;
    const name =
      typeof getExerciseNameById === 'function' ? getExerciseNameById(idPart) : '';
    if (!name || /^Exercice\s+\d+$/i.test(name.trim())) return;
    const hit = getExerciseDatabaseHit({ name: String(name).trim() });
    if (!hit) return;
    const diff = Number(hit.difficulty);
    if (Number.isFinite(diff) && diff >= 1 && diff <= 5) contrib.push(diff);
  });
  if (contrib.length === 0) return null;
  return contrib.reduce((a, b) => a + b, 0) / contrib.length;
}

/**
 * Jours du planning marqués actifs avec au moins un exercice, sur 28 jours : part des jours où au moins une case est cochée.
 */
function computeProgramDayCompletion28(data, activeProgram, startYmd, endYmd) {
  const schedule = activeProgram?.schedule;
  if (!schedule || typeof schedule !== 'object') return null;

  let planned = 0;
  let done = 0;
  for (let i = 0; i < 400; i += 1) {
    const ymd = ymdAddDaysLocal(startYmd, i);
    if (ymd > endYmd) break;
    const dow = new Date(
      Number(ymd.slice(0, 4)),
      Number(ymd.slice(5, 7)) - 1,
      Number(ymd.slice(8, 10))
    ).getDay();
    const dayName = DAY_NAMES_FR[dow];
    const daySched = schedule[dayName];
    if (!daySched) continue;
    const exo = daySched.exercises;
    const hasList = Array.isArray(exo) && exo.length > 0;
    let hasVariant = false;
    if (daySched.salleVariants && typeof daySched.salleVariants === 'object') {
      ['semaineA', 'semaineB'].forEach((vk) => {
        const list = daySched.salleVariants[vk]?.exercises;
        if (Array.isArray(list) && list.length > 0) hasVariant = true;
      });
    }
    if (daySched.active === false) continue;
    if (!hasList && !hasVariant && daySched.active !== true) continue;
    planned += 1;
    const anyChecked = Object.keys(data.checkedExercises || {}).some(
      (k) => k.startsWith(`${ymd}_`) && data.checkedExercises[k]
    );
    if (anyChecked) done += 1;
  }

  if (planned === 0) return null;
  return {
    ratio: done / planned,
    plannedDays: planned,
    completedDays: done,
    pct: Math.round((done / planned) * 100)
  };
}

/**
 * @param {object} input
 * @param {object} input.snapshot — getCurrentData()
 * @param {object|null} input.activeProgram
 * @param {object|null} input.profileQuestionnaireRaw
 * @param {(id: string) => string} [input.getExerciseNameById]
 * @param {(date: Date) => object|null} [input.getWorkoutForDate] — ex. `getTodayWorkout(date, isGymMode)`
 * @param {boolean} [input.isGymMode]
 */
export function computeRecapUserAssessment({
  snapshot,
  activeProgram = null,
  profileQuestionnaireRaw = null,
  getExerciseNameById,
  getWorkoutForDate,
  isGymMode = false
}) {
  const data = snapshot || {};
  const today = new Date();
  const endYmd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const d28 = new Date(today.getTime() - 27 * MS_DAY);
  const start28 = `${d28.getFullYear()}-${String(d28.getMonth() + 1).padStart(2, '0')}-${String(d28.getDate()).padStart(2, '0')}`;

  const persisted = data?.trainingPrefs?.journeyStartYmd;
  const derived = deriveJourneyStartYmd(data);
  const journeyStart =
    persisted && /^\d{4}-\d{2}-\d{2}$/.test(String(persisted))
      ? String(persisted).slice(0, 10)
      : derived;

  const tenureDays = journeyStart ? daysBetweenInclusive(journeyStart, endYmd) : 0;

  const liftAll = aggregateLiftVolumeKgByDate(data);
  const lift28 = filterMapToWindow(liftAll, start28, endYmd);
  let weightedDayCount28 = 0;
  let volumeKgRepsSum28 = 0;
  lift28.forEach((v) => {
    if (v > 0) {
      weightedDayCount28 += 1;
      volumeKgRepsSum28 += v;
    }
  });
  const avgKgRepsPerWeightedDay28 =
    weightedDayCount28 > 0 ? volumeKgRepsSum28 / weightedDayCount28 : 0;

  const repsMap = buildTotalStrengthRepsByDate(data);
  const reps28 = filterMapToWindow(repsMap, start28, endYmd);
  let totalReps28 = 0;
  reps28.forEach((v) => {
    totalReps28 += Number(v) || 0;
  });
  const avgRepsPerActiveStrengthDay28 =
    reps28.size > 0 ? totalReps28 / Math.max(1, reps28.size) : 0;

  const activeDays28 = countUniqueDaysWithActivityInWindow(data, start28, endYmd);
  const qq = normalizeProfileQuestionnaire(profileQuestionnaireRaw || null);
  const answers = qq.answers || {};
  const expectedPerWeek = quizExpectedSessionsPerWeek(answers);
  const expectedSessionsOver28 = Math.max(1, (expectedPerWeek * 28) / 7);
  const regularityScore = Math.min(1, activeDays28 / expectedSessionsOver28);

  const program28 = computeProgramDayCompletion28(data, activeProgram, start28, endYmd);
  let programAdherenceDetail = { mode: 'none', ratio: null, label: 'Aucun programme actif avec jours planifiés sur cette fenêtre.' };
  if (program28) {
    programAdherenceDetail = {
      mode: 'schedule',
      ratio: program28.ratio,
      plannedDays: program28.plannedDays,
      completedDays: program28.completedDays,
      pct: program28.pct,
      label: `${program28.completedDays}/${program28.plannedDays} jours de séance prévus complétés (28 derniers jours)`
    };
  } else if (activeProgram?.schedule) {
    programAdherenceDetail = {
      mode: 'incomplete_schedule',
      ratio: null,
      label:
        'Programme actif mais aucun jour « actif » avec exercices sur la période : la régularité globale sert de proxy.'
    };
  }

  const sessionLoadAlignment28 = aggregateSessionLoadAlignment28(
    data,
    start28,
    endYmd,
    getWorkoutForDate,
    isGymMode
  );

  const avgDifficulty = avgDifficultyFromCheckedExercises(
    data,
    start28,
    endYmd,
    getExerciseNameById
  );

  const repsMapFull = buildTotalStrengthRepsByDate(data);
  let lifetimeReps = 0;
  repsMapFull.forEach((v) => {
    lifetimeReps += Number(v) || 0;
  });

  const weightByDay = buildWeightByDateMap(data.progressEntries);
  const weightIn28 = [];
  weightByDay.forEach((w, d) => {
    if (d >= start28 && d <= endYmd) weightIn28.push({ d, w });
  });
  weightIn28.sort((a, b) => a.d.localeCompare(b.d));

  /** Pente poids sur 28 j (dernière − première mesure). */
  let weightDelta28 = null;
  if (weightIn28.length >= 2) {
    weightDelta28 = weightIn28[weightIn28.length - 1].w - weightIn28[0].w;
  }

  const startSecond14 = ymdAddDaysLocal(start28, 14);
  const repsFirst14 = filterMapToWindow(repsMapFull, start28, ymdAddDaysLocal(start28, 13));
  const repsSecond14 = filterMapToWindow(repsMapFull, startSecond14, endYmd);
  let sumFirst = 0;
  let sumSecond = 0;
  repsFirst14.forEach((v) => {
    sumFirst += Number(v) || 0;
  });
  repsSecond14.forEach((v) => {
    sumSecond += Number(v) || 0;
  });
  const meanDailyFirst14 = sumFirst / 14;
  const meanDailySecond14 = sumSecond / 14;
  const safeDenom = Math.max(12, meanDailyFirst14);
  let repsMomentumRatio = meanDailySecond14 / safeDenom;
  repsMomentumRatio = Math.min(2.4, Math.max(0.4, repsMomentumRatio));

  const log1p = (x) => Math.log1p(Math.max(0, x));

  const V_REF = 320;
  const V_CEIL = 14000;
  const volNorm =
    weightedDayCount28 > 0
      ? Math.min(1, log1p(avgKgRepsPerWeightedDay28 / V_REF) / log1p(V_CEIL / V_REF))
      : 0;

  const R_REF = 55;
  const R_CEIL = 850;
  const repsNorm = Math.min(
    1,
    log1p(Math.max(0, avgRepsPerActiveStrengthDay28) / R_REF) / log1p(R_CEIL / R_REF)
  );

  const regNorm = regularityScore;
  const diffNorm = avgDifficulty != null ? (avgDifficulty - 1) / 4 : 0.35;
  const tenureNorm = Math.min(1, log1p(tenureDays / 21) / log1p(730 / 21));

  const dataMaturity = Math.min(
    1,
    log1p(lifetimeReps / 1500) / log1p(120000 / 1500)
  );

  const baseBlend =
    0.24 * volNorm + 0.22 * repsNorm + 0.26 * regNorm + 0.1 * diffNorm + 0.18 * tenureNorm;

  let base0to70 = 70 * Math.min(1, baseBlend * (0.88 + 0.12 * (1 - 0.35 * dataMaturity)));
  const quizBoostRaw = mapExperienceToLevelBoost(answers);
  const quizBoost = quizBoostRaw * (1 - 0.62 * dataMaturity);

  let level0to100 = Math.round(base0to70 + quizBoost);
  level0to100 = Math.max(0, Math.min(97, level0to100));

  let tier = 'Intermédiaire';
  if (level0to100 < 28) tier = 'Débutant';
  else if (level0to100 < 55) tier = 'Novice confirmé';
  else if (level0to100 < 75) tier = 'Intermédiaire avancé';
  else tier = 'Avancé';

  const suggestions = [];
  if (regularityScore < 0.45) {
    suggestions.push({
      kind: 'regularity',
      text: 'Régularité sous ton objectif (quiz) : séances un peu plus courtes mais calées sur le calendrier fonctionnent souvent mieux que des blocs rares.'
    });
  }
  if (weightedDayCount28 === 0 && totalReps28 > 50) {
    suggestions.push({
      kind: 'load',
      text: 'Beaucoup de reps sans charge enregistrée : pour suivre la force, ajoute les kg sur les exos chargés.'
    });
  }
  if (weightedDayCount28 > 0) {
    if (avgKgRepsPerWeightedDay28 < 900) {
      suggestions.push({
        kind: 'volume_low',
        text: 'Volume « avec poids » encore modeste : priorité à la technique et à la progression progressive plutôt qu’à l’échec systématique.'
      });
    } else if (avgKgRepsPerWeightedDay28 > 8500) {
      suggestions.push({
        kind: 'volume_high',
        text: 'Volume halie très élevé sur les jours chargés : surveille la récupération, les articulations et alterne semaines lourdes / légères.'
      });
    }
  }
  if (program28 && program28.ratio < 0.5) {
    suggestions.push({
      kind: 'program',
      text: 'Adhérence partielle au planning : identifie 2–3 séances non négociables par semaine plutôt que viser 100 % des cases.'
    });
  }
  if (qq.completedCount < qq.totalCount) {
    suggestions.push({
      kind: 'quiz',
      text: 'Complète le quiz profil (Paramètres) pour caler fréquence attendue, sommeil et stress dans l’estimation.'
    });
  }
  if (lifetimeReps > 40000 && regularityScore < 0.55) {
    suggestions.push({
      kind: 'veteran_reg',
      text: 'Historique de volume élevé mais régularité récente en baisse : une phase « maintenance » assumée évite la frustration en attendant le bon timing.'
    });
  }
  if (
    sessionLoadAlignment28.avgScore0to100 != null &&
    sessionLoadAlignment28.avgScore0to100 < 42 &&
    sessionLoadAlignment28.sessionDaysScored >= 4
  ) {
    suggestions.push({
      kind: 'session_load_gap',
      text: 'Écart marqué entre charge prévue (programme + séries/reps du jour) et charge réalisée sur plusieurs séances : en cochant les exos et en saisissant les reps, les conseils et la synthèse gagnent en précision.'
    });
  }
  if (
    sessionLoadAlignment28.avgScore0to100 != null &&
    sessionLoadAlignment28.avgScore0to100 > 88 &&
    sessionLoadAlignment28.sessionDaysScored >= 3
  ) {
    suggestions.push({
      kind: 'session_load_aligned',
      text: 'Bonne adéquation entre prévu et réalisé récemment (séries adaptées prises en compte) : la trajectoire reflète bien ce que tu enregistres.'
    });
  }

  const quizSummaryLines = PROFILE_QUESTION_DEFS.map((q) => {
    const v = answers[q.id];
    if (v == null || (Array.isArray(v) && v.length === 0))
      return { id: q.id, title: q.title, value: '—' };
    if (q.type === 'slider') return { id: q.id, title: q.title, value: `${v} %` };
    if (q.type === 'days' && Array.isArray(v)) return { id: q.id, title: q.title, value: v.join(', ') };
    if (Array.isArray(v)) {
      const labels = (q.options || []).filter((o) => v.includes(o.key)).map((o) => o.label);
      return { id: q.id, title: q.title, value: labels.join(', ') || v.join(', ') };
    }
    const opt = (q.options || []).find((o) => o.key === v);
    return { id: q.id, title: q.title, value: opt?.label || String(v) };
  });

  const shortTerm = [];
  const mediumTerm = [];
  const longTerm = [];

  if (tenureDays < 21) {
    shortTerm.push(
      'Phase d’amorçage : la fenêtre 28 j priorise la régularité et la complétude des données (poids, reps).'
    );
  }
  if (repsMomentumRatio > 1.12) {
    shortTerm.push(
      'Sur la 2ᵉ quinzaine, le volume de reps a tendance à dépasser la 1ʳᵉ : attention à la fatigue accumulée si la tendance se confirme semaine après semaine.'
    );
  } else if (repsMomentumRatio < 0.85 && meanDailyFirst14 > 40) {
    shortTerm.push(
      'Baisse récente du volume de reps vs la quinzaine précédente : utile si c’est un déload volontaire ; sinon vérifie sommeil et charge hors sport.'
    );
  }
  if (weightDelta28 != null && Math.abs(weightDelta28) >= 0.4) {
    shortTerm.push(
      weightDelta28 < 0
        ? `Poids en baisse sur les mesures récentes (~${Math.abs(weightDelta28).toFixed(1)} kg sur la fenêtre) : croise avec apport énergétique et entraînement.`
        : `Poids en hausse sur les mesures récentes (~+${weightDelta28.toFixed(1)} kg) : normal en prise de masse ; à surveiller si l’objectif est la sècheresse.`
    );
  } else if (weightIn28.length === 0) {
    shortTerm.push(
      'Aucune pesée sur 28 j : la courbe de poids ne peut pas informer l’estimation corporelle — un point par semaine suffit.'
    );
  }
  if (avgDifficulty != null && avgDifficulty >= 3.8 && weightedDayCount28 >= 3) {
    shortTerm.push(
      'Séances souvent « techniques » : espace les blocs intenses et programme un jour léger ou mobilité.'
    );
  }
  if (sessionLoadAlignment28.seriesOverrideDays28 >= 3) {
    shortTerm.push(
      `${sessionLoadAlignment28.seriesOverrideDays28} jour(s) sur 28 avec séries/reps personnalisées : ces cibles alimentent l’estimation de charge « prévue » jour par jour.`
    );
  }

  if (tenureDays > 30 && lifetimeReps > 8000) {
    mediumTerm.push(
      'À moyen terme (≈4–10 semaines), avec déjà un stock de reps significatif, les gains viennent surtout de la qualité des cycles (progression, deload, sommeil).'
    );
  }
  if (regularityScore > 0.65 && weightedDayCount28 >= 3) {
    mediumTerm.push(
      'Régularité solide + jours avec charge : bonne base pour une progression en force sur un mesocycle sans changer radicalement le programme.'
    );
  }
  if (program28 && program28.ratio >= 0.65) {
    mediumTerm.push(
      'Bon ancrage sur le programme actif : tu peux ajuster charge ou volume sur 1–2 mouvements clés plutôt que multiplier les exos.'
    );
  } else if (activeProgram?.schedule && (program28 == null || program28.ratio < 0.45)) {
    mediumTerm.push(
      'Écart planning / réalité : à moyen terme, revoir les jours « actifs » ou les objectifs du quiz évite la culpabilité inutile.'
    );
  }

  if (tenureDays > 180 || lifetimeReps > 25000) {
    longTerm.push(
      'Long terme : au-delà de grosses bases cumulées, le score met l’accent sur la constance et la mise à jour des données plutôt que sur le volume brut — normal pour rester pertinent des années durant.'
    );
  }
  if (lifetimeReps > 50000) {
    longTerm.push(
      'Très gros historique de reps : priorise la santé articulaire, l’alternance des motifs de mouvement et des phases de maintien pour prolonger la carrière d’entraînement.'
    );
  }
  if (tenureDays > 400) {
    longTerm.push(
      'Utilisation prolongée : l’app tiendra compte surtout de la régularité récente et des tendances (poids, reps) pour rester actionnable — pas seulement du cumul passé.'
    );
  }

  const predictions = [...shortTerm.slice(0, 2), ...mediumTerm.slice(0, 1)];

  return {
    journeyStartYmd: journeyStart,
    tenureDays,
    window28: { startYmd: start28, endYmd },
    weightedDays28: weightedDayCount28,
    volumeKgRepsSum28: Math.round(volumeKgRepsSum28),
    avgKgRepsPerWeightedDay28: Math.round(avgKgRepsPerWeightedDay28),
    totalReps28: Math.round(totalReps28),
    avgRepsPerStrengthDay28: Math.round(avgRepsPerActiveStrengthDay28),
    activeDays28,
    expectedSessionsOver28: Math.round(expectedSessionsOver28 * 10) / 10,
    regularityScore: Math.round(regularityScore * 100) / 100,
    programAdherenceDetail,
    programCompletion28: program28,
    sessionLoadAlignment28,
    avgExerciseDifficulty: avgDifficulty != null ? Math.round(avgDifficulty * 10) / 10 : null,
    level0to100,
    tier,
    quiz: {
      completedCount: qq.completedCount,
      totalCount: qq.totalCount,
      summaryLines: quizSummaryLines
    },
    suggestions,
    predictions,
    insights: {
      shortTerm,
      mediumTerm,
      longTerm
    },
    lifetimeReps: Math.round(lifetimeReps),
    weightDelta28,
    repsMomentumRatio: Math.round(repsMomentumRatio * 100) / 100,
    dataMaturity: Math.round(dataMaturity * 100) / 100,
    components: {
      volNorm,
      repsNorm,
      regNorm,
      diffNorm,
      tenureNorm
    },
    disclaimers: [
      'Niveau estimé : heuristique locale (données Momentum), pas un test physiologique.',
      'Les exercices absents du référentiel ou sans champ difficulté sont exclus du calcul de complexité moyenne.',
      'Volume et kg : uniquement les jours où au moins une charge a été enregistrée pour un exercice.',
      'Après de très gros volumes cumulés, le score est volontairement stabilisé (rendements décroissants) pour rester interprétable.',
      ...(sessionLoadAlignment28.sessionDaysScored > 0
        ? [
            'Écart prévu / réalisé (charge) : moyenne des scores journaliers ; le prévu intègre les séries/reps du jour si tu les as renseignées — reste une approximation (pas de science du laboratoire).'
          ]
        : [])
    ]
  };
}
