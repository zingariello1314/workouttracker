import { describe, expect, it } from 'vitest';
import {
  formatSleepHoursFr,
  pairSessionsWithNights,
  publishSleepCandidates,
  sleepDeepStability,
  sleepEfficiencyControlled,
  sleepFamilySensitivity,
  sleepLagJ2,
  sleepTripleCondition,
  sleepVolumeByThreshold,
  sleepHighDayShare,
  sleepIntensityByDensity,
  sleepCardioByThreshold,
  sleepPerceivedEffort,
  sleepPerformanceLead,
  sleepPrevLoadInteraction,
  sleepWeekFrequency,
  sleepWindowConcentration,
  summarizeRecentNights
} from '../recapSleepCorrelation';

function sess(date, reps, hours, extra = {}) {
  return {
    date,
    totalReps: reps,
    minutes: extra.minutes ?? 60,
    sleepHours: hours,
    hoursJ2: extra.hoursJ2,
    prevDayReps: extra.prevDayReps ?? 0,
    efficiency: extra.efficiency,
    exercises: extra.exercises,
    night: {
      hours,
      deepMin: extra.deep ?? 60,
      remMin: extra.rem ?? 80,
      lightMin: extra.light ?? 280,
      awakeMin: extra.awake ?? 20,
      bodyBatteryCharged: extra.bb ?? 50,
      efficiency: extra.efficiency ?? null
    },
    nightJ2: extra.hoursJ2 != null ? { hours: extra.hoursJ2 } : null
  };
}

