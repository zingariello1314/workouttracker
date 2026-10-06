import { describe, expect, it } from 'vitest';
import {
  calendarBadgesForDate,
  calendarBadgeDetailsForDate
} from '../calendarYearDayBadges';
import {
  calendarWeekBucketCount,
  calendarWeekIdFromDate,
  computeCalendarWeekLeaders,
  weekHonorsForMonth
} from '../calendarWeekLeaders';

describe('meilleures semaines du calendrier', () => {
  const workoutData = {
    checkedExercises: {
      '2025-08-03_1': true,
      '2026-05-10_1': true,
      '2026-05-20_1': true,
      '2026-06-02_1': true
    },
    reps: {
      '2025-08-03_1': '40',
      '2026-05-10_1': '120',
      '2026-05-20_1': '80',
      '2026-06-02_1': '200'
    },
    enduranceData: { sessions: {} }
  };
  const garminData = {
    dailyMetrics: {
      '2025-08-03': { steps: 20000 },
      '2026-05-03': { steps: 4000 },
      '2026-05-10': { steps: 12000 },
      '2026-06-02': { steps: 9000 }
    }
  };

  it('découpe les semaines lun–dim (S1 partielle si le mois commence en milieu de semaine)', () => {
    // Oct 2026 commence un jeudi → S1 = jeu–dim (1–4), puis lun–dim
    expect(calendarWeekIdFromDate('2026-10-01')).toMatchObject({
      year: 2026,
      monthIndex: 9,
      bucket: 0,
      id: '2026-10-0'
    });
    expect(calendarWeekIdFromDate('2026-10-04')?.bucket).toBe(0);
    expect(calendarWeekIdFromDate('2026-10-05')?.bucket).toBe(1);
    expect(calendarWeekIdFromDate('2026-10-11')?.bucket).toBe(1);
    expect(calendarWeekIdFromDate('2026-10-12')?.bucket).toBe(2);
    expect(calendarWeekIdFromDate('2026-10-31')?.bucket).toBe(4);
    expect(calendarWeekBucketCount(2026, 9)).toBe(5);

    // Juin 2026 commence un lundi → S1 = 1–7
    expect(calendarWeekIdFromDate('2026-06-01')?.bucket).toBe(0);
    expect(calendarWeekIdFromDate('2026-06-07')?.bucket).toBe(0);
    expect(calendarWeekIdFromDate('2026-06-08')?.bucket).toBe(1);
  });

  it('donne la couronne du mois, de l’année et de tous les temps, et les fait coïncider', () => {
    const leaders = computeCalendarWeekLeaders(workoutData, garminData);
    expect(leaders.steps.allTime.id).toBe('2025-08-0');
    expect(leaders.steps.byYear[2025].id).toBe('2025-08-0');
    expect(leaders.steps.byMonth['2025-7'].id).toBe('2025-08-0');

    expect(leaders.steps.byYear[2026].id).toBe('2026-05-1');
    expect(leaders.steps.byMonth['2026-4'].id).toBe('2026-05-1');

    expect(leaders.reps.allTime.id).toBe('2026-06-0');
    expect(leaders.reps.byYear[2026].id).toBe('2026-06-0');
    expect(leaders.reps.byMonth['2026-5'].id).toBe('2026-06-0');
    expect(leaders.reps.byMonth['2026-4'].id).toBe('2026-05-1');

    const may = weekHonorsForMonth(leaders, 2026, 4);
    expect(may.steps[1]).toEqual(['year', 'month']);
    expect(may.reps[1]).toEqual(['month']);
    const august = weekHonorsForMonth(leaders, 2025, 7);
    expect(august.steps[0]).toEqual(['allTime', 'year', 'month']);
  });

  it('indique dans le détail du jour que la journée appartient à ces semaines (mêmes emojis mois/année)', () => {
    const weekLeaders = computeCalendarWeekLeaders(workoutData, garminData);
    // 3 août 2025 (dimanche) est dans S1 partielle août ; 5 août est déjà S2
    const badges = calendarBadgesForDate('2025-08-03', { weekLeaders });
    const stepsBadge = badges.find((badge) => badge.metric === 'steps');
    expect(badges.filter((badge) => badge.metric === 'steps')).toHaveLength(1);
    expect(stepsBadge.emoji).toBe('🌠');
    expect(stepsBadge.type).toBeUndefined();
    expect(stepsBadge.title).toContain('Meilleure semaine de tous les temps · pas');
    expect(stepsBadge.title).toContain("Meilleure semaine de l'année · pas");
    expect(stepsBadge.title).toContain('Meilleure semaine du mois · pas');
    expect(badges.find((badge) => badge.metric === 'reps')?.emoji).toBe('🐯');

    const yearBadges = calendarBadgesForDate('2025-08-03', { weekLeaders }, { weekStyle: 'crown' });
    const yearSteps = yearBadges.filter((badge) => badge.metric === 'steps');
    expect(yearSteps).toHaveLength(1);
    expect(yearSteps[0].emoji).toBe('🌠');
    expect(yearSteps[0].type).toBeUndefined();

    const details = calendarBadgeDetailsForDate('2026-06-04', {
      weekLeaders,
      year: 2026,
      championRankByDate: {}
    });
    const repsDetail = details.find((item) => item.metric === 'reps');
    expect(repsDetail?.emoji).toBe('💎');
    expect(details.find((item) => item.metric === 'steps')?.emoji).toBe('👟');
    expect(details.some((item) => item.title.startsWith('Meilleure semaine de tous les temps · reps'))).toBe(
      true
    );
    expect(details.find((item) => item.kind === 'week')?.description).toMatch(/Ce jour fait partie/);
  });
});
