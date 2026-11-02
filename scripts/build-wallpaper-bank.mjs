/**
 * Construit / met à jour public/wallpaper-bank à partir des dossiers sources.
 * - Rebuild complet depuis « images fond decran acuueil et verrouillage »
 * - Append de toutes les sources hors base (nouvelles bannieres, nouvelle banniere v2, …)
 * - Classe chaque image par thème (manifest.theme)
 *
 * Usage:
 *   node scripts/build-wallpaper-bank.mjs           # rebuild + append nouvelles
 *   node scripts/build-wallpaper-bank.mjs --append  # seulement append nouvelles
 *   node scripts/build-wallpaper-bank.mjs --themes  # reclasser le manifeste actuel
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const classicDir = path.join(root, 'images fond decran acuueil et verrouillage');
/** Dossiers hors base : scannés en append (ordre stable). */
const EXTRA_SOURCE_DIRS = [
  path.join(root, 'nouvelles bannieres'),
  path.join(root, 'nouvelle banniere v2'),
];
const outDir = path.join(root, 'public', 'wallpaper-bank');
const fullDir = path.join(outDir, 'full');
const thumbDir = path.join(outDir, 'thumbs');
const manifestPath = path.join(outDir, 'manifest.json');

const IMAGE_RE = /\.(jpe?g|png|webp)$/i;

/**
 * Règles ordonnées : la première qui matche gagne.
 * Objectif : moins de « Divers » / fourre-tout, catégories lisibles pour l’utilisateur.
 */
const THEME_RULES = [
  {
    theme: 'Spatial',
    re: /astronaute|orbital|plan[eè]te|espace|[eé]toil[eé]|m[eé]gastructure|nuages orbit|terre\b|fus[eé]e|cosmos|galact/i,
  },
  {
    theme: 'Cyberpunk',
    re: /cyberpunk|n[eé]on|m[eé]galopole|atrium|canal n[eé]on|corridor futuriste|lounge futuriste|salon cyberpunk|salon futuriste|piscine n[eé]on|laboratoire n[eé]on|chambre cyberpunk|bar futuriste|oasis n[eé]on|refuge n[eé]on|int[eé]rieur n[eé]on|biom[eé]canique|halo n[e9]on|futuriste/i,
  },
  {
    theme: 'Fantaisie',
    re: /dragon|monstre|chevalier|ch[aâ]teau|hant[eé]|spectral|crapaud|saiyan|guerrier masqu|cath[eé]drale biom|boucle infinie|temple|gardien|colossal|rituel|portail|totem|baroque|surr[eé]aliste/i,
  },
  {
    theme: 'Japon',
    re: /japon|sakura|lanterne|cerisier|village c[ôo]ti[eè]re|orientaliste/i,
  },
  {
    theme: 'Hiver',
    re: /neige|enneig|hiver|montagne enneig|parking enneig|tour enneig[eé]|hivernal|brume hivern/i,
  },
  {
    theme: 'Action',
    re: /guerrier|cavalier|ar[eè]ne|clinch|combat|ring|course-poursuite|patrouille|grimpeur|ascension|figures enflamm|incendie|flammes/i,
  },
  {
    theme: 'Art',
    re: /atelier|pastel|galerie|tableau|mosa[iï]que|impressionniste|abstrait|parchemin|peinture|œuvre|oeuvre|b[aâ]tonnets pastel|table d[’']artiste|ardoise/i,
  },
  {
    theme: 'Nature',
    re: /for[eê]t|clairi[eè]re|paysage|mer|plaine|brume|arbres|nuit [eé]toil[eé]e|silhouettes|voyageur|collines|prairie|vall[eé]e|haies|horizon|coucher du soleil|femme en blanc/i,
  },
  {
    theme: 'Urbain',
    re: /ville|ruelle|graffiti|nocturne urbaine|m[eé]tropole|parking|port industriel|avion [eé]cras[eé]|panneau|immeuble|briques|couloir|cour d|fen[eê]tre industrielle|valtess/i,
  },
  {
    theme: 'Intérieurs',
    re: /bureau|chambre|salon|bar |lounge|entrep[ôo]t|balcons|terrasse|chandelier|tapis|billard|fen[eê]tre|go dans un cadre/i,
  },
  {
    theme: 'Sombre',
    re: /glitch|cerveau|ruines|abandonn|interdit|surveillance|[oœ]il|victoire|abysses|d[eé]form[eé]|spirale|mosa[iï]que sombre|silhouettes rouges/i,
  },
  {
    theme: 'Scènes',
    re: /train|village|route|pont|porche|marcheur|poule|vague de verre|cirque|go\b| porsche|voiture/i,
  },
];

export function inferWallpaperTheme(name = '') {
  const label = String(name || '');
  const bare = label.replace(/\s*\(\d+\)(\s*\(\d+\))*\s*$/g, '').replace(/\s+\d+\s*$/g, '').trim();
  // Génératif sans titre descriptif → catégorie dédiée (plus claire que « Divers »)
  if (/^ChatGPT Image/i.test(label) || /^instagram/i.test(label)) return 'Génératif';
  for (const rule of THEME_RULES) {
    if (rule.re.test(label)) return rule.theme;
  }
  // UUID / noms techniques de l’ancienne banque (avec suffixes « (1) », « 2 », …)
  if (
    /^[0-9A-F]{8}-[0-9A-F-]{4,}$/i.test(bare) ||
    /^[0-9A-F-]{8,}$/i.test(bare) ||
    /^original-/i.test(label)
  ) {
    return 'Classiques';
  }
  return 'Scènes';
}

function extOf(name) {
  const ext = path.extname(name).toLowerCase();
  if (ext === '.jpeg') return '.jpg';
  return ext;
}

function listImages(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => IMAGE_RE.test(name))
    .sort((a, b) => a.localeCompare(b, 'fr'));
}

