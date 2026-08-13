/** Données brutes pour generateExerciseBankEnrichment.mjs */

function ex(name, unit, stars, coeff, meta) {
  return { name, unit, stars, coeff, ...meta };
}

export const EXERCISE_DATA = [
  // ── PECTORAUX (11) ──
  ex('Développé couché à la Smith machine', 'reps', 3, 0.95, {
    muscleGroup: 'Pectoraux', category: 'Pectoraux', equipment: 'Smith machine + Banc',
    primaryMuscles: ['Pectoraux'], secondaryMuscles: ['Triceps', 'Deltoïdes antérieurs'],
    description: 'Développé guidé sur rails pour isoler la poussée horizontale sans stabilisation latérale. Garde les omoplates serrées et descends jusqu\'à effleurer la poitrine.',
    variations: ['smith bench press', 'dc smith', 'développé smith']
  }),
  ex('Développé incliné à la Smith machine', 'reps', 4, 1.05, {
    muscleGroup: 'Pectoraux', category: 'Pectoraux', equipment: 'Smith machine + Banc incliné',
    primaryMuscles: ['Pectoraux supérieurs'], secondaryMuscles: ['Triceps', 'Deltoïdes antérieurs'],
    description: 'Cible le haut des pectoraux sur banc incliné 15–30° avec trajectoire fixe. Ne laisse pas les épaules monter en fin de poussée.',
    variations: ['incline smith press', 'di smith', 'smith incline bench']
  }),
  ex('Développé décliné à la Smith machine', 'reps', 3, 0.95, {
    muscleGroup: 'Pectoraux', category: 'Pectoraux', equipment: 'Smith machine + Banc décliné',
    primaryMuscles: ['Pectoraux inférieurs'], secondaryMuscles: ['Triceps', 'Deltoïdes antérieurs'],
    description: 'Accentue la portion inférieure des pectoraux en décliné modéré. Pieds bien calés, barre vers le bas du sternum.',
    variations: ['decline smith press', 'développé décliné smith', 'smith decline bench']
  }),
  ex('Développé couché prise neutre haltères', 'reps', 3, 0.95, {
    muscleGroup: 'Pectoraux', category: 'Pectoraux', equipment: 'Haltères + Banc',
    primaryMuscles: ['Pectoraux'], secondaryMuscles: ['Triceps', 'Deltoïdes antérieurs'],
    description: 'Paumes face à face pour réduire la stress sur les épaules tout en recrutant les pectoraux. Coudes restent proches du buste à 45°.',
    variations: ['neutral grip dumbbell press', 'dc prise neutre', 'hammer grip bench press']
  }),
  ex('Floor press haltères', 'reps', 3, 0.95, {
    muscleGroup: 'Pectoraux', category: 'Pectoraux', equipment: 'Haltères',
    primaryMuscles: ['Pectoraux', 'Triceps'], secondaryMuscles: ['Deltoïdes antérieurs'],
    description: 'Développé au sol qui limite l\'amplitude et verrouille le haut du mouvement. Idéal pour triceps et lock-out ; pause courte au sol sans rebond.',
    variations: ['dumbbell floor press', 'floor press db', 'développé au sol haltères']
  }),
  ex('Floor press barre', 'reps', 3, 1.0, {
    muscleGroup: 'Pectoraux', category: 'Pectoraux', equipment: 'Barre + Sol',
    primaryMuscles: ['Pectoraux', 'Triceps'], secondaryMuscles: ['Deltoïdes antérieurs'],
    description: 'Variante powerlifting au sol pour renforcer la fin de poussée et protéger les épaules. Coudes posés au sol entre chaque rep pour reset complet.',
    variations: ['barbell floor press', 'floor press barre', 'développé barre au sol']
  }),
  ex('Svend press', 'reps', 2, 0.65, {
    muscleGroup: 'Pectoraux', category: 'Pectoraux', equipment: 'Disque / Haltère',
    primaryMuscles: ['Pectoraux'], secondaryMuscles: ['Deltoïdes antérieurs', 'Triceps'],
    description: 'Press isométrique-concentrique en serrant un disque devant la poitrine. Serre fortement entre les paumes pour maximiser la contraction.',
    variations: ['svend press', 'plate press', 'squeeze press']
  }),
  ex('Pompes larges', 'reps', 2, 0.95, {
    muscleGroup: 'Pectoraux', category: 'Pectoraux', equipment: 'Poids du corps',
    primaryMuscles: ['Pectoraux'], secondaryMuscles: ['Triceps', 'Deltoïdes antérieurs'],
    description: 'Mains plus larges que les épaules pour étirer davantage les pectoraux. Corps gainé, coudes légèrement ouverts sans douleur épaule.',
    variations: ['wide push up', 'pompes prise large', 'wide grip push-ups']
  }),
  ex('Pompes sur un bras assistées', 'reps', 6, 1.85, {
    muscleGroup: 'Pectoraux', category: 'Pectoraux', equipment: 'Poids du corps + support',
    primaryMuscles: ['Pectoraux', 'Triceps'], secondaryMuscles: ['Core', 'Deltoïdes'],
    description: 'Progression vers la pompe unilatérale avec assistance (élastique, barre basse). Garde le bassin neutre et la main assistée légère.',
    variations: ['assisted one arm push up', 'pompes un bras assistées', 'archer push up assisté']
  }),
  ex('Pompes pieds très surélevés', 'reps', 4, 1.30, {
    muscleGroup: 'Pectoraux', category: 'Pectoraux', equipment: 'Poids du corps + Box',
    primaryMuscles: ['Pectoraux supérieurs', 'Deltoïdes antérieurs'], secondaryMuscles: ['Triceps', 'Core'],
    description: 'Pieds très hauts pour basculer la charge vers le haut des pectoraux et les épaules. Descends contrôlé, ne cambre pas les lombaires.',
    variations: ['decline push up high', 'pompes pieds surélevés', 'pike push up feet elevated']
  }),
  ex('Pompes explosives surélevées', 'reps', 5, 1.45, {
    muscleGroup: 'Pectoraux', category: 'Pectoraux', equipment: 'Poids du corps + Box',
    primaryMuscles: ['Pectoraux', 'Triceps'], secondaryMuscles: ['Deltoïdes antérieurs', 'Core'],
    description: 'Pompes déclinées avec phase explosive et décollage des mains. Atterrissage souple, poitrine avant les épaules.',
    variations: ['explosive decline push up', 'plyo push up elevated', 'pompes claquées surélevées']
  }),

  // ── DORSAUX (21) ──
  ex('Tractions prise neutre', 'reps', 4, 1.30, {
    muscleGroup: 'Dorsaux', category: 'Dorsaux', equipment: 'Barre de traction',
    primaryMuscles: ['Grand dorsal', 'Brachial antérieur'], secondaryMuscles: ['Biceps', 'Rhomboïdes'],
    description: 'Prise parallèle favorisant l\'épaisseur du dos et sollicitant le brachial. Amène la poitrine vers les mains, omoplates en dépression en bas.',
    variations: ['neutral grip pull up', 'tractions neutres', 'hammer grip pull up']
  }),
  ex('Tractions prise large', 'reps', 5, 1.40, {
    muscleGroup: 'Dorsaux', category: 'Dorsaux', equipment: 'Barre de traction',
    primaryMuscles: ['Grand dorsal'], secondaryMuscles: ['Rhomboïdes', 'Biceps', 'Trapèzes inférieurs'],
    description: 'Prise pronation large pour maximiser la largeur du dos. Initie le mouvement en baissant les épaules avant de plier les coudes.',
    variations: ['wide grip pull up', 'tractions larges', 'lat focused pull up']
  }),
  ex('Tractions prise serrée', 'reps', 4, 1.25, {
    muscleGroup: 'Dorsaux', category: 'Dorsaux', equipment: 'Barre de traction',
    primaryMuscles: ['Grand dorsal', 'Grand rond'], secondaryMuscles: ['Biceps', 'Brachial antérieur'],
    description: 'Mains rapprochées pour accentuer l\'épaisseur et le bas du dos. Poitrine haute, coudes vers les hanches en fin de tirage.',
    variations: ['close grip pull up', 'tractions serrées', 'narrow pull up']
  }),
  ex('Tractions lestées', 'reps', 6, 1.65, {
    muscleGroup: 'Dorsaux', category: 'Dorsaux', equipment: 'Barre de traction + Lest',
    primaryMuscles: ['Grand dorsal'], secondaryMuscles: ['Biceps', 'Rhomboïdes', 'Core'],
    description: 'Tractions avec charge additionnelle (ceinture, gilet). Évite le balancement ; chaque rep démarre bras tendus sous contrôle.',
    variations: ['weighted pull up', 'tractions lestées', 'pull up with weight']
  }),
  ex('Tractions assistées', 'reps', 3, 0.90, {
    muscleGroup: 'Dorsaux', category: 'Dorsaux', equipment: 'Machine assistée ou élastique',
    primaryMuscles: ['Grand dorsal'], secondaryMuscles: ['Biceps', 'Rhomboïdes'],
    description: 'Progression accessible vers les tractions strictes. Réduis l\'assistance progressivement tout en gardant une amplitude complète.',
    variations: ['assisted pull up', 'tractions assistées machine', 'band assisted pull up']
  }),
  ex('Tractions aux anneaux', 'reps', 5, 1.40, {
    muscleGroup: 'Dorsaux', category: 'Dorsaux', equipment: 'Anneaux',
    primaryMuscles: ['Grand dorsal', 'Rhomboïdes'], secondaryMuscles: ['Biceps', 'Stabilisateurs scapulaires'],
    description: 'Instabilité des anneaux qui exige un contrôle scapulaire maximal. Poignets neutres, corps rigide sans cambrure.',
    variations: ['ring pull up', 'tractions anneaux', 'gymnastic rings pull up']
  }),
  ex('Tractions supination serrées', 'reps', 4, 1.25, {
    muscleGroup: 'Dorsaux', category: 'Dorsaux', equipment: 'Barre de traction',
    primaryMuscles: ['Grand dorsal', 'Biceps'], secondaryMuscles: ['Brachial antérieur', 'Rhomboïdes'],
    description: 'Chin-up prise serrée combinant dos et biceps. Serre la barre, amène le sternum vers les mains.',
    variations: ['close grip chin up', 'tractions supination serrées', 'narrow chin up']
  }),
  ex('Tirage vertical prise large', 'reps', 3, 0.95, {
    muscleGroup: 'Dorsaux', category: 'Dorsaux', equipment: 'Poulie haute',
    primaryMuscles: ['Grand dorsal'], secondaryMuscles: ['Rhomboïdes', 'Biceps'],
    description: 'Lat pulldown prise large pour simuler les tractions en salle. Penché légèrement en arrière, tire vers le haut de la poitrine.',
    variations: ['wide lat pulldown', 'tirage vertical large', 'wide grip pulldown']
  }),
  ex('Tirage vertical supination', 'reps', 3, 0.95, {
    muscleGroup: 'Dorsaux', category: 'Dorsaux', equipment: 'Poulie haute',
    primaryMuscles: ['Grand dorsal', 'Biceps'], secondaryMuscles: ['Brachial antérieur'],
    description: 'Tirage en supination pour recruter davantage les biceps tout en ciblant le dos. Coudes vers le sol, pause courte en bas.',
    variations: ['underhand lat pulldown', 'tirage supination', 'reverse grip pulldown']
  }),
  ex('Tirage vertical unilatéral', 'reps', 3, 0.90, {
    muscleGroup: 'Dorsaux', category: 'Dorsaux', equipment: 'Poulie haute',
    primaryMuscles: ['Grand dorsal'], secondaryMuscles: ['Rhomboïdes', 'Biceps'],
    description: 'Tirage à un bras pour corriger les asymétries et augmenter l\'amplitude. Rotation légère du thorax, coude vers la hanche.',
    variations: ['single arm lat pulldown', 'tirage unilatéral', 'one arm pulldown']
  }),
  ex('Tirage vertical prise neutre large', 'reps', 3, 0.95, {
    muscleGroup: 'Dorsaux', category: 'Dorsaux', equipment: 'Poulie haute + Poignée neutre',
    primaryMuscles: ['Grand dorsal', 'Rhomboïdes'], secondaryMuscles: ['Biceps', 'Brachial antérieur'],
    description: 'Poignée neutre large pour un confort d\'épaule optimal. Initie par les omoplates avant de plier le coude.',
    variations: ['neutral wide pulldown', 'tirage neutre large', 'v-bar wide pulldown']
  }),
  ex('Straight-arm pulldown', 'reps', 2, 0.70, {
    muscleGroup: 'Dorsaux', category: 'Dorsaux', equipment: 'Poulie haute',
    primaryMuscles: ['Grand dorsal'], secondaryMuscles: ['Grand rond', 'Triceps long'],
    description: 'Bras tendus, extension d\'épaule pure pour isoler le grand dorsal. Coudes fixes, barre vers les cuisses en arc de cercle.',
    variations: ['straight arm pulldown', 'pulldown bras tendus', 'lat isolation pulldown']
  }),
  ex('Rowing Pendlay', 'reps', 4, 1.10, {
    muscleGroup: 'Dorsaux', category: 'Dorsaux', equipment: 'Barre',
    primaryMuscles: ['Grand dorsal', 'Rhomboïdes'], secondaryMuscles: ['Trapèzes', 'Biceps', 'Érecteurs du rachis'],
    description: 'Rowing explosif depuis le sol, torse parallèle au sol à chaque rep. Barre touche le sol entre les répétitions, dos plat.',
    variations: ['pendlay row', 'rowing pendlay', 'dead stop row']
  }),
  ex('Rowing poitrine appuyée haltères', 'reps', 2, 0.85, {
    muscleGroup: 'Dorsaux', category: 'Dorsaux', equipment: 'Haltères + Banc incliné',
    primaryMuscles: ['Grand dorsal', 'Rhomboïdes'], secondaryMuscles: ['Trapèzes postérieurs', 'Biceps'],
    description: 'Rowing buste appuyé qui élimine la triche lombaire. Tire les coudes vers l\'arrière en serrant les omoplates.',
    variations: ['chest supported dumbbell row', 'rowing buste appuyé', 'incline bench row']
  }),
  ex('Rowing T-bar poitrine appuyée', 'reps', 3, 0.95, {
    muscleGroup: 'Dorsaux', category: 'Dorsaux', equipment: 'T-bar + Banc',
    primaryMuscles: ['Grand dorsal', 'Rhomboïdes'], secondaryMuscles: ['Trapèzes moyens', 'Biceps'],
    description: 'T-bar row avec buste stabilisé pour charger lourd en sécurité. Poitrine collée au coussin, amplitude complète.',
    variations: ['chest supported t-bar row', 't-bar row appuyé', 'machine t-bar row']
  }),
  ex('Rowing unilatéral poulie', 'reps', 2, 0.85, {
    muscleGroup: 'Dorsaux', category: 'Dorsaux', equipment: 'Poulie basse',
    primaryMuscles: ['Grand dorsal'], secondaryMuscles: ['Rhomboïdes', 'Biceps'],
    description: 'Tirage horizontal un bras pour travailler l\'épaisseur en profondeur. Buste stable, coude près du corps en fin de tirage.',
    variations: ['single arm cable row', 'rowing unilatéral poulie', 'one arm seated row']
  }),
  ex('Rowing Meadows', 'reps', 4, 1.05, {
    muscleGroup: 'Dorsaux', category: 'Dorsaux', equipment: 'T-bar / Landmine',
    primaryMuscles: ['Grand dorsal', 'Trapèzes'], secondaryMuscles: ['Rhomboïdes', 'Biceps'],
    description: 'Rowing landmine unilatéral avec prise en pronation profonde. Étire le lat en bas, rotation minimale du tronc.',
    variations: ['meadows row', 'landmine meadows row', 'single arm landmine row']
  }),
  ex('Renegade row', 'reps', 4, 1.15, {
    muscleGroup: 'Dorsaux', category: 'Dorsaux', equipment: 'Haltères',
    primaryMuscles: ['Grand dorsal', 'Rhomboïdes'], secondaryMuscles: ['Core', 'Deltoïdes', 'Triceps'],
    description: 'Planche avec rowing alterné : anti-rotation et tirage combinés. Hanches stables, ne balance pas le bassin.',
    variations: ['renegade row', 'plank row', 'rowing en planche']
  }),
  ex('Rowing aux anneaux', 'reps', 3, 0.95, {
    muscleGroup: 'Dorsaux', category: 'Dorsaux', equipment: 'Anneaux',
    primaryMuscles: ['Grand dorsal', 'Rhomboïdes'], secondaryMuscles: ['Biceps', 'Core'],
    description: 'Rowing australien sur anneaux pour progresser vers les tractions. Corps aligné, poitrine vers les anneaux.',
    variations: ['ring row', 'rowing anneaux', 'inverted ring row']
  }),
  ex('Traction commando lestée', 'reps', 6, 1.55, {
    muscleGroup: 'Dorsaux', category: 'Dorsaux', equipment: 'Barre + Lest',
    primaryMuscles: ['Grand dorsal', 'Obliques'], secondaryMuscles: ['Biceps', 'Core'],
    description: 'Traction alternée prise serrée avec charge additionnelle. Tête passe d\'un côté à l\'autre de la barre sans rotation excessive.',
    variations: ['weighted commando pull up', 'tractions commando lestées', 'commando pull up weighted']
  }),
  ex('Muscle-up strict aux anneaux', 'reps', 8, 2.20, {
    muscleGroup: 'Dorsaux', category: 'Dorsaux', equipment: 'Anneaux',
    primaryMuscles: ['Grand dorsal', 'Triceps', 'Deltoïdes'], secondaryMuscles: ['Pectoraux', 'Core'],
    description: 'Enchaînement traction-dips strict sur anneaux sans kip. False grip ou transition contrôlée, corps gainé.',
    variations: ['strict ring muscle up', 'muscle up anneaux', 'ring muscle-up strict']
  }),

  // ── ÉPAULES (14) ──
  ex('Développé épaules machine', 'reps', 2, 0.90, {
    muscleGroup: 'Épaules', category: 'Épaules', equipment: 'Machine',
    primaryMuscles: ['Deltoïdes'], secondaryMuscles: ['Triceps', 'Trapèzes supérieurs'],
    description: 'Développé guidé pour isoler les deltoïdes sans demande de stabilisation. Poignées à hauteur des oreilles, ne verrouille pas brutalement.',
    variations: ['shoulder press machine', 'développé épaules machine', 'machine overhead press']
  }),
  ex('Développé épaules haltères debout', 'reps', 4, 1.00, {
    muscleGroup: 'Épaules', category: 'Épaules', equipment: 'Haltères',
    primaryMuscles: ['Deltoïdes'], secondaryMuscles: ['Triceps', 'Core', 'Trapèzes'],
    description: 'Développé debout sollicitant la stabilité du tronc et des épaules. Fessiers et abdos serrés, barre imaginaire au-dessus de la tête.',
    variations: ['standing dumbbell press', 'ohp haltères debout', 'développé debout haltères']
  }),
  ex('Développé haltères prise neutre', 'reps', 3, 0.90, {
    muscleGroup: 'Épaules', category: 'Épaules', equipment: 'Haltères',
    primaryMuscles: ['Deltoïdes', 'Triceps'], secondaryMuscles: ['Trapèzes supérieurs'],
    description: 'Paumes face à face pour un confort d\'épaule en développé. Coudes légèrement devant le corps, amplitude complète sans douleur.',
    variations: ['neutral grip shoulder press', 'développé prise neutre', 'hammer grip ohp']
  }),
  ex('Développé militaire à la Smith machine', 'reps', 3, 0.95, {
    muscleGroup: 'Épaules', category: 'Épaules', equipment: 'Smith machine',
    primaryMuscles: ['Deltoïdes'], secondaryMuscles: ['Triceps', 'Trapèzes supérieurs'],
    description: 'Développé vertical guidé pour charger les épaules en sécurité. Assis ou debout, barre devant le visage sans cambrer.',
    variations: ['smith shoulder press', 'développé militaire smith', 'smith ohp']
  }),
  ex('Push press', 'reps', 5, 1.20, {
    muscleGroup: 'Épaules', category: 'Épaules', equipment: 'Barre',
    primaryMuscles: ['Deltoïdes', 'Triceps'], secondaryMuscles: ['Quadriceps', 'Core', 'Trapèzes'],
    description: 'Développé avec impulsion des jambes pour passer le sticking point. Dip contrôlé puis extension explosive jambes puis bras.',
    variations: ['push press', 'développé push', 'barbell push press']
  }),
  ex('Push press haltères', 'reps', 5, 1.15, {
    muscleGroup: 'Épaules', category: 'Épaules', equipment: 'Haltères',
    primaryMuscles: ['Deltoïdes', 'Triceps'], secondaryMuscles: ['Quadriceps', 'Core'],
    description: 'Variante haltères du push press pour puissance et stabilité unilatérale. Même timing : jambes puis épaules.',
    variations: ['dumbbell push press', 'push press haltères', 'db push press']
  }),
  ex('Élévation latérale à la machine', 'reps', 2, 0.65, {
    muscleGroup: 'Épaules', category: 'Épaules', equipment: 'Machine',
    primaryMuscles: ['Deltoïdes moyens'], secondaryMuscles: ['Trapèzes supérieurs'],
    description: 'Isolation deltoïde latéral sur machine pour trajectoire constante. Monte jusqu\'à l\'alignement épaules, sans élan.',
    variations: ['lateral raise machine', 'élévation latérale machine', 'machine side raise']
  }),
  ex('Élévation latérale assise', 'reps', 2, 0.65, {
    muscleGroup: 'Épaules', category: 'Épaules', equipment: 'Haltères + Banc',
    primaryMuscles: ['Deltoïdes moyens'], secondaryMuscles: [],
    description: 'Position assise qui limite la triche par le corps. Légère inclinaison du buste, pouces neutres ou légèrement vers le bas.',
    variations: ['seated lateral raise', 'élévation latérale assise', 'side raise seated']
  }),
  ex('Élévation latérale penchée', 'reps', 2, 0.65, {
    muscleGroup: 'Épaules', category: 'Épaules', equipment: 'Haltères',
    primaryMuscles: ['Deltoïdes moyens'], secondaryMuscles: ['Trapèzes inférieurs'],
    description: 'Buste penché en avant pour tension constante sur le deltoïde latéral. Dos plat, haltères sous le buste en bas.',
    variations: ['leaning lateral raise', 'élévation penchée', 'cable y raise lateral']
  }),
  ex('Reverse pec deck', 'reps', 2, 0.70, {
    muscleGroup: 'Épaules', category: 'Épaules', equipment: 'Machine',
    primaryMuscles: ['Deltoïdes postérieurs'], secondaryMuscles: ['Rhomboïdes', 'Trapèzes moyens'],
    description: 'Oiseau sur machine pour cibler l\'arrière d\'épaule sans stabilisation complexe. Serre les omoplates en fin de mouvement.',
    variations: ['reverse pec deck', 'rear delt machine', 'oiseau machine']
  }),
  ex('High row poulie', 'reps', 3, 0.80, {
    muscleGroup: 'Épaules', category: 'Épaules', equipment: 'Poulie basse',
    primaryMuscles: ['Deltoïdes postérieurs', 'Trapèzes moyens'], secondaryMuscles: ['Rhomboïdes', 'Biceps'],
    description: 'Tirage haut vers la poitrine pour trapèzes et deltoïdes postérieurs. Coudes hauts, paume vers le bas en fin de tirage.',
    variations: ['high row cable', 'face pull high row', 'tirage haut poulie']
  }),
  ex('Face pull à la corde haute', 'reps', 2, 0.70, {
    muscleGroup: 'Épaules', category: 'Épaules', equipment: 'Poulie haute + Corde',
    primaryMuscles: ['Deltoïdes postérieurs', 'Rotateurs externes'], secondaryMuscles: ['Trapèzes moyens', 'Rhomboïdes'],
    description: 'Tire la corde vers le visage en écartant les mains. Rotation externe en fin de mouvement, coudes au-dessus des poignets.',
    variations: ['face pull', 'face pull corde', 'cable face pull']
  }),
  ex('Handstand hold libre', 'seconds', 7, 1.45, {
    muscleGroup: 'Épaules', category: 'Épaules', equipment: 'Poids du corps',
    primaryMuscles: ['Deltoïdes', 'Trapèzes supérieurs'], secondaryMuscles: ['Triceps', 'Core', 'Avant-bras'],
    description: 'Équilibre sur les mains sans mur — niveau avancé de force et contrôle d\'épaule. Doigts actifs, corps aligné, respiration calme.',
    variations: ['freestanding handstand hold', 'équilibre sur les mains libre', 'handstand hold free']
  }),
  ex('Pike push-up pieds surélevés', 'reps', 5, 1.30, {
    muscleGroup: 'Épaules', category: 'Épaules', equipment: 'Poids du corps + Box',
    primaryMuscles: ['Deltoïdes antérieurs', 'Triceps'], secondaryMuscles: ['Trapèzes supérieurs', 'Core'],
    description: 'Pompes pike avec pieds hauts, progression vers le HSPU. Tête vers le sol entre les mains, coudes légèrement ouverts.',
    variations: ['elevated pike push up', 'pike push up feet up', 'pompes pike surélevées']
  }),

  // ── BICEPS (8) ──
  ex('Curl marteau croisé', 'reps', 2, 0.80, {
    muscleGroup: 'Biceps', category: 'Biceps', equipment: 'Haltères',
    primaryMuscles: ['Brachial antérieur', 'Biceps brachial'], secondaryMuscles: ['Brachio-radial'],
    description: 'Curl marteau en traversant le corps pour solliciter le brachial. Coude fixe, monte vers l\'épaule opposée.',
    variations: ['cross body hammer curl', 'curl marteau croisé', 'hammer curl across body']
  }),
  ex('Curl Bayesian à la poulie', 'reps', 3, 0.85, {
    muscleGroup: 'Biceps', category: 'Biceps', equipment: 'Poulie basse',
    primaryMuscles: ['Biceps brachial'], secondaryMuscles: ['Brachial antérieur'],
    description: 'Curl derrière le corps sur poulie basse pour étirement maximal du biceps. Bras légèrement en arrière du corps, coude stable.',
    variations: ['bayesian curl', 'curl bayesian poulie', 'behind body cable curl']
  }),
  ex('Curl câble derrière le corps', 'reps', 3, 0.85, {
    muscleGroup: 'Biceps', category: 'Biceps', equipment: 'Poulie basse',
    primaryMuscles: ['Biceps brachial'], secondaryMuscles: ['Brachial antérieur'],
    description: 'Même principe que le Bayesian : tension constante en position étirée. Ne balance pas le tronc.',
    variations: ['behind the back cable curl', 'curl câble derrière', 'rear cable curl']
  }),
  ex('Curl barre prise inversée', 'reps', 3, 0.80, {
    muscleGroup: 'Biceps', category: 'Biceps', equipment: 'Barre',
    primaryMuscles: ['Brachial antérieur', 'Biceps brachial'], secondaryMuscles: ['Brachio-radial'],
    description: 'Prise pronation (reverse curl) pour cibler le brachial et l\'avant-bras. Coudes collés, montée contrôlée sans élan.',
    variations: ['reverse barbell curl', 'curl inversé barre', 'pronated curl']
  }),
  ex('Curl inversé EZ', 'reps', 3, 0.80, {
    muscleGroup: 'Biceps', category: 'Biceps', equipment: 'Barre EZ',
    primaryMuscles: ['Brachial antérieur', 'Brachio-radial'], secondaryMuscles: ['Biceps brachial'],
    description: 'Barre EZ en prise pronation pour confort poignet et brachial. Amplitude complète sans douleur coude.',
    variations: ['reverse ez curl', 'curl inversé EZ', 'ez reverse curl']
  }),
  ex('Curl araignée haltères', 'reps', 3, 0.85, {
    muscleGroup: 'Biceps', category: 'Biceps', equipment: 'Haltères + Banc incliné',
    primaryMuscles: ['Biceps brachial'], secondaryMuscles: ['Brachial antérieur'],
    description: 'Buste penché sur banc, bras pendants : curl strict sans triche. Serre en haut sans monter les coudes.',
    variations: ['spider curl', 'curl araignée', 'prone incline curl']
  }),
  ex('Curl unilatéral pupitre', 'reps', 3, 0.80, {
    muscleGroup: 'Biceps', category: 'Biceps', equipment: 'Haltère + Banc pupitre',
    primaryMuscles: ['Biceps brachial'], secondaryMuscles: ['Brachial antérieur'],
    description: 'Curl pupitre un bras pour isolement maximal. Bras à plat sur le coussin, descente lente en extension complète.',
    variations: ['single arm preacher curl', 'curl pupitre unilatéral', 'unilateral preacher curl']
  }),
  ex('Curl drag', 'reps', 3, 0.85, {
    muscleGroup: 'Biceps', category: 'Biceps', equipment: 'Barre / Haltères',
    primaryMuscles: ['Biceps brachial'], secondaryMuscles: ['Brachial antérieur'],
    description: 'Barre « glissée » le long du corps, coudes en arrière. Tension continue sur le biceps sans relâchement en haut.',
    variations: ['drag curl', 'curl drag', 'barbell drag curl']
  }),

  // ── TRICEPS (10) ──
  ex('Extension triceps au-dessus de la tête à la poulie', 'reps', 2, 0.75, {
    muscleGroup: 'Triceps', category: 'Triceps', equipment: 'Poulie basse',
    primaryMuscles: ['Triceps brachial'], secondaryMuscles: [],
    description: 'Extension overhead à la poulie pour étirer la longue portion du triceps. Coudes près des oreilles, extension complète.',
    variations: ['overhead cable triceps extension', 'extension triceps poulie overhead', 'cable overhead extension']
  }),
  ex('Extension triceps corde au-dessus de la tête', 'reps', 2, 0.75, {
    muscleGroup: 'Triceps', category: 'Triceps', equipment: 'Poulie basse + Corde',
    primaryMuscles: ['Triceps brachial'], secondaryMuscles: [],
    description: 'Corde derrière la tête pour confort poignet et contraction maximale. Écarte les mains en fin d\'extension.',
    variations: ['rope overhead extension', 'extension corde overhead', 'triceps rope overhead']
  }),
  ex('Extension triceps unilatérale au-dessus de la tête', 'reps', 3, 0.75, {
    muscleGroup: 'Triceps', category: 'Triceps', equipment: 'Haltère ou Poulie',
    primaryMuscles: ['Triceps brachial'], secondaryMuscles: ['Core'],
    description: 'Extension overhead un bras pour corriger les déséquilibres. Coude fixe pointé vers le plafond.',
    variations: ['single arm overhead extension', 'extension triceps unilatérale overhead', 'one arm triceps extension']
  }),
  ex('Pushdown barre', 'reps', 2, 0.70, {
    muscleGroup: 'Triceps', category: 'Triceps', equipment: 'Poulie haute',
    primaryMuscles: ['Triceps brachial'], secondaryMuscles: [],
    description: 'Extension coude à la poulie haute avec barre droite. Coudes collés au corps, extension sans verrouillage brutal.',
    variations: ['triceps pushdown bar', 'pushdown barre', 'straight bar pushdown']
  }),
  ex('Pushdown corde', 'reps', 2, 0.70, {
    muscleGroup: 'Triceps', category: 'Triceps', equipment: 'Poulie haute + Corde',
    primaryMuscles: ['Triceps brachial'], secondaryMuscles: [],
    description: 'Corde pour amplitude complète et confort poignet. Écarte les mains en bas pour contraction maximale.',
    variations: ['rope pushdown', 'pushdown corde', 'triceps rope pushdown']
  }),
  ex('Pushdown unilatéral', 'reps', 2, 0.65, {
    muscleGroup: 'Triceps', category: 'Triceps', equipment: 'Poulie haute',
    primaryMuscles: ['Triceps brachial'], secondaryMuscles: [],
    description: 'Pushdown un bras pour isolement et correction asymétrique. Tronc stable, coude fixe.',
    variations: ['single arm pushdown', 'pushdown unilatéral', 'one arm triceps pushdown']
  }),
  ex('Skull crusher haltères', 'reps', 3, 0.90, {
    muscleGroup: 'Triceps', category: 'Triceps', equipment: 'Haltères + Banc',
    primaryMuscles: ['Triceps brachial'], secondaryMuscles: [],
    description: 'Extension couchée haltères vers le front ou au-dessus de la tête. Coudes stables, descente contrôlée.',
    variations: ['dumbbell skull crusher', 'barre au front haltères', 'lying triceps extension db']
  }),
  ex('Tate press haltères', 'reps', 3, 0.80, {
    muscleGroup: 'Triceps', category: 'Triceps', equipment: 'Haltères + Banc',
    primaryMuscles: ['Triceps brachial'], secondaryMuscles: ['Deltoïdes antérieurs'],
    description: 'Extension en écartant les haltères vers l\'extérieur sur banc. Coudes larges, contraction en extension.',
    variations: ['tate press', 'tate press dumbbell', 'flared triceps extension']
  }),
  ex('Extension triceps au poids du corps', 'reps', 4, 1.05, {
    muscleGroup: 'Triceps', category: 'Triceps', equipment: 'Barres parallèles / Banc',
    primaryMuscles: ['Triceps brachial'], secondaryMuscles: ['Deltoïdes antérieurs', 'Pectoraux'],
    description: 'Dips ou extensions au poids du corps pour triceps. Buste vertical pour isoler les triceps, coudes vers l\'arrière.',
    variations: ['bodyweight triceps extension', 'bench dip', 'extension triceps pdc']
  }),
  ex('Dips assistés', 'reps', 3, 0.90, {
    muscleGroup: 'Triceps', category: 'Triceps', equipment: 'Machine assistée ou élastique',
    primaryMuscles: ['Triceps brachial', 'Pectoraux inférieurs'], secondaryMuscles: ['Deltoïdes antérieurs'],
    description: 'Progression vers les dips libres avec assistance réglable. Buste légèrement penché pour pectoraux, vertical pour triceps.',
    variations: ['assisted dips', 'dips assistés', 'band assisted dips']
  }),

  // ── QUADRICEPS (14) ──
  ex('Reverse lunge', 'reps', 2, 0.90, {
    muscleGroup: 'Quadriceps', category: 'Quadriceps', equipment: 'Poids du corps / Haltères',
    primaryMuscles: ['Quadriceps', 'Fessiers'], secondaryMuscles: ['Ischio-jambiers', 'Mollets'],
    description: 'Fente arrière qui réduit la stress rotulienne vs fente avant. Grand pas en arrière, genou arrière frôle le sol.',
    variations: ['reverse lunge', 'fente arrière', 'backward lunge']
  }),
  ex('Fente latérale', 'reps', 3, 1.00, {
    muscleGroup: 'Quadriceps', category: 'Quadriceps', equipment: 'Poids du corps / Haltères',
    primaryMuscles: ['Quadriceps', 'Adducteurs'], secondaryMuscles: ['Fessiers', 'Mollets'],
    description: 'Step latéral en charge pour quadriceps et adducteurs. Jambe de travail fléchie, buste droit, talon au sol.',
    variations: ['lateral lunge', 'fente latérale', 'side lunge']
  }),
  ex('Fente avant pied surélevé', 'reps', 3, 1.00, {
    muscleGroup: 'Quadriceps', category: 'Quadriceps', equipment: 'Haltères + Planche',
    primaryMuscles: ['Quadriceps', 'Fessiers'], secondaryMuscles: ['Mollets'],
    description: 'Pied avant surélevé pour plus de flexion genou et recrutement quadriceps. Bustes vertical, genou suit les orteils.',
    variations: ['front foot elevated lunge', 'fente avant surélevée', 'deficit lunge']
  }),
  ex('Bulgarian split squat avant surélevé', 'reps', 5, 1.35, {
    muscleGroup: 'Quadriceps', category: 'Quadriceps', equipment: 'Haltères + Banc + Planche',
    primaryMuscles: ['Quadriceps', 'Fessiers'], secondaryMuscles: ['Ischio-jambiers', 'Core'],
    description: 'Fente bulgare avec pied avant surélevé pour amplitude maximale. Torse légèrement penché, genou avant stable.',
    variations: ['elevated bulgarian split squat', 'bss avant surélevé', 'front foot up split squat']
  }),
  ex('Cyclist squat', 'reps', 3, 1.00, {
    muscleGroup: 'Quadriceps', category: 'Quadriceps', equipment: 'Barre + Talons surélevés',
    primaryMuscles: ['Quadriceps'], secondaryMuscles: ['Fessiers', 'Mollets'],
    description: 'Squat talons surélevés, stance étroit pour quadriceps en flexion profonde. Bustes vertical, genoux avancés contrôlés.',
    variations: ['cyclist squat', 'squat cycliste', 'narrow heel elevated squat']
  }),
  ex('Spanish squat', 'reps', 3, 0.85, {
    muscleGroup: 'Quadriceps', category: 'Quadriceps', equipment: 'Sangle / Élastique',
    primaryMuscles: ['Quadriceps', 'Tendon rotulien'], secondaryMuscles: ['Fessiers'],
    description: 'Squat isométrique/dynamique avec sangle derrière les genoux. Genoux avancés, buste vertical — protocole tendinopathie rotulienne.',
    variations: ['spanish squat', 'squat espagnol', 'band spanish squat']
  }),
  ex('Spanish squat isométrique', 'seconds', 3, 0.85, {
    muscleGroup: 'Quadriceps', category: 'Quadriceps', equipment: 'Sangle / Élastique',
    primaryMuscles: ['Quadriceps', 'Tendon rotulien'], secondaryMuscles: ['Fessiers'],
    description: 'Maintien en bas de Spanish squat pour tolérance tendineuse. Respiration calme, genoux alignés avec les pieds.',
    variations: ['spanish squat hold', 'spanish squat iso', 'isometric spanish squat']
  }),
  ex('Belt squat', 'reps', 3, 1.00, {
    muscleGroup: 'Quadriceps', category: 'Quadriceps', equipment: 'Ceinture de squat / Machine',
    primaryMuscles: ['Quadriceps', 'Fessiers'], secondaryMuscles: ['Mollets'],
    description: 'Squat avec charge à la ceinture sans compression spinale. Descente profonde, tronc vertical.',
    variations: ['belt squat', 'squat ceinture', 'hip belt squat']
  }),
  ex('Belt squat unilatéral', 'reps', 5, 1.20, {
    muscleGroup: 'Quadriceps', category: 'Quadriceps', equipment: 'Ceinture de squat',
    primaryMuscles: ['Quadriceps', 'Fessiers'], secondaryMuscles: ['Core', 'Mollets'],
    description: 'Belt squat une jambe pour force unilatérale sans charge axiale. Contrôle la descente, genou stable.',
    variations: ['single leg belt squat', 'belt squat unilatéral', 'unilateral belt squat']
  }),
  ex('Hack squat à la machine pendulaire', 'reps', 4, 1.05, {
    muscleGroup: 'Quadriceps', category: 'Quadriceps', equipment: 'Hack squat pendulaire',
    primaryMuscles: ['Quadriceps'], secondaryMuscles: ['Fessiers', 'Ischio-jambiers'],
    description: 'Machine pendulaire pour squat profond guidé. Pieds bas sur la plateforme pour quadriceps, dos collé au coussin.',
    variations: ['pendulum hack squat', 'hack squat pendulaire', 'machine hack squat']
  }),
  ex('Reverse Nordic curl', 'reps', 5, 1.15, {
    muscleGroup: 'Quadriceps', category: 'Quadriceps', equipment: 'Poids du corps',
    primaryMuscles: ['Quadriceps'], secondaryMuscles: ['Fléchisseurs de hanche', 'Core'],
    description: 'Inclinaison arrière depuis genoux pour quadriceps en excentrique. Corps droit, amplitude progressive.',
    variations: ['reverse nordic', 'reverse nordic curl', 'kneeling quad extension']
  }),
  ex('Step-up haut', 'reps', 3, 0.95, {
    muscleGroup: 'Quadriceps', category: 'Quadriceps', equipment: 'Box haute / Haltères',
    primaryMuscles: ['Quadriceps', 'Fessiers'], secondaryMuscles: ['Mollets', 'Core'],
    description: 'Montée sur box haute sans élan du pied arrière. Pousse through le talon, buste légèrement penché.',
    variations: ['high step up', 'step-up haut', 'tall box step up']
  }),
  ex('Step-up lesté', 'reps', 4, 1.10, {
    muscleGroup: 'Quadriceps', category: 'Quadriceps', equipment: 'Box + Haltères / Barre',
    primaryMuscles: ['Quadriceps', 'Fessiers'], secondaryMuscles: ['Mollets', 'Core'],
    description: 'Step-up avec charge pour force unilatérale fonctionnelle. Contrôle la descente, pas de saut.',
    variations: ['weighted step up', 'step-up lesté', 'loaded step up']
  }),
  ex('Squat sur une jambe assisté', 'reps', 5, 1.30, {
    muscleGroup: 'Quadriceps', category: 'Quadriceps', equipment: 'Support + Haltère',
    primaryMuscles: ['Quadriceps', 'Fessiers'], secondaryMuscles: ['Core', 'Mollets'],
    description: 'Progression vers le pistol squat avec support (anneau, TRX). Descends contrôlé, genou suit les orteils.',
    variations: ['assisted single leg squat', 'pistol squat assisté', 'supported one leg squat']
  }),

  // ── ISCHIO-JAMBIERS (11) ──
  ex('Leg curl assis', 'reps', 2, 0.80, {
    muscleGroup: 'Ischio-jambiers', category: 'Ischio-jambiers', equipment: 'Machine leg curl assis',
    primaryMuscles: ['Ischio-jambiers'], secondaryMuscles: ['Mollets'],
    description: 'Curl ischios assis pour étirement en position fléchie de hanche. Contracte en haut, descente lente 2–3 s.',
    variations: ['seated leg curl', 'leg curl assis', 'ischio machine assis']
  }),
  ex('Leg curl debout unilatéral', 'reps', 3, 0.85, {
    muscleGroup: 'Ischio-jambiers', category: 'Ischio-jambiers', equipment: 'Machine leg curl debout',
    primaryMuscles: ['Ischio-jambiers'], secondaryMuscles: ['Mollets', 'Fessiers'],
    description: 'Curl debout un jambe pour isolement et correction asymétrie. Hanche stable, pas de cambrure lombaire.',
    variations: ['standing single leg curl', 'leg curl debout unilatéral', 'one leg hamstring curl']
  }),
  ex('Nordic curl assisté', 'reps', 6, 1.45, {
    muscleGroup: 'Ischio-jambiers', category: 'Ischio-jambiers', equipment: 'Partenaire / Fixation + Élastique',
    primaryMuscles: ['Ischio-jambiers'], secondaryMuscles: ['Fessiers', 'Mollets'],
    description: 'Nordic avec assistance élastique ou mains pour progresser. Corps aligné genoux-tête, freine en excentrique.',
    variations: ['assisted nordic curl', 'nordic curl assisté', 'band assisted nordic']
  }),
  ex('Nordic curl négatif', 'reps', 7, 1.65, {
    muscleGroup: 'Ischio-jambiers', category: 'Ischio-jambiers', equipment: 'Partenaire / Fixation',
    primaryMuscles: ['Ischio-jambiers'], secondaryMuscles: ['Fessiers', 'Mollets'],
    description: 'Phase excentrique seule du Nordic curl. Descends le plus lentement possible, pousse sur les mains pour remonter.',
    variations: ['nordic curl negative', 'nordic négatif', 'eccentric nordic curl']
  }),
  ex('Glute-ham raise', 'reps', 6, 1.40, {
    muscleGroup: 'Ischio-jambiers', category: 'Ischio-jambiers', equipment: 'GHD / Banc GHR',
    primaryMuscles: ['Ischio-jambiers', 'Fessiers'], secondaryMuscles: ['Mollets', 'Érecteurs du rachis'],
    description: 'Extension de hanche et flexion de genou sur banc GHR. Corps aligné, monte en contractant ischios et fessiers.',
    variations: ['ghr', 'glute ham raise', 'glute-ham developer']
  }),
  ex('Romanian deadlift barre', 'reps', 4, 1.10, {
    muscleGroup: 'Ischio-jambiers', category: 'Ischio-jambiers', equipment: 'Barre',
    primaryMuscles: ['Ischio-jambiers', 'Fessiers'], secondaryMuscles: ['Érecteurs du rachis', 'Grand dorsal'],
    description: 'Hinge de hanche jambes quasi tendues pour ischios en étirement. Barre près des cuisses, dos plat, fessiers en arrière.',
    variations: ['romanian deadlift', 'RDL barre', 'soulevé roumain barre']
  }),
  ex('Romanian deadlift unilatéral', 'reps', 5, 1.20, {
    muscleGroup: 'Ischio-jambiers', category: 'Ischio-jambiers', equipment: 'Haltère / Kettlebell',
    primaryMuscles: ['Ischio-jambiers', 'Fessiers'], secondaryMuscles: ['Core', 'Érecteurs du rachis'],
    description: 'RDL une jambe pour équilibre et ischios unilatéral. Jambe libre prolonge le corps, bassin parallèle au sol.',
    variations: ['single leg RDL', 'RDL unilatéral', 'one leg romanian deadlift']
  }),
  ex('Single-leg RDL haltères', 'reps', 4, 1.10, {
    muscleGroup: 'Ischio-jambiers', category: 'Ischio-jambiers', equipment: 'Haltères',
    primaryMuscles: ['Ischio-jambiers', 'Fessiers'], secondaryMuscles: ['Core', 'Mollets'],
    description: 'RDL unilatéral avec deux haltères pour charge symétrique. Même technique : hinge, dos plat, hanche en arrière.',
    variations: ['single leg dumbbell rdl', 'RDL haltères un jambe', 'one leg db rdl']
  }),
  ex('Good morning assis', 'reps', 3, 0.85, {
    muscleGroup: 'Ischio-jambiers', category: 'Ischio-jambiers', equipment: 'Barre + Banc',
    primaryMuscles: ['Ischio-jambiers'], secondaryMuscles: ['Érecteurs du rachis', 'Fessiers'],
    description: 'Flexion du buste assis jambes fixes pour isoler les ischios. Dos plat, barre sur les trapèzes hautes.',
    variations: ['seated good morning', 'good morning assis', 'seated gm']
  }),
  ex('Reverse hyperextension', 'reps', 3, 0.85, {
    muscleGroup: 'Ischio-jambiers', category: 'Ischio-jambiers', equipment: 'Banc reverse hyper / Machine',
    primaryMuscles: ['Ischio-jambiers', 'Fessiers'], secondaryMuscles: ['Érecteurs du rachis'],
    description: 'Extension de hanche suspendu pour chaîne postérieure sans charge lombaire directe. Montée contrôlée, pas d\'hyperextension lombaire.',
    variations: ['reverse hyper', 'reverse hyperextension', 'reverse hyper machine']
  }),

  // ── FESSIERS (11) ──
  ex('Hip thrust à la Smith machine', 'reps', 3, 0.95, {
    muscleGroup: 'Fessiers', category: 'Fessiers', equipment: 'Smith machine + Banc',
    primaryMuscles: ['Grand fessier'], secondaryMuscles: ['Ischio-jambiers', 'Quadriceps'],
    description: 'Hip thrust guidé pour charger les fessiers en sécurité. Menton rentré, extension complète sans hyperextension lombaire.',
    variations: ['smith hip thrust', 'hip thrust smith', 'thrust fessier smith']
  }),
  ex('Hip thrust barre lesté', 'reps', 3, 1.00, {
    muscleGroup: 'Fessiers', category: 'Fessiers', equipment: 'Barre + Banc',
    primaryMuscles: ['Grand fessier'], secondaryMuscles: ['Ischio-jambiers', 'Quadriceps'],
    description: 'Exercice roi pour l\'hypertrophie fessière avec barre. Pause 1 s en haut, genoux ouverts, regard devant.',
    variations: ['barbell hip thrust', 'hip thrust barre', 'weighted hip thrust']
  }),
  ex('Abduction machine', 'reps', 2, 0.60, {
    muscleGroup: 'Fessiers', category: 'Fessiers', equipment: 'Machine abduction',
    primaryMuscles: ['Fessier moyen'], secondaryMuscles: ['Tensor fascia lata'],
    description: 'Écartement de hanche sur machine pour fessier moyen. Contrôle le retour, ne laisse pas les poids claquer.',
    variations: ['hip abduction machine', 'abduction machine', 'machine écartement hanche']
  }),
  ex('Abduction poulie', 'reps', 2, 0.55, {
    muscleGroup: 'Fessiers', category: 'Fessiers', equipment: 'Poulie basse',
    primaryMuscles: ['Fessier moyen'], secondaryMuscles: ['Tensor fascia lata', 'Core'],
    description: 'Écartement debout à la poulie pour tension constante. Buste stable, jambe tendue ou légèrement fléchie.',
    variations: ['cable hip abduction', 'abduction poulie', 'standing cable abduction']
  }),
  ex('Abduction allongée', 'reps', 1, 0.45, {
    muscleGroup: 'Fessiers', category: 'Fessiers', equipment: 'Poids du corps / Élastique',
    primaryMuscles: ['Fessier moyen'], secondaryMuscles: ['Tensor fascia lata'],
    description: 'Écartement de hanche allongé sur le côté, activation douce du fessier moyen. Genou légèrement fléchi, pied neutre.',
    variations: ['lying hip abduction', 'abduction allongée', 'side lying leg raise']
  }),
  ex('Kickback poulie', 'reps', 2, 0.60, {
    muscleGroup: 'Fessiers', category: 'Fessiers', equipment: 'Poulie basse',
    primaryMuscles: ['Grand fessier'], secondaryMuscles: ['Ischio-jambiers'],
    description: 'Extension de hanche à la poulie pour isolation fessière. Dos plat, extension sans cambrure lombaire.',
    variations: ['cable kickback', 'kickback poulie', 'glute kickback cable']
  }),
  ex('Kickback machine', 'reps', 2, 0.60, {
    muscleGroup: 'Fessiers', category: 'Fessiers', equipment: 'Machine kickback',
    primaryMuscles: ['Grand fessier'], secondaryMuscles: ['Ischio-jambiers'],
    description: 'Kickback guidé pour cibler le grand fessier sans stabilisation complexe. Serre en fin d\'extension.',
    variations: ['glute kickback machine', 'kickback machine', 'machine fessier']
  }),
  ex('Hip airplane', 'reps', 6, 1.15, {
    muscleGroup: 'Fessiers', category: 'Fessiers', equipment: 'Poids du corps',
    primaryMuscles: ['Grand fessier', 'Fessier moyen'], secondaryMuscles: ['Core', 'Ischio-jambiers'],
    description: 'Équilibre unipodal avec rotation thoracique — stabilité hanche avancée. Hanche fixe, rotation lente du buste.',
    variations: ['hip airplane', 'single leg rdl rotation', 'avion hanche']
  }),
  ex('Step-up haut fessier', 'reps', 3, 0.95, {
    muscleGroup: 'Fessiers', category: 'Fessiers', equipment: 'Box haute',
    primaryMuscles: ['Grand fessier', 'Quadriceps'], secondaryMuscles: ['Ischio-jambiers', 'Mollets'],
    description: 'Step-up haut avec focus fessier : buste penché, poussée du talon. Pause en haut avant descente contrôlée.',
    variations: ['glute focused step up', 'step-up fessier', 'high box step up glute']
  }),
  ex('Lateral step-up', 'reps', 4, 1.00, {
    muscleGroup: 'Fessiers', category: 'Fessiers', equipment: 'Box + Haltères',
    primaryMuscles: ['Grand fessier', 'Quadriceps'], secondaryMuscles: ['Adducteurs', 'Core'],
    description: 'Montée latérale sur box pour travail frontal du fessier et adducteurs. Genou stable, pas de rotation du bassin.',
    variations: ['lateral step up', 'step-up latéral', 'side step up']
  }),
  ex('Curtsy lunge', 'reps', 3, 0.90, {
    muscleGroup: 'Fessiers', category: 'Fessiers', equipment: 'Haltères / Poids du corps',
    primaryMuscles: ['Grand fessier', 'Fessier moyen'], secondaryMuscles: ['Quadriceps', 'Adducteurs'],
    description: 'Fente croisée derrière pour fessier moyen et grand fessier. Genou avant suit les orteils, buste vertical.',
    variations: ['curtsy lunge', 'fente curtsy', 'cross behind lunge']
  }),

  // ── ADDUCTEURS (7) ──
  ex('Adduction machine', 'reps', 1, 0.50, {
    muscleGroup: 'Adducteurs', category: 'Adducteurs', equipment: 'Machine adduction',
    primaryMuscles: ['Adducteurs'], secondaryMuscles: ['Fessiers', 'Gracile'],
    description: 'Rapprochement de hanche sur machine, base pour renforcer les adducteurs. Amplitude complète sans à-coups.',
    variations: ['hip adduction machine', 'adduction machine', 'machine adducteurs']
  }),
  ex('Adduction poulie', 'reps', 2, 0.50, {
    muscleGroup: 'Adducteurs', category: 'Adducteurs', equipment: 'Poulie basse',
    primaryMuscles: ['Adducteurs'], secondaryMuscles: ['Fessiers', 'Core'],
    description: 'Adduction debout à la poulie pour tension constante. Buste stable, jambe tendue vers la ligne médiane.',
    variations: ['cable hip adduction', 'adduction poulie', 'standing adduction cable']
  }),
  ex('Adduction allongée', 'reps', 1, 0.40, {
    muscleGroup: 'Adducteurs', category: 'Adducteurs', equipment: 'Poids du corps / Élastique',
    primaryMuscles: ['Adducteurs'], secondaryMuscles: ['Fessiers'],
    description: 'Adduction allongé sur le côté, activation douce pré-réhab ou échauffement. Contrôle la descente.',
    variations: ['lying hip adduction', 'adduction allongée', 'side lying adduction']
  }),
  ex('Copenhagen dynamique', 'reps', 5, 1.00, {
    muscleGroup: 'Adducteurs', category: 'Adducteurs', equipment: 'Banc / Box',
    primaryMuscles: ['Adducteurs'], secondaryMuscles: ['Fessiers', 'Core'],
    description: 'Planche Copenhagen avec flexion-extension de jambe. Jambe supérieure sur banc, corps aligné, amplitude contrôlée.',
    variations: ['dynamic copenhagen', 'copenhagen dynamique', 'copenhagen adduction dynamic']
  }),
  ex('Copenhagen hold', 'seconds', 5, 1.05, {
    muscleGroup: 'Adducteurs', category: 'Adducteurs', equipment: 'Banc / Box',
    primaryMuscles: ['Adducteurs'], secondaryMuscles: ['Fessiers', 'Core', 'Obliques'],
    description: 'Planche latérale jambe sur banc pour adducteurs isométrique. Corps aligné, hanche haute, respiration continue.',
    variations: ['copenhagen plank', 'copenhagen hold', 'copenhagen adduction hold']
  }),
  ex('Cossack squat profond', 'reps', 5, 1.15, {
    muscleGroup: 'Adducteurs', category: 'Adducteurs', equipment: 'Poids du corps / Kettlebell',
    primaryMuscles: ['Adducteurs', 'Quadriceps'], secondaryMuscles: ['Fessiers', 'Mollets'],
    description: 'Squat latéral profond pour mobilité et force des adducteurs. Talon au sol ou relevé selon niveau, dos droit.',
    variations: ['deep cossack squat', 'cossack squat profond', 'lateral squat deep']
  }),
  ex('Fente latérale profonde', 'reps', 4, 1.05, {
    muscleGroup: 'Adducteurs', category: 'Adducteurs', equipment: 'Haltères / Kettlebell',
    primaryMuscles: ['Adducteurs', 'Quadriceps'], secondaryMuscles: ['Fessiers', 'Mollets'],
    description: 'Fente latérale amplitude maximale pour adducteurs et quadriceps. Buste vertical, charge devant la poitrine.',
    variations: ['deep lateral lunge', 'fente latérale profonde', 'side lunge deep']
  }),

  // ── MOLLETS / CHEVILLE (9) ──
  ex('Seated calf raise unilatéral', 'reps', 3, 0.80, {
    muscleGroup: 'Mollets', category: 'Mollets', equipment: 'Machine mollets assis',
    primaryMuscles: ['Soléaire'], secondaryMuscles: ['Gastrocnémiens'],
    description: 'Mollets assis unilatéral pour cibler le soléaire. Amplitude complète, pause en haut 1 s.',
    variations: ['seated single leg calf raise', 'mollet assis unilatéral', 'one leg seated calf raise']
  }),
  ex('Mollet isométrique debout', 'seconds', 2, 0.75, {
    muscleGroup: 'Mollets', category: 'Mollets', equipment: 'Poids du corps / Marche',
    primaryMuscles: ['Gastrocnémiens', 'Soléaire'], secondaryMuscles: ['Mollets'],
    description: 'Maintien en contraction plantaire debout pour endurance mollet. Talons levés, équilibre stable.',
    variations: ['standing calf isometric', 'mollet isométrique', 'calf hold standing']
  }),
  ex('Mollet isométrique unilatéral', 'seconds', 4, 1.00, {
    muscleGroup: 'Mollets', category: 'Mollets', equipment: 'Marche / Poids du corps',
    primaryMuscles: ['Gastrocnémiens', 'Soléaire'], secondaryMuscles: ['Mollets', 'Cheville'],
    description: 'Maintien unipodal sur pointes pour force et stabilité cheville. Contrôle le bassin, pas de bascule.',
    variations: ['single leg calf isometric', 'mollet iso unilatéral', 'one leg calf hold']
  }),
  ex('Tibialis raise debout libre', 'reps', 2, 0.55, {
    muscleGroup: 'Cheville / pied', category: 'Mollets', equipment: 'Poids du corps',
    primaryMuscles: ['Tibial antérieur'], secondaryMuscles: ['Extenseurs des orteils'],
    description: 'Flexion dorsale debout sans mur pour renforcer le tibial antérieur. Dos au mur optionnel, montée contrôlée.',
    variations: ['tibialis raise standing', 'tibialis raise libre', 'toe raise standing']
  }),
  ex('Tibialis raise à la machine', 'reps', 2, 0.60, {
    muscleGroup: 'Cheville / pied', category: 'Mollets', equipment: 'Machine tibialis',
    primaryMuscles: ['Tibial antérieur'], secondaryMuscles: ['Extenseurs des orteils'],
    description: 'Dorsiflexion guidée sur machine dédiée. Amplitude complète, charge progressive.',
    variations: ['tibialis machine', 'tibialis raise machine', 'dorsiflexion machine']
  }),
  ex('Tibialis raise unilatéral', 'reps', 3, 0.70, {
    muscleGroup: 'Cheville / pied', category: 'Mollets', equipment: 'Poids du corps / Haltère',
    primaryMuscles: ['Tibial antérieur'], secondaryMuscles: ['Cheville', 'Extenseurs des orteils'],
    description: 'Tibialis raise une jambe pour corriger les asymétries cheville. Montée lente, pause en haut.',
    variations: ['single leg tibialis raise', 'tibialis unilatéral', 'one leg dorsiflexion']
  }),
  ex('Marche sur pointes', 'seconds', 2, 0.55, {
    muscleGroup: 'Mollets', category: 'Mollets', equipment: 'Poids du corps',
    primaryMuscles: ['Gastrocnémiens', 'Soléaire'], secondaryMuscles: ['Mollets', 'Cheville'],
    description: 'Marche sur la pointe des pieds pour endurance et stabilité cheville. Petits pas, chevilles stables.',
    variations: ['toe walk', 'marche sur pointes', 'calf walk']
  }),
  ex('Marche sur talons', 'seconds', 2, 0.50, {
    muscleGroup: 'Cheville / pied', category: 'Mollets', equipment: 'Poids du corps',
    primaryMuscles: ['Tibial antérieur'], secondaryMuscles: ['Extenseurs des orteils', 'Cheville'],
    description: 'Marche sur les talons, orteils relevés, pour tibial antérieur et prévention shin splints. Genoux souples.',
    variations: ['heel walk', 'marche sur talons', 'dorsiflexion walk']
  }),
  ex('Short foot', 'seconds', 2, 0.40, {
    muscleGroup: 'Cheville / pied', category: 'Mollets', equipment: 'Aucun',
    primaryMuscles: ['Intrinsèques du pied', 'Voûte plantaire'], secondaryMuscles: ['Tibial postérieur'],
    description: 'Activation de la voûte plantaire sans flexer les orteils. « Raccourcis » le pied, maintiens 5–10 s.',
    variations: ['short foot exercise', 'short foot', 'pied court']
  }),

  // ── ABDOMINAUX (16) ──
  ex('Cable crunch à genoux', 'reps', 3, 0.80, {
    muscleGroup: 'Abdominaux', category: 'Abdominaux', equipment: 'Poulie haute',
    primaryMuscles: ['Grand droit de l\'abdomen'], secondaryMuscles: ['Obliques'],
    description: 'Crunch à genoux à la poulie pour flexion du tronc sous charge. Arrondis le dos, coudes vers les genoux.',
    variations: ['kneeling cable crunch', 'crunch poulie genoux', 'cable ab crunch']
  }),
  ex('Ab wheel depuis les genoux lesté', 'reps', 7, 1.70, {
    muscleGroup: 'Abdominaux', category: 'Abdominaux', equipment: 'Roue abdominale + Gilet',
    primaryMuscles: ['Grand droit de l\'abdomen', 'Transverse'], secondaryMuscles: ['Grand dorsal', 'Deltoïdes'],
    description: 'Rollout depuis les genoux avec charge pour progression vers les pieds. Ne cambre pas les lombaires en extension.',
    variations: ['weighted kneeling ab wheel', 'roue abdominale genoux lesté', 'ab wheel weighted knees']
  }),
  ex('Ab wheel depuis les pieds', 'reps', 8, 2.00, {
    muscleGroup: 'Abdominaux', category: 'Abdominaux', equipment: 'Roue abdominale',
    primaryMuscles: ['Grand droit de l\'abdomen', 'Transverse'], secondaryMuscles: ['Grand dorsal', 'Deltoïdes', 'Fessiers'],
    description: 'Rollout complet depuis les pieds, niveau avancé anti-extension. Serre les fessiers, bras tendus, amplitude contrôlée.',
    variations: ['standing ab wheel', 'ab wheel from feet', 'roue abdominale pieds']
  }),
  ex('Body saw', 'reps', 5, 1.15, {
    muscleGroup: 'Abdominaux', category: 'Abdominaux', equipment: 'Gliders / Chaussettes',
    primaryMuscles: ['Grand droit de l\'abdomen', 'Transverse'], secondaryMuscles: ['Deltoïdes', 'Fessiers'],
    description: 'Planche avec glissement avant-arrière pour anti-extension dynamique. Corps rigide, ne laisse pas les hanches s\'affaisser.',
    variations: ['body saw', 'plank saw', 'scie corporelle']
  }),
  ex('RKC plank', 'seconds', 5, 1.15, {
    muscleGroup: 'Abdominaux', category: 'Abdominaux', equipment: 'Poids du corps',
    primaryMuscles: ['Transverse', 'Grand droit de l\'abdomen'], secondaryMuscles: ['Fessiers', 'Deltoïdes'],
    description: 'Planche maximale : fessiers et quadriceps contractés, coudes légèrement avancés. Respiration courte, tension totale.',
    variations: ['rkc plank', 'planche rkc', 'hardstyle plank']
  }),
  ex('Long lever plank', 'seconds', 5, 1.15, {
    muscleGroup: 'Abdominaux', category: 'Abdominaux', equipment: 'Poids du corps',
    primaryMuscles: ['Grand droit de l\'abdomen', 'Transverse'], secondaryMuscles: ['Deltoïdes', 'Fessiers'],
    description: 'Planche avant-bras avec bras avancés pour levier maximal. Corps aligné, bassin neutre.',
    variations: ['long lever plank', 'planche levier long', 'extended arm plank']
  }),
  ex('Hollow body rocks', 'reps', 5, 1.10, {
    muscleGroup: 'Abdominaux', category: 'Abdominaux', equipment: 'Poids du corps',
    primaryMuscles: ['Grand droit de l\'abdomen', 'Transverse'], secondaryMuscles: ['Fléchisseurs de hanche', 'Quadriceps'],
    description: 'Position hollow avec oscillations avant-arrière. Bas du dos plaqué au sol, bras et jambes tendus.',
    variations: ['hollow body rocks', 'hollow rocks', 'oscillations hollow']
  }),
  ex('V-ups', 'reps', 5, 1.15, {
    muscleGroup: 'Abdominaux', category: 'Abdominaux', equipment: 'Poids du corps',
    primaryMuscles: ['Grand droit de l\'abdomen'], secondaryMuscles: ['Fléchisseurs de hanche', 'Quadriceps'],
    description: 'Montée simultanée buste et jambes pour toucher les pieds. Mouvement contrôlé, pas d\'élan.',
    variations: ['v-ups', 'v ups', 'jackknife sit up']
  }),
  ex('Sit-up lesté', 'reps', 3, 0.80, {
    muscleGroup: 'Abdominaux', category: 'Abdominaux', equipment: 'Disque / Haltère',
    primaryMuscles: ['Grand droit de l\'abdomen'], secondaryMuscles: ['Fléchisseurs de hanche'],
    description: 'Relevé de buste avec charge contre la poitrine. Pieds calés, montée contrôlée sans tirer sur la nuque.',
    variations: ['weighted sit up', 'sit-up lesté', 'loaded sit up']
  }),
  ex('Suitcase hold', 'seconds', 4, 0.95, {
    muscleGroup: 'Abdominaux', category: 'Abdominaux', equipment: 'Haltère / Kettlebell',
    primaryMuscles: ['Obliques', 'Transverse'], secondaryMuscles: ['Érecteurs du rachis', 'Quadratus lumborum'],
    description: 'Maintien isométrique charge unilatérale debout — anti-flexion latérale. Buste vertical, ne pencher pas du côté opposé.',
    variations: ['suitcase hold', 'tenue valise', 'unilateral hold']
  }),
  ex('Anti-rotation hold à la poulie', 'seconds', 3, 0.75, {
    muscleGroup: 'Abdominaux', category: 'Abdominaux', equipment: 'Poulie + Poignée',
    primaryMuscles: ['Obliques', 'Transverse'], secondaryMuscles: ['Grand droit de l\'abdomen', 'Deltoïdes'],
    description: 'Pallof press isométrique ou hold : résiste à la rotation. Bras tendus devant la poitrine, bassin fixe.',
    variations: ['anti rotation hold', 'pallof hold', 'tenue anti-rotation poulie']
  }),
  ex('Side bend poulie', 'reps', 2, 0.65, {
    muscleGroup: 'Abdominaux', category: 'Abdominaux', equipment: 'Poulie basse',
    primaryMuscles: ['Obliques'], secondaryMuscles: ['Quadratus lumborum', 'Transverse'],
    description: 'Flexion latérale à la poulie pour obliques. Mouvement contrôlé, pas de rotation du buste.',
    variations: ['cable side bend', 'side bend poulie', 'oblique cable bend']
  }),
  ex('Hanging knee raise lesté', 'reps', 5, 1.10, {
    muscleGroup: 'Abdominaux', category: 'Abdominaux', equipment: 'Barre de traction + Lest',
    primaryMuscles: ['Grand droit de l\'abdomen', 'Fléchisseurs de hanche'], secondaryMuscles: ['Avant-bras', 'Grand dorsal'],
    description: 'Relevé de genoux suspendu avec charge entre les pieds ou gilet. Évite le balancement, montée contrôlée.',
    variations: ['weighted hanging knee raise', 'relevé genoux lesté', 'knee raise weighted']
  }),
  ex('Toes-to-bar strict', 'reps', 7, 1.70, {
    muscleGroup: 'Abdominaux', category: 'Abdominaux', equipment: 'Barre de traction',
    primaryMuscles: ['Grand droit de l\'abdomen', 'Fléchisseurs de hanche'], secondaryMuscles: ['Grand dorsal', 'Avant-bras'],
    description: 'Montée des pieds à la barre sans kip ni élan. Corps gainé, flexion de hanche et de tronc strictes.',
    variations: ['strict toes to bar', 'toes to bar strict', 'ttb strict']
  }),
  ex('Windshield wipers strictes', 'reps', 8, 1.90, {
    muscleGroup: 'Abdominaux', category: 'Abdominaux', equipment: 'Barre de traction',
    primaryMuscles: ['Obliques', 'Grand droit de l\'abdomen'], secondaryMuscles: ['Fléchisseurs de hanche', 'Grand dorsal'],
    description: 'Jambes suspendues rotation latérale stricte sans élan. Contrôle chaque degré, pas de momentum.',
    variations: ['strict windshield wipers', 'windshield wipers strict', 'essuie-glaces strictes']
  }),

  // ── AVANT-BRAS / GRIP (9, sans carries) ──
  ex('Dead hang', 'seconds', 3, 0.75, {
    muscleGroup: 'Avant-bras', category: 'Avant-bras', equipment: 'Barre de traction',
    primaryMuscles: ['Fléchisseurs des doigts', 'Brachio-radial'], secondaryMuscles: ['Grand dorsal', 'Épaules'],
    description: 'Suspension passive ou active pour force de grip et mobilité d\'épaule. Épaules en dépression légère, respiration nasale.',
    variations: ['dead hang', 'suspension passive', 'bar hang']
  }),
  ex('Dead hang lesté', 'seconds', 5, 1.05, {
    muscleGroup: 'Avant-bras', category: 'Avant-bras', equipment: 'Barre + Lest',
    primaryMuscles: ['Fléchisseurs des doigts', 'Brachio-radial'], secondaryMuscles: ['Grand dorsal', 'Épaules'],
    description: 'Suspension avec ceinture ou gilet pour progresser vers le one-arm hang. Maintien sans douleur coude.',
    variations: ['weighted dead hang', 'dead hang lesté', 'loaded hang']
  }),
  ex('Dead hang une main assisté', 'seconds', 5, 1.10, {
    muscleGroup: 'Avant-bras', category: 'Avant-bras', equipment: 'Barre + Support',
    primaryMuscles: ['Fléchisseurs des doigts', 'Brachio-radial'], secondaryMuscles: ['Épaules', 'Core'],
    description: 'Progression vers le hang unilatéral avec assistance de l\'autre main ou élastique. Épaule active, grip ferme.',
    variations: ['assisted one arm hang', 'dead hang un bras assisté', 'one arm hang assisted']
  }),
  ex('Towel hang', 'seconds', 5, 1.15, {
    muscleGroup: 'Avant-bras', category: 'Avant-bras', equipment: 'Barre + Serviette',
    primaryMuscles: ['Fléchisseurs des doigts', 'Fléchisseurs profonds'], secondaryMuscles: ['Brachio-radial'],
    description: 'Suspension sur serviette pour grip de force. Serre fort, épaules en dépression.',
    variations: ['towel hang', 'serviette hang', 'towel grip hang']
  }),
  ex('Towel hang une main assisté', 'seconds', 7, 1.40, {
    muscleGroup: 'Avant-bras', category: 'Avant-bras', equipment: 'Barre + Serviette',
    primaryMuscles: ['Fléchisseurs des doigts'], secondaryMuscles: ['Brachio-radial', 'Épaules'],
    description: 'Towel hang unilatéral assisté, niveau avancé de grip. Progression très graduelle.',
    variations: ['assisted one arm towel hang', 'towel hang un bras', 'one arm towel hang']
  }),
  ex('Plate pinch hold', 'seconds', 4, 0.90, {
    muscleGroup: 'Avant-bras', category: 'Avant-bras', equipment: 'Disques',
    primaryMuscles: ['Fléchisseurs des doigts', 'Adducteurs du pouce'], secondaryMuscles: ['Brachio-radial'],
    description: 'Pinch hold entre deux disques lisses. Pouce actif, maintien sans glissement.',
    variations: ['plate pinch hold', 'pinch grip hold', 'tenue pinch disques']
  }),
  ex('Gripper', 'reps', 3, 0.65, {
    muscleGroup: 'Avant-bras', category: 'Avant-bras', equipment: 'Gripper / Main gripper',
    primaryMuscles: ['Fléchisseurs des doigts'], secondaryMuscles: ['Fléchisseurs profonds'],
    description: 'Fermeture répétée d\'un gripper pour force de serrage. Amplitude complète, pause 1 s en fermé.',
    variations: ['hand gripper', 'gripper closes', 'captains of crush']
  }),
  ex('Gripper hold', 'seconds', 4, 0.80, {
    muscleGroup: 'Avant-bras', category: 'Avant-bras', equipment: 'Gripper',
    primaryMuscles: ['Fléchisseurs des doigts'], secondaryMuscles: ['Fléchisseurs profonds'],
    description: 'Maintien isométrique gripper fermé au maximum. Durée selon résistance du gripper.',
    variations: ['gripper hold', 'gripper isometric', 'tenue gripper']
  }),
  ex('Fat grip hold', 'seconds', 4, 0.95, {
    muscleGroup: 'Avant-bras', category: 'Avant-bras', equipment: 'Barre fat grip / Manchons',
    primaryMuscles: ['Fléchisseurs des doigts', 'Brachio-radial'], secondaryMuscles: ['Avant-bras'],
    description: 'Maintien ou farmer walk avec barre épaisse pour grip. Poignet neutre, prise ferme.',
    variations: ['fat grip hold', 'thick bar hold', 'tenue fat grip']
  }),

  // ── CARRIES (7) ──
  ex("Farmer's carry", 'seconds', 3, 0.90, {
    muscleGroup: 'Carries', category: 'Carries', equipment: 'Haltères / Trap bar',
    primaryMuscles: ['Fléchisseurs des doigts', 'Trapèzes'], secondaryMuscles: ['Core', 'Mollets', 'Érecteurs du rachis'],
    description: 'Marche avec charge lourde dans chaque main. Épaules basses, pas courts, grip ferme jusqu\'à la fin.',
    variations: ["farmer's carry", 'farmers walk', 'marche du fermier', 'loaded carry']
  }),
  ex('Suitcase carry', 'seconds', 4, 1.00, {
    muscleGroup: 'Carries', category: 'Carries', equipment: 'Haltère / Kettlebell',
    primaryMuscles: ['Obliques', 'Quadratus lumborum'], secondaryMuscles: ['Fléchisseurs des doigts', 'Trapèzes'],
    description: 'Marche avec charge unilatérale — anti-flexion latérale dynamique. Buste vertical, ne compenser pas en penchant.',
    variations: ['suitcase carry', 'single arm carry', 'marche valise']
  }),
  ex("Waiter's carry", 'seconds', 4, 0.95, {
    muscleGroup: 'Carries', category: 'Carries', equipment: 'Haltère / Kettlebell',
    primaryMuscles: ['Deltoïdes', 'Trapèzes supérieurs'], secondaryMuscles: ['Core', 'Triceps'],
    description: 'Marche avec charge overhead un bras, comme un plateau. Coude verrouillé, core serré.',
    variations: ["waiter's carry", 'waiter walk', 'overhead unilateral carry']
  }),
  ex('Overhead carry', 'seconds', 5, 1.10, {
    muscleGroup: 'Carries', category: 'Carries', equipment: 'Barre / Haltères',
    primaryMuscles: ['Deltoïdes', 'Trapèzes supérieurs'], secondaryMuscles: ['Core', 'Triceps', 'Érecteurs du rachis'],
    description: 'Marche charge au-dessus de la tête, stabilité d\'épaule et core maximale. Regard droit, ribs down.',
    variations: ['overhead carry', 'oh carry', 'marche overhead']
  }),
  ex('Front rack carry', 'seconds', 4, 1.00, {
    muscleGroup: 'Carries', category: 'Carries', equipment: 'Barre / Kettlebells',
    primaryMuscles: ['Deltoïdes antérieurs', 'Core'], secondaryMuscles: ['Trapèzes', 'Quadriceps'],
    description: 'Marche en rack avant (barre ou KBs). Coudes hauts, thorax ouvert, pas courts.',
    variations: ['front rack carry', 'front carry', 'marche rack avant']
  }),
  ex('Bear hug carry', 'seconds', 4, 1.00, {
    muscleGroup: 'Carries', category: 'Carries', equipment: 'Sandbag / Sac lourd',
    primaryMuscles: ['Grand dorsal', 'Biceps', 'Core'], secondaryMuscles: ['Deltoïdes', 'Érecteurs du rachis'],
    description: 'Port du sac en bear hug contre la poitrine. Serre fort, ne laisse pas le sac glisser.',
    variations: ['bear hug carry', 'sandbag carry', 'marche bear hug']
  }),
  ex('Zercher carry', 'seconds', 5, 1.15, {
    muscleGroup: 'Carries', category: 'Carries', equipment: 'Barre',
    primaryMuscles: ['Biceps', 'Core', 'Érecteurs du rachis'], secondaryMuscles: ['Quadriceps', 'Grand dorsal'],
    description: 'Marche barre en position Zercher (coude). Buste vertical, core maximal, pas contrôlés.',
    variations: ['zercher carry', 'marche zercher', 'zercher walk']
  }),

  // ── PUISSANCE / PLIOMÉTRIE (12) ──
  ex('Broad jump', 'reps', 4, 1.25, {
    muscleGroup: 'Puissance', category: 'Puissance', equipment: 'Poids du corps',
    primaryMuscles: ['Quadriceps', 'Fessiers'], secondaryMuscles: ['Mollets', 'Core'],
    description: 'Saut horizontal maximal depuis squat demi-amplitude. Atterrissage souple genoux fléchis, mesure la distance.',
    variations: ['broad jump', 'standing long jump', 'saut en longueur']
  }),
  ex('Tuck jump', 'reps', 4, 1.15, {
    muscleGroup: 'Puissance', category: 'Puissance', equipment: 'Poids du corps',
    primaryMuscles: ['Quadriceps', 'Fessiers'], secondaryMuscles: ['Mollets', 'Core'],
    description: 'Saut vertical genoux poitrine en l\'air. Atterrissage contrôlé, enchaîne sans pause longue.',
    variations: ['tuck jump', 'saut groupé', 'knee tuck jump']
  }),
  ex('Skater jump', 'reps', 3, 0.95, {
    muscleGroup: 'Puissance', category: 'Puissance', equipment: 'Poids du corps',
    primaryMuscles: ['Fessiers', 'Quadriceps'], secondaryMuscles: ['Adducteurs', 'Mollets'],
    description: 'Saut latéral alterné type patineur. Atterrissage sur une jambe, bassin stable.',
    variations: ['skater jump', 'lateral bound', 'saut patineur']
  }),
  ex('Split jump', 'reps', 4, 1.10, {
    muscleGroup: 'Puissance', category: 'Puissance', equipment: 'Poids du corps',
    primaryMuscles: ['Quadriceps', 'Fessiers'], secondaryMuscles: ['Mollets', 'Core'],
    description: 'Fente sautée alternée en l\'air. Switch des jambes mid-air, atterrissage en fente profonde.',
    variations: ['split jump', 'jumping lunge', 'fente sautée']
  }),
  ex('Depth jump', 'reps', 6, 1.50, {
    muscleGroup: 'Puissance', category: 'Puissance', equipment: 'Box',
    primaryMuscles: ['Quadriceps', 'Fessiers'], secondaryMuscles: ['Mollets', 'Tendons'],
    description: 'Chute depuis box puis saut vertical immédiat (réactif). Contact sol minimal, genoux stables.',
    variations: ['depth jump', 'drop jump reactive', 'saut profondeur']
  }),
  ex('Bounding', 'reps', 5, 1.20, {
    muscleGroup: 'Puissance', category: 'Puissance', equipment: 'Poids du corps',
    primaryMuscles: ['Fessiers', 'Quadriceps'], secondaryMuscles: ['Mollets', 'Ischio-jambiers'],
    description: 'Enchaînement de foulées bondissantes pour puissance horizontale. Amplitude genou haute, poussée explosive.',
    variations: ['bounding', 'power bounds', 'foulées bondissantes']
  }),
  ex('Plyometric push-up', 'reps', 4, 1.30, {
    muscleGroup: 'Puissance', category: 'Puissance', equipment: 'Poids du corps',
    primaryMuscles: ['Pectoraux', 'Triceps'], secondaryMuscles: ['Deltoïdes antérieurs', 'Core'],
    description: 'Pompes explosives mains décollent du sol. Atterrissage souple, corps gainé.',
    variations: ['plyometric push up', 'explosive push up', 'pompes pliométriques']
  }),
  ex('Depth push-up', 'reps', 6, 1.55, {
    muscleGroup: 'Puissance', category: 'Puissance', equipment: 'Box / Parallettes',
    primaryMuscles: ['Pectoraux', 'Triceps'], secondaryMuscles: ['Deltoïdes', 'Core'],
    description: 'Mains sur box, chute contrôlée puis poussée explosive. Progression avancée pliométrie haut du corps.',
    variations: ['depth push up', 'drop push up', 'pompes profondeur']
  }),
  ex('Medicine ball slam', 'reps', 3, 1.00, {
    muscleGroup: 'Puissance', category: 'Puissance', equipment: 'Medecine ball',
    primaryMuscles: ['Grand dorsal', 'Core', 'Deltoïdes'], secondaryMuscles: ['Triceps', 'Fessiers'],
    description: 'Slam overhead au sol avec med ball. Extension complète puis slam violent en engageant le core.',
    variations: ['med ball slam', 'medicine ball slam', 'slam medecine ball']
  }),
  ex('Medicine ball chest throw', 'reps', 3, 0.95, {
    muscleGroup: 'Puissance', category: 'Puissance', equipment: 'Medecine ball + Mur',
    primaryMuscles: ['Pectoraux', 'Triceps'], secondaryMuscles: ['Deltoïdes antérieurs', 'Core'],
    description: 'Lancer poitrine contre mur en extension explosive. Recule pour amortir la réception.',
    variations: ['med ball chest throw', 'chest pass med ball', 'lancer poitrine med ball']
  }),
  ex('Medicine ball rotational throw', 'reps', 4, 1.05, {
    muscleGroup: 'Puissance', category: 'Puissance', equipment: 'Medecine ball + Mur',
    primaryMuscles: ['Obliques', 'Grand dorsal'], secondaryMuscles: ['Core', 'Deltoïdes'],
    description: 'Lancer rotatif depuis hanche contre mur. Rotation puissante depuis le sol, bras relâché puis explosif.',
    variations: ['rotational med ball throw', 'lancer rotatif med ball', 'med ball side throw']
  }),
  ex('Medicine ball overhead throw', 'reps', 4, 1.05, {
    muscleGroup: 'Puissance', category: 'Puissance', equipment: 'Medecine ball',
    primaryMuscles: ['Deltoïdes', 'Triceps', 'Core'], secondaryMuscles: ['Grand dorsal', 'Fessiers'],
    description: 'Lancer overhead vers l\'arrière ou au-dessus. Extension triple hanche-genou-cheville.',
    variations: ['overhead med ball throw', 'lancer overhead med ball', 'backward med ball throw']
  }),

  // ── HALTÉROPHILIE (12) ──
  ex('Power clean', 'reps', 7, 1.60, {
    muscleGroup: 'Haltérophilie', category: 'Haltérophilie', equipment: 'Barre',
    primaryMuscles: ['Quadriceps', 'Fessiers', 'Trapèzes'], secondaryMuscles: ['Grand dorsal', 'Deltoïdes', 'Core'],
    description: 'Épaulé depuis le sol avec réception en squat partiel. 2e tirage explosif, coudes hauts en réception.',
    variations: ['power clean', 'épaulé-jeté power', 'clean power']
  }),
  ex('Hang power clean', 'reps', 6, 1.45, {
    muscleGroup: 'Haltérophilie', category: 'Haltérophilie', equipment: 'Barre',
    primaryMuscles: ['Quadriceps', 'Fessiers', 'Trapèzes'], secondaryMuscles: ['Grand dorsal', 'Deltoïdes'],
    description: 'Power clean depuis hang (genoux), sans 1er tirage. Hinge puis extension violente.',
    variations: ['hang power clean', 'hang clean power', 'épaulé hang power']
  }),
  ex('Clean', 'reps', 8, 1.80, {
    muscleGroup: 'Haltérophilie', category: 'Haltérophilie', equipment: 'Barre',
    primaryMuscles: ['Quadriceps', 'Fessiers', 'Trapèzes'], secondaryMuscles: ['Grand dorsal', 'Deltoïdes', 'Core'],
    description: 'Épaulé complet avec réception en squat profond. Technique olympique complète.',
    variations: ['squat clean', 'clean', 'épaulé complet']
  }),
  ex('Clean & jerk', 'reps', 8, 2.00, {
    muscleGroup: 'Haltérophilie', category: 'Haltérophilie', equipment: 'Barre',
    primaryMuscles: ['Quadriceps', 'Deltoïdes', 'Triceps'], secondaryMuscles: ['Fessiers', 'Trapèzes', 'Core'],
    description: 'Enchaînement épaulé + jeté, mouvement olympique complet. Split ou power jerk selon niveau.',
    variations: ['clean and jerk', 'clean & jerk', 'épaulé-jeté']
  }),
  ex('Power snatch', 'reps', 8, 1.80, {
    muscleGroup: 'Haltérophilie', category: 'Haltérophilie', equipment: 'Barre',
    primaryMuscles: ['Deltoïdes', 'Trapèzes', 'Fessiers'], secondaryMuscles: ['Quadriceps', 'Grand dorsal'],
    description: 'Arraché avec réception en squat partiel, prise large. Barre près du corps en 2e tirage.',
    variations: ['power snatch', 'arraché power', 'snatch power']
  }),
  ex('Hang power snatch', 'reps', 7, 1.60, {
    muscleGroup: 'Haltérophilie', category: 'Haltérophilie', equipment: 'Barre',
    primaryMuscles: ['Deltoïdes', 'Trapèzes', 'Fessiers'], secondaryMuscles: ['Quadriceps', 'Grand dorsal'],
    description: 'Arraché power depuis hang. Contact hanche-cuisse, bras tendus en tirage.',
    variations: ['hang power snatch', 'hang snatch power', 'arraché hang power']
  }),
  ex('Snatch', 'reps', 8, 2.00, {
    muscleGroup: 'Haltérophilie', category: 'Haltérophilie', equipment: 'Barre',
    primaryMuscles: ['Deltoïdes', 'Trapèzes', 'Fessiers'], secondaryMuscles: ['Quadriceps', 'Grand dorsal', 'Core'],
    description: 'Arraché complet réception squat profond. Mouvement le plus technique de l\'haltéro.',
    variations: ['squat snatch', 'snatch', 'arraché complet']
  }),
  ex('Clean pull', 'reps', 5, 1.20, {
    muscleGroup: 'Haltérophilie', category: 'Haltérophilie', equipment: 'Barre',
    primaryMuscles: ['Fessiers', 'Trapèzes', 'Grand dorsal'], secondaryMuscles: ['Quadriceps', 'Ischio-jambiers'],
    description: 'Tirage d\'épaulé sans réception — travail technique et puissance. Extension complète sur pointes.',
    variations: ['clean pull', 'tirage épaulé', 'pull clean']
  }),
  ex('Snatch pull', 'reps', 5, 1.20, {
    muscleGroup: 'Haltérophilie', category: 'Haltérophilie', equipment: 'Barre',
    primaryMuscles: ['Trapèzes', 'Fessiers', 'Grand dorsal'], secondaryMuscles: ['Deltoïdes', 'Quadriceps'],
    description: 'Tirage d\'arraché sans réception. Prise large, coude haut en fin de tirage.',
    variations: ['snatch pull', 'tirage arraché', 'pull snatch']
  }),
  ex('High pull', 'reps', 5, 1.15, {
    muscleGroup: 'Haltérophilie', category: 'Haltérophilie', equipment: 'Barre / Haltères',
    primaryMuscles: ['Trapèzes', 'Deltoïdes'], secondaryMuscles: ['Grand dorsal', 'Fessiers', 'Quadriceps'],
    description: 'Tirage vertical explosif coude haut, sans réception. Hinge puis extension violente.',
    variations: ['high pull', 'tirage haut', 'barbell high pull']
  }),
  ex('Thruster barre', 'reps', 5, 1.30, {
    muscleGroup: 'Haltérophilie', category: 'Haltérophilie', equipment: 'Barre',
    primaryMuscles: ['Quadriceps', 'Deltoïdes', 'Triceps'], secondaryMuscles: ['Fessiers', 'Core'],
    description: 'Front squat enchaîné avec push press sans pause. Un mouvement fluide squat-to-overhead.',
    variations: ['barbell thruster', 'thruster barre', 'thruster']
  }),
  ex('Thruster haltères', 'reps', 4, 1.20, {
    muscleGroup: 'Haltérophilie', category: 'Haltérophilie', equipment: 'Haltères',
    primaryMuscles: ['Quadriceps', 'Deltoïdes', 'Triceps'], secondaryMuscles: ['Fessiers', 'Core'],
    description: 'Thruster avec haltères, squat puis développé. Poignées neutres ou pronation selon confort.',
    variations: ['dumbbell thruster', 'thruster haltères', 'db thruster']
  }),

  // ── CHAÎNE POSTÉRIEURE (extras) ──
  ex('Back extension', 'reps', 2, 0.75, {
    muscleGroup: 'Dorsaux', category: 'Dorsaux', equipment: 'Banc 45° / GHD',
    primaryMuscles: ['Érecteurs du rachis', 'Grand dorsal'], secondaryMuscles: ['Fessiers', 'Ischio-jambiers'],
    description: 'Extension de tronc sur banc 45° pour lombaires et chaîne postérieure. Ne hyperétends pas, monte jusqu\'alignement.',
    variations: ['back extension', 'hyperextension', 'extension lombaire']
  }),
  ex('Back extension lestée', 'reps', 3, 0.90, {
    muscleGroup: 'Dorsaux', category: 'Dorsaux', equipment: 'Banc 45° + Disque',
    primaryMuscles: ['Érecteurs du rachis'], secondaryMuscles: ['Fessiers', 'Grand dorsal', 'Ischio-jambiers'],
    description: 'Back extension avec disque contre la poitrine. Montée contrôlée, disque serré.',
    variations: ['weighted back extension', 'back extension lestée', 'hyperextension lestée']
  }),
  ex('Jefferson curl', 'reps', 4, 0.75, {
    muscleGroup: 'Ischio-jambiers', category: 'Ischio-jambiers', equipment: 'Barre légère / Kettlebell',
    primaryMuscles: ['Ischio-jambiers', 'Érecteurs du rachis'], secondaryMuscles: ['Fessiers', 'Mollets'],
    description: 'Flexion vertébrale segmentée debout, charge légère. Arrondis vertèbre par vertèbre, remonte lentement.',
    variations: ['jefferson curl', 'curl jefferson', 'flexion jefferson']
  }),
  ex('Good morning barre', 'reps', 4, 1.00, {
    muscleGroup: 'Ischio-jambiers', category: 'Ischio-jambiers', equipment: 'Barre',
    primaryMuscles: ['Ischio-jambiers', 'Érecteurs du rachis'], secondaryMuscles: ['Fessiers', 'Grand dorsal'],
    description: 'Hinge buste avec barre sur les trapèzes. Dos plat, fessiers en arrière, sensation ischios en bas.',
    variations: ['barbell good morning', 'good morning barre', 'gm barre']
  }),
  ex('Good morning haltères', 'reps', 3, 0.85, {
    muscleGroup: 'Ischio-jambiers', category: 'Ischio-jambiers', equipment: 'Haltères',
    primaryMuscles: ['Ischio-jambiers', 'Érecteurs du rachis'], secondaryMuscles: ['Fessiers'],
    description: 'Good morning avec haltères sur les épaules. Même technique que barre, charge modérée.',
    variations: ['dumbbell good morning', 'good morning haltères', 'gm haltères']
  }),
  ex('Hip hinge élastique', 'reps', 1, 0.50, {
    muscleGroup: 'Ischio-jambiers', category: 'Ischio-jambiers', equipment: 'Bande élastique',
    primaryMuscles: ['Ischio-jambiers', 'Fessiers'], secondaryMuscles: ['Érecteurs du rachis', 'Core'],
    description: 'Apprentissage du hinge avec élastique en resistance. Push fessiers en arrière, dos plat.',
    variations: ['band hip hinge', 'hip hinge élastique', 'hinge bande']
  }),
  ex('Kettlebell clean', 'reps', 5, 1.10, {
    muscleGroup: 'Puissance', category: 'Puissance', equipment: 'Kettlebell',
    primaryMuscles: ['Fessiers', 'Grand dorsal', 'Deltoïdes'], secondaryMuscles: ['Quadriceps', 'Trapèzes', 'Core'],
    description: 'Épaulé kettlebell en un mouvement fluide vers rack. Hanche explosive, coude près du corps.',
    variations: ['kb clean', 'kettlebell clean', 'clean kettlebell']
  }),
  ex('Kettlebell clean & press', 'reps', 6, 1.35, {
    muscleGroup: 'Puissance', category: 'Puissance', equipment: 'Kettlebell',
    primaryMuscles: ['Deltoïdes', 'Triceps', 'Fessiers'], secondaryMuscles: ['Quadriceps', 'Core', 'Grand dorsal'],
    description: 'Clean enchaîné avec push press kettlebell. Rack solide avant la poussée overhead.',
    variations: ['kb clean and press', 'kettlebell clean press', 'clean & press kb']
  }),
  ex('Kettlebell snatch', 'reps', 7, 1.45, {
    muscleGroup: 'Puissance', category: 'Puissance', equipment: 'Kettlebell',
    primaryMuscles: ['Deltoïdes', 'Trapèzes', 'Fessiers'], secondaryMuscles: ['Grand dorsal', 'Quadriceps', 'Core'],
    description: 'Arraché kettlebell overhead en un temps. Punch overhead pour éviter l\'ecchymose poignet.',
    variations: ['kb snatch', 'kettlebell snatch', 'arraché kettlebell']
  }),
];
