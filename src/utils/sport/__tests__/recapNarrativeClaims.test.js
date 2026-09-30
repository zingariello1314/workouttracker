import { describe, expect, it } from 'vitest';
import { claimFromCandidate, stateKeyFromMetrics } from '../recapNarrativeClaims';

function candidate(kind, metrics = {}, extra = {}) {
  const horizon = extra.horizon || 'short';
  return {
    id: extra.id || `relation.reading.${horizon}.${kind}`,
    horizon,
    nature: extra.nature,
    interpretation: {
      context: { kind, metrics },
      metrics
    }
  };
}

describe('claimFromCandidate', () => {
  it('sépare le dos en fait, relation et transformation', () => {
    const fact = claimFromCandidate(
      candidate('disc_muscle_now', { group: 'back', sharePct: 46 }, { horizon: 'short' })
    );
    const relation = claimFromCandidate(
      candidate('disc_muscle_reorient', { leadGroup: 'back', ofMonthPct: 80 }, { horizon: 'medium' })
    );
    const transformation = claimFromCandidate(
      candidate(
        'disc_anchor',
        { family: 'dos', thenShare: 10, nowShare: 40 },
        { horizon: 'long' }
      )
    );
    expect(fact.topic).toBe('mix.dos');
    expect(relation.topic).toBe('mix.dos');
    expect(transformation.topic).toBe('mix.dos');
    expect(fact.sense).toBe('fact');
    expect(relation.sense).toBe('relation');
    expect(transformation.sense).toBe('transformation');
  });

  it('reconnaît la même idée poussée entre une découverte et une relation', () => {
    const discovery = claimFromCandidate(
      candidate('disc_push_pull', { ofMonth: 40 }, { horizon: 'medium' })
    );
    const relation = claimFromCandidate({
      id: 'relation.push_pull_stimulus',
      horizon: 'medium',
      interpretation: { metrics: { ofMonth: 40 } }
    });
    expect(discovery.topic).toBe('mix.poussee');
    expect(relation.topic).toBe(discovery.topic);
    expect(relation.sense).toBe(discovery.sense);
    expect(discovery.sense).toBe('relation');
  });

  it('donne le même sujet à une variante nouvelle et à une émergence, avec deux sens', () => {
    const born = claimFromCandidate(
      candidate('span_new_variant', { exerciseId: 'pompes-inclinees' }, { horizon: 'short' })
    );
    const emerged = claimFromCandidate(
      candidate('disc_emergence', { exerciseId: 'pompes-inclinees' }, { horizon: 'medium' })
    );
    expect(born.topic).toBe('exercice.pompes-inclinees');
    expect(emerged.topic).toBe(born.topic);
    expect(born.sense).toBe('fact');
    expect(emerged.sense).toBe('relation');
  });

  it('range 42 % et 43 % dans la même bande, 58 % dans une autre', () => {
    const low = stateKeyFromMetrics('mix.dos', { sharePct: 42 });
    const near = stateKeyFromMetrics('mix.dos', { sharePct: 43 });
    const moved = stateKeyFromMetrics('mix.dos', { sharePct: 58 });
    expect(low).toBe(near);
    expect(low).not.toBe(moved);
  });

  it('laisse present quand aucune mesure ne permet un état', () => {
    const claim = claimFromCandidate(candidate('disc_volume_shape', {}));
    expect(claim.topic).toBe('volume.forme');
    expect(claim.stateKey).toBe('present');
    expect(claim.sense).toBe('fact');
  });

  it('traite un ratio sans comparaison comme un fait, pas comme une relation', () => {
    const bare = claimFromCandidate(
      candidate('disc_ratio_structure', { pullNow: 20, pushNow: 80 }, { horizon: 'medium' })
    );
    expect(bare.topic).toBe('mix.poussee');
    expect(bare.sense).toBe('fact');
  });
});
