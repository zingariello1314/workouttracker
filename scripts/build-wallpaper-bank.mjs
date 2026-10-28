/**
 * Construit / met à jour public/wallpaper-bank à partir des dossiers sources.
 * - Rebuild complet depuis « images fond decran acuueil et verrouillage »
 * - Append des « nouvelles bannieres » sans écraser les ids existants
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
const newDir = path.join(root, 'nouvelles bannieres');
const outDir = path.join(root, 'public', 'wallpaper-bank');
const fullDir = path.join(outDir, 'full');
const thumbDir = path.join(outDir, 'thumbs');
const manifestPath = path.join(outDir, 'manifest.json');

const IMAGE_RE = /\.(jpe?g|png|webp)$/i;

const THEME_RULES = [
  { theme: 'Cyberpunk', re: /cyberpunk|n[ée]on|m[ée]gastructure|rooftop|m[ée]galopole|atrium|canal n[ée]on|corridor futuriste|lounge futuriste|salon cyberpunk|salon futuriste|piscine n[ée]on|laboratoire n[ée]on|chambre cyberpunk|bar futuriste|oasis n[ée]on|refuge n[ée]on|int[ée]rieur n[ée]on/i },
  { theme: 'Japon', re: /japon|sakura|lanterne|cerisier|village c[ôo]ti[eè]re/i },
  { theme: 'Hiver', re: /neige|enneig|hiver|montagne enneig|parking enneig|tour enneig[ée]/i },
  { theme: 'Nature', re: /for[eê]t|clairi[eè]re|paysage|mer|plaine|brume|arbres|nuit [ée]toil[ée]e|silhouettes|voyageur/i },
  { theme: 'Urbain', re: /ville|ruelle|graffiti|nocturne urbaine|m[ée]tropole|parking|port industriel|avion [ée]cras[ée]|panneau/i },
  { theme: 'Action', re: /guerrier|cavalier|ar[eè]ne|clinch|patrouille|grimpeur|ascension|rituel|gardien|temple industriel/i },
  { theme: 'Art', re: /atelier|galerie|tableau|mosa[iï]que|impressionniste|baroque|totem|abstrait|surr[ée]aliste|orientaliste|parchemin/i },
  { theme: 'Intérieurs', re: /bureau|chambre|salon|bar |lounge|entrep[ôo]t|couloir|balcons|temple abstrait|terrasse/i },
  { theme: 'Sombre', re: /glitch|cerveau|incendie|flammes|ruines|abandonn|interdit|surveillance|œil|oeil|victoire/i },
];

export function inferWallpaperTheme(name = '') {
  const label = String(name || '');
  if (/^ChatGPT Image/i.test(label) || /^instagram/i.test(label)) return 'Divers';
  for (const rule of THEME_RULES) {
    if (rule.re.test(label)) return rule.theme;
  }
  // UUID / noms techniques de l’ancienne banque
  if (/^[0-9A-F-]{8,}$/i.test(label) || /^original-/i.test(label)) return 'Classiques';
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
    theme: img.theme || inferWallpaperTheme(img.name),
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

async function processFile(srcPath, id, displayName) {
  const ext = extOf(path.basename(srcPath));
  const fileName = `${id}${ext}`;
  fs.copyFileSync(srcPath, path.join(fullDir, fileName));
  await sharp(srcPath)
    .rotate()
    .resize({ width: 480, withoutEnlargement: true })
    .webp({ quality: 72 })
    .toFile(path.join(thumbDir, `${id}.webp`));
  return {
    id,
    name: displayName,
    theme: inferWallpaperTheme(displayName),
    src: `/wallpaper-bank/full/${fileName}`,
    thumb: `/wallpaper-bank/thumbs/${id}.webp`,
  };
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

async function appendNew(images) {
  const files = listImages(newDir);
  if (!files.length) {
    console.warn('Aucune nouvelle bannière dans', newDir);
    return images;
  }

  const existingNames = new Set(
    images.map((img) => String(img.name || '').trim().toLocaleLowerCase('fr'))
  );
  // Aussi dédupliquer si un fichier a déjà été importé sous un nom proche
  const existingBasenames = new Set(
    images.map((img) => {
      const base = path.basename(img.src || '', path.extname(img.src || ''));
      return base;
    })
  );

  let cursor = nextId(images);
  const next = [...images];
  let added = 0;

  for (const name of files) {
    const displayName = path.basename(name, path.extname(name));
    const key = displayName.trim().toLocaleLowerCase('fr');
    if (existingNames.has(key)) {
      console.log(`skip (déjà présent): ${displayName}`);
      continue;
    }
    const id = `w${String(cursor).padStart(3, '0')}`;
    cursor += 1;
    if (existingBasenames.has(id)) continue;

    const entry = await processFile(path.join(newDir, name), id, displayName);
    next.push(entry);
    existingNames.add(key);
    added += 1;
    if (added % 10 === 0) console.log(`nouvelles +${added}/${files.length}`);
  }

  console.log(`Append: ${added} nouvelles bannières`);
  return next;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  fs.mkdirSync(fullDir, { recursive: true });
  fs.mkdirSync(thumbDir, { recursive: true });

  if (args.has('--themes')) {
    const current = readManifest();
    const manifest = writeManifest(current.images || []);
    console.log(`Thèmes mis à jour: ${manifest.count} images, ${manifest.themes.length} thèmes`);
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

  console.log('Append nouvelles bannières…');
  images = await appendNew(images);
  const manifest = writeManifest(images);
  console.log(
    `Banque prête: ${manifest.count} images · thèmes: ${manifest.themes.join(', ')}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
