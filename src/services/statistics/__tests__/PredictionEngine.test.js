/**
 * Tests unitaires pour PredictionEngine
 * 
 * Tests des fonctionnalités de prédiction et recommandations
 * pour les statistiques de lecture.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import PredictionEngine from '../PredictionEngine';

describe('PredictionEngine', () => {
  let mockBooks;
  let mockUserMetrics;
  let mockAggregatedData;

  beforeEach(() => {
    mockBooks = [
      {
        id: '1',
        title: 'Test Book 1',
        author: 'Author 1',
        genre: 'Fiction',
        pages: 300,
        status: 'in-progress',
        readingSessions: [
          { date: '2024-01-01', pagesRead: 50, durationMinutes: 60 },
          { date: '2024-01-02', pagesRead: 30, durationMinutes: 45 }
        ]
      },
      {
        id: '2',
        title: 'Test Book 2',
        author: 'Author 2',
        genre: 'Non-fiction',
        pages: 250,
        status: 'in-progress',
        readingSessions: [
          { date: '2024-01-03', pagesRead: 100, durationMinutes: 120 }
        ]
      },
      {
        id: '3',
        title: 'Completed Book',
        author: 'Author 3',
        genre: 'Fiction',
        pages: 200,
        status: 'completed',
        readingSessions: []
      }
    ];

    mockUserMetrics = {
      averageSpeed: 50, // pages per hour
      averageSessionDuration: 60,
      readingFrequency: 5,
      speedByGenre: {
        'Fiction': { averageSpeed: 45 },
        'Non-fiction': { averageSpeed: 55 }
      }
    };

    mockAggregatedData = {
      byDate: {
        '2024-01-01': { totalPages: 50, totalMinutes: 60, sessionCount: 1 },
        '2024-01-02': { totalPages: 30, totalMinutes: 45, sessionCount: 1 },
        '2024-01-03': { totalPages: 100, totalMinutes: 120, sessionCount: 1 }
      },
      streaks: { currentStreak: 3, longestStreak: 5 }
    };
  });

  describe('calculateCompletionTimes', () => {
    it('should calculate completion times for books in progress', () => {
      const predictions = PredictionEngine.calculateCompletionTimes(mockBooks, mockUserMetrics);
      
      expect(predictions).toHaveLength(2); // Only books in progress
      
      const book1Prediction = predictions.find(p => p.bookId === '1');
      expect(book1Prediction).toBeDefined();
      expect(book1Prediction.bookTitle).toBe('Test Book 1');
      expect(book1Prediction.totalPages).toBe(300);
      expect(book1Prediction.pagesRead).toBe(80); // 50 + 30
      expect(book1Prediction.remainingPages).toBe(220);
      expect(book1Prediction.progressPercent).toBe(27); // Math.round(80/300 * 100)
    });

    it('should use book-specific speed when available', () => {
      const predictions = PredictionEngine.calculateCompletionTimes(mockBooks, mockUserMetrics);
      
      const book1Prediction = predictions.find(p => p.bookId === '1');
      expect(book1Prediction.estimate.method).toBe('book_specific');
      
      // Book 1: 80 pages in 105 minutes = ~45.7 pages/hour
      // Remaining 220 pages should take ~4.8 hours
      expect(book1Prediction.estimate.hours).toBeCloseTo(4.8, 1);
    });

    it('should use genre-specific speed when book-specific is not available', () => {
      const booksWithLimitedData = [
        {
          id: '4',
          title: 'New Fiction Book',
          author: 'Author 4',
          genre: 'Fiction',
          pages: 200,
          status: 'in-progress',
          readingSessions: [
            { date: '2024-01-01', pagesRead: 10, durationMinutes: 15 } // Not enough data for book-specific (< 20 pages)
          ]
        }
      ];

      const predictions = PredictionEngine.calculateCompletionTimes(booksWithLimitedData, mockUserMetrics);
      
      const prediction = predictions[0];
      expect(prediction.estimate.method).toBe('genre_specific');
      expect(prediction.estimate.genreSpeed).toBe(45); // Fiction speed from mockUserMetrics
    });

    it('should fall back to global average when no specific data available', () => {
      const booksWithoutGenre = [
        {
          id: '5',
          title: 'Unknown Genre Book',
          author: 'Author 5',
          genre: 'Unknown', // Genre not in mockUserMetrics.speedByGenre
          pages: 200,
          status: 'in-progress',
          readingSessions: [
            { date: '2024-01-01', pagesRead: 10, durationMinutes: 5 } // Not enough for book-specific
          ]
        }
      ];

      const predictions = PredictionEngine.calculateCompletionTimes(booksWithoutGenre, mockUserMetrics);
      
      const prediction = predictions[0];
      expect(prediction.estimate.method).toBe('global_average');
      expect(prediction.remainingPages / prediction.estimate.hours).toBeCloseTo(mockUserMetrics.averageSpeed, 1);
    });

    it('should calculate confidence levels correctly', () => {
      const predictions = PredictionEngine.calculateCompletionTimes(mockBooks, mockUserMetrics);
      
      const book1Prediction = predictions.find(p => p.bookId === '1');
      expect(book1Prediction.confidence).toBe('low'); // 2 sessions but book-specific method
      
      const book2Prediction = predictions.find(p => p.bookId === '2');
      expect(book2Prediction.confidence).toBe('low'); // 1 session, not enough for book-specific, falls back to genre
    });

    it('should sort predictions by estimated time', () => {
      const predictions = PredictionEngine.calculateCompletionTimes(mockBooks, mockUserMetrics);
      
      for (let i = 1; i < predictions.length; i++) {
        expect(predictions[i].estimate.minutes).toBeGreaterThanOrEqual(predictions[i-1].estimate.minutes);
      }
    });

    it('should handle books without pages or sessions', () => {
      const booksWithMissingData = [
        { id: '6', title: 'No Pages', status: 'in-progress' },
        { id: '7', title: 'No Sessions', pages: 200, status: 'in-progress', readingSessions: [] }
      ];

      const predictions = PredictionEngine.calculateCompletionTimes(booksWithMissingData, mockUserMetrics);
      expect(predictions).toHaveLength(1); // Book with pages but no sessions should still get global estimate
    });
  });

  describe('generateGoalRecommendations', () => {
    it('should generate daily goal recommendations', () => {
      const recommendations = PredictionEngine.generateGoalRecommendations(mockUserMetrics, mockAggregatedData);
      
      expect(recommendations.daily).toBeDefined();
      expect(recommendations.daily.type).toBe('minutes');
      expect(recommendations.daily.target).toBeGreaterThan(mockUserMetrics.averageSessionDuration);
      expect(recommendations.daily.improvement).toBeGreaterThan(0);
      expect(recommendations.reasoning.daily).toBeDefined();
    });

    it('should generate weekly goal recommendations', () => {
      const metricsWithPagesPerDay = {
        ...mockUserMetrics,
        averagePagesPerDay: 25
      };

      const recommendations = PredictionEngine.generateGoalRecommendations(metricsWithPagesPerDay, mockAggregatedData);
      
      expect(recommendations.weekly).toBeDefined();
      expect(recommendations.weekly.type).toBe('pages');
      expect(recommendations.weekly.target).toBeGreaterThan(recommendations.weekly.current);
    });

    it('should generate monthly goal recommendations', () => {
      const recommendations = PredictionEngine.generateGoalRecommendations(mockUserMetrics, mockAggregatedData);
      
      expect(recommendations.monthly).toBeDefined();
      expect(recommendations.monthly.type).toBe('books');
      expect(recommendations.monthly.target).toBeGreaterThanOrEqual(1);
    });

    it('should handle missing metrics gracefully', () => {
      const emptyMetrics = {};
      const recommendations = PredictionEngine.generateGoalRecommendations(emptyMetrics, mockAggregatedData);
      
      expect(recommendations.daily).toBeNull();
      expect(recommendations.weekly).toBeNull();
      expect(recommendations.monthly).toBeNull();
    });
  });

  describe('analyzeTemporalPatterns', () => {
    it('should analyze best days of the week', () => {
      const patterns = PredictionEngine.analyzeTemporalPatterns(mockAggregatedData);
      
      expect(patterns.bestDaysOfWeek).toBeDefined();
      expect(patterns.bestDaysOfWeek.ranking).toHaveLength(7); // All days of week
      expect(patterns.bestDaysOfWeek.bestDay).toBeDefined();
      expect(patterns.bestDaysOfWeek.worstDay).toBeDefined();
    });

    it('should calculate reading consistency', () => {
      const patterns = PredictionEngine.analyzeTemporalPatterns(mockAggregatedData);
      
      expect(patterns.readingConsistency).toBeDefined();
      expect(patterns.readingConsistency.rate).toBeGreaterThanOrEqual(0);
      expect(patterns.readingConsistency.rate).toBeLessThanOrEqual(100);
      expect(patterns.readingConsistency.level).toMatch(/low|moderate|good|excellent/);
    });

    it('should analyze productivity trends', () => {
      const patterns = PredictionEngine.analyzeTemporalPatterns(mockAggregatedData);
      
      expect(patterns.productivityTrends).toBeDefined();
      expect(patterns.productivityTrends.trend).toMatch(/increasing|decreasing|stable|insufficient_data/);
      if (patterns.productivityTrends.trend !== 'insufficient_data') {
        expect(patterns.productivityTrends.interpretation).toBeDefined();
      }
    });

    it('should generate pattern-based recommendations', () => {
      const patterns = PredictionEngine.analyzeTemporalPatterns(mockAggregatedData);
      
      expect(patterns.recommendations).toBeDefined();
      expect(Array.isArray(patterns.recommendations)).toBe(true);
      
      if (patterns.recommendations.length > 0) {
        const recommendation = patterns.recommendations[0];
        expect(recommendation.type).toBeDefined();
        expect(recommendation.title).toBeDefined();
        expect(recommendation.description).toBeDefined();
        expect(recommendation.priority).toMatch(/high|medium|low/);
      }
    });
  });

  describe('generateAllPredictions', () => {
    it('should generate comprehensive predictions', () => {
      const predictions = PredictionEngine.generateAllPredictions(mockBooks, mockUserMetrics, mockAggregatedData);
      
      expect(predictions.completionTimes).toBeDefined();
      expect(predictions.goalRecommendations).toBeDefined();
      expect(predictions.temporalPatterns).toBeDefined();
      expect(predictions.summary).toBeDefined();
    });

    it('should include summary statistics', () => {
      const predictions = PredictionEngine.generateAllPredictions(mockBooks, mockUserMetrics, mockAggregatedData);
      
      expect(predictions.summary.booksInProgress).toBe(2);
      expect(predictions.summary.totalEstimatedHours).toBeGreaterThan(0);
      expect(predictions.summary.averageConfidence).toMatch(/high|medium|low|none/);
    });

    it('should handle errors gracefully', () => {
      const invalidBooks = null;
      const predictions = PredictionEngine.generateAllPredictions(invalidBooks, mockUserMetrics, mockAggregatedData);
      
      expect(predictions.completionTimes).toEqual([]);
      expect(predictions.goalRecommendations).toEqual({});
      expect(predictions.temporalPatterns).toEqual({});
      expect(predictions.summary).toEqual({});
    });
  });

  describe('calculateConfidence', () => {
    it('should return high confidence for book-specific with many sessions', () => {
      const bookSpecific = { method: 'book_specific' };
      const confidence = PredictionEngine.calculateConfidence(bookSpecific, null, null, 5);
      expect(confidence).toBe('high');
    });

    it('should return medium confidence for book-specific with few sessions', () => {
      const bookSpecific = { method: 'book_specific' };
      const confidence = PredictionEngine.calculateConfidence(bookSpecific, null, null, 3);
      expect(confidence).toBe('medium');
    });

    it('should return medium confidence for genre-specific', () => {
      const genre = { method: 'genre_specific' };
      const confidence = PredictionEngine.calculateConfidence(null, genre, null, 1);
      expect(confidence).toBe('medium');
    });

    it('should return low confidence for global average only', () => {
      const global = { method: 'global_average' };
      const confidence = PredictionEngine.calculateConfidence(null, null, global, 1);
      expect(confidence).toBe('low');
    });
  });
});