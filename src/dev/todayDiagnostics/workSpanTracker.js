/**
 * Marqueurs synchrones de travail lourd (entrent/sortent pendant les long tasks).
 * Contrairement à un setInterval, ces spans sont enregistrés même si le thread est saturé.
 */

const MAX = 2000;
const spans = [];
let seq = 0;
const stack = [];

export function beginWorkSpan(name, detail = null) {
  const id = ++seq;
  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const frame = { id, name, detail, t0 };
  stack.push(frame);
  return id;
}

export function endWorkSpan(id) {
  const idx = stack.findIndex((frame) => frame.id === id);
  if (idx < 0) return null;
  const [frame] = stack.splice(idx, 1);
  const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const row = {
    type: 'work-span',
    id: frame.id,
    name: frame.name,
    detail: frame.detail,
    t: frame.t0,
    dur: Math.round((t1 - frame.t0) * 10) / 10,
    nestedDepth: stack.length
  };
  spans.push(row);
  if (spans.length > MAX) spans.shift();
  return row;
}

export function withWorkSpan(name, fn, detail = null) {
  const id = beginWorkSpan(name, detail);
  try {
    return fn();
  } finally {
    endWorkSpan(id);
  }
}

/** Enregistre un span déjà mesuré (ex. React Profiler actualDuration). */
export function recordCompletedWorkSpan(name, durMs, detail = null) {
  const t = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const row = {
    type: 'work-span',
    id: ++seq,
    name,
    detail,
    t,
    dur: Math.round((Number(durMs) || 0) * 10) / 10,
    nestedDepth: stack.length
  };
  spans.push(row);
  if (spans.length > MAX) spans.shift();
  return row;
}

export function resetWorkSpans() {
  spans.length = 0;
  stack.length = 0;
  seq = 0;
}

export function snapshotWorkSpans() {
  return spans.slice();
}

export function summarizeWorkSpans(windowStart = 0, windowEnd = Infinity) {
  const hit = spans.filter((s) => s.t >= windowStart && s.t <= windowEnd);
  const byName = new Map();
  hit.forEach((s) => {
    const prev = byName.get(s.name) || { name: s.name, count: 0, totalMs: 0, maxMs: 0 };
    prev.count += 1;
    prev.totalMs += s.dur || 0;
    prev.maxMs = Math.max(prev.maxMs, s.dur || 0);
    byName.set(s.name, prev);
  });
  return {
    spanCount: hit.length,
    byName: [...byName.values()].sort((a, b) => b.totalMs - a.totalMs)
  };
}
