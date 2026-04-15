import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Footprints } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkout } from '../../context/WorkoutContext';
import { useLanguage } from '../../context/LanguageContext';
import { useGarminData } from '../../hooks/useGarminData';
import { useTranslation } from '../../utils/translations';
import { loadTranslationNamespace } from '../../utils/translations/loader';
import { ActivityStatsCard } from '../ui/ActivityStatsCard';
import {
  addCalendarDays,
  buildRunningCompareChart,
  sumRunningKmByDate,
  todayIsoLocal,
} from '../../utils/sport/garminRunningPeriodStats';

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

/**
 * Carte stats course Garmin (comparaison fenêtre / fenêtre précédente).
 * @param {{ variant?: 'default' | 'embedded' | 'sidebar' }} props
 */
export default function GarminRunningStatsCard({ variant = 'default' }) {
  const t = useTranslation();
  const { language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { setActiveTab } = useWorkout();
  const { dbReady, loadDataByRange } = useGarminData();
  const [windowDays, setWindowDays] = useState(readStoredRunningStatsWindowDays);
  const [loading, setLoading] = useState(true);
  const [kmByDate, setKmByDate] = useState(() => new Map());
  const [garminDataTick, setGarminDataTick] = useState(0);

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

  useEffect(() => {
    const bump = () => setGarminDataTick((n) => n + 1);
    window.addEventListener('garmin:data:updated', bump);
    window.addEventListener('garmin:refresh:request', bump);
    return () => {
      window.removeEventListener('garmin:data:updated', bump);
      window.removeEventListener('garmin:refresh:request', bump);
    };
  }, []);

  useEffect(() => {
    if (!dbReady || !isAuthenticated) {
      setLoading(false);
      setKmByDate(new Map());
      return;
    }
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      const end = todayIsoLocal();
      const span = windowDays * 2 + 2;
      const start = addCalendarDays(end, -(span - 1));
      try {
        const { activities } = await loadDataByRange(start, end);
        if (cancelled) return;
        setKmByDate(sumRunningKmByDate(activities || {}));
      } catch {
        if (!cancelled) setKmByDate(new Map());
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [dbReady, isAuthenticated, loadDataByRange, windowDays, garminDataTick]);

  const endStr = todayIsoLocal();
  const built = useMemo(() => {
    return buildRunningCompareChart(kmByDate, endStr, windowDays, NUM_BARS);
  }, [kmByDate, endStr, windowDays]);

  const chartData = useMemo(
    () =>
      built.chartData.map((p) => ({
        label: p.label,
        currentValue: Math.max(6, p.currentPct),
        previousValue: Math.max(4, p.previousPct),
      })),
    [built.chartData]
  );

  const mainValue = useMemo(() => {
    const v = built.totalCurrKm;
    if (v < 1) return `${Math.round(v * 1000)} m`;
    return `${v.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 0 })} km`;
  }, [built.totalCurrKm]);

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
        ? 'max-w-full sm:max-w-md'
        : '';

  return (
    <div className={variant === 'sidebar' ? 'w-full' : ''}>
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
      {loading ? (
        <div className="flex h-48 max-w-sm items-center justify-center rounded-xl border border-slate-700/60 bg-slate-900/60 text-sm text-slate-400">
          {t('garmin.runningCardLoading', 'Chargement des courses…')}
        </div>
      ) : built.totalCurrKm <= 0 && built.totalPrevKm <= 0 ? (
        <div className="max-w-sm rounded-xl border border-slate-700/60 bg-slate-900/60 p-4 text-sm text-slate-400">
          {t(
            'garmin.runningCardNoData',
            'Aucune course sur ces fenêtres. Synchronise Garmin ou choisis une période plus longue.'
          )}
        </div>
      ) : (
        <ActivityStatsCard
          className={wrap}
          title={t('garmin.runningCardTitle', 'Course (Garmin)')}
          icon={<Footprints className="h-6 w-6" />}
          mainValue={mainValue}
          changeValue={Number(built.changeValue.toFixed(2))}
          changeDescription={t('garmin.runningCardVsPrev', 'vs période précédente')}
          chartData={chartData}
          onActionClick={onGarmin}
          primaryBarClassName="bg-violet-500"
          secondaryBarClassName="bg-violet-200/30 dark:bg-violet-900"
        />
      )}
    </div>
  );
}
