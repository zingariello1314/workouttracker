import fs from 'fs';
import { convertToStableNumericId } from '../src/utils/workoutExerciseIdResolve.js';
import { buildReverseStableIdIndex } from '../src/utils/sport/resolveStorageExerciseIdentity.js';

const nameById = JSON.parse(
  fs.readFileSync('docs/analyses-documentation/fixtures/exercise-name-map-main.json', 'utf8')
);
const snap = JSON.parse(
  fs.readFileSync('docs/analyses-documentation/fixtures/workout-main-jul-oct-2026.json', 'utf8')
);
const target = [
  '146651247',
  '1488780401',
  '1974855961',
  '405829990',
  '298605878',
  '1393146215',
  '1343403170',
  '1979012181',
  '728134920',
  '1647297599',
  '1433469569'
];

const seed = { ...nameById };
for (const k of Object.keys(snap.checkedExercises || {})) {
  const m = String(k).match(/^(\d{4}-\d{2}-\d{2})_(.+)$/);
  if (!m) continue;
  const id = m[2].replace(/_semaineA$|_semaineB$/, '');
  if (!(id in seed)) seed[id] = null;
}

const rev = buildReverseStableIdIndex(seed);
for (const t of target) {
  console.log(t, '->', rev.get(t) || rev.get(String(Number(t))));
}

console.log('--- direct hash ---');
for (const oid of Object.keys(seed)) {
  if (/^\d{7,}$/.test(oid)) continue;
  const h = String(convertToStableNumericId(oid));
  if (target.includes(h)) {
    console.log(JSON.stringify(oid), '=>', h, 'name=', seed[oid] || nameById[oid]);
  }
}

// Also try hashing every name-map value's possible original keys from db
import { exerciseDatabase } from '../src/data/exerciseDatabase.js';
const dbKeys = Object.keys(exerciseDatabase || {});
console.log('db keys', dbKeys.length);
for (const key of dbKeys) {
  for (const cand of [key, `db_${key}`, key.replace(/_/g, ' '), `db_${key.replace(/ /g, '_')}`]) {
    const h = String(convertToStableNumericId(cand));
    if (target.includes(h)) console.log('DB', cand, '=>', h, exerciseDatabase[key]?.name);
  }
}
