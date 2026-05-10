import { useEffect, useMemo, useState } from 'react';
import { useGarminData } from './useGarminData';
import { computeGarminDailyStats } from '../utils/sport/recapCrossCoachAggregate';

/**
 * Charge les métriques Garmin quotidiennes sur la fenêtre Récap (phase 2, non bloquant).
 * @param {{ startYmd?: string, endYmd?: string, enabled?: boolean }} opts
 */
export function useRecapCrossCoachGarmin(opts = {}) {
  const { startYmd, endYmd, enabled = true } = opts;
  const { dbReady, loadDataByRange } = useGarminData();

  const readyRange = useMemo(() => {
    if (!startYmd || !endYmd) return null;
    return { startYmd, endYmd };
  }, [startYmd, endYmd]);

  const [partial, setPartial] = useState(() => ({
    status: enabled && readyRange ? 'loading' : 'skipped'
  }));

  useEffect(() => {
    if (!enabled || !readyRange || !dbReady) {
      setPartial({ status: 'skipped' });
      return;
    }

    let cancelled = false;
    const run = async () => {
      try {
        const { dailyMetrics } = await loadDataByRange(readyRange.startYmd, readyRange.endYmd);
        if (cancelled) return;
        const stats = computeGarminDailyStats(dailyMetrics, readyRange.startYmd, readyRange.endYmd);
        setPartial({ status: 'ready', ...stats });
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
  }, [enabled, readyRange, dbReady, loadDataByRange]);

  return partial;
}
