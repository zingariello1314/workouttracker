// Base de données complète des exercices avec définitions techniques
// Chaque exercice contient : nom, catégorie, muscles primaires/secondaires, équipement, description et variations

import { EXERCISE_DATABASE_ENRICHMENT } from './exerciseDatabaseEnrichment.js';

/** Inclinaison > prise : commun à toutes les tractions australiennes. */
const AUSTRALIAN_ROW_DIFFICULTY =
  "Difficulté : ce n'est pas la prise qui rend le mouvement dur, c'est l'inclinaison. Corps à ~45° → plus facile ; presque horizontal → difficile ; pieds surélevés → très difficile ; lest → encore plus dur. Toutes ces prises restent un tirage horizontal : elles n'isolent pas un muscle, elles changent surtout la contribution relative (dos vs bras) et le chemin des coudes.";

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
    description:
      "Debout face à la poulie haute, coudes près des côtes, avant-bras vers le haut. Tu tends les coudes vers le bas jusqu’à presque verrouiller, tu serres une seconde, puis tu laisses les avant-bras remonter sans que les coudes partent devant toi et sans hausser les épaules. La prise barre droite, la corde et les prises pronation ou supination ont leurs propres fiches : ici c’est l’extension à la poulie, pas un mouvement aux haltères. Le buste ne se penche pas pour pousser. Inspire en remontant, expire en tendant. 3 séries de 10 à 15.",
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
    description:
      "Un haltère dans chaque main, le long du corps. Tu fais un grand pas, le genou avant reste au-dessus de la cheville, le genou arrière descend vers le sol et peut l’effleurer, puis tu pousses dans le talon avant pour revenir. Le buste reste presque droit, les haltères ne se balancent pas. Même chose en pas arrière, ou en avançant à chaque répétition. La fente barre a sa propre fiche : ici la charge est aux haltères. Ce n’est pas la fente bulgare, aucun pied n’est sur un banc. Inspire en descendant, expire en poussant. 3 séries de 8 à 12 de chaque jambe, repos 2 min.",
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
    name: "Tractions australiennes — prise pronation",
    category: "Dorsaux",
    primaryMuscles: ["Grand dorsal", "Trapèzes moyens", "Rhomboïdes"],
    secondaryMuscles: ["Grand rond", "Biceps", "Brachial antérieur", "Deltoïdes postérieurs", "Abdominaux"],
    equipment: "Barre basse",
    difficulty: 2,
    summary: "Paumes vers le bas · largeur un peu plus large que les épaules · dos global + dorsaux",
    description:
      "Objectif : tirage horizontal de référence. Sensation visée : milieu du dos + dorsaux, biceps en assistance. Plus le corps est horizontal, plus c'est difficile.\n\n" +
      "Prise : paumes vers le bas, largeur légèrement supérieure aux épaules. Barre assez basse pour garder les pieds au sol.\n\n" +
      "Exécution : corps aligné chevilles → hanches → épaules, abdos et fessiers contractés. Pars bras tendus, épaules contrôlées. Tire la poitrine vers la barre (pas seulement le menton), rapproche légèrement les omoplates en haut, redescends lentement jusqu'aux bras tendus.\n\n" +
      "Erreurs : tirer uniquement avec les bras ; casser la hanche ; hausser les épaules ; s'arrêter au menton.\n\n" +
      AUSTRALIAN_ROW_DIFFICULTY,
    variations: [
      "tractions australiennes",
      "traction australienne",
      "australian pull-up",
      "inverted row",
      "rowing inversé",
      "body rows",
      "tractions horizontales",
      "prise pronation classique"
    ]
  },
  "tractions australiennes prise serrée pronation": {
    name: "Tractions australiennes — prise serrée pronation",
    category: "Dorsaux",
    primaryMuscles: ["Grand dorsal", "Biceps", "Brachial antérieur"],
    secondaryMuscles: ["Rhomboïdes", "Trapèzes moyens", "Grand rond"],
    equipment: "Barre basse",
    difficulty: 2,
    summary: "Mains rapprochées · paumes vers le bas · dorsaux + bras · coudes près du corps",
    description:
      "Objectif : garder les coudes proches du corps pour travailler davantage la dépression et l'adduction du bras, avec une participation importante du grand dorsal, des biceps et du brachial.\n\n" +
      "Prise : mains rapprochées, paumes vers le bas. Même alignement que la prise pronation classique.\n\n" +
      "Exécution : tire la poitrine vers la barre, coudes près du corps, épaules basses (pas vers les oreilles), bassin aligné. Le mouvement part du dos et des bras, avec les omoplates qui bougent naturellement.\n\n" +
      "Erreurs : transformer le tirage en curl horizontal en avançant uniquement les coudes ; laisser les épaules monter.\n\n" +
      AUSTRALIAN_ROW_DIFFICULTY,
    variations: [
      "australian pull-up close grip",
      "inverted row close grip pronated",
      "rowing inversé prise serrée",
      "tractions australiennes serrées pronation",
      "tractions australiennes prise serrée pronation",
      "prise serrée pronation"
    ]
  },
  "tractions australiennes prise large pronation": {
    name: "Tractions australiennes — prise large pronation",
    category: "Dorsaux",
    primaryMuscles: ["Grand dorsal", "Grand rond", "Trapèzes moyens", "Rhomboïdes"],
    secondaryMuscles: ["Deltoïdes postérieurs", "Biceps"],
    equipment: "Barre basse",
    difficulty: 3,
    summary: "Mains nettement plus larges que les épaules · haut/milieu du dos + grand rond",
    description:
      "Objectif : développer le haut et le milieu du dos plutôt que d'accumuler des répétitions faciles. Les biceps participent toujours, mais avec moins de facilité mécanique qu'en prise serrée.\n\n" +
      "Prise : nettement plus large que les épaules, paumes vers le bas.\n\n" +
      "Exécution : corps gainé, bras tendus, tire la poitrine vers la barre. Laisse les coudes partir davantage vers l'extérieur. Contrôle la descente jusqu'aux bras tendus.\n\n" +
      "Erreurs : forcer le contact poitrine-barre au prix de l'alignement. Priorité : corps stable → omoplates contrôlées → tirage puissant → descente complète.\n\n" +
      AUSTRALIAN_ROW_DIFFICULTY,
    variations: [
      "australian pull-up wide grip",
      "inverted row wide pronated",
      "rowing inversé prise large",
      "tractions australiennes larges",
      "tractions australiennes prise large pronation",
      "prise large pronation"
    ]
  },
  "tractions australiennes prise large supination": {
    name: "Tractions australiennes — prise large supination",
    category: "Dorsaux",
    primaryMuscles: ["Grand dorsal", "Biceps", "Brachial antérieur"],
    secondaryMuscles: ["Grand rond", "Rhomboïdes", "Trapèzes moyens", "Deltoïdes postérieurs"],
    equipment: "Barre basse",
    difficulty: 2,
    summary: "Paumes vers toi · mains larges · dos + biceps, sans l'aide max d'une prise serrée",
    description:
      "Objectif : combiner supination et largeur. La supination facilite la contribution du biceps, mais la largeur limite un peu cet avantage par rapport à une supination serrée.\n\n" +
      "Prise : paumes vers toi, largeur supérieure aux épaules.\n\n" +
      "Exécution : gaine fortement, tire la poitrine vers la barre, épaules basses, descente sous contrôle. Pense poitrine vers barre + coudes vers l'arrière + corps rigide.\n\n" +
      "Erreurs : se contenter de ramener les coudes en arrière en laissant les épaules partir vers l'avant.\n\n" +
      AUSTRALIAN_ROW_DIFFICULTY,
    variations: [
      "australian chin-up wide",
      "inverted row wide supinated",
      "rowing inversé supination large",
      "tractions australiennes supination large",
      "tractions australiennes prise large supination",
      "prise large supination"
    ]
  },
  "tractions australiennes prise serrée supination": {
    name: "Tractions australiennes — prise serrée supination",
    category: "Dorsaux",
    primaryMuscles: ["Biceps brachial", "Grand dorsal", "Brachial antérieur"],
    secondaryMuscles: ["Grand rond", "Rhomboïdes", "Trapèzes moyens"],
    equipment: "Barre basse",
    difficulty: 2,
    summary: "Paumes vers toi · mains rapprochées · le plus d'aide aux bras (biceps + dorsaux)",
    description:
      "Objectif : variante australienne qui aide le plus les bras. La supination place le biceps dans une position très favorable pour la flexion du coude ; la prise serrée permet de garder les coudes proches du corps. Combinaison dorsaux + biceps.\n\n" +
      "Prise : paumes vers toi, mains rapprochées.\n\n" +
      "Exécution : tire en pensant « je ramène mes coudes vers mes hanches » — souvent plus efficace pour recruter les dorsaux que de simplement tirer avec les mains.\n\n" +
      "Erreurs : curl horizontal (coudes qui avancent) ; perdre l'alignement du bassin.\n\n" +
      AUSTRALIAN_ROW_DIFFICULTY,
    variations: [
      "australian chin-up close grip",
      "inverted row close supinated",
      "rowing inversé supination serrée",
      "tractions australiennes chin-up",
      "tractions australiennes prise serrée supination",
      "prise serrée supination"
    ]
  },
  "tractions australiennes prise neutre": {
    name: "Tractions australiennes — prise neutre",
    category: "Dorsaux",
    primaryMuscles: ["Grand dorsal", "Brachial antérieur", "Biceps"],
    secondaryMuscles: ["Grand rond", "Rhomboïdes", "Trapèzes moyens", "Deltoïdes postérieurs"],
    equipment: "Barre basse / poignées parallèles",
    difficulty: 2,
    summary: "Paumes qui se font face · confort d'épaule · dorsaux + biceps/brachial",
    description:
      "Objectif : tirage naturel pour l'épaule, coudes relativement proches du corps. Excellente variante pour apprendre à tirer fort avec le dos tout en utilisant efficacement les bras. Utilise deux poignées parallèles si tu en as.\n\n" +
      "Prise : paumes qui se font face.\n\n" +
      "Exécution : corps gainé, bras tendus, tire la poitrine vers les poignées. Coudes vers l'arrière et légèrement vers les hanches. Marque brièvement la position haute, descends complètement.\n\n" +
      "Erreurs : laisser les épaules monter ; couper l'amplitude en bas.\n\n" +
      AUSTRALIAN_ROW_DIFFICULTY,
    variations: [
      "australian pull-up neutral grip",
      "inverted row hammer grip",
      "rowing inversé prise neutre",
      "tractions australiennes marteau",
      "tractions australiennes prise neutre",
      "prise neutre"
    ]
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
    variations: ["concentration curl", "curl concentré", "curl concentration assis", "concentration curl assis"]
  },
  "curl incliné": {
    name: "Curl incliné",
    category: "Biceps",
    primaryMuscles: ["Biceps brachial"],
    secondaryMuscles: ["Brachial antérieur"],
    equipment: "Haltères + Banc incliné",
    description: "Curl sur banc incliné pour étirement maximal des biceps",
    variations: ["incline curl", "curl banc incliné", "curl incliné supination"]
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
    description:
      "Buste penché, dos plat, genoux souples, haltère en main. Un bras après l’autre ou les deux ensemble : le coude reste haut, collé au flanc, et ne voyage pas. Seul l’avant-bras s’étend vers l’arrière jusqu’à aligner le bras, puis tu reviens sans laisser le bras balancer ni le buste se redresser pour aider. La charge reste plus légère que sur l’extension au-dessus de la tête ou à la poulie : le bras est déjà en arrière, le triceps est court, et un haltère trop lourd casse le coude fixe. Inspire en fléchissant, expire en tendant. 3 séries de 12 à 15. Ce n’est pas le kickback à la poulie, qui suit le même geste contre un câble.",
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
    description:
      "Même tirage horizontal que les tractions australiennes, mais les pieds sont surélevés : le corps se rapproche de l'horizontale, la charge sur le dos augmente. La prise (pronation, supination, neutre, large ou serrée) reste libre — c'est l'inclinaison qui durcit le mouvement, pas le nom de l'exercice.",
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
    variations: ["seated dumbbell shoulder press", "dm haltères assis", "shoulder press assis haltères", "développé militaire unilatéral assis"]
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
  "écarté poulie haute": {
    name: "Écarté poulie haute",
    category: "Pectoraux",
    primaryMuscles: ["Grand pectoral, faisceau sterno-costal inférieur"],
    secondaryMuscles: ["Deltoïde antérieur", "Dentelé antérieur"],
    equipment: "Poulie vis-à-vis",
    difficulty: 2,
    isNew: true,
    description: "Les deux poulies sont réglées au-dessus des épaules, poignées en main, un pied légèrement devant pour ne pas partir en arrière. Tu pars bras ouverts, mains hautes, coudes souples et fixes : ce n’est pas un développé, les coudes ne se plient pas pour pousser. Tu ramènes les mains vers le bas et vers l’intérieur, jusqu’en bas des pectoraux ou juste devant les hanches, en serrant les pecs une seconde, puis tu rouvres jusqu’à sentir l’étirement sans que les épaules montent aux oreilles. La ligne de traction descend : c’est le bas du grand pectoral qui travaille, pas le haut. Le buste reste droit, les côtes ne s’ouvrent pas, le bassin ne part pas en avant. Inspire en ouvrant, expire en ramenant. Si les mains se croisent, c’est un petit croisement devant le nombril, pas une torsion du tronc. 3 séries de 12 à 15, repos 60 s. La poulie médiane reste horizontale, la poulie basse monte vers le visage.",
    variations: ["cable high fly", "high to low crossover", "écarté poulie haute debout"]
  },
  "écarté poulie médiane": {
    name: "Écarté poulie médiane",
    category: "Pectoraux",
    primaryMuscles: ["Grand pectoral, faisceau sterno-costal"],
    secondaryMuscles: ["Deltoïde antérieur", "Biceps, chef court"],
    equipment: "Poulie vis-à-vis",
    difficulty: 2,
    isNew: true,
    description: "Les deux poulies sont à hauteur d’épaules, poignées en prise neutre, buste droit, un pied devant. Les bras s’ouvrent sur le côté jusqu’à aligner les mains avec les épaules, coudes légèrement fléchis et qui ne bougent plus pendant la série. Tu ramènes les mains l’une vers l’autre devant le sternum, sur une ligne horizontale, tu serres une seconde, puis tu reviens sans laisser les poids claquer. Si les mains descendent vers les hanches, tu es passé sur la poulie haute. Si elles montent vers le visage, tu es sur la poulie basse. Ici le milieu du pectoral prend la tension du début à la fin, y compris bras ouverts, là où l’haltère se repose. Les omoplates glissent autour des côtes, elles ne se haussent pas. Les poignets restent dans l’axe des avant-bras. Inspire en ouvrant, expire en fermant. 3 séries de 12 à 15, repos 60 s.",
    variations: ["cable middle fly", "cable fly shoulder height", "écarté poulie médiane debout", "écarté à la poulie", "écarté à la poulie vis-à-vis"]
  },
  "écarté poulie basse": {
    name: "Écarté poulie basse",
    category: "Pectoraux",
    primaryMuscles: ["Grand pectoral, faisceau claviculaire"],
    secondaryMuscles: ["Deltoïde antérieur", "Dentelé antérieur"],
    equipment: "Poulie vis-à-vis",
    difficulty: 2,
    isNew: true,
    description: "Les deux poulies sont tout en bas, poignées en main, bras ouverts vers le bas et légèrement derrière le buste pour prendre l’étirement du haut du pec. Coudes souples, presque fixes. Tu montes les mains vers le haut et l’intérieur, jusqu’au haut de la poitrine ou au niveau du visage, sans verrouiller les coudes et sans hausser les épaules pour finir le geste. Tu serres en haut, puis tu redescends lentement jusqu’à l’étirement, les poids ne tombent pas. La ligne de traction monte : c’est le faisceau claviculaire, le haut du pectoral, pas le bas. Le dos ne se cambre pas pour emmener les mains plus haut, les côtes restent basses, le regard devant. Inspire en descendant, expire en montant. 3 séries de 12 à 15, repos 60 s. Ce n’est pas l’écarté incliné au banc : ici tu es debout, et la poulie haute, elle, descend vers les hanches.",
    variations: ["cable low fly", "low to high crossover", "écarté poulie basse debout"]
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
  "extension triceps couché à un haltère": {
    name: "Extension triceps couché à un haltère",
    category: "Triceps",
    primaryMuscles: ["Triceps brachial"],
    secondaryMuscles: [],
    equipment: "Haltère + Banc",
    difficulty: 2,
    isNew: true,
    summary: "Allongé sur le dos · un haltère à deux mains · extension coudes",
    description:
      "Position : Allongé sur le dos sur un banc, les pieds au sol. Tenez un haltère à deux mains au-dessus de la poitrine, bras tendus.\n\nExécution : Fléchissez lentement les coudes pour amener l’haltère derrière la tête, en gardant les bras supérieurs relativement fixes. Descendez jusqu’à ressentir un étirement des triceps, puis tendez les coudes pour ramener l’haltère à la position initiale.\n\nPoints clés : Garder les coudes proches l’un de l’autre et éviter de laisser les bras partir excessivement vers l’extérieur. Le mouvement doit principalement venir de l’articulation du coude. Ce n’est pas la barre au front, ni les extensions triceps allongé à deux haltères.",
    variations: [
      "extension triceps couché 1 haltère",
      "skull crusher un haltère",
      "french press couché haltère",
      "lying dumbbell triceps extension two hands"
    ]
  },
  "extension triceps couché latéral à un haltère": {
    name: "Extension triceps couché latéral à un haltère",
    category: "Triceps",
    primaryMuscles: ["Triceps brachial"],
    secondaryMuscles: [],
    equipment: "Haltère + Banc",
    difficulty: 2,
    isNew: true,
    summary: "Allongé sur le côté · un haltère · un bras après l’autre",
    description:
      "Position : Allongé sur le côté sur un banc, maintenez un haltère dans la main du bras qui travaille. Le bras est positionné au-dessus du torse, coude fléchi.\n\nExécution : Fléchissez le coude pour abaisser l’haltère de manière contrôlée vers le côté de la tête ou derrière celle-ci, puis tendez le bras pour ramener l’haltère à la position de départ. Gardez le bras supérieur aussi stable que possible afin de concentrer le mouvement sur le triceps.\n\nPoints clés : Contrôler la descente, éviter de bouger l’épaule et conserver un mouvement fluide du coude. Effectuez toutes les répétitions d’un côté avant de changer de bras. Ce n’est pas l’extension couché à un haltère tenu à deux mains, dos à plat.",
    variations: [
      "extension triceps couché latéral",
      "extension triceps allongé sur le côté",
      "side lying dumbbell triceps extension",
      "lying one arm triceps extension latéral"
    ]
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
  "presse verticale": {
    name: "Presse verticale",
    category: "Quadriceps",
    primaryMuscles: ["Quadriceps", "Fessiers"],
    secondaryMuscles: ["Ischio-jambiers", "Mollets"],
    equipment: "Presse à 90°",
    difficulty: 3,
    isNew: true,
    description:
      "Presse à cuisses verticale : le dossier est presque à 90°, les pieds poussent vers le haut et la tête reste plus basse que les hanches. La charge descend le long du corps, sans la trajectoire inclinée de la presse à 45°.",
    variations: ["presse 90 degrés", "vertical leg press", "presse tête en bas", "presse verticale 90"]
  },
  "développé couché smith": {
    name: "Développé couché Smith",
    category: "Pectoraux",
    primaryMuscles: ["Pectoraux"],
    secondaryMuscles: ["Triceps", "Deltoïdes antérieurs"],
    equipment: "Smith machine + Banc",
    difficulty: 2,
    isNew: true,
    description:
      "Développé couché sur barre guidée. La trajectoire est fixe : on règle la hauteur des sécurités, on descend la barre sur le bas des pectoraux, puis on pousse sans déverrouiller les coudes. Plus stable que la barre libre, moins exigeant pour les stabilisateurs.",
    variations: ["smith bench press", "développé smith", "bench press smith machine"]
  },
  "développé militaire smith": {
    name: "Développé militaire Smith",
    category: "Épaules",
    primaryMuscles: ["Deltoïdes antérieurs", "Deltoïdes moyens"],
    secondaryMuscles: ["Triceps", "Trapèzes supérieurs"],
    equipment: "Smith machine",
    difficulty: 2,
    isNew: true,
    description:
      "Développé au-dessus de la tête sur barre guidée, assis ou debout. La barre reste dans un plan vertical. Descendre devant le visage jusqu'aux clavicules, puis pousser sans cambrer le bas du dos.",
    variations: ["smith shoulder press", "militaire smith", "overhead press smith"]
  },
  "squat smith": {
    name: "Squat Smith",
    category: "Quadriceps",
    primaryMuscles: ["Quadriceps", "Fessiers"],
    secondaryMuscles: ["Ischio-jambiers", "Core"],
    equipment: "Smith machine",
    difficulty: 2,
    isNew: true,
    description:
      "Squat sur barre guidée, pieds légèrement avancés pour que les genoux suivent la trajectoire verticale de la barre. Les sécurités se règlent juste sous la position basse. Moins de gainage qu'un squat libre.",
    variations: ["smith squat", "squat guidé", "smith machine squat"]
  },
  "squat sumo": {
    name: "Squat sumo",
    category: "Quadriceps",
    primaryMuscles: ["Quadriceps", "Adducteurs", "Fessiers"],
    secondaryMuscles: ["Ischio-jambiers", "Core"],
    equipment: "Poids du corps / Haltères",
    difficulty: 2,
    isNew: true,
    description:
      "Squat pieds très écartés, pointes ouvertes, descente entre les jambes. Le buste reste plus droit qu'au squat classique. Ce n'est pas le soulevé de terre sumo : ici on plie les genoux et on remonte en poussant le sol.",
    variations: ["sumo squat", "squat large", "plie squat"]
  },
  "développé militaire haltères": {
    name: "Développé militaire haltères",
    category: "Épaules",
    primaryMuscles: ["Deltoïdes antérieurs", "Deltoïdes moyens"],
    secondaryMuscles: ["Triceps", "Trapèzes supérieurs", "Core"],
    equipment: "Haltères",
    difficulty: 3,
    isNew: true,
    description:
      "Développé haltères au-dessus de la tête, debout. Les haltères partent aux épaules et montent sans se cogner en haut. Le gainage empêche de cambrer. La fiche assise reste un autre exercice.",
    variations: ["dumbbell military press", "développé haltères debout", "standing dumbbell shoulder press"]
  },
  "développé militaire unilatéral": {
    name: "Développé militaire unilatéral",
    category: "Épaules",
    primaryMuscles: ["Deltoïdes antérieurs", "Deltoïdes moyens"],
    secondaryMuscles: ["Triceps", "Trapèzes supérieurs", "Core"],
    equipment: "Haltère",
    difficulty: 3,
    isNew: true,
    description:
      "Développé un bras au-dessus de la tête avec une haltère. L'autre côté reste stable. Ce n'est ni le développé militaire barre, ni le développé couché.",
    variations: [
      "militaire unilatéral",
      "one arm shoulder press",
      "dumbbell one arm shoulder press",
      "développé militaire 1 bras"
    ]
  },
  "rowing haltère debout": {
    name: "Rowing haltère debout",
    category: "Dorsaux",
    primaryMuscles: ["Grand dorsal", "Rhomboïdes"],
    secondaryMuscles: ["Biceps", "Deltoïdes postérieurs", "Érecteurs du rachis"],
    equipment: "Haltère",
    difficulty: 2,
    isNew: true,
    description:
      "Rowing un bras, buste penché, sans appui sur un banc. L'haltère monte vers la hanche, coude proche du corps, dos plat. Différent du rowing haltère au banc, qui a un appui pour le torse.",
    variations: ["dumbbell bent over row standing", "rowing haltère penché", "one arm dumbbell row standing"]
  },
  "kickback triceps poulie": {
    name: "Kickback triceps à la poulie",
    category: "Triceps",
    primaryMuscles: ["Triceps"],
    secondaryMuscles: [],
    equipment: "Poulie basse",
    difficulty: 2,
    isNew: true,
    description:
      "Buste penché, coude fixe le long du corps, extension de l'avant-bras vers l'arrière contre la poulie basse. Le bras ne balance pas. Le kickback haltère est le même geste sans câble.",
    variations: ["cable kickback", "kickback poulie", "tricep cable kickback"]
  },
  "oiseau machine": {
    name: "Oiseau machine",
    category: "Épaules",
    primaryMuscles: ["Deltoïdes postérieurs"],
    secondaryMuscles: ["Rhomboïdes", "Trapèzes moyens"],
    equipment: "Machine rear delt",
    difficulty: 2,
    isNew: true,
    description:
      "Écarté inverse guidé, poitrine contre le dossier. Les bras s'ouvrent vers l'arrière jusqu'à l'alignement des épaules, sans hausser les trapèzes. L'oiseau haltères et l'oiseau poulie restent d'autres fiches.",
    variations: ["rear delt fly machine", "reverse pec deck", "oiseau machine rear delt"]
  },
  "presse adducteurs abducteurs": {
    name: "Presse adducteurs et abducteurs",
    category: "Quadriceps",
    primaryMuscles: ["Adducteurs", "Moyen fessier"],
    secondaryMuscles: ["Fessiers"],
    equipment: "Machine adducteurs / abducteurs",
    difficulty: 2,
    isNew: true,
    description:
      "Deux postes assis. Adducteurs : les genoux se rapprochent contre les coussins. Abducteurs : les genoux s'écartent. Le dos reste contre le dossier, sans s'aider des mains pour tricher.",
    variations: ["adductor machine", "abductor machine", "presse adducteurs", "presse abducteurs"]
  },
  "extension triceps barre ez": {
    name: "Extension triceps barre EZ",
    category: "Triceps",
    primaryMuscles: ["Triceps"],
    secondaryMuscles: ["Pectoraux", "Deltoïdes antérieurs"],
    equipment: "Barre EZ + Banc",
    difficulty: 2,
    isNew: true,
    description:
      "Allongé sur le banc, barre EZ au-dessus de la poitrine, prise angulée. Les coudes restent vers le plafond pendant que la barre descend vers le front, puis les triceps la repoussent. Même geste que la barre au front, avec la barre EZ pour soulager les poignets.",
    variations: ["ez bar skull crusher", "barre au front ez", "lying ez triceps extension"]
  },
  "planche inversée penchée": {
    name: "Planche inversée penchée",
    category: "Abdominaux",
    primaryMuscles: ["Core", "Deltoïdes antérieurs", "Fessiers"],
    secondaryMuscles: ["Triceps", "Ischio-jambiers"],
    equipment: "Poids du corps",
    difficulty: 2,
    isNew: true,
    description:
      "Assis, mains au sol derrière le bassin, doigts vers les pieds ou vers l'extérieur. Les hanches montent en pont inversé, puis les mains reculent pour augmenter le penché. Les épaules restent au-dessus des poignets.",
    variations: ["reverse hand plank lean", "reverse plank lean", "planche inversée mains"]
  },
  "pompes et extension triceps": {
    name: "Pompes et extension triceps",
    category: "Pectoraux",
    primaryMuscles: ["Pectoraux", "Triceps"],
    secondaryMuscles: ["Deltoïdes antérieurs", "Core"],
    equipment: "Poids du corps",
    difficulty: 2,
    isNew: true,
    description:
      "Enchaînement au sol : des pompes, puis une extension des triceps au poids du corps. Les deux gestes sont dans la même vidéo. Les fiches Pompes et Extension triceps restent les mouvements séparés.",
    variations: ["push up and bodyweight triceps extension", "pompes plus extension triceps"]
  },

  "abduction hanche machine assise": {
    name: "Abduction de hanche machine assise",
    category: "Fessiers",
    primaryMuscles: ["Moyen fessier"],
    secondaryMuscles: ["Petit fessier", "Tenseur du fascia lata"],
    equipment: "Machine abducteurs",
    difficulty: 1,
    isNew: true,
    description:
      "Assis, dos contre le dossier, genoux contre les coussins. Écarte les cuisses sans décoller le bassin du siège, puis reviens lentement sans laisser les poids claquer. Le buste ne se penche pas en avant pour aider.",
    variations: ["lever seated hip abduction", "abductor machine", "écarté machine hanche"]
  },
  "abduction hanche assise élastique": {
    name: "Abduction de hanche assise élastique",
    category: "Fessiers",
    primaryMuscles: ["Moyen fessier"],
    secondaryMuscles: ["Petit fessier", "Tenseur du fascia lata"],
    equipment: "Bande élastique + Banc",
    difficulty: 1,
    isNew: true,
    description:
      "Assis au bord d'un banc, bande au-dessus des genoux, pieds au sol. Écarte les genoux contre l'élastique en gardant le dos droit, puis reviens sans relâcher la tension. Plus facile que la version debout aux chevilles : le bassin est calé.",
    variations: ["seated band hip abduction", "abduction assise élastique", "banded seated abduction"]
  },
  "abduction hanche gainage latéral": {
    name: "Abduction de hanche pont latéral",
    category: "Fessiers",
    primaryMuscles: ["Moyen fessier"],
    secondaryMuscles: ["Obliques", "Ischio-jambiers", "Petit fessier"],
    equipment: "Poids du corps",
    difficulty: 3,
    isNew: true,
    description:
      "Gainage latéral sur l'avant-bras, corps aligné, puis la jambe du dessus monte sans tourner le bassin vers le plafond. La descente est lente. Le gainage tient tout le long : si les hanches tombent, la jambe ne monte plus.",
    variations: ["side bridge hip abduction", "side plank leg lift", "abduction gainage latéral"]
  },
  "abduction hanche allongée": {
    name: "Abduction de hanche allongée",
    category: "Fessiers",
    primaryMuscles: ["Moyen fessier"],
    secondaryMuscles: ["Petit fessier", "Tenseur du fascia lata"],
    equipment: "Poids du corps",
    difficulty: 1,
    isNew: true,
    description:
      "Allongé sur le côté, tête appuyée, bassin fixe. La jambe du dessus s'élève latéralement, pied parallèle ou légèrement tourné vers le bas pour viser le moyen fessier, puis redescend sans poser brutalement. Le bassin ne bascule pas en arrière.",
    variations: ["side lying hip abduction", "side hip abduction", "élévation jambe côté"]
  },
  "abduction hanche debout jambe tendue": {
    name: "Abduction de hanche debout jambe tendue",
    category: "Fessiers",
    primaryMuscles: ["Moyen fessier"],
    secondaryMuscles: ["Petit fessier", "Tenseur du fascia lata"],
    equipment: "Poids du corps",
    difficulty: 1,
    isNew: true,
    description:
      "Debout, jambe d'appui légèrement fléchie, l'autre jambe tendue s'écarte sur le côté sans pencher le buste. Le pied reste dans l'axe, le bassin ne part pas avec la jambe. Retour contrôlé. La version avec élastique aux chevilles est une autre fiche.",
    variations: ["straight leg hip abduction", "standing hip abduction", "abduction debout jambe tendue"]
  },

  "sit-up": {
      "name": "Sit-up",
      "category": "Abdominaux",
      "primaryMuscles": [
          "Grand droit"
      ],
      "secondaryMuscles": [
          "Fléchisseurs de hanche",
          "Obliques"
      ],
      "equipment": "Poids du corps",
      "difficulty": 1,
      "isNew": true,
      "description": "Allongé, les omoplates décollent puis le buste monte jusqu'à la position assise, et la descente reste contrôlée. Ce n'est pas un crunch : les hanches participent. Les demi-redressements, bras le long du corps ou au-dessus de la tête, et la version assistée sont le même geste.",
      "variations": [
          "sit up",
          "redressement assis",
          "half sit-up",
          "janda sit-up"
      ]
  },

  "sit-up décliné": {
      "name": "Sit-up décliné",
      "category": "Abdominaux",
      "primaryMuscles": [
          "Grand droit"
      ],
      "secondaryMuscles": [
          "Fléchisseurs de hanche",
          "Obliques"
      ],
      "equipment": "Banc décliné",
      "difficulty": 2,
      "isNew": true,
      "description": "Pieds calés sur le banc décliné, le buste descend vers l'arrière puis remonte. La pente charge plus le grand droit que le sit-up au sol. Le crunch décliné et la version lestée sont le même montage.",
      "variations": [
          "decline sit-up",
          "crunch décliné",
          "weighted decline sit-up"
      ]
  },

  "sit-up press barre": {
      "name": "Sit-up press barre",
      "category": "Abdominaux",
      "primaryMuscles": [
          "Grand droit"
      ],
      "secondaryMuscles": [
          "Fléchisseurs de hanche",
          "Deltoïdes antérieurs",
          "Triceps"
      ],
      "equipment": "Barre + Banc",
      "difficulty": 3,
      "isNew": true,
      "description": "Sit-up avec une barre poussée au-dessus de la poitrine pendant la montée du buste. Les coudes ne s'ouvrent pas en croix, la barre reste au-dessus du sternum, et le dos ne s'arrondit pas d'un bloc en bas.",
      "variations": [
          "barbell press sit-up",
          "sit-up développé barre"
      ]
  },

  "crunch sur swiss ball": {
      "name": "Crunch sur swiss ball",
      "category": "Abdominaux",
      "primaryMuscles": [
          "Grand droit"
      ],
      "secondaryMuscles": [
          "Obliques"
      ],
      "equipment": "Swiss ball",
      "difficulty": 2,
      "isNew": true,
      "description": "Dos sur le ballon, pieds au sol, le bassin reste fixe pendant que les côtes se rapprochent du bassin. Le ballon permet de descendre plus bas que le crunch au sol. Bras tendus ou lest au-dessus de la tête : même crunch, bras plus longs.",
      "variations": [
          "stability ball crunch",
          "crunch swiss ball",
          "weighted overhead crunch ball"
      ]
  },

  "rentrée de genoux sur swiss ball": {
      "name": "Rentrée de genoux sur swiss ball",
      "category": "Abdominaux",
      "primaryMuscles": [
          "Grand droit"
      ],
      "secondaryMuscles": [
          "Fléchisseurs de hanche",
          "Deltoïdes antérieurs"
      ],
      "equipment": "Swiss ball",
      "difficulty": 2,
      "isNew": true,
      "description": "Mains au sol, tibias sur le ballon. Les genoux se rapprochent de la poitrine, le ballon roule vers l'avant, puis les jambes se rallongent sans creuser les lombaires. Le bassin ne monte pas en pike.",
      "variations": [
          "stability ball knee tuck",
          "pull-in swiss ball"
      ]
  },

  "crunch oblique": {
      "name": "Crunch oblique",
      "category": "Abdominaux",
      "primaryMuscles": [
          "Obliques"
      ],
      "secondaryMuscles": [
          "Grand droit"
      ],
      "equipment": "Poids du corps",
      "difficulty": 1,
      "isNew": true,
      "description": "Allongé, une épaule se dirige vers la hanche opposée ou la main glisse le long de la cuisse vers le talon. Le bassin ne quitte pas le sol. Le bicycle n'est pas cette fiche : les jambes n'y pédalent pas.",
      "variations": [
          "oblique crunch",
          "heel touchers",
          "crunch oblique au sol"
      ]
  },

  "inclinaison latérale": {
      "name": "Inclinaison latérale",
      "category": "Abdominaux",
      "primaryMuscles": [
          "Obliques"
      ],
      "secondaryMuscles": [
          "Carré des lombes"
      ],
      "equipment": "Poids du corps",
      "difficulty": 1,
      "isNew": true,
      "description": "Debout ou assis, le buste s'incline sur le côté sans partir en avant ni tourner les épaules. Le retour est actif, pas une chute. Les versions barre, haltère et poulie sont d'autres fiches.",
      "variations": [
          "side bend",
          "flexion latérale",
          "side crunch assis"
      ]
  },

  "inclinaison latérale haltères": {
      "name": "Inclinaison latérale haltères",
      "category": "Abdominaux",
      "primaryMuscles": [
          "Obliques"
      ],
      "secondaryMuscles": [
          "Carré des lombes"
      ],
      "equipment": "Haltère",
      "difficulty": 1,
      "isNew": true,
      "description": "Debout, un haltère dans une main, l'autre main à la tempe ou le long du corps. Le buste descend du côté de la charge puis remonte sans balancer l'épaule vers l'avant. La version sur swiss ball est le même côté, avec un appui instable.",
      "variations": [
          "dumbbell side bend",
          "flexion latérale haltère"
      ]
  },

  "inclinaison latérale barre": {
      "name": "Inclinaison latérale barre",
      "category": "Abdominaux",
      "primaryMuscles": [
          "Obliques"
      ],
      "secondaryMuscles": [
          "Carré des lombes"
      ],
      "equipment": "Barre",
      "difficulty": 2,
      "isNew": true,
      "description": "Barre sur les trapèzes, comme un squat, le buste s'incline latéralement et remonte. Les genoux restent souples, le bassin ne part pas en rotation, et la barre ne glisse pas vers le cou.",
      "variations": [
          "barbell side bend",
          "flexion latérale barre"
      ]
  },

  "inclinaison latérale poulie": {
      "name": "Inclinaison latérale poulie",
      "category": "Abdominaux",
      "primaryMuscles": [
          "Obliques"
      ],
      "secondaryMuscles": [
          "Carré des lombes",
          "Grand droit"
      ],
      "equipment": "Poulie basse",
      "difficulty": 2,
      "isNew": true,
      "description": "Poignée de la poulie basse dans une main, le buste s'incline à l'opposé de la charge puis ramène les côtes vers la hanche. L'épaule de la main qui tient ne monte pas vers l'oreille. Le crunch latéral et la version sur Bosu sont le même côté.",
      "variations": [
          "cable side bend",
          "cable side crunch",
          "flexion latérale poulie"
      ]
  },

  "l-sit au sol": {
      "name": "L-sit au sol",
      "category": "Abdominaux",
      "primaryMuscles": [
          "Grand droit",
          "Fléchisseurs de hanche"
      ],
      "secondaryMuscles": [
          "Triceps",
          "Dentelé antérieur"
      ],
      "equipment": "Poids du corps",
      "difficulty": 3,
      "isNew": true,
      "description": "Mains au sol à côté des hanches, bras tendus, jambes tendues devant, fesses décollées. Les épaules restent basses. Ce n'est ni le L-sit à la barre ni celui aux parallèles.",
      "variations": [
          "floor l-sit",
          "l-sit sol"
      ]
  },

  "v-sit au sol": {
      "name": "V-sit au sol",
      "category": "Abdominaux",
      "primaryMuscles": [
          "Grand droit",
          "Fléchisseurs de hanche"
      ],
      "secondaryMuscles": [
          "Obliques"
      ],
      "equipment": "Poids du corps",
      "difficulty": 2,
      "isNew": true,
      "description": "Assis, buste et jambes tendues se rapprochent pour former un V, les mains hors du sol ou tendues vers les pieds. Le dos ne s'effondre pas en rond complet. Le L-sit au sol garde les mains en appui, celui-ci non.",
      "variations": [
          "v-sit",
          "bateau",
          "boat hold"
      ]
  },

  "drapeau humain": {
      "name": "Drapeau humain",
      "category": "Abdominaux",
      "primaryMuscles": [
          "Obliques",
          "Grand dorsal"
      ],
      "secondaryMuscles": [
          "Grand droit",
          "Deltoïdes",
          "Dentelé antérieur"
      ],
      "equipment": "Barre verticale / poteau",
      "difficulty": 4,
      "isNew": true,
      "description": "Corps horizontal le long d'une barre verticale, jambes tendues, une épaule pousse et l'autre tire. Les fiches tuck et straddle restent les étapes d'avant. Ici le corps est aligné, sans genoux groupés.",
      "variations": [
          "human flag",
          "full flag",
          "drapeau"
      ]
  },

  "inchworm": {
      "name": "Inchworm",
      "category": "Abdominaux",
      "primaryMuscles": [
          "Grand droit"
      ],
      "secondaryMuscles": [
          "Deltoïdes antérieurs",
          "Ischio-jambiers"
      ],
      "equipment": "Poids du corps",
      "difficulty": 1,
      "isNew": true,
      "description": "Debout, les mains descendent au sol, marchent jusqu'à la planche, puis les pieds reviennent vers les mains. Les jambes peuvent rester tendues. La variante v-2 est le même déplacement.",
      "variations": [
          "inchworm",
          "marche de l ours inversée"
      ]
  },

  "pompes vers gainage latéral": {
      "name": "Pompes vers gainage latéral",
      "category": "Abdominaux",
      "primaryMuscles": [
          "Obliques",
          "Pectoraux"
      ],
      "secondaryMuscles": [
          "Deltoïdes",
          "Triceps",
          "Grand droit"
      ],
      "equipment": "Poids du corps",
      "difficulty": 2,
      "isNew": true,
      "description": "Une pompe, puis le corps s'ouvre en appui latéral sur un bras, l'autre bras vers le plafond, et on revient. Les hanches ne tombent pas pendant la rotation. Les pompes classiques restent leur fiche.",
      "variations": [
          "push-up to side plank",
          "pompe t-rotation"
      ]
  },

  "gainage jambe levée": {
      "name": "Gainage jambe levée",
      "category": "Abdominaux",
      "primaryMuscles": [
          "Grand droit"
      ],
      "secondaryMuscles": [
          "Grand fessier",
          "Deltoïdes antérieurs"
      ],
      "equipment": "Poids du corps",
      "difficulty": 2,
      "isNew": true,
      "description": "Planche haute, une jambe se décolle et reste tendue, le bassin ne tourne pas et ne monte pas. Le gainage classique garde les deux appuis. Ici l'équilibre est sur trois appuis.",
      "variations": [
          "plank leg lift",
          "power point plank",
          "planche trois appuis"
      ]
  },

  "planche inversée jambe levée": {
      "name": "Planche inversée jambe levée",
      "category": "Abdominaux",
      "primaryMuscles": [
          "Grand droit",
          "Grand fessier"
      ],
      "secondaryMuscles": [
          "Ischio-jambiers",
          "Deltoïdes antérieurs"
      ],
      "equipment": "Poids du corps",
      "difficulty": 2,
      "isNew": true,
      "description": "Planche inversée, visage vers le plafond, bassin haut, puis une jambe monte. Ce n'est pas la planche inversée penchée : ici le bassin est déjà en ligne et la jambe bouge.",
      "variations": [
          "reverse plank leg lift",
          "planche inversée une jambe"
      ]
  },

  "bascule du bassin": {
      "name": "Bascule du bassin",
      "category": "Abdominaux",
      "primaryMuscles": [
          "Grand droit"
      ],
      "secondaryMuscles": [
          "Transverse"
      ],
      "equipment": "Poids du corps",
      "difficulty": 1,
      "isNew": true,
      "description": "Allongé, genoux fléchis, pieds au sol. Le bas du dos se plaque au sol en rentrant le bassin, puis le relâchement est lent. Les fesses ne décollent pas : ce n'est pas un pont fessier.",
      "variations": [
          "pelvic tilt",
          "bascule postérieure"
      ]
  },

  "relevé de jambes assis": {
      "name": "Relevé de jambes assis",
      "category": "Abdominaux",
      "primaryMuscles": [
          "Fléchisseurs de hanche",
          "Grand droit"
      ],
      "secondaryMuscles": [
          "Obliques"
      ],
      "equipment": "Poids du corps / Barre",
      "difficulty": 1,
      "isNew": true,
      "description": "Assis au bord d'un banc, mains en appui, les jambes tendues montent devant puis redescendent sans que le dos s'arrondisse en arrière. La version barre alterne les jambes : même position assise, pas le relevé suspendu.",
      "variations": [
          "seated leg raise",
          "relevé de jambes assis barre"
      ]
  },

  "relevé de jambes banc décliné": {
      "name": "Relevé de jambes banc décliné",
      "category": "Abdominaux",
      "primaryMuscles": [
          "Grand droit",
          "Fléchisseurs de hanche"
      ],
      "secondaryMuscles": [
          "Obliques"
      ],
      "equipment": "Banc décliné",
      "difficulty": 2,
      "isNew": true,
      "description": "Allongé tête en haut du banc incliné, mains qui tiennent le banc, jambes tendues qui montent puis le bassin se décolle légèrement en fin de course. Ce n'est pas le relevé à plat ni le relevé suspendu.",
      "variations": [
          "incline leg hip raise",
          "relevé de jambes banc incliné"
      ]
  },

  "relevé de jambes en torsion": {
      "name": "Relevé de jambes en torsion",
      "category": "Abdominaux",
      "primaryMuscles": [
          "Obliques"
      ],
      "secondaryMuscles": [
          "Grand droit",
          "Fléchisseurs de hanche"
      ],
      "equipment": "Poids du corps",
      "difficulty": 2,
      "isNew": true,
      "description": "Allongé, les jambes tendues montent en diagonale, d'un côté puis de l'autre, sans que les épaules quittent le sol. Le GIF femme est le même geste. Les windshield à la barre restent la version suspendue.",
      "variations": [
          "twisted leg raise",
          "relevé oblique allongé"
      ]
  },

  "relevé de genoux oblique suspendu": {
      "name": "Relevé de genoux oblique suspendu",
      "category": "Abdominaux",
      "primaryMuscles": [
          "Obliques"
      ],
      "secondaryMuscles": [
          "Grand droit",
          "Fléchisseurs de hanche"
      ],
      "equipment": "Barre de traction",
      "difficulty": 3,
      "isNew": true,
      "description": "Suspendu, les genoux montent vers un coude, pas droit devant. Le corps ne se balance pas pour prendre l'élan. Les relevés de genoux de face et les windshield jambes tendues restent leurs fiches.",
      "variations": [
          "hanging oblique knee raise",
          "genoux vers le coude"
      ]
  },

  "relevé de hanche latéral aux parallèles": {
      "name": "Relevé de hanche latéral aux parallèles",
      "category": "Abdominaux",
      "primaryMuscles": [
          "Obliques"
      ],
      "secondaryMuscles": [
          "Grand dorsal",
          "Grand droit"
      ],
      "equipment": "Barres parallèles",
      "difficulty": 3,
      "isNew": true,
      "description": "En appui sur les parallèles, le bassin se déplace sur le côté pour monter une hanche, puis l'autre. Les bras restent tendus. Ce n'est pas le relevé de genoux de face déjà en banque.",
      "variations": [
          "side hip raise parallel bars",
          "hanche latérale parallèles"
      ]
  },

  "jackknife": {
      "name": "Jackknife",
      "category": "Abdominaux",
      "primaryMuscles": [
          "Grand droit",
          "Fléchisseurs de hanche"
      ],
      "secondaryMuscles": [
          "Obliques"
      ],
      "equipment": "Poids du corps / Élastique",
      "difficulty": 2,
      "isNew": true,
      "description": "Allongé, bras et jambes tendus, le buste et les jambes montent en même temps pour que les mains rejoignent les pieds, puis tout redescend long. L'élastique est le même jackknife avec une résistance. Le V-sit est la tenue, pas l'aller-retour.",
      "variations": [
          "jackknife sit-up",
          "jackknife élastique",
          "v-up"
      ]
  },

  "v-up élastique": {
      "name": "V-up élastique",
      "category": "Abdominaux",
      "primaryMuscles": [
          "Grand droit",
          "Fléchisseurs de hanche"
      ],
      "secondaryMuscles": [
          "Obliques"
      ],
      "equipment": "Élastique",
      "difficulty": 2,
      "isNew": true,
      "description": "L'élastique passe sous les pieds et dans les mains. Jambes et buste montent ensemble contre la bande, puis redescendent sans poser les talons violemment. La version alternée lève une jambe à la fois.",
      "variations": [
          "band v-up",
          "v-up élastique alterné"
      ]
  },

  "crunch élastique debout": {
      "name": "Crunch élastique debout",
      "category": "Abdominaux",
      "primaryMuscles": [
          "Grand droit"
      ],
      "secondaryMuscles": [
          "Obliques"
      ],
      "equipment": "Élastique",
      "difficulty": 1,
      "isNew": true,
      "description": "Debout, bande au-dessus de la tête ou derrière la nuque, les côtes se rapprochent du bassin sans plier les hanches comme un soulevé de terre. Le crunch à la poulie haute reste la fiche poulie.",
      "variations": [
          "band standing crunch",
          "crunch élastique"
      ]
  },

  "crunch élastique en rotation": {
      "name": "Crunch élastique en rotation",
      "category": "Abdominaux",
      "primaryMuscles": [
          "Obliques"
      ],
      "secondaryMuscles": [
          "Grand droit"
      ],
      "equipment": "Élastique",
      "difficulty": 2,
      "isNew": true,
      "description": "Debout ou à genoux, la bande résiste pendant que le coude ou les mains descendent en diagonale vers la hanche opposée. Les hanches restent de face. Le wood chop à la poulie est une autre fiche.",
      "variations": [
          "band twisting crunch",
          "crunch rotatif élastique"
      ]
  },

  "crunch inversé à la poulie": {
      "name": "Crunch inversé à la poulie",
      "category": "Abdominaux",
      "primaryMuscles": [
          "Grand droit"
      ],
      "secondaryMuscles": [
          "Fléchisseurs de hanche"
      ],
      "equipment": "Poulie basse",
      "difficulty": 2,
      "isNew": true,
      "description": "Allongé face à la poulie basse, chevilles reliées à la sangle, les genoux viennent vers la poitrine et le bassin décolle. La version tuck garde les genoux plus groupés. Les crunchs inversés au sol restent sans poulie.",
      "variations": [
          "cable reverse crunch",
          "crunch inversé poulie"
      ]
  },

  "crunch machine assis": {
      "name": "Crunch machine assis",
      "category": "Abdominaux",
      "primaryMuscles": [
          "Grand droit"
      ],
      "secondaryMuscles": [
          "Obliques"
      ],
      "equipment": "Machine à crunch",
      "difficulty": 2,
      "isNew": true,
      "description": "Assis à la machine, le buste s'enroule vers les cuisses contre le coussin ou les poignées. Les hanches ne glissent pas vers l'avant du siège. Le modèle avec relevé de jambes ajoute les genoux, c'est la même machine.",
      "variations": [
          "seated crunch machine",
          "crunch machine buste et jambes"
      ]
  },

  "rotation machine à genoux": {
      "name": "Rotation machine à genoux",
      "category": "Abdominaux",
      "primaryMuscles": [
          "Obliques"
      ],
      "secondaryMuscles": [
          "Grand droit"
      ],
      "equipment": "Machine rotative",
      "difficulty": 2,
      "isNew": true,
      "description": "À genoux dans la machine, les mains tiennent les poignées et le buste tourne d'un côté sans que le bassin suive. Le retour est freiné. Ce n'est pas le crunch machine, qui fléchit le buste vers l'avant.",
      "variations": [
          "kneeling torso twist machine",
          "rotation oblique machine"
      ]
  },

  "rollout abdominal à la barre": {
      "name": "Rollout abdominal à la barre",
      "category": "Abdominaux",
      "primaryMuscles": [
          "Grand droit"
      ],
      "secondaryMuscles": [
          "Deltoïdes antérieurs",
          "Grand dorsal"
      ],
      "equipment": "Barre",
      "difficulty": 3,
      "isNew": true,
      "description": "À genoux ou debout, les mains sur la barre, le corps s'allonge vers l'avant en gardant les côtes rentrées, puis les abdos ramènent la barre. La roue abdominale reste sa fiche. Ici l'outil est la barre, y compris depuis un banc.",
      "variations": [
          "barbell rollout",
          "ab roller barre",
          "rollout debout barre"
      ]
  },

  "rotation haltères buste penché": {
      "name": "Rotation haltères buste penché",
      "category": "Abdominaux",
      "primaryMuscles": [
          "Obliques"
      ],
      "secondaryMuscles": [
          "Deltoïdes postérieurs",
          "Érecteurs du rachis"
      ],
      "equipment": "Haltères",
      "difficulty": 2,
      "isNew": true,
      "description": "Buste penché, haltères dans les mains, le torse tourne pour amener les charges d'un côté à l'autre sans arrondir le dos. Le wood chop à la poulie est debout et à la poulie, pas ce geste.",
      "variations": [
          "spell caster",
          "dumbbell twist bent over"
      ]
  },

  "windmill kettlebell": {
      "name": "Windmill kettlebell",
      "category": "Abdominaux",
      "primaryMuscles": [
          "Obliques"
      ],
      "secondaryMuscles": [
          "Deltoïdes",
          "Grand fessier",
          "Ischio-jambiers"
      ],
      "equipment": "Kettlebell",
      "difficulty": 3,
      "isNew": true,
      "description": "Un kettlebell bras tendu au-dessus de l'épaule, les pieds écartés, la main libre descend le long de la jambe avant pendant que le regard reste sur la charge. Les hanches partent en arrière, le bras du haut ne plie pas. La version deux kettlebells est le même schéma.",
      "variations": [
          "kettlebell windmill",
          "windmill avancé",
          "double windmill"
      ]
  },

  "figure 8 kettlebell": {
      "name": "Figure 8 kettlebell",
      "category": "Abdominaux",
      "primaryMuscles": [
          "Obliques"
      ],
      "secondaryMuscles": [
          "Grand droit",
          "Grand fessier"
      ],
      "equipment": "Kettlebell",
      "difficulty": 2,
      "isNew": true,
      "description": "Debout, buste légèrement penché, le kettlebell passe en huit entre les jambes, d'une main à l'autre. Le dos reste long, les genoux suivent les pieds. Ce n'est pas un swing.",
      "variations": [
          "kettlebell figure 8",
          "huit kettlebell"
      ]
  },

  "swing de masse": {
      "name": "Swing de masse",
      "category": "Abdominaux",
      "primaryMuscles": [
          "Obliques"
      ],
      "secondaryMuscles": [
          "Grand dorsal",
          "Deltoïdes",
          "Grand fessier"
      ],
      "equipment": "Masse",
      "difficulty": 2,
      "isNew": true,
      "description": "Masse tenue à deux hauteurs de mains, le buste tourne pour abattre la tête de masse, puis les abdos et les hanches ramènent l'outil. Les bras ne frappent pas tout seuls, c'est la rotation du tronc qui mène.",
      "variations": [
          "sledgehammer swing",
          "frappe de masse"
      ]
  },

  "slam médecine ball un bras": {
      "name": "Slam médecine ball un bras",
      "category": "Abdominaux",
      "primaryMuscles": [
          "Grand droit",
          "Obliques"
      ],
      "secondaryMuscles": [
          "Deltoïdes",
          "Grand dorsal"
      ],
      "equipment": "Médecine ball",
      "difficulty": 2,
      "isNew": true,
      "description": "Le ballon part au-dessus de l'épaule d'un bras et s'abat au sol à côté du pied, avec une rotation du buste. On ramasse le ballon dos long, pas en arrondi lombaire.",
      "variations": [
          "one arm med ball slam",
          "slam oblique"
      ]
  },

  "rotation landmine": {
      "name": "Rotation landmine",
      "category": "Abdominaux",
      "primaryMuscles": [
          "Obliques"
      ],
      "secondaryMuscles": [
          "Deltoïdes antérieurs",
          "Grand droit"
      ],
      "equipment": "Landmine / Barre",
      "difficulty": 2,
      "isNew": true,
      "description": "Un bout de barre est ancré au sol, les deux mains tiennent l'autre bout. La barre décrit un arc d'un côté à l'autre, bras tendus, hanches stables. Le wood chop à la poulie n'utilise pas la landmine.",
      "variations": [
          "landmine 180",
          "landmine rotation",
          "rotation barre ancrée"
      ]
  },

  "gainage avec rotation": {
      "name": "Gainage avec rotation",
      "category": "Abdominaux",
      "primaryMuscles": [
          "Obliques"
      ],
      "secondaryMuscles": [
          "Grand droit",
          "Deltoïdes"
      ],
      "equipment": "Poids du corps",
      "difficulty": 2,
      "isNew": true,
      "description": "En gainage, une main quitte le sol et le buste s'ouvre sur le côté, puis revient. Les hanches ne basculent pas en bloc. Les shoulder taps restent le gainage dynamique, sans cette ouverture.",
      "variations": [
          "plank with twist",
          "gainage rotation"
      ]
  },

  "fallout en suspension": {
      "name": "Fallout en suspension",
      "category": "Abdominaux",
      "primaryMuscles": [
          "Grand droit"
      ],
      "secondaryMuscles": [
          "Deltoïdes antérieurs",
          "Grand dorsal"
      ],
      "equipment": "Sangles de suspension",
      "difficulty": 3,
      "isNew": true,
      "description": "Avant-bras ou mains dans les sangles, le corps part vers l'avant, bras qui montent, côtes rentrées, puis les abdos ramènent. Même famille que la roue, autre outil. La roue et le rollout barre restent leurs fiches.",
      "variations": [
          "suspension fallout",
          "ab rollout sangles"
      ]
  },

  "crunch inversé en suspension": {
      "name": "Crunch inversé en suspension",
      "category": "Abdominaux",
      "primaryMuscles": [
          "Grand droit"
      ],
      "secondaryMuscles": [
          "Fléchisseurs de hanche"
      ],
      "equipment": "Sangles de suspension",
      "difficulty": 3,
      "isNew": true,
      "description": "Pieds dans les sangles, mains au sol, les genoux se tirent vers la poitrine pendant que les sangles reviennent. Le dos ne creuse pas au retour. Ce n'est pas la rentrée de genoux sur swiss ball.",
      "variations": [
          "suspended reverse crunch",
          "knee tuck sangles"
      ]
  },

  "rotation ventrale sur swiss ball": {
      "name": "Rotation ventrale sur swiss ball",
      "category": "Abdominaux",
      "primaryMuscles": [
          "Obliques"
      ],
      "secondaryMuscles": [
          "Érecteurs du rachis",
          "Grand fessier"
      ],
      "equipment": "Swiss ball",
      "difficulty": 2,
      "isNew": true,
      "description": "Ventre ou hanches en appui sur le ballon, les pieds calés, le buste tourne d'un côté à l'autre. Les lombaires ne font pas le mouvement toutes seules : la rotation part des côtes.",
      "variations": [
          "prone twist stability ball",
          "rotation ventrale ballon"
      ]
  },

  "planche complète": {
      "name": "Planche complète",
      "category": "Épaules",
      "primaryMuscles": [
          "Deltoïdes antérieurs",
          "Pectoraux"
      ],
      "secondaryMuscles": [
          "Triceps",
          "Grand droit",
          "Dentelé antérieur"
      ],
      "equipment": "Sol / Parallettes",
      "difficulty": 4,
      "isNew": true,
      "description": "Corps horizontal, bras tendus, jambes serrées et tendues, bassin aligné. Les tenues tuck et straddle restent les étapes d'avant. Ici les jambes ne sont plus écartées ni groupées.",
      "variations": [
          "full planche",
          "planche"
      ]
  },

  "maltese": {
      "name": "Maltese",
      "category": "Épaules",
      "primaryMuscles": [
          "Deltoïdes antérieurs",
          "Pectoraux"
      ],
      "secondaryMuscles": [
          "Triceps",
          "Grand droit",
          "Dentelé antérieur"
      ],
      "equipment": "Anneaux / Parallettes",
      "difficulty": 4,
      "isNew": true,
      "description": "Corps horizontal, bras ouverts sur les côtés, pas le long du corps comme la planche. Les épaules restent basses. Le straddle maltese est la fiche d'écart des jambes.",
      "variations": [
          "full maltese",
          "maltese"
      ]
  },

  "maltese straddle": {
      "name": "Maltese straddle",
      "category": "Épaules",
      "primaryMuscles": [
          "Deltoïdes antérieurs",
          "Pectoraux"
      ],
      "secondaryMuscles": [
          "Triceps",
          "Grand droit"
      ],
      "equipment": "Anneaux / Parallettes",
      "difficulty": 4,
      "isNew": true,
      "description": "Même tenue que le maltese, bras ouverts, mais les jambes sont écartées. C'est l'étape d'avant le maltese jambes serrées, pas une planche straddle (les bras de la planche restent proches du bassin).",
      "variations": [
          "straddle maltese"
      ]
  },

  "bent press kettlebell": {
      "name": "Bent press kettlebell",
      "category": "Épaules",
      "primaryMuscles": [
          "Deltoïdes"
      ],
      "secondaryMuscles": [
          "Obliques",
          "Triceps",
          "Grand fessier"
      ],
      "equipment": "Kettlebell",
      "difficulty": 3,
      "isNew": true,
      "description": "Le kettlebell part à l'épaule. Le buste s'incline sur le côté et le bras se tend au-dessus de la tête sans que la charge soit poussée comme un développé militaire. Le regard suit le kettlebell.",
      "variations": [
          "kettlebell bent press"
      ]
  },

  "adduction hanche poulie": {
      "name": "Adduction de hanche à la poulie",
      "category": "Quadriceps",
      "primaryMuscles": [
          "Adducteurs"
      ],
      "secondaryMuscles": [
          "Grand fessier"
      ],
      "equipment": "Poulie basse",
      "difficulty": 2,
      "isNew": true,
      "description": "Debout, la cheville reliée à la poulie basse, la jambe libre se rapproche de l'autre sans pencher le buste. Le retour ne laisse pas la charge tirer la jambe d'un coup. La fiche élastique reste sans ce GIF : ce n'est pas une bande.",
      "variations": [
          "cable hip adduction",
          "adduction poulie"
      ]
  },

  "adduction hanche machine assise": {
      "name": "Adduction de hanche machine assise",
      "category": "Quadriceps",
      "primaryMuscles": [
          "Adducteurs"
      ],
      "secondaryMuscles": [
          "Grand fessier"
      ],
      "equipment": "Machine adducteurs",
      "difficulty": 1,
      "isNew": true,
      "description": "Assis, dos contre le dossier, les genoux poussent les coussins l'un vers l'autre. Le bassin ne décolle pas et les poids ne claquent pas au retour. L'abduction machine est l'autre fiche, les cuisses s'écartent.",
      "variations": [
          "seated hip adduction",
          "adductor machine"
      ]
  },

  "adduction hanche allongée": {
      "name": "Adduction de hanche allongée",
      "category": "Quadriceps",
      "primaryMuscles": [
          "Adducteurs"
      ],
      "secondaryMuscles": [],
      "equipment": "Poids du corps",
      "difficulty": 1,
      "isNew": true,
      "description": "Allongé sur le côté, la jambe du dessus est fléchie et posée devant, la jambe du dessous tendue monte vers elle. Le bassin ne roule pas en arrière. Ce n'est pas le Copenhagen, qui se fait en gainage latéral.",
      "variations": [
          "side lying hip adduction",
          "adduction allongée"
      ]
  },

  "curl drag barre": {
      "name": "Curl drag barre",
      "category": "Biceps",
      "primaryMuscles": [
          "Biceps"
      ],
      "secondaryMuscles": [
          "Brachial"
      ],
      "equipment": "Barre",
      "difficulty": 3,
      "isNew": true,
      "description": "La barre reste contre le corps et monte vers le cou pendant que les coudes partent vers l'arrière. Ce n'est pas un curl barre classique : les coudes ne restent pas fixes sous les épaules.",
      "variations": [
          "drag curl",
          "barbell drag curl"
      ]
  },

  "curl drag poulie": {
      "name": "Curl drag à la poulie",
      "category": "Biceps",
      "primaryMuscles": [
          "Biceps"
      ],
      "secondaryMuscles": [
          "Brachial"
      ],
      "equipment": "Poulie basse",
      "difficulty": 2,
      "isNew": true,
      "description": "Même trajet que le drag curl, la poignée ou la barre de poulie colle au torse et les coudes reculent. La poulie garde la tension en bas, là où la barre libre se relâche.",
      "variations": [
          "cable drag curl"
      ]
  },

  "curl inversé barre": {
      "name": "Curl inversé barre",
      "category": "Biceps",
      "primaryMuscles": [
          "Brachio-radial"
      ],
      "secondaryMuscles": [
          "Biceps",
          "Brachial"
      ],
      "equipment": "Barre",
      "difficulty": 2,
      "isNew": true,
      "description": "Prise pronation, paumes vers le sol, la barre monte par une flexion du coude. Les poignets ne cassent pas en arrière. Le reverse wrist curl est le poignet, pas ce geste.",
      "variations": [
          "reverse curl",
          "curl prise pronation"
      ]
  },

  "curl inversé barre ez": {
      "name": "Curl inversé barre EZ",
      "category": "Biceps",
      "primaryMuscles": [
          "Brachio-radial"
      ],
      "secondaryMuscles": [
          "Biceps",
          "Brachial"
      ],
      "equipment": "Barre EZ",
      "difficulty": 2,
      "isNew": true,
      "description": "Curl inversé à la barre EZ : la prise angulée est moins dure pour les poignets que la barre droite, les coudes restent le long du corps.",
      "variations": [
          "ez bar reverse curl"
      ]
  },

  "curl inversé haltères": {
      "name": "Curl inversé haltères",
      "category": "Biceps",
      "primaryMuscles": [
          "Brachio-radial"
      ],
      "secondaryMuscles": [
          "Biceps",
          "Brachial"
      ],
      "equipment": "Haltères",
      "difficulty": 2,
      "isNew": true,
      "description": "Haltères en prise pronation, flexion du coude sans laisser les poignets partir en extension. La version un bras et la concentration prise inversée sont le même coude, autre appui.",
      "variations": [
          "dumbbell reverse curl",
          "reverse concentration curl"
      ]
  },

  "curl inversé poulie": {
      "name": "Curl inversé à la poulie",
      "category": "Biceps",
      "primaryMuscles": [
          "Brachio-radial"
      ],
      "secondaryMuscles": [
          "Biceps"
      ],
      "equipment": "Poulie basse",
      "difficulty": 2,
      "isNew": true,
      "description": "Poulie basse, prise pronation, les coudes fléchissent le long du corps. La version un bras est le même geste.",
      "variations": [
          "cable reverse curl"
      ]
  },

  "curl pupitre inversé": {
      "name": "Curl pupitre inversé",
      "category": "Biceps",
      "primaryMuscles": [
          "Brachio-radial"
      ],
      "secondaryMuscles": [
          "Biceps"
      ],
      "equipment": "Banc pupitre + Barre / Haltères",
      "difficulty": 2,
      "isNew": true,
      "description": "Pupitre, prise pronation, les bras posés, la charge monte par les coudes. La barre, la barre EZ et les haltères partagent cette fiche, comme le pupitre classique mélange barre et haltères.",
      "variations": [
          "reverse preacher curl",
          "ez reverse preacher"
      ]
  },

  "curl pupitre inversé poulie": {
      "name": "Curl pupitre inversé à la poulie",
      "category": "Biceps",
      "primaryMuscles": [
          "Brachio-radial"
      ],
      "secondaryMuscles": [
          "Biceps"
      ],
      "equipment": "Poulie + Banc pupitre",
      "difficulty": 2,
      "isNew": true,
      "description": "Pupitre face à la poulie, prise pronation. La tension reste présente quand le coude est ouvert, contrairement à la barre libre.",
      "variations": [
          "cable reverse preacher curl"
      ]
  },

  "curl pupitre inversé machine": {
      "name": "Curl pupitre inversé machine",
      "category": "Biceps",
      "primaryMuscles": [
          "Brachio-radial"
      ],
      "secondaryMuscles": [
          "Biceps"
      ],
      "equipment": "Machine pupitre",
      "difficulty": 2,
      "isNew": true,
      "description": "Machine pupitre en prise pronation. Le trajet est guidé. Le pupitre machine en supination reste sa fiche.",
      "variations": [
          "lever reverse preacher curl"
      ]
  },

  "curl marteau croisé": {
      "name": "Curl marteau croisé",
      "category": "Biceps",
      "primaryMuscles": [
          "Brachial",
          "Biceps"
      ],
      "secondaryMuscles": [
          "Brachio-radial"
      ],
      "equipment": "Haltères",
      "difficulty": 2,
      "isNew": true,
      "description": "Prise neutre, l'haltère traverse devant le torse vers l'épaule opposée. Le curl marteau classique monte dans l'axe du corps, pas en travers.",
      "variations": [
          "cross body hammer curl",
          "curl marteau croisé"
      ]
  },

  "curl marteau poulie": {
      "name": "Curl marteau à la poulie",
      "category": "Biceps",
      "primaryMuscles": [
          "Brachial",
          "Biceps"
      ],
      "secondaryMuscles": [
          "Brachio-radial"
      ],
      "equipment": "Poulie basse + Corde",
      "difficulty": 2,
      "isNew": true,
      "description": "Corde à la poulie basse, pouces vers le ciel, les coudes fléchissent sans supiner en haut. Les deux GIF au pupitre avec corde sont le même marteau, bras calés.",
      "variations": [
          "rope hammer curl",
          "cable hammer preacher"
      ]
  },

  "curl marteau pupitre": {
      "name": "Curl marteau pupitre",
      "category": "Biceps",
      "primaryMuscles": [
          "Brachial",
          "Biceps"
      ],
      "secondaryMuscles": [
          "Brachio-radial"
      ],
      "equipment": "Banc pupitre + Haltères",
      "difficulty": 2,
      "isNew": true,
      "description": "Pupitre, haltères en prise neutre. Les coudes restent sur le banc. La machine prise marteau est regroupée ici.",
      "variations": [
          "hammer preacher curl",
          "lever hammer preacher"
      ]
  },

  "curl incliné poulie": {
      "name": "Curl incliné à la poulie",
      "category": "Biceps",
      "primaryMuscles": [
          "Biceps"
      ],
      "secondaryMuscles": [
          "Brachial"
      ],
      "equipment": "Poulie basse + Banc incliné",
      "difficulty": 2,
      "isNew": true,
      "description": "Dos sur le banc incliné, les deux bras tirent les poulies basses. L'épaule reste ouverte en bas, comme le curl incliné haltères, avec la tension de la poulie.",
      "variations": [
          "incline cable curl"
      ]
  },

  "curl allongé haltères": {
      "name": "Curl allongé haltères",
      "category": "Biceps",
      "primaryMuscles": [
          "Biceps"
      ],
      "secondaryMuscles": [
          "Brachial"
      ],
      "equipment": "Haltères + Banc",
      "difficulty": 2,
      "isNew": true,
      "description": "Allongé sur le dos, bras vers le plafond ou écartés, les coudes fléchissent pour amener les haltères vers les épaules. Ce n'est pas le curl incliné, où le dos est relevé.",
      "variations": [
          "lying dumbbell curl",
          "supine curl"
      ]
  },

  "curl allongé poulie": {
      "name": "Curl allongé à la poulie",
      "category": "Biceps",
      "primaryMuscles": [
          "Biceps"
      ],
      "secondaryMuscles": [
          "Brachial"
      ],
      "equipment": "Poulie basse + Banc",
      "difficulty": 2,
      "isNew": true,
      "description": "Allongé, face à la poulie basse, les coudes fléchissent au-dessus de la poitrine. La prise serrée est la même position.",
      "variations": [
          "lying cable curl"
      ]
  },

  "curl poulie haute": {
      "name": "Curl poulie haute",
      "category": "Biceps",
      "primaryMuscles": [
          "Biceps"
      ],
      "secondaryMuscles": [
          "Brachial"
      ],
      "equipment": "Poulie haute",
      "difficulty": 2,
      "isNew": true,
      "description": "La charge vient d'en haut. Les coudes restent hauts et fléchissent pour amener les mains vers le front ou les épaules. Ce n'est pas le curl poulie basse, ni une extension triceps : ici les biceps se raccourcissent.",
      "variations": [
          "overhead cable curl",
          "high cable curl"
      ]
  },

  "curl concentration élastique": {
      "name": "Curl concentration élastique",
      "category": "Biceps",
      "primaryMuscles": [
          "Biceps"
      ],
      "secondaryMuscles": [
          "Brachial"
      ],
      "equipment": "Élastique",
      "difficulty": 1,
      "isNew": true,
      "description": "Assis, coude calé sur la cuisse, la bande résiste pendant que la main monte vers l'épaule. Le curl concentration haltère reste l'autre fiche.",
      "variations": [
          "band concentration curl"
      ]
  },

  "curl concentration poulie": {
      "name": "Curl concentration à la poulie",
      "category": "Biceps",
      "primaryMuscles": [
          "Biceps"
      ],
      "secondaryMuscles": [
          "Brachial"
      ],
      "equipment": "Poulie basse",
      "difficulty": 2,
      "isNew": true,
      "description": "Un bras, coude appuyé, la poulie basse tire vers le sol pendant la flexion. Même idée que le concentration haltère.",
      "variations": [
          "cable concentration curl"
      ]
  },

  "curl élastique": {
      "name": "Curl élastique",
      "category": "Biceps",
      "primaryMuscles": [
          "Biceps"
      ],
      "secondaryMuscles": [
          "Brachial"
      ],
      "equipment": "Élastique",
      "difficulty": 1,
      "isNew": true,
      "description": "La bande passe sous les pieds ou derrière, les coudes fléchissent en supination. L'alterné et le un bras au-dessus de la tête sont le même curl, autre ancrage.",
      "variations": [
          "band biceps curl",
          "resistance band curl"
      ]
  },

  "curl pupitre poulie": {
      "name": "Curl pupitre à la poulie",
      "category": "Biceps",
      "primaryMuscles": [
          "Biceps"
      ],
      "secondaryMuscles": [
          "Brachial"
      ],
      "equipment": "Poulie + Banc pupitre",
      "difficulty": 2,
      "isNew": true,
      "description": "Bras sur le pupitre, la poulie tire vers le sol. Les coudes ne décollent pas du banc. Le pupitre barre et le pupitre machine restent leurs fiches.",
      "variations": [
          "cable preacher curl"
      ]
  },

  "curl smith": {
      "name": "Curl Smith",
      "category": "Biceps",
      "primaryMuscles": [
          "Biceps"
      ],
      "secondaryMuscles": [
          "Brachial"
      ],
      "equipment": "Smith machine",
      "difficulty": 2,
      "isNew": true,
      "description": "Barre guidée, les coudes fléchissent le long du corps. Le rail empêche la barre de partir en avant. Ce n'est pas le curl barre libre.",
      "variations": [
          "smith machine curl"
      ]
  },

  "curl haut": {
      "name": "Curl haut",
      "category": "Biceps",
      "primaryMuscles": [
          "Biceps"
      ],
      "secondaryMuscles": [
          "Deltoïdes antérieurs",
          "Brachial"
      ],
      "equipment": "Haltères",
      "difficulty": 2,
      "isNew": true,
      "description": "Les coudes restent levés devant les épaules pendant que les haltères montent vers les oreilles. Le curl haltères classique garde les coudes bas.",
      "variations": [
          "high curl",
          "curl coudes hauts"
      ]
  },

  "curl waiter": {
      "name": "Curl waiter",
      "category": "Biceps",
      "primaryMuscles": [
          "Biceps"
      ],
      "secondaryMuscles": [
          "Brachial"
      ],
      "equipment": "Haltère",
      "difficulty": 2,
      "isNew": true,
      "description": "Un haltère tenu à deux mains sous le disque, comme un plateau, les coudes montent devant pendant que les mains restent paumes vers le ciel.",
      "variations": [
          "waiter curl"
      ]
  },

  "curl biceps allongé côté": {
      "name": "Curl biceps allongé sur le côté",
      "category": "Biceps",
      "primaryMuscles": [
          "Biceps"
      ],
      "secondaryMuscles": [
          "Brachial"
      ],
      "equipment": "Poids du corps",
      "difficulty": 1,
      "isNew": true,
      "description": "Allongé sur le côté, le bras du dessus ou du dessous se plie sans charge, l'épaule reste fixe. Geste d'apprentissage ou de fin de série, pas un curl haltères.",
      "variations": [
          "bodyweight side lying curl"
      ]
  },

  "fente et curl haltères": {
      "name": "Fente et curl haltères",
      "category": "Quadriceps",
      "primaryMuscles": [
          "Quadriceps"
      ],
      "secondaryMuscles": [
          "Biceps",
          "Grand fessier"
      ],
      "equipment": "Haltères",
      "difficulty": 2,
      "isNew": true,
      "description": "Une fente, et les coudes fléchissent avec les haltères. Les fentes seules restent leur fiche. Le GIF « bowling » ajoute une rotation du buste : regroupé ici.",
      "variations": [
          "lunge with bicep curl",
          "lunge curl bowling"
      ]
  },

  "squat et curl haltères": {
      "name": "Squat et curl haltères",
      "category": "Quadriceps",
      "primaryMuscles": [
          "Quadriceps"
      ],
      "secondaryMuscles": [
          "Biceps",
          "Grand fessier"
      ],
      "equipment": "Haltères",
      "difficulty": 2,
      "isNew": true,
      "description": "Squat avec haltères, les coudes fléchissent en même temps ou en haut du mouvement. Le squat haltères et le curl haltères restent leurs fiches.",
      "variations": [
          "squat to bicep curl",
          "dumbbell squat curl"
      ]
  },

  "curl et développé haltères": {
      "name": "Curl et développé haltères",
      "category": "Biceps",
      "primaryMuscles": [
          "Biceps"
      ],
      "secondaryMuscles": [
          "Deltoïdes antérieurs",
          "Triceps"
      ],
      "equipment": "Haltères",
      "difficulty": 2,
      "isNew": true,
      "description": "Curl haltères jusqu'aux épaules, puis développé au-dessus de la tête, puis le chemin inverse. Ce n'est ni le curl haltères seul ni le développé militaire seul.",
      "variations": [
          "curl to shoulder press",
          "bicep curl to press"
      ]
  },

  "curl marteau et développé": {
      "name": "Curl marteau et développé",
      "category": "Biceps",
      "primaryMuscles": [
          "Brachial",
          "Biceps"
      ],
      "secondaryMuscles": [
          "Deltoïdes antérieurs",
          "Triceps"
      ],
      "equipment": "Haltères",
      "difficulty": 2,
      "isNew": true,
      "description": "Curl marteau puis développé, en alternant les bras. La prise reste neutre, contrairement au curl supiné puis développé.",
      "variations": [
          "hammer curl and press"
      ]
  },

  "step-up équilibre et curl": {
      "name": "Step-up équilibre et curl",
      "category": "Quadriceps",
      "primaryMuscles": [
          "Quadriceps"
      ],
      "secondaryMuscles": [
          "Biceps",
          "Grand fessier"
      ],
      "equipment": "Haltères + Step",
      "difficulty": 3,
      "isNew": true,
      "description": "Montée sur une jambe, tenue en équilibre, puis curl des haltères. Le genou de la jambe d'appui ne rentre pas. La fiche Step-up existe déjà : ici la montée se termine en équilibre avec un curl.",
      "variations": [
          "step-up single leg curl"
      ]
  },

  "mollets donkey": {
      "name": "Mollets donkey",
      "category": "Mollets",
      "primaryMuscles": [
          "Gastrocnémiens"
      ],
      "secondaryMuscles": [
          "Soléaires"
      ],
      "equipment": "Banc / Machine",
      "difficulty": 2,
      "isNew": true,
      "description": "Buste penché, hanches fléchies, les talons descendent puis montent. Le genou reste tendu, contrairement aux mollets assis. La version lestée, unilatérale et à la machine sont le même donkey.",
      "variations": [
          "donkey calf raise"
      ]
  },

  "mollets inversés smith": {
      "name": "Mollets inversés Smith",
      "category": "Mollets",
      "primaryMuscles": [
          "Tibial antérieur"
      ],
      "secondaryMuscles": [],
      "equipment": "Smith machine",
      "difficulty": 2,
      "isNew": true,
      "description": "Pointes vers le haut, les orteils tirent le pied vers le tibia contre la barre guidée. Ce n'est pas un mollet classique : le mollet s'étire, le tibial travaille. Les Tibialis raises au mur restent sans charge.",
      "variations": [
          "smith reverse calf raise",
          "smith toe raise"
      ]
  },

  "tibialis élastique": {
      "name": "Tibialis élastique",
      "category": "Mollets",
      "primaryMuscles": [
          "Tibial antérieur"
      ],
      "secondaryMuscles": [],
      "equipment": "Élastique",
      "difficulty": 1,
      "isNew": true,
      "description": "Une jambe, bande qui résiste quand les orteils se rapprochent du tibia. Même muscle que les tibialis au mur, avec une bande et une seule jambe.",
      "variations": [
          "band reverse calf raise"
      ]
  },

  "mollets rotatifs machine": {
      "name": "Mollets rotatifs machine",
      "category": "Mollets",
      "primaryMuscles": [
          "Gastrocnémiens"
      ],
      "secondaryMuscles": [
          "Soléaires"
      ],
      "equipment": "Machine mollets rotative",
      "difficulty": 2,
      "isNew": true,
      "description": "Assis ou calé dans la machine rotative, le pied tourne en montant sur la pointe. Ce n'est ni le mollet assis classique ni le mollet à la presse.",
      "variations": [
          "rotary calf"
      ]
  },

  "mollets debout balancé": {
      "name": "Mollets debout balancé",
      "category": "Mollets",
      "primaryMuscles": [
          "Gastrocnémiens"
      ],
      "secondaryMuscles": [
          "Soléaires"
      ],
      "equipment": "Barre",
      "difficulty": 2,
      "isNew": true,
      "description": "Mollet debout à la barre, le poids du pied passe de l'intérieur vers l'extérieur en haut du mouvement. Les fiches pointes dedans et pointes dehors restent des séries fixes, pas ce balancement.",
      "variations": [
          "rocking calf raise"
      ]
  },

  "développé militaire élastique": {
      "name": "Développé militaire élastique",
      "category": "Épaules",
      "primaryMuscles": [
          "Deltoïdes antérieurs"
      ],
      "secondaryMuscles": [
          "Triceps",
          "Trapèzes"
      ],
      "equipment": "Élastique",
      "difficulty": 1,
      "isNew": true,
      "description": "Bande sous les pieds ou derrière le banc, les mains poussent au-dessus de la tête. Les développés barre, haltères et Smith restent leurs fiches. La version qui tourne le buste est regroupée.",
      "variations": [
          "band shoulder press"
      ]
  },

  "développé militaire kettlebell": {
      "name": "Développé militaire kettlebell",
      "category": "Épaules",
      "primaryMuscles": [
          "Deltoïdes antérieurs"
      ],
      "secondaryMuscles": [
          "Triceps",
          "Trapèzes"
      ],
      "equipment": "Kettlebell",
      "difficulty": 2,
      "isNew": true,
      "description": "Kettlebells au niveau des épaules, bras qui se tendent au-dessus de la tête sans pousser avec les jambes. Le seesaw et l'alterné sont le même développé.",
      "variations": [
          "kettlebell military press",
          "seesaw press"
      ]
  },

  "développé épaules machine": {
      "name": "Développé épaules machine",
      "category": "Épaules",
      "primaryMuscles": [
          "Deltoïdes antérieurs"
      ],
      "secondaryMuscles": [
          "Triceps"
      ],
      "equipment": "Machine à épaules",
      "difficulty": 2,
      "isNew": true,
      "description": "Assis, poignées guidées, poussée au-dessus de la tête. Le Smith est une barre dans un rail, pas cette machine. Les variantes v-2, v-3 et un bras sont le même développé.",
      "variations": [
          "machine shoulder press",
          "lever military press"
      ]
  },

  "développé épaules poulie": {
      "name": "Développé épaules à la poulie",
      "category": "Épaules",
      "primaryMuscles": [
          "Deltoïdes antérieurs"
      ],
      "secondaryMuscles": [
          "Triceps"
      ],
      "equipment": "Poulie",
      "difficulty": 2,
      "isNew": true,
      "description": "Poignées de poulie poussées au-dessus de la tête, coudes qui finissent près des oreilles. L'alterné est le même geste, un bras après l'autre.",
      "variations": [
          "cable shoulder press"
      ]
  },

  "développé nuque": {
      "name": "Développé nuque",
      "category": "Épaules",
      "primaryMuscles": [
          "Deltoïdes"
      ],
      "secondaryMuscles": [
          "Triceps",
          "Trapèzes"
      ],
      "equipment": "Barre / Smith",
      "difficulty": 3,
      "isNew": true,
      "description": "La barre descend derrière la tête, pas devant le visage. Les coudes partent vers l'arrière. Le développé militaire classique reste devant. Smith et debout sont le même trajet.",
      "variations": [
          "behind the neck press"
      ]
  },

  "bradford press": {
      "name": "Bradford press",
      "category": "Épaules",
      "primaryMuscles": [
          "Deltoïdes"
      ],
      "secondaryMuscles": [
          "Triceps"
      ],
      "equipment": "Barre",
      "difficulty": 3,
      "isNew": true,
      "description": "La barre passe devant le visage puis derrière la tête, sans poser, dans le même développé. Ce n'est ni le militaire devant ni le développé nuque seul.",
      "variations": [
          "bradford press",
          "rocky press"
      ]
  },

  "push press haltères": {
      "name": "Push press haltères",
      "category": "Épaules",
      "primaryMuscles": [
          "Deltoïdes antérieurs"
      ],
      "secondaryMuscles": [
          "Triceps",
          "Quadriceps"
      ],
      "equipment": "Haltères",
      "difficulty": 3,
      "isNew": true,
      "description": "Petite flexion des genoux, puis les jambes poussent les haltères au-dessus de la tête. Le militaire haltères ne donne pas d'élan avec les jambes.",
      "variations": [
          "dumbbell push press"
      ]
  },

  "push press kettlebell": {
      "name": "Push press kettlebell",
      "category": "Épaules",
      "primaryMuscles": [
          "Deltoïdes antérieurs"
      ],
      "secondaryMuscles": [
          "Triceps",
          "Quadriceps"
      ],
      "equipment": "Kettlebell",
      "difficulty": 3,
      "isNew": true,
      "description": "Même poussée de jambes que le push press, avec kettlebell. Le jerk, plus technique, n'est pas cette fiche.",
      "variations": [
          "kettlebell push press"
      ]
  },

  "thruster barre": {
      "name": "Thruster barre",
      "category": "Épaules",
      "primaryMuscles": [
          "Deltoïdes antérieurs",
          "Quadriceps"
      ],
      "secondaryMuscles": [
          "Triceps",
          "Grand fessier"
      ],
      "equipment": "Barre",
      "difficulty": 3,
      "isNew": true,
      "description": "Squat avant, puis la barre part au-dessus de la tête dans la montée. Le squat et le militaire restent leurs fiches.",
      "variations": [
          "barbell thruster"
      ]
  },

  "thruster kettlebell": {
      "name": "Thruster kettlebell",
      "category": "Épaules",
      "primaryMuscles": [
          "Deltoïdes antérieurs",
          "Quadriceps"
      ],
      "secondaryMuscles": [
          "Triceps",
          "Grand fessier"
      ],
      "equipment": "Kettlebell",
      "difficulty": 3,
      "isNew": true,
      "description": "Squat gobelet ou deux kettlebells, puis développé dans la montée. Pas un squat seul.",
      "variations": [
          "kettlebell thruster"
      ]
  },

  "tirage menton haltères": {
      "name": "Tirage menton haltères",
      "category": "Épaules",
      "primaryMuscles": [
          "Deltoïdes latéraux",
          "Trapèzes"
      ],
      "secondaryMuscles": [
          "Biceps"
      ],
      "equipment": "Haltères",
      "difficulty": 2,
      "isNew": true,
      "description": "Haltères le long du corps qui montent vers le menton, coudes au-dessus des poignets. Le tirage menton barre existe déjà.",
      "variations": [
          "dumbbell upright row"
      ]
  },

  "tirage menton poulie": {
      "name": "Tirage menton à la poulie",
      "category": "Épaules",
      "primaryMuscles": [
          "Deltoïdes latéraux",
          "Trapèzes"
      ],
      "secondaryMuscles": [
          "Biceps"
      ],
      "equipment": "Poulie basse",
      "difficulty": 2,
      "isNew": true,
      "description": "Barre ou poignée de poulie basse tirée vers le menton, coudes hauts. La tension reste en bas.",
      "variations": [
          "cable upright row"
      ]
  },

  "tirage menton smith": {
      "name": "Tirage menton Smith",
      "category": "Épaules",
      "primaryMuscles": [
          "Deltoïdes latéraux",
          "Trapèzes"
      ],
      "secondaryMuscles": [
          "Biceps"
      ],
      "equipment": "Smith machine",
      "difficulty": 2,
      "isNew": true,
      "description": "Même tirage vers le menton, barre guidée. Le rail empêche la barre de s'éloigner du corps.",
      "variations": [
          "smith upright row"
      ]
  },

  "oiseau smith": {
      "name": "Oiseau Smith",
      "category": "Épaules",
      "primaryMuscles": [
          "Deltoïdes postérieurs"
      ],
      "secondaryMuscles": [
          "Trapèzes"
      ],
      "equipment": "Smith machine",
      "difficulty": 2,
      "isNew": true,
      "description": "Buste penché, barre guidée tirée vers le bas du visage ou le haut du ventre, coudes ouverts. L'oiseau haltères et l'oiseau machine restent sans rail.",
      "variations": [
          "smith rear delt row"
      ]
  },

  "oiseau élastique": {
      "name": "Oiseau élastique",
      "category": "Épaules",
      "primaryMuscles": [
          "Deltoïdes postérieurs"
      ],
      "secondaryMuscles": [
          "Trapèzes"
      ],
      "equipment": "Élastique",
      "difficulty": 1,
      "isNew": true,
      "description": "Buste penché ou bande devant, les bras s'ouvrent vers l'arrière, coudes souples. L'oiseau haltères, l'oiseau poulie et l'oiseau machine restent leurs fiches.",
      "variations": [
          "band reverse fly",
          "band rear delt row"
      ]
  },

  "élévation latérale machine": {
      "name": "Élévation latérale machine",
      "category": "Épaules",
      "primaryMuscles": [
          "Deltoïdes latéraux"
      ],
      "secondaryMuscles": [],
      "equipment": "Machine élévations",
      "difficulty": 1,
      "isNew": true,
      "description": "Assis, les coudes ou les bras poussent les manettes sur le côté jusqu'à hauteur d'épaules. Les élévations haltères et poulie restent libres.",
      "variations": [
          "machine lateral raise"
      ]
  },

  "élévation latérale landmine": {
      "name": "Élévation latérale landmine",
      "category": "Épaules",
      "primaryMuscles": [
          "Deltoïdes latéraux"
      ],
      "secondaryMuscles": [
          "Deltoïdes antérieurs"
      ],
      "equipment": "Landmine / Barre",
      "difficulty": 2,
      "isNew": true,
      "description": "Un bout de barre ancré au sol, l'autre main le lève sur le côté. Ce n'est pas le landmine press, qui pousse vers l'avant.",
      "variations": [
          "landmine lateral raise"
      ]
  },

  "élévations frontales barre": {
      "name": "Élévations frontales barre",
      "category": "Épaules",
      "primaryMuscles": [
          "Deltoïdes antérieurs"
      ],
      "secondaryMuscles": [],
      "equipment": "Barre",
      "difficulty": 2,
      "isNew": true,
      "description": "Barre devant les cuisses qui monte jusqu'aux épaules, bras presque tendus. La version au-dessus de la tête va plus haut. Les élévations frontales haltères existent déjà.",
      "variations": [
          "barbell front raise"
      ]
  },

  "élévations frontales poulie": {
      "name": "Élévations frontales poulie",
      "category": "Épaules",
      "primaryMuscles": [
          "Deltoïdes antérieurs"
      ],
      "secondaryMuscles": [],
      "equipment": "Poulie basse",
      "difficulty": 2,
      "isNew": true,
      "description": "Poulie basse, bras tendus devant, les mains montent à hauteur d'épaules. Trois fichiers, un seul geste.",
      "variations": [
          "cable front raise"
      ]
  },

  "élévations frontales élastique": {
      "name": "Élévations frontales élastique",
      "category": "Épaules",
      "primaryMuscles": [
          "Deltoïdes antérieurs"
      ],
      "secondaryMuscles": [],
      "equipment": "Élastique",
      "difficulty": 1,
      "isNew": true,
      "description": "Bande sous les pieds, bras tendus qui montent devant. Le Y raise élastique est un autre angle, déjà en fiche.",
      "variations": [
          "band front raise"
      ]
  },

  "rotation externe poulie": {
      "name": "Rotation externe à la poulie",
      "category": "Épaules",
      "primaryMuscles": [
          "Coiffe des rotateurs"
      ],
      "secondaryMuscles": [
          "Deltoïdes postérieurs"
      ],
      "equipment": "Poulie",
      "difficulty": 1,
      "isNew": true,
      "description": "Coude au corps, la poulie résiste pendant que l'avant-bras s'ouvre vers l'extérieur. La fiche Rotation externe élastique reste la bande : ce GIF poulie n'y est plus.",
      "variations": [
          "cable external rotation"
      ]
  },

  "rotation externe haltères": {
      "name": "Rotation externe haltères",
      "category": "Épaules",
      "primaryMuscles": [
          "Coiffe des rotateurs"
      ],
      "secondaryMuscles": [
          "Deltoïdes postérieurs"
      ],
      "equipment": "Haltère",
      "difficulty": 1,
      "isNew": true,
      "description": "Haltère léger, coude à 90°, l'avant-bras tourne vers l'extérieur. Allongé ou debout, c'est la même rotation. Pas un développé.",
      "variations": [
          "dumbbell external rotation"
      ]
  },

  "rotation interne poulie": {
      "name": "Rotation interne à la poulie",
      "category": "Épaules",
      "primaryMuscles": [
          "Coiffe des rotateurs"
      ],
      "secondaryMuscles": [
          "Grand pectoral"
      ],
      "equipment": "Poulie",
      "difficulty": 1,
      "isNew": true,
      "description": "Coude au corps, l'avant-bras se ferme vers le ventre contre la poulie. L'inverse de la rotation externe.",
      "variations": [
          "cable internal rotation"
      ]
  },

  "développé latéral haltère": {
      "name": "Développé latéral haltère",
      "category": "Épaules",
      "primaryMuscles": [
          "Deltoïdes"
      ],
      "secondaryMuscles": [
          "Triceps",
          "Obliques"
      ],
      "equipment": "Haltère",
      "difficulty": 2,
      "isNew": true,
      "description": "Un haltère à l'épaule, le buste s'incline sur le côté pendant que le bras se tend. Ce n'est pas un militaire de face.",
      "variations": [
          "dumbbell side press"
      ]
  },

  "around the world haltères": {
      "name": "Around the world haltères",
      "category": "Épaules",
      "primaryMuscles": [
          "Deltoïdes"
      ],
      "secondaryMuscles": [
          "Grand pectoral"
      ],
      "equipment": "Haltères",
      "difficulty": 2,
      "isNew": true,
      "description": "Bras presque tendus, les haltères font un cercle devant le corps, des hanches jusqu'au-dessus de la tête et retour. Ce n'est pas une élévation qui s'arrête aux épaules.",
      "variations": [
          "around the world"
      ]
  },

  "porté haltère bras tendu": {
      "name": "Porté haltère bras tendu",
      "category": "Épaules",
      "primaryMuscles": [
          "Deltoïdes"
      ],
      "secondaryMuscles": [
          "Trapèzes",
          "Gainage"
      ],
      "equipment": "Haltère",
      "difficulty": 2,
      "isNew": true,
      "description": "Marche avec un haltère bras tendu au-dessus de la tête. Le farmer walk garde les charges le long du corps, pas ici.",
      "variations": [
          "overhead carry",
          "waiter walk"
      ]
  },

  "cordes ondulatoires": {
      "name": "Cordes ondulatoires",
      "category": "Épaules",
      "primaryMuscles": [
          "Deltoïdes"
      ],
      "secondaryMuscles": [
          "Grand droit",
          "Avant-bras"
      ],
      "equipment": "Cordes ondulatoires",
      "difficulty": 2,
      "isNew": true,
      "description": "Les deux mains font des vagues avec les cordes, bras qui montent et descendent sans s'effondrer dans le dos. Travail de souffle autant que d'épaules.",
      "variations": [
          "battling ropes",
          "battle ropes"
      ]
  },

  "curl poignet poulie": {
      "name": "Curl poignet à la poulie",
      "category": "Avant-bras",
      "primaryMuscles": [
          "Fléchisseurs du poignet"
      ],
      "secondaryMuscles": [],
      "equipment": "Poulie basse",
      "difficulty": 1,
      "isNew": true,
      "description": "Avant-bras calés, la poulie résiste pendant que le poignet se ferme. Le wrist curl haltères ou barre existe déjà.",
      "variations": [
          "cable wrist curl"
      ]
  },

  "curl poignet inversé poulie": {
      "name": "Curl poignet inversé à la poulie",
      "category": "Avant-bras",
      "primaryMuscles": [
          "Extenseurs du poignet"
      ],
      "secondaryMuscles": [],
      "equipment": "Poulie basse",
      "difficulty": 1,
      "isNew": true,
      "description": "Poignet qui s'ouvre vers le dos de la main, contre la poulie. Le reverse wrist curl libre reste l'autre fiche.",
      "variations": [
          "cable reverse wrist curl"
      ]
  },

  "curl poignet élastique": {
      "name": "Curl poignet élastique",
      "category": "Avant-bras",
      "primaryMuscles": [
          "Fléchisseurs du poignet"
      ],
      "secondaryMuscles": [],
      "equipment": "Élastique",
      "difficulty": 1,
      "isNew": true,
      "description": "La bande résiste à la fermeture du poignet. Même geste que le wrist curl, autre outil.",
      "variations": [
          "band wrist curl"
      ]
  },

  "curl poignet inversé élastique": {
      "name": "Curl poignet inversé élastique",
      "category": "Avant-bras",
      "primaryMuscles": [
          "Extenseurs du poignet"
      ],
      "secondaryMuscles": [],
      "equipment": "Élastique",
      "difficulty": 1,
      "isNew": true,
      "description": "La bande résiste quand le dos de la main monte. Version élastique du reverse wrist curl.",
      "variations": [
          "band reverse wrist curl"
      ]
  },

  "curl des doigts": {
      "name": "Curl des doigts",
      "category": "Avant-bras",
      "primaryMuscles": [
          "Fléchisseurs des doigts"
      ],
      "secondaryMuscles": [
          "Avant-bras"
      ],
      "equipment": "Haltère / Barre",
      "difficulty": 1,
      "isNew": true,
      "description": "La charge roule jusqu'au bout des doigts, puis les doigts se referment. Le poignet bouge peu : ce n'est pas le wrist curl.",
      "variations": [
          "finger curls"
      ]
  },

  "gripper": {
      "name": "Gripper",
      "category": "Avant-bras",
      "primaryMuscles": [
          "Fléchisseurs des doigts"
      ],
      "secondaryMuscles": [],
      "equipment": "Gripper / Disque",
      "difficulty": 2,
      "isNew": true,
      "description": "La main se ferme contre un ressort ou une charge, sans bouger le coude. Le plate pinch tient des disques ouverts, ce n'est pas le même serrage.",
      "variations": [
          "hand gripper",
          "hand squeeze"
      ]
  },

  "rotation avant-bras": {
      "name": "Rotation de l’avant-bras",
      "category": "Avant-bras",
      "primaryMuscles": [
          "Rond pronateur",
          "Biceps"
      ],
      "secondaryMuscles": [
          "Brachio-radial"
      ],
      "equipment": "Haltère",
      "difficulty": 1,
      "isNew": true,
      "description": "Coude à 90°, l'haltère tourne paume vers le sol puis paume vers le ciel. Pronation et supination sont sur la même fiche.",
      "variations": [
          "dumbbell pronation",
          "dumbbell supination"
      ]
  },

  "wrist roller": {
      "name": "Wrist roller",
      "category": "Avant-bras",
      "primaryMuscles": [
          "Fléchisseurs du poignet",
          "Extenseurs du poignet"
      ],
      "secondaryMuscles": [],
      "equipment": "Wrist roller",
      "difficulty": 2,
      "isNew": true,
      "description": "Bras devant, les poignets enroulent la corde pour monter la charge, puis la déroulent. Les deux sens comptent.",
      "variations": [
          "wrist roller"
      ]
  },
  "glute bridge barre": {
      "name": "Glute bridge barre",
      "category": "Fessiers",
      "primaryMuscles": ["Fessiers"],
      "secondaryMuscles": ["Ischio-jambiers"],
      "equipment": "Barre",
      "difficulty": 2,
      "isNew": true,
      "description": "Allongé au sol, la barre sur les hanches. Tu pousses le bassin jusqu’à aligner genoux et épaules, sans décoller le haut du dos.",
      "variations": ["glute bridge barre"]
  },
  "glute bridge élastique": {
      "name": "Glute bridge élastique",
      "category": "Fessiers",
      "primaryMuscles": ["Fessiers"],
      "secondaryMuscles": ["Ischio-jambiers"],
      "equipment": "Élastique",
      "difficulty": 1,
      "isNew": true,
      "description": "Pont au sol, bande autour des hanches et ancrée au sol. Tu pousses le bassin vers le haut contre la bande, sans cambrer.",
      "variations": ["glute bridge élastique"]
  },
  "glute bridge barre pieds surélevés": {
      "name": "Glute bridge barre pieds surélevés",
      "category": "Fessiers",
      "primaryMuscles": ["Fessiers"],
      "secondaryMuscles": ["Ischio-jambiers"],
      "equipment": "Barre + Banc",
      "difficulty": 2,
      "isNew": true,
      "description": "Même pont qu’au sol, les deux pieds sur un banc et la barre sur les hanches. L’amplitude est plus grande, le bas du dos reste neutre.",
      "variations": ["glute bridge barre pieds surélevés"]
  },
  "hip thrust genoux élastique": {
      "name": "Hip thrust à genoux élastique",
      "category": "Fessiers",
      "primaryMuscles": ["Fessiers"],
      "secondaryMuscles": ["Ischio-jambiers"],
      "equipment": "Élastique",
      "difficulty": 2,
      "isNew": true,
      "description": "À genoux, bande derrière le bassin. Tu pousses les hanches vers l’avant jusqu’à tendre les hanches, sans cambrer.",
      "variations": ["hip thrust genoux élastique"]
  },
  "extension de hanche poulie": {
      "name": "Extension de hanche à la poulie",
      "category": "Fessiers",
      "primaryMuscles": ["Fessiers"],
      "secondaryMuscles": ["Ischio-jambiers"],
      "equipment": "Poulie basse",
      "difficulty": 1,
      "isNew": true,
      "description": "Debout, sangle à la cheville. La jambe part en arrière, genou presque tendu, le bassin ne tourne pas.",
      "variations": ["extension de hanche poulie"]
  },
  "extension de hanche élastique penché": {
      "name": "Extension de hanche élastique penché",
      "category": "Fessiers",
      "primaryMuscles": ["Fessiers"],
      "secondaryMuscles": ["Ischio-jambiers"],
      "equipment": "Élastique",
      "difficulty": 1,
      "isNew": true,
      "description": "Buste penché, bande au pied. Tu pousses le talon vers l’arrière sans ouvrir la hanche sur le côté.",
      "variations": ["extension de hanche élastique penché"]
  },
  "kickback fessier machine": {
      "name": "Kickback fessier machine",
      "category": "Fessiers",
      "primaryMuscles": ["Fessiers"],
      "secondaryMuscles": ["Ischio-jambiers"],
      "equipment": "Machine",
      "difficulty": 2,
      "isNew": true,
      "description": "Buste appuyé sur la machine, un genou pousse le levier vers l’arrière. Le bassin ne se soulève pas du coussin.",
      "variations": ["kickback fessier machine"]
  },
  "pull-through élastique": {
      "name": "Pull-through élastique",
      "category": "Fessiers",
      "primaryMuscles": ["Fessiers"],
      "secondaryMuscles": ["Ischio-jambiers","Lombaires"],
      "equipment": "Élastique",
      "difficulty": 2,
      "isNew": true,
      "description": "Bande entre les jambes, ancrée derrière. Tu charnières puis tu reviens debout en serrant les fessiers, bras tendus.",
      "variations": ["pull-through élastique"]
  },
  "pull-through poulie": {
      "name": "Pull-through à la poulie",
      "category": "Fessiers",
      "primaryMuscles": ["Fessiers"],
      "secondaryMuscles": ["Ischio-jambiers"],
      "equipment": "Poulie basse",
      "difficulty": 2,
      "isNew": true,
      "description": "Corde entre les jambes, poulie basse derrière. Même charnière que l’élastique, tu finis hanches ouvertes sans cambrer.",
      "variations": ["pull-through poulie"]
  },
  "reverse hyperextension": {
      "name": "Reverse hyperextension",
      "category": "Fessiers",
      "primaryMuscles": ["Fessiers"],
      "secondaryMuscles": ["Ischio-jambiers","Lombaires"],
      "equipment": "Machine / Banc",
      "difficulty": 2,
      "isNew": true,
      "description": "Buste calé, les jambes pendent. Tu les montes jusqu’à l’horizontale en menant avec les fessiers, sans balancer.",
      "variations": ["reverse hyperextension"]
  },
  "hack squat barre": {
      "name": "Hack squat barre",
      "category": "Quadriceps",
      "primaryMuscles": ["Quadriceps"],
      "secondaryMuscles": ["Fessiers"],
      "equipment": "Barre",
      "difficulty": 3,
      "isNew": true,
      "description": "Barre derrière les jambes, bras tendus. Tu descends en gardant le buste droit, les talons au sol.",
      "variations": ["hack squat barre"]
  },
  "squat jefferson": {
      "name": "Squat Jefferson",
      "category": "Quadriceps",
      "primaryMuscles": ["Quadriceps"],
      "secondaryMuscles": ["Fessiers","Adducteurs"],
      "equipment": "Barre",
      "difficulty": 3,
      "isNew": true,
      "description": "Barre entre les jambes, une main devant et une derrière. Tu plies en gardant le buste vertical.",
      "variations": ["squat jefferson"]
  },
  "squat sauté barre": {
      "name": "Squat sauté barre",
      "category": "Quadriceps",
      "primaryMuscles": ["Quadriceps"],
      "secondaryMuscles": ["Fessiers","Mollets"],
      "equipment": "Barre",
      "difficulty": 3,
      "isNew": true,
      "description": "Barre sur le dos. Tu descends en squat puis tu pousses jusqu’à décoller, et tu réceptionnes en pliant.",
      "variations": ["squat sauté barre"]
  },
  "squat sauté haltères": {
      "name": "Squat sauté haltères",
      "category": "Quadriceps",
      "primaryMuscles": ["Quadriceps"],
      "secondaryMuscles": ["Fessiers"],
      "equipment": "Haltères",
      "difficulty": 3,
      "isNew": true,
      "description": "Haltères le long du corps. Même saut qu’à la barre, tu restes gainé à la réception.",
      "variations": ["squat sauté haltères"]
  },
  "fente latérale barre": {
      "name": "Fente latérale barre",
      "category": "Quadriceps",
      "primaryMuscles": ["Quadriceps"],
      "secondaryMuscles": ["Adducteurs","Fessiers"],
      "equipment": "Barre",
      "difficulty": 3,
      "isNew": true,
      "description": "Barre sur le dos. Un pas sur le côté, tu plies cette jambe et tu gardes l’autre tendue, puis tu reviens.",
      "variations": ["fente latérale barre"]
  },
  "fente révérence": {
      "name": "Fente révérence",
      "category": "Quadriceps",
      "primaryMuscles": ["Quadriceps"],
      "secondaryMuscles": ["Fessiers","Adducteurs"],
      "equipment": "Poids du corps",
      "difficulty": 2,
      "isNew": true,
      "description": "Un pied croise derrière l’autre, tu descends jusqu’à ce que le genou arrière approche le sol. Le buste reste haut.",
      "variations": ["fente révérence"]
  },
  "squat élastique": {
      "name": "Squat élastique",
      "category": "Quadriceps",
      "primaryMuscles": ["Quadriceps"],
      "secondaryMuscles": ["Fessiers"],
      "equipment": "Élastique",
      "difficulty": 1,
      "isNew": true,
      "description": "Bande sous les pieds et sur les épaules, ou autour des genoux. Tu squattes en poussant les genoux vers l’extérieur.",
      "variations": ["squat élastique"]
  },
  "squat haltères": {
      "name": "Squat haltères",
      "category": "Quadriceps",
      "primaryMuscles": ["Quadriceps"],
      "secondaryMuscles": ["Fessiers"],
      "equipment": "Haltères",
      "difficulty": 2,
      "isNew": true,
    description:
      "Haltères le long du corps, pieds un peu plus larges que les hanches, pointes légèrement ouvertes. Tu descends en poussant les genoux dans l’axe des orteils, talons au sol, dos neutre, jusqu’à ce que les cuisses passent vers l’horizontale si la mobilité le permet, puis tu remontes en poussant le sol. Les haltères restent pendus, ils ne se balancent pas devant toi. Ce n’est pas le squat gobelet, où la charge est tenue contre la poitrine, ni le squat barre, ni le hack squat : ici la charge est libre, de chaque côté. Inspire en descendant, expire en poussant. 3 séries de 8 à 12, repos 2 min.",
      "variations": ["squat haltères"]
  },
  "front squat kettlebell": {
      "name": "Front squat kettlebell",
      "category": "Quadriceps",
      "primaryMuscles": ["Quadriceps"],
      "secondaryMuscles": ["Fessiers","Deltoïdes antérieurs"],
      "equipment": "Kettlebell",
      "difficulty": 3,
      "isNew": true,
      "description": "Kettlebells au creux des épaules, coudes hauts. Tu squattes sans laisser les coudes tomber.",
      "variations": ["front squat kettlebell"]
  },
  "front squat smith": {
      "name": "Front squat Smith",
      "category": "Quadriceps",
      "primaryMuscles": ["Quadriceps"],
      "secondaryMuscles": ["Fessiers"],
      "equipment": "Smith machine",
      "difficulty": 3,
      "isNew": true,
      "description": "Barre du Smith devant les épaules. Tu descends droit, coudes hauts, talons au sol.",
      "variations": ["front squat smith"]
  },
  "hack squat smith": {
      "name": "Hack squat Smith",
      "category": "Quadriceps",
      "primaryMuscles": ["Quadriceps"],
      "secondaryMuscles": ["Fessiers"],
      "equipment": "Smith machine",
      "difficulty": 3,
      "isNew": true,
      "description": "Barre du Smith derrière les jambes, comme un hack barre. Tu plies sans arrondir le dos.",
      "variations": ["hack squat smith"]
  },
  "squat ceinture": {
      "name": "Squat à la ceinture",
      "category": "Quadriceps",
      "primaryMuscles": ["Quadriceps"],
      "secondaryMuscles": ["Fessiers"],
      "equipment": "Ceinture de lest + Banc",
      "difficulty": 3,
      "isNew": true,
      "description": "Disque pendu à une ceinture, pieds sur un banc. Tu squattes entre les deux appuis, le buste reste vertical.",
      "variations": ["squat ceinture"]
  },
  "presse à cuisses horizontale": {
      "name": "Presse à cuisses horizontale",
      "category": "Quadriceps",
      "primaryMuscles": ["Quadriceps"],
      "secondaryMuscles": ["Fessiers"],
      "equipment": "Presse horizontale",
      "difficulty": 2,
      "isNew": true,
      "description": "Allongé, pieds sur le plateau devant toi. Tu plies jusqu’à ce que les genoux approchent la poitrine, sans décoller le bassin.",
      "variations": ["presse à cuisses horizontale"]
  },
  "retournement de pneu": {
      "name": "Retournement de pneu",
      "category": "Quadriceps",
      "primaryMuscles": ["Quadriceps"],
      "secondaryMuscles": ["Fessiers","Dorsaux","Épaules"],
      "equipment": "Pneu",
      "difficulty": 3,
      "isNew": true,
      "description": "Accroupi contre le pneu, tu pousses les jambes et tu guides le retournement avec les bras.",
      "variations": ["retournement de pneu"]
  },
  "soulevé de terre trap bar": {
      "name": "Soulevé de terre trap bar",
      "category": "Dorsaux",
      "primaryMuscles": ["Fessiers","Quadriceps"],
      "secondaryMuscles": ["Ischio-jambiers","Dorsaux"],
      "equipment": "Trap bar",
      "difficulty": 3,
      "isNew": true,
      "description": "Dans le cadre, poignées sur les côtés. Tu pousses le sol en gardant le dos neutre, puis tu reposes sans relâcher.",
      "variations": ["soulevé de terre trap bar"]
  },
  "soulevé de terre haltères": {
      "name": "Soulevé de terre haltères",
      "category": "Dorsaux",
      "primaryMuscles": ["Fessiers","Dorsaux"],
      "secondaryMuscles": ["Ischio-jambiers","Quadriceps"],
      "equipment": "Haltères",
      "difficulty": 2,
      "isNew": true,
      "description": "Haltères devant les cuisses. Tu charnières et tu plies les genoux pour les poser, puis tu remontes le buste.",
      "variations": ["soulevé de terre haltères"]
  },
  "soulevé de terre smith": {
      "name": "Soulevé de terre Smith",
      "category": "Dorsaux",
      "primaryMuscles": ["Fessiers","Dorsaux"],
      "secondaryMuscles": ["Ischio-jambiers"],
      "equipment": "Smith machine",
      "difficulty": 3,
      "isNew": true,
      "description": "Barre du Smith au sol. Même poussée qu’un soulevé, le rail guide la barre.",
      "variations": ["soulevé de terre smith"]
  },
  "soulevé de terre poulie": {
      "name": "Soulevé de terre à la poulie",
      "category": "Dorsaux",
      "primaryMuscles": ["Fessiers"],
      "secondaryMuscles": ["Ischio-jambiers","Dorsaux"],
      "equipment": "Poulie basse",
      "difficulty": 2,
      "isNew": true,
      "description": "Poulie basse entre les pieds. Tu te redresses en poussant les hanches, bras tendus.",
      "variations": ["soulevé de terre poulie"]
  },
  "soulevé de terre machine": {
      "name": "Soulevé de terre machine",
      "category": "Dorsaux",
      "primaryMuscles": ["Fessiers","Dorsaux"],
      "secondaryMuscles": ["Ischio-jambiers"],
      "equipment": "Machine",
      "difficulty": 2,
      "isNew": true,
      "description": "Levier de la machine. Tu pousses les hanches vers l’avant pour te redresser, dos calé.",
      "variations": ["soulevé de terre machine"]
  },
  "rack pull": {
      "name": "Rack pull",
      "category": "Dorsaux",
      "primaryMuscles": ["Dorsaux"],
      "secondaryMuscles": ["Trapèzes","Fessiers"],
      "equipment": "Barre + Supports",
      "difficulty": 3,
      "isNew": true,
      "description": "Barre sur des supports, au-dessus des genoux. Tu tires jusqu’à être debout, sans arrondir le dos.",
      "variations": ["rack pull"]
  },
  "soulevé latéral un bras": {
      "name": "Soulevé latéral un bras",
      "category": "Fessiers",
      "primaryMuscles": ["Fessiers"],
      "secondaryMuscles": ["Obliques","Dorsaux"],
      "equipment": "Barre",
      "difficulty": 3,
      "isNew": true,
      "description": "Barre sur le côté, une main. Tu te penches latéralement puis tu reviens debout sans tourner le buste.",
      "variations": ["soulevé latéral un bras"]
  },
  "soulevé de terre unilatéral barre": {
      "name": "Soulevé de terre unilatéral barre",
      "category": "Ischio-jambiers",
      "primaryMuscles": ["Ischio-jambiers","Fessiers"],
      "secondaryMuscles": ["Dorsaux"],
      "equipment": "Barre",
      "difficulty": 3,
      "isNew": true,
      "description": "Une jambe porte, l’autre recule. La barre descend le long de la cuisse, le dos reste neutre, puis tu reviens debout.",
      "variations": ["soulevé de terre unilatéral barre"]
  },
  "soulevé de terre unilatéral haltères": {
      "name": "Soulevé de terre unilatéral haltères",
      "category": "Ischio-jambiers",
      "primaryMuscles": ["Ischio-jambiers","Fessiers"],
      "secondaryMuscles": ["Dorsaux"],
      "equipment": "Haltères",
      "difficulty": 3,
      "isNew": true,
      "description": "Même charnière sur une jambe, haltères devant la cuisse. Le genou d’appui est légèrement fléchi.",
      "variations": ["soulevé de terre unilatéral haltères"]
  },
  "soulevé de terre jambes tendues élastique": {
      "name": "Soulevé de terre jambes tendues élastique",
      "category": "Ischio-jambiers",
      "primaryMuscles": ["Ischio-jambiers"],
      "secondaryMuscles": ["Fessiers","Dorsaux"],
      "equipment": "Élastique",
      "difficulty": 2,
      "isNew": true,
      "description": "Bande sous les pieds. Jambes presque tendues, tu charnières jusqu’à sentir les ischios, puis tu remontes.",
      "variations": ["soulevé de terre jambes tendues élastique"]
  },
  "good morning assis": {
      "name": "Good morning assis",
      "category": "Ischio-jambiers",
      "primaryMuscles": ["Ischio-jambiers"],
      "secondaryMuscles": ["Dorsaux","Fessiers"],
      "equipment": "Barre + Banc",
      "difficulty": 3,
      "isNew": true,
      "description": "Assis, barre sur le dos. Tu penches le buste vers l’avant sans arrondir, puis tu reviens.",
      "variations": ["good morning assis"]
  },
  "good morning assis machine": {
      "name": "Good morning assis machine",
      "category": "Ischio-jambiers",
      "primaryMuscles": ["Ischio-jambiers"],
      "secondaryMuscles": ["Dorsaux"],
      "equipment": "Machine",
      "difficulty": 2,
      "isNew": true,
      "description": "Assis dans la machine, le buste pousse le levier vers l’avant puis revient. Le bassin reste calé.",
      "variations": ["good morning assis machine"]
  },
  "good morning smith": {
      "name": "Good morning Smith",
      "category": "Ischio-jambiers",
      "primaryMuscles": ["Ischio-jambiers"],
      "secondaryMuscles": ["Dorsaux","Fessiers"],
      "equipment": "Smith machine",
      "difficulty": 3,
      "isNew": true,
      "description": "Barre du Smith sur le dos, genoux légèrement fléchis. Tu charnières et tu remontes sans verrouiller le dos.",
      "variations": ["good morning smith"]
  },
  "glute ham raise": {
      "name": "Glute ham raise",
      "category": "Ischio-jambiers",
      "primaryMuscles": ["Ischio-jambiers"],
      "secondaryMuscles": ["Fessiers","Mollets"],
      "equipment": "Machine GHR",
      "difficulty": 4,
      "isNew": true,
      "description": "Genoux sur le coussin, pieds calés. Tu descends le buste vers le sol puis tu remontes en tirant avec les ischios.",
      "variations": ["glute ham raise"]
  },
  "leg curl assis": {
      "name": "Leg curl assis",
      "category": "Ischio-jambiers",
      "primaryMuscles": ["Ischio-jambiers"],
      "secondaryMuscles": [],
      "equipment": "Machine leg curl assis",
      "difficulty": 2,
      "isNew": true,
      "description": "Assis, coussin sur les chevilles. Tu tires les talons sous le siège, sans décoller le bassin.",
      "variations": ["leg curl assis"]
  },
  "leg curl à genoux": {
      "name": "Leg curl à genoux",
      "category": "Ischio-jambiers",
      "primaryMuscles": ["Ischio-jambiers"],
      "secondaryMuscles": [],
      "equipment": "Machine",
      "difficulty": 2,
      "isNew": true,
      "description": "À genoux dans la machine, tu fléchis le genou contre le levier. La cuisse reste fixe.",
      "variations": ["leg curl à genoux"]
  },
  "leg curl haltère": {
      "name": "Leg curl haltère",
      "category": "Ischio-jambiers",
      "primaryMuscles": ["Ischio-jambiers"],
      "secondaryMuscles": [],
      "equipment": "Haltère + Banc",
      "difficulty": 2,
      "isNew": true,
      "description": "À plat ventre sur un banc, haltère entre les pieds. Tu plies les genoux pour monter la charge, hanches collées au banc.",
      "variations": ["leg curl haltère"]
  },
  "leg curl debout": {
      "name": "Leg curl debout",
      "category": "Ischio-jambiers",
      "primaryMuscles": ["Ischio-jambiers"],
      "secondaryMuscles": [],
      "equipment": "Machine",
      "difficulty": 2,
      "isNew": true,
      "description": "Debout sur une jambe, l’autre talon monte vers la fesse. Le genou pointe vers le sol, le bassin ne bascule pas.",
      "variations": ["leg curl debout"]
  },
  "leg curl glissière": {
      "name": "Leg curl glissière",
      "category": "Ischio-jambiers",
      "primaryMuscles": ["Ischio-jambiers"],
      "secondaryMuscles": ["Fessiers"],
      "equipment": "Glisseurs",
      "difficulty": 2,
      "isNew": true,
      "description": "Allongé, un talon sur un glisseur. Tu glisses le talon vers les fessiers en gardant le bassin haut, puis tu repars.",
      "variations": ["leg curl glissière"]
  },
  "leg curl swiss ball": {
      "name": "Leg curl swiss ball",
      "category": "Ischio-jambiers",
      "primaryMuscles": ["Ischio-jambiers"],
      "secondaryMuscles": ["Fessiers"],
      "equipment": "Swiss ball",
      "difficulty": 3,
      "isNew": true,
      "description": "Épaules au sol, talons sur le ballon. Tu ramènes le ballon vers les fessiers en gardant le bassin haut.",
      "variations": ["leg curl swiss ball"]
  },
  "pull-over barre": {
      "name": "Pull-over barre",
      "category": "Dorsaux",
      "primaryMuscles": ["Dorsaux"],
      "secondaryMuscles": ["Grand pectoral","Triceps"],
      "equipment": "Barre + Banc",
      "difficulty": 2,
      "isNew": true,
      "description": "Allongé sur le banc, barre au-dessus de la poitrine, bras presque tendus. Tu amènes la barre derrière la tête puis tu reviens.",
      "variations": ["pull-over barre"]
  },
  "pull-over machine": {
      "name": "Pull-over machine",
      "category": "Dorsaux",
      "primaryMuscles": ["Dorsaux"],
      "secondaryMuscles": ["Grand pectoral"],
      "equipment": "Machine",
      "difficulty": 2,
      "isNew": true,
      "description": "Assis, coudes ou mains sur le levier. Tu tires le levier de derrière la tête vers le bassin, sans décoller le dos.",
      "variations": ["pull-over machine"]
  },
  "tirage vertical supination": {
      "name": "Tirage vertical supination",
      "category": "Dorsaux",
      "primaryMuscles": ["Dorsaux"],
      "secondaryMuscles": ["Biceps"],
      "equipment": "Poulie haute",
      "difficulty": 2,
      "isNew": true,
      "description": "Prise supination, barre ramenée vers le haut de la poitrine. Tu tires les coudes vers le bas sans te pencher en arrière.",
      "variations": ["tirage vertical supination"]
  },
  "tirage vertical élastique": {
      "name": "Tirage vertical élastique",
      "category": "Dorsaux",
      "primaryMuscles": ["Dorsaux"],
      "secondaryMuscles": ["Biceps"],
      "equipment": "Élastique",
      "difficulty": 1,
      "isNew": true,
      "description": "Bande fixée en haut. Tu tires les mains vers la poitrine, coudes le long du corps.",
      "variations": ["tirage vertical élastique"]
  },
  "tirage unilatéral poulie haute": {
      "name": "Tirage unilatéral poulie haute",
      "category": "Dorsaux",
      "primaryMuscles": ["Dorsaux"],
      "secondaryMuscles": ["Biceps"],
      "equipment": "Poulie haute",
      "difficulty": 2,
      "isNew": true,
      "description": "Une main sur la poignée. Tu tires le coude vers la hanche, l’autre côté reste stable.",
      "variations": ["tirage unilatéral poulie haute"]
  },
  "tirage unilatéral machine": {
      "name": "Tirage unilatéral machine",
      "category": "Dorsaux",
      "primaryMuscles": ["Dorsaux"],
      "secondaryMuscles": ["Biceps"],
      "equipment": "Machine",
      "difficulty": 2,
      "isNew": true,
      "description": "Un bras sur le levier, prise large. Tu tires vers le bas sans tourner le buste.",
      "variations": ["tirage unilatéral machine"]
  },
  "tirage vertical machine": {
      "name": "Tirage vertical machine",
      "category": "Dorsaux",
      "primaryMuscles": ["Dorsaux"],
      "secondaryMuscles": ["Biceps"],
      "equipment": "Machine",
      "difficulty": 2,
      "isNew": true,
      "description": "Assis à la machine, tu tires le levier vers le haut de la poitrine. Les épaules descendent, le buste reste droit.",
      "variations": ["tirage vertical machine"]
  },
  "tirage vertical nuque": {
      "name": "Tirage vertical nuque",
      "category": "Dorsaux",
      "primaryMuscles": ["Dorsaux"],
      "secondaryMuscles": ["Biceps"],
      "equipment": "Poulie haute",
      "difficulty": 3,
      "isNew": true,
      "description": "Prise large, la barre passe derrière la tête vers la nuque. Amplitude courte, le cou ne pousse pas la barre.",
      "variations": ["tirage vertical nuque"]
  },
  "tractions nuque": {
      "name": "Tractions nuque",
      "category": "Dorsaux",
      "primaryMuscles": ["Dorsaux"],
      "secondaryMuscles": ["Biceps"],
      "equipment": "Barre de traction",
      "difficulty": 3,
      "isNew": true,
      "description": "Prise large, tu tires jusqu’à ce que la nuque approche la barre. Le menton ne va pas devant.",
      "variations": ["tractions nuque"]
  },
  "tractions prise neutre": {
      "name": "Tractions prise neutre",
      "category": "Dorsaux",
      "primaryMuscles": ["Dorsaux"],
      "secondaryMuscles": ["Biceps"],
      "equipment": "Barre de traction",
      "difficulty": 3,
      "isNew": true,
      "description": "Paumes face à face. Tu tires jusqu’à ce que le menton dépasse les poignées, sans balancer.",
      "variations": ["tractions prise neutre"]
  },
  "tractions prise mixte": {
      "name": "Tractions prise mixte",
      "category": "Dorsaux",
      "primaryMuscles": ["Dorsaux"],
      "secondaryMuscles": ["Biceps"],
      "equipment": "Barre de traction",
      "difficulty": 3,
      "isNew": true,
      "description": "Une main en pronation, l’autre en supination. Tu tires le menton au-dessus de la barre, puis tu changes de côté.",
      "variations": ["tractions prise mixte"]
  },
  "tractions sternum": {
      "name": "Tractions sternum",
      "category": "Dorsaux",
      "primaryMuscles": ["Dorsaux"],
      "secondaryMuscles": ["Biceps"],
      "equipment": "Barre de traction",
      "difficulty": 4,
      "isNew": true,
      "description": "Prise supination. Tu te penches en arrière et tu tires jusqu’à amener le sternum vers la barre.",
      "variations": ["tractions sternum"]
  },
  "tractions assistées": {
      "name": "Tractions assistées",
      "category": "Dorsaux",
      "primaryMuscles": ["Dorsaux"],
      "secondaryMuscles": ["Biceps"],
      "equipment": "Machine / Élastique / Banc",
      "difficulty": 2,
      "isNew": true,
      "description": "La machine, la bande ou un pied sur un banc enlève une partie du poids. Tu tires quand même les coudes vers le bas, sans te laisser porter.",
      "variations": ["tractions assistées"]
  },
  "muscle-up aux anneaux": {
      "name": "Muscle-up aux anneaux",
      "category": "Dorsaux",
      "primaryMuscles": ["Dorsaux"],
      "secondaryMuscles": ["Pectoraux","Triceps"],
      "equipment": "Anneaux",
      "difficulty": 4,
      "isNew": true,
      "description": "Suspendu aux anneaux. Tu tires puis tu passes les épaules au-dessus des mains pour finir bras tendus.",
      "variations": ["muscle-up aux anneaux"]
  },
  "rowing poulie haute": {
      "name": "Rowing poulie haute",
      "category": "Dorsaux",
      "primaryMuscles": ["Dorsaux"],
      "secondaryMuscles": ["Biceps","Deltoïdes postérieurs"],
      "equipment": "Poulie haute",
      "difficulty": 2,
      "isNew": true,
      "description": "Assis, poignée en V au-dessus de la tête. Tu tires les coudes vers les hanches, buste presque droit.",
      "variations": ["rowing poulie haute"]
  },
  "tirage rotatif poulie": {
      "name": "Tirage rotatif poulie",
      "category": "Dorsaux",
      "primaryMuscles": ["Dorsaux"],
      "secondaryMuscles": ["Obliques"],
      "equipment": "Poulie",
      "difficulty": 2,
      "isNew": true,
      "description": "En fente, tu tires la poignée vers la hanche en tournant le buste. Le bras se plie, le bassin ne s’effondre pas.",
      "variations": ["tirage rotatif poulie"]
  },
  "rowing kayak poulie": {
      "name": "Rowing kayak poulie",
      "category": "Dorsaux",
      "primaryMuscles": ["Dorsaux"],
      "secondaryMuscles": ["Obliques","Biceps"],
      "equipment": "Poulie",
      "difficulty": 2,
      "isNew": true,
      "description": "Deux poignées, tu tires en alternant comme une pagaie. Le buste tourne un peu, les épaules restent basses.",
      "variations": ["rowing kayak poulie"]
  }
,
  "pompes au mur": {
      "name": "Pompes au mur",
      "category": "Pectoraux",
      "primaryMuscles": ["Pectoraux"],
      "secondaryMuscles": ["Triceps","Deltoïdes antérieurs"],
      "equipment": "Mur",
      "difficulty": 1,
      "isNew": true,
      "description": "Debout face au mur, mains à hauteur d’épaules, un peu plus larges que le buste, corps aligné des talons à la tête. Tu plies les coudes et tu rapproches la poitrine du mur sans laisser les hanches partir en arrière, puis tu pousses jusqu’à tendre les bras. Inspire en t’approchant du mur, expire en poussant. L’erreur fréquente est de hausser les épaules vers les oreilles. 3 séries de 12 à 20, repos 45 s. Pour durcir, recule les pieds.",
      "variations": ["pompes au mur"]
  },
  "pompes shoulder tap": {
      "name": "Pompes shoulder tap",
      "category": "Pectoraux",
      "primaryMuscles": ["Pectoraux"],
      "secondaryMuscles": ["Triceps","Deltoïdes","Obliques"],
      "equipment": "Poids du corps",
      "difficulty": 2,
      "isNew": true,
      "description": "Position de pompe, mains sous les épaules. En haut, une main quitte le sol et touche l’épaule opposée, le bassin ne tourne pas, puis tu changes de main. Inspire en bas de la pompe, expire en touchant l’épaule. L’erreur est d’ouvrir les hanches pour garder l’équilibre. 3 séries de 8 touches de chaque côté, repos 60 s. Écarte un peu les pieds si le bassin bouge.",
      "variations": ["pompes shoulder tap"]
  },
  "pompes horloge": {
      "name": "Pompes horloge",
      "category": "Pectoraux",
      "primaryMuscles": ["Pectoraux"],
      "secondaryMuscles": ["Triceps","Deltoïdes","Obliques"],
      "equipment": "Poids du corps",
      "difficulty": 2,
      "isNew": true,
      "description": "En pompe, une main marche sur le côté, le corps suit, puis l’autre main rejoint, comme les chiffres d’une horloge autour d’un point. Tu fais une pompe à chaque poste, ou tu marches seulement en haut si la pompe à chaque pas est trop dure. Expire en poussant, inspire en déplaçant la main. Le bassin ne doit pas s’effondrer du côté de la main qui bouge. 3 tours lents, repos 75 s.",
      "variations": ["pompes horloge"]
  },
  "pompes superman": {
      "name": "Pompes superman",
      "category": "Pectoraux",
      "primaryMuscles": ["Pectoraux"],
      "secondaryMuscles": ["Triceps","Deltoïdes antérieurs"],
      "equipment": "Poids du corps",
      "difficulty": 3,
      "isNew": true,
      "description": "Pompe explosive : tu pousses assez fort pour décoller les mains et les pieds, bras tendus devant, puis tu réceptionnes les mains avant la poitrine, coudes souples. Expire au décollage. Tu ne laisses pas le ventre tomber à l’arrivée. 5 séries de 3 à 6, repos 90 s. Sol dégagé, pas de montre ni de sol glissant.",
      "variations": ["pompes superman"]
  },
  "pompes suspendues": {
      "name": "Pompes suspendues",
      "category": "Pectoraux",
      "primaryMuscles": ["Pectoraux"],
      "secondaryMuscles": ["Triceps","Deltoïdes","Dentelé"],
      "equipment": "Sangles de suspension",
      "difficulty": 3,
      "isNew": true,
      "description": "Mains dans les sangles, corps gainé, pieds au sol. Tu descends en laissant les mains partir un peu vers l’extérieur, coudes à environ 45°, puis tu pousses en ramenant les sangles stables. Expire en poussant. Les sangles qui tournent et le bassin qui tombe sont les deux erreurs. 3 séries de 8 à 12, repos 75 s. Plus le corps est horizontal, plus c’est dur.",
      "variations": ["pompes suspendues"]
  },
  "pompes surface instable": {
      "name": "Pompes sur surface instable",
      "category": "Pectoraux",
      "primaryMuscles": ["Pectoraux"],
      "secondaryMuscles": ["Triceps","Deltoïdes","Dentelé"],
      "equipment": "Bosu / Swiss ball / Médecine ball",
      "difficulty": 2,
      "isNew": true,
      "description": "Mains sur le Bosu (face plate ou dôme), le médecine ball ou le swiss ball, pieds au sol, corps aligné. Tu descends jusqu’à ce que la poitrine approche les mains, sans que le support parte sur le côté, puis tu pousses. Expire en haut. Ne verrouille pas les coudes en claquant. 3 séries de 8 à 12, repos 60 s.",
      "variations": ["pompes surface instable"]
  },
  "pompes horizontales": {
      "name": "Pompes horizontales",
      "category": "Pectoraux",
      "primaryMuscles": ["Pectoraux"],
      "secondaryMuscles": ["Deltoïdes antérieurs","Triceps","Dentelé"],
      "equipment": "Poids du corps",
      "difficulty": 4,
      "isNew": true,
      "description": "Mains au sol vers le bassin, doigts vers l’avant ou légèrement dehors, pieds décollés, corps parallèle au sol de la tête aux talons. Tu plies les coudes le long du corps sur une courte amplitude, puis tu pousses sans laisser les pieds redescendre ni le bassin monter. Expire en poussant, petites respirations. L’erreur est de cambrer ou de plier les hanches. 5 séries de 1 à 5, repos 2 à 3 min.",
      "variations": ["pompes horizontales"]
  },
  "tenue pectoraux bras écartés": {
      "name": "Tenue pectoraux bras écartés",
      "category": "Pectoraux",
      "primaryMuscles": ["Pectoraux"],
      "secondaryMuscles": ["Deltoïdes antérieurs"],
      "equipment": "Poids du corps",
      "difficulty": 2,
      "isNew": true,
      "description": "Allongé comme en bas de pompe, mains plus larges que les épaules, coudes ouverts, poitrine proche du sol, corps gainé. Tu tiens sans poser le buste et sans remonter les fesses. Respire par petites bouffées, sans bloquer. Les épaules ne doivent pas partir vers les oreilles. 3 fois 15 à 30 s, repos 45 s.",
      "variations": ["tenue pectoraux bras écartés"]
  },
  "écarté au sol barre": {
      "name": "Écarté au sol à la barre",
      "category": "Pectoraux",
      "primaryMuscles": ["Pectoraux"],
      "secondaryMuscles": ["Deltoïdes antérieurs"],
      "equipment": "Barre",
      "difficulty": 2,
      "isNew": true,
      "description": "En appui, mains sur une barre chargée posée au sol, barre perpendiculaire au corps ou saisie de façon à pouvoir rouler. Tu laisses la barre rouler vers l’avant pour ouvrir les bras, poitrine qui descend, puis tu la ramènes en serrant les pectoraux. Expire en ramenant. Ne laisse pas le bas du dos s’arrondir. 3 séries de 8 à 12, repos 60 s. Charges légères : la barre roule.",
      "variations": ["écarté au sol barre"]
  },
  "dips assistés": {
      "name": "Dips assistés",
      "category": "Pectoraux",
      "primaryMuscles": ["Pectoraux"],
      "secondaryMuscles": ["Triceps","Deltoïdes antérieurs"],
      "equipment": "Machine à dips / Genoux sur support",
      "difficulty": 2,
      "isNew": true,
      "description": "Genoux sur le coussin de la machine, mains sur les poignées, buste légèrement penché pour viser les pectoraux. Tu descends jusqu’à ce que les bras passent sous l’horizontale, sans hausser les épaules, puis tu pousses sans verrouiller en claquant. Inspire en descendant, expire en poussant. 3 séries de 8 à 12, repos 75 s. Moins d’assistance au fil des semaines.",
      "variations": ["dips assistés"]
  },
  "développé guillotine": {
      "name": "Développé guillotine",
      "category": "Pectoraux",
      "primaryMuscles": ["Pectoraux"],
      "secondaryMuscles": ["Deltoïdes antérieurs","Triceps"],
      "equipment": "Barre + Banc",
      "difficulty": 3,
      "isNew": true,
      "description": "Allongé, prise large, coudes très ouverts. La barre descend vers le cou, pas vers le bas des pectoraux, et remonte à la verticale. Inspire en descendant, expire en poussant. Pas de rebond sur la gorge, amplitude contrôlée, charge plus légère qu’au développé couché. 3 séries de 8 à 10, repos 2 min.",
      "variations": ["développé guillotine"]
  },
  "développé couché prise inversée": {
      "name": "Développé couché prise inversée",
      "category": "Pectoraux",
      "primaryMuscles": ["Pectoraux"],
      "secondaryMuscles": ["Triceps","Deltoïdes antérieurs"],
      "equipment": "Barre + Banc",
      "difficulty": 3,
      "isNew": true,
      "description": "Allongé, paumes vers le visage, pouces autour de la barre, prise large. La barre descend sur le bas des pectoraux, coudes plus près du corps qu’en prise pronation, puis tu pousses. Inspire en bas, expire en haut. La barre ne doit pas tourner dans les mains : prise fermée. 4 séries de 6 à 10, repos 2 min.",
      "variations": ["développé couché prise inversée"]
  },
  "développé haltères prise inversée": {
      "name": "Développé haltères prise inversée",
      "category": "Pectoraux",
      "primaryMuscles": ["Pectoraux"],
      "secondaryMuscles": ["Triceps","Biceps"],
      "equipment": "Haltères + Banc",
      "difficulty": 2,
      "isNew": true,
      "description": "Allongé, paumes vers le visage, haltères au-dessus du bas des pectoraux. Tu descends les coudes le long du corps puis tu pousses sans cogner les haltères. Expire en poussant. Les poignets restent neutres, pas cassés en arrière. 3 séries de 8 à 12, repos 90 s.",
      "variations": ["développé haltères prise inversée"]
  },
  "développé couché poulie": {
      "name": "Développé couché à la poulie",
      "category": "Pectoraux",
      "primaryMuscles": ["Pectoraux"],
      "secondaryMuscles": ["Triceps","Deltoïdes antérieurs"],
      "equipment": "Poulie + Banc",
      "difficulty": 2,
      "isNew": true,
      "description": "Banc entre deux poulies basses ou à hauteur du banc, poignées au-dessus de la poitrine. Tu pousses en ramenant les mains l’une vers l’autre en fin de geste, sans verrouiller les coudes. Expire en poussant. Les épaules restent sur le banc. 3 séries de 10 à 15, repos 75 s.",
      "variations": ["développé couché poulie"]
  },
  "développé incliné poulie": {
      "name": "Développé incliné à la poulie",
      "category": "Pectoraux",
      "primaryMuscles": ["Pectoraux"],
      "secondaryMuscles": ["Deltoïdes antérieurs","Triceps"],
      "equipment": "Poulie + Banc incliné",
      "difficulty": 2,
      "isNew": true,
      "description": "Banc incliné 30 à 45°, poulies basses, poignées au niveau du haut des pectoraux. Tu pousses vers le haut et légèrement vers l’intérieur. Expire en poussant. Le bas du dos ne se décolle pas pour tricher. 3 séries de 10 à 15, repos 75 s.",
      "variations": ["développé incliné poulie"]
  },
  "développé décliné poulie": {
      "name": "Développé décliné à la poulie",
      "category": "Pectoraux",
      "primaryMuscles": ["Pectoraux"],
      "secondaryMuscles": ["Triceps","Deltoïdes antérieurs"],
      "equipment": "Poulie + Banc décliné",
      "difficulty": 2,
      "isNew": true,
      "description": "Banc décliné, poulies hautes, poignées au-dessus du bas des pectoraux. Tu pousses vers les hanches, sans laisser les coudes s’ouvrir à 90°. Expire en poussant. Les pieds restent calés. 3 séries de 10 à 15, repos 75 s.",
      "variations": ["développé décliné poulie"]
  },
  "développé assis poulie": {
      "name": "Développé assis à la poulie",
      "category": "Pectoraux",
      "primaryMuscles": ["Pectoraux"],
      "secondaryMuscles": ["Triceps","Deltoïdes antérieurs"],
      "equipment": "Poulie",
      "difficulty": 2,
      "isNew": true,
      "description": "Assis, dossier stable, poignées à hauteur de poitrine, poulies derrière toi. Tu pousses devant sans cambrer, et tu laisses les mains revenir sans que les épaules partent en avant. Expire en poussant. 3 séries de 10 à 15, repos 75 s.",
      "variations": ["développé assis poulie"]
  },
  "développé couché élastique": {
      "name": "Développé couché élastique",
      "category": "Pectoraux",
      "primaryMuscles": ["Pectoraux"],
      "secondaryMuscles": ["Triceps","Deltoïdes antérieurs"],
      "equipment": "Élastique + Banc",
      "difficulty": 1,
      "isNew": true,
      "description": "Bande dans le dos ou sous le banc, mains à la poitrine. Tu pousses jusqu’à tendre les bras sans que la bande glisse, coudes à environ 45°. Expire en poussant. Ne laisse pas les poignets casser. 3 séries de 12 à 20, repos 45 s.",
      "variations": ["développé couché élastique"]
  },
  "développé assis élastique": {
      "name": "Développé assis élastique",
      "category": "Pectoraux",
      "primaryMuscles": ["Pectoraux"],
      "secondaryMuscles": ["Triceps","Deltoïdes antérieurs"],
      "equipment": "Élastique",
      "difficulty": 1,
      "isNew": true,
      "description": "Assis, bande derrière le dossier ou dans le dos, poignées à la poitrine. Tu pousses devant toi, omoplates qui restent basses, puis tu reviens en 2 secondes. Expire en poussant. 3 séries de 15 à 20, repos 45 s.",
      "variations": ["développé assis élastique"]
  },
  "développé rotatif élastique": {
      "name": "Développé rotatif élastique",
      "category": "Pectoraux",
      "primaryMuscles": ["Pectoraux"],
      "secondaryMuscles": ["Obliques","Deltoïdes antérieurs"],
      "equipment": "Élastique",
      "difficulty": 2,
      "isNew": true,
      "description": "Debout ou en fente, bande sous le pied ou derrière, une main à la poitrine. Tu pousses en tournant le buste vers le bras qui travaille, puis tu reviens sans laisser le bassin partir. Expire pendant la rotation. 3 séries de 10 de chaque côté, repos 45 s.",
      "variations": ["développé rotatif élastique"]
  },
  "développé décliné smith": {
      "name": "Développé décliné Smith",
      "category": "Pectoraux",
      "primaryMuscles": ["Pectoraux"],
      "secondaryMuscles": ["Triceps","Deltoïdes antérieurs"],
      "equipment": "Smith machine + Banc décliné",
      "difficulty": 2,
      "isNew": true,
      "description": "Banc décliné sous le Smith, barre au-dessus du bas des pectoraux. Tu déverrouilles, tu descends sur le bas du pec, coudes à 45°, puis tu pousses dans le rail. Inspire en descendant, expire en poussant. Les fesses restent sur le banc. 4 séries de 6 à 10, repos 2 min.",
      "variations": ["développé décliné smith"]
  },
  "développé incliné smith": {
      "name": "Développé incliné Smith",
      "category": "Pectoraux",
      "primaryMuscles": ["Pectoraux"],
      "secondaryMuscles": ["Deltoïdes antérieurs","Triceps"],
      "equipment": "Smith machine + Banc incliné",
      "difficulty": 2,
      "isNew": true,
      "description": "Banc à 30°, barre du Smith au-dessus du haut des pectoraux. Tu descends vers les clavicules sans poser la barre sur le cou, puis tu pousses dans l’axe du rail. Expire en poussant. Le bas du dos reste collé. 4 séries de 6 à 10, repos 2 min.",
      "variations": ["développé incliné smith"]
  },
  "écarté décliné haltères": {
      "name": "Écarté décliné haltères",
      "category": "Pectoraux",
      "primaryMuscles": ["Pectoraux"],
      "secondaryMuscles": ["Deltoïdes antérieurs"],
      "equipment": "Haltères + Banc décliné",
      "difficulty": 2,
      "isNew": true,
      "description": "Banc décliné, haltères au-dessus du bas des pectoraux, coudes légèrement fléchis. Tu ouvres jusqu’à sentir l’étirement, sans passer sous la ligne du banc, puis tu serrres en gardant le même angle de coude. Expire en serrant. Charges légères. 3 séries de 10 à 15, repos 60 s.",
      "variations": ["écarté décliné haltères"]
  },
  "écarté unilatéral poulie": {
      "name": "Écarté unilatéral à la poulie",
      "category": "Pectoraux",
      "primaryMuscles": ["Pectoraux"],
      "secondaryMuscles": ["Deltoïdes antérieurs"],
      "equipment": "Poulie",
      "difficulty": 2,
      "isNew": true,
      "description": "Une main sur la poignée, pied opposé devant, buste stable. Le bras s’ouvre sur le côté, coude souple, puis tu ramènes la main devant la poitrine sans tourner le buste. Expire en ramenant. L’épaule ne monte pas. 3 séries de 12 à 15 de chaque côté, repos 45 s.",
      "variations": ["écarté unilatéral poulie"]
  },
  "floor press kettlebell": {
      "name": "Floor press kettlebell",
      "category": "Pectoraux",
      "primaryMuscles": ["Pectoraux"],
      "secondaryMuscles": ["Triceps","Deltoïdes antérieurs"],
      "equipment": "Kettlebell",
      "difficulty": 2,
      "isNew": true,
      "description": "Allongé au sol, genoux fléchis, kettlebell tenue au-dessus de l’épaule, poignet droit. Tu plies le coude jusqu’à ce qu’il touche le sol, tu t’arrêtes, puis tu pousses. Expire en poussant. Le coude au sol coupe l’amplitude : c’est voulu, pas un développé incomplet par erreur. 3 séries de 8 à 12 de chaque côté, repos 75 s.",
      "variations": ["floor press kettlebell"]
  },
  "svend press": {
      "name": "Svend press",
      "category": "Pectoraux",
      "primaryMuscles": ["Pectoraux"],
      "secondaryMuscles": ["Deltoïdes antérieurs"],
      "equipment": "Disque",
      "difficulty": 1,
      "isNew": true,
      "description": "Debout, un disque serré entre les paumes à hauteur de poitrine, coudes souples. Tu pousses le disque devant toi en continuant de le comprimer, puis tu reviens sans relâcher la pression des mains. Expire en avançant. Disque léger : 5 à 10 kg. 3 séries de 12 à 20, repos 45 s.",
      "variations": ["svend press"]
  },
  "chest press décliné machine": {
      "name": "Chest press décliné machine",
      "category": "Pectoraux",
      "primaryMuscles": ["Pectoraux"],
      "secondaryMuscles": ["Triceps","Deltoïdes antérieurs"],
      "equipment": "Machine chest press",
      "difficulty": 2,
      "isNew": true,
      "description": "Assis, dossier réglé pour que les poignées partent du bas des pectoraux. Tu pousses sans décoller le dos, et tu reviens jusqu’à un étirement supportable. Expire en poussant. Ne verrouille pas les coudes. 3 séries de 10 à 15, repos 75 s.",
      "variations": ["chest press décliné machine"]
  },
  "chest press incliné machine": {
      "name": "Chest press incliné machine",
      "category": "Pectoraux",
      "primaryMuscles": ["Pectoraux"],
      "secondaryMuscles": ["Deltoïdes antérieurs","Triceps"],
      "equipment": "Machine chest press",
      "difficulty": 2,
      "isNew": true,
      "description": "Dossier incliné, poignées au niveau du haut des pectoraux. Tu pousses dans l’axe de la machine, omoplates basses, sans décoller le bassin. Expire en poussant. 3 séries de 10 à 15, repos 75 s.",
      "variations": ["chest press incliné machine"]
  },
  "chest press debout machine": {
      "name": "Chest press debout machine",
      "category": "Pectoraux",
      "primaryMuscles": ["Pectoraux"],
      "secondaryMuscles": ["Triceps","Deltoïdes antérieurs"],
      "equipment": "Machine",
      "difficulty": 2,
      "isNew": true,
      "description": "Debout, dos contre le coussin, poignées à la poitrine. Tu pousses devant toi sans cambrer et sans monter sur les pointes. Expire en poussant. Les pieds restent à plat. 3 séries de 10 à 15, repos 75 s.",
      "variations": ["chest press debout machine"]
  },
  "fentes bulgares barre": {
      "name": "Fentes bulgares barre",
      "category": "Quadriceps",
      "primaryMuscles": ["Quadriceps"],
      "secondaryMuscles": ["Fessiers"],
      "equipment": "Barre + Banc",
      "difficulty": 3,
      "isNew": true,
      "description": "Barre sur le haut du dos, cou-de-pied arrière sur le banc, pied avant assez loin pour que le genou avant reste au-dessus de la cheville. Tu descends jusqu’à ce que la cuisse avant approche l’horizontale, buste légèrement penché, puis tu pousses dans le talon avant. Inspire en descendant, expire en remontant. Le genou avant ne rentre pas vers l’intérieur. 4 séries de 6 à 10 de chaque jambe, repos 2 min.",
      "variations": ["fentes bulgares barre"]
  },
  "fentes bulgares smith": {
      "name": "Fentes bulgares Smith",
      "category": "Quadriceps",
      "primaryMuscles": ["Quadriceps"],
      "secondaryMuscles": ["Fessiers"],
      "equipment": "Smith machine + Banc",
      "difficulty": 3,
      "isNew": true,
      "description": "Barre du Smith sur le dos, pied arrière sur le banc, pied avant dans l’axe du rail. Tu descends droit, le genou avant suit les orteils, puis tu pousses. Expire en remontant. Le rail t’empêche d’avancer : place le banc pour que le tibia avant reste presque vertical en bas. 3 séries de 8 à 10 de chaque jambe, repos 90 s.",
      "variations": ["fentes bulgares smith"]
  },
  "fentes bulgares élastique": {
      "name": "Fentes bulgares élastique",
      "category": "Quadriceps",
      "primaryMuscles": ["Quadriceps"],
      "secondaryMuscles": ["Fessiers"],
      "equipment": "Élastique + Banc",
      "difficulty": 2,
      "isNew": true,
      "description": "Bande sous le pied avant et sur les épaules, ou tenue dans la main opposée, pied arrière sur le banc. Tu descends et tu pousses contre la bande, genou avant stable. Expire en remontant. La bande ne doit pas tirer le genou vers l’intérieur. 3 séries de 10 à 12 de chaque jambe, repos 60 s.",
      "variations": ["fentes bulgares élastique"]
  },
  "fente bulgare suspendue": {
      "name": "Fente bulgare suspendue",
      "category": "Quadriceps",
      "primaryMuscles": ["Quadriceps"],
      "secondaryMuscles": ["Fessiers"],
      "equipment": "Sangles de suspension",
      "difficulty": 3,
      "isNew": true,
      "description": "Pied arrière dans la sangle, pied avant au sol, genou arrière fléchi. Tu descends en laissant la sangle rester sous le pied, le genou avant suit les orteils, puis tu pousses dans le talon avant. Expire en remontant. Ne laisse pas le pied arrière pousser la sangle en avant. 3 séries de 8 à 12 de chaque jambe, repos 75 s.",
      "variations": ["fente bulgare suspendue"]
  },
  "leg extension élastique": {
      "name": "Leg extension élastique",
      "category": "Quadriceps",
      "primaryMuscles": ["Quadriceps"],
      "secondaryMuscles": [],
      "equipment": "Élastique + Banc",
      "difficulty": 1,
      "isNew": true,
      "description": "Assis au bord du banc, bande autour de la cheville et ancrée derrière le pied, sous le banc. Tu tends le genou jusqu’à aligner la jambe, sans décoller la cuisse du banc, puis tu reviens en 2 secondes. Expire en tendant. Le bassin ne bascule pas en arrière. 3 séries de 12 à 20 de chaque jambe, repos 45 s.",
      "variations": ["leg extension élastique"]
  },
  "squat overhead": {
      "name": "Squat overhead",
      "category": "Quadriceps",
      "primaryMuscles": ["Quadriceps"],
      "secondaryMuscles": ["Fessiers","Deltoïdes","Lombaires"],
      "equipment": "Barre",
      "difficulty": 3,
      "isNew": true,
      "description": "Prise large, barre au-dessus de la tête, bras tendus, épaules actives. Tu t’assois entre les hanches en gardant la barre à la verticale des pieds, genoux dans l’axe des orteils, puis tu remontes sans laisser la barre avancer. Inspire en descendant, expire en passant le point dur. Si la barre part devant, la charge est trop lourde ou la prise trop serrée. 5 séries de 3 à 6, repos 2 min.",
      "variations": ["squat overhead"]
  },
  "squat à genoux barre": {
      "name": "Squat à genoux barre",
      "category": "Quadriceps",
      "primaryMuscles": ["Quadriceps"],
      "secondaryMuscles": ["Fessiers"],
      "equipment": "Barre + Banc",
      "difficulty": 2,
      "isNew": true,
      "description": "À genoux sur un banc, barre sur le haut du dos, buste droit. Tu t’assois vers les talons en gardant les hanches au-dessus des genoux, puis tu reviens sans cambrer. Expire en remontant. Amplitude courte : les genoux portent le poids, donc charge légère. 3 séries de 8 à 12, repos 75 s.",
      "variations": ["squat à genoux barre"]
  },
  "squat bosu": {
      "name": "Squat sur Bosu",
      "category": "Quadriceps",
      "primaryMuscles": ["Quadriceps"],
      "secondaryMuscles": ["Fessiers","Mollets"],
      "equipment": "Bosu",
      "difficulty": 2,
      "isNew": true,
      "description": "Pieds sur le dôme ou sur la face plate, écartés largeur de bassin. Tu t’assois en arrière, genoux dans l’axe des orteils, bras devant pour l’équilibre, puis tu remontes sans verrouiller les genoux. Inspire en descendant, expire en remontant. Ne laisse pas les genoux rentrer quand le Bosu bouge. 3 séries de 10 à 15, repos 60 s.",
      "variations": ["squat bosu"]
  }
,
  "hyperextension": {
      "name": "Hyperextension",
      "category": "Dorsaux",
      "primaryMuscles": ["Érecteurs du rachis"],
      "secondaryMuscles": ["Fessiers","Ischio-jambiers"],
      "equipment": "Banc à 45°",
      "difficulty": 2,
      "isNew": true,
      "description": "Chevilles calées, hanches au bord du coussin, mains aux tempes. Tu plies les hanches jusqu’à ce que le buste descende, dos qui reste long, puis tu remontes jusqu’à aligner épaules, bassin et genoux, sans cambrer au-delà. Inspire en descendant, expire en remontant. Ne tire pas avec la nuque et ne plie pas les genoux pour tricher. 3 séries de 10 à 15, repos 60 s. Un disque contre la poitrine seulement quand 15 répétitions restent propres.",
      "variations": ["hyperextension"]
  },
  "extension lombaire assise": {
      "name": "Extension lombaire assise",
      "category": "Dorsaux",
      "primaryMuscles": ["Érecteurs du rachis"],
      "secondaryMuscles": ["Fessiers"],
      "equipment": "Machine",
      "difficulty": 2,
      "isNew": true,
      "description": "Assis, bassin calé, coussin sur le haut du dos. Tu laisses le buste partir vers l’avant sans arrondir en boule, puis tu pousses le coussin jusqu’à te redresser, fesses qui restent sur le siège. Expire en poussant. N’écrase pas la butée en cambrant. 3 séries de 12 à 15, repos 60 s.",
      "variations": ["extension lombaire assise"]
  },
  "shrugs élastique": {
      "name": "Shrugs élastique",
      "category": "Épaules",
      "primaryMuscles": ["Trapèzes"],
      "secondaryMuscles": ["Élévateur de la scapula"],
      "equipment": "Élastique",
      "difficulty": 1,
      "isNew": true,
      "description": "Debout sur la bande, poignées dans les mains, bras tendus. Tu hausses les épaules vers les oreilles, tu marques une seconde, puis tu redescends plus bas que le départ. Expire en montant. Ne plie pas les coudes : ce n’est pas un shrug-row. 3 séries de 15 à 20, repos 45 s.",
      "variations": ["shrugs élastique"]
  },
  "shrugs poulie": {
      "name": "Shrugs à la poulie",
      "category": "Épaules",
      "primaryMuscles": ["Trapèzes"],
      "secondaryMuscles": ["Élévateur de la scapula"],
      "equipment": "Poulie basse",
      "difficulty": 2,
      "isNew": true,
      "description": "Face à la poulie basse, barre ou poignée devant les cuisses, bras tendus. Tu hausses les épaules droit vers le haut, sans rouler en arrière, puis tu redescends jusqu’à sentir les trapèzes s’allonger. Expire en montant. 3 séries de 12 à 15, repos 60 s.",
      "variations": ["shrugs poulie"]
  },
  "shrugs machine": {
      "name": "Shrugs machine",
      "category": "Épaules",
      "primaryMuscles": ["Trapèzes"],
      "secondaryMuscles": ["Élévateur de la scapula"],
      "equipment": "Machine à shrugs",
      "difficulty": 2,
      "isNew": true,
      "description": "Épaules sous les coussins ou mains sur les poignées, bras relâchés. Tu pousses les épaules vers le haut sans plier les coudes, tu tiens une seconde, puis tu redescends. Expire en montant. Le cou reste long. 3 séries de 10 à 15, repos 60 s.",
      "variations": ["shrugs machine"]
  },
  "shrugs smith": {
      "name": "Shrugs Smith",
      "category": "Épaules",
      "primaryMuscles": ["Trapèzes"],
      "secondaryMuscles": ["Élévateur de la scapula"],
      "equipment": "Smith machine",
      "difficulty": 2,
      "isNew": true,
      "description": "Barre du Smith dans les mains, bras tendus, pieds sous la barre. Tu hausses les épaules dans l’axe du rail, sans tirer avec les biceps, puis tu redescends. Expire en montant. 3 séries de 10 à 12, repos 75 s.",
      "variations": ["shrugs smith"]
  },
  "dépression scapulaire au banc": {
      "name": "Dépression scapulaire au banc",
      "category": "Épaules",
      "primaryMuscles": ["Trapèzes inférieurs"],
      "secondaryMuscles": ["Dorsaux"],
      "equipment": "Banc",
      "difficulty": 1,
      "isNew": true,
      "description": "Assis au bord du banc, mains derrière les hanches, bras tendus. Tu laisses les épaules monter vers les oreilles, puis tu pousses le banc pour les abaisser, coudes qui restent tendus, fesses qui peuvent à peine décoller. Expire en poussant vers le bas. Ne plie pas les coudes : sinon c’est un dips triceps. 3 séries de 10 à 15, repos 45 s.",
      "variations": ["dépression scapulaire au banc"]
  },
  "extension nuque barre": {
      "name": "Extension nuque barre",
      "category": "Triceps",
      "primaryMuscles": ["Triceps"],
      "secondaryMuscles": ["Deltoïdes"],
      "equipment": "Barre",
      "difficulty": 3,
      "isNew": true,
      "description": "Debout ou assis, prise serrée, barre au-dessus de la tête, bras près des oreilles. Tu plies les coudes pour amener la barre derrière la tête, bras qui restent verticaux, puis tu tends. Expire en tendant. Les coudes ne s’ouvrent pas sur les côtés. 3 séries de 8 à 12, repos 75 s.",
      "variations": ["extension nuque barre"]
  },
  "extension nuque barre ez": {
      "name": "Extension nuque barre EZ",
      "category": "Triceps",
      "primaryMuscles": ["Triceps"],
      "secondaryMuscles": ["Deltoïdes"],
      "equipment": "Barre EZ",
      "difficulty": 2,
      "isNew": true,
      "description": "Barre EZ, prise sur la partie intérieure, barre au-dessus de la tête. Tu plies uniquement les coudes, la barre descend derrière la tête, puis tu tends sans cambrer. Expire en tendant. 3 séries de 8 à 12, repos 75 s.",
      "variations": ["extension nuque barre ez"]
  },
  "extension nuque poulie": {
      "name": "Extension nuque à la poulie",
      "category": "Triceps",
      "primaryMuscles": ["Triceps"],
      "secondaryMuscles": ["Deltoïdes"],
      "equipment": "Poulie haute + Corde",
      "difficulty": 2,
      "isNew": true,
      "description": "Dos à la poulie haute, corde derrière la tête, coudes près des tempes. Tu tends les coudes vers le plafond en écartant un peu les bouts de corde, puis tu reviens sans laisser les coudes avancer. Expire en tendant. 3 séries de 10 à 15, repos 60 s.",
      "variations": ["extension nuque poulie"]
  },
  "extension allongée poulie": {
      "name": "Extension allongée à la poulie",
      "category": "Triceps",
      "primaryMuscles": ["Triceps"],
      "secondaryMuscles": [],
      "equipment": "Poulie + Banc ou sol",
      "difficulty": 2,
      "isNew": true,
      "description": "Allongé, poulie basse derrière la tête, barre ou corde au-dessus du front, bras presque verticaux. Tu plies les coudes pour amener les mains vers le front, puis tu tends. Expire en tendant. Les épaules restent fixes. 3 séries de 10 à 15, repos 60 s.",
      "variations": ["extension allongée poulie"]
  },
  "extension triceps élastique": {
      "name": "Extension triceps élastique",
      "category": "Triceps",
      "primaryMuscles": ["Triceps"],
      "secondaryMuscles": [],
      "equipment": "Élastique",
      "difficulty": 1,
      "isNew": true,
      "description": "Bande sous le pied ou derrière le dos, main au-dessus de la tête ou le long du corps selon l’ancrage. Tu tends le coude sans laisser le bras s’écarter, puis tu reviens en 2 secondes. Expire en tendant. 3 séries de 12 à 20 de chaque bras, repos 45 s.",
      "variations": ["extension triceps élastique"]
  },
  "extension triceps au sol": {
      "name": "Extension triceps au sol",
      "category": "Triceps",
      "primaryMuscles": ["Triceps"],
      "secondaryMuscles": ["Deltoïdes","Pectoraux"],
      "equipment": "Poids du corps",
      "difficulty": 2,
      "isNew": true,
      "description": "À genoux, mains au sol sous le front, coudes pliés, corps aligné des genoux à la tête. Tu tends les coudes pour pousser les hanches vers l’arrière et le buste vers le haut, puis tu reviens en pliant uniquement les coudes. Expire en poussant. Les coudes ne s’ouvrent pas. 3 séries de 8 à 12, repos 60 s.",
      "variations": ["extension triceps au sol"]
  },
  "extension triceps machine": {
      "name": "Extension triceps machine",
      "category": "Triceps",
      "primaryMuscles": ["Triceps"],
      "secondaryMuscles": [],
      "equipment": "Machine",
      "difficulty": 2,
      "isNew": true,
      "description": "Assis ou debout selon la machine, coudes calés, mains sur la poignée. Tu tends les coudes sans décoller les bras du coussin, puis tu reviens jusqu’à un étirement supportable. Expire en tendant. 3 séries de 12 à 15, repos 60 s.",
      "variations": ["extension triceps machine"]
  },
  "dips machine": {
      "name": "Dips machine",
      "category": "Triceps",
      "primaryMuscles": ["Triceps"],
      "secondaryMuscles": ["Pectoraux","Deltoïdes antérieurs"],
      "equipment": "Machine à dips",
      "difficulty": 2,
      "isNew": true,
      "description": "Assis, mains sur les poignées, dos contre le dossier. Tu pousses vers le bas jusqu’à tendre les coudes, sans hausser les épaules, puis tu reviens sans que les coudes passent trop derrière le buste. Expire en poussant. Buste droit pour les triceps, un peu penché si les pectoraux prennent le dessus. 3 séries de 10 à 15, repos 75 s.",
      "variations": ["dips machine"]
  },
  "pin press": {
      "name": "Pin press",
      "category": "Triceps",
      "primaryMuscles": ["Triceps"],
      "secondaryMuscles": ["Pectoraux","Deltoïdes antérieurs"],
      "equipment": "Barre + Supports",
      "difficulty": 3,
      "isNew": true,
      "description": "Allongé, barre posée sur les supports à mi-course, là où le développé cale souvent. Tu pousses jusqu’à tendre les bras, tu reposes la barre sur les tiges, tu relâches une seconde, puis tu recommences. Expire en poussant. Pas de rebond sur les supports. 5 séries de 3 à 6, repos 2 min.",
      "variations": ["pin press"]
  },
  "montée avant-bras": {
      "name": "Montée des avant-bras",
      "category": "Triceps",
      "primaryMuscles": ["Triceps"],
      "secondaryMuscles": ["Deltoïdes","Pectoraux"],
      "equipment": "Poids du corps",
      "difficulty": 2,
      "isNew": true,
      "description": "En appui sur les avant-bras, corps gainé, coudes sous les épaules. Tu poses une main au sol, tu tends ce coude, puis l’autre, jusqu’à être en pompe, et tu redescends un bras après l’autre. Expire en montant. Le bassin ne tourne pas. 3 séries de 6 à 10 montées, repos 60 s.",
      "variations": ["montée avant-bras"]
  },
  "dips triceps un bras": {
      "name": "Dips triceps un bras",
      "category": "Triceps",
      "primaryMuscles": ["Triceps"],
      "secondaryMuscles": ["Deltoïdes","Obliques"],
      "equipment": "Banc",
      "difficulty": 3,
      "isNew": true,
      "description": "Dos au banc, une main sur le bord, l’autre bras tendu devant, jambes tendues ou un pied au sol. Tu plies le coude le long du corps jusqu’à ce que l’épaule descende, puis tu pousses. Expire en poussant. Le buste ne tourne pas autour de la main. 3 séries de 4 à 8 de chaque bras, repos 90 s.",
      "variations": ["dips triceps un bras"]
  },
  "stalder press": {
      "name": "Presse stalder",
      "category": "Épaules",
      "primaryMuscles": ["Deltoïdes"],
      "secondaryMuscles": ["Triceps","Abdominaux"],
      "equipment": "Poids du corps",
      "difficulty": 4,
      "isNew": true,
      "description": "En appui sur les mains, hanches fléchies, jambes écartées ou serrées devant le buste. Tu pousses le sol et tu amènes le bassin au-dessus des épaules jusqu’à l’équilibre, bras tendus, sans donner d’élan avec les jambes. Expire pendant la poussée. Les coudes restent proches des oreilles. 5 séries de 1 à 5, repos 2 à 3 min.",
      "variations": ["stalder press"]
  },
  "floor press barre": {
      "name": "Floor press barre",
      "category": "Pectoraux",
      "primaryMuscles": ["Pectoraux"],
      "secondaryMuscles": ["Triceps","Deltoïdes antérieurs"],
      "equipment": "Barre",
      "difficulty": 2,
      "isNew": true,
      "description": "Allongé au sol, une main sur la barre, coude qui descend jusqu’à toucher le sol. Tu t’arrêtes, puis tu pousses sans décoller l’épaule. Expire en poussant. Le coude au sol coupe l’amplitude : c’est le but. 3 séries de 6 à 10 de chaque bras, repos 90 s. L’autre main peut stabiliser la barre.",
      "variations": ["floor press barre"]
  },
  "rowing pendlay": {
      "name": "Rowing Pendlay",
      "category": "Dorsaux",
      "primaryMuscles": ["Dorsaux"],
      "secondaryMuscles": ["Trapèzes","Biceps"],
      "equipment": "Barre",
      "difficulty": 3,
      "isNew": true,
      "description": "Buste parallèle au sol, barre au sol à chaque répétition, genoux fléchis, dos neutre. Tu tires la barre vers le bas des pectoraux, coudes le long du corps, tu reposes la barre, tu relâches, puis tu retires. Expire en tirant. Le buste ne se redresse pas pour aider. 4 séries de 5 à 8, repos 2 min.",
      "variations": ["rowing pendlay"]
  },
  "rowing smith": {
      "name": "Rowing Smith",
      "category": "Dorsaux",
      "primaryMuscles": ["Dorsaux"],
      "secondaryMuscles": ["Biceps","Trapèzes"],
      "equipment": "Smith machine",
      "difficulty": 2,
      "isNew": true,
      "description": "Buste penché, barre du Smith dans les mains, genoux souples. Tu tires vers le nombril dans l’axe du rail, coudes vers l’arrière, puis tu redescends sans arrondir. Expire en tirant. 3 séries de 8 à 12, repos 90 s.",
      "variations": ["rowing smith"]
  },
  "rowing kettlebell": {
      "name": "Rowing kettlebell",
      "category": "Dorsaux",
      "primaryMuscles": ["Dorsaux"],
      "secondaryMuscles": ["Biceps","Trapèzes"],
      "equipment": "Kettlebell",
      "difficulty": 2,
      "isNew": true,
      "description": "Un genou et une main sur un banc, ou buste penché debout, kettlebell dans l’autre main. Tu tires le coude vers la hanche jusqu’à ce que le poids approche les côtes, puis tu redescends bras tendu. Expire en tirant. Ne tourne pas le buste. 3 séries de 8 à 12 de chaque côté, repos 75 s.",
      "variations": ["rowing kettlebell"]
  },
  "renegade row": {
      "name": "Renegade row",
      "category": "Dorsaux",
      "primaryMuscles": ["Dorsaux"],
      "secondaryMuscles": ["Triceps","Obliques"],
      "equipment": "Kettlebells",
      "difficulty": 3,
      "isNew": true,
      "description": "En pompe, une main sur chaque kettlebell. Tu tires un poids vers la hanche pendant que l’autre bras reste tendu, le bassin ne tourne pas, puis tu changes. Expire en tirant. Pieds écartés si le corps pivote. 3 séries de 6 à 10 de chaque côté, repos 75 s.",
      "variations": ["renegade row"]
  },
  "tirage horizontal élastique": {
      "name": "Tirage horizontal élastique",
      "category": "Dorsaux",
      "primaryMuscles": ["Dorsaux"],
      "secondaryMuscles": ["Biceps","Trapèzes"],
      "equipment": "Élastique",
      "difficulty": 1,
      "isNew": true,
      "description": "Assis, jambes tendues, bande autour des pieds, dos droit. Tu tires les mains vers les côtes, coudes le long du corps, omoplates qui se rapprochent, puis tu reviens bras tendus. Expire en tirant. Ne te penche pas en arrière. 3 séries de 12 à 20, repos 45 s.",
      "variations": ["tirage horizontal élastique"]
  },
  "rowing suspendu": {
      "name": "Rowing suspendu",
      "category": "Dorsaux",
      "primaryMuscles": ["Dorsaux"],
      "secondaryMuscles": ["Biceps"],
      "equipment": "Sangles de suspension",
      "difficulty": 2,
      "isNew": true,
      "description": "Mains dans les sangles, corps gainé, talons au sol. Tu tires la poitrine vers les mains, coudes le long du corps, puis tu redescends bras tendus. Expire en tirant. Plus le corps est horizontal, plus c’est dur. Le bassin ne tombe pas. 3 séries de 8 à 12, repos 75 s.",
      "variations": ["rowing suspendu"]
  },
  "montée de corde": {
      "name": "Montée de corde",
      "category": "Dorsaux",
      "primaryMuscles": ["Dorsaux"],
      "secondaryMuscles": ["Biceps","Avant-bras"],
      "equipment": "Corde",
      "difficulty": 4,
      "isNew": true,
      "description": "Corde entre les jambes ou pieds en clé, une main au-dessus de l’autre. Tu tires, tu bloques avec les pieds, tu remontes les mains, sans te balancer. Expire à chaque tirage. Les épaules restent basses. Descends en contrôle, mains qui ne glissent pas. 5 montées courtes ou 3 montées complètes, repos 2 min.",
      "variations": ["montée de corde"]
  },
  "rowing haut machine": {
      "name": "Rowing haut machine",
      "category": "Dorsaux",
      "primaryMuscles": ["Dorsaux"],
      "secondaryMuscles": ["Trapèzes","Deltoïdes postérieurs"],
      "equipment": "Machine",
      "difficulty": 2,
      "isNew": true,
      "description": "Assis, poignées qui partent d’en haut ou devant les épaules. Tu tires vers le bas du sternum, coudes ouverts à environ 45°, omoplates qui descendent, puis tu reviens sans hausser les épaules. Expire en tirant. 3 séries de 10 à 15, repos 75 s.",
      "variations": ["rowing haut machine"]
  },
  "rowing serviette": {
      "name": "Rowing serviette",
      "category": "Dorsaux",
      "primaryMuscles": ["Dorsaux"],
      "secondaryMuscles": ["Biceps"],
      "equipment": "Serviette",
      "difficulty": 2,
      "isNew": true,
      "description": "Serviette passée autour d’un point solide à hauteur de taille ou de poitrine, buste penché, bras tendus. Tu tires les mains vers les côtes, coudes en arrière, puis tu reviens. Expire en tirant. Le point d’ancrage ne doit pas céder. 3 séries de 10 à 15, repos 60 s.",
      "variations": ["rowing serviette"]
  },
  "slam médecine ball": {
      "name": "Slam médecine ball",
      "category": "Abdominaux",
      "primaryMuscles": ["Grand droit"],
      "secondaryMuscles": ["Dorsaux","Épaules"],
      "equipment": "Médecine ball",
      "difficulty": 2,
      "isNew": true,
      "description": "Debout, balle au-dessus de la tête, bras tendus, pieds écartés. Tu abats la balle au sol devant les pieds en pliant les hanches et les genoux, puis tu la ramasses. Expire en frappant. Le dos ne s’arrondit pas pour aller chercher la balle. 5 séries de 8 à 12, repos 45 s.",
      "variations": ["slam médecine ball"]
  },
  "marche sur tapis": {
    name: "Marche sur tapis",
    category: "Activités Complémentaires",
    primaryMuscles: ["Quadriceps", "Fessiers", "Mollets"],
    secondaryMuscles: ["Tibial antérieur", "Core"],
    equipment: "Tapis de course",
    difficulty: 1,
    isNew: true,
    description: "Marche sur tapis, buste droit, bras qui balancent, un pied toujours au sol. Tu règles une pente légère si tu veux plus de fessiers, sans te tenir à la console. Ce n’est pas la marche dehors : le tapis impose le rythme. 10 à 30 minutes, allure où tu peux encore parler.",
    variations: ["marche tapis", "treadmill walk", "marche sur tapis roulant"]
  },
  "course sur tapis": {
    name: "Course sur tapis",
    category: "Activités Complémentaires",
    primaryMuscles: ["Quadriceps", "Fessiers", "Mollets", "Ischio-jambiers"],
    secondaryMuscles: ["Core"],
    equipment: "Tapis de course",
    difficulty: 2,
    isNew: true,
    description: "Course sur tapis, pose du pied sous le bassin, pas devant. Tu montes la vitesse par paliers, et tu te tiens à la console seulement pour monter ou descendre. Les courses dehors restent leurs fiches. 8 à 25 minutes selon l’allure, ou 6 à 10 fois 1 minute vite / 1 minute facile.",
    variations: ["course tapis", "treadmill run", "course sur tapis roulant"]
  },
  "élévation frontale au disque": {
    name: "Élévation frontale au disque",
    category: "Épaules",
    primaryMuscles: ["Deltoïdes antérieurs"],
    secondaryMuscles: ["Trapèzes supérieurs", "Grand pectoral"],
    equipment: "Disque",
    difficulty: 1,
    isNew: true,
    description: "Debout, disque tenu à deux mains devant les cuisses, bras presque tendus. Tu le montes jusqu’à hauteur d’épaules, tu marques une seconde, puis tu redescends sans le laisser tomber. Les coudes ne se plient pas en curl. L’élévation haltères reste sa fiche. 3 séries de 10 à 15, repos 60 s.",
    variations: ["plate front raise", "élévation disque", "front raise plate"]
  },
  "élévation au disque jusqu'au-dessus de la tête": {
    name: "Élévation au disque jusqu'au-dessus de la tête",
    category: "Épaules",
    primaryMuscles: ["Deltoïdes antérieurs", "Deltoïdes moyens"],
    secondaryMuscles: ["Trapèzes", "Triceps", "Grand droit"],
    equipment: "Disque",
    difficulty: 2,
    isNew: true,
    description: "Debout, disque tenu à deux mains contre les cuisses. Tu le montes bras tendus jusqu’au-dessus de la tête, tu le redescends le long du corps sans cambrer. Ce n’est pas l’élévation frontale, qui s’arrête aux épaules. 3 séries de 8 à 12, repos 75 s.",
    variations: ["plate overhead raise", "élévation disque overhead"]
  },
  "kickback fessier à la poulie": {
    name: "Kickback fessier à la poulie",
    category: "Fessiers",
    primaryMuscles: ["Grand fessier"],
    secondaryMuscles: ["Ischio-jambiers", "Moyen fessier"],
    equipment: "Poulie basse",
    difficulty: 1,
    isNew: true,
    description: "Chevillère à la poulie basse, buste légèrement penché, mains sur le bâti. Tu pousses le talon vers l’arrière, jambe presque tendue, sans ouvrir la hanche sur le côté et sans cambrer. Le retour est lent. Le kickback machine reste sa fiche. 3 séries de 12 à 15 par jambe, repos 45 s.",
    variations: ["cable glute kickback", "kickback fessier poulie", "extension hanche poulie cheville"]
  },
  "abduction hanche debout poulie": {
    name: "Abduction de hanche debout à la poulie",
    category: "Fessiers",
    primaryMuscles: ["Moyen fessier"],
    secondaryMuscles: ["Petit fessier", "Tenseur du fascia lata"],
    equipment: "Poulie basse",
    difficulty: 1,
    isNew: true,
    description: "Debout, une main sur le bâti, chevillère à la poulie basse du côté de la jambe qui travaille. Tu écartes la jambe sur le côté, pied dans l’axe, sans pencher le buste et sans laisser le bassin partir. Retour contrôlé. L’abduction élastique et la jambe tendue sans câble restent leurs fiches. 3 séries de 12 à 15 par jambe, repos 45 s.",
    variations: ["cable standing hip abduction", "abduction hanche poulie", "abduction debout câble"]
  },
  "fentes barre": {
    name: "Fentes barre",
    category: "Quadriceps",
    primaryMuscles: ["Quadriceps"],
    secondaryMuscles: ["Fessiers", "Ischio-jambiers"],
    equipment: "Barre",
    difficulty: 2,
    isNew: true,
    description: "Barre calée sur le haut du dos, pieds largeur de hanches. Tu fais un pas en arrière, le genou arrière descend vers le sol sans le poser, le genou avant reste au-dessus de la cheville, puis tu pousses dans le talon avant pour revenir. Le buste reste presque droit, la barre ne roule pas sur la nuque. Ce n’est pas la fente haltères, ni la fente bulgare : aucun banc, les deux pieds reviennent côte à côte. Inspire en descendant, expire en poussant. 3 séries de 8 à 12 de chaque jambe, repos 90 s.",
    variations: ["fente barre", "barbell lunge", "fente arrière barre", "reverse lunge barre"]
  },
  "pistol squat haltère": {
    name: "Pistol squat haltère",
    category: "Quadriceps",
    primaryMuscles: ["Quadriceps", "Fessiers"],
    secondaryMuscles: ["Ischio-jambiers", "Adducteurs", "Mollets"],
    equipment: "Haltère",
    difficulty: 4,
    isNew: true,
    description: "Debout sur une jambe, l’autre tendue devant toi, un haltère tenu devant la poitrine ou bras tendu comme contrepoids. Tu descends en contrôlant, le genou de la jambe d’appui suit les orteils, le talon reste au sol aussi longtemps que la cheville le permet, puis tu remontes sans poser l’autre pied et sans t’écrouler en bas. L’haltère aide l’équilibre : il n’est pas là pour être jeté vers l’avant. Si la descente complète n’est pas propre, tu t’arrêtes plus haut, ou une main effleure un support. Le pistol au poids du corps reste sa fiche, sans charge. La presse unilatérale est une machine, pas ce geste. Inspire en descendant, expire en poussant. 3 séries de 6 à 10 de chaque jambe, repos 2 min.",
    variations: ["pistol haltère", "dumbbell pistol squat", "squat une jambe haltère"]
  },

  "curl marteau incliné": {
    name: "Curl marteau incliné",
    category: "Biceps",
    primaryMuscles: ["Brachial", "Brachio-radial"],
    secondaryMuscles: ["Biceps brachial"],
    equipment: "Haltères + Banc incliné",
    difficulty: 2,
    isNew: true,
    description: "Dos calé sur un banc incliné, un haltère dans chaque main, prise neutre : pouces vers le plafond, paumes face à face. Les bras partent derrière le buste, comme au curl incliné, mais les poignets ne tournent pas. Tu fléchis les coudes pour amener les haltères vers les épaules, sans décoller le dos, sans balancer le buste et sans transformer le geste en curl supiné en haut. La prise neutre laisse plus de place au brachial et au brachio-radial. Le biceps reste dans la flexion, il n’en est plus le seul moteur. La charge est en général plus légère que sur le curl incliné en supination, et plus lourde que sur le spider. Ce n’est pas le curl marteau debout, ni le curl marteau au pupitre, ni le curl marteau croisé, ni le curl marteau à la poulie. Inspire en descendant, expire en montant. 3 séries de 8 à 12.",
    variations: ["incline hammer curl", "curl marteau sur banc incliné", "dumbbell incline hammer curl"]
  },

  "crunch au mur": {
    name: "Crunch au mur",
    category: "Abdominaux",
    primaryMuscles: ["Grand droit de l'abdomen"],
    secondaryMuscles: ["Obliques"],
    equipment: "Poids du corps",
    difficulty: 1,
    isNew: true,
    description: "Allongé sur le dos, pieds à plat contre le mur, genoux fléchis. Tu décolles les épaules et la tête en enroulant le buste, le bas du dos reste au sol, puis tu redescends sans laisser retomber la nuque. Les pieds restent collés au mur : ce n’est pas le crunch au sol, ni le crunch à la poulie, ni le crunch machine, ni le swiss ball. Pas d’élan des bras. Expire en montant, inspire en redescendant. 3 séries de 12 à 20.",
    variations: ["wall crunch", "crunch pieds au mur"]
  },

  "crunch au mur haltère": {
    name: "Crunch au mur haltère",
    category: "Abdominaux",
    primaryMuscles: ["Grand droit de l'abdomen"],
    secondaryMuscles: ["Obliques"],
    equipment: "Haltère",
    difficulty: 2,
    isNew: true,
    description: "Même crunch au mur, avec un haltère. Tu le tiens contre la poitrine, ou bras tendus au-dessus du torse : les bras tendus allongent le levier et rendent la même charge plus dure. Les pieds restent au mur, le bassin ne se soulève pas pour aider. Ce n’est pas le crunch au mur sans charge, ni la variante où les pieds quittent le mur. Expire en montant. 3 séries de 12 à 20.",
    variations: ["wall crunch haltère", "weighted wall crunch"]
  },

  "hip thrust pieds au mur": {
    name: "Hip thrust pieds au mur",
    category: "Fessiers",
    primaryMuscles: ["Fessiers"],
    secondaryMuscles: ["Ischio-jambiers", "Grand droit de l'abdomen"],
    equipment: "Haltère",
    difficulty: 2,
    isNew: true,
    description: "Allongé au sol, pieds à plat contre le mur, genoux fléchis, un haltère posé sur le bassin et tenu à deux mains. Tu pousses les hanches vers le plafond jusqu’à aligner genoux, bassin et épaules, sans creuser les lombaires, puis tu redescends sans poser le bassin d’un coup. Le mur remplace le banc : les épaules restent au sol. Ce n’est pas le hip thrust barre, dos sur un banc et pieds au sol, ni le pont fessier pieds au sol, ni le hip thrust unilatéral. Expire en montant. 3 séries de 12 à 20.",
    variations: ["wall hip thrust", "hip thrust pieds contre le mur", "dumbbell wall hip thrust"]
  },

  "crunch au mur pieds décollés": {
    name: "Crunch au mur pieds décollés",
    category: "Abdominaux",
    primaryMuscles: ["Grand droit de l'abdomen"],
    secondaryMuscles: ["Fléchisseurs de hanche", "Obliques"],
    equipment: "Haltère",
    difficulty: 2,
    isNew: true,
    description: "Tu pars du crunch au mur, haltère contre la poitrine ou au-dessus du torse, puis les pieds quittent le mur à chaque répétition. Le bassin doit rester contrôlé : les jambes ne se balancent pas pour monter le buste. C’est plus exigeant que le crunch au mur pieds collés, avec ou sans haltère. Ce n’est pas un relevé de jambes, le mouvement reste une flexion du tronc. Expire en montant. 3 séries de 10 à 20.",
    variations: ["wall crunch pieds décollés", "wall crunch feet up"]
  },

  "curl pupitre unilatéral": {
    name: "Curl pupitre unilatéral",
    category: "Biceps",
    primaryMuscles: ["Biceps brachial"],
    secondaryMuscles: ["Brachial"],
    equipment: "Haltère + Banc pupitre",
    difficulty: 2,
    isNew: true,
    description: "Un bras à la fois, aisselle calée sur le pupitre, haltère en supination. Le bras reste sur le coussin pendant toute la flexion : tu tends presque complètement en bas, tu montes sans décoller le coude, puis tu changes de côté. Le buste ne se rejette pas en arrière. Le curl pupitre à deux bras, à la barre, à la machine ou à la poulie reste sa fiche. Le curl marteau pupitre est la prise neutre. Inspire en descendant, expire en montant. 3 séries de 8 à 12 de chaque bras.",
    variations: ["single arm preacher curl", "curl pupitre un bras", "unilateral preacher curl"]
  },

  "curl assis dos calé": {
    name: "Curl assis dos calé",
    category: "Biceps",
    primaryMuscles: ["Biceps brachial"],
    secondaryMuscles: ["Brachial"],
    equipment: "Haltères + Banc",
    difficulty: 2,
    isNew: true,
    description: "Assis, dos et épaules collés au dossier, un haltère dans chaque main. Tu fléchis les coudes en supination sans décoller le dos et sans donner d’élan au buste. Le dossier joue le même rôle qu’un mur : il empêche de tricher. Ce n’est pas le curl debout, ni le curl incliné (les bras partent derrière le buste), ni le curl pupitre (le bras est posé devant). La charge reste plus légère que sur un curl où le torse peut aider. Inspire en descendant, expire en montant. 3 séries de 8 à 12.",
    variations: ["seated dumbbell curl", "curl haltères assis", "curl dos calé"]
  },

  "hip thrust smith": {
    name: "Hip thrust Smith",
    category: "Fessiers",
    primaryMuscles: ["Fessiers"],
    secondaryMuscles: ["Ischio-jambiers"],
    equipment: "Smith machine + Banc",
    difficulty: 2,
    isNew: true,
    description: "Dos sur un banc, barre du Smith sur le bassin, pieds au sol. Tu pousses les hanches jusqu’à aligner genoux, bassin et épaules, sans creuser les lombaires, puis tu redescends le long du rail. Le guidage laisse monter la charge plus simplement qu’avec une barre libre. Ce n’est pas le hip thrust barre libre, ni le hip thrust pieds au mur, ni le pont fessier au sol. Menton rentré, genoux dans l’axe des pieds. Expire en montant. 3 séries de 8 à 12.",
    variations: ["smith hip thrust", "thrust fessier smith"]
  },

  "mollets smith sur step": {
    name: "Mollets Smith sur step",
    category: "Mollets",
    primaryMuscles: ["Gastrocnémiens"],
    secondaryMuscles: ["Soléaires"],
    equipment: "Smith machine + Step",
    difficulty: 2,
    isNew: true,
    description: "Debout dans le Smith, avant des pieds sur un step, barre sur les épaules. Tu laisses les talons descendre sous le step, puis tu montes sur la pointe sans plier les genoux. Le step sert l’amplitude, le rail guide la barre. La charge utile est souvent plus basse que sur le hip thrust ou les bulgares de la même séance. Ce n’est pas les mollets inversés Smith, où les orteils tirent vers le tibia, ni les mollets assis, ni les mollets haltères. Expire en montant. 3 séries de 10 à 15.",
    variations: ["smith calf raise", "mollets debout smith sur step"]
  }

};

Object.assign(exerciseDatabase, EXERCISE_DATABASE_ENRICHMENT);

function labelsForExerciseKey(key, exercise) {
  const labels = [String(key || '').toLowerCase().trim()];
  const name = String(exercise?.name || '')
    .toLowerCase()
    .trim();
  if (name && name !== labels[0]) labels.push(name);
  return labels.filter(Boolean);
}

/** Clé banque : égalité, puis plus long préfixe (évite « développé » → développé couché). */
export function resolveExerciseDatabaseKey(exerciseName) {
  const raw = String(exerciseName || '')
    .toLowerCase()
    .trim();
  if (!raw) return null;

  if (exerciseDatabase[raw]) return raw;

  for (const [key, exercise] of Object.entries(exerciseDatabase)) {
    if (String(exercise.name || '').toLowerCase().trim() === raw) return key;
  }

  for (const [key, exercise] of Object.entries(exerciseDatabase)) {
    const vars = Array.isArray(exercise.variations) ? exercise.variations : [];
    for (const variation of vars) {
      const v = String(variation || '')
        .toLowerCase()
        .trim();
      if (v && v === raw) return key;
    }
  }

  let prefixKey = null;
  let prefixLen = 0;
  for (const [key, exercise] of Object.entries(exerciseDatabase)) {
    for (const label of labelsForExerciseKey(key, exercise)) {
      if (label.length <= prefixLen) continue;
      if (raw === label || raw.startsWith(`${label} `)) {
        prefixKey = key;
        prefixLen = label.length;
      }
    }
  }
  if (prefixKey) return prefixKey;

  let bestKey = null;
  let bestScore = 0;
  for (const [key, exercise] of Object.entries(exerciseDatabase)) {
    const vars = Array.isArray(exercise.variations) ? exercise.variations : [];
    for (const variation of vars) {
      const v = String(variation || '')
        .toLowerCase()
        .trim();
      if (!v) continue;
      if (v === raw) return key;
      if (v.length < 12) continue;
      if (raw.includes(v) || v.includes(raw)) {
        if (v.length > bestScore) {
          bestScore = v.length;
          bestKey = key;
        }
      }
    }
  }
  return bestKey;
}

export function findExerciseInDatabase(exerciseName) {
  const key = resolveExerciseDatabaseKey(exerciseName);
  return key ? exerciseDatabase[key] : null;
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