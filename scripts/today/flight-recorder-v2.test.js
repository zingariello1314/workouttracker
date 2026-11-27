import { writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  analyzeInteractions,
  coveredMs,
  gapIntervals,
  matchNativeClick,
  summarize
} from '../../src/dev/todayDiagnostics/flightAnalysis.js';

describe('Flight Recorder V2 — temps inexpliqué', () => {
  it('ne compte pas deux fois les intervalles imbriqués', () => {
    expect(coveredMs([{ start: 0, end: 10 }, { start: 2, end: 8 }])).toBe(10);
  });

  it('nomme la métrique réellement max (pas native par défaut)', () => {
    const events = [
      { type: 'interaction', phase: 'start', id: 1, kind: 'check', label: 'Coche', t: 1000, inputAt: 100 },
      { type: 'interaction', phase: 'end', id: 1, t: 1002 },
      { type: 'mark', id: 1, name: 'Rappel de frame', t: 3060.6 },
      { type: 'longtask', taskId: 'lt-x', scope: 'capture', t: 200, dur: 2800 },
      {
        type: 'event-timing',
        name: 'click',
        t: 100,
        dur: 584,
        processingStart: 1000,
        processingEnd: 1002,
        interactionId: 1
      }
    ];
    const [row] = analyzeInteractions(events, { now: 4000 });
    expect(row.windowMs).toBeGreaterThan(2900);
    expect(row.nativeClickDurationMs).toBe(584);
    expect(row.bandMetricName).toBe('windowMs');
    expect(row.bandMetric).toBe(row.windowMs);
  });

  it('classe sur la latence native / fenêtre, pas legacyTotalMs', () => {
    const events = [
      { type: 'interaction', phase: 'start', id: 1, kind: 'check', label: 'Coche d’un exercice', t: 100, inputAt: 98 },
      { type: 'span', id: 1, name: 'Traitement du clic', t: 100, dur: 0.1 },
      { type: 'span', id: 1, name: 'Recherche des données', t: 100.1, dur: 1.1 },
      { type: 'span', id: 1, name: 'Mise à jour du brouillon', t: 101.2, dur: 0.7 },
      { type: 'render', id: 1, name: 'ExerciseCard', t: 102, dur: 1 },
      { type: 'render', id: 1, name: 'ExerciseCard', t: 103, dur: 0.7 },
      { type: 'interaction', phase: 'end', id: 1, t: 104 },
      { type: 'mark', id: 1, name: 'Rappel de frame', t: 4966.6 },
      { type: 'longtask', taskId: 'lt-1', scope: 'capture', t: 120, dur: 4700, confidence: 'unknown' },
      {
        type: 'event-timing',
        name: 'click',
        t: 98,
        dur: 4900,
        processingStart: 100,
        processingEnd: 104,
        interactionId: 42
      },
      { type: 'interaction', phase: 'start', id: 2, kind: 'check', label: 'Coche rapide', t: 8000, inputAt: 7999 },
      { type: 'interaction', phase: 'end', id: 2, t: 8004 },
      { type: 'mark', id: 2, name: 'Rappel de frame', t: 8021 },
      {
        type: 'event-timing',
        name: 'click',
        t: 7999,
        dur: 28,
        processingStart: 8000,
        processingEnd: 8004,
        interactionId: 43
      }
    ];
    const [slow, fast] = analyzeInteractions(events, { now: 9000 });
    expect(slow.processingMs).toBe(4);
    expect(slow.legacyTotalMs).toBeGreaterThan(4800);
    expect(slow.untilNextFrameCallbackMs).toBeGreaterThan(4800);
    expect(slow.qualities.untilNextFrameCallback).toBe('approximation-not-presentation');
    expect(slow.nativeClickDurationMs).toBe(4900);
    expect(slow.band.id).toBe('blocked');
    expect(slow.bandMetricName).toBe('nativeClickDurationMs');
    expect(slow.longTaskIds).toEqual(['lt-1']);
    expect(slow.longTaskCoveredMs).toBeGreaterThan(4000);
    expect(slow.longTaskCoveredMs).toBeLessThanOrEqual(slow.explainedMs ?? Infinity);
    expect(fast.processingMs).toBe(4);
    expect(fast.band.id).toBe('target');
    expect(fast.nativeClickDurationMs).toBe(28);
    expect(slow.inputDelayMs).toBe(2);

    const withoutFrame = analyzeInteractions(events.filter((event) => event.name !== 'Rappel de frame'), { now: 9000 })[0];
    expect(withoutFrame.untilNextFrameCallbackMs).toBeNull();

    writeFileSync('diagnostics/flight-recorder-v2-example.json', JSON.stringify({
      metadata: { schemaVersion: '2.1.0', synthetic: true },
      interactionTimeline: [slow, fast],
      unexplainedTimeIntervals: slow.unexplained.map((gap) => ({ interactionId: slow.id, ...gap })),
      summaryStatistics: summarize([slow.bandMetric, fast.bandMetric]),
      measurementLimitations: ['Exemple synthétique. Le rappel de frame n’est pas une présentation.']
    }, null, 2));
  });

  it('compte une tâche longue commencée avant l’interaction si elle chevauche la fenêtre', () => {
    const events = [
      { type: 'interaction', phase: 'start', id: 2, kind: 'check', label: 'Coche', t: 126740.1, inputAt: 125523.6 },
      { type: 'interaction', phase: 'end', id: 2, t: 126742.2 },
      { type: 'mark', id: 2, name: 'Rappel de frame', t: 126768.3 },
      { type: 'longtask', taskId: 'lt-31', scope: 'capture', t: 124296, dur: 2438 },
      {
        type: 'event-timing',
        name: 'click',
        t: 125523.6,
        dur: 1264,
        processingStart: 126740,
        processingEnd: 126742,
        interactionId: 2670
      }
    ];
    const [row] = analyzeInteractions(events, { now: 130000 });
    expect(row.longTaskIds).toContain('lt-31');
    expect(row.longTaskCoveredMs).toBeGreaterThan(1200);
    expect(row.band.id).toBe('blocked');
    expect(row.nativeClickDurationMs).toBe(1264);
  });

  it('signale un trou quand aucune tâche longue ne couvre l’attente', () => {
    const gaps = gapIntervals(0, 5000, [{ start: 0, end: 4 }], 16);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].ms).toBeGreaterThan(4900);
    expect(gaps[0].quality).toBe('unexplained');
  });

  it('ne transforme pas une mesure absente en zéro dans le résumé', () => {
    const empty = summarize([]);
    expect(empty.samples).toBe(0);
    expect(empty.min).toBeNull();
    expect(empty.reliable).toBe(false);
    expect(empty.p95Reliable).toBe(false);
  });

  it('associe un click natif par proximité de timestamp', () => {
    const match = matchNativeClick(
      [{ name: 'click', t: 100, dur: 50, interactionId: 1 }],
      { inputAt: 101, handlerStart: 110 }
    );
    expect(match.matched).toBe(true);
    expect(match.durationMs).toBe(50);
  });
});
