import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Footprints } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkout } from '../../context/WorkoutContext';
import { useLanguage } from '../../context/LanguageContext';
import { normalizeProfileQuestionnaire } from '../../features/profileQuestionnaire/schema';
import { useGarminData } from '../../hooks/useGarminData';
import { useTranslation } from '../../utils/translations';
import { loadTranslationNamespace } from '../../utils/translations/loader';
import { ActivityStatsCard } from '../ui/ActivityStatsCard';
import {
  addCalendarDays,
  buildRunningCompareChart,
  buildRunningCompareChartForWindow,
  earliestDateInKmByDate,
  inclusiveCalendarSpanDays,
  sumRunningKmByDate,
  todayIsoLocal,
} from '../../utils/sport/garminRunningPeriodStats';
import { formatPacePerKm, formatSpeed, normalizeGarminDate } from '../tabs/GarminTab/utils/garminFormatters';
import {
  getGarminCardioActivityRunKind,
  getRunningPeakPaceFromEffortLaps,
  isGarminRunningLikeActivity,
} from '../../utils/garminRunningLaps';
import { inferRunningSessionKindFromGarminActivity } from '../../utils/runningSessionClassification';
import {
  computeRunningDistanceRecordsFromGarminActivities,
  formatDurationHms,
} from '../../utils/runningDistanceRecords';
import { computeCadenceByRunKind } from '../../utils/runningCadenceAnalytics';
import { deriveCadenceSpmFromGarmin, deriveVo2FromGarmin, estimateVo2FromAcsm } from '../../utils/runningGarminMetrics';
import {
  computeFundamentalEndurancePaceSummary,
  formatPaceMinPerKm,
} from '../../utils/runningPersonalRecords';
import { getRecapDateWindow } from '../../utils/sport/recapMuscleLoadEngine';
import {
  GARMIN_RUNNING_CARD_PERIOD_LS,
  readStoredRecapViewPeriod,
  RECAP_VIEW_PERIODS,
} from '../../utils/sport/recapViewPeriods';
import {
  buildGarminCardioById,
  buildKmByDateFromRows,
  computeRunningVolumeTotals,
  mergeRunningSessionsWithGarmin
} from '../../utils/sport/runningVolumeTruth';

const PERIODS = [
  { days: 7, key: 'p7' },
  { days: 14, key: 'p14' },
  { days: 21, key: 'p21' },
  { days: 30, key: 'p30' },
  { days: 42, key: 'p42' },
];

const RUNNING_STATS_WINDOW_LS_KEY = 'garmin.runningStats.windowDays';
const RUNNING_STATS_DEFAULT_WINDOW_DAYS = 30;
const RUNNING_STATS_ALLOWED_DAYS = new Set(PERIODS.map((p) => p.days));

function readStoredRunningStatsWindowDays() {
  if (typeof window === 'undefined') return RUNNING_STATS_DEFAULT_WINDOW_DAYS;
  try {
    const raw = window.localStorage.getItem(RUNNING_STATS_WINDOW_LS_KEY);
    if (raw == null || raw === '') return RUNNING_STATS_DEFAULT_WINDOW_DAYS;
    const n = parseInt(raw, 10);
    return RUNNING_STATS_ALLOWED_DAYS.has(n) ? n : RUNNING_STATS_DEFAULT_WINDOW_DAYS;
  } catch {
    return RUNNING_STATS_DEFAULT_WINDOW_DAYS;
  }
}

const NUM_BARS = 8;

function activityAvgHr(act) {
  const raw =
    act?.averageHeartRate ??
    act?.avgHR ??
    act?.meanHeartRate ??
    (act?.heartRate && (act.heartRate.avg ?? act.heartRate.average ?? act.heartRate.value));
  const n = Number(raw);
  return Number.isFinite(n) && n > 35 ? n : 0;
}

function activityMaxHr(act) {
  const n = Number(act?.maxHeartRate ?? act?.maxHR ?? act?.heartRate?.max ?? 0);
  return Number.isFinite(n) && n > 35 ? n : 0;
}

function activityClockTime(act) {
  const raw = String(act?.startTimeLocal || act?.startTimeGmt || act?.date || '');
  const m = raw.match(/(\d{1,2}):(\d{2})/);
  if (m) return `${String(Math.min(23, parseInt(m[1], 10))).padStart(2, '0')}:${m[2]}`;
  return '12:00';
}
/** Colonnes plus larges en sidebar → moins de chevauchement sur les dates. */
const NUM_BARS_SIDEBAR = 5;

