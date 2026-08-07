import fs from 'fs';
import path from 'path';

const srcPath = path.join(
  process.cwd(),
  'tmp-grand-pectoral-msg-853.txt'
);
const outDir = path.join(
  process.cwd(),
  'src/data/anatomy/muscleContent/grand-pectoral'
);

const raw = fs.readFileSync(srcPath, 'utf8');
const body = raw.replace(/^[\s\S]*?<user_query>\s*/i, '').replace(/<\/user_query>\s*$/, '');

function extractBetween(startMarker, endMarker, opts = {}) {
  const start = body.indexOf(startMarker);
  if (start === -1) throw new Error(`Missing: ${startMarker}`);
  const from = opts.includeStart ? start : start + startMarker.length;
  const end = endMarker ? body.indexOf(endMarker, from) : body.length;
  if (end === -1) throw new Error(`Missing end after: ${startMarker}`);
  return body.slice(from, end).trim();
}

const recrutementRaw = preprocessRecrutement(
  extractBetween(
    'Le développement du grand pectoral ne dépend pas',
    '   et pour la partie morphoilogie et developpemùent je veux ca  Morphologie et développement du grand pectoral',
    { includeStart: true }
  )
);

function preprocessRecrutement(text) {
  return text
    .replace(/\n(\d+\.\s)/g, '\n\n$1')
    .replace(/\n(Portion sternocostale)\n\n/g, '\n\n$1\n\n')
    .replace(
      /\n(Les erreurs qui empêchent souvent les pectoraux de progresser)\n/g,
      '\n\n$1\n\n'
    );
}
const morphologieRaw = extractBetween(
  'Tous les individus ne possèdent pas exactement la même morphologie.',
  ' et pour presentation je veux ca Présentation approfondie du grand pectoral'
);
const presentationRaw = extractBetween(
  'Le grand pectoral est le principal muscle superficiel',
  ' et pour fonctions principales je veux ca  Fonctions principales'
);
const fonctionsRaw = extractBetween('Mécanique', '');

