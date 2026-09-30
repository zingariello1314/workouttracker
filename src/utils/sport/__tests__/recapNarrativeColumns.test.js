import { describe, expect, it } from 'vitest';
import { applyNoveltyWeights } from '../insightNoveltyEngine';
import { emptyInsightHistory, recordShownInsights } from '../insightNoveltyStore';
import { selectBalancedCandidates, selectNarrativeColumns } from '../recapAdaptiveInsights';

const LONG =
  'Lecture assez longue pour compter comme une analyse de colonne, avec une comparaison et un sens, pas un chiffre isolé.';

function card({ kind, horizon, weight, metrics = {}, id, text }) {
  return {
    id: id || `relation.reading.${horizon}.${kind}`,
    horizon,
    pillar: 'interpretation',
    weight,
    text: text || `${LONG} (${kind})`,
    interpretation: { type: 'coach_reading', context: { kind }, metrics }
  };
}

const CAPS = { short: 5, medium: 5, long: 5 };
const NOW = Date.parse('2026-06-15T12:00:00');

describe('registre commun aux trois colonnes', () => {
  it('ne garde qu’une carte quand deux kinds racontent la poussée', () => {
    const discovery = card({
      kind: 'disc_push_pull',
      horizon: 'medium',
      weight: 90,
      metrics: { ofMonth: 40 }
    });
    const relation = card({
      id: 'relation.push_pull_stimulus',
      kind: 'push_pull_stimulus',
      horizon: 'medium',
      weight: 80,
      metrics: { ofMonth: 42 }
    });
    const picked = selectNarrativeColumns([discovery, relation], CAPS, 'sig', NOW);
    const mediumIds = picked.medium.map((c) => c.id);
    expect(mediumIds).toContain(discovery.id);
    expect(mediumIds).not.toContain(relation.id);
  });

  it('laisse coexister le fait, la relation et la transformation du dos', () => {
    const fact = card({
      kind: 'disc_muscle_now',
      horizon: 'short',
      weight: 88,
      metrics: { group: 'back', sharePct: 45 }
    });
    const relation = card({
      kind: 'disc_muscle_reorient',
      horizon: 'medium',
      weight: 86,
      metrics: { leadGroup: 'back', ofMonthPct: 70 }
    });
    const transformation = card({
      kind: 'disc_anchor',
      horizon: 'long',
      weight: 84,
      metrics: { family: 'dos', thenShare: 12, nowShare: 40 }
    });
    const picked = selectNarrativeColumns([fact, relation, transformation], CAPS, 'sig', NOW);
    expect(picked.short.map((c) => c.id)).toContain(fact.id);
    expect(picked.medium.map((c) => c.id)).toContain(relation.id);
    expect(picked.long.map((c) => c.id)).toContain(transformation.id);
  });

  it('écarte le synonyme même s’il est dans une autre colonne', () => {
    const fact = card({
      kind: 'disc_volume_shape',
      horizon: 'short',
      weight: 90,
      metrics: { volPct: 4 }
    });
    const echo = card({
      kind: 'disc_density',
      horizon: 'medium',
      weight: 70,
      metrics: { volPct: 5 }
    });
    const picked = selectNarrativeColumns([fact, echo], CAPS, 'sig', NOW);
    const shown = [...picked.short, ...picked.medium, ...picked.long];
    expect(shown).toHaveLength(1);
    expect(shown[0].id).toBe(fact.id);
  });

  it('laisse la colonne vide sous le plancher de poids', () => {
    const weak = card({ kind: 'disc_peak_day', horizon: 'short', weight: 5 });
    const picked = selectNarrativeColumns([weak], CAPS, 'sig', NOW);
    expect(picked.short).toEqual([]);
    expect(picked.medium).toEqual([]);
    expect(picked.long).toEqual([]);
  });

  it('garde la découverte quand une relation répète le même sens', () => {
    const discovery = card({
      kind: 'volume_traj',
      horizon: 'medium',
      weight: 85,
      metrics: { volPct: -20 }
    });
    const relation = card({
      id: 'relation.exposure_vs_capacity',
      kind: 'exposure_vs_capacity',
      horizon: 'medium',
      weight: 70,
      metrics: { volPct: -18 }
    });
    const picked = selectNarrativeColumns([relation, discovery], CAPS, 'sig', NOW);
    expect(picked.medium.map((c) => c.id)).toEqual([discovery.id]);
  });

  it('garde la relation si le fait occupe déjà un autre sens', () => {
    const fact = card({
      kind: 'disc_volume_shape',
      horizon: 'short',
      weight: 90,
      metrics: { volPct: -4 }
    });
    const relation = card({
      kind: 'volume_traj',
      horizon: 'medium',
      weight: 80,
      metrics: { volPct: -20 }
    });
    const picked = selectNarrativeColumns([fact, relation], CAPS, 'sig', NOW);
    expect(picked.short).toHaveLength(1);
    expect(picked.medium).toHaveLength(1);
  });
});

