// Simple local bridge server for Garmin integration (MVP)
// Run: node garmin-server.js

const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');

// Forcer USE_PYTHON si pas défini (pour développement local)
if (!process.env.USE_PYTHON) {
  process.env.USE_PYTHON = '1';
  console.log('[SERVER] USE_PYTHON not set in env, defaulting to 1');
}

async function runPythonScript(args = []) {
  return new Promise((resolve) => {
    const candidates = process.platform === 'win32' ? [
      // Chemins explicites possibles (Python 3.13 par défaut sur ta machine)
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
        // Afficher aussi stdout pour debug
        if (data.includes('ok') || data.includes('error')) {
          console.log('[PYTHON STDOUT]', data.trim());
        }
      });
      py.stderr.on('data', (d) => {
        const logData = d.toString();
        err += logData;
        // Afficher TOUS les logs stderr dans la console immédiatement
        console.log('[PYTHON STDERR]', logData.trim());
      });
      py.on('error', (e) => {
        lastErr = e.message;
        tryNext();
      });
      py.on('close', (code) => {
        console.log(`[PYTHON] Process exited with code ${code}`);
        console.log(`[PYTHON] stdout length: ${out.length}, stderr length: ${err.length}`);
        // Afficher un résumé des logs à la fin
        if (err.trim()) {
          console.log('[PYTHON] Final stderr summary:', err.trim().substring(0, 500));
        }
        if (code !== 0) {
          console.error('[SERVER] Python failed with code:', code);
          console.error('[SERVER] Python stderr:', err.trim());
          lastErr = err.trim() || `exit ${code}`;
          tryNext();
        } else {
          try {
            const json = JSON.parse(out);
            console.log('[PYTHON] Successfully parsed JSON response');
            return resolve(json);
          } catch (e) {
            console.error('[PYTHON] Failed to parse JSON:', e.message);
            console.error('[PYTHON] stdout was:', out.substring(0, 500));
            return resolve({ ok: false, error: 'Invalid JSON from python', raw: out, stderr: err.trim() });
          }
        }
      });
    };
    tryNext();
  });
}

const app = express();
app.use(cors());
app.use(express.json());

let lastStatus = {
  lastSync: null,
  ok: true,
  message: 'En attente de synchronisation',
};

// Status endpoint (front polls this to show state)
app.get('/api/garmin/status', (req, res) => {
  console.log('[SERVER] GET /api/garmin/status');
  res.json({
    ...lastStatus,
    sample: true,
  });
});

// Sync endpoint (MVP: returns mock payload)
app.post('/api/garmin/sync', async (req, res) => {
  console.log('[SERVER] POST /api/garmin/sync');
  console.log('[SERVER] USE_PYTHON env var:', process.env.USE_PYTHON);
  try {
    const { start, end } = req.query || {};
    console.log('[SERVER] Query params - start:', start, 'end:', end);
    if (process.env.USE_PYTHON === '1') {
      console.log('[SERVER] Using Python script...');
      // Phase 2: appel Python réel (pour l’instant, le script renvoie un mock JSON formaté)
      const args = ['fetch_garmin_data.py'];
      if (start && end) {
        args.push('--start', String(start), '--end', String(end));
      }
      console.log('[SERVER] Calling Python script with args:', args);
      const result = await runPythonScript(args);
      console.log('[SERVER] Python script result:', result?.ok ? 'OK' : 'FAILED');
      if (result && result.ok) {
        lastStatus = { lastSync: result.lastSync, ok: true, message: 'Synchronisation terminée (Python)' };
        return res.json(result);
      } else {
        console.error('[SERVER] Python run failed:', result);
        // Renvoyer 200 avec ok:false pour éviter l'erreur rouge côté UI, tout en exposant le message
        lastStatus = { lastSync: lastStatus.lastSync, ok: false, message: 'Python error' };
        return res.json({ ok: false, error: result.error || 'python failed', lastSync: new Date().toISOString() });
      }
    } else {
      // Fallback mock côté Node
      console.log('[SERVER] USE_PYTHON not set or not "1", using mock Node data');
      console.log('[SERVER] Env vars:', Object.keys(process.env).filter(k => k.includes('PYTHON') || k.includes('USE')));
      const now = new Date().toISOString();
      lastStatus = { lastSync: now, ok: true, message: 'Synchronisation terminée (mock Node)' };
      return res.json({ ok: true, lastSync: now, data: { activities: {}, dailyMetrics: {} } });
    }
  } catch (e) {
    lastStatus = { lastSync: lastStatus.lastSync, ok: false, message: e.message };
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Fallback GET (au cas où la requête part en GET côté front)
app.get('/api/garmin/sync', async (req, res) => {
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

const PORT = process.env.PORT || 3031;
app.listen(PORT, () => {
  console.log(`Garmin bridge server listening on http://localhost:${PORT}`);
  console.log(`[SERVER] USE_PYTHON environment variable: ${process.env.USE_PYTHON || 'NOT SET'}`);
  console.log(`[SERVER] Python will be used: ${process.env.USE_PYTHON === '1' ? 'YES' : 'NO'}`);
});


