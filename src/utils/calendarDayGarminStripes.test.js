import { describe, expect, it } from 'vitest';
import { buildCalendarDayGarminStripes } from './calendarDayGarminStripes';

describe('calendarDayGarminStripes', () => {
  const garminData = {
    activities: {
      cardio: [
        { date: '2026-06-02', duration: 45, activityName: 'Pessac Cardio' },
        { date: '2026-06-02', duration: 20, activityName: 'Marche' }
      ],
      swimming: [],
      jumpRope: []
    },
    dailyMetrics: {
      '2026-06-02': {
        steps: 4214,
        sleep: { duration: 7.5 },
        heartRate: { resting: 52, max: 121 }
      }
    }
  };

  it('une barre par activité + sommeil + pas', () => {
    const stripes = buildCalendarDayGarminStripes(garminData, '2026-06-02');
    const activities = stripes.filter((s) => s.kind === 'activity');
    expect(activities).toHaveLength(2);
    expect(new Set(activities.map((s) => s.color)).size).toBeGreaterThanOrEqual(1);
    expect(stripes.some((s) => s.kind === 'sleep')).toBe(true);
    expect(stripes.some((s) => s.kind === 'steps')).toBe(true);
  });
});
