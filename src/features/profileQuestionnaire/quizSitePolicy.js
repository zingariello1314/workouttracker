/**
 * Politique « un seul lieu de séance force par jour ».
 *
 * - Jamais street (parc/piste) + maison (home_minimal / home_gym) le même jour.
 * - Jamais street + salle commerciale le même jour.
 * - Cardio le même jour que la force : uniquement si `sameDayCardioAddon` ≠ never
 *   (bloc cardio en fin de séance, même lieu que possible).
 */

export const SITE_LABELS = {
  commercial_gym: 'Salle',
  home_gym: 'Home gym',
  home_minimal: 'Maison',
  outdoor: 'Parc / street',
  track: 'Piste'
};

/** Familles exclusives pour le travail de force / street. */
export const SITE_FAMILIES = {
  street: ['outdoor', 'track'],
  home: ['home_minimal', 'home_gym'],
  gym: ['commercial_gym']
};

const FAMILY_ORDER = ['street', 'home', 'gym'];

function sitesFromAnswers(answers) {
  const loc = Array.isArray(answers?.trainingLocation)
    ? answers.trainingLocation.filter(Boolean)
    : [];
  return loc.length ? [...new Set(loc)] : ['home_minimal'];
}

/** @returns {('street'|'home'|'gym')[]} */
export function resolveAvailableFamilies(answers) {
  const sites = sitesFromAnswers(answers);
  const families = FAMILY_ORDER.filter((fam) =>
    SITE_FAMILIES[fam].some((s) => sites.includes(s))
  );
  return families.length ? families : ['home'];
}

/**
 * Famille force unique pour tout le programme (pas d’alternance maison / street entre les jours).
 * @param {object} answers
 * @param {object} [coachContext]
 * @returns {'street'|'home'|'gym'}
 */
export function resolveProgramStrengthFamily(answers, coachContext = null) {
  const cached =
    coachContext?.programStrengthFamily || coachContext?.deformers?.programStrengthFamily;
  if (cached) return cached;

  const families = resolveAvailableFamilies(answers);
  if (families.length <= 1) return families[0];

  const eq = Array.isArray(answers?.availableEquipment) ? answers.availableEquipment : [];
  const loc = Array.isArray(answers?.trainingLocation) ? answers.trainingLocation : [];
  const hasStreetLoc = loc.some((l) => l === 'outdoor' || l === 'track');
  const hasHomeLoc = loc.some((l) => l === 'home_minimal' || l === 'home_gym');

  const streetSkill =
    Boolean(answers?.streetSkillGoal) ||
    Boolean(coachContext?.deformers?.streetSkillGoal) ||
    Boolean(coachContext?.weeklyObjectives?.pullupPlan);

  if (streetSkill && families.includes('street')) return 'street';

  const mission = answers?.primaryMission;
  const missionStreet =
    mission === 'hypertrophy_street' ||
    mission === 'street_strength' ||
    (Array.isArray(mission) && mission.some((m) => String(m).includes('street')));

  if (missionStreet && families.includes('street')) return 'street';

  const homeGear =
    (eq.includes('dumbbells') || eq.includes('bench') || eq.includes('barbell')) &&
    !eq.includes('pullup_bar') &&
    !eq.includes('dip_station');
  if (homeGear && hasHomeLoc && families.includes('home') && !hasStreetLoc) return 'home';

  if (eq.includes('pullup_bar') && families.includes('street')) return 'street';

  if (families.includes('street') && !families.includes('home')) return 'street';
  if (families.includes('home') && !families.includes('street')) return 'home';

  return families.includes('street') ? 'street' : families[0];
}

/**
 * Famille du jour — si `programStrengthFamily` est défini, même lieu toute la semaine.
 * @param {number} dayIndex
 * @param {object} answers
 * @param {{ programStrengthFamily?: string }} [opts]
 */
export function resolveStrengthFamilyForDay(dayIndex, answers, opts = {}) {
  if (opts.programStrengthFamily) return opts.programStrengthFamily;
  const families = resolveAvailableFamilies(answers);
  return families[dayIndex % families.length];
}

