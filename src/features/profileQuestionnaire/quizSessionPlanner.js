/**
 * Profils de séance par jour : lieu unique, modalité (force / cardio / force+cardio),
 * ciblage muscle — cohérent avec les réponses quiz.
 */

import { getSessionBudget, formatSessionDurationLabel } from './quizSessionDurationBudget';
import {
  SITE_LABELS,
  isGymSite,
  isHomeSite,
  isStreetSite,
  pickCardioSite,
  pickStrengthSiteForDay,
  resolveStrengthFamilyForDay
} from './quizSitePolicy';
import { resolveSameDayCardioFromDeformers } from './quizArchetype';

const HYPERTROPHY_GOALS = new Set(['muscular_defined', 'lean_toned', 'bulk_mass']);

/** Jours dédiés cardio (1 → 5 max) selon `cardioTrainingDesire`, plafonné par les jours actifs. */
function maxDedicatedCardioDays(activeCount, cardioDesire, deformers, answers = null) {
  if (activeCount <= 0) return 0;
  const desireMap = {
    minimal: 1,
    light: 2,
    moderate: 3,
    high: 4,
    priority_hiit: 5
  };
  let target = desireMap[cardioDesire] ?? desireMap.moderate;
  if (deformers?.maxDedicatedCardioDays != null) {
    target = Math.min(target, deformers.maxDedicatedCardioDays);
  }
  if (HYPERTROPHY_GOALS.has(answers?.goalPhysique) && activeCount >= 2) {
    target = Math.min(target, Math.max(1, Math.floor(activeCount / 2)));
    target = Math.min(target, activeCount - 1);
    if (activeCount <= 3) target = Math.min(target, 1);
  }
  return Math.min(activeCount, Math.max(1, target));
}


function muscleRotationGroups(answers) {
  const prio = Array.isArray(answers?.priorityMuscleGroups) ? answers.priorityMuscleGroups : [];
  const groups = [];
  const hasUpper =
    prio.includes('upper_body') ||
    prio.some((k) => ['chest', 'back', 'shoulders', 'biceps', 'triceps'].includes(k));
  const hasLower =
    prio.includes('lower_body') ||
    prio.some((k) => ['quads', 'hamstrings', 'glutes', 'calves'].includes(k));
  const hasCore = prio.includes('core');

  if (hasUpper) groups.push('upper');
  if (hasLower) groups.push('lower');
  if (hasCore) groups.push('core');
  if (!groups.length) groups.push('upper', 'lower', 'core');
  return groups;
}

/** upper / lower avant core quand peu de créneaux force. */
export function orderedMuscleGroups(answers) {
  const groups = muscleRotationGroups(answers);
  const order = ['upper', 'lower', 'core'];
  return order.filter((g) => groups.includes(g));
}

/**
 * Répartit upper / lower sur les jours force (pas sur l’index calendaire brut).
 * Évite upper–cardio–upper quand seuls upper+lower sont cochés (2 % 2 = upper ×2).
 */
export function buildStrengthGroupByDayIndex(n, answers, cardioIndices) {
  const ordered = orderedMuscleGroups(answers);
  if (!ordered.length) return new Map();

  const map = new Map();
  const strengthIndices = [];
  for (let i = 0; i < n; i += 1) {
    if (!cardioIndices.has(i)) strengthIndices.push(i);
  }
  strengthIndices.forEach((dayIdx, slot) => {
    map.set(dayIdx, [ordered[slot % ordered.length]]);
  });
  return map;
}

function addonCardioDayCount(activeCount, answers, deformers, dedicatedCardioSlots) {
  if (!resolveSameDayCardioFromDeformers(answers, deformers)) return 0;
  if (HYPERTROPHY_GOALS.has(answers?.goalPhysique) && dedicatedCardioSlots >= 1) return 0;
  const mode = answers?.sameDayCardioAddon || 'never';
  let slots = 0;
  if (mode === 'often') slots = Math.min(activeCount, Math.ceil(activeCount * 0.5));
  else slots = Math.min(activeCount, Math.max(1, Math.ceil(activeCount * 0.35)));
  if (HYPERTROPHY_GOALS.has(answers?.goalPhysique)) {
    slots = Math.min(slots, 1);
  }
  return slots;
}

export function addonMinutes(answers) {
  const budget = getSessionBudget(answers);
  return Math.max(10, Math.round(budget.targetMin / 2));
}

