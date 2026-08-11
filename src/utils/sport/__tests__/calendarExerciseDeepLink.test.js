import { describe, expect, it } from 'vitest';
import {
  calendarDeepLinkFromCheckHistoryRow,
  calendarEnduranceHistoryElementId,
  calendarExerciseRecordElementId
} from '../calendarExerciseDeepLink';

describe('calendarExerciseDeepLink', () => {
  it('mappe une coche programme vers une ancre stable', () => {
    const link = calendarDeepLinkFromCheckHistoryRow({
      id: 'w:2024-06-12_42_semaineA',
      dateStr: '2024-06-12',
      source: 'workout'
    });
    expect(link?.dateYmd).toBe('2024-06-12');
    expect(link?.scrollAnchor).toBe(calendarExerciseRecordElementId('2024-06-12_42_semaineA'));
  });

  it('mappe une coche endurance défis pompes', () => {
    const historyId = 'e:2024-06-12:0:abc';
    const link = calendarDeepLinkFromCheckHistoryRow({
      id: historyId,
      dateStr: '2024-06-12',
      source: 'endurance'
    });
    expect(link?.scrollAnchor).toBe(calendarEnduranceHistoryElementId(historyId));
  });
});
