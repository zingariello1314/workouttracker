/**
 * Utilitaires de gestion d'erreurs pour les données Garmin
 * 
 * Requirements: 1.4
 * - Gérer les cas de données manquantes ou incomplètes (1.4)
 */

import {
  GarminDataError,
  ErrorHandlingConfig,
  DataValidationResult,
  GarminSidebarData
} from '../types/garminSidebarData';

/**
 * Types d'erreurs Garmin
 */
export enum GarminErrorType {
  MISSING_DATA = 'missing_data',
  INVALID_FORMAT = 'invalid_format',
  NETWORK_ERROR = 'network_error',
  SYNC_ERROR = 'sync_error',
  TIMEOUT_ERROR = 'timeout_error',
  PERMISSION_ERROR = 'permission_error'
}

/**
 * Codes d'erreur spécifiques
 */
export enum GarminErrorCode {
  NO_HEART_RATE_DATA = 'NO_HR_DATA',
  INVALID_TIME_SERIES = 'INVALID_TS',
  MISSING_DAILY_METRICS = 'NO_DAILY_METRICS',
  CORRUPTED_DATA = 'CORRUPTED_DATA',
  SYNC_TIMEOUT = 'SYNC_TIMEOUT',
  API_UNAVAILABLE = 'API_UNAVAILABLE'
}

/**
 * Gestionnaire d'erreurs pour les données Garmin
 */
export class GarminDataErrorHandler {
  private static instance: GarminDataErrorHandler;
  private config: ErrorHandlingConfig;
  private errorHistory: GarminDataError[] = [];
  private maxHistorySize = 50;

  constructor(config?: Partial<ErrorHandlingConfig>) {
    this.config = {
      useFallbackData: true,
      showErrorMessages: true,
      autoRetry: false,
      maxRetries: 3,
      retryDelay: 1000,
      ...config
    };
  }

  /**
   * Obtenir l'instance singleton
   */
  static getInstance(config?: Partial<ErrorHandlingConfig>): GarminDataErrorHandler {
    if (!GarminDataErrorHandler.instance) {
      GarminDataErrorHandler.instance = new GarminDataErrorHandler(config);
    }
    return GarminDataErrorHandler.instance;
  }

  /**
   * Crée une erreur Garmin standardisée
   */
  createError(
    type: GarminErrorType,
    message: string,
    code?: GarminErrorCode,
    details?: Record<string, any>
  ): GarminDataError {
    const error: GarminDataError = {
      type,
      message,
      code,
      details,
      timestamp: new Date().toISOString()
    };

    // Ajouter à l'historique
    this.addToHistory(error);

    return error;
  }

  /**
   * Valide les données de fréquence cardiaque
   */
  validateHeartRateData(data: any): DataValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const missingFields: string[] = [];

    if (!data) {
      errors.push('Aucune donnée de fréquence cardiaque');
      return { isValid: false, errors, warnings, missingFields };
    }

    // Vérifier les métriques de base
    if (!data.resting && !data.max && !data.average && !data.avg) {
      missingFields.push('métriques FC de base (repos, max, moyenne)');
      warnings.push('Aucune métrique de FC de base disponible');
    }

