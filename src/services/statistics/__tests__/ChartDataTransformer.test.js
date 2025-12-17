/**
 * Unit Tests for ChartDataTransformer Service
 * 
 * Tests the transformation of reading data into chart-compatible formats.
 * Validates data structure transformations for different chart types.
 * 
 * @see Requirements 2.1, 4.1, 5.1
 */

import { describe, it, expect, beforeEach } from 'vitest';
import ChartDataTransformer from '../ChartDataTransformer.js';

describe('ChartDataTransformer', () => {
  let mockTemporalMetrics;
  let mockSpeedByGenre;
  let mockGoalsProgress;
  let mockBasicMetrics;
  let mockMetrics;

  beforeEach(() => {
    mockTemporalMetrics = [
      {
        date: '2024-01-15',
        pages: 50,
        minutes: 75,
        sessions: 2,
        books: [
          { id: 'book1', title: 'Book 1', pagesRead: 30 },
          { id: 'book2', title: 'Book 2', pagesRead: 20 }
        ],
        uniqueBooks: 2,
        speed: 40
      },
      {
        date: '2024-01-16',
        pages: 35,
        minutes: 60,
        sessions: 1,
        books: [
          { id: 'book1', title: 'Book 1', pagesRead: 35 }
        ],
        uniqueBooks: 1,
        speed: 35
      }
    ];

    mockSpeedByGenre = {
      'Fiction': {
        genre: 'Fiction',
        totalPages: 120,
        totalMinutes: 180,
        sessionsCount: 6,
        averageSpeed: 40,
        uniqueBooks: 2
      },
      'Science': {
        genre: 'Science',
        totalPages: 80,
        totalMinutes: 120,
        sessionsCount: 4,
        averageSpeed: 40,
        uniqueBooks: 1
      }
    };

    mockGoalsProgress = {
      daily: {
        target: 60,
        current: 75,
        percentage: 125,
        achieved: true
      },
      weekly: {
        target: 200,
        current: 150,
        percentage: 75,
        achieved: false
      },
      monthly: {
        target: 4,
        current: 3,
        percentage: 75,
        achieved: false
      }
    };

    mockBasicMetrics = {
      totalPages: 200,
      averageSpeed: 40
    };

    mockMetrics = {
      temporal: mockTemporalMetrics,
      speedByGenre: mockSpeedByGenre,
      goals: mockGoalsProgress,
      basic: mockBasicMetrics
    };
  });

  describe('transformPagesPerDayData', () => {
    it('should transform temporal metrics to pages per day format', () => {
      const transformed = ChartDataTransformer.transformPagesPerDayData(mockTemporalMetrics);
      
      expect(transformed).toHaveLength(2);
      expect(transformed[0]).toMatchObject({
        date: '2024-01-15',
        pages: 50,
        sessions: 2,
        totalMinutes: 75,
        books: expect.any(Array),
        speed: 40,
        formattedDate: '15/01',
        tooltip: expect.any(Object)
      });
    });

    it('should format dates correctly for display', () => {
      const transformed = ChartDataTransformer.transformPagesPerDayData(mockTemporalMetrics);
      
      expect(transformed[0].formattedDate).toBe('15/01');
      expect(transformed[1].formattedDate).toBe('16/01');
    });

    it('should include tooltip data with book information', () => {
      const transformed = ChartDataTransformer.transformPagesPerDayData(mockTemporalMetrics);
      
      expect(transformed[0].tooltip).toMatchObject({
        pages: 50,
        sessions: 2,
        minutes: 75,
        books: [
          { title: 'Book 1', pagesRead: 30 },
          { title: 'Book 2', pagesRead: 20 }
        ]
      });
    });

    it('should handle empty temporal metrics', () => {
      const transformed = ChartDataTransformer.transformPagesPerDayData([]);
      
      expect(transformed).toHaveLength(0);
    });

    it('should handle missing books data', () => {
      const metricsWithoutBooks = [
        {
          date: '2024-01-15',
          pages: 50,
          minutes: 75,
          sessions: 2,
          speed: 40
        }
      ];
      
      const transformed = ChartDataTransformer.transformPagesPerDayData(metricsWithoutBooks);
      
      expect(transformed[0].books).toEqual([]);
      expect(transformed[0].tooltip.books).toEqual([]);
    });
  });

  describe('transformReadingSpeedData', () => {
    it('should transform speed evolution data correctly', () => {
      const transformed = ChartDataTransformer.transformReadingSpeedData(mockTemporalMetrics, mockSpeedByGenre);
      
      expect(transformed.evolution).toHaveLength(2);
      expect(transformed.evolution[0]).toMatchObject({
        date: '2024-01-15',
        speed: 40,
        pages: 50,
        minutes: 75,
        formattedDate: '15/01'
      });
    });

    it('should transform genre speed data correctly', () => {
      const transformed = ChartDataTransformer.transformReadingSpeedData(mockTemporalMetrics, mockSpeedByGenre);
      
      expect(transformed.byGenre).toHaveLength(2);
      expect(transformed.byGenre[0]).toMatchObject({
        genre: 'Fiction',
        speed: 40,
        pages: 120,
        sessions: 6,
        books: 2
      });
    });

    it('should handle missing genre data', () => {
      const transformed = ChartDataTransformer.transformReadingSpeedData(mockTemporalMetrics, {});
      
      expect(transformed.evolution).toHaveLength(2);
      expect(transformed.byGenre).toHaveLength(0);
    });

    it('should handle empty temporal data', () => {
      const transformed = ChartDataTransformer.transformReadingSpeedData([], mockSpeedByGenre);
      
      expect(transformed.evolution).toHaveLength(0);
      expect(transformed.byGenre).toHaveLength(2);
    });
  });

  describe('transformHeatmapData', () => {
    it('should generate data for full year', () => {
      const transformed = ChartDataTransformer.transformHeatmapData(mockTemporalMetrics, 2024);
      
      // 2024 is a leap year, so 366 days
      expect(transformed).toHaveLength(366);
    });

    it('should include activity data for existing dates', () => {
      const transformed = ChartDataTransformer.transformHeatmapData(mockTemporalMetrics, 2024);
      
      const jan15Data = transformed.find(day => day.date === '2024-01-15');
      expect(jan15Data).toMatchObject({
        date: '2024-01-15',
        pages: 50,
        minutes: 75,
        sessions: 2,
        intensity: expect.any(Number),
        dayOfWeek: expect.any(Number),
        weekOfYear: expect.any(Number)
      });
    });

    it('should set zero values for dates without activity', () => {
      const transformed = ChartDataTransformer.transformHeatmapData(mockTemporalMetrics, 2024);
      
      const jan01Data = transformed.find(day => day.date === '2024-01-01');
      expect(jan01Data).toMatchObject({
        pages: 0,
        minutes: 0,
        sessions: 0,
        books: [],
        intensity: 0
      });
    });

    it('should calculate intensity levels correctly', () => {
      const testData = [
        { date: '2024-01-01', pages: 0 },
        { date: '2024-01-02', pages: 5 },
        { date: '2024-01-03', pages: 15 },
        { date: '2024-01-04', pages: 30 },
        { date: '2024-01-05', pages: 60 }
      ];
      
      const transformed = ChartDataTransformer.transformHeatmapData(testData, 2024);
      
      expect(transformed.find(d => d.date === '2024-01-01').intensity).toBe(0);
      expect(transformed.find(d => d.date === '2024-01-02').intensity).toBe(1);
      expect(transformed.find(d => d.date === '2024-01-03').intensity).toBe(2);
      expect(transformed.find(d => d.date === '2024-01-04').intensity).toBe(3);
      expect(transformed.find(d => d.date === '2024-01-05').intensity).toBe(4);
    });

    it('should use current year when no year specified', () => {
      const currentYear = new Date().getFullYear();
      const transformed = ChartDataTransformer.transformHeatmapData(mockTemporalMetrics);
      
      // Check that dates are from current year
      expect(transformed.length).toBeGreaterThan(300); // Should have full year data
      // Check that the data contains dates from the current year
      const hasCurrentYearData = transformed.some(day => day.date.startsWith(currentYear.toString()));
      expect(hasCurrentYearData).toBe(true);
    });
  });

  describe('transformGenreDistributionData', () => {
    it('should create pie chart data with percentages', () => {
      const transformed = ChartDataTransformer.transformGenreDistributionData(mockSpeedByGenre);
      
      expect(transformed.pie).toHaveLength(2);
      expect(transformed.pie[0]).toMatchObject({
        genre: expect.any(String),
        pages: expect.any(Number),
        pagesPercentage: expect.any(Number),
        minutesPercentage: expect.any(Number)
      });
      
      // Check that percentages add up to 100
      const totalPagesPercentage = transformed.pie.reduce((sum, item) => sum + item.pagesPercentage, 0);
      expect(totalPagesPercentage).toBe(100);
    });

    it('should create bar chart data sorted by speed', () => {
      const transformed = ChartDataTransformer.transformGenreDistributionData(mockSpeedByGenre);
      
      expect(transformed.bar).toHaveLength(2);
      
      // Should be sorted by speed (descending)
      for (let i = 1; i < transformed.bar.length; i++) {
        expect(transformed.bar[i].speed <= transformed.bar[i-1].speed).toBe(true);
      }
    });

    it('should handle empty genre data', () => {
      const transformed = ChartDataTransformer.transformGenreDistributionData({});
      
      expect(transformed.pie).toHaveLength(0);
      expect(transformed.bar).toHaveLength(0);
    });

    it('should calculate percentages correctly', () => {
      const transformed = ChartDataTransformer.transformGenreDistributionData(mockSpeedByGenre);
      
      // Fiction: 120 pages out of 200 total = 60%
      const fictionData = transformed.pie.find(item => item.genre === 'Fiction');
      expect(fictionData.pagesPercentage).toBe(60);
      
      // Science: 80 pages out of 200 total = 40%
      const scienceData = transformed.pie.find(item => item.genre === 'Science');
      expect(scienceData.pagesPercentage).toBe(40);
    });
  });

  describe('transformGoalsProgressData', () => {
    it('should transform all goal types correctly', () => {
      const transformed = ChartDataTransformer.transformGoalsProgressData(mockGoalsProgress, mockBasicMetrics);
      
      expect(transformed).toHaveLength(3);
      
      const dailyGoal = transformed.find(goal => goal.type === 'daily');
      expect(dailyGoal).toMatchObject({
        type: 'daily',
        label: 'Objectif quotidien',
        target: 60,
        current: 75,
        percentage: 125,
        achieved: true,
        unit: 'minutes',
        color: '#10B981' // Green for achieved
      });
    });

    it('should use different colors for achieved vs not achieved', () => {
      const transformed = ChartDataTransformer.transformGoalsProgressData(mockGoalsProgress, mockBasicMetrics);
      
      const dailyGoal = transformed.find(goal => goal.type === 'daily');
      const weeklyGoal = transformed.find(goal => goal.type === 'weekly');
      
      expect(dailyGoal.color).toBe('#10B981'); // Green (achieved)
      expect(weeklyGoal.color).toBe('#F59E0B'); // Yellow (not achieved)
    });

    it('should handle missing goals', () => {
      const partialGoals = {
        daily: mockGoalsProgress.daily
      };
      
      const transformed = ChartDataTransformer.transformGoalsProgressData(partialGoals, mockBasicMetrics);
      
      expect(transformed).toHaveLength(1);
      expect(transformed[0].type).toBe('daily');
    });

    it('should handle empty goals', () => {
      const transformed = ChartDataTransformer.transformGoalsProgressData({}, mockBasicMetrics);
      
      expect(transformed).toHaveLength(0);
    });
  });

  describe('utility methods', () => {
    describe('formatDateForDisplay', () => {
      it('should format dates correctly', () => {
        expect(ChartDataTransformer.formatDateForDisplay('2024-01-15')).toBe('15/01');
        expect(ChartDataTransformer.formatDateForDisplay('2024-12-31')).toBe('31/12');
      });
    });

    describe('formatFullDate', () => {
      it('should format full dates correctly', () => {
        const formatted = ChartDataTransformer.formatFullDate('2024-01-15');
        expect(formatted).toContain('15');
        expect(formatted).toContain('janvier');
        expect(formatted).toContain('2024');
      });
    });

    describe('calculateIntensity', () => {
      it('should calculate intensity levels correctly', () => {
        expect(ChartDataTransformer.calculateIntensity(0)).toBe(0);
        expect(ChartDataTransformer.calculateIntensity(5)).toBe(1);
        expect(ChartDataTransformer.calculateIntensity(15)).toBe(2);
        expect(ChartDataTransformer.calculateIntensity(30)).toBe(3);
        expect(ChartDataTransformer.calculateIntensity(60)).toBe(4);
      });
    });

    describe('getWeekOfYear', () => {
      it('should calculate week of year correctly', () => {
        const jan1 = new Date('2024-01-01');
        const jan15 = new Date('2024-01-15');
        
        expect(ChartDataTransformer.getWeekOfYear(jan1)).toBe(1);
        expect(ChartDataTransformer.getWeekOfYear(jan15)).toBeGreaterThan(1);
      });
    });
  });

  describe('transformAllChartData', () => {
    it('should transform all chart data types', () => {
      const transformed = ChartDataTransformer.transformAllChartData(mockMetrics);
      
      expect(transformed).toMatchObject({
        pagesPerDay: expect.any(Array),
        readingSpeed: expect.any(Object),
        heatmap: expect.any(Array),
        genreDistribution: expect.any(Object),
        goalsProgress: expect.any(Array)
      });
    });

    it('should handle missing metrics gracefully', () => {
      const transformed = ChartDataTransformer.transformAllChartData({});
      
      expect(transformed.pagesPerDay).toEqual([]);
      expect(transformed.readingSpeed.evolution).toEqual([]);
      expect(Array.isArray(transformed.heatmap)).toBe(true);
      expect(transformed.heatmap.length).toBeGreaterThan(0); // Will generate current year data
    });

    it('should handle errors gracefully', () => {
      const transformed = ChartDataTransformer.transformAllChartData(null);
      
      expect(transformed.pagesPerDay).toEqual([]);
      expect(transformed.readingSpeed.evolution).toEqual([]);
      expect(transformed.genreDistribution.pie).toEqual([]);
    });

    it('should maintain data consistency across transformations', () => {
      const transformed = ChartDataTransformer.transformAllChartData(mockMetrics);
      
      // Verify that pages per day data matches reading speed evolution data
      expect(transformed.pagesPerDay).toHaveLength(transformed.readingSpeed.evolution.length);
      
      // Verify that dates match
      transformed.pagesPerDay.forEach((dayData, index) => {
        expect(dayData.date).toBe(transformed.readingSpeed.evolution[index].date);
      });
    });
  });
});