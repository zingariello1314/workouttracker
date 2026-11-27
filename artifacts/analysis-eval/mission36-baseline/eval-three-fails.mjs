import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runGameAAccuracy } from '../../../src/utils/sport/evaluation/gameAAccuracy.js';
import { runGameBDiscoveryQuality } from '../../../src/utils/sport/evaluation/gameBDiscoveryQuality.js';
import { claimFromDiscovery } from '../../../src/utils/sport/analyticalClaim.js';

const base = path.join(path.dirname(fileURLToPath(import.meta.url)), 'zip');
const audit = JSON.parse(fs.readFileSync(path.join(base, 'ANALYTICAL_AUDIT.json'), 'utf8'));
const cards = Object.values(audit.cardRegistry);
const kinds = ['disc_ratio_structure', 'disc_composed_load_phase', 'disc_quarter_profile'];
for (const kind of kinds) {
  const c = cards.find((x) => x.kind === kind && x.role === 'priority');
  if (!c) {
    console.log(kind, 'no priority');
    continue;
  }
  const rebuilt = claimFromDiscovery(
    { kind: c.kind, title: c.title, body: c.body, metrics: c.metrics },
    { period: c.period }
  );
  const card = {
    ...c,
    disposition: 'priority',
    claim: rebuilt || { proof: { observedValues: [] }, assertions: [] }
  };
  const a = runGameAAccuracy({
    insights: { shortTerm: [card], mediumTerm: [], longTerm: [], accessibleReserve: [] }
  });
  const b = runGameBDiscoveryQuality({
    insights: { shortTerm: [card], mediumTerm: [], longTerm: [], accessibleReserve: [] }
  });
  console.log(
    JSON.stringify({
      kind,
      period: c.period,
      claimOv: (rebuilt?.proof?.observedValues || []).length,
      A_fail: a.cases.filter((x) => x.issue === 'priority_without_numeric_proof').length,
      B_physio: b.cases.filter((x) => x.result === 'unsupported_physiology').length,
      hasCompositionMoves: (c.metrics?.composition?.namedMoves || []).length,
      metricSample: Object.keys(c.metrics || {})
        .filter((k) => !/^window|arc|selection|relative|exercise|name|date|gap|mechanism|thesis|population/i.test(k))
        .slice(0, 15)
    })
  );
}
