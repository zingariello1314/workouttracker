import fs from 'fs';

const r = JSON.parse(fs.readFileSync('artifacts/analysis-eval/mission19-replay-eight.json', 'utf8'));
const lines = [];
lines.push(`# Rapport analytique Mission 20 — édition ${r.edition}`);
lines.push('');
lines.push(`Généré: ${r.generatedAt}`);
lines.push(`Mission: ${r.mission}`);
lines.push(`Backup: ${r.backupPath}`);
lines.push(`Ancre: ${r.end}`);
lines.push('');
lines.push('## Fingerprint');
lines.push('```json');
lines.push(JSON.stringify(r.fingerprint, null, 2));
lines.push('```');
lines.push('');
lines.push('## Populations 30j (réconciliation)');
const steps = r.populations30d?.steps || [];
lines.push('| Étape | Volume | Jours | Note |');
lines.push('|---|---:|---:|---|');
for (const s of steps) {
  lines.push(`| ${s.step} | ${s.volume ?? ''} | ${s.days ?? ''} | ${(s.note || '').replace(/\|/g, '/')} |`);
}
lines.push('');
lines.push(`Identité: \`${JSON.stringify(r.populations30d?.identityCheck)}\``);
lines.push(`Comparateurs: \`${JSON.stringify(r.populations30d?.comparators)}\``);
lines.push('');
lines.push('## Horizons');
for (const [period, p] of Object.entries(r.periods || {})) {
  lines.push(`### ${period} (${p.window.start} → ${p.window.end})`);
  lines.push(`- Compteurs: \`${JSON.stringify(p.counts)}\``);
  if (p.monthlyFamily?.[0]) {
    lines.push(`- Familles: **${p.monthlyFamily[0].title}**`);
    lines.push(`  - ${(p.monthlyFamily[0].body || '').slice(0, 360)}`);
  }
  if (p.collectives?.[0]) {
    lines.push(
      `- Collectif: **${p.collectives[0].title}** (named=${p.collectives[0].namedCount}, confirm=${JSON.stringify(p.collectives[0].confirmationDates)})`
    );
    lines.push(`  - ${(p.collectives[0].body || '').slice(0, 420)}`);
  }
  lines.push(`- Priorités: ${(p.priority || []).map((x) => x.kind).join(', ')}`);
  lines.push('');
}

const outMd = 'artifacts/analysis-eval/mission20-rapport-edition.md';
fs.writeFileSync(outMd, lines.join('\n'));
fs.copyFileSync(
  'artifacts/analysis-eval/mission19-replay-eight.json',
  'artifacts/analysis-eval/mission20-replay-eight.json'
);
console.log('wrote', outMd);
