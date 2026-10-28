/**
 * Zone Pectoraux : lier GIF existants + créer cartes manquantes (sans doublons).
 * Usage: node scripts/apply-pectoraux-bank-cards.mjs
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const require = createRequire(path.join(root, 'package.json'));

const { exerciseDatabase } = require(path.join(root, 'src/data/exerciseDatabase.js'));
const { stretchDatabase } = require(path.join(root, 'src/data/stretchDatabase.js'));

const MANIFEST_PATH = path.join(root, 'src/data/bankMediaManifest.json');
const BATCH_EX_PATH = path.join(root, 'src/data/exerciseDatabasePectorauxGifBatch.js');
const BATCH_ST_PATH = path.join(root, 'src/data/stretchDatabasePectorauxGifBatch.js');
const PROPOSALS_PATH = path.join(root, 'dossiergifs/audit/match-proposals.jsonl');

const PEC_PREFIX = 'troisieme dossier gif/pectorals/';

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
    [/^band /g, 'élastique '],
    [/incline/g, 'incliné'],
    [/decline/g, 'décliné'],
    [/bench press/g, 'développé couché'],
    [/chest press/g, 'développé pectoraux'],
    [/press/g, 'développé'],
    [/fly/g, 'écarté'],
    [/crossover/g, 'crossover'],
    [/cross over/g, 'crossover'],
    [/push up/g, 'pompes'],
    [/push-up/g, 'pompes'],
    [/dip/g, 'dips'],
    [/pullover/g, 'pull-over'],
    [/one arm/g, 'unilatéral'],
    [/single arm/g, 'unilatéral'],
    [/assisted/g, 'assisté'],
    [/wide grip/g, 'prise large'],
    [/close grip/g, 'prise serrée'],
    [/reverse grip/g, 'prise inversée'],
    [/smith/g, 'smith'],
    [/kneeling/g, 'à genoux'],
    [/seated/g, 'assis'],
    [/standing/g, 'debout'],
    [/lying/g, 'allongé'],
    [/stability ball/g, 'ballon'],
    [/exercise ball/g, 'ballon'],
    [/on ball/g, 'sur ballon'],
    [/stretch/g, 'étirement'],
    [/pectoralis major/g, 'pectoraux'],
    [/chest/g, 'pectoraux'],
    [/upper /g, 'haut '],
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
  // Clés banque = FR minuscule avec accents (comme « développé couché »)
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
  return /stretch|yoga|mobility/i.test(rel);
}

function inferEquipment(slug) {
  const s = slug.toLowerCase();
  if (s.includes('smith')) return 'Smith machine';
  if (s.includes('barbell')) return 'Barre';
  if (s.includes('dumbbell')) return 'Haltères';
  if (s.includes('cable')) return 'Poulie';
  if (s.includes('band')) return 'Élastique';
  if (s.includes('ball')) return 'Ballon de stabilité';
  if (s.includes('push-up') || s.includes('dip') || s.includes('push_up')) return 'Poids du corps';
  return 'Divers';
}

function inferPrimary(slug) {
  if (/incline|upper/.test(slug)) return ['Pectoraux supérieurs'];
  if (/decline|lower/.test(slug)) return ['Pectoraux inférieurs'];
  if (/dip/.test(slug)) return ['Pectoraux inférieurs', 'Triceps'];
  return ['Pectoraux'];
}

function hashFile(abs) {
  const buf = fs.readFileSync(abs);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function mediaFromPath(rel) {
  const abs = path.join(root, 'dossiergifs', rel);
  if (!fs.existsSync(abs)) return null;
  const sha = hashFile(abs);
  const base = path.basename(rel, path.extname(rel)).replace(/[^a-zA-Z0-9]+/g, '_').slice(0, 40);
  return {
    mediaId: `gif_troisieme_${base}_${sha.slice(0, 8)}`,
    sourcePath: rel,
    sourceCollection: 'troisieme dossier gif',
    sha256: sha,
  };
}

function readProposals() {
  return fs
    .readFileSync(PROPOSALS_PATH, 'utf8')
    .trim()
    .split(/\n/)
    .filter(Boolean)
    .map((l) => JSON.parse(l));
}

function existingNameSet() {
  const set = new Set();
  for (const [key, ex] of Object.entries(exerciseDatabase)) {
    set.add(norm(key));
    set.add(norm(ex.name));
    for (const v of ex.variations || []) set.add(norm(v));
  }
  return set;
}

function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  manifest.exercises = manifest.exercises || {};
  manifest.stretches = manifest.stretches || {};

  const proposals = readProposals().filter((p) => String(p.sourcePath || '').startsWith(PEC_PREFIX));
  const names = existingNameSet();
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

  // 1) Lier EXACT / HIGH déjà présents
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
      const media =
        rec.mediaId && rec.sha256
          ? {
              mediaId: rec.mediaId,
              sourcePath: rec.sourcePath,
              sourceCollection: rec.sourceCollection || 'troisieme dossier gif',
              sha256: rec.sha256,
            }
          : mediaFromPath(rec.sourcePath);
      if (!media) continue;
      const bucket = manifest.exercises[id] || { card: null, gif: null, videos: [] };
      if (!bucket.card) {
        bucket.card = media;
        bucket.gif = media;
        manifest.exercises[id] = bucket;
        usedPaths.add(media.sourcePath);
        linkedExisting += 1;
      }
    }
  }

  // 2) Nouvelles cartes NO_MATCH (exercices) + stretches
  for (const rec of proposals) {
    const rel = rec.sourcePath;
    if (usedPaths.has(rel)) continue;

    if (isStretchPath(rel) || !rec.proposedNewExercise) {
      if (!isStretchPath(rel)) continue;
      const slug = path.basename(rel);
      const key = stretchKeyFromSlug(slug);
      if (stretchDatabase[key] || newStretches[key]) {
        skippedDup += 1;
        continue;
      }
      const media =
        rec.mediaId && rec.sha256
          ? {
              mediaId: rec.mediaId,
              sourcePath: rel,
              sourceCollection: rec.sourceCollection || 'troisieme dossier gif',
              sha256: rec.sha256,
            }
          : mediaFromPath(rel);
      if (!media) continue;
      const name = titleFrFromSlug(slug);
      newStretches[key] = {
        name,
        category: 'Étirement',
        bodyZone: 'pectoraux',
        primaryMuscles: ['Pectoraux'],
        secondaryMuscles: ['Deltoïdes antérieurs'],
        equipment: /ball/i.test(slug) ? 'Ballon de stabilité' : 'Aucun',
        defaultDuration: 45,
        position: 'Debout ou assis selon le GIF',
        difficulty: 1,
        description: `Étirement des pectoraux — média banque (${slug}).`,
        instructions: 'Maintiens une amplitude confortable sans douleur, respire lentement, 2–4 cycles.',
        contraindications: ['Douleur articulaire épaule aiguë', 'Instabilité gléno-humérale non contrôlée'],
        variations: [slug.replace(/\.gif$/i, '').replace(/-/g, ' '), name.toLowerCase()],
      };
      manifest.stretches[`stretch:${key}`] = { card: media, gif: media, videos: [] };
      usedPaths.add(rel);
      createdSt += 1;
      continue;
    }

    if (rec.confidence !== 'NO_MATCH' && rec.confidence !== 'AMBIGUOUS') continue;

    const slug = path.basename(rel);
    const key = dbKeyFromSlug(slug);
    const name = titleFrFromSlug(slug);
    if (names.has(norm(key)) || names.has(norm(name)) || exerciseDatabase[key] || newExercises[key]) {
      skippedDup += 1;
      continue;
    }

    const media =
      rec.mediaId && rec.sha256
        ? {
            mediaId: rec.mediaId,
            sourcePath: rel,
            sourceCollection: rec.sourceCollection || 'troisieme dossier gif',
            sha256: rec.sha256,
          }
        : mediaFromPath(rel);
    if (!media) continue;

    newExercises[key] = {
      name,
      category: 'Pectoraux',
      primaryMuscles: inferPrimary(slug),
      secondaryMuscles: ['Triceps', 'Deltoïdes antérieurs'],
      equipment: inferEquipment(slug),
      difficulty: 2,
      isNew: true,
      description: `${name}. Variante pectoraux issue de la banque GIF (troisième dossier). Voir le média pour la trajectoire exacte.`,
      variations: [
        slug.replace(/\.gif$/i, '').replace(/-/g, ' '),
        rec.proposedNewExercise?.normalizedName,
        rec.proposedNewExercise?.displayName,
      ].filter(Boolean),
    };
    names.add(norm(key));
    names.add(norm(name));
    manifest.exercises[`db:${key}`] = { card: media, gif: media, videos: [] };
    usedPaths.add(rel);
    createdEx += 1;
  }

  // 3) Carte manquante connue : pompes et extension triceps — tenter deep-push-up / push-up déjà utilisés → laisser vidéo ; lier deep-push-up si libre
  const comboKey = 'pompes et extension triceps';
  const comboId = `db:${comboKey}`;
  if (manifest.exercises[comboId] && !manifest.exercises[comboId].card) {
    const candidate = `${PEC_PREFIX}deep-push-up.gif`;
    if (!usedPaths.has(candidate)) {
      const media = mediaFromPath(candidate);
      if (media) {
        manifest.exercises[comboId].card = media;
        manifest.exercises[comboId].gif = media;
        linkedExisting += 1;
        usedPaths.add(candidate);
      }
    }
  }

  const serializeBatch = (obj, exportName) =>
    `/** Généré par scripts/apply-pectoraux-bank-cards.mjs — ne pas éditer à la main. */\nexport const ${exportName} = ${JSON.stringify(obj, null, 2)};\n`;

  fs.writeFileSync(BATCH_EX_PATH, serializeBatch(newExercises, 'EXERCISE_DATABASE_PECTORAUX_GIF_BATCH'));
  fs.writeFileSync(BATCH_ST_PATH, serializeBatch(newStretches, 'STRETCH_DATABASE_PECTORAUX_GIF_BATCH'));
  manifest.generatedAt = new Date().toISOString();
  manifest.pectorauxBatch = {
    linkedExisting,
    createdEx,
    createdSt,
    skippedDup,
  };
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest));

  console.log(
    JSON.stringify(
      {
        linkedExisting,
        createdEx,
        createdSt,
        skippedDup,
        batchExFile: path.relative(root, BATCH_EX_PATH),
        batchStFile: path.relative(root, BATCH_ST_PATH),
      },
      null,
      2
    )
  );
}

main();
