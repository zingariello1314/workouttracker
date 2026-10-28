/**
 * Scanne public/welcome-videos et écrit manifest.json.
 * Ajoutez simplement des .mp4 / .webm / .mov puis relancez ce script.
 */
import fs from 'fs';
import path from 'path';

const root = path.resolve(import.meta.dirname, '..');
const dir = path.join(root, 'public', 'welcome-videos');
const VIDEO_RE = /\.(mp4|webm|mov)$/i;

function main() {
  fs.mkdirSync(dir, { recursive: true });
  const files = fs
    .readdirSync(dir)
    .filter((name) => VIDEO_RE.test(name))
    .sort((a, b) => a.localeCompare(b, 'fr'));

  const videos = files.map((name, index) => {
    const id = `v${String(index + 1).padStart(3, '0')}`;
    const base = path.basename(name, path.extname(name));
    // Encoder chaque segment (espaces, accents) pour lecture navigateur nette
    const encodedName = name.split('/').map(encodeURIComponent).join('/');
    return {
      id,
      name: base,
      src: `/welcome-videos/${encodedName}`,
      poster: null,
    };
  });

  const manifest = { version: 1, count: videos.length, videos };
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`Vidéos d'accueil: ${videos.length}`);
}

main();
