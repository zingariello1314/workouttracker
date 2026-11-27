#!/usr/bin/env node
/**
 * Collecteur CDP P0.3 — profil CPU non vide + Flight Recorder.
 *
 * Modes :
 *   --mode isolated   Chrome profil vide (non représentatif des données)
 *   --mode real       Chrome avec VOTRE user-data-dir (fermer Chrome d’abord)
 *   --mode attach     S’attache à un Chrome déjà lancé avec --remote-debugging-port
 *
 * Vérifie que Profiler.samples.length > 0 avant de demander le scénario.
 * CDP uniquement sur 127.0.0.1.
 */

import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import http from 'node:http';
import { execSync } from 'node:child_process';
import os from 'node:os';

const args = process.argv.slice(2);
function arg(name, fallback = null) {
  const idx = args.indexOf(name);
  if (idx < 0) return fallback;
  return args[idx + 1] ?? fallback;
}
function hasFlag(name) {
  return args.includes(name);
}

const MODE = arg('--mode', 'real'); // real | isolated | attach
const URL = arg('--url', 'http://127.0.0.1:3001');
const PORT = Number(arg('--port', '9333'));
const OUT = resolve(arg('--out', join('diagnostics', `p0-cpu-${Date.now()}`)));
const CHROME =
  arg('--chrome') ||
  process.env.CHROME_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ISOLATION = arg('--isolation', null);
const REAL_PROFILE =
  arg('--user-data-dir') ||
  join(process.env.LOCALAPPDATA || join(os.homedir(), 'AppData', 'Local'), 'Google', 'Chrome', 'User Data');

mkdirSync(OUT, { recursive: true });

function fetchJson(path) {
  return new Promise((resolvePromise, reject) => {
    http
      .get({ host: '127.0.0.1', port: PORT, path }, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          try {
            resolvePromise(JSON.parse(body));
          } catch (error) {
            reject(error);
          }
        });
      })
      .on('error', reject);
  });
}

async function waitForDebugger(timeoutMs = 45000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const version = await fetchJson('/json/version');
      if (version?.webSocketDebuggerUrl) return version;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error('CDP indisponible sur 127.0.0.1:' + PORT);
}

async function waitForUrl(timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await new Promise((resolvePromise, reject) => {
        http
          .get(URL, (res) => {
            res.resume();
            resolvePromise(res.statusCode);
          })
          .on('error', reject);
      });
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  return false;
}

class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.nextId = 1;
    this.pending = new Map();
    this.eventHandlers = new Map();
  }

  async connect() {
    if (typeof WebSocket === 'undefined') {
      throw new Error('WebSocket global requis (Node ≥ 22)');
    }
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolvePromise, reject) => {
      this.ws.addEventListener('open', resolvePromise, { once: true });
      this.ws.addEventListener('error', reject, { once: true });
    });
    this.ws.addEventListener('message', (event) => {
      const msg = JSON.parse(String(event.data));
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve: res, reject: rej } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) rej(new Error(JSON.stringify(msg.error)));
        else res(msg.result);
        return;
      }
      if (msg.method) {
        (this.eventHandlers.get(msg.method) || []).forEach((fn) => fn(msg.params));
      }
    });
  }

  on(method, fn) {
    if (!this.eventHandlers.has(method)) this.eventHandlers.set(method, []);
    this.eventHandlers.get(method).push(fn);
  }

  send(method, params = {}) {
    const id = this.nextId++;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolvePromise, reject) => {
      this.pending.set(id, { resolve: resolvePromise, reject });
    });
  }

  close() {
    try {
      this.ws?.close();
    } catch {
      /* ignore */
    }
  }
}

function ask(question) {
  return new Promise((resolvePromise) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolvePromise(answer);
    });
  });
}

function gitBuildId() {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

function countProfileSamples(profile) {
  const p = profile?.profile || profile;
  const samples = p?.samples;
  const deltas = p?.timeDeltas;
  return {
    sampleCount: Array.isArray(samples) ? samples.length : 0,
    timeDeltaCount: Array.isArray(deltas) ? deltas.length : 0,
    nodeCount: Array.isArray(p?.nodes) ? p.nodes.length : 0
  };
}

function topNodes(profile, limit = 25) {
  const p = profile?.profile || profile;
  if (!p?.nodes || !p?.samples) return [];
  const hit = new Map();
  p.samples.forEach((id) => hit.set(id, (hit.get(id) || 0) + 1));
  const byId = new Map(p.nodes.map((n) => [n.id, n]));
  return [...hit.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, count]) => {
      const node = byId.get(id);
      const callFrame = node?.callFrame || {};
      return {
        samples: count,
        sharePct: Math.round((count / p.samples.length) * 1000) / 10,
        functionName: callFrame.functionName || '(anonymous)',
        url: callFrame.url || null,
        lineNumber: callFrame.lineNumber ?? null,
        scriptId: callFrame.scriptId ?? null
      };
    });
}