describe('mémoire topic + sense + stateKey', () => {
  it('fait perdre le dos à 43 % après un 42 % déjà montré', () => {
    const yesterday = NOW - 26 * 60 * 60 * 1000;
    const history = recordShownInsights(
      emptyInsightHistory(),
      [
        {
          id: 'relation.reading.short.disc_muscle_now',
          theme: 'short.disc_muscle_now',
          claim: { topic: 'mix.dos', sense: 'fact', stateKey: 'part-40' }
        }
      ],
      yesterday
    );
    const repeat = card({
      kind: 'disc_muscle_now',
      horizon: 'short',
      weight: 90,
      metrics: { group: 'back', sharePct: 43 }
    });
    const other = card({
      kind: 'disc_peak_day',
      horizon: 'short',
      weight: 70,
      metrics: { sharePct: 30 }
    });
    const weighted = applyNoveltyWeights([repeat, other], history, NOW);
    const repeatW = weighted.find((c) => c.id === repeat.id).weight;
    const otherW = weighted.find((c) => c.id === other.id).weight;
    expect(repeatW).toBeLessThan(otherW);
  });

  it('laisse passer une transformation après un fait déjà montré', () => {
    const yesterday = NOW - 26 * 60 * 60 * 1000;
    const history = recordShownInsights(
      emptyInsightHistory(),
      [
        {
          id: 'old-fact',
          theme: 'short.disc_muscle_now',
          claim: { topic: 'mix.dos', sense: 'fact', stateKey: 'part-40' }
        }
      ],
      yesterday
    );
    const transformation = card({
      kind: 'disc_anchor',
      horizon: 'long',
      weight: 88,
      metrics: { family: 'dos', thenShare: 10, nowShare: 46 }
    });
    const [weighted] = applyNoveltyWeights([transformation], history, NOW);
    expect(weighted.weight).toBe(88);
  });

  it('laisse passer un vrai changement de part, 42 % puis 58 %', () => {
    const yesterday = NOW - 26 * 60 * 60 * 1000;
    const history = recordShownInsights(
      emptyInsightHistory(),
      [
        {
          id: 'old-share',
          theme: 'short.other',
          claim: { topic: 'mix.dos', sense: 'fact', stateKey: 'part-40' }
        }
      ],
      yesterday
    );
    const shifted = card({
      kind: 'disc_muscle_now',
      horizon: 'short',
      weight: 90,
      metrics: { group: 'back', sharePct: 58 }
    });
    const [weighted] = applyNoveltyWeights([shifted], history, NOW);
    expect(weighted.weight).toBe(90);
  });

  it('ne pénalise pas la même idée revue le jour même', () => {
    const history = recordShownInsights(
      emptyInsightHistory(),
      [
        {
          id: 'relation.reading.short.disc_muscle_now',
          theme: 'short.disc_muscle_now',
          claim: { topic: 'mix.dos', sense: 'fact', stateKey: 'part-40' }
        }
      ],
      NOW - 1000
    );
    const repeat = card({
      kind: 'disc_muscle_now',
      horizon: 'short',
      weight: 90,
      metrics: { group: 'back', sharePct: 43 }
    });
    const [weighted] = applyNoveltyWeights([repeat], history, NOW);
    expect(weighted.weight).toBe(90);
  });
});

