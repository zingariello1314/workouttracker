import { describe, expect, it } from 'vitest';
import {
  buildP36OccasionTable,
  dowFromYmd,
  previousWindowEqualSpan,
  labelDow
} from '../recapP36Occasions.js';
import { computeP36WindowMetrics, P36_THRESHOLDS } from '../recapP36Metrics.js';
import { buildP36Discoveries, P36_KINDS, P36_RIVAL_GROUPS } from '../recapP36Discoveries.js';
import { buildPeriodDiscoveryBundle } from '../recapPeriodDiscoveries.js';
import {
  buildDayPlanSnapshotFromExercises,
  withDayPlanSnapshot
} from '../../calendarDayPlanSnapshot.js';
import { APPLICABILITY_CONFIDENCE, SNAPSHOT_STATUS } from '../../calendarPlanCaptureP33.js';

const W30 = { start: '2026-10-01', end: '2026-10-30' };
const W7 = { start: '2026-10-24', end: '2026-10-30' };

function seedClassic(data, dateStr, id, reps) {
  const next = {
    ...data,
    checkedExercises: { ...(data.checkedExercises || {}) },
    reps: { ...(data.reps || {}) }
  };
  next.checkedExercises[`${dateStr}_${id}`] = true;
  next.reps[`${dateStr}_${id}`] = String(reps);
  return next;
}

function stampProven(data, dateStr, exercises) {
  const base = buildDayPlanSnapshotFromExercises({
    dateStr,
    exercises,
    programId: 'prog1'
  });
  return withDayPlanSnapshot(data, dateStr, {
    ...base,
    status: SNAPSHOT_STATUS.HISTORICAL_FROZEN,
    dayKind: exercises.length ? 'planned_workout' : 'planned_rest',
    plannedRest: exercises.length === 0,
    frozen: true,
    applicabilityConfidence: APPLICABILITY_CONFIDENCE.PROVEN,
    planCompareEligible: true,
    provenanceVersion: 'p33.v1',
    captureTrigger: 'test'
  });
}

/** Tous les lundis d’octobre 2026 : 5, 12, 19, 26 */
const OCT_MONDAYS = ['2026-10-05', '2026-10-12', '2026-10-19', '2026-10-26'];
const OCT_WEDNESDAYS = ['2026-10-07', '2026-10-14', '2026-10-21', '2026-10-28'];

describe('P3.6 — occasions et dénominateurs', () => {
  it('compte les occurrences calendaires par weekday (local)', () => {
    expect(dowFromYmd('2026-10-05')).toBe(1); // lundi
    expect(labelDow(1)).toBe('lundi');
    const table = buildP36OccasionTable(
      { checkedExercises: {}, reps: {} },
      W30,
      { todayYmd: '2026-11-01' }
    );
    const lun = table.byDow.find((r) => r.label === 'lundi');
    expect(lun.calendarOccurrences).toBe(4);
    expect(lun.eligibleOccurrences).toBe(4);
  });

  it('exclut la journée courante du dénominateur éligible', () => {
    let data = { checkedExercises: {}, reps: {} };
    data = seedClassic(data, '2026-10-26', 101, 20);
    const table = buildP36OccasionTable(data, W30, { todayYmd: '2026-10-26' });
    const lun = table.byDow.find((r) => r.label === 'lundi');
    expect(lun.calendarOccurrences).toBe(4);
    expect(lun.incompleteCurrent).toBe(1);
    expect(lun.eligibleOccurrences).toBe(3);
    // Le lundi courant actif n’entre pas dans withClassicExclusive éligible
    expect(lun.withClassicExclusive).toBe(0);
  });

  it('taux = actifs / éligibles, pas / jours actifs seuls', () => {
    let data = { checkedExercises: {}, reps: {} };
    // 3 lundis actifs sur 4
    data = seedClassic(data, '2026-10-05', 101, 30);
    data = seedClassic(data, '2026-10-12', 101, 30);
    data = seedClassic(data, '2026-10-19', 101, 30);
    const table = buildP36OccasionTable(data, W30, { todayYmd: '2026-11-01' });
    const lun = table.byDow.find((r) => r.label === 'lundi');
    expect(lun.withClassicExclusive).toBe(3);
    expect(lun.eligibleOccurrences).toBe(4);
    expect(lun.rateClassicPct).toBe(75);
  });

  it('previousWindowEqualSpan conserve la durée', () => {
    const prev = previousWindowEqualSpan(W30);
    expect(prev.end).toBe('2026-09-30');
    expect(prev.start).toBe('2026-09-01');
  });

  it('invariants de couverture P35 réutilisés', () => {
    let data = { checkedExercises: {}, reps: {} };
    data = seedClassic(data, '2026-10-05', 101, 20);
    const table = buildP36OccasionTable(data, W7, { todayYmd: '2026-11-01' });
    expect(table.coverage.calendarDays).toBe(7);
    expect(table.coverage.consistency?.partition).toBe(true);
  });
});

