/**
 * Contrôle d’coherence inter-horizons (Mission 12).
 * Un même fait (sujet + fenêtre + méthode) doit porter la même valeur
 * quel que soit l’horizon depuis lequel on le consulte.
 */

function ymd(v) {
  return v == null ? null : String(v).slice(0, 10);
}

function factKey(fact) {
  return [
    fact.subjectKey || fact.subject || '',
    fact.metricId || fact.metric || '',
    fact.unit || '',
    ymd(fact.windowStart),
    ymd(fact.windowEnd),
    fact.method || '',
    fact.population || ''
  ].join('|');
}

/**
 * @param {Array<{ period: string, facts: object[] }>} periodFacts
 */
export function checkInterHorizonFactCoherence(periodFacts = []) {
  /** @type {Map<string, Array<{ period: string, fact: object }>>} */
  const byKey = new Map();
  (periodFacts || []).forEach((row) => {
    const period = row.period || 'unknown';
    (row.facts || []).forEach((fact) => {
      if (!fact || fact.value == null) return;
      const key = factKey(fact);
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key).push({ period, fact });
    });
  });

  const contradictions = [];
  const consistent = [];

  byKey.forEach((entries, key) => {
    if (entries.length < 2) return;
    const values = entries.map((e) => Number(e.fact.value));
    const allFinite = values.every((v) => Number.isFinite(v));
    if (!allFinite) return;
    const first = values[0];
    const diverge = values.some((v) => Math.abs(v - first) > (Math.abs(first) * 0.001 + 0.5));
    if (diverge) {
      contradictions.push({
        key,
        subject: entries[0].fact.subjectKey || entries[0].fact.subject,
        metric: entries[0].fact.metricId || entries[0].fact.metric,
        windowStart: ymd(entries[0].fact.windowStart),
        windowEnd: ymd(entries[0].fact.windowEnd),
        values: entries.map((e) => ({
          period: e.period,
          value: e.fact.value,
          label: e.fact.label || null,
          sources: e.fact.sources || null
        })),
        issue: 'same_fact_different_values_across_horizons'
      });
    } else {
      consistent.push({ key, periods: entries.map((e) => e.period), value: first });
    }
  });

  // Labels temporels « 30 derniers jours » depuis un horizon plus large
  const labelMismatches = [];
  (periodFacts || []).forEach((row) => {
    (row.facts || []).forEach((fact) => {
      const label = String(fact.label || fact.temporalLabel || '');
      if (/30 derniers jours|dernier mois/i.test(label) && fact.windowStart && fact.windowEnd) {
        const start = ymd(fact.windowStart);
        const end = ymd(fact.windowEnd);
        if (start && end) {
          const days =
            Math.round((new Date(`${end}T12:00:00`) - new Date(`${start}T12:00:00`)) / 86400000) + 1;
          if (days < 25 || days > 35) {
            labelMismatches.push({
              period: row.period,
              label,
              windowStart: start,
              windowEnd: end,
              daySpan: days,
              issue: 'temporal_label_incompatible_with_window'
            });
          }
        }
      }
    });
  });

  return {
    schema: 'momentum.interHorizonFactCoherence.v1',
    contradictionCount: contradictions.length,
    consistentCount: consistent.length,
    labelMismatchCount: labelMismatches.length,
    contradictions,
    labelMismatches,
    ok: contradictions.length === 0 && labelMismatches.length === 0
  };
}

/**
 * Extrait des faits atomiques depuis des cartes / claims pour le contrôle.
 * Mission 16 : le sujet mesuré n’est pas le détecteur ; fenêtre + population obligatoires
 * pour éviter les collisions cross-horizon / cross-carte.
 */
