import { describe, it, expect } from 'vitest';
import { evaluateRunningTrophies, inversePaceFloorSec, buildRunningTrophiesCatalog } from '../runningTrophiesService';

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
      },
      {
        id: '4',
        date: '2025-01-09',
        time: '08:00:00',
        distance: 10.5,
        duration: '01:03:00',
        pace: '6:00',
        speed: '10',
        avgHR: 138,
        maxHR: 175,
        source: 'manual'
      }
    ];
    const ev = evaluateRunningTrophies({ runningSessions: sessions, garminById: new Map() });
    const byId = new Map(ev.results.map((r) => [r.id, r]));
    // Plus grande sortie 10,5 km : paliers distance ; élite 11 km non atteint → max = or
    expect(byId.get('run_5_once')?.highestLevel).toBe('gold');
    expect(byId.get('run_20_week')?.highestLevel).toBe('silver');
    expect(byId.get('run_3_week')?.highestLevel).toBe('bronze');
    const t10 = byId.get('run_10_once');
    expect(t10?.levels?.[0]?.unlocked).toBe(true);
    expect(t10?.levels?.[1]?.unlocked).toBe(false);
    expect(t10?.contributingSessions?.length).toBeGreaterThan(0);
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
    expect(byId.get('run_no_stop')?.highestLevel).toBe('bronze');
  });

  it('ne descend pas les paliers allure 10 km sous un plancher réaliste (évite 2:16/km type abus)', () => {
    const ev = evaluateRunningTrophies({ runningSessions: [], garminById: new Map() });
    const byId = new Map(ev.results.map((r) => [r.id, r]));
    const t10 = byId.get('10k_500');
    const elite = t10?.levels?.find((l) => l.level === 'elite');
    expect(inversePaceFloorSec('best10kPaceMaxSec')).toBe(158);
    expect(elite?.target).toBeGreaterThanOrEqual(158);
    expect(elite?.target).toBeLessThanOrEqual(300);
  });

  it('« 5 km sans arrêt » : sessions liées seulement ≥ 5 km sans pause Garmin', () => {
    const garminShort = {
      running: { laps: [{ distanceKm: 0.5, durationSeconds: 200, intervalTypeKey: 'ACTIVE' }] },
      movingDuration: 200,
      duration: 200
    };
    const garminLong = {
      running: { laps: [{ distanceKm: 5.2, durationSeconds: 1800, intervalTypeKey: 'ACTIVE' }] },
      movingDuration: 1800,
      duration: 1800
    };
    const sessions = [
      {
        id: 's1',
        garminId: 1,
        date: '2026-03-26',
        time: '10:54:00',
        distance: 0.5,
        duration: '00:03:20',
        pace: '6:40',
        avgHR: 150,
        maxHR: 170,
        source: 'garmin'
      },
      {
        id: 's2',
        garminId: 2,
        date: '2026-03-26',
        time: '11:06:00',
        distance: 5.2,
        duration: '00:30:08',
        pace: '5:48',
        avgHR: 160,
        maxHR: 180,
        source: 'garmin'
      }
    ];
    const garminById = new Map([
      ['1', garminShort],
      ['2', garminLong]
    ]);
    const ev = evaluateRunningTrophies({ runningSessions: sessions, garminById });
    const t = new Map(ev.results.map((r) => [r.id, r])).get('run_5_no_stop');
    expect(t?.contributingSessions?.length).toBe(1);
    expect(t.contributingSessions[0].distanceKm).toBeGreaterThanOrEqual(5);
  });

  it('détecte le fractionné via type session ou tours Garmin', () => {
    const sessions = [
      {
        id: 'a',
        date: '2026-03-23',
        time: '19:05:00',
        distance: 3.2,
        duration: '00:20:00',
        pace: '6:15',
        type: 'interval',
        avgHR: 155,
        maxHR: 180,
        source: 'manual'
      },
      {
        id: 'b',
        garminId: 50,
        date: '2026-03-24',
        time: '08:00:00',
        distance: 5,
        duration: '00:30:00',
        pace: '6:00',
        avgHR: 150,
        maxHR: 175,
        source: 'garmin'
      }
    ];
    const laps = [
      { distanceKm: 0.25, durationSeconds: 60, intervalTypeKey: 'ACTIVE' },
      { distanceKm: 0.1, durationSeconds: 60, intervalTypeKey: 'REST' },
      { distanceKm: 0.25, durationSeconds: 60, intervalTypeKey: 'ACTIVE' }
    ];
    const garminById = new Map([
      [
        '50',
        {
          running: { laps },
          movingDuration: 30 * 60,
          duration: 30 * 60
        }
      ]
    ]);
    const ev = evaluateRunningTrophies({ runningSessions: sessions, garminById });
    expect(ev.stats.intervalCount).toBeGreaterThanOrEqual(2);
  });

  it('« 4 runs/semaine pendant 2 mois » : une seule semaine chargée ne suffit pas', () => {
    const sessions = [
      {
        id: '1',
        date: '2026-03-23',
        time: '19:05:00',
        distance: 3.3,
        duration: '00:20:34',
        pace: '6:19',
        avgHR: 140,
        maxHR: 170,
        source: 'garmin'
      },
      {
        id: '2',
        date: '2026-03-26',
        time: '10:54:00',
        distance: 0.5,
        duration: '00:03:33',
        pace: '6:52',
        avgHR: 145,
        maxHR: 172,
        source: 'garmin'
      },
      {
        id: '3',
        date: '2026-03-26',
        time: '11:06:00',
        distance: 5.2,
        duration: '00:30:08',
        pace: '5:50',
        avgHR: 150,
        maxHR: 175,
        source: 'garmin'
      },
      {
        id: '4',
        date: '2026-03-29',
        time: '12:20:00',
        distance: 3.2,
        duration: '00:20:48',
        pace: '6:31',
        avgHR: 142,
        maxHR: 171,
        source: 'garmin'
      }
    ];
    const ev = evaluateRunningTrophies({ runningSessions: sessions, garminById: new Map() });
    const t = new Map(ev.results.map((r) => [r.id, r])).get('run_4_week_2m');
    expect(t?.levels?.[0]?.unlocked).toBe(false);
  });

  it('catalogue : trophées chaos retirés absents', () => {
    const ids = new Set(buildRunningTrophiesCatalog().map((x) => x.id));
    expect(ids.has('chaos_hills')).toBe(false);
    expect(ids.has('chaos_end')).toBe(false);
    expect(ids.has('chaos_no_pace')).toBe(false);
    expect(ids.has('chaos_ns_internal')).toBe(false);
  });

  it('améliorations d’allure : uniquement ≥ 5 km et meta « battait »', () => {
    const sessions = [
      {
        id: '1',
        date: '2026-03-01',
        time: '10:00:00',
        distance: 5,
        duration: '00:30:00',
        pace: '6:00',
        avgHR: 140,
        maxHR: 170,
        source: 'manual'
      },
      {
        id: '2',
        date: '2026-03-10',
        time: '10:00:00',
        distance: 1,
        duration: '00:05:21',
        pace: '5:21',
        avgHR: 145,
        maxHR: 175,
        source: 'manual'
      },
      {
        id: '3',
        date: '2026-03-20',
        time: '10:00:00',
        distance: 5,
        duration: '00:27:30',
        pace: '5:30',
        avgHR: 142,
        maxHR: 172,
        source: 'manual'
      }
    ];
    const ev = evaluateRunningTrophies({ runningSessions: sessions, garminById: new Map() });
    const t = new Map(ev.results.map((r) => [r.id, r])).get('run_improve');
    const prevLabels = (t?.contributingSessions || []).map((s) => s.prevPaceLabel).filter(Boolean);
    expect(prevLabels.length).toBeGreaterThan(0);
    expect(t.contributingSessions.every((s) => s.distanceKm >= 5)).toBe(true);
  });
});
