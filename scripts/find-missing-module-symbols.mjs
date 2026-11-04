import fs from 'fs';

const bak = fs.readFileSync('src/utils/sport/recapPeriodDiscoveries.js.pre-split.bak', 'utf8');
const definedInOriginal = new Set();
for (const m of bak.matchAll(/^(?:export )?(?:async )?function ([A-Za-z0-9_]+)/gm)) {
  definedInOriginal.add(m[1]);
}
for (const m of bak.matchAll(/^(?:export )?const ([A-Za-z0-9_]+)/gm)) {
  definedInOriginal.add(m[1]);
}

const modules = [
  'recapPeriodVoice.js',
  'recapPeriodMeasure.js',
  'recapPeriodComparisons.js',
  'recapPeriodDetectDiscoveries.js',
  'recapPeriodSelection.js',
  'recapPeriodDiscoveries.js'
];

for (const file of modules) {
  const text = fs.readFileSync(`src/utils/sport/${file}`, 'utf8');
  const available = new Set();
  for (const m of text.matchAll(/import\s+\{([^}]+)\}/g)) {
    for (const part of m[1].split(',')) {
      const name = part.trim().split(/\s+as\s+/).pop().trim();
      if (name) available.add(name);
    }
  }
  for (const m of text.matchAll(/import\s+(\w+)\s+from/g)) available.add(m[1]);
  for (const m of text.matchAll(/^(?:export )?(?:async )?function ([A-Za-z0-9_]+)/gm)) {
    available.add(m[1]);
  }
  for (const m of text.matchAll(/^(?:export )?const ([A-Za-z0-9_]+)/gm)) {
    available.add(m[1]);
  }
  // also mark re-exported names as available? no - re-export doesn't create local binding unless imported

  const missing = [...definedInOriginal].filter((n) => {
    if (available.has(n)) return false;
    // skip if only appears in export { } from
    const stripped = text.replace(/export\s*\{[\s\S]*?\}\s*from\s*['"][^'"]+['"];?/g, '');
    return new RegExp(`\\b${n}\\b`).test(stripped);
  });
  console.log(`\n${file}:`, missing.sort().join(', ') || '(ok)');
}
