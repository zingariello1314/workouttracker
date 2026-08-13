import {
  combineMinutesParts,
  combineSecondsParts,
  formatStoredTimeLabel,
  splitStoredMinutes,
  splitStoredSeconds,
  storedTimeToDisplayMinutes,
  storedTimeToTotalSeconds
} from '../exerciseTimeValueUtils';

describe('exerciseTimeValueUtils', () => {
  test('split/combine minutes', () => {
    expect(splitStoredMinutes(40)).toEqual({ primary: 40, secondary: 0 });
    expect(splitStoredMinutes(40.5)).toEqual({ primary: 40, secondary: 30 });
    expect(combineMinutesParts(40, 30)).toBe(40.5);
    expect(combineMinutesParts('', '')).toBe(0);
  });

  test('split/combine seconds with centiseconds', () => {
    expect(splitStoredSeconds(45)).toEqual({ primary: 45, secondary: 0 });
    expect(splitStoredSeconds(45.25)).toEqual({ primary: 45, secondary: 25 });
    expect(combineSecondsParts(45, 25)).toBe(45.25);
    expect(combineSecondsParts(90, '')).toBe(90);
  });

  test('storedTimeToTotalSeconds and display minutes', () => {
    expect(storedTimeToTotalSeconds(40, 'min')).toBe(2400);
    expect(storedTimeToTotalSeconds(90, 'sec')).toBe(90);
    expect(storedTimeToDisplayMinutes(90, 'sec')).toBe(1.5);
    expect(storedTimeToDisplayMinutes(40, 'min')).toBe(40);
  });

  test('formatStoredTimeLabel', () => {
    expect(formatStoredTimeLabel(40, 'min')).toBe('40 min');
    expect(formatStoredTimeLabel(40.5, 'min')).toBe('40 min 30 s');
    expect(formatStoredTimeLabel(45.25, 'sec')).toBe('45 s 25 cs');
  });
});
