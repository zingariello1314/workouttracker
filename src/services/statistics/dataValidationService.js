/**
 * Data Validation Service
 * 
 * Service pour valider et nettoyer les données de lecture avant
 * le calcul des statistiques, avec gestion des cas d'erreur.
 * 
 * Features:
 * - Validation des structures de données
 * - Nettoyage des données corrompues
 * - Fallbacks pour données insuffisantes
 * - Rapports de validation détaillés
 * 
 * @see Requirements 1.5
 */

class DataValidationService {
  constructor() {
    this.validationRules = {
      book: {
        required: ['id', 'title'],
        optional: ['author', 'genre', 'pages', 'status', 'readingSessions'],
        types: {
          id: 'string',
          title: 'string',
          author: 'string',
          genre: 'string',
          pages: 'number',
          status: 'string'
        }
      },
      session: {
        required: ['id', 'date'],
        optional: ['durationMinutes', 'pagesRead', 'note'],
        types: {
          id: 'string',
          date: 'string',
          durationMinutes: 'number',
          pagesRead: 'number',
          note: 'string'
        }
      }
    };
  }

  /**
   * Valider et nettoyer un tableau de livres
   */
  validateBooks(books) {
    const result = {
      isValid: true,
      cleanedBooks: [],
      errors: [],
      warnings: [],
      stats: {
        totalBooks: 0,
        validBooks: 0,
        corruptedBooks: 0,
        totalSessions: 0,
        validSessions: 0,
        corruptedSessions: 0
      }
    };

    try {
      // Vérifier que books est un tableau
      if (!Array.isArray(books)) {
        result.isValid = false;
        result.errors.push({
          type: 'INVALID_TYPE',
          message: 'Books data is not an array',
          data: typeof books
        });
        return result;
      }

      result.stats.totalBooks = books.length;

      // Valider chaque livre
      books.forEach((book, index) => {
        try {
          const validatedBook = this.validateBook(book, index);
          
          if (validatedBook.isValid) {
            result.cleanedBooks.push(validatedBook.cleanedBook);
            result.stats.validBooks++;
            result.stats.totalSessions += validatedBook.stats.totalSessions;
            result.stats.validSessions += validatedBook.stats.validSessions;
            result.stats.corruptedSessions += validatedBook.stats.corruptedSessions;
          } else {
            result.stats.corruptedBooks++;
            result.errors.push(...validatedBook.errors);
            result.warnings.push(...validatedBook.warnings);
          }
        } catch (error) {
          result.stats.corruptedBooks++;
          result.errors.push({
            type: 'VALIDATION_ERROR',
            message: `Error validating book at index ${index}`,
            error: error.message,
            bookId: book?.id || 'unknown'
          });
        }
      });

      // Déterminer si le résultat global est valide
      // Un tableau vide est considéré comme valide (pas de données à afficher)
      result.isValid = result.errors.length === 0;

    } catch (error) {
      result.isValid = false;
      result.errors.push({
        type: 'CRITICAL_ERROR',
        message: 'Critical error during books validation',
        error: error.message
      });
    }

    return result;
  }

