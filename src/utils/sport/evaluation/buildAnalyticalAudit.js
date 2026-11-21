/**
 * JSON analytique normalisé (Mission 11 — Export 2).
 * Un seul fichier versionné, références plutôt que duplications.
 */

import { analysisEditionKey } from '../analysisEdition';
import { snapshotFingerprint } from '../analysisEnvironmentDossier';
import { auditInsightsProse } from '../editorialProseGuard';
import { buildProgramSessionGraph } from '../sessionStructureGraph';
import { reconcilePublicationIds, stablePublicationId } from '../p6Publication';

function slimCard(card, role, order) {
  if (!card) return null;
  const claim = card.claim || card.inspection?.claim || null;
  return {
    id: card.id || card.publicationId || stablePublicationId(card) || null,
    role,
    order,
    kind: card.kind || null,
    title: card.title || null,
    body: card.body || card.text || null,
    evidence: typeof card.evidence === 'string' ? card.evidence : null,
    family: card.family || null,
    disposition: card.disposition || card.p6Disposition || null,
    collapsedInto: card.collapsedInto || null,
    phenomenonId: card.phenomenonId || claim?.phenomenonId || null,
    claimId: claim?.id || null,
    population: claim?.population || card.metrics?.populationLabel || null,
    limitations: claim?.limitations || card.limitations || null,
    observedValues: claim?.proof?.observedValues || card.metrics?.observedValues || null,
    selectionReason: card.reason || card.marginal || null,
    rival: card._blockedBy || card.metrics?.rivalDominant || null
  };
}

function claimFromCard(card) {
  const claim = card?.claim || card?.inspection?.claim || null;
  if (!claim) return null;
  return {
    id: claim.id || card.id || null,
    statement: claim.statement || card.title || null,
    subject: claim.subject || null,
    population: claim.population || null,
    scope: claim.scope || null,
    assertions: claim.assertions || null,
    proof: claim.proof || null,
    limitations: claim.limitations || null,
    confidence: claim.confidence ?? null,
    allowedStatements: claim.allowedStatements || null,
    status: claim.status || null,
    producer: claim.producer || null,
    cardId: card.id || null,
    kind: card.kind || null
  };
}

/**
 * Construit ANALYTICAL_AUDIT.json à partir des paquets live / export 8 périodes.
 */