/** Prefer typographic apostrophe in French contractions for single-quoted JS strings. */
function typograph(s) {
  return s
    .replace(/([a-zA-ZàâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ])'(?=[a-zàâäéèêëïîôùûüç])/gi, '$1\u2019')
    .replace(/([a-zA-ZàâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ])'(?=[a-zàâäéèêëïîôùûüç])/gi, '$1\u2019');
}

function escSingle(s) {
  return typograph(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function emitBlock(block) {
  if (block.type === 'ul') {
    const items = block.items.map((i) => `'${escSingle(i)}'`);
    return `  ul([\n    ${items.join(',\n    ')}\n  ])`;
  }
  if (block.type === 'h3') return `  h3('${escSingle(block.text)}')`;
  return `  p('${escSingle(block.text)}')`;
}

function emitFile(name, blocks) {
  const lines = blocks.map(emitBlock);
  const content = `import { p, h3, ul } from './blocks.js';\n\nexport default [\n${lines.join(',\n')}\n];\n`;
  fs.writeFileSync(path.join(outDir, name), content, 'utf8');
}

const RECRUTEMENT_H3 =
  /^(?:\d+\.\s|Les erreurs qui empêchent souvent les pectoraux de progresser|En résumé|Portion claviculaire|Portion sternocostale)$/;
const MORPHO_H3 = new Set([
  'Forme, insertions et espace entre les pectoraux',
  'Longueur et orientation des clavicules',
  'Les combinaisons entre longueur et orientation des clavicules',
  'La cage thoracique ajoute une autre dimension',
  'Lorsque toutes les caractéristiques se combinent',
  'Morphologie et exercices',
  'Les angles de développé et les différentes portions',
  'Ce que l\u2019entraînement peut changer \u2014 et ce qu\u2019il ne peut pas changer',
  '« Haut », « milieu » et « bas » des pectoraux',
  'La génétique et le potentiel de développement',
  'À retenir',
]);
const PRESENTATION_H3 = new Set([
  'Une architecture en éventail',
  'Pourquoi la position du bras change le travail du muscle',
  'Le grand pectoral ne fait pas simplement « pousser »',
  'Peut-on réellement isoler une partie du pectoral ?',
  'Pourquoi les différents exercices ne produisent pas exactement le même stimulus',
  'L\u2019importance de la longueur du muscle',
  'Le grand pectoral fonctionne avec toute la ceinture scapulaire',
  'La morphologie modifie encore cette mécanique',
  'Comprendre le grand pectoral plutôt que mémoriser une liste d\u2019exercices',
  'À retenir',
]);
const FONCTIONS_H3 = new Set([
  'Mécanique',
  'Adduction horizontale',
  'Adduction du bras',
  'Rotation médiale de l\u2019épaule',
  'Flexion de l\u2019épaule',
  'Extension de l\u2019épaule depuis une position élevée',
  'Contribution au mouvement global de poussée',
  'Contribution à la stabilisation dynamique de l\u2019épaule',
  'Une fonction qui change selon la position du bras',
]);

function isSemicolonListLine(line) {
  const t = line.trim();
  if (t.startsWith('→')) return false;
  return t.endsWith(';') && t.length < 120;
}

function semicolonLinesToUl(text) {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length >= 2 && lines.every(isSemicolonListLine)) {
    return lines.map((l) => l.replace(/;\s*$/, ''));
  }
  if (
    lines.length >= 2 &&
    lines.slice(0, -1).every(isSemicolonListLine) &&
    lines[lines.length - 1].endsWith('.')
  ) {
    return lines.map((l) => l.replace(/[;.]\s*$/, ''));
  }
  if (lines.length === 1 && lines[0].includes(';')) {
    const parts = lines[0]
      .split(/\s*;\s*/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length >= 2 && parts.every((p) => p.length < 100)) return parts;
  }
  return null;
}

function parseRecrutement(text) {
  const blocks = [];
  const parts = text.split(/\n\n+/);
  let i = 0;
  while (i < parts.length) {
    let chunk = parts[i].trim();
    if (!chunk) {
      i++;
      continue;
    }

    const lines = chunk.split('\n').map((l) => l.trim()).filter(Boolean);
    const single = lines.length === 1 ? lines[0] : null;

    if (single && (RECRUTEMENT_H3.test(single) || /^\d+\.\s/.test(single))) {
      blocks.push({ type: 'h3', text: single });
      i++;
      continue;
    }

    const inlineList = semicolonLinesToUl(chunk);
    if (inlineList && inlineList.length >= 2 && !chunk.endsWith(':')) {
      blocks.push({ type: 'ul', items: inlineList });
      i++;
      continue;
    }

    if (chunk.endsWith(':') && i + 1 < parts.length) {
      const next = parts[i + 1].trim();
      const nextLines = semicolonLinesToUl(next);
      if (nextLines) {
        blocks.push({ type: 'p', text: chunk });
        blocks.push({ type: 'ul', items: nextLines });
        i += 2;
        continue;
      }
    }

    if (chunk.endsWith(':')) {
      const inner = chunk.slice(0, -1).trim();
      const afterColon = chunk.includes(':')
        ? chunk.split(':').slice(1).join(':').trim()
        : '';
      const listFromSame = semicolonLinesToUl(afterColon);
      if (listFromSame) {
        blocks.push({ type: 'p', text: `${inner} :` });
        blocks.push({ type: 'ul', items: listFromSame });
        i++;
        continue;
      }
    }

    // RIR list after colon paragraph
    if (chunk.includes('On peut utiliser une estimation') && i + 1 < parts.length) {
      const next = parts[i + 1].trim();
      const rirLines = next.split('\n').map((l) => l.trim()).filter(Boolean);
      if (rirLines.every((l) => /RIR/.test(l))) {
        blocks.push({ type: 'p', text: chunk });
        blocks.push({ type: 'ul', items: rirLines.map((l) => l.replace(/;\s*$/, '')) });
        i += 2;
        continue;
      }
    }

    if (chunk.startsWith('Cela peut être fait en :') && i + 1 < parts.length) {
      const next = parts[i + 1].trim();
      const progLines = next.split('\n').map((l) => l.trim()).filter(Boolean);
      if (progLines.every(isSemicolonListLine)) {
        blocks.push({ type: 'p', text: chunk });
        blocks.push({
          type: 'ul',
          items: progLines.map((l) => l.replace(/;\s*$/, '')),
        });
        i += 2;
        continue;
      }
    }

    if (chunk === 'À surveiller :' && i + 1 < parts.length) {
      const next = parts[i + 1].trim();
      const survLines = next.split('\n').map((l) => l.trim()).filter(Boolean);
      if (survLines.every(isSemicolonListLine)) {
        blocks.push({ type: 'p', text: chunk });
        blocks.push({
          type: 'ul',
          items: survLines.map((l) => l.replace(/;\s*$/, '')),
        });
        i += 2;
        continue;
      }
    }

    // En résumé arrow lines as separate p
    if (chunk.startsWith('Pour réellement développer')) {
      blocks.push({ type: 'p', text: chunk });
      i++;
      while (i < parts.length) {
        const p = parts[i].trim();
        if (p.startsWith('Le principe fondamental')) break;
        if (p.includes('\n→') || p.startsWith('→')) {
          blocks.push({ type: 'p', text: p.replace(/\n/g, ' ') });
          i++;
          continue;
        }
        if (/^[A-Za-zÀ-ÿ].*\n→/.test(p)) {
          blocks.push({ type: 'p', text: p.replace(/\n/g, ' ') });
          i++;
          continue;
        }
        break;
      }
      continue;
    }

    blocks.push({ type: 'p', text: chunk.replace(/\n/g, ' ') });
    i++;
  }
  return blocks;
}

function parseWithH3Set(text, h3Set) {
  const blocks = [];
  const parts = text.split(/\n\n+/);
  for (let i = 0; i < parts.length; i++) {
    let chunk = parts[i].trim();
    if (!chunk) continue;
    const lines = chunk.split('\n').map((l) => l.trim()).filter(Boolean);
    const single = lines.length === 1 ? typograph(lines[0]) : null;

    if (single && h3Set.has(typograph(single))) {
      blocks.push({ type: 'h3', text: single });
      continue;
    }
    if (single && h3Set.has(single)) {
      blocks.push({ type: 'h3', text: single });
      continue;
    }

    // Presentation parameter list: "title\n\n→ text"
    if (
      chunk.includes('\n→') &&
      !chunk.includes('\n\n\n') &&
      lines.length >= 2 &&
      lines.some((l) => l.startsWith('→'))
    ) {
      const merged = lines
        .reduce((acc, line) => {
          if (line.startsWith('→')) acc.push(line);
          else if (acc.length) acc[acc.length - 1] += ' ' + line;
          else acc.push(line);
          return acc;
        }, [])
        .map((block) => {
          if (!block.startsWith('→') && block.includes('→')) return block;
          if (!block.startsWith('→')) return `${block} ${lines[lines.indexOf(block.split(' ')[0]) + 1] || ''}`.trim();
          return block;
        });
      // Simpler: join pairs
      for (let j = 0; j < lines.length; j++) {
        if (lines[j].startsWith('→')) {
          blocks.push({ type: 'p', text: lines[j - 1] ? `${lines[j - 1]} ${lines[j]}` : lines[j] });
        } else if (j + 1 < lines.length && lines[j + 1].startsWith('→')) {
          // handled
        } else if (!lines[j + 1]?.startsWith('→')) {
          blocks.push({ type: 'p', text: lines[j] });
        }
      }
      continue;
    }

    blocks.push({ type: 'p', text: chunk.replace(/\n/g, ' ') });
  }
  return blocks;
}

function fixPresentation(blocks) {
  const out = [];
  const paramTitles = new Set([
    'position du bras',
    'direction de la résistance',
    'trajectoire du mouvement',
    'amplitude',
    'morphologie',
    'charge et effort',
  ]);
  for (const b of blocks) {
    if (b.type !== 'p') {
      out.push(b);
      continue;
    }
    const t = b.text;
    if (t.includes('Il est plus pertinent de raisonner à partir de plusieurs paramètres')) {
      out.push({ type: 'p', text: t.split('position du bras')[0].trim() });
      const rest = t.slice(t.indexOf('position du bras'));
      const segments = rest.split(/(?=direction de la résistance|trajectoire du mouvement|amplitude|morphologie|charge et effort)/);
      for (const seg of segments) {
        const m = seg.trim().match(/^([^→]+)(→.+)$/);
        if (m) out.push({ type: 'p', text: `${m[1].trim()} ${m[2].trim()}` });
        else if (seg.trim()) out.push({ type: 'p', text: seg.trim() });
      }
      continue;
    }
    if (t.includes('HAUT | MILIEU | BAS')) {
      const idx = t.indexOf('mais plutôt');
      if (idx > -1) {
        out.push({ type: 'p', text: t.slice(0, idx).trim() });
        out.push({ type: 'p', text: t.slice(idx).trim() });
        continue;
      }
    }
    out.push(b);
  }
  return out;
}

function fixMorphologieH3(blocks) {
  return blocks.map((b) => {
    if (b.type === 'p' && b.text.startsWith('Ce que l\u2019entraînement peut changer')) {
      const t = b.text;
      const idx = t.indexOf('En revanche');
      if (idx > 20) {
        return null;
      }
    }
    return b;
  }).filter(Boolean);
}

// Manual morphologie h3 detection on paragraphs
function parseMorphologie(text) {
  const blocks = [];
  const parts = text.split(/\n\n+/);
  for (const chunk of parts) {
    const trimmed = chunk.trim();
    if (!trimmed) continue;
    const firstLine = trimmed.split('\n')[0].trim();
    const key = typograph(firstLine);
    let matched = false;
    for (const h of MORPHO_H3) {
      if (key === typograph(h) || firstLine === h) {
        blocks.push({ type: 'h3', text: firstLine });
        const rest = trimmed.slice(firstLine.length).trim();
        if (rest) blocks.push({ type: 'p', text: rest.replace(/\n/g, ' ') });
        matched = true;
        break;
      }
    }
    if (matched) continue;
    blocks.push({ type: 'p', text: trimmed.replace(/\n/g, ' ') });
  }
  return blocks;
}

function parsePresentation(text) {
  const blocks = [];
  const parts = text.split(/\n\n+/);
  for (const chunk of parts) {
    const trimmed = chunk.trim();
    if (!trimmed) continue;
    const firstLine = trimmed.split('\n')[0].trim();
    let matched = false;
    for (const h of PRESENTATION_H3) {
      if (typograph(firstLine) === typograph(h)) {
        blocks.push({ type: 'h3', text: firstLine });
        const rest = trimmed.slice(firstLine.length).trim();
        if (rest) blocks.push({ type: 'p', text: rest.replace(/\n/g, ' ') });
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // multi-line with → pairs inside chunk
    if (trimmed.includes('\n→')) {
      const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
      let buf = '';
      for (const line of lines) {
        if (line.startsWith('→')) {
          blocks.push({ type: 'p', text: `${buf} ${line}`.trim() });
          buf = '';
        } else {
          if (buf) blocks.push({ type: 'p', text: buf });
          buf = line;
        }
      }
      if (buf) blocks.push({ type: 'p', text: buf });
      continue;
    }

    blocks.push({ type: 'p', text: trimmed.replace(/\n/g, ' ') });
  }
  return fixPresentation(blocks);
}

function parseFonctions(text) {
  const blocks = [];
  const full = `Mécanique\n\n${text}`;
  const parts = full.split(/\n\n+/);
  for (const chunk of parts) {
    const trimmed = chunk.trim();
    if (!trimmed) continue;
    const firstLine = trimmed.split('\n')[0].trim();
    const key = typograph(firstLine);
    if (FONCTIONS_H3.has(key) || [...FONCTIONS_H3].some((h) => typograph(h) === key)) {
      blocks.push({ type: 'h3', text: firstLine });
      const rest = trimmed.slice(firstLine.length).trim();
      if (rest) {
        if (rest.startsWith('Un même muscle peut donc :')) {
          blocks.push({ type: 'p', text: 'Un même muscle peut donc :' });
          const listPart = rest.slice('Un même muscle peut donc :'.length).trim();
          const items = listPart
            .split(/\s*;\s*/)
            .map((s) => s.trim())
            .filter(Boolean);
          if (items.length >= 2) blocks.push({ type: 'ul', items });
          else blocks.push({ type: 'p', text: listPart.replace(/\n/g, ' ') });
        } else {
          blocks.push({ type: 'p', text: rest.replace(/\n/g, ' ') });
        }
      }
      continue;
    }
    blocks.push({ type: 'p', text: trimmed.replace(/\n/g, ' ') });
  }
  return blocks;
}

const recBlocks = parseRecrutement(recrutementRaw);
const morphoBlocks = parseMorphologie(morphologieRaw);
const presBlocks = parsePresentation(presentationRaw);
const foncBlocks = (() => {
  const blocks = parseFonctions(fonctionsRaw);
  for (let i = 0; i < blocks.length - 1; i++) {
    if (
      blocks[i].type === 'p' &&
      blocks[i].text === 'Un même muscle peut donc :' &&
      blocks[i + 1].type === 'p' &&
      blocks[i + 1].text.includes(';')
    ) {
      const items = blocks[i + 1].text
        .split(/\s*;\s*/)
        .map((s) => s.trim())
        .filter(Boolean);
      blocks.splice(i + 1, 1, { type: 'ul', items });
    }
  }
  return blocks;
})();

emitFile('recrutementBlocks.js', recBlocks);
emitFile('morphologieBlocks.js', morphoBlocks);
emitFile('presentationBlocks.js', presBlocks);
emitFile('fonctionsBlocks.js', foncBlocks);

console.log('Counts:', {
  recrutement: recBlocks.length,
  morphologie: morphoBlocks.length,
  presentation: presBlocks.length,
  fonctions: foncBlocks.length,
});
