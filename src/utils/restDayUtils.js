import { getDateStr } from './dateUtils';

export const WEEK_DAYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
export const DEFAULT_REST_DAY = 'jeudi';

export function isValidWeekDay(day) {
  return typeof day === 'string' && WEEK_DAYS.includes(day);
}

export function inferRestDayFromSchedule(schedule) {
  if (!schedule || typeof schedule !== 'object') return DEFAULT_REST_DAY;
  const empty = WEEK_DAYS.find((day) => {
    const dayData = schedule[day];
    const exercises = Array.isArray(dayData?.exercises) ? dayData.exercises : [];
    return exercises.length === 0;
  });
  return empty || DEFAULT_REST_DAY;
}

export function normalizeProgramRestConfig(program) {
  if (!program || typeof program !== 'object') return program;
  const configured = program.restConfig?.restDay;
  const restDay = isValidWeekDay(configured)
    ? configured
    : inferRestDayFromSchedule(program.schedule);
  return {
    ...program,
    restConfig: {
      ...(program.restConfig || {}),
      restDay
    }
  };
}

export function getWeekStartKey(dateInput) {
  const date = dateInput instanceof Date ? new Date(dateInput) : new Date(dateInput);
  if (Number.isNaN(date.getTime())) return null;
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diffToMonday);
  return getDateStr(date);
}

export function getRestDaySwapForWeek(data, programId, weekKey) {
  if (!programId || !weekKey) return null;
  const programSwaps = data?.restDaySwaps?.[programId];
  if (!programSwaps || typeof programSwaps !== 'object') return null;
  const swap = programSwaps[weekKey];
  if (!swap) return null;
  if (!isValidWeekDay(swap.fromDay) || !isValidWeekDay(swap.toDay)) return null;
  return swap;
}

export function getEffectiveRestDayForDate({ program, data, date }) {
  if (!program || !date) return null;
  const normalizedProgram = normalizeProgramRestConfig(program);
  const baseRestDay = normalizedProgram?.restConfig?.restDay;
  if (!isValidWeekDay(baseRestDay)) return null;
  const weekKey = getWeekStartKey(date);
  const swap = getRestDaySwapForWeek(data, normalizedProgram.id, weekKey);
  return swap?.toDay || baseRestDay;
}
