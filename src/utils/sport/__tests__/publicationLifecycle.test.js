import { describe, expect, it } from 'vitest';
import { computeRecapPeriodWorkerBundle } from '../recapPeriodWorkerCompute';
import { isRecapComputeAbort } from '../recapComputeCoop';
import {
  summarizePublicationLifecycle,
  workerGateMismatch
} from '../publicationLifecycleTrace';
import { buildAnalysisEnvironmentDossier } from '../analysisEnvironmentDossier';

function representativeSnapshot() {
  const reps = {};
  const checkedExercises = {};
  const exercises = ['pompe', 'tirage', 'squat', 'gainage'];
  const start = new Date('2026-06-01T12:00:00Z');
  for (let week = 0; week < 18; week += 1) {
    exercises.forEach((id, index) => {
      if ((week + index) % 5 === 0) return;
      const date = new Date(start.getTime() + week * 7 * 86400000);
      const ymd = date.toISOString().slice(0, 10);
      const base = 12 + index * 4;
      const repsN = week < 4 ? base : base + 8;
      reps[`${ymd}_${id}`] = String(repsN);
      checkedExercises[`${ymd}_${id}`] = true;
    });
  }
  return { reps, checkedExercises };
}

describe('cycle de publication observable', () => {
  it('nomme le premier événement manquant après un simple envoi', () => {
    const summary = summarizePublicationLifecycle(
      [
        { t: 1_000, event: 'snapshot_built', generation: 4 },
        { t: 1_100, event: 'request_sent', generation: 4 }
      ],
      1_400
    );
    expect(summary.lastEvent).toBe('request_sent');
    expect(summary.firstMissing).toBe('worker_ready');
    expect(summary.diagnosis).toBe('awaiting_worker_receipt');
    expect(summary.domValidated).toBe(false);
  });

  it('distingue un rejet, une annulation et un commit React qui ne prouve pas le DOM', () => {
    expect(
      summarizePublicationLifecycle([
        { t: 1, event: 'main_received', generation: 2 },
        { t: 2, event: 'publication_rejected', generation: 2, reason: 'requestId' }
      ]).diagnosis
    ).toBe('rejected');
    expect(
      summarizePublicationLifecycle([
        { t: 1, event: 'request_sent', generation: 3 },
        { t: 2, event: 'generation_superseded', generation: 3, reason: 'effect_cleanup' }
      ]).diagnosis
    ).toBe('cancelled');
    const committed = summarizePublicationLifecycle([
      { t: 1, event: 'snapshot_built', generation: 1 },
      { t: 2, event: 'worker_created', generation: 1 },
      { t: 3, event: 'request_sent', generation: 1 },
      { t: 4, event: 'worker_received', generation: 1 },
      { t: 5, event: 'compute_started', generation: 1 },
      { t: 6, event: 'worker_response_sent', generation: 1 },
      { t: 7, event: 'main_received', generation: 1 },
      { t: 8, event: 'message_validated', generation: 1 },
      { t: 9, event: 'request_resolved', generation: 1 },
      { t: 10, event: 'signature_checked', generation: 1 },
      { t: 11, event: 'publication_accepted', generation: 1 },
      { t: 12, event: 'insights_applied', generation: 1 },
      { t: 13, event: 'react_state_scheduled', generation: 1 },
      { t: 14, event: 'status_ready', generation: 1 },
      { t: 15, event: 'render_committed', generation: 1, reason: 'react_commit_not_dom_proof' }
    ]);
    expect(committed.firstMissing).toBe(null);
    expect(committed.diagnosis).toBe('react_committed_dom_not_proven');
    expect(committed.domValidated).toBe(false);
    expect(workerGateMismatch({ requestId: 'a', status: 'ok' }, { status: 'ok', requestId: 'b' })).toBe(
      'requestId'
    );
  });

  it('range le résumé dans le dossier existant, sans les séances', () => {
    const dossier = buildAnalysisEnvironmentDossier({
      period: '7d',
      analysisStatus: 'refreshing',
      publicationTrace: [{ t: 10, event: 'worker_posted', generation: 8, period: '7d' }]
    });
    expect(dossier.publicationLifecycle.lastEvent).toBe('worker_posted');
    expect(dossier.publicationLifecycle.domValidated).toBe(false);
    expect(JSON.stringify(dossier.publicationTrace)).not.toMatch(/reps/);
  });

  it('mesure un historique isolé, une annulation et une erreur récupérable', async () => {
    const snapshot = representativeSnapshot();
    const prep0 = performance.now();
    const serialized = JSON.stringify(snapshot);
    const prepMs = performance.now() - prep0;
    const parsed = JSON.parse(serialized);
    const run0 = performance.now();
    const bundle = await computeRecapPeriodWorkerBundle({
      period: '6m',
      windowStart: '2026-06-01',
      windowEnd: '2026-10-01',
      snapshot: parsed,
      nameMap: {},
      activeProgram: null,
      programs: []
    });
    const workerMs = performance.now() - run0;
    const back = JSON.parse(JSON.stringify(bundle.adaptive));
    expect(back).toBeTruthy();
    expect(prepMs).toBeLessThan(1000);
    expect(workerMs).toBeLessThan(20000);

    let stages = 0;
    await expect(
      computeRecapPeriodWorkerBundle(
        {
          period: '7d',
          windowStart: '2026-09-20',
          windowEnd: '2026-10-01',
          snapshot,
          nameMap: {}
        },
        {
          shouldAbort: () => stages > 0,
          onStage: () => {
            stages += 1;
          }
        }
      )
    ).rejects.toSatisfy((err) => isRecapComputeAbort(err));

    const before = process.memoryUsage?.().heapUsed || 0;
    await computeRecapPeriodWorkerBundle({
      period: '30d',
      windowStart: '2026-09-01',
      windowEnd: '2026-10-01',
      snapshot,
      nameMap: {}
    });
    const after = process.memoryUsage?.().heapUsed || 0;
    expect(after - before).toBeLessThan(80 * 1024 * 1024);
  }, 60000);
});
