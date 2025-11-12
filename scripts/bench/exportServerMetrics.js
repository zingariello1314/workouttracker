#!/usr/bin/env node

/**
 * Export instantané des métriques serveur Garmin.
 *
 * Usage :
 *   node scripts/bench/exportServerMetrics.js --base=http://localhost:3001 --out=./logs/metrics-latest.json
 *
 * Options :
 *   --base=<url>    URL de base du bridge Garmin (défaut : http://localhost:3001)
 *   --out=<chemin>  Chemin fichier JSON où sauvegarder le snapshot (optionnel)
 *   --quiet         Limite la sortie console au strict minimum
 */

import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_BASE_URL = 'http://localhost:3001';
const ARG_PATTERN = /^--([^=]+)(=(.*))?$/;

const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {
    base: DEFAULT_BASE_URL,
    out: null,
    quiet: false
  };

  for (const chunk of args) {
    const match = ARG_PATTERN.exec(chunk);
    if (!match) {
      continue;
    }
    const [, key, , value = true] = match;
    switch (key) {
      case 'base':
        options.base = value || DEFAULT_BASE_URL;
        break;
      case 'out':
        options.out = value || null;
        break;
      case 'quiet':
        options.quiet = value === true ? true : value !== 'false';
        break;
      default:
        break;
    }
  }

  return options;
};

const ensureFetch = async () => {
  if (typeof fetch === 'function') {
    return fetch;
  }
  throw new Error(
    'fetch indisponible dans cette version de Node. Utilisez Node >= 18 ou installez node-fetch.'
  );
};

const formatNumber = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return value ?? '—';
  }
  return new Intl.NumberFormat('fr-FR').format(value);
};

const log = (quiet, ...messages) => {
  if (!quiet) {
    console.log(...messages);
  }
};

const main = async () => {
  const options = parseArgs();
  const fetchImpl = await ensureFetch();

  const endpoint = new URL('/api/garmin/metrics', options.base);

  const startedAt = Date.now();
  const response = await fetchImpl(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} – ${response.statusText}`);
  }

  const payload = await response.json();
  const durationMs = Date.now() - startedAt;

  const metrics = payload?.metrics ?? {};
  const sync = metrics.sync ?? {};
  const cache = metrics.cache ?? {};
  const telemetry = metrics.telemetry ?? {};

  log(
    options.quiet,
    `Snapshot metrics reçu en ${durationMs} ms depuis ${endpoint.origin}`
  );

  const summary = {
    totalSync: sync.total ?? 0,
    success: sync.success ?? 0,
    failure: sync.failure ?? 0,
    cacheHitServer: sync.cacheHit ?? 0,
    cooldownServed: sync.servedFromCooldown ?? 0,
    pythonCount: sync.python?.count ?? 0,
    pythonAvgMs: sync.python?.averageDurationMs ?? 0,
    cacheHits: cache.hits ?? 0,
    cacheMisses: cache.misses ?? 0,
    cacheBypass: cache.bypass ?? 0,
    telemetryIngested: telemetry.ingested ?? 0
  };

  if (!options.quiet) {
    console.log('--- Résumé métriques ---');
    for (const [key, value] of Object.entries(summary)) {
      console.log(`${key.padEnd(20)}: ${formatNumber(value)}`);
    }
    if (telemetry.lastPayload) {
      console.log(
        'Dernier payload telemetry :',
        telemetry.lastPayload.sessionId || '—',
        `(schema ${telemetry.lastPayload.schemaVersion ?? 'n/a'})`,
        'motif =',
        telemetry.lastPayload.reason || '—'
      );
    }
  }

  if (options.out) {
    const outPath = path.resolve(process.cwd(), options.out);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');
    log(options.quiet, `Snapshot sauvegardé dans ${outPath}`);
  }
};

main().catch((error) => {
  console.error('[bench:metrics] Échec :', error.message || error);
  process.exitCode = 1;
});

