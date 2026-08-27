import { describe, expect, it } from 'vitest';
import { DEFAULT_SCHEME, isValidHold, schemeFromHold, validFrontColors } from '../colorScheme';
import { averageOf, effectiveMs, formatTimeMs } from '../timerStats';

describe('schemeFromHold', () => {
  it('WCA : blanc haut, vert devant → rouge à droite', () => {
    expect(DEFAULT_SCHEME).toEqual({ U: 'W', D: 'Y', F: 'G', B: 'B', R: 'R', L: 'O' });
  });

  it('jaune haut, vert devant → orange à droite', () => {
    expect(schemeFromHold('Y', 'G')).toEqual({ U: 'Y', D: 'W', F: 'G', B: 'B', R: 'O', L: 'R' });
  });

  it('refuse les opposés', () => {
    expect(isValidHold('W', 'Y')).toBe(false);
    expect(validFrontColors('W')).toEqual(['G', 'B', 'R', 'O']);
  });
});

describe('timerStats', () => {
  it('formate les millisecondes', () => {
    expect(formatTimeMs(12340)).toBe('12.34');
    expect(formatTimeMs(61230)).toBe('1:01.23');
  });

  it('ao5 retire min/max et gère +2', () => {
    const times = [
      { ms: 10000, penalty: 0 },
      { ms: 12000, penalty: 0 },
      { ms: 11000, penalty: 2000 },
      { ms: 9000, penalty: 0 },
      { ms: 15000, penalty: 0 }
    ];
    expect(averageOf(times, 5)).toBe(Math.round((10000 + 12000 + 13000) / 3));
  });

  it('effectiveMs DNF', () => {
    expect(effectiveMs({ ms: 1000, penalty: 'DNF' })).toBeNull();
  });
});
