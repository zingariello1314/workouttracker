import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Edit3 } from 'lucide-react';
import { parseDurationToMinutes } from '../../../../utils/calendarUtils';
import { useTranslation } from '../../../../utils/translations';
import { useFormatters } from '../../../../utils/translations/formatters-hook';
import {
  computeBestSustainedNonIntervalPace,
  computeBestWeightedIntervalSession
} from '../../../../utils/runningCalendarSpecialRecords';
import {
  collectGtgMiniSetHistory,
  getGtgExerciseLabel,
  normalizeGtgData
} from '../../../../services/endurance/gtgService';

const MONTHS_FR = [
  'Janvier',
  'Fevrier',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Aout',
  'Septembre',
  'Octobre',
  'Novembre',
  'Decembre'
];
const WEEKDAYS_FR = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function toDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDateKey(key) {
  const [y, m, d] = String(key).split('-').map(Number);
  return new Date(y, m - 1, d);
}

function startOfWeekMonday(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  return x;
}

function addDays(d, n) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
}

function eachDateKeyInclusive(start, end) {
  const out = [];
  let cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  while (cur <= last) {
    out.push(toDateKey(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

function levelClass(level) {
  if (level <= 0) return 'bg-black border-[#0F4C5C]/45 text-slate-500';
  if (level === 1) return 'bg-[#0F4C5C]/35 border-[#0F4C5C]/75 text-teal-100';
  if (level === 2) return 'bg-[#1E7FA3]/45 border-[#1E7FA3]/80 text-white';
  if (level === 3) return 'bg-amber-500/45 border-amber-400/80 text-white';
  return 'bg-red-500/55 border-red-400/85 text-white';
}

function mapGtgHistoryToRows(gtgData, ctx = {}) {
  const normalized = normalizeGtgData(gtgData);
  const keys = Object.keys(normalized.days || {}).sort();
  if (!keys.length) return [];
  const history = collectGtgMiniSetHistory(normalized, keys[0], keys[keys.length - 1], ctx);
  return history.map((h, originalIndex) => ({
    type: 'gtg',
    id: `${h.dateStr}_${h.slotIndex}_${h.exerciseId}`,
    originalIndex,
    date: h.dateStr,
    time: h.time || '',
    title: getGtgExerciseLabel(h.exerciseId, normalized.config, ctx),
    durationMin: 0,
    details: `${h.reps} reps`,
    perf: h.reps
  }));
}

function buildRowConfig(activityKind) {
  const editType = activityKind === 'walking' ? 'running' : activityKind;

  const perf = (s) => {
    if (activityKind === 'gtg') return Math.max(0, Number(s.perf) || 0);
    if (activityKind === 'pushups') return Math.max(0, Number(s.count) || 0);
    if (activityKind === 'gainage') return Math.max(0, Number(s.count) || 0);
    if (activityKind === 'jumprope') return Math.max(0, Number(s.jumps) || 0);
    if (activityKind === 'running' || activityKind === 'walking') return Math.max(0, Number(s.distance) || 0);
    return 0;
  };

  const details = (s) => {
    if (activityKind === 'gtg') return String(s.details || `${Number(s.perf || 0)} reps`);
    if (activityKind === 'pushups') return `${Number(s.count || 0)} reps`;
    if (activityKind === 'gainage') return `${Number(s.count || 0)} sec`;
    if (activityKind === 'jumprope') return `${Number(s.jumps || 0)} sauts`;
    return `${Number(s.distance || 0)} km`;
  };

  const durationMin = (s) => {
    if (activityKind === 'pushups')
      return parseDurationToMinutes(s.duration, 'DefisDisciplineCalendarPanel.pushups') || 0;
    if (activityKind === 'jumprope')
      return parseDurationToMinutes(s.duration, 'DefisDisciplineCalendarPanel.jumprope') || 0;
    if (activityKind === 'gainage') return Math.max(0, Number(s.duration) || 0);
    return parseDurationToMinutes(s.duration, 'DefisDisciplineCalendarPanel.running') || 0;
  };

  const title =
    activityKind === 'gtg'
      ? 'GTG'
      : activityKind === 'pushups'
        ? 'Pompes'
        : activityKind === 'gainage'
          ? 'Gainage'
          : activityKind === 'jumprope'
            ? 'Corde'
            : activityKind === 'walking'
              ? 'Marche'
              : 'Course';

  return { editType, perf, details, durationMin, title };
}

function mapSessionsToRows(sessions, activityKind) {
  const cfg = buildRowConfig(activityKind);
  const list = Array.isArray(sessions) ? sessions : [];
  return list
    .map((s, originalIndex) => {
      if (!s?.date) return null;
      return {
        type: cfg.editType,
        id: s.id,
        originalIndex,
        date: String(s.date),
        time: String(s.time || ''),
        title: cfg.title,
        durationMin: cfg.durationMin(s),
        details: cfg.details(s),
        perf: cfg.perf(s)
      };
    })
    .filter(Boolean);
}

function aggregateByDate(rows) {
  const map = new Map();
  rows.forEach((r) => {
    const list = map.get(r.date) || [];
    list.push(r);
    map.set(r.date, list);
  });
  return map;
}

function dayStatsFromMap(byDate, dateKey) {
  const list = byDate.get(dateKey) || [];
  const sessions = list.length;
  const perf = list.reduce((sum, r) => sum + Number(r.perf || 0), 0);
  return { sessions, perf, list };
}

function periodSummary(byDateAll, startKey, endKey) {
  const keys = eachDateKeyInclusive(parseDateKey(startKey), parseDateKey(endKey));
  const numDays = keys.length;
  let totalSessions = 0;
  let totalPerf = 0;
  let activeDays = 0;
  keys.forEach((k) => {
    const { sessions, perf } = dayStatsFromMap(byDateAll, k);
    totalSessions += sessions;
    totalPerf += perf;
    if (sessions > 0) activeDays += 1;
  });
  return {
    numDays,
    totalSessions,
    totalPerf,
    activeDays,
    avgSessionsPerDay: numDays > 0 ? totalSessions / numDays : 0,
    avgPerfPerDay: numDays > 0 ? totalPerf / numDays : 0,
    avgSessionsWhenActive: activeDays > 0 ? totalSessions / activeDays : 0,
    avgPerfWhenActive: activeDays > 0 ? totalPerf / activeDays : 0
  };
}

function longestStreakFromDates(sortedDateKeys) {
  if (!sortedDateKeys.length) return { length: 0, endKey: null };
  let best = { length: 0, endKey: null };
  let run = 1;
  let runEnd = sortedDateKeys[0];
  for (let i = 1; i < sortedDateKeys.length; i += 1) {
    const prev = parseDateKey(sortedDateKeys[i - 1]);
    const cur = parseDateKey(sortedDateKeys[i]);
    const diff = Math.round((cur - prev) / 86400000);
    if (diff === 1) {
      run += 1;
      runEnd = sortedDateKeys[i];
    } else {
      if (run > best.length) best = { length: run, endKey: runEnd };
      run = 1;
      runEnd = sortedDateKeys[i];
    }
  }
  if (run > best.length) best = { length: run, endKey: runEnd };
  return best;
}

function currentStreakStrict(todayKey, sortedDateKeysSet) {
  let n = 0;
  let d = parseDateKey(todayKey);
  for (let i = 0; i < 4000; i += 1) {
    const k = toDateKey(d);
    if (sortedDateKeysSet.has(k)) {
      n += 1;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return n;
}

function formatPerfValue(activityKind, value) {
  const v = Number(value) || 0;
  if (activityKind === 'running' || activityKind === 'walking') return `${v.toFixed(2)} km`;
  if (activityKind === 'gtg') return `${Math.round(v)} reps`;
  return `${Math.round(v)}`;
}

function formatDurationMinutes(m) {
  if (!Number.isFinite(m) || m <= 0) return '—';
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const r = Math.round(m - h * 60);
    return `${h} h ${String(r).padStart(2, '0')} min`;
  }
  return `${Math.round(m)} min`;
}

export default function DefisDisciplineCalendarPanel({
  activityKind,
  sessions,
  garminById = null,
  onEditSession,
  gtgPayload = null
}) {
  const t = useTranslation();
  const { formatDate } = useFormatters();
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [viewMode, setViewMode] = useState('annee');
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(() => new Date().getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState(null);

  const allRows = useMemo(() => {
    if (activityKind === 'gtg' && gtgPayload?.gtgData) {
      return mapGtgHistoryToRows(gtgPayload.gtgData, gtgPayload.ctx || {});
    }
    return mapSessionsToRows(sessions, activityKind);
  }, [sessions, activityKind, gtgPayload]);

  const rowsYear = useMemo(() => {
    const y = String(selectedYear);
    return allRows.filter((r) => String(r.date).startsWith(`${y}-`));
  }, [allRows, selectedYear]);

  const byDateYear = useMemo(() => aggregateByDate(rowsYear), [rowsYear]);
  const byDateAll = useMemo(() => aggregateByDate(allRows), [allRows]);

  const maxScore = useMemo(() => {
    let max = 1;
    byDateYear.forEach((list) => {
      const count = list.length;
      if (count > max) max = count;
    });
    return max;
  }, [byDateYear]);

  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, monthIdx) => {
      const first = new Date(selectedYear, monthIdx, 1);
      const days = new Date(selectedYear, monthIdx + 1, 0).getDate();
      const firstWeekDay = (first.getDay() + 6) % 7;
      const cells = [];
      for (let i = 0; i < firstWeekDay; i += 1) cells.push(null);
      for (let d = 1; d <= days; d += 1) cells.push(new Date(selectedYear, monthIdx, d));
      return { monthIdx, label: MONTHS_FR[monthIdx], cells };
    });
  }, [selectedYear]);

  const selectedRows = selectedDateKey ? byDateYear.get(selectedDateKey) || [] : [];

  const recap = useMemo(() => {
    const now = new Date();
    const todayKey = toDateKey(now);
    const ws = startOfWeekMonday(now);
    const we = addDays(ws, 6);
    const weekStart = toDateKey(ws);
    const weekEnd = toDateKey(we);
    const monthStart = toDateKey(new Date(now.getFullYear(), now.getMonth(), 1));
    const monthEnd = toDateKey(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    const yearStart = `${selectedYear}-01-01`;
    const yearEnd = `${selectedYear}-12-31`;

    const activeDatesSorted = Array.from(
      new Set(allRows.map((r) => r.date).filter(Boolean))
    ).sort();

    const dayMeta = new Map();
    activeDatesSorted.forEach((dk) => {
      const { sessions: sc, perf } = dayStatsFromMap(byDateAll, dk);
      dayMeta.set(dk, { sessions: sc, perf });
    });

    let maxSess = { key: null, val: -1 };
    let maxPerf = { key: null, val: -1 };
    dayMeta.forEach((meta, key) => {
      if (meta.sessions > maxSess.val) maxSess = { key, val: meta.sessions };
      if (meta.perf > maxPerf.val) maxPerf = { key, val: meta.perf };
    });

    const longest = longestStreakFromDates(activeDatesSorted);
    const setDates = new Set(activeDatesSorted);
    const current = currentStreakStrict(todayKey, setDates);

    return {
      week: periodSummary(byDateAll, weekStart, weekEnd),
      month: periodSummary(byDateAll, monthStart, monthEnd),
      year: periodSummary(byDateAll, yearStart, yearEnd),
      maxSessionsDay: maxSess.val > 0 ? maxSess : null,
      bestPerfDay: maxPerf.val > 0 ? maxPerf : null,
      longestStreak: longest.length > 0 ? longest : null,
      currentStreak: current
    };
  }, [allRows, byDateAll, selectedYear]);

  const runningSpecial = useMemo(() => {
    if (activityKind !== 'running') return { sustained: null, interval: null };
    return {
      sustained: computeBestSustainedNonIntervalPace(sessions, garminById),
      interval: computeBestWeightedIntervalSession(sessions, garminById)
    };
  }, [activityKind, sessions, garminById]);

  const perfUnitKey =
    activityKind === 'gtg'
      ? 'endurance.gtg.calendar.perfUnit'
      : `endurance.disciplineCalendar.perfUnit.${activityKind}`;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border-2 border-[#0F4C5C]/70 bg-black p-5">
        <h3 className="mb-3 text-sm font-semibold text-white">
          {t('endurance.disciplineCalendar.recapTitle')}
        </h3>
        <p className="mb-4 text-xs text-teal-200/80">{t('endurance.disciplineCalendar.recapHint')}</p>

        <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
          {[
            { key: 'week', label: t('endurance.disciplineCalendar.period.week'), data: recap.week },
            { key: 'month', label: t('endurance.disciplineCalendar.period.month'), data: recap.month },
            { key: 'year', label: t('endurance.disciplineCalendar.period.year', { year: selectedYear }), data: recap.year }
          ].map((col) => (
            <div key={col.key} className="rounded-xl border border-[#0F4C5C]/45 bg-slate-950/50 p-3">
              <div className="mb-2 text-xs font-medium text-sky-200/90">{col.label}</div>
              <div className="space-y-1 text-xs text-slate-300">
                <div>
                  {t('endurance.disciplineCalendar.avgSessions')}{' '}
                  <span className="font-semibold text-white">
                    {col.data.avgSessionsPerDay.toFixed(2)}
                  </span>
                </div>
                <div>
                  {t('endurance.disciplineCalendar.avgPerf', { unit: t(perfUnitKey) })}{' '}
                  <span className="font-semibold text-white">
                    {formatPerfValue(activityKind, col.data.avgPerfPerDay)}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {t('endurance.disciplineCalendar.whenActive')}{' '}
                  {col.data.avgSessionsWhenActive.toFixed(2)} {t('endurance.disciplineCalendar.sessionsWord')} ·{' '}
                  {formatPerfValue(activityKind, col.data.avgPerfWhenActive)}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-[#0F4C5C]/40 bg-slate-950/40 p-3">
          <div className="mb-2 text-xs font-medium text-sky-200/90">{t('endurance.disciplineCalendar.recordsTitle')}</div>
          <ul className="grid grid-cols-1 gap-2 text-xs text-slate-300 md:grid-cols-2">
            <li>
              <span className="text-slate-500">{t('endurance.disciplineCalendar.mostSessionsDay')}</span>{' '}
              <span className="text-white">
                {recap.maxSessionsDay
                  ? `${formatDate(parseDateKey(recap.maxSessionsDay.key))} (${recap.maxSessionsDay.val})`
                  : t('endurance.disciplineCalendar.none')}
              </span>
            </li>
            <li>
              <span className="text-slate-500">{t('endurance.disciplineCalendar.bestPerfDay')}</span>{' '}
              <span className="text-white">
                {recap.bestPerfDay
                  ? `${formatDate(parseDateKey(recap.bestPerfDay.key))} (${formatPerfValue(activityKind, recap.bestPerfDay.val)})`
                  : t('endurance.disciplineCalendar.none')}
              </span>
            </li>
            <li>
              <span className="text-slate-500">{t('endurance.disciplineCalendar.longestStreak')}</span>{' '}
              <span className="text-white">
                {recap.longestStreak && recap.longestStreak.length > 0
                  ? `${recap.longestStreak.length} ${t('endurance.disciplineCalendar.days')} (${
                      recap.longestStreak.endKey ? formatDate(parseDateKey(recap.longestStreak.endKey)) : ''
                    })`
                  : t('endurance.disciplineCalendar.none')}
              </span>
            </li>
            <li>
              <span className="text-slate-500">{t('endurance.disciplineCalendar.currentStreak')}</span>{' '}
              <span className="text-white">
                {recap.currentStreak > 0
                  ? `${recap.currentStreak} ${t('endurance.disciplineCalendar.days')}`
                  : t('endurance.disciplineCalendar.streakZero')}
              </span>
            </li>
          </ul>

          {activityKind === 'running' && (
            <div className="mt-4 space-y-3 border-t border-[#0F4C5C]/35 pt-4">
              <div className="rounded-lg border border-emerald-800/50 bg-emerald-950/20 p-3">
                <div className="mb-1 text-xs font-semibold text-emerald-100">
                  {t('endurance.disciplineCalendar.runningSustainedTitle')}
                </div>
                <p className="mb-2 text-[11px] leading-relaxed text-slate-500">
                  {t('endurance.disciplineCalendar.runningSustainedHint')}
                </p>
                {runningSpecial.sustained ? (
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-xs text-slate-200">
                      {t('endurance.disciplineCalendar.runningSustainedLine', {
                        date: formatDate(parseDateKey(String(runningSpecial.sustained.date))),
                        pace: runningSpecial.sustained.paceLabel,
                        duration: formatDurationMinutes(runningSpecial.sustained.durationMin),
                        distance: Number(runningSpecial.sustained.distanceKm).toFixed(2)
                      })}
                    </p>
                    {onEditSession && runningSpecial.sustained.sessionId != null && (
                      <button
                        type="button"
                        onClick={() => onEditSession('running', runningSpecial.sustained.sessionId)}
                        className="shrink-0 text-[11px] font-medium text-emerald-400 underline-offset-2 hover:text-emerald-300 hover:underline"
                      >
                        {t('endurance.disciplineCalendar.runningEditHint')}
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">{t('endurance.disciplineCalendar.runningSustainedNone')}</p>
                )}
              </div>

              <div className="rounded-lg border border-amber-800/50 bg-amber-950/15 p-3">
                <div className="mb-1 text-xs font-semibold text-amber-100">
                  {t('endurance.disciplineCalendar.runningIntervalTitle')}
                </div>
                <p className="mb-2 text-[11px] leading-relaxed text-slate-500">
                  {t('endurance.disciplineCalendar.runningIntervalHint')}
                </p>
                {runningSpecial.interval ? (
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-xs text-slate-200">
                      {t('endurance.disciplineCalendar.runningIntervalLine', {
                        date: formatDate(parseDateKey(String(runningSpecial.interval.date))),
                        paceEff: runningSpecial.interval.paceEffortLabel,
                        paceRecPart: runningSpecial.interval.paceRecoveryLabel
                          ? t('endurance.disciplineCalendar.runningIntervalRecPart', {
                              paceRec: runningSpecial.interval.paceRecoveryLabel
                            })
                          : '',
                        laps: runningSpecial.interval.effortLapCount
                      })}
                    </p>
                    {onEditSession && runningSpecial.interval.sessionId != null && (
                      <button
                        type="button"
                        onClick={() => onEditSession('running', runningSpecial.interval.sessionId)}
                        className="shrink-0 text-[11px] font-medium text-amber-400 underline-offset-2 hover:text-amber-300 hover:underline"
                      >
                        {t('endurance.disciplineCalendar.runningEditHint')}
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">{t('endurance.disciplineCalendar.runningIntervalNone')}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border-2 border-[#0F4C5C]/70 bg-black p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {['mois', 'annee'].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`rounded-lg border px-3 py-1.5 text-sm ${
                  viewMode === mode
                    ? 'border-[#1E7FA3]/85 bg-[#1E7FA3]/25 text-white'
                    : 'border-[#0F4C5C]/50 bg-black text-teal-100'
                }`}
              >
                {mode === 'mois' ? t('endurance.disciplineCalendar.viewMonth') : t('endurance.disciplineCalendar.viewYear')}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedYear((y) => y - 1)}
              className="rounded-lg border border-[#0F4C5C]/60 bg-black p-2 text-teal-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="min-w-[92px] text-center text-lg font-semibold text-white">{selectedYear}</div>
            <button
              type="button"
              onClick={() => setSelectedYear((y) => y + 1)}
              className="rounded-lg border border-[#0F4C5C]/60 bg-black p-2 text-teal-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <p className="mb-3 text-xs text-teal-200/75">
          {activityKind === 'gtg'
            ? t('endurance.gtg.calendar.intensityHint')
            : t('endurance.disciplineCalendar.intensityHint')}
        </p>

        <div className="mb-4 flex items-center gap-2 text-xs">
          <span className="text-slate-400">{t('endurance.disciplineCalendar.intensityLabel')}</span>
          {[0, 1, 2, 3, 4].map((lvl) => (
            <span key={lvl} className={`h-3 w-6 rounded-sm border ${levelClass(lvl)}`} />
          ))}
        </div>

        <div className={viewMode === 'mois' ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'}>
          {(viewMode === 'mois' ? [months[selectedMonthIndex]] : months).map((month) => (
            <div key={month.monthIdx} className="rounded-xl border border-[#0F4C5C]/45 bg-black p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold text-white">{month.label}</div>
                <div className="text-[11px] text-teal-200/70">{t('endurance.disciplineCalendar.sessionsShort')}</div>
              </div>
              <div className="mb-1 grid grid-cols-7 gap-1">
                {WEEKDAYS_FR.map((w) => (
                  <div key={`${month.monthIdx}-${w}`} className="text-center text-[10px] text-slate-500">
                    {w}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {month.cells.map((d, idx) => {
                  if (!d) return <div key={`empty-${month.monthIdx}-${idx}`} className="h-8 rounded border border-transparent" />;
                  const key = toDateKey(d);
                  const list = byDateYear.get(key) || [];
                  const count = list.length;
                  const normalized = maxScore > 0 ? count / maxScore : 0;
                  const level = count === 0 ? 0 : Math.min(4, Math.max(1, Math.ceil(normalized * 4)));
                  const isSelected = selectedDateKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setSelectedDateKey(key);
                        setSelectedMonthIndex(month.monthIdx);
                        setViewMode('mois');
                      }}
                      className={`h-8 rounded border text-[11px] transition ${levelClass(level)} ${isSelected ? 'ring-2 ring-sky-400/70' : ''}`}
                      title={`${key} · ${count} session(s)`}
                    >
                      {d.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[#0F4C5C]/55 bg-black p-4">
        <div className="mb-3 text-sm font-semibold text-white">
          {selectedDateKey
            ? t('endurance.disciplineCalendar.detailTitle', { date: selectedDateKey })
            : t('endurance.disciplineCalendar.detailPlaceholder')}
        </div>
        {selectedRows.length === 0 ? (
          <div className="text-sm text-slate-400">{t('endurance.disciplineCalendar.noDaySessions')}</div>
        ) : (
          <div className="space-y-2">
            {selectedRows
              .slice()
              .sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')))
              .map((row) => (
                <div
                  key={`${row.type}-${row.id}-${row.originalIndex}`}
                  className="flex items-center justify-between rounded-lg border border-[#0F4C5C]/40 bg-black p-3"
                >
                  <div>
                    <div className="text-sm font-medium text-white">{row.title}</div>
                    <div className="text-xs text-teal-200/70">
                      {row.time ? `${row.time} · ` : ''}
                      {row.details} · {Math.round(Number(row.durationMin || 0))} min
                    </div>
                  </div>
                  {activityKind !== 'gtg' && onEditSession ? (
                    <button
                      type="button"
                      onClick={() => onEditSession(row.type, row.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#1E7FA3]/70 bg-[#1E7FA3]/20 px-2.5 py-1.5 text-xs font-medium text-white"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      {t('endurance.actions.edit')}
                    </button>
                  ) : null}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
