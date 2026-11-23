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
  HISTORICAL: 'historical',
  PRESENTATION_GAP: 'presentation_gap'
});

const MEMORY_KEY = 'momentum.analyticalMemory.v1';

/**
 * Mission 27 — clé de profil unique.
 * Évite `u:u:{id}` quand l’appelant passe déjà `u:{id}` (bug v25 storePhenomena=0).
 */
export function resolveAnalyticalMemoryProfile(accountScopeOrUserId = null) {
  const s = String(accountScopeOrUserId || '').trim();
  if (!s || s === 'guest' || s === 'local') return 'local';
  if (s.startsWith('u:')) return s;
  if (s === 'auth') return 'u:auth';
  return `u:${s}`;
}

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
  // Mission 24 — fusionner avec l’existant pour ne jamais écraser des phénomènes
  // par une sauvegarde partielle (ex. noteExposure seule).
  let previous = null;
  try {
    const raw = store.getItem(`${MEMORY_KEY}:${memory.profile}`);
    if (raw) previous = JSON.parse(raw);
  } catch {
    previous = null;
  }
  const compact = {
    version: 1,
    profile: memory.profile,
    phenomena: {
      ...(previous?.phenomena || {}),
      ...(memory.phenomena || {})
    },
    publications: (memory.publications || previous?.publications || []).slice(-40),
    exposures: (memory.exposures || previous?.exposures || []).slice(-80),
    feedback: (memory.feedback || previous?.feedback || []).slice(-40)
  };
  // Si l’appelant omet phenomena mais previous en a, conserver previous
  if (
    (!memory.phenomena || !Object.keys(memory.phenomena).length) &&
    previous?.phenomena &&
    Object.keys(previous.phenomena).length
  ) {
    compact.phenomena = previous.phenomena;
  }
  store.setItem(`${MEMORY_KEY}:${memory.profile}`, JSON.stringify(compact));
  return true;
}

/** Instantané figé pour une campagne multi-horizons (même état initial). */
export function freezeAnalyticalMemorySnapshot(memory) {
  if (!memory || typeof memory !== 'object') return emptyAnalyticalMemory();
  return JSON.parse(JSON.stringify({
    ...emptyAnalyticalMemory(),
    ...memory,
    phenomena: memory.phenomena || {},
    publications: memory.publications || [],
    exposures: memory.exposures || [],
    feedback: memory.feedback || []
  }));
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
    previousState: phenomenon.previousState ?? prev?.state ?? null,
    proofIds: phenomenon.proofIds || prev?.proofIds || [],
    window: phenomenon.window || null,
    transition: phenomenon.transition || 'new',
    updatedAt: phenomenon.updatedAt || null,
    previousConclusion: phenomenon.previousConclusion ?? prev?.lastConclusion ?? null,
    lastConclusion: phenomenon.lastConclusion ?? prev?.lastConclusion ?? null,
    participantCount: phenomenon.participantCount ?? prev?.participantCount ?? null,
    confirmedParticipants: phenomenon.confirmedParticipants || prev?.confirmedParticipants || [],
    participantIds: phenomenon.participantIds || prev?.participantIds || [],
    aliases: [...new Set([...(prev?.aliases || []), ...(phenomenon.aliases || [])])],
    continuedFromPrior: phenomenon.continuedFromPrior ?? prev?.continuedFromPrior ?? false
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
    exposureCounted: false,
    at: new Date().toISOString()
  };
}

