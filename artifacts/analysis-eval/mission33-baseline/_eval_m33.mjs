import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runGameBDiscoveryQuality } from '../../../src/utils/sport/evaluation/gameBDiscoveryQuality.js';
import { runGameCCollective } from '../../../src/utils/sport/evaluation/gameCCollective.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const zip = path.join(__dirname, 'zip');
const outDir = __dirname;
const audit = JSON.parse(fs.readFileSync(path.join(zip, 'ANALYTICAL_AUDIT.json'), 'utf8'));
const ep = JSON.parse(fs.readFileSync(path.join(zip, 'eight-periods/eight-periods.json'), 'utf8'));
const live = JSON.parse(fs.readFileSync(path.join(zip, 'replay/LIVE_INPUTS.json'), 'utf8'));
const cards = Object.values(audit.cardRegistry || {});

const periodPacks = Object.entries(ep.periods || {}).map(([period, dossier]) => {
  const prio = dossier?.userAccessible?.priority || [];
  const reserve = dossier?.userAccessible?.reserve || [];
  return {
    period,
    insights: {
      shortTerm: prio.filter((_, i) => i < 8),
      mediumTerm: prio.filter((_, i) => i >= 8 && i < 16),
      longTerm: prio.filter((_, i) => i >= 16),
      accessibleReserve: reserve
    },
    p6: { counters: { reconciled: true }, priority: prio, reserve }
  };
});
const gameC = runGameCCollective({ periodPacks });
const p7 = ep.periods?.['7d'];
const insights7 = {
  shortTerm: (p7?.userAccessible?.priority || []).slice(0, 12),
  mediumTerm: [],
  longTerm: [],
  accessibleReserve: p7?.userAccessible?.reserve || []
};
const gameB = runGameBDiscoveryQuality({ insights: insights7 });
const fam = cards.filter(
  (c) =>
    String(c.kind || c.id || '').includes('session_family') ||
    String(c.id || '').includes('session_families')
);
const dens = cards.filter((c) =>
  /concentrent le travail|moins dense|plus dense/i.test(c.title || '')
);
const priorityCards = cards.filter((c) => c.disposition === 'priority' || c.role === 'priority');
const sample = priorityCards.slice(0, 24).map((c, i) => ({
  blindId: 'B' + String(i + 1).padStart(3, '0'),
  title: c.title,
  body: c.body,
  evidence: c.evidence || null,
  periodLabel: c.period
}));
const key = sample.map((s, i) => ({
  blindId: s.blindId,
  edition: 'v31',
  period: priorityCards[i]?.period,
  kind: priorityCards[i]?.kind,
  id: priorityCards[i]?.id,
  liveDigestHint: live.fingerprints?.digest,
  engineDigestHint: ep.fingerprint?.digest
}));

fs.writeFileSync(
  path.join(outDir, 'game-C-eight-horizons.json'),
  JSON.stringify(
    {
      schema: 'momentum.mission33.gameC.eight.v1',
      pass: gameC.pass,
      counters: {
        exactDuplicatesAccessible: gameC.exactDuplicatesAccessible,
        textualDuplicatesAccessible: gameC.textualDuplicatesAccessible,
        fusedSourcesAccessible: gameC.fusedSourcesAccessible,
        unexplainedRegistryIds: gameC.unexplainedRegistryIds,
        admissiblePreserved: gameC.admissiblePreserved
      },
      cases: gameC.cases,
      note: 'Jeu C sur catalogues réels 8 horizons ZIP v31'
    },
    null,
    2
  )
);
fs.writeFileSync(
  path.join(outDir, 'game-B-extended.json'),
  JSON.stringify(
    {
      schema: 'momentum.mission33.gameB.extended.v1',
      pass: gameB.pass,
      passScope: gameB.passScope,
      humanBlindPerformed: gameB.humanBlindPerformed,
      referenceHits: gameB.referenceHits,
      incorrectAttractive: gameB.incorrectAttractive,
      qualityDimensions: gameB.qualityDimensions,
      cases: gameB.cases,
      closureNote: gameB.closureNote
    },
    null,
    2
  )
);
fs.writeFileSync(
  path.join(outDir, 'blind-pack.json'),
  JSON.stringify(
    {
      schema: 'momentum.mission33.blindQualitative.v1',
      instruction:
        'Évaluer chaque carte sans connaître édition/kind. Noter 0-2 sur: exactitude, profondeur, pouvoir explicatif, contextualisation, niveaux, prudence causale, originalité, lisibilité, preuves, temporalité. Ne pas utiliser les scores moteur.',
      cards: sample
    },
    null,
    2
  )
);
fs.writeFileSync(
  path.join(outDir, 'blind-key.json'),
  JSON.stringify(
    {
      schema: 'momentum.mission33.blindKey.v1',
      SEPARATE_FROM_PACK: true,
      note: 'Ne pas montrer à l’évaluateur avant notation',
      key
    },
    null,
    2
  )
);

const counts = cards.reduce((a, c) => {
  a[c.period] = (a[c.period] || 0) + 1;
  return a;
}, {});
fs.writeFileSync(
  path.join(outDir, 'V1V2_editorial_diagnostic.json'),
  JSON.stringify(
    {
      schema: 'momentum.mission33.v1v2.editorial.v1',
      cardCountsByPeriod: counts,
      session_families_overview: {
        occurrences: fam.length,
        sameBody1104: fam.filter((c) => (c.body || '').length === 1104).length,
        periods: fam.map((c) => ({
          period: c.period,
          disposition: c.disposition,
          role: c.role
        })),
        verdict: 'defaut_selection_temporelle — même corps prioritaire sur 8 horizons',
        status: 'Echec_avant_correctif'
      },
      density_title: dens.map((c) => ({ period: c.period, title: c.title })),
      densityVerdict: dens.some((c) =>
        /concentrent le travail sur moins de temps/i.test(c.title || '')
      )
        ? 'Echec — titre embellit densité inférieure ; correctif M33 moins dense'
        : 'ok',
      liveInputsGap: {
        liveDigest: live.fingerprints?.digest,
        engineDigest: ep.fingerprint?.digest,
        liveProgram: live.program,
        engineProgramId: ep.fingerprint?.programId,
        liveGarminSleep: live.fingerprints?.snapshot?.garminSleepDays ?? live.garmin,
        engineGarminSleep: ep.fingerprint?.garminSleepDays,
        cause:
          'LIVE_INPUTS assemblé sans activeProgram/garminData/nameMap alors que eight-periods.fingerprint les consommait',
        status: 'Echec_export_v31 ; cause démontrée ; correctif code v32'
      },
      population: audit.diagnostics?.populationMetricChecks?.counts || null
    },
    null,
    2
  )
);

console.log(
  JSON.stringify(
    {
      gameCPass: gameC.pass,
      gameBPass: gameB.pass,
      gameBHits: gameB.referenceHits,
      dims: gameB.qualityDimensions,
      fam: fam.length,
      dens: dens.map((c) => c.title),
      live: live.fingerprints?.digest,
      engine: ep.fingerprint?.digest
    },
    null,
    2
  )
);
