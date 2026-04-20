/**
 * Hook pour calculer l'XP des livres à partir des sessions de lecture
 */

import { useMemo, useRef, useState, useEffect } from 'react';
import { useBooksStorage } from './useBooksStorage';
import { calculateBooksXP } from '../services/xp/xpCalculations';
import {
  loadReadingDayFeedbacks,
  computeBooksDayFeedbackXpBonus,
} from '../utils/readingDayFeedbacksStorage';

const DEFAULT_BREAKDOWN = { sessions: 0, pages: 0, pagesPerHour: 0 };
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

    let sessionCount = 0;
    let totalPages = 0;
    let totalMinutes = 0;

    books.forEach((book) => {
      const readingSessions = Array.isArray(book?.readingSessions)
        ? book.readingSessions
        : [];
      readingSessions.forEach((session) => {
        sessionCount += 1;
        totalPages += Number(session?.pagesRead) || 0;
        totalMinutes += Number(session?.durationMinutes) || 0;
      });
    });

    const fbSig = JSON.stringify(loadReadingDayFeedbacks());
    const signature = `${sessionCount}|${totalPages}|${totalMinutes}|${fbSig}|${books.map((b) => `${b.id}:${b.status}:${b.genre || ''}`).join(';')}`;
    if (cacheRef.current.signature === signature) {
      return cacheRef.current.result;
    }
    if (booksXpCache.signature === signature) {
      cacheRef.current = booksXpCache;
      return booksXpCache.result;
    }

    const totalXP = calculateBooksXP(books) + computeBooksDayFeedbackXpBonus(books);
    const pagesPerHour = totalMinutes > 0 ? (totalPages / totalMinutes) * 60 : 0;

    const result = {
      totalXP,
      breakdown: {
        sessions: sessionCount,
        pages: totalPages,
        pagesPerHour: Math.round(pagesPerHour * 10) / 10
      }
    };
    cacheRef.current = { signature, result };
    booksXpCache = { signature, result };
    return result;
  }, [books, isLoading, feedbackTick]);

  const levelInfo = useMemo(() => {
    const totalXP = calculated.totalXP || 0;
    const level = Math.floor(totalXP / 500) + 1;
    const xpForCurrentLevel = (level - 1) * 500;
    const xpForNextLevel = level * 500;
    const xpProgress = totalXP - xpForCurrentLevel;
    const xpNeeded = xpForNextLevel - totalXP;
    const percent = (xpProgress / (xpForNextLevel - xpForCurrentLevel)) * 100;

    return {
      level,
      progress: {
        percent: Math.min(100, Math.max(0, percent)),
        xpNeeded
      }
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
