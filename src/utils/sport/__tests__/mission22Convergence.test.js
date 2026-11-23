import { describe, expect, it } from 'vitest';
import {
  ANALYSIS_EDITION_PARTS,
  analysisMissionLabel
} from '../analysisEdition';
import { buildAnalyticalAudit } from '../evaluation/buildAnalyticalAudit';
import {
  emptyAnalyticalMemory,
  evolveCollectivePhenomenonMemory,
  noteExposure,
  notePublication,
  decideInformativePriority,
  saveAnalyticalMemory,
  loadAnalyticalMemory
} from '../analyticalMemory';
import {
  resolveContinuousEpisodeId,
  stableReturnEpisodeId
} from '../sessionEpisodeLedger';
import { buildMigratedAnalyticalFacts } from '../analyticalFacts';
import { decomposeMonthlyProgramChange } from '../monthlyProgramComposition';
import { justifyParentChildLink } from '../hierarchyLink';

describe('Mission 22 — édition', () => {
  it('passe en v21 / Mission 22', () => {
    expect(ANALYSIS_EDITION_PARTS.editorial).toMatch(/^p6-sovereign-v2\d+$/);
    expect(analysisMissionLabel()).toMatch(/^Mission 2\d+$/);
    expect(ANALYSIS_EDITION_PARTS.memory).toMatch(/^persistent-vertical-v\d+$/);
    expect(ANALYSIS_EDITION_PARTS.facts).toBe('shared-facts-v2');
  });
});

describe('Mission 22 — export faits + mémoire', () => {
  it('transporte sharedFacts et memory jusqu’au factRegistry', () => {
    const facts = buildMigratedAnalyticalFacts({
      window: { start: '2026-10-23', end: '2026-11-21' },
      classicVolume: 5803,
      previousClassicVolume: 3881,
      previousWindow: { start: '2026-09-23', end: '2026-10-22' },
      collective: {
        episodeId: 'return_episode|2026-11-11|p:abc|n:2',
        dates: ['2026-11-11'],
        confirmationDates: ['2026-11-18'],
        namedMoves: [{ exerciseId: '304', name: 'Élévations', date: '2026-11-11' }]
      }
    });
    const card = {
      id: 'card-collective-1',
      kind: 'disc_collective_return',
      title: 'La reprise collective se confirme',
      body: 'Confirmation le 18 novembre.',
      claim: {
        id: 'claim-1',
        statement: 'reprise',
        proof: { observedValues: facts.facts.slice(0, 3).map((f) => ({ id: f.metric, value: f.value, unit: f.unit })) }
      },
      metrics: {
        windowStart: '2026-11-15',
        windowEnd: '2026-11-21',
        phenomenonId: 'return_episode|2026-11-11|p:abc|n:2',
        sharedFacts: facts.facts.map((f) => f.id),
        factRegistry: facts,
        memory: {
          state: 'confirmed_once',
          previousState: 'return_observed',
          transition: 'confirmed',
          knownAt: '2026-11-18',
          knowledgeCutoff: '2026-11-21',
          publicationDecision: { newPriorityCard: true, reason: 'transformation' },
          exposureCounted: false
        },
        observedValues: [{ id: 'volumeRecent', value: 5803, unit: 'reps' }]
      },
      hierarchyLink: {
        ok: true,
        relation: 'deepening_of',
        reason: 'verified_parent_child',
        proof: { sharedSubjects: ['304'] }
      },
      childIds: ['child-a']
    };
    const doc = buildAnalyticalAudit({
      insights: {
        shortTerm: [card],
        mediumTerm: [],
        longTerm: [],
        accessibleReserve: []
      },
      p6: {
        priority: [card],
        reserve: [],
        counters: { published: 1 }
      },
      currentPeriod: '7d',
      memorySummary: {
        status: 'loaded',
        phenomenonCount: 1,
        phenomenonIds: ['return_episode|2026-11-11|p:abc|n:2']
      }
    });
    const exported = Object.values(doc.cardRegistry || {})[0];
    expect(exported.sharedFacts?.length).toBeGreaterThan(0);
    expect(exported.memory?.state).toBe('confirmed_once');
    expect(exported.hierarchyLink?.ok).toBe(true);
    expect(Object.keys(doc.factRegistry || {}).length).toBeGreaterThan(2);
    expect(doc.memoryEvidence?.status).toBe('loaded');
  });
});

