import { describe, expect, it } from 'vitest';
import {
  applyNatureWeights,
  comparableWeeklyRates,
  horizonForNature,
  KIND_NATURE,
  muscleProfileForTrajectory,
  natureForKind,
  natureSelectionBoost
} from '../recapInsightNature';

describe('recapInsightNature', () => {
  it('assigne une nature fixe par kind, indépendante de la fenêtre Recap', () => {
    expect(natureForKind('continuity')).toBe('now');
    expect(natureForKind('absence')).toBe('now');
    expect(natureForKind('specialization')).toBe('trajectory');
    expect(natureForKind('push_share')).toBe('trajectory');
    expect(natureForKind('program')).toBe('trajectory');
    expect(natureForKind('continuity_level')).toBe('journey');
    expect(natureForKind('journey_progress')).toBe('journey');
    expect(horizonForNature('now')).toBe('short');
    expect(horizonForNature('trajectory')).toBe('medium');
    expect(horizonForNature('journey')).toBe('long');
    expect(KIND_NATURE.efficiency).toBe('trajectory');
    expect(natureForKind('disc_density')).toBe('now');
    expect(natureForKind('disc_muscle_reorient')).toBe('trajectory');
    expect(natureForKind('disc_anchor')).toBe('journey');
    expect(natureForKind('disc_vs_habit')).toBe('now');
    expect(natureForKind('disc_comparable')).toBe('trajectory');
    expect(natureForKind('disc_sleep_assoc')).toBe('trajectory');
  });

  it('compare le rythme sur 28 j. quand la fenêtre Recap n’est pas un mois', () => {
    const rates = comparableWeeklyRates({
      windowLen: 90,
      currRate: 4.5,
      habitRate: 0.6,
      features: {
        frequency: { perWeek28d: 3.6, perWeekPrev28d: 5.1 },
        frequencyDeltaPct: -30
      }
    });
    expect(rates.source).toBe('28d');
    expect(rates.current).toBe(3.6);
    expect(rates.previous).toBe(5.1);
  });

  it('garde le couple de la fenêtre quand elle ressemble à un mois', () => {
    const rates = comparableWeeklyRates({
      windowLen: 29,
      currRate: 3.6,
      habitRate: 5.1,
      features: { frequency: { perWeek28d: 3.6, perWeekPrev28d: 5.1 } }
    });
    expect(rates.source).toBe('recap_window');
    expect(rates.current).toBe(3.6);
  });

  it('ne prend pas le mix d’une journée pour une trajectoire', () => {
    const day = { total: 360, muscles: [{ label: 'pectoraux', sharePct: 40 }] };
    const weeks = { total: 2000, muscles: [{ label: 'triceps', sharePct: 22 }] };
    expect(muscleProfileForTrajectory(1, day, weeks, day)).toBe(weeks);
    expect(muscleProfileForTrajectory(30, day, weeks, day).total).toBe(360);
  });

  it('fait gagner la contraction sur l’absence dans Maintenant', () => {
    const phenomena = [{ type: 'contraction_with_rebound' }];
    const cont = natureSelectionBoost(
      { id: 'relation.reading.short.continuity' },
      phenomena
    );
    const abs = natureSelectionBoost({ id: 'relation.reading.short.absence' }, phenomena);
    expect(cont).toBeGreaterThan(abs);
    const weighted = applyNatureWeights(
      [
        { id: 'relation.reading.short.absence', weight: 91, horizon: 'short' },
        { id: 'relation.reading.short.continuity', weight: 91, horizon: 'short' }
      ],
      phenomena
    );
    const byId = Object.fromEntries(weighted.map((c) => [c.id, c.weight]));
    expect(byId['relation.reading.short.continuity']).toBeGreaterThan(
      byId['relation.reading.short.absence']
    );
  });
});
