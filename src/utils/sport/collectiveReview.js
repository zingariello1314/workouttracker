/**
 * Quatrième passe P6 — examen collectif du paquet.
 * Déterministe, coût borné (une passe, éventuellement une réexploration ciblée).
 * Mission 6 : équivalence substantielle + réexploration quand défauts réels détectés.
 */

import { analyticalCategory, ANALYTICAL_CATEGORY } from './horizonPublicationPolicy';
import { relateClaims, RELATION } from './narrativeCoherenceEngine';
import { exploreCollectiveReturn, exploreDiscovery } from './analyticalExploration';
import {
  buildFusionLineage,
  detectorKind,
  stablePublicationId,
  substantiveEquivalence
} from './discoveryIdentity';
import { justifyParentChildLink } from './hierarchyLink';

const MAX_TARGETED_REEXPLORES = 3;

function textKey(row) {
  return `${String(row?.discovery?.title || row?.title || '')
    .toLowerCase()
    .trim()}|${String(row?.discovery?.kind || row?.kind || '')}`;
}

function sleepLike(row) {
  const cat = analyticalCategory(row?.discovery || row);
  return cat === ANALYTICAL_CATEGORY.SLEEP || String(row?.discovery?.kind || row?.kind || '').includes('sleep');
}

function weakEvidence(row) {
  const claim = row?.claim;
  if (!claim) return true;
  const assertions = claim.assertions || [];
  const hasValues = assertions.some(
    (a) => a?.value != null || (Array.isArray(a?.observedValues) && a.observedValues.length)
  );
  const hasEvidence = (claim.evidenceIds || []).length > 0 || (claim.proof?.sourceEvents || []).length > 0;
  const documentary = claim.proof?.documentary || (claim.limitations || []).includes('non_numeric_documentary_proof');
  if (documentary && hasEvidence) return false;
  return !hasValues && !hasEvidence;
}

function eventDatesOf(row) {
  const m = row?.discovery?.metrics || row?.metrics || {};
  const dates = new Set();
  if (Array.isArray(m.dates)) m.dates.forEach((d) => dates.add(String(d)));
  else if (typeof m.dates === 'string' && m.dates) dates.add(m.dates);
  if (Array.isArray(m.days)) m.days.forEach((d) => d?.date && dates.add(String(d.date)));
  if (m.date) dates.add(String(m.date));
  if (m.eventDate) dates.add(String(m.eventDate));
  (row?.claim?.proof?.sourceEvents || []).forEach(
    (e) => e?.id && /^\d{4}-\d{2}-\d{2}/.test(e.id) && dates.add(e.id.slice(0, 10))
  );
  return dates;
}

function isWeakConcentration(row) {
  const kind = String(row?.discovery?.kind || '');
  if (!/th_concentration|volume_shape|peak/i.test(kind)) return false;
  const m = row?.discovery?.metrics || {};
  const share = Number(m.sharePct);
  const nearPeak = Number(m.nearPeakCount);
  if (Number.isFinite(nearPeak) && nearPeak >= 2) return true;
  if (Number.isFinite(share) && share < 40) return true;
  return false;
}

/** Mission 7 — occasions où une 4e passe peut approfondir au-delà du constat. */
function needsStructuralReexplore(row, peers = []) {
  const kind = String(row?.discovery?.kind || '');
  const coverage = row?.exploration?.coverage;
  if (/near_equal|session_compare/i.test(kind) && (coverage === 'under_explored' || !row?.exploration)) {
    return 'near_equal_composition_under_explored';
  }
  if (/disc_ms_return|disc_emergence|disc_format_consolidation/i.test(kind)) {
    const returnPeers = peers.filter((p) =>
      /disc_ms_return|disc_emergence|disc_format_consolidation/i.test(String(p?.discovery?.kind || ''))
    );
    if (returnPeers.length >= 3 && !peers.some((p) => /collective_return|family_return/i.test(String(p?.discovery?.kind || '')))) {
      return 'individual_returns_without_collective';
    }
  }
  if (/session_family|adherence_targeted/i.test(kind) && coverage === 'under_explored') {
    return 'structural_under_explored';
  }
  return null;
}

