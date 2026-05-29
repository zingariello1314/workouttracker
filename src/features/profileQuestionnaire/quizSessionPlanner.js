/**
 * Profils de séance par jour : lieu unique, modalité (force / cardio / force+cardio),
 * ciblage muscle — cohérent avec les réponses quiz.
 */

import { getSessionBudget, formatSessionDurationLabel } from './quizSessionDurationBudget';

const SITE_LABELS = {
  commercial_gym: 'Salle',
  home_gym: 'Home gym',
  home_minimal: 'Maison',
  outdoor: 'Parc / street',
  track: 'Piste'
};

const HOME_SITES = new Set(['home_minimal', 'home_gym']);
const STREET_SITES = new Set(['outdoor', 'track']);
const GYM_SITES = new Set(['commercial_gym', 'home_gym']);

/** Jours dédiés cardio (1 → 5 max) selon `cardioTrainingDesire`, plafonné par les jours actifs. */
function maxDedicatedCardioDays(activeCount, cardioDesire) {
  if (activeCount <= 0) return 0;
  const desireMap = {
    minimal: 1,
    light: 2,
    moderate: 3,
    high: 4,
    priority_hiit: 5
  };
  const target = desireMap[cardioDesire] ?? desireMap.moderate;
  return Math.min(activeCount, Math.max(1, target));
}

function resolveTrainingSites(answers) {
  const loc = Array.isArray(answers?.trainingLocation)
    ? answers.trainingLocation.filter(Boolean)
    : [];
  if (loc.length) return [...new Set(loc)];
  return ['home_minimal'];
}

function hasPullupBar(answers) {
  const eq = Array.isArray(answers?.availableEquipment) ? answers.availableEquipment : [];
  return eq.includes('pullup_bar');
}

function hasJumpRope(answers) {
  const eq = Array.isArray(answers?.availableEquipment) ? answers.availableEquipment : [];
  return eq.includes('jump_rope');
}

function pickCardioSite(sites, answers) {
  if (sites.includes('track')) return 'track';
  if (sites.includes('outdoor')) return 'outdoor';
  if (sites.includes('home_minimal') && hasJumpRope(answers)) return 'home_minimal';
  return sites.find((s) => STREET_SITES.has(s)) || sites[0] || 'outdoor';
}

/**
 * Alterne les lieux compatibles : jamais maison + parc le même jour.
 * Si un seul lieu → toujours ce lieu.
 */
function pickStrengthSiteForDay(sites, dayIndex, answers) {
  const home = sites.filter((s) => HOME_SITES.has(s));
  const street = sites.filter((s) => STREET_SITES.has(s));
  const gym = sites.filter((s) => s === 'commercial_gym');

  if (home.length && street.length) {
    return dayIndex % 2 === 0 ? home[0] : street[0];
  }
  if (gym.length && !home.length && !street.length) return gym[dayIndex % gym.length];
  if (street.length && !home.length) return street[dayIndex % street.length];
  if (home.length) return home[dayIndex % home.length];
  return sites[dayIndex % sites.length] || 'home_minimal';
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

/** Un seul bloc muscle principal par jour pour éviter 3 séances identiques. */
function groupsForDayIndex(muscleGroups, dayIndex) {
  if (!muscleGroups.length) return ['upper'];
  return [muscleGroups[dayIndex % muscleGroups.length]];
}

function addonCardioDayCount(activeCount, answers) {
  const mode = answers?.sameDayCardioAddon || 'never';
  const desire = answers?.cardioTrainingDesire || 'moderate';
  if (mode === 'never' || desire === 'minimal') return 0;
  if (mode === 'often') return Math.min(activeCount, Math.ceil(activeCount * 0.5));
  return Math.min(activeCount, Math.max(1, Math.ceil(activeCount * 0.35)));
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
export function planWeekSessionProfiles(activeDayKeys, answers) {
  const sites = resolveTrainingSites(answers);
  const n = activeDayKeys.length;
  const cardioDesire = answers?.cardioTrainingDesire || 'moderate';
  const dedicatedCardioSlots = maxDedicatedCardioDays(n, cardioDesire);
  const muscleGroups = muscleRotationGroups(answers);
  const addonSlots = addonCardioDayCount(n, answers);

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

  const profiles = {};
  activeDayKeys.forEach((dayKey, dayIndex) => {
    if (cardioIndices.has(dayIndex)) {
      const site = pickCardioSite(sites, answers);
      profiles[dayKey] = {
        modality: 'cardio',
        site,
        groups: ['cardio'],
        cardioAddon: false,
        title: `Cardio — ${SITE_LABELS[site] || site}`,
        focus: 'Séance cardio dédiée (endurance, corde, intervalles selon matériel)',
        durationLabel: mainMinutesLabel(answers, false),
        allowCourseEndurance: true
      };
      return;
    }

    const site = pickStrengthSiteForDay(sites, dayIndex, answers);
    const groups = groupsForDayIndex(muscleGroups, dayIndex);
    const withAddon = addonSet.has(dayIndex);
    const siteLabel = SITE_LABELS[site] || site;
    const focusParts = groups.map((g) => {
      if (g === 'upper') return 'haut du corps';
      if (g === 'lower') return 'bas du corps';
      if (g === 'core') return 'gainage / core';
      return g;
    });

    let titlePrefix = 'Force';
    if (STREET_SITES.has(site)) titlePrefix = 'Street workout';
    else if (site === 'home_minimal') titlePrefix = 'Maison';
    else if (GYM_SITES.has(site)) titlePrefix = 'Musculation';

    profiles[dayKey] = {
      modality: withAddon ? 'strength_plus_cardio' : 'strength',
      site,
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

export { SITE_LABELS };
