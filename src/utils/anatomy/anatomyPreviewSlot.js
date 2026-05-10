/**
 * Limite les aperçus WebGL actifs sur les grilles banque.
 *
 * Limite **réelle du navigateur** : ~8 contextes WebGL **pour tout l’onglet** (tous les Canvas confondus).
 * L’app monte en permanence `AnimatedBackground` (1 contexte) ; il faut donc rester très bas ici.
 */

const MOBILE_MAX = 4;
const DESKTOP_MAX = 6;

function resolveMaxActive() {
  if (typeof window === 'undefined') return DESKTOP_MAX;
  const narrow = window.innerWidth < 640;
  return narrow ? MOBILE_MAX : DESKTOP_MAX;
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
      resizeT = setTimeout(() => refreshAnatomyPreviewSlotLimit(), 400);
    },
    { passive: true }
  );
}
