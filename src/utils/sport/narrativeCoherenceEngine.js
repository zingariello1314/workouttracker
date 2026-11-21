/**
 * NarrativeCoherenceEngine. Les liens comparent des assertions,
 * pas seulement des titres. Les observations sources restent consultables.
 */

export const RELATION = Object.freeze({
  EXACT_DUPLICATE: 'exact_duplicate',
  REFORMULATION: 'reformulation',
  COMPLEMENTARY: 'complementary',
  EXPLANATORY: 'explanatory',
  COMPETING: 'competing',
  CONTRADICTION: 'contradiction',
  SAME_PHENOMENON_TWO_HORIZONS: 'same_phenomenon_two_horizons',
  INDEPENDENT: 'independent'
});

const OPPOSITES = {
  increase: 'decrease',
  decrease: 'increase',
  present: 'absent',
  absent: 'present',
  gt: 'lt',
  lt: 'gt'
};

function primaryAssertion(claim) {
  return claim?.assertions?.[0] || null;
}

export function relateClaims(left, right) {
  const a = primaryAssertion(left);
  const b = primaryAssertion(right);
  if (!a || !b) return RELATION.INDEPENDENT;
  const sameSubject = a.subjectId === b.subjectId;
  const sameMetric =
    a.metricId === b.metricId ||
    (String(a.metricId || '').replace(/_now$|_trajectory$|_journey$/, '') ===
      String(b.metricId || '').replace(/_now$|_trajectory$|_journey$/, '') &&
      a.metricId &&
      b.metricId);
  const sameWindow = a.windowId && a.windowId === b.windowId;
  const leftProof = (left?.proof?.observedValues || a.observedValues || [])
    .map((v) => `${v.id}:${v.value}`)
    .sort()
    .join('|');
  const rightProof = (right?.proof?.observedValues || b.observedValues || [])
    .map((v) => `${v.id}:${v.value}`)
    .sort()
    .join('|');
  const sameProof = leftProof && leftProof === rightProof;
  // Même thèse + mêmes preuves : équivalent même si détecteurs / natures diffèrent
  // MAIS sujets d’exercice concrets distincts → jamais une fusion d’historique
  const sameStatement = left.statement && left.statement === right.statement;
  const leftSub = String(a.subjectId || '');
  const rightSub = String(b.subjectId || '');
  const distinctConcreteExercises =
    leftSub !== rightSub &&
    /^ex:/i.test(leftSub) &&
    /^ex:/i.test(rightSub);
  if (distinctConcreteExercises) {
    // Similarité de séance / homonymie ≠ même trajectoire de mouvement
    return RELATION.INDEPENDENT;
  }
  if (sameStatement && sameProof && sameSubject) return RELATION.EXACT_DUPLICATE;
  if (sameStatement && sameProof && !sameSubject) {
    // Périodes génériques seulement — pas d’exercices distincts
    if (/^ex:/i.test(leftSub) || /^ex:/i.test(rightSub)) return RELATION.INDEPENDENT;
  }
  if (!sameSubject && sameMetric && a.windowId && b.windowId && a.windowId !== b.windowId) {
    return RELATION.INDEPENDENT;
  }
  if (sameSubject && sameMetric && a.windowId && b.windowId && a.windowId !== b.windowId) {
    // Photo actuelle répétée sur un horizon « journey » sans preuve d’évolution
    if (sameProof || (a.value === b.value && a.referenceValue === b.referenceValue)) {
      return RELATION.REFORMULATION;
    }
    return RELATION.SAME_PHENOMENON_TWO_HORIZONS;
  }
  if (!sameSubject || !sameMetric) {
    // Sujets période génériques + mêmes chiffres push/pull
    if (
      sameStatement &&
      a.value != null &&
      a.value === b.value &&
      a.referenceValue != null &&
      a.referenceValue === b.referenceValue
    ) {
      return RELATION.REFORMULATION;
    }
    return RELATION.INDEPENDENT;
  }
  if (OPPOSITES[a.operator] === b.operator && (sameWindow || (!a.windowId && !b.windowId))) {
    return RELATION.CONTRADICTION;
  }
  const sameNumbers = a.value === b.value && a.referenceValue === b.referenceValue && a.operator === b.operator;
  if (sameNumbers && sameStatement) return RELATION.EXACT_DUPLICATE;
  if (sameNumbers && a.value != null) return RELATION.REFORMULATION;
  if (sameProof && sameSubject) return RELATION.REFORMULATION;
  if (a.operator === b.operator && a.operator !== 'stable') return RELATION.COMPLEMENTARY;
  if (a.operator === 'stable' && b.operator === 'stable') return RELATION.COMPLEMENTARY;
  if (a.metricId !== b.metricId && sameSubject) return RELATION.EXPLANATORY;
  return RELATION.INDEPENDENT;
}

