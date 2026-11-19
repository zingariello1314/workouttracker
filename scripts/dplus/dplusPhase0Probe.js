/**
 * Sonde de phase 0. Aucun module de l'application ne l'importe.
 * Tant qu'elle n'est pas branchée, le chemin de sauvegarde de production est inchangé.
 *
 * Activation prévue, développement seulement, après autorisation de branchement :
 *   globalThis.__MOMENTUM_DPLUS_PHASE0 = true
 */
export function dplusPhase0Enabled() {
  return import.meta.env?.DEV === true && globalThis.__MOMENTUM_DPLUS_PHASE0 === true;
}

export function dplusMark(name) {
  if (!dplusPhase0Enabled() || typeof performance === 'undefined' || typeof performance.mark !== 'function') {
    return;
  }
  performance.mark(`dplus:${name}`);
}

export function dplusMeasure(name, start, end) {
  if (!dplusPhase0Enabled() || typeof performance === 'undefined' || typeof performance.measure !== 'function') {
    return null;
  }
  try {
    return performance.measure(`dplus:${name}`, `dplus:${start}`, `dplus:${end}`);
  } catch {
    return null;
  }
}
