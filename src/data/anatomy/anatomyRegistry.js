/**
 * Registre familles / muscles — métadonnées stables pour navigation, recherche et lien 3D.
 * Le contenu long vit dans `muscleContent/`.
 */
import { MuscleGroups } from '../workoutProgramEnhanced';
import { HAUT_DOS_FAMILY_SECTIONS } from './familySections/haut-dos';
import { HAUT_DOS_SYNTHESE_SECTIONS } from './familySections/haut-dos-synthese';
import { BAS_DOS_FAMILY_SECTIONS } from './familySections/bas-dos';
import { CUISSES_JAMBES_FAMILY_SECTIONS } from './familySections/cuisses-jambes';
import { ABDOMINAUX_FAMILY_SECTIONS } from './familySections/abdominaux-famille';

/** @typedef {'high'|'medium'|'low'} ImportanceLevel */

/**
 * @typedef {object} AnatomyMuscleMeta
 * @property {string} id
 * @property {string} familyId
 * @property {string} name
 * @property {string} [shortName]
 * @property {string} summary
 * @property {ImportanceLevel} [functionalImportance]
 * @property {ImportanceLevel} [aestheticImportance]
 * @property {string[]} [searchAliases]
 * @property {string} [visualGroupId] — groupe Récap / GLB (`MuscleGroups`)
 * @property {boolean} [contentReady]
 */

/**
 * @typedef {object} AnatomyFamilyMeta
 * @property {string} id
 * @property {string} name
 * @property {string} summary
 * @property {string} intro — paragraphe d’accueil famille
 * @property {string} [outro] — encadré de synthèse (ex. vision produit)
 * @property {string[]} muscleIds
 * @property {string[]} [visualGroupIds]
 * @property {'upper'|'lower'} [anatomyBackRegion] — sous-zone dos sur le modèle 3D
 * @property {{ id: string, title: string, blocks: object[] }[]} [sections]
 * @property {string[]} [searchAliases]
 */