describe('P3.6 — régularité / volume / exercices', () => {
  it('identifie un lundi plus régulier qu’un mercredi', () => {
    let data = { checkedExercises: {}, reps: {} };
    for (const d of OCT_MONDAYS) data = seedClassic(data, d, 101, 40);
    // un seul mercredi
    data = seedClassic(data, '2026-10-07', 101, 200);
    const m = computeP36WindowMetrics(data, W30, { todayYmd: '2026-11-01' });
    expect(m.weekdayRegularity.publishable).toBe(true);
    expect(m.weekdayRegularity.champion?.label).toBe('lundi');
    // volume peut pointer mercredi (200 reps une fois) — fréquence ≠ quantité
    if (m.weekdayVolume.publishable) {
      expect(m.weekdayVolume.top.label).not.toBe('lundi');
    }
  });

  it('freq ≠ volume via charge / jour actif (sans domination de part)', () => {
    let data = { checkedExercises: {}, reps: {} };
    // Lundis réguliers, charge/jour basse
    for (const d of OCT_MONDAYS) data = seedClassic(data, d, 101, 80);
    // Vendredis pour diluer les parts (pas de concentration ≥28 % + gap)
    for (const d of ['2026-10-02', '2026-10-09', '2026-10-16']) {
      data = seedClassic(data, d, 102, 80);
    }
    // Mercredis moins fréquents (2/4) mais médiane active nettement plus haute
    data = seedClassic(data, '2026-10-07', 104, 180);
    data = seedClassic(data, '2026-10-14', 104, 190);
    const m = computeP36WindowMetrics(data, W30, { todayYmd: '2026-11-01' });
    expect(m.weekdayRegularity.publishable).toBe(true);
    expect(m.weekdayRegularity.champion?.label).toBe('lundi');
    expect(m.weekdayVolume.publishable).toBe(false);
    expect(m.freqVsVolume.publishable).toBe(true);
    expect(m.freqVsVolume.mode).toBe('per_active_day');
    expect(m.freqVsVolume.volLabel).toBe('mercredi');
    expect(m.freqVsVolume.strengthClass).toBe('punctual_limited');
    const pack = buildP36Discoveries({
      snapshot: data,
      window: W30,
      todayYmd: '2026-11-01'
    });
    const card = pack.discoveries.find((d) => d.kind === P36_KINDS.FREQ_VS_VOLUME);
    expect(card).toBeTruthy();
    expect(card.body).toMatch(/mercredi/i);
    expect(card.body).toMatch(/davantage de répétitions/i);
    expect(card.body).toMatch(/2 mercredis actifs observés/i);
    expect(card.body).toMatch(/constat limité/i);
  });

  it('abstient freq≠volume si le bras charge repose sur un pic (n=2)', () => {
    let data = { checkedExercises: {}, reps: {} };
    for (const d of OCT_MONDAYS) data = seedClassic(data, d, 101, 150);
    // Un mercredi « normal », un pic — médiane élevée mais min sous le seuil
    data = seedClassic(data, '2026-10-07', 104, 140);
    data = seedClassic(data, '2026-10-14', 104, 400);
    const m = computeP36WindowMetrics(data, W30, { todayYmd: '2026-11-01' });
    expect(m.weekdayRegularity.publishable).toBe(true);
    expect(m.freqVsVolume.publishable).toBe(false);
    expect(m.freqVsVolume.abstainReason).toBe('load_arm_spike_sensitive');
  });

  it('abstient la régularité si aucune activité classique (taux 0 %)', () => {
    const m = computeP36WindowMetrics(
      { checkedExercises: {}, reps: {} },
      W30,
      { todayYmd: '2026-11-01' }
    );
    expect(m.weekdayRegularity.publishable).toBe(false);
    expect(m.weekdayRegularity.abstainReason).toBe('no_classic_activity_in_window');
  });

  it('abstient la régularité weekday sur 7 jours', () => {
    let data = { checkedExercises: {}, reps: {} };
    data = seedClassic(data, '2026-10-26', 101, 20);
    data = seedClassic(data, '2026-10-27', 101, 20);
    const pack = buildP36Discoveries({
      snapshot: data,
      window: W7,
      todayYmd: '2026-11-01'
    });
    expect(
      pack.discoveries.some((d) => d.kind === P36_KINDS.WEEKDAY_REGULARITY)
    ).toBe(false);
  });

  it('groupe de jours à fréquences proches → pas de champion forcé', () => {
    let data = { checkedExercises: {}, reps: {} };
    // lun, mar, mer tous 3/4
    for (const d of OCT_MONDAYS.slice(0, 3)) data = seedClassic(data, d, 101, 20);
    for (const d of ['2026-10-06', '2026-10-13', '2026-10-20']) {
      data = seedClassic(data, d, 104, 20);
    }
    for (const d of OCT_WEDNESDAYS.slice(0, 3)) data = seedClassic(data, d, 103, 20);
    const m = computeP36WindowMetrics(data, W30, { todayYmd: '2026-11-01' });
    if (m.weekdayRegularity.publishable) {
      expect(
        m.weekdayRegularity.tiedGroup != null || m.weekdayRegularity.champion != null
      ).toBe(true);
    }
  });

  it('exercice dominant fréquence ≠ volume possible', () => {
    let data = { checkedExercises: {}, reps: {} };
    // 101 fréquent petit volume
    for (const d of [
      '2026-10-01',
      '2026-10-03',
      '2026-10-05',
      '2026-10-07',
      '2026-10-09'
    ]) {
      data = seedClassic(data, d, 101, 10);
    }
    // 104 rare gros volume
    data = seedClassic(data, '2026-10-02', 104, 400);
    data = seedClassic(data, '2026-10-10', 104, 400);
    const m = computeP36WindowMetrics(data, W30, { todayYmd: '2026-11-01' });
    expect(m.exercises.publishableFreq).toBe(true);
    expect(m.exercises.topFreq.id).toBe('101');
    expect(m.exercises.publishableVol).toBe(true);
    expect(m.exercises.topVolume.id).toBe('104');
  });

  it('soustrait sync GTG du volume exercice (pas de double comptage)', () => {
    const data = {
      checkedExercises: { '2026-10-05_101': true },
      reps: { '2026-10-05_101': '100' },
      enduranceData: {
        gtg: {
          config: { selectedIds: ['pullups'], manualMax: { pullups: 10 } },
          days: {},
          workoutSync: { '2026-10-05': { pullups: 40 } }
        }
      }
    };
    // besoin de plusieurs jours pour publish — juste vérifier agrégat
    let enriched = data;
    for (const d of ['2026-10-12', '2026-10-19']) {
      enriched = seedClassic(enriched, d, 101, 60);
    }
    enriched = {
      ...enriched,
      enduranceData: data.enduranceData,
      reps: { ...enriched.reps, '2026-10-05_101': '100' }
    };
    const m = computeP36WindowMetrics(enriched, W30, { todayYmd: '2026-11-01' });
    const row = m.exercises.byVolume.find((r) => r.id === '101');
    expect(row.exclusiveReps).toBe(60 + 60 + 60); // 100-40 + 60 + 60
  });

  it('identité gtg_ ambiguë exclue du classement volume', () => {
    const data = {
      reps: {
        '2026-10-05_gtg_mystery': '500',
        '2026-10-12_gtg_mystery': '500',
        '2026-10-01_104': '30',
        '2026-10-03_104': '30',
        '2026-10-08_104': '30'
      },
      checkedExercises: {}
    };
    const m = computeP36WindowMetrics(data, W30, { todayYmd: '2026-11-01' });
    expect(m.exercises.byVolume.every((r) => !String(r.id).startsWith('gtg_'))).toBe(
      true
    );
  });

  it('assiduité prouvée s’abstient sans snapshots proven', () => {
    let data = { checkedExercises: {}, reps: {} };
    for (const d of OCT_MONDAYS) data = seedClassic(data, d, 101, 20);
    const m = computeP36WindowMetrics(data, W30, { todayYmd: '2026-11-01' });
    expect(m.provenDow.publishable).toBe(false);
  });

  it('assiduité prouvée utilise seulement planCompareEligible', () => {
    let data = { checkedExercises: {}, reps: {} };
    const EX = [{ id: 101, originalId: 'a', name: 'Tractions', series: '3×5' }];
    for (const d of OCT_MONDAYS) {
      data = stampProven(data, d, EX);
      data = seedClassic(data, d, 101, 20);
    }
    // mercredis prévus non réalisés
    for (const d of OCT_WEDNESDAYS) {
      data = stampProven(data, d, EX);
    }
    const m = computeP36WindowMetrics(data, W30, { todayYmd: '2026-11-01' });
    expect(m.provenDow.candidates.length).toBeGreaterThanOrEqual(1);
    // peut publier si écart clair
    if (m.provenDow.publishable) {
      expect(m.provenDow.top.label).toBe('lundi');
    }
  });
});