function richer(rows) {
  return [...rows].sort(
    (a, b) =>
      (b.evidenceIds?.length || 0) - (a.evidenceIds?.length || 0) ||
      String(b.statement || '').length - String(a.statement || '').length
  )[0];
}

export function consolidateConclusions(rows) {
  const relations = [];
  const fused = [];
  const blocked = [];
  const survivors = [];
  const consumed = new WeakSet();

  for (let i = 0; i < rows.length; i += 1) {
    for (let j = i + 1; j < rows.length; j += 1) {
      const relation = relateClaims(rows[i].claim, rows[j].claim);
      if (relation === RELATION.INDEPENDENT) continue;
      relations.push({ from: rows[i].claim.id, to: rows[j].claim.id, relation });
    }
  }

  const contradictionIds = new Set();
  relations
    .filter((link) => link.relation === RELATION.CONTRADICTION)
    .forEach((link) => {
      contradictionIds.add(link.from);
      contradictionIds.add(link.to);
    });

  rows.forEach((row) => {
    if (contradictionIds.has(row.claim.id)) {
      blocked.push({ ...row, p6Disposition: 'unresolved_contradiction' });
      consumed.add(row);
    }
  });

  const groups = new Map();
  rows.forEach((row) => {
    if (consumed.has(row)) return;
    const assertion = row.claim.assertions[0];
    if (!assertion) return;
    if (assertion.operator !== 'increase' && assertion.operator !== 'stable') return;
    const key =
      assertion.operator === 'stable'
        ? `stable:${assertion.metricId}`
        : `increase:${assertion.subjectId}:${assertion.metricId}`;
    const list = groups.get(key) || [];
    list.push(row);
    groups.set(key, list);
  });

  groups.forEach((group, key) => {
    const minimum = key.startsWith('stable:') ? 3 : 2;
    if (group.length < minimum) return;
    const keeper = richer(group);
    const sources = group.filter((row) => row !== keeper);
    const evidence = group.flatMap((row) => row.claim.evidenceIds || []);
    const names = group
      .map((row) => {
        const title = row.discovery?.title || '';
        const evidence = row.discovery?.evidence || '';
        if (title && evidence && !title.includes(evidence)) return `${title} (${evidence})`;
        return title || evidence || row.claim.statement;
      })
      .filter(Boolean);
    const statement = key.startsWith('stable:')
      ? `${group.length} mouvements conservent leur niveau. Cette stabilité du répertoire rassemble des maintiens qui, pris un par un, répètent la même conclusion.`
      : `${keeper.claim.statement} Les autres lectures du même niveau restent des références de cette conclusion.`;
    survivors.push({
      ...keeper,
      discovery: {
        ...keeper.discovery,
        title: key.startsWith('stable:') ? 'Le répertoire tient le même niveau' : keeper.discovery.title,
        body: `${statement} Références conservées : ${names.join(' · ')}.`,
        evidence: evidence.join(' · '),
        kind: key.startsWith('stable:') ? 'disc_repertoire_stability' : keeper.discovery.kind
      },
      claim: {
        ...keeper.claim,
        statement,
        evidenceIds: evidence,
        layer: 'conclusion'
      },
      p6Disposition: 'consolidated',
      wasPriority: group.some((row) => row.wasPriority === true),
      sourceClaimIds: group.map((row) => row.claim.id)
    });
    sources.forEach((row) => {
      fused.push({ ...row, p6Disposition: 'source_retained', collapsedInto: keeper.claim.id });
      consumed.add(row);
    });
    consumed.add(keeper);
  });

  rows.forEach((row) => {
    if (!consumed.has(row)) survivors.push({ ...row, p6Disposition: 'autonomous' });
  });

  return { survivors, fused, blocked, relations };
}
