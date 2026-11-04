import fs from 'fs';

const orch = fs.readFileSync('src/utils/sport/recapPeriodDiscoveries.js', 'utf8');
const bak = fs.readFileSync('src/utils/sport/recapPeriodDiscoveries.js.pre-split.bak', 'utf8');

// Extract function/const names defined in original that are used in orchestrator body
const defined = new Set();
for (const m of bak.matchAll(/^(?:export )?(?:async )?function ([A-Za-z0-9_]+)/gm)) {
  defined.add(m[1]);
}
for (const m of bak.matchAll(/^export const ([A-Za-z0-9_]+)/gm)) {
  defined.add(m[1]);
}
for (const m of bak.matchAll(/^const ([A-Za-z0-9_]+)/gm)) {
  defined.add(m[1]);
}

// Symbols imported or locally defined in orchestrator
const available = new Set();
for (const m of orch.matchAll(/import\s+\{([^}]+)\}/g)) {
  for (const part of m[1].split(',')) {
    const name = part.trim().split(/\s+as\s+/).pop().trim();
    if (name) available.add(name);
  }
}
for (const m of orch.matchAll(/^(?:export )?(?:async )?function ([A-Za-z0-9_]+)/gm)) {
  available.add(m[1]);
}

const bodyStart = orch.indexOf('export function buildPeriodDiscoveryBundle');
const body = orch.slice(bodyStart);
const missing = [...defined].filter((n) => {
  if (available.has(n)) return false;
  return new RegExp(`\\b${n}\\b`).test(body);
});
console.log('missing in orchestrator body:', missing.sort().join(', ') || '(none)');
