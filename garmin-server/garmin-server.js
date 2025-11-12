// Garmin Bridge Server - Optimisé avec Rate Limiting, Retry Backoff, et Cache
// PHASE 4 : OPTIMISATION (4.1, 4.2, 4.3)
// Run: node garmin-server.js

const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
const compression = require('compression');
const os = require('os');
const { Readable } = require('stream');

// ==========================================
// PHASE 4.1 : RATE LIMITING
// ==========================================
const syncLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Maximum 5 requêtes par minute
  message: {
    ok: false,
    error: 'Trop de requêtes. Veuillez attendre avant de réessayer.',
    retryAfter: 60
  },
  standardHeaders: true, // Retourne rate limit info dans headers
  legacyHeaders: false,
});

const statusLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 secondes
  max: 30, // Maximum 30 requêtes par 10 secondes (pour polling)
  message: {
    ok: false,
    error: 'Trop de requêtes de statut.',
    retryAfter: 10
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ==========================================
// PHASE 4.3 : CACHE CÔTÉ SERVEUR (5min TTL)
// ==========================================
class ServerCache {
  constructor(ttlMinutes = 5) {
    this.cache = new Map();
    this.ttlMs = ttlMinutes * 60 * 1000;
    this.defaultTtlMs = ttlMinutes * 60 * 1000; // TTL par défaut (5 min)
    this.todayTtlMs = 1 * 60 * 1000; // ✅ PHASE 2.2 : TTL réduit pour aujourd'hui (1 min)
  }

  // ✅ PHASE 2.4 : Générer une clé de cache incluant lastSyncTimestamp
  generateKey(params) {
    const { start, end, lastSyncTimestamp } = params || {};
    return `sync_${start || 'default'}_${end || 'default'}_${lastSyncTimestamp || 'none'}`;
  }

  // Vérifier si une entrée existe et n'est pas expirée
  // ✅ PHASE 3.1 : Amélioration avec lastSyncTimestamp pour décision intelligente
  get(key, lastSyncTimestamp = null) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // ✅ PHASE 2.2 : TTL adaptatif selon si c'est aujourd'hui ou une date passée
    const now = Date.now();
    const cacheAge = now - entry.timestamp;
    
    // Déterminer si c'est pour aujourd'hui (clé contient la date d'aujourd'hui)
    const today = new Date().toISOString().split('T')[0];
    const isTodayCache = key.includes(today);
    const effectiveTtl = isTodayCache ? this.todayTtlMs : this.defaultTtlMs;
    
    // ✅ PHASE 3.1 : Logique intelligente avec lastSyncTimestamp
    // Si lastSyncTimestamp fourni ET date = aujourd'hui :
    //   - Si cache existe ET (âge < TTL OU lastSyncTimestamp < 5 min) → utiliser cache
    //   - Sinon → considérer expiré (mais ne pas supprimer si lastSyncTimestamp < 5 min)
    let shouldUseCache = cacheAge <= effectiveTtl;
    
    if (lastSyncTimestamp && isTodayCache) {
      try {
        const lastSyncDate = new Date(lastSyncTimestamp);
        const lastSyncAgeMinutes = (now - lastSyncDate.getTime()) / (1000 * 60);
        
        // Si sync il y a moins de 5 minutes, utiliser le cache même s'il est expiré
        if (lastSyncAgeMinutes < 5) {
          shouldUseCache = true;
          console.log(`[CACHE] ✅ PHASE 3.1 - Cache utilisé malgré expiration (sync il y a ${Math.round(lastSyncAgeMinutes * 60)}s)`);
        }
      } catch (e) {
        console.warn(`[CACHE] Error parsing lastSyncTimestamp: ${e.message}`);
        // En cas d'erreur, utiliser la logique normale
      }
    }
    
    if (!shouldUseCache) {
      // Cache expiré
      this.cache.delete(key);
      serverMetrics.cache.misses += 1;
      console.log(`[CACHE] Entry expired: ${key} (age: ${Math.round(cacheAge / 1000)}s, TTL: ${Math.round(effectiveTtl / 1000)}s)`);
      return null;
    }
    
    serverMetrics.cache.hits += 1;
    console.log(`[CACHE] Hit for key: ${key} (age: ${Math.round(cacheAge / 1000)}s, TTL: ${Math.round(effectiveTtl / 1000)}s, ${isTodayCache ? 'aujourd\'hui' : 'passé'})`);
    return entry.data;
  }

  // Stocker une entrée dans le cache
  set(key, data) {
    this.cache.set(key, {
      data: data,
      timestamp: Date.now()
    });
    console.log(`[CACHE] Stored key: ${key}`);
  }

  // Nettoyer les entrées expirées (maintenance périodique)
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttlMs) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      console.log(`[CACHE] Cleanup: removed ${cleaned} expired entries`);
    }
  }

  // Vider complètement le cache (pour tests ou reset)
  clear() {
    this.cache.clear();
    console.log('[CACHE] Cache cleared');
  }
}

const serverCache = new ServerCache(5); // TTL de 5 minutes

// Nettoyage automatique du cache toutes les 10 minutes
setInterval(() => {
  serverCache.cleanup();
}, 10 * 60 * 1000);

// ==========================================
// OUTILS DATE & PLAGE (FORCE SYNC)
// ==========================================

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const CACHE_DIR = path.join(__dirname, '.cache');
const FORCE_REFRESH_COOLDOWN_MS = 2 * 60 * 1000;
const FORCED_DELTA_THRESHOLD_MS = 30 * 1000;

const buildRangeKey = (start, end) => `${start || 'none'}|${end || 'none'}`;

const isIsoDate = (value) => {
  if (!value || typeof value !== 'string') {
    return false;
  }
  const parsed = Date.parse(value);
  return !Number.isNaN(parsed);
};

const toIsoString = (timestampMs) => {
  const date = new Date(timestampMs);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
};

const decodeHeartRateSeries = (series = []) => {
  if (!Array.isArray(series) || series.length === 0) {
    return [];
  }

  const decoded = [];
  let currentTimestamp = null;
  let currentValue = null;

  series.forEach((entry, index) => {
    if (index === 0) {
      if (!isIsoDate(entry?.timestamp) || entry?.bpm == null) {
        return;
      }
      currentTimestamp = Date.parse(entry.timestamp);
      currentValue = Number(entry.bpm);
      if (Number.isNaN(currentTimestamp) || Number.isNaN(currentValue)) {
        return;
      }
      decoded.push({
        timestamp: currentTimestamp,
        value: currentValue
      });
      return;
    }

    const deltaTs = Number(entry?.d_ts ?? 0);
    const deltaVal = Number(entry?.d_val ?? 0);
    if (Number.isNaN(deltaTs) || Number.isNaN(deltaVal)) {
      return;
    }

    currentTimestamp += deltaTs;
    currentValue += deltaVal;

    decoded.push({
      timestamp: currentTimestamp,
      value: currentValue
    });
  });

  return decoded;
};