/** @type {Record<string, AnatomyFamilyMeta>} */
export const ANATOMY_FAMILIES = {
  pectoraux: {
    id: 'pectoraux',
    name: 'Pectoraux',
    summary: 'Poussée, épaisseur du torse et stabilité de l’épaule.',
    intro:
      'Les pectoraux représentent l’un des groupes musculaires les plus importants du haut du corps. Situés sur la face antérieure du thorax, ils recouvrent une grande partie de la cage thoracique et jouent un rôle central dans tous les mouvements où le bras doit pousser, rapprocher un objet du corps ou exercer une force vers l’avant.\n\nD’un point de vue esthétique, ils constituent l’un des principaux éléments qui donnent une apparence athlétique au haut du corps. Une poitrine développée modifie fortement la silhouette en créant une transition plus marquée entre les épaules, les bras et le tronc.\n\nLeur importance dépasse l’apparence : l’articulation gléno-humérale est très mobile mais peu stable, et dépend fortement des muscles qui contrôlent le bras. Le grand pectoral agit comme un puissant moteur de force ; le petit pectoral contrôle l’omoplate et le placement de l’épaule.\n\nDans la vie quotidienne, ouvrir une porte lourde, pousser un objet, se relever du sol ou porter quelque chose devant soi sollicite en permanence cette famille. En sport, elle est essentielle en musculation, gymnastique, street workout, sports de combat, lancers et escalade.\n\nOrganisation : le grand pectoral constitue la masse visible et le principal producteur de force en poussée ; le petit pectoral, plus profond, ne contribue presque pas au volume esthétique mais stabilise la mécanique de l’épaule.',
    outro:
      'Dans Momentum, la famille Pectoraux relie la force de poussée et le développement du torse à des connexions fortes avec les triceps, les deltoïdes antérieurs, le dos, la posture et les mouvements de street workout. Un développement optimal repose sur l’équilibre entre force, amplitude, contrôle, mobilité et tirage.',
    muscleIds: ['grand-pectoral', 'petit-pectoral'],
    visualGroupIds: [MuscleGroups.CHEST],
    searchAliases: ['poitrine', 'pecs', 'chest', 'développé couché']
  },
  epaules: {
    id: 'epaules',
    name: 'Épaules',
    summary: 'Mobilité, puissance, largeur du haut du corps et stabilité articulaire.',
    intro:
      'L’épaule est probablement l’une des régions les plus fascinantes du corps humain : un compromis permanent entre une liberté de mouvement exceptionnelle et la stabilité nécessaire pour transmettre de grandes forces. Contrairement à la hanche, l’architecture gléno-humérale est ouverte — tête humérale volumineuse, surface de contact réduite avec la scapula — ce qui impose un système complexe de muscles et de tendons pour centrer l’articulation.\n\nC’est l’articulation la plus mobile du corps, et l’une des plus vulnérables. Elle permet de lever le bras au-dessus de la tête, lancer, pousser, tirer, porter et exécuter des gestes précis. En musculation, elle intervient dans presque tous les mouvements du haut du corps ; en street workout encore plus (pompes, dips, tractions, handstand, planche, muscle-up). Une épaule performante n’est pas seulement « grosse » : elle produit de la force tout en restant stable et mobile.\n\nOrganisation Momentum : les muscles moteurs superficiels (surtout le deltoïde, trois faisceaux) créent le mouvement et le volume esthétique ; les stabilisateurs profonds (coiffe des rotateurs : supra-épineux, infra-épineux, petit rond, subscapulaire) maintiennent la tête de l’humérus en place. L’épaule ne fonctionne jamais seule : le rythme scapulo-huméral combine montée de l’humérus, rotation de la scapula et mouvement de la clavicule. Une mauvaise coordination peut comprimer ou sursolliciter certaines structures.\n\nEsthétiquement, les épaules déterminent la largeur du haut du corps, la forme en V et l’impression de puissance — influencées par la longueur des clavicules, le faisceau moyen du deltoïde et l’équilibre avec le dos. L’élévateur de la scapula complète la mécanique cervico-scapulaire avec le trapèze.',
    outro:
      'Dans Momentum, la famille Épaules relie largeur, poussée verticale, street workout et durabilité articulaire. Un développement optimal combine faisceau moyen, arrière d’épaule, coiffe des rotateurs, mobilité et tirage — pas seulement des développés lourds.',
    muscleIds: ['deltoide', 'coiffe-rotateurs', 'elevateur-scapula'],
    visualGroupIds: [MuscleGroups.SHOULDERS],
    searchAliases: ['deltoïde', 'deltoides', 'shoulders', 'épaule']
  },
  'haut-dos': {
    id: 'haut-dos',
    name: 'Haut du dos',
    summary: 'Largeur, épaisseur, posture, tractions et contrôle scapulaire.',
    intro:
      'Le haut du dos est l’une des régions les plus complexes du corps : contrairement aux pectoraux (poussée dominante), il regroupe des muscles qui produisent, contrôlent et stabilisent des mouvements dans plusieurs directions. C’est la grande chaîne opposée à l’avant du corps — pectoraux, deltoïdes antérieurs, triceps poussent ; le haut du dos tire, stabilise et oriente les épaules.\n\nIl influence la largeur du physique, l’épaisseur du torse, la posture, la force en traction, la stabilité des poussées et la santé de l’épaule. Un dos « large » sans densité ni contrôle scapulaire reste incomplet ; un haut du dos solide améliore souvent posture, force relative et progression globale du haut du corps.\n\nEsthétiquement, il crée le V taper : grand dorsal pour l’ouverture latérale, trapèzes pour la profondeur, rhomboïdes pour la densité. Organisation Momentum : largeur (grand dorsal), épaisseur et structure (grand rond, trapèze, rhomboïdes), stabilité (dentelé antérieur, petit rond / coiffe).\n\nLe haut du dos contrôle surtout la scapula — rythme scapulo-huméral avec humérus, coiffe et muscles du dos. Il sert aussi de plateforme en développé couché et militaire : les meilleurs pousseurs ont souvent un dos très développé.',
    outro:
      'Dans Momentum, combine tirages verticaux (largeur), horizontaux (épaisseur) et travail scapulaire (durabilité). Un dos complet est large, dense, stable et capable de produire de la force — pas seulement des tractions répétées.',
    anatomyBackRegion: 'upper',
    sections: [...HAUT_DOS_FAMILY_SECTIONS, ...HAUT_DOS_SYNTHESE_SECTIONS],
    muscleIds: [
      'grand-dorsal',
      'grand-rond',
      'trapezes',
      'rhomboides',
      'dentele-anterieur',
      'petit-rond'
    ],
    visualGroupIds: [MuscleGroups.BACK],
    searchAliases: [
      'dos',
      'lats',
      'latissimus',
      'tractions',
      'rowing',
      'trapèze',
      'rhomboïde',
      'dorsaux'
    ]
  },
  'bas-dos': {
    id: 'bas-dos',
    name: 'Bas du dos',
    summary: 'Stabilité du rachis, transmission de force et lombaires.',
    anatomyBackRegion: 'lower',
    intro:
      'Le bas du dos est l’une des régions les plus importantes et les plus mal comprises du corps : pilier mécanique où transitent les forces des jambes, des hanches et du haut du corps. Courir, sauter, porter, tirer ou rester debout sollicite en permanence cette zone.\n\nUn bas du dos développé améliore stabilité de la colonne, transmission de force, posture, endurance et résistance à la fatigue. L’objectif n’est pas une masse visible maximale mais un système de stabilité et d’endurance musculaire — on peut être très fort sans lombaires « esthétiques ».\n\nFamille Momentum : érecteurs du rachis (extension, posture), multifides (contrôle segmentaire profond), carré des lombes (stabilité latérale — voir aussi Abdominaux). Le grand dorsal et le fascia thoraco-lombaire relient le bas du dos au haut du corps.\n\nLa lombaire doit surtout rester stable pendant que les autres articulations bougent — pas être la zone la plus mobile du corps.',
    outro:
      'Dans Momentum, le bas du dos est la fondation : érecteurs puissants, multifides fonctionnels, gainage global et progression intelligente. Un haut du corps puissant repose toujours sur une base solide.',
    sections: BAS_DOS_FAMILY_SECTIONS,
    muscleIds: ['erecteurs-rachis', 'multifides'],
    visualGroupIds: [MuscleGroups.BACK],
    searchAliases: ['lombaires', 'lower back', 'érecteurs', 'soulevé de terre', 'extensions lombaires']
  },
  bras: {
    id: 'bras',
    name: 'Bras',
    summary: 'Flexion, extension du coude, volume et transmission de la force.',
    intro:
      'Les bras ne se résument pas au biceps : le triceps représente environ les deux tiers du volume du bras ; le brachial et le brachio-radial donnent l’épaisseur ; les avant-bras transmettent la force jusqu’à la prise.\n\nLe biceps intervient en flexion, supination et tractions ; le triceps est le moteur des pompes, dips, développés et mouvements de street workout avancés. Le brachial fléchit le coude quelle que soit la position de la main ; le coraco-brachial (petit muscle du processus coracoïde) stabilise l’épaule en poussée.\n\nUn bras complet = biceps + brachial + triceps + avant-bras + prise — pas des curls isolés.',
    outro:
      'Dans Momentum, les bras relient esthétique, tractions, poussées et street workout : équilibre triceps / biceps, épaisseur (brachial, marteau), extensions overhead (chef long) et prise (avant-bras).',
    muscleIds: [
      'biceps-brachial',
      'brachial',
      'brachio-radial',
      'triceps-brachial',
      'avant-bras-ensemble'
    ],
    visualGroupIds: [MuscleGroups.BICEPS, MuscleGroups.TRICEPS],
    searchAliases: ['arms', 'curl', 'triceps', 'biceps', 'dips', 'bras']
  },
  'avant-bras': {
    id: 'avant-bras',
    name: 'Avant-bras',
    summary: 'Poignet, pronation/supination et force de préhension.',
    intro:
      'Les avant-bras regroupent de nombreux muscles : fléchisseurs et extenseurs du poignet, pronateurs, supinateurs et muscles de la préhension. Essentiels en tractions, escalade, street workout et carries — souvent le facteur limitant avant le dos ou les biceps.',
    muscleIds: ['avant-bras-ensemble'],
    visualGroupIds: [MuscleGroups.FOREARMS],
    searchAliases: ['forearms', 'grip', 'prise', 'farmer walk', 'avant-bras']
  },
  abdominaux: {
    id: 'abdominaux',
    name: 'Abdominaux & sangle',
    summary: 'Core, pression intra-abdominale et transmission de force.',
    intro:
      'Les abdominaux ne servent pas seulement aux tablettes visibles : la sangle est le système qui transmet la force entre haut et bas du corps (tractions, squats, sprints, pompes, développés, figures). Le « core » inclut grand droit, obliques, transverse, carré des lombes, érecteurs et diaphragme (érecteurs : famille Bas du dos). Trois rôles : stabiliser le tronc, transmettre la puissance (pied → hanche → tronc → membres), protéger la colonne sous charge. Un programme complet combine flexion, anti-extension, anti-rotation et contrôle du bassin — pas seulement des crunchs ou des planches longues.',
    outro:
      'Dans Momentum : relevés suspendus, L-sit, hollow body, ab wheel, Pallof et side plank s’articulent avec le psoas (flexion hanche) et le carré des lombes (anti-inclinaison). Visibilité du six-pack = masse grasse et génétique ; performance = stabilité et tension.',
    sections: ABDOMINAUX_FAMILY_SECTIONS,
    muscleIds: [
      'grand-droit',
      'oblique-externe',
      'oblique-interne',
      'transverse',
      'pyramidal',
      'carre-lombes',
      'psoas-iliaque'
    ],
    visualGroupIds: [MuscleGroups.CORE],
    searchAliases: ['abdos', 'core', 'gainage', 'crunch', 'planche', 'six-pack']
  },
  fessiers: {
    id: 'fessiers',
    name: 'Fessiers',
    summary: 'Extension de hanche, puissance et stabilité du bassin.',
    intro:
      'La chaîne postérieure ne se limite pas aux ischio-jambiers : le grand fessier est le muscle le plus volumineux du corps — extension de hanche, sprint, saut, squat et soulevé. Le moyen fessier stabilise en appui unipodal (abduction) ; le petit fessier contrôle en profondeur. Vie sédentative ou trop de quadriceps sans postérieur : risque de compensations lombaires et de genou moins stable. Les fessiers complètent la famille Cuisses (quadriceps, ischios, adducteurs) et les mollets pour toute la puissance du bas du corps.',
    outro:
      'Prioriser extension de hanche (hip thrust, fentes, RDL), le travail unilatéral et une amplitude réelle plutôt que cambrer les lombaires. Voir ischio-jambiers et adducteurs dans Cuisses pour l’équilibre complet de la jambe.',
    muscleIds: ['grand-fessier', 'moyen-fessier', 'petit-fessier'],
    visualGroupIds: [MuscleGroups.GLUTES],
    searchAliases: ['glutes', 'hip thrust', 'fessiers']
  },
  cuisses: {
    id: 'cuisses',
    name: 'Cuisses',
    summary: 'Quadriceps, ischios, adducteurs — base de force et athlétisme.',
    intro:
      'Les jambes sont la base mécanique du corps : marcher, courir, sauter, freiner, porter une charge. Chaque déplacement repose sur une chaîne antérieure (quadriceps), postérieure (ischio-jambiers + fessiers, famille voisine), médiale (adducteurs) et inférieure (mollets, tibia). Un haut du corps fort avec des jambes faibles limite puissance, stabilité et explosivité. Les cuisses concentrent quadriceps, ischio-jambiers et adducteurs — les plus grands volumes musculaires, une forte demande cardiovasculaire et une récupération souvent plus longue qu’en haut du corps.',
    outro:
      'Équilibrer avant / arrière / intérieur, inclure du unilatéral et progresser volume et charge sans sacrifier la technique du genou et de la hanche. Fessiers, mollets et tibial antérieur complètent la vision « jambes » dans Momentum.',
    sections: CUISSES_JAMBES_FAMILY_SECTIONS,
    muscleIds: ['quadriceps-femoral', 'ischio-jambiers', 'adducteurs-ensemble'],
    visualGroupIds: [MuscleGroups.QUADS, MuscleGroups.HAMSTRINGS],
    searchAliases: ['quads', 'ischios', 'squat', 'jambes', 'cuisses', 'leg extension']
  },
  mollets: {
    id: 'mollets',
    name: 'Mollets',
    summary: 'Propulsion, rebond et stabilité de cheville.',
    intro:
      'Les mollets ne sont pas un détail esthétique de fin de séance : à chaque pas, saut et changement de direction, ils transmettent la force sol → corps. Gastrocnémien (visible, genou tendu) et soléaire (profond, genou fléchi) convergent vers le tendon d’Achille, ressort biologique pour sprint et pliométrie. Habitués à des milliers de contractions quotidiennes, ils demandent souvent amplitude complète, charge progressive et duo debout + assis. Muscles du pied et tibial antérieur (famille Tibia) complètent l’équilibre cheville-pied.',
    outro:
      'Ne pas confondre répétitions rapides et court amplitude avec un vrai stimulus : pause basse, montée contrôlée, unilatéral si déséquilibre. Prévention Achille = progression, pas volume brutal de sauts ou de course.',
    muscleIds: ['gastrocnemien', 'soleaire'],
    visualGroupIds: [MuscleGroups.CALVES],
    searchAliases: ['calves', 'mollet', 'calf raise']
  },
  tibia: {
    id: 'tibia',
    name: 'Tibia & cheville',
    summary: 'Flexion dorsale et stabilité antérieure de jambe.',
    intro:
      'Le pied est le premier contact avec le sol ; un mauvais contrôle peut modifier pied → cheville → genou → hanche. Le tibial antérieur (dorsiflexion) équilibre les mollets : propulsion arrière, contrôle avant. Indispensable en course, réception de saut et prévention des entorses. Chaîne inférieure complète = mollets + tibial + qualité d’appui, pas seulement quadriceps et fessiers.',
    outro:
      'Renforcement léger mais régulier (tibialis raise, marche sur talons) en complément des mollets debout et assis.',
    muscleIds: ['tibial-anterieur'],
    visualGroupIds: [MuscleGroups.TIBIALIS_ANTERIOR],
    searchAliases: ['shin', 'tibialis', 'tibialis raise']
  },
  cou: {
    id: 'cou',
    name: 'Cou',
    summary: 'Stabilité cervicale, posture et force du haut du corps.',
    intro:
      'SCM et splénius pour le mouvement et l’esthétique latérale/postérieure du cou ; trapèzes (Haut du dos) pour la transition cou–épaules. Muscles profonds (chin tucks, isométriques) pour la posture. Handstand et carries : stabilité axiale. Progression prudente sur le cou.',
    muscleIds: ['sterno-cleido-mastoidien', 'splenius'],
    visualGroupIds: [MuscleGroups.SHOULDERS],
    searchAliases: ['neck', 'nuque', 'SCM', 'cou', 'chin tuck', 'isométrique cervical']
  }
};

