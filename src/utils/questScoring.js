/**
 * Score dynamique des quêtes : fréquence (anti-spam), relance (écart entre validations),
 * rareté du type (moins de jours prévus → léger bonus), difficulté.
 * @module utils/questScoring
 */

import { calculateQuestXP, isQuestEveryDayRecurrent } from './questXpCore';
import { addCalendarDays, parseLocalCalendarDate } from './dateUtils';

export function expectedWeeklySlots(quest) {
  if (!quest || quest.type === 'exceptionnelle') return 1;
  const j = Array.isArray(quest.jours) ? quest.jours.length : 0;
  return Math.max(1, Math.min(7, j || 1));
}

function countInWindow(validations, questId, endExclusive, daysBack) {
  const start = addCalendarDays(endExclusive, -daysBack);
  let n = 0;
  for (const v of validations || []) {
    if (!v || v.queteId !== questId || !v.date) continue;
    if (v.date <= start) continue;
    if (v.date >= endExclusive) continue;
    n++;
  }
  return n;
}

export function lastCompletionDateBefore(validations, questId, beforeDateStr) {
  let best = null;
  for (const v of validations || []) {
    if (!v || v.queteId !== questId || !v.date) continue;
    if (v.date >= beforeDateStr) continue;
    if (!best || v.date > best) best = v.date;
  }
  return best;
}

export function daysBetweenCalendarDates(aStr, bStr) {
  const a = parseLocalCalendarDate(aStr);
  const b = parseLocalCalendarDate(bStr);
  if (!a || !b) return 0;
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

/**
 * Multiplicateur d'activité pour XP et teinte calendrier.
 * @param {object} quest
 * @param {Array} validationsSnapshot - validations « autres » que la ligne courante (même jour inclus si on exclut la ligne)
 * @param {string} completionDateStr
 */
export function computeQuestActivityMultiplier(quest, validationsSnapshot, completionDateStr) {
  if (!quest) return 1;
  const questId = quest.id;
  const n7 = countInWindow(validationsSnapshot, questId, completionDateStr, 7);
  const n30 = countInWindow(validationsSnapshot, questId, completionDateStr, 30);
  const n365 = countInWindow(validationsSnapshot, questId, completionDateStr, 365);

  const wSlots = expectedWeeklySlots(quest);
  const expectedApproxWeek = Math.max(1, Math.min(7, wSlots));
  const intensityRatio = (n7 + 1) / (expectedApproxWeek + 2);
  const spamPenalty =
    1 /
    (1 +
      0.2 * Math.max(0, intensityRatio - 1) +
      0.045 * Math.max(0, n30 - expectedApproxWeek * 4) +
      0.012 * Math.max(0, n365 - expectedApproxWeek * 40));

  const prev = lastCompletionDateBefore(validationsSnapshot, questId, completionDateStr);
  const gap = prev ? daysBetweenCalendarDates(prev, completionDateStr) : null;
  const relanceBonus = gap == null ? 1.12 : 1 + Math.min(0.42, (Math.min(gap, 50) / 50) * 0.42);

  const rarityType = quest.type === 'exceptionnelle' ? 1.1 : 1 + 0.05 * ((7 - wSlots) / 6);

  const diff = Math.max(1, Math.min(4, Math.round(Number(quest.difficulte) || 1)));
  const diffNorm = 0.82 + diff * 0.095;

  let m = diffNorm * spamPenalty * relanceBonus * rarityType;
  m = Math.max(0.32, Math.min(2.45, m));
  return m;
}

function countPriorCompletionsForQuest(validationsSnapshot, questId) {
  if (!questId) return 0;
  let n = 0;
  for (const v of validationsSnapshot || []) {
    if (v && v.queteId === questId) n += 1;
  }
  return n;
}

/**
 * Bonus fidélité pour les quêtes récurrentes 7j/7 : augmente avec le nombre de validations
 * déjà enregistrées pour cette quête (habitude « tous les jours »).
 */
export function everyDayRecurrentLoyaltyBonusXp(quest, validationsSnapshot) {
  if (!isQuestEveryDayRecurrent(quest)) return 0;
  const prior = countPriorCompletionsForQuest(validationsSnapshot, quest.id);
  return Math.min(34, Math.round(5 + 3.3 * Math.sqrt(prior)));
}

export function computeValidationXpAward(quest, validationsSnapshot, completionDateStr) {
  const base = quest.xp ?? calculateQuestXP(quest);
  const mult = computeQuestActivityMultiplier(quest, validationsSnapshot, completionDateStr);
  const core = Math.round(base * mult);
  const loyalty = everyDayRecurrentLoyaltyBonusXp(quest, validationsSnapshot);
  return Math.max(50, Math.min(5040, core + loyalty));
}

/** Contribution 0–1 pour une validation (heatmap), cohérente avec le multiplicateur actuel */
export function computeQuestHeatContribution01(quest, validationsSnapshot, completionDateStr) {
  const base = Math.max(0.08, (quest.xp ?? calculateQuestXP(quest)) / 5000);
  const mult = computeQuestActivityMultiplier(quest, validationsSnapshot, completionDateStr);
  return Math.min(1, base * mult * 0.62);
}
