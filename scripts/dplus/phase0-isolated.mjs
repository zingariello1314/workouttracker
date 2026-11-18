/**
 * Phase 0 isolée. Ne lit ni n'écrit les bases Momentum.
 * Jeux synthétiques en mémoire. Aucune donnée personnelle.
 *
 * node scripts/dplus/phase0-isolated.mjs
 */
import { performance } from 'node:perf_hooks';

const DAY = '2026-06-01';

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

function sameValue(a, b) {
  return Object.is(a, b) || JSON.stringify(a) === JSON.stringify(b);
}

/** Politique D+ durcie. Absent du patch = non touché. Tombstone = suppression. */
export function mergeKey(base, local, remote, localTouched, remoteTouched) {
  const localT = localTouched === true;
  const remoteT = remoteTouched === true;
  if (!localT && !remoteT) return { status: 'unchanged', value: remote };
  if (!localT && remoteT) return { status: 'take-remote', value: remote };
  if (localT && !remoteT) {
    if (sameValue(local, base) && sameValue(remote, base)) return { status: 'unchanged', value: base };
    if (sameValue(remote, base)) return { status: 'take-local', value: local };
  }
  if (sameValue(local, remote)) return { status: 'convergent', value: local };
  if (sameValue(remote, base)) return { status: 'take-local', value: local };
  if (sameValue(local, base)) return { status: 'take-remote', value: remote };
  return { status: 'conflict', base, local, remote };
}

function applyGroup(baseMap, localMap, remoteMap, keys) {
  const conflicts = [];
  const next = { ...remoteMap };
  for (const key of keys) {
    const hasL = Object.prototype.hasOwnProperty.call(localMap, key);
    const hasR = Object.prototype.hasOwnProperty.call(remoteMap, key);
    const hasB = Object.prototype.hasOwnProperty.call(baseMap, key);
    const r = mergeKey(
      hasB ? baseMap[key] : undefined,
      hasL ? localMap[key] : undefined,
      hasR ? remoteMap[key] : undefined,
      hasL,
      hasR && !sameValue(remoteMap[key], hasB ? baseMap[key] : undefined)
    );
    if (r.status === 'conflict') conflicts.push({ key, ...r });
    else if (r.value === undefined && r.status === 'take-local') delete next[key];
    else next[key] = r.value;
  }
  return { next, conflicts };
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

function perInstanceDrafts() {
  const drafts = {
    'inst-a': { tractions: true },
    'inst-b': { dips: true }
  };
  const merged = {};
  for (const patch of Object.values(drafts)) Object.assign(merged, patch);
  return merged;
}

const sets = {
  S: buildHistory(30, 8),
  M: buildHistory(400, 12),
  L: buildHistory(2000, 12)
};

const report = { node: process.version, sets: {}, lostUpdate: lostUpdateSharedKey(), perInstance: perInstanceDrafts() };

for (const [name, data] of Object.entries(sets)) {
  const checkedKeys = Object.keys(data.checked).length;
  const json = JSON.stringify(data);
  const oneDay = {};
  for (const [k, v] of Object.entries(data.checked)) {
    if (k.startsWith('2020-01-15')) oneDay[k] = v;
  }
  report.sets[name] = {
    checkedKeys,
    jsonBytes: Buffer.byteLength(json),
    daySliceBytes: Buffer.byteLength(JSON.stringify(oneDay)),
    signature: time(() => signatureLikeUseSportXP(data.checked)),
    stringify: time(() => JSON.stringify(data.checked))
  };
}

const base = { tractions: 10, dips: 10 };
const local = { tractions: 12, dips: 10 };
const remote = { tractions: 10, dips: 15 };
report.case1 = applyGroup(base, { tractions: 12 }, { tractions: 10, dips: 15 }, ['tractions', 'dips']);
report.case2 = applyGroup({ tractions: 10 }, { tractions: 12 }, { tractions: 15 }, ['tractions']);
report.case3 = applyGroup({ tractions: 10 }, { tractions: 12 }, { tractions: 12 }, ['tractions']);
report.case4 = applyGroup(
  { tractions: 10 },
  { tractions: { deleted: true } },
  { tractions: 15 },
  ['tractions']
);

console.log(JSON.stringify(report, null, 2));
