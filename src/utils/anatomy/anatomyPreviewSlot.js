/**
 * Limite les aperçus WebGL actifs sur les grilles banque (évite « Too many WebGL contexts »).
 * Les cartes hors viewport libèrent leur slot ; les cartes en attente sont réveillées à chaque release.
 */

function resolveMaxActive() {
  if (typeof window === 'undefined') return 8;
  const coarse =
    typeof navigator !== 'undefined' ? Number(navigator.hardwareConcurrency) || 4 : 4;
  const narrow = window.innerWidth < 640;
  if (narrow) return Math.min(6, Math.max(4, coarse - 2));
  return Math.min(12, Math.max(8, coarse));
}

let maxActive = resolveMaxActive();
const waiters = new Set();
let active = 0;

function notifyWaiters() {
  if (active >= maxActive || waiters.size === 0) return;
  const snapshot = [...waiters];
  for (const fn of snapshot) {
    try {
      fn();
    } catch {
      /* ignore */
    }
    if (active >= maxActive) break;
  }
}

export function getAnatomyPreviewSlotLimit() {
  return maxActive;
}

/** À appeler après resize (optionnel) pour adapter la limite. */
export function refreshAnatomyPreviewSlotLimit() {
  maxActive = resolveMaxActive();
  notifyWaiters();
}

export function registerAnatomyPreviewWaiter(fn) {
  if (typeof fn !== 'function') return;
  waiters.add(fn);
}

export function unregisterAnatomyPreviewWaiter(fn) {
  waiters.delete(fn);
}

export function tryAcquireAnatomyPreviewSlot() {
  if (active >= maxActive) return false;
  active += 1;
  return true;
}

export function releaseAnatomyPreviewSlot() {
  active = Math.max(0, active - 1);
  notifyWaiters();
}

export function getAnatomyPreviewSlotDebug() {
  return { active, max: maxActive, waiting: waiters.size };
}

if (typeof window !== 'undefined') {
  let resizeT;
  window.addEventListener(
    'resize',
    () => {
      clearTimeout(resizeT);
      resizeT = window.setTimeout(() => refreshAnatomyPreviewSlotLimit(), 400);
    },
    { passive: true }
  );
}
