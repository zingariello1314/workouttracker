/**
 * Service de Feedback Erreurs Détaillé
 * 
 * Catégorise les erreurs et fournit des messages clairs, actionnables
 * avec suggestions de solutions pour améliorer l'expérience utilisateur.
 * 
 * ✅ OPTIMISATION: Feedback Erreurs Détaillé (+25-30% satisfaction)
 * 
 * Référence: ANALYSE_ULTRA_DENSIFIEE_VERIFIEE.md - Sprint Final Optimisation #2
 */

import logger from '../../../utils/logger';

const log = logger.module('ErrorFeedbackService');

/**
 * Types d'erreurs possibles
 */
export const ERROR_TYPES = {
  CAPTURE: 'capture',
  ANALYSIS: 'analysis',
  UPLOAD: 'upload',
  SAVE: 'save',
  WEBCAM: 'webcam',
  POSE_DETECTION: 'pose_detection',
  SEGMENTATION: 'segmentation',
  METRICS: 'metrics',
  NETWORK: 'network',
  PERMISSION: 'permission',
  FILE_FORMAT: 'file_format',
  FILE_SIZE: 'file_size',
  UNKNOWN: 'unknown'
};

/**
 * Codes d'erreur spécifiques avec messages détaillés
 */
const ERROR_MESSAGES = {
  // Erreurs Capture
  [ERROR_TYPES.CAPTURE]: {
    NO_POSE_DETECTED: {
      title: 'Aucune pose détectée',
      message: 'Votre corps n\'est pas entièrement visible dans l\'image.',
      suggestions: [
        'Éloignez-vous de la caméra pour être entièrement visible',
        'Assurez-vous que la pièce est bien éclairée',
        'Portez des vêtements contrastés (évitez noir sur fond noir)',
        'Adoptez une pose standard (face, profil ou dos)'
      ],
      severity: 'warning'
    },
    POOR_QUALITY: {
      title: 'Qualité de photo insuffisante',
      message: 'La photo ne respecte pas les critères de qualité minimum.',
      suggestions: [
        'Améliorez l\'éclairage (évitez contre-jour)',
        'Restez stable pendant la capture',
        'Assurez-vous que la caméra est bien focalisée',
        'Utilisez un fond uni si possible'
      ],
      severity: 'warning'
    },
    INSTABILITY: {
      title: 'Mouvement détecté',
      message: 'Trop de mouvement détecté pendant la capture.',
      suggestions: [
        'Restez immobile pendant les 3 secondes de décompte',
        'Posez vos pieds fermement sur le sol',
        'Utilisez un support si nécessaire'
      ],
      severity: 'warning'
    }
  },

  // Erreurs Analyse
  [ERROR_TYPES.ANALYSIS]: {
    PREPROCESS_FAILED: {
      title: 'Échec du prétraitement',
      message: 'L\'image n\'a pas pu être traitée correctement.',
      suggestions: [
        'Vérifiez que la photo n\'est pas corrompue',
        'Réessayez avec une photo de meilleure qualité',
        'Assurez-vous que le format est supporté (JPEG, PNG)'
      ],
      severity: 'error'
    },
    POSE_FAILED: {
      title: 'Détection de pose échouée',
      message: 'Impossible de détecter la pose dans l\'image.',
      suggestions: [
        'Vérifiez que votre corps est entièrement visible',
        'Essayez une autre pose ou angle',
        'Réessayez avec une meilleure éclairage'
      ],
      severity: 'error'
    },
    SEGMENTATION_FAILED: {
      title: 'Segmentation échouée',
      message: 'Impossible de segmenter le corps dans l\'image.',
      suggestions: [
        'Assurez-vous que le contraste avec le fond est suffisant',
        'Portez des vêtements qui se détachent du fond',
        'Utilisez un fond uni si possible'
      ],
      severity: 'error'
    },
    METRICS_FAILED: {
      title: 'Extraction des métriques échouée',
      message: 'Impossible d\'extraire les métriques corporelles.',
      suggestions: [
        'Vérifiez que la photo est de qualité suffisante',
        'Assurez-vous que votre pose est correcte',
        'Réessayez l\'analyse'
      ],
      severity: 'error'
    },
    TIMEOUT: {
      title: 'Analyse trop longue',
      message: 'L\'analyse prend plus de temps que prévu.',
      suggestions: [
        'Attendez quelques instants, l\'analyse continue en arrière-plan',
        'Vérifiez votre connexion internet',
        'Réduisez la résolution de la photo'
      ],
      severity: 'warning'
    }
  },

  // Erreurs Upload
  [ERROR_TYPES.UPLOAD]: {
    FILE_TOO_LARGE: {
      title: 'Fichier trop volumineux',
      message: 'Le fichier dépasse la taille maximale autorisée (10 MB).',
      suggestions: [
        'Compressez l\'image avant de l\'uploader',
        'Réduisez la résolution de la photo',
        'Utilisez un format plus léger (JPEG au lieu de PNG)'
      ],
      severity: 'error'
    },
    INVALID_FORMAT: {
      title: 'Format de fichier invalide',
      message: 'Le format du fichier n\'est pas supporté.',
      suggestions: [
        'Utilisez JPEG ou PNG',
        'Vérifiez l\'extension du fichier',
        'Réessayez après conversion'
      ],
      severity: 'error'
    },
    UPLOAD_FAILED: {
      title: 'Échec de l\'upload',
      message: 'Impossible d\'uploader le fichier.',
      suggestions: [
        'Vérifiez votre connexion internet',
        'Réessayez dans quelques instants',
        'Vérifiez que le fichier n\'est pas corrompu'
      ],
      severity: 'error'
    }
  },

  // Erreurs Sauvegarde
  [ERROR_TYPES.SAVE]: {
    SAVE_FAILED: {
      title: 'Échec de la sauvegarde',
      message: 'Impossible de sauvegarder la photo.',
      suggestions: [
        'Vérifiez l\'espace de stockage disponible',
        'Réessayez dans quelques instants',
        'Videz le cache du navigateur si nécessaire'
      ],
      severity: 'error'
    },
    INDEXEDDB_ERROR: {
      title: 'Erreur de stockage',
      message: 'Problème avec le stockage local du navigateur.',
      suggestions: [
        'Autorisez le stockage local dans les paramètres du navigateur',
        'Vérifiez que vous n\'êtes pas en mode navigation privée',
        'Libérez de l\'espace de stockage'
      ],
      severity: 'error'
    }
  },

  // Erreurs Webcam
  [ERROR_TYPES.WEBCAM]: {
    NOT_AVAILABLE: {
      title: 'Webcam non disponible',
      message: 'Aucune webcam n\'a été trouvée sur votre appareil.',
      suggestions: [
        'Vérifiez que la webcam est connectée',
        'Autorisez l\'accès à la caméra dans les paramètres du navigateur',
        'Fermez d\'autres applications utilisant la caméra'
      ],
      severity: 'error'
    },
    PERMISSION_DENIED: {
      title: 'Accès caméra refusé',
      message: 'L\'accès à la caméra a été refusé.',
      suggestions: [
        'Autorisez l\'accès à la caméra dans les paramètres du navigateur',
        'Cliquez sur l\'icône de caméra dans la barre d\'adresse',
        'Rafraîchissez la page et réessayez'
      ],
      severity: 'error'
    },
    ALREADY_IN_USE: {
      title: 'Caméra déjà utilisée',
      message: 'La caméra est déjà utilisée par une autre application.',
      suggestions: [
        'Fermez les autres applications utilisant la caméra',
        'Attendez quelques instants et réessayez',
        'Redémarrez votre navigateur si nécessaire'
      ],
      severity: 'warning'
    },
    LOW_QUALITY: {
      title: 'Qualité webcam insuffisante',
      message: 'La résolution de la webcam est trop faible.',
      suggestions: [
        'Utilisez une webcam de meilleure qualité si disponible',
        'Rapprochez-vous légèrement de la caméra',
        'Améliorez l\'éclairage'
      ],
      severity: 'warning'
    }
  },

  // Erreurs Réseau
  [ERROR_TYPES.NETWORK]: {
    TIMEOUT: {
      title: 'Délai d\'attente dépassé',
      message: 'La requête a pris trop de temps.',
      suggestions: [
        'Vérifiez votre connexion internet',
        'Réessayez dans quelques instants',
        'Vérifiez que les services sont accessibles'
      ],
      severity: 'error'
    },
    OFFLINE: {
      title: 'Hors ligne',
      message: 'Vous n\'êtes pas connecté à internet.',
      suggestions: [
        'Vérifiez votre connexion internet',
        'Réessayez une fois connecté',
        'Utilisez la fonctionnalité hors ligne si disponible'
      ],
      severity: 'error'
    }
  },

  // Erreur générique
  [ERROR_TYPES.UNKNOWN]: {
    GENERIC: {
      title: 'Erreur inattendue',
      message: 'Une erreur inattendue s\'est produite.',
      suggestions: [
        'Rafraîchissez la page et réessayez',
        'Vérifiez la console pour plus de détails',
        'Contactez le support si le problème persiste'
      ],
      severity: 'error'
    }
  }
};