describe('Mission 22 — continuité d’épisode', () => {
  it('conserve l’identité si enrichissement majoritaire des participants', () => {
    const baseEvents = [
      { exerciseId: '304', date: '2026-11-11' },
      { exerciseId: '306', date: '2026-11-11' }
    ];
    const baseId = stableReturnEpisodeId(baseEvents, '2026-11-11');
    const prior = {
      [baseId]: {
        participantIds: ['304', '306'],
        state: 'return_observed'
      }
    };
    const enriched = [
      ...baseEvents,
      { exerciseId: '307', date: '2026-11-11' },
      { exerciseId: '308', date: '2026-11-11' }
    ];
    const cont = resolveContinuousEpisodeId(enriched, '2026-11-11', prior);
    expect(cont.continued).toBe(true);
    expect(cont.episodeId).toBe(baseId);
    expect(cont.aliases.length).toBeGreaterThan(0);
  });

  it('ne fusionne pas deux reprises indépendantes le même jour', () => {
    const a = stableReturnEpisodeId(
      [
        { exerciseId: '304', date: '2026-11-11' },
        { exerciseId: '306', date: '2026-11-11' }
      ],
      '2026-11-11'
    );
    const prior = { [a]: { participantIds: ['304', '306'] } };
    const other = resolveContinuousEpisodeId(
      [
        { exerciseId: '999', date: '2026-11-11' },
        { exerciseId: '888', date: '2026-11-11' }
      ],
      '2026-11-11',
      prior
    );
    expect(other.continued).toBe(false);
    expect(other.episodeId).not.toBe(a);
  });
});

describe('Mission 22 — mémoire scénarios verticaux', () => {
  const episodeId = 'return_episode|2026-11-11|p:test|n:2';
  const moves = [
    {
      exerciseId: '304',
      name: 'A',
      date: '2026-11-11',
      confirmationDates: ['2026-11-18'],
      currentReps: 60,
      prevReps: 60
    },
    {
      exerciseId: '306',
      name: 'B',
      date: '2026-11-11',
      confirmationDates: ['2026-11-18'],
      currentReps: 50,
      prevReps: 50
    }
  ];

  it('S1 première découverte → priorité', () => {
    const e = evolveCollectivePhenomenonMemory({
      episodeId,
      namedMoves: moves,
      returnDates: ['2026-11-11'],
      confirmationDates: [],
      knowledgeCutoff: '2026-11-11'
    });
    const prio = decideInformativePriority({
      transition: e.transition,
      newFacts: e.newFacts,
      supportCount: 2
    });
    expect(e.state).toBe('return_observed');
    expect(prio.newPriorityCard).toBe(true);
  });

  it('S2 recalcul identique → pas de double nouveauté', () => {
    const first = evolveCollectivePhenomenonMemory({
      episodeId,
      namedMoves: moves,
      returnDates: ['2026-11-11'],
      confirmationDates: [],
      knowledgeCutoff: '2026-11-11'
    });
    const second = evolveCollectivePhenomenonMemory({
      episodeId,
      namedMoves: moves,
      returnDates: ['2026-11-11'],
      confirmationDates: [],
      knowledgeCutoff: '2026-11-11',
      priorMemory: first.memory
    });
    expect(second.transition).toBe('unchanged');
    expect(second.newFacts).toBe(false);
    const prio = decideInformativePriority({
      transition: second.transition,
      newFacts: second.newFacts,
      supportCount: 2
    });
    expect(prio.newPriorityCard).toBe(false);
  });

  it('S3 restauration profil (localStorage mock)', () => {
    const store = {};
    globalThis.window = {
      localStorage: {
        getItem: (k) => store[k] ?? null,
        setItem: (k, v) => {
          store[k] = String(v);
        }
      }
    };
    const mem = emptyAnalyticalMemory();
    mem.profile = 'test-m22';
    mem.phenomena[episodeId] = { id: episodeId, state: 'return_observed' };
    expect(saveAnalyticalMemory(mem)).toBe(true);
    const loaded = loadAnalyticalMemory('test-m22');
    expect(loaded.phenomena[episodeId]?.state).toBe('return_observed');
    delete globalThis.window;
  });

  it('S4 publication ≠ exposition', () => {
    const pub = notePublication({ signature: 'sig', ids: ['a'], period: '7d' });
    expect(pub.exposureCounted).toBe(false);
    const mem = emptyAnalyticalMemory();
    const { written, memory } = noteExposure(mem, {
      kind: 'presented',
      period: '7d',
      at: '2026-11-22'
    });
    expect(written).toBe(true);
    expect((memory.exposures || []).length).toBe(1);
  });

  it('S5 confirmation → transition confirmed + priorité', () => {
    const first = evolveCollectivePhenomenonMemory({
      episodeId,
      namedMoves: moves,
      returnDates: ['2026-11-11'],
      confirmationDates: [],
      knowledgeCutoff: '2026-11-11'
    });
    const conf = evolveCollectivePhenomenonMemory({
      episodeId,
      namedMoves: moves,
      returnDates: ['2026-11-11'],
      confirmationDates: ['2026-11-18'],
      readingMode: 'confirmation',
      knowledgeCutoff: '2026-11-18',
      priorMemory: first.memory
    });
    expect(conf.state).toBe('confirmed_once');
    expect(conf.transition).toBe('confirmed');
    expect(conf.newFacts).toBe(true);
  });

  it('S6 révision historique via knowledgeCutoff', () => {
    const e = evolveCollectivePhenomenonMemory({
      episodeId,
      namedMoves: moves,
      returnDates: ['2026-11-11'],
      confirmationDates: ['2026-11-18'],
      knowledgeCutoff: '2026-11-17'
    });
    expect(e.state).toBe('return_observed');
    expect(e.visibleConfirmations).toEqual([]);
  });
});

