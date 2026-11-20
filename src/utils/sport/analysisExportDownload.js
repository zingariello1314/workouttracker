/**
 * Téléchargements d’exports analytiques — JSON, Markdown, ZIP minimal.
 * Ne touche ni mémoire éditoriale ni période sélectionnée.
 */

const DEFAULT_PERIOD_TIMEOUT_MS = 120000;

/**
 * Sérialisation analytique : une référence *partagée* (même objet à plusieurs
 * endroits du graphe) est réémise intégralement. Seule une vraie boucle
 * ancestrale devient une référence résoluble `$circular`.
 */
export function analyticalJsonStringify(value, space = 2) {
  const ancestors = new WeakSet();
  const pathStack = [];

  const walk = (item, key) => {
    if (typeof item === 'bigint') return item.toString();
    if (typeof item === 'function') return undefined;
    if (!item || typeof item !== 'object') return item;
    if (ancestors.has(item)) {
      return { $circular: pathStack.join('.') || '$' };
    }
    if (Array.isArray(item)) {
      ancestors.add(item);
      pathStack.push(String(key ?? '[]'));
      const out = item.map((entry, index) => walk(entry, index));
      pathStack.pop();
      ancestors.delete(item);
      return out;
    }
    ancestors.add(item);
    pathStack.push(String(key ?? '{}'));
    const out = {};
    Object.keys(item).forEach((childKey) => {
      out[childKey] = walk(item[childKey], childKey);
    });
    pathStack.pop();
    ancestors.delete(item);
    return out;
  };

  return JSON.stringify(walk(value, '$'), null, space);
}

/** @deprecated alias — conserver le nom pour les appels existants */
export function safeJsonStringify(value, space = 2) {
  return analyticalJsonStringify(value, space);
}

export function downloadTextFile(filename, text, mime = 'application/json') {
  if (typeof document === 'undefined') return { ok: false, reason: 'no_document' };
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return { ok: true, filename };
}

export function downloadAnalysisJson(dossier, { filename = null } = {}) {
  if (!dossier) return { ok: false, reason: 'empty' };
  if (dossier.refused) return { ok: false, reason: dossier.reason || 'refused' };
  try {
    const period = dossier?.period || dossier?.requestedPeriod || dossier?.schema || 'export';
    const stamp = String(dossier?.capturedAt || new Date().toISOString()).replace(/[:.]/g, '-');
    const name = filename || `momentum-analysis-${period}-${stamp}.json`;
    const text = safeJsonStringify(dossier, 2);
    return downloadTextFile(name, text, 'application/json');
  } catch (error) {
    return { ok: false, reason: String(error?.message || error) };
  }
}

/** CRC32 + ZIP store (sans dépendance) pour 1–N fichiers texte. */
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i += 1) {
    c ^= buf[i];
    for (let k = 0; k < 8; k += 1) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return ~c >>> 0;
}

function u16(n) {
  const b = new Uint8Array(2);
  b[0] = n & 255;
  b[1] = (n >>> 8) & 255;
  return b;
}

function u32(n) {
  const b = new Uint8Array(4);
  b[0] = n & 255;
  b[1] = (n >>> 8) & 255;
  b[2] = (n >>> 16) & 255;
  b[3] = (n >>> 24) & 255;
  return b;
}