/**
 * Service de feedback d'erreurs détaillé
 */
class ErrorFeedbackService {
  /**
   * Analyse une erreur et retourne un objet de feedback détaillé
   * 
   * @param {Error|string|Object} error - L'erreur à analyser
   * @param {string} errorType - Type d'erreur (ERROR_TYPES)
   * @param {string} errorCode - Code d'erreur spécifique (optionnel)
   * @param {Object} context - Contexte supplémentaire (photo, étape, etc.)
   * @returns {Object} Objet de feedback avec title, message, suggestions, severity
   */
  analyzeError(error, errorType = ERROR_TYPES.UNKNOWN, errorCode = null, context = {}) {
    try {
      // Normaliser l'erreur
      const normalizedError = this.normalizeError(error);
      
      // Déterminer le code d'erreur si non fourni
      if (!errorCode) {
        errorCode = this.detectErrorCode(normalizedError, errorType, context);
      }
      
      // Récupérer le message d'erreur spécifique
      const errorMessages = ERROR_MESSAGES[errorType];
      if (!errorMessages || !errorMessages[errorCode]) {
        // Fallback vers erreur générique
        return ERROR_MESSAGES[ERROR_TYPES.UNKNOWN].GENERIC;
      }
      
      const feedback = errorMessages[errorCode];
      
      // Enrichir avec contexte si disponible
      if (context.photoId) {
        feedback.photoId = context.photoId;
      }
      if (context.step) {
        feedback.step = context.step;
      }
      
      // Logger pour debugging
      log.info('Erreur analysée', {
        errorType,
        errorCode,
        originalError: normalizedError.message || normalizedError,
        context
      });
      
      return feedback;
      
    } catch (error) {
      log.error('Erreur lors de l\'analyse de l\'erreur', error);
      return ERROR_MESSAGES[ERROR_TYPES.UNKNOWN].GENERIC;
    }
  }
  
