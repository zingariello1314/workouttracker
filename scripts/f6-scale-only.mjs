/**
 * F6 — Charge synthétique seule (après fix collectLifetimeRepHistory).
 * Usage: npx vite-node scripts/f6-scale-only.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildPeriodDiscoveryBundle } from '../src/utils/sport/recapPeriodDiscoveries.js';
import { createRecapComputeScope, scopeStats } from '../src/utils/sport/recapComputeScope.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function buildSyntheticSnapshot({ days, exercises, setsPerEx = 3, repsBase = 10 }) {
  const reps = {};
  const checkedExercises = {};
  const start = new Date('2024-01-01T12:00:00Z');
  for (let d = 0; d < days; d += 1) {
    if (d % 2 === 1) continue;
    const dt = new Date(start.getTime() + d * 86400000);
    const ymd = dt.toISOString().slice(0, 10);
    for (let e = 1; e <= exercises; e += 1) {
      const id = 1000 + e;
      for (let s = 1; s <= setsPerEx; s += 1) {
        const key = `${ymd}_${id}`;
        reps[key] = repsBase + (e % 5) + (s % 3);
        checkedExercises[`${key}_s${s}`] = true;
      }
      checkedExercises[`${ymd}_${id}`] = true;
    }
  }
  return { reps, checkedExercises, enduranceData: { gtg: { days: {} }, sessions: {} } };
}

const sizes = [
  { label: '6w', days: 42, exercises: 8 },
  { label: '6m', days: 180, exercises: 12 },
  { label: '1y', days: 365, exercises: 16 },
  { label: '2y', days: 730, exercises: 20 }
];

const out = [];
for (const sz of sizes) {
  const synthetic = buildSyntheticSnapshot(sz);
  const end = new Date('2024-01-01T12:00:00Z');
  end.setUTCDate(end.getUTCDate() + sz.days - 1);
  const endYmd = end.toISOString().slice(0, 10);
  const window = { start: '2024-01-01', end: endYmd };
  const t0 = performance.now();
  const scope = createRecapComputeScope({ snapshot: synthetic, period: sz.label, window });
  const bundle = buildPeriodDiscoveryBundle({
    snapshot: synthetic,
    window,
    period: 'all',
    getExerciseNameById: (id) => `Ex ${id}`,
    computeScope: scope
  });
  const ms = Math.round((performance.now() - t0) * 100) / 100;
  out.push({
    label: sz.label,
    days: sz.days,
    exercises: sz.exercises,
    ms,
    all: (bundle.all || []).length,
    selected: (bundle.selected || []).length,
    scope: scopeStats(scope),
    fixture: 'synthetic-deterministic'
  });
  console.error(`[scale] ${sz.label} ${ms}ms selected=${(bundle.selected || []).length}`);
}

const dest = path.join(
  root,
  'docs/analyses-documentation/moteur analyse v1/fixtures/f6-scale-after-lifetime-fix.json'
);
fs.writeFileSync(
  dest,
  JSON.stringify({ generatedAt: new Date().toISOString(), note: 'après Map date O(n)', rows: out }, null, 2),
  'utf8'
);
console.log(JSON.stringify(out, null, 2));