/** @type {Record<string, AnatomyMuscleMeta>} */
export const ANATOMY_MUSCLES = {
  'grand-pectoral': {
    id: 'grand-pectoral',
    familyId: 'pectoraux',
    name: 'Grand pectoral',
    summary: 'Muscle large de poussée — faisceaux claviculaire, sterno-costal et abdominal.',
    functionalImportance: 'high',
    aestheticImportance: 'high',
    visualGroupId: MuscleGroups.CHEST,
    contentReady: true,
    searchAliases: ['pec majeur', 'pectoral majeur', 'upper chest', 'haut pec']
  },
  'petit-pectoral': {
    id: 'petit-pectoral',
    familyId: 'pectoraux',
    name: 'Petit pectoral',
    summary: 'Profond, stabilise l’omoplate et participe à l’inspiration accessoire.',
    functionalImportance: 'medium',
    aestheticImportance: 'low',
    visualGroupId: MuscleGroups.CHEST,
    contentReady: true,
    searchAliases: ['pec mineur', 'pectoral mineur']
  },
  deltoide: {
    id: 'deltoide',
    familyId: 'epaules',
    name: 'Deltoïde',
    summary: 'Muscle principal de l’épaule — trois faisceaux pour poussée, largeur et équilibre postérieur.',
    functionalImportance: 'high',
    aestheticImportance: 'high',
    visualGroupId: MuscleGroups.SHOULDERS,
    contentReady: true,
    searchAliases: ['deltoïdes', 'deltoides', 'lat raise', 'élévations latérales']
  },
  'coiffe-rotateurs': {
    id: 'coiffe-rotateurs',
    familyId: 'epaules',
    name: 'Coiffe des rotateurs',
    summary: 'Supra-épineux, infra-épineux, petit rond et subscapulaire — stabilité de l’humérus.',
    functionalImportance: 'high',
    aestheticImportance: 'low',
    visualGroupId: MuscleGroups.SHOULDERS,
    contentReady: true,
    searchAliases: ['rotateurs', 'rotator cuff', 'supra-épineux', 'face pull']
  },
  'grand-dorsal': {
    id: 'grand-dorsal',
    familyId: 'haut-dos',
    name: 'Grand dorsal',
    summary: 'Muscle de la largeur du dos — tractions, tirages verticaux et horizontaux.',
    functionalImportance: 'high',
    aestheticImportance: 'high',
    visualGroupId: MuscleGroups.BACK,
    contentReady: true,
    searchAliases: ['latissimus', 'lats', 'grand dorsal', 'pull-up', 'tractions']
  },
  'grand-rond': {
    id: 'grand-rond',
    familyId: 'haut-dos',
    name: 'Grand rond',
    summary: 'Petit muscle superficiel — arrondi esthétique du haut du dos sous l’épaule.',
    functionalImportance: 'medium',
    aestheticImportance: 'high',
    visualGroupId: MuscleGroups.BACK,
    contentReady: true,
    searchAliases: ['teres major', 'grand rond']
  },
  trapezes: {
    id: 'trapezes',
    familyId: 'haut-dos',
    name: 'Trapèze',
    summary: 'Trapèze supérieur, moyen et inférieur — contrôle de l’omoplate et épaisseur du dos.',
    functionalImportance: 'high',
    aestheticImportance: 'high',
    visualGroupId: MuscleGroups.BACK,
    contentReady: true,
    searchAliases: ['trapèze', 'traps', 'shrugs', 'face pull', 'Y-raise']
  },
  rhomboides: {
    id: 'rhomboides',
    familyId: 'haut-dos',
    name: 'Rhomboïdes',
    summary: 'Petit et grand rhomboïde — rétraction scapulaire et posture.',
    functionalImportance: 'high',
    aestheticImportance: 'medium',
    visualGroupId: MuscleGroups.BACK,
    contentReady: true,
    searchAliases: ['rhomboid', 'rétraction omoplates']
  },
  'dentele-anterieur': {
    id: 'dentele-anterieur',
    familyId: 'haut-dos',
    name: 'Dentelé antérieur',
    summary: 'Protraction et rotation scapulaire — stabilité de l’omoplate sur le thorax.',
    functionalImportance: 'high',
    aestheticImportance: 'low',
    visualGroupId: MuscleGroups.BACK,
    contentReady: true,
    searchAliases: ['serratus', 'dentelé', 'winging scapula', 'push-up plus']
  },
  'petit-rond': {
    id: 'petit-rond',
    familyId: 'haut-dos',
    name: 'Petit rond',
    summary: 'Rotateur externe et adducteur — lien coiffe / haut du dos et posture d’épaule.',
    functionalImportance: 'high',
    aestheticImportance: 'low',
    visualGroupId: MuscleGroups.BACK,
    contentReady: true,
    searchAliases: ['teres minor', 'petit rond', 'rotateur externe']
  },
  'erecteurs-rachis': {
    id: 'erecteurs-rachis',
    familyId: 'bas-dos',
    name: 'Érecteurs du rachis',
    summary: 'Colonnes paravertébrales — extension et stabilisation isométrique sous charge.',
    functionalImportance: 'high',
    aestheticImportance: 'medium',
    visualGroupId: MuscleGroups.BACK,
    contentReady: true,
    searchAliases: ['érecteurs', 'lombaires', 'extensions lombaires', 'soulevé de terre']
  },
  multifides: {
    id: 'multifides',
    familyId: 'bas-dos',
    name: 'Multifides',
    summary: 'Muscles profonds segmentaires — contrôle fin de chaque vertèbre.',
    functionalImportance: 'high',
    aestheticImportance: 'low',
    visualGroupId: MuscleGroups.BACK,
    contentReady: true,
    searchAliases: ['multifidus', 'stabilisation rachis', 'bird dog']
  },
  'biceps-brachial': {
    id: 'biceps-brachial',
    familyId: 'bras',
    name: 'Biceps brachial',
    summary: 'Deux chefs — flexion du coude, supination et aide aux tractions.',
    functionalImportance: 'high',
    aestheticImportance: 'high',
    visualGroupId: MuscleGroups.BICEPS,
    contentReady: true,
    searchAliases: ['biceps', 'curl', 'chin-up', 'traction supination']
  },
  brachial: {
    id: 'brachial',
    familyId: 'bras',
    name: 'Brachial',
    summary: 'Sous le biceps — épaisseur du bras, flexion pure du coude.',
    functionalImportance: 'high',
    aestheticImportance: 'high',
    visualGroupId: MuscleGroups.BICEPS,
    contentReady: true,
    searchAliases: ['brachialis', 'curl marteau']
  },
  'brachio-radial': {
    id: 'brachio-radial',
    familyId: 'bras',
    name: 'Brachio-radial',
    summary: 'Jonction bras/avant-bras — flexion du coude en prise neutre ou pronation.',
    functionalImportance: 'high',
    aestheticImportance: 'high',
    visualGroupId: MuscleGroups.BICEPS,
    contentReady: true,
    searchAliases: ['brachioradialis', 'reverse curl']
  },
  'triceps-brachial': {
    id: 'triceps-brachial',
    familyId: 'bras',
    name: 'Triceps brachial',
    summary: 'Trois chefs — ~⅔ du volume du bras, extension du coude et poussée.',
    functionalImportance: 'high',
    aestheticImportance: 'high',
    visualGroupId: MuscleGroups.TRICEPS,
    contentReady: true,
    searchAliases: ['triceps', 'dips', 'extension triceps', 'pompes diamant']
  },
  'avant-bras-ensemble': {
    id: 'avant-bras-ensemble',
    familyId: 'avant-bras',
    name: 'Muscles de l’avant-bras',
    summary: 'Fléchisseurs, extenseurs du poignet, pronation/supination et préhension.',
    functionalImportance: 'high',
    aestheticImportance: 'high',
    visualGroupId: MuscleGroups.FOREARMS,
    contentReady: true,
    searchAliases: ['forearm', 'wrist curl', 'farmer walk', 'dead hang', 'prise']
  },
  'grand-droit': {
    id: 'grand-droit',
    familyId: 'abdominaux',
    name: 'Grand droit de l’abdomen',
    summary: 'Flexion du tronc — « six-pack », visibilité liée au taux de gras.',
    functionalImportance: 'high',
    aestheticImportance: 'high',
    visualGroupId: MuscleGroups.CORE,
    contentReady: true,
    searchAliases: ['abdos', 'crunch', 'relevé de genoux', 'six-pack']
  },
  'oblique-externe': {
    id: 'oblique-externe',
    familyId: 'abdominaux',
    name: 'Oblique externe',
    summary: 'Couche latérale — rotation, inclinaison et stabilité anti-rotation.',
    functionalImportance: 'high',
    aestheticImportance: 'high',
    visualGroupId: MuscleGroups.CORE,
    contentReady: true,
    searchAliases: ['obliques', 'wood chop', 'side plank']
  },
  'oblique-interne': {
    id: 'oblique-interne',
    familyId: 'abdominaux',
    name: 'Oblique interne',
    summary: 'Sous l’oblique externe — anti-rotation, compression et contrôle du bassin.',
    functionalImportance: 'high',
    aestheticImportance: 'medium',
    visualGroupId: MuscleGroups.CORE,
    contentReady: true,
    searchAliases: ['anti-rotation', 'pallof press']
  },
  transverse: {
    id: 'transverse',
    familyId: 'abdominaux',
    name: 'Transverse de l’abdomen',
    summary: 'Couche profonde — ceinture abdominale et pression intra-abdominale.',
    functionalImportance: 'high',
    aestheticImportance: 'low',
    visualGroupId: MuscleGroups.CORE,
    contentReady: true,
    searchAliases: ['transverse', 'vacuum', 'hollow body', 'gainage']
  },
  pyramidal: {
    id: 'pyramidal',
    familyId: 'abdominaux',
    name: 'Pyramidal',
    summary: 'Petit muscle bas-ventre — tension de la ligne blanche, rôle limité.',
    functionalImportance: 'low',
    aestheticImportance: 'low',
    visualGroupId: MuscleGroups.CORE,
    contentReady: true,
    searchAliases: ['pyramidal abdomen']
  },
  'carre-lombes': {
    id: 'carre-lombes',
    familyId: 'abdominaux',
    name: 'Carré des lombes',
    summary: 'Stabilité bassin–thorax, inclinaison latérale — lien core / bas du dos.',
    functionalImportance: 'high',
    aestheticImportance: 'low',
    visualGroupId: MuscleGroups.CORE,
    contentReady: true,
    searchAliases: ['quadratus lumborum', 'QL', 'farmer walk unilatéral', 'suitcase carry', 'side plank']
  },
  'psoas-iliaque': {
    id: 'psoas-iliaque',
    familyId: 'abdominaux',
    name: 'Psoas-iliaque',
    summary: 'Flexion de hanche — lien colonne, bassin et cuisses (L-sit, relevés).',
    functionalImportance: 'high',
    aestheticImportance: 'low',
    visualGroupId: MuscleGroups.CORE,
    contentReady: true,
    searchAliases: ['psoas', 'hip flexor', 'L-sit', 'relevé de genoux', 'leg raise', 'couch stretch']
  },
  'quadriceps-femoral': {
    id: 'quadriceps-femoral',
    familyId: 'cuisses',
    name: 'Quadriceps fémoral',
    summary: 'Droit fémoral + vastes — extension du genou et puissance de jambe.',
    functionalImportance: 'high',
    aestheticImportance: 'high',
    visualGroupId: MuscleGroups.QUADS,
    contentReady: true,
    searchAliases: ['quads', 'squat', 'leg extension', 'quadriceps']
  },
  'ischio-jambiers': {
    id: 'ischio-jambiers',
    familyId: 'cuisses',
    name: 'Ischio-jambiers',
    summary: 'Biceps fémoral, semi-tendineux, semi-membraneux — flexion genou, extension hanche.',
    functionalImportance: 'high',
    aestheticImportance: 'high',
    visualGroupId: MuscleGroups.HAMSTRINGS,
    contentReady: true,
    searchAliases: ['ischios', 'RDL', 'nordic curl', 'leg curl']
  },
  'adducteurs-ensemble': {
    id: 'adducteurs-ensemble',
    familyId: 'cuisses',
    name: 'Adducteurs',
    summary: 'Face interne cuisse — adduction, stabilité bassin, squat profond.',
    functionalImportance: 'high',
    aestheticImportance: 'medium',
    visualGroupId: MuscleGroups.QUADS,
    contentReady: true,
    searchAliases: ['adducteurs', 'Copenhagen plank', 'presse large', 'sumo squat']
  },
  'grand-fessier': {
    id: 'grand-fessier',
    familyId: 'fessiers',
    name: 'Grand fessier',
    summary: 'Extension de hanche — puissance, sprint, hip thrust.',
    functionalImportance: 'high',
    aestheticImportance: 'high',
    visualGroupId: MuscleGroups.GLUTES,
    contentReady: true,
    searchAliases: ['glute max', 'hip thrust', 'fessier']
  },
  'moyen-fessier': {
    id: 'moyen-fessier',
    familyId: 'fessiers',
    name: 'Moyen fessier',
    summary: 'Abduction et stabilisation du bassin en appui unilatéral.',
    functionalImportance: 'high',
    aestheticImportance: 'medium',
    visualGroupId: MuscleGroups.GLUTES,
    contentReady: true,
    searchAliases: ['glute med', 'abduction', 'clamshell']
  },
  'petit-fessier': {
    id: 'petit-fessier',
    familyId: 'fessiers',
    name: 'Petit fessier',
    summary: 'Stabilisation profonde de la hanche.',
    functionalImportance: 'high',
    aestheticImportance: 'low',
    visualGroupId: MuscleGroups.GLUTES,
    contentReady: true,
    searchAliases: ['glute min']
  },
  gastrocnemien: {
    id: 'gastrocnemien',
    familyId: 'mollets',
    name: 'Gastrocnémien',
    summary: 'Mollet superficiel — genou tendu, flexion plantaire explosive.',
    functionalImportance: 'high',
    aestheticImportance: 'high',
    visualGroupId: MuscleGroups.CALVES,
    contentReady: true,
    searchAliases: ['mollet', 'calf', 'mollets debout']
  },
  soleaire: {
    id: 'soleaire',
    familyId: 'mollets',
    name: 'Soléaire',
    summary: 'Mollet profond — genou fléchi, endurance debout.',
    functionalImportance: 'high',
    aestheticImportance: 'high',
    visualGroupId: MuscleGroups.CALVES,
    contentReady: true,
    searchAliases: ['mollets assis', 'seated calf']
  },
  'tibial-anterieur': {
    id: 'tibial-anterieur',
    familyId: 'tibia',
    name: 'Tibial antérieur',
    summary: 'Dorsiflexion — avant de la jambe, course et cheville.',
    functionalImportance: 'high',
    aestheticImportance: 'medium',
    visualGroupId: MuscleGroups.TIBIALIS_ANTERIOR,
    contentReady: true,
    searchAliases: ['tibialis raise', 'shin']
  },
  'sterno-cleido-mastoidien': {
    id: 'sterno-cleido-mastoidien',
    familyId: 'cou',
    name: 'Sterno-cléido-mastoïdien',
    summary: 'Bandes latérales du cou — flexion et rotation de la tête.',
    functionalImportance: 'high',
    aestheticImportance: 'high',
    visualGroupId: MuscleGroups.SHOULDERS,
    contentReady: true,
    searchAliases: ['SCM', 'cou', 'flexion cervicale']
  },
  splenius: {
    id: 'splenius',
    familyId: 'cou',
    name: 'Splénius',
    summary: 'Extension et rotation postérieure du cou.',
    functionalImportance: 'high',
    aestheticImportance: 'low',
    visualGroupId: MuscleGroups.SHOULDERS,
    contentReady: true,
    searchAliases: ['nuque', 'extension cervicale']
  },
  'elevateur-scapula': {
    id: 'elevateur-scapula',
    familyId: 'epaules',
    name: 'Élévateur de la scapula',
    summary: 'Élévation omoplate — lien cou/trapèze, posture.',
    functionalImportance: 'high',
    aestheticImportance: 'medium',
    visualGroupId: MuscleGroups.SHOULDERS,
    contentReady: true,
    searchAliases: ['elevator scapulae', 'shrugs']
  }
};

