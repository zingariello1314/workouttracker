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
    name: "Développé décliné haltères",
    category: "Pectoraux",
    primaryMuscles: ["Pectoraux inférieurs"],
    secondaryMuscles: ["Triceps", "Deltoïdes antérieurs"],
    equipment: "Haltères + Banc décliné",
    description: "Version haltères du développé décliné pour amplitude accrue",
    variations: ["decline dumbbell press", "dc décliné haltères", "décliné haltères"]
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