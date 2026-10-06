import { describe, expect, it } from 'vitest';
import { resolveGtgBodyWeightKg } from '../gtgService';

describe('resolveGtgBodyWeightKg', () => {
  it('préfère l’impédancemètre à une saisie GTG manuelle', () => {
    const gtg = { config: { selectedIds: [], bodyWeightKg: 80 } };
    const workoutData = {
      progressEntries: [
        {
          type: 'impedance',
          weight: 72.4,
          date: '2026-10-05',
          updatedAt: '2026-10-05T10:00:00'
        }
      ]
    };
    const r = resolveGtgBodyWeightKg(gtg, { workoutData });
    expect(r.known).toBe(true);
    expect(r.kg).toBe(72.4);
    expect(r.source).toBe('impedance');
    expect(r.dateYmd).toBe('2026-10-05');
  });

  it('utilise les métriques Aujourd’hui / Body si plus récentes', () => {
    const workoutData = {
      progressEntries: [
        {
          type: 'metrics',
          weight: 71,
          date: '2026-10-06',
          updatedAt: '2026-10-06T08:00:00'
        }
      ]
    };
    const r = resolveGtgBodyWeightKg({ config: {} }, { workoutData });
    expect(r.source).toBe('metrics');
    expect(r.kg).toBe(71);
  });

  it('retombe sur la saisie GTG si aucune mesure Body', () => {
    const r = resolveGtgBodyWeightKg(
      { config: { bodyWeightKg: 69.5 } },
      { workoutData: { progressEntries: [] } }
    );
    expect(r.source).toBe('gtg');
    expect(r.kg).toBe(69.5);
  });
});
