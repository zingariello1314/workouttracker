/**
 * Logger centralisé pour l'application
 * Remplace tous les console.log/error/warn par un système de logging contrôlé
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 1,
  ERROR: 2,
  NONE: 3
};

// Niveau de log selon environnement
const getLogLevel = () => {
  if (process.env.NODE_ENV === 'production') {
    // En production, seulement WARN et ERROR
    return LOG_LEVELS.WARN;
  }
  // En développement, tout est loggé
  return LOG_LEVELS.DEBUG;
};

const currentLogLevel = getLogLevel();

/**
 * Logger principal
 */
const logger = {
  /**
   * Log debug (seulement en développement)
   */
  debug: (message, ...args) => {
    if (currentLogLevel <= LOG_LEVELS.DEBUG) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },

  /**
   * Log info (développement uniquement)
   */
  info: (message, ...args) => {
    if (currentLogLevel <= LOG_LEVELS.INFO) {
      console.info(`[INFO] ${message}`, ...args);
    }
  },

  /**
   * Log warning (toujours visible, même en production)
   */
  warn: (message, ...args) => {
    if (currentLogLevel <= LOG_LEVELS.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },

  /**
   * Log error (toujours visible, même en production)
   */
  error: (message, error = null, ...args) => {
    if (currentLogLevel <= LOG_LEVELS.ERROR) {
      if (error instanceof Error) {
        console.error(`[ERROR] ${message}`, error, ...args);
        // Optionnel : envoyer à service de tracking d'erreurs
        // trackError(error, { context: message, ...args });
      } else {
        console.error(`[ERROR] ${message}`, error, ...args);
      }
    }
  },

  /**
   * Logger pour composant spécifique (avec préfixe)
   */
  component: (componentName) => ({
    debug: (message, ...args) => logger.debug(`[${componentName}] ${message}`, ...args),
    info: (message, ...args) => logger.info(`[${componentName}] ${message}`, ...args),
    warn: (message, ...args) => logger.warn(`[${componentName}] ${message}`, ...args),
    error: (message, error, ...args) => logger.error(`[${componentName}] ${message}`, error, ...args)
  }),

  /**
   * Logger pour hook spécifique
   */
  hook: (hookName) => ({
    debug: (message, ...args) => logger.debug(`[${hookName}] ${message}`, ...args),
    info: (message, ...args) => logger.info(`[${hookName}] ${message}`, ...args),
    warn: (message, ...args) => logger.warn(`[${hookName}] ${message}`, ...args),
    error: (message, error, ...args) => logger.error(`[${hookName}] ${message}`, error, ...args)
  }),

  /**
   * Logger pour module/utilitaire spécifique
   */
  module: (moduleName) => ({
    debug: (message, ...args) => logger.debug(`[${moduleName}] ${message}`, ...args),
    info: (message, ...args) => logger.info(`[${moduleName}] ${message}`, ...args),
    warn: (message, ...args) => logger.warn(`[${moduleName}] ${message}`, ...args),
    error: (message, error, ...args) => logger.error(`[${moduleName}] ${message}`, error, ...args)
  })
};

export default logger;

