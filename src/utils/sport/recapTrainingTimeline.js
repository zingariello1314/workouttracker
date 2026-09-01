/**
 * Chronologie exploitable : dernière occurrence, délai, séances entre-temps.
 */

import {
  extractDateStrFromWorkoutKey,
  extractExerciseIdFromWorkoutKey
} from '../exerciseKeyGenerator';
import { resolveSessionCalendarDate, readGarminActivityDateOverrides } from '../sessionCalendarDate';

export function formatDayFr(ymd, withYear = false) {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return '';
  const [y, m, d] = ymd.split('-');
  return withYear ? `${d}/${m}/${y}` : `${d}/${m}`;
}

export function daysBetweenYmd(fromYmd, toYmd) {
  if (!fromYmd || !toYmd) return null;
  const a = new Date(`${fromYmd}T12:00:00`);
  const b = new Date(`${toYmd}T12:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  return Math.round((b - a) / 86400000);
}

function exerciseLabel(id, getExerciseNameById) {
  const n = parseInt(String(id), 10);
  if (typeof getExerciseNameById === 'function') {
    const label = Number.isFinite(n) ? getExerciseNameById(n) : getExerciseNameById(id);
    if (label?.trim()) return label.trim();
  }
  return `Exercice ${id}`;
}

/**
 * @returns {{ items: object[], trainingDays: string[] }}
 */
export function buildExerciseTimeline(snapshot, getExerciseNameById = null) {
  const datesById = new Map();
  const checked = snapshot?.checkedExercises || {};
  const reps = snapshot?.reps || {};
  const keys = new Set([...Object.keys(checked), ...Object.keys(reps)]);

  keys.forEach((k) => {
    const date = extractDateStrFromWorkoutKey(k);
    const id = extractExerciseIdFromWorkoutKey(k);
    if (!date || !id) return;
    const done = checked[k] === true || (parseInt(String(reps[k]), 10) || 0) > 0;
    if (!done) return;
    if (!datesById.has(String(id))) datesById.set(String(id), []);
    datesById.get(String(id)).push({
      date,
      reps: parseInt(String(reps[k]), 10) || 0
    });
  });

  const trainingSet = new Set();
  const items = [];
  datesById.forEach((rows, id) => {
    rows.sort((a, b) => String(a.date).localeCompare(String(b.date)));
    rows.forEach((r) => trainingSet.add(r.date));
    const last = rows[rows.length - 1];
    items.push({
      id,
      name: exerciseLabel(id, getExerciseNameById),
      lastDate: last.date,
      lastReps: last.reps,
      sessions: new Set(rows.map((r) => r.date)).size,
      dates: rows
    });
  });

  return { items, trainingDays: [...trainingSet].sort() };
}

/** Muscu / presses : jamais du cardio. « développé » contient « velo ». */
const STRENGTH_NOT_CARDIO =
  /developp|couche|haltere|bench\s*press|shoulder press|pec\s*deck|butterfly|ecartes?|flyes?\b|chest press/;

function compactName(name) {
  return String(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Course : endurance fondamentale, fractionné, footing, sorties Garmin, pas la muscu.
 */
export function isRunningLikeName(name) {
  const n = compactName(name);
  if (!n || STRENGTH_NOT_CARDIO.test(n)) return false;
  if (
    /endurance fondamentale|\bfooting\b|\bfractionn|\beasy run\b|\btempo run\b|\binterval run|\bsortie longue|course a pied|course endurance|course fractionn/.test(
      n
    )
  ) {
    return true;
  }
  if (/\bcourse\b/.test(n) && !/\bparcours\b/.test(n)) return true;
  if (/(^|[^a-z])run(ning)?([^a-z]|$)/.test(n)) return true;
  return false;
}

/**
 * Cardio au sens large (course, vélo, nage, corde) — jamais un développé / une presse.
 */
export function isCardioLikeName(name) {
  if (isRunningLikeName(name)) return true;
  const n = compactName(name);
  if (!n || STRENGTH_NOT_CARDIO.test(n)) return false;
  if (/(^|[^a-z])(velo|bike|cycling)([^a-z]|$)/.test(n)) return true;
  if (/\b(natation|swim|hiit|cardio|corde a sauter|jump ?rope)\b/.test(n)) return true;
  return false;
}

export function isLegLikeName(name) {
  return /mollet|squat|fente|ischio|quadri|presse|hip thrust|soulev/i.test(String(name || ''));
}

function runningSessionLabel(session) {
  const blob = compactName(
    [session?.name, session?.title, session?.type, session?.activityType, session?.programSubType, session?.subtype]
      .filter(Boolean)
      .join(' ')
  );
  if (/fractionn|interval/.test(blob)) return 'Fractionné';
  if (/endurance fondamentale|footing|easy|zone 2|\bef\b/.test(blob)) return 'Course endurance fondamentale';
  if (session?.name && isRunningLikeName(session.name)) return String(session.name).trim();
  return 'Course';
}

function isWalkLikeSession(session) {
  const blob = compactName(
    [session?.name, session?.title, session?.type, session?.activityType, session?.isWalk ? 'walk' : '']
      .filter(Boolean)
      .join(' ')
  );
  return /\b(walk|walking|marche)\b/.test(blob);
}

/**
 * Dernière vraie sortie course (module endurance / Garmin), pas un exo de muscu coché.
 */
export function lastRunningSessionFromSnapshot(snapshot) {
  const endurance = snapshot?.enduranceData || {};
  const sessions = [
    ...(Array.isArray(endurance.sessions?.running) ? endurance.sessions.running : []),
    ...(Array.isArray(endurance.runningSessions) ? endurance.runningSessions : [])
  ];
  const overrides = readGarminActivityDateOverrides(snapshot) || {};
  let best = null;
  sessions.forEach((s) => {
    if (!s || isWalkLikeSession(s)) return;
    const ymd = resolveSessionCalendarDate(s, overrides);
    if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return;
    if (!best || ymd > best.lastDate) {
      best = { lastDate: ymd, name: runningSessionLabel(s), source: 'endurance' };
    }
  });
  return best;
}

/**
 * Exercices absents alors que l'entraînement continue.
 */
export function findSpecificAbsences(timeline, endYmd, { minGap = 8, minSessionsSince = 3 } = {}) {
  if (!endYmd) return [];
  return (timeline?.items || [])
    .map((ex) => {
      const daysSince = daysBetweenYmd(ex.lastDate, endYmd);
      const sessionsSince = (timeline.trainingDays || []).filter(
        (d) => d > ex.lastDate && d <= endYmd
      ).length;
      return { ...ex, daysSince, sessionsSince };
    })
    .filter(
      (x) =>
        x.daysSince != null &&
        x.daysSince >= minGap &&
        x.sessionsSince >= minSessionsSince
    )
    .sort((a, b) => b.daysSince - a.daysSince);
}
