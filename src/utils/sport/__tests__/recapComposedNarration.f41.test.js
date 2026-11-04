import { describe, it, expect } from 'vitest';
import {
  titleFromComposedEvidence,
  resolveVolumeDirection,
  narrateFromComposedEvidence,
  assertNarrationConsistency,
  formatFrNumber,
  isPluralExerciseLabel
} from '../recapComposedNarration';
import { fixKnownGrammarInProse } from '../recapEditorialPolish';

function baseComposed(over = {}) {
  return {
    ok: true,
    composed: true,
    factCount: 3,
    primaryPhenomenon: {
      name: 'Dips',
      exerciseId: 103,
      primaryStory: 'net_decline',
      earlyMean: 40,
      lateMean: 48,
      deltaPct: 20,
      ...(over.primaryPhenomenon || {})
    },
    windows: { primary: { start: '2026-05-01', end: '2026-10-30' }, historical: null },
    observations: [],
    decomposition: { kind: 'stable_format', before: { setCount: 4, perSet: 12 }, after: { setCount: 4, perSet: 12 } },
    continuity: { kind: 'directional_change', stance: 'probable' },
    volumeAttribution: null,
    comparators: { verdict: 'shared', items: [], detail: 'plusieurs baissent' },
    lexicon: { maySayPerformance: false },
    levels: { observed: null, interpreted: null, implication: null },
    proof: { positions: [], limits: [] },
    caveats: [],
    forbiddenConclusions: ['adaptation_physiologique'],
    ...over
  };
}

describe('F4.1 cohérence titre ↔ direction', () => {
  it('refuse un titre de recul quand les moyennes montent (cas Dips)', () => {
    const c = baseComposed();
    const dir = resolveVolumeDirection(c);
    expect(dir.direction).toBe('up');
    const title = titleFromComposedEvidence(c, { name: 'Dips' });
    expect(title).not.toMatch(/recul/i);
    expect(title).toMatch(/hausse|davantage|en hausse/i);
    const narrated = narrateFromComposedEvidence(c, {});
    expect(narrated.usedComposedNarration).toBe(true);
    expect(narrated.title).not.toMatch(/recul/i);
    expect(narrated.body).toMatch(/48|20/);
    const check = assertNarrationConsistency({
      title: narrated.title,
      body: narrated.body,
      composed: c
    });
    expect(check.issues).not.toContain('title_down_vs_values_up');
  });

  it('refuse un titre de hausse quand les moyennes baissent', () => {
    const c = baseComposed({
      primaryPhenomenon: {
        name: 'Pompes déclinées',
        primaryStory: 'net_rise',
        earlyMean: 60,
        lateMean: 40,
        deltaPct: -33.3
      }
    });
    const title = titleFromComposedEvidence(c, { name: 'Pompes déclinées' });
    expect(title).not.toMatch(/hausse|davantage/i);
    expect(title).toMatch(/moins|recul/i);
  });
});

describe('F4.1 attribution fréquence démontrée', () => {
  it('exige les comptes de séances dans le corps', () => {
    const c = baseComposed({
      primaryPhenomenon: {
        name: 'Relevés de genoux à la barre',
        primaryStory: 'plateau',
        earlyMean: 60,
        lateMean: 60,
        deltaPct: 0
      },
      continuity: { kind: 'stable_plateau' },
      volumeAttribution: {
        kind: 'frequency_driven_total_rise',
        stance: 'probable',
        detail: 'plus souvent',
        metrics: {
          prevSessionCount: 1,
          windowSessionCount: 3,
          perSessionPct: 0,
          sessionDelta: 2,
          prevMeanPerSession: 30,
          meanPerSession: 31
        }
      },
      decomposition: {
        kind: 'stable_format',
        before: { setCount: 3, perSet: 20 },
        after: { setCount: 3, perSet: 20 }
      }
    });
    const narrated = narrateFromComposedEvidence(c, {});
    expect(narrated.title).toMatch(/plus souvent/i);
    expect(narrated.body).toMatch(/1.*3.*séances|de 1 à 3 séances/i);
    const check = assertNarrationConsistency({
      title: narrated.title,
      body: narrated.body,
      composed: c
    });
    expect(check.issues).not.toContain('frequency_title_without_frequency_in_body');
  });

  it('ne mélange pas early/late d’arc avec « volume par séance reste proche »', () => {
    const c = baseComposed({
      primaryPhenomenon: {
        name: 'Dips',
        primaryStory: 'net_rise',
        earlyMean: 20,
        lateMean: 48,
        deltaPct: 140
      },
      continuity: { kind: 'directional_change' },
      volumeAttribution: {
        kind: 'frequency_driven_total_rise',
        stance: 'probable',
        detail: 'plus souvent',
        metrics: {
          prevSessionCount: 4,
          windowSessionCount: 7,
          perSessionPct: 3,
          sessionDelta: 3,
          prevMeanPerSession: 31,
          meanPerSession: 30,
          referent: 'window_vs_previous_window'
        }
      }
    });
    const narrated = narrateFromComposedEvidence(c, {});
    expect(narrated.body).toMatch(/4.*7.*séances|de 4 à 7/i);
    expect(narrated.body).toMatch(/reste proche|fenêtres comparées/i);
    // Pas de swing 20→48 présenté comme la même moyenne « par séance » sans label d’arc
    expect(narrated.body).not.toMatch(/passe d’environ 20 à 48 répétitions par séance(?!.*arc)/i);
    const check = assertNarrationConsistency({
      title: narrated.title,
      body: narrated.body,
      composed: c
    });
    expect(check.hardIssues || []).not.toContain('per_session_stable_vs_arc_swing');
    expect(check.ok).toBe(true);
  });

  it('détecte la contradiction hard si un texte mélange les référentiels', () => {
    const check = assertNarrationConsistency({
      title: 'Dips',
      body:
        'Le volume moyen passe d’environ 20 à 48 répétitions par séance, soit une hausse de 140 %. Tu es passé de 4 à 7 séances, alors que le volume par séance reste proche.',
      composed: baseComposed({
        volumeAttribution: {
          kind: 'frequency_driven_total_rise',
          metrics: { prevSessionCount: 4, windowSessionCount: 7, perSessionPct: 3 }
        }
      })
    });
    expect(check.hardIssues).toContain('per_session_stable_vs_arc_swing');
    expect(check.ok).toBe(false);
  });

  it('n’annonce pas l’attribution sans métriques de séances', () => {
    const c = baseComposed({
      volumeAttribution: {
        kind: 'frequency_driven_total_rise',
        detail: 'plus souvent',
        metrics: {}
      },
      primaryPhenomenon: {
        name: 'X',
        primaryStory: 'plateau',
        earlyMean: 40,
        lateMean: 40,
        deltaPct: 0
      }
    });
    const title = titleFromComposedEvidence(c, { name: 'X' });
    expect(title || '').not.toMatch(/plus souvent/i);
  });
});

