import React, { useMemo, useState } from 'react';
import { Edit3 } from 'lucide-react';
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
import { DefisCalendarGrid, DefisCalendarRecap } from './ui/DefisCalendar.jsx';

const MONTHS_FR = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre'
];
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

  const levelOf = (key) => {
    const count = (byDateYear.get(key) || []).length;
    if (count === 0) return 0;
    const normalized = maxScore > 0 ? count / maxScore : 0;
    return Math.min(4, Math.max(1, Math.ceil(normalized * 4)));
  };
  const countOf = (key) => (byDateYear.get(key) || []).length;
  const sessionsWord = t('endurance.disciplineCalendar.sessionsWord');

  const periodCards = [
    { key: 'week', title: t('endurance.disciplineCalendar.period.week'), data: recap.week },
    { key: 'month', title: t('endurance.disciplineCalendar.period.month'), data: recap.month },
    { key: 'year', title: t('endurance.disciplineCalendar.period.year', { year: selectedYear }), data: recap.year }
  ].map((col) => ({
    key: col.key,
    title: col.title,
    rows: [
      { label: t('endurance.disciplineCalendar.avgSessions'), value: col.data.avgSessionsPerDay.toFixed(2) },
      {
        label: t('endurance.disciplineCalendar.avgPerf', { unit: t(perfUnitKey) }),
        value: formatPerfValue(activityKind, col.data.avgPerfPerDay)
      }
    ],
    si: `${t('endurance.disciplineCalendar.whenActive')} ${col.data.avgSessionsWhenActive.toFixed(2)} ${sessionsWord} · ${formatPerfValue(activityKind, col.data.avgPerfWhenActive)}`
  }));

  const facts = [
    {
      label: t('endurance.disciplineCalendar.mostSessionsDay'),
      value: recap.maxSessionsDay
        ? formatDate(parseDateKey(recap.maxSessionsDay.key))
        : t('endurance.disciplineCalendar.none'),
      sub: recap.maxSessionsDay ? `(${recap.maxSessionsDay.val})` : null
    },
    {
      label: t('endurance.disciplineCalendar.bestPerfDay'),
      value: recap.bestPerfDay ? formatDate(parseDateKey(recap.bestPerfDay.key)) : t('endurance.disciplineCalendar.none'),
      sub: recap.bestPerfDay ? `(${formatPerfValue(activityKind, recap.bestPerfDay.val)})` : null
    },
    {
      label: t('endurance.disciplineCalendar.longestStreak'),
      value:
        recap.longestStreak && recap.longestStreak.length > 0
          ? `${recap.longestStreak.length} ${t('endurance.disciplineCalendar.days')}`
          : t('endurance.disciplineCalendar.none'),
      sub:
        recap.longestStreak && recap.longestStreak.endKey
          ? `(${formatDate(parseDateKey(recap.longestStreak.endKey))})`
          : null
    },
    {
      label: t('endurance.disciplineCalendar.currentStreak'),
      value:
        recap.currentStreak > 0
          ? `${recap.currentStreak} ${t('endurance.disciplineCalendar.days')}`
          : t('endurance.disciplineCalendar.streakZero')
    }
  ];

  const detail = (
    <>
      {selectedDateKey
        ? t('endurance.disciplineCalendar.detailTitle', { date: selectedDateKey })
        : t('endurance.disciplineCalendar.detailPlaceholder')}
      {selectedDateKey && selectedRows.length === 0 ? (
        <div className="dr">
          <span>{t('endurance.disciplineCalendar.noDaySessions')}</span>
        </div>
      ) : null}
      {selectedRows
        .slice()
        .sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')))
        .map((row) => (
          <div key={`${row.type}-${row.id}-${row.originalIndex}`} className="dr">
            <div>
              <b>{row.title}</b>{' '}
              <span>
                {row.time ? `${row.time} · ` : ''}
                {row.details} · {Math.round(Number(row.durationMin || 0))} min
              </span>
            </div>
            {activityKind !== 'gtg' && onEditSession ? (
              <button type="button" className="btn sm" onClick={() => onEditSession(row.type, row.id)}>
                <Edit3 className="ic" style={{ width: 14, height: 14 }} />
                {t('endurance.actions.edit')}
              </button>
            ) : null}
          </div>
        ))}
    </>
  );

  const runningBlock = (cfg) => (
    <article className="box pf">
      <span className="lab" style={{ color: cfg.color }}>{cfg.title}</span>
      <p className="tiny" style={{ margin: 0 }}>{cfg.hint}</p>
      {cfg.line ? (
        <div className="res" style={{ fontSize: 22 }}>
          <small style={{ marginTop: 0, fontSize: 13.5, color: 'var(--bone)' }}>{cfg.line}</small>
        </div>
      ) : (
        <p className="tiny" style={{ margin: 0 }}>{cfg.none}</p>
      )}
      {cfg.line && onEditSession && cfg.sessionId != null ? (
        <button type="button" className="link" style={{ alignSelf: 'flex-start' }} onClick={() => onEditSession('running', cfg.sessionId)}>
          {t('endurance.disciplineCalendar.runningEditHint')}
        </button>
      ) : null}
    </article>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
      <DefisCalendarRecap
        title={t('endurance.disciplineCalendar.recapTitle')}
        hint={t('endurance.disciplineCalendar.recapHint')}
        cards={periodCards}
        factsTitle={t('endurance.disciplineCalendar.recordsTitle')}
        facts={facts}
      >
        {activityKind === 'running' && (
          <div className="perf">
            {runningBlock({
              color: 'var(--t-cl)',
              title: t('endurance.disciplineCalendar.runningSustainedTitle'),
              hint: t('endurance.disciplineCalendar.runningSustainedHint'),
              none: t('endurance.disciplineCalendar.runningSustainedNone'),
              sessionId: runningSpecial.sustained?.sessionId,
              line: runningSpecial.sustained
                ? t('endurance.disciplineCalendar.runningSustainedLine', {
                    date: formatDate(parseDateKey(String(runningSpecial.sustained.date))),
                    pace: runningSpecial.sustained.paceLabel,
                    duration: formatDurationMinutes(runningSpecial.sustained.durationMin),
                    distance: Number(runningSpecial.sustained.distanceKm).toFixed(2)
                  })
                : null
            })}
            {runningBlock({
              color: 'var(--t-fract)',
              title: t('endurance.disciplineCalendar.runningIntervalTitle'),
              hint: t('endurance.disciplineCalendar.runningIntervalHint'),
              none: t('endurance.disciplineCalendar.runningIntervalNone'),
              sessionId: runningSpecial.interval?.sessionId,
              line: runningSpecial.interval
                ? t('endurance.disciplineCalendar.runningIntervalLine', {
                    date: formatDate(parseDateKey(String(runningSpecial.interval.date))),
                    paceEff: runningSpecial.interval.paceEffortLabel,
                    paceRecPart: runningSpecial.interval.paceRecoveryLabel
                      ? t('endurance.disciplineCalendar.runningIntervalRecPart', {
                          paceRec: runningSpecial.interval.paceRecoveryLabel
                        })
                      : '',
                    laps: runningSpecial.interval.effortLapCount
                  })
                : null
            })}
          </div>
        )}
      </DefisCalendarRecap>

      <DefisCalendarGrid
        year={selectedYear}
        viewMode={viewMode}
        modes={[
          { id: 'mois', label: t('endurance.disciplineCalendar.viewMonth') },
          { id: 'annee', label: t('endurance.disciplineCalendar.viewYear') }
        ]}
        onViewMode={setViewMode}
        monthIndex={selectedMonthIndex}
        monthNames={MONTHS_FR}
        onPrev={() => setSelectedYear((y) => y - 1)}
        onNext={() => setSelectedYear((y) => y + 1)}
        onMonthTitleClick={(monthIdx) => {
          setSelectedMonthIndex(monthIdx);
          setViewMode('mois');
        }}
        levelOf={levelOf}
        countOf={countOf}
        unitLabel={() => t('endurance.disciplineCalendar.sessionsShort')}
        legend={
          activityKind === 'gtg'
            ? t('endurance.gtg.calendar.intensityHint')
            : t('endurance.disciplineCalendar.intensityHint')
        }
        selectedDateKey={selectedDateKey}
        onDayClick={(key, monthIdx) => {
          setSelectedDateKey(key);
          setSelectedMonthIndex(monthIdx);
          setViewMode('mois');
        }}
        dayTitle={(key, count) => `${key} · ${count} session(s)`}
        detail={detail}
      />
    </div>
  );
}
