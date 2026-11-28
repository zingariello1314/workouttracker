/**
 * Correctif post-clôture P6 — ne pas confondre baisse ponctuelle et recul confirmé.
 */
import { describe, expect, it } from 'vitest';
import { ANALYSIS_EDITION_PARTS } from '../analysisEdition';
import { buildExerciseTrajectory, renderExerciseTrajectoryCopy } from '../exerciseTrajectoryAnalysis';
import {
  buildComposedEvidenceFromTrajectory,
  classifyContinuity
} from '../recapComposedEvidence';
import { titleFromComposedEvidence } from '../recapComposedNarration';

function ymd(offsetFromBase, base = '2026-09-28') {
  const d = new Date(`${base}T12:00:00`);
  d.setDate(d.getDate() + offsetFromBase);
  return d.toISOString().slice(0, 10);
}

function snapFromTotals(exerciseId, totals, gapDays = 7) {
  const checkedExercises = {};
  const reps = {};
  totals.forEach((total, i) => {
    const date = ymd(i * gapDays);
    const key = `${date}_${exerciseId}`;
    checkedExercises[key] = true;
    reps[key] = String(total);
  });
  return { checkedExercises, reps };
}

function trajFrom(totals, exerciseId = 703294235) {
  const sessions = totals.map((total, i) => ({ date: ymd(i * 7), total }));
  const end = sessions[sessions.length - 1].date;
  const start = sessions[0].date;
  return buildExerciseTrajectory({
    snapshot: snapFromTotals(exerciseId, totals),
    exerciseId,
    exerciseName: 'Hyperextension',
    window: { start, end },
    mode: 'progress'
  });
}

describe('Post-P6 — édition', () => {
  it('bumpe editorial v38b (ajustement restitution)', () => {
    expect(ANALYSIS_EDITION_PARTS.editorial).toBe('p6-sovereign-v38b');
  });
});

describe('Post-P6 — sémantique de recul (cas V36-008/036)', () => {
  it('7×48 puis 24 : baisse ponctuelle, pas recul confirmé', () => {
    const traj = trajFrom([48, 48, 48, 48, 48, 48, 48, 24]);
    expect(traj.ok).toBe(true);
    expect(traj.shape.primaryStory).toBe('outlier_driven');
    expect(traj.shape.terminalPunctualDrop).toBe(true);
    expect(traj.shape.declineSessionCount).toBe(1);
    const continuity = classifyContinuity(traj);
    expect(continuity.kind).toBe('isolated_outlier');
    expect(continuity.kind).not.toBe('confirmed_decline');
    const composed = traj.composedEvidence || buildComposedEvidenceFromTrajectory(traj);
    const title = titleFromComposedEvidence(composed, { name: 'Hyperextension' });
    expect(title).toMatch(/séance atypique|pas encore une tendance/i);
    expect(title).not.toMatch(/recul confirmé/i);
    const body = renderExerciseTrajectoryCopy(traj).body || '';
    expect(body).toMatch(/ponctuelle|atypique|sans permettre de conclure à un recul/i);
    expect(body).not.toMatch(/recul se confirme sur plusieurs séances/i);
  });

  it('plusieurs baisses répétées : recul confirmé possible', () => {
    const traj = trajFrom([48, 48, 48, 40, 36, 32]);
    expect(traj.ok).toBe(true);
    expect(traj.shape.primaryStory).toBe('net_decline');
    expect(traj.shape.declineSessionCount).toBeGreaterThanOrEqual(2);
    const continuity = classifyContinuity(traj);
    expect(continuity.kind).toBe('confirmed_decline');
    const composed = traj.composedEvidence || buildComposedEvidenceFromTrajectory(traj);
    const title = titleFromComposedEvidence(composed, { name: 'Hyperextension' });
    expect(title).toMatch(/recul confirmé sur plusieurs séances/i);
  });

  it('fluctuations sans tendance durable', () => {
    const traj = trajFrom([48, 36, 48, 40, 48, 44]);
    expect(traj.ok).toBe(true);
    const continuity = classifyContinuity(traj);
    expect(continuity.kind).not.toBe('confirmed_decline');
    const composed = traj.composedEvidence || buildComposedEvidenceFromTrajectory(traj);
    const title = titleFromComposedEvidence(composed, { name: 'Hyperextension' });
    expect(title || '').not.toMatch(/recul confirmé/i);
  });

  it('plateau stable', () => {
    const traj = trajFrom([48, 48, 48, 48, 48, 48]);
    expect(traj.ok).toBe(true);
    expect(['plateau', 'unclear']).toContain(traj.shape.primaryStory);
    const continuity = classifyContinuity(traj);
    expect(continuity.kind).not.toBe('confirmed_decline');
    expect(continuity.kind).not.toBe('isolated_outlier');
  });

  it('baisse puis retour : pas un recul confirmé installé', () => {
    const traj = trajFrom([48, 48, 24, 48, 48]);
    expect(traj.ok).toBe(true);
    const continuity = classifyContinuity(traj);
    expect(continuity.kind).not.toBe('confirmed_decline');
    // rebound / outlier / recovered selon le chemin
    expect(['isolated_outlier', 'decline_then_recovery', 'stable_plateau', 'directional_change', 'unclear']).toContain(
      continuity.kind
    );
  });

  it('homonymes : deux ex: distincts ne fusionnent pas leurs arcs', () => {
    const a = trajFrom([48, 48, 48, 24], '703294235');
    const b = trajFrom([48, 48, 48, 48], '1979012181');
    expect(a.identity?.id || a.exerciseId || '703294235').not.toEqual(
      b.identity?.id || b.exerciseId || '1979012181'
    );
    expect(classifyContinuity(a).kind).toBe('isolated_outlier');
    expect(classifyContinuity(b).kind).not.toBe('isolated_outlier');
  });

  it('même volume de reps : pas de recul inventé (charge = autre dimension)', () => {
    // La trajectoire volume ne doit pas qualifier un « recul confirmé » sur un plateau de reps.
    // Une hausse de résistance à reps constantes relève d’une lecture multidimensionnelle séparée.
    const traj = trajFrom([48, 48, 48, 48, 48, 48]);
    expect(classifyContinuity(traj).kind).not.toBe('confirmed_decline');
    expect(traj.shape.primaryStory).not.toBe('net_decline');
    const body = renderExerciseTrajectoryCopy(traj).body || '';
    expect(body).not.toMatch(/recul confirmé|capacité.*diminu/i);
  });

  it('sans séries fiables : pas de tendance structurelle fabriquée', () => {
    const traj = trajFrom([48, 48, 48, 40, 36, 32]);
    const body = renderExerciseTrajectoryCopy(traj).body || '';
    // Volume/séance lisible ; structure interne non inventée.
    expect(body).toMatch(/Sans détail de séries|volume par séance/i);
    expect(body).not.toMatch(/structure de séries a changé|format prouvé/i);
  });
});
