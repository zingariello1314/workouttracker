/**
 * Copie le dossier de fonds à la racine vers public/wallpaper-bank
 * et écrit un manifeste servi à tous les utilisateurs.
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const srcDir = path.join(root, 'images fond decran acuueil et verrouillage');
const outDir = path.join(root, 'public', 'wallpaper-bank');
const fullDir = path.join(outDir, 'full');
const thumbDir = path.join(outDir, 'thumbs');

const IMAGE_RE = /\.(jpe?g|png|webp)$/i;

function extOf(name) {
  const ext = path.extname(name).toLowerCase();
  if (ext === '.jpeg') return '.jpg';
  return ext;
}

async function main() {
  if (!fs.existsSync(srcDir)) {
    console.error('Dossier source introuvable:', srcDir);
    process.exit(1);
  }
  fs.mkdirSync(fullDir, { recursive: true });
  fs.mkdirSync(thumbDir, { recursive: true });

  const files = fs
    .readdirSync(srcDir)
    .filter((name) => IMAGE_RE.test(name))
    .sort((a, b) => a.localeCompare(b, 'fr'));

  const images = [];
  for (let i = 0; i < files.length; i += 1) {
    const name = files[i];
    const id = `w${String(i + 1).padStart(3, '0')}`;
    const ext = extOf(name);
    const fileName = `${id}${ext}`;
    const srcPath = path.join(srcDir, name);
    fs.copyFileSync(srcPath, path.join(fullDir, fileName));
    await sharp(srcPath)
      .rotate()
      .resize({ width: 480, withoutEnlargement: true })
      .webp({ quality: 72 })
      .toFile(path.join(thumbDir, `${id}.webp`));
    images.push({
      id,
      name: path.basename(name, path.extname(name)),
      src: `/wallpaper-bank/full/${fileName}`,
      thumb: `/wallpaper-bank/thumbs/${id}.webp`
    });
    if ((i + 1) % 25 === 0) console.log(`${i + 1}/${files.length}`);
  }

  const manifest = { version: 1, count: images.length, images };
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest));
  console.log(`Banque prête: ${images.length} images`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
