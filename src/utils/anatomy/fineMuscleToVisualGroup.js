/**
 * Libellés fins (FR, typo tolerant) → id de groupe visuel canonique (`MuscleGroups`).
 * Retourne null si aucune zone maillée (disques, système nerveux, etc.).
 */
import { MuscleGroups } from '../../data/workoutProgramEnhanced';

const G = MuscleGroups;

export function normalizeMuscleLabel(raw) {
  return String(raw || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .toLowerCase()
    /** Apostrophe typographique (U+2019) comme l’ASCII : indispensable pour matcher « Grand droit de l'abdomen ». */
    .replace(/\u2019/g, "'")
    .replace(/['']/g, ' ')
    .replace(/[()[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Correspondances exactes après `normalizeMuscleLabel`. Compléter au fil des trous signalés. */
const EXACT_TO_GROUP = {
  // Chest
  pectoraux: G.CHEST,
  'pectoral': G.CHEST,
  'petit pectoral': G.CHEST,
  'pectoral superieur': G.CHEST,
  'pectoral inferieur': G.CHEST,
  core: G.CORE,
  gainage: G.CORE,
  'gainage tronc': G.CORE,
  'abdos': G.CORE,
  'grand droit de l abdomen': G.CORE,
  'grand droit de labdomen': G.CORE,
  'grand droit abdominal': G.CORE,
  'transverse de l abdomen': G.CORE,
  'transverse labdomen': G.CORE,
  'transverse': G.CORE,
  obliques: G.CORE,
  'oblique': G.CORE,
  // Back
  'grand dorsal': G.BACK,
  'grands dorsaux': G.BACK,
  rhomboides: G.BACK,
  rhomboid: G.BACK,
  'trapezes moyens': G.BACK,
  'trapeze moyen': G.BACK,
  'trapezes inferieurs': G.BACK,
  'trapeze inferieur': G.BACK,
  'erecteurs du rachis': G.BACK,
  'erecteur du rachis': G.BACK,
  'rachis lombaire': G.BACK,
  lombaires: G.BACK,
  multifides: G.BACK,
  multifide: G.BACK,
  'multifides lombaires': G.BACK,
  'multifides thoraciques': G.BACK,
  'dentele anterieur': G.CHEST,
  'dentele posterieur': G.BACK,
  infraepineux: G.SHOULDERS,
  'petit rond': G.SHOULDERS,
  'grand rond': G.BACK,
  // Shoulders / traps
  deltoides: G.SHOULDERS,
  'deltoides anterieurs': G.SHOULDERS,
  'deltoides posterieurs': G.SHOULDERS,
  'deltoides moyens': G.SHOULDERS,
  deltoide: G.SHOULDERS,
  'trapezes superieurs': G.SHOULDERS,
  'trapeze superieur': G.SHOULDERS,
  'elevateurs de la scapula': G.SHOULDERS,
  trapezes: G.SHOULDERS,
  trapeze: G.SHOULDERS,
  // Arms
  triceps: G.TRICEPS,
  'triceps brachial': G.TRICEPS,
  biceps: G.BICEPS,
  'biceps brachial': G.BICEPS,
  'biceps brachii': G.BICEPS,
  'brachial anterieur': G.BICEPS,
  'brachio-radial': G.BICEPS,
  'avant-bras': G.BICEPS,
  avantbras: G.BICEPS,
  /** Banque étirements : libellé agrégé avant-bras */
  'extenseurs / flechisseurs': G.BICEPS,
  'extenseurs/flechisseurs': G.BICEPS,
  'fascia interosseux': G.BICEPS,
  // Legs
  quadriceps: G.QUADS,
  'quadriceps (vastes)': G.QUADS,
  'vaste medial': G.QUADS,
  'vaste lateral': G.QUADS,
  'droit femoral': G.QUADS,
  'psoas-iliaque': G.QUADS,
  flechisseurs: G.QUADS,
  'flechisseurs de hanche': G.QUADS,
  'ischio-jambiers': G.HAMSTRINGS,
  ischiojambiers: G.HAMSTRINGS,
  fessiers: G.HAMSTRINGS,
  'fessiers moyens': G.HAMSTRINGS,
  'moyen fessier': G.HAMSTRINGS,
  mollets: G.CALVES,
  'gastrocnemiens': G.CALVES,
  gastrocnemien: G.CALVES,
  soleaire: G.CALVES,
  'tibial anterieur': G.TIBIALIS_ANTERIOR,
  tibial: G.TIBIALIS_ANTERIOR,
  adducteurs: G.QUADS,
  'ischio': G.HAMSTRINGS,
  diaphragme: G.CORE,
  intercostaux: G.CORE,
  /** Libellés « système cardio » : éviter FULL_BODY au secondaire (efface les surbrillances zonales). */
  'systeme cardio respiratoire': G.CORE,
  'systeme cardio-respiratoire': G.CORE,
  'systeme cardiorespiratoire': G.CORE,
  // Generique programme
  jambes: G.QUADS,
  bras: G.BICEPS,
  'corps entier': G.FULL_BODY,
  'full body': G.FULL_BODY,
  'full-body': G.FULL_BODY,
  'pied (intrinseques)': G.CALVES,
  mollet: G.CALVES,
  // Cou / cervical (pas de mesh — fallback utile: trapèzes / dos)
  'sterno-cleido-mastoidien': G.SHOULDERS,
  'sterno cleido mastoidien': G.SHOULDERS,
  scalenes: G.SHOULDERS,
  'scalene': G.SHOULDERS,
  'cervicaux profonds': G.BACK,
  'long flechisseur du cou': G.SHOULDERS,
  'long de la tete': G.SHOULDERS,
  'sub-occipitaux': G.BACK,
  'rotateurs de la scapula': G.SHOULDERS,
  'capsule articulaire de l epaule': G.SHOULDERS,
  'rotateurs externes': G.SHOULDERS,
  'vertèbres thoraciques': G.BACK,
  'disques cervicaux': G.BACK,
  "disques": null,
  /** Méditation / scan : pas de mesh dédié → corps entier teinté comme zone primaire */
  'systeme nerveux autonome': G.FULL_BODY,
  'systeme nerveux': G.FULL_BODY,
  'conscience proprioceptive': G.FULL_BODY,
};

/**
 * Heuristiques si pas d’entrée exacte : le premier motif qui matche gagne.
 * @type {{ re: RegExp, group: string | null }[]}
 */
const PATTERN_RULES = [
  { re: /pectoral|pec(?!toral)|chest/i, group: G.CHEST },
  { re: /grand dorsal|dorsal|dorsaux|latissimus|rowing|tirage/i, group: G.BACK },
  { re: /rhombo|érecteur|erecteur|infra-?épineux|infra-?spinatus|rachis|lombaire|multifide/i, group: G.BACK },
  { re: /deltoid|deltoides|epaule|épaule|shoulder|trapeze|trapèze|elevateur|élevateur|scapul|sterno|mastoid|scalen/i, group: G.SHOULDERS },
  { re: /triceps/i, group: G.TRICEPS },
  { re: /biceps|brachial|brachio|radian|avant[- ]?bras|poignet/i, group: G.BICEPS },
  /** Avant quadri : ischio / fessiers pour ne pas classer « ischio-jambiers » en quadriceps. */
  { re: /ischio[- ]?jamb|ischium|hamstring|arrière de cuisse/i, group: G.HAMSTRINGS },
  { re: /glute|fessier/i, group: G.HAMSTRINGS },
  { re: /quadri|vaste|droit f[eé]moral|femoral|psoas|adduct/i, group: G.QUADS },
  { re: /mollet|gastroc|soleaire|soléaire|surae|calf/i, group: G.CALVES },
  { re: /tibial(?!is)|peronier|perrone/i, group: G.TIBIALIS_ANTERIOR },
  { re: /abdom|oblique|transverse|core|gainage|respir|diaphragme|planche/i, group: G.CORE },
  { re: /corps entier|full body|complet|body scan|scan corporel/i, group: G.FULL_BODY },
  { re: /disque|capsule|articulation genou|^genou$/i, group: null }
];

export function mapFineMuscleLabelToVisualGroup(label) {
  const norm = normalizeMuscleLabel(label);
  if (!norm) return null;

  if (Object.prototype.hasOwnProperty.call(EXACT_TO_GROUP, norm)) {
    return EXACT_TO_GROUP[norm];
  }
  const squish = norm.replace(/\s+/g, '');
  if (Object.prototype.hasOwnProperty.call(EXACT_TO_GROUP, squish)) {
    return EXACT_TO_GROUP[squish];
  }

  for (const { re, group } of PATTERN_RULES) {
    if (re.test(label) || re.test(norm)) return group;
  }
  return null;
}

export function resolveVisualGroupsFromLabels(primaryList, secondaryList) {
  const primary = new Set();
  const secondary = new Set();
  const unmapped = [];

  (Array.isArray(primaryList) ? primaryList : []).forEach((s) => {
    const id = mapFineMuscleLabelToVisualGroup(s);
    if (id) primary.add(id);
    else if (String(s || '').trim()) unmapped.push(String(s).trim());
  });
  (Array.isArray(secondaryList) ? secondaryList : []).forEach((s) => {
    const id = mapFineMuscleLabelToVisualGroup(s);
    if (id) secondary.add(id);
    else if (String(s || '').trim()) unmapped.push(String(s).trim());
  });

  return { primaryIds: primary, secondaryIds: secondary, unmappedLabels: [...new Set(unmapped)] };
}
