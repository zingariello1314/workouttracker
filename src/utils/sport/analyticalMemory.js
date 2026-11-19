/**
 * Mémoire analytique du premier parcours vertical.
 * Isolée de l'historique d'exposition hérité. Une publication n'est pas une lecture.
 * Le retour utilisateur n'écrit jamais dans les faits sportifs.
 */

export const RESERVE_DISPOSITION = Object.freeze({
  VALID_RESERVED: 'valid_reserved',
  DEMOTED_PRIORITY: 'demoted_priority',
  MERGED: 'merged',
  REJECTED_FACTUAL: 'rejected_factual',
  HISTORICAL: 'historical'
});

const MEMORY_KEY = 'momentum.analyticalMemory.v1';

export function emptyAnalyticalMemory() {
  return {
    version: 1,
    profile: 'local',
    phenomena: {},
    publications: [],
    exposures: [],
    feedback: []
  };
}

function storage() {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return window.localStorage;
}

export function loadAnalyticalMemory(profile = 'local') {
  const store = storage();
  if (!store) return { ...emptyAnalyticalMemory(), profile };
  try {
    const raw = store.getItem(`${MEMORY_KEY}:${profile}`);
    if (!raw) return { ...emptyAnalyticalMemory(), profile };
    const parsed = JSON.parse(raw);
    return {
      ...emptyAnalyticalMemory(),
      ...parsed,
      profile,
      phenomena: parsed.phenomena || {},
      publications: parsed.publications || [],
      exposures: parsed.exposures || [],
      feedback: parsed.feedback || []
    };
  } catch {
    return { ...emptyAnalyticalMemory(), profile };
  }
}

export function saveAnalyticalMemory(memory) {
  const store = storage();
  if (!store || !memory?.profile) return false;
  const compact = {
    version: 1,
    profile: memory.profile,
    phenomena: memory.phenomena || {},
    publications: (memory.publications || []).slice(-40),
    exposures: (memory.exposures || []).slice(-80),
    feedback: (memory.feedback || []).slice(-40)
  };
  store.setItem(`${MEMORY_KEY}:${memory.profile}`, JSON.stringify(compact));
  return true;
}

export function upsertPhenomenon(memory, phenomenon) {
  const next = memory || emptyAnalyticalMemory();
  if (!phenomenon?.id) return next;
  const prev = next.phenomena[phenomenon.id] || null;
  next.phenomena[phenomenon.id] = {
    id: phenomenon.id,
    exerciseId: phenomenon.exerciseId || null,
    phenomenon: phenomenon.phenomenon || null,
    state: phenomenon.state || null,
    proofIds: phenomenon.proofIds || prev?.proofIds || [],
    window: phenomenon.window || null,
    transition: phenomenon.transition || 'new',
    updatedAt: phenomenon.updatedAt || null
  };
  return next;
}

export function notePublication({ signature, ids = [], period = null, window = null } = {}) {
  return {
    kind: 'publication',
    signature: signature || null,
    period,
    windowStart: window?.start || null,
    windowEnd: window?.end || null,
    publishedIds: ids,
    exposureCounted: false
  };
}

export function noteExposure(memory, event) {
  const next = memory || emptyAnalyticalMemory();
  const kind = event?.kind || 'presented';
  const key = [event?.editionKey || '', event?.period || '', event?.windowStart || '', event?.windowEnd || '', kind].join('|');
  const last = next.exposures[next.exposures.length - 1];
  if (last && last.key === key) return { memory: next, written: false };
  next.exposures.push({
    key,
    kind,
    editionKey: event?.editionKey || null,
    period: event?.period || null,
    windowStart: event?.windowStart || null,
    windowEnd: event?.windowEnd || null,
    at: event?.at || null
  });
  return { memory: next, written: true };
}

export function noteFeedback(memory, feedback) {
  const next = memory || emptyAnalyticalMemory();
  next.feedback.push({
    conclusionId: feedback?.conclusionId || null,
    kind: feedback?.kind || 'interest',
    note: feedback?.note || '',
    changesSportFacts: false
  });
  return next;
}

