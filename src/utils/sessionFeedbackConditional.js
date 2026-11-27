/**
 * Moteur de sélection des questions conditionnelles Feedback.
 * Pure, déterministe, indépendant de React.
 */

import {
  ACTIVE_CONDITIONAL_IDS,
  ANSWER_STATES,
  DISABLED_HISTORICAL_CONDITIONAL_IDS,
  getQuestion
} from './sessionFeedbackCatalog.js';

const EFFORT_HIGH = 8;
const EXPERIENCE_LOW = 3;
const ENERGY_LOW = 3;
const EFFORT_LOW = 4;

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function answeredValue(answers, id) {
  const cell = answers?.[id];
  if (!cell || cell.state !== ANSWER_STATES.ANSWERED) return undefined;
  return cell.value;
}

function isAnswered(answers, id) {
  return answeredValue(answers, id) !== undefined;
}

/**
 * Tags sémantiques déjà couverts par les réponses (anti-répétition).
 */
export function collectCoverageTags(answers) {
  const tags = new Set();
  const a = isPlainObject(answers) ? answers : {};

  const pain = answeredValue(a, 'pain_presence');
  if (pain === 'yes') tags.add('pain_declared');
  if (pain === 'no') tags.add('pain_absent');
  if (pain === 'declined') tags.add('pain_declined');

  const partial = answeredValue(a, 'session_partial_status');
  if (partial === 'still_in_progress') tags.add('partial_in_progress');
  if (partial === 'adapted') tags.add('session_adapted');
  if (partial === 'no_time') {
    tags.add('reason_time');
    tags.add('session_shortened');
  }
  if (partial === 'fatigue') {
    tags.add('reason_fatigue');
    tags.add('session_shortened');
  }
  if (partial === 'pain') {
    tags.add('reason_pain');
    tags.add('pain_declared');
    tags.add('session_shortened');
  }
  if (partial === 'no_equipment') {
    tags.add('reason_equipment');
    tags.add('session_shortened');
  }
  if (partial === 'other' || partial === 'unknown') tags.add('session_shortened');

  const adaptation = answeredValue(a, 'adaptation_reason');
  if (adaptation === 'fatigue') tags.add('reason_fatigue');
  if (adaptation === 'time') tags.add('reason_time');
  if (adaptation === 'pain') {
    tags.add('reason_pain');
    tags.add('pain_declared');
  }
  if (adaptation === 'recovery') tags.add('reason_recovery');
  if (adaptation === 'technique') tags.add('reason_technique');
  if (adaptation) tags.add('adaptation_explained');

  const effortReason = answeredValue(a, 'effort_demand_reason');
  if (effortReason) tags.add('effort_reason_known');
  if (effortReason === 'muscle_fatigue' || effortReason === 'general_fatigue') {
    tags.add('reason_fatigue');
  }
  if (effortReason === 'pain') {
    tags.add('reason_pain');
    tags.add('pain_declared');
  }
  if (effortReason === 'low_energy') tags.add('reason_low_energy');
  if (effortReason === 'technique') tags.add('reason_technique');
  if (effortReason === 'cardio') tags.add('reason_cardio');

  const limiter = answeredValue(a, 'primary_limiter');
  if (limiter && limiter !== 'none' && limiter !== 'unknown') tags.add('limiter_known');
  if (limiter === 'muscle_fatigue' || limiter === 'low_energy') tags.add('reason_fatigue');
  if (limiter === 'time') tags.add('reason_time');
  if (limiter === 'pain') {
    tags.add('reason_pain');
    tags.add('pain_declared');
  }
  if (limiter === 'technique') tags.add('reason_technique');
  if (limiter === 'equipment') tags.add('reason_equipment');
  if (limiter === 'cardio') tags.add('reason_cardio');

  const intentBlocker = answeredValue(a, 'intent_blocker');
  if (intentBlocker) tags.add('intent_blocker_known');
  if (intentBlocker === 'fatigue') tags.add('reason_fatigue');
  if (intentBlocker === 'time') tags.add('reason_time');
  if (intentBlocker === 'pain') {
    tags.add('reason_pain');
    tags.add('pain_declared');
  }

  const dissatisfaction = answeredValue(a, 'dissatisfaction_reason');
  if (dissatisfaction) tags.add('dissatisfaction_known');
  if (dissatisfaction === 'pain') {
    tags.add('reason_pain');
    tags.add('pain_declared');
  }

  const lowEnergy = answeredValue(a, 'low_energy_reason');
  if (lowEnergy) tags.add('low_energy_explained');

  const intent = answeredValue(a, 'session_intent');
  if (intent === 'light') tags.add('intent_light');

  const tagsList = answeredValue(a, 'context_tags') || [];
  if (Array.isArray(tagsList)) {
    if (tagsList.includes('light_session')) tags.add('intent_light');
    if (tagsList.includes('interrupted')) tags.add('session_interrupted');
  }

  return tags;
}

