/**
 * Cible grades « pompes tout court » + défis endurance + fusions synonymes.
 */

import { normalizeExerciseNameLabel, slugFromExerciseName } from './exerciseGradeNameNormalize';

/** Slugs name:… qui reçoivent les défis pompes (reps + grade). */
const PLAIN_PUSHUP_NAME_SLUGS = new Set(['pompes', 'pompes-classiques']);

/** Libellés affichés pour fiches pompes fusionnées. */
const CANONICAL_PUSHUP_LABELS = {
  pompes: 'Pompes',
  'pompes-classiques': 'Pompes',
  'pompes-inclinees': 'Pompes inclinées',
  'pompes-declinees': 'Pompes déclinées'
};

function normalizedPushupName(rawName) {
  return normalizeExerciseNameLabel(rawName);
}

function isPushupName(n) {
  return /pompe|push-up|pushup/.test(n);
}

function isInclinePushupName(n) {
  return isPushupName(n) && /incline/.test(n);
}

/**
 * Synonymes pompes → un seul slug catalogue.
 * @returns {string}
 */
export function canonicalPushupGradeNameSlug(rawName) {
  const slug = slugFromExerciseName(rawName);
  if (!slug) return slug;
  const n = normalizedPushupName(rawName);

  if (slug === 'pompes-declinees' || /^pompes-declinees-pieds-sur-/.test(slug)) {
    return 'pompes-declinees';
  }

  if (isInclinePushupName(n)) {
    return 'pompes-inclinees';
  }

  return slug;
}

export function canonicalPushupGradeDisplayLabel(catalogKey) {
  const k = String(catalogKey || '');
  if (!k.startsWith('name:')) return null;
  return CANONICAL_PUSHUP_LABELS[k.slice(5)] || null;
}

export function defaultPlainPushupsGradeCatalogKey() {
  return 'name:pompes';
}

export function catalogKeyReceivesPushupDefis(catalogKey) {
  const k = String(catalogKey || '');
  if (k === 'pushups' || k === 'pushups_classic') return true;
  if (!k.startsWith('name:')) return false;
  return PLAIN_PUSHUP_NAME_SLUGS.has(k.slice(5));
}

/** Poignées simples/tempo → fiche Pompes (pas gilet / lesté). */
export function exerciseRollsUpToPlainPushups(exerciseId, getExerciseNameById) {
  const rawName =
    typeof getExerciseNameById === 'function' ? getExerciseNameById(exerciseId) : '';
  const n = normalizedPushupName(rawName);
  if (!isPushupName(n)) return false;
  if (!/poignee|\bhandles\b|sur poign/.test(n)) return false;
  if (/gilet|lest|weighted|avec gilet/.test(n)) return false;
  return true;
}

export function enduranceAttachesToPushupCatalogKey(catalogKey) {
  return catalogKeyReceivesPushupDefis(catalogKey);
}

export function catalogKeyUsesPushupChannelBreakdown(catalogKey) {
  return catalogKeyReceivesPushupDefis(catalogKey);
}
