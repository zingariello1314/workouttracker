/**
 * Calcul d'XP de base des quêtes (difficulté × durée).
 * Extrait du moteur QuietQuest pour éviter les imports circulaires (scoring / calendrier).
 * @module utils/questXpCore
 */

import { getQuestDureeMinutes } from './quests';

/**
 * XP pour 1 h de quête à cette difficulté (hors bonus d’activité).
 * Échelle : ~50 XP / h en diff. 1 → jusqu’à 5000 XP / h en diff. 4 (plafonné par validation dans questScoring).
 */
export const DIFFICULTY_XP_PER_HOUR = {
  1: 50,
  2: 420,
  3: 1500,
  4: 5000
};

/** @deprecated Nom historique — identique à DIFFICULTY_XP_PER_HOUR */
export const DIFFICULTY_XP_BASE = DIFFICULTY_XP_PER_HOUR;

export function calculateQuestXP(quest) {
  if (!quest) return 0;
  const diff = Math.max(1, Math.min(4, Math.round(Number(quest.difficulte) || 1)));
  const base = DIFFICULTY_XP_PER_HOUR[diff] || DIFFICULTY_XP_PER_HOUR[1];
  const d = getQuestDureeMinutes(quest);
  const multiplier = (d > 0 ? d : 60) / 60;
  const raw = Math.round(base * multiplier);
  return Math.max(50, Math.min(5000, raw));
}

const WEEK_DAYS = [1, 2, 3, 4, 5, 6, 7];

/** Quête récurrente prévue les 7 jours de la semaine (« Tous les jours » / même logique que les presets). */
export function isQuestEveryDayRecurrent(quest) {
  if (!quest || quest.type !== 'recurrente') return false;
  const j = quest.jours;
  if (!Array.isArray(j) || j.length < 7) return false;
  return WEEK_DAYS.every((d) => j.includes(d));
}
