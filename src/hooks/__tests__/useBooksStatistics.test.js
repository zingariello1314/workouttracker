/**
 * Unit Tests for useBooksStatistics Hook
 * Tests calculation of reading statistics for sidebar
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBooksStatistics } from '../useBooksStatistics';

describe('useBooksStatistics', () => {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('currentBooks calculation', () => {
    it('should return 0 when no books exist', () => {
      const { result } = renderHook(() => useBooksStatistics([]));
      
      expect(result.current.currentBooks).toBe(0);
      expect(result.current.hasData).toBe(false);
    });

    it('should count books with status "in-progress"', () => {
      const books = [
        { id: '1', status: 'in-progress', readingSessions: [] },
        { id: '2', status: 'in-progress', readingSessions: [] },
        { id: '3', status: 'completed', readingSessions: [] },
        { id: '4', status: 'to-read', readingSessions: [] },
      ];

      const { result } = renderHook(() => useBooksStatistics(books));
      
      expect(result.current.currentBooks).toBe(2);
      expect(result.current.hasData).toBe(true);
    });

    it('should handle books without status', () => {
      const books = [
        { id: '1', status: 'in-progress', readingSessions: [] },
        { id: '2', readingSessions: [] }, // No status
        { id: '3', status: null, readingSessions: [] },
      ];

      const { result } = renderHook(() => useBooksStatistics(books));
      
      expect(result.current.currentBooks).toBe(1);
    });
  });

  describe('todayPages calculation', () => {
    it('should return 0 when no reading sessions exist', () => {
      const books = [
        { id: '1', status: 'in-progress', readingSessions: [] },
      ];

      const { result } = renderHook(() => useBooksStatistics(books));
      
      expect(result.current.todayPages).toBe(0);
    });

    it('should sum pages from today\'s sessions', () => {
      const books = [
        {
          id: '1',
          status: 'in-progress',
          readingSessions: [
            { id: 's1', date: today, pagesRead: 10, durationMinutes: 20 },
            { id: 's2', date: today, pagesRead: 15, durationMinutes: 30 },
          ],
        },
        {
          id: '2',
          status: 'in-progress',
          readingSessions: [
            { id: 's3', date: today, pagesRead: 5, durationMinutes: 10 },
          ],
        },
      ];

      const { result } = renderHook(() => useBooksStatistics(books));
      
      expect(result.current.todayPages).toBe(30); // 10 + 15 + 5
    });

    it('should ignore sessions from other days', () => {
      const books = [
        {
          id: '1',
          status: 'in-progress',
          readingSessions: [
            { id: 's1', date: today, pagesRead: 10, durationMinutes: 20 },
            { id: 's2', date: yesterday, pagesRead: 50, durationMinutes: 100 },
          ],
        },
      ];

      const { result } = renderHook(() => useBooksStatistics(books));
      
      expect(result.current.todayPages).toBe(10);
    });

    it('should handle sessions with ISO timestamps', () => {
      const todayISO = new Date().toISOString();
      const books = [
        {
          id: '1',
          status: 'in-progress',
          readingSessions: [
            { id: 's1', date: todayISO, pagesRead: 10, durationMinutes: 20 },
          ],
        },
      ];

      const { result } = renderHook(() => useBooksStatistics(books));
      
      expect(result.current.todayPages).toBe(10);
    });
  });

  describe('todayMinutes calculation', () => {
    it('should return 0 when no reading sessions exist', () => {
      const books = [
        { id: '1', status: 'in-progress', readingSessions: [] },
      ];

      const { result } = renderHook(() => useBooksStatistics(books));
      
      expect(result.current.todayMinutes).toBe(0);
    });

    it('should sum minutes from today\'s sessions', () => {
      const books = [
        {
          id: '1',
          status: 'in-progress',
          readingSessions: [
            { id: 's1', date: today, pagesRead: 10, durationMinutes: 20 },
            { id: 's2', date: today, pagesRead: 15, durationMinutes: 30 },
          ],
        },
        {
          id: '2',
          status: 'in-progress',
          readingSessions: [
            { id: 's3', date: today, pagesRead: 5, durationMinutes: 10 },
          ],
        },
      ];

      const { result } = renderHook(() => useBooksStatistics(books));
      
      expect(result.current.todayMinutes).toBe(60); // 20 + 30 + 10
    });

    it('should ignore sessions from other days', () => {
      const books = [
        {
          id: '1',
          status: 'in-progress',
          readingSessions: [
            { id: 's1', date: today, pagesRead: 10, durationMinutes: 20 },
            { id: 's2', date: yesterday, pagesRead: 50, durationMinutes: 100 },
          ],
        },
      ];

      const { result } = renderHook(() => useBooksStatistics(books));
      
      expect(result.current.todayMinutes).toBe(20);
    });
  });

  describe('dailyGoal', () => {
    it('should return 30 as default when localStorage is empty', () => {
      const { result } = renderHook(() => useBooksStatistics([]));
      
      expect(result.current.dailyGoal).toBe(30);
    });

    it('should read dailyGoal from localStorage', () => {
      localStorage.setItem('readingDailyGoal', '45');

      const { result } = renderHook(() => useBooksStatistics([]));
      
      expect(result.current.dailyGoal).toBe(45);
    });

    it('should use default if localStorage value is invalid', () => {
      localStorage.setItem('readingDailyGoal', 'invalid');

      const { result } = renderHook(() => useBooksStatistics([]));
      
      expect(result.current.dailyGoal).toBe(30);
    });

    it('should use default if localStorage value is negative', () => {
      localStorage.setItem('readingDailyGoal', '-10');

      const { result } = renderHook(() => useBooksStatistics([]));
      
      expect(result.current.dailyGoal).toBe(30);
    });
  });

  describe('hasData', () => {
    it('should be false when books array is empty', () => {
      const { result } = renderHook(() => useBooksStatistics([]));
      
      expect(result.current.hasData).toBe(false);
    });

    it('should be true when books exist', () => {
      const books = [
        { id: '1', status: 'in-progress', readingSessions: [] },
      ];

      const { result } = renderHook(() => useBooksStatistics(books));
      
      expect(result.current.hasData).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should return safe defaults when books is not an array', () => {
      const { result } = renderHook(() => useBooksStatistics(null));
      
      expect(result.current.currentBooks).toBe(0);
      expect(result.current.todayPages).toBe(0);
      expect(result.current.todayMinutes).toBe(0);
      expect(result.current.dailyGoal).toBe(30);
      expect(result.current.hasData).toBe(false);
    });

    it('should handle books with missing readingSessions', () => {
      const books = [
        { id: '1', status: 'in-progress' }, // No readingSessions
        { id: '2', status: 'in-progress', readingSessions: null },
      ];

      const { result } = renderHook(() => useBooksStatistics(books));
      
      expect(result.current.currentBooks).toBe(2);
      expect(result.current.todayPages).toBe(0);
      expect(result.current.todayMinutes).toBe(0);
    });

    it('should handle sessions with missing data', () => {
      const books = [
        {
          id: '1',
          status: 'in-progress',
          readingSessions: [
            { id: 's1', date: today }, // Missing pagesRead and durationMinutes
            { id: 's2', date: today, pagesRead: null, durationMinutes: null },
            { id: 's3', date: today, pagesRead: 10, durationMinutes: 20 },
          ],
        },
      ];

      const { result } = renderHook(() => useBooksStatistics(books));
      
      expect(result.current.todayPages).toBe(10);
      expect(result.current.todayMinutes).toBe(20);
    });
  });

  describe('memoization', () => {
    it('should return same object reference when books array is unchanged', () => {
      const books = [
        { id: '1', status: 'in-progress', readingSessions: [] },
      ];

      const { result, rerender } = renderHook(
        ({ books }) => useBooksStatistics(books),
        { initialProps: { books } }
      );

      const firstResult = result.current;
      
      rerender({ books });
      
      expect(result.current).toBe(firstResult);
    });

    it('should recalculate when books array changes', () => {
      const books1 = [
        { id: '1', status: 'in-progress', readingSessions: [] },
      ];
      const books2 = [
        { id: '1', status: 'in-progress', readingSessions: [] },
        { id: '2', status: 'in-progress', readingSessions: [] },
      ];

      const { result, rerender } = renderHook(
        ({ books }) => useBooksStatistics(books),
        { initialProps: { books: books1 } }
      );

      expect(result.current.currentBooks).toBe(1);
      
      rerender({ books: books2 });
      
      expect(result.current.currentBooks).toBe(2);
    });
  });
});
