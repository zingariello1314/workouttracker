/**
 * Génère tous les fichier public/anatomy-previews/{stem}.webp via capture WebGl (Three.js carte).
 *
 * Usage :
 *   npm run anatomy:preview-render
 *
 * Lance Vite sur un port dédié, ou réutilise un serveur déjà UP :
 *   ANATOMY_PREVIEW_ORIGIN=http://127.0.0.1:3001 npm run anatomy:preview-render -- --skip-server
 *
 * Options :
 *   --skip-server           ne pas spawn Vite (fournir ANATOMY_PREVIEW_ORIGIN)
 *   --force                 régénérer même si le .webp existe
 *   --stem=abcd1234        un seul stem (pour debug)
 */

import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir, access } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import path from 'node:path';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import process from 'node:process';

import { buildAnatomyPreviewManifest, getMusclesForExampleLabel } from './anatomyPreviewManifest.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(REPO_ROOT, 'public', 'anatomy-previews');
const FALLBACK_PREVIEW_PORT = 3177;

async function pickFreePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.once('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      try {
        const a = srv.address();
        const port = typeof a === 'object' && a ? a.port : null;
        srv.close(() => (port ? resolve(port) : reject(new Error('port introuvable'))));
      } catch (e) {
        reject(e);
      }
    });
  });
}

const CAPTURE_W = 800;
const CAPTURE_H = 640;

function parseArgs(argv) {
  const out = { skipServer: false, force: false, stem: null };
  for (const a of argv) {
    if (a === '--skip-server') out.skipServer = true;
    if (a === '--force') out.force = true;
    if (a.startsWith('--stem=')) out.stem = a.slice('--stem='.length).trim().toLowerCase();
  }
  return out;
}

function buildCaptureUrl(origin, entry) {
  const label = entry.examples?.[0];
  if (!label) throw new Error('manifest entry sans examples');
  const { primaryMuscles, secondaryMuscles } = getMusclesForExampleLabel(label);
  const params = new URLSearchParams();
  params.set('anatomyPreviewCapture', '1');
  params.set('mode', entry.mode);
  params.set('stem', entry.stem);
  params.set('primary', JSON.stringify(primaryMuscles));
  params.set('secondary', JSON.stringify(secondaryMuscles));
  if (label.startsWith('exercise:')) {
    params.set('exerciseDatabaseKey', label.slice('exercise:'.length));
  } else if (label.startsWith('stretch:')) {
    params.set('stretchDatabaseKey', label.slice('stretch:'.length));
  }
  const base = origin.replace(/\/+$/, '');
  return `${base}/?${params.toString()}`;
}

async function fileExistsAbs(p) {
  try {
    await access(p, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function waitForOrigin(origin, deadlineMs = 120000) {
  const deadline = Date.now() + deadlineMs;
  while (Date.now() < deadline) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 3500);
      const r = await fetch(origin, { signal: ctrl.signal });
      clearTimeout(t);
      if (r.ok || r.status === 304) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 350));
  }
  throw new Error(`Timeout: serveur injoignable ${origin}`);
}

function spawnVitePreviewServer(port) {
  const env = {
    ...process.env,
    BROWSER: 'none'
  };
  const child = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['vite', '--strictPort', '--port', String(port), '--host', '127.0.0.1'], {
    cwd: REPO_ROOT,
    env,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });
  return child;
}

const args = parseArgs(process.argv.slice(2));
const manifest = buildAnatomyPreviewManifest();
/** Déduplication par stem (collision théorique très rare entre modes). */
const byStem = new Map();
for (const t of [...manifest.exercise, ...manifest.stretch]) {
  byStem.set(t.stem, t);
}
let tasks = [...byStem.values()].sort((a, b) => a.stem.localeCompare(b.stem));
if (args.stem) {
  tasks = tasks.filter((t) => t.stem === args.stem);
  if (!tasks.length) {
    console.error(`Aucune entrée pour stem=${args.stem}`);
    process.exit(1);
  }
}

await mkdir(OUT_DIR, { recursive: true });

let serverChild = null;
let origin = process.env.ANATOMY_PREVIEW_ORIGIN?.trim();

if (!args.skipServer) {
  const port = await pickFreePort().catch(() => FALLBACK_PREVIEW_PORT);
  origin = `http://127.0.0.1:${port}`;
  serverChild = spawnVitePreviewServer(port);
  await waitForOrigin(origin);
} else {
  if (!origin) {
    origin = `http://127.0.0.1:${FALLBACK_PREVIEW_PORT}`;
    console.warn(`--skip-server sans ANATOMY_PREVIEW_ORIGIN : tentative sur ${origin}`);
  }
  await waitForOrigin(origin);
}

const browser = await chromium.launch({
  headless: true,
  args: ['--disable-dev-shm-usage', '--no-sandbox']
});

const ctx = await browser.newContext({
  viewport: { width: CAPTURE_W + 80, height: CAPTURE_H + 120 },
  deviceScaleFactor: 1
});

let ok = 0;
let skipped = 0;
let failed = 0;

try {
  for (let i = 0; i < tasks.length; i++) {
    const entry = tasks[i];
    const outPath = path.join(OUT_DIR, `${entry.stem}.webp`);
    if (!args.force && (await fileExistsAbs(outPath))) {
      skipped += 1;
      continue;
    }

    const url = buildCaptureUrl(origin, entry);
    const page = await ctx.newPage();
    try {
      page.setDefaultNavigationTimeout(120000);
      page.setDefaultTimeout(120000);
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('[data-anatomy-capture-ready="1"]', { timeout: 120000 });
      await new Promise((r) => setTimeout(r, 550));
      const handle = await page.$('#anatomy-capture-target');
      if (!handle) throw new Error('#anatomy-capture-target introuvable');
      const box = await handle.boundingBox();
      if (!box) throw new Error('boundingBox null');
      const pngBuf = await page.screenshot({
        type: 'png',
        clip: {
          x: Math.max(0, box.x),
          y: Math.max(0, box.y),
          width: box.width,
          height: box.height
        }
      });
      await sharp(pngBuf).webp({ quality: 88 }).toFile(outPath);
      ok += 1;
      console.log(`[${i + 1}/${tasks.length}] ok ${entry.stem}.webp (${entry.mode})`);
    } catch (e) {
      failed += 1;
      console.error(`[${i + 1}/${tasks.length}] FAIL ${entry.stem}`, e?.message || e);
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
  if (serverChild?.pid) {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/PID', String(serverChild.pid), '/T', '/F'], { stdio: 'ignore', shell: true });
    } else {
      try {
        serverChild.kill('SIGTERM');
      } catch {
        /* */
      }
    }
  }
}

console.log(JSON.stringify({ ok, skipped, failed, total: tasks.length, outDir: OUT_DIR }, null, 2));
if (failed > 0) process.exitCode = 1;
