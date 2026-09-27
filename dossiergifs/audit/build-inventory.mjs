/**
 * Phase 0–3 de l'audit banque : inventaire, schémas JSON, index média, doublons physiques.
 * N'assigne aucune correspondance Momentum.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const REPO = path.resolve(ROOT, '..');
const OUT = __dirname;

const COLLECTIONS = {
  gifs: { dir: ROOT, role: 'card_media', skipTop: new Set(['deuxieme dossier gif', 'troisieme dossier gif', 'quatrieme dossier gif', 'videos muscles', 'audit']) },
  'deuxieme dossier gif': { dir: path.join(ROOT, 'deuxieme dossier gif'), role: 'card_media' },
  'troisieme dossier gif': { dir: path.join(ROOT, 'troisieme dossier gif'), role: 'card_media' },
  'quatrieme dossier gif': { dir: path.join(ROOT, 'quatrieme dossier gif'), role: 'card_media' },
  'videos muscles': { dir: path.join(ROOT, 'videos muscles'), role: 'pedagogical_video' }
};

const MEDIA_EXT = new Set(['.gif', '.mp4', '.webp', '.webm', '.mov', '.jpg', '.jpeg', '.png']);

function walk(dir, skipTop) {
  const out = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    if (skipTop && skipTop.has(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function rel(full) {
  return path.relative(ROOT, full).split(path.sep).join('/');
}

function magic(full) {
  const fd = fs.openSync(full, 'r');
  const buf = Buffer.alloc(12);
  const n = fs.readSync(fd, buf, 0, 12, 0);
  fs.closeSync(fd);
  return buf.subarray(0, n);
}

function isIsoBmff(buf) {
  return buf.length >= 8 && buf.subarray(4, 8).toString('latin1') === 'ftyp';
}

function sha256(full) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(full);
    stream.on('data', (c) => hash.update(c));
    stream.on('error', reject);
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

async function mapPool(items, limit, fn) {
  const ret = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      ret[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return ret;
}

function slugId(collection, relativePath, hash) {
  const token = relativePath
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(-48);
  const prefix = {
    gifs: 'gif_root',
    'deuxieme dossier gif': 'gif_deuxieme',
    'troisieme dossier gif': 'gif_troisieme',
    'quatrieme dossier gif': 'gif_quatrieme',
    'videos muscles': 'video_muscles'
  }[collection] || 'media';
  return `${prefix}_${token}_${hash.slice(0, 8)}`;
}

function normName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function nameClass(filename) {
  const stem = filename.replace(/\.[^.]+$/, '').trim();
  if (/toutes les variantes/i.test(stem)) return 'all_variants';
  if (/^\d+$/.test(stem)) return 'numeric_only';
  if (/^\d{4}-[A-Za-z0-9]+$/.test(stem)) return 'id_plus_opaque';
  if (/^[A-Za-z0-9]{5,12}$/.test(stem) && /\d/.test(stem) && /[A-Za-z]/.test(stem)) return 'opaque_id';
  if (/^[a-z0-9]+(?:-[a-z0-9]+)+$/i.test(stem)) return 'slug';
  if (/\d/.test(stem) && /[a-zA-ZÀ-ÿ]/.test(stem)) return 'words_with_number';
  if (/[a-zA-ZÀ-ÿ]/.test(stem)) return 'words';
  return 'other';
}

function exploitableStem(filename, cls) {
  return cls === 'words' || cls === 'words_with_number' || cls === 'all_variants' || cls === 'slug';
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function unwrapExerciseList(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.exercises)) return data.exercises;
  throw new Error('catalogue exercices inattendu');
}

function keysOf(sample) {
  if (Array.isArray(sample)) return { container: 'array', length: sample.length, itemKeys: sample[0] && typeof sample[0] === 'object' ? Object.keys(sample[0]) : [] };
  if (sample && typeof sample === 'object') return { container: 'object', keys: Object.keys(sample) };
  return { container: typeof sample };
}

function countScoringNames() {
  const dir = path.join(REPO, 'src/data/exerciseScoring');
  const names = [];
  for (const file of fs.readdirSync(dir)) {
    if (!file.startsWith('catalog') || !file.endsWith('.js') || file === 'catalogHelpers.js') continue;
    const text = fs.readFileSync(path.join(dir, file), 'utf8');
    for (const match of text.matchAll(/scoringEntry\(\s*'([^']+)'/g)) names.push(match[1]);
    for (const match of text.matchAll(/scoringEntry\(\s*"([^"]+)"/g)) names.push(match[1]);
  }
  return names;
}

function countExerciseDatabase() {
  const text = fs.readFileSync(path.join(REPO, 'src/data/exerciseDatabase.js'), 'utf8');
  const keys = [];
  const re = /^ {2}"([^"]+)": \{/gm;
  let m;
  while ((m = re.exec(text))) keys.push(m[1]);
  const names = [];
  const nameRe = /^ {4}name: "([^"]+)"/gm;
  while ((m = nameRe.exec(text))) names.push(m[1]);
  return { keys: keys.length, names };
}

function countCardio() {
  const text = fs.readFileSync(path.join(REPO, 'src/data/cardioExerciseCatalog.js'), 'utf8');
  const ids = [...text.matchAll(/id: '([^']+)'/g)].map((m) => m[1]);
  const names = [...text.matchAll(/name: '([^']+)'/g)].map((m) => m[1]);
  return { ids: ids.length, names };
}

async function main() {
  const started = Date.now();
  const filesByCollection = {};
  const mediaRecords = [];
  const problematic = [];

  for (const [collection, cfg] of Object.entries(COLLECTIONS)) {
    const files = walk(cfg.dir, cfg.skipTop);
    const byExt = {};
    for (const full of files) {
      const ext = path.extname(full).toLowerCase() || '(noext)';
      byExt[ext] = (byExt[ext] || 0) + 1;
      const relativePath = rel(full);
      const stat = fs.statSync(full);
      const filename = path.basename(full);
      const catalogFilename = filename.replace(/\s+\(\d+\)(?=\.[^.]+$)/, '');
      let detectedExt = ext;
      if (ext === '.json' || ext === '(noext)' || ext === '.md') {
        const buf = magic(full);
        if (isIsoBmff(buf)) {
          detectedExt = '.mp4';
          problematic.push({
            relativePath,
            issue: 'extension_ne_correspond_pas_au_contenu',
            declaredExtension: ext,
            detected: 'mp4/iso-bmff',
            bytes: stat.size
          });
        }
      }
      const isMedia = MEDIA_EXT.has(ext) || detectedExt === '.mp4';
      if (!isMedia) continue;
      const inRoutines = relativePath.startsWith('videos muscles/routines/');
      let role = cfg.role;
      if (collection === 'videos muscles' && inRoutines) role = 'routine';
      if (ext === '.webp') role = 'thumb_companion';
      const cls = nameClass(catalogFilename);
      mediaRecords.push({
        sourceCollection: collection,
        relativePath,
        filename,
        catalogFilename,
        windowsDuplicateSuffix: catalogFilename !== filename,
        extension: detectedExt === '.mp4' && ext !== '.mp4' ? '.mp4' : ext,
        declaredExtension: ext,
        bytes: stat.size,
        role,
        filenameClass: cls,
        filenameExploitable: exploitableStem(catalogFilename, cls),
        metadata: {}
      });
    }
    filesByCollection[collection] = { files: files.length, byExt };
  }

  console.log('hashing', mediaRecords.length, 'media files...');
  await mapPool(mediaRecords, 8, async (rec) => {
    const full = path.join(ROOT, rec.relativePath);
    rec.sha256 = await sha256(full);
    rec.mediaId = slugId(rec.sourceCollection, rec.relativePath, rec.sha256);
  });

  const rootExercises = readJson(path.join(ROOT, 'exercises (2).json'));
  const rootBody = readJson(path.join(ROOT, 'bodyParts.json'));
  const rootEq = readJson(path.join(ROOT, 'equipments (2).json'));
  const rootMuscles = readJson(path.join(ROOT, 'muscles (2).json'));
  const byGif = new Map(rootExercises.map((ex) => [ex.gifUrl, ex]));
  for (const rec of mediaRecords) {
    if (rec.sourceCollection !== 'gifs' || rec.extension !== '.gif') continue;
    const meta = byGif.get(rec.catalogFilename);
    if (meta) {
      rec.metadata = {
        localId: meta.exerciseId,
        name: meta.name,
        bodyParts: meta.bodyParts,
        equipments: meta.equipments,
        targetMuscles: meta.targetMuscles,
        secondaryMuscles: meta.secondaryMuscles,
        normalizedName: normName(meta.name)
      };
    }
  }

  const qExercises = readJson(path.join(ROOT, 'quatrieme dossier gif/data/exercises.json'));
  const byGifUrl = new Map(qExercises.map((ex) => [path.basename(ex.gif_url), ex]));
  for (const rec of mediaRecords) {
    if (rec.sourceCollection !== 'quatrieme dossier gif' || rec.extension !== '.gif') continue;
    const meta = byGifUrl.get(rec.filename);
    if (meta) {
      rec.metadata = {
        localId: meta.id,
        mediaRef: meta.media_id,
        name: meta.name,
        bodyPart: meta.body_part,
        equipment: meta.equipment,
        target: meta.target,
        muscleGroup: meta.muscle_group,
        secondaryMuscles: meta.secondary_muscles,
        instructionLanguages: meta.instructions ? Object.keys(meta.instructions) : [],
        normalizedName: normName(meta.name)
      };
    }
  }

  const enExercisesPath = path.join(ROOT, 'troisieme dossier gif/api/en/exercises.json');
  const esExercisesPath = path.join(ROOT, 'troisieme dossier gif/api/es/exercises.json');
  const enList = unwrapExerciseList(readJson(enExercisesPath));
  const esList = unwrapExerciseList(readJson(esExercisesPath));
  const byFile = new Map(enList.map((ex) => [ex.file, ex]));
  const esById = new Map(esList.map((ex) => [ex.id, ex]));
  for (const rec of mediaRecords) {
    if (rec.sourceCollection !== 'troisieme dossier gif' || rec.extension !== '.gif') continue;
    const fileKey = rec.relativePath.replace(/^troisieme dossier gif\//, '');
    const meta = byFile.get(fileKey);
    if (!meta) continue;
    const es = esById.get(meta.id);
    rec.metadata = {
      localId: meta.id,
      slug: meta.slug,
      name: meta.name,
      nameEs: es?.name || null,
      bodyPart: meta.bodyPart,
      equipment: meta.equipment,
      muscle: meta.muscle,
      category: meta.category,
      secondaryMuscles: meta.secondaryMuscles,
      normalizedName: normName(meta.name)
    };
  }

  const qIds = new Set(qExercises.map((ex) => ex.id));
  for (const rec of mediaRecords) {
    if (rec.sourceCollection !== 'deuxieme dossier gif') continue;
    const stem = rec.filename.replace(/\.[^.]+$/, '');
    rec.metadata = {
      numericStem: /^\d+$/.test(stem) ? stem : null,
      quatriemeIdHit: /^\d+$/.test(stem) ? qIds.has(stem) : false,
      normalizedName: null
    };
  }

  const db = countExerciseDatabase();
  const scoringNames = countScoringNames();
  const cardio = countCardio();
  const fused = new Set();
  for (const name of [...db.names, ...scoringNames, ...cardio.names]) {
    const n = normName(name);
    if (n) fused.add(n);
  }

  const hashGroups = new Map();
  for (const rec of mediaRecords) {
    if (rec.role === 'thumb_companion') continue;
    if (!hashGroups.has(rec.sha256)) hashGroups.set(rec.sha256, []);
    hashGroups.get(rec.sha256).push(rec.relativePath);
  }
  const physicalDupes = [...hashGroups.entries()]
    .filter(([, paths]) => paths.length > 1)
    .map(([sha, paths]) => ({ sha256: sha, count: paths.length, paths }));

  const rootIds = new Set(rootExercises.map((ex) => ex.exerciseId));
  const qMediaIds = new Set(qExercises.map((ex) => ex.media_id));
  const rootInQ = [...rootIds].filter((id) => qMediaIds.has(id));

  function nameSet(records, field) {
    const s = new Set();
    for (const rec of records) {
      const n = rec.metadata?.[field];
      if (n) s.add(n);
    }
    return s;
  }
  const rootNames = nameSet(mediaRecords.filter((r) => r.sourceCollection === 'gifs'), 'normalizedName');
  const qNames = nameSet(mediaRecords.filter((r) => r.sourceCollection === 'quatrieme dossier gif'), 'normalizedName');
  const tNames = nameSet(mediaRecords.filter((r) => r.sourceCollection === 'troisieme dossier gif' && r.extension === '.gif'), 'normalizedName');
  const inter = (a, b) => [...a].filter((n) => b.has(n)).length;

  const enIds = new Set(enList.map((ex) => ex.id));
  const esIds = new Set(esList.map((ex) => ex.id));
  const onlyEn = [...enIds].filter((id) => !esIds.has(id));
  const onlyEs = [...esIds].filter((id) => !enIds.has(id));

  const qIdList = qExercises.map((ex) => Number(ex.id)).sort((a, b) => a - b);
  const qMissingInSpan = [];
  for (let n = qIdList[0]; n <= qIdList[qIdList.length - 1]; n++) {
    if (!qIds.has(String(n).padStart(4, '0'))) qMissingInSpan.push(n);
  }

  const d2Stems = mediaRecords
    .filter((r) => r.sourceCollection === 'deuxieme dossier gif' && r.metadata.numericStem)
    .map((r) => Number(r.metadata.numericStem))
    .sort((a, b) => a - b);
  const d2Gaps = [];
  if (d2Stems.length) {
    for (let n = d2Stems[0]; n <= d2Stems[d2Stems.length - 1]; n++) {
      if (!d2Stems.includes(n)) d2Gaps.push(n);
    }
  }

  const gifLinked = {
    gifs: mediaRecords.filter((r) => r.sourceCollection === 'gifs' && r.extension === '.gif' && r.metadata.localId).length,
    gifsTotal: mediaRecords.filter((r) => r.sourceCollection === 'gifs' && r.extension === '.gif').length,
    quatrieme: mediaRecords.filter((r) => r.sourceCollection === 'quatrieme dossier gif' && r.extension === '.gif' && r.metadata.localId).length,
    quatriemeTotal: mediaRecords.filter((r) => r.sourceCollection === 'quatrieme dossier gif' && r.extension === '.gif').length,
    troisieme: mediaRecords.filter((r) => r.sourceCollection === 'troisieme dossier gif' && r.extension === '.gif' && r.metadata.localId).length,
    troisiemeTotal: mediaRecords.filter((r) => r.sourceCollection === 'troisieme dossier gif' && r.extension === '.gif').length
  };

  const videos = mediaRecords.filter((r) => r.sourceCollection === 'videos muscles');
  const videoClass = {};
  for (const rec of videos) videoClass[rec.filenameClass] = (videoClass[rec.filenameClass] || 0) + 1;

  const schema = {
    gifs: {
      files: {
        'bodyParts.json': { ...keysOf(rootBody), idField: null, note: 'liste de {name} sans id' },
        'equipments (2).json': { ...keysOf(rootEq), idField: null, note: 'liste de {name} sans id' },
        'muscles (2).json': { ...keysOf(rootMuscles), idField: null, note: 'liste de {name} sans id' },
        'exercises (2).json': {
          ...keysOf(rootExercises),
          idField: 'exerciseId',
          uniqueIds: new Set(rootExercises.map((e) => e.exerciseId)).size,
          nameLanguage: 'en',
          instructions: 'tableau de chaînes anglaises Step:N'
        }
      },
      separateCatalogs: true
    },
    'deuxieme dossier gif': {
      files: {},
      separateCatalogs: false,
      note: 'Aucun JSON de catalogue. 50gymworkouts.json est un MP4 mal nommé.'
    },
    'troisieme dossier gif': {
      canonicalLanguage: 'en',
      mirrorLanguage: 'es',
      exerciseCountEn: enList.length,
      exerciseCountEs: esList.length,
      idsOnlyInEn: onlyEn.length,
      idsOnlyInEs: onlyEs.length,
      exerciseItemKeys: Object.keys(enList[0] || {}),
      idField: 'id (muscle/slug), pas un entier global',
      catalogs: {
        'bodyparts.json': 'tableau {bodyPart, count, endpoint}, 7 entrées, sans id stable autre que le slug',
        'equipment.json': 'tableau {equipment, count, endpoint}, 12 entrées',
        'muscles.json': 'tableau {muscle, count, endpoint}, 19 entrées',
        'categories.json': 'tableau {category, count, endpoint}, 4 entrées',
        'exercises.json': 'objet {count, exercises[]}, pas un tableau nu'
      },
      note: 'Les catalogues existent en double en/ et es/. Les fichiers par exercice sous api/*/exercises/ répètent exercises.json. Les identifiants sont des slugs, pas des entiers.'
    },
    'quatrieme dossier gif': {
      files: ['data/exercises.json', 'data/exercises.schema.json'],
      exerciseCount: qExercises.length,
      uniqueIds: new Set(qExercises.map((e) => e.id)).size,
      uniqueMediaIds: qMediaIds.size,
      itemKeys: Object.keys(qExercises[0] || {}),
      idField: 'id sur 4 chiffres, non contigu',
      idMin: String(qIdList[0]).padStart(4, '0'),
      idMax: String(qIdList[qIdList.length - 1]).padStart(4, '0'),
      numbersAbsentInsideMinMax: qMissingInSpan.length,
      instructionLanguages: qExercises[0]?.instructions ? Object.keys(qExercises[0].instructions) : [],
      separateBodyPartsFile: false,
      note: 'body_part et equipment sont des champs string. Le schéma enumère les body parts. Pas de bodyParts.json / muscles.json séparés. gif_url = videos/{id}-{media_id}.gif. Le champ image pointe vers images/ qui n’est pas dans le dossier.'
    },
    schemasIdentical: false,
    parser: 'adaptateurs requis vers un pivot commun'
  };

  const imagesDir = path.join(ROOT, 'quatrieme dossier gif/images');
  schema['quatrieme dossier gif'].imagesFolderPresent = fs.existsSync(imagesDir);

  const summary = {
    generatedAt: new Date().toISOString(),
    elapsedMs: Date.now() - started,
    momentum: {
      exerciseDatabaseKeys: db.keys,
      exerciseDatabaseNames: db.names.length,
      scoringEntries: scoringNames.length,
      cardioReference: cardio.ids,
      uniqueNormalizedNamesAcrossSources: fused.size,
      note: 'uniqueNormalizedNamesAcrossSources déduplique les trois sources par nom normalisé, dans l’esprit de la fusion de l’onglet Banque. Ce n’est pas encore le rendu écran (enrichissement, alias).'
    },
    filesByCollection,
    mediaCounts: {
      byCollectionAndRole: countBy(mediaRecords, (r) => `${r.sourceCollection} | ${r.role} | ${r.extension}`),
      filenameClassByCollection: countBy(mediaRecords, (r) => `${r.sourceCollection} | ${r.filenameClass}`),
      filenameExploitable: countBy(
        mediaRecords.filter((r) => r.role !== 'thumb_companion'),
        (r) => `${r.sourceCollection} | exploitableFilename=${r.filenameExploitable}`
      ),
      catalogNamePresent: {
        gifs: gifLinked.gifs,
        quatrieme: gifLinked.quatrieme,
        troisiemeGif: gifLinked.troisieme,
        deuxiemeWithCatalogName: 0,
        videosMusclesWithCatalogName: 0
      }
    },
    videoFilenameClasses: videoClass,
    pedagogicalVideos: videos.filter((r) => r.role === 'pedagogical_video').map((r) => r.filename).sort(),
    routines: videos.filter((r) => r.role === 'routine').map((r) => r.filename).sort(),
    allVariantsFiles: mediaRecords.filter((r) => r.filenameClass === 'all_variants').map((r) => r.relativePath),
    problematic,
    physicalDuplicates: {
      groups: physicalDupes.length,
      extraCopies: physicalDupes.reduce((n, g) => n + g.count - 1, 0),
      groupsDetail: physicalDupes
    },
    catalogOverlap: {
      rootMediaIdInsideQuatrieme: rootInQ.length,
      rootMediaIdTotal: rootIds.size,
      normalizedNameRootInsideQuatrieme: inter(rootNames, qNames),
      normalizedNameTroisiemeInsideQuatrieme: inter(tNames, qNames),
      rootNames: rootNames.size,
      troisiemeGifNames: tNames.size,
      quatriemeNames: qNames.size
    },
    deuxiemeNumeric: {
      count: d2Stems.length,
      min: d2Stems[0] ?? null,
      max: d2Stems[d2Stems.length - 1] ?? null,
      gapsInsideMinMax: d2Gaps,
      stemsAlsoQuatriemeId: mediaRecords.filter((r) => r.sourceCollection === 'deuxieme dossier gif' && r.metadata.quatriemeIdHit).length,
      stemsMissingFromQuatrieme: mediaRecords
        .filter((r) => r.sourceCollection === 'deuxieme dossier gif' && r.metadata.numericStem && !r.metadata.quatriemeIdHit)
        .map((r) => r.filename)
    },
    quatriemeDuplicateNames: duplicateNames(qExercises.map((ex) => ex.name)),
    troisiemeDuplicateNames: duplicateNames(enList.map((ex) => ex.name)),
    jsonLinkCoverage: gifLinked,
    schema,
    matching: 'non exécuté — aucune confiance EXACT/HIGH/PROBABLE/AMBIGUOUS/NO_MATCH assignée'
  };

  fs.writeFileSync(path.join(OUT, 'inventory.json'), JSON.stringify(summary, null, 2));
  const indexStream = fs.createWriteStream(path.join(OUT, 'media-index.jsonl'));
  for (const rec of mediaRecords) indexStream.write(JSON.stringify(rec) + '\n');
  indexStream.end();
  console.log('wrote inventory.json and media-index.jsonl');
  console.log(JSON.stringify({
    media: mediaRecords.length,
    physicalDupeGroups: physicalDupes.length,
    momentumDb: db.keys,
    scoring: scoringNames.length,
    cardio: cardio.ids,
    ms: Date.now() - started
  }));
}

function countBy(items, fn) {
  const m = {};
  for (const item of items) {
    const k = fn(item);
    m[k] = (m[k] || 0) + 1;
  }
  return m;
}

function duplicateNames(names) {
  const counts = new Map();
  for (const name of names) {
    const key = normName(name);
    if (!key) continue;
    if (!counts.has(key)) counts.set(key, []);
    counts.get(key).push(name);
  }
  return [...counts.entries()]
    .filter(([, list]) => list.length > 1)
    .map(([normalized, list]) => ({ normalized, count: list.length, names: [...new Set(list)] }));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
