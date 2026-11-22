/**
 * JSON analytique normalisé (Mission 15 — Export autonome).
 * Claims contextualisés par horizon/fenêtre — pas d’écrasement silencieux.
 */

import { analysisEditionKey, analysisMissionLabel } from '../analysisEdition';
import { snapshotFingerprint } from '../analysisEnvironmentDossier';
import { auditInsightsProse } from '../editorialProseGuard';
import { buildProgramSessionGraph } from '../sessionStructureGraph';
import { reconcilePublicationIds, stablePublicationId } from '../p6Publication';
import { extractAtomicFactsFromCards } from '../interHorizonFactCoherence';
import {
  assertionClaimKey,
  phenomenonClaimId,
  validateCardClaimConsistency
} from './claimAssertionIdentity';

function resolveProgram(snapshot, activeProgram) {
  return (
    activeProgram ||
    snapshot?.activeProgram ||
    (Array.isArray(snapshot?.programs)
      ? snapshot.programs.find((p) => p?.active) || snapshot.programs[0]
      : null) ||
    null
  );
}

function slimCard(card, role, order, { claimRef = null, period = null } = {}) {
  if (!card) return null;
  const claim = card.claim || card.inspection?.claim || null;
  return {
    id: card.id || card.publicationId || stablePublicationId(card) || null,
    role,
    order,
    period: period || null,
    kind: card.kind || null,
    title: card.title || null,
    body: card.body || card.text || null,
    evidence: typeof card.evidence === 'string' ? card.evidence : null,
    family: card.family || null,
    disposition: card.disposition || card.p6Disposition || null,
    collapsedInto: card.collapsedInto || null,
    parentId: card.parentId || card.collapsedInto || null,
    childIds: card.childIds || card.hierarchyChildren || null,
    hierarchyLink: card.hierarchyLink || null,
    phenomenonId: card.phenomenonId || claim?.phenomenonId || null,
    /** Référence à l’assertion contextualisée (pas seulement l’id phénomène) */
    claimId: claimRef || claim?.id || null,
    phenomenonClaimId: claim ? phenomenonClaimId(claim, card) : null,
    population: claim?.population || card.metrics?.populationLabel || null,
    limitations: claim?.limitations || card.limitations || null,
    observedValues: claim?.proof?.observedValues || card.metrics?.observedValues || null,
    metrics: card.metrics
      ? {
          windowMeanPerSession: card.metrics.windowMeanPerSession ?? null,
          arcEarlyMean: card.metrics.arcEarlyMean ?? null,
          arcLateMean: card.metrics.arcLateMean ?? null,
          windowStart: card.metrics.windowStart ?? null,
          windowEnd: card.metrics.windowEnd ?? null,
          totalReps: card.metrics.totalReps ?? null,
          relativeConcentration: card.metrics.relativeConcentration ?? null,
          // Mission 16 : conserver l’identité d’épisode pour faits / collectif
          exerciseId: card.metrics.exerciseId ?? null,
          exerciseName: card.metrics.exerciseName || card.metrics.name || null,
          name: card.metrics.name || card.metrics.exerciseName || null,
          date: card.metrics.date || card.metrics.returnDate || card.metrics.peakDate || null,
          returnDate: card.metrics.returnDate || card.metrics.gapAfter || null,
          peakDate: card.metrics.peakDate || null,
          dates: Array.isArray(card.metrics.dates) ? card.metrics.dates.slice(0, 8) : null,
          confirmationDates: Array.isArray(card.metrics.confirmationDates)
            ? card.metrics.confirmationDates.slice(0, 8)
            : null,
          gapDays: card.metrics.gapDays ?? card.metrics.daysAbsent ?? null,
          mechanism: card.metrics.mechanism || null,
          thesis: card.metrics.thesis || null,
          composition: card.metrics.composition || null,
          population: card.metrics.population || card.metrics.populationLabel || null,
          prevReps: card.metrics.prevReps ?? card.metrics.priorAvg ?? null,
          currentReps: card.metrics.currentReps ?? card.metrics.lastReps ?? null
        }
      : null,
    selectionReason: card.reason || card.marginal || null,
    rival: card._blockedBy || card.metrics?.rivalDominant || null
  };
}