function concatBytes(parts) {
  const total = parts.reduce((sum, p) => sum + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  parts.forEach((p) => {
    out.set(p, offset);
    offset += p.length;
  });
  return out;
}

export function buildZipStore(files) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  files.forEach((file) => {
    const nameBytes = encoder.encode(file.name);
    const data = typeof file.data === 'string' ? encoder.encode(file.data) : file.data;
    const crc = crc32(data);
    const local = concatBytes([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(nameBytes.length),
      u16(0),
      nameBytes,
      data
    ]);
    const central = concatBytes([
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(nameBytes.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      nameBytes
    ]);
    localParts.push(local);
    centralParts.push(central);
    offset += local.length;
  });
  const centralDir = concatBytes(centralParts);
  const end = concatBytes([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(centralDir.length),
    u32(offset),
    u16(0)
  ]);
  return concatBytes([...localParts, centralDir, end]);
}

export function downloadAnalysisBundle({ json, markdown = null, basename = 'momentum-analysis' } = {}) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonName = `${basename}-${stamp}.json`;
  const mdName = `${basename}-${stamp}.md`;
  const jsonText = typeof json === 'string' ? json : safeJsonStringify(json, 2);
  if (!markdown) {
    return downloadTextFile(jsonName, jsonText, 'application/json');
  }
  try {
    const zip = buildZipStore([
      { name: jsonName, data: jsonText },
      { name: mdName, data: markdown }
    ]);
    const blob = new Blob([zip], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${basename}-${stamp}.zip`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return { ok: true, filename: `${basename}-${stamp}.zip`, format: 'zip' };
  } catch (error) {
    downloadTextFile(jsonName, jsonText, 'application/json');
    downloadTextFile(mdName, markdown, 'text/markdown');
    return { ok: true, filename: `${jsonName}+${mdName}`, format: 'dual', zipError: String(error?.message || error) };
  }
}

export function withTimeout(promise, ms = DEFAULT_PERIOD_TIMEOUT_MS, label = 'operation') {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timeout_${label}_${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export function renderAuditMarkdown(exportFile) {
  const lines = [];
  const push = (s = '') => lines.push(s);
  push('# Momentum — rapport d’analyses');
  push('');
  push(`Généré : ${exportFile?.capturedAt || new Date().toISOString()}`);
  push(`Schéma : ${exportFile?.schema || 'n/a'}`);
  if (exportFile?.complete === false) {
    push('');
    push('> **Export incomplet** — une ou plusieurs périodes sont absentes.');
  }
  push('');

  const periods = exportFile?.periods || null;
  if (periods) {
    Object.entries(periods).forEach(([period, dossier]) => {
      renderPeriodMarkdown(push, period, dossier);
    });
    const comparisons = exportFile?.comparisons || {};
    Object.entries(comparisons).forEach(([key, cmp]) => {
      push(`## Comparaison ${key}`);
      push('');
      if (!cmp?.diff) {
        push('_Comparaison indisponible._');
        push('');
        return;
      }
      push(`- Communes (priorité) : ${(cmp.diff.common || []).length}`);
      push(`- Seulement A : ${(cmp.diff.priorityOnlyA || []).join(' · ') || '—'}`);
      push(`- Seulement B : ${(cmp.diff.priorityOnlyB || []).join(' · ') || '—'}`);
      push('');
    });
    if (Array.isArray(exportFile.unavailable) && exportFile.unavailable.length) {
      push('## Périodes indisponibles');
      push('');
      exportFile.unavailable.forEach((row) => push(`- **${row.period}** : ${row.reason}`));
      push('');
    }
    return lines.join('\n');
  }

  if (exportFile?.schema === 'momentum.analysisComparisonExport.v1') {
    renderPeriodMarkdown(push, 'A', exportFile.periodA);
    renderPeriodMarkdown(push, 'B', exportFile.periodB);
    return lines.join('\n');
  }

  renderPeriodMarkdown(push, exportFile?.period || 'période', exportFile);
  return lines.join('\n');
}

function renderPeriodMarkdown(push, label, dossier) {
  if (!dossier || dossier.refused) {
    push(`## ${label}`);
    push('');
    push(`_Indisponible : ${dossier?.reason || 'absent'}_`);
    push('');
    return;
  }
  push(`## ${label} (${dossier.period || label})`);
  push('');
  push(`- Fenêtre : ${dossier.window?.start || '?'} → ${dossier.window?.end || '?'}`);
  push(`- Édition : \`${dossier.engine?.edition || dossier.agreement?.edition || ''}\``);
  push(`- Provenance : ${dossier.provenance || '—'}`);
  push(`- DOM vérifié : ${dossier.domVerified === true ? 'oui' : 'non'}`);
  push(
    `- Bandeau : ${dossier.banner?.totalReps ?? '—'} reps · ${dossier.banner?.trainingDays ?? '—'} j. entraînés`
  );
  push('');
  push('### Prioritaires');
  push('');
  (dossier.userAccessible?.priority || []).forEach((card, index) => {
    push(`#### ${index + 1}. ${card.title || '(sans titre)'}`);
    if (card.body) push(card.body);
    if (card.evidence) push(`_Preuve : ${card.evidence}_`);
    push('');
  });
  push('### Réserve / autres angles');
  push('');
  (dossier.userAccessible?.reserve || []).forEach((card, index) => {
    push(`#### R${index + 1}. ${card.title || '(sans titre)'}`);
    if (card.body) push(card.body);
    if (card.evidence) push(`_Preuve : ${card.evidence}_`);
    push('');
  });
}

export const PERIOD_EXPORT_TIMEOUT_MS = DEFAULT_PERIOD_TIMEOUT_MS;
