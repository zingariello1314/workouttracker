import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { serializeConclusion } from '../analysisPeriodExport';
import { applyP6 } from '../p6Pipeline';
import {
  applyParallelTrajectoryComposition,
  findParallelTrajectoryClusters
} from '../parallelTrajectoryComposition';
import { buildAnalysisRunEnvelope } from '../analysisRunEnvelope';
import {
  saveAnalyticalMemory,
  loadAnalyticalMemory,
  freezeAnalyticalMemorySnapshot,
  emptyAnalyticalMemory,
  noteExposure
} from '../analyticalMemory';
import { ANALYSIS_EDITION_PARTS, analysisEditionKey, analysisMissionLabel } from '../analysisEdition';
import { buildModuleExecutionMap } from '../evaluation/buildAnalyticalReasoningTrace';

describe('Mission 24 — contrats + généralisation ciblée', () => {
  const PROFILE = 'test-m24-isolated';

  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(`momentum.analyticalMemory.v1:${PROFILE}`);
    }
  });
  afterEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(`momentum.analyticalMemory.v1:${PROFILE}`);
    }
  });

  it('édition v23', () => {
    expect(ANALYSIS_EDITION_PARTS.editorial).toMatch(/^p6-sovereign-v\d+$/);
    expect(analysisMissionLabel()).toMatch(/^Mission \d+$/);
    expect(analysisEditionKey()).toMatch(/selection=parallel-trajectories-v\d+/);
    expect(ANALYSIS_EDITION_PARTS.hierarchy).toMatch(/^verified-deepening-v\d+$/);
    expect(ANALYSIS_EDITION_PARTS.memory).toMatch(/^persistent-vertical-v\d+$/);
  });

  it('L1 — serializeConclusion conserve hierarchyLink / parentId / childIds', () => {
    const link = {
      ok: true,
      relation: 'deepening',
      reason: 'verified_parent_child',
      proof: { sharedSubjects: ['10'] }
    };
    const card = {
      id: 'child-1',
      title: 'Face pull',
      body: 'Approfondissement',
      collapsedInto: 'parent-1',
      parentId: 'parent-1',
      hierarchyLink: link,
      childIds: null,
      p6Disposition: 'deepening_of_collective'
    };
    const ser = serializeConclusion(card, 'reserve');
    expect(ser.hierarchyLink?.ok).toBe(true);
    expect(ser.parentId).toBe('parent-1');
  });

  it('L1 — noteExposure ne détruit pas les phénomènes persistés', () => {
    const mem = {
      ...emptyAnalyticalMemory(),
      profile: PROFILE,
      phenomena: { 'ep-1': { id: 'ep-1', state: 'confirmed_once' } }
    };
    expect(saveAnalyticalMemory(mem)).toBe(true);
    const loaded = loadAnalyticalMemory(PROFILE);
    const noted = noteExposure(loaded, {
      kind: 'presented',
      period: '7d',
      editionKey: 'x',
      at: new Date().toISOString()
    });
    saveAnalyticalMemory({ ...noted.memory, profile: PROFILE, phenomena: {} });
    const again = loadAnalyticalMemory(PROFILE);
    expect(again.phenomena['ep-1']?.state).toBe('confirmed_once');
    expect(again.exposures.length).toBeGreaterThan(0);
  });

  it('L1 — freeze snapshot pour campagne multi-horizons', () => {
    const frozen = freezeAnalyticalMemorySnapshot({
      profile: PROFILE,
      phenomena: { a: { id: 'a', state: 'new' } }
    });
    frozen.phenomena.a.state = 'mutated';
    const again = freezeAnalyticalMemorySnapshot({
      profile: PROFILE,
      phenomena: { a: { id: 'a', state: 'new' } }
    });
    expect(again.phenomena.a.state).toBe('new');
  });

  it('L2 — hyperextension parallèle : une lecture structurelle, preuves en deepening', () => {
    const mk = (id, dates) => ({
      discovery: {
        id: `traj-${id}`,
        kind: 'disc_exercise_trajectory',
        title: 'Hyperextension: 4 séances sur ces 30 jours',
        body: 'Environ 48 répétitions par créneau sur la fenêtre.',
        nature: 'trajectory',
        informativeValue: 70,
        metrics: {
          exerciseId: id,
          name: 'Hyperextension',
          dates,
          sessionCount: dates.length,
          totalReps: 48,
          meanReps: 48
        }
      },
      claim: { id: `c-${id}` },
      wasPriority: true
    });
    const rows = [
      mk('1979012181', ['2026-10-30', '2026-11-06', '2026-11-13', '2026-11-20']),
      mk('703294235', ['2026-10-26', '2026-11-02', '2026-11-09', '2026-11-16'])
    ];
    expect(findParallelTrajectoryClusters(rows).length).toBe(1);
    const out = applyParallelTrajectoryComposition(rows);
    expect(out.composedCount).toBe(1);
    const composed = out.rows.find((r) => r.discovery?.kind === 'disc_composed_parallel_trajectories');
    expect(composed).toBeTruthy();
    expect(composed.discovery.childIds.length).toBe(2);
    const deepenings = out.rows.filter((r) => r.p6Disposition === 'deepening_of_collective');
    expect(deepenings).toHaveLength(2);
    expect(deepenings.every((r) => r.hierarchyLink?.ok === true)).toBe(true);

    const p6 = applyP6({
      all: rows.map((r) => r.discovery),
      selected: rows.map((r) => r.discovery),
      voiceKey: 'month'
    });
    const prioTitles = (p6.priority || []).map((c) => c.title);
    const hyperextPrio = prioTitles.filter((t) => /Hyperextension/i.test(t || ''));
    // Au plus une priorité structurelle Hyperextension (pas deux clones)
    expect(hyperextPrio.length).toBeLessThanOrEqual(1);
  });

  it('L4 — enveloppe de run alimente fingerprint (programme, nameMap)', () => {
    const env = buildAnalysisRunEnvelope({
      snapshot: {
        reps: { '2026-11-11_10': 12 },
        checkedExercises: { '2026-11-11_10': true }
      },
      activeProgram: { id: 'default-program', schedule: {} },
      garminData: { sleep: { '2026-11-10': { hours: 7.2 } } },
      nameMap: { '10': 'Tractions', '11': 'Dips' },
      analyticalMemory: { profile: 'local', phenomena: { x: { id: 'x' } } },
      executionMode: 'export'
    });
    expect(env.fingerprint.programId).toBe('default-program');
    expect(env.fingerprint.garminSleepDays).toBe(1);
    expect(env.nameMapSize).toBe(2);
    expect(env.fingerprint.nameMapDigest).toBeTruthy();
    expect(env.memoryPhenomenonCount).toBe(1);
  });

  it('observabilité — modules absents sans instrumentation = unknown', () => {
    const map = buildModuleExecutionMap({});
    expect(map.instrumented).toBe(false);
    expect(map.summary.unknownNotInstrumented).toBeGreaterThan(0);
  });
});
