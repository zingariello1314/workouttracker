/**
 * Calculs purs du Flight Recorder V2.
 * Toutes les durées sont en millisecondes d'une horloge monotone (performance.now).
 * Une durée absente reste null. Elle ne devient jamais 0.
 */

export const INSTRUMENTATION_VERSION = '2.1.1';

/** P95 « reliable » seulement au-delà de ce seuil d’échantillon. */
export const LATENCY_P95_RELIABLE_SAMPLES = 30;
/** Résumé descriptif acceptable (médiane) à partir de ce seuil. */
export const LATENCY_SUMMARY_MIN_SAMPLES = 5;

export const LATENCY_BANDS = [
  { id: 'target', max: 50, label: 'Cible souhaitée' },
  { id: 'watch', max: 100, label: 'À surveiller' },
  { id: 'slow', max: 250, label: 'Lente' },
  { id: 'very-slow', max: 500, label: 'Très lente' },
  { id: 'critical', max: 1000, label: 'Critique' },
  { id: 'blocked', max: Infinity, label: 'Blocage majeur' }
];

export function classifyLatency(ms) {
  if (ms == null || !Number.isFinite(ms)) return { id: 'unknown', label: 'Mesure indisponible' };
  return LATENCY_BANDS.find((band) => ms <= band.max) || LATENCY_BANDS[LATENCY_BANDS.length - 1];
}

export function mergeIntervals(ranges) {
  const sorted = (ranges || [])
    .filter((range) => Number.isFinite(range?.start) && Number.isFinite(range?.end) && range.end > range.start)
    .map((range) => ({ start: range.start, end: range.end }))
    .sort((a, b) => a.start - b.start);
  const merged = [];
  sorted.forEach((range) => {
    const last = merged[merged.length - 1];
    if (!last || range.start > last.end) merged.push({ ...range });
    else last.end = Math.max(last.end, range.end);
  });
  return merged;
}

export function coveredMs(ranges) {
  return mergeIntervals(ranges).reduce((sum, range) => sum + (range.end - range.start), 0);
}

export function gapIntervals(windowStart, windowEnd, ranges, minimumMs = 1) {
  if (!Number.isFinite(windowStart) || !Number.isFinite(windowEnd) || windowEnd <= windowStart) return [];
  const merged = mergeIntervals(ranges);
  const gaps = [];
  let cursor = windowStart;
  merged.forEach((range) => {
    const start = Math.max(range.start, windowStart);
    const end = Math.min(range.end, windowEnd);
    if (end <= windowStart || start >= windowEnd) return;
    if (start - cursor >= minimumMs) gaps.push(roundGap(cursor, start));
    cursor = Math.max(cursor, end);
  });
  if (windowEnd - cursor >= minimumMs) gaps.push(roundGap(cursor, windowEnd));
  return gaps;
}

function roundGap(start, end) {
  return {
    start: roundMs(start),
    end: roundMs(end),
    ms: roundMs(end - start),
    quality: 'unexplained',
    meaning: 'Aucun span, rendu, tâche longue ou frame instrumenté ne couvre cet intervalle.'
  };
}

export function roundMs(value) {
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 10) / 10;
}

export function percentile(sorted, ratio) {
  if (!sorted.length) return null;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * ratio) - 1));
  return sorted[index];
}

/**
 * Médiane : élément d’indice floor(n/2) sur la série triée (convention inclusive basse).
 * P95 : percentile nearest-rank ceil(n*0.95)-1 (voir `percentile`).
 * Ce ne sont pas des estimateurs bootstrap ; documenter p95Reliable.
 */
