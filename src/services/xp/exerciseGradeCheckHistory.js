/**
 * Historique des coches + records jour / semaine / mois.
 */

import {
  collectCatalogActivityByDate,
  exerciseMatchesCatalogKey,
  shouldIncludeEnduranceForCatalog,
  sessionRepsForCheckedKey,
  isPushupsCatalogKey,
  mergePushupChannels
} from './exerciseGradeCatalogMetrics';
import { shouldAttachEnduranceToExercise } from './exerciseGradeDiscovery';
import { forEachEnduranceBenchmarkSession } from './exerciseGradeEnduranceBridge';
import { emptyPushupChannels, pushupBreakdownDisplayLines, classifyPushupWorkoutChannel } from './exerciseGradePushupChannels';

export { pushupBreakdownDisplayLines, isPushupsCatalogKey };

function exerciseIdFromStorageKey(key) {
  const m = String(key || '').match(/^(\d{4}-\d{2}-\d{2})_(.+)$/);
  if (!m) return null;
  let id = m[2].replace(/_semaineA$|_semaineB$/, '');
  if (id.startsWith('complementary_')) return null;
  return id;
}

function weekStartYmd(dateStr) {
  const [y, m, d] = String(dateStr).split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const dow = dt.getDay();
  const toMon = dow === 0 ? -6 : 1 - dow;
  dt.setDate(dt.getDate() + toMon);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

function monthKey(dateStr) {
  return String(dateStr).slice(0, 7);
}

export function formatCatalogDateHeadline(dateStr, locale = 'fr-FR') {
  if (!dateStr) return { primary: '—', weekday: '' };
  const d = new Date(`${dateStr}T12:00:00`);
  return {
    primary: d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }),
    weekday: d.toLocaleDateString(locale, { weekday: 'long' })
  };
}

function formatWeekLabel(weekStart) {
  const [y, m, d] = weekStart.split('-').map(Number);
  const start = new Date(y, m - 1, d);
  const end = new Date(y, m - 1, d + 6);
  const startStr = start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  const endStr = end.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  return `${startStr} – ${endStr}`;
}

