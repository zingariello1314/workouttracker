#!/usr/bin/env node

/**
 * Script de vérification rapide du forçage Garmin.
 *
 * Exemple:
 *   node scripts/garmin_force_sync_check.js today
 *   GARMIN_FORCE_BASE=http://192.168.0.10:3031 node scripts/garmin_force_sync_check.js 2025-01-01 2025-01-03
 */

const v8 = require('v8');
const { spawn } = require('child_process');

const ensureHeapSize = () => {
  const limitMb = v8.getHeapStatistics().heap_size_limit / (1024 * 1024);
  const MIN_HEAP_MB = 6000; // seuil minimum pour absorber les grosses réponses JSON

  if (!process.env.GARMIN_FORCE_HEAP_ESCALATED && limitMb < MIN_HEAP_MB) {
    const escalatedEnv = {
      ...process.env,
      GARMIN_FORCE_HEAP_ESCALATED: '1'
    };
    const escalatedArgs = [
      '--max-old-space-size=8192',
      __filename,
      ...process.argv.slice(2)
    ];

    console.log(
      `[garmin-force-sync-check] Heap actuel ${Math.round(limitMb)} MB insuffisant. Relance avec --max-old-space-size=8192…`
    );

    const child = spawn(process.execPath, escalatedArgs, {
      stdio: 'inherit',
      env: escalatedEnv
    });

    child.on('exit', (code) => process.exit(code));
    return false;
  }

  return true;
};

const BASE_URL = (process.env.GARMIN_FORCE_BASE || 'http://localhost:3031').replace(/\/+$/, '');

const args = process.argv.slice(2);
const mode = (args[0] || 'today').toLowerCase();
const startArg = args[1] || null;
const endArg = args[2] || null;

const today = new Date();
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

const resolvePreset = () => {
  switch (mode) {
    case 'today':
      return { mode: 'today', start: todayStr, end: todayStr, includeToday: true };
    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
      return { mode: 'yesterday', start: yStr, end: yStr, includeToday: false };
    }
    case 'range': {
      const start = startArg || todayStr;
      const end = endArg || start;
      return { mode: 'range', start, end, includeToday: end === todayStr };
    }
    default:
      console.warn(`[garmin-force-sync-check] Mode inconnu "${mode}", fallback sur "today".`);
      return { mode: 'today', start: todayStr, end: todayStr, includeToday: true };
  }
};

const config = resolvePreset();
const searchParams = new URLSearchParams();
searchParams.set('start', config.start);
searchParams.set('end', config.end);
searchParams.set('forceRefresh', 'true');

const requestPayload = {
  mode: config.mode,
  forceRefresh: true,
  includeToday: config.includeToday,
  range: { start: config.start, end: config.end },
  rangeStart: config.start,
  rangeEnd: config.end
};

async function main() {
  const url = `${BASE_URL}/api/garmin/sync?${searchParams.toString()}`;
  console.log(`[garmin-force-sync-check] POST ${url}`);
  console.log('[garmin-force-sync-check] Payload:', JSON.stringify(requestPayload, null, 2));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestPayload)
    });

    console.log(`[garmin-force-sync-check] Status: ${response.status} ${response.statusText}`);
    const json = await response.json().catch(() => null);
    if (json) {
      console.log('[garmin-force-sync-check] Réponse JSON:', JSON.stringify(json, null, 2));
    } else {
      console.warn('[garmin-force-sync-check] Impossible de parser la réponse JSON.');
    }
  } catch (error) {
    console.error('[garmin-force-sync-check] ❌ Erreur lors de la requête:', error.message);
    process.exitCode = 1;
  }
}

(async () => {
  if (!ensureHeapSize()) {
    return;
  }
  await main();
})();

