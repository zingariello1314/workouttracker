import { emptyGameCReport } from './evaluationTypes';
import { reconcilePublicationIds, stablePublicationId } from '../p6Publication';

/**
 * Jeu C — qualité collective et publication.
 * Compare identifiants et filiations, pas seulement des totaux.
 */

function textKey(card) {
  return `${String(card?.title || '')
    .toLowerCase()
    .trim()}|${String(card?.body || '')
    .toLowerCase()
    .slice(0, 80)}`;
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
  const report = emptyGameCReport();
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
      if (card?.p6Disposition === 'source_retained' || card?.collapsedInto) {
        report.fusedSourcesAccessible += 1;
      }
    });
    seenText.forEach((count) => {
      if (count > 1) report.exactDuplicatesAccessible += count - 1;
    });

    const p6pack = pack.p6;
    if (p6pack?.counters?.reconciled) {
      const registry = [...(p6pack.priority || []), ...(p6pack.reserve || [])];
      const registryIds = registry.map((row) => stablePublicationId(row));
      const publishedIds = accessible.map((card) => card.id || stablePublicationId(card));
      const dispositions = pack.insights?.publicationDispositions || [];
      const idRecon = reconcilePublicationIds({
        registryIds,
        publishedIds,
        dispositions
      });
      // Comptage par identifiants uniques — pas par longueur de tableau.
      // exact_duplicate_suppressed d’un id déjà publié n’explique PAS un écart
      // d’unicité : seuls les ids absents du catalogue accessible doivent l’être.
      const registryUnique = [...new Set(registryIds.filter(Boolean))];
      const publishedSet = new Set(publishedIds.filter(Boolean));
      const explainedUnpublished = registryUnique.filter((id) => {
        if (publishedSet.has(id)) return false;
        return dispositions.some(
          (d) => d.id === id && d.disposition && d.disposition !== 'published'
        );
      });
      const unexplained = registryUnique.filter((id) => {
        if (publishedSet.has(id)) return false;
        return !dispositions.some(
          (d) => d.id === id && d.disposition && d.disposition !== 'published'
        );
      });
      const admissiblePreserved =
        idRecon.lostSilent.length === 0 &&
        unexplained.length === 0 &&
        report.fusedSourcesAccessible === 0;

      if (!admissiblePreserved) report.admissiblePreserved = false;

      report.cases.push({
        period: pack.period || 'live',
        expectedAccessible: registryUnique.length,
        publishedAccessible: publishedSet.size,
        registryRows: registry.length,
        lostSilent: idRecon.lostSilent,
        explainedGap: explainedUnpublished.length,
        unexplainedIds: unexplained,
        publicationAuthority: pack.insights?.publicationAuthority || null,
        idReconciled: idRecon.reconciled,
        admissiblePreserved
      });
    }

    // Dominance excessive d'une même famille en priorité
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
  });

  report.pass =
    report.exactDuplicatesAccessible === 0 &&
    report.fusedSourcesAccessible === 0 &&
    report.admissiblePreserved !== false &&
    report.horizonConfusion === 0 &&
    report.cases.every((c) => c.admissiblePreserved !== false && c.issue !== 'family_monopoly');

  return report;
}