/** Muscles listés dans les familles mais sans fiche détaillée encore. */
function stubMuscle(id, familyId, name, summary, visualGroupId) {
  if (ANATOMY_MUSCLES[id]) return;
  ANATOMY_MUSCLES[id] = {
    id,
    familyId,
    name,
    summary,
    functionalImportance: 'medium',
    aestheticImportance: 'medium',
    visualGroupId,
    contentReady: false
  };
}

Object.values(ANATOMY_FAMILIES).forEach((fam) => {
  const vg = fam.visualGroupIds?.[0] || MuscleGroups.FULL_BODY;
  fam.muscleIds.forEach((mid) => {
    if (!ANATOMY_MUSCLES[mid]) {
      const label = mid
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
        .replace(/Rachis/i, 'rachis')
        .replace(/Anterieur/i, 'antérieur');
      stubMuscle(mid, fam.id, label, 'Fiche détaillée en cours de rédaction.', vg);
    }
  });
});

export const ANATOMY_FAMILY_ORDER = [
  'pectoraux',
  'epaules',
  'haut-dos',
  'bas-dos',
  'bras',
  'avant-bras',
  'abdominaux',
  'fessiers',
  'cuisses',
  'mollets',
  'tibia',
  'cou'
];

export function getAnatomyFamily(id) {
  return ANATOMY_FAMILIES[id] || null;
}