/** Mission 28 — enregistre une publication dans le registre mémoire (≠ exposition). */
export function appendPublication(memory, entry = {}) {
  const next = memory || emptyAnalyticalMemory();
  const rec =
    entry && entry.kind === 'publication'
      ? entry
      : notePublication(entry);
  next.publications = [...(next.publications || []), rec].slice(-40);
  return next;
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

/**
 * Mission 21 — évolution chronologique d’un épisode collectif.
 * Respecte knowledgeCutoff : une confirmation future n’est jamais utilisée.
 * Ne mémorise pas le texte comme vérité ; conserve états + faits.
 */
export function evolveCollectivePhenomenonMemory({
  episodeId,
  namedMoves = [],
  returnDates = [],
  confirmationDates = [],
  readingMode = 'return',
  knowledgeCutoff = null,
  priorMemory = null,
  conclusionText = null
} = {}) {
  const cutoff = knowledgeCutoff ? String(knowledgeCutoff).slice(0, 10) : null;
  const visibleConfirmations = (confirmationDates || []).filter(
    (d) => !cutoff || String(d).slice(0, 10) <= cutoff
  );
  const visibleReturns = (returnDates || []).filter(
    (d) => !cutoff || String(d).slice(0, 10) <= cutoff
  );
  const returnDate = visibleReturns[0] || null;

  let state = 'unknown';
  if (!returnDate) state = 'absent_or_interrupted';
  else if (visibleConfirmations.length === 0) state = 'return_observed';
  else if (visibleConfirmations.length === 1) state = 'confirmed_once';
  else state = 'reinstalling';

  if (readingMode === 'confirmation' && visibleConfirmations.length) {
    state = visibleConfirmations.length > 1 ? 'reinstalling' : 'confirmed_once';
  }

  const prior = priorMemory?.phenomena?.[episodeId] || null;
  const previousState = prior?.state || null;
  let transition = 'new';
  let newFacts = true;
  if (prior) {
    if (previousState === state) {
      transition = 'unchanged';
      newFacts = false;
    } else if (previousState === 'return_observed' && state === 'confirmed_once') {
      transition = 'confirmed';
      newFacts = true;
    } else if (previousState === 'confirmed_once' && state === 'reinstalling') {
      transition = 'refined';
      newFacts = true;
    } else if (state === 'absent_or_interrupted' && previousState && previousState !== state) {
      transition = 'revised';
      newFacts = true;
    } else {
      transition = 'revised';
      newFacts = true;
    }
  }

  const knownAt = cutoff || visibleConfirmations[visibleConfirmations.length - 1] || returnDate;

  let nextMemory = upsertPhenomenon(priorMemory || emptyAnalyticalMemory(), {
    id: episodeId,
    phenomenon: 'collective_return',
    state,
    proofIds: [
      ...(returnDate ? [`return:${returnDate}`] : []),
      ...visibleConfirmations.map((d) => `confirm:${d}`),
      ...namedMoves.map((m) => `ex:${m.exerciseId || m.name}`)
    ],
    window: returnDate ? { start: returnDate, end: cutoff || returnDate } : null,
    transition,
    updatedAt: knownAt,
    previousState,
    previousConclusion: prior?.lastConclusion || null,
    lastConclusion: conclusionText || null,
    participantCount: namedMoves.length,
    confirmedParticipants: namedMoves
      .filter((m) => (m.confirmationDates || []).some((d) => !cutoff || d <= cutoff))
      .map((m) => m.exerciseId || m.name)
  });
  // Mission 28 — toute évolution mémorisée compte comme publication registre
  nextMemory = appendPublication(nextMemory, {
    signature: `phen:${episodeId}|${state}|${transition}`,
    ids: [episodeId],
    period: null,
    window: returnDate ? { start: returnDate, end: cutoff || returnDate } : null
  });

  return {
    episodeId,
    state,
    previousState,
    transition,
    newFacts,
    knownAt,
    knowledgeCutoff: cutoff,
    previousConclusion: prior?.lastConclusion || null,
    memory: nextMemory,
    visibleConfirmations,
    exposureCounted: false
  };
}

/**
 * Simulation chronologique : plusieurs cutoffs sans fuite du futur.
 */
export function simulateCollectiveMemoryTimeline({
  episodeId,
  namedMoves = [],
  returnDates = [],
  confirmationDates = [],
  cutoffs = []
} = {}) {
  let memory = emptyAnalyticalMemory();
  const steps = [];
  for (const cutoff of cutoffs) {
    const evolved = evolveCollectivePhenomenonMemory({
      episodeId,
      namedMoves,
      returnDates,
      confirmationDates,
      knowledgeCutoff: cutoff,
      priorMemory: memory,
      readingMode:
        (confirmationDates || []).some((d) => d <= cutoff) &&
        (returnDates || [])[0] &&
        (returnDates || [])[0] < cutoff
          ? 'confirmation'
          : 'return'
    });
    memory = evolved.memory;
    // Persister lastConclusion factuelle (état), pas la prose
    if (memory.phenomena[episodeId]) {
      memory.phenomena[episodeId].lastConclusion = evolved.state;
    }
    steps.push({
      cutoff,
      state: evolved.state,
      previousState: evolved.previousState,
      transition: evolved.transition,
      visibleConfirmations: evolved.visibleConfirmations,
      // Preuve d’absence de fuite : aucune confirmation > cutoff
      futureLeak: evolved.visibleConfirmations.some((d) => d > cutoff)
    });
  }
  return { steps, memory };
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

export function proseTitleFromBody(body) {
  const raw = String(body || '').trim();
  const sentence = raw.split(/(?<=[.!?])\s+/)[0].replace(/^#+\s*/, '').trim();
  if (sentence.length < 24 || sentence.length > 160) return '';
  if (/relation\.reading\.|^[a-z0-9_.]+$/i.test(sentence)) return '';
  if (!/\s/.test(sentence)) return '';
  return sentence;
}

function readableTitle(row) {
  const direct = consultableTitle(row?.title);
  if (direct) return direct;
  const nested = consultableTitle(row?.context?.title || row?.interpretation?.context?.title);
  if (nested) return nested;
  const blob = [row?.body, row?.text, row?.context?.body, row?.interpretation?.context?.body]
    .filter((part) => typeof part === 'string' && part.trim())
    .join('\n\n');
  return proseTitleFromBody(blob);
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
    const title = readableTitle(row);
    const rawTitle = `${title || row.title || ''}\n${row.body || row.text || ''}`;
    const proofGap =
      /[a-z][a-z0-9_]{2,}\s*(?:→|->)\s*[a-z][a-z0-9_]{2,}/.test(rawTitle) ||
      /exercice clé/i.test(rawTitle) ||
      /\b(NET RISE|ARC\s+\d+|POSITIVE_REPS|OUTLIER DRIVEN)\b/i.test(rawTitle);
    let disposition = RESERVE_DISPOSITION.VALID_RESERVED;
    let itemReason = reason;
    if (factual || proofGap) {
      disposition = RESERVE_DISPOSITION.REJECTED_FACTUAL;
    } else if (!title) {
      disposition = RESERVE_DISPOSITION.PRESENTATION_GAP;
      itemReason = 'missing_consultable_title';
    } else if (row.metrics?.superseded) disposition = RESERVE_DISPOSITION.HISTORICAL;
    else if (DEMOTION.has(reason) || row.metrics?.editorialPriority === false) {
      disposition = RESERVE_DISPOSITION.DEMOTED_PRIORITY;
    }
    items.push({
      id: row.id,
      title,
      body: row.body || row.text || row.context?.body || '',
      evidence: typeof row.evidence === 'string' ? row.evidence : row.context?.evidenceLine || '',
      period: row.period || period,
      disposition,
      reason: itemReason,
      kind: row.kind || row.context?.kind || '',
      family: row.family || '',
      exerciseId: row.metrics?.exerciseId || row.exerciseId || null
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
