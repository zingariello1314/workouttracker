/**
 * Construit une archive ZIP portable de Momentum (sans toucher au code métier).
 *
 * Usage:
 *   node scripts/package-portable.mjs
 *   node scripts/package-portable.mjs --lite
 *   npm run package:portable
 *   npm run package:portable:lite
 *
 * Sortie: dist-release/Momentum-portable-<version>.zip
 *
 * --lite : exclut les gros médias (dossiergifs, fonds d'écran) pour un ZIP plus léger.
 */

import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const lite = process.argv.includes('--lite');

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const version = String(pkg.version || '0.0.0').replace(/[^\w.-]+/g, '');
const stamp = new Date().toISOString().slice(0, 10);
const outName = lite
  ? `Momentum-portable-${version}-lite-${stamp}`
  : `Momentum-portable-${version}-${stamp}`;

const outDir = path.join(root, 'dist-release');
const stageDir = path.join(outDir, outName);
const zipPath = path.join(outDir, `${outName}.zip`);

/** Dossiers / fichiers jamais inclus (secrets, caches, tooling). */
const EXCLUDE_DIR_NAMES = new Set([
  '.git',
  '.svn',
  '.hg',
  'node_modules',
  '.venv',
  'venv',
  'dist',
  'dist-release',
  'build',
  'coverage',
  'graft',
  '.graft',
  '.cursor',
  '.claude',
  '.kiro',
  '.originkit',
  '.vscode',
  '.idea',
  'playwright-report',
  'playwright-report-perf',
  'test-results',
  'logs',
  'tmp',
  'temp',
  '.vite',
  '.npm',
  '__pycache__',
  '.cache',
  'agent-transcripts',
]);

const EXCLUDE_FILE_NAMES = new Set([
  '.env',
  '.env.local',
  '.env.development.local',
  '.env.test.local',
  '.env.production.local',
  'auth_server.db',
  'Thumbs.db',
  '.DS_Store',
]);

const EXCLUDE_FILE_SUFFIXES = [
  '.db',
  '.db-journal',
  '.db-wal',
  '.db-shm',
  '.log',
  '.pyc',
];

/** Stores runtime backend (données perso) — ne pas publier. */
const EXCLUDE_BACKEND_RUNTIME = [
  'nav_prefs_store.json',
  'quests_store.json',
  'finance_store.json',
  'books_store.json',
  'settings_ui_store.json',
  'today_store.json',
];

/** Gros médias optionnels (mode --lite). */
const LITE_EXCLUDE_TOP = new Set([
  'dossiergifs',
  'images fond decran acuueil et verrouillage',
]);

function shouldSkipDir(name, relPosix) {
  if (EXCLUDE_DIR_NAMES.has(name)) return true;
  if (lite && !relPosix.includes('/') && LITE_EXCLUDE_TOP.has(name)) return true;
  if (name === '.cache' && relPosix.startsWith('garmin-server')) return true;
  return false;
}

function shouldSkipFile(name, relPosix) {
  if (EXCLUDE_FILE_NAMES.has(name)) return true;
  if (name.startsWith('.env.') && name !== '.env.example') return true;
  if (EXCLUDE_FILE_SUFFIXES.some((s) => name.endsWith(s))) return true;
  if (relPosix.startsWith('backend/') && EXCLUDE_BACKEND_RUNTIME.includes(name)) return true;
  // Ne pas republier de gros dumps locaux accidentels
  if (name.endsWith('.zip') && relPosix.startsWith('dist-release')) return true;
  return false;
}

function ensureCleanDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function copyTree(src, dest, rel = '') {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const ent of entries) {
    const relPosix = rel ? `${rel}/${ent.name}` : ent.name;
    const from = path.join(src, ent.name);
    const to = path.join(dest, ent.name);

    if (ent.isDirectory()) {
      if (shouldSkipDir(ent.name, relPosix)) continue;
      fs.mkdirSync(to, { recursive: true });
      copyTree(from, to, relPosix);
      continue;
    }

    if (ent.isSymbolicLink()) continue;
    if (!ent.isFile()) continue;
    if (shouldSkipFile(ent.name, relPosix)) continue;

    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
  }
}

function copyPortableLaunchers() {
  const portableSrc = path.join(root, 'scripts', 'portable');
  const files = [
    ['LIRE-MOI.txt', 'LIRE-MOI.txt'],
    ['start-momentum.bat', 'start-momentum.bat'],
    ['start-momentum.ps1', 'start-momentum.ps1'],
  ];
  for (const [srcName, destName] of files) {
    const from = path.join(portableSrc, srcName);
    if (!fs.existsSync(from)) {
      throw new Error(`Fichier portable manquant: ${from}`);
    }
    fs.copyFileSync(from, path.join(stageDir, destName));
  }

  const releaseNote = [
    `Momentum portable ${version}`,
    `Date: ${stamp}`,
    `Mode: ${lite ? 'lite (sans dossiergifs / fonds ecran)' : 'complet'}`,
    '',
    'Lis LIRE-MOI.txt puis lance start-momentum.bat',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(stageDir, 'VERSION-PORTABLE.txt'), releaseNote, 'utf8');
}

function createZipWithTar(sourceDir, destinationZip) {
  if (fs.existsSync(destinationZip)) fs.rmSync(destinationZip, { force: true });

  // tar -a crée un .zip sur Windows 10+ / macOS / Linux récents
  const result = spawnSync(
    'tar',
    ['-a', '-c', '-f', destinationZip, '-C', sourceDir, '.'],
    { stdio: 'inherit', shell: false }
  );

  if (result.error || result.status !== 0) {
    throw new Error(
      `Echec creation ZIP (tar). Code=${result.status} err=${result.error?.message || ''}`
    );
  }
}

function formatMb(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function main() {
  console.log(`[package-portable] root=${root}`);
  console.log(`[package-portable] mode=${lite ? 'lite' : 'full'}`);
  console.log(`[package-portable] staging=${stageDir}`);

  fs.mkdirSync(outDir, { recursive: true });
  ensureCleanDir(stageDir);

  console.log('[package-portable] Copie des fichiers…');
  copyTree(root, stageDir);
  copyPortableLaunchers();

  console.log('[package-portable] Compression…');
  createZipWithTar(stageDir, zipPath);

  const st = fs.statSync(zipPath);
  console.log('');
  console.log('[package-portable] OK');
  console.log(`  ZIP : ${zipPath}`);
  console.log(`  Taille : ${formatMb(st.size)}`);
  console.log('  Upload ce fichier sur l’hébergement du site, puis mets à jour DOWNLOAD_URL.');
  console.log('  Le dossier staging reste dans dist-release/ (peut être supprimé).');
}

main();