const encodeHeartRateSeries = (points = []) => {
  if (!Array.isArray(points) || points.length === 0) {
    return [];
  }

  const encoded = [];
  const [firstPoint, ...rest] = points;
  const firstIso = toIsoString(firstPoint.timestamp);

  if (!firstIso || Number.isNaN(firstPoint.value)) {
    return [];
  }

  encoded.push({
    timestamp: firstIso,
    bpm: Math.round(firstPoint.value)
  });

  rest.reduce((prev, point) => {
    const deltaTs = point.timestamp - prev.timestamp;
    const deltaVal = point.value - prev.value;

    encoded.push({
      d_ts: Math.round(deltaTs),
      d_val: Math.round(deltaVal)
    });

    return point;
  }, firstPoint);

  return encoded;
};

const filterSeriesFromTimestamp = (series = [], thresholdMs) => {
  if (!Array.isArray(series) || !Number.isFinite(thresholdMs)) {
    return { filtered: series, removed: 0 };
  }

  const decoded = decodeHeartRateSeries(series);
  if (decoded.length === 0) {
    return { filtered: series, removed: 0 };
  }

  const filteredDecoded = decoded.filter(point => point.timestamp > thresholdMs);

  if (filteredDecoded.length === 0 || filteredDecoded.length === decoded.length) {
    return { filtered: series, removed: 0 };
  }

  const encoded = encodeHeartRateSeries(filteredDecoded);
  if (encoded.length === 0) {
    return { filtered: series, removed: 0 };
  }

  return {
    filtered: encoded,
    removed: decoded.length - filteredDecoded.length
  };
};

const filterTimeSeriesWithIsoTimestamp = (series = [], thresholdMs) => {
  if (!Array.isArray(series) || !Number.isFinite(thresholdMs)) {
    return { filtered: series, removed: 0 };
  }

  const filtered = [];
  let removed = 0;

  for (const entry of series) {
    const timestamp = entry?.timestamp;
    if (!timestamp || !isIsoDate(timestamp)) {
      filtered.push(entry);
      continue;
    }
    const tsMs = Date.parse(timestamp);
    if (tsMs > thresholdMs) {
      filtered.push(entry);
    } else {
      removed += 1;
    }
  }

  if (removed === 0) {
    return { filtered: series, removed };
  }

  return { filtered, removed };
};

const applyForcedDeltaReduction = (payload = null, lastSyncTimestamp = null) => {
  if (!payload || typeof payload !== 'object' || !lastSyncTimestamp) {
    return { payload, meta: { applied: false } };
  }

  const thresholdMs = Date.parse(lastSyncTimestamp);
  if (Number.isNaN(thresholdMs)) {
    return { payload, meta: { applied: false } };
  }

  const clone = JSON.parse(JSON.stringify(payload));
  const dailyMetrics = clone?.data?.dailyMetrics;

  if (!dailyMetrics || typeof dailyMetrics !== 'object') {
    return { payload: clone, meta: { applied: false } };
  }

  let totalRemoved = 0;
  let daysUpdated = 0;

  for (const dateKey of Object.keys(dailyMetrics)) {
    const metrics = dailyMetrics[dateKey];
    if (!metrics || typeof metrics !== 'object') {
      continue;
    }

    if (metrics.heartRate?.timeSeries?.length) {
      const { filtered, removed } = filterSeriesFromTimestamp(metrics.heartRate.timeSeries, thresholdMs);
      if (removed > 0) {
        metrics.heartRate.timeSeries = filtered;
        totalRemoved += removed;
        daysUpdated += 1;
      }
    }

    if (metrics.bodyBattery?.timeSeries?.length) {
      const { filtered, removed } = filterTimeSeriesWithIsoTimestamp(metrics.bodyBattery.timeSeries, thresholdMs);
      if (removed > 0) {
        metrics.bodyBattery.timeSeries = filtered;
        totalRemoved += removed;
        daysUpdated += 1;
      }
    }

    if (metrics.respiration?.timeSeries?.length) {
      const { filtered, removed } = filterTimeSeriesWithIsoTimestamp(metrics.respiration.timeSeries, thresholdMs);
      if (removed > 0) {
        metrics.respiration.timeSeries = filtered;
        totalRemoved += removed;
        daysUpdated += 1;
      }
    }
  }

  return {
    payload: clone,
    meta: {
      applied: totalRemoved > 0,
      removedPoints: totalRemoved,
      daysUpdated
    }
  };
};

const sendJsonStream = (res, payload) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');
  const jsonString = JSON.stringify(payload);
  Readable.from(jsonString).pipe(res);
};

function formatDateStr(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return null;
  }
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateStr(str) {
  if (!str || typeof str !== 'string' || !DATE_REGEX.test(str)) {
    return null;
  }
  const [y, m, d] = str.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    return null;
  }
  return date;
}

function isValidDateStr(str) {
  return parseDateStr(str) !== null;
}

function shiftDateStr(str, deltaDays) {
  const date = parseDateStr(str);
  if (!date) return null;
  date.setUTCDate(date.getUTCDate() + deltaDays);
  return formatDateStr(date);
}

