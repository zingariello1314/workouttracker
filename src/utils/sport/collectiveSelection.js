/**
 * Sélection collective. La priorité dépend de la valeur marginale
 * dans le pack déjà retenu. Le budget de mise en avant ne retire
 * aucune conclusion admissible du catalogue.
 */

import { relateClaims, RELATION } from './narrativeCoherenceEngine';
import { substantiveEquivalence, stablePublicationId } from './discoveryIdentity';

export const PRIORITY_COLUMN_BUDGET = 11;

export function explainPriorityCounts({ selectedTotal, columnBudget = PRIORITY_COLUMN_BUDGET }) {
  return {
    columnBudget,
    columnMeaning: 'sport 10 + sommeil 1, pour une seule colonne narrative',
    selectedTotal,
    contradiction: false,
    reading:
      selectedTotal > columnBudget
        ? `${selectedTotal} cartes prioritaires additionnent les colonnes maintenant, trajectoire et parcours. ${columnBudget} est le budget d'une colonne, pas celui du pack.`
        : `${selectedTotal} cartes prioritaires tiennent dans le budget d'une colonne (${columnBudget}).`
  };
}

function intrinsic(row) {
  return Number(
    row.discovery?.informativeValue ?? row.discovery?.score ?? row.discovery?.weights?.importance ?? 0
  );
}

function horizonBoost(row, voiceKey) {
  const fit = row?.discovery?.horizonFit || row?.claim?.horizon;
  if (!fit) return 0;
  if (fit.justified === false) return -12;
  const kind = String(row?.discovery?.kind || '');
  const cat = String(row?.discovery?.analyticalCategory || '');
  const fam = String(row?.discovery?.family || '');
  if (voiceKey === 'today') {
    if (kind.includes('sleep') && !/disc_rest_day|disc_today/.test(kind)) return -8;
    if (/adherence_targeted|pending|rest_day|today/.test(kind)) return 8;
    if (row?.discovery?.nature === 'now') return 6;
    return -4;
  }
  if (voiceKey === 'week') {
    // Mission 12 : composition / collectif / décomposition avant portraits individuels
    if (/composed_|collective_return|relative_concentration|load_phase|variant_mix/.test(kind)) return 28;
    if (fam === 'program_variant_mix' || /program_variant_mix_explains/.test(String(row?.discovery?.metrics?.composition || '')))
      return 26;
    // Post-P6 v38b — ne pas rebooster session_family/adherence : cela annulait
    // week_structural_context_not_priority (−14) au classement collectif.
    const programmedStructure =
      fam === 'program_structure' ||
      row?.discovery?.metrics?.population === 'programmed_structure' ||
      row?.discovery?.metrics?.editorialRole === 'structural_discovery';
    if (programmedStructure && /session_family|adherence_/.test(kind)) return 0;
    if (/session_family|adherence_|near_equal|challenge|gtg|span_volume/.test(kind)) return 14;
    if (/volume_shape|session|return/.test(kind)) return 5;
    if (/monthly_arc|quarter|year/.test(kind)) return -6;
    if (/disc_ms_return|disc_emergence/.test(kind) && fam !== 'program_structure') return -10;
    if (/load_progression|resistance/.test(kind)) return 12;
  }
  if (voiceKey === 'month') {
    if (
      /session_family|adherence_|collective_return|repertoire|program_structure|composed_|load_phase|span_volume|variant_mix/.test(
        kind
      ) ||
      cat === 'structure' ||
      fam === 'program_structure' ||
      fam === 'program_variant_mix'
    )
      return 28;
    if (/disc_ms_return|disc_emergence|format_consolidation|exercise_progress/.test(kind)) return -28;
    if (/load_progression/.test(kind)) return 18;
  }
  if (voiceKey === 'quarter' || voiceKey === 'long' || voiceKey === 'year' || voiceKey === 'all' || voiceKey === '2y') {
    const longRange = voiceKey !== 'quarter';
    // Mission 9 : à l'échelle année / long, la structure (arc mensuel, famille de séances,
    // adhérence, trimestre) passe avant les émergences individuelles.
    if (/monthly_volume_arc|session_family|adherence_|quarter/.test(kind) || fam === 'program_structure' || cat === 'structure')
      return longRange ? 40 : 34;
    if (/monthly_arc|journey|program|trajectory|span_volume|collective_return/.test(kind) || cat === 'trajectory')
      return longRange ? 28 : 26;
    if (/disc_ms_return|disc_emergence|format_consolidation|exercise_progress/.test(kind)) return longRange ? -52 : -36;
  }
  return 0;
}

