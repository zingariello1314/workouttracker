/**
 * Unit Tests for MetricsCalculator Service
 * 
 * Tests the calculation of reading metrics with validation of formulas.
 * Validates speed calculations, predictions, and pattern analysis.
 * 
 * @see Requirements 3.1, 7.1, 8.1
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import MetricsCalculator from '../MetricsCalculator.js';

describe('MetricsCalculator', () => {
  let mockAggregatedData;
  let mockBooks;
  let mockGoals;

  beforeEach(() => {
    mockAggregatedData = {
      totalPages: 200,
      totalMinutes: 300, // 5 hours
      totalSessions: 10,
      uniqueDays: 5,
      uniqueBooks: 3,
      streaks: {
        currentStreak: 3,
        longestStreak: 7
      },
      byGenre: {
        'Fiction': {
          totalPages: 120,
          totalMinutes: 180,
          sessionCount: 6,
          uniqueBooks: 2
        },
        'Science': {
          totalPages: 80,
          totalMinutes: 120,
          sessionCount: 4,
          uniqueBooks: 1
        }
      },
      byDate: {
        '2024-01-15': {
          totalPages: 50,
          totalMinutes: 75,
          sessionCount: 2,
          books: [
            { id: 'book1', title: 'Book 1', pagesRead: 30 },
            { id: 'book2', title: 'Book 2', pagesRead: 20 }
          ],
          uniqueBooks: 2
        },
        '2024-01-16': {
          totalPages: 40,
          totalMinutes: 60,
          sessionCount: 2,
          books: [{ id: 'book1', title: 'Book 1', pagesRead: 40 }],
          uniqueBooks: 1
        }
      }
    };

    mockBooks = [
      {
        id: 'book1',
        title: 'In Progress Book',
        status: 'in-progress',
        pages: 300,
        readingSessions: [
          { pagesRead: 50, durationMinutes: 60 },
          { pagesRead: 30, durationMinutes: 45 }
        ]
      },
      {
        id: 'book2',
        title: 'Completed Book',
        status: 'completed',
        pages: 250
      }
    ];

    mockGoals = {
      dailyMinutes: 60,
      weeklyPages: 100,
      monthlyBooks: 4
    };
  });

  describe('calculateBasicMetrics', () => {
    it('should calculate average reading speed correctly', () => {
      const metrics = MetricsCalculator.calculateBasicMetrics(mockAggregatedData);
      
      // 200 pages / (300 minutes / 60) = 40 pages per hour
      expect(metrics.averageSpeed).toBe(40);
    });

    it('should calculate average session duration correctly', () => {
      const metrics = MetricsCalculator.calculateBasicMetrics(mockAggregatedData);
      
      // 300 minutes / 10 sessions = 30 minutes per session
      expect(metrics.averageSessionDuration).toBe(30);
    });

    it('should calculate reading frequency correctly', () => {
      const metrics = MetricsCalculator.calculateBasicMetrics(mockAggregatedData);
      
      // (10 sessions / 5 days) * 7 = 14 sessions per week
      expect(metrics.readingFrequency).toBe(14);
    });

    it('should calculate average pages per day correctly', () => {
      const metrics = MetricsCalculator.calculateBasicMetrics(mockAggregatedData);
      
      // 200 pages / 5 days = 40 pages per day
      expect(metrics.averagePagesPerDay).toBe(40);
    });

    it('should handle zero values gracefully', () => {
      const emptyData = {
        totalPages: 0,
        totalMinutes: 0,
        totalSessions: 0,
        uniqueDays: 0,
        uniqueBooks: 0,
        streaks: { currentStreak: 0, longestStreak: 0 }
      };
      
      const metrics = MetricsCalculator.calculateBasicMetrics(emptyData);
      
      expect(metrics.averageSpeed).toBe(0);
      expect(metrics.averageSessionDuration).toBe(0);
      expect(metrics.readingFrequency).toBe(0);
    });

    it('should round values to one decimal place', () => {
      const dataWithDecimals = {
        ...mockAggregatedData,
        totalPages: 133,
        totalMinutes: 200 // Should give 39.9 pages per hour
      };
      
      const metrics = MetricsCalculator.calculateBasicMetrics(dataWithDecimals);
      
      expect(metrics.averageSpeed).toBe(39.9);
    });
  });

  describe('calculateSpeedByGenre', () => {
    it('should calculate speed for each genre correctly', () => {
      const speedByGenre = MetricsCalculator.calculateSpeedByGenre(mockAggregatedData);
      
      expect(speedByGenre['Fiction']).toMatchObject({
        genre: 'Fiction',
        totalPages: 120,
        totalMinutes: 180,
        averageSpeed: 40, // 120 pages / (180 minutes / 60) = 40 pages/hour
        uniqueBooks: 2
      });
      
      expect(speedByGenre['Science']).toMatchObject({
        genre: 'Science',
        totalPages: 80,
        totalMinutes: 120,
        averageSpeed: 40, // 80 pages / (120 minutes / 60) = 40 pages/hour
        uniqueBooks: 1
      });
    });

    it('should handle genres with zero minutes', () => {
      const dataWithZeroMinutes = {
        byGenre: {
          'Fiction': {
            totalPages: 50,
            totalMinutes: 0,
            sessionCount: 2,
            uniqueBooks: 1
          }
        }
      };
      
      const speedByGenre = MetricsCalculator.calculateSpeedByGenre(dataWithZeroMinutes);
      
      expect(speedByGenre['Fiction'].averageSpeed).toBe(0);
    });

    it('should calculate average pages per session correctly', () => {
      const speedByGenre = MetricsCalculator.calculateSpeedByGenre(mockAggregatedData);
      
      // Fiction: 120 pages / 6 sessions = 20 pages per session
      expect(speedByGenre['Fiction'].averagePagesPerSession).toBe(20);
    });
  });

  describe('calculateTemporalMetrics', () => {
    it('should transform daily data correctly', () => {
      const temporalMetrics = MetricsCalculator.calculateTemporalMetrics(mockAggregatedData);
      
      expect(temporalMetrics).toHaveLength(2);
      expect(temporalMetrics[0]).toMatchObject({
        date: '2024-01-15',
        pages: 50,
        minutes: 75,
        sessions: 2,
        speed: 40, // 50 pages / (75 minutes / 60) = 40 pages/hour
        uniqueBooks: 2
      });
    });

    it('should sort data by date', () => {
      const temporalMetrics = MetricsCalculator.calculateTemporalMetrics(mockAggregatedData);
      
      for (let i = 1; i < temporalMetrics.length; i++) {
        expect(temporalMetrics[i].date >= temporalMetrics[i-1].date).toBe(true);
      }
    });

    it('should handle empty date data', () => {
      const emptyData = { byDate: {} };
      const temporalMetrics = MetricsCalculator.calculateTemporalMetrics(emptyData);
      
      expect(temporalMetrics).toHaveLength(0);
    });
  });

  describe('calculatePredictions', () => {
    it('should calculate completion time for in-progress books', () => {
      const userMetrics = { averageSpeed: 40 }; // 40 pages per hour
      const predictions = MetricsCalculator.calculatePredictions(mockBooks, userMetrics);
      
      expect(predictions).toHaveLength(1);
      expect(predictions[0]).toMatchObject({
        bookId: 'book1',
        bookTitle: 'In Progress Book',
        totalPages: 300,
        pagesRead: 80, // 50 + 30
        remainingPages: 220, // 300 - 80
        progressPercent: 27, // (80/300) * 100 rounded
        estimatedHours: 5.5, // 220 pages / 40 pages per hour
        estimatedMinutes: 330 // 5.5 * 60
      });
    });

    it('should calculate book-specific estimates when available', () => {
      const userMetrics = { averageSpeed: 40 };
      const predictions = MetricsCalculator.calculatePredictions(mockBooks, userMetrics);
      
      // Book has 105 minutes for 80 pages = ~45.7 pages per hour
      // 220 remaining pages / 45.7 pages per hour = ~4.8 hours = ~288 minutes
      expect(predictions[0].bookSpecificEstimate).toBeCloseTo(288, -1);
    });

    it('should ignore completed books', () => {
      const userMetrics = { averageSpeed: 40 };
      const predictions = MetricsCalculator.calculatePredictions(mockBooks, userMetrics);
      
      // Should only include the in-progress book
      expect(predictions).toHaveLength(1);
      expect(predictions[0].bookId).toBe('book1');
    });

    it('should handle books with no reading sessions', () => {
      const booksWithoutSessions = [
        {
          id: 'book3',
          title: 'No Sessions Book',
          status: 'in-progress',
          pages: 200
        }
      ];
      
      const userMetrics = { averageSpeed: 40 };
      const predictions = MetricsCalculator.calculatePredictions(booksWithoutSessions, userMetrics);
      
      expect(predictions).toHaveLength(1);
      expect(predictions[0].pagesRead).toBe(0);
      expect(predictions[0].remainingPages).toBe(200);
    });

    it('should sort predictions by estimated time', () => {
      const multipleBooks = [
        {
          id: 'book1',
          status: 'in-progress',
          pages: 100,
          readingSessions: [{ pagesRead: 50, durationMinutes: 60 }]
        },
        {
          id: 'book2',
          status: 'in-progress',
          pages: 300,
          readingSessions: [{ pagesRead: 50, durationMinutes: 60 }]
        }
      ];
      
      const userMetrics = { averageSpeed: 40 };
      const predictions = MetricsCalculator.calculatePredictions(multipleBooks, userMetrics);
      
      expect(predictions[0].estimatedMinutes <= predictions[1].estimatedMinutes).toBe(true);
    });
  });

  describe('analyzeReadingPatterns', () => {
    it('should analyze days of the week correctly', () => {
      const patterns = MetricsCalculator.analyzeReadingPatterns(mockAggregatedData);
      
      expect(patterns.bestDaysOfWeek).toBeDefined();
      // January 15, 2024 was a Monday, January 16 was a Tuesday
      expect(patterns.bestDaysOfWeek['Lundi']).toBeDefined();
      expect(patterns.bestDaysOfWeek['Mardi']).toBeDefined();
    });

    it('should identify most productive days', () => {
      const patterns = MetricsCalculator.analyzeReadingPatterns(mockAggregatedData);
      
      expect(patterns.mostProductiveDays).toHaveLength(2);
      expect(patterns.mostProductiveDays[0].pages >= patterns.mostProductiveDays[1].pages).toBe(true);
    });

    it('should calculate reading consistency', () => {
      const patterns = MetricsCalculator.analyzeReadingPatterns(mockAggregatedData);
      
      // 2 days with reading out of 2 total days = 100%
      expect(patterns.readingConsistency).toBe(100);
    });

    it('should handle empty data', () => {
      const emptyData = { byDate: {} };
      const patterns = MetricsCalculator.analyzeReadingPatterns(emptyData);
      
      expect(patterns.readingConsistency).toBe(0);
      expect(patterns.mostProductiveDays).toHaveLength(0);
    });
  });

  describe('calculateGoalsProgress', () => {
    let originalDate;
    
    beforeEach(() => {
      // Mock today's date for consistent testing
      originalDate = global.Date;
      const mockDate = new Date('2024-01-15');
      
      global.Date = class extends originalDate {
        constructor(...args) {
          if (args.length === 0) {
            super('2024-01-15');
          } else {
            super(...args);
          }
        }
        
        static now() {
          return mockDate.getTime();
        }
      };
    });

    afterEach(() => {
      global.Date = originalDate;
    });

    it('should calculate daily goal progress', () => {
      const progress = MetricsCalculator.calculateGoalsProgress(mockAggregatedData, mockGoals);
      
      expect(progress.daily).toMatchObject({
        target: 60,
        current: 75, // From mockAggregatedData for 2024-01-15
        percentage: 125, // (75/60) * 100
        achieved: true
      });
    });

    it('should handle missing daily data', () => {
      const dataWithoutToday = {
        ...mockAggregatedData,
        byDate: {
          '2024-01-14': { totalMinutes: 30 }
        }
      };
      
      const progress = MetricsCalculator.calculateGoalsProgress(dataWithoutToday, mockGoals);
      
      expect(progress.daily.current).toBe(0);
      expect(progress.daily.achieved).toBe(false);
    });

    it('should handle goals without targets', () => {
      const progress = MetricsCalculator.calculateGoalsProgress(mockAggregatedData, {});
      
      expect(progress.daily).toBeNull();
      expect(progress.weekly).toBeNull();
      expect(progress.monthly).toBeNull();
    });
  });

  describe('calculateAllMetrics', () => {
    it('should return complete metrics object', () => {
      const allMetrics = MetricsCalculator.calculateAllMetrics(mockBooks, mockAggregatedData, mockGoals);
      
      expect(allMetrics).toMatchObject({
        basic: expect.any(Object),
        speedByGenre: expect.any(Object),
        temporal: expect.any(Array),
        predictions: expect.any(Array),
        patterns: expect.any(Object),
        goals: expect.any(Object)
      });
    });

    it('should handle errors gracefully', () => {
      const allMetrics = MetricsCalculator.calculateAllMetrics(null, null, null);
      
      expect(allMetrics.basic).toEqual({});
      expect(allMetrics.temporal).toEqual([]);
      expect(allMetrics.predictions).toEqual([]);
    });

    it('should integrate all calculations correctly', () => {
      const allMetrics = MetricsCalculator.calculateAllMetrics(mockBooks, mockAggregatedData, mockGoals);
      
      // Verify that basic metrics are used in predictions
      expect(allMetrics.predictions[0].userAverageSpeed).toBe(allMetrics.basic.averageSpeed);
      
      // Verify temporal metrics match basic totals
      const temporalTotal = allMetrics.temporal.reduce((sum, day) => sum + day.pages, 0);
      // Note: temporal data comes from aggregatedData.byDate which has 90 pages total
      expect(temporalTotal).toBe(90);
    });
  });
});