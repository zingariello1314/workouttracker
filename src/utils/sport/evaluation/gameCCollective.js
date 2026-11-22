import { emptyGameCReport } from './evaluationTypes';
import { reconcilePublicationIds, stablePublicationId } from '../p6Publication';
import { detectorKind, substantiveEquivalence } from '../discoveryIdentity';

/**
 * Jeu C — qualité collective et publication (Mission 7).
 * Distingue explicitement :
 * - doublons textuels exacts
 * - équivalences sémantiques (évaluateur indépendant)
 * - collisions techniques / filiations
 * - ids inexpliqués (réconciliation)
 * Ne compte PAS chaque paire sémantique comme un doublon textuel.
 */

function textKey(card) {
  return `${String(card?.title || '')
    .toLowerCase()
    .trim()}|${String(card?.body || '')
    .toLowerCase()
    .slice(0, 120)}`;
}

function accessibleCards(insights) {
  return [
    ...(insights?.shortTerm || []),
    ...(insights?.mediumTerm || []),
    ...(insights?.longTerm || []),
    ...(insights?.accessibleReserve || [])
  ];
}

export function runGameCCollective({ insights = null, p6 = null, periodPacks = null } = {}) {
  const report = {
    ...emptyGameCReport(),
    textualDuplicatesAccessible: 0,
    semanticEquivalentsAccessible: 0,
    technicalCollisionLosses: 0,
    suppressionWithoutProof: 0,
    fusionWithoutDestination: 0,
    unexplainedRegistryIds: 0,
    evaluatorNotes: []
  };

  const packs =
    Array.isArray(periodPacks) && periodPacks.length
      ? periodPacks
      : [{ period: 'live', insights, p6 }];

  packs.forEach((pack) => {
    const accessible = accessibleCards(pack.insights);
    const seenText = new Map();
    accessible.forEach((card) => {
      const key = textKey(card);
      seenText.set(key, (seenText.get(key) || 0) + 1);
      // Une source fusionnée ne doit pas figurer dans le catalogue accessible
      if (
        card?.p6Disposition === 'source_retained' ||
        (card?.collapsedInto && card?.p6Disposition !== 'published' && card?.disposition !== 'priority')
      ) {
        // Ne compter que si la carte est clairement une source, pas un survivant annoté
        if (card?.p6Disposition === 'source_retained') {
          report.fusedSourcesAccessible += 1;
        }
      }
    });
    let textualDup = 0;
    seenText.forEach((count) => {
      if (count > 1) textualDup += count - 1;
    });
    report.textualDuplicatesAccessible += textualDup;
    // Compat : exactDuplicatesAccessible = doublons TEXTUELS uniquement
    report.exactDuplicatesAccessible += textualDup;

    const p6pack = pack.p6;
    if (p6pack?.counters?.reconciled) {
      const registry = [...(p6pack.priority || []), ...(p6pack.reserve || [])];
      const registryIds = registry.map((row) => stablePublicationId(row));
      const publishedIds = accessible.map((card) => stablePublicationId(card));
      const dispositions = pack.insights?.publicationDispositions || [];
      const idRecon = reconcilePublicationIds({
        registryIds,
        publishedIds,
        dispositions
      });
      const registryUnique = [...new Set(registryIds.filter(Boolean))];
      const publishedSet = new Set(publishedIds.filter(Boolean));
      // unexplained = lostSilent (même critère multi-alias) — pas un second matcher plus strict
      const unexplained = idRecon.lostSilent;
      report.unexplainedRegistryIds += unexplained.length;

      // Annoter chaque anomalie : vraiment perdu vs alias de disposition
      const anomalyAudit = unexplained.map((id) => ({
        id,
        status: 'unexplained_after_alias_match',
        note: 'Aucune disposition (id/occurrence/phénomène/filiation) ne couvre cet identifiant'
      }));

      const admissiblePreserved =
        idRecon.lostSilent.length === 0 && report.fusedSourcesAccessible === 0;

      if (!admissiblePreserved) report.admissiblePreserved = false;

      report.cases.push({
        period: pack.period || 'live',
        expectedAccessible: registryUnique.length,
        publishedAccessible: publishedSet.size,
        registryRows: registry.length,
        lostSilent: idRecon.lostSilent,
        unexplainedIds: unexplained,
        unexplainedCount: unexplained.length,
        anomalyAudit,
        textualDuplicates: textualDup,
        publicationAuthority: pack.insights?.publicationAuthority || null,
        idReconciled: idRecon.reconciled,
        admissiblePreserved,
        note:
          unexplained.length > 0
            ? 'ids registre absents du publié sans disposition multi-alias'
            : null
      });
    }

    const priority = [
      ...(pack.insights?.shortTerm || []),
      ...(pack.insights?.mediumTerm || []),
      ...(pack.insights?.longTerm || [])
    ];
    const familyCounts = new Map();
    priority.forEach((card) => {
      const fam = card.family || card.analyticalCategory || 'other';
      familyCounts.set(fam, (familyCounts.get(fam) || 0) + 1);
    });
    familyCounts.forEach((count, fam) => {
      if (priority.length >= 6 && count / priority.length >= 0.7) {
        report.horizonConfusion += 1;
        report.cases.push({
          period: pack.period || 'live',
          issue: 'family_monopoly',
          family: fam,
          share: count / priority.length
        });
      }
    });

    const dispositions = pack.insights?.publicationDispositions || [];

    // Collision technique : ≥3 occurrences distinctes d’un détecteur, suppressions sans preuve
    const detectorCollisions = new Map();
    (pack.p6?.priority || []).forEach((row) => {
      const det = detectorKind(row);
      const pubId = stablePublicationId(row);
      if (!detectorCollisions.has(det)) detectorCollisions.set(det, new Set());
      detectorCollisions.get(det).add(pubId);
    });
    detectorCollisions.forEach((ids, det) => {
      if (ids.size < 3) return;
      const publishedForDet = accessible.filter((c) => detectorKind(c) === det);
      const bad = dispositions.filter(
        (d) =>
          d.detectorKind === det &&
          (d.disposition === 'exact_duplicate_suppressed' ||
            d.disposition === 'semantic_equivalent_suppressed') &&
          !d.equivalence?.proof &&
          !d.collapsedInto
      );
      if (publishedForDet.length < ids.size && bad.length) {
        report.technicalCollisionLosses += 1;
        report.admissiblePreserved = false;
        report.cases.push({
          period: pack.period || 'live',
          issue: 'technical_collision_loss',
          detector: det,
          distinctOccurrences: ids.size,
          published: publishedForDet.length
        });
      }
    });

    dispositions.forEach((d) => {
      if (
        (d.disposition === 'exact_duplicate_suppressed' ||
          d.disposition === 'semantic_equivalent_suppressed') &&
        !d.collapsedInto &&
        !d.equivalence?.proof &&
        !d.equivalence?.reason
      ) {
        report.suppressionWithoutProof += 1;
        report.admissiblePreserved = false;
        report.cases.push({
          period: pack.period || 'live',
          issue: 'suppression_without_equivalence_proof',
          id: d.id,
          disposition: d.disposition
        });
      }
      if (
        (d.disposition === 'source_retained' || d.disposition === 'semantic_equivalent_suppressed') &&
        !d.collapsedInto &&
        !(d.fusionLineage?.survivorId || d.fusionLineage?.sources?.length)
      ) {
        report.fusionWithoutDestination += 1;
        report.admissiblePreserved = false;
        report.cases.push({
          period: pack.period || 'live',
          issue: 'fusion_without_sources',
          id: d.id
        });
      }
    });

    // Équivalences sémantiques encore accessibles (compteur SÉPARÉ, pas ajouté aux textuels)
    const semanticPairs = [];
    for (let i = 0; i < accessible.length; i += 1) {
      for (let j = i + 1; j < accessible.length; j += 1) {
        const eq = substantiveEquivalence(accessible[i], accessible[j]);
        if (eq.equivalent) {
          semanticPairs.push({
            left: accessible[i].id,
            right: accessible[j].id,
            reason: eq.reason
          });
        }
      }
    }
    if (semanticPairs.length) {
      report.semanticEquivalentsAccessible += semanticPairs.length;
      report.cases.push({
        period: pack.period || 'live',
        issue: 'semantic_duplicates_still_accessible',
        pairCount: semanticPairs.length,
        sample: semanticPairs.slice(0, 5)
      });
      // Échec qualité collective, mais distinct des doublons textuels
      report.pass = false;
    }

    // Multi-détecteurs / même texte
    const textGroups = new Map();
    accessible.forEach((card) => {
      const key = textKey(card);
      if (!textGroups.has(key)) textGroups.set(key, []);
      textGroups.get(key).push(card);
    });
    textGroups.forEach((cards, key) => {
      if (cards.length < 2) return;
      const kinds = new Set(cards.map((c) => detectorKind(c)));
      if (kinds.size >= 2) {
        report.cases.push({
          period: pack.period || 'live',
          issue: 'multi_detector_same_text',
          count: cards.length,
          detectors: [...kinds],
          sample: key.slice(0, 60)
        });
      }
    });

    // Mission 14 : validité sémantique des dispositions (pas seulement leur existence)
    let unjustifiedDeepenings = 0;
    let deepeningInaccessible = 0;
    dispositions.forEach((d) => {
      if (
        d.disposition === 'source_retained' &&
        /deepening_of_collective|individual_load_under_phase|individual_return/i.test(
          String(d.reason || '')
        )
      ) {
        unjustifiedDeepenings += 1;
        report.admissiblePreserved = false;
        report.cases.push({
          period: pack.period || 'live',
          issue: 'unjustified_deepening_or_absorption',
          id: d.id,
          disposition: d.disposition,
          reason: d.reason
        });
      }
      if (
        d.disposition === 'deepening_accessible' ||
        (d.disposition === 'deepening_of_collective' && d.reason === 'verified_parent_child')
      ) {
        const stillAccessible = accessible.some(
          (c) => stablePublicationId(c) === d.id || c.id === d.id
        );
        if (!stillAccessible && d.collapsedInto) {
          const parentPublished = accessible.some(
            (c) => c.id === d.collapsedInto || stablePublicationId(c) === d.collapsedInto
          );
          if (parentPublished) {
            deepeningInaccessible += 1;
            report.cases.push({
              period: pack.period || 'live',
              issue: 'deepening_declared_but_not_accessible',
              id: d.id,
              parentId: d.collapsedInto
            });
          }
        }
      }
    });
    const absorbByParent = new Map();
    dispositions.forEach((d) => {
      if (
        d.collapsedInto &&
        (d.disposition === 'source_retained' || d.disposition === 'deepening_of_collective')
      ) {
        absorbByParent.set(d.collapsedInto, (absorbByParent.get(d.collapsedInto) || 0) + 1);
      }
    });
    absorbByParent.forEach((count, parentId) => {
      if (count < 8) return;
      const withProof = dispositions.filter(
        (d) =>
          d.collapsedInto === parentId &&
          (d.equivalence?.proof ||
            d.equivalence?.reason === 'verified_parent_child' ||
            d.reason === 'verified_parent_child')
      ).length;
      if (withProof < Math.ceil(count * 0.5)) {
        report.admissiblePreserved = false;
        report.cases.push({
          period: pack.period || 'live',
          issue: 'parent_absorbs_many_without_proofs',
          parentId,
          absorbedCount: count,
          withProof
        });
      }
    });
    report.unjustifiedDeepenings = (report.unjustifiedDeepenings || 0) + unjustifiedDeepenings;
    report.deepeningInaccessible = (report.deepeningInaccessible || 0) + deepeningInaccessible;
  });

  const hardFail =
    report.textualDuplicatesAccessible > 0 ||
    report.fusedSourcesAccessible > 0 ||
    report.admissiblePreserved === false ||
    report.technicalCollisionLosses > 0 ||
    report.suppressionWithoutProof > 0 ||
    report.fusionWithoutDestination > 0 ||
    report.horizonConfusion > 0 ||
    report.semanticEquivalentsAccessible > 0 ||
    (report.unjustifiedDeepenings || 0) > 0 ||
    (report.deepeningInaccessible || 0) > 0;

  report.pass = !hardFail;
  report.evaluatorNotes.push(
    'exactDuplicatesAccessible = doublons textuels uniquement ; semanticEquivalentsAccessible est séparé'
  );
  report.evaluatorNotes.push(
    'Mission 14 : dispositions deepening/absorption validées sémantiquement (sujet/épisode/preuve)'
  );

  return report;
}
