import { describe, it, expect } from 'vitest';
import { deriveCadenceSpmFromGarmin, deriveVo2FromGarmin } from '../runningGarminMetrics';

describe('runningGarminMetrics', () => {
  it('lit la cadence moyenne Garmin quand présente', () => {
    const g = { running: { averageCadenceSpm: 164, laps: [] } };
    expect(deriveCadenceSpmFromGarmin(g)).toEqual({ spm: 164, source: 'garmin_avg' });
  });

  it('agrège la cadence sur les tours si pas de moyenne globale', () => {
    const g = {
      running: {
        laps: [
          { distanceKm: 1, durationSeconds: 360, averageCadenceSpm: 160 },
          { distanceKm: 1, durationSeconds: 360, averageCadenceSpm: 168 }
        ]
      }
    };
    const r = deriveCadenceSpmFromGarmin(g);
    expect(r?.spm).toBe(164);
    expect(r?.source).toBe('garmin_laps');
  });

  it('lit le VO2 Garmin au niveau activité', () => {
    expect(deriveVo2FromGarmin({ vo2Max: 48.2 })).toEqual({ vo2: 48.2, source: 'garmin' });
    expect(deriveVo2FromGarmin({ training: { vo2Max: 51 } })).toEqual({ vo2: 51, source: 'garmin' });
  });
});
