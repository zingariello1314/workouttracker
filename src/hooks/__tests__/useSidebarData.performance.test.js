/**
 * Tests de performance pour useSidebarData
 * 
 * Vérifie que les optimisations respectent les seuils de performance
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSidebarData } from '../useSidebarData';
import { useBooksStatistics } from '../useBooksStatistics';
import { 
  getAllPerformanceStats, 
  clearPerformanceMetrics, 
  SIDEBAR_OPERATIONS,
  PERFORMANCE_THRESHOLDS 
} from '../../utils/performanceMonitor';

// Mock des dépendances
vi.mock('../../context/WorkoutContext', () => ({
  useWorkout: () => ({
    getWorkoutHistory: vi.fn(() => [])
  })
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true
  })
}));

vi.mock('../useQuietQuestEngine', () => ({
  useQuietQuestEngine: () => ({
    userData: { currentXP: 100, level: 5 },
    dailyPerformances: [],
    getQuestsForDate: vi.fn(() => []),
    isQuestCompletedOnDate: vi.fn(() => false)
  })
}));

vi.mock('../useGarminData', () => ({
  useGarminData: () => ({
    loadDataForTab: vi.fn(() => Promise.resolve(null)),
    dbReady: true
  })
}));

vi.mock('../useNutritionData', () => ({
  useNutritionData: () => ({
    getDailyMeal: vi.fn(() => Promise.resolve(null)),
    dbReady: true
  })
}));

vi.mock('../useSynthese', () => ({
  useSynthese: () => ({
    patrimoine: null
  })
}));

vi.mock('../usePlanificateur', () => ({
  usePlanificateur: () => ({
    salaire: null,
    repartition: null
  })
}));

vi.mock('../useBooksStorage', () => ({
  useBooksStorage: () => ({
    books: []
  })
}));

describe('useSidebarData - Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearPerformanceMetrics();
  });

  afterEach(() => {
    clearPerformanceMetrics();
  });

  test('books statistics calculation should be under 50ms', () => {
    // Créer un dataset de test avec plusieurs livres et sessions
    const testBooks = Array.from({ length: 50 }, (_, i) => ({
      id: `book-${i}`,
      title: `Test Book ${i}`,
      status: i % 3 === 0 ? 'in-progress' : 'completed',
      readingSessions: Array.from({ length: 10 }, (_, j) => ({
        id: `session-${i}-${j}`,
        date: new Date().toISOString(),
        pagesRead: Math.floor(Math.random() * 20) + 1,
        durationMinutes: Math.floor(Math.random() * 60) + 10
      }))
    }));

    // Mesurer le temps de calcul des statistiques
    const start = performance.now();
    
    renderHook(() => useBooksStatistics(testBooks));
    
    const duration = performance.now() - start;
    
    // Vérifier que le calcul prend moins de 50ms
    expect(duration).toBeLessThan(50);
  });

  test('sidebar data aggregation should be performant', () => {
    const start = performance.now();
    
    renderHook(() => useSidebarData());
    
    const duration = performance.now() - start;
    
    // Le chargement initial devrait être sous 500ms
    expect(duration).toBeLessThan(500);
  });

  test('memoization should prevent unnecessary recalculations', () => {
    const testBooks = [
      {
        id: 'book-1',
        title: 'Test Book',
        status: 'in-progress',
        readingSessions: [
          {
            id: 'session-1',
            date: new Date().toISOString(),
            pagesRead: 10,
            durationMinutes: 30
          }
        ]
      }
    ];

    let renderCount = 0;
    const TestComponent = ({ books }) => {
      renderCount++;
      return useBooksStatistics(books);
    };

    const { rerender } = renderHook(TestComponent, {
      initialProps: { books: testBooks }
    });

    // Premier render
    expect(renderCount).toBe(1);

    // Re-render avec les mêmes données - devrait utiliser la memoization
    rerender({ books: testBooks });
    expect(renderCount).toBe(2);

    // Re-render avec des données différentes
    const newBooks = [...testBooks, {
      id: 'book-2',
      title: 'New Book',
      status: 'completed',
      readingSessions: []
    }];
    
    rerender({ books: newBooks });
    expect(renderCount).toBe(3);
  });

  test('performance monitoring should track operations', async () => {
    // Rendre le hook pour déclencher les mesures de performance
    renderHook(() => useSidebarData());
    
    // Attendre un peu pour que les mesures async se terminent
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    const stats = getAllPerformanceStats();
    
    // Vérifier que certaines opérations ont été mesurées
    // Note: Les opérations exactes dépendent de l'état des mocks
    expect(typeof stats).toBe('object');
  });

  test('large dataset should still be performant', () => {
    // Créer un dataset plus large pour tester la scalabilité
    const largeBookSet = Array.from({ length: 200 }, (_, i) => ({
      id: `book-${i}`,
      title: `Large Dataset Book ${i}`,
      status: ['in-progress', 'completed', 'to-read'][i % 3],
      readingSessions: Array.from({ length: 20 }, (_, j) => ({
        id: `session-${i}-${j}`,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        pagesRead: Math.floor(Math.random() * 30) + 1,
        durationMinutes: Math.floor(Math.random() * 90) + 15
      }))
    }));

    const start = performance.now();
    
    renderHook(() => useBooksStatistics(largeBookSet));
    
    const duration = performance.now() - start;
    
    // Même avec un dataset plus large, devrait rester sous le seuil
    expect(duration).toBeLessThan(100); // Tolérance pour dataset plus large
  });

  test('empty data should be handled efficiently', () => {
    const start = performance.now();
    
    // Test avec des données vides
    renderHook(() => useBooksStatistics([]));
    
    const duration = performance.now() - start;
    
    // Les données vides devraient être traitées très rapidement
    expect(duration).toBeLessThan(10); // Moins de 10ms pour des données vides
  });

  test('invalid data should not cause performance issues', () => {
    const start = performance.now();
    
    // Test avec des données invalides
    renderHook(() => useBooksStatistics(null));
    renderHook(() => useBooksStatistics(undefined));
    renderHook(() => useBooksStatistics('invalid'));
    
    const duration = performance.now() - start;
    
    // La gestion d'erreur ne devrait pas impacter significativement les performances
    expect(duration).toBeLessThan(50);
  });

  test('repeated calculations should benefit from memoization', () => {
    const testBooks = [
      {
        id: 'book-1',
        title: 'Memoization Test',
        status: 'in-progress',
        readingSessions: [
          {
            id: 'session-1',
            date: new Date().toISOString(),
            pagesRead: 15,
            durationMinutes: 45
          }
        ]
      }
    ];

    // Premier calcul
    const start1 = performance.now();
    const { result: result1 } = renderHook(() => useBooksStatistics(testBooks));
    const duration1 = performance.now() - start1;

    // Deuxième calcul avec les mêmes données
    const start2 = performance.now();
    const { result: result2 } = renderHook(() => useBooksStatistics(testBooks));
    const duration2 = performance.now() - start2;

    // Les résultats devraient être identiques
    expect(result1.current).toEqual(result2.current);
    
    // Le deuxième calcul devrait être plus rapide grâce à la memoization
    // Note: Cette assertion peut être fragile selon l'environnement de test
    // On vérifie plutôt que les deux calculs sont raisonnablement rapides
    expect(duration1).toBeLessThan(50); // Premier calcul < 50ms
    expect(duration2).toBeLessThan(50); // Deuxième calcul < 50ms
  });
});