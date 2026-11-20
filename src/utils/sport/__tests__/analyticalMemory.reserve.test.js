import { describe, expect, it } from 'vitest';
import {
  accessibleConclusions,
  buildAccessibleReserve,
  compareConclusionTitles,
  decideInformativePriority,
  emptyAnalyticalMemory,
  noteExposure,
  noteFeedback,
  notePublication,
  relateConclusions,
  RESERVE_DISPOSITION
} from '../analyticalMemory';
import { buildAdaptiveRecapInsights } from '../recapAdaptiveInsights';

describe('mémoire analytique et réserve', () => {
  it('une publication n’incrémente pas une exposition', () => {
    const publication = notePublication({
      signature: '7d|same',
      ids: ['card-a'],
      period: '7d',
      window: { start: '2026-11-13', end: '2026-11-19' }
    });
    expect(publication.exposureCounted).toBe(false);
    expect(publication.publishedIds).toEqual(['card-a']);
  });

  it('une seconde présentation de la même édition n’écrit pas un nouvel événement', () => {
    const memory = emptyAnalyticalMemory();
    const first = noteExposure(memory, {
      kind: 'presented',
      editionKey: 'edition-1',
      period: '7d',
      windowStart: '2026-11-13',
      windowEnd: '2026-11-19'
    });
    const second = noteExposure(first.memory, {
      kind: 'presented',
      editionKey: 'edition-1',
      period: '7d',
      windowStart: '2026-11-13',
      windowEnd: '2026-11-19'
    });
    expect(first.written).toBe(true);
    expect(second.written).toBe(false);
    expect(second.memory.exposures).toHaveLength(1);
  });

  it('le retour utilisateur ne modifie aucun fait sportif', () => {
    const memory = noteFeedback(emptyAnalyticalMemory(), {
      conclusionId: 'c1',
      kind: 'repetition',
      note: 'déjà vu'
    });
    expect(memory.feedback[0].changesSportFacts).toBe(false);
    expect(memory.phenomena).toEqual({});
  });

  it('une séance ponctuelle de 112 répétitions ne reste pas prioritaire après six jours sans apport', () => {
    const decision = decideInformativePriority({
      transition: 'new',
      supportCount: 1,
      newFacts: false,
      quietDays: 6,
      horizonDays: 7,
      reps: 112
    });
    expect(decision.transition).toBe('unchanged');
    expect(decision.newPriorityCard).toBe(false);
    expect(decision.reason).toBe('fait_ponctuel_sans_nouvel_apport');
  });

  it('une septième séance identique confirme sans nouvelle carte prioritaire', () => {
    const decision = decideInformativePriority({
      transition: 'confirmed',
      supportCount: 7,
      newFacts: false,
      quietDays: 1,
      horizonDays: 30
    });
    expect(decision.newPriorityCard).toBe(false);
    expect(decision.transition).toBe('confirmed');
  });

  it('une transformation significative peut renouveler la priorité', () => {
    const decision = decideInformativePriority({
      transition: 'revised',
      supportCount: 7,
      newFacts: true,
      quietDays: 0,
      horizonDays: 30
    });
    expect(decision.newPriorityCard).toBe(true);
  });

  it('deux phénomènes distincts sur le même exercice restent liés, pas fusionnés', () => {
    const link = relateConclusions(
      { id: 'format', exerciseId: '501', phenomenon: 'format_consolidation' },
      { id: 'load', exerciseId: '501', phenomenon: 'load_progression' }
    );
    expect(link.rel).toBe('related_to');
  });

  it('deux conclusions du même phénomène se remplacent', () => {
    const link = relateConclusions(
      { id: 'next', exerciseId: '501', phenomenon: 'format_consolidation' },
      { id: 'prev', exerciseId: '501', phenomenon: 'format_consolidation' }
    );
    expect(link.rel).toBe('supersedes');
    expect(link.target).toBe('prev');
  });

  it('une conclusion vraie déclassée reste accessible', () => {
    const reserve = buildAccessibleReserve({
      valid: [
        {
          id: 'kept',
          title: 'Format consolidé',
          selectionTrace: { reason: 'below_min_column_weight' },
          metrics: { editorialPriority: false }
        },
        {
          id: 'bad',
          title: 'Fait rejeté',
          admission: { admissible: false },
          selectionTrace: { reason: 'score_fell_below_min_or_stopped' }
        }
      ],
      shownIds: [],
      merged: [{ id: 'dup', title: 'Doublon', kinshipDrop: { reason: 'same_body' } }]
    });
    expect(reserve.find((item) => item.id === 'kept').disposition).toBe(
      RESERVE_DISPOSITION.DEMOTED_PRIORITY
    );
    expect(reserve.find((item) => item.id === 'bad').disposition).toBe(
      RESERVE_DISPOSITION.REJECTED_FACTUAL
    );
    expect(reserve.find((item) => item.id === 'dup').disposition).toBe(RESERVE_DISPOSITION.MERGED);
    expect(accessibleConclusions(reserve).map((item) => item.id)).toEqual(['kept']);
  });

  it('ne classe pas un titre non transporté comme un rejet factuel', () => {
    const reserve = buildAccessibleReserve({
      valid: [
        {
          id: 'relation.reading.short.span_volume_vs_frequency',
          title: 'relation.reading.short.span_volume_vs_frequency',
          text: 'Le volume bouge surtout parce que le nombre de séances bouge.\n\n1845 répétitions deviennent 1334.',
          context: { kind: 'span_volume_vs_frequency' }
        }
      ]
    });
    const item = reserve[0];
    expect(item.disposition).not.toBe(RESERVE_DISPOSITION.REJECTED_FACTUAL);
    expect(item.title).toMatch(/volume bouge/);
    expect(accessibleConclusions(reserve).map((row) => row.id)).toEqual([
      'relation.reading.short.span_volume_vs_frequency'
    ]);
  });

  it('compare un pack publié et un diagnostic sans les confondre', () => {
    const diff = compareConclusionTitles(
      ['Carte A', 'Carte B'],
      ['Carte A', 'Carte C']
    );
    expect(diff.common).toEqual(['Carte A']);
    expect(diff.publishedOnly).toEqual(['Carte B']);
    expect(diff.diagnosticOnly).toEqual(['Carte C']);
  });

  it('le calcul adaptatif n’écrit plus l’historique d’exposition', () => {
    const result = buildAdaptiveRecapInsights({
      snapshot: { reps: {}, checkedExercises: {}, exerciseSetLogs: {} },
      window: { start: '2026-11-13', end: '2026-11-19' },
      period: '7d',
      collectDiagnostic: false,
      persistHistory: false,
      insightHistory: { version: 1, entries: [] },
      lastInsightSignature: 'previous-signature'
    });
    expect(result.historyUpdate == null || result.historyUpdate.exposureCounted === false).toBe(true);
    if (result.historyUpdate) expect(result.historyUpdate.nextHistory).toBeUndefined();
    expect(Array.isArray(result.insights.accessibleReserve)).toBe(true);
  });
});
