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
      const publishedIds = accessible.map((card) => card.id || stablePublicationId(card));
      const dispositions = pack.insights?.publicationDispositions || [];
      const idRecon = reconcilePublicationIds({
        registryIds: registry.map((row) => stablePublicationId(row)),
        publishedIds,
        dispositions
      });
      const expected = registry.length;
      const published = accessible.length;
      const explainedIds = new Set(
        dispositions.filter((d) => d.disposition && d.disposition !== 'published').map((d) => d.id)
      );
      const explainedGap = explainedIds.size;
      const gap = expected - published;
      // Perte silencieuse = échec. L'écart attendu doit être entièrement expliqué.
      const admissiblePreserved =
        idRecon.lostSilent.length === 0 &&
        gap === explainedGap &&
        published + explainedGap === expected &&
        report.fusedSourcesAccessible === 0;

      if (!admissiblePreserved) report.admissiblePreserved = false;

      report.cases.push({
        period: pack.period || 'live',
        expectedAccessible: expected,
        publishedAccessible: published,
        lostSilent: idRecon.lostSilent,
        explainedGap,
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