const LONG_HORIZONS = new Set(['quarter', 'long', 'year', 'all', '2y']);

const STRUCTURAL_MAJOR_RE =
  /session_family|adherence_|collective_return|monthly_volume_arc|span_volume|composed_volume|composed_relative|composed_load|composed_collective/i;

/**
 * Couverture identique entre deux horizons (ex. 2y ou all vs 1y quand le suivi ne remonte pas plus loin).
 * Reconnaît l'identité de couverture au lieu de fabriquer de la nouveauté : aucune conclusion n'est
 * présentée comme « nouvelle » sur la seule base d'une fenêtre nominale plus longue.
 */
export function acknowledgeIdenticalCoverage({
  period = null,
  referencePeriod = null,
  coverageStart = null,
  referenceCoverageStart = null,
  coverageEnd = null,
  referenceCoverageEnd = null,
  documentedDays = null,
  referenceDocumentedDays = null
} = {}) {
  const sameBounds =
    coverageStart != null &&
    referenceCoverageStart != null &&
    String(coverageStart).slice(0, 10) === String(referenceCoverageStart).slice(0, 10) &&
    String(coverageEnd || '').slice(0, 10) === String(referenceCoverageEnd || '').slice(0, 10);
  const sameDays =
    documentedDays != null && referenceDocumentedDays != null && Number(documentedDays) === Number(referenceDocumentedDays);
  const identical = Boolean(sameBounds || (coverageStart == null && sameDays));
  return {
    schema: 'momentum.horizonCoverageAck.v1',
    period,
    referencePeriod,
    identical,
    noveltyAllowed: !identical,
    reading: identical
      ? `La fenêtre ${period || 'plus longue'} couvre exactement les mêmes données documentées que ${referencePeriod || 'l’horizon précédent'} : les conclusions sont identiques par construction, sans nouveauté propre à l’horizon.`
      : null
  };
}

/**
 * Mission 29 — redondance partielle ≠ suppression du catalogue accessible.
 * overlap 1 = suppression autorisée seulement si équivalence forte.
 * partialOverlap = peut baisser la priorité / pousser en réserve, sans disparition.
 */
function accessibleTextKey(row) {
  const d = row?.discovery || row;
  return `${String(d?.title || '')
    .toLowerCase()
    .trim()}|${String(d?.body || d?.text || '')
    .toLowerCase()
    .slice(0, 120)}`;
}

