import { describe, expect, it } from 'vitest';
import { expandSlashDatesInProse, segmentRecapProseValues } from '../recapProseMarks';

describe('recapProseMarks', () => {
  it('réécrit jj/mm et jj/mm/aaaa en long français', () => {
    expect(expandSlashDatesInProse('Du 13/10 au 14/10')).toMatch(/13 octobre/);
    expect(expandSlashDatesInProse('Du 13/10 au 14/10')).toMatch(/14 octobre/);
    expect(expandSlashDatesInProse('le 19/10/2026')).toBe('le 19 octobre 2026');
    expect(expandSlashDatesInProse('note 2,7 / 5')).toBe('note 2,7 / 5');
  });

  it('colore chiffre+unité et signe, ignore les chiffres isolés', () => {
    const body =
      '12 mini-séries hors planning, 76 reps, en 6 jours. Volume +59,1 % puis 30 jours et 17.';
    const marked = segmentRecapProseValues(body)
      .filter((p) => p.mark)
      .map((p) => p.text);
    expect(marked).toEqual(
      expect.arrayContaining(['12 mini-séries', '76 reps', '6 jours', '+59,1 %', '30 jours'])
    );
    expect(marked).not.toContain('17');
    expect(marked.some((t) => t === '12')).toBe(false);
  });

  it('colle séances et répétitions au chiffre', () => {
    const marked = segmentRecapProseValues(
      '180 répétitions sur 3,4 séance(s) par semaine, 40 répétitions.'
    )
      .filter((p) => p.mark)
      .map((p) => p.text);
    expect(marked).toEqual(
      expect.arrayContaining(['180 répétitions', '3,4 séance(s)', '40 répétitions'])
    );
  });
});