describe('F4.1 moyennes vs format', () => {
  it('clarifie moyenne en hausse + format stable', () => {
    const c = baseComposed({
      primaryPhenomenon: {
        name: 'un mouvement',
        exerciseId: null,
        primaryStory: 'net_rise',
        earlyMean: 34,
        lateMean: 45,
        deltaPct: 32.4
      },
      comparators: { verdict: 'insufficient' },
      continuity: { kind: 'directional_change' },
      decomposition: {
        kind: 'stable_format',
        before: { setCount: 3, perSet: 15 },
        after: { setCount: 3, perSet: 15 }
      }
    });
    const narrated = narrateFromComposedEvidence(c, {});
    expect(narrated.body).toMatch(/volume moyen|moyenne|format reste identique/i);
    expect(narrated.body).not.toMatch(/comme 3\s*×\s*15/i);
  });
});

describe('F4.1 français', () => {
  it('décimales françaises', () => {
    expect(formatFrNumber(53.3)).toBe('53,3');
    expect(fixKnownGrammarInProse('d’environ 53.3 à 40 répétitions')).toMatch(/53,3/);
  });

  it('pluriel revient → reviennent', () => {
    expect(isPluralExerciseLabel('Pompes déclinées')).toBe(true);
    expect(fixKnownGrammarInProse('Pompes déclinées revient après')).toMatch(/reviennent/);
  });

  it('pas de jargon développeur', () => {
    const c = baseComposed({
      windows: {
        primary: { start: '2026-10-01', end: '2026-10-30' },
        historical: { role: 'historicalContextWindow', contextBefore: 3 }
      },
      primaryPhenomenon: {
        name: 'Pompes déclinées',
        primaryStory: 'net_decline',
        earlyMean: 53,
        lateMean: 40,
        deltaPct: -25
      },
      comparators: { verdict: 'mixed' }
    });
    const narrated = narrateFromComposedEvidence(c, {});
    expect(narrated.body || '').not.toMatch(/primaryWindow|historicalContext|composedEvidence/i);
    expect(narrated.body || '').not.toMatch(/remplacer la période sélectionnée/i);
  });
});

describe('F4.1 préservation creux F3', () => {
  it('conserve un constat principal avec creux daté', () => {
    const c = baseComposed({
      primaryPhenomenon: {
        name: 'Pompes déclinées',
        primaryStory: 'recovered',
        earlyMean: 27.3,
        lateMean: 25.3,
        deltaPct: -7
      },
      continuity: { kind: 'decline_then_recovery' },
      levels: {
        observed: {
          stance: 'probable',
          text: 'Sur les 8 dernières séances, Pompes déclinées est passé par un creux (≈10 le 1 octobre 2026) puis la dernière séance est revenue à ≈36 répétitions.'
        },
        interpreted: null,
        implication: null
      },
      decomposition: { kind: 'stable_format', before: { setCount: 3, perSet: 12 }, after: { setCount: 3, perSet: 12 } },
      comparators: { verdict: 'insufficient' }
    });
    const narrated = narrateFromComposedEvidence(c, {});
    expect(narrated.body).toMatch(/creux|1 octobre 2026|36/i);
  });
});
