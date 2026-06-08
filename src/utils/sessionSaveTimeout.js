/** Délai max avant message « sauvegarde trop longue » (Aujourd'hui + Calendrier). */
export const SESSION_SAVE_TIMEOUT_MS = 25000;

/**
 * @param {Promise<unknown>} promise
 * @param {number} [timeoutMs]
 * @returns {Promise<unknown>}
 */
export function withSessionSaveTimeout(promise, timeoutMs = SESSION_SAVE_TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('SESSION_SAVE_TIMEOUT')), timeoutMs);
    }),
  ]);
}

export function isSessionSaveTimeoutError(error) {
  return error?.message === 'SESSION_SAVE_TIMEOUT';
}

const IDB_OPERATION_TIMEOUT_MS = 8000;

/**
 * Évite qu’une transaction IndexedDB bloquée fige l’UI indéfiniment.
 * @param {Promise<unknown>} promise
 * @param {number} [timeoutMs]
 */
export function withIdbOperationTimeout(promise, timeoutMs = IDB_OPERATION_TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('IDB_OPERATION_TIMEOUT')), timeoutMs);
    }),
  ]);
}