function mainMinutesLabel(answers, withAddon) {
  const budget = getSessionBudget(answers);
  const main = budget.targetMin;
  if (!withAddon) return `${main} min`;
  return `${main} min + ${addonMinutes(answers)} min cardio`;
}

/**
 * @param {string[]} activeDayKeys
 * @param {object} answers
 * @returns {Record<string, object>} profil par clé jour
 */
export function planWeekSessionProfiles(activeDayKeys, answers, coachContext = null) {
  const deformers = coachContext?.deformers || null;
  const n = activeDayKeys.length;
  const cardioDesire = answers?.cardioTrainingDesire || 'moderate';
  const dedicatedCardioSlots = maxDedicatedCardioDays(n, cardioDesire, deformers, answers);
  const addonSlots = addonCardioDayCount(n, answers, deformers, dedicatedCardioSlots);

  const cardioIndices = new Set();
  if (dedicatedCardioSlots > 0 && n > 0) {
    for (let i = 0; i < dedicatedCardioSlots; i += 1) {
      const idx =
        dedicatedCardioSlots === 1
          ? Math.floor((n - 1) / 2)
          : Math.round((i * (n - 1)) / Math.max(1, dedicatedCardioSlots - 1));
      cardioIndices.add(Math.min(n - 1, Math.max(0, idx)));
    }
  }

  const addonCandidates = activeDayKeys
    .map((k, i) => ({ k, i }))
    .filter(({ i }) => !cardioIndices.has(i));
  const addonSet = new Set();
  if (addonSlots > 0 && addonCandidates.length) {
    const step = Math.max(1, Math.floor(addonCandidates.length / addonSlots));
    for (let j = 0; j < addonSlots; j += 1) {
      const pick = addonCandidates[Math.min(addonCandidates.length - 1, j * step)];
      if (pick) addonSet.add(pick.i);
    }
  }

  const strengthGroupByDay = buildStrengthGroupByDayIndex(n, answers, cardioIndices);

  const profiles = {};
  activeDayKeys.forEach((dayKey, dayIndex) => {
    if (cardioIndices.has(dayIndex)) {
      const site = pickCardioSite(answers);
      profiles[dayKey] = {
        modality: 'cardio',
        site,
        siteFamily: 'cardio',
        groups: ['cardio'],
        cardioAddon: false,
        title: `Cardio — ${SITE_LABELS[site] || site}`,
        focus: 'Séance cardio dédiée (endurance, corde, intervalles selon matériel)',
        durationLabel: mainMinutesLabel(answers, false),
        allowCourseEndurance: true
      };
      return;
    }

    const siteFamily = resolveStrengthFamilyForDay(dayIndex, answers);
    const site = pickStrengthSiteForDay(dayIndex, answers);
    const groups = strengthGroupByDay.get(dayIndex) || ['upper'];
    const withAddon = addonSet.has(dayIndex) && resolveSameDayCardioFromDeformers(answers, deformers);
    const siteLabel = SITE_LABELS[site] || site;
    const focusParts = groups.map((g) => {
      if (g === 'upper') return 'haut du corps';
      if (g === 'lower') return 'bas du corps';
      if (g === 'core') return 'gainage / core';
      return g;
    });

    let titlePrefix = 'Force';
    if (isStreetSite(site)) titlePrefix = 'Street workout';
    else if (isHomeSite(site)) titlePrefix = 'Maison';
    else if (isGymSite(site)) titlePrefix = 'Musculation';

    profiles[dayKey] = {
      modality: withAddon ? 'strength_plus_cardio' : 'strength',
      site,
      siteFamily,
      groups,
      cardioAddon: withAddon,
      title: withAddon
        ? `${titlePrefix} + cardio — ${siteLabel}`
        : `${titlePrefix} — ${focusParts.join(' & ')}`,
      focus: withAddon
        ? `${focusParts.join(', ')} puis bloc cardio (~${addonMinutes(answers)} min)`
        : `Ciblage ${focusParts.join(' & ')} · ${formatSessionDurationLabel(answers)}`,
      durationLabel: mainMinutesLabel(answers, withAddon),
      allowCourseEndurance: false
    };
  });

  return profiles;
}

export function getSessionProfileForDay(weekProfiles, dayKey) {
  return weekProfiles?.[dayKey] || null;
}

export { SITE_LABELS } from './quizSitePolicy';
