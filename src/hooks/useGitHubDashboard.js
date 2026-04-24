import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchContributionsForRange,
  fetchMultiYearContributions,
  fetchViewerMeta,
  yearRangeUtc,
  rollingTwelveMonthsRangeUtc,
  computeContributionStats,
} from '../utils/githubContributions';

function yearSpanFromCreated(createdAtIso, maxYearsBack = 25) {
  const now = new Date().getUTCFullYear();
  let start = now - maxYearsBack;
  if (createdAtIso) {
    try {
      const y = new Date(createdAtIso).getUTCFullYear();
      if (!Number.isNaN(y)) start = Math.min(now, Math.max(start, y));
    } catch {
      // ignore
    }
  }
  const years = [];
  for (let y = start; y <= now; y += 1) years.push(y);
  if (!years.length) years.push(now);
  return years;
}

export function useGitHubDashboard(accessToken, enabled) {
  const [viewer, setViewer] = useState(null);
  /** 'rolling' = 12 derniers mois (style GitHub profil) ; 'civil' = 1er janv. → 31 déc. */
  const [heatmapMode, setHeatmapMode] = useState('rolling');
  const [civilYear, setCivilYear] = useState(() => new Date().getUTCFullYear());
  /** Statistiques : alignée sur le graphe | une année précise | toutes les années. */
  const [statsScope, setStatsScope] = useState('current'); // 'current' | 'all' | number
  const [yearWeeks, setYearWeeks] = useState([]);
  const [yearTotal, setYearTotal] = useState(0);
  const [multiStats, setMultiStats] = useState(null);
  const [perYearTotals, setPerYearTotals] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const availableYears = useMemo(() => yearSpanFromCreated(viewer?.createdAt), [viewer?.createdAt]);

  useEffect(() => {
    if (!enabled || !accessToken) {
      setViewer(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const v = await fetchViewerMeta(accessToken);
        if (!cancelled) setViewer(v);
      } catch (e) {
        if (!cancelled) setViewer(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, enabled]);

  const loadHeatmapAndStats = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const heatRange =
        heatmapMode === 'rolling' ? rollingTwelveMonthsRangeUtc() : yearRangeUtc(civilYear);
      const res = await fetchContributionsForRange(accessToken, heatRange.from, heatRange.to);
      setYearWeeks(res?.weeks || []);
      setYearTotal(res?.totalContributions ?? 0);

      const span = yearSpanFromCreated(viewer?.createdAt);

      if (statsScope === 'all') {
        const multi = await fetchMultiYearContributions(accessToken, span);
        setMultiStats(multi.stats);
        setPerYearTotals(multi.perYearTotals || {});
      } else if (statsScope === 'current') {
        setMultiStats(computeContributionStats(res?.weeks || []));
        setPerYearTotals({});
      } else {
        const y = Number(statsScope);
        const multi = await fetchMultiYearContributions(accessToken, [y]);
        setMultiStats(multi.stats);
        setPerYearTotals(multi.perYearTotals || {});
      }
    } catch (e) {
      setError(e?.message || String(e));
      setYearWeeks([]);
      setMultiStats(null);
      setPerYearTotals({});
    } finally {
      setLoading(false);
    }
  }, [accessToken, heatmapMode, civilYear, statsScope, viewer?.createdAt]);

  useEffect(() => {
    if (!enabled || !accessToken) {
      setYearWeeks([]);
      setMultiStats(null);
      setError(null);
      return;
    }
    loadHeatmapAndStats();
  }, [enabled, accessToken, heatmapMode, civilYear, statsScope, loadHeatmapAndStats]);

  const statsForUi = useMemo(() => {
    if (!multiStats) return null;
    let label;
    if (statsScope === 'all') {
      label = 'Toutes les années';
    } else if (statsScope === 'current') {
      label = heatmapMode === 'rolling' ? '12 derniers mois' : String(civilYear);
    } else {
      label = String(statsScope);
    }
    return { ...multiStats, label };
  }, [multiStats, statsScope, heatmapMode, civilYear]);

  return {
    viewer,
    heatmapMode,
    setHeatmapMode,
    civilYear,
    setCivilYear,
    statsScope,
    setStatsScope,
    yearWeeks,
    yearTotal,
    statsForUi,
    perYearTotals,
    availableYears,
    loading,
    error,
    refresh: loadHeatmapAndStats,
  };
}
