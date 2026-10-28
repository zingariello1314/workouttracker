import { useEffect, useMemo, useRef, useState } from 'react';
import { useGarminData } from './useGarminData';
import { computeGarminDailyStats } from '../utils/sport/recapCrossCoachAggregate';

/**
 * Charge les métriques Garmin quotidiennes sur la fenêtre Récap (phase 2, non bloquant).
 * @param {{ startYmd?: string, endYmd?: string, enabled?: boolean, manualWalkByDate?: Record<string, object>|null, manualSleepByDate?: Record<string, object>|null }} opts
 */
let cachedGarminPartial = null;

export function useRecapCrossCoachGarmin(opts = {}) {
  const {
    startYmd,
    endYmd,
    enabled = true,
    manualWalkByDate = null,
    manualSleepByDate = null,
  } = opts;
  const { dbReady, loadDataByRange } = useGarminData();

  const readyRange = useMemo(() => {
    if (!startYmd || !endYmd) return null;
    return { startYmd, endYmd };
  }, [startYmd, endYmd]);

  const [partial, setPartial] = useState(() => {
    const walkCount = manualWalkByDate ? Object.keys(manualWalkByDate).length : 0;
    const sleepCount = manualSleepByDate ? Object.keys(manualSleepByDate).length : 0;
    const rangeKey = readyRange
      ? `${readyRange.startYmd}|${readyRange.endYmd}|${walkCount}|${sleepCount}`
      : '';
    if (cachedGarminPartial?.status === 'ready' && cachedGarminPartial.rangeKey === rangeKey) {
      return cachedGarminPartial;
    }
    return { status: enabled && readyRange ? 'loading' : 'skipped' };
  });

  const partialRef = useRef(partial);
  partialRef.current = partial;

  useEffect(() => {
    if (!enabled || !readyRange || !dbReady) return undefined;
    const rangeKey = `${readyRange.startYmd}|${readyRange.endYmd}|${
      manualWalkByDate ? Object.keys(manualWalkByDate).length : 0
    }|${manualSleepByDate ? Object.keys(manualSleepByDate).length : 0}`;
    if (partialRef.current.status === 'ready' && partialRef.current.rangeKey === rangeKey) {
      return undefined;
    }

    let cancelled = false;
    setPartial((prev) => (prev.status === 'ready' ? prev : { status: 'loading' }));
    const run = async () => {
      try {
        const { dailyMetrics } = await loadDataByRange(readyRange.startYmd, readyRange.endYmd);
        if (cancelled) return;
        const stats = computeGarminDailyStats(
          dailyMetrics,
          readyRange.startYmd,
          readyRange.endYmd,
          manualWalkByDate,
          manualSleepByDate
        );
        const next = { status: 'ready', rangeKey, ...stats, dailyMetrics: dailyMetrics || {} };
        cachedGarminPartial = next;
        setPartial(next);
      } catch {
        if (!cancelled) {
          setPartial({
            status: 'ready',
            hasAnyGarminSignal: false,
            daysWithStepsData: 0
          });
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [enabled, readyRange, dbReady, loadDataByRange, manualWalkByDate, manualSleepByDate]);

  return partial;
}
