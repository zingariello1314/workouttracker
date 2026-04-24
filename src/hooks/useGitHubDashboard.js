import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchContributionsForRange,
  fetchMultiYearContributions,
  fetchViewerMeta,
  yearRangeUtc,
  computeContributionStats,
  contributionLevelToTier,
  tierToHeatClass,
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
  const [displayYear, setDisplayYear] = useState(() => new Date().getUTCFullYear());
  /** Statistiques : même année que le graphe | une année précise | agrégat toutes les années. */
  const [statsScope, setStatsScope] = useState('current'); // 'current' | 'all' | number (année)
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

  const loadYearHeatmap = useCallback(
    async (year) => {
      if (!accessToken) return;
      const { from, to } = yearRangeUtc(year);
      const res = await fetchContributionsForRange(accessToken, from, to);
      setYearWeeks(res?.weeks || []);
      setYearTotal(res?.totalContributions ?? 0);
    },
    [accessToken],
  );

  const loadStats = useCallback(
    async (statArg, heatYear) => {
      if (!accessToken) return;
      setLoading(true);
      setError(null);
      try {
        await loadYearHeatmap(heatYear);
        const span = yearSpanFromCreated(viewer?.createdAt);
        let yearsForStats;
        if (statArg === 'all') {
          yearsForStats = span;
        } else {
          yearsForStats = [Number(statArg)];
        }
        const multi = await fetchMultiYearContributions(accessToken, yearsForStats);
        setMultiStats(multi.stats);
        setPerYearTotals(multi.perYearTotals || {});
      } catch (e) {
        setError(e?.message || String(e));
        setYearWeeks([]);
        setMultiStats(null);
      } finally {
        setLoading(false);
      }
    },
    [accessToken, loadYearHeatmap, viewer?.createdAt],
  );

  useEffect(() => {
    if (!enabled || !accessToken) {
      setYearWeeks([]);
      setMultiStats(null);
      setError(null);
      return;
    }
    const statYear =
      statsScope === 'all' ? 'all' : statsScope === 'current' ? displayYear : Number(statsScope);
    loadStats(statYear, displayYear);
  }, [enabled, accessToken, displayYear, statsScope, loadStats]);

  const statsForUi = useMemo(() => {
    if (!multiStats) return null;
    const label =
      statsScope === 'all'
        ? 'Toutes les années'
        : statsScope === 'current'
          ? String(displayYear)
          : String(statsScope);
    return { ...multiStats, label };
  }, [multiStats, statsScope, displayYear]);

  return {
    viewer,
    displayYear,
    setDisplayYear,
    statsScope,
    setStatsScope,
    yearWeeks,
    yearTotal,
    statsForUi,
    perYearTotals,
    availableYears,
    loading,
    error,
    refresh: () => {
      const statYear =
        statsScope === 'all' ? 'all' : statsScope === 'current' ? displayYear : Number(statsScope);
      return loadStats(statYear, displayYear);
    },
  };
}
