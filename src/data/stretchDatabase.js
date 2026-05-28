import { stretchDrillsCatalog } from './stretchDrillsCatalog.js';
import { mobilityStretchCatalog } from './mobilityStretchCatalog.js';

/**
 * 🧘 BANQUE D'ÉTIREMENTS — Momentum
 *
 * Format jumeau de `exerciseDatabase.js` mais adapté aux étirements / mobilité / respiration.
 * Chaque entrée contient :
 *   - name              : libellé affiché
 *   - category          : famille (Respiration, Mobilité, Étirement passif, Étirement actif,
 *                         Décompression, Posture, Auto-massage, Yoga / Postures, Récupération)
 *   - bodyZone          : zone corporelle dominante (cou, épaules, thoracique, dos, lombaires,
 *                         poitrine, bras, hanches, fessiers, ischios, quadriceps, mollets,
 *                         tronc, respiration, full)
 *   - primaryMuscles    : muscles ou structures principalement ciblés (terminologie anatomique FR)
 *   - secondaryMuscles  : muscles annexes ou structures fasciales sollicitées
 *   - equipment         : matériel requis (souvent "Aucun")
 *   - defaultDuration   : durée recommandée par défaut en SECONDES
 *   - position          : posture de départ (debout / assis / allongé / quadrupédie / suspendu…)
 *   - difficulty        : 1 (très accessible) → 4 (avancé / nécessite mobilité)
 *   - description       : ce que l'étirement vise (objectif fonctionnel / physiologique)
 *   - instructions      : déroulé précis et sécuritaire de l'exécution
 *   - contraindications : pathologies / situations où l'étirement est à éviter ou modifier
 *   - variations        : aliases & synonymes utilisés pour la recherche tolérante
 *                         (ex. "respi nasale", "psoas stretch")
 *
 * 🎯 Objectif : ≈ 50 étirements transcrits du programme actuel + quelques classiques manquants.
 *    Les notes de ressenti (7 curseurs /5 pondérés, ancien triplet /10 encore accepté pour l’XP)
 *    vivent dans `stretchPerceivedRatings` et calibrent l’XP par coche (100→300 XP).
 */

