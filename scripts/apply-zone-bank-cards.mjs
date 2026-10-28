/**
 * Crée / lie des cartes banque à partir des GIF troisieme (sans doublons).
 * Usage:
 *   node scripts/apply-zone-bank-cards.mjs epaules-dos-bras
 *   node scripts/apply-zone-bank-cards.mjs --list
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const require = createRequire(path.join(root, 'package.json'));

const MANIFEST_PATH = path.join(root, 'src/data/bankMediaManifest.json');
const PROPOSALS_PATH = path.join(root, 'dossiergifs/audit/match-proposals.jsonl');

/** Packs de zones : dossiers troisieme → category FR banque */
const PACKS = {
  'epaules-dos-bras': {
    label: 'Épaules + Dos + Bras',
    batchExExport: 'EXERCISE_DATABASE_EPAULES_DOS_BRAS_GIF_BATCH',
    batchStExport: 'STRETCH_DATABASE_EPAULES_DOS_BRAS_GIF_BATCH',
    batchExFile: 'src/data/exerciseDatabaseEpaulesDosBrasGifBatch.js',
    batchStFile: 'src/data/stretchDatabaseEpaulesDosBrasGifBatch.js',
    folders: {
      delts: { category: 'Épaules', bodyZone: 'épaules', stretchZone: 'épaules' },
      'levator-scapulae': { category: 'Épaules', bodyZone: 'épaules', stretchZone: 'cou' },
      'serratus-anterior': { category: 'Épaules', bodyZone: 'épaules', stretchZone: 'thoracique' },
      lats: { category: 'Dorsaux', bodyZone: 'dos', stretchZone: 'dos' },
      traps: { category: 'Dorsaux', bodyZone: 'dos', stretchZone: 'dos' },
      'upper-back': { category: 'Dorsaux', bodyZone: 'dos', stretchZone: 'thoracique' },
      spine: { category: 'Dorsaux', bodyZone: 'dos', stretchZone: 'lombaires' },
      biceps: { category: 'Biceps', bodyZone: 'bras', stretchZone: 'bras' },
      triceps: { category: 'Triceps', bodyZone: 'bras', stretchZone: 'bras' },
      forearms: { category: 'Avant-bras', bodyZone: 'bras', stretchZone: 'bras' },
    },
  },
  pectoraux: {
    label: 'Pectoraux',
    batchExExport: 'EXERCISE_DATABASE_PECTORAUX_GIF_BATCH',
    batchStExport: 'STRETCH_DATABASE_PECTORAUX_GIF_BATCH',
    batchExFile: 'src/data/exerciseDatabasePectorauxGifBatch.js',
    batchStFile: 'src/data/stretchDatabasePectorauxGifBatch.js',
    folders: {
      pectorals: { category: 'Pectoraux', bodyZone: 'pectoraux', stretchZone: 'poitrine' },
    },
  },
  'abs-jambes-fessiers-cardio': {
    label: 'Abdos + Jambes + Fessiers + Cardio',
    batchExExport: 'EXERCISE_DATABASE_ABS_JAMBES_FESSIERS_CARDIO_GIF_BATCH',
    batchStExport: 'STRETCH_DATABASE_ABS_JAMBES_FESSIERS_CARDIO_GIF_BATCH',
    batchExFile: 'src/data/exerciseDatabaseAbsJambesFessiersCardioGifBatch.js',
    batchStFile: 'src/data/stretchDatabaseAbsJambesFessiersCardioGifBatch.js',
    folders: {
      abs: { category: 'Abdominaux', bodyZone: 'tronc', stretchZone: 'tronc' },
      quads: { category: 'Quadriceps', bodyZone: 'jambes', stretchZone: 'quadriceps' },
      hamstrings: { category: 'Ischio-jambiers', bodyZone: 'jambes', stretchZone: 'ischios' },
      glutes: { category: 'Fessiers', bodyZone: 'fessiers', stretchZone: 'fessiers' },
      calves: { category: 'Mollets', bodyZone: 'jambes', stretchZone: 'mollets' },
      adductors: { category: 'Quadriceps', bodyZone: 'jambes', stretchZone: 'hanches' },
      abductors: { category: 'Fessiers', bodyZone: 'fessiers', stretchZone: 'hanches' },
      cardio: {
        category: 'Activités Complémentaires',
        bodyZone: 'full',
        stretchZone: 'full',
      },
    },
  },
};

