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

/** Yield navigateur (rAF + macrotask). Un onglet en arrière-plan ne bloque pas le calcul. */
export function browserYieldFrame() {
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    const hidden = typeof document !== 'undefined' && document.hidden;
    if (!hidden && typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => {
        setTimeout(finish, 0);
      });
    }
    setTimeout(finish, hidden ? 0 : 80);
  });
}