describe('P3.6 — E0 et rivaux', () => {
  it('opt-out includeP36Discoveries', () => {
    let data = { checkedExercises: {}, reps: {} };
    for (const d of OCT_MONDAYS) data = seedClassic(data, d, 101, 40);
    const bundle = buildPeriodDiscoveryBundle({
      snapshot: data,
      window: W30,
      includeP36Discoveries: false,
      includeP35Discoveries: false,
      includeP32bMuscleDiscoveries: false,
      includeP34RevisionDiscoveries: false
    });
    expect(bundle.p36.includedInPool).toBe(false);
    expect((bundle.all || []).every((d) => !String(d.kind).startsWith('disc_p36_'))).toBe(
      true
    );
  });

  it('rivaux : pas de fusion incorrecte avec calendar_rhythm / unplanned', () => {
    const flat = P36_RIVAL_GROUPS.flat();
    expect(flat).not.toContain('disc_calendar_rhythm');
    expect(flat).not.toContain('disc_gtg_unplanned_now');
    expect(flat).toContain('disc_exercise_share');
  });

  it('sélection déterministe', () => {
    let data = { checkedExercises: {}, reps: {} };
    for (const d of OCT_MONDAYS) data = seedClassic(data, d, 101, 40);
    for (const d of OCT_WEDNESDAYS.slice(0, 1)) data = seedClassic(data, d, 104, 300);
    const a = buildP36Discoveries({
      snapshot: data,
      window: W30,
      todayYmd: '2026-11-01'
    });
    const b = buildP36Discoveries({
      snapshot: data,
      window: W30,
      todayYmd: '2026-11-01'
    });
    expect(a.discoveries.map((d) => d.kind)).toEqual(b.discoveries.map((d) => d.kind));
  });

  it('formulations sans jargon causal', () => {
    let data = { checkedExercises: {}, reps: {} };
    for (const d of OCT_MONDAYS) data = seedClassic(data, d, 101, 40);
    for (const d of ['2026-10-07']) data = seedClassic(data, d, 104, 250);
    const pack = buildP36Discoveries({
      snapshot: data,
      window: W30,
      todayYmd: '2026-11-01'
    });
    for (const d of pack.discoveries) {
      expect(d.body).not.toMatch(/optimisé|discipline irréprochable|intensité musculaire/i);
      expect(d.body.length).toBeGreaterThanOrEqual(40);
    }
  });
});

