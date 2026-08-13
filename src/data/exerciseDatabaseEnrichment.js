/** Fiches exercices ajoutées par generateExerciseBankEnrichment.mjs */
export const EXERCISE_DATABASE_ENRICHMENT = {
  "développé couché à la smith machine": {
    name: "Développé couché à la Smith machine",
    category: "Pectoraux",
    primaryMuscles: [
      'Pectoraux'
    ],
    secondaryMuscles: [
      'Triceps',
      'Deltoïdes antérieurs'
    ],
    equipment: "Smith machine + Banc",
    difficulty: 2,
    description: "Développé guidé sur rails pour isoler la poussée horizontale sans stabilisation latérale. Garde les omoplates serrées et descends jusqu\'à effleurer la poitrine.",
    variations: [
      'smith bench press',
      'dc smith',
      'développé smith'
    ]
  },
  "développé incliné à la smith machine": {
    name: "Développé incliné à la Smith machine",
    category: "Pectoraux",
    primaryMuscles: [
      'Pectoraux supérieurs'
    ],
    secondaryMuscles: [
      'Triceps',
      'Deltoïdes antérieurs'
    ],
    equipment: "Smith machine + Banc incliné",
    difficulty: 3,
    description: "Cible le haut des pectoraux sur banc incliné 15–30° avec trajectoire fixe. Ne laisse pas les épaules monter en fin de poussée.",
    variations: [
      'incline smith press',
      'di smith',
      'smith incline bench'
    ]
  },
  "développé décliné à la smith machine": {
    name: "Développé décliné à la Smith machine",
    category: "Pectoraux",
    primaryMuscles: [
      'Pectoraux inférieurs'
    ],
    secondaryMuscles: [
      'Triceps',
      'Deltoïdes antérieurs'
    ],
    equipment: "Smith machine + Banc décliné",
    difficulty: 2,
    description: "Accentue la portion inférieure des pectoraux en décliné modéré. Pieds bien calés, barre vers le bas du sternum.",
    variations: [
      'decline smith press',
      'développé décliné smith',
      'smith decline bench'
    ]
  },
  "développé couché prise neutre haltères": {
    name: "Développé couché prise neutre haltères",
    category: "Pectoraux",
    primaryMuscles: [
      'Pectoraux'
    ],
    secondaryMuscles: [
      'Triceps',
      'Deltoïdes antérieurs'
    ],
    equipment: "Haltères + Banc",
    difficulty: 2,
    description: "Paumes face à face pour réduire la stress sur les épaules tout en recrutant les pectoraux. Coudes restent proches du buste à 45°.",
    variations: [
      'neutral grip dumbbell press',
      'dc prise neutre',
      'hammer grip bench press'
    ]
  },
  "floor press haltères": {
    name: "Floor press haltères",
    category: "Pectoraux",
    primaryMuscles: [
      'Pectoraux',
      'Triceps'
    ],
    secondaryMuscles: [
      'Deltoïdes antérieurs'
    ],
    equipment: "Haltères",
    difficulty: 2,
    description: "Développé au sol qui limite l\'amplitude et verrouille le haut du mouvement. Idéal pour triceps et lock-out ; pause courte au sol sans rebond.",
    variations: [
      'dumbbell floor press',
      'floor press db',
      'développé au sol haltères'
    ]
  },
  "floor press barre": {
    name: "Floor press barre",
    category: "Pectoraux",
    primaryMuscles: [
      'Pectoraux',
      'Triceps'
    ],
    secondaryMuscles: [
      'Deltoïdes antérieurs'
    ],
    equipment: "Barre + Sol",
    difficulty: 2,
    description: "Variante powerlifting au sol pour renforcer la fin de poussée et protéger les épaules. Coudes posés au sol entre chaque rep pour reset complet.",
    variations: [
      'barbell floor press',
      'floor press barre',
      'développé barre au sol'
    ]
  },
  "svend press": {
    name: "Svend press",
    category: "Pectoraux",
    primaryMuscles: [
      'Pectoraux'
    ],
    secondaryMuscles: [
      'Deltoïdes antérieurs',
      'Triceps'
    ],
    equipment: "Disque / Haltère",
    difficulty: 1,
    description: "Press isométrique-concentrique en serrant un disque devant la poitrine. Serre fortement entre les paumes pour maximiser la contraction.",
    variations: [
      'svend press',
      'plate press',
      'squeeze press'
    ]
  },
  "pompes larges": {
    name: "Pompes larges",
    category: "Pectoraux",
    primaryMuscles: [
      'Pectoraux'
    ],
    secondaryMuscles: [
      'Triceps',
      'Deltoïdes antérieurs'
    ],
    equipment: "Poids du corps",
    difficulty: 1,
    description: "Mains plus larges que les épaules pour étirer davantage les pectoraux. Corps gainé, coudes légèrement ouverts sans douleur épaule.",
    variations: [
      'wide push up',
      'pompes prise large',
      'wide grip push-ups'
    ]
  },
  "pompes sur un bras assistées": {
    name: "Pompes sur un bras assistées",
    category: "Pectoraux",
    primaryMuscles: [
      'Pectoraux',
      'Triceps'
    ],
    secondaryMuscles: [
      'Core',
      'Deltoïdes'
    ],
    equipment: "Poids du corps + support",
    difficulty: 4,
    description: "Progression vers la pompe unilatérale avec assistance (élastique, barre basse). Garde le bassin neutre et la main assistée légère.",
    variations: [
      'assisted one arm push up',
      'pompes un bras assistées',
      'archer push up assisté'
    ]
  },
  "pompes pieds très surélevés": {
    name: "Pompes pieds très surélevés",
    category: "Pectoraux",
    primaryMuscles: [
      'Pectoraux supérieurs',
      'Deltoïdes antérieurs'
    ],
    secondaryMuscles: [
      'Triceps',
      'Core'
    ],
    equipment: "Poids du corps + Box",
    difficulty: 3,
    description: "Pieds très hauts pour basculer la charge vers le haut des pectoraux et les épaules. Descends contrôlé, ne cambre pas les lombaires.",
    variations: [
      'decline push up high',
      'pompes pieds surélevés',
      'pike push up feet elevated'
    ]
  },
  "pompes explosives surélevées": {
    name: "Pompes explosives surélevées",
    category: "Pectoraux",
    primaryMuscles: [
      'Pectoraux',
      'Triceps'
    ],
    secondaryMuscles: [
      'Deltoïdes antérieurs',
      'Core'
    ],
    equipment: "Poids du corps + Box",
    difficulty: 3,
    description: "Pompes déclinées avec phase explosive et décollage des mains. Atterrissage souple, poitrine avant les épaules.",
    variations: [
      'explosive decline push up',
      'plyo push up elevated',
      'pompes claquées surélevées'
    ]
  },
  "tractions prise neutre": {
    name: "Tractions prise neutre",
    category: "Dorsaux",
    primaryMuscles: [
      'Grand dorsal',
      'Brachial antérieur'
    ],
    secondaryMuscles: [
      'Biceps',
      'Rhomboïdes'
    ],
    equipment: "Barre de traction",
    difficulty: 3,
    description: "Prise parallèle favorisant l\'épaisseur du dos et sollicitant le brachial. Amène la poitrine vers les mains, omoplates en dépression en bas.",
    variations: [
      'neutral grip pull up',
      'tractions neutres',
      'hammer grip pull up'
    ]
  },
  "tractions prise large": {
    name: "Tractions prise large",
    category: "Dorsaux",
    primaryMuscles: [
      'Grand dorsal'
    ],
    secondaryMuscles: [
      'Rhomboïdes',
      'Biceps',
      'Trapèzes inférieurs'
    ],
    equipment: "Barre de traction",
    difficulty: 3,
    description: "Prise pronation large pour maximiser la largeur du dos. Initie le mouvement en baissant les épaules avant de plier les coudes.",
    variations: [
      'wide grip pull up',
      'tractions larges',
      'lat focused pull up'
    ]
  },
  "tractions prise serrée": {
    name: "Tractions prise serrée",
    category: "Dorsaux",
    primaryMuscles: [
      'Grand dorsal',
      'Grand rond'
    ],
    secondaryMuscles: [
      'Biceps',
      'Brachial antérieur'
    ],
    equipment: "Barre de traction",
    difficulty: 3,
    description: "Mains rapprochées pour accentuer l\'épaisseur et le bas du dos. Poitrine haute, coudes vers les hanches en fin de tirage.",
    variations: [
      'close grip pull up',
      'tractions serrées',
      'narrow pull up'
    ]
  },
  "tractions lestées": {
    name: "Tractions lestées",
    category: "Dorsaux",
    primaryMuscles: [
      'Grand dorsal'
    ],
    secondaryMuscles: [
      'Biceps',
      'Rhomboïdes',
      'Core'
    ],
    equipment: "Barre de traction + Lest",
    difficulty: 4,
    description: "Tractions avec charge additionnelle (ceinture, gilet). Évite le balancement ; chaque rep démarre bras tendus sous contrôle.",
    variations: [
      'weighted pull up',
      'tractions lestées',
      'pull up with weight'
    ]
  },
  "tractions assistées": {
    name: "Tractions assistées",
    category: "Dorsaux",
    primaryMuscles: [
      'Grand dorsal'
    ],
    secondaryMuscles: [
      'Biceps',
      'Rhomboïdes'
    ],
    equipment: "Machine assistée ou élastique",
    difficulty: 2,
    description: "Progression accessible vers les tractions strictes. Réduis l\'assistance progressivement tout en gardant une amplitude complète.",
    variations: [
      'assisted pull up',
      'tractions assistées machine',
      'band assisted pull up'
    ]
  },
  "tractions aux anneaux": {
    name: "Tractions aux anneaux",
    category: "Dorsaux",
    primaryMuscles: [
      'Grand dorsal',
      'Rhomboïdes'
    ],
    secondaryMuscles: [
      'Biceps',
      'Stabilisateurs scapulaires'
    ],
    equipment: "Anneaux",
    difficulty: 3,
    description: "Instabilité des anneaux qui exige un contrôle scapulaire maximal. Poignets neutres, corps rigide sans cambrure.",
    variations: [
      'ring pull up',
      'tractions anneaux',
      'gymnastic rings pull up'
    ]
  },
  "tractions supination serrées": {
    name: "Tractions supination serrées",
    category: "Dorsaux",
    primaryMuscles: [
      'Grand dorsal',
      'Biceps'
    ],
    secondaryMuscles: [
      'Brachial antérieur',
      'Rhomboïdes'
    ],
    equipment: "Barre de traction",
    difficulty: 3,
    description: "Chin-up prise serrée combinant dos et biceps. Serre la barre, amène le sternum vers les mains.",
    variations: [
      'close grip chin up',
      'tractions supination serrées',
      'narrow chin up'
    ]
  },
  "tirage vertical prise large": {
    name: "Tirage vertical prise large",
    category: "Dorsaux",
    primaryMuscles: [
      'Grand dorsal'
    ],
    secondaryMuscles: [
      'Rhomboïdes',
      'Biceps'
    ],
    equipment: "Poulie haute",
    difficulty: 2,
    description: "Lat pulldown prise large pour simuler les tractions en salle. Penché légèrement en arrière, tire vers le haut de la poitrine.",
    variations: [
      'wide lat pulldown',
      'tirage vertical large',
      'wide grip pulldown'
    ]
  },
  "tirage vertical supination": {
    name: "Tirage vertical supination",
    category: "Dorsaux",
    primaryMuscles: [
      'Grand dorsal',
      'Biceps'
    ],
    secondaryMuscles: [
      'Brachial antérieur'
    ],
    equipment: "Poulie haute",
    difficulty: 2,
    description: "Tirage en supination pour recruter davantage les biceps tout en ciblant le dos. Coudes vers le sol, pause courte en bas.",
    variations: [
      'underhand lat pulldown',
      'tirage supination',
      'reverse grip pulldown'
    ]
  },
  "tirage vertical unilatéral": {
    name: "Tirage vertical unilatéral",
    category: "Dorsaux",
    primaryMuscles: [
      'Grand dorsal'
    ],
    secondaryMuscles: [
      'Rhomboïdes',
      'Biceps'
    ],
    equipment: "Poulie haute",
    difficulty: 2,
    description: "Tirage à un bras pour corriger les asymétries et augmenter l\'amplitude. Rotation légère du thorax, coude vers la hanche.",
    variations: [
      'single arm lat pulldown',
      'tirage unilatéral',
      'one arm pulldown'
    ]
  },
  "tirage vertical prise neutre large": {
    name: "Tirage vertical prise neutre large",
    category: "Dorsaux",
    primaryMuscles: [
      'Grand dorsal',
      'Rhomboïdes'
    ],
    secondaryMuscles: [
      'Biceps',
      'Brachial antérieur'
    ],
    equipment: "Poulie haute + Poignée neutre",
    difficulty: 2,
    description: "Poignée neutre large pour un confort d\'épaule optimal. Initie par les omoplates avant de plier le coude.",
    variations: [
      'neutral wide pulldown',
      'tirage neutre large',
      'v-bar wide pulldown'
    ]
  },
  "straight-arm pulldown": {
    name: "Straight-arm pulldown",
    category: "Dorsaux",
    primaryMuscles: [
      'Grand dorsal'
    ],
    secondaryMuscles: [
      'Grand rond',
      'Triceps long'
    ],
    equipment: "Poulie haute",
    difficulty: 1,
    description: "Bras tendus, extension d\'épaule pure pour isoler le grand dorsal. Coudes fixes, barre vers les cuisses en arc de cercle.",
    variations: [
      'straight arm pulldown',
      'pulldown bras tendus',
      'lat isolation pulldown'
    ]
  },
  "rowing pendlay": {
    name: "Rowing Pendlay",
    category: "Dorsaux",
    primaryMuscles: [
      'Grand dorsal',
      'Rhomboïdes'
    ],
    secondaryMuscles: [
      'Trapèzes',
      'Biceps',
      'Érecteurs du rachis'
    ],
    equipment: "Barre",
    difficulty: 3,
    description: "Rowing explosif depuis le sol, torse parallèle au sol à chaque rep. Barre touche le sol entre les répétitions, dos plat.",
    variations: [
      'pendlay row',
      'rowing pendlay',
      'dead stop row'
    ]
  },
  "rowing poitrine appuyée haltères": {
    name: "Rowing poitrine appuyée haltères",
    category: "Dorsaux",
    primaryMuscles: [
      'Grand dorsal',
      'Rhomboïdes'
    ],
    secondaryMuscles: [
      'Trapèzes postérieurs',
      'Biceps'
    ],
    equipment: "Haltères + Banc incliné",
    difficulty: 1,
    description: "Rowing buste appuyé qui élimine la triche lombaire. Tire les coudes vers l\'arrière en serrant les omoplates.",
    variations: [
      'chest supported dumbbell row',
      'rowing buste appuyé',
      'incline bench row'
    ]
  },
  "rowing t-bar poitrine appuyée": {
    name: "Rowing T-bar poitrine appuyée",
    category: "Dorsaux",
    primaryMuscles: [
      'Grand dorsal',
      'Rhomboïdes'
    ],
    secondaryMuscles: [
      'Trapèzes moyens',
      'Biceps'
    ],
    equipment: "T-bar + Banc",
    difficulty: 2,
    description: "T-bar row avec buste stabilisé pour charger lourd en sécurité. Poitrine collée au coussin, amplitude complète.",
    variations: [
      'chest supported t-bar row',
      't-bar row appuyé',
      'machine t-bar row'
    ]
  },
  "rowing unilatéral poulie": {
    name: "Rowing unilatéral poulie",
    category: "Dorsaux",
    primaryMuscles: [
      'Grand dorsal'
    ],
    secondaryMuscles: [
      'Rhomboïdes',
      'Biceps'
    ],
    equipment: "Poulie basse",
    difficulty: 1,
    description: "Tirage horizontal un bras pour travailler l\'épaisseur en profondeur. Buste stable, coude près du corps en fin de tirage.",
    variations: [
      'single arm cable row',
      'rowing unilatéral poulie',
      'one arm seated row'
    ]
  },
  "rowing meadows": {
    name: "Rowing Meadows",
    category: "Dorsaux",
    primaryMuscles: [
      'Grand dorsal',
      'Trapèzes'
    ],
    secondaryMuscles: [
      'Rhomboïdes',
      'Biceps'
    ],
    equipment: "T-bar / Landmine",
    difficulty: 3,
    description: "Rowing landmine unilatéral avec prise en pronation profonde. Étire le lat en bas, rotation minimale du tronc.",
    variations: [
      'meadows row',
      'landmine meadows row',
      'single arm landmine row'
    ]
  },
  "renegade row": {
    name: "Renegade row",
    category: "Dorsaux",
    primaryMuscles: [
      'Grand dorsal',
      'Rhomboïdes'
    ],
    secondaryMuscles: [
      'Core',
      'Deltoïdes',
      'Triceps'
    ],
    equipment: "Haltères",
    difficulty: 3,
    description: "Planche avec rowing alterné : anti-rotation et tirage combinés. Hanches stables, ne balance pas le bassin.",
    variations: [
      'renegade row',
      'plank row',
      'rowing en planche'
    ]
  },
  "rowing aux anneaux": {
    name: "Rowing aux anneaux",
    category: "Dorsaux",
    primaryMuscles: [
      'Grand dorsal',
      'Rhomboïdes'
    ],
    secondaryMuscles: [
      'Biceps',
      'Core'
    ],
    equipment: "Anneaux",
    difficulty: 2,
    description: "Rowing australien sur anneaux pour progresser vers les tractions. Corps aligné, poitrine vers les anneaux.",
    variations: [
      'ring row',
      'rowing anneaux',
      'inverted ring row'
    ]
  },
  "traction commando lestée": {
    name: "Traction commando lestée",
    category: "Dorsaux",
    primaryMuscles: [
      'Grand dorsal',
      'Obliques'
    ],
    secondaryMuscles: [
      'Biceps',
      'Core'
    ],
    equipment: "Barre + Lest",
    difficulty: 4,
    description: "Traction alternée prise serrée avec charge additionnelle. Tête passe d\'un côté à l\'autre de la barre sans rotation excessive.",
    variations: [
      'weighted commando pull up',
      'tractions commando lestées',
      'commando pull up weighted'
    ]
  },
  "muscle-up strict aux anneaux": {
    name: "Muscle-up strict aux anneaux",
    category: "Dorsaux",
    primaryMuscles: [
      'Grand dorsal',
      'Triceps',
      'Deltoïdes'
    ],
    secondaryMuscles: [
      'Pectoraux',
      'Core'
    ],
    equipment: "Anneaux",
    difficulty: 4,
    description: "Enchaînement traction-dips strict sur anneaux sans kip. False grip ou transition contrôlée, corps gainé.",
    variations: [
      'strict ring muscle up',
      'muscle up anneaux',
      'ring muscle-up strict'
    ]
  },
  "développé épaules machine": {
    name: "Développé épaules machine",
    category: "Épaules",
    primaryMuscles: [
      'Deltoïdes'
    ],
    secondaryMuscles: [
      'Triceps',
      'Trapèzes supérieurs'
    ],
    equipment: "Machine",
    difficulty: 1,
    description: "Développé guidé pour isoler les deltoïdes sans demande de stabilisation. Poignées à hauteur des oreilles, ne verrouille pas brutalement.",
    variations: [
      'shoulder press machine',
      'développé épaules machine',
      'machine overhead press'
    ]
  },
  "développé épaules haltères debout": {
    name: "Développé épaules haltères debout",
    category: "Épaules",
    primaryMuscles: [
      'Deltoïdes'
    ],
    secondaryMuscles: [
      'Triceps',
      'Core',
      'Trapèzes'
    ],
    equipment: "Haltères",
    difficulty: 3,
    description: "Développé debout sollicitant la stabilité du tronc et des épaules. Fessiers et abdos serrés, barre imaginaire au-dessus de la tête.",
    variations: [
      'standing dumbbell press',
      'ohp haltères debout',
      'développé debout haltères'
    ]
  },
  "développé haltères prise neutre": {
    name: "Développé haltères prise neutre",
    category: "Épaules",
    primaryMuscles: [
      'Deltoïdes',
      'Triceps'
    ],
    secondaryMuscles: [
      'Trapèzes supérieurs'
    ],
    equipment: "Haltères",
    difficulty: 2,
    description: "Paumes face à face pour un confort d\'épaule en développé. Coudes légèrement devant le corps, amplitude complète sans douleur.",
    variations: [
      'neutral grip shoulder press',
      'développé prise neutre',
      'hammer grip ohp'
    ]
  },
  "développé militaire à la smith machine": {
    name: "Développé militaire à la Smith machine",
    category: "Épaules",
    primaryMuscles: [
      'Deltoïdes'
    ],
    secondaryMuscles: [
      'Triceps',
      'Trapèzes supérieurs'
    ],
    equipment: "Smith machine",
    difficulty: 2,
    description: "Développé vertical guidé pour charger les épaules en sécurité. Assis ou debout, barre devant le visage sans cambrer.",
    variations: [
      'smith shoulder press',
      'développé militaire smith',
      'smith ohp'
    ]
  },
  "push press": {
    name: "Push press",
    category: "Épaules",
    primaryMuscles: [
      'Deltoïdes',
      'Triceps'
    ],
    secondaryMuscles: [
      'Quadriceps',
      'Core',
      'Trapèzes'
    ],
    equipment: "Barre",
    difficulty: 3,
    description: "Développé avec impulsion des jambes pour passer le sticking point. Dip contrôlé puis extension explosive jambes puis bras.",
    variations: [
      'push press',
      'développé push',
      'barbell push press'
    ]
  },
  "push press haltères": {
    name: "Push press haltères",
    category: "Épaules",
    primaryMuscles: [
      'Deltoïdes',
      'Triceps'
    ],
    secondaryMuscles: [
      'Quadriceps',
      'Core'
    ],
    equipment: "Haltères",
    difficulty: 3,
    description: "Variante haltères du push press pour puissance et stabilité unilatérale. Même timing : jambes puis épaules.",
    variations: [
      'dumbbell push press',
      'push press haltères',
      'db push press'
    ]
  },
  "élévation latérale à la machine": {
    name: "Élévation latérale à la machine",
    category: "Épaules",
    primaryMuscles: [
      'Deltoïdes moyens'
    ],
    secondaryMuscles: [
      'Trapèzes supérieurs'
    ],
    equipment: "Machine",
    difficulty: 1,
    description: "Isolation deltoïde latéral sur machine pour trajectoire constante. Monte jusqu\'à l\'alignement épaules, sans élan.",
    variations: [
      'lateral raise machine',
      'élévation latérale machine',
      'machine side raise'
    ]
  },
  "élévation latérale assise": {
    name: "Élévation latérale assise",
    category: "Épaules",
    primaryMuscles: [
      'Deltoïdes moyens'
    ],
    secondaryMuscles: [],
    equipment: "Haltères + Banc",
    difficulty: 1,
    description: "Position assise qui limite la triche par le corps. Légère inclinaison du buste, pouces neutres ou légèrement vers le bas.",
    variations: [
      'seated lateral raise',
      'élévation latérale assise',
      'side raise seated'
    ]
  },
  "élévation latérale penchée": {
    name: "Élévation latérale penchée",
    category: "Épaules",
    primaryMuscles: [
      'Deltoïdes moyens'
    ],
    secondaryMuscles: [
      'Trapèzes inférieurs'
    ],
    equipment: "Haltères",
    difficulty: 1,
    description: "Buste penché en avant pour tension constante sur le deltoïde latéral. Dos plat, haltères sous le buste en bas.",
    variations: [
      'leaning lateral raise',
      'élévation penchée',
      'cable y raise lateral'
    ]
  },
  "reverse pec deck": {
    name: "Reverse pec deck",
    category: "Épaules",
    primaryMuscles: [
      'Deltoïdes postérieurs'
    ],
    secondaryMuscles: [
      'Rhomboïdes',
      'Trapèzes moyens'
    ],
    equipment: "Machine",
    difficulty: 1,
    description: "Oiseau sur machine pour cibler l\'arrière d\'épaule sans stabilisation complexe. Serre les omoplates en fin de mouvement.",
    variations: [
      'reverse pec deck',
      'rear delt machine',
      'oiseau machine'
    ]
  },
  "high row poulie": {
    name: "High row poulie",
    category: "Épaules",
    primaryMuscles: [
      'Deltoïdes postérieurs',
      'Trapèzes moyens'
    ],
    secondaryMuscles: [
      'Rhomboïdes',
      'Biceps'
    ],
    equipment: "Poulie basse",
    difficulty: 2,
    description: "Tirage haut vers la poitrine pour trapèzes et deltoïdes postérieurs. Coudes hauts, paume vers le bas en fin de tirage.",
    variations: [
      'high row cable',
      'face pull high row',
      'tirage haut poulie'
    ]
  },
  "face pull à la corde haute": {
    name: "Face pull à la corde haute",
    category: "Épaules",
    primaryMuscles: [
      'Deltoïdes postérieurs',
      'Rotateurs externes'
    ],
    secondaryMuscles: [
      'Trapèzes moyens',
      'Rhomboïdes'
    ],
    equipment: "Poulie haute + Corde",
    difficulty: 1,
    description: "Tire la corde vers le visage en écartant les mains. Rotation externe en fin de mouvement, coudes au-dessus des poignets.",
    variations: [
      'face pull',
      'face pull corde',
      'cable face pull'
    ]
  },
  "handstand hold libre": {
    name: "Handstand hold libre",
    category: "Épaules",
    primaryMuscles: [
      'Deltoïdes',
      'Trapèzes supérieurs'
    ],
    secondaryMuscles: [
      'Triceps',
      'Core',
      'Avant-bras'
    ],
    equipment: "Poids du corps",
    difficulty: 4,
    description: "Équilibre sur les mains sans mur — niveau avancé de force et contrôle d\'épaule. Doigts actifs, corps aligné, respiration calme.",
    variations: [
      'freestanding handstand hold',
      'équilibre sur les mains libre',
      'handstand hold free'
    ]
  },
  "pike push-up pieds surélevés": {
    name: "Pike push-up pieds surélevés",
    category: "Épaules",
    primaryMuscles: [
      'Deltoïdes antérieurs',
      'Triceps'
    ],
    secondaryMuscles: [
      'Trapèzes supérieurs',
      'Core'
    ],
    equipment: "Poids du corps + Box",
    difficulty: 3,
    description: "Pompes pike avec pieds hauts, progression vers le HSPU. Tête vers le sol entre les mains, coudes légèrement ouverts.",
    variations: [
      'elevated pike push up',
      'pike push up feet up',
      'pompes pike surélevées'
    ]
  },
  "curl marteau croisé": {
    name: "Curl marteau croisé",
    category: "Biceps",
    primaryMuscles: [
      'Brachial antérieur',
      'Biceps brachial'
    ],
    secondaryMuscles: [
      'Brachio-radial'
    ],
    equipment: "Haltères",
    difficulty: 1,
    description: "Curl marteau en traversant le corps pour solliciter le brachial. Coude fixe, monte vers l\'épaule opposée.",
    variations: [
      'cross body hammer curl',
      'curl marteau croisé',
      'hammer curl across body'
    ]
  },
  "curl bayesian à la poulie": {
    name: "Curl Bayesian à la poulie",
    category: "Biceps",
    primaryMuscles: [
      'Biceps brachial'
    ],
    secondaryMuscles: [
      'Brachial antérieur'
    ],
    equipment: "Poulie basse",
    difficulty: 2,
    description: "Curl derrière le corps sur poulie basse pour étirement maximal du biceps. Bras légèrement en arrière du corps, coude stable.",
    variations: [
      'bayesian curl',
      'curl bayesian poulie',
      'behind body cable curl'
    ]
  },
  "curl câble derrière le corps": {
    name: "Curl câble derrière le corps",
    category: "Biceps",
    primaryMuscles: [
      'Biceps brachial'
    ],
    secondaryMuscles: [
      'Brachial antérieur'
    ],
    equipment: "Poulie basse",
    difficulty: 2,
    description: "Même principe que le Bayesian : tension constante en position étirée. Ne balance pas le tronc.",
    variations: [
      'behind the back cable curl',
      'curl câble derrière',
      'rear cable curl'
    ]
  },
  "curl barre prise inversée": {
    name: "Curl barre prise inversée",
    category: "Biceps",
    primaryMuscles: [
      'Brachial antérieur',
      'Biceps brachial'
    ],
    secondaryMuscles: [
      'Brachio-radial'
    ],
    equipment: "Barre",
    difficulty: 2,
    description: "Prise pronation (reverse curl) pour cibler le brachial et l\'avant-bras. Coudes collés, montée contrôlée sans élan.",
    variations: [
      'reverse barbell curl',
      'curl inversé barre',
      'pronated curl'
    ]
  },
  "curl inversé ez": {
    name: "Curl inversé EZ",
    category: "Biceps",
    primaryMuscles: [
      'Brachial antérieur',
      'Brachio-radial'
    ],
    secondaryMuscles: [
      'Biceps brachial'
    ],
    equipment: "Barre EZ",
    difficulty: 2,
    description: "Barre EZ en prise pronation pour confort poignet et brachial. Amplitude complète sans douleur coude.",
    variations: [
      'reverse ez curl',
      'curl inversé EZ',
      'ez reverse curl'
    ]
  },
  "curl araignée haltères": {
    name: "Curl araignée haltères",
    category: "Biceps",
    primaryMuscles: [
      'Biceps brachial'
    ],
    secondaryMuscles: [
      'Brachial antérieur'
    ],
    equipment: "Haltères + Banc incliné",
    difficulty: 2,
    description: "Buste penché sur banc, bras pendants : curl strict sans triche. Serre en haut sans monter les coudes.",
    variations: [
      'spider curl',
      'curl araignée',
      'prone incline curl'
    ]
  },
  "curl unilatéral pupitre": {
    name: "Curl unilatéral pupitre",
    category: "Biceps",
    primaryMuscles: [
      'Biceps brachial'
    ],
    secondaryMuscles: [
      'Brachial antérieur'
    ],
    equipment: "Haltère + Banc pupitre",
    difficulty: 2,
    description: "Curl pupitre un bras pour isolement maximal. Bras à plat sur le coussin, descente lente en extension complète.",
    variations: [
      'single arm preacher curl',
      'curl pupitre unilatéral',
      'unilateral preacher curl'
    ]
  },
  "curl drag": {
    name: "Curl drag",
    category: "Biceps",
    primaryMuscles: [
      'Biceps brachial'
    ],
    secondaryMuscles: [
      'Brachial antérieur'
    ],
    equipment: "Barre / Haltères",
    difficulty: 2,
    description: "Barre « glissée » le long du corps, coudes en arrière. Tension continue sur le biceps sans relâchement en haut.",
    variations: [
      'drag curl',
      'curl drag',
      'barbell drag curl'
    ]
  },
  "extension triceps au-dessus de la tête à la poulie": {
    name: "Extension triceps au-dessus de la tête à la poulie",
    category: "Triceps",
    primaryMuscles: [
      'Triceps brachial'
    ],
    secondaryMuscles: [],
    equipment: "Poulie basse",
    difficulty: 1,
    description: "Extension overhead à la poulie pour étirer la longue portion du triceps. Coudes près des oreilles, extension complète.",
    variations: [
      'overhead cable triceps extension',
      'extension triceps poulie overhead',
      'cable overhead extension'
    ]
  },
  "extension triceps corde au-dessus de la tête": {
    name: "Extension triceps corde au-dessus de la tête",
    category: "Triceps",
    primaryMuscles: [
      'Triceps brachial'
    ],
    secondaryMuscles: [],
    equipment: "Poulie basse + Corde",
    difficulty: 1,
    description: "Corde derrière la tête pour confort poignet et contraction maximale. Écarte les mains en fin d\'extension.",
    variations: [
      'rope overhead extension',
      'extension corde overhead',
      'triceps rope overhead'
    ]
  },
  "extension triceps unilatérale au-dessus de la tête": {
    name: "Extension triceps unilatérale au-dessus de la tête",
    category: "Triceps",
    primaryMuscles: [
      'Triceps brachial'
    ],
    secondaryMuscles: [
      'Core'
    ],
    equipment: "Haltère ou Poulie",
    difficulty: 2,
    description: "Extension overhead un bras pour corriger les déséquilibres. Coude fixe pointé vers le plafond.",
    variations: [
      'single arm overhead extension',
      'extension triceps unilatérale overhead',
      'one arm triceps extension'
    ]
  },
  "pushdown barre": {
    name: "Pushdown barre",
    category: "Triceps",
    primaryMuscles: [
      'Triceps brachial'
    ],
    secondaryMuscles: [],
    equipment: "Poulie haute",
    difficulty: 1,
    description: "Extension coude à la poulie haute avec barre droite. Coudes collés au corps, extension sans verrouillage brutal.",
    variations: [
      'triceps pushdown bar',
      'pushdown barre',
      'straight bar pushdown'
    ]
  },
  "pushdown corde": {
    name: "Pushdown corde",
    category: "Triceps",
    primaryMuscles: [
      'Triceps brachial'
    ],
    secondaryMuscles: [],
    equipment: "Poulie haute + Corde",
    difficulty: 1,
    description: "Corde pour amplitude complète et confort poignet. Écarte les mains en bas pour contraction maximale.",
    variations: [
      'rope pushdown',
      'pushdown corde',
      'triceps rope pushdown'
    ]
  },
  "pushdown unilatéral": {
    name: "Pushdown unilatéral",
    category: "Triceps",
    primaryMuscles: [
      'Triceps brachial'
    ],
    secondaryMuscles: [],
    equipment: "Poulie haute",
    difficulty: 1,
    description: "Pushdown un bras pour isolement et correction asymétrique. Tronc stable, coude fixe.",
    variations: [
      'single arm pushdown',
      'pushdown unilatéral',
      'one arm triceps pushdown'
    ]
  },
  "skull crusher haltères": {
    name: "Skull crusher haltères",
    category: "Triceps",
    primaryMuscles: [
      'Triceps brachial'
    ],
    secondaryMuscles: [],
    equipment: "Haltères + Banc",
    difficulty: 2,
    description: "Extension couchée haltères vers le front ou au-dessus de la tête. Coudes stables, descente contrôlée.",
    variations: [
      'dumbbell skull crusher',
      'barre au front haltères',
      'lying triceps extension db'
    ]
  },
  "tate press haltères": {
    name: "Tate press haltères",
    category: "Triceps",
    primaryMuscles: [
      'Triceps brachial'
    ],
    secondaryMuscles: [
      'Deltoïdes antérieurs'
    ],
    equipment: "Haltères + Banc",
    difficulty: 2,
    description: "Extension en écartant les haltères vers l\'extérieur sur banc. Coudes larges, contraction en extension.",
    variations: [
      'tate press',
      'tate press dumbbell',
      'flared triceps extension'
    ]
  },
  "extension triceps au poids du corps": {
    name: "Extension triceps au poids du corps",
    category: "Triceps",
    primaryMuscles: [
      'Triceps brachial'
    ],
    secondaryMuscles: [
      'Deltoïdes antérieurs',
      'Pectoraux'
    ],
    equipment: "Barres parallèles / Banc",
    difficulty: 3,
    description: "Dips ou extensions au poids du corps pour triceps. Buste vertical pour isoler les triceps, coudes vers l\'arrière.",
    variations: [
      'bodyweight triceps extension',
      'bench dip',
      'extension triceps pdc'
    ]
  },
  "dips assistés": {
    name: "Dips assistés",
    category: "Triceps",
    primaryMuscles: [
      'Triceps brachial',
      'Pectoraux inférieurs'
    ],
    secondaryMuscles: [
      'Deltoïdes antérieurs'
    ],
    equipment: "Machine assistée ou élastique",
    difficulty: 2,
    description: "Progression vers les dips libres avec assistance réglable. Buste légèrement penché pour pectoraux, vertical pour triceps.",
    variations: [
      'assisted dips',
      'dips assistés',
      'band assisted dips'
    ]
  },
  "reverse lunge": {
    name: "Reverse lunge",
    category: "Quadriceps",
    primaryMuscles: [
      'Quadriceps',
      'Fessiers'
    ],
    secondaryMuscles: [
      'Ischio-jambiers',
      'Mollets'
    ],
    equipment: "Poids du corps / Haltères",
    difficulty: 1,
    description: "Fente arrière qui réduit la stress rotulienne vs fente avant. Grand pas en arrière, genou arrière frôle le sol.",
    variations: [
      'reverse lunge',
      'fente arrière',
      'backward lunge'
    ]
  },
  "fente latérale": {
    name: "Fente latérale",
    category: "Quadriceps",
    primaryMuscles: [
      'Quadriceps',
      'Adducteurs'
    ],
    secondaryMuscles: [
      'Fessiers',
      'Mollets'
    ],
    equipment: "Poids du corps / Haltères",
    difficulty: 2,
    description: "Step latéral en charge pour quadriceps et adducteurs. Jambe de travail fléchie, buste droit, talon au sol.",
    variations: [
      'lateral lunge',
      'fente latérale',
      'side lunge'
    ]
  },
  "fente avant pied surélevé": {
    name: "Fente avant pied surélevé",
    category: "Quadriceps",
    primaryMuscles: [
      'Quadriceps',
      'Fessiers'
    ],
    secondaryMuscles: [
      'Mollets'
    ],
    equipment: "Haltères + Planche",
    difficulty: 2,
    description: "Pied avant surélevé pour plus de flexion genou et recrutement quadriceps. Bustes vertical, genou suit les orteils.",
    variations: [
      'front foot elevated lunge',
      'fente avant surélevée',
      'deficit lunge'
    ]
  },
  "bulgarian split squat avant surélevé": {
    name: "Bulgarian split squat avant surélevé",
    category: "Quadriceps",
    primaryMuscles: [
      'Quadriceps',
      'Fessiers'
    ],
    secondaryMuscles: [
      'Ischio-jambiers',
      'Core'
    ],
    equipment: "Haltères + Banc + Planche",
    difficulty: 3,
    description: "Fente bulgare avec pied avant surélevé pour amplitude maximale. Torse légèrement penché, genou avant stable.",
    variations: [
      'elevated bulgarian split squat',
      'bss avant surélevé',
      'front foot up split squat'
    ]
  },
  "cyclist squat": {
    name: "Cyclist squat",
    category: "Quadriceps",
    primaryMuscles: [
      'Quadriceps'
    ],
    secondaryMuscles: [
      'Fessiers',
      'Mollets'
    ],
    equipment: "Barre + Talons surélevés",
    difficulty: 2,
    description: "Squat talons surélevés, stance étroit pour quadriceps en flexion profonde. Bustes vertical, genoux avancés contrôlés.",
    variations: [
      'cyclist squat',
      'squat cycliste',
      'narrow heel elevated squat'
    ]
  },
  "spanish squat": {
    name: "Spanish squat",
    category: "Quadriceps",
    primaryMuscles: [
      'Quadriceps',
      'Tendon rotulien'
    ],
    secondaryMuscles: [
      'Fessiers'
    ],
    equipment: "Sangle / Élastique",
    difficulty: 2,
    description: "Squat isométrique/dynamique avec sangle derrière les genoux. Genoux avancés, buste vertical — protocole tendinopathie rotulienne.",
    variations: [
      'spanish squat',
      'squat espagnol',
      'band spanish squat'
    ]
  },
  "spanish squat isométrique": {
    name: "Spanish squat isométrique",
    category: "Quadriceps",
    primaryMuscles: [
      'Quadriceps',
      'Tendon rotulien'
    ],
    secondaryMuscles: [
      'Fessiers'
    ],
    equipment: "Sangle / Élastique",
    difficulty: 2,
    description: "Maintien en bas de Spanish squat pour tolérance tendineuse. Respiration calme, genoux alignés avec les pieds.",
    variations: [
      'spanish squat hold',
      'spanish squat iso',
      'isometric spanish squat'
    ]
  },
  "belt squat": {
    name: "Belt squat",
    category: "Quadriceps",
    primaryMuscles: [
      'Quadriceps',
      'Fessiers'
    ],
    secondaryMuscles: [
      'Mollets'
    ],
    equipment: "Ceinture de squat / Machine",
    difficulty: 2,
    description: "Squat avec charge à la ceinture sans compression spinale. Descente profonde, tronc vertical.",
    variations: [
      'belt squat',
      'squat ceinture',
      'hip belt squat'
    ]
  },
  "belt squat unilatéral": {
    name: "Belt squat unilatéral",
    category: "Quadriceps",
    primaryMuscles: [
      'Quadriceps',
      'Fessiers'
    ],
    secondaryMuscles: [
      'Core',
      'Mollets'
    ],
    equipment: "Ceinture de squat",
    difficulty: 3,
    description: "Belt squat une jambe pour force unilatérale sans charge axiale. Contrôle la descente, genou stable.",
    variations: [
      'single leg belt squat',
      'belt squat unilatéral',
      'unilateral belt squat'
    ]
  },
  "hack squat à la machine pendulaire": {
    name: "Hack squat à la machine pendulaire",
    category: "Quadriceps",
    primaryMuscles: [
      'Quadriceps'
    ],
    secondaryMuscles: [
      'Fessiers',
      'Ischio-jambiers'
    ],
    equipment: "Hack squat pendulaire",
    difficulty: 3,
    description: "Machine pendulaire pour squat profond guidé. Pieds bas sur la plateforme pour quadriceps, dos collé au coussin.",
    variations: [
      'pendulum hack squat',
      'hack squat pendulaire',
      'machine hack squat'
    ]
  },
  "reverse nordic curl": {
    name: "Reverse Nordic curl",
    category: "Quadriceps",
    primaryMuscles: [
      'Quadriceps'
    ],
    secondaryMuscles: [
      'Fléchisseurs de hanche',
      'Core'
    ],
    equipment: "Poids du corps",
    difficulty: 3,
    description: "Inclinaison arrière depuis genoux pour quadriceps en excentrique. Corps droit, amplitude progressive.",
    variations: [
      'reverse nordic',
      'reverse nordic curl',
      'kneeling quad extension'
    ]
  },
  "step-up haut": {
    name: "Step-up haut",
    category: "Quadriceps",
    primaryMuscles: [
      'Quadriceps',
      'Fessiers'
    ],
    secondaryMuscles: [
      'Mollets',
      'Core'
    ],
    equipment: "Box haute / Haltères",
    difficulty: 2,
    description: "Montée sur box haute sans élan du pied arrière. Pousse through le talon, buste légèrement penché.",
    variations: [
      'high step up',
      'step-up haut',
      'tall box step up'
    ]
  },
  "step-up lesté": {
    name: "Step-up lesté",
    category: "Quadriceps",
    primaryMuscles: [
      'Quadriceps',
      'Fessiers'
    ],
    secondaryMuscles: [
      'Mollets',
      'Core'
    ],
    equipment: "Box + Haltères / Barre",
    difficulty: 3,
    description: "Step-up avec charge pour force unilatérale fonctionnelle. Contrôle la descente, pas de saut.",
    variations: [
      'weighted step up',
      'step-up lesté',
      'loaded step up'
    ]
  },
  "squat sur une jambe assisté": {
    name: "Squat sur une jambe assisté",
    category: "Quadriceps",
    primaryMuscles: [
      'Quadriceps',
      'Fessiers'
    ],
    secondaryMuscles: [
      'Core',
      'Mollets'
    ],
    equipment: "Support + Haltère",
    difficulty: 3,
    description: "Progression vers le pistol squat avec support (anneau, TRX). Descends contrôlé, genou suit les orteils.",
    variations: [
      'assisted single leg squat',
      'pistol squat assisté',
      'supported one leg squat'
    ]
  },
  "leg curl assis": {
    name: "Leg curl assis",
    category: "Ischio-jambiers",
    primaryMuscles: [
      'Ischio-jambiers'
    ],
    secondaryMuscles: [
      'Mollets'
    ],
    equipment: "Machine leg curl assis",
    difficulty: 1,
    description: "Curl ischios assis pour étirement en position fléchie de hanche. Contracte en haut, descente lente 2–3 s.",
    variations: [
      'seated leg curl',
      'leg curl assis',
      'ischio machine assis'
    ]
  },
  "leg curl debout unilatéral": {
    name: "Leg curl debout unilatéral",
    category: "Ischio-jambiers",
    primaryMuscles: [
      'Ischio-jambiers'
    ],
    secondaryMuscles: [
      'Mollets',
      'Fessiers'
    ],
    equipment: "Machine leg curl debout",
    difficulty: 2,
    description: "Curl debout un jambe pour isolement et correction asymétrie. Hanche stable, pas de cambrure lombaire.",
    variations: [
      'standing single leg curl',
      'leg curl debout unilatéral',
      'one leg hamstring curl'
    ]
  },
  "nordic curl assisté": {
    name: "Nordic curl assisté",
    category: "Ischio-jambiers",
    primaryMuscles: [
      'Ischio-jambiers'
    ],
    secondaryMuscles: [
      'Fessiers',
      'Mollets'
    ],
    equipment: "Partenaire / Fixation + Élastique",
    difficulty: 4,
    description: "Nordic avec assistance élastique ou mains pour progresser. Corps aligné genoux-tête, freine en excentrique.",
    variations: [
      'assisted nordic curl',
      'nordic curl assisté',
      'band assisted nordic'
    ]
  },
  "nordic curl négatif": {
    name: "Nordic curl négatif",
    category: "Ischio-jambiers",
    primaryMuscles: [
      'Ischio-jambiers'
    ],
    secondaryMuscles: [
      'Fessiers',
      'Mollets'
    ],
    equipment: "Partenaire / Fixation",
    difficulty: 4,
    description: "Phase excentrique seule du Nordic curl. Descends le plus lentement possible, pousse sur les mains pour remonter.",
    variations: [
      'nordic curl negative',
      'nordic négatif',
      'eccentric nordic curl'
    ]
  },
  "glute-ham raise": {
    name: "Glute-ham raise",
    category: "Ischio-jambiers",
    primaryMuscles: [
      'Ischio-jambiers',
      'Fessiers'
    ],
    secondaryMuscles: [
      'Mollets',
      'Érecteurs du rachis'
    ],
    equipment: "GHD / Banc GHR",
    difficulty: 4,
    description: "Extension de hanche et flexion de genou sur banc GHR. Corps aligné, monte en contractant ischios et fessiers.",
    variations: [
      'ghr',
      'glute ham raise',
      'glute-ham developer'
    ]
  },
  "romanian deadlift barre": {
    name: "Romanian deadlift barre",
    category: "Ischio-jambiers",
    primaryMuscles: [
      'Ischio-jambiers',
      'Fessiers'
    ],
    secondaryMuscles: [
      'Érecteurs du rachis',
      'Grand dorsal'
    ],
    equipment: "Barre",
    difficulty: 3,
    description: "Hinge de hanche jambes quasi tendues pour ischios en étirement. Barre près des cuisses, dos plat, fessiers en arrière.",
    variations: [
      'romanian deadlift',
      'RDL barre',
      'soulevé roumain barre'
    ]
  },
  "romanian deadlift unilatéral": {
    name: "Romanian deadlift unilatéral",
    category: "Ischio-jambiers",
    primaryMuscles: [
      'Ischio-jambiers',
      'Fessiers'
    ],
    secondaryMuscles: [
      'Core',
      'Érecteurs du rachis'
    ],
    equipment: "Haltère / Kettlebell",
    difficulty: 3,
    description: "RDL une jambe pour équilibre et ischios unilatéral. Jambe libre prolonge le corps, bassin parallèle au sol.",
    variations: [
      'single leg RDL',
      'RDL unilatéral',
      'one leg romanian deadlift'
    ]
  },
  "single-leg rdl haltères": {
    name: "Single-leg RDL haltères",
    category: "Ischio-jambiers",
    primaryMuscles: [
      'Ischio-jambiers',
      'Fessiers'
    ],
    secondaryMuscles: [
      'Core',
      'Mollets'
    ],
    equipment: "Haltères",
    difficulty: 3,
    description: "RDL unilatéral avec deux haltères pour charge symétrique. Même technique : hinge, dos plat, hanche en arrière.",
    variations: [
      'single leg dumbbell rdl',
      'RDL haltères un jambe',
      'one leg db rdl'
    ]
  },
  "good morning assis": {
    name: "Good morning assis",
    category: "Ischio-jambiers",
    primaryMuscles: [
      'Ischio-jambiers'
    ],
    secondaryMuscles: [
      'Érecteurs du rachis',
      'Fessiers'
    ],
    equipment: "Barre + Banc",
    difficulty: 2,
    description: "Flexion du buste assis jambes fixes pour isoler les ischios. Dos plat, barre sur les trapèzes hautes.",
    variations: [
      'seated good morning',
      'good morning assis',
      'seated gm'
    ]
  },
  "reverse hyperextension": {
    name: "Reverse hyperextension",
    category: "Ischio-jambiers",
    primaryMuscles: [
      'Ischio-jambiers',
      'Fessiers'
    ],
    secondaryMuscles: [
      'Érecteurs du rachis'
    ],
    equipment: "Banc reverse hyper / Machine",
    difficulty: 2,
    description: "Extension de hanche suspendu pour chaîne postérieure sans charge lombaire directe. Montée contrôlée, pas d\'hyperextension lombaire.",
    variations: [
      'reverse hyper',
      'reverse hyperextension',
      'reverse hyper machine'
    ]
  },
  "hip thrust à la smith machine": {
    name: "Hip thrust à la Smith machine",
    category: "Fessiers",
    primaryMuscles: [
      'Grand fessier'
    ],
    secondaryMuscles: [
      'Ischio-jambiers',
      'Quadriceps'
    ],
    equipment: "Smith machine + Banc",
    difficulty: 2,
    description: "Hip thrust guidé pour charger les fessiers en sécurité. Menton rentré, extension complète sans hyperextension lombaire.",
    variations: [
      'smith hip thrust',
      'hip thrust smith',
      'thrust fessier smith'
    ]
  },
  "hip thrust barre lesté": {
    name: "Hip thrust barre lesté",
    category: "Fessiers",
    primaryMuscles: [
      'Grand fessier'
    ],
    secondaryMuscles: [
      'Ischio-jambiers',
      'Quadriceps'
    ],
    equipment: "Barre + Banc",
    difficulty: 2,
    description: "Exercice roi pour l\'hypertrophie fessière avec barre. Pause 1 s en haut, genoux ouverts, regard devant.",
    variations: [
      'barbell hip thrust',
      'hip thrust barre',
      'weighted hip thrust'
    ]
  },
  "abduction machine": {
    name: "Abduction machine",
    category: "Fessiers",
    primaryMuscles: [
      'Fessier moyen'
    ],
    secondaryMuscles: [
      'Tensor fascia lata'
    ],
    equipment: "Machine abduction",
    difficulty: 1,
    description: "Écartement de hanche sur machine pour fessier moyen. Contrôle le retour, ne laisse pas les poids claquer.",
    variations: [
      'hip abduction machine',
      'abduction machine',
      'machine écartement hanche'
    ]
  },
  "abduction poulie": {
    name: "Abduction poulie",
    category: "Fessiers",
    primaryMuscles: [
      'Fessier moyen'
    ],
    secondaryMuscles: [
      'Tensor fascia lata',
      'Core'
    ],
    equipment: "Poulie basse",
    difficulty: 1,
    description: "Écartement debout à la poulie pour tension constante. Buste stable, jambe tendue ou légèrement fléchie.",
    variations: [
      'cable hip abduction',
      'abduction poulie',
      'standing cable abduction'
    ]
  },
  "abduction allongée": {
    name: "Abduction allongée",
    category: "Fessiers",
    primaryMuscles: [
      'Fessier moyen'
    ],
    secondaryMuscles: [
      'Tensor fascia lata'
    ],
    equipment: "Poids du corps / Élastique",
    difficulty: 1,
    description: "Écartement de hanche allongé sur le côté, activation douce du fessier moyen. Genou légèrement fléchi, pied neutre.",
    variations: [
      'lying hip abduction',
      'abduction allongée',
      'side lying leg raise'
    ]
  },
  "kickback poulie": {
    name: "Kickback poulie",
    category: "Fessiers",
    primaryMuscles: [
      'Grand fessier'
    ],
    secondaryMuscles: [
      'Ischio-jambiers'
    ],
    equipment: "Poulie basse",
    difficulty: 1,
    description: "Extension de hanche à la poulie pour isolation fessière. Dos plat, extension sans cambrure lombaire.",
    variations: [
      'cable kickback',
      'kickback poulie',
      'glute kickback cable'
    ]
  },
  "kickback machine": {
    name: "Kickback machine",
    category: "Fessiers",
    primaryMuscles: [
      'Grand fessier'
    ],
    secondaryMuscles: [
      'Ischio-jambiers'
    ],
    equipment: "Machine kickback",
    difficulty: 1,
    description: "Kickback guidé pour cibler le grand fessier sans stabilisation complexe. Serre en fin d\'extension.",
    variations: [
      'glute kickback machine',
      'kickback machine',
      'machine fessier'
    ]
  },
  "hip airplane": {
    name: "Hip airplane",
    category: "Fessiers",
    primaryMuscles: [
      'Grand fessier',
      'Fessier moyen'
    ],
    secondaryMuscles: [
      'Core',
      'Ischio-jambiers'
    ],
    equipment: "Poids du corps",
    difficulty: 4,
    description: "Équilibre unipodal avec rotation thoracique — stabilité hanche avancée. Hanche fixe, rotation lente du buste.",
    variations: [
      'hip airplane',
      'single leg rdl rotation',
      'avion hanche'
    ]
  },
  "step-up haut fessier": {
    name: "Step-up haut fessier",
    category: "Fessiers",
    primaryMuscles: [
      'Grand fessier',
      'Quadriceps'
    ],
    secondaryMuscles: [
      'Ischio-jambiers',
      'Mollets'
    ],
    equipment: "Box haute",
    difficulty: 2,
    description: "Step-up haut avec focus fessier : buste penché, poussée du talon. Pause en haut avant descente contrôlée.",
    variations: [
      'glute focused step up',
      'step-up fessier',
      'high box step up glute'
    ]
  },
  "lateral step-up": {
    name: "Lateral step-up",
    category: "Fessiers",
    primaryMuscles: [
      'Grand fessier',
      'Quadriceps'
    ],
    secondaryMuscles: [
      'Adducteurs',
      'Core'
    ],
    equipment: "Box + Haltères",
    difficulty: 3,
    description: "Montée latérale sur box pour travail frontal du fessier et adducteurs. Genou stable, pas de rotation du bassin.",
    variations: [
      'lateral step up',
      'step-up latéral',
      'side step up'
    ]
  },
  "curtsy lunge": {
    name: "Curtsy lunge",
    category: "Fessiers",
    primaryMuscles: [
      'Grand fessier',
      'Fessier moyen'
    ],
    secondaryMuscles: [
      'Quadriceps',
      'Adducteurs'
    ],
    equipment: "Haltères / Poids du corps",
    difficulty: 2,
    description: "Fente croisée derrière pour fessier moyen et grand fessier. Genou avant suit les orteils, buste vertical.",
    variations: [
      'curtsy lunge',
      'fente curtsy',
      'cross behind lunge'
    ]
  },
  "adduction machine": {
    name: "Adduction machine",
    category: "Adducteurs",
    primaryMuscles: [
      'Adducteurs'
    ],
    secondaryMuscles: [
      'Fessiers',
      'Gracile'
    ],
    equipment: "Machine adduction",
    difficulty: 1,
    description: "Rapprochement de hanche sur machine, base pour renforcer les adducteurs. Amplitude complète sans à-coups.",
    variations: [
      'hip adduction machine',
      'adduction machine',
      'machine adducteurs'
    ]
  },
  "adduction poulie": {
    name: "Adduction poulie",
    category: "Adducteurs",
    primaryMuscles: [
      'Adducteurs'
    ],
    secondaryMuscles: [
      'Fessiers',
      'Core'
    ],
    equipment: "Poulie basse",
    difficulty: 1,
    description: "Adduction debout à la poulie pour tension constante. Buste stable, jambe tendue vers la ligne médiane.",
    variations: [
      'cable hip adduction',
      'adduction poulie',
      'standing adduction cable'
    ]
  },
  "adduction allongée": {
    name: "Adduction allongée",
    category: "Adducteurs",
    primaryMuscles: [
      'Adducteurs'
    ],
    secondaryMuscles: [
      'Fessiers'
    ],
    equipment: "Poids du corps / Élastique",
    difficulty: 1,
    description: "Adduction allongé sur le côté, activation douce pré-réhab ou échauffement. Contrôle la descente.",
    variations: [
      'lying hip adduction',
      'adduction allongée',
      'side lying adduction'
    ]
  },
  "copenhagen dynamique": {
    name: "Copenhagen dynamique",
    category: "Adducteurs",
    primaryMuscles: [
      'Adducteurs'
    ],
    secondaryMuscles: [
      'Fessiers',
      'Core'
    ],
    equipment: "Banc / Box",
    difficulty: 3,
    description: "Planche Copenhagen avec flexion-extension de jambe. Jambe supérieure sur banc, corps aligné, amplitude contrôlée.",
    variations: [
      'dynamic copenhagen',
      'copenhagen dynamique',
      'copenhagen adduction dynamic'
    ]
  },
  "copenhagen hold": {
    name: "Copenhagen hold",
    category: "Adducteurs",
    primaryMuscles: [
      'Adducteurs'
    ],
    secondaryMuscles: [
      'Fessiers',
      'Core',
      'Obliques'
    ],
    equipment: "Banc / Box",
    difficulty: 3,
    description: "Planche latérale jambe sur banc pour adducteurs isométrique. Corps aligné, hanche haute, respiration continue.",
    variations: [
      'copenhagen plank',
      'copenhagen hold',
      'copenhagen adduction hold'
    ]
  },
  "cossack squat profond": {
    name: "Cossack squat profond",
    category: "Adducteurs",
    primaryMuscles: [
      'Adducteurs',
      'Quadriceps'
    ],
    secondaryMuscles: [
      'Fessiers',
      'Mollets'
    ],
    equipment: "Poids du corps / Kettlebell",
    difficulty: 3,
    description: "Squat latéral profond pour mobilité et force des adducteurs. Talon au sol ou relevé selon niveau, dos droit.",
    variations: [
      'deep cossack squat',
      'cossack squat profond',
      'lateral squat deep'
    ]
  },
  "fente latérale profonde": {
    name: "Fente latérale profonde",
    category: "Adducteurs",
    primaryMuscles: [
      'Adducteurs',
      'Quadriceps'
    ],
    secondaryMuscles: [
      'Fessiers',
      'Mollets'
    ],
    equipment: "Haltères / Kettlebell",
    difficulty: 3,
    description: "Fente latérale amplitude maximale pour adducteurs et quadriceps. Buste vertical, charge devant la poitrine.",
    variations: [
      'deep lateral lunge',
      'fente latérale profonde',
      'side lunge deep'
    ]
  },
  "seated calf raise unilatéral": {
    name: "Seated calf raise unilatéral",
    category: "Mollets",
    primaryMuscles: [
      'Soléaire'
    ],
    secondaryMuscles: [
      'Gastrocnémiens'
    ],
    equipment: "Machine mollets assis",
    difficulty: 2,
    description: "Mollets assis unilatéral pour cibler le soléaire. Amplitude complète, pause en haut 1 s.",
    variations: [
      'seated single leg calf raise',
      'mollet assis unilatéral',
      'one leg seated calf raise'
    ]
  },
  "mollet isométrique debout": {
    name: "Mollet isométrique debout",
    category: "Mollets",
    primaryMuscles: [
      'Gastrocnémiens',
      'Soléaire'
    ],
    secondaryMuscles: [
      'Mollets'
    ],
    equipment: "Poids du corps / Marche",
    difficulty: 1,
    description: "Maintien en contraction plantaire debout pour endurance mollet. Talons levés, équilibre stable.",
    variations: [
      'standing calf isometric',
      'mollet isométrique',
      'calf hold standing'
    ]
  },
  "mollet isométrique unilatéral": {
    name: "Mollet isométrique unilatéral",
    category: "Mollets",
    primaryMuscles: [
      'Gastrocnémiens',
      'Soléaire'
    ],
    secondaryMuscles: [
      'Mollets',
      'Cheville'
    ],
    equipment: "Marche / Poids du corps",
    difficulty: 3,
    description: "Maintien unipodal sur pointes pour force et stabilité cheville. Contrôle le bassin, pas de bascule.",
    variations: [
      'single leg calf isometric',
      'mollet iso unilatéral',
      'one leg calf hold'
    ]
  },
  "tibialis raise debout libre": {
    name: "Tibialis raise debout libre",
    category: "Mollets",
    primaryMuscles: [
      'Tibial antérieur'
    ],
    secondaryMuscles: [
      'Extenseurs des orteils'
    ],
    equipment: "Poids du corps",
    difficulty: 1,
    description: "Flexion dorsale debout sans mur pour renforcer le tibial antérieur. Dos au mur optionnel, montée contrôlée.",
    variations: [
      'tibialis raise standing',
      'tibialis raise libre',
      'toe raise standing'
    ]
  },
  "tibialis raise à la machine": {
    name: "Tibialis raise à la machine",
    category: "Mollets",
    primaryMuscles: [
      'Tibial antérieur'
    ],
    secondaryMuscles: [
      'Extenseurs des orteils'
    ],
    equipment: "Machine tibialis",
    difficulty: 1,
    description: "Dorsiflexion guidée sur machine dédiée. Amplitude complète, charge progressive.",
    variations: [
      'tibialis machine',
      'tibialis raise machine',
      'dorsiflexion machine'
    ]
  },
  "tibialis raise unilatéral": {
    name: "Tibialis raise unilatéral",
    category: "Mollets",
    primaryMuscles: [
      'Tibial antérieur'
    ],
    secondaryMuscles: [
      'Cheville',
      'Extenseurs des orteils'
    ],
    equipment: "Poids du corps / Haltère",
    difficulty: 2,
    description: "Tibialis raise une jambe pour corriger les asymétries cheville. Montée lente, pause en haut.",
    variations: [
      'single leg tibialis raise',
      'tibialis unilatéral',
      'one leg dorsiflexion'
    ]
  },
  "marche sur pointes": {
    name: "Marche sur pointes",
    category: "Mollets",
    primaryMuscles: [
      'Gastrocnémiens',
      'Soléaire'
    ],
    secondaryMuscles: [
      'Mollets',
      'Cheville'
    ],
    equipment: "Poids du corps",
    difficulty: 1,
    description: "Marche sur la pointe des pieds pour endurance et stabilité cheville. Petits pas, chevilles stables.",
    variations: [
      'toe walk',
      'marche sur pointes',
      'calf walk'
    ]
  },
  "marche sur talons": {
    name: "Marche sur talons",
    category: "Mollets",
    primaryMuscles: [
      'Tibial antérieur'
    ],
    secondaryMuscles: [
      'Extenseurs des orteils',
      'Cheville'
    ],
    equipment: "Poids du corps",
    difficulty: 1,
    description: "Marche sur les talons, orteils relevés, pour tibial antérieur et prévention shin splints. Genoux souples.",
    variations: [
      'heel walk',
      'marche sur talons',
      'dorsiflexion walk'
    ]
  },
  "short foot": {
    name: "Short foot",
    category: "Mollets",
    primaryMuscles: [
      'Intrinsèques du pied',
      'Voûte plantaire'
    ],
    secondaryMuscles: [
      'Tibial postérieur'
    ],
    equipment: "Aucun",
    difficulty: 1,
    description: "Activation de la voûte plantaire sans flexer les orteils. « Raccourcis » le pied, maintiens 5–10 s.",
    variations: [
      'short foot exercise',
      'short foot',
      'pied court'
    ]
  },
  "cable crunch à genoux": {
    name: "Cable crunch à genoux",
    category: "Abdominaux",
    primaryMuscles: [
      'Grand droit de l\'abdomen'
    ],
    secondaryMuscles: [
      'Obliques'
    ],
    equipment: "Poulie haute",
    difficulty: 2,
    description: "Crunch à genoux à la poulie pour flexion du tronc sous charge. Arrondis le dos, coudes vers les genoux.",
    variations: [
      'kneeling cable crunch',
      'crunch poulie genoux',
      'cable ab crunch'
    ]
  },
  "ab wheel depuis les genoux lesté": {
    name: "Ab wheel depuis les genoux lesté",
    category: "Abdominaux",
    primaryMuscles: [
      'Grand droit de l\'abdomen',
      'Transverse'
    ],
    secondaryMuscles: [
      'Grand dorsal',
      'Deltoïdes'
    ],
    equipment: "Roue abdominale + Gilet",
    difficulty: 4,
    description: "Rollout depuis les genoux avec charge pour progression vers les pieds. Ne cambre pas les lombaires en extension.",
    variations: [
      'weighted kneeling ab wheel',
      'roue abdominale genoux lesté',
      'ab wheel weighted knees'
    ]
  },
  "ab wheel depuis les pieds": {
    name: "Ab wheel depuis les pieds",
    category: "Abdominaux",
    primaryMuscles: [
      'Grand droit de l\'abdomen',
      'Transverse'
    ],
    secondaryMuscles: [
      'Grand dorsal',
      'Deltoïdes',
      'Fessiers'
    ],
    equipment: "Roue abdominale",
    difficulty: 4,
    description: "Rollout complet depuis les pieds, niveau avancé anti-extension. Serre les fessiers, bras tendus, amplitude contrôlée.",
    variations: [
      'standing ab wheel',
      'ab wheel from feet',
      'roue abdominale pieds'
    ]
  },
  "body saw": {
    name: "Body saw",
    category: "Abdominaux",
    primaryMuscles: [
      'Grand droit de l\'abdomen',
      'Transverse'
    ],
    secondaryMuscles: [
      'Deltoïdes',
      'Fessiers'
    ],
    equipment: "Gliders / Chaussettes",
    difficulty: 3,
    description: "Planche avec glissement avant-arrière pour anti-extension dynamique. Corps rigide, ne laisse pas les hanches s\'affaisser.",
    variations: [
      'body saw',
      'plank saw',
      'scie corporelle'
    ]
  },
  "rkc plank": {
    name: "RKC plank",
    category: "Abdominaux",
    primaryMuscles: [
      'Transverse',
      'Grand droit de l\'abdomen'
    ],
    secondaryMuscles: [
      'Fessiers',
      'Deltoïdes'
    ],
    equipment: "Poids du corps",
    difficulty: 3,
    description: "Planche maximale : fessiers et quadriceps contractés, coudes légèrement avancés. Respiration courte, tension totale.",
    variations: [
      'rkc plank',
      'planche rkc',
      'hardstyle plank'
    ]
  },
  "long lever plank": {
    name: "Long lever plank",
    category: "Abdominaux",
    primaryMuscles: [
      'Grand droit de l\'abdomen',
      'Transverse'
    ],
    secondaryMuscles: [
      'Deltoïdes',
      'Fessiers'
    ],
    equipment: "Poids du corps",
    difficulty: 3,
    description: "Planche avant-bras avec bras avancés pour levier maximal. Corps aligné, bassin neutre.",
    variations: [
      'long lever plank',
      'planche levier long',
      'extended arm plank'
    ]
  },
  "hollow body rocks": {
    name: "Hollow body rocks",
    category: "Abdominaux",
    primaryMuscles: [
      'Grand droit de l\'abdomen',
      'Transverse'
    ],
    secondaryMuscles: [
      'Fléchisseurs de hanche',
      'Quadriceps'
    ],
    equipment: "Poids du corps",
    difficulty: 3,
    description: "Position hollow avec oscillations avant-arrière. Bas du dos plaqué au sol, bras et jambes tendus.",
    variations: [
      'hollow body rocks',
      'hollow rocks',
      'oscillations hollow'
    ]
  },
  "v-ups": {
    name: "V-ups",
    category: "Abdominaux",
    primaryMuscles: [
      'Grand droit de l\'abdomen'
    ],
    secondaryMuscles: [
      'Fléchisseurs de hanche',
      'Quadriceps'
    ],
    equipment: "Poids du corps",
    difficulty: 3,
    description: "Montée simultanée buste et jambes pour toucher les pieds. Mouvement contrôlé, pas d\'élan.",
    variations: [
      'v-ups',
      'v ups',
      'jackknife sit up'
    ]
  },
  "sit-up lesté": {
    name: "Sit-up lesté",
    category: "Abdominaux",
    primaryMuscles: [
      'Grand droit de l\'abdomen'
    ],
    secondaryMuscles: [
      'Fléchisseurs de hanche'
    ],
    equipment: "Disque / Haltère",
    difficulty: 2,
    description: "Relevé de buste avec charge contre la poitrine. Pieds calés, montée contrôlée sans tirer sur la nuque.",
    variations: [
      'weighted sit up',
      'sit-up lesté',
      'loaded sit up'
    ]
  },
  "suitcase hold": {
    name: "Suitcase hold",
    category: "Abdominaux",
    primaryMuscles: [
      'Obliques',
      'Transverse'
    ],
    secondaryMuscles: [
      'Érecteurs du rachis',
      'Quadratus lumborum'
    ],
    equipment: "Haltère / Kettlebell",
    difficulty: 3,
    description: "Maintien isométrique charge unilatérale debout — anti-flexion latérale. Buste vertical, ne pencher pas du côté opposé.",
    variations: [
      'suitcase hold',
      'tenue valise',
      'unilateral hold'
    ]
  },
  "anti-rotation hold à la poulie": {
    name: "Anti-rotation hold à la poulie",
    category: "Abdominaux",
    primaryMuscles: [
      'Obliques',
      'Transverse'
    ],
    secondaryMuscles: [
      'Grand droit de l\'abdomen',
      'Deltoïdes'
    ],
    equipment: "Poulie + Poignée",
    difficulty: 2,
    description: "Pallof press isométrique ou hold : résiste à la rotation. Bras tendus devant la poitrine, bassin fixe.",
    variations: [
      'anti rotation hold',
      'pallof hold',
      'tenue anti-rotation poulie'
    ]
  },
  "side bend poulie": {
    name: "Side bend poulie",
    category: "Abdominaux",
    primaryMuscles: [
      'Obliques'
    ],
    secondaryMuscles: [
      'Quadratus lumborum',
      'Transverse'
    ],
    equipment: "Poulie basse",
    difficulty: 1,
    description: "Flexion latérale à la poulie pour obliques. Mouvement contrôlé, pas de rotation du buste.",
    variations: [
      'cable side bend',
      'side bend poulie',
      'oblique cable bend'
    ]
  },
  "hanging knee raise lesté": {
    name: "Hanging knee raise lesté",
    category: "Abdominaux",
    primaryMuscles: [
      'Grand droit de l\'abdomen',
      'Fléchisseurs de hanche'
    ],
    secondaryMuscles: [
      'Avant-bras',
      'Grand dorsal'
    ],
    equipment: "Barre de traction + Lest",
    difficulty: 3,
    description: "Relevé de genoux suspendu avec charge entre les pieds ou gilet. Évite le balancement, montée contrôlée.",
    variations: [
      'weighted hanging knee raise',
      'relevé genoux lesté',
      'knee raise weighted'
    ]
  },
  "toes-to-bar strict": {
    name: "Toes-to-bar strict",
    category: "Abdominaux",
    primaryMuscles: [
      'Grand droit de l\'abdomen',
      'Fléchisseurs de hanche'
    ],
    secondaryMuscles: [
      'Grand dorsal',
      'Avant-bras'
    ],
    equipment: "Barre de traction",
    difficulty: 4,
    description: "Montée des pieds à la barre sans kip ni élan. Corps gainé, flexion de hanche et de tronc strictes.",
    variations: [
      'strict toes to bar',
      'toes to bar strict',
      'ttb strict'
    ]
  },
  "windshield wipers strictes": {
    name: "Windshield wipers strictes",
    category: "Abdominaux",
    primaryMuscles: [
      'Obliques',
      'Grand droit de l\'abdomen'
    ],
    secondaryMuscles: [
      'Fléchisseurs de hanche',
      'Grand dorsal'
    ],
    equipment: "Barre de traction",
    difficulty: 4,
    description: "Jambes suspendues rotation latérale stricte sans élan. Contrôle chaque degré, pas de momentum.",
    variations: [
      'strict windshield wipers',
      'windshield wipers strict',
      'essuie-glaces strictes'
    ]
  },
  "dead hang": {
    name: "Dead hang",
    category: "Avant-bras",
    primaryMuscles: [
      'Fléchisseurs des doigts',
      'Brachio-radial'
    ],
    secondaryMuscles: [
      'Grand dorsal',
      'Épaules'
    ],
    equipment: "Barre de traction",
    difficulty: 2,
    description: "Suspension passive ou active pour force de grip et mobilité d\'épaule. Épaules en dépression légère, respiration nasale.",
    variations: [
      'dead hang',
      'suspension passive',
      'bar hang'
    ]
  },
  "dead hang lesté": {
    name: "Dead hang lesté",
    category: "Avant-bras",
    primaryMuscles: [
      'Fléchisseurs des doigts',
      'Brachio-radial'
    ],
    secondaryMuscles: [
      'Grand dorsal',
      'Épaules'
    ],
    equipment: "Barre + Lest",
    difficulty: 3,
    description: "Suspension avec ceinture ou gilet pour progresser vers le one-arm hang. Maintien sans douleur coude.",
    variations: [
      'weighted dead hang',
      'dead hang lesté',
      'loaded hang'
    ]
  },
  "dead hang une main assisté": {
    name: "Dead hang une main assisté",
    category: "Avant-bras",
    primaryMuscles: [
      'Fléchisseurs des doigts',
      'Brachio-radial'
    ],
    secondaryMuscles: [
      'Épaules',
      'Core'
    ],
    equipment: "Barre + Support",
    difficulty: 3,
    description: "Progression vers le hang unilatéral avec assistance de l\'autre main ou élastique. Épaule active, grip ferme.",
    variations: [
      'assisted one arm hang',
      'dead hang un bras assisté',
      'one arm hang assisted'
    ]
  },
  "towel hang": {
    name: "Towel hang",
    category: "Avant-bras",
    primaryMuscles: [
      'Fléchisseurs des doigts',
      'Fléchisseurs profonds'
    ],
    secondaryMuscles: [
      'Brachio-radial'
    ],
    equipment: "Barre + Serviette",
    difficulty: 3,
    description: "Suspension sur serviette pour grip de force. Serre fort, épaules en dépression.",
    variations: [
      'towel hang',
      'serviette hang',
      'towel grip hang'
    ]
  },
  "towel hang une main assisté": {
    name: "Towel hang une main assisté",
    category: "Avant-bras",
    primaryMuscles: [
      'Fléchisseurs des doigts'
    ],
    secondaryMuscles: [
      'Brachio-radial',
      'Épaules'
    ],
    equipment: "Barre + Serviette",
    difficulty: 4,
    description: "Towel hang unilatéral assisté, niveau avancé de grip. Progression très graduelle.",
    variations: [
      'assisted one arm towel hang',
      'towel hang un bras',
      'one arm towel hang'
    ]
  },
  "plate pinch hold": {
    name: "Plate pinch hold",
    category: "Avant-bras",
    primaryMuscles: [
      'Fléchisseurs des doigts',
      'Adducteurs du pouce'
    ],
    secondaryMuscles: [
      'Brachio-radial'
    ],
    equipment: "Disques",
    difficulty: 3,
    description: "Pinch hold entre deux disques lisses. Pouce actif, maintien sans glissement.",
    variations: [
      'plate pinch hold',
      'pinch grip hold',
      'tenue pinch disques'
    ]
  },
  "gripper": {
    name: "Gripper",
    category: "Avant-bras",
    primaryMuscles: [
      'Fléchisseurs des doigts'
    ],
    secondaryMuscles: [
      'Fléchisseurs profonds'
    ],
    equipment: "Gripper / Main gripper",
    difficulty: 2,
    description: "Fermeture répétée d\'un gripper pour force de serrage. Amplitude complète, pause 1 s en fermé.",
    variations: [
      'hand gripper',
      'gripper closes',
      'captains of crush'
    ]
  },
  "gripper hold": {
    name: "Gripper hold",
    category: "Avant-bras",
    primaryMuscles: [
      'Fléchisseurs des doigts'
    ],
    secondaryMuscles: [
      'Fléchisseurs profonds'
    ],
    equipment: "Gripper",
    difficulty: 3,
    description: "Maintien isométrique gripper fermé au maximum. Durée selon résistance du gripper.",
    variations: [
      'gripper hold',
      'gripper isometric',
      'tenue gripper'
    ]
  },
  "fat grip hold": {
    name: "Fat grip hold",
    category: "Avant-bras",
    primaryMuscles: [
      'Fléchisseurs des doigts',
      'Brachio-radial'
    ],
    secondaryMuscles: [
      'Avant-bras'
    ],
    equipment: "Barre fat grip / Manchons",
    difficulty: 3,
    description: "Maintien ou farmer walk avec barre épaisse pour grip. Poignet neutre, prise ferme.",
    variations: [
      'fat grip hold',
      'thick bar hold',
      'tenue fat grip'
    ]
  },
  "farmer\'s carry": {
    name: "Farmer\'s carry",
    category: "Carries",
    primaryMuscles: [
      'Fléchisseurs des doigts',
      'Trapèzes'
    ],
    secondaryMuscles: [
      'Core',
      'Mollets',
      'Érecteurs du rachis'
    ],
    equipment: "Haltères / Trap bar",
    difficulty: 2,
    description: "Marche avec charge lourde dans chaque main. Épaules basses, pas courts, grip ferme jusqu\'à la fin.",
    variations: [
      'farmer\'s carry',
      'farmers walk',
      'marche du fermier',
      'loaded carry'
    ]
  },
  "suitcase carry": {
    name: "Suitcase carry",
    category: "Carries",
    primaryMuscles: [
      'Obliques',
      'Quadratus lumborum'
    ],
    secondaryMuscles: [
      'Fléchisseurs des doigts',
      'Trapèzes'
    ],
    equipment: "Haltère / Kettlebell",
    difficulty: 3,
    description: "Marche avec charge unilatérale — anti-flexion latérale dynamique. Buste vertical, ne compenser pas en penchant.",
    variations: [
      'suitcase carry',
      'single arm carry',
      'marche valise'
    ]
  },
  "waiter\'s carry": {
    name: "Waiter\'s carry",
    category: "Carries",
    primaryMuscles: [
      'Deltoïdes',
      'Trapèzes supérieurs'
    ],
    secondaryMuscles: [
      'Core',
      'Triceps'
    ],
    equipment: "Haltère / Kettlebell",
    difficulty: 3,
    description: "Marche avec charge overhead un bras, comme un plateau. Coude verrouillé, core serré.",
    variations: [
      'waiter\'s carry',
      'waiter walk',
      'overhead unilateral carry'
    ]
  },
  "overhead carry": {
    name: "Overhead carry",
    category: "Carries",
    primaryMuscles: [
      'Deltoïdes',
      'Trapèzes supérieurs'
    ],
    secondaryMuscles: [
      'Core',
      'Triceps',
      'Érecteurs du rachis'
    ],
    equipment: "Barre / Haltères",
    difficulty: 3,
    description: "Marche charge au-dessus de la tête, stabilité d\'épaule et core maximale. Regard droit, ribs down.",
    variations: [
      'overhead carry',
      'oh carry',
      'marche overhead'
    ]
  },
  "front rack carry": {
    name: "Front rack carry",
    category: "Carries",
    primaryMuscles: [
      'Deltoïdes antérieurs',
      'Core'
    ],
    secondaryMuscles: [
      'Trapèzes',
      'Quadriceps'
    ],
    equipment: "Barre / Kettlebells",
    difficulty: 3,
    description: "Marche en rack avant (barre ou KBs). Coudes hauts, thorax ouvert, pas courts.",
    variations: [
      'front rack carry',
      'front carry',
      'marche rack avant'
    ]
  },
  "bear hug carry": {
    name: "Bear hug carry",
    category: "Carries",
    primaryMuscles: [
      'Grand dorsal',
      'Biceps',
      'Core'
    ],
    secondaryMuscles: [
      'Deltoïdes',
      'Érecteurs du rachis'
    ],
    equipment: "Sandbag / Sac lourd",
    difficulty: 3,
    description: "Port du sac en bear hug contre la poitrine. Serre fort, ne laisse pas le sac glisser.",
    variations: [
      'bear hug carry',
      'sandbag carry',
      'marche bear hug'
    ]
  },
  "zercher carry": {
    name: "Zercher carry",
    category: "Carries",
    primaryMuscles: [
      'Biceps',
      'Core',
      'Érecteurs du rachis'
    ],
    secondaryMuscles: [
      'Quadriceps',
      'Grand dorsal'
    ],
    equipment: "Barre",
    difficulty: 3,
    description: "Marche barre en position Zercher (coude). Buste vertical, core maximal, pas contrôlés.",
    variations: [
      'zercher carry',
      'marche zercher',
      'zercher walk'
    ]
  },
  "broad jump": {
    name: "Broad jump",
    category: "Puissance",
    primaryMuscles: [
      'Quadriceps',
      'Fessiers'
    ],
    secondaryMuscles: [
      'Mollets',
      'Core'
    ],
    equipment: "Poids du corps",
    difficulty: 3,
    description: "Saut horizontal maximal depuis squat demi-amplitude. Atterrissage souple genoux fléchis, mesure la distance.",
    variations: [
      'broad jump',
      'standing long jump',
      'saut en longueur'
    ]
  },
  "tuck jump": {
    name: "Tuck jump",
    category: "Puissance",
    primaryMuscles: [
      'Quadriceps',
      'Fessiers'
    ],
    secondaryMuscles: [
      'Mollets',
      'Core'
    ],
    equipment: "Poids du corps",
    difficulty: 3,
    description: "Saut vertical genoux poitrine en l\'air. Atterrissage contrôlé, enchaîne sans pause longue.",
    variations: [
      'tuck jump',
      'saut groupé',
      'knee tuck jump'
    ]
  },
  "skater jump": {
    name: "Skater jump",
    category: "Puissance",
    primaryMuscles: [
      'Fessiers',
      'Quadriceps'
    ],
    secondaryMuscles: [
      'Adducteurs',
      'Mollets'
    ],
    equipment: "Poids du corps",
    difficulty: 2,
    description: "Saut latéral alterné type patineur. Atterrissage sur une jambe, bassin stable.",
    variations: [
      'skater jump',
      'lateral bound',
      'saut patineur'
    ]
  },
  "split jump": {
    name: "Split jump",
    category: "Puissance",
    primaryMuscles: [
      'Quadriceps',
      'Fessiers'
    ],
    secondaryMuscles: [
      'Mollets',
      'Core'
    ],
    equipment: "Poids du corps",
    difficulty: 3,
    description: "Fente sautée alternée en l\'air. Switch des jambes mid-air, atterrissage en fente profonde.",
    variations: [
      'split jump',
      'jumping lunge',
      'fente sautée'
    ]
  },
  "depth jump": {
    name: "Depth jump",
    category: "Puissance",
    primaryMuscles: [
      'Quadriceps',
      'Fessiers'
    ],
    secondaryMuscles: [
      'Mollets',
      'Tendons'
    ],
    equipment: "Box",
    difficulty: 4,
    description: "Chute depuis box puis saut vertical immédiat (réactif). Contact sol minimal, genoux stables.",
    variations: [
      'depth jump',
      'drop jump reactive',
      'saut profondeur'
    ]
  },
  "bounding": {
    name: "Bounding",
    category: "Puissance",
    primaryMuscles: [
      'Fessiers',
      'Quadriceps'
    ],
    secondaryMuscles: [
      'Mollets',
      'Ischio-jambiers'
    ],
    equipment: "Poids du corps",
    difficulty: 3,
    description: "Enchaînement de foulées bondissantes pour puissance horizontale. Amplitude genou haute, poussée explosive.",
    variations: [
      'bounding',
      'power bounds',
      'foulées bondissantes'
    ]
  },
  "plyometric push-up": {
    name: "Plyometric push-up",
    category: "Puissance",
    primaryMuscles: [
      'Pectoraux',
      'Triceps'
    ],
    secondaryMuscles: [
      'Deltoïdes antérieurs',
      'Core'
    ],
    equipment: "Poids du corps",
    difficulty: 3,
    description: "Pompes explosives mains décollent du sol. Atterrissage souple, corps gainé.",
    variations: [
      'plyometric push up',
      'explosive push up',
      'pompes pliométriques'
    ]
  },
  "depth push-up": {
    name: "Depth push-up",
    category: "Puissance",
    primaryMuscles: [
      'Pectoraux',
      'Triceps'
    ],
    secondaryMuscles: [
      'Deltoïdes',
      'Core'
    ],
    equipment: "Box / Parallettes",
    difficulty: 4,
    description: "Mains sur box, chute contrôlée puis poussée explosive. Progression avancée pliométrie haut du corps.",
    variations: [
      'depth push up',
      'drop push up',
      'pompes profondeur'
    ]
  },
  "medicine ball slam": {
    name: "Medicine ball slam",
    category: "Puissance",
    primaryMuscles: [
      'Grand dorsal',
      'Core',
      'Deltoïdes'
    ],
    secondaryMuscles: [
      'Triceps',
      'Fessiers'
    ],
    equipment: "Medecine ball",
    difficulty: 2,
    description: "Slam overhead au sol avec med ball. Extension complète puis slam violent en engageant le core.",
    variations: [
      'med ball slam',
      'medicine ball slam',
      'slam medecine ball'
    ]
  },
  "medicine ball chest throw": {
    name: "Medicine ball chest throw",
    category: "Puissance",
    primaryMuscles: [
      'Pectoraux',
      'Triceps'
    ],
    secondaryMuscles: [
      'Deltoïdes antérieurs',
      'Core'
    ],
    equipment: "Medecine ball + Mur",
    difficulty: 2,
    description: "Lancer poitrine contre mur en extension explosive. Recule pour amortir la réception.",
    variations: [
      'med ball chest throw',
      'chest pass med ball',
      'lancer poitrine med ball'
    ]
  },
  "medicine ball rotational throw": {
    name: "Medicine ball rotational throw",
    category: "Puissance",
    primaryMuscles: [
      'Obliques',
      'Grand dorsal'
    ],
    secondaryMuscles: [
      'Core',
      'Deltoïdes'
    ],
    equipment: "Medecine ball + Mur",
    difficulty: 3,
    description: "Lancer rotatif depuis hanche contre mur. Rotation puissante depuis le sol, bras relâché puis explosif.",
    variations: [
      'rotational med ball throw',
      'lancer rotatif med ball',
      'med ball side throw'
    ]
  },
  "medicine ball overhead throw": {
    name: "Medicine ball overhead throw",
    category: "Puissance",
    primaryMuscles: [
      'Deltoïdes',
      'Triceps',
      'Core'
    ],
    secondaryMuscles: [
      'Grand dorsal',
      'Fessiers'
    ],
    equipment: "Medecine ball",
    difficulty: 3,
    description: "Lancer overhead vers l\'arrière ou au-dessus. Extension triple hanche-genou-cheville.",
    variations: [
      'overhead med ball throw',
      'lancer overhead med ball',
      'backward med ball throw'
    ]
  },
  "power clean": {
    name: "Power clean",
    category: "Haltérophilie",
    primaryMuscles: [
      'Quadriceps',
      'Fessiers',
      'Trapèzes'
    ],
    secondaryMuscles: [
      'Grand dorsal',
      'Deltoïdes',
      'Core'
    ],
    equipment: "Barre",
    difficulty: 4,
    description: "Épaulé depuis le sol avec réception en squat partiel. 2e tirage explosif, coudes hauts en réception.",
    variations: [
      'power clean',
      'épaulé-jeté power',
      'clean power'
    ]
  },
  "hang power clean": {
    name: "Hang power clean",
    category: "Haltérophilie",
    primaryMuscles: [
      'Quadriceps',
      'Fessiers',
      'Trapèzes'
    ],
    secondaryMuscles: [
      'Grand dorsal',
      'Deltoïdes'
    ],
    equipment: "Barre",
    difficulty: 4,
    description: "Power clean depuis hang (genoux), sans 1er tirage. Hinge puis extension violente.",
    variations: [
      'hang power clean',
      'hang clean power',
      'épaulé hang power'
    ]
  },
  "clean": {
    name: "Clean",
    category: "Haltérophilie",
    primaryMuscles: [
      'Quadriceps',
      'Fessiers',
      'Trapèzes'
    ],
    secondaryMuscles: [
      'Grand dorsal',
      'Deltoïdes',
      'Core'
    ],
    equipment: "Barre",
    difficulty: 4,
    description: "Épaulé complet avec réception en squat profond. Technique olympique complète.",
    variations: [
      'squat clean',
      'clean',
      'épaulé complet'
    ]
  },
  "clean & jerk": {
    name: "Clean & jerk",
    category: "Haltérophilie",
    primaryMuscles: [
      'Quadriceps',
      'Deltoïdes',
      'Triceps'
    ],
    secondaryMuscles: [
      'Fessiers',
      'Trapèzes',
      'Core'
    ],
    equipment: "Barre",
    difficulty: 4,
    description: "Enchaînement épaulé + jeté, mouvement olympique complet. Split ou power jerk selon niveau.",
    variations: [
      'clean and jerk',
      'clean & jerk',
      'épaulé-jeté'
    ]
  },
  "power snatch": {
    name: "Power snatch",
    category: "Haltérophilie",
    primaryMuscles: [
      'Deltoïdes',
      'Trapèzes',
      'Fessiers'
    ],
    secondaryMuscles: [
      'Quadriceps',
      'Grand dorsal'
    ],
    equipment: "Barre",
    difficulty: 4,
    description: "Arraché avec réception en squat partiel, prise large. Barre près du corps en 2e tirage.",
    variations: [
      'power snatch',
      'arraché power',
      'snatch power'
    ]
  },
  "hang power snatch": {
    name: "Hang power snatch",
    category: "Haltérophilie",
    primaryMuscles: [
      'Deltoïdes',
      'Trapèzes',
      'Fessiers'
    ],
    secondaryMuscles: [
      'Quadriceps',
      'Grand dorsal'
    ],
    equipment: "Barre",
    difficulty: 4,
    description: "Arraché power depuis hang. Contact hanche-cuisse, bras tendus en tirage.",
    variations: [
      'hang power snatch',
      'hang snatch power',
      'arraché hang power'
    ]
  },
  "snatch": {
    name: "Snatch",
    category: "Haltérophilie",
    primaryMuscles: [
      'Deltoïdes',
      'Trapèzes',
      'Fessiers'
    ],
    secondaryMuscles: [
      'Quadriceps',
      'Grand dorsal',
      'Core'
    ],
    equipment: "Barre",
    difficulty: 4,
    description: "Arraché complet réception squat profond. Mouvement le plus technique de l\'haltéro.",
    variations: [
      'squat snatch',
      'snatch',
      'arraché complet'
    ]
  },
  "clean pull": {
    name: "Clean pull",
    category: "Haltérophilie",
    primaryMuscles: [
      'Fessiers',
      'Trapèzes',
      'Grand dorsal'
    ],
    secondaryMuscles: [
      'Quadriceps',
      'Ischio-jambiers'
    ],
    equipment: "Barre",
    difficulty: 3,
    description: "Tirage d\'épaulé sans réception — travail technique et puissance. Extension complète sur pointes.",
    variations: [
      'clean pull',
      'tirage épaulé',
      'pull clean'
    ]
  },
  "snatch pull": {
    name: "Snatch pull",
    category: "Haltérophilie",
    primaryMuscles: [
      'Trapèzes',
      'Fessiers',
      'Grand dorsal'
    ],
    secondaryMuscles: [
      'Deltoïdes',
      'Quadriceps'
    ],
    equipment: "Barre",
    difficulty: 3,
    description: "Tirage d\'arraché sans réception. Prise large, coude haut en fin de tirage.",
    variations: [
      'snatch pull',
      'tirage arraché',
      'pull snatch'
    ]
  },
  "high pull": {
    name: "High pull",
    category: "Haltérophilie",
    primaryMuscles: [
      'Trapèzes',
      'Deltoïdes'
    ],
    secondaryMuscles: [
      'Grand dorsal',
      'Fessiers',
      'Quadriceps'
    ],
    equipment: "Barre / Haltères",
    difficulty: 3,
    description: "Tirage vertical explosif coude haut, sans réception. Hinge puis extension violente.",
    variations: [
      'high pull',
      'tirage haut',
      'barbell high pull'
    ]
  },
  "thruster barre": {
    name: "Thruster barre",
    category: "Haltérophilie",
    primaryMuscles: [
      'Quadriceps',
      'Deltoïdes',
      'Triceps'
    ],
    secondaryMuscles: [
      'Fessiers',
      'Core'
    ],
    equipment: "Barre",
    difficulty: 3,
    description: "Front squat enchaîné avec push press sans pause. Un mouvement fluide squat-to-overhead.",
    variations: [
      'barbell thruster',
      'thruster barre',
      'thruster'
    ]
  },
  "thruster haltères": {
    name: "Thruster haltères",
    category: "Haltérophilie",
    primaryMuscles: [
      'Quadriceps',
      'Deltoïdes',
      'Triceps'
    ],
    secondaryMuscles: [
      'Fessiers',
      'Core'
    ],
    equipment: "Haltères",
    difficulty: 3,
    description: "Thruster avec haltères, squat puis développé. Poignées neutres ou pronation selon confort.",
    variations: [
      'dumbbell thruster',
      'thruster haltères',
      'db thruster'
    ]
  },
  "back extension": {
    name: "Back extension",
    category: "Dorsaux",
    primaryMuscles: [
      'Érecteurs du rachis',
      'Grand dorsal'
    ],
    secondaryMuscles: [
      'Fessiers',
      'Ischio-jambiers'
    ],
    equipment: "Banc 45° / GHD",
    difficulty: 1,
    description: "Extension de tronc sur banc 45° pour lombaires et chaîne postérieure. Ne hyperétends pas, monte jusqu\'alignement.",
    variations: [
      'back extension',
      'hyperextension',
      'extension lombaire'
    ]
  },
  "back extension lestée": {
    name: "Back extension lestée",
    category: "Dorsaux",
    primaryMuscles: [
      'Érecteurs du rachis'
    ],
    secondaryMuscles: [
      'Fessiers',
      'Grand dorsal',
      'Ischio-jambiers'
    ],
    equipment: "Banc 45° + Disque",
    difficulty: 2,
    description: "Back extension avec disque contre la poitrine. Montée contrôlée, disque serré.",
    variations: [
      'weighted back extension',
      'back extension lestée',
      'hyperextension lestée'
    ]
  },
  "jefferson curl": {
    name: "Jefferson curl",
    category: "Ischio-jambiers",
    primaryMuscles: [
      'Ischio-jambiers',
      'Érecteurs du rachis'
    ],
    secondaryMuscles: [
      'Fessiers',
      'Mollets'
    ],
    equipment: "Barre légère / Kettlebell",
    difficulty: 3,
    description: "Flexion vertébrale segmentée debout, charge légère. Arrondis vertèbre par vertèbre, remonte lentement.",
    variations: [
      'jefferson curl',
      'curl jefferson',
      'flexion jefferson'
    ]
  },
  "good morning barre": {
    name: "Good morning barre",
    category: "Ischio-jambiers",
    primaryMuscles: [
      'Ischio-jambiers',
      'Érecteurs du rachis'
    ],
    secondaryMuscles: [
      'Fessiers',
      'Grand dorsal'
    ],
    equipment: "Barre",
    difficulty: 3,
    description: "Hinge buste avec barre sur les trapèzes. Dos plat, fessiers en arrière, sensation ischios en bas.",
    variations: [
      'barbell good morning',
      'good morning barre',
      'gm barre'
    ]
  },
  "good morning haltères": {
    name: "Good morning haltères",
    category: "Ischio-jambiers",
    primaryMuscles: [
      'Ischio-jambiers',
      'Érecteurs du rachis'
    ],
    secondaryMuscles: [
      'Fessiers'
    ],
    equipment: "Haltères",
    difficulty: 2,
    description: "Good morning avec haltères sur les épaules. Même technique que barre, charge modérée.",
    variations: [
      'dumbbell good morning',
      'good morning haltères',
      'gm haltères'
    ]
  },
  "hip hinge élastique": {
    name: "Hip hinge élastique",
    category: "Ischio-jambiers",
    primaryMuscles: [
      'Ischio-jambiers',
      'Fessiers'
    ],
    secondaryMuscles: [
      'Érecteurs du rachis',
      'Core'
    ],
    equipment: "Bande élastique",
    difficulty: 1,
    description: "Apprentissage du hinge avec élastique en resistance. Push fessiers en arrière, dos plat.",
    variations: [
      'band hip hinge',
      'hip hinge élastique',
      'hinge bande'
    ]
  },
  "kettlebell clean": {
    name: "Kettlebell clean",
    category: "Puissance",
    primaryMuscles: [
      'Fessiers',
      'Grand dorsal',
      'Deltoïdes'
    ],
    secondaryMuscles: [
      'Quadriceps',
      'Trapèzes',
      'Core'
    ],
    equipment: "Kettlebell",
    difficulty: 3,
    description: "Épaulé kettlebell en un mouvement fluide vers rack. Hanche explosive, coude près du corps.",
    variations: [
      'kb clean',
      'kettlebell clean',
      'clean kettlebell'
    ]
  },
  "kettlebell clean & press": {
    name: "Kettlebell clean & press",
    category: "Puissance",
    primaryMuscles: [
      'Deltoïdes',
      'Triceps',
      'Fessiers'
    ],
    secondaryMuscles: [
      'Quadriceps',
      'Core',
      'Grand dorsal'
    ],
    equipment: "Kettlebell",
    difficulty: 4,
    description: "Clean enchaîné avec push press kettlebell. Rack solide avant la poussée overhead.",
    variations: [
      'kb clean and press',
      'kettlebell clean press',
      'clean & press kb'
    ]
  },
  "kettlebell snatch": {
    name: "Kettlebell snatch",
    category: "Puissance",
    primaryMuscles: [
      'Deltoïdes',
      'Trapèzes',
      'Fessiers'
    ],
    secondaryMuscles: [
      'Grand dorsal',
      'Quadriceps',
      'Core'
    ],
    equipment: "Kettlebell",
    difficulty: 4,
    description: "Arraché kettlebell overhead en un temps. Punch overhead pour éviter l\'ecchymose poignet.",
    variations: [
      'kb snatch',
      'kettlebell snatch',
      'arraché kettlebell'
    ]
  }
};