/**
 * Carte stats course Garmin (comparaison fenêtre / fenêtre précédente).
 * En `embedded` / `sidebar` : pastilles Aujourd’hui … Toujours (période propre à cette carte, localStorage).
 * @param {{ variant?: 'default' | 'embedded' | 'sidebar', period?: string, onPeriodChange?: Function, showPeriodSelector?: boolean, sessions?: object[], garminById?: Map|null, sessionsPreFiltered?: boolean, timeBand?: string }} props
 */
export default function GarminRunningStatsCard({
  variant = 'default',
  period: controlledPeriod = null,
  onPeriodChange = null,
  showPeriodSelector = true,
  sessions: sessionsProp = null,
  garminById: garminByIdProp = null,
  sessionsPreFiltered = false,
  timeBand = 'all',
}) {
  const t = useTranslation();
  const { language } = useLanguage();
  const { isAuthenticated, currentUser } = useAuth();
  const { setActiveTab, getCurrentData, data: workoutData } = useWorkout();
  const { dbReady, loadDataByRange, loadAllData } = useGarminData();
  const recapStyleLayout = variant === 'embedded' || variant === 'sidebar';
  const [internalCardPeriod, setInternalCardPeriod] = useState(() =>
    readStoredRecapViewPeriod(GARMIN_RUNNING_CARD_PERIOD_LS, '30d')
  );
  const [windowDays, setWindowDays] = useState(readStoredRunningStatsWindowDays);
  const [loading, setLoading] = useState(true);
  const [kmByDate, setKmByDate] = useState(() => new Map());
  const [runningActivities, setRunningActivities] = useState([]);
  const [allTimeRunningActivities, setAllTimeRunningActivities] = useState([]);
  const [garminDataTick, setGarminDataTick] = useState(0);

  const profileAge = useMemo(() => {
    const q = normalizeProfileQuestionnaire(currentUser?.profileQuestionnaire);
    const age = q?.answers?.vitalsSelfReport?.age;
    return Number.isFinite(Number(age)) ? Number(age) : null;
  }, [currentUser?.profileQuestionnaire]);

  useEffect(() => {
    loadTranslationNamespace(language || 'fr', 'garmin').catch(() => {});
  }, [language]);

  useEffect(() => {
    try {
      window.localStorage.setItem(RUNNING_STATS_WINDOW_LS_KEY, String(windowDays));
    } catch {
      // no-op
    }
  }, [windowDays]);

  const cardPeriod = controlledPeriod || internalCardPeriod;
  const setCardPeriod = useCallback(
    (next) => {
      if (typeof onPeriodChange === 'function') {
        onPeriodChange(next);
        return;
      }
      setInternalCardPeriod(next);
    },
    [onPeriodChange]
  );

  useEffect(() => {
    if (!recapStyleLayout || controlledPeriod) return;
    try {
      window.localStorage.setItem(GARMIN_RUNNING_CARD_PERIOD_LS, cardPeriod);
    } catch {
      // no-op
    }
  }, [recapStyleLayout, cardPeriod, controlledPeriod]);

  const activeRecapPeriod = recapStyleLayout ? cardPeriod : null;

  const garminByIdFromActivities = useMemo(
    () => buildGarminCardioById(allTimeRunningActivities),
    [allTimeRunningActivities]
  );

  const garminById = garminByIdProp || garminByIdFromActivities;

  const storedRunningSessions = useMemo(() => {
    const live = getCurrentData?.() || workoutData || {};
    return live?.enduranceData?.sessions?.running || [];
  }, [getCurrentData, workoutData]);

  const unifiedScopeSessions = useMemo(() => {
    if (sessionsProp) return sessionsProp;
    return mergeRunningSessionsWithGarmin(storedRunningSessions, garminById);
  }, [sessionsProp, storedRunningSessions, garminById]);

  const volumePeriod = useMemo(() => {
    if (sessionsPreFiltered) return 'all';
    if (activeRecapPeriod) return activeRecapPeriod;
    if (controlledPeriod) return controlledPeriod;
    return String(windowDays);
  }, [sessionsPreFiltered, activeRecapPeriod, controlledPeriod, windowDays]);

  const unifiedAllVolume = useMemo(() => {
    if (!unifiedScopeSessions.length && garminById.size === 0) return null;
    return computeRunningVolumeTotals(unifiedScopeSessions, garminById, {
      period: 'all',
      timeBand: sessionsPreFiltered ? timeBand : 'all',
      preFiltered: sessionsPreFiltered
    });
  }, [unifiedScopeSessions, garminById, sessionsPreFiltered, timeBand]);

  const unifiedVolume = useMemo(() => {
    if (!unifiedAllVolume) return null;
    if (sessionsPreFiltered || volumePeriod === 'all') return unifiedAllVolume;
    return computeRunningVolumeTotals(unifiedScopeSessions, garminById, {
      period: volumePeriod,
      timeBand,
      preFiltered: false
    });
  }, [
    unifiedAllVolume,
    unifiedScopeSessions,
    garminById,
    volumePeriod,
    timeBand,
    sessionsPreFiltered
  ]);

  const unifiedKmByDate = useMemo(() => {
    if (!unifiedAllVolume?.rows?.length) return null;
    return buildKmByDateFromRows(unifiedAllVolume.rows);
  }, [unifiedAllVolume]);

  const effectiveKmByDate = unifiedKmByDate ?? kmByDate;
  const usesUnifiedVolume = Boolean(unifiedKmByDate?.size);

  useEffect(() => {
    const bump = () => setGarminDataTick((n) => n + 1);
    window.addEventListener('garmin:data:updated', bump);
    window.addEventListener('garmin:refresh:request', bump);
    window.addEventListener('garmin-cache-update', bump);
    window.addEventListener('garmin-sync-complete', bump);
    return () => {
      window.removeEventListener('garmin:data:updated', bump);
      window.removeEventListener('garmin:refresh:request', bump);
      window.removeEventListener('garmin-cache-update', bump);
      window.removeEventListener('garmin-sync-complete', bump);
    };
  }, []);

  useEffect(() => {
    if (!dbReady || !isAuthenticated) {
      setLoading(false);
      setKmByDate(new Map());
      setRunningActivities([]);
      return;
    }
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      const end = todayIsoLocal();
      try {
        if (activeRecapPeriod) {
          if (activeRecapPeriod === 'all') {
            const all = await loadAllData();
            if (cancelled) return;
            const activities = all?.activities || {};
            const byDate = sumRunningKmByDate(activities);
            const cardio = Array.isArray(activities?.cardio) ? activities.cardio : [];
            const runs = cardio.filter((act) => isGarminRunningLikeActivity(act));
            setKmByDate(byDate);
            setRunningActivities(runs);
          } else {
            const w = getRecapDateWindow(activeRecapPeriod, new Date());
            const currStart = w.start;
            const rangeEnd = w.end;
            const wd = inclusiveCalendarSpanDays(currStart, rangeEnd);
            const loadStart = addCalendarDays(addCalendarDays(currStart, -1), -(wd - 1));
            const { activities } = await loadDataByRange(loadStart, rangeEnd);
            if (cancelled) return;
            const byDate = sumRunningKmByDate(activities || {});
            const cardio = Array.isArray(activities?.cardio) ? activities.cardio : [];
            const runs = cardio.filter((act) => isGarminRunningLikeActivity(act));
            setKmByDate(byDate);
            setRunningActivities(runs);
          }
        } else {
          const span = windowDays * 2 + 2;
          const start = addCalendarDays(end, -(span - 1));
          const { activities } = await loadDataByRange(start, end);
          if (cancelled) return;
          const byDate = sumRunningKmByDate(activities || {});
          const cardio = Array.isArray(activities?.cardio) ? activities.cardio : [];
          const runs = cardio.filter((act) => isGarminRunningLikeActivity(act));
          setKmByDate(byDate);
          setRunningActivities(runs);
        }
      } catch {
        if (!cancelled) {
          setKmByDate(new Map());
          setRunningActivities([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [dbReady, isAuthenticated, loadDataByRange, loadAllData, windowDays, garminDataTick, activeRecapPeriod]);

  useEffect(() => {
    if (!dbReady || !isAuthenticated) {
      setAllTimeRunningActivities([]);
      return;
    }
    let cancelled = false;
    loadAllData()
      .then((all) => {
        if (cancelled) return;
        const cardio = Array.isArray(all?.activities?.cardio) ? all.activities.cardio : [];
        setAllTimeRunningActivities(cardio.filter((act) => isGarminRunningLikeActivity(act)));
      })
      .catch(() => {
        if (!cancelled) setAllTimeRunningActivities([]);
      });
    return () => {
      cancelled = true;
    };
  }, [dbReady, isAuthenticated, loadAllData, garminDataTick]);

  const distanceRecords = useMemo(
    () => computeRunningDistanceRecordsFromGarminActivities(allTimeRunningActivities),
    [allTimeRunningActivities]
  );

  const endStr = todayIsoLocal();
  const numBars = variant === 'sidebar' ? NUM_BARS_SIDEBAR : NUM_BARS;

  const recapChartWindow = useMemo(() => {
    if (!activeRecapPeriod) return null;
    const w = getRecapDateWindow(activeRecapPeriod, new Date());
    const rangeEnd = w.end;
    const currStart =
      activeRecapPeriod === 'all'
        ? earliestDateInKmByDate(effectiveKmByDate, rangeEnd) || rangeEnd
        : w.start || rangeEnd;
    return {
      currStart,
      rangeEnd,
      omitPrev: activeRecapPeriod === 'all',
    };
  }, [activeRecapPeriod, effectiveKmByDate]);

  const built = useMemo(() => {
    if (activeRecapPeriod && recapChartWindow) {
      return buildRunningCompareChartForWindow(
        effectiveKmByDate,
        recapChartWindow.currStart,
        recapChartWindow.rangeEnd,
        numBars,
        { omitPreviousComparison: recapChartWindow.omitPrev }
      );
    }
    return buildRunningCompareChart(effectiveKmByDate, endStr, windowDays, numBars);
  }, [activeRecapPeriod, recapChartWindow, effectiveKmByDate, endStr, windowDays, numBars]);

  const runningStats = useMemo(() => {
    const currStart =
      activeRecapPeriod && recapChartWindow ? recapChartWindow.currStart : built?.currStart;
    const currEnd = activeRecapPeriod && recapChartWindow ? recapChartWindow.rangeEnd : endStr;
    if (!currStart || !currEnd || !Array.isArray(runningActivities) || runningActivities.length === 0) {
      return null;
    }

    const toDate = (act) =>
      normalizeGarminDate(act?.date || act?.startTimeLocal || act?.startTimeGmt);
    const toDistanceKm = (act) => {
      let d = act?.distance;
      if (d != null && typeof d === 'object') {
        d = d.total ?? d.value ?? d.current ?? d.avg ?? 0;
      }
      const n = Number(d);
      if (Number.isFinite(n) && n > 0) {
        if (n > 400 && n < 200000) return n / 1000;
        return n;
      }
      const meters = Number(act?.running?.distanceMeters ?? act?.distanceMeters ?? 0);
      if (Number.isFinite(meters) && meters > 0) return meters / 1000;
      return 0;
    };
    const toDurationSec = (act) => {
      const sec = Number(act?.duration ?? 0);
      return Number.isFinite(sec) && sec > 0 ? sec : 0;
    };
    let totalDistanceKm = 0;
    let totalDurationSec = 0;
    let bestPaceSec = null;
    let longest = null;
    let bestIntervalPaceSec = null;
    let bestIntervalAvgSpeedKmh = 0;
    let maxSingleDistanceKm = 0;
    let bestCadence = null;
    let bestVo2 = null;
    let bestSpeedPaceSec = null;
    let maxObservedHr = 0;
    const periodActs = [];

    for (const act of runningActivities) {
      const dk = toDate(act);
      if (!dk || dk < currStart || dk > currEnd) continue;
      const km = toDistanceKm(act);
      const sec = toDurationSec(act);
      if (km <= 0 || sec <= 0) continue;
      periodActs.push(act);
      maxObservedHr = Math.max(maxObservedHr, activityMaxHr(act), activityAvgHr(act));
    }

    const provisionalEf = [];
    for (const act of periodActs) {
      const dk = toDate(act);
      const km = toDistanceKm(act);
      const sec = toDurationSec(act);
      const durMin = sec / 60;
      const ah = activityAvgHr(act);
      if (
        getGarminCardioActivityRunKind(act) !== 'interval' &&
        ah > 0 &&
        km >= 2.5 - 1e-6 &&
        durMin >= 18 - 1e-6
      ) {
        provisionalEf.push({
          date: dk,
          time: activityClockTime(act),
          distance: km,
          duration: durMin,
          avgHR: ah,
          maxHR: activityMaxHr(act) || ah,
          type: 'endurance',
          source: 'garmin'
        });
      }
    }
    const provisionalEfZ2 = computeFundamentalEndurancePaceSummary(provisionalEf, null);
    const classCtx = {
      age: profileAge,
      habitualEfPaceMinPerKm: provisionalEfZ2?.paceMinPerKm ?? null,
      maxObservedHr
    };

    const syntheticForEf = [];

    for (const act of periodActs) {
      const dk = toDate(act);
      const km = toDistanceKm(act);
      const sec = toDurationSec(act);
      const paceSecPerKm = sec / km;
      const kind = inferRunningSessionKindFromGarminActivity(act, classCtx);
      const durMin = sec / 60;

      totalDistanceKm += km;
      totalDurationSec += sec;
      if (km > maxSingleDistanceKm) maxSingleDistanceKm = km;
      if (bestPaceSec == null || paceSecPerKm < bestPaceSec) {
        bestPaceSec = paceSecPerKm;
      }
      if (!longest || sec > longest.durationSec) {
        longest = { durationSec: sec, distanceKm: km };
      }
      if (kind === 'interval') {
        const lapPeak = getRunningPeakPaceFromEffortLaps(act);
        if (lapPeak) {
          if (bestIntervalPaceSec == null || lapPeak.bestPaceSecPerKm < bestIntervalPaceSec) {
            bestIntervalPaceSec = lapPeak.bestPaceSecPerKm;
          }
          if (lapPeak.bestSpeedKmh > bestIntervalAvgSpeedKmh) {
            bestIntervalAvgSpeedKmh = lapPeak.bestSpeedKmh;
          }
        }
      }
      if (kind === 'speed') {
        if (bestSpeedPaceSec == null || paceSecPerKm < bestSpeedPaceSec) {
          bestSpeedPaceSec = paceSecPerKm;
        }
      }
      const cad = deriveCadenceSpmFromGarmin(act);
      if (cad && (!bestCadence || cad.spm > bestCadence.spm)) {
        bestCadence = { spm: cad.spm, source: cad.source };
      }
      const gVo2 = deriveVo2FromGarmin(act);
      const estVo2 = estimateVo2FromAcsm(km, durMin);
      const vo2Pick =
        gVo2 && estVo2
          ? gVo2.vo2 >= estVo2.vo2
            ? gVo2
            : estVo2
          : gVo2 || estVo2;
      if (vo2Pick && (!bestVo2 || vo2Pick.vo2 > bestVo2.vo2)) {
        bestVo2 = { vo2: vo2Pick.vo2, source: vo2Pick.source || 'estimated_acsm' };
      }
      const ah = activityAvgHr(act);
      if (
        kind === 'endurance' &&
        ah > 0 &&
        km >= 2.5 - 1e-6 &&
        durMin >= 18 - 1e-6
      ) {
        syntheticForEf.push({
          date: dk,
          time: activityClockTime(act),
          distance: km,
          duration: durMin,
          avgHR: ah,
          maxHR: activityMaxHr(act) || ah,
          type: 'endurance',
          source: 'garmin'
        });
      }
    }

    const averagePaceSec = totalDistanceKm > 0 ? totalDurationSec / totalDistanceKm : null;
    const efZ2 = computeFundamentalEndurancePaceSummary(syntheticForEf, null);
    const cadenceByKind = computeCadenceByRunKind(periodActs, classCtx);
    return {
      bestPaceSec,
      longest,
      bestIntervalPaceSec,
      bestSpeedPaceSec,
      averagePaceSec,
      bestIntervalAvgSpeedKmh: bestIntervalAvgSpeedKmh > 0 ? bestIntervalAvgSpeedKmh : null,
      maxSingleDistanceKm: maxSingleDistanceKm > 0 ? maxSingleDistanceKm : null,
      bestCadence,
      bestVo2,
      cadenceByKind,
      efZ2PaceLabel:
        efZ2 && efZ2.paceMinPerKm != null ? formatPaceMinPerKm(efZ2.paceMinPerKm) : null,
      efZ2Sample: efZ2?.sampleSize ?? 0,
      efZ2Band:
        efZ2 && efZ2.zone2
          ? `${efZ2.zone2.min}–${efZ2.zone2.max} bpm`
          : null
    };
  }, [runningActivities, built?.currStart, endStr, activeRecapPeriod, recapChartWindow, profileAge]);

  const chartData = useMemo(
    () =>
      built.chartData.map((p) => ({
        label: p.label,
        currentValue: Math.max(6, p.currentPct),
        previousValue: Math.max(4, p.previousPct),
        currentKm: p.currentValue,
        previousKm: p.previousValue,
      })),
    [built.chartData]
  );

  const mainValue = useMemo(() => {
    const v =
      usesUnifiedVolume && unifiedVolume?.totalKm != null
        ? unifiedVolume.totalKm
        : built.totalCurrKm;
    if (v < 1) return `${Math.round(v * 1000)} m`;
    return `${v.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 0 })} km`;
  }, [usesUnifiedVolume, unifiedVolume, built.totalCurrKm]);

  const onGarmin = useCallback(() => {
    setActiveTab?.('garmin');
  }, [setActiveTab]);

  if (!isAuthenticated) {
    return null;
  }

  const wrap =
    variant === 'sidebar'
      ? 'max-w-none [&_.text-3xl]:text-2xl [&_.h-32]:h-24'
      : variant === 'embedded'
        ? 'max-w-full w-full'
        : '';

  return (
    <div className={variant === 'sidebar' ? 'w-full' : ''}>
      {recapStyleLayout ? (
        showPeriodSelector ? (
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            {RECAP_VIEW_PERIODS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setCardPeriod(p.id)}
                aria-pressed={cardPeriod === p.id}
                className={`rounded-full border px-2 py-1 text-[11px] font-medium transition ${
                  cardPeriod === p.id
                    ? variant === 'embedded'
                      ? 'border-[#0F5C45] bg-[#0F5C45]/35 text-white'
                      : 'border-violet-400/70 bg-violet-500/25 text-violet-50'
                    : variant === 'embedded'
                      ? 'border-[#0F4C5C]/60 bg-black text-teal-200/90 hover:border-[#0F5C45]/60'
                      : 'border-slate-600/80 bg-slate-800/60 text-slate-300 hover:border-slate-500'
                }`}
              >
                {t(p.labelKey)}
              </button>
            ))}
          </div>
        ) : null
      ) : (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setWindowDays(p.days)}
              aria-pressed={windowDays === p.days}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                windowDays === p.days
                  ? 'border-violet-400/60 bg-violet-500/20 text-violet-100'
                  : 'border-slate-600/80 bg-slate-800/60 text-slate-300 hover:border-slate-500'
              }`}
            >
              {t(
                `garmin.runningCard${p.key.charAt(0).toUpperCase()}${p.key.slice(1)}`,
                `${p.days} j.`
              )}
            </button>
          ))}
        </div>
      )}
      {loading ? (
        <div
          className={`flex h-48 w-full max-w-full items-center justify-center rounded-xl text-sm ${
            variant === 'embedded'
              ? 'border-2 border-[#0F4C5C]/60 bg-black text-teal-600'
              : 'border border-slate-700/60 bg-slate-900/60 text-slate-400'
          }`}
        >
          {t('garmin.runningCardLoading', 'Chargement des courses…')}
        </div>
      ) : built.totalCurrKm <= 0 && built.totalPrevKm <= 0 && !(unifiedVolume?.totalKm > 0) ? (
        <div
          className={`w-full max-w-full rounded-xl p-4 text-sm ${
            variant === 'embedded'
              ? 'border-2 border-[#0F4C5C]/60 bg-black text-teal-600'
              : 'border border-slate-700/60 bg-slate-900/60 text-slate-400'
          }`}
        >
          {t(
            'garmin.runningCardNoData',
            'Aucune course sur ces fenêtres. Synchronise Garmin ou choisis une période plus longue.'
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <ActivityStatsCard
            className={wrap}
            title={
              usesUnifiedVolume
                ? t('garmin.runningCardTitleUnified', 'Course')
                : t('garmin.runningCardTitle', 'Course (Garmin)')
            }
            icon={<Footprints className="h-6 w-6" />}
            mainValue={mainValue}
            changeValue={Number(built.changeValue.toFixed(2))}
            changeDescription={t('garmin.runningCardVsPrev', 'vs période précédente')}
            chartData={chartData}
            onActionClick={onGarmin}
            sportShell={variant === 'embedded'}
            primaryBarClassName={variant === 'embedded' ? 'bg-[#0F4C5C]' : 'bg-violet-500'}
            secondaryBarClassName={
              variant === 'embedded'
                ? 'bg-[#1E7FA3]/55 dark:bg-[#1E7FA3]/45'
                : 'bg-violet-200/30 dark:bg-violet-900'
            }
            chartAxisDensity={variant === 'sidebar' ? 'compact' : 'default'}
            currentBarSeriesLabel={t('garmin.runningCardChartCurrent', 'Période actuelle')}
            previousBarSeriesLabel={t('garmin.runningCardChartPrevious', 'Période précédente')}
          />
          {variant !== 'sidebar' && runningStats ? (
            <div
              className={`w-full max-w-full rounded-xl p-3 text-xs ${
                recapStyleLayout
                  ? 'border-2 border-[#0F4C5C]/65 bg-black text-teal-100/90'
                  : 'border border-slate-700/80 bg-slate-900/85 text-slate-300'
              }`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div
                  className={`rounded-lg border p-2 ${
                    recapStyleLayout
                      ? 'border-[#0F4C5C]/45 bg-black'
                      : 'border-slate-700/70 bg-slate-950/60'
                  }`}
                >
                  <div className={recapStyleLayout ? 'text-teal-700' : 'text-slate-500'}>Meilleure allure</div>
                  <div className="font-semibold text-white">
                    {runningStats.bestPaceSec ? formatPacePerKm(runningStats.bestPaceSec) : '—'}
                  </div>
                </div>
                <div
                  className={`rounded-lg border p-2 ${
                    recapStyleLayout
                      ? 'border-[#0F4C5C]/45 bg-black'
                      : 'border-slate-700/70 bg-slate-950/60'
                  }`}
                >
                  <div className={recapStyleLayout ? 'text-teal-700' : 'text-slate-500'}>Plus longue distance</div>
                  <div className="font-semibold text-white">
                    {runningStats.maxSingleDistanceKm != null
                      ? `${runningStats.maxSingleDistanceKm.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} km`
                      : '—'}
                  </div>
                </div>
                <div
                  className={`rounded-lg border p-2 ${
                    recapStyleLayout
                      ? 'border-[#0F4C5C]/45 bg-black'
                      : 'border-slate-700/70 bg-slate-950/60'
                  }`}
                >
                  <div className={recapStyleLayout ? 'text-teal-700' : 'text-slate-500'}>Allure moyenne</div>
                  <div className="font-semibold text-white">
                    {runningStats.averagePaceSec ? formatPacePerKm(runningStats.averagePaceSec) : '—'}
                  </div>
                </div>
                <div
                  className={`rounded-lg border p-2 ${
                    recapStyleLayout
                      ? 'border-[#0F4C5C]/45 bg-black'
                      : 'border-slate-700/70 bg-slate-950/60'
                  }`}
                >
                  <div className={recapStyleLayout ? 'text-teal-700' : 'text-slate-500'}>Plus longue durée</div>
                  <div className="font-semibold text-white">
                    {runningStats.longest
                      ? `${Math.round(runningStats.longest.durationSec / 60)} min · ${runningStats.longest.distanceKm.toFixed(2)} km`
                      : '—'}
                  </div>
                </div>
                <div
                  className={`rounded-lg border p-2 ${
                    recapStyleLayout
                      ? 'border-[#0F4C5C]/45 bg-black'
                      : 'border-slate-700/70 bg-slate-950/60'
                  }`}
                >
                  <div className={recapStyleLayout ? 'text-teal-700' : 'text-slate-500'}>Meilleure cadence</div>
                  <div className="font-semibold text-white">
                    {runningStats.bestCadence
                      ? `${runningStats.bestCadence.spm} pas/min`
                      : '—'}
                  </div>
                  {runningStats.bestCadence?.source ? (
                    <div className="mt-0.5 text-[10px] text-teal-600">
                      {runningStats.bestCadence.source === 'garmin_avg'
                        ? 'Garmin — moyenne activité'
                        : runningStats.bestCadence.source === 'garmin_laps'
                          ? 'Garmin — tours'
                          : runningStats.bestCadence.source === 'garmin_max'
                            ? 'Garmin — max'
                            : 'Estimée (allure / fouée)'}
                    </div>
                  ) : null}
                </div>
                <div
                  className={`rounded-lg border p-2 ${
                    recapStyleLayout
                      ? 'border-[#0F4C5C]/45 bg-black'
                      : 'border-slate-700/70 bg-slate-950/60'
                  }`}
                >
                  <div className={recapStyleLayout ? 'text-teal-700' : 'text-slate-500'}>Meilleur VO₂ (retenu)</div>
                  <div className="font-semibold text-white">
                    {runningStats.bestVo2 ? `${runningStats.bestVo2.vo2} ml/kg/min` : '—'}
                  </div>
                  {runningStats.bestVo2?.source ? (
                    <div className="mt-0.5 text-[10px] text-teal-600">
                      {runningStats.bestVo2.source === 'garmin'
                        ? 'Valeur Garmin'
                        : 'Estimée — allure & durée (ACSM simplifié)'}
                    </div>
                  ) : null}
                </div>
                <div
                  className={`rounded-lg border p-2 sm:col-span-2 ${
                    recapStyleLayout
                      ? 'border-[#0F4C5C]/45 bg-black'
                      : 'border-slate-700/70 bg-slate-950/60'
                  }`}
                >
                  <div className={recapStyleLayout ? 'text-teal-700' : 'text-slate-500'}>
                    Allure d’endurance fondamentale (Z2)
                  </div>
                  <div className="font-semibold text-white">
                    {runningStats.efZ2PaceLabel || '—'}
                  </div>
                  <div className="mt-0.5 text-[10px] leading-relaxed text-teal-600">
                    {runningStats.efZ2Sample > 0
                      ? `Médiane sur ${runningStats.efZ2Sample} activité(s) Garmin (≥2,5 km, ≥18 min, FC Z2, hors fractionné). Zone FC estimée : ${runningStats.efZ2Band || '—'}.`
                      : 'Pas assez d’activités avec FC dans la zone sur la période.'}
                  </div>
                </div>
                <div
                  className={`rounded-lg border p-2 ${
                    recapStyleLayout
                      ? 'border-[#0F4C5C]/45 bg-black'
                      : 'border-slate-700/70 bg-slate-950/60'
                  }`}
                >
                  <div className={recapStyleLayout ? 'text-teal-700' : 'text-slate-500'}>
                    Meilleure allure fractionné (tour effort)
                  </div>
                  <div className="font-semibold text-white">
                    {runningStats.bestIntervalPaceSec
                      ? formatPacePerKm(runningStats.bestIntervalPaceSec)
                      : '—'}
                  </div>
                </div>
                <div
                  className={`rounded-lg border p-2 sm:col-span-2 ${
                    recapStyleLayout
                      ? 'border-[#0F4C5C]/45 bg-black'
                      : 'border-slate-700/70 bg-slate-950/60'
                  }`}
                >
                  <div className={recapStyleLayout ? 'text-teal-700' : 'text-slate-500'}>
                    Pic vitesse fractionné (tour effort)
                  </div>
                  <div className="font-semibold text-white">
                    {runningStats.bestIntervalAvgSpeedKmh
                      ? formatSpeed(runningStats.bestIntervalAvgSpeedKmh)
                      : '—'}
                  </div>
                </div>
                <div
                  className={`rounded-lg border p-2 ${
                    recapStyleLayout
                      ? 'border-amber-900/50 bg-amber-950/20'
                      : 'border-amber-700/40 bg-amber-950/30'
                  }`}
                >
                  <div className={recapStyleLayout ? 'text-amber-600' : 'text-amber-500/90'}>
                    Meilleure allure « Vitesse »
                  </div>
                  <div className="font-semibold text-white">
                    {runningStats.bestSpeedPaceSec
                      ? formatPacePerKm(runningStats.bestSpeedPaceSec)
                      : '—'}
                  </div>
                  <div className="mt-0.5 text-[10px] leading-relaxed text-amber-600/90">
                    Effort continu soutenu (hors fractionné), allure stable &gt;10 % plus rapide que votre EF.
                  </div>
                </div>
                <div
                  className={`rounded-lg border p-2 ${
                    recapStyleLayout
                      ? 'border-[#0F4C5C]/45 bg-black'
                      : 'border-slate-700/70 bg-slate-950/60'
                  }`}
                >
                  <div className={recapStyleLayout ? 'text-teal-700' : 'text-slate-500'}>
                    Cadence EF (moyenne)
                  </div>
                  <div className="font-semibold text-white">
                    {runningStats.cadenceByKind?.enduranceFundamental?.spm
                      ? `${runningStats.cadenceByKind.enduranceFundamental.spm} pas/min`
                      : '—'}
                  </div>
                  {runningStats.cadenceByKind?.enduranceFundamental?.sampleSize > 0 ? (
                    <div className="mt-0.5 text-[10px] text-teal-600">
                      {runningStats.cadenceByKind.enduranceFundamental.sampleSize} sortie(s) Z2
                    </div>
                  ) : null}
                </div>
                <div
                  className={`rounded-lg border p-2 ${
                    recapStyleLayout
                      ? 'border-amber-900/50 bg-amber-950/20'
                      : 'border-amber-700/40 bg-amber-950/30'
                  }`}
                >
                  <div className={recapStyleLayout ? 'text-amber-600' : 'text-amber-500/90'}>
                    Cadence vitesse (moyenne)
                  </div>
                  <div className="font-semibold text-white">
                    {runningStats.cadenceByKind?.speed?.spm
                      ? `${runningStats.cadenceByKind.speed.spm} pas/min`
                      : '—'}
                  </div>
                  {runningStats.cadenceByKind?.speed?.sampleSize > 0 ? (
                    <div className="mt-0.5 text-[10px] text-amber-600/90">
                      {runningStats.cadenceByKind.speed.sampleSize} sortie(s) vitesse
                    </div>
                  ) : null}
                </div>
              </div>
              {distanceRecords.records.length > 0 ? (
                <div className="mt-3 border-t border-white/10 pt-3">
                  <div
                    className={`mb-2 text-[11px] font-semibold uppercase tracking-wide ${
                      recapStyleLayout ? 'text-teal-700' : 'text-slate-500'
                    }`}
                  >
                    Records de distance (tous temps)
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    {distanceRecords.records.map((rec) => {
                      const distLabel =
                        rec.distanceKm === 42.195
                          ? '42,2 km'
                          : `${rec.distanceKm % 1 === 0 ? rec.distanceKm : rec.distanceKm.toFixed(1).replace('.', ',')} km`;
                      return (
                        <div
                          key={rec.distanceKm}
                          className={`rounded-lg border p-2 ${
                            recapStyleLayout
                              ? 'border-[#0F4C5C]/45 bg-black'
                              : 'border-slate-700/70 bg-slate-950/60'
                          }`}
                        >
                          <div className={recapStyleLayout ? 'text-teal-700' : 'text-slate-500'}>
                            {distLabel}
                          </div>
                          <div className="font-semibold text-white tabular-nums">
                            {rec.timeSec ? formatDurationHms(rec.timeSec) : '—'}
                          </div>
                          <div className="text-[10px] text-teal-600">
                            {rec.paceLabel !== '—' ? rec.paceLabel : ''}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
