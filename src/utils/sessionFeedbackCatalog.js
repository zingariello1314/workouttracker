/**
 * Catalogue central des questions Feedback (logique métier, sans React).
 * Identifiants stables ; l’UI et Mobile consomment ce fichier.
 */

export const ANSWER_STATES = Object.freeze({
  ANSWERED: 'answered',
  NOT_ANSWERED: 'not_answered',
  ABSENT: 'absent',
  DECLINED: 'declined',
  NOT_ASKED: 'not_asked',
  NOT_APPLICABLE: 'not_applicable'
});

export const QUESTION_TIERS = Object.freeze({
  RAPID: 'rapid',
  DETAILED: 'detailed',
  CONDITIONAL: 'conditional',
  SECONDARY: 'secondary',
  HISTORICAL: 'historical',
  FUTURE: 'future'
});

/** Régions corporelles pour douleur (valeur stockée). */
export const PAIN_REGIONS = Object.freeze([
  'neck',
  'shoulder',
  'elbow',
  'wrist_hand',
  'upper_back',
  'lower_back',
  'hip',
  'knee',
  'ankle_foot',
  'chest',
  'abdomen',
  'other',
  'unspecified'
]);

/**
 * @typedef {object} QuestionOption
 * @property {string|number|boolean} value
 * @property {string} labelKey
 * @property {string} [labelFr]
 */

/**
 * @typedef {object} QuestionDef
 * @property {string} id
 * @property {string} tier
 * @property {string} type — scale | enum | multi_enum | text | pain_block
 * @property {string} promptKey
 * @property {string} promptFr
 * @property {string} temporalRef — when the answer refers to
 * @property {string} measures
 * @property {string[]} notMeasures
 * @property {{ min?: number, max?: number, allowZero?: boolean, options?: QuestionOption[], maxLength?: number }} value
 * @property {{ min?: number, max?: number, labelFr: string }[]} [anchors]
 * @property {string} [historicalField] — root field mirrored for Recap
 * @property {boolean} [enabled]
 * @property {string[]} [dependsOn]
 */