function claimFromCard(card, period) {
  const claim = card?.claim || card?.inspection?.claim || null;
  if (!claim) return null;
  const base = claim;
  const assertionId = assertionClaimKey(base, card, period);
  const phenId = phenomenonClaimId(base, card);
  return {
    id: assertionId,
    phenomenonClaimId: phenId,
    legacyClaimId: base.id || null,
    period: period || null,
    statement: base.statement || card?.title || null,
    subject: base.subject || null,
    population: base.population || card?.metrics?.populationLabel || null,
    scope: base.scope || {
      start: card?.metrics?.windowStart || null,
      end: card?.metrics?.windowEnd || null
    },
    assertions: base.assertions || null,
    proof: base.proof || null,
    limitations: base.limitations || null,
    confidence: base.confidence ?? null,
    allowedStatements: base.allowedStatements || null,
    status: base.status || null,
    producer: base.producer || null,
    cardId: card?.id || null,
    kind: card?.kind || null
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
  underexploration = null,
  currentPeriod = null,
  analysisRunId = null,
  computedAt = null
} = {}) {
  const assembledAt = new Date().toISOString();
  const edition = analysisEditionKey();
  const fingerprint = snapshot ? snapshotFingerprint(snapshot) : null;

  const cardRegistry = {};
  const claimRegistry = {};
  const candidateRegistry = {};
  const claimCollisionsAvoided = [];
  const cardClaimDivergences = [];

  const pushCard = (card, role, order, period) => {
    if (!card) return;
    const claimEntry = claimFromCard(card, period);
    let claimRef = null;
    if (claimEntry?.id) {
      const existing = claimRegistry[claimEntry.id];
      if (existing) {
        const compat = validateCardClaimConsistency(
          { ...card, observedValues: claimEntry.proof?.observedValues },
          existing
        );
        // Même clé d’assertion → même fenêtre ; conflit = anomalie
        if (!compat.ok && existing.legacyClaimId === claimEntry.legacyClaimId) {
          claimCollisionsAvoided.push({
            assertionId: claimEntry.id,
            issue: 'same_assertion_key_divergent_payload',
            conflicts: compat.conflicts
          });
        }
      } else {
        claimRegistry[claimEntry.id] = claimEntry;
      }
      claimRef = claimEntry.id;

      // Détecter si l’ancienne clé phénomène seule aurait écrasé une autre fenêtre
      if (claimEntry.legacyClaimId) {
        const naiveKey = String(claimEntry.legacyClaimId);
        const other = Object.values(claimRegistry).find(
          (c) =>
            c.id !== claimEntry.id &&
            c.legacyClaimId === naiveKey &&
            (c.scope?.end || '') !== (claimEntry.scope?.end || '')
        );
        if (other) {
          claimCollisionsAvoided.push({
            legacyClaimId: naiveKey,
            keptAssertionIds: [claimEntry.id, other.id],
            issue: 'multi_window_same_legacy_id_separated'
          });
        }
      }
    }

    const slim = slimCard(card, role, order, { claimRef, period });
    if (!slim?.id) return;
    const key = `${period || 'unscoped'}|${slim.id}`;
    cardRegistry[key] = { ...slim, period: period || null };

    if (claimRef && claimRegistry[claimRef]) {
      const check = validateCardClaimConsistency(slim, claimRegistry[claimRef]);
      if (!check.ok) {
        cardClaimDivergences.push({
          cardKey: key,
          claimId: claimRef,
          issue: check.issue,
          conflicts: check.conflicts
        });
      }
    }
  };

  const periodEntries = Object.entries(eightPeriodExport?.periods || {});
  const hasEight = periodEntries.length > 0;
  // Mission 15 : ne pas dupliquer la période courante sous « live » si les 8 horizons sont présents
  const includeLiveMirror = Boolean(insights) && !hasEight;

  if (includeLiveMirror) {
    let order = 0;
    (insights.shortTerm || []).forEach((c) => pushCard(c, 'priority', ++order, currentPeriod || 'current'));
    (insights.mediumTerm || []).forEach((c) => pushCard(c, 'priority', ++order, currentPeriod || 'current'));
    (insights.longTerm || []).forEach((c) => pushCard(c, 'priority', ++order, currentPeriod || 'current'));
    (insights.accessibleReserve || []).forEach((c, i) =>
      pushCard(c, 'reserve', i + 1, currentPeriod || 'current')
    );
  }

  const periods = {};
  const allDispositions = {};
  const allRelations = [];

  periodEntries.forEach(([period, dossier]) => {
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

    const disp = dossier?.registry?.publicationDispositions || [];
    if (disp.length) allDispositions[period] = disp;
    const rel = dossier?.registry?.relations || [];
    if (rel.length) {
      rel.forEach((r) => allRelations.push({ ...r, period }));
    }

    const accessibleCount = dossier?.userAccessible?.counts?.accessible ?? prio.length + reserve.length;
    const pubRecon = dossier?.registry?.publicationReconciliation || null;
    const finalRecon = dossier?.registry?.finalCatalogReconciliation || null;
    periods[period] = {
      packId: dossier?.packId || null,
      provenance: dossier?.provenance || null,
      window: dossier?.window || null,
      edition: dossier?.engine?.edition || null,
      accessibleCount,
      publicationCount: pubRecon?.publishedCount ?? null,
      registryCount: pubRecon?.registryCount ?? null,
      reconciledStrict: pubRecon?.reconciledStrict ?? null,
      finalCatalogReconciliation: finalRecon,
      hierarchy: dossier?.registry?.hierarchy || dossier?.hierarchy || null,
      cardRefs: [...prio, ...reserve]
        .map((c) => `${period}|${c.id || c.publicationId || ''}`)
        .filter((k) => k.endsWith('|') === false && cardRegistry[k])
    };
  });

  const program = resolveProgram(snapshot, activeProgram);
  // Fallback : programme mentionné dans un dossier d’horizon
  let programFromDossier = null;
  if (!program && hasEight) {
    for (const [, dossier] of periodEntries) {
      const p =
        dossier?.program ||
        dossier?.engine?.activeProgram ||
        dossier?.registry?.program ||
        null;
      if (p) {
        programFromDossier = p;
        break;
      }
    }
  }
  const effectiveProgram = program || programFromDossier;
  const programGraph = effectiveProgram ? buildProgramSessionGraph(effectiveProgram) : null;

  // Faits atomiques agrégés depuis les cartes (références, pas duplication massive des events)
  const factRegistry = {};
  Object.entries(cardRegistry).forEach(([cardKey, card]) => {
    const extracted = extractAtomicFactsFromCards([card], {
      period: card.period,
      window: { start: card.metrics?.windowStart, end: card.metrics?.windowEnd }
    });
    (extracted.facts || []).forEach((fact) => {
      const fid = [
        fact.subjectKey,
        fact.metricId,
        fact.population,
        fact.windowStart,
        fact.windowEnd,
        fact.method,
        fact.episode || ''
      ].join('|');
      if (!factRegistry[fid]) {
        factRegistry[fid] = { ...fact, id: fid, cardRefs: [cardKey] };
      } else {
        const existing = factRegistry[fid];
        const a = Number(existing.value);
        const b = Number(fact.value);
        if (
          Number.isFinite(a) &&
          Number.isFinite(b) &&
          Math.abs(a - b) > Math.abs(a) * 0.001 + 0.5
        ) {
          // Collision réelle : conserver les deux sous une clé différenciée par valeur
          const splitId = `${fid}|v:${b}`;
          if (!factRegistry[splitId]) {
            factRegistry[splitId] = {
              ...fact,
              id: splitId,
              cardRefs: [cardKey],
              collisionWith: fid
            };
          }
        } else if (!existing.cardRefs.includes(cardKey)) {
          existing.cardRefs.push(cardKey);
        }
      }
    });
  });

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

  const fp = fingerprint || {};
  const sourceCoverage = {
    schema: 'momentum.dataCoverage.v3',
    note: 'Statuts séparés — fingerprint reps-only ≠ absence de programme/charges dans le calcul',
    fingerprint: fp,
    sources: {
      program: {
        inEngine: Boolean(programGraph?.available) || Object.values(cardRegistry).some((c) => /séance|famille|prescription/i.test(`${c.title} ${c.body}`)),
        inSnapshot: Boolean(effectiveProgram),
        inFingerprint: (fp.programKeys ?? null) != null,
        inExporter: Boolean(snapshot || effectiveProgram),
        usedInConclusions: Boolean(programGraph?.available),
        exportStatus: effectiveProgram
          ? 'exported'
          : programGraph
            ? 'graph_empty'
            : 'not_loaded_or_absent'
      },
      loads: {
        inEngine: Object.values(cardRegistry).some((c) => /charge|kg|resistance/i.test(`${c.title} ${c.body}`)),
        inSnapshot: Boolean(snapshot?.loads || snapshot?.weights || snapshot?.weightHistory),
        inFingerprint: (fp.weightKeys ?? 0) > 0,
        inExporter: Boolean(snapshot),
        note: 'weightKeys=0 dans fingerprint n’infirme pas des cartes de charges si inEngine'
      },
      sleep: {
        inEngine: Object.values(cardRegistry).some((c) => /sommeil|sleep/i.test(`${c.title} ${c.body}`)),
        inSnapshot: Boolean(snapshot?.garminData?.dailyMetrics || snapshot?.sleep),
        inFingerprint: Boolean(fp.sleepKeys || fp.garminHash),
        inExporter: Boolean(snapshot)
      },
      reps: {
        inEngine: true,
        inSnapshot: Boolean(snapshot?.reps),
        inFingerprint: (fp.repsKeys ?? fp.repKeys ?? 0) > 0,
        inExporter: Boolean(snapshot)
      }
    }
  };

  return {
    schema: 'momentum.analyticalAudit.v2',
    schemaDictionary: {
      units: {
        reps: 'répétitions entières',
        minutes: 'minutes',
        hours: 'heures',
        percent_0_100: 'pourcentage 0–100',
        ratio_0_1: 'ratio unitaire 0–1',
        kg: 'kilogrammes'
      },
      claimIdentity: {
        phenomenonClaimId: 'phénomène partageable entre horizons',
        assertionClaimKey: 'assertion contextualisée (période + fenêtre + population)',
        note: 'Ne jamais indexer claimRegistry uniquement sur legacyClaimId'
      },
      conventions: {
        absent: 'clé absente',
        unknown: 'valeur null explicite',
        zero: '0 mesuré',
        reconstructed: 'dérivé sans snapshot figé',
        not_loaded: 'source existante non passée à l’assemblage',
        not_exported: 'utilisée en calcul mais absente de l’artefact'
      }
    },
    manifest: {
      assembledAt,
      exportedAt: assembledAt,
      computedAt: computedAt || eightPeriodExport?.capturedAt || null,
      analysisRunId: analysisRunId || eightPeriodExport?.analysisRunId || null,
      edition,
      fingerprint,
      schemaVersion: 'momentum.analyticalAudit.v2',
      mission: analysisMissionLabel(),
      currentPeriod: currentPeriod || eightPeriodExport?.currentPeriod || null,
      hasEightPeriods: hasEight,
      includeLiveMirror,
      cardCount: Object.keys(cardRegistry).length,
      claimCount: Object.keys(claimRegistry).length,
      candidateCount: Object.keys(candidateRegistry).length,
      factCount: Object.keys(factRegistry).length
    },
    snapshots: fingerprint
      ? {
          live: {
            fingerprint,
            coverageNote:
              'Empreinte actuelle centrée reps/checked — charges/durées/sommeil peuvent être absents du digest'
          }
        }
      : {},
    sourceCoverage,
    metricDefinitions: {
      nonRunningSessionMinutes: 'minutes hors course (séances)',
      recordedActivityMinutes: 'totalMinutes incluant course',
      densityPaired: 'reps / minutes hors course lorsque couverture adéquate',
      minutesMostlyChallenge: 'durée hors course dominée par défis chronométrés',
      windowMeanPerSession: 'moyenne des totaux de séance dans la fenêtre de la carte',
      moveShareOfParentWindow: 'ratio 0–1 : reps(mouvements,fenêtre courte)/reps(mêmes,fenêtre large)',
      globalShareOfParentWindow: 'ratio 0–1 : reps(total,courte)/reps(total,large)'
    },
    identityRegistry: {
      schema: 'momentum.identityRegistry.v1',
      phenomenonCount: new Set(Object.values(claimRegistry).map((c) => c.phenomenonClaimId)).size,
      assertionCount: Object.keys(claimRegistry).length,
      note: 'Chaque assertion porte period + fenêtre ; phenomenonClaimId relie les horizons'
    },
    programRegistry: programGraph
      ? {
          available: programGraph.available !== false,
          source: program ? 'snapshot_or_arg' : 'dossier_fallback',
          templateCount: programGraph.templateCount,
          families: programGraph.families,
          templates: programGraph.templates,
          relations: (programGraph.relations || []).slice(0, 80),
          note: 'Muscles = banque ; pas programCategory comme muscle'
        }
      : {
          available: false,
          reason: effectiveProgram ? 'graph_unavailable' : 'no_program_in_snapshot_or_dossiers',
          inEngineHint: sourceCoverage.sources.program.inEngine
        },
    sourceEvents: {
      schema: 'momentum.sourceEventsIndex.v1',
      note: 'Index léger — détails dans claim.proof.sourceEvents',
      eventIds: [
        ...new Set(
          Object.values(claimRegistry).flatMap((c) =>
            (c.proof?.sourceEvents || []).map((e) => e.id || e.date).filter(Boolean)
          )
        )
      ].slice(0, 500)
    },
    factRegistry,
    claimRegistry,
    cardRegistry,
    candidateRegistry,
    relations: allRelations.length ? allRelations : p6?.relations || [],
    dispositionsByPeriod: Object.keys(allDispositions).length
      ? allDispositions
      : insights?.publicationDispositions
        ? { [currentPeriod || 'current']: insights.publicationDispositions }
        : {},
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
      authority: insights?.publicationAuthority || null,
      note: 'Dispositions multi-horizons : dispositionsByPeriod'
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
    domEvidence: domVerify || { status: 'not_observed', note: 'Aucun DOM fourni à cet assemblage' },
    memoryEvidence: memorySummary || {
      status: 'not_passed_to_export',
      note: 'historyCount nul = souvent non fourni à l’export, pas forcément mémoire vide'
    },
    diagnostics: {
      proseAudit: auditInsightsProse(insights || {}),
      publicationCountGap: recon?.countGap ?? null,
      countsReconciled: recon?.countsReconciled ?? null,
      claimCollisionsAvoided: claimCollisionsAvoided.slice(0, 80),
      cardClaimDivergences: cardClaimDivergences.slice(0, 80),
      cardClaimDivergenceCount: cardClaimDivergences.length,
      multiWindowLegacyIds: [
        ...new Set(
          claimCollisionsAvoided
            .filter((c) => c.issue === 'multi_window_same_legacy_id_separated')
            .map((c) => c.legacyClaimId)
        )
      ]
    }
  };
}

