/**
 * Phase matching : propositions uniquement.
 * N'écrit rien dans Momentum. finalStatus reste PENDING_REVIEW.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const REPO = path.resolve(ROOT, '..');

const EXCLUSIVE = new Set([
  'dumbbell', 'barbell', 'cable', 'machine', 'bodyweight', 'band', 'kettlebell',
  'smith', 'ez', 'landmine', 'rings', 'sled', 'medicineball', 'stabilityball'
]);
const MUSCLE = new Set([
  'biceps', 'triceps', 'chest', 'back', 'shoulder', 'quad', 'hamstring', 'glute',
  'calf', 'abs', 'forearm', 'lat'
]);
const STOP = new Set([
  'a', 'an', 'the', 'of', 'to', 'and', 'with', 'on', 'for', 'au', 'aux', 'de', 'des',
  'du', 'la', 'le', 'les', 'un', 'une', 'et', 'en', 'sur', 'avec', 'dans', 'par',
  'vers', 'prise', 'grip', 'style', 'using', 'use', 'son', 'sa', 'ses',
  'banc', 'bench', 'chaise', 'sol', 'support', 'rack', 'tapis', 'mur', 'wall', 'floor', 'chair'
]);
const NOISE = new Set([
  'male', 'female', 'pov', 'side', 'version', 'animated', 'exercise', 'exercices', 'demo',
  'positionnement', 'positionnemuent', 'placement',
  'poignee', 'poignees', 'parallele', 'paralleles', 'vis'
]);
const SPECIFIC_SINGLE = new Set(['hipthrust', 'legcurl', 'legpress', 'legextension', 'goodmorning', 'lsit', 'pulldown', 'pushup', 'pullup', 'deadlift']);

const PHRASES = [
  [/incline bench press/g, ' press incline '],
  [/decline bench press/g, ' press decline '],
  [/dumbbell bench press/g, ' press flatbench dumbbell '],
  [/barbell bench press/g, ' press flatbench barbell '],
  [/bench press/g, ' press flatbench '],
  [/developpe couche/g, ' press flatbench '],
  [/developpe incline/g, ' press incline '],
  [/developpe decline/g, ' press decline '],
  [/developpe militaire/g, ' press overhead '],
  [/military press/g, ' press overhead '],
  [/overhead press/g, ' press overhead '],
  [/shoulder press/g, ' press overhead '],
  [/lat pulldown/g, ' pulldown '],
  [/tirage vertical/g, ' pulldown '],
  [/straight arm pulldown/g, ' pulldown '],
  [/pull ups/g, ' pullup '],
  [/pull up/g, ' pullup '],
  [/push ups/g, ' pushup '],
  [/push up/g, ' pushup '],
  [/chin ups/g, ' chinup '],
  [/chin up/g, ' chinup '],
  [/hip thrust/g, ' hipthrust '],
  [/leg curls/g, ' legcurl '],
  [/leg curl/g, ' legcurl '],
  [/leg press/g, ' legpress '],
  [/leg extension/g, ' legextension '],
  [/good morning/g, ' goodmorning '],
  [/l sit/g, ' lsit '],
  [/inverted row/g, ' australian row '],
  [/australian pull up/g, ' australian row '],
  [/australian chin up/g, ' australian row chinup '],
  [/tractions australiennes/g, ' australian row '],
  [/traction australienne/g, ' australian row '],
  [/biceps curl/g, ' curl biceps '],
  [/hammer curl/g, ' curl hammer '],
  [/preacher curl/g, ' curl preacher '],
  [/barbell curl/g, ' curl barbell '],
  [/dumbbell curl/g, ' curl dumbbell '],
  [/barre de traction/g, ' '],
  [/vis a vis/g, ' '],
  [/extension mollets/g, ' calf '],
  [/extension mollet/g, ' calf '],
  [/pec fly/g, ' fly chest cable '],
  [/pecs a la poulie/g, ' fly chest cable '],
  [/barre basse/g, ' barbell '],
  [/ez bar curl/g, ' curl ez '],
  [/close grip/g, ' close '],
  [/wide grip/g, ' wide '],
  [/one arm/g, ' unilateral '],
  [/single arm/g, ' unilateral '],
  [/poids du corps/g, ' bodyweight '],
  [/body weight/g, ' bodyweight '],
  [/bodyweight/g, ' bodyweight '],
  [/barre ez/g, ' ez '],
  [/ez barbell/g, ' ez '],
  [/ez bar/g, ' ez '],
  [/poulie basse/g, ' cable '],
  [/poulie haute/g, ' cable '],
  [/rear delt fly/g, ' reardelt '],
  [/reverse fly/g, ' reardelt ']
];

const TOKEN = {
  pompe: 'pushup', pompes: 'pushup', pushup: 'pushup', pushups: 'pushup',
  developpe: 'press', presse: 'press', press: 'press',
  couche: 'flatbench', flatbench: 'flatbench',
  incline: 'incline', inclinee: 'incline', inclinees: 'incline',
  decline: 'decline', declinee: 'decline', declinees: 'decline',
  explosif: 'explosive', explosifs: 'explosive', explosive: 'explosive', explosives: 'explosive',
  archer: 'archer', commando: 'commando', typewriter: 'typewriter', scapulaire: 'scapular', scapulaires: 'scapular',
  militaire: 'overhead', overhead: 'overhead',
  squat: 'squat', squats: 'squat',
  fente: 'lunge', fentes: 'lunge', lunge: 'lunge', lunges: 'lunge',
  traction: 'pullup', tractions: 'pullup', pullup: 'pullup', pullups: 'pullup',
  chinup: 'chinup', chinups: 'chinup',
  rowing: 'row', row: 'row',
  haltere: 'dumbbell', halteres: 'dumbbell', dumbbell: 'dumbbell', dumbbells: 'dumbbell', db: 'dumbbell',
  barre: 'barbell', barbell: 'barbell',
  ez: 'ez',
  cable: 'cable', poulie: 'cable',
  smith: 'smith',
  machine: 'machine', lever: 'machine', leverage: 'machine',
  kettlebell: 'kettlebell',
  elastique: 'band', bande: 'band', band: 'band',
  bodyweight: 'bodyweight',
  assis: 'seated', seated: 'seated',
  debout: 'standing', standing: 'standing',
  allonge: 'lying', lying: 'lying',
  marteau: 'hammer', hammer: 'hammer',
  pupitre: 'preacher', preacher: 'preacher',
  oiseau: 'reardelt', oiseaux: 'reardelt', reardelt: 'reardelt',
  lateral: 'lateral', laterale: 'lateral', laterales: 'lateral',
  frontal: 'front', frontale: 'front', frontales: 'front', front: 'front',
  mollet: 'calf', mollets: 'calf', calf: 'calf', calves: 'calf',
  gastrocnemien: 'calf', gastrocnemiens: 'calf', soleaire: 'calf', soleaires: 'calf',
  biceps: 'biceps', triceps: 'triceps',
  ischio: 'hamstring', hamstring: 'hamstring', hamstrings: 'hamstring',
  fessier: 'glute', fessiers: 'glute', glute: 'glute', glutes: 'glute',
  ecarte: 'fly', ecartes: 'fly', fly: 'fly',
  pectoral: 'chest', pectoraux: 'chest', pectorals: 'chest', pec: 'chest', pecs: 'chest', chest: 'chest',
  dorsal: 'back', dorsaux: 'back', dos: 'back', back: 'back',
  epaule: 'shoulder', epaules: 'shoulder', shoulder: 'shoulder', shoulders: 'shoulder',
  deltoide: 'shoulder', delts: 'shoulder', deltoid: 'shoulder',
  abdo: 'abs', abdos: 'abs', abdominal: 'abs', abs: 'abs',
  pronation: 'pronated', pronated: 'pronated',
  supination: 'supinated', supinated: 'supinated',
  serree: 'close', serre: 'close', close: 'close',
  large: 'wide', wide: 'wide',
  neutre: 'neutral', neutral: 'neutral',
  australienne: 'australian', australiennes: 'australian', australian: 'australian', inverted: 'australian',
  unilatéral: 'unilateral', unilateral: 'unilateral',
  curl: 'curl', flexion: 'curl',
  extension: 'extension',
  elevation: 'raise', elevations: 'raise', raise: 'raise', raises: 'raise',
  shrug: 'shrug', shrugs: 'shrug', haussement: 'shrug', haussements: 'shrug',
  dip: 'dip', dips: 'dip',
  gainage: 'plank', plank: 'plank',
  hipthrust: 'hipthrust',
  deadlift: 'deadlift', souleve: 'deadlift',
  pulldown: 'pulldown',
  legcurl: 'legcurl', legpress: 'legpress', legextension: 'legextension',
  goodmorning: 'goodmorning', lsit: 'lsit',
  quad: 'quad', quadriceps: 'quad', quads: 'quad',
  forearm: 'forearm', avantbras: 'forearm',
  lat: 'lat', lats: 'lat',
  landmine: 'landmine',
  anneau: 'rings', anneaux: 'rings', rings: 'rings',
  sled: 'sled',
  gobelet: 'goblet', goblet: 'goblet',
  nordique: 'nordic', nordic: 'nordic',
  concentration: 'concentration',
  spider: 'spider',
  zottman: 'zottman',
  pistol: 'pistol',
  sissy: 'sissy',
  hack: 'hack',
  sumo: 'sumo',
  bulgare: 'bulgarian', bulgarian: 'bulgarian',
  pause: 'pause'
};

function norm(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/['’]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function foldKey(value) {
  return norm(value).split(' ').filter(Boolean).map((token) => {
    if (token === 'ups') return 'up';
    if (token.endsWith('s') && !token.endsWith('ss') && token.length > 3) return token.slice(0, -1);
    return token;
  }).join(' ');
}

function aliasSpecific(label) {
  const folded = foldKey(label);
  const tokens = folded.split(' ').filter(Boolean);
  if (tokens.length >= 2) return folded.length >= 8;
  return Boolean(tokens[0] && tokens[0].length >= 8);
}

function canonTokens(value) {
  let text = ` ${norm(value)} `;
  for (const [re, rep] of PHRASES) text = text.replace(re, rep);
  const out = [];
  for (const raw of text.split(' ').filter(Boolean)) {
    if (STOP.has(raw) || NOISE.has(raw)) continue;
    const tries = [raw];
    if (raw.endsWith('s')) tries.push(raw.slice(0, -1));
    if (raw.endsWith('es')) tries.push(raw.slice(0, -2));
    let mapped = raw;
    for (const candidate of tries) {
      if (TOKEN[candidate]) {
        mapped = TOKEN[candidate];
        break;
      }
    }
    if (STOP.has(mapped) || NOISE.has(mapped)) continue;
    out.push(mapped);
  }
  return [...new Set(out)];
}

function splitKinds(tokens) {
  const equipment = new Set();
  const muscle = new Set();
  const movement = new Set();
  for (const token of tokens) {
    if (EXCLUSIVE.has(token)) equipment.add(token);
    else if (MUSCLE.has(token)) muscle.add(token);
    else movement.add(token);
  }
  return { equipment, muscle, movement };
}

function setsEqual(a, b) {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

function movementEqual(mediaMove, mediaMuscle, exMove, exMuscle) {
  const left = new Set([...mediaMove, ...mediaMuscle].filter((token) => !EXCLUSIVE.has(token)));
  const right = new Set([...exMove, ...exMuscle].filter((token) => !EXCLUSIVE.has(token)));
  for (const token of [...left]) {
    if (MUSCLE.has(token) && exMuscle.has(token)) left.delete(token);
  }
  for (const token of [...right]) {
    if (MUSCLE.has(token) && mediaMuscle.has(token)) right.delete(token);
  }
  for (const token of [...left]) {
    if (MUSCLE.has(token) && !exMuscle.has(token)) return false;
  }
  for (const token of [...right]) {
    if (MUSCLE.has(token) && !mediaMuscle.has(token) && !mediaMove.has(token)) right.delete(token);
  }
  return setsEqual(left, right);
}

function equipmentRelation(mediaEq, exEq) {
  if (mediaEq.size === 0 && exEq.size === 0) return 'both_empty';
  if (mediaEq.size === 0 || exEq.size === 0) return 'one_empty';
  if (setsEqual(mediaEq, exEq)) return 'equal';
  const inter = [...mediaEq].filter((t) => exEq.has(t));
  if (inter.length === 0) return 'conflict';
  return 'partial';
}

function loadDatabase() {
  let src = fs.readFileSync(path.join(REPO, 'src/data/exerciseDatabase.js'), 'utf8');
  src = src.replace(/^import .*$/m, '');
  src = src.slice(0, src.indexOf('Object.assign'));
  src = src.replace('export const exerciseDatabase', 'const exerciseDatabase');
  src += '\nreturn exerciseDatabase;';
  return new Function(src)();
}

function loadScoring() {
  const dir = path.join(REPO, 'src/data/exerciseScoring');
  const entries = [];
  const re = /scoringEntry\(\s*(['"])([\s\S]*?)\1\s*,\s*['"](?:reps|seconds|minutes)['"]\s*,\s*[\d.]+\s*,\s*[\d.]+(?:\s*,\s*(\{[\s\S]*?\}))?\s*\)/g;
  for (const file of fs.readdirSync(dir)) {
    if (!file.startsWith('catalog') || !file.endsWith('.js') || file === 'catalogHelpers.js') continue;
    const text = fs.readFileSync(path.join(dir, file), 'utf8');
    for (const match of text.matchAll(re)) {
      const name = match[2];
      const opts = match[3] || '';
      const muscle = (opts.match(/muscleGroup:\s*['"]([^'"]+)['"]/) || [])[1] || '';
      const aliases = [...opts.matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1]).filter((s) => s !== muscle && s !== name);
      entries.push({ name, muscle, aliases });
    }
  }
  return entries;
}

function loadCardio() {
  const text = fs.readFileSync(path.join(REPO, 'src/data/cardioExerciseCatalog.js'), 'utf8');
  return [...text.matchAll(/id: '([^']+)',\s*\n\s*name: '([^']+)'/g)].map((m) => ({ id: m[1], name: m[2] }));
}

function muscleTokensFromList(list) {
  const set = new Set();
  for (const item of list || []) {
    for (const token of canonTokens(item)) if (MUSCLE.has(token)) set.add(token);
  }
  return set;
}

function makeExercise(partial) {
  const nameTokens = canonTokens(partial.name);
  const eqTokens = canonTokens(partial.equipment || '');
  const kinds = splitKinds([...nameTokens, ...eqTokens]);
  for (const token of muscleTokensFromList(partial.primaryMuscles)) kinds.muscle.add(token);
  if (partial.muscleGroup) {
    for (const token of canonTokens(partial.muscleGroup)) if (MUSCLE.has(token)) kinds.muscle.add(token);
  }
  const signatures = [{
    tokens: nameTokens,
    ...splitKinds([...nameTokens, ...eqTokens]),
    muscle: kinds.muscle,
    label: 'name'
  }];
  for (const alias of partial.aliases || []) {
    const aliasTokens = canonTokens(alias);
    const aliasKinds = splitKinds([...aliasTokens, ...eqTokens]);
    aliasKinds.muscle = kinds.muscle;
    const meaningful = aliasKinds.movement.size + aliasKinds.equipment.size;
    const only = [...aliasKinds.movement][0];
    if (meaningful >= 2 || (meaningful === 1 && SPECIFIC_SINGLE.has(only))) {
      signatures.push({ tokens: aliasTokens, ...aliasKinds, label: `alias:${alias}` });
    }
  }
  return {
    exerciseId: partial.exerciseId,
    name: partial.name,
    source: partial.source,
    equipment: partial.equipment || '',
    category: partial.category || '',
    normName: norm(partial.name),
    kinds,
    signatures
  };
}

function loadMomentum() {
  const db = loadDatabase();
  const byNorm = new Map();
  const exercises = [];
  for (const [key, ex] of Object.entries(db)) {
    const item = makeExercise({
      exerciseId: `db:${key}`,
      name: ex.name || key,
      source: 'exerciseDatabase',
      equipment: ex.equipment || '',
      category: ex.category || '',
      primaryMuscles: [...(ex.primaryMuscles || []), ...(ex.secondaryMuscles || [])],
      aliases: ex.variations || []
    });
    exercises.push(item);
    byNorm.set(item.normName, item);
  }
  for (const raw of loadScoring()) {
    const n = norm(raw.name);
    const existing = byNorm.get(n);
    if (existing) {
      for (const alias of raw.aliases || []) {
        if (!existing.signatures.some((s) => s.label === `alias:${alias}`)) {
          const aliasTokens = canonTokens(alias);
          const aliasKinds = splitKinds([...aliasTokens, ...canonTokens(existing.equipment)]);
          aliasKinds.muscle = existing.kinds.muscle;
          const meaningful = aliasKinds.movement.size + aliasKinds.equipment.size;
          const only = [...aliasKinds.movement][0];
          if (meaningful >= 2 || (meaningful === 1 && SPECIFIC_SINGLE.has(only))) {
            existing.signatures.push({ tokens: aliasTokens, ...aliasKinds, label: `alias:${alias}` });
          }
        }
      }
      if (raw.muscle) {
        for (const token of canonTokens(raw.muscle)) if (MUSCLE.has(token)) existing.kinds.muscle.add(token);
      }
      continue;
    }
    const item = makeExercise({
      exerciseId: `score:${norm(raw.name)}`,
      name: raw.name,
      source: 'scoring',
      equipment: '',
      category: raw.muscle || '',
      muscleGroup: raw.muscle,
      aliases: raw.aliases
    });
    exercises.push(item);
    byNorm.set(item.normName, item);
  }
  for (const raw of loadCardio()) {
    const n = norm(raw.name);
    if (byNorm.has(n)) continue;
    const item = makeExercise({
      exerciseId: `cardio:${raw.id}`,
      name: raw.name,
      source: 'cardio',
      equipment: '',
      category: 'cardio',
      aliases: []
    });
    exercises.push(item);
    byNorm.set(n, item);
  }
  return exercises;
}

function mediaProfile(name, equipmentText, muscleText) {
  const tokens = canonTokens(`${name || ''} ${equipmentText || ''} ${muscleText || ''}`);
  const kinds = splitKinds(tokens);
  return { tokens, ...kinds, rawNorm: norm(name) };
}

function candidatePayload(ex, confidence, matchType, reasons) {
  return {
    exerciseId: ex.exerciseId,
    name: ex.name,
    source: ex.source,
    confidence,
    matchType,
    reasons
  };
}

function matchIndividual(profile, exercises) {
  const directHits = [];
  const signatureHits = [];
  for (const ex of exercises) {
    for (const sig of ex.signatures) {
      const aliasLabel = sig.label === 'name' ? ex.name : sig.label.replace(/^alias:/, '');
      const rawEqual = Boolean(profile.rawNorm)
        && foldKey(profile.rawNorm) === foldKey(aliasLabel)
        && (sig.label === 'name' || aliasSpecific(aliasLabel));
      const moveOk = movementEqual(profile.movement, profile.muscle, sig.movement, sig.muscle);
      const eq = equipmentRelation(profile.equipment, sig.equipment);
      if (rawEqual) {
        directHits.push({ ex, eq, via: sig.label });
        break;
      }
      if (!moveOk || eq === 'conflict') continue;
      if (moveOk && eq === 'equal') signatureHits.push({ ex, eq, via: sig.label, rawEqual });
      else if (moveOk && eq === 'both_empty') signatureHits.push({ ex, eq, via: sig.label, rawEqual });
      else if (moveOk && eq === 'one_empty' && profile.equipment.size === 0) {
        signatureHits.push({ ex, eq, via: sig.label, rawEqual });
      }
    }
  }

  const uniq = (rows) => {
    const map = new Map();
    for (const row of rows) map.set(row.ex.exerciseId, row);
    return [...map.values()];
  };
  const direct = uniq(directHits);
  if (direct.length === 1) {
    return {
      confidence: 'EXACT',
      matchType: 'direct',
      candidates: [candidatePayload(direct[0].ex, 'EXACT', 'direct', [
        'nom correspondant',
        direct[0].eq === 'equal'
          ? 'équipement correspondant'
          : direct[0].eq === 'conflict'
            ? 'nom identique à la fiche ou à un alias'
            : 'équipement non contredit'
      ])],
      nearMisses: []
    };
  }
  if (direct.length > 1) {
    return {
      confidence: 'AMBIGUOUS',
      matchType: 'direct',
      candidates: direct.slice(0, 8).map((row) => candidatePayload(row.ex, 'AMBIGUOUS', 'direct', ['plusieurs exercices au même nom'])),
      nearMisses: []
    };
  }

  const exactEq = uniq(signatureHits.filter((row) => row.eq === 'equal' || row.eq === 'both_empty'));
  if (exactEq.length === 1) {
    const row = exactEq[0];
    const confidence = row.rawEqual ? 'EXACT' : 'HIGH_CONFIDENCE';
    const matchType = row.rawEqual ? 'direct' : 'normalized';
    const reasons = [
      row.rawEqual ? 'nom correspondant' : 'nom égal après normalisation FR/EN, synonymes et ordre des mots',
      row.eq === 'equal' ? 'équipement correspondant' : 'pas d’équipement contradictoire'
    ];
    if (profile.muscle.size && row.ex.kinds.muscle.size) reasons.push('muscle compatible');
    return { confidence, matchType, candidates: [candidatePayload(row.ex, confidence, matchType, reasons)], nearMisses: [] };
  }
  if (exactEq.length > 1) {
    return {
      confidence: 'AMBIGUOUS',
      matchType: 'semantic',
      candidates: exactEq.slice(0, 8).map((row) => candidatePayload(row.ex, 'AMBIGUOUS', 'semantic', ['plusieurs exercices restent possibles'])),
      nearMisses: []
    };
  }

  const loose = uniq(signatureHits.filter((row) => row.eq === 'one_empty'));
  if (loose.length === 1) {
    return {
      confidence: 'PROBABLE',
      matchType: 'semantic',
      candidates: [candidatePayload(loose[0].ex, 'PROBABLE', 'semantic', [
        'mouvement correspondant',
        'équipement absent sur le média, une seule fiche Momentum pour ce mouvement'
      ])],
      nearMisses: []
    };
  }
  if (loose.length > 1) {
    return {
      confidence: 'AMBIGUOUS',
      matchType: 'semantic',
      candidates: loose.slice(0, 8).map((row) => candidatePayload(row.ex, 'AMBIGUOUS', 'semantic', [
        'même mouvement, équipement du média insuffisant pour choisir'
      ])),
      nearMisses: []
    };
  }
  return { confidence: 'NO_MATCH', matchType: 'individual', candidates: [], nearMisses: [] };
}

function familyStem(filename) {
  let stem = filename.replace(/\.[^.]+$/, '');
  stem = stem.replace(/toutes les variantes de/ig, ' ');
  stem = stem.replace(/toutes les variantes/ig, ' ');
  stem = stem.replace(/otutes les variantes/ig, ' ');
  stem = stem.replace(/variantes de/ig, ' ');
  stem = stem.replace(/\bvariantes\b/ig, ' ');
  stem = stem.replace(/\bvariante\b/ig, ' ');
  stem = stem.replace(/\b\d+\b/g, ' ');
  return stem.replace(/\s+/g, ' ').trim();
}

const POSITIONS = new Set(['standing', 'seated', 'lying', 'incline', 'decline', 'overhead', 'flatbench']);
const VARIANT_MODIFIERS = new Set([
  'pronated', 'supinated', 'close', 'wide', 'neutral', 'pause', 'unilateral',
  'seated', 'standing', 'lying', 'incline', 'decline', 'overhead', 'flatbench',
  'explosive', 'hammer', 'goblet', 'bulgarian', 'sumo', 'hack', 'sissy', 'pistol',
  'nordic', 'concentration', 'spider', 'zottman', 'front', 'lateral', 'reardelt',
  'lsit', 'scapular', 'weighted', 'australian', 'explosive', 'archer', 'commando', 'typewriter'
]);

function matchFamily(filename, exercises) {
  const stem = familyStem(filename);
  const profile = mediaProfile(stem, '', '');
  if (profile.movement.size + profile.equipment.size + profile.muscle.size === 0) {
    return {
      confidence: 'AMBIGUOUS',
      matchType: 'family_all_variants',
      candidates: [],
      reasons: [`famille illisible après retrait de « variantes » : « ${stem || filename} »`]
    };
  }
  const hits = [];
  for (const ex of exercises) {
    if (/\b21\b/.test(ex.name)) continue;
    const moveOk = [...profile.movement].filter((token) => !POSITIONS.has(token)).every((token) => ex.kinds.movement.has(token) || (MUSCLE.has(token) && ex.kinds.muscle.has(token)));
    const muscleOk = [...profile.muscle].every((token) => ex.kinds.muscle.has(token) || ex.kinds.movement.has(token));
    const eqOk = [...profile.equipment].every((token) => ex.kinds.equipment.has(token));
    if (!moveOk || !muscleOk || !eqOk) continue;
    if (!profile.movement.has('australian') && ex.kinds.movement.has('australian') && (profile.movement.has('pullup') || profile.movement.has('row'))) continue;
    let foreign = false;
    for (const token of ex.kinds.movement) {
      if (profile.movement.has(token) || VARIANT_MODIFIERS.has(token)) continue;
      foreign = true;
      break;
    }
    if (foreign) continue;
    const stemPos = [...profile.movement].filter((token) => POSITIONS.has(token));
    const exPos = [...ex.kinds.movement].filter((token) => POSITIONS.has(token));
    const benchFamily = new Set(['flatbench', 'incline', 'decline']);
    let position = 'strict';
    const stemOther = stemPos.filter((token) => !benchFamily.has(token));
    const stemBench = stemPos.filter((token) => benchFamily.has(token));
    if (stemOther.length) {
      if (exPos.length === 0) position = 'loose';
      else if (!stemOther.every((token) => exPos.includes(token))) continue;
    }
    if (stemBench.includes('flatbench') && !stemBench.includes('incline') && !stemBench.includes('decline')) {
      if (exPos.includes('overhead')) continue;
      if (exPos.length && !exPos.some((token) => benchFamily.has(token))) continue;
    } else if (stemBench.length && exPos.length && !stemBench.every((token) => exPos.includes(token))) {
      continue;
    } else if (stemPos.length && exPos.length === 0 && stemOther.length === 0) {
      position = 'loose';
    }
    hits.push({ ex, position });
  }
  const strict = hits.filter((hit) => hit.position === 'strict');
  const chosen = strict.length ? strict : hits;
  if (chosen.length === 0) {
    return {
      confidence: 'NO_MATCH',
      matchType: 'family_all_variants',
      candidates: [],
      reasons: [`aucune fiche Momentum ne couvre la famille « ${stem} » sans mélanger un autre mouvement`]
    };
  }
  const confidence = strict.length && (profile.movement.size + profile.equipment.size >= 2 || chosen.length >= 2)
    ? 'HIGH_CONFIDENCE'
    : 'PROBABLE';
  return {
    confidence,
    matchType: 'family_all_variants',
    candidates: chosen.slice(0, 40).map(({ ex }) => candidatePayload(ex, confidence, 'family_all_variants', [
      `famille « ${stem} »`,
      'variante présente dans Momentum'
    ])),
    reasons: [
      `famille « ${stem} »`,
      `${chosen.length} fiche(s) Momentum`,
      strict.length ? 'association de famille, pas une fiche unique' : 'position du média non écrite sur les fiches, confiance abaissée'
    ]
  };
}

function isVariantFilename(filename) {
  return /variantes|otutes les variantes|toutes les variantes/i.test(filename);
}

function isStretch(rec, catalog) {
  const blob = `${rec.metadata?.category || ''} ${catalog?.body_part || ''} ${catalog?.name || rec.metadata?.name || ''}`.toLowerCase();
  return /\bstretch|étirement|etirement/.test(blob);
}

function loadQuatriemeById() {
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'quatrieme dossier gif/data/exercises.json'), 'utf8'));
  const map = new Map();
  for (const ex of data) map.set(ex.id, ex);
  return map;
}

function catalogOf(rec, quatriemeById) {
  if (rec.sourceCollection === 'deuxieme dossier gif') {
    const stem = rec.metadata?.numericStem;
    if (!stem) return null;
    const padded = String(stem).padStart(4, '0');
    const ex = quatriemeById.get(padded) || null;
    return ex ? { ...ex, _numericHint: true, _padded: padded } : { _numericHint: true, _missing: true, _padded: padded };
  }
  return null;
}

function displayName(rec, hinted) {
  if (hinted && hinted.name) return hinted.name;
  return rec.metadata?.name || rec.filename.replace(/\.[^.]+$/, '').trim();
}

function equipmentText(rec, hinted) {
  if (hinted?.equipment) return hinted.equipment;
  if (Array.isArray(rec.metadata?.equipments)) return rec.metadata.equipments.join(' ');
  return rec.metadata?.equipment || '';
}

function muscleText(rec, hinted) {
  if (hinted?.target) return `${hinted.target} ${hinted.muscle_group || ''}`;
  if (Array.isArray(rec.metadata?.targetMuscles)) return rec.metadata.targetMuscles.join(' ');
  return rec.metadata?.muscle || rec.metadata?.target || '';
}

function proposeNew(name) {
  const cleaned = String(name || '').trim();
  if (!cleaned || cleaned.length < 3) return null;
  return {
    displayName: cleaned,
    normalizedName: norm(cleaned),
    reason: 'aucun exercice Momentum avec le même mouvement et le même équipement'
  };
}

function main() {
  const exercises = loadMomentum();
  const quatriemeById = loadQuatriemeById();
  const lines = fs.readFileSync(path.join(__dirname, 'media-index.jsonl'), 'utf8').trim().split(/\n/).map((line) => JSON.parse(line));
  const interesting = lines.filter((rec) => rec.role !== 'thumb_companion');
  const byHash = new Map();
  for (const rec of interesting) {
    if (!byHash.has(rec.sha256)) byHash.set(rec.sha256, []);
    byHash.get(rec.sha256).push(rec.relativePath);
  }

  const proposals = [];
  for (const rec of interesting) {
    const sameBytesAs = (byHash.get(rec.sha256) || []).filter((p) => p !== rec.relativePath);
    const base = {
      mediaId: rec.mediaId,
      sourceCollection: rec.sourceCollection,
      sourcePath: rec.relativePath,
      sha256: rec.sha256,
      role: rec.role,
      filename: rec.filename,
      sameBytesAs,
      candidateExerciseIds: [],
      proposedNewExercise: null,
      matchType: 'individual',
      confidence: 'NO_MATCH',
      finalStatus: 'PENDING_REVIEW',
      reasons: []
    };

    if (rec.role === 'routine') {
      base.matchType = 'routine_deferred';
      base.confidence = 'NO_MATCH';
      base.reasons = ['routine/circuit : composition non analysée dans cette phase'];
      if (sameBytesAs.length) base.reasons.push('même fichier qu’un autre média, composition toujours non déduite');
      proposals.push(base);
      continue;
    }

    if (/50gymworkouts/i.test(rec.filename)) {
      base.matchType = 'not_individual';
      base.confidence = 'NO_MATCH';
      base.reasons = ['fichier MP4 mal nommé, titre de compilation, pas un exercice individuel identifié'];
      proposals.push(base);
      continue;
    }

    if (rec.role === 'pedagogical_video' && isVariantFilename(rec.filename)) {
      const family = matchFamily(rec.filename, exercises);
      base.matchType = 'family_all_variants';
      base.confidence = family.confidence;
      base.candidateExerciseIds = family.candidates;
      base.reasons = family.reasons;
      proposals.push(base);
      continue;
    }

    const hinted = catalogOf(rec, quatriemeById);
    if (hinted?._missing) {
      base.matchType = 'numeric_hint';
      base.confidence = 'NO_MATCH';
      base.reasons = [
        `numéro ${hinted._padded} absent du catalogue du quatrième dossier`,
        'le numéro n’est pas une preuve, contenu vidéo non identifié'
      ];
      proposals.push(base);
      continue;
    }

    const name = displayName(rec, hinted);
    if (isStretch(rec, hinted)) {
      base.matchType = 'not_individual';
      base.confidence = 'NO_MATCH';
      base.reasons = ['média d’étirement du catalogue, pas une nouvelle fiche exercice'];
      proposals.push(base);
      continue;
    }

    const profile = mediaProfile(name, equipmentText(rec, hinted), muscleText(rec, hinted));
    const found = matchIndividual(profile, exercises);
    base.matchType = hinted?._numericHint ? 'numeric_hint' : found.matchType;
    base.confidence = found.confidence;
    base.candidateExerciseIds = found.candidates;
    base.reasons = found.candidates[0]?.reasons ? [...found.candidates[0].reasons] : [];
    if (found.confidence === 'AMBIGUOUS') {
      base.reasons = ['plusieurs exercices restent possibles'];
    }
    if (found.confidence === 'NO_MATCH') {
      base.reasons = ['aucune correspondance fiable avec une fiche Momentum'];
      if (name && rec.metadata?.name || hinted?.name || rec.role === 'pedagogical_video') {
        const proposal = proposeNew(name);
        if (proposal && (rec.metadata?.name || hinted?.name || rec.role === 'pedagogical_video')) {
          base.proposedNewExercise = proposal;
          base.reasons.push('exercice individuel possible, fiche nouvelle seulement proposée');
        }
      }
    }
    if (hinted?._numericHint) {
      if (base.confidence === 'EXACT' || base.confidence === 'HIGH_CONFIDENCE') base.confidence = 'PROBABLE';
      base.matchType = 'numeric_hint';
      base.candidateExerciseIds = base.candidateExerciseIds.map((c) => ({ ...c, confidence: 'PROBABLE', matchType: 'numeric_hint' }));
      base.proposedNewExercise = null;
      base.reasons = base.reasons.filter((reason) => !reason.includes('fiche nouvelle'));
      base.reasons.unshift(
        `numéro ${hinted._padded} retrouvé dans le quatrième dossier (« ${hinted.name} »), contenu vidéo non vérifié`
      );
      if (base.confidence === 'NO_MATCH') {
        base.reasons.push('pas de fiche nouvelle : le numéro ne prouve pas le contenu de la vidéo');
      }
    }
    if (sameBytesAs.length) base.reasons.push('doublon physique avec un autre fichier');
    proposals.push(base);
  }

  const summary = summarize(proposals, exercises.length);
  fs.writeFileSync(path.join(__dirname, 'match-summary.json'), JSON.stringify(summary, null, 2));
  const out = fs.createWriteStream(path.join(__dirname, 'match-proposals.jsonl'));
  for (const row of proposals) out.write(JSON.stringify(row) + '\n');
  out.end();
  runSelfChecks(proposals, exercises);
  console.log(JSON.stringify({
    proposals: proposals.length,
    momentumCards: exercises.length,
    byConfidence: summary.byConfidence,
    proposedNewUnique: summary.proposedNewUniqueNames,
    families: summary.familyFiles
  }, null, 2));
}

function summarize(proposals, momentumCards) {
  const byConfidence = {};
  const byMatchType = {};
  const proposedNames = new Map();
  for (const row of proposals) {
    byConfidence[row.confidence] = (byConfidence[row.confidence] || 0) + 1;
    byMatchType[row.matchType] = (byMatchType[row.matchType] || 0) + 1;
    if (row.proposedNewExercise) {
      const key = row.proposedNewExercise.normalizedName;
      proposedNames.set(key, (proposedNames.get(key) || 0) + 1);
    }
  }
  const sample = (confidence) => proposals.filter((r) => r.confidence === confidence).slice(0, 5).map((r) => ({
    sourcePath: r.sourcePath,
    confidence: r.confidence,
    matchType: r.matchType,
    candidates: r.candidateExerciseIds.map((c) => c.name),
    proposed: r.proposedNewExercise?.displayName || null
  }));
  return {
    generatedAt: new Date().toISOString(),
    finalStatus: 'PENDING_REVIEW',
    appliedToMomentum: false,
    momentumCardsConsidered: momentumCards,
    proposals: proposals.length,
    byConfidence,
    byMatchType,
    proposedNewRecords: proposals.filter((r) => r.proposedNewExercise).length,
    proposedNewUniqueNames: proposedNames.size,
    familyFiles: proposals.filter((r) => r.matchType === 'family_all_variants').map((r) => ({
      sourcePath: r.sourcePath,
      confidence: r.confidence,
      candidates: r.candidateExerciseIds.map((c) => c.name)
    })),
    numericHint: proposals.filter((r) => r.matchType === 'numeric_hint').map((r) => ({
      sourcePath: r.sourcePath,
      confidence: r.confidence,
      reasons: r.reasons.slice(0, 2),
      candidates: r.candidateExerciseIds.map((c) => c.name)
    })),
    samples: {
      EXACT: sample('EXACT'),
      HIGH_CONFIDENCE: sample('HIGH_CONFIDENCE'),
      PROBABLE: sample('PROBABLE'),
      AMBIGUOUS: sample('AMBIGUOUS'),
      NO_MATCH: sample('NO_MATCH')
    }
  };
}

function runSelfChecks(proposals, exercises) {
  const byPath = new Map(proposals.map((r) => [r.sourcePath, r]));
  const findName = (needle) => proposals.find((r) => norm(r.filename) === norm(needle) || norm(displaySafe(r)) === norm(needle));
  function displaySafe(r) {
    return r.candidateExerciseIds[0]?.name || r.proposedNewExercise?.displayName || r.filename;
  }
  const curlBarre = exercises.find((ex) => ex.name === 'Curl barre');
  const dcHalteres = exercises.find((ex) => ex.name === 'Développé couché aux haltères');
  const dc = exercises.find((ex) => ex.name === 'Développé couché');
  if (!curlBarre || !dcHalteres || !dc) throw new Error('fiches Momentum attendues introuvables');

  const bench = matchIndividual(mediaProfile('barbell bench press', 'barbell', 'pectorals'), exercises);
  if (bench.confidence !== 'EXACT' && bench.confidence !== 'HIGH_CONFIDENCE') throw new Error('bench press non reconnu: ' + bench.confidence);
  if (bench.candidates[0].exerciseId !== dc.exerciseId) throw new Error('bench press mal dirigé: ' + bench.candidates[0].name);

  const scap = matchIndividual(mediaProfile('Scapular Pull Up', 'bodyweight', 'traps'), exercises);
  if (scap.candidates[0]?.name !== 'Tractions scapulaires') {
    throw new Error('scapular pull up mal dirigé: ' + (scap.candidates[0]?.name || scap.confidence));
  }

  const dbPress = matchIndividual(mediaProfile('dumbbell bench press', 'dumbbell', 'pectorals'), exercises);
  if (dbPress.candidates[0]?.exerciseId !== dcHalteres.exerciseId) {
    throw new Error('dumbbell bench press mal dirigé: ' + (dbPress.candidates[0]?.name || dbPress.confidence));
  }
  if (dbPress.candidates.some((c) => c.exerciseId === dc.exerciseId)) throw new Error('haltères rattaché au développé barre');

  const vague = matchIndividual(mediaProfile('biceps curl', '', 'biceps'), exercises);
  if (vague.confidence !== 'AMBIGUOUS') throw new Error('biceps curl sans matériel aurait dû rester ambigu: ' + vague.confidence);

  const ez = matchIndividual(mediaProfile('ez bar curl', 'ez barbell', 'biceps'), exercises);
  const ezEx = exercises.find((ex) => ex.name === 'Curl barre EZ');
  if (ez.candidates[0]?.exerciseId !== ezEx.exerciseId) throw new Error('ez bar curl mal dirigé: ' + (ez.candidates[0]?.name || ez.confidence));

  const family = matchFamily('toutes les variantes de tractions australiennes.mp4', exercises);
  const names = family.candidates.map((c) => c.name);
  if (!names.some((n) => /australiennes — prise pronation/i.test(n))) throw new Error('famille australienne incomplète');
  if (names.some((n) => n === 'Tractions pronation')) throw new Error('famille australienne a inclus les tractions verticales');

  const pullups = matchFamily('toutes les variantes de tractions.mp4', exercises);
  const pullNames = pullups.candidates.map((c) => c.name);
  if (pullNames.some((n) => /toes to bar|muscle up|front lever|back lever/i.test(n))) {
    throw new Error('famille tractions trop large: ' + pullNames.join(' | '));
  }
  if (!pullNames.includes('Tractions pronation')) throw new Error('famille tractions sans pronation');

  const calves = matchFamily('extension mollet debout toutes les variantes.mp4', exercises);
  if (calves.candidates.some((c) => /triceps/i.test(c.name))) throw new Error('mollets rattachés aux triceps');
  if (!calves.candidates.some((c) => /mollets debout/i.test(c.name))) throw new Error('mollets debout absent');

  const numbered = proposals.filter((r) => r.matchType === 'numeric_hint');
  if (numbered.some((r) => r.confidence === 'EXACT' || r.confidence === 'HIGH_CONFIDENCE')) {
    throw new Error('un MP4 numéroté a été promu au-dessus de PROBABLE');
  }
  if (numbered.some((r) => r.proposedNewExercise)) throw new Error('fiche proposée depuis un numéro seul');
  const routines = proposals.filter((r) => r.role === 'routine');
  if (routines.length !== 29) throw new Error('routines ' + routines.length);
  if (routines.some((r) => r.candidateExerciseIds.length || r.proposedNewExercise)) {
    throw new Error('une routine a été résolue');
  }
  if (proposals.some((r) => r.finalStatus !== 'PENDING_REVIEW')) throw new Error('statut final non pending');
  if (proposals.some((r) => r.sourcePath.endsWith('.webp'))) throw new Error('miniature webp incluse');
  const missing = byPath.get('deuxieme dossier gif/0062.mp4');
  if (!missing || missing.confidence !== 'NO_MATCH' || missing.proposedNewExercise) {
    throw new Error('0062.mp4 aurait dû rester sans fiche');
  }
  if (findName('50gymworkouts.json')?.proposedNewExercise) throw new Error('compilation proposée comme fiche');
}

export { matchIndividual, mediaProfile, makeExercise };

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) main();
