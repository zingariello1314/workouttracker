/**
 * Registre de faits atomiques partagés entre horizons (Mission 13).
 * Un même fait (sujet + population + bornes + méthode) ne doit pas diverger
 * selon l’horizon appelant. Les producteurs peuvent enregistrer puis réutiliser.
 */

function ymd(v) {
  return v == null ? null : String(v).slice(0, 10);
}

export function makeAtomicFact({
  subject,
  canonicalId = null,
  variant = null,
  population,
  windowStart = null,
  windowEnd = null,
  unit = 'reps',
  numerator = null,
  denominator = null,
  value = null,
  coverage = null,
  reference = null,
  method = null,
  sourceFacts = [],
  label = null
} = {}) {
  const resolvedValue =
    value != null
      ? Number(value)
      : numerator != null && denominator
        ? Number(numerator) / Number(denominator)
        : null;
  return {
    schema: 'momentum.atomicFact.v1',
    subject: subject == null ? null : String(subject),
    canonicalId: canonicalId == null ? null : String(canonicalId),
    variant: variant == null ? null : String(variant),
    population: population == null ? null : String(population),
    windowStart: ymd(windowStart),
    windowEnd: ymd(windowEnd),
    unit,
    numerator: numerator == null ? null : Number(numerator),
    denominator: denominator == null ? null : Number(denominator),
    value: resolvedValue != null && Number.isFinite(resolvedValue) ? resolvedValue : null,
    coverage,
    reference,
    method,
    sourceFacts: Array.isArray(sourceFacts) ? sourceFacts : [],
    label
  };
}

export function atomicFactKey(fact) {
  return [
    fact?.canonicalId || fact?.subject || '',
    fact?.variant || '',
    fact?.population || '',
    ymd(fact?.windowStart),
    ymd(fact?.windowEnd),
    fact?.unit || '',
    fact?.method || ''
  ].join('|');
}

/**
 * Registre mutable pour un cycle de calcul (pas de persistance).
 */
export function createAtomicFactRegistry() {
  /** @type {Map<string, object>} */
  const byKey = new Map();
  const contradictions = [];

  return {
    schema: 'momentum.atomicFactRegistry.v1',
    register(fact) {
      if (!fact || fact.value == null) return { ok: false, reason: 'missing_value' };
      const key = atomicFactKey(fact);
      const existing = byKey.get(key);
      if (!existing) {
        byKey.set(key, fact);
        return { ok: true, key, status: 'inserted' };
      }
      const a = Number(existing.value);
      const b = Number(fact.value);
      if (Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) > Math.abs(a) * 0.001 + 0.5) {
        contradictions.push({
          key,
          existing: existing.value,
          incoming: fact.value,
          issue: 'same_fact_key_different_value'
        });
        return { ok: false, key, status: 'contradiction', existing, incoming: fact };
      }
      return { ok: true, key, status: 'reuse', fact: existing };
    },
    get(factLike) {
      return byKey.get(atomicFactKey(factLike)) || null;
    },
    has(factLike) {
      return byKey.has(atomicFactKey(factLike));
    },
    list() {
      return [...byKey.values()];
    },
    contradictions() {
      return [...contradictions];
    },
    snapshot() {
      return {
        schema: 'momentum.atomicFactRegistry.v1',
        count: byKey.size,
        contradictionCount: contradictions.length,
        facts: [...byKey.values()],
        contradictions: [...contradictions]
      };
    }
  };
}

/** Populations canoniques — ne pas mélanger sans libellé. */
export const FACT_POPULATION = Object.freeze({
  STRENGTH_DAYS: 'strength_days_positive_reps',
  TRAINING_DAYS_CALENDAR: 'training_days_calendar_union',
  LAST_30D: 'last_30_calendar_days',
  PERIOD_WINDOW: 'period_window',
  PAIRED_SLEEP_SESSIONS: 'paired_sleep_sessions'
});