export function validateAnalyticalAudit(doc) {
  const errors = [];
  const schemaOk =
    doc?.schema === 'momentum.analyticalAudit.v2' || doc?.schema === 'momentum.analyticalAudit.v1';
  if (!doc || !schemaOk) errors.push('schema_mismatch');
  if (!doc?.manifest?.edition) errors.push('missing_edition');
  if (!doc?.cardRegistry || typeof doc.cardRegistry !== 'object') errors.push('missing_cardRegistry');
  if (!doc?.claimRegistry || typeof doc.claimRegistry !== 'object') errors.push('missing_claimRegistry');

  Object.values(doc.cardRegistry || {}).forEach((card) => {
    if (!card.claimId) return;
    if (!doc.claimRegistry[card.claimId]) {
      errors.push(`orphan_card_claim:${card.id}->${card.claimId}`);
    } else {
      const check = validateCardClaimConsistency(card, doc.claimRegistry[card.claimId]);
      if (!check.ok) errors.push(`card_claim_divergence:${card.id}`);
    }
  });

  // Collision naïve : même legacyClaimId avec fenêtres différentes doit avoir des assertion ids distincts
  const byLegacy = new Map();
  Object.values(doc.claimRegistry || {}).forEach((claim) => {
    const leg = claim.legacyClaimId;
    if (!leg) return;
    if (!byLegacy.has(leg)) byLegacy.set(leg, []);
    byLegacy.get(leg).push(claim);
  });
  byLegacy.forEach((list, leg) => {
    const ends = new Set(list.map((c) => c.scope?.end || ''));
    if (ends.size > 1 && new Set(list.map((c) => c.id)).size < list.length) {
      errors.push(`claim_collision:${leg}`);
    }
  });

  return {
    ok: errors.length === 0,
    errors,
    counts: {
      cards: Object.keys(doc?.cardRegistry || {}).length,
      claims: Object.keys(doc?.claimRegistry || {}).length,
      candidates: Object.keys(doc?.candidateRegistry || {}).length,
      facts: Object.keys(doc?.factRegistry || {}).length,
      divergences: doc?.diagnostics?.cardClaimDivergenceCount ?? 0
    }
  };
}
