import { describe, expect, it } from 'vitest';
import {
  formatMinSecLabel,
  parseMinSecPart,
  splitTotalSeconds,
  totalSecondsToStoredMinutes
} from '../durationInputUtils';

describe('durationInputUtils', () => {
  it('combine min et sec', () => {
    expect(parseMinSecPart(2, 30)).toBe(150);
    expect(parseMinSecPart(0, 45)).toBe(45);
  });

  it('limite les secondes à 59', () => {
    expect(parseMinSecPart(1, 90)).toBe(119);
  });

  it('décompose un total', () => {
    expect(splitTotalSeconds(150)).toEqual({ minutes: 2, seconds: 30 });
  });

  it('convertit en minutes décimales', () => {
    expect(totalSecondsToStoredMinutes(90)).toBe(1.5);
  });

  it('formate un libellé', () => {
    expect(formatMinSecLabel(150)).toBe('2 min 30 s');
    expect(formatMinSecLabel(45)).toBe('45 s');
  });
});