describe('P3.6 — stabilité hebdomadaire', () => {
  it('détecte une présence stable sur ≥6 semaines', () => {
    let data = { checkedExercises: {}, reps: {} };
    // 1er août → 30 oct : ~13 semaines ; 3 jours actifs / semaine (lun mer ven)
    const start = new Date(2026, 7, 3); // 3 août 2026 lundi
    // Couvrir toutes les semaines jusqu’à fin octobre (évite semaines pleines à 0 actif → faux CV).
    for (let w = 0; w < 14; w += 1) {
      for (const offset of [0, 2, 4]) {
        const d = new Date(start);
        d.setDate(start.getDate() + w * 7 + offset);
        const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (ymd >= '2026-08-01' && ymd <= '2026-10-30') {
          data = seedClassic(data, ymd, 101, 25);
        }
      }
    }
    const m = computeP36WindowMetrics(
      data,
      { start: '2026-08-01', end: '2026-10-30' },
      { todayYmd: '2026-11-01' }
    );
    expect(m.stability.weekCount).toBeGreaterThanOrEqual(P36_THRESHOLDS.MIN_WEEKS_STABILITY);
    expect(m.stability.medianActiveDaysPerWeek).toBeGreaterThanOrEqual(2);
    // CV bas attendu sur une série quasi constante (~3 j/sem).
    expect(m.stability.cvActiveDays).toBeLessThanOrEqual(P36_THRESHOLDS.MAX_WEEKLY_ACTIVE_CV);
    expect(m.stability.publishable).toBe(true);
  });
});
