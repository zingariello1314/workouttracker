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
  const m = card.metrics || null;
  const sharedFactIds = Array.isArray(m?.sharedFacts)
    ? m.sharedFacts.map((f) => (typeof f === 'string' ? f : f?.id)).filter(Boolean).slice(0, 40)
    : [];
  const contributionSlim = Array.isArray(m?.contributionRegistry)
    ? m.contributionRegistry.slice(0, 12).map((c) => ({
        familyId: c.familyId || null,
        familyName: c.familyName || null,
        volumeDelta: c.volumeDelta ?? null,
        freqEffect: c.freqEffect ?? null,
        contentEffect: c.contentEffect ?? null,
        residual: c.residual ?? null,
        previousVolume: c.previousVolume ?? null,
        recentVolume: c.recentVolume ?? null,
        previousDays: c.previousDays ?? null,
        recentDays: c.recentDays ?? null,
        confidence: c.confidence ?? null,
        evolution: c.evolution || null
      }))
    : null;
  const factPackSlim = (() => {
    const raw = m?.factRegistry?.facts || (Array.isArray(m?.factRegistry) ? m.factRegistry : null);
    if (!Array.isArray(raw) || !raw.length) return null;
    return {
      schema: m?.factRegistry?.schema || 'momentum.analyticalFacts.v1',
      facts: raw.slice(0, 40).map((f) => ({
        id: f.id || null,
        subject: f.subject || null,
        metric: f.metric || null,
        value: f.value ?? null,
        unit: f.unit || null,
        populationId: f.populationId || null,
        window: f.window || null,
        method: f.method || null,
        definitionVersion: f.definitionVersion || null,
        kind: f.kind || null
      }))
    };
  })();
  const memorySlim = m?.memory
    ? {
        state: m.memory.state || null,
        previousState: m.memory.previousState ?? null,
        transition: m.memory.transition || null,
        knownAt: m.memory.knownAt || null,
        knowledgeCutoff: m.memory.knowledgeCutoff || null,
        publicationDecision: m.memory.publicationDecision || null,
        exposureCounted: m.memory.exposureCounted === true,
        previousConclusion: m.memory.previousConclusion || null
      }
    : null;
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
    // Mission 24 — parentId seulement si lien justifié (évite anomalies unverified)
    hierarchyLink: card.hierarchyLink || m?.hierarchyLink || null,
    parentId: (() => {
      const link = card.hierarchyLink || m?.hierarchyLink || null;
      if (link?.ok === true) return card.parentId || card.collapsedInto || null;
      return card.parentId && link?.ok === true ? card.parentId : null;
    })(),
    childIds: card.childIds || card.hierarchyChildren || null,
    phenomenonId:
      card.phenomenonId || m?.phenomenonId || m?.episodeId || claim?.phenomenonId || null,
    /** Référence à l’assertion contextualisée (pas seulement l’id phénomène) */
    claimId: claimRef || claim?.id || null,
    phenomenonClaimId: claim ? phenomenonClaimId(claim, card) : null,
    population: claim?.population || m?.populationLabel || null,
    limitations: claim?.limitations || card.limitations || null,
    observedValues: claim?.proof?.observedValues || m?.observedValues || null,
    sharedFacts: sharedFactIds.length ? sharedFactIds : null,
    memory: memorySlim,
    metrics: m
      ? {
          windowMeanPerSession: m.windowMeanPerSession ?? null,
          arcEarlyMean: m.arcEarlyMean ?? null,
          arcLateMean: m.arcLateMean ?? null,
          windowStart: m.windowStart ?? m.window?.start ?? null,
          windowEnd: m.windowEnd ?? m.window?.end ?? null,
          totalReps: m.totalReps ?? null,
          relativeConcentration: m.relativeConcentration ?? null,
          exerciseId: m.exerciseId ?? null,
          exerciseName: m.exerciseName || m.name || null,
          name: m.name || m.exerciseName || null,
          date: m.date || m.returnDate || m.peakDate || null,
          returnDate: m.returnDate || m.gapAfter || null,
          peakDate: m.peakDate || null,
          dates: Array.isArray(m.dates) ? m.dates.slice(0, 8) : null,
          confirmationDates: Array.isArray(m.confirmationDates)
            ? m.confirmationDates.slice(0, 8)
            : null,
          gapDays: m.gapDays ?? m.daysAbsent ?? null,
          mechanism: m.mechanism || null,
          thesis: m.thesis || null,
          composition: m.composition || null,
          population: m.population || m.populationLabel || null,
          prevReps: m.prevReps ?? m.priorAvg ?? null,
          currentReps: m.currentReps ?? m.lastReps ?? null,
          episodeId: m.episodeId || null,
          phenomenonId: m.phenomenonId || m.episodeId || null,
          conclusionScope: m.conclusionScope || null,
          coverageComparability: m.coverageComparability || null,
          contributionRegistry: contributionSlim,
          sharedFacts: sharedFactIds.length ? sharedFactIds : null,
          factRegistry: factPackSlim,
          memory: memorySlim,
          producer: m.producer || null,
          narrativeAuthority: m.narrativeAuthority || null,
          readingMode: m.readingMode || null,
          selectionMarginal:
            card.marginal || m.publicationDecision || memorySlim?.publicationDecision || null
        }
      : null,
    selectionReason:
      card.reason ||
      card.marginal ||
      memorySlim?.publicationDecision?.reason ||
      m?.memory?.publicationDecision?.reason ||
      null,
    rival: card._blockedBy || m?.rivalDominant || null
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
  const fingerprint = snapshot
    ? snapshotFingerprint(snapshot, { activeProgram: activeProgram || null })
    : null;

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
      // Mission 21 — statut unifié : le sous-statut final fait autorité s’il existe.
      reconciledStrict:
        finalRecon?.reconciledStrict != null
          ? finalRecon.reconciledStrict
          : pubRecon?.reconciledStrict ?? null,
      publicationAuthority: dossier?.publicationAuthority || null,
      publicationFallback: dossier?.publicationFallback === true || dossier?.publicationAuthority === 'legacy_fallback',
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

  // Faits : (1) extraction numérique depuis observedValues (2) faits partagés migrés (M21+)
  const factRegistry = {};
  const registerFact = (fact, cardKey) => {
    if (!fact) return;
    const fid =
      fact.id ||
      [
        fact.subjectKey || fact.subject,
        fact.metricId || fact.metric,
        fact.population || fact.populationId,
        fact.windowStart || fact.window?.start,
        fact.windowEnd || fact.window?.end,
        fact.method,
        fact.episode || ''
      ].join('|');
    if (!fid || fid === '|||||||') return;
    if (!factRegistry[fid]) {
      factRegistry[fid] = {
        ...fact,
        id: fid,
        cardRefs: cardKey ? [cardKey] : []
      };
      return;
    }
    const existing = factRegistry[fid];
    const a = Number(existing.value);
    const b = Number(fact.value);
    if (
      Number.isFinite(a) &&
      Number.isFinite(b) &&
      Math.abs(a - b) > Math.abs(a) * 0.001 + 0.5
    ) {
      const splitId = `${fid}|v:${b}`;
      if (!factRegistry[splitId]) {
        factRegistry[splitId] = {
          ...fact,
          id: splitId,
          cardRefs: cardKey ? [cardKey] : [],
          collisionWith: fid
        };
      }
    } else if (cardKey && !existing.cardRefs.includes(cardKey)) {
      existing.cardRefs.push(cardKey);
    }
  };

  Object.entries(cardRegistry).forEach(([cardKey, card]) => {
    const extracted = extractAtomicFactsFromCards([card], {
      period: card.period,
      window: { start: card.metrics?.windowStart, end: card.metrics?.windowEnd }
    });
    (extracted.facts || []).forEach((fact) => registerFact(fact, cardKey));

    // Mission 22 — ne pas perdre les faits partagés déjà calculés sur le chemin produit
    const pack = card.metrics?.factRegistry || null;
    const packFacts = pack?.facts || (Array.isArray(pack) ? pack : []);
    packFacts.forEach((f) => registerFact(f, cardKey));
    (card.sharedFacts || card.metrics?.sharedFacts || []).forEach((ref) => {
      if (typeof ref === 'string') {
        if (!factRegistry[ref]) {
          factRegistry[ref] = { id: ref, cardRefs: [cardKey], status: 'reference_only' };
        } else if (!factRegistry[ref].cardRefs.includes(cardKey)) {
          factRegistry[ref].cardRefs.push(cardKey);
        }
      } else if (ref && typeof ref === 'object') {
        registerFact(ref, cardKey);
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
    memoryEvidence: (() => {
      if (memorySummary && memorySummary.status !== 'not_passed_to_export') {
        return memorySummary;
      }
      // Mission 22 — si l’appelant omet memorySummary, dériver un résumé des cartes
      const cardMemories = Object.values(cardRegistry)
        .map((c) => c.memory)
        .filter(Boolean);
      if (cardMemories.length) {
        return {
          status: 'derived_from_cards',
          cardMemoryCount: cardMemories.length,
          states: [...new Set(cardMemories.map((m) => m.state).filter(Boolean))],
          transitions: [...new Set(cardMemories.map((m) => m.transition).filter(Boolean))],
          exposureCountedAny: cardMemories.some((m) => m.exposureCounted === true),
          note: 'Résumé dérivé des métriques mémoire des cartes ; profil localStorage non injecté'
        };
      }
      return (
        memorySummary || {
          status: 'not_passed_to_export',
          note: 'Aucun memorySummary ni mémoire carte — pas forcément mémoire vide côté UI'
        }
      );
    })(),
    diagnostics: {
      proseAudit: auditInsightsProse(insights || {}),
      publicationCountGap: recon?.countGap ?? null,
      // Mission 23 — aligné sur reconciledStrict (finalCatalog), pas l’ancien booléen MD
      countsReconciled:
        recon?.reconciledStrict != null
          ? recon.reconciledStrict
          : recon?.countsReconciled ?? null,
      reconciledStrictAuthority: 'finalCatalogReconciliation.reconciledStrict',
      claimCollisionsAvoided: claimCollisionsAvoided.slice(0, 80),
      cardClaimDivergences: cardClaimDivergences.slice(0, 80),
      cardClaimDivergenceCount: cardClaimDivergences.length,
      multiWindowLegacyIds: [
        ...new Set(
          claimCollisionsAvoided
            .filter((c) => c.issue === 'multi_window_same_legacy_id_separated')
            .map((c) => c.legacyClaimId)
        )
      ],
      observability: {
        companionTrace: 'ANALYTICAL_REASONING_TRACE.json',
        inspectorSerializer: 'serializeConclusion',
        note: 'L’audit reste le registre normalisé ; la trace porte le raisonnement et les modules exécutés'
      }
    }
  };
}

/**
 * Validation syntaxique JSON ≠ intégrité analytique.
 * Mission 25 — un audit peut être schema-ok et integrity-ko (ex. régression v23).
 */
export function validateAnalyticalAudit(doc) {
  const schemaErrors = [];
  const integrityErrors = [];
  const schemaOk =
    doc?.schema === 'momentum.analyticalAudit.v2' || doc?.schema === 'momentum.analyticalAudit.v1';
  if (!doc || !schemaOk) schemaErrors.push('schema_mismatch');
  if (!doc?.manifest?.edition) schemaErrors.push('missing_edition');
  if (!doc?.cardRegistry || typeof doc.cardRegistry !== 'object') schemaErrors.push('missing_cardRegistry');
  if (!doc?.claimRegistry || typeof doc.claimRegistry !== 'object') schemaErrors.push('missing_claimRegistry');

  const cards = Object.values(doc?.cardRegistry || {});
  const claims = doc?.claimRegistry || {};
  const facts = doc?.factRegistry || {};
  const periods = doc?.periods || {};

  Object.values(cards).forEach((card) => {
    if (!card.claimId) return;
    if (!claims[card.claimId]) {
      integrityErrors.push(`orphan_card_claim:${card.id}->${card.claimId}`);
    } else {
      const check = validateCardClaimConsistency(card, claims[card.claimId]);
      if (!check.ok) integrityErrors.push(`card_claim_divergence:${card.id}`);
    }
  });

  // Collision naïve : même legacyClaimId avec fenêtres différentes doit avoir des assertion ids distincts
  const byLegacy = new Map();
  Object.values(claims).forEach((claim) => {
    const leg = claim.legacyClaimId;
    if (!leg) return;
    if (!byLegacy.has(leg)) byLegacy.set(leg, []);
    byLegacy.get(leg).push(claim);
  });
  byLegacy.forEach((list, leg) => {
    const ends = new Set(list.map((c) => c.scope?.end || ''));
    if (ends.size > 1 && new Set(list.map((c) => c.id)).size < list.length) {
      integrityErrors.push(`claim_collision:${leg}`);
    }
  });

  // --- Invariants d’intégrité analytique (Mission 25) ---
  const publishedRoles = new Set(['priority', 'reserve', 'deepening']);
  let publishedWithoutClaim = 0;
  cards.forEach((card) => {
    if (!publishedRoles.has(card.role) && card.role !== 'priority' && card.role !== 'reserve') {
      // roles audit : priority | reserve
    }
    if (card.role === 'priority' || card.role === 'reserve') {
      if (!card.claimId || !claims[card.claimId]) {
        publishedWithoutClaim += 1;
        integrityErrors.push(`published_card_missing_claim:${card.period}|${card.id}`);
      } else {
        const claim = claims[card.claimId];
        if (card.period && claim.period && card.period !== claim.period) {
          integrityErrors.push(`claim_period_mismatch:${card.id}`);
        }
      }
      if (card.parentId && card.hierarchyLink?.ok !== true) {
        integrityErrors.push(`parent_without_verified_link:${card.id}`);
      }
      if (card.collapsedInto) {
        const destKey = `${card.period || 'unscoped'}|${card.collapsedInto}`;
        const destAlt = Object.keys(doc.cardRegistry || {}).find(
          (k) => k.endsWith(`|${card.collapsedInto}`) || doc.cardRegistry[k]?.id === card.collapsedInto
        );
        if (!doc.cardRegistry?.[destKey] && !destAlt) {
          // destination peut être hors accessible (source_retained) — exiger au moins une trace
          const hasDisp = Object.values(doc.dispositions || {}).some((list) =>
            (list || []).some(
              (d) =>
                d?.collapsedInto === card.collapsedInto ||
                d?.id === card.collapsedInto ||
                d?.into === card.collapsedInto
            )
          );
          if (!hasDisp && card.disposition !== 'deepening_of_collective') {
            integrityErrors.push(`absorbed_without_destination:${card.id}->${card.collapsedInto}`);
          }
        }
      }
      (card.sharedFacts || []).forEach((fid) => {
        if (!facts[fid]) integrityErrors.push(`missing_fact:${card.id}->${fid}`);
      });
    }
  });

  Object.entries(periods).forEach(([period, meta]) => {
    (meta?.cardRefs || []).forEach((ref) => {
      if (!doc.cardRegistry?.[ref]) {
        integrityErrors.push(`dangling_card_ref:${period}->${ref}`);
      }
    });
    if (meta?.publicationFallback === true || meta?.publicationAuthority === 'legacy_fallback') {
      integrityErrors.push(`degraded_publication_authority:${period}`);
    }
    if (meta?.reconciledStrict === true) {
      if (meta.publicationCount == null && meta.registryCount == null) {
        integrityErrors.push(`reconciled_strict_without_counts:${period}`);
      }
    }
    // Priorités déclarées vs cardRefs rôle priority
    const prioCards = cards.filter((c) => c.period === period && c.role === 'priority');
    if (
      meta?.accessibleCount != null &&
      meta.cardRefs?.length != null &&
      meta.cardRefs.length > 0 &&
      prioCards.length === 0 &&
      meta.accessibleCount > 0
    ) {
      integrityErrors.push(`priority_cardinality_opaque:${period}`);
    }
  });

  // Mission 27 — invariants du graphe final
  const byPeriodId = new Map();
  cards.forEach((card) => {
    const key = `${card.period || 'unscoped'}|${card.id}`;
    byPeriodId.set(key, card);
    if (card.id) byPeriodId.set(`${card.period || 'unscoped'}|id:${card.id}`, card);
  });
  cards.forEach((card) => {
    if (card.collapsedInto && card.collapsedInto === card.id) {
      integrityErrors.push(`self_fusion:${card.period}|${card.id}`);
    }
    if (card.parentId && card.parentId === card.id) {
      integrityErrors.push(`self_parent:${card.period}|${card.id}`);
    }
    if (
      (card.role === 'priority' || card.role === 'reserve') &&
      card.parentId &&
      card.hierarchyLink?.ok === true
    ) {
      const parentKey = `${card.period || 'unscoped'}|${card.parentId}`;
      const parentAlt = cards.find(
        (c) => c.period === card.period && (c.id === card.parentId || c.publicationId === card.parentId)
      );
      if (!doc.cardRegistry?.[parentKey] && !parentAlt) {
        integrityErrors.push(`orphan_parent:${card.period}|${card.id}->${card.parentId}`);
      }
    }
    if (Array.isArray(card.childIds) && card.childIds.includes(card.id)) {
      integrityErrors.push(`self_child:${card.period}|${card.id}`);
    }
  });
  // Cycles parent simples (A→B→A)
  cards.forEach((card) => {
    if (!card.parentId) return;
    const parent = cards.find((c) => c.period === card.period && c.id === card.parentId);
    if (parent?.parentId && parent.parentId === card.id) {
      integrityErrors.push(`hierarchy_cycle:${card.period}|${card.id}<->${parent.id}`);
    }
  });

  // Contre-exemple v23 : beaucoup de cartes publiées, quasi aucun claim
  if (cards.length >= 50 && Object.keys(claims).length > 0) {
    const claimRatio = Object.keys(claims).length / Math.max(1, cards.length);
    if (claimRatio < 0.2 || publishedWithoutClaim > cards.length * 0.5) {
      integrityErrors.push('mass_claim_loss');
    }
  } else if (cards.length >= 50 && Object.keys(claims).length === 0) {
    integrityErrors.push('mass_claim_loss');
  } else if (publishedWithoutClaim >= 10) {
    integrityErrors.push('mass_claim_loss');
  }

  // Cap erreurs pour lisibilité
  const uniqueIntegrity = [...new Set(integrityErrors)].slice(0, 80);
  const uniqueSchema = [...new Set(schemaErrors)];
  const allErrors = [...uniqueSchema, ...uniqueIntegrity];

  return {
    ok: allErrors.length === 0,
    schemaValidation: { ok: uniqueSchema.length === 0, errors: uniqueSchema },
    integrityValidation: { ok: uniqueIntegrity.length === 0, errors: uniqueIntegrity },
    errors: allErrors,
    counts: {
      cards: Object.keys(doc?.cardRegistry || {}).length,
      claims: Object.keys(doc?.claimRegistry || {}).length,
      candidates: Object.keys(doc?.candidateRegistry || {}).length,
      facts: Object.keys(doc?.factRegistry || {}).length,
      divergences: doc?.diagnostics?.cardClaimDivergenceCount ?? 0,
      publishedWithoutClaim
    }
  };
}
