/**
 * Parenté des cartes, avant la sélection des colonnes.
 * Aucune métrique, aucun seuil, aucun fil.
 * Une même preuve ne sort qu'une fois. Deux comparaisons chiffrées restent deux preuves.
 */

const PARASITE = [
  /~[+-]/,
  /dynamique favorable/i,
  /reste prudent/i,
  /hypertrophie\s*\/\s*définition/i
];

function ctxOf(candidate) {
  return candidate?.interpretation?.context || candidate?.context || {};
}

function visible(candidate) {
  const ctx = ctxOf(candidate);
  const title = String(ctx.title || '').trim();
  const body = String(ctx.body || candidate?.text || '').trim();
  return {
    title,
    body,
    kind: String(ctx.kind || ''),
    horizon: candidate?.horizon || 'medium',
    blob: `${title}\n${body}`.replace(/\s+/g, ' ').trim()
  };
}

function frDate(ymd) {
  const [y, m, d] = String(ymd || '').split('-');
  if (!y || !m || !d) return '';
  return `${d}/${m}/${y}`;
}

function dayGap(start, end) {
  const a = new Date(`${start}T12:00:00`);
  const b = new Date(`${end}T12:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  return Math.round((b - a) / 86400000);
}

function splitSentences(blob) {
  return String(blob || '')
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.toLowerCase().replace(/\s+/g, ' ').trim())
    .filter((s) => s.length > 24);
}

function numbersOf(blob) {
  const text = String(blob || '').replace(/\d{1,2}\/\d{1,2}\/\d{2,4}/g, ' ');
  const out = [];
  const re = /\d{1,3}(?:\s\d{3})+|\d+(?:[.,]\d+)?/g;
  let match = re.exec(text);
  while (match) {
    const n = Number(match[0].replace(/\s/g, '').replace(',', '.'));
    if (Number.isFinite(n) && n >= 13) out.push(n);
    match = re.exec(text);
  }
  return out;
}

function isVolumeOpening(sentence) {
  return /répétition/.test(sentence) &&
    (/aucune répétition enregistrée/.test(sentence) ||
      /compte \d|comptent \d|totalise \d|totalisent \d/.test(sentence));
}

function volumeFingerprint(blob) {
  const sentences = splitSentences(blob);
  const opening = sentences.find(isVolumeOpening);
  if (!opening) return null;
  const openNums = numbersOf(opening);
  const comparison = sentences.find((s) =>
    !isVolumeOpening(s) && /jours d'avant|jours précédents|face à|contre |bloc /.test(s)
  );
  const extra = comparison
    ? numbersOf(comparison).filter((n) => !openNums.includes(n))
    : [];
  const head = openNums.join('|') || 'volume';
  return extra.length ? `${head}::${extra.join('|')}` : head;
}

function namesTwoPeriods(blob) {
  return /jours d'avant|jours précédents|face à|contre |bloc /.test(String(blob || '').toLowerCase());
}

function coveredBy(small, big) {
  if (!small || !big || small.length + 30 >= big.length) return false;
  const sentences = splitSentences(small);
  const host = splitSentences(big).join(' ');
  if (!sentences.length) return false;
  if (!sentences.every((s) => host.includes(s))) return false;
  const hostNums = new Set(numbersOf(big));
  return numbersOf(small).every((n) => hostNums.has(n));
}

function rewritePullVerb(text) {
  return String(text || '').replace(
    /tombent à\s+(\d[\d\s]*(?:[.,]\d+)?)\s*%/gi,
    (full, raw) => {
      const n = Number(String(raw).replace(/\s/g, '').replace(',', '.'));
      if (!(n > 100)) return full;
      return `atteignent ${String(raw).trim()} % de leur volume habituel`;
    }
  );
}

function softenTitle(title, body) {
  const strong = /\bsépare\b|démontré|la plus sensible|\bcause\b/i;
  const weak = /associ|observ|\d+\s*\/\s*\d+/i;
  if (!strong.test(title) || !weak.test(body)) return title;
  return title
    .replace(/sépare encore/gi, 'reste associée à')
    .replace(/\bsépare\b/gi, 'est associé à')
    .replace(/la plus sensible/gi, 'observée')
    .replace(/\bdémontré\b/gi, 'observé')
    .replace(/\bcause\b/gi, 'accompagne');
}

function dropSensitiveClaim(body) {
  return String(body || '').replace(
    /\s*(Le tirage|La poussée) apparaît comme la qualité la plus sensible[^.]+\./gi,
    ''
  );
}

function parasite(blob) {
  if (PARASITE.some((re) => re.test(blob))) return true;
  if (/se reprend après un creux/i.test(blob)) {
    const dates = blob.match(/\d{2}\/\d{2}\/\d{4}/g) || [];
    const levels = blob.match(/\d+(?:[.,]\d+)?/g) || [];
    if (dates.length < 2 || levels.length < 2) return true;
  }
  return false;
}

function withText(candidate, title, body) {
  const ctx = ctxOf(candidate);
  const nextCtx = { ...ctx, title, body };
  const text = [title, body, ctx.evidenceLine].filter(Boolean).join('\n\n');
  const interpretation = candidate.interpretation
    ? { ...candidate.interpretation, context: nextCtx, text }
    : candidate.interpretation;
  return { ...candidate, text, interpretation };
}

function annotateShortCoverage(row, { period, window, metricDates }) {
  if (period !== '6m' && period !== '1y') return row;
  if (!window?.start || !window?.end || !metricDates?.length) return row;
  const inside = metricDates.filter((d) => d >= window.start && d <= window.end).sort();
  if (inside.length < 2) return row;
  if (dayGap(window.start, inside[0]) < 21) return row;
  const from = frDate(inside[0]);
  const to = frDate(inside[inside.length - 1]);
  if (!from || !to) return row;
  const sleep = /nuit|coucher|lever|sommeil/i.test(row.blob);
  const kcal = /kcal/i.test(row.blob);
  if (!sleep && !kcal) return row;
  if (row.body.includes(from)) return row;
  const note = kcal && !sleep
    ? ` Ces kcal couvrent les journées Garmin du ${from} au ${to}, pas l'ensemble de la fenêtre affichée.`
    : ` Ces nuits sont celles mesurées du ${from} au ${to}.`;
  const aboutReps = /répétition/.test(row.body);
  let body = row.body;
  if (!aboutReps) {
    body = body
      .replace(/ces six mois/gi, `les journées mesurées du ${from} au ${to}`)
      .replace(/cette année/gi, `les journées mesurées du ${from} au ${to}`)
      .replace(/ces derniers mois/gi, `les journées mesurées du ${from} au ${to}`);
  }
  if (!body.includes(from)) body = `${body}${note}`;
  return { ...row, body, title: row.title };
}

export function keepDistinctProofCards(candidates, opts = {}) {
  const rows = (candidates || []).map((candidate) => {
    const view = visible(candidate);
    if (parasite(view.blob)) return null;
    let title = softenTitle(view.title, view.body);
    let body = dropSensitiveClaim(rewritePullVerb(view.body));
    title = rewritePullVerb(title);
    const noted = annotateShortCoverage({ ...view, title, body }, opts);
    const fp = volumeFingerprint(`${noted.title}\n${noted.body}`);
    const family = fp ? `volume_${opts.period || 'window'}_${opts.window?.end || ''}` : '';
    const next = withText(candidate, noted.title, noted.body);
    if (family) next.evidenceFamilyId = family;
    return { candidate: next, title: noted.title, body: noted.body, horizon: view.horizon, fp, blob: `${noted.title}\n${noted.body}` };
  }).filter(Boolean);

  const drop = new Set();
  const groups = new Map();
  rows.forEach((row, index) => {
    row.index = index;
    if (!row.fp) return;
    if (!groups.has(row.fp)) groups.set(row.fp, []);
    groups.get(row.fp).push(row);
  });

  groups.forEach((group) => {
    const ranked = [...group].sort((a, b) => {
      const rank = (h) => (h === 'short' ? 0 : h === 'medium' ? 1 : 2);
      const byHorizon = rank(a.horizon) - rank(b.horizon);
      if (byHorizon) return byHorizon;
      return b.blob.length - a.blob.length;
    });
    const keeper = ranked[0];
    let mediumKept = false;
    let longKept = false;
    ranked.slice(1).forEach((row) => {
      const already = coveredBy(row.blob, keeper.blob) || row.blob.replace(/\s+/g, ' ') === keeper.blob.replace(/\s+/g, ' ');
      if (already || row.horizon === 'short') {
        drop.add(row.index);
        return;
      }
      if (row.horizon === 'medium' && !mediumKept) {
        mediumKept = true;
        return;
      }
      if (row.horizon === 'long' && !longKept && namesTwoPeriods(row.blob) && !coveredBy(row.blob, keeper.blob)) {
        longKept = true;
        return;
      }
      drop.add(row.index);
    });
  });

  const seen = new Set();
  rows.forEach((row) => {
    if (drop.has(row.index)) return;
    const key = row.blob.toLowerCase().replace(/\s+/g, ' ').trim();
    if (seen.has(key)) drop.add(row.index);
    else seen.add(key);
  });

  const survivors = rows.filter((row) => !drop.has(row.index));
  survivors.forEach((row) => {
    if (drop.has(row.index)) return;
    const host = survivors.find((other) => other.index !== row.index && !drop.has(other.index) && coveredBy(row.blob, other.blob));
    if (host) drop.add(row.index);
  });

  return rows.filter((row) => !drop.has(row.index)).map((row) => row.candidate);
}