describe('Mission 22 — généralisation hors collectif nov.', () => {
  it('S8 famille de séances : contributions réconciliées sur pack synthétique', () => {
    const catalog = [
      {
        date: '2026-11-10',
        totalReps: 200,
        exercises: [
          { id: '1', name: 'Développé couché', reps: 100 },
          { id: '2', name: 'Écarté', reps: 100 }
        ]
      },
      {
        date: '2026-11-12',
        totalReps: 180,
        exercises: [
          { id: '3', name: 'Tractions', reps: 90 },
          { id: '4', name: 'Rowing', reps: 90 }
        ]
      },
      {
        date: '2026-10-10',
        totalReps: 100,
        exercises: [{ id: '1', name: 'Développé couché', reps: 100 }]
      }
    ];
    const program = {
      schedule: {
        monday: {
          active: true,
          name: 'Push',
          exercises: [
            { name: 'Développé couché', sets: 4, reps: 10 },
            { name: 'Écarté', sets: 3, reps: 12 }
          ]
        },
        wednesday: {
          active: true,
          name: 'Pull',
          exercises: [
            { name: 'Tractions', sets: 4, reps: 8 },
            { name: 'Rowing', sets: 3, reps: 10 }
          ]
        }
      }
    };
    const decomp = decomposeMonthlyProgramChange({
      catalog,
      window: { start: '2026-11-01', end: '2026-11-30' },
      previousWindow: { start: '2026-10-01', end: '2026-10-31' },
      activeProgram: program
    });
    expect(decomp.ok).toBe(true);
    expect(decomp.reconciliationGap).toBe(0);
    expect(decomp.attribution.partitionCoverageShareRecent).toBe(1);
    expect(decomp.attribution.recognizedVolumeShareRecent).toBeGreaterThan(0);
  });

  it('hiérarchie : lien parent collectif / enfant retour justifié', () => {
    const parent = {
      discovery: {
        kind: 'disc_collective_return',
        metrics: {
          namedMoves: [
            { exerciseId: '304', name: 'Élévations', date: '2026-11-11' },
            { exerciseId: '306', name: 'Face pull', date: '2026-11-11' }
          ],
          dates: ['2026-11-11']
        }
      }
    };
    const child = {
      discovery: {
        kind: 'disc_ms_return',
        metrics: {
          exerciseId: '304',
          name: 'Élévations',
          returnDate: '2026-11-11',
          date: '2026-11-11'
        }
      }
    };
    const link = justifyParentChildLink(parent, child);
    expect(link.ok).toBe(true);
    expect(link.reason).toMatch(/verified|shared|compatible|parent/i);
  });
});