/** @type {Record<string, QuestionDef>} */
export const SESSION_FEEDBACK_QUESTIONS = Object.freeze({
  experience: {
    id: 'experience',
    tier: QUESTION_TIERS.RAPID,
    type: 'scale',
    promptKey: 'sessionFeedback.q.experience',
    promptFr: 'Comment as-tu vécu cette séance dans son ensemble ?',
    temporalRef: 'during_or_just_after_session',
    measures: 'subjective_session_experience',
    notMeasures: ['performance', 'productivity', 'technical_difficulty', 'recovery'],
    value: { min: 1, max: 10 },
    anchors: [
      { min: 1, max: 1, labelFr: 'Très mal vécue' },
      { min: 3, max: 3, labelFr: 'Plutôt mal vécue' },
      { min: 5, max: 5, labelFr: 'Mitigée' },
      { min: 7, max: 7, labelFr: 'Plutôt bien vécue' },
      { min: 10, max: 10, labelFr: 'Excellente expérience' }
    ],
    historicalField: 'ressenti',
    enabled: true
  },
  effort: {
    id: 'effort',
    tier: QUESTION_TIERS.RAPID,
    type: 'scale',
    promptKey: 'sessionFeedback.q.effort',
    promptFr: 'À quel point cette séance t’a-t-elle demandé un effort ?',
    temporalRef: 'whole_session',
    measures: 'perceived_session_effort',
    notMeasures: ['technical_difficulty', 'pain', 'single_set_rpe', 'load', 'physiology'],
    value: { min: 0, max: 10, allowZero: true },
    anchors: [
      { min: 0, max: 0, labelFr: 'Aucun effort' },
      { min: 2, max: 2, labelFr: 'Très facile' },
      { min: 4, max: 4, labelFr: 'Effort modéré' },
      { min: 6, max: 6, labelFr: 'Exigeant' },
      { min: 8, max: 8, labelFr: 'Très exigeant' },
      { min: 10, max: 10, labelFr: 'Effort maximal perçu' }
    ],
    /** Miroir historique seulement si ≥ 1 (0 reste dans answers.effort). */
    historicalField: 'difficulte',
    enabled: true
  },
  energy_before: {
    id: 'energy_before',
    tier: QUESTION_TIERS.RAPID,
    type: 'scale',
    promptKey: 'sessionFeedback.q.energyBefore',
    promptFr: 'Quel était ton niveau d’énergie avant de commencer ?',
    temporalRef: 'before_first_exercise',
    measures: 'subjective_pre_session_energy',
    notMeasures: ['physiological_recovery', 'sleep_duration'],
    value: { min: 1, max: 10 },
    anchors: [
      { min: 1, max: 2, labelFr: 'Très faible' },
      { min: 5, max: 5, labelFr: 'Moyenne' },
      { min: 9, max: 10, labelFr: 'Très élevée' }
    ],
    historicalField: 'energieDebut',
    enabled: true
  },
  pain_presence: {
    id: 'pain_presence',
    tier: QUESTION_TIERS.RAPID,
    type: 'enum',
    promptKey: 'sessionFeedback.q.painPresence',
    promptFr: 'As-tu ressenti une douleur ou une gêne pendant cette séance ?',
    temporalRef: 'during_session',
    measures: 'declared_pain_or_discomfort_presence',
    notMeasures: ['injury_diagnosis', 'medical_status'],
    value: {
      options: [
        { value: 'no', labelKey: 'sessionFeedback.pain.no', labelFr: 'Non' },
        { value: 'yes', labelKey: 'sessionFeedback.pain.yes', labelFr: 'Oui' },
        { value: 'declined', labelKey: 'sessionFeedback.pain.declined', labelFr: 'Je préfère ne pas répondre' }
      ]
    },
    enabled: true
  },
  pain_intensity: {
    id: 'pain_intensity',
    tier: QUESTION_TIERS.DETAILED,
    type: 'scale',
    promptKey: 'sessionFeedback.q.painIntensity',
    promptFr: 'Quelle était l’intensité de cette gêne ?',
    temporalRef: 'during_session',
    measures: 'declared_pain_intensity',
    notMeasures: ['clinical_severity'],
    value: { min: 1, max: 10 },
    dependsOn: ['pain_presence'],
    historicalField: 'douleur',
    enabled: true
  },
  pain_region: {
    id: 'pain_region',
    tier: QUESTION_TIERS.DETAILED,
    type: 'enum',
    promptKey: 'sessionFeedback.q.painRegion',
    promptFr: 'Où as-tu ressenti cette gêne ?',
    temporalRef: 'during_session',
    measures: 'declared_pain_region',
    notMeasures: ['exact_anatomy'],
    value: {
      options: PAIN_REGIONS.map((value) => ({
        value,
        labelKey: `sessionFeedback.pain.region.${value}`,
        labelFr: value
      }))
    },
    dependsOn: ['pain_presence'],
    enabled: true
  },
  pain_side: {
    id: 'pain_side',
    tier: QUESTION_TIERS.DETAILED,
    type: 'enum',
    promptKey: 'sessionFeedback.q.painSide',
    promptFr: 'De quel côté ?',
    temporalRef: 'during_session',
    measures: 'declared_pain_side',
    notMeasures: [],
    value: {
      options: [
        { value: 'left', labelFr: 'Gauche' },
        { value: 'right', labelFr: 'Droit' },
        { value: 'bilateral', labelFr: 'Bilatéral' },
        { value: 'na', labelFr: 'Non applicable' },
        { value: 'unspecified', labelFr: 'Non précisé' }
      ]
    },
    dependsOn: ['pain_presence'],
    enabled: true
  },
  pain_onset: {
    id: 'pain_onset',
    tier: QUESTION_TIERS.DETAILED,
    type: 'enum',
    promptKey: 'sessionFeedback.q.painOnset',
    promptFr: 'Cette gêne était-elle déjà là avant la séance ?',
    temporalRef: 'relative_to_session',
    measures: 'declared_pain_onset',
    notMeasures: ['chronic_diagnosis'],
    value: {
      options: [
        { value: 'before', labelFr: 'Déjà présente avant la séance' },
        { value: 'during', labelFr: 'Apparue pendant la séance' },
        { value: 'worsened', labelFr: 'Présente auparavant et aggravée' },
        { value: 'unknown', labelFr: 'Je ne sais pas' }
      ]
    },
    dependsOn: ['pain_presence'],
    enabled: true
  },
  pain_effect: {
    id: 'pain_effect',
    tier: QUESTION_TIERS.DETAILED,
    type: 'enum',
    promptKey: 'sessionFeedback.q.painEffect',
    promptFr: 'Quel effet a eu cette gêne sur ton exécution ?',
    temporalRef: 'during_session',
    measures: 'declared_pain_consequence',
    notMeasures: ['encouragement_to_continue'],
    value: {
      options: [
        { value: 'none', labelFr: 'Aucune modification' },
        { value: 'adapted', labelFr: 'Exécution adaptée' },
        { value: 'reduced', labelFr: 'Charge ou volume réduit' },
        { value: 'stopped_exercise', labelFr: 'Exercice interrompu' },
        { value: 'stopped_session', labelFr: 'Séance interrompue' },
        { value: 'other', labelFr: 'Autre' }
      ]
    },
    dependsOn: ['pain_presence'],
    enabled: true
  },
  pain_exercise: {
    id: 'pain_exercise',
    tier: QUESTION_TIERS.DETAILED,
    type: 'enum',
    promptKey: 'sessionFeedback.q.painExercise',
    promptFr: 'Quel exercice était concerné ?',
    temporalRef: 'during_session',
    measures: 'declared_linked_exercise',
    notMeasures: ['invented_exercises'],
    value: { options: [] },
    dependsOn: ['pain_presence'],
    enabled: true
  },
  motivation_before: {
    id: 'motivation_before',
    tier: QUESTION_TIERS.DETAILED,
    type: 'scale',
    promptKey: 'sessionFeedback.q.motivationBefore',
    promptFr: 'Quelle était ton envie de t’entraîner avant de commencer ?',
    temporalRef: 'before_first_exercise',
    measures: 'pre_session_desire_to_train',
    notMeasures: ['personality_trait'],
    value: { min: 1, max: 10 },
    historicalField: 'motivation',
    enabled: true
  },
  energy_after: {
    id: 'energy_after',
    tier: QUESTION_TIERS.DETAILED,
    type: 'scale',
    promptKey: 'sessionFeedback.q.energyAfter',
    promptFr: 'Quel était ton niveau d’énergie juste après la séance ?',
    temporalRef: 'immediately_after_session',
    measures: 'subjective_post_session_energy',
    notMeasures: ['current_feeling_hours_later', 'recovery_quality'],
    value: { min: 1, max: 10 },
    historicalField: 'energieFin',
    enabled: true
  },
  sleep_prev: {
    id: 'sleep_prev',
    tier: QUESTION_TIERS.DETAILED,
    type: 'scale',
    promptKey: 'sessionFeedback.q.sleepPrev',
    promptFr: 'Comment as-tu dormi la nuit précédant cette séance ?',
    temporalRef: 'night_before_session',
    measures: 'subjective_prior_night_sleep',
    notMeasures: ['garmin_duration_as_same_signal'],
    value: { min: 1, max: 10 },
    historicalField: 'sommeil',
    enabled: true
  },
  fed_enough: {
    id: 'fed_enough',
    tier: QUESTION_TIERS.DETAILED,
    type: 'enum',
    promptKey: 'sessionFeedback.q.fedEnough',
    promptFr: 'T’es-tu senti suffisamment alimenté pour cet entraînement ?',
    temporalRef: 'for_this_session',
    measures: 'subjective_fed_enough',
    notMeasures: ['calorie_or_protein_adequacy'],
    value: {
      options: [
        { value: 'fully', labelFr: 'Oui, tout à fait' },
        { value: 'rather_yes', labelFr: 'Plutôt oui' },
        { value: 'rather_no', labelFr: 'Plutôt non' },
        { value: 'no', labelFr: 'Non' },
        { value: 'unknown', labelFr: 'Je ne sais pas' }
      ]
    },
    enabled: true
  },
  hydrated_enough: {
    id: 'hydrated_enough',
    tier: QUESTION_TIERS.DETAILED,
    type: 'enum',
    promptKey: 'sessionFeedback.q.hydratedEnough',
    promptFr: 'Estimes-tu avoir suffisamment bu avant et pendant la séance ?',
    temporalRef: 'before_and_during_session',
    measures: 'subjective_hydration_adequacy',
    notMeasures: ['medical_hydration_status'],
    value: {
      options: [
        { value: 'fully', labelFr: 'Oui, tout à fait' },
        { value: 'rather_yes', labelFr: 'Plutôt oui' },
        { value: 'rather_no', labelFr: 'Plutôt non' },
        { value: 'no', labelFr: 'Non' },
        { value: 'unknown', labelFr: 'Je ne sais pas' }
      ]
    },
    enabled: true
  },
  session_intent: {
    id: 'session_intent',
    tier: QUESTION_TIERS.DETAILED,
    type: 'enum',
    promptKey: 'sessionFeedback.q.sessionIntent',
    promptFr: 'Quel était ton objectif principal aujourd’hui ?',
    temporalRef: 'session_intention',
    measures: 'declared_session_intent',
    notMeasures: ['inferred_from_muscle_groups'],
    value: {
      options: [
        { value: 'force', labelFr: 'Force' },
        { value: 'volume', labelFr: 'Volume / hypertrophie' },
        { value: 'endurance', labelFr: 'Endurance' },
        { value: 'technique', labelFr: 'Technique' },
        { value: 'light', labelFr: 'Séance légère / récupération' },
        { value: 'maintain', labelFr: 'Maintien' },
        { value: 'other', labelFr: 'Autre' },
        { value: 'none', labelFr: 'Aucun objectif particulier' },
        { value: 'unknown', labelFr: 'Je ne sais pas' }
      ]
    },
    enabled: true
  },
  intent_attained: {
    id: 'intent_attained',
    tier: QUESTION_TIERS.DETAILED,
    type: 'enum',
    promptKey: 'sessionFeedback.q.intentAttained',
    promptFr: 'Estimes-tu avoir atteint cet objectif ?',
    temporalRef: 'end_of_session_subjective',
    measures: 'subjective_intent_attainment',
    notMeasures: ['objective_volume_success'],
    value: {
      options: [
        { value: 'yes', labelFr: 'Oui' },
        { value: 'partial', labelFr: 'Partiellement' },
        { value: 'no', labelFr: 'Non' },
        { value: 'unknown', labelFr: 'Je ne sais pas' },
        { value: 'na', labelFr: 'Non applicable' }
      ]
    },
    dependsOn: ['session_intent'],
    enabled: true
  },
  primary_limiter: {
    id: 'primary_limiter',
    tier: QUESTION_TIERS.CONDITIONAL,
    type: 'enum',
    promptKey: 'sessionFeedback.q.primaryLimiter',
    promptFr: 'Qu’est-ce qui t’a principalement limité pendant cette séance ?',
    temporalRef: 'during_session',
    measures: 'declared_primary_limiter',
    notMeasures: ['proven_single_cause'],
    value: {
      options: [
        { value: 'none', labelFr: 'Rien de particulier' },
        { value: 'muscle_fatigue', labelFr: 'Fatigue musculaire' },
        { value: 'cardio', labelFr: 'Souffle / cardio' },
        { value: 'technique', labelFr: 'Difficulté technique' },
        { value: 'low_energy', labelFr: 'Manque d’énergie' },
        { value: 'pain', labelFr: 'Douleur ou gêne' },
        { value: 'time', labelFr: 'Manque de temps' },
        { value: 'equipment', labelFr: 'Matériel' },
        { value: 'other', labelFr: 'Autre' },
        { value: 'unknown', labelFr: 'Je ne sais pas' }
      ]
    },
    enabled: true
  },
  session_partial_status: {
    id: 'session_partial_status',
    tier: QUESTION_TIERS.CONDITIONAL,
    type: 'enum',
    promptKey: 'sessionFeedback.q.sessionPartialStatus',
    promptFr: 'Tu n’as pas encore enregistré tous les exercices prévus. Comptes-tu poursuivre ?',
    temporalRef: 'at_save_moment',
    measures: 'declared_partial_session_status',
    notMeasures: ['session_finalized_incomplete'],
    value: {
      options: [
        { value: 'still_in_progress', labelFr: 'Oui, ma séance est encore en cours' },
        { value: 'adapted', labelFr: 'Non, j’ai volontairement adapté ma séance' },
        { value: 'no_time', labelFr: 'Non, j’ai manqué de temps' },
        { value: 'fatigue', labelFr: 'Non, j’étais trop fatigué' },
        { value: 'pain', labelFr: 'Non, une douleur m’a gêné' },
        { value: 'no_equipment', labelFr: 'Non, le matériel n’était pas disponible' },
        { value: 'other', labelFr: 'Autre' },
        { value: 'unknown', labelFr: 'Je ne sais pas' }
      ]
    },
    enabled: true
  },
  adaptation_reason: {
    id: 'adaptation_reason',
    tier: QUESTION_TIERS.CONDITIONAL,
    type: 'enum',
    promptKey: 'sessionFeedback.q.adaptationReason',
    promptFr: 'Pourquoi as-tu adapté ta séance ?',
    temporalRef: 'for_this_session',
    measures: 'declared_adaptation_reason',
    notMeasures: ['performance_regression', 'failure'],
    value: {
      options: [
        { value: 'recovery', labelFr: 'Récupération prévue' },
        { value: 'fatigue', labelFr: 'Fatigue' },
        { value: 'pain', labelFr: 'Douleur' },
        { value: 'time', labelFr: 'Manque de temps' },
        { value: 'technique', labelFr: 'Travail technique' },
        { value: 'program_change', labelFr: 'Changement de programme' },
        { value: 'other', labelFr: 'Autre' },
        { value: 'declined', labelFr: 'Je préfère ne pas préciser' }
      ]
    },
    enabled: true
  },
  effort_demand_reason: {
    id: 'effort_demand_reason',
    tier: QUESTION_TIERS.CONDITIONAL,
    type: 'enum',
    promptKey: 'sessionFeedback.q.effortDemandReason',
    promptFr: 'Qu’est-ce qui a principalement rendu cette séance exigeante ?',
    temporalRef: 'during_session',
    measures: 'declared_effort_demand_reason',
    notMeasures: ['problem_inference', 'overtraining'],
    value: {
      options: [
        { value: 'muscle_fatigue', labelFr: 'Fatigue musculaire' },
        { value: 'cardio', labelFr: 'Souffle / cardio' },
        { value: 'technique', labelFr: 'Difficulté technique' },
        { value: 'general_fatigue', labelFr: 'Fatigue générale' },
        { value: 'low_energy', labelFr: 'Manque d’énergie' },
        { value: 'pain', labelFr: 'Douleur ou gêne' },
        { value: 'other', labelFr: 'Autre' },
        { value: 'unknown', labelFr: 'Je ne sais pas' }
      ]
    },
    enabled: true
  },
  intent_blocker: {
    id: 'intent_blocker',
    tier: QUESTION_TIERS.CONDITIONAL,
    type: 'enum',
    promptKey: 'sessionFeedback.q.intentBlocker',
    promptFr: 'Qu’est-ce qui t’a empêché d’atteindre pleinement cet objectif ?',
    temporalRef: 'end_of_session_subjective',
    measures: 'declared_intent_blocker',
    notMeasures: ['proof_goal_was_unrealistic'],
    value: {
      options: [
        { value: 'too_ambitious', labelFr: 'Objectif trop ambitieux' },
        { value: 'fatigue', labelFr: 'Fatigue' },
        { value: 'time', labelFr: 'Manque de temps' },
        { value: 'pain', labelFr: 'Douleur' },
        { value: 'technique', labelFr: 'Difficulté technique' },
        { value: 'equipment', labelFr: 'Conditions matérielles' },
        { value: 'priority_change', labelFr: 'Changement de priorité' },
        { value: 'other', labelFr: 'Autre' },
        { value: 'unknown', labelFr: 'Je ne sais pas' }
      ]
    },
    enabled: true
  },
  dissatisfaction_reason: {
    id: 'dissatisfaction_reason',
    tier: QUESTION_TIERS.CONDITIONAL,
    type: 'enum',
    promptKey: 'sessionFeedback.q.dissatisfactionReason',
    promptFr: 'Qu’est-ce qui a surtout rendu cette séance peu satisfaisante pour toi ?',
    temporalRef: 'session_experience',
    measures: 'declared_dissatisfaction_reason',
    notMeasures: ['contradiction_with_low_effort'],
    value: {
      options: [
        { value: 'not_what_wanted', labelFr: 'Je n’ai pas réalisé ce que je voulais' },
        { value: 'low_motivation', labelFr: 'Manque d’envie' },
        { value: 'interrupted', labelFr: 'Séance interrompue' },
        { value: 'conditions', labelFr: 'Conditions désagréables' },
        { value: 'pain', labelFr: 'Douleur ou gêne' },
        { value: 'other', labelFr: 'Autre' },
        { value: 'unknown', labelFr: 'Je ne sais pas' }
      ]
    },
    enabled: true
  },
  low_energy_reason: {
    id: 'low_energy_reason',
    tier: QUESTION_TIERS.CONDITIONAL,
    type: 'enum',
    promptKey: 'sessionFeedback.q.lowEnergyReason',
    promptFr: 'Avais-tu identifié une raison particulière à ce manque d’énergie ?',
    temporalRef: 'before_first_exercise',
    measures: 'declared_low_energy_reason',
    notMeasures: ['physiological_cause'],
    value: {
      options: [
        { value: 'poor_sleep', labelFr: 'Mauvaise nuit' },
        { value: 'accumulated_fatigue', labelFr: 'Fatigue accumulée ressentie' },
        { value: 'underfed', labelFr: 'Alimentation insuffisante ressentie' },
        { value: 'low_motivation', labelFr: 'Manque d’envie' },
        { value: 'hard_day', labelFr: 'Journée éprouvante' },
        { value: 'none', labelFr: 'Aucune raison particulière' },
        { value: 'other', labelFr: 'Autre' },
        { value: 'unknown', labelFr: 'Je ne sais pas' }
      ]
    },
    enabled: true
  },
  place: {
    id: 'place',
    tier: QUESTION_TIERS.DETAILED,
    type: 'enum',
    promptKey: 'sessionFeedback.q.place',
    promptFr: 'Où as-tu fait ta séance ?',
    temporalRef: 'session',
    measures: 'declared_place',
    notMeasures: [],
    value: {
      options: [
        { value: 'home', labelFr: 'Maison' },
        { value: 'gym', labelFr: 'Salle' },
        { value: 'outdoor', labelFr: 'Extérieur' },
        { value: 'other', labelFr: 'Autre' }
      ]
    },
    historicalField: 'environnement',
    enabled: true
  },
  equipment_changed: {
    id: 'equipment_changed',
    tier: QUESTION_TIERS.DETAILED,
    type: 'enum',
    promptKey: 'sessionFeedback.q.equipmentChanged',
    promptFr: 'As-tu utilisé un matériel inhabituel pour toi aujourd’hui ?',
    temporalRef: 'session',
    measures: 'declared_unusual_equipment',
    notMeasures: ['full_equipment_inventory', 'load_change'],
    value: {
      options: [
        { value: 'no', labelFr: 'Non' },
        { value: 'yes', labelFr: 'Oui' },
        { value: 'unknown', labelFr: 'Je ne sais pas' }
      ]
    },
    enabled: true
  },
  equipment_changed_note: {
    id: 'equipment_changed_note',
    tier: QUESTION_TIERS.DETAILED,
    type: 'text',
    promptKey: 'sessionFeedback.q.equipmentChangedNote',
    promptFr: 'Précise le matériel (facultatif)',
    temporalRef: 'session',
    measures: 'free_equipment_note',
    notMeasures: [],
    value: { maxLength: 200 },
    dependsOn: ['equipment_changed'],
    enabled: true
  },
  rest_band: {
    id: 'rest_band',
    tier: QUESTION_TIERS.DETAILED,
    type: 'enum',
    promptKey: 'sessionFeedback.q.restBand',
    promptFr: 'Temps de repos entre séries (approximatif)',
    temporalRef: 'during_session',
    measures: 'approximate_rest_band',
    notMeasures: ['exact_seconds'],
    value: {
      options: [
        { value: 'lt_1', labelFr: 'Moins d’une minute' },
        { value: '1_2', labelFr: '1 à 2 minutes' },
        { value: '2_3', labelFr: '2 à 3 minutes' },
        { value: '3_5', labelFr: '3 à 5 minutes' },
        { value: 'gt_5', labelFr: 'Plus de 5 minutes' },
        { value: 'variable', labelFr: 'Variable' },
        { value: 'not_set', labelFr: 'Non renseigné' }
      ]
    },
    enabled: true
  },
  partner: {
    id: 'partner',
    tier: QUESTION_TIERS.DETAILED,
    type: 'enum',
    promptKey: 'sessionFeedback.q.partner',
    promptFr: 'T’es-tu entraîné seul ou accompagné ?',
    temporalRef: 'session',
    measures: 'declared_partner',
    notMeasures: ['default_alone'],
    value: {
      options: [
        { value: 'alone', labelFr: 'Seul(e)' },
        { value: 'with_someone', labelFr: 'Accompagné(e)' }
      ]
    },
    enabled: true
  },
  context_tags: {
    id: 'context_tags',
    tier: QUESTION_TIERS.DETAILED,
    type: 'multi_enum',
    promptKey: 'sessionFeedback.q.contextTags',
    promptFr: 'Marqueurs utiles (facultatif)',
    temporalRef: 'session',
    measures: 'structured_context_tags',
    notMeasures: ['vague_mood_tags'],
    value: {
      options: [
        { value: 'light_session', labelFr: 'Séance volontairement allégée' },
        { value: 'unusual_fatigue', labelFr: 'Fatigue inhabituelle' },
        { value: 'technical_difficulty', labelFr: 'Difficulté technique' },
        { value: 'new_equipment', labelFr: 'Nouveau matériel' },
        { value: 'program_changed', labelFr: 'Programme modifié' },
        { value: 'interrupted', labelFr: 'Séance interrompue' },
        { value: 'unusual_conditions', labelFr: 'Conditions inhabituelles' }
      ]
    },
    enabled: true
  },
  notes: {
    id: 'notes',
    tier: QUESTION_TIERS.DETAILED,
    type: 'text',
    promptKey: 'sessionFeedback.q.notes',
    promptFr: 'Notes personnelles (facultatif)',
    temporalRef: 'session',
    measures: 'free_notes',
    notMeasures: [],
    value: { maxLength: 2000 },
    historicalField: 'notes',
    enabled: true
  },
  music: {
    id: 'music',
    tier: QUESTION_TIERS.SECONDARY,
    type: 'text',
    promptKey: 'sessionFeedback.q.music',
    promptFr: 'Musique (facultatif)',
    temporalRef: 'session',
    measures: 'music_note',
    notMeasures: ['performance_driver'],
    value: { maxLength: 200 },
    historicalField: 'musiquesEcoutees',
    enabled: true
  },
  weather: {
    id: 'weather',
    tier: QUESTION_TIERS.SECONDARY,
    type: 'enum',
    promptKey: 'sessionFeedback.q.weather',
    promptFr: 'Météo (facultatif)',
    temporalRef: 'session',
    measures: 'weather_note',
    notMeasures: ['performance_driver'],
    value: {
      options: [
        { value: 'sunny', labelFr: 'Ensoleillé' },
        { value: 'cloudy', labelFr: 'Nuageux' },
        { value: 'rainy', labelFr: 'Pluvieux' },
        { value: 'windy', labelFr: 'Venteux' },
        { value: 'cold', labelFr: 'Froid' },
        { value: 'hot', labelFr: 'Chaud' }
      ]
    },
    historicalField: 'meteo',
    enabled: true
  },
  prochain_objectif: {
    id: 'prochain_objectif',
    tier: QUESTION_TIERS.HISTORICAL,
    type: 'text',
    promptKey: 'sessionFeedback.q.nextGoal',
    promptFr: 'Prochain objectif (historique)',
    temporalRef: 'future_planning',
    measures: 'legacy_next_goal',
    notMeasures: [],
    value: { maxLength: 500 },
    historicalField: 'prochainObjectif',
    enabled: false
  },
  perf_drop_voluntary: {
    id: 'perf_drop_voluntary',
    tier: QUESTION_TIERS.FUTURE,
    type: 'enum',
    promptKey: 'sessionFeedback.q.perfDrop',
    promptFr: 'Cette baisse de performance était-elle volontaire ?',
    temporalRef: 'session',
    measures: 'voluntary_perf_drop',
    notMeasures: ['weak_similarity_comparisons'],
    value: { options: [] },
    enabled: false
  },
  perf_rise_notice: {
    id: 'perf_rise_notice',
    tier: QUESTION_TIERS.FUTURE,
    type: 'enum',
    promptKey: 'sessionFeedback.q.perfRise',
    promptFr: 'As-tu remarqué quelque chose de particulier pendant cette séance ?',
    temporalRef: 'session',
    measures: 'perf_rise_context',
    notMeasures: [],
    value: { options: [] },
    enabled: false
  }
});

