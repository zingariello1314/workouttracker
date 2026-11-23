import { describe, expect, it } from 'vitest';
import { analysisEditionKey, mayPresentBundleAsCurrent } from '../analysisEdition';
import { finalizePublishedInsight } from '../recapInsightValidate';
import { consolidationMechanism, consolidationProse } from '../exerciseFormatConsolidation';
import { renderInterpretationText } from '../interpretationRenderer';
import { detectStateTransitions } from '../trainingStateTransitions';

describe('édition courante et contrôle éditorial', () => {
  it('refuse de présenter un pack d’une autre édition comme le résultat actuel', () => {
    const current = analysisEditionKey();
    expect(current).toMatch(/editorial=p6-sovereign-v\d+/);
    expect(current).toMatch(/identity=discovery-occurrence-v1/);
    expect(current).toMatch(/program=structural-/);
    expect(current).toMatch(/consolidation=narrative-coherence-v3/);
    expect(current).toMatch(/stimulus=challenge-unknown-v1/);
    expect(current).toMatch(/duration=paired-density-v3/);
    expect(current).toMatch(/review=collective-pass4-v\d+/);
    expect(
      mayPresentBundleAsCurrent(
        { analysisEdition: 'editorial=old', analysisStatus: 'ready' },
        current
      ).present
    ).toBe(false);
    expect(
      mayPresentBundleAsCurrent(
        { analysisStatus: 'ready', recapAssessment: { insightsPublication: { status: 'ready' } } },
        current
      ).reason
    ).toBe('edition_mismatch');
    expect(
      mayPresentBundleAsCurrent({ analysisEdition: current, analysisStatus: 'ready' }, current).as
    ).toBe('current');
  });

  it('ne publie pas un état interne, un fragment technique ni un sujet anonyme', () => {
    expect(
      finalizePublishedInsight({
        title: 'performance : improving → slightly_improving',
        body: 'performance : improving → slightly_improving'
      }).ok
    ).toBe(false);
    expect(
      finalizePublishedInsight({
        title: 'Nouveau palier consolidé sur un exercice clé',
        body: 'Nouveau palier consolidé sur un exercice clé (~5 reps).'
      }).reason
    ).toBe('anonymous_subject');
    const cleaned = finalizePublishedInsight({
      title: 'Volume en hausse',
      body: 'Le volume de la période précédente monte. NET RISE ARC 8 CONTRAT POSITIVE_REPS'
    });
    expect(cleaned.ok).toBe(true);
    expect(cleaned.card.body).not.toMatch(/NET RISE|ARC|POSITIVE_REPS/);
  });

  it('ne fabrique pas un titre en recopiant le début du corps', () => {
    const gated = finalizePublishedInsight({
      title: '',
      body: 'Le volume comparé à la période précédente est en hausse de 23 %. Les répétitions suivent.'
    });
    expect(gated.ok).toBe(false);
    expect(gated.reason).toBe('missing_title');
  });

  it('distingue un niveau plus haut, un recul stabilisé et une reprise incomplète', () => {
    expect(consolidationMechanism({ beforeMed: 24, level: 36, state: 'consolidation' })).toBe(
      'higher_level_consolidation'
    );
    expect(consolidationMechanism({ beforeMed: 54, level: 40, state: 'consolidation' })).toBe(
      'stabilized_after_drop'
    );
    expect(
      consolidationMechanism({ beforeMed: 50, level: 36, state: 'resumed_level', gap: { days: 28 } })
    ).toBe('partial_resume');
    const drop = consolidationProse({
      publish: true,
      exerciseName: 'Pompes déclinées',
      level: 36,
      beforeMed: 50,
      supportCount: 8,
      claimEvidenceDates: ['2026-11-13'],
      period: '30d',
      state: 'consolidation',
      mechanism: 'stabilized_after_drop'
    });
    expect(drop).toMatch(/pas une progression/);
    expect(drop).toMatch(/ne suffit pas à dire que le niveau s’est construit/);
    expect(drop).not.toMatch(/s'est installé/);
  });

  it('nomme le référent du volume au lieu d’un fragment de template', () => {
    const text = renderInterpretationText({
      type: 'adaptation_success',
      metrics: { volumeDeltaPct: 23, performanceMomentumPct: 4 }
    });
    expect(text).toMatch(/période précédente/);
    expect(text).not.toMatch(/adaptation réussie/);
    expect(text).not.toMatch(/objectif/);
  });

  it('traduit une transition connue et se tait sur un état inconnu', () => {
    const known = detectStateTransitions(
      { performance: { value: 'improving', trend: 'stable', confidence: 0.8 } },
      { performance: { value: 'slightly_improving', trend: 'stable', confidence: 0.8 } }
    );
    expect(known[0].narrative).toMatch(/progression nette/);
    expect(known[0].narrative).not.toMatch(/slightly_improving/);
    const unknown = detectStateTransitions(
      { performance: { value: 'custom_a', trend: 'stable', confidence: 0.8 } },
      { performance: { value: 'custom_b', trend: 'stable', confidence: 0.8 } }
    );
    expect(unknown).toHaveLength(0);
  });
});
