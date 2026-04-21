import { describe, it, expect } from 'vitest';
import { evaluateRunningTrophies } from '../runningTrophiesService';

describe('runningTrophiesService', () => {
  it('débloque distance simple et cumul hebdo', () => {
    const sessions = [
      {
        id: '1',
        date: '2025-01-06',
        time: '08:00:00',
        distance: 6,
        duration: '00:36:00',
        pace: '6:00',
        speed: '10',
        avgHR: 140,
        maxHR: 175,
        source: 'manual'
      },
      {
        id: '2',
        date: '2025-01-07',
        time: '08:00:00',
        distance: 8,
        duration: '00:48:00',
        pace: '6:00',
        speed: '10',
        avgHR: 138,
        maxHR: 175,
        source: 'manual'
      },
      {
        id: '3',
        date: '2025-01-08',
        time: '08:00:00',
        distance: 7,
        duration: '00:42:00',
        pace: '6:00',
        speed: '10',
        avgHR: 139,
        maxHR: 175,
        source: 'manual'
      }
    ];
    const ev = evaluateRunningTrophies({ runningSessions: sessions, garminById: new Map() });
    const byId = new Map(ev.results.map((r) => [r.id, r]));
    expect(byId.get('run_5_once')?.highestLevel).toBeTruthy();
    expect(byId.get('run_20_week')?.highestLevel).toBeTruthy();
    expect(byId.get('run_3_week')?.highestLevel).toBeTruthy();
  });

  it('débloque "0 arrêt" seulement avec preuve Garmin', () => {
    const sessions = [
      {
        id: 'g1',
        garminId: 999,
        date: '2025-02-01',
        time: '07:30:00',
        distance: 6,
        duration: '00:36:00',
        pace: '6:00',
        speed: '10',
        avgHR: 140,
        maxHR: 175,
        source: 'garmin'
      }
    ];
    const garminById = new Map([
      [
        '999',
        {
          garminId: 999,
          duration: 36 * 60,
          movingDuration: 36 * 60,
          running: { laps: [{ distanceKm: 1, durationSeconds: 360, intervalPhase: 'ACTIVE' }] }
        }
      ]
    ]);
    const ev = evaluateRunningTrophies({ runningSessions: sessions, garminById });
    const byId = new Map(ev.results.map((r) => [r.id, r]));
    expect(byId.get('run_no_stop')?.highestLevel).toBeTruthy();
  });
});
