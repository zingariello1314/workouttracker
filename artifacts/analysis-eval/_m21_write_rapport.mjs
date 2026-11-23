import { readFileSync, writeFileSync } from 'fs';

const r = JSON.parse(readFileSync('artifacts/analysis-eval/mission21-replay-eight.json', 'utf8'));
const chrono = JSON.parse(readFileSync('artifacts/analysis-eval/mission21-chrono-memory.json', 'utf8'));
const attr = JSON.parse(readFileSync('artifacts/analysis-eval/mission21-attribution-proof.json', 'utf8'));

const periods = {};
for (const [k, v] of Object.entries(r.periods || {})) {
  const c = (v.collectives || [])[0];
  const m = (v.monthlyFamily || [])[0];
  periods[k] = {
    counts: v.counts,
    reconciliationDelta: v.reconciliationDelta,
    collective: c
      ? {
          title: c.title,
          phenomenonId: c.phenomenonId,
          memory: c.memory,
          sharedFactCount: c.sharedFactCount,
          confirmationDates: c.confirmationDates,
          namedCount: c.namedCount
        }
      : null,
    monthly: m
      ? {
          title: m.title,
          attributionObserved: m.attributionObserved,
          contributionCount: m.contributionCount,
          sharedFactCount: m.sharedFactCount,
          conclusionScope: m.conclusionScope
        }
      : null
  };
}

const rapport = {
  schema: 'momentum.m21EditionReport.v1',
  generatedAt: new Date().toISOString(),
  mission: r.mission,
  edition: r.edition,
  fingerprint: r.fingerprint,
  environment: r.environment,
  gateA: {
    classic3881: attr.populationsPrev30,
    attributionHonest: attr.attribution,
    contributionsReconciled: attr.reconciled,
    reconciliationGap: attr.reconciliationGap
  },
  memoryChrono: {
    episodeId: chrono.episodeId,
    noFutureLeak: chrono.noFutureLeak,
    states: chrono.steps.map((s) => ({
      cutoff: s.cutoff,
      state: s.state,
      transition: s.transition
    }))
  },
  periods,
  limits: [
    'DOM_NON_OBSERVE',
    'VITEST_GLOBALE_OUVERTE',
    'JEUX_ABC_PARTIELS',
    'P6_NON_CLOTUREE',
    'NO_GO_P7'
  ]
};

writeFileSync(
  'artifacts/analysis-eval/mission21-rapport-edition.json',
  JSON.stringify(rapport, null, 2),
  'utf8'
);

const lines = [
  '# Mission 21 — Rapport d\'édition',
  '',
  `- Édition : \`${r.edition}\``,
  `- Mission : ${r.mission}`,
  `- Fingerprint données : ${r.fingerprint?.digest || r.fingerprint}`,
  `- Banque exercices : ${r.environment?.exerciseBank?.digest} (${r.environment?.exerciseBank?.keyCount} clés)`,
  '',
  '## Porte A',
  '',
  `- CLASSIC prev30 : **${attr.populationsPrev30.classic}** (ok=${attr.populationsPrev30.classicOk})`,
  `- GTG déduit : ${attr.populationsPrev30.gtgDeduction}`,
  `- recognizedVolumeShare : ${Math.round((attr.attribution.recognizedVolumeShareRecent || 0) * 100)} %`,
  `- partitionCoverage : ${Math.round((attr.attribution.partitionCoverageShareRecent || 0) * 100)} %`,
  `- contributions réconciliées : ${attr.reconciled} (gap=${attr.reconciliationGap})`,
  '',
  '## Mémoire chrono',
  '',
  `- episodeId : \`${chrono.episodeId}\``,
  `- noFutureLeak : **${chrono.noFutureLeak}**`,
  ...chrono.steps.map(
    (s) => `- ${s.cutoff} → ${s.state}${s.transition ? ` (${s.transition})` : ''}`
  ),
  '',
  '## Rejeu huit horizons',
  '',
  '| Horizon | all | selected | collective | monthly | memory |',
  '|---|---:|---:|---:|---:|---|',
  ...Object.entries(periods).map(
    ([k, v]) =>
      `| ${k} | ${v.counts.all} | ${v.counts.selected} | ${v.counts.collective} | ${v.counts.monthlyFamily} | ${v.collective?.memory?.state || '—'} |`
  ),
  '',
  '## Limites',
  '',
  ...rapport.limits.map((l) => `- ${l}`),
  ''
];

writeFileSync('artifacts/analysis-eval/mission21-rapport-edition.md', lines.join('\n'), 'utf8');
console.log('rapport écrit', Object.keys(periods).length, 'horizons');
