/**
 * F7.0e — Contrat sérialisable Worker ↔ UI pour le pipeline adaptatif lourd.
 * Chemin sync de référence conservé pour tests / fixtures.
 */

/** F7.0j — shell (assessment/enrichment/coach) + adaptive dans le même Worker. */
export const RECAP_ADAPTIVE_WORKER_CONTRACT = 'f70l2-shell-adaptive-v1';

export const WORKER_MSG = {
  COMPUTE: 'compute',
  CANCEL: 'cancel',
  RESULT: 'result',
  CANCELLED: 'cancelled',
  ERROR: 'error',
  PROGRESS: 'progress'
};

/**
 * Identité analytique complète (hors timings / requestId).
 * @param {object|null} adaptive — résultat buildAdaptiveRecapInsights
 */
export function fingerprintAdaptiveResult(adaptive) {
  if (!adaptive) return null;
  const card = (c) => ({
    id: c?.id ?? null,
    title: c?.title ?? null,
    body: c?.body ?? c?.text ?? null,
    evidence: c?.evidence ?? null,
    confidence: c?.confidence ?? null,
    informativeValue: c?.informativeValue ?? null,
    kind: c?.kind ?? null,
    family: c?.family ?? null,
    exerciseId: c?.metrics?.exerciseId ?? c?.exerciseId ?? null,
    score: c?.score ?? null,
    windowStart: c?.window?.start ?? c?.metrics?.windowStart ?? null,
    windowEnd: c?.window?.end ?? c?.metrics?.windowEnd ?? null
  });
  const insights = adaptive.insights || {};
  const disc = adaptive.periodDiscoveries || null;
  const mapDisc = (d) => ({
    kind: d?.kind ?? null,
    title: d?.title ?? null,
    body: d?.body ?? null,
    informativeValue: d?.informativeValue ?? null,
    exerciseId: d?.metrics?.exerciseId ?? null,
    rejectReason: d?.rejectReason ?? d?.dropReason ?? null,
    e0Reason: d?.e0Reason ?? d?.selectionReason ?? null
  });
  return {
    signature: adaptive.signature ?? null,
    kpis: adaptive.kpis ?? null,
    insights: {
      shortTerm: (insights.shortTerm || []).map(card),
      mediumTerm: (insights.mediumTerm || []).map(card),
      longTerm: (insights.longTerm || []).map(card)
    },
    discoveries: {
      selected: (disc?.selected || []).map(mapDisc),
      all: (disc?.all || []).map(mapDisc),
      dropped: (disc?.dropped || []).map(mapDisc)
    },
    composedIds: (adaptive.composedInterpretations || []).map((c) => c?.id || c?.kind || null),
    phenomena: (adaptive.phenomena || []).map((p) => p?.id || p?.kind || p),
    stateTransitionIds: (adaptive.stateTransitions || []).map((t) => t?.id || t?.type || null),
    athleteIdentityKey: adaptive.athleteIdentity?.primaryFocus || adaptive.athleteIdentity?.label || null,
    starvedFamilies: adaptive.starvedFamilies || [],
    rescuedFamilies: adaptive.rescuedFamilies || []
  };
}

export function adaptiveResultsEqual(a, b) {
  return JSON.stringify(fingerprintAdaptiveResult(a)) === JSON.stringify(fingerprintAdaptiveResult(b));
}

/**
 * Publication OK seulement si toutes les clés d’identité matchent.
 */
export function matchesWorkerPublicationGate(request, response) {
  if (!request || !response) return false;
  if (response.status !== 'ok') return false;
  if (request.requestId !== response.requestId) return false;
  if (String(request.accountScope || '') !== String(response.accountScope || '')) return false;
  if (String(request.period || '') !== String(response.period || '')) return false;
  if (String(request.windowStart || '') !== String(response.windowStart || '')) return false;
  if (String(request.windowEnd || '') !== String(response.windowEnd || '')) return false;
  if (String(request.dataRevision || '') !== String(response.dataRevision || '')) return false;
  if (String(request.contractVersion || '') !== String(response.contractVersion || '')) return false;
  if (!response.result) return false;
  return true;
}

/**
 * Dictionnaire de noms sérialisable pour le Worker.
 * Priorité : getter live → exerciseDisplayNames persistés (historique hors programme actuel).
 * Ne invente jamais de libellé ; laisse vide si non résolu (le gate éditorial s’abstient).
 */
export function buildExerciseNameMap(snapshot, getExerciseNameById) {
  const map = Object.create(null);
  const persisted =
    snapshot?.exerciseDisplayNames && typeof snapshot.exerciseDisplayNames === 'object'
      ? snapshot.exerciseDisplayNames
      : {};
  const ids = collectExerciseIdsForNameMap(snapshot);
  for (const key of Object.keys(persisted)) ids.add(String(key));
  for (const id of ids) {
    let name = '';
    if (typeof getExerciseNameById === 'function') {
      try {
        name = getExerciseNameById(id) || '';
      } catch {
        name = '';
      }
    }
    if (!name || /^Exercice\s+\d+$/i.test(String(name).trim())) {
      const snap = persisted[String(id)] || persisted[id];
      if (snap && !/^Exercice\s+\d+$/i.test(String(snap).trim())) name = snap;
    }
    if (name) map[String(id)] = String(name);
  }
  return map;
}

function collectExerciseIdsForNameMap(snapshot) {
  const ids = new Set();
  const ingestKey = (k) => {
    if (!k || typeof k !== 'string') return;
    const sep = k.lastIndexOf('_');
    if (/^\d{4}-\d{2}-\d{2}/.test(k) && sep > 10) ids.add(k.slice(sep + 1));
    else ids.add(k);
  };
  Object.keys(snapshot?.reps || {}).forEach(ingestKey);
  Object.keys(snapshot?.checkedExercises || {}).forEach(ingestKey);
  Object.keys(snapshot?.exerciseWeights || {}).forEach(ingestKey);
  const programs = snapshot?.programs;
  if (Array.isArray(programs)) {
    for (const p of programs) {
      const days = p?.days || p?.weekDays || [];
      for (const day of days) {
        for (const ex of day?.exercises || []) {
          if (ex?.id != null) ids.add(String(ex.id));
          if (ex?.exerciseId != null) ids.add(String(ex.exerciseId));
        }
      }
    }
  }
  return ids;
}

/**
 * F7.0j — même map, construite par lots avec yields (évite LT ~1 s sur le main).
 * @param {object} snapshot
 * @param {(id: any) => string} getExerciseNameById
 * @param {{ yieldFn?: () => Promise<void>, chunkSize?: number }} [opts]
 */
export async function buildExerciseNameMapAsync(snapshot, getExerciseNameById, opts = {}) {
  const map = Object.create(null);
  if (typeof getExerciseNameById !== 'function') return map;
  const ids = [...collectExerciseIdsForNameMap(snapshot)];
  const chunkSize = Math.max(20, Math.floor(Number(opts.chunkSize) || 80));
  const yieldFn =
    typeof opts.yieldFn === 'function'
      ? opts.yieldFn
      : () => new Promise((r) => setTimeout(r, 0));
  for (let i = 0; i < ids.length; i += 1) {
    const id = ids[i];
    try {
      const name = getExerciseNameById(id);
      if (name) map[String(id)] = String(name);
    } catch {
      /* ignore */
    }
    if (i > 0 && i % chunkSize === 0) {
      await yieldFn();
    }
  }
  return map;
}

export function makeWorkerRequestId(prefix = 'adp') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}