export function marginalValue(candidate, chosen) {
  const base = intrinsic(candidate);
  let destination = null;
  let overlapReason = null;
  let partialDestination = null;
  let partialReason = null;
  const candidateText = accessibleTextKey(candidate);
  for (const other of chosen || []) {
    const left = candidate.discovery || candidate;
    const right = other.discovery || other;
    // Mission 34 — même titre+corps (détecteurs distincts) = redondance éditoriale exacte
    const otherText = accessibleTextKey(other);
    if (
      candidateText.length > 8 &&
      otherText.length > 8 &&
      candidateText === otherText
    ) {
      destination = stablePublicationId(right);
      overlapReason = 'multi_detector_same_text';
      break;
    }
    const substantive = substantiveEquivalence(left, right);
    // Aspects / phénomènes explicitement distincts : jamais redondants
    if (
      substantive?.reason === 'distinct_parallel_aspect' ||
      substantive?.reason === 'distinct_parallel_subjects' ||
      substantive?.reason === 'distinct_subjects' ||
      substantive?.reason === 'distinct_parallel_phenomenon'
    ) {
      continue;
    }
    const leftAspect =
      left?.metrics?.analyticalAspect || left?.discovery?.metrics?.analyticalAspect || null;
    const rightAspect =
      right?.metrics?.analyticalAspect || right?.discovery?.metrics?.analyticalAspect || null;
    if (
      leftAspect &&
      rightAspect &&
      leftAspect !== rightAspect &&
      /composed_parallel|parallel_traj/i.test(
        `${left?.kind || left?.discovery?.kind || ''} ${right?.kind || right?.discovery?.kind || ''}`
      )
    ) {
      continue;
    }
    if (substantive.equivalent) {
      const strong =
        substantive.reason === 'same_text_and_proof' ||
        substantive.reason === 'same_semantic_phenomenon' ||
        substantive.reason === 'same_text_shared_population' ||
        substantive.reason === 'same_peak_concentration_day' ||
        substantive.reason === 'same_occurrence_id';
      if (strong) {
        destination = stablePublicationId(right);
        overlapReason = substantive.reason || 'substantive_equivalent';
        break;
      }
      partialDestination = stablePublicationId(right);
      partialReason = substantive.reason || 'weak_substantive';
      continue;
    }
    const relation = relateClaims(candidate.claim, other.claim);
    if (relation === RELATION.EXACT_DUPLICATE) {
      destination = stablePublicationId(right);
      overlapReason = relation;
      break;
    }
    // Reformulation / photo proche : redondance partielle → réserve, pas suppression
    if (relation === RELATION.REFORMULATION || relation === RELATION.SAME_PHENOMENON_TWO_HORIZONS) {
      if (!partialDestination) {
        partialDestination = stablePublicationId(right);
        partialReason = relation;
      }
    }
  }
  const redundant = Boolean(destination);
  return {
    intrinsic: base,
    overlap: redundant ? 1 : 0,
    partialOverlap: !redundant && Boolean(partialDestination) ? 1 : 0,
    value: redundant ? 0 : partialDestination ? Math.max(0, base - 8) : base,
    collapsedInto: destination,
    overlapReason,
    partialCollapsedInto: partialDestination,
    partialReason
  };
}

/**
 * Sélection souveraine : le classement legacy (wasPriority) n'est qu'un
 * signal, pas un plafond. Une fusion ou une réserve à forte valeur marginale
 * peut devenir prioritaire. Les doublons exacts / reformulations sont
 * exclus du catalogue accessible (suppressed), pas seulement rétrogradés.
 */
