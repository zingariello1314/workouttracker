import { describe, expect, it } from 'vitest';
import { analyzeSleepRhythm, buildSleepRhythmDiscoveries } from '../sleepRhythmAnalysis';

function ymd(offset) {
  const d = new Date(Date.UTC(2026, 0, 1 + offset));
  return d.toISOString().slice(0, 10);
}

function night(offset, bed, wake, hours = 8) {
  return { ymd: ymd(offset), bedTime: bed, wakeTime: wake, hours };
}

const FORBIDDEN = /fait baisser|mauvais|insuffisant|trop tard|dérègle|derègle/i;

function bodies(cards) {
  return cards.map((c) => c.body).join('\n');
}

describe('analyzeSleepRhythm', () => {
  it('n=1 est une observation, sans le mot habitude', () => {
    const profile = analyzeSleepRhythm([night(0, '03:12', '11:04', 7.87)]);
    expect(profile.level).toBe(1);
    const cards = buildSleepRhythmDiscoveries({ nights: [night(0, '03:12', '11:04', 7.87)] });
    expect(cards).toHaveLength(1);
    expect(cards[0].kind).toBe('disc_sleep_rhythm_obs');
    expect(cards[0].body).toMatch(/3 h 12/);
    expect(cards[0].body).toMatch(/11 h 04/);
    expect(cards[0].body).not.toMatch(/habitude|habituel|actuellement/i);
  });

  it('n=4 sur 7 jours dit actuellement, avec la dispersion, sans habitude', () => {
    const nights = [0, 2, 4, 7].map((offset, i) =>
      night(offset, i % 2 ? '00:10' : '00:40', '08:00', 7.5)
    );
    const profile = analyzeSleepRhythm(nights);
    expect(profile.level).toBe(2);
    const cards = buildSleepRhythmDiscoveries({ nights });
    const fact = cards.find((c) => c.kind === 'disc_sleep_rhythm_obs');
    expect(fact.body).toMatch(/Actuellement/);
    expect(fact.body).not.toMatch(/habitude|habituel/i);
    expect(cards.filter((c) => c.kind.startsWith('disc_sleep_rhythm_'))).toHaveLength(1);
  });

  it('n=8 sur 14 jours parle d’un rythme habituel récent', () => {
    const nights = [0, 2, 4, 6, 8, 10, 12, 14].map((offset) => night(offset, '00:20', '08:10', 7.8));
    expect(analyzeSleepRhythm(nights).level).toBe(3);
    const fact = buildSleepRhythmDiscoveries({ nights }).find((c) => c.kind === 'disc_sleep_rhythm_habit');
    expect(fact.body).toMatch(/habituel récent/);
  });

  it('nomme un coucher tardif compensé par un lever tardif, durée tenue', () => {
    const nights = [0, 2, 4, 6, 8, 10, 12, 14].map((offset) => night(offset, '02:00', '10:00', 8));
    const profile = analyzeSleepRhythm(nights);
    expect(profile.patterns).toContain('late_bed_late_wake_duration_held');
    const fact = buildSleepRhythmDiscoveries({ nights }).find((c) => c.kind === 'disc_sleep_rhythm_habit');
    expect(fact.body).toMatch(/durée de sommeil tient/);
    expect(bodies(buildSleepRhythmDiscoveries({ nights }))).not.toMatch(FORBIDDEN);
  });

  it('nomme un coucher tardif et un lever matinal, durée plus courte', () => {
    const nights = [0, 2, 4, 6, 8, 10, 12, 14].map((offset) => night(offset, '02:00', '08:00', 6));
    const profile = analyzeSleepRhythm(nights);
    expect(profile.patterns).toContain('late_bed_normal_wake_shorter');
  });

  it('sépare un coucher stable d’un lever variable', () => {
    const beds = ['23:10', '23:20', '23:15', '23:25', '23:10', '23:20', '23:15', '23:20'];
    const wakes = ['06:00', '09:30', '06:10', '10:00', '06:20', '09:00', '06:05', '10:30'];
    const nights = beds.map((bed, i) => ({ ymd: ymd(i * 2), bedTime: bed, wakeTime: wakes[i] }));
    const profile = analyzeSleepRhythm(nights);
    expect(profile.patterns).toContain('stable_bed_variable_wake');
    expect(profile.level).toBeGreaterThanOrEqual(2);
  });

  it('le week-end dit quel axe bouge', () => {
    const nights = [];
    for (let i = 0; i < 28; i += 1) {
      const day = new Date(Date.UTC(2026, 0, 1 + i)).getUTCDay();
      const weekend = day === 0 || day === 6;
      nights.push({
        ymd: ymd(i),
        bedTime: weekend ? '02:00' : '23:00',
        wakeTime: '07:30',
        hours: weekend ? 5.5 : 8.5
      });
    }
    const profile = analyzeSleepRhythm(nights);
    expect(profile.weekend.axes).toContain('bed');
    const card = buildSleepRhythmDiscoveries({ nights }).find((c) => c.kind === 'disc_sleep_weekend');
    expect(card.body).toMatch(/coucher/);
    expect(card.body).not.toMatch(/fait baisser/);
  });

  it('émet une dérive puis un retour, une seule transformation', () => {
    const nights = [];
    for (let i = 0; i < 30; i += 1) {
      const late = i >= 10 && i < 20;
      nights.push(night(i, late ? '02:30' : '23:30', late ? '10:00' : '07:00', 7.5));
    }
    const profile = analyzeSleepRhythm(nights);
    expect(profile.level).toBe(4);
    expect(profile.drift.bed.returned).toBe(true);
    const cards = buildSleepRhythmDiscoveries({ nights });
    const drifts = cards.filter((c) => c.kind === 'disc_sleep_drift');
    expect(drifts).toHaveLength(1);
    expect(drifts[0].nature).toBe('journey');
    expect(drifts[0].body).toMatch(/résorbé/);
  });

  it('une dérive de coucher et de lever ensemble, durée stable', () => {
    const nights = [];
    for (let i = 0; i < 30; i += 1) {
      const bed = i < 10 ? '23:00' : i < 20 ? '23:40' : '00:30';
      const wake = i < 10 ? '07:00' : i < 20 ? '07:40' : '08:30';
      nights.push(night(i, bed, wake, 8));
    }
    const profile = analyzeSleepRhythm(nights);
    expect(profile.patterns).toContain('clocks_drift_together');
    expect(profile.patterns).toContain('duration_stable_clock_shift');
    const drift = buildSleepRhythmDiscoveries({ nights }).find((c) => c.kind === 'disc_sleep_drift');
    expect(drift.body).toMatch(/coucher et le lever/);
    expect(drift.body).toMatch(/durée reste/);
  });

  it('le repère général ne juge pas et ne répète pas l’heure en titre', () => {
    const nights = [0, 3, 6, 9, 12, 15].map((offset) => night(offset, '02:40', '10:30', 7.8));
    const cards = buildSleepRhythmDiscoveries({ nights });
    const ref = cards.find((c) => c.kind === 'disc_sleep_reference');
    expect(ref).toBeTruthy();
    expect(ref.body).toMatch(/très tardif|plus tardif/);
    expect(ref.body).toMatch(/pas un problème|ne dit pas/);
    expect(ref.title.startsWith('Repère')).toBe(true);
  });

  it('l’association reste au-dessus du plancher et ne devient pas une cause', () => {
    const nights = [];
    const sessions = [];
    for (let i = 0; i < 16; i += 1) {
      const late = i % 2 === 0;
      nights.push(night(i, late ? '03:00' : '23:00', late ? '10:00' : '07:00', 7));
      sessions.push({ date: ymd(i), totalReps: late ? 40 : 120 });
    }
    const cards = buildSleepRhythmDiscoveries({ nights, sessions });
    const tol = cards.find((c) => c.kind === 'disc_sleep_tolerance');
    expect(tol).toBeTruthy();
    expect(tol.body).toMatch(/associées à/);
    expect(tol.body).toMatch(/pas une cause/);
    expect(tol.body).not.toMatch(FORBIDDEN);
  });

  it('reste silencieux si le plancher d’association n’est pas atteint', () => {
    const nights = [0, 2, 4, 6, 8, 10, 12, 14].map((offset) => night(offset, '01:30', '09:00', 7.5));
    const sessions = [{ date: ymd(0), totalReps: 40 }, { date: ymd(2), totalReps: 80 }];
    const cards = buildSleepRhythmDiscoveries({ nights, sessions });
    expect(cards.some((c) => c.kind === 'disc_sleep_tolerance')).toBe(false);
  });

  it('quatre formulations tardives ne font qu’une carte de fait', () => {
    const nights = [0, 2, 4, 6, 8, 10, 12, 14].map((offset) => night(offset, '02:10', '10:10', 8));
    const facts = buildSleepRhythmDiscoveries({ nights }).filter((c) =>
      c.kind === 'disc_sleep_rhythm_obs' || c.kind === 'disc_sleep_rhythm_habit'
    );
    expect(facts).toHaveLength(1);
  });

  it('sépare un lever stable d’un coucher variable', () => {
    const beds = ['22:00', '02:30', '22:10', '03:00', '22:20', '02:00', '22:05', '03:10'];
    const nights = beds.map((bed, i) => ({ ymd: ymd(i * 2), bedTime: bed, wakeTime: '07:00' }));
    expect(analyzeSleepRhythm(nights).patterns).toContain('stable_wake_variable_bed');
  });

  it('une dérive du seul coucher, et une durée qui change avec l’horloge', () => {
    const nights = [];
    for (let i = 0; i < 30; i += 1) {
      const bed = i < 10 ? '23:00' : i < 20 ? '00:00' : '01:30';
      nights.push({ ymd: ymd(i), bedTime: bed, wakeTime: '07:00' });
    }
    const profile = analyzeSleepRhythm(nights);
    expect(profile.patterns).toContain('duration_changes_with_clock');
    expect(profile.patterns).not.toContain('clocks_drift_together');
    const drift = buildSleepRhythmDiscoveries({ nights }).find((c) => c.kind === 'disc_sleep_drift');
    expect(drift.body).toMatch(/coucher/);
    expect(drift.body).toMatch(/durée change/);
  });

  it('ignore une nuit sans les deux heures', () => {
    const cards = buildSleepRhythmDiscoveries({
      nights: [{ ymd: ymd(0), bedTime: '23:00', wakeTime: null, hours: 7 }]
    });
    expect(cards).toEqual([]);
  });
});
