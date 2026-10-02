import { describe, expect, it } from 'vitest';
import { movementKey, sameMovementName } from '../recapExerciseIdentity';
import { describeCalendarShape } from '../recapCalendarShape';
import { describeStepReadings } from '../recapStepReading';
import { describeRestDay } from '../recapRestDayReading';
import { getWeekStartKey } from '../../restDayUtils';
import { buildPeriodDiscoveryBundle, selectPeriodDiscoveries } from '../recapPeriodDiscoveries';
import { sameDayCompanions, writeExerciseEvent } from '../recapFactReading';
import { detectRecapMilestones } from '../recapMilestoneEngine';

describe('identité des mouvements', () => {
  it('rapproche deux appellations de pompes inclinées et refuse la planche', () => {
    expect(movementKey('Pompes inclinées')).toBe('pompes-inclinees');
    expect(movementKey('Pompes inclinées pieds sur support')).toBe('pompes-inclinees');
    expect(sameMovementName('Pompes inclinées', 'Pompes inclinées pieds sur banc')).toBe(true);
    expect(movementKey('Planche bras tendus')).toBe('hold:planche-bras-tendus');
    expect(sameMovementName('Planche bras tendus', 'Pompes')).toBe(false);
    expect(sameMovementName('Pompes pseudo-planche', 'Planche bras tendus')).toBe(false);
    expect(movementKey('Pompes pseudo-planche')).toBe('pompes-pseudo-planche');
  });
});

describe('lecture d’un mouvement', () => {
  it('relie le volume de la fenêtre et le mouvement du même jour sur le même groupe', () => {
    const exercise = { id: 'lat', name: 'Élévations latérales', reps: 60 };
    const mates = sameDayCompanions(exercise, {
      '2026-09-30': [
        exercise,
        { id: 'bent', name: 'Bent-Arm Lateral Dumbbell Raise', reps: 60 }
      ]
    });
    const body = writeExerciseEvent({
      exercise,
      totalReps: 1192,
      emerging: false,
      gapDays: 34,
      companions: mates,
      setBit: ''
    });
    expect(body).toMatch(/5,0 %|5\.0 %|60/);
    expect(body).toMatch(/34 jours/);
    expect(body).toMatch(/même muscle principal/i);
    expect(body).toMatch(/point de départ|volume du retour/);
  });

  it('ne confond pas les pompes et les élévations latérales', () => {
    const mates = sameDayCompanions(
      { id: 'push', name: 'Pompes (endurance)', reps: 100 },
      {
        '2026-09-30': [
          { id: 'push', name: 'Pompes (endurance)', reps: 100 },
          { id: 'lat', name: 'Élévations latérales', reps: 60 }
        ]
      }
    );
    expect(mates).toHaveLength(0);
  });

  it('garde plusieurs lectures du même type quand chacune porte un exercice', () => {
    const cards = [0, 1, 2].map((n) => ({
      kind: 'disc_emergence',
      nature: 'trajectory',
      family: 'emergence',
      score: 94 - n,
      title: `Mouvement ${n}`,
      body: 'x',
      metrics: { exerciseId: `ex-${n}`, factId: `emergence|ex-${n}` }
    }));
    const selected = selectPeriodDiscoveries(cards, null, 'week');
    expect(selected.filter((card) => card.kind === 'disc_emergence')).toHaveLength(3);
  });
});