/** Normalise pour dédup : retire suffixes (1), (1) (1), espaces parasites. */
function normalizeDisplayKey(displayName) {
  return String(displayName || '')
    .replace(/\s*\(\d+\)(\s*\(\d+\))*\s*$/g, '')
    .trim()
    .toLocaleLowerCase('fr');
}

function readManifest() {
  if (!fs.existsSync(manifestPath)) return { version: 1, count: 0, images: [] };
  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch {
    return { version: 1, count: 0, images: [] };
  }
}

function writeManifest(images) {
  const withThemes = images.map((img) => ({
    ...img,
    theme: inferWallpaperTheme(img.name),
  }));
  const themes = [...new Set(withThemes.map((img) => img.theme))].sort((a, b) =>
    a.localeCompare(b, 'fr')
  );
  const manifest = {
    version: 2,
    count: withThemes.length,
    themes,
    images: withThemes,
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest));
  return manifest;
}

async function processFile(srcPath, id, displayName, meta = {}) {
  const ext = extOf(path.basename(srcPath));
  const fileName = `${id}${ext}`;
  fs.copyFileSync(srcPath, path.join(fullDir, fileName));
  await sharp(srcPath)
    .rotate()
    .resize({ width: 480, withoutEnlargement: true })
    .webp({ quality: 72 })
    .toFile(path.join(thumbDir, `${id}.webp`));
  const batch = meta.newBatch || null;
  return {
    id,
    name: displayName,
    theme: inferWallpaperTheme(displayName),
    src: `/wallpaper-bank/full/${fileName}`,
    thumb: `/wallpaper-bank/thumbs/${id}.webp`,
    source: meta.source || 'classic',
    isNew: Boolean(meta.isNew),
    newBatch: batch,
  };
}

/** Marque isNew / newBatch selon les dossiers « nouvelles bannieres » (+ v2). */
function markNewFromExtraDirs(images) {
  const byKey = new Map();
  for (const dir of EXTRA_SOURCE_DIRS) {
    if (!fs.existsSync(dir)) continue;
    const batch = /v2/i.test(path.basename(dir)) ? 'v2' : 'nouvelles';
    for (const name of listImages(dir)) {
      const displayName = path.basename(name, path.extname(name));
      byKey.set(normalizeDisplayKey(displayName), batch);
    }
  }
  let marked = 0;
  const next = images.map((img) => {
    const batch = byKey.get(normalizeDisplayKey(img.name));
    if (!batch) {
      return {
        ...img,
        source: img.source || 'classic',
        isNew: false,
        newBatch: null,
      };
    }
    marked += 1;
    return {
      ...img,
      source: batch,
      isNew: true,
      newBatch: batch,
    };
  });
  console.log(`Étiquettes « Nouveau » : ${marked} images (nouvelles + v2)`);
  return next;
}

