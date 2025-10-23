// Base de données complète des exercices avec définitions techniques
// Chaque exercice contient : nom, catégorie, muscles primaires/secondaires, équipement, description et variations

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
  "tractions": {
    name: "Tractions",
    category: "Dorsaux",
    primaryMuscles: ["Grand dorsal", "Rhomboïdes"],
    secondaryMuscles: ["Biceps", "Trapèzes"],
    equipment: "Barre de traction",
    description: "Exercice roi pour le développement du dos",
    variations: ["pull-ups", "traction", "chin-ups"]
  },
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
    variations: ["decline push-ups", "pompes pieds hauts"]
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

  // ABDOMINAUX & CORE AVANCÉS
  "relevés de genoux": {
    name: "Relevés de genoux",
    category: "Abdominaux",
    primaryMuscles: ["Grand droit de l'abdomen", "Fléchisseurs de hanche"],
    secondaryMuscles: ["Obliques"],
    equipment: "Barre/Parallèles",
    description: "Exercice suspendu ciblant les abdominaux inférieurs",
    variations: ["knee raises", "relevés genoux barre", "hanging knee raises"]
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
    variations: ["rope pushdown", "extension corde"]
  },
  "extension poulie pronation": {
    name: "Extension poulie pronation",
    category: "Triceps",
    primaryMuscles: ["Triceps"],
    secondaryMuscles: [],
    equipment: "Poulie haute",
    description: "Extension triceps prise pronation ciblant le vaste latéral",
    variations: ["pronated pushdown", "extension pronation"]
  },
  "extension poulie supination": {
    name: "Extension poulie supination",
    category: "Triceps",
    primaryMuscles: ["Triceps"],
    secondaryMuscles: [],
    equipment: "Poulie haute",
    description: "Extension triceps prise supination pour la longue portion",
    variations: ["supinated pushdown", "extension supination"]
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

  // EXERCICES SALLE SPÉCIALISÉS
  "développé incliné haltères": {
    name: "Développé incliné haltères",
    category: "Pectoraux",
    primaryMuscles: ["Pectoraux supérieurs"],
    secondaryMuscles: ["Triceps", "Deltoïdes antérieurs"],
    equipment: "Haltères + Banc incliné",
    description: "Développé incliné avec haltères pour amplitude maximale",
    variations: ["incline dumbbell press", "di haltères"]
  },
  "développé haltères plat": {
    name: "Développé haltères plat",
    category: "Pectoraux",
    primaryMuscles: ["Pectoraux"],
    secondaryMuscles: ["Triceps", "Deltoïdes antérieurs"],
    equipment: "Haltères + Banc",
    description: "Développé couché avec haltères",
    variations: ["flat dumbbell press", "dc haltères"]
  },
  "écarté poulie": {
    name: "Écarté à la poulie",
    category: "Pectoraux",
    primaryMuscles: ["Pectoraux"],
    secondaryMuscles: [],
    equipment: "Poulie vis-à-vis",
    description: "Écarté à la poulie pour tension constante",
    variations: ["cable fly", "écarté câble"]
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
  "relevés de genoux à la barre": {
    name: "Relevés de genoux à la barre",
    category: "Abdominaux",
    primaryMuscles: ["Grand droit de l'abdomen", "Fléchisseurs de hanche"],
    secondaryMuscles: ["Obliques"],
    equipment: "Barre de traction",
    description: "Exercice de suspension qui cible les abdominaux inférieurs en relevant les genoux vers la poitrine",
    variations: ["relevés genoux barre", "knee raises bar", "hanging knee raises"]
  },
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
  "extension à la poulie corde": {
    name: "Extension à la poulie corde",
    category: "Triceps",
    primaryMuscles: ["Triceps brachial"],
    secondaryMuscles: [],
    equipment: "Poulie haute + Corde",
    description: "Extension des triceps à la poulie avec corde pour un travail complet",
    variations: ["rope pushdown", "extension corde", "tricep rope extension"]
  },
  "extension unilatérale à la poulie": {
    name: "Extension unilatérale à la poulie",
    category: "Triceps",
    primaryMuscles: ["Triceps brachial"],
    secondaryMuscles: [],
    equipment: "Poulie haute",
    description: "Extension des triceps un bras à la fois pour corriger les déséquilibres",
    variations: ["single arm pushdown", "extension 1 bras poulie", "unilateral tricep extension"]
  },
  "écarté à la poulie vis-à-vis": {
    name: "Écarté à la poulie vis-à-vis",
    category: "Pectoraux",
    primaryMuscles: ["Pectoraux"],
    secondaryMuscles: ["Deltoïdes antérieurs"],
    equipment: "Poulie vis-à-vis",
    description: "Exercice d'isolation des pectoraux avec tension constante",
    variations: ["cable crossover", "écarté poulie", "crossover"]
  },
  "extension poulie prise pronation": {
    name: "Extension poulie prise pronation",
    category: "Triceps",
    primaryMuscles: ["Triceps brachial"],
    secondaryMuscles: [],
    equipment: "Poulie haute",
    description: "Extension des triceps en prise pronation ciblant le vaste latéral",
    variations: ["pronated pushdown", "extension pronation", "overhand pushdown"]
  },
  "extension poulie prise supination": {
    name: "Extension poulie prise supination",
    category: "Triceps",
    primaryMuscles: ["Triceps brachial"],
    secondaryMuscles: [],
    equipment: "Poulie haute",
    description: "Extension des triceps en prise supination pour cibler la longue portion",
    variations: ["supinated pushdown", "extension supination", "underhand pushdown"]
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
  "extension unilatérale poulie": {
     name: "Extension unilatérale poulie",
     category: "Triceps",
     primaryMuscles: ["Triceps brachial"],
     secondaryMuscles: [],
     equipment: "Poulie haute",
     description: "Extension unilatérale des triceps pour isolation maximale",
     variations: ["single arm pushdown", "extension 1 bras", "unilateral extension"]
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
  }
};

// Fonctions utilitaires pour la recherche et la catégorisation
export function findExerciseInDatabase(exerciseName) {
  const normalizedName = exerciseName.toLowerCase().trim();
  
  // Recherche directe par nom
  if (exerciseDatabase[normalizedName]) {
    return exerciseDatabase[normalizedName];
  }
  
  // Recherche par variations
  for (const [key, exercise] of Object.entries(exerciseDatabase)) {
    if (exercise.variations.some(variation => 
      normalizedName.includes(variation.toLowerCase()) || 
      variation.toLowerCase().includes(normalizedName)
    )) {
      return exercise;
    }
  }
  
  return null;
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