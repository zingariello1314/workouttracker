/**
 * Agrégation journalière pour le calendrier des quêtes (teinte des cases = même modèle que le sport).
 * Jours sans aucune validation : blanc (composite01 = 0).
 * @module utils/questCalendarMetrics
 */

import { getQuestDureeMinutes } from './quests';

/** Objet intensité « neutre » compatible avec CalendarHeatmap / getDayColorStyle */
export function createNeutralQuestIntensity() {
  return {
    level: 0,
    reps: 0,
    trainingLoad: 0,
    strengthLoad: 0,
    duration: 0,
    exerciseCount: 0,
    completedCount: 0,
    intensityScore: 0,
    completionRate: 0,
    activeKcal: 0,
    kcalRefMedian: 0,
    steps: 0,
    stepsRefMedian: 0,
    intensityMinutesTotal: 0,
    visualContext: { composite01: 0, visualScore100: 0 },
    enduranceData: { reps: 0, duration: 0, distance: 0, jumps: 0, sessions: 0 },
    garminIcons: [],
    exercises: 0,
    session: null,
    questData: null,
  };
}

/**
 * @param {string} dateStr YYYY-MM-DD
 * @param {object} ctx
 * @param {Map<string, Array>} ctx.validationsByDate
 * @param {Array} [ctx.validations] - liste complète (pour scoring par validation)
 * @param {Array} ctx.allQuests
 * @param {(d: string) => Array} ctx.getQuestsForDate
 * @param {{ lat: number, lng: number }|null} [ctx.prayerLocation]
 */
export function computeQuestIntensityForDate(dateStr, ctx) {
  const neutral = createNeutralQuestIntensity();
  if (!dateStr || !ctx?.getQuestsForDate) return neutral;

  const validationsByDate = ctx.validationsByDate;
  const allQuests = ctx.allQuests || [];
  const scheduled = ctx.getQuestsForDate(dateStr) || [];
  const validationsOfDay = (validationsByDate && validationsByDate.get(dateStr)) || [];

  const questById = new Map(allQuests.map((q) => [q.id, q]));

  const completedIds = new Set(validationsOfDay.map((v) => v.queteId).filter(Boolean));
  const scheduledTotal = scheduled.length;
  const scheduledNotDone = scheduled.filter((q) => q?.id != null && !completedIds.has(q.id));

  const scheduledNotDonePayload = scheduledNotDone.map((q) => ({
    queteId: q.id,
    nom: q.nom || 'Quête',
    dureeMinutes: getQuestDureeMinutes(q),
  }));

  /** Aucune coche ce jour-là : case blanche (pas de teinte « jour chargé »). */
  if (validationsOfDay.length === 0) {
    return {
      ...neutral,
      exerciseCount: scheduledTotal,
      questData: {
        dateStr,
        xpTotal: 0,
        minutesOccupied: 0,
        completedCount: 0,
        completedUnique: 0,
        scheduledTotal,
        completedRows: [],
        scheduledNotDone: scheduledNotDonePayload,
      },
    };
  }

  let minutesOccupied = 0;
  let xpTotal = 0;
  const completedRows = [];

  for (const v of validationsOfDay) {
    if (!v || v.queteId == null) continue;
    const quest = questById.get(v.queteId);
    const dm = getQuestDureeMinutes(quest);
    minutesOccupied += dm;
    const xpv = Number(v.xpGagne) || 0;
    xpTotal += xpv;
    completedRows.push({
      queteId: v.queteId,
      nom: quest?.nom || 'Quête',
      dureeMinutes: dm,
      xp: xpv,
    });
  }

  const completedUnique = completedIds.size;

  const completionPct =
    scheduledTotal > 0 ? Math.round((completedUnique / scheduledTotal) * 100) : 100;

  /** Score pour le classement relatif mois/année (teinte des cases). */
  const intensityScore =
    xpTotal + minutesOccupied * 1.6 + completedUnique * 42 + validationsOfDay.length * 8;

  const questData = {
    dateStr,
    xpTotal,
    minutesOccupied,
    completedCount: validationsOfDay.length,
    completedUnique,
    scheduledTotal,
    completedRows,
    scheduledNotDone: scheduledNotDonePayload,
  };

  return {
    ...neutral,
    level: 0,
    duration: Math.round(minutesOccupied),
    completedCount: completedUnique,
    exerciseCount: scheduledTotal,
    completionRate: completionPct,
    intensityScore,
    trainingLoad: minutesOccupied,
    strengthLoad: xpTotal / 50,
    visualContext: {
      composite01: 0,
      visualScore100: 0,
    },
    questData,
  };
}

/**
 * XP total sur un mois (0–11) pour une année donnée.
 * @param {number} year
 * @param {number} monthIndex 0–11
 * @param {Map<string, Array>} validationsByDate
 */
export function sumQuestXpForMonth(year, monthIndex, validationsByDate) {
  if (!validationsByDate || typeof validationsByDate.forEach !== 'function') return 0;
  const y = String(year);
  const m = String(monthIndex + 1).padStart(2, '0');
  const prefix = `${y}-${m}-`;
  let sum = 0;
  validationsByDate.forEach((list, ds) => {
    if (!ds || !ds.startsWith(prefix)) return;
    for (const v of list || []) {
      sum += Number(v?.xpGagne) || 0;
    }
  });
  return sum;
}
