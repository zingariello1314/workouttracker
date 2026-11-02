import { describe, expect, it } from 'vitest';
import {
  buildChronologicalMonths,
  buildMonthlyVolumeArcDiscoveries,
  buildRunningGapDiscoveries,
  detectMonthlyVolumeArcShape,
  isIncompleteRecentMonth
} from '../monthlyVolumeArcDiscoveries';

function fillMonth(ym, trainingDays, repsPerDay) {
  const [y, m] = ym.split('-').map(Number);
  const out = {};
  let placed = 0;
  for (let d = 1; d <= 28 && placed < trainingDays; d += 1) {
    const ymd = `${ym}-${String(d).padStart(2, '0')}`;
    out[ymd] = repsPerDay;
    placed += 1;
  }
  return out;
}

describe('monthlyVolumeArcDiscoveries', () => {
  it('détecte une baisse dominée par la fréquence (jours ↓, rpd ~plat)', () => {
    const repsByDate = {
      ...fillMonth('2026-06', 22, 316),
      ...fillMonth('2026-07', 20, 300),
      ...fillMonth('2026-08', 17, 320),
      ...fillMonth('2026-09', 13, 287)
    };
    const months = buildChronologicalMonths(repsByDate);
    const shape = detectMonthlyVolumeArcShape(months, { windowEndYmd: '2026-09-30' });
    expect(shape).toBeTruthy();
    expect(shape.arcKind).toBe('prolonged_decline');
    expect(shape.peak.ym).toBe('2026-06');
    expect(shape.trough.ym).toBe('2026-09');
    expect(shape.mechanism.freqShare).toBeGreaterThan(0.5);
    const discs = buildMonthlyVolumeArcDiscoveries(repsByDate, { windowEndYmd: '2026-09-30' });
    expect(discs[0].kind).toBe('disc_monthly_volume_arc');
    expect(discs[0].title.toLowerCase()).toMatch(/fréquence|recul/);
    expect(discs[0].body).toMatch(/juin|septembre/i);
    expect(discs[0].metrics.trajectoryOk).toBe(true);
  });

  it('détecte une reprise partielle sans la présenter comme retour au sommet', () => {
    const repsByDate = {
      ...fillMonth('2026-06', 22, 316),
      ...fillMonth('2026-07', 20, 300),
      ...fillMonth('2026-08', 17, 320),
      ...fillMonth('2026-09', 13, 287),
      ...fillMonth('2026-10', 14, 312)
    };
    const shape = detectMonthlyVolumeArcShape(buildChronologicalMonths(repsByDate), {
      windowEndYmd: '2026-10-31'
    });
    expect(shape.arcKind).toBe('partial_recovery');
    expect(shape.recent.ym).toBe('2026-10');
    expect(shape.recent.reps).toBeLessThan(shape.peak.reps);
    const disc = buildMonthlyVolumeArcDiscoveries(repsByDate, { windowEndYmd: '2026-10-31' })[0];
    expect(disc.title.toLowerCase()).toMatch(/interrompt|baisse|octobre/);
    expect(disc.body.toLowerCase()).toMatch(/sans retrouver|sommet|juin/);
    expect(disc.body).not.toMatch(/% du mouvement mesurable/);
  });

  it('aligne les jours sur le calendrier (exclut GTG sync partiel) — cas octobre 16→12', () => {
    // 12 jours calendrier + 4 jours GTG sync partiel (reps > 0 mais hors crédit calendrier).
    const calendarOct = [
      '2026-10-02',
      '2026-10-12',
      '2026-10-13',
      '2026-10-14',
      '2026-10-16',
      '2026-10-17',
      '2026-10-19',
      '2026-10-20',
      '2026-10-24',
      '2026-10-26',
      '2026-10-27',
      '2026-10-30'
    ];
    const gtgOnly = ['2026-10-01', '2026-10-03', '2026-10-06', '2026-10-15'];
    const repsByDate = {
      ...fillMonth('2026-06', 22, 316),
      ...fillMonth('2026-09', 13, 287),
      ...Object.fromEntries(calendarOct.map((d) => [d, 340])),
      ...Object.fromEntries(gtgOnly.map((d) => [d, 19]))
    };
    const calendarSet = new Set(calendarOct);
    const gtgSet = new Set(gtgOnly);
    // Hors octobre : tout jour avec reps compte ; en octobre : calendrier uniquement.
    const isTrainingDay = (ymd) => {
      if (gtgSet.has(ymd)) return false;
      if (ymd.startsWith('2026-10')) return calendarSet.has(ymd);
      return (Number(repsByDate[ymd]) || 0) > 0;
    };
    const months = buildChronologicalMonths(repsByDate, { isTrainingDay });
    const oct = months.find((m) => m.ym === '2026-10');
    expect(oct.days).toBe(12);
    expect(oct.dayBasis).toBe('calendar_training');
    expect(oct.reps).toBe(12 * 340);
    expect(oct.excludedPositiveRepDays).toBe(4);
    const positiveOnly = buildChronologicalMonths(repsByDate);
    const octPos = positiveOnly.find((m) => m.ym === '2026-10');
    expect(octPos.days).toBe(16);
    const disc = buildMonthlyVolumeArcDiscoveries(repsByDate, {
      windowEndYmd: '2026-10-31',
      isTrainingDay
    })[0];
    expect(disc.metrics.recentDays).toBe(12);
    expect(disc.metrics.dayBasis).toBe('calendar_training');
    expect(disc.metrics.recentReps).toBe(12 * 340);
    expect(String(disc.metrics.recentDays)).toBe('12');
    expect(disc.body).not.toMatch(/16 jours/);
  });

  it('n’interprète pas un mois courant quasi vide comme une chute', () => {
    const repsByDate = {
      ...fillMonth('2026-08', 17, 320),
      ...fillMonth('2026-09', 13, 287),
      ...fillMonth('2026-10', 14, 312),
      '2026-11-01': 418
    };
    expect(isIncompleteRecentMonth({ ym: '2026-11' }, '2026-11-01')).toBe(true);
    const shape = detectMonthlyVolumeArcShape(buildChronologicalMonths(repsByDate), {
      windowEndYmd: '2026-11-01'
    });
    expect(shape).toBeTruthy();
    expect(shape.recent.ym).not.toBe('2026-11');
    expect(shape.recent.ym).toBe('2026-10');
  });

  it('signale une interruption de course après ≥2 mois sans sorties', () => {
    const runDays = [
      { date: '2026-05-10', km: 5 },
      { date: '2026-05-20', km: 6 },
      { date: '2026-06-05', km: 8 },
      { date: '2026-06-18', km: 7 },
      { date: '2026-07-02', km: 5 }
    ];
    const discs = buildRunningGapDiscoveries(runDays, {
      windowStartYmd: '2026-05-01',
      windowEndYmd: '2026-10-31'
    });
    expect(discs.length).toBe(1);
    expect(discs[0].kind).toBe('disc_running_gap');
    expect(discs[0].title.toLowerCase()).toMatch(/course|après|disparu|pic/);
    expect(discs[0].body.toLowerCase()).toMatch(/km/);
    expect(discs[0].metrics.gapMonths.length).toBeGreaterThanOrEqual(2);
    expect(discs[0].metrics.months?.length).toBeGreaterThanOrEqual(3);
  });
});
