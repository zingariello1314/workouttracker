/**
 * F7.0 — Coopération thread principal : yield + abort entre étapes lourdes.
 * Ne change aucun résultat analytique ; permet seulement d’interrompre entre chunks.
 */

export function makeRecapComputeAbort(reason = 'recap_compute_aborted') {
  const err = new Error(reason);
  err.name = 'RecapComputeAbort';
  return err;
}

export function isRecapComputeAbort(err) {
  return Boolean(err && err.name === 'RecapComputeAbort');
}

/**
 * @param {{ shouldAbort?: () => boolean, yieldFn?: () => Promise<void> }} coop
 */
export async function coopGate(coop = {}) {
  if (typeof coop.shouldAbort === 'function' && coop.shouldAbort()) {
    throw makeRecapComputeAbort();
  }
  if (typeof coop.yieldFn === 'function') {
    await coop.yieldFn();
  }
  if (typeof coop.shouldAbort === 'function' && coop.shouldAbort()) {
    throw makeRecapComputeAbort();
  }
}

/** Yield navigateur (rAF + macrotask) — libère le thread pour clics / React. */
export function browserYieldFrame() {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => {
        setTimeout(resolve, 0);
      });
    } else {
      setTimeout(resolve, 0);
    }
  });
}
