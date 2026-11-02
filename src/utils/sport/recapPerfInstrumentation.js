/**
 * F6 — Instrumentation légère (dev / collectPerf).
 * Mesure inclusive par étape ; exclusive = inclusive − somme enfants directs.
 */

function nowMs() {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}

/**
 * @param {{ enabled?: boolean, label?: string }} [opts]
 */
export function createRecapPerfTimer(opts = {}) {
  const enabled = opts.enabled !== false;
  /** @type {Map<string, { inclusiveMs: number, calls: number, childrenMs: number }>} */
  const steps = new Map();
  const stack = [];

  function ensure(name) {
    if (!steps.has(name)) {
      steps.set(name, { inclusiveMs: 0, calls: 0, childrenMs: 0 });
    }
    return steps.get(name);
  }

  return {
    enabled,
    label: opts.label || 'recap',

    /** @template T @param {string} name @param {() => T} fn @returns {T} */
    measure(name, fn) {
      if (!enabled) return fn();
      const t0 = nowMs();
      stack.push(name);
      try {
        return fn();
      } finally {
        const dt = nowMs() - t0;
        stack.pop();
        const row = ensure(name);
        row.inclusiveMs += dt;
        row.calls += 1;
        if (stack.length) {
          ensure(stack[stack.length - 1]).childrenMs += dt;
        }
      }
    },

    markCall(name) {
      if (!enabled) return;
      ensure(name).calls += 1;
    },

    snapshot() {
      if (!enabled) return null;
      const out = {};
      for (const [name, row] of steps.entries()) {
        const exclusive = Math.max(0, row.inclusiveMs - row.childrenMs);
        out[name] = {
          calls: row.calls,
          inclusiveMs: Math.round(row.inclusiveMs * 100) / 100,
          exclusiveMs: Math.round(exclusive * 100) / 100
        };
      }
      return out;
    }
  };
}

/** Timer no-op pour chemins production sans collectPerf. */
export function noopRecapPerfTimer() {
  return {
    enabled: false,
    label: 'noop',
    measure(_name, fn) {
      return fn();
    },
    markCall() {},
    snapshot() {
      return null;
    }
  };
}
