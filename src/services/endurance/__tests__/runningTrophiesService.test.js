import { describe, it, expect } from 'vitest';
import {
  evaluateRunningTrophies,
  inversePaceFloorSec,
  buildRunningTrophiesCatalog,
  describeRunningTrophyLevelRequirement,
  runningTrophyLevelXpReward,
  describeRunningTrophyCurrentProgress
} from '../runningTrophiesService';

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

  it('EF : cumul distance si FC moyenne uniquement sur Garmin (session sans avgHR)', () => {
    const sessions = [
      {
        id: 'efg',
        garminId: 4242,
        date: '2025-03-01',
        time: '09:00:00',
        distance: 4.2,
        duration: '00:26:00',
        pace: '6:12',
        source: 'garmin'
      }
    ];
    const garminById = new Map([
      [
        '4242',
        {
          garminId: 4242,
          avgHR: 128,
          maxHR: 190,
          duration: 26 * 60,
          running: { laps: [{ distanceKm: 1, durationSeconds: 360, intervalPhase: 'ACTIVE' }] }
        }
      ]
    ]);
    const ev = evaluateRunningTrophies({ runningSessions: sessions, garminById });
    const byId = new Map(ev.results.map((r) => [r.id, r]));
    const ef100 = byId.get('ef_100');
    expect(ef100).toBeTruthy();
    const bronze = ef100.levels.find((l) => l.level === 'bronze');
    expect(bronze?.value).toBeGreaterThanOrEqual(4.1);
    expect(bronze?.value).toBeLessThanOrEqual(4.3);
    const contrib = ef100.contributingSessions || [];
    expect(contrib.length).toBe(1);
    expect(contrib[0].avgHrBpm).toBe(128);
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

  it('Élites : trophée « simples » — chaque palier a un libellé de niveau (pas undefined)', () => {
    const sessions = [
      {
        id: '1',
        date: '2026-01-06',
        time: '08:00:00',
        distance: 6,
        duration: '00:36:00',
        pace: '6:00',
        avgHR: 140,
        maxHR: 175,
        source: 'manual'
      }
    ];
    const ev = evaluateRunningTrophies({ runningSessions: sessions, garminById: new Map() });
    const cs = ev.results.find((r) => r.id === 'complete_simples');
    expect(cs?.levels?.every((l) => typeof l.level === 'string' && l.level.length > 0)).toBe(true);
    const req = describeRunningTrophyLevelRequirement(cs, cs.levels[0].target, 'Bronze');
    expect(req).toMatch(/simple/i);
    expect(req).not.toMatch(/undefined/i);
  });

  it('Élites : allure 10 km — 0 % si aucune sortie ≥ 10 km', () => {
    const sessions = [
      {
        id: '1',
        date: '2026-01-06',
        time: '08:00:00',
        distance: 8,
        duration: '00:48:00',
        pace: '6:00',
        avgHR: 140,
        maxHR: 175,
        source: 'manual'
      }
    ];
    const ev = evaluateRunningTrophies({ runningSessions: sessions, garminById: new Map() });
    const t10 = new Map(ev.results.map((r) => [r.id, r])).get('10k_500');
    const bronze = t10?.levels?.find((l) => l.level === 'bronze');
    expect(bronze?.progress).toBe(0);
    expect(bronze?.unlocked).toBe(false);
  });

  it('Élites : libellé palier série = jours consécutifs, pas « fois »', () => {
    const trophy = { metric: 'streakDays', baseTarget: 7 };
    const txt = describeRunningTrophyLevelRequirement(trophy, 7, 'Bronze');
    expect(txt).toMatch(/jour/i);
    expect(txt).not.toMatch(/ fois/);
  });

  it('Game Boss : chrono 10 km — 0 % si aucune sortie ≥ 10 km', () => {
    const sessions = [
      {
        id: '1',
        date: '2026-01-06',
        time: '08:00:00',
        distance: 8,
        duration: '00:50:00',
        pace: '6:15',
        avgHR: 140,
        maxHR: 175,
        source: 'manual'
      }
    ];
    const ev = evaluateRunningTrophies({ runningSessions: sessions, garminById: new Map() });
    const t = new Map(ev.results.map((r) => [r.id, r])).get('boss_10k_50');
    const bronze = t?.levels?.find((l) => l.level === 'bronze');
    expect(bronze?.progress).toBe(0);
    expect(bronze?.unlocked).toBe(false);
  });

  it('Game Boss : chrono 5 km — durée minimale parmi sorties ≥ 5 km (ex. 6 km en 30:08)', () => {
    const sessions = [
      {
        id: '1',
        date: '2026-01-06',
        time: '08:00:00',
        distance: 6,
        duration: '00:30:08',
        pace: '5:01',
        avgHR: 140,
        maxHR: 175,
        source: 'manual'
      }
    ];
    const ev = evaluateRunningTrophies({ runningSessions: sessions, garminById: new Map() });
    const t = new Map(ev.results.map((r) => [r.id, r])).get('boss_5k_20');
    const bronze = t?.levels?.find((l) => l.level === 'bronze');
    expect(bronze?.progress).toBeGreaterThan(0.6);
    expect(bronze?.progress).toBeLessThan(0.7);
  });

  it('Game Boss : palier negative split mentionne marathon', () => {
    const trophy = { metric: 'marathonNegativeSplit', baseTarget: 1 };
    const txt = describeRunningTrophyLevelRequirement(trophy, 2, 'Argent');
    expect(txt).toMatch(/marathon/i);
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

  it('Endurance extrême : 3 sorties ≥15 km dans une fenêtre glissante de 7×24 h', () => {
    const sessions = [
      {
        id: 'l1',
        date: '2026-06-01',
        time: '08:00:00',
        distance: 16,
        duration: '01:30:00',
        pace: '5:38',
        avgHR: 140,
        maxHR: 175,
        source: 'manual'
      },
      {
        id: 'l2',
        date: '2026-06-04',
        time: '08:00:00',
        distance: 16,
        duration: '01:30:00',
        pace: '5:38',
        avgHR: 140,
        maxHR: 175,
        source: 'manual'
      },
      {
        id: 'l3',
        date: '2026-06-06',
        time: '08:00:00',
        distance: 16,
        duration: '01:30:00',
        pace: '5:38',
        avgHR: 140,
        maxHR: 175,
        source: 'manual'
      }
    ];
    const ev = evaluateRunningTrophies({ runningSessions: sessions, garminById: new Map() });
    const two = new Map(ev.results.map((r) => [r.id, r])).get('two_long_week');
    expect(two?.levels?.find((l) => l.level === 'bronze')?.value).toBeGreaterThanOrEqual(3);
    expect(two?.contributingHint || '').toMatch(/7/);
  });

  it('Endurance extrême : 50 km / semaine ISO = somme des sorties de la semaine record', () => {
    const sessions = [
      {
        id: 'w1',
        date: '2026-02-02',
        time: '07:00:00',
        distance: 30,
        duration: '02:00:00',
        pace: '4:00',
        avgHR: 150,
        maxHR: 178,
        source: 'manual'
      },
      {
        id: 'w2',
        date: '2026-02-03',
        time: '07:00:00',
        distance: 22,
        duration: '01:30:00',
        pace: '4:05',
        avgHR: 148,
        maxHR: 176,
        source: 'manual'
      }
    ];
    const ev = evaluateRunningTrophies({ runningSessions: sessions, garminById: new Map() });
    const wk = new Map(ev.results.map((r) => [r.id, r])).get('run_50_week');
    expect(wk?.levels?.find((l) => l.level === 'bronze')?.value).toBeGreaterThanOrEqual(50);
    const sumContribKm = (wk?.contributingSessions || []).reduce((s, x) => s + (Number(x.distanceKm) || 0), 0);
    expect(sumContribKm).toBeGreaterThanOrEqual(51.9);
    expect(sumContribKm).toBeLessThanOrEqual(52.1);
  });

  it('Endurance extrême : 1h30 / 2h / 3h sans arrêt partagent la même valeur « actuelle »', () => {
    const sessions = [
      {
        id: 'c1',
        date: '2026-05-01',
        time: '09:00:00',
        distance: 15,
        duration: '01:30:08',
        pace: '6:01',
        avgHR: 135,
        maxHR: 170,
        source: 'manual'
      }
    ];
    const ev = evaluateRunningTrophies({ runningSessions: sessions, garminById: new Map() });
    const by = (id) => new Map(ev.results.map((r) => [r.id, r])).get(id);
    const v130 = by('run_130')?.levels?.find((l) => l.level === 'bronze')?.value;
    const v2h = by('run_2h')?.levels?.find((l) => l.level === 'bronze')?.value;
    const v3h = by('run_3h')?.levels?.find((l) => l.level === 'bronze')?.value;
    expect(v130).toBe(v2h);
    expect(v2h).toBe(v3h);
    expect(v130).toBeGreaterThanOrEqual(90);
  });

  it('Fractionné évolutif : gabarit 6×1, XP élite, paliers 1→4, encart et sessions liées alignés', () => {
    const mkLap = (intervalTypeKey, durationSeconds, distanceKm) => ({
      intervalTypeKey,
      durationSeconds,
      distanceKm
    });
    const laps = [];
    for (let i = 0; i < 6; i += 1) {
      laps.push(mkLap('INTERVAL_ACTIVE', 60, 0.25));
      laps.push(mkLap('INTERVAL_REST', 60, 0.2));
    }
    const sessions = [
      {
        id: 'int6',
        garminId: 7001,
        date: '2026-06-01',
        time: '07:00:00',
        distance: 3.2,
        duration: '00:24:00',
        pace: '7:30',
        avgHR: 150,
        maxHR: 175,
        source: 'garmin'
      }
    ];
    const garminById = new Map([
      [
        '7001',
        {
          garminId: 7001,
          duration: 24 * 60,
          movingDuration: 24 * 60,
          running: { laps }
        }
      ]
    ]);
    const ev = evaluateRunningTrophies({ runningSessions: sessions, garminById });
    const byId = new Map(ev.results.map((r) => [r.id, r]));
    const int61 = byId.get('int_6x1');
    expect(int61?.levels?.find((l) => l.level === 'bronze')?.unlocked).toBe(true);
    expect(int61?.levels?.find((l) => l.level === 'silver')?.unlocked).toBe(false);
    expect(int61?.contributingSessions?.length).toBe(1);
    expect(runningTrophyLevelXpReward('elite', 'bronze')).toBe(640);
    expect(runningTrophyLevelXpReward('elite', 'silver')).toBe(794);
    expect(runningTrophyLevelXpReward('elite', 'gold')).toBe(973);
    expect(runningTrophyLevelXpReward('elite', 'elite')).toBe(1248);
    const stats = ev.stats;
    expect(describeRunningTrophyCurrentProgress(int61, stats)).toBe('Détections / score courant : 1');
  });

  it('Fractionné sans arrêt actif : refuse si aucun tour récup/cooldown (même type « interval »)', () => {
    const laps = [];
    for (let i = 0; i < 6; i += 1) {
      laps.push({
        intervalTypeKey: 'INTERVAL_ACTIVE',
        durationSeconds: 60,
        distanceKm: 0.25
      });
    }
    const sessions = [
      {
        id: 'noRec',
        garminId: 7002,
        date: '2026-06-02',
        time: '07:00:00',
        distance: 2.5,
        duration: '00:18:00',
        pace: '7:12',
        avgHR: 148,
        maxHR: 172,
        source: 'garmin',
        type: 'interval'
      }
    ];
    const garminById = new Map([
      [
        '7002',
        {
          garminId: 7002,
          duration: 18 * 60,
          movingDuration: 18 * 60,
          running: { laps }
        }
      ]
    ]);
    const ev = evaluateRunningTrophies({ runningSessions: sessions, garminById });
    const byId = new Map(ev.results.map((r) => [r.id, r]));
    expect(byId.get('int_no_active_stop')?.levels?.find((l) => l.level === 'bronze')?.unlocked).toBe(false);
  });

  it('Fractionné chaos : stats, paliers 1→4, encart et sessions liées = mêmes détecteurs que le compteur', () => {
    const mk = (intervalTypeKey, durationSeconds, distanceKm, lapHr) => {
      const lap = { intervalTypeKey, durationSeconds, distanceKm };
      if (lapHr != null) lap.avgHeartRate = lapHr;
      return lap;
    };

    /** 5 km fartlek : forte variabilité d’allure + tours intervalle */
    const laps5k = [];
    for (let i = 0; i < 10; i += 1) {
      const active = i % 2 === 0;
      laps5k.push(
        active
          ? mk('INTERVAL_ACTIVE', i === 0 ? 165 : i === 2 ? 220 : i === 4 ? 275 : i === 6 ? 200 : 240, 0.55)
          : mk('INTERVAL_REST', 120, 0.45)
      );
    }

    /** ~30 min : médiane des durées de segment ~2 min */
    const laps30m = [];
    for (let i = 0; i < 15; i += 1) {
      laps30m.push(
        i % 2 === 0 ? mk('INTERVAL_ACTIVE', 120, 0.5) : mk('INTERVAL_REST', 90, 0.35)
      );
    }

    /** ~10 km : ≥ 14 segments, distance médiane ~500 m */
    const laps10k = [];
    for (let i = 0; i < 20; i += 1) {
      laps10k.push(
        i % 2 === 0 ? mk('INTERVAL_ACTIVE', 120, 0.5) : mk('INTERVAL_REST', 90, 0.45)
      );
    }

    /** FC « plafonnée » : moyenne nettement sous le max (seuil 82 %) */
    const lapsHr = [
      mk('INTERVAL_ACTIVE', 300, 1.0, 140),
      mk('INTERVAL_REST', 120, 0.4, 130),
      mk('INTERVAL_ACTIVE', 280, 1.0, 138),
      mk('INTERVAL_REST', 120, 0.4, 125)
    ];

    /** ~1 km actif : micro-reps + accélérations enchaînées */
    const laps1k = [];
    const dsSeq = [84, 82, 80, 78, 76, 74];
    dsSeq.forEach((ds) => laps1k.push(mk('INTERVAL_ACTIVE', ds, 0.15)));
    laps1k.push(mk('INTERVAL_REST', 180, 0.2));

    const sessions = [
      {
        id: 'ch5',
        garminId: 7105,
        date: '2026-07-01',
        time: '06:00:00',
        distance: 5.5,
        duration: '00:32:00',
        pace: '5:49',
        avgHR: 152,
        maxHR: 178,
        source: 'garmin'
      },
      {
        id: 'ch30',
        garminId: 7106,
        date: '2026-07-02',
        time: '06:00:00',
        distance: 8,
        duration: '00:30:00',
        pace: '3:45',
        avgHR: 155,
        maxHR: 179,
        source: 'garmin'
      },
      {
        id: 'ch10',
        garminId: 7107,
        date: '2026-07-03',
        time: '06:00:00',
        distance: 10,
        duration: '01:05:00',
        pace: '6:30',
        avgHR: 158,
        maxHR: 182,
        source: 'garmin'
      },
      {
        id: 'chHr',
        garminId: 7108,
        date: '2026-07-04',
        time: '06:00:00',
        distance: 7.5,
        duration: '00:40:00',
        pace: '5:20',
        avgHR: 135,
        maxHR: 180,
        source: 'garmin'
      },
      {
        id: 'ch1k',
        garminId: 7109,
        date: '2026-07-05',
        time: '06:00:00',
        distance: 1.2,
        duration: '00:09:30',
        pace: '7:55',
        avgHR: 150,
        maxHR: 172,
        source: 'garmin'
      }
    ];

    const garminById = new Map([
      ['7105', { garminId: 7105, duration: 32 * 60, movingDuration: 32 * 60, running: { laps: laps5k } }],
      ['7106', { garminId: 7106, duration: 30 * 60, movingDuration: 30 * 60, running: { laps: laps30m } }],
      ['7107', { garminId: 7107, duration: 65 * 60, movingDuration: 65 * 60, running: { laps: laps10k } }],
      ['7108', { garminId: 7108, duration: 40 * 60, movingDuration: 40 * 60, running: { laps: lapsHr } }],
      ['7109', { garminId: 7109, duration: 10 * 60, movingDuration: 10 * 60, running: { laps: laps1k } }]
    ]);

    const ev = evaluateRunningTrophies({ runningSessions: sessions, garminById });
    const byId = new Map(ev.results.map((r) => [r.id, r]));
    const stats = ev.stats;

    const chaosIds = [
      ['chaos_1k_active', 'ch1k', 'chaos1kCount'],
      ['chaos_5k_fartlek', 'ch5', 'chaos5kCount'],
      ['chaos_10k_500m', 'ch10', 'chaos10kCount'],
      ['chaos_30m_2m', 'ch30', 'chaos30mCount'],
      ['chaos_hr_cap', 'chHr', 'chaosHrCount']
    ];

    chaosIds.forEach(([trophyId, sessionId, statKey]) => {
      const row = byId.get(trophyId);
      expect(row?.levels?.find((l) => l.level === 'bronze')?.unlocked).toBe(true);
      expect(stats[statKey]).toBe(1);
      expect(describeRunningTrophyCurrentProgress(row, stats)).toBe('Détections / score courant : 1');
      expect(row?.contributingSessions?.map((s) => s.id)).toEqual([sessionId]);
      const silver = row?.levels?.find((l) => l.level === 'silver');
      expect(silver?.target).toBe(2);
      expect(silver?.unlocked).toBe(false);
    });
  });

  it('EF avancé : mois 80 % — sessions liées limitées aux mois qualifiés', () => {
    const mk = (id, date, hr, garminId) => ({
      id,
      garminId,
      date,
      time: '08:00:00',
      distance: 5,
      duration: '00:35:00',
      pace: '7:00',
      avgHR: hr,
      maxHR: 180,
      source: 'garmin',
      type: 'endurance'
    });
    const sessions = [];
    for (let i = 0; i < 8; i += 1) {
      sessions.push(mk(`m${i}`, `2026-03-${String(i + 1).padStart(2, '0')}`, 120, 8000 + i));
    }
    sessions.push({
      id: 'apr',
      garminId: 8099,
      date: '2026-04-02',
      time: '08:00:00',
      distance: 5,
      duration: '00:35:00',
      pace: '7:00',
      avgHR: 120,
      maxHR: 180,
      source: 'garmin',
      type: 'endurance'
    });
    const garminById = new Map();
    sessions.forEach((s) => {
      if (s.garminId == null) return;
      garminById.set(String(s.garminId), {
        garminId: s.garminId,
        duration: 35 * 60,
        movingDuration: 35 * 60,
        running: { laps: [{ distanceKm: 5, durationSeconds: 2100, intervalTypeKey: 'ACTIVE' }] }
      });
    });
    const ev = evaluateRunningTrophies({ runningSessions: sessions, garminById });
    const row = new Map(ev.results.map((r) => [r.id, r])).get('ef_month_80');
    expect(ev.stats.efMonthEightyCount).toBeGreaterThanOrEqual(1);
    const ids = new Set((row?.contributingSessions || []).map((x) => x.id));
    expect(ids.has('apr')).toBe(false);
    expect(ids.size).toBe(8);
  });

  it('EF avancé : trophé aube + volume hebdo 30 km sur données synthétiques', () => {
    const garminById = new Map([
      [
        '9001',
        {
          garminId: 9001,
          duration: 40 * 60,
          movingDuration: 40 * 60,
          running: { laps: [{ distanceKm: 6, durationSeconds: 2400, intervalTypeKey: 'ACTIVE' }] }
        }
      ]
    ]);
    const sessions = [
      {
        id: 'd1',
        garminId: 9001,
        date: '2026-08-01',
        time: '06:30:00',
        distance: 6,
        duration: '00:40:00',
        pace: '6:40',
        avgHR: 120,
        maxHR: 180,
        source: 'garmin',
        type: 'endurance'
      }
    ];
    const ev = evaluateRunningTrophies({ runningSessions: sessions, garminById });
    const byId = new Map(ev.results.map((r) => [r.id, r]));
    expect(byId.get('ef_ad_dawn')?.levels?.find((l) => l.level === 'bronze')?.unlocked).toBe(true);
    expect(ev.stats.efDawnCount).toBe(1);
  });

  it('Endurance extrême : paliers distance EF unique (15 / 25 / 30 km) sur la même plus longue sortie EF', () => {
    const sessions = [
      {
        id: 'e1',
        date: '2026-04-10',
        time: '10:00:00',
        distance: 3.2,
        duration: '00:21:00',
        pace: '6:34',
        avgHR: 128,
        maxHR: 190,
        source: 'manual'
      }
    ];
    const ev = evaluateRunningTrophies({ runningSessions: sessions, garminById: new Map() });
    const by = (id) => new Map(ev.results.map((r) => [r.id, r])).get(id);
    const v15 = by('ef_15k')?.levels?.find((l) => l.level === 'bronze')?.value;
    const v25 = by('ef_25k')?.levels?.find((l) => l.level === 'bronze')?.value;
    expect(v15).toBe(v25);
    expect(v15).toBeGreaterThanOrEqual(3.1);
    expect(v15).toBeLessThanOrEqual(3.3);
    const silver15 = by('ef_15k')?.levels?.find((l) => l.level === 'silver')?.target;
    expect(silver15).toBeGreaterThanOrEqual(20.2);
    expect(silver15).toBeLessThanOrEqual(20.3);
  });
});
