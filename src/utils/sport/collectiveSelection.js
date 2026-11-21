/**
 * Sélection collective. La priorité dépend de la valeur marginale
 * dans le pack déjà retenu. Le budget de mise en avant ne retire
 * aucune conclusion admissible du catalogue.
 */

import { relateClaims, RELATION } from './narrativeCoherenceEngine';

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
    if (/session_family|adherence_|near_equal|challenge|gtg/.test(kind)) return 10;
    if (/volume_shape|session|return/.test(kind)) return 5;
    if (/monthly_arc|quarter|year/.test(kind)) return -6;
    // Monopole de reprises individuelles : pénalité relative
    if (/disc_ms_return|disc_emergence/.test(kind) && fam !== 'program_structure') return -6;
  }
  if (voiceKey === 'month') {
    if (/session_family|adherence_|collective_return|repertoire|program_structure/.test(kind) || cat === 'structure' || fam === 'program_structure')
      return 22;
    if (/disc_ms_return|disc_emergence|format_consolidation|exercise_progress/.test(kind)) return -22;
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

const STRUCTURAL_MAJOR_RE = /session_family|adherence_|collective_return|monthly_volume_arc|span_volume/i;

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

export function marginalValue(candidate, chosen) {
  const base = intrinsic(candidate);
  const redundant = (chosen || []).some((other) => {
    const relation = relateClaims(candidate.claim, other.claim);
    return relation === RELATION.EXACT_DUPLICATE || relation === RELATION.REFORMULATION;
  });
  return {
    intrinsic: base,
    overlap: redundant ? 1 : 0,
    value: redundant ? 0 : base
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
      suppressed.push({
        ...row,
        marginal: againstAccessible,
        p6Disposition: 'exact_duplicate_suppressed'
      });
      return;
    }
    const againstPriority = marginalValue(row, priority);
    const next = { ...row, marginal: againstPriority };
    const kind = String(row?.discovery?.kind || '');
    // Approfondissements et dispositions secondaires : jamais dans le remplissage prioritaire.
    if (row.p6Disposition === 'deepening_of_collective') {
      reserve.push({ ...next, p6Disposition: 'deepening_of_collective' });
      return;
    }
    if (/^secondary/.test(String(row.p6Disposition || ''))) {
      reserve.push({ ...next, p6Disposition: row.p6Disposition });
      return;
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