/**
 * @returns {{
 *   survivors: object[],
 *   demoted: object[],
 *   fused: object[],
 *   abstained: object[],
 *   decisions: object[],
 *   reexplored: number
 * }}
 */
export function reviewCollectively(rows, { voiceKey = 'week', maxReexplore = MAX_TARGETED_REEXPLORES } = {}) {
  const decisions = [];
  const demoted = [];
  const fused = [];
  const abstained = [];
  let working = [...(rows || [])];
  let reexplored = 0;

  // 1) Réexploration ciblée — couverture faible, défaut analytique, ou occasion structurelle
  working = working.map((row, _idx, all) => {
    if (reexplored >= maxReexplore) return row;
    const coverage = row?.exploration?.coverage;
    const needsCoverage = coverage === 'under_explored' || coverage === 'method_unavailable';
    const needsDefect = isWeakConcentration(row);
    const structuralReason = needsStructuralReexplore(row, all);
    if (needsCoverage || needsDefect || structuralReason) {
      let again = exploreDiscovery(row.discovery);
      if (structuralReason === 'individual_returns_without_collective') {
        const events = all
          .filter((p) =>
            /disc_ms_return|disc_emergence|disc_format_consolidation/i.test(
              String(p?.discovery?.kind || '')
            )
          )
          .map((p) => {
            const m = p?.discovery?.metrics || {};
            const dates = Array.isArray(m.dates) ? m.dates.filter(Boolean) : [];
            const returnDate = m.returnDate || m.gapAfter || m.date || null;
            const gapDays = m.gapDays ?? m.daysAbsent ?? null;
            const mechanism = m.mechanism || null;
            return {
              exerciseId: m.exerciseId || null,
              name: m.exerciseName || m.name || p?.discovery?.title,
              date: returnDate || (dates.length ? dates[dates.length - 1] : null),
              returnDate: returnDate || null,
              confirmationDates: dates
                .map((d) => String(d).slice(0, 10))
                .filter((d) => d && (!returnDate || d > String(returnDate).slice(0, 10))),
              dates,
              gapDays,
              gapProvenByConsolidation:
                /resumed_former_level|partial_resume/i.test(String(mechanism || '')) &&
                Number(gapDays) >= 21,
              mechanism,
              family: m.muscleGroup || m.muscleFamily || p?.discovery?.family || m.family || null,
              muscleGroup: m.muscleGroup || m.muscleFamily || null,
              sessionFamilyId: m.sessionFamilyId || m.slotMatch?.primary?.dayKey || null,
              dayKey: m.dayKey || null,
              prevReps: m.prevReps ?? m.priorAvg ?? null,
              currentReps: m.currentReps ?? m.level ?? m.lastReps ?? null
            };
          });
        again = exploreCollectiveReturn(events);
      }
      reexplored += 1;
      const reason = needsDefect
        ? 'weak_concentration_vs_peer_days'
        : structuralReason || `coverage_${coverage}`;
      decisions.push({
        id: stablePublicationId(row.discovery || row),
        action: 'targeted_reexplore',
        reason
      });
      return {
        ...row,
        exploration: again || row.exploration,
        reexploredFor: needsDefect ? 'defect' : structuralReason ? 'structural' : 'coverage'
      };
    }
    return row;
  });

  // 1b) Même ensemble d’événements : concentration faible vs near_equal → démotir la concentration
  for (let i = 0; i < working.length; i += 1) {
    for (let j = i + 1; j < working.length; j += 1) {
      const a = working[i];
      const b = working[j];
      const datesA = eventDatesOf(a);
      const datesB = eventDatesOf(b);
      if (!datesA.size || !datesB.size) continue;
      const overlap = [...datesA].filter((d) => datesB.has(d));
      if (overlap.length < 2) continue;
      const aNear = /near_equal|session_compare/i.test(String(a?.discovery?.kind || ''));
      const bNear = /near_equal|session_compare/i.test(String(b?.discovery?.kind || ''));
      const aConc = isWeakConcentration(a) || /th_concentration/i.test(String(a?.discovery?.kind || ''));
      const bConc = isWeakConcentration(b) || /th_concentration/i.test(String(b?.discovery?.kind || ''));
      if ((aNear && bConc) || (bNear && aConc)) {
        const weakIdx = aConc && aNear ? -1 : aConc ? i : bConc ? j : -1;
        if (weakIdx >= 0 && reexplored < maxReexplore) {
          reexplored += 1;
          decisions.push({
            id: stablePublicationId(working[weakIdx].discovery || working[weakIdx]),
            action: 'targeted_reexplore',
            reason: 'peer_days_undermine_concentration',
            overlap
          });
          demoted.push({
            ...working[weakIdx],
            p6Disposition: 'demoted_by_review',
            reviewReason: 'peer_days_undermine_concentration'
          });
          // marquer pour drop plus bas via index set after loop — use flag
          working[weakIdx] = {
            ...working[weakIdx],
            _reviewDrop: true,
            reviewReason: 'peer_days_undermine_concentration'
          };
        }
      }
    }
  }

  // 2) Contradictions entre lectures (même sujet, opérateurs opposés)
  const bySubject = new Map();
  working.forEach((row, index) => {
    const key = row?.claim?.subject?.key || row?.discovery?.metrics?.exerciseId || textKey(row);
    if (!bySubject.has(key)) bySubject.set(key, []);
    bySubject.get(key).push({ row, index });
  });
  const dropIndexes = new Set();
  working.forEach((row, index) => {
    if (row?._reviewDrop) {
      dropIndexes.add(index);
      if (!demoted.some((d) => d === row || d.reviewReason === row.reviewReason)) {
        demoted.push({
          ...row,
          p6Disposition: 'demoted_by_review',
          reviewReason: row.reviewReason
        });
      }
    }
  });
  bySubject.forEach((group) => {
    if (group.length < 2) return;
    const ops = group.map((g) => g.row?.claim?.assertions?.[0]?.operator).filter(Boolean);
    if (ops.includes('increase') && ops.includes('decrease')) {
      const ranked = [...group].sort(
        (a, b) =>
          Number(b.row.discovery?.informativeValue || b.row.discovery?.score || 0) -
          Number(a.row.discovery?.informativeValue || a.row.discovery?.score || 0)
      );
      ranked.slice(1).forEach((item) => {
        dropIndexes.add(item.index);
        demoted.push({
          ...item.row,
          p6Disposition: 'demoted_contradiction',
          reviewReason: 'opposing_readings_same_subject'
        });
        decisions.push({
          id: item.row?.claim?.id,
          action: 'demote',
          reason: 'opposing_readings_same_subject'
        });
      });
    }
  });

  // 3) Équivalence substantielle (indépendante du producteur) + relateClaims
  for (let i = 0; i < working.length; i += 1) {
    if (dropIndexes.has(i)) continue;
    for (let j = i + 1; j < working.length; j += 1) {
      if (dropIndexes.has(j)) continue;
      const left = working[i];
      const right = working[j];
      const substantive = substantiveEquivalence(
        { ...left.discovery, claim: left.claim },
        { ...right.discovery, claim: right.claim }
      );
      // Garde-fou : sujets concrets distincts → jamais fusion (même texte / format)
      if (substantive.reason === 'distinct_subjects' || substantive.reason === 'same_title_distinct_subjects') {
        continue;
      }
      const relation = relateClaims(left.claim, right.claim);
      const shouldFuse =
        substantive.equivalent ||
        relation === RELATION.EXACT_DUPLICATE ||
        relation === RELATION.REFORMULATION;
      if (!shouldFuse) continue;

      // Conserver la plus informative / nature la plus riche
      const score = (row) =>
        Number(row.discovery?.informativeValue || row.discovery?.score || 0) +
        (row.discovery?.nature === 'journey' ? 2 : row.discovery?.nature === 'trajectory' ? 1 : 0);
      const keepLeft = score(left) >= score(right);
      const survivor = keepLeft ? left : right;
      const dropped = keepLeft ? right : left;
      const dropIndex = keepLeft ? j : i;
      dropIndexes.add(dropIndex);
      const reason = substantive.equivalent ? substantive.reason : relation;
      const lineage = buildFusionLineage(survivor.discovery || survivor, [
        dropped.discovery || dropped
      ]);
      fused.push({
        ...dropped,
        p6Disposition: substantive.equivalent
          ? 'semantic_equivalent_suppressed'
          : 'exact_duplicate_suppressed',
        collapsedInto: stablePublicationId(survivor.discovery || survivor),
        reviewReason: reason,
        fusionLineage: lineage,
        equivalence: substantive.equivalent
          ? substantive
          : { equivalent: true, reason: relation, proof: { relation } }
      });
      // Annoter le survivant
      survivor.fusionLineage = lineage;
      survivor.discovery = {
        ...survivor.discovery,
        fusionLineage: lineage
      };
      decisions.push({
        id: stablePublicationId(dropped.discovery || dropped),
        action: 'fuse',
        reason,
        into: stablePublicationId(survivor.discovery || survivor),
        detectors: [detectorKind(survivor.discovery), detectorKind(dropped.discovery)],
        equivalence: substantive.equivalent ? substantive.proof : { relation }
      });
      if (!keepLeft) break;
    }
  }

  // 4) Monopole sommeil / reprises individuelles sur horizons récents
  const sleepIndexes = working
    .map((row, index) => (sleepLike(row) && !dropIndexes.has(index) ? index : -1))
    .filter((index) => index >= 0);
  const sleepBudget = voiceKey === 'today' ? 1 : voiceKey === 'week' ? 2 : voiceKey === 'month' ? 3 : 4;
  if (sleepIndexes.length > sleepBudget) {
    sleepIndexes
      .slice()
      .sort(
        (a, b) =>
          Number(working[b].discovery?.informativeValue || 0) -
          Number(working[a].discovery?.informativeValue || 0)
      )
      .slice(sleepBudget)
      .forEach((index) => {
        dropIndexes.add(index);
        demoted.push({
          ...working[index],
          p6Disposition: 'demoted_sleep_redundancy',
          reviewReason: 'sleep_thesis_monopoly'
        });
        decisions.push({
          id: working[index]?.claim?.id,
          action: 'demote',
          reason: 'sleep_thesis_monopoly'
        });
      });
  }

  // 4b) Collectifs → approfondissements UNIQUEMENT si lien parent–enfant justifié
  // (sujet + épisode + dimension). Pas d’absorption par famille éditoriale.
  const markDeepenings = (collectiveIdx, childRe, reason, opts = {}) => {
    if (collectiveIdx < 0) return;
    const collective = working[collectiveIdx];
    const coverage =
      collective?.exploration?.coverage || collective?.discovery?.metrics?.exploration?.coverage;
    const composed =
      coverage === 'concluded' ||
      collective?.discovery?.metrics?.namedMoves?.length >= 2 ||
      collective?.discovery?.metrics?.composition?.coverage === 'concluded' ||
      /composed_|collective_|load_phase/i.test(String(collective?.discovery?.kind || ''));
    if (!composed) return;
    const parentId = stablePublicationId(collective.discovery || collective);
    const childIds = [];
    const rejectedLinks = [];
    working.forEach((row, index) => {
      if (index === collectiveIdx || dropIndexes.has(index)) return;
      if (!childRe.test(String(row?.discovery?.kind || ''))) return;
      const link = justifyParentChildLink(collective, row, {
        maxEpisodeGapDays: opts.maxEpisodeGapDays ?? 45
      });
      if (!link.ok) {
        rejectedLinks.push({
          id: stablePublicationId(row.discovery || row),
          reason: link.reason,
          proof: link.proof
        });
        decisions.push({
          id: stablePublicationId(row.discovery || row),
          action: 'keep_independent',
          reason: `deepening_rejected:${link.reason}`,
          into: parentId,
          linkProof: link.proof
        });
        return;
      }
      row.p6Disposition = 'deepening_of_collective';
      row.collapsedInto = parentId;
      row.hierarchyLink = link;
      row.wasPriority = false;
      if (row.discovery) {
        row.discovery = {
          ...row.discovery,
          p6Disposition: 'deepening_of_collective',
          collapsedInto: parentId,
          hierarchyLink: link,
          // Ne pas écraser la valeur informative : l’approfondissement reste consultable
          informativeValue: Number(row.discovery.informativeValue) || 20
        };
      }
      childIds.push(stablePublicationId(row.discovery || row));
      decisions.push({
        id: stablePublicationId(row.discovery || row),
        action: 'demote_to_deepening',
        reason,
        into: parentId,
        linkProof: link.proof
      });
    });
    if (collective.discovery) {
      collective.discovery = {
        ...collective.discovery,
        childIds,
        hierarchyChildren: childIds,
        rejectedDeepeningLinks: rejectedLinks.slice(0, 40),
        ...(collective.exploration?.conclusion
          ? {
              body: collective.exploration.conclusion,
              evidence:
                (collective.exploration.namedMoves || [])
                  .map((m) => `${m.name}@${m.date || '?'}`)
                  .slice(0, 8)
                  .join(' · ') || collective.discovery.evidence
            }
          : {})
      };
    }
  };

  markDeepenings(
    working.findIndex(
      (row, index) =>
        !dropIndexes.has(index) && /disc_collective_return/i.test(String(row?.discovery?.kind || ''))
    ),
    /disc_ms_return|disc_emergence|disc_format_consolidation|disc_structural_memory/i,
    'individual_return_under_collective',
    { maxEpisodeGapDays: 21 }
  );
  markDeepenings(
    working.findIndex(
      (row, index) =>
        !dropIndexes.has(index) &&
        /disc_composed_load_phase|disc_load_phase/i.test(String(row?.discovery?.kind || ''))
    ),
    // format_consolidation / exercise_progress exclus : dimension ≠ load
    /resistance_progression|load_progression|disc_composed_load/i,
    'individual_load_under_phase',
    { maxEpisodeGapDays: 45 }
  );

  // 5) Preuves insuffisantes → abstention justifiée (hors priorité)
  working.forEach((row, index) => {
    if (dropIndexes.has(index)) return;
    if (weakEvidence(row) && voiceKey === 'today') {
      const kind = String(row?.discovery?.kind || '');
      if (kind.includes('sleep') || /historique|habitude/i.test(`${row?.discovery?.title || ''}`)) {
        dropIndexes.add(index);
        abstained.push({
          ...row,
          p6Disposition: 'abstained_insufficient_proof',
          reviewReason: 'today_historical_without_local_proof'
        });
        decisions.push({
          id: row?.claim?.id,
          action: 'abstain',
          reason: 'today_historical_without_local_proof'
        });
      }
    }
  });

  // 6) Horizon : secondaire non justifié rétrogradé (reste en survivors mais flaggé)
  const survivors = working
    .filter((_, index) => !dropIndexes.has(index))
    .map((row) => {
      const fit = row?.discovery?.horizonFit || row?.claim?.horizon;
      if (fit && fit.justified === false && fit.angle === 'secondary') {
        decisions.push({
          id: row?.claim?.id,
          action: 'flag_horizon_mismatch',
          reason: 'better_on_other_horizon'
        });
        return {
          ...row,
          horizonMismatch: true,
          reviewReason: 'better_on_other_horizon'
        };
      }
      return row;
    });

  return { survivors, demoted, fused, abstained, decisions, reexplored };
}
