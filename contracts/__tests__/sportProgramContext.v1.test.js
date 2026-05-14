import { describe, it, expect } from 'vitest';
import {
  safeParseSportProgramContextGetV1,
  safeParseSportProgramContextPutBodyV1,
  safeParseSportProgramContextPutResponseV1
} from '../sportProgramContext.v1.js';

describe('sportProgramContext.v1', () => {
  it('parse GET minimal', () => {
    const r = safeParseSportProgramContextGetV1({
      programs: [],
      activeProgram: null,
      weekVariant: 'A',
      isGymMode: false,
      updatedAt: null
    });
    expect(r.success).toBe(true);
  });

  it('parse PUT body avec programmes', () => {
    const r = safeParseSportProgramContextPutBodyV1({
      clientMutationId: 'm1',
      programs: [{ id: '1', name: 'P' }],
      activeProgram: { id: '1' },
      weekVariant: 'B',
      isGymMode: true
    });
    expect(r.success).toBe(true);
  });

  it('refuse clientMutationId vide', () => {
    const r = safeParseSportProgramContextPutBodyV1({
      clientMutationId: '',
      programs: []
    });
    expect(r.success).toBe(false);
  });

  it('parse PUT response', () => {
    const r = safeParseSportProgramContextPutResponseV1({
      accepted: true,
      clientMutationId: 'm1',
      updatedAt: '2026-01-01T00:00:00Z',
      programs: [],
      weekVariant: 'A',
      isGymMode: false
    });
    expect(r.success).toBe(true);
  });
});
