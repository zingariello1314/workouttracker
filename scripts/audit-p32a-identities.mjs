import fs from 'fs';
import { convertToStableNumericId } from '../src/utils/workoutExerciseIdResolve.js';

const names = JSON.parse(
  fs.readFileSync('docs/analyses-documentation/fixtures/exercise-name-map-main.json', 'utf8')
);
const snap = JSON.parse(
  fs.readFileSync('docs/analyses-documentation/fixtures/workout-main-jul-oct-2026.json', 'utf8')
);

const reverse = new Map();
for (const [sid, name] of Object.entries(names)) {
  const h = String(convertToStableNumericId(sid));
  if (reverse.has(h) && reverse.get(h).sid !== sid) {
    console.warn('HASH COLLISION', h, reverse.get(h), sid);
  }
  reverse.set(h, { sid, name });
}

const octIds = new Map();
for (const [k, v] of Object.entries(snap.reps || {})) {
  const m = String(k).match(/^(\d{4}-\d{2}-\d{2})_(.+)$/);
  if (!m) continue;
  const d = m[1];
  let id = m[2].replace(/_(semaineA|semaineB)$/, '');
  if (d < '2026-10-01' || d > '2026-10-30') continue;
  if (snap.checkedExercises[k] !== true) continue;
  const n = parseInt(String(v), 10) || 0;
  if (!octIds.has(id)) octIds.set(id, { reps: 0, keys: 0 });
  const row = octIds.get(id);
  row.reps += n;
  row.keys += 1;
}

const rows = [];
for (const [id, row] of [...octIds.entries()].sort((a, b) => b[1].reps - a[1].reps)) {
  const direct = names[id] || null;
  const via = reverse.get(String(id)) || null;
  let path = 'unresolved';
  let name = null;
  let originalId = null;
  if (direct) {
    path = 'name_map_direct';
    name = direct;
    originalId = id;
  } else if (via) {
    path = 'reverse_stable_hash';
    name = via.name;
    originalId = via.sid;
  } else if (String(id).startsWith('db_')) {
    path = 'db_key_candidate';
    originalId = id;
  } else if (id === 'complementary_endurance_pushups') {
    path = 'complementary_pushups';
    name = 'Pompes endurance (complémentaire)';
  }
  rows.push({ id, ...row, path, name, originalId });
}

const byPath = {};
rows.forEach((r) => {
  byPath[r.path] = (byPath[r.path] || 0) + 1;
});
console.log(JSON.stringify({ distinct: rows.length, byPath, rows }, null, 2));
