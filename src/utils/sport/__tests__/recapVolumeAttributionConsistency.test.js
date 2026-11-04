import { describe, expect, it } from 'vitest';
import { classifyVolumeAttribution } from '../recapComposedEvidence';

describe('classifyVolumeAttribution — cohérence fréquence vs volume/séance', () => {
  it('ne dit jamais « reste proche » quand le volume/séance monte de +25 %', () => {
    const r = classifyVolumeAttribution({
      windowSessionCount: 3,
      prevSessionCount: 1,
      meanPerSession: 36,
      prevMeanPerSession: 28.7,
      windowTotal: 108,
      prevComparable: 29
    });
    expect(r).not.toBeNull();
    expect(r.kind).toMatch(/combined/);
    expect(String(r.detail)).not.toMatch(/reste proche/i);
    expect(String(r.detail)).toMatch(/deux leviers|volume par séance/i);
  });

  it('attribue à la fréquence seulement si le volume/séance est vraiment proche', () => {
    const r = classifyVolumeAttribution({
      windowSessionCount: 4,
      prevSessionCount: 2,
      meanPerSession: 30,
      prevMeanPerSession: 29,
      windowTotal: 120,
      prevComparable: 58
    });
    expect(r?.kind).toBe('frequency_driven_total_rise');
    expect(String(r.detail)).toMatch(/reste proche/i);
  });

  it('attribue au contenu de séance si la fréquence est stable', () => {
    const r = classifyVolumeAttribution({
      windowSessionCount: 3,
      prevSessionCount: 3,
      meanPerSession: 40,
      prevMeanPerSession: 30,
      windowTotal: 120,
      prevComparable: 90
    });
    expect(r?.kind).toBe('per_session_driven_rise');
    expect(String(r.detail)).toMatch(/volume par séance a changé/i);
  });
});
