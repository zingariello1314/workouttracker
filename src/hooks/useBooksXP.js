/**
 * Hook pour calculer l'XP des livres à partir des sessions de lecture
 */

import { useMemo, useRef, useState, useEffect } from 'react';
import { useBooksStorage } from './useBooksStorage';
import { computeBooksXPTotal } from '../services/xp/xpCalculations';
import {
  loadReadingDayFeedbacks,
  computeBooksDayFeedbackXpBonus,
} from '../utils/readingDayFeedbacksStorage';

const DEFAULT_BREAKDOWN = {
  sessions: 0,
  pages: 0,
  pagesPerHour: 0,
  currentStreak: 0,
  longestStreak: 0,
  streakBonusXp: 0,
  volumeBonusXp: 0,
  sessionSubtotalXp: 0,
};
let booksXpCache = { signature: null, result: { totalXP: 0, breakdown: DEFAULT_BREAKDOWN } };

export const useBooksXP = () => {
  const { books, isLoading } = useBooksStorage();
  const [feedbackTick, setFeedbackTick] = useState(0);
  const cacheRef = useRef({ signature: null, result: { totalXP: 0, breakdown: DEFAULT_BREAKDOWN } });

  useEffect(() => {
    const onFb = () => setFeedbackTick((n) => n + 1);
    window.addEventListener('reading-day-feedbacks-updated', onFb);
    return () => window.removeEventListener('reading-day-feedbacks-updated', onFb);
  }, []);

  const calculated = useMemo(() => {
    if (!Array.isArray(books) || books.length === 0) {
      if (isLoading && booksXpCache.signature) {
        return booksXpCache.result;
      }
      return { totalXP: 0, breakdown: DEFAULT_BREAKDOWN };
    }

    const fbSig = JSON.stringify(loadReadingDayFeedbacks());
    const computation = computeBooksXPTotal(books);
    const {
      sessions: sessionCount,
      pages: totalPages,
      pagesPerHour,
      currentStreak,
      longestStreak,
      streakBonusXp,
      volumeBonusXp,
    } = computation.breakdown;

    const signature = `${sessionCount}|${totalPages}|${pagesPerHour}|${currentStreak}|${longestStreak}|${streakBonusXp}|${volumeBonusXp}|${fbSig}|${books.map((b) => `${b.id}:${b.status}:${b.genre || ''}`).join(';')}`;
    if (cacheRef.current.signature === signature) {
      return cacheRef.current.result;
    }
    if (booksXpCache.signature === signature) {
      cacheRef.current = booksXpCache;
      return booksXpCache.result;
    }

    const totalXP = computation.totalXP + computeBooksDayFeedbackXpBonus(books);

    const result = {
      totalXP,
      breakdown: {
        ...computation.breakdown,
      },
    };
    cacheRef.current = { signature, result };
    booksXpCache = { signature, result };
    return result;
  }, [books, isLoading, feedbackTick]);

  const levelInfo = useMemo(() => {
    const totalXP = calculated.totalXP || 0;
    /** Palier Livres : 500 XP par niveau (aligné avec calculateBooksXP / barre globale). */
    const xpPerLevel = 500;
    const level = Math.floor(totalXP / xpPerLevel) + 1;
    const xpAtLevelStart = (level - 1) * xpPerLevel;
    const xpOnLevel = totalXP - xpAtLevelStart;
    const xpForLevel = xpPerLevel;
    const xpNeeded = Math.max(0, xpAtLevelStart + xpPerLevel - totalXP);
    const percent = (xpOnLevel / xpForLevel) * 100;

    return {
      level,
      progress: {
        percent: Math.min(100, Math.max(0, percent)),
        xpNeeded,
        xpOnLevel,
        xpForLevel,
      },
    };
  }, [calculated.totalXP]);

  return {
    totalXP: calculated.totalXP || 0,
    level: levelInfo.level,
    breakdown: calculated.breakdown || DEFAULT_BREAKDOWN,
    progress: levelInfo.progress,
    isLoading
  };
};