export function decideInformativePriority({
  transition = 'unchanged',
  supportCount = 0,
  newFacts = false,
  quietDays = 0,
  horizonDays = 7
} = {}) {
  if (!newFacts && supportCount <= 1 && quietDays >= 6 && horizonDays <= 7) {
    return {
      transition: 'unchanged',
      newPriorityCard: false,
      reason: 'fait_ponctuel_sans_nouvel_apport'
    };
  }
  if (!newFacts && (transition === 'confirmed' || supportCount >= 7)) {
    return {
      transition: 'confirmed',
      newPriorityCard: false,
      reason: 'confirmation_sans_nouveaute'
    };
  }
  if (!newFacts && transition === 'unchanged') {
    return { transition: 'unchanged', newPriorityCard: false, reason: 'preuves_inchangees' };
  }
  if (
    newFacts ||
    transition === 'revised' ||
    transition === 'contradicted' ||
    transition === 'refined'
  ) {
    return { transition, newPriorityCard: true, reason: 'transformation' };
  }
  return { transition, newPriorityCard: false, reason: 'sans_transformation' };
}

export function relateConclusions(current, other) {
  if (!current?.id || !other?.id || current.id === other.id) return null;
  if (current.exerciseId && current.exerciseId === other.exerciseId) {
    if (current.phenomenon && current.phenomenon === other.phenomenon) {
      return { rel: 'supersedes', from: current.id, target: other.id };
    }
    return { rel: 'related_to', from: current.id, target: other.id };
  }
  return null;
}

const DEMOTION = new Set([
  'column_cap',
  'below_min_column_weight',
  'score_fell_below_min_or_stopped',
  'claim_rivalry',
  'horizon_without_budget'
]);

function consultableTitle(title) {
  const text = String(title || '').trim();
  if (!text) return '';
  if (/relation\.reading\./i.test(text)) return '';
  if (/^[a-z0-9_.]+$/i.test(text)) return '';
  return text;
}

export function buildAccessibleReserve({ valid = [], shownIds = [], merged = [], period = null } = {}) {
  const shown = new Set(shownIds || []);
  const items = [];
  for (const row of merged || []) {
    items.push({
      id: row.id || row.candidateId || null,
      title: consultableTitle(row.title),
      body: row.body || row.text || '',
      evidence: row.evidence || '',
      period: row.period || period,
      disposition: RESERVE_DISPOSITION.MERGED,
      reason: row.kinshipDrop?.reason || row.reason || 'merged'
    });
  }
  for (const row of valid || []) {
    if (!row?.id || shown.has(row.id)) continue;
    const factual = row.admission?.admissible === false || row.validation?.ok === false;
    const reason = row.selectionTrace?.reason || 'not_prioritized';
    const title = consultableTitle(row.title);
    const rawTitle = `${row.title || ''}\n${row.body || row.text || ''}`;
    const internal =
      !title ||
      /[a-z][a-z0-9_]{2,}\s*(?:→|->)\s*[a-z][a-z0-9_]{2,}/.test(rawTitle) ||
      /exercice clé/i.test(rawTitle) ||
      /\b(NET RISE|ARC\s+\d+|POSITIVE_REPS|OUTLIER DRIVEN)\b/i.test(rawTitle);
    let disposition = RESERVE_DISPOSITION.VALID_RESERVED;
    if (factual || internal) disposition = RESERVE_DISPOSITION.REJECTED_FACTUAL;
    else if (row.metrics?.superseded) disposition = RESERVE_DISPOSITION.HISTORICAL;
    else if (DEMOTION.has(reason) || row.metrics?.editorialPriority === false) {
      disposition = RESERVE_DISPOSITION.DEMOTED_PRIORITY;
    }
    items.push({
      id: row.id,
      title,
      body: row.body || row.text || '',
      evidence: typeof row.evidence === 'string' ? row.evidence : '',
      period: row.period || period,
      disposition,
      reason: internal && !title ? 'missing_consultable_title' : reason,
      exerciseId: row.metrics?.exerciseId || null
    });
  }
  return items;
}

export function accessibleConclusions(reserve) {
  return (reserve || []).filter(
    (item) =>
      item.disposition === RESERVE_DISPOSITION.VALID_RESERVED ||
      item.disposition === RESERVE_DISPOSITION.DEMOTED_PRIORITY
  );
}

export function compareConclusionTitles(published = [], diagnostic = []) {
  const publishedSet = new Set(published.filter(Boolean));
  const diagnosticSet = new Set(diagnostic.filter(Boolean));
  return {
    common: [...publishedSet].filter((title) => diagnosticSet.has(title)),
    publishedOnly: [...publishedSet].filter((title) => !diagnosticSet.has(title)),
    diagnosticOnly: [...diagnosticSet].filter((title) => !publishedSet.has(title))
  };
}
