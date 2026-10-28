/**
 * Navigation hebdo « Aujourd’hui » : lundi→dimanche ISO, libellé S40 · 5 oct. – 11 oct.
 */

import { getWeekNumber, getDateStr, addDays } from '../dateUtils';

/** Lundi 12:00 de la semaine ISO contenant `date`. */
export function startOfIsoWeek(date) {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  const day = d.getDay(); // 0=dim … 6=sam
  const offset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + offset);
  return d;
}

export function endOfIsoWeek(date) {
  return addDays(startOfIsoWeek(date), 6);
}

export function shiftIsoWeek(date, weekDelta) {
  return addDays(startOfIsoWeek(date), weekDelta * 7);
}

/**
 * Conserve le jour de semaine relatif (lun=0…dim=6) en changeant de semaine.
 * Si la cible dépasse « aujourd’hui », ramène à aujourd’hui.
 */
export function jumpToSameWeekdayInWeek(currentDate, weekStartMonday, realToday = new Date()) {
  const cur = new Date(currentDate);
  cur.setHours(12, 0, 0, 0);
  const monday = startOfIsoWeek(weekStartMonday);
  const curMonday = startOfIsoWeek(cur);
  const dayOffset = Math.round((cur - curMonday) / 86400000);
  const next = addDays(monday, Math.max(0, Math.min(6, dayOffset)));
  next.setHours(12, 0, 0, 0);
  const today = new Date(realToday);
  today.setHours(12, 0, 0, 0);
  return next > today ? today : next;
}

export function formatWeekNavLabel(date, locale = 'fr-FR') {
  const monday = startOfIsoWeek(date);
  const sunday = endOfIsoWeek(date);
  const weekNo = getWeekNumber(monday);
  const fmt = (d) =>
    d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  return {
    weekNo,
    mondayYmd: getDateStr(monday),
    sundayYmd: getDateStr(sunday),
    label: `S${weekNo} · ${fmt(monday)} – ${fmt(sunday)}`,
    isCurrentWeek: getDateStr(monday) === getDateStr(startOfIsoWeek(new Date())),
  };
}
