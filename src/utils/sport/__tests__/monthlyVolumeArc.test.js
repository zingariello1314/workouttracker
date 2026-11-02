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
    expect(discs[0].title.toLowerCase()).toMatch(/aucune sortie|après/);
    expect(discs[0].metrics.gapMonths.length).toBeGreaterThanOrEqual(2);
  });
});
