const STORAGE_PREFIX = 'momentum.calendar.expandedMonths';

export function calendarExpandedMonthsKey(userId) {
  const id = userId == null || userId === '' ? '' : String(userId);
  return id ? `${STORAGE_PREFIX}.${id}` : STORAGE_PREFIX;
}

export function calendarMonthExpandId(year, monthIndex) {
  return `${year}-${monthIndex}`;
}

function readSet(userId) {
  try {
    const raw = localStorage.getItem(calendarExpandedMonthsKey(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((key) => typeof key === 'string') : []);
  } catch {
    return new Set();
  }
}

export function isCalendarMonthExpanded(userId, monthKey) {
  if (!userId || !monthKey) return false;
  return readSet(userId).has(monthKey);
}

export function setCalendarMonthExpanded(userId, monthKey, expanded) {
  if (!userId || !monthKey) return;
  const keys = readSet(userId);
  if (expanded) keys.add(monthKey);
  else keys.delete(monthKey);
  try {
    localStorage.setItem(calendarExpandedMonthsKey(userId), JSON.stringify([...keys]));
  } catch {
    /* quota / private mode */
  }
}
