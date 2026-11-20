/**
 * Quatrième passe P6 — examen collectif du paquet.
 * Déterministe, coût borné (une passe, éventuellement une réexploration ciblée).
 */

import { analyticalCategory, ANALYTICAL_CATEGORY } from './horizonPublicationPolicy';
import { relateClaims, RELATION } from './narrativeCoherenceEngine';
import { exploreDiscovery } from './analyticalExploration';

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
  return !hasValues && !hasEvidence;
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

  // 1) Réexploration ciblée des conclusions sous-explorées
  working = working.map((row) => {
    if (reexplored >= maxReexplore) return row;
    const coverage = row?.exploration?.coverage;
    if (coverage === 'under_explored' || coverage === 'method_unavailable') {
      const again = exploreDiscovery(row.discovery);
      reexplored += 1;
      decisions.push({
        id: row?.claim?.id || row?.discovery?.id,
        action: 'targeted_reexplore',
        reason: `coverage_${coverage}`
      });
      return { ...row, exploration: again };
    }
    return row;
  });

  // 2) Contradictions entre lectures (même sujet, opérateurs opposés)
  const bySubject = new Map();
  working.forEach((row, index) => {
    const key = row?.claim?.subject?.key || row?.discovery?.metrics?.exerciseId || textKey(row);
    if (!bySubject.has(key)) bySubject.set(key, []);
    bySubject.get(key).push({ row, index });
  });
  const dropIndexes = new Set();
  bySubject.forEach((group) => {
    if (group.length < 2) return;
    const ops = group.map((g) => g.row?.claim?.assertions?.[0]?.operator).filter(Boolean);
    if (ops.includes('increase') && ops.includes('decrease')) {
      // Conserver la plus forte valeur marginale / informative ; rétrograder l'autre
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

  // 3) Reformulations / même histoire technique différente
  for (let i = 0; i < working.length; i += 1) {
    if (dropIndexes.has(i)) continue;
    for (let j = i + 1; j < working.length; j += 1) {
      if (dropIndexes.has(j)) continue;
      const relation = relateClaims(working[i].claim, working[j].claim);
      if (relation === RELATION.EXACT_DUPLICATE || relation === RELATION.REFORMULATION) {
        dropIndexes.add(j);
        fused.push({
          ...working[j],
          p6Disposition: 'exact_duplicate_suppressed',
          collapsedInto: working[i]?.claim?.id || working[i]?.discovery?.id,
          reviewReason: relation
        });
        decisions.push({
          id: working[j]?.claim?.id,
          action: 'fuse',
          reason: relation,
          into: working[i]?.claim?.id
        });
      }
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

  // 5) Preuves insuffisantes → abstention justifiée (hors priorité)
  working.forEach((row, index) => {
    if (dropIndexes.has(index)) return;
    if (weakEvidence(row) && voiceKey === 'today') {
      // Sur Aujourd'hui, une carte historique sans preuve locale s'abstient
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