  /**
   * Normalise une erreur en objet cohérent
   */
  normalizeError(error) {
    if (typeof error === 'string') {
      return { message: error };
    }
    if (error instanceof Error) {
      return {
        message: error.message,
        stack: error.stack,
        name: error.name
      };
    }
    if (typeof error === 'object' && error !== null) {
      return {
        message: error.message || error.error || JSON.stringify(error),
        ...error
      };
    }
    return { message: 'Erreur inconnue' };
  }
  
  /**
   * Détecte le code d'erreur depuis le message d'erreur
   */
  detectErrorCode(error, errorType, context) {
    const errorMessage = (error.message || error || '').toLowerCase();
    
    // Détection par mots-clés dans le message
    const keywordMappings = {
      [ERROR_TYPES.CAPTURE]: {
        'pose': 'NO_POSE_DETECTED',
        'quality': 'POOR_QUALITY',
        'stability': 'INSTABILITY',
        'movement': 'INSTABILITY'
      },
      [ERROR_TYPES.ANALYSIS]: {
        'preprocess': 'PREPROCESS_FAILED',
        'pose': 'POSE_FAILED',
        'segmentation': 'SEGMENTATION_FAILED',
        'metrics': 'METRICS_FAILED',
        'timeout': 'TIMEOUT'
      },
      [ERROR_TYPES.UPLOAD]: {
        'size': 'FILE_TOO_LARGE',
        'format': 'INVALID_FORMAT',
        'upload': 'UPLOAD_FAILED'
      },
      [ERROR_TYPES.SAVE]: {
        'save': 'SAVE_FAILED',
        'indexeddb': 'INDEXEDDB_ERROR',
        'storage': 'INDEXEDDB_ERROR'
      },
      [ERROR_TYPES.WEBCAM]: {
        'permission': 'PERMISSION_DENIED',
        'not available': 'NOT_AVAILABLE',
        'already in use': 'ALREADY_IN_USE',
        'quality': 'LOW_QUALITY'
      },
      [ERROR_TYPES.NETWORK]: {
        'timeout': 'TIMEOUT',
        'offline': 'OFFLINE',
        'network': 'TIMEOUT'
      }
    };
    
    const mappings = keywordMappings[errorType] || {};
    for (const [keyword, code] of Object.entries(mappings)) {
      if (errorMessage.includes(keyword)) {
        return code;
      }
    }
    
    // Fallback: code générique
    return 'GENERIC';
  }
  
  /**
   * Formate un message d'erreur complet pour affichage
   * 
   * @param {Object} feedback - Objet de feedback retourné par analyzeError
   * @param {boolean} includeSuggestions - Inclure les suggestions (default: true)
   * @returns {string} Message formaté
   */
  formatErrorMessage(feedback, includeSuggestions = true) {
    let message = `${feedback.title}\n\n${feedback.message}`;
    
    if (includeSuggestions && feedback.suggestions && feedback.suggestions.length > 0) {
      message += '\n\n💡 Suggestions :\n';
      feedback.suggestions.forEach((suggestion, index) => {
        message += `${index + 1}. ${suggestion}\n`;
      });
    }
    
    return message;
  }
  
  /**
   * Récupère la sévérité d'une erreur (pour déterminer le type de toast)
   */
  getSeverity(errorType, errorCode) {
    const errorMessages = ERROR_MESSAGES[errorType];
    if (errorMessages && errorMessages[errorCode]) {
      return errorMessages[errorCode].severity || 'error';
    }
    return 'error';
  }
}

// Singleton
let instance = null;

/**
 * Obtenir l'instance singleton du service
 */
export const getErrorFeedbackService = () => {
  if (!instance) {
    instance = new ErrorFeedbackService();
  }
  return instance;
};