function covered(tags, neededAny) {
  if (!neededAny || !neededAny.length) return false;
  return neededAny.some((t) => tags.has(t));
}

function candidateBase(questionId, extras = {}) {
  const q = getQuestion(questionId);
  if (!q || q.enabled === false) return null;
  return {
    id: questionId,
    promptFr: extras.promptFr || q.promptFr,
    options: q.value?.options || [],
    priority: extras.priority ?? 50,
    trigger: extras.trigger || 'unspecified',
    justificationFr: extras.justificationFr || null,
    evidence: extras.evidence || [],
    exclusions: extras.exclusions || [],
    limits: extras.limits || [],
    family: extras.family || 'conditional'
  };
}

/**
 * @param {object} input
 * @param {object} [input.sportContext]
 * @param {object} [input.answers]
 * @param {string[]} [input.alreadyAskedIds]
 * @param {number} [input.maxPrimary=1]
 * @returns {{
 *   candidates: object[],
 *   selected: object[],
 *   coveredTags: string[],
 *   disabledHistorical: string[],
 *   painDetailSuggested: boolean
 * }}
 */
export function selectConditionalQuestions(input = {}) {
  const sport = isPlainObject(input.sportContext) ? input.sportContext : {};
  const answers = isPlainObject(input.answers) ? input.answers : {};
  const alreadyAsked = new Set(input.alreadyAskedIds || []);
  const maxPrimary = Number.isFinite(input.maxPrimary) ? input.maxPrimary : 1;
  const tags = collectCoverageTags(answers);
  const candidates = [];

  const effort = answeredValue(answers, 'effort');
  const experience = answeredValue(answers, 'experience');
  const energyBefore = answeredValue(answers, 'energy_before');
  const painPresence = answeredValue(answers, 'pain_presence');
  const intent = answeredValue(answers, 'session_intent');
  const attained = answeredValue(answers, 'intent_attained');
  const partial = answeredValue(answers, 'session_partial_status');

  // 4.1 Séance partielle vs plan connu
  if (
    sport.isPartialVsPlan === true &&
    sport.reliability?.plan === 'known' &&
    !isAnswered(answers, 'session_partial_status') &&
    !alreadyAsked.has('session_partial_status')
  ) {
    const c = candidateBase('session_partial_status', {
      priority: 100,
      trigger: 'partial_vs_plan',
      justificationFr: 'Question proposée à partir du programme enregistré.',
      evidence: [
        `planned=${sport.plannedExerciseCount}`,
        `recorded=${sport.recordedExerciseCount}`,
        `missing=${(sport.missingPlannedIds || []).length}`
      ],
      limits: [
        'Ne signifie pas que la séance est définitivement incomplète.',
        'Pas de statut « séance terminée » côté Momentum.'
      ],
      family: 'session_shape'
    });
    if (c) candidates.push(c);
  }

  // 4.4 Adaptation volontaire
  const adaptedDeclared =
    partial === 'adapted' ||
    intent === 'light' ||
    tags.has('intent_light') ||
    tags.has('session_adapted');
  if (
    adaptedDeclared &&
    !isAnswered(answers, 'adaptation_reason') &&
    !tags.has('adaptation_explained') &&
    !alreadyAsked.has('adaptation_reason')
  ) {
    // Si partial a déjà donné fatigue/time/pain, skip
    if (!covered(tags, ['reason_fatigue', 'reason_time', 'reason_pain', 'reason_recovery'])) {
      const c = candidateBase('adaptation_reason', {
        priority: 90,
        trigger: 'voluntary_adaptation',
        justificationFr: 'Tu as indiqué une adaptation de séance.',
        evidence: [`partial=${partial ?? 'n/a'}`, `intent=${intent ?? 'n/a'}`],
        limits: ['Une séance allégée n’est pas un échec.'],
        family: 'adaptation'
      });
      if (c) candidates.push(c);
    }
  }

  // 4.2 Effort élevé
  if (
    typeof effort === 'number' &&
    effort >= EFFORT_HIGH &&
    !isAnswered(answers, 'effort_demand_reason') &&
    !tags.has('effort_reason_known') &&
    !covered(tags, ['reason_fatigue', 'reason_pain', 'reason_cardio', 'reason_technique', 'limiter_known']) &&
    !alreadyAsked.has('effort_demand_reason')
  ) {
    const c = candidateBase('effort_demand_reason', {
      priority: 80,
      trigger: 'high_effort',
      justificationFr: 'Tu as évalué l’effort comme élevé.',
      evidence: [`effort=${effort}`],
      limits: ['Effort élevé ≠ problème.', 'Pas de conseil de récupération automatique.'],
      family: 'effort'
    });
    if (c) candidates.push(c);
  }

  // 4.5 Objectif non atteint
  if (
    isAnswered(answers, 'session_intent') &&
    intent !== 'none' &&
    intent !== 'unknown' &&
    (attained === 'no' || attained === 'partial') &&
    !isAnswered(answers, 'intent_blocker') &&
    !tags.has('intent_blocker_known') &&
    !covered(tags, ['reason_fatigue', 'reason_time', 'reason_pain', 'reason_equipment']) &&
    !alreadyAsked.has('intent_blocker')
  ) {
    const c = candidateBase('intent_blocker', {
      priority: 70,
      trigger: 'intent_not_fully_attained',
      justificationFr: 'Tu as indiqué ne pas avoir pleinement atteint ton objectif.',
      evidence: [`intent=${intent}`, `attained=${attained}`],
      limits: ['Ne prouve pas que l’objectif était irréaliste.'],
      family: 'intent'
    });
    if (c) candidates.push(c);
  }

  // 4.6 Ressenti négatif + effort faible
  if (
    typeof experience === 'number' &&
    experience <= EXPERIENCE_LOW &&
    typeof effort === 'number' &&
    effort <= EFFORT_LOW &&
    !isAnswered(answers, 'dissatisfaction_reason') &&
    !tags.has('dissatisfaction_known') &&
    !covered(tags, ['reason_pain', 'session_interrupted', 'session_shortened']) &&
    !alreadyAsked.has('dissatisfaction_reason')
  ) {
    const c = candidateBase('dissatisfaction_reason', {
      priority: 65,
      trigger: 'low_experience_low_effort',
      justificationFr: 'Séance peu satisfaisante malgré un effort modéré.',
      evidence: [`experience=${experience}`, `effort=${effort}`],
      limits: ['Ce n’est pas une contradiction.', 'Pas d’échec de performance inféré.'],
      family: 'experience'
    });
    if (c) candidates.push(c);
  }

  // 4.7 Énergie initiale faible
  if (
    typeof energyBefore === 'number' &&
    energyBefore <= ENERGY_LOW &&
    !isAnswered(answers, 'low_energy_reason') &&
    !tags.has('low_energy_explained') &&
    !alreadyAsked.has('low_energy_reason')
  ) {
    const c = candidateBase('low_energy_reason', {
      priority: 55,
      trigger: 'low_energy_before',
      justificationFr: 'Tu as indiqué une énergie initiale faible.',
      evidence: [`energy_before=${energyBefore}`],
      limits: ['Déclaration subjective, pas une cause physiologique démontrée.'],
      family: 'energy'
    });
    if (c) candidates.push(c);
  }

  // primary_limiter : seulement si aucune raison équivalente et pas d’effort_demand
  if (
    !isAnswered(answers, 'primary_limiter') &&
    !isAnswered(answers, 'effort_demand_reason') &&
    !tags.has('limiter_known') &&
    !covered(tags, ['reason_fatigue', 'reason_time', 'reason_pain', 'effort_reason_known']) &&
    (tags.has('session_shortened') || (typeof effort === 'number' && effort >= EFFORT_HIGH)) &&
    !alreadyAsked.has('primary_limiter')
  ) {
    // Désactivé volontairement en v1 si effort_demand ou partial couvre déjà — priorité basse
    const c = candidateBase('primary_limiter', {
      priority: 40,
      trigger: 'fallback_limiter',
      justificationFr: null,
      evidence: [],
      limits: ['Évité si une raison équivalente est déjà connue.'],
      family: 'limiter'
    });
    // Ne pas l’ajouter en v1 pour limiter les sollicitations : commenté via priority gate
    if (c && maxPrimary > 2) candidates.push(c);
  }

  candidates.sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));

  const selected = [];
  const selectedFamilies = new Set();
  for (const c of candidates) {
    if (selected.length >= maxPrimary) break;
    if (selectedFamilies.has(c.family)) continue;
    selected.push(c);
    selectedFamilies.add(c.family);
  }

  return {
    candidates,
    selected,
    coveredTags: [...tags].sort(),
    disabledHistorical: [...DISABLED_HISTORICAL_CONDITIONAL_IDS],
    activeCatalogIds: [...ACTIVE_CONDITIONAL_IDS],
    painDetailSuggested: painPresence === 'yes'
  };
}
