/**
 * Logger centralisé — niveau via VITE_LOG_LEVEL (voir .env.example)
 * Par défaut en dev : warn → console beaucoup plus calme (plus de flood DEBUG/INFO).
 * Pour tout voir : VITE_LOG_LEVEL=debug
 */

/** Importance croissante : on affiche si importance(msg) >= seuil */
const IMPORTANCE = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

const SILENT = 999;

/**
 * Seuil minimum pour afficher un message (plus haut = moins de bruit).
 * debug=10 → tout | info=20 | warn=30 | error=40 | silent=rien
 */
const parseThreshold = () => {
  const raw = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_LOG_LEVEL)
    ? String(import.meta.env.VITE_LOG_LEVEL).toLowerCase().trim()
    : '';

  if (raw === 'debug' || raw === 'verbose') return IMPORTANCE.debug;
  if (raw === 'info') return IMPORTANCE.info;
  if (raw === 'warn' || raw === 'warning') return IMPORTANCE.warn;
  if (raw === 'error') return IMPORTANCE.error;
  if (raw === 'silent' || raw === 'none') return SILENT;

  // Défaut : console calme (warn + error seulement), en dev comme en prod
  return IMPORTANCE.warn;
};

const threshold = parseThreshold();

const shouldShow = (level) => level >= threshold;

/**
 * Logger principal
 */
const logger = {
  debug: (message, ...args) => {
    if (shouldShow(IMPORTANCE.debug)) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },

  info: (message, ...args) => {
    if (shouldShow(IMPORTANCE.info)) {
      console.info(`[INFO] ${message}`, ...args);
    }
  },

  warn: (message, ...args) => {
    if (shouldShow(IMPORTANCE.warn)) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },

  error: (message, error = null, ...args) => {
    if (shouldShow(IMPORTANCE.error)) {
      if (error instanceof Error) {
        console.error(`[ERROR] ${message}`, error, ...args);
      } else {
        console.error(`[ERROR] ${message}`, error, ...args);
      }
    }
  },

  component: (componentName) => ({
    debug: (message, ...args) => logger.debug(`[${componentName}] ${message}`, ...args),
    info: (message, ...args) => logger.info(`[${componentName}] ${message}`, ...args),
    warn: (message, ...args) => logger.warn(`[${componentName}] ${message}`, ...args),
    error: (message, err, ...args) => logger.error(`[${componentName}] ${message}`, err, ...args)
  }),

  hook: (hookName) => ({
    debug: (message, ...args) => logger.debug(`[${hookName}] ${message}`, ...args),
    info: (message, ...args) => logger.info(`[${hookName}] ${message}`, ...args),
    warn: (message, ...args) => logger.warn(`[${hookName}] ${message}`, ...args),
    error: (message, err, ...args) => logger.error(`[${hookName}] ${message}`, err, ...args)
  }),

  module: (moduleName) => ({
    debug: (message, ...args) => logger.debug(`[${moduleName}] ${message}`, ...args),
    info: (message, ...args) => logger.info(`[${moduleName}] ${message}`, ...args),
    warn: (message, ...args) => logger.warn(`[${moduleName}] ${message}`, ...args),
    error: (message, err, ...args) => logger.error(`[${moduleName}] ${message}`, err, ...args)
  })
};

export default logger;
