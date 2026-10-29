/**
 * Qualité de sélection généralisée (sommeil sticky, RPE faible n, rivaux).
 */
import { describe, expect, it } from 'vitest';
import { sleepPerceivedEffort, pairSessionsWithNights } from '../recapSleepCorrelation';
import { SIGNAL_FAMILY_CAPS, TOTAL_SLEEP_BUDGET } from '../recapInsightNature';
import { selectPeriodDiscoveries } from '../recapPeriodDiscoveries';

function sess(date, reps, hours) {
  return { date, totalReps: reps, minutes: 45, sleepHours: hours, night: { hours }, exercises: [] };
}

describe('qualité sélection — règles généralisées', () => {
  it('refuse RPE sommeil à 3 vs 3', () => {
    const catalog = [];
    const diffs = [];
    for (let i = 0; i < 3; i += 1) {
      catalog.push(sess(`2026-01-0${i + 1}`, 300, 7.8));
      diffs.push({ date: `2026-01-0${i + 1}`, difficulty: 2.2 });
    }
    for (let i = 0; i < 3; i += 1) {
      catalog.push(sess(`2026-01-1${i + 1}`, 220, 6.4));
      diffs.push({ date: `2026-01-1${i + 1}`, difficulty: 4.1 });
    }
    expect(sleepPerceivedEffort(pairSessionsWithNights(catalog), diffs)).toBeNull();
  });

  it('cap sommeil ≤ 1 par angle et budget total ≤ 2 sur month', () => {
    expect(SIGNAL_FAMILY_CAPS.month.trajectory.sleep).toBe(1);
    expect(TOTAL_SLEEP_BUDGET.month).toBe(2);
    expect(TOTAL_SLEEP_BUDGET.today).toBe(1);
  });

  it('ne garde pas GTG now + role ensemble', () => {
    const selected = selectPeriodDiscoveries(
      [
        { kind: 'disc_gtg_unplanned_now', nature: 'now', family: 'gtg', score: 90 },
        { kind: 'disc_gtg_unplanned_role', nature: 'trajectory', family: 'gtg', score: 88 },
        { kind: 'disc_volume_shape', nature: 'now', family: 'volume', score: 70 }
      ],
      null,
      'month'
    );
    const gtg = selected.filter((d) => /gtg_unplanned_(now|role)/.test(d.kind));
    expect(gtg.length).toBe(1);
  });
});
