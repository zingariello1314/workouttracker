/**
 * Échantillon aveugle v36 (~35 cartes) + contrôles M37 + éditorial 8h.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ZIP = path.join(__dirname, 'zip');
const OUT = path.join(__dirname, 'closure');
const ep = JSON.parse(fs.readFileSync(path.join(ZIP, 'eight-periods/eight-periods.json'), 'utf8'));

const PERIODS = ['today', '7d', '30d', '3m', '6m', '1y', '2y', 'all'];

function allCards(period) {
  const ua = ep.periods[period]?.userAccessible || {};
  const out = [];
  for (const [role, arr] of [
    ['priority', ua.priority || []],
    ['reserve', ua.reserve || []],
    ['accessible', ua.accessible || []]
  ]) {
    for (const c of arr) out.push({ ...c, _role: role, _period: period });
  }
  return out;
}

function pickUnique(cards, pred, n, used) {
  const hits = [];
  for (const c of cards) {
    if (hits.length >= n) break;
    const id = `${c._period}|${c.kind}|${c.title}`;
    if (used.has(id)) continue;
    if (!pred(c)) continue;
    used.add(id);
    hits.push(c);
  }
  return hits;
}

const used = new Set();
const sample = [];

// Priorités par horizon (mix)
for (const per of PERIODS) {
  const pri = allCards(per).filter((c) => c._role === 'priority');
  sample.push(...pickUnique(pri, () => true, per === 'today' ? 3 : 2, used));
}

// Cibles M37 / typologie
const pool = PERIODS.flatMap(allCards);
const targets = [
  [(c) => /volume total|reps par journée|fréquenti/i.test(c.title + c.body), 2],
  [(c) => /Concentration relative/i.test(c.title), 1],
  [(c) => /nuit courte|sommeil.*densité|densité de séance/i.test(c.title), 2],
  [(c) => /familles de séances/i.test(c.title), 2],
  [(c) => /trajectoires parallèles/i.test(c.title), 2],
  [(c) => /charge|Phase collective|augmentation de charge/i.test(c.title), 1],
  [(c) => /reprise|durable|interrom/i.test(c.title), 2],
  [(c) => /socle commun|apparentées/i.test(c.title), 1],
  [(c) => c._role === 'reserve', 4],
  [(c) => /GTG|hors planning/i.test(c.title), 1]
];
for (const [pred, n] of targets) {
  sample.push(...pickUnique(pool, pred, n, used));
}

// Absences / preuves limitées
sample.push(
  ...pickUnique(
    pool,
    (c) => /association descriptive|pas une preuve|inconnu|données manquantes|sans détail/i.test(c.body || ''),
    3,
    used
  )
);

while (sample.length < 32) {
  const more = pickUnique(pool, (c) => c._role === 'priority' || c._role === 'reserve', 1, used);
  if (!more.length) break;
  sample.push(...more);
}

const blindPack = {
  schema: 'momentum.p6.v36.blindQualitative.v1',
  instruction:
    'Évaluer chaque carte sans scores moteur. Noter 0–2 : exactitude, profondeur, pouvoir explicatif, contextualisation, niveaux, prudence causale, originalité, lisibilité, preuves, temporalité. Répondre surtout : que permet-elle de comprendre que les données brutes ne montraient pas ?',
  editionObserved: 'p6-sovereign-v36',
  liveFingerprint: 'c3e80330',
  note: 'Échantillon pour évaluation extérieure assistée. Ne constitue pas une notation humaine aveugle.',
  cards: sample.map((c, i) => ({
    blindId: `V36-${String(i + 1).padStart(3, '0')}`,
    periodLabel: c._period,
    roleHint: c._role === 'priority' ? 'priority' : c._role === 'reserve' ? 'complement' : 'accessible',
    title: c.title,
    body: c.body,
    evidence: c.evidence || null,
    populationHint:
      c.metrics?.population ||
      c.claim?.population ||
      c.metrics?.populationId ||
      null,
    windowHint: {
      start: c.metrics?.windowStart || ep.periods[c._period]?.window?.start || null,
      end: c.metrics?.windowEnd || ep.periods[c._period]?.window?.end || null
    },
    observedValues: (c.metrics?.observedValues || c.claim?.proof?.observedValues || []).slice(0, 12)
  }))
};

const blindKey = {
  schema: 'momentum.p6.v36.blindKey.v1',
  cards: sample.map((c, i) => ({
    blindId: `V36-${String(i + 1).padStart(3, '0')}`,
    period: c._period,
    role: c._role,
    kind: c.kind,
    conclusionKey: c.metrics?.conclusionKey || null,
    producer: c.metrics?.producer || null,
    phenomenonId: c.phenomenonId || null,
    publicationId: c.id || null,
    claimId: c.claim?.id || null,
    disposition: c.disposition || c.p6Disposition || null
  }))
};

// Contrôles M37 ciblés
function find(pred, period = null) {
  const cards = period ? allCards(period) : pool;
  return cards.find(pred) || null;
}

const m37 = {
  volumeContrast: (() => {
    const c = find(
      (x) => /Plus de volume total, mais moins de reps|contenu moyen/i.test(x.title + x.body),
      '30d'
    );
    return {
      found: Boolean(c),
      role: c?._role,
      title: c?.title,
      rejectsCapacityProgress: /pas une progression de capacité/i.test(c?.body || ''),
      hasFreqAndContent: /\+1[\s ]?427|fréquence/i.test(c?.body || '') && /contenu|−588|-588/i.test(c?.body || ''),
      bodyPreview: String(c?.body || '').slice(0, 320)
    };
  })(),
  relativeConcentration: (() => {
    const c = find((x) => /Concentration relative/i.test(x.title), '7d');
    return {
      found: Boolean(c),
      role: c?._role,
      title: c?.title,
      scopedToMoves: /pas une preuve que tout le volume|Lecture limitée/i.test(
        `${c?.body || ''} ${c?.metrics?.scope || ''}`
      ),
      overclaimsWeek: /Ces 7 jours pèsent beaucoup plus lourd/i.test(c?.body || ''),
      bodyPreview: String(c?.body || '').slice(0, 360)
    };
  })(),
  sleepFamily: (() => {
    const c = find((x) => x.kind === 'disc_sleep_family' || /nuit courte.*poussée|volume relatif/i.test(x.title));
    return {
      found: Boolean(c),
      role: c?._role,
      title: c?.title,
      hasSensible: /plus sensible|recule davantage/i.test(`${c?.title || ''} ${c?.body || ''}`),
      associationOnly:
        /association descriptive/i.test(c?.body || '') || c?.metrics?.associationOnly === true,
      bodyPreview: String(c?.body || '').slice(0, 360)
    };
  })(),
  familiesEditorial: (() => {
    const byPeriod = {};
    for (const per of PERIODS) {
      const hit = allCards(per).find(
        (c) =>
          c._role === 'priority' &&
          (c.metrics?.conclusionKey || '').startsWith('session_families_overview')
      );
      byPeriod[per] = hit
        ? { priority: true, title: hit.title }
        : { priority: false, inReserve: Boolean(allCards(per).find((c) => (c.metrics?.conclusionKey || '').startsWith('session_families_overview'))) };
    }
    return byPeriod;
  })(),
  parallelConvergence: (() => {
    const cards = pool.filter((c) => /trajectoires parallèles/i.test(c.title));
    return cards.slice(0, 6).map((c) => ({
      period: c._period,
      role: c._role,
      title: c.title,
      convergentWording: /convergent vers/i.test(c.body || ''),
      fourchette: /fourchette proche/i.test(c.body || '')
    }));
  })()
};

// Éditorial 8h
const editorial = {};
for (const per of PERIODS) {
  const pri = allCards(per).filter((c) => c._role === 'priority');
  editorial[per] = {
    count: pri.length,
    titles: pri.map((c) => c.title),
    kinds: pri.map((c) => c.kind),
    familyOverviewPriority: pri.some((c) =>
      String(c.metrics?.conclusionKey || '').startsWith('session_families_overview')
    )
  };
}

function titleOverlap(a, b) {
  const ta = new Set(editorial[a].titles.map((t) => t.toLowerCase()));
  const shared = editorial[b].titles.filter((t) => ta.has(t.toLowerCase()));
  return { shared: shared.length, of: editorial[b].titles.length, titles: shared };
}

const longOverlap = {
  '1y_vs_2y': titleOverlap('1y', '2y'),
  '2y_vs_all': titleOverlap('2y', 'all'),
  '1y_vs_all': titleOverlap('1y', 'all')
};

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'p6-v36-blind-pack.json'), JSON.stringify(blindPack, null, 2));
fs.writeFileSync(path.join(OUT, 'p6-v36-blind-key.json'), JSON.stringify(blindKey, null, 2));
fs.writeFileSync(
  path.join(OUT, 'quality-controls-m37.json'),
  JSON.stringify({ m37, editorial, longOverlap, sampleSize: sample.length }, null, 2)
);

// baseline v31 copy pointer
const v31 = path.join(__dirname, '../mission36-baseline/blind-pack.json');
if (fs.existsSync(v31)) {
  fs.mkdirSync(path.join(OUT, 'qualitative-baseline-v31'), { recursive: true });
  fs.copyFileSync(v31, path.join(OUT, 'qualitative-baseline-v31/blind-pack.json'));
}

console.log(
  JSON.stringify(
    {
      sampleSize: sample.length,
      m37: {
        volume: m37.volumeContrast,
        relative: {
          found: m37.relativeConcentration.found,
          scoped: m37.relativeConcentration.scopedToMoves,
          overclaim: m37.relativeConcentration.overclaimsWeek
        },
        sleep: {
          found: m37.sleepFamily.found,
          sensible: m37.sleepFamily.hasSensible,
          assoc: m37.sleepFamily.associationOnly,
          title: m37.sleepFamily.title
        },
        familiesPriority: Object.fromEntries(
          Object.entries(m37.familiesEditorial).map(([k, v]) => [k, v.priority])
        ),
        parallel: m37.parallelConvergence
      },
      longOverlap
    },
    null,
    2
  )
);
