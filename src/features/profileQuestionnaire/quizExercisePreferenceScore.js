/**
 * Phase 8 — scores de préférence par clé banque (`exerciseDatabase`) depuis logs + programme.
 * Tie-break fill / planner uniquement ; ne remplace pas mission ni budgets.
 */

import { aggregateCheckedRepsByDateAndExerciseId } from '../../utils/trainingLoadUtils';
import { exerciseDatabase } from '../../data/exerciseDatabase';
import { parseQuizExerciseBankKey } from './quizFineMuscleResolve';

function hasAnyCheckOnDay(snapshot, ymd) {
  const checked = snapshot?.checkedExercises || {};
  if (Object.keys(checked).some((k) => k.startsWith(`${ymd}_`) && checked[k])) return true;
  const reps = snapshot?.reps || {};
  return Object.keys(reps).some((k) => k.startsWith(`${ymd}_`) && Number(reps[k]) > 0);
}

const MS_DAY = 86400000;
const DEFAULT_WINDOW_DAYS = 28;
const SCORE_MIN = -20;
const SCORE_MAX = 25;
const BOOST_THRESHOLD = 7;
const PENALTY_THRESHOLD = -5;

const DAY_NAMES_FR = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

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

function ymdFromDate(d) {
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

function scheduleDayForYmd(schedule, ymd) {
  const d = new Date(Number(ymd.slice(0, 4)), Number(ymd.slice(5, 7)) - 1, Number(ymd.slice(8, 10)));
  const name = DAY_NAMES_FR[d.getDay()];
  return schedule?.[name] || null;
}

function resolveDbKeyFromExerciseRef(ex) {
  if (ex?.exerciseBankKey && exerciseDatabase[ex.exerciseBankKey]) return ex.exerciseBankKey;
  const fromId = parseQuizExerciseBankKey(ex?.id);
  if (fromId) return fromId;
  return null;
}

function exerciseLoggedOnDay(snapshot, ymd, exerciseId) {
  const key = `${ymd}_${exerciseId}`;
  if (snapshot?.checkedExercises?.[key]) return true;
  return Number(snapshot?.reps?.[key]) > 0;
}

function displayNameForDbKey(dbKey) {
  return exerciseDatabase[dbKey]?.name || dbKey;
}

/**
 * Agrège reps / séances par clé banque sur une fenêtre glissante.
 * @returns {Map<string, { sessions: number, totalReps: number, maxReps: number, lastYmd: string|null }>}
 */
export function aggregateLogsByExerciseBankKey(snapshot, startYmd, endYmd) {
  const grouped = aggregateCheckedRepsByDateAndExerciseId(snapshot?.reps, snapshot?.checkedExercises);
  const byKey = new Map();

  grouped.forEach(({ reps }, gkey) => {
    const sep = gkey.indexOf('::');
    if (sep < 0) return;
    const dateStr = gkey.slice(0, sep);
    if (dateStr < startYmd || dateStr > endYmd) return;
    const r = Number(reps) || 0;
    if (r <= 0) return;
    const exerciseId = gkey.slice(sep + 2);
    const dbKey = parseQuizExerciseBankKey(exerciseId);
    if (!dbKey) return;

    const row = byKey.get(dbKey) || {
      sessions: 0,
      sessionDays: new Set(),
      totalReps: 0,
      maxReps: 0,
      lastYmd: null
    };
    row.sessionDays.add(dateStr);
    row.totalReps += r;
    row.maxReps = Math.max(row.maxReps, r);
    if (!row.lastYmd || dateStr > row.lastYmd) row.lastYmd = dateStr;
    byKey.set(dbKey, row);
  });

  const out = new Map();
  byKey.forEach((row, dbKey) => {
    out.set(dbKey, {
      sessions: row.sessionDays.size,
      totalReps: row.totalReps,
      maxReps: row.maxReps,
      lastYmd: row.lastYmd
    });
  });
  return out;
}

/**
 * Compte les skips : jour d’entraînement prévu avec activité partielle, exo non coché.
 */
export function countScheduleSkipsByBankKey(snapshot, program, startYmd, endYmd) {
  const schedule = program?.schedule;
  if (!schedule || !snapshot) return new Map();

  const skips = new Map();
  let cur = startYmd;
  while (cur <= endYmd) {
    const daySched = scheduleDayForYmd(schedule, cur);
    if (daySched?.active) {
      const lists = [
        daySched.exercises,
        daySched.salleVariants?.semaineA?.exercises,
        daySched.salleVariants?.semaineB?.exercises
      ];
      const planned = [];
      lists.forEach((list) => {
        (list || []).forEach((ex) => {
          const dbKey = resolveDbKeyFromExerciseRef(ex);
          if (dbKey && ex?.id) planned.push({ dbKey, id: ex.id });
        });
      });
      if (planned.length && hasAnyCheckOnDay(snapshot, cur)) {
        planned.forEach(({ dbKey, id }) => {
          if (!exerciseLoggedOnDay(snapshot, cur, id)) {
            skips.set(dbKey, (skips.get(dbKey) || 0) + 1);
          }
        });
      }
    }
    cur = ymdAddDays(cur, 1);
  }
  return skips;
}

/**
 * @param {object} row
 * @param {number} skipCount
 * @param {number} activeDays28
 */
function scoreOneExercise(row, skipCount, activeDays28) {
  const sessions = row.sessions || 0;
  const totalReps = row.totalReps || 0;
  let score = 0;

  if (sessions >= 1) score += 3;
  if (sessions >= 3) score += 4;
  if (sessions >= 6) score += 3;
  if (sessions >= 2) score += Math.min(4, sessions - 1);

  if (totalReps >= 40) score += 3;
  else if (totalReps >= 15) score += 2;
  else if (totalReps >= 5) score += 1;

  if (activeDays28 >= 4 && sessions >= 2) {
    const regularity = sessions / Math.max(1, activeDays28);
    if (regularity >= 0.15) score += 3;
    if (regularity >= 0.25) score += 2;
  }

  if (skipCount > 0) {
    score -= Math.min(12, skipCount * 3);
  }

  return Math.max(SCORE_MIN, Math.min(SCORE_MAX, Math.round(score)));
}

/**
 * @param {Record<string, number>} scores
 */
export function pickPreferenceExtremes(scores) {
  const entries = Object.entries(scores || {})
    .filter(([, v]) => Number.isFinite(v))
    .map(([dbKey, score]) => ({
      dbKey,
      score,
      name: displayNameForDbKey(dbKey)
    }))
    .sort((a, b) => b.score - a.score);

  const positive = entries.filter((e) => e.score >= BOOST_THRESHOLD);
  const negative = entries.filter((e) => e.score <= PENALTY_THRESHOLD).sort((a, b) => a.score - b.score);

  return {
    topPositive: positive.slice(0, 4),
    topNegative: negative.slice(0, 4),
    boosts: positive.map((e) => e.dbKey),
    penalties: negative.map((e) => e.dbKey)
  };
}

/**
 * Phrase comparative pour récap / encart coach.
 */
export function buildExercisePreferenceCompareFr(topPositive, topNegative) {
  if (!topPositive?.length && !topNegative?.length) return null;
  const best = topPositive?.[0];
  const worst = topNegative?.[0];
  if (best && worst && best.dbKey !== worst.dbKey) {
    return `Tu progresses mieux sur ${best.name.toLowerCase()} que sur ${worst.name.toLowerCase()} — le prochain plan favorisera tes habitudes réelles.`;
  }
  if (best && best.score >= BOOST_THRESHOLD) {
    return `Repère fort : ${best.name} — on le garde en tête pour le remplissage des séances.`;
  }
  if (worst && worst.score <= PENALTY_THRESHOLD) {
    return `${worst.name} est peu pratiqué dans tes logs — on le down-rankera au profit d’exercices que tu fais vraiment.`;
  }
  return null;
}

/**
 * @param {object} input
 * @param {object} [input.snapshot]
 * @param {object|null} [input.program]
 * @param {string} [input.endYmd]
 * @param {number} [input.windowDays]
 * @param {number} [input.activeDays28]
 */
export function buildExercisePreferenceScore(input = {}) {
  const snapshot = input.snapshot || {};
  const endYmd = input.endYmd || todayYmd();
  const windowDays = Math.max(7, input.windowDays || DEFAULT_WINDOW_DAYS);
  const startYmd = ymdAddDays(endYmd, -(windowDays - 1));

  const logs = aggregateLogsByExerciseBankKey(snapshot, startYmd, endYmd);
  const activeDays28 = input.activeDays28 ?? countActiveDaysInWindow(snapshot, startYmd, endYmd);

  const programStartRaw = input.program?.startDate || input.program?.createdAt;
  let progStart = startYmd;
  if (programStartRaw) {
    const d = new Date(programStartRaw);
    if (!Number.isNaN(d.getTime())) {
      progStart = ymdFromDate(d);
      if (progStart < startYmd) progStart = startYmd;
    }
  }

  const skips = input.program
    ? countScheduleSkipsByBankKey(snapshot, input.program, progStart, endYmd)
    : new Map();

  const scores = {};
  const allKeys = new Set([...logs.keys(), ...skips.keys()]);

  allKeys.forEach((dbKey) => {
    const row = logs.get(dbKey) || { sessions: 0, totalReps: 0 };
    scores[dbKey] = scoreOneExercise(row, skips.get(dbKey) || 0, activeDays28);
  });

  const { topPositive, topNegative, boosts, penalties } = pickPreferenceExtremes(scores);
  const compareFr = buildExercisePreferenceCompareFr(topPositive, topNegative);
  const sessionKeys = [...logs.keys()].filter((k) => (logs.get(k)?.sessions || 0) >= 1);

  return {
    scores,
    boosts,
    penalties,
    topPositive,
    topNegative,
    compareFr,
    windowDays,
    activeDays28,
    loggedExerciseCount: sessionKeys.length,
    maturity: sessionKeys.length >= 2 ? 'usable' : sessionKeys.length === 1 ? 'thin' : 'none'
  };
}

function countActiveDaysInWindow(snapshot, startYmd, endYmd) {
  let n = 0;
  let cur = startYmd;
  while (cur <= endYmd) {
    if (hasAnyCheckOnDay(snapshot, cur)) n += 1;
    cur = ymdAddDays(cur, 1);
  }
  return n;
}

/**
 * Fusionne préférences dans les ajustements evidence (boosts template + meta).
 * @param {object} adjustments
 * @param {ReturnType<typeof buildExercisePreferenceScore>} preference
 */
export function mergePreferenceIntoAdjustments(adjustments, preference) {
  if (!adjustments || !preference || preference.maturity === 'none') return adjustments;
  const next = { ...adjustments, templateKeyBoosts: [...(adjustments.templateKeyBoosts || [])] };
  preference.boosts.forEach((k) => {
    if (!next.templateKeyBoosts.includes(k)) next.templateKeyBoosts.push(k);
  });
  next.exercisePreferenceScore = { ...preference.scores };
  next.exercisePreferencePenalties = [...preference.penalties];
  if (preference.compareFr) {
    next.whyLines = [...(next.whyLines || [])];
    if (!next.whyLines.includes(preference.compareFr)) next.whyLines.push(preference.compareFr);
  }
  return next;
}

/**
 * Bonus / malus tie-break pour un dbKey (-8..+8).
 */
export function preferenceTieBreakDelta(dbKey, exercisePreferenceScore) {
  if (!dbKey || !exercisePreferenceScore) return 0;
  const s = exercisePreferenceScore[dbKey];
  if (!Number.isFinite(s)) return 0;
  if (s >= BOOST_THRESHOLD) return Math.min(8, 4 + Math.floor((s - BOOST_THRESHOLD) / 2));
  if (s <= PENALTY_THRESHOLD) return Math.max(-8, -3 + Math.ceil((s - PENALTY_THRESHOLD) / 2));
  return 0;
}
