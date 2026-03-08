/**
 * Démarre le backend BookFinder (FastAPI) depuis la racine du projet.
 * Utilisé par "npm run dev" pour lancer frontend + backend ensemble.
 * Sans shell pour éviter que les chemins avec espaces (ex. "workout tracker") soient coupés sous Windows.
 */
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const backendDir = path.join(root, 'backend');
const isWin = process.platform === 'win32';
const pythonBin = path.join(root, '.venv', isWin ? 'Scripts' : 'bin', isWin ? 'python.exe' : 'python');

const child = spawn(pythonBin, ['-m', 'uvicorn', 'zlib_server:app', '--reload', '--port', '8000'], {
  cwd: backendDir,
  stdio: 'inherit',
  shell: false,
  windowsVerbatimArguments: false,
  env: { ...process.env, PYTHONUNBUFFERED: '1' },
});

child.on('error', (err) => {
  console.error('[start-backend] Erreur:', err.message);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