function enumerateDates(start, end) {
  const startDate = parseDateStr(start);
  const endDate = parseDateStr(end);
  if (!startDate || !endDate || startDate > endDate) {
    return [];
  }
  const dates = [];
  const cursor = new Date(startDate.getTime());
  while (cursor <= endDate) {
    dates.push(formatDateStr(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

function purgeCacheForRange(start, end) {
  if (!start || !end || !isValidDateStr(start) || !isValidDateStr(end)) {
    return { removedFiles: 0, dates: [] };
  }
  if (!fs.existsSync(CACHE_DIR)) {
    return { removedFiles: 0, dates: [] };
  }
  const dates = enumerateDates(start, end);
  let removed = 0;
  for (const dateStr of dates) {
    const prefix = `daily_metrics_${dateStr}_`;
    try {
      const files = fs.readdirSync(CACHE_DIR).filter((name) => name.startsWith(prefix));
      for (const file of files) {
        fs.unlinkSync(path.join(CACHE_DIR, file));
        removed++;
      }
    } catch (e) {
      console.warn(`[CACHE PURGE] Erreur lors de la suppression pour ${dateStr}: ${e.message}`);
    }
  }
  if (removed > 0) {
    console.log(`[CACHE PURGE] Supprimé ${removed} fichier(s) de cache pour ${start} → ${end}`);
  }
  return { removedFiles: removed, dates };
}

function resolveForceRange(payload = {}) {
  const now = new Date();
  const todayStr = formatDateStr(now);
  const baseForce = payload.forceRefresh === true || payload.forceRefresh === 'true';
  const includeToday = payload.includeToday === true || payload.includeToday === 'true';

  const rangeFromPayload =
    (payload.range && typeof payload.range === 'object' && payload.range.start && payload.range.end)
      ? payload.range
      : null;

  const explicitStart = payload.start || payload.rangeStart || (rangeFromPayload && rangeFromPayload.start);
  const explicitEnd = payload.end || payload.rangeEnd || (rangeFromPayload && rangeFromPayload.end);

  const mode = payload.mode || payload.forceMode || null;

  const summary = {
    mode,
    includeToday,
    triggeredAt: new Date().toISOString()
  };

  const result = {
    start: null,
    end: null,
    forceRefresh: baseForce,
    mode,
    includeToday,
    summary
  };

  const ensureValidRange = (start, end, options = {}) => {
    if (!isValidDateStr(start) || !isValidDateStr(end)) return null;
    if (start > end) return null;
    return { start, end };
  };

  if (!mode && explicitStart && explicitEnd) {
    const valid = ensureValidRange(explicitStart, explicitEnd);
    if (valid) {
      result.start = valid.start;
      result.end = valid.end;
      summary.start = valid.start;
      summary.end = valid.end;
    }
    return result;
  }

  switch (mode) {
    case 'today': {
      result.forceRefresh = true;
      result.start = todayStr;
      result.end = todayStr;
      break;
    }
    case 'yesterday': {
      result.forceRefresh = true;
      const yesterday = shiftDateStr(todayStr, -1);
      result.start = yesterday;
      result.end = yesterday;
      break;
    }
    case 'range': {
      const startValue = explicitStart || todayStr;
      let endValue = explicitEnd || startValue;
      if (includeToday) {
        endValue = todayStr;
      }
      const valid = ensureValidRange(startValue, endValue);
      if (valid) {
        result.forceRefresh = true;
        result.start = valid.start;
        result.end = valid.end;
      }
      break;
    }
    case 'auto': {
      const lastSyncDate = payload.lastSyncDate && isValidDateStr(payload.lastSyncDate)
        ? payload.lastSyncDate
        : null;
      const thresholdHours = payload.autoThresholdHours ? Number(payload.autoThresholdHours) : null;
      const nowMs = now.getTime();
      let shouldTrigger = true;
      if (thresholdHours && payload.lastSyncTimestamp) {
        const lastSyncTs = Date.parse(payload.lastSyncTimestamp);
        if (!Number.isNaN(lastSyncTs)) {
          const diffHours = (nowMs - lastSyncTs) / (1000 * 60 * 60);
          shouldTrigger = diffHours >= thresholdHours;
        }
      }
      if (shouldTrigger && lastSyncDate && lastSyncDate < todayStr) {
        result.forceRefresh = true;
        result.start = shiftDateStr(lastSyncDate, 1) || todayStr;
        result.end = todayStr;
      } else {
        result.forceRefresh = result.forceRefresh || false;
        result.start = todayStr;
        result.end = todayStr;
      }
      break;
    }
    default: {
      if (explicitStart && explicitEnd) {
        const valid = ensureValidRange(explicitStart, explicitEnd);
        if (valid) {
          result.start = valid.start;
          result.end = valid.end;
        }
      } else {
        result.start = explicitStart || null;
        result.end = explicitEnd || null;
      }
      break;
    }
  }

  if (!result.start || !result.end) {
    summary.start = result.start || explicitStart || null;
    summary.end = result.end || explicitEnd || null;
  } else {
    summary.start = result.start;
    summary.end = result.end;
  }

  return result;
}

// ==========================================
// PHASE 4.2 : RETRY AVEC BACKOFF EXPONENTIEL
// ==========================================
async function runPythonScriptWithRetry(args = [], maxRetries = 3) {
  let attempt = 0;
  let lastError = null;

  while (attempt < maxRetries) {
    attempt++;
    const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Max 10s
    
    if (attempt > 1) {
      console.log(`[RETRY] Attempt ${attempt}/${maxRetries} after ${backoffMs}ms backoff`);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }

    try {
      const result = await runPythonScript(args);
      if (result && result.ok) {
        console.log(`[RETRY] Success on attempt ${attempt}`);
        return result;
      }
      // Si résultat non-OK mais pas d'erreur fatale, ne pas retry
      if (result && !result.error?.includes('No python executable')) {
        console.log(`[RETRY] Non-fatal error, returning result: ${result.error}`);
        return result;
      }
      lastError = result?.error || 'Unknown error';
      console.log(`[RETRY] Attempt ${attempt} failed: ${lastError}`);
    } catch (error) {
      lastError = error.message;
      console.log(`[RETRY] Attempt ${attempt} exception: ${lastError}`);
    }
  }

  console.error(`[RETRY] All ${maxRetries} attempts failed. Last error: ${lastError}`);
  return {
    ok: false,
    error: `Failed after ${maxRetries} attempts: ${lastError}`,
    retries: maxRetries
  };
}

// ==========================================
// FONCTION ORIGINALE RUN PYTHON (AMÉLIORÉE)
// ==========================================
async function runPythonScript(args = []) {
  return new Promise((resolve) => {
    const candidates = process.platform === 'win32' ? [
      'C://Python313//python.exe',
      'python', 'py', 'python3'
    ] : ['python3', 'python'];
    let index = 0;
    let lastErr = '';

    const tryNext = () => {
      if (index >= candidates.length) {
        return resolve({ ok: false, error: `No python executable found. Last error: ${lastErr}` });
      }
      const exe = candidates[index++];
      const py = spawn(exe, args, { cwd: __dirname });
      let out = '';
      let err = '';
      
      py.stdout.on('data', (d) => {
        const data = d.toString();
        out += data;
        if (data.includes('ok') || data.includes('error')) {
          console.log('[PYTHON STDOUT]', data.trim());
        }
      });
      
      py.stderr.on('data', (d) => {
        const logData = d.toString();
        err += logData;
        console.log('[PYTHON STDERR]', logData.trim());
      });
      
      py.on('error', (e) => {
        lastErr = e.message;
        tryNext();
      });
      
      py.on('close', (code) => {
        console.log(`[PYTHON] Process exited with code ${code}`);
        if (err.trim()) {
          console.log('[PYTHON] Final stderr summary:', err.trim().substring(0, 500));
        }
        if (code !== 0) {
          console.error('[SERVER] Python failed with code:', code);
          lastErr = err.trim() || `exit ${code}`;
          tryNext();
        } else {
          try {
            const json = JSON.parse(out);
            console.log('[PYTHON] Successfully parsed JSON response');
            return resolve(json);
          } catch (e) {
            console.error('[PYTHON] Failed to parse JSON:', e.message);
            return resolve({ ok: false, error: 'Invalid JSON from python', raw: out, stderr: err.trim() });
          }
        }
      });
    };
    tryNext();
  });
}

// ==========================================
// INITIALISATION EXPRESS
// ==========================================
const app = express();
app.use(cors());
app.use(express.json());
app.use(compression());

// Forcer USE_PYTHON si pas défini
if (!process.env.USE_PYTHON) {
  process.env.USE_PYTHON = '1';
  console.log('[SERVER] USE_PYTHON not set in env, defaulting to 1');
}

let lastStatus = {
  lastSync: null,
  ok: true,
  message: 'En attente de synchronisation',
};
let lastForcedResponse = null;

// ==========================================
// STRUCTURED LOGGING & MÉTRIQUES SERVEUR
// ==========================================

const LOG_DIR = path.join(__dirname, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'garmin-sync.log');

if (!fs.existsSync(LOG_DIR)) {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  } catch (error) {
    console.error('[SERVER] Unable to create log directory:', error.message);
  }
}

const serverMetrics = {
  upSince: new Date().toISOString(),
  sync: {
    total: 0,
    success: 0,
    failure: 0,
    cacheHit: 0,
    servedFromCooldown: 0,
    python: {
      count: 0,
      totalDurationMs: 0,
      lastDurationMs: null
    },
    forcedDelta: {
      appliedCount: 0,
      removedPoints: 0
    },
    lastRequest: null,
    lastError: null
  },
  cache: {
    hits: 0,
    misses: 0,
    bypass: 0
  },
  telemetry: {
    ingested: 0,
    lastIngest: null,
    lastPayload: null,
    history: []
  }
};

const appendStructuredLog = (event, details = {}) => {
  const entry = {
    ts: new Date().toISOString(),
    event,
    ...details
  };

  console.log(`[STRUCTURED:${event}]`, JSON.stringify(details));

  fs.appendFile(LOG_FILE, JSON.stringify(entry) + os.EOL, (err) => {
    if (err) {
      console.error('[SERVER] Failed to append structured log:', err.message);
    }
  });
};

const buildMetricsSnapshot = () => {
  const pythonCount = serverMetrics.sync.python.count || 0;
  const pythonAvg = pythonCount > 0
    ? Math.round(serverMetrics.sync.python.totalDurationMs / pythonCount)
    : 0;

  return {
    upSince: serverMetrics.upSince,
    lastStatus,
    sync: {
      total: serverMetrics.sync.total,
      success: serverMetrics.sync.success,
      failure: serverMetrics.sync.failure,
      cacheHit: serverMetrics.sync.cacheHit,
      servedFromCooldown: serverMetrics.sync.servedFromCooldown,
      forcedDelta: {
        appliedCount: serverMetrics.sync.forcedDelta.appliedCount,
        removedPoints: serverMetrics.sync.forcedDelta.removedPoints
      },
      python: {
        count: serverMetrics.sync.python.count,
        lastDurationMs: serverMetrics.sync.python.lastDurationMs,
        averageDurationMs: pythonAvg
      },
      lastRequest: serverMetrics.sync.lastRequest,
      lastError: serverMetrics.sync.lastError
    },
    cache: {
      hits: serverMetrics.cache.hits,
      misses: serverMetrics.cache.misses,
      bypass: serverMetrics.cache.bypass,
      size: serverCache.cache.size
    },
    telemetry: {
      ingested: serverMetrics.telemetry.ingested,
      lastIngest: serverMetrics.telemetry.lastIngest,
      lastPayload: serverMetrics.telemetry.lastPayload,
      history: serverMetrics.telemetry.history
    }
  };
};

const ADMIN_METRICS_REFRESH_INTERVAL_MS = 5000;
const ADMIN_METRICS_PAGE_HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Tableau de bord métriques Garmin</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #0f172a;
      --surface: #1e293b;
      --surface-soft: #16213e;
      --border: rgba(148, 163, 184, 0.25);
      --text: #e2e8f0;
      --text-muted: #94a3b8;
      --accent: #38bdf8;
      --success: #34d399;
      --danger: #f87171;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    body {
      background: radial-gradient(circle at top, rgba(56, 189, 248, 0.08), transparent 60%), var(--bg);
      color: var(--text);
      min-height: 100vh;
      padding: 24px;
    }
    .container {
      max-width: 1080px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    header {
      display: flex;
      flex-direction: column;
      gap: 8px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 16px;
    }
    header h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #f8fafc;
    }
    header p {
      font-size: 0.95rem;
      color: var(--text-muted);
    }
    .grid {
      display: grid;
      gap: 16px;
    }
    .grid.cols-3 {
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    }
    .card {
      background: linear-gradient(145deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95));
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 16px;
      box-shadow: 0 16px 32px rgba(15, 23, 42, 0.35);
      backdrop-filter: blur(12px);
    }
    .card h2 {
      font-size: 1.1rem;
      margin-bottom: 12px;
      color: #f1f5f9;
    }
    .stat {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .stat label {
      font-size: 0.75rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-muted);
    }
    .stat span {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text);
    }
    .stat small {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .status {
      padding: 12px 16px;
      border-radius: 12px;
      border: 1px solid var(--border);
      background: rgba(15, 23, 42, 0.6);
      font-size: 0.95rem;
      line-height: 1.4;
    }
    .status strong {
      color: var(--accent);
      font-weight: 600;
    }
    .lists {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 300px;
      overflow-y: auto;
      padding-right: 4px;
    }
    .lists ul {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .lists li {
      padding: 12px;
      border-radius: 12px;
      border: 1px solid rgba(148, 163, 184, 0.15);
      background: rgba(15, 23, 42, 0.65);
      font-size: 0.85rem;
      line-height: 1.35;
      color: #cbd5f5;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 999px;
      background: rgba(56, 189, 248, 0.12);
      color: var(--accent);
      font-size: 0.75rem;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      font-weight: 600;
    }
    .error {
      color: var(--danger);
      margin-top: 8px;
      font-size: 0.9rem;
    }
    @media (max-width: 640px) {
      body {
        padding: 16px;
      }
      header h1 {
        font-size: 1.35rem;
      }
    }
  </style>
</head>
<body>
  <main class="container">
    <header>
      <div class="badge">/api/garmin/metrics</div>
      <h1>Tableau de bord métriques Garmin</h1>
      <p>
        Actualisation automatique toutes les ${(ADMIN_METRICS_REFRESH_INTERVAL_MS / 1000).toFixed(0)} secondes.
        Données consolidées front + serveur pour supervision temps réel.
      </p>
      <div class="status">
        <strong>Message :</strong> <span id="status-message">—</span><br />
        <strong>Dernière actualisation :</strong> <span id="updated-at">—</span><br />
        <strong>Serveur actif depuis :</strong> <span id="uptime">—</span>
      </div>
      <div id="error-banner" class="error"></div>
    </header>

    <section class="grid cols-3">
      <article class="card">
        <h2>Synchronisations</h2>
        <div class="grid">
          <div class="stat">
            <label>Total</label>
            <span id="sync-total">0</span>
          </div>
          <div class="stat">
            <label>Succès</label>
            <span id="sync-success">0</span>
          </div>
          <div class="stat">
            <label>Échecs</label>
            <span id="sync-failure">0</span>
          </div>
          <div class="stat">
            <label>Cache (serveur)</label>
            <span id="sync-cache-hit">0</span>
          </div>
          <div class="stat">
            <label>Cooldown</label>
            <span id="sync-cooldown">0</span>
          </div>
          <div class="stat">
            <label>Delta forcé</label>
            <span id="sync-forced-delta">0</span>
            <small id="sync-forced-delta-removed">points retirés : 0</small>
          </div>
        </div>
      </article>

      <article class="card">
        <h2>Python</h2>
        <div class="grid">
          <div class="stat">
            <label>Appels</label>
            <span id="python-count">0</span>
          </div>
          <div class="stat">
            <label>Durée moyenne</label>
            <span id="python-average">0 ms</span>
          </div>
          <div class="stat">
            <label>Dernière durée</label>
            <span id="python-last">0 ms</span>
          </div>
          <div class="stat">
            <label>Dernière requête</label>
            <span id="last-request">—</span>
            <small id="last-request-meta">—</small>
          </div>
          <div class="stat">
            <label>Dernière erreur</label>
            <span id="last-error">—</span>
          </div>
        </div>
      </article>

      <article class="card">
        <h2>Cache serveur</h2>
        <div class="grid">
          <div class="stat">
            <label>Hits</label>
            <span id="cache-hits">0</span>
          </div>
          <div class="stat">
            <label>Misses</label>
            <span id="cache-misses">0</span>
          </div>
          <div class="stat">
            <label>Bypass</label>
            <span id="cache-bypass">0</span>
          </div>
          <div class="stat">
            <label>Entrées</label>
            <span id="cache-size">0</span>
          </div>
        </div>
      </article>
    </section>

    <section class="grid cols-3">
      <article class="card" style="grid-column: span 2;">
        <h2>Télémétrie client</h2>
        <div class="grid">
          <div class="stat">
            <label>Payloads ingérés</label>
            <span id="telemetry-ingested">0</span>
          </div>
          <div class="stat">
            <label>Dernière ingestion</label>
            <span id="telemetry-last-ingest">—</span>
          </div>
          <div class="stat">
            <label>Session</label>
            <span id="telemetry-session">—</span>
            <small id="telemetry-schema">—</small>
          </div>
          <div class="stat">
            <label>Dernier motif</label>
            <span id="telemetry-reason">—</span>
            <small id="telemetry-generated-at">—</small>
          </div>
        </div>

        <div class="lists" style="margin-top: 16px;">
          <h3 style="font-size: 0.95rem; color: var(--text-muted);">Historique des 10 dernières ingestions</h3>
          <ul id="telemetry-history"></ul>
        </div>
      </article>

      <article class="card">
        <h2>Export brut</h2>
        <div class="grid">
          <button id="download-json" style="
            background: rgba(56, 189, 248, 0.15);
            border: 1px solid rgba(56, 189, 248, 0.35);
            color: var(--accent);
            padding: 10px 16px;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s ease;
          ">
            Télécharger JSON
          </button>
          <small style="color: var(--text-muted); display:block;">Récupère le snapshot courant depuis l'API Metrics.</small>
        </div>
      </article>
    </section>
  </main>

  <script>
    (() => {
      const refreshMs = ${ADMIN_METRICS_REFRESH_INTERVAL_MS};
      const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'medium' });
      const relativeFormatter = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });

      const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) {
          el.textContent = value;
        }
      };

      const formatDate = (value) => {
        if (!value) return '—';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return dateFormatter.format(date);
      };

      const formatRelative = (value) => {
        if (!value) return '—';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        const diffMs = Date.now() - date.getTime();
        const diffSeconds = Math.round(diffMs / 1000);
        if (Math.abs(diffSeconds) < 60) {
          return relativeFormatter.format(-diffSeconds, 'second');
        }
        const diffMinutes = Math.round(diffSeconds / 60);
        if (Math.abs(diffMinutes) < 60) {
          return relativeFormatter.format(-diffMinutes, 'minute');
        }
        const diffHours = Math.round(diffMinutes / 60);
        if (Math.abs(diffHours) < 24) {
          return relativeFormatter.format(-diffHours, 'hour');
        }
        const diffDays = Math.round(diffHours / 24);
        return relativeFormatter.format(-diffDays, 'day');
      };

      const renderHistory = (history) => {
        const list = document.getElementById('telemetry-history');
        if (!list) return;
        list.innerHTML = '';
        if (!Array.isArray(history) || history.length === 0) {
          const li = document.createElement('li');
          li.textContent = 'Historique vide';
          list.appendChild(li);
          return;
        }
        history.slice(0, 10).forEach((entry) => {
          const li = document.createElement('li');
          li.textContent = \`\${formatDate(entry.acceptedAt)} — \${entry.sessionId || '—'} (\${entry.reason || '—'})\`;
          list.appendChild(li);
        });
      };

      const updateMetrics = (payload, timestamp) => {
        if (!payload) return;
        setText('updated-at', formatDate(timestamp));
        setText('uptime', formatRelative(payload.upSince));
        setText('status-message', payload.lastStatus?.message || '—');

        setText('sync-total', payload.sync?.total ?? 0);
        setText('sync-success', payload.sync?.success ?? 0);
        setText('sync-failure', payload.sync?.failure ?? 0);
        setText('sync-cache-hit', payload.sync?.cacheHit ?? 0);
        setText('sync-cooldown', payload.sync?.servedFromCooldown ?? 0);
        const forcedDeltaCount = payload.sync?.forcedDelta?.appliedCount ?? 0;
        const forcedDeltaRemoved = payload.sync?.forcedDelta?.removedPoints ?? 0;
        setText('sync-forced-delta', forcedDeltaCount);
        setText('sync-forced-delta-removed', \`points retirés : \${forcedDeltaRemoved}\`);

        setText('python-count', payload.sync?.python?.count ?? 0);
        setText('python-average', \`\${payload.sync?.python?.averageDurationMs ?? 0} ms\`);
        setText('python-last', \`\${payload.sync?.python?.lastDurationMs ?? 0} ms\`);
        setText('last-request', formatDate(payload.sync?.lastRequest?.timestamp));
        setText('last-request-meta', payload.sync?.lastRequest?.source || '—');
        setText('last-error', payload.sync?.lastError || '—');

        setText('cache-hits', payload.cache?.hits ?? 0);
        setText('cache-misses', payload.cache?.misses ?? 0);
        setText('cache-bypass', payload.cache?.bypass ?? 0);
        setText('cache-size', payload.cache?.size ?? 0);

        setText('telemetry-ingested', payload.telemetry?.ingested ?? 0);
        setText('telemetry-last-ingest', formatDate(payload.telemetry?.lastIngest));
        setText('telemetry-session', payload.telemetry?.lastPayload?.sessionId || '—');
        setText('telemetry-schema', payload.telemetry?.lastPayload?.schemaVersion ? \`schema \${payload.telemetry.lastPayload.schemaVersion}\` : '—');
        setText('telemetry-reason', payload.telemetry?.lastPayload?.reason || '—');
        setText('telemetry-generated-at', formatDate(payload.telemetry?.lastPayload?.generatedAt));

        renderHistory(payload.telemetry?.history);
      };

      const setError = (message) => {
        const el = document.getElementById('error-banner');
        if (el) {
          el.textContent = message || '';
        }
      };

      const loadMetrics = async () => {
        try {
          setError('');
          const response = await fetch('/api/garmin/metrics', { cache: 'no-store' });
          if (!response.ok) {
            throw new Error(\`HTTP \${response.status}\`);
          }
          const data = await response.json();
          updateMetrics(data.metrics, data.timestamp);
        } catch (error) {
          setError(\`Erreur de chargement : \${error.message || error}\`);
        }
      };

      const downloadJson = async () => {
        try {
          const response = await fetch('/api/garmin/metrics', { cache: 'no-store' });
          if (!response.ok) {
            throw new Error(\`HTTP \${response.status}\`);
          }
          const data = await response.json();
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = \`garmin-metrics-\${new Date().toISOString()}.json\`;
          document.body.appendChild(anchor);
          anchor.click();
          document.body.removeChild(anchor);
          URL.revokeObjectURL(url);
        } catch (error) {
          setError(\`Téléchargement impossible : \${error.message || error}\`);
        }
      };

      const init = () => {
        const downloadBtn = document.getElementById('download-json');
        if (downloadBtn) {
          downloadBtn.addEventListener('click', downloadJson);
        }
        loadMetrics();
        setInterval(loadMetrics, refreshMs);
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden) {
            loadMetrics();
          }
        });
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
      } else {
        init();
      }
    })();
  </script>
</body>
</html>`;


// ==========================================
// ENDPOINTS
// ==========================================

// Status endpoint avec rate limiting
app.get('/api/garmin/status', statusLimiter, (req, res) => {
  console.log('[SERVER] GET /api/garmin/status');
  res.json({
    ...lastStatus,
    sample: true,
  });
});

// Sync endpoint avec rate limiting, cache et retry
app.post('/api/garmin/sync', syncLimiter, async (req, res) => {
  const requestStartTime = Date.now();
  const requestTimestamp = new Date().toISOString();
  console.log(`[🔍 DIAGNOSTIC SERVEUR] ${requestTimestamp} - POST /api/garmin/sync`);
  console.log('[SERVER] POST /api/garmin/sync');
  console.log('[SERVER] USE_PYTHON env var:', process.env.USE_PYTHON);

  serverMetrics.sync.total += 1;
  serverMetrics.sync.lastError = null;
  
  try {
    const payload = {
      ...(req.query || {}),
      ...(req.body && typeof req.body === 'object' ? req.body : {})
    };
    const resolution = resolveForceRange(payload);
    const start = resolution.start || payload.start || null;
    const end = resolution.end || payload.end || null;
    const lastSyncTimestamp = payload.lastSyncTimestamp || null;
    const forceRefresh = resolution.forceRefresh ? 'true' : (payload.forceRefresh === 'true' ? 'true' : 'false');

    appendStructuredLog('sync_request_received', {
      timestamp: requestTimestamp,
      mode: resolution.mode || null,
      start,
      end,
      includeToday: resolution.includeToday || false,
      forceRefresh: forceRefresh === 'true',
      lastSyncTimestamp: lastSyncTimestamp || null
    });

    console.log('[SERVER] Payload reçu:', payload);
    console.log('[SERVER] Plage normalisée - start:', start, 'end:', end, 'mode:', resolution.mode || 'default');
    console.log(`[🔍 DIAGNOSTIC SERVEUR] Paramètres reçus - start: ${start}, end: ${end}, lastSyncTimestamp: ${lastSyncTimestamp || 'none'}, forceRefresh: ${forceRefresh}`);
    
    // ✅ PHASE 2.4 : Inclure lastSyncTimestamp dans la clé de cache
    const cacheKey = serverCache.generateKey({ start, end, lastSyncTimestamp: lastSyncTimestamp || 'none' });
    // ✅ PHASE 3.1 : Passer lastSyncTimestamp à get() pour décision intelligente
    const cachedResult = forceRefresh === 'true' ? null : serverCache.get(cacheKey, lastSyncTimestamp || null);
    
    if (cachedResult) {
      const cacheAge = Date.now() - (serverCache.cache.get(cacheKey)?.timestamp || 0);
      const cacheAgeSeconds = Math.round(cacheAge / 1000);
      // ✅ PHASE 2.2 : Calculer TTL effectif selon si c'est aujourd'hui
      const today = new Date().toISOString().split('T')[0];
      const isTodayCache = cacheKey.includes(today);
      const effectiveTtl = isTodayCache ? serverCache.todayTtlMs : serverCache.defaultTtlMs;
      const ttlRemaining = Math.round((effectiveTtl - cacheAge) / 1000);
      console.log(`[🔍 DIAGNOSTIC SERVEUR] ⚠️ CACHE SERVEUR UTILISÉ - Clé: ${cacheKey}, Âge: ${cacheAgeSeconds}s, TTL restant: ${ttlRemaining}s (${isTodayCache ? 'aujourd\'hui' : 'passé'})`);
      console.log('[SERVER] Returning cached result');
      lastStatus = { lastSync: cachedResult.lastSync, ok: true, message: 'Synchronisation terminée (cache)' };
      serverMetrics.sync.cacheHit += 1;
      const durationMs = Date.now() - requestStartTime;
      serverMetrics.sync.success += 1;
      serverMetrics.sync.lastRequest = {
        timestamp: requestTimestamp,
        durationMs,
        cacheHit: true,
        mode: resolution.mode || null,
        forceRefresh: false,
        cacheKey,
        source: 'server-cache'
      };
      appendStructuredLog('sync_served_from_cache', {
        cacheKey,
        cacheAgeSeconds,
        ttlRemainingSeconds: ttlRemaining,
        durationMs
      });
      return res.json({
        ...cachedResult,
        cached: true,
        diagnostic: {
          cacheUsed: true,
          cacheKey,
          cacheAgeSeconds,
          ttlRemainingSeconds: ttlRemaining
        }
      });
    } else if (forceRefresh === 'true') {
      serverMetrics.cache.bypass += 1;
      console.log(`[🔍 DIAGNOSTIC SERVEUR] ForceRefresh activé - bypass du cache serveur`);
    } else {
      serverMetrics.cache.misses += 1;
      console.log(`[🔍 DIAGNOSTIC SERVEUR] Cache serveur - Pas de cache valide pour la clé: ${cacheKey}`);
    }

    let cachePurgeInfo = null;
    if (forceRefresh === 'true' && start && end) {
      cachePurgeInfo = purgeCacheForRange(start, end);
    }

    if (process.env.USE_PYTHON === '1') {
      const rangeKey = buildRangeKey(start, end);
      const isForceRequest = forceRefresh === 'true';
      if (isForceRequest && lastForcedResponse && lastForcedResponse.rangeKey === rangeKey) {
        const now = Date.now();
        const ageMs = now - lastForcedResponse.timestamp;
        if (ageMs < FORCE_REFRESH_COOLDOWN_MS) {
          console.log(`[🔍 DIAGNOSTIC SERVEUR] ForceRefresh court-circuité - réponse réutilisée (${Math.round(ageMs / 1000)}s)`);
          serverMetrics.sync.servedFromCooldown += 1;
          serverMetrics.sync.success += 1;
          const durationMs = Date.now() - requestStartTime;
          serverMetrics.sync.lastRequest = {
            timestamp: requestTimestamp,
            durationMs,
          cacheHit: true,
            mode: resolution.mode || null,
            forceRefresh: true,
            cacheKey,
            source: 'cooldown'
          };
          appendStructuredLog('sync_served_from_cooldown', {
            rangeKey,
            durationMs,
            cooldownAgeMs: ageMs
          });
          lastStatus = {
            lastSync: lastForcedResponse.payload?.lastSync || lastStatus.lastSync,
            ok: true,
            message: 'Synchronisation servie depuis le cooldown force'
          };
          return res.json({
            ...lastForcedResponse.payload,
            cached: true,
            diagnostic: {
              cacheUsed: true,
              servedFromCooldown: true,
              cooldownAgeSeconds: Math.round(ageMs / 1000),
              cooldownRemainingSeconds: Math.max(0, Math.round((FORCE_REFRESH_COOLDOWN_MS - ageMs) / 1000)),
              previousCacheKey: lastForcedResponse.cacheKey || null
            }
          });
        }
      }

      console.log('[SERVER] Using Python script...');
      const pythonStartTime = Date.now();
      const args = ['fetch_garmin_data.py'];
      if (start && end) {
        args.push('--start', String(start), '--end', String(end));
      }
      // ✅ PHASE 2.4 : Passer lastSyncTimestamp au script Python
      if (lastSyncTimestamp) {
        args.push('--lastSyncTimestamp', String(lastSyncTimestamp));
        console.log(`[🔍 DIAGNOSTIC SERVEUR] Envoi lastSyncTimestamp à Python: ${lastSyncTimestamp}`);
        console.log('[SERVER] Passing lastSyncTimestamp to Python:', lastSyncTimestamp);
      }
      console.log('[SERVER] Calling Python script with args:', args);
      console.log(`[🔍 DIAGNOSTIC SERVEUR] Appel script Python avec args: ${args.join(' ')}`);
      
      // PHASE 4.2 : Utiliser retry avec backoff exponentiel
      const result = await runPythonScriptWithRetry(args, 3);
      const pythonDuration = Date.now() - pythonStartTime;
      
      console.log('[SERVER] Python script result:', result?.ok ? 'OK' : 'FAILED');
      console.log(`[🔍 DIAGNOSTIC SERVEUR] Script Python terminé - Durée: ${pythonDuration}ms, OK: ${result?.ok || false}`);
      serverMetrics.sync.python.lastDurationMs = pythonDuration;
      serverMetrics.sync.python.totalDurationMs += pythonDuration;
      serverMetrics.sync.python.count += 1;
      appendStructuredLog('python_execution_completed', {
        durationMs: pythonDuration,
        ok: !!result?.ok,
        mode: resolution.mode || null
      });
      
      if (result && result.ok) {
        // ✅ PHASE 1 : Logging détaillé des données Python
        if (result.data) {
          const activitiesCount = Object.values(result.data.activities || {}).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
          const dailyMetricsCount = Object.keys(result.data.dailyMetrics || {}).length;
          console.log(`[🔍 DIAGNOSTIC SERVEUR] Données Python - Activités: ${activitiesCount}, Métriques: ${dailyMetricsCount}, LastSync: ${result.lastSync}`);
        }

        const forcedRange = resolution.mode
          ? {
              mode: resolution.mode,
              start: resolution.start || start || null,
              end: resolution.end || end || null,
              includeToday: resolution.includeToday || false,
              triggeredAt: resolution.summary?.triggeredAt || new Date().toISOString(),
              cachePurge: cachePurgeInfo
            }
          : null;

        // PHASE 4.3 : Mettre en cache uniquement les résultats OK
        if (forceRefresh !== 'true') {
          serverCache.set(cacheKey, result);
          console.log(`[🔍 DIAGNOSTIC SERVEUR] Résultat mis en cache avec la clé: ${cacheKey}`);
        } else {
          console.log(`[🔍 DIAGNOSTIC SERVEUR] ForceRefresh activé - résultat non mis en cache`);
        }
        lastStatus = { lastSync: result.lastSync, ok: true, message: 'Synchronisation terminée (Python)' };
        const totalDuration = Date.now() - requestStartTime;
        const responsePayload = {
          ...result,
          forcedRange,
          diagnostic: {
            cacheUsed: false,
            pythonDuration,
            totalDuration,
            requestTimestamp,
            resolve: {
              mode: resolution.mode || null,
              forceRefresh: forceRefresh === 'true',
              includeToday: resolution.includeToday || false,
              cachePurge: cachePurgeInfo
            }
          }
        };

        let outboundPayload = responsePayload;

        if (forceRefresh === 'true' && lastSyncTimestamp) {
          const { payload: reducedPayload, meta: deltaMeta } = applyForcedDeltaReduction(responsePayload, lastSyncTimestamp);
          outboundPayload = reducedPayload;
          outboundPayload.diagnostic = {
            ...(outboundPayload.diagnostic || {}),
            forcedDelta: {
              applied: deltaMeta.applied,
              removedPoints: deltaMeta.removedPoints || 0,
              daysUpdated: deltaMeta.daysUpdated || 0,
              threshold: lastSyncTimestamp
            }
          };
          if (deltaMeta.applied) {
            serverMetrics.sync.forcedDelta.appliedCount += 1;
            serverMetrics.sync.forcedDelta.removedPoints += deltaMeta.removedPoints || 0;
            appendStructuredLog('forced_delta_applied', {
              removedPoints: deltaMeta.removedPoints || 0,
              daysUpdated: deltaMeta.daysUpdated || 0,
              threshold: lastSyncTimestamp
            });
          }
        }

        let forcedPayloadClone = null;
        if (forceRefresh === 'true') {
          forcedPayloadClone = JSON.parse(JSON.stringify(outboundPayload));
        }

        sendJsonStream(res, outboundPayload);

        if (forceRefresh === 'true') {
          lastForcedResponse = {
            timestamp: Date.now(),
            rangeKey,
            payload: forcedPayloadClone,
            cacheKey
          };

          // Libérer au plus vite les objets lourds du heap (surtout en mode forçage).
          if (responsePayload.data) {
            responsePayload.data = null;
          }
          if (typeof global.gc === 'function') {
            setImmediate(() => {
              try {
                global.gc();
              } catch (gcError) {
                console.warn('[SERVER] GC manual call failed:', gcError.message);
              }
            });
          }
        }
        const durationMs = Date.now() - requestStartTime;
        serverMetrics.sync.success += 1;
        serverMetrics.sync.lastRequest = {
          timestamp: requestTimestamp,
          durationMs: durationMs,
          cacheHit: false,
          mode: resolution.mode || null,
          forceRefresh: forceRefresh === 'true',
          cacheKey,
          pythonDuration,
          source: 'python'
        };
        appendStructuredLog('sync_success', {
          durationMs,
          pythonDuration,
          mode: resolution.mode || null,
          forceRefresh: forceRefresh === 'true',
          cacheKey
        });
        return;
      } else {
        console.error('[SERVER] Python run failed:', result);
        console.error(`[🔍 DIAGNOSTIC SERVEUR] ❌ Échec script Python - Erreur: ${result?.error || 'Unknown error'}`);
        lastStatus = { lastSync: lastStatus.lastSync, ok: false, message: 'Python error' };
        serverMetrics.sync.failure += 1;
        serverMetrics.sync.lastError = result?.error || 'python failed';
        appendStructuredLog('sync_python_error', {
          error: result?.error || 'python failed',
          mode: resolution.mode || null,
          forceRefresh: forceRefresh === 'true'
        });
        return res.json({ ok: false, error: result.error || 'python failed', lastSync: new Date().toISOString() });
      }
    } else {
      // Fallback mock côté Node
      console.log('[SERVER] USE_PYTHON not set or not "1", using mock Node data');
      const now = new Date().toISOString();
      const mockResult = { ok: true, lastSync: now, data: { activities: {}, dailyMetrics: {} } };
      
      // Mettre en cache le mock aussi
      serverCache.set(cacheKey, mockResult);
      
      lastStatus = { lastSync: now, ok: true, message: 'Synchronisation terminée (mock Node)' };
      serverMetrics.sync.success += 1;
      serverMetrics.sync.lastRequest = {
        timestamp: requestTimestamp,
        durationMs: Date.now() - requestStartTime,
        cacheHit: false,
        mode: resolution.mode || null,
        forceRefresh: forceRefresh === 'true',
        cacheKey,
        source: 'mock-node'
      };
      return res.json(mockResult);
    }
  } catch (e) {
    lastStatus = { lastSync: lastStatus.lastSync, ok: false, message: e.message };
    serverMetrics.sync.failure += 1;
    serverMetrics.sync.lastError = e.message;
    serverMetrics.sync.lastRequest = {
      timestamp: requestTimestamp,
      durationMs: Date.now() - requestStartTime,
      cacheHit: false,
      error: e.message,
      source: 'exception'
    };
    appendStructuredLog('sync_error', {
      error: e.message,
      stack: e.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Fallback GET (au cas où la requête part en GET côté front)
app.get('/api/garmin/sync', syncLimiter, async (req, res) => {
  console.log('[SERVER] GET /api/garmin/sync (fallback)');
  try {
    const now = new Date().toISOString();
    lastStatus = { lastSync: now, ok: true, message: 'Synchronisation terminée (GET fallback)' };
    res.json({ ok: true, lastSync: now });
  } catch (e) {
    lastStatus = { lastSync: lastStatus.lastSync, ok: false, message: e.message };
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Endpoint pour vider le cache manuellement (debug/admin)
app.post('/api/garmin/cache/clear', (req, res) => {
  console.log('[SERVER] POST /api/garmin/cache/clear');
  serverCache.clear();
  res.json({ ok: true, message: 'Cache cleared' });
});

// Endpoint pour voir les stats du cache (debug/admin)
app.get('/api/garmin/cache/stats', (req, res) => {
  console.log('[SERVER] GET /api/garmin/cache/stats');
  res.json({
    ok: true,
    cacheSize: serverCache.cache.size,
    ttlMinutes: serverCache.ttlMs / 60000,
    entries: Array.from(serverCache.cache.entries()).map(([key, entry]) => ({
      key,
      ageSeconds: Math.round((Date.now() - entry.timestamp) / 1000),
      expiresInSeconds: Math.round((serverCache.ttlMs - (Date.now() - entry.timestamp)) / 1000)
    }))
  });
});

app.get('/api/garmin/metrics', (req, res) => {
  console.log('[SERVER] GET /api/garmin/metrics');
  const snapshot = buildMetricsSnapshot();
  appendStructuredLog('metrics_requested', { requester: req.ip });
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    metrics: snapshot
  });
});

app.get('/admin/metrics', (req, res) => {
  console.log('[SERVER] GET /admin/metrics');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(ADMIN_METRICS_PAGE_HTML);
});

app.post('/api/garmin/metrics', async (req, res) => {
  console.log('[SERVER] POST /api/garmin/metrics');
  const acceptedAt = new Date().toISOString();
  try {
    const payload = req.body || {};

    serverMetrics.telemetry.ingested += 1;
    serverMetrics.telemetry.lastIngest = acceptedAt;
    serverMetrics.telemetry.lastPayload = {
      sessionId: payload.sessionId ?? null,
      schemaVersion: payload.schemaVersion ?? null,
      generatedAt: payload.generatedAt ?? null,
      reason: payload.reason ?? null
    };

    if (!Array.isArray(serverMetrics.telemetry.history)) {
      serverMetrics.telemetry.history = [];
    }
    serverMetrics.telemetry.history.unshift({
      acceptedAt,
      sessionId: payload.sessionId ?? null,
      reason: payload.reason ?? null
    });
    serverMetrics.telemetry.history = serverMetrics.telemetry.history.slice(0, 50);

    appendStructuredLog('metrics_ingested', {
      acceptedAt,
      sessionId: payload.sessionId ?? null,
      schemaVersion: payload.schemaVersion ?? null,
      reason: payload.reason ?? null,
      from: req.ip
    });

    const snapshot = buildMetricsSnapshot();
    res.json({
      ok: true,
      acceptedAt,
      metrics: snapshot,
      telemetry: serverMetrics.telemetry.lastPayload
    });
  } catch (error) {
    appendStructuredLog('metrics_ingest_error', {
      acceptedAt,
      error: error.message
    });
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ✅ PHASE 1 : Endpoint de diagnostic complet
app.get('/api/garmin/debug', (req, res) => {
  console.log('[SERVER] GET /api/garmin/debug');
  try {
    const cacheEntries = Array.from(serverCache.cache.entries()).map(([key, entry]) => ({
      key,
      timestamp: new Date(entry.timestamp).toISOString(),
      ageSeconds: Math.round((Date.now() - entry.timestamp) / 1000),
      expiresInSeconds: Math.round((serverCache.ttlMs - (Date.now() - entry.timestamp)) / 1000),
      dataSummary: {
        ok: entry.data?.ok,
        lastSync: entry.data?.lastSync,
        hasActivities: !!entry.data?.data?.activities,
        hasDailyMetrics: !!entry.data?.data?.dailyMetrics,
        activitiesCount: entry.data?.data?.activities ? 
          Object.values(entry.data.data.activities).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0) : 0,
        dailyMetricsCount: entry.data?.data?.dailyMetrics ? Object.keys(entry.data.data.dailyMetrics).length : 0
      }
    }));

    res.json({
      ok: true,
      timestamp: new Date().toISOString(),
      server: {
        cache: {
          size: serverCache.cache.size,
          ttlMinutes: serverCache.ttlMs / 60000,
          entries: cacheEntries
        },
        lastStatus: lastStatus,
        usePython: process.env.USE_PYTHON === '1'
      },
      diagnostic: {
        message: 'Endpoint de diagnostic - Utilisez ces informations pour comprendre le comportement du cache et de la synchronisation',
        cacheExplanation: 'Le cache serveur a un TTL de 5 minutes. Si une sync est faite dans les 5 minutes, les données en cache sont retournées.',
        frontendCacheExplanation: 'Le cache frontend a un TTL de 60 secondes. Il est utilisé avant même de faire une requête au serveur.'
      }
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ==========================================
// DÉMARRAGE SERVEUR
// ==========================================
const PORT = process.env.PORT || 3031;
app.listen(PORT, () => {
  console.log(`Garmin bridge server listening on http://localhost:${PORT}`);
  console.log(`[SERVER] USE_PYTHON environment variable: ${process.env.USE_PYTHON || 'NOT SET'}`);
  console.log(`[SERVER] Python will be used: ${process.env.USE_PYTHON === '1' ? 'YES' : 'NO'}`);
  console.log(`[SERVER] Rate limiting: ENABLED (sync: 5/min, status: 30/10s)`);
  console.log(`[SERVER] Cache: ENABLED (TTL: 5 minutes)`);
  console.log(`[SERVER] Retry: ENABLED (max 3 attempts with exponential backoff)`);
});