function formatMonthLabel(ym) {
  const [y, mo] = ym.split('-');
  const d = new Date(Number(y), Number(mo) - 1, 1);
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

/**
 * @returns {Array<{ id: string, dateStr: string, reps: number, source: string, sourceLabel: string }>}
 */
export function collectCatalogCheckHistory(snapshot, catalogKey, getExerciseNameById) {
  const rows = [];
  const checked = snapshot?.checkedExercises || {};
  const trackPushups = isPushupsCatalogKey(catalogKey, getExerciseNameById);

  for (const [key, val] of Object.entries(checked)) {
    if (val !== true) continue;
    const exId = exerciseIdFromStorageKey(key);
    if (!exId || !exerciseMatchesCatalogKey(catalogKey, exId, getExerciseNameById)) continue;
    const dateStr = key.slice(0, 10);
    const r = sessionRepsForCheckedKey(snapshot, key, getExerciseNameById);
    const name =
      typeof getExerciseNameById === 'function' ? getExerciseNameById(exId) || '' : '';
    let sourceLabel = name || 'Programme';
    if (trackPushups) {
      const ch = classifyPushupWorkoutChannel(exId, getExerciseNameById);
      if (ch === 'handles') sourceLabel = name ? `${name} (poignées)` : 'Pompes poignées';
      else if (ch === 'classic') sourceLabel = name ? `${name} (classiques)` : 'Pompes classiques';
    }
    rows.push({
      id: `w:${key}`,
      dateStr,
      reps: r,
      source: 'workout',
      sourceLabel,
      pushupChannel: trackPushups ? classifyPushupWorkoutChannel(exId, getExerciseNameById) : null
    });
  }

  let enduranceKey = catalogKey;
  const attach = shouldAttachEnduranceToExercise(catalogKey, getExerciseNameById);
  if (attach) enduranceKey = attach;
  if (shouldIncludeEnduranceForCatalog(catalogKey, getExerciseNameById)) {
    let idx = 0;
    forEachEnduranceBenchmarkSession(snapshot, enduranceKey, ({ dateStr, reps: r, session }) => {
      rows.push({
        id: `e:${dateStr}:${idx}:${session?.id ?? idx}`,
        dateStr,
        reps: r,
        source: 'endurance',
        sourceLabel: 'Défis pompes',
        pushupChannel: trackPushups ? 'defis' : null
      });
      idx += 1;
    });
  }

  rows.sort((a, b) => {
    if (b.dateStr !== a.dateStr) return b.dateStr.localeCompare(a.dateStr);
    return b.id.localeCompare(a.id);
  });

  return rows;
}

export function computeCatalogPeriodRecords(snapshot, catalogKey, getExerciseNameById) {
  const byDate = collectCatalogActivityByDate(snapshot, catalogKey, getExerciseNameById);
  const trackPushups = isPushupsCatalogKey(catalogKey, getExerciseNameById);

  let bestDay = { dateStr: null, reps: 0, dateHeadline: null, weekday: '', pushupChannels: null };
  byDate.forEach((v, dateStr) => {
    if (v.reps > bestDay.reps || (v.reps === bestDay.reps && dateStr > (bestDay.dateStr || ''))) {
      const h = formatCatalogDateHeadline(dateStr);
      bestDay = {
        dateStr,
        reps: v.reps,
        dateHeadline: h.primary,
        weekday: h.weekday,
        pushupChannels: v.pushupChannels ? { ...v.pushupChannels } : null
      };
    }
  });

  const byWeek = new Map();
  const byMonth = new Map();
  byDate.forEach((v, dateStr) => {
    const wk = weekStartYmd(dateStr);
    const wPrev = byWeek.get(wk) || {
      reps: 0,
      checks: 0,
      pushupChannels: trackPushups ? emptyPushupChannels() : null
    };
    wPrev.reps += v.reps;
    wPrev.checks += v.checks;
    if (trackPushups) {
      wPrev.pushupChannels = mergePushupChannels(wPrev.pushupChannels, v.pushupChannels);
    }
    byWeek.set(wk, wPrev);
    const mk = monthKey(dateStr);
    const mPrev = byMonth.get(mk) || {
      reps: 0,
      checks: 0,
      pushupChannels: trackPushups ? emptyPushupChannels() : null
    };
    mPrev.reps += v.reps;
    mPrev.checks += v.checks;
    if (trackPushups) {
      mPrev.pushupChannels = mergePushupChannels(mPrev.pushupChannels, v.pushupChannels);
    }
    byMonth.set(mk, mPrev);
  });

  let bestWeek = {
    weekStart: null,
    reps: 0,
    checks: 0,
    label: '',
    dateHeadline: '',
    pushupChannels: null
  };
  byWeek.forEach((agg, weekStart) => {
    if (
      agg.reps > bestWeek.reps ||
      (agg.reps === bestWeek.reps && weekStart > (bestWeek.weekStart || ''))
    ) {
      bestWeek = {
        weekStart,
        reps: agg.reps,
        checks: agg.checks,
        label: formatWeekLabel(weekStart),
        dateHeadline: formatWeekLabel(weekStart),
        pushupChannels: agg.pushupChannels ? { ...agg.pushupChannels } : null
      };
    }
  });

  let bestMonth = {
    monthKey: null,
    reps: 0,
    checks: 0,
    label: '',
    dateHeadline: '',
    pushupChannels: null
  };
  byMonth.forEach((agg, mk) => {
    if (agg.reps > bestMonth.reps || (agg.reps === bestMonth.reps && mk > (bestMonth.monthKey || ''))) {
      bestMonth = {
        monthKey: mk,
        reps: agg.reps,
        checks: agg.checks,
        label: formatMonthLabel(mk),
        dateHeadline: formatMonthLabel(mk),
        pushupChannels: agg.pushupChannels ? { ...agg.pushupChannels } : null
      };
    }
  });

  return { bestDay, bestWeek, bestMonth };
}

export function annotateCheckHistory(rows, periodRecords) {
  const bestDayStr = periodRecords?.bestDay?.dateStr;
  let peakSessionReps = 0;
  rows.forEach((r) => {
    if (r.reps > peakSessionReps) peakSessionReps = r.reps;
  });

  return rows.map((row) => {
    const h = formatCatalogDateHeadline(row.dateStr);
    return {
      ...row,
      dateHeadline: h.primary,
      weekday: h.weekday,
      isBestDay: Boolean(bestDayStr && row.dateStr === bestDayStr),
      isPeakSession: peakSessionReps > 0 && row.reps === peakSessionReps
    };
  });
}

export function groupCheckHistoryByMonth(rows) {
  const map = new Map();
  for (const row of rows) {
    const mk = row.dateStr.slice(0, 7);
    if (!map.has(mk)) map.set(mk, []);
    map.get(mk).push(row);
  }
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([monthKey, items]) => ({
      monthKey,
      monthLabel: formatMonthLabel(monthKey),
      items
    }));
}