export function summarize(values, options = {}) {
  const finite = (values || []).filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  const minSamples = options.minSamples ?? LATENCY_SUMMARY_MIN_SAMPLES;
  const p95ReliableSamples = options.p95ReliableSamples ?? LATENCY_P95_RELIABLE_SAMPLES;
  if (!finite.length) {
    return {
      samples: 0,
      min: null,
      median: null,
      p95: null,
      max: null,
      reliable: false,
      p95Reliable: false,
      medianConvention: 'sorted[floor(n/2)]',
      p95Convention: 'nearest-rank ceil(n*0.95)-1',
      reliabilityNote: `Médiane indicative dès ${minSamples} échantillons ; P95 stable dès ${p95ReliableSamples}.`
    };
  }
  return {
    samples: finite.length,
    min: roundMs(finite[0]),
    median: roundMs(finite[Math.floor(finite.length / 2)]),
    p95: roundMs(percentile(finite, 0.95)),
    max: roundMs(finite[finite.length - 1]),
    reliable: finite.length >= minSamples,
    p95Reliable: finite.length >= p95ReliableSamples,
    medianConvention: 'sorted[floor(n/2)]',
    p95Convention: 'nearest-rank ceil(n*0.95)-1',
    reliabilityNote:
      finite.length >= p95ReliableSamples
        ? `P95 calculé sur ${finite.length} échantillons (≥ ${p95ReliableSamples}).`
        : `P95 indicatif seulement (${finite.length}/${p95ReliableSamples} échantillons). reliable=true ne signifie pas un P95 stable.`
  };
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Associe un Event Timing « click » à une interaction métier.
 * Priorité : proximité de startTime avec inputAt, puis interactionId natif si fourni.
 */
export function matchNativeClick(eventTimingEvents, interaction, options = {}) {
  const list = (eventTimingEvents || []).filter(
    (event) => event && (event.name === 'click' || event.entryName === 'click')
  );
  if (!list.length || !interaction) return null;

  const inputAt = Number.isFinite(interaction.inputAt) ? interaction.inputAt : interaction.handlerStart;
  if (!Number.isFinite(inputAt)) return null;

  const windowMs = options.windowMs ?? 80;
  const scored = list
    .map((event) => {
      const start = Number.isFinite(event.t) ? event.t : event.startTime;
      if (!Number.isFinite(start)) return null;
      const delta = Math.abs(start - inputAt);
      return { event, start, delta };
    })
    .filter(Boolean)
    .sort((a, b) => a.delta - b.delta);

  const best = scored[0];
  if (!best || best.delta > windowMs) {
    return {
      matched: false,
      ambiguity: scored.length > 1 && scored[0].delta === scored[1]?.delta,
      candidates: scored.slice(0, 3).map((row) => ({
        t: roundMs(row.start),
        dur: roundMs(row.event.dur ?? row.event.duration),
        interactionId: row.event.interactionId ?? null,
        deltaMs: roundMs(row.delta)
      }))
    };
  }

  const second = scored[1];
  const ambiguous = Boolean(second && second.delta - best.delta < 8);
  const dur = best.event.dur ?? best.event.duration;
  return {
    matched: true,
    ambiguous,
    t: roundMs(best.start),
    durationMs: Number.isFinite(dur) ? roundMs(dur) : null,
    processingStart: Number.isFinite(best.event.processingStart) ? roundMs(best.event.processingStart) : null,
    processingEnd: Number.isFinite(best.event.processingEnd) ? roundMs(best.event.processingEnd) : null,
    interactionId: best.event.interactionId ?? null,
    deltaMs: roundMs(best.delta),
    quality: ambiguous ? 'ambiguous-nearest-timestamp' : 'timestamp-proximity'
  };
}

/**
 * Métrique utilisée pour classer l’expérience utilisateur.
 * Ne jamais utiliser legacyTotalMs (gestionnaire → rAF).
 */
export function classifyInteractionBand(row) {
  const candidates = [
    { name: 'nativeClickDurationMs', value: row.nativeClickDurationMs },
    { name: 'windowMs', value: row.windowMs },
    { name: 'inputDelayMs', value: row.inputDelayMs }
  ].filter((rowItem) => Number.isFinite(rowItem.value));
  if (!candidates.length) {
    return {
      band: classifyLatency(null),
      bandMetric: null,
      bandMetricName: null
    };
  }
  const best = candidates.reduce((a, b) => (b.value > a.value ? b : a));
  return {
    band: classifyLatency(best.value),
    bandMetric: roundMs(best.value),
    bandMetricName: best.name
  };
}

export function analyzeInteractions(events, options = {}) {
  const list = Array.isArray(events) ? events : [];

  /** Indexation unique — évite O(interactions × events) du balayage répété. */
  const eventTiming = [];
  const longTaskList = [];
  const starts = new Map();
  const ends = new Map();
  const marksById = new Map();
  const spansById = new Map();
  const visibility = [];

  for (const event of list) {
    if (!event || typeof event !== 'object') continue;
    switch (event.type) {
      case 'event-timing':
        eventTiming.push(event);
        break;
      case 'longtask':
        if (event.scope !== 'before-capture' && Number.isFinite(event.t) && Number.isFinite(event.dur)) {
          longTaskList.push(event);
        }
        break;
      case 'interaction':
        if (event.phase === 'start') starts.set(event.id, event);
        else if (event.phase === 'end') ends.set(event.id, event);
        break;
      case 'mark': {
        const bucket = marksById.get(event.id) || [];
        bucket.push(event);
        marksById.set(event.id, bucket);
        break;
      }
      case 'span':
      case 'render':
        if (Number.isFinite(event.dur)) {
          const bucket = spansById.get(event.id) || [];
          bucket.push(event);
          spansById.set(event.id, bucket);
        }
        break;
      case 'visibility':
        if (Number.isFinite(event.t)) visibility.push(event);
        break;
      default:
        break;
    }
  }

  const hiddenRanges = [];
  for (let i = 0; i < visibility.length; i += 1) {
    const event = visibility[i];
    if (event.state !== 'hidden') continue;
    let end = options.now || event.t;
    for (let j = i + 1; j < visibility.length; j += 1) {
      const next = visibility[j];
      if (next.state === 'visible' && next.t > event.t) {
        end = next.t;
        break;
      }
    }
    hiddenRanges.push({ start: event.t, end });
  }

  const hasClickTiming = eventTiming.some((event) => event.name === 'click');

  return [...starts.values()].map((start) => {
    const end = ends.get(start.id);
    const marks = marksById.get(start.id) || [];
    const frameMark = marks.find((event) => event.name === 'Rappel de frame');
    const spans = spansById.get(start.id) || [];
    const handlerStart = start.t;
    const handlerEnd = end ? end.t : null;
    const inputAt = Number.isFinite(start.inputAt) ? start.inputAt : null;
    const frameAt = frameMark ? frameMark.t : null;
    /** Convention frame : `t` du mark = instant du rappel (fin de l’attente rAF), pas le début de la frame. */
    const frameMarkMeaning = 'callback-fire-time';

    const processingMs = handlerEnd == null ? null : roundMs(handlerEnd - handlerStart);
    const inputDelayMs = inputAt == null ? null : roundMs(handlerStart - inputAt);
    const untilNextFrameCallbackMs =
      handlerEnd == null || frameAt == null ? null : roundMs(frameAt - handlerEnd);

    const nativeClick = matchNativeClick(eventTiming, {
      inputAt,
      handlerStart
    });
    const nativeClickDurationMs = nativeClick?.matched ? nativeClick.durationMs : null;

    const windowStart = inputAt ?? handlerStart;
    const windowEndCandidates = [handlerStart, handlerEnd, frameAt, nativeClick?.matched ? (nativeClick.t ?? 0) + (nativeClick.durationMs ?? 0) : null];
    const windowEnd = Math.max(...windowEndCandidates.filter((value) => Number.isFinite(value)));

    /**
     * Intersection d’intervalles : toute tâche longue qui chevauche la fenêtre compte,
     * même si elle a commencé avant l’interaction.
     * Couverture ≠ causalité.
     */
    const longTasks = longTaskList.filter((event) =>
      overlaps(event.t, event.t + event.dur, windowStart, windowEnd)
    );

    const spanRanges = spans.map((span) => ({ start: span.t, end: span.t + span.dur }));
    const longTaskRanges = longTasks.map((task) => ({ start: task.t, end: task.t + task.dur }));
    const covered = [...spanRanges, ...longTaskRanges];
    const clipToWindow = (ranges) =>
      ranges
        .filter((range) => overlaps(range.start, range.end, windowStart, windowEnd))
        .map((range) => ({
          start: Math.max(range.start, windowStart),
          end: Math.min(range.end, windowEnd)
        }));
    const explained = roundMs(coveredMs(clipToWindow(covered)));
    /** Uniquement intersection avec les long tasks — ne pas confondre avec explainedMs. */
    const longTaskCoveredMs = roundMs(coveredMs(clipToWindow(longTaskRanges)));
    const windowMs = roundMs(windowEnd - windowStart);
    const unexplained = gapIntervals(windowStart, windowEnd, covered, 16);
    const hidden = hiddenRanges.some((range) => overlaps(range.start, range.end, windowStart, windowEnd));
    const legacyTotalMs = roundMs((frameAt ?? handlerEnd ?? handlerStart) - handlerStart);

    const classification = classifyInteractionBand({
      nativeClickDurationMs,
      windowMs,
      inputDelayMs
    });

    return {
      id: start.id,
      kind: start.kind,
      label: start.label,
      status: end?.status || 'open',
      inputAt,
      handlerStart: roundMs(handlerStart),
      handlerEnd: handlerEnd == null ? null : roundMs(handlerEnd),
      frameCallbackAt: frameAt == null ? null : roundMs(frameAt),
      frameMarkMeaning,
      inputDelayMs,
      processingMs,
      untilNextFrameCallbackMs,
      nativeClickDurationMs,
      nativeClickMatch: nativeClick,
      legacyTotalMs,
      windowMs,
      longTaskCoveredMs,
      explainedMs: explained,
      unexplainedMs: unexplained.reduce((sum, gap) => sum + gap.ms, 0) || (unexplained.length ? null : 0),
      unexplained,
      longTaskIds: longTasks.map((task) => task.taskId),
      hiddenDuring: hidden,
      band: classification.band,
      bandMetric: classification.bandMetric,
      bandMetricName: classification.bandMetricName,
      coverageIsNotCausality: true,
      qualities: {
        inputDelay: inputAt == null ? 'unavailable' : 'direct',
        processing: handlerEnd == null ? 'unavailable' : 'direct',
        untilNextFrameCallback: frameAt == null ? 'unavailable' : 'approximation-not-presentation',
        nativeClick: nativeClick?.matched
          ? nativeClick.quality
          : hasClickTiming
            ? 'no-match-within-window'
            : 'unavailable',
        presentation: nativeClick?.matched
          ? 'event-timing-duration-includes-presentation-delay'
          : 'unavailable-from-page-unless-event-timing',
        unexplained: 'correlation-after-overlap-merge',
        longTaskCoverage: 'interval-intersection-not-causality'
      }
    };
  });
}

export function distribution(values) {
  const bands = LATENCY_BANDS.map((band) => ({ id: band.id, label: band.label, count: 0 }));
  (values || []).forEach((value) => {
    const band = classifyLatency(value);
    const row = bands.find((item) => item.id === band.id);
    if (row) row.count += 1;
  });
  return bands;
}
