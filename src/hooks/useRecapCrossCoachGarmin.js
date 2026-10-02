import { useEffect, useMemo, useRef, useState } from 'react';
import { useGarminData } from './useGarminData';
import { computeGarminDailyStats } from '../utils/sport/recapCrossCoachAggregate';

/**
 * Charge les métriques Garmin quotidiennes sur la fenêtre Récap (phase 2, non bloquant).
 * @param {{ startYmd?: string, endYmd?: string, enabled?: boolean, manualWalkByDate?: Record<string, object>|null }} opts
 */
export function useRecapCrossCoachGarmin(opts = {}) {
  const { startYmd, endYmd, enabled = true, manualWalkByDate = null } = opts;
  const { dbReady, loadDataByRange } = useGarminData();

  const readyRange = useMemo(() => {
    if (!startYmd || !endYmd) return null;
    return { startYmd, endYmd };
  }, [startYmd, endYmd]);

  const [partial, setPartial] = useState(() => ({
    status: enabled && readyRange ? 'loading' : 'skipped'
  }));

  const partialRef = useRef(partial);
  partialRef.current = partial;

  useEffect(() => {
    if (!enabled || !readyRange || !dbReady) return undefined;
    const rangeKey = `${readyRange.startYmd}|${readyRange.endYmd}|${
      manualWalkByDate ? Object.keys(manualWalkByDate).length : 0
    }`;
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
          manualWalkByDate
        );
        setPartial({ status: 'ready', rangeKey, ...stats, dailyMetrics: dailyMetrics || {} });
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
  }, [enabled, readyRange, dbReady, loadDataByRange, manualWalkByDate]);

  return partial;
}
