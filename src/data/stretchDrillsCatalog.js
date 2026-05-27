/**
 * Drills course/coordination + pliométries complémentaires (liste 50 drills).
 * Fusionné dans `stretchDatabase.js`.
 */

export const stretchDrillsCatalog = {
  // ═══════════════════════════════════════════════════════════════════════
  // DRILLS SPRINT / COORDINATION (1–15, sauf bounding déjà en pliométrie)
  // ═══════════════════════════════════════════════════════════════════════

  drill_a_skip: {
    name: "Drill — A-Skip",
    category: "Drills course",
    bodyZone: "full",
    primaryMuscles: ["Fléchisseurs de hanche", "Quadriceps"],
    secondaryMuscles: ["Mollets", "Fessiers", "Abdominaux", "Deltoïdes"],
    equipment: "Aucun",
    defaultDuration: 45,
    position: "Debout, déplacement avant",
    difficulty: 2,
    description:
      "Drill de course qui combine foulée haute et rythme de skip pour préparer les accélérations : travaille la montée de genou, l’appui actif et la coordination bras-jambes.",
    instructions:
      "1) Posture athlétique : buste droit, bassin neutre, regard loin, coudes pliés à ~90°. 2) Avance en petits bonds rythmés. 3) À chaque appui, monte un genou vers 90° (cuisses parallèles au sol) en gardant le pied en dorsiflexion (orteils vers le tibia). 4) Pousse fortement le sol avec la jambe d’appui (triple extension cheville-genou-hanche) pour créer l’élévation. 5) Alterne gauche/droite en synchronisant bras opposé à jambe (comme en course). 6) Reste sur l’avant-pied : contact court, bruit d’appui discret. 7) Garde le tronc gainé, évite de te pencher en arrière. 8) Commence lentement 10–15 m puis augmente la cadence sans perdre la technique.",
    contraindications: ["Douleur aiguë hanche/genou", "entorse cheville non consolidée", "lombalgie en extension répétée"],
    variations: ["A-skip", "a skip", "skips A", "montées de genoux skip"]
  },

  drill_b_skip: {
    name: "Drill — B-Skip",
    category: "Drills course",
    bodyZone: "full",
    primaryMuscles: ["Fléchisseurs de hanche", "Ischio-jambiers"],
    secondaryMuscles: ["Quadriceps", "Mollets", "Fessiers", "Abdominaux"],
    equipment: "Aucun",
    defaultDuration: 45,
    position: "Debout, déplacement avant",
    difficulty: 3,
    description:
      "Variante avancée du A-skip : ajoute l’extension active de la jambe avant l’appui pour imiter la phase d’attaque du sprint et renforcer ischios-fessiers.",
    instructions:
      "1) Même posture de départ que le A-skip. 2) Monte le genou comme en A-skip. 3) Une fois le genou haut, tends activement la jambe vers l’avant (extension genou) sans verrouiller le genou. 4) Effectue un mouvement de « griffage » : ramène la jambe vers le bas et l’arrière sous les hanches pour poser le pied près du centre de masse (appui sous le bassin, pas devant). 5) Au contact, pousse immédiatement pour le skip suivant. 6) Le pied frappe le sol sous toi, pas loin devant (évite le freinage). 7) Bras opposés synchronisés, épaules relâchées. 8) Priorise la qualité : amplitude modérée au début, puis cadence.",
    contraindications: ["Ischio-jambiers très raides ou douloureux", "débutant sans maîtrise du A-skip"],
    variations: ["B-skip", "b skip", "skips B", "pawing drill"]
  },

  drill_c_skip: {
    name: "Drill — C-Skip",
    category: "Drills course",
    bodyZone: "full",
    primaryMuscles: ["Ischio-jambiers", "Fessiers"],
    secondaryMuscles: ["Fléchisseurs de hanche", "Mollets", "Abdominaux"],
    equipment: "Aucun",
    defaultDuration: 40,
    position: "Debout, déplacement avant",
    difficulty: 3,
    description:
      "Drill de coordination postérieure : le talon monte vers les fesses avec un trajet circulaire rapide, utile pour activer la chaîne arrière avant sprint ou haies.",
    instructions:
      "1) Posture droite, appui sur l’avant-pied. 2) En avançant par petits bonds, fléchis activement le genou pour amener le talon vers la fesse (sans cambrer le dos). 3) Décris un léger arc circulaire avec le pied (genou ouvert latéralement de façon modérée). 4) Replace le pied sous le bassin avec un appui bref et réactif. 5) Alterne les jambes en gardant un rythme constant. 6) Les bras accompagnent la foulée (opposition). 7) Le buste reste stable : le mouvement vient de la hanche, pas du dos. 8) Surface courte (10–20 m), focus sur vitesse de cycle de jambe.",
    contraindications: ["Douleur rotulienne en flexion profonde", "tension lombaire en cambrure"],
    variations: ["C-skip", "c skip", "butt kick skip", "heel to glute skip"]
  },

  drill_ankling: {
    name: "Drill — Ankling",
    category: "Drills course",
    bodyZone: "mollets",
    primaryMuscles: ["Mollets", "Tibial antérieur"],
    secondaryMuscles: ["Soléaire", "Stabilisateurs de cheville", "Abdominaux"],
    equipment: "Aucun",
    defaultDuration: 35,
    position: "Debout, déplacement avant",
    difficulty: 2,
    description:
      "Travail de cheville et d’avant-pied : petits pas rapides avec genoux peu fléchis pour améliorer la rigidité du pied et l’économie de course.",
    instructions:
      "1) Debout, genoux souples mais quasi tendus (léger pli). 2) Avance uniquement grâce à la cheville : soulève les orteils (dorsiflexion) puis « roule » vers l’avant pour pousser avec l’avant-pied et les orteils. 3) Pas très courts, cadence élevée, amplitude basse. 4) Le bassin avance peu à chaque pas : l’énergie vient des mollets. 5) Bras actifs mais compacts. 6) Évite de sauter : le contact sol reste rapide et discret. 7) 15–25 m, récupération marche, 2–4 séries selon niveau.",
    contraindications: ["Tendinopathie d’Achille aiguë", "fasciite plantaire sévère"],
    variations: ["ankling", "ankle drill", "toe running", "petits pas cheville"]
  },

  drill_high_knees: {
    name: "Drill — High Knees (genoux hauts)",
    category: "Drills course",
    bodyZone: "quadriceps",
    primaryMuscles: ["Fléchisseurs de hanche", "Quadriceps"],
    secondaryMuscles: ["Mollets", "Abdominaux", "Fessiers"],
    equipment: "Aucun",
    defaultDuration: 30,
    position: "Debout sur place ou en avançant",
    difficulty: 2,
    description:
      "Montées de genoux rapides pour chauffer la hanche, activer le core et préparer les accélérations.",
    instructions:
      "1) Posture athlétique, coudes à 90°. 2) Monte un genou au-dessus de la hanche (ou le plus haut possible sans te voûter). 3) Appui bref sur l’avant-pied de la jambe au sol. 4) Alterne gauche/droite à cadence maximale contrôlée (sur place ou en avançant lentement). 5) Pousse le sol vers le bas avec le pied d’appui pour « rebondir ». 6) Buste droit, regard devant, bassin stable (évite les rotations). 7) Bras opposés synchronisés. 8) 15–30 s par série, récupération complète entre les répétitions.",
    contraindications: ["Douleur inguinale", "pubalgie", "problème de hanche (FAI) en flexion extrême"],
    variations: ["high knees", "genoux hauts", "montées de genoux rapides", "A skip rapide"]
  },

  drill_butt_kicks: {
    name: "Drill — Butt Kicks (talons aux fesses)",
    category: "Drills course",
    bodyZone: "ischios",
    primaryMuscles: ["Ischio-jambiers", "Fessiers"],
    secondaryMuscles: ["Mollets", "Érecteurs du rachis", "Abdominaux"],
    equipment: "Aucun",
    defaultDuration: 30,
    position: "Debout sur place ou en avançant",
    difficulty: 2,
    description:
      "Activation rapide des ischio-jambiers et préparation à la foulée : talon vers la fesse sans cambrure excessive.",
    instructions:
      "1) Debout, buste légèrement penché vers l’avant (angle course). 2) Ramène le talon vers la fesse en fléchissant le genou (pas en extension de hanche seule). 3) Alterne rapidement droite/gauche. 4) Les cuisses ne montent pas devant : le genou reste pointé vers le bas. 5) Appuis courts sur l’avant-pied. 6) Bras actifs, épaules basses. 7) Garde le bassin neutre : évite de te cambrer pour « toucher » la fesse. 8) 15–30 s, qualité de cycle avant vitesse pure.",
    contraindications: ["Ischio-jambiers en elongation douloureuse", "lombalgie"],
    variations: ["butt kicks", "talons aux fesses", "heel kicks", "fesses-aux-talons"]
  },

  drill_fast_feet: {
    name: "Drill — Fast Feet (appuis rapides)",
    category: "Drills course",
    bodyZone: "mollets",
    primaryMuscles: ["Mollets", "Quadriceps"],
    secondaryMuscles: ["Soléaire", "Abdominaux", "Stabilisateurs de cheville"],
    equipment: "Aucun",
    defaultDuration: 20,
    position: "Debout sur place",
    difficulty: 2,
    description:
      "Fréquence d’appuis maximale sur place pour développer la réactivité au sol et la coordination fine cheville-genou.",
    instructions:
      "1) Position athlétique : genoux souples, buste droit, poids sur l’avant-pied. 2) Alterne les appuis gauche/droite le plus vite possible sans sauter haut. 3) Amplitude minimale : les pieds « vibrent » au sol. 4) Les hanches restent stables, pas de déplacement latéral. 5) Bras compacts ou mains sur hanches au début pour isoler les jambes. 6) Respiration continue, pas d’apnée. 7) Séries courtes (10–20 s) car la qualité chute vite. 8) Progression : ajouter déplacement avant ou signal de départ.",
    contraindications: ["Cheville instable", "fatigue extrême (risque de faux mouvement)"],
    variations: ["fast feet", "quick feet", "pieds rapides", "appuis ultra rapides"]
  },

  drill_power_skip: {
    name: "Drill — Power Skip (skip explosif)",
    category: "Drills course",
    bodyZone: "full",
    primaryMuscles: ["Fessiers", "Quadriceps"],
    secondaryMuscles: ["Mollets", "Fléchisseurs de hanche", "Abdominaux", "Soléaire"],
    equipment: "Aucun",
    defaultDuration: 40,
    position: "Debout, déplacement avant",
    difficulty: 3,
    description:
      "Skip avec poussée verticale maximale : développe la puissance concentrique et l’amplitude de hanche pour le sprint et les sauts.",
    instructions:
      "1) Commence comme un A-skip lent. 2) Sur chaque appui, pousse fortement le sol pour obtenir une grande élévation verticale (pas seulement vers l’avant). 3) Monte le genou haut pendant la phase aérienne. 4) Atterris sur l’avant-pied, genou souple, puis enchaîne sans pause longue. 5) Utilise les bras pour tirer vers le haut (coordination). 6) 20–40 m max par passage : la fatigue technique arrive vite. 7) Récupération complète entre les séries. 8) Ne confonds pas avec le bounding : ici l’accent est vertical.",
    contraindications: ["Douleur rotulienne", "tendinopathie patellaire", "débutant sans base de force"],
    variations: ["power skip", "skip explosif", "vertical skip", "high skip"]
  },

  drill_straight_leg_bounds: {
    name: "Drill — Straight Leg Bounds (foulées jambes tendues)",
    category: "Drills course",
    bodyZone: "ischios",
    primaryMuscles: ["Ischio-jambiers", "Fessiers"],
    secondaryMuscles: ["Mollets", "Érecteurs du rachis", "Abdominaux"],
    equipment: "Aucun",
    defaultDuration: 40,
    position: "Course bondissante jambes tendues",
    difficulty: 3,
    description:
      "Foulées bondissantes avec jambes quasi tendues : sollicite la chaîne postérieure et l’attaque de pied active (pawing) en sprint.",
    instructions:
      "1) Avance en grands bonds, genoux peu fléchis (jambes « raides » mais pas verrouillées). 2) Le pied frappe le sol avec l’avant-pied, sous ou légèrement devant le bassin. 3) Pousse immédiatement après contact (rebond rapide). 4) Le buste reste légèrement penché avant, regard loin. 5) Bras en opposition ample pour équilibrer. 6) Amplitude modérée au début : cherche la fréquence et le « rebond » mollet-ischio. 7) 20–30 m, surface plane. 8) Évite de te pencher excessivement ou de frapper le talon en premier.",
    contraindications: ["Ischio-jambiers fragiles ou récents", "lombalgie"],
    variations: ["straight leg bounds", "stiff leg bounds", "foulées jambes tendues", "ankling bounds"]
  },

  drill_sprint_dribbles: {
    name: "Drill — Sprint Dribbles (foulées basses rapides)",
    category: "Drills course",
    bodyZone: "quadriceps",
    primaryMuscles: ["Quadriceps", "Mollets"],
    secondaryMuscles: ["Fessiers", "Fléchisseurs de hanche", "Abdominaux"],
    equipment: "Aucun",
    defaultDuration: 35,
    position: "Course courte amplitude",
    difficulty: 3,
    description:
      "Foulées très rapides et basses pour travailler la fréquence et la position de course (genou haut, appui sous le corps).",
    instructions:
      "1) Posture sprint : buste neutre, bassin haut. 2) Avance avec des foulées courtes et très rapides (comme si tu « rattrapais » le sol). 3) Monte le genou sans monter le bassin (cyclage). 4) Contact au sol sous les hanches, pas devant. 5) Bras rapides, coudes vers l’arrière. 6) 10–20 m, récupération longue. 7) Ne transforme pas en sprint maximal si la technique se dégrade. 8) Utile après A/B-skips en échauffement.",
    contraindications: ["Douleur aiguë tendon d’Achille", "fatigue neuromusculaire extrême"],
    variations: ["sprint dribbles", "dribbles", "fast leg cycle", "foulées basses"]
  },

  drill_marching_a: {
    name: "Drill — Marching A (A-skip lent)",
    category: "Drills course",
    bodyZone: "full",
    primaryMuscles: ["Fléchisseurs de hanche", "Quadriceps"],
    secondaryMuscles: ["Mollets", "Abdominaux", "Fessiers"],
    equipment: "Aucun",
    defaultDuration: 45,
    position: "Marche technique avant",
    difficulty: 1,
    description:
      "Version lente et pédagogique du A-skip : apprentissage de la posture, de la montée de genou et de l’appui actif sans impact élevé.",
    instructions:
      "1) Marche lentement vers l’avant. 2) À chaque pas, monte le genou à 90° en pause 1 seconde en haut. 3) Pose le pied à plat sous le bassin en contrôlant la descente. 4) Dorsiflexion du pied avant l’appui. 5) Bras opposés exagérés pour graver le schéma moteur. 6) Buste droit, regard devant. 7) 15–20 m, puis enchaîner sur A-skip dynamique si la forme est stable. 8) Idéal en rééducation de course ou premier jour de cycle.",
    contraindications: ["Douleur hanche en flexion maintenue"],
    variations: ["marching A", "walk A", "A march", "montée genou lente"]
  },

  drill_wall_drill: {
    name: "Drill — Wall Drill (montées genoux au mur)",
    category: "Drills course",
    bodyZone: "quadriceps",
    primaryMuscles: ["Fléchisseurs de hanche", "Quadriceps"],
    secondaryMuscles: ["Mollets", "Abdominaux", "Deltoïdes antérieurs"],
    equipment: "Mur",
    defaultDuration: 40,
    position: "Incliné contre un mur",
    difficulty: 2,
    description:
      "Travail de posture de sprint et de montée de genou explosive sans déplacement : renforce l’appui et le gainage.",
    instructions:
      "1) Face au mur, mains à hauteur d’épaules, corps incliné (angle course). 2) Un pied en appui arrière sur orteils, l’autre genou haut. 3) Alterne les montées de genou explosives en gardant le pied d’appui sur l’avant-pied. 4) Le genou monte devant, pas vers l’extérieur. 5) Bassin stable, pas de rotation. 6) Chaque montée est rapide ; la descente est contrôlée. 7) 10–20 alternances par série. 8) Resserre l’angle au mur si tu glisses (plus de charge sur les appuis).",
    contraindications: ["Douleur poignet en appui mur", "épaule antérieure irritée"],
    variations: ["wall drill", "wall drives", "montées genoux mur", "sprint wall drill"]
  },

  drill_carioca: {
    name: "Drill — Carioca (pas chassés latéraux)",
    category: "Drills course",
    bodyZone: "full",
    primaryMuscles: ["Adducteurs", "Abducteurs", "Fessiers"],
    secondaryMuscles: ["Quadriceps", "Mollets", "Obliques", "Abdominaux"],
    equipment: "Aucun",
    defaultDuration: 45,
    position: "Déplacement latéral",
    difficulty: 2,
    description:
      "Déplacement latéral croisé pour mobilité de hanche, coordination et préparation aux changements de direction.",
    instructions:
      "1) Oriente le buste vers l’avant (direction de jeu/course), hanches perpendiculaires au déplacement. 2) Déplace-toi latéralement en croisant une jambe devant puis derrière l’autre. 3) « Ouvert » : pied avant passe devant. 4) « Fermé » : pied arrière passe derrière. 5) Alterne les deux en rythme fluide. 6) Reste sur l’avant-pied, genoux souples. 7) Bras actifs pour l’équilibre. 8) 10–15 m dans un sens, puis retour en miroir. Commence lentement.",
    contraindications: ["Adducteurs douloureux (échauffement insuffisant)", "entorse de cheville récente"],
    variations: ["carioca", "karaoke", "grapevine", "pas chassés", "crossover drill"]
  },

  drill_wicket_drill: {
    name: "Drill — Wicket Drill (haies d’espacement)",
    category: "Drills course",
    bodyZone: "full",
    primaryMuscles: ["Fléchisseurs de hanche", "Quadriceps", "Mollets"],
    secondaryMuscles: ["Fessiers", "Abdominaux", "Ischio-jambiers"],
    equipment: "Plots ou haies basses (espacement 1–1,5 m)",
    defaultDuration: 50,
    position: "Course entre plots",
    difficulty: 3,
    description:
      "Course entre obstacles bas pour forcer une foulée haute, une fréquence contrôlée et une posture de sprint sans vitesse maximale.",
    instructions:
      "1) Place des plots/haies basses espacés régulièrement (souvent 1,0 à 1,5 m selon taille). 2) Démarre en posture athlétique. 3) Passe entre chaque plot en montant le genou sans « sauter » excessivement. 4) Appuie sous le corps, buste droit. 5) Bras synchronisés, coudes vers l’arrière. 6) Ne ralentis pas en regardant les plots : regard loin. 7) 2–4 passages, récupération complète. 8) Ajuste l’espacement si tu frôles les plots ou si tu « galopes » trop haut.",
    contraindications: ["Peur du franchissement non maîtrisée", "douleur aiguë genou"],
    variations: ["wicket drill", "wickets", "hurdle drill spacing", "haies espacées course"]
  },

  drill_sprint_start: {
    name: "Drill — Sprint Start (départ explosif)",
    category: "Drills course",
    bodyZone: "full",
    primaryMuscles: ["Quadriceps", "Fessiers", "Ischio-jambiers"],
    secondaryMuscles: ["Mollets", "Grand dorsal", "Abdominaux", "Deltoïdes"],
    equipment: "Piste ou terrain libre (5–20 m)",
    defaultDuration: 30,
    position: "Blocs ou départ 2 points",
    difficulty: 3,
    description:
      "Départ explosif sur courte distance pour travailler la projection initiale, la poussée et la mécanique des premières foulées.",
    instructions:
      "1) Position de départ : un pied avant, l’autre arrière, mains au sol ou sur genou selon niveau. 2) Bassin au-dessus des pieds, regard bas puis vers l’avant au « set ». 3) Au signal, pousse fortement avec la jambe arrière et la jambe avant. 4) Premières foulées courtes et puissantes, buste qui se redresse progressivement. 5) Bras explosifs. 6) 5–20 m maximum en technique (pas endurance). 7) Récupération longue entre répétitions. 8) Surface antidérapante, échauffement complet obligatoire.",
    contraindications: ["Ischio-jambiers non échauffés", "douleur aiguë mollet/Achille"],
    variations: ["sprint start", "départ sprint", "start blocks", "3 point start"]
  },

  drill_drop_sprint: {
    name: "Drill — Drop Sprint (chute avant + sprint)",
    category: "Drills course",
    bodyZone: "full",
    primaryMuscles: ["Quadriceps", "Fessiers", "Ischio-jambiers"],
    secondaryMuscles: ["Mollets", "Abdominaux", "Érecteurs du rachis"],
    equipment: "Terrain libre (10–20 m)",
    defaultDuration: 25,
    position: "Debout puis course",
    difficulty: 4,
    description:
      "Exercice réactif : bascule du buste vers l’avant puis sprint immédiat pour apprendre l’accélération sans faux pas en arrière.",
    instructions:
      "1) Debout, pieds largeur hanches. 2) Penche le buste vers l’avant jusqu’à sentir que tu « tombes » (sans perdre l’équilibre). 3) Dès que tu bascules, sprint immédiatement : ne fais pas de pas en arrière pour te rattraper. 4) Premières foulées rapides sous le corps. 5) Redresse-toi sur 10–15 m. 6) Partenaire ou signal optionnel. 7) 3–6 répétitions, récupération complète. 8) Évite si tu as des vertiges ou une cheville instable.",
    contraindications: ["Vertiges", "entorse cheville", "débutant sans base d’accélération"],
    variations: ["drop sprint", "fall start", "lean fall run", "chute sprint"]
  },

  drill_reactive_sprint: {
    name: "Drill — Reactive Sprint (sprint sur signal)",
    category: "Drills course",
    bodyZone: "full",
    primaryMuscles: ["Quadriceps", "Fessiers", "Ischio-jambiers"],
    secondaryMuscles: ["Mollets", "Abdominaux", "Système nerveux (réactivité)"],
    equipment: "Aucun (signal partenaire ou appli)",
    defaultDuration: 30,
    position: "Position athlétique",
    difficulty: 3,
    description:
      "Sprint déclenché par un signal visuel ou sonore aléatoire : entraîne le temps de réaction et la qualité du premier pas.",
    instructions:
      "1) Position athlétique prête (genoux souples, poids avant). 2) Un partenaire donne un signal imprévisible (clap, mot, geste). 3) Au signal, premier pas explosif sans faux mouvement (pas de pas arrière). 4) Sprint 10–30 m selon objectif. 5) Récupération longue. 6) Varie les positions de départ (assis, genou, dos au sens). 7) 6–10 répétitions max par séance. 8) Priorise la réactivité, pas la distance.",
    contraindications: ["Fatigue centrale (réaction lente = risque)", "surface glissante"],
    variations: ["reactive sprint", "sprint reaction", "sprint on whistle", "sprint signal"]
  },

  // ═══════════════════════════════════════════════════════════════════════
  // PLIOMÉTRIE — compléments (liste utilisateur, hors doublons existants)
  // ═══════════════════════════════════════════════════════════════════════

  pliometrie_line_hops_avant_arriere: {
    name: "Pliométrie — line hops avant/arrière",
    category: "Pliométrie",
    bodyZone: "mollets",
    primaryMuscles: ["Mollets", "Quadriceps"],
    secondaryMuscles: ["Fessiers", "Soléaire", "Abdominaux"],
    equipment: "Ligne au sol (ruban ou marquage)",
    defaultDuration: 40,
    position: "Debout sur une ligne",
    difficulty: 2,
    description:
      "Sauts rapides d’avant en arrière au-dessus d’une ligne : travaille la réactivité sagittale et la stabilité cheville-genou (distinct des sauts latéraux déjà en banque).",
    instructions:
      "1) Place une ligne au sol. 2) Pieds parallèles de chaque côté. 3) Saute d’un côté à l’autre en avant-arrière (axe sagittal), pas latéralement. 4) Atterris doucement sur l’avant-pied, genoux souples. 5) Cadence élevée, amplitude basse. 6) Buste droit, regard fixe. 7) 20–40 sauts ou 20–30 s. 8) Ne confonds pas avec les sauts latéraux sur ligne (exercice séparé en banque).",
    contraindications: ["Douleur rotulienne", "cheville instable"],
    variations: ["line hops", "forward line hops", "sauts ligne avant arrière"]
  },

  pliometrie_lateral_bounds: {
    name: "Pliométrie — lateral bounds (bonds latéraux)",
    category: "Pliométrie",
    bodyZone: "fessiers",
    primaryMuscles: ["Fessiers", "Quadriceps"],
    secondaryMuscles: ["Adducteurs", "Abducteurs", "Mollets", "Abdominaux"],
    equipment: "Aucun",
    defaultDuration: 45,
    position: "Debout un pied",
    difficulty: 3,
    description:
      "Bonds latéraux explosifs sur une jambe : puissance dans le plan frontal (différent des skater jumps qui enchaînent avec réception stable).",
    instructions:
      "1) Debout sur la jambe gauche. 2) Pousse fortement vers la droite pour bondir latéralement. 3) Atterris sur la jambe droite en demi-squat stable, pause 1 s. 4) Rebondis vers la gauche. 5) Amplitude progressive : commence court. 6) Bassin niveau, genou d’appui aligné avec le 2e orteil. 7) Bras aident à l’équilibre. 8) 6–10 bonds par côté selon niveau.",
    contraindications: ["Entorse cheville/genou latéral récente", "douleur bandelette ilio-tibiale"],
    variations: ["lateral bounds", "side bounds", "bonds latéraux", "lateral leap"]
  },

  pliometrie_zigzag_hops: {
    name: "Pliométrie — zigzag hops",
    category: "Pliométrie",
    bodyZone: "full",
    primaryMuscles: ["Quadriceps", "Mollets"],
    secondaryMuscles: ["Fessiers", "Abducteurs", "Adducteurs", "Abdominaux"],
    equipment: "4–6 plots en zigzag",
    defaultDuration: 45,
    position: "Debout entre plots",
    difficulty: 3,
    description:
      "Enchaînement de petits sauts en diagonale entre plots : coordination, changement de direction et réactivité multi-directionnelle.",
    instructions:
      "1) Dispose 4–6 plots en zigzag (espacement 1–2 m). 2) Saute de plot en plot en diagonale, pieds joints ou un pied selon niveau. 3) Atterris en position athlétique avant le rebond suivant. 4) Regarder le plot suivant, pas les pieds. 5) Bras actifs pour équilibrer. 6) Vitesse modérée au début. 7) 2–4 passages, récupération. 8) Réduis l’espacement si tu perds l’équilibre.",
    contraindications: ["ACL non rééduqué", "cheville instable"],
    variations: ["zigzag hops", "diagonal hops", "sauts plots zigzag"]
  },

  pliometrie_single_leg_pogos: {
    name: "Pliométrie — single-leg pogos (pogos unipodaux)",
    category: "Pliométrie",
    bodyZone: "mollets",
    primaryMuscles: ["Mollets", "Soléaire"],
    secondaryMuscles: ["Tendon d'Achille", "Stabilisateurs de cheville", "Abdominaux"],
    equipment: "Aucun",
    defaultDuration: 25,
    position: "Debout un pied",
    difficulty: 3,
    description:
      "Rebonds très rapides sur une jambe, genou quasi tendu : rigidité cheville et réactivité unilatérale (plus spécifique que les hops unipodaux à amplitude plus grande).",
    instructions:
      "1) Debout sur une jambe, genou souple quasi tendu. 2) Rebondis rapidement sur l’avant-pied sans pause longue au sol. 3) Amplitude basse (cheville + genou minimal). 4) Bassin stable, tronc gainé. 5) 10–20 rebonds puis change de jambe. 6) Compare droite/gauche pour repérer les asymétries. 7) Surface plane. 8) Ne pas confondre avec les hops unipodaux à plus grande amplitude (autre entrée banque).",
    contraindications: ["Achillodynie", "cheville instable"],
    variations: ["single leg pogos", "unilateral pogos", "pogo unipodal"]
  },

  pliometrie_stair_bounds: {
    name: "Pliométrie — stair bounds (bonds escaliers)",
    category: "Pliométrie",
    bodyZone: "quadriceps",
    primaryMuscles: ["Quadriceps", "Fessiers"],
    secondaryMuscles: ["Mollets", "Ischio-jambiers", "Abdominaux"],
    equipment: "Escalier stable",
    defaultDuration: 40,
    position: "Montée escaliers",
    difficulty: 3,
    description:
      "Montée d’escaliers en grands bonds alternés : puissance concentrique et endurance de force des jambes.",
    instructions:
      "1) Face aux escaliers, une marche par bond au début. 2) Pousse fortement avec la jambe arrière pour monter. 3) Atterris sur la marche suivante en contrôlant le genou (aligné avec le pied). 4) Alterne les jambes ou monte 2 marches par bond selon niveau. 5) Utilise la rampe si besoin pour l’équilibre au début. 6) Descends en marchant (pas de sauts en descente). 7) 1–3 montées, récupération. 8) Escalier non glissant, éclairage correct.",
    contraindications: ["Douleur rotulienne en montée", "vertiges", "escalier encombré"],
    variations: ["stair bounds", "stair hops", "bonds escaliers", "stairs plyo"]
  },

  pliometrie_hill_bounds: {
    name: "Pliométrie — hill bounds (bounds en côte)",
    category: "Pliométrie",
    bodyZone: "full",
    primaryMuscles: ["Fessiers", "Quadriceps", "Ischio-jambiers"],
    secondaryMuscles: ["Mollets", "Abdominaux", "Érecteurs du rachis"],
    equipment: "Côte modérée (5–8 %)",
    defaultDuration: 45,
    position: "Montée en bonds",
    difficulty: 4,
    description:
      "Foulées bondissantes en montée : puissance horizontale/verticale avec contrainte réduite sur la vitesse de foulée (utile pour force course).",
    instructions:
      "1) Choisis une pente modérée (pas un sprint côte maximal). 2) Enchaîne de grands bonds en montée, genoux souples à l’atterrissage. 3) Pousse fortement avec la jambe arrière. 4) Buste légèrement penché dans la pente. 5) 20–40 m montée, descente marche récupération. 6) 3–5 répétitions. 7) Différent des « sprints en côte » (vitesse max) : ici amplitude et technique de bond. 8) Échauffement complet.",
    contraindications: ["Ischio-jambiers fatigués", "douleur genou en descente (ne pas sprinter en descente)"],
    variations: ["hill bounds", "bounds uphill", "foulées bondissantes côte"]
  },

  pliometrie_single_leg_bounds: {
    name: "Pliométrie — single-leg bounds (bounds unipodaux)",
    category: "Pliométrie",
    bodyZone: "full",
    primaryMuscles: ["Fessiers", "Quadriceps"],
    secondaryMuscles: ["Ischio-jambiers", "Mollets", "Abdominaux"],
    equipment: "Aucun",
    defaultDuration: 40,
    position: "Bonds sur une jambe",
    difficulty: 4,
    description:
      "Grands bonds sur une seule jambe : puissance unilatérale maximale et stabilité du bassin (niveau avancé).",
    instructions:
      "1) Debout sur la jambe gauche. 2) Bondis vers l’avant en poussant fortement, atterris sur la même jambe. 3) Enchaîne 3–6 bonds puis change de jambe ou alterne selon programme. 4) Genou d’appui aligné, bassin stable (pas de valgus). 5) Bras en opposition. 6) Amplitude modérée au début. 7) 20–30 m max. 8) Maîtrise les bounds alternés bilatéraux avant celui-ci.",
    contraindications: ["Genou instable", "douleur patellaire", "cheville faible"],
    variations: ["single leg bounds", "unilateral bounding", "foulées unipodales"]
  },

  pliometrie_depth_pogo: {
    name: "Pliométrie — depth pogo (chute + pogos)",
    category: "Pliométrie",
    bodyZone: "mollets",
    primaryMuscles: ["Mollets", "Quadriceps"],
    secondaryMuscles: ["Tendon d'Achille", "Fessiers", "Abdominaux"],
    equipment: "Box basse (20–40 cm)",
    defaultDuration: 35,
    position: "Debout sur box puis sol",
    difficulty: 4,
    description:
      "Chute contrôlée d’une box suivie d’enchaînement de pogos immédiats : réactivité cheville après amorti.",
    instructions:
      "1) Debout sur une box basse, pieds au bord. 2) Laisse-toi tomber (ne saute pas) et atterris sur les deux pieds, genoux souples. 3) Sans pause longue, enchaîne 5–10 pogos rapides (rebonds cheville, genoux quasi tendus). 4) Finis stable. 5) Box basse au début. 6) 3–5 séries, récupération longue. 7) Maîtrise le depth drop seul avant. 8) Arrête si douleur Achille.",
    contraindications: ["Tendinopathie d’Achille", "débutant", "douleur genou à l’impact"],
    variations: ["depth pogo", "drop pogo", "réaction chute pogos"]
  },

  pliometrie_triple_broad_jump: {
    name: "Pliométrie — triple broad jump",
    category: "Pliométrie",
    bodyZone: "full",
    primaryMuscles: ["Fessiers", "Quadriceps"],
    secondaryMuscles: ["Ischio-jambiers", "Mollets", "Abdominaux", "Érecteurs du rachis"],
    equipment: "Aucun (espace 15–25 m)",
    defaultDuration: 45,
    position: "Debout, sauts enchaînés",
    difficulty: 4,
    description:
      "Trois sauts horizontaux consécutifs sans pause : puissance répétée et coordination d’atterrissage-enchaînement.",
    instructions:
      "1) Premier saut : squat demi-amplitude, projection bras, atterrissage stable genoux fléchis. 2) Enchaîne immédiatement le 2e saut sans pause longue. 3) Même chose pour le 3e. 4) Mesure la distance totale pour suivre la progression. 5) Chaque atterrissage doit être contrôlé (pas de genoux qui s’effondrent). 6) 3–5 séries, récupération complète. 7) Surface antidérapante. 8) Maîtrise le broad jump simple avant.",
    contraindications: ["Douleur genou", "lombalgie", "espace insuffisant"],
    variations: ["triple broad jump", "3 broad jumps", "triple saut horizontal"]
  },

  pliometrie_reactive_hops_signal: {
    name: "Pliométrie — reactive hops (sur signal)",
    category: "Pliométrie",
    bodyZone: "full",
    primaryMuscles: ["Quadriceps", "Mollets"],
    secondaryMuscles: ["Fessiers", "Abdominaux", "Adducteurs"],
    equipment: "Plots optionnels",
    defaultDuration: 40,
    position: "Position athlétique",
    difficulty: 3,
    description:
      "Rebonds déclenchés par signal visuel/sonore : entraîne le temps de réaction et le premier pas explosif (plus ciblé que les rebonds multidirectionnels libres).",
    instructions:
      "1) Position athlétique près d’une ligne ou de plots. 2) Partenaire donne un signal aléatoire. 3) Au signal, effectue 3–6 sauts rapides (avant, latéral ou au-dessus de ligne sel consigne). 4) Contacts courts, genoux souples. 5) Finis en position stable. 6) 6–10 essais, récupération. 7) Varie la direction du saut pour généraliser. 8) Distinct des rebonds multidirectionnels en continu sans signal.",
    contraindications: ["Fatigue neuromusculaire", "cheville instable"],
    variations: ["reactive hops", "hops on command", "sauts réactifs signal"]
  },

  pliometrie_box_push_up: {
    name: "Pliométrie — box push-up (pompes entre supports)",
    category: "Pliométrie",
    bodyZone: "poitrine",
    primaryMuscles: ["Pectoraux", "Triceps"],
    secondaryMuscles: ["Deltoïdes antérieurs", "Abdominaux", "Serratus anterior"],
    equipment: "2 bancs ou parallèles basses",
    defaultDuration: 40,
    position: "Pompes inclinées entre supports",
    difficulty: 3,
    description:
      "Pompes explosives mains sur deux supports : amplitude contrôlée et décollement des mains entre les bancs.",
    instructions:
      "1) Mains sur deux bancs/parallèles, corps aligné en planche. 2) Descends la poitrine entre les supports (amplitude modérée). 3) Pousse explosivement pour décoller les mains. 4) Réceptionne coudes souples, bassin gainé. 5) Pieds au sol ou sur banc selon niveau. 6) 4–8 répétitions qualité. 7) Écart des mains = largeur poitrine. 8) Progression : sol puis clap si maîtrise.",
    contraindications: ["Douleur poignet", "épaule antérieure", "instabilité scapulaire"],
    variations: ["box push-up plyo", "plyo push between benches", "pompes explosives supports"]
  },

  pliometrie_rotational_throw: {
    name: "Pliométrie — rotational throw (lancer rotation)",
    category: "Pliométrie",
    bodyZone: "tronc",
    primaryMuscles: ["Obliques", "Grand dorsal"],
    secondaryMuscles: ["Fessiers", "Deltoïdes", "Abdominaux", "Quadriceps"],
    equipment: "Medecine ball",
    defaultDuration: 45,
    position: "Debout, rotation",
    difficulty: 3,
    description:
      "Lancer explosif latéral avec rotation du tronc : puissance du core et transfert rotationnel (sport collectif, combat).",
    instructions:
      "1) Debout, pieds largeur épaules, medball à deux mains sur le côté de la hanche. 2) Charge la rotation : hanches et thorax tournent ensemble. 3) Pousse le sol avec les jambes. 4) Lance le ballon vers le mur ou un partenaire en explosant la rotation. 5) Les bras suivent le tronc, pas l’inverse. 6) Récupère le ballon, change de côté. 7) 6–10 lancers par côté. 8) Mur solide, distance sécurisée.",
    contraindications: ["Lombalgie en rotation", "hernie discale aiguë"],
    variations: ["rotational throw", "side throw medball", "lancer rotation medball"]
  },

  pliometrie_overhead_throw: {
    name: "Pliométrie — overhead throw (lancer au-dessus)",
    category: "Pliométrie",
    bodyZone: "tronc",
    primaryMuscles: ["Deltoïdes", "Grand dorsal", "Triceps"],
    secondaryMuscles: ["Abdominaux", "Fessiers", "Érecteurs du rachis"],
    equipment: "Medecine ball",
    defaultDuration: 45,
    position: "Debout dos au mur/partenaire",
    difficulty: 3,
    description:
      "Lancer explosif au-dessus de la tête vers l’arrière : extension complète et puissance de chaîne postérieure.",
    instructions:
      "1) Dos au mur ou partenaire, medball tenu derrière la tête ou au-dessus. 2) Fléchis légèrement genoux et hanches (charge). 3) Étends explosivement hanches, genoux et bras pour lancer. 4) Le mouvement part des jambes puis monte au tronc et aux bras. 5) Ne cambrer pas les lombaires en fin de mouvement. 6) 6–10 lancers. 7) Espace dégagé derrière. 8) Ballon adapté au poids (4–8 kg souvent).",
    contraindications: ["Douleur épaule en flexion", "lombalgie extension"],
    variations: ["overhead throw", "backward throw", "lancer au-dessus medball"]
  },

  pliometrie_plyo_pull_up: {
    name: "Pliométrie — plyo pull-up (traction explosive)",
    category: "Pliométrie",
    bodyZone: "dos",
    primaryMuscles: ["Grand dorsal", "Biceps brachial"],
    secondaryMuscles: ["Trapèzes", "Brachioradial", "Abdominaux", "Avant-bras"],
    equipment: "Barre de traction",
    defaultDuration: 35,
    position: "Suspendu prise pronation",
    difficulty: 4,
    description:
      "Traction maximale rapide : le menton ou la poitrine dépasse la barre avec vitesse (progression vers muscle-up).",
    instructions:
      "1) Suspendu, prise largeur épaules, épaules engagées (pas complètement passives). 2) Tire explosivement jusqu’à menton au-dessus de la barre minimum. 3) Phase descendante contrôlée ou légère si maîtrise. 4) Évite le kipping excessif si l’objectif est la puissance pure. 5) 3–6 répétitions, récupération longue. 6) Maîtrise 8+ tractions strictes avant. 7) Chalk si besoin. 8) Ne lâche pas la barre en fatigue.",
    contraindications: ["Douleur coude", "épaule", "déchirure latissimus"],
    variations: ["plyo pull-up", "explosive pull-up", "traction explosive"]
  },

  pliometrie_explosive_dip: {
    name: "Pliométrie — explosive dip (répulsions explosives)",
    category: "Pliométrie",
    bodyZone: "bras",
    primaryMuscles: ["Triceps brachial", "Pectoraux inférieurs"],
    secondaryMuscles: ["Deltoïdes antérieurs", "Abdominaux"],
    equipment: "Barres parallèles",
    defaultDuration: 40,
    position: "Support sur parallèles",
    difficulty: 4,
    description:
      "Dips avec poussée explosive : les mains décollent légèrement des barres en haut (variante pliométrique du dip classique).",
    instructions:
      "1) Support bras tendus sur parallèles. 2) Descends en contrôle jusqu’à 90° coudes ou amplitude sûre. 3) Pousse explosivement pour remonter. 4) En haut, décolle légèrement les mains (ou complètement si expert). 5) Réceptionne coudes souples. 6) Buste légèrement penché pour pectoraux ou plus vertical pour triceps selon objectif. 7) 4–6 reps. 8) Maîtrise 10+ dips stricts avant.",
    contraindications: ["Douleur sternum/épaule", "instabilité scapulaire"],
    variations: ["explosive dip", "plyo dip", "dips pliométriques"]
  },

  pliometrie_battle_rope_slams: {
    name: "Pliométrie — battle rope slams",
    category: "Pliométrie",
    bodyZone: "tronc",
    primaryMuscles: ["Deltoïdes", "Grand dorsal"],
    secondaryMuscles: ["Abdominaux", "Triceps", "Fessiers", "Érecteurs du rachis"],
    equipment: "Cordes ondulatoires (battle ropes)",
    defaultDuration: 30,
    position: "Debout flexion hanche",
    difficulty: 2,
    description:
      "Frappes explosives alternées ou simultanées avec cordes : conditionnement haut du corps et core dynamique.",
    instructions:
      "1) Debout face aux ancrages, une corde par main. 2) Fléchis légèrement hanches et genoux, dos neutre. 3) Lève les bras puis « claque » les cordes vers le sol en explosant (variante slam) ou ondule en alternance rapide. 4) Le power vient des jambes et du tronc, pas seulement les bras. 5) 15–30 s d’effort. 6) Respiration continue. 7) 3–6 rounds. 8) Protège les poignets si besoin (gants).",
    contraindications: ["Douleur lombaire en flexion", "épaule irritée"],
    variations: ["battle rope slams", "rope slams", "cordes ondulatoires", "battle ropes"]
  },

  pliometrie_burpee_jump: {
    name: "Pliométrie — burpee jump (burpee + saut max)",
    category: "Pliométrie",
    bodyZone: "full",
    primaryMuscles: ["Quadriceps", "Fessiers", "Pectoraux"],
    secondaryMuscles: ["Triceps", "Abdominaux", "Mollets", "Deltoïdes"],
    equipment: "Aucun",
    defaultDuration: 45,
    position: "Sol puis debout",
    difficulty: 3,
    description:
      "Burpee avec accent sur le saut vertical final : enchaînement corps entier pliométrique (distinct du burpee classique en banque exercices).",
    instructions:
      "1) Debout. 2) Accroupis, mains au sol. 3) Recule les pieds en planche (option pompe). 4) Ramène les pieds sous le bassin. 5) Saute verticalement le plus haut possible, bras vers le haut. 6) Atterris souple et enchaîne ou récupère selon format. 7) Gainage pendant la planche. 8) Modifie : pas de pompe, step-back au début si débutant.",
    contraindications: ["Douleur poignet", "genou", "hypertension", "grossesse"],
    variations: ["burpee jump", "burpee avec saut", "plyo burpee"]
  },

  pliometrie_broad_jump_to_sprint: {
    name: "Pliométrie — broad jump to sprint",
    category: "Pliométrie",
    bodyZone: "full",
    primaryMuscles: ["Fessiers", "Quadriceps", "Ischio-jambiers"],
    secondaryMuscles: ["Mollets", "Abdominaux", "Grand dorsal"],
    equipment: "Terrain 15–25 m",
    defaultDuration: 30,
    position: "Saut puis course",
    difficulty: 4,
    description:
      "Enchaînement saut horizontal maximal puis sprint immédiat : transfert de force vers l’accélération (combo athlétique).",
    instructions:
      "1) Broad jump : squat charge, projection, atterrissage stable genoux fléchis. 2) Sans pause > 1 s, pars en sprint 10–20 m. 3) Premières foulées courtes et rapides. 4) Redresse progressivement. 5) 3–5 répétitions, récupération longue. 6) Marque la distance saut + temps sprint pour suivre progrès. 7) Surface antidérapante. 8) Maîtrise broad jump et sprint start séparément avant.",
    contraindications: ["Ischio-jambiers fatigués", "douleur genou", "espace limité"],
    variations: ["broad jump to sprint", "jump to sprint", "saut longueur sprint"]
  }
};
