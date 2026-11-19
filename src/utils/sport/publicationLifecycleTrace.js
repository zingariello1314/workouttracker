/**
 * Trace du cycle de publication réel.
 * Champs d'identité et durées seulement : pas de séances, pas de snapshot.
 */

const ORDER = [
  'snapshot_built',
  'worker_ready',
  'request_sent',
  'worker_received',
  'compute_started',
  'compute_finished',
  'worker_response_sent',
  'main_received',
  'message_validated',
  'request_resolved',
  'signature_checked',
  'publication_accepted',
  'insights_applied',
  'react_state_scheduled',
  'status_ready',
  'render_committed'
];

const ALIAS = {
  worker_ready: ['worker_created', 'worker_reused'],
  request_sent: ['worker_posted'],
  compute_finished: ['compute_error', 'worker_response_sent'],
  request_resolved: ['request_rejected'],
  publication_accepted: ['publication_rejected'],
  status_ready: ['status_error']
};

function push(entry) {
  if (typeof window === 'undefined' || process.env.NODE_ENV === 'production') return entry;
  try {
    const log = (window.__f70iPub = window.__f70iPub || []);
    const prev = log[log.length - 1];
    if (
      entry.event === 'render_committed' &&
      prev?.event === 'render_committed' &&
      prev.period === entry.period &&
      prev.windowStart === entry.windowStart &&
      prev.windowEnd === entry.windowEnd
    ) {
      return prev;
    }
    log.push(entry);
    if (log.length > 160) log.splice(0, log.length - 160);
  } catch {
    /* ignore */
  }
  return entry;
}

export function tracePublication(event, fields = {}) {
  const row = {
    t: Date.now(),
    event: String(event || 'unknown'),
    runId: fields.runId || null,
    requestId: fields.requestId || null,
    analysisEdition: fields.analysisEdition || null,
    workerContract: fields.workerContract || null,
    period: fields.period || null,
    windowStart: fields.windowStart ?? null,
    windowEnd: fields.windowEnd ?? null,
    dataFingerprint: fields.dataFingerprint || null,
    before: fields.before ?? null,
    after: fields.after ?? null,
    ms: fields.ms ?? null,
    reason: fields.reason || null,
    stage: fields.stage || null,
    generation: fields.generation ?? null
  };
  return push(row);
}

function has(names, step) {
  if (names.has(step)) return true;
  return (ALIAS[step] || []).some((alias) => names.has(alias));
}

export function summarizePublicationLifecycle(trace, now = Date.now()) {
  const events = Array.isArray(trace) ? trace.filter((e) => e && e.event) : [];
  if (!events.length) {
    return {
      lastEvent: null,
      firstMissing: 'snapshot_built',
      diagnosis: 'not_started',
      domValidated: false,
      generation: null,
      observed: []
    };
  }
  const latestGen = events.reduce((max, e) => Math.max(max, Number(e.generation) || 0), 0);
  const run = latestGen
    ? events.filter((e) => e.generation == null || Number(e.generation) === latestGen)
    : events;
  const names = new Set(run.map((e) => e.event));
  const last = run[run.length - 1];
  const firstMissing = ORDER.find((step) => !has(names, step)) || null;
  const age = now - (last?.t || now);
  let diagnosis = 'in_progress';
  if (names.has('render_committed')) diagnosis = 'react_committed_dom_not_proven';
  else if ((names.has('status_ready') || names.has('publish_final')) && !names.has('render_committed')) {
    diagnosis = 'render_incomplete';
  } else if (names.has('publication_rejected') || names.has('request_rejected')) diagnosis = 'rejected';
  else if (names.has('compute_error') || names.has('status_error')) diagnosis = 'error_recoverable';
  else if (
    (names.has('generation_superseded') || names.has('worker_aborted') || names.has('request_cancelled')) &&
    !names.has('status_ready')
  ) {
    diagnosis = 'cancelled';
  } else if (has(names, 'request_sent') && !names.has('worker_received')) {
    diagnosis = age > 15000 ? 'blocked_before_worker_receipt' : 'awaiting_worker_receipt';
  } else if (names.has('worker_received') && !has(names, 'compute_started') && !has(names, 'compute_finished')) {
    diagnosis = age > 15000 ? 'blocked' : 'compute_not_started';
  } else if (has(names, 'compute_started') && !has(names, 'compute_finished')) {
    const stages = run.filter((e) => e.event === 'compute_stage').length;
    diagnosis = age >= 20000 && stages < 1 ? 'blocked' : age >= 8000 ? 'slow' : 'compute_in_progress';
  } else if (has(names, 'compute_finished') && !names.has('main_received')) diagnosis = 'response_not_received';
  else if (names.has('main_received') && !has(names, 'publication_accepted')) diagnosis = 'rejected';
  else if (has(names, 'publication_accepted') && !names.has('insights_applied')) {
    diagnosis = 'publication_not_triggered';
  } else if (names.has('react_state_scheduled') && !names.has('status_ready')) diagnosis = 'state_not_stable';

  return {
    lastEvent: last?.event || null,
    firstMissing,
    diagnosis,
    domValidated: false,
    generation: latestGen || null,
    observed: [...names],
    ageMs: age
  };
}

export function workerGateMismatch(request, response) {
  if (!response || response.status !== 'ok') return 'status';
  const keys = [
    'requestId',
    'accountScope',
    'period',
    'windowStart',
    'windowEnd',
    'dataRevision',
    'contractVersion'
  ];
  for (const key of keys) {
    if (String(response[key] ?? '') !== String(request?.[key] ?? '')) return key;
  }
  if (!response.result) return 'result_missing';
  return null;
}
