/**
 * Blocs chargés et creux, lus comme le calendrier : jours avec séance,
 * jours sans séance, et séances au-dessus du niveau déjà observé.
 */
import { formatDayFr } from './recapTrainingTimeline';
import { enumerateDatesInclusive } from './dailyDenseTimeSeries';
import { calendarGapImplication, composeAnalyticalReading } from './recapAnalyticalReading';

const HABIT_GAP = 12;

function median(nums) {
  const sorted = [...nums].filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function aboveHabit(reps, habit) {
  if (habit == null || habit <= 0) return false;
  return ((reps - habit) / habit) * 100 >= HABIT_GAP;
}

function dayLabel(date, withYear) {
  return formatDayFr(date, withYear);
}

function rangeLabel(start, end, withYear) {
  if (start === end) return `le ${dayLabel(start, withYear)}`;
  return `du ${dayLabel(start, withYear)} au ${dayLabel(end, withYear)}`;
}

/**
 * @returns {{ title: string, body: string, evidence: string } | null}
 */
export function describeCalendarShape({ repsByDate = {}, start, end, thisPeriod = 'cette période' } = {}) {
  if (!start || !end) return null;
  const dates = enumerateDatesInclusive(start, end);
  if (dates.length < 3) return null;
  const repsOf = (date) => {
    const n = Number(repsByDate?.[date] || 0);
    return Number.isFinite(n) ? n : 0;
  };
  const trained = dates.filter((date) => repsOf(date) > 0);
  if (trained.length < 2) return null;
  const habit = median(trained.map(repsOf));
  const withYear = true;

  const runs = [];
  let cursor = null;
  dates.forEach((date) => {
    const on = repsOf(date) > 0;
    if (!cursor || cursor.on !== on) {
      cursor = { on, start: date, end: date, reps: on ? [repsOf(date)] : [] };
      runs.push(cursor);
      return;
    }
    cursor.end = date;
    if (on) cursor.reps.push(repsOf(date));
  });

  const quiet = runs.filter((run) => !run.on && run.start !== run.end);
  const hot = [];
  let hotCursor = null;
  dates.forEach((date) => {
    const reps = repsOf(date);
    const on = reps > 0 && aboveHabit(reps, habit);
    if (!on) {
      hotCursor = null;
      return;
    }
    if (!hotCursor) {
      hotCursor = { start: date, end: date, reps: [reps] };
      hot.push(hotCursor);
      return;
    }
    hotCursor.end = date;
    hotCursor.reps.push(reps);
  });
  if (!quiet.length && !hot.length) return null;

  const spanDays = (run) => {
    const a = new Date(`${run.start}T12:00:00`);
    const b = new Date(`${run.end}T12:00:00`);
    return Math.round((b - a) / 86400000);
  };
  const quietLead = [...quiet].sort((a, b) => spanDays(b) - spanDays(a))[0];
  const hotLead = [...hot].sort((a, b) => Math.max(...b.reps) - Math.max(...a.reps))[0];
  const bits = [];
  if (hotLead) {
    const peak = Math.max(...hotLead.reps);
    bits.push(
      `${rangeLabel(hotLead.start, hotLead.end, withYear)}, la charge dépasse ton niveau de séance de la fenêtre (médiane ${Math.round(habit)} répétitions, pic ${Math.round(peak)})`
    );
  }
  if (quietLead) {
    bits.push(`${rangeLabel(quietLead.start, quietLead.end, withYear)} reste sans séance`);
  }
  if (!bits.length) return null;
  const quietCount = dates.length - trained.length;
  const titleThesis = quietLead && hotLead
    ? `${thisPeriod.charAt(0).toUpperCase()}${thisPeriod.slice(1)} mêlent un bloc chargé et un creux`
    : hotLead
      ? `Un bloc dépasse le niveau de séance de ${thisPeriod}`
      : `${thisPeriod.charAt(0).toUpperCase()}${thisPeriod.slice(1)} : le volume repose sur peu de journées`;
  const constat = `${bits
    .map((bit) => bit.charAt(0).toUpperCase() + bit.slice(1))
    .join('. ')}. Sur ${dates.length} jours, ${trained.length} ont une séance et ${quietCount} n'en ont pas`;
  const mechanism =
    hotLead && habit > 0
      ? `Le pic vaut environ ${(Math.max(...hotLead.reps) / habit).toFixed(1).replace('.', ',')} fois la médiane de séance de la fenêtre : la médiane décrit l’habitude, le pic un point haut`
      : null;
  const scope =
    quietLead && hotLead
      ? `Les jours sans séance font partie de ce rythme : ce sont eux qui rendent le bloc possible`
      : quietLead
        ? `Le creux calendaire est localisé ${rangeLabel(quietLead.start, quietLead.end, withYear)}`
        : null;
  const implication =
    calendarGapImplication({
      trainedDays: trained.length,
      quietDays: quietCount,
      spanDays: dates.length
    }) ||
    (quietLead && hotLead
      ? `Les remplir avec une séance de l’ordre du pic changerait le bloc, ce ne serait pas un simple rattrapage`
      : null);
  const reading = composeAnalyticalReading({
    titleThesis,
    constat,
    mechanism,
    scope,
    implication
  });
  return {
    title: reading.title,
    body: reading.body,
    evidence: `${trained.length} jours entraînés · ${quietCount} jours sans séance`,
    readingBeats: reading.beats
  };
}
