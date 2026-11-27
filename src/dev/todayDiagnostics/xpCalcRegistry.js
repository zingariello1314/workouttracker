/**
 * Registre diagnostic des exécutions réelles de calculateSportXP.
 * Compte les compute() du single-flight, pas seulement acquireSharedSportXp.
 */

const MAX_ENTRIES = 400;
const entries = [];
let seq = 0;
let listener = null;

function anonHash(value) {
  const s = String(value ?? '');
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `h${(h >>> 0).toString(16)}`;
}

export function setXpCalcRegistryListener(fn) {
  listener = typeof fn === 'function' ? fn : null;
}

export function resetXpCalcRegistry() {
  entries.length = 0;
  seq = 0;
}

export function recordXpCalcEvent(partial) {
  const row = {
    id: ++seq,
    t: typeof performance !== 'undefined' ? performance.now() : Date.now(),
    ...partial,
    signatureAnon: partial.signatureAnon || anonHash(partial.signature),
    storageKeyAnon: partial.storageKeyAnon || anonHash(partial.storageKey)
  };
  delete row.signature;
  delete row.storageKey;
  entries.push(row);
  if (entries.length > MAX_ENTRIES) entries.shift();
  try {
    listener?.(row);
  } catch {
    /* ignore */
  }
  return row;
}

export function snapshotXpCalcRegistry() {
  const computes = entries.filter((e) => e.kind === 'compute');
  const acquires = entries.filter((e) => e.kind === 'acquire');
  const bySig = new Map();
  computes.forEach((e) => {
    bySig.set(e.signatureAnon, (bySig.get(e.signatureAnon) || 0) + 1);
  });
  return {
    totalEvents: entries.length,
    acquireCount: acquires.length,
    computeCount: computes.length,
    joinInFlightCount: acquires.filter((e) => e.outcome === 'join').length,
    cacheHitCount: acquires.filter((e) => e.outcome === 'cache-hit').length,
    distinctComputeSignatures: bySig.size,
    computeSignatureHistogram: [...bySig.entries()].map(([signatureAnon, count]) => ({
      signatureAnon,
      count
    })),
    recent: entries.slice(-80)
  };
}

export { anonHash };
