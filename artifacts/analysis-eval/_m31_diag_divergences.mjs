/**
 * Mission 31 — classifier les 75 card_claim_divergence de l'audit v29.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const auditPath = path.join(
  root,
  'artifacts/analysis-eval/mission31-baseline/momentum-ANALYTICAL_AUDIT-p6-sovereign-v29-2026-11-23T03-09-11-445Z.json'
);
const doc = JSON.parse(fs.readFileSync(auditPath, 'utf8'));

const integrity = doc.diagnostics?.integrityValidation || doc.integrityValidation || {};
const errors = integrity.errors || [];
const divergenceKeys = errors.filter((e) => String(e).startsWith('card_claim_divergence:'));
const prelisted = doc.diagnostics?.cardClaimDivergences || [];

function numFrom(metrics, claim, ids) {
  const ovs = [
    ...(Array.isArray(metrics?.observedValues) ? metrics.observedValues : []),
    ...(Array.isArray(claim?.proof?.observedValues) ? claim.proof.observedValues : [])
  ];
  for (const id of ids) {
    if (metrics?.[id] != null && metrics[id] !== '') {
      const n = Number(typeof metrics[id] === 'object' ? metrics[id].value : metrics[id]);
      if (Number.isFinite(n)) return n;
    }
    const hit = ovs.find((v) => v?.id === id || v?.id === `metric:${id}`);
    const n = Number(hit?.value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

const rows = [];
for (const err of divergenceKeys) {
  const cardId = String(err).replace(/^card_claim_divergence:/, '');
  // cardRegistry keys often period|id
  const card =
    doc.cardRegistry?.[cardId] ||
    Object.values(doc.cardRegistry || {}).find((c) => c.id === cardId || `${c.period}|${c.id}` === cardId);
  if (!card) {
    rows.push({ cardId, missing: true });
    continue;
  }
  const claim = doc.claimRegistry?.[card.claimId] || null;
  const m = card.metrics || {};
  const total = numFrom(m, claim, ['windowTotalReps', 'recentReps', 'currentReps', 'totalReps']);
  const mean = numFrom(m, claim, ['windowMeanPerSession', 'meanPerSession', 'meanReps']);
  const explicitSession =
    numFrom(m, claim, ['sessionCount', 'windowSessionCount']) ??
    (Array.isArray(m.sessions)
      ? m.sessions.filter((s) => s?.inSelectedWindow === true).length || null
      : null);
  const datesLen = Array.isArray(m.dates) ? m.dates.length : null;
  const body = `${card.title || ''} ${card.body || ''}`;
  const proseSessions = [...body.matchAll(/sur\s+(\d+)\s+séances?/gi)].map((x) => Number(x[1]));
  const implied =
    total != null && mean != null && mean > 0 ? Math.round(total / mean) : null;
  const productFromDates = mean != null && datesLen ? mean * datesLen : null;
  const coherentWithProse =
    proseSessions.length === 1 && implied != null && proseSessions[0] === implied;
  const coherentWithExplicit =
    explicitSession != null && implied != null && explicitSession === implied;
  const coherentText =
    /≈|environ|~\s*\d/i.test(body) &&
    proseSessions.some((n) => implied != null && Math.abs(n - implied) <= 1);

  let classif = 'unknown';
  if (datesLen != null && implied != null && datesLen !== implied && (coherentWithProse || coherentWithExplicit || coherentText)) {
    classif = 'false_fail_arc_dates_as_sample';
  } else if (datesLen != null && implied != null && datesLen !== implied && !m.sessionCount && !m.temporalScope?.windowDates) {
    classif = 'false_fail_fallback_arc_no_window_binding';
  } else if (total != null && mean != null && explicitSession != null && Math.abs(total - mean * explicitSession) > 1) {
    classif = 'true_mismatch_same_population';
  } else if (/meanReps/.test(JSON.stringify(m.observedValues || []).slice(0, 200)) && !m.windowMeanPerSession) {
    classif = 'possible_meanReps_not_per_session';
  } else {
    classif = 'needs_manual';
  }

  rows.push({
    period: card.period,
    cardId: card.id,
    kind: card.kind,
    title: String(card.title || '').slice(0, 80),
    total,
    mean,
    datesLen,
    explicitSession,
    proseSessions: [...new Set(proseSessions)],
    impliedSessionsFromTotalMean: implied,
    productFromDates,
    hasTemporalScope: Boolean(m.temporalScope?.windowDates),
    hasSessionFlags: Array.isArray(m.sessions) && m.sessions.some((s) => s?.inSelectedWindow != null),
    sessionCountField: m.sessionCount ?? null,
    metricFactsSample: m.metricFacts?.windowTotalReps?.sampleSize ?? m.metricFacts?.windowMeanPerSession?.sampleSize ?? null,
    classif,
    bodySlice: body.slice(0, 160)
  });
}

const byClass = {};
const byPeriod = {};
for (const r of rows) {
  byClass[r.classif || 'missing'] = (byClass[r.classif || 'missing'] || 0) + 1;
  byPeriod[r.period || '?'] = (byPeriod[r.period || '?'] || 0) + 1;
}

const out = {
  schema: 'momentum.m31.divergenceDiag.v1',
  integrityOk: integrity.ok,
  divergenceCount: divergenceKeys.length,
  byPeriod,
  byClass,
  samples: {
    dips: rows.filter((r) => /[Dd]ips/.test(r.title || '')).slice(0, 5),
    pompes: rows.filter((r) => /[Pp]ompes/.test(r.title || '')).slice(0, 5),
    falseFail: rows.filter((r) => String(r.classif).startsWith('false_fail')).slice(0, 15),
    trueMismatch: rows.filter((r) => r.classif === 'true_mismatch_same_population').slice(0, 10),
    needsManual: rows.filter((r) => r.classif === 'needs_manual').slice(0, 10)
  },
  all: rows
};

const outDir = path.join(root, 'artifacts/analysis-eval/mission31-results');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'divergence-diag.json'), JSON.stringify(out, null, 2));
console.log(
  JSON.stringify(
    {
      divergenceCount: out.divergenceCount,
      integrityOk: out.integrityOk,
      byPeriod: out.byPeriod,
      byClass: out.byClass,
      cardCount: Object.keys(doc.cardRegistry || {}).length,
      claimCount: Object.keys(doc.claimRegistry || {}).length,
      fingerprint: doc.manifest?.fingerprint || doc.fingerprint || null,
      edition: doc.manifest?.edition || null
    },
    null,
    2
  )
);