  /**
   * Valider un livre individuel
   */
  validateBook(book, index = 0) {
    const result = {
      isValid: true,
      cleanedBook: null,
      errors: [],
      warnings: [],
      stats: {
        totalSessions: 0,
        validSessions: 0,
        corruptedSessions: 0
      }
    };

    try {
      // Vérifier que book est un objet
      if (!book || typeof book !== 'object') {
        result.isValid = false;
        result.errors.push({
          type: 'INVALID_BOOK_TYPE',
          message: `Book at index ${index} is not an object`,
          data: typeof book
        });
        return result;
      }

      // Créer une copie nettoyée du livre
      const cleanedBook = { ...book };

      // Valider les champs requis
      for (const field of this.validationRules.book.required) {
        if (!book[field]) {
          result.isValid = false;
          result.errors.push({
            type: 'MISSING_REQUIRED_FIELD',
            message: `Book missing required field: ${field}`,
            bookId: book.id || `index_${index}`,
            field
          });
        }
      }

      // Valider les types de données
      for (const [field, expectedType] of Object.entries(this.validationRules.book.types)) {
        if (book[field] !== undefined && book[field] !== null) {
          const actualType = typeof book[field];
          if (actualType !== expectedType && !(expectedType === 'number' && !isNaN(book[field]))) {
            result.warnings.push({
              type: 'TYPE_MISMATCH',
              message: `Book field ${field} has wrong type`,
              bookId: book.id || `index_${index}`,
              field,
              expected: expectedType,
              actual: actualType
            });

            // Tenter de corriger le type
            if (expectedType === 'number') {
              const numValue = Number(book[field]);
              if (!isNaN(numValue)) {
                cleanedBook[field] = numValue;
              }
            } else if (expectedType === 'string') {
              cleanedBook[field] = String(book[field]);
            }
          }
        }
      }

      // Valider les sessions de lecture
      if (book.readingSessions) {
        const sessionsResult = this.validateSessions(book.readingSessions, book.id || `index_${index}`);
        cleanedBook.readingSessions = sessionsResult.cleanedSessions;
        result.stats = sessionsResult.stats;
        result.warnings.push(...sessionsResult.warnings);
        
        if (!sessionsResult.isValid) {
          result.errors.push(...sessionsResult.errors);
        }
      } else {
        cleanedBook.readingSessions = [];
      }

      // Nettoyer les champs optionnels
      this.cleanOptionalFields(cleanedBook);

      result.cleanedBook = cleanedBook;

    } catch (error) {
      result.isValid = false;
      result.errors.push({
        type: 'BOOK_VALIDATION_ERROR',
        message: `Error validating book at index ${index}`,
        error: error.message,
        bookId: book?.id || 'unknown'
      });
    }

    return result;
  }

  /**
   * Valider les sessions de lecture
   */
  validateSessions(sessions, bookId) {
    const result = {
      isValid: true,
      cleanedSessions: [],
      errors: [],
      warnings: [],
      stats: {
        totalSessions: 0,
        validSessions: 0,
        corruptedSessions: 0
      }
    };

    try {
      if (!Array.isArray(sessions)) {
        result.warnings.push({
          type: 'INVALID_SESSIONS_TYPE',
          message: 'Reading sessions is not an array',
          bookId,
          data: typeof sessions
        });
        return result;
      }

      result.stats.totalSessions = sessions.length;

      sessions.forEach((session, index) => {
        try {
          const validatedSession = this.validateSession(session, bookId, index);
          
          if (validatedSession.isValid) {
            result.cleanedSessions.push(validatedSession.cleanedSession);
            result.stats.validSessions++;
          } else {
            result.stats.corruptedSessions++;
            result.warnings.push(...validatedSession.warnings);
            result.errors.push(...validatedSession.errors);
          }
        } catch (error) {
          result.stats.corruptedSessions++;
          result.warnings.push({
            type: 'SESSION_VALIDATION_ERROR',
            message: `Error validating session at index ${index}`,
            bookId,
            error: error.message
          });
        }
      });

    } catch (error) {
      result.isValid = false;
      result.errors.push({
        type: 'SESSIONS_VALIDATION_ERROR',
        message: 'Critical error validating sessions',
        bookId,
        error: error.message
      });
    }

    return result;
  }

