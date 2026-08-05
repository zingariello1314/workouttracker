/**
 * Registre familles / muscles — métadonnées stables pour navigation, recherche et lien 3D.
 * Le contenu long vit dans `muscleContent/`.
 */
import { MuscleGroups } from '../workoutProgramEnhanced';

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
 * @property {string[]} muscleIds
 * @property {string[]} [visualGroupIds]
 * @property {string[]} [searchAliases]
 */

/** @type {Record<string, AnatomyFamilyMeta>} */
export const ANATOMY_FAMILIES = {
  pectoraux: {
    id: 'pectoraux',
    name: 'Pectoraux',
    summary: 'Poussée, stabilité d’épaule et volume thoracique.',
    intro:
      'Les pectoraux recouvrent l’avant du thorax et assurent la majorité des mouvements de poussée. Le grand pectoral représente le volume visible ; le petit pectoral, profond, stabilise l’omoplate.',
    muscleIds: ['grand-pectoral', 'petit-pectoral'],
    visualGroupIds: [MuscleGroups.CHEST],
    searchAliases: ['poitrine', 'pecs', 'chest', 'développé couché']
  },
  epaules: {
    id: 'epaules',
    name: 'Épaules',
    summary: 'Mobilité, largeur du haut du corps et coiffe des rotateurs.',
    intro:
      'L’épaule est l’articulation la plus mobile du corps. Le deltoïde produit la puissance visible ; la coiffe des rotateurs centre l’humérus et limite les blessures.',
    muscleIds: ['deltoide', 'coiffe-rotateurs', 'elevateur-scapula'],
    visualGroupIds: [MuscleGroups.SHOULDERS],
    searchAliases: ['deltoïde', 'deltoides', 'shoulders', 'épaule']
  },
  'haut-dos': {
    id: 'haut-dos',
    name: 'Haut du dos',
    summary: 'Largeur, épaisseur, posture, tractions et tirages.',
    intro:
      'Le haut du dos regroupe la grande chaîne de tirage du corps : largeur (grand dorsal), épaisseur et posture (trapèze, rhomboïdes), esthétique du haut du dos (grand rond) et contrôle scapulaire (dentelé antérieur, petit rond). C’est une famille centrale pour les tractions, les rowings, la santé des épaules et l’équilibre avec les pectoraux.',
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
    intro:
      'Le bas du dos n’est pas qu’« un muscle » : érecteurs du rachis, carré des lombes (lié aussi à la sangle) et multifides forment une plateforme de stabilisation. Rôle prioritaire en squat, soulevé de terre, course et gainage — la performance et la prévention passent par force progressive, contrôle moteur et mobilité (hanches, thorax), pas par la peur du mouvement.',
    muscleIds: ['erecteurs-rachis', 'multifides'],
    visualGroupIds: [MuscleGroups.BACK],
    searchAliases: ['lombaires', 'lower back', 'érecteurs', 'soulevé de terre', 'extensions lombaires']
  },
  bras: {
    id: 'bras',
    name: 'Bras',
    summary: 'Flexion, extension du coude et volume du membre supérieur.',
    intro:
      'Le bras regroupe biceps, triceps, brachial, brachio-radial, avant-bras et préhension. Le triceps forme environ les deux tiers du volume visible ; les avant-bras transforment la force du dos et des bras en prise réelle (tractions, street workout, carries).',
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
    visualGroupIds: [MuscleGroups.BICEPS],
    searchAliases: ['forearms', 'grip', 'prise', 'farmer walk', 'avant-bras']
  },
  abdominaux: {
    id: 'abdominaux',
    name: 'Abdominaux & sangle',
    summary: 'Core, pression intra-abdominale et transmission de force.',
    intro:
      'La sangle abdominale stabilise la colonne et le bassin : grand droit, obliques, transverse, carré des lombes (stabilité latérale), psoas (flexion hanche / L-sit). Équilibre avec érecteurs et multifides (famille Bas du dos).',
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
      'Les fessiers sont le groupe le plus volumineux du corps : grand fessier (puissance, sprint, sauts), moyen fessier (abduction et stabilité unipodale), petit fessier (contrôle profond). Indissociables des cuisses et de la chaîne postérieure.',
    muscleIds: ['grand-fessier', 'moyen-fessier', 'petit-fessier'],
    visualGroupIds: [MuscleGroups.HAMSTRINGS],
    searchAliases: ['glutes', 'hip thrust', 'fessiers']
  },
  cuisses: {
    id: 'cuisses',
    name: 'Cuisses',
    summary: 'Quadriceps, ischios, adducteurs — base de force et athlétisme.',
    intro:
      'Les cuisses regroupent les muscles les plus volumineux du corps. Une jambe équilibrée développe l’avant (quadriceps), l’arrière (ischio-jambiers), l’intérieur (adducteurs) et s’articule avec les fessiers et la stabilité de hanche. Base de squat, sprint, sauts et posture.',
    muscleIds: ['quadriceps-femoral', 'ischio-jambiers', 'adducteurs-ensemble'],
    visualGroupIds: [MuscleGroups.QUADS, MuscleGroups.HAMSTRINGS],
    searchAliases: ['quads', 'ischios', 'squat', 'jambes', 'cuisses', 'leg extension']
  },
  mollets: {
    id: 'mollets',
    name: 'Mollets',
    summary: 'Propulsion, rebond et stabilité de cheville.',
    intro:
      'Triceps sural : gastrocnémien (superficie, genou tendu) + soléaire (profond, genou fléchi), unis par le tendon d’Achille — flexion plantaire, course, saut, restitution élastique. Cheville stable + pied (équilibre, tibial antérieur) complètent la chaîne. Volume, amplitude et fréquence souvent nécessaires.',
    muscleIds: ['gastrocnemien', 'soleaire'],
    visualGroupIds: [MuscleGroups.CALVES],
    searchAliases: ['calves', 'mollet', 'calf raise']
  },
  tibia: {
    id: 'tibia',
    name: 'Tibia & cheville',
    summary: 'Flexion dorsale et stabilité antérieure de jambe.',
    intro:
      'Tibial antérieur (dorsiflexion) et fibulaires : équilibre avec les mollets pour la course, les réceptions de saut et la prévention des blessures de cheville.',
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
    summary: 'Trois faisceaux — antérieur, moyen et postérieur — pour la mobilité et la largeur d’épaule.',
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
    visualGroupId: MuscleGroups.BICEPS,
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
    visualGroupId: MuscleGroups.HAMSTRINGS,
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
    visualGroupId: MuscleGroups.HAMSTRINGS,
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
    visualGroupId: MuscleGroups.HAMSTRINGS,
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
export function resolveAnatomyTargetFromVisualGroup(groupId) {
  if (!groupId) return null;
  const family = Object.values(ANATOMY_FAMILIES).find((f) =>
    (f.visualGroupIds || []).includes(groupId)
  );
  if (!family) return null;
  const featured =
    family.muscleIds.map((id) => getAnatomyMuscle(id)).find((m) => m?.contentReady) ||
    getAnatomyMuscle(family.muscleIds[0]);
  return { familyId: family.id, muscleId: featured?.id || family.muscleIds[0] };
}
