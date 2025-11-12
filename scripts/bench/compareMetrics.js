#!/usr/bin/env node

/**
 * Compare deux snapshots `/api/garmin/metrics` et calcule les deltas des compteurs clés.
 *
 * Usage :
 *   node scripts/bench/compareMetrics.js --current=logs/garmin/metrics-after.json --previous=logs/garmin/metrics-before.json
 * Options :
 *   --current=<fichier>   (obligatoire) Snapshot récent
 *   --previous=<fichier>  (obligatoire) Snapshot référence
 *   --fields=a,b,c        Liste de chemins (dot notation) à comparer
 *   --quiet               Mode silencieux (limite la sortie)
 */

import fs from 'node:fs';
import path from 'node:path';

const ARG_PATTERN = /^--([^=]+)(=(.*))?$/;
const DEFAULT_FIELDS = [
  'sync.total',
  'sync.success',
  'sync.failure',
  'sync.cacheHit',
  'sync.servedFromCooldown',
  'sync.python.count',
  'sync.python.averageDurationMs',
  'cache.hits',
  'cache.misses',
  'cache.bypass',
  'telemetry.ingested'
];

const parseArgs = () => {
  const options = {
    current: null,
    previous: null,
    fields: DEFAULT_FIELDS,
    quiet: false
  };

  for (const chunk of process.argv.slice(2)) {
    const match = ARG_PATTERN.exec(chunk);
    if (!match) continue;
    const [, key, , value = true] = match;
    switch (key) {
      case 'current':
        options.current = value || null;
        break;
      case 'previous':
        options.previous = value || null;
        break;
      case 'fields':
        options.fields =
          typeof value === 'string' && value.length > 0
            ? value.split(',').map((entry) => entry.trim()).filter(Boolean)
            : DEFAULT_FIELDS;
        break;
      case 'quiet':
        options.quiet = value === true ? true : value !== 'false';
        break;
      default:
        break;
    }
  }

  if (!options.current || !options.previous) {
    throw new Error('Paramètres manquants. Utilisez --current=<fichier> et --previous=<fichier>.');
  }

  return options;
};

const readSnapshot = (filePath) => {
  const absolute = path.resolve(process.cwd(), filePath);
  const raw = fs.readFileSync(absolute, 'utf8');
  const json = JSON.parse(raw);
  const metrics = json?.metrics;
  if (!metrics || typeof metrics !== 'object') {
    throw new Error(`Fichier ${filePath} invalide : champ metrics absent.`);
  }
  return { metrics, raw };
};

const getByPath = (object, pathStr) => {
  if (!object || typeof object !== 'object') {
    return undefined;
  }
  return pathStr.split('.').reduce((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return acc[key];
    }
    return undefined;
  }, object);
};

const numberFormat = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });

const formatValue = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return numberFormat.format(value);
  }
  if (value === null || value === undefined) {
    return '—';
  }
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value);
};

const sign = (value) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value === 0) return '';
  return value > 0 ? '+' : '−';
};

const main = () => {
  const options = parseArgs();
  const { metrics: currentMetrics } = readSnapshot(options.current);
  const { metrics: previousMetrics } = readSnapshot(options.previous);

  if (!options.quiet) {
    console.log('=== Comparaison métriques serveur Garmin ===');
    console.log(`Snapshot courant :  ${options.current}`);
    console.log(`Snapshot précédent : ${options.previous}`);
    console.log('');
  }

  const rows = [];

  for (const pathStr of options.fields) {
    const currentValue = getByPath(currentMetrics, pathStr);
    const previousValue = getByPath(previousMetrics, pathStr);

    let delta = null;
    if (
      typeof currentValue === 'number' &&
      typeof previousValue === 'number' &&
      Number.isFinite(currentValue) &&
      Number.isFinite(previousValue)
    ) {
      delta = currentValue - previousValue;
    }

    rows.push({
      path: pathStr,
      previous: formatValue(previousValue),
      current: formatValue(currentValue),
      delta: delta === null ? '—' : `${sign(delta)}${formatValue(Math.abs(delta))}`
    });
  }

  const longestPath = Math.max(...rows.map((row) => row.path.length));
  const pad = (value, length) => value.padEnd(length, ' ');

  if (!options.quiet) {
    console.log(`${pad('Champ', longestPath)} | Ancien | Nouveau | Delta`);
    console.log(`${'-'.repeat(longestPath)}-|--------|---------|-------`);
  }

  for (const row of rows) {
    if (options.quiet) {
      console.log(`${row.path} => delta ${row.delta}`);
    } else {
      console.log(
        `${pad(row.path, longestPath)} | ${row.previous.padStart(6)} | ${row.current.padStart(7)} | ${row.delta.padStart(6)}`
      );
    }
  }

  if (!options.quiet) {
    const currentSession = currentMetrics?.telemetry?.lastPayload?.sessionId ?? '—';
    const previousSession = previousMetrics?.telemetry?.lastPayload?.sessionId ?? '—';
    const currentSchema = currentMetrics?.telemetry?.lastPayload?.schemaVersion ?? '—';
    console.log('');
    console.log('Session telemetry précédente :', previousSession);
    console.log('Session telemetry actuelle   :', currentSession);
    console.log('Schéma telemetry actuel      :', currentSchema);
  }
};

try {
  main();
} catch (error) {
  console.error('[bench:metrics:compare] Échec :', error.message || error);
  process.exitCode = 1;
}

