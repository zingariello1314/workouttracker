import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getDateStr } from '../../../utils/dateUtils';
import Card, { CardContent, CardHeader, CardTitle } from '../../ui/Card';
import Button from '../../ui/Button';
import { useTranslation } from '../../../utils/translations';
import { LANGUAGES } from '../../../utils/translations/constants';
import { useLanguage } from '../../../context/LanguageContext';
import {
  sortCravingsForDay,
  normalizeCravingsByDay,
  chartDataLast30Days,
  avgIntensitySince,
  countCravingsInRange,
  weeklyTrend,
  cravingsToCsvRows,
  downloadTextFile,
  CRAVING_TRIGGER_OPTIONS,
  CRAVING_OUTCOME_OPTIONS,
} from '../../../utils/addictionQuitHelpers';
import {
  filterCravingsByScope,
  buildCravingTimelineItems,
  listJournalScopeCalendarDaysDescending,
} from '../../../utils/addictionQuitJournalFilters';
import { getActiveSessionId, buildAddictionRecapStats } from '../../../utils/addictionQuitSessionsXp';
import {
  buildPeriodCompareHints,
  relapseGapDays,
  weekendCravingShare,
  thcHeavyDayTriggerHint,
} from '../../../utils/addictionQuitCopilot';
import AddictionQuitCopilotToday from './AddictionQuitCopilotToday';
import AddictionQuitAbstinenceCurves from './AddictionQuitAbstinenceCurves';
import {
  Activity,
  Plus,
  Trash2,
  Pencil,
  Clock,
  Download,
  Copy,
  LayoutList,
  BarChart3,
  Printer,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const TRACK_IDS = ['cigarette', 'thc'];
const CRAVINGS_SUB_KEY = 'addictionQuit.cravingsSub';

function newCravingId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `c_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export default function AddictionQuitCravingsPanel({ aq, onSaveData }) {
  const t = useTranslation();
  const { language } = useLanguage();
  const isFr = language === LANGUAGES.FR;
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [filterTrack, setFilterTrack] = useState('all');
  const [journalScope, setJournalScope] = useState('current_session');
  const [cravingsSub, setCravingsSub] = useState(() => {
    try {
      const s = localStorage.getItem(CRAVINGS_SUB_KEY);
      if (s === 'journal' || s === 'recap') return s;
    } catch {
      /* ignore */
    }
    return 'journal';
  });
  const [toast, setToast] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(CRAVINGS_SUB_KEY, cravingsSub);
    } catch {
      /* ignore */
    }
  }, [cravingsSub]);

  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(''), 2200);
    return () => clearTimeout(id);
  }, [toast]);

  const todayStr = getDateStr(new Date(nowTick));

  const cravingsForScope = useMemo(
    () => filterCravingsByScope(aq, journalScope, filterTrack, nowTick),
    [aq, journalScope, filterTrack, nowTick]
  );

  /** Tous les jours calendaires du scope (y compris 0 envie), aligné sur le graphique d’abstinence / filtres. */
  const dayKeys = useMemo(
    () => listJournalScopeCalendarDaysDescending(journalScope, aq, nowTick),
    [journalScope, aq, nowTick]
  );

  const displayRows = useMemo(() => {
    const rows = {};
    for (const k of dayKeys) {
      const raw = cravingsForScope[k] || [];
      const sorted = sortCravingsForDay(raw).filter(
        (c) => filterTrack === 'all' || c.trackId === filterTrack
      );
      rows[k] = sorted;
    }
    return rows;
  }, [dayKeys, cravingsForScope, filterTrack]);

  const maxSlots = useMemo(() => {
    let m = 1;
    for (const k of dayKeys) {
      const n = (displayRows[k] || []).length;
      if (n > m) m = n;
    }
    return m;
  }, [dayKeys, displayRows]);

  const [form, setForm] = useState({
    day: todayStr,
    time: '',
    trackId: 'cigarette',
    intensity: 5,
    durationMinutes: '',
    notes: '',
    triggerId: '',
    outcomeId: '',
    place: '',
  });

  useEffect(() => {
    setForm((f) => ({ ...f, day: todayStr }));
  }, [todayStr]);

  const persistCravings = useCallback(
    (nextRaw) => {
      const normalized = normalizeCravingsByDay(nextRaw);
      onSaveData({
        ...aq,
        cravingsByDay: normalized,
      });
    },
    [aq, onSaveData]
  );

  const addCraving = useCallback(() => {
    const day = form.day || todayStr;
    const list = [...(aq.cravingsByDay[day] || [])];
    const sid = getActiveSessionId(aq, form.trackId);
    const entry = {
      id: newCravingId(),
      trackId: form.trackId,
      sessionId: sid || 'legacy',
      intensity: Math.min(10, Math.max(1, Number(form.intensity) || 5)),
      timeHHMM: form.time || null,
      durationMinutes:
        form.durationMinutes === '' || form.durationMinutes == null
          ? null
          : Math.max(0, Number(form.durationMinutes)),
      notes: (form.notes || '').trim(),
      triggerId: form.triggerId || '',
      outcomeId: form.outcomeId || '',
      place: (form.place || '').trim(),
      createdAt: new Date().toISOString(),
    };
    list.push(entry);
    const next = { ...aq.cravingsByDay, [day]: list };
    persistCravings(next);
    setForm((f) => ({
      ...f,
      time: '',
      durationMinutes: '',
      notes: '',
      triggerId: '',
      outcomeId: '',
      place: '',
    }));
  }, [form, aq.cravingsByDay, persistCravings, todayStr]);

  const removeCraving = (day, id) => {
    const list = (aq.cravingsByDay[day] || []).filter((c) => c.id !== id);
    const next = { ...aq.cravingsByDay };
    if (list.length === 0) delete next[day];
    else next[day] = list;
    persistCravings(next);
  };

  const [edit, setEdit] = useState(null);

  const saveEdit = () => {
    if (!edit?.id || !edit.day) return;
    const list = [...(aq.cravingsByDay[edit.day] || [])];
    const idx = list.findIndex((c) => c.id === edit.id);
    if (idx === -1) return;
    list[idx] = {
      ...list[idx],
      trackId: edit.trackId,
      intensity: Math.min(10, Math.max(1, Number(edit.intensity) || 5)),
      timeHHMM: edit.timeHHMM || null,
      durationMinutes:
        edit.durationMinutes === '' || edit.durationMinutes == null
          ? null
          : Math.max(0, Number(edit.durationMinutes)),
      notes: (edit.notes || '').trim(),
      triggerId: edit.triggerId || '',
      outcomeId: edit.outcomeId || '',
      place: (edit.place || '').trim(),
    };
    persistCravings({ ...aq.cravingsByDay, [edit.day]: list });
    setEdit(null);
  };

  const d7 = new Date(nowTick);
  d7.setDate(d7.getDate() - 6);
  const start7 = getDateStr(d7);
  const d30 = new Date(nowTick);
  d30.setDate(d30.getDate() - 29);
  const start30 = getDateStr(d30);
  const endStr = todayStr;

  /** Même périmètre que l’historique / graphiques (période + filtre piste). */
  const mapForStats = cravingsForScope;
  const periodKeys = useMemo(() => Object.keys(mapForStats || {}).sort(), [mapForStats]);
  const firstStatDay = periodKeys[0];
  const lastStatDay = periodKeys[periodKeys.length - 1] || todayStr;
  const avgPeriod = useMemo(() => {
    if (!periodKeys.length) return null;
    const from = periodKeys[0];
    const to = periodKeys[periodKeys.length - 1];
    const slice = {};
    for (const [day, arr] of Object.entries(mapForStats || {})) {
      if (day < from || day > to) continue;
      slice[day] = arr;
    }
    return avgIntensitySince(slice, from, filterTrack);
  }, [mapForStats, filterTrack, periodKeys]);
  const nPeriod = countCravingsInRange(
    mapForStats,
    firstStatDay || todayStr,
    lastStatDay || todayStr,
    filterTrack
  );
  let heldN = 0;
  let slippedN = 0;
  Object.values(mapForStats || {}).forEach((arr) => {
    if (!Array.isArray(arr)) return;
    for (const c of arr) {
      if (filterTrack !== 'all' && c.trackId !== filterTrack) continue;
      if (c.outcomeId === 'held') heldN += 1;
      if (c.outcomeId === 'slipped') slippedN += 1;
    }
  });
  const avg7 = avgIntensitySince(aq.cravingsByDay, start7, filterTrack);
  const avg30 = avgIntensitySince(aq.cravingsByDay, start30, filterTrack);
  const nWeek = countCravingsInRange(aq.cravingsByDay, start7, endStr, filterTrack);
  const trend = weeklyTrend(aq.cravingsByDay, filterTrack, new Date(nowTick));
  const trendLabel =
    trend > 0 ? t('addictionQuit.trendUp') : trend < 0 ? t('addictionQuit.trendDown') : t('addictionQuit.trendFlat');

  const chartData = useMemo(
    () => chartDataLast30Days(cravingsForScope, filterTrack, new Date(nowTick)),
    [cravingsForScope, filterTrack, nowTick]
  );

  const timelineItems = useMemo(
    () => buildCravingTimelineItems(aq, filterTrack, journalScope, nowTick),
    [aq, filterTrack, journalScope, nowTick]
  );

  const recapStats = useMemo(() => buildAddictionRecapStats(aq, nowTick), [aq, nowTick]);

  const periodHints = useMemo(() => buildPeriodCompareHints(aq.cravingsByDay, nowTick), [aq.cravingsByDay, nowTick]);
  const recapNarrativeLines = useMemo(() => {
    const parts = [];
    if (periodHints.totalA + periodHints.totalB < 12) {
      parts.push(t('addictionQuit.recapNarrativeNeedData'));
      return parts;
    }
    if (periodHints.heldRateA != null && periodHints.heldRateB != null) {
      const d = periodHints.heldRateA - periodHints.heldRateB;
      if (d > 0.06) parts.push(t('addictionQuit.recapNarrativeMoreHeld'));
      else if (d < -0.06) parts.push(t('addictionQuit.recapNarrativeLessHeld'));
    }
    const wkD = periodHints.wkPctA - periodHints.wkPctB;
    if (wkD > 10) parts.push(t('addictionQuit.recapNarrativeMoreWeekend'));
    else if (wkD < -10) parts.push(t('addictionQuit.recapNarrativeLessWeekend'));
    if (parts.length === 0) parts.push(t('addictionQuit.recapNarrativeStable'));
    return parts;
  }, [periodHints, t]);

  const relapseGaps = useMemo(() => relapseGapDays(aq.relapses), [aq.relapses]);
  const avgRelapseGapDays = useMemo(() => {
    if (!relapseGaps.length) return null;
    return Math.round((relapseGaps.reduce((a, b) => a + b, 0) / relapseGaps.length) * 10) / 10;
  }, [relapseGaps]);

  const thcHeavyHint = useMemo(
    () => thcHeavyDayTriggerHint(aq.cravingsByDay, 90, nowTick),
    [aq.cravingsByDay, nowTick]
  );
  const weekendSharePct = useMemo(
    () => weekendCravingShare(aq.cravingsByDay, 42, nowTick),
    [aq.cravingsByDay, nowTick]
  );

  const formatDur = (ms) => {
    if (!ms || ms <= 0) return '—';
    const d = Math.floor(ms / (24 * 60 * 60 * 1000));
    if (d >= 1) return `${d} j`;
    const h = Math.floor(ms / (60 * 60 * 1000));
    return `${h} h`;
  };

  const totalCravings = useMemo(() => {
    let n = 0;
    Object.values(cravingsForScope || {}).forEach((arr) => {
      if (!Array.isArray(arr)) return;
      for (const c of arr) {
        if (filterTrack === 'all' || c.trackId === filterTrack) n += 1;
      }
    });
    return n;
  }, [cravingsForScope, filterTrack]);

  const quickNow = () => {
    const pad = (x) => String(x).padStart(2, '0');
    const d = new Date();
    setForm((f) => ({
      ...f,
      day: todayStr,
      time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    }));
  };

  const exportCsv = () => {
    const csv = cravingsToCsvRows(cravingsForScope, filterTrack);
    downloadTextFile(`addiction-envies-${todayStr}.csv`, csv);
  };

  const copySummary = async () => {
    const a7 = avg7 != null ? avg7.toFixed(1) : '—';
    const a30 = avg30 != null ? avg30.toFixed(1) : '—';
    const lines = [
      t('addictionQuit.title'),
      `${t('addictionQuit.avg7', { v: a7 })}`,
      `${t('addictionQuit.avg30', { v: a30 })}`,
      `${t('addictionQuit.weekCount', { n: String(nWeek) })}`,
      `${t('addictionQuit.trend', { t: trendLabel })}`,
      `${t('addictionQuit.slotsSummary', { slots: String(maxSlots), total: String(totalCravings) })}`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setToast(t('addictionQuit.copied'));
    } catch {
      setToast('Clipboard error');
    }
  };

  const labelForTrigger = (id) => {
    const o = CRAVING_TRIGGER_OPTIONS.find((x) => x.id === id);
    if (o) return t(o.labelKey);
    return id ? t('addictionQuit.copilotTriggerUnknown') : t('addictionQuit.trigger.none');
  };
  const labelForOutcome = (id) => {
    const o = CRAVING_OUTCOME_OPTIONS.find((x) => x.id === id);
    return o ? t(o.labelKey) : '';
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-100">
          {toast}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-wide text-slate-500">{t('addictionQuit.filterAll')}</span>
        {[
          ['all', t('addictionQuit.filterAll')],
          ['cigarette', t('addictionQuit.filterCig')],
          ['thc', t('addictionQuit.filterThc')],
        ].map(([id, lab]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilterTrack(id)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              filterTrack === id
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {lab}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-700 pb-2" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={cravingsSub === 'journal'}
          onClick={() => setCravingsSub('journal')}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
            cravingsSub === 'journal'
              ? 'bg-violet-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
          }`}
        >
          <LayoutList className="h-4 w-4" />
          {t('addictionQuit.subTabJournal')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={cravingsSub === 'recap'}
          onClick={() => setCravingsSub('recap')}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
            cravingsSub === 'recap'
              ? 'bg-amber-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          {t('addictionQuit.subTabRecap')}
        </button>
      </div>

      {cravingsSub === 'recap' ? (
        <Card id="addiction-quit-recap-print" className="border-slate-600/60 bg-slate-900/50 print:border-0 print:bg-white">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg text-white print:text-black">{t('addictionQuit.subTabRecap')}</CardTitle>
            <Button
              type="button"
              variant="secondary"
              className="border-slate-600 text-slate-200 print:hidden"
              onClick={() => window.print()}
            >
              <Printer className="mr-2 h-4 w-4" />
              {t('addictionQuit.recapPrint')}
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2 lg:grid-cols-3 print:text-black">
            <div className="rounded-lg border border-violet-500/30 bg-violet-950/20 p-3 sm:col-span-2 lg:col-span-3 print:border-slate-300 print:bg-white">
              <div className="text-xs font-semibold text-violet-200/90 print:text-slate-800">
                {t('addictionQuit.recapNarrativeTitle')}
              </div>
              <ul className="mt-2 list-inside list-disc space-y-1 text-slate-200 print:text-slate-900">
                {recapNarrativeLines.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
              <p className="mt-2 text-[10px] text-slate-500 print:text-slate-600">{t('addictionQuit.recapNarrativeFoot')}</p>
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-3 sm:col-span-2 lg:col-span-3 print:border-slate-300 print:bg-white">
              <div className="text-xs font-semibold text-slate-400 print:text-slate-800">{t('addictionQuit.recapGapTitle')}</div>
              {avgRelapseGapDays != null ? (
                <p className="mt-1 text-slate-200 print:text-slate-900">
                  {t('addictionQuit.recapGapAvg', { n: String(avgRelapseGapDays) })}
                </p>
              ) : (
                <p className="mt-1 text-slate-500 print:text-slate-600">{t('addictionQuit.recapGapEmpty')}</p>
              )}
            </div>

            {thcHeavyHint ? (
              <div className="rounded-lg border border-cyan-600/30 bg-cyan-950/20 p-3 sm:col-span-2 lg:col-span-3 print:border-slate-300 print:bg-white">
                <p className="text-sm text-cyan-100/95 print:text-slate-900">
                  {t('addictionQuit.recapThcCorrelation', { trigger: labelForTrigger(thcHeavyHint.triggerId) })}
                </p>
                <p className="mt-1 text-[10px] text-slate-500 print:text-slate-600">{t('addictionQuit.recapCorrelationDisclaimer')}</p>
              </div>
            ) : null}

            <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-3 sm:col-span-2 lg:col-span-3 print:border-slate-300 print:bg-white">
              <label className="flex cursor-pointer flex-wrap items-center gap-2 text-xs text-slate-300 print:text-slate-900">
                <input
                  type="checkbox"
                  checked={!!aq.privacy?.highlightWeekendRisk}
                  onChange={(e) =>
                    onSaveData({
                      ...aq,
                      privacy: { ...aq.privacy, highlightWeekendRisk: e.target.checked },
                    })
                  }
                  className="rounded border-slate-500"
                />
                {t('addictionQuit.recapPrivacyWeekend')}
              </label>
              {aq.privacy?.highlightWeekendRisk && weekendSharePct != null ? (
                <p className="mt-2 text-sm text-amber-100/90 print:text-slate-900">
                  {t('addictionQuit.recapWeekendShare', { pct: String(weekendSharePct) })}
                </p>
              ) : null}
              <p className="mt-1 text-[10px] text-slate-600 print:text-slate-600">{t('addictionQuit.recapPrintHint')}</p>
            </div>

            <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3">
              <div className="text-xs text-amber-200/80">{t('addictionQuit.recapXp')}</div>
              <div className="text-xl font-bold text-white">{recapStats.xpTotal}</div>
              <div className="mt-1 text-xs text-slate-500">
                {t('addictionQuit.recapXpDetail', {
                  m: String(recapStats.xpBreakdown?.milestones ?? 0),
                  d: String(recapStats.xpBreakdown?.daily ?? 0),
                  r: String(recapStats.xpBreakdown?.reflective ?? 0),
                })}
              </div>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-3">
              <div className="text-xs text-slate-500">{t('addictionQuit.recapRelapses')}</div>
              <div className="text-xl font-bold text-white">{recapStats.relapseCount}</div>
              <div className="text-xs text-slate-500">
                {t('addictionQuit.recapRelapsesBy', {
                  c: String(recapStats.relapsesCig),
                  th: String(recapStats.relapsesThc),
                })}
              </div>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-3">
              <div className="text-xs text-slate-500">{t('addictionQuit.recapLongestCig')}</div>
              <div className="text-lg font-semibold text-cyan-200">{formatDur(recapStats.longestMsCig)}</div>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-3">
              <div className="text-xs text-slate-500">{t('addictionQuit.recapLongestThc')}</div>
              <div className="text-lg font-semibold text-violet-200">{formatDur(recapStats.longestMsThc)}</div>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-3">
              <div className="text-xs text-slate-500">{t('addictionQuit.recapAbstinentDaysCig')}</div>
              <div className="text-lg font-semibold text-white">{recapStats.abstinentDaysCig}</div>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-3">
              <div className="text-xs text-slate-500">{t('addictionQuit.recapAbstinentDaysThc')}</div>
              <div className="text-lg font-semibold text-white">{recapStats.abstinentDaysThc}</div>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-3">
              <div className="text-xs text-slate-500">{t('addictionQuit.recapCravingsTotal')}</div>
              <div className="text-lg font-semibold text-white">{recapStats.cravingsTotal}</div>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-3">
              <div className="text-xs text-slate-500">{t('addictionQuit.recapHeldSlipped')}</div>
              <div className="text-lg font-semibold text-emerald-200">
                {recapStats.held} / {recapStats.slipped}
              </div>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-3">
              <div className="text-xs text-slate-500">{t('addictionQuit.recapSessions')}</div>
              <div className="text-lg font-semibold text-white">
                {t('addictionQuit.recapSessionsBy', {
                  c: String(recapStats.sessionsCig),
                  th: String(recapStats.sessionsThc),
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <AddictionQuitAbstinenceCurves
            aq={aq}
            journalScope={journalScope}
            nowTick={nowTick}
            t={t}
            isFr={isFr}
          />
          <AddictionQuitCopilotToday aq={aq} onSaveData={onSaveData} t={t} todayStr={todayStr} />

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-slate-500">{t('addictionQuit.scopeLabel')}</span>
            {[
              ['current_session', t('addictionQuit.scopeCurrent')],
              ['month', t('addictionQuit.scopeMonth')],
              ['year', t('addictionQuit.scopeYear')],
              ['all', t('addictionQuit.scopeAll')],
            ].map(([id, lab]) => (
              <button
                key={id}
                type="button"
                onClick={() => setJournalScope(id)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  journalScope === id
                    ? 'bg-cyan-700 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {lab}
              </button>
            ))}
          </div>

          <Card className="border-slate-600/60 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-lg text-white">{t('addictionQuit.summaryTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2 lg:grid-cols-4">
              {journalScope === 'all' ? (
                <>
                  <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-3">
                    {t('addictionQuit.avg7', { v: avg7 != null ? avg7.toFixed(1) : '—' })}
                  </div>
                  <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-3">
                    {t('addictionQuit.avg30', { v: avg30 != null ? avg30.toFixed(1) : '—' })}
                  </div>
                  <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-3">
                    {t('addictionQuit.weekCount', { n: String(nWeek) })}
                  </div>
                  <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-3">
                    {t('addictionQuit.trend', { t: trendLabel })}
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-3">
                    {t('addictionQuit.avgScope', { v: avgPeriod != null ? avgPeriod.toFixed(1) : '—' })}
                  </div>
                  <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-3">
                    {t('addictionQuit.countScope', { n: String(nPeriod) })}
                  </div>
                  <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-3">
                    {t('addictionQuit.heldScope', { n: String(heldN) })}
                  </div>
                  <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-3">
                    {t('addictionQuit.slippedScope', { n: String(slippedN) })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

      <div className="rounded-xl border border-slate-600/50 bg-slate-900/40 p-4">
        <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-white">
          <Activity className="h-5 w-5 text-violet-400" />
          {t('addictionQuit.chartTitle')}
        </h3>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} interval={2} />
              <YAxis allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 11 }} width={28} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #475569', borderRadius: 8 }}
                labelStyle={{ color: '#e2e8f0' }}
                formatter={(v) => [v, isFr ? 'envies' : 'cravings']}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" className="border-slate-600 text-slate-200" onClick={exportCsv}>
          <Download className="mr-2 h-4 w-4" />
          {t('addictionQuit.exportCsv')}
        </Button>
        <Button type="button" variant="secondary" className="border-slate-600 text-slate-200" onClick={copySummary}>
          <Copy className="mr-2 h-4 w-4" />
          {t('addictionQuit.copySummary')}
        </Button>
      </div>

      <div className="rounded-xl border border-amber-600/30 bg-slate-900/50 p-4">
        <h3 className="mb-2 text-sm font-semibold text-amber-100">{t('addictionQuit.sessionTimelineTitle')}</h3>
        <p className="mb-3 text-xs text-slate-500">{t('addictionQuit.sessionTimelineHelp')}</p>
        <div className="max-h-64 space-y-2 overflow-y-auto text-sm">
          {timelineItems.length === 0 ? (
            <p className="text-slate-500">—</p>
          ) : (
            timelineItems.map((it) => {
              if (it.type === 'divider') {
                const s = it.session;
                const startFmt = s?.startedAtIso
                  ? new Date(s.startedAtIso).toLocaleString(isFr ? 'fr-FR' : 'en-US', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })
                  : '';
                const endFmt = s?.endedAtIso
                  ? new Date(s.endedAtIso).toLocaleString(isFr ? 'fr-FR' : 'en-US', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })
                  : t('addictionQuit.sessionOngoing');
                return (
                  <div
                    key={it.key}
                    className="border-t border-amber-500/40 pt-2 text-center text-xs font-medium text-amber-200/90"
                  >
                    {t('addictionQuit.sessionDivider', { start: startFmt, end: endFmt })}
                  </div>
                );
              }
              const { day, c } = it;
              return (
                <div
                  key={it.key}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-700 bg-slate-800/60 px-2 py-1.5 text-xs"
                >
                  <span className="text-slate-400">
                    {day} {c.timeHHMM ? `· ${c.timeHHMM}` : ''}
                  </span>
                  <span className="font-semibold text-cyan-200">{c.intensity}/10</span>
                  <span className="text-slate-500">
                    {(aq.tracks[c.trackId]?.displayName || c.trackId) +
                      ' · ' +
                      labelForTrigger(c.triggerId) +
                      ' · ' +
                      labelForOutcome(c.outcomeId)}
                  </span>
                  <button
                    type="button"
                    className="text-violet-400 hover:text-violet-300"
                    onClick={() =>
                      setEdit({
                        day,
                        id: c.id,
                        trackId: c.trackId,
                        intensity: c.intensity,
                        timeHHMM: c.timeHHMM || '',
                        durationMinutes: c.durationMinutes ?? '',
                        notes: c.notes || '',
                        triggerId: c.triggerId || '',
                        outcomeId: c.outcomeId || '',
                        place: c.place || '',
                      })
                    }
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-600/50 bg-slate-900/40 p-4">
        <h3 className="mb-3 flex flex-wrap items-center justify-between gap-2 text-lg font-semibold text-white">
          <span className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-violet-400" />
            {t('addictionQuit.recordCraving')}
          </span>
          <Button type="button" className="bg-amber-600/90 hover:bg-amber-500 text-sm" onClick={quickNow}>
            <Plus className="mr-1 h-4 w-4" />
            {t('addictionQuit.quickAdd')}
          </Button>
        </h3>
        <p className="mb-4 text-sm text-slate-400">{t('addictionQuit.recordHelp')}</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs text-slate-400">
            {t('addictionQuit.day')}
            <input
              type="date"
              value={form.day}
              onChange={(e) => setForm((f) => ({ ...f, day: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-sm text-white"
            />
          </label>
          <label className="text-xs text-slate-400">
            {t('addictionQuit.timeOptional')}
            <input
              type="time"
              value={form.time}
              onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-sm text-white"
            />
          </label>
          <label className="text-xs text-slate-400">
            {t('addictionQuit.track')}
            <select
              value={form.trackId}
              onChange={(e) => setForm((f) => ({ ...f, trackId: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-sm text-white"
            >
              {TRACK_IDS.map((id) => (
                <option key={id} value={id}>
                  {aq.tracks[id]?.displayName || id}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-400">
            {t('addictionQuit.intensity')}
            <input
              type="range"
              min={1}
              max={10}
              value={form.intensity}
              onChange={(e) => setForm((f) => ({ ...f, intensity: Number(e.target.value) }))}
              className="mt-2 w-full"
            />
            <span className="text-sm text-cyan-200">{form.intensity}</span>
          </label>
          <label className="text-xs text-slate-400">
            {t('addictionQuit.trigger')}
            <select
              value={form.triggerId}
              onChange={(e) => setForm((f) => ({ ...f, triggerId: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-sm text-white"
            >
              {CRAVING_TRIGGER_OPTIONS.map((o) => (
                <option key={o.id || 'none'} value={o.id}>
                  {t(o.labelKey)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-400">
            {t('addictionQuit.outcome')}
            <select
              value={form.outcomeId}
              onChange={(e) => setForm((f) => ({ ...f, outcomeId: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-sm text-white"
            >
              {CRAVING_OUTCOME_OPTIONS.map((o) => (
                <option key={o.id || 'none'} value={o.id}>
                  {t(o.labelKey)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-400">
            {t('addictionQuit.place')}
            <input
              value={form.place}
              onChange={(e) => setForm((f) => ({ ...f, place: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-sm text-white"
            />
          </label>
          <label className="text-xs text-slate-400 lg:col-span-2">
            {t('addictionQuit.durationMin')}
            <input
              type="number"
              min={0}
              value={form.durationMinutes}
              onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-sm text-white"
            />
          </label>
          <label className="text-xs text-slate-400 lg:col-span-4">
            {t('addictionQuit.notes')}
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-sm text-white"
            />
          </label>
        </div>
        <Button type="button" className="mt-4 bg-violet-600 hover:bg-violet-500" onClick={addCraving}>
          <Plus className="mr-2 h-4 w-4" />
          {t('addictionQuit.addCraving')}
        </Button>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-2">
        <h3 className="text-lg font-semibold text-white">{t('addictionQuit.historyByDay')}</h3>
        <p className="text-sm text-slate-400">
          {t('addictionQuit.slotsSummary', { slots: String(maxSlots), total: String(totalCravings) })}
        </p>
      </div>

      {/* Desktop : tableau */}
      <div className="hidden overflow-x-auto rounded-xl border border-slate-600/50 md:block">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-600 bg-slate-900/80 text-left text-xs uppercase text-slate-500">
              <th className="sticky left-0 z-10 min-w-[160px] bg-slate-900/95 px-3 py-2">{t('addictionQuit.day')}</th>
              {Array.from({ length: maxSlots }, (_, i) => (
                <th key={i} className="px-2 py-2 text-center text-slate-400">
                  #{i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dayKeys.map((day) => {
              const arr = displayRows[day] || [];
              const label = new Date(day + 'T12:00:00').toLocaleDateString(isFr ? 'fr-FR' : 'en-GB', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });
              const isToday = day === todayStr;
              return (
                <tr key={day} className={`border-b border-slate-800 ${isToday ? 'bg-cyan-950/20' : ''}`}>
                  <td className="sticky left-0 z-10 bg-slate-950/95 px-3 py-2 font-medium text-slate-200">
                    <div>{label}</div>
                    <div className="text-xs font-normal text-slate-500">
                      {t('addictionQuit.cravingsOnDay', { n: String(arr.length) })}
                    </div>
                  </td>
                  {Array.from({ length: maxSlots }, (_, i) => {
                    const c = arr[i];
                    return (
                      <td key={i} className="align-top p-1">
                        {c ? (
                          <div className="group relative min-h-[88px] rounded-lg border border-slate-600 bg-slate-800/80 p-2 text-xs">
                            <div className="mb-1 flex items-center justify-between gap-1">
                              <span
                                className={`rounded px-1.5 py-0.5 font-bold ${
                                  c.trackId === 'thc'
                                    ? 'bg-purple-600/40 text-purple-100'
                                    : 'bg-rose-600/40 text-rose-100'
                                }`}
                              >
                                {c.intensity}/10
                              </span>
                              <div className="flex gap-0.5 opacity-0 transition group-hover:opacity-100">
                                <button
                                  type="button"
                                  className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-white"
                                  onClick={() =>
                                    setEdit({
                                      day,
                                      id: c.id,
                                      trackId: c.trackId,
                                      intensity: c.intensity,
                                      timeHHMM: c.timeHHMM || '',
                                      durationMinutes: c.durationMinutes ?? '',
                                      notes: c.notes || '',
                                      triggerId: c.triggerId || '',
                                      outcomeId: c.outcomeId || '',
                                      place: c.place || '',
                                    })
                                  }
                                  aria-label={t('addictionQuit.editTitle')}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  className="rounded p-1 text-slate-400 hover:bg-red-900/50 hover:text-red-200"
                                  onClick={() => {
                                    if (window.confirm(t('addictionQuit.deleteConfirm'))) removeCraving(day, c.id);
                                  }}
                                  aria-label={t('addictionQuit.deleteConfirm')}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                            {c.timeHHMM && (
                              <div className="flex items-center gap-1 text-slate-400">
                                <Clock className="h-3 w-3" />
                                {c.timeHHMM}
                              </div>
                            )}
                            {c.triggerId ? (
                              <div className="text-slate-500">{labelForTrigger(c.triggerId)}</div>
                            ) : null}
                            {c.outcomeId ? (
                              <div className="text-slate-500">{labelForOutcome(c.outcomeId)}</div>
                            ) : null}
                            {c.durationMinutes != null && (
                              <div className="text-slate-500">~{c.durationMinutes} min</div>
                            )}
                            {c.place ? <div className="text-slate-500">{c.place}</div> : null}
                            {c.notes && <div className="mt-1 line-clamp-3 text-slate-400">{c.notes}</div>}
                          </div>
                        ) : (
                          <div className="min-h-[88px] rounded-lg border border-dashed border-slate-700 bg-slate-900/40" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile : cartes */}
      <div className="space-y-4 md:hidden">
        <p className="text-xs text-slate-500">{t('addictionQuit.mobileCards')}</p>
        {dayKeys.map((day) => {
          const arr = displayRows[day] || [];
          const label = new Date(day + 'T12:00:00').toLocaleDateString(isFr ? 'fr-FR' : 'en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          });
          return (
            <div key={day} className="rounded-xl border border-slate-600 bg-slate-900/60 p-3">
              <div className="mb-2 font-semibold text-white">{label}</div>
              <div className="space-y-2">
                {arr.length === 0 ? (
                  <p className="text-sm text-slate-500">{t('addictionQuit.dayNoCravings')}</p>
                ) : (
                  arr.map((c) => (
                    <div key={c.id} className="rounded-lg border border-slate-600 bg-slate-800/80 p-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-cyan-200">{c.intensity}/10</span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            className="p-1 text-slate-400"
                            onClick={() =>
                              setEdit({
                                day,
                                id: c.id,
                                trackId: c.trackId,
                                intensity: c.intensity,
                                timeHHMM: c.timeHHMM || '',
                                durationMinutes: c.durationMinutes ?? '',
                                notes: c.notes || '',
                                triggerId: c.triggerId || '',
                                outcomeId: c.outcomeId || '',
                                place: c.place || '',
                              })
                            }
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="p-1 text-slate-400"
                            onClick={() => {
                              if (window.confirm(t('addictionQuit.deleteConfirm'))) removeCraving(day, c.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      {c.timeHHMM && <div className="text-slate-400">{c.timeHHMM}</div>}
                      <div className="text-xs text-slate-500">
                        {c.trackId} · {labelForTrigger(c.triggerId)} · {labelForOutcome(c.outcomeId)}
                      </div>
                      {c.notes ? <div className="mt-1 text-slate-400">{c.notes}</div> : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
        </>
      )}

      {edit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog">
          <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto border-slate-600 bg-slate-900 shadow-2xl">
            <CardHeader>
              <CardTitle>{t('addictionQuit.editTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="text-xs text-slate-400">
                {t('addictionQuit.track')}
                <select
                  value={edit.trackId}
                  onChange={(e) => setEdit((x) => ({ ...x, trackId: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-sm text-white"
                >
                  {TRACK_IDS.map((id) => (
                    <option key={id} value={id}>
                      {aq.tracks[id]?.displayName || id}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-slate-400">
                {t('addictionQuit.intensity')}
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={edit.intensity}
                  onChange={(e) => setEdit((x) => ({ ...x, intensity: Number(e.target.value) }))}
                  className="mt-2 w-full"
                />
                <span className="text-cyan-200">{edit.intensity}</span>
              </label>
              <label className="text-xs text-slate-400">
                {t('addictionQuit.timeOptional')}
                <input
                  type="time"
                  value={edit.timeHHMM || ''}
                  onChange={(e) => setEdit((x) => ({ ...x, timeHHMM: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-sm text-white"
                />
              </label>
              <label className="text-xs text-slate-400">
                {t('addictionQuit.trigger')}
                <select
                  value={edit.triggerId || ''}
                  onChange={(e) => setEdit((x) => ({ ...x, triggerId: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-sm text-white"
                >
                  {CRAVING_TRIGGER_OPTIONS.map((o) => (
                    <option key={o.id || 'none'} value={o.id}>
                      {t(o.labelKey)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-slate-400">
                {t('addictionQuit.outcome')}
                <select
                  value={edit.outcomeId || ''}
                  onChange={(e) => setEdit((x) => ({ ...x, outcomeId: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-sm text-white"
                >
                  {CRAVING_OUTCOME_OPTIONS.map((o) => (
                    <option key={o.id || 'none'} value={o.id}>
                      {t(o.labelKey)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-slate-400">
                {t('addictionQuit.place')}
                <input
                  value={edit.place || ''}
                  onChange={(e) => setEdit((x) => ({ ...x, place: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-sm text-white"
                />
              </label>
              <label className="text-xs text-slate-400">
                {t('addictionQuit.durationMin')}
                <input
                  type="number"
                  min={0}
                  value={edit.durationMinutes}
                  onChange={(e) => setEdit((x) => ({ ...x, durationMinutes: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-sm text-white"
                />
              </label>
              <label className="text-xs text-slate-400">
                {t('addictionQuit.notes')}
                <textarea
                  value={edit.notes}
                  onChange={(e) => setEdit((x) => ({ ...x, notes: e.target.value }))}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-sm text-white"
                />
              </label>
              <div className="flex gap-2 pt-2">
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-500" onClick={saveEdit}>
                  {t('addictionQuit.save')}
                </Button>
                <Button variant="secondary" className="flex-1 border-slate-600" onClick={() => setEdit(null)}>
                  {t('addictionQuit.cancel')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
