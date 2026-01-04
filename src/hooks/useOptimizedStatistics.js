/**
 * useOptimizedStatistics Hook
 * 
 * Hook optimisé pour les statistiques de lecture avec cache intelligent,
 * debouncing et memoization pour améliorer les performances.
 * 
 * Features:
 * - Cache intelligent avec invalidation automatique
 * - Debouncing des recalculs coûteux
 * - Memoization des transformations
 * - Monitoring des performances
 * 
 * @see Requirements 1.2, 10.3
 */

import { useMemo, useEffect, useCallback, useRef } from 'react';
import { useStatisticsData } from './useStatisticsData';
import performanceOptimizationService from '../services/statistics/performanceOptimizationService';
import dataValidationService from '../services/statistics/dataValidationService';
import fallbackDataProvider from '../services/statistics/fallbackDataProvider';
import { SessionAggregator, MetricsCalculator, ChartDataTransformer } from '../services/statistics/index';

export const useOptimizedStatistics = (books = [], selectedPeriod = '1m', filters = {}, dataVersion = 0) => {
  const previousBooksRef = useRef(books);
  const previousFiltersRef = useRef(filters);
  const computationCountRef = useRef(0);

  // Détecter les changements significatifs pour invalider le cache
  const hasSignificantChange = useMemo(() => {
    const booksChanged = books !== previousBooksRef.current || 
                        books.length !== previousBooksRef.current.length;
    const filtersChanged = JSON.stringify(filters) !== JSON.stringify(previousFiltersRef.current);
    
    if (booksChanged || filtersChanged) {
      previousBooksRef.current = books;
      previousFiltersRef.current = filters;
      return true;
    }
    
    return false;
  }, [books, filters]);

  // Invalider le cache lors de changements significatifs
  useEffect(() => {
    if (hasSignificantChange) {
      performanceOptimizationService.invalidateCache('statistics');
    }
  }, [hasSignificantChange]);

  // Fonction de calcul des statistiques avec cache et validation
  const computeStatistics = useCallback(() => {
    computationCountRef.current++;
    
    return performanceOptimizationService.measurePerformance(
      `Statistics Computation #${computationCountRef.current}`,
      () => {
        try {
          // Étape 1: Valider les données d'entrée
          const validationResult = dataValidationService.validateBooks(books);
          
          if (!validationResult.isValid) {
            console.warn('[useOptimizedStatistics] Data validation failed:', validationResult);
            
            // Retourner des données de fallback selon le contexte
            if (validationResult.stats.validBooks === 0) {
              return fallbackDataProvider.getFallbackData('corrupted', { 
                period: selectedPeriod,
                includeMessages: true 
              });
            }
          }

          // Utiliser les données nettoyées
          const cleanedBooks = validationResult.cleanedBooks.length > 0 
            ? validationResult.cleanedBooks 
            : books;

          // Vérifier s'il y a suffisamment de données
          const hasAnySession = cleanedBooks.some(book => 
            book.readingSessions && Array.isArray(book.readingSessions) && book.readingSessions.length > 0
          );

          if (!hasAnySession) {
            return fallbackDataProvider.getFallbackData('empty', { 
              period: selectedPeriod,
              includeMessages: true 
            });
          }

          const totalSessions = cleanedBooks.reduce((sum, book) => 
            sum + (book.readingSessions?.length || 0), 0
          );

          // Permettre l'affichage des statistiques même avec une seule session
          // Les statistiques seront limitées mais visibles dès la première session
          if (totalSessions < 1) {
            return fallbackDataProvider.getFallbackData('empty', { 
              period: selectedPeriod,
              includeMessages: true 
            });
          }

          // Étape 2: Calculer avec cache
          return performanceOptimizationService.getCachedResult(
            `statistics_${selectedPeriod}`,
            () => {
              // Calculer les données avec les services optimisés
              const aggregatedData = SessionAggregator.aggregateSessions(cleanedBooks, selectedPeriod, filters);
              const calculatedMetrics = MetricsCalculator.calculateAllMetrics(cleanedBooks, aggregatedData);
              const chartData = ChartDataTransformer.transformAllChartData(calculatedMetrics);

              return {
                hasData: true,
                metrics: calculatedMetrics.basic || {},
                chartData: chartData || {},
                insights: calculatedMetrics.insights || [],
                predictions: calculatedMetrics.predictions || [],
                patterns: calculatedMetrics.patterns || {},
                goals: calculatedMetrics.goals || {},
                validationResult: validationResult.stats,
                dataQuality: {
                  originalBooks: books.length,
                  cleanedBooks: cleanedBooks.length,
                  totalSessions,
                  errors: validationResult.errors.length,
                  warnings: validationResult.warnings.length
                }
              };
            },
            [cleanedBooks, selectedPeriod, filters, dataVersion]
          );

        } catch (error) {
          console.error('[useOptimizedStatistics] Error computing statistics:', error);
          
          // Retourner des données de fallback en cas d'erreur
          return fallbackDataProvider.getFallbackData('error', { 
            period: selectedPeriod,
            includeMessages: true 
          });
        }
      }
    );
  }, [books, selectedPeriod, filters, dataVersion]);

  // Debouncer le calcul pour éviter les recalculs excessifs
  const debouncedCompute = useMemo(() => {
    return performanceOptimizationService.debounce(
      'statisticsComputation',
      computeStatistics,
      200 // 200ms de délai
    );
  }, [computeStatistics]);

  // Calculer les statistiques avec optimisations
  const statisticsData = useMemo(() => {
    try {
      return computeStatistics();
    } catch (error) {
      console.error('[useOptimizedStatistics] Error computing statistics:', error);
      return {
        hasData: false,
        metrics: {},
        chartData: {},
        insights: [],
        predictions: [],
        patterns: {},
        goals: {}
      };
    }
  }, [computeStatistics]);

  // Memoizer les transformations de données pour les graphiques
  const optimizedChartData = useMemo(() => {
    if (!statisticsData.chartData) return {};

    return performanceOptimizationService.memoize(
      (chartData) => {
        // Optimiser les données pour les graphiques
        const optimized = {};
        
        Object.entries(chartData).forEach(([key, data]) => {
          if (Array.isArray(data) && data.length > 1000) {
            // Réduire les données si trop nombreuses
            const step = Math.ceil(data.length / 500);
            optimized[key] = data.filter((_, index) => index % step === 0);
          } else {
            optimized[key] = data;
          }
        });

        return optimized;
      },
      (chartData) => `chartData_${Object.keys(chartData).join('_')}_${selectedPeriod}`
    )(statisticsData.chartData);
  }, [statisticsData.chartData, selectedPeriod]);

  // Statistiques de performance
  const performanceStats = useMemo(() => {
    return {
      ...performanceOptimizationService.getCacheStats(),
      computationCount: computationCountRef.current,
      hasSignificantChange,
      dataSize: {
        books: books.length,
        totalSessions: books.reduce((sum, book) => 
          sum + (book.readingSessions?.length || 0), 0
        )
      }
    };
  }, [hasSignificantChange, books]);

  // Nettoyage lors du démontage
  useEffect(() => {
    return () => {
      // Nettoyer les ressources lors du démontage du composant
      if (computationCountRef.current > 10) {
        performanceOptimizationService.cleanup();
      }
    };
  }, []);

  return {
    ...statisticsData,
    chartData: optimizedChartData,
    performanceStats,
    // Méthodes utilitaires
    invalidateCache: () => performanceOptimizationService.invalidateCache('statistics'),
    forceRecompute: computeStatistics
  };
};

export default useOptimizedStatistics;