async function main() {
  const campaignId = `p0cpu-${Date.now()}`;
  const buildId = gitBuildId();

  console.log('=== Momentum P0 CPU Diagnostic ===');
  console.log('Mode:', MODE);
  console.log('URL:', URL);
  console.log('CDP: 127.0.0.1:' + PORT);
  console.log('Out:', OUT);

  const urlOk = await waitForUrl();
  if (!urlOk) {
    console.error('Momentum inaccessible sur', URL, '— lancez npm run dev d’abord.');
    process.exit(1);
  }
  console.log('Serveur Momentum : OK');

  let child = null;
  if (MODE === 'isolated') {
    const profileDir = join(OUT, 'chrome-profile');
    mkdirSync(profileDir, { recursive: true });
    console.log('ATTENTION: profil isolé = PAS vos données IndexedDB.');
    child = spawn(
      CHROME,
      [
        `--remote-debugging-port=${PORT}`,
        '--remote-debugging-address=127.0.0.1',
        `--user-data-dir=${profileDir}`,
        '--no-first-run',
        '--no-default-browser-check',
        URL
      ],
      { stdio: 'ignore', detached: true }
    );
    child.unref();
  } else if (MODE === 'real') {
    if (!existsSync(CHROME)) {
      console.error('Chrome introuvable:', CHROME);
      process.exit(1);
    }
    console.log('');
    console.log('MODE RÉEL — fermez TOUTES les fenêtres Chrome avant de continuer.');
    console.log('Profil utilisé (sans copie):', REAL_PROFILE);
    console.log('CDP localhost uniquement.');
    await ask('Entrée quand Chrome est complètement fermé… ');
    child = spawn(
      CHROME,
      [
        `--remote-debugging-port=${PORT}`,
        '--remote-debugging-address=127.0.0.1',
        `--user-data-dir=${REAL_PROFILE}`,
        '--no-first-run',
        '--no-default-browser-check',
        URL
      ],
      { stdio: 'ignore', detached: true }
    );
    child.unref();
  } else if (MODE === 'attach') {
    console.log('Attache à un Chrome déjà lancé avec --remote-debugging-port=' + PORT);
  } else {
    console.error('Mode inconnu:', MODE);
    process.exit(1);
  }

  const version = await waitForDebugger();
  writeFileSync(join(OUT, 'browser-version.json'), JSON.stringify(version, null, 2));

  const targets = await fetchJson('/json/list');
  let page =
    targets.find((t) => t.type === 'page' && /127\.0\.0\.1|localhost/.test(String(t.url || ''))) ||
    targets.find((t) => t.type === 'page' && /momentum|today/i.test(String(t.url || ''))) ||
    targets.find((t) => t.type === 'page');
  if (!page?.webSocketDebuggerUrl) throw new Error('Aucun onglet page CDP');
  console.log('Onglet CDP:', page.url);

  const client = new CdpClient(page.webSocketDebuggerUrl);
  await client.connect();
  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('Profiler.enable');
  await client.send('Profiler.setSamplingInterval', { interval: 100 });

  // Probe : démarrer / arrêter pour garantir samples > 0
  await client.send('Profiler.start');
  await new Promise((r) => setTimeout(r, 2500));
  // Forcer un peu de JS
  await client.send('Runtime.evaluate', {
    expression: '(() => { let s=0; for (let i=0;i<2e6;i++) s+=i; return s; })()',
    returnByValue: true
  });
  await new Promise((r) => setTimeout(r, 500));
  const probeProfile = await client.send('Profiler.stop');
  const probeStats = countProfileSamples(probeProfile);
  writeFileSync(join(OUT, 'cpu-profile-probe.json'), JSON.stringify(probeProfile?.profile || probeProfile, null, 2));
  if (probeStats.sampleCount < 10) {
    console.error('ÉCHEC: le Profiler CDP ne collecte pas d’échantillons.', probeStats);
    console.error('Abandon — ne lancez pas de campagne utilisateur sur un CPU vide.');
    client.close();
    process.exit(2);
  }
  console.log('Probe CPU OK:', probeStats);

  const traceEvents = [];
  client.on('Tracing.dataCollected', (params) => {
    if (Array.isArray(params?.value)) traceEvents.push(...params.value);
  });
  await client
    .send('Tracing.start', {
      categories:
        'devtools.timeline,v8.execute,blink.user_timing,disabled-by-default-devtools.timeline',
      transferMode: 'ReportEvents'
    })
    .catch(() => null);

  await client.send('Profiler.start');

  const boot = await client.send('Runtime.evaluate', {
    expression: `(() => {
      try {
        localStorage.setItem('momentum.todayDiag', '1');
        ${ISOLATION ? `localStorage.setItem(${JSON.stringify('momentum:diag:' + ISOLATION)}, '1');` : ''}
        window.__MOMENTUM_CDP_CAMPAIGN__ = ${JSON.stringify(campaignId)};
        performance.mark('momentum-cdp-capture-start');
        performance.mark('cdp-flight-sync');
        return {
          ok: true,
          campaignId: window.__MOMENTUM_CDP_CAMPAIGN__,
          timeOrigin: performance.timeOrigin,
          now: performance.now(),
          href: location.href
        };
      } catch (e) {
        return { ok: false, error: String(e) };
      }
    })()`,
    returnByValue: true
  });

  writeFileSync(
    join(OUT, 'capture-conditions.json'),
    JSON.stringify(
      {
        campaignId,
        buildId,
        mode: MODE,
        url: URL,
        port: PORT,
        isolation: ISOLATION,
        realProfile: MODE === 'real' ? REAL_PROFILE : null,
        probeStats,
        boot: boot?.result?.value,
        startedAt: new Date().toISOString()
      },
      null,
      2
    )
  );

  console.log('');
  console.log('Scénario UNIQUE (ne pas faire d’autre export JSON seul) :');
  console.log('  1) Sport → Aujourd’hui');
  console.log('  2) 20 secondes SANS interaction');
  console.log('  3) 20–30 coches/décoches');
  console.log('  4) Revenez ici → Entrée');
  await ask('');

  const clocks = await client.send('Runtime.evaluate', {
    expression: '({ timeOrigin: performance.timeOrigin, now: performance.now() })',
    returnByValue: true
  });

  const profile = await client.send('Profiler.stop');
  const finalStats = countProfileSamples(profile);
  writeFileSync(join(OUT, 'cpu-profile.json'), JSON.stringify(profile?.profile || profile, null, 2));
  writeFileSync(join(OUT, 'cpu-top-frames.json'), JSON.stringify(topNodes(profile, 40), null, 2));

  if (finalStats.sampleCount < 50) {
    console.error('ATTENTION: profil final quasi vide', finalStats);
    writeFileSync(join(OUT, 'CPU_EMPTY.txt'), JSON.stringify(finalStats, null, 2));
  } else {
    console.log('Profil final OK:', finalStats);
  }

  try {
    await client.send('Tracing.end');
  } catch {
    /* optional */
  }
  writeFileSync(join(OUT, 'chromium-trace-filtered.json'), JSON.stringify({ traceEvents }, null, 2));

  const flight = await client.send('Runtime.evaluate', {
    expression: `(() => {
      const run = window.buildFlightExport || window.__MOMENTUM_TODAY_DIAG__?.buildFlightExport;
      if (typeof run !== 'function') return Promise.resolve({ ok: false, error: 'buildFlightExport absent' });
      return Promise.resolve(run()).then((data) => ({ ok: true, data }));
    })()`,
    awaitPromise: true,
    returnByValue: true
  });
  if (flight?.result?.value?.ok && flight.result.value.data) {
    writeFileSync(join(OUT, 'flight-recorder.json'), JSON.stringify(flight.result.value.data, null, 2));
  } else {
    writeFileSync(join(OUT, 'flight-recorder-status.json'), JSON.stringify(flight?.result?.value || flight, null, 2));
  }

  writeFileSync(
    join(OUT, 'clock-sync.json'),
    JSON.stringify(
      {
        campaignId,
        buildId,
        performance: clocks?.result?.value,
        probeStats,
        finalStats,
        note: 'Samples CPU en µs (V8). Corréler via performance.timeOrigin + marks momentum-cdp-capture-start.'
      },
      null,
      2
    )
  );

  writeFileSync(
    join(OUT, 'DIAGNOSTIC.md'),
    `# P0 CPU Diagnostic ${campaignId}

## Validation collecte
- Probe samples: ${probeStats.sampleCount}
- Final samples: ${finalStats.sampleCount}
- Nodes: ${finalStats.nodeCount}

## Fichiers
- cpu-profile.json — ouvrir dans Chrome DevTools → Performance → Load profile
- cpu-top-frames.json — top frames par nombre d’échantillons (estimation)
- flight-recorder.json — workSpans / xpCalcRegistry / react-commit multi-arbres
- capture-conditions.json / clock-sync.json

## Lecture
1. Identifier les plages ~2300 ms
2. Ignorer le self-time de performWorkUntilDeadline / MessageChannel comme cause finale
3. Remonter aux frames \`src/\` dominantes
4. Croiser avec react-commit.tree (SidebarPremium, SportXpBar, RecapTab, TodayTab)
`
  );

  const zipName = join(OUT, '..', `momentum-today-p0-cpu-diagnostic.zip`);
  try {
    execSync(`tar -a -c -f "${zipName}" -C "${OUT}" .`, { stdio: 'ignore' });
    console.log('ZIP:', zipName);
  } catch {
    console.log('Dossier (zip manuel):', OUT);
  }

  client.close();
  console.log('Terminé:', OUT);
  if (finalStats.sampleCount < 50) process.exit(3);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