    // Vérifier les données de série temporelle
    if (data.timeSeries) {
      if (!Array.isArray(data.timeSeries)) {
        errors.push('Les données de série temporelle doivent être un tableau');
      } else if (data.timeSeries.length === 0) {
        warnings.push('Série temporelle vide');
      } else {
        // Valider quelques points de la série
        const invalidPoints = data.timeSeries.filter((point: any, index: number) => {
          if (index > 10) return false; // Vérifier seulement les 10 premiers points
          return !this.isValidTimeSeriesPoint(point);
        });

        if (invalidPoints.length > 0) {
          warnings.push(`${invalidPoints.length} points de série temporelle invalides détectés`);
        }
      }
    } else {
      missingFields.push('timeSeries');
      warnings.push('Aucune donnée de série temporelle disponible');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      missingFields
    };
  }

  /**
   * Valide un point de série temporelle
   */
  private isValidTimeSeriesPoint(point: any): boolean {
    if (!point) return false;

    // Format standard
    if (point.timestamp && point.bpm !== undefined) {
      const timestamp = typeof point.timestamp === 'number' ? point.timestamp : new Date(point.timestamp).getTime();
      const bpm = typeof point.bpm === 'number' ? point.bpm : parseFloat(point.bpm);
      
      return !isNaN(timestamp) && !isNaN(bpm) && bpm > 0 && bpm < 300;
    }

    // Format compressé
    if (point.d_ts !== undefined && point.d_val !== undefined) {
      const timestamp = point.d_ts;
      const bpm = typeof point.d_val === 'number' ? point.d_val : parseFloat(point.d_val);
      
      return !isNaN(timestamp) && !isNaN(bpm) && bpm > 0 && bpm < 300;
    }

    // Format simple (juste une valeur)
    if (typeof point === 'number') {
      return point > 0 && point < 300;
    }

    return false;
  }

  /**
   * Valide les données quotidiennes
   */
  validateDailyMetrics(data: any, selectedDate: string): DataValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const missingFields: string[] = [];

    if (!data) {
      errors.push('Aucune donnée quotidienne');
      return { isValid: false, errors, warnings, missingFields };
    }

    // Vérifier la structure de base
    if (typeof data !== 'object') {
      errors.push('Les données quotidiennes doivent être un objet');
      return { isValid: false, errors, warnings, missingFields };
    }

    // Vérifier les champs essentiels
    const essentialFields = ['heartRate', 'steps', 'calories'];
    const optionalFields = ['sleep', 'stress', 'bodyBattery', 'intensityMinutes'];

    essentialFields.forEach(field => {
      if (!data[field]) {
        missingFields.push(field);
        warnings.push(`Champ essentiel manquant: ${field}`);
      }
    });

    optionalFields.forEach(field => {
      if (!data[field]) {
        missingFields.push(field);
      }
    });

    // Validation spécifique de la fréquence cardiaque
    if (data.heartRate) {
      const hrValidation = this.validateHeartRateData(data.heartRate);
      errors.push(...hrValidation.errors);
      warnings.push(...hrValidation.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      missingFields
    };
  }

  /**
   * Gère une erreur de données manquantes
   */
  handleMissingData(
    missingFields: string[],
    selectedDate: string,
    context: string = 'unknown'
  ): GarminDataError {
    const message = `Données manquantes pour ${selectedDate}: ${missingFields.join(', ')}`;
    
    return this.createError(
      GarminErrorType.MISSING_DATA,
      message,
      GarminErrorCode.MISSING_DAILY_METRICS,
      {
        missingFields,
        selectedDate,
        context,
        suggestion: 'Synchronisez vos données Garmin ou vérifiez votre connexion'
      }
    );
  }

  /**
   * Gère une erreur de format invalide
   */
  handleInvalidFormat(
    field: string,
    expectedFormat: string,
    actualValue: any,
    context: string = 'unknown'
  ): GarminDataError {
    const message = `Format invalide pour ${field}: attendu ${expectedFormat}, reçu ${typeof actualValue}`;
    
    return this.createError(
      GarminErrorType.INVALID_FORMAT,
      message,
      GarminErrorCode.CORRUPTED_DATA,
      {
        field,
        expectedFormat,
        actualValue: typeof actualValue,
        context,
        suggestion: 'Vérifiez la structure des données ou resynchronisez'
      }
    );
  }

  /**
   * Gère une erreur de synchronisation
   */
  handleSyncError(
    operation: string,
    originalError: Error,
    context: string = 'unknown'
  ): GarminDataError {
    const message = `Erreur de synchronisation lors de ${operation}: ${originalError.message}`;
    
    return this.createError(
      GarminErrorType.SYNC_ERROR,
      message,
      GarminErrorCode.SYNC_TIMEOUT,
      {
        operation,
        originalError: originalError.message,
        context,
        suggestion: 'Réessayez la synchronisation ou vérifiez votre connexion'
      }
    );
  }

  /**
   * Gère une erreur réseau
   */
  handleNetworkError(
    endpoint: string,
    statusCode?: number,
    context: string = 'unknown'
  ): GarminDataError {
    const message = `Erreur réseau lors de l'accès à ${endpoint}${statusCode ? ` (${statusCode})` : ''}`;
    
    return this.createError(
      GarminErrorType.NETWORK_ERROR,
      message,
      GarminErrorCode.API_UNAVAILABLE,
      {
        endpoint,
        statusCode,
        context,
        suggestion: 'Vérifiez votre connexion internet et réessayez'
      }
    );
  }

  /**
   * Détermine si une erreur est récupérable
   */
  isRecoverableError(error: GarminDataError): boolean {
    const recoverableTypes = [
      GarminErrorType.NETWORK_ERROR,
      GarminErrorType.SYNC_ERROR,
      GarminErrorType.TIMEOUT_ERROR
    ];

    const recoverableCodes = [
      GarminErrorCode.SYNC_TIMEOUT,
      GarminErrorCode.API_UNAVAILABLE
    ];

    return recoverableTypes.includes(error.type) || 
           (error.code && recoverableCodes.includes(error.code));
  }

  /**
   * Suggère une action de récupération
   */
  suggestRecoveryAction(error: GarminDataError): string {
    switch (error.type) {
      case GarminErrorType.MISSING_DATA:
        return 'Synchronisez vos données Garmin ou vérifiez que votre montre est connectée';
      
      case GarminErrorType.INVALID_FORMAT:
        return 'Resynchronisez vos données ou contactez le support si le problème persiste';
      
      case GarminErrorType.NETWORK_ERROR:
        return 'Vérifiez votre connexion internet et réessayez';
      
      case GarminErrorType.SYNC_ERROR:
        return 'Réessayez la synchronisation dans quelques minutes';
      
      case GarminErrorType.TIMEOUT_ERROR:
        return 'La synchronisation prend plus de temps que prévu, patientez ou réessayez';
      
      case GarminErrorType.PERMISSION_ERROR:
        return 'Vérifiez les autorisations de votre compte Garmin';
      
      default:
        return 'Réessayez ou contactez le support si le problème persiste';
    }
  }

  /**
   * Crée un message d'erreur utilisateur-friendly
   */
  createUserFriendlyMessage(error: GarminDataError): string {
    const baseMessage = this.getUserFriendlyErrorMessage(error.type);
    const suggestion = error.details?.suggestion || this.suggestRecoveryAction(error);
    
    return `${baseMessage}\n\n💡 ${suggestion}`;
  }

  /**
   * Obtient un message d'erreur convivial
   */
  private getUserFriendlyErrorMessage(type: GarminErrorType): string {
    switch (type) {
      case GarminErrorType.MISSING_DATA:
        return '📊 Données Garmin manquantes';
      
      case GarminErrorType.INVALID_FORMAT:
        return '⚠️ Format de données incorrect';
      
      case GarminErrorType.NETWORK_ERROR:
        return '🌐 Problème de connexion';
      
      case GarminErrorType.SYNC_ERROR:
        return '🔄 Erreur de synchronisation';
      
      case GarminErrorType.TIMEOUT_ERROR:
        return '⏱️ Délai d'attente dépassé';
      
      case GarminErrorType.PERMISSION_ERROR:
        return '🔒 Problème d'autorisation';
      
      default:
        return '❌ Erreur inconnue';
    }
  }

  /**
   * Ajoute une erreur à l'historique
   */
  private addToHistory(error: GarminDataError): void {
    this.errorHistory.unshift(error);
    
    // Limiter la taille de l'historique
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * Obtient l'historique des erreurs
   */
  getErrorHistory(limit?: number): GarminDataError[] {
    return limit ? this.errorHistory.slice(0, limit) : [...this.errorHistory];
  }

  /**
   * Obtient les statistiques d'erreurs
   */
  getErrorStats(): {
    total: number;
    byType: Record<GarminErrorType, number>;
    byCode: Record<string, number>;
    recent: number; // Erreurs des dernières 24h
  } {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const byType = {} as Record<GarminErrorType, number>;
    const byCode = {} as Record<string, number>;
    let recent = 0;

    this.errorHistory.forEach(error => {
      // Compter par type
      byType[error.type] = (byType[error.type] || 0) + 1;
      
      // Compter par code
      if (error.code) {
        byCode[error.code] = (byCode[error.code] || 0) + 1;
      }
      
      // Compter les erreurs récentes
      if (new Date(error.timestamp) > oneDayAgo) {
        recent++;
      }
    });

    return {
      total: this.errorHistory.length,
      byType,
      byCode,
      recent
    };
  }

  /**
   * Vide l'historique des erreurs
   */
  clearErrorHistory(): void {
    this.errorHistory = [];
  }

  /**
   * Met à jour la configuration
   */
  updateConfig(newConfig: Partial<ErrorHandlingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Obtient la configuration actuelle
   */
  getConfig(): ErrorHandlingConfig {
    return { ...this.config };
  }
}

// Instance par défaut
export const garminDataErrorHandler = GarminDataErrorHandler.getInstance();

/**
 * Utilitaires de validation rapide
 */
export const GarminDataValidators = {
  /**
   * Vérifie si une valeur de FC est valide
   */
  isValidHeartRate(bpm: any): boolean {
    const value = typeof bpm === 'number' ? bpm : parseFloat(bpm);
    return !isNaN(value) && value > 30 && value < 220;
  },

  /**
   * Vérifie si un timestamp est valide
   */
  isValidTimestamp(timestamp: any): boolean {
    const value = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime();
    return !isNaN(value) && value > 0;
  },

  /**
   * Vérifie si une date est valide
   */
  isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  },

  /**
   * Vérifie si des données de sommeil sont valides
   */
  isValidSleepData(sleep: any): boolean {
    if (!sleep || typeof sleep !== 'object') return false;
    
    const duration = typeof sleep.duration === 'number' ? sleep.duration : parseFloat(sleep.duration);
    return !isNaN(duration) && duration > 0 && duration < 1440; // Max 24h
  },

  /**
   * Vérifie si des données de calories sont valides
   */
  isValidCaloriesData(calories: any): boolean {
    if (!calories || typeof calories !== 'object') return false;
    
    const total = typeof calories.total === 'number' ? calories.total : parseFloat(calories.total);
    return !isNaN(total) && total >= 0 && total < 10000; // Max raisonnable
  }
};