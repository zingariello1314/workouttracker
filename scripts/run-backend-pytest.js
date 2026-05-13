/**
 * Lance pytest dans backend/ avec le Python du venv local s'il existe.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const backend = path.join(root, 'backend');
const win = process.platform === 'win32';
const venvPy = win
  ? path.join(backend, '.venv', 'Scripts', 'python.exe')
  : path.join(backend, '.venv', 'bin', 'python');
const py = fs.existsSync(venvPy) ? venvPy : win ? 'python' : 'python3';
const r = spawnSync(py, ['-m', 'pytest', 'tests/', '-q'], {
  cwd: backend,
  stdio: 'inherit',
  shell: false
});
process.exit(r.status === null ? 1 : r.status);