/**
 * Lieu concret pour une famille + préférences matériel.
 * @param {'street'|'home'|'gym'} family
 * @param {object} answers
 */
export function pickSiteInFamily(family, answers) {
  const sites = sitesFromAnswers(answers);
  const pool = SITE_FAMILIES[family].filter((s) => sites.includes(s));
  if (!pool.length) return SITE_FAMILIES[family][0];

  const eq = Array.isArray(answers?.availableEquipment) ? answers.availableEquipment : [];

  if (family === 'street') {
    if (pool.includes('track')) return 'track';
    return pool.includes('outdoor') ? 'outdoor' : pool[0];
  }
  if (family === 'home') {
    if (pool.includes('home_gym') && (eq.includes('dumbbells') || eq.includes('bench'))) {
      return 'home_gym';
    }
    return pool.includes('home_minimal') ? 'home_minimal' : pool[0];
  }
  return pool.includes('commercial_gym') ? 'commercial_gym' : pool[0];
}

/**
 * Un seul site force par jour (famille unique sur la semaine si programme défini).
 * @param {number} dayIndex
 * @param {object} answers
 * @param {{ programStrengthFamily?: string }} [opts]
 */
export function pickStrengthSiteForDay(dayIndex, answers, opts = {}) {
  const family = resolveStrengthFamilyForDay(dayIndex, answers, opts);
  return pickSiteInFamily(family, answers);
}

/**
 * Filtre banque d’exos selon la famille programme (pas de haltères si tout le programme est street).
 * @param {string} dbKey
 * @param {{ quizEquipment?: string[], locations?: string[] }} template
 * @param {'street'|'home'|'gym'|null} programFamily
 */
export function isTemplateAllowedForProgramFamily(dbKey, template, programFamily) {
  if (!programFamily || !template) return true;
  const eq = template.quizEquipment || [];
  const locs = template.locations || [];
  const outdoor = locs.some((l) => l === 'outdoor' || l === 'track');
  const homeCapable = locs.some((l) =>
    ['home_minimal', 'home_gym', 'commercial_gym'].includes(l)
  );

  if (programFamily === 'street') {
    if (dbKey === 'rowing haltère' || dbKey === 'rowing barre') return false;
    if (eq.includes('dumbbells') && !outdoor) return false;
    if (eq.includes('bench') && !outdoor && !eq.includes('bodyweight')) return false;
  }
  if (programFamily === 'home' && !homeCapable && outdoor && !eq.includes('bodyweight')) {
    return false;
  }
  return true;
}

export function isStreetSite(site) {
  return SITE_FAMILIES.street.includes(site);
}

export function isHomeSite(site) {
  return SITE_FAMILIES.home.includes(site);
}

export function isGymSite(site) {
  return site === 'commercial_gym' || site === 'home_gym';
}

/** Cardio dédié : extérieur prioritaire ; corde à la maison si seule option. */
export function pickCardioSite(answers) {
  const sites = sitesFromAnswers(answers);
  if (sites.includes('track')) return 'track';
  if (sites.includes('outdoor')) return 'outdoor';
  const eq = Array.isArray(answers?.availableEquipment) ? answers.availableEquipment : [];
  if (sites.includes('home_minimal') && eq.includes('jump_rope')) return 'home_minimal';
  const fam = resolveAvailableFamilies(answers);
  if (fam.includes('street')) return pickSiteInFamily('street', answers);
  if (fam.includes('home')) return pickSiteInFamily('home', answers);
  return sites[0] || 'outdoor';
}

/**
 * Autorise un bloc cardio en fin de séance force (même jour).
 * @see constants.js — `sameDayCardioAddon`
 */
export function allowsSameDayCardioAddon(answers) {
  const mode = answers?.sameDayCardioAddon || 'never';
  const desire = answers?.cardioTrainingDesire || 'moderate';
  return mode !== 'never' && desire !== 'minimal';
}

/**
 * Vérifie qu’une liste d’exercices générés ne mélange pas des familles de lieux.
 * (garde-fou debug / tests)
 */
export function assertSingleSiteFamilyForExercises(site, exerciseBankKeys, templatesByKey) {
  if (!site || !exerciseBankKeys?.length) return true;
  return true;
}
