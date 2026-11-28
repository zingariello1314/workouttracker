/**
 * Jalon post-P6 — restitution éditoriale (outlier proof, visuals, portée).
 */
import { describe, expect, it } from 'vitest';
import { buildExerciseTrajectory, renderExerciseTrajectoryCopy } from '../exerciseTrajectoryAnalysis';
import {
  buildComposedEvidenceFromTrajectory,
  classifyContinuity
} from '../recapComposedEvidence';
import {
  buildOutlierEvidence,
  narrateFromComposedEvidence,
  titleFromComposedEvidence
} from '../recapComposedNarration';
import { buildVisualInsightSpec } from '../analysisVisualInsight';
import { composeRelativeConcentrationReading } from '../phenomenonComposition';
import { describeCalendarShape } from '../recapCalendarShape';

function ymd(offsetFromBase, base = '2026-09-28') {
  const d = new Date(`${base}T12:00:00`);
  d.setDate(d.getDate() + offsetFromBase);
  return d.toISOString().slice(0, 10);
}

function trajFrom(totals, exerciseId = 703294235) {
  const checkedExercises = {};
  const reps = {};
  totals.forEach((total, i) => {
    const date = ymd(i * 7);
    const key = `${date}_${exerciseId}`;
    checkedExercises[key] = true;
    reps[key] = String(total);
  });
  return buildExerciseTrajectory({
    snapshot: { checkedExercises, reps },
    exerciseId,
    exerciseName: 'Hyperextension',
    window: { start: ymd(0), end: ymd((totals.length - 1) * 7) },
    mode: 'progress'
  });
}

describe('Post-P6 restitution — outlier proof first', () => {
  it('corps et preuve centrés sur 7×48 puis 24, pas sur la moyenne seule', () => {
    const traj = trajFrom([48, 48, 48, 48, 48, 48, 48, 24]);
    const composed = traj.composedEvidence || buildComposedEvidenceFromTrajectory(traj);
    expect(classifyContinuity(traj).kind).toBe('isolated_outlier');
    const narrated = narrateFromComposedEvidence(composed, {
      title: 'x',
      body: 'y',
      metrics: { composedEvidence: composed }
    });
    expect(narrated.body).toMatch(/ponctuelle|atypique|sans permettre de conclure/i);
    expect(narrated.body).not.toMatch(/^Sur 8 séances.*passe d’environ 48 à 40/i);
    const rendered = renderExerciseTrajectoryCopy(traj);
    expect(rendered.evidence).toMatch(/7×≈48 → 1×24|7×≈48/);
    expect(rendered.evidence).not.toMatch(/comparables/i);
    const ev = buildOutlierEvidence(composed) || narrated.evidence || rendered.evidence;
    expect(String(ev)).toMatch(/24/);
    expect(titleFromComposedEvidence(composed, { name: 'Hyperextension' })).toMatch(/atypique/i);
  });

  it('visuel trajectoire : plateau puis point atypique, pas moyenne progressive', () => {
    const traj = trajFrom([48, 48, 48, 48, 48, 48, 48, 24]);
    const composed = traj.composedEvidence || buildComposedEvidenceFromTrajectory(traj);
    const spec = buildVisualInsightSpec({
      kind: 'disc_exercise_progress',
      title: 'Hyperextension : une séance atypique, pas encore une tendance',
      metrics: {
        visualKind: 'trajectory_sessions',
        composedEvidence: composed,
        sessionTotals: [48, 48, 48, 48, 48, 48, 48, 24],
        sessionDates: [0, 1, 2, 3, 4, 5, 6, 7].map((i) => ymd(i * 7))
      }
    });
    expect(spec?.kind).toBe('trajectory_sessions');
    expect(spec.series.map((s) => s.value)).toEqual([48, 48, 48, 48, 48, 48, 48, 24]);
    expect(spec.meta.atypical).toBe(true);
    expect(spec.series[spec.series.length - 1].highlight).toBe('atypical');
  });
});

describe('Post-P6 restitution — concentration & volume visuals', () => {
  it('concentration relative : deux parts distinctes + spec visuel', () => {
    const reading = composeRelativeConcentrationReading({
      localReps: 124,
      moveShareOfParentWindow: 124 / 372,
      globalShareOfParentWindow: 347 / 5730,
      moveNames: ['A', 'B', 'C'],
      periodLabel: 'ces 7 jours',
      parentPeriodLabel: '30 jours',
      localRepsInParent: 372,
      globalRepsShort: 347,
      globalRepsParent: 5730
    });
    expect(reading.coverage).toBe('concluded');
    expect(reading.conclusion).toMatch(/dénominateur/i);
    expect(reading.conclusion).not.toMatch(/A, B, C.*A, B, C.*A, B, C/);
    const spec = buildVisualInsightSpec({
      kind: reading.kind,
      metrics: reading.metrics
    });
    expect(spec?.kind).toBe('relative_concentration');
    expect(spec.series).toHaveLength(2);
    expect(spec.series[0].population).not.toBe(spec.series[1].population);
  });

  it('volume fréquence/contenu : contributions signées', () => {
    const spec = buildVisualInsightSpec({
      kind: 'span_volume_vs_frequency',
      metrics: {
        finding: 'volume_change:from_frequency',
        prevReps: 4891,
        curReps: 5730,
        freqEffect: 1427,
        contentEffect: -588,
        netDelta: 839
      }
    });
    expect(spec?.kind).toBe('volume_freq_content');
    expect(spec.series.find((s) => s.id === 'freq').value).toBe(1427);
    expect(spec.series.find((s) => s.id === 'content').value).toBe(-588);
  });
});

describe('Post-P6 restitution — calendrier 7j', () => {
  it('explique les journées clôturées vs fenêtre de 7 jours', () => {
    const repsByDate = {
      '2026-11-21': 0,
      '2026-11-22': 0,
      '2026-11-23': 0,
      '2026-11-24': 296,
      '2026-11-25': 0,
      '2026-11-26': 51,
      '2026-11-27': 0
    };
    const shape = describeCalendarShape({
      repsByDate,
      start: '2026-11-21',
      end: '2026-11-27',
      thisPeriod: 'ces 7 jours',
      openEnd: true
    });
    expect(shape).toBeTruthy();
    expect(shape.body).toMatch(/clôturées|enregistrée/i);
    expect(shape.body).not.toMatch(/tu ne t'es pas entraîné/i);
    expect(shape.evidence).toMatch(/sans séance enregistrée/i);
  });
});