describe('calendrier et pas', () => {
  it('nomme le bloc chargé et le creux', () => {
    const repsByDate = {
      '2026-09-26': 200,
      '2026-09-27': 200,
      '2026-09-28': 200,
      '2026-09-29': 500,
      '2026-09-30': 500
    };
    const card = describeCalendarShape({
      repsByDate,
      start: '2026-09-24',
      end: '2026-09-30',
      thisPeriod: 'ces 7 jours'
    });
    expect(card.body).toMatch(/29\/09/);
    expect(card.body).toMatch(/sans séance/);
    expect(card.body).toMatch(/500/);
  });

  it('compare les pas au niveau des 30 jours d’avant', () => {
    const dailyMetrics = {};
    for (let day = 1; day <= 23; day += 1) {
      const key = `2026-09-${String(day).padStart(2, '0')}`;
      dailyMetrics[key] = { steps: 8000 };
    }
    for (let day = 24; day <= 30; day += 1) {
      dailyMetrics[`2026-09-${day}`] = { steps: 12000 };
    }
    const cards = describeStepReadings({
      dailyMetrics,
      start: '2026-09-24',
      end: '2026-09-30',
      trainingDates: ['2026-09-29', '2026-09-30'],
      thisPeriod: 'ces 7 jours'
    });
    expect(cards.some((card) => /au-dessus/.test(card.title))).toBe(true);
    expect(cards.some((card) => card.body.includes('8'))).toBe(true);
  });

  it('se tait si les pas restent proches du niveau habituel', () => {
    const dailyMetrics = {};
    for (let day = 1; day <= 30; day += 1) {
      dailyMetrics[`2026-09-${String(day).padStart(2, '0')}`] = { steps: 8000 };
    }
    const cards = describeStepReadings({
      dailyMetrics,
      start: '2026-09-24',
      end: '2026-09-30',
      trainingDates: [],
      thisPeriod: 'ces 7 jours'
    });
    expect(cards).toEqual([]);
  });
});

describe('jour de repos', () => {
  const program = {
    id: 'p1',
    restConfig: { restDay: 'jeudi' },
    schedule: {
      jeudi: { exercises: [], etirements: { matin: [{ name: 'Hanches' }] } },
      vendredi: { exercises: [{ id: 10, name: 'Pompes' }], etirements: {} }
    }
  };

  it('dit que le jeudi est un repos et cite l’étirement, sans parler d’une séance en attente', () => {
    const card = describeRestDay({ program, snapshot: {}, date: '2026-10-01' });
    expect(card.title).toMatch(/repos/);
    expect(card.body).toMatch(/Hanches/);
    expect(card.body).not.toMatch(/séance en attente/);
  });

  it('suit le repos déplacé plutôt que le jour du programme', () => {
    const weekKey = getWeekStartKey('2026-10-02');
    const snapshot = { restDaySwaps: { p1: { [weekKey]: { fromDay: 'jeudi', toDay: 'vendredi' } } } };
    expect(describeRestDay({ program, snapshot, date: '2026-10-01' })).toBeNull();
    const moved = describeRestDay({ program, snapshot, date: '2026-10-02' });
    expect(moved.body).toMatch(/déplacé/);
    expect(moved.body).toMatch(/Hanches/);
    expect(moved.body).toMatch(/vendredi/);
  });

  it('remplace la séance en attente dans le bundle du jour', () => {
    const fresh = buildPeriodDiscoveryBundle({
      snapshot: { reps: {}, checkedExercises: {} },
      window: { start: '2026-10-01', end: '2026-10-01' },
      period: 'today',
      activeProgram: program
    });
    expect(fresh.all.some((d) => d.kind === 'disc_rest_day')).toBe(true);
    expect(fresh.all.some((d) => d.kind === 'disc_pending_session')).toBe(false);
    expect(fresh.all.find((d) => d.kind === 'disc_rest_day').body).toMatch(/Hanches/);
  });
});

describe('reprise planche', () => {
  it('ne publie pas la planche quand le même volume est une pompe du jour', () => {
    const dates = [];
    for (let i = 0; i < 6; i += 1) dates.push(`2026-06-${String(1 + i * 3).padStart(2, '0')}`);
    dates.push('2026-09-30');
    const catalog = dates.map((date) => ({
      date,
      totalReps: 100,
      minutes: 40,
      exercises:
        date === '2026-09-30'
          ? [
              { id: '207', name: 'Planche bras tendus', reps: 100 },
              { id: '104', name: 'Pompes', reps: 100 }
            ]
          : [{ id: '207', name: 'Planche bras tendus', reps: 40 }]
    }));
    const ms = detectRecapMilestones({
      catalog,
      snapshot: { reps: {}, checkedExercises: {}, exerciseSetLogs: {} },
      window: { start: '2026-09-30', end: '2026-09-30' },
      voiceKey: 'today'
    });
    const planche = ms.find((m) => /planche/i.test(m.title || '') || /planche/i.test(m.body || ''));
    expect(planche).toBeFalsy();
  });
});
