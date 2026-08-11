import { describe, expect, it } from 'vitest';
import { getSportGradeDescription } from '../gradeDescriptionCopy';

const t = (_k, d, vars) => {
  let s = d;
  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      s = s.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v));
    });
  }
  return s;
};

describe('getSportGradeDescription', () => {
  it('novice — grade mérité automatique', () => {
    const d = getSportGradeDescription('novice', t);
    expect(d.flavor).toContain('aventure');
    expect(d.unlockBody).toMatch(/automatique/i);
  });

  it('parangon — mentionne niveau 129 et règles strictes', () => {
    const d = getSportGradeDescription('parangon', t);
    expect(d.flavor).toContain('sommet');
    expect(d.unlockBody).toContain('129');
    expect(d.highlight).toBeTruthy();
  });

  it('champion — voie standard 70 %', () => {
    const d = getSportGradeDescription('champion', t);
    expect(d.unlockBody).toContain('37');
    expect(d.unlockBody).toMatch(/70/);
  });
});