export const RAPID_QUESTION_IDS = Object.freeze([
  'experience',
  'effort',
  'energy_before',
  'pain_presence'
]);

/** Questions conditionnelles actives (v1) — hors comparaisons historiques. */
export const ACTIVE_CONDITIONAL_IDS = Object.freeze([
  'session_partial_status',
  'adaptation_reason',
  'effort_demand_reason',
  'intent_blocker',
  'dissatisfaction_reason',
  'low_energy_reason',
  'primary_limiter'
]);

/** Préparées mais désactivées tant que la comparabilité n’est pas prouvée. */
export const DISABLED_HISTORICAL_CONDITIONAL_IDS = Object.freeze([
  'perf_drop_voluntary',
  'perf_rise_notice'
]);

/** Lieu catalogue → valeur historique environnement. */
export const PLACE_TO_ENVIRONNEMENT = Object.freeze({
  home: 'maison',
  gym: 'salle',
  outdoor: 'exterieur',
  other: 'autre'
});

export const ENVIRONNEMENT_TO_PLACE = Object.freeze({
  maison: 'home',
  salle: 'gym',
  exterieur: 'outdoor',
  parc: 'outdoor',
  autre: 'other'
});

export const WEATHER_TO_METEO = Object.freeze({
  sunny: 'ensoleille',
  cloudy: 'nuageux',
  rainy: 'pluvieux',
  windy: 'venteux',
  cold: 'froid',
  hot: 'chaud'
});

export const METEO_TO_WEATHER = Object.freeze({
  ensoleille: 'sunny',
  nuageux: 'cloudy',
  pluvieux: 'rainy',
  venteux: 'windy',
  froid: 'cold',
  chaud: 'hot'
});

/** Bande de repos → texte libre historique (approximation, pas une durée exacte). */
export const REST_BAND_TO_TEMPS_REPOS = Object.freeze({
  lt_1: '<1 min',
  '1_2': '1-2 min',
  '2_3': '2-3 min',
  '3_5': '3-5 min',
  gt_5: '>5 min',
  variable: 'variable',
  not_set: ''
});

export function getQuestion(id) {
  return SESSION_FEEDBACK_QUESTIONS[id] || null;
}

export function listQuestions({ tier = null, enabledOnly = true } = {}) {
  return Object.values(SESSION_FEEDBACK_QUESTIONS).filter((q) => {
    if (enabledOnly && q.enabled === false) return false;
    if (tier && q.tier !== tier) return false;
    return true;
  });
}

/**
 * Cellule de réponse normalisée.
 * @param {string} state
 * @param {*} [value]
 * @returns {{ state: string, value: * }}
 */
export function makeAnswer(state, value = null) {
  return { state, value };
}
