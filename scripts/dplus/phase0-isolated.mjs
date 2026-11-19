/**
 * Phase 0 isolée. Ne lit ni n'écrit les bases Momentum.
 * Jeux synthétiques en mémoire. Aucune donnée personnelle.
 *
 * node scripts/dplus/phase0-isolated.mjs
 */
import { performance } from 'node:perf_hooks';
import { mergeEntriesById, mergePatch, retainNewerDrafts } from './threeWayMerge.mjs';

function days(n) {
  const out = [];
  const start = Date.UTC(2020, 0, 1);
  for (let i = 0; i < n; i += 1) {
    const d = new Date(start + i * 86400000);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    out.push(`${y}-${m}-${day}`);
  }
  return out;
}

function buildHistory(dayCount, exercisesPerDay) {
  const checked = {};
  const reps = {};
  for (const date of days(dayCount)) {
    for (let e = 0; e < exercisesPerDay; e += 1) {
      const key = `${date}_exo${e}`;
      if (e % 3 !== 0) checked[key] = true;
      reps[key] = String(8 + (e % 5));
    }
  }
  return { checked, reps };
}

function signatureLikeUseSportXP(checked) {
  let count = 0;
  let sum = 0;
  for (const [k, v] of Object.entries(checked)) {
    if (v !== true) continue;
    count += 1;
    for (let i = 0; i < k.length; i += 1) sum = (sum * 31 + k.charCodeAt(i)) | 0;
  }
  return { count, sum };
}

function time(fn, n = 7) {
  const samples = [];
  for (let i = 0; i < n; i += 1) {
    const t0 = performance.now();
    fn();
    samples.push(performance.now() - t0);
  }
  samples.sort((a, b) => a - b);
  const mid = samples[Math.floor(samples.length / 2)];
  return {
    runs: n,
    medianMs: Math.round(mid * 100) / 100,
    minMs: Math.round(samples[0] * 100) / 100,
    maxMs: Math.round(samples[samples.length - 1] * 100) / 100
  };
}

function lostUpdateSharedKey() {
  const initial = { tractions: false };
  const a = { ...initial, tractions: true };
  const b = { ...initial, dips: true };
  let stored = { ...initial };
  stored = a;
  stored = b;
  return {
    stored,
    tractionsLost: stored.tractions !== true,
    dipsKept: stored.dips === true
  };
}

const sets = {
  S: buildHistory(30, 8),
  M: buildHistory(400, 12),
  L: buildHistory(2000, 12)
};

const report = {
  node: process.version,
  measuredAt: '2026-11-18',
  sets: {},
  lostUpdate: lostUpdateSharedKey(),
  perInstance: Object.assign({}, { tractions: true }, { dips: true }),
  case1: mergePatch({
    baseMap: { tractions: 10, dips: 10 },
    localPatch: { tractions: 12 },
    remoteMap: { tractions: 10, dips: 15 }
  }),
  case2: mergePatch({
    baseMap: { tractions: 10 },
    localPatch: { tractions: 12 },
    remoteMap: { tractions: 15 }
  }),
  case3: mergePatch({
    baseMap: { tractions: 10 },
    localPatch: { tractions: 12 },
    remoteMap: { tractions: 12 }
  }),
  case4: mergePatch({
    baseMap: { tractions: 10 },
    localPatch: { tractions: { deleted: true } },
    remoteMap: { tractions: 15 }
  }),
  case5: mergePatch({
    baseMap: { serie: { reps: 10, weight: 20 } },
    localPatch: { serie: { reps: 12, weight: 20 } },
    remoteMap: { serie: { reps: 10, weight: 25 } }
  }),
  generation: retainNewerDrafts(
    { a: { generation: 4 }, b: { generation: 5, patch: { dips: true } } },
    4
  ),
  gtgUnion: mergeEntriesById([{ id: 'ah_1', reps: 5 }], [{ id: 'ah_2', reps: 3 }]),
  gtgRetry: mergeEntriesById([{ id: 'ah_1', reps: 5 }], [{ id: 'ah_1', reps: 5 }])
};

for (const [name, data] of Object.entries(sets)) {
  const json = JSON.stringify(data);
  const oneDay = {};
  for (const [k, v] of Object.entries(data.checked)) {
    if (k.startsWith('2020-01-15')) oneDay[k] = v;
  }
  report.sets[name] = {
    checkedKeys: Object.keys(data.checked).length,
    jsonBytes: Buffer.byteLength(json),
    daySliceBytes: Buffer.byteLength(JSON.stringify(oneDay)),
    signature: time(() => signatureLikeUseSportXP(data.checked)),
    stringify: time(() => JSON.stringify(data.checked))
  };
}

console.log(JSON.stringify(report, null, 2));
