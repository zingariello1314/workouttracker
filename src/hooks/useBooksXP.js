/**
 * Hook pour calculer l'XP des livres à partir des sessions de lecture
 */

import { useMemo, useRef } from 'react';
import { useBooksStorage } from './useBooksStorage';
import { calculateBooksXP } from '../services/xp/xpCalculations';

const DEFAULT_BREAKDOWN = { sessions: 0, pages: 0, pagesPerHour: 0 };

export const useBooksXP = () => {
  const { books, isLoading } = useBooksStorage();
  const cacheRef = useRef({ signature: null, result: { totalXP: 0, breakdown: DEFAULT_BREAKDOWN } });

  const calculated = useMemo(() => {
    if (!Array.isArray(books) || books.length === 0) {
      return { totalXP: 0, breakdown: DEFAULT_BREAKDOWN };
    }

    const sessions = [];
    let totalPages = 0;
    let totalMinutes = 0;

    books.forEach((book) => {
      const readingSessions = Array.isArray(book?.readingSessions)
        ? book.readingSessions
        : [];
      readingSessions.forEach((session) => {
        sessions.push(session);
        totalPages += Number(session?.pagesRead) || 0;
        totalMinutes += Number(session?.durationMinutes) || 0;
      });
    });

    const signature = `${sessions.length}|${totalPages}|${totalMinutes}`;
    if (cacheRef.current.signature === signature) {
      return cacheRef.current.result;
    }

    const totalXP = calculateBooksXP(sessions);
    const pagesPerHour = totalMinutes > 0 ? (totalPages / totalMinutes) * 60 : 0;

    const result = {
      totalXP,
      breakdown: {
        sessions: sessions.length,
        pages: totalPages,
        pagesPerHour: Math.round(pagesPerHour * 10) / 10
      }
    };
    cacheRef.current = { signature, result };
    return result;
  }, [books]);

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
