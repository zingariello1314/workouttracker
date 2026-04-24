import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  fetchViewerMeta,
  fetchMultiYearContributions,
  contributionYearSpanUtc,
  contributionStreaksFromWeeks,
} from '../utils/githubContributions';
import { computeCodeCategoryXp, progressiveContributionXp, streakXpMultiplier } from '../services/xp/codeXpRules';
import { loadJournalXpBonusTotal, loadGithubTrophyXpTotal } from '../services/code/codeJournalIDB';

const EMPTY_GH_BREAKDOWN = {
  totalContributions: 0,
  activeCodingDays: 0,
  calendarDays: 0,
  currentStreakDays: 0,
  streakMultiplier: 1,
  contributionXpAwarded: 0,
};

/**
 * XP Code : historique GitHub (multi-années) + bonus journal + XP trophées contributions (IndexedDB).
 */
export function useCodeXP() {
  const { currentUser, isAuthenticated } = useAuth();
  const userId = currentUser?.id || 'main';
  const token = currentUser?.github?.accessToken;
  const githubEnabled = !!(isAuthenticated && token);

  const [githubXp, setGithubXp] = useState(0);
  const [githubBreakdown, setGithubBreakdown] = useState(EMPTY_GH_BREAKDOWN);
  const [journalBonusXp, setJournalBonusXp] = useState(0);
  const [trophyBonusXp, setTrophyBonusXp] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!githubEnabled) {
      setGithubXp(0);
      setGithubBreakdown(EMPTY_GH_BREAKDOWN);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const viewer = await fetchViewerMeta(token);
        if (cancelled) return;
        const years = contributionYearSpanUtc(viewer?.createdAt);
        const multi = await fetchMultiYearContributions(token, years);
        if (cancelled) return;
        const st = multi?.stats;
        const allWeeks = multi?.years?.flatMap((y) => y?.weeks || []) || [];
        const streakInfo = contributionStreaksFromWeeks(allWeeks);
        const currentStreakDays = Number(streakInfo?.current) || 0;
        const multiplier = streakXpMultiplier(currentStreakDays);
        const xp = computeCodeCategoryXp(st, { currentStreakDays });
        setGithubXp(xp);
        setGithubBreakdown({
          totalContributions: st?.totalCommits ?? 0,
          activeCodingDays: st?.activeCodingDays ?? 0,
          calendarDays: st?.calendarDays ?? 0,
          currentStreakDays,
          streakMultiplier: multiplier,
          contributionXpAwarded: Math.round(progressiveContributionXp(st?.totalCommits ?? 0) * multiplier),
        });
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || String(e));
          setGithubXp(0);
          setGithubBreakdown(EMPTY_GH_BREAKDOWN);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [githubEnabled, token, currentUser?.id]);

  useEffect(() => {
    if (!isAuthenticated) {
      setJournalBonusXp(0);
      setTrophyBonusXp(0);
      return;
    }

    let cancelled = false;
    const loadBonuses = async () => {
      try {
        const [j, tr] = await Promise.all([loadJournalXpBonusTotal(userId), loadGithubTrophyXpTotal(userId)]);
        if (!cancelled) {
          setJournalBonusXp(j);
          setTrophyBonusXp(tr);
        }
      } catch {
        if (!cancelled) {
          setJournalBonusXp(0);
          setTrophyBonusXp(0);
        }
      }
    };

    loadBonuses();
    const onJournalXp = () => {
      void loadBonuses();
    };
    const onTrophyXp = () => {
      void loadBonuses();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('momentum-code-journal-xp', onJournalXp);
      window.addEventListener('momentum-github-trophy-xp', onTrophyXp);
    }
    return () => {
      cancelled = true;
      if (typeof window !== 'undefined') {
        window.removeEventListener('momentum-code-journal-xp', onJournalXp);
        window.removeEventListener('momentum-github-trophy-xp', onTrophyXp);
      }
    };
  }, [isAuthenticated, userId]);

  const totalXP = githubXp + journalBonusXp + trophyBonusXp;
  const breakdown = {
    ...githubBreakdown,
    journalXpBonus: journalBonusXp,
    trophyXpBonus: trophyBonusXp,
    githubDerivedXp: githubXp,
  };

  return { totalXP, breakdown, loading, error };
}