  /**
   * Valider une session individuelle
   */
  validateSession(session, bookId, index = 0) {
    const result = {
      isValid: true,
      cleanedSession: null,
      errors: [],
      warnings: []
    };

    try {
      if (!session || typeof session !== 'object') {
        result.isValid = false;
        result.errors.push({
          type: 'INVALID_SESSION_TYPE',
          message: `Session at index ${index} is not an object`,
          bookId,
          sessionIndex: index
        });
        return result;
      }

      const cleanedSession = { ...session };

      // Valider les champs requis
      for (const field of this.validationRules.session.required) {
        if (!session[field]) {
          result.isValid = false;
          result.errors.push({
            type: 'MISSING_SESSION_FIELD',
            message: `Session missing required field: ${field}`,
            bookId,
            sessionIndex: index,
            field
          });
        }
      }

      // Valider la date
      if (session.date) {
        const date = new Date(session.date);
        if (isNaN(date.getTime())) {
          result.warnings.push({
            type: 'INVALID_DATE',
            message: 'Session has invalid date',
            bookId,
            sessionIndex: index,
            date: session.date
          });
          // Utiliser la date actuelle comme fallback
          cleanedSession.date = new Date().toISOString().split('T')[0];
        }
      }

      // Valider les valeurs numériques
      ['durationMinutes', 'pagesRead'].forEach(field => {
        if (session[field] !== undefined) {
          const numValue = Number(session[field]);
          if (isNaN(numValue) || numValue < 0) {
            result.warnings.push({
              type: 'INVALID_NUMERIC_VALUE',
              message: `Session has invalid ${field}`,
              bookId,
              sessionIndex: index,
              field,
              value: session[field]
            });
            cleanedSession[field] = 0;
          } else {
            cleanedSession[field] = numValue;
          }
        }
      });

      result.cleanedSession = cleanedSession;

    } catch (error) {
      result.isValid = false;
      result.errors.push({
        type: 'SESSION_VALIDATION_ERROR',
        message: `Error validating session at index ${index}`,
        bookId,
        error: error.message
      });
    }

    return result;
  }

  /**
   * Nettoyer les champs optionnels
   */
  cleanOptionalFields(book) {
    // Nettoyer les chaînes vides
    ['author', 'genre'].forEach(field => {
      if (book[field] === '') {
        book[field] = null;
      }
    });

    // Valider le statut
    const validStatuses = ['in-progress', 'completed', 'to-read', 'paused', 'abandoned'];
    if (book.status && !validStatuses.includes(book.status)) {
      book.status = 'in-progress'; // Statut par défaut
    }

    // Nettoyer les résumés
    ['shortSummary', 'longSummary', 'notes'].forEach(field => {
      if (typeof book[field] === 'string') {
        book[field] = book[field].trim();
        if (book[field] === '') {
          book[field] = null;
        }
      }
    });
  }

  /**
   * Créer un rapport de validation lisible
   */
  generateValidationReport(validationResult) {
    const { stats, errors, warnings } = validationResult;
    
    const report = {
      summary: {
        isValid: validationResult.isValid,
        totalBooks: stats.totalBooks,
        validBooks: stats.validBooks,
        corruptedBooks: stats.corruptedBooks,
        totalSessions: stats.totalSessions,
        validSessions: stats.validSessions,
        corruptedSessions: stats.corruptedSessions,
        errorCount: errors.length,
        warningCount: warnings.length
      },
      issues: {
        critical: errors.filter(e => e.type.includes('CRITICAL')),
        errors: errors.filter(e => !e.type.includes('CRITICAL')),
        warnings
      },
      recommendations: this.generateRecommendations(validationResult)
    };

    return report;
  }

  /**
   * Générer des recommandations basées sur les erreurs
   */
  generateRecommendations(validationResult) {
    const recommendations = [];
    const { errors, warnings, stats } = validationResult;

    if (stats.corruptedBooks > 0) {
      recommendations.push({
        type: 'data_cleanup',
        message: `${stats.corruptedBooks} livre(s) corrompu(s) détecté(s). Considérez nettoyer vos données.`,
        priority: 'high'
      });
    }

    if (stats.corruptedSessions > 0) {
      recommendations.push({
        type: 'session_cleanup',
        message: `${stats.corruptedSessions} session(s) de lecture corrompue(s). Vérifiez vos enregistrements.`,
        priority: 'medium'
      });
    }

    if (warnings.length > errors.length * 2) {
      recommendations.push({
        type: 'data_quality',
        message: 'Beaucoup d\'avertissements détectés. Améliorez la qualité de vos données.',
        priority: 'low'
      });
    }

    return recommendations;
  }
}

// Instance singleton
const dataValidationService = new DataValidationService();

export default dataValidationService;