export function extractAtomicFactsFromCards(cards = [], { period = null, window = null } = {}) {
  const facts = [];
  (cards || []).forEach((card) => {
    const claim = card.claim || card.inspection?.claim || null;
    const observed = claim?.proof?.observedValues || card.metrics?.observedValues || null;
    const peakDate =
      card.metrics?.peakDate ||
      card.metrics?.date ||
      card.metrics?.returnDate ||
      (Array.isArray(card.metrics?.dates) ? card.metrics.dates[0] : null) ||
      claim?.scope?.peakDate ||
      null;
    const exerciseSubject =
      card.metrics?.exerciseId ||
      card.metrics?.canonicalId ||
      claim?.subject?.exerciseId ||
      null;
    // Sujet réel : exercice, journée, population — jamais le nom du détecteur seul.
    const subject =
      claim?.subject?.key ||
      (exerciseSubject ? `exercise:${exerciseSubject}` : null) ||
      (peakDate ? `day:${String(peakDate).slice(0, 10)}` : null) ||
      card.metrics?.phenomenonId ||
      card.metrics?.population ||
      card.metrics?.populationLabel ||
      (period ? `period:${period}` : null) ||
      card.id;
    const scopeStart =
      claim?.scope?.start ||
      card.metrics?.windowStart ||
      window?.start ||
      null;
    const scopeEnd =
      claim?.scope?.end ||
      card.metrics?.windowEnd ||
      window?.end ||
      null;
    const push = (metricId, value, unit, extra = {}) => {
      if (value == null || !Number.isFinite(Number(value))) return;
      const wStart = extra.windowStart || scopeStart;
      const wEnd = extra.windowEnd || scopeEnd;
      // Refuser un fait numérique sans borne de fenêtre : source des collisions v14.
      if (!wStart && !wEnd && !extra.allowMissingWindow) return;
      facts.push({
        subjectKey: String(extra.subjectKey || subject),
        metricId,
        value: Number(value),
        unit: unit || 'reps',
        windowStart: wStart,
        windowEnd: wEnd,
        method: extra.method || claim?.proof?.method || card.metrics?.producer || null,
        population:
          extra.population ||
          claim?.population ||
          card.metrics?.population ||
          card.metrics?.populationLabel ||
          null,
        label: extra.label || null,
        cardId: card.id || null,
        kind: card.kind || null,
        episode: extra.episode || peakDate || null
      });
    };

    if (Array.isArray(observed)) {
      observed.forEach((row) => {
        if (row && typeof row === 'object') {
          const rowSubject =
            row.subjectKey ||
            (row.date ? `day:${String(row.date).slice(0, 10)}` : null) ||
            null;
          push(row.id || row.metric || 'observed', row.value, row.unit, {
            windowStart: row.windowStart,
            windowEnd: row.windowEnd,
            label: row.label,
            subjectKey: rowSubject || undefined,
            population: row.population,
            // dates isolées : fenêtre ponctuelle = la date elle-même
            ...(row.date && !row.windowStart
              ? {
                  windowStart: String(row.date).slice(0, 10),
                  windowEnd: String(row.date).slice(0, 10)
                }
              : {})
          });
        }
      });
    } else if (observed && typeof observed === 'object') {
      Object.entries(observed).forEach(([k, v]) => {
        if (typeof v === 'number') push(k, v, 'number');
        else if (v && typeof v === 'object' && v.value != null) push(k, v.value, v.unit);
      });
    }

    if (card.metrics?.totalReps != null) {
      const wStart = scopeStart;
      const wEnd = scopeEnd;
      const spanDays =
        wStart && wEnd
          ? Math.round(
              (new Date(`${wEnd}T12:00:00`) - new Date(`${wStart}T12:00:00`)) / 86400000
            ) + 1
          : null;
      // Ne jamais attribuer un total de période à une journée (pic/date de carte).
      const isDayScoped =
        spanDays != null &&
        spanDays <= 1 &&
        peakDate &&
        String(peakDate).slice(0, 10) === String(wStart).slice(0, 10);
      const subjectKey = isDayScoped
        ? `day:${String(peakDate).slice(0, 10)}`
        : wStart && wEnd
          ? `period_volume:${wStart}:${wEnd}`
          : period
            ? `volume:${period}`
            : undefined;
      push('totalReps', card.metrics.totalReps, 'reps', {
        label: card.metrics.temporalLabel || null,
        subjectKey,
        population: card.metrics.population || 'period_window'
      });
    }
    if (card.metrics?.sessionCount != null) {
      push('sessionCount', card.metrics.sessionCount, 'sessions', {
        population: card.metrics.population || 'period_window'
      });
    }
  });
  return { period, facts };
}
