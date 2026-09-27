/**
 * Découpe le texte d'une routine en blocs affichables.
 * Les circuits vides restent vides. Ceux qui ont un texte (titres, tableau
 * aligné, lignes « Libellé : valeur », niveaux) ne s'affichent plus en vrac.
 */

function linesOf(block) {
  return String(block || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function splitColumns(line) {
  return line
    .trim()
    .split(/\s{2,}/)
    .map((cell) => cell.trim())
    .filter(Boolean);
}

function isHeading(block) {
  const text = String(block || '').trim();
  if (!text || text.includes('\n')) return false;
  if (text.length > 72) return false;
  if (/^\d+\.\s/.test(text)) return false;
  if (/^\*/.test(text)) return false;
  if (text.endsWith('.') && text.length > 28) return false;
  return true;
}

function isTable(lines) {
  if (lines.length < 2) return false;
  const columns = lines.map(splitColumns);
  const width = columns[0].length;
  if (width < 3) return false;
  return columns.every((row) => row.length === width);
}

function isSpec(lines) {
  if (lines.length < 3) return false;
  const hits = lines.filter((line) => /^[^:]{2,56}\s*:\s+\S/.test(line));
  return hits.length >= Math.ceil(lines.length * 0.7);
}

const LEVEL_LINE = /^(Débutant|Intermédiaire|Expérimenté|Bodybuilder)\s*[—:–-]\s*(.+)$/iu;

function isLevelList(lines) {
  if (lines.length < 2) return false;
  return lines.every((line) => LEVEL_LINE.test(line));
}

function isOrderBlock(lines) {
  return lines.length >= 2
    && /ordre/i.test(lines[0])
    && lines.slice(1).every((line) => /^\d+\.\s/.test(line));
}

function isDashRows(lines) {
  const dashed = lines.filter((line) => line.includes(' — '));
  return dashed.length >= 2 && dashed.length >= lines.length - 1;
}

function isPhraseList(lines) {
  if (lines.length < 4) return false;
  return lines.every((line) => line.length <= 72 && !line.includes(':') && !line.includes('—'));
}

function parseLevel(line) {
  const match = line.match(LEVEL_LINE);
  if (!match) return null;
  const rest = match[2].trim();
  const subtitle = rest.match(/^([^.]{3,42})\.\s+([\s\S]+)$/);
  if (subtitle && !/^\d/.test(subtitle[1])) {
    return { name: match[1], kicker: subtitle[1].trim(), text: subtitle[2].trim() };
  }
  return { name: match[1], kicker: '', text: rest };
}

function parseSpec(lines) {
  return lines
    .map((line) => {
      const match = line.match(/^([^:]+)\s*:\s*(.+)$/);
      if (!match) return null;
      return { label: match[1].trim(), value: match[2].trim() };
    })
    .filter(Boolean);
}

function classifyBlock(block) {
  const lines = linesOf(block);
  if (isOrderBlock(lines)) {
    return {
      kind: 'steps',
      order: true,
      items: lines.slice(1).map((line) => line.replace(/^\d+\.\s*/, ''))
    };
  }
  if (isTable(lines)) {
    const rows = lines.map(splitColumns);
    const headers = rows[0];
    return {
      kind: 'table',
      title: /niveau/i.test(headers[0] || '') ? 'Dosage' : null,
      headers: headers.map((header) => header.replace(/\*+$/, '').trim()),
      rows: rows.slice(1)
    };
  }
  if (isLevelList(lines)) {
    return { kind: 'levels', items: lines.map(parseLevel).filter(Boolean) };
  }
  if (isSpec(lines)) {
    return { kind: 'spec', items: parseSpec(lines) };
  }
  if (isDashRows(lines)) {
    const intro = lines.filter((line) => !line.includes(' — '));
    const rows = lines
      .filter((line) => line.includes(' — '))
      .map((line) => line.replace(/\.$/, '').split(/\s+—\s+/).map((cell) => cell.trim()));
    const width = Math.max(...rows.map((row) => row.length));
    const headers = width >= 3
      ? ['Mouvement', 'Place dans le circuit', 'Machine approchée']
      : ['Mouvement', 'Rôle'];
    return { kind: 'compare', intro, headers: headers.slice(0, width), rows };
  }
  if (lines.every((line) => /^\d+\.\s/.test(line))) {
    return {
      kind: 'steps',
      items: lines.map((line) => line.replace(/^\d+\.\s*/, ''))
    };
  }
  if (isPhraseList(lines)) return { kind: 'list', items: lines };
  return { kind: 'prose', text: lines.join('\n'), note: lines[0].startsWith('*') };
}

function sectionKind(title, blocks) {
  const name = String(title || '');
  if (/ordre/i.test(name) || (blocks.length === 1 && blocks[0].order)) return 'order';
  if (/en une phrase/i.test(name)) return 'quote';
  if (blocks.length === 1 && blocks[0].kind === 'spec') return 'spec';
  if (blocks.length === 1 && blocks[0].kind === 'levels') return 'levels';
  if (blocks.some((block) => block.kind === 'compare')) return 'compare';
  return 'section';
}

export function parseCircuitCopy(description) {
  const raw = String(description || '').replace(/\r\n/g, '\n').trim();
  if (!raw) return [];

  const chunks = raw
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .filter((chunk) => !(isHeading(chunk) && /^Circuit\s*[—–-]/i.test(chunk)));

  const sections = [];
  let index = 0;
  while (index < chunks.length) {
    if (isHeading(chunks[index])) {
      const title = chunks[index].replace(/\s*:\s*$/, '').trim();
      index += 1;
      const body = [];
      while (index < chunks.length && !isHeading(chunks[index])) {
        body.push(classifyBlock(chunks[index]));
        index += 1;
      }
      sections.push({
        title,
        kind: sectionKind(title, body),
        blocks: body
      });
      continue;
    }
    const block = classifyBlock(chunks[index]);
    const previous = sections.at(-1);
    if (block.kind === 'prose' && !block.order && previous?.kind === 'table') {
      previous.blocks.push({ ...block, note: true });
    } else {
      sections.push({
        title: block.title || null,
        kind: block.order ? 'order' : block.kind === 'table' ? 'table' : 'section',
        blocks: [block]
      });
    }
    index += 1;
  }
  return sections;
}
