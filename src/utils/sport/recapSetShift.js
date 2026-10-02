/**
 * Lecture des séries réelles (exerciseSetLogs) quand une séance est comparée
 * à un niveau personnel. Aucun schéma n'est inventé à partir du total.
 */
import { collectLifetimeRepHistory } from './athleteJourney';
import { formatDayFr } from './recapTrainingTimeline';

function fmtNum(n) {
  if (!Number.isFinite(n)) return '';
  const rounded = Math.abs(n - Math.round(n)) < 0.05 ? Math.round(n) : Math.round(n * 10) / 10;
  return String(rounded).replace('.', ',');
}

function seriesWord(n) {
  return Math.round(n) > 1 ? 'séries' : 'série';
}

function repWord(n, unit) {
  const many = Math.round(n) > 1;
  if (unit === 'seconds') return many ? 'secondes' : 'seconde';
  return many ? 'répétitions' : 'répétition';
}

function rowsOf(byEx, exerciseId) {
  const keys = [exerciseId, String(exerciseId)];
  const n = parseInt(String(exerciseId), 10);
  if (Number.isFinite(n)) keys.push(n, String(n));
  for (const key of keys) {
    if (byEx.has(key)) return byEx.get(key) || [];
  }
  return [];
}

function readShape(snapshot, date, exerciseId, expectedReps) {
  const logs = snapshot?.exerciseSetLogs || {};
  const keys = [`${date}_${exerciseId}`, `${date}_${String(exerciseId)}`];
  const n = parseInt(String(exerciseId), 10);
  if (Number.isFinite(n)) keys.push(`${date}_${n}`);
  let sets = null;
  for (const key of keys) {
    if (Array.isArray(logs[key]?.sets) && logs[key].sets.length) {
      sets = logs[key].sets;
      break;
    }
  }
  if (!sets) return null;
  const reps = sets.map((s) => Math.floor(Number(s?.reps) || 0)).filter((v) => v > 0);
  if (!reps.length) return null;
  const total = reps.reduce((sum, v) => sum + v, 0);
  if (expectedReps != null && Math.abs(total - expectedReps) > 1) return null;
  return {
    date,
    count: reps.length,
    reps,
    total,
    perSet: total / reps.length
  };
}

function median(nums) {
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function profileOf(shapes) {
  if (!shapes?.length) return null;
  const setCount = median(shapes.map((s) => s.count));
  const perSet = median(shapes.map((s) => s.perSet));
  const sameCount = shapes.every((s) => s.count === shapes[0].count);
  const evenInside = shapes.every((s) => Math.max(...s.reps) - Math.min(...s.reps) < 3);
  const samePer = shapes.every((s) => Math.abs(s.perSet - shapes[0].perSet) <= 1);
  return {
    setCount,
    perSet,
    sessions: shapes.length,
    uniform: sameCount && evenInside && samePer
  };
}

export function formatSetScheme(shape, { habitual = false, unit = 'reps' } = {}) {
  if (!shape) return '';
  const reps = shape.reps;
  const uneven = !habitual && reps && reps.length > 1 && !reps.every((r) => r === reps[0]);
  if (uneven) return `${reps.length} séries (${reps.join(', ')} ${repWord(2, unit)})`;
  const count = habitual ? shape.setCount : shape.count;
  const per = shape.perSet;
  const core = `${fmtNum(count)} ${seriesWord(count)} de ${fmtNum(per)} ${repWord(per, unit)}`;
  return habitual && !shape.uniform
    ? `environ ${fmtNum(count)} ${seriesWord(count)} d'environ ${fmtNum(per)} ${repWord(per, unit)}`
    : core;
}

function mechanism(beforeCount, beforePer, afterCount, afterPer, unit) {
  const word = repWord(2, unit);
  const countUp = afterCount - beforeCount >= 0.75;
  const countDown = beforeCount - afterCount >= 0.75;
  const repsUp = afterPer - beforePer > 1;
  const repsDown = beforePer - afterPer > 1;
  if (countUp && repsUp) return `Le nombre de séries augmente, et chaque série porte plus de ${word}.`;
  if (countDown && repsDown) return `Le nombre de séries baisse, et chaque série porte moins de ${word}.`;
  if (countUp && repsDown) return `Le nombre de séries augmente, mais chaque série porte moins de ${word}.`;
  if (countDown && repsUp) return `Le nombre de séries baisse, et chaque série porte plus de ${word}.`;
  if (countUp) return `Le nombre de séries augmente. Les ${word} dans chaque série restent du même ordre.`;
  if (countDown) return `Le nombre de séries baisse. Les ${word} dans chaque série restent du même ordre.`;
  if (repsUp) return `Le nombre de séries reste le même. Ce qui augmente, ce sont les ${word} dans chaque série.`;
  if (repsDown) return `Le nombre de séries reste le même. Ce qui baisse, ce sont les ${word} dans chaque série.`;
  return '';
}

function sentence(beforeLabel, before, afterLabel, after, unit) {
  const why = mechanism(before.setCount ?? before.count, before.perSet, after.count, after.perSet, unit);
  const afterScheme = formatSetScheme(after, { unit });
  if (!why) {
    const uneven = after.reps.length > 1 && !after.reps.every((r) => r === after.reps[0]);
    return uneven ? `${afterLabel} ${afterScheme}.` : '';
  }
  return `${beforeLabel} ${formatSetScheme(before, { habitual: before.setCount != null, unit })}. ${afterLabel} ${afterScheme}. ${why}`;
}

export function createSetShiftReader(snapshot, endYmd = null) {
  const byEx = snapshot ? collectLifetimeRepHistory(snapshot, endYmd) : new Map();

  function forSession(exerciseId, lastDate, lastReps, unit = 'reps') {
    if (!snapshot || !exerciseId || !lastDate) return '';
    const current = readShape(snapshot, lastDate, exerciseId, lastReps);
    if (!current) return '';
    const prior = rowsOf(byEx, exerciseId)
      .filter((row) => row.date < lastDate)
      .map((row) => readShape(snapshot, row.date, exerciseId, row.reps))
      .filter(Boolean);
    if (prior.length >= 2) {
      const habit = profileOf(prior);
      return sentence("D'habitude,", habit, 'Cette séance :', current, unit);
    }
    if (prior.length === 1) {
      const day = formatDayFr(prior[0].date, true);
      return sentence(`La séance du ${day} :`, prior[0], 'Cette séance :', current, unit);
    }
    return `Cette séance est répartie en ${formatSetScheme(current, { unit })}.`;
  }

  function acrossLevel(exerciseId) {
    const rows = rowsOf(byEx, exerciseId);
    if (rows.length < 8) return '';
    const early = rows
      .slice(0, 5)
      .map((row) => readShape(snapshot, row.date, exerciseId, row.reps))
      .filter(Boolean);
    const late = rows
      .slice(-5)
      .map((row) => readShape(snapshot, row.date, exerciseId, row.reps))
      .filter(Boolean);
    if (early.length < 2 || late.length < 2) return '';
    const before = profileOf(early);
    const after = profileOf(late);
    const why = mechanism(before.setCount, before.perSet, after.setCount, after.perSet);
    if (!why) return '';
    return `Au début, ces séances tenaient en ${formatSetScheme(before, { habitual: true })}. Sur les séances récentes, c'est ${formatSetScheme(after, { habitual: true })}. ${why}`;
  }

  return { forSession, acrossLevel };
}
