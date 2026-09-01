import { describe, expect, it } from 'vitest';
import DateHelper from '../../dateHelper';
import {
  buildPeriodDiscoveryBundle,
  measureRecapWindow,
  observationCaps,
  periodVoice,
  PERIOD_QUESTIONS,
  selectPeriodDiscoveries
} from '../recapPeriodDiscoveries';
import { computeRecapMuscleState } from '../recapMuscleLoadEngine';
import { buildHorizonEssayCandidates } from '../recapHorizonEssays';
import { renderInterpretationText } from '../interpretationRenderer';

const NAMES = {
  501: 'Dips parallèles',
  502: 'Tractions australiennes pronation',
  503: 'Relevés de genoux',
  504: 'Pompes endurance',
  505: 'Extensions triceps',
  506: 'Développé militaire'
};

function getName(id) {
  return NAMES[Number(id)] || NAMES[id] || `Ex ${id}`;
}

function blob(c) {
  return `${c.context?.title || ''} ${c.context?.body || ''} ${renderInterpretationText(c) || ''}`;
}

function addCheck(snapshot, date, exId, reps) {
  snapshot.reps[`${date}_${exId}`] = reps;
  snapshot.checkedExercises[`${date}_${exId}`] = true;
}

function streetAct(date, minutes) {
  return {
    date,
    activityType: 'strength_training',
    activityName: 'Street Workout',
    duration: minutes * 60
  };
}

function buildAugustFixture() {
  const snapshot = { reps: {}, checkedExercises: {} };
  const end = '2026-08-31';
  const garmin = { activities: { cardio: [] }, dailyMetrics: {} };

  addCheck(snapshot, end, 501, 48);
  addCheck(snapshot, end, 502, 48);
  addCheck(snapshot, end, 503, 60);
  addCheck(snapshot, end, 504, 64);
  addCheck(snapshot, end, 506, 140);

  addCheck(snapshot, '2026-08-28', 504, 18);
  addCheck(snapshot, '2026-08-28', 505, 60);
  addCheck(snapshot, '2026-08-28', 501, 48);
  addCheck(snapshot, '2026-08-28', 506, 80);
  addCheck(snapshot, '2026-08-28', 503, 139);

  addCheck(snapshot, '2026-08-25', 504, 18);
  addCheck(snapshot, '2026-08-25', 505, 60);
  addCheck(snapshot, '2026-08-25', 501, 48);
  addCheck(snapshot, '2026-08-25', 506, 80);
  addCheck(snapshot, '2026-08-25', 503, 139);

  const earlier = [];
  for (let i = 0; i < 12; i += 1) {
    const d = DateHelper.addDays('2026-08-22', -(i * 2));
    earlier.push(d);
    addCheck(snapshot, d, 504, 250);
    addCheck(snapshot, d, 506, 30);
    addCheck(snapshot, d, 501, 4);
  }

  garmin.activities.cardio.push(streetAct(end, 65));
  garmin.activities.cardio.push(streetAct('2026-08-28', 60));
  garmin.activities.cardio.push(streetAct('2026-08-25', 60));
  earlier.forEach((d) => garmin.activities.cardio.push(streetAct(d, 50)));

  garmin.dailyMetrics[end] = { calories: { active: 386 } };
  garmin.dailyMetrics['2026-08-28'] = { calories: { active: 360 } };
  garmin.dailyMetrics['2026-08-25'] = { calories: { active: 360 } };
  earlier.forEach((d, i) => {
    garmin.dailyMetrics[d] = { calories: { active: 140 + (i % 3) * 10 } };
  });

  return { snapshot, garmin, end };
}

