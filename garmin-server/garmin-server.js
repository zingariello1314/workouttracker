// Garmin Bridge Server - Optimisé avec Rate Limiting, Retry Backoff, et Cache
// PHASE 4 : OPTIMISATION (4.1, 4.2, 4.3)
// Run: node garmin-server.js

const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const rateLimit = require('express-rate-limit');

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
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // ✅ PHASE 2.2 : TTL adaptatif selon si c'est aujourd'hui ou une date passée
    const now = Date.now();
    const cacheAge = now - entry.timestamp;
    
    // Déterminer si c'est pour aujourd'hui (clé contient la date d'aujourd'hui)
    const today = new Date().toISOString().split('T')[0];
    const isTodayCache = key.includes(today);
    const effectiveTtl = isTodayCache ? this.todayTtlMs : this.defaultTtlMs;
    
    if (cacheAge > effectiveTtl) {
      // Cache expiré
      this.cache.delete(key);
      console.log(`[CACHE] Entry expired: ${key} (age: ${Math.round(cacheAge / 1000)}s, TTL: ${Math.round(effectiveTtl / 1000)}s)`);
      return null;
    }
    
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
  
  try {
    const { start, end, lastSyncTimestamp, forceRefresh } = req.query || {};
    console.log('[SERVER] Query params - start:', start, 'end:', end, 'lastSyncTimestamp:', lastSyncTimestamp, 'forceRefresh:', forceRefresh);
    console.log(`[🔍 DIAGNOSTIC SERVEUR] Paramètres reçus - start: ${start}, end: ${end}, lastSyncTimestamp: ${lastSyncTimestamp || 'none'}, forceRefresh: ${forceRefresh || false}`);
    
    // ✅ PHASE 2.4 : Inclure lastSyncTimestamp dans la clé de cache
    const cacheKey = serverCache.generateKey({ start, end, lastSyncTimestamp: lastSyncTimestamp || 'none' });
    const cachedResult = forceRefresh === 'true' ? null : serverCache.get(cacheKey);
    
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
      console.log(`[🔍 DIAGNOSTIC SERVEUR] ForceRefresh activé - bypass du cache serveur`);
    } else {
      console.log(`[🔍 DIAGNOSTIC SERVEUR] Cache serveur - Pas de cache valide pour la clé: ${cacheKey}`);
    }

    if (process.env.USE_PYTHON === '1') {
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
      
      if (result && result.ok) {
        // ✅ PHASE 1 : Logging détaillé des données Python
        if (result.data) {
          const activitiesCount = Object.values(result.data.activities || {}).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
          const dailyMetricsCount = Object.keys(result.data.dailyMetrics || {}).length;
          console.log(`[🔍 DIAGNOSTIC SERVEUR] Données Python - Activités: ${activitiesCount}, Métriques: ${dailyMetricsCount}, LastSync: ${result.lastSync}`);
        }
        
        // PHASE 4.3 : Mettre en cache uniquement les résultats OK
        if (forceRefresh !== 'true') {
          serverCache.set(cacheKey, result);
          console.log(`[🔍 DIAGNOSTIC SERVEUR] Résultat mis en cache avec la clé: ${cacheKey}`);
        } else {
          console.log(`[🔍 DIAGNOSTIC SERVEUR] ForceRefresh activé - résultat non mis en cache`);
        }
        lastStatus = { lastSync: result.lastSync, ok: true, message: 'Synchronisation terminée (Python)' };
        const totalDuration = Date.now() - requestStartTime;
        return res.json({
          ...result,
          diagnostic: {
            cacheUsed: false,
            pythonDuration,
            totalDuration,
            requestTimestamp
          }
        });
      } else {
        console.error('[SERVER] Python run failed:', result);
        console.error(`[🔍 DIAGNOSTIC SERVEUR] ❌ Échec script Python - Erreur: ${result?.error || 'Unknown error'}`);
        lastStatus = { lastSync: lastStatus.lastSync, ok: false, message: 'Python error' };
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
      return res.json(mockResult);
    }
  } catch (e) {
    lastStatus = { lastSync: lastStatus.lastSync, ok: false, message: e.message };
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
