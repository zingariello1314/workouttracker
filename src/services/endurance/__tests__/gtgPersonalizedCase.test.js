import { describe, expect, it } from 'vitest';
import { buildGtgPersonalizedCase, defaultGtgProtocolGoal } from '../gtgService';

describe('buildGtgPersonalizedCase', () => {
  it('cale départ prudent et classique sur un max de 15', () => {
    const c = buildGtgPersonalizedCase({ max: 15, reps: 3, goal: 25, label: 'Tractions' });
    expect(c.max).toBe(15);
    expect(c.reps).toBe(3);
    expect(c.goal).toBe(25);
    expect(c.startLow).toBe(3); // 20%
    expect(c.startHigh).toBe(5); // 30%
    expect(c.classicLow).toBe(6); // 40%
    expect(c.classicHigh).toBe(8); // 50%
    expect(c.halfMax).toBe(8);
    expect(c.doseBand).toBe('minimal'); // 3/15=20%
    expect(c.maxBand).toBe('mid');
    expect(c.chapterTitle).toContain('15');
    expect(c.chapterTitle).toContain('Tractions');
    expect(c.startTitle).toContain('15');
    expect(c.conclusionRule).toMatch(/3–5|départ/);
  });

  it('signale tooHot si dose proche du max', () => {
    const c = buildGtgPersonalizedCase({ max: 10, reps: 8, label: 'Dips' });
    expect(c.pct).toBe(80);
    expect(c.doseBand).toBe('tooHot');
    expect(c.rir).toBe(2);
    expect(c.conclusionTitle.toLowerCase()).toMatch(/trop|chaud|près/);
    expect(c.conclusionLead).toContain('8');
  });

  it('adapte le bandeau novice pour max < 5', () => {
    const c = buildGtgPersonalizedCase({ max: 3, reps: 1, label: 'Tractions' });
    expect(c.maxBand).toBe('novice');
    expect(c.startLow).toBe(1);
    expect(c.startHigh).toBeLessThanOrEqual(2);
    expect(c.chapterSubtitle.toLowerCase()).toMatch(/qualité|1–2|1-2/);
    expect(c.conclusionTitle).toMatch(/1 rep|max 3/i);
  });

  it('utilise defaultGtgProtocolGoal si goal omis et classe ~½ max en classic', () => {
    const c = buildGtgPersonalizedCase({ max: 9 });
    expect(c.goal).toBe(defaultGtgProtocolGoal(9));
    expect(c.reps).toBe(5); // ~50 % sans reps explicites
    expect(c.doseBand).toBe('classic');
    expect(c.toolkitTitle).toContain(String(c.goal));
  });

  it('adapte la conclusion en zone classique déclarée', () => {
    const c = buildGtgPersonalizedCase({ max: 12, reps: 6, goal: 20, label: 'Pompes' });
    expect(c.doseBand).toBe('classic');
    expect(c.pct).toBe(50);
    expect(c.conclusionTitle.toLowerCase()).toMatch(/classique/);
    expect(c.measureTitle).toContain('12');
    expect(c.measureTitle).toContain('20');
  });
});
