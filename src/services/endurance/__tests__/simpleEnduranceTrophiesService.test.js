import {
  buildSimpleEnduranceStats,
  evaluateSimpleEnduranceTrophies,
  buildSimpleEnduranceTrophiesCatalog
} from '../simpleEnduranceTrophiesService';

describe('simpleEnduranceTrophiesService', () => {
  test('catalogues non vides', () => {
    expect(buildSimpleEnduranceTrophiesCatalog('jumprope').length).toBeGreaterThan(5);
    expect(buildSimpleEnduranceTrophiesCatalog('gainage').length).toBeGreaterThan(5);
  });

  test('corde : 2 séances le même jour alimente maxSessionsSingleDay', () => {
    const sessions = [
      { date: '2026-01-10', time: '08:00', duration: '5:00', jumps: 100, durationSec: 300 },
      { date: '2026-01-10', time: '18:00', duration: '5:00', jumps: 120, durationSec: 300 }
    ];
    const stats = buildSimpleEnduranceStats('jumprope', sessions);
    expect(stats.maxSessionsSingleDay).toBe(2);
    expect(stats.sessionCount).toBe(2);
    const ev = evaluateSimpleEnduranceTrophies({ activityType: 'jumprope', sessions });
    const double = ev.results.find((r) => r.id === 'jr_day_double');
    expect(double.levels.find((l) => l.level === 'bronze').unlocked).toBe(true);
  });

  test('corde : série de 4 jours consécutifs', () => {
    const sessions = ['2026-02-01', '2026-02-02', '2026-02-03', '2026-02-04'].map((date) => ({
      date,
      time: '10:00',
      duration: '1:00',
      jumps: 50,
      durationSec: 60
    }));
    const stats = buildSimpleEnduranceStats('jumprope', sessions);
    expect(stats.streakDays).toBe(4);
    const ev = evaluateSimpleEnduranceTrophies({ activityType: 'jumprope', sessions });
    const st = ev.results.find((r) => r.id === 'jr_streak_4');
    expect(st.levels.find((l) => l.level === 'bronze').unlocked).toBe(true);
  });

  test('gainage : cumul secondes planche et max par séance', () => {
    const sessions = [
      { date: '2026-03-01', time: '12:00', count: 60, duration: 10 },
      { date: '2026-03-02', time: '12:00', count: 120, duration: 15 }
    ];
    const stats = buildSimpleEnduranceStats('gainage', sessions);
    expect(stats.totalPlankSec).toBe(180);
    expect(stats.maxPlankSingleSec).toBe(120);
    const ev = evaluateSimpleEnduranceTrophies({ activityType: 'gainage', sessions });
    const plank180 = ev.results.find((r) => r.id === 'ga_plank_total_180');
    expect(plank180.levels.find((l) => l.level === 'bronze').unlocked).toBe(true);
  });
});