function norm(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function titleFrFromSlug(slug) {
  const raw = slug.replace(/\.gif$/i, '').replace(/-male$/i, '').replace(/-/g, ' ');
  const map = [
    [/barbell/g, 'barre'],
    [/dumbbell/g, 'haltères'],
    [/cable/g, 'poulie'],
    [/band /g, 'élastique '],
    [/^band/g, 'élastique'],
    [/kettlebell/g, 'kettlebell'],
    [/incline/g, 'incliné'],
    [/decline/g, 'décliné'],
    [/bench press/g, 'développé couché'],
    [/overhead press/g, 'développé militaire'],
    [/shoulder press/g, 'développé épaules'],
    [/military press/g, 'développé militaire'],
    [/press/g, 'développé'],
    [/lateral raise/g, 'élévation latérale'],
    [/front raise/g, 'élévation frontale'],
    [/rear delt/g, 'deltoïde postérieur'],
    [/face pull/g, 'face pull'],
    [/shrug/g, 'shrugs'],
    [/row/g, 'rowing'],
    [/pulldown/g, 'tirage vertical'],
    [/pull down/g, 'tirage vertical'],
    [/pull up/g, 'tractions'],
    [/pull-up/g, 'tractions'],
    [/chin up/g, 'tractions supination'],
    [/deadlift/g, 'soulevé de terre'],
    [/fly/g, 'oiseau'],
    [/curl/g, 'curl'],
    [/extension/g, 'extension'],
    [/kickback/g, 'kickback'],
    [/wrist/g, 'poignet'],
    [/forearm/g, 'avant-bras'],
    [/biceps/g, 'biceps'],
    [/triceps/g, 'triceps'],
    [/lat /g, 'dorsal '],
    [/trap /g, 'trapèze '],
    [/one arm/g, 'unilatéral'],
    [/single arm/g, 'unilatéral'],
    [/assisted/g, 'assisté'],
    [/wide grip/g, 'prise large'],
    [/close grip/g, 'prise serrée'],
    [/reverse grip/g, 'prise inversée'],
    [/neutral grip/g, 'prise neutre'],
    [/smith/g, 'smith'],
    [/kneeling/g, 'à genoux'],
    [/seated/g, 'assis'],
    [/standing/g, 'debout'],
    [/lying/g, 'allongé'],
    [/prone/g, 'ventral'],
    [/stability ball/g, 'ballon'],
    [/exercise ball/g, 'ballon'],
    [/stretch/g, 'étirement'],
    [/mobility/g, 'mobilité'],
  ];
  let s = ` ${raw} `;
  for (const [re, rep] of map) s = s.replace(re, ` ${rep} `);
  s = s.replace(/\s+/g, ' ').trim();
  return s
    .split(' ')
    .filter(Boolean)
    .map((w) => (w.length <= 2 ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
}

function dbKeyFromSlug(slug) {
  return titleFrFromSlug(slug).toLowerCase().replace(/\s+/g, ' ').trim();
}

function stretchKeyFromSlug(slug) {
  return slug
    .replace(/\.gif$/i, '')
    .replace(/-male$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

function isStretchPath(rel) {
  // Uniquement banque étirements — jamais mélangé avec la force
  return /stretch|yoga|mobility|mobilisation|foam.?roll|pose|child.?pose|pigeon|cobra|downward|savasana|namaste/i.test(
    rel
  );
}

function isStrengthLikeName(blob) {
  return /\b(curl|press|row|squat|deadlift|pulldown|pull-?up|push-?up|bench|raise|extension|dip|thrust|snatch|clean|swing|crunch|plank|burpee|sprint|run|jump)\b/i.test(
    blob
  );
}

/** Description alignée sur les fiches isNew déjà en banque (champs identiques). */
function buildExerciseDescription(name, category, equipment, primary, secondary) {
  const prim = (primary || []).join(', ') || category;
  const sec = (secondary || []).filter(Boolean).join(', ');
  const secPart = sec ? ` Secondaires : ${sec}.` : '';
  return (
    `${name}. Exercice de la banque ${category.toLowerCase()}, équipement : ${equipment}. ` +
    `Muscles principaux : ${prim}.${secPart} ` +
    `Suis la trajectoire du GIF : amplitude contrôlée, sans élan parasite. ` +
    `Ce n’est pas un étirement — reste sur la fiche exercice correspondante pour la mobilité. ` +
    `Expire sur l’effort, inspire sur le retour. 3 séries de 8 à 15 selon la charge.`
  );
}

function buildStretchDescription(name, zone) {
  return (
    `${name}. Étirement / mobilité (${zone}) issu de la banque GIF. ` +
    `Maintiens une amplitude confortable sans douleur ni rebond. ` +
    `Ce n’est pas un exercice de force — ne le programme pas comme une série lestée.`
  );
}

function enrichExerciseEntry(entry) {
  const primary = Array.isArray(entry.primaryMuscles) ? entry.primaryMuscles : [];
  const secondary = Array.isArray(entry.secondaryMuscles) ? entry.secondaryMuscles : [];
  return {
    name: entry.name,
    category: entry.category,
    primaryMuscles: primary.length ? primary : [entry.category],
    secondaryMuscles: secondary,
    equipment: entry.equipment || 'Divers',
    difficulty: typeof entry.difficulty === 'number' ? entry.difficulty : 2,
    isNew: true,
    description: buildExerciseDescription(
      entry.name,
      entry.category,
      entry.equipment || 'Divers',
      primary,
      secondary
    ),
    variations: Array.isArray(entry.variations)
      ? [...new Set(entry.variations.filter(Boolean))]
      : [],
  };
}

function enrichStretchEntry(entry) {
  return {
    name: entry.name,
    category: entry.category || 'Étirement',
    bodyZone: entry.bodyZone || 'full',
    primaryMuscles: entry.primaryMuscles?.length ? entry.primaryMuscles : ['Mobilité'],
    secondaryMuscles: entry.secondaryMuscles || [],
    equipment: entry.equipment || 'Aucun',
    defaultDuration: entry.defaultDuration || 45,
    position: entry.position || 'Selon le GIF',
    difficulty: typeof entry.difficulty === 'number' ? entry.difficulty : 1,
    description: buildStretchDescription(entry.name, entry.bodyZone || 'full'),
    instructions:
      entry.instructions ||
      'Installe-toi sans forcer. Avance jusqu’à une tension claire mais confortable, respire 4–6 cycles, relâche progressivement.',
    contraindications: entry.contraindications?.length
      ? entry.contraindications
      : ['Douleur articulaire aiguë', 'Instabilité non contrôlée'],
    variations: Array.isArray(entry.variations)
      ? [...new Set(entry.variations.filter(Boolean))]
      : [],
  };
}

function inferEquipment(slug) {
  const s = slug.toLowerCase();
  if (s.includes('smith')) return 'Smith machine';
  if (s.includes('barbell')) return 'Barre';
  if (s.includes('dumbbell')) return 'Haltères';
  if (s.includes('cable')) return 'Poulie';
  if (s.includes('band')) return 'Élastique';
  if (s.includes('kettlebell')) return 'Kettlebell';
  if (s.includes('ball')) return 'Ballon de stabilité';
  if (s.includes('machine')) return 'Machine';
  if (/pull-up|chin-up|dip|push-up|hang/.test(s)) return 'Poids du corps';
  return 'Divers';
}

function inferPrimary(category, slug) {
  const s = slug.toLowerCase();
  if (category === 'Épaules') {
    if (/rear|posterior|oiseau|face.?pull/.test(s)) return ['Deltoïdes postérieurs'];
    if (/lateral|side/.test(s)) return ['Deltoïdes moyens'];
    if (/front|anterior|military|overhead|press/.test(s)) return ['Deltoïdes antérieurs'];
    return ['Deltoïdes'];
  }
  if (category === 'Dorsaux') {
    if (/trap|shrug/.test(s)) return ['Trapèzes'];
    if (/lat|pulldown|pull-up|chin/.test(s)) return ['Grand dorsal'];
    if (/row/.test(s)) return ['Grand dorsal', 'Rhomboïdes'];
    return ['Grand dorsal', 'Trapèzes'];
  }
  if (category === 'Biceps') return ['Biceps brachial'];
  if (category === 'Triceps') return ['Triceps brachial'];
  if (category === 'Avant-bras') return ['Fléchisseurs du poignet'];
  if (category === 'Abdominaux') {
    if (/oblique|twist|side/.test(s)) return ['Obliques'];
    if (/leg.?raise|knee|hang/.test(s)) return ['Grand droit de l\'abdomen', 'Fléchisseurs de hanche'];
    return ['Grand droit de l\'abdomen'];
  }
  if (category === 'Quadriceps') {
    if (/adductor|adduct/.test(s)) return ['Adducteurs'];
    return ['Quadriceps'];
  }
  if (category === 'Ischio-jambiers') return ['Ischio-jambiers'];
  if (category === 'Fessiers') {
    if (/abduct|side.?lying/.test(s)) return ['Moyen fessier'];
    return ['Fessiers'];
  }
  if (category === 'Mollets') return ['Gastrocnémien', 'Soléaire'];
  if (category === 'Activités Complémentaires') return ['Cardio', 'Conditionnement'];
  if (category === 'Pectoraux') {
    if (/incline|upper/.test(s)) return ['Pectoraux supérieurs'];
    if (/decline|lower|dip/.test(s)) return ['Pectoraux inférieurs'];
    return ['Pectoraux'];
  }
  return [category];
}

function inferSecondary(category) {
  if (category === 'Épaules') return ['Trapèzes', 'Coiffe des rotateurs'];
  if (category === 'Dorsaux') return ['Biceps', 'Deltoïdes postérieurs'];
  if (category === 'Biceps') return ['Brachial', 'Avant-bras'];
  if (category === 'Triceps') return ['Deltoïdes antérieurs'];
  if (category === 'Avant-bras') return ['Brachio-radial'];
  if (category === 'Abdominaux') return ['Obliques', 'Transverse de l\'abdomen'];
  if (category === 'Quadriceps') return ['Fessiers', 'Ischio-jambiers'];
  if (category === 'Ischio-jambiers') return ['Fessiers', 'Mollets'];
  if (category === 'Fessiers') return ['Ischio-jambiers', 'Quadriceps'];
  if (category === 'Mollets') return ['Tibial antérieur'];
  if (category === 'Activités Complémentaires') return ['Jambes', 'Core'];
  if (category === 'Pectoraux') return ['Triceps', 'Deltoïdes antérieurs'];
  return [];
}

function hashFile(abs) {
  return crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
}

function mediaFromPath(rel) {
  const abs = path.join(root, 'dossiergifs', rel);
  if (!fs.existsSync(abs)) return null;
  const sha = hashFile(abs);
  const base = path
    .basename(rel, path.extname(rel))
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .slice(0, 40);
  return {
    mediaId: `gif_troisieme_${base}_${sha.slice(0, 8)}`,
    sourcePath: rel,
    sourceCollection: 'troisieme dossier gif',
    sha256: sha,
  };
}

function mediaFromRec(rec) {
  if (rec.mediaId && rec.sha256 && rec.sourcePath) {
    return {
      mediaId: rec.mediaId,
      sourcePath: rec.sourcePath,
      sourceCollection: rec.sourceCollection || 'troisieme dossier gif',
      sha256: rec.sha256,
    };
  }
  return mediaFromPath(rec.sourcePath);
}

function readProposals() {
  return fs
    .readFileSync(PROPOSALS_PATH, 'utf8')
    .trim()
    .split(/\n/)
    .filter(Boolean)
    .map((l) => JSON.parse(l));
}

function existingNameSet(exerciseDatabase) {
  const set = new Set();
  for (const [key, ex] of Object.entries(exerciseDatabase)) {
    set.add(norm(key));
    set.add(norm(ex.name));
    for (const v of ex.variations || []) set.add(norm(v));
  }
  return set;
}

function applyPack(packId) {
  const pack = PACKS[packId];
  if (!pack) throw new Error(`Pack inconnu: ${packId}`);

  // Recharger DB à chaque pack (après Object.assign des batches précédents en mémoire via require cache)
  delete require.cache[path.join(root, 'src/data/exerciseDatabase.js')];
  delete require.cache[path.join(root, 'src/data/stretchDatabase.js')];
  delete require.cache[path.join(root, 'src/data/exerciseDatabaseEnrichment.js')];
  for (const f of Object.values(PACKS).flatMap((p) => [p.batchExFile, p.batchStFile])) {
    const abs = path.join(root, f);
    if (fs.existsSync(abs)) delete require.cache[abs];
  }

  const { exerciseDatabase } = require(path.join(root, 'src/data/exerciseDatabase.js'));
  const { stretchDatabase } = require(path.join(root, 'src/data/stretchDatabase.js'));
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  manifest.exercises = manifest.exercises || {};
  manifest.stretches = manifest.stretches || {};

  const folderKeys = Object.keys(pack.folders);
  const prefixes = folderKeys.map((f) => `troisieme dossier gif/${f}/`);
  const proposals = readProposals().filter((p) =>
    prefixes.some((pre) => String(p.sourcePath || '').startsWith(pre))
  );

  const names = existingNameSet(exerciseDatabase);
  const usedPaths = new Set();
  for (const e of Object.values(manifest.exercises)) {
    if (e?.card?.sourcePath) usedPaths.add(e.card.sourcePath);
    if (e?.gif?.sourcePath) usedPaths.add(e.gif.sourcePath);
  }
  for (const e of Object.values(manifest.stretches)) {
    if (e?.card?.sourcePath) usedPaths.add(e.card.sourcePath);
  }

  const newExercises = {};
  const newStretches = {};
  let linkedExisting = 0;
  let createdEx = 0;
  let createdSt = 0;
  let skippedDup = 0;

  const metaForPath = (rel) => {
    const folder = rel.split('/')[1];
    return pack.folders[folder] || { category: 'Divers', bodyZone: 'full', stretchZone: 'full' };
  };

  // 1) Lier EXACT / HIGH
  for (const rec of proposals) {
    const conf = rec.confidence;
    if (conf !== 'EXACT' && conf !== 'HIGH_CONFIDENCE') continue;
    const candidates = (rec.candidateExerciseIds || rec.candidates || [])
      .map((c) =>
        typeof c === 'string' ? c : c?.exerciseId || c?.id || c?.key || c?.name
      )
      .filter(Boolean);
    for (const rawId of candidates) {
      const id = String(rawId).startsWith('db:') ? String(rawId) : `db:${rawId}`;
      const dbKey = id.slice(3);
      if (!exerciseDatabase[dbKey] && !newExercises[dbKey]) continue;
      const media = mediaFromRec(rec);
      if (!media) continue;
      const bucket = manifest.exercises[id] || { card: null, gif: null, videos: [] };
      if (!bucket.card) {
        bucket.card = media;
        bucket.gif = media;
        if (!Array.isArray(bucket.videos)) bucket.videos = [];
        manifest.exercises[id] = bucket;
        usedPaths.add(media.sourcePath);
        linkedExisting += 1;
      }
    }
  }

  // 2) NO_MATCH → nouvelles cartes / étirements
  for (const rec of proposals) {
    const rel = rec.sourcePath;
    if (usedPaths.has(rel)) continue;
    const meta = metaForPath(rel);
    const slug = path.basename(rel);

    if (isStretchPath(rel) || !rec.proposedNewExercise) {
      if (!isStretchPath(rel)) continue;
      const key = stretchKeyFromSlug(slug);
      if (stretchDatabase[key] || newStretches[key]) {
        skippedDup += 1;
        continue;
      }
      const media = mediaFromRec(rec);
      if (!media) continue;
      const name = titleFrFromSlug(slug);
      // Jamais de fiche force dans la banque étirements
      if (isStrengthLikeName(name) && !/stretch|etirement|yoga|pose|mobility/i.test(rel)) {
        skippedDup += 1;
        continue;
      }
      newStretches[key] = enrichStretchEntry({
        name,
        category: 'Étirement',
        bodyZone: meta.stretchZone,
        primaryMuscles: inferPrimary(meta.category, slug),
        secondaryMuscles: inferSecondary(meta.category),
        equipment: /ball/i.test(slug) ? 'Ballon de stabilité' : 'Aucun',
        defaultDuration: 45,
        position: 'Selon le GIF',
        difficulty: 1,
        variations: [slug.replace(/\.gif$/i, '').replace(/-/g, ' '), name.toLowerCase()],
      });
      manifest.stretches[`stretch:${key}`] = { card: media, gif: media, videos: [] };
      usedPaths.add(rel);
      createdSt += 1;
      continue;
    }

    if (rec.confidence !== 'NO_MATCH' && rec.confidence !== 'AMBIGUOUS') continue;
    // Jamais d’étirement dans la banque exercices
    if (isStretchPath(rel)) continue;

    const key = dbKeyFromSlug(slug);
    const name = titleFrFromSlug(slug);
    if (names.has(norm(key)) || names.has(norm(name)) || exerciseDatabase[key] || newExercises[key]) {
      skippedDup += 1;
      continue;
    }

    const media = mediaFromRec(rec);
    if (!media) continue;

    newExercises[key] = enrichExerciseEntry({
      name,
      category: meta.category,
      primaryMuscles: inferPrimary(meta.category, slug),
      secondaryMuscles: inferSecondary(meta.category),
      equipment: inferEquipment(slug),
      difficulty: 2,
      variations: [
        slug.replace(/\.gif$/i, '').replace(/-/g, ' '),
        rec.proposedNewExercise?.normalizedName,
        rec.proposedNewExercise?.displayName,
      ].filter(Boolean),
    });
    names.add(norm(key));
    names.add(norm(name));
    manifest.exercises[`db:${key}`] = { card: media, gif: media, videos: [] };
    usedPaths.add(rel);
    createdEx += 1;
  }

  const exAbs = path.join(root, pack.batchExFile);
  const stAbs = path.join(root, pack.batchStFile);
  fs.writeFileSync(exAbs, serializeBatch(newExercises, pack.batchExExport, packId));
  fs.writeFileSync(stAbs, serializeBatch(newStretches, pack.batchStExport, packId));

  manifest.generatedAt = new Date().toISOString();
  manifest[`${packId}Batch`] = { linkedExisting, createdEx, createdSt, skippedDup };
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest));

  return {
    packId,
    label: pack.label,
    linkedExisting,
    createdEx,
    createdSt,
    skippedDup,
    batchExFile: pack.batchExFile,
    batchStFile: pack.batchStFile,
  };
}

function serializeBatch(obj, exportName, packId) {
  return `/** Généré par scripts/apply-zone-bank-cards.mjs (${packId}) — ne pas éditer à la main. */\nexport const ${exportName} = ${JSON.stringify(obj, null, 2)};\n`;
}

/** Réécrit les batches existants avec le schéma / descriptions conformes. */
function enrichAllBatches() {
  const report = [];
  for (const [packId, pack] of Object.entries(PACKS)) {
    const exAbs = path.join(root, pack.batchExFile);
    const stAbs = path.join(root, pack.batchStFile);
    if (!fs.existsSync(exAbs) || !fs.existsSync(stAbs)) continue;
    delete require.cache[exAbs];
    delete require.cache[stAbs];
    const exMod = require(exAbs);
    const stMod = require(stAbs);
    const exObj = exMod[pack.batchExExport] || {};
    const stObj = stMod[pack.batchStExport] || {};

    const movedToStretch = [];
    const cleanedEx = {};
    for (const [k, e] of Object.entries(exObj)) {
      const blob = `${k} ${e.name} ${(e.variations || []).join(' ')}`;
      if (isStretchPath(blob) || /etirement|stretch|yoga|pose/i.test(blob)) {
        const sk = stretchKeyFromSlug(k.replace(/\s+/g, '-'));
        stObj[sk] = enrichStretchEntry({
          name: e.name,
          category: 'Étirement',
          bodyZone: pack.folders[Object.keys(pack.folders)[0]]?.stretchZone || 'full',
          primaryMuscles: e.primaryMuscles,
          secondaryMuscles: e.secondaryMuscles,
          equipment: e.equipment === 'Divers' ? 'Aucun' : e.equipment || 'Aucun',
          variations: e.variations,
        });
        movedToStretch.push(k);
        continue;
      }
      cleanedEx[k] = enrichExerciseEntry(e);
    }

    const cleanedSt = {};
    const removedFromStretch = [];
    for (const [k, s] of Object.entries(stObj)) {
      const blob = `${k} ${s.name}`;
      if (isStrengthLikeName(blob) && !/stretch|etirement|yoga|pose|mobility|mobilite/i.test(blob)) {
        removedFromStretch.push(k);
        continue;
      }
      cleanedSt[k] = enrichStretchEntry(s);
    }

    fs.writeFileSync(exAbs, serializeBatch(cleanedEx, pack.batchExExport, `${packId}:enrich`));
    fs.writeFileSync(stAbs, serializeBatch(cleanedSt, pack.batchStExport, `${packId}:enrich`));
    report.push({
      packId,
      exercises: Object.keys(cleanedEx).length,
      stretches: Object.keys(cleanedSt).length,
      movedExToStretch: movedToStretch.length,
      removedStrengthFromStretch: removedFromStretch.length,
      movedToStretch,
      removedFromStretch,
    });
  }
  return report;
}

function main() {
  const arg = process.argv[2];
  if (!arg || arg === '--list') {
    console.log([...Object.keys(PACKS), '--enrich-all'].join('\n'));
    return;
  }
  if (arg === '--enrich-all') {
    console.log(JSON.stringify(enrichAllBatches(), null, 2));
    return;
  }
  const result = applyPack(arg);
  console.log(JSON.stringify(result, null, 2));
}

main();
