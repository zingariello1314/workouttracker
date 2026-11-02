import fs from 'fs';
import path from 'path';

const dir = path.join(
  'docs',
  'analyses-documentation',
  'moteur analyse v1',
  'live-capture-2026-11-02'
);
const out = path.join(
  'docs',
  'analyses-documentation',
  'moteur analyse v1',
  'ANALYSES-LIVE-PAR-PERIODE-2026-11-02.md'
);

const order = [
  ['today', 'Today'],
  ['7d', '7 days'],
  ['30d', '30 days'],
  ['3m', '3 months'],
  ['6m', '6 months'],
  ['1y', '1 year'],
  ['2y', '2 years'],
  ['all', 'All time'],
];

fs.mkdirSync(dir, { recursive: true });

let md = `# Analyses live — cartes par période (texte intégral)

**Capture :** 2026-11-02 · compte zingariello1314 · Récap → Analysis  
**Méthode :** DOM des cartes publiées (Worker ready), période par période.  
**JSON bruts :** \`docs/analyses-documentation/moteur analyse v1/live-capture-2026-11-02/\`

---

`;

for (const [file, label] of order) {
  const p = path.join(dir, `${file}.json`);
  if (!fs.existsSync(p)) {
    md += `## ${label}\n\n_Non capturé._\n\n---\n\n`;
    continue;
  }
  const d = JSON.parse(fs.readFileSync(p, 'utf8'));
  md += `## ${label}\n\n`;
  md += `**Fenêtre :** ${d.header || ''}\n\n`;
  const fams = (d.families || []).filter((f) => !/^All /i.test(f)).join(' · ');
  md += `**Publication :** ${d.count || ''}${fams ? ` · ${fams}` : ''}\n\n`;
  for (let i = 0; i < (d.cards || []).length; i += 1) {
    const c = d.cards[i];
    const lines = String(c).trim().split(/\n+/);
    const fam = lines[0] || '';
    const title = lines[1] || '';
    const body = lines.slice(2).join('\n').trim();
    md += `### ${i + 1}. ${fam}${title ? ` — ${title}` : ''}\n\n`;
    if (body) md += `${body}\n\n`;
  }
  md += `---\n\n`;
}

fs.writeFileSync(out, md);
console.log('OK', md.length, 'chars');
console.log(
  order
    .map(([f, l]) => `${l}:${fs.existsSync(path.join(dir, f + '.json')) ? 'yes' : 'NO'}`)
    .join(' | ')
);
