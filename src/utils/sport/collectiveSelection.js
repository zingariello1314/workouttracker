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
  if (voiceKey === 'today') {
    if (kind.includes('sleep') && !/disc_rest_day|disc_today/.test(kind)) return -8;
    if (row?.discovery?.nature === 'now') return 6;
    return -4;
  }
  if (voiceKey === 'week') {
    if (/volume_shape|session|return|near_equal|challenge/.test(kind)) return 5;
    if (/monthly_arc|quarter|year/.test(kind)) return -6;
  }
  if (voiceKey === 'month') {
    if (/repertoire|muscle|share|progress|return_collective/.test(kind) || cat === 'structure') return 5;
  }
  if (voiceKey === 'long' || voiceKey === 'year') {
    if (/monthly_arc|quarter|journey|program|trajectory/.test(kind) || cat === 'trajectory') return 8;
    if (/disc_ms_return|disc_emergence/.test(kind) && row?.discovery?.nature === 'now') return -10;
  }
  return 0;
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
export function selectCollectively(rows, { priorityBudget = null, voiceKey = 'week' } = {}) {
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
  // Le budget de mise en avant n'est plus gonflé par le legacy :
  // une promotion reste possible via fusionBoost, sans copier le plafond hérité.
  const budget = Math.max(
    PRIORITY_COLUMN_BUDGET,
    Number.isFinite(priorityBudget) ? priorityBudget : 0
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
    const fusionBoost =
      row.p6Disposition === 'consolidated' && againstPriority.intrinsic >= 32 && againstPriority.overlap === 0;
    if (againstPriority.value > 0 && (priority.length < budget || fusionBoost)) {
      if (priority.length >= budget && fusionBoost) {
        // Remplace la priorité la plus faible si la fusion apporte davantage.
        const weakestIdx = priority.reduce(
          (best, item, idx) =>
            (item.marginal?.value ?? 0) < (priority[best].marginal?.value ?? 0) ? idx : best,
          0
        );
        const weakest = priority[weakestIdx];
        if ((weakest?.marginal?.value ?? 0) < againstPriority.value) {
          priority.splice(weakestIdx, 1);
          reserve.push({ ...weakest, p6Disposition: weakest.p6Disposition || 'demoted_by_fusion' });
          priority.push({
            ...next,
            p6Disposition: next.p6Disposition === 'consolidated' ? 'promoted_fusion' : next.p6Disposition
          });
          return;
        }
      }
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
    reserve.push(next);
  });

  return { priority, reserve, suppressed };
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
