/**
 * Exporte REGISTRE-KINDS-F1 depuis le JSON produit par f1-audit-kinds.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const jsonPath = path.join(
  root,
  'docs/analyses-documentation/moteur analyse v1/fixtures/f1-audit-kinds-replay.json'
);
const j = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const seen = j.register.filter((r) => r.seenInFixtureReplay).map((r) => r.kind);

const lines = [
  '# Registre exhaustif des kinds — F1 (2026-11-01)',
  '',
  '> Source de vérité : scan `src/utils/sport/**` + replay fixture via `scripts/f1-audit-kinds.mjs`.',
  '',
  `- Généré : ${j.generatedAt}`,
  `- Kinds distincts dans le code : **${j.kindCountInSourceScan}**`,
  `- Atteints dans le pool fixture (7d∪30d∪3m) : **${j.kindsSeenInReplay}**`,
  `- Jamais dans le pool fixture (source-only) : **${j.kindsSourceOnly.length}**`,
  '',
  '## Légende',
  '',
  '- `seenFixture` = présent dans `bundle.all` sur au moins une fenêtre fixture.',
  '- Les littéraux `disc_gtg_`, `disc_ms_`, `disc_p35_`, `disc_p36_`, `disc_sleep_` sont des **préfixes** détectés par regex (faux positifs de scan) — pas des kinds publiables.',
  '- `family` / `contentClass` renseignés seulement si le kind a été vu au runtime du replay.',
  '',
  '## Tableau exhaustif',
  '',
  '| kind | family | nature | contentClass | seenFixture | fichiers |',
  '| --- | --- | --- | --- | --- | --- |'
];

for (const r of j.register) {
  const files = (r.files || []).slice(0, 4).map((f) => `\`${f}\``).join(' · ');
  lines.push(
    `| \`${r.kind}\` | ${r.family || '—'} | ${r.natureHint || '—'} | ${r.contentClass || '—'} | ${
      r.seenInFixtureReplay ? 'oui' : 'non'
    } | ${files} |`
  );
}

lines.push('', `## Atteints en replay fixture (${seen.length})`, '', ...seen.map((k) => `- \`${k}\``));
lines.push(
  '',
  `## Source-only / non déclenchés sur fixture (${j.kindsSourceOnly.length})`,
  '',
  'Inclut préfixes morts, milestones conditionnels, sleep sans Garmin dans la fixture, et kinds P3.x non publiables sur ce snapshot.',
  '',
  ...j.kindsSourceOnly.map((k) => `- \`${k}\``)
);

lines.push('', '## Sélection E0 par période (fixture)');
for (const p of ['7d', '30d', '3m']) {
  const r = j.replays[p];
  lines.push(
    '',
    `### ${p} — pool ${r.poolSize} → selected ${r.selectedSize} · dropped ${r.droppedSize} · reliabilityNotes ${r.reliabilityNotes} · **${r.ms} ms**`,
    `Fenêtre \`${r.window.start}\` → \`${r.window.end}\``,
    '',
    '| kind | nature | class | title | proof | metricsKeys |',
    '| --- | --- | --- | --- | --- | --- |'
  );
  for (const d of r.selected) {
    lines.push(
      `| \`${d.kind}\` | ${d.nature || ''} | ${d.contentClass || ''} | ${String(d.title || '').replace(
        /\|/g,
        '/'
      )} | ${d.proofLevel || '—'} | ${(d.metricsKeys || []).slice(0, 8).join(', ') || '—'} |`
    );
  }
  if (r.dropped?.length) {
    lines.push('', 'Droppés (échantillon):');
    for (const d of r.dropped.slice(0, 30)) {
      lines.push(
        `- \`${d.kind}\` — **${d.reason}** — ${String(d.title || '').slice(0, 90)}`
      );
    }
  }
}

const dest = path.join(
  root,
  'docs/analyses-documentation/moteur analyse v1/REGISTRE-KINDS-F1-2026-11-01.md'
);
fs.writeFileSync(dest, lines.join('\n'), 'utf8');
console.log('wrote', dest, 'rows', j.register.length);
