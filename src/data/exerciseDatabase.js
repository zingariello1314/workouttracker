// Base de données complète des exercices avec définitions techniques
// Chaque exercice contient : nom, catégorie, muscles primaires/secondaires, équipement, description et variations

import { EXERCISE_DATABASE_ENRICHMENT } from './exerciseDatabaseEnrichment.js';

export const exerciseDatabase = {
  // PECTORAUX
  "pompes": {
    name: "Pompes",
    category: "Pectoraux",
    primaryMuscles: ["Pectoraux", "Triceps"],
    secondaryMuscles: ["Deltoïdes antérieurs", "Core"],
    equipment: "Poids du corps",
    description: "Exercice polyarticulaire de base pour le haut du corps",
    variations: ["push-ups", "push up", "pompe", "pushups"]
  },
  "développé couché": {
    name: "Développé couché",
    category: "Pectoraux",
    primaryMuscles: ["Pectoraux"],
    secondaryMuscles: ["Triceps", "Deltoïdes antérieurs"],
    equipment: "Barre + Banc",
    description: "Exercice roi pour les pectoraux avec charge libre",
    variations: ["bench press", "dc", "développé", "dev couché"]
  },
  "développé incliné": {
    name: "Développé incliné",
    category: "Pectoraux",
    primaryMuscles: ["Pectoraux supérieurs"],
    secondaryMuscles: ["Triceps", "Deltoïdes antérieurs"],
    equipment: "Barre + Banc incliné",
    description: "Développé sur banc incliné ciblant le haut des pectoraux",
    variations: ["incline press", "di", "développé incliné"]
  },
  "écarté haltères": {
    name: "Écarté haltères",
    category: "Pectoraux",
    primaryMuscles: ["Pectoraux"],
    secondaryMuscles: [],
    equipment: "Haltères + Banc",
    description: "Exercice d'isolation pour l'étirement des pectoraux",
    variations: ["fly", "écartés", "dumbbell fly"]
  },
  "dips": {
    name: "Dips",
    category: "Pectoraux",
    primaryMuscles: ["Pectoraux inférieurs", "Triceps"],
    secondaryMuscles: ["Deltoïdes antérieurs"],
    equipment: "Barres parallèles",
    description: "Exercice au poids du corps pour pectoraux et triceps",
    variations: ["dip", "répulsions"]
  },

  // DORSAUX
  "rowing barre": {
    name: "Rowing barre",
    category: "Dorsaux",
    primaryMuscles: ["Grand dorsal", "Rhomboïdes", "Trapèzes moyens"],
    secondaryMuscles: ["Biceps", "Deltoïdes postérieurs"],
    equipment: "Barre",
    description: "Tirage horizontal pour l'épaisseur du dos",
    variations: ["barbell row", "rowing", "tirage barre"]
  },
  "tirage vertical": {
    name: "Tirage vertical",
    category: "Dorsaux",
    primaryMuscles: ["Grand dorsal"],
    secondaryMuscles: ["Biceps", "Rhomboïdes"],
    equipment: "Poulie haute",
    description: "Alternative aux tractions sur machine",
    variations: ["lat pulldown", "tirage poulie haute"]
  },
  "rowing haltère": {
    name: "Rowing haltère",
    category: "Dorsaux",
    primaryMuscles: ["Grand dorsal", "Rhomboïdes"],
    secondaryMuscles: ["Biceps", "Trapèzes"],
    equipment: "Haltère + Banc",
    description: "Rowing unilatéral pour correction des déséquilibres",
    variations: ["one arm row", "rowing 1 bras"]
  },
  "soulevé de terre": {
    name: "Soulevé de terre",
    category: "Dorsaux",
    primaryMuscles: ["Érecteurs du rachis", "Grand dorsal", "Trapèzes"],
    secondaryMuscles: ["Fessiers", "Ischio-jambiers", "Quadriceps"],
    equipment: "Barre",
    description: "Exercice polyarticulaire complet pour tout le corps",
    variations: ["deadlift", "sdt", "soulevé terre"]
  },

  // ÉPAULES
  "développé militaire": {
    name: "Développé militaire",
    category: "Épaules",
    primaryMuscles: ["Deltoïdes"],
    secondaryMuscles: ["Triceps", "Trapèzes supérieurs"],
    equipment: "Barre",
    description: "Développé debout pour les épaules et la stabilité",
    variations: ["military press", "overhead press", "dm"]
  },
  "élévations latérales": {
    name: "Élévations latérales",
    category: "Épaules",
    primaryMuscles: ["Deltoïdes moyens"],
    secondaryMuscles: [],
    equipment: "Haltères",
    description: "Isolation pour la largeur des épaules",
    variations: ["lateral raises", "élévations", "side raises"]
  },
  "élévations frontales": {
    name: "Élévations frontales",
    category: "Épaules",
    primaryMuscles: ["Deltoïdes antérieurs"],
    secondaryMuscles: [],
    equipment: "Haltères",
    description: "Isolation pour l'avant des épaules",
    variations: ["front raises", "élévations avant"]
  },
  "oiseau": {
    name: "Oiseau",
    category: "Épaules",
    primaryMuscles: ["Deltoïdes postérieurs"],
    secondaryMuscles: ["Rhomboïdes", "Trapèzes moyens"],
    equipment: "Haltères",
    description: "Isolation pour l'arrière des épaules",
    variations: ["reverse fly", "rear delt fly", "oiseaux"]
  },
  "shrugs": {
    name: "Shrugs",
    category: "Épaules",
    primaryMuscles: ["Trapèzes supérieurs"],
    secondaryMuscles: [],
    equipment: "Haltères/Barre",
    description: "Haussements d'épaules pour les trapèzes",
    variations: ["haussements", "shrug"]
  },

  // BICEPS
  "curl barre": {
    name: "Curl barre",
    category: "Biceps",
    primaryMuscles: ["Biceps brachial"],
    secondaryMuscles: ["Brachial antérieur"],
    equipment: "Barre",
    description: "Exercice de base pour les biceps",
    variations: ["barbell curl", "curl", "flexion barre"]
  },
  "curl haltères": {
    name: "Curl haltères",
    category: "Biceps",
    primaryMuscles: ["Biceps brachial"],
    secondaryMuscles: ["Brachial antérieur"],
    equipment: "Haltères",
    description: "Curl avec haltères pour amplitude complète",
    variations: ["dumbbell curl", "curl alterné"]
  },
  "curl marteau": {
    name: "Curl marteau",
    category: "Biceps",
    primaryMuscles: ["Brachial antérieur", "Brachio-radial"],
    secondaryMuscles: ["Biceps brachial"],
    equipment: "Haltères",
    description: "Curl prise neutre pour l'épaisseur du bras",
    variations: ["hammer curl", "curl neutre"]
  },
  "curl pupitre": {
    name: "Curl pupitre",
    category: "Biceps",
    primaryMuscles: ["Biceps brachial"],
    secondaryMuscles: [],
    equipment: "Banc pupitre + Barre/Haltères",
    description: "Curl avec support pour isolation stricte",
    variations: ["preacher curl", "curl larry scott"]
  },

  // TRICEPS
  "barre au front": {
    name: "Barre au front",
    category: "Triceps",
    primaryMuscles: ["Triceps"],
    secondaryMuscles: [],
    equipment: "Barre + Banc",
    description: "Extension triceps couché ciblant la longue portion",
    variations: ["skull crusher", "lying tricep extension", "french press"]
  },
  "extension triceps": {
    name: "Extension triceps",
    category: "Triceps",
    primaryMuscles: ["Triceps"],
    secondaryMuscles: [],
    equipment: "Haltère",
    description: "Extension triceps debout ou assis",
    variations: ["overhead extension", "extension nuque"]
  },
  "extension poulie": {
    name: "Extension poulie",
    category: "Triceps",
    primaryMuscles: ["Triceps"],
    secondaryMuscles: [],
    equipment: "Poulie haute",
    description: "Extension triceps à la poulie",
    variations: ["tricep pushdown", "extension câble"]
  },
  "dips triceps": {
    name: "Dips triceps",
    category: "Triceps",
    primaryMuscles: ["Triceps"],
    secondaryMuscles: ["Pectoraux inférieurs"],
    equipment: "Chaise/Banc",
    description: "Dips sur chaise ciblant les triceps",
    variations: ["bench dips", "dips chaise"]
  },

  // QUADRICEPS
  "squat": {
    name: "Squat",
    category: "Quadriceps",
    primaryMuscles: ["Quadriceps"],
    secondaryMuscles: ["Fessiers", "Ischio-jambiers"],
    equipment: "Barre",
    description: "Exercice roi pour les jambes",
    variations: ["back squat", "squats"]
  },
  "fentes": {
    name: "Fentes",
    category: "Quadriceps",
    primaryMuscles: ["Quadriceps"],
    secondaryMuscles: ["Fessiers", "Ischio-jambiers"],
    equipment: "Haltères/Barre",
    description: "Exercice unilatéral pour les jambes",
    variations: ["lunges", "fente", "split squat"]
  },
  "presse à cuisses": {
    name: "Presse à cuisses",
    category: "Quadriceps",
    primaryMuscles: ["Quadriceps"],
    secondaryMuscles: ["Fessiers"],
    equipment: "Machine presse",
    description: "Squat guidé sur machine",
    variations: ["leg press", "presse"]
  },
  "squat gobelet": {
    name: "Squat gobelet",
    category: "Quadriceps",
    primaryMuscles: ["Quadriceps"],
    secondaryMuscles: ["Fessiers", "Core"],
    equipment: "Haltère/Kettlebell",
    description: "Squat avec charge devant pour apprendre le mouvement",
    variations: ["goblet squat", "squat haltère"]
  },

  // ISCHIO-JAMBIERS
  "soulevé de terre jambes tendues": {
    name: "Soulevé de terre jambes tendues",
    category: "Ischio-jambiers",
    primaryMuscles: ["Ischio-jambiers"],
    secondaryMuscles: ["Fessiers", "Érecteurs du rachis"],
    equipment: "Barre/Haltères",
    description: "Variante du SDT ciblant les ischio-jambiers",
    variations: ["stiff leg deadlift", "sdt jambes tendues", "romanian deadlift"]
  },
  "curl nordique": {
    name: "Curl nordique",
    category: "Ischio-jambiers",
    primaryMuscles: ["Ischio-jambiers"],
    secondaryMuscles: [],
    equipment: "Poids du corps",
    description: "Exercice excentrique avancé pour les ischio-jambiers",
    variations: ["nordic curl", "nordic hamstring"]
  },

  // MOLLETS
  "mollets debout": {
    name: "Mollets debout",
    category: "Mollets",
    primaryMuscles: ["Gastrocnémiens"],
    secondaryMuscles: ["Soléaires"],
    equipment: "Haltères/Machine",
    description: "Élévations sur la pointe des pieds",
    variations: ["calf raises", "mollets", "standing calf raises"]
  },
  "mollets assis": {
    name: "Mollets assis",
    category: "Mollets",
    primaryMuscles: ["Soléaires"],
    secondaryMuscles: [],
    equipment: "Machine mollets assis",
    description: "Mollets en position assise ciblant les soléaires",
    variations: ["seated calf raises", "mollets machine"]
  },
  "élévations de mollets pointes extérieur": {
    name: "Élévations de mollets — pointes de pieds vers l’extérieur",
    category: "Mollets",
    primaryMuscles: ["Gastrocnémien médial", "Gastrocnémiens", "Soléaire"],
    secondaryMuscles: ["Tibial postérieur", "Fléchisseurs des orteils"],
    equipment: "Poids du corps / Haltères",
    difficulty: 1,
    summary: "Calf raise toes-out · accent chef médial · flexion plantaire contrôlée",
    description:
      "Variante du calf raise avec une légère rotation externe des pieds : les orteils s’éloignent l’un de l’autre (petit « V ») tandis que les talons restent relativement plus proches. Le mouvement reste une flexion plantaire de la cheville : depuis une position basse, pousser dans l’avant-pied pour décoller les talons et monter le plus haut possible sur les orteils, puis redescendre lentement sous contrôle. La rotation ne constitue pas le mouvement : elle oriente simplement le pied. Une rotation légère et naturelle suffit ; forcer fortement les pieds vers l’extérieur n’est pas nécessaire. Corps droit, genoux stables, effort principalement à la cheville. Un support tenu légèrement avec les mains peut supprimer les problèmes d’équilibre. Réalisable au poids du corps, sur une marche pour l’amplitude, ou avec une charge lorsque le poids du corps devient insuffisant.\n\n" +
      "Muscles ciblés : comme toute élévation de mollets, le gastrocnémien et le soléaire (triceps sural) sont les moteurs principaux. Le gastrocnémien, muscle superficiel à deux chefs (médial et latéral), traverse genou et cheville ; le soléaire, plus profond, ne traverse que la cheville. Debout genou relativement tendu, les deux participent, avec une contribution importante du gastrocnémien. Le tibial postérieur et certains fléchisseurs des orteils aident à la flexion plantaire et à la stabilisation, sans être la cible principale.\n\n" +
      "Ce que change réellement la rotation vers l’extérieur : ce n’est pas qu’une sensation. L’EMG montre qu’une position toes-out augmente relativement l’activité du gastrocnémien médial par rapport au chef latéral, tandis que toes-in tend à favoriser le chef latéral. Des travaux sur la commande des unités motrices retrouvent aussi une augmentation de la commande neurale du chef médial pieds tournés vers l’extérieur, avec une diminution relative du chef latéral. C’est une accentuation, pas une isolation : le chef latéral et le soléaire restent fortement impliqués.\n\n" +
      "Exécution : debout, pieds approximativement à largeur de bassin, pointes légèrement vers l’extérieur. Poids réparti de manière stable sur l’avant-pied, sans écraser volontairement le bord interne ou externe. Pousse progressivement dans l’avant-pied et élève les talons aussi haut que possible — le mouvement est initié par la cheville, le corps monte verticalement. En haut, contraction volontaire du mollet, courte pause si utile. Descente lente : chaque répétition est une flexion plantaire contrôlée, pas un rebond de tout le corps. Tempo type 2-0-1-1 ou 3-1-1-1.\n\n" +
      "Amplitude : depuis une dorsiflexion confortable en bas, flexion plantaire complète en haut. Sur une marche, le talon peut descendre légèrement sous le niveau de l’avant-pied — sans chercher un étirement douloureux du tendon d’Achille. Le complexe gastrocnémien–soléaire–tendon d’Achille a une forte composante élastique : un rebond déplace de la charge sans le même travail musculaire volontaire qu’une répétition contrôlée.\n\n" +
      "Intérêt : développer le mollet en orientant davantage le stimulus vers le chef médial (partie interne, volume visible). Une étude d’entraînement de neuf semaines a observé une augmentation plus importante de l’épaisseur du gastrocnémien médial en position vers l’extérieur, et l’inverse pour le chef latéral en position vers l’intérieur. À interpréter avec prudence (groupe restreint, protocole spécifique) : ce n’est pas un moyen magique de remodeler le mollet. Le facteur déterminant reste tension progressive, amplitude maîtrisée et volume. Le soléaire continue de participer quelle que soit l’orientation du pied ; pour le cibler davantage, la variable pertinente est le genou fléchi (mollets assis).\n\n" +
      "Erreurs : tourner excessivement les pieds ; laisser les genoux rentrer ou partir ; rouler sur le bord interne du pied ; rebondir en bas ; n’effectuer que la partie haute ; chercher une sensation interne à tout prix au détriment de la stabilité.\n\n" +
      "Programmation : variation ciblée au sein d’un travail complet des mollets, pas un remplacement de l’élévation classique. 3–4 × 10–20 reps, charge progressive. La position des pieds est un outil supplémentaire, pas le facteur principal d’hypertrophie.\n\n" +
      "À retenir : légère rotation externe, pied stable, genoux contrôlés, montée complète, contraction haute, descente lente. Accentue le chef médial au sein d’un mouvement qui continue de solliciter l’ensemble du complexe du mollet.",
    variations: [
      "élévations de mollets — pointes de pieds vers l’extérieur",
      "élévations de mollets pointes extérieur",
      "mollets pointes extérieur",
      "mollets pointes dehors",
      "toes out calf raise",
      "toes-out calf raises",
      "calf raise toes out",
      "standing calf raise toes out"
    ]
  },
  "élévations de mollets pointes intérieur": {
    name: "Élévations de mollets — pointes de pieds vers l’intérieur",
    category: "Mollets",
    primaryMuscles: ["Gastrocnémien latéral", "Gastrocnémiens", "Soléaire"],
    secondaryMuscles: ["Fibulaires", "Tibial postérieur"],
    equipment: "Poids du corps / Haltères",
    difficulty: 1,
    summary: "Calf raise toes-in · variation d’orientation · pas une isolation du chef latéral",
    description:
      "Variante du calf raise classique avec une légère rotation interne : les orteils se rapprochent l’un de l’autre tandis que les talons restent légèrement plus éloignés. Le mouvement principal reste identique : flexion plantaire de la cheville — pousser l’avant-pied vers le sol et élever le talon. Debout, généralement jambes tendues, poids sur l’avant-pied ; depuis une position basse, pousser progressivement à travers les orteils jusqu’à monter le plus haut possible, puis redescendre sous contrôle. La rotation n’est pas le mouvement : elle modifie seulement l’orientation du pied pendant l’élévation.\n\n" +
      "Muscles principalement sollicités : le triceps sural (gastrocnémien médial et latéral + soléaire), qui converge vers le tendon d’Achille et le calcanéus. Fonction commune : flexion plantaire. Debout genou relativement tendu, le gastrocnémien est dans une position favorable, sans que le soléaire soit « désactivé ». À l’inverse, genou fortement fléchi (mollets assis), le gastrocnémien est désavantagé et le soléaire prend davantage d’importance. Le tibial postérieur (inversion + flexion plantaire) et les fibulaires (contrôle latéral) participent à la stabilisation du pied.\n\n" +
      "Ce que change réellement la position vers l’intérieur : l’affirmation « pointes vers l’intérieur = mollet externe » est trop simplifiée. Les deux chefs restent impliqués avec le soléaire. La rotation interne modifie la mécanique pied-cheville et peut légèrement changer sensations et répartition d’activité, mais elle n’isole pas le chef latéral. Pour la masse du mollet, amplitude, charge, proximité de l’échec et progression comptent bien plus que quelques degrés de rotation. La distinction genou tendu / genou fléchi a beaucoup plus de valeur.\n\n" +
      "Exécution : debout, pieds environ à largeur de bassin, pointes légèrement vers l’intérieur — une position naturelle suffit, pas les orteils face à face. Jambes stables, tronc droit. Si tu tiens un support, sers-t’en pour l’équilibre, pas pour te tirer vers le haut. Pousse activement l’avant-pied : imagine éloigner le corps du sol uniquement par la cheville. Monte réellement haut sur les orteils sans déformer le pied, courte contraction en haut, descente contrôlée. Les genoux ne fléchissent pas à chaque répétition ; le bassin ne rebondit pas ; on ne déplace pas volontairement la pression sur le bord du pied pour « trouver » un chef.\n\n" +
      "Amplitude et contrôle : une erreur fréquente consiste à ne faire que la partie haute, charger lourd et rebondir. Une bonne répétition commence bas, contrôlée, puis monte complètement. Sur une marche, le talon peut descendre sous l’avant-pied si la mobilité le permet, sans transformer le mouvement en étirement brutal du tendon d’Achille. Montée dynamique mais maîtrisée, descente contrôlée : plus le mouvement rebondit, plus le travail bascule vers les structures élastiques.\n\n" +
      "Intérêt : force et masse des fléchisseurs plantaires (marche, course, sauts, accélérations, propulsion), au-delà de l’esthétique. Exercice simple à charger progressivement (poids du corps, unilatéral, haltère, machine). Le mollet, habitué au travail quotidien répétitif, a généralement besoin d’une résistance suffisante et de séries proches de la limite technique. Cette variante propose une variation d’orientation, pas un ciblage magique de l’extérieur du mollet.\n\n" +
      "Erreurs : tourner excessivement les pieds ; rebondir en bas ; ne faire que la moitié haute ; charger trop lourd et tricher avec genoux, bassin ou élan ; écraser le bord externe de l’avant-pied ; négliger le genou tendu si l’objectif est le gastrocnémien.\n\n" +
      "Programmation : complément d’une élévation classique pieds naturels, pas une obsession d’angle. 3–4 × 10–20 reps. Pour un mollet complet, combiner genou tendu (gastrocnémien) et genou fléchi (soléaire) reste plus déterminant que l’orientation des orteils.\n\n" +
      "À retenir : pieds légèrement tournés vers l’intérieur → genoux stables → talons abaissés sous contrôle → poussée forte dans l’avant-pied → montée maximale → courte contraction → descente lente. Variation d’angle ≠ isolation musculaire.",
    variations: [
      "élévations de mollets — pointes de pieds vers l’intérieur",
      "élévations de mollets pointes intérieur",
      "mollets pointes intérieur",
      "mollets pointes dedans",
      "toes in calf raise",
      "toes-in calf raises",
      "calf raise toes in",
      "standing calf raise toes in"
    ]
  },

  // ABDOMINAUX
  "crunchs": {
    name: "Crunchs",
    category: "Abdominaux",
    primaryMuscles: ["Grand droit de l'abdomen"],
    secondaryMuscles: [],
    equipment: "Poids du corps",
    description: "Exercice de base pour les abdominaux",
    variations: ["crunch", "abdos", "sit-ups partiels"]
  },
  "gainage": {
    name: "Gainage",
    category: "Abdominaux",
    primaryMuscles: ["Transverse", "Grand droit"],
    secondaryMuscles: ["Obliques", "Érecteurs du rachis"],
    equipment: "Poids du corps",
    description: "Exercice isométrique pour le core",
    variations: ["plank", "planche", "gainage ventral"]
  },
  "relevé de jambes": {
    name: "Relevé de jambes",
    category: "Abdominaux",
    primaryMuscles: ["Grand droit de l'abdomen"],
    secondaryMuscles: ["Fléchisseurs de hanche"],
    equipment: "Poids du corps",
    description: "Exercice ciblant la partie basse des abdominaux",
    variations: ["leg raises", "relevés jambes", "élévations jambes"]
  },

  // EXERCICES STREET WORKOUT & CALISTHENICS
  "tractions australiennes": {
    name: "Tractions australiennes",
    category: "Dorsaux",
    primaryMuscles: ["Grand dorsal", "Rhomboïdes", "Trapèzes moyens"],
    secondaryMuscles: ["Biceps", "Deltoïdes postérieurs"],
    equipment: "Barre basse",
    description: "Tractions horizontales au poids du corps, excellent pour débuter",
    variations: ["rowing inversé", "body rows", "tractions horizontales"]
  },
  "pompes inclinées": {
    name: "Pompes inclinées",
    category: "Pectoraux",
    primaryMuscles: ["Pectoraux"],
    secondaryMuscles: ["Triceps", "Deltoïdes antérieurs"],
    equipment: "Support/Banc",
    description: "Pompes avec inclinaison pour cibler différentes parties des pectoraux",
    variations: ["pompes pieds surélevés", "pompes mains surélevées", "incline push-ups"]
  },
  "pompes lestées": {
    name: "Pompes lestées",
    category: "Pectoraux",
    primaryMuscles: ["Pectoraux"],
    secondaryMuscles: ["Triceps", "Deltoïdes antérieurs"],
    equipment: "Gilet lesté",
    description: "Pompes avec charge additionnelle pour augmenter la difficulté",
    variations: ["pompes avec poids", "weighted push-ups"]
  },
  "pompes serrées": {
    name: "Pompes serrées",
    category: "Triceps",
    primaryMuscles: ["Triceps"],
    secondaryMuscles: ["Pectoraux", "Deltoïdes antérieurs"],
    equipment: "Poids du corps",
    description: "Pompes avec mains rapprochées ciblant les triceps",
    variations: ["pompes diamant", "diamond push-ups", "close grip push-ups"]
  },
  "pompes déclinées": {
    name: "Pompes déclinées",
    category: "Pectoraux",
    primaryMuscles: ["Pectoraux supérieurs"],
    secondaryMuscles: ["Triceps", "Deltoïdes antérieurs"],
    equipment: "Support",
    description: "Pompes pieds surélevés ciblant le haut des pectoraux",
    variations: ["decline push-ups", "pompes pieds hauts", "pompes en tension continue déclinées"]
  },
  "pompes pseudo-planche": {
    name: "Pompes pseudo-planche",
    category: "Pectoraux",
    primaryMuscles: ["Pectoraux supérieurs", "Deltoïdes antérieurs"],
    secondaryMuscles: ["Triceps", "Core"],
    equipment: "Poids du corps",
    description: "Pompes avancées avec mains positionnées vers l'arrière",
    variations: ["pseudo planche push-ups", "lean forward push-ups"]
  },
  "pompes sur poignées": {
    name: "Pompes sur poignées",
    category: "Pectoraux",
    primaryMuscles: ["Pectoraux"],
    secondaryMuscles: ["Triceps", "Deltoïdes antérieurs"],
    equipment: "Poignées de pompes",
    description: "Pompes avec amplitude augmentée grâce aux poignées",
    variations: ["push-up handles", "pompes profondes"]
  },
  "pompes en tension continue": {
    name: "Pompes en tension continue",
    category: "Pectoraux",
    primaryMuscles: ["Pectoraux", "Triceps brachial", "Deltoïde antérieur"],
    secondaryMuscles: [
      "Dentelé antérieur",
      "Abdominaux",
      "Obliques",
      "Transverse",
      "Fessiers",
      "Lombaires",
      "Avant-bras"
    ],
    equipment: "Poids du corps",
    difficulty: 2,
    summary: "Sans verrouillage · congestion · temps sous tension élevé",
    description:
      "Objectif : maintenir les pectoraux sous tension du début à la fin de la série — pas de repos en position haute (pas de verrouillage des coudes). Maximise la congestion, le stress métabolique et le temps sous tension (TUT), avec une excellente connexion cerveau-muscle.\n\n" +
      "Exécution : mains légèrement plus larges que les épaules, poignets sous les épaules, corps gainé, fessiers et abdos serrés. Descente lente (2–3 s), coudes à 30–60° du buste, presque jusqu’au sol. Remontée jusqu’à environ 80–90 % de l’amplitude seulement — les coudes restent légèrement fléchis, les pectoraux ne se relâchent jamais. Respiration : inspirer en descendant, expirer en montant. Rythme type 2-0-1-0 ou 3-0-1-0, sans pause en haut.\n\n" +
      "Variantes d’angle (même principe sans lockout) : mains sur support → accent bas des pectoraux ; pieds surélevés → accent haut des pectoraux ; prise large → étirement / faisceau externe ; prise serrée → triceps et portion interne.\n\n" +
      "Erreurs : verrouiller les bras en haut ; remonter trop vite ; amplitude de descente insuffisante ; creuser le dos ; coudes à 90°.\n\n" +
      "Idéal en finition (12–25 reps), débutant à avancé. Moins orienté force max / explosivité ; très efficace pour hypertrophie et endurance musculaire par congestion.",
    variations: [
      "constant tension push-ups",
      "continuous tension push-ups",
      "no lockout push-ups",
      "pompes tension continue",
      "pompes sans verrouillage",
      "pompes petite amplitude",
      "pompes en tension continue déclinées"
    ]
  },

  // ABDOMINAUX & CORE AVANCÉS
  "relevés de genoux": {
    name: "Relevés de genoux",
    category: "Abdominaux",
    primaryMuscles: ["Grand droit de l'abdomen", "Fléchisseurs de hanche"],
    secondaryMuscles: ["Obliques"],
    equipment: "Barre/Parallèles",
    description: "Exercice suspendu ciblant les abdominaux inférieurs",
    variations: ["knee raises", "relevés genoux barre", "hanging knee raises", "relevés de genoux à la barre", "knee raises bar"]
  },
  "mountain climbers": {
    name: "Mountain climbers",
    category: "Abdominaux",
    primaryMuscles: ["Core", "Grand droit"],
    secondaryMuscles: ["Quadriceps", "Deltoïdes"],
    equipment: "Poids du corps",
    description: "Exercice cardio-abdominaux dynamique",
    variations: ["grimpeurs", "mountain climber", "alternating knee to chest"]
  },
  "gainage latéral": {
    name: "Gainage latéral",
    category: "Abdominaux",
    primaryMuscles: ["Obliques", "Carré des lombes"],
    secondaryMuscles: ["Transverse", "Fessiers"],
    equipment: "Poids du corps",
    description: "Planche latérale pour renforcer les obliques",
    variations: ["side plank", "planche côté", "gainage côté"]
  },
  "crunchs inversés": {
    name: "Crunchs inversés",
    category: "Abdominaux",
    primaryMuscles: ["Grand droit de l'abdomen"],
    secondaryMuscles: ["Fléchisseurs de hanche"],
    equipment: "Poids du corps",
    description: "Crunchs en ramenant les genoux vers la poitrine",
    variations: ["reverse crunch", "crunch inversé", "relevé bassin"]
  },
  "vacuum": {
    name: "Vacuum",
    category: "Abdominaux",
    primaryMuscles: ["Transverse de l'abdomen"],
    secondaryMuscles: ["Diaphragme"],
    equipment: "Poids du corps",
    description: "Exercice de respiration pour le transverse profond",
    variations: ["stomach vacuum", "aspiration abdominale"]
  },
  "crunch bicyclettes": {
    name: "Crunch bicyclettes",
    category: "Abdominaux",
    primaryMuscles: ["Grand droit", "Obliques"],
    secondaryMuscles: ["Fléchisseurs de hanche"],
    equipment: "Poids du corps",
    description: "Crunchs alternés simulant le pédalage",
    variations: ["bicycle crunch", "pédalage abdominal"]
  },

  // BICEPS SPÉCIALISÉS
  "curl zottman": {
    name: "Curl Zottman",
    category: "Biceps",
    primaryMuscles: ["Biceps brachial", "Brachial antérieur"],
    secondaryMuscles: ["Brachio-radial"],
    equipment: "Haltères",
    description: "Curl avec rotation : montée supination, descente pronation",
    variations: ["zottman curl", "curl rotation"]
  },
  "curl concentration": {
    name: "Curl concentration",
    category: "Biceps",
    primaryMuscles: ["Biceps brachial"],
    secondaryMuscles: [],
    equipment: "Haltère",
    description: "Curl assis avec coude appuyé pour isolation maximale",
    variations: ["concentration curl", "curl concentré"]
  },
  "curl incliné": {
    name: "Curl incliné",
    category: "Biceps",
    primaryMuscles: ["Biceps brachial"],
    secondaryMuscles: ["Brachial antérieur"],
    equipment: "Haltères + Banc incliné",
    description: "Curl sur banc incliné pour étirement maximal des biceps",
    variations: ["incline curl", "curl banc incliné"]
  },
  "curl poulie basse": {
    name: "Curl poulie basse",
    category: "Biceps",
    primaryMuscles: ["Biceps brachial"],
    secondaryMuscles: ["Brachial antérieur"],
    equipment: "Poulie basse",
    description: "Curl à la poulie pour tension constante",
    variations: ["cable curl", "curl câble"]
  },

  // TRICEPS SPÉCIALISÉS
  "extensions triceps unilatérales": {
    name: "Extensions triceps unilatérales",
    category: "Triceps",
    primaryMuscles: ["Triceps"],
    secondaryMuscles: [],
    equipment: "Haltère",
    description: "Extension triceps un bras pour correction des déséquilibres",
    variations: ["extension triceps 1 bras", "overhead extension"]
  },
  "extension triceps debout haltère": {
    name: "Extension triceps debout avec haltère",
    category: "Triceps",
    primaryMuscles: ["Triceps"],
    secondaryMuscles: [],
    equipment: "Haltère",
    difficulty: 2,
    description:
      "Extension des triceps debout, haltère tenu au-dessus de la tête à deux mains (ou un haltère par bras). Étire la longue portion en position haute puis fléchit les coudes derrière la tête avant d'étendre complètement les bras sans verrouiller les articulations.\n\n" +
      "Exécution : pieds largeur hanches, gainage actif, coudes pointés vers le plafond et rapprochés de la tête. Descends l'haltère lentement derrière la nuque en gardant les épaules basses, puis remonte en contractant les triceps. Évite d'arquer le bas du dos : serre les abdominaux et fléchis légèrement les genoux si besoin.\n\n" +
      "Erreurs fréquentes : écarter les coudes sur les côtés, cambrer le dos, utiliser l'élan du buste, amplitude trop courte en bas.\n\n" +
      "Séries types : 3–4 × 10–15 reps. Difficulté intermédiaire (≈ 6/10) — demande une bonne mobilité d'épaule et un contrôle du tronc.",
    variations: [
      "extension triceps debout avec haltère",
      "extension triceps debout avec une haltère",
      "extension triceps debout haltère",
      "standing dumbbell tricep extension",
      "overhead tricep extension standing",
      "extension nuque debout haltère",
      "two arm dumbbell tricep extension"
    ]
  },
  "kickbacks triceps": {
    name: "Kickbacks triceps",
    category: "Triceps",
    primaryMuscles: ["Triceps"],
    secondaryMuscles: [],
    equipment: "Haltère",
    description: "Extension triceps penché en arrière",
    variations: ["tricep kickback", "extension arrière"]
  },
  "extension poulie corde": {
    name: "Extension poulie corde",
    category: "Triceps",
    primaryMuscles: ["Triceps"],
    secondaryMuscles: [],
    equipment: "Poulie haute + Corde",
    description: "Extension triceps à la poulie avec corde",
    variations: ["rope pushdown", "extension corde", "extension à la poulie corde", "tricep rope extension"]
  },
  "extension poulie pronation": {
    name: "Extension poulie pronation",
    category: "Triceps",
    primaryMuscles: ["Triceps"],
    secondaryMuscles: [],
    equipment: "Poulie haute",
    description: "Extension triceps prise pronation ciblant le vaste latéral",
    variations: ["pronated pushdown", "extension pronation", "extension poulie prise pronation", "overhand pushdown"]
  },
  "extension poulie supination": {
    name: "Extension poulie supination",
    category: "Triceps",
    primaryMuscles: ["Triceps"],
    secondaryMuscles: [],
    equipment: "Poulie haute",
    description: "Extension triceps prise supination pour la longue portion",
    variations: ["supinated pushdown", "extension supination", "extension poulie prise supination", "underhand pushdown"]
  },

  // ÉPAULES SPÉCIALISÉES
  "face pull": {
    name: "Face pull",
    category: "Épaules",
    primaryMuscles: ["Deltoïdes postérieurs", "Trapèzes moyens"],
    secondaryMuscles: ["Rhomboïdes"],
    equipment: "Élastique/Poulie",
    description: "Tirage vers le visage pour l'arrière des épaules",
    variations: ["face pull élastique", "rear delt pull"]
  },
  "oiseaux penché": {
    name: "Oiseaux penché",
    category: "Épaules",
    primaryMuscles: ["Deltoïdes postérieurs"],
    secondaryMuscles: ["Rhomboïdes", "Trapèzes moyens"],
    equipment: "Haltères",
    description: "Élévations postérieures en position penchée",
    variations: ["bent over reverse fly", "oiseau debout penché"]
  },

  // HAUT DU CORPS - ENRICHISSEMENT
  "développé décliné barre": {
    name: "Développé décliné barre",
    category: "Pectoraux",
    primaryMuscles: ["Pectoraux inférieurs"],
    secondaryMuscles: ["Triceps", "Deltoïdes antérieurs"],
    equipment: "Barre + Banc décliné",
    description: "Développé couché en inclinaison négative pour accent bas de poitrine",
    variations: ["decline bench press", "decline barbell press", "dc décliné barre"]
  },
  "développé décliné haltères": {
    name: "Développé couché décliné aux haltères",
    category: "Pectoraux",
    primaryMuscles: ["Pectoraux inférieurs"],
    secondaryMuscles: ["Triceps brachial", "Deltoïdes antérieurs"],
    equipment: "Haltères + Banc décliné",
    difficulty: 2,
    summary: "Développé décliné haltères — bas des pectoraux",
    description:
      "Exercice de musculation sur banc décliné (environ −15° à −30°) avec deux haltères. Cible la portion inférieure des pectoraux (bas des pecs), avec sollicitation des triceps et des deltoïdes antérieurs. Les haltères offrent une amplitude supérieure à la barre et corrigent les déséquilibres gauche/droite.\n\n" +
      "Exécution : banc décliné modéré, pieds bien calés dans les supports, omoplates rapprochées et poitrine sortie. Monte les haltères au-dessus de la poitrine basse, bras tendus. Descends en 2–3 s, coudes à 45–60° du buste, jusqu'à la ligne des mamelons ou légèrement en dessous. Pousse vers le haut en contractant les pectoraux, sans décoller les épaules ni cambrer excessivement.\n\n" +
      "Erreurs fréquentes : déclinaison excessive qui charge trop les épaules ; rebond en bas ; coudes ouverts à 90° ; perte de contrôle des haltères en bas de course.\n\n" +
      "Tempo classique : 2-0-1-0 ou 3-0-1-0. Séries types : 3–4 × 8–12 reps. Difficulté intermédiaire (≈ 6/10) — légèrement plus technique qu'au plat à cause de la position déclinée.",
    variations: [
      "decline dumbbell press",
      "dc décliné haltères",
      "décliné haltères",
      "développé décliné haltères",
      "flat decline db press"
    ]
  },
  "développé couché prise serrée": {
    name: "Développé couché prise serrée",
    category: "Triceps",
    primaryMuscles: ["Triceps"],
    secondaryMuscles: ["Pectoraux", "Deltoïdes antérieurs"],
    equipment: "Barre + Banc",
    description: "Variante du développé couché orientée triceps avec prise rapprochée",
    variations: ["close grip bench press", "dc prise serrée", "bench press close grip"]
  },
  "chest press machine": {
    name: "Chest press machine",
    category: "Pectoraux",
    primaryMuscles: ["Pectoraux"],
    secondaryMuscles: ["Triceps", "Deltoïdes antérieurs"],
    equipment: "Machine chest press",
    description: "Poussée guidée sur machine pour pectoraux avec trajectoire stable",
    variations: ["machine chest press", "presse pectoraux machine", "chest press"]
  },
  "pec deck": {
    name: "Pec deck",
    category: "Pectoraux",
    primaryMuscles: ["Pectoraux"],
    secondaryMuscles: ["Deltoïdes antérieurs"],
    equipment: "Machine pec deck",
    description: "Écarté guidé sur machine pour isolation des pectoraux",
    variations: ["butterfly machine", "écarté machine", "pec fly machine"]
  },
  "pompes archer": {
    name: "Pompes archer",
    category: "Pectoraux",
    primaryMuscles: ["Pectoraux", "Triceps"],
    secondaryMuscles: ["Deltoïdes antérieurs", "Core"],
    equipment: "Poids du corps",
    description: "Pompes asymétriques accentuant la charge sur un bras à la fois",
    variations: ["archer push-ups", "pompes asymétriques", "archer push ups"]
  },
  "pompes claquées": {
    name: "Pompes claquées",
    category: "Pectoraux",
    primaryMuscles: ["Pectoraux", "Triceps"],
    secondaryMuscles: ["Deltoïdes antérieurs", "Core"],
    equipment: "Poids du corps",
    description: "Pompes explosives avec phase aérienne pour puissance du haut du corps",
    variations: ["clap push-ups", "pompes explosives", "plyo push-ups"]
  },
  "pompes spiderman": {
    name: "Pompes spiderman",
    category: "Pectoraux",
    primaryMuscles: ["Pectoraux", "Triceps"],
    secondaryMuscles: ["Obliques", "Deltoïdes antérieurs", "Core"],
    equipment: "Poids du corps",
    description: "Pompes avec montée de genou latérale pour combiner poussée et gainage",
    variations: ["spiderman push-ups", "pompes genou coude", "spider push up"]
  },
  "pompes hindu": {
    name: "Pompes hindu",
    category: "Pectoraux",
    primaryMuscles: ["Pectoraux", "Deltoïdes"],
    secondaryMuscles: ["Triceps", "Core"],
    equipment: "Poids du corps",
    description: "Pompes dynamiques en arc, très complètes pour mobilité et force",
    variations: ["hindu push-ups", "pompes plongeantes", "dive bomber push-ups"]
  },
  "tractions pronation": {
    name: "Tractions pronation",
    category: "Dorsaux",
    primaryMuscles: ["Grand dorsal", "Rhomboïdes"],
    secondaryMuscles: ["Biceps", "Trapèzes moyens"],
    equipment: "Barre de traction",
    description: "Tractions en prise pronation pour le développement global du dos",
    variations: ["pull-ups", "traction pronation", "tractions pronation larges", "wide grip pull-ups", "tractions larges", "pull up prise large"]
  },
  "tractions supination": {
    name: "Tractions supination",
    category: "Biceps",
    primaryMuscles: ["Biceps brachial", "Grand dorsal"],
    secondaryMuscles: ["Brachial antérieur", "Rhomboïdes"],
    equipment: "Barre de traction",
    description: "Tractions en supination, orientées biceps et dos",
    variations: ["chin-ups", "traction supination", "tractions supination serrées", "close grip chin-ups", "chin-ups serrés", "chin-ups strictes", "strict chin-ups", "chin ups strict"]
  },
  "tractions explosives poitrine barre": {
    name: "Tractions explosives poitrine barre",
    category: "Dorsaux",
    primaryMuscles: ["Grand dorsal", "Trapèzes", "Rhomboïdes"],
    secondaryMuscles: ["Biceps", "Deltoïdes postérieurs"],
    equipment: "Barre de traction",
    description: "Tractions explosives visant le contact poitrine-barre",
    variations: ["chest to bar pull-ups", "tractions explosives", "pull-up explosif"]
  },
  "rowing australien pieds surélevés": {
    name: "Rowing australien pieds surélevés",
    category: "Dorsaux",
    primaryMuscles: ["Grand dorsal", "Rhomboïdes", "Trapèzes moyens"],
    secondaryMuscles: ["Biceps", "Deltoïdes postérieurs"],
    equipment: "Barre basse + Support",
    description: "Variante plus difficile des tractions australiennes avec pieds surélevés",
    variations: ["feet elevated australian rows", "inverted row avancé", "rowing inversé pieds hauts"]
  },
  "front lever tuck rows": {
    name: "Front lever tuck rows",
    category: "Dorsaux",
    primaryMuscles: ["Grand dorsal", "Rhomboïdes", "Core"],
    secondaryMuscles: ["Biceps", "Deltoïdes postérieurs"],
    equipment: "Barre de traction",
    description: "Tirages en position tuck front lever pour dos et gainage avancé",
    variations: ["tuck front lever rows", "front lever rows", "rowing front lever tuck"]
  },
  "tirage horizontal poulie": {
    name: "Tirage horizontal poulie",
    category: "Dorsaux",
    primaryMuscles: ["Grand dorsal", "Rhomboïdes"],
    secondaryMuscles: ["Biceps", "Trapèzes moyens"],
    equipment: "Poulie basse",
    description: "Tirage assis à la poulie pour densité du dos",
    variations: ["seated cable row", "rowing poulie basse", "tirage assis poulie"]
  },
  "tirage horizontal machine convergente": {
    name: "Tirage horizontal machine convergente",
    category: "Dorsaux",
    primaryMuscles: ["Grand dorsal", "Rhomboïdes"],
    secondaryMuscles: ["Biceps", "Trapèzes"],
    equipment: "Machine convergente",
    description: "Tirage guidé unilatéral ou bilatéral sur machine convergente",
    variations: ["machine row converging", "rowing machine convergente", "iso lateral row machine"]
  },
  "tirage unilatéral poulie basse": {
    name: "Tirage unilatéral poulie basse",
    category: "Dorsaux",
    primaryMuscles: ["Grand dorsal", "Rhomboïdes"],
    secondaryMuscles: ["Biceps", "Core"],
    equipment: "Poulie basse",
    description: "Tirage un bras à la poulie pour corriger les asymétries du dos",
    variations: ["single arm cable row", "rowing poulie unilatéral", "tirage un bras poulie"]
  },
  "pull-over poulie haute": {
    name: "Pull-over poulie haute",
    category: "Dorsaux",
    primaryMuscles: ["Grand dorsal"],
    secondaryMuscles: ["Grand rond", "Triceps longue portion"],
    equipment: "Poulie haute",
    description: "Mouvement d'extension d'épaule à bras quasi tendus pour isoler le grand dorsal",
    variations: ["straight arm pulldown", "pullover câble", "tirage bras tendus poulie"]
  },
  "pull-over haltère": {
    name: "Pull-over haltère",
    category: "Dorsaux",
    primaryMuscles: ["Grand dorsal", "Pectoraux"],
    secondaryMuscles: ["Dentelé antérieur", "Triceps"],
    equipment: "Haltère + Banc",
    description: "Pull-over sur banc pour étirement thoracique et recrutement dos/pecs",
    variations: ["dumbbell pullover", "pullover banc", "pull over haltère"]
  },
  "curl barre ez": {
    name: "Curl barre EZ",
    category: "Biceps",
    primaryMuscles: ["Biceps brachial"],
    secondaryMuscles: ["Brachial antérieur", "Brachio-radial"],
    equipment: "Barre EZ",
    description: "Curl à la barre EZ plus tolérant pour les poignets",
    variations: ["ez bar curl", "curl ez", "flexion barre ez"]
  },
  "curl spider": {
    name: "Curl spider",
    category: "Biceps",
    primaryMuscles: ["Biceps brachial"],
    secondaryMuscles: ["Brachial antérieur"],
    equipment: "Haltères + Banc incliné",
    description: "Curl poitrine collée au banc incliné pour forte isolation des biceps",
    variations: ["spider curl", "curl araignée", "spider dumbbell curl"]
  },
  "curl câble unilatéral": {
    name: "Curl câble unilatéral",
    category: "Biceps",
    primaryMuscles: ["Biceps brachial"],
    secondaryMuscles: ["Brachial antérieur"],
    equipment: "Poulie basse",
    description: "Curl un bras à la poulie pour tension continue et symétrie",
    variations: ["single arm cable curl", "curl poulie unilatéral", "one arm cable curl"]
  },
  "curl pupitre machine": {
    name: "Curl pupitre machine",
    category: "Biceps",
    primaryMuscles: ["Biceps brachial"],
    secondaryMuscles: ["Brachial antérieur"],
    equipment: "Machine pupitre",
    description: "Curl guidé sur pupitre pour isoler strictement le biceps",
    variations: ["machine preacher curl", "curl machine pupitre", "preacher machine curl"]
  },
  "chin-ups lestées": {
    name: "Chin-ups lestées",
    category: "Biceps",
    primaryMuscles: ["Biceps brachial", "Grand dorsal"],
    secondaryMuscles: ["Rhomboïdes", "Trapèzes"],
    equipment: "Barre de traction + Lest",
    description: "Chin-ups avec charge additionnelle pour progression en force",
    variations: ["weighted chin-ups", "tractions supination lestées", "chin up lesté"]
  },
  "extension nuque haltère assis": {
    name: "Extension nuque haltère assis",
    category: "Triceps",
    primaryMuscles: ["Triceps longue portion"],
    secondaryMuscles: ["Triceps vaste médial", "Core"],
    equipment: "Haltère",
    description: "Extension triceps au-dessus de la tête en position assise",
    variations: ["seated overhead dumbbell extension", "extension nuque assise", "overhead db extension seated"]
  },
  "dips coréens": {
    name: "Dips coréens",
    category: "Triceps",
    primaryMuscles: ["Triceps", "Pectoraux inférieurs"],
    secondaryMuscles: ["Deltoïdes antérieurs", "Core"],
    equipment: "Barres parallèles",
    description: "Variante avancée de dips avec trajectoire plus exigeante",
    variations: ["korean dips", "dips avancés", "bar korean dips"]
  },
  "développé arnold": {
    name: "Développé Arnold",
    category: "Épaules",
    primaryMuscles: ["Deltoïdes antérieurs", "Deltoïdes moyens"],
    secondaryMuscles: ["Triceps", "Trapèzes supérieurs"],
    equipment: "Haltères",
    description: "Développé épaules avec rotation pour recruter l'ensemble du deltoïde",
    variations: ["arnold press", "press arnold", "développé épaules rotation"]
  },
  "développé militaire haltères assis": {
    name: "Développé militaire haltères assis",
    category: "Épaules",
    primaryMuscles: ["Deltoïdes"],
    secondaryMuscles: ["Triceps", "Trapèzes supérieurs"],
    equipment: "Haltères + Banc",
    description: "Développé épaules assis pour limiter les compensations lombaires",
    variations: ["seated dumbbell shoulder press", "dm haltères assis", "shoulder press assis haltères"]
  },
  "élévations latérales poulie": {
    name: "Élévations latérales poulie",
    category: "Épaules",
    primaryMuscles: ["Deltoïdes moyens"],
    secondaryMuscles: ["Trapèzes supérieurs"],
    equipment: "Poulie basse",
    description: "Élévation latérale au câble pour tension régulière",
    variations: ["cable lateral raise", "élévations latérales câble", "lateral raise poulie"]
  },
  "oiseau poulie": {
    name: "Oiseau poulie",
    category: "Épaules",
    primaryMuscles: ["Deltoïdes postérieurs"],
    secondaryMuscles: ["Rhomboïdes", "Trapèzes moyens"],
    equipment: "Poulie vis-à-vis",
    description: "Reverse fly à la poulie pour l'arrière d'épaule",
    variations: ["cable reverse fly", "reverse pec deck câble", "oiseau câble"]
  },
  "tirage menton barre": {
    name: "Tirage menton barre",
    category: "Épaules",
    primaryMuscles: ["Deltoïdes moyens", "Trapèzes supérieurs"],
    secondaryMuscles: ["Biceps"],
    equipment: "Barre",
    description: "Tirage vertical proche du corps pour épaules et trapèzes",
    variations: ["upright row", "rowing menton barre", "tirage vertical menton"]
  },
  "pike push-ups": {
    name: "Pike push-ups",
    category: "Épaules",
    primaryMuscles: ["Deltoïdes antérieurs", "Triceps"],
    secondaryMuscles: ["Trapèzes", "Core"],
    equipment: "Poids du corps",
    description: "Pompes en V pour transférer vers handstand push-ups",
    variations: ["pompes pike", "v push-ups", "pike push up"]
  },
  "handstand push-ups assistées mur": {
    name: "Handstand push-ups assistées mur",
    category: "Épaules",
    primaryMuscles: ["Deltoïdes", "Triceps"],
    secondaryMuscles: ["Trapèzes", "Core"],
    equipment: "Poids du corps + Mur",
    description: "Développé vertical au poids du corps avec assistance murale",
    variations: ["wall assisted handstand push-ups", "hspu mur", "pompes en équilibre assistées"]
  },
  "dragon flag": {
    name: "Dragon flag",
    category: "Abdominaux",
    primaryMuscles: ["Grand droit de l'abdomen", "Transverse"],
    secondaryMuscles: ["Fléchisseurs de hanche", "Grand dorsal"],
    equipment: "Banc/Support",
    description: "Mouvement avancé de gainage dynamique en chaîne antérieure",
    variations: ["dragon flags", "drapeau du dragon", "dragon flag hold"]
  },
  "toes to bar": {
    name: "Toes to bar",
    category: "Abdominaux",
    primaryMuscles: ["Grand droit de l'abdomen", "Fléchisseurs de hanche"],
    secondaryMuscles: ["Obliques", "Avant-bras"],
    equipment: "Barre de traction",
    description: "Relevé de jambes suspendu jusqu'au contact pieds-barre",
    variations: ["ttb", "pieds à la barre", "toes-to-bar"]
  },
  "ab wheel rollout": {
    name: "Ab wheel rollout",
    category: "Abdominaux",
    primaryMuscles: ["Transverse", "Grand droit de l'abdomen"],
    secondaryMuscles: ["Grand dorsal", "Deltoïdes", "Obliques"],
    equipment: "Roue abdominale",
    description: "Extension anti-lordose du tronc avec roue abdominale",
    variations: ["roue abdominale", "rollout ab wheel", "ab rollout"]
  },
  "crunch poulie haute": {
    name: "Crunch poulie haute",
    category: "Abdominaux",
    primaryMuscles: ["Grand droit de l'abdomen"],
    secondaryMuscles: ["Obliques"],
    equipment: "Poulie haute + Corde",
    description: "Crunch lesté à la poulie pour surcharge progressive des abdominaux",
    variations: ["cable crunch", "crunch câble", "kneeling cable crunch"]
  },
  "pallof press": {
    name: "Pallof press",
    category: "Abdominaux",
    primaryMuscles: ["Obliques", "Transverse"],
    secondaryMuscles: ["Grand droit", "Fessiers", "Érecteurs du rachis"],
    equipment: "Élastique/Poulie",
    description: "Exercice anti-rotation pour stabilité du tronc",
    variations: ["anti rotation press", "press anti-rotation", "pallof hold press"]
  },

  // JAMBES SPÉCIALISÉES
  "fentes marchées": {
    name: "Fentes marchées",
    category: "Quadriceps",
    primaryMuscles: ["Quadriceps"],
    secondaryMuscles: ["Fessiers", "Ischio-jambiers"],
    equipment: "Haltères/Barre",
    description: "Fentes en déplacement pour un travail fonctionnel",
    variations: ["walking lunges", "fentes alternées"]
  },
  "fentes bulgares": {
    name: "Fentes bulgares",
    category: "Quadriceps",
    primaryMuscles: ["Quadriceps"],
    secondaryMuscles: ["Fessiers"],
    equipment: "Haltères + Banc",
    description: "Fentes avec pied arrière surélevé",
    variations: ["bulgarian split squat", "fentes surélevées"]
  },
  "hip thrust": {
    name: "Hip thrust",
    category: "Fessiers",
    primaryMuscles: ["Fessiers"],
    secondaryMuscles: ["Ischio-jambiers"],
    equipment: "Banc + Barre",
    description: "Extension de hanche dos appuyé sur banc",
    variations: ["glute bridge", "pont fessier"]
  },
  "glute bridge": {
    name: "Glute bridge",
    category: "Fessiers",
    primaryMuscles: ["Fessiers"],
    secondaryMuscles: ["Ischio-jambiers"],
    equipment: "Poids du corps",
    description: "Pont fessier au sol",
    variations: ["pont fessier", "bridge"]
  },
  "good morning": {
    name: "Good morning",
    category: "Ischio-jambiers",
    primaryMuscles: ["Ischio-jambiers", "Érecteurs du rachis"],
    secondaryMuscles: ["Fessiers"],
    equipment: "Barre",
    description: "Flexion du tronc avec barre sur les épaules",
    variations: ["good morning barre", "flexion tronc"]
  },
  "sissy squat": {
    name: "Sissy squat",
    category: "Quadriceps",
    primaryMuscles: ["Quadriceps"],
    secondaryMuscles: [],
    equipment: "Poids du corps",
    description: "Squat avec inclinaison arrière pour isolation quadriceps",
    variations: ["sissy squat", "squat sissy"]
  },
  "hack squat": {
    name: "Hack squat",
    category: "Quadriceps",
    primaryMuscles: ["Quadriceps"],
    secondaryMuscles: ["Fessiers"],
    equipment: "Machine hack squat",
    description: "Squat sur machine inclinée",
    variations: ["hack squat machine", "squat hack"]
  },
  "front squat": {
    name: "Front squat",
    category: "Quadriceps",
    primaryMuscles: ["Quadriceps"],
    secondaryMuscles: ["Core", "Fessiers"],
    equipment: "Barre",
    description: "Squat avec barre devant, accent sur les quadriceps",
    variations: ["squat avant", "front squat barre"]
  },
  "mollets presse": {
    name: "Mollets à la presse",
    category: "Mollets",
    primaryMuscles: ["Gastrocnémiens", "Soléaires"],
    secondaryMuscles: [],
    equipment: "Presse à cuisses",
    description: "Mollets sur machine à presse",
    variations: ["calf press", "mollets presse cuisses"]
  },
  "mollets unilatéraux": {
    name: "Mollets unilatéraux",
    category: "Mollets",
    primaryMuscles: ["Gastrocnémiens"],
    secondaryMuscles: ["Soléaires"],
    equipment: "Haltère",
    description: "Mollets un pied pour corriger les déséquilibres",
    variations: ["single calf raise", "mollets 1 pied"]
  },
  "pistol squat": {
    name: "Pistol squat",
    category: "Quadriceps",
    primaryMuscles: ["Quadriceps", "Fessiers"],
    secondaryMuscles: ["Ischio-jambiers", "Core"],
    equipment: "Poids du corps",
    description: "Squat unilatéral complet demandant force, mobilité et équilibre",
    variations: ["squat une jambe", "single leg squat", "pistol"]
  },
  "shrimp squat": {
    name: "Shrimp squat",
    category: "Quadriceps",
    primaryMuscles: ["Quadriceps"],
    secondaryMuscles: ["Fessiers", "Core", "Ischio-jambiers"],
    equipment: "Poids du corps",
    description: "Squat unilatéral en tenant le pied arrière, excellent en street workout",
    variations: ["shrimp", "squat crevette", "single leg rear hold squat"]
  },
  "squat sauté": {
    name: "Squat sauté",
    category: "Quadriceps",
    primaryMuscles: ["Quadriceps", "Fessiers"],
    secondaryMuscles: ["Mollets", "Core"],
    equipment: "Poids du corps",
    description: "Squat pliométrique pour puissance des jambes et explosivité",
    variations: ["jump squat", "sauts squat", "squat explosif"]
  },
  "fentes sautées": {
    name: "Fentes sautées",
    category: "Quadriceps",
    primaryMuscles: ["Quadriceps", "Fessiers"],
    secondaryMuscles: ["Mollets", "Ischio-jambiers", "Core"],
    equipment: "Poids du corps",
    description: "Fentes alternées avec saut pour travail unilatéral explosif",
    variations: ["jump lunges", "fentes pliométriques", "split jump"]
  },
  "step-up": {
    name: "Step-up",
    category: "Quadriceps",
    primaryMuscles: ["Quadriceps", "Fessiers"],
    secondaryMuscles: ["Ischio-jambiers", "Mollets"],
    equipment: "Banc/Box",
    description: "Montée contrôlée sur support pour renforcer chaque jambe séparément",
    variations: ["montée sur banc", "box step-up", "step up banc"]
  },
  "step-down contrôlé": {
    name: "Step-down contrôlé",
    category: "Quadriceps",
    primaryMuscles: ["Quadriceps"],
    secondaryMuscles: ["Fessiers moyens", "Mollets", "Core"],
    equipment: "Banc/Box",
    description: "Descente unilatérale contrôlée pour stabilité du genou et force excentrique",
    variations: ["step down", "descente contrôlée banc", "eccentric step down"]
  },
  "wall sit": {
    name: "Wall sit",
    category: "Quadriceps",
    primaryMuscles: ["Quadriceps"],
    secondaryMuscles: ["Fessiers", "Mollets"],
    equipment: "Poids du corps",
    description: "Chaise contre un mur en isométrie pour endurance locale des quadriceps",
    variations: ["chaise murale", "isometric wall squat", "chair hold"]
  },
  "hip thrust unilatéral": {
    name: "Hip thrust unilatéral",
    category: "Fessiers",
    primaryMuscles: ["Fessiers"],
    secondaryMuscles: ["Ischio-jambiers", "Core"],
    equipment: "Banc + Haltère/Barre",
    description: "Hip thrust une jambe pour corriger les déséquilibres de force",
    variations: ["single leg hip thrust", "hip thrust 1 jambe", "pont fessier unilatéral banc"]
  },
  "glute bridge unilatéral": {
    name: "Glute bridge unilatéral",
    category: "Fessiers",
    primaryMuscles: ["Fessiers"],
    secondaryMuscles: ["Ischio-jambiers", "Core"],
    equipment: "Poids du corps",
    description: "Pont fessier au sol sur une jambe pour ciblage fessier précis",
    variations: ["single leg glute bridge", "pont fessier unilatéral", "bridge 1 jambe"]
  },
  "soulevé de terre sumo": {
    name: "Soulevé de terre sumo",
    category: "Ischio-jambiers",
    primaryMuscles: ["Ischio-jambiers", "Fessiers", "Adducteurs"],
    secondaryMuscles: ["Érecteurs du rachis", "Quadriceps"],
    equipment: "Barre",
    description: "Soulevé de terre prise large ciblant fortement adducteurs et fessiers",
    variations: ["sumo deadlift", "deadlift sumo", "sdt sumo"]
  },
  "soulevé de terre roumain haltères": {
    name: "Soulevé de terre roumain haltères",
    category: "Ischio-jambiers",
    primaryMuscles: ["Ischio-jambiers", "Fessiers"],
    secondaryMuscles: ["Érecteurs du rachis", "Core"],
    equipment: "Haltères",
    description: "Version haltères du RDL pour meilleure amplitude et contrôle unilatéral",
    variations: ["rdl haltères", "dumbbell rdl", "sdt roumain haltères"]
  },
  "leg press unilatérale": {
    name: "Leg press unilatérale",
    category: "Quadriceps",
    primaryMuscles: ["Quadriceps"],
    secondaryMuscles: ["Fessiers", "Ischio-jambiers"],
    equipment: "Machine presse",
    description: "Presse à cuisses sur une jambe pour corriger les asymétries",
    variations: ["single leg press", "presse unilatérale", "presse 1 jambe"]
  },
  "extension quadriceps unilatérale machine": {
    name: "Extension quadriceps unilatérale machine",
    category: "Quadriceps",
    primaryMuscles: ["Quadriceps"],
    secondaryMuscles: [],
    equipment: "Machine leg extension",
    description: "Isolation des quadriceps jambe par jambe sur machine",
    variations: ["single leg extension", "leg extension unilatérale", "extension quadriceps 1 jambe"]
  },
  "leg curl allongé": {
    name: "Leg curl allongé",
    category: "Ischio-jambiers",
    primaryMuscles: ["Ischio-jambiers"],
    secondaryMuscles: ["Mollets"],
    equipment: "Machine leg curl",
    description: "Flexion des genoux en position allongée pour ischio-jambiers",
    variations: ["lying leg curl", "curl ischio allongé", "leg curl couché"]
  },
  "mollets debout unilatéral machine": {
    name: "Mollets debout unilatéral machine",
    category: "Mollets",
    primaryMuscles: ["Gastrocnémiens"],
    secondaryMuscles: ["Soléaires"],
    equipment: "Machine mollets debout",
    description: "Travail des mollets jambe par jambe sur machine debout",
    variations: ["single leg standing calf raise machine", "mollets debout machine 1 jambe", "calf raise unilatéral machine"]
  },
  "tibialis raises mur": {
    name: "Tibialis raises mur",
    category: "Mollets",
    primaryMuscles: ["Tibial antérieur"],
    secondaryMuscles: ["Gastrocnémiens"],
    equipment: "Poids du corps",
    description: "Flexion dorsale contre mur pour renforcer l'avant du tibia",
    variations: ["tibialis raise", "relevés tibial antérieur", "toe raises wall"]
  },

  // EXERCICES SALLE SPÉCIALISÉS
  "développé incliné haltères": {
    name: "Développé couché incliné aux haltères",
    category: "Pectoraux",
    primaryMuscles: ["Pectoraux supérieurs"],
    secondaryMuscles: ["Triceps brachial", "Deltoïdes antérieurs"],
    equipment: "Haltères + Banc incliné",
    difficulty: 2,
    summary: "Développé incliné haltères — haut des pectoraux",
    description:
      "Exercice de musculation sur banc incliné (15–30°) avec deux haltères. Cible principalement la portion claviculaire des pectoraux (haut des pecs), tout en sollicitant les deltoïdes antérieurs et les triceps. Amplitude et indépendance des bras supérieures à la barre.\n\n" +
      "Exécution : banc à 15–30°, pieds au sol, omoplates rapprochées et poitrine sortie. Haltères au-dessus des épaules, bras tendus. Descends en 2–3 s, coudes à 45–60° du buste, jusqu'au niveau du haut des pectoraux. Pousse vers le haut sans décoller les épaules ; termine bras presque tendus sans verrouillage brutal.\n\n" +
      "Erreurs fréquentes : banc trop incliné (45°+) qui transforme l'exercice en développé épaules ; rebond en bas ; coudes à 90° ; hausser les épaules.\n\n" +
      "Tempo classique : 2-0-1-0 ou 3-0-1-0. Séries types : 3–4 × 8–12 reps. Difficulté intermédiaire (≈ 6,5/10) — stabilité des haltères plus exigeante qu'à la barre.",
    variations: ["incline dumbbell press", "di haltères", "développé incliné haltères", "incline db press"]
  },
  "développé incliné haltères pause bas": {
    name: "Développé couché incliné aux haltères avec pause",
    category: "Pectoraux",
    primaryMuscles: ["Pectoraux supérieurs"],
    secondaryMuscles: ["Triceps brachial", "Deltoïdes antérieurs"],
    equipment: "Haltères + Banc incliné",
    difficulty: 3,
    summary: "Pause en bas · haut des pectoraux · tempo 3-2-1-0",
    description:
      "Exercice de musculation sur banc incliné (15–30°) avec deux haltères et une pause contrôlée en position basse (1–3 s). Cible la portion claviculaire des pectoraux (haut des pecs), les deltoïdes antérieurs et les triceps. La pause supprime l'élan et le rebond naturel : tension musculaire accrue, meilleur recrutement des fibres du haut des pecs et développement de la force au point le plus difficile du mouvement — souvent plus efficace pour l'hypertrophie à charge égale qu'une exécution classique.\n\n" +
      "Exécution : règle le banc à 15–30°, pieds fermement au sol, omoplates rapprochées et poitrine sortie. Haltères au-dessus des épaules, bras tendus. Descends lentement en 2–3 s, coudes à 45–60° par rapport au buste, jusqu'au niveau du haut des pectoraux ou légèrement en dessous. Marque une pause de 1–2 s sans relâcher la tension, puis pousse fort vers le haut sans décoller les épaules du banc. Termine bras presque tendus sans verrouiller brutalement les coudes.\n\n" +
      "Erreurs fréquentes : banc trop incliné (45°+) qui transforme l'exercice en développé épaules ; faire rebondir les haltères en bas ; ouvrir les coudes à 90° ; monter les épaules vers les oreilles ; perdre le contrôle pendant la pause.\n\n" +
      "Tempo recommandé pour le haut des pecs : 3-2-1-0 (3 s de descente, 2 s de pause en bas, 1 s de montée explosive, 0 s de repos en haut). Plus instable qu'à la barre, sans rebond ni élan : demande un bon contrôle scapulaire et une coordination solide — difficulté intermédiaire à avancée (≈ 7,5/10). Séries types : 3–4 × 8–12 reps.",
    variations: [
      "incline dumbbell press pause",
      "pause incline dumbbell bench",
      "di haltères pause bas",
      "développé incliné haltères pause",
      "incline db press with pause",
      "pause bench incliné haltères",
      "développé couché incliné haltères pause"
    ]
  },
  "développé haltères plat": {
    name: "Développé couché aux haltères",
    category: "Pectoraux",
    primaryMuscles: ["Pectoraux"],
    secondaryMuscles: ["Triceps brachial", "Deltoïdes antérieurs"],
    equipment: "Haltères + Banc",
    difficulty: 2,
    summary: "Développé couché haltères — polyarticulaire pectoraux",
    description:
      "Exercice de musculation sur banc plat avec deux haltères. Polyarticulaire de référence pour les pectoraux, avec sollicitation importante des triceps et des deltoïdes antérieurs. Amplitude supérieure à la barre et travail unilatéral indépendant.\n\n" +
      "Exécution : banc plat, pieds au sol, omoplates rapprochées et poitrine sortie. Haltères au-dessus de la poitrine, bras tendus. Descends en 2–3 s, coudes à 45–60° du buste, jusqu'à la ligne des mamelons ou légèrement en dessous. Pousse vers le haut en contractant les pectoraux, sans décoller les épaules du banc ni cambrer excessivement.\n\n" +
      "Erreurs fréquentes : rebond en bas ; coudes ouverts à 90° ; hausser les épaules ; amplitude incomplète ; haltères qui se touchent violemment en haut.\n\n" +
      "Tempo classique : 2-0-1-0 ou 3-0-1-0. Séries types : 3–4 × 8–12 reps. Difficulté intermédiaire (≈ 6/10).",
    variations: ["flat dumbbell press", "dc haltères", "développé haltères plat", "dumbbell bench press"]
  },
  "développé couché haltères pause bas": {
    name: "Développé couché aux haltères avec pause",
    category: "Pectoraux",
    primaryMuscles: ["Pectoraux"],
    secondaryMuscles: ["Triceps brachial", "Deltoïdes antérieurs"],
    equipment: "Haltères + Banc",
    difficulty: 3,
    summary: "Pause en bas · pectoraux · tempo 3-2-1-0",
    description:
      "Exercice de musculation sur banc plat avec deux haltères et une pause contrôlée en position basse (1–3 s). Cible les pectoraux, les triceps et les deltoïdes antérieurs. La pause élimine l'élan et le rebond : tension musculaire accrue et meilleur recrutement à charge égale.\n\n" +
      "Exécution : banc plat, pieds au sol, omoplates rapprochées et poitrine sortie. Haltères au-dessus de la poitrine, bras tendus. Descends lentement en 2–3 s, coudes à 45–60°, jusqu'à la poitrine. Marque une pause de 1–2 s sans relâcher la tension, puis pousse fort vers le haut sans décoller les épaules. Termine bras presque tendus sans verrouillage brutal.\n\n" +
      "Erreurs fréquentes : rebondir les haltères en bas ; ouvrir les coudes à 90° ; monter les épaules ; perdre le contrôle pendant la pause.\n\n" +
      "Tempo recommandé : 3-2-1-0 (3 s descente, 2 s pause, 1 s montée, 0 s en haut). Séries types : 3–4 × 6–10 reps. Difficulté intermédiaire à avancée (≈ 7/10).",
    variations: [
      "flat dumbbell press pause",
      "pause dumbbell bench press",
      "dc haltères pause",
      "développé couché haltères pause",
      "dumbbell bench press with pause"
    ]
  },
  "développé décliné haltères pause bas": {
    name: "Développé couché décliné aux haltères avec pause",
    category: "Pectoraux",
    primaryMuscles: ["Pectoraux inférieurs"],
    secondaryMuscles: ["Triceps brachial", "Deltoïdes antérieurs"],
    equipment: "Haltères + Banc décliné",
    difficulty: 3,
    summary: "Pause en bas · bas des pectoraux · tempo 3-2-1-0",
    description:
      "Exercice de musculation sur banc décliné (−15° à −30°) avec deux haltères et une pause contrôlée en position basse (1–3 s). Cible la portion inférieure des pectoraux, les triceps et les deltoïdes antérieurs. La pause supprime l'élan et intensifie le travail au point le plus difficile.\n\n" +
      "Exécution : banc décliné modéré, pieds calés, omoplates rapprochées. Haltères au-dessus de la poitrine basse, bras tendus. Descends en 2–3 s, coudes à 45–60°, jusqu'à la ligne des mamelons ou légèrement en dessous. Pause 1–2 s en maintien actif, puis poussée explosive sans décoller les épaules.\n\n" +
      "Erreurs fréquentes : déclinaison excessive ; rebond en bas ; coudes à 90° ; perte de contrôle des haltères pendant la pause ; cambrure lombaire excessive.\n\n" +
      "Tempo recommandé : 3-2-1-0. Séries types : 3–4 × 6–10 reps. Difficulté avancée (≈ 7,5/10) — position déclinée + instabilité haltères + pause.",
    variations: [
      "decline dumbbell press pause",
      "pause decline dumbbell bench",
      "dc décliné haltères pause",
      "développé décliné haltères pause",
      "decline db press with pause"
    ]
  },
  "écarté poulie": {
    name: "Écarté à la poulie",
    category: "Pectoraux",
    primaryMuscles: ["Pectoraux"],
    secondaryMuscles: [],
    equipment: "Poulie vis-à-vis",
    description: "Écarté à la poulie pour tension constante",
    variations: ["cable fly", "écarté câble", "écarté à la poulie vis-à-vis", "cable crossover", "crossover"]
  },
  "leg extension": {
    name: "Leg extension",
    category: "Quadriceps",
    primaryMuscles: ["Quadriceps"],
    secondaryMuscles: [],
    equipment: "Machine leg extension",
    description: "Extension des jambes sur machine",
    variations: ["extension quadriceps", "extension jambes"]
  },
  "leg curl": {
    name: "Leg curl",
    category: "Ischio-jambiers",
    primaryMuscles: ["Ischio-jambiers"],
    secondaryMuscles: [],
    equipment: "Machine leg curl",
    description: "Flexion des jambes sur machine",
    variations: ["curl jambes", "flexion ischio"]
  },

  // EXERCICES ABDOMINAUX MANQUANTS
  "relevés de genoux aux parallèles": {
    name: "Relevés de genoux aux parallèles",
    category: "Abdominaux",
    primaryMuscles: ["Grand droit de l'abdomen", "Fléchisseurs de hanche"],
    secondaryMuscles: ["Obliques"],
    equipment: "Barres parallèles",
    description: "Version sur parallèles des relevés de genoux, permettant une meilleure stabilité",
    variations: ["relevés genoux parallèles", "knee raises parallels", "dip bar knee raises"]
  },
  "jambes tendues rétroversées": {
    name: "Jambes tendues rétroversées",
    category: "Abdominaux",
    primaryMuscles: ["Grand droit de l'abdomen"],
    secondaryMuscles: ["Fléchisseurs de hanche"],
    equipment: "Poids du corps",
    description: "Exercice au sol ciblant les abdominaux inférieurs avec jambes tendues",
    variations: ["jambes tendues", "straight leg raises", "leg raises"]
  },
  "vacuum allongé": {
    name: "Vacuum allongé",
    category: "Abdominaux",
    primaryMuscles: ["Transverse de l'abdomen"],
    secondaryMuscles: ["Diaphragme"],
    equipment: "Poids du corps",
    description: "Exercice de respiration pour renforcer les muscles profonds de l'abdomen",
    variations: ["vacuum couché", "stomach vacuum lying", "aspiration abdominale"]
  },
  "gainage latéral dynamique": {
    name: "Gainage latéral dynamique",
    category: "Abdominaux",
    primaryMuscles: ["Obliques", "Carré des lombes"],
    secondaryMuscles: ["Grand droit de l'abdomen", "Deltoïdes"],
    equipment: "Poids du corps",
    description: "Variation dynamique du gainage latéral avec mouvements de montée/descente",
    variations: ["side plank dynamic", "gainage côté dynamique", "planche latérale dynamique"]
  },

  // EXERCICES DE SALLE MANQUANTS
  "écarté incliné": {
    name: "Écarté incliné",
    category: "Pectoraux",
    primaryMuscles: ["Pectoraux supérieurs"],
    secondaryMuscles: ["Deltoïdes antérieurs"],
    equipment: "Haltères + Banc incliné",
    description: "Exercice d'isolation pour le haut des pectoraux sur banc incliné",
    variations: ["incline fly", "écarté banc incliné", "incline dumbbell fly"]
  },
  "extension unilatérale à la poulie": {
    name: "Extension unilatérale à la poulie",
    category: "Triceps",
    primaryMuscles: ["Triceps brachial"],
    secondaryMuscles: [],
    equipment: "Poulie haute",
    description: "Extension des triceps un bras à la fois pour corriger les déséquilibres",
    variations: ["single arm pushdown", "extension 1 bras poulie", "unilateral tricep extension", "extension unilatérale poulie", "extension 1 bras", "unilateral extension"]
  },
  "extensions triceps allongé": {
    name: "Extensions triceps allongé",
    category: "Triceps",
    primaryMuscles: ["Triceps brachial"],
    secondaryMuscles: [],
    equipment: "Haltères + Banc",
    description: "Extension des triceps allongé sur banc, excellent pour la longue portion",
    variations: ["lying tricep extension", "extension couché", "skull crusher haltères"]
  },
  "soulevé de terre jambes semi-tendues": {
    name: "Soulevé de terre jambes semi-tendues",
    category: "Dorsaux",
    primaryMuscles: ["Ischio-jambiers", "Fessiers"],
    secondaryMuscles: ["Érecteurs du rachis", "Grand dorsal"],
    equipment: "Barre",
    description: "Variante du soulevé de terre ciblant davantage les ischio-jambiers",
    variations: ["romanian deadlift", "sdt roumain", "rdl"]
  },
  "gainage dynamique": {
      name: "Gainage dynamique",
      category: "Abdominaux",
      primaryMuscles: ["Grand droit de l'abdomen", "Obliques"],
      secondaryMuscles: ["Érecteurs du rachis", "Deltoïdes"],
      equipment: "Poids du corps",
      description: "Enchaînement de positions de gainage pour un travail complet du core",
      variations: ["dynamic plank", "planche dynamique", "gainage mouvements"]
    },

  // STREET WORKOUT — AJOUTS (poids du corps / parc, sans doublons avec les entrées ci-dessus)
  "muscle up strict": {
    name: "Muscle up strict",
    category: "Dorsaux",
    primaryMuscles: ["Grand dorsal", "Triceps brachial"],
    secondaryMuscles: ["Deltoïdes antérieurs", "Core", "Avant-bras"],
    equipment: "Barre de traction",
    difficulty: 4,
    description:
      "Enchaînement traction explosive suivie d'une transition contrôlée au-dessus de la barre puis extension complète des bras. Exige une forte traction, un timing de faux-assis et une stabilité d'épaule.",
    variations: ["muscle-up strict", "muscle up bar", "muscle-up barre"]
  },
  "tractions commando": {
    name: "Tractions commando",
    category: "Dorsaux",
    primaryMuscles: ["Grand dorsal", "Rhomboïdes"],
    secondaryMuscles: ["Biceps brachial", "Deltoïdes postérieurs", "Obliques", "Core"],
    equipment: "Barre de traction",
    difficulty: 2,
    description:
      "Prise neutre, alternance latérale du menton d'un côté puis de l'autre de la barre. Travaille le dos en anti-rotation et sollicite fortement la gaine.",
    variations: ["commando pull-ups", "typewriter commando", "tractions prise neutre alternées"]
  },
  "tractions typewriter": {
    name: "Tractions typewriter",
    category: "Dorsaux",
    primaryMuscles: ["Grand dorsal", "Trapèzes moyens"],
    secondaryMuscles: ["Biceps brachial", "Brachial antérieur", "Deltoïdes postérieurs", "Core"],
    equipment: "Barre de traction",
    difficulty: 3,
    description:
      "En haut de traction, déplacement horizontal contrôlé d'un bras puis de l'autre comme une machine à écrire. Accent unilatéral sur le dos et les avant-bras.",
    variations: ["typewriter pull-ups", "tractions machine à écrire"]
  },
  "tractions archer": {
    name: "Tractions archer",
    category: "Dorsaux",
    primaryMuscles: ["Grand dorsal", "Rhomboïdes"],
    secondaryMuscles: ["Biceps brachial", "Brachial antérieur", "Deltoïdes postérieurs", "Core"],
    equipment: "Barre de traction",
    difficulty: 3,
    description:
      "Un bras reste tendu en appui, l'autre tire fortement pour charger un côté du dos. Progression vers le tirage une main.",
    variations: ["archer pull-ups", "tractions un bras assisté", "archer chin-up"]
  },
  "tractions en l": {
    name: "Tractions en L",
    category: "Dorsaux",
    primaryMuscles: ["Grand dorsal", "Grand droit de l'abdomen"],
    secondaryMuscles: ["Fléchisseurs de hanche", "Biceps brachial", "Deltoïdes postérieurs"],
    equipment: "Barre de traction",
    difficulty: 3,
    description:
      "Jambes tendues à l'horizontale en L pendant la traction. Combine force de tirage et compression abdominale isométrique.",
    variations: ["L pull-ups", "L-pull-up", "tractions L-sit"]
  },
  "l-sit barre de traction": {
    name: "L-sit à la barre de traction",
    category: "Abdominaux",
    primaryMuscles: ["Fléchisseurs de hanche", "Grand droit de l'abdomen"],
    secondaryMuscles: ["Triceps brachial", "Deltoïdes antérieurs", "Transverse de l'abdomen"],
    equipment: "Barre de traction",
    difficulty: 2,
    description:
      "Suspendu en prise pronation, corps compact, jambes tendues parallèle au sol. Renforce la compression de hanche et la dépression d'omoplate.",
    variations: ["L-sit hang", "L sit bar", "hanging L-sit"]
  },
  "l-sit parallèles": {
    name: "L-sit aux parallèles",
    category: "Abdominaux",
    primaryMuscles: ["Triceps brachial", "Fléchisseurs de hanche"],
    secondaryMuscles: ["Deltoïdes antérieurs", "Grand droit de l'abdomen", "Trapèzes inférieurs"],
    equipment: "Barres parallèles",
    difficulty: 2,
    description:
      "Appui sur les mains, épaules au-dessus des poignets, jambes tendues devant. Fondamental de calisthénie pour la stabilité d'épaule et le core.",
    variations: ["L-sit dips support", "L sit parallels", "L-sit sur barres"]
  },
  "human flag tuck": {
    name: "Human flag tuck",
    category: "Abdominaux",
    primaryMuscles: ["Obliques", "Deltoïdes", "Grand dorsal"],
    secondaryMuscles: ["Trapèzes", "Fessiers", "Quadriceps"],
    equipment: "Barre verticale / poteau",
    difficulty: 4,
    description:
      "Corps aligné latéralement au poteau, jambes ramenées en tuck pour réduire le levier. Travail intense des obliques et de la chaîne latérale.",
    variations: ["human flag tuck", "drapeau humain tuck", "side lever tuck"]
  },
  "back lever tuck": {
    name: "Back lever tuck",
    category: "Dorsaux",
    primaryMuscles: ["Deltoïdes postérieurs", "Grand dorsal", "Triceps longue portion"],
    secondaryMuscles: ["Trapèzes", "Core", "Biceps brachial"],
    equipment: "Barre de traction / anneaux",
    difficulty: 4,
    description:
      "Corps horizontal ventre vers le ciel, genoux ramenés, bras tendus. Isométrie avancée pour l'arrière d'épaule et la chaîne postérieure du haut du corps.",
    variations: ["back lever tuck", "lever arrière tuck", "reverse planche tuck"]
  },
  "front lever tuck isométrique": {
    name: "Front lever tuck isométrique",
    category: "Dorsaux",
    primaryMuscles: ["Grand dorsal", "Grand droit de l'abdomen"],
    secondaryMuscles: ["Deltoïdes postérieurs", "Triceps brachial", "Fessiers"],
    equipment: "Barre de traction",
    difficulty: 4,
    description:
      "Maintien horizontal ventre vers le sol avec cuisses serrées contre le buste. Préparation structurée au front lever complet sans rowing dynamique.",
    variations: ["front lever tuck hold", "FL tuck statique", "front lever isometric tuck"]
  },
  "planche sur coudes": {
    name: "Planche sur coudes (elbow lever)",
    category: "Épaules",
    primaryMuscles: ["Deltoïdes antérieurs", "Triceps brachial"],
    secondaryMuscles: ["Trapèzes", "Core", "Pectoraux"],
    equipment: "Barres parallèles / barre basse",
    difficulty: 3,
    description:
      "Corps horizontal appuyé sur les avant-bras ou coudes au-dessus du support. Charge importante sur le deltoïde antérieur et le gainage.",
    variations: ["elbow lever", "crook hold", "planche coudes street"]
  },
  "inclinaison pseudo-planche statique": {
    name: "Inclinaison pseudo-planche statique",
    category: "Épaules",
    primaryMuscles: ["Deltoïdes antérieurs", "Pectoraux supérieurs"],
    secondaryMuscles: ["Triceps brachial", "Core", "Avant-bras"],
    equipment: "Sol",
    difficulty: 3,
    description:
      "Position de pompe avec doigts orientés vers les pieds et corps projeté vers l'avant sans flexion/extension des coudes. Base pour la force de planche.",
    variations: ["pseudo planche lean", "pseudo planche hold", "inclinaison statique street"]
  },
  "frog stand": {
    name: "Frog stand",
    category: "Épaules",
    primaryMuscles: ["Deltoïdes antérieurs", "Triceps brachial"],
    secondaryMuscles: ["Core", "Avant-bras"],
    equipment: "Sol",
    difficulty: 1,
    description:
      "Équilibre sur les mains genoux posés sur les coudes. Développe la proprioception des poignets et la compression d'épaule pour les figures acrobatiques.",
    variations: ["frogstand", "équilibre grenouille", "crow prep frog"]
  },
  "déplacements équilibre sur les mains": {
    name: "Déplacements en équilibre sur les mains",
    category: "Épaules",
    primaryMuscles: ["Deltoïdes", "Triceps brachial"],
    secondaryMuscles: ["Trapèzes", "Core", "Avant-bras"],
    equipment: "Sol / gazon",
    difficulty: 3,
    description:
      "Petits pas contrôlés en appui mains, corps aligné. Renforce la stabilité dynamique des épaules avant les développés verticaux libres.",
    variations: ["handstand walk", "walk on hands", "équilibre mains pas"]
  },
  "burpees": {
    name: "Burpees",
    category: "Quadriceps",
    primaryMuscles: ["Quadriceps", "Fessiers", "Pectoraux"],
    secondaryMuscles: ["Deltoïdes antérieurs", "Triceps", "Core", "Grand dorsal"],
    equipment: "Poids du corps",
    difficulty: 2,
    description:
      "Squat mains au sol, saut arrière en planche, pompe optionnelle, retour squat puis extension verticale avec saut. Mouvement complet cardio-muscu de rue.",
    variations: ["burpee", "squat thrust", "burpees stricts"]
  },
  "bear crawl": {
    name: "Bear crawl",
    category: "Abdominaux",
    primaryMuscles: ["Core", "Deltoïdes"],
    secondaryMuscles: ["Quadriceps", "Fessiers", "Trapèzes"],
    equipment: "Sol",
    difficulty: 1,
    description:
      "Quadrupédie avec genoux décollés, déplacement coordonné bras-jambe opposés. Excellent pour la stabilité du tronc et l'endurance d'épaule.",
    variations: ["bear walk", "marche ours", "crawling ours"]
  },
  "squat cosaque": {
    name: "Squat cosaque",
    category: "Quadriceps",
    primaryMuscles: ["Quadriceps", "Fessiers", "Adducteurs"],
    secondaryMuscles: ["Ischio-jambiers", "Core"],
    equipment: "Poids du corps",
    difficulty: 2,
    description:
      "Grande fente latérale jambe tendue pointée, fesse en arrière sur la jambe de travail. Mobilité hanche et force unilatérale typique du street leg day.",
    variations: ["cossack squat", "squat latéral", "side squat deep"]
  },
  "dips aux anneaux": {
    name: "Dips aux anneaux",
    category: "Triceps",
    primaryMuscles: ["Triceps brachial", "Pectoraux inférieurs"],
    secondaryMuscles: ["Deltoïdes antérieurs", "Core", "Avant-bras"],
    equipment: "Anneaux de gymnastique",
    difficulty: 3,
    description:
      "Dips sur anneaux instables : stabilisation accrue des épaules et du gainage par rapport aux barres fixes.",
    variations: ["ring dips", "dips rings", "répulsions anneaux"]
  },
  "tractions inversées aux anneaux": {
    name: "Tractions inversées aux anneaux",
    category: "Dorsaux",
    primaryMuscles: ["Grand dorsal", "Rhomboïdes"],
    secondaryMuscles: ["Biceps brachial", "Deltoïdes postérieurs", "Core"],
    equipment: "Anneaux de gymnastique",
    difficulty: 1,
    description:
      "Corps incliné, pieds au sol, tirage vers les anneaux à hauteur de poitrine. Instabilité des anneaux pour recruter davantage le dos et le gainage qu’à la barre fixe.",
    variations: ["ring rows", "inverted ring row", "bodyweight ring row", "inverted bodyweight rings"]
  },
  "dips barre droite": {
    name: "Dips barre droite",
    category: "Triceps",
    primaryMuscles: ["Triceps brachial", "Pectoraux inférieurs"],
    secondaryMuscles: ["Deltoïdes antérieurs", "Core"],
    equipment: "Barre horizontale basse",
    difficulty: 2,
    description:
      "Dips sur une seule barre droite devant le corps, prise pronation. Sollicite davantage les avant-bras et le contrôle que les parallèles classiques.",
    variations: ["straight bar dips", "dips barre fixe", "bar dips"]
  },
  "skin the cat": {
    name: "Skin the cat",
    category: "Épaules",
    primaryMuscles: ["Deltoïdes postérieurs", "Grand dorsal"],
    secondaryMuscles: ["Triceps longue portion", "Core", "Trapèzes"],
    equipment: "Anneaux / barre de traction",
    difficulty: 2,
    description:
      "Rotation contrôlée des épaules en passant les pieds au-dessus de la tête suspendu. Mobilité et renforcement de la coiffe en amplitude étendue.",
    variations: ["skin the cat gymnastics", "rotation suspendue épaules", "German hang prep"]
  },
  "tractions scapulaires": {
    name: "Tractions scapulaires",
    category: "Dorsaux",
    primaryMuscles: ["Trapèzes moyens et inférieurs", "Rhomboïdes"],
    secondaryMuscles: ["Grand dorsal", "Biceps brachial"],
    equipment: "Barre de traction",
    difficulty: 1,
    description:
      "Bras tendus, uniquement dépression et rétraction des omoplates sans plier les coudes. Fondamental d'activation avant tractions ou muscle-up.",
    variations: ["scapular pull-ups", "scap pull", "traction omoplates"]
  },
  "windshield wipers barre": {
    name: "Windshield wipers à la barre",
    category: "Abdominaux",
    primaryMuscles: ["Obliques", "Grand droit de l'abdomen"],
    secondaryMuscles: ["Fléchisseurs de hanche", "Grand dorsal", "Avant-bras"],
    equipment: "Barre de traction",
    difficulty: 3,
    description:
      "Suspendu, hanches flexées vers le haut, rotation contrôlée des jambes d'un côté à l'autre comme des essuie-glaces. Forte sollicitation des obliques.",
    variations: ["windshield wipers", "essuie-glaces barre", "hanging wipers"]
  },
  "ice cream makers": {
    name: "Ice cream makers",
    category: "Dorsaux",
    primaryMuscles: ["Grand dorsal", "Grand droit de l'abdomen"],
    secondaryMuscles: ["Biceps brachial", "Deltoïdes postérieurs", "Fléchisseurs de hanche"],
    equipment: "Barre de traction",
    difficulty: 3,
    description:
      "Depuis le haut de traction, bascule contrôlée vers tuck avant puis retour. Pont entre traction forte et contrôle de front lever.",
    variations: ["ice cream maker pull", "front lever swing tuck", "ice cream makers bar"]
  },
  "tenue équilibre sur les mains mur": {
    name: "Tenue en équilibre sur les mains au mur",
    category: "Épaules",
    primaryMuscles: ["Deltoïdes", "Triceps brachial"],
    secondaryMuscles: ["Trapèzes", "Core", "Avant-bras"],
    equipment: "Mur",
    difficulty: 2,
    description:
      "Handstand face au mur, corps raide, regard entre les mains. Base isométrique pour les HSPU et le contrôle de ligne.",
    variations: ["handstand hold wall", "équilibre mains mur", "chest to wall handstand"]
  },
  "pose corbeau": {
    name: "Pose du corbeau (bakasana)",
    category: "Épaules",
    primaryMuscles: ["Deltoïdes antérieurs", "Triceps brachial"],
    secondaryMuscles: ["Core", "Avant-bras", "Pectoraux"],
    equipment: "Sol",
    difficulty: 2,
    description:
      "Mains au sol, genoux sur les triceps, pieds décollés. Travaille la compression d'avant-bras et le courage du transfert de masse vers l'avant.",
    variations: ["crow pose", "bakasana", "équilibre corbeau"]
  },
  "saut sur box": {
    name: "Saut sur box",
    category: "Quadriceps",
    primaryMuscles: ["Quadriceps", "Fessiers"],
    secondaryMuscles: ["Mollets", "Core", "Ischio-jambiers"],
    equipment: "Box / banc stable",
    difficulty: 2,
    description:
      "Extension de hanches et genoux explosifs pour atterrir en squat partiel sur le support. Développe la puissance des jambes sans matériel lourd.",
    variations: ["box jump", "saut sur banc", "plyo box jump"]
  },
  "pompes décalées": {
    name: "Pompes décalées (staggered)",
    category: "Pectoraux",
    primaryMuscles: ["Pectoraux", "Triceps"],
    secondaryMuscles: ["Deltoïdes antérieurs", "Core", "Obliques"],
    equipment: "Poids du corps",
    difficulty: 2,
    description:
      "Une main placée plus haut que l'autre, alternance des côtés à chaque série. Charge asymétrique modérée pour préparer les pompes archer.",
    variations: ["staggered push-ups", "offset push-ups", "pompes mains décalées"]
  },
  "hollow hold": {
    name: "Hollow hold",
    category: "Abdominaux",
    primaryMuscles: ["Grand droit de l'abdomen", "Transverse de l'abdomen"],
    secondaryMuscles: ["Fléchisseurs de hanche", "Deltoïdes antérieurs", "Quadriceps"],
    equipment: "Sol",
    difficulty: 1,
    description:
      "Allongé dos plaqué, bras au-dessus de la tête, jambes tendues levées, creux abdominal maintenu. Posture de référence pour la ligne en gymnastique et street.",
    variations: ["hollow body hold", "position creux", "abdominal hollow"]
  },
  "arch hold": {
    name: "Arch hold (extension prone)",
    category: "Dorsaux",
    primaryMuscles: ["Érecteurs du rachis", "Fessiers", "Ischio-jambiers"],
    secondaryMuscles: ["Deltoïdes postérieurs", "Trapèzes inférieurs"],
    equipment: "Sol",
    difficulty: 1,
    description:
      "Ventre au sol, bras et jambes tendus décollés, regard au sol. Renforce la chaîne postérieure et équilibre le travail creux du hollow hold.",
    variations: ["superman hold", "prone arch", "extension statique dos"]
  },
  // ACTIVITÉS COMPLÉMENTAIRES
  "boxe": {
    name: "Boxe",
    category: "Activités Complémentaires",
    primaryMuscles: ["Épaules", "Bras", "Core"],
    secondaryMuscles: ["Jambes", "Dos"],
    equipment: "Gants de boxe",
    description: "Sport de combat complet alliant cardio, coordination et technique",
    variations: ["boxing", "boxe anglaise", "entraînement boxe", "sac de frappe"]
  },
  "natation": {
    name: "Natation",
    category: "Activités Complémentaires",
    primaryMuscles: ["Dos", "Épaules", "Bras"],
    secondaryMuscles: ["Core", "Jambes"],
    equipment: "Piscine",
    description: "Sport aquatique complet excellent pour le cardio et la récupération",
    variations: ["swimming", "nage", "piscine", "crawl", "brasse"]
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ENDURANCE & CARDIO — 15 ajouts (intensités contrôlées, distinct des séances de muscu/calistheny)
  // ═══════════════════════════════════════════════════════════════════════
  "course endurance fondamentale": {
    name: "Course endurance fondamentale",
    category: "Activités Complémentaires",
    primaryMuscles: ["Quadriceps", "Ischio-jambiers", "Mollets"],
    secondaryMuscles: ["Fessiers", "Core", "Système cardio-respiratoire"],
    equipment: "Aucun (terrain plat)",
    difficulty: 1,
    description:
      "Sortie continue à allure conversationnelle (≈ zone 2, 65–75 % FCmax). Construit la base aérobie, la densité capillaire et l'efficacité musculaire sans casser la récupération. Volume long, intensité basse.",
    variations: ["footing", "endurance fondamentale", "EF", "easy run", "zone 2 run", "course lente continue"]
  },
  "course récupération active": {
    name: "Course récupération active",
    category: "Activités Complémentaires",
    primaryMuscles: ["Mollets", "Quadriceps", "Ischio-jambiers"],
    secondaryMuscles: ["Fessiers", "Core", "Système cardio-respiratoire"],
    equipment: "Aucun",
    difficulty: 1,
    description:
      "Footing très léger (zone 1, < 65 % FCmax) pour relancer la circulation sans creuser la fatigue. Allure libre, respiration nasale si possible.",
    variations: ["recovery run", "récup active", "zone 1", "footing ultra léger"]
  },
  "course sortie longue": {
    name: "Course sortie longue",
    category: "Activités Complémentaires",
    primaryMuscles: ["Quadriceps", "Ischio-jambiers", "Mollets", "Fessiers"],
    secondaryMuscles: ["Core", "Grand dorsal", "Système cardio-respiratoire"],
    equipment: "Aucun",
    difficulty: 2,
    description:
      "Sortie longue à intensité modérée (souvent zone 2–3) pour développer l'endurance musculaire et la gestion du glycogène. Hydratation et nutrition à prévoir.",
    variations: ["long run", "sortie longue", "longue distance", "endurance longue"]
  },
  "course vitesse": {
    name: "Course vitesse",
    category: "Activités Complémentaires",
    primaryMuscles: ["Quadriceps", "Fessiers", "Mollets", "Ischio-jambiers"],
    secondaryMuscles: ["Core", "Grand dorsal", "Système cardio-respiratoire"],
    equipment: "Chrono / Garmin",
    difficulty: 3,
    description:
      "Séance à allure rapide soutenue (zone 4–5) : blocs VMA, 1 km rapides ou sortie tempo courte. Développe la vitesse et la tolérance à l'effort élevé.",
    variations: ["vitesse", "speed run", "allure rapide", "VMA", "zone 5"]
  },
  "course tempo": {
    name: "Course tempo",
    category: "Activités Complémentaires",
    primaryMuscles: ["Quadriceps", "Ischio-jambiers", "Mollets"],
    secondaryMuscles: ["Fessiers", "Core", "Système cardio-respiratoire"],
    equipment: "Aucun",
    difficulty: 3,
    description:
      "Bloc continu « confortablement dur » (zone 3–4), souvent 20–40 min. Améliore le seuil aérobie et l'économie de course à allure soutenue.",
    variations: ["tempo run", "allure tempo", "zone 3", "steady state"]
  },
  "course seuil": {
    name: "Course seuil",
    category: "Activités Complémentaires",
    primaryMuscles: ["Quadriceps", "Ischio-jambiers", "Mollets", "Fessiers"],
    secondaryMuscles: ["Core", "Grand dorsal", "Système cardio-respiratoire"],
    equipment: "Chrono / capteur FC",
    difficulty: 3,
    description:
      "Travail au seuil lactique (zone 4, ~80–90 % FCmax) : blocs de 8–20 min ou course continue exigeante. Retarde l'apparition de l'acidité musculaire.",
    variations: ["threshold run", "seuil lactique", "STS", "zone 4", "allure seuil"]
  },
  "course fartlek": {
    name: "Course fartlek",
    category: "Activités Complémentaires",
    primaryMuscles: ["Quadriceps", "Fessiers", "Mollets", "Ischio-jambiers"],
    secondaryMuscles: ["Core", "Système cardio-respiratoire"],
    equipment: "Aucun",
    difficulty: 2,
    description:
      "Jeu libre de changements d'allure sur le terrain (arbres, lampadaires, côtes). Mélange aérobie et neuromusculaire sans structure rigide.",
    variations: ["fartlek", "jeu d'allure", "speed play", "fartlek libre"]
  },
  "course compétition": {
    name: "Course compétition",
    category: "Activités Complémentaires",
    primaryMuscles: ["Quadriceps", "Ischio-jambiers", "Mollets", "Fessiers"],
    secondaryMuscles: ["Core", "Grand dorsal", "Deltoïdes", "Système cardio-respiratoire"],
    equipment: "Dossard / chrono",
    difficulty: 3,
    description:
      "Course officielle ou chronométrée à intensité maximale tolérable. Gestion du pacing, adrenaline et récupération post-course prolongée.",
    variations: ["compétition", "course officielle", "race", "chrono", "10 km", "semi", "marathon"]
  },
  "course trail": {
    name: "Course trail",
    category: "Activités Complémentaires",
    primaryMuscles: ["Quadriceps", "Fessiers", "Mollets", "Ischio-jambiers"],
    secondaryMuscles: ["Core", "Tibial antérieur", "Grand dorsal", "Deltoïdes"],
    equipment: "Chaussures trail",
    difficulty: 3,
    description:
      "Course en nature avec dénivelé : montées, descentes techniques, surfaces instables. Sollicite stabilisateurs, excentrique des quadriceps en descente.",
    variations: ["trail", "trail running", "sentier", "nature", "ultra trail"]
  },
  "marche active": {
    name: "Marche active",
    category: "Activités Complémentaires",
    primaryMuscles: ["Quadriceps", "Fessiers", "Mollets", "Tibial antérieur"],
    secondaryMuscles: ["Core", "Ischio-jambiers", "Système cardio-respiratoire"],
    equipment: "Aucun",
    difficulty: 1,
    description:
      "Marche rapide ou marche-course à basse intensité (zone 1–2). Idéal récupération, reprise post-blessure ou volume sans impact élevé.",
    variations: ["marche rapide", "power walk", "marche-course", "walk", "rando légère"]
  },
  "fractionné": {
    name: "Fractionné",
    category: "Activités Complémentaires",
    primaryMuscles: ["Quadriceps", "Ischio-jambiers", "Mollets"],
    secondaryMuscles: ["Fessiers", "Core", "Système cardio-respiratoire"],
    equipment: "Chrono / Garmin",
    difficulty: 3,
    description:
      "Fractionné personnalisé : définis la durée des phases effort et récupération (ex. 1 min rapide / 1 min lent) et le nombre de tours. L’XP tient compte de la structure cochée et des allures Garmin par rapport à tes séances passées.",
    variations: ["fractionné", "intervalles", "VMA", "fartlek structuré", "interval training"]
  },
  "fractionné 30/30": {
    name: "Fractionné 30/30",
    category: "Activités Complémentaires",
    primaryMuscles: ["Quadriceps", "Ischio-jambiers", "Mollets"],
    secondaryMuscles: ["Fessiers", "Core", "Système cardio-respiratoire"],
    equipment: "Chrono",
    difficulty: 3,
    description:
      "Intervalles courts de 30 s à allure VMA (95–105 %) suivis de 30 s en récupération active. Idéal pour développer la VMA et la capacité à répéter des efforts intenses sans creuser un déficit excessif.",
    variations: ["30 30", "30/30 VMA", "intervalle court", "fractionné court", "short intervals"]
  },
  "fractionné long VMA": {
    name: "Fractionné long VMA",
    category: "Activités Complémentaires",
    primaryMuscles: ["Quadriceps", "Ischio-jambiers", "Mollets"],
    secondaryMuscles: ["Fessiers", "Core", "Système cardio-respiratoire"],
    equipment: "Piste / chrono",
    difficulty: 3,
    description:
      "Répétitions longues (3 à 6 min) à 90–100 % VMA avec récupération mi-effort. Travaille la consommation maximale d'oxygène (VO2max) et l'endurance lactique. Format type : 5×1000 m ou 4×3 min.",
    variations: ["fractionné long", "long intervals", "VO2max intervals", "1000m repeats", "fractionné 1000"]
  },
  "sprints en côte": {
    name: "Sprints en côte",
    category: "Activités Complémentaires",
    primaryMuscles: ["Quadriceps", "Fessiers", "Mollets"],
    secondaryMuscles: ["Ischio-jambiers", "Core", "Deltoïdes"],
    equipment: "Côte (5–10 % de pente)",
    difficulty: 3,
    description:
      "Sprints maximaux de 8 à 15 s sur une côte modérée, récupération marche descendante complète. Développe la puissance horizontale, l'économie de course et préserve les ischio-jambiers grâce à la pente.",
    variations: ["hill sprints", "côtes courtes", "sprint montée", "uphill sprints", "sprints sur côte"]
  },
  "corde à sauter": {
    name: "Corde à sauter",
    category: "Activités Complémentaires",
    primaryMuscles: ["Mollets", "Avant-bras"],
    secondaryMuscles: ["Quadriceps", "Core", "Deltoïdes", "Système cardio-respiratoire"],
    equipment: "Corde à sauter",
    difficulty: 1,
    description:
      "Sauts pieds joints à cadence régulière (~140 sauts/min). Excellent travail de coordination, élasticité du mollet et endurance cardio. Démarrer par séries courtes pour préserver les tendons d'Achille.",
    variations: ["jump rope", "skipping", "saut corde", "corde", "rope skipping"]
  },
  "double under corde à sauter": {
    name: "Double under corde à sauter",
    category: "Activités Complémentaires",
    primaryMuscles: ["Mollets", "Avant-bras"],
    secondaryMuscles: ["Quadriceps", "Core", "Deltoïdes"],
    equipment: "Corde à sauter rapide",
    difficulty: 3,
    description:
      "Saut suffisamment haut pour que la corde passe deux fois sous les pieds en un seul saut. Demande puissance plio, précision du poignet et timing. Référence en cardio cross-training.",
    variations: ["double under", "DU", "double tour", "double-unders", "double sauts corde"]
  },
  "rameur indoor": {
    name: "Rameur indoor",
    category: "Activités Complémentaires",
    primaryMuscles: ["Grand dorsal", "Quadriceps", "Fessiers"],
    secondaryMuscles: ["Ischio-jambiers", "Core", "Biceps", "Deltoïdes postérieurs"],
    equipment: "Rameur (concept2 / similaire)",
    difficulty: 2,
    description:
      "Geste cyclique en 4 phases (drive jambes → bascule du tronc → tirage bras → retour). Sport portant peu d'impact qui sollicite ~85 % de la masse musculaire et délivre un travail cardio puissant.",
    variations: ["rowing erg", "rameur", "concept2", "rowing machine", "row erg"]
  },
  "vélo elliptique": {
    name: "Vélo elliptique",
    category: "Activités Complémentaires",
    primaryMuscles: ["Quadriceps", "Fessiers", "Mollets"],
    secondaryMuscles: ["Ischio-jambiers", "Grand dorsal", "Deltoïdes postérieurs", "Triceps", "Core"],
    equipment: "Machine elliptique",
    difficulty: 1,
    description:
      "Pédalage elliptique avec poignées mobiles : cardio sans impact qui mobilise haut et bas du corps. Idéal en récupération active ou pour gros volume sans contrainte articulaire.",
    variations: ["elliptique", "elliptical", "cross trainer", "vélo elliptique salle"]
  },
  "vélo de route": {
    name: "Vélo de route",
    category: "Activités Complémentaires",
    primaryMuscles: ["Quadriceps", "Fessiers"],
    secondaryMuscles: ["Ischio-jambiers", "Mollets", "Core", "Système cardio-respiratoire"],
    equipment: "Vélo de route",
    difficulty: 2,
    description:
      "Sortie cycliste extérieure : cardio porté avec gestion de cadence (80–100 rpm) et puissance. Excellente complément au running pour augmenter le volume sans surcharge d'impacts.",
    variations: ["cyclisme", "vélo route", "road bike", "vélo extérieur", "sortie vélo"]
  },
  "vélo d'appartement HIIT": {
    name: "Vélo d'appartement HIIT",
    category: "Activités Complémentaires",
    primaryMuscles: ["Quadriceps", "Fessiers"],
    secondaryMuscles: ["Mollets", "Ischio-jambiers", "Core"],
    equipment: "Vélo stationnaire",
    difficulty: 3,
    description:
      "Intervalles courts à puissance maximale (15–60 s) suivis de récupération active. Permet un travail VO2max et seuil sans aucun impact, idéal après des séances de pliométrie ou de course.",
    variations: ["HIIT bike", "vélo HIIT", "spinning intervals", "exercise bike intervals", "indoor cycling intervals"]
  },
  "ski erg": {
    name: "Ski erg",
    category: "Activités Complémentaires",
    primaryMuscles: ["Grand dorsal", "Triceps", "Core"],
    secondaryMuscles: ["Pectoraux", "Quadriceps", "Fessiers", "Avant-bras"],
    equipment: "Machine SkiErg",
    difficulty: 2,
    description:
      "Geste de double poussée du ski de fond : tirage vertical des deux bras avec engagement du tronc et flexion-extension de hanche. Cardio puissance haut du corps de référence.",
    variations: ["ski erg concept2", "skierg", "double poling machine", "ski machine"]
  },
  "assault bike": {
    name: "Assault bike",
    category: "Activités Complémentaires",
    primaryMuscles: ["Quadriceps", "Fessiers", "Grand dorsal", "Pectoraux"],
    secondaryMuscles: ["Triceps", "Deltoïdes", "Core"],
    equipment: "Air bike (assault / echo)",
    difficulty: 3,
    description:
      "Vélo à résistance air avec bras mobiles : la résistance augmente avec l'effort, ce qui en fait un outil cardio très exigeant pour le HIIT et le seuil. Engage l'ensemble du corps simultanément.",
    variations: ["air bike", "echo bike", "assault airbike", "fan bike"]
  },
  "kettlebell swings": {
    name: "Kettlebell swings",
    category: "Fessiers",
    primaryMuscles: ["Fessiers", "Ischio-jambiers"],
    secondaryMuscles: ["Érecteurs du rachis", "Core", "Deltoïdes", "Avant-bras"],
    equipment: "Kettlebell",
    difficulty: 2,
    description:
      "Swing balistique russe (à hauteur d'épaule) ou américain (au-dessus de la tête). L'extension de hanche explosive propulse la kettlebell ; les bras sont seulement guides. Combine puissance fessiers et cardio.",
    variations: ["swing kettlebell", "kb swing", "russian swing", "american swing", "balancier kettlebell"]
  },
  "shadow boxing": {
    name: "Shadow boxing",
    category: "Activités Complémentaires",
    primaryMuscles: ["Épaules", "Core"],
    secondaryMuscles: ["Bras", "Jambes", "Système cardio-respiratoire"],
    equipment: "Aucun",
    difficulty: 1,
    description:
      "Boxe sans cible : enchaînements jab-cross-hook-uppercut, esquives et déplacements. Travail technique et cardio léger, parfait pour échauffement, conditionnement ou récupération active.",
    variations: ["shadowboxing", "boxe ombre", "shadow box", "boxe sans gants", "ombre"]
  },
  "montée d'escaliers": {
    name: "Montée d'escaliers",
    category: "Activités Complémentaires",
    primaryMuscles: ["Quadriceps", "Fessiers"],
    secondaryMuscles: ["Mollets", "Ischio-jambiers", "Core"],
    equipment: "Escalier / stair-master",
    difficulty: 2,
    description:
      "Course ou marche soutenue dans un escalier (immeuble, stade, machine stair-master). Recrutement marqué des fessiers et quadriceps avec contraintes articulaires modérées sur la descente (à éviter rapide).",
    variations: ["stair climber", "stair master", "course escaliers", "stair run", "monter les escaliers"]
  },

  // ═══════════════════════════════════════════════════════════════════════
  // STREET WORKOUT & CALISTHÉNIE — 11 ajouts avancés
  // ═══════════════════════════════════════════════════════════════════════
  "one arm push-up": {
    name: "Pompe à un bras (one arm push-up)",
    category: "Pectoraux",
    primaryMuscles: ["Pectoraux", "Triceps brachial"],
    secondaryMuscles: ["Deltoïdes antérieurs", "Core", "Obliques", "Avant-bras"],
    equipment: "Sol",
    difficulty: 4,
    description:
      "Pompe stricte exécutée sur un seul bras, pieds écartés pour stabilité. Anti-rotation puissante du tronc, charge ~70 % du poids du corps sur le bras d'appui. Référence du street workout horizontal.",
    variations: ["one arm pushup", "OAP", "pompe un bras", "pompe unilatérale", "single arm push up"]
  },
  "negative one arm pull-up": {
    name: "Traction un bras négative",
    category: "Dorsaux",
    primaryMuscles: ["Grand dorsal", "Biceps brachial"],
    secondaryMuscles: ["Brachial antérieur", "Avant-bras", "Rhomboïdes", "Core"],
    equipment: "Barre de traction",
    difficulty: 4,
    description:
      "Sauter en haut de la barre puis descendre lentement (3–6 s) sur un seul bras, l'autre dans le dos ou contre la poitrine. Technique d'overload excentrique pour préparer la traction un bras stricte.",
    variations: ["one arm pull-up negative", "OAPU négative", "traction 1 bras excentrique", "negative chin-up one arm"]
  },
  "handstand push-ups libres": {
    name: "Handstand push-ups libres (HSPU sans mur)",
    category: "Épaules",
    primaryMuscles: ["Deltoïdes antérieurs", "Triceps brachial"],
    secondaryMuscles: ["Trapèzes", "Pectoraux supérieurs", "Core", "Avant-bras"],
    equipment: "Sol",
    difficulty: 4,
    description:
      "Handstand strict en équilibre sans appui, fléchir les coudes jusqu'à toucher le sol avec la tête puis verrouiller bras tendus. Demande équilibre, force scapulaire et force triceps maximale.",
    variations: ["free HSPU", "freestanding handstand push-ups", "HSPU libre", "HSPU sans appui", "handstand pushup freestanding"]
  },
  "tuck planche hold": {
    name: "Tuck planche hold",
    category: "Épaules",
    primaryMuscles: ["Deltoïdes antérieurs", "Pectoraux"],
    secondaryMuscles: ["Triceps brachial", "Core", "Dentelé antérieur", "Avant-bras"],
    equipment: "Sol / parallettes",
    difficulty: 3,
    description:
      "Appui sur les mains, genoux serrés contre la poitrine, hanches au-dessus des épaules, pieds décollés. Première étape réelle de la planche : charge énorme sur le deltoïde antérieur en levier réduit.",
    variations: ["tuck planche", "advanced tuck planche", "planche groupée", "frog planche tuck"]
  },
  "straddle planche hold": {
    name: "Straddle planche hold",
    category: "Épaules",
    primaryMuscles: ["Deltoïdes antérieurs", "Pectoraux"],
    secondaryMuscles: ["Triceps brachial", "Core", "Dentelé antérieur", "Fessiers"],
    equipment: "Sol / parallettes",
    difficulty: 4,
    description:
      "Appui sur les mains, jambes tendues écartées en V à l'horizontale, hanches au-dessus des épaules. Étape avant la full planche : levier intermédiaire qui demande force protraction et compression.",
    variations: ["straddle planche", "planche écartée", "planche jambes ouvertes"]
  },
  "front lever raises": {
    name: "Front lever raises",
    category: "Dorsaux",
    primaryMuscles: ["Grand dorsal", "Grand droit de l'abdomen"],
    secondaryMuscles: ["Triceps longue portion", "Deltoïdes postérieurs", "Fessiers", "Avant-bras"],
    equipment: "Barre de traction",
    difficulty: 4,
    description:
      "Depuis la suspension bras tendus, monter le corps à l'horizontale en front lever puis redescendre contrôlé. Mouvement dynamique le plus complet pour développer la force du front lever.",
    variations: ["front lever raise", "FL raise", "lever avant raises", "front lever pulls"]
  },
  "assisted muscle-up élastique": {
    name: "Muscle-up assisté à l'élastique",
    category: "Dorsaux",
    primaryMuscles: ["Grand dorsal", "Triceps brachial", "Pectoraux"],
    secondaryMuscles: ["Deltoïdes antérieurs", "Biceps brachial", "Core", "Avant-bras"],
    equipment: "Barre + Élastique",
    difficulty: 3,
    description:
      "Boucle d'élastique passée sur la barre et sous les pieds (ou genoux) pour réduire la charge. Permet de répéter la trajectoire complète du muscle-up et d'apprendre la transition au-dessus de la barre.",
    variations: ["muscle up assisté", "band muscle up", "muscle-up bande élastique", "assisted muscle-up", "MU assisted"]
  },
  "dips lestés": {
    name: "Dips lestés",
    category: "Triceps",
    primaryMuscles: ["Triceps brachial", "Pectoraux inférieurs"],
    secondaryMuscles: ["Deltoïdes antérieurs", "Core"],
    equipment: "Barres parallèles + ceinture lestée",
    difficulty: 3,
    description:
      "Dips classiques aux parallèles avec une ceinture lestée ou un haltère entre les chevilles. Méthode de progression la plus directe pour passer du calistheny à de la vraie surcharge sur le bras.",
    variations: ["weighted dips", "dips ceinture lestée", "dips lest", "dips avec poids", "dips avec lest"]
  },
  "drapeau humain straddle": {
    name: "Drapeau humain straddle",
    category: "Abdominaux",
    primaryMuscles: ["Obliques", "Grand dorsal", "Deltoïdes"],
    secondaryMuscles: ["Trapèzes", "Triceps", "Fessiers", "Quadriceps", "Avant-bras"],
    equipment: "Barre verticale / poteau",
    difficulty: 4,
    description:
      "Drapeau humain horizontal corps de profil au poteau, jambes ouvertes en V pour réduire le levier. Étape intermédiaire vers le full flag : transfert massif vers la chaîne latérale et les épaules.",
    variations: ["straddle human flag", "drapeau jambes écartées", "human flag straddle", "flag straddle"]
  },
  "pompes triple claquées": {
    name: "Pompes triple claquées",
    category: "Pectoraux",
    primaryMuscles: ["Pectoraux", "Triceps"],
    secondaryMuscles: ["Deltoïdes antérieurs", "Core", "Mollets"],
    equipment: "Sol",
    difficulty: 4,
    description:
      "Pompe pliométrique poussée à pleine puissance permettant 3 claquements de mains pendant la phase aérienne. Demande détente, force d'absorption et coordination – à n'aborder qu'après les pompes claquées simples.",
    variations: ["triple clap push-ups", "3 claps push-ups", "pompes claquées triples", "triple-clap pushup"]
  },
  "one arm dead hang": {
    name: "Suspension à un bras (one arm dead hang)",
    category: "Dorsaux",
    primaryMuscles: ["Grand dorsal", "Avant-bras"],
    secondaryMuscles: ["Trapèzes inférieurs", "Coiffe des rotateurs", "Core"],
    equipment: "Barre de traction",
    difficulty: 3,
    description:
      "Suspension passive sur un seul bras à la barre. Préparation indispensable à la traction un bras : conditionne la prise, l'épaule (descendue, packée) et la coiffe sous charge maximale.",
    variations: ["one arm hang", "OAH", "suspension un bras", "single arm dead hang", "one-arm bar hang"]
  },

  // ═══════════════════════════════════════════════════════════════════════
  // MUSCULATION & ACCESSOIRES — 24 ajouts (salle / haltères / poulies)
  // ═══════════════════════════════════════════════════════════════════════
  "landmine press": {
    name: "Landmine press",
    category: "Épaules",
    primaryMuscles: ["Deltoïdes antérieurs"],
    secondaryMuscles: ["Pectoraux supérieurs", "Triceps", "Trapèzes supérieurs", "Core"],
    equipment: "Landmine / coin de barre + disque",
    difficulty: 2,
    description:
      "Pousser une extrémité de barre fichée dans un landmine vers le haut et l'avant, à un ou deux bras. Trajectoire intermédiaire entre développé incliné et militaire, plus tolérante pour l'épaule.",
    variations: ["landmine shoulder press", "press landmine", "landmine 1 arm press", "single arm landmine press"]
  },
  "landmine row": {
    name: "Landmine row",
    category: "Dorsaux",
    primaryMuscles: ["Grand dorsal", "Rhomboïdes", "Trapèzes moyens"],
    secondaryMuscles: ["Biceps", "Deltoïdes postérieurs", "Érecteurs du rachis", "Core"],
    equipment: "Landmine + poignée en V",
    difficulty: 2,
    description:
      "Tirage à 2 mains (poignée en V) ou unilatéral d'une barre en landmine, buste penché. Charge importante avec angle stable, idéal pour épaisseur du dos sans solliciter le bas du dos comme un t-bar libre.",
    variations: ["landmine t-bar row", "row landmine", "rowing landmine", "single arm landmine row", "meadows row"]
  },
  "landmine squat": {
    name: "Landmine squat",
    category: "Quadriceps",
    primaryMuscles: ["Quadriceps", "Fessiers"],
    secondaryMuscles: ["Core", "Érecteurs du rachis", "Adducteurs"],
    equipment: "Landmine + barre",
    difficulty: 2,
    description:
      "Squat avec extrémité de barre tenue contre la poitrine, l'autre extrémité pivotant dans le landmine. Trajectoire arquée naturelle qui aide à conserver le buste droit – excellent pour apprendre le front squat.",
    variations: ["landmine front squat", "viking squat", "squat landmine", "barbell landmine squat"]
  },
  "squat zercher": {
    name: "Squat Zercher",
    category: "Quadriceps",
    primaryMuscles: ["Quadriceps", "Fessiers"],
    secondaryMuscles: ["Core", "Trapèzes supérieurs", "Biceps", "Érecteurs du rachis"],
    equipment: "Barre",
    difficulty: 3,
    description:
      "Barre tenue dans le pli des coudes contre le buste. Force à garder un tronc très vertical et engage massivement le core, les biceps et le haut du dos en isométrique. Très bon pour la robustesse globale.",
    variations: ["zercher squat", "squat coudes barre", "front holdsquat", "barre coude squat"]
  },
  "soulevé de terre déficit": {
    name: "Soulevé de terre déficit",
    category: "Dorsaux",
    primaryMuscles: ["Érecteurs du rachis", "Fessiers", "Ischio-jambiers"],
    secondaryMuscles: ["Grand dorsal", "Trapèzes", "Quadriceps", "Avant-bras"],
    equipment: "Barre + plateforme 3–8 cm",
    difficulty: 3,
    description:
      "Soulevé de terre debout sur une plateforme basse pour augmenter l'amplitude au démarrage. Renforce la position de départ et le « pull from the floor » – à n'utiliser qu'avec une bonne mobilité des hanches.",
    variations: ["deficit deadlift", "deadlift déficit", "sdt déficit", "elevated deadlift", "deficit conventional deadlift"]
  },
  "t-bar row": {
    name: "T-bar row",
    category: "Dorsaux",
    primaryMuscles: ["Grand dorsal", "Rhomboïdes"],
    secondaryMuscles: ["Trapèzes moyens", "Biceps", "Deltoïdes postérieurs", "Érecteurs du rachis"],
    equipment: "Machine t-bar / barre + poignée v",
    difficulty: 2,
    description:
      "Tirage horizontal sur une barre fixée par une extrémité, poignée en V, buste fortement penché. Permet de charger lourd avec une trajectoire stable et un excellent recrutement de l'épaisseur du dos.",
    variations: ["tbar row", "rowing t-bar", "t-bar machine row", "landmine t bar"]
  },
  "jm press": {
    name: "JM press",
    category: "Triceps",
    primaryMuscles: ["Triceps brachial"],
    secondaryMuscles: ["Pectoraux", "Deltoïdes antérieurs"],
    equipment: "Barre + Banc",
    difficulty: 3,
    description:
      "Hybride entre développé couché prise serrée et barre au front : descente de la barre vers la base du cou avec coudes orientés vers l'avant. Très ciblé triceps et favori du powerlifting pour le bench.",
    variations: ["jm press barre", "jm bench press", "j.m. blakley press"]
  },
  "tate press": {
    name: "Tate press",
    category: "Triceps",
    primaryMuscles: ["Triceps brachial"],
    secondaryMuscles: ["Pectoraux"],
    equipment: "Haltères + Banc",
    difficulty: 2,
    description:
      "Allongé sur un banc, haltères paumes vers les pieds, descendre les coudes vers l'extérieur jusqu'à effleurer la poitrine puis tendre les bras. Cible la longue portion et le vaste latéral du triceps.",
    variations: ["tate dumbbell press", "elbows out tricep press", "tate triceps press"]
  },
  "seal row banc": {
    name: "Seal row au banc",
    category: "Dorsaux",
    primaryMuscles: ["Grand dorsal", "Rhomboïdes", "Trapèzes moyens"],
    secondaryMuscles: ["Deltoïdes postérieurs", "Biceps"],
    equipment: "Banc surélevé + Barre/Haltères",
    difficulty: 2,
    description:
      "Allongé sur le ventre sur un banc surélevé, tirer une barre ou des haltères vers la poitrine. La position élimine la triche du bas du dos et impose un travail strict du dos haut.",
    variations: ["seal row", "rowing allongé banc", "chest supported seal row", "lying row prone"]
  },
  "curl 21": {
    name: "Curl 21",
    category: "Biceps",
    primaryMuscles: ["Biceps brachial"],
    secondaryMuscles: ["Brachial antérieur"],
    equipment: "Barre / Barre EZ",
    difficulty: 2,
    description:
      "Méthode d'intensification : 7 répétitions sur la moitié basse, 7 sur la moitié haute, puis 7 complètes, sans temps de repos. Forte congestion et travail isométrique implicite sur tout l'arc.",
    variations: ["21s curl", "twentyone curl", "curl 21 reps", "21 reps biceps", "barbell 21s"]
  },
  "tirage poulie haute prise neutre serrée": {
    name: "Tirage poulie haute prise neutre serrée",
    category: "Dorsaux",
    primaryMuscles: ["Grand dorsal"],
    secondaryMuscles: ["Biceps brachial", "Brachial antérieur", "Trapèzes inférieurs", "Rhomboïdes"],
    equipment: "Poulie haute + poignée v / triangle",
    difficulty: 1,
    description:
      "Tirage vertical avec poignée triangle (mains se touchant, paumes face à face). Cible particulièrement le bas du grand dorsal et permet une amplitude proche de la traction supination.",
    variations: ["close grip neutral pulldown", "v-bar pulldown", "tirage vertical poignée v", "tirage neutre serré", "tirage vertical neutre"]
  },
  "prone y raise": {
    name: "Prone Y raise",
    category: "Épaules",
    primaryMuscles: ["Trapèzes inférieurs", "Deltoïdes postérieurs"],
    secondaryMuscles: ["Rhomboïdes", "Coiffe des rotateurs"],
    equipment: "Banc incliné + Haltères légers",
    difficulty: 1,
    description:
      "Allongé face contre un banc incliné, élever les bras tendus en Y (45°) avec pouces vers le ciel. Renforce le trapèze inférieur, clé pour la santé de l'épaule et le verrouillage scapulaire.",
    variations: ["y raise prone", "incline bench y raise", "élévations en Y", "y raises", "trap raises Y"]
  },
  "machine row poitrine appuyée": {
    name: "Machine row poitrine appuyée",
    category: "Dorsaux",
    primaryMuscles: ["Grand dorsal", "Rhomboïdes", "Trapèzes moyens"],
    secondaryMuscles: ["Deltoïdes postérieurs", "Biceps"],
    equipment: "Machine row chest supported",
    difficulty: 1,
    description:
      "Machine de tirage avec coussin pour la poitrine : élimine totalement la compensation lombaire et permet un travail strict du dos haut. Excellente pour volume modéré et progression linéaire.",
    variations: ["chest supported row", "row appuie poitrine", "machine row pad", "iso lever row chest support"]
  },
  "cable lateral raise unilatéral cheville": {
    name: "Élévation latérale unilatérale poulie cheville",
    category: "Épaules",
    primaryMuscles: ["Deltoïdes moyens"],
    secondaryMuscles: ["Trapèzes supérieurs"],
    equipment: "Poulie basse + sangle cheville",
    difficulty: 2,
    description:
      "Sangle cheville fixée à la poulie basse, poignée tenue par la main opposée à la poulie. La résistance reste forte dès le début du mouvement, contrairement aux haltères. Excellent pour le travail strict du deltoïde latéral.",
    variations: ["cable lateral raise", "élévation latérale poulie 1 bras", "single arm cable lateral", "lateral raise cable poulie cheville"]
  },
  "cuban press": {
    name: "Cuban press",
    category: "Épaules",
    primaryMuscles: ["Deltoïdes", "Coiffe des rotateurs"],
    secondaryMuscles: ["Trapèzes", "Triceps"],
    equipment: "Haltères légers / barre EZ",
    difficulty: 2,
    description:
      "Combine tirage menton, rotation externe (épaules à 90°) puis développé au-dessus de la tête. Parfait pour réveiller la coiffe des rotateurs et préparer les épaules à du travail lourd.",
    variations: ["cuban rotation", "press cubain", "cuban shoulder press", "rotator cuff press"]
  },
  "wrist curl": {
    name: "Wrist curl (curl poignets)",
    category: "Avant-bras",
    primaryMuscles: ["Fléchisseurs des doigts", "Avant-bras"],
    secondaryMuscles: [],
    equipment: "Haltères / barre EZ",
    difficulty: 1,
    description:
      "Avant-bras posés sur les cuisses ou un banc, paumes vers le haut, fléchir les poignets vers soi en relâchant la charge en bout de doigts puis remonter. Cible la face antérieure des avant-bras.",
    variations: ["curl poignets", "barbell wrist curl", "dumbbell wrist curl", "flexion poignets", "wrist flexion curl"]
  },
  "reverse wrist curl": {
    name: "Reverse wrist curl",
    category: "Avant-bras",
    primaryMuscles: ["Extenseurs des doigts", "Avant-bras"],
    secondaryMuscles: ["Brachio-radial"],
    equipment: "Haltères / barre EZ",
    difficulty: 1,
    description:
      "Avant-bras posés, paumes vers le bas, étendre les poignets vers le haut puis redescendre lentement. Cible les extenseurs de l'avant-bras, souvent négligés et pourtant clés contre l'épicondylite.",
    variations: ["reverse wrist curl haltères", "extenseurs poignets", "curl poignets inversé", "wrist extension curl"]
  },
  "plate pinch": {
    name: "Plate pinch",
    category: "Avant-bras",
    primaryMuscles: ["Fléchisseurs des doigts", "Avant-bras"],
    secondaryMuscles: ["Pouce", "Trapèzes supérieurs"],
    equipment: "Disques lisses (5–15 kg)",
    difficulty: 2,
    description:
      "Pincer 1 ou 2 disques face lisse à l'extérieur entre pouce et autres doigts, tenir le plus longtemps possible. Renforce la pince et l'endurance des fléchisseurs des doigts (utile pour calistheny et grimpe).",
    variations: ["plate pinch hold", "pinch grip", "disque pince", "plate pinching", "pinch carry"]
  },
  "farmer's walk": {
    name: "Farmer's walk",
    category: "Épaules",
    primaryMuscles: ["Trapèzes supérieurs", "Avant-bras"],
    secondaryMuscles: ["Core", "Fessiers", "Quadriceps", "Mollets"],
    equipment: "Haltères lourds / kettlebells / handles",
    difficulty: 2,
    description:
      "Marcher sur une distance donnée avec une charge lourde dans chaque main, posture verticale, omoplates basses. Renforce la prise, le tronc, les trapèzes et la chaîne posturale globale.",
    variations: ["farmers walk", "marche du fermier", "farmer carry", "loaded carry", "fermier carry"]
  },
  "cable wood chop": {
    name: "Cable wood chop",
    category: "Abdominaux",
    primaryMuscles: ["Obliques"],
    secondaryMuscles: ["Grand droit de l'abdomen", "Transverse", "Deltoïdes", "Fessiers"],
    equipment: "Poulie haute ou basse",
    difficulty: 2,
    description:
      "Mouvement de coupe en diagonal d'une poulie haute vers la hanche opposée (ou inverse). Geste fonctionnel d'anti-rotation/rotation contrôlée pour les obliques et la chaîne en X.",
    variations: ["wood chop", "high to low chop", "chopper poulie", "diagonal cable chop", "wood chopper"]
  },
  "dead bug": {
    name: "Dead bug",
    category: "Abdominaux",
    primaryMuscles: ["Grand droit de l'abdomen", "Transverse de l'abdomen"],
    secondaryMuscles: ["Obliques", "Fléchisseurs de hanche"],
    equipment: "Tapis",
    difficulty: 1,
    description:
      "Allongé sur le dos, bras tendus au plafond et hanches/genoux à 90°, étendre simultanément un bras (en arrière) et la jambe opposée (vers le sol) sans creuser le bas du dos. Référence en stabilité lombaire.",
    variations: ["deadbug", "dead bug abs", "anti-extension allongé", "dead bug exercise"]
  },
  "bird dog": {
    name: "Bird dog",
    category: "Dorsaux",
    primaryMuscles: ["Érecteurs du rachis", "Fessiers"],
    secondaryMuscles: ["Deltoïdes", "Core", "Multifides"],
    equipment: "Tapis",
    difficulty: 1,
    description:
      "À quatre pattes, étendre un bras devant et la jambe opposée derrière jusqu'à l'horizontale, sans rotation des hanches ni creusement lombaire. Travail fondamental d'anti-rotation et de stabilité lombaire.",
    variations: ["birddog", "quadruped opposite arm leg", "bird-dog", "anti-rotation quadrupédie"]
  },
  "russian twist": {
    name: "Russian twist",
    category: "Abdominaux",
    primaryMuscles: ["Obliques"],
    secondaryMuscles: ["Grand droit de l'abdomen", "Fléchisseurs de hanche"],
    equipment: "Poids du corps / haltère / médecine ball",
    difficulty: 1,
    description:
      "Assis pieds décollés (option), buste incliné en arrière, faire pivoter le tronc d'un côté à l'autre en touchant le sol près des hanches. Cible les obliques en rotation dynamique sous tension.",
    variations: ["russian twists", "twist russe", "rotation tronc assis", "weighted russian twist"]
  },
  "copenhagen plank": {
    name: "Copenhagen plank",
    category: "Quadriceps",
    primaryMuscles: ["Adducteurs"],
    secondaryMuscles: ["Obliques", "Fessiers moyens", "Core"],
    equipment: "Banc / chaise",
    difficulty: 3,
    description:
      "Gainage latéral avec la jambe supérieure posée sur un banc (cheville ou genou) et la jambe inférieure dans le vide. Sollicite intensément les adducteurs en isométrie : prévention majeure des blessures de hanche/aine en sport.",
    variations: ["copenhagen side plank", "adductor plank", "gainage adducteurs", "copenhagen hold", "adductor side plank"]
  },
  "monster walk": {
    name: "Monster walk",
    category: "Fessiers",
    primaryMuscles: ["Grand fessier", "Moyen fessier"],
    secondaryMuscles: ["Abducteurs", "Quadriceps"],
    equipment: "Bande élastique (chevilles ou au-dessus des genoux)",
    difficulty: 1,
    description:
      "Marche latérale genoux légèrement fléchis avec bande élastique. Active le moyen fessier — référence en prévention du syndrome de l'essuie-glace et des douleurs latérales de genou chez le coureur.",
    variations: ["monster walks", "banded lateral walk", "marche latérale élastique", "crab walk band"]
  },
  "rotation externe élastique": {
    name: "Rotation externe élastique",
    category: "Épaules",
    primaryMuscles: ["Coiffe des rotateurs", "Infraspinatus"],
    secondaryMuscles: ["Trapèze moyen", "Deltoïde postérieur"],
    equipment: "Bande élastique",
    difficulty: 1,
    description:
      "Coude au corps à 90°, rotation externe contre élastique. Renforce la coiffe des rotateurs sans charge axiale — pilier de la rééducation épaule et prévention des conflits sous-acromiaux.",
    variations: ["external rotation band", "rotateur externe élastique", "ER band", "rotation externe épaule"]
  },
  "pompes scapulaires": {
    name: "Pompes scapulaires (push-up plus)",
    category: "Épaules",
    primaryMuscles: ["Serratus antérieur", "Trapèze inférieur"],
    secondaryMuscles: ["Pectoraux", "Deltoïdes"],
    equipment: "Poids du corps",
    difficulty: 1,
    description:
      "Position haute de pompe : sans plier les coudes, laisse les omoplates se rapprocher puis s'éloigner (protraction/rétraction). Réactive le dentelé antérieur et stabilise la scapula.",
    variations: ["push-up plus", "scapular push-up", "serratus push-up", "protraction scapulaire"]
  },
  "serratus punch": {
    name: "Serratus punch",
    category: "Épaules",
    primaryMuscles: ["Serratus antérieur"],
    secondaryMuscles: ["Trapèze inférieur", "Deltoïde antérieur"],
    equipment: "Bande élastique ou câble",
    difficulty: 1,
    description:
      "Bras tendu devant soi, pousse en avant (shadow boxing) en laissant l'omoplate glisser autour du thorax. Cible le dentelé antérieur — utile en scapula alata et instabilité scapulaire.",
    variations: ["serratus punches", "protraction punch", "straight arm punch band"]
  },
  "squat décliné rééducation": {
    name: "Squat décliné (rééducation genou)",
    category: "Quadriceps",
    primaryMuscles: ["Quadriceps"],
    secondaryMuscles: ["Fessiers", "Mollets"],
    equipment: "Planche inclinée / rampe",
    difficulty: 2,
    description:
      "Squat avec talons surélevés (planche ou rampe) pour augmenter la flexion de genou sans charge lourde. Variante courante en tendinopathie rotulienne et Hoffite, souvent en complément du Spanish squat.",
    variations: ["decline squat", "squat décliné", "heels elevated squat rehab"]
  },
  "descente excentrique mollet": {
    name: "Descente excentrique mollet (Achille)",
    category: "Mollets",
    primaryMuscles: ["Gastrocnémiens", "Soléaire"],
    secondaryMuscles: ["Tendon d'Achille"],
    equipment: "Marche / step",
    difficulty: 2,
    description:
      "Debout sur une marche, montée bilatérale puis descente lente sur une jambe (3 s minimum). Protocole Alfredson classique pour tendinopathie d'Achille — matin et soir.",
    variations: ["eccentric heel drop", "alfredson protocol", "descente achille", "excentrique mollet"]
  },
  "éversion cheville élastique": {
    name: "Éversion cheville élastique",
    category: "Mollets",
    primaryMuscles: ["Fibulaires", "Long fibulaire"],
    secondaryMuscles: ["Stabilisateurs de cheville"],
    equipment: "Bande élastique",
    difficulty: 1,
    description:
      "Assis, élastique autour de l'avant-pied : pousse le pied vers l'extérieur contre résistance. Renforce les éverseurs après entorse ou tendinopathie des fibulaires.",
    variations: ["ankle eversion band", "éversion élastique", "fibular strengthening"]
  },
  "inversion cheville élastique": {
    name: "Inversion cheville élastique",
    category: "Mollets",
    primaryMuscles: ["Tibial postérieur", "Tibial antérieur"],
    secondaryMuscles: ["Stabilisateurs de cheville"],
    equipment: "Bande élastique",
    difficulty: 1,
    description:
      "Assis, élastique : ramène la plante du pied vers l'intérieur contre résistance. Utile en tendinopathie du tibial postérieur et prévention entorses.",
    variations: ["ankle inversion band", "inversion élastique", "tib post strengthening"]
  },
  "adduction hanche élastique": {
    name: "Adduction hanche élastique",
    category: "Quadriceps",
    primaryMuscles: ["Adducteurs"],
    secondaryMuscles: ["Fessiers", "Core"],
    equipment: "Bande élastique",
    difficulty: 1,
    description:
      "Debout, élastique autour de la cheville : ramène la jambe vers la ligne médiane contre résistance. Complément du Copenhagen plank pour pubalgie et adducteurs.",
    variations: ["hip adduction band", "adduction élastique", "standing adduction band"]
  },
  "curl poignet excentrique": {
    name: "Curl poignet excentrique",
    category: "Avant-bras",
    primaryMuscles: ["Extenseurs du poignet", "Extenseurs des doigts"],
    secondaryMuscles: ["Brachioradial"],
    equipment: "Haltère léger",
    difficulty: 1,
    description:
      "Aide-toi de l'autre main pour monter, puis descends lentement (3–4 s) en contrôlant l'haltère. Protocole classique épicondylite latérale (tennis elbow).",
    variations: ["eccentric wrist extension", "tyler twist", "excentrique extenseurs poignet"]
  },
  "flexion poignet excentrique": {
    name: "Flexion poignet excentrique",
    category: "Avant-bras",
    primaryMuscles: ["Fléchisseurs du poignet"],
    secondaryMuscles: ["Fléchisseurs des doigts"],
    equipment: "Haltère léger",
    difficulty: 1,
    description:
      "Montée assistée, descente lente en flexion de poignet. Cible les fléchisseurs en excentrique — référence en épitrochléite (golfer's elbow).",
    variations: ["eccentric wrist flexion", "excentrique épitrochléite", "flexion poignet lente"]
  },
  "extension doigts élastique": {
    name: "Extension doigts élastique",
    category: "Avant-bras",
    primaryMuscles: ["Extenseurs des doigts"],
    secondaryMuscles: ["Extenseurs du poignet"],
    equipment: "Bande élastique",
    difficulty: 1,
    description:
      "Élastique autour des doigts : ouvre la main contre résistance. Rééquilibre extenseurs vs fléchisseurs après grip intensif (tractions, front lever, grimpe).",
    variations: ["finger extension band", "rubber band finger ext", "extension doigts"]
  },
  "ouverture main élastique": {
    name: "Ouverture main élastique",
    category: "Avant-bras",
    primaryMuscles: ["Interosseux", "Lombricaux", "Extenseurs des doigts"],
    secondaryMuscles: ["Avant-bras"],
    equipment: "Bande élastique",
    difficulty: 1,
    description:
      "Élastique autour des doigts repliés : étends les doigts contre résistance. Prévention tendinopathies des fléchisseurs des doigts en street workout.",
    variations: ["hand opener band", "finger spread band", "ouverture doigts élastique"]
  },
  "relevé genoux élastique": {
    name: "Relevé de genoux élastique",
    category: "Abdominaux",
    primaryMuscles: ["Fléchisseurs de hanche", "Droit fémoral"],
    secondaryMuscles: ["Core"],
    equipment: "Bande élastique",
    difficulty: 1,
    description:
      "Debout, élastique autour des chevilles : lève le genou vers la poitrine contre résistance légère. Renforce le droit fémoral en contexte de tendinopathie du droit fémoral chez le coureur.",
    variations: ["knee drive band", "marcha genoux élastique", "hip flexor band march"]
  },
  "y raise debout": {
    name: "Y raise debout",
    category: "Épaules",
    primaryMuscles: ["Trapèze inférieur", "Deltoïde postérieur"],
    secondaryMuscles: ["Coiffe des rotateurs", "Serratus antérieur"],
    equipment: "Haltères légers / élastique",
    difficulty: 1,
    description:
      "Buste penché, bras en Y, élève les bras sans hausser les épaules. Active trapèzes inférieurs et rotateurs — complément du face pull en rééducation d'épaule.",
    variations: ["standing y raise", "y raise", "trap y raise", "élévation Y debout"]
  },
  "équilibre unipodal": {
    name: "Équilibre unipodal",
    category: "Mollets",
    primaryMuscles: ["Stabilisateurs de cheville", "Moyen fessier"],
    secondaryMuscles: ["Mollets", "Core"],
    equipment: "Aucun",
    difficulty: 1,
    description:
      "Tenue sur une jambe, regard fixe, bassin niveau. Proprioception de base après entorse de cheville ou en prévention — yeux ouverts puis progresser yeux fermés.",
    variations: ["single leg balance", "équilibre une jambe", "stance unipodale", "one leg stand"]
  },
  "abduction hanche debout élastique": {
    name: "Abduction hanche debout élastique",
    category: "Fessiers",
    primaryMuscles: ["Moyen fessier", "Grand fessier"],
    secondaryMuscles: ["Tensor fascia lata"],
    equipment: "Bande élastique",
    difficulty: 1,
    description:
      "Debout, élastique autour des chevilles : écarte la jambe latéralement sans basculer le bassin. Renforce le moyen fessier — essentiel en syndrome de l'essuie-glace et tendinopathie du moyen fessier.",
    variations: ["hip abduction band", "abduction élastique", "lateral leg raise band"]
  },
  "ramassage serviette orteils": {
    name: "Ramassage serviette (orteils)",
    category: "Mollets",
    primaryMuscles: ["Intrinsèques du pied", "Fléchisseurs des orteils"],
    secondaryMuscles: ["Voûte plantaire"],
    equipment: "Serviette",
    difficulty: 1,
    description:
      "Assis, ramasse une serviette au sol avec les orteils. Renforce la voûte plantaire — protocole classique fasciite plantaire et prévention douleurs du pied.",
    variations: ["towel scrunch", "toe curls towel", "ramasser serviette", "short foot towel"]
  }
};

Object.assign(exerciseDatabase, EXERCISE_DATABASE_ENRICHMENT);

// Fonctions utilitaires pour la recherche et la catégorisation
export function findExerciseInDatabase(exerciseName) {
  const normalizedName = String(exerciseName || '').toLowerCase().trim();
  if (!normalizedName) return null;

  if (exerciseDatabase[normalizedName]) {
    return exerciseDatabase[normalizedName];
  }

  for (const exercise of Object.values(exerciseDatabase)) {
    if (String(exercise.name || '').toLowerCase().trim() === normalizedName) {
      return exercise;
    }
  }

  let best = null;
  let bestScore = 0;
  for (const exercise of Object.values(exerciseDatabase)) {
    const vars = Array.isArray(exercise.variations) ? exercise.variations : [];
    for (const variation of vars) {
      const v = String(variation || '').toLowerCase().trim();
      if (!v) continue;
      if (v === normalizedName) return exercise;
      if (normalizedName.includes(v) || v.includes(normalizedName)) {
        if (v.length > bestScore) {
          bestScore = v.length;
          best = exercise;
        }
      }
    }
  }

  return best;
}

export function getExercisesByCategory(category) {
  return Object.values(exerciseDatabase).filter(exercise => 
    exercise.category === category
  );
}

export function getAllCategories() {
  return [...new Set(Object.values(exerciseDatabase).map(exercise => exercise.category))];
}

export function searchExercisesByMuscle(muscle) {
  return Object.values(exerciseDatabase).filter(exercise => 
    exercise.primaryMuscles.includes(muscle) || 
    exercise.secondaryMuscles.includes(muscle)
  );
}

export function getExercisesByEquipment(equipment) {
  return Object.values(exerciseDatabase).filter(exercise => 
    exercise.equipment.toLowerCase().includes(equipment.toLowerCase())
  );
}