import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { selectCollectively } from '../collectiveSelection';
import { justifyParentChildLink } from '../hierarchyLink';
import { insightsFromP6 } from '../p6Publication';
import { applyP6 } from '../p6Pipeline';
import { snapshotFingerprint } from '../analysisEnvironmentDossier';
import {
  decideInformativePriority,
  evolveCollectivePhenomenonMemory,
  emptyAnalyticalMemory,
  saveAnalyticalMemory,
  loadAnalyticalMemory
} from '../analyticalMemory';
import { buildModuleExecutionMap } from '../evaluation/buildAnalyticalReasoningTrace';
import { ANALYSIS_EDITION_PARTS, analysisEditionKey, analysisMissionLabel } from '../analysisEdition';

describe('Mission 23 — souveraineté mémoire / hiérarchie / fingerprint', () => {
  const PROFILE = 'test-m23-isolated';

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

  it('édition v22 + parties Mission 23', () => {
    expect(ANALYSIS_EDITION_PARTS.editorial).toMatch(/^p6-sovereign-v\d+$/);
    expect(analysisMissionLabel()).toMatch(/^Mission \d+$/);
    expect(ANALYSIS_EDITION_PARTS.memory).toMatch(/^persistent-vertical-v\d+$/);
    expect(ANALYSIS_EDITION_PARTS.hierarchy).toMatch(/^verified-deepening-v\d+$/);
    expect(ANALYSIS_EDITION_PARTS.fingerprint).toBe('multi-source-v5');
    expect(analysisEditionKey()).toMatch(/observability=reasoning-trace-v[23]/);
  });

  it('Porte A — publicationDecision démotive hors priorité sauf force', () => {
    const pub = decideInformativePriority({
      transition: 'unchanged',
      supportCount: 9,
      newFacts: false,
      quietDays: 0,
      horizonDays: 7
    });
    expect(pub.newPriorityCard).toBe(false);

    const row = {
      discovery: {
        kind: 'disc_collective_return',
        title: 'Collectif',
        body: 'Corps',
        informativeValue: 72,
        metrics: {
          memory: { publicationDecision: pub, state: 'confirmed_once', transition: 'unchanged' }
        }
      },
      claim: { id: 'c1' },
      wasPriority: true,
      p6Disposition: 'priority'
    };
    const out = selectCollectively([row], { voiceKey: 'week' });
    expect(out.priority).toHaveLength(0);
    expect(out.reserve[0].p6Disposition).toBe('demoted_memory_familiarity');
    expect(out.reserve[0].discovery.metrics.memory.selectionApplied).toBe('demoted_to_reserve');

    const forced = {
      ...row,
      discovery: {
        ...row.discovery,
        metrics: {
          memory: {
            publicationDecision: { ...pub, forcePriority: true, forceReason: 'still_structurally_central' }
          }
        }
      }
    };
    const out2 = selectCollectively([forced], { voiceKey: 'week' });
    expect(out2.priority).toHaveLength(1);
    expect(out2.priority[0].selectionReason).toMatch(/forced_priority|still_structurally/);
  });

  it('Porte A — persistance profil isolé : previousState après save/load', () => {
    const first = evolveCollectivePhenomenonMemory({
      episodeId: 'ep-m23',
      namedMoves: [{ exerciseId: '10', name: 'Tractions' }],
      returnDates: ['2026-11-11'],
      confirmationDates: [],
      readingMode: 'return',
      knowledgeCutoff: '2026-11-11',
      priorMemory: emptyAnalyticalMemory()
    });
    expect(first.transition).toBe('new');
    const mem = { ...first.memory, profile: PROFILE };
    expect(saveAnalyticalMemory(mem)).toBe(true);
    const loaded = loadAnalyticalMemory(PROFILE);
    expect(Object.keys(loaded.phenomena)).toContain('ep-m23');

    const second = evolveCollectivePhenomenonMemory({
      episodeId: 'ep-m23',
      namedMoves: [
        { exerciseId: '10', name: 'Tractions' },
        { exerciseId: '11', name: 'Dip' }
      ],
      returnDates: ['2026-11-11'],
      confirmationDates: ['2026-11-18'],
      readingMode: 'confirmation',
      knowledgeCutoff: '2026-11-18',
      priorMemory: loaded
    });
    expect(second.previousState).toBe('return_observed');
    expect(second.state).toBe('confirmed_once');
    expect(second.transition).toBe('confirmed');
    const prio = decideInformativePriority({
      transition: second.transition,
      supportCount: 2,
      newFacts: second.newFacts,
      horizonDays: 7
    });
    expect(prio.newPriorityCard).toBe(true);
  });

  it('Porte B — collectif n’absorbe pas un mouvement hors namedMoves', () => {
    const parent = {
      kind: 'disc_collective_return',
      metrics: {
        namedMoves: [
          { exerciseId: '1', name: 'Tractions', date: '2026-11-11' },
          { exerciseId: '2', name: 'Face pull', date: '2026-11-11' }
        ],
        events: [
          { exerciseId: '1', name: 'Tractions', date: '2026-11-11' },
          { exerciseId: '99', name: 'Dips', date: '2026-11-11' }
        ],
        dates: ['2026-11-11']
      }
    };
    const childOk = {
      kind: 'disc_ms_return',
      metrics: { exerciseId: '2', name: 'Face pull', date: '2026-11-12', events: [] }
    };
    const childBad = {
      kind: 'disc_ms_return',
      metrics: { exerciseId: '99', name: 'Dips', date: '2026-11-12', events: [] }
    };
    expect(justifyParentChildLink(parent, childOk).ok).toBe(true);
    expect(justifyParentChildLink(parent, childBad).ok).toBe(false);
    expect(justifyParentChildLink(parent, childBad).reason).toBe('no_shared_subject');
  });

  it('Porte B — deepening sans hierarchyLink.ok n’est pas verified', () => {
    const p6 = {
      counters: { reconciled: true },
      priority: [],
      reserve: [
        {
          id: 'child-1',
          kind: 'disc_ms_return',
          title: 'Dips',
          body: 'Retour',
          evidence: 'e',
          nature: 'trajectory',
          p6Disposition: 'deepening_of_collective',
          collapsedInto: 'parent-1',
          hierarchyLink: null,
          claim: {
            id: 'claim-1',
            statement: 'Retour dips',
            confidence: 'medium',
            proof: { sourceEvents: [{ id: '2026-11-11' }] }
          }
        }
      ]
    };
    const insights = insightsFromP6(p6, { period: '7d' });
    const card = insights.accessibleReserve[0];
    expect(card.parentId).toBeFalsy();
    expect(card.reason).not.toBe('verified_hierarchy_deepening');
    expect(card.reason).toMatch(/unverified|independent|reserve/i);
  });

  it('Porte C — sans étapes : unknown_not_instrumented ≠ not_called', () => {
    const empty = buildModuleExecutionMap({});
    expect(empty.instrumented).toBe(false);
    expect(empty.summary.unknownNotInstrumented).toBeGreaterThan(0);
    expect(empty.modules.every((m) => m.status !== 'not_called' || empty.instrumented)).toBe(true);
  });

  it('Porte C — applyP6 instrumente les étapes critiques', () => {
    const p6 = applyP6({
      all: [
        {
          kind: 'disc_collective_return',
          title: 'Collectif',
          body: 'Texte long assez pour claim',
          evidence: 'a@2026-11-11',
          nature: 'trajectory',
          informativeValue: 90,
          metrics: {
            namedMoves: [{ exerciseId: '1', name: 'A', date: '2026-11-11' }],
            memory: {
              publicationDecision: { newPriorityCard: true, reason: 'transformation' }
            }
          }
        }
      ],
      selected: [],
      voiceKey: 'week'
    });
    expect(p6.instrumented).toBe(true);
    expect(p6.pipelineSteps?.length).toBeGreaterThan(3);
    expect(p6.pipelineSteps.some((s) => s.id === 'select')).toBe(true);
  });

  it('Porte D — fingerprint v5 inclut programme / garmin / nameMap hors snapshot plat', () => {
    const snap = { reps: { '2026-11-11_10': 12 }, checkedExercises: { '2026-11-11_10': true } };
    const bare = snapshotFingerprint(snap);
    expect(bare.version).toBe(5);
    expect(bare.programId).toBeNull();
    expect(bare.garminSleepDays).toBe(0);

    const rich = snapshotFingerprint(snap, {
      activeProgram: { id: 'prog-1', updatedAt: 't', schedule: { mon: [] } },
      garminData: { sleep: { '2026-11-10': { hours: 7 } } },
      nameMap: { '10': 'Tractions', '11': 'Dips' }
    });
    expect(rich.programId).toBe('prog-1');
    expect(rich.garminSleepDays).toBe(1);
    expect(rich.nameMapSize).toBe(2);
    expect(rich.digest).not.toBe(bare.digest);
  });
});
