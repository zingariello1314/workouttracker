/**
 * Registre central des flush de persistance (déconnexion, fermeture d’onglet).
 * Chaque domaine enregistre une fonction async idempotente.
 */

const flushHandlers = new Set();

/**
 * @param {() => void | Promise<void>} fn
 * @returns {() => void} désinscription
 */
export function registerAppPersistenceFlush(fn) {
  if (typeof fn !== 'function') return () => {};
  flushHandlers.add(fn);
  return () => {
    flushHandlers.delete(fn);
  };
}

/** Force l’écriture de toutes les sauvegardes en attente. */
export async function flushAllAppPersistence() {
  const handlers = [...flushHandlers];
  if (handlers.length === 0) return;
  await Promise.allSettled(handlers.map((fn) => Promise.resolve().then(() => fn())));
}