export const stretchDatabase = {
  // ═══════════════════════════════════════════════════════════════════════
  // RESPIRATION & COHÉRENCE CARDIAQUE
  // ═══════════════════════════════════════════════════════════════════════

  respiration_nasale_lente: {
    name: "Respiration nasale lente",
    category: "Respiration",
    bodyZone: "respiration",
    primaryMuscles: ["Diaphragme"],
    secondaryMuscles: ["Intercostaux", "Transverse de l'abdomen", "Système nerveux parasympathique"],
    equipment: "Aucun",
    defaultDuration: 60,
    position: "Assis ou allongé",
    difficulty: 1,
    description:
      "Active le système nerveux parasympathique pour faire baisser le rythme cardiaque et préparer le corps à l'effort ou au repos. Améliore l'efficience ventilatoire et la variabilité cardiaque (HRV).",
    instructions:
      "Une main posée sur le ventre, l'autre sur la poitrine. Inspire lentement par le nez 4 secondes en gonflant le ventre (et non la poitrine), expire 6 secondes par le nez. Garde les épaules basses et la mâchoire relâchée.",
    contraindications: ["Congestion nasale sévère (passe par la bouche)", "Vertiges en cas d'hyperventilation"],
    variations: ["respi nasale", "respiration ventrale", "respiration diaphragmatique", "souffle nasal", "breathing"]
  },

  respiration_allongee_bassin_surleve: {
    name: "Respiration allongée bassin surélevé",
    category: "Respiration",
    bodyZone: "respiration",
    primaryMuscles: ["Diaphragme"],
    secondaryMuscles: ["Plancher pelvien", "Transverse de l'abdomen"],
    equipment: "Coussin / bolster",
    defaultDuration: 180,
    position: "Allongé sur le dos, bassin surélevé",
    difficulty: 1,
    description:
      "Position d'inversion douce qui facilite la respiration diaphragmatique et favorise le retour veineux. Idéale en début de séance pour centrer l'attention.",
    instructions:
      "Place un coussin sous le sacrum (pas les lombaires). Genoux fléchis, pieds au sol. Respire profondément par le nez en laissant le ventre s'expanser dans les 360° (pas seulement vers le haut).",
    contraindications: ["Reflux gastro-œsophagien (préfère assis)", "Glaucome sévère"],
    variations: ["respi bassin haut", "constructive rest", "respiration allongée"]
  },

  respiration_nasale_4_4_4: {
    name: "Respiration carrée 4-4-4 (sama vritti)",
    category: "Respiration",
    bodyZone: "respiration",
    primaryMuscles: ["Diaphragme"],
    secondaryMuscles: ["Système nerveux autonome"],
    equipment: "Aucun",
    defaultDuration: 60,
    position: "Assis dos droit",
    difficulty: 2,
    description:
      "Respiration équilibrée qui synchronise inspiration / rétention / expiration sur des cycles égaux. Améliore le contrôle ventilatoire et calme le mental rapidement.",
    instructions:
      "Inspire 4s par le nez, retiens poumons pleins 4s, expire 4s par le nez, retiens poumons vides 4s. Répète pendant la durée. Si tu ressens un manque d'air, raccourcis le tempo (3-3-3) avant d'arrêter.",
    contraindications: ["Hypertension non contrôlée", "Anxiété aiguë avec apnée"],
    variations: ["box breathing", "respiration carrée", "sama vritti", "respi 4-4-4"]
  },

  respiration_4_7_8: {
    name: "Respiration 4-7-8",
    category: "Respiration",
    bodyZone: "respiration",
    primaryMuscles: ["Diaphragme"],
    secondaryMuscles: ["Nerf vague", "Système parasympathique"],
    equipment: "Aucun",
    defaultDuration: 240,
    position: "Allongé ou assis confortable",
    difficulty: 2,
    description:
      "Technique du Dr Andrew Weil pour induire un état de récupération profonde et préparer au sommeil. Stimule fortement le nerf vague.",
    instructions:
      "Pointe de la langue contre le palais derrière les incisives. Inspire par le nez 4s, retiens 7s, expire complètement par la bouche en sifflant 8s. Réalise 4 cycles maximum au début.",
    contraindications: ["Asthme en crise", "BPCO sévère"],
    variations: ["respi 4 7 8", "Andrew Weil breathing", "souffle relaxant"]
  },

  respiration_narines_alternees: {
    name: "Respiration narines alternées (nadi shodhana)",
    category: "Respiration",
    bodyZone: "respiration",
    primaryMuscles: ["Diaphragme"],
    secondaryMuscles: ["Système nerveux autonome"],
    equipment: "Aucun",
    defaultDuration: 60,
    position: "Assis dos droit",
    difficulty: 2,
    description:
      "Pranayama yogique qui équilibre les hémisphères cérébraux et apaise le système nerveux. Excellente avant une séance technique ou un effort de précision.",
    instructions:
      "Pouce droit sur la narine droite, inspire par la gauche 4s. Bouche la gauche avec annulaire, libère la droite, expire 4s. Inspire à droite 4s, ferme à droite, expire à gauche 4s. C'est 1 cycle.",
    contraindications: ["Sinusite aiguë", "Déviation septale sévère"],
    variations: ["nadi shodhana", "anuloma viloma", "respi alternée"]
  },

  respiration_diaphragmatique_main_ventre: {
    name: "Respiration diaphragmatique 'main ventre / main poitrine'",
    category: "Respiration",
    bodyZone: "respiration",
    primaryMuscles: ["Diaphragme"],
    secondaryMuscles: ["Transverse de l'abdomen", "Plancher pelvien"],
    equipment: "Aucun",
    defaultDuration: 120,
    position: "Allongé sur le dos, genoux fléchis",
    difficulty: 1,
    description:
      "Exercice de feedback proprioceptif : tu dois sentir la main du ventre se soulever bien plus que celle de la poitrine. Réeduque la respiration thoracique haute (souvent stress-induite).",
    instructions:
      "Une main sur le sternum, l'autre sous le nombril. Inspire 4s : la main du ventre monte, celle du sternum reste quasi immobile. Expire 6s : le ventre descend, sans à-coup.",
    contraindications: [],
    variations: ["expand belly", "main sur ventre main sur poitrine", "diaphragmatic breathing"]
  },

  // ═══════════════════════════════════════════════════════════════════════
  // POSTURE & ALIGNEMENT
  // ═══════════════════════════════════════════════════════════════════════

  auto_grandissement_assis: {
    name: "Auto-grandissement assis",
    category: "Posture",
    bodyZone: "tronc",
    primaryMuscles: ["Multifides", "Transverse de l'abdomen"],
    secondaryMuscles: ["Trapèzes inférieurs", "Plancher pelvien"],
    equipment: "Aucun",
    defaultDuration: 60,
    position: "Assis (chaise ou sol)",
    difficulty: 1,
    description:
      "Active la musculature posturale profonde (core local) pour aligner tête, cage thoracique et bassin. Réveille la conscience proprioceptive de la verticalité.",
    instructions:
      "Assis tibias perpendiculaires au sol, ischions enracinés. Imagine un fil au sommet du crâne qui te tire vers le plafond. Allonge la nuque (menton très légèrement rentré), ouvre les clavicules sans creuser les lombaires.",
    contraindications: [],
    variations: ["self-elongation", "alignement assis", "axial extension"]
  },

  appui_mur_4_points: {
    name: "Appui contre mur (4 points : talons / fessiers / omoplates / tête)",
    category: "Posture",
    bodyZone: "dos",
    primaryMuscles: ["Trapèzes inférieurs", "Multifides"],
    secondaryMuscles: ["Rhomboïdes", "Long fléchisseur du cou"],
    equipment: "Mur",
    defaultDuration: 120,
    position: "Debout dos contre un mur",
    difficulty: 1,
    description:
      "Calibrage postural qui rétablit la courbure naturelle de la colonne et corrige la tête projetée vers l'avant (forward head posture).",
    instructions:
      "Talons à ≈ 5 cm du mur. Plaque fessiers, haut du dos et arrière du crâne contre la paroi (sans hyperextension de nuque). Espace lombaire conservé (la main passe à plat). Maintiens en respirant calmement.",
    contraindications: ["Cyphose dorsale rigide (adapte la tête)"],
    variations: ["wall posture", "alignement mural", "appui dos au mur"]
  },

  marche_lente_pieds_nus: {
    name: "Marche lente pieds nus",
    category: "Posture",
    bodyZone: "full",
    primaryMuscles: ["Pied (intrinsèques)", "Mollets"],
    secondaryMuscles: ["Quadriceps", "Fessiers", "Stabilisateurs de la cheville"],
    equipment: "Aucun",
    defaultDuration: 180,
    position: "Debout marche",
    difficulty: 1,
    description:
      "Réveille la chaîne plantaire, renforce l'ancrage et la proprioception du pied. Stimule les afférences podales utiles à l'équilibre.",
    instructions:
      "Pieds nus sur un sol stable. Marche très lentement (3 à 5 secondes par pas) en déroulant talon → bord externe → métatarses → pouce. Prends conscience de chaque appui.",
    contraindications: ["Plaie ouverte sous le pied", "Neuropathie périphérique sévère"],
    variations: ["barefoot walking", "marche consciente", "ancrage plantaire"]
  },

  marche_lente_consciente: {
    name: "Marche lente consciente (méditation marchée)",
    category: "Récupération",
    bodyZone: "full",
    primaryMuscles: ["Système nerveux autonome"],
    secondaryMuscles: ["Posturaux globaux"],
    equipment: "Aucun",
    defaultDuration: 180,
    position: "Debout marche",
    difficulty: 1,
    description:
      "Variante méditative de la marche : ralentit le mental, ré-ancre dans le corps. Très efficace en transition réveil ou après écran.",
    instructions:
      "Marche 3× plus lentement que d'habitude. Synchronise le pas avec la respiration (3 pas en inspirant, 3 pas en expirant). Perçois le contact du sol, la température de l'air, sans jugement.",
    contraindications: [],
    variations: ["walking meditation", "marche méditative", "kinhin"]
  },

  elevations_demi_pointes: {
    name: "Élévations sur demi-pointes",
    category: "Mobilité",
    bodyZone: "mollets",
    primaryMuscles: ["Gastrocnémiens", "Soléaire"],
    secondaryMuscles: ["Tibial postérieur", "Stabilisateurs de la cheville"],
    equipment: "Aucun (mur facultatif)",
    defaultDuration: 60,
    position: "Debout pieds parallèles",
    difficulty: 1,
    description:
      "Mobilise la cheville en flexion plantaire et active la pompe musculaire des mollets. Excellent pour le retour veineux et la posture.",
    instructions:
      "Debout pieds largeur de hanches. Monte lentement sur la pointe des pieds (2s), maintiens 1s en contraction haute, redescends 3s contrôlé. Garde le grand orteil ancré au sol.",
    contraindications: ["Tendinopathie achilléenne aiguë"],
    variations: ["calf raises", "élévation mollets", "pointe-talon"]
  },

  // ═══════════════════════════════════════════════════════════════════════
  // COU & CERVICALES
  // ═══════════════════════════════════════════════════════════════════════

  mobilisation_cervicale: {
    name: "Mobilisation cervicale (flexion / extension / rotation)",
    category: "Mobilité",
    bodyZone: "cou",
    primaryMuscles: ["Cervicaux profonds", "Sterno-cléido-mastoïdien", "Scalènes"],
    secondaryMuscles: ["Trapèzes supérieurs", "Splénius"],
    equipment: "Aucun",
    defaultDuration: 120,
    position: "Assis ou debout",
    difficulty: 1,
    description:
      "Mobilise les 7 vertèbres cervicales dans les 3 plans de mouvement. Lubrifie les facettes articulaires et libère les tensions liées à l'écran.",
    instructions:
      "Très lentement : flexion (menton vers sternum) 5s → extension (regard vers ciel) 5s → rotation droite 5s → rotation gauche 5s → inclinaison droite 5s → inclinaison gauche 5s. Respire à chaque mouvement.",
    contraindications: ["Hernie cervicale", "Vertiges positionnels (BPPV) — évite l'extension"],
    variations: ["mobilité cou", "neck mobility", "ROM cervical"]
  },

  inclinaisons_laterales_tete: {
    name: "Inclinaisons latérales de tête",
    category: "Étirement passif",
    bodyZone: "cou",
    primaryMuscles: ["Trapèzes supérieurs", "Élévateurs de la scapula"],
    secondaryMuscles: ["Scalènes", "Sterno-cléido-mastoïdien"],
    equipment: "Aucun",
    defaultDuration: 120,
    position: "Assis dos droit",
    difficulty: 1,
    description:
      "Étirement statique du trapèze supérieur, muscle souvent surchargé par le stress et la position prolongée à l'écran.",
    instructions:
      "Assis dos droit. Incline la tête à droite (oreille vers épaule), pose la main droite sur le côté gauche du crâne et applique un poids très léger. Maintiens 30s. L'épaule opposée reste basse. Change de côté.",
    contraindications: ["Hernie cervicale latérale"],
    variations: ["neck side stretch", "trapèze supérieur", "étirement cou latéral"]
  },

  etirement_cou_trapezes: {
    name: "Étirement cou + trapèzes (3 directions)",
    category: "Étirement passif",
    bodyZone: "cou",
    primaryMuscles: ["Trapèzes supérieurs", "Élévateurs de la scapula"],
    secondaryMuscles: ["Splénius", "Sub-occipitaux"],
    equipment: "Aucun",
    defaultDuration: 120,
    position: "Assis dos droit",
    difficulty: 1,
    description:
      "Combiné qui cible les 3 faisceaux du trapèze supérieur en variant l'orientation de la flexion cervicale.",
    instructions:
      "1) Incline tête côté droit en regardant droit devant (trapèze haut). 2) Tête inclinée + regard vers l'aisselle droite (élévateur scapula). 3) Tête inclinée + menton rentré (splénius). 20s par position, deux côtés.",
    contraindications: ["Hernie cervicale"],
    variations: ["étirement nuque", "trap stretch 3 angles", "neck triple stretch"]
  },

  etirement_sternocleido: {
    name: "Étirement du sterno-cléido-mastoïdien (SCM)",
    category: "Étirement passif",
    bodyZone: "cou",
    primaryMuscles: ["Sterno-cléido-mastoïdien"],
    secondaryMuscles: ["Scalènes", "Platysma"],
    equipment: "Aucun",
    defaultDuration: 60,
    position: "Assis dos droit",
    difficulty: 2,
    description:
      "Étire spécifiquement le SCM, muscle souvent contracté chez les respirateurs thoraciques hauts et après une longue journée d'écran.",
    instructions:
      "Pose la main droite à plat sur la clavicule droite (légère traction vers le bas). Incline la tête à gauche, puis tourne le menton vers le plafond. Tu dois sentir un étirement sur l'avant-côté droit du cou. Maintiens 30s.",
    contraindications: ["Vertiges positionnels", "Pathologie de l'artère vertébrale"],
    variations: ["SCM stretch", "étirement sternocléidomastoïdien", "neck rotational stretch"]
  },

  face_au_mur_menton_rentre: {
    name: "Face au mur, menton rentré (chin tuck)",
    category: "Posture",
    bodyZone: "cou",
    primaryMuscles: ["Long fléchisseur du cou", "Long de la tête"],
    secondaryMuscles: ["Sub-occipitaux (étirés)"],
    equipment: "Mur",
    defaultDuration: 120,
    position: "Debout face à un mur",
    difficulty: 2,
    description:
      "Renforce les fléchisseurs profonds du cou et corrige la tête projetée vers l'avant. Travail postural fondamental contre le 'tech neck'.",
    instructions:
      "Debout face au mur, front collé. Sans bouger le menton vers le bas, recule légèrement la tête comme si tu voulais former un double menton (le sommet du crâne grandit vers le plafond). Maintiens 5s, relâche, répète 10×.",
    contraindications: ["Cervicalgie aiguë"],
    variations: ["chin tuck", "menton rentré", "redressement cervical"]
  },

  tete_suspendue_bord_de_lit: {
    name: "Tête suspendue (bord de lit / table)",
    category: "Décompression",
    bodyZone: "cou",
    primaryMuscles: ["Disques cervicaux", "Sub-occipitaux"],
    secondaryMuscles: ["Espace inter-vertébral cervical"],
    equipment: "Lit ou table ferme",
    defaultDuration: 180,
    position: "Allongé dorsal, tête hors du support",
    difficulty: 2,
    description:
      "Traction douce auto-administrée sur les cervicales par effet de la gravité. Soulage la pression discale et étire la chaîne postérieure du cou.",
    instructions:
      "Allongé sur le dos, glisse jusqu'à ce que ta tête dépasse du bord du lit. Laisse la tête tomber doucement, soutenue par tes mains au début si besoin. Respire lentement. Sors progressivement (jamais en se relevant brusquement).",
    contraindications: ["Hypertension non contrôlée", "Glaucome", "Pathologie cervicale (avis médical)"],
    variations: ["traction cervicale", "head hang", "cervical decompression"]
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ÉPAULES & SCAPULAS
  // ═══════════════════════════════════════════════════════════════════════

  rotations_epaules: {
    name: "Rotations d'épaules (bras pendants)",
    category: "Mobilité",
    bodyZone: "épaules",
    primaryMuscles: ["Trapèzes", "Deltoïdes", "Rotateurs de la scapula"],
    secondaryMuscles: ["Coiffe des rotateurs"],
    equipment: "Aucun",
    defaultDuration: 120,
    position: "Debout",
    difficulty: 1,
    description:
      "Échauffement articulaire global de la scapulo-humérale et de la scapulo-thoracique. Lubrification des bourses et tendons de la coiffe.",
    instructions:
      "Debout bras le long du corps, relâchés. Effectue 10 cercles d'épaules vers l'arrière (lentement, amplitude maximale), puis 10 vers l'avant. Ne pas hausser activement les épaules : laisser les bras pendants.",
    contraindications: ["Luxation récente d'épaule"],
    variations: ["shoulder circles", "cercles épaules", "rotations bras"]
  },

  mobilite_scapulaire_cercles_bras: {
    name: "Mobilité scapulaire (cercles bras tendus)",
    category: "Mobilité",
    bodyZone: "épaules",
    primaryMuscles: ["Dentelé antérieur", "Rhomboïdes", "Trapèze moyen"],
    secondaryMuscles: ["Coiffe des rotateurs", "Deltoïdes"],
    equipment: "Aucun",
    defaultDuration: 120,
    position: "Debout bras tendus devant",
    difficulty: 2,
    description:
      "Cible la mobilité scapulo-thoracique, essentielle pour la santé de l'épaule et la performance en tractions / dips.",
    instructions:
      "Bras tendus devant, paumes face à face. Effectue de grands cercles avec les mains comme si tu dessinais un horloge sur le mur. Les épaules guident le mouvement (protraction-élévation-rétraction-dépression). 10 dans un sens, 10 dans l'autre.",
    contraindications: [],
    variations: ["scapular CARs", "scapular circles", "mobilité omoplates"]
  },

  pendule_epaule: {
    name: "Pendule d'épaule (Codman)",
    category: "Décompression",
    bodyZone: "épaules",
    primaryMuscles: ["Capsule articulaire de l'épaule"],
    secondaryMuscles: ["Coiffe des rotateurs (relâchée)"],
    equipment: "Aucun",
    defaultDuration: 120,
    position: "Buste penché en avant",
    difficulty: 1,
    description:
      "Mobilisation passive de l'articulation gléno-humérale par la gravité. Décomprime l'espace sous-acromial. Recommandé en rééducation post-tendinopathie de coiffe.",
    instructions:
      "Penche-toi à 90° au niveau des hanches, pose la main libre sur une table pour t'appuyer. Laisse l'autre bras pendre totalement relâché. Avec un micro-mouvement du bassin, fais osciller le bras en cercles, en avant-arrière puis en latéralité. 30s par direction.",
    contraindications: ["Luxation récente"],
    variations: ["Codman exercises", "bras relâché", "pendulum stretch"]
  },

  ouverture_y_au_mur: {
    name: "Ouverture en Y sur le mur",
    category: "Étirement actif",
    bodyZone: "thoracique",
    primaryMuscles: ["Trapèzes inférieurs", "Dentelé antérieur"],
    secondaryMuscles: ["Pectoraux (étirés)", "Rhomboïdes"],
    equipment: "Mur",
    defaultDuration: 120,
    position: "Debout dos contre un mur",
    difficulty: 2,
    description:
      "Active les trapèzes inférieurs (souvent inhibés) tout en étirant les pectoraux. Combinaison gagnante contre les épaules enroulées.",
    instructions:
      "Dos plaqué au mur, lombaires en contact. Bras en Y au-dessus de la tête, dos des mains contre le mur si possible. Glisse les bras vers le bas en U, sans décoller le dos ni les coudes. Remonte en Y. 8 répétitions lentes.",
    contraindications: ["Conflit sous-acromial actif"],
    variations: ["wall slides Y", "wall angels", "ouverture Y mur"]
  },

  wall_slides_w: {
    name: "Wall slides en W (épaules)",
    category: "Mobilité",
    bodyZone: "épaules",
    primaryMuscles: ["Trapèzes inférieurs", "Rhomboïdes", "Rotateurs externes"],
    secondaryMuscles: ["Deltoïdes postérieurs"],
    equipment: "Mur",
    defaultDuration: 60,
    position: "Debout dos au mur",
    difficulty: 2,
    description:
      "Mobilité scapulaire combinée à rotation externe. Excellent pré-requis avant tractions ou développé.",
    instructions:
      "Dos contre le mur, lombaires plaquées. Coudes fléchis à 90°, dos des mains contre le mur (position W). Glisse les bras vers le haut en gardant tout en contact avec le mur, jusqu'à formation d'un Y. Reviens lentement. 10 répétitions.",
    contraindications: ["Conflit sous-acromial"],
    variations: ["wall slides", "W to Y", "wall angels W"]
  },

  bras_en_croix_ouverture_thoracique: {
    name: "Bras en croix, ouverture thoracique passive",
    category: "Étirement passif",
    bodyZone: "poitrine",
    primaryMuscles: ["Pectoraux", "Deltoïdes antérieurs"],
    secondaryMuscles: ["Biceps (chef court)", "Coiffe des rotateurs"],
    equipment: "Sol",
    defaultDuration: 120,
    position: "Allongé dorsal bras en T",
    difficulty: 1,
    description:
      "Ouverture passive de la cage thoracique et étirement des pectoraux par effet de la gravité. Très efficace pour 'décrocher' les épaules après une journée assise.",
    instructions:
      "Allongé sur le dos, bras tendus en croix paumes vers le ciel. Détends complètement les bras. La respiration ample dans la cage amplifie l'étirement. Si confortable, glisse un coussin fin sous les omoplates.",
    contraindications: ["Capsulite rétractile aiguë"],
    variations: ["chest opener", "supine T pose", "ouverture pecs allongé"]
  },

  rouleau_serviette_vertical: {
    name: "Rouleau serviette vertical (ouverture sterno-costale)",
    category: "Étirement passif",
    bodyZone: "thoracique",
    primaryMuscles: ["Pectoraux", "Petit pectoral"],
    secondaryMuscles: ["Trapèzes moyens (relâchés)", "Diaphragme"],
    equipment: "Serviette / tapis roulé",
    defaultDuration: 180,
    position: "Allongé dorsal sur rouleau",
    difficulty: 1,
    description:
      "Le rouleau placé verticalement sous la colonne ouvre la cage thoracique et restaure la mobilité dorsale haute, antagoniste de la position assise.",
    instructions:
      "Place une serviette épaisse roulée (ou un tapis) en long sous la colonne, du sacrum à l'occiput. Allonge-toi dessus, bras en croix au sol. Respire profondément 2 à 3 minutes. Sors sur le côté à la fin.",
    contraindications: ["Scoliose marquée", "Ostéoporose sévère"],
    variations: ["rouleau dorsal", "thoracic opener", "spinal foam roll"]
  },

  etirement_actif_haut_du_dos: {
    name: "Étirement actif du haut du dos (mains croisées loin devant)",
    category: "Étirement actif",
    bodyZone: "dos",
    primaryMuscles: ["Rhomboïdes", "Trapèze moyen", "Grand dorsal (haut)"],
    secondaryMuscles: ["Dentelé antérieur"],
    equipment: "Aucun",
    defaultDuration: 120,
    position: "Assis ou debout",
    difficulty: 1,
    description:
      "Étire la chaîne postérieure du haut du dos en protraction scapulaire. Soulage la sensation 'd'épaules nouées' entre les omoplates.",
    instructions:
      "Croise les doigts, paumes vers l'extérieur. Tends les bras loin devant à hauteur d'épaules. Pousse les mains comme pour les éloigner du sternum, arrondis le haut du dos, regarde le nombril. Maintiens 30s, respire dans le dos.",
    contraindications: [],
    variations: ["upper back stretch", "rhomboid stretch", "étirement omoplates"]
  },

  cercles_thoraciques_debout: {
    name: "Cercles thoraciques debout (mains sur cage)",
    category: "Mobilité",
    bodyZone: "thoracique",
    primaryMuscles: ["Vertèbres thoraciques", "Obliques"],
    secondaryMuscles: ["Intercostaux", "Diaphragme"],
    equipment: "Aucun",
    defaultDuration: 120,
    position: "Debout pieds largeur de hanches",
    difficulty: 2,
    description:
      "Mobilise spécifiquement la colonne dorsale dans les 3 plans, segment souvent rigidifié par la posture assise prolongée.",
    instructions:
      "Mains posées de chaque côté de la cage thoracique. Bouge la cage en cercles lents (avant-droite-arrière-gauche) en gardant le bassin immobile et les épaules basses. 5 cercles dans chaque sens.",
    contraindications: [],
    variations: ["thoracic CARs", "rib cage circles", "cercles cage thoracique"]
  },

  ouverture_t_allonge: {
    name: "Ouverture en T allongé (rotation thoracique au sol)",
    category: "Mobilité",
    bodyZone: "thoracique",
    primaryMuscles: ["Vertèbres thoraciques", "Obliques", "Multifides"],
    secondaryMuscles: ["Pectoraux (étirés)", "Grand dorsal"],
    equipment: "Sol",
    defaultDuration: 120,
    position: "Couché sur le côté, genoux fléchis 90°",
    difficulty: 2,
    description:
      "Étirement classique de mobilité dorsale en rotation. 'Open book' yogique très utilisé en kiné pour libérer le segment T1-T12.",
    instructions:
      "Sur le côté droit, genoux empilés à 90°, bras tendus alignés devant à hauteur d'épaules. Lève le bras gauche en arc de cercle vers l'arrière comme un livre qu'on ouvre. Vise à poser le dos de la main gauche au sol. Garde les genoux empilés. 8 répétitions par côté.",
    contraindications: ["Hernie discale lombaire aiguë"],
    variations: ["open book stretch", "thoracic rotation lying", "T-spine rotation"]
  },

  etirement_rotation_thoracique: {
    name: "Étirement en rotation thoracique (couché bras croisé 90°)",
    category: "Étirement passif",
    bodyZone: "thoracique",
    primaryMuscles: ["Pectoraux", "Vertèbres thoraciques"],
    secondaryMuscles: ["Grand dorsal", "Obliques"],
    equipment: "Sol",
    defaultDuration: 60,
    position: "Couché sur le côté, bras supérieur ouvert",
    difficulty: 2,
    description:
      "Variante simplifiée de l'open book : la simple rotation passive du tronc, bras au sol, étire profondément les pectoraux et la chaîne antérieure.",
    instructions:
      "Allongé sur le côté droit, genoux fléchis empilés. Bras gauche initialement croisé sur le bras droit. Ouvre lentement le bras gauche perpendiculairement au tronc, vise à poser l'épaule au sol sans décoller les genoux. Respire 30s.",
    contraindications: ["Lombalgie aiguë"],
    variations: ["thoracic rotation 90°", "rotation couché", "open arm stretch"]
  },

  // ═══════════════════════════════════════════════════════════════════════
  // POITRINE & PECTORAUX
  // ═══════════════════════════════════════════════════════════════════════

  auto_massage_pectoraux: {
    name: "Auto-massage myofascial des pectoraux",
    category: "Auto-massage",
    bodyZone: "poitrine",
    primaryMuscles: ["Pectoraux", "Petit pectoral"],
    secondaryMuscles: ["Fascia thoraco-claviculaire"],
    equipment: "Balle de tennis / lacrosse",
    defaultDuration: 120,
    position: "Debout face à un mur (ou allongé)",
    difficulty: 2,
    description:
      "Libère les adhérences fasciales du pectoral, souvent surchargé par le travail de pousse et la posture enroulée. Améliore la mobilité scapulaire indirectement.",
    instructions:
      "Place une balle entre la pointe de l'épaule et la clavicule (zone du petit pectoral). Roule lentement en cherchant les points de tension, pause 20-30s sur chaque trigger en respirant profondément. Évite les nerfs et l'aisselle.",
    contraindications: ["Inflammation locale", "Lymphœdème"],
    variations: ["pec smash", "trigger pec", "balle pectoraux"]
  },

  // ═══════════════════════════════════════════════════════════════════════
  // DOS & LOMBAIRES
  // ═══════════════════════════════════════════════════════════════════════

  posture_sphinx: {
    name: "Posture du sphinx",
    category: "Yoga / Postures",
    bodyZone: "lombaires",
    primaryMuscles: ["Érecteurs du rachis (étirés en compression)"],
    secondaryMuscles: ["Diaphragme", "Psoas (étiré)"],
    equipment: "Tapis",
    defaultDuration: 120,
    position: "Allongé ventral, appui avant-bras",
    difficulty: 1,
    description:
      "Extension douce de la colonne lombaire. Posture restorative qui restaure la lordose lombaire et étire les fléchisseurs de hanche.",
    instructions:
      "Allongé sur le ventre, avant-bras posés au sol parallèles, coudes alignés sous les épaules. Pousse le sol pour ouvrir la poitrine sans crisper le bas du dos. Lombaires relâchées, regard à l'horizon. Respire 30 à 60s.",
    contraindications: ["Spondylolisthésis", "Hernie discale lombaire postérieure aiguë"],
    variations: ["sphinx pose", "salamba bhujangasana", "sphinx yoga"]
  },

  mini_cobra: {
    name: "Mini-cobra (bhujangasana basse)",
    category: "Yoga / Postures",
    bodyZone: "lombaires",
    primaryMuscles: ["Érecteurs du rachis", "Multifides"],
    secondaryMuscles: ["Triceps", "Psoas (étiré)"],
    equipment: "Tapis",
    defaultDuration: 60,
    position: "Allongé ventral, mains au sol",
    difficulty: 2,
    description:
      "Extension thoraco-lombaire avec léger appui des mains. Décompresse les disques antérieurement après une longue position assise.",
    instructions:
      "Allongé sur le ventre, mains à plat sous les épaules. Pousse doucement pour décoller le sternum, en gardant le bassin et les pubis au sol. Coudes restent légèrement fléchis. Respire dans le ventre. 5 cycles.",
    contraindications: ["Hernie discale aiguë", "Grossesse avancée"],
    variations: ["cobra pose", "bhujangasana", "low cobra"]
  },

  posture_enfant: {
    name: "Posture de l'enfant (balasana)",
    category: "Yoga / Postures",
    bodyZone: "dos",
    primaryMuscles: ["Grand dorsal", "Érecteurs du rachis"],
    secondaryMuscles: ["Fessiers", "Quadriceps"],
    equipment: "Tapis",
    defaultDuration: 180,
    position: "Quadrupédie repliée",
    difficulty: 1,
    description:
      "Posture restorative qui étire l'ensemble de la chaîne postérieure et calme le système nerveux. Excellent retour au calme.",
    instructions:
      "À genoux fesses sur les talons, gros orteils joints, genoux écartés à largeur du tapis. Pose le front au sol et tends les bras loin devant. Pose les épaules vers le bas, respire dans le dos haut.",
    contraindications: ["Pathologie des genoux ne supportant pas la flexion complète"],
    variations: ["child pose", "balasana", "enfant yoga"]
  },

  chat_vache: {
    name: "Chat-vache (cat-cow)",
    category: "Mobilité",
    bodyZone: "dos",
    primaryMuscles: ["Érecteurs du rachis", "Multifides", "Transverse"],
    secondaryMuscles: ["Diaphragme", "Trapèzes"],
    equipment: "Tapis",
    defaultDuration: 120,
    position: "Quadrupédie",
    difficulty: 1,
    description:
      "Mobilisation alternée de la colonne en flexion et extension globale. Lubrifie chaque étage vertébral et synchronise mouvement et respiration.",
    instructions:
      "Quadrupédie : mains sous épaules, genoux sous hanches. Inspire en creusant le dos (vache : sternum vers le ciel, regard haut). Expire en arrondissant (chat : nombril vers la colonne, menton vers sternum). Lent et fluide, 8 cycles.",
    contraindications: ["Tendinopathie du poignet (poings ou avant-bras)"],
    variations: ["cat cow", "marjaryasana bitilasana", "chat vache yoga"]
  },

  relachement_lombaire_bascule_bassin: {
    name: "Relâchement lombaire (bascule du bassin)",
    category: "Mobilité",
    bodyZone: "lombaires",
    primaryMuscles: ["Multifides", "Transverse"],
    secondaryMuscles: ["Érecteurs lombaires", "Plancher pelvien"],
    equipment: "Tapis",
    defaultDuration: 120,
    position: "Allongé dorsal, genoux fléchis",
    difficulty: 1,
    description:
      "Mobilise le bassin en antéversion / rétroversion pour libérer les tensions lombaires. Conscientise la dissociation lombo-pelvienne.",
    instructions:
      "Allongé sur le dos, genoux fléchis, pieds au sol largeur de hanches. Bascule le bassin lentement : crée un creux lombaire (antéversion) puis colle le bas du dos au sol (rétroversion). Mouvement doux, 10 répétitions.",
    contraindications: [],
    variations: ["pelvic tilt", "bascule bassin", "rétro-antéversion"]
  },

  // ═══════════════════════════════════════════════════════════════════════
  // HANCHES & PSOAS
  // ═══════════════════════════════════════════════════════════════════════

  etirement_passif_psoas: {
    name: "Étirement passif du psoas (fente)",
    category: "Étirement passif",
    bodyZone: "hanches",
    primaryMuscles: ["Psoas-iliaque", "Droit fémoral"],
    secondaryMuscles: ["Tenseur du fascia lata", "Adducteurs"],
    equipment: "Tapis (coussin sous le genou)",
    defaultDuration: 120,
    position: "Fente avant, genou arrière au sol",
    difficulty: 2,
    description:
      "Étire le principal fléchisseur de hanche, raccourci par la position assise prolongée. Améliore l'extension de hanche, clé pour la course et le squat.",
    instructions:
      "Fente avant, genou arrière posé sur un coussin. Bassin neutre (rétroversion légère pour allonger l'avant de la hanche). Sans avancer le genou avant, pousse le pubis vers l'avant. Maintiens 60s, change de jambe.",
    contraindications: ["Pathologie du ménisque", "Pubalgie aiguë"],
    variations: ["psoas stretch", "low lunge", "fente psoas", "anjaneyasana basse"]
  },

  etirement_flechisseurs_hanche_passif: {
    name: "Étirement passif des fléchisseurs de hanche",
    category: "Étirement passif",
    bodyZone: "hanches",
    primaryMuscles: ["Psoas-iliaque", "Droit fémoral", "Tenseur du fascia lata"],
    secondaryMuscles: ["Sartorius", "Pectiné"],
    equipment: "Tapis",
    defaultDuration: 90,
    position: "Fente basse passive (hanche arrière au sol)",
    difficulty: 2,
    description:
      "Variante très passive de l'étirement psoas, avec relâchement complet du bassin. Idéale en fin de journée pour relâcher l'avant de la hanche.",
    instructions:
      "Allongé sur le côté, genou avant fléchi vers la poitrine. La jambe arrière est tendue, légèrement en arrière. Tu peux saisir le pied arrière avec la main pour augmenter l'étirement (variante quadriceps). Maintiens 60s par côté.",
    contraindications: ["Pubalgie aiguë"],
    variations: ["hip flexor stretch passive", "étirement hanche allongé", "psoas couché"]
  },

  fente_psoas_bras_oppose_eleve: {
    name: "Fente psoas + bras opposé en élévation",
    category: "Étirement actif",
    bodyZone: "hanches",
    primaryMuscles: ["Psoas-iliaque", "Grand dorsal", "Carré des lombes"],
    secondaryMuscles: ["Obliques (étirés)"],
    equipment: "Tapis",
    defaultDuration: 90,
    position: "Fente avant, bras opposé en élévation",
    difficulty: 3,
    description:
      "Combinaison d'étirement du psoas et de la chaîne fasciale latérale. Très complet pour ouvrir la hanche tout en libérant les flancs.",
    instructions:
      "Fente avant gauche (genou droit au sol). Lève le bras droit (côté de la jambe arrière) vers le plafond, puis incline le tronc vers la gauche. Tu sens un étirement de la hanche droite jusqu'au flanc droit. 30s par côté.",
    contraindications: ["Lombalgie aiguë"],
    variations: ["crescent lunge stretch", "fente Y", "psoas stretch overhead"]
  },

  relachement_psoas_dos_au_sol: {
    name: "Relâchement psoas, dos au sol",
    category: "Étirement passif",
    bodyZone: "hanches",
    primaryMuscles: ["Psoas-iliaque"],
    secondaryMuscles: ["Lombaires", "Diaphragme"],
    equipment: "Tapis",
    defaultDuration: 180,
    position: "Allongé dorsal, jambes en appui sur chaise",
    difficulty: 1,
    description:
      "Position de repos qui relâche complètement le psoas par mise en raccourci, ce qui paradoxalement permet une véritable détente neurologique du muscle.",
    instructions:
      "Allongé sur le dos, mollets posés sur une chaise (genoux et hanches à 90°). Bras le long du corps, paumes vers le ciel. Respire dans le ventre 3 minutes en imaginant le psoas qui 'fond'. Très efficace pour relâcher les lombaires.",
    contraindications: [],
    variations: ["psoas release", "constructive rest position", "Feldenkrais rest"]
  },

  jambe_a_la_paroi: {
    name: "Jambe à la paroi (legs up the wall)",
    category: "Décompression",
    bodyZone: "hanches",
    primaryMuscles: ["Ischio-jambiers (étirés)", "Mollets"],
    secondaryMuscles: ["Système veineux", "Système nerveux parasympathique"],
    equipment: "Mur",
    defaultDuration: 180,
    position: "Allongé dorsal, jambes verticales contre un mur",
    difficulty: 1,
    description:
      "Inversion douce qui favorise le retour veineux, draine les jambes lourdes, étire la chaîne postérieure et active le parasympathique. Excellente récupération post-entraînement.",
    instructions:
      "Place tes fesses contre un mur, allonge le dos au sol et les jambes verticales contre le mur. Bras en croix, paumes vers le ciel. Respire calmement 3 à 5 minutes. Sors en pliant les genoux et en roulant sur le côté.",
    contraindications: ["Hypertension non contrôlée", "Glaucome", "Grossesse avancée"],
    variations: ["legs up the wall", "viparita karani", "jambes au mur"]
  },

  jambes_surelevees_respiration_basse: {
    name: "Jambes surélevées + respiration basse + yeux fermés",
    category: "Récupération",
    bodyZone: "full",
    primaryMuscles: ["Système nerveux parasympathique"],
    secondaryMuscles: ["Diaphragme", "Drainage veineux"],
    equipment: "Coussin / mur",
    defaultDuration: 300,
    position: "Allongé dorsal jambes surélevées",
    difficulty: 1,
    description:
      "Variante 'récupération absolue' de jambe à la paroi : pleine attention sur la respiration ventrale et fermeture sensorielle. Idéal en fin de journée.",
    instructions:
      "Mollets sur une chaise ou jambes au mur. Yeux fermés, mains sur le ventre. Respire 4s inspiration / 6s expiration nasale, en concentrant l'attention uniquement sur la sensation du ventre qui se soulève. 5 minutes.",
    contraindications: ["Comme jambe à la paroi"],
    variations: ["récupération profonde", "savasana surélevé", "deep relaxation"]
  },

  squat_passif: {
    name: "Squat passif (deep squat hold)",
    category: "Mobilité",
    bodyZone: "hanches",
    primaryMuscles: ["Adducteurs", "Fessiers", "Soléaire"],
    secondaryMuscles: ["Tibial antérieur", "Adducteurs", "Lombaires"],
    equipment: "Aucun",
    defaultDuration: 120,
    position: "Squat profond maintenu",
    difficulty: 3,
    description:
      "Position ancestrale qui mobilise hanches, genoux et chevilles dans des amplitudes complètes. Restore la mobilité fonctionnelle perdue par la position assise occidentale.",
    instructions:
      "Pieds largeur d'épaules, pointes légèrement ouvertes. Descends en squat le plus bas possible en gardant les talons au sol. Coudes contre l'intérieur des genoux pour aider à pousser les genoux vers l'extérieur. Si trop dur, pose les talons sur un livre fin.",
    contraindications: ["Méniscopathie", "Pathologie de la cheville (raideur en flexion dorsale)"],
    variations: ["malasana", "deep squat", "Asian squat", "garland pose"]
  },

  jambes_en_chaise_90: {
    name: "Allongé jambes en chaise à 90°",
    category: "Décompression",
    bodyZone: "lombaires",
    primaryMuscles: ["Lombaires (relâchées)"],
    secondaryMuscles: ["Psoas", "Diaphragme"],
    equipment: "Chaise / canapé",
    defaultDuration: 120,
    position: "Allongé dorsal, mollets sur chaise",
    difficulty: 1,
    description:
      "Position dite de 'repos constructif' (Mabel Todd / Feldenkrais). Les hanches et genoux à 90° relâchent complètement les lombaires sans aucune contrainte musculaire.",
    instructions:
      "Allonge-toi au sol, place les mollets bien à plat sur une chaise (cuisses verticales). Bras le long du corps. Respire 2 minutes en laissant la lombaire 'fondre' au sol.",
    contraindications: [],
    variations: ["constructive rest", "L-shape rest", "90/90 hip"]
  },

  // ═══════════════════════════════════════════════════════════════════════
  // FESSIERS & PIRIFORME
  // ═══════════════════════════════════════════════════════════════════════

  ponts_fessiers_activation: {
    name: "Ponts fessiers (glute bridge d'activation)",
    category: "Étirement actif",
    bodyZone: "fessiers",
    primaryMuscles: ["Grand fessier", "Ischio-jambiers"],
    secondaryMuscles: ["Transverse de l'abdomen", "Lombaires"],
    equipment: "Tapis",
    defaultDuration: 60,
    position: "Allongé dorsal genoux fléchis",
    difficulty: 1,
    description:
      "Active le grand fessier (souvent inhibé par la position assise) tout en mobilisant la chaîne postérieure. Réveille la liaison fessiers-core.",
    instructions:
      "Allongé sur le dos, pieds largeur de hanches au sol. Décolle le bassin en serrant les fessiers comme si tu pinçais une feuille. Le corps forme une ligne du genou aux épaules. Maintiens 2s en haut, descends lentement. 15 répétitions.",
    contraindications: ["Lombalgie aiguë"],
    variations: ["glute bridge", "pont", "hip thrust au sol"]
  },

  pont_fessier_pelvis_enroule: {
    name: "Pont fessier 'pelvis enroulé' (vertèbre par vertèbre)",
    category: "Mobilité",
    bodyZone: "lombaires",
    primaryMuscles: ["Multifides", "Grand fessier"],
    secondaryMuscles: ["Ischio-jambiers", "Transverse"],
    equipment: "Tapis",
    defaultDuration: 120,
    position: "Allongé dorsal genoux fléchis",
    difficulty: 2,
    description:
      "Variante de pont qui se concentre sur le déroulé articulaire vertèbre par vertèbre. Excellent pour la conscience proprioceptive de la colonne.",
    instructions:
      "Allongé sur le dos, genoux fléchis. Commence par basculer le bassin en rétroversion, puis décolle les vertèbres une à une (sacrum → lombaires → dorsales basses). Atteins le pont haut, puis redescends en sens inverse. 6 répétitions très lentes.",
    contraindications: ["Hernie discale aiguë"],
    variations: ["spinal articulation bridge", "pont déroulé", "pelvic curl"]
  },

  allonge_jambes_croisees_piriforme: {
    name: "Allongé jambes croisées (piriforme + fessier)",
    category: "Étirement passif",
    bodyZone: "fessiers",
    primaryMuscles: ["Piriforme", "Moyen fessier"],
    secondaryMuscles: ["Grand fessier", "Rotateurs profonds de la hanche"],
    equipment: "Tapis",
    defaultDuration: 90,
    position: "Allongé dorsal, cheville sur cuisse opposée",
    difficulty: 1,
    description:
      "Étirement classique du piriforme (responsable de nombreuses sciatalgies non discales). Position 'figure 4' adaptée au sol pour un confort maximal.",
    instructions:
      "Allongé sur le dos, pose la cheville droite sur la cuisse gauche (figure 4). Saisis la cuisse gauche par-dessus ou par-dessous le genou et tire vers la poitrine. Pousse délicatement le genou droit vers l'extérieur avec le coude. 60s par côté.",
    contraindications: ["Prothèse de hanche (consulter)"],
    variations: ["figure 4 stretch", "piriformis stretch", "supine pigeon"]
  },

  assis_jambe_croisee_twist: {
    name: "Assis jambe croisée (twist lent de la colonne)",
    category: "Mobilité",
    bodyZone: "thoracique",
    primaryMuscles: ["Obliques", "Multifides"],
    secondaryMuscles: ["Piriforme (étiré)", "Grand dorsal"],
    equipment: "Tapis",
    defaultDuration: 90,
    position: "Assis jambes croisées (tailleur)",
    difficulty: 2,
    description:
      "Twist assis qui mobilise la colonne en rotation tout en étirant doucement les rotateurs de hanche. Stimule également la digestion par massage viscéral.",
    instructions:
      "Assis tailleur, dos droit. Pose la main droite sur le genou gauche, main gauche au sol derrière toi. Inspire en t'auto-grandissant, expire en tournant doucement le tronc vers la gauche (regarde par-dessus l'épaule). 30s par côté.",
    contraindications: ["Hernie discale aiguë", "Grossesse (préfère twist ouvert)"],
    variations: ["seated twist", "ardha matsyendrasana", "twist tailleur"]
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ISCHIO-JAMBIERS, ADDUCTEURS, MOLLETS
  // ═══════════════════════════════════════════════════════════════════════

  etirement_ischio_assis: {
    name: "Étirement ischio assis (jambes tendues)",
    category: "Étirement passif",
    bodyZone: "ischios",
    primaryMuscles: ["Ischio-jambiers (semi-tendineux, semi-membraneux, biceps fémoral)"],
    secondaryMuscles: ["Mollets", "Lombaires"],
    equipment: "Tapis (sangle facultative)",
    defaultDuration: 90,
    position: "Assis jambes tendues",
    difficulty: 2,
    description:
      "Étirement classique des ischio-jambiers en flexion de hanche. Améliore l'amplitude utile pour le squat profond et le soulevé de terre.",
    instructions:
      "Assis dos droit, jambes tendues devant. Sans arrondir le dos, fléchis depuis les hanches en allongeant le tronc vers les pieds. Garde les pieds en flexion dorsale (orteils vers toi). Si tu n'attrapes pas les pieds, utilise une sangle. 60s.",
    contraindications: ["Lombalgie aiguë (préfère version allongée)"],
    variations: ["paschimottanasana", "seated forward fold", "étirement ischios assis"]
  },

  genoux_poitrine_allonge: {
    name: "Genoux à la poitrine allongé (relâchement lombaire)",
    category: "Décompression",
    bodyZone: "lombaires",
    primaryMuscles: ["Érecteurs lombaires"],
    secondaryMuscles: ["Grand fessier (étiré)", "Multifides"],
    equipment: "Tapis",
    defaultDuration: 60,
    position: "Allongé dorsal",
    difficulty: 1,
    description:
      "Étire passivement les lombaires en flexion globale. Soulage immédiatement les douleurs lombaires non spécifiques.",
    instructions:
      "Allongé sur le dos. Ramène les deux genoux vers la poitrine, mains autour des tibias ou des cuisses (à éviter sur les genoux fragiles). Berce-toi très doucement avant-arrière pour masser les lombaires. 30 à 60s.",
    contraindications: ["Hernie discale postérieure aiguë"],
    variations: ["knees to chest", "apanasana", "genoux poitrine"]
  },

  respiration_nasale_dos_au_sol: {
    name: "Respiration nasale dos collé au sol, genoux fléchis",
    category: "Respiration",
    bodyZone: "respiration",
    primaryMuscles: ["Diaphragme"],
    secondaryMuscles: ["Transverse", "Plancher pelvien"],
    equipment: "Tapis",
    defaultDuration: 60,
    position: "Allongé dorsal genoux fléchis",
    difficulty: 1,
    description:
      "Position neutre qui supprime toute contrainte mécanique sur la colonne et permet une respiration ventrale parfaite. Recalibrage du schéma respiratoire.",
    instructions:
      "Allongé sur le dos, genoux fléchis pieds au sol largeur de hanches. Lombaires en contact léger avec le sol. Respire uniquement par le nez en gonflant le ventre, sans bouger les épaules ni la cage haute.",
    contraindications: [],
    variations: ["supine breathing", "respiration au sol", "ventrale au sol"]
  },

  assis_au_mur_chaise: {
    name: "Assis au mur (chaise — wall sit)",
    category: "Posture",
    bodyZone: "quadriceps",
    primaryMuscles: ["Quadriceps", "Grand fessier"],
    secondaryMuscles: ["Ischio-jambiers", "Mollets"],
    equipment: "Mur",
    defaultDuration: 60,
    position: "Assis fictif contre un mur, hanches et genoux à 90°",
    difficulty: 3,
    description:
      "Gainage isométrique des quadriceps et fessiers, calibré sur la posture optimale. Renforce de manière sécurisée la chaîne antérieure des cuisses.",
    instructions:
      "Dos plaqué au mur, descends en glissant jusqu'à former 90° aux hanches et aux genoux (cuisses parallèles au sol). Pieds à plat largeur de hanches. Maintiens en respirant calmement.",
    contraindications: ["Méniscopathie", "Tendinopathie rotulienne aiguë"],
    variations: ["wall sit", "chaise au mur", "isometric squat"]
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ÉTIREMENTS DYNAMIQUES & ROUTINES MIXTES
  // ═══════════════════════════════════════════════════════════════════════

  balancier_bras_jambe_opposee: {
    name: "Balancier bras / jambe opposée (debout)",
    category: "Étirement actif",
    bodyZone: "full",
    primaryMuscles: ["Chaîne croisée (oblique antérieur / postérieur)"],
    secondaryMuscles: ["Stabilisateurs de la cheville", "Core"],
    equipment: "Aucun",
    defaultDuration: 60,
    position: "Debout équilibre",
    difficulty: 2,
    description:
      "Active la coordination contralatérale typique de la marche. Améliore le pattern croisé bras / jambe et la stabilité dynamique.",
    instructions:
      "Debout pieds largeur de hanches. Lève le genou droit et le bras gauche en avant simultanément, puis échange (genou gauche + bras droit) en passant par une légère extension. Mouvement fluide, 10 répétitions par côté.",
    contraindications: [],
    variations: ["bird dog standing", "marche exagérée", "cross crawl"]
  },

  pendule_bras_hanche: {
    name: "Pendule bras + hanche",
    category: "Mobilité",
    bodyZone: "hanches",
    primaryMuscles: ["Articulation coxo-fémorale", "Articulation gléno-humérale"],
    secondaryMuscles: ["Adducteurs", "Deltoïdes"],
    equipment: "Aucun",
    defaultDuration: 120,
    position: "Debout en appui sur une jambe",
    difficulty: 2,
    description:
      "Mobilise simultanément hanche et épaule par balancement passif. Excellent échauffement avant tractions ou squat.",
    instructions:
      "Debout en appui sur la jambe droite (proche d'un mur si besoin). Laisse la jambe gauche osciller librement avant-arrière puis latéralement. En même temps, fais osciller le bras droit dans le même plan. 30s par direction × 2 côtés.",
    contraindications: ["Trouble vestibulaire (équilibre)"],
    variations: ["leg arm swing", "swing pendule", "hip arm swing"]
  },

  etirement_dynamique_bras_croises: {
    name: "Étirement dynamique bras croisés (type nage dos)",
    category: "Étirement actif",
    bodyZone: "épaules",
    primaryMuscles: ["Pectoraux", "Deltoïdes"],
    secondaryMuscles: ["Grand dorsal", "Trapèzes"],
    equipment: "Aucun",
    defaultDuration: 120,
    position: "Debout",
    difficulty: 1,
    description:
      "Mouvement dynamique inspiré de la nage en dos crawlé qui mobilise globalement la ceinture scapulaire dans une amplitude complète.",
    instructions:
      "Debout pieds largeur de hanches. Effectue de grands cercles alternés avec les bras vers l'arrière (comme la nage en dos), pleine amplitude. Croise les trajectoires devant le corps. 20 répétitions fluides.",
    contraindications: ["Tendinopathie de la coiffe aiguë"],
    variations: ["arm swings", "back stroke arms", "swimming dos"]
  },

  cercles_cou_bras_hanches: {
    name: "Cercles lents (cou + bras + hanches)",
    category: "Mobilité",
    bodyZone: "full",
    primaryMuscles: ["Articulations cervicales, scapulo-humérales, coxo-fémorales"],
    secondaryMuscles: ["Capsules articulaires", "Synoviales"],
    equipment: "Aucun",
    defaultDuration: 120,
    position: "Debout",
    difficulty: 1,
    description:
      "Routine articulaire globale qui lubrifie les principales articulations. Inspirée des CARs (Controlled Articular Rotations) de la méthode FRC.",
    instructions:
      "1) 5 cercles lents de tête dans chaque sens. 2) 5 cercles d'épaules dans chaque sens. 3) Mains sur les hanches, 5 cercles de bassin dans chaque sens. Lent, contrôlé, amplitude maximale sans douleur.",
    contraindications: ["Pathologie articulaire active"],
    variations: ["joint CARs", "cercles articulaires", "morning routine"]
  },

  // ═══════════════════════════════════════════════════════════════════════
  // SUSPENSION & DÉCOMPRESSION
  // ═══════════════════════════════════════════════════════════════════════

  dead_hang_passif: {
    name: "Dead hang passif (suspension à la barre)",
    category: "Décompression",
    bodyZone: "dos",
    primaryMuscles: ["Grand dorsal (étiré)", "Disques inter-vertébraux"],
    secondaryMuscles: ["Avant-bras (grip)", "Capsule de l'épaule"],
    equipment: "Barre fixe / chambranle",
    defaultDuration: 60,
    position: "Suspendu à une barre, bras tendus",
    difficulty: 3,
    description:
      "Décompression vertébrale par traction du poids du corps. Étire le grand dorsal, ouvre la cage et soulage les lombaires (chaîne postérieure).",
    instructions:
      "Suspends-toi à une barre solide, prise pronation largeur épaules. Laisse les épaules monter vers les oreilles (passif total). Respire calmement. Début : 15-20s, progresse vers 60s. Lâche en pliant les genoux d'abord.",
    contraindications: ["Tendinopathie aiguë de la coiffe", "Conflit sous-acromial actif"],
    variations: ["dead hang", "passive hang", "suspension barre"]
  },

  // ═══════════════════════════════════════════════════════════════════════
  // AUTO-MASSAGE / RELAXATION MENTALE
  // ═══════════════════════════════════════════════════════════════════════

  auto_massage_trapezes_cou: {
    name: "Auto-massage trapèzes + cou (mains)",
    category: "Auto-massage",
    bodyZone: "cou",
    primaryMuscles: ["Trapèzes supérieurs", "Élévateurs de la scapula"],
    secondaryMuscles: ["Splénius", "Sub-occipitaux"],
    equipment: "Aucun (huile facultative)",
    defaultDuration: 120,
    position: "Assis confortable",
    difficulty: 1,
    description:
      "Massage manuel des trapèzes et de la base du crâne. Libère les tensions liées au stress et aux longues journées d'écran.",
    instructions:
      "Assis dos droit. Avec la main droite, pince et masse le trapèze gauche en partant de la base du cou vers l'épaule. Insiste sur les nœuds. Fais ensuite des petits cercles à la base du crâne (sub-occipital) avec les pouces. 60s par côté.",
    contraindications: ["Inflammation locale", "Fièvre"],
    variations: ["self-massage neck", "auto-massage nuque", "trigger trap"]
  },

  balayage_corporel_mental: {
    name: "Balayage corporel mental (body scan)",
    category: "Récupération",
    bodyZone: "full",
    primaryMuscles: ["Système nerveux"],
    secondaryMuscles: ["Conscience proprioceptive"],
    equipment: "Aucun",
    defaultDuration: 60,
    position: "Allongé ou assis",
    difficulty: 1,
    description:
      "Technique méditative qui ramène l'attention zone par zone dans le corps. Réduit le stress, améliore l'interoception et libère les tensions inconscientes.",
    instructions:
      "Allongé sur le dos. Démarre par les pieds : observe les sensations sans jugement (chaleur, contact, tension), puis remonte lentement (mollets, cuisses, bassin, ventre, poitrine, bras, cou, visage). Si tu détectes une tension, expire dedans.",
    contraindications: [],
    variations: ["body scan", "scan corporel", "Vipassana scan", "MBSR scan"]
  },

  // ═══════════════════════════════════════════════════════════════════════
  // EXTENSION BANQUE +50 (objectif 107 entrées au total)
  // ═══════════════════════════════════════════════════════════════════════

  mob_chevilles_cercles_debout: {
    name: "Mobilité chevilles — cercles debout",
    category: "Mobilité",
    bodyZone: "mollets",
    primaryMuscles: ["Tibial antérieur", "Fibulaires", "Soléaire"],
    secondaryMuscles: ["Gastrocnémiens", "Capsule talo-crurale"],
    equipment: "Aucun",
    defaultDuration: 45,
    position: "Debout, main au mur",
    difficulty: 1,
    description:
      "Réveille l’amplitude en inversion / éversion et en rotation du cou-de-pied avant course, sauts ou squat : la cheville reste souvent raide après des heures assis.",
    instructions:
      "Une main au mur pour l’équilibre, pied libre en l’air. Trace 8 à 12 cercles lents et larges dans un sens puis dans l’autre, genou quasi fixe (mouvement vient surtout de la cheville). Sensations d’étirement modéré seulement. Change de pied.",
    contraindications: ["Entorse aiguë de cheville"],
    variations: ["ankle circles", "mob cheville"]
  },

  mob_poignets_flexion_extension: {
    name: "Mobilité poignets — flexion / extension",
    category: "Mobilité",
    bodyZone: "bras",
    primaryMuscles: ["Fléchisseurs du poignet", "Extenseurs du poignet"],
    secondaryMuscles: ["Interosseux"],
    equipment: "Aucun",
    defaultDuration: 60,
    position: "Bras tendu devant",
    difficulty: 1,
    description:
      "Prépare les poignets aux charges (traction, front squat) et limite les tensions après clavier ou vélo en restaurant l’amplitude flexion / extension sans à-coups.",
    instructions:
      "Bras tendu devant toi, coude verrouillé. Alterne paume vers le sol puis vers le ciel en douceur (10 mouvements). Ensuite, aide-toi de l’autre main : pression très légère en flexion 10 s, puis en extension 10 s. Ne force jamais jusqu’à la douleur piquante.",
    contraindications: ["Syndrome du canal carpien aiguë"],
    variations: ["wrist mobility", "poignet flex ext"]
  },

  mob_doigts_extension_active: {
    name: "Extension active des doigts",
    category: "Mobilité",
    bodyZone: "bras",
    primaryMuscles: ["Interosseux dorsaux", "Extenseurs des doigts"],
    secondaryMuscles: ["Lombricaux"],
    equipment: "Aucun",
    defaultDuration: 45,
    position: "Paume sur cuisse",
    difficulty: 1,
    description:
      "Rééquilibre fléchisseurs et extenseurs après grip (haltères, barre, grimpe) ou souris : les fléchisseurs sont souvent sursollicités, ce qui favorise inconfort au poignet.",
    instructions:
      "Paume posée sur la cuisse, doigts relâchés. Ouvre au maximum en écartant les doigts puis tends-les comme pour dire « stop », sans crispation. 10 répétitions lentes, 2 à 3 séries, pause entre les séries.",
    contraindications: ["Fracture récente de la main"],
    variations: ["finger extension", "doigts ouverts"]
  },

  et_passif_adducteurs_sol: {
    name: "Étirement passif des adducteurs au sol",
    category: "Étirement passif",
    bodyZone: "hanches",
    primaryMuscles: ["Adducteurs de la cuisse"],
    secondaryMuscles: ["Gracile", "Pectiné"],
    equipment: "Tapis",
    defaultDuration: 90,
    position: "Assis, plantes de pieds jointes",
    difficulty: 1,
    description:
      "Ouvre la ligne interne de cuisse et la capsule médiale de hanche sans charger les lombaires : utile après squat large, écart ou sports latéraux.",
    instructions:
      "Assis, plantes jointes, genoux tombant sur les côtés. Laisse la gravité agir ; respire lentement dans le bas-ventre. Évite de pousser brutalement sur les genoux avec les mains (tu peux poser les mains sur les cuisses pour un poids très léger seulement). 60 à 90 s.",
    contraindications: ["Pubalgie aiguë"],
    variations: ["butterfly stretch", "papillon"]
  },

  et_actif_grand_dorsal_corde: {
    name: "Étirement actif du grand dorsal (corde / rack)",
    category: "Étirement actif",
    bodyZone: "dos",
    primaryMuscles: ["Grand dorsal"],
    secondaryMuscles: ["Grand rond", "Triceps long"],
    equipment: "Barre fixe ou rack",
    defaultDuration: 60,
    position: "Debout, mains accrochées",
    difficulty: 2,
    description:
      "Associe une traction légère à une bascule du bassin pour allonger le grand dorsal et le serratus : idéal après tractions, rowing ou postures voûtées.",
    instructions:
      "Mains à hauteur d’épaules sur la barre, bras tendus. Recule le bassin en gardant la colonne longue, puis pousse doucement le sternum vers le sol sans bloquer la respiration. Tiens 20 à 30 s, relâche, répète 2 fois.",
    contraindications: ["Épaule instable"],
    variations: ["lat stretch bar", "dorsal rack"]
  },

  mob_t12_rotation_quadrupedie: {
    name: "Rotation thoracique T12 en quadrupédie",
    category: "Mobilité",
    bodyZone: "thoracique",
    primaryMuscles: ["Multifides thoraciques", "Obliques"],
    secondaryMuscles: ["Grands dorsaux (faible)"],
    equipment: "Tapis",
    defaultDuration: 60,
    position: "Quadrupédie",
    difficulty: 2,
    description:
      "Cible la mobilité du segment thoracique (souvent rigide à cause du bureau) pour soulager la sensation de dos « bloqué » entre les omoplates et limiter la compensation lombaire.",
    instructions:
      "Mains sous les épaules, genoux sous les hanches. Main derrière la tête, coude ouvert. Inspire, puis à l’expire ouvre le coude vers le plafond en suivant du regard la main, sans creuser les lombaires. Reviens au centre. 6 à 8 fois par côté, lentement.",
    contraindications: ["Scoliose douloureuse non bilansée"],
    variations: ["t-spine rotation", "quadruped rotation"]
  },

  decom_vague_rachis_debout: {
    name: "Décompression — vague rachidienne debout",
    category: "Décompression",
    bodyZone: "lombaires",
    primaryMuscles: ["Chaîne postérieure"],
    secondaryMuscles: ["Multifides", "Ischio-jambiers"],
    equipment: "Aucun",
    defaultDuration: 75,
    position: "Debout genoux souples",
    difficulty: 2,
    description:
      "Enchaîne flexion et extension du rachis debout pour « lubrifier » les articulations et relâcher la tension des érecteurs après station prolongée ou charges axiales.",
    instructions:
      "Genoux légèrement fléchis, mains sur les cuisses si besoin. Roule le bassin pour arrondir le dos (menton vers le sternum), puis déroule du bassin au crâne en ouvrant le sternum vers l’avant, sans aller au maximum douloureux. 6 à 10 cycles lents, synchronisés à la respiration.",
    contraindications: ["Sténose lombaire symptomatique en extension"],
    variations: ["spinal wave", "cat debout"]
  },

  mob_hanche_er_couche: {
    name: "Mobilité hanche — rotation externe allongé",
    category: "Mobilité",
    bodyZone: "hanches",
    primaryMuscles: ["Rotateurs externes de hanche"],
    secondaryMuscles: ["Fessier moyen", "Piriforme"],
    equipment: "Tapis",
    defaultDuration: 75,
    position: "Allongé sur le dos",
    difficulty: 2,
    description:
      "Améliore la rotation externe de hanche et l’abaissement du genou vers l’extérieur : utile avant squat profond, fentes ou postures en rotation externe (hip ER).",
    instructions:
      "Sur le dos, hanche et genou à environ 90°, pied « casse-noisette ». Laisse le genou descendre vers le sol extérieur sans arracher l’autre fesse du sol. Maintiens 30 à 45 s, respire calmement. Change de côté.",
    contraindications: ["Capsulite rétractile sévère"],
    variations: ["hip ER lying", "90 90 hip"]
  },

  et_quadriceps_genou_sol: {
    name: "Étirement du quadriceps genou au sol",
    category: "Étirement passif",
    bodyZone: "quadriceps",
    primaryMuscles: ["Quadriceps fémoral"],
    secondaryMuscles: ["Iliopsoas"],
    equipment: "Coussin",
    defaultDuration: 90,
    position: "Côté, cheville en main",
    difficulty: 1,
    description:
      "Allonge le quadriceps et le droit fémoral en limitant la cambrure lombaire : variante stable pour celles et ceux qui tiennent mal l’équilibre debout sur un pied.",
    instructions:
      "Sur le côté, genou du dessous fléchi pour l’appui. Saisis la cheville du dessus et rapproche talon-fesse sans pousser le bassin vers l’avant (bassin neutre ou légère rétroversion). 45 s par jambe, respiration lente.",
    contraindications: ["Pathologie fémoro-patellaire inflammatoire"],
    variations: ["side lying quad", "quad stretch floor"]
  },

  et_ischio_bascule_bassin: {
    name: "Étirement ischio-jambiers avec bascule de bassin",
    category: "Étirement actif",
    bodyZone: "ischios",
    primaryMuscles: ["Ischio-jambiers"],
    secondaryMuscles: ["Gastrocnémiens"],
    equipment: "Tapis",
    defaultDuration: 75,
    position: "Demi-flexion debout",
    difficulty: 2,
    description:
      "Cible les ischio-jambiers en gardant une charnière hanche (bassin qui recule) plutôt qu’un arrondi du dos : évite d’étirer surtout les lombaires tout en ouvrant la chaîne postérieure.",
    instructions:
      "Face à une chaise ou un mur, pieds sous les hanches. Recule le bassin comme pour t’asseoir loin derrière, dos long. Avance le buste sans arrondir les épaules jusqu’à tension modérée derrière les cuisses. Micro-bascules avant/arrière 8 à 10 fois, puis maintien 20 s.",
    contraindications: ["Discopathie aiguë en flexion"],
    variations: ["hinge hamstring", "ischio hinge"]
  },

  mob_epaule_baton_passif: {
    name: "Mobilité épaule — baguette passive",
    category: "Mobilité",
    bodyZone: "épaules",
    primaryMuscles: ["Coiffe des rotateurs"],
    secondaryMuscles: ["Deltoïde", "Trapèze"],
    equipment: "Bâton / serviette",
    defaultDuration: 60,
    position: "Debout",
    difficulty: 1,
    description:
      "Augmente progressivement l’élévation et la rotation sans compensation lombaire : la baguette impose un mouvement symétrique des deux bras, idéal en rééducation ou retour à la charge.",
    instructions:
      "Tiens une baguette ou serviette tendue des deux mains, largeur d’épaules. Paumes vers le bas ou vers l’avant selon le confort. Fais glisser les mains en arc vers l’arrière puis le haut dans la zone indolore seulement (pas de forcing ni de douleur en bout de course). 10 à 12 mouvements lents.",
    contraindications: ["Luxation récente"],
    variations: ["shoulder stick", "stick pass"]
  },

  et_mollet_mur_profond: {
    name: "Étirement mollet au mur (gastroc profond)",
    category: "Étirement passif",
    bodyZone: "mollets",
    primaryMuscles: ["Gastrocnémiens"],
    secondaryMuscles: ["Soléaire"],
    equipment: "Mur",
    defaultDuration: 60,
    position: "Fente mollet arrière tendu",
    difficulty: 1,
    description:
      "Cible surtout le gastrocnémien (genou tendu) pour retrouver de la flexion dorsale utile à la foulée et au squat talon au sol.",
    instructions:
      "Face au mur, une jambe avant genou fléchi, jambe arrière tendue avec le pied entier au sol. Avance le bassin jusqu’à tension modérée sous le genou arrière. Garde les orteils vers l’avant. 30 s par jambe, respire sans bloquer.",
    contraindications: ["Rupture achilléenne"],
    variations: ["calf wall stretch", "mollet mur"]
  },

  mob_bassin_rocking: {
    name: "Rocking du bassin (pelvic rock)",
    category: "Mobilité",
    bodyZone: "lombaires",
    primaryMuscles: ["Multifides lombaires", "Transverse"],
    secondaryMuscles: ["Fléchisseurs de hanche"],
    equipment: "Tapis",
    defaultDuration: 60,
    position: "Quadrupédie",
    difficulty: 1,
    description:
      "Réveille la dissociation bassin–rachis et assouplit la zone lombo-sacrée avant charges lourdes ou après longue station assise.",
    instructions:
      "À quatre pattes, mains sous les épaules. Bascule doucement le bassin en antéversion (regard du nombril vers le sol) puis en rétroversion, sans raidir les épaules. Le haut du dos suit à peine : l’accent est sur le bassin. 12 à 15 rocks lents.",
    contraindications: ["Grossesse tardive (adapter position)"],
    variations: ["pelvic rock", "rocking bassin"]
  },

  yoga_transition_chat_vache_lente: {
    name: "Yoga — transition chat / vache ultra lente",
    category: "Yoga / Postures",
    bodyZone: "lombaires",
    primaryMuscles: ["Érecteurs du rachis", "Transverse"],
    secondaryMuscles: ["Obliques"],
    equipment: "Tapis",
    defaultDuration: 90,
    position: "Quadrupédie",
    difficulty: 1,
    description:
      "Coordonne respiration et micro-mouvements pour lubrifier tout le rachis et apaiser le système nerveux en début ou fin de séance.",
    instructions:
      "Quadrupédie stable. Inspire : laisse le ventre descendre, le sternum s’ouvrir (vache). Expire : arrondis le dos, pousse le sol avec les mains (chat). Chaque transition dure 4 à 6 secondes. 10 cycles très lents, sans aller au bout de la douleur.",
    contraindications: ["Douleur neurologique irradiante"],
    variations: ["slow cat cow", "chat vache lent"]
  },

  et_poitrine_double_encadrement: {
    name: "Étirement des pectoraux — double encadrement de porte",
    category: "Étirement passif",
    bodyZone: "poitrine",
    primaryMuscles: ["Grand pectoral", "Petit pectoral"],
    secondaryMuscles: ["Deltoïde antérieur"],
    equipment: "Cadre de porte",
    defaultDuration: 75,
    position: "Debout dans l’encadrement",
    difficulty: 1,
    description:
      "Ouvre la chaîne antérieure (pectoraux + deltoïde antérieur) après posture voûtée ou séance de poussée, pour retrouver une meilleure position des épaules.",
    instructions:
      "Avant-bras ou mains sur les montants du cadre, coudes un peu pliés. Fais un petit pas en avant jusqu’à étirement confortable dans la poitrine, sans cambrer excessivement les lombaires. Respire profondément 45 à 60 s ; tu peux monter légèrement les mains sur le cadre pour changer l’angle.",
    contraindications: ["Instabilité gléno-humérale antérieure"],
    variations: ["doorway pec", "pec double"]
  },

  mob_axial_deglutition_cou: {
    name: "Mobilité cervicale — rétraction axiale + déglutition",
    category: "Posture",
    bodyZone: "cou",
    primaryMuscles: ["Fléchisseurs profonds du cou", "Trapèzes inférieurs"],
    secondaryMuscles: ["Rhombes"],
    equipment: "Aucun",
    defaultDuration: 60,
    position: "Assis dos neutre",
    difficulty: 1,
    description:
      "Renforce la stabilité profonde du cou (longs fléchisseurs) et corrige la tête en avant : base fréquente des programmes « desk » et cervicalgies mécaniques.",
    instructions:
      "Assis, regard à l’horizon. Recule le menton horizontalement comme pour un « double menton » sans baisser la tête. Maintiens 5 s, déglutis une fois lentement, relâche à moitié. Répète 8 à 10 fois. Les épaules restent basses et immobiles.",
    contraindications: ["Vertige positionnel"],
    variations: ["chin tuck", "retraction cervicale"]
  },

  et_biceps_mur_rotation: {
    name: "Étirement biceps contre mur (rotation neutre)",
    category: "Étirement passif",
    bodyZone: "bras",
    primaryMuscles: ["Biceps brachial"],
    secondaryMuscles: ["Brachial antérieur", "Coracobrachial"],
    equipment: "Mur",
    defaultDuration: 45,
    position: "Bras en extension derrière",
    difficulty: 1,
    description:
      "Allonge le biceps et l’avant du bras après curls, tractions ou port de charges : limite la sensation de « bras court » ou de tension à la pliure du coude.",
    instructions:
      "Bras tendu derrière toi, paume contre le mur à hauteur d’épaule ou un peu plus bas. Tourne lentement le torse dans le sens opposé au bras étiré jusqu’à tension modérée dans le pli du coude. 25 à 35 s par bras.",
    contraindications: ["Capsulite antérieure douloureuse"],
    variations: ["biceps wall", "biceps stretch"]
  },

  mob_pron_supination_avant_bras: {
    name: "Pronation / supination active avant-bras",
    category: "Mobilité",
    bodyZone: "bras",
    primaryMuscles: ["Rond pronateur", "Supinateur"],
    secondaryMuscles: ["Biceps (supination)"],
    equipment: "Haltère léger ou bouteille",
    defaultDuration: 60,
    position: "Coude à 90° collé au corps",
    difficulty: 1,
    description:
      "Rétablit l’amplitude et la coordination entre pronation et supination après tennis, musculation ou travail répétitif à la souris.",
    instructions:
      "Coude plaqué contre les côtes, avant-bras horizontal. Tourne lentement la paume vers le sol (pronation) puis vers le plafond (supination). Charge légère (500 g à 2 kg) seulement. 12 à 15 allers-retours par bras, sans douleur vive au coude.",
    contraindications: ["Fracture de l’avant-bras récente"],
    variations: ["forearm rotation", "pron supination"]
  },

  et_avant_bras_flex_commun: {
    name: "Étirement des fléchisseurs communs (main tendue)",
    category: "Étirement passif",
    bodyZone: "bras",
    primaryMuscles: ["Fléchisseurs communs des doigts"],
    secondaryMuscles: ["Palmaire long"],
    equipment: "Aucun",
    defaultDuration: 45,
    position: "Bras tendu paume au mur",
    difficulty: 1,
    description:
      "Soulage la tension des fléchisseurs (tendinite, sensation de lourdeur) après grip, clavier ou vélo en ouvrant le poignet et la loge antérieure.",
    instructions:
      "Bras tendu devant toi, paume contre le mur, doigts vers le bas. Garde le coude verrouillé et l’épaule basse. Respire 25 s, puis recule légèrement le corps pour augmenter doucement l’angle. 2 à 3 positions par côté.",
    contraindications: ["Syndrome de loge antérieur"],
    variations: ["forearm flexor stretch", "poignet flexeurs"]
  },

  decom_fessier_pigeon_adaptatif: {
    name: "Décompression fessier — pigeon adaptatif (chaise)",
    category: "Décompression",
    bodyZone: "fessiers",
    primaryMuscles: ["Grand fessier", "Piriforme"],
    secondaryMuscles: ["Fléchisseurs de hanche"],
    equipment: "Chaise stable",
    defaultDuration: 90,
    position: "Assis bord de chaise",
    difficulty: 1,
    description:
      "Reproduit l’angle « figure 4 » du pigeon au sol de façon accessible : ouvre la hanche postérieure et étire doucement fessier et région piriforme sans flexion lombaire forcée.",
    instructions:
      "Assis sur le bord stable, cheville d’une jambe sur le genou opposé (angle 90/90 si possible). Dos droit, penche le buste depuis les hanches (pas en rondissant). Maintiens 30 à 45 s, change de jambe. Garde la respiration fluide.",
    contraindications: ["Prothèse de hanche récente"],
    variations: ["chair pigeon", "pigeon assis"]
  },

  mob_orteils_extension_plancher: {
    name: "Extension des orteils au sol (réveil voûte)",
    category: "Mobilité",
    bodyZone: "mollets",
    primaryMuscles: ["Intrinsèques du pied", "Extenseur des orteils"],
    secondaryMuscles: ["Tibial antérieur"],
    equipment: "Aucun",
    defaultDuration: 45,
    position: "Debout pied nu",
    difficulty: 1,
    description:
      "Réactive la voûte plantaire et la dissociation orteils / cheville : utile avant course, marche pied nu ou renforcement du pied « plat » compensatoire.",
    instructions:
      "Debout pieds parallèles, appui sur les deux talons. Soulève tous les orteils au maximum, puis repose-les un par un du petit orteil vers le gros, en contrôlant. Répète 8 à 12 fois. Garde les genoux souples, ne te penche pas en avant.",
    contraindications: ["Hallux valgus douloureux aigu"],
    variations: ["toe yoga", "orteils actifs"]
  },

  et_trapezes_ceinture_assis: {
    name: "Étirement trapèzes avec serviette (assise)",
    category: "Étirement passif",
    bodyZone: "épaules",
    primaryMuscles: ["Trapèzes supérieurs"],
    secondaryMuscles: ["Élévateurs de la scapula", "Scalènes"],
    equipment: "Serviette roulée",
    defaultDuration: 60,
    position: "Assis",
    difficulty: 1,
    description:
      "Crée une traction axiale très douce sur la nuque pour allonger le haut des trapèzes et les élévateurs, souvent raccourcis par le stress et l’écran sans manipuler brutalement les vertèbres.",
    instructions:
      "Assis dos neutre, passe une serviette roulée derrière la tête (niveau couronne). Mains sur les bouts de la serviette : tire doucement vers le bas en opposition avec la tête qui « résiste » à peine (effort 20 %). Garde 25 à 35 s, respire dans les côtes. Ne tire pas d’un coup sec.",
    contraindications: ["Instabilité cervicale"],
    variations: ["towel trap", "trap stretch towel"]
  },

  mob_scapulaire_wall_slides: {
    name: "Wall slides scapulaires (bras en W)",
    category: "Posture",
    bodyZone: "épaules",
    primaryMuscles: ["Trapèze inférieur", "Serratus antérieur"],
    secondaryMuscles: ["Deltoïde postérieur"],
    equipment: "Mur",
    defaultDuration: 60,
    position: "Dos au mur",
    difficulty: 1,
    description:
      "Réapprend à élever les bras en gardant les omoplates basses et stables : limite la compensation « haussement d’épaules » typique du bureau et prépare tractions ou développés.",
    instructions:
      "Dos, fesses et tête au mur (lombaires : espace main acceptable). Coudes à 90°, avant-bras et poignets en contact avec le mur (W). Glisse les mains vers le haut en Y sans perdre le contact ni creuser les côtes. Redescends lentement. 8 à 12 répétitions.",
    contraindications: ["Épaule douloureuse en abduction forcée"],
    variations: ["wall slides", "scap wall"]
  },

  resp_coherence_cardiaque_365: {
    name: "Cohérence cardiaque 3-6-5 (respiration)",
    category: "Respiration",
    bodyZone: "respiration",
    primaryMuscles: ["Diaphragme"],
    secondaryMuscles: ["Nerf vague"],
    equipment: "Aucun",
    defaultDuration: 120,
    position: "Assis confortable",
    difficulty: 1,
    description:
      "Rythme respiratoire lent (3 s inspirer, 6 s expirer, 5 s pause douce) qui favorise la variabilité cardiaque et l’état de calme ; souvent utilisé avant le coucher ou entre deux blocs d’entraînement.",
    instructions:
      "Assis confortable, une main sur le ventre. Inspire par le nez 3 s en laissant le ventre s’ouvrir. Expire par le nez (ou nez-bouche) 6 s en vidant doucement. Pause douce 5 s sans bloquer la gorge : si tu étouffes, passe en 2-4-3. Enchaîne 8 à 12 cycles complets.",
    contraindications: ["BPCO exacerbée"],
    variations: ["365 breathing", "coherence 365"]
  },

  et_mollet_genou_plie_sol: {
    name: "Étirement mollet genou fléchi (soléaire)",
    category: "Étirement passif",
    bodyZone: "mollets",
    primaryMuscles: ["Soléaire"],
    secondaryMuscles: ["Tibial postérieur"],
    equipment: "Tapis",
    defaultDuration: 45,
    position: "Quadrupédie ou fente",
    difficulty: 1,
    description:
      "Avec le genou fléchi, le gastrocnémien est relâché : l’étirement cible surtout le soléaire et la cheville en flexion dorsale, complément indispensable après le mollet « genou tendu ».",
    instructions:
      "En fente basse ou à quatre pattes, jambe arrière avec genou au sol et pied à plat. Avance le bassin ou le genou avant en gardant le talon arrière collé au sol jusqu’à tension modérée devant la cheville. 30 s par côté. Respire sans forcer.",
    contraindications: ["Entorse récente"],
    variations: ["soleus stretch", "mollet genou plié"]
  },

  mob_hanche_flexion_assis_banc: {
    name: "Mobilité hanche — flexion assise sur banc",
    category: "Mobilité",
    bodyZone: "hanches",
    primaryMuscles: ["Fléchisseurs de hanche"],
    secondaryMuscles: ["Iliopsoas"],
    equipment: "Banc haut",
    defaultDuration: 60,
    position: "Assis bord banc",
    difficulty: 1,
    description:
      "Travaille la flexion pure de hanche avec le dos protégé : utile pour préparer les squats ou débloquer les hanches sans « rouler » le dos pour compenser.",
    instructions:
      "Assis sur le bord d’un banc stable, pieds au sol. Ramène lentement un genou vers la poitrine avec les mains sous la cuisse (pas derrière le genou). Dos long, ne penche pas en arrière. Tiens 15 s, relâche, alterne 6 à 8 fois par jambe.",
    contraindications: ["Pathologie aiguë de hanche"],
    variations: ["hip flex seated", "flex hanche banc"]
  },

  yoga_utkatasana_assis_coudes: {
    name: "Utkatasana adapté — assis coudes sur genoux",
    category: "Yoga / Postures",
    bodyZone: "quadriceps",
    primaryMuscles: ["Quadriceps", "Grand fessier"],
    secondaryMuscles: ["Transverse"],
    equipment: "Chaise",
    defaultDuration: 45,
    position: "Assis dos droit",
    difficulty: 2,
    description:
      "Active isométriquement quadriceps et fessiers sans charger le genou en flexion profonde debout : bon pont entre mobilité et pré-activation avant séance jambes.",
    instructions:
      "Assis au bord de la chaise, pieds à plat largeur bassin. Pose les avant-bras sur les cuisses près des genoux. Pousse les genoux vers le bas pendant que les bras résistent légèrement (comme si tu voulais t’ouvrir). Maintiens 10 à 15 s, relâche 5 s, 4 à 6 répétitions.",
    contraindications: ["Douleur fémoro-patellaire aiguë"],
    variations: ["chair utkatasana", "utkatasana adapté"]
  },

  decom_suspension_genoux_partiels: {
    name: "Décompression — suspension partielle genoux fléchis",
    category: "Décompression",
    bodyZone: "dos",
    primaryMuscles: ["Chaîne postérieure"],
    secondaryMuscles: ["Poignet en charge"],
    equipment: "Barre fixe",
    defaultDuration: 45,
    position: "Suspendu pieds au sol",
    difficulty: 2,
    description:
      "Allège la traction sur les épaules et le rachis en gardant une partie du poids sur les jambes : utile pour « ouvrir » l’espace intervertébral sans suspension totale trop intense.",
    instructions:
      "Mains sur la barre, bras tendus, pieds au sol. Fléchis légèrement les genoux jusqu’à sentir un allongement confortable des bras et du dos, sans douleur aux poignets. Respire calmement 20 à 30 s, puis relâche progressivement.",
    contraindications: ["Syndrome du canal carpien sévère"],
    variations: ["partial hang", "hang assisté"]
  },

  et_adducteurs_standing_lat: {
    name: "Étirement adducteurs debout (fente latérale)",
    category: "Étirement actif",
    bodyZone: "hanches",
    primaryMuscles: ["Adducteurs"],
    secondaryMuscles: ["Grand adducteur"],
    equipment: "Aucun",
    defaultDuration: 60,
    position: "Fente latérale large",
    difficulty: 2,
    description:
      "Ouvre la ligne interne de cuisse en fente latérale : complète les étirements au sol et prépare sports latéraux, patinage ou gardes basses.",
    instructions:
      "Grande fente latérale, pied extérieur plat, orteils vers l’avant. Pousse le bassin en arrière et penche le buste vers la jambe tendue en gardant le dos le plus long possible. 25 à 35 s par côté. Ne rebondis pas sur la jambe tendue.",
    contraindications: ["Pubalgie"],
    variations: ["side lunge adductor", "adducteur debout"]
  },

  mob_thoracic_open_book: {
    name: "Open book thoracique (allongé sur le côté)",
    category: "Mobilité",
    bodyZone: "thoracique",
    primaryMuscles: ["Obliques", "Multifides"],
    secondaryMuscles: ["Petit pectoral"],
    equipment: "Tapis",
    defaultDuration: 75,
    position: "Côté genoux à 90°",
    difficulty: 2,
    description:
      "Rotation ouverte du thorax pour contrer les postures torsadées (bureau, tennis, golf) et retrouver de l’amplitude entre omoplates sans forcer les lombaires.",
    instructions:
      "Sur le côté, genoux fléchis empilés devant toi, bras tendus ensemble devant la poitrine. Inspire, puis à l’expire ouvre le bras supérieur en arc de cercle jusqu’au sol derrière toi si possible, en suivant la main des yeux. Garde les genoux collés. 6 à 8 ouvertures lentes par côté.",
    contraindications: ["Vertiges en rotation"],
    variations: ["open book t-spine", "livre thoracique"]
  },

  et_ischio_banc_surélevé: {
    name: "Étirement ischio sur banc surélevé",
    category: "Étirement passif",
    bodyZone: "ischios",
    primaryMuscles: ["Ischio-jambiers"],
    secondaryMuscles: ["Gastrocnémiens"],
    equipment: "Banc ou marche",
    defaultDuration: 90,
    position: "Assis bord, une jambe tendue",
    difficulty: 2,
    description:
      "Même principe que la flexion debout mais avec le dos guidé par le banc : idéal si tu as mal à « toucher les orteils » debout ou si tu tends à arrondir fort le dos.",
    instructions:
      "Assis sur le bord, une jambe tendue genou déverrouillé (orteils vers le ciel). Dos droit, avance le sternum comme une charnière depuis les hanches sans courber la nuque. Maintiens 40 à 50 s, change de jambe. Option : légère flexion de la cheville pour moduler.",
    contraindications: ["Sciatalgie aiguë"],
    variations: ["seated hamstring bench", "ischio banc"]
  },

  mob_cou_oculosuivi_lent: {
    name: "Mobilité cou — suivi oculaire lent",
    category: "Mobilité",
    bodyZone: "cou",
    primaryMuscles: ["Recti oculomoteurs (indirect)"],
    secondaryMuscles: ["SCM", "Trapèzes"],
    equipment: "Aucun",
    defaultDuration: 45,
    position: "Assis tête fixe",
    difficulty: 1,
    description:
      "Découple la nuque du regard : réduit les micro-contractions des muscles du cou liées au suivi visuel prolongé (écrans, conduite) et améliore la fluidité oculo-céphalique.",
    instructions:
      "Assis, tête parfaitement immobile (tu peux te miroiter). Bras tendu, pouce à 50–70 cm des yeux. Déplace le pouce en carré ou en huit très lentement ; les yeux suivent sans bouger la tête. 3 allers-retours, puis ferme les yeux 10 s. Évite de forcer la convergence.",
    contraindications: ["Migraine ophtalmique en crise"],
    variations: ["eye tracking", "suivi oculaire"]
  },

  auto_massage_avant_bras_rouleau: {
    name: "Auto-massage avant-bras sur rouleau",
    category: "Auto-massage",
    bodyZone: "bras",
    primaryMuscles: ["Extenseurs / fléchisseurs"],
    secondaryMuscles: ["Fascia interosseux"],
    equipment: "Rouleau petit diamètre",
    defaultDuration: 90,
    position: "Genou au sol, avant-bras sur rouleau",
    difficulty: 2,
    description:
      "Myofascial doux sur extenseurs et fléchisseurs pour améliorer la glisse des tissues après effort ou répétitions (souris, vélo, musculation).",
    instructions:
      "À genoux, avant-bras sur le rouleau, coude fléchi à 90°. Roule très lentement de l’avant-bras moyen vers le poignet, en t’arrêtant 20 s max sur une zone modérément sensible en respirant. Ne cherche pas la douleur maximale. Face palmaire puis dorsale, 45 s chacune.",
    contraindications: ["Fracture non consolidée"],
    variations: ["forearm roll", "rouleau avant bras"]
  },

  et_poignet_ulnaire_ecartement: {
    name: "Étirement ulnaire du poignet (écartement)",
    category: "Étirement passif",
    bodyZone: "bras",
    primaryMuscles: ["Extenseurs ulnaires", "Fléchisseurs ulnaires"],
    secondaryMuscles: ["Annulaire", "Auriculaire"],
    equipment: "Aucun",
    defaultDuration: 40,
    position: "Bras tendu paume vers haut",
    difficulty: 1,
    description:
      "Ouvre l’espace du poignet côté petit doigt (compartiment ulnaire) après souris verticale, clavier décalé ou guidon vélo, pour réduire la sensation de « poignet bloqué » ou de tension latérale.",
    instructions:
      "Bras tendu devant, paume vers le ciel, coude verrouillé. Avec l’autre main, saisis les doigts et tire doucement le poignet en ulnaire (petit doigt vers l’avant-bras) jusqu’à tension modérée sous le coude ou à l’avant-bras. Respire 20 à 25 s, relâche 5 s, répète 2 fois par côté.",
    contraindications: ["Syndrome de Guyon"],
    variations: ["wrist ulnar stretch", "poignet ulnaire"]
  },

  mob_hanche_capsule_posterieure_glisse: {
    name: "Glissement capsule postérieure de hanche (supine)",
    category: "Mobilité",
    bodyZone: "hanches",
    primaryMuscles: ["Capsule postérieure"],
    secondaryMuscles: ["Ischio-fémoral"],
    equipment: "Tapis",
    defaultDuration: 60,
    position: "Allongé sur le dos",
    difficulty: 2,
    description:
      "Mobilisation douce de la capsule postérieure de hanche : utile quand la flexion profonde (squat assis, pistol) est limitée sans raideur musculaire évidente des ischios.",
    instructions:
      "Sur le dos, hanche et genou à 90°, pied relax. À mains libres ou en tenant la cuisse, fais de petites oscillations du genou vers l’épaule opposée (adduction + rotation interne légère) sur 2–3 cm d’amplitude, 20 à 30 secondes, puis change de jambe. Reste sous le seuil de douleur vive.",
    contraindications: ["Coxarthrose inflammatoire"],
    variations: ["hip capsule glide", "glide hanche"]
  },

  et_quadriceps_couche_sangle: {
    name: "Étirement du quadriceps couché avec sangle",
    category: "Étirement passif",
    bodyZone: "quadriceps",
    primaryMuscles: ["Quadriceps fémoral"],
    secondaryMuscles: ["Iliopsoas", "Rectus fémoris"],
    equipment: "Sangle",
    defaultDuration: 90,
    position: "Côté ou ventre",
    difficulty: 2,
    description:
      "Allonge le quadriceps et le droit fémoral en contrôlant l’alignement du genou et du bassin : alternative stable au tirage debout sur un pied, avec moins de risque de cambrer les lombaires.",
    instructions:
      "Sur le côté ou le ventre, passe la sangle autour de la cheville. Tire la cuisse en arrière vers la fesse en gardant le bassin neutre (légèrement rentré si tu sens la cambrure). Genou pointe vers le sol, pas vers l’extérieur. 40 à 50 s par jambe, respiration lente.",
    contraindications: ["Lésion ligamentaire aiguë du genou"],
    variations: ["quad strap stretch", "quadriceps sangle", "qdl sangle", "étirement cuisse sangle"]
  },

  yoga_balasan_hanche_large: {
    name: "Balasana — enfant hanches larges",
    category: "Yoga / Postures",
    bodyZone: "lombaires",
    primaryMuscles: ["Érecteurs (allongement)"],
    secondaryMuscles: ["Adducteurs"],
    equipment: "Tapis",
    defaultDuration: 90,
    position: "Genoux écartés, buste vers le sol",
    difficulty: 1,
    description:
      "Variante « large » de l’enfant : ouvre les hanches en abduction tout en allongeant le dos et en calmant le système nerveux. Complète la posture enfant genoux serrés pour les raideurs de l’intérieur des cuisses.",
    instructions:
      "À genoux, écarte les genoux plus larges que le bassin, orteils joints ou ouverts selon le confort. Pose le buste entre les cuisses, avant-bras ou front au sol. Laisse le poids des épaules tomber. Respire dans le dos et les flancs 60 à 90 s sans forcer l’amplitude.",
    contraindications: ["Grossesse (préfère genoux serrés)"],
    variations: ["wide child pose", "balasan large"]
  },

  mob_genou_drawbridge: {
    name: "Mobilité genou — drawbridge (pont levis)",
    category: "Mobilité",
    bodyZone: "quadriceps",
    primaryMuscles: ["Ischio-jambiers", "Quadriceps (coordination)"],
    secondaryMuscles: ["Poplités"],
    equipment: "Tapis",
    defaultDuration: 60,
    position: "Allongé sur le dos",
    difficulty: 1,
    description:
      "Réapprend le glissement du genou en flexion-extension sans claquement ni douleur : exercice de base en rééducation après immobilisation ou chirurgie quand le mouvement doit rester contrôlé.",
    instructions:
      "Sur le dos, un pied au sol, genou fléchi. Fais glisser le talon vers la fesse en gardant le pied en contact avec le sol, puis redéploie la jambe en poussant le talon vers l’avant. Mouvement lent, 10 à 12 répétitions par jambe. Aucune douleur aiguë au genou.",
    contraindications: ["Lésion LCA aiguë non rééduquée"],
    variations: ["heel slide", "drawbridge genou"]
  },

  et_chaine_posterieure_barre: {
    name: "Étirement chaîne postérieure mains sur barre basse",
    category: "Étirement passif",
    bodyZone: "ischios",
    primaryMuscles: ["Ischio-jambiers", "Fascia lata"],
    secondaryMuscles: ["Grand dorsal"],
    equipment: "Barre ou table stable",
    defaultDuration: 75,
    position: "Debout mains sur support bas",
    difficulty: 2,
    description:
      "Combine flexion hanche avec colonne relativement neutre : étire ischios et fascias latéraux tout en déchargeant le bas du dos par rapport au toucher des orteils debout classique.",
    instructions:
      "Debout face à une barre ou table basse, mains posées largeur épaules. Recule le bassin comme pour t’asseoir loin, pousse les mains vers l’avant pour allonger le dos. Garde les genoux déverrouillis si besoin. Maintiens 30 s, « pulse » doucement 5 fois avec la respiration, puis relâche.",
    contraindications: ["Hypertension non contrôlée (éviter tête basse prolongée)"],
    variations: ["bar hang stretch", "posterior chain bar"]
  },

  resp_alternee_narine_9_cycles: {
    name: "Respiration alternée nasale (Nadi Shodhana simplifié)",
    category: "Respiration",
    bodyZone: "respiration",
    primaryMuscles: ["Diaphragme"],
    secondaryMuscles: ["Muscles dilatateurs des narines"],
    equipment: "Aucun",
    defaultDuration: 120,
    position: "Assis",
    difficulty: 2,
    description:
      "Pranayama simplifié qui alterne les narines pour équilibrer la congestion, calmer le mental et préparer au sommeil ou à la concentration sans hyperventiler.",
    instructions:
      "Assis, dos droit, bouche fermée. Obstrue doucement la narine droite avec le pouce, inspire par la gauche. Obstrue la gauche, libère la droite, expire par la droite. Inspire à droite, ferme à droite, expire à gauche : c’est un cycle. Enchaîne 6 à 9 cycles complets, sans forcer le volume d’air.",
    contraindications: ["Sinusite purulente"],
    variations: ["alternate nostril", "nadi shodhana"]
  },

  mob_epaule_cross_body_interieur: {
    name: "Mobilité épaule — traction horizontale adduction",
    category: "Mobilité",
    bodyZone: "épaules",
    primaryMuscles: ["Deltoïde postérieur", "Coiffe"],
    secondaryMuscles: ["Grand dorsal"],
    equipment: "Élastique léger",
    defaultDuration: 60,
    position: "Debout câble ou élastique",
    difficulty: 2,
    description:
      "Travaille la rotation interne contrôlée de l’épaule, souvent négligée alors que l’externe est sur-sollicitée : complète les mouvements « d’ouverture » pour une épaule plus équilibrée.",
    instructions:
      "Fixe un élastique devant toi à hauteur de coude. Coude à 90°, collé au corps, avant-bras horizontal. Tire l’avant-bras vers l’épaule opposée sans hausser l’omoplate ni décoller le coude du thorax. Reviens lentement. 10 à 12 répétitions par bras, charge très légère.",
    contraindications: ["Lésion SLAP douloureuse"],
    variations: ["internal rotation mobility", "epaule IR elastique"]
  },

  et_grand_dorsal_rouleau_lat: {
    name: "Étirement grand dorsal sur rouleau latéral",
    category: "Décompression",
    bodyZone: "dos",
    primaryMuscles: ["Grand dorsal"],
    secondaryMuscles: ["Serratus"],
    equipment: "Rouleau mousse",
    defaultDuration: 75,
    position: "Allongé sur le côté du thorax",
    difficulty: 2,
    description:
      "Ouvre l’espace sous l’aisselle et le grand dorsal après tractions ou postures voûtées, en combinant pression modérée du rouleau et mouvement du bras.",
    instructions:
      "Sur le côté, rouleau sous l’omoplate latérale (pas sur les côtes flottantes). Bras du dessus en arc au-dessus de la tête, main peut glisser au sol. Petits mouvements de va-et-vient du thorax sur le rouleau sur 60 s, puis change de côté. Respire ; évite la douleur aiguë ou les picotements nerveux.",
    contraindications: ["Côtes fracturées"],
    variations: ["lat roll stretch", "dorsal rouleau"]
  },

  mob_cheville_dorsiflexion_genou_mur: {
    name: "Dorsiflexion cheville genou au mur (test mob)",
    category: "Mobilité",
    bodyZone: "mollets",
    primaryMuscles: ["Soléaire", "Gastrocnémiens"],
    secondaryMuscles: ["Fascia crural"],
    equipment: "Mur",
    defaultDuration: 45,
    position: "Fente talon au sol",
    difficulty: 2,
    description:
      "Mesure et améliore la flexion dorsale « genou vers le mur » utile au squat profond, à la course et à l’atterrissage : le talon arrière doit rester au sol pour être valide.",
    instructions:
      "Place le pied arrière à plat, talon au sol, à une distance fixe du mur (ex. une longueur de pied). Avance le genou avant vers le mur sans décoller le talon arrière. Note la distance max confortable, puis fais 10 oscillations légères et un maintien final 15 s. Change de jambe.",
    contraindications: ["Syndrome de loge antérieur"],
    variations: ["ankle dorsiflexion wall", "knee to wall"]
  },

  et_soleaire_assis_talon_sur_plaque: {
    name: "Étirement soléaire assis — talon sur élévation",
    category: "Étirement passif",
    bodyZone: "mollets",
    primaryMuscles: ["Soléaire"],
    secondaryMuscles: ["Tibial postérieur"],
    equipment: "Petite marche ou plaque",
    defaultDuration: 50,
    position: "Assis jambe tendue",
    difficulty: 1,
    description:
      "Avec le talon surélevé, le soléaire est pré-tendu : tu gagnes en flexion dorsale tout en gardant le genou fléchi, complémentaire du mollet genou tendu au mur.",
    instructions:
      "Assis bord de marche ou chaise, une jambe tendue, talon sur une petite élévation (2–3 cm). Genou légèrement fléchi. Avance doucement le genou au-dessus des orteils jusqu’à tension modérée dans le mollet bas. 25 s, relâche, répète 2 fois par jambe.",
    contraindications: ["Entorse"],
    variations: ["soleus elevated", "mollet assis surélévation"]
  },

  mob_thorax_expansion_elastique: {
    name: "Expansion thorax avec élastique derrière le dos",
    category: "Posture",
    bodyZone: "thoracique",
    primaryMuscles: ["Petit pectoral", "Intercostaux"],
    secondaryMuscles: ["Deltoïde postérieur"],
    equipment: "Élastique",
    defaultDuration: 60,
    position: "Debout mains derrière",
    difficulty: 1,
    description:
      "Ouvre la cage thoracique et les pectoraux courts après posture voûtée ou séance de poussée, pour faciliter une inspiration plus profonde en effort ou en récupération.",
    instructions:
      "Debout, passe l’élastique derrière toi (niveau lombaire ou un peu plus haut), mains écartées en prise large. À l’inspire, ouvre encore les mains et projette le sternum vers l’avant sans cambrer excessivement les lombaires. À l’expire, reviens en contrôle. 12 à 15 répétitions lentes, amplitude confortable seulement.",
    contraindications: ["Instabilité costale"],
    variations: ["band chest opener", "thorax elastique"]
  },

  posture_w_allonge_mur: {
    name: "Posture W allongée au mur (scapulaire)",
    category: "Posture",
    bodyZone: "épaules",
    primaryMuscles: ["Rotateurs externes", "Trapèze moyen"],
    secondaryMuscles: ["Rhombes"],
    equipment: "Mur",
    defaultDuration: 60,
    position: "Dos au sol ou au mur",
    difficulty: 2,
    description:
      "Renforce en bascule isométrique les rotateurs externes et le milieu du trapèze en fin d’amplitude, sans charge externe : utile pour stabiliser l’omoplate avant travail en suscription.",
    instructions:
      "Dos au sol ou au mur, lombaires neutres. Coudes à 90°, avant-bras verticaux (W). Presse doucement les avant-bras et les coudes contre le mur pendant 5 s (sans bloquer la respiration), relâche à moitié, répète 10 fois. Ne force pas si tu as une douleur vive en rotation.",
    contraindications: ["Épaule gelée phase inflammatoire"],
    variations: ["wall w", "w posture mur"]
  },

  et_cou_scm_lateral_assis: {
    name: "Étirement SCM latéral (inclinaison douce)",
    category: "Étirement passif",
    bodyZone: "cou",
    primaryMuscles: ["SCM"],
    secondaryMuscles: ["Scalènes"],
    equipment: "Aucun",
    defaultDuration: 40,
    position: "Assis",
    difficulty: 1,
    description:
      "Allonge le sterno-cléido-mastoïdien et les scalènes latéraux, souvent raccourcis par la tête en avant ou la respiration thoracique haute, pour retrouver de la longueur sans rotation forcée.",
    instructions:
      "Assis, dos droit, regard devant. Incline doucement la tête sur le côté (oreille vers l’épaule) sans tourner le menton vers le sol ni vers le plafond : le nez reste face à l’avant. La main du côté opposé peut reposer sur la cuisse pour t’ancrer. 20 à 25 s, puis change de côté. Amplitude douce seulement.",
    contraindications: ["Vertige à la mobilisation cervicale"],
    variations: ["scm stretch", "cou scm"]
  },

  mob_bassin_huit_horizontaux: {
    name: "Mobilité bassin — huit horizontaux debout",
    category: "Mobilité",
    bodyZone: "hanches",
    primaryMuscles: ["Muscles du bassin", "Obliques légers"],
    secondaryMuscles: ["Adducteurs"],
    equipment: "Aucun",
    defaultDuration: 60,
    position: "Debout genoux souples",
    difficulty: 1,
    description:
      "Fluidifie l’articulation coxo-fémorale dans plusieurs plans (circumduction) avant danse, arts martiaux, football ou toute séance avec changements de direction.",
    instructions:
      "Debout, genoux légèrement fléchis, mains sur les hanches. Trace un huit horizontal avec le bassin (comme une hanche qui « dessine »), en gardant le buste calme et les épaules au-dessus du bassin. 30 s dans un sens, 30 s dans l’autre. Respiration naturelle.",
    contraindications: ["Grossesse (amplitude réduite)"],
    variations: ["hip figure 8", "bassin huit"]
  },

  yoga_sphinx_doux_lombaires: {
    name: "Sphinx doux (extension lombaire graduée)",
    category: "Yoga / Postures",
    bodyZone: "lombaires",
    primaryMuscles: ["Érecteurs lombaires"],
    secondaryMuscles: ["Psoas (étirement léger)"],
    equipment: "Tapis",
    defaultDuration: 75,
    position: "Ventre au sol",
    difficulty: 2,
    description:
      "Introduit une extension lombaire progressive plus douce que le cobra complet : utile pour contrer la flexion prolongée (bureau, conduite) lorsqu’il n’y a pas de contre-indication à l’extension.",
    instructions:
      "Sur le ventre, avant-bras au sol, coudes sous ou légèrement devant les épaules. Appuie sur les avant-bras pour soulever le sternum, sans comprimer la nuque ni « coincer » les lombaires. Respire dans le bas du ventre 5 cycles, puis redescends. Répète 2 à 3 fois.",
    contraindications: ["Spondylolisthésis symptomatique en extension"],
    variations: ["sphinx pose", "sphinx doux"]
  },

  et_hanche_90_90_echange: {
    name: "Étirement 90/90 — échange de jambes lent",
    category: "Étirement actif",
    bodyZone: "hanches",
    primaryMuscles: ["Rotateurs externes et internes"],
    secondaryMuscles: ["Fessier moyen"],
    equipment: "Tapis",
    defaultDuration: 90,
    position: "Assis 90/90",
    difficulty: 3,
    description:
      "Mobilise la hanche dans les deux sens de rotation à partir d’une même position 90/90 : excellent diagnostic « ressenti » et préparation aux mouvements complexes de hanche.",
    instructions:
      "Assis, jambe avant pliée à 90° devant toi, jambe arrière pliée à 90° sur le côté (tibias verticalisés si possible). Change lentement de côté en basculant le bassin sans à-coups, en gardant chaque tibia aussi vertical que ton confort le permet. 4 à 6 échanges lents, qualité du mouvement prioritaire.",
    contraindications: ["Hanche dysplasique douloureuse"],
    variations: ["90 90 switch", "hanche 90 exchange"]
  },

  recup_jambes_au_mur_pompe_chevilles: {
    name: "Récupération — jambes au mur avec pompes de chevilles",
    category: "Récupération",
    bodyZone: "mollets",
    primaryMuscles: ["Soléaire", "Gastrocnémiens"],
    secondaryMuscles: ["Retour veineux"],
    equipment: "Mur",
    defaultDuration: 180,
    position: "Allongé, hanches près du mur",
    difficulty: 1,
    description:
      "Associe l’inversion douce (jambes surélevées) au pompage des mollets pour favoriser le retour veineux et soulager la lourdeur des jambes après longue station debout, chaleur ou course.",
    instructions:
      "Allonge-toi près du mur, fesses au contact ou très proches, jambes verticales contre le mur. Effectue 15 à 20 flexions plantaires lentes (orteils vers les tibias puis pointe vers le plafond). Repos 30 s. Répète 3 séries. Sors en roulant sur le côté pour éviter l’hypotension orthostatique.",
    contraindications: ["Hypertension sévère non stabilisée"],
    variations: ["legs up wall pumps", "jambes mur pompe"]
  },

  // ═══════════════════════════════════════════════════════════════════════
  // PLIOMÉTRIE (ajout demandé pour la banque)
  // ═══════════════════════════════════════════════════════════════════════
  pliometrie_sauts_sur_place_debutant: {
    name: "Pliométrie — sauts sur place débutant",
    category: "Pliométrie",
    bodyZone: "quadriceps",
    primaryMuscles: ["Quadriceps", "Mollets"],
    secondaryMuscles: ["Fessiers", "Core"],
    equipment: "Aucun",
    defaultDuration: 45,
    position: "Debout",
    difficulty: 1,
    description: "Introduction aux impacts légers pour apprendre l’atterrissage contrôlé.",
    instructions: "Réalise des petits sauts verticaux pieds largeur hanches. Atterris sur l’avant-pied puis talon, genoux souples, buste gainé.",
    contraindications: ["Douleur aiguë genou/cheville", "tendinopathie d'Achille active"],
    variations: ["petits sauts", "plyo beginner jumps"]
  },
  pliometrie_sauts_lateraux_ligne: {
    name: "Pliométrie — sauts latéraux sur ligne",
    category: "Pliométrie",
    bodyZone: "full",
    primaryMuscles: ["Mollets", "Quadriceps"],
    secondaryMuscles: ["Fessiers", "Adducteurs", "Core"],
    equipment: "Aucun",
    defaultDuration: 50,
    position: "Debout",
    difficulty: 1,
    description: "Travaille coordination latérale et réactivité avec faible amplitude.",
    instructions: "Saute de gauche à droite d’une ligne imaginaire avec des appuis courts et stables. Garde le regard devant.",
    contraindications: ["Entorse récente", "instabilité latérale du genou"],
    variations: ["line hops", "sauts latéraux", "Lateral Line Hops"]
  },
  pliometrie_squat_jumps_controles: {
    name: "Pliométrie — squat jumps contrôlés",
    category: "Pliométrie",
    bodyZone: "quadriceps",
    primaryMuscles: ["Quadriceps", "Fessiers"],
    secondaryMuscles: ["Mollets", "Core"],
    equipment: "Aucun",
    defaultDuration: 50,
    position: "Debout",
    difficulty: 2,
    description: "Développe puissance verticale avec accent sur la technique d’atterrissage.",
    instructions: "Descends en demi-squat, explose vers le haut puis atterris doucement en absorbant avec hanches et genoux.",
    contraindications: ["Douleur fémoro-patellaire marquée"],
    variations: ["jump squat", "squat jump", "Squat Jump"]
  },
  pliometrie_fentes_sautes_alternees: {
    name: "Pliométrie — fentes sautées alternées",
    category: "Pliométrie",
    bodyZone: "quadriceps",
    primaryMuscles: ["Quadriceps", "Fessiers"],
    secondaryMuscles: ["Mollets", "Ischio-jambiers"],
    equipment: "Aucun",
    defaultDuration: 60,
    position: "Debout en fente",
    difficulty: 2,
    description: "Renforce la puissance unilatérale et la stabilité dynamique.",
    instructions: "Depuis la fente, saute et inverse les jambes en l’air. Atterris genou avant aligné avec pied avant.",
    contraindications: ["Instabilité ligamentaire genou", "douleur hanche"],
    variations: ["jump lunges", "fentes plyo"]
  },
  pliometrie_skater_jumps: {
    name: "Pliométrie — skater jumps",
    category: "Pliométrie",
    bodyZone: "fessiers",
    primaryMuscles: ["Fessiers", "Quadriceps"],
    secondaryMuscles: ["Mollets", "Adducteurs", "Core"],
    equipment: "Aucun",
    defaultDuration: 60,
    position: "Debout",
    difficulty: 2,
    description: "Travail de puissance latérale et contrôle du bassin.",
    instructions: "Saute latéralement d’une jambe à l’autre en cherchant un atterrissage stable 1 seconde.",
    contraindications: ["Syndrome de bandelette ilio-tibiale inflammatoire"],
    variations: ["patineur", "skater hop"]
  },
  pliometrie_tuck_jumps: {
    name: "Pliométrie — tuck jumps",
    category: "Pliométrie",
    bodyZone: "full",
    primaryMuscles: ["Quadriceps", "Mollets"],
    secondaryMuscles: ["Fessiers", "Abdominaux"],
    equipment: "Aucun",
    defaultDuration: 45,
    position: "Debout",
    difficulty: 3,
    description: "Exercice explosif avec montée de genoux pour puissance et gainage.",
    instructions: "Saute verticalement en montant les genoux vers la poitrine, puis atterris souplement et repars après stabilisation.",
    contraindications: ["Lombalgie active", "surcharge rotulienne"],
    variations: ["knee tuck jump", "saut groupé", "Tuck Jump"]
  },
  pliometrie_box_jump_bas: {
    name: "Pliométrie — box jump bas",
    category: "Pliométrie",
    bodyZone: "quadriceps",
    primaryMuscles: ["Quadriceps", "Fessiers"],
    secondaryMuscles: ["Mollets", "Core"],
    equipment: "Banc / box plyo",
    defaultDuration: 50,
    position: "Debout face à box",
    difficulty: 2,
    description: "Puissance concentrique vers un support bas avec impact réduit.",
    instructions: "Saute sur un support bas, atterris en demi-squat stable, redescends en marchant.",
    contraindications: ["Peur du saut non maîtrisée", "douleur tendon rotulien"],
    variations: ["box jump beginner", "saut sur box", "Box Jump"]
  },
  pliometrie_depth_drop: {
    name: "Pliométrie — depth drop (réception)",
    category: "Pliométrie",
    bodyZone: "full",
    primaryMuscles: ["Quadriceps", "Fessiers"],
    secondaryMuscles: ["Mollets", "Ischio-jambiers", "Core"],
    equipment: "Banc / box plyo",
    defaultDuration: 40,
    position: "Debout sur box",
    difficulty: 3,
    description: "Apprentissage de la réception mécanique avant les depth jumps.",
    instructions: "Descends en laissant tomber les deux pieds au sol et absorbe immédiatement en position athlétique.",
    contraindications: ["Douleur à l’impact", "antécédent rupture LCA non rééduqué"],
    variations: ["drop landing", "réception plyo"]
  },
  pliometrie_depth_jump_rebond: {
    name: "Pliométrie — depth jump + rebond",
    category: "Pliométrie",
    bodyZone: "full",
    primaryMuscles: ["Quadriceps", "Mollets"],
    secondaryMuscles: ["Fessiers", "Core"],
    equipment: "Banc / box plyo",
    defaultDuration: 40,
    position: "Debout sur box",
    difficulty: 4,
    description: "Cycle étirement-raccourcissement avancé pour réactivité maximale.",
    instructions: "Laisse-toi tomber d’une box basse puis enchaîne un rebond vertical immédiat avec temps de contact minimal.",
    contraindications: ["Débutant", "douleurs articulaires aux impacts"],
    variations: ["depth jump", "drop jump", "Depth Jump"]
  },
  pliometrie_broad_jump: {
    name: "Pliométrie — broad jump (saut horizontal)",
    category: "Pliométrie",
    bodyZone: "fessiers",
    primaryMuscles: ["Fessiers", "Quadriceps"],
    secondaryMuscles: ["Mollets", "Ischio-jambiers"],
    equipment: "Aucun",
    defaultDuration: 45,
    position: "Debout",
    difficulty: 2,
    description: "Puissance horizontale utile aux accélérations et changements d’allure.",
    instructions: "Projette les bras, saute loin devant, atterris stable en demi-squat et tiens 1 seconde.",
    contraindications: ["Douleur pubienne / adducteurs aiguë"],
    variations: ["standing broad jump", "saut en longueur sans élan", "Broad Jump"]
  },
  pliometrie_bounds_alternes: {
    name: "Pliométrie — bounds alternés",
    category: "Pliométrie",
    bodyZone: "full",
    primaryMuscles: ["Fessiers", "Ischio-jambiers"],
    secondaryMuscles: ["Mollets", "Quadriceps", "Core"],
    equipment: "Aucun",
    defaultDuration: 60,
    position: "Course bondissante",
    difficulty: 3,
    description: "Développe la foulée bondissante et la puissance unilatérale dynamique.",
    instructions: "Réalise de grands bonds alternés en avançant, avec gainage et pose active sous le centre de masse.",
    contraindications: ["Lésion ischio récente", "tendinite Achille non contrôlée"],
    variations: ["bounding", "foulées bondissantes", "Bounding", "Power Skip"]
  },
  pliometrie_hop_unipodal: {
    name: "Pliométrie — hops unipodaux",
    category: "Pliométrie",
    bodyZone: "mollets",
    primaryMuscles: ["Mollets", "Quadriceps"],
    secondaryMuscles: ["Fessiers", "Stabilisateurs de cheville"],
    equipment: "Aucun",
    defaultDuration: 40,
    position: "Debout un pied",
    difficulty: 3,
    description: "Renforce la rigidité cheville-pied et le contrôle unilatéral.",
    instructions: "Effectue des petits rebonds sur un pied, bassin stable, puis change de jambe.",
    contraindications: ["Instabilité cheville non rééduquée"],
    variations: ["single leg hops", "rebonds unipodaux"]
  },
  pliometrie_pogo_jumps: {
    name: "Pliométrie — pogo jumps",
    category: "Pliométrie",
    bodyZone: "mollets",
    primaryMuscles: ["Mollets"],
    secondaryMuscles: ["Quadriceps", "Tendon d'Achille"],
    equipment: "Aucun",
    defaultDuration: 35,
    position: "Debout jambes tendues souples",
    difficulty: 2,
    description: "Travail de rebond court orienté cheville.",
    instructions: "Réalise des rebonds rapides à faible amplitude, genoux quasi tendus, buste droit.",
    contraindications: ["Achillodynie active"],
    variations: ["ankle hops", "pogos", "Pogo Jumps"]
  },
  pliometrie_sauts_haie_basse: {
    name: "Pliométrie — sauts de haie basse",
    category: "Pliométrie",
    bodyZone: "quadriceps",
    primaryMuscles: ["Quadriceps", "Mollets"],
    secondaryMuscles: ["Fessiers", "Core"],
    equipment: "Plots / haies basses",
    defaultDuration: 50,
    position: "Debout",
    difficulty: 3,
    description: "Améliore rythme, coordination et réactivité au sol.",
    instructions: "Enchaîne des sauts au-dessus de petites haies, réception active et regard loin.",
    contraindications: ["Douleur méniscale", "peur du franchissement non gérée"],
    variations: ["hurdle hops", "haies basses plyo"]
  },
  pliometrie_push_up_pliometrique_murs: {
    name: "Pliométrie haut du corps — pompes explosives au mur",
    category: "Pliométrie",
    bodyZone: "poitrine",
    primaryMuscles: ["Pectoraux", "Triceps"],
    secondaryMuscles: ["Deltoïdes antérieurs", "Core"],
    equipment: "Mur",
    defaultDuration: 45,
    position: "Debout incliné contre mur",
    difficulty: 1,
    description: "Version accessible de plyométrie du haut du corps.",
    instructions: "Pompe contre mur avec poussée explosive pour décoller légèrement les mains, puis réception contrôlée.",
    contraindications: ["Douleur épaule antérieure"],
    variations: ["wall plyo push-up", "pompes explosives mur"]
  },
  pliometrie_push_up_pliometrique_sol: {
    name: "Pliométrie haut du corps — pompes pliométriques sol",
    category: "Pliométrie",
    bodyZone: "poitrine",
    primaryMuscles: ["Pectoraux", "Triceps"],
    secondaryMuscles: ["Deltoïdes antérieurs", "Core"],
    equipment: "Aucun",
    defaultDuration: 40,
    position: "Planche au sol",
    difficulty: 3,
    description: "Développe explosivité de poussée horizontale.",
    instructions: "Depuis la pompe, pousse fort pour décoller les mains. Réceptionne coudes souples et tronc gainé.",
    contraindications: ["Poignet douloureux", "instabilité épaule"],
    variations: ["plyo push-up", "clap push-up progression", "Explosive Push-Up", "Clap Push-Up"]
  },
  pliometrie_medecine_ball_slam: {
    name: "Pliométrie — medicine ball slam",
    category: "Pliométrie",
    bodyZone: "tronc",
    primaryMuscles: ["Grand dorsal", "Abdominaux"],
    secondaryMuscles: ["Épaules", "Fessiers"],
    equipment: "Medecine ball",
    defaultDuration: 45,
    position: "Debout",
    difficulty: 2,
    description: "Transfert de puissance du haut vers le bas avec coordination globale.",
    instructions: "Monte le ballon au-dessus de la tête puis claque-le au sol avec engagement du tronc.",
    contraindications: ["Lombalgie aiguë"],
    variations: ["ball slam", "slam medball", "Medicine Ball Slam"]
  },
  pliometrie_medecine_ball_chest_pass: {
    name: "Pliométrie — medicine ball chest pass",
    category: "Pliométrie",
    bodyZone: "poitrine",
    primaryMuscles: ["Pectoraux", "Triceps"],
    secondaryMuscles: ["Deltoïdes antérieurs", "Core"],
    equipment: "Medecine ball + mur",
    defaultDuration: 45,
    position: "Debout face au mur",
    difficulty: 2,
    description: "Travail explosif de poussée horizontale du haut du corps.",
    instructions: "Lance le medball au mur depuis la poitrine de façon explosive puis récupère en amortissant.",
    contraindications: ["Douleur coude / épaule"],
    variations: ["chest throw", "lancer poitrine medball", "Medicine Ball Chest Pass"]
  },
  pliometrie_sauts_rotation_90: {
    name: "Pliométrie — sauts rotation 90°",
    category: "Pliométrie",
    bodyZone: "full",
    primaryMuscles: ["Quadriceps", "Fessiers"],
    secondaryMuscles: ["Mollets", "Obliques"],
    equipment: "Aucun",
    defaultDuration: 45,
    position: "Debout",
    difficulty: 2,
    description: "Ajoute une composante de rotation et d’orientation spatiale.",
    instructions: "Saute puis pivote de 90°, réceptionne stable, enchaîne vers la nouvelle direction.",
    contraindications: ["Vertiges", "douleur lombaire rotation"],
    variations: ["quarter turn jumps", "sauts pivot"]
  },
  pliometrie_split_squat_jump: {
    name: "Pliométrie — split squat jump",
    category: "Pliométrie",
    bodyZone: "quadriceps",
    primaryMuscles: ["Quadriceps", "Fessiers"],
    secondaryMuscles: ["Mollets", "Ischio-jambiers", "Core"],
    equipment: "Aucun",
    defaultDuration: 50,
    position: "Fente statique",
    difficulty: 3,
    description: "Puissance verticale unilatérale avec maintien d’alignement.",
    instructions: "En position fente, saute verticalement sans forcément changer de jambe, puis absorbe en fente.",
    contraindications: ["Douleur patellaire", "déséquilibre marqué"],
    variations: ["split jump", "jump split squat"]
  },
  pliometrie_rebonds_multidirectionnels: {
    name: "Pliométrie — rebonds multidirectionnels",
    category: "Pliométrie",
    bodyZone: "full",
    primaryMuscles: ["Quadriceps", "Mollets", "Fessiers"],
    secondaryMuscles: ["Adducteurs", "Abducteurs", "Core"],
    equipment: "Plots",
    defaultDuration: 60,
    position: "Debout",
    difficulty: 4,
    description: "Réactivité avancée dans plusieurs plans de déplacement.",
    instructions: "Enchaîne des rebonds courts vers l’avant, arrière et côtés entre plots, avec contrôle postural.",
    contraindications: ["Instabilité chronique cheville/genou"],
    variations: ["reactive hops", "plyo multidirectionnel"]
  },

  ...mobilityStretchCatalog,
  ...stretchDrillsCatalog
};

// ═══════════════════════════════════════════════════════════════════════
// HELPERS DE RECHERCHE & CATÉGORISATION
// ═══════════════════════════════════════════════════════════════════════

/**
 * Liste des catégories disponibles (pour les filtres UI).
 */
export const STRETCH_CATEGORIES = [
  "Respiration",
  "Mobilité",
  "Mobilité genoux",
  "Mobilité hanches",
  "Mobilité bassin",
  "Mobilité chevilles",
  "Mobilité cervicales",
  "Étirement passif",
  "Étirement actif",
  "Décompression",
  "Posture",
  "Auto-massage",
  "Yoga / Postures",
  "Récupération",
  "Pliométrie",
  "Drills course"
];

/**
 * Liste des zones corporelles (pour les filtres UI).
 */
export const STRETCH_BODY_ZONES = [
  "cou",
  "épaules",
  "thoracique",
  "dos",
  "lombaires",
  "poitrine",
  "bras",
  "hanches",
  "fessiers",
  "ischios",
  "quadriceps",
  "mollets",
  "tronc",
  "respiration",
  "full"
];

/**
 * Synonymes pour la recherche tolérante : taper "dos" matchera tous les étirements
 * dont les muscles, la zone ou les variations contiennent ces termes.
 *
 * Format : { motTapéParUtilisateur: [termes à chercher en plus] }
 */
export const STRETCH_QUERY_SYNONYMS = {
  dos: ["grand dorsal", "rhomboïdes", "trapèze", "lombaires", "érecteurs", "multifides", "rachis"],
  hanche: ["psoas", "psoas-iliaque", "fléchisseurs de hanche", "ischio", "fessier", "piriforme", "adducteurs"],
  hanches: ["psoas", "psoas-iliaque", "fléchisseurs de hanche", "ischio", "fessier", "piriforme", "adducteurs"],
  cou: ["cervical", "trapèze", "sterno-cléido-mastoïdien", "scm", "splénius", "sub-occipitaux"],
  nuque: ["cervical", "sub-occipitaux", "splénius"],
  épaule: ["scapulaire", "scapula", "deltoïde", "coiffe des rotateurs", "trapèze"],
  épaules: ["scapulaire", "scapula", "deltoïde", "coiffe des rotateurs", "trapèze"],
  jambe: ["quadriceps", "ischio-jambiers", "mollets", "soléaire", "gastrocnémiens"],
  jambes: ["quadriceps", "ischio-jambiers", "mollets", "soléaire", "gastrocnémiens"],
  poitrine: ["pectoraux", "petit pectoral", "sterno"],
  pectoraux: ["poitrine", "pec", "petit pectoral"],
  pec: ["pectoraux", "poitrine"],
  fessier: ["grand fessier", "moyen fessier", "piriforme"],
  fesses: ["grand fessier", "moyen fessier", "piriforme"],
  ischios: ["ischio-jambiers", "biceps fémoral", "semi-tendineux", "semi-membraneux"],
  cuisse: ["quadriceps", "ischio-jambiers", "adducteurs"],
  cuisses: ["quadriceps", "ischio-jambiers", "adducteurs"],
  mollet: ["gastrocnémiens", "soléaire", "tibial"],
  mollets: ["gastrocnémiens", "soléaire", "tibial"],
  respi: ["respiration", "diaphragme", "souffle", "pranayama", "cohérence cardiaque"],
  respiration: ["diaphragme", "souffle", "pranayama"],
  souffle: ["respiration", "diaphragme", "pranayama"],
  yoga: ["asana", "posture", "pranayama"],
  posture: ["alignement", "axiale", "verticalité"],
  stress: ["parasympathique", "relaxation", "respiration", "méditation"],
  sommeil: ["récupération", "parasympathique", "respiration"],
  récup: ["récupération", "parasympathique", "drainage"],
  récupération: ["parasympathique", "drainage", "veineux"],
  drill: ["drills course", "skip", "sprint", "coordination", "pliométrie"],
  skip: ["a-skip", "b-skip", "c-skip", "marching"],
  plio: ["pliométrie", "plyometric", "saut", "explosif", "bound", "pogo"]
};

/**
 * Normalise une chaîne pour la recherche (supprime accents, lower-case).
 */
function normalize(str) {
  return String(str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Échappe une chaîne pour usage dans un RegExp littéral.
 */
function escapeForRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Filtre la banque par requête textuelle, avec expansion par synonymes.
 *
 * Stratégie de matching (par ordre de priorité) :
 *   1. La requête fait partie des **zones corporelles** ou des **catégories** déclarées →
 *      on filtre uniquement par bodyZone / category (matching exact).
 *   2. Sinon, on cherche le terme (et ses synonymes) avec **frontière de mot**
 *      dans : name, category, bodyZone, primaryMuscles, secondaryMuscles, variations, clé.
 *      On exclut `description`, `instructions`, `position`, `equipment` pour éviter les
 *      faux positifs ("dos droit" mentionné dans les instructions ≠ étirement du dos).
 *
 * @param {string} query - Requête utilisateur (ex. "dos", "psoas", "respi", "Yoga")
 * @param {Object} db - Base à filtrer (défaut : stretchDatabase)
 * @returns {Array} Tableau d'objets { key, ...stretch } correspondants
 */
export function searchStretches(query, db = stretchDatabase) {
  const q = normalize(query).trim();
  if (!q) {
    return Object.entries(db).map(([key, value]) => ({ key, ...value }));
  }

  const normalizedZones = STRETCH_BODY_ZONES.map(normalize);
  const normalizedCategories = STRETCH_CATEGORIES.map(normalize);

  if (normalizedZones.includes(q)) {
    return Object.entries(db)
      .filter(([, value]) => normalize(value.bodyZone) === q)
      .map(([key, value]) => ({ key, ...value }));
  }
  if (normalizedCategories.includes(q)) {
    return Object.entries(db)
      .filter(([, value]) => normalize(value.category) === q)
      .map(([key, value]) => ({ key, ...value }));
  }

  // 2. Recherche frontière-de-mot avec synonymes, sur les champs sémantiques
  //    (on évite description / instructions pour ne pas matcher du français de remplissage).
  const expandedTerms = [q, ...(STRETCH_QUERY_SYNONYMS[q] || []).map(normalize)];
  const regexes = expandedTerms.map((term) => new RegExp(`\\b${escapeForRegex(term)}`, "i"));

  return Object.entries(db)
    .filter(([key, value]) => {
      const fields = [
        value.name,
        value.category,
        value.bodyZone,
        ...(value.primaryMuscles || []),
        ...(value.secondaryMuscles || []),
        ...(value.variations || []),
        key
      ]
        .filter(Boolean)
        .map(normalize);

      return regexes.some((rx) => fields.some((f) => rx.test(f)));
    })
    .map(([key, value]) => ({ key, ...value }));
}

/**
 * Récupère un étirement par sa clé (ID stable utilisée dans les programmes).
 */
export function getStretchByKey(key) {
  if (!key) return null;
  return stretchDatabase[key] || null;
}

/**
 * Liste la banque sous forme de tableau (utile pour les pickers).
 */
export function listStretches(db = stretchDatabase) {
  return Object.entries(db).map(([key, value]) => ({ key, ...value }));
}