export function getAnatomyMuscle(id) {
  return ANATOMY_MUSCLES[id] || null;
}

export function listMusclesForFamily(familyId) {
  const fam = getAnatomyFamily(familyId);
  if (!fam) return [];
  return fam.muscleIds.map((id) => getAnatomyMuscle(id)).filter(Boolean);
}

export function getFamilyForMuscle(muscleId) {
  const m = getAnatomyMuscle(muscleId);
  return m ? getAnatomyFamily(m.familyId) : null;
}

/** Cible navigation après clic mesh 3D (groupe visuel Récap). */
export function anatomyTargetForFamily(familyId) {
  const family = getAnatomyFamily(familyId);
  if (!family) return null;
  const featured =
    family.muscleIds.map((id) => getAnatomyMuscle(id)).find((m) => m?.contentReady) ||
    getAnatomyMuscle(family.muscleIds[0]);
  return { familyId: family.id, muscleId: featured?.id || family.muscleIds[0] };
}

export function resolveAnatomyTargetFromVisualGroup(groupId) {
  if (!groupId) return null;
  if (groupId === MuscleGroups.BACK) {
    return { kind: 'backChoice', familyIds: ['haut-dos', 'bas-dos'] };
  }
  const matches = Object.values(ANATOMY_FAMILIES).filter((f) =>
    (f.visualGroupIds || []).includes(groupId)
  );
  const family =
    matches.find((f) => f.id === 'haut-dos') ||
    matches.find((f) => !f.anatomyBackRegion) ||
    matches[0];
  if (!family) return null;
  return anatomyTargetForFamily(family.id);
}
