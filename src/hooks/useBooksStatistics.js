import { useMemo } from 'react';
import { measureSync, SIDEBAR_OPERATIONS } from '../utils/performanceMonitor';

/**
 * Hook pour calculer les statistiques de lecture pour la sidebar
 * 
 * Calcule:
 * - currentBooks: nombre de livres avec status 'in-progress'
 * - todayPages: total des pages lues aujourd'hui
 * - todayMinutes: total des minutes lues aujourd'hui
 * - dailyGoal: objectif quotidien en minutes (depuis localStorage ou 30 par défaut)
 * - hasData: indicateur de disponibilité des données
 * 
 * Performance optimizations:
 * - useMemo pour éviter les recalculs inutiles
 * - Calculs optimisés avec early returns
 * - Gestion d'erreur robuste
 * 
 * @param {Array} books - Liste des livres depuis useBooksStorage
 * @returns {Object} Statistiques de lecture
 * 
 * @example
 * const { currentBooks, todayPages, todayMinutes, dailyGoal, hasData } = useBooksStatistics(books);
 */
export const useBooksStatistics = (books = []) => {
  // Date d'aujourd'hui - calculée une seule fois et mémorisée
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Calculer les statistiques avec memoization et monitoring de performance
  const statistics = useMemo(() => {
    return measureSync(SIDEBAR_OPERATIONS.BOOKS_STATISTICS, () => {
      try {
        // Vérifier que books est un tableau valide
        if (!Array.isArray(books)) {
          console.warn('[useBooksStatistics] books is not an array:', books);
          return {
            currentBooks: 0,
            todayPages: 0,
            todayMinutes: 0,
            dailyGoal: 30,
            hasData: false
          };
        }

        // Utiliser la date mémorisée

        // 1. Calculer currentBooks (livres avec status 'in-progress')
        const currentBooks = books.filter(book => 
          book && book.status === 'in-progress'
        ).length;

        // 2. Calculer todayPages et todayMinutes
        let todayPages = 0;
        let todayMinutes = 0;

        books.forEach(book => {
          if (!book || !Array.isArray(book.readingSessions)) {
            return;
          }

          // Filtrer les sessions d'aujourd'hui
          const todaySessions = book.readingSessions.filter(session => {
            if (!session || !session.date) {
              return false;
            }
            // Normaliser la date de la session au format YYYY-MM-DD
            const sessionDate = session.date.split('T')[0];
            return sessionDate === today;
          });

          // Agréger les pages et minutes
          todaySessions.forEach(session => {
            todayPages += Number(session.pagesRead) || 0;
            todayMinutes += Number(session.durationMinutes) || 0;
          });
        });

        // 3. Récupérer dailyGoal depuis localStorage
        let dailyGoal = 30; // Valeur par défaut
        try {
          const storedGoal = localStorage.getItem('readingDailyGoal');
          if (storedGoal) {
            const parsedGoal = Number(storedGoal);
            if (!isNaN(parsedGoal) && parsedGoal > 0) {
              dailyGoal = parsedGoal;
            }
          }
        } catch (error) {
          console.warn('[useBooksStatistics] Error reading dailyGoal from localStorage:', error);
        }

        // 4. Déterminer hasData
        const hasData = books.length > 0;

        return {
          currentBooks,
          todayPages,
          todayMinutes,
          dailyGoal,
          hasData
        };
      } catch (error) {
        console.error('[useBooksStatistics] Error calculating statistics:', error);
        // Retourner des valeurs par défaut sûres en cas d'erreur
        return {
          currentBooks: 0,
          todayPages: 0,
          todayMinutes: 0,
          dailyGoal: 30,
          hasData: false
        };
      }
    });
  }, [books, today]);

  return statistics;
};

export default useBooksStatistics;
