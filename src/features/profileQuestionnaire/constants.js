export const PROFILE_QUESTIONNAIRE_VERSION = 1;

export const QUESTION_SECTIONS = [
  { id: 'objectifs', label: 'Objectifs de la mission', color: 'violet' },
  { id: 'experience', label: 'Expérience de combat', color: 'yellow' },
  { id: 'operations', label: 'Opérations quotidiennes', color: 'green' },
  { id: 'systeme', label: 'Paramètres système', color: 'white' }
];

export const PROFILE_QUESTION_DEFS = [
  {
    id: 'goalPhysique',
    sectionId: 'objectifs',
    type: 'single',
    title: 'Quel type de corps représente votre objectif ?',
    options: [
      { key: 'lean_toned', label: 'Sec et tonique', description: 'Athlétique, défini' },
      { key: 'muscular_defined', label: 'Musclé et défini', description: 'Volume + définition' },
      { key: 'strong_powerful', label: 'Fort & puissant', description: 'Force et performances' },
      { key: 'balanced_functional', label: 'Équilibré et fonctionnel', description: 'Santé et polyvalence' }
    ]
  },
  {
    id: 'priorityMuscleGroups',
    sectionId: 'objectifs',
    type: 'multi',
    max: 3,
    title: 'Sélectionnez jusqu’à 3 groupes musculaires à prioriser',
    options: [
      { key: 'chest', label: 'Pectoraux' },
      { key: 'back', label: 'Dos' },
      { key: 'shoulders', label: 'Épaules' },
      { key: 'biceps', label: 'Biceps' },
      { key: 'triceps', label: 'Triceps' },
      { key: 'core', label: 'Gainage/abdos' },
      { key: 'quads', label: 'Quadriceps' },
      { key: 'hamstrings', label: 'Ischio-jambiers' },
      { key: 'glutes', label: 'Fessiers' },
      { key: 'calves', label: 'Mollets' }
    ]
  },
  {
    id: 'experienceLevel',
    sectionId: 'experience',
    type: 'single',
    title: 'Depuis combien de temps vous entraînez-vous ?',
    options: [
      { key: 'beginner_total', label: 'Débutant complet', description: 'Jamais entraîné auparavant' },
      { key: 'beginner_0_3m', label: 'Je commence tout juste', description: 'Moins de 3 mois' },
      { key: 'intermediate_3_12m', label: 'Un peu d’expérience', description: '3-12 mois' },
      { key: 'advanced_1_3y', label: 'Expérimenté', description: '1-3 ans' },
      { key: 'expert_3y_plus', label: 'Très expérimenté', description: '3+ ans' }
    ]
  },
  {
    id: 'weeklyTrainingFrequencyCurrent',
    sectionId: 'experience',
    type: 'single',
    title: 'Combien de jours par semaine vous entraînez-vous actuellement ?',
    options: [
      { key: '0', label: '0 jour' },
      { key: '1_2', label: '1-2 jours' },
      { key: '3_4', label: '3-4 jours' },
      { key: '5_6', label: '5-6 jours' },
      { key: '7', label: 'Chaque jour' }
    ]
  },
  {
    id: 'trainingLocation',
    sectionId: 'experience',
    type: 'single',
    title: 'Où vous entraînez-vous principalement ?',
    options: [
      { key: 'commercial_gym', label: 'Salle de sport commerciale' },
      { key: 'home_gym', label: 'Salle de sport à domicile' },
      { key: 'home_minimal', label: 'Accueil (minimal)' },
      { key: 'outdoor', label: 'Extérieur/parc' }
    ]
  },
  {
    id: 'availableEquipment',
    sectionId: 'experience',
    type: 'multi',
    title: 'Sélectionnez tout l’équipement auquel vous avez accès',
    options: [
      { key: 'barbell_plates', label: 'Barre et disques' },
      { key: 'dumbbells', label: 'Haltères' },
      { key: 'kettlebells', label: 'Kettlebells' },
      { key: 'resistance_bands', label: 'Bandes de résistance' },
      { key: 'pullup_bar', label: 'Barre de traction' },
      { key: 'cable_machine', label: 'Machine à câbles' },
      { key: 'bench', label: 'Banc' },
      { key: 'squat_rack', label: 'Rack à squat' },
      { key: 'bodyweight_only', label: 'Poids du corps uniquement' }
    ]
  },
  {
    id: 'triedTrainingStyles',
    sectionId: 'experience',
    type: 'multi',
    title: 'Quels styles d’entraînement avez-vous déjà essayés ?',
    options: [
      { key: 'bodybuilding', label: 'Bodybuilding' },
      { key: 'calisthenics', label: 'Callisthénie' },
      { key: 'crossfit', label: 'CrossFit' },
      { key: 'functional', label: 'Force athlétique' },
      { key: 'hiit_cardio', label: 'HIIT/Cardio' },
      { key: 'none', label: 'Jamais entraîné formellement' }
    ]
  },
  {
    id: 'bodyFatPercentEstimate',
    sectionId: 'objectifs',
    type: 'slider',
    min: 5,
    max: 45,
    step: 1,
    title: 'Estimez votre taux de graisse corporelle actuel (%)'
  },
  {
    id: 'availableTrainingDays',
    sectionId: 'operations',
    type: 'days',
    title: 'Quels jours pouvez-vous vous entraîner ?'
  },
  {
    id: 'preferredTrainingWindow',
    sectionId: 'operations',
    type: 'single',
    title: 'Quand préférez-vous vous entraîner ?',
    options: [
      { key: 'very_early_morning', label: 'Tôt le matin', description: '5h-8h' },
      { key: 'morning', label: 'Matin', description: '8h-11h' },
      { key: 'midday', label: 'Midi', description: '11h-14h' },
      { key: 'afternoon', label: 'Après-midi', description: '14h-17h' },
      { key: 'evening', label: 'Soir', description: '17h-20h' },
      { key: 'night', label: 'Nuit', description: '20h+' }
    ]
  },
  {
    id: 'preferredSessionDuration',
    sectionId: 'operations',
    type: 'single',
    title: 'Combien de temps durent vos entraînements typiques ?',
    options: [
      { key: '15_30', label: '15-30 min' },
      { key: '30_45', label: '30-45 min' },
      { key: '45_60', label: '45-60 min' },
      { key: '60_90', label: '60-90 min' }
    ]
  },
  {
    id: 'activityOutsideTraining',
    sectionId: 'operations',
    type: 'single',
    title: 'Dans quelle mesure êtes-vous actif en dehors de vos entraînements ?',
    options: [
      { key: 'sedentary', label: 'Sédentaire' },
      { key: 'lightly_active', label: 'Légèrement actif' },
      { key: 'moderately_active', label: 'Modérément actif' },
      { key: 'very_active', label: 'Très actif' }
    ]
  },
  {
    id: 'sleepQuality',
    sectionId: 'operations',
    type: 'single',
    title: 'Comment évalueriez-vous votre sommeil habituel ?',
    options: [
      { key: 'poor', label: 'Mauvais' },
      { key: 'below_average', label: 'En dessous de la moyenne' },
      { key: 'average', label: 'Moyenne' },
      { key: 'good', label: 'Bon' },
      { key: 'excellent', label: 'Excellent' }
    ]
  },
  {
    id: 'stressLevel',
    sectionId: 'operations',
    type: 'single',
    title: 'Comment évalueriez-vous votre niveau de stress habituel ?',
    options: [
      { key: 'very_low', label: 'Très faible' },
      { key: 'low', label: 'Faible' },
      { key: 'moderate', label: 'Modéré' },
      { key: 'high', label: 'Élevé' },
      { key: 'very_high', label: 'Très élevé' }
    ]
  },
  {
    id: 'setReminderIntensity',
    sectionId: 'systeme',
    type: 'single',
    title: 'Quelle devrait être l’intensité des rappels de série ?',
    options: [
      { key: 'soft', label: 'Doux' },
      { key: 'moderate', label: 'Modéré' },
      { key: 'intense', label: 'Intense' },
      { key: 'hardcore', label: 'Hardcore' }
    ]
  },
  {
    id: 'dailyChallengeDifficulty',
    sectionId: 'systeme',
    type: 'single',
    title: 'Quelle devrait être la difficulté des défis quotidiens ?',
    options: [
      { key: 'easy', label: 'Facile' },
      { key: 'normal', label: 'Normal' },
      { key: 'hard', label: 'Difficile' },
      { key: 'nightmare', label: 'Cauchemar' }
    ]
  }
];

export const QUESTIONNAIRE_STORAGE_FIELD = 'profileQuestionnaire';
export const ONBOARDING_OPEN_EVENT = 'profile-questionnaire:open';