describe('rotation en départage', () => {
  it('ne laisse pas le jour changer le gagnant quand l’écart dépasse 3 points', () => {
    const heavy = card({ kind: 'disc_muscle_now', horizon: 'short', weight: 90, metrics: { group: 'back', sharePct: 45 } });
    const light = card({ kind: 'disc_peak_day', horizon: 'short', weight: 70, metrics: { sharePct: 30 } });
    const winners = [0, 1, 2, 5, 9].map((d) => {
      const picked = selectBalancedCandidates([light, heavy], 'short', 1, 'sig', NOW + d * 86400000);
      return picked[0].id;
    });
    expect(new Set(winners)).toEqual(new Set([heavy.id]));
  });

  it('reste stable dans la même journée pour deux cartes à égalité', () => {
    const a = card({ kind: 'disc_muscle_now', horizon: 'short', weight: 80, metrics: { group: 'back', sharePct: 45 } });
    const b = card({ kind: 'disc_peak_day', horizon: 'short', weight: 80, metrics: { sharePct: 30 } });
    const first = selectBalancedCandidates([a, b], 'short', 1, 'sig', NOW)[0].id;
    const second = selectBalancedCandidates([b, a], 'short', 1, 'sig', NOW)[0].id;
    expect(second).toBe(first);
    expect([a.id, b.id]).toContain(first);
  });
});

