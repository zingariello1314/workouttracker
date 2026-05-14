import { describe, it, expect } from 'vitest';
import { buildSportProgramContextFromCloudIfNewer } from './sportProgramContextCloud.js';

describe('sportProgramContextCloud', () => {
  it('applique le cloud si updatedAt > lastSaved local', () => {
    const local = { lastSaved: '2026-01-01T00:00:00Z', programHistory: [{ id: 'h1' }] };
    const remote = {
      programs: [{ id: 'p1' }],
      activeProgram: { id: 'p1' },
      weekVariant: 'B',
      isGymMode: true,
      updatedAt: '2026-01-02T00:00:00Z'
    };
    const out = buildSportProgramContextFromCloudIfNewer(local, remote);
    expect(out?.programs).toHaveLength(1);
    expect(out?.weekVariant).toBe('B');
    expect(out?.programHistory).toEqual([{ id: 'h1' }]);
  });

  it('ne remplace pas si local plus récent', () => {
    const local = { lastSaved: '2026-01-03T00:00:00Z' };
    const remote = {
      programs: [{ id: 'p1' }],
      activeProgram: { id: 'p1' },
      weekVariant: 'A',
      isGymMode: false,
      updatedAt: '2026-01-02T00:00:00Z'
    };
    expect(buildSportProgramContextFromCloudIfNewer(local, remote)).toBeNull();
  });

  it('prend le cloud sans local si snapshot non vide', () => {
    const remote = {
      programs: [{ id: 'p1' }],
      activeProgram: null,
      weekVariant: 'A',
      isGymMode: false,
      updatedAt: '2026-01-01T00:00:00Z'
    };
    const out = buildSportProgramContextFromCloudIfNewer(null, remote);
    expect(out?.programs).toHaveLength(1);
    expect(out?.programHistory).toEqual([]);
  });

  it('ignore cloud sans updatedAt', () => {
    const remote = { programs: [{ id: '1' }], activeProgram: { id: '1' }, updatedAt: null };
    expect(buildSportProgramContextFromCloudIfNewer(null, remote)).toBeNull();
  });
});
