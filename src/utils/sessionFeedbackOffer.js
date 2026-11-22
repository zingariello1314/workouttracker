/**
 * Politique d’invitation Feedback après enregistrement (PC / Mobile).
 * Indépendante de l’UI : la présentation reste propre à chaque surface.
 */

import { isSessionFeedbackFilled } from './sessionFeedbackUtils.js';

export const SESSION_FEEDBACK_INVITE_STORAGE_KEY = 'momentum.sessionFeedback.invite.v1';

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function defaultSessionStorage() {
  if (typeof sessionStorage === 'undefined') return null;
  return sessionStorage;
}

/**
 * Prefs : absente ou true → ouverture auto autorisée.
 * @param {object|null|undefined} trainingPrefs
 * @returns {boolean}
 */
export function isSessionFeedbackAutoOpenEnabled(trainingPrefs) {
  if (!isPlainObject(trainingPrefs)) return true;
  return trainingPrefs.sessionFeedbackAutoOpen !== false;
}

/**
 * Exercices cochés du jour (maps Aujourd’hui), hors étirements.
 * @param {object|null|undefined} workoutData
 * @param {string} dateStr
 * @returns {number}
 */
export function countRelevantExercisesForDate(workoutData, dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return 0;
  const prefix = `${dateStr}_`;
  const checked = workoutData?.checkedExercises;
  let n = 0;
  if (checked && typeof checked === 'object') {
    for (const [key, value] of Object.entries(checked)) {
      if (key.startsWith(prefix) && value === true) n += 1;
    }
  }
  const additional = workoutData?.dailyVariations?.[dateStr]?.additionalExercises;
  if (Array.isArray(additional)) {
    for (const ex of additional) {
      if (ex && ex.completed === true) n += 1;
    }
  }
  return n;
}

/**
 * @param {object} args
 * @param {boolean} args.saveSucceeded
 * @param {boolean|number} args.hasRelevantExercises — bool ou compte
 * @param {object|null|undefined} args.existingFeedback
 * @param {boolean} [args.autoOpenEnabled=true]
 * @param {null|'offered'|'dismissed'} [args.invitationStatus]
 * @returns {{ offer: boolean, reason: string }}
 */
export function shouldOfferSessionFeedback({
  saveSucceeded,
  hasRelevantExercises,
  existingFeedback,
  autoOpenEnabled = true,
  invitationStatus = null
} = {}) {
  if (!saveSucceeded) {
    return { offer: false, reason: 'save_failed' };
  }
  if (autoOpenEnabled === false) {
    return { offer: false, reason: 'pref_disabled' };
  }
  const hasExercises =
    typeof hasRelevantExercises === 'number'
      ? hasRelevantExercises > 0
      : Boolean(hasRelevantExercises);
  if (!hasExercises) {
    return { offer: false, reason: 'no_exercises' };
  }
  if (isSessionFeedbackFilled(existingFeedback)) {
    return { offer: false, reason: 'feedback_exists' };
  }
  if (invitationStatus === 'offered' || invitationStatus === 'dismissed') {
    return { offer: false, reason: 'already_invited' };
  }
  return { offer: true, reason: 'eligible' };
}

function readInviteMap(storage) {
  if (!storage) return {};
  try {
    const raw = storage.getItem(SESSION_FEEDBACK_INVITE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return isPlainObject(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * @param {string} dateStr
 * @param {Storage|null} [storage]
 * @returns {null|'offered'|'dismissed'}
 */
export function readSessionFeedbackInvitation(dateStr, storage = defaultSessionStorage()) {
  if (!dateStr) return null;
  const map = readInviteMap(storage);
  const status = map[dateStr];
  if (status === 'offered' || status === 'dismissed') return status;
  return null;
}

/**
 * @param {string} dateStr
 * @param {'offered'|'dismissed'} status
 * @param {Storage|null} [storage]
 */
export function markSessionFeedbackInvitation(
  dateStr,
  status,
  storage = defaultSessionStorage()
) {
  if (!dateStr || (status !== 'offered' && status !== 'dismissed')) return;
  if (!storage) return;
  try {
    const map = readInviteMap(storage);
    map[dateStr] = status;
    storage.setItem(SESSION_FEEDBACK_INVITE_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Quota / mode privé : l’invitation pourra se répéter ; l’accès manuel reste.
  }
}