describe('scénarios de narration', () => {
  it('ne produit aucune carte sans candidat', () => {
    const picked = selectNarrativeColumns([], CAPS, 'sig', NOW);
    expect(picked.short).toEqual([]);
    expect(picked.medium).toEqual([]);
    expect(picked.long).toEqual([]);
  });

  it('ne double pas deux lectures sommeil de la même dose', () => {
    const a = card({ kind: 'disc_sleep_volume', horizon: 'medium', weight: 90 });
    const b = card({ kind: 'disc_sleep_assoc', horizon: 'medium', weight: 84 });
    const picked = selectNarrativeColumns([a, b], CAPS, 'sig', NOW);
    expect(picked.medium).toHaveLength(1);
  });

  it('ne publie qu’une carte pour trois formulations de la poussée', () => {
    const kinds = [
      ['disc_push_pull', 'medium', 92],
      ['disc_ratio_structure', 'medium', 88],
      ['push_pull_stimulus', 'long', 84]
    ];
    const cards = kinds.map(([kind, horizon, weight]) =>
      card({
        kind,
        horizon,
        weight,
        id: kind === 'push_pull_stimulus' ? 'relation.push_pull_stimulus' : undefined,
        metrics: { ofMonth: 60 }
      })
    );
    const picked = selectNarrativeColumns(cards, CAPS, 'sig', NOW);
    const shown = [...picked.short, ...picked.medium, ...picked.long];
    expect(shown).toHaveLength(1);
    expect(shown[0].id).toContain('disc_push_pull');
  });

  it('garde une relation et une transformation du même exercice', () => {
    const relation = card({
      kind: 'disc_exercise_base',
      horizon: 'medium',
      weight: 86,
      metrics: { exerciseId: 'tractions', name: 'tractions', ofMonthPct: 30 }
    });
    const transformation = card({
      kind: 'disc_exercise_progress',
      horizon: 'long',
      weight: 84,
      metrics: { exerciseId: 'tractions', name: 'tractions', thenShare: 10, nowShare: 28 }
    });
    const picked = selectNarrativeColumns([relation, transformation], CAPS, 'sig', NOW);
    expect(picked.medium).toHaveLength(1);
    expect(picked.long).toHaveLength(1);
  });

  it('laisse le contexte d’une séance vide en relation, sans troisième reformulation', () => {
    const pending = card({
      kind: 'disc_pending_session',
      horizon: 'short',
      weight: 80
    });
    const context = card({
      kind: 'disc_pending_context',
      horizon: 'medium',
      weight: 76
    });
    const echo = card({
      kind: 'disc_pending_session',
      horizon: 'long',
      weight: 70,
      id: 'relation.reading.long.disc_pending_session'
    });
    const picked = selectNarrativeColumns([pending, context, echo], CAPS, 'sig', NOW);
    expect(picked.short).toHaveLength(1);
    expect(picked.medium).toHaveLength(1);
    expect(picked.long).toEqual([]);
  });

  it('garde le record brut et le record consolidé comme deux sens', () => {
    const pr = card({
      kind: 'disc_ms_pr',
      horizon: 'short',
      weight: 90,
      metrics: { exerciseId: 'tractions', name: 'tractions' }
    });
    const consolidated = card({
      kind: 'disc_ms_pr_consolidated',
      horizon: 'medium',
      weight: 88,
      metrics: { exerciseId: 'tractions', name: 'tractions', consolidated: true }
    });
    const picked = selectNarrativeColumns([pr, consolidated], CAPS, 'sig', NOW);
    expect(picked.short).toHaveLength(1);
    expect(picked.medium).toHaveLength(1);
  });

  it('met le coût du jour en fait et le coût de plusieurs jours en relation', () => {
    const today = card({
      kind: 'span_session_cost',
      horizon: 'short',
      weight: 80,
      metrics: { volPct: 20 }
    });
    const week = card({
      kind: 'span_session_cost',
      horizon: 'medium',
      weight: 80,
      id: 'relation.reading.medium.span_session_cost',
      metrics: { volPct: 61 }
    });
    const picked = selectNarrativeColumns([today, week], CAPS, 'sig', NOW);
    expect(picked.short.map((c) => c.id)).toContain(today.id);
    expect(picked.medium.map((c) => c.id)).toContain(week.id);
  });

  it('laisse le fait de rythme à côté de sa dérive, et n’en garde qu’un exemplaire', () => {
    const fact = card({
      kind: 'disc_sleep_rhythm_habit',
      horizon: 'short',
      weight: 80,
      metrics: { sleepClockBand: 1380 }
    });
    const echo = card({
      kind: 'disc_sleep_rhythm_obs',
      horizon: 'short',
      weight: 70,
      id: 'relation.reading.short.disc_sleep_rhythm_obs',
      metrics: { sleepClockBand: 1380 }
    });
    const drift = card({
      kind: 'disc_sleep_drift',
      horizon: 'long',
      weight: 78,
      metrics: { sleepClockBand: 1380, driftMin: 60 }
    });
    const picked = selectNarrativeColumns([fact, echo, drift], CAPS, 'sig', NOW);
    expect(picked.short.map((c) => c.id)).toEqual([fact.id]);
    expect(picked.long.map((c) => c.id)).toContain(drift.id);
  });
});

describe('garde-fou de richesse du second passage', () => {
  // Même condition que useRecapTabMetrics.js (prevScore > 80 et 72 % de richesse et de longueur).
  function keepPrevious(prevScore, prevLength, nextRichness, nextLength) {
    return prevScore > 80 && nextRichness < prevScore * 0.72 && nextLength < prevLength * 0.72;
  }

  it('conserve la version riche si la suivante tombe sous 72 %', () => {
    expect(keepPrevious(100, 800, 70, 500)).toBe(true);
    expect(keepPrevious(100, 800, 90, 500)).toBe(false);
    expect(keepPrevious(70, 800, 40, 400)).toBe(false);
  });
});
