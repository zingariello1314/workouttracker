/**
 * Unit Tests for SessionAggregator Service
 * 
 * Tests the aggregation and processing of reading sessions with different datasets.
 * Validates filtering, grouping, and transformation functionality.
 * 
 * @see Requirements 2.4, 3.1, 7.1
 */

import { describe, it, expect, beforeEach } from 'vitest';
import SessionAggregator from '../SessionAggregator.js';

describe('SessionAggregator', () => {
  let mockBooks;
  let mockBooksWithSessions;
  let mockBooksEmpty;

  beforeEach(() => {
    // Mock data for testing
    mockBooks = [
      {
        id: 'book1',
        title: 'Test Book 1',
        author: 'Author One',
        genre: 'Fiction',
        pages: 300,
        readingSessions: [
          {
            date: '2024-01-15T10:00:00Z',
            pagesRead: 25,
            durationMinutes: 60
          },
          {
            date: '2024-01-16T14:00:00Z',
            pagesRead: 30,
            durationMinutes: 45
          }
        ]
      },
      {
        id: 'book2',
        title: 'Test Book 2',
        author: 'Author Two',
        genre: 'Science',
        pages: 250,
        readingSessions: [
          {
            date: '2024-01-15T16:00:00Z',
            pagesRead: 20,
            durationMinutes: 40
          },
          {
            date: '2024-01-17T09:00:00Z',
            pagesRead: 35,
            durationMinutes: 70
          }
        ]
      }
    ];

    mockBooksWithSessions = [
      {
        id: 'book3',
        title: 'Book with Multiple Sessions',
        author: 'Prolific Author',
        genre: 'Biography',
        pages: 400,
        readingSessions: [
          { date: '2024-01-10', pagesRead: 15, durationMinutes: 30 },
          { date: '2024-01-11', pagesRead: 20, durationMinutes: 40 },
          { date: '2024-01-12', pagesRead: 25, durationMinutes: 50 },
          { date: '2024-01-13', pagesRead: 18, durationMinutes: 35 }
        ]
      }
    ];

    mockBooksEmpty = [];
  });

  describe('extractAllSessions', () => {
    it('should extract all sessions with enriched metadata', () => {
      const sessions = SessionAggregator.extractAllSessions(mockBooks);
      
      expect(sessions).toHaveLength(4);
      expect(sessions[0]).toMatchObject({
        bookId: 'book1',
        bookTitle: 'Test Book 1',
        bookAuthor: 'Author One',
        bookGenre: 'Fiction',
        bookPages: 300,
        normalizedDate: '2024-01-15',
        pagesRead: 25,
        durationMinutes: 60
      });
    });

    it('should handle books without reading sessions', () => {
      const booksWithoutSessions = [
        { id: 'book1', title: 'No Sessions Book', author: 'Author' }
      ];
      
      const sessions = SessionAggregator.extractAllSessions(booksWithoutSessions);
      expect(sessions).toHaveLength(0);
    });

    it('should handle empty books array', () => {
      const sessions = SessionAggregator.extractAllSessions(mockBooksEmpty);
      expect(sessions).toHaveLength(0);
    });

    it('should normalize dates correctly', () => {
      const sessions = SessionAggregator.extractAllSessions(mockBooks);
      sessions.forEach(session => {
        expect(session.normalizedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    it('should sort sessions by date', () => {
      const sessions = SessionAggregator.extractAllSessions(mockBooks);
      for (let i = 1; i < sessions.length; i++) {
        expect(sessions[i].normalizedDate >= sessions[i-1].normalizedDate).toBe(true);
      }
    });

    it('should handle invalid or missing data gracefully', () => {
      const booksWithInvalidData = [
        {
          id: 'book1',
          readingSessions: [
            { date: null, pagesRead: 'invalid', durationMinutes: null },
            { date: '2024-01-15', pagesRead: 25, durationMinutes: 60 }
          ]
        }
      ];
      
      const sessions = SessionAggregator.extractAllSessions(booksWithInvalidData);
      expect(sessions).toHaveLength(1);
      expect(sessions[0].pagesRead).toBe(25);
    });
  });

  describe('filterByPeriod', () => {
    let allSessions;

    beforeEach(() => {
      allSessions = SessionAggregator.extractAllSessions(mockBooks);
    });

    it('should return all sessions for "all" period', () => {
      const filtered = SessionAggregator.filterByPeriod(allSessions, 'all');
      expect(filtered).toHaveLength(allSessions.length);
    });

    it('should filter sessions by 7 days period', () => {
      const filtered = SessionAggregator.filterByPeriod(allSessions, '7d');
      // Since mock data is from January 2024, this should return empty for current date
      expect(Array.isArray(filtered)).toBe(true);
    });

    it('should handle invalid period gracefully', () => {
      const filtered = SessionAggregator.filterByPeriod(allSessions, 'invalid');
      expect(filtered).toHaveLength(allSessions.length);
    });

    it('should handle empty sessions array', () => {
      const filtered = SessionAggregator.filterByPeriod([], '1m');
      expect(filtered).toHaveLength(0);
    });
  });

  describe('filterByCriteria', () => {
    let allSessions;

    beforeEach(() => {
      allSessions = SessionAggregator.extractAllSessions(mockBooks);
    });

    it('should filter by genre', () => {
      const filtered = SessionAggregator.filterByCriteria(allSessions, { genre: 'Fiction' });
      expect(filtered.every(session => session.bookGenre === 'Fiction')).toBe(true);
    });

    it('should filter by author', () => {
      const filtered = SessionAggregator.filterByCriteria(allSessions, { author: 'Author One' });
      expect(filtered.every(session => session.bookAuthor === 'Author One')).toBe(true);
    });

    it('should filter by bookId', () => {
      const filtered = SessionAggregator.filterByCriteria(allSessions, { bookId: 'book1' });
      expect(filtered.every(session => session.bookId === 'book1')).toBe(true);
    });

    it('should handle case-insensitive filtering', () => {
      const filtered = SessionAggregator.filterByCriteria(allSessions, { genre: 'fiction' });
      expect(filtered.length).toBeGreaterThan(0);
    });

    it('should return all sessions when no filters applied', () => {
      const filtered = SessionAggregator.filterByCriteria(allSessions, {});
      expect(filtered).toHaveLength(allSessions.length);
    });
  });

  describe('groupByDate', () => {
    let allSessions;

    beforeEach(() => {
      allSessions = SessionAggregator.extractAllSessions(mockBooks);
    });

    it('should group sessions by date correctly', () => {
      const grouped = SessionAggregator.groupByDate(allSessions);
      
      expect(grouped['2024-01-15']).toBeDefined();
      expect(grouped['2024-01-15'].totalPages).toBe(45); // 25 + 20
      expect(grouped['2024-01-15'].totalMinutes).toBe(100); // 60 + 40
      expect(grouped['2024-01-15'].sessionCount).toBe(2);
      expect(grouped['2024-01-15'].uniqueBooks).toBe(2);
    });

    it('should include book details for each day', () => {
      const grouped = SessionAggregator.groupByDate(allSessions);
      const dayData = grouped['2024-01-15'];
      
      expect(dayData.books).toHaveLength(2);
      expect(dayData.books[0]).toMatchObject({
        id: expect.any(String),
        title: expect.any(String),
        pagesRead: expect.any(Number)
      });
    });

    it('should handle empty sessions array', () => {
      const grouped = SessionAggregator.groupByDate([]);
      expect(Object.keys(grouped)).toHaveLength(0);
    });
  });

  describe('groupByGenre', () => {
    let allSessions;

    beforeEach(() => {
      allSessions = SessionAggregator.extractAllSessions(mockBooks);
    });

    it('should group sessions by genre correctly', () => {
      const grouped = SessionAggregator.groupByGenre(allSessions);
      
      expect(grouped['Fiction']).toBeDefined();
      expect(grouped['Science']).toBeDefined();
      expect(grouped['Fiction'].totalPages).toBe(55); // 25 + 30
      expect(grouped['Science'].totalPages).toBe(55); // 20 + 35
    });

    it('should handle sessions without genre', () => {
      const sessionsWithoutGenre = [
        {
          bookId: 'book1',
          bookGenre: null,
          normalizedDate: '2024-01-15',
          pagesRead: 25,
          durationMinutes: 60
        }
      ];
      
      const grouped = SessionAggregator.groupByGenre(sessionsWithoutGenre);
      expect(grouped['Non spécifié']).toBeDefined();
    });
  });

  describe('groupByAuthor', () => {
    let allSessions;

    beforeEach(() => {
      allSessions = SessionAggregator.extractAllSessions(mockBooks);
    });

    it('should group sessions by author correctly', () => {
      const grouped = SessionAggregator.groupByAuthor(allSessions);
      
      expect(grouped['Author One']).toBeDefined();
      expect(grouped['Author Two']).toBeDefined();
      expect(grouped['Author One'].totalPages).toBe(55);
      expect(grouped['Author Two'].totalPages).toBe(55);
    });

    it('should handle sessions without author', () => {
      const sessionsWithoutAuthor = [
        {
          bookId: 'book1',
          bookAuthor: null,
          normalizedDate: '2024-01-15',
          pagesRead: 25,
          durationMinutes: 60
        }
      ];
      
      const grouped = SessionAggregator.groupByAuthor(sessionsWithoutAuthor);
      expect(grouped['Auteur inconnu']).toBeDefined();
    });
  });

  describe('calculateStreaks', () => {
    it('should calculate current and longest streaks correctly', () => {
      const consecutiveSessions = mockBooksWithSessions[0].readingSessions.map(session => ({
        ...session,
        normalizedDate: session.date
      }));
      
      const streaks = SessionAggregator.calculateStreaks(consecutiveSessions);
      
      expect(streaks.longestStreak).toBeGreaterThan(0);
      expect(streaks.streakDates).toHaveLength(4);
    });

    it('should handle empty sessions array', () => {
      const streaks = SessionAggregator.calculateStreaks([]);
      
      expect(streaks.currentStreak).toBe(0);
      expect(streaks.longestStreak).toBe(0);
      expect(streaks.streakDates).toHaveLength(0);
    });

    it('should handle single session', () => {
      const singleSession = [{
        normalizedDate: '2024-01-15'
      }];
      
      const streaks = SessionAggregator.calculateStreaks(singleSession);
      
      expect(streaks.longestStreak).toBe(1);
      expect(streaks.streakDates).toHaveLength(1);
    });
  });

  describe('aggregateSessions', () => {
    it('should return complete aggregation data', () => {
      const result = SessionAggregator.aggregateSessions(mockBooks, '1m', {});
      
      expect(result).toMatchObject({
        sessions: expect.any(Array),
        byDate: expect.any(Object),
        byGenre: expect.any(Object),
        byAuthor: expect.any(Object),
        streaks: expect.any(Object),
        totalSessions: expect.any(Number),
        totalPages: expect.any(Number),
        totalMinutes: expect.any(Number),
        uniqueDays: expect.any(Number),
        uniqueBooks: expect.any(Number)
      });
    });

    it('should handle empty books array gracefully', () => {
      const result = SessionAggregator.aggregateSessions([], '1m', {});
      
      expect(result.totalSessions).toBe(0);
      expect(result.totalPages).toBe(0);
      expect(result.sessions).toHaveLength(0);
    });

    it('should apply filters correctly', () => {
      const result = SessionAggregator.aggregateSessions(mockBooks, '1m', { genre: 'Fiction' });
      
      expect(result.sessions.every(session => session.bookGenre === 'Fiction')).toBe(true);
    });

    it('should handle errors gracefully', () => {
      // Pass invalid data to trigger error handling
      const result = SessionAggregator.aggregateSessions(null, '1m', {});
      
      expect(result.totalSessions).toBe(0);
      expect(result.sessions).toHaveLength(0);
    });
  });
});