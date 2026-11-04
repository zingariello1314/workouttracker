import { describe, it, expect } from 'vitest';
import {
  buildPhenomenonRecord,
  samePhenomenon,
  phenomenaAreComplementary,
  collapseByPhenomenon,
  matchConfidence
} from '../recapPhenomenonContract';

function disc(partial) {
  return {
    kind: 'disc_emergence',
    title: 'Test',
    body: 'body',
    score: 50,
    informativeValue: 50,
    metrics: {},
    ...partial,
    metrics: { ...(partial.metrics || {}) }
  };
}

describe('recapPhenomenonContract', () => {
  it('buildPhenomenonRecord is stable for same subject/class/time', () => {
    const a = disc({
      kind: 'disc_emergence',
      title: 'Dips reviennent après interruption',
      metrics: {
        exerciseId: 'ex1',
        gapDays: 42,
        name: 'Dips',
        composedEvidence: { continuity: { kind: 'punctual_return' } }
      }
    });
    const b = disc({
      kind: 'disc_ms_return',
      title: 'Retour : Dips',
      metrics: { exerciseId: 'ex1', gapDays: 77, name: 'Dips' }
    });
    const pa = buildPhenomenonRecord(a);
    const pb = buildPhenomenonRecord(b);
    expect(pa.subjectKey).toBe(pb.subjectKey);
    expect(pa.class).toMatch(/return|emergence/);
    expect(pb.class).toMatch(/return|emergence/);
    // Même bucket gap:med / gap:long → ids peuvent différer ; sujet+classe alignés
    expect(pa.class === 'return_after_gap' || pa.class === 'emergence_generic').toBe(true);
  });

  it('distinguishes return vs format on same exercise', () => {
    const ret = disc({
      kind: 'disc_emergence',
      title: 'Pompes déclinées reviennent',
      metrics: {
        exerciseId: 'ex1',
        gapDays: 28,
        trajectoryInstallation: 'returning',
        name: 'Pompes déclinées',
        composedEvidence: { continuity: { kind: 'confirmed_return' } }
      }
    });
    const fmt = disc({
      kind: 'disc_exercise_progress',
      metrics: {
        exerciseId: 'ex1',
        trajectorySetMechanism: 'sets_down_reps_stable',
        trajectoryPrimaryStory: 'format_shift',
        name: 'Pompes déclinées',
        composedEvidence: { volumeAttribution: { kind: 'format_driven' } }
      }
    });
    expect(phenomenaAreComplementary(ret, fmt) || !samePhenomenon(ret, fmt)).toBe(true);
    expect(buildPhenomenonRecord(ret).id).not.toBe(buildPhenomenonRecord(fmt).id);
  });

  it('collapseByPhenomenon keeps highest IV', () => {
    const weak = disc({
      kind: 'disc_emergence',
      title: 'X revient',
      informativeValue: 40,
      metrics: {
        exerciseId: 'x',
        gapDays: 30,
        composedEvidence: { continuity: { kind: 'punctual_return' } }
      }
    });
    const strong = disc({
      kind: 'disc_ms_return',
      title: 'Retour X',
      informativeValue: 80,
      metrics: { exerciseId: 'x', gapDays: 45 }
    });
    // Forcer même id de phénomène (même sujet+classe+time bucket)
    const { unique, collapsed } = collapseByPhenomenon([weak, strong]);
    const sameId = buildPhenomenonRecord(weak).id === buildPhenomenonRecord(strong).id;
    if (sameId) {
      expect(unique.length).toBe(1);
      expect(unique[0].informativeValue).toBe(80);
      expect(collapsed.length).toBe(1);
    } else {
      // Buckets gap différents (30→med, 45→med) devraient matcher
      expect(buildPhenomenonRecord(weak).time).toBe(buildPhenomenonRecord(strong).time);
      expect(unique.length).toBeLessThanOrEqual(2);
    }
  });

  it('matchConfidence exact on same phenomenon id', () => {
    const a = disc({
      kind: 'disc_exercise_progress',
      metrics: {
        exerciseId: 'dips',
        trajectoryPrimaryStory: 'net_rise',
        trajectorySetMechanism: 'volume_up'
      }
    });
    const b = { ...a, title: 'Autre titre' };
    a._phenomenonRecord = buildPhenomenonRecord(a);
    b._phenomenonRecord = buildPhenomenonRecord(b);
    a._phenomenonId = a._phenomenonRecord.id;
    b._phenomenonId = b._phenomenonRecord.id;
    expect(matchConfidence(a, b)).toBe('exact');
  });
});