describe('recapSleepCorrelation', () => {
  it('reste silencieux s’il n’y a pas assez de nuits — aucun message', () => {
    expect(publishSleepCandidates([sess('2026-08-31', 360, 7.8)])).toEqual([]);
    expect(publishSleepCandidates([])).toEqual([]);
  });

  it('publie un seuil 7 h 30 seulement si l’écart est réel et n suffisant', () => {
    const catalog = [];
    for (let i = 0; i < 5; i += 1) {
      catalog.push(sess(`2026-08-0${i + 1}`, 340 + i, 7.8, { minutes: 65, awake: 18, rem: 90, bb: 54 }));
    }
    for (let i = 0; i < 5; i += 1) {
      catalog.push(sess(`2026-08-1${i + 1}`, 220 + i, 6.6, { minutes: 48, awake: 40, rem: 60, bb: 36 }));
    }
    const vol = sleepVolumeByThreshold(pairSessionsWithNights(catalog), 7.5);
    expect(vol).toBeTruthy();
    expect(vol.highVol).toBeGreaterThan(vol.lowVol);
    expect(vol.deltaPct).toBeGreaterThan(20);
    const published = publishSleepCandidates(catalog);
    expect(published.some((c) => c.type === 'sleep_volume_threshold')).toBe(true);
    expect(published.every((c) => c.type !== 'message')).toBe(true);
  });

  it('formate 7,77 h en 7 h 46', () => {
    expect(formatSleepHoursFr(7.77)).toMatch(/7 h 4[56]/);
  });

  it('résume les nuits récentes sans inventer de phases absentes', () => {
    const sum = summarizeRecentNights([
      { hours: 8.0, deepMin: 70, remMin: 90, awakeMin: 15, sleepHr: 56, bodyBatteryCharged: 52 },
      { hours: 7.5, deepMin: 62, remMin: 80, awakeMin: 22, sleepHr: 58, bodyBatteryCharged: 44 },
      { hours: 7.8, deepMin: 66, remMin: 85, awakeMin: 18, sleepHr: 57, bodyBatteryCharged: 48 },
      { hours: 6.7, remMin: 50, sleepHr: 60 }
    ]);
    expect(sum.n).toBe(4);
    expect(sum.hours).toBeGreaterThan(7);
    expect(sum.deepMin).toBeGreaterThan(60);
    expect(sum.bbCharged).toBeGreaterThan(40);
  });

  it('publie l’efficacité seulement à durée comparable, sinon silence', () => {
    const catalog = [];
    for (let i = 0; i < 5; i += 1) {
      catalog.push(sess(`2026-08-0${i + 1}`, 340, 7.7, { efficiency: 93 }));
    }
    for (let i = 0; i < 5; i += 1) {
      catalog.push(sess(`2026-08-1${i + 1}`, 250, 7.6, { efficiency: 82 }));
    }
    const eff = sleepEfficiencyControlled(pairSessionsWithNights(catalog));
    expect(eff).toBeTruthy();
    expect(eff.highVol).toBeGreaterThan(eff.lowVol);
    expect(sleepEfficiencyControlled(pairSessionsWithNights(catalog.slice(0, 3)))).toBeNull();
  });

  it('sépare poussée et tirage après une nuit courte', () => {
    const catalog = [];
    for (let i = 0; i < 5; i += 1) {
      catalog.push(
        sess(`2026-08-0${i + 1}`, 280, 7.8, {
          exercises: [
            { id: '1', name: 'Dips parallèles', reps: 140 },
            { id: '2', name: 'Tractions pronation', reps: 140 }
          ]
        })
      );
    }
    for (let i = 0; i < 5; i += 1) {
      catalog.push(
        sess(`2026-08-1${i + 1}`, 220, 6.4, {
          exercises: [
            { id: '1', name: 'Dips parallèles', reps: 130 },
            { id: '2', name: 'Tractions pronation', reps: 90 }
          ]
        })
      );
    }
    const fam = sleepFamilySensitivity(pairSessionsWithNights(catalog));
    expect(fam).toBeTruthy();
    expect(fam.sensitive).toBe('tirage');
    expect(fam.pullRetain).toBeLessThan(fam.pushRetain);
  });

  it('isole J-2 sans confondre avec la séance précédente', () => {
    const catalog = [];
    for (let i = 0; i < 4; i += 1) {
      catalog.push(sess(`2026-07-0${i + 1}`, 240, 7.8, { hoursJ2: 6.4 }));
    }
    for (let i = 0; i < 4; i += 1) {
      catalog.push(sess(`2026-07-1${i + 1}`, 340, 7.8, { hoursJ2: 7.8 }));
    }
    const j2 = sleepLagJ2(pairSessionsWithNights(catalog));
    expect(j2).toBeTruthy();
    expect(j2.isolatedVol).toBeLessThan(j2.okVol);
  });

  it('publie le trio durée + efficacité + deux nuits seulement si l’écart tient', () => {
    const catalog = [];
    for (let i = 0; i < 4; i += 1) {
      catalog.push(sess(`2026-06-0${i + 1}`, 330, 7.9, { efficiency: 93, hoursJ2: 7.8 }));
    }
    for (let i = 0; i < 5; i += 1) {
      catalog.push(sess(`2026-06-1${i + 1}`, 240, 7.2, { efficiency: 84, hoursJ2: 6.5 }));
    }
    const combo = sleepTripleCondition(pairSessionsWithNights(catalog));
    expect(combo).toBeTruthy();
    expect(combo.okVol).toBeGreaterThan(combo.restVol);
  });

  it('concentre le volume de la semaine derrière un petit nombre de nuits', () => {
    const conc = sleepWindowConcentration({
      trainedPairs: [
        { hours: 7.77, totalReps: 360 },
        { hours: 8.2, totalReps: 329 },
        { hours: 7.07, totalReps: 360 }
      ],
      allNights: [
        { hours: 7.77 },
        { hours: 8.2 },
        { hours: 7.07 },
        { hours: 6.8 },
        { hours: 7.1 },
        { hours: 6.9 },
        { hours: 7.2 }
      ],
      vs: 'nights'
    });
    expect(conc).toBeTruthy();
    expect(conc.volShare).toBeGreaterThan(60);
    expect(conc.nightShare).toBeLessThan(40);
    expect(sleepWindowConcentration({ trainedPairs: [{ hours: 8, totalReps: 360 }], vs: 'nights' })).toBeNull();
  });

  it('détecte un profond stable alors que la durée totale bouge', () => {
    const stab = sleepDeepStability([
      { hours: 6.7, deepMin: 54, remMin: 68 },
      { hours: 7.1, deepMin: 62, remMin: 72 },
      { hours: 7.8, deepMin: 70, remMin: 90 },
      { hours: 8.2, deepMin: 78, remMin: 106 }
    ]);
    expect(stab).toBeTruthy();
    expect(stab.deepMax - stab.deepMin).toBeLessThan(40);
    expect(sleepDeepStability([{ hours: 7.5, deepMin: 60 }])).toBeNull();
  });

  it('associe une nuit courte + charge élevée la veille à un volume plus bas', () => {
    const catalog = [];
    for (let i = 0; i < 4; i += 1) {
      catalog.push(sess(`2026-05-0${i + 1}`, 200, 6.4, { prevDayReps: 340 }));
    }
    for (let i = 0; i < 4; i += 1) {
      catalog.push(sess(`2026-05-1${i + 1}`, 310, 6.4, { prevDayReps: 0 }));
    }
    const load = sleepPrevLoadInteraction(pairSessionsWithNights(catalog));
    expect(load).toBeTruthy();
    expect(load.shortHeavyVol).toBeLessThan(load.shortLightVol);
    expect(sleepPrevLoadInteraction(pairSessionsWithNights(catalog.slice(0, 2)))).toBeNull();
  });

  it('surreprésente les nuits ≥ 7 h 30 devant les journées ≥ 300 reps', () => {
    const pairs = [];
    for (let i = 0; i < 8; i += 1) {
      pairs.push({ hours: i === 7 ? 6.8 : 7.8, totalReps: 320 });
    }
    for (let i = 0; i < 4; i += 1) {
      pairs.push({ hours: 6.5, totalReps: 160 });
    }
    const nights = [
      ...Array.from({ length: 10 }, () => ({ hours: 7.8 })),
      ...Array.from({ length: 10 }, () => ({ hours: 6.8 }))
    ];
    const share = sleepHighDayShare(pairs, nights);
    expect(share).toBeTruthy();
    expect(share.highShare).toBeGreaterThan(share.nightShare + 10);
    expect(sleepHighDayShare(pairs.slice(0, 3), nights)).toBeNull();
  });

  it('relie les semaines à nuits longues à plus de jours actifs', () => {
    const nights = [];
    const trained = [];
    for (let w = 0; w < 4; w += 1) {
      const monday = `2026-06-${String(1 + w * 7).padStart(2, '0')}`;
      for (let d = 0; d < 7; d += 1) {
        const ymd = `2026-06-${String(1 + w * 7 + d).padStart(2, '0')}`;
        nights.push({ ymd, hours: d < 5 ? 7.8 : 7.2 });
        if (d < 4) trained.push({ date: ymd, totalReps: 300 });
      }
    }
    for (let w = 0; w < 3; w += 1) {
      for (let d = 0; d < 7; d += 1) {
        const ymd = `2026-07-${String(6 + w * 7 + d).padStart(2, '0')}`;
        nights.push({ ymd, hours: d < 2 ? 7.6 : 6.6 });
        if (d < 2) trained.push({ date: ymd, totalReps: 220 });
      }
    }
    const freq = sleepWeekFrequency(trained, nights);
    expect(freq).toBeTruthy();
    expect(freq.highDays).toBeGreaterThan(freq.lowDays);
  });

  it('publie une densité de séance plus élevée après les nuits longues', () => {
    const catalog = [];
    for (let i = 0; i < 5; i += 1) {
      catalog.push(sess(`2026-04-0${i + 1}`, 360, 7.8, { minutes: 65 }));
    }
    for (let i = 0; i < 5; i += 1) {
      catalog.push(sess(`2026-04-1${i + 1}`, 200, 6.4, { minutes: 48 }));
    }
    const dens = sleepIntensityByDensity(pairSessionsWithNights(catalog));
    expect(dens).toBeTruthy();
    expect(dens.highDens).toBeGreaterThan(dens.lowDens);
    expect(sleepIntensityByDensity(pairSessionsWithNights(catalog.slice(0, 2)))).toBeNull();
  });

  it('associe les nuits longues à des sorties plus longues, sinon silence', () => {
    const runs = [];
    for (let i = 0; i < 4; i += 1) {
      runs.push({ date: `2026-03-0${i + 1}`, hours: 7.8, km: 8.2, pace: 5.6 });
    }
    for (let i = 0; i < 4; i += 1) {
      runs.push({ date: `2026-03-1${i + 1}`, hours: 6.4, km: 5.1, pace: 6.4 });
    }
    const cardio = sleepCardioByThreshold(runs);
    expect(cardio).toBeTruthy();
    expect(cardio.highKm).toBeGreaterThan(cardio.lowKm);
    expect(cardio.highPace).toBeLessThan(cardio.lowPace);
    expect(sleepCardioByThreshold(runs.slice(0, 2))).toBeNull();
  });

  it('sépare performance d’un mouvement et volume total, ou se tait', () => {
    const catalog = [];
    for (let i = 0; i < 5; i += 1) {
      catalog.push(
        sess(`2026-02-0${i + 1}`, 360, 7.8, {
          exercises: [{ id: '1', name: 'Dips parallèles', reps: 48 }]
        })
      );
    }
    for (let i = 0; i < 5; i += 1) {
      catalog.push(
        sess(`2026-02-1${i + 1}`, 200, 6.4, {
          exercises: [{ id: '1', name: 'Dips parallèles', reps: 44 }]
        })
      );
    }
    const perf = sleepPerformanceLead(pairSessionsWithNights(catalog));
    expect(perf).toBeTruthy();
    expect(perf.volumeDominates).toBe(true);
  });

  it('publie l’effort perçu seulement s’il y a des notes, sinon silence', () => {
    const catalog = [];
    const diffs = [];
    for (let i = 0; i < 4; i += 1) {
      catalog.push(sess(`2026-01-0${i + 1}`, 300, 7.8));
      diffs.push({ date: `2026-01-0${i + 1}`, difficulty: 2.2 });
    }
    for (let i = 0; i < 4; i += 1) {
      catalog.push(sess(`2026-01-1${i + 1}`, 220, 6.4));
      diffs.push({ date: `2026-01-1${i + 1}`, difficulty: 4.1 });
    }
    const rpe = sleepPerceivedEffort(pairSessionsWithNights(catalog), diffs);
    expect(rpe).toBeTruthy();
    expect(rpe.lowDiff).toBeGreaterThan(rpe.highDiff);
    expect(sleepPerceivedEffort(pairSessionsWithNights(catalog), [])).toBeNull();
  });
});
