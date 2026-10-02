import { describe, it, expect } from 'vitest';
import { pickLatestProgram, resolveLatestProgramContext } from '../programVersionUtils';

const rich = {
  id: 'p',
  name: 'complet',
  schedule: { lundi: { exercises: [{ id: 1 }, { id: 2 }] } }
};

const thin = {
  id: 'p',
  name: 'vide',
  schedule: { lundi: { exercises: [] } }
};

describe('pickLatestProgram', () => {
  it('prend la date la plus récente', () => {
    const older = { ...rich, updatedAt: '2026-01-01T00:00:00.000Z' };
    const newer = { ...thin, updatedAt: '2026-06-01T00:00:00.000Z' };
    expect(pickLatestProgram(older, newer).name).toBe('vide');
  });

  it('sans aucune date, garde le planning le plus rempli', () => {
    expect(pickLatestProgram(thin, rich).name).toBe('complet');
    expect(pickLatestProgram(rich, thin).name).toBe('complet');
  });
});

describe('resolveLatestProgramContext', () => {
  it('aligne variante et mode salle sur le programme qui a gagné', () => {
    const idb = {
      programs: [{ ...rich, updatedAt: '2026-08-01T00:00:00.000Z' }],
      activeProgram: { ...rich, updatedAt: '2026-08-01T00:00:00.000Z' },
      weekVariant: 'B',
      isGymMode: true
    };
    const live = {
      programs: [{ ...thin, updatedAt: '2026-01-01T00:00:00.000Z' }],
      activeProgram: { ...thin, updatedAt: '2026-01-01T00:00:00.000Z' },
      weekVariant: 'A',
      isGymMode: false
    };
    const out = resolveLatestProgramContext(idb, live);
    expect(out.activeProgram.name).toBe('complet');
    expect(out.weekVariant).toBe('B');
    expect(out.isGymMode).toBe(true);
  });
});