export function buildAnalyticalAudit({
  eightPeriodExport = null,
  insights = null,
  measure = null,
  p6 = null,
  snapshot = null,
  activeProgram = null,
  gamesByPeriod = null,
  domVerify = null,
  memorySummary = null,
  underexploration = null
} = {}) {
  const assembledAt = new Date().toISOString();
  const edition = analysisEditionKey();
  const fingerprint = snapshot ? snapshotFingerprint(snapshot) : null;

  const cardRegistry = {};
  const claimRegistry = {};
  const candidateRegistry = {};

  const pushCard = (card, role, order, period) => {
    const slim = slimCard(card, role, order);
    if (!slim?.id) return;
    const key = `${period || 'live'}|${slim.id}`;
    cardRegistry[key] = { ...slim, period: period || null };
    const claim = claimFromCard(card);
    if (claim?.id) claimRegistry[claim.id] = claim;
  };

  if (insights) {
    let order = 0;
    (insights.shortTerm || []).forEach((c) => pushCard(c, 'priority', ++order, 'live'));
    (insights.mediumTerm || []).forEach((c) => pushCard(c, 'priority', ++order, 'live'));
    (insights.longTerm || []).forEach((c) => pushCard(c, 'priority', ++order, 'live'));
    (insights.accessibleReserve || []).forEach((c, i) => pushCard(c, 'reserve', i + 1, 'live'));
  }

  const periods = {};
  Object.entries(eightPeriodExport?.periods || {}).forEach(([period, dossier]) => {
    const prio = dossier?.userAccessible?.priority || [];
    const reserve = dossier?.userAccessible?.reserve || [];
    prio.forEach((c, i) => pushCard(c, 'priority', i + 1, period));
    reserve.forEach((c, i) => pushCard(c, 'reserve', i + 1, period));
    (dossier?.registry?.raw || []).slice(0, 200).forEach((c, i) => {
      const id = c.id || c.kind || `raw-${i}`;
      candidateRegistry[`${period}|${id}`] = {
        id,
        period,
        role: 'raw_candidate',
        kind: c.kind || null,
        title: c.title || null,
        body: c.body || null,
        disposition: c.role || 'raw',
        reason: c.reason || null
      };
    });
    (dossier?.registry?.fused || []).forEach((c, i) => {
      candidateRegistry[`${period}|fused|${c.id || i}`] = {
        id: c.id || null,
        period,
        role: 'fused',
        title: c.title || null,
        collapsedInto: c.collapsedInto || null,
        disposition: 'source_retained'
      };
    });
    (dossier?.registry?.rejected || []).forEach((c, i) => {
      candidateRegistry[`${period}|rej|${c.id || i}`] = {
        id: c.id || null,
        period,
        role: 'rejected',
        title: c.title || null,
        reason: c.reason || null
      };
    });
    periods[period] = {
      packId: dossier?.packId || null,
      provenance: dossier?.provenance || null,
      window: dossier?.window || null,
      edition: dossier?.engine?.edition || null,
      fingerprint: dossier?.engine?.dataFingerprint || null,
      counts: dossier?.userAccessible?.counts || null,
      reconciliation: dossier?.registry?.publicationReconciliation || null,
      memory: dossier?.memory || null,
      domVerified: dossier?.domVerified === true,
      measure: dossier?.measure
        ? {
            totalReps: dossier.measure.totalReps,
            trainingDays: dossier.measure.trainingDays,
            strengthDays: dossier.measure.strengthDays,
            minutes: dossier.measure.minutes,
            totalMinutes: dossier.measure.totalMinutes,
            durationContract: dossier.measure.durationContract || null
          }
        : null
    };
  });

  if (p6) {
    [...(p6.priority || []), ...(p6.reserve || [])].forEach((row, i) => {
      const id = stablePublicationId(row) || row.id || row.kind || `p6-${i}`;
      if (!candidateRegistry[`p6|${id}`]) {
        candidateRegistry[`p6|${id}`] = {
          id,
          role: row.p6Disposition || 'registry',
          kind: row.kind || null,
          title: row.title || null,
          body: row.body || null,
          score: row.score ?? row.weights ?? null,
          collapsedInto: row.collapsedInto || null
        };
      }
    });
  }

  const program = activeProgram || snapshot?.activeProgram || null;
  const programGraph = program ? buildProgramSessionGraph(program) : null;

  const recon =
    insights?.publicationReconciliation ||
    (p6
      ? reconcilePublicationIds({
          registryIds: [...(p6.priority || []), ...(p6.reserve || [])].map(stablePublicationId),
          publishedIds: [
            ...(insights?.shortTerm || []),
            ...(insights?.mediumTerm || []),
            ...(insights?.longTerm || []),
            ...(insights?.accessibleReserve || [])
          ].map(stablePublicationId),
          dispositions: insights?.publicationDispositions || []
        })
      : null);

  return {
    schema: 'momentum.analyticalAudit.v1',
    schemaDictionary: {
      units: { reps: 'répétitions', minutes: 'minutes', hours: 'heures', percent: 'ratio 0–1 ou % selon champ' },
      conventions: {
        absent: 'clé absente',
        unknown: 'valeur null explicite',
        zero: '0 mesuré',
        reconstructed: 'dérivé sans snapshot figé'
      }
    },
    manifest: {
      assembledAt,
      edition,
      fingerprint,
      mission: 'Mission 11',
      hasEightPeriods: Boolean(eightPeriodExport?.periods),
      cardCount: Object.keys(cardRegistry).length,
      claimCount: Object.keys(claimRegistry).length,
      candidateCount: Object.keys(candidateRegistry).length
    },
    snapshots: fingerprint
      ? { live: { fingerprint, note: 'empreinte seule — pas de PII' } }
      : {},
    sourceCoverage: {
      schema: 'momentum.dataCoverage.v2',
      measure: measure
        ? {
            totalReps: measure.totalReps,
            minutes: measure.minutes,
            totalMinutes: measure.totalMinutes,
            durationContract: measure.durationContract || null
          }
        : null,
      program: Boolean(program),
      sleepHint: Boolean(measure?.durationContract || snapshot?.garminData),
      note: 'Couverture détaillée par source à enrichir depuis measure/banner par période'
    },
    metricDefinitions: {
      nonRunningSessionMinutes: 'minutes hors course (séances)',
      recordedActivityMinutes: 'totalMinutes incluant course',
      densityPaired: 'reps / minutes hors course lorsque couverture adéquate',
      minutesMostlyChallenge: 'durée hors course dominée par défis chronométrés'
    },
    identityRegistry: {
      note: 'Identités détaillées dans cardRegistry.phenomenonId / claim.subject — pas de fusion silencieuse'
    },
    programRegistry: programGraph
      ? {
          available: programGraph.available,
          templateCount: programGraph.templateCount,
          families: programGraph.families,
          templates: programGraph.templates,
          relations: (programGraph.relations || []).slice(0, 80),
          note: 'Muscles = banque ; pas programCategory comme muscle'
        }
      : { available: false, reason: 'no_program' },
    sourceEvents: {
      note: 'Dates/séances : voir proof.sourceEvents des claims et measure.repsByDate si présent'
    },
    factRegistry: {
      note: 'Faits numériques portés par claim.proof.observedValues — évite duplication massive'
    },
    claimRegistry,
    cardRegistry,
    candidateRegistry,
    relations: p6?.relations || [],
    explorationRuns: {
      underexploration: underexploration || p6?.underexploration || null,
      pass4: p6?.review || null
    },
    selectionRuns: {
      counters: p6?.counters || null,
      views: p6?.views || null,
      priorityReading: p6?.priorityReading || null
    },
    publicationRuns: {
      reconciliation: recon,
      dispositions: insights?.publicationDispositions || null,
      authority: insights?.publicationAuthority || null
    },
    periods,
    evaluations: gamesByPeriod || null,
    comparisons: eightPeriodExport?.comparisons
      ? Object.fromEntries(
          Object.entries(eightPeriodExport.comparisons).map(([k, v]) => [
            k,
            {
              schema: v?.schema || null,
              periodA: v?.periodA || null,
              periodB: v?.periodB || null,
              diffSummary: v?.diff
                ? {
                    priorityOnlyA: v.diff.priorityOnlyA || [],
                    priorityOnlyB: v.diff.priorityOnlyB || [],
                    commonCount: (v.diff.common || []).length
                  }
                : null
            }
          ])
        )
      : null,
    domEvidence: domVerify || null,
    memoryEvidence: memorySummary || null,
    diagnostics: {
      proseAudit: auditInsightsProse(insights || {}),
      publicationCountGap: recon?.countGap ?? null,
      countsReconciled: recon?.countsReconciled ?? null
    }
  };
}

export function validateAnalyticalAudit(doc) {
  const errors = [];
  if (!doc || doc.schema !== 'momentum.analyticalAudit.v1') {
    errors.push('schema_mismatch');
  }
  if (!doc?.manifest?.edition) errors.push('missing_edition');
  if (!doc?.cardRegistry || typeof doc.cardRegistry !== 'object') errors.push('missing_cardRegistry');
  if (!doc?.claimRegistry || typeof doc.claimRegistry !== 'object') errors.push('missing_claimRegistry');
  // références orphelines claims → cards
  Object.values(doc.claimRegistry || {}).forEach((claim) => {
    if (claim.cardId) {
      const hit = Object.values(doc.cardRegistry || {}).some((c) => c.id === claim.cardId);
      if (!hit) errors.push(`orphan_claim_card:${claim.id}`);
    }
  });
  return {
    ok: errors.length === 0,
    errors,
    counts: {
      cards: Object.keys(doc?.cardRegistry || {}).length,
      claims: Object.keys(doc?.claimRegistry || {}).length,
      candidates: Object.keys(doc?.candidateRegistry || {}).length
    }
  };
}
