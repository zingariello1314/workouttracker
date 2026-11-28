import { useEffect, useRef, useState } from 'react';
import { computeSportRecapAggregateOffMain } from '../services/sport/sportRecapAggregatesWorkerClient';
import {
  peekCachedRecapMuscleState,
  peekCachedRecapStrengthCompareModel,
  seedCachedRecapMuscleState,
  seedCachedRecapStrengthCompareModel
} from '../services/sport/sportRecapAggregatesCache';

/**
 * Agrégat sidebar hors chemin de rendu : dernier résultat valide + indicateur stale.
 * Cache chaud → sync. Sinon Worker (fallback idle, jamais sync multi-secondes).
 */
export function useAsyncSportAggregate({
  enabled,
  kind,
  revision,
  snapshot,
  period,
  getExerciseNameById,
  referenceDate,
  numBars = 8,
  emptyValue
}) {
  const [result, setResult] = useState(emptyValue);
  const [isStale, setIsStale] = useState(false);
  const [publishMeta, setPublishMeta] = useState({ via: null, revision: null, degraded: false });
  const genRef = useRef(0);

  useEffect(() => {
    if (!enabled || !snapshot || !revision) return undefined;

    const gen = ++genRef.current;

    const warm =
      kind === 'muscle'
        ? peekCachedRecapMuscleState(snapshot, period, referenceDate)
        : peekCachedRecapStrengthCompareModel(snapshot, period, referenceDate, numBars);

    if (warm) {
      setResult(warm);
      setIsStale(false);
      setPublishMeta({ via: 'cache', revision, degraded: false });
      return undefined;
    }

    setIsStale(true);

    let cancelled = false;
    computeSportRecapAggregateOffMain({
      kind,
      revision,
      snapshot,
      period,
      getExerciseNameById,
      referenceDate,
      numBars
    })
      .then((out) => {
        if (cancelled || gen !== genRef.current || out.stale) return;
        if (!out.result) {
          setPublishMeta({
            via: out.via || 'empty',
            revision,
            degraded: Boolean(out.degraded)
          });
          return;
        }
        if (kind === 'muscle') {
          seedCachedRecapMuscleState(snapshot, period, referenceDate, out.result);
        } else {
          seedCachedRecapStrengthCompareModel(
            snapshot,
            period,
            referenceDate,
            numBars,
            out.result
          );
        }
        setResult(out.result);
        setIsStale(false);
        setPublishMeta({ via: out.via || 'worker', revision, degraded: false });
      })
      .catch(() => {
        /* conserver dernier résultat */
      });

    return () => {
      cancelled = true;
    };
  }, [
    enabled,
    kind,
    revision,
    snapshot,
    period,
    getExerciseNameById,
    referenceDate,
    numBars
  ]);

  return { result, isStale, publishMeta };
}
