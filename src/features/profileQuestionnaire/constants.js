export const PROFILE_QUESTIONNAIRE_VERSION = 8;

export const QUESTION_SECTIONS = [
  { id: 'objectifs', label: 'Objectifs de la mission', color: 'violet' },
  { id: 'experience', label: 'Expérience de combat', color: 'yellow' },
  { id: 'operations', label: 'Opérations quotidiennes', color: 'green' },
  { id: 'mobilite', label: 'Mobilité, cardio & formats de séance', color: 'cyan' },
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
      { key: 'balanced_functional', label: 'Équilibré et fonctionnel', description: 'Santé et polyvalence' },
      { key: 'athletic_performance', label: 'Athlète de performance', description: 'Vitesse, agilité, explosivité' },
      { key: 'bulk_mass', label: 'Masse maximale', description: 'Hypertrophie / prise de volume' },
      { key: 'recomposition', label: 'Recomposition', description: 'Perdre du gras tout en prenant du muscle' },
      { key: 'endurance_lean', label: 'Endurance & masse maigre', description: 'Capacité cardiovasculaire + tonicité' }
    ]
  },
  {
    id: 'currentPhysique',
    sectionId: 'objectifs',
    type: 'single',
    title: 'Comment décririez-vous votre physique actuel ?',
    options: [
      { key: 'very_slim', label: 'Très sec / fin', description: 'Peu de masse musculaire apparente' },
      { key: 'slim_avg', label: 'Mince / tonique', description: 'Peu de masse grasse' },
      { key: 'average', label: 'Moyen', description: 'Ni sec ni très musclé' },
      { key: 'athletic', label: 'Athlétique', description: 'Musclé sans volume extrême' },
      { key: 'muscular', label: 'Musclé / fort', description: 'Bonne masse musculaire' },
      { key: 'higher_bodyfat', label: 'Plus de masse grasse', description: 'Priorité santé ou perte' }
    ]
  },
  {
    id: 'vitalsSelfReport',
    sectionId: 'objectifs',
    type: 'vitals',
    title: 'Mesures actuelles (facultatif)',
    description:
      'Sexe, âge, poids, taille et objectif de poids affinent les estimations (nutrition, charge) et les suggestions — données locales au profil.'
  },
  {
    id: 'priorityMuscleGroups',
    sectionId: 'objectifs',
    type: 'multi',
    max: 3,
    title: 'Sélectionnez les zones ou objectifs à prioriser (jusqu’à 3)',
    options: [
      { key: 'upper_body', label: 'Haut du corps (global)' },
      { key: 'lower_body', label: 'Bas du corps (global)' },
      { key: 'cardio', label: 'Cardio / condition' },
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
    id: 'exerciseTypePreferences',
    sectionId: 'objectifs',
    type: 'multi',
    max: 3,
    title: 'Quels types d’exercices veux-tu retrouver en priorité ? (jusqu’à 3)',
    options: [
      { key: 'strength_compounds', label: 'Force polyarticulaire' },
      { key: 'hypertrophy', label: 'Hypertrophie / volume' },
      { key: 'cardio_endurance', label: 'Cardio / endurance' },
      { key: 'plyometrics', label: 'Pliométrie / explosivité' },
      { key: 'circuits_hiit', label: 'Circuits / HIIT' },
      { key: 'mobility_stretching', label: 'Mobilité / étirements' },
      { key: 'isometric_core', label: 'Isométrie / gainage' }
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
    type: 'multi',
    max: 4,
    title: 'Où vous entraînez-vous ? (plusieurs choix possibles)',
    options: [
      { key: 'commercial_gym', label: 'Salle de sport commerciale' },
      { key: 'home_gym', label: 'Salle de sport à domicile' },
      { key: 'home_minimal', label: 'À domicile (peu de matériel)' },
      { key: 'outdoor', label: 'Extérieur/parc' },
      { key: 'track', label: 'Piste d’athlétisme' }
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
      { key: 'parallel_bars', label: 'Barres parallèles' },
      { key: 'rings', label: 'Anneaux' },
      { key: 'dip_station', label: 'Station dips' },
      { key: 'squat_rack', label: 'Rack à squat' },
      { key: 'bodyweight', label: 'Poids du corps' },
      { key: 'jump_rope', label: 'Corde à sauter' },
      { key: 'treadmill', label: 'Tapis de course' },
      { key: 'elliptical', label: 'Vélo elliptique' },
      { key: 'rowing_machine', label: 'Rameur' },
      { key: 'assault_bike', label: 'Vélo assaut / air bike' },
      { key: 'stair_climber', label: 'Stepper / escalier' },
      { key: 'sled', label: 'Prowler / traîneau' }
    ]
  },
  {
    id: 'weekAlternation',
    sectionId: 'experience',
    type: 'single',
    title: 'Souhaitez-vous des variantes semaine A / semaine B dans votre programme ?',
    description:
      'Semaine A et semaine B permettent d’alterner deux listes d’exercices (ex. salle une semaine, parc l’autre). Si vous choisissez « Non », aucune variante n’apparaîtra dans l’éditeur.',
    options: [
      {
        key: 'none',
        label: 'Non — une seule liste par jour',
        description: 'Pas de variante A/B (recommandé si vous vous entraînez toujours au même endroit)'
      },
      {
        key: 'ab_enabled',
        label: 'Oui — alterner semaine A et semaine B',
        description: 'Deux variantes par jour d’entraînement, adaptées aux lieux choisis'
      }
    ]
  },
  {
    id: 'weekAlternationSites',
    sectionId: 'experience',
    type: 'multi',
    max: 2,
    title: 'Où se déroulent la semaine A et la semaine B ? (max 2 lieux)',
    description:
      'Le 1er lieu = semaine A, le 2e = semaine B. Si un seul lieu est choisi, l’app complète avec un lieu complémentaire (salle ↔ extérieur) selon votre matériel.',
    options: [
      { key: 'commercial_gym', label: 'Salle commerciale' },
      { key: 'home_gym', label: 'Salle à domicile' },
      { key: 'home_minimal', label: 'Domicile (peu de matériel)' },
      { key: 'outdoor', label: 'Extérieur / parc' },
      { key: 'track', label: 'Piste d’athlétisme' }
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
      { key: 'running_road', label: 'Course route (endurance)' },
      { key: 'running_trail', label: 'Trail / nature' },
      { key: 'running_track', label: 'Course sur piste' },
      { key: 'sprint_track', label: 'Sprint / vitesse' },
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
    id: 'stretchingHabit',
    sectionId: 'mobilite',
    type: 'single',
    title: 'À quelle fréquence vous étirez-vous (hors petit échauffement) ?',
    options: [
      { key: 'never', label: 'Presque jamais', description: 'Moins d’une fois par mois' },
      { key: 'rarely', label: 'Rarement', description: 'Quelques fois par mois' },
      { key: 'once_week', label: 'Environ 1× par semaine' },
      { key: 'two_four_week', label: '2 à 4× par semaine' },
      { key: 'five_plus_week', label: '5× par semaine ou plus' }
    ]
  },
  {
    id: 'stretchingKnowledge',
    sectionId: 'mobilite',
    type: 'single',
    title: 'Comment vous sentez-vous pour étirer correctement ?',
    description:
      'Repères généraux (Mayo Clinic, ACSM) : l’étirement régulier peut aider la souplesse et l’amplitude articulaire, la circulation musculaire et le confort au quotidien ; après échauffement léger, tenir ~30 s sans rebond, en ciblant grands groupes (mollets, cuisses, hanches, dos, nuque, épaules). Les étirements statiques intenses juste avant un sprint maximal ne sont pas idéaux — privilégier un échauffement dynamique avant l’effort intense.',
    options: [
      {
        key: 'confident',
        label: 'À l’aise : je sais quoi faire',
        description: 'Technique, durées et groupes musculaires maîtrisés'
      },
      {
        key: 'some_gaps',
        label: 'Partiellement',
        description: 'Je manque de repères (durée, respiration, ordre des groupes)'
      },
      { key: 'unsure', label: 'Peu confiant·e', description: 'Je reproduis des vidéos sans être sûr·e' },
      {
        key: 'want_guidance',
        label: 'J’aimerais des consignes guidées',
        description: 'Prêt·e à suivre des blocs simples proposés par l’app'
      }
    ]
  },
  {
    id: 'flexibilityLevel',
    sectionId: 'mobilite',
    type: 'single',
    title: 'Comment jugez-vous votre souplesse actuelle ?',
    options: [
      { key: 'very_stiff', label: 'Très raide', description: 'Amplitude limitée, inconfort fréquent' },
      { key: 'below_avg', label: 'Sous la moyenne' },
      { key: 'average', label: 'Moyenne' },
      { key: 'flexible', label: 'Souple' },
      { key: 'very_flexible', label: 'Très souple', description: 'Hyperlaxité possible — prudence sur les positions extrêmes' }
    ]
  },
  {
    id: 'stretchDistribution',
    sectionId: 'mobilite',
    type: 'single',
    title: 'Quand souhaitez-vous planifier vos étirements / mobilité ?',
    description:
      'Le programme n’ajoutera des blocs d’étirements que sur les créneaux choisis (les autres restent vides). Les jours de repos n’auront pas de routine imposée.',
    options: [
      {
        key: 'none_scheduled',
        label: 'Pas de routine planifiée',
        description: 'Je gère les étirements à part ou au feeling'
      },
      {
        key: 'morning_only',
        label: 'Matin seulement',
        description: 'Routine courte au réveil ou avant la journée'
      },
      {
        key: 'evening_only',
        label: 'Soir seulement',
        description: 'Récupération en fin de journée ou après séance'
      },
      {
        key: 'morning_evening',
        label: 'Matin et soir',
        description: 'Échauffement léger le matin, récup le soir'
      },
      {
        key: 'full_day',
        label: 'Matin, midi et soir',
        description: 'Micro-sessions réparties sur la journée'
      }
    ]
  },
  {
    id: 'cardioTrainingDesire',
    sectionId: 'mobilite',
    type: 'single',
    title: 'Quelle place voulez-vous donner au cardio dans vos séances ?',
    options: [
      { key: 'minimal', label: 'Minimale', description: 'Échauffement court, peu de volume cardio' },
      { key: 'light', label: 'Légère', description: 'Petit complément en fin de séance ou session courte' },
      { key: 'moderate', label: 'Modérée', description: 'Équilibre force / condition' },
      { key: 'high', label: 'Importante', description: 'Beaucoup de travail cardiovasculaire' },
      {
        key: 'priority_hiit',
        label: 'Priorité cardio & intervalles',
        description: 'HIIT / intervalles quand le matériel et la récup le permettent'
      }
    ]
  },
  {
    id: 'sameDayCardioAddon',
    sectionId: 'mobilite',
    type: 'single',
    title: 'Souhaitez-vous ajouter du cardio le même jour que votre séance principale ?',
    description:
      'Si oui, la durée choisie pour la séance force/street reste la même, avec environ la moitié de ce temps en cardio en plus (ex. 60 min force + ~30 min cardio).',
    options: [
      { key: 'never', label: 'Non', description: 'Cardio uniquement sur des jours dédiés' },
      { key: 'sometimes', label: 'Parfois', description: 'Quelques jours allongés dans la semaine' },
      { key: 'often', label: 'Souvent', description: 'Plusieurs séances couplées force + cardio' }
    ]
  },
  {
    id: 'circuitTrainingStyle',
    sectionId: 'mobilite',
    type: 'multi',
    max: 4,
    title: 'Quels formats d’enchaînement vous conviennent ? (plusieurs choix possibles)',
    options: [
      { key: 'prefer_straight', label: 'Plutôt séries droites', description: 'Peu de supersets' },
      { key: 'ok_finisher', label: 'Un finisher court parfois', description: 'Le cœur en classique, un mini-circuit occasionnel' },
      { key: 'like_supersets', label: 'J’aime les supersets', description: '2 exercices enchaînés régulièrement' },
      {
        key: 'love_circuits',
        label: 'J’aime les circuits métaboliques',
        description: 'Rounds de 3–5 mouvements, repos court, intensité modérée à élevée'
      }
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

