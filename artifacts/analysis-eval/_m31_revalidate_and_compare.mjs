/**
 * Mission 31 — revalider les 75 divergences v29 + comparer v28/v29 par identité.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateCardClaimConsistency } from '../../src/utils/sport/evaluation/claimAssertionIdentity.js';
import { validateAnalyticalAudit } from '../../src/utils/sport/evaluation/buildAnalyticalAudit.js';
import { ANALYSIS_EDITION_PARTS, analysisMissionLabel } from '../../src/utils/sport/analysisEdition.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = path.join(root, 'artifacts/analysis-eval/mission31-results');
fs.mkdirSync(outDir, { recursive: true });

const v29 = JSON.parse(
  fs.readFileSync(
    path.join(
      root,
      'artifacts/analysis-eval/mission31-baseline/momentum-ANALYTICAL_AUDIT-p6-sovereign-v29-2026-11-23T03-09-11-445Z.json'
    ),
    'utf8'
  )
);
const v28Path = path.join(
  root,
  'artifacts/analysis-eval/mission30-baseline/momentum-ANALYTICAL_AUDIT-p6-sovereign-v28-2026-11-22T17-47-02-151Z.json'
);
const v28 = fs.existsSync(v28Path) ? JSON.parse(fs.readFileSync(v28Path, 'utf8')) : null;

function findCard(doc, idOrKey) {
  if (doc.cardRegistry?.[idOrKey]) return doc.cardRegistry[idOrKey];
  return Object.values(doc.cardRegistry || {}).find(
    (c) => c.id === idOrKey || `${c.period}|${c.id}` === idOrKey
  );
}

const divs = v29.diagnostics?.cardClaimDivergences || [];
const reval = [];
let stillHardFail = 0;
let cleared = 0;
let nonComparableNotes = 0;
const byPeriod = {};
const byClass = {};

for (const d of divs) {
  const cardKey = d.cardKey || null;
  const cardId = d.cardId || d.id || d.card?.id;
  const period = d.period || (cardKey ? String(cardKey).split('|')[0] : null);
  const card =
    (cardKey && v29.cardRegistry?.[cardKey]) ||
    findCard(v29, period && cardId ? `${period}|${cardId}` : cardId) ||
    findCard(v29, cardId) ||
    d.card;
  const claim =
    (d.claimId && v29.claimRegistry?.[d.claimId]) ||
    (card?.claimId ? v29.claimRegistry?.[card.claimId] : null) ||
    d.claim ||
    null;
  const check = card && claim ? validateCardClaimConsistency(card, claim) : { ok: false, issue: 'missing' };
  const hard = (check.conflicts || []).filter((c) => c.metric === 'sum_mean_sample_consistency');
  const notes = check.notes || [];
  let classif = 'cleared_false_fail_unbound_population';
  if (!check.ok && hard.length) {
    classif = 'true_mismatch_still_failing';
    stillHardFail += 1;
  } else if (check.ok) {
    cleared += 1;
    if (notes.some((n) => n.metric === 'sum_mean_sample_noncomparable')) {
      nonComparableNotes += 1;
      classif = 'noncomparable_explicit';
    }
  } else {
    classif = `other_conflict:${(check.conflicts || []).map((c) => c.metric).join(',')}`;
    stillHardFail += 1;
  }
  byPeriod[period || card?.period || '?'] = (byPeriod[period || card?.period || '?'] || 0) + 1;
  byClass[classif] = (byClass[classif] || 0) + 1;
  reval.push({
    period: period || card?.period,
    cardId: card?.id || cardId,
    kind: card?.kind,
    title: String(card?.title || '').slice(0, 90),
    oldConflict: (d.conflicts || [])[0] || null,
    classif,
    ok: check.ok,
    notes: notes.slice(0, 2)
  });
}

// Revalider integrity sur un sous-ensemble reconstruit (cartes divergentes seules)
const miniRegistry = {};
const miniClaims = {};
for (const r of reval) {
  const card = findCard(v29, r.period ? `${r.period}|${r.cardId}` : r.cardId) || findCard(v29, r.cardId);
  if (!card) continue;
  miniRegistry[`${card.period}|${card.id}`] = card;
  if (card.claimId && v29.claimRegistry[card.claimId]) {
    miniClaims[card.claimId] = v29.claimRegistry[card.claimId];
  }
}
const miniAudit = {
  schema: 'momentum.analyticalAudit.v2',
  manifest: { edition: ANALYSIS_EDITION_PARTS.editorial },
  cardRegistry: miniRegistry,
  claimRegistry: miniClaims,
  factRegistry: {}
};
const miniVal = validateAnalyticalAudit(miniAudit);

function phenKey(card) {
  return (
    card?.phenomenonId ||
    card?.metrics?.phenomenonKey ||
    card?.occurrenceId ||
    card?.id ||
    `${card?.kind}|${card?.title}`
  );
}

function indexCards(doc) {
  const map = new Map();
  for (const card of Object.values(doc?.cardRegistry || {})) {
    if (card.role !== 'priority' && card.role !== 'reserve' && card.role !== 'deepening') continue;
    const key = `${card.period || ''}::${phenKey(card)}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(card);
  }
  return map;
}

let comparison = { skipped: true };
if (v28) {
  const a = indexCards(v28);
  const b = indexCards(v29);
  const keysA = new Set(a.keys());
  const keysB = new Set(b.keys());
  const shared = [...keysA].filter((k) => keysB.has(k));
  const only28 = [...keysA].filter((k) => !keysB.has(k));
  const only29 = [...keysB].filter((k) => !keysA.has(k));
  const modified = [];
  for (const k of shared) {
    const ca = a.get(k)[0];
    const cb = b.get(k)[0];
    const bodyA = `${ca.title || ''}|${ca.body || ''}`;
    const bodyB = `${cb.title || ''}|${cb.body || ''}`;
    if (bodyA !== bodyB) {
      modified.push({
        key: k,
        title28: ca.title,
        title29: cb.title,
        bodyChanged: true,
        kind: ca.kind
      });
    }
  }
  comparison = {
    skipped: false,
    fingerprint28: v28.manifest?.fingerprint?.digest || v28.manifest?.fingerprint,
    fingerprint29: v29.manifest?.fingerprint?.digest || v29.manifest?.fingerprint,
    nameMap28: v28.manifest?.fingerprint?.nameMapSize,
    nameMap29: v29.manifest?.fingerprint?.nameMapSize,
    accessible28: Object.values(v28.cardRegistry || {}).filter((c) =>
      ['priority', 'reserve', 'deepening'].includes(c.role)
    ).length,
    accessible29: Object.values(v29.cardRegistry || {}).filter((c) =>
      ['priority', 'reserve', 'deepening'].includes(c.role)
    ).length,
    sharedPhenomena: shared.length,
    onlyV28: only28.length,
    onlyV29: only29.length,
    modifiedBodies: modified.length,
    onlyV28Sample: only28.slice(0, 25).map((k) => {
      const c = a.get(k)[0];
      return { key: k, title: c.title, kind: c.kind, role: c.role, period: c.period };
    }),
    onlyV29Sample: only29.slice(0, 25).map((k) => {
      const c = b.get(k)[0];
      return { key: k, title: c.title, kind: c.kind, role: c.role, period: c.period };
    }),
    modifiedSample: modified.slice(0, 20)
  };
}

// UI counter hypothesis from user screenshots vs export 7d
const weekCards = Object.values(v29.cardRegistry || {}).filter(
  (c) => c.period === '7d' || c.period === 'week'
);
const weekPriority = weekCards.filter((c) => c.role === 'priority');
const weekReserve = weekCards.filter((c) => c.role === 'reserve' || c.role === 'deepening');
const uiHypothesis = {
  periodKeysPresent: [...new Set(weekCards.map((c) => c.period))],
  accessible7d: weekCards.length,
  priority7d: weekPriority.length,
  complementary7d: weekReserve.length,
  note:
    'Si UI affiche 47 analyses / 11 mises en avant : vérifier si 47=complémentaires seulement et 11=priorités, ou autre agrégat. Export JSON v29 pour 7d ci-dessus.'
};

const out = {
  schema: 'momentum.mission31.revalidateCompare.v1',
  mission: analysisMissionLabel(),
  codeEdition: ANALYSIS_EDITION_PARTS.editorial,
  initialDivergences: divs.length,
  revalidation: {
    cleared,
    stillHardFail,
    nonComparableNotes,
    byPeriod,
    byClass,
    miniAuditIntegrityOk: miniVal.integrityValidation?.ok,
    miniAuditDivergenceErrors: (miniVal.integrityValidation?.errors || []).filter((e) =>
      String(e).startsWith('card_claim_divergence')
    ).length
  },
  samples: {
    cleared: reval.filter((r) => r.classif.includes('noncomparable') || r.classif.includes('cleared')).slice(0, 8),
    stillFailing: reval.filter((r) => r.classif.includes('fail') || r.classif.startsWith('other')).slice(0, 8)
  },
  comparisonV28V29: comparison,
  uiHypothesis,
  allReval: reval
};

fs.writeFileSync(path.join(outDir, 'revalidate-compare.json'), JSON.stringify(out, null, 2));
console.log(
  JSON.stringify(
    {
      initialDivergences: out.initialDivergences,
      cleared: out.revalidation.cleared,
      stillHardFail: out.revalidation.stillHardFail,
      nonComparableNotes: out.revalidation.nonComparableNotes,
      byClass: out.revalidation.byClass,
      miniIntegrityOk: out.revalidation.miniAuditIntegrityOk,
      comparison: {
        accessible28: comparison.accessible28,
        accessible29: comparison.accessible29,
        shared: comparison.sharedPhenomena,
        only28: comparison.onlyV28,
        only29: comparison.onlyV29,
        modified: comparison.modifiedBodies,
        fp: { v28: comparison.fingerprint28, v29: comparison.fingerprint29 }
      },
      uiHypothesis
    },
    null,
    2
  )
);
