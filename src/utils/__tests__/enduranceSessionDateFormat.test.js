import { describe, expect, it } from 'vitest';
import {
  formatEnduranceSessionDateLabel,
  formatEnduranceSessionDateOnly,
  formatEnduranceTimeLabel
} from '../enduranceSessionDateFormat.js';

describe('enduranceSessionDateFormat', () => {
  it('formate une date ISO en français long', () => {
    expect(formatEnduranceSessionDateOnly('2026-05-20', 'fr')).toMatch(/20.+mai.+2026/i);
  });

  it('ajoute l’heure tronquée', () => {
    expect(formatEnduranceSessionDateLabel('2026-05-20', '07:05:11', 'fr')).toMatch(/07:05/);
  });

  it('tronque les secondes', () => {
    expect(formatEnduranceTimeLabel('07:05:11')).toBe('07:05');
  });
});
