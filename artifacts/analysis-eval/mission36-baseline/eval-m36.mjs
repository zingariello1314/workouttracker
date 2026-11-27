import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runGameAAccuracy } from '../../../src/utils/sport/evaluation/gameAAccuracy.js';
import { runGameBDiscoveryQuality } from '../../../src/utils/sport/evaluation/gameBDiscoveryQuality.js';
import { runGameCCollective } from '../../../src/utils/sport/evaluation/gameCCollective.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const base = path.join(__dirname, 'zip');
const audit = JSON.parse(fs.readFileSync(path.join(base, 'ANALYTICAL_AUDIT.json'), 'utf8'));
const cards = Object.values(audit.cardRegistry || {});
const periods = ['today', '7d', '30d', '3m', '6m', '1y', '2y', 'all'];

function packFor(period) {
  const list = cards.filter((c) => c.period === period);
  const ordered = list.slice().sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  const priority = ordered.filter((c) => c.role === 'priority');
  const reserve = ordered.filter((c) => c.role !== 'priority');
  // disposition priority for Game A check
  const shortTerm = priority.map((c) => ({
    ...c,
    disposition: c.disposition === 'priority' ? 'priority' : 'priority',
    claim: c.claim || {
      proof: { observedValues: c.observedValues || c.metrics?.observedValues || [] },
      assertions: []
    }
  }));
  return {
    period,
    insights: {
      shortTerm,
      mediumTerm: [],
      longTerm: [],
      accessibleReserve: reserve
    }
  };
}

const packs = periods.map(packFor);
const allPriority = packs.flatMap((p) => p.insights.shortTerm);
const gameA = runGameAAccuracy({
  insights: {
    shortTerm: allPriority,
    mediumTerm: [],
    longTerm: [],
    accessibleReserve: []
  }
});
const gameB = runGameBDiscoveryQuality({
  insights: {
    shortTerm: allPriority.slice(0, 80),
    mediumTerm: [],
    longTerm: [],
    accessibleReserve: []
  }
});
const gameC = runGameCCollective({ periodPacks: packs });

const titleOverlap = (a, b) => {
  const ta = new Set(
    cards
      .filter((c) => c.period === a && c.role === 'priority')
      .map((c) => String(c.title || '').trim().toLowerCase())
  );
  const tb = cards
    .filter((c) => c.period === b && c.role === 'priority')
    .map((c) => String(c.title || '').trim().toLowerCase());
  const shared = tb.filter((t) => ta.has(t));
  return { shared: shared.length, of: tb.length, titles: shared.slice(0, 12) };
};

const bodyOverlap = (a, b) => {
  const ba = new Set(
    cards
      .filter((c) => c.period === a && c.role === 'priority')
      .map((c) => String(c.body || '').trim())
  );
  const bb = cards
    .filter((c) => c.period === b && c.role === 'priority')
    .map((c) => String(c.body || '').trim());
  const shared = bb.filter((t) => ba.has(t));
  return { shared: shared.length, of: bb.length };
};

const live = JSON.parse(fs.readFileSync(path.join(base, 'replay/LIVE_INPUTS.json'), 'utf8'));
const scheduleEx = Object.values(live.program?.schedule || {}).flatMap((d) => d.exercises || []);
const withSeries = scheduleEx.filter((e) => e.series || (e.sets != null && e.reps !== '' && e.reps != null));

const out = {
  gameA: {
    pass: gameA.pass,
    factualConflicts: gameA.factualConflicts,
    priorityWithoutProof: (gameA.cases || []).filter((c) => c.issue === 'priority_without_numeric_proof')
      .length,
    sample: (gameA.cases || [])
      .filter((c) => c.issue === 'priority_without_numeric_proof')
      .slice(0, 5)
      .map((c) => c.id)
  },
  gameB: {
    pass: gameB.pass,
    unsupportedPhysiology: (gameB.cases || []).filter((c) => c.result === 'unsupported_physiology')
      .length,
    qualityDimensions: gameB.qualityDimensions,
    referenceHits: gameB.referenceHits
  },
  gameC: {
    pass: gameC.pass,
    textualDuplicatesAccessible: gameC.textualDuplicatesAccessible,
    unexplainedRegistryIds: gameC.unexplainedRegistryIds
  },
  horizonOverlap: {
    '1y_vs_2y_titles': titleOverlap('1y', '2y'),
    '2y_vs_all_titles': titleOverlap('2y', 'all'),
    '1y_vs_2y_bodies': bodyOverlap('1y', '2y'),
    '2y_vs_all_bodies': bodyOverlap('2y', 'all')
  },
  live: {
    digest: live.fingerprints?.digest,
    reproducibility: live.reproducibility,
    scheduleExercises: scheduleEx.length,
    withPrescriptions: withSeries.length,
    programStructureNote:
      withSeries.length === 0
        ? 'LIMITED — series/sets/reps empty in exported skeleton (engine uses series field)'
        : 'prescriptions present'
  }
};

fs.writeFileSync(path.join(__dirname, 'eval-m36-result.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