function nextId(images) {
  let max = 0;
  for (const img of images) {
    const m = /^w(\d+)$/i.exec(img.id || '');
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max + 1;
}

async function rebuildClassic() {
  if (!fs.existsSync(classicDir)) {
    console.error('Dossier source introuvable:', classicDir);
    process.exit(1);
  }
  fs.mkdirSync(fullDir, { recursive: true });
  fs.mkdirSync(thumbDir, { recursive: true });

  const files = listImages(classicDir);
  const images = [];
  for (let i = 0; i < files.length; i += 1) {
    const name = files[i];
    const id = `w${String(i + 1).padStart(3, '0')}`;
    const displayName = path.basename(name, path.extname(name));
    images.push(await processFile(path.join(classicDir, name), id, displayName));
    if ((i + 1) % 25 === 0) console.log(`classiques ${i + 1}/${files.length}`);
  }
  return images;
}

async function appendFromDir(images, dir, label) {
  const files = listImages(dir);
  if (!files.length) {
    console.warn(`[${label}] aucune image dans`, dir);
    return images;
  }

  const existingNames = new Set(images.map((img) => normalizeDisplayKey(img.name)));
  const existingBasenames = new Set(
    images.map((img) => path.basename(img.src || '', path.extname(img.src || '')))
  );

  let cursor = nextId(images);
  const next = [...images];
  let added = 0;
  let skipped = 0;

  for (const name of files) {
    const displayName = path.basename(name, path.extname(name));
    const key = normalizeDisplayKey(displayName);
    if (existingNames.has(key)) {
      skipped += 1;
      continue;
    }
    const id = `w${String(cursor).padStart(3, '0')}`;
    cursor += 1;
    if (existingBasenames.has(id)) continue;

    const batch = /v2/i.test(label) ? 'v2' : 'nouvelles';
    const entry = await processFile(path.join(dir, name), id, displayName, {
      source: batch,
      isNew: true,
      newBatch: batch,
    });
    next.push(entry);
    existingNames.add(key);
    added += 1;
    if (added % 10 === 0) console.log(`[${label}] +${added}/${files.length}`);
  }

  console.log(`[${label}] +${added} (skip ${skipped} déjà présents)`);
  return next;
}

async function appendAllExtra(images) {
  let next = images;
  for (const dir of EXTRA_SOURCE_DIRS) {
    const label = path.basename(dir);
    if (!fs.existsSync(dir)) {
      console.warn(`Dossier absent (ignoré): ${label}`);
      continue;
    }
    console.log(`Append « ${label} »…`);
    next = await appendFromDir(next, dir, label);
  }
  return next;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  fs.mkdirSync(fullDir, { recursive: true });
  fs.mkdirSync(thumbDir, { recursive: true });

  if (args.has('--themes')) {
    const current = readManifest();
    const tagged = markNewFromExtraDirs(current.images || []);
    const manifest = writeManifest(tagged);
    const counts = {};
    for (const img of manifest.images) {
      counts[img.theme] = (counts[img.theme] || 0) + 1;
    }
    console.log(`Thèmes mis à jour: ${manifest.count} images`);
    console.log(counts);
    return;
  }

  let images;
  if (args.has('--append')) {
    images = readManifest().images || [];
    if (!images.length) {
      console.error('Manifeste vide — lancez un rebuild complet d’abord.');
      process.exit(1);
    }
  } else {
    console.log('Rebuild classiques…');
    images = await rebuildClassic();
  }

  images = await appendAllExtra(images);
  images = markNewFromExtraDirs(images);
  const manifest = writeManifest(images);
  const counts = {};
  for (const img of manifest.images) {
    counts[img.theme] = (counts[img.theme] || 0) + 1;
  }
  console.log(
    `Banque prête: ${manifest.count} images · thèmes: ${manifest.themes.join(', ')}`
  );
  console.log(counts);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
