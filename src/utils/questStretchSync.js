/**
 * Synchronisation bidirectionnelle quêtes « Étirements » ↔ coches Sport (Aujourd’hui).
 *
 * Règles :
 * - Quête liée + plage matin/midi/soir → cochée quand tous les étirements de ce créneau le sont.
 * - Quête liée sans plage sport (heure précise, nuit, après-midi…) → cochée seulement si
 *   matin, midi et soir prévus sont entièrement cochés.
 *
 * @module questStretchSync
 */

import { generateStretchItemKey } from './exerciseKeyGenerator';
import { getDateStr } from './dateUtils';
import { normalizeStretchSlots, STRETCH_MOMENTS } from './stretchUtils';

export const STRETCH_QUEST_CATEGORY = 'Étirements';
export const STRETCH_SYNC_ORIGIN = 'today-stretch';

/** Créneaux quête alignés sur les moments d’étirements du programme. */
export const STRETCH_QUEST_SCOPED_CRENEAUX = ['matin', 'midi', 'soir'];

/**
 * @param {Object} quest
 * @returns {'matin'|'midi'|'soir'|'all'|null}
 */
export function questStretchMomentScope(quest) {
  if (!quest || quest.completeWithTodaySportStretch !== true) return null;
  if (quest.categorie !== STRETCH_QUEST_CATEGORY) return null;
  if (
    quest.heureType === 'creneau' &&
    STRETCH_QUEST_SCOPED_CRENEAUX.includes(quest.creneau)
  ) {
    return quest.creneau;
  }
  return 'all';
}

export function isStretchLinkedQuest(quest) {
  return questStretchMomentScope(quest) != null;
}

function isItemChecked(checkedStretches, dateStr, moment, stretchId) {
  const key = generateStretchItemKey(dateStr, moment, stretchId);
  return checkedStretches?.[key] === true;
}

/**
 * @param {string} moment
 * @param {Array<{ id: string|number }>} items
 * @param {Object} checkedStretches
 * @param {string} dateStr
 */
export function isStretchMomentFullyChecked(moment, items, checkedStretches, dateStr) {
  if (!items || items.length === 0) return false;
  return items.every((it) => isItemChecked(checkedStretches, dateStr, moment, it.id));
}

/**
 * @param {Object} slots - normalizeStretchSlots()
 * @param {Object} checkedStretches
 * @param {string} dateStr
 * @param {'matin'|'midi'|'soir'|'all'} scope
 */
export function isStretchScopeFullyChecked(slots, checkedStretches, dateStr, scope) {
  if (scope === 'all') {
    let anyPlanned = false;
    for (const m of STRETCH_MOMENTS) {
      const items = slots[m] || [];
      if (items.length === 0) continue;
      anyPlanned = true;
      if (!isStretchMomentFullyChecked(m, items, checkedStretches, dateStr)) {
        return false;
      }
    }
    return anyPlanned;
  }
  const items = slots[scope] || [];
  return isStretchMomentFullyChecked(scope, items, checkedStretches, dateStr);
}

/**
 * @param {Object} quest
 * @param {Object} slots
 * @param {Object} checkedStretches
 * @param {string} dateStr
 */
export function shouldStretchLinkedQuestBeCompleted(quest, slots, checkedStretches, dateStr) {
  const scope = questStretchMomentScope(quest);
  if (!scope) return false;
  return isStretchScopeFullyChecked(slots, checkedStretches, dateStr, scope);
}

/**
 * Met à jour les validations des quêtes liées selon l’état des étirements.
 */
export function syncStretchLinkedQuests({
  date,
  dataSnapshot,
  allQuests,
  prayerLocation,
  isQuestCompletedOnDate,
  toggleQuestValidation,
  getQuestsForDate: getQuestsForDateFn,
  resolvedEtirements,
  effectiveStretchDay,
}) {
  const calendarDateStr = getDateStr(date);
  if (!calendarDateStr || !Array.isArray(allQuests) || allQuests.length === 0) return;

  const slots = normalizeStretchSlots(resolvedEtirements, effectiveStretchDay);
  const checked = dataSnapshot?.checkedStretches || {};
  const todays = getQuestsForDateFn(allQuests, calendarDateStr, prayerLocation);
  const idsToday = new Set(todays.map((q) => q.id));

  for (const q of allQuests) {
    if (!isStretchLinkedQuest(q) || !idsToday.has(q.id)) continue;
    const shouldComplete = shouldStretchLinkedQuestBeCompleted(q, slots, checked, calendarDateStr);
    const completed = isQuestCompletedOnDate(q.id, calendarDateStr);
    if (shouldComplete && !completed) {
      toggleQuestValidation(q.id, calendarDateStr, { origin: STRETCH_SYNC_ORIGIN });
    } else if (!shouldComplete && completed) {
      toggleQuestValidation(q.id, calendarDateStr, { origin: STRETCH_SYNC_ORIGIN });
    }
  }
}

/**
 * Applique une validation quête → coches étirements (items individuels).
 * @returns {Object|null} patch checkedStretches ou null si rien à faire
 */
export function buildStretchCheckedPatchFromQuest(quest, slots, date, completed) {
  const scope = questStretchMomentScope(quest);
  if (!scope) return null;
  const dateStr = getDateStr(date);
  const moments = scope === 'all' ? STRETCH_MOMENTS : [scope];
  const patch = {};
  let touched = false;

  for (const m of moments) {
    for (const item of slots[m] || []) {
      const key = generateStretchItemKey(dateStr, m, item.id);
      patch[key] = completed === true;
      touched = true;
    }
  }
  return touched ? patch : null;
}

/**
 * Fusionne le patch dans un snapshot workout ; retire les étoiles si décoché.
 */
export function mergeStretchSnapshotWithQuestPatch(dataSnapshot, patch, completed) {
  if (!patch || Object.keys(patch).length === 0) return dataSnapshot;
  const nextChecked = { ...(dataSnapshot.checkedStretches || {}), ...patch };
  const nextStars = { ...(dataSnapshot.stretchSessionEffortStars || {}) };
  if (completed !== true) {
    for (const key of Object.keys(patch)) {
      delete nextStars[key];
    }
  }
  return {
    ...dataSnapshot,
    checkedStretches: nextChecked,
    stretchSessionEffortStars: nextStars,
  };
}

export function applyQuestValidationToStretchData({
  quest,
  completed,
  date,
  dataSnapshot,
  resolvedEtirements,
  effectiveStretchDay,
}) {
  if (!isStretchLinkedQuest(quest)) return dataSnapshot;
  const slots = normalizeStretchSlots(resolvedEtirements, effectiveStretchDay);
  const patch = buildStretchCheckedPatchFromQuest(quest, slots, date, completed);
  return mergeStretchSnapshotWithQuestPatch(dataSnapshot, patch, completed);
}
