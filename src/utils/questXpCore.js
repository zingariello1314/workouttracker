/**
 * Calcul d'XP de base des quêtes (difficulté × durée).
 * Extrait du moteur QuietQuest pour éviter les imports circulaires (scoring / calendrier).
 * @module utils/questXpCore
 */

import { getQuestDureeMinutes } from './quests';

export const DIFFICULTY_XP_BASE = {
  1: 250,
  2: 375,
  3: 500,
  4: 750,
};

export function calculateQuestXP(quest) {
  if (!quest) return 0;
  const base = DIFFICULTY_XP_BASE[quest.difficulte] || DIFFICULTY_XP_BASE[1];
  const d = getQuestDureeMinutes(quest);
  const multiplier = (d > 0 ? d : 60) / 60;
  return Math.round(base * multiplier);
}