export function selectCollectively(
  rows,
  { priorityBudget = null, voiceKey = 'week', coverage = null } = {}
) {
  const priority = [];
  const reserve = [];
  const suppressed = [];
  const ordered = [...(rows || [])].sort((a, b) => {
    const scoreA =
      intrinsic(a) +
      (a.wasPriority ? 4 : 0) +
      (a.p6Disposition === 'consolidated' ? 8 : 0) +
      horizonBoost(a, voiceKey);
    const scoreB =
      intrinsic(b) +
      (b.wasPriority ? 4 : 0) +
      (b.p6Disposition === 'consolidated' ? 8 : 0) +
      horizonBoost(b, voiceKey);
    return scoreB - scoreA;
  });
  // Mission 8 : le budget 11 est un plafond souple de colonne, pas un objectif de remplissage.
  // Une carte n’entre en priorité que si sa valeur marginale est réelle face aux déjà retenues.
  const softCap = Math.max(
    PRIORITY_COLUMN_BUDGET,
    Number.isFinite(priorityBudget) ? priorityBudget : 0
  );
  const MIN_PRIORITY_MARGINAL = 8;
  const isLongHorizon = LONG_HORIZONS.has(voiceKey);
  const individualFamilyCap =
    voiceKey === 'today' ? 2 : voiceKey === 'week' ? 3 : isLongHorizon && voiceKey !== 'quarter' ? 1 : 2;
  // Horizons longs : une émergence individuelle doit être très forte pour passer devant une structure majeure.
  const individualGate = isLongHorizon && voiceKey !== 'quarter' ? 72 : 48;
  const poolHasStructuralMajor = (rows || []).some(
    (r) =>
      STRUCTURAL_MAJOR_RE.test(String(r?.discovery?.kind || '')) &&
      r.p6Disposition !== 'deepening_of_collective' &&
      !/^secondary/.test(String(r.p6Disposition || '')) &&
      intrinsic(r) > 0
  );

  ordered.forEach((row) => {
    const againstAccessible = marginalValue(row, [...priority, ...reserve]);
    if (againstAccessible.overlap === 1) {
      const dest = againstAccessible.collapsedInto || null;
      suppressed.push({
        ...row,
        marginal: againstAccessible,
        p6Disposition: 'exact_duplicate_suppressed',
        // Mission 28/29 — suppression seulement si équivalence forte + destination
        collapsedInto: dest,
        reviewReason: againstAccessible.overlapReason || 'marginal_overlap_1',
        fusionLineage: dest
          ? {
              survivorId: dest,
              sources: [
                {
                  occurrenceId: stablePublicationId(row.discovery || row),
                  title: row.discovery?.title || row.title || null
                }
              ],
              sourceCount: 1
            }
          : null
      });
      return;
    }
    const againstPriority = marginalValue(row, priority);
    const next = { ...row, marginal: againstPriority };
    const kind = String(row?.discovery?.kind || '');
    // Mission 29 — reformulation : accessible en réserve, pas absorbée
    if (againstAccessible.partialOverlap === 1 && row.p6Disposition !== 'deepening_of_collective') {
      reserve.push({
        ...next,
        p6Disposition: 'demoted_partial_redundancy',
        selectionReason: againstAccessible.partialReason || 'partial_redundancy',
        nearEquivalentOf: againstAccessible.partialCollapsedInto || null
      });
      return;
    }
    // Approfondissements et dispositions secondaires : jamais dans le remplissage prioritaire.
    if (row.p6Disposition === 'deepening_of_collective') {
      reserve.push({ ...next, p6Disposition: 'deepening_of_collective' });
      return;
    }
    if (/^secondary/.test(String(row.p6Disposition || ''))) {
      reserve.push({ ...next, p6Disposition: row.p6Disposition });
      return;
    }
    // Mission 23 — souveraineté mémoire : publicationDecision gouverne la priorité.
    // newPriorityCard=false → réserve, sauf forcePriority explicite (pertinence éditoriale).
    const pubDecision =
      row?.discovery?.metrics?.memory?.publicationDecision ||
      row?.metrics?.memory?.publicationDecision ||
      row?.discovery?.memory?.publicationDecision ||
      null;
    if (
      pubDecision &&
      pubDecision.newPriorityCard === false &&
      pubDecision.forcePriority !== true
    ) {
      const demoted = {
        ...next,
        p6Disposition: 'demoted_memory_familiarity',
        memoryPublicationDecision: pubDecision,
        selectionReason: pubDecision.reason || 'memory_no_new_priority'
      };
      if (demoted.discovery) {
        demoted.discovery = {
          ...demoted.discovery,
          p6Disposition: 'demoted_memory_familiarity',
          selectionReason: demoted.selectionReason,
          metrics: {
            ...(demoted.discovery.metrics || {}),
            memory: {
              ...(demoted.discovery.metrics?.memory || {}),
              publicationDecision: pubDecision,
              selectionApplied: 'demoted_to_reserve'
            }
          }
        };
      }
      reserve.push(demoted);
      return;
    }
    if (pubDecision?.forcePriority === true) {
      next.selectionReason =
        pubDecision.forceReason || 'forced_priority_despite_familiarity';
      next.memoryPublicationDecision = pubDecision;
      if (next.discovery) {
        next.discovery = {
          ...next.discovery,
          selectionReason: next.selectionReason,
          metrics: {
            ...(next.discovery.metrics || {}),
            memory: {
              ...(next.discovery.metrics?.memory || {}),
              publicationDecision: pubDecision,
              selectionApplied: 'forced_priority'
            }
          }
        };
      }
    }
    const isMajor =
      STRUCTURAL_MAJOR_RE.test(kind) ||
      row.p6Disposition === 'consolidated';
    const isIndividual =
      /disc_ms_return|disc_emergence|format_consolidation|exercise_progress/i.test(kind) && !isMajor;
    const hasStructuralMajor =
      priority.some((r) => STRUCTURAL_MAJOR_RE.test(String(r?.discovery?.kind || ''))) ||
      // Horizons longs : la présence d'une structure majeure dans le pool suffit (indépendant de l'ordre).
      (isLongHorizon && poolHasStructuralMajor);
    const sameKindCount = priority.filter((r) => String(r?.discovery?.kind || '') === kind).length;
    if (isIndividual && hasStructuralMajor && againstPriority.value < individualGate) {
      reserve.push({ ...next, p6Disposition: 'secondary_to_structure' });
      return;
    }
    if (isIndividual && sameKindCount >= individualFamilyCap) {
      reserve.push({ ...next, p6Disposition: 'family_cap_reserve' });
      return;
    }
    const fusionBoost =
      row.p6Disposition === 'consolidated' && againstPriority.intrinsic >= 32 && againstPriority.overlap === 0;
    const strongEnough =
      againstPriority.value >= MIN_PRIORITY_MARGINAL || (isMajor && againstPriority.value > 0);

    // Ne pas remplir jusqu’à 11 : au-delà de softCap, seulement si réellement plus fort que le plus faible
    if (strongEnough && priority.length < softCap) {
      priority.push({
        ...next,
        p6Disposition:
          !row.wasPriority && row.p6Disposition === 'consolidated'
            ? 'promoted_fusion'
            : !row.wasPriority
              ? 'promoted_over_legacy'
              : row.p6Disposition || 'priority'
      });
      return;
    }
    if (strongEnough && (fusionBoost || isMajor) && priority.length >= softCap) {
      const weakestIdx = priority.reduce(
        (best, item, idx) =>
          (item.marginal?.value ?? 0) < (priority[best].marginal?.value ?? 0) ? idx : best,
        0
      );
      const weakest = priority[weakestIdx];
      if ((weakest?.marginal?.value ?? 0) + 4 < againstPriority.value) {
        priority.splice(weakestIdx, 1);
        reserve.push({ ...weakest, p6Disposition: weakest.p6Disposition || 'demoted_by_value' });
        priority.push({
          ...next,
          p6Disposition: next.p6Disposition === 'consolidated' ? 'promoted_fusion' : 'promoted_over_cap'
        });
        return;
      }
    }
    // Sous le seuil : pas de remplissage cosmétique
    reserve.push({
      ...next,
      p6Disposition:
        againstPriority.value > 0 && !strongEnough
          ? 'secondary_autonomous'
          : next.p6Disposition || 'reserve'
    });
  });

  const coverageAck =
    coverage && typeof coverage === 'object' && 'identical' in coverage ? coverage : null;
  return {
    priority,
    reserve,
    suppressed,
    // Couverture identique à l'horizon de référence : reconnue, jamais présentée comme nouveauté.
    ...(coverageAck
      ? {
          coverage: coverageAck,
          horizonDifferentiation: coverageAck.identical ? 'identical_coverage_no_novelty' : 'distinct_coverage'
        }
      : {})
  };
}

export function reconcileCounters({ produced, rejected, fused, priority, reserve, blocked, suppressed = 0 }) {
  const admissible = produced - rejected;
  const right = priority + reserve + fused + blocked + suppressed;
  return {
    produced,
    admissible,
    rejected,
    fused,
    priority,
    reserve,
    blocked,
    suppressed,
    reconciled: admissible === right && produced === admissible + rejected
  };
}