describe('recapPeriodDiscoveries', () => {
  it('assigne une question différente à chaque plage', () => {
    expect(PERIOD_QUESTIONS.today).toMatch(/cette séance/i);
    expect(PERIOD_QUESTIONS['7d']).toMatch(/cette semaine/i);
    expect(PERIOD_QUESTIONS['30d']).toMatch(/évolue/i);
    expect(PERIOD_QUESTIONS['3m']).toMatch(/trajectoire/i);
  });

  it('mesure la densité reps/h d’une séance et la compare à 7 j. / 30 j.', () => {
    const { snapshot, garmin, end } = buildAugustFixture();
    const today = measureRecapWindow({
      snapshot,
      window: { start: end, end },
      getExerciseNameById: getName,
      garminData: garmin,
      periodId: 'today',
      refDate: new Date(2026, 7, 31, 12, 0, 0)
    });
    expect(today.totalReps).toBe(360);
    expect(today.minutes).toBeGreaterThanOrEqual(60);
    expect(today.repsPerHour).toBeGreaterThan(300);
    expect(today.repsPerHour).toBeLessThan(360);

    const bundle = buildPeriodDiscoveryBundle({
      snapshot,
      window: { start: end, end },
      period: 'today',
      getExerciseNameById: getName,
      garminData: garmin,
      athleteIdentity: { frequency: { meanPerWeek: 4.1 } }
    });
    const dens = bundle.all.find((d) => d.kind === 'disc_density');
    expect(dens).toBeTruthy();
    expect(dens.nature).toBe('now');
    expect(dens.body).toMatch(/reps par heure/i);
    expect(dens.body).toMatch(/30 derniers jours|rythme mensuel/i);
    expect(dens.body).not.toMatch(/séance importante/i);
  });

  it('sur 7 jours, détecte la concentration d’une journée et la dominante poussée', () => {
    const { snapshot, garmin } = buildAugustFixture();
    const bundle = buildPeriodDiscoveryBundle({
      snapshot,
      window: { start: '2026-08-25', end: '2026-08-31' },
      period: '7d',
      getExerciseNameById: getName,
      garminData: garmin,
      athleteIdentity: { frequency: { meanPerWeek: 4.1 } }
    });
    expect(bundle.question).toMatch(/cette semaine/i);
    expect(bundle.comparisons.period.trainingDays).toBe(3);
    expect(bundle.comparisons.period.totalReps).toBeGreaterThan(900);

    const peak = bundle.all.find((d) => d.kind === 'disc_peak_day');
    expect(peak).toBeTruthy();
    expect(peak.body).toMatch(/31|août|08/i);
    expect(peak.body).toMatch(/%/);

    const muscle = bundle.all.find((d) => d.kind === 'disc_muscle_now' || d.kind === 'disc_push_pull');
    expect(muscle).toBeTruthy();
    expect(muscle.body).toMatch(/reps/);

    const selectedNatures = new Set(bundle.selected.map((d) => d.nature));
    expect(selectedNatures.has('now')).toBe(true);
    expect(selectedNatures.has('trajectory') || selectedNatures.has('journey')).toBe(true);
  });

  it('sur aujourd’hui, les essais remplacent le template générique par des comparaisons chiffrées', () => {
    const { snapshot, garmin, end } = buildAugustFixture();
    const cands = buildHorizonEssayCandidates({
      snapshot,
      window: { start: end, end },
      period: 'today',
      getExerciseNameById: getName,
      garminData: garmin,
      athleteIdentity: { frequency: { meanPerWeek: 4.1, currentPerWeek: 3.5, ready: true } }
    });
    const text = cands.map(blob).join('\n');
    expect(text).not.toMatch(/cycle de quelques semaines/i);
    expect(cands.some((c) => String(c.id).includes('disc_'))).toBe(true);
    expect(cands.filter((c) => String(c.id).includes('continuity')).length).toBe(0);
    expect(text).toMatch(/%/);
    expect(text).toMatch(/360|reps par heure|épaules|dips/i);
  });

  it('place les dips du jour comme part du mois, pas comme un simple total', () => {
    const { snapshot, garmin, end } = buildAugustFixture();
    const bundle = buildPeriodDiscoveryBundle({
      snapshot,
      window: { start: end, end },
      period: 'today',
      getExerciseNameById: getName,
      garminData: garmin
    });
    const share = bundle.all.find((d) => d.kind === 'disc_exercise_share');
    expect(share).toBeTruthy();
    expect(share.body).toMatch(/dips parallèles/i);
    expect(share.body).toMatch(/%/);
    expect(share.body).toMatch(/30/);
  });

  it('lit les muscles au même endroit que le moteur Recap, pas un split maison', () => {
    const { snapshot, garmin, end } = buildAugustFixture();
    const ref = new Date(2026, 7, 31, 12, 0, 0);
    const state = computeRecapMuscleState(snapshot, 'today', getName, ref, { start: end, end });
    const measured = measureRecapWindow({
      snapshot,
      window: { start: end, end },
      getExerciseNameById: getName,
      garminData: garmin,
      recapState: state,
      periodId: 'today',
      refDate: ref
    });
    Object.keys(state.repShareByGroup || {}).forEach((g) => {
      if (g === 'full_body') return;
      const expected = Math.round(state.repShareByGroup[g] || 0);
      if (expected <= 0) return;
      expect(measured.byMuscle[g]?.reps).toBe(expected);
    });
  });

  it('cite les exercices du jour de pic, pas le top de la semaine', () => {
    const { snapshot, garmin } = buildAugustFixture();
    const bundle = buildPeriodDiscoveryBundle({
      snapshot,
      window: { start: '2026-08-25', end: '2026-08-31' },
      period: '7d',
      getExerciseNameById: getName,
      garminData: garmin
    });
    const peak = bundle.all.find((d) => d.kind === 'disc_peak_day');
    expect(peak.body).toMatch(/dips parallèles|australiennes|relevés/i);
    expect(peak.body).not.toMatch(/250 pompes/i);
  });

  it('retient qu’un mouvement devient structurel dans sa famille', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    for (let i = 0; i < 4; i += 1) {
      addCheck(snapshot, DateHelper.addDays('2026-07-08', i * 6), 504, 80);
      addCheck(snapshot, DateHelper.addDays('2026-07-08', i * 6), 501, 8);
    }
    addCheck(snapshot, '2026-08-10', 501, 48);
    addCheck(snapshot, '2026-08-18', 501, 48);
    addCheck(snapshot, '2026-08-31', 501, 48);
    addCheck(snapshot, '2026-08-10', 504, 20);
    addCheck(snapshot, '2026-08-18', 504, 20);
    addCheck(snapshot, '2026-08-31', 504, 20);
    const bundle = buildPeriodDiscoveryBundle({
      snapshot,
      window: { start: '2026-08-02', end: '2026-08-31' },
      period: '30d',
      getExerciseNameById: getName
    });
    const row = bundle.all.find((d) => d.kind === 'disc_structural_memory');
    expect(row).toBeTruthy();
    expect(row.body).toMatch(/dips parallèles/i);
    expect(row.body).toMatch(/structure/i);
    expect(row.body).toMatch(/%/);
  });

  it('décrit le mix force / endurance / poly / charges', () => {
    const { snapshot, garmin } = buildAugustFixture();
    const bundle = buildPeriodDiscoveryBundle({
      snapshot,
      window: { start: '2026-08-25', end: '2026-08-31' },
      period: '7d',
      getExerciseNameById: getName,
      garminData: garmin
    });
    const mix = bundle.all.find((d) => d.kind === 'disc_stimulus_mix');
    expect(mix).toBeTruthy();
    expect(mix.body).toMatch(/polyarticulaires|isolation|force|endurance/i);
  });

  it('relie course et renforcement quand les deux existent', () => {
    const snapshot = {
      reps: {},
      checkedExercises: {},
      enduranceData: {
        sessions: {
          running: [
            { date: '2026-08-12', distance: 6.4, duration: '32 min' },
            { date: '2026-08-20', distance: 5.2, duration: '28 min' },
            { date: '2026-08-29', distance: 7.1, duration: '36 min' }
          ]
        }
      }
    };
    addCheck(snapshot, '2026-08-10', 501, 48);
    addCheck(snapshot, '2026-08-18', 501, 48);
    addCheck(snapshot, '2026-08-31', 501, 80);
    addCheck(snapshot, '2026-08-10', 502, 40);
    addCheck(snapshot, '2026-08-18', 502, 40);
    addCheck(snapshot, '2026-08-31', 502, 48);
    const garmin = { activities: { cardio: [] }, dailyMetrics: {} };
    const bundle = buildPeriodDiscoveryBundle({
      snapshot,
      window: { start: '2026-08-02', end: '2026-08-31' },
      period: '30d',
      getExerciseNameById: getName,
      garminData: garmin
    });
    const row = bundle.all.find((d) => d.kind === 'disc_cardio_strength');
    expect(row).toBeTruthy();
    expect(row.body).toMatch(/km/i);
    expect(row.body).toMatch(/reps/i);
    expect(row.body).not.toMatch(/pas assez/i);
  });

  it('sur 30 jours, compare au mois précédent avec densité par séance', () => {
    const { snapshot, garmin } = buildAugustFixture();
    const bundle = buildPeriodDiscoveryBundle({
      snapshot,
      window: { start: '2026-08-02', end: '2026-08-31' },
      period: '30d',
      getExerciseNameById: getName,
      garminData: garmin
    });
    const vol = bundle.all.find((d) => d.kind === 'disc_volume_shape');
    expect(vol).toBeTruthy();
    expect(vol.nature).toBe('now');
    expect(vol.body).toMatch(/30 jours d'avant|mois précédent/i);
    expect(vol.body).toMatch(/reps/);
    expect(vol.body).toMatch(/séance/);
    expect(bundle.preferPeriodNow).toBe(true);
  });

  it('sur 3 mois, utilise le rythme 28 j. et le meilleur mois, jamais 0,6 vs 4,5', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    for (let i = 0; i < 18; i += 1) {
      addCheck(snapshot, DateHelper.addDays('2026-06-04', i * 2), 504, 220);
    }
    for (let i = 0; i < 8; i += 1) {
      addCheck(snapshot, DateHelper.addDays('2026-07-06', i * 3), 504, 80);
    }
    for (let i = 0; i < 6; i += 1) {
      addCheck(snapshot, DateHelper.addDays('2026-08-04', i * 4), 504, 60);
    }
    const bundle = buildPeriodDiscoveryBundle({
      snapshot,
      window: { start: '2026-06-02', end: '2026-08-31' },
      period: '3m',
      getExerciseNameById: getName,
      features: {
        frequency: { perWeek28d: 3.6, perWeekPrev28d: 5.1 },
        sessions28d: 14,
        prevSessions28d: 20
      }
    });
    const vol = bundle.all.find((d) => d.kind === 'disc_volume_shape');
    expect(vol).toBeTruthy();
    expect(vol.body).toMatch(/3[.,]6/);
    expect(vol.body).toMatch(/5[.,]1/);
    expect(vol.body).not.toMatch(/0[.,]6/);
    const best = bundle.all.find((d) => d.kind === 'disc_best_month');
    expect(best).toBeTruthy();
    expect(best.body).toMatch(/juin/i);
  });

  it('raconte un abandon de part familiale, pas seulement un top d’exercice', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    for (let i = 0; i < 5; i += 1) {
      addCheck(snapshot, DateHelper.addDays('2026-07-06', i * 5), 501, 48);
      addCheck(snapshot, DateHelper.addDays('2026-07-06', i * 5), 504, 80);
    }
    for (let i = 0; i < 4; i += 1) {
      addCheck(snapshot, DateHelper.addDays('2026-08-08', i * 6), 504, 90);
    }
    const bundle = buildPeriodDiscoveryBundle({
      snapshot,
      window: { start: '2026-08-02', end: '2026-08-31' },
      period: '30d',
      getExerciseNameById: getName
    });
    const fade = bundle.all.find((d) => d.kind === 'disc_family_fade');
    expect(fade).toBeTruthy();
    expect(fade.body).toMatch(/dips/i);
    expect(fade.body).toMatch(/%/);
  });

  it('écrit une nuit vs les 7 dernières, et se tait s’il n’y a pas de sommeil', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    addCheck(snapshot, '2026-08-31', 501, 360);
    const days = {};
    for (let i = 0; i < 7; i += 1) {
      const d = DateHelper.addDays('2026-08-31', -i);
      days[d] = {
        sleep: {
          duration: 7.7 + (i === 0 ? 0.06 : -0.1 * (i % 3)),
          deep: 1.05,
          rem: 1.5,
          light: 5.1,
          awake: 0.3,
          avgHR: 57 + i
        },
        bodyBattery: { start: 38, end: 90, charged: 52 }
      };
    }
    const bundle = buildPeriodDiscoveryBundle({
      snapshot,
      window: { start: '2026-08-31', end: '2026-08-31' },
      period: 'today',
      getExerciseNameById: getName,
      garminData: { dailyMetrics: days, activities: { cardio: [] } }
    });
    const night = bundle.all.find((d) => d.kind === 'disc_sleep_night');
    expect(night).toBeTruthy();
    expect(night.body).toMatch(/7 h/);
    expect(night.body).toMatch(/architecture/i);
    expect(night.body).not.toMatch(/pas assez de données/i);
    const empty = buildPeriodDiscoveryBundle({
      snapshot,
      window: { start: '2026-08-31', end: '2026-08-31' },
      period: 'today',
      getExerciseNameById: getName,
      garminData: { dailyMetrics: {}, activities: { cardio: [] } }
    });
    expect(empty.all.some((d) => String(d.kind).startsWith('disc_sleep'))).toBe(false);
  });

  it('raconte la concentration hebdomadaire du volume derrière les nuits ≥ 7 h 30', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    addCheck(snapshot, '2026-08-25', 501, 360);
    addCheck(snapshot, '2026-08-28', 501, 329);
    addCheck(snapshot, '2026-08-31', 501, 200);
    const hoursByOffset = { 0: 7.07, 1: 7.1, 2: 6.8, 3: 8.2, 4: 7.0, 5: 6.9, 6: 7.77 };
    const days = {};
    for (let i = 0; i < 7; i += 1) {
      const d = DateHelper.addDays('2026-08-31', -i);
      days[d] = {
        sleep: { duration: hoursByOffset[i], deep: 1.05, rem: 1.4, light: 5.0, awake: 0.3 }
      };
    }
    const bundle = buildPeriodDiscoveryBundle({
      snapshot,
      window: { start: '2026-08-25', end: '2026-08-31' },
      period: '7d',
      getExerciseNameById: getName,
      garminData: { dailyMetrics: days, activities: { cardio: [] } }
    });
    const week = bundle.all.find((d) => d.kind === 'disc_sleep_week');
    expect(week).toBeTruthy();
    expect(week.body).toMatch(/volume/i);
    expect(week.body).not.toMatch(/pas assez de données/i);
  });

  it('sur 30 jours, reformule le seuil 7 h 30 en concentration mensuelle, pas en copie de la semaine', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    const days = {};
    for (let i = 0; i < 30; i += 1) {
      const d = DateHelper.addDays('2026-08-31', -i);
      const long = i % 3 !== 2;
      if (i % 2 === 0) {
        addCheck(snapshot, d, 501, long ? 360 : 150);
      }
      days[d] = {
        sleep: {
          duration: long ? 7.8 : 6.6,
          deep: 1.05,
          rem: long ? 1.5 : 1.1,
          light: long ? 5.1 : 4.2,
          awake: long ? 0.25 : 0.45
        }
      };
    }
    const bundle = buildPeriodDiscoveryBundle({
      snapshot,
      window: { start: '2026-08-02', end: '2026-08-31' },
      period: '30d',
      getExerciseNameById: getName,
      garminData: { dailyMetrics: days, activities: { cardio: [] } }
    });
    const month = bundle.all.find((d) => d.kind === 'disc_sleep_month');
    expect(month).toBeTruthy();
    expect(month.body).toMatch(/30 derniers jours/i);
    expect(month.body).toMatch(/concentrent|concentr/i);
    expect(month.body).not.toMatch(/pas assez de données/i);
    expect(bundle.all.some((d) => d.kind === 'disc_sleep_volume')).toBe(false);
  });

  it('sur 3 mois, raconte l’accumulation des journées ≥ 300 derrière les nuits longues', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    const days = {};
    for (let i = 0; i < 90; i += 1) {
      const d = DateHelper.addDays('2026-08-31', -i);
      const long = i % 5 !== 0;
      if (i % 2 === 0) {
        addCheck(snapshot, d, 501, long ? 330 : 160);
      }
      days[d] = {
        sleep: { duration: long ? 7.7 : 6.5, deep: 1.05, rem: 1.4, light: 5.0, awake: 0.3 }
      };
    }
    const bundle = buildPeriodDiscoveryBundle({
      snapshot,
      window: { start: '2026-06-03', end: '2026-08-31' },
      period: '3m',
      getExerciseNameById: getName,
      garminData: { dailyMetrics: days, activities: { cardio: [] } }
    });
    const quarter = bundle.all.find((d) => d.kind === 'disc_sleep_quarter');
    expect(quarter).toBeTruthy();
    expect(quarter.body).toMatch(/300/);
    expect(quarter.body).toMatch(/nuit/i);
    expect(quarter.body).not.toMatch(/pas assez de données/i);
  });

  it('sélectionne d’abord ce qui répond à la question de la plage', () => {
    const fake = [
      { kind: 'disc_kcal_profile', nature: 'journey', family: 'kcal_profile', score: 90 },
      { kind: 'disc_volume_shape', nature: 'now', family: 'volume_shape', score: 70 },
      { kind: 'disc_best_month', nature: 'journey', family: 'best_month', score: 68 },
      { kind: 'disc_muscle_now', nature: 'now', family: 'muscle_now', score: 66 },
      { kind: 'disc_push_pull', nature: 'trajectory', family: 'push_pull', score: 88 },
      { kind: 'disc_muscle_share_shift', nature: 'trajectory', family: 'muscle_shift', score: 72 },
      { kind: 'disc_anchor', nature: 'journey', family: 'period_weight', score: 80 },
      { kind: 'disc_quarter_arc', nature: 'journey', family: 'quarter_profile', score: 64 }
    ];
    const month = selectPeriodDiscoveries(fake, null, 'month');
    expect(month.filter((d) => d.nature === 'now').map((d) => d.kind)).toEqual([
      'disc_volume_shape',
      'disc_muscle_now'
    ]);
    expect(month.some((d) => d.kind === 'disc_best_month')).toBe(true);
    expect(month.some((d) => d.kind === 'disc_muscle_share_shift')).toBe(true);
    expect(month.some((d) => d.kind === 'disc_push_pull')).toBe(false);

    const long = selectPeriodDiscoveries(fake, null, 'long');
    expect(long.find((d) => d.nature === 'now')?.kind).toBe('disc_volume_shape');
    expect(long.some((d) => d.kind === 'disc_best_month')).toBe(true);
    expect(long.some((d) => d.kind === 'disc_kcal_profile')).toBe(false);
  });

  it('n’ouvre un slot extra que si l’observation est forte et prioritaire', () => {
    const many = [
      { kind: 'disc_volume_shape', nature: 'now', family: 'volume_shape', score: 80 },
      { kind: 'disc_muscle_now', nature: 'now', family: 'muscle_now', score: 78 },
      { kind: 'disc_sleep_quarter', nature: 'journey', family: 'sleep_quarter', score: 90 },
      { kind: 'disc_best_month', nature: 'journey', family: 'best_month', score: 88 },
      { kind: 'disc_sleep_freq', nature: 'journey', family: 'sleep_freq', score: 86 },
      { kind: 'disc_kcal_profile', nature: 'journey', family: 'kcal_profile', score: 92 },
      { kind: 'disc_sleep_volume', nature: 'trajectory', family: 'sleep_volume', score: 84 },
      { kind: 'disc_cardio_strength', nature: 'trajectory', family: 'cardio_strength', score: 83 }
    ];
    expect(observationCaps('long', many).journey).toBe(3);
    const long = selectPeriodDiscoveries(many, null, 'long');
    expect(long.filter((d) => d.nature === 'journey').map((d) => d.kind)).toEqual([
      'disc_sleep_quarter',
      'disc_best_month',
      'disc_sleep_freq'
    ]);
    expect(long.some((d) => d.kind === 'disc_kcal_profile')).toBe(false);
    expect(observationCaps('today', many).trajectory).toBe(3);
  });

  it('traite 1 an comme une voix distincte, avec un plafond plus haut seulement si l’historique est riche', () => {
    expect(periodVoice('1y', 365).key).toBe('year');
    expect(periodVoice('1y', 365).thisPeriod).toMatch(/année/);
    expect(PERIOD_QUESTIONS['1y']).toMatch(/année/);
    expect(periodVoice('3m', 92).key).toBe('long');
    const few = [
      { kind: 'a', score: 80 },
      { kind: 'b', score: 80 },
      { kind: 'c', score: 80 }
    ];
    expect(observationCaps('year', few).journey).toBe(2);
    const rich = Array.from({ length: 8 }, (_, i) => ({ kind: `k${i}`, score: 80 }));
    expect(observationCaps('year', rich).journey).toBe(3);
    expect(observationCaps('year', rich).trajectory).toBe(4);
  });

  it('quand aujourd’hui est à 0 reps, décrit une séance en attente plutôt qu’une contraction', () => {
    const { snapshot, garmin } = buildAugustFixture();
    const bundle = buildPeriodDiscoveryBundle({
      snapshot,
      window: { start: '2026-09-01', end: '2026-09-01' },
      period: 'today',
      getExerciseNameById: getName,
      garminData: garmin
    });
    const pending = bundle.all.find((d) => d.kind === 'disc_pending_session');
    expect(pending).toBeTruthy();
    expect(pending.nature).toBe('now');
    expect(`${pending.title} ${pending.body}`).toMatch(/pas encore|attente/i);
    expect(pending.body).not.toMatch(/pas assez de données/i);
    expect(pending.body).not.toMatch(/contraction/i);
    expect(bundle.selected.some((d) => d.kind === 'disc_pending_session')).toBe(true);
    expect(bundle.all.find((d) => d.kind === 'disc_volume_shape')).toBeFalsy();
  });

  it('sur 7 jours, le portrait de volume tisse muscles, pic et course comme le § 14.2', () => {
    const { snapshot, garmin } = buildAugustFixture();
    const bundle = buildPeriodDiscoveryBundle({
      snapshot,
      window: { start: '2026-08-25', end: '2026-08-31' },
      period: '7d',
      getExerciseNameById: getName,
      garminData: garmin,
      athleteIdentity: { frequency: { meanPerWeek: 4.1 } }
    });
    const shape = bundle.all.find((d) => d.kind === 'disc_volume_shape');
    expect(shape).toBeTruthy();
    expect(shape.body.length).toBeGreaterThan(260);
    expect(shape.body).toMatch(/séance|reps/i);
    expect(shape.body).toMatch(/renforcement|tirage|triceps|pector|séance du/i);
  });
});
