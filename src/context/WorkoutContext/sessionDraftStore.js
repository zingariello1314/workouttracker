/**
 * Brouillon séance (coches / reps / kg) hors du gros WorkoutContext.
 * Évite de recalculer XP + tout l’arbre à chaque coche avant « Enregistrer ».
 */
import { useSyncExternalStore } from 'react';

let version = 0;
let xpNotifyDelayMs = 900;
const listeners = new Set();

export function subscribeSessionDraft(onStoreChange) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

export function getSessionDraftVersion() {
  return version;
}

export function getSessionDraftXpNotifyDelay() {
  return xpNotifyDelayMs;
}

export function bumpSessionDraft(options = {}) {
  version += 1;
  xpNotifyDelayMs = options.urgentXp ? 0 : 900;
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      /* ignore */
    }
  });
}

export function subscribeSessionDraft(onStoreChange) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

export function getSessionDraftVersion() {
  return version;
}

export function bumpSessionDraft() {
  version += 1;
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      /* ignore */
    }
  });
}

export function useSessionDraftVersion() {
  return useSyncExternalStore(subscribeSessionDraft, getSessionDraftVersion, getSessionDraftVersion);
}
