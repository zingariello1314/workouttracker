/**
 * Scanne public/tiktop-videos/<thème>/ et écrit manifest.json.
 * Source de vérité éditoriale : dossier racine « videos tiktop » (copié vers public).
 */
import fs from 'fs';
import path from 'path';

const root = path.resolve(import.meta.dirname, '..');
const dir = path.join(root, 'public', 'tiktop-videos');
const VIDEO_RE = /\.(mp4|webm|mov)$/i;

const THEME_LABELS = {
  calisthénie: 'Callisthénie',
  motivation: 'Motivation',
  musculation: 'Musculation',
  philosophie: 'Philosophie',
  recettes: 'Recettes',
  running: 'Running',
};

function main() {
  fs.mkdirSync(dir, { recursive: true });
  const themes = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b, 'fr'));

  const videos = [];
  for (const theme of themes) {
    const themeDir = path.join(dir, theme);
    const files = fs
      .readdirSync(themeDir)
      .filter((name) => VIDEO_RE.test(name))
      .sort((a, b) => a.localeCompare(b, 'fr'));
    for (const file of files) {
      const base = path.basename(file, path.extname(file));
      const id = `native-tiktop-${theme}-${base}`
        .toLowerCase()
        .replace(/[^a-z0-9àâäéèêëïîôùûüç_-]+/gi, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      videos.push({
        id,
        title: base,
        theme,
        themeLabel: THEME_LABELS[theme] || theme,
        src: `/tiktop-videos/${encodeURIComponent(theme).replace(/%2F/g, '/')}/${encodeURIComponent(file).replace(/%2F/g, '/')}`
          .replace(/%20/g, ' ')
          // keep readable paths for Vite static serve
          .split('/')
          .map((part, i) => (i < 2 ? part : part))
          .join('/'),
        file,
      });
    }
  }

  // Encoder chaque segment (espaces, #, emoji) pour lecture navigateur
  for (const v of videos) {
    v.src = `/tiktop-videos/${encodeURIComponent(v.theme)}/${encodeURIComponent(v.file)}`;
  }

  const manifest = {
    version: 1,
    count: videos.length,
    themes: themes.map((t) => ({ id: t, label: THEME_LABELS[t] || t })),
    videos,
  };
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`TikTop native: ${videos.length} vidéos · thèmes: ${themes.join(', ')}`);
}

main();
