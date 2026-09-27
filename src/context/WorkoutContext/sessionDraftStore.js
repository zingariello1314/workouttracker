/**
 * Brouillon séance (coches / reps / kg) hors du gros WorkoutContext.
 * Canal global : listes hors cartes. Canal par exercice : une carte.
 * Canal XP : barre / calcul différé.
 */
import { useSyncExternalStore } from 'react';

let version = 0;
let xpVersion = 0;
let commitEpoch = 0;
let commitDirty = { exercises: false, stretches: false };
const listeners = new Set();
const xpListeners = new Set();
const commitDirtyListeners = new Set();
const commitEpochListeners = new Set();
const exerciseVersions = new Map();
const exerciseListeners = new Map();
let bumpInFlight = false;

export function subscribeSessionDraft(onStoreChange) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

export function subscribeSessionDraftXp(onStoreChange) {
  xpListeners.add(onStoreChange);
  return () => xpListeners.delete(onStoreChange);
}

export function subscribeSessionCommitDirty(onStoreChange) {
  commitDirtyListeners.add(onStoreChange);
  return () => commitDirtyListeners.delete(onStoreChange);
}

export function subscribeSessionCommitEpoch(onStoreChange) {
  commitEpochListeners.add(onStoreChange);
  return () => commitEpochListeners.delete(onStoreChange);
}

function subscribeExerciseUi(exerciseId, onStoreChange) {
  const id = String(exerciseId ?? '');
  let set = exerciseListeners.get(id);
  if (!set) {
    set = new Set();
    exerciseListeners.set(id, set);
  }
  set.add(onStoreChange);
  return () => {
    set.delete(onStoreChange);
    if (set.size === 0) exerciseListeners.delete(id);
  };
}

export function getSessionDraftVersion() {
  return version;
}

export function getSessionDraftXpVersion() {
  return xpVersion;
}

export function getSessionCommitDirty() {
  return commitDirty;
}

export function getSessionCommitEpoch() {
  return commitEpoch;
}

export function setSessionCommitDirty(partial) {
  const next = { ...commitDirty, ...partial };
  if (next.exercises === commitDirty.exercises && next.stretches === commitDirty.stretches) return;
  commitDirty = next;
  notify(commitDirtyListeners);
}

export function bumpSessionCommitEpoch() {
  commitEpoch += 1;
  notify(commitEpochListeners);
}

export function getExerciseUiVersion(exerciseId) {
  return exerciseVersions.get(String(exerciseId ?? '')) || 0;
}

function notify(set) {
  if (!set || set.size === 0) return;
  set.forEach((listener) => {
    try {
      listener();
    } catch {
      /* ignore */
    }
  });
}

export function bumpExerciseUi(exerciseId) {
  const id = String(exerciseId ?? '');
  if (!id) return;
  exerciseVersions.set(id, (exerciseVersions.get(id) || 0) + 1);
  notify(exerciseListeners.get(id));
}

export function notifySessionDraftXp() {
  xpVersion += 1;
  notify(xpListeners);
}

export function bumpSessionDraft(options = {}) {
  if (bumpInFlight) return;
  bumpInFlight = true;
  try {
    version += 1;
    notify(listeners);
    if (options.urgentXp) {
      xpVersion += 1;
      notify(xpListeners);
    }
  } finally {
    bumpInFlight = false;
  }
}

export function useSessionDraftVersion() {
  return useSyncExternalStore(subscribeSessionDraft, getSessionDraftVersion, getSessionDraftVersion);
}

export function useExerciseUiVersion(exerciseId) {
  const id = String(exerciseId ?? '');
  return useSyncExternalStore(
    (onStoreChange) => subscribeExerciseUi(id, onStoreChange),
    () => getExerciseUiVersion(id),
    () => getExerciseUiVersion(id)
  );
}

export function useSessionCommitDirty() {
  return useSyncExternalStore(subscribeSessionCommitDirty, getSessionCommitDirty, getSessionCommitDirty);
}

export function useSessionCommitEpoch() {
  return useSyncExternalStore(subscribeSessionCommitEpoch, getSessionCommitEpoch, getSessionCommitEpoch);
}
