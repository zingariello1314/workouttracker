export const PROFILE_QUESTIONNAIRE_VERSION = 12;

export const QUESTION_SECTIONS = [
  { id: 'objectifs', label: 'Objectifs de la mission', color: 'violet' },
  { id: 'mission', label: 'Mission sportive (v6)', color: 'blue' },
  { id: 'experience', label: 'Expérience de combat', color: 'yellow' },
  { id: 'operations', label: 'Opérations quotidiennes', color: 'green' },
  { id: 'mobilite', label: 'Mobilité, cardio & formats de séance', color: 'cyan' },
  { id: 'course', label: 'Course à pied', color: 'sky' },
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
    id: 'primaryMission',
    sectionId: 'mission',
    type: 'multi',
    max: 3,
    showWhen: 'mission_pick',
    title: 'Quelles missions sportives te correspondent ? (jusqu’à 3)',
    description:
      'Tu peux en combiner plusieurs (ex. hypertrophie street + prépa 5 km). Le programme fusionne intelligemment volume muscu, course et structure de la semaine. Une suggestion est proposée depuis ton profil — ajuste si besoin.',
    options: [
      { key: 'hypertrophy', label: 'Hypertrophie / muscle', description: 'Priorité volume musculaire' },
      { key: 'hypertrophy_street', label: 'Hypertrophie + street', description: 'Tractions, dips, pompes' },
      { key: 'strength_max', label: 'Force max', description: 'Charges lourdes, peu de cardio' },
      { key: 'recomposition', label: 'Recomposition', description: 'Muscle + perte de gras' },
      { key: 'general_health', label: 'Santé & forme', description: 'Équilibre modéré' },
      { key: 'run_5k_10k', label: 'Préparation 5 km / 10 km', description: 'Course + entretien force' },
      { key: 'run_half', label: 'Semi-marathon', description: 'Volume course 40–80 km/sem' },
      { key: 'run_marathon', label: 'Marathon', description: 'Volume course 55–95 km/sem' },
      { key: 'run_health', label: 'Course loisir / retour', description: 'Endurance douce' },
      { key: 'hybrid_run_strength', label: 'Hybride course + muscu', description: 'Les deux mondes' },
      { key: 'triathlon', label: 'Triathlon', description: 'Multi-sport — course + force réduite' },
      { key: 'sport_collective', label: 'Sport collectif', description: 'Foot, basket, hand…' },
      { key: 'combat_sport', label: 'Sport de combat', description: 'Boxe, MMA, judo…' },
      { key: 'military_prep', label: 'Préparation militaire', description: 'Force + cardio fonctionnel' }
    ]
  },
  {
    id: 'triathlonDistance',
    sectionId: 'mission',
    type: 'single',
    showWhen: 'triathlon_module',
    title: 'Distance triathlon visée',
    description: 'Détermine le volume course hebdomadaire et la structure.',
    options: [
      { key: 'sprint', label: 'Sprint', description: '~22–38 km course/sem' },
      { key: 'olympic', label: 'Olympique', description: '~32–52 km course/sem' },
      { key: 'half_iron', label: 'Half iron (70.3)', description: '~45–70 km course/sem' },
      { key: 'iron', label: 'Iron (140.6)', description: '~58–88 km course/sem' }
    ]
  },
  {
    id: 'sportConditioningFocus',
    sectionId: 'mission',
    type: 'single',
    showWhen: 'sport_module',
    title: 'Priorité conditioning (sport / combat / militaire)',
    description: 'Affine le ratio circuits métaboliques vs force classique.',
    options: [
      { key: 'balanced', label: 'Équilibre', description: 'Force + circuits' },
      { key: 'conditioning_heavy', label: 'Conditioning dominant', description: 'Plus de circuits HIIT' },
      { key: 'strength_heavy', label: 'Force dominante', description: 'Moins de circuits, plus de muscu' }
    ]
  },
  {
    id: 'triathlonWeakLeg',
    sectionId: 'mission',
    type: 'single',
    showWhen: 'triathlon_module',
    title: 'Point faible à renforcer (triathlon)',
    description: 'Affine la répartition des intensités course (natation/vélo = plus d’endurance fond).',
    options: [
      { key: 'swim', label: 'Natation' },
      { key: 'bike', label: 'Vélo' },
      { key: 'run', label: 'Course à pied' }
    ]
  },
  {
    id: 'streetSkillGoal',
    sectionId: 'mission',
    type: 'single',
    showWhen: 'street_module',
    title: 'Objectif street / barre (facultatif)',
    description:
      'Affine les mouvements prioritaires (tractions, dips, figures). Une suggestion est déduite de tes repères si tu laisses vide.',
    options: [
      { key: 'first_pullup', label: 'Premières tractions' },
      { key: 'pullups_10', label: 'Viser 10 tractions' },
      { key: 'pullups_20', label: 'Viser 20 tractions' },
      { key: 'muscle_up', label: 'Muscle-up' },
      { key: 'front_lever', label: 'Front lever' },
      { key: 'back_lever', label: 'Back lever' },
      { key: 'planche', label: 'Planche' },
      { key: 'handstand', label: 'Handstand' },
      { key: 'street_hypertrophy', label: 'Street hypertrophie' },
      { key: 'street_general', label: 'Street général' }
    ]
  },
  {
    id: 'preferredWeeklyStructure',
    sectionId: 'mission',
    type: 'single',
    showWhen: 'structure_pick',
    title: 'Structure de semaine préférée',
    description: 'Comment répartir les séances (le moteur peut ajuster selon tes jours cochés).',
    options: [
      { key: 'upper_lower', label: 'Haut / bas alternés', description: 'Classique hypertrophie' },
      { key: 'push_pull_legs', label: 'Push / pull / legs', description: 'PPL' },
      { key: 'full_body', label: 'Full body', description: 'Tout le corps chaque séance force' },
      { key: 'running_focus', label: 'Priorité course', description: 'Majorité running' },
      { key: 'hybrid_alternating', label: 'Hybride alterné', description: 'Course + force mélangés' },
      { key: 'bro_split', label: 'Split muscle (bro)', description: 'Un groupe par jour' }
    ]
  },
  {
    id: 'hybridLayoutPreference',
    sectionId: 'mission',
    type: 'single',
    showWhen: 'hybrid_priority',
    title: 'Organisation course + muscu (hybride)',
    description: 'Comment répartir course et musculation quand tu fais les deux.',
    options: [
      { key: 'separate_days', label: 'Jours séparés', description: 'Course un jour, muscu un autre' },
      {
        key: 'same_day_strength_then_run',
        label: 'Muscu ou street, puis course en fin',
        description: 'Séance force / figures d’abord, footing ou course facile à la fin (recommandé)'
      },
      {
        key: 'same_day_easy_run',
        label: 'Course facile + muscu le même jour',
        description: 'Comme ci-dessus : course légère après la muscu'
      },
      {
        key: 'same_day_run_then_lift',
        label: 'Course puis muscu léger',
        description: 'Course en début de séance, force allégée ensuite'
      }
    ]
  },
  {
    id: 'nutritionFoodPreferences',
    sectionId: 'operations',
    type: 'nutritionFoodPrefs',
    optional: true,
    showWhen: 'mission_pick',
    title: 'Aliments préférés / à éviter (optionnel)',
    description:
      'Affine les repas suggérés avec le module Nutrition. Tu peux passer cette étape.'
  },
  {
    id: 'strengthBaselineMaxes',
    sectionId: 'experience',
    type: 'strengthBaselines',
    title: 'Repères sur les mouvements de base (facultatif)',
    description:
      'Tes max stricts aident à calibrer séries et reps du programme généré (ex. 20 pompes → séries autour de 10–12 reps).'
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
    id: 'existingProgramInApp',
    sectionId: 'experience',
    type: 'existingProgram',
    title: 'As-tu déjà un programme en cours dans l’onglet Programme ?',
    description:
      'Si oui, sélectionne-le : le coach l’analyse (durée, adhérence, type force/volume/cardio, reps moyennes) pour calibrer le prochain programme et ta note de profil.'
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
    id: 'dailyStretchMinutesBudget',
    sectionId: 'mobilite',
    type: 'single',
    title: 'Combien de temps par jour pour les étirements (hors pliométrie et drills) ?',
    description:
      'Ce budget est réparti sur les créneaux choisis ci-dessus (matin / midi / soir). Pliométrie et drills course ne sont pas décomptés ici.',
    options: [
      { key: 'none', label: 'Aucun bloc planifié', description: 'Pas d’étirements dans le programme généré' },
      { key: '5_10', label: '5–10 min / jour', description: 'Routine courte' },
      { key: '10_15', label: '10–15 min / jour', description: 'Équilibre classique' },
      { key: '15_25', label: '15–25 min / jour', description: 'Focus mobilité' },
      { key: '25_40', label: '25–40 min / jour', description: 'Gros volume souplesse' }
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
      'Un seul lieu pour la partie force/street chaque jour (pas de moitié de séance à la maison et l’autre au parc). Cette question concerne uniquement un complément cardio en fin de séance (course légère, corde, etc.), pas un deuxième lieu d’entraînement.',
    options: [
      { key: 'never', label: 'Non', description: 'Cardio uniquement sur des jours dédiés' },
      { key: 'sometimes', label: 'Parfois', description: 'Quelques jours : séance force/street + bloc cardio court' },
      { key: 'often', label: 'Souvent', description: 'Plusieurs jours avec force/street puis cardio le même jour' }
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
    id: 'neuralFatigueTolerance',
    sectionId: 'operations',
    type: 'single',
    showWhen: 'recovery_pick',
    title: 'Tolérance à la fatigue nerveuse (fractionné, charges lourdes)',
    description:
      'Influence l’espacement fractionné / jambes et les combinaisons de blocs dans le plan.',
    options: [
      { key: 'low', label: 'Faible', description: 'Je récupère lentement entre séances intenses' },
      { key: 'moderate', label: 'Modérée', description: 'Équilibre standard' },
      { key: 'high', label: 'Élevée', description: 'Je peux enchaîner qualité + jambes si le volume est raisonnable' }
    ]
  },
  {
    id: 'volumeTolerance',
    sectionId: 'operations',
    type: 'single',
    showWhen: 'recovery_pick',
    title: 'Tolérance au volume d’entraînement',
    options: [
      { key: 'low', label: 'Faible', description: 'Préfère des semaines plus légères' },
      { key: 'moderate', label: 'Modérée' },
      { key: 'high', label: 'Élevée', description: 'Supporte un gros volume si la récup suit' }
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
    id: 'runningGoal',
    sectionId: 'course',
    type: 'single',
    showWhen: 'run_module',
    title: 'Objectif course principal (Q-R1)',
    options: [
      { key: 'health', label: 'Santé / footing', description: 'Sans compétition' },
      { key: 'return_to_run', label: 'Reprise de la course', description: 'Retour progressif' },
      { key: '5k', label: '5 km', description: 'Préparation ou test 5 km' },
      { key: '10k', label: '10 km', description: 'Préparation 10 km' },
      { key: 'half_marathon', label: 'Semi-marathon', description: '21 km' },
      { key: 'marathon', label: 'Marathon', description: '42 km' },
      { key: 'sprint', label: 'Sprint / vitesse', description: 'Courtes distances' },
      { key: 'vo2max', label: 'VO₂ max / qualité', description: 'Fractionné, seuil' },
      { key: 'trail_short', label: 'Trail court', description: 'Nature, dénivelé modéré' },
      { key: 'trail_long', label: 'Trail long', description: 'Ultra trail court' }
    ]
  },
  {
    id: 'runningSessionProfile',
    sectionId: 'course',
    type: 'single',
    showWhen: 'run_module',
    title: 'Profil de séances course (Q-R3)',
    description: 'Répartition endurance / qualité / fractionné sur la semaine.',
    options: [
      { key: 'endurance', label: 'Endurance fondamentale', description: 'Majorité footing facile' },
      { key: 'mixed', label: 'Mix équilibré', description: 'Défaut recommandé' },
      { key: 'speed', label: 'Vitesse / fractionné', description: 'Plus de séances qualité' },
      { key: 'return', label: 'Reprise prudente', description: 'Très progressif' },
      { key: 'performance', label: 'Performance / chrono', description: 'Seuil et fractionné modérés' }
    ]
  },
  {
    id: 'runningWeeklyKmCurrent',
    sectionId: 'course',
    type: 'single',
    showWhen: 'run_module',
    title: 'Volume course actuel par semaine (Q-R2)',
    options: [
      { key: 'km_0', label: '0 km / débutant', description: 'Je (re)commence' },
      { key: 'km_1_10', label: '1–10 km / semaine' },
      { key: 'km_10_20', label: '10–20 km / semaine' },
      { key: 'km_20_40', label: '20–40 km / semaine' },
      { key: 'km_40_60', label: '40–60 km / semaine' },
      { key: 'km_60_80', label: '60–80 km / semaine' },
      { key: 'km_80_plus', label: '80+ km / semaine' }
    ]
  },
  {
    id: 'runningLongRunPossible',
    sectionId: 'course',
    type: 'single',
    showWhen: 'run_module',
    title: 'Peux-tu placer une sortie longue ? (Q-R4)',
    description:
      'Si tu peux courir long mais sans préférence de jour, choisis « peu importe » : le plan place la sortie longue sur le créneau le plus adapté.',
    options: [
      { key: 'yes_flexible', label: 'Oui, peu importe le jour', description: 'Le plan choisit le meilleur créneau' },
      { key: 'yes_weekend', label: 'Oui, plutôt le week-end' },
      { key: 'yes_weekday', label: 'Oui, en semaine' },
      { key: 'no', label: 'Non / pas pour l’instant' }
    ]
  },
  {
    id: 'runStrengthPriority',
    sectionId: 'course',
    type: 'single',
    showWhen: 'hybrid_priority',
    title: 'En cas de conflit course vs muscu (Q-R5)',
    options: [
      { key: 'run_first', label: 'Priorité course', description: 'Km et qualité conservés' },
      { key: 'balanced', label: 'Équilibre', description: 'Compromis' },
      { key: 'muscle_first', label: 'Priorité musculation', description: 'Séries force maintenues' },
      { key: 'maintenance_only', label: 'Muscu entretien seulement', description: 'Minimum force' }
    ]
  },
  {
    id: 'programDurationWeeks',
    sectionId: 'operations',
    type: 'single',
    showWhen: 'mission_pick',
    title: 'Durée du programme (cycle en semaines)',
    description:
      'Ton plan progresse sur plusieurs semaines (montée en charge, semaine plus légère). « Automatique » s’appuie sur ton expérience et ta durée de séance — tu peux fixer une durée si tu prépares un objectif daté.',
    options: [
      { key: 'auto', label: 'Automatique (recommandé)', description: '4 à 12 semaines selon ton profil' },
      { key: '4', label: '4 semaines', description: 'Bloc court / test' },
      { key: '6', label: '6 semaines', description: 'Standard débutant' },
      { key: '8', label: '8 semaines', description: 'Progression intermédiaire' },
      { key: '10', label: '10 semaines', description: 'Préparation structurée' },
      { key: '12', label: '12 semaines', description: 'Cycle long (semi, recomposition)' }
    ]
  },
  {
    id: 'weeklyConstraints',
    sectionId: 'operations',
    type: 'multi',
    optional: true,
    showWhen: 'mission_pick',
    title: 'Contraintes sur tout ton programme (optionnel)',
    description:
      'Coche seulement ce qui te concerne souvent. Si tu ne coches rien, le programme garde course, muscu et volume issus de tes autres réponses — rien n’est retiré.',
    options: [
      {
        key: 'limited_equipment',
        label: 'Souvent peu de matériel',
        description: 'Priorité poids du corps, haltères, élastiques — pas de grosses machines'
      },
      {
        key: 'travel_week',
        label: 'Souvent en déplacement',
        description: 'Séances un peu plus courtes, matériel léger, 1 jour de moins si besoin'
      },
      {
        key: 'no_interval_after_legs',
        label: 'Pas de fractionné juste après jambes lourdes',
        description: 'Uniquement si tu fais aussi de la course'
      },
      {
        key: 'max_session_45min',
        label: 'Séances plafonnées à ~45 min',
        description: 'Utile si tu manques souvent de temps'
      }
    ]
  },
  {
    id: 'conflictSacrificePriority',
    sectionId: 'course',
    type: 'single',
    showWhen: 'hybrid_priority',
    title: 'Si le plan doit sacrifier un pilier, tu préfères garder…',
    options: [
      { key: 'keep_strength', label: 'La force / muscu' },
      { key: 'keep_cardio', label: 'Le cardio / course' },
      { key: 'keep_legs', label: 'Le travail jambes' },
      { key: 'keep_upper', label: 'Le haut du corps' },
      { key: 'keep_mobility', label: 'Mobilité / étirements' },
      { key: 'sacrifice_nothing', label: 'Rien — réduire le volume global' }
